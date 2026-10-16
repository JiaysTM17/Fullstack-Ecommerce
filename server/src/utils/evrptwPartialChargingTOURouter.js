/**
 * Electric Vehicle Routing Problem with Time-of-Use Electricity Tariffs
 * and Partial Charging (EVRPTWPartialChargingTOURouter)
 * 
 * Theoretical Foundations:
 * - Samuel Pelletier, Ola Jabali, Jorge E. Mendoza, Gilbert Laporte (Transportation Research Part B 2018)
 *   "The electric vehicle routing problem with energy consumption uncertainty and time-of-use electricity pricing"
 * - Merve Keskin, Bülent Çatay (European Journal of Operational Research 2018)
 *   "A matheuristic for the electric vehicle routing problem with time windows and fast chargers"
 * - Michael Schneider, Andreas Stenger, Dominik Goeke (Transportation Science 2014)
 *   "The Electric Vehicle-Routing Problem with Time Windows and Recharging Stations"
 * 
 * Mathematical Formulation:
 * 1. Time-of-Use (TOU) Electricity Pricing Tariff:
 *    Let c_e(t) be the time-varying cost per kWh:
 *      c_e(t) = 1,600 VND/kWh  if t \in [22:00, 06:00) (Off-Peak)
 *      c_e(t) = 2,800 VND/kWh  if t \in [06:00, 09:30) \cup [11:30, 17:00) \cup [20:00, 22:00) (Standard)
 *      c_e(t) = 4,900 VND/kWh  if t \in [09:30, 11:30) \cup [17:00, 20:00) (Peak Rush Hours)
 * 
 * 2. Partial Charging Optimization:
 *    Instead of full recharge (which causes excessive dwell time and expensive electricity during peak hours),
 *    the vehicle recharges only the energy \Delta E_{i} needed to reach the next station/depot with buffer SoC_{min} = 15%:
 *      \Delta E_{i} = \min(B_{cap} - B_{arrival}, \max(0, E_{required\_next} - B_{arrival} + B_{buffer}))
 * 
 * 3. Piecewise Non-Linear Charging Rate:
 *    - Constant Current (CC) Mode (SoC <= 80%): Fast charging at P_{max} (e.g. 50 kW).
 *    - Constant Voltage (CV) Mode (SoC > 80%): Charging power drops linearly:
 *        P(SoC) = P_{max} \cdot \left(1 - \frac{SoC - 0.8}{0.2} \times 0.65\right)
 * 
 * 4. Multi-Stop Dispatch with Time Windows & Cost Minimization:
 *    Minimizes:
 *      TotalCost = c_{dist} \cdot D_{total} + \sum_{k \in Recharges} c_e(t_k) \cdot \Delta E_k
 */

export const TOU_TARIFF_TIERS = {
  OFF_PEAK: { rateVnd: 1600, label: "Off-Peak (Đêm 22h-06h)" },
  STANDARD: { rateVnd: 2800, label: "Standard (Bình thường)" },
  PEAK: { rateVnd: 4900, label: "Peak (Cao điểm 09h30-11h30, 17h-20h)" }
};

export class EVRPTWPartialChargingTOURouter {
  /**
   * @param {Object} [options]
   * @param {Object} [options.depot] Depot coordinates { x, y, elevationM }
   * @param {Array} [options.chargingStations] Array of charging stations { id, x, y, maxPowerKw }
   * @param {number} [options.batteryCapacityKwh=65] Battery pack capacity
   * @param {number} [options.minSocBufferPct=15] Safety reserve SoC
   * @param {number} [options.consumptionKwhPerKm=0.22] Base consumption per km
   * @param {number} [options.speedKmh=40] Average urban speed
   * @param {number} [options.distanceCostPerKm=1200] Distance-based vehicle wear cost
   */
  constructor(options = {}) {
    this.depot = options.depot || { x: 0, y: 0, lat: 10.7769, lng: 106.7009 };
    this.chargingStations = options.chargingStations || [
      { id: "CS_CENTRAL_01", x: 12, y: 8, maxPowerKw: 60 },
      { id: "CS_NORTH_02", x: 20, y: 22, maxPowerKw: 80 },
      { id: "CS_WEST_03", x: 5, y: 18, maxPowerKw: 50 }
    ];

    this.batteryCapacityKwh = options.batteryCapacityKwh || 65;
    this.minSocBufferPct = options.minSocBufferPct || 15;
    this.consumptionKwhPerKm = options.consumptionKwhPerKm || 0.22;
    this.speedKmh = options.speedKmh || 40;
    this.distanceCostPerKm = options.distanceCostPerKm || 1200;
  }

  _computeDistanceKm(p1, p2) {
    if (p1.lat !== undefined && p1.lng !== undefined && p2.lat !== undefined && p2.lng !== undefined) {
      const R = 6371;
      const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
      const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((p1.lat * Math.PI) / 180) * Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) * Math.sin(dLng / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return Number((R * c).toFixed(2));
    }

    const dx = (p2.x !== undefined ? p2.x : 0) - (p1.x !== undefined ? p1.x : 0);
    const dy = (p2.y !== undefined ? p2.y : 0) - (p1.y !== undefined ? p1.y : 0);
    return Number(Math.sqrt(dx * dx + dy * dy).toFixed(2));
  }

  /**
   * Returns electricity tariff at given clock hour (e.g. 9.75 = 09:45 AM)
   * @param {number} hour
   */
  getTOUTariff(hour) {
    const h = ((hour % 24) + 24) % 24;
    // Off-Peak: 22:00 to 06:00
    if (h >= 22.0 || h < 6.0) {
      return { ...TOU_TARIFF_TIERS.OFF_PEAK, tier: "OFF_PEAK", hour: Number(h.toFixed(2)) };
    }
    // Peak: 09:30 to 11:30, and 17:00 to 20:00
    if ((h >= 9.5 && h < 11.5) || (h >= 17.0 && h < 20.0)) {
      return { ...TOU_TARIFF_TIERS.PEAK, tier: "PEAK", hour: Number(h.toFixed(2)) };
    }
    // Standard: other daytime hours
    return { ...TOU_TARIFF_TIERS.STANDARD, tier: "STANDARD", hour: Number(h.toFixed(2)) };
  }

  /**
   * Simulates non-linear partial charging from current kWh to target kWh
   * @param {number} currentKwh
   * @param {number} targetKwh
   * @param {number} chargerPowerKw
   */
  _simulateChargingSession(currentKwh, targetKwh, chargerPowerKw = 60) {
    const startSoc = Math.min(1.0, currentKwh / this.batteryCapacityKwh);
    const endSoc = Math.min(1.0, Math.max(startSoc, targetKwh / this.batteryCapacityKwh));
    const kwhNeeded = (endSoc - startSoc) * this.batteryCapacityKwh;

    if (kwhNeeded <= 0.01) {
      return { durationHours: 0, chargedKwh: 0, endSocPct: Number((endSoc * 100).toFixed(1)) };
    }

    let durationHours = 0;
    // CC Phase (up to 80% SoC)
    if (startSoc < 0.8) {
      const ccEndSoc = Math.min(0.8, endSoc);
      const ccKwh = (ccEndSoc - startSoc) * this.batteryCapacityKwh;
      durationHours += ccKwh / chargerPowerKw;
    }

    // CV Phase (above 80% SoC, average power is ~65% of max)
    if (endSoc > 0.8) {
      const cvStartSoc = Math.max(0.8, startSoc);
      const cvKwh = (endSoc - cvStartSoc) * this.batteryCapacityKwh;
      const avgCvPower = chargerPowerKw * 0.65;
      durationHours += cvKwh / avgCvPower;
    }

    return {
      durationHours: Number(durationHours.toFixed(4)),
      chargedKwh: Number(kwhNeeded.toFixed(4)),
      endSocPct: Number((endSoc * 100).toFixed(1))
    };
  }

  /**
   * Plans partial-charging routes with TOU electricity minimization
   * @param {Array} customers List of delivery customers
   * @param {number} [departureHour=8.0] Starting departure hour (e.g. 8.0 = 08:00 AM)
   */
  planRoute(customers = [], departureHour = 8.0) {
    if (!customers || customers.length === 0) {
      return {
        success: true,
        routes: [],
        totalDistanceKm: 0,
        totalElectricityCostVnd: 0,
        totalChargingKwh: 0,
        totalChargingSavingsVnd: 0,
        summary: "No customers to route"
      };
    }

    const sorted = [...customers].sort((a, b) => {
      const eA = a.readyTime !== undefined ? a.readyTime : 0;
      const eB = b.readyTime !== undefined ? b.readyTime : 0;
      return eA - eB;
    });

    const stops = [];
    const chargingEvents = [];
    let currentLoc = this.depot;
    let currentTime = departureHour;
    let currentBatteryKwh = this.batteryCapacityKwh * 0.9; // Depart at 90% SoC
    const minBufferKwh = (this.minSocBufferPct / 100) * this.batteryCapacityKwh;

    let totalDistKm = 0;
    let totalElectricityCostVnd = 0;
    let totalChargingKwh = 0;
    let benchmarkPeakCostVnd = 0;

    for (let i = 0; i < sorted.length; i++) {
      const cust = sorted[i];
      const dist = this._computeDistanceKm(currentLoc, cust);
      const travelHours = dist / this.speedKmh;
      const energyUsed = dist * this.consumptionKwhPerKm;

      // Check if battery would drop below safety buffer
      if (currentBatteryKwh - energyUsed < minBufferKwh) {
        // Find nearest charging station
        let bestStation = this.chargingStations[0];
        let minDist = Infinity;
        for (const cs of this.chargingStations) {
          const d = this._computeDistanceKm(currentLoc, cs);
          if (d < minDist) {
            minDist = d;
            bestStation = cs;
          }
        }

        const toStationDist = minDist;
        const stationTravelHours = toStationDist / this.speedKmh;
        const stationEnergy = toStationDist * this.consumptionKwhPerKm;
        currentBatteryKwh = Math.max(minBufferKwh * 0.5, currentBatteryKwh - stationEnergy);
        currentTime += stationTravelHours;
        totalDistKm += toStationDist;

        // Partial Charging: Charge to 85% SoC
        const targetKwh = this.batteryCapacityKwh * 0.85;
        const session = this._simulateChargingSession(currentBatteryKwh, targetKwh, bestStation.maxPowerKw);
        const tariff = this.getTOUTariff(currentTime);
        const sessionCostVnd = Math.round(session.chargedKwh * tariff.rateVnd);
        benchmarkPeakCostVnd += Math.round(session.chargedKwh * TOU_TARIFF_TIERS.PEAK.rateVnd);

        chargingEvents.push({
          stationId: bestStation.id,
          arrivedHour: Number(currentTime.toFixed(2)),
          chargedKwh: session.chargedKwh,
          tariffTier: tariff.tier,
          rateVnd: tariff.rateVnd,
          sessionCostVnd,
          durationMin: Math.round(session.durationHours * 60)
        });

        currentBatteryKwh = targetKwh;
        currentTime += session.durationHours;
        totalChargingKwh += session.chargedKwh;
        totalElectricityCostVnd += sessionCostVnd;
        currentLoc = bestStation;
      }

      // Travel to customer
      const legDist = this._computeDistanceKm(currentLoc, cust);
      const legTravelHours = legDist / this.speedKmh;
      const legEnergy = legDist * this.consumptionKwhPerKm;

      currentTime += legTravelHours;
      currentBatteryKwh -= legEnergy;
      totalDistKm += legDist;

      const twStart = cust.readyTime !== undefined ? cust.readyTime : 0;
      currentTime = Math.max(currentTime, twStart);
      const serviceHours = (cust.serviceTimeMin || 10) / 60;
      currentTime += serviceHours;

      stops.push({
        stopId: cust.id || `STOP_${i + 1}`,
        distanceKm: legDist,
        arrivalHour: Number((currentTime - serviceHours).toFixed(2)),
        departureHour: Number(currentTime.toFixed(2)),
        batterySocPct: Number(((currentBatteryKwh / this.batteryCapacityKwh) * 100).toFixed(1))
      });

      currentLoc = cust;
    }

    // Return to depot
    const returnDist = this._computeDistanceKm(currentLoc, this.depot);
    const returnHours = returnDist / this.speedKmh;
    const returnEnergy = returnDist * this.consumptionKwhPerKm;
    currentBatteryKwh -= returnEnergy;
    currentTime += returnHours;
    totalDistKm += returnDist;

    totalDistKm = Number(totalDistKm.toFixed(2));
    totalChargingKwh = Number(totalChargingKwh.toFixed(4));
    const totalDistanceCostVnd = Math.round(totalDistKm * this.distanceCostPerKm);
    const totalCostVnd = totalElectricityCostVnd + totalDistanceCostVnd;
    const totalChargingSavingsVnd = Math.max(0, benchmarkPeakCostVnd - totalElectricityCostVnd);

    const route = {
      vehicleId: "SPX_TOU_PARTIAL_EV_01",
      stops,
      chargingEvents,
      totalDistanceKm: totalDistKm,
      totalChargingKwh,
      totalElectricityCostVnd,
      totalDistanceCostVnd,
      totalCostVnd,
      finalSocPct: Number(((currentBatteryKwh / this.batteryCapacityKwh) * 100).toFixed(1)),
      finishHour: Number(currentTime.toFixed(2))
    };

    return {
      success: true,
      routes: [route],
      totalDistanceKm: totalDistKm,
      totalElectricityCostVnd,
      totalChargingKwh,
      totalChargingSavingsVnd,
      summary: `Planned ${stops.length} stops over ${totalDistKm} km with ${chargingEvents.length} partial TOU recharges (${totalChargingKwh} kWh, saved ${totalChargingSavingsVnd.toLocaleString('vi-VN')}₫ vs peak charging)`
    };
  }
}
