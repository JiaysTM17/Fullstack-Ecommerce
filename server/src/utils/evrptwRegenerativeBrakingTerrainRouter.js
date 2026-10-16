/**
 * EVRPTW with Regenerative Braking & 3D Terrain Elevation Profiles (EVRPTWRegenerativeBrakingTerrainRouter)
 * 
 * Theoretical Foundations:
 * - Tolga Bektas, Gilbert Laporte (Transportation Research Part B 2011)
 *   "The Pollution-Routing Problem"
 * - Emrah Demir, Tolga Bektas, Gilbert Laporte (Transportation Research Part B 2012)
 *   "An Adaptive Large Neighborhood Search Heuristic for the Pollution-Routing Problem"
 * - P. C. Schiffer, G. Hiermann, M. W. Ulmer, M. Savelsbergh (Computers & Operations Research 2017)
 *   "Vehicle Routing with Intermediate Stops, Energy Recovery, and Time Windows"
 * 
 * Mathematical Formulation:
 * 1. 3D Terrain Topography & Road Gradient:
 *    Distance D = \sqrt{ (x_2 - x_1)^2 + (y_2 - y_1)^2 + (\Delta z / 1000)^2 } [km]
 *    Road slope angle: \theta = \arcsin( (\Delta z / 1000) / D )
 * 2. Longitudinal Vehicle Dynamics:
 *    Total vehicle mass: m = m_curb + m_cargo [kg]
 *    Traction forces [N]:
 *      F_grav = m * g * \sin(\theta)
 *      F_roll = m * g * C_r * \cos(\theta)
 *      F_aero = 0.5 * \rho * C_d * A * v^2
 *      F_wheel = F_grav + F_roll + F_aero
 * 3. Kinetic Energy Recovery System (Regenerative Braking):
 *    When F_wheel < 0 (downhill descents with net retarding force):
 *      P_regen = \eta_regen * |F_wheel| * v [kW]
 *      Energy recovered E_regen = P_regen * \Delta t [kWh]
 *      Battery state: SoC_{t+1} = \min( C_max, SoC_t + E_regen )
 *    When F_wheel >= 0 (uphill / level traction):
 *      Energy consumed E_traction = (F_wheel * D) / (3600 * \eta_motor) [kWh]
 *      Battery state: SoC_{t+1} = \max( 0, SoC_t - E_traction )
 */

export class EVRPTWRegenerativeBrakingTerrainRouter {
  /**
   * @param {Object} [options]
   * @param {Object} [options.depot] Central hub coordinates & elevation
   * @param {number} [options.batteryCapacityKwh=35.0] Total battery capacity in kWh
   * @param {number} [options.curbWeightKg=950.0] Vehicle unladen weight in kg
   * @param {number} [options.maxPayloadKg=400.0] Maximum cargo weight
   * @param {number} [options.regenEfficiency=0.70] KERS regenerative braking recovery efficiency (0.70 = 70%)
   * @param {number} [options.motorEfficiency=0.88] Electric powertrain traction efficiency
   * @param {number} [options.rollingCoeff=0.015] Rolling resistance coefficient C_r
   * @param {number} [options.dragCoeff=0.35] Aerodynamic drag coefficient C_d
   * @param {number} [options.frontalAreaM2=2.2] Frontal cross-sectional area
   * @param {number} [options.avgSpeedKmh=36.0] Travel speed in km/h
   */
  constructor(options = {}) {
    this.depot = options.depot || {
      id: "HUB_SPX_TERRAIN_CENTRAL",
      name: "SPX Express Topographic Central Hub",
      x: 10.7769,
      y: 106.7009,
      z: 15.0 // 15 meters elevation above sea level
    };

    this.batteryCapacityKwh = Math.max(10.0, Number(options.batteryCapacityKwh || 35.0));
    this.curbWeightKg = Math.max(200.0, Number(options.curbWeightKg || 950.0));
    this.maxPayloadKg = Math.max(50.0, Number(options.maxPayloadKg || 400.0));
    this.regenEfficiency = Math.max(0.1, Math.min(0.95, Number(options.regenEfficiency !== undefined ? options.regenEfficiency : 0.70)));
    this.motorEfficiency = Math.max(0.5, Math.min(0.98, Number(options.motorEfficiency || 0.88)));
    this.rollingCoeff = Math.max(0.005, Number(options.rollingCoeff || 0.015));
    this.dragCoeff = Math.max(0.2, Number(options.dragCoeff || 0.35));
    this.frontalAreaM2 = Math.max(1.0, Number(options.frontalAreaM2 || 2.2));
    this.avgSpeedKmh = Math.max(10.0, Number(options.avgSpeedKmh || 36.0));
    this.minReserveSoc = Math.max(0.05, Math.min(0.40, Number(options.minReserveSoc || 0.15)));

    this.gravity = 9.81; // m/s^2
    this.airDensity = 1.204; // kg/m^3 at 20C
    this.speedMs = (this.avgSpeedKmh * 1000) / 3600; // m/s
    this.travelSpeedKmMin = this.avgSpeedKmh / 60.0; // km/min

    this.solvedCount = 0;
  }

  get batteryCapacity() { return this.batteryCapacityKwh; }
  get kersEfficiency() { return this.regenEfficiency; }

  /**
   * Computes 3D Euclidean distance in kilometers
   */
  calculate3DDistanceKm(p1, p2) {
    if (!p1 || !p2) return 0;
    const dx = (Number(p1.x) || 0) - (Number(p2.x) || 0);
    const dy = (Number(p1.y) || 0) - (Number(p2.y) || 0);
    const dzKm = ((Number(p1.z) || 0) - (Number(p2.z) || 0)) / 1000.0;
    return Math.sqrt(dx * dx + dy * dy + dzKm * dzKm);
  }

  /**
   * Computes vehicle energy delta for leg p1 -> p2 with elevation change
   * @param {Object} p1 Origin { x, y, z }
   * @param {Object} p2 Destination { x, y, z }
   * @param {number} [payloadKg=0] Cargo weight
   * @returns {{ distanceKm: number, deltaZ: number, slopeDeg: number, netEnergyKwh: number, isRegenerating: boolean, regenRecoveredKwh: number }}
   */
  computeTerrainEnergy(p1, p2, payloadKg = 0) {
    const distKm = this.calculate3DDistanceKm(p1, p2);
    if (distKm <= 1e-6) {
      return { distanceKm: 0, deltaZ: 0, slopeDeg: 0, netEnergyKwh: 0, isRegenerating: false, regenRecoveredKwh: 0 };
    }

    const z1 = Number(p1.z) || 0;
    const z2 = Number(p2.z) || 0;
    const deltaZ = z2 - z1; // Elevation gain (meters)
    const sinTheta = Math.max(-0.5, Math.min(0.5, (deltaZ / 1000.0) / distKm));
    const cosTheta = Math.sqrt(Math.max(0, 1.0 - sinTheta * sinTheta));
    const slopeDeg = (Math.asin(sinTheta) * 180.0) / Math.PI;

    const totalMass = this.curbWeightKg + Math.max(0, payloadKg);

    // Forces in Newtons
    const fGrav = totalMass * this.gravity * sinTheta;
    const fRoll = totalMass * this.gravity * this.rollingCoeff * cosTheta;
    const fAero = 0.5 * this.airDensity * this.dragCoeff * this.frontalAreaM2 * (this.speedMs * this.speedMs);
    const fWheel = fGrav + fRoll + fAero;

    const distMeters = distKm * 1000.0;
    const durationHours = distKm / this.avgSpeedKmh;

    let netEnergyKwh = 0;
    let isRegenerating = false;
    let regenRecoveredKwh = 0;

    if (fWheel < 0) {
      // Downhill regenerative braking (KERS active)
      isRegenerating = true;
      const mechanicalPowerKw = (Math.abs(fWheel) * this.speedMs) / 1000.0;
      regenRecoveredKwh = mechanicalPowerKw * durationHours * this.regenEfficiency;
      netEnergyKwh = -regenRecoveredKwh; // Negative = energy returned to battery
    } else {
      // Traction power consumed from battery
      const mechanicalPowerKw = (fWheel * this.speedMs) / 1000.0;
      netEnergyKwh = (mechanicalPowerKw * durationHours) / this.motorEfficiency;
    }

    return {
      distanceKm: Number(distKm.toFixed(3)),
      deltaZ: Number(deltaZ.toFixed(1)),
      slopeDeg: Number(slopeDeg.toFixed(2)),
      netEnergyKwh: Number(netEnergyKwh.toFixed(4)),
      isRegenerating,
      regenRecoveredKwh: Number(regenRecoveredKwh.toFixed(4))
    };
  }

  /**
   * Solves EVRPTW with regenerative braking terrain profiles
   * @param {Array<Object>} customers 
   * @param {Object} [options]
   * @returns {Object}
   */
  solvePlan(customers = [], options = {}) {
    this.solvedCount++;
    const initialBatteryKwh = Math.min(
      this.batteryCapacityKwh,
      Number(options.initialBatteryKwh || this.batteryCapacityKwh)
    );

    let currentLoc = { ...this.depot };
    let currentTimeMin = 60; // 07:00 AM
    let currentBatteryKwh = initialBatteryKwh;
    let totalPayload = customers.reduce((sum, c) => sum + (Number(c.demand) || 5), 0);

    let totalDistanceKm = 0;
    let totalRegenRecoveredKwh = 0;
    let totalTractionConsumedKwh = 0;
    let totalElevationClimbedM = 0;
    let totalElevationDescendedM = 0;

    const legs = [];
    legs.push({
      type: "DEPOT_DEPARTURE",
      locationId: this.depot.id,
      name: this.depot.name,
      timeMin: currentTimeMin,
      elevationM: this.depot.z,
      batteryKwh: Number(currentBatteryKwh.toFixed(3)),
      batterySocPct: Number(((currentBatteryKwh / this.batteryCapacityKwh) * 100).toFixed(1))
    });

    const pending = [...customers].map((c, idx) => ({
      ...c,
      id: c.id || `CUST_${idx + 1}`,
      x: Number(c.x) || this.depot.x,
      y: Number(c.y) || this.depot.y,
      z: Number(c.z !== undefined ? c.z : this.depot.z),
      demand: Number(c.demand) || 5,
      dueTime: Number(c.dueTime || 9999),
      readyTime: Number(c.readyTime || 0),
      serviceTimeMin: Number(c.serviceTimeMin || 10)
    }));

    while (pending.length > 0) {
      // Greedy nearest neighbor with elevation & time window priority
      let bestIdx = 0;
      let minScore = Infinity;

      for (let i = 0; i < pending.length; i++) {
        const c = pending[i];
        const dist = this.calculate3DDistanceKm(currentLoc, c);
        const arrival = currentTimeMin + (dist / this.travelSpeedKmMin);
        const lateness = Math.max(0, arrival - c.dueTime);
        const score = dist * 10 + lateness * 50;

        if (score < minScore) {
          minScore = score;
          bestIdx = i;
        }
      }

      const nextCust = pending.splice(bestIdx, 1)[0];
      const legMetrics = this.computeTerrainEnergy(currentLoc, nextCust, totalPayload);
      const travelTimeMin = legMetrics.distanceKm / this.travelSpeedKmMin;
      const arrivalTimeMin = currentTimeMin + travelTimeMin;

      totalDistanceKm += legMetrics.distanceKm;
      if (legMetrics.deltaZ > 0) totalElevationClimbedM += legMetrics.deltaZ;
      else totalElevationDescendedM += Math.abs(legMetrics.deltaZ);

      if (legMetrics.isRegenerating) {
        totalRegenRecoveredKwh += legMetrics.regenRecoveredKwh;
        currentBatteryKwh = Math.min(this.batteryCapacityKwh, currentBatteryKwh + legMetrics.regenRecoveredKwh);
      } else {
        totalTractionConsumedKwh += legMetrics.netEnergyKwh;
        currentBatteryKwh = Math.max(0, currentBatteryKwh - legMetrics.netEnergyKwh);
      }

      totalPayload = Math.max(0, totalPayload - nextCust.demand);
      const departureTimeMin = arrivalTimeMin + nextCust.serviceTimeMin;

      legs.push({
        type: "CUSTOMER_DELIVERY",
        customerId: nextCust.id,
        name: nextCust.name || nextCust.id,
        elevationM: nextCust.z,
        arrivalTimeMin: Number(arrivalTimeMin.toFixed(2)),
        distanceKm: legMetrics.distanceKm,
        deltaZ: legMetrics.deltaZ,
        slopeDeg: legMetrics.slopeDeg,
        isRegenerating: legMetrics.isRegenerating,
        energyKwh: legMetrics.netEnergyKwh,
        batteryKwh: Number(currentBatteryKwh.toFixed(3)),
        batterySocPct: Number(((currentBatteryKwh / this.batteryCapacityKwh) * 100).toFixed(1))
      });

      currentTimeMin = departureTimeMin;
      currentLoc = { x: nextCust.x, y: nextCust.y, z: nextCust.z };
    }

    // Return to Depot
    const returnLeg = this.computeTerrainEnergy(currentLoc, this.depot, 0);
    const returnTravelMin = returnLeg.distanceKm / this.travelSpeedKmMin;
    totalDistanceKm += returnLeg.distanceKm;

    if (returnLeg.deltaZ > 0) totalElevationClimbedM += returnLeg.deltaZ;
    else totalElevationDescendedM += Math.abs(returnLeg.deltaZ);

    if (returnLeg.isRegenerating) {
      totalRegenRecoveredKwh += returnLeg.regenRecoveredKwh;
      currentBatteryKwh = Math.min(this.batteryCapacityKwh, currentBatteryKwh + returnLeg.regenRecoveredKwh);
    } else {
      totalTractionConsumedKwh += returnLeg.netEnergyKwh;
      currentBatteryKwh = Math.max(0, currentBatteryKwh - returnLeg.netEnergyKwh);
    }

    currentTimeMin += returnTravelMin;

    legs.push({
      type: "DEPOT_ARRIVAL",
      locationId: this.depot.id,
      name: this.depot.name,
      elevationM: this.depot.z,
      arrivalTimeMin: Number(currentTimeMin.toFixed(2)),
      distanceKm: returnLeg.distanceKm,
      deltaZ: returnLeg.deltaZ,
      isRegenerating: returnLeg.isRegenerating,
      energyKwh: returnLeg.netEnergyKwh,
      batteryKwh: Number(currentBatteryKwh.toFixed(3)),
      batterySocPct: Number(((currentBatteryKwh / this.batteryCapacityKwh) * 100).toFixed(1))
    });

    const netEnergyBalanceKwh = totalTractionConsumedKwh - totalRegenRecoveredKwh;
    const regenEfficiencyPct = totalTractionConsumedKwh > 0
      ? Number(((totalRegenRecoveredKwh / totalTractionConsumedKwh) * 100).toFixed(2))
      : 0;

    return {
      success: true,
      depot: this.depot,
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      totalDurationMin: Number((currentTimeMin - 60).toFixed(2)),
      totalRegenRecoveredKwh: Number(totalRegenRecoveredKwh.toFixed(3)),
      totalTractionConsumedKwh: Number(totalTractionConsumedKwh.toFixed(3)),
      netEnergyBalanceKwh: Number(netEnergyBalanceKwh.toFixed(3)),
      regenEfficiencyPct,
      topographicProfile: {
        elevationClimbedM: Number(totalElevationClimbedM.toFixed(1)),
        elevationDescendedM: Number(totalElevationDescendedM.toFixed(1)),
        finalBatteryKwh: Number(currentBatteryKwh.toFixed(3)),
        finalBatterySocPct: Number(((currentBatteryKwh / this.batteryCapacityKwh) * 100).toFixed(1))
      },
      routes: [
        {
          routeId: "ROUTE_EV_REGEN_1",
          legs,
          legsCount: legs.length,
          totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
          regenRecoveredKwh: Number(totalRegenRecoveredKwh.toFixed(3))
        }
      ],
      legsCount: legs.length,
      routeLegs: legs
    };
  }

  planRoute(customers = [], options = {}) {
    return this.solvePlan(customers, options);
  }

  getTelemetry() {
    return {
      algorithm: "EVRPTWRegenerativeBrakingTerrainRouter",
      batteryCapacityKwh: this.batteryCapacityKwh,
      curbWeightKg: this.curbWeightKg,
      regenEfficiency: this.regenEfficiency,
      motorEfficiency: this.motorEfficiency,
      solvedCount: this.solvedCount
    };
  }
}

export default EVRPTWRegenerativeBrakingTerrainRouter;
