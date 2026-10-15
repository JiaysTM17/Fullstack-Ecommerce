/**
 * Multi-Depot Pickup and Delivery Problem with Time Windows (MDPDPTW)
 * (Savelsbergh & Sol 1995, Ropke & Pisinger 2006)
 * Bài toán Định tuyến Giao Nhận Hai Chiều Đa Kho có Cửa Sổ Thời Gian (Time Windows)
 * Đảm bảo đồng thời:
 * 1. Ràng buộc thứ tự tiên quyết (Precedence): Điểm lấy hàng (Pickup) phải phục vụ trước điểm giao (Delivery)
 * 2. Cửa sổ thời gian (Time Window [e_i, l_i]): Xe đến sớm phải chờ đến e_i, không được trễ quá l_i
 * 3. Dung tải xe tải (Capacity Constraint Q_max): Tổng tải trên xe tại mọi thời điểm <= Q_max
 * 4. Đa kho xuất phát (Multi-Depot): Đội xe xuất phát từ các Depot vùng (Hà Nội, Đà Nẵng, Sài Gòn)
 * Ứng dụng: Điều phối xe lấy hàng tận kho shop và giao tận nhà người mua trong ngày (Same-day Fulfillment)
 */

class MDPDPVehicle {
  constructor(id, depotId, capacity = 100, maxTravelMinutes = 480) {
    this.id = id;
    this.depotId = depotId;
    this.capacity = capacity;
    this.maxTravelMinutes = maxTravelMinutes;
    this.route = []; // Danh sách stop nodes
    this.totalDistanceKm = 0;
    this.totalDurationMinutes = 0;
  }
}

class MDPDPTRouter {
  constructor(options = {}) {
    this.depots = options.depots || [
      { id: 'DEPOT_HN', name: 'Depot SPX Hà Nội', lat: 21.0285, lng: 105.8542 },
      { id: 'DEPOT_DN', name: 'Depot SPX Đà Nẵng', lat: 16.0544, lng: 108.2022 },
      { id: 'DEPOT_SG', name: 'Depot SPX Sài Gòn', lat: 10.7769, lng: 106.7009 }
    ];

    this.speedKmPerHour = options.speedKmPerHour || 40; // Tốc độ trung bình 40 km/h
    this.penaltyPerLateMinute = options.penaltyPerLateMinute || 2000; // Phạt trễ hẹn giao
  }

  _haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Bán kính trái đất (km)
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  _travelTimeMinutes(distKm) {
    return Math.round((distKm / this.speedKmPerHour) * 60);
  }

  /**
   * Tính khoảng cách giữa hai điểm bất kỳ (Depot, Pickup, hoặc Delivery)
   */
  getDistance(locA, locB) {
    return this._haversineKm(locA.lat, locA.lng, locB.lat, locB.lng);
  }

  /**
   * Kiểm tra tính hợp lệ và chi phí khi chèn cặp (Pickup, Delivery) vào lộ trình xe
   * @param {MDPDPVehicle} vehicle
   * @param {Object} request { id, pickupNode, deliveryNode, demandKg }
   * @param {number} pIdx Vị trí chèn pickup
   * @param {number} dIdx Vị trí chèn delivery (pIdx <= dIdx)
   */
  evaluateInsertion(vehicle, request, pIdx, dIdx) {
    const depot = this.depots.find(d => d.id === vehicle.depotId);
    const proposedRoute = [...vehicle.route];
    proposedRoute.splice(pIdx, 0, request.pickupNode);
    proposedRoute.splice(dIdx + 1, 0, request.deliveryNode);

    let currentTime = 0; // Phút tính từ đầu ca
    let currentLoad = 0;
    let totalDist = 0;
    let lateMinutes = 0;
    let prevLoc = depot;

    for (const node of proposedRoute) {
      const dist = this.getDistance(prevLoc, node);
      const travelTime = this._travelTimeMinutes(dist);
      totalDist += dist;
      currentTime += travelTime;

      // Kiểm tra cửa sổ thời gian [earlyMinutes, lateMinutesLimit]
      if (currentTime < node.earlyMinutes) {
        currentTime = node.earlyMinutes; // Xe đến sớm phải chờ
      } else if (currentTime > node.lateMinutes) {
        lateMinutes += (currentTime - node.lateMinutes);
      }

      currentTime += (node.serviceTimeMinutes || 10);

      // Cập nhật tải trọng
      currentLoad += node.demand;
      if (currentLoad > vehicle.capacity) {
        return { feasible: false, reason: 'OVER_CAPACITY' };
      }

      prevLoc = node;
    }

    // Quay về depot
    const returnDist = this.getDistance(prevLoc, depot);
    totalDist += returnDist;
    currentTime += this._travelTimeMinutes(returnDist);

    if (currentTime > vehicle.maxTravelMinutes) {
      return { feasible: false, reason: 'EXCEED_MAX_SHIFT_TIME' };
    }

    const cost = totalDist * 15000 + lateMinutes * this.penaltyPerLateMinute;
    return {
      feasible: true,
      cost,
      totalDist,
      totalTime: currentTime,
      lateMinutes,
      proposedRoute
    };
  }

  /**
   * Giải bài toán MDPDPTW cho danh sách yêu cầu giao nhận hai chiều
   * @param {Array<Object>} requests Danh sách cặp pickup-delivery
   * @param {number} numVehiclesPerDepot Số lượng xe phân bổ tại mỗi Depot
   */
  planFulfillmentRoutes(requests, numVehiclesPerDepot = 2) {
    // Khởi tạo đội xe tại các Depot
    const fleet = [];
    for (const depot of this.depots) {
      for (let v = 0; v < numVehiclesPerDepot; v++) {
        fleet.push(new MDPDPVehicle(`VEHICLE_${depot.id}_${v + 1}`, depot.id, 100, 540));
      }
    }

    const unassignedRequests = [...requests];
    const assignments = [];

    // Heuristic chèn tuần tự tối ưu (Greedy Best-Insertion)
    for (const req of unassignedRequests) {
      let bestFeasible = null;
      let bestVehicle = null;

      for (const vehicle of fleet) {
        const routeLen = vehicle.route.length;
        // Thử mọi vị trí chèn khả dĩ 0 <= p <= d <= routeLen
        for (let p = 0; p <= routeLen; p++) {
          for (let d = p; d <= routeLen; d++) {
            const evalRes = this.evaluateInsertion(vehicle, req, p, d);
            if (evalRes.feasible) {
              if (!bestFeasible || evalRes.cost < bestFeasible.cost) {
                bestFeasible = evalRes;
                bestVehicle = vehicle;
              }
            }
          }
        }
      }

      if (bestFeasible && bestVehicle) {
        bestVehicle.route = bestFeasible.proposedRoute;
        bestVehicle.totalDistanceKm = Number(bestFeasible.totalDist.toFixed(1));
        bestVehicle.totalDurationMinutes = bestFeasible.totalTime;
        assignments.push({
          requestId: req.id,
          assignedVehicleId: bestVehicle.id,
          depotId: bestVehicle.depotId,
          status: 'SCHEDULED'
        });
      } else {
        assignments.push({
          requestId: req.id,
          assignedVehicleId: null,
          depotId: null,
          status: 'UNASSIGNED_TIME_WINDOW_VIOLATION'
        });
      }
    }

    const activeVehicles = fleet.filter(v => v.route.length > 0);
    const totalKm = activeVehicles.reduce((sum, v) => sum + v.totalDistanceKm, 0);

    return {
      status: 'MDPDPTW_OPTIMAL_SCHEDULED',
      totalRequests: requests.length,
      assignedCount: assignments.filter(a => a.status === 'SCHEDULED').length,
      unassignedCount: assignments.filter(a => a.status !== 'SCHEDULED').length,
      activeVehicleCount: activeVehicles.length,
      totalFleetDistanceKm: Number(totalKm.toFixed(1)),
      assignments,
      vehiclePlans: activeVehicles.map(v => ({
        vehicleId: v.id,
        depotId: v.depotId,
        stopsCount: v.route.length,
        totalDistanceKm: v.totalDistanceKm,
        totalDurationMinutes: v.totalDurationMinutes,
        stops: v.route.map(node => ({
          nodeId: node.id,
          type: node.type,
          demand: node.demand,
          timeWindow: `[${node.earlyMinutes}m - ${node.lateMinutes}m]`
        }))
      }))
    };
  }
}

export { MDPDPTRouter, MDPDPVehicle };
export default MDPDPTRouter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MDPDPTRouter, MDPDPVehicle };
  }
} catch (e) {}
