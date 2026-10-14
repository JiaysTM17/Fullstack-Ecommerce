/**
 * Hungarian Algorithm (Kuhn-Munkres) for Optimal Bipartite Matching
 * & SPX Express Intelligent Courier-to-Order Dispatch Engine
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 10 - Feature 157)
 * 
 * Vấn đề:
 * Trong giờ cao điểm Flash Sale hoặc Mega Sale, hàng trăm đơn hàng Hỏa Tốc (SPX Instant 2H)
 * cần được phân bổ cho đội ngũ bưu tá giao hàng (Couriers/Shippers).
 * Việc gán đơn thủ công hoặc First-Come-First-Serve (FCFS) gây lãng phí quãng đường di chuyển,
 * làm chậm trễ SLA giao hàng và gây quá tải tải trọng cho bưu tá.
 * 
 * Giải pháp Hungarian Algorithm (Kuhn-Munkres O(V^3)):
 * 1. Xây dựng ma trận chi phí C (N x M):
 *    - Chi phí C[i][j] kết hợp đa tiêu chí:
 *      + Quãng đường di chuyển GPS (Bưu tá -> Shop lấy hàng -> Người mua nhận hàng).
 *      + Độ khẩn cấp SLA (Thời gian giao hàng cam kết còn lại).
 *      + Tải trọng bưu tá (Trọng lượng kiện hàng so với sức chứa xe máy).
 *      + Điểm uy tín bưu tá (Tỷ lệ hoàn thành đơn đúng hạn trong quá khứ).
 * 2. Cân bằng ma trận chữ nhật (Unbalanced Bipartite Graph):
 *    - Bổ sung các nút bưu tá ảo (Dummy Couriers) hoặc đơn hàng ảo (Dummy Orders) với trọng số lớn.
 * 3. Thuật toán Kuhn-Munkres:
 *    - Giảm ma trận theo hàng và cột (Row & Column Reduction).
 *    - Phủ các số 0 bằng số lượng đường thẳng cực tiểu (Minimum Line Covering).
 *    - Cập nhật thế đối ngẫu (Dual Potential Update) cho đến khi tìm được cặp ghép hoàn hảo cực tiểu.
 */

import { calculateHaversineDistance } from "./tspRouteOptimizer.js";

/**
 * Thuật toán Hungarian (Kuhn-Munkres) giải bài toán gán cực tiểu cho ma trận chi phí vuông hoặc chữ nhật.
 * @param {Array<Array<number>>} costMatrix Ma trận chi phí N hàng (công nhân/shipper) x M cột (nhiệm vụ/order)
 * @returns {Object} { assignments: [{ workerIndex, taskIndex, cost }], totalCost, workerToTask, taskToWorker }
 */
export function solveHungarian(costMatrix) {
  if (!costMatrix || costMatrix.length === 0 || !costMatrix[0] || costMatrix[0].length === 0) {
    return { assignments: [], totalCost: 0, workerToTask: [], taskToWorker: [] };
  }

  const numRows = costMatrix.length;
  const numCols = costMatrix[0].length;
  const dim = Math.max(numRows, numCols);

  // 1. Chuyển thành ma trận vuông kích thước dim x dim (đệm các phần tử ảo nếu numRows != numCols)
  let maxVal = 0;
  for (let r = 0; r < numRows; r++) {
    for (let c = 0; c < numCols; c++) {
      if (Number.isFinite(costMatrix[r][c]) && costMatrix[r][c] > maxVal) {
        maxVal = costMatrix[r][c];
      }
    }
  }
  const dummyCost = maxVal * 10 + 10000;

  const matrix = Array.from({ length: dim }, (_, r) =>
    Array.from({ length: dim }, (_, c) => {
      if (r < numRows && c < numCols) {
        return Number.isFinite(costMatrix[r][c]) ? costMatrix[r][c] : dummyCost;
      }
      return dummyCost;
    })
  );

  // 2. Thuật toán Kuhn-Munkres với O(V^3) sử dụng thế đối ngẫu (Dual Potentials u, v)
  const u = new Array(dim + 1).fill(0);
  const v = new Array(dim + 1).fill(0);
  const p = new Array(dim + 1).fill(0); // p[j] lưu hàng ghép với cột j
  const way = new Array(dim + 1).fill(0);

  for (let i = 1; i <= dim; i++) {
    p[0] = i;
    let j0 = 0;
    const minv = new Array(dim + 1).fill(Infinity);
    const used = new Array(dim + 1).fill(false);

    do {
      used[j0] = true;
      const i0 = p[j0];
      let delta = Infinity;
      let j1 = 0;

      for (let j = 1; j <= dim; j++) {
        if (!used[j]) {
          const cur = matrix[i0 - 1][j - 1] - u[i0] - v[j];
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

      for (let j = 0; j <= dim; j++) {
        if (used[j]) {
          u[p[j]] += delta;
          v[j] -= delta;
        } else {
          minv[j] -= delta;
        }
      }

      j0 = j1;
    } while (p[j0] !== 0);

    // Truy vết ngược đường tăng luồng
    do {
      const j1 = way[j0];
      p[j0] = p[j1];
      j0 = j1;
    } while (j0 !== 0);
  }

  // 3. Trích xuất kết quả ghép cặp thực tế (bỏ qua các nút ảo)
  const workerToTask = new Array(numRows).fill(-1);
  const taskToWorker = new Array(numCols).fill(-1);
  const assignments = [];
  let totalCost = 0;

  for (let j = 1; j <= dim; j++) {
    const r = p[j] - 1;
    const c = j - 1;
    if (r < numRows && c < numCols) {
      workerToTask[r] = c;
      taskToWorker[c] = r;
      const realCost = costMatrix[r][c];
      assignments.push({
        workerIndex: r,
        taskIndex: c,
        cost: realCost,
      });
      totalCost += realCost;
    }
  }

  assignments.sort((a, b) => a.workerIndex - b.workerIndex);

  return {
    assignments,
    totalCost: Number(totalCost.toFixed(2)),
    workerToTask,
    taskToWorker,
  };
}

/**
 * SPX Intelligent Dispatch Engine: Điều phối bưu tá tới đơn hàng tối ưu đa tiêu chí
 */
export class SPXDispatchEngine {
  constructor({
    distanceWeight = 1.0,      // Trọng số chi phí quãng đường GPS (1000 VND / km)
    urgencyWeight = 2.5,       // Trọng số mức độ khẩn cấp SLA (phút càng ít phạt càng cao)
    capacityPenaltyWeight = 5000, // Phạt nếu vượt tải trọng (VND / kg vượt)
    ratingWeight = 200,        // Thưởng/phạt điểm uy tín của bưu tá
  } = {}) {
    this.distanceWeight = distanceWeight;
    this.urgencyWeight = urgencyWeight;
    this.capacityPenaltyWeight = capacityPenaltyWeight;
    this.ratingWeight = ratingWeight;
  }

  /**
   * Tính toán chi phí tổ hợp khi gán bưu tá cho một đơn hàng
   */
  calculateAssignmentCost(courier, order) {
    // 1. Quãng đường GPS 2 chặng:
    // Chặng 1: Bưu tá -> Shop lấy hàng (Pickup distance)
    const pickupDist = calculateHaversineDistance(
      courier.lat, courier.lng,
      order.shopLat, order.shopLng
    );
    // Chặng 2: Shop -> Người mua (Delivery distance)
    const deliveryDist = calculateHaversineDistance(
      order.shopLat, order.shopLng,
      order.buyerLat, order.buyerLng
    );
    const totalDist = pickupDist + deliveryDist;
    const distanceCost = totalDist * this.distanceWeight * 5000; // 5000 VND / km

    // 2. Chi phí SLA Urgency: Càng gần hạn chót (slaUrgencyMinutes nhỏ), chi phí càng tăng nếu bưu tá ở xa
    const slaRemaining = Math.max(1, Number(order.slaUrgencyMinutes) || 60);
    // Thời gian dự kiến di chuyển chặng pickup (giả sử tốc độ đô thị 25 km/h)
    const estimatedPickupTimeMin = (pickupDist / 25) * 60;
    const urgencyRatio = estimatedPickupTimeMin / slaRemaining;
    const urgencyCost = urgencyRatio > 0.5
      ? (urgencyRatio - 0.5) * this.urgencyWeight * 10000
      : 0;

    // 3. Phạt tải trọng (Capacity overload penalty)
    const maxCap = courier.capacityKg || 30; // Mặc định 30kg xe máy
    const currentLoad = courier.currentLoadKg || 0;
    const orderWeight = order.weightKg || 1.0;
    const projectedLoad = currentLoad + orderWeight;
    const overloadKg = Math.max(0, projectedLoad - maxCap);
    const capacityCost = overloadKg * this.capacityPenaltyWeight;

    // 4. Điểm uy tín bưu tá (Rating discount): Bưu tá 5 sao được ưu tiên nhận đơn gần và giảm chi phí
    const rating = Math.max(1, Math.min(5, Number(courier.rating) || 4.5));
    const ratingDiscount = (rating - 3.0) * this.ratingWeight;

    // Tổng chi phí gán (đảm bảo >= 0)
    const totalAssignmentCost = Math.max(
      1000,
      distanceCost + urgencyCost + capacityCost - ratingDiscount
    );

    return {
      totalCost: Math.round(totalAssignmentCost),
      details: {
        pickupDistKm: Number(pickupDist.toFixed(2)),
        deliveryDistKm: Number(deliveryDist.toFixed(2)),
        totalDistKm: Number(totalDist.toFixed(2)),
        urgencyCost: Math.round(urgencyCost),
        capacityCost: Math.round(capacityCost),
        ratingDiscount: Math.round(ratingDiscount),
        overloadKg: Number(overloadKg.toFixed(2)),
      },
    };
  }

  /**
   * Điều phối toàn diện danh sách bưu tá khả dụng cho danh sách đơn hàng chờ xử lý
   * @param {Array<Object>} couriers Danh sách bưu tá đang hoạt động
   * @param {Array<Object>} orders Danh sách đơn hàng chờ giao
   */
  dispatch(couriers = [], orders = []) {
    if (!couriers || couriers.length === 0 || !orders || orders.length === 0) {
      return {
        matchedAssignments: [],
        totalDispatchCost: 0,
        unassignedOrders: orders || [],
        idleCouriers: couriers || [],
        dispatchSummary: {
          couriersCount: couriers ? couriers.length : 0,
          ordersCount: orders ? orders.length : 0,
          matchedCount: 0,
        },
      };
    }

    // 1. Xây dựng ma trận chi phí
    const costMatrix = [];
    const costDetailsMatrix = [];

    for (let r = 0; r < couriers.length; r++) {
      const row = [];
      const detailsRow = [];
      for (let c = 0; c < orders.length; c++) {
        const costObj = this.calculateAssignmentCost(couriers[r], orders[c]);
        row.push(costObj.totalCost);
        detailsRow.push(costObj.details);
      }
      costMatrix.push(row);
      costDetailsMatrix.push(detailsRow);
    }

    // 2. Chạy thuật toán Hungarian
    const hungarianResult = solveHungarian(costMatrix);

    // 3. Định dạng kết quả ghép cặp
    const matchedAssignments = [];
    const assignedCourierIndices = new Set();
    const assignedOrderIndices = new Set();

    for (const a of hungarianResult.assignments) {
      const courier = couriers[a.workerIndex];
      const order = orders[a.taskIndex];
      const details = costDetailsMatrix[a.workerIndex][a.taskIndex];

      assignedCourierIndices.add(a.workerIndex);
      assignedOrderIndices.add(a.taskIndex);

      matchedAssignments.push({
        courierId: courier.id,
        courierName: courier.name,
        orderId: order.id,
        orderCode: order.orderCode || order.id,
        assignmentCost: a.cost,
        metrics: details,
      });
    }

    const unassignedOrders = orders.filter((_, idx) => !assignedOrderIndices.has(idx));
    const idleCouriers = couriers.filter((_, idx) => !assignedCourierIndices.has(idx));

    return {
      matchedAssignments,
      totalDispatchCost: hungarianResult.totalCost,
      unassignedOrders,
      idleCouriers,
      dispatchSummary: {
        couriersCount: couriers.length,
        ordersCount: orders.length,
        matchedCount: matchedAssignments.length,
        unassignedOrdersCount: unassignedOrders.length,
        idleCouriersCount: idleCouriers.length,
      },
    };
  }
}

export default {
  solveHungarian,
  SPXDispatchEngine,
};
