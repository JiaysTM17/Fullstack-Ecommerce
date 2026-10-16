/**
 * Dyadic Range Count-Sketch (DyadicRangeCountSketch)
 * 
 * Theoretical Foundations:
 * - Graham Cormode, Flip Korn, Shan Muthukrishnan, Divesh Srivastava (ACM PODS 2005 / VLDB 2006)
 *   "What's New: Computing Range Aggregates with dyadic trees and sublinear space"
 * - Moses Charikar, Kevin Chen, Martin Farach-Colton (ICALP 2002) - Count-Sketch with Rademacher hash signs
 * 
 * Mathematical Formulation:
 * 1. Canonical Dyadic Intervals:
 *    Any integer range [l, r] in universe [0, U-1] decomposes uniquely into at most 2 * log2(U) canonical dyadic intervals:
 *      I_{j, k} = [j * 2^k, (j + 1) * 2^k - 1]
 * 2. Multi-Scale Unbiased Count-Sketch:
 *    For each dyadic scale k in [0, log2(U)], maintain a Count-Sketch of depth d and width w.
 *    For an event at key x with weight w_x:
 *      At scale k, prefix = floor(x / 2^k)
 *      Table_k[r][h_{k,r}(prefix)] += s_{k,r}(prefix) * w_x
 *    Unbiased expectation: E[\hat{f}_k(prefix)] = f_k(prefix)
 * 3. Range Query:
 *    \hat{f}([l, r]) = \sum_{I_{j, k} \in Decomp([l, r])} \hat{f}_k(j)
 *    E[\hat{f}([l, r])] = f([l, r])
 * 4. Quantile Binary Search:
 *    Find smallest x such that \hat{f}([0, x]) >= q * N in O(log^2 U) time.
 */

export class DyadicRangeCountSketch {
  /**
   * @param {Object} [options]
   * @param {number} [options.universeSize=65536] Domain universe size U (must be power of 2)
   * @param {number} [options.depth=5] Number of hash tables per dyadic level (odd number)
   * @param {number} [options.width=128] Number of buckets per table
   */
  constructor(options = {}) {
    this.universeSize = Math.max(16, Number(options.universeSize || 65536));
    this.numLevels = Math.ceil(Math.log2(this.universeSize)) + 1; // k = 0..log2(U)
    this.depth = Math.max(3, Number(options.depth || 5));
    if (this.depth % 2 === 0) this.depth++; // Ensure odd depth for median
    this.width = Math.max(16, Number(options.width || 128));

    // Multi-scale sketch tables: sketches[k][d][w]
    this.sketches = [];
    for (let k = 0; k < this.numLevels; k++) {
      const levelTables = [];
      for (let d = 0; d < this.depth; d++) {
        levelTables.push(new Float64Array(this.width));
      }
      this.sketches.push(levelTables);
    }

    this.totalCount = 0;
  }

  /**
   * Hash bucket index
   * @private
   */
  _hash(val, k, d) {
    let h = (2166136261 ^ (k * 1009) ^ (d * 37)) >>> 0;
    const v = Number(val);
    h ^= (v & 0xffff);
    h = Math.imul(h, 16777619);
    h ^= ((v >>> 16) & 0xffff);
    h = Math.imul(h, 16777619);
    h ^= (h >>> 16);
    return (h >>> 0) % this.width;
  }

  /**
   * Rademacher random sign hash {-1, +1}
   * @private
   */
  _sign(val, k, d) {
    let h = (1315423911 ^ (k * 2003) ^ (d * 59)) >>> 0;
    const v = Number(val);
    h ^= (h << 5) + (v & 0xffff) + (h >> 2);
    h ^= (h << 5) + ((v >>> 16) & 0xffff) + (h >> 2);
    return (h & 1) === 0 ? 1.0 : -1.0;
  }

  /**
   * Inserts an event at universe key x with weight w
   * @param {number} x Key in [0, U-1]
   * @param {number} [weight=1] 
   */
  update(x, weight = 1) {
    const key = Math.max(0, Math.min(this.universeSize - 1, Math.floor(Number(x) || 0)));
    const w = Number(weight) || 1;
    this.totalCount += w;

    for (let k = 0; k < this.numLevels; k++) {
      const prefix = key >>> k; // j = floor(key / 2^k)
      const tables = this.sketches[k];
      for (let d = 0; d < this.depth; d++) {
        const bucket = this._hash(prefix, k, d);
        const sign = this._sign(prefix, k, d);
        tables[d][bucket] += sign * w;
      }
    }
  }

  /**
   * Estimates frequency of canonical dyadic interval I_{j, k}
   * @param {number} prefix j
   * @param {number} k Scale level
   * @returns {number}
   */
  estimateDyadic(prefix, k) {
    if (k < 0 || k >= this.numLevels) return 0;
    const tables = this.sketches[k];
    const estimates = new Float64Array(this.depth);

    for (let d = 0; d < this.depth; d++) {
      const bucket = this._hash(prefix, k, d);
      const sign = this._sign(prefix, k, d);
      estimates[d] = sign * tables[d][bucket];
    }

    estimates.sort();
    const medianVal = estimates[Math.floor(this.depth / 2)];
    return medianVal;
  }

  /**
   * Estimates point frequency at single key x (scale k = 0)
   * @param {number} x 
   * @returns {number}
   */
  estimatePoint(x) {
    const key = Math.max(0, Math.min(this.universeSize - 1, Math.floor(Number(x) || 0)));
    return Math.max(0, Math.round(this.estimateDyadic(key, 0)));
  }

  /**
   * Decomposes [l, r] into canonical dyadic intervals
   * @param {number} l 
   * @param {number} r 
   * @returns {Array<{ prefix: number, k: number, low: number, high: number }>}
   */
  decomposeRange(l, r) {
    const left = Math.max(0, Math.min(this.universeSize - 1, Math.floor(Number(l) || 0)));
    const right = Math.max(left, Math.min(this.universeSize - 1, Math.floor(Number(r) || left)));

    const intervals = [];
    let curL = left;
    let curR = right;

    while (curL <= curR) {
      // Find largest power of 2 that divides curL and does not exceed curR
      let k = 0;
      while ((curL % (1 << (k + 1)) === 0) && (curL + (1 << (k + 1)) - 1 <= curR) && (k + 1 < this.numLevels)) {
        k++;
      }

      const length = 1 << k;
      const prefix = curL >>> k;
      intervals.push({
        prefix,
        k,
        low: curL,
        high: curL + length - 1
      });

      curL += length;
    }

    return intervals;
  }

  /**
   * Range aggregate query \hat{f}([l, r]) in O(log U) time
   * @param {number} l Lower price / index
   * @param {number} r Upper price / index
   * @returns {number}
   */
  queryRange(l, r) {
    const intervals = this.decomposeRange(l, r);
    let sum = 0;
    for (let i = 0; i < intervals.length; i++) {
      const { prefix, k } = intervals[i];
      sum += this.estimateDyadic(prefix, k);
    }
    return Math.max(0, Math.round(sum));
  }

  /**
   * Finds approximate quantile element x such that \hat{f}([0, x]) >= q * totalCount
   * @param {number} q Quantile in (0, 1]
   * @returns {number}
   */
  queryQuantile(q = 0.5) {
    if (this.totalCount <= 0) return 0;
    const target = Math.max(1, Math.min(this.totalCount, this.totalCount * Number(q)));

    let low = 0;
    let high = this.universeSize - 1;
    let ans = high;

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      const countToMid = this.queryRange(0, mid);
      if (countToMid >= target) {
        ans = mid;
        high = mid - 1;
      } else {
        low = mid + 1;
      }
    }

    return ans;
  }

  /**
   * Merges another DyadicRangeCountSketch
   * @param {DyadicRangeCountSketch} other 
   */
  merge(other) {
    if (!other) return this;
    if (this.universeSize !== other.universeSize || this.numLevels !== other.numLevels ||
        this.depth !== other.depth || this.width !== other.width) {
      return this;
    }

    for (let k = 0; k < this.numLevels; k++) {
      for (let d = 0; d < this.depth; d++) {
        for (let w = 0; w < this.width; w++) {
          this.sketches[k][d][w] += other.sketches[k][d][w];
        }
      }
    }

    this.totalCount += other.totalCount;
    return this;
  }

  /**
   * Diagnostic telemetry
   * @returns {Object}
   */
  getTelemetry() {
    return {
      algorithm: "DyadicRangeCountSketch",
      universeSize: this.universeSize,
      numLevels: this.numLevels,
      depth: this.depth,
      width: this.width,
      totalCount: this.totalCount
    };
  }
}

export default DyadicRangeCountSketch;
