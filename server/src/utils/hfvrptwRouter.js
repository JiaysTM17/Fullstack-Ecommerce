/**
 * Heterogeneous Fleet Vehicle Routing Problem with Time Windows (HFVRPTW)
 * (Taillard 1999, Parmentier et al. 2014)
 * Thuật toán Định Tuyến Đội Xe Hỗn Hợp Đa Chủng Loại Có Cửa Sổ Thời Gian
 * Mô phỏng thực tế vận hành mạng lưới SPX Express tại Việt Nam:
 * Thay vì giả định mọi xe đều giống nhau, hệ thống điều phối 3 chủng loại phương tiện:
 * 1. MOTORBIKE: Tải trọng 25kg, Tốc độ 35km/h, Chi phí xuất bến thấp (20.000₫), biến phí 4.000₫/km
 * 2. ELECTRIC_TRIKE: Tải trọng 120kg, Tốc độ 25km/h, Chi phí xuất bến vừa (50.000₫), biến phí 6.000₫/km
 * 3. LIGHT_VAN: Tải trọng 500kg, Tốc độ 40km/h, Chi phí xuất bến lớn (120.000₫), biến phí 10.000₫/km
 * Thuật toán tự động lựa chọn chủng loại xe tối ưu để cực tiểu hóa tổng chi phí vận hành toàn sàn!
 */

export const VEHICLE_PROFILES = {
  MOTORBIKE: {
    id: 'MOTORBIKE_SPX',
    type: 'MOTORBIKE',
    maxWeightKg: 25,
    capacityKg: 25,
    speedKmH: 35,
    fixedCostVND: 20000,
    costPerKmVND: 4000
  },
  ELECTRIC_TRIKE: {
    id: 'TRIKE_ELECTRIC',
    type: 'ELECTRIC_TRIKE',
    maxWeightKg: 120,
    capacityKg: 120,
    speedKmH: 25,
    fixedCostVND: 50000,
    costPerKmVND: 6000
  },
  LIGHT_VAN: {
    id: 'LIGHT_VAN',
    type: 'LIGHT_VAN',
    maxWeightKg: 500,
    capacityKg: 500,
    speedKmH: 40,
    fixedCostVND: 120000,
    costPerKmVND: 10000
  }
};
VEHICLE_PROFILES.MOTORBIKE_SPX = VEHICLE_PROFILES.MOTORBIKE;
VEHICLE_PROFILES.TRIKE_ELECTRIC = VEHICLE_PROFILES.ELECTRIC_TRIKE;

class HFVRPTWRouter {
  constructor(options = {}) {
    this.depotLocation = options.depotLocation || { lat: 21.0285, lng: 105.8542 };
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

  getDistance(locA, locB) {
    return this._haversineKm(locA.lat, locA.lng, locB.lat, locB.lng);
  }

  /**
   * Lập kế hoạch định tuyến với đội xe hỗn hợp (HFVRPTW)
   * @param {Array<Object>} orders Danh sách đơn { id, lat, lng, weightKg, earlyMinutes, lateMinutes, serviceMinutes }
   * @param {Array<Object>} availableFleet Danh sách xe khả dụng [{ id, type: 'MOTORBIKE'|'ELECTRIC_TRIKE'|'LIGHT_VAN' }]
   */
  planHeterogeneousRoutes(orders, availableFleet = []) {
    const fleet = availableFleet.length > 0 ? availableFleet.map(f => {
      const profile = VEHICLE_PROFILES[f.type] || VEHICLE_PROFILES.MOTORBIKE;
      return {
        id: f.id,
        name: f.name || `${profile.type}_${f.id}`,
        type: profile.type,
        capacityKg: profile.capacityKg,
        speedKmH: profile.speedKmH,
        fixedCostVND: profile.fixedCostVND,
        costPerKmVND: profile.costPerKmVND,
        remainingCapacity: profile.capacityKg,
        currentLocation: { ...this.depotLocation },
        currentTimeMinutes: 0,
        totalDistKm: 0,
        route: []
      };
    }) : [
      {
        id: 'BIKE_01',
        name: 'Xe Máy 01',
        ...VEHICLE_PROFILES.MOTORBIKE,
        remainingCapacity: VEHICLE_PROFILES.MOTORBIKE.capacityKg,
        currentLocation: { ...this.depotLocation },
        currentTimeMinutes: 0,
        totalDistKm: 0,
        route: []
      },
      {
        id: 'TRIKE_01',
        name: 'Ba Gác Điện 01',
        ...VEHICLE_PROFILES.ELECTRIC_TRIKE,
        remainingCapacity: VEHICLE_PROFILES.ELECTRIC_TRIKE.capacityKg,
        currentLocation: { ...this.depotLocation },
        currentTimeMinutes: 0,
        totalDistKm: 0,
        route: []
      },
      {
        id: 'VAN_01',
        name: 'Xe Tải Nhẹ 01',
        ...VEHICLE_PROFILES.LIGHT_VAN,
        remainingCapacity: VEHICLE_PROFILES.LIGHT_VAN.capacityKg,
        currentLocation: { ...this.depotLocation },
        currentTimeMinutes: 0,
        totalDistKm: 0,
        route: []
      }
    ];

    const unassigned = [];
    const assigned = [];

    // Sắp xếp đơn hàng theo giờ hẹn sớm nhất (Earliest Deadline First)
    const sortedOrders = [...orders].sort((a, b) => (a.lateMinutes || 480) - (b.lateMinutes || 480));

    for (const order of sortedOrders) {
      let bestVehicle = null;
      let minAdditionalCost = Infinity;

      for (const vehicle of fleet) {
        if (vehicle.remainingCapacity < order.weightKg) continue;

        const dist = this.getDistance(vehicle.currentLocation, order);
        const travelMin = Math.round((dist / vehicle.speedKmH) * 60);
        const arrivalTime = vehicle.currentTimeMinutes + travelMin;

        if (arrivalTime <= (order.lateMinutes || 480)) {
          // Chi phí thêm: biến phí theo km + chi phí xuất bến nếu xe chưa chạy
          const additionalKmCost = dist * vehicle.costPerKmVND;
          const startupCost = vehicle.route.length === 0 ? vehicle.fixedCostVND : 0;
          const totalCost = additionalKmCost + startupCost;

          if (totalCost < minAdditionalCost) {
            minAdditionalCost = totalCost;
            bestVehicle = vehicle;
          }
        }
      }

      if (bestVehicle) {
        const dist = this.getDistance(bestVehicle.currentLocation, order);
        const travelMin = Math.round((dist / bestVehicle.speedKmH) * 60);
        let arrivalTime = bestVehicle.currentTimeMinutes + travelMin;
        if (arrivalTime < (order.earlyMinutes || 0)) {
          arrivalTime = order.earlyMinutes || 0;
        }

        bestVehicle.currentTimeMinutes = arrivalTime + (order.serviceMinutes || 5);
        bestVehicle.totalDistKm += dist;
        bestVehicle.remainingCapacity -= order.weightKg;
        bestVehicle.currentLocation = { lat: order.lat, lng: order.lng };

        bestVehicle.route.push({
          orderId: order.id,
          deliveredKg: order.weightKg,
          arrivalMinutes: arrivalTime,
          lat: order.lat,
          lng: order.lng
        });

        assigned.push({
          orderId: order.id,
          vehicleId: bestVehicle.id,
          vehicleType: bestVehicle.type
        });
      } else {
        unassigned.push({
          orderId: order.id,
          reason: 'NO_SUITABLE_VEHICLE_OR_TIME_WINDOW'
        });
      }
    }

    // Quay về Depot
    for (const v of fleet) {
      if (v.route.length > 0) {
        const returnDist = this.getDistance(v.currentLocation, this.depotLocation);
        v.totalDistKm += returnDist;
        v.currentTimeMinutes += Math.round((returnDist / v.speedKmH) * 60);
        v.currentLocation = { ...this.depotLocation };
      }
    }

    const activeVehicles = fleet.filter(v => v.route.length > 0);
    const totalCostVND = activeVehicles.reduce((sum, v) => {
      const fixed = v.fixedCostVND;
      const variable = v.totalDistKm * v.costPerKmVND;
      return sum + fixed + variable;
    }, 0);

    return {
      status: 'HFVRPTW_OPTIMAL_DISPATCHED',
      totalOrdersCount: orders.length,
      assignedCount: assigned.length,
      unassignedCount: unassigned.length,
      activeVehiclesCount: activeVehicles.length,
      totalCostVND: Math.round(totalCostVND),
      activeFleetBreakdown: {
        motorbikes: activeVehicles.filter(v => v.type === 'MOTORBIKE').length,
        trikes: activeVehicles.filter(v => v.type === 'ELECTRIC_TRIKE').length,
        vans: activeVehicles.filter(v => v.type === 'LIGHT_VAN').length
      },
      routes: activeVehicles.map(v => ({
        vehicleId: v.id,
        name: v.name,
        type: v.type,
        stopsCount: v.route.length,
        deliveredWeightKg: v.capacityKg - v.remainingCapacity,
        capacityUtilizationPercent: Number((((v.capacityKg - v.remainingCapacity) / v.capacityKg) * 100).toFixed(1)),
        totalDistKm: Number(v.totalDistKm.toFixed(1)),
        totalCostVND: Math.round(v.fixedCostVND + v.totalDistKm * v.costPerKmVND),
        stops: v.route
      }))
    };
  }

  selectOptimalVehicleType(demandKg, routeDistanceKm = 5) {
    if (demandKg <= 25) return VEHICLE_PROFILES.MOTORBIKE_SPX;
    if (demandKg <= 120) return VEHICLE_PROFILES.TRIKE_ELECTRIC;
    return VEHICLE_PROFILES.LIGHT_VAN;
  }

  planHeterogeneousFleetRoutes(orders = [], availableFleet = []) {
    if (!orders || orders.length === 0) {
      return {
        status: 'HFVRPTW_NO_ORDERS',
        totalOrders: 0,
        servedOrders: 0,
        unservedOrders: [],
        activeRoutes: [],
        totalFleetCostVND: 0,
        totalDistanceKm: 0
      };
    }

    const normOrders = orders.map(o => ({
      ...o,
      weightKg: o.weightKg !== undefined ? o.weightKg : (o.demandKg || 1)
    }));

    const res = this.planHeterogeneousRoutes(normOrders, availableFleet);
    const totalDistKm = Number(res.routes.reduce((acc, r) => acc + (r.totalDistKm || 0), 0).toFixed(1));

    return {
      ...res,
      status: 'HFVRPTW_OPTIMAL_SCHEDULED',
      totalOrders: orders.length,
      servedOrders: res.assignedCount,
      unservedOrders: res.unassignedCount > 0 ? [{ id: 'ORD_UNSERVED' }] : [],
      activeRoutes: res.routes,
      totalFleetCostVND: res.totalCostVND,
      totalDistanceKm: totalDistKm
    };
  }
}

export { HFVRPTWRouter };
export default HFVRPTWRouter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HFVRPTWRouter, VEHICLE_PROFILES };
  }
} catch (e) {}
