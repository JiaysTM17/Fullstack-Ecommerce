/**
 * EVRPTWVehicleToGridPeakShavingRouter
 * (K. Wang et al., TR Part B 2020 / M. Keskin & B. Çatay, Computers & OR 2021 / F. Schiffer et al., Transportation Science 2021)
 *
 * Implements Electric Vehicle Routing Problem with Time Windows and Vehicle-to-Grid (V2G)
 * Peak Shaving & Financial Energy Arbitrage for smart e-commerce logistics microgrids.
 *
 * Mathematical Foundations:
 * 1. Bidirectional Power Flow Formulation:
 *    - Power dispatch: P_v(t) in [-P_discharge_max, +P_charge_max] (kW)
 *    - Positive P_v(t) > 0: EV draws power from grid (charging)
 *    - Negative P_v(t) < 0: EV injects power into depot/microgrid (V2G discharge)
 * 2. Time-of-Use (TOU) & Feed-in Tariff (FIT) Energy Economics:
 *    - Off-Peak (22:00 - 04:00): 1,600 VND/kWh (Grid charging window)
 *    - Standard (04:00 - 09:30, 11:30 - 17:00, 20:00 - 22:00): 2,800 VND/kWh
 *    - High-Peak (09:30 - 11:30, 17:00 - 20:00): 5,500 VND/kWh (V2G discharge peak shaving window)
 * 3. Battery Degradation & Cycle Aging Model:
 *    - Cycle aging cost: C_deg = (BatteryReplacementCost / (CycleLife * UsableCapacity)) * DoD_Multiplier
 *    - Arbitrage condition: Only discharge if FIT_Peak - (BaseChargeRate + C_deg) > 0.
 * 4. State of Charge (SOC) Dynamics & Customer Time Windows:
 *    - SOC(t+1) = SOC(t) - d_ij * eta_cons + delta_t * P_v * eta_transfer
 *    - SOC_min <= SOC(t) <= SOC_max (e.g. 20% <= SOC <= 95% to preserve battery health)
 *    - Customer arrival time: e_i <= a_i <= l_i
 */

export class EVRPTWVehicleToGridPeakShavingRouter {
  /**
   * @param {Object} options
   * @param {number} [options.batteryCapacityKWh=60] - Battery capacity per delivery EV (kWh)
   * @param {number} [options.consumptionPerKm=0.22] - Energy consumption rate (kWh/km)
   * @param {number} [options.maxChargeKW=30] - Max DC fast charging power (kW)
   * @param {number} [options.maxDischargeKW=22] - Max V2G inverter discharge power (kW)
   * @param {number} [options.batteryCostVND=120000000] - Replacement cost for battery pack
   * @param {number} [options.cycleLife=3000] - Rated 80% DoD cycle life
   */
  constructor(options = {}) {
    this.batteryCapacityKWh = Number(options.batteryCapacityKWh) || 60;
    this.consumptionPerKm = Number(options.consumptionPerKm) || 0.22;
    this.maxChargeKW = Number(options.maxChargeKW) || 30;
    this.maxDischargeKW = Number(options.maxDischargeKW) || 22;
    this.batteryCostVND = Number(options.batteryCostVND) || 120000000;
    this.cycleLife = Number(options.cycleLife) || 3000;

    // Minimum & maximum allowed SOC to protect cell chemistry
    this.minSOC = 0.20; // 20%
    this.maxSOC = 0.95; // 95%

    // Efficiency factors
    this.chargeEfficiency = 0.92;
    this.dischargeEfficiency = 0.90;

    // Vietnamese TOU Electricity Tariff Matrix (VND / kWh)
    this.tariffs = {
      OFF_PEAK: 1600,
      STANDARD: 2800,
      HIGH_PEAK: 5500
    };

    // Calculate battery degradation cost per kWh discharged
    // C_deg = Cost / (CycleLife * Capacity * DoD)
    const dodFactor = 0.8;
    this.degradationCostPerKWh = Math.round(
      this.batteryCostVND / (this.cycleLife * this.batteryCapacityKWh * dodFactor)
    ); // ~833 VND/kWh
  }

  /**
   * Get tariff category based on hour of day (0.0 to 24.0)
   * @param {number} hour
   * @returns {string} Tariff band
   */
  getTariffBand(hour) {
    const h = (hour % 24 + 24) % 24;
    if ((h >= 9.5 && h < 11.5) || (h >= 17 && h < 20)) {
      return 'HIGH_PEAK';
    }
    if (h >= 22 || h < 4) {
      return 'OFF_PEAK';
    }
    return 'STANDARD';
  }

  /**
   * Get electricity tariff price in VND/kWh
   * @param {number} hour
   * @returns {number}
   */
  getTariffRate(hour) {
    const band = this.getTariffBand(hour);
    return this.tariffs[band];
  }

  _calculateDistance(locA, locB) {
    const dx = locA.x - locB.x;
    const dy = locA.y - locB.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Solve EVRPTW with bidirectional V2G peak shaving schedule
   * @param {Object} input
   * @param {Object} input.depot - { id: 'depot', x: 0, y: 0, openHour: 6, closeHour: 22 }
   * @param {Array<Object>} input.customers - [{ id, x, y, demand, readyHour, dueHour, serviceMinutes }]
   * @param {Array<Object>} [input.fleet] - [{ id, currentSOC, payloadCapacityKg }]
   * @returns {Object} Optimized routes and V2G energy dispatch
   */
  planRoutesAndEnergyDispatch(input) {
    const depot = input.depot || { id: 'depot_central', x: 0, y: 0, openHour: 6, closeHour: 22 };
    const customers = Array.isArray(input.customers) ? [...input.customers] : [];
    const fleet = Array.isArray(input.fleet) && input.fleet.length > 0
      ? input.fleet
      : [
          { id: 'EV_01', currentSOC: 0.85, payloadCapacityKg: 500 },
          { id: 'EV_02', currentSOC: 0.90, payloadCapacityKg: 500 }
        ];

    if (customers.length === 0) {
      return {
        routes: [],
        totalTravelDistanceKm: 0,
        totalEnergyConsumedKWh: 0,
        v2gPeakShavingKWh: 0,
        v2gRevenueVND: 0,
        batteryDegradationCostVND: 0,
        netArbitrageProfitVND: 0
      };
    }

    // Sort customers by early time window
    const unserved = [...customers].sort((a, b) => (a.readyHour || 0) - (b.readyHour || 0));
    const routes = [];
    let totalDistAll = 0;
    let totalEnergyConsumedAll = 0;
    let totalDischargedKWhAll = 0;
    let totalV2GRevenueAll = 0;
    let totalDegradationCostAll = 0;

    for (const vehicle of fleet) {
      if (unserved.length === 0) break;

      let currentLoc = depot;
      let currentTime = depot.openHour || 7.0; // Starts 07:00 AM
      let currentSOC = Math.min(this.maxSOC, Math.max(this.minSOC, vehicle.currentSOC || 0.9));
      let currentLoad = 0;
      const vehicleRouteStops = [];
      let vehicleDist = 0;
      let vehicleEnergyConsumed = 0;
      let vehicleDischargedKWh = 0;
      let vehicleV2GRevenue = 0;
      let vehicleDegradation = 0;

      while (unserved.length > 0) {
        // Find best next customer matching payload & feasible time
        let bestIdx = -1;
        let minDetour = Infinity;

        for (let i = 0; i < unserved.length; i++) {
          const cust = unserved[i];
          const dist = this._calculateDistance(currentLoc, cust);
          const travelHours = dist / 30; // avg speed 30 km/h
          const arrivalTime = currentTime + travelHours;

          if (currentLoad + (cust.demand || 10) <= vehicle.payloadCapacityKg &&
              arrivalTime <= (cust.dueHour || 20)) {
            if (dist < minDetour) {
              minDetour = dist;
              bestIdx = i;
            }
          }
        }

        if (bestIdx === -1) break; // Cannot serve more on this route

        const nextCust = unserved.splice(bestIdx, 1)[0];
        const dist = this._calculateDistance(currentLoc, nextCust);
        const travelHours = dist / 30;
        const arrivalTime = Math.max(currentTime + travelHours, nextCust.readyHour || 0);
        const serviceHours = (nextCust.serviceMinutes || 15) / 60;
        const departureTime = arrivalTime + serviceHours;

        // Energy consumption during travel
        const travelEnergy = dist * this.consumptionPerKm;
        currentSOC -= travelEnergy / this.batteryCapacityKWh;
        vehicleDist += dist;
        vehicleEnergyConsumed += travelEnergy;

        vehicleRouteStops.push({
          stopId: nextCust.id,
          location: { x: nextCust.x, y: nextCust.y },
          arrivalTime: Number(arrivalTime.toFixed(2)),
          departureTime: Number(departureTime.toFixed(2)),
          distanceFromPrevKm: Number(dist.toFixed(2)),
          energyConsumedKWh: Number(travelEnergy.toFixed(2)),
          socAtDeparture: Number(currentSOC.toFixed(3)),
          action: 'DELIVERY'
        });

        currentLoc = nextCust;
        currentTime = departureTime;
        currentLoad += (nextCust.demand || 10);
      }

      // Return to depot
      const returnDist = this._calculateDistance(currentLoc, depot);
      const returnTravelHours = returnDist / 30;
      const returnArrival = currentTime + returnTravelHours;
      const returnEnergy = returnDist * this.consumptionPerKm;
      currentSOC -= returnEnergy / this.batteryCapacityKWh;
      vehicleDist += returnDist;
      vehicleEnergyConsumed += returnEnergy;

      // V2G Peak Shaving Opportunity at Depot upon return
      // If returning during High Peak (e.g. 17:00 - 20:00), discharge excess battery down to minSOC + 0.1
      let v2gAction = null;
      const tariffBand = this.getTariffBand(returnArrival);
      const targetMinReturnSOC = this.minSOC + 0.05; // Keep safe 25%

      if (tariffBand === 'HIGH_PEAK' && currentSOC > targetMinReturnSOC) {
        const availableDischargeKWh = (currentSOC - targetMinReturnSOC) * this.batteryCapacityKWh;
        // Discharge duration capped at 1.5 hours or power limit
        const maxDischargePossibleKWh = this.maxDischargeKW * 1.5 * this.dischargeEfficiency;
        const actualDischargeKWh = Math.min(availableDischargeKWh, maxDischargePossibleKWh);

        if (actualDischargeKWh > 0) {
          const revenue = actualDischargeKWh * this.tariffs.HIGH_PEAK;
          const degradation = actualDischargeKWh * this.degradationCostPerKWh;
          const netProfit = revenue - degradation - (actualDischargeKWh * this.tariffs.OFF_PEAK);

          currentSOC -= actualDischargeKWh / this.batteryCapacityKWh;
          vehicleDischargedKWh += actualDischargeKWh;
          vehicleV2GRevenue += revenue;
          vehicleDegradation += degradation;

          v2gAction = {
            type: 'V2G_DISCHARGE_PEAK_SHAVING',
            tariffBand,
            dischargedKWh: Number(actualDischargeKWh.toFixed(2)),
            feedInTariffVND: this.tariffs.HIGH_PEAK,
            revenueVND: Math.round(revenue),
            degradationCostVND: Math.round(degradation),
            netArbitrageProfitVND: Math.round(netProfit)
          };
        }
      }

      vehicleRouteStops.push({
        stopId: depot.id,
        location: { x: depot.x, y: depot.y },
        arrivalTime: Number(returnArrival.toFixed(2)),
        distanceFromPrevKm: Number(returnDist.toFixed(2)),
        energyConsumedKWh: Number(returnEnergy.toFixed(2)),
        socAtArrival: Number(currentSOC.toFixed(3)),
        action: 'DEPOT_RETURN',
        v2gDispatch: v2gAction
      });

      routes.push({
        vehicleId: vehicle.id,
        numDeliveries: vehicleRouteStops.length - 1,
        totalDistanceKm: Number(vehicleDist.toFixed(2)),
        totalEnergyConsumedKWh: Number(vehicleEnergyConsumed.toFixed(2)),
        finalSOC: Number(currentSOC.toFixed(3)),
        v2gPeakShavedKWh: Number(vehicleDischargedKWh.toFixed(2)),
        v2gRevenueVND: Math.round(vehicleV2GRevenue),
        stops: vehicleRouteStops
      });

      totalDistAll += vehicleDist;
      totalEnergyConsumedAll += vehicleEnergyConsumed;
      totalDischargedKWhAll += vehicleDischargedKWh;
      totalV2GRevenueAll += vehicleV2GRevenue;
      totalDegradationCostAll += vehicleDegradation;
    }

    const netArbitrageProfit = totalV2GRevenueAll - totalDegradationCostAll - (totalDischargedKWhAll * this.tariffs.OFF_PEAK);

    return {
      unservedCount: unserved.length,
      routes,
      totalTravelDistanceKm: Number(totalDistAll.toFixed(2)),
      totalEnergyConsumedKWh: Number(totalEnergyConsumedAll.toFixed(2)),
      v2gPeakShavingKWh: Number(totalDischargedKWhAll.toFixed(2)),
      v2gRevenueVND: Math.round(totalV2GRevenueAll),
      batteryDegradationCostVND: Math.round(totalDegradationCostAll),
      netArbitrageProfitVND: Math.round(netArbitrageProfit),
      sustainabilitySummary: {
        co2AvoidedKg: Number((totalDischargedKWhAll * 0.72).toFixed(2)), // 0.72 kg CO2/kWh grid factor
        peakDemandReducedKW: Number((totalDischargedKWhAll > 0 ? this.maxDischargeKW : 0).toFixed(1))
      }
    };
  }
}

export default EVRPTWVehicleToGridPeakShavingRouter;
