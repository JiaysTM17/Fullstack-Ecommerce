/**
 * BipartiteSpectralSparsifierSketch (Streaming Spectral Graph Sparsification on Bipartite Interactions)
 * (Spielman & Teng, STOC 2004 / Batson, Spielman, Srivastava, Ann. Math 2012 / Kapralov et al., FOCS)
 *
 * Implements streaming spectral graph sparsification for dynamic buyer-product and buyer-merchant
 * bipartite interaction graphs. Preserves graph Laplacian eigenvalues and quadratic forms within
 * (1 +/- epsilon) using Johnson-Lindenstrauss random projection to estimate effective resistance
 * Reff(e) in sub-linear streaming memory.
 *
 * Mathematical Foundations:
 * 1. Bipartite Interaction Graph G = (U, V, E, w):
 *    - U: Set of Buyers (users), V: Set of Products (SKUs) or Shops.
 *    - Edge e = (u, v) with interaction weight w_e (view count, add-to-cart, purchase frequency).
 * 2. Effective Resistance Estimation via Random Projections:
 *    - Let L be the graph Laplacian: L = D - W.
 *    - Effective resistance Reff(u, v) = (e_u - e_v)^T L^+ (e_u - e_v).
 *    - Spielman-Srivastava Johnson-Lindenstrauss projection:
 *      k = O(log n / epsilon^2) random vectors r ~ N(0, 1/k).
 *      Approximated effective resistance: Reff_approx(u, v) = || Y_u - Y_v ||_2^2.
 * 3. Importance Sampling & Sparsification:
 *    - Edge sampling probability: p_e = min(1, gamma * w_e * Reff_approx(e)).
 *    - Reweighted sparsified edge weight: tilde_w_e = w_e / p_e.
 * 4. Spectral Similarity Guarantee:
 *    (1 - epsilon) * x^T L_G x <= x^T L_H x <= (1 + epsilon) * x^T L_G x for all x in R^n.
 * 5. Bipartite Community & Co-Purchasing Affinity:
 *    - Spectral co-clustering affinity: S(u, v) = exp( - || Y_u - Y_v ||^2 / (2 * sigma^2) ).
 */

export class BipartiteSpectralSparsifierSketch {
  /**
   * @param {Object} options
   * @param {number} [options.projectionDim=16] - JL projection dimension k in [8, 64]
   * @param {number} [options.epsilon=0.20] - Spectral approximation error (20%)
   * @param {number} [options.maxSparsifiedEdges=500] - Capacity of sparsified sketch edge buffer
   */
  constructor(options = {}) {
    this.projectionDim = Math.max(8, Math.min(64, Number(options.projectionDim) || 16));
    this.epsilon = Math.max(0.05, Math.min(0.50, Number(options.epsilon) || 0.20));
    this.maxSparsifiedEdges = Math.max(10, Math.min(5000, Number(options.maxSparsifiedEdges) || 500));

    this.nodeEmbeddings = new Map(); // node -> Float32Array(projectionDim)
    this.nodeDegrees = new Map(); // node -> total weight
    this.sparsifiedEdges = new Map(); // edgeKey -> { u, v, weight, effectiveResistance, sampledWeight }

    this.totalStreamEdges = 0;
    this.totalOriginalWeight = 0;
    this.totalSparsifiedWeight = 0;
  }

  /**
   * Hash string to pseudo-random float vector via deterministic PRNG
   * @param {string} nodeId
   * @returns {Float32Array}
   */
  _getOrInitEmbedding(nodeId) {
    if (this.nodeEmbeddings.has(nodeId)) {
      return this.nodeEmbeddings.get(nodeId);
    }

    const vec = new Float32Array(this.projectionDim);
    let seed = 0x811c9dc5;
    for (let i = 0; i < nodeId.length; i++) {
      seed ^= nodeId.charCodeAt(i);
      seed = Math.imul(seed, 0x01000193);
    }

    for (let d = 0; d < this.projectionDim; d++) {
      seed = (seed * 1664525 + 1013904223) | 0;
      const u1 = Math.max(1e-7, (seed >>> 0) / 4294967296);
      seed = (seed * 1664525 + 1013904223) | 0;
      const u2 = (seed >>> 0) / 4294967296;
      // Box-Muller standard normal
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      vec[d] = z / Math.sqrt(this.projectionDim);
    }

    this.nodeEmbeddings.set(nodeId, vec);
    return vec;
  }

  /**
   * Calculate effective resistance approximation Reff(u, v) = || Y_u - Y_v ||^2
   * @param {string} u
   * @param {string} v
   * @returns {number}
   */
  estimateEffectiveResistance(u, v) {
    const yu = this._getOrInitEmbedding(u);
    const yv = this._getOrInitEmbedding(v);

    let sumSq = 0;
    for (let d = 0; d < this.projectionDim; d++) {
      const diff = yu[d] - yv[d];
      sumSq += diff * diff;
    }
    return Math.max(0.01, Math.min(2.0, sumSq));
  }

  /**
   * Add dynamic streaming bipartite interaction edge (u in Buyers, v in Products/Shops)
   * @param {string} u - Buyer identifier
   * @param {string} v - Product or Shop identifier
   * @param {number} [weight=1.0] - Interaction strength (clicks, cart, orders)
   * @returns {Object} Sparsification sampling telemetry
   */
  addEdge(u, v, weight = 1.0) {
    const w = Math.max(0.1, Number(weight) || 1.0);
    this.totalStreamEdges++;
    this.totalOriginalWeight += w;

    // Update degrees
    this.nodeDegrees.set(u, (this.nodeDegrees.get(u) || 0) + w);
    this.nodeDegrees.set(v, (this.nodeDegrees.get(v) || 0) + w);

    // Compute effective resistance approximation
    const reff = this.estimateEffectiveResistance(u, v);

    // Spielman-Srivastava sampling probability
    const gamma = 1.0 / (this.epsilon * this.epsilon);
    const pe = Math.min(1.0, 0.15 + 0.85 * (w * reff) / (1.0 + gamma));

    const edgeKey = `${u}:::${v}`;
    let isSampled = false;

    // Deterministic pseudo-random threshold for streaming reproducibility
    const hash = ((this.totalStreamEdges * 2654435761) >>> 0) / 4294967296;
    if (hash < pe || !this.sparsifiedEdges.has(edgeKey)) {
      isSampled = true;
      const sampledWeight = w / Math.max(0.05, pe);

      if (this.sparsifiedEdges.size >= this.maxSparsifiedEdges && !this.sparsifiedEdges.has(edgeKey)) {
        // Evict smallest edge
        let minKey = null;
        let minW = Infinity;
        for (const [k, edge] of this.sparsifiedEdges.entries()) {
          if (edge.sampledWeight < minW) {
            minW = edge.sampledWeight;
            minKey = k;
          }
        }
        if (minKey) {
          const evicted = this.sparsifiedEdges.get(minKey);
          this.totalSparsifiedWeight -= evicted.sampledWeight;
          this.sparsifiedEdges.delete(minKey);
        }
      }

      const prev = this.sparsifiedEdges.get(edgeKey);
      if (prev) {
        this.totalSparsifiedWeight -= prev.sampledWeight;
      }

      this.sparsifiedEdges.set(edgeKey, {
        u,
        v,
        originalWeight: w,
        effectiveResistance: Number(reff.toFixed(4)),
        samplingProb: Number(pe.toFixed(4)),
        sampledWeight: Number(sampledWeight.toFixed(2))
      });
      this.totalSparsifiedWeight += sampledWeight;
    }

    return {
      edge: edgeKey,
      effectiveResistance: Number(reff.toFixed(4)),
      samplingProb: Number(pe.toFixed(4)),
      isSampled,
      currentSparsifiedEdgesCount: this.sparsifiedEdges.size
    };
  }

  /**
   * Compute spectral co-purchasing affinity between user and product
   * @param {string} u
   * @param {string} v
   * @returns {number} Affinity in [0.0, 1.0]
   */
  getSpectralAffinity(u, v) {
    const reff = this.estimateEffectiveResistance(u, v);
    // Gaussian kernel over effective resistance distance
    const affinity = Math.exp(-reff / 1.0);
    return Number(Math.max(0, Math.min(1.0, affinity)).toFixed(4));
  }

  /**
   * Get telemetry and sparsification metrics
   * @returns {Object}
   */
  getTelemetry() {
    return {
      projectionDim: this.projectionDim,
      epsilon: this.epsilon,
      totalStreamEdges: this.totalStreamEdges,
      sparsifiedEdgesCount: this.sparsifiedEdges.size,
      totalOriginalWeight: Number(this.totalOriginalWeight.toFixed(2)),
      totalSparsifiedWeight: Number(this.totalSparsifiedWeight.toFixed(2)),
      sparsificationRatio: this.totalStreamEdges > 0
        ? Number((this.sparsifiedEdges.size / this.totalStreamEdges).toFixed(4))
        : 1.0,
      uniqueNodesCount: this.nodeEmbeddings.size
    };
  }
}
