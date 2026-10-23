/**
 * BipartiteGraphEdgeStreamSketch (Real-Time Streaming Bipartite Graph Edge Frequency Sketch)
 * (Ahmed et al., ACM KDD 2017 / Zhao et al., IEEE INFOCOM 2011 / Cormode ACM SIGMOD)
 *
 * Implements real-time edge frequency estimation, degree distribution profiling, and high-frequency
 * bipartite connection tracking (User-Product, Buyer-Shop, SKU-Category) over massive streaming events.
 *
 * Mathematical Foundations:
 * 1. 2D Sketch Matrix with 2-Universal Hash Families:
 *    Maintains depth d and width w matrix: C[j][k], for j = 0..d-1, k = 0..w-1.
 *    For edge e = (u, v):
 *    h_j(u, v) = ((a_j * hash(u) + b_j * hash(v) + c_j) mod P) mod w
 *    s_j(u, v) = ((d_j * hash(u) + e_j * hash(v) + f_j) mod P) mod 2 == 0 ? +1 : -1 (Rademacher).
 * 2. Unbiased Edge Frequency Estimation:
 *    Update: C[j][h_j(u, v)] += w_e * s_j(u, v).
 *    Query: f_hat(u, v) = median_{j=0}^{d-1} [ s_j(u, v) * C[j][h_j(u, v)] ].
 * 3. Theoretical Guarantees:
 *    - Unbiased: E[f_hat(u, v)] = f(u, v).
 *    - Variance: Var[f_hat(u, v)] <= ||f||_2^2 / w.
 * 4. Bipartite Interaction Metrics:
 *    - User out-degree estimate, Product in-degree estimate.
 *    - Graph density estimate: rho = totalEdges / (|U| * |V|).
 *    - Dynamic affinity score: A(u, v) = f_hat(u, v) / sqrt(deg(u) * deg(v)).
 */

export class BipartiteGraphEdgeStreamSketch {
  /**
   * @param {Object} options
   * @param {number} [options.depth=5] - Number of hash rows (d = ceil(ln(1/delta)))
   * @param {number} [options.width=1024] - Number of buckets per row (w = ceil(e / epsilon))
   */
  constructor(options = {}) {
    this.depth = Math.max(3, Math.min(10, Number(options.depth) || 5));
    this.width = Math.max(64, Math.min(65536, Number(options.width) || 1024));
    this.prime = 2147483647; // 2^31 - 1 Mersenne Prime

    this.table = [];
    for (let j = 0; j < this.depth; j++) {
      this.table.push(new Float64Array(this.width));
    }

    // Generate universal hash coefficients
    this.hashCoeffs = [];
    for (let j = 0; j < this.depth; j++) {
      this.hashCoeffs.push({
        a: 1 + Math.floor(Math.random() * 1000000),
        b: 1 + Math.floor(Math.random() * 1000000),
        c: Math.floor(Math.random() * 1000000),
        d: 1 + Math.floor(Math.random() * 1000000),
        e: 1 + Math.floor(Math.random() * 1000000),
        f: Math.floor(Math.random() * 1000000)
      });
    }

    this.totalInteractions = 0;
    this.userDegrees = new Map();
    this.itemDegrees = new Map();
  }

  /**
   * FNV-1a 32-bit string hash
   * @param {string} str
   * @returns {number}
   */
  _stringHash(str) {
    let hash = 2166136261;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  /**
   * Compute bucket index for edge (u, v) at row j
   * @param {number} j
   * @param {number} uHash
   * @param {number} vHash
   * @returns {number}
   */
  _hashIndex(j, uHash, vHash) {
    const { a, b, c } = this.hashCoeffs[j];
    const val = (Math.imul(a, uHash) + Math.imul(b, vHash) + c) % this.prime;
    return Math.abs(val) % this.width;
  }

  /**
   * Compute Rademacher sign (+1 or -1) for edge (u, v) at row j
   * @param {number} j
   * @param {number} uHash
   * @param {number} vHash
   * @returns {number}
   */
  _hashSign(j, uHash, vHash) {
    const { d, e, f } = this.hashCoeffs[j];
    const val = (Math.imul(d, uHash) + Math.imul(e, vHash) + f) % this.prime;
    return (Math.abs(val) & 1) === 0 ? 1 : -1;
  }

  /**
   * Record a bipartite interaction edge (u, v) with optional weight
   * @param {string} u - Source node (e.g. userId)
   * @param {string} v - Target node (e.g. productId, shopId)
   * @param {number} [weight=1] - Interaction weight (e.g. view=1, cart=3, purchase=10)
   */
  addEdge(u, v, weight = 1) {
    const w = Number(weight) || 1;
    const uStr = String(u);
    const vStr = String(v);

    const uHash = this._stringHash(uStr);
    const vHash = this._stringHash(vStr);

    for (let j = 0; j < this.depth; j++) {
      const idx = this._hashIndex(j, uHash, vHash);
      const sign = this._hashSign(j, uHash, vHash);
      this.table[j][idx] += w * sign;
    }

    this.totalInteractions += w;
    this.userDegrees.set(uStr, (this.userDegrees.get(uStr) || 0) + w);
    this.itemDegrees.set(vStr, (this.itemDegrees.get(vStr) || 0) + w);
  }

  /**
   * Estimate interaction frequency between u and v
   * @param {string} u
   * @param {string} v
   * @returns {number} Estimated frequency
   */
  estimateEdgeFrequency(u, v) {
    const uStr = String(u);
    const vStr = String(v);

    const uHash = this._stringHash(uStr);
    const vHash = this._stringHash(vStr);

    const estimates = [];
    for (let j = 0; j < this.depth; j++) {
      const idx = this._hashIndex(j, uHash, vHash);
      const sign = this._hashSign(j, uHash, vHash);
      estimates.push(sign * this.table[j][idx]);
    }

    estimates.sort((a, b) => a - b);
    const mid = Math.floor(estimates.length / 2);
    const median = estimates.length % 2 !== 0
      ? estimates[mid]
      : (estimates[mid - 1] + estimates[mid]) / 2.0;

    return Math.max(0, Math.round(median));
  }

  /**
   * Compute normalized bipartite affinity score between u and v in [0, 1]
   * @param {string} u
   * @param {string} v
   * @returns {number}
   */
  computeAffinityScore(u, v) {
    const freq = this.estimateEdgeFrequency(u, v);
    if (freq <= 0) return 0;

    const degU = this.userDegrees.get(String(u)) || freq;
    const degV = this.itemDegrees.get(String(v)) || freq;
    const denom = Math.sqrt(degU * degV);

    const affinity = denom > 0 ? freq / denom : 0;
    return Number(Math.min(1.0, Math.max(0, affinity)).toFixed(4));
  }

  /**
   * Get degree summary and interaction telemetry
   * @returns {Object}
   */
  getGraphTelemetry() {
    const numUsers = this.userDegrees.size;
    const numItems = this.itemDegrees.size;
    const maxPossibleEdges = numUsers * numItems;
    const density = maxPossibleEdges > 0 ? this.totalInteractions / maxPossibleEdges : 0;

    return {
      totalInteractions: this.totalInteractions,
      numDistinctUsers: numUsers,
      numDistinctItems: numItems,
      density: Number(density.toFixed(6)),
      depth: this.depth,
      width: this.width
    };
  }

  /**
   * Merge another bipartite graph sketch into this one
   * @param {BipartiteGraphEdgeStreamSketch} other
   */
  merge(other) {
    if (!other || other.depth !== this.depth || other.width !== this.width) {
      throw new Error("Cannot merge sketches with mismatched dimensions or null reference.");
    }

    for (let j = 0; j < this.depth; j++) {
      for (let k = 0; k < this.width; k++) {
        this.table[j][k] += other.table[j][k];
      }
    }

    this.totalInteractions += other.totalInteractions;

    other.userDegrees.forEach((deg, u) => {
      this.userDegrees.set(u, (this.userDegrees.get(u) || 0) + deg);
    });

    other.itemDegrees.forEach((deg, v) => {
      this.itemDegrees.set(v, (this.itemDegrees.get(v) || 0) + deg);
    });
  }
}
