/**
 * Simulated Annealing Warehouse Slotting Optimizer
 * Thuật Toán Luyện Kim Mô Phỏng Tối Ưu Hóa Bố Trí Kho Hàng Cấp Doanh Nghiệp
 * 
 * Mục tiêu:
 * 1. Giảm thiểu quãng đường di chuyển của nhân viên lấy hàng (Order Picker Travel Distance).
 * 2. Gom cụm các SKU thường xuyên mua kèm (Co-Pick Affinity Clustering) vào các kệ lân cận.
 * 3. Tối ưu công thái học (Ergonomics): Đặt hàng nặng ở tầng thấp và gần cửa xuất kho.
 */

export class SimulatedAnnealingWarehouseSlotter {
  constructor(options = {}) {
    this.initialTemperature = options.initialTemperature || 1000;
    this.coolingRate = options.coolingRate || 0.95;
    this.minTemperature = options.minTemperature || 1e-3;
    this.iterationsPerTemp = options.iterationsPerTemp || 20;

    this.slots = new Map(); // slotId -> { id, aisle, rack, shelf, distToPacking, heightTier }
    this.skus = new Map();   // skuId -> { id, name, picksPerDay, weightKg }
    this.affinities = new Map(); // "skuA:skuB" -> weight
  }

  /**
   * Thêm một vị trí kệ hàng (Slot) trong kho
   * @param {string} id - Mã vị trí (ví dụ: "A01-R02-S1")
   * @param {Object} details
   * @param {number} details.distToPacking - Khoảng cách tới bàn đóng gói (mét)
   * @param {number} [details.shelf=1] - Tầng kệ (1: trệt, 2: vừa, 3: cao)
   * @param {number} [details.aisle=1] - Dãy lối đi
   */
  addSlot(id, { distToPacking, shelf = 1, aisle = 1 }) {
    this.slots.set(id, {
      id,
      distToPacking: Number(distToPacking),
      shelf: Number(shelf),
      aisle: Number(aisle)
    });
  }

  /**
   * Thêm một mã sản phẩm (SKU) cần lưu kho
   * @param {string} id - Mã SKU (ví dụ: "SKU_DUMBELL_10KG")
   * @param {Object} details
   * @param {string} details.name - Tên sản phẩm
   * @param {number} details.picksPerDay - Tần suất nhặt hàng trung bình mỗi ngày
   * @param {number} details.weightKg - Trọng lượng đơn vị (kg)
   */
  addSku(id, { name = "", picksPerDay = 1, weightKg = 1 }) {
    this.skus.set(id, {
      id,
      name,
      picksPerDay: Math.max(1, Number(picksPerDay)),
      weightKg: Math.max(0.1, Number(weightKg))
    });
  }

  /**
   * Thêm liên kết đồng mua (Co-pick affinity) giữa 2 SKU
   * @param {string} skuA
   * @param {string} skuB
   * @param {number} coPickCount - Số lần mua cùng nhau trong các đơn hàng
   */
  addAffinity(skuA, skuB, coPickCount) {
    const key = [skuA, skuB].sort().join("::");
    this.affinities.set(key, (this.affinities.get(key) || 0) + Number(coPickCount));
  }

  /**
   * Tính hàm chi phí năng lượng (Energy / Cost Function) của một cấu hình bố trí kho
   * @param {Map<string, string>} skuToSlot - Bản đồ SKU -> SlotId
   * @returns {number}
   */
  calculateEnergy(skuToSlot) {
    let travelEnergy = 0;
    let ergonomicsPenalty = 0;
    let affinityEnergy = 0;

    const slotMap = this.slots;

    // 1. Quãng đường lấy hàng: Chi phí = Tần suất nhặt hàng * Khoảng cách tới bàn gói
    // 2. Công thái học: Hàng nặng đặt ở tầng cao (shelf > 1) chịu điểm phạt
    for (const [skuId, slotId] of skuToSlot.entries()) {
      const sku = this.skus.get(skuId);
      const slot = slotMap.get(slotId);
      if (!sku || !slot) continue;

      travelEnergy += sku.picksPerDay * slot.distToPacking;

      // Phạt hàng nặng (> 5kg) để tầng cao
      if (sku.weightKg > 5 && slot.shelf > 1) {
        ergonomicsPenalty += sku.weightKg * (slot.shelf - 1) * 15;
      }
    }

    // 3. Khoảng cách giữa các cặp sản phẩm thường mua cùng nhau
    for (const [pairKey, count] of this.affinities.entries()) {
      const [skuA, skuB] = pairKey.split("::");
      const slotAId = skuToSlot.get(skuA);
      const slotBId = skuToSlot.get(skuB);

      if (slotAId && slotBId) {
        const slotA = slotMap.get(slotAId);
        const slotB = slotMap.get(slotBId);
        // Khoảng cách Manhattan tương đối giữa 2 slot
        const dist = Math.abs(slotA.distToPacking - slotB.distToPacking) + Math.abs(slotA.aisle - slotB.aisle) * 10;
        affinityEnergy += count * dist;
      }
    }

    return travelEnergy + ergonomicsPenalty + affinityEnergy * 0.5;
  }

  /**
   * Chạy thuật toán Luyện Kim Mô Phỏng (Simulated Annealing)
   * @returns {Object} Kết quả bố trí tối ưu
   */
  optimize() {
    const skuIds = Array.from(this.skus.keys());
    const slotIds = Array.from(this.slots.keys());

    if (skuIds.length === 0 || slotIds.length === 0) {
      return {
        assignment: new Map(),
        initialEnergy: 0,
        finalEnergy: 0,
        improvementPercent: 0,
        iterations: 0
      };
    }

    if (slotIds.length < skuIds.length) {
      throw new Error("INSUFFICIENT_SLOTS: Số lượng vị trí kho ít hơn số lượng SKU cần xếp!");
    }

    // Khởi tạo nghiệm ban đầu: Gán tuần tự SKU vào Slot
    let currentAssignment = new Map();
    for (let i = 0; i < skuIds.length; i++) {
      currentAssignment.set(skuIds[i], slotIds[i]);
    }

    let currentEnergy = this.calculateEnergy(currentAssignment);
    const initialEnergy = currentEnergy;

    let bestAssignment = new Map(currentAssignment);
    let bestEnergy = currentEnergy;

    let T = this.initialTemperature;
    let totalIterations = 0;

    // Vòng lặp làm nguội nhiệt độ (Cooling Schedule)
    while (T > this.minTemperature) {
      for (let iter = 0; iter < this.iterationsPerTemp; iter++) {
        totalIterations++;

        // Tạo lời giải lân cận (Neighbor State): Hoán đổi vị trí giữa 2 SKU hoặc chuyển SKU sang slot trống
        const nextAssignment = new Map(currentAssignment);

        const idxA = Math.floor(Math.random() * skuIds.length);
        const skuA = skuIds[idxA];

        if (Math.random() < 0.5 && skuIds.length > 1) {
          // Hoán đổi giữa 2 SKU
          let idxB = Math.floor(Math.random() * skuIds.length);
          while (idxB === idxA) {
            idxB = Math.floor(Math.random() * skuIds.length);
          }
          const skuB = skuIds[idxB];
          const slotA = nextAssignment.get(skuA);
          const slotB = nextAssignment.get(skuB);
          nextAssignment.set(skuA, slotB);
          nextAssignment.set(skuB, slotA);
        } else {
          // Chọn một slot bất kỳ (có thể đang trống hoặc đang có SKU khác)
          const randomSlotId = slotIds[Math.floor(Math.random() * slotIds.length)];
          // Tìm SKU đang giữ randomSlotId (nếu có)
          let occupantSku = null;
          for (const [sId, slId] of nextAssignment.entries()) {
            if (slId === randomSlotId && sId !== skuA) {
              occupantSku = sId;
              break;
            }
          }

          const oldSlotA = nextAssignment.get(skuA);
          nextAssignment.set(skuA, randomSlotId);
          if (occupantSku) {
            nextAssignment.set(occupantSku, oldSlotA);
          }
        }

        const nextEnergy = this.calculateEnergy(nextAssignment);
        const deltaEnergy = nextEnergy - currentEnergy;

        // Tiêu chuẩn Metropolis: Chấp nhận nghiệm tốt hơn hoặc chấp nhận nghiệm xấu hơn với xác suất e^(-ΔE/T)
        if (deltaEnergy < 0 || Math.random() < Math.exp(-deltaEnergy / T)) {
          currentAssignment = nextAssignment;
          currentEnergy = nextEnergy;

          if (currentEnergy < bestEnergy) {
            bestEnergy = currentEnergy;
            bestAssignment = new Map(currentAssignment);
          }
        }
      }

      T *= this.coolingRate;
    }

    const improvementPercent = initialEnergy > 0
      ? Number((((initialEnergy - bestEnergy) / initialEnergy) * 100).toFixed(2))
      : 0;

    return {
      assignment: bestAssignment,
      initialEnergy: Math.round(initialEnergy),
      finalEnergy: Math.round(bestEnergy),
      improvementPercent: Math.max(0, improvementPercent),
      iterations: totalIterations
    };
  }
}

export default SimulatedAnnealingWarehouseSlotter;
