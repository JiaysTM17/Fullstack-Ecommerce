/**
 * EVRPTWBatteryDegradationRouter - Electric Vehicle Routing with Time Windows
 * and Nonlinear Battery Aging / Degradation Modeling
 *
 * Grounded in:
 * - Pelletier, Jabali, Laporte (Transportation Science 2017): "Battery Degradation and Behavior for Electric Vehicles: Review and Numerical Analyses"
 * - Schiffer & Walther (European Journal of Operational Research 2018): "Strategic Planning of Electric Logistics Fleets with Battery Degradation"
 * - Millner (IEEE Trans. Vehicular Technology 2010): "Modeling Lithium-Ion Battery Degradation in Electric Vehicle Applications"
 *
 * Practical E-Commerce Relevance:
 * In green logistics (SPX Express EV fleet, GrabElectric), battery packs are the most expensive
 * vehicle component (~40% of vehicle capital cost). Discharging lithium-ion cells deeply (< 20% SoC)
 * causes accelerated SEI layer growth and capacity loss. Traditional linear cost models underestimate
 * battery depreciation by up to 35%.
 *
 * Mathematical Framework:
 * 1. Depth of Discharge: DoD = 1.0 - (SoC / BatteryCapacity)
 * 2. Nonlinear Degradation Stress Function:
 *      Psi(DoD) = (DoD)^k_aging, with k_aging ~ 1.85
 * 3. Incremental Battery Fade Cost:
 *      Cost_degrade = C_pack / (CycleLife_nom * Cap_kWh) * Energy_used * (1 + beta_stress * max(0, DoD - 0.75) / 0.25)
 * 4. Total Generalized Lifecycle Cost:
 *      TotalCost = ElectricityCost + DriverCost + BatteryDegradationCost + TimeWindowPenalty
 */

class EVRPTWBatteryDegradationRouter {
  /**
   * @param {Object} options
   * @param {Object} [options.depot] - Depot coordinates
   * @param {number} [options.depot.x=0]
   * @param {number} [options.depot.y=0]
   * @param {number} [options.batteryCapacityKwh=80.0] - Battery capacity in kWh
   * @param {number} [options.energyPerKmKwh=0.35] - Energy consumption per km (kWh/km)
   * @param {number} [options.vehicleCapacityKg=120.0] - Max package payload per van
   * @param {number} [options.averageSpeedKmH=32.0] - Speed in km/h
   * @param {number} [options.electricityCostPerKwh=3200] - Electricity price (VND/kWh)
   * @param {number} [options.batteryPackCostVnd=120000000] - Total battery pack cost (120M VND)
   * @param {number} [options.nominalCycleLife=2500] - Rated cycle life at 80% DoD
   * @param {number} [options.driverCostPerMin=1200] - Driver labor cost (VND/min)
   * @param {number} [options.minSafeSoCRatio=0.20] - Safe lower boundary for SoC (20%)
   * @param {number} [options.maxShiftMin=480] - Maximum shift duration (8 hours)
   */
  constructor(options = {}) {
    this.depot = options.depot || { id: 'DEPOT', name: 'Hub SPX Long Biên', x: 0, y: 0 };
    this.batteryCapacityKwh = options.batteryCapacityKwh || 80.0;
    this.energyPerKmKwh = options.energyPerKmKwh || 0.35;
    this.vehicleCapacityKg = options.vehicleCapacityKg || 120.0;
    this.averageSpeedKmH = options.averageSpeedKmH || 32.0;
    this.speedKmPerMin = this.averageSpeedKmH / 60; // km/min

    this.electricityCostPerKwh = options.electricityCostPerKwh || 3200;
    this.batteryPackCostVnd = options.batteryPackCostVnd || 120000000;
    this.nominalCycleLife = options.nominalCycleLife || 2500;
    this.driverCostPerMin = options.driverCostPerMin || 1200;
    this.minSafeSoCRatio = options.minSafeSoCRatio !== undefined ? options.minSafeSoCRatio : 0.20;
    this.maxShiftMin = options.maxShiftMin || 480;

    // Nominal battery wear cost per kWh discharged under standard 75% DoD
    this.nominalWearPerKwh = this.batteryPackCostVnd / (this.nominalCycleLife * this.batteryCapacityKwh);
  }

  /**
   * Euclidean distance between two spatial points
   */
  distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Compute nonlinear battery degradation cost for a given discharge energy and maximum DoD reached
   * @param {number} energyConsumedKwh
   * @param {number} maxDoD - Peak depth of discharge during the journey [0, 1]
   * @returns {number} Degradation cost in VND
   */
  computeBatteryDegradationCost(energyConsumedKwh, maxDoD) {
    if (energyConsumedKwh <= 0) return 0;

    // Stress multiplier: nonlinearly penalizes DoD deeper than 75%
    let stressFactor = 1.0;
    if (maxDoD > 0.75) {
      const overDischarge = (maxDoD - 0.75) / 0.25; // in [0, 1]
      stressFactor += 1.8 * Math.pow(overDischarge, 1.85);
    }

    return Math.round(energyConsumedKwh * this.nominalWearPerKwh * stressFactor);
  }

  /**
   * Evaluate a single vehicle route including nonlinear battery degradation
   * @param {Array<Object>} sequence - Array of customer nodes
   * @returns {Object} Route evaluation with metrics
   */
  evaluateRoute(sequence = []) {
    let currentTime = 0; // Depot departure at t = 0
    let currentSoC = this.batteryCapacityKwh; // 100% full
    let peakDoD = 0;
    let prevNode = this.depot;
    let totalDist = 0;
    let totalPayload = 0;
    let totalWaitTime = 0;
    let totalLateTime = 0;
    const stops = [];
    let isFeasible = true;

    for (let i = 0; i < sequence.length; i++) {
      const cust = sequence[i];
      const demand = cust.demand || 1;
      totalPayload += demand;

      const d = this.distance(prevNode, cust);
      totalDist += d;
      const tTravel = d / this.speedKmPerMin;
      const arrTime = currentTime + tTravel;

      const e_i = cust.timeWindow ? cust.timeWindow[0] : 0;
      const l_i = cust.timeWindow ? cust.timeWindow[1] : 480;

      let waitTime = 0;
      if (arrTime < e_i) {
        waitTime = e_i - arrTime;
        totalWaitTime += waitTime;
      }
      let lateTime = 0;
      if (arrTime > l_i) {
        lateTime = arrTime - l_i;
        totalLateTime += lateTime;
        if (lateTime > 45) isFeasible = false; // Exceeds tolerable late window
      }

      const serviceTime = cust.serviceTime || 10;
      const depTime = Math.max(e_i, arrTime) + serviceTime;
      currentTime = depTime;

      // Energy discharge
      const energyUsed = d * this.energyPerKmKwh;
      currentSoC -= energyUsed;
      const currentDoD = 1.0 - (currentSoC / this.batteryCapacityKwh);
      if (currentDoD > peakDoD) peakDoD = currentDoD;

      // Safe minimum boundary check
      if (currentSoC < this.batteryCapacityKwh * this.minSafeSoCRatio) {
        isFeasible = false;
      }

      stops.push({
        id: cust.id,
        name: cust.name || `Khách ${cust.id}`,
        demand,
        arrivalTime: Number(arrTime.toFixed(1)),
        departureTime: Number(depTime.toFixed(1)),
        energyRemainingKwh: Number(currentSoC.toFixed(2)),
        currentSoCPercent: Number(((currentSoC / this.batteryCapacityKwh) * 100).toFixed(1)),
        timeWindow: [e_i, l_i],
        waitTime: Number(waitTime.toFixed(1)),
        lateTime: Number(lateTime.toFixed(1))
      });

      prevNode = cust;
    }

    // Return to depot
    const returnDist = this.distance(prevNode, this.depot);
    totalDist += returnDist;
    const returnTravelTime = returnDist / this.speedKmPerMin;
    currentTime += returnTravelTime;
    const returnEnergy = returnDist * this.energyPerKmKwh;
    currentSoC -= returnEnergy;
    const finalDoD = 1.0 - (currentSoC / this.batteryCapacityKwh);
    if (finalDoD > peakDoD) peakDoD = finalDoD;

    if (currentSoC < this.batteryCapacityKwh * this.minSafeSoCRatio || totalPayload > this.vehicleCapacityKg || currentTime > this.maxShiftMin) {
      isFeasible = false;
    }

    const totalEnergyKwh = totalDist * this.energyPerKmKwh;
    const electricityCost = Math.round(totalEnergyKwh * this.electricityCostPerKwh);
    const batteryDegradationCost = this.computeBatteryDegradationCost(totalEnergyKwh, peakDoD);
    const laborCost = Math.round(currentTime * this.driverCostPerMin);
    const latePenaltyCost = Math.round(totalLateTime * 500);

    const generalizedCost = electricityCost + batteryDegradationCost + laborCost + latePenaltyCost;

    return {
      stops,
      totalDistanceKm: Number(totalDist.toFixed(2)),
      totalDurationMin: Number(currentTime.toFixed(1)),
      totalPayloadKg: totalPayload,
      totalEnergyKwh: Number(totalEnergyKwh.toFixed(2)),
      peakDoDPercent: Number((peakDoD * 100).toFixed(1)),
      minSoCPercent: Number((((this.batteryCapacityKwh - totalEnergyKwh) / this.batteryCapacityKwh) * 100).toFixed(1)),
      electricityCostVnd: electricityCost,
      batteryDegradationCostVnd: batteryDegradationCost,
      laborCostVnd: laborCost,
      latePenaltyCostVnd: latePenaltyCost,
      generalizedCostVnd: generalizedCost,
      isFeasible
    };
  }

  /**
   * Plan routes for electric fleet minimizing total generalized lifecycle cost
   * @param {Array<Object>} customers
   * @returns {Object} Routing solution
   */
  planRoutes(customers = []) {
    if (!Array.isArray(customers) || customers.length === 0) {
      return {
        routes: [],
        totalVehicles: 0,
        totalDistanceKm: 0,
        totalDegradationCostVnd: 0,
        totalGeneralizedCostVnd: 0,
        allFeasible: true
      };
    }

    const unassigned = [...customers];
    const routes = [];

    unassigned.sort((a, b) => {
      const eA = a.timeWindow ? a.timeWindow[0] : 0;
      const eB = b.timeWindow ? b.timeWindow[0] : 0;
      return eA - eB;
    });

    while (unassigned.length > 0) {
      const currentRoute = [];
      let currentPayload = 0;

      const seed = unassigned.shift();
      currentRoute.push(seed);
      currentPayload += seed.demand || 1;

      let added = true;
      while (added) {
        added = false;
        let bestIdx = -1;
        let minExtraCost = Infinity;

        for (let i = 0; i < unassigned.length; i++) {
          const cand = unassigned[i];
          const candDemand = cand.demand || 1;
          if (currentPayload + candDemand > this.vehicleCapacityKg) continue;

          const testSeq = [...currentRoute, cand];
          const testEval = this.evaluateRoute(testSeq);

          if (testEval.isFeasible) {
            const lastStop = currentRoute[currentRoute.length - 1];
            const dist = this.distance(lastStop, cand);
            if (dist < minExtraCost) {
              minExtraCost = dist;
              bestIdx = i;
            }
          }
        }

        if (bestIdx >= 0) {
          const chosen = unassigned.splice(bestIdx, 1)[0];
          currentRoute.push(chosen);
          currentPayload += chosen.demand || 1;
          added = true;
        }
      }

      const refinedSeq = this.twoOptRefine(currentRoute);
      const finalEval = this.evaluateRoute(refinedSeq);

      routes.push({
        vehicleId: `SPX-EV-${routes.length + 1}`,
        ...finalEval
      });
    }

    let sumDist = 0;
    let sumDegradation = 0;
    let sumGenCost = 0;
    let allFeasible = true;

    for (const r of routes) {
      sumDist += r.totalDistanceKm;
      sumDegradation += r.batteryDegradationCostVnd;
      sumGenCost += r.generalizedCostVnd;
      if (!r.isFeasible) allFeasible = false;
    }

    return {
      routes,
      totalVehicles: routes.length,
      totalDistanceKm: Number(sumDist.toFixed(2)),
      totalDegradationCostVnd: sumDegradation,
      totalGeneralizedCostVnd: sumGenCost,
      batteryCapacityKwh: this.batteryCapacityKwh,
      minSafeSoCRatio: this.minSafeSoCRatio,
      allFeasible
    };
  }

  /**
   * 2-Opt local search refinement respecting battery degradation constraints
   */
  twoOptRefine(sequence) {
    if (sequence.length <= 3) return sequence;
    let best = [...sequence];
    let bestEval = this.evaluateRoute(best);
    let improved = true;
    let iter = 0;

    while (improved && iter < 15) {
      improved = false;
      iter++;
      for (let i = 0; i < best.length - 1; i++) {
        for (let j = i + 1; j < best.length; j++) {
          const candidate = [
            ...best.slice(0, i),
            ...best.slice(i, j + 1).reverse(),
            ...best.slice(j + 1)
          ];
          const candEval = this.evaluateRoute(candidate);
          if (candEval.isFeasible && candEval.generalizedCostVnd < bestEval.generalizedCostVnd - 100) {
            best = candidate;
            bestEval = candEval;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
    return best;
  }
}

// Dual ESM/CJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { EVRPTWBatteryDegradationRouter };
}
export { EVRPTWBatteryDegradationRouter };
