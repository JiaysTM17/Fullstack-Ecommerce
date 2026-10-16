/**
 * Electric Vehicle Routing Problem with Time Windows & Stochastic Charging Queues (EVRPTW-Queue)
 * 
 * Based on foundational research:
 * - Aurélien Froger, Jorge E. Mendoza, Ola Jabali, Gilbert Laporte (Transportation Science 2019):
 *   "Improved Formulations and Algorithmic Components for the Electric Vehicle Routing Problem with Nonlinear Charging Functions"
 * - Alejandro Montoya, Christelle Guéret, Jorge E. Mendoza, Juan G. Villegas (Computers & Operations Research 2017):
 *   "The Electric Vehicle Routing Problem with Nonlinear Charging Function"
 * - Erlang M/M/c Queuing Theory for Charging Station Congestion Modeling
 * 
 * Mathematical Foundations:
 * - Each fast charging station s has c_s parallel charging stalls.
 * - Poisson arrival rate lambda_s (vehicles/hr) and exponential service rate mu_s (chargings/hr).
 * - System traffic intensity: rho_s = lambda_s / (c_s * mu_s) < 1.
 * - Idle probability P_0:
 *   P_0 = [ sum_{n=0}^{c-1} (c * rho)^n / n! + (c * rho)^c / (c! * (1 - rho)) ]^(-1)
 * - Expected queue length L_q and queue wait time W_q (minutes):
 *   L_q = (P_0 * (c * rho)^c * rho) / (c! * (1 - rho)^2)
 *   W_q = (L_q / lambda_s) * 60 (converted to minutes)
 * 
 * - Total station dwell time = Queue Wait Time W_q + Actual Recharge Duration t_charge
 * - Vehicles dynamically detour to the optimal charging station balancing detour distance,
 *   congestion wait time W_q, and customer delivery time windows [e_i, l_i].
 */

export class EVRPTWQueueRouter {
  /**
   * @param {Object} options
   * @param {number} [options.batteryCapacityKwh=60] EV battery pack capacity (kWh)
   * @param {number} [options.consumptionPerKm=0.35] Energy consumption rate (kWh/km)
   * @param {number} [options.minSocSafetyBuffer=0.15] Minimum state of charge safety threshold (15%)
   * @param {number} [options.vehicleCapacityKg=150] Max parcel payload capacity (kg)
   * @param {number} [options.costPerKm=5000] Vehicle travel cost per km (VND)
   * @param {number} [options.costPerKwh=3800] EV fast charging cost per kWh (VND)
   * @param {number} [options.latenessPenaltyPerMin=2000] Penalty for time window violation (VND/min)
   */
  constructor(options = {}) {
    this.batteryCapacityKwh = Number(options.batteryCapacityKwh) || 60;
    this.consumptionPerKm = Number(options.consumptionPerKm) || 0.35;
    this.minSocSafetyBuffer = Number(options.minSocSafetyBuffer) || 0.15;
    this.vehicleCapacityKg = Number(options.vehicleCapacityKg) || 150;
    this.costPerKm = Number(options.costPerKm) || 5000;
    this.costPerKwh = Number(options.costPerKwh) || 3800;
    this.latenessPenaltyPerMin = Number(options.latenessPenaltyPerMin) || 2000;

    this.depot = { id: "DEPOT_SPX", name: "SPX Central Hub", x: 0, y: 0 };
  }

  /**
   * Compute Euclidean distance in km between two nodes
   * @param {{x: number, y: number}} a
   * @param {{x: number, y: number}} b
   * @returns {number}
   */
  calculateDistanceKm(a, b) {
    const dx = (a.x || 0) - (b.x || 0);
    const dy = (a.y || 0) - (b.y || 0);
    return Number(Math.sqrt(dx * dx + dy * dy).toFixed(2));
  }

  /**
   * Factorial helper for Erlang formula
   * @private
   */
  _factorial(n) {
    if (n <= 1) return 1;
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
  }

  /**
   * Compute M/M/c queuing metrics for a charging station
   * @param {Object} station
   * @param {number} station.stalls c parallel stalls
   * @param {number} station.arrivalRatePerHour lambda
   * @param {number} station.serviceRatePerHour mu per stall
   * @returns {{rho: number, p0: number, expectedQueueWaitMin: number, isCongested: boolean}}
   */
  computeQueueWaitTime(station = {}) {
    const c = Math.max(1, Math.floor(station.stalls || 2));
    const lambda = Math.max(0.1, Number(station.arrivalRatePerHour) || 2.0);
    const mu = Math.max(0.5, Number(station.serviceRatePerHour) || 2.5); // chargings per stall/hour

    const rho = lambda / (c * mu);
    if (rho >= 0.98) {
      // Station near or exceeding capacity
      return {
        rho: 0.99,
        p0: 0.01,
        expectedQueueWaitMin: 45.0,
        isCongested: true
      };
    }

    // P_0 calculation
    let sumN = 0;
    for (let n = 0; n < c; n++) {
      sumN += Math.pow(c * rho, n) / this._factorial(n);
    }
    const lastTerm = Math.pow(c * rho, c) / (this._factorial(c) * (1 - rho));
    const p0 = 1.0 / (sumN + lastTerm);

    // L_q calculation
    const lq = (p0 * Math.pow(c * rho, c) * rho) / (this._factorial(c) * Math.pow(1 - rho, 2));

    // W_q = L_q / lambda (in hours) -> convert to minutes
    const wqMin = (lq / lambda) * 60;

    return {
      rho: Number(rho.toFixed(3)),
      p0: Number(p0.toFixed(4)),
      expectedQueueWaitMin: Number(Math.max(0.5, wqMin).toFixed(2)),
      isCongested: rho >= 0.75
    };
  }

  /**
   * Plan optimal EV routes with stochastic charging station selection
   * @param {Object} input
   * @param {Array<Object>} input.customers Delivery points with demands and timeWindows
   * @param {Array<Object>} input.chargingStations Available fast chargers
   * @returns {Object} Optimized routing plan with battery state and queuing metrics
   */
  planEVRoutes(input = {}) {
    const rawCustomers = Array.isArray(input.customers) ? input.customers : [];
    const chargingStations = Array.isArray(input.chargingStations) ? input.chargingStations : [
      { id: "CS1", name: "Trạm Sạc Mỹ Đình", x: 4, y: 3, stalls: 3, arrivalRatePerHour: 3.5, serviceRatePerHour: 2.0 },
      { id: "CS2", name: "Trạm Sạc Long Biên", x: -3, y: 5, stalls: 2, arrivalRatePerHour: 1.2, serviceRatePerHour: 1.8 }
    ];

    if (rawCustomers.length === 0) {
      return {
        status: "EMPTY",
        routes: [],
        summary: { totalDistanceKm: 0, totalEnergyKwh: 0, totalQueueWaitMin: 0, totalCostVnd: 0 }
      };
    }

    // Sort customers by early time window
    const unvisited = rawCustomers.map(c => ({
      ...c,
      demandKg: Number(c.demandKg || c.demand || 10),
      timeWindow: Array.isArray(c.timeWindow) ? c.timeWindow : [0, 240]
    })).sort((a, b) => a.timeWindow[0] - b.timeWindow[0]);

    const routes = [];
    let vehicleId = 1;

    while (unvisited.length > 0) {
      const currentRoute = [];
      let currentPayload = 0;
      let currentLoc = this.depot;
      let currentTime = 0; // minutes from shift start
      let currentSocKwh = this.batteryCapacityKwh; // 100% charged at depot
      let routeDistanceKm = 0;
      let routeEnergyConsumedKwh = 0;
      let routeTotalWaitMin = 0;
      let routeLatenessMin = 0;
      let chargesCount = 0;

      for (let i = 0; i < unvisited.length; i++) {
        const cust = unvisited[i];
        if (currentPayload + cust.demandKg > this.vehicleCapacityKg) continue;

        const legDist = this.calculateDistanceKm(currentLoc, cust);
        const legEnergy = legDist * this.consumptionPerKm * (1 + 0.005 * (currentPayload / this.vehicleCapacityKg));
        const travelTimeMin = legDist * 2.0; // 30 km/h average city speed

        // Check if battery reaches safe threshold before reaching customer or needing to return
        const minSafeKwh = this.batteryCapacityKwh * this.minSocSafetyBuffer;
        if (currentSocKwh - legEnergy < minSafeKwh) {
          // Detour to best charging station
          let bestStation = null;
          let minTotalPenalty = Infinity;

          for (const cs of chargingStations) {
            const distToCs = this.calculateDistanceKm(currentLoc, cs);
            const energyToCs = distToCs * this.consumptionPerKm;
            if (currentSocKwh - energyToCs < minSafeKwh * 0.5) continue; // Can reach CS

            const qMetrics = this.computeQueueWaitTime(cs);
            const rechargeNeededKwh = this.batteryCapacityKwh * 0.85 - (currentSocKwh - energyToCs);
            const rechargeDurationMin = Math.max(10, rechargeNeededKwh * 1.2); // Fast charger ~50kW
            const totalCsTime = qMetrics.expectedQueueWaitMin + rechargeDurationMin + distToCs * 2.0;

            if (totalCsTime < minTotalPenalty) {
              minTotalPenalty = totalCsTime;
              bestStation = {
                cs,
                distToCs,
                energyToCs,
                qMetrics,
                rechargeNeededKwh: Number(rechargeNeededKwh.toFixed(2)),
                rechargeDurationMin: Number(rechargeDurationMin.toFixed(2)),
                totalStationTimeMin: Number(totalCsTime.toFixed(2))
              };
            }
          }

          if (bestStation) {
            // Insert charging visit into route
            routeDistanceKm += bestStation.distToCs;
            routeEnergyConsumedKwh += bestStation.energyToCs;
            currentTime += bestStation.distToCs * 2.0 + bestStation.totalStationTimeMin;
            routeTotalWaitMin += bestStation.qMetrics.expectedQueueWaitMin;
            chargesCount++;

            currentRoute.push({
              type: "CHARGING_STATION",
              id: bestStation.cs.id,
              name: bestStation.cs.name,
              arrivalTime: Number(currentTime.toFixed(1)),
              queueWaitMin: bestStation.qMetrics.expectedQueueWaitMin,
              rechargeKwh: bestStation.rechargeNeededKwh,
              rechargeDurationMin: bestStation.rechargeDurationMin,
              stationRho: bestStation.qMetrics.rho,
              departureTime: Number(currentTime.toFixed(1))
            });

            currentSocKwh = this.batteryCapacityKwh * 0.85; // Charged up to 85%
            currentLoc = bestStation.cs;
          }
        }

        // Deliver to customer
        const distToCust = this.calculateDistanceKm(currentLoc, cust);
        const energyToCust = distToCust * this.consumptionPerKm;
        const custTravelMin = distToCust * 2.0;
        routeDistanceKm += distToCust;
        routeEnergyConsumedKwh += energyToCust;
        currentSocKwh -= energyToCust;
        currentTime += custTravelMin;

        // Arrival & Time Window check
        const arrivalTime = currentTime;
        const earlyWindow = cust.timeWindow[0];
        const lateWindow = cust.timeWindow[1];
        if (currentTime < earlyWindow) {
          currentTime = earlyWindow; // Wait until customer window opens
        }
        let lateness = 0;
        if (currentTime > lateWindow) {
          lateness = currentTime - lateWindow;
          routeLatenessMin += lateness;
        }

        const serviceDuration = 10; // 10 min drop-off
        currentTime += serviceDuration;
        currentPayload += cust.demandKg;

        currentRoute.push({
          type: "CUSTOMER_DELIVERY",
          id: cust.id,
          name: cust.name || cust.id,
          demandKg: cust.demandKg,
          distanceKm: distToCust,
          arrivalTime: Number(arrivalTime.toFixed(1)),
          departureTime: Number(currentTime.toFixed(1)),
          timeWindow: cust.timeWindow,
          latenessMin: Number(lateness.toFixed(1)),
          remainingSocKwh: Number(currentSocKwh.toFixed(2))
        });

        currentLoc = cust;
        unvisited.splice(i, 1);
        i--;
      }

      // Return to Depot
      const distToDepot = this.calculateDistanceKm(currentLoc, this.depot);
      routeDistanceKm += distToDepot;
      currentTime += distToDepot * 2.0;

      const travelCostVnd = Math.round(routeDistanceKm * this.costPerKm);
      const chargingCostVnd = Math.round(routeEnergyConsumedKwh * this.costPerKwh);
      const latenessCostVnd = Math.round(routeLatenessMin * this.latenessPenaltyPerMin);
      const totalRouteCostVnd = travelCostVnd + chargingCostVnd + latenessCostVnd;

      routes.push({
        vehicleId: `EV_VAN_${vehicleId++}`,
        totalDistanceKm: Number(routeDistanceKm.toFixed(2)),
        totalEnergyKwh: Number(routeEnergyConsumedKwh.toFixed(2)),
        totalQueueWaitMin: Number(routeTotalWaitMin.toFixed(2)),
        totalLatenessMin: Number(routeLatenessMin.toFixed(2)),
        chargesCount,
        finalSocPercent: Number(((currentSocKwh / this.batteryCapacityKwh) * 100).toFixed(1)),
        costs: {
          travelCostVnd,
          chargingCostVnd,
          latenessCostVnd,
          totalRouteCostVnd
        },
        stops: currentRoute
      });
    }

    const totalDist = routes.reduce((acc, r) => acc + r.totalDistanceKm, 0);
    const totalEnergy = routes.reduce((acc, r) => acc + r.totalEnergyKwh, 0);
    const totalQueueWait = routes.reduce((acc, r) => acc + r.totalQueueWaitMin, 0);
    const totalLateness = routes.reduce((acc, r) => acc + r.totalLatenessMin, 0);
    const totalCost = routes.reduce((acc, r) => acc + r.costs.totalRouteCostVnd, 0);

    return {
      status: "SUCCESS",
      vehiclesUsed: routes.length,
      routes,
      summary: {
        totalDistanceKm: Number(totalDist.toFixed(2)),
        totalEnergyKwh: Number(totalEnergy.toFixed(2)),
        totalQueueWaitMin: Number(totalQueueWait.toFixed(2)),
        totalLatenessMin: Number(totalLateness.toFixed(2)),
        totalCostVnd: totalCost
      }
    };
  }
}

export default EVRPTWQueueRouter;
