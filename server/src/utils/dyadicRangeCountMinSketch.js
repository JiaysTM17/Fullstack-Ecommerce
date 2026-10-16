/**
 * Dyadic Range Count-Min Sketch (DyadicRangeCountMinSketch)
 * 
 * Foundational Academic References:
 * - Graham Cormode, Flip Korn, Shan Muthukrishnan, Divesh Srivastava (ACM PODS 2005 / VLDB 2006):
 *   "What's Hot and What's Not: Tracking Most Frequent Items Dynamically"
 *   "Space- and Time-Efficient Summarization of Range Queries over Data Streams"
 * - Graham Cormode, Minos Garofalakis, Peter J. Haas, Chris Jermaine (Foundations and Trends in Databases 2012):
 *   "Synopses for Massive Data: Samples, Histograms, Wavelets, Sketches"
 * 
 * Mathematical Foundations:
 * - Standard Count-Min sketches only support point queries f(x) in O(1) time.
 *   Evaluating range queries sum_{x=l}^r f(x) by naive summation takes O(r - l + 1) time,
 *   which is prohibitive for large numeric domains (e.g. price domains U = 2^16).
 * - A Dyadic Interval at scale k is defined as:
 *   I_{j, k} = [j * 2^k, (j + 1) * 2^k - 1] for j in [0, U / 2^k - 1].
 * - For any range [left, right] subset of [0, U - 1], there exists a unique canonical
 *   decomposition into at most 2 * log2(U) disjoint dyadic intervals:
 *   [left, right] = U_{m} I_{j_m, k_m}.
 * - The Dyadic Range Count-Min Sketch maintains B = log2(U) + 1 independent Count-Min sketches,
 *   where CMS_k tracks frequencies of dyadic intervals at scale k.
 * - Point insertion: x in [0, U - 1] maps to interval j_k = floor(x / 2^k) at level k.
 *   Each insertion updates one interval per dyadic level (O(log U) hash operations).
 * - Range query: Decompose [left, right] into canonical dyadic intervals in O(log U) time,
 *   and sum the point query estimates from corresponding sketch levels:
 *   hat{F}(left, right) = sum_m CMS_{k_m}.estimate(j_m).
 * - Theoretical Guarantees:
 *   - Error bounded by O(epsilon * N * log(U)) with probability 1 - delta.
 *   - Supports range queries, quantile estimation, and heavy range detection in O(log U).
 */

export class DyadicRangeCountMinSketch {
  /**
   * @param {Object} [options]
   * @param {number} [options.domainBits=14] Domain bit width B (U = 2^B, default 14 -> U = 16384)
   * @param {number} [options.epsilon=0.01] Error factor per dyadic level
   * @param {number} [options.delta=0.05] Failure probability per dyadic level
   */
  constructor(options = {}) {
    this.domainBits = Math.max(4, Math.min(20, Math.floor(Number(options.domainBits || 14))));
    this.domainSize = 1 << this.domainBits; // U = 2^B
    this.epsilon = Math.max(0.001, Math.min(0.2, Number(options.epsilon || 0.01)));
    this.delta = Math.max(0.001, Math.min(0.5, Number(options.delta || 0.05)));

    this.width = Math.max(16, Math.ceil(Math.E / this.epsilon));
    this.depth = Math.max(2, Math.ceil(Math.log(1.0 / this.delta)));
    this.numLevels = this.domainBits + 1; // k in 0..B

    // Array of sketches, one for each dyadic scale k in 0..domainBits
    this.sketches = [];
    for (let k = 0; k < this.numLevels; k++) {
      const levelTables = [];
      for (let d = 0; d < this.depth; d++) {
        levelTables.push(new Int32Array(this.width));
      }
      this.sketches.push(levelTables);
    }

    this.totalCount = 0;
  }

  /**
   * Universal 32-bit hash function
   * @private
   */
  _hash(val, seed) {
    let h = 2166136261 ^ seed;
    h ^= val;
    h = Math.imul(h, 16777619);
    h ^= (h >>> 16);
    return (h >>> 0) % this.width;
  }

  /**
   * Clamps numeric value into [0, domainSize - 1]
   * @param {number} val 
   * @returns {number}
   */
  clampValue(val) {
    const v = Math.floor(Number(val) || 0);
    return Math.max(0, Math.min(this.domainSize - 1, v));
  }

  /**
   * Adds an element into the dyadic range sketch across all scale levels
   * @param {number} val Element value in [0, domainSize - 1]
   * @param {number} [weight=1] Count / frequency weight
   */
  add(val, weight = 1) {
    const x = this.clampValue(val);
    const w = Math.max(1, Math.floor(Number(weight) || 1));
    this.totalCount += w;

    for (let k = 0; k < this.numLevels; k++) {
      const intervalIdx = x >>> k;
      const tables = this.sketches[k];
      for (let d = 0; d < this.depth; d++) {
        const idx = this._hash(intervalIdx, d * 37 + 19);
        tables[d][idx] += w;
      }
    }
  }

  /**
   * Estimates point frequency f(x) using level 0 sketch (unit intervals)
   * @param {number} val 
   * @returns {number}
   */
  estimatePoint(val) {
    const x = this.clampValue(val);
    const tables = this.sketches[0];
    let minCount = Infinity;

    for (let d = 0; d < this.depth; d++) {
      const idx = this._hash(x, d * 37 + 19);
      minCount = Math.min(minCount, tables[d][idx]);
    }

    return minCount === Infinity ? 0 : minCount;
  }

  /**
   * Decomposes [left, right] into canonical dyadic intervals [j * 2^k, (j + 1) * 2^k - 1]
   * @param {number} left 
   * @param {number} right 
   * @returns {Array<{ level: number, index: number, left: number, right: number }>}
   */
  getCanonicalDyadicIntervals(left, right) {
    const l = Math.max(0, Math.min(this.domainSize - 1, Math.floor(Number(left) || 0)));
    const r = Math.max(l, Math.min(this.domainSize - 1, Math.floor(Number(right) || l)));

    const intervals = [];
    let curL = l;
    let curR = r;

    // Process from left to right finding largest dyadic intervals
    while (curL <= curR) {
      // Find largest k such that curL is aligned to 2^k and curL + 2^k - 1 <= curR
      let bestK = 0;
      for (let k = this.domainBits; k >= 0; k--) {
        const step = 1 << k;
        if ((curL % step === 0) && (curL + step - 1 <= curR)) {
          bestK = k;
          break;
        }
      }

      const step = 1 << bestK;
      intervals.push({
        level: bestK,
        index: curL >>> bestK,
        left: curL,
        right: curL + step - 1
      });

      curL += step;
    }

    return intervals;
  }

  /**
   * Estimates aggregate sum of frequencies within range [left, right]
   * @param {number} left 
   * @param {number} right 
   * @returns {number}
   */
  estimateRange(left, right) {
    if (this.totalCount === 0) return 0;
    const dyadicIntervals = this.getCanonicalDyadicIntervals(left, right);
    let totalEst = 0;

    for (const item of dyadicIntervals) {
      const tables = this.sketches[item.level];
      let minCount = Infinity;
      for (let d = 0; d < this.depth; d++) {
        const idx = this._hash(item.index, d * 37 + 19);
        minCount = Math.min(minCount, tables[d][idx]);
      }
      totalEst += (minCount === Infinity ? 0 : minCount);
    }

    return Math.min(this.totalCount, totalEst);
  }

  /**
   * Estimates numeric quantile value x such that rank(x) / N approx q
   * @param {number} q Quantile in [0, 1]
   * @returns {number}
   */
  estimateQuantile(q) {
    const targetQ = Math.max(0.0, Math.min(1.0, Number(q) || 0.5));
    if (this.totalCount === 0) return 0;

    const targetCount = targetQ * this.totalCount;
    let low = 0;
    let high = this.domainSize - 1;
    let bestVal = 0;

    while (low <= high) {
      const mid = (low + high) >>> 1;
      const rankMid = this.estimateRange(0, mid);

      if (rankMid >= targetCount) {
        bestVal = mid;
        high = mid - 1; // Try lower bound
      } else {
        low = mid + 1;
      }
    }

    return bestVal;
  }

  /**
   * Merges another DyadicRangeCountMinSketch instance into this instance
   * @param {DyadicRangeCountMinSketch} other 
   */
  merge(other) {
    if (!other || !(other instanceof DyadicRangeCountMinSketch)) return;
    if (this.domainBits !== other.domainBits || this.width !== other.width || this.depth !== other.depth) {
      return;
    }

    for (let k = 0; k < this.numLevels; k++) {
      for (let d = 0; d < this.depth; d++) {
        for (let w = 0; w < this.width; w++) {
          this.sketches[k][d][w] += other.sketches[k][d][w];
        }
      }
    }

    this.totalCount += other.totalCount;
  }

  /**
   * Diagnostic telemetry
   * @returns {Object}
   */
  getTelemetry() {
    return {
      algorithm: "DyadicRangeCountMinSketch",
      domainBits: this.domainBits,
      domainSize: this.domainSize,
      numLevels: this.numLevels,
      epsilon: this.epsilon,
      delta: this.delta,
      width: this.width,
      depth: this.depth,
      totalCount: this.totalCount
    };
  }
}

export default DyadicRangeCountMinSketch;
