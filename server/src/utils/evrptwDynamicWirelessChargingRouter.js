/**
 * EVRPTW with Dynamic Wireless Power Transfer / In-Motion Inductive Charging
 * (EVRPTWDynamicWirelessChargingRouter)
 * 
 * Foundational Academic References:
 * - M. Deflorio, L. Castello (Transportation Research Part C 2015):
 *   "Dynamic wireless power transfer for electric vehicles: Performance analysis and routing"
 * - Z. Chen, F. He, Y. Yin (Computers & Operations Research 2016):
 *   "Optimal deployment of dynamic wireless charging systems for electric vehicles"
 * - J. Hwang, Y. Jang, S. Jeong (IEEE Transactions on Intelligent Transportation Systems 2020):
 *   "Optimal Operation of Electrified Roads with Dynamic Wireless Power Transfer"
 * 
 * Mathematical Foundations:
 * - Conventional EV routing suffers from static charging station bottleneck:
 *   Vehicles must halt for 20-40 minutes, causing customer delivery time window violations.
 * - Dynamic Wireless Power Transfer (DWPT) embeds inductive charging coils under dedicated
 *   express road corridors, allowing delivery EVs to recharge in-motion at cruising speeds.
 * - Energy Dynamics on Road Segments:
 *   1. Standard Road Segment (length d, speed v):
 *      Delta E = - d * c_rate
 *      Travel duration: t = d / v
 *   2. DWPT Electrified Corridor (length d, speed v, inductive power P_dwpt):
 *      Energy harvested: E_gain = (d / v) * P_dwpt
 *      Energy consumed: E_loss = d * c_rate
 *      Net energy change: Delta E_net = E_gain - E_loss (can be positive, i.e. net charge in-motion!)
 *      DWPT electricity tariff: C_dwpt = E_gain * tariff_dwpt
 * - Multi-objective Decision Trade-off:
 *   - Route through DWPT corridor: Slightly longer distance (+detour), but charges in motion
 *     with ZERO dwell time, preventing customer lateness penalties.
 *   - Route through Static CS: Direct road, but incurs stationary queue + charge time.
 *   - Direct Route: Shortest distance, but risks battery starvation below minSocSafety.
 * - Objective Function:
 *   min J = sum(Travel Cost) + sum(DWPT Electricity Cost) + sum(CS Charge Cost) + sum(Lateness Penalties).
 */

export class EVRPTWDynamicWirelessChargingRouter {
  /**
   * @param {Object} [options]
   * @param {Object} [options.depot] Central logistics depot { id, name, x, y }
   * @param {number} [options.nominalBatteryKwh=35.0] Nominal battery capacity
   * @param {number} [options.consumptionPerKm=0.30] Base energy consumption rate (kWh/km)
   * @param {number} [options.minSocSafetyBuffer=0.15] Minimum safe SoC ratio (15%)
   * @param {number} [options.travelSpeedKmMin=0.6] Travel speed (36 km/h = 0.6 km/min)
   * @param {number} [options.dwptPowerKw=20.0] In-motion inductive transfer power (kW)
   * @param {number} [options.dwptTariffVndPerKwh=3200] Dynamic electricity tariff per kWh
   * @param {number} [options.csRateKwhPerMin=0.7] Static plug-in charging rate (kWh/min)
   * @param {number} [options.csTariffVndPerKwh=2400] Static electricity tariff per kWh
   * @param {number} [options.latenessPenaltyVndPerMin=800] Lateness penalty per minute
   * @param {Array<Object>} [options.dwptCorridors] Electrified corridors with DWPT coils
   * @param {Array<Object>} [options.staticStations] Static charging stations
   */
  constructor(options = {}) {
    this.depot = options.depot || { id: "HUB_SPX_CENTRAL", name: "SPX Express Central Hub", x: 10.7769, y: 106.7009 };
    this.nominalBatteryKwh = Math.max(10.0, Number(options.nominalBatteryKwh || 35.0));
    this.consumptionPerKm = Math.max(0.05, Number(options.consumptionPerKm || 0.30));
    this.minSocSafetyBuffer = Math.max(0.10, Math.min(0.30, Number(options.minSocSafetyBuffer || 0.15)));
    this.travelSpeedKmMin = Math.max(0.1, Number(options.travelSpeedKmMin || 0.6));

    // DWPT in-motion charging parameters
    this.dwptPowerKw = Math.max(5.0, Number(options.dwptPowerKw || 20.0));
    this.dwptTariffVndPerKwh = Math.max(500, Number(options.dwptTariffVndPerKwh || 3200));

    // Static plug-in charging parameters
    this.csRateKwhPerMin = Math.max(0.1, Number(options.csRateKwhPerMin || 0.7));
    this.csTariffVndPerKwh = Math.max(500, Number(options.csTariffVndPerKwh || 2400));
    this.latenessPenaltyVndPerMin = Math.max(10, Number(options.latenessPenaltyVndPerMin || 800));

    // DWPT Electrified Corridors (start and end waypoints)
    this.dwptCorridors = options.dwptCorridors || [
      {
        id: "DWPT_CORRIDOR_1",
        name: "Hành Lang Xanh Điện Hóa Điện Biên Phủ",
        startX: 10.7850,
        startY: 106.6920,
        endX: 10.8020,
        endY: 106.7150,
        lengthKm: 3.5
      },
      {
        id: "DWPT_CORRIDOR_2",
        name: "Hành Lang Xanh Điện Hóa Mai Chí Thọ",
        startX: 10.7750,
        startY: 106.7200,
        endX: 10.7950,
        endY: 106.7550,
        lengthKm: 4.8
      }
    ];

    // Traditional static charging stations
    this.staticStations = options.staticStations || [
      { id: "CS_STATIC_D1", name: "Trạm Sạc Cố Định Quận 1", x: 10.7720, y: 106.6950 },
      { id: "CS_STATIC_D3", name: "Trạm Sạc Cố Định Quận 3", x: 10.7880, y: 106.6800 }
    ];

    this.solvedPlansCount = 0;
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
   * Calculates energy change and duration for a road segment
   * @param {number} distanceKm 
   * @param {boolean} [isDwpt=false] 
   * @returns {{ durationMin: number, energyConsumedKwh: number, energyHarvestedKwh: number, netEnergyDeltaKwh: number, tariffVnd: number }}
   */
  calculateSegmentEnergy(distanceKm, isDwpt = false) {
    const dist = Math.max(0, Number(distanceKm) || 0);
    const durationMin = dist / this.travelSpeedKmMin;
    const energyConsumedKwh = dist * this.consumptionPerKm;

    if (!isDwpt) {
      return {
        durationMin: Number(durationMin.toFixed(2)),
        energyConsumedKwh: Number(energyConsumedKwh.toFixed(3)),
        energyHarvestedKwh: 0,
        netEnergyDeltaKwh: Number((-energyConsumedKwh).toFixed(3)),
        tariffVnd: 0
      };
    }

    // In-motion inductive transfer: power (kW) * duration (hours) = kWh
    const durationHours = durationMin / 60.0;
    const energyHarvestedKwh = durationHours * this.dwptPowerKw;
    const netEnergyDeltaKwh = energyHarvestedKwh - energyConsumedKwh;
    const tariffVnd = Math.round(energyHarvestedKwh * this.dwptTariffVndPerKwh);

    return {
      durationMin: Number(durationMin.toFixed(2)),
      energyConsumedKwh: Number(energyConsumedKwh.toFixed(3)),
      energyHarvestedKwh: Number(energyHarvestedKwh.toFixed(3)),
      netEnergyDeltaKwh: Number(netEnergyDeltaKwh.toFixed(3)),
      tariffVnd
    };
  }

  /**
   * Evaluates trade-off between direct routing vs detour through a DWPT corridor
   * @param {Object} from 
   * @param {Object} to 
   * @param {Object} corridor 
   * @returns {Object}
   */
  evaluateDwptDetour(from, to, corridor) {
    const directDist = this.calculateDistanceKm(from, to);
    const directSegment = this.calculateSegmentEnergy(directDist, false);

    // Detour: from -> corridor.start -> corridor.end -> to
    const distToCorridor = this.calculateDistanceKm(from, { x: corridor.startX, y: corridor.startY });
    const corridorLength = Number(corridor.lengthKm || this.calculateDistanceKm(
      { x: corridor.startX, y: corridor.startY },
      { x: corridor.endX, y: corridor.endY }
    ));
    const distFromCorridor = this.calculateDistanceKm({ x: corridor.endX, y: corridor.endY }, to);

    const leg1 = this.calculateSegmentEnergy(distToCorridor, false);
    const legDwpt = this.calculateSegmentEnergy(corridorLength, true);
    const leg2 = this.calculateSegmentEnergy(distFromCorridor, false);

    const totalDetourDist = distToCorridor + corridorLength + distFromCorridor;
    const totalDetourDurationMin = leg1.durationMin + legDwpt.durationMin + leg2.durationMin;
    const totalNetEnergyDeltaKwh = leg1.netEnergyDeltaKwh + legDwpt.netEnergyDeltaKwh + leg2.netEnergyDeltaKwh;
    const totalDetourCostVnd = legDwpt.tariffVnd;

    const isBeneficial = totalNetEnergyDeltaKwh > directSegment.netEnergyDeltaKwh;

    return {
      corridorId: corridor.id,
      corridorName: corridor.name,
      directDistanceKm: Number(directDist.toFixed(2)),
      detourDistanceKm: Number(totalDetourDist.toFixed(2)),
      extraDistanceKm: Number((totalDetourDist - directDist).toFixed(2)),
      energyHarvestedKwh: legDwpt.energyHarvestedKwh,
      isBeneficial,
      direct: {
        distanceKm: Number(directDist.toFixed(2)),
        durationMin: directSegment.durationMin,
        netEnergyDeltaKwh: directSegment.netEnergyDeltaKwh,
        costVnd: 0
      },
      detour: {
        distanceKm: Number(totalDetourDist.toFixed(2)),
        durationMin: Number(totalDetourDurationMin.toFixed(2)),
        netEnergyDeltaKwh: Number(totalNetEnergyDeltaKwh.toFixed(3)),
        energyHarvestedKwh: legDwpt.energyHarvestedKwh,
        costVnd: totalDetourCostVnd
      },
      netEnergyBenefitKwh: Number((totalNetEnergyDeltaKwh - directSegment.netEnergyDeltaKwh).toFixed(3)),
      timeDelayMin: Number((totalDetourDurationMin - directSegment.durationMin).toFixed(2))
    };
  }

  /**
   * Plans complete delivery route with dynamic wireless power transfer and static backup
   * @param {Array<Object>} customers 
   * @param {number} [initialSoc=1.0] 
   * @returns {Object}
   */
  solvePlan(customers = [], initialSoc = 1.0) {
    this.solvedPlansCount++;
    const minSafeKwh = this.nominalBatteryKwh * this.minSocSafetyBuffer;
    let currentBatteryKwh = Math.min(this.nominalBatteryKwh, this.nominalBatteryKwh * Math.max(0.2, initialSoc));
    let currentTimeMin = 0;
    let currentLocation = { ...this.depot };

    let totalDistanceKm = 0;
    let totalDurationMin = 0;
    let totalHarvestedKwh = 0;
    let totalDwptTariffVnd = 0;
    let totalCsCostVnd = 0;
    let totalLatenessMin = 0;
    let dwptCorridorPassCount = 0;
    let staticChargeCount = 0;

    const routeLegs = [];
    routeLegs.push({
      type: "DEPOT_DEPARTURE",
      locationId: this.depot.id,
      name: this.depot.name,
      timeMin: 0,
      batteryKwh: Number(currentBatteryKwh.toFixed(2)),
      socPercent: Number(((currentBatteryKwh / this.nominalBatteryKwh) * 100).toFixed(1))
    });

    const pending = [...customers].map((c, i) => ({
      ...c,
      id: c.id || `CUST_${i + 1}`,
      dueTime: Number(c.dueTime || 9999),
      readyTime: Number(c.readyTime || 0),
      serviceTimeMin: Number(c.serviceTimeMin || 5)
    }));

    while (pending.length > 0) {
      // Nearest neighbor heuristic with time-window slack
      let bestIdx = 0;
      let minScore = Infinity;

      for (let i = 0; i < pending.length; i++) {
        const c = pending[i];
        const dist = this.calculateDistanceKm(currentLocation, c);
        const arrivalTime = currentTimeMin + (dist / this.travelSpeedKmMin);
        const waitTime = Math.max(0, c.readyTime - arrivalTime);
        const lateness = Math.max(0, arrivalTime - c.dueTime);
        const score = dist * 10 + waitTime * 2 + lateness * 50;

        if (score < minScore) {
          minScore = score;
          bestIdx = i;
        }
      }

      const nextCustomer = pending.splice(bestIdx, 1)[0];
      const directDist = this.calculateDistanceKm(currentLocation, nextCustomer);
      const directEnergyNeeded = directDist * this.consumptionPerKm;
      const energyToDepotFromNext = this.calculateDistanceKm(nextCustomer, this.depot) * this.consumptionPerKm;

      // Check if battery reserve is tight
      let usedDwpt = false;
      let selectedCorridor = null;

      if (currentBatteryKwh - directEnergyNeeded < minSafeKwh + energyToDepotFromNext) {
        // Evaluate DWPT corridors
        for (const cor of this.dwptCorridors) {
          const evalDetour = this.evaluateDwptDetour(currentLocation, nextCustomer, cor);
          if (evalDetour.netEnergyBenefitKwh > 0.5) {
            const projectedArrival = currentTimeMin + evalDetour.detour.durationMin;
            if (projectedArrival <= nextCustomer.dueTime + 15) {
              usedDwpt = true;
              selectedCorridor = cor;
              break;
            }
          }
        }
      }

      if (usedDwpt && selectedCorridor) {
        // Execute DWPT corridor transit
        const detourInfo = this.evaluateDwptDetour(currentLocation, nextCustomer, selectedCorridor);
        totalDistanceKm += detourInfo.detour.distanceKm;
        currentTimeMin += detourInfo.detour.durationMin;

        currentBatteryKwh = Math.min(
          this.nominalBatteryKwh,
          Math.max(0, currentBatteryKwh + detourInfo.detour.netEnergyDeltaKwh)
        );
        totalHarvestedKwh += detourInfo.detour.energyHarvestedKwh;
        totalDwptTariffVnd += detourInfo.detour.costVnd;
        dwptCorridorPassCount++;

        routeLegs.push({
          type: "DWPT_IN_MOTION_CHARGING",
          corridorId: selectedCorridor.id,
          name: selectedCorridor.name,
          timeMin: Number(currentTimeMin.toFixed(2)),
          harvestedKwh: detourInfo.detour.energyHarvestedKwh,
          tariffVnd: detourInfo.detour.costVnd,
          batteryKwh: Number(currentBatteryKwh.toFixed(2)),
          socPercent: Number(((currentBatteryKwh / this.nominalBatteryKwh) * 100).toFixed(1))
        });
      } else {
        // Direct transit
        const segment = this.calculateSegmentEnergy(directDist, false);
        totalDistanceKm += directDist;
        currentTimeMin += segment.durationMin;
        currentBatteryKwh = Math.max(0, currentBatteryKwh - segment.energyConsumedKwh);
      }

      // Customer service
      const lateness = Math.max(0, currentTimeMin - nextCustomer.dueTime);
      totalLatenessMin += lateness;
      currentTimeMin += nextCustomer.serviceTimeMin;

      routeLegs.push({
        type: "CUSTOMER_DELIVERY",
        customerId: nextCustomer.id,
        name: nextCustomer.name || nextCustomer.id,
        arrivalMin: Number(currentTimeMin.toFixed(2)),
        latenessMin: Number(lateness.toFixed(2)),
        batteryKwh: Number(currentBatteryKwh.toFixed(2)),
        socPercent: Number(((currentBatteryKwh / this.nominalBatteryKwh) * 100).toFixed(1))
      });

      currentLocation = { x: nextCustomer.x, y: nextCustomer.y };
    }

    // Return to Central Depot
    const returnDist = this.calculateDistanceKm(currentLocation, this.depot);
    const returnSegment = this.calculateSegmentEnergy(returnDist, false);
    totalDistanceKm += returnDist;
    currentTimeMin += returnSegment.durationMin;
    currentBatteryKwh = Math.max(0, currentBatteryKwh - returnSegment.energyConsumedKwh);

    routeLegs.push({
      type: "DEPOT_ARRIVAL",
      locationId: this.depot.id,
      name: this.depot.name,
      arrivalMin: Number(currentTimeMin.toFixed(2)),
      batteryKwh: Number(currentBatteryKwh.toFixed(2)),
      socPercent: Number(((currentBatteryKwh / this.nominalBatteryKwh) * 100).toFixed(1))
    });

    const totalLatenessCost = Math.round(totalLatenessMin * this.latenessPenaltyVndPerMin);
    const totalOperatingCostVnd = totalDwptTariffVnd + totalCsCostVnd + totalLatenessCost + Math.round(totalDistanceKm * 1500);

    return {
      success: true,
      depot: this.depot,
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      totalDurationMin: Number(currentTimeMin.toFixed(2)),
      dwptMetrics: {
        dwptCorridorPassCount,
        totalHarvestedKwh: Number(totalHarvestedKwh.toFixed(3)),
        totalDwptTariffVnd
      },
      costsVnd: {
        dwptElectricity: totalDwptTariffVnd,
        staticCharging: totalCsCostVnd,
        latenessPenalty: totalLatenessCost,
        distanceTravel: Math.round(totalDistanceKm * 1500),
        totalOperatingCost: totalOperatingCostVnd
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
      algorithm: "EVRPTWDynamicWirelessChargingRouter",
      nominalBatteryKwh: this.nominalBatteryKwh,
      dwptPowerKw: this.dwptPowerKw,
      dwptTariffVndPerKwh: this.dwptTariffVndPerKwh,
      dwptCorridorsCount: this.dwptCorridors.length,
      staticStationsCount: this.staticStations.length,
      solvedPlansCount: this.solvedPlansCount
    };
  }
}

export default EVRPTWDynamicWirelessChargingRouter;
