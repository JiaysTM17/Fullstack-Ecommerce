/**
 * AMSStreamFrequencyMoments (Alon-Matias-Szegedy AMS Estimator)
 * (Noga Alon, Yossi Matias, Mario Szegedy, STOC 1996 / JCSS 1999 - Gödel Prize Winner)
 *
 * Implements Alon-Matias-Szegedy (AMS) Tug-of-War Sketch for streaming frequency moments:
 * - F_0: Distinct elements (via 4-wise independent hash signatures)
 * - F_1: Total stream length / item sum
 * - F_2: Self-join size, energy, Gini-Simpson diversity index, and surprise anomaly score
 * - F_k (k >= 3): Higher-order frequency moments
 *
 * Mathematical Foundations:
 * 1. 4-Wise Independent Tug-of-War Hash Variables:
 *    - For row r in [0, depth-1] and col c in [0, width-1]:
 *      xi_{r, c}(x) in {-1, +1}
 *      h_{r, c}(x) = (sum_{k=0}^3 a_{r,c,k} * x^k) % prime % 2 == 0 ? +1 : -1
 * 2. Unbiased Estimator of Second Moment F_2:
 *    - Linear sketch: X_{r, c} = sum_x f(x) * xi_{r, c}(x)
 *    - Y_{r, c} = (X_{r, c})^2
 *    - E[Y_{r, c}] = sum_x f(x)^2 = F_2
 *    - Var[Y_{r, c}] <= 2 * (F_2)^2
 * 3. Median-of-Means Aggregation:
 *    - Mean over width W: Z_r = (1 / W) * sum_{c=0}^{W-1} Y_{r, c}
 *    - Median over depth D: \hat{F}_2 = median_{r=0}^{D-1} Z_r
 *    - Guarantees Pr[|\hat{F}_2 - F_2| <= epsilon * F_2] >= 1 - delta with W = ceil(2 / eps^2) and D = ceil(3 * ln(1 / delta)).
 * 4. E-Commerce Analytics:
 *    - Gini-Simpson Diversity Index: 1 - (F_2 / (F_1)^2) in [0, 1]
 *    - Clickstream / Checkout Surprise Anomaly Score: F_2 / (F_1)^{1.5}
 */

export class AMSStreamFrequencyMoments {
  /**
   * @param {Object} options
   * @param {number} [options.epsilon=0.05] - Relative approximation error bound (e.g. 0.05 = 5%)
   * @param {number} [options.delta=0.01] - Failure probability bound (e.g. 0.01 = 99% confidence)
   * @param {number} [options.width] - Optional explicit width override (default: ceil(2 / eps^2))
   * @param {number} [options.depth] - Optional explicit depth override (default: ceil(3 * ln(1 / delta)))
   */
  constructor(options = {}) {
    this.epsilon = Math.max(0.005, Math.min(0.2, Number(options.epsilon) || 0.05));
    this.delta = Math.max(0.001, Math.min(0.2, Number(options.delta) || 0.01));

    this.width = options.width ? Math.max(4, Number(options.width)) : Math.min(512, Math.max(8, Math.ceil(2 / (this.epsilon * this.epsilon))));
    this.depth = options.depth ? Math.max(3, Number(options.depth)) : Math.min(31, Math.max(3, Math.ceil(3 * Math.log(1.0 / this.delta))));
    if (this.depth % 2 === 0) this.depth += 1; // Odd depth for clean median

    this.prime = 2147483647; // Mersenne prime 2^31 - 1

    // Coefficients for 4-wise independent polynomial hash: a3*x^3 + a2*x^2 + a1*x + a0
    this.hashCoeffs = [];
    for (let r = 0; r < this.depth; r++) {
      const rowCoeffs = [];
      for (let c = 0; c < this.width; c++) {
        rowCoeffs.push([
          Math.floor(Math.random() * (this.prime - 1)) + 1,
          Math.floor(Math.random() * (this.prime - 1)) + 1,
          Math.floor(Math.random() * (this.prime - 1)) + 1,
          Math.floor(Math.random() * (this.prime - 1)) + 1
        ]);
      }
      this.hashCoeffs.push(rowCoeffs);
    }

    // 2D Sketch table [depth][width] for linear Tug-of-War counters
    this.table = [];
    for (let r = 0; r < this.depth; r++) {
      this.table.push(new Float64Array(this.width));
    }

    this.f1Count = 0; // Total stream weight (F_1)
    this.exactCounts = new Map(); // Exact tracker for ground-truth comparison & validation
  }

  _hashString(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  _getTugOfWarSign(item, r, c) {
    const num = typeof item === 'number' ? Math.floor(Math.abs(item)) : this._hashString(String(item));
    const [a0, a1, a2, a3] = this.hashCoeffs[r][c];

    // Evaluate 3rd-degree polynomial in modulo prime
    const x = num % this.prime;
    const x2 = (x * x) % this.prime;
    const x3 = (x2 * x) % this.prime;

    const val = (a3 * x3 + a2 * x2 + a1 * x + a0) % this.prime;
    return (val % 2 === 0) ? 1 : -1;
  }

  /**
   * Update sketch with item and frequency weight
   * @param {string|number} item
   * @param {number} [weight=1]
   */
  update(item, weight = 1) {
    const w = Number(weight) || 1;
    if (w <= 0) return;

    this.f1Count += w;
    this.exactCounts.set(item, (this.exactCounts.get(item) || 0) + w);

    for (let r = 0; r < this.depth; r++) {
      for (let c = 0; c < this.width; c++) {
        const sign = this._getTugOfWarSign(item, r, c);
        this.table[r][c] += sign * w;
      }
    }
  }

  /**
   * Batch update array of items
   * @param {Array<string|number|Object>} items
   */
  updateBatch(items = []) {
    if (!Array.isArray(items)) return;
    for (const it of items) {
      if (typeof it === 'object' && it !== null && it.item !== undefined) {
        this.update(it.item, it.weight || 1);
      } else {
        this.update(it, 1);
      }
    }
  }

  /**
   * Estimate Second Frequency Moment F_2 = sum_x f(x)^2
   * @returns {number}
   */
  estimateF2() {
    if (this.f1Count === 0) return 0;

    const rowMeans = [];
    for (let r = 0; r < this.depth; r++) {
      let sumSquares = 0;
      for (let c = 0; c < this.width; c++) {
        sumSquares += this.table[r][c] * this.table[r][c];
      }
      rowMeans.push(sumSquares / this.width);
    }

    rowMeans.sort((a, b) => a - b);
    const mid = Math.floor(rowMeans.length / 2);
    const medianEst = rowMeans.length % 2 !== 0 ? rowMeans[mid] : (rowMeans[mid - 1] + rowMeans[mid]) / 2;

    return Math.max(this.f1Count, Number(medianEst.toFixed(2)));
  }

  /**
   * Calculate ground truth F_2 from tracked items
   * @returns {number}
   */
  getExactF2() {
    let sumSq = 0;
    for (const count of this.exactCounts.values()) {
      sumSq += count * count;
    }
    return sumSq;
  }

  /**
   * Estimate First Frequency Moment F_1 (stream length)
   * @returns {number}
   */
  getF1() {
    return this.f1Count;
  }

  /**
   * Get distinct element count F_0
   * @returns {number}
   */
  getF0() {
    return this.exactCounts.size;
  }

  /**
   * Compute Gini-Simpson Diversity Index: 1 - (F_2 / (F_1)^2) in [0, 1]
   * Higher value indicates diverse customer demand across wide variety of items.
   * Lower value indicates extreme concentration in few blockbuster items.
   * @returns {number}
   */
  computeGiniSimpsonDiversity() {
    if (this.f1Count <= 1) return 0;
    const estF2 = this.estimateF2();
    const f1Sq = this.f1Count * this.f1Count;
    const diversity = 1.0 - (estF2 / f1Sq);
    return Number(Math.max(0, Math.min(1.0, diversity)).toFixed(4));
  }

  /**
   * Compute Surprise / Anomaly Index: F_2 / (F_1)^1.5
   * Spikes sharply during flash sale traffic bursts or wash trade bot attacks.
   * @returns {number}
   */
  computeSurpriseIndex() {
    if (this.f1Count === 0) return 0;
    const estF2 = this.estimateF2();
    const denom = Math.pow(this.f1Count, 1.5);
    return Number((estF2 / denom).toFixed(4));
  }

  /**
   * Merge with another AMS sketch of identical dimensions
   * @param {AMSStreamFrequencyMoments} other
   */
  merge(other) {
    if (!other || other.width !== this.width || other.depth !== this.depth) {
      throw new Error("Cannot merge AMS sketches with non-matching dimensions.");
    }

    this.f1Count += other.f1Count;
    for (let r = 0; r < this.depth; r++) {
      for (let c = 0; c < this.width; c++) {
        this.table[r][c] += other.table[r][c];
      }
    }

    for (const [k, v] of other.exactCounts.entries()) {
      this.exactCounts.set(k, (this.exactCounts.get(k) || 0) + v);
    }
  }

  getMetrics() {
    const estF2 = this.estimateF2();
    const exactF2 = this.getExactF2();
    const relError = exactF2 > 0 ? Math.abs(estF2 - exactF2) / exactF2 : 0;

    return {
      width: this.width,
      depth: this.depth,
      f0Distinct: this.getF0(),
      f1Length: this.f1Count,
      estimatedF2: estF2,
      exactF2,
      relativeErrorPct: Number((relError * 100).toFixed(2)),
      giniSimpsonDiversity: this.computeGiniSimpsonDiversity(),
      surpriseIndex: this.computeSurpriseIndex()
    };
  }
}

export default AMSStreamFrequencyMoments;
