/**
 * EVRPTWDynamicWirelessInductiveRouter (Chen et al. TR Part C 2020, Deflorio et al. Energies 2021, Ko et al. IEEE T-ITS 2017)
 *
 * Implements Electric Vehicle Routing Problem with Time Windows and Dynamic Wireless
 * Power Transfer (DWPT) / Inductive Roadway Charging Lanes for Urban SPX Express Fleets.
 *
 * Key Capabilities:
 * - Dynamic Wireless Power Transfer (DWPT): in-motion charging on dedicated inductive roadway corridors.
 * - Magnetic inductive coupling efficiency eta_wpt (typically 0.80 - 0.88).
 * - Speed-dependent in-motion energy absorption:
 *   E_absorbed = eta_wpt * P_wpt * (L_uv / v_uv).
 *   Slower speed on DWPT lanes increases dwell time and energy absorption, enabling in-route range extension!
 * - Aerodynamic and rolling resistance consumption:
 *   E_consumed = (e_base + c_drag * v_uv^2) * L_uv.
 * - Net energy balance E_net = E_absorbed - E_consumed on DWPT segments (can be positive!).
 * - Customer delivery time windows [e_i, l_i] and service duration.
 * - Multi-objective evaluation: Total distance, wireless power cost, time window tardiness penalty,
 *   and Range Anxiety Elimination Index (minimum SoC throughout the tour).
 */

export class EVRPTWDynamicWirelessInductiveRouter {
  /**
   * @param {Object} options
   * @param {number} [options.batteryCapacityKWh=60] - Battery capacity in kWh
   * @param {number} [options.minSoCFraction=0.15] - Reserve buffer SoC (15%)
   * @param {number} [options.defaultPowerKW=60] - Default DWPT transmitter power in kW
   * @param {number} [options.couplingEfficiency=0.85] - Magnetic induction coupling efficiency
   * @param {number} [options.electricityRatePerKWh=2500] - Wireless electricity tariff (VND/kWh)
   * @param {number} [options.baseConsumptionPerKm=0.22] - Base kWh consumed per km
   * @param {number} [options.speedMinKmh=20] - Minimum allowable speed on DWPT lanes (km/h)
   * @param {number} [options.speedMaxKmh=60] - Maximum allowable speed on road network (km/h)
   */
  constructor(options = {}) {
    this.batteryCapacityKWh = Math.max(10, Number(options.batteryCapacityKWh) || 60);
    this.minSoCFraction = Math.max(0.05, Math.min(0.40, Number(options.minSoCFraction) || 0.15));
    this.minEnergyBufferKWh = this.batteryCapacityKWh * this.minSoCFraction;
    this.defaultPowerKW = Math.max(20, Number(options.defaultPowerKW) || 60);
    this.couplingEfficiency = Math.max(0.5, Math.min(0.98, Number(options.couplingEfficiency) || 0.85));
    this.electricityRatePerKWh = Math.max(500, Number(options.electricityRatePerKWh) || 2500);
    this.baseConsumptionPerKm = Math.max(0.05, Number(options.baseConsumptionPerKm) || 0.22);
    this.speedMinKmh = Math.max(10, Number(options.speedMinKmh) || 20);
    this.speedMaxKmh = Math.max(this.speedMinKmh + 5, Number(options.speedMaxKmh) || 60);
  }

  /**
   * Calculate energy balance and transit time across a roadway edge (u -> v).
   * @param {Object} edge
   * @param {number} edge.distanceKm - Distance of road segment in km
   * @param {boolean} [edge.isDwptLane=false] - Whether segment has embedded inductive coils
   * @param {number} [edge.dwptLengthKm=0] - Portion of edge equipped with DWPT coils
   * @param {number} [edge.dwptPowerKW] - Transmitter power in kW (defaults to defaultPowerKW)
   * @param {number} [edge.targetSpeedKmh] - Transit speed on this edge
   * @returns {{transitTimeHours: number, energyConsumedKWh: number, energyAbsorbedKWh: number, netEnergyKWh: number, wirelessCostVND: number}}
   */
  calculateEdgeDynamics(edge) {
    const dist = Math.max(0.1, Number(edge.distanceKm) || 1.0);
    const speed = Math.max(this.speedMinKmh, Math.min(this.speedMaxKmh, Number(edge.targetSpeedKmh) || 40));
    const transitTimeHours = dist / speed;

    // Aerodynamic and rolling resistance model: e_km = base + 0.00005 * v^2
    const consumptionRate = this.baseConsumptionPerKm + 0.00005 * Math.pow(speed, 2);
    const energyConsumedKWh = dist * consumptionRate;

    let energyAbsorbedKWh = 0;
    let wirelessCostVND = 0;

    if (edge.isDwptLane) {
      const dwptLen = Math.min(dist, Math.max(0.1, Number(edge.dwptLengthKm) || dist));
      const powerKW = Math.max(10, Number(edge.dwptPowerKW) || this.defaultPowerKW);
      // Transit time on DWPT portion (hours)
      const dwptTimeHours = dwptLen / speed;
      // In-motion energy absorbed: E = eta * P * time
      energyAbsorbedKWh = this.couplingEfficiency * powerKW * dwptTimeHours;
      wirelessCostVND = energyAbsorbedKWh * this.electricityRatePerKWh;
    }

    const netEnergyKWh = energyAbsorbedKWh - energyConsumedKWh;

    return {
      transitTimeHours: Number(transitTimeHours.toFixed(4)),
      transitTimeMinutes: Number((transitTimeHours * 60).toFixed(2)),
      energyConsumedKWh: Number(energyConsumedKWh.toFixed(4)),
      energyAbsorbedKWh: Number(energyAbsorbedKWh.toFixed(4)),
      netEnergyKWh: Number(netEnergyKWh.toFixed(4)),
      wirelessCostVND: Math.round(wirelessCostVND)
    };
  }

  /**
   * Optimize travel speed on a DWPT lane segment to achieve a target energy gain or satisfy time deadline.
   * Lower speed absorbs more energy; higher speed saves transit time.
   * @param {number} lengthKm
   * @param {number} requiredEnergyKWh - Desired energy absorption
   * @param {number} maxAllowableTimeMinutes
   * @returns {{optimalSpeedKmh: number, energyAbsorbedKWh: number, transitTimeMinutes: number}}
   */
  optimizeDwptSpeed(lengthKm, requiredEnergyKWh, maxAllowableTimeMinutes) {
    const dist = Math.max(0.1, Number(lengthKm) || 2.0);
    const targetEnergy = Math.max(0.1, Number(requiredEnergyKWh) || 2.0);
    const maxTimeHours = Math.max(0.01, (Number(maxAllowableTimeMinutes) || 30) / 60);

    // E_absorbed = eta * P * (dist / v) => v_ideal = eta * P * dist / E_absorbed
    const vIdeal = (this.couplingEfficiency * this.defaultPowerKW * dist) / targetEnergy;

    // Constrain by time window: v >= dist / maxTimeHours
    const vTimeLimit = dist / maxTimeHours;
    const clampedSpeed = Math.max(this.speedMinKmh, Math.min(this.speedMaxKmh, Math.max(vIdeal, vTimeLimit)));

    const transitTimeHours = dist / clampedSpeed;
    const energyAbsorbedKWh = this.couplingEfficiency * this.defaultPowerKW * transitTimeHours;

    return {
      optimalSpeedKmh: Number(clampedSpeed.toFixed(1)),
      energyAbsorbedKWh: Number(energyAbsorbedKWh.toFixed(3)),
      transitTimeMinutes: Number((transitTimeHours * 60).toFixed(2))
    };
  }

  /**
   * Plan and evaluate an entire SPX Express multi-stop delivery tour with DWPT inductive lanes.
   * @param {Object} params
   * @param {Object} params.depot - { id, lat, lng, departureTime: 0 }
   * @param {Array<Object>} params.customers - Array of { id, lat, lng, demandKg, readyTimeMin, dueTimeMin, serviceDurationMin }
   * @param {Array<Object>} [params.dwptSegments=[]] - Predefined DWPT lane segments between nodes
   * @param {number} [params.initialSoC=1.0] - Starting state-of-charge fraction (0..1)
   * @returns {Object} Complete tour itinerary, SoC trajectory, wireless costs, and feasibility metrics
   */
  planInductiveTour(params) {
    const {
      depot = { id: 'DEPOT_HUB', readyTimeMin: 0, dueTimeMin: 720 },
      customers = [],
      dwptSegments = [],
      initialSoC = 1.0
    } = params;

    let currentSoCKWh = Math.min(this.batteryCapacityKWh, this.batteryCapacityKWh * Math.max(0.2, initialSoC));
    let currentTimeMin = Number(depot.readyTimeMin) || 0;
    let totalDistanceKm = 0;
    let totalAbsorbedKWh = 0;
    let totalConsumedKWh = 0;
    let totalWirelessCostVND = 0;
    let totalTardinessMin = 0;
    let minObservedSoCKWh = currentSoCKWh;

    const stops = [depot, ...customers, depot];
    const itinerary = [];

    // Helper: lookup whether an edge between u and v has DWPT
    const findDwpt = (uId, vId) => {
      return dwptSegments.find(s => (s.from === uId && s.to === vId) || (s.to === uId && s.from === vId));
    };

    for (let i = 0; i < stops.length - 1; i++) {
      const fromNode = stops[i];
      const toNode = stops[i + 1];

      // Approximate Euclidean distance in km (or use given distanceKm)
      let distKm = 3.5;
      if (toNode.distanceFromPrevKm) {
        distKm = Number(toNode.distanceFromPrevKm);
      } else if (fromNode.lat && fromNode.lng && toNode.lat && toNode.lng) {
        const dLat = (toNode.lat - fromNode.lat) * 111.0;
        const dLng = (toNode.lng - fromNode.lng) * 105.0;
        distKm = Math.sqrt(dLat * dLat + dLng * dLng);
      }

      const dwptInfo = findDwpt(fromNode.id, toNode.id);
      const isDwpt = Boolean(dwptInfo || toNode.hasDwptLane);

      // Choose speed: on DWPT lane, use 30 km/h to absorb more power; on regular road use 45 km/h
      const targetSpeed = isDwpt ? 30 : 45;

      const edgeDyn = this.calculateEdgeDynamics({
        distanceKm: distKm,
        isDwptLane: isDwpt,
        dwptLengthKm: isDwpt ? distKm : 0,
        dwptPowerKW: dwptInfo ? dwptInfo.powerKW : this.defaultPowerKW,
        targetSpeedKmh: targetSpeed
      });

      // Update simulation state
      totalDistanceKm += distKm;
      totalAbsorbedKWh += edgeDyn.energyAbsorbedKWh;
      totalConsumedKWh += edgeDyn.energyConsumedKWh;
      totalWirelessCostVND += edgeDyn.wirelessCostVND;

      currentTimeMin += edgeDyn.transitTimeMinutes;

      // Update SoC: Battery cannot exceed capacity
      currentSoCKWh = Math.min(this.batteryCapacityKWh, currentSoCKWh + edgeDyn.netEnergyKWh);
      if (currentSoCKWh < minObservedSoCKWh) {
        minObservedSoCKWh = currentSoCKWh;
      }

      // Check arrival time against time window
      let waitTimeMin = 0;
      let tardinessMin = 0;
      const readyMin = Number(toNode.readyTimeMin) || 0;
      const dueMin = Number(toNode.dueTimeMin) || 9999;

      if (currentTimeMin < readyMin) {
        waitTimeMin = readyMin - currentTimeMin;
        currentTimeMin = readyMin;
      } else if (currentTimeMin > dueMin) {
        tardinessMin = currentTimeMin - dueMin;
        totalTardinessMin += tardinessMin;
      }

      // Add service duration
      const serviceMin = Number(toNode.serviceDurationMin) || 0;
      currentTimeMin += serviceMin;

      itinerary.push({
        legIndex: i + 1,
        from: fromNode.id,
        to: toNode.id,
        distanceKm: Number(distKm.toFixed(2)),
        isDwptLane: isDwpt,
        transitMinutes: edgeDyn.transitTimeMinutes,
        energyAbsorbedKWh: edgeDyn.energyAbsorbedKWh,
        energyConsumedKWh: edgeDyn.energyConsumedKWh,
        netEnergyKWh: edgeDyn.netEnergyKWh,
        wirelessCostVND: edgeDyn.wirelessCostVND,
        arrivalSoCKWh: Number(currentSoCKWh.toFixed(2)),
        arrivalSoCPercent: Number(((currentSoCKWh / this.batteryCapacityKWh) * 100).toFixed(1)),
        arrivalTimeMin: Number(currentTimeMin.toFixed(1)),
        tardinessMinutes: Number(tardinessMin.toFixed(1))
      });
    }

    const isFeasible = minObservedSoCKWh >= this.minEnergyBufferKWh && totalTardinessMin <= 15.0;
    const rangeAnxietyEliminationIndex = Number(((minObservedSoCKWh / this.batteryCapacityKWh) * 100).toFixed(1));

    return {
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      totalTransitMinutes: Number(currentTimeMin.toFixed(1)),
      totalAbsorbedKWh: Number(totalAbsorbedKWh.toFixed(3)),
      totalConsumedKWh: Number(totalConsumedKWh.toFixed(3)),
      netEnergyBalanceKWh: Number((totalAbsorbedKWh - totalConsumedKWh).toFixed(3)),
      totalWirelessCostVND: Math.round(totalWirelessCostVND),
      totalTardinessMin: Number(totalTardinessMin.toFixed(1)),
      minObservedSoCKWh: Number(minObservedSoCKWh.toFixed(2)),
      rangeAnxietyEliminationIndex,
      isFeasible,
      stopsCount: stops.length,
      itinerary
    };
  }
}

export default EVRPTWDynamicWirelessInductiveRouter;
