/**
 * Johnson's Algorithm for All-Pairs Shortest Paths across SPX Multi-Hub Nationwide Logistics Network
 * 
 * Thuật toán Johnson Tìm Đường Đi Ngắn Nhất Giữa Mọi Cặp Đỉnh O(V^2 log V + V * E):
 * 1. Giải quyết bài toán ma trận thời gian và chi phí vận chuyển liên bưu cục/SOC toàn quốc:
 *    - Bắc Ninh Mega SOC, Củ Chi Mega SOC, Đà Nẵng SOC, Cần Thơ SOC, Hải Phòng Hub, Vinh Hub.
 * 2. Kỹ thuật Gán lại Trọng số (Reweighting Technique):
 *    - Thêm đỉnh ảo q nối tới tất cả các đỉnh với trọng số 0.
 *    - Chạy Bellman-Ford từ q để tính hàm thế năng h(u) cho mỗi đỉnh.
 *    - Biến đổi trọng số cạnh: w'(u, v) = w(u, v) + h(u) - h(v) >= 0 (Triệt tiêu toàn bộ trọng số âm, bảo toàn đường đi ngắn nhất).
 * 3. Chạy Dijkstra từ mỗi đỉnh trên đồ thị trọng số mới w' để tính ma trận khoảng cách toàn sàn.
 */

export class JohnsonGraphRouting {
  constructor() {
    this.vertices = new Set();
    this.edges = []; // { u, v, weight, hubNameU, hubNameV }
  }

  addHub(hubId) {
    if (hubId) this.vertices.add(String(hubId));
  }

  addRoute(from, to, weight, meta = {}) {
    const u = String(from);
    const v = String(to);
    this.vertices.add(u);
    this.vertices.add(v);

    this.edges.push({
      u,
      v,
      weight: Number(weight),
      meta
    });
  }

  /**
   * Chạy thuật toán Johnson
   * @returns {Object} Ma trận khoảng cách giữa mọi cặp đỉnh và trạng thái
   */
  computeAllPairsShortestPaths() {
    const vertexList = Array.from(this.vertices);
    const n = vertexList.length;

    if (n === 0) {
      return { distances: {}, hasNegativeCycle: false, hubCount: 0 };
    }

    // Bước 1: Thêm đỉnh ảo q
    const q = "__VIRTUAL_SOURCE_Q__";
    const augmentedEdges = [...this.edges];
    for (const v of vertexList) {
      augmentedEdges.push({ u: q, v, weight: 0 });
    }

    const allVerticesWithQ = [...vertexList, q];
    const h = {};
    for (const v of allVerticesWithQ) {
      h[v] = Infinity;
    }
    h[q] = 0;

    // Bước 2: Chạy Bellman-Ford từ q trên đồ thị mở rộng
    for (let i = 1; i <= allVerticesWithQ.length - 1; i++) {
      let changed = false;
      for (const edge of augmentedEdges) {
        if (h[edge.u] !== Infinity && h[edge.u] + edge.weight < h[edge.v]) {
          h[edge.v] = h[edge.u] + edge.weight;
          changed = true;
        }
      }
      if (!changed) break;
    }

    // Kiểm tra chu trình âm
    for (const edge of augmentedEdges) {
      if (h[edge.u] !== Infinity && h[edge.u] + edge.weight < h[edge.v]) {
        return {
          distances: {},
          hasNegativeCycle: true,
          message: "LỖI: Phát hiện chu trình âm trong mạng lưới giao vận. Không thể tính toán đường đi tối ưu!"
        };
      }
    }

    // Bước 3: Tạo đồ thị kề với trọng số mới w'(u, v) = w(u, v) + h(u) - h(v) >= 0
    const adj = new Map();
    for (const v of vertexList) {
      adj.set(v, []);
    }

    for (const edge of this.edges) {
      const reweighted = edge.weight + h[edge.u] - h[edge.v];
      adj.get(edge.u).push({
        to: edge.v,
        weight: Math.max(0, reweighted), // Đảm bảo không âm do sai số float
        originalWeight: edge.weight
      });
    }

    // Bước 4: Chạy Dijkstra từ mỗi đỉnh
    const allPairsDist = {};

    for (const u of vertexList) {
      allPairsDist[u] = {};
      const dHat = {};
      const visited = new Set();

      for (const v of vertexList) {
        dHat[v] = Infinity;
      }
      dHat[u] = 0;

      for (let iter = 0; iter < n; iter++) {
        // Tìm đỉnh chưa thăm có dHat nhỏ nhất
        let minNode = null;
        let minDist = Infinity;

        for (const v of vertexList) {
          if (!visited.has(v) && dHat[v] < minDist) {
            minDist = dHat[v];
            minNode = v;
          }
        }

        if (minNode === null || minDist === Infinity) break;
        visited.add(minNode);

        for (const neighbor of adj.get(minNode)) {
          if (!visited.has(neighbor.to)) {
            const newDist = dHat[minNode] + neighbor.weight;
            if (newDist < dHat[neighbor.to]) {
              dHat[neighbor.to] = newDist;
            }
          }
        }
      }

      // Khôi phục khoảng cách thực tế: d(u, v) = d'(u, v) - h(u) + h(v)
      for (const v of vertexList) {
        if (dHat[v] === Infinity) {
          allPairsDist[u][v] = Infinity;
        } else {
          allPairsDist[u][v] = Number((dHat[v] - h[u] + h[v]).toFixed(2));
        }
      }
    }

    return {
      distances: allPairsDist,
      hasNegativeCycle: false,
      hubCount: n,
      hValues: h
    };
  }

  /**
   * Tra cứu chi phí/thời gian nhanh nhất giữa 2 hub bất kỳ
   * @param {string} fromHub
   * @param {string} toHub
   * @returns {number}
   */
  getShortestDistance(fromHub, toHub) {
    const result = this.computeAllPairsShortestPaths();
    if (result.hasNegativeCycle) return Infinity;
    return result.distances[fromHub]?.[toHub] ?? Infinity;
  }
}

export default {
  JohnsonGraphRouting
};
