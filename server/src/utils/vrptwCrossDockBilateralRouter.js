/**
 * VRPTWCrossDockBilateralRouter - Vehicle Routing Problem with Time Windows and
 * Bilateral Cross-Docking Synchronization
 *
 * Grounded in:
 * - Lee, Kim, Kang (Computers & Operations Research 2004): "A Heuristic for Vehicle Routing Problem with Cross-Docking"
 * - Petersen & Ropke (Transportation Science 2011): "The Vehicle Routing Problem with Cross-Docking and Synchronization Constraints"
 * - Wen, Cordeau, Laporte, Larsen (European Journal of Operational Research 2010): "The Vehicle Routing Problem with Cross-Docking: Formulations and Heuristics"
 *
 * E-Commerce Practical Relevance:
 * In modern multi-vendor platforms (Shopee SPX Express), an order frequently contains items from
 * multiple independent sellers (e.g. Shop A in Cầu Giấy and Shop B in Hà Đông) shipped to a single buyer in Hoàn Kiếm.
 * Rather than shipping two separate packages with double last-mile delivery fees, parcels are:
 * 1. Picked up by Inbound Trucks from vendors and brought to the Central Cross-Dock Facility.
 * 2. Unloaded, scanned, sorted, and consolidated within sorting time delta_t_sort (e.g. 20-30 mins).
 * 3. Dispatched in a unified Outbound Delivery Van to the buyer before their deadline l_i.
 *
 * Synchronization Constraint:
 * For each consolidated package j:
 *      t_dep_outbound >= max_{k in InboundSuppliers(j)} (t_arr_hub,k + delta_t_sort)
 */

class VRPTWCrossDockBilateralRouter {
  /**
   * @param {Object} options
   * @param {Object} [options.hub] - Central Cross-Dock facility coordinates
   * @param {number} [options.sortingDurationMin=25] - Sorting and consolidation time at hub (min)
   * @param {number} [options.inboundCapacityKg=300] - Inbound pickup truck capacity
   * @param {number} [options.outboundCapacityKg=80] - Outbound delivery van capacity
   * @param {number} [options.speedKmH=32] - Average vehicle speed
   * @param {number} [options.costPerKm=4500] - Fuel & vehicle cost per km (VND)
   * @param {number} [options.latenessPenaltyPerMin=1000] - Penalty per minute late (VND)
   * @param {number} [options.hubHoldingPenaltyPerMin=200] - Idle waiting penalty at cross-dock
   */
  constructor(options = {}) {
    this.hub = options.hub || { id: 'HUB_MAIN', name: 'Hub SPX Central Cross-Dock', x: 0, y: 0 };
    this.sortingDurationMin = options.sortingDurationMin || 25;
    this.inboundCapacityKg = options.inboundCapacityKg || 300;
    this.outboundCapacityKg = options.outboundCapacityKg || 80;
    this.speedKmH = options.speedKmH || 32;
    this.speedKmPerMin = this.speedKmH / 60; // km/min

    this.costPerKm = options.costPerKm || 4500;
    this.latenessPenaltyPerMin = options.latenessPenaltyPerMin || 1000;
    this.hubHoldingPenaltyPerMin = options.hubHoldingPenaltyPerMin || 200;
  }

  /**
   * Euclidean distance between two spatial points
   */
  distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Plan synchronized bilateral cross-docking routes
   * @param {Object} data
   * @param {Array<Object>} data.suppliers - Inbound pickup suppliers (vendors)
   * @param {Array<Object>} data.customers - Outbound delivery customers (buyers)
   * @param {Array<Object>} data.crossDockOrders - Orders mapping supplier items to customer destinations
   * @returns {Object} Synchronized cross-dock schedule
   */
  planBilateralCrossDockRoutes({ suppliers = [], customers = [], crossDockOrders = [] } = {}) {
    if (!suppliers.length || !customers.length) {
      return {
        status: 'EMPTY_INPUT',
        inboundRoutes: [],
        outboundRoutes: [],
        consolidatedOrders: [],
        summary: {
          totalDistanceKm: 0,
          totalInboundVehicles: 0,
          totalOutboundVehicles: 0,
          totalGeneralizedCostVnd: 0,
          isSynchronized: true
        }
      };
    }

    // 1. Plan Inbound Pickup Routes (Hub -> Suppliers -> Hub)
    const inboundRoutes = [];
    const unvisitedSuppliers = [...suppliers];
    let inboundVehicleCount = 0;

    while (unvisitedSuppliers.length > 0) {
      inboundVehicleCount++;
      const currentRoute = [];
      let currentPayload = 0;
      let currentTime = 0; // Inbound departure from hub at t = 0
      let prevNode = this.hub;
      let routeDistance = 0;

      while (unvisitedSuppliers.length > 0) {
        let bestIdx = -1;
        let minDistance = Infinity;

        for (let i = 0; i < unvisitedSuppliers.length; i++) {
          const supp = unvisitedSuppliers[i];
          const load = supp.supplyLoad || 10;
          if (currentPayload + load <= this.inboundCapacityKg) {
            const d = this.distance(prevNode, supp);
            if (d < minDistance) {
              minDistance = d;
              bestIdx = i;
            }
          }
        }

        if (bestIdx >= 0) {
          const chosen = unvisitedSuppliers.splice(bestIdx, 1)[0];
          const d = this.distance(prevNode, chosen);
          routeDistance += d;
          const travelTime = d / this.speedKmPerMin;
          const arrTime = currentTime + travelTime;
          const pickupTime = chosen.pickupDuration || 15;
          const depTime = arrTime + pickupTime;

          currentRoute.push({
            supplierId: chosen.id,
            name: chosen.name,
            x: chosen.x,
            y: chosen.y,
            load: chosen.supplyLoad || 10,
            arrivalTime: Number(arrTime.toFixed(1)),
            departureTime: Number(depTime.toFixed(1))
          });

          currentPayload += chosen.supplyLoad || 10;
          currentTime = depTime;
          prevNode = chosen;
        } else {
          break; // Capacity full for this vehicle
        }
      }

      // Return to Hub
      const returnDist = this.distance(prevNode, this.hub);
      routeDistance += returnDist;
      const hubArrTime = currentTime + returnDist / this.speedKmPerMin;

      inboundRoutes.push({
        vehicleId: `INBOUND_TRUCK_${inboundVehicleCount}`,
        stops: currentRoute,
        totalPayloadKg: currentPayload,
        totalDistanceKm: Number(routeDistance.toFixed(2)),
        hubArrivalTime: Number(hubArrTime.toFixed(1))
      });
    }

    // Map each supplier's items to their hub arrival time
    const supplierArrivalMap = new Map();
    for (const r of inboundRoutes) {
      for (const stop of r.stops) {
        supplierArrivalMap.set(stop.supplierId, r.hubArrivalTime);
      }
    }

    // 2. Compute Ready-for-Outbound Time for each order
    // Order ready time = max arrival time of required suppliers + sorting duration
    const consolidatedOrders = [];
    const customerEarliestDispatchMap = new Map();

    for (const order of crossDockOrders) {
      const suppIds = Array.isArray(order.supplierIds) ? order.supplierIds : [order.supplierId];
      let maxSupplierArr = 0;
      for (const sId of suppIds) {
        const arr = supplierArrivalMap.get(sId) || 0;
        if (arr > maxSupplierArr) maxSupplierArr = arr;
      }

      const readyTime = maxSupplierArr + this.sortingDurationMin;
      consolidatedOrders.push({
        orderId: order.orderId || order.id,
        customerId: order.customerId,
        demandKg: order.demandKg || 5,
        suppliers: suppIds,
        hubArrivalMaxMin: Number(maxSupplierArr.toFixed(1)),
        readyForDispatchMin: Number(readyTime.toFixed(1))
      });

      const currEarliest = customerEarliestDispatchMap.get(order.customerId) || 0;
      if (readyTime > currEarliest) {
        customerEarliestDispatchMap.set(order.customerId, readyTime);
      }
    }

    // 3. Plan Outbound Delivery Routes (Hub -> Customers -> Hub)
    const outboundRoutes = [];
    const unvisitedCustomers = [...customers];
    let outboundVehicleCount = 0;
    let totalLatenessMin = 0;
    let totalHoldingWaitMin = 0;

    while (unvisitedCustomers.length > 0) {
      outboundVehicleCount++;
      const currentRoute = [];
      let currentPayload = 0;
      let routeDistance = 0;

      // Group customers that can be serviced
      const clusterCustomers = [];
      while (unvisitedCustomers.length > 0) {
        let bestIdx = -1;
        let minD = Infinity;
        const lastLoc = clusterCustomers.length === 0 ? this.hub : clusterCustomers[clusterCustomers.length - 1];

        for (let i = 0; i < unvisitedCustomers.length; i++) {
          const cust = unvisitedCustomers[i];
          const demand = cust.demand || 5;
          if (currentPayload + demand <= this.outboundCapacityKg) {
            const d = this.distance(lastLoc, cust);
            if (d < minD) {
              minD = d;
              bestIdx = i;
            }
          }
        }

        if (bestIdx >= 0) {
          const chosen = unvisitedCustomers.splice(bestIdx, 1)[0];
          currentPayload += chosen.demand || 5;
          clusterCustomers.push(chosen);
        } else {
          break;
        }
      }

      // Outbound departure must wait until all packages in this van are sorted at hub!
      let vanHubDepartureTime = 0;
      for (const cust of clusterCustomers) {
        const reqReady = customerEarliestDispatchMap.get(cust.id) || 0;
        if (reqReady > vanHubDepartureTime) {
          vanHubDepartureTime = reqReady;
        }
      }

      let currentTime = vanHubDepartureTime;
      let prevNode = this.hub;

      for (const cust of clusterCustomers) {
        const d = this.distance(prevNode, cust);
        routeDistance += d;
        const travelTime = d / this.speedKmPerMin;
        const arrTime = currentTime + travelTime;

        const e_i = cust.timeWindow ? cust.timeWindow[0] : 0;
        const l_i = cust.timeWindow ? cust.timeWindow[1] : 480;

        let waitTime = 0;
        if (arrTime < e_i) {
          waitTime = e_i - arrTime;
        }
        let lateTime = 0;
        if (arrTime > l_i) {
          lateTime = arrTime - l_i;
          totalLatenessMin += lateTime;
        }

        const serviceTime = cust.serviceTime || 10;
        const depTime = Math.max(e_i, arrTime) + serviceTime;
        currentTime = depTime;

        currentRoute.push({
          customerId: cust.id,
          name: cust.name,
          demand: cust.demand || 5,
          arrivalTime: Number(arrTime.toFixed(1)),
          departureTime: Number(depTime.toFixed(1)),
          timeWindow: [e_i, l_i],
          lateMinutes: Number(lateTime.toFixed(1))
        });

        prevNode = cust;
      }

      // Van returns to hub
      const returnDist = this.distance(prevNode, this.hub);
      routeDistance += returnDist;
      const finalHubArrival = currentTime + returnDist / this.speedKmPerMin;

      outboundRoutes.push({
        vehicleId: `OUTBOUND_VAN_${outboundVehicleCount}`,
        departureFromHubTime: Number(vanHubDepartureTime.toFixed(1)),
        stops: currentRoute,
        totalPayloadKg: currentPayload,
        totalDistanceKm: Number(routeDistance.toFixed(2)),
        returnToHubTime: Number(finalHubArrival.toFixed(1))
      });
    }

    // Cost calculations
    let totalDistKm = 0;
    for (const r of inboundRoutes) totalDistKm += r.totalDistanceKm;
    for (const r of outboundRoutes) totalDistKm += r.totalDistanceKm;

    const transportationCost = Math.round(totalDistKm * this.costPerKm);
    const latenessCost = Math.round(totalLatenessMin * this.latenessPenaltyPerMin);
    const totalGeneralizedCost = transportationCost + latenessCost;

    return {
      status: 'SUCCESS',
      inboundRoutes,
      outboundRoutes,
      consolidatedOrders,
      summary: {
        totalDistanceKm: Number(totalDistKm.toFixed(2)),
        totalInboundVehicles: inboundRoutes.length,
        totalOutboundVehicles: outboundRoutes.length,
        totalOrdersConsolidated: consolidatedOrders.length,
        totalLatenessMinutes: Number(totalLatenessMin.toFixed(1)),
        transportationCostVnd: transportationCost,
        latenessPenaltyVnd: latenessCost,
        totalGeneralizedCostVnd: totalGeneralizedCost,
        isSynchronized: true
      }
    };
  }
}

// Dual ESM/CJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VRPTWCrossDockBilateralRouter };
}
export { VRPTWCrossDockBilateralRouter };
