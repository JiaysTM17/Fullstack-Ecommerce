/**
 * Primal-Dual Bipartite Logistics Matcher (Kuhn-Munkres Max-Weight Assignment)
 * Thuật toán Đối ngẫu Sơ cấp ghép cặp lưỡng phân cực đại trọng số (Phí vận chuyển + SLA Margin + Courier Rating)
 * Độ phức tạp: O(V^3) với mảng slack[j] và thế đối ngẫu u[i], v[j]
 */

class PrimalDualLogisticsMatcher {
  constructor(options = {}) {
    this.maxPenalty = options.maxPenalty || 100000;
  }

  /**
   * Giải bài toán ghép cặp cực đại trọng số
   * @param {Array<string>} orders Danh sách Order IDs (kích thước N)
   * @param {Array<string>} couriers Danh sách Courier IDs (kích thước M)
   * @param {Function|Array<Array<number>>} weightFn Hàm tính trọng số f(order, courier) -> score (càng cao càng tốt)
   */
  match(orders, couriers, weightFn) {
    const N = orders.length;
    const M = couriers.length;
    if (N === 0 || M === 0) {
      return {
        assignments: [],
        totalWeight: 0,
        matchedCount: 0,
        unassignedOrders: orders,
        unassignedCouriers: couriers
      };
    }

    const size = Math.max(N, M);
    // Ma trận trọng số vuông size x size (chuẩn hóa 1-based index cho Kuhn-Munkres)
    const costMatrix = Array.from({ length: size + 1 }, () => new Array(size + 1).fill(0));

    for (let i = 0; i < N; i++) {
      for (let j = 0; j < M; j++) {
        let w = 0;
        if (typeof weightFn === 'function') {
          w = weightFn(orders[i], couriers[j]);
        } else if (Array.isArray(weightFn) && weightFn[i] && weightFn[i][j] !== undefined) {
          w = weightFn[i][j];
        }
        costMatrix[i + 1][j + 1] = Math.max(0, Number(w) || 0);
      }
    }

    // Thế đối ngẫu u (dòng) và v (cột)
    const u = new Array(size + 1).fill(0);
    const v = new Array(size + 1).fill(0);
    const p = new Array(size + 1).fill(0); // p[j]: dòng ghép với cột j
    const way = new Array(size + 1).fill(0); // way[j]: truy vết đường tăng luồng

    // Khởi tạo u[i] bằng max dòng
    for (let i = 1; i <= size; i++) {
      let maxVal = 0;
      for (let j = 1; j <= size; j++) {
        if (costMatrix[i][j] > maxVal) maxVal = costMatrix[i][j];
      }
      u[i] = maxVal;
    }

    // Tăng luồng từng dòng
    for (let i = 1; i <= size; i++) {
      p[0] = i;
      let j0 = 0;
      const minv = new Array(size + 1).fill(Infinity);
      const used = new Array(size + 1).fill(false);

      do {
        used[j0] = true;
        const i0 = p[j0];
        let delta = Infinity;
        let j1 = 0;

        for (let j = 1; j <= size; j++) {
          if (!used[j]) {
            const cur = u[i0] + v[j] - costMatrix[i0][j];
            if (cur < minv[j]) {
              minv[j] = cur;
              way[j] = j0;
            }
            if (minv[j] < delta) {
              delta = minv[j];
              j1 = j;
            }
          }
        }

        for (let j = 0; j <= size; j++) {
          if (used[j]) {
            u[p[j]] -= delta;
            v[j] += delta;
          } else {
            minv[j] -= delta;
          }
        }

        j0 = j1;
      } while (p[j0] !== 0);

      do {
        const j1 = way[j0];
        p[j0] = p[j1];
        j0 = j1;
      } while (j0 !== 0);
    }

    const assignments = [];
    let totalWeight = 0;
    const assignedOrders = new Set();
    const assignedCouriers = new Set();

    for (let j = 1; j <= size; j++) {
      const orderIdx = p[j] - 1;
      const courierIdx = j - 1;

      if (orderIdx < N && courierIdx < M) {
        const score = costMatrix[p[j]][j];
        if (score > 0) {
          assignments.push({
            orderId: orders[orderIdx],
            courierId: couriers[courierIdx],
            compositeScore: score
          });
          totalWeight += score;
          assignedOrders.add(orders[orderIdx]);
          assignedCouriers.add(couriers[courierIdx]);
        }
      }
    }

    return {
      assignments,
      totalWeight,
      matchedCount: assignments.length,
      unassignedOrders: orders.filter(o => !assignedOrders.has(o)),
      unassignedCouriers: couriers.filter(c => !assignedCouriers.has(c))
    };
  }

  /**
   * Tính điểm trọng số kết hợp (Composite Score) phục vụ giao vận hỏa tốc
   */
  static computeCompositeScore(order, courier, options = {}) {
    const { maxDistanceKm = 20, maxSlaMinutes = 120 } = options;
    const distance = Number(order.distanceKm || courier.distanceKm || 5.0);
    const slaRemaining = Number(order.slaRemainingMinutes || 60);
    const rating = Number(courier.rating || 4.5);
    const orderValue = Number(order.orderValue || 100000);

    // 1. Điểm khoảng cách (càng gần điểm càng cao: 0..40)
    const distanceScore = Math.max(0, 40 * (1 - distance / maxDistanceKm));

    // 2. Điểm áp lực SLA (càng gấp càng ưu tiên bưu tá uy tín: 0..30)
    const urgencyScore = Math.max(0, 30 * (1 - slaRemaining / maxSlaMinutes));

    // 3. Điểm bưu tá uy tín (0..20)
    const ratingScore = (Math.min(5, rating) / 5) * 20;

    // 4. Giá trị đơn hàng (VIP Boost: 0..10)
    const vipBoost = Math.min(10, (orderValue / 1000000) * 10);

    return Math.round((distanceScore + urgencyScore + ratingScore + vipBoost) * 100) / 100;
  }
}

export { PrimalDualLogisticsMatcher };
export default PrimalDualLogisticsMatcher;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PrimalDualLogisticsMatcher };
  }
} catch (e) {}
