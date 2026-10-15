/**
 * DTRPLogisticsRouter - Dynamic Traveling Repairperson / Delivery Problem with Stochastic Urgent Demands
 * 
 * References:
 * - Dimitris J. Bertsimas & Garrett van Ryzin (1991):
 *   "A Stochastic and Dynamic Facility Location / Vehicle Routing Problem in the Euclidean Plane"
 * - Patrick Jaillet, Michael R. Wagner (2006):
 *   "Online Routing Problems: Value of Advanced Information and Waiting Strategies"
 * 
 * E-Commerce Applications:
 * - SPX Now 1H / 2H Instant Express Deliveries with on-demand stochastic customer orders.
 * - Min-Sum Latency Objective: Minimizes cumulative waiting time sum_i (T_arrival_i - T_request_i)
 *   instead of pure distance, drastically improving Customer Satisfaction (CSAT).
 * - Real-Time Dynamic Insertion: Evaluates insertion cost delta(Latency) + alpha * delta(Distance)
 *   while guaranteeing strict SLA delivery deadlines (< 60 mins).
 */

class DTRPLogisticsRouter {
  /**
   * @param {Object} [options]
   * @param {Object} [options.depot] - Central Fulfillment Hub { id, name, lat, lng }
   * @param {number} [options.fleetSize=3] - Number of active couriers
   * @param {number} [options.vehicleCapacityKg=30] - Max payload per motorbike courier
   * @param {number} [options.averageSpeedKmH=35] - City courier velocity in km/h
   * @param {number} [options.serviceDurationMinutes=5] - Parcel handover time at customer
   * @param {number} [options.urgentSlaMinutes=60] - Guaranteed urgent delivery SLA
   * @param {number} [options.latencyWeightAlpha=0.7] - Weight of latency vs distance
   */
  constructor(options = {}) {
    this.depot = options.depot || {
      id: 'DEPOT_HANOI_CENTRAL',
      name: 'SPX Express Central Hub - Ba Đình, Hà Nội',
      lat: 21.0341,
      lng: 105.8372,
    };
    this.fleetSize = options.fleetSize || 3;
    this.vehicleCapacityKg = options.vehicleCapacityKg || 30;
    this.averageSpeedKmH = options.averageSpeedKmH || 35;
    this.serviceDurationMinutes = options.serviceDurationMinutes || 5;
    this.urgentSlaMinutes = options.urgentSlaMinutes || 60;
    this.alpha = options.latencyWeightAlpha !== undefined ? options.latencyWeightAlpha : 0.7;

    // Initialize courier states
    this.couriers = [];
    for (let i = 0; i < this.fleetSize; i++) {
      this.couriers.push({
        courierId: `SPX_COURIER_${i + 1}`,
        courierName: `Bưu tá SPX Siêu Tốc #${i + 1}`,
        currentLocation: { ...this.depot },
        currentPayloadKg: 0,
        currentMinutes: 0, // Time elapsed since shift start
        activeRoute: [], // Array of stops
        completedDeliveries: [],
      });
    }
  }

  /**
   * Haversine distance between two coordinates in kilometers
   */
  calculateDistanceKm(p1, p2) {
    const R = 6371; // Earth radius in km
    const dLat = ((p2.lat - p1.lat) * Math.PI) / 180;
    const dLng = ((p2.lng - p1.lng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((p1.lat * Math.PI) / 180) *
        Math.cos((p2.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Number((R * c).toFixed(3));
  }

  /**
   * Travel time in minutes
   */
  calculateTravelTimeMinutes(distanceKm) {
    return Number(((distanceKm / this.averageSpeedKmH) * 60).toFixed(2));
  }

  /**
   * Initial Route Planning using Min-Sum Latency heuristic
   * @param {Array<Object>} orders - Initial static orders
   * @returns {Object} Planned fleet routing schedule
   */
  planInitialRoutes(orders = []) {
    if (!orders || orders.length === 0) {
      return { totalRoutes: 0, couriers: this.couriers, cumulativeLatency: 0 };
    }

    // Sort orders by urgency and distance from depot
    const sortedOrders = [...orders].sort((a, b) => {
      const distA = this.calculateDistanceKm(this.depot, a.coordinates || this.depot);
      const distB = this.calculateDistanceKm(this.depot, b.coordinates || this.depot);
      const prioA = a.isUrgent ? 0 : 1;
      const prioB = b.isUrgent ? 0 : 1;
      if (prioA !== prioB) return prioA - prioB;
      return distA - distB;
    });

    // Reset courier routes
    this.couriers.forEach((c) => {
      c.activeRoute = [];
      c.currentPayloadKg = 0;
      c.currentMinutes = 0;
      c.currentLocation = { ...this.depot };
    });

    // Round-robin greedy assignment with payload check
    for (const order of sortedOrders) {
      const weight = order.weightKg || 2;
      let assignedCourier = null;
      let minAdditionalLatency = Infinity;

      for (const courier of this.couriers) {
        if (courier.currentPayloadKg + weight <= this.vehicleCapacityKg) {
          const lastLoc = courier.activeRoute.length > 0
            ? courier.activeRoute[courier.activeRoute.length - 1].coordinates
            : courier.currentLocation;
          const dist = this.calculateDistanceKm(lastLoc, order.coordinates);
          const travelTime = this.calculateTravelTimeMinutes(dist);

          if (travelTime < minAdditionalLatency) {
            minAdditionalLatency = travelTime;
            assignedCourier = courier;
          }
        }
      }

      if (!assignedCourier) {
        // Fallback: assign to courier with lowest payload
        assignedCourier = [...this.couriers].sort((a, b) => a.currentPayloadKg - b.currentPayloadKg)[0];
      }

      const prevLoc = assignedCourier.activeRoute.length > 0
        ? assignedCourier.activeRoute[assignedCourier.activeRoute.length - 1].coordinates
        : assignedCourier.currentLocation;
      const legDist = this.calculateDistanceKm(prevLoc, order.coordinates);
      const travelMins = this.calculateTravelTimeMinutes(legDist);

      const arrivalTime = assignedCourier.currentMinutes + travelMins;
      const departureTime = arrivalTime + this.serviceDurationMinutes;
      const requestTime = order.requestTimeMinutes || 0;
      const latency = Math.max(0, arrivalTime - requestTime);

      const stop = {
        orderId: order.orderId || order.id || `ORD_${assignedCourier.activeRoute.length + 1}`,
        customerName: order.customerName || 'Khách hàng SPX',
        coordinates: order.coordinates,
        weightKg: weight,
        requestTimeMinutes: requestTime,
        arrivalTimeMinutes: arrivalTime,
        departureTimeMinutes: departureTime,
        latencyMinutes: latency,
        isUrgent: Boolean(order.isUrgent),
        slaDeadlineMinutes: order.slaDeadlineMinutes || (order.isUrgent ? this.urgentSlaMinutes : 180),
        slaStatus: arrivalTime <= (order.slaDeadlineMinutes || (order.isUrgent ? this.urgentSlaMinutes : 180)) ? 'ON_TIME' : 'SLA_VIOLATED',
      };

      assignedCourier.activeRoute.push(stop);
      assignedCourier.currentPayloadKg += weight;
      assignedCourier.currentMinutes = departureTime;
    }

    return this.getFleetDiagnostics();
  }

  /**
   * Dynamic Insertion of Stochastic Urgent Customer Order
   * Evaluates all feasible insertion positions across all couriers to minimize min-sum latency
   * @param {Object} urgentOrder
   * @param {number} [currentTimeMinutes=15] - Current clock time
   * @returns {Object} Dynamic rerouting decision
   */
  insertDynamicUrgentOrder(urgentOrder, currentTimeMinutes = 15) {
    const orderWeight = urgentOrder.weightKg || 1.5;
    const requestTime = urgentOrder.requestTimeMinutes || currentTimeMinutes;
    const slaDeadline = urgentOrder.slaDeadlineMinutes || (requestTime + this.urgentSlaMinutes);

    let bestCourier = null;
    let bestInsertIndex = -1;
    let minCostDelta = Infinity;
    let bestSimulatedRoute = null;

    for (const courier of this.couriers) {
      if (courier.currentPayloadKg + orderWeight > this.vehicleCapacityKg) {
        continue; // Exceeds capacity
      }

      const route = courier.activeRoute;
      // Try inserting at positions from 0 to route.length
      for (let pos = 0; pos <= route.length; pos++) {
        const candidateRoute = [...route.slice(0, pos), urgentOrder, ...route.slice(pos)];
        const simResult = this._simulateRouteSchedule(candidateRoute, courier.currentLocation, currentTimeMinutes);

        if (!simResult.isFeasible) continue;

        // Ensure newly inserted urgent order meets SLA
        const urgentStop = simResult.stops[pos];
        if (urgentStop.arrivalTimeMinutes > slaDeadline) continue;

        // Cost function = delta(Cumulative Latency) * alpha + delta(Distance) * (1 - alpha)
        const currentRouteSim = this._simulateRouteSchedule(route, courier.currentLocation, currentTimeMinutes);
        const deltaLatency = simResult.totalLatency - currentRouteSim.totalLatency;
        const deltaDistance = simResult.totalDistanceKm - currentRouteSim.totalDistanceKm;
        const costDelta = deltaLatency * this.alpha + deltaDistance * (1 - this.alpha);

        if (costDelta < minCostDelta) {
          minCostDelta = costDelta;
          bestCourier = courier;
          bestInsertIndex = pos;
          bestSimulatedRoute = simResult.stops;
        }
      }
    }

    if (!bestCourier) {
      // Dedicated emergency dispatch
      return {
        inserted: false,
        reason: 'NO_FEASIBLE_COURIER_WITHIN_SLA',
        action: 'DISPATCH_DEDICATED_EMERGENCY_COURIER',
        urgentOrderId: urgentOrder.orderId || urgentOrder.id,
      };
    }

    // Apply best insertion
    bestCourier.activeRoute = bestSimulatedRoute;
    bestCourier.currentPayloadKg += orderWeight;
    bestCourier.currentMinutes = bestSimulatedRoute[bestSimulatedRoute.length - 1].departureTimeMinutes;

    return {
      inserted: true,
      assignedCourierId: bestCourier.courierId,
      assignedCourierName: bestCourier.courierName,
      insertionIndex: bestInsertIndex,
      costDelta: Number(minCostDelta.toFixed(2)),
      estimatedArrivalMinutes: bestSimulatedRoute[bestInsertIndex].arrivalTimeMinutes,
      slaMarginMinutes: Number((slaDeadline - bestSimulatedRoute[bestInsertIndex].arrivalTimeMinutes).toFixed(2)),
      fleetDiagnostics: this.getFleetDiagnostics(),
    };
  }

  /**
   * Re-simulate route timing, distances, and latency
   */
  _simulateRouteSchedule(stops, startLocation, startTimeMinutes) {
    let currLoc = startLocation;
    let currTime = startTimeMinutes;
    let totalDist = 0;
    let totalLatency = 0;
    let isFeasible = true;
    const computedStops = [];

    for (const stop of stops) {
      const stopCoord = stop.coordinates || this.depot;
      const legDist = this.calculateDistanceKm(currLoc, stopCoord);
      const travelMins = this.calculateTravelTimeMinutes(legDist);

      const arrivalTime = currTime + travelMins;
      const reqTime = stop.requestTimeMinutes || 0;
      const latency = Math.max(0, arrivalTime - reqTime);
      const deadline = stop.slaDeadlineMinutes || 180;

      if (arrivalTime > deadline && stop.isUrgent) {
        isFeasible = false; // Urgent SLA violated
      }

      const departureTime = arrivalTime + this.serviceDurationMinutes;
      totalDist += legDist;
      totalLatency += latency;

      computedStops.push({
        ...stop,
        arrivalTimeMinutes: arrivalTime,
        departureTimeMinutes: departureTime,
        latencyMinutes: latency,
        slaStatus: arrivalTime <= deadline ? 'ON_TIME' : 'SLA_VIOLATED',
      });

      currLoc = stopCoord;
      currTime = departureTime;
    }

    return {
      isFeasible,
      stops: computedStops,
      totalDistanceKm: Number(totalDist.toFixed(3)),
      totalLatency: Number(totalLatency.toFixed(2)),
    };
  }

  /**
   * Comprehensive Fleet Performance and Min-Sum Latency Diagnostics
   */
  getFleetDiagnostics() {
    let totalOrders = 0;
    let onTimeOrders = 0;
    let totalLatency = 0;
    let totalDistanceKm = 0;

    const courierSummaries = this.couriers.map((c) => {
      let cDist = 0;
      let prevLoc = this.depot;
      c.activeRoute.forEach((s) => {
        cDist += this.calculateDistanceKm(prevLoc, s.coordinates || this.depot);
        prevLoc = s.coordinates || this.depot;
        totalOrders++;
        totalLatency += s.latencyMinutes;
        if (s.slaStatus === 'ON_TIME') onTimeOrders++;
      });
      totalDistanceKm += cDist;

      return {
        courierId: c.courierId,
        courierName: c.courierName,
        stopCount: c.activeRoute.length,
        payloadKg: c.currentPayloadKg,
        capacityKg: this.vehicleCapacityKg,
        utilizationRate: Number((c.currentPayloadKg / this.vehicleCapacityKg).toFixed(3)),
        totalDistanceKm: Number(cDist.toFixed(2)),
        stops: c.activeRoute,
      };
    });

    const otdRate = totalOrders > 0 ? onTimeOrders / totalOrders : 1.0;
    const avgLatency = totalOrders > 0 ? totalLatency / totalOrders : 0;

    return {
      fleetSize: this.fleetSize,
      totalOrdersAssigned: totalOrders,
      onTimeDeliveryRate: Number(otdRate.toFixed(4)),
      cumulativeLatencyMinutes: Number(totalLatency.toFixed(2)),
      averageLatencyMinutes: Number(avgLatency.toFixed(2)),
      totalDistanceKm: Number(totalDistanceKm.toFixed(2)),
      couriers: courierSummaries,
    };
  }
}

export { DTRPLogisticsRouter };
export default DTRPLogisticsRouter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DTRPLogisticsRouter };
  }
} catch (e) {}
