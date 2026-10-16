/**
 * KPSFrequentItems - Richard Karp, Christos Papadimitriou, Scott Shenker (ACM TODS 2003)
 *
 * "A Simple Algorithm for Finding Frequent Elements in Streams and Bags"
 *
 * Mathematical Principles & Guarantees:
 * 1. For a stream of length N and frequency threshold theta in (0, 1),
 *    the algorithm maintains at most m = ceil(1 / theta) counters.
 * 2. When an item x arrives:
 *    - If x is monitored, increment counter: c_x <- c_x + 1.
 *    - If fewer than m counters are active, allocate new counter: c_x <- 1.
 *    - If m counters are active and x is unmonitored:
 *      Perform simultaneous decrement: c_y <- c_y - 1 for all monitored y,
 *      and purge all y with c_y == 0.
 * 3. Provable Theoretical Bounds:
 *    - For any element y, the final counter value satisfies: f(y) - theta * N <= c_y <= f(y).
 *    - Any element with true frequency f(y) > theta * N is GUARANTEED to remain in the summary (0 False Negatives).
 *    - Space complexity: strictly O(1 / theta) entries.
 *
 * E-Commerce Applications:
 * - Real-time tracking of top viral products and trending search keywords.
 * - Real-time identification of frequent buyers, top flash-sale cart items, and suspicious bot IPs.
 */

class KPSFrequentItems {
  /**
   * @param {Object} options
   * @param {number} [options.theta=0.10] - Frequency threshold theta in (0, 1). Default 10% (0.10).
   * @param {number} [options.maxCounters] - Explicit maximum counters limit (defaults to ceil(1 / theta)).
   */
  constructor(options = {}) {
    const rawTheta = Number(options.theta) || 0.10;
    this.theta = Math.max(0.001, Math.min(0.50, rawTheta));
    this.maxCounters = options.maxCounters || Math.ceil(1 / this.theta);
    this.counters = new Map(); // key -> count
    this.totalItems = 0; // N: stream length
    this.purgePasses = 0; // Number of simultaneous decrements triggered
  }

  /**
   * Process a single item in the data stream
   * @param {string|number} item
   * @param {number} [weight=1]
   */
  update(item, weight = 1) {
    if (item === undefined || item === null) return;
    const key = String(item);
    const w = Math.max(1, Math.floor(weight || 1));
    this.totalItems += w;

    if (this.counters.has(key)) {
      this.counters.set(key, this.counters.get(key) + w);
      return;
    }

    if (this.counters.size < this.maxCounters) {
      this.counters.set(key, w);
      return;
    }

    // Table is full with maxCounters and key is not present.
    // Decrement all existing counters by 1 for each unit of weight
    for (let step = 0; step < w; step++) {
      if (this.counters.has(key)) {
        this.counters.set(key, this.counters.get(key) + 1);
        continue;
      }
      if (this.counters.size < this.maxCounters) {
        this.counters.set(key, 1);
        continue;
      }

      this.purgePasses++;
      for (const [existingKey, count] of Array.from(this.counters.entries())) {
        if (count <= 1) {
          this.counters.delete(existingKey);
        } else {
          this.counters.set(existingKey, count - 1);
        }
      }
    }
  }

  /**
   * Process an array of items in batch
   * @param {Array<string|number>} items
   */
  updateBatch(items = []) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      this.update(item);
    }
  }

  /**
   * Get estimated frequency of an item
   * @param {string|number} item
   * @returns {number} Estimated count in [f(x) - theta * N, f(x)]
   */
  estimate(item) {
    if (item === undefined || item === null) return 0;
    const key = String(item);
    return this.counters.get(key) || 0;
  }

  /**
   * Theoretical maximum error bound: theta * N
   * @returns {number}
   */
  getErrorBound() {
    return this.theta * this.totalItems;
  }

  /**
   * Extract heavy hitters with true frequency candidate guarantee
   * @param {number} [customThreshold] - Optional threshold ratio, defaults to this.theta
   * @returns {Array<{item: string, estimatedCount: number, lowerBound: number, maxPossibleCount: number, frequencyRatio: number}>}
   */
  getFrequentItems(customThreshold) {
    const thresh = typeof customThreshold === 'number' && customThreshold > 0 ? customThreshold : this.theta;
    const threshCount = thresh * this.totalItems;
    const errBound = this.getErrorBound();
    const results = [];

    for (const [item, count] of this.counters.entries()) {
      const maxPossible = count + errBound;
      if (maxPossible >= threshCount || count >= threshCount) {
        results.push({
          item,
          estimatedCount: count,
          lowerBound: count,
          maxPossibleCount: Math.min(this.totalItems, Math.floor(maxPossible)),
          frequencyRatio: this.totalItems > 0 ? Number((count / this.totalItems).toFixed(4)) : 0
        });
      }
    }

    results.sort((a, b) => b.estimatedCount - a.estimatedCount);
    return results;
  }

  /**
   * Merge another KPSFrequentItems summary of compatible parameters
   * @param {KPSFrequentItems} other
   */
  merge(other) {
    if (!other || !(other instanceof KPSFrequentItems)) return;

    for (const [item, count] of other.counters.entries()) {
      const current = this.counters.get(item) || 0;
      this.counters.set(item, current + count);
    }
    this.totalItems += other.totalItems;

    // Prune down if counters exceed maxCounters
    while (this.counters.size > this.maxCounters) {
      let minVal = Infinity;
      for (const count of this.counters.values()) {
        if (count < minVal) minVal = count;
      }
      for (const [item, count] of Array.from(this.counters.entries())) {
        if (count <= minVal) {
          this.counters.delete(item);
        } else {
          this.counters.set(item, count - minVal);
        }
      }
    }
  }

  /**
   * Reset internal data structures
   */
  reset() {
    this.counters.clear();
    this.totalItems = 0;
    this.purgePasses = 0;
  }

  /**
   * Return summary metrics of the estimator
   */
  getMetrics() {
    return {
      theta: this.theta,
      maxCounters: this.maxCounters,
      activeCounters: this.counters.size,
      totalItems: this.totalItems,
      errorBound: Number(this.getErrorBound().toFixed(2)),
      purgePasses: this.purgePasses,
      counterOccupancy: Number((this.counters.size / this.maxCounters).toFixed(3))
    };
  }
}

// Dual ESM/CJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { KPSFrequentItems };
}
export { KPSFrequentItems };
