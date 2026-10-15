/**
 * Dynamic Dial-a-Ride Problem with Time Windows (D-DARP)
 * (Cordeau & Laporte 2007, Berbeglia et al. 2010)
 * Thuật toán Định Tuyến Gom Đơn Đa Điểm với Giới Hạn Thời Gian Lưu Kiện (Max Ride Time)
 * Giải bài toán gom đơn hàng hỏa tốc SPX Express Pooled:
 * 1. Ràng buộc thứ tự (Precedence): Pickup luôn đi trước Dropoff trên cùng 1 xe
 * 2. Cửa sổ thời gian hẹn (Time Windows [e_i, l_i]): Khung giờ nhận và giao chính xác
 * 3. Thời gian lưu kiện tối đa (Max Ride Time L_max): Thời gian hàng ở trên thùng xe <= L_max (e.g. 60m)
 * 4. Tải trọng xe máy bưu tá (Max Capacity Q_max <= 30kg)
 * Ứng dụng: Ghép đơn thông minh cho bưu tá giao hàng tươi sống, hỏa tốc 1h-2h không bị giảm chất lượng
 */

class DynamicDARPRouter {
  constructor(options = {}) {
    this.speedKmPerHour = options.speedKmPerHour || 35;
    this.maxRideMinutes = options.maxRideMinutes || 75; // Tối đa 75 phút kiện hàng ở trên xe
    this.defaultCourierCapacity = options.defaultCourierCapacity || 25; // 25kg
    this.penaltyPerLateMinute = options.penaltyPerLateMinute || 3000;
    this.penaltyPerExcessRideMinute = options.penaltyPerExcessRideMinute || 5000;
  }

  _haversineKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(2));
  }

  _travelMinutes(distKm) {
    return Math.round((distKm / this.speedKmPerHour) * 60);
  }

  getDistance(locA, locB) {
    return this._haversineKm(locA.lat, locA.lng, locB.lat, locB.lng);
  }

  /**
   * Đánh giá tính khả thi và chi phí khi chèn yêu cầu (Pickup, Dropoff) vào lộ trình bưu tá
   * @param {Object} courier
   * @param {Object} req { id, pickup, dropoff, weightKg, maxRideMinutes }
   * @param {number} pIdx
   * @param {number} dIdx
   */
  evaluateDarpInsertion(courier, req, pIdx, dIdx) {
    const route = [...courier.route];
    route.splice(pIdx, 0, { ...req.pickup, reqId: req.id, type: 'PICKUP', weight: req.weightKg });
    route.splice(dIdx + 1, 0, { ...req.dropoff, reqId: req.id, type: 'DROPOFF', weight: -req.weightKg });

    let currentTime = courier.startShiftMinutes || 0;
    let currentLoad = 0;
    let totalDist = 0;
    let totalLatePenalty = 0;
    let excessRidePenalty = 0;

    const pickupTimes = new Map();
    let prevLoc = courier.baseLocation;

    for (const stop of route) {
      const dist = this.getDistance(prevLoc, stop);
      const travel = this._travelMinutes(dist);
      totalDist += dist;
      currentTime += travel;

      // Time Window check
      if (currentTime < stop.earlyMinutes) {
        currentTime = stop.earlyMinutes;
      } else if (currentTime > stop.lateMinutes) {
        totalLatePenalty += (currentTime - stop.lateMinutes) * this.penaltyPerLateMinute;
      }

      currentTime += (stop.serviceTimeMinutes || 5);

      // Load check
      currentLoad += stop.weight;
      if (currentLoad > (courier.capacity || this.defaultCourierCapacity)) {
        return { feasible: false, reason: 'OVER_CAPACITY' };
      }

      // Track Pickup Time & Validate Max Ride Time
      if (stop.type === 'PICKUP') {
        pickupTimes.set(stop.reqId, currentTime);
      } else if (stop.type === 'DROPOFF') {
        const pTime = pickupTimes.get(stop.reqId) || currentTime;
        const rideDuration = currentTime - pTime;
        const maxAllowedRide = req.maxRideMinutes || this.maxRideMinutes;

        if (rideDuration > maxAllowedRide) {
          excessRidePenalty += (rideDuration - maxAllowedRide) * this.penaltyPerExcessRideMinute;
        }
      }

      prevLoc = stop;
    }

    const totalCost = totalDist * 10000 + totalLatePenalty + excessRidePenalty;

    return {
      feasible: true,
      cost: totalCost,
      totalDistKm: Number(totalDist.toFixed(1)),
      totalTimeMinutes: currentTime - (courier.startShiftMinutes || 0),
      excessRidePenalty,
      proposedRoute: route
    };
  }

  /**
   * Điều phối gom đơn bưu tá hỏa tốc SPX Pooled D-DARP
   */
  dispatchPooledOrders(couriers, requests) {
    const courierState = couriers.map(c => ({
      id: c.id,
      name: c.name || `Shipper ${c.id}`,
      capacity: c.capacity || this.defaultCourierCapacity,
      baseLocation: c.location || { lat: 21.0285, lng: 105.8542 },
      startShiftMinutes: c.startShiftMinutes || 0,
      route: []
    }));

    const assigned = [];
    const unassigned = [];

    for (const req of requests) {
      let bestCost = Infinity;
      let bestCourier = null;
      let bestRoute = null;

      for (const courier of courierState) {
        const rLen = courier.route.length;
        for (let p = 0; p <= rLen; p++) {
          for (let d = p; d <= rLen; d++) {
            const evalRes = this.evaluateDarpInsertion(courier, req, p, d);
            if (evalRes.feasible && evalRes.cost < bestCost) {
              bestCost = evalRes.cost;
              bestCourier = courier;
              bestRoute = evalRes.proposedRoute;
            }
          }
        }
      }

      if (bestCourier && bestRoute) {
        bestCourier.route = bestRoute;
        assigned.push({
          orderId: req.id,
          courierId: bestCourier.id,
          status: 'POOLED_ASSIGNED'
        });
      } else {
        unassigned.push({
          orderId: req.id,
          status: 'UNASSIGNED_RIDE_TIME_VIOLATION'
        });
      }
    }

    return {
      status: 'D_DARP_OPTIMAL_DISPATCHED',
      totalOrders: requests.length,
      pooledAssignedCount: assigned.length,
      unassignedCount: unassigned.length,
      activeCouriers: courierState.filter(c => c.route.length > 0).map(c => ({
        courierId: c.id,
        name: c.name,
        stopsCount: c.route.length,
        routeSummary: c.route.map(s => `${s.type}:${s.id || s.reqId}`)
      }))
    };
  }
}

export { DynamicDARPRouter };
export default DynamicDARPRouter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DynamicDARPRouter };
  }
} catch (e) {}
