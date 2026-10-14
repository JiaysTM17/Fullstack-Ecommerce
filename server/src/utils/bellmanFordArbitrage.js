/**
 * Bellman-Ford Negative Cycle Detection for Financial Cashback Arbitrage & Refund Fraud
 * 
 * Thuật toán Đồ Thị Bellman-Ford & Truy Vết Chu Trình Âm O(|V| * |E|):
 * 1. Mô hình hóa dòng luân chuyển dòng tiền, điểm thưởng Mini Xu và voucher hoàn tiền giữa các ví người dùng thành Đồ thị có hướng có trọng số.
 * 2. Phát hiện lỗ hổng chu trình chênh lệch vô hạn (Infinite Cashout / Cashback Arbitrage Loop):
 *    - Nhóm tài khoản liên minh (Sybil accounts) cố tình tạo chuỗi giao dịch hoàn tiền/mua đi bán lại: User_A -> User_B -> User_C -> User_A.
 *    - Trọng số cạnh biểu diễn chi phí ròng hoặc -log(tỷ lệ hoàn tiền). Nếu tổng trọng số của chu trình khép kín < 0 (Negative Cycle),
 *      hệ thống đang bị rút ruột tiền ký quỹ sau mỗi vòng luân chuyển!
 * 3. Thư giãn cạnh (Relaxation) trong |V| - 1 lượt. Lượt thứ |V| phát hiện và truy vết chính xác toàn bộ chu trình âm để phong tỏa tự động.
 */

export class BellmanFordArbitrage {
  constructor() {
    this.vertices = new Set();
    this.edges = []; // Mảng các cạnh { u, v, weight, transactionType, meta }
  }

  /**
   * Thêm đỉnh (ID tài khoản người dùng hoặc ví thanh toán)
   * @param {string} vertexId
   */
  addVertex(vertexId) {
    if (vertexId) this.vertices.add(String(vertexId));
  }

  /**
   * Thêm giao dịch luân chuyển dòng tiền có hướng
   * @param {string} from - Tài khoản nguồn
   * @param {string} to - Tài khoản đích
   * @param {number} weight - Trọng số chi phí ròng (số âm biểu thị sinh lợi nhuận bất thường/hoàn tiền)
   * @param {string} [transactionType="TRANSFER"]
   * @param {Object} [meta={}]
   */
  addEdge(from, to, weight, transactionType = "TRANSFER", meta = {}) {
    const u = String(from);
    const v = String(to);
    this.vertices.add(u);
    this.vertices.add(v);

    this.edges.push({
      u,
      v,
      weight: Number(weight),
      transactionType,
      meta
    });
  }

  /**
   * Thực thi thuật toán Bellman-Ford từ đỉnh nguồn source
   * @param {string} source - Đỉnh xuất phát
   * @returns {Object} Khoảng cách ngắn nhất, tiền bối và danh sách chu trình âm nếu có
   */
  detectNegativeCycle(source = null) {
    const vertexList = Array.from(this.vertices);
    const n = vertexList.length;

    if (n === 0) {
      return { hasNegativeCycle: false, cycle: [], distances: {} };
    }

    const dist = {};
    const predecessor = {};

    // Khởi tạo khoảng cách
    for (const v of vertexList) {
      dist[v] = Infinity;
      predecessor[v] = null;
    }

    const startNode = source && this.vertices.has(String(source)) ? String(source) : vertexList[0];
    dist[startNode] = 0;

    // Để phát hiện chu trình âm ở bất kỳ thành phần liên thông nào, ta có thể khởi tạo dist[v] = 0 cho tất cả
    if (!source) {
      for (const v of vertexList) {
        dist[v] = 0;
      }
    }

    // Lặp n - 1 lần thư giãn các cạnh
    for (let i = 1; i <= n - 1; i++) {
      let anyRelaxation = false;
      for (const edge of this.edges) {
        if (dist[edge.u] !== Infinity && dist[edge.u] + edge.weight < dist[edge.v]) {
          dist[edge.v] = dist[edge.u] + edge.weight;
          predecessor[edge.v] = edge.u;
          anyRelaxation = true;
        }
      }
      if (!anyRelaxation) break; // Hội tụ sớm
    }

    // Lượt thứ n: Kiểm tra sự tồn tại của chu trình âm
    let cycleStartNode = null;
    for (const edge of this.edges) {
      if (dist[edge.u] !== Infinity && dist[edge.u] + edge.weight < dist[edge.v]) {
        // Phát hiện chu trình âm!
        dist[edge.v] = dist[edge.u] + edge.weight;
        predecessor[edge.v] = edge.u;
        cycleStartNode = edge.v;
        break;
      }
    }

    if (!cycleStartNode) {
      return {
        hasNegativeCycle: false,
        cycle: [],
        distances: dist,
        status: "SAFE",
        message: "Không phát hiện vòng lặp hoàn tiền hoặc chênh lệch tài chính gian lận."
      };
    }

    // Truy vết chu trình âm: Đi lùi n bước để chắc chắn nằm trong chu trình
    let curr = cycleStartNode;
    for (let i = 0; i < n; i++) {
      curr = predecessor[curr];
    }

    const cycle = [];
    let p = curr;
    while (true) {
      cycle.push(p);
      if (p === curr && cycle.length > 1) break;
      p = predecessor[p];
      if (!p || cycle.length > n + 1) break;
    }

    cycle.reverse();

    return {
      hasNegativeCycle: true,
      cycleStartNode,
      cycle,
      status: "CRITICAL_FRAUD_DETECTED",
      message: `CẢNH BÁO BẢO MẬT: Phát hiện chu trình hoàn tiền âm khép kín [${cycle.join(" -> ")}]. Đóng băng tự động các ví liên đới!`,
      involvedAccountsCount: new Set(cycle).size
    };
  }
}

export default {
  BellmanFordArbitrage
};
