/**
 * Hopcroft-Karp Maximum Bipartite Matching for Multi-Courier Order Batching
 * Thuật Toán Ghép Cặp Cực Đại Đồ Thị 2 Phía Hopcroft-Karp O(E * sqrt(V)) (1973)
 * 
 * Ứng dụng TMĐT:
 * - Tối ưu hóa phân bổ đồng thời hàng nghìn đơn giao hỏa tốc 2H cho các bưu tá shipper gần nhất.
 * - Giải bài toán cực đại hóa số lượng đơn hàng được giao trong từng khung giờ cao điểm (Peak Hours).
 * - Hỗ trợ sức chứa (Capacity): Mỗi shipper có thể nhận tối đa K đơn đồng thời trong bán kính hoạt động.
 */

export class BipartiteCourierBatcher {
  constructor() {
    this.orders = new Map();     // orderId -> metadata { weightKg, lat, lon, timeLimit }
    this.couriers = new Map();   // courierId -> metadata { capacity, lat, lon, maxDistanceKm }
    this.orderAdj = new Map();   // orderId -> Array of courierSlotIds
    this.courierSlots = [];      // Danh sách các slot bưu tá (courierId_slotIdx)
    this.slotToCourier = new Map(); // slotId -> courierId
  }

  /**
   * Thêm một đơn hàng cần giao
   * @param {string} orderId
   * @param {Object} [meta]
   */
  addOrder(orderId, meta = {}) {
    this.orders.set(String(orderId), {
      id: String(orderId),
      weightKg: meta.weightKg || 1,
      lat: meta.lat ?? 21.0285,
      lon: meta.lon ?? 105.8542,
      ...meta
    });
    if (!this.orderAdj.has(String(orderId))) {
      this.orderAdj.set(String(orderId), []);
    }
  }

  /**
   * Thêm một shipper với sức chứa tối đa capacity
   * @param {string} courierId
   * @param {Object} [meta]
   */
  addCourier(courierId, meta = {}) {
    const cap = Math.max(1, meta.capacity || 1);
    const id = String(courierId);
    this.couriers.set(id, {
      id,
      capacity: cap,
      lat: meta.lat ?? 21.0285,
      lon: meta.lon ?? 105.8542,
      maxDistanceKm: meta.maxDistanceKm || 15,
      ...meta
    });

    // Tạo các slot phục vụ đơn hàng cho courier
    for (let i = 0; i < cap; i++) {
      const slotId = `${id}#slot${i}`;
      this.courierSlots.push(slotId);
      this.slotToCourier.set(slotId, id);
    }
  }

  /**
   * Thêm cạnh nối khả thi giữa đơn hàng và shipper
   * @param {string} orderId
   * @param {string} courierId
   */
  addEligibility(orderId, courierId) {
    const oId = String(orderId);
    const cId = String(courierId);
    if (!this.orders.has(oId) || !this.couriers.has(cId)) return;

    const courier = this.couriers.get(cId);
    for (let i = 0; i < courier.capacity; i++) {
      const slotId = `${cId}#slot${i}`;
      const list = this.orderAdj.get(oId);
      if (!list.includes(slotId)) {
        list.push(slotId);
      }
    }
  }

  /**
   * Tự động sinh cạnh khả thi dựa trên bán kính khoảng cách GPS (Haversine)
   * @param {number} [defaultMaxKm=10]
   */
  autoConnectByDistance(defaultMaxKm = 10) {
    const toRad = deg => (deg * Math.PI) / 180;
    const calcKm = (lat1, lon1, lat2, lon2) => {
      const R = 6371;
      const dLat = toRad(lat2 - lat1);
      const dLon = toRad(lon2 - lon1);
      const a = Math.sin(dLat / 2) ** 2 +
                Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    for (const [oId, oMeta] of this.orders) {
      for (const [cId, cMeta] of this.couriers) {
        const dist = calcKm(oMeta.lat, oMeta.lon, cMeta.lat, cMeta.lon);
        const limit = cMeta.maxDistanceKm || defaultMaxKm;
        if (dist <= limit) {
          this.addEligibility(oId, cId);
        }
      }
    }
  }

  /**
   * Giải thuật Hopcroft-Karp tìm ghép cặp cực đại
   * @returns {Object} { totalMatched, matchedOrders, unassignedOrders, courierAssignments }
   */
  computeMatching() {
    const NIL = "NIL";
    const INF = Infinity;

    // pairU: orderId -> slotId
    const pairU = new Map();
    // pairV: slotId -> orderId
    const pairV = new Map();
    // dist: orderId -> number
    const dist = new Map();

    const orderKeys = Array.from(this.orders.keys());

    for (const u of orderKeys) {
      pairU.set(u, NIL);
    }
    for (const v of this.courierSlots) {
      pairV.set(v, NIL);
    }

    const bfs = () => {
      const queue = [];
      for (const u of orderKeys) {
        if (pairU.get(u) === NIL) {
          dist.set(u, 0);
          queue.push(u);
        } else {
          dist.set(u, INF);
        }
      }
      dist.set(NIL, INF);

      while (queue.length > 0) {
        const u = queue.shift();
        if (dist.get(u) < dist.get(NIL)) {
          const adj = this.orderAdj.get(u) || [];
          for (const v of adj) {
            const pairedOrder = pairV.get(v);
            if (dist.get(pairedOrder) === INF) {
              dist.set(pairedOrder, dist.get(u) + 1);
              queue.push(pairedOrder);
            }
          }
        }
      }

      return dist.get(NIL) !== INF;
    };

    const dfs = (u) => {
      if (u !== NIL) {
        const adj = this.orderAdj.get(u) || [];
        for (const v of adj) {
          const pairedOrder = pairV.get(v);
          if (dist.get(pairedOrder) === dist.get(u) + 1) {
            if (dfs(pairedOrder)) {
              pairV.set(v, u);
              pairU.set(u, v);
              return true;
            }
          }
        }
        dist.set(u, INF);
        return false;
      }
      return true;
    };

    let matching = 0;
    while (bfs()) {
      for (const u of orderKeys) {
        if (pairU.get(u) === NIL && dfs(u)) {
          matching++;
        }
      }
    }

    // Tổng hợp kết quả
    const matchedOrders = [];
    const unassignedOrders = [];
    const courierAssignments = new Map(); // courierId -> Array<orderId>

    for (const cId of this.couriers.keys()) {
      courierAssignments.set(cId, []);
    }

    for (const [u, v] of pairU) {
      if (v !== NIL) {
        const cId = this.slotToCourier.get(v);
        matchedOrders.push({
          orderId: u,
          courierId: cId,
          slotId: v
        });
        courierAssignments.get(cId).push(u);
      } else {
        unassignedOrders.push(u);
      }
    }

    return {
      totalMatched: matching,
      totalOrders: this.orders.size,
      totalCouriers: this.couriers.size,
      totalCourierCapacity: this.courierSlots.length,
      fillRatePercent: this.orders.size > 0 ? Number(((matching / this.orders.size) * 100).toFixed(2)) : 0,
      matchedOrders,
      unassignedOrders,
      courierAssignments: Object.fromEntries(courierAssignments)
    };
  }

  /**
   * Reset trạng thái ghép cặp
   */
  clear() {
    this.orders.clear();
    this.couriers.clear();
    this.orderAdj.clear();
    this.courierSlots = [];
    this.slotToCourier.clear();
  }
}

export default BipartiteCourierBatcher;
