/**
 * Hierarchical Navigable Small World (HNSW) Vector Graph with Multi-Probe Beam Search
 * Malkov & Yashunin (2018) "Efficient and robust approximate nearest neighbor search using HNSW graphs"
 *
 * Applications in E-Commerce:
 * 1. Sub-millisecond visual and semantic product search across high-dimensional catalogs.
 * 2. Multi-probe beam search balances recall vs latency.
 * 3. Logarithmic search complexity O(log N) through hierarchical skip-layers.
 */

class HNSWMultiProbeGraph {
  /**
   * @param {Object} options
   * @param {number} [options.dim=16]       - Vector dimension
   * @param {number} [options.M=16]          - Max bidirectional connections per element per layer
   * @param {number} [options.efConstruction=64] - Size of dynamic candidate list during construction
   * @param {number} [options.efSearch=32]   - Size of dynamic candidate list during search
   * @param {number} [options.mL=0.62]       - Normalization factor for level generation (1 / ln(M))
   */
  constructor(options = {}) {
    this.dim = Math.max(2, options.dim || 16);
    this.M = Math.max(4, options.M || 16);
    this.M0 = 2 * this.M; // Max connections for bottom layer 0
    this.efConstruction = options.efConstruction || 64;
    this.efSearch = options.efSearch || 32;
    this.mL = options.mL || (1 / Math.log(this.M));

    this.nodes = new Map(); // id -> { id, vector, level, metadata }
    this.layers = [];       // level -> Map(id -> Set(neighborIds))
    this.enterPoint = null; // id of current top entry point
    this.maxLevel = -1;
  }

  /**
   * Euclidean distance squared
   * @param {Array<number>} v1
   * @param {Array<number>} v2
   * @returns {number}
   */
  _dist(v1, v2) {
    let sum = 0;
    const len = Math.min(v1.length, v2.length);
    for (let i = 0; i < len; i++) {
      const diff = v1[i] - v2[i];
      sum += diff * diff;
    }
    return sum;
  }

  /**
   * Sample random level from exponential distribution
   * @returns {number}
   */
  _randomLevel() {
    let r = Math.random();
    while (r === 0) r = Math.random();
    return Math.floor(-Math.log(r) * this.mL);
  }

  /**
   * Search layer using greedy / beam search
   * @param {Array<number>} query
   * @param {Array<string>} entryPoints
   * @param {number} ef - Number of nearest neighbors to track
   * @param {number} level
   * @returns {Array<{id: string, dist: number}>}
   */
  _searchLayer(query, entryPoints, ef, level) {
    const visited = new Set(entryPoints);
    const candidates = []; // min-heap simulation (sorted by dist ascending)
    const results = [];    // max-heap simulation (sorted by dist descending)

    for (const ep of entryPoints) {
      const node = this.nodes.get(ep);
      if (!node) continue;
      const d = this._dist(query, node.vector);
      candidates.push({ id: ep, dist: d });
      results.push({ id: ep, dist: d });
    }

    candidates.sort((a, b) => a.dist - b.dist);
    results.sort((a, b) => b.dist - a.dist);

    const layerAdj = this.layers[level];

    while (candidates.length > 0) {
      const curr = candidates.shift();
      const furthestResultDist = results[0]?.dist || Infinity;

      if (curr.dist > furthestResultDist) break;

      const neighbors = layerAdj?.get(curr.id) || new Set();
      for (const neighborId of neighbors) {
        if (!visited.has(neighborId)) {
          visited.add(neighborId);
          const neighborNode = this.nodes.get(neighborId);
          if (!neighborNode) continue;

          const d = this._dist(query, neighborNode.vector);
          const maxDist = results[0]?.dist || Infinity;

          if (d < maxDist || results.length < ef) {
            candidates.push({ id: neighborId, dist: d });
            results.push({ id: neighborId, dist: d });

            candidates.sort((a, b) => a.dist - b.dist);
            results.sort((a, b) => b.dist - a.dist);

            if (results.length > ef) {
              results.shift(); // remove furthest
            }
          }
        }
      }
    }

    return results.sort((a, b) => a.dist - b.dist);
  }

  /**
   * Insert vector into HNSW graph
   * @param {string} id
   * @param {Array<number>} vector
   * @param {Object} [metadata]
   */
  add(id, vector, metadata = {}) {
    const nodeId = String(id);
    const level = this._randomLevel();

    while (this.layers.length <= level) {
      this.layers.push(new Map());
    }

    const newNode = { id: nodeId, vector, level, metadata };
    this.nodes.set(nodeId, newNode);

    if (this.enterPoint === null) {
      this.enterPoint = nodeId;
      this.maxLevel = level;
      for (let l = 0; l <= level; l++) {
        this.layers[l].set(nodeId, new Set());
      }
      return;
    }

    let currObj = this.enterPoint;
    const epNode = this.nodes.get(currObj);
    let currDist = this._dist(vector, epNode.vector);

    // 1. Greedy zoom through top levels down to insertion level
    for (let l = this.maxLevel; l > level; l--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = this.layers[l]?.get(currObj) || new Set();
        for (const neighborId of neighbors) {
          const nNode = this.nodes.get(neighborId);
          if (!nNode) continue;
          const d = this._dist(vector, nNode.vector);
          if (d < currDist) {
            currDist = d;
            currObj = neighborId;
            changed = true;
          }
        }
      }
    }

    // 2. Beam search and connect neighbors from min(level, maxLevel) down to 0
    let enterPoints = [currObj];
    const topL = Math.min(level, this.maxLevel);

    for (let l = topL; l >= 0; l--) {
      const candidates = this._searchLayer(vector, enterPoints, this.efConstruction, l);
      const maxConn = l === 0 ? this.M0 : this.M;
      const selected = candidates.slice(0, maxConn);

      if (!this.layers[l].has(nodeId)) {
        this.layers[l].set(nodeId, new Set());
      }

      for (const neighbor of selected) {
        this.layers[l].get(nodeId).add(neighbor.id);
        if (!this.layers[l].has(neighbor.id)) {
          this.layers[l].set(neighbor.id, new Set());
        }
        this.layers[l].get(neighbor.id).add(nodeId);

        // Prune connections if exceeded
        if (this.layers[l].get(neighbor.id).size > maxConn) {
          const nbrList = Array.from(this.layers[l].get(neighbor.id));
          nbrList.pop();
          this.layers[l].set(neighbor.id, new Set(nbrList));
        }
      }

      enterPoints = selected.map(s => s.id);
    }

    if (level > this.maxLevel) {
      this.maxLevel = level;
      this.enterPoint = nodeId;
    }
  }

  /**
   * Search for K nearest neighbors using multi-probe beam search
   * @param {Array<number>} queryVector
   * @param {number} [k=5]
   * @returns {Array<{id: string, distance: number, metadata: Object}>}
   */
  search(queryVector, k = 5) {
    if (this.enterPoint === null) return [];

    let currObj = this.enterPoint;
    const epNode = this.nodes.get(currObj);
    let currDist = this._dist(queryVector, epNode.vector);

    // Zoom down to level 0
    for (let l = this.maxLevel; l > 0; l--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = this.layers[l]?.get(currObj) || new Set();
        for (const neighborId of neighbors) {
          const nNode = this.nodes.get(neighborId);
          if (!nNode) continue;
          const d = this._dist(queryVector, nNode.vector);
          if (d < currDist) {
            currDist = d;
            currObj = neighborId;
            changed = true;
          }
        }
      }
    }

    // Search bottom layer 0 with efSearch candidates
    const candidates = this._searchLayer(queryVector, [currObj], Math.max(k, this.efSearch), 0);

    return candidates.slice(0, k).map(c => {
      const node = this.nodes.get(c.id);
      return {
        id: c.id,
        distance: Math.round(Math.sqrt(c.dist) * 1000) / 1000,
        metadata: node?.metadata || {},
      };
    });
  }

  /**
   * Graph metrics
   */
  getStats() {
    return {
      totalNodes: this.nodes.size,
      maxLevel: this.maxLevel,
      layersCount: this.layers.length,
      M: this.M,
      efSearch: this.efSearch,
    };
  }
}

export { HNSWMultiProbeGraph };
export default HNSWMultiProbeGraph;
