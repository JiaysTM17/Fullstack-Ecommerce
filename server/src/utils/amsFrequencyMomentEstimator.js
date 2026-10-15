/**
 * AMSFrequencyMomentEstimator - Alon-Matias-Szegedy (AMS) Sketch for F2 Second Frequency Moment
 * 
 * References:
 * - Noga Alon, Yossi Matias, Mario Szegedy (STOC 1996, JCSS 1999, Gödel Prize 2005):
 *   "The Space Complexity of Approximating the Frequency Moments"
 * 
 * E-Commerce Applications:
 * 1. Stream Surprise Index: Measures traffic inequality/concentration F2 / (sum f_i)^2.
 *    Detects sudden viral Flash Sale flash-mobs, click fraud attacks, or bot scalpers monopolizing a single SKU.
 * 2. Second Frequency Moment F2: F2 = sum_i f_i^2, capturing variance and distribution skewness in O(D * W) memory.
 * 3. Stream Cosine Similarity: Estimates inner product sum_i (f_{A, i} * f_{B, i}) between two clickstreams or user purchase vectors.
 */

class AMSFrequencyMomentEstimator {
  /**
   * @param {Object} [options]
   * @param {number} [options.depth=7] - Number of independent estimator rows (D)
   * @param {number} [options.width=64] - Number of sub-estimators averaged per row (W)
   * @param {number} [options.seed=42] - Hash seed
   */
  constructor(options = {}) {
    this.depth = options.depth || 7;
    this.width = options.width || 64;
    this.seed = options.seed || 42;

    // Sketch matrix: D rows, W columns of accumulators
    this.matrix = Array.from({ length: this.depth }, () => new Float64Array(this.width));

    // 4-wise independent hash parameters for Rademacher variables xi in {-1, +1}:
    // h(x) = (a * x^3 + b * x^2 + c * x + d) mod P mod 2 -> 0 => +1, 1 => -1
    this.prime = 2147483647; // 2^31 - 1
    this.hashParams = [];

    for (let i = 0; i < this.depth; i++) {
      const rowParams = [];
      for (let j = 0; j < this.width; j++) {
        const idx = i * this.width + j + 1;
        rowParams.push({
          a: Math.abs(Math.floor(Math.sin(this.seed + idx * 4 + 1) * 100000) % 2147483640) + 1,
          b: Math.abs(Math.floor(Math.cos(this.seed + idx * 4 + 2) * 100000) % 2147483640) + 3,
          c: Math.abs(Math.floor(Math.sin(this.seed + idx * 4 + 3) * 100000) % 2147483640) + 7,
          d: Math.abs(Math.floor(Math.cos(this.seed + idx * 4 + 4) * 100000) % 2147483640) + 11,
        });
      }
      this.hashParams.push(rowParams);
    }

    this.totalItems = 0;
  }

  /**
   * Fast integer hash from string/number
   */
  _toNumericKey(key) {
    if (typeof key === 'number') return key >>> 0;
    const str = String(key);
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
  }

  /**
   * 4-wise independent Rademacher hash: returns +1 or -1 with equal probability
   */
  _getRademacher(keyNum, row, col) {
    const { a, b, c, d } = this.hashParams[row][col];
    const x = BigInt(keyNum);
    const p = BigInt(this.prime);

    // poly = (a*x^3 + b*x^2 + c*x + d) mod p
    const poly = (BigInt(a) * x * x * x + BigInt(b) * x * x + BigInt(c) * x + BigInt(d)) % p;
    return Number(poly % 2n) === 0 ? 1 : -1;
  }

  /**
   * Update sketch with item frequency
   * @param {string|number} key
   * @param {number} [count=1]
   */
  update(key, count = 1) {
    if (count <= 0) return;
    const keyNum = this._toNumericKey(key);

    for (let i = 0; i < this.depth; i++) {
      for (let j = 0; j < this.width; j++) {
        const xi = this._getRademacher(keyNum, i, j);
        this.matrix[i][j] += xi * count;
      }
    }

    this.totalItems += count;
  }

  /**
   * Estimate Second Frequency Moment F2 = sum_i f_i^2
   * Uses median of means: average of squares across W columns, median across D rows
   * @returns {number} Estimated F2
   */
  estimateF2() {
    if (this.totalItems === 0) return 0;

    const rowMeans = [];
    for (let i = 0; i < this.depth; i++) {
      let sumSq = 0;
      for (let j = 0; j < this.width; j++) {
        sumSq += this.matrix[i][j] * this.matrix[i][j];
      }
      rowMeans.push(sumSq / this.width);
    }

    // Take median of row means
    rowMeans.sort((a, b) => a - b);
    const mid = Math.floor(rowMeans.length / 2);
    const medianF2 = rowMeans.length % 2 === 0
      ? (rowMeans[mid - 1] + rowMeans[mid]) / 2
      : rowMeans[mid];

    return Math.max(0, Math.round(medianF2));
  }

  /**
   * Compute Stream Surprise Index: S = F2 / (sum f_i)^2
   * Measures concentration of demand. Range: [1/N, 1.0].
   * Values > 0.15 indicate extreme concentration / viral Flash Sale spike.
   * @returns {number}
   */
  estimateStreamSurpriseIndex() {
    if (this.totalItems === 0) return 0;
    const f2 = this.estimateF2();
    const totalSq = this.totalItems * this.totalItems;
    return Number((f2 / totalSq).toFixed(5));
  }

  /**
   * Estimate inner product sum_i (f_{A, i} * f_{B, i}) and Cosine Similarity
   * @param {AMSFrequencyMomentEstimator} other
   * @returns {{ innerProduct: number, cosineSimilarity: number }}
   */
  estimateCosineSimilarity(other) {
    if (this.depth !== other.depth || this.width !== other.width) {
      throw new Error("Cannot compute similarity between sketches with different dimensions");
    }

    const rowInnerProducts = [];
    for (let i = 0; i < this.depth; i++) {
      let sumDot = 0;
      for (let j = 0; j < this.width; j++) {
        sumDot += this.matrix[i][j] * other.matrix[i][j];
      }
      rowInnerProducts.push(sumDot / this.width);
    }

    rowInnerProducts.sort((a, b) => a - b);
    const mid = Math.floor(rowInnerProducts.length / 2);
    const innerProduct = rowInnerProducts.length % 2 === 0
      ? (rowInnerProducts[mid - 1] + rowInnerProducts[mid]) / 2
      : rowInnerProducts[mid];

    const f2A = this.estimateF2();
    const f2B = other.estimateF2();
    const norm = Math.sqrt(f2A) * Math.sqrt(f2B);
    const cosine = norm > 0 ? Math.max(0, Math.min(1.0, innerProduct / norm)) : 0;

    return {
      innerProduct: Math.max(0, Math.round(innerProduct)),
      cosineSimilarity: Number(cosine.toFixed(4)),
    };
  }

  /**
   * Merge another sketch linearly: X_{merged} = X_A + X_B
   * @param {AMSFrequencyMomentEstimator} other
   */
  merge(other) {
    if (this.depth !== other.depth || this.width !== other.width) {
      throw new Error("Cannot merge sketches with different dimensions");
    }

    for (let i = 0; i < this.depth; i++) {
      for (let j = 0; j < this.width; j++) {
        this.matrix[i][j] += other.matrix[i][j];
      }
    }

    this.totalItems += other.totalItems;
  }

  /**
   * Get Diagnostic summary
   */
  getStats() {
    const f2 = this.estimateF2();
    return {
      depth: this.depth,
      width: this.width,
      totalItems: this.totalItems,
      estimatedF2: f2,
      streamSurpriseIndex: this.estimateStreamSurpriseIndex(),
      theoreticalStdDevRatio: Number((Math.sqrt(2 / this.width)).toFixed(4)),
    };
  }
}

export { AMSFrequencyMomentEstimator };
export default AMSFrequencyMomentEstimator;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AMSFrequencyMomentEstimator };
  }
} catch (e) {}
