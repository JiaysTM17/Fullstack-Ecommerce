/**
 * Multi-Objective Pareto Frontier Ranking (NSGA-II Fast Non-Dominated Sorting & Crowding Distance)
 * Deb et al. (2002)
 *
 * Applications in E-Commerce:
 * 1. Multi-criteria Product Recommendation balancing competing buyer goals:
 *    - Price (minimize)
 *    - Rating score (maximize)
 *    - Delivery time in hours (minimize)
 *    - Store fulfillment SLA rate (maximize)
 * 2. Identifies non-dominated Pareto-optimal products (Front 1) where no attribute can be improved
 *    without sacrificing another.
 * 3. Crowding distance ensures catalog diversity, preventing recommendations clustered around identical variants.
 */

class ParetoFrontierRanker {
  /**
   * @param {Object} [objectiveConfig] - Defines directions: "min" or "max"
   */
  constructor(objectiveConfig = {}) {
    // Default objectives for e-commerce products
    this.objectives = {
      price: "min",
      rating: "max",
      deliveryHours: "min",
      fulfillmentRate: "max",
      ...objectiveConfig,
    };
  }

  /**
   * Check if solution A dominates solution B (A < B)
   * A dominates B if A is not worse than B in all objectives and strictly better in at least one.
   * @param {Object} a
   * @param {Object} b
   * @returns {boolean}
   */
  dominates(a, b) {
    let betterInAtLeastOne = false;

    for (const [key, direction] of Object.entries(this.objectives)) {
      const valA = Number(a[key]) || 0;
      const valB = Number(b[key]) || 0;

      if (direction === "min") {
        if (valA > valB) return false; // A is worse than B
        if (valA < valB) betterInAtLeastOne = true;
      } else {
        if (valA < valB) return false; // A is worse than B
        if (valA > valB) betterInAtLeastOne = true;
      }
    }

    return betterInAtLeastOne;
  }

  /**
   * Fast Non-Dominated Sorting (NSGA-II)
   * Partitions items into Pareto Fronts: Front 1, Front 2, ...
   * @param {Array<Object>} items
   * @returns {Array<Array<Object>>} fronts
   */
  fastNonDominatedSort(items) {
    if (!items || items.length === 0) return [];

    const n = items.length;
    const S = Array.from({ length: n }, () => []); // S[p]: items dominated by p
    const dominationCount = Array(n).fill(0);      // n[p]: number of items dominating p
    const fronts = [[]];                           // fronts[0] is Front 1

    for (let p = 0; p < n; p++) {
      for (let q = 0; q < n; q++) {
        if (p === q) continue;

        if (this.dominates(items[p], items[q])) {
          S[p].push(q);
        } else if (this.dominates(items[q], items[p])) {
          dominationCount[p]++;
        }
      }

      if (dominationCount[p] === 0) {
        items[p].paretoRank = 1;
        fronts[0].push(p);
      }
    }

    let i = 0;
    while (fronts[i].length > 0) {
      const nextFront = [];
      for (const p of fronts[i]) {
        for (const q of S[p]) {
          dominationCount[q]--;
          if (dominationCount[q] === 0) {
            items[q].paretoRank = i + 2;
            nextFront.push(q);
          }
        }
      }
      i++;
      if (nextFront.length > 0) {
        fronts.push(nextFront);
      } else {
        break;
      }
    }

    // Convert indices back to item objects
    return fronts.map(frontIndices => frontIndices.map(idx => items[idx]));
  }

  /**
   * Calculate Crowding Distance for a front to maintain diversity
   * @param {Array<Object>} front
   */
  calculateCrowdingDistance(front) {
    const l = front.length;
    if (l <= 2) {
      for (const item of front) item.crowdingDistance = Infinity;
      return;
    }

    for (const item of front) item.crowdingDistance = 0;

    for (const [key] of Object.entries(this.objectives)) {
      front.sort((a, b) => (Number(a[key]) || 0) - (Number(b[key]) || 0));

      const minVal = Number(front[0][key]) || 0;
      const maxVal = Number(front[l - 1][key]) || 0;
      const range = maxVal - minVal;

      front[0].crowdingDistance = Infinity;
      front[l - 1].crowdingDistance = Infinity;

      if (range > 0) {
        for (let i = 1; i < l - 1; i++) {
          if (front[i].crowdingDistance !== Infinity) {
            const prevVal = Number(front[i - 1][key]) || 0;
            const nextVal = Number(front[i + 1][key]) || 0;
            front[i].crowdingDistance += (nextVal - prevVal) / range;
          }
        }
      }
    }
  }

  /**
   * Rank products by Pareto Rank (ascending) and Crowding Distance (descending)
   * @param {Array<Object>} items
   * @param {number} [topK]
   * @returns {Array<Object>}
   */
  rank(items, topK) {
    if (!items || items.length === 0) return [];
    const cloned = items.map(it => ({ ...it }));

    const fronts = this.fastNonDominatedSort(cloned);
    const ranked = [];

    for (const front of fronts) {
      this.calculateCrowdingDistance(front);
      // Sort within front by crowding distance descending (favoring diverse products)
      front.sort((a, b) => {
        if (a.crowdingDistance === Infinity && b.crowdingDistance !== Infinity) return -1;
        if (b.crowdingDistance === Infinity && a.crowdingDistance !== Infinity) return 1;
        return (b.crowdingDistance || 0) - (a.crowdingDistance || 0);
      });
      for (const item of front) {
        ranked.push(item);
      }
    }

    return topK ? ranked.slice(0, topK) : ranked;
  }

  /**
   * Return only the Pareto Optimal products (Front 1)
   * @param {Array<Object>} items
   * @returns {Array<Object>}
   */
  getParetoFront(items) {
    const ranked = this.rank(items);
    return ranked.filter(it => it.paretoRank === 1);
  }
}

export { ParetoFrontierRanker };
export default ParetoFrontierRanker;
