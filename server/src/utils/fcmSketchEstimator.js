/**
 * FCMSketchEstimator - Fast Count-Min Sketch with Conservative Update & Dyadic Range Trees
 * 
 * References:
 * - Graham Cormode & S. Muthukrishnan (2005): "An Improved Data Stream Summary: The Count-Min Sketch and its Applications"
 * - Amit Goyal, Hal Daumé III, Graham Cormode (2012): "Sketch Algorithms for Estimating Point Queries in NLP and Web Streams"
 * 
 * Core Features:
 * 1. Conservative Update (CU): Only increments the counters whose current value equals the minimum counter value across all d hash buckets.
 *    Reduces overestimation error by up to 70% compared to standard Count-Min Sketch.
 * 2. Dyadic Range Trees: Decomposes range queries [L, R] into O(d * log(U)) canonical dyadic intervals [k * 2^j, (k+1) * 2^j - 1],
 *    enabling fast range sum estimation for Flash Sale price brackets and hourly order frequency.
 * 3. Heavy Hitters Tracking: Self-balancing Min-Heap tracking top-K frequent keys with frequency lower bounds.
 * 4. Mergeable Summaries: Merges sketches of identical dimensions while maintaining Conservative Update consistency.
 */

class FCMSketchEstimator {
  /**
   * @param {Object} options
   * @param {number} [options.width=1024] - Number of buckets per row (w = ceil(e / epsilon))
   * @param {number} [options.depth=5] - Number of hash rows (d = ceil(ln(1 / delta)))
   * @param {number} [options.dyadicLevels=10] - Number of dyadic range levels (U = 2^levels)
   * @param {number} [options.heavyHitterCapacity=50] - Maximum heavy hitters in Min-Heap
   */
  constructor(options = {}) {
    this.width = options.width || 1024;
    this.depth = options.depth || 5;
    this.dyadicLevels = options.dyadicLevels || 10; // Max domain range = 2^10 = 1024
    this.heavyHitterCapacity = options.heavyHitterCapacity || 50;

    // Allocate 2D matrix for primary point queries
    this.table = Array.from({ length: this.depth }, () => new Float64Array(this.width));

    // Dyadic Range tables: table[level][row][bucket]
    this.dyadicTables = Array.from({ length: this.dyadicLevels + 1 }, () =>
      Array.from({ length: this.depth }, () => new Float64Array(this.width))
    );

    // Universal hash coefficients: h_i(x) = (a_i * x + b_i) mod P mod w
    this.prime = 2147483647; // 2^31 - 1
    this.hashParams = [];
    for (let i = 0; i < this.depth; i++) {
      this.hashParams.push({
        a: 1 + Math.floor(Math.sin(i + 1) * 100000) % 2147483640 + 10007,
        b: Math.floor(Math.cos(i + 1) * 100000) % 2147483640 + 20011,
      });
    }

    // Heavy hitters Min-Heap: array of { key, count }
    this.heavyHitters = [];
    this.heavyHitterMap = new Map();
    this.totalItemCount = 0;
  }

  /**
   * Fast integer/string hash
   * @param {string|number} key
   * @param {number} row
   * @returns {number}
   */
  _hash(key, row) {
    let num = 0;
    if (typeof key === 'number') {
      num = key >>> 0;
    } else {
      const str = String(key);
      for (let i = 0; i < str.length; i++) {
        num = (num * 31 + str.charCodeAt(i)) >>> 0;
      }
    }
    const { a, b } = this.hashParams[row];
    const hashVal = Math.abs(Number((BigInt(a) * BigInt(num) + BigInt(b)) % BigInt(this.prime)));
    return hashVal % this.width;
  }

  /**
   * Update sketch with Conservative Update (CU-CMS)
   * Only increment the buckets that are equal to the minimum bucket value
   * @param {string|number} key
   * @param {number} [count=1]
   * @returns {number} Estimated count after update
   */
  update(key, count = 1) {
    if (count <= 0) return this.estimate(key);

    const bucketIndices = new Int32Array(this.depth);
    let minVal = Infinity;

    // First pass: find current minimum counter
    for (let i = 0; i < this.depth; i++) {
      const idx = this._hash(key, i);
      bucketIndices[i] = idx;
      if (this.table[i][idx] < minVal) {
        minVal = this.table[i][idx];
      }
    }

    // Conservative Update rule: only increment buckets matching minVal
    // or increment up to minVal + count
    const targetVal = minVal + count;
    for (let i = 0; i < this.depth; i++) {
      const idx = bucketIndices[i];
      if (this.table[i][idx] < targetVal) {
        this.table[i][idx] = targetVal;
      }
    }

    this.totalItemCount += count;
    const estimated = targetVal;

    // Update heavy hitters
    this._updateHeavyHitters(key, estimated);

    return estimated;
  }

  /**
   * Point query frequency estimation
   * @param {string|number} key
   * @returns {number}
   */
  estimate(key) {
    let minVal = Infinity;
    for (let i = 0; i < this.depth; i++) {
      const idx = this._hash(key, i);
      const val = this.table[i][idx];
      if (val < minVal) {
        minVal = val;
      }
    }
    return minVal === Infinity ? 0 : minVal;
  }

  /**
   * Insert point into Dyadic Range Tree
   * Decomposes the coordinate into dyadic ancestors: floor(point / 2^level)
   * @param {number} point - Integer coordinate in [0, 2^dyadicLevels - 1]
   * @param {number} [count=1]
   */
  updateDyadic(point, count = 1) {
    if (point < 0 || count <= 0) return;
    const maxDomain = (1 << this.dyadicLevels) - 1;
    const p = Math.min(Math.floor(point), maxDomain);

    for (let level = 0; level <= this.dyadicLevels; level++) {
      const dyadicBucket = p >> level; // Canonical dyadic interval index at this level
      const dyadicKey = `lvl_${level}_idx_${dyadicBucket}`;

      const bucketIndices = new Int32Array(this.depth);
      let minVal = Infinity;

      for (let i = 0; i < this.depth; i++) {
        const idx = this._hash(dyadicKey, i);
        bucketIndices[i] = idx;
        if (this.dyadicTables[level][i][idx] < minVal) {
          minVal = this.dyadicTables[level][i][idx];
        }
      }

      const targetVal = minVal + count;
      for (let i = 0; i < this.depth; i++) {
        const idx = bucketIndices[i];
        if (this.dyadicTables[level][i][idx] < targetVal) {
          this.dyadicTables[level][i][idx] = targetVal;
        }
      }
    }
  }

  /**
   * Decompose range [left, right] into minimal set of canonical dyadic intervals
   * and estimate sum over range
   * @param {number} left - Inclusive left bound
   * @param {number} right - Inclusive right bound
   * @returns {number} Estimated range sum
   */
  queryDyadicRange(left, right) {
    const maxDomain = (1 << this.dyadicLevels) - 1;
    const L = Math.max(0, Math.floor(left));
    const R = Math.min(maxDomain, Math.floor(right));
    if (L > R) return 0;

    let rangeSum = 0;
    let currL = L;
    let currR = R;

    for (let level = 0; level <= this.dyadicLevels && currL <= currR; level++) {
      if (currL === currR) {
        const dyadicKey = `lvl_${level}_idx_${currL}`;
        rangeSum += this._estimateDyadic(level, dyadicKey);
        break;
      }

      // If currL is an odd boundary, cover it with level interval
      if (currL % 2 === 1) {
        const dyadicKey = `lvl_${level}_idx_${currL}`;
        rangeSum += this._estimateDyadic(level, dyadicKey);
        currL += 1;
      }

      // If currR is an even boundary, cover it with level interval
      if (currR % 2 === 0) {
        const dyadicKey = `lvl_${level}_idx_${currR}`;
        rangeSum += this._estimateDyadic(level, dyadicKey);
        currR -= 1;
      }

      // Move to parent level
      currL = currL >> 1;
      currR = currR >> 1;
    }

    return rangeSum;
  }

  _estimateDyadic(level, dyadicKey) {
    let minVal = Infinity;
    for (let i = 0; i < this.depth; i++) {
      const idx = this._hash(dyadicKey, i);
      const val = this.dyadicTables[level][i][idx];
      if (val < minVal) {
        minVal = val;
      }
    }
    return minVal === Infinity ? 0 : minVal;
  }

  /**
   * Internal Min-Heap update for Top-K Heavy Hitters
   */
  _updateHeavyHitters(key, estimatedCount) {
    const strKey = String(key);
    if (this.heavyHitterMap.has(strKey)) {
      this.heavyHitterMap.set(strKey, estimatedCount);
      // Re-heapify
      this.heavyHitters.sort((a, b) => a.count - b.count);
      return;
    }

    if (this.heavyHitters.length < this.heavyHitterCapacity) {
      const item = { key: strKey, count: estimatedCount };
      this.heavyHitters.push(item);
      this.heavyHitterMap.set(strKey, estimatedCount);
      this.heavyHitters.sort((a, b) => a.count - b.count);
    } else if (estimatedCount > this.heavyHitters[0].count) {
      const removed = this.heavyHitters.shift();
      this.heavyHitterMap.delete(removed.key);
      const item = { key: strKey, count: estimatedCount };
      this.heavyHitters.push(item);
      this.heavyHitterMap.set(strKey, estimatedCount);
      this.heavyHitters.sort((a, b) => a.count - b.count);
    }
  }

  /**
   * Get Top-K Heavy Hitters sorted in descending order of frequency
   * @param {number} [k=10]
   * @returns {Array<{ key: string, count: number }>}
   */
  getTopK(k = 10) {
    return [...this.heavyHitters]
      .sort((a, b) => b.count - a.count)
      .slice(0, k);
  }

  /**
   * Merge another FCMSketchEstimator of identical dimensions
   * @param {FCMSketchEstimator} other
   */
  merge(other) {
    if (this.width !== other.width || this.depth !== other.depth) {
      throw new Error("Cannot merge sketches with different width or depth");
    }

    for (let i = 0; i < this.depth; i++) {
      for (let j = 0; j < this.width; j++) {
        this.table[i][j] += other.table[i][j];
      }
    }

    // Merge dyadic tables if level counts match
    if (this.dyadicLevels === other.dyadicLevels) {
      for (let l = 0; l <= this.dyadicLevels; l++) {
        for (let i = 0; i < this.depth; i++) {
          for (let j = 0; j < this.width; j++) {
            this.dyadicTables[l][i][j] += other.dyadicTables[l][i][j];
          }
        }
      }
    }

    this.totalItemCount += other.totalItemCount;

    // Merge heavy hitters
    for (const item of other.heavyHitters) {
      const currentEst = this.estimate(item.key);
      this._updateHeavyHitters(item.key, currentEst);
    }
  }

  /**
   * Diagnostic statistics
   */
  getStatistics() {
    let nonZeroBuckets = 0;
    const totalBuckets = this.width * this.depth;
    for (let i = 0; i < this.depth; i++) {
      for (let j = 0; j < this.width; j++) {
        if (this.table[i][j] > 0) nonZeroBuckets++;
      }
    }

    return {
      width: this.width,
      depth: this.depth,
      dyadicLevels: this.dyadicLevels,
      maxDomain: 1 << this.dyadicLevels,
      totalItemCount: this.totalItemCount,
      nonZeroBucketRatio: nonZeroBuckets / totalBuckets,
      heavyHitterCount: this.heavyHitters.length,
      topHeavyHitter: this.heavyHitters.length > 0 ? this.heavyHitters[this.heavyHitters.length - 1] : null,
    };
  }
}

export { FCMSketchEstimator };
export default FCMSketchEstimator;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FCMSketchEstimator };
  }
} catch (e) {}
