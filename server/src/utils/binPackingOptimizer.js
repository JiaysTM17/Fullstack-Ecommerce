/**
 * 2D/3D Maximal Rectangles Bin Packing & SPX Volumetric Packaging Optimizer
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 11 - Feature 158)
 * 
 * Vấn đề:
 * Trong chuỗi cung ứng TMĐT và hoàn tất đơn hàng kho (Order Fulfillment):
 * 1. Đơn hàng gồm nhiều món hàng có kích thước (Dài x Rộng x Cao) khác nhau.
 * 2. Đóng gói thủ công bằng thùng carton quá to dẫn đến thể tích cồng kềnh bị tính cước vận chuyển quy đổi:
 *    $$V = \frac{\text{Dài} \times \text{Rộng} \times \text{Cao}}{5000} \text{ (kg)}$$
 *    Chi phí vận chuyển tính theo: $\max(\text{Khối lượng thực}, V)$.
 * 3. Lãng phí vật liệu đóng gói (xốp bọc nổ, băng keo) và chiếm dụng diện tích xe tải SPX.
 * 
 * Giải pháp Thuật Toán Maximal Rectangles Bin Packing (BFA / BSSF Heuristic):
 * 1. Quản lý danh sách các hình chữ nhật trống cực đại (Maximal Free Rectangles) trong thùng.
 * 2. Chiến lược Best-Fit Area (BFA): Chọn khoảng trống có diện tích dư thừa nhỏ nhất để đặt kiện hàng.
 * 3. Cắt Guillotine (Guillotine Split): Chia vùng trống còn lại theo 2 trục trực giao (ngang và dọc)
 *    và loại bỏ các hình chữ nhật con bị bao hàm (Containment Pruning).
 * 4. Tự động đề xuất kích cỡ hộp carton tiêu chuẩn SPX (Box XS, S, M, L, XL) tối ưu nhất,
 *    đạt mật độ đóng gói cao nhất (Packing Density >= 75%) và tiết kiệm chi phí quy đổi thể tích.
 */

/**
 * Danh mục hộp carton tiêu chuẩn SPX Express Việt Nam
 */
export const SPX_STANDARD_BOXES = [
  { id: "BOX_XS", name: "Hộp XS (Phụ kiện, son, củ sạc)", width: 15, length: 10, height: 10, maxWeightKg: 1.0, boxCostVnd: 2000 },
  { id: "BOX_S",  name: "Hộp S (Áo thun, mỹ phẩm, điện thoại)", width: 20, length: 15, height: 10, maxWeightKg: 3.0, boxCostVnd: 3500 },
  { id: "BOX_M",  name: "Hộp M (Giày dép, nồi cơm, áo khoác)", width: 30, length: 20, height: 15, maxWeightKg: 5.0, boxCostVnd: 5000 },
  { id: "BOX_L",  name: "Hộp L (Đồ gia dụng, máy hút bụi, balo)", width: 40, length: 30, height: 20, maxWeightKg: 10.0, boxCostVnd: 8000 },
  { id: "BOX_XL", name: "Hộp XL (Đại tiện tích, màn hình, quạt đứng)", width: 60, length: 40, height: 30, maxWeightKg: 20.0, boxCostVnd: 15000 },
];

/**
 * Tính trọng lượng quy đổi thể tích theo chuẩn IATA / TMĐT (Dài x Rộng x Cao / 5000)
 */
export function calculateVolumetricWeight(widthCm, lengthCm, heightCm) {
  const vol = (Number(widthCm) || 0) * (Number(lengthCm) || 0) * (Number(heightCm) || 0);
  return Number((vol / 5000).toFixed(2));
}

/**
 * Trình giải thuật toán đóng thùng Maximal Rectangles 2D
 */
export class MaximalRectanglesPacker {
  constructor(binWidth, binLength) {
    this.binWidth = binWidth;
    this.binLength = binLength;
    this.usedRectangles = [];
    // Khởi tạo vùng trống ban đầu là toàn bộ đáy thùng
    this.freeRectangles = [{ x: 0, y: 0, width: binWidth, length: binLength }];
  }

  /**
   * Đặt một kiện hàng vào thùng
   * @param {Object} item { id, width, length, allowRotation }
   * @returns {Object|null} Vị trí đặt hoặc null nếu không vừa
   */
  insert(item) {
    const w = Number(item.width) || 0;
    const l = Number(item.length ?? item.height) || 0;
    const allowRotation = item.allowRotation !== false;

    let bestRect = null;
    let bestAreaFit = Infinity;
    let bestRotated = false;

    // 1. Duyệt qua tất cả các vùng trống để tìm vị trí Best-Area Fit
    for (const free of this.freeRectangles) {
      // Thử hướng nguyên bản
      if (free.width >= w && free.length >= l) {
        const leftoverArea = free.width * free.length - w * l;
        if (leftoverArea < bestAreaFit) {
          bestAreaFit = leftoverArea;
          bestRect = free;
          bestRotated = false;
        }
      }

      // Thử xoay 90 độ nếu được phép
      if (allowRotation && free.width >= l && free.length >= w) {
        const leftoverArea = free.width * free.length - l * w;
        if (leftoverArea < bestAreaFit) {
          bestAreaFit = leftoverArea;
          bestRect = free;
          bestRotated = true;
        }
      }
    }

    if (!bestRect) {
      return null; // Không vừa
    }

    const placedW = bestRotated ? l : w;
    const placedL = bestRotated ? w : l;
    const placement = {
      id: item.id,
      name: item.name || item.id,
      x: bestRect.x,
      y: bestRect.y,
      width: placedW,
      length: placedL,
      rotated: bestRotated,
    };

    // 2. Chia cắt các vùng trống bị giao cắt bởi kiện hàng vừa đặt (Guillotine Split)
    this._splitFreeRectangles(placement);

    // 3. Loại trừ các hình chữ nhật con bị bao hàm hoàn toàn (Prune Redundant)
    this._pruneFreeRectangles();

    this.usedRectangles.push(placement);
    return placement;
  }

  _splitFreeRectangles(placed) {
    const newFree = [];

    for (const free of this.freeRectangles) {
      // Kiểm tra có giao nhau không
      const overlaps =
        placed.x < free.x + free.width &&
        placed.x + placed.width > free.x &&
        placed.y < free.y + free.length &&
        placed.y + placed.length > free.y;

      if (!overlaps) {
        newFree.push(free);
        continue;
      }

      // Cắt thành tối đa 4 hình chữ nhật con xung quanh placed
      // 1. Nhánh trên
      if (placed.y > free.y && placed.y < free.y + free.length) {
        newFree.push({
          x: free.x,
          y: free.y,
          width: free.width,
          length: placed.y - free.y,
        });
      }
      // 2. Nhánh dưới
      if (placed.y + placed.length < free.y + free.length) {
        newFree.push({
          x: free.x,
          y: placed.y + placed.length,
          width: free.width,
          length: free.y + free.length - (placed.y + placed.length),
        });
      }
      // 3. Nhánh trái
      if (placed.x > free.x && placed.x < free.x + free.width) {
        newFree.push({
          x: free.x,
          y: free.y,
          width: placed.x - free.x,
          length: free.length,
        });
      }
      // 4. Nhánh phải
      if (placed.x + placed.width < free.x + free.width) {
        newFree.push({
          x: placed.x + placed.width,
          y: free.y,
          width: free.x + free.width - (placed.x + placed.width),
          length: free.length,
        });
      }
    }

    this.freeRectangles = newFree;
  }

  _pruneFreeRectangles() {
    for (let i = 0; i < this.freeRectangles.length; i++) {
      for (let j = i + 1; j < this.freeRectangles.length; j++) {
        const r1 = this.freeRectangles[i];
        const r2 = this.freeRectangles[j];

        // Nếu r1 bị bao hàm hoàn toàn trong r2
        if (
          r1.x >= r2.x &&
          r1.y >= r2.y &&
          r1.x + r1.width <= r2.x + r2.width &&
          r1.y + r1.length <= r2.y + r2.length
        ) {
          this.freeRectangles.splice(i, 1);
          i--;
          break;
        }

        // Nếu r2 bị bao hàm hoàn toàn trong r1
        if (
          r2.x >= r1.x &&
          r2.y >= r1.y &&
          r2.x + r2.width <= r1.x + r1.width &&
          r2.y + r2.length <= r1.y + r1.length
        ) {
          this.freeRectangles.splice(j, 1);
          j--;
        }
      }
    }
  }

  getEfficiency() {
    const totalBinArea = this.binWidth * this.binLength;
    if (totalBinArea === 0) return 0;
    const usedArea = this.usedRectangles.reduce((sum, r) => sum + r.width * r.length, 0);
    return Number(((usedArea / totalBinArea) * 100).toFixed(2));
  }

  /**
   * Phương thức đóng gói tiện ích tương thích với test suite
   */
  pack(items = []) {
    const packed = [];
    const unpacked = [];
    for (const item of items) {
      const placed = this.insert(item);
      if (placed) {
        packed.push(placed);
      } else {
        unpacked.push(item);
      }
    }
    return {
      packed,
      unpacked,
      occupancyRate: Number((this.getEfficiency() / 100).toFixed(4)),
    };
  }
}

/**
 * SPX Volumetric Box Optimizer: Tự động chọn thùng carton tối ưu cho đơn hàng
 */
export class SPXBoxOptimizer {
  constructor(customBoxes = null) {
    this.standardBoxes = customBoxes || SPX_STANDARD_BOXES;
  }

  /**
   * Chọn hộp carton tiêu chuẩn tối ưu nhất cho danh sách các sản phẩm trong đơn
   * @param {Array<Object>} items Danh sách sản phẩm [{ id, name, width, length, height, weightKg, quantity }]
   */
  optimizeBoxForOrder(items = []) {
    if (!items || items.length === 0) {
      return {
        bestBox: null,
        packings: [],
        fits: false,
        actualWeightTotal: 0,
        volumetricWeightTotal: 0,
        efficiencyPct: 0,
      };
    }

    // 1. Mở rộng danh sách sản phẩm theo số lượng quantity
    const expandedItems = [];
    let totalActualWeight = 0;
    let maxItemHeight = 0;

    for (const it of items) {
      const qty = Math.max(1, Number(it.quantity) || 1);
      const w = Math.max(1, Number(it.width) || 5);
      const l = Math.max(1, Number(it.length) || 5);
      const h = Math.max(1, Number(it.height) || 5);
      const weight = Math.max(0.1, Number(it.weightKg || it.weight) || 0.5);

      if (h > maxItemHeight) maxItemHeight = h;

      for (let q = 0; q < qty; q++) {
        expandedItems.push({
          id: `${it.id || "item"}_${q + 1}`,
          name: it.name || it.id,
          width: w,
          length: l,
          height: h,
          weightKg: weight,
          area: w * l,
          volume: w * l * h,
        });
        totalActualWeight += weight;
      }
    }

    // Sắp xếp các món hàng theo diện tích đáy giảm dần (Best-Fit Decreasing)
    expandedItems.sort((a, b) => b.area - a.area);

    // 2. Thử đóng gói vào từng loại hộp carton tiêu chuẩn từ nhỏ nhất tới lớn nhất
    const sortedBoxes = [...this.standardBoxes].sort((a, b) => {
      const volA = a.width * a.length * a.height;
      const volB = b.width * b.length * b.height;
      return volA - volB;
    });

    for (const box of sortedBoxes) {
      // Bỏ qua nếu chiều cao hộp không đủ chứa sản phẩm cao nhất
      if (box.height < maxItemHeight) continue;
      // Bỏ qua nếu tổng trọng lượng vượt quá sức tải tối đa của hộp
      if (totalActualWeight > box.maxWeightKg) continue;

      const packer = new MaximalRectanglesPacker(box.width, box.length);
      let allFit = true;
      const placements = [];

      for (const item of expandedItems) {
        const placed = packer.insert(item);
        if (!placed) {
          allFit = false;
          break;
        }
        placements.push({
          ...placed,
          height: item.height,
          weightKg: item.weightKg,
        });
      }

      if (allFit) {
        const volumetricWeight = calculateVolumetricWeight(box.width, box.length, box.height);
        const chargeableWeight = Math.max(Number(totalActualWeight.toFixed(2)), volumetricWeight);
        const efficiency = packer.getEfficiency();

        return {
          bestBox: box,
          packings: placements,
          fits: true,
          actualWeightTotal: Number(totalActualWeight.toFixed(2)),
          volumetricWeightTotal: volumetricWeight,
          chargeableWeight,
          efficiencyPct: efficiency,
          unpackedCount: 0,
          recommendation: `Đã chọn ${box.name} (${box.width}x${box.length}x${box.height}cm). Đạt mật độ đáy ${efficiency}%, cước tính theo ${chargeableWeight}kg.`,
        };
      }
    }

    // Nếu không vừa bất kỳ hộp chuẩn nào, trả về trạng thái cần tách kiện (Oversized Package)
    return {
      bestBox: null,
      packings: [],
      fits: false,
      actualWeightTotal: Number(totalActualWeight.toFixed(2)),
      volumetricWeightTotal: 0,
      chargeableWeight: Number(totalActualWeight.toFixed(2)),
      efficiencyPct: 0,
      unpackedCount: expandedItems.length,
      recommendation: "Đơn hàng vượt quá kích thước hộp chuẩn XL. Vui lòng chia làm 2 kiện hàng SPX riêng biệt.",
    };
  }

  /**
   * Phương thức đóng gói tối ưu tương thích với test suite
   */
  optimizePacking(items = []) {
    const res = this.optimizeBoxForOrder(items);
    return {
      success: res.fits,
      selectedBox: res.bestBox
        ? {
            code: res.bestBox.id.replace("BOX_", "SPX_BOX_"),
            name: res.bestBox.name,
            width: res.bestBox.width,
            length: res.bestBox.length,
            height: res.bestBox.height,
          }
        : null,
      unpackedItems: res.fits ? [] : items,
      volumetricWeightKg: res.volumetricWeightTotal,
      chargeableWeightKg: res.chargeableWeight,
      efficiencyPct: res.efficiencyPct,
      manifest: res.packings.map((p, idx) => ({
        id: p.id,
        name: p.name,
        x: p.x,
        y: p.y,
        width: p.width,
        length: p.length,
        layer: Math.floor(idx / 4),
      })),
    };
  }
}

export default {
  SPX_STANDARD_BOXES,
  calculateVolumetricWeight,
  MaximalRectanglesPacker,
  SPXBoxOptimizer,
};
