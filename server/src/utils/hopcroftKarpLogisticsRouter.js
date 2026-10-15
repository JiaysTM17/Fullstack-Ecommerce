/**
 * Hopcroft-Karp Maximum Bipartite Matching with Parallel Augmenting Waves
 * Thuật toán ghép cặp cực đại đồ thị lưỡng phân (Hopcroft & Karp 1973)
 * Độ phức tạp: O(E * sqrt(V)) - Tối ưu cho điều phối bưu tá quy mô lớn giờ cao điểm
 * Kết hợp phân tầng BFS tìm đường tăng luồng ngắn nhất và DFS song song tăng luồng
 */

class HopcroftKarpLogisticsRouter {
  constructor(options = {}) {
    this.maxDistanceKm = options.maxDistanceKm || 12.0; // Khoảng cách giao tối đa
    this.infinity = 1e9;
  }

  /**
   * Tính khoảng cách Haversine giữa 2 tọa độ GPS (km)
   */
  static haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính Trái Đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  /**
   * Xây dựng đồ thị lưỡng phân giữa Đơn hàng (U) và Bưu tá (V)
   * Có lọc theo bán kính khoảng cách GPS và loại phương tiện
   */
  buildBipartiteGraph(orders, couriers) {
    const adj = new Map();
    orders.forEach(o => adj.set(o.id, []));

    for (const order of orders) {
      for (const courier of couriers) {
        // Kiểm tra khả dụng bưu tá
        if (courier.isBusy) continue;

        // Kiểm tra khoảng cách nếu có tọa độ GPS
        if (order.lat != null && order.lon != null && courier.lat != null && courier.lon != null) {
          const dist = HopcroftKarpLogisticsRouter.haversineKm(order.lat, order.lon, courier.lat, courier.lon);
          if (dist > this.maxDistanceKm) continue;
        }

        // Kiểm tra loại phương tiện cồng kềnh
        if (order.isBulky && courier.vehicleType === 'bike') {
          continue; // Hàng cồng kềnh cần xe bán tải/van
        }

        adj.get(order.id).push(courier.id);
      }
    }

    return adj;
  }

  /**
   * Thuật toán Hopcroft-Karp giải ghép cặp cực đại
   * @param {Array<Object>} orders Danh sách đơn hàng [{ id, lat, lon, isBulky }]
   * @param {Array<Object>} couriers Danh sách bưu tá [{ id, lat, lon, vehicleType, isBusy }]
   */
  solve(orders, couriers) {
    if (!orders || orders.length === 0 || !couriers || couriers.length === 0) {
      return {
        matchedCount: 0,
        assignments: [],
        unassignedOrders: (orders || []).map(o => o.id),
        unassignedCouriers: (couriers || []).map(c => c.id)
      };
    }

    const adj = this.buildBipartiteGraph(orders, couriers);
    const pairU = new Map(); // orderId -> courierId
    const pairV = new Map(); // courierId -> orderId
    const dist = new Map();  // orderId -> level

    orders.forEach(o => pairU.set(o.id, null));
    couriers.forEach(c => pairV.set(c.id, null));

    // Pha BFS phân tầng tìm các đường tăng luồng ngắn nhất
    const bfs = () => {
      const queue = [];
      for (const order of orders) {
        if (pairU.get(order.id) === null) {
          dist.set(order.id, 0);
          queue.push(order.id);
        } else {
          dist.set(order.id, this.infinity);
        }
      }

      dist.set(null, this.infinity);

      while (queue.length > 0) {
        const u = queue.shift();
        if (dist.get(u) < dist.get(null)) {
          const neighbors = adj.get(u) || [];
          for (const v of neighbors) {
            const nextU = pairV.get(v);
            if (dist.get(nextU) === this.infinity) {
              dist.set(nextU, dist.get(u) + 1);
              queue.push(nextU);
            }
          }
        }
      }

      return dist.get(null) !== this.infinity;
    };

    // Pha DFS song song tăng luồng trên các đường rời nhau theo đỉnh
    const dfs = (u) => {
      if (u === null) return true;
      const neighbors = adj.get(u) || [];

      for (const v of neighbors) {
        const nextU = pairV.get(v);
        if (dist.get(nextU) === dist.get(u) + 1) {
          if (dfs(nextU)) {
            pairV.set(v, u);
            pairU.set(u, v);
            return true;
          }
        }
      }

      dist.set(u, this.infinity);
      return false;
    };

    let matching = 0;
    // Lặp tối đa O(sqrt(V)) đợt sóng tăng luồng
    while (bfs()) {
      for (const order of orders) {
        if (pairU.get(order.id) === null) {
          if (dfs(order.id)) {
            matching++;
          }
        }
      }
    }

    const assignments = [];
    const unassignedOrders = [];
    const unassignedCouriers = [];

    for (const order of orders) {
      const matchedCourier = pairU.get(order.id);
      if (matchedCourier) {
        assignments.push({
          orderId: order.id,
          courierId: matchedCourier
        });
      } else {
        unassignedOrders.push(order.id);
      }
    }

    for (const courier of couriers) {
      if (pairV.get(courier.id) === null) {
        unassignedCouriers.push(courier.id);
      }
    }

    return {
      matchedCount: matching,
      assignments,
      unassignedOrders,
      unassignedCouriers
    };
  }

  /**
   * Điều phối bưu tá gom nhiều đơn (Batch Multi-Order Fulfillment)
   * Mỗi bưu tá có thể nhận tối đa capacity đơn hàng trong cùng cụm
   */
  dispatchBatches(orders, couriers, maxOrdersPerCourier = 3) {
    const remainingOrders = [...orders];
    const allAssignments = [];
    const courierLoad = new Map();
    couriers.forEach(c => courierLoad.set(c.id, []));

    // Thực hiện lặp Hopcroft-Karp theo từng vòng (Rounds) cho đến khi đầy tải hoặc hết đơn
    for (let round = 0; round < maxOrdersPerCourier; round++) {
      if (remainingOrders.length === 0) break;

      const availableCouriers = couriers.filter(c => (courierLoad.get(c.id) || []).length < maxOrdersPerCourier);
      if (availableCouriers.length === 0) break;

      const res = this.solve(remainingOrders, availableCouriers);
      if (res.matchedCount === 0) break;

      for (const item of res.assignments) {
        courierLoad.get(item.courierId).push(item.orderId);
        allAssignments.push(item);
        const idx = remainingOrders.findIndex(o => o.id === item.orderId);
        if (idx !== -1) remainingOrders.splice(idx, 1);
      }
    }

    return {
      totalDispatched: allAssignments.length,
      unassignedOrdersCount: remainingOrders.length,
      courierBatches: Array.from(courierLoad.entries()).map(([courierId, orderIds]) => ({
        courierId,
        orderCount: orderIds.length,
        orderIds
      }))
    };
  }
}

export { HopcroftKarpLogisticsRouter };
export default HopcroftKarpLogisticsRouter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HopcroftKarpLogisticsRouter };
  }
} catch (e) {}
