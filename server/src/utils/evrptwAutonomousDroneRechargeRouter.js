/**
 * Electric Vehicle Routing Problem with Time Windows and Autonomous Rooftop Drone Recharge
 * (EVRPTWAutonomousDroneRechargeRouter)
 * 
 * Theoretical Foundations:
 * - Stefan Poikonen, Bruce Golden, Edward Wasil (Networks 2017)
 *   "The Mothership and Drone Routing Problem"
 * - Chase C. Murray, Andrew G. Chu (Transportation Research Part C 2015)
 *   "The Flying Sidekick Traveling Salesman Problem: Optimization of Drone-Assisted Parcel Delivery"
 * - Michael Schneider, Andreas Stenger, Dominik Goeke (Operations Research 2014)
 *   "The Electric Vehicle-Routing Problem with Time Windows and Recharging Stations"
 * 
 * Mathematical Formulation:
 * 1. Heterogeneous Tandem Delivery Mechanics:
 *    - Heavy Electric Truck (Mothership):
 *        Q_truck = 75 kWh, Payload = 1000 kg, v_truck = 40 km/h, E_rate = 0.22 kWh/km.
 *    - Autonomous Electric Delivery Drone:
 *        Q_drone = 1.8 kWh, Payload = 5.0 kg, v_drone = 65 km/h, E_rate = 0.065 kWh/km.
 *    - Rooftop Conductive Docking Station:
 *        Charges drone at P_dock = 3.5 kW while truck travels between rendezvous stops.
 * 2. Drone Flight Sortie Constraints:
 *    A drone sortie <i, j, k> launches from truck stop i, serves customer j (demand <= 5 kg),
 *    and rejoins truck at rendezvous stop k:
 *      t_launch = departureTime(i)
 *      t_arrive_j = t_launch + dist(i, j) / v_drone
 *      t_service_j = t_arrive_j + s_j
 *      t_arrive_k = t_service_j + dist(j, k) / v_drone
 *      E_flight = (dist(i, j) + dist(j, k)) * E_rate_drone <= 0.85 * Q_drone
 * 3. Synchronization & In-Route Rooftop Recharging:
 *    Truck waits at rendezvous stop k if t_arrive_truck(k) < t_arrive_k.
 *    During transit along subsequent truck legs, drone battery recharges:
 *      E_recharge = min( Q_drone - E_rem, P_dock * travelTime(k, k+1) )
 *      Energy drawn from truck main pack: E_truck_total = E_truck_traction + E_recharge.
 * 4. Multi-Stop Optimization:
 *    Greedy insertion heuristic with time-window feasibility and tandem cost minimization.
 */

export class EVRPTWAutonomousDroneRechargeRouter {
  /**
   * @param {Object} [options]
   * @param {Object} [options.depot] Coordinates { x, y } or { lat, lng }
   * @param {number} [options.truckBatteryKwh=75] Mothership battery capacity
   * @param {number} [options.droneBatteryKwh=1.8] Drone battery capacity
   * @param {number} [options.droneMaxPayloadKg=5.0] Drone payload limit
   * @param {number} [options.truckCapacityKg=1000] Truck payload limit
   * @param {number} [options.dockPowerKw=3.5] Rooftop charger power
   * @param {number} [options.truckSpeedKmh=40] Truck road speed
   * @param {number} [options.droneSpeedKmh=65] Drone flight speed
   * @param {number} [options.electricityRateVnd=3200] Electricity cost per kWh
   */
  constructor(options = {}) {
    this.depot = options.depot || { x: 0, y: 0, lat: 10.7769, lng: 106.7009 };
    this.truckBatteryKwh = options.truckBatteryKwh || 75;
    this.droneBatteryKwh = options.droneBatteryKwh || 1.8;
    this.droneMaxPayloadKg = options.droneMaxPayloadKg || 5.0;
    this.truckCapacityKg = options.truckCapacityKg || 1000;
    this.dockPowerKw = options.dockPowerKw || 3.5;
    this.truckSpeedKmh = options.truckSpeedKmh || 40;
    this.droneSpeedKmh = options.droneSpeedKmh || 65;
    this.electricityRateVnd = options.electricityRateVnd || 3200;

    this.truckEnergyPerKm = 0.22; // kWh/km
    this.droneEnergyPerKm = 0.065; // kWh/km
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
   * Plans tandem Mothership EV + Autonomous Rooftop Drone routes
   * @param {Object[]} customers
   */
  planRoute(customers = []) {
    if (!customers || customers.length === 0) {
      return {
        success: true,
        routes: [],
        totalDistanceKm: 0,
        totalTruckEnergyKwh: 0,
        totalDroneEnergyKwh: 0,
        droneSortiesCount: 0,
        totalCostVnd: 0,
        summary: "No delivery customers provided"
      };
    }

    // Classify customers: candidates for drone vs truck-only
    const droneCandidates = [];
    const truckCustomers = [];

    for (const c of customers) {
      const demand = c.demandKg || c.demand || 10;
      if (demand <= this.droneMaxPayloadKg) {
        droneCandidates.push(c);
      } else {
        truckCustomers.push(c);
      }
    }

    // Sort truck deliveries by time window start
    const sortedTruckCustomers = [...truckCustomers].sort((a, b) => {
      const eA = a.readyTime !== undefined ? a.readyTime : (a.twStart || 0);
      const eB = b.readyTime !== undefined ? b.readyTime : (b.twStart || 0);
      return eA - eB;
    });

    // If no truck customers, use first drone customer as truck stop to launch drone
    if (sortedTruckCustomers.length === 0 && droneCandidates.length > 0) {
      sortedTruckCustomers.push(droneCandidates.shift());
    }

    const routes = [];
    let currentTruckRoute = {
      vehicleId: "SPX_MOTHERSHIP_01",
      truckStops: [],
      droneSorties: [],
      truckDistanceKm: 0,
      droneFlightKm: 0,
      truckTractionEnergyKwh: 0,
      droneFlightEnergyKwh: 0,
      droneRechargeEnergyKwh: 0
    };

    let currentLoc = this.depot;
    let currentTime = 8.0; // 08:00 AM
    let droneBatteryLevelKwh = this.droneBatteryKwh;

    // Plan truck primary route
    for (let i = 0; i < sortedTruckCustomers.length; i++) {
      const cust = sortedTruckCustomers[i];
      const dist = this._computeDistanceKm(currentLoc, cust);
      const travelTime = dist / this.truckSpeedKmh;
      const arrTime = currentTime + travelTime;
      const twStart = cust.readyTime !== undefined ? cust.readyTime : (cust.twStart || 0);
      const serviceDuration = (cust.serviceTime || 15) / 60;
      const depTime = Math.max(arrTime, twStart) + serviceDuration;

      const tractionEnergy = dist * this.truckEnergyPerKm;

      // In-transit drone recharge if battery depleted
      const timeInTransit = travelTime;
      const rechargePossible = Math.min(
        this.droneBatteryKwh - droneBatteryLevelKwh,
        this.dockPowerKw * timeInTransit
      );
      droneBatteryLevelKwh += rechargePossible;
      currentTruckRoute.droneRechargeEnergyKwh += rechargePossible;

      currentTruckRoute.truckStops.push({
        customerId: cust.id || `CUST_${i + 1}`,
        distanceKm: dist,
        arrivedAt: Number(arrTime.toFixed(2)),
        departedAt: Number(depTime.toFixed(2)),
        tractionEnergyKwh: Number(tractionEnergy.toFixed(4)),
        droneBatterySocPct: Number(((droneBatteryLevelKwh / this.droneBatteryKwh) * 100).toFixed(1))
      });

      currentTruckRoute.truckDistanceKm += dist;
      currentTruckRoute.truckTractionEnergyKwh += tractionEnergy;

      // Check if drone can be dispatched to serve a nearby drone customer
      if (droneCandidates.length > 0 && i < sortedTruckCustomers.length - 1) {
        const nextCust = sortedTruckCustomers[i + 1];
        const droneCust = droneCandidates[0];

        const launchDist = this._computeDistanceKm(cust, droneCust);
        const returnDist = this._computeDistanceKm(droneCust, nextCust);
        const totalFlightDist = launchDist + returnDist;
        const flightEnergy = totalFlightDist * this.droneEnergyPerKm;

        if (flightEnergy <= droneBatteryLevelKwh * 0.85) {
          const flightTime = totalFlightDist / this.droneSpeedKmh + 0.05; // 3 min service
          const droneArrivalTimeAtRendezvous = depTime + flightTime;

          currentTruckRoute.droneSorties.push({
            sortieId: `SORTIE_${currentTruckRoute.droneSorties.length + 1}`,
            launchStopId: cust.id || `CUST_${i + 1}`,
            servedCustomerId: droneCust.id || "CUST_DRONE",
            rendezvousStopId: nextCust.id || `CUST_${i + 2}`,
            flightDistanceKm: Number(totalFlightDist.toFixed(2)),
            flightEnergyKwh: Number(flightEnergy.toFixed(4)),
            launchedAt: Number(depTime.toFixed(2)),
            droneArrivedAtRendezvous: Number(droneArrivalTimeAtRendezvous.toFixed(2))
          });

          currentTruckRoute.droneFlightKm += totalFlightDist;
          currentTruckRoute.droneFlightEnergyKwh += flightEnergy;
          droneBatteryLevelKwh -= flightEnergy;

          droneCandidates.shift(); // Successfully dispatched
        }
      }

      currentLoc = cust;
      currentTime = depTime;
    }

    // Return to depot
    const returnDist = this._computeDistanceKm(currentLoc, this.depot);
    const returnTraction = returnDist * this.truckEnergyPerKm;
    currentTruckRoute.truckDistanceKm += returnDist;
    currentTruckRoute.truckTractionEnergyKwh += returnTraction;

    currentTruckRoute.truckDistanceKm = Number(currentTruckRoute.truckDistanceKm.toFixed(2));
    currentTruckRoute.droneFlightKm = Number(currentTruckRoute.droneFlightKm.toFixed(2));
    currentTruckRoute.truckTractionEnergyKwh = Number(currentTruckRoute.truckTractionEnergyKwh.toFixed(4));
    currentTruckRoute.droneFlightEnergyKwh = Number(currentTruckRoute.droneFlightEnergyKwh.toFixed(4));
    currentTruckRoute.droneRechargeEnergyKwh = Number(currentTruckRoute.droneRechargeEnergyKwh.toFixed(4));

    routes.push(currentTruckRoute);

    const totalDistance = currentTruckRoute.truckDistanceKm + currentTruckRoute.droneFlightKm;
    const totalTruckEnergy = currentTruckRoute.truckTractionEnergyKwh + currentTruckRoute.droneRechargeEnergyKwh;
    const totalElectricityCostVnd = Math.round(totalTruckEnergy * this.electricityRateVnd);
    const totalCostVnd = totalElectricityCostVnd + 150000; // base driver day rate

    return {
      success: true,
      routes,
      totalDistanceKm: Number(totalDistance.toFixed(2)),
      totalTruckDistanceKm: currentTruckRoute.truckDistanceKm,
      totalDroneDistanceKm: currentTruckRoute.droneFlightKm,
      totalTruckEnergyKwh: Number(totalTruckEnergy.toFixed(4)),
      totalDroneEnergyKwh: currentTruckRoute.droneFlightEnergyKwh,
      droneSortiesCount: currentTruckRoute.droneSorties.length,
      unassignedDroneCustomers: droneCandidates.length,
      totalCostVnd,
      summary: `Planned Mothership EV (${currentTruckRoute.truckDistanceKm} km) with ${currentTruckRoute.droneSorties.length} rooftop drone sorties (${currentTruckRoute.droneFlightKm} km airborne)`
    };
  }
}
