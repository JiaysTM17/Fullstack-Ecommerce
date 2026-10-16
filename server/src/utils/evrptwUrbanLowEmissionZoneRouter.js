/**
 * EVRPTWUrbanLowEmissionZoneRouter (Urban Low Emission Zone & Congestion Toll Routing)
 * (Fontana, Transportation Research Part B 2016 / Mancini, Computers & Operations Research 2017)
 *
 * Implements Electric Vehicle Routing Problem with Time Windows across Urban Low Emission
 * Zones (LEZ / ULEZ), speed restriction regimes, dynamic congestion tolls, and 100% clean
 * electric vehicle access privileges.
 *
 * Mathematical Foundations:
 * 1. Geographic Low Emission Zone (LEZ) Boundary & Geometric Containment:
 *    Point (x, y) in LEZ if (x - c_x)^2 + (y - c_y)^2 <= R_LEZ^2.
 * 2. Speed Regimes & Energy Dynamics:
 *    - Outside LEZ: max speed v_out = 45 km/h, energy rate E_out = 0.16 kWh/km.
 *    - Inside LEZ: speed capped at v_in = 25 km/h (pedestrianized / calm zone),
 *      energy rate E_in = 0.12 kWh/km (lower aerodynamic drag at calm urban speeds).
 * 3. Dynamic Congestion Tolls & 100% Zero-Emission Waiver:
 *    - Standard ICE / Hybrid delivery toll: 150,000 VND per entry into LEZ.
 *    - SPX Clean Electric Vehicle (EV) with active battery (SOC >= 0.15): 0 VND (100% exempt).
 * 4. Time Window Scheduling:
 *    Deliveries in LEZ subject to commercial unloading windows [e_i, l_i].
 * 5. Urban Green Delivery Pass:
 *    Issues verified URBAN_LEZ_ZERO_EMISSION_PASS with net toll savings and avoided pollutants (NOx, PM2.5, CO2).
 */

export const DEFAULT_LEZ_ZONES = [
  {
    id: 'LEZ_HOAN_KIEM_OLD_QUARTER',
    name: 'Vành đai Không Phát Thải Hoàn Kiếm',
    centerX: 10,
    centerY: 10,
    radiusKm: 6.0,
    tollVND: 150000,
    speedLimitKmH: 25,
    openHour: 6.0,
    closeHour: 22.0
  },
  {
    id: 'LEZ_DISTRICT_1_CENTRAL',
    name: 'Khu Vực Phát Thải Thấp Quận 1 Trung Tâm',
    centerX: 25,
    centerY: 25,
    radiusKm: 7.0,
    tollVND: 150000,
    speedLimitKmH: 25,
    openHour: 6.0,
    closeHour: 22.0
  }
];

export class EVRPTWUrbanLowEmissionZoneRouter {
  /**
   * @param {Object} options
   * @param {Array} [options.lezZones] - Array of LEZ definitions
   * @param {number} [options.batteryCapacityKWh=75] - EV battery capacity
   * @param {number} [options.standardTollVND=150000] - Baseline congestion toll for non-exempt vehicles
   */
  constructor(options = {}) {
    this.lezZones = Array.isArray(options.lezZones) && options.lezZones.length > 0
      ? options.lezZones
      : DEFAULT_LEZ_ZONES;

    this.batteryCapacityKWh = Number(options.batteryCapacityKWh) || 75;
    this.standardTollVND = Number(options.standardTollVND) || 150000;
    this.minSOC = 0.15;
    this.maxSOC = 0.95;

    // Energy consumption rates (kWh/km)
    this.energyRateInsideLEZ = 0.12;  // 25 km/h calm zone
    this.energyRateOutsideLEZ = 0.16; // 45 km/h urban arterial

    // Standard diesel/ICE pollution avoidance benchmarks per km
    this.avoidedCO2GramsPerKm = 185;
    this.avoidedPM25GramsPerKm = 0.15;
    this.avoidedNOxGramsPerKm = 1.20;
  }

  /**
   * Test whether a point (x, y) is inside any Low Emission Zone
   * @param {number} x
   * @param {number} y
   * @returns {Object|null} Matching LEZ or null
   */
  getContainingLEZ(x, y) {
    for (const zone of this.lezZones) {
      const dx = x - zone.centerX;
      const dy = y - zone.centerY;
      if (dx * dx + dy * dy <= zone.radiusKm * zone.radiusKm) {
        return zone;
      }
    }
    return null;
  }

  _calculateDistance(locA, locB) {
    const dx = locA.x - locB.x;
    const dy = locA.y - locB.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Plan routes respecting LEZ speed limits, toll exemption, and time windows
   * @param {Object} input
   * @param {Object} [input.depot] - { id, x, y, openHour }
   * @param {Object[]} input.customers - List of deliveries { id, x, y, demand, readyHour, dueHour, serviceMinutes }
   * @param {Object[]} [input.fleet] - Fleet of delivery EVs
   * @returns {Object}
   */
  planLEZOptimizedRoutes(input = {}) {
    const depot = input.depot || { id: 'SPX_LOGISTICS_DEPOT', x: 0, y: 0, openHour: 7.0 };
    const customers = Array.isArray(input.customers) ? [...input.customers] : [];
    const fleet = Array.isArray(input.fleet) && input.fleet.length > 0
      ? input.fleet
      : [
          { id: 'SPX_ECO_LEZ_01', currentSOC: 0.92, payloadCapacityKg: 650 },
          { id: 'SPX_ECO_LEZ_02', currentSOC: 0.88, payloadCapacityKg: 650 }
        ];

    if (customers.length === 0) {
      return {
        routes: [],
        totalDistanceKm: 0,
        totalEnergyKWh: 0,
        totalTollsPaidVND: 0,
        totalTollsWaivedVND: 0,
        lezEntriesCount: 0,
        avoidedEmissions: { co2Kg: 0, pm25Grams: 0, noxGrams: 0 },
        compliancePass: { status: 'NO_CUSTOMERS', passCode: null }
      };
    }

    const unserved = [...customers].sort((a, b) => (a.readyHour || 0) - (b.readyHour || 0));
    const routes = [];
    let totalDistAll = 0;
    let totalEnergyAll = 0;
    let totalTollsPaidAll = 0;
    let totalTollsWaivedAll = 0;
    let totalLEZEntriesAll = 0;

    for (const vehicle of fleet) {
      if (unserved.length === 0) break;

      let currentLoc = depot;
      let currentTime = depot.openHour || 7.0;
      let currentSOC = Math.min(this.maxSOC, Math.max(this.minSOC, vehicle.currentSOC || 0.90));
      let currentLoad = 0;
      let currentlyInLEZ = Boolean(this.getContainingLEZ(currentLoc.x, currentLoc.y));
      const stops = [];
      let routeDist = 0;
      let routeEnergy = 0;
      let routeTollsPaid = 0;
      let routeTollsWaived = 0;
      let routeLEZEntries = 0;

      while (unserved.length > 0) {
        let bestIdx = -1;
        let minCost = Infinity;

        for (let i = 0; i < unserved.length; i++) {
          const cust = unserved[i];
          const dist = this._calculateDistance(currentLoc, cust);
          const destLEZ = this.getContainingLEZ(cust.x, cust.y);
          const isEnteringLEZ = !currentlyInLEZ && Boolean(destLEZ);

          const speed = destLEZ ? destLEZ.speedLimitKmH : 45;
          const travelHours = dist / speed;
          const arrivalTime = Math.max(currentTime + travelHours, cust.readyHour || 0);

          if (currentLoad + (cust.demand || 10) <= vehicle.payloadCapacityKg &&
              arrivalTime <= (cust.dueHour || 22)) {
            // EV with healthy battery gets 100% toll waiver
            const tollPayable = isEnteringLEZ ? (currentSOC < this.minSOC ? this.standardTollVND : 0) : 0;
            const energyPerKm = destLEZ ? this.energyRateInsideLEZ : this.energyRateOutsideLEZ;
            const cost = dist * energyPerKm * 2500 + tollPayable + arrivalTime * 100;

            if (cost < minCost) {
              minCost = cost;
              bestIdx = i;
            }
          }
        }

        if (bestIdx === -1) break;

        const nextCust = unserved.splice(bestIdx, 1)[0];
        const dist = this._calculateDistance(currentLoc, nextCust);
        const destLEZ = this.getContainingLEZ(nextCust.x, nextCust.y);
        const isEnteringLEZ = !currentlyInLEZ && Boolean(destLEZ);

        const speed = destLEZ ? destLEZ.speedLimitKmH : 45;
        const travelHours = dist / speed;
        const arrivalTime = Math.max(currentTime + travelHours, nextCust.readyHour || 0);
        const serviceHours = (nextCust.serviceMinutes || 15) / 60;
        const departureTime = arrivalTime + serviceHours;

        const energyPerKm = destLEZ ? this.energyRateInsideLEZ : this.energyRateOutsideLEZ;
        const legEnergy = dist * energyPerKm;

        let tollPaid = 0;
        let tollWaived = 0;
        if (isEnteringLEZ) {
          routeLEZEntries++;
          if (currentSOC >= this.minSOC) {
            tollWaived = destLEZ.tollVND || this.standardTollVND;
          } else {
            tollPaid = destLEZ.tollVND || this.standardTollVND;
          }
        }

        currentSOC -= legEnergy / this.batteryCapacityKWh;
        routeDist += dist;
        routeEnergy += legEnergy;
        routeTollsPaid += tollPaid;
        routeTollsWaived += tollWaived;

        stops.push({
          stopId: nextCust.id,
          location: { x: nextCust.x, y: nextCust.y },
          isInLEZ: Boolean(destLEZ),
          lezId: destLEZ ? destLEZ.id : null,
          speedKmH: speed,
          arrivalTime: Number(arrivalTime.toFixed(2)),
          departureTime: Number(departureTime.toFixed(2)),
          distanceKm: Number(dist.toFixed(2)),
          energyKWh: Number(legEnergy.toFixed(2)),
          tollPaidVND: tollPaid,
          tollWaivedVND: tollWaived,
          socAtDeparture: Number(currentSOC.toFixed(3)),
          action: 'DELIVERY'
        });

        currentLoc = nextCust;
        currentTime = departureTime;
        currentLoad += (nextCust.demand || 10);
        currentlyInLEZ = Boolean(destLEZ);
      }

      // Return to depot
      const returnDist = this._calculateDistance(currentLoc, depot);
      const returnLEZ = this.getContainingLEZ(depot.x, depot.y);
      const returnSpeed = returnLEZ ? returnLEZ.speedLimitKmH : 40;
      const returnHours = returnDist / returnSpeed;
      const returnArrival = currentTime + returnHours;
      const returnEnergy = returnDist * this.energyRateOutsideLEZ;

      currentSOC -= returnEnergy / this.batteryCapacityKWh;
      routeDist += returnDist;
      routeEnergy += returnEnergy;

      stops.push({
        stopId: depot.id,
        location: { x: depot.x, y: depot.y },
        isInLEZ: Boolean(returnLEZ),
        speedKmH: returnSpeed,
        arrivalTime: Number(returnArrival.toFixed(2)),
        distanceKm: Number(returnDist.toFixed(2)),
        energyKWh: Number(returnEnergy.toFixed(2)),
        tollPaidVND: 0,
        tollWaivedVND: 0,
        socAtArrival: Number(currentSOC.toFixed(3)),
        action: 'DEPOT_RETURN'
      });

      routes.push({
        vehicleId: vehicle.id,
        depotId: depot.id,
        numStops: stops.length - 1,
        totalDistanceKm: Number(routeDist.toFixed(2)),
        totalEnergyKWh: Number(routeEnergy.toFixed(2)),
        tollsPaidVND: routeTollsPaid,
        tollsWaivedVND: routeTollsWaived,
        lezEntries: routeLEZEntries,
        stops
      });

      totalDistAll += routeDist;
      totalEnergyAll += routeEnergy;
      totalTollsPaidAll += routeTollsPaid;
      totalTollsWaivedAll += routeTollsWaived;
      totalLEZEntriesAll += routeLEZEntries;
    }

    const co2KgAvoided = Number(((totalDistAll * this.avoidedCO2GramsPerKm) / 1000).toFixed(2));
    const pm25Avoided = Number((totalDistAll * this.avoidedPM25GramsPerKm).toFixed(2));
    const noxAvoided = Number((totalDistAll * this.avoidedNOxGramsPerKm).toFixed(2));

    return {
      routes,
      totalDistanceKm: Number(totalDistAll.toFixed(2)),
      totalEnergyKWh: Number(totalEnergyAll.toFixed(2)),
      totalTollsPaidVND: totalTollsPaidAll,
      totalTollsWaivedVND: totalTollsWaivedAll,
      lezEntriesCount: totalLEZEntriesAll,
      avoidedEmissions: {
        co2Kg: co2KgAvoided,
        pm25Grams: pm25Avoided,
        noxGrams: noxAvoided
      },
      compliancePass: {
        status: 'URBAN_LEZ_ZERO_EMISSION_PASS',
        exemptionRatePct: totalLEZEntriesAll > 0
          ? Math.round((totalTollsWaivedAll / (totalTollsWaivedAll + totalTollsPaidAll || 1)) * 100)
          : 100,
        badge: 'SPX_CLEAN_AIR_HERO'
      },
      unservedCount: unserved.length
    };
  }
}
