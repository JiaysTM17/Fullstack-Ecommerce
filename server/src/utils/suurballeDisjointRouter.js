/**
 * suurballeDisjointRouter.js - Định Tuyến Hai Đường Đi Không Trùng Cạnh/Đỉnh Suurballe Dự Phòng Sự Cố SPX Express
 * 
 * NGUYÊN LÝ TOÁN HỌC & ĐỘ PHỨC TẠP:
 * 1. Bài toán Định tuyến Dự phòng An toàn (Fault-Tolerant Routing):
 *    - Trong chuỗi cung ứng logistics toàn quốc, nếu một tuyến đường cao tốc hoặc trạm trung chuyển
 *      bị tắc nghẽn (ngập lụt, sạt lở), hàng hóa cần có hai lộ trình độc lập hoàn toàn (Edge-Disjoint)
 *      sao cho tổng chi phí (quãng đường hoặc thời gian) là nhỏ nhất.
 * 2. Thuật toán Suurballe (J. W. Suurballe 1974):
 *    - Bước 1: Chạy Dijkstra tìm đường đi ngắn nhất P1 từ nguồn s tới đích t.
 *    - Bước 2: Biến đổi trọng số các cạnh bằng hàm thế năng node d(s, u): w'(u, v) = w(u, v) - d(s, v) + d(s, u) >= 0.
 *    - Bước 3: Đảo chiều các cạnh thuộc P1 và gán trọng số 0.
 *    - Bước 4: Chạy Dijkstra lần 2 tìm đường đi ngắn nhất P2 trên đồ thị đã biến đổi.
 *    - Bước 5: Hủy bỏ các cạnh đi ngược chiều nhau giữa P1 và P2, ghép nối thành 2 đường đi độc lập không trùng cạnh.
 * 3. Độ phức tạp:
 *    - 2 lần chạy Dijkstra: O(E + V log V), tối ưu hơn nhiều so với tìm kiếm lặp Min-Cost Flow.
 */

export class SuurballeDisjointRouter {
  constructor() {
    this.nodes = new Set();
    this.adj = new Map(); // nodeId -> [{ to, weight, originalEdge: true/false }]
  }

  addNode(nodeId) {
    this.nodes.add(nodeId);
    if (!this.adj.has(nodeId)) {
      this.adj.set(nodeId, []);
    }
  }

  addEdge(from, to, weight) {
    this.addNode(from);
    this.addNode(to);
    const w = Math.max(0, Number(weight));
    this.adj.get(from).push({ to, weight: w, id: `${from}->${to}` });
  }

  _dijkstra(startNode, endNode, edgeWeightFn) {
    const dist = new Map();
    const prev = new Map();
    const prevEdge = new Map();

    for (const node of this.nodes) {
      dist.set(node, Infinity);
    }
    dist.set(startNode, 0);

    const visited = new Set();
    const unvisited = new Set(this.nodes);

    while (unvisited.size > 0) {
      let u = null;
      let minDist = Infinity;
      for (const node of unvisited) {
        const d = dist.get(node);
        if (d < minDist) {
          minDist = d;
          u = node;
        }
      }

      if (u === null || minDist === Infinity) break;
      if (u === endNode) break;

      unvisited.delete(u);
      visited.add(u);

      const neighbors = this.adj.get(u) || [];
      for (const edge of neighbors) {
        if (visited.has(edge.to)) continue;
        const w = edgeWeightFn ? edgeWeightFn(u, edge) : edge.weight;
        if (w === Infinity || w < 0) continue;

        const alt = dist.get(u) + w;
        if (alt < dist.get(edge.to)) {
          dist.set(edge.to, alt);
          prev.set(edge.to, u);
          prevEdge.set(edge.to, edge);
        }
      }
    }

    if (dist.get(endNode) === Infinity) {
      return null;
    }

    const path = [];
    const edges = [];
    let curr = endNode;
    while (curr !== startNode) {
      path.unshift(curr);
      const edge = prevEdge.get(curr);
      if (edge) edges.unshift({ from: prev.get(curr), to: curr, weight: edge.weight, id: edge.id });
      curr = prev.get(curr);
      if (curr === undefined) return null;
    }
    path.unshift(startNode);

    return {
      distance: dist.get(endNode),
      path,
      edges,
      distMap: dist
    };
  }

  /**
   * Tìm 2 đường đi độc lập không trùng cạnh có tổng chi phí nhỏ nhất
   * @param {string} source - Trạm xuất phát
   * @param {string} target - Trạm đích
   * @returns {{ path1: Array<string>, path2: Array<string>, totalCost: number, disjoint: boolean } | null}
   */
  findTwoDisjointPaths(source, target) {
    if (!this.nodes.has(source) || !this.nodes.has(target) || source === target) {
      return null;
    }

    // Lần 1: Tìm đường ngắn nhất P1
    const p1Result = this._dijkstra(source, target);
    if (!p1Result) return null;

    const p1 = p1Result.path;
    const p1Edges = p1Result.edges;
    const dMap = p1Result.distMap;

    // Tạo tập cạnh P1 dạng set để tra cứu
    const p1EdgeSet = new Set(p1Edges.map(e => `${e.from}->${e.to}`));

    // Xây dựng đồ thị phụ đảo chiều P1 và áp dụng trọng số thế năng:
    // w'(u, v) = w(u, v) - d(v) + d(u)
    const backupAdj = new Map();
    for (const [node, edges] of this.adj.entries()) {
      backupAdj.set(node, edges.map(e => ({ ...e })));
    }

    // Xóa các cạnh của P1 theo chiều xuôi, thêm cạnh ngược với trọng số 0
    for (const e of p1Edges) {
      const fromEdges = this.adj.get(e.from) || [];
      this.adj.set(e.from, fromEdges.filter(edge => edge.to !== e.to));

      if (!this.adj.has(e.to)) this.adj.set(e.to, []);
      this.adj.get(e.to).push({
        to: e.from,
        weight: 0,
        isReversed: true,
        originalWeight: e.weight,
        id: `${e.to}->${e.from}`
      });
    }

    // Hàm tính trọng số biến đổi w' cho Dijkstra lần 2
    const edgeWeightFn = (u, edge) => {
      if (edge.isReversed) return 0;
      const du = dMap.get(u) || 0;
      const dv = dMap.get(edge.to) || 0;
      const redWeight = edge.weight - dv + du;
      return Math.max(0, redWeight);
    };

    // Lần 2: Tìm đường ngắn nhất P2 trên đồ thị biến đổi
    const p2Result = this._dijkstra(source, target, edgeWeightFn);

    // Khôi phục đồ thị gốc
    this.adj = backupAdj;

    if (!p2Result) {
      // Chỉ có 1 đường duy nhất, không tồn tại đường thứ 2 độc lập
      return {
        path1: p1,
        path2: null,
        totalCost: p1Result.distance,
        disjoint: false
      };
    }

    const p2Edges = p2Result.edges;

    // Hủy bỏ các cạnh đi ngược chiều nhau (cạnh bù trừ)
    const activeEdges = [];
    const p2EdgeSet = new Set(p2Edges.map(e => `${e.from}->${e.to}`));

    for (const e of p1Edges) {
      const revKey = `${e.to}->${e.from}`;
      if (!p2EdgeSet.has(revKey)) {
        activeEdges.push({ from: e.from, to: e.to, weight: e.weight });
      }
    }

    for (const e of p2Edges) {
      const revKey = `${e.to}->${e.from}`;
      if (!p1EdgeSet.has(revKey)) {
        // Tìm trọng số gốc nếu có
        let originalWeight = e.weight;
        const origNeighbors = this.adj.get(e.from) || [];
        const orig = origNeighbors.find(item => item.to === e.to);
        if (orig) originalWeight = orig.weight;
        activeEdges.push({ from: e.from, to: e.to, weight: originalWeight });
      }
    }

    // Xây dựng 2 đường đi từ activeEdges xuất phát từ source
    const adjOut = new Map();
    for (const edge of activeEdges) {
      if (!adjOut.has(edge.from)) adjOut.set(edge.from, []);
      adjOut.get(edge.from).push(edge);
    }

    const tracePath = (start) => {
      const p = [start];
      let curr = start;
      let cost = 0;
      while (curr !== target) {
        const outList = adjOut.get(curr);
        if (!outList || outList.length === 0) break;
        const nextEdge = outList.shift();
        curr = nextEdge.to;
        cost += nextEdge.weight;
        p.push(curr);
      }
      return { path: p, cost };
    };

    const first = tracePath(source);
    const second = tracePath(source);

    const validP1 = first.path[first.path.length - 1] === target ? first.path : p1;
    const validP2 = second.path[second.path.length - 1] === target && second.path.length > 1
      ? second.path
      : null;

    // Kiểm tra tính độc lập cạnh giữa validP1 và validP2
    let isDisjoint = false;
    if (validP1 && validP2) {
      const edges1 = new Set();
      for (let i = 0; i < validP1.length - 1; i++) {
        edges1.add(`${validP1[i]}->${validP1[i+1]}`);
      }
      let collision = false;
      for (let i = 0; i < validP2.length - 1; i++) {
        if (edges1.has(`${validP2[i]}->${validP2[i+1]}`)) {
          collision = true;
          break;
        }
      }
      isDisjoint = !collision;
    }

    const cost1 = this._calculatePathCost(validP1);
    const cost2 = validP2 ? this._calculatePathCost(validP2) : 0;

    return {
      path1: validP1,
      path2: validP2,
      totalCost: cost1 + cost2,
      disjoint: isDisjoint
    };
  }

  _calculatePathCost(path) {
    if (!path || path.length < 2) return 0;
    let cost = 0;
    for (let i = 0; i < path.length - 1; i++) {
      const u = path[i];
      const v = path[i + 1];
      const neighbors = this.adj.get(u) || [];
      const edge = neighbors.find(e => e.to === v);
      if (edge) cost += edge.weight;
    }
    return cost;
  }
}

export default SuurballeDisjointRouter;
