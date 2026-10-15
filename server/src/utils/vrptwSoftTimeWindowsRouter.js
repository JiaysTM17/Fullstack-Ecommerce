/**
 * VRPTWSoftTimeWindowsRouter - Vehicle Routing Problem with Soft Time Windows & Penalty Functions
 * References:
 * - Éric Taillard, Gilbert Laporte, Michel Gendreau (Transportation Science 1997),
 *   "A Tabu Search Heuristic for the Vehicle Routing Problem with Soft Time Windows"
 * - Figliozzi (Transportation Research Part C 2010),
 *   "An iterative route construction and improvement method for the vehicle routing problem with soft time windows"
 * 
 * Key Principles:
 * - Real-world logistics express delivery allows early arrival (driver waits until window opens)
 *   or late arrival (incurring linear SLA penalty cost beta_late * (t - l_i)).
 * - Soft time windows prevent rigid dispatch infeasibility during flash sale demand surges.
 * - Generalized Objective Cost: Total Cost = Fuel Cost + Early Wait Cost + Late SLA Penalty.
 * - Strictly enforces vehicle capacity Q_capacity and maximum tolerable late limit (l_i + delta_maxLate).
 */

class VRPTWSoftTimeWindowsRouter {
  /**
   * @param {Object} options
   * @param {Object} [options.depot={ id: 'SPX_CENTRAL_HUB', lat: 21.0285, lng: 105.8542 }]
   * @param {number} [options.vehicleCapacityKg=120.0] - Max vehicle capacity
   * @param {number} [options.fleetSize=3] - Number of available vans
   * @param {number} [options.vanSpeedKmh=28.0] - Average transit speed
   * @param {number} [options.serviceDwellPerStopMin=5.0] - Delivery dwell per stop
   * @param {number} [options.fuelCostPerKm=1800] - Fuel cost in VND per km
   * @param {number} [options.earlyWaitCostPerMin=100] - Driver idle cost VND/min for arriving early
   * @param {number} [options.latePenaltyPerMin=500] - SLA customer compensation cost VND/min for arriving late
   * @param {number} [options.maxTolerableLateMin=60] - Maximum allowable late arrival minutes
   */
  constructor(options = {}) {
    this.depot = options.depot || { id: 'SPX_CENTRAL_HUB', lat: 21.0285, lng: 105.8542 };
    this.vehicleCapacityKg = options.vehicleCapacityKg || 120.0;
    this.fleetSize = Math.max(1, options.fleetSize || 3);
    this.vanSpeedKmh = options.vanSpeedKmh || 28.0;
    this.serviceDwellPerStopMin = options.serviceDwellPerStopMin !== undefined ? options.serviceDwellPerStopMin : 5.0;
    this.fuelCostPerKm = options.fuelCostPerKm || 1800;
    this.earlyWaitCostPerMin = options.earlyWaitCostPerMin !== undefined ? options.earlyWaitCostPerMin : 100;
    this.latePenaltyPerMin = options.latePenaltyPerMin !== undefined ? options.latePenaltyPerMin : 500;
    this.maxTolerableLateMin = options.maxTolerableLateMin || 60;
  }

  /**
   * Haversine distance in km
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(3));
  }

  /**
   * Evaluate soft time window penalties and departure time
   * @param {number} arrivalTimeMin - Minutes from start of day
   * @param {Array<number>} timeWindow - [earliest, latest]
   * @returns {Object} Soft window evaluation
   */
  evaluateSoftWindow(arrivalTimeMin, timeWindow = [480, 600]) {
    const [earliest, latest] = timeWindow;
    let status = "ON_TIME";
    let earlyWaitMin = 0;
    let lateMin = 0;
    let penaltyCostVnd = 0;
    let departureTimeMin = arrivalTimeMin + this.serviceDwellPerStopMin;

    if (arrivalTimeMin < earliest) {
      status = "EARLY_WAIT";
      earlyWaitMin = earliest - arrivalTimeMin;
      penaltyCostVnd = Math.round(earlyWaitMin * this.earlyWaitCostPerMin);
      departureTimeMin = earliest + this.serviceDwellPerStopMin;
    } else if (arrivalTimeMin > latest) {
      status = "LATE_PENALIZED";
      lateMin = arrivalTimeMin - latest;
      penaltyCostVnd = Math.round(lateMin * this.latePenaltyPerMin);
      departureTimeMin = arrivalTimeMin + this.serviceDwellPerStopMin;
    }

    const isTolerable = lateMin <= this.maxTolerableLateMin;

    return {
      status,
      earlyWaitMin: Number(earlyWaitMin.toFixed(1)),
      lateMin: Number(lateMin.toFixed(1)),
      penaltyCostVnd,
      departureTimeMin: Number(departureTimeMin.toFixed(1)),
      isTolerable
    };
  }

  /**
   * Plan Soft Time Window Delivery Routes across fleet
   * @param {Array<Object>} stops - [{ id, lat, lng, demandKg, timeWindow: [e, l] }]
   * @param {Object} [depot=this.depot]
   * @param {number} [startMinuteOfDay=480] - 08:00 AM = 480 min
   */
  planSoftTimeWindowRoutes(stops = [], depot = this.depot, startMinuteOfDay = 480) {
    if (!stops || stops.length === 0) {
      return {
        status: "EMPTY_STOPS",
        summary: {
          totalStops: 0,
          activeVehicles: 0,
          totalDistanceKm: 0,
          totalFuelCostVnd: 0,
          totalEarlyWaitMinutes: 0,
          totalEarlyWaitCostVnd: 0,
          totalLateMinutes: 0,
          totalLatenessPenaltyVnd: 0,
          totalGeneralizedCostVnd: 0,
          onTimeStopsCount: 0,
          lateStopsCount: 0,
          earlyStopsCount: 0,
          onTimeRatePercent: 100.0,
          unassignedStopsCount: 0
        },
        routes: []
      };
    }

    const unassigned = [...stops];
    const routes = [];
    let overallDistanceKm = 0;
    let overallFuelCostVnd = 0;
    let overallEarlyWaitMin = 0;
    let overallEarlyWaitCostVnd = 0;
    let overallLateMin = 0;
    let overallLatePenaltyVnd = 0;
    let onTimeCount = 0;
    let earlyCount = 0;
    let lateCount = 0;

    for (let vIdx = 0; vIdx < this.fleetSize && unassigned.length > 0; vIdx++) {
      const vehicleId = `SPX_VAN_${vIdx + 1}`;
      let currentLat = depot.lat;
      let currentLng = depot.lng;
      let currentTime = startMinuteOfDay;
      let currentPayload = 0;
      let routeDistanceKm = 0;
      let routeEarlyCost = 0;
      let routeLatePenalty = 0;
      const visitedStops = [];

      while (unassigned.length > 0) {
        let bestStopIdx = -1;
        let bestGeneralizedDelta = Infinity;
        let bestDistance = 0;
        let bestWindowEval = null;

        for (let i = 0; i < unassigned.length; i++) {
          const candidate = unassigned[i];
          const demand = Number(candidate.demandKg) || 1.0;

          if (currentPayload + demand > this.vehicleCapacityKg) {
            continue; // Exceeds capacity
          }

          const dist = this.calculateDistance(currentLat, currentLng, candidate.lat, candidate.lng);
          const transitTimeMin = (dist / this.vanSpeedKmh) * 60;
          const arrivalTime = currentTime + transitTimeMin;
          const windowEval = this.evaluateSoftWindow(arrivalTime, candidate.timeWindow || [startMinuteOfDay, startMinuteOfDay + 480]);

          if (!windowEval.isTolerable) {
            continue; // Exceeds max allowable lateness
          }

          // Trade-off: fuel cost + early wait cost + lateness penalty
          const incrementalFuelCost = dist * this.fuelCostPerKm;
          const generalizedDelta = incrementalFuelCost + windowEval.penaltyCostVnd;

          if (generalizedDelta < bestGeneralizedDelta) {
            bestGeneralizedDelta = generalizedDelta;
            bestStopIdx = i;
            bestDistance = dist;
            bestWindowEval = windowEval;
          }
        }

        if (bestStopIdx === -1) {
          // No more feasible stops for this vehicle
          break;
        }

        const [chosenStop] = unassigned.splice(bestStopIdx, 1);
        const demand = Number(chosenStop.demandKg) || 1.0;
        currentPayload += demand;
        routeDistanceKm += bestDistance;

        const transitTimeMin = (bestDistance / this.vanSpeedKmh) * 60;
        const arrivalTime = currentTime + transitTimeMin;

        if (bestWindowEval.status === "ON_TIME") {
          onTimeCount += 1;
        } else if (bestWindowEval.status === "EARLY_WAIT") {
          earlyCount += 1;
        } else {
          lateCount += 1;
        }

        overallEarlyWaitMin += bestWindowEval.earlyWaitMin;
        overallEarlyWaitCostVnd += (bestWindowEval.status === "EARLY_WAIT" ? bestWindowEval.penaltyCostVnd : 0);
        overallLateMin += bestWindowEval.lateMin;
        overallLatePenaltyVnd += (bestWindowEval.status === "LATE_PENALIZED" ? bestWindowEval.penaltyCostVnd : 0);

        routeEarlyCost += (bestWindowEval.status === "EARLY_WAIT" ? bestWindowEval.penaltyCostVnd : 0);
        routeLatePenalty += (bestWindowEval.status === "LATE_PENALIZED" ? bestWindowEval.penaltyCostVnd : 0);

        visitedStops.push({
          stopId: chosenStop.id,
          lat: chosenStop.lat,
          lng: chosenStop.lng,
          demandKg: demand,
          distanceFromLastKm: Number(bestDistance.toFixed(2)),
          arrivalTimeMin: Number(arrivalTime.toFixed(1)),
          departureTimeMin: bestWindowEval.departureTimeMin,
          timeWindowStatus: bestWindowEval.status,
          earlyWaitMin: bestWindowEval.earlyWaitMin,
          lateMin: bestWindowEval.lateMin,
          penaltyCostVnd: bestWindowEval.penaltyCostVnd
        });

        currentLat = chosenStop.lat;
        currentLng = chosenStop.lng;
        currentTime = bestWindowEval.departureTimeMin;
      }

      if (visitedStops.length > 0) {
        // Return to depot
        const returnDist = this.calculateDistance(currentLat, currentLng, depot.lat, depot.lng);
        routeDistanceKm += returnDist;
        const returnTime = (returnDist / this.vanSpeedKmh) * 60;
        currentTime += returnTime;

        const routeFuelCostVnd = Math.round(routeDistanceKm * this.fuelCostPerKm);
        overallDistanceKm += routeDistanceKm;
        overallFuelCostVnd += routeFuelCostVnd;

        routes.push({
          vehicleId,
          stopsCount: visitedStops.length,
          totalPayloadKg: Number(currentPayload.toFixed(2)),
          routeDistanceKm: Number(routeDistanceKm.toFixed(2)),
          routeDurationMin: Number((currentTime - startMinuteOfDay).toFixed(1)),
          fuelCostVnd: routeFuelCostVnd,
          earlyWaitCostVnd: routeEarlyCost,
          latenessPenaltyVnd: routeLatePenalty,
          routeGeneralizedCostVnd: routeFuelCostVnd + routeEarlyCost + routeLatePenalty,
          stops: visitedStops
        });
      }
    }

    const totalAssigned = stops.length - unassigned.length;
    const onTimeRatePercent = totalAssigned > 0
      ? Number(((onTimeCount / totalAssigned) * 100).toFixed(1))
      : 100.0;
    const totalGeneralizedCostVnd = overallFuelCostVnd + overallEarlyWaitCostVnd + overallLatePenaltyVnd;

    return {
      status: "VRPTW_SOFT_SUCCESS",
      summary: {
        totalStops: totalAssigned,
        activeVehicles: routes.length,
        totalDistanceKm: Number(overallDistanceKm.toFixed(2)),
        totalFuelCostVnd: overallFuelCostVnd,
        totalEarlyWaitMinutes: Number(overallEarlyWaitMin.toFixed(1)),
        totalEarlyWaitCostVnd: overallEarlyWaitCostVnd,
        totalLateMinutes: Number(overallLateMin.toFixed(1)),
        totalLatenessPenaltyVnd: overallLatePenaltyVnd,
        totalGeneralizedCostVnd,
        onTimeStopsCount: onTimeCount,
        earlyStopsCount: earlyCount,
        lateStopsCount: lateCount,
        onTimeRatePercent,
        unassignedStopsCount: unassigned.length
      },
      routes
    };
  }
}

export { VRPTWSoftTimeWindowsRouter };
export default VRPTWSoftTimeWindowsRouter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { VRPTWSoftTimeWindowsRouter };
  }
} catch (e) {}
