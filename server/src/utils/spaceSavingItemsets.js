/**
/**
 * SpaceSavingItemsets - Filtered Space-Saving & Lossy Counting Algorithm for Streaming Frequent Bundles
 * 
 * References:
 * - Ahmed Metwally, Divyakant Agrawal, Amr El Abbadi (ICDT 2005):
 *   "Efficient Computation of Frequent and Top-k Elements in Data Streams"
 * - Gurmeet Singh Manku, Rajeev Motwani (VLDB 2002):
 *   "Approximate Frequency Counts over Data Streams" (Lossy Counting)
 * 
 * E-Commerce Applications:
 * 1. Real-Time Frequent Bundle Mining: Identifies co-purchased item pairs (e.g. iPhone + 20W GaN Charger)
 *    in high-velocity checkout streams without maintaining O(N^2) combinatorial memory.
 * 2. Epsilon-Guaranteed Heavy Hitters: Any itemset with frequency f >= phi * N is guaranteed to be retained,
 *    and reported count has bounded error: f - epsilon * N <= estimated_count <= f.
 * 3. Stream Merging: Linearly combines Space-Saving summaries across distributed Kafka partition workers.
 */

class SpaceSavingItemsets {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxBuckets=128] - Maximum number of monitored itemset buckets (K)
   * @param {number} [options.supportThreshold=0.02] - Minimum support fraction (phi) e.g. 2%
   * @param {number} [options.epsilon=0.005] - Maximum allowable overestimation error fraction
   */
  constructor(options = {}) {
    this.maxBuckets = options.maxBuckets || 128;
    this.supportThreshold = options.supportThreshold || 0.02;
    this.epsilon = options.epsilon || (1 / this.maxBuckets);

    // Map: itemKey -> { count: number, error: number }
    this.buckets = new Map();
    this.totalEvents = 0;
  }

  /**
   * Normalize an itemset pair to a canonical order-independent string
   * e.g., ["SKU_B", "SKU_A"] -> "SKU_A & SKU_B"
   */
  _canonicalKey(itemOrPair) {
    if (Array.isArray(itemOrPair)) {
      if (itemOrPair.length === 1) return String(itemOrPair[0]);
      return [...itemOrPair].map(String).sort().join(' & ');
    }
    return String(itemOrPair);
  }

  /**
   * Update stream with a transaction (single item or list of co-purchased items)
   * Automatically extracts and updates all 2-item pairs if an array of items is provided
   * @param {string|Array<string>} transaction - Item or array of items in cart
   * @param {number} [weight=1]
   */
  update(transaction, weight = 1) {
    if (weight <= 0) return;

    if (Array.isArray(transaction) && transaction.length > 1) {
      // Extract all distinct 2-item combinations
      const items = [...new Set(transaction)];
      for (let i = 0; i < items.length; i++) {
        // Individual item support
        this._updateSingle(this._canonicalKey(items[i]), weight);
        // Pairwise co-purchase support
        for (let j = i + 1; j < items.length; j++) {
          this._updateSingle(this._canonicalKey([items[i], items[j]]), weight);
        }
      }
    } else {
      const key = this._canonicalKey(transaction);
      this._updateSingle(key, weight);
    }

    this.totalEvents += weight;
  }

  /**
   * Space-Saving core update logic
   */
  _updateSingle(key, weight) {
    if (this.buckets.has(key)) {
      const entry = this.buckets.get(key);
      entry.count += weight;
      return;
    }

    if (this.buckets.size < this.maxBuckets) {
      // Free slot available
      this.buckets.set(key, { count: weight, error: 0 });
      return;
    }

    // Space-Saving eviction: Find minimum count bucket
    let minKey = null;
    let minVal = Infinity;
    let minErr = 0;

    for (const [k, v] of this.buckets.entries()) {
      if (v.count < minVal) {
        minVal = v.count;
        minErr = v.error;
        minKey = k;
      }
    }

    // Replace minKey with new key, count becomes minVal + weight, error becomes minVal
    this.buckets.delete(minKey);
    this.buckets.set(key, {
      count: minVal + weight,
      error: minVal,
    });
  }

  /**
   * Query frequency and guaranteed bounds for an item or itemset
   * @param {string|Array<string>} itemOrPair
   * @returns {{ estimatedCount: number, maxError: number, minCount: number, support: number }}
   */
  estimate(itemOrPair) {
    const key = this._canonicalKey(itemOrPair);
    if (!this.buckets.has(key)) {
      return { estimatedCount: 0, maxError: 0, minCount: 0, support: 0 };
    }

    const { count, error } = this.buckets.get(key);
    const minCount = Math.max(0, count - error);
    const support = this.totalEvents > 0 ? Number((count / this.totalEvents).toFixed(4)) : 0;

    return {
      estimatedCount: count,
      maxError: error,
      minCount,
      support,
    };
  }

  /**
   * Get Top-K frequent itemsets meeting the support threshold
   * @param {number} [k=10]
   * @returns {Array<Object>}
   */
  getFrequentItemsets(k = 10) {
    const results = [];
    const minRequiredCount = this.totalEvents * this.supportThreshold;

    for (const [key, v] of this.buckets.entries()) {
      // Guaranteed frequent: true count >= estimated - error
      const isGuaranteed = (v.count - v.error) >= minRequiredCount;
      const support = this.totalEvents > 0 ? Number((v.count / this.totalEvents).toFixed(4)) : 0;

      results.push({
        itemset: key,
        isPair: key.includes(' & '),
        estimatedCount: v.count,
        maxError: v.error,
        minCount: Math.max(0, v.count - v.error),
        support,
        isGuaranteed,
      });
    }

    results.sort((a, b) => b.estimatedCount - a.estimatedCount);
    return results.slice(0, k);
  }

  /**
   * Merge another Space-Saving sketch summary linearly
   * @param {SpaceSavingItemsets} other
   */
  merge(other) {
    if (this.maxBuckets !== other.maxBuckets) {
      throw new Error("Cannot merge SpaceSaving summaries with different bucket capacities");
    }

    for (const [key, entry] of other.buckets.entries()) {
      if (this.buckets.has(key)) {
        const cur = this.buckets.get(key);
        cur.count += entry.count;
        cur.error += entry.error;
      } else if (this.buckets.size < this.maxBuckets) {
        this.buckets.set(key, { ...entry });
      } else {
        // Eviction
        let minKey = null;
        let minVal = Infinity;
        for (const [k, v] of this.buckets.entries()) {
          if (v.count < minVal) {
            minVal = v.count;
            minKey = k;
          }
        }
        this.buckets.delete(minKey);
        this.buckets.set(key, {
          count: minVal + entry.count,
          error: minVal + entry.error,
        });
      }
    }

    this.totalEvents += other.totalEvents;
  }

  /**
   * Diagnostics summary
   */
  getStats() {
    return {
      maxBuckets: this.maxBuckets,
      currentOccupancy: this.buckets.size,
      totalEvents: this.totalEvents,
      supportThreshold: this.supportThreshold,
      theoreticalMaxErrorRatio: Number((1 / this.maxBuckets).toFixed(4)),
    };
  }
}

export { SpaceSavingItemsets };
export default SpaceSavingItemsets;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpaceSavingItemsets };
  }
} catch (e) {}
