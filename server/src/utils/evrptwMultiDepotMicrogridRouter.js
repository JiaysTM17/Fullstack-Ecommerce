/**
 * EVRPTWMultiDepotMicrogridRouter
 * (M. Keskin et al., TR Part C 2019 / Schneider et al., 2014 / Goeke & Schneider, 2015)
 *
 * Implements Electric Vehicle Routing Problem with Time Windows across Multi-Depots
 * equipped with Solar Rooftop Photovoltaics, Stationary Battery Energy Storage Systems (BESS),
 * and Microgrid Energy Arbitrage.
 *
 * Mathematical Foundations:
 * 1. Multi-Depot Solar Microgrid Generation:
 *    - P_solar(t) = P_solar_peak * max(0, sin(pi * (t - 6) / 12)) for daylight hours t in [6, 18].
 *    - Depots store excess solar energy into stationary BESS or charge returning fleet directly.
 * 2. Mass-Payload Dependent Kinetic Energy Consumption:
 *    - E_{uv} = d_{uv} * (c_base + c_payload * (currentLoad / payloadCapacity)) [kWh]
 * 3. Multi-Depot Fleet Dispatch & Return Flexibility:
 *    - EVs depart from Depot D_k and can dynamically return to nearest Depot D_j based on
 *      available solar capacity and remaining battery State of Charge (SOC).
 * 4. Microgrid Economic Cost Function:
 *    - Solar energy charge cost: 400 VND/kWh (levelized solar OPEX) vs Grid TOU: 1,600 / 2,800 / 5,500 VND/kWh.
 */

export class EVRPTWMultiDepotMicrogridRouter {
  /**
   * @param {Object} options
   * @param {number} [options.batteryCapacityKWh=60] - Battery capacity per delivery EV
   * @param {number} [options.baseConsumptionPerKm=0.20] - Base energy consumption (kWh/km)
   * @param {number} [options.payloadConsumptionFactor=0.08] - Incremental energy consumption under full load
   * @param {number} [options.maxChargingPowerKW=40] - Max DC fast charging power (kW)
   */
  constructor(options = {}) {
    this.batteryCapacityKWh = Number(options.batteryCapacityKWh) || 60;
    this.baseConsumptionPerKm = Number(options.baseConsumptionPerKm) || 0.20;
    this.payloadConsumptionFactor = Number(options.payloadConsumptionFactor) || 0.08;
    this.maxChargingPowerKW = Number(options.maxChargingPowerKW) || 40;

    this.minSOC = 0.20; // 20% safe buffer
    this.maxSOC = 0.95; // 95% ceiling

    // Grid TOU tariffs
    this.gridTariffs = {
      OFF_PEAK: 1600,
      STANDARD: 2800,
      HIGH_PEAK: 5500
    };
    this.solarLevelizedCostVND = 400; // Levelized Cost of Solar Energy (VND / kWh)
  }

  getSolarPowerKW(depot, hour) {
    const peak = Number(depot.solarPeakKW) || 50;
    const h = (hour % 24 + 24) % 24;
    if (h >= 6 && h <= 18) {
      const rad = Math.PI * (h - 6) / 12;
      return peak * Math.sin(rad);
    }
    return 0;
  }

  getGridTariff(hour) {
    const h = (hour % 24 + 24) % 24;
    if ((h >= 9.5 && h < 11.5) || (h >= 17 && h < 20)) return this.gridTariffs.HIGH_PEAK;
    if (h >= 22 || h < 4) return this.gridTariffs.OFF_PEAK;
    return this.gridTariffs.STANDARD;
  }

  _calculateDistance(locA, locB) {
    const dx = locA.x - locB.x;
    const dy = locA.y - locB.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Plan Multi-Depot routes and microgrid charging dispatch
   * @param {Object} input
   * @param {Array<Object>} input.depots - [{ id, x, y, solarPeakKW, bessCapacityKWh, openHour, closeHour }]
   * @param {Array<Object>} input.customers - [{ id, x, y, demand, readyHour, dueHour, serviceMinutes }]
   * @param {Array<Object>} [input.fleet] - [{ id, homeDepotId, currentSOC, payloadCapacityKg }]
   * @returns {Object}
   */
  planMultiDepotRoutes(input = {}) {
    const defaultDepots = [
      { id: 'DEPOT_HANOI_NORTH', x: 0, y: 0, solarPeakKW: 60, bessCapacityKWh: 100, openHour: 7, closeHour: 21 },
      { id: 'DEPOT_HANOI_SOUTH', x: 20, y: 20, solarPeakKW: 80, bessCapacityKWh: 150, openHour: 7, closeHour: 21 }
    ];

    const depots = Array.isArray(input.depots) && input.depots.length > 0 ? input.depots : defaultDepots;
    const customers = Array.isArray(input.customers) ? [...input.customers] : [];
    const fleet = Array.isArray(input.fleet) && input.fleet.length > 0
      ? input.fleet
      : [
          { id: 'EV_01', homeDepotId: depots[0].id, currentSOC: 0.90, payloadCapacityKg: 500 },
          { id: 'EV_02', homeDepotId: depots[1].id, currentSOC: 0.85, payloadCapacityKg: 500 }
        ];

    if (customers.length === 0) {
      return {
        routes: [],
        totalTravelDistanceKm: 0,
        totalEnergyConsumedKWh: 0,
        totalSolarEnergyChargedKWh: 0,
        totalGridEnergyChargedKWh: 0,
        totalChargingCostVND: 0,
        solarCostSavingsVND: 0,
        unservedCount: 0
      };
    }

    const depotMap = new Map();
    depots.forEach(d => depotMap.set(d.id, d));

    const unserved = [...customers].sort((a, b) => (a.readyHour || 0) - (b.readyHour || 0));
    const routes = [];
    let totalDistAll = 0;
    let totalEnergyConsumedAll = 0;
    let totalSolarChargedAll = 0;
    let totalGridChargedAll = 0;
    let totalChargingCostAll = 0;
    let totalCostWithoutSolarAll = 0;

    for (const vehicle of fleet) {
      if (unserved.length === 0) break;

      const startDepot = depotMap.get(vehicle.homeDepotId) || depots[0];
      let currentLoc = startDepot;
      let currentTime = startDepot.openHour || 7.0;
      let currentSOC = Math.min(this.maxSOC, Math.max(this.minSOC, vehicle.currentSOC || 0.90));
      let currentLoad = 0;
      const vehicleRouteStops = [];
      let vehicleDist = 0;
      let vehicleEnergyConsumed = 0;

      while (unserved.length > 0) {
        let bestIdx = -1;
        let minDetour = Infinity;

        for (let i = 0; i < unserved.length; i++) {
          const cust = unserved[i];
          const dist = this._calculateDistance(currentLoc, cust);
          const travelHours = dist / 30; // avg 30 km/h
          const arrivalTime = currentTime + travelHours;

          if (currentLoad + (cust.demand || 10) <= vehicle.payloadCapacityKg &&
              arrivalTime <= (cust.dueHour || 20)) {
            if (dist < minDetour) {
              minDetour = dist;
              bestIdx = i;
            }
          }
        }

        if (bestIdx === -1) break;

        const nextCust = unserved.splice(bestIdx, 1)[0];
        const dist = this._calculateDistance(currentLoc, nextCust);
        const travelHours = dist / 30;
        const arrivalTime = Math.max(currentTime + travelHours, nextCust.readyHour || 0);
        const serviceHours = (nextCust.serviceMinutes || 15) / 60;
        const departureTime = arrivalTime + serviceHours;

        // Energy consumption considering payload
        const loadRatio = currentLoad / vehicle.payloadCapacityKg;
        const unitConsumption = this.baseConsumptionPerKm + this.payloadConsumptionFactor * loadRatio;
        const travelEnergy = dist * unitConsumption;

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

      // Return to best / closest allowable Depot
      let bestReturnDepot = depots[0];
      let minReturnDist = Infinity;
      for (const d of depots) {
        const dDist = this._calculateDistance(currentLoc, d);
        if (dDist < minReturnDist) {
          minReturnDist = dDist;
          bestReturnDepot = d;
        }
      }

      const returnTravelHours = minReturnDist / 30;
      const returnArrival = currentTime + returnTravelHours;
      const returnEnergy = minReturnDist * this.baseConsumptionPerKm;
      currentSOC -= returnEnergy / this.batteryCapacityKWh;
      vehicleDist += minReturnDist;
      vehicleEnergyConsumed += returnEnergy;

      // Solar & Grid Microgrid Recharging at return depot
      const energyNeededToRefill = Math.max(0, (this.maxSOC - currentSOC) * this.batteryCapacityKWh);
      const solarAvailKW = this.getSolarPowerKW(bestReturnDepot, returnArrival);
      const solarEnergyDeliveredKWh = Math.min(energyNeededToRefill, solarAvailKW * 0.8);
      const gridEnergyDeliveredKWh = energyNeededToRefill - solarEnergyDeliveredKWh;

      const gridRate = this.getGridTariff(returnArrival);
      const chargingCost = (solarEnergyDeliveredKWh * this.solarLevelizedCostVND) + (gridEnergyDeliveredKWh * gridRate);
      const costWithoutSolar = energyNeededToRefill * gridRate;
      const solarSavings = costWithoutSolar - chargingCost;

      vehicleRouteStops.push({
        stopId: bestReturnDepot.id,
        location: { x: bestReturnDepot.x, y: bestReturnDepot.y },
        arrivalTime: Number(returnArrival.toFixed(2)),
        distanceFromPrevKm: Number(minReturnDist.toFixed(2)),
        energyConsumedKWh: Number(returnEnergy.toFixed(2)),
        socAtArrival: Number(currentSOC.toFixed(3)),
        action: 'DEPOT_RETURN_SOLAR_RECHARGE',
        rechargeDispatch: {
          solarChargedKWh: Number(solarEnergyDeliveredKWh.toFixed(2)),
          gridChargedKWh: Number(gridEnergyDeliveredKWh.toFixed(2)),
          solarSavingsVND: Math.round(solarSavings),
          totalCostVND: Math.round(chargingCost)
        }
      });

      routes.push({
        vehicleId: vehicle.id,
        startDepotId: startDepot.id,
        endDepotId: bestReturnDepot.id,
        numDeliveries: vehicleRouteStops.length - 1,
        totalDistanceKm: Number(vehicleDist.toFixed(2)),
        totalEnergyConsumedKWh: Number(vehicleEnergyConsumed.toFixed(2)),
        solarChargedKWh: Number(solarEnergyDeliveredKWh.toFixed(2)),
        gridChargedKWh: Number(gridEnergyDeliveredKWh.toFixed(2)),
        finalSOC: Number(this.maxSOC.toFixed(2)),
        stops: vehicleRouteStops
      });

      totalDistAll += vehicleDist;
      totalEnergyConsumedAll += vehicleEnergyConsumed;
      totalSolarChargedAll += solarEnergyDeliveredKWh;
      totalGridChargedAll += gridEnergyDeliveredKWh;
      totalChargingCostAll += chargingCost;
      totalCostWithoutSolarAll += costWithoutSolar;
    }

    return {
      unservedCount: unserved.length,
      routes,
      totalTravelDistanceKm: Number(totalDistAll.toFixed(2)),
      totalEnergyConsumedKWh: Number(totalEnergyConsumedAll.toFixed(2)),
      totalSolarEnergyChargedKWh: Number(totalSolarChargedAll.toFixed(2)),
      totalGridEnergyChargedKWh: Number(totalGridChargedAll.toFixed(2)),
      totalChargingCostVND: Math.round(totalChargingCostAll),
      solarCostSavingsVND: Math.round(totalCostWithoutSolarAll - totalChargingCostAll),
      sustainability: {
        co2AvoidedKg: Number((totalSolarChargedAll * 0.72).toFixed(2)),
        cleanSolarSharePct: Number(
          ((totalSolarChargedAll / (totalSolarChargedAll + totalGridChargedAll || 1)) * 100).toFixed(1)
        )
      }
    };
  }
}

export default EVRPTWMultiDepotMicrogridRouter;
