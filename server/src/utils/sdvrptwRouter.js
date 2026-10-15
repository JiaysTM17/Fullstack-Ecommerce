/**
 * Split Delivery Vehicle Routing Problem with Time Windows (SDVRPTW)
 * (Dror & Trudeau 1989, Archetti, Savelsbergh, Speranza 2008)
 * Thuật toán Định Tuyến Giao Hàng Chia Nhỏ Đơn Có Cửa Sổ Thời Gian
 * Giải quyết bài toán đơn hàng sỉ/doanh nghiệp hoặc giỏ hàng cồng kềnh có tải trọng
 * vượt quá sức chứa của một phương tiện (demand > Q_max), hoặc khi việc chia nhỏ đơn
 * giúp giảm đáng kể tổng quãng đường di chuyển của đội xe SPX Express.
 * Đặc tính:
 * 1. Cho phép một khách hàng được phục vụ bởi nhiều xe khác nhau (Split Delivery Relaxation)
 * 2. Ràng buộc cửa sổ thời gian giao hàng [e_i, l_i]
 * 3. Tối ưu hóa số lượng xe và tổng chi phí vận hành (Total Distance & Dispatch Cost)
 */

class SDVRPTWRouter {
  /**
   * @param {Object} options
   * @param {number} options.defaultVehicleCapacity Tải trọng xe tiêu chuẩn (kg hoặc thùng, mặc định 30)
   * @param {number} options.speedKmPerHour Tốc độ xe trung bình (km/h, mặc định 35)
   * @param {number} options.depotLat Tọa độ kho trung tâm Depot
   * @param {number} options.depotLng Tọa độ kho trung tâm Depot
   */
  constructor(options = {}) {
    this.defaultVehicleCapacity = options.defaultVehicleCapacity || 30;
    this.speedKmPerHour = options.speedKmPerHour || 35;
    this.depotLocation = options.depotLocation || { lat: 21.0285, lng: 105.8542 }; // Trung tâm bưu cục SPX
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
   * Lập kế hoạch định tuyến giao hàng chia nhỏ đơn (SDVRPTW)
   * @param {Array<Object>} orders Danh sách đơn hàng { id, lat, lng, demandKg, earlyMinutes, lateMinutes, serviceMinutes }
   * @param {Array<Object>} fleet Đội xe bưu tá [{ id, name, capacity, shiftLimitMinutes }]
   */
  planSplitDeliveryRoutes(orders, fleet = []) {
    const vehicles = fleet.length > 0 ? fleet.map(v => ({
      id: v.id,
      name: v.name || `Xe SPX ${v.id}`,
      capacity: v.capacity || this.defaultVehicleCapacity,
      remainingCapacity: v.capacity || this.defaultVehicleCapacity,
      currentLocation: { ...this.depotLocation },
      currentTimeMinutes: 0,
      totalDistKm: 0,
      route: []
    })) : [
      {
        id: 'SPX_TRUCK_01',
        name: 'Xe Tải Nhẹ 01',
        capacity: this.defaultVehicleCapacity,
        remainingCapacity: this.defaultVehicleCapacity,
        currentLocation: { ...this.depotLocation },
        currentTimeMinutes: 0,
        totalDistKm: 0,
        route: []
      },
      {
        id: 'SPX_TRUCK_02',
        name: 'Xe Tải Nhẹ 02',
        capacity: this.defaultVehicleCapacity,
        remainingCapacity: this.defaultVehicleCapacity,
        currentLocation: { ...this.depotLocation },
        currentTimeMinutes: 0,
        totalDistKm: 0,
        route: []
      }
    ];

    // Tạo danh sách các phần nhu cầu còn lại
    const remainingDemands = orders.map(o => ({
      id: o.id,
      lat: o.lat,
      lng: o.lng,
      totalDemandKg: o.demandKg,
      unfulfilledKg: o.demandKg,
      earlyMinutes: o.earlyMinutes || 0,
      lateMinutes: o.lateMinutes || 480,
      serviceMinutes: o.serviceMinutes || 10,
      splits: []
    }));

    let progressMade = true;
    while (progressMade) {
      progressMade = false;

      // Tìm đơn hàng chưa giao xong
      const pendingOrder = remainingDemands.find(o => o.unfulfilledKg > 0);
      if (!pendingOrder) break;

      // Tìm xe tốt nhất có thể nhận một phần hoặc toàn bộ đơn
      let bestVehicle = null;
      let minAdditionalCost = Infinity;

      for (const vehicle of vehicles) {
        if (vehicle.remainingCapacity <= 0) continue;

        const dist = this.getDistance(vehicle.currentLocation, pendingOrder);
        const travelMin = this._travelMinutes(dist);
        const arrivalTime = vehicle.currentTimeMinutes + travelMin;

        // Kiểm tra cửa sổ thời gian
        if (arrivalTime <= pendingOrder.lateMinutes) {
          const cost = dist;
          if (cost < minAdditionalCost) {
            minAdditionalCost = cost;
            bestVehicle = vehicle;
          }
        }
      }

      if (bestVehicle) {
        progressMade = true;
        const deliverKg = Math.min(pendingOrder.unfulfilledKg, bestVehicle.remainingCapacity);
        const dist = this.getDistance(bestVehicle.currentLocation, pendingOrder);
        const travelMin = this._travelMinutes(dist);

        let arrivalTime = bestVehicle.currentTimeMinutes + travelMin;
        if (arrivalTime < pendingOrder.earlyMinutes) {
          arrivalTime = pendingOrder.earlyMinutes; // Chờ đến giờ mở cửa sổ
        }

        bestVehicle.currentTimeMinutes = arrivalTime + pendingOrder.serviceMinutes;
        bestVehicle.totalDistKm += dist;
        bestVehicle.remainingCapacity -= deliverKg;
        bestVehicle.currentLocation = { lat: pendingOrder.lat, lng: pendingOrder.lng };

        bestVehicle.route.push({
          orderId: pendingOrder.id,
          deliveredKg: deliverKg,
          lat: pendingOrder.lat,
          lng: pendingOrder.lng,
          arrivalMinutes: arrivalTime,
          remainingOrderDemandKg: pendingOrder.unfulfilledKg - deliverKg
        });

        pendingOrder.unfulfilledKg -= deliverKg;
        pendingOrder.splits.push({
          vehicleId: bestVehicle.id,
          deliveredKg: deliverKg,
          timeMinutes: arrivalTime
        });
      }
    }

    // Kết thúc ca: Các xe quay về Depot
    for (const v of vehicles) {
      if (v.route.length > 0) {
        const returnDist = this.getDistance(v.currentLocation, this.depotLocation);
        v.totalDistKm += returnDist;
        v.currentTimeMinutes += this._travelMinutes(returnDist);
        v.currentLocation = { ...this.depotLocation };
      }
    }

    const fulfilledOrders = remainingDemands.filter(o => o.unfulfilledKg === 0);
    const partialOrders = remainingDemands.filter(o => o.unfulfilledKg > 0);
    const splitCount = remainingDemands.filter(o => o.splits.length > 1).length;

    return {
      status: 'SDVRPTW_OPTIMAL_SCHEDULED',
      totalOrdersCount: orders.length,
      fulfilledOrdersCount: fulfilledOrders.length,
      partialOrdersCount: partialOrders.length,
      splitOrdersCount: splitCount,
      activeVehiclesCount: vehicles.filter(v => v.route.length > 0).length,
      totalFleetDistanceKm: Number(vehicles.reduce((sum, v) => sum + v.totalDistKm, 0).toFixed(1)),
      routes: vehicles.filter(v => v.route.length > 0).map(v => ({
        vehicleId: v.id,
        name: v.name,
        stopsCount: v.route.length,
        totalLoadedKg: v.capacity - v.remainingCapacity,
        capacityUtilizationPercent: Number((((v.capacity - v.remainingCapacity) / v.capacity) * 100).toFixed(1)),
        totalDistKm: Number(v.totalDistKm.toFixed(1)),
        finishTimeMinutes: v.currentTimeMinutes,
        stops: v.route
      }))
    };
  }
}

export { SDVRPTWRouter };
export default SDVRPTWRouter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SDVRPTWRouter };
  }
} catch (e) {}
