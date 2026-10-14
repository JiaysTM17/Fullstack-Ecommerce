/**
 * simRankGraphSimilarity.js - Thuật Toán SimRank Đo Lường Độ Tương Đồng Cấu Trúc Đồ Thị TMĐT
 * 
 * NGUYÊN LÝ TOÁN HỌC (Jeh & Widom 2002):
 * 1. Triết lý SimRank: "Hai đối tượng tương đồng nhau nếu chúng được liên kết bởi các đối tượng tương đồng".
 * 2. Công thức lặp điểm bất động (Fixed-point Iteration):
 *    - s(u, u) = 1
 *    - s(u, v) = (C / (|I(u)| * |I(v)|)) * SUM_{x in I(u)} SUM_{y in I(v)} s(x, y)  (với u != v)
 *    với I(u) là tập các láng giềng đến (in-neighbors) của u, C là hằng số suy giảm (decay factor, mặc định 0.8).
 * 3. Ứng dụng trong TMĐT:
 *    - Đồ thị lưỡng phân Người dùng - Sản phẩm (User-Item Bipartite Graph):
 *      Tính toán độ tương đồng giữa 2 sản phẩm dựa trên tập người mua chung,
 *      hoặc giữa 2 shop dựa trên tệp khách hàng mua sắm tương tự.
 */

export class SimRankGraphSimilarity {
  /**
   * @param {Object} options
   * @param {number} [options.decayFactor=0.8] - Hằng số phân rã C in (0, 1)
   * @param {number} [options.maxIterations=5] - Số vòng lặp hội tụ
   * @param {number} [options.tolerance=0.001] - Ngưỡng dừng sai số Frobenius
   */
  constructor({ decayFactor = 0.8, maxIterations = 5, tolerance = 0.001 } = {}) {
    this.decayFactor = Math.max(0.1, Math.min(0.99, decayFactor));
    this.maxIterations = Math.max(1, maxIterations);
    this.tolerance = tolerance;
    this.inNeighbors = new Map(); // nodeId -> Set(in-neighbor nodes)
    this.nodes = new Set();
    this.simMatrix = new Map();   // nodeA -> Map(nodeB -> score)
  }

  /**
   * Thêm một cạnh có hướng từ `fromNode` đến `toNode` (ví dụ: User -> Product)
   * @param {string} fromNode
   * @param {string} toNode
   */
  addEdge(fromNode, toNode) {
    if (!fromNode || !toNode) return;
    this.nodes.add(fromNode);
    this.nodes.add(toNode);

    if (!this.inNeighbors.has(toNode)) {
      this.inNeighbors.set(toNode, new Set());
    }
    this.inNeighbors.get(toNode).add(fromNode);
  }

  addBipartiteEdge(nodeA, nodeB) {
    this.addEdge(nodeA, nodeB);
    this.addEdge(nodeB, nodeA);
  }

  /**
   * Tính toán ma trận SimRank cho toàn bộ các nút
   * @returns {{ iterationsRun: number, converged: boolean }}
   */
  compute() {
    const nodeList = Array.from(this.nodes);
    const n = nodeList.length;

    // Khởi tạo ma trận: S_0(u, u) = 1, S_0(u, v) = 0
    let currentSim = new Map();
    for (const u of nodeList) {
      currentSim.set(u, new Map());
      for (const v of nodeList) {
        currentSim.get(u).set(v, u === v ? 1.0 : 0.0);
      }
    }

    let iterationsRun = 0;
    let converged = false;

    for (let it = 0; it < this.maxIterations; it++) {
      iterationsRun++;
      const nextSim = new Map();
      let maxDiff = 0;

      for (let i = 0; i < n; i++) {
        const u = nodeList[i];
        nextSim.set(u, new Map());

        for (let j = 0; j < n; j++) {
          const v = nodeList[j];
          if (u === v) {
            nextSim.get(u).set(v, 1.0);
            continue;
          }

          const inU = Array.from(this.inNeighbors.get(u) || []);
          const inV = Array.from(this.inNeighbors.get(v) || []);

          if (inU.length === 0 || inV.length === 0) {
            nextSim.get(u).set(v, 0.0);
            continue;
          }

          let sumSim = 0;
          for (const x of inU) {
            for (const y of inV) {
              sumSim += currentSim.get(x)?.get(y) || 0;
            }
          }

          const score = (this.decayFactor / (inU.length * inV.length)) * sumSim;
          nextSim.get(u).set(v, score);

          const diff = Math.abs(score - (currentSim.get(u)?.get(v) || 0));
          if (diff > maxDiff) maxDiff = diff;
        }
      }

      currentSim = nextSim;
      if (maxDiff < this.tolerance) {
        converged = true;
        break;
      }
    }

    this.simMatrix = currentSim;
    return { iterationsRun, converged };
  }

  /**
   * Lấy điểm tương đồng SimRank giữa 2 nút (0.0 đến 1.0)
   * @param {string} nodeA
   * @param {string} nodeB
   * @returns {number}
   */
  getSimilarity(nodeA, nodeB) {
    if (nodeA === nodeB) return 1.0;
    const score = this.simMatrix.get(nodeA)?.get(nodeB);
    return score !== undefined ? Math.round(score * 10000) / 10000 : 0.0;
  }

  /**
   * Tìm Top K nút có độ tương đồng cấu trúc cao nhất với `targetNode`
   * @param {string} targetNode
   * @param {number} [k=5]
   * @returns {Array<{ node: string, similarity: number }>}
   */
  getTopSimilar(targetNode, k = 5) {
    if (!this.nodes.has(targetNode)) return [];
    const results = [];

    for (const other of this.nodes) {
      if (other !== targetNode) {
        const sim = this.getSimilarity(targetNode, other);
        if (sim > 0) {
          results.push({ node: other, similarity: sim });
        }
      }
    }

    results.sort((a, b) => b.similarity - a.similarity);
    return results.slice(0, k);
  }
}

export default SimRankGraphSimilarity;
