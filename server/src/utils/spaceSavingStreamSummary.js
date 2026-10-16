/**
 * Space-Saving StreamSummary Algorithm for Frequent Items & Heavy Hitters
 * 
 * Based on foundational research:
 * - Ahmed Metwally, Divyakant Agrawal, Amr El Abbadi (ICDT 2005 / ACM TODS 2006):
 *   "Efficient Computation of Frequent and Top-k Elements in Data Streams"
 * - Graham Cormode, M. Hadjieleftheriou (VLDB 2008 / 2010):
 *   "Methods for Finding Frequent Items in Data Streams"
 * 
 * Mathematical Foundations:
 * - In high-velocity E-Commerce stream telemetry (flash sale clicks, live cart additions, SKU views),
 *   identifying heavy hitters with bounded memory and provable error bounds is paramount.
 * - Space-Saving maintains exactly m = ceil(1 / epsilon) monitored counters (StreamSummary).
 * - For each monitored item i, it tracks:
 *     - count c_i: Upper bound on the item's true frequency
 *     - error epsilon_i: Maximum possible overestimation error
 * - Invariant:
 *   For every monitored item i:
 *     c_i - epsilon_i <= actual_frequency f_i <= c_i
 *   with epsilon_i <= min_{j} c_j <= (N / m) <= epsilon * N.
 * - Insertion Rule:
 *   1. If item x is already monitored:
 *      c_x <- c_x + weight
 *   2. If item x is not monitored and total monitored < m:
 *      Add (x, count = weight, error = 0)
 *   3. If item x is not monitored and table is full (size == m):
 *      Find item e_min with minimum count c_min.
 *      Evict e_min and assign slot to x with:
 *      c_x <- c_min + weight
 *      epsilon_x <- c_min
 * - Guarantees:
 *   - 0 False Negatives: Any item with true frequency f_i >= support * N is guaranteed to be in the summary.
 *   - Maximum frequency overestimation error is bounded by epsilon * N.
 *   - Memory complexity is strictly O(m) = O(1 / epsilon).
 */

export class SpaceSavingStreamSummary {
  /**
   * @param {Object} [options]
   * @param {number} [options.epsilon=0.02] Error tolerance parameter (0 < epsilon < 1.0)
   * @param {number} [options.maxItems=50] Maximum number of monitored counters m = ceil(1 / epsilon)
   * @param {number} [options.support=0.05] Minimum support threshold for heavy hitters (s >= epsilon)
   */
  constructor(options = {}) {
    this.epsilon = Math.max(0.001, Math.min(0.2, Number(options.epsilon || 0.02)));
    this.maxItems = Math.max(2, options.maxItems ? Math.floor(options.maxItems) : Math.ceil(1.0 / this.epsilon));
    this.support = Math.max(this.epsilon, Math.min(0.5, Number(options.support || 0.05)));

    // Map<item, { count: number, error: number }>
    this.counters = new Map();
    this.totalProcessed = 0;
    this.evictionsCount = 0;
  }

  /**
   * Processes a single streaming item
   * @param {string|number} item 
   * @param {number} [weight=1] 
   */
  add(item, weight = 1) {
    if (item === undefined || item === null) return;
    const key = String(item).trim();
    if (!key) return;

    const w = Math.max(1, Math.floor(Number(weight) || 1));
    this.totalProcessed += w;

    if (this.counters.has(key)) {
      const entry = this.counters.get(key);
      entry.count += w;
      return;
    }

    if (this.counters.size < this.maxItems) {
      this.counters.set(key, { count: w, error: 0 });
      return;
    }

    // Table is full: Evict element with minimum count
    let minKey = null;
    let minCount = Infinity;

    for (const [k, entry] of this.counters.entries()) {
      if (entry.count < minCount) {
        minCount = entry.count;
        minKey = k;
      }
    }

    if (minKey !== null) {
      this.counters.delete(minKey);
      this.counters.set(key, {
        count: minCount + w,
        error: minCount
      });
      this.evictionsCount++;
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
   * Queries item frequency with theoretical bounds
   * @param {string|number} item 
   * @returns {{ count: number, error: number, lowerBound: number, upperBound: number, isMonitored: boolean }}
   */
  query(item) {
    const key = String(item || "").trim();
    const entry = this.counters.get(key);

    if (entry) {
      return {
        count: entry.count,
        error: entry.error,
        lowerBound: Math.max(0, entry.count - entry.error),
        upperBound: entry.count,
        isMonitored: true
      };
    }

    // Unmonitored item: frequency cannot exceed current minimum count in table
    let minCount = 0;
    if (this.counters.size >= this.maxItems) {
      minCount = Math.min(...Array.from(this.counters.values()).map(e => e.count));
    }

    return {
      count: 0,
      error: minCount,
      lowerBound: 0,
      upperBound: minCount,
      isMonitored: false
    };
  }

  /**
   * Retrieves frequent items exceeding support threshold s * N
   * @param {number} [customSupport=this.support]
   * @returns {Array<{ item: string, count: number, error: number, minFrequency: number, supportPct: number }>}
   */
  getHeavyHitters(customSupport = this.support) {
    const s = Math.max(this.epsilon, Math.min(1.0, Number(customSupport) || this.support));
    const threshold = s * this.totalProcessed;
    const results = [];

    for (const [item, entry] of this.counters.entries()) {
      const minFreq = entry.count - entry.error;
      // An item is guaranteed frequent if count >= threshold
      if (entry.count >= threshold) {
        const supportPct = this.totalProcessed > 0 ? Number(((entry.count / this.totalProcessed) * 100).toFixed(2)) : 0;
        results.push({
          item,
          count: entry.count,
          error: entry.error,
          minFrequency: Math.max(0, minFreq),
          supportPct
        });
      }
    }

    return results.sort((a, b) => b.count - a.count);
  }

  /**
   * Merges another SpaceSaving summary into this instance
   * @param {SpaceSavingStreamSummary} other 
   */
  merge(other) {
    if (!other || !(other instanceof SpaceSavingStreamSummary)) return;

    for (const [item, entry] of other.counters.entries()) {
      this.add(item, entry.count);
    }
  }

  /**
   * Returns memory and efficiency telemetry
   * @returns {Object}
   */
  getTelemetry() {
    return {
      epsilon: this.epsilon,
      maxItems: this.maxItems,
      support: this.support,
      activeCountersCount: this.counters.size,
      totalProcessed: this.totalProcessed,
      evictionsCount: this.evictionsCount,
      heavyHittersCount: this.getHeavyHitters().length
    };
  }
}

export default SpaceSavingStreamSummary;
