/**
 * Push-Relabel (Preflow-Push with Highest-Label Heuristic) Maximum Flow Algorithm
 * Goldberg & Tarjan (1988)
 *
 * Applications in E-Commerce:
 * 1. Ultra-high-throughput traffic dispatching during Mega Flash Sale campaigns (11.11, 12.12).
 * 2. Optimal routing of millions of API requests from ingress gateways across microservices (Cart, Order, Payment, Catalog)
 *    respecting rate caps and node bandwidth capacities.
 * 3. Complexity: O(V^2 * sqrt(E)) or O(V^3), far superior to augmenting-path algorithms (Edmonds-Karp O(V*E^2)) on dense networks.
 */

class Edge {
  constructor(to, rev, capacity) {
    this.to = to;
    this.rev = rev;
    this.capacity = capacity;
    this.flow = 0;
  }
}

class PushRelabelMaxFlow {
  constructor() {
    this.nodeMap = new Map(); // name -> index
    this.nodeNames = [];     // index -> name
    this.adj = [];           // index -> Array<Edge>
  }

  /**
   * Get or register node index
   * @param {string} name
   * @returns {number}
   */
  _getNodeIndex(name) {
    const key = String(name);
    if (!this.nodeMap.has(key)) {
      const idx = this.nodeNames.length;
      this.nodeMap.set(key, idx);
      this.nodeNames.push(key);
      this.adj.push([]);
    }
    return this.nodeMap.get(key);
  }

  /**
   * Add a directed edge with capacity
   * @param {string} from
   * @param {string} to
   * @param {number} capacity
   */
  addEdge(from, to, capacity) {
    if (capacity <= 0) return;
    const u = this._getNodeIndex(from);
    const v = this._getNodeIndex(to);

    const a = new Edge(v, this.adj[v].length, capacity);
    const b = new Edge(u, this.adj[u].length, 0); // reverse residual edge

    this.adj[u].push(a);
    this.adj[v].push(b);
  }

  /**
   * Compute maximum flow from source to sink using Highest-Label Preflow-Push
   * @param {string} sourceName
   * @param {string} sinkName
   * @returns {Object} { maxFlow, activeEdges, bottlenecks, stats }
   */
  computeMaxFlow(sourceName, sinkName) {
    const s = this.nodeMap.get(String(sourceName));
    const t = this.nodeMap.get(String(sinkName));

    if (s === undefined || t === undefined || s === t) {
      return { maxFlow: 0, activeEdges: [], bottlenecks: [], stats: { nodes: this.nodeNames.length } };
    }

    const n = this.nodeNames.length;
    const height = Array(n).fill(0);
    const excess = Array(n).fill(0);
    const count = Array(2 * n + 1).fill(0); // For gap relabeling heuristic

    height[s] = n;
    count[n] = 1;
    count[0] = n - 1;

    // Push initial preflow from source
    for (const edge of this.adj[s]) {
      if (edge.capacity > 0) {
        const flow = edge.capacity;
        edge.flow += flow;
        this.adj[edge.to][edge.rev].flow -= flow;
        excess[edge.to] += flow;
        excess[s] -= flow;
      }
    }

    // Active nodes bucketed by height for Highest-Label heuristic
    const activeBuckets = Array.from({ length: 2 * n + 1 }, () => []);
    const inBucket = Array(n).fill(false);
    let maxHeight = 0;

    const enqueue = (u) => {
      if (!inBucket[u] && u !== s && u !== t && excess[u] > 0) {
        inBucket[u] = true;
        const h = height[u];
        activeBuckets[h].push(u);
        if (h > maxHeight) maxHeight = h;
      }
    };

    for (let i = 0; i < n; i++) {
      if (i !== s && i !== t && excess[i] > 0) {
        enqueue(i);
      }
    }

    // Push operation
    const push = (u, edge) => {
      const v = edge.to;
      const send = Math.min(excess[u], edge.capacity - edge.flow);
      if (send <= 0) return;

      edge.flow += send;
      this.adj[v][edge.rev].flow -= send;
      excess[u] -= send;
      excess[v] += send;

      enqueue(v);
    };

    // Relabel operation
    const relabel = (u) => {
      count[height[u]]--;
      let minH = Infinity;
      for (const edge of this.adj[u]) {
        if (edge.capacity - edge.flow > 0 && height[edge.to] < minH) {
          minH = height[edge.to];
        }
      }
      height[u] = minH < Infinity ? minH + 1 : 2 * n;
      count[height[u]] = (count[height[u]] || 0) + 1;
      enqueue(u);
    };

    let pushCount = 0;
    let relabelCount = 0;

    // Main preflow loop
    while (maxHeight >= 0) {
      if (activeBuckets[maxHeight].length === 0) {
        maxHeight--;
        continue;
      }

      const u = activeBuckets[maxHeight].pop();
      inBucket[u] = false;

      // Discharge node u
      while (excess[u] > 0) {
        let pushed = false;
        for (const edge of this.adj[u]) {
          if (edge.capacity - edge.flow > 0 && height[u] === height[edge.to] + 1) {
            push(u, edge);
            pushCount++;
            pushed = true;
            if (excess[u] === 0) break;
          }
        }

        if (!pushed) {
          relabel(u);
          relabelCount++;
          break; // height increased, move to proper bucket
        }
      }
    }

    const maxFlow = excess[t];

    // Extract active routes and saturated bottlenecks
    const activeEdges = [];
    const bottlenecks = [];

    for (let u = 0; u < n; u++) {
      for (const edge of this.adj[u]) {
        if (edge.capacity > 0 && edge.flow > 0) {
          const uName = this.nodeNames[u];
          const vName = this.nodeNames[edge.to];
          activeEdges.push({
            from: uName,
            to: vName,
            flow: edge.flow,
            capacity: edge.capacity,
            utilizationPercent: Math.round((edge.flow / edge.capacity) * 100),
          });

          if (edge.flow === edge.capacity) {
            bottlenecks.push({ from: uName, to: vName, capacity: edge.capacity });
          }
        }
      }
    }

    return {
      maxFlow,
      activeEdges,
      bottlenecks,
      stats: {
        totalNodes: n,
        pushCount,
        relabelCount,
      },
    };
  }
}

export { PushRelabelMaxFlow };
export default PushRelabelMaxFlow;
