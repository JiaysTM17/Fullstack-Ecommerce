/**
 * Count-Sketch Hierarchical Heavy Hitters (CountSketchHierarchicalHH)
 * 
 * Theoretical Foundations:
 * - Moses Charikar, Kevin Chen, Martin Farach-Colton (ICALP 2002) - "Finding Frequent Items in Data Streams" (Count-Sketch with Median of Hashes)
 * - Graham Cormode, S. Muthukrishnan (ACM TODS 2008) - "What's Hot and What's Not: Tracking Hierarchical Heavy Hitters in Data Streams"
 * 
 * Mathematical Formulation:
 * 1. Unbiased Point Estimation via Rademacher Signs:
 *    Hash h_r: U -> [0, w-1] and sign hash s_r: U -> {-1, +1}
 *    For element x with weight w_x:
 *      Table[r][h_r(x)] += s_r(x) * w_x
 *    Estimate:
 *      f_r(x) = s_r(x) * Table[r][h_r(x)]
 *      E[f_r(x)] = f(x)
 *      Var[f_r(x)] <= F_2 / w
 *    Final Estimate (Median of d sketches):
 *      \hat{f}(x) = median_{r=0..d-1} f_r(x)
 * 2. Multi-Level Hierarchical Tree Decomposition:
 *    Hierarchical taxonomy: Category -> Subcategory -> Item (Root: 0, Levels: 0..H)
 *    Array of sketches CS_0, CS_1, ..., CS_H corresponding to tree depth
 * 3. Bottom-Up Conditional Frequency:
 *    f_cond(u) = \hat{f}(u) - \sum_{v \in Desc(u) \cap HHH} f_cond(v)
 *    A node u is an HHH if f_cond(u) >= \phi * N
 */

export class CountSketchHierarchicalHH {
  /**
   * @param {Object} [options]
   * @param {number} [options.phi=0.01] Heavy hitter threshold fraction (e.g. 0.01 = 1%)
   * @param {number} [options.epsilon=0.005] Accuracy error bound
   * @param {number} [options.delta=0.01] Failure probability
   * @param {number} [options.maxDepth=4] Max hierarchy tree depth
   */
  constructor(options = {}) {
    this.phi = Math.max(0.0001, Math.min(0.5, Number(options.phi || 0.01)));
    this.epsilon = Math.max(0.0001, Math.min(0.2, Number(options.epsilon || 0.005)));
    this.delta = Math.max(0.0001, Math.min(0.5, Number(options.delta || 0.01)));
    this.maxDepth = Math.max(1, Math.min(8, Math.floor(Number(options.maxDepth || 4))));

    this.width = options.width ? Math.max(8, Number(options.width)) : Math.max(32, Math.ceil(3.0 / (this.epsilon * this.epsilon)));
    this.depth = options.depth ? Math.max(1, Number(options.depth)) : Math.max(3, Math.ceil(Math.log(1.0 / this.delta) * 2));
    if (this.depth % 2 === 0) this.depth++; // Ensure odd depth for exact median

    // Multi-level Count-Sketches for tree levels 0..maxDepth
    this.sketches = [];
    for (let l = 0; l <= this.maxDepth; l++) {
      const levelTables = [];
      for (let d = 0; d < this.depth; d++) {
        levelTables.push(new Float64Array(this.width));
      }
      this.sketches.push(levelTables);
    }

    this.totalCount = 0;
    this.nodeRegistry = new Map(); // pathKey -> { level, path, parentKey, childrenKeys: Set }
    this.nodes = new Map(); // nodeId -> { id: nodeId, parentId, depth }
    this._nodePaths = new Map();
    this.nodeFrequencyUpperBounds = new Map();
  }

  registerTaxonomyNode(nodeId, parentId = null) {
    let depth = 0;
    if (parentId && this.nodes.has(parentId)) {
      depth = this.nodes.get(parentId).depth + 1;
    }
    const nodeObj = { id: nodeId, parentId, depth };
    this.nodes.set(nodeId, nodeObj);
    if (depth > this.maxDepth) {
      this.maxDepth = depth;
      while (this.sketches.length <= this.maxDepth) {
        const levelTables = [];
        for (let d = 0; d < this.depth; d++) {
          levelTables.push(new Float64Array(this.width));
        }
        this.sketches.push(levelTables);
      }
    }
    let current = nodeId;
    const path = [];
    while (current) {
      path.unshift(current);
      current = this.nodes.has(current) ? this.nodes.get(current).parentId : null;
    }
    this._nodePaths.set(nodeId, path);
  }

  hashSign(key, r = 0) {
    return this._sign(key, r * 101 + 59);
  }

  hashIndex(key, r = 0) {
    return this._hash(key, r * 37 + 13);
  }

  update(nodeId, count = 1) {
    if (this._nodePaths && this._nodePaths.has(nodeId)) {
      this.add(this._nodePaths.get(nodeId), count);
    } else {
      this.add(nodeId, count);
    }
  }

  estimatePointFrequency(nodeId) {
    if (this._nodePaths && this._nodePaths.has(nodeId)) {
      return this.estimate(this._nodePaths.get(nodeId));
    }
    return this.estimate(nodeId);
  }

  extractHeavyHitters(customPhi) {
    const list = this.findHierarchicalHeavyHitters(customPhi);
    return list.map(h => ({
      ...h,
      nodeId: h.name || h.key.split(">").pop(),
      depth: h.level,
      conditionalFreq: h.conditionalCount,
      estimatedFreq: h.estimatedCount
    }));
  }

  /**
   * Universal 32-bit hash function
   * @private
   */
  _hash(str, seed) {
    let h = 2166136261 ^ seed;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    h ^= (h >>> 16);
    return (h >>> 0) % this.width;
  }

  /**
   * Rademacher random sign hash {-1, +1}
   * @private
   */
  _sign(str, seed) {
    let h = 1315423911 ^ seed;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= (h << 5) + s.charCodeAt(i) + (h >> 2);
    }
    return (h & 1) === 0 ? 1.0 : -1.0;
  }

  /**
   * Normalizes hierarchy array: e.g. ["Electronics", "Phones", "Smartphones"]
   * @param {Array<string>|string} path 
   * @returns {Array<string>}
   */
  normalizePath(path) {
    if (Array.isArray(path)) {
      return path.map(p => String(p).trim()).filter(Boolean).slice(0, this.maxDepth);
    }
    if (typeof path === "string") {
      return path.split(/[\/>]/).map(p => p.trim()).filter(Boolean).slice(0, this.maxDepth);
    }
    return ["Root"];
  }

  /**
   * Inserts a hierarchical purchase / event into sketches
   * @param {Array<string>|string} path 
   * @param {number} [weight=1] 
   */
  add(path, weight = 1) {
    const segments = this.normalizePath(path);
    if (segments.length === 0) return;
    const w = Math.max(1, Number(weight) || 1);
    this.totalCount += w;

    let currentPrefix = "";
    let parentKey = null;

    for (let level = 0; level < segments.length; level++) {
      const seg = segments[level];
      currentPrefix = currentPrefix ? `${currentPrefix}>${seg}` : seg;
      const key = currentPrefix;

      // Register node in taxonomy graph
      if (!this.nodeRegistry.has(key)) {
        this.nodeRegistry.set(key, {
          key,
          level,
          name: seg,
          parentKey,
          childrenKeys: new Set()
        });
        if (parentKey && this.nodeRegistry.has(parentKey)) {
          this.nodeRegistry.get(parentKey).childrenKeys.add(key);
        }
      }

      // Update level sketch
      const tables = this.sketches[level];
      for (let d = 0; d < this.depth; d++) {
        const bucket = this._hash(key, d * 37 + 13);
        const sign = this._sign(key, d * 101 + 59);
        tables[d][bucket] += sign * w;
      }

      parentKey = key;
    }
  }

  /**
   * Estimates point frequency of a taxonomy node using Median Count-Sketch
   * @param {string|Array<string>} path 
   * @returns {number}
   */
  estimate(path) {
    const segments = this.normalizePath(path);
    const level = Math.min(this.maxDepth, segments.length - 1);
    if (level < 0) return 0;
    const key = segments.join(">");

    const tables = this.sketches[level];
    const estimates = new Float64Array(this.depth);

    for (let d = 0; d < this.depth; d++) {
      const bucket = this._hash(key, d * 37 + 13);
      const sign = this._sign(key, d * 101 + 59);
      estimates[d] = sign * tables[d][bucket];
    }

    estimates.sort();
    const medianVal = estimates[Math.floor(this.depth / 2)];
    return Math.max(0, Math.round(medianVal));
  }

  /**
   * Finds all Hierarchical Heavy Hitters satisfying conditional threshold phi * N
   * @param {number} [customPhi]
   * @returns {Array<{ key: string, name: string, level: number, estimatedCount: number, conditionalCount: number, ratio: number }>}
   */
  findHierarchicalHeavyHitters(customPhi) {
    const thresholdFraction = customPhi !== undefined ? Math.max(0.0001, Number(customPhi)) : this.phi;
    const thresholdCount = thresholdFraction * this.totalCount;

    // Collect all registered nodes grouped by level
    const nodesByLevel = [];
    for (let l = 0; l <= this.maxDepth; l++) nodesByLevel.push([]);

    for (const [key, node] of this.nodeRegistry.entries()) {
      if (node.level <= this.maxDepth) {
        nodesByLevel[node.level].push(node);
      }
    }

    const hhhNodes = new Map(); // key -> HHH result
    const conditionalCounts = new Map();

    // Bottom-Up Dynamic Programming: from leaf levels up to root level
    for (let level = this.maxDepth; level >= 0; level--) {
      const nodesAtLevel = nodesByLevel[level];
      for (const node of nodesAtLevel) {
        const estCount = this.estimate(node.key);

        // Sum conditional frequencies of descendant HHH nodes
        let descHhhSum = 0;
        for (const childKey of node.childrenKeys) {
          if (hhhNodes.has(childKey)) {
            descHhhSum += conditionalCounts.get(childKey) || 0;
          }
        }

        const condCount = Math.max(0, estCount - descHhhSum);
        conditionalCounts.set(node.key, condCount);

        if (condCount >= thresholdCount && this.totalCount > 0) {
          const hhhItem = {
            key: node.key,
            name: node.name,
            level: node.level,
            estimatedCount: estCount,
            conditionalCount: condCount,
            ratio: Number((condCount / this.totalCount).toFixed(4))
          };
          hhhNodes.set(node.key, hhhItem);
        }
      }
    }

    const results = Array.from(hhhNodes.values());
    results.sort((a, b) => b.conditionalCount - a.conditionalCount);
    return results;
  }

  /**
   * Merges another CountSketchHierarchicalHH sketch
   * @param {CountSketchHierarchicalHH} other 
   */
  merge(other) {
    if (!other || !(other instanceof CountSketchHierarchicalHH)) return;
    if (this.width !== other.width || this.depth !== other.depth || this.maxDepth !== other.maxDepth) {
      return;
    }

    for (let l = 0; l <= this.maxDepth; l++) {
      for (let d = 0; d < this.depth; d++) {
        for (let w = 0; w < this.width; w++) {
          this.sketches[l][d][w] += other.sketches[l][d][w];
        }
      }
    }

    for (const [k, node] of other.nodeRegistry.entries()) {
      if (!this.nodeRegistry.has(k)) {
        this.nodeRegistry.set(k, {
          key: node.key,
          level: node.level,
          name: node.name,
          parentKey: node.parentKey,
          childrenKeys: new Set(node.childrenKeys)
        });
      } else {
        const existing = this.nodeRegistry.get(k);
        for (const ck of node.childrenKeys) existing.childrenKeys.add(ck);
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
      algorithm: "CountSketchHierarchicalHH",
      phi: this.phi,
      epsilon: this.epsilon,
      delta: this.delta,
      width: this.width,
      depth: this.depth,
      maxDepth: this.maxDepth,
      totalCount: this.totalCount,
      uniqueNodesTracked: this.nodeRegistry.size
    };
  }
}

export default CountSketchHierarchicalHH;
