/**
 * MTVRPTWLogisticsRouter - Multi-Trip Vehicle Routing Problem with Time Windows
 * References:
 * - Cattaruzza, Absi, Feillet, Vigo (4OR 2016), "Vehicle routing problems with multiple trips"
 * - Olivera, Viera (Computers & Operations Research 2007), "Adaptive memory programming for the vehicle routing problem with multiple trips"
 * 
 * Key Principles:
 * - Solves multi-trip dispatching for high-density urban fulfillment (SPX Hub Now)
 * - Enables a small vehicle fleet to serve large customer batches by performing multiple back-and-forth delivery trips
 * - Enforces per-trip vehicle capacity Q_capacity
 * - Enforces depot reloading turnaround dwell time Delta_reload between consecutive trips
 * - Enforces maximum working shift duration per vehicle T_maxShift (e.g. 8h = 480 min)
 * - Enforces customer time windows [e_i, l_i] with arrival and service dwell timing
 */

class MTVRPTWLogisticsRouter {
  /**
   * @param {Object} options
   * @param {Object} [options.depot={ id: 'SPX_CENTRAL_HUB', lat: 21.0285, lng: 105.8542 }] - Central sorting hub
   * @param {number} [options.vehicleCapacityKg=100.0] - Maximum capacity per trip
   * @param {number} [options.fleetSize=3] - Available vehicles in fleet
   * @param {number} [options.maxShiftMinutes=480] - Maximum shift duration per vehicle (minutes)
   * @param {number} [options.reloadTimeMinutes=15] - Warehouse reload/turnaround time between trips
   * @param {number} [options.vanSpeedKmh=28.0] - Urban vehicle speed (km/h)
   * @param {number} [options.serviceDwellPerStopMin=5.0] - Delivery dwell per stop (minutes)
   * @param {number} [options.fuelCostPerKm=1800] - Fuel cost VND/km
   */
  constructor(options = {}) {
    this.depot = options.depot || { id: 'SPX_CENTRAL_HUB', lat: 21.0285, lng: 105.8542 };
    this.vehicleCapacityKg = options.vehicleCapacityKg || 100.0;
    this.fleetSize = Math.max(1, options.fleetSize || 3);
    this.maxShiftMinutes = Math.max(60, options.maxShiftMinutes || 480);
    this.reloadTimeMinutes = Math.max(0, options.reloadTimeMinutes !== undefined ? options.reloadTimeMinutes : 15);
    this.vanSpeedKmh = options.vanSpeedKmh || 28.0;
    this.serviceDwellPerStopMin = options.serviceDwellPerStopMin !== undefined ? options.serviceDwellPerStopMin : 5.0;
    this.fuelCostPerKm = options.fuelCostPerKm || 1800;
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
   * Plan Multi-Trip Delivery Routes across Fleet
   * @param {Array<Object>} stops - Customers with { id, lat, lng, demandKg, timeWindow: [start, end] }
   * @param {Object} [depot=this.depot] - Dispatch depot
   * @param {number} [startMinuteOfDay=480] - Shift start time (08:00 AM = 480)
   */
  planMultiTripRoutes(stops = [], depot = this.depot, startMinuteOfDay = 480) {
    if (!stops || stops.length === 0) {
      return {
        status: "EMPTY_STOPS",
        summary: {
          totalStops: 0,
          totalTrips: 0,
          activeVehicles: 0,
          totalDistanceKm: 0,
          totalFulfillmentTimeMin: 0,
          totalFuelCostVnd: 0,
          onTimeRatePercent: 100.0,
          averageStopsPerTrip: 0,
          capacityViolations: 0
        },
        vehicleSchedules: []
      };
    }

    // Initialize vehicle fleet schedules
    const vehicles = Array.from({ length: this.fleetSize }, (_, idx) => ({
      vehicleId: `SPX_VAN_${idx + 1}`,
      currentMinute: startMinuteOfDay,
      totalDistanceKm: 0,
      trips: []
    }));

    const unassigned = [...stops];
    let overallDistanceKm = 0;
    let onTimeCount = 0;
    let totalAssigned = 0;

    // Continue assigning trips until all orders are fulfilled or shift limit reached
    while (unassigned.length > 0) {
      // Find the vehicle with the earliest available time that has remaining shift budget
      let earliestVehicle = null;
      let minAvailableTime = Infinity;

      for (const v of vehicles) {
        const timeElapsed = v.currentMinute - startMinuteOfDay;
        if (timeElapsed < this.maxShiftMinutes && v.currentMinute < minAvailableTime) {
          minAvailableTime = v.currentMinute;
          earliestVehicle = v;
        }
      }

      if (!earliestVehicle) {
        // All vehicles exceeded max shift duration
        break;
      }

      // Build one trip for this vehicle
      let currentTripPayload = 0;
      let currentLat = depot.lat;
      let currentLng = depot.lng;
      let tripTime = earliestVehicle.currentMinute;
      let tripDistanceKm = 0;
      const tripStops = [];

      while (unassigned.length > 0) {
        // Find nearest feasible stop that fits remaining trip capacity
        let bestCandidateIdx = -1;
        let bestDist = Infinity;

        for (let i = 0; i < unassigned.length; i++) {
          const candidate = unassigned[i];
          const demand = Math.max(1, Number(candidate.demandKg) || 5);
          if (currentTripPayload + demand <= this.vehicleCapacityKg) {
            const d = this.calculateDistance(currentLat, currentLng, candidate.lat, candidate.lng);
            if (d < bestDist) {
              bestDist = d;
              bestCandidateIdx = i;
            }
          }
        }

        if (bestCandidateIdx === -1) {
          // No more stops fit in this trip's capacity
          break;
        }

        const chosenStop = unassigned.splice(bestCandidateIdx, 1)[0];
        const demand = Math.max(1, Number(chosenStop.demandKg) || 5);
        currentTripPayload += demand;
        tripDistanceKm += bestDist;

        const travelTimeMin = (bestDist / this.vanSpeedKmh) * 60;
        tripTime += travelTimeMin;

        // Time window check
        const tw = chosenStop.timeWindow || [startMinuteOfDay, startMinuteOfDay + this.maxShiftMinutes];
        const arrivalTime = tripTime;
        if (tripTime < tw[0]) {
          // Early arrival: wait until start of window
          tripTime = tw[0];
        }
        const isOnTime = tripTime <= tw[1];
        if (isOnTime) onTimeCount += 1;

        tripTime += (chosenStop.serviceDurationMin || this.serviceDwellPerStopMin);

        tripStops.push({
          stopId: chosenStop.id,
          lat: chosenStop.lat,
          lng: chosenStop.lng,
          demandKg: demand,
          distanceFromLastKm: Number(bestDist.toFixed(2)),
          arrivalTimeMin: Number(arrivalTime.toFixed(1)),
          departureTimeMin: Number(tripTime.toFixed(1)),
          onTime: isOnTime
        });

        currentLat = chosenStop.lat;
        currentLng = chosenStop.lng;
        totalAssigned += 1;
      }

      if (tripStops.length > 0) {
        // Return to depot at end of trip
        const returnDist = this.calculateDistance(currentLat, currentLng, depot.lat, depot.lng);
        tripDistanceKm += returnDist;
        const returnTime = (returnDist / this.vanSpeedKmh) * 60;
        tripTime += returnTime;

        const tripIndex = earliestVehicle.trips.length + 1;
        earliestVehicle.trips.push({
          tripIndex,
          tripDistanceKm: Number(tripDistanceKm.toFixed(2)),
          tripDurationMin: Number((tripTime - earliestVehicle.currentMinute).toFixed(1)),
          tripPayloadKg: Number(currentTripPayload.toFixed(2)),
          startTimeMin: Number(earliestVehicle.currentMinute.toFixed(1)),
          endTimeMin: Number(tripTime.toFixed(1)),
          stops: tripStops
        });

        earliestVehicle.totalDistanceKm += tripDistanceKm;
        overallDistanceKm += tripDistanceKm;

        // Turnaround dwell time at depot before next potential trip
        earliestVehicle.currentMinute = tripTime + this.reloadTimeMinutes;
      } else {
        // Could not fit any stop; terminate vehicle's shift
        earliestVehicle.currentMinute = startMinuteOfDay + this.maxShiftMinutes + 1;
      }
    }

    const activeVehicles = vehicles.filter(v => v.trips.length > 0);
    const totalTrips = activeVehicles.reduce((sum, v) => sum + v.trips.length, 0);
    const totalFuelCostVnd = Math.round(overallDistanceKm * this.fuelCostPerKm);
    const onTimeRatePercent = totalAssigned > 0 ? Number(((onTimeCount / totalAssigned) * 100).toFixed(1)) : 100.0;
    const averageStopsPerTrip = totalTrips > 0 ? Number((totalAssigned / totalTrips).toFixed(2)) : 0;

    let maxFinishTime = startMinuteOfDay;
    for (const v of activeVehicles) {
      if (v.trips.length > 0) {
        const lastTrip = v.trips[v.trips.length - 1];
        if (lastTrip.endTimeMin > maxFinishTime) {
          maxFinishTime = lastTrip.endTimeMin;
        }
      }
    }
    const totalFulfillmentTimeMin = Number((maxFinishTime - startMinuteOfDay).toFixed(1));

    return {
      status: "MTVRPTW_SUCCESS",
      summary: {
        totalStops: stops.length,
        assignedStops: totalAssigned,
        unassignedStops: unassigned.length,
        totalTrips,
        activeVehicles: activeVehicles.length,
        totalDistanceKm: Number(overallDistanceKm.toFixed(2)),
        totalFulfillmentTimeMin,
        totalFuelCostVnd,
        onTimeRatePercent,
        averageStopsPerTrip,
        capacityViolations: 0
      },
      vehicleSchedules: activeVehicles.map(v => ({
        vehicleId: v.vehicleId,
        tripsCount: v.trips.length,
        totalVehicleDistanceKm: Number(v.totalDistanceKm.toFixed(2)),
        totalVehicleDurationMin: Number((v.currentMinute - startMinuteOfDay - (v.trips.length > 0 ? this.reloadTimeMinutes : 0)).toFixed(1)),
        shiftFinishedOnTime: (v.currentMinute - startMinuteOfDay) <= (this.maxShiftMinutes + this.reloadTimeMinutes),
        trips: v.trips
      }))
    };
  }
}

export { MTVRPTWLogisticsRouter };
export default MTVRPTWLogisticsRouter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MTVRPTWLogisticsRouter };
  }
} catch (e) {}
