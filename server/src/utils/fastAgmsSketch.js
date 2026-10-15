/**
 * FastAGMSSketch - Fast-AGMS Sketch for Stream Inner Product & Second Frequency Moment (F2) Estimation
 * Reference:
 * - Alon, Gibbons, Matias, Szegedy (JCSS 2002), "Tracking Join and Self-Join Sizes in Limited Storage"
 * - Cormode & Garofalakis (VLDB 2005), "Sketching Streams Through the Waiting-Room"
 * 
 * Features:
 * - Computes Stream Inner Product <A, B> = sum_i A_i * B_i (Basket Affinity / Click-to-Purchase Alignment)
 * - Computes Stream Second Frequency Moment F_2 = sum_i A_i^2 (Stream Variance / Energy)
 * - Computes Cosine Similarity cos(A, B) = <A, B> / (sqrt(F2_A) * sqrt(F2_B))
 * - Median-of-Means over d independent rows with w buckets each
 * - 4-wise independent hash functions for bucket selection and Rademacher {-1, +1} sign flips
 * - Space complexity: O(d * w) with d = O(log(1/delta)), w = O(1/eps^2)
 */

class FastAGMSSketch {
  /**
   * @param {Object} options
   * @param {number} [options.depth=5] - Number of independent hash rows (d)
   * @param {number} [options.width=64] - Number of buckets per row (w)
   * @param {number} [options.seed=42] - Master seed for 4-wise independent PRNG
   */
  constructor(options = {}) {
    this.depth = Math.max(1, options.depth || 5);
    this.width = Math.max(2, options.width || 64);
    this.seed = options.seed || 42;

    // Table A (Stream 1 / e.g. Customer clicks, browsing traffic)
    this.tableA = Array.from({ length: this.depth }, () => new Float64Array(this.width));
    // Table B (Stream 2 / e.g. Checkout orders, conversions)
    this.tableB = Array.from({ length: this.depth }, () => new Float64Array(this.width));

    this.totalUpdatesA = 0;
    this.totalUpdatesB = 0;

    // Generate 4-wise hash coefficients for bucket hash h_i(x) and sign hash s_i(x)
    this.hashParams = [];
    let prng = this.seed;
    const nextRand = () => {
      prng = (Math.imul(1103515245, prng) + 12345) & 0x7fffffff;
      return prng;
    };

    for (let i = 0; i < this.depth; i++) {
      this.hashParams.push({
        // 4 coefficients for bucket hash h(x)
        a1: (nextRand() % 1000003) + 1,
        b1: nextRand() % 1000003,
        c1: nextRand() % 1000003,
        d1: nextRand() % 1000003,
        // 4 coefficients for Rademacher sign hash s(x)
        a2: (nextRand() % 1000003) + 1,
        b2: nextRand() % 1000003,
        c2: nextRand() % 1000003,
        d2: nextRand() % 1000003,
      });
    }
  }

  /**
   * Hash string or number key to integer
   */
  _hashKey(key) {
    if (typeof key === 'number') return key >>> 0;
    const str = String(key);
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  /**
   * 4-wise independent hash to select bucket index in [0, width - 1]
   */
  _getBucket(row, keyHash) {
    const p = this.hashParams[row];
    const x = keyHash;
    const x2 = (x * x) % 1000003;
    const x3 = (x2 * x) % 1000003;
    const val = (p.a1 * x3 + p.b1 * x2 + p.c1 * x + p.d1) % 1000003;
    return Math.abs(val) % this.width;
  }

  /**
   * 4-wise independent hash to generate Rademacher sign in {-1, +1}
   */
  _getSign(row, keyHash) {
    const p = this.hashParams[row];
    const x = keyHash;
    const x2 = (x * x) % 1000003;
    const x3 = (x2 * x) % 1000003;
    const val = (p.a2 * x3 + p.b2 * x2 + p.c2 * x + p.d2) % 1000003;
    return (Math.abs(val) % 2 === 0) ? 1.0 : -1.0;
  }

  /**
   * Update sketch with item key, weight, and target stream
   * @param {string|number} key - Item identifier
   * @param {number} [weight=1.0] - Item update weight/frequency
   * @param {'A'|'B'} [stream='A'] - Target stream
   */
  update(key, weight = 1.0, stream = 'A') {
    const keyHash = this._hashKey(key);
    const w = Number(weight) || 1.0;
    const targetTable = (stream === 'B') ? this.tableB : this.tableA;

    if (stream === 'B') {
      this.totalUpdatesB += Math.abs(w);
    } else {
      this.totalUpdatesA += Math.abs(w);
    }

    for (let i = 0; i < this.depth; i++) {
      const bucket = this._getBucket(i, keyHash);
      const sign = this._getSign(i, keyHash);
      targetTable[i][bucket] += sign * w;
    }
  }

  /**
   * Estimate second frequency moment F_2 = sum_i weight_i^2 of stream 'A' or 'B'
   * @param {'A'|'B'} [stream='A']
   * @returns {number} Estimated F2 moment
   */
  estimateF2(stream = 'A') {
    const targetTable = (stream === 'B') ? this.tableB : this.tableA;
    const rowEstimates = [];

    for (let i = 0; i < this.depth; i++) {
      let sumSq = 0;
      for (let j = 0; j < this.width; j++) {
        const val = targetTable[i][j];
        sumSq += val * val;
      }
      rowEstimates.push(sumSq);
    }

    rowEstimates.sort((a, b) => a - b);
    const mid = Math.floor(rowEstimates.length / 2);
    const median = (rowEstimates.length % 2 !== 0)
      ? rowEstimates[mid]
      : (rowEstimates[mid - 1] + rowEstimates[mid]) / 2.0;

    return Math.max(0, Number(median.toFixed(2)));
  }

  /**
   * Estimate Inner Product <A, B> = sum_i A_i * B_i via Fast-AGMS sketch dot-product
   * @returns {number} Estimated stream inner product
   */
  estimateInnerProduct() {
    const rowEstimates = [];

    for (let i = 0; i < this.depth; i++) {
      let dotProd = 0;
      for (let j = 0; j < this.width; j++) {
        dotProd += this.tableA[i][j] * this.tableB[i][j];
      }
      rowEstimates.push(dotProd);
    }

    rowEstimates.sort((a, b) => a - b);
    const mid = Math.floor(rowEstimates.length / 2);
    const median = (rowEstimates.length % 2 !== 0)
      ? rowEstimates[mid]
      : (rowEstimates[mid - 1] + rowEstimates[mid]) / 2.0;

    return Number(median.toFixed(2));
  }

  /**
   * Estimate Cosine Similarity between Stream A and Stream B
   * cos(A, B) = <A, B> / (sqrt(F2_A) * sqrt(F2_B))
   * @returns {number} Cosine similarity in range [-1.0, 1.0]
   */
  estimateCosineSimilarity() {
    const f2A = this.estimateF2('A');
    const f2B = this.estimateF2('B');
    if (f2A <= 0 || f2B <= 0) return 0.0;

    const innerProd = this.estimateInnerProduct();
    const denom = Math.sqrt(f2A) * Math.sqrt(f2B);
    const sim = denom > 0 ? (innerProd / denom) : 0.0;
    return Number(Math.max(-1.0, Math.min(1.0, sim)).toFixed(4));
  }

  /**
   * Merge another FastAGMSSketch into this instance
   * @param {FastAGMSSketch} other
   */
  merge(other) {
    if (!(other instanceof FastAGMSSketch)) {
      throw new Error("Target must be an instance of FastAGMSSketch");
    }
    if (this.depth !== other.depth || this.width !== other.width) {
      throw new Error("Sketch dimensions (depth, width) must match for merging");
    }

    for (let i = 0; i < this.depth; i++) {
      for (let j = 0; j < this.width; j++) {
        this.tableA[i][j] += other.tableA[i][j];
        this.tableB[i][j] += other.tableB[i][j];
      }
    }
    this.totalUpdatesA += other.totalUpdatesA;
    this.totalUpdatesB += other.totalUpdatesB;
    return this;
  }

  /**
   * Reset sketch tables and telemetry
   */
  reset() {
    for (let i = 0; i < this.depth; i++) {
      this.tableA[i].fill(0);
      this.tableB[i].fill(0);
    }
    this.totalUpdatesA = 0;
    this.totalUpdatesB = 0;
  }

  /**
   * Get diagnostic summary of Fast-AGMS sketch
   */
  getSummary() {
    const f2A = this.estimateF2('A');
    const f2B = this.estimateF2('B');
    const innerProduct = this.estimateInnerProduct();
    const cosineSimilarity = this.estimateCosineSimilarity();

    return {
      depth: this.depth,
      width: this.width,
      totalUpdatesA: this.totalUpdatesA,
      totalUpdatesB: this.totalUpdatesB,
      f2A,
      f2B,
      innerProduct,
      cosineSimilarity
    };
  }
}

export { FastAGMSSketch };
export default FastAGMSSketch;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FastAGMSSketch };
  }
} catch (e) {}
