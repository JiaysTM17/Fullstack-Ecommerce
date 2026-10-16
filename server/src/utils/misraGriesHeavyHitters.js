/**
 * MisraGriesHeavyHitters - Jayadev Misra & David Gries (1982) / Demaine et al. (2002)
 *
 * Deterministic streaming algorithm for frequency estimation and heavy hitters tracking.
 * Maintains at most k - 1 counters for a stream of length N.
 *
 * Key theoretical guarantees:
 * 1. For any item x, the estimated frequency satisfies: f(x) - N/k <= f_hat(x) <= f(x)
 * 2. If an item x has true frequency f(x) > N/k, it is GUARANTEED to be in the summary table (0 False Negatives).
 * 3. Space complexity is O(k), strictly independent of the vocabulary size or stream length N.
 *
 * Applicable in e-commerce for:
 * - Real-time tracking of top trending products and search keywords during Flash Sale events.
 * - Real-time detection of high-frequency fraud IPs, scraping bots, and brute-force actors.
 */

class MisraGriesHeavyHitters {
  /**
   * @param {Object} options
   * @param {number} [options.k=10] - Counter parameter k >= 2. Maintains at most k - 1 counters. Threshold is N / k.
   */
  constructor(options = {}) {
    const k = Math.max(2, Math.floor(options.k || 10));
    this.k = k;
    this.maxCounters = k - 1; // At most k - 1 counters
    this.counters = new Map(); // item -> estimated count
    this.totalItems = 0; // N: total items processed
  }

  /**
   * Process a single item in the stream
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

    // Table is full with k - 1 elements and key is not present.
    // Decrement all existing counters by w (or 1 if single step).
    // For unit weight w=1: decrement all counters by 1 and remove zeroes.
    // For general integer weight w:
    for (let step = 0; step < w; step++) {
      if (this.counters.has(key)) {
        this.counters.set(key, this.counters.get(key) + 1);
        continue;
      }
      if (this.counters.size < this.maxCounters) {
        this.counters.set(key, 1);
        continue;
      }
      // Decrement all by 1
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
   * Batch update multiple items
   * @param {Array<string|number>} items
   */
  updateBatch(items = []) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      this.update(item);
    }
  }

  /**
   * Query the estimated frequency of an item
   * @param {string|number} item
   * @returns {number} Estimated count in [f(x) - N/k, f(x)]
   */
  estimate(item) {
    if (item === undefined || item === null) return 0;
    const key = String(item);
    return this.counters.get(key) || 0;
  }

  /**
   * Get maximum error bound: N / k
   * @returns {number}
   */
  getErrorBound() {
    return this.totalItems / this.k;
  }

  /**
   * Get all Heavy Hitters exceeding threshold thresholdRatio (defaults to 1/k)
   * @param {number} [thresholdRatio] - Default 1/k
   * @returns {Array<{item: string, estimatedCount: number, lowerBound: number, frequencyRatio: number}>}
   */
  getHeavyHitters(thresholdRatio) {
    const ratio = typeof thresholdRatio === 'number' && thresholdRatio > 0 ? thresholdRatio : 1 / this.k;
    const thresholdCount = ratio * this.totalItems;
    const errBound = this.getErrorBound();
    const results = [];

    for (const [item, count] of this.counters.entries()) {
      const maxPossible = count + errBound;
      if (maxPossible >= thresholdCount || count >= thresholdCount) {
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
   * Merge another MisraGries summary of the same k
   * @param {MisraGriesHeavyHitters} other
   */
  merge(other) {
    if (!other || !(other instanceof MisraGriesHeavyHitters)) return;
    if (other.k !== this.k) {
      throw new Error(`Cannot merge MisraGries summaries with different k: ${this.k} vs ${other.k}`);
    }

    // Additive merge: combine counters then reduce if size > maxCounters
    for (const [item, count] of other.counters.entries()) {
      const current = this.counters.get(item) || 0;
      this.counters.set(item, current + count);
    }
    this.totalItems += other.totalItems;

    // Prune down to maxCounters by iterative decrements of the minimum count
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
   * Reset the sketch
   */
  reset() {
    this.counters.clear();
    this.totalItems = 0;
  }

  /**
   * Get internal state metrics
   */
  getMetrics() {
    return {
      k: this.k,
      maxCounters: this.maxCounters,
      activeCounters: this.counters.size,
      totalItems: this.totalItems,
      errorBound: this.getErrorBound(),
      counterOccupancy: Number((this.counters.size / this.maxCounters).toFixed(3))
    };
  }
}

// Dual ESM/CJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { MisraGriesHeavyHitters };
}
export { MisraGriesHeavyHitters };
