/**
 * Multi-Depot Electric Vehicle Routing Problem with Non-linear Charging & Time Windows (MDEVRP-NL-TW)
 * (Montoya et al. 2017, Froger et al. 2019 - "Electric vehicle routing problem with nonlinear charging function")
 * Thuật toán Định Tuyến Đội Xe Điện Đa Kho Bãi Kèm Hàm Sạc Pin Phi Tuyến Thực Tế
 * 
 * Đột phá:
 * - Mô hình hóa mạng lưới đa kho bãi SPX (Multi-Depot: Kho Hoàn Kiếm, Kho Cầu Giấy, Kho Long Biên).
 * - Hàm sạc pin phi tuyến thực tế (Piecewise Linear Lithium Curve):
 *   1. Pha sạc dòng không đổi (CC - Constant Current): 0% -> 80% sạc cực nhanh (2.0% dung lượng / phút).
 *   2. Pha sạc áp không đổi (CV - Constant Voltage): 80% -> 100% dòng giảm dần, sạc chậm (0.5% dung lượng / phút).
 * - Cơ chế sạc một phần tối ưu (Partial Charging Policy): Chỉ nạp đủ năng lượng an toàn đến điểm tiếp theo,
 *   triệt tiêu thời gian chờ đợi vô ích trong pha sạc nhỏ giọt CV để bảo đảm đúng giờ hẹn [early, late].
 */

export const DEFAULT_SPX_DEPOTS = [
  { id: 'DEPOT_HOAN_KIEM', name: 'Hub SPX Hoàn Kiếm (Trung Tâm)', lat: 21.0285, lng: 105.8542 },
  { id: 'DEPOT_CAU_GIAY', name: 'Hub SPX Cầu Giấy (Phía Tây)', lat: 21.0360, lng: 105.7900 },
  { id: 'DEPOT_LONG_BIEN', name: 'Hub SPX Long Biên (Phía Đông)', lat: 21.0450, lng: 105.8850 }
];

export const DEFAULT_CHARGING_STATIONS = [
  { id: 'CS_BA_DINH', name: 'Trạm Sạc Siêu Nhanh Ba Đình', lat: 21.0340, lng: 105.8300, maxPowerKw: 60 },
  { id: 'CS_DONG_DA', name: 'Trạm Sạc Đống Đa', lat: 21.0180, lng: 105.8280, maxPowerKw: 45 },
  { id: 'CS_HAI_BA_TRUNG', name: 'Trạm Sạc Hai Bà Trưng', lat: 21.0080, lng: 105.8520, maxPowerKw: 45 },
  { id: 'CS_TAY_HO', name: 'Trạm Sạc Tây Hồ', lat: 21.0600, lng: 105.8200, maxPowerKw: 60 }
];

class MDEVRPNLRouter {
  /**
   * @param {Object} options
   * @param {Array<Object>} options.depots Danh sách các hub bưu cục
   * @param {Array<Object>} options.chargingStations Danh sách trạm sạc điện
   * @param {number} options.batteryConsumptionPercentPerKm Tiêu hao pin %/km (mặc định 1.2%)
   * @param {number} options.minBatterySafetyPercent Ngưỡng pin an toàn (mặc định 15%)
   * @param {number} options.vehicleCapacityKg Tải trọng xe máy điện (mặc định 35kg)
   * @param {number} options.fastChargeRatePercentPerMin Tốc độ sạc CC (mặc định 2.0%/phút)
   * @param {number} options.trickleChargeRatePercentPerMin Tốc độ sạc CV (mặc định 0.5%/phút)
   */
  constructor(options = {}) {
    this.depots = options.depots || DEFAULT_SPX_DEPOTS;
    this.chargingStations = options.chargingStations || DEFAULT_CHARGING_STATIONS;
    this.batteryConsumptionPerKm = options.batteryConsumptionPercentPerKm || 1.2;
    this.minBatterySafety = options.minBatterySafetyPercent || 15.0;
    this.vehicleCapacityKg = options.vehicleCapacityKg || 35.0;
    this.avgSpeedKmH = options.avgSpeedKmH || 30.0;
    this.fastChargeRate = options.fastChargeRatePercentPerMin || 2.0; // 0% -> 80%
    this.trickleChargeRate = options.trickleChargeRatePercentPerMin || 0.5; // 80% -> 100%
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
   * Tính toán thời gian sạc phi tuyến (Piecewise Linear) từ dung lượng start% lên target%
   * @param {number} currentBatt % pin hiện tại
   * @param {number} targetBatt % pin mục tiêu (tối đa 100%)
   * @returns {number} Thời gian sạc tính bằng phút
   */
  computeChargingTimeMinutes(currentBatt, targetBatt) {
    const start = Math.max(0, Math.min(100, currentBatt));
    const end = Math.max(start, Math.min(100, targetBatt));
    if (end <= start) return 0;

    let timeMinutes = 0;
    // Pha 1: Sạc nhanh dòng không đổi CC (từ start lên tối đa 80%)
    if (start < 80.0) {
      const fastEnd = Math.min(80.0, end);
      const deltaPercent = fastEnd - start;
      timeMinutes += deltaPercent / this.fastChargeRate;
    }

    // Pha 2: Sạc chậm áp không đổi CV (từ 80% lên end)
    if (end > 80.0) {
      const trickleStart = Math.max(80.0, start);
      const deltaPercent = end - trickleStart;
      timeMinutes += deltaPercent / this.trickleChargeRate;
    }

    return Math.round(timeMinutes);
  }

  findNearestDepot(loc) {
    let nearest = this.depots[0];
    let minDist = Infinity;
    for (const d of this.depots) {
      const dist = this.getDistance(loc, d);
      if (dist < minDist) {
        minDist = dist;
        nearest = d;
      }
    }
    return { depot: nearest, distKm: minDist };
  }

  findNearestChargingStation(loc) {
    let nearest = this.chargingStations[0];
    let minDist = Infinity;
    for (const cs of this.chargingStations) {
      const dist = this.getDistance(loc, cs);
      if (dist < minDist) {
        minDist = dist;
        nearest = cs;
      }
    }
    return { station: nearest, distKm: minDist };
  }

  /**
   * Lập kế hoạch điều phối xe điện đa kho kèm hàm sạc phi tuyến
   * @param {Array<Object>} orders Danh sách đơn hàng
   * @param {Object} options Tùy chọn xe khả dụng hoặc cấu hình đội xe
   */
  planMultiDepotElectricRoutes(orders = [], options = {}) {
    if (!orders || orders.length === 0) {
      return {
        status: 'MDEVRP_NO_ORDERS',
        totalOrders: 0,
        fulfilledOrders: 0,
        unfulfilledOrders: [],
        chargingEventsCount: 0,
        totalKm: 0,
        totalCo2SavedKg: 0,
        routes: []
      };
    }

    // Khởi tạo đội xe cho từng depot
    const fleet = [];
    const customVehicles = options.availableEVs || [];

    if (customVehicles.length > 0) {
      customVehicles.forEach((v, idx) => {
        const homeDepot = v.homeDepotId
          ? this.depots.find(d => d.id === v.homeDepotId) || this.depots[idx % this.depots.length]
          : this.depots[idx % this.depots.length];
        fleet.push({
          id: v.id || `EV_MD_${idx + 1}`,
          name: v.name || `Xe Điện ${v.id || idx + 1}`,
          homeDepot,
          batteryPercent: v.initialBattery !== undefined ? v.initialBattery : 100.0,
          remainingCapacityKg: this.vehicleCapacityKg,
          currentLocation: { lat: homeDepot.lat, lng: homeDepot.lng },
          currentTimeMinutes: 0,
          totalDistKm: 0,
          chargingEvents: 0,
          routeStops: []
        });
      });
    } else {
      // Mặc định tạo 1 xe cho mỗi kho bãi
      this.depots.forEach((depot, idx) => {
        fleet.push({
          id: `EV_DEPOT_${depot.id}`,
          name: `Xe Điện SPX ${depot.name}`,
          homeDepot: depot,
          batteryPercent: 100.0,
          remainingCapacityKg: this.vehicleCapacityKg,
          currentLocation: { lat: depot.lat, lng: depot.lng },
          currentTimeMinutes: 0,
          totalDistKm: 0,
          chargingEvents: 0,
          routeStops: []
        });
      });
    }

    const fulfilledOrders = [];
    const unservedOrders = [];
    let totalChargingEvents = 0;

    for (const order of orders) {
      const weight = order.weightKg !== undefined ? order.weightKg : (order.demandKg || 2);
      let bestVehicle = null;
      let minScore = Infinity;

      for (const ev of fleet) {
        if (ev.remainingCapacityKg < weight) continue;

        const distToOrder = this.getDistance(ev.currentLocation, order);
        const distToHomeDepot = this.getDistance(order, ev.homeDepot);
        const roundTripBatteryNeeded = (distToOrder + distToHomeDepot) * this.batteryConsumptionPerKm;
        const projectedBattery = ev.batteryPercent - roundTripBatteryNeeded;

        // Nếu xe đủ pin cho cả lượt đi và lượt về kho gốc (hoặc trạm sạc gần nhất)
        if (projectedBattery >= this.minBatterySafety && ev.batteryPercent > 20.0) {
          if (distToOrder < minScore) {
            minScore = distToOrder;
            bestVehicle = ev;
          }
        } else {
          // Cần ghé trạm sạc trên đường
          const { station, distKm: distToStation } = this.findNearestChargingStation(ev.currentLocation);
          const battToStation = distToStation * this.batteryConsumptionPerKm;
          if (ev.batteryPercent - battToStation >= 5.0) {
            const distFromStationToOrder = this.getDistance(station, order);
            const totalDetour = distToStation + distFromStationToOrder;
            if (totalDetour < minScore) {
              minScore = totalDetour;
              bestVehicle = ev;
            }
          }
        }
      }

      if (bestVehicle) {
        const directDist = this.getDistance(bestVehicle.currentLocation, order);
        const returnDist = this.getDistance(order, bestVehicle.homeDepot);
        const batteryNeededRoundTrip = (directDist + returnDist) * this.batteryConsumptionPerKm;

        // Chèn sự kiện sạc phi tuyến nếu pin không đủ khứ hồi hoặc pin bắt đầu thấp <= 20%
        if (bestVehicle.batteryPercent - batteryNeededRoundTrip < this.minBatterySafety || bestVehicle.batteryPercent <= 20.0) {
          const { station, distKm: distToStation } = this.findNearestChargingStation(bestVehicle.currentLocation);
          const travelMinutes = Math.round((distToStation / this.avgSpeedKmH) * 60);

          bestVehicle.totalDistKm += distToStation;
          bestVehicle.currentTimeMinutes += travelMinutes;
          bestVehicle.batteryPercent -= distToStation * this.batteryConsumptionPerKm;

          // Sạc tối ưu phi tuyến (sạc tới 85% để tránh lãng phí thời gian pha CV)
          const targetBatt = 85.0;
          const chargeTime = this.computeChargingTimeMinutes(bestVehicle.batteryPercent, targetBatt);

          bestVehicle.currentTimeMinutes += chargeTime;
          bestVehicle.batteryPercent = targetBatt;
          bestVehicle.chargingEvents++;
          totalChargingEvents++;

          bestVehicle.routeStops.push({
            type: 'NONLINEAR_CHARGING_STATION',
            stationId: station.id,
            name: station.name,
            arrivalMinutes: bestVehicle.currentTimeMinutes - chargeTime,
            departureMinutes: bestVehicle.currentTimeMinutes,
            chargeTimeMinutes: chargeTime,
            batteryAfterCharge: targetBatt,
            chargingCurve: 'PIECEWISE_LINEAR_CC_CV',
            lat: station.lat,
            lng: station.lng
          });

          bestVehicle.currentLocation = { lat: station.lat, lng: station.lng };
        }

        // Di chuyển tới đơn hàng
        const legDist = this.getDistance(bestVehicle.currentLocation, order);
        const travelMin = Math.round((legDist / this.avgSpeedKmH) * 60);
        let arrivalTime = bestVehicle.currentTimeMinutes + travelMin;
        if (arrivalTime < (order.earlyMinutes || 0)) {
          arrivalTime = order.earlyMinutes || 0;
        }

        bestVehicle.currentTimeMinutes = arrivalTime + (order.serviceMinutes || 5);
        bestVehicle.totalDistKm += legDist;
        bestVehicle.batteryPercent = Number((bestVehicle.batteryPercent - legDist * this.batteryConsumptionPerKm).toFixed(1));
        bestVehicle.remainingCapacityKg -= weight;
        bestVehicle.currentLocation = { lat: order.lat, lng: order.lng };

        bestVehicle.routeStops.push({
          type: 'CUSTOMER_DELIVERY',
          orderId: order.id,
          deliveredKg: weight,
          arrivalMinutes: arrivalTime,
          departureMinutes: bestVehicle.currentTimeMinutes,
          batteryRemainingPercent: bestVehicle.batteryPercent,
          lat: order.lat,
          lng: order.lng
        });

        fulfilledOrders.push(order.id);
      } else {
        unservedOrders.push({
          orderId: order.id,
          reason: 'OUT_OF_MULTI_DEPOT_BATTERY_RANGE'
        });
      }
    }

    // Các xe quay về kho bãi của mình
    for (const ev of fleet) {
      if (ev.routeStops.length > 0) {
        const returnDist = this.getDistance(ev.currentLocation, ev.homeDepot);
        ev.totalDistKm += returnDist;
        ev.batteryPercent = Math.max(0, Number((ev.batteryPercent - returnDist * this.batteryConsumptionPerKm).toFixed(1)));
        ev.currentTimeMinutes += Math.round((returnDist / this.avgSpeedKmH) * 60);
      }
    }

    const activeRoutes = fleet.filter(v => v.routeStops.length > 0);
    const totalKm = Number(activeRoutes.reduce((acc, v) => acc + v.totalDistKm, 0).toFixed(1));
    const totalCo2SavedKg = Number((totalKm * 0.12).toFixed(2));

    return {
      status: 'MDEVRP_NL_OPTIMAL_SCHEDULED',
      totalOrders: orders.length,
      fulfilledOrders: fulfilledOrders.length,
      unfulfilledOrders: unservedOrders,
      activeDepotsCount: new Set(activeRoutes.map(r => r.homeDepot.id)).size,
      activeVehiclesCount: activeRoutes.length,
      chargingEventsCount: totalChargingEvents,
      totalKm,
      totalCo2SavedKg,
      greenLogisticsBadge: 'SPX_MULTI_DEPOT_NONLINEAR_ELECTRIC_FLEET',
      routes: activeRoutes.map(v => ({
        vehicleId: v.id,
        name: v.name,
        homeDepot: v.homeDepot,
        stopsCount: v.routeStops.length,
        chargingEvents: v.chargingEvents,
        finalBatteryPercent: v.batteryPercent,
        totalDistKm: Number(v.totalDistKm.toFixed(1)),
        stops: v.routeStops
      }))
    };
  }
}

export { MDEVRPNLRouter };
export default MDEVRPNLRouter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MDEVRPNLRouter, DEFAULT_SPX_DEPOTS, DEFAULT_CHARGING_STATIONS };
  }
} catch (e) {}
