/**
 * Lossy Counting Frequency Moments & Item Frequency Estimation
 * 
 * Based on foundational research:
 * - Gurmeet Singh Manku, Rajeev Motwani (VLDB 2002):
 *   "Approximate Frequency Counts over Data Streams"
 * - Graham Cormode, S. Muthukrishnan (2005):
 *   "Summarizing and Mining Inverse Distributions on Data Streams"
 * 
 * Mathematical Foundations:
 * - In high-velocity E-Commerce streams (e.g. flash sale clicks, search queries, brand affinity signals),
 *   storing exact frequencies of all items requires O(distinct items) memory.
 * - Lossy Counting divides the stream into buckets of width w = ceil(1 / epsilon).
 *   Bucket identifier b_current = ceil(N / w).
 * - Internal Entry: (item, frequency f, maximum error delta)
 * - Invariant:
 *   For every entry (item, f, delta):
 *     f <= actual_frequency <= f + delta
 *   where delta <= b_current - 1 <= epsilon * N.
 * - Pruning Rule:
 *   At bucket boundaries (N % w == 0), any item with f + delta <= b_current is evicted.
 * - Guarantees:
 *   1. All items with frequency >= s * N (support threshold) are guaranteed to be output (0 false negatives).
 *   2. No item with frequency < (s - epsilon) * N is ever output.
 *   3. Space complexity bounded by O((1 / epsilon) * log(epsilon * N)).
 */

export class LossyCountingFrequencyMoments {
  /**
   * @param {Object} options
   * @param {number} [options.epsilon=0.01] Error parameter (0 < epsilon < 1.0)
   * @param {number} [options.support=0.05] Minimum support threshold for heavy hitters
   */
  constructor(options = {}) {
    this.epsilon = Math.max(0.001, Math.min(0.2, Number(options.epsilon || 0.01)));
    this.support = Math.max(this.epsilon, Math.min(0.5, Number(options.support || 0.05)));
    this.bucketWidth = Math.max(5, Math.ceil(1.0 / this.epsilon));

    // Internal table: Map<item, { f: number, delta: number }>
    this.entries = new Map();
    this.totalProcessed = 0;
    this.currentBucket = 1;
    this.prunesCount = 0;
  }

  /**
   * Updates stream with a single element
   * @param {string|number} item 
   * @param {number} [count=1] 
   */
  add(item, count = 1) {
    if (item === undefined || item === null) return;
    const key = String(item).trim();
    if (!key) return;

    const kCount = Math.max(1, Math.floor(Number(count) || 1));

    for (let c = 0; c < kCount; c++) {
      this.totalProcessed++;
      this.currentBucket = Math.ceil(this.totalProcessed / this.bucketWidth);

      const existing = this.entries.get(key);
      if (existing) {
        existing.f++;
      } else {
        this.entries.set(key, { f: 1, delta: this.currentBucket - 1 });
      }

      // Check bucket boundary
      if (this.totalProcessed % this.bucketWidth === 0) {
        this._prune();
      }
    }
  }

  /**
   * Batch update multiple items
   * @param {Array<string|number>} items 
   */
  addAll(items) {
    if (!Array.isArray(items)) return;
    for (let i = 0; i < items.length; i++) {
      this.add(items[i]);
    }
  }

  /**
   * Prunes entries satisfying f + delta <= currentBucket
   * @private
   */
  _prune() {
    this.prunesCount++;
    for (const [key, entry] of this.entries.entries()) {
      if (entry.f + entry.delta <= this.currentBucket) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Estimates frequency of an item
   * @param {string|number} item 
   * @returns {{ estimatedFreq: number, lowerBound: number, upperBound: number, errorBound: number }}
   */
  query(item) {
    const key = String(item || '').trim();
    const entry = this.entries.get(key);
    if (!entry) {
      // If not stored, actual frequency is <= currentBucket <= epsilon * N
      const maxPossible = Math.floor(this.epsilon * this.totalProcessed);
      return {
        estimatedFreq: 0,
        lowerBound: 0,
        upperBound: maxPossible,
        errorBound: maxPossible
      };
    }

    return {
      estimatedFreq: entry.f,
      lowerBound: entry.f,
      upperBound: entry.f + entry.delta,
      errorBound: entry.delta
    };
  }

  /**
   * Retrieves frequent items (heavy hitters) exceeding support threshold s * N
   * @param {number} [customSupport=this.support]
   * @returns {Array<{ item: string, frequency: number, supportPct: number, delta: number }>}
   */
  getHeavyHitters(customSupport = this.support) {
    const s = Math.max(this.epsilon, Math.min(1.0, Number(customSupport) || this.support));
    const threshold = s * this.totalProcessed;
    const results = [];

    for (const [item, entry] of this.entries.entries()) {
      if (entry.f >= (threshold - this.epsilon * this.totalProcessed)) {
        const supportPct = this.totalProcessed > 0 ? Number(((entry.f / this.totalProcessed) * 100).toFixed(2)) : 0;
        results.push({
          item,
          frequency: entry.f,
          supportPct,
          delta: entry.delta
        });
      }
    }

    return results.sort((a, b) => b.frequency - a.frequency);
  }

  /**
   * Computes approximate F2 frequency moment: sum_i (f_i^2)
   * @returns {number}
   */
  estimateSecondMoment() {
    let f2 = 0;
    for (const entry of this.entries.values()) {
      f2 += entry.f * entry.f;
    }
    return f2;
  }

  /**
   * Returns memory and efficiency telemetry
   * @returns {Object}
   */
  getTelemetry() {
    return {
      epsilon: this.epsilon,
      support: this.support,
      bucketWidth: this.bucketWidth,
      totalProcessed: this.totalProcessed,
      currentBucket: this.currentBucket,
      activeEntriesCount: this.entries.size,
      prunesCount: this.prunesCount,
      estimatedF2Moment: this.estimateSecondMoment(),
      heavyHittersCount: this.getHeavyHitters().length
    };
  }
}

export default LossyCountingFrequencyMoments;
