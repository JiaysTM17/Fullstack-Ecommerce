/**
 * Multi-Warehouse Fulfillment Dispatcher (Điều Phối Xuất Kho Đa Điểm Tối Ưu Chi Phí)
 * 
 * Vấn đề:
 * Trong chuỗi cung ứng TMĐT quy mô lớn (Shopee Fulfillment by Shopee - FBS):
 * - Hệ thống có nhiều trung tâm hoàn tất đơn hàng (Fulfillment Centers - Hub):
 *   + Kho Hà Nội (Miền Bắc)
 *   + Kho Đà Nẵng (Miền Trung)
 *   + Kho TP.HCM (Miền Nam)
 *   + Kho Cần Thơ (Miền Tây)
 * - Khi khách đặt giỏ hàng gồm nhiều món hàng (hoặc số lượng lớn), việc chọn kho xuất hàng gặp thách thức:
 *   1. Kho gần nhất có thể thiếu một vài món hàng (Partial Stock).
 *   2. Tách thành quá nhiều gói hàng nhỏ từ nhiều kho sẽ đội chi phí đóng gói (Packing Cost) và cước vận chuyển (Shipping Freight).
 *   3. Gửi từ kho quá xa làm tăng chi phí vận chuyển chặng dài và thời gian giao hàng.
 * 
 * Giải pháp: Thuật toán Tối ưu hóa phân bổ xuất kho (Min-Cost Assignment Heuristic)
 * 1. Mô hình chi phí tổng thể (Total Fulfillment Cost):
 *    Cost = sum(Package_Cost) + sum(Shipping_Distance_Cost)
 *    với Shipping_Distance_Cost = BaseFee + (RatePerKm * HaversineDistance(Warehouse, Buyer))
 * 2. Ưu tiên giải pháp gom gói (Consolidated Shipment):
 *    Tìm kho duy nhất có đủ 100% các mặt hàng và có chi phí vận chuyển thấp nhất.
 * 3. Nếu không có kho nào đủ toàn bộ đơn hàng:
 *    Thuật toán phân rã tập hợp (Set Cover & Greedy Assignment) chọn tổ hợp kho có chi phí biên (Marginal Cost) thấp nhất.
 */

import { calculateHaversineDistance } from "./tspRouteOptimizer.js";

export class MultiWarehouseDispatcher {
  /**
   * @param {Array<{ id: string, name: string, location: { lat: number, lng: number }, inventory: Map<string, number> | object }>} warehouses
   * @param {object} options
   */
  constructor(warehouses = [], { basePackageFee = 15000, ratePerKm = 30 } = {}) {
    this.warehouses = new Map();
    this.basePackageFee = basePackageFee;
    this.ratePerKm = ratePerKm;

    for (const wh of warehouses) {
      this.addWarehouse(wh);
    }
  }

  /**
   * Thêm hoặc cập nhật thông tin kho hàng
   */
  addWarehouse({ id, name, location, inventory = {} }) {
    if (!id || !location) {
      throw new Error("Warehouse must have an id and GPS location");
    }

    const invMap = inventory instanceof Map ? inventory : new Map(Object.entries(inventory));

    this.warehouses.set(id, {
      id,
      name: name || id,
      location: {
        lat: Number(location.lat),
        lng: Number(location.lng)
      },
      inventory: invMap
    });
  }

  /**
   * Cập nhật số lượng tồn kho của một SKU tại một kho
   */
  setStock(warehouseId, skuId, quantity) {
    const wh = this.warehouses.get(warehouseId);
    if (!wh) throw new Error(`Warehouse ${warehouseId} not found`);
    wh.inventory.set(skuId, Math.max(0, Number(quantity)));
  }

  /**
   * Lấy số lượng tồn kho của một SKU tại một kho
   */
  getStock(warehouseId, skuId) {
    const wh = this.warehouses.get(warehouseId);
    if (!wh) return 0;
    return wh.inventory.get(skuId) || 0;
  }

  /**
   * Tính toán chi phí giao vận ước tính từ kho đến địa chỉ người nhận
   */
  calculateShippingCost(warehouse, buyerLocation) {
    const distanceKm = calculateHaversineDistance(
      warehouse.location,
      buyerLocation
    );

    const shippingFee = Math.round(this.basePackageFee + (distanceKm * this.ratePerKm));
    return {
      distanceKm: Number(distanceKm.toFixed(1)),
      shippingFee
    };
  }

  /**
   * Điều phối xuất kho tối ưu cho một đơn hàng
   * @param {Array<{ skuId: string, quantity: number, name?: string, price?: number }>} orderItems
   * @param {{ lat: number, lng: number }} buyerLocation
   */
  optimizeDispatch(orderItems = [], buyerLocation) {
    if (!Array.isArray(orderItems) || orderItems.length === 0 || !buyerLocation) {
      return {
        success: false,
        reason: "INVALID_DISPATCH_INPUT",
        packages: [],
        totalCost: 0
      };
    }

    // 1. Kiểm tra xem có kho nào có đủ 100% tất cả các mặt hàng không (Single Warehouse Fulfillment)
    const fullyCapableWarehouses = [];

    for (const wh of this.warehouses.values()) {
      let canFulfillAll = true;
      for (const item of orderItems) {
        const available = wh.inventory.get(item.skuId) || 0;
        if (available < item.quantity) {
          canFulfillAll = false;
          break;
        }
      }

      if (canFulfillAll) {
        const { distanceKm, shippingFee } = this.calculateShippingCost(wh, buyerLocation);
        fullyCapableWarehouses.push({
          warehouse: wh,
          distanceKm,
          shippingFee
        });
      }
    }

    // Nếu tìm thấy ít nhất 1 kho đủ toàn bộ hàng, chọn kho có chi phí vận chuyển thấp nhất
    if (fullyCapableWarehouses.length > 0) {
      fullyCapableWarehouses.sort((a, b) => a.shippingFee - b.shippingFee);
      const chosen = fullyCapableWarehouses[0];

      return {
        success: true,
        strategy: "SINGLE_WAREHOUSE_CONSOLIDATED",
        splitCount: 1,
        totalCost: chosen.shippingFee,
        packages: [
          {
            packageId: `PKG_${chosen.warehouse.id}_1`,
            warehouseId: chosen.warehouse.id,
            warehouseName: chosen.warehouse.name,
            items: orderItems.map(i => ({ skuId: i.skuId, quantity: i.quantity, name: i.name })),
            distanceKm: chosen.distanceKm,
            shippingFee: chosen.shippingFee
          }
        ]
      };
    }

    // 2. Không có kho nào đủ 100% hàng -> Áp dụng thuật toán chia gói tham lam (Greedy Multi-Warehouse Split)
    const needed = new Map();
    for (const item of orderItems) {
      needed.set(item.skuId, item.quantity);
    }

    const packages = [];
    let totalCost = 0;

    // Sắp xếp các kho theo thứ tự khoảng cách gần người nhận nhất
    const sortedWarehouses = Array.from(this.warehouses.values()).map(wh => {
      const { distanceKm, shippingFee } = this.calculateShippingCost(wh, buyerLocation);
      return { warehouse: wh, distanceKm, shippingFee };
    }).sort((a, b) => a.shippingFee - b.shippingFee);

    for (const { warehouse, distanceKm, shippingFee } of sortedWarehouses) {
      const itemsToFulfillHere = [];

      for (const [skuId, requiredQty] of needed.entries()) {
        if (requiredQty <= 0) continue;

        const available = warehouse.inventory.get(skuId) || 0;
        if (available > 0) {
          const allocateQty = Math.min(requiredQty, available);
          itemsToFulfillHere.push({
            skuId,
            quantity: allocateQty
          });
          needed.set(skuId, requiredQty - allocateQty);
        }
      }

      if (itemsToFulfillHere.length > 0) {
        packages.push({
          packageId: `PKG_${warehouse.id}_${packages.length + 1}`,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          items: itemsToFulfillHere,
          distanceKm,
          shippingFee
        });
        totalCost += shippingFee;
      }

      // Kiểm tra xem đã đủ toàn bộ hàng chưa
      const remainingUnfulfilled = Array.from(needed.values()).some(qty => qty > 0);
      if (!remainingUnfulfilled) break;
    }

    const unfulfilledItems = Array.from(needed.entries())
      .filter(([_, qty]) => qty > 0)
      .map(([skuId, qty]) => ({ skuId, missingQuantity: qty }));

    if (unfulfilledItems.length > 0) {
      return {
        success: false,
        strategy: "INSUFFICIENT_STOCK",
        unfulfilledItems,
        packages,
        totalCost
      };
    }

    return {
      success: true,
      strategy: "MULTI_WAREHOUSE_SPLIT",
      splitCount: packages.length,
      totalCost,
      packages
    };
  }
}
