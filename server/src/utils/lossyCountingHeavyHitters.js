/**
 * LossyCountingHeavyHitters - Lossy Counting Algorithm for Streaming Heavy Hitters & Approximate Frequencies
 * Reference:
 * - Rajeev Motwani & Gurmeet Singh Manku (VLDB 2002 / ACM TODS 2012),
 *   "Approximate Frequency Counts over Data Streams"
 * 
 * Features:
 * - Deterministic streaming algorithm with provable error bounds.
 * - Given error parameter epsilon and support threshold s (with s > epsilon):
 *   1. Guarantees no false negatives: all items with true frequency >= s * N are output.
 *   2. Guarantees error bounds: f_e - epsilon * N <= \hat{f}_e <= f_e.
 *   3. Guarantees no item with true frequency < (s - epsilon) * N is output.
 * - Space complexity: O(1/epsilon * log(epsilon * N)) entries.
 * - Operates in buckets of width w = ceil(1/epsilon).
 */

class LossyCountingHeavyHitters {
  /**
   * @param {Object} options
   * @param {number} [options.epsilon=0.01] - Maximum frequency approximation error fraction (default 1%)
   * @param {number} [options.supportThreshold=0.05] - Frequency threshold fraction for heavy hitters (default 5%)
   */
  constructor(options = {}) {
    this.epsilon = Math.max(0.0001, Math.min(0.2, options.epsilon !== undefined ? options.epsilon : 0.01));
    this.supportThreshold = Math.max(this.epsilon, Math.min(0.99, options.supportThreshold !== undefined ? options.supportThreshold : 0.05));
    this.bucketWidth = Math.ceil(1.0 / this.epsilon);

    // Map: itemKey -> { frequency: number, delta: number }
    // delta represents the maximum possible error (bucket index in which item entered)
    this.entries = new Map();
    this.totalStreamCount = 0;
    this.currentBucket = 1;
  }

  get entryCount() {
    return this.entries.size;
  }

  get maxErrorBound() {
    return Math.floor(this.epsilon * this.totalStreamCount);
  }

  /**
   * Update stream with item key and count
   * @param {string|number} item - Unique item identifier
   * @param {number} [count=1] - Frequency increment
   */
  update(item, count = 1) {
    const key = String(item);
    const c = Math.max(1, Math.round(Number(count) || 1));

    for (let k = 0; k < c; k++) {
      this.totalStreamCount += 1;
      this.currentBucket = Math.ceil(this.totalStreamCount / this.bucketWidth);

      if (this.entries.has(key)) {
        const entry = this.entries.get(key);
        entry.frequency += 1;
      } else {
        this.entries.set(key, {
          frequency: 1,
          delta: this.currentBucket - 1
        });
      }

      // Check bucket boundary for periodic pruning
      if (this.totalStreamCount % this.bucketWidth === 0) {
        this._prune(this.currentBucket);
      }
    }
  }

  /**
   * Batch update multiple items
   * @param {Array<string|number|Object>} items
   */
  updateBatch(items = []) {
    for (const it of items) {
      if (typeof it === 'object' && it !== null && it.item !== undefined) {
        this.update(it.item, it.count || 1);
      } else {
        this.update(it, 1);
      }
    }
  }

  /**
   * Prune stale entries whose maximum possible frequency is <= currentBucket
   * @param {number} bucketId
   * @private
   */
  _prune(bucketId) {
    for (const [key, entry] of this.entries.entries()) {
      if (entry.frequency + entry.delta <= bucketId) {
        this.entries.delete(key);
      }
    }
  }

  /**
   * Query estimated frequency of an item
   * @param {string|number} item
   * @returns {{ frequency: number, delta: number, minFrequency: number, maxFrequency: number }}
   */
  getFrequency(item) {
    const key = String(item);
    if (!this.entries.has(key)) {
      return {
        frequency: 0,
        delta: 0,
        minFrequency: 0,
        maxFrequency: this.maxErrorBound
      };
    }

    const entry = this.entries.get(key);
    return {
      frequency: entry.frequency,
      delta: entry.delta,
      minFrequency: entry.frequency,
      maxFrequency: entry.frequency + entry.delta
    };
  }

  /**
   * Retrieve all heavy hitters exceeding support threshold
   * @param {number} [customSupport=this.supportThreshold] - Custom support fraction
   * @returns {Array<Object>} List of heavy hitters with frequency and percentage
   */
  getHeavyHitters(customSupport = this.supportThreshold) {
    const support = Math.max(this.epsilon, customSupport);
    const threshold = (support - this.epsilon) * this.totalStreamCount;
    const results = [];

    for (const [key, entry] of this.entries.entries()) {
      if (entry.frequency >= threshold) {
        const estimatedShare = this.totalStreamCount > 0
          ? Number(((entry.frequency / this.totalStreamCount) * 100).toFixed(2))
          : 0.0;
        results.push({
          item: key,
          estimatedFrequency: entry.frequency,
          maxError: entry.delta,
          estimatedSharePercent: estimatedShare,
          guaranteedMinFrequency: entry.frequency,
          guaranteedMaxFrequency: entry.frequency + entry.delta
        });
      }
    }

    results.sort((a, b) => b.estimatedFrequency - a.estimatedFrequency);
    return results;
  }

  /**
   * Merge another LossyCountingHeavyHitters into this instance
   * @param {LossyCountingHeavyHitters} other
   */
  merge(other) {
    if (!(other instanceof LossyCountingHeavyHitters)) {
      throw new Error("Target must be an instance of LossyCountingHeavyHitters");
    }

    for (const [key, entry] of other.entries.entries()) {
      if (this.entries.has(key)) {
        const cur = this.entries.get(key);
        cur.frequency += entry.frequency;
        cur.delta = Math.max(cur.delta, entry.delta);
      } else {
        this.entries.set(key, {
          frequency: entry.frequency,
          delta: entry.delta
        });
      }
    }

    this.totalStreamCount += other.totalStreamCount;
    this.currentBucket = Math.max(this.currentBucket, other.currentBucket);
    this._prune(this.currentBucket);
    return this;
  }

  /**
   * Reset instance
   */
  reset() {
    this.entries.clear();
    this.totalStreamCount = 0;
    this.currentBucket = 1;
  }

  /**
   * Diagnostic summary
   */
  getSummary() {
    return {
      epsilon: this.epsilon,
      supportThreshold: this.supportThreshold,
      bucketWidth: this.bucketWidth,
      currentBucket: this.currentBucket,
      totalStreamCount: this.totalStreamCount,
      uniqueEntriesCount: this.entries.size,
      maxTheoreticalError: this.maxErrorBound
    };
  }
}

export { LossyCountingHeavyHitters };
export default LossyCountingHeavyHitters;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LossyCountingHeavyHitters };
  }
} catch (e) {}
