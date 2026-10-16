/**
 * EVRPTW with Onboard Photovoltaic Solar Generation (EVRPTWPVPanelOnboardSolarRouter)
 * 
 * Theoretical Foundations:
 * - D. Schiffer, G. Walther (Transportation Science 2017) - "The Electric Vehicle Routing Problem with Time Windows and Partial Recharging"
 * - E. Demir, T. Bektas, G. Laporte (Computers & Operations Research 2019) - "A Review of Green Vehicle Routing"
 * - F. Toth et al. (Solar Energy 2021) - "Vehicle-Integrated Photovoltaics for Delivery Fleets"
 * 
 * Mathematical Formulation:
 * 1. Diurnal Solar Irradiance Curve:
 *    Day window: t in [0, 720] min (06:00 to 18:00, sunrise to sunset)
 *    P_solar(t) = P_peak * max(0, sin(pi * t / 720)) * (1 - cloudCover)
 * 2. Continuous In-Transit & Parked Trickle Charging:
 *    Energy harvested over interval [t1, t2]:
 *      E_solar = P_solar((t1 + t2)/2) * ((t2 - t1) / 60) (kWh)
 *    Driving segment:
 *      E(t2) = min(C_nominal, E(t1) - dist * e_rate + E_solar)
 *    Customer service dwell:
 *      E(t3) = min(C_nominal, E(t2) + E_solar_dwell)
 * 3. Solar Fleet Economics:
 *    Avoided grid electricity cost: totalHarvestedKwh * tariffVnd
 *    CO2 offset: totalHarvestedKwh * 0.72 kg CO2/kWh
 */

export class EVRPTWPVPanelOnboardSolarRouter {
  /**
   * @param {Object} [options]
   * @param {Object} [options.depot] Central logistics hub coordinates
   * @param {number} [options.nominalBatteryKwh=35.0] Nominal battery capacity
   * @param {number} [options.consumptionPerKm=0.28] Electricity consumption rate (kWh/km)
   * @param {number} [options.minSocSafetyBuffer=0.15] Minimum SOC safety buffer fraction
   * @param {number} [options.travelSpeedKmMin=0.6] Travel speed (0.6 km/min = 36 km/h)
   * @param {number} [options.solarPeakKw=1.2] Onboard monocrystalline solar panel peak rating (kW)
   * @param {number} [options.cloudCover=0.10] Cloud cover index [0.0 = clear sky, 1.0 = heavy overcast]
   * @param {number} [options.gridTariffVndPerKwh=2800] Grid electricity tariff (VND/kWh)
   * @param {number} [options.latenessPenaltyVndPerMin=800] Customer lateness penalty
   * @param {number} [options.dayLengthMin=720] Total daytime duration (720 min = 12 hours)
   */
  constructor(options = {}) {
    this.depot = options.depot || { id: "HUB_SPX_SOLAR", name: "SPX Express Green Solar Hub", x: 10.7769, y: 106.7009 };
    this.nominalBatteryKwh = Math.max(8.0, Number(options.batteryCapacity || options.nominalBatteryKwh || 35.0));
    this.consumptionPerKm = Math.max(0.05, Number(options.consumptionPerKm || (options.dischargeRateKw ? options.dischargeRateKw / 36.0 : 0.28)));
    this.minSocSafetyBuffer = Math.max(0.05, Math.min(0.40, Number(options.minReserveSoc || options.minSocSafetyBuffer || 0.15)));
    this.travelSpeedKmMin = Math.max(0.1, Number(options.travelSpeedKmMin || 0.6));

    // Solar PV parameters
    this.solarPeakKw = Math.max(0.2, Number(options.solarPeakKw || 1.2));
    this._solarEfficiency = Number(options.solarEfficiency || 0.22);
    this.panelAreaM2 = Number(options.panelAreaM2 || 5.5);
    this.dischargeRateKw = Number(options.dischargeRateKw || 15);
    this.cloudCover = Math.max(0.0, Math.min(0.95, Number(options.cloudCover !== undefined ? options.cloudCover : 0.10)));
    this.gridTariffVndPerKwh = Math.max(500, Number(options.gridTariffVndPerKwh || 2800));
    this.latenessPenaltyVndPerMin = Math.max(10, Number(options.latenessPenaltyVndPerMin || 800));
    this.dayLengthMin = Math.max(300, Number(options.dayLengthMin || 720));

    this.staticStations = options.staticStations || [
      { id: "CS_SOLAR_D1", name: "Trạm Sạc Năng Lượng Mặt Trời Q1", x: 10.7720, y: 106.6950 },
      { id: "CS_SOLAR_BTT", name: "Trạm Sạc Năng Lượng Mặt Trời Bình Thạnh", x: 10.7950, y: 106.7120 }
    ];

    this.solvedPlansCount = 0;
  }

  get batteryCapacity() { return this.nominalBatteryKwh; }
  get solarEfficiency() { return this._solarEfficiency; }

  getDiurnalSolarPower(timeMin) {
    return this.getInstantaneousSolarPowerKw(timeMin);
  }

  computeTransitSolarEnergy(timeMin, durationMin) {
    const solarHarvestKwh = this.calculateIntervalSolarEnergyKwh(timeMin, timeMin + durationMin);
    const hours = durationMin / 60.0;
    const tractionKwh = Number((hours * this.dischargeRateKw).toFixed(2));
    return {
      durationMin,
      solarHarvestKwh,
      tractionKwh,
      netEnergyKwh: Number((solarHarvestKwh - tractionKwh).toFixed(3))
    };
  }

  computeParkingSolarEnergy(timeMin, durationMin) {
    const solarHarvestKwh = this.calculateIntervalSolarEnergyKwh(timeMin, timeMin + durationMin);
    return {
      durationMin,
      solarHarvestKwh
    };
  }

  /**
   * Euclidean metric distance
   * @param {{ x: number, y: number }} p1 
   * @param {{ x: number, y: number }} p2 
   * @returns {number}
   */
  calculateDistanceKm(p1, p2) {
    if (!p1 || !p2) return 0;
    const dx = (Number(p1.x) || 0) - (Number(p2.x) || 0);
    const dy = (Number(p1.y) || 0) - (Number(p2.y) || 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Instantaneous solar generation power (kW) at daytime minute t
   * @param {number} timeMin Minute from start of day (0..720)
   * @returns {number} kW
   */
  getInstantaneousSolarPowerKw(timeMin) {
    const t = Math.max(0, Math.min(this.dayLengthMin, Number(timeMin) || 0));
    const normalizedTime = Math.sin((Math.PI * t) / this.dayLengthMin);
    const irradianceFactor = Math.max(0.0, normalizedTime) * (1.0 - this.cloudCover);
    return Number((this.solarPeakKw * irradianceFactor).toFixed(4));
  }

  /**
   * Calculates solar energy generated over a time interval [t1, t2] (minutes)
   * @param {number} t1 
   * @param {number} t2 
   * @returns {number} kWh
   */
  calculateIntervalSolarEnergyKwh(t1, t2) {
    const start = Math.max(0, Math.min(this.dayLengthMin, Number(t1) || 0));
    const end = Math.max(start, Math.min(this.dayLengthMin, Number(t2) || start));
    const durationHours = (end - start) / 60.0;
    if (durationHours <= 0) return 0;

    const midTime = (start + end) / 2.0;
    const avgPowerKw = this.getInstantaneousSolarPowerKw(midTime);
    return Number((avgPowerKw * durationHours).toFixed(4));
  }

  /**
   * Solves EV routing plan with continuous onboard solar generation
   * @param {Array<Object>} customers 
   * @param {number} [initialSoc=1.0] 
   * @returns {Object}
   */
  solvePlan(customers = [], initialSoc = 1.0) {
    this.solvedPlansCount++;
    const minSafeKwh = this.nominalBatteryKwh * this.minSocSafetyBuffer;
    let currentBatteryKwh = Math.min(this.nominalBatteryKwh, this.nominalBatteryKwh * Math.max(0.2, initialSoc));
    let currentTimeMin = 60; // Start at 07:00 (minute 60)
    let currentLocation = { ...this.depot };

    let totalDistanceKm = 0;
    let totalDrivingSolarKwh = 0;
    let totalParkingSolarKwh = 0;
    let totalGridChargedKwh = 0;
    let totalLatenessMin = 0;

    const routeLegs = [];
    routeLegs.push({
      type: "DEPOT_DEPARTURE",
      locationId: this.depot.id,
      name: this.depot.name,
      timeMin: currentTimeMin,
      solarPowerKw: this.getInstantaneousSolarPowerKw(currentTimeMin),
      batteryKwh: Number(currentBatteryKwh.toFixed(2)),
      socPercent: Number(((currentBatteryKwh / this.nominalBatteryKwh) * 100).toFixed(1))
    });

    const pending = [...customers].map((c, i) => ({
      ...c,
      id: c.id || `CUST_${i + 1}`,
      dueTime: Number(c.dueTime || 9999),
      readyTime: Number(c.readyTime || 0),
      serviceTimeMin: Number(c.serviceTimeMin || 10)
    }));

    while (pending.length > 0) {
      // Nearest neighbor with time-window prioritization
      let bestIdx = 0;
      let minScore = Infinity;

      for (let i = 0; i < pending.length; i++) {
        const c = pending[i];
        const dist = this.calculateDistanceKm(currentLocation, c);
        const arrivalTime = currentTimeMin + (dist / this.travelSpeedKmMin);
        const lateness = Math.max(0, arrivalTime - c.dueTime);
        const score = dist * 10 + lateness * 40;

        if (score < minScore) {
          minScore = score;
          bestIdx = i;
        }
      }

      const nextCustomer = pending.splice(bestIdx, 1)[0];
      const distToCustomer = this.calculateDistanceKm(currentLocation, nextCustomer);
      const travelDurationMin = distToCustomer / this.travelSpeedKmMin;
      const energyConsumedKwh = distToCustomer * this.consumptionPerKm;

      // Solar energy harvested while driving
      const drivingSolarKwh = this.calculateIntervalSolarEnergyKwh(currentTimeMin, currentTimeMin + travelDurationMin);
      totalDrivingSolarKwh += drivingSolarKwh;
      totalDistanceKm += distToCustomer;

      const arrivalTimeMin = currentTimeMin + travelDurationMin;
      currentBatteryKwh = Math.min(this.nominalBatteryKwh, currentBatteryKwh - energyConsumedKwh + drivingSolarKwh);

      // Check emergency grid recharge if below buffer
      if (currentBatteryKwh < minSafeKwh) {
        const topUpKwh = (this.nominalBatteryKwh * 0.85) - currentBatteryKwh;
        totalGridChargedKwh += topUpKwh;
        currentBatteryKwh += topUpKwh;
        routeLegs.push({
          type: "GRID_BACKUP_RECHARGE",
          timeMin: Number(arrivalTimeMin.toFixed(2)),
          chargedKwh: Number(topUpKwh.toFixed(2)),
          batteryKwh: Number(currentBatteryKwh.toFixed(2)),
          socPercent: Number(((currentBatteryKwh / this.nominalBatteryKwh) * 100).toFixed(1))
        });
      }

      // Solar energy harvested while parked serving customer
      const departureTimeMin = arrivalTimeMin + nextCustomer.serviceTimeMin;
      const parkingSolarKwh = this.calculateIntervalSolarEnergyKwh(arrivalTimeMin, departureTimeMin);
      totalParkingSolarKwh += parkingSolarKwh;
      currentBatteryKwh = Math.min(this.nominalBatteryKwh, currentBatteryKwh + parkingSolarKwh);

      const lateness = Math.max(0, arrivalTimeMin - nextCustomer.dueTime);
      totalLatenessMin += lateness;

      routeLegs.push({
        type: "CUSTOMER_DELIVERY",
        customerId: nextCustomer.id,
        name: nextCustomer.name || nextCustomer.id,
        arrivalTimeMin: Number(arrivalTimeMin.toFixed(2)),
        solarHarvestedKwh: Number((drivingSolarKwh + parkingSolarKwh).toFixed(3)),
        latenessMin: Number(lateness.toFixed(2)),
        batteryKwh: Number(currentBatteryKwh.toFixed(2)),
        socPercent: Number(((currentBatteryKwh / this.nominalBatteryKwh) * 100).toFixed(1))
      });

      currentTimeMin = departureTimeMin;
      currentLocation = { x: nextCustomer.x, y: nextCustomer.y };
    }

    // Return to Depot
    const returnDist = this.calculateDistanceKm(currentLocation, this.depot);
    const returnTravelMin = returnDist / this.travelSpeedKmMin;
    const returnDrivingSolarKwh = this.calculateIntervalSolarEnergyKwh(currentTimeMin, currentTimeMin + returnTravelMin);
    totalDrivingSolarKwh += returnDrivingSolarKwh;
    totalDistanceKm += returnDist;

    const returnConsumedKwh = returnDist * this.consumptionPerKm;
    currentBatteryKwh = Math.min(this.nominalBatteryKwh, currentBatteryKwh - returnConsumedKwh + returnDrivingSolarKwh);
    currentTimeMin += returnTravelMin;

    routeLegs.push({
      type: "DEPOT_ARRIVAL",
      locationId: this.depot.id,
      name: this.depot.name,
      arrivalTimeMin: Number(currentTimeMin.toFixed(2)),
      solarHarvestedKwh: Number(returnDrivingSolarKwh.toFixed(3)),
      batteryKwh: Number(currentBatteryKwh.toFixed(2)),
      socPercent: Number(((currentBatteryKwh / this.nominalBatteryKwh) * 100).toFixed(1))
    });

    const totalSolarHarvestedKwh = totalDrivingSolarKwh + totalParkingSolarKwh;
    const avoidedElectricityVnd = Math.round(totalSolarHarvestedKwh * this.gridTariffVndPerKwh);
    const gridElectricityCostVnd = Math.round(totalGridChargedKwh * this.gridTariffVndPerKwh);
    const totalLatenessCostVnd = Math.round(totalLatenessMin * this.latenessPenaltyVndPerMin);
    const totalOperatingCostVnd = gridElectricityCostVnd + totalLatenessCostVnd + Math.round(totalDistanceKm * 1500) - avoidedElectricityVnd;

    return {
      success: true,
      depot: this.depot,
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      totalDurationMin: Number((currentTimeMin - 60).toFixed(2)),
      totalSolarHarvestKwh: Number(totalSolarHarvestedKwh.toFixed(3)),
      routes: [
        {
          routeId: "ROUTE_SOLAR_1",
          legs: routeLegs,
          routeLegs,
          totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
          totalSolarHarvestKwh: Number(totalSolarHarvestedKwh.toFixed(3))
        }
      ],
      solarMetrics: {
        totalSolarHarvestedKwh: Number(totalSolarHarvestedKwh.toFixed(3)),
        drivingSolarKwh: Number(totalDrivingSolarKwh.toFixed(3)),
        parkingSolarKwh: Number(totalParkingSolarKwh.toFixed(3)),
        avoidedElectricityCostVnd: avoidedElectricityVnd,
        co2OffsetKg: Number((totalSolarHarvestedKwh * 0.72).toFixed(3))
      },
      costsVnd: {
        gridElectricity: gridElectricityCostVnd,
        avoidedSolarSavings: avoidedElectricityVnd,
        latenessPenalty: totalLatenessCostVnd,
        distanceTravel: Math.round(totalDistanceKm * 1500),
        netOperatingCost: Math.max(0, totalOperatingCostVnd)
      },
      batteryStatus: {
        nominalCapacityKwh: this.nominalBatteryKwh,
        finalRemainingKwh: Number(currentBatteryKwh.toFixed(2)),
        finalSocPercent: Number(((currentBatteryKwh / this.nominalBatteryKwh) * 100).toFixed(1))
      },
      totalLatenessMin: Number(totalLatenessMin.toFixed(2)),
      legsCount: routeLegs.length,
      routeLegs
    };
  }

  /**
   * Alias helper for route planning
   */
  planRoute(customers = [], options = {}) {
    const soc = options.initialBatteryKwh !== undefined
      ? options.initialBatteryKwh / this.nominalBatteryKwh
      : (options.initialSoc !== undefined ? options.initialSoc : 1.0);
    return this.solvePlan(customers, soc);
  }

  /**
   * Diagnostic telemetry
   * @returns {Object}
   */
  getTelemetry() {
    return {
      algorithm: "EVRPTWPVPanelOnboardSolarRouter",
      nominalBatteryKwh: this.nominalBatteryKwh,
      solarPeakKw: this.solarPeakKw,
      cloudCover: this.cloudCover,
      gridTariffVndPerKwh: this.gridTariffVndPerKwh,
      dayLengthMin: this.dayLengthMin,
      solvedPlansCount: this.solvedPlansCount
    };
  }
}

export default EVRPTWPVPanelOnboardSolarRouter;
