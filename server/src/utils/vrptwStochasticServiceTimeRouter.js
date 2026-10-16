/**
 * VRPTWStochasticServiceTimeRouter - Vehicle Routing Problem with Time Windows
 * and Stochastic Service Times & Reliability Buffers
 *
 * Grounded in:
 * - Kenyon & Morton (Transportation Science 2003): "Stochastic Vehicle Routing with Random Travel and Service Times"
 * - Campbell & Thomas (Transportation Science 2008): "The Vehicle Routing Problem with Stochastic Demands and Travel Times"
 * - Errico et al. (Computers & Operations Research 2016): "The Vehicle Routing Problem with Hard Time Windows and Stochastic Service Times"
 *
 * Practical E-Commerce Relevance:
 * In last-mile logistics (SPX, Shopee Express, GrabExpress), unloading, inspection, and customer COD cash collection
 * are inherently random. A static schedule assuming deterministic service time will suffer cascading delays,
 * resulting in widespread SLA breaches.
 *
 * Mathematical Framework:
 * 1. Each stop i has random service time S_i ~ N(mu_i, sigma_i^2).
 * 2. Along a route (0, 1, 2, ..., n):
 *      E[A_j] = max(e_i, E[A_i]) + mu_i + t_ij
 *      Var(A_j) = Var(A_i) + sigma_i^2 + sigma_travel^2
 * 3. Reliability Buffer for SLA confidence level alpha (e.g. 95%, z_0.95 = 1.645):
 *      B_j(alpha) = z_alpha * sqrt(Var(A_j))
 * 4. Chance-constrained feasibility:
 *      E[A_j] + B_j(alpha) <= l_j   <=>  P(A_j <= l_j) >= alpha
 * 5. On-Time Delivery Probability (OTD):
 *      OTD_j = Phi( (l_j - E[A_j]) / sqrt(Var(A_j)) )
 */

class VRPTWStochasticServiceTimeRouter {
  /**
   * @param {Object} options
   * @param {Object} [options.depot] - Depot coordinates and parameters
   * @param {number} [options.depot.x=0]
   * @param {number} [options.depot.y=0]
   * @param {number} [options.vehicleCapacity=100] - Maximum capacity per vehicle
   * @param {number} [options.averageSpeedKmH=30] - Speed in km/h (0.5 km/min)
   * @param {number} [options.confidenceAlpha=0.95] - SLA reliability confidence level (e.g. 0.90, 0.95, 0.99)
   * @param {number} [options.maxRouteDuration=480] - Maximum driver shift length in minutes (8h)
   */
  constructor(options = {}) {
    this.depot = options.depot || { id: 'DEPOT', name: 'Hub Trung Tâm SPX', x: 0, y: 0 };
    this.vehicleCapacity = options.vehicleCapacity || 100;
    this.averageSpeedKmH = options.averageSpeedKmH || 30;
    this.speedKmPerMin = this.averageSpeedKmH / 60; // km per minute
    this.confidenceAlpha = options.confidenceAlpha || 0.95;
    this.maxRouteDuration = options.maxRouteDuration || 480;

    // Standard normal inverse CDF quantile z_alpha approximation
    this.zAlpha = this.computeNormalQuantile(this.confidenceAlpha);
  }

  /**
   * Approximation of standard normal quantile z = Phi^{-1}(p) (Beasley-Springer-Moro)
   * @param {number} p (0 < p < 1)
   * @returns {number}
   */
  computeNormalQuantile(p) {
    if (p <= 0 || p >= 1) return 1.645;
    if (Math.abs(p - 0.95) < 0.005) return 1.6449;
    if (Math.abs(p - 0.90) < 0.005) return 1.2816;
    if (Math.abs(p - 0.99) < 0.005) return 2.3263;

    // Rational approximation for normal quantile
    const t = Math.sqrt(-2 * Math.log(1 - p));
    const c0 = 2.515517;
    const c1 = 0.802853;
    const c2 = 0.010328;
    const d1 = 1.432788;
    const d2 = 0.189269;
    const d3 = 0.001308;
    return t - (c0 + c1 * t + c2 * t * t) / (1 + d1 * t + d2 * t * t + d3 * t * t * t);
  }

  /**
   * Approximation of standard normal CDF Phi(z)
   * @param {number} z
   * @returns {number}
   */
  normalCDF(z) {
    if (z < -6) return 0;
    if (z > 6) return 1;
    const b1 = 0.319381530;
    const b2 = -0.356563782;
    const b3 = 1.781477937;
    const b4 = -1.821255978;
    const b5 = 1.330274429;
    const p = 0.2316419;
    const c = 0.39894228;

    if (z >= 0) {
      const t = 1.0 / (1.0 + p * z);
      return 1.0 - c * Math.exp(-z * z / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    } else {
      const t = 1.0 / (1.0 - p * z);
      return c * Math.exp(-z * z / 2.0) * t * (t * (t * (t * (t * b5 + b4) + b3) + b2) + b1);
    }
  }

  /**
   * Euclidean distance between two points in km
   */
  distance(p1, p2) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Travel time between two points in minutes
   */
  travelTime(p1, p2) {
    const dist = this.distance(p1, p2);
    return dist / this.speedKmPerMin;
  }

  /**
   * Evaluate a route under stochastic service times and check chance-constraints
   * @param {Array<Object>} customerSequence
   * @returns {Object} Route evaluation with stop-by-stop metrics
   */
  evaluateRoute(customerSequence = []) {
    let currentExpTime = 0; // Depot departure at t = 0
    let currentVariance = 0; // Variance at depot = 0
    let prevNode = this.depot;
    let totalDemand = 0;
    let totalDistance = 0;
    const stops = [];
    let isFeasible = true;

    for (let idx = 0; idx < customerSequence.length; idx++) {
      const customer = customerSequence[idx];
      totalDemand += customer.demand || 1;

      const dist = this.distance(prevNode, customer);
      totalDistance += dist;
      const tTravel = dist / this.speedKmPerMin;

      // Arrival at customer
      const expArrival = currentExpTime + tTravel;
      // Variance accumulates previous variance + travel variance (assume 5% std of travel time)
      const travelVariance = Math.pow(0.05 * tTravel, 2);
      const arrVariance = currentVariance + travelVariance;
      const arrStd = Math.sqrt(arrVariance);

      // Reliability buffer for SLA alpha
      const reliabilityBuffer = this.zAlpha * arrStd;
      const quantileArrival = expArrival + reliabilityBuffer;

      // Time window check: early arrival means waiting until e_i
      const earlyWindow = customer.timeWindow ? customer.timeWindow[0] : 0;
      const lateWindow = customer.timeWindow ? customer.timeWindow[1] : 480;

      // On-time probability: P(Arrival <= lateWindow)
      let otdProb = 1.0;
      if (arrStd > 1e-4) {
        const z = (lateWindow - expArrival) / arrStd;
        otdProb = this.normalCDF(z);
      } else {
        otdProb = expArrival <= lateWindow ? 1.0 : 0.0;
      }

      // Chance-constraint feasibility check: quantile arrival <= lateWindow
      if (quantileArrival > lateWindow) {
        isFeasible = false;
      }

      // Service time: mean mu and std sigma
      const muService = customer.meanServiceTime !== undefined ? customer.meanServiceTime : 10; // 10 mins
      const sigmaService = customer.stdServiceTime !== undefined ? customer.stdServiceTime : 3; // 3 mins std

      // Effective service start (wait if arriving before e_i)
      const effectiveStart = Math.max(earlyWindow, expArrival);
      currentExpTime = effectiveStart + muService;
      currentVariance = arrVariance + (sigmaService * sigmaService);

      stops.push({
        id: customer.id,
        name: customer.name || `Khách ${customer.id}`,
        demand: customer.demand || 1,
        expectedArrival: Number(expArrival.toFixed(2)),
        reliabilityBuffer: Number(reliabilityBuffer.toFixed(2)),
        quantileArrival: Number(quantileArrival.toFixed(2)),
        timeWindow: [earlyWindow, lateWindow],
        otdProbability: Number(otdProb.toFixed(4)),
        meanServiceTime: muService,
        stdServiceTime: sigmaService,
        departureTime: Number(currentExpTime.toFixed(2)),
        withinSLA: quantileArrival <= lateWindow
      });

      prevNode = customer;
    }

    // Return to depot
    const returnDist = this.distance(prevNode, this.depot);
    totalDistance += returnDist;
    const returnTime = returnDist / this.speedKmPerMin;
    currentExpTime += returnTime;

    if (totalDemand > this.vehicleCapacity || currentExpTime > this.maxRouteDuration) {
      isFeasible = false;
    }

    return {
      stops,
      totalDemand,
      totalDistance: Number(totalDistance.toFixed(2)),
      totalDuration: Number(currentExpTime.toFixed(2)),
      isFeasible,
      capacityUtilization: Number((totalDemand / this.vehicleCapacity).toFixed(3))
    };
  }

  /**
   * Plan routes for a set of customers with chance-constrained stochastic reliability
   * @param {Array<Object>} customers
   * @returns {Object} Optimized routing plan
   */
  planRoutes(customers = []) {
    if (!Array.isArray(customers) || customers.length === 0) {
      return {
        routes: [],
        totalVehicles: 0,
        totalDistance: 0,
        averageOTDProbability: 1.0,
        allFeasible: true
      };
    }

    const unassigned = [...customers];
    const routes = [];

    // Sort unassigned by earliest time window deadline
    unassigned.sort((a, b) => {
      const eA = a.timeWindow ? a.timeWindow[0] : 0;
      const eB = b.timeWindow ? b.timeWindow[0] : 0;
      return eA - eB;
    });

    while (unassigned.length > 0) {
      const currentRoute = [];
      let currentCapacity = 0;

      // Seed first customer
      const seed = unassigned.shift();
      currentRoute.push(seed);
      currentCapacity += seed.demand || 1;

      // Greedily append nearest feasible customers that maintain SLA reliability
      let added = true;
      while (added) {
        added = false;
        let bestCandidateIdx = -1;
        let minExtraCost = Infinity;

        for (let i = 0; i < unassigned.length; i++) {
          const cand = unassigned[i];
          const candDemand = cand.demand || 1;
          if (currentCapacity + candDemand > this.vehicleCapacity) continue;

          // Test appending cand
          const testSequence = [...currentRoute, cand];
          const evalRes = this.evaluateRoute(testSequence);

          if (evalRes.isFeasible) {
            const lastStop = currentRoute[currentRoute.length - 1];
            const dist = this.distance(lastStop, cand);
            if (dist < minExtraCost) {
              minExtraCost = dist;
              bestCandidateIdx = i;
            }
          }
        }

        if (bestCandidateIdx >= 0) {
          const chosen = unassigned.splice(bestCandidateIdx, 1)[0];
          currentRoute.push(chosen);
          currentCapacity += chosen.demand || 1;
          added = true;
        }
      }

      // Optimize current route with 2-Opt
      const optimizedRoute = this.twoOptRefine(currentRoute);
      const finalEval = this.evaluateRoute(optimizedRoute);

      routes.push({
        vehicleId: `SPX-FLEET-${routes.length + 1}`,
        ...finalEval
      });
    }

    let totalDist = 0;
    let totalStops = 0;
    let sumOTD = 0;
    let allFeasible = true;

    for (const r of routes) {
      totalDist += r.totalDistance;
      if (!r.isFeasible) allFeasible = false;
      for (const s of r.stops) {
        sumOTD += s.otdProbability;
        totalStops++;
      }
    }

    const avgOTD = totalStops > 0 ? Number((sumOTD / totalStops).toFixed(4)) : 1.0;

    return {
      routes,
      totalVehicles: routes.length,
      totalDistance: Number(totalDist.toFixed(2)),
      averageOTDProbability: avgOTD,
      confidenceAlpha: this.confidenceAlpha,
      zAlpha: Number(this.zAlpha.toFixed(4)),
      allFeasible
    };
  }

  /**
   * 2-Opt local search refinement respecting stochastic SLA feasibility
   */
  twoOptRefine(sequence) {
    if (sequence.length <= 3) return sequence;
    let best = [...sequence];
    let bestEval = this.evaluateRoute(best);
    let improved = true;
    let iter = 0;

    while (improved && iter < 15) {
      improved = false;
      iter++;
      for (let i = 0; i < best.length - 1; i++) {
        for (let j = i + 1; j < best.length; j++) {
          const candidate = [
            ...best.slice(0, i),
            ...best.slice(i, j + 1).reverse(),
            ...best.slice(j + 1)
          ];
          const candEval = this.evaluateRoute(candidate);
          if (candEval.isFeasible && candEval.totalDistance < bestEval.totalDistance - 1e-4) {
            best = candidate;
            bestEval = candEval;
            improved = true;
            break;
          }
        }
        if (improved) break;
      }
    }
    return best;
  }
}

// Dual ESM/CJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { VRPTWStochasticServiceTimeRouter };
}
export { VRPTWStochasticServiceTimeRouter };
