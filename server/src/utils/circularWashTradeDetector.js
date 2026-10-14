/**
 * Circular Wash-Trading & Review Ring Detector
 * Implementation of Donald B. Johnson's Algorithm (1975)
 * "Finding all the elementary circuits of a directed graph", SIAM J. Comput., 4(1), 77-84.
 *
 * Applications in E-Commerce:
 * 1. Detects circular transaction fraud (A -> B -> C -> A) where collaborating shops/buyers
 *    generate fake order loops to inflate GMV, bypass escrow, and exploit platform subsidies.
 * 2. Uncovers Sybil review rings where accounts exchange reciprocal 5-star ratings.
 * 3. Identifies closed money laundering loops across multi-vendor accounts.
 *
 * Time Complexity: O((V + E) * (C + 1)) where C is the number of elementary cycles.
 * Space Complexity: O(V + E)
 */

class CircularWashTradeDetector {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxCycleLength=6]     - Max cycle length to explore
   * @param {number} [options.minCycleLength=2]     - Min cycle length (e.g. A->B->A or A->B->C->A)
   * @param {number} [options.highRiskThreshold=3]  - Threshold of circular loops to flag high risk
   */
  constructor(options = {}) {
    this.maxCycleLength = Math.max(2, options.maxCycleLength || 6);
    this.minCycleLength = Math.max(2, options.minCycleLength || 2);
    this.highRiskThreshold = options.highRiskThreshold || 3;

    // Directed adjacency: Map<string, Set<string>>
    this.adj = new Map();
    // Edge metadata: Map<"from->to", Array<{ amount, timestamp, metadata }>>
    this.edgeMetadata = new Map();
    // Nodes set
    this.nodes = new Set();
  }

  /**
   * Record a directed transaction / interaction from one account to another
   * @param {string} fromId
   * @param {string} toId
   * @param {number} amount - Transaction value in VND
   * @param {Object} [metadata]
   */
  addTransaction(fromId, toId, amount = 0, metadata = {}) {
    const u = String(fromId);
    const v = String(toId);
    if (u === v) return; // Self-loops handled separately if needed

    this.nodes.add(u);
    this.nodes.add(v);

    if (!this.adj.has(u)) this.adj.set(u, new Set());
    this.adj.get(u).add(v);

    const edgeKey = `${u}->${v}`;
    if (!this.edgeMetadata.has(edgeKey)) {
      this.edgeMetadata.set(edgeKey, []);
    }
    this.edgeMetadata.get(edgeKey).push({
      amount: Number(amount) || 0,
      timestamp: Date.now(),
      metadata,
    });
  }

  /**
   * Tarjan's SCC on a subgraph induced by vertices with index >= sIndex
   * @param {Array<string>} vertexList
   * @param {number} sIndex
   * @returns {Array<Set<string>>}
   */
  _getSCCs(vertexList, sIndex) {
    const validNodes = new Set(vertexList.slice(sIndex));
    let index = 0;
    const stack = [];
    const inStack = new Set();
    const indices = new Map();
    const lowlinks = new Map();
    const sccs = [];

    const strongConnect = (v) => {
      indices.set(v, index);
      lowlinks.set(v, index);
      index++;
      stack.push(v);
      inStack.add(v);

      const neighbors = this.adj.get(v) || new Set();
      for (const w of neighbors) {
        if (!validNodes.has(w)) continue;
        if (!indices.has(w)) {
          strongConnect(w);
          lowlinks.set(v, Math.min(lowlinks.get(v), lowlinks.get(w)));
        } else if (inStack.has(w)) {
          lowlinks.set(v, Math.min(lowlinks.get(v), indices.get(w)));
        }
      }

      if (lowlinks.get(v) === indices.get(v)) {
        const scc = new Set();
        let w;
        do {
          w = stack.pop();
          inStack.delete(w);
          scc.add(w);
        } while (w !== v);
        sccs.push(scc);
      }
    };

    for (const v of validNodes) {
      if (!indices.has(v)) {
        strongConnect(v);
      }
    }

    return sccs;
  }

  /**
   * Execute Johnson's cycle finding algorithm
   * @returns {Array<Array<string>>} list of elementary cycles
   */
  findWashTradeCycles() {
    const vertexList = Array.from(this.nodes);
    const n = vertexList.length;
    if (n < this.minCycleLength) return [];

    const cycles = [];
    let sIndex = 0;

    while (sIndex < n) {
      const sccs = this._getSCCs(vertexList, sIndex);

      // Find least vertex index in non-trivial SCC (size > 1)
      let minVertexIndex = n;
      let targetSCC = null;

      for (const scc of sccs) {
        if (scc.size > 1) {
          for (let i = sIndex; i < n; i++) {
            if (scc.has(vertexList[i])) {
              if (i < minVertexIndex) {
                minVertexIndex = i;
                targetSCC = scc;
              }
              break;
            }
          }
        }
      }

      if (targetSCC === null || minVertexIndex >= n) break;

      sIndex = minVertexIndex;
      const s = vertexList[sIndex];

      // Johnson's DFS state
      const blocked = new Set();
      const B = new Map(); // node -> Set of nodes
      const path = [];

      const unblock = (u) => {
        blocked.delete(u);
        const bSet = B.get(u);
        if (bSet) {
          for (const w of bSet) {
            bSet.delete(w);
            if (blocked.has(w)) {
              unblock(w);
            }
          }
        }
      };

      const circuit = (v) => {
        let f = false;
        path.push(v);
        blocked.add(v);

        if (path.length > this.maxCycleLength) {
          path.pop();
          blocked.delete(v);
          return false;
        }

        const neighbors = this.adj.get(v) || new Set();
        for (const w of neighbors) {
          if (!targetSCC.has(w)) continue;

          if (w === s) {
            if (path.length >= this.minCycleLength) {
              cycles.push([...path, s]);
              f = true;
            }
          } else if (!blocked.has(w)) {
            if (circuit(w)) {
              f = true;
            }
          }
        }

        if (f) {
          unblock(v);
        } else {
          for (const w of neighbors) {
            if (!targetSCC.has(w)) continue;
            if (!B.has(w)) B.set(w, new Set());
            B.get(w).add(v);
          }
        }

        path.pop();
        return f;
      };

      circuit(s);
      sIndex++;
    }

    return cycles;
  }

  /**
   * Calculate financial risk metrics for a detected circular wash ring
   * @param {Array<string>} cycle
   * @returns {Object}
   */
  evaluateRingRisk(cycle) {
    if (!cycle || cycle.length < 2) return null;

    let totalVolume = 0;
    let minEdgeVolume = Infinity;
    const ringNodes = cycle.slice(0, -1);

    for (let i = 0; i < cycle.length - 1; i++) {
      const u = cycle[i];
      const v = cycle[i + 1];
      const key = `${u}->${v}`;
      const records = this.edgeMetadata.get(key) || [];
      const edgeSum = records.reduce((sum, r) => sum + r.amount, 0);

      totalVolume += edgeSum;
      if (edgeSum < minEdgeVolume) minEdgeVolume = edgeSum;
    }

    const ringLength = ringNodes.length;
    const volumeBalanceRatio = totalVolume > 0 ? (minEdgeVolume * ringLength) / totalVolume : 1.0;
    const riskScore = Math.min(
      100,
      Math.round(
        (ringLength >= 3 ? 40 : 25) +
        Math.min(30, (totalVolume / 1000000) * 5) +
        (volumeBalanceRatio > 0.7 ? 30 : 15)
      )
    );

    return {
      cycleNodes: ringNodes,
      ringLength,
      totalVolume,
      minEdgeVolume: minEdgeVolume === Infinity ? 0 : minEdgeVolume,
      volumeBalanceRatio: Math.round(volumeBalanceRatio * 100) / 100,
      riskScore,
      isHighRisk: riskScore >= 70,
    };
  }

  /**
   * Scan network and return high-risk circular rings
   * @returns {Array<Object>}
   */
  getFlaggedRings() {
    const rawCycles = this.findWashTradeCycles();
    const evaluated = rawCycles.map(c => this.evaluateRingRisk(c)).filter(Boolean);
    return evaluated.sort((a, b) => b.riskScore - a.riskScore);
  }

  /**
   * System summary statistics
   */
  getStats() {
    return {
      totalAccounts: this.nodes.size,
      totalTransactions: Array.from(this.edgeMetadata.values()).reduce((s, arr) => s + arr.length, 0),
      maxCycleLength: this.maxCycleLength,
    };
  }
}

export { CircularWashTradeDetector };
export default CircularWashTradeDetector;
