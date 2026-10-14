/**
 * Dinic's Algorithm for Multi-Source Multi-Sink Fulfillment Network Flow
 * Thuật Toán Dinic Giải Bài Toán Cực Đại Hóa Luồng Hàng Hóa Phân Phối Đa Kho
 * 
 * Ưu điểm vượt trội:
 * - Thay vì tìm từng đường tăng luồng đơn lẻ như Edmonds-Karp O(V E^2),
 *   Dinic sử dụng Đồ thị phân tầng (Level Graph qua BFS) kết hợp Luồng chặn (Blocking Flow qua DFS),
 *   đạt độ phức tạp O(V^2 E) trên đồ thị tổng quát và O(E * sqrt(V)) trên mạng đơn vị / phân đôi.
 * - Giải quyết bài toán phân bổ năng lực xử lý đơn hàng từ M kho xuất hàng (Sources)
 *   qua các trạm trung chuyển (Hubs) đến N bưu cục phát hàng (Sinks),
 *   tối đa hóa thông lượng bưu kiện giao thành công mỗi ngày và phát hiện nút thắt cổ chai (Min-Cut).
 */

class Edge {
  constructor(to, capacity, revIndex, from = null) {
    this.from = from;
    this.to = to;
    this.capacity = capacity;
    this.flow = 0;
    this.revIndex = revIndex; // Chỉ số của cạnh ngược trong danh sách kề của đỉnh `to`
  }
}

export class DinicBipartiteFulfillmentFlow {
  constructor() {
    this.adj = new Map();     // u -> Array<Edge>
    this.nodes = new Set();
    this.level = new Map();   // u -> number (độ sâu trong Level Graph)
    this.ptr = new Map();     // u -> number (con trỏ cạnh đang xét trong DFS)
    this.nodeMetadata = new Map(); // id -> { name, type, capacity }
  }

  /**
   * Đăng ký một nút mạng lưới (Kho, Trung tâm phân loại, hoặc Bưu cục phát)
   * @param {string} id - Mã định danh nút (ví dụ: "HUB_LONG_BIEN", "POST_DONG_DA")
   * @param {Object} [metadata={}]
   */
  addNode(id, metadata = {}) {
    this.nodes.add(id);
    if (!this.adj.has(id)) {
      this.adj.set(id, []);
    }
    this.nodeMetadata.set(id, { id, ...metadata });
  }

  /**
   * Thêm một cạnh luồng có hướng từ u -> v với sức chứa capacity (số kiện hàng/ngày)
   * @param {string} u - Nút nguồn
   * @param {string} v - Nút đích
   * @param {number} capacity - Năng lực vận chuyển hoặc xử lý
   */
  addEdge(u, v, capacity) {
    this.addNode(u);
    this.addNode(v);

    const cap = Math.max(0, Number(capacity) || 0);
    const forwardEdges = this.adj.get(u);
    const backwardEdges = this.adj.get(v);

    const forwardEdge = new Edge(v, cap, backwardEdges.length, u);
    const backwardEdge = new Edge(u, 0, forwardEdges.length, v); // Cạnh ngược ban đầu có capacity = 0

    forwardEdges.push(forwardEdge);
    backwardEdges.push(backwardEdge);
  }

  /**
   * Bước 1: Xây dựng Đồ thị phân tầng (Level Graph) bằng BFS từ nguồn s đến đích t
   * @private
   */
  _bfs(source, sink) {
    this.level.clear();
    for (const node of this.nodes) {
      this.level.set(node, -1);
    }

    const queue = [source];
    this.level.set(source, 0);

    while (queue.length > 0) {
      const u = queue.shift();
      const uLevel = this.level.get(u);
      const edges = this.adj.get(u) || [];

      for (const edge of edges) {
        if (edge.capacity - edge.flow > 0 && this.level.get(edge.to) === -1) {
          this.level.set(edge.to, uLevel + 1);
          queue.push(edge.to);
        }
      }
    }

    return this.level.get(sink) !== -1;
  }

  /**
   * Bước 2: Tìm luồng chặn (Blocking Flow) bằng DFS trên đồ thị phân tầng
   * @private
   */
  _dfs(u, pushed, sink) {
    if (pushed === 0 || u === sink) return pushed;

    const edges = this.adj.get(u) || [];
    let startIdx = this.ptr.get(u) || 0;

    for (let cid = startIdx; cid < edges.length; cid++) {
      this.ptr.set(u, cid);
      const edge = edges[cid];
      const tr = edge.to;

      if (this.level.get(u) + 1 !== this.level.get(tr) || edge.capacity - edge.flow === 0) {
        continue;
      }

      const trPushed = this._dfs(tr, Math.min(pushed, edge.capacity - edge.flow), sink);
      if (trPushed === 0) continue;

      edge.flow += trPushed;
      const revEdge = this.adj.get(edge.to)[edge.revIndex];
      revEdge.flow -= trPushed;

      return trPushed;
    }

    return 0;
  }

  /**
   * Tính toán Luồng Cực Đại (Maximum Flow) bằng thuật toán Dinic
   * @param {string} source - Nút Siêu Nguồn (Super Source)
   * @param {string} sink - Nút Siêu Đích (Super Sink)
   * @returns {Object}
   */
  computeMaxFlow(source, sink) {
    if (!this.nodes.has(source) || !this.nodes.has(sink)) {
      return {
        maxFlow: 0,
        bottlenecks: [],
        flows: []
      };
    }

    // Reset toàn bộ flow về 0
    for (const edges of this.adj.values()) {
      for (const e of edges) {
        e.flow = 0;
      }
    }

    let totalFlow = 0;

    // Trong khi vẫn còn đường tăng luồng trên Level Graph
    while (this._bfs(source, sink)) {
      this.ptr.clear();
      for (const node of this.nodes) {
        this.ptr.set(node, 0);
      }

      let pushed = this._dfs(source, Infinity, sink);
      while (pushed > 0) {
        totalFlow += pushed;
        pushed = this._dfs(source, Infinity, sink);
      }
    }

    // Xác định lát cắt hẹp nhất (Min-Cut / Bottlenecks): các cạnh từ tập tới được S sang tập không tới được T
    const reachableFromSource = new Set();
    const q = [source];
    reachableFromSource.add(source);

    while (q.length > 0) {
      const u = q.shift();
      const edges = this.adj.get(u) || [];
      for (const e of edges) {
        if (e.capacity - e.flow > 0 && !reachableFromSource.has(e.to)) {
          reachableFromSource.add(e.to);
          q.push(e.to);
        }
      }
    }

    const bottlenecks = [];
    const activeFlows = [];

    for (const [u, edges] of this.adj.entries()) {
      for (const e of edges) {
        // Chỉ xét các cạnh xuôi có capacity > 0
        if (e.capacity > 0) {
          activeFlows.push({
            from: u,
            to: e.to,
            flow: e.flow,
            capacity: e.capacity,
            utilizationRate: Number(((e.flow / e.capacity) * 100).toFixed(1))
          });

          // Cạnh thuộc Min-Cut nếu u nằm trong S và e.to không nằm trong S
          if (reachableFromSource.has(u) && !reachableFromSource.has(e.to)) {
            bottlenecks.push({
              from: u,
              to: e.to,
              capacity: e.capacity,
              saturatedFlow: e.flow
            });
          }
        }
      }
    }

    return {
      maxFlow: totalFlow,
      bottlenecks,
      activeFlows,
      reachableNodesCount: reachableFromSource.size
    };
  }
}

export default DinicBipartiteFulfillmentFlow;
