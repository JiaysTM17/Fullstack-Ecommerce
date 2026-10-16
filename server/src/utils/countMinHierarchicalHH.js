/**
 * Count-Min Hierarchical Heavy Hitters (CountMinHierarchicalHH)
 * 
 * Based on foundational research:
 * - Graham Cormode, Shan Muthukrishnan (ACM TODS 2005 / VLDB 2008):
 *   "Hierarchical Heavy Hitters in Data Streams"
 * - Graham Cormode, Minos Garofalakis, Peter J. Haas, Chris Jermaine (Foundations and Trends in Databases 2012):
 *   "Synopses for Massive Data: Samples, Histograms, Wavelets, Sketches"
 * 
 * Mathematical Foundations:
 * - In E-Commerce product taxonomies (e.g., Electronics -> Audio -> Headphones -> Wireless ANC),
 *   identifying hotspots at multiple levels of granularity without double-counting is critical.
 * - An item path has depth L: [node_0, node_1, ..., node_L] where node_0 is root and node_L is leaf SKU.
 * - For each tree depth l in 0..L, a separate Count-Min Sketch synopses is maintained:
 *   width w = ceil(e / epsilon), depth d = ceil(ln(1 / delta)).
 * - Insertion Rule:
 *   For an incoming transaction with prefix path u at level l:
 *   CMS_l.update(u, weight) for all l in 0..L.
 * - Hierarchical Heavy Hitter (HHH) Condition:
 *   Bottom-up recursive extraction from level L down to level 0:
 *   f_cond(u) = f_est(u) - sum_{v in HHH_Descendants(u)} f_cond(v)
 *   Node u is declared a Hierarchical Heavy Hitter if and only if:
 *   f_cond(u) >= phi * N (support threshold).
 * - Guarantees:
 *   - No parent node falsely masks its children.
 *   - Guaranteed 0 false negatives with point query accuracy epsilon * N.
 *   - Space complexity O(L * (1 / epsilon) * log(1 / delta)).
 */

export class CountMinHierarchicalHH {
  /**
   * @param {Object} [options]
   * @param {number} [options.epsilon=0.01] Additive error factor (0 < epsilon < 0.2)
   * @param {number} [options.delta=0.05] Failure probability (0 < delta < 0.5)
   * @param {number} [options.maxDepth=4] Maximum hierarchy taxonomy depth L
   * @param {number} [options.support=0.05] Minimum support threshold phi (phi >= epsilon)
   */
  constructor(options = {}) {
    this.epsilon = Math.max(0.001, Math.min(0.2, Number(options.epsilon || 0.01)));
    this.delta = Math.max(0.001, Math.min(0.5, Number(options.delta || 0.05)));
    this.maxDepth = Math.max(1, Math.min(8, Math.floor(options.maxDepth || 4)));
    this.support = Math.max(this.epsilon, Math.min(0.5, Number(options.support || 0.05)));

    this.width = Math.max(16, Math.ceil(Math.E / this.epsilon));
    this.depth = Math.max(2, Math.ceil(Math.log(1.0 / this.delta)));

    // Distinct Count-Min sketch per depth level: Array<Array<Int32Array>>
    this.sketches = [];
    for (let l = 0; l <= this.maxDepth; l++) {
      const levelTables = [];
      for (let d = 0; d < this.depth; d++) {
        levelTables.push(new Int32Array(this.width));
      }
      this.sketches.push(levelTables);
    }

    // Set of observed node paths for exact HHH extraction
    this.observedPathsByLevel = Array.from({ length: this.maxDepth + 1 }, () => new Set());
    this.totalProcessed = 0;
  }

  /**
   * Hash function for sketch indexing
   * @private
   */
  _hash(str, seed) {
    let h = 2166136261 ^ seed;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % this.width;
  }

  /**
   * Normalizes hierarchy path into array of prefix nodes
   * @param {string|Array<string>} pathInput 
   * @returns {Array<string>}
   */
  normalizePath(pathInput) {
    if (Array.isArray(pathInput)) {
      return pathInput.map(p => String(p).trim()).filter(Boolean).slice(0, this.maxDepth + 1);
    }
    const raw = String(pathInput || "").trim();
    if (!raw) return [];
    return raw.split(/[/>:]/).map(s => s.trim()).filter(Boolean).slice(0, this.maxDepth + 1);
  }

  /**
   * Adds an item taxonomy hierarchy path into the multi-level Count-Min sketches
   * @param {string|Array<string>} path 
   * @param {number} [weight=1] 
   */
  add(path, weight = 1) {
    const nodes = this.normalizePath(path);
    if (nodes.length === 0) return;

    const w = Math.max(1, Math.floor(Number(weight) || 1));
    this.totalProcessed += w;

    // Track prefix hierarchy at each depth
    let currentPrefix = "";
    for (let l = 0; l < nodes.length; l++) {
      currentPrefix = currentPrefix ? `${currentPrefix}/${nodes[l]}` : nodes[l];
      this.observedPathsByLevel[l].add(currentPrefix);

      const levelTables = this.sketches[l];
      for (let d = 0; d < this.depth; d++) {
        const idx = this._hash(currentPrefix, d * 31 + 17);
        levelTables[d][idx] += w;
      }
    }
  }

  /**
   * Batch adds multiple paths
   * @param {Array<string|Array<string>>} items 
   */
  addAll(items) {
    if (!Array.isArray(items)) return;
    for (let i = 0; i < items.length; i++) {
      this.add(items[i]);
    }
  }

  /**
   * Estimates aggregate frequency of a specific taxonomy prefix
   * @param {string|Array<string>} path 
   * @returns {number}
   */
  estimateFrequency(path) {
    const nodes = this.normalizePath(path);
    if (nodes.length === 0) return 0;

    const level = nodes.length - 1;
    if (level > this.maxDepth || !this.sketches[level]) return 0;

    const prefix = nodes.join("/");
    const levelTables = this.sketches[level];
    let minEst = Infinity;

    for (let d = 0; d < this.depth; d++) {
      const idx = this._hash(prefix, d * 31 + 17);
      minEst = Math.min(minEst, levelTables[d][idx]);
    }

    return minEst === Infinity ? 0 : minEst;
  }

  /**
   * Bottom-Up extraction of Hierarchical Heavy Hitters with conditioned frequencies
   * @param {number} [customSupport=this.support] 
   * @returns {Array<{ path: string, level: number, estimatedFreq: number, conditionedFreq: number, supportPct: number }>}
   */
  getHierarchicalHeavyHitters(customSupport = this.support) {
    const s = Math.max(this.epsilon, Math.min(1.0, Number(customSupport) || this.support));
    const threshold = s * this.totalProcessed;
    const hhhResults = [];
    const hhhDescendantsMap = new Map(); // path -> total conditioned freq of chosen descendants

    // Process bottom-up from maxDepth down to 0
    for (let l = this.maxDepth; l >= 0; l--) {
      const pathsAtLevel = Array.from(this.observedPathsByLevel[l] || []);

      for (const p of pathsAtLevel) {
        const rawEst = this.estimateFrequency(p);
        const descContribution = hhhDescendantsMap.get(p) || 0;
        const conditionedFreq = Math.max(0, rawEst - descContribution);

        if (conditionedFreq >= threshold && conditionedFreq > 0) {
          const supportPct = this.totalProcessed > 0
            ? Number(((conditionedFreq / this.totalProcessed) * 100).toFixed(2))
            : 0;

          hhhResults.push({
            path: p,
            level: l,
            estimatedFreq: rawEst,
            conditionedFreq,
            supportPct
          });

          // Propagate contribution to all proper ancestors of p
          const parts = p.split("/");
          let ancestor = "";
          for (let a = 0; a < parts.length - 1; a++) {
            ancestor = ancestor ? `${ancestor}/${parts[a]}` : parts[a];
            const prev = hhhDescendantsMap.get(ancestor) || 0;
            hhhDescendantsMap.set(ancestor, prev + conditionedFreq);
          }
        }
      }
    }

    // Sort by level (deepest first), then by conditioned frequency descending
    return hhhResults.sort((a, b) => b.level - a.level || b.conditionedFreq - a.conditionedFreq);
  }

  /**
   * Merges another CountMinHierarchicalHH sketch into this instance
   * @param {CountMinHierarchicalHH} other 
   */
  merge(other) {
    if (!other || !(other instanceof CountMinHierarchicalHH)) return;
    if (this.width !== other.width || this.depth !== other.depth) return;

    const commonDepth = Math.min(this.maxDepth, other.maxDepth);
    for (let l = 0; l <= commonDepth; l++) {
      for (let d = 0; d < this.depth; d++) {
        for (let w = 0; w < this.width; w++) {
          this.sketches[l][d][w] += other.sketches[l][d][w];
        }
      }
      for (const p of other.observedPathsByLevel[l]) {
        this.observedPathsByLevel[l].add(p);
      }
    }

    this.totalProcessed += other.totalProcessed;
  }

  /**
   * Diagnostic telemetry
   * @returns {Object}
   */
  getTelemetry() {
    let totalObservedNodes = 0;
    for (let l = 0; l <= this.maxDepth; l++) {
      totalObservedNodes += this.observedPathsByLevel[l].size;
    }

    return {
      algorithm: "CountMinHierarchicalHH",
      epsilon: this.epsilon,
      delta: this.delta,
      width: this.width,
      depth: this.depth,
      maxDepth: this.maxDepth,
      support: this.support,
      totalProcessed: this.totalProcessed,
      totalObservedNodes,
      activeLevels: this.sketches.length
    };
  }
}

export default CountMinHierarchicalHH;
