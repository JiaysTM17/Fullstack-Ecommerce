/**
 * Tarjan's Strongly Connected Components (SCC) Algorithm
 * 
 * Thuật toán Thành Phần Liên Thông Mạnh Tarjan (O(V + E)):
 * 1. Nguyên lý toán học:
 *    - Duyệt đồ thị có hướng (Directed Graph) bằng DFS trong thời gian tuyến tính O(V + E).
 *    - Gán mỗi đỉnh một chỉ số khám phá (Discovery Index) và chỉ số liên kết thấp nhất (Lowlink Value).
 *    - Sử dụng một ngăn xếp (Stack) để gom cụm các đỉnh thuộc cùng một thành phần liên thông mạnh (SCC).
 * 2. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Phát hiện Mạng Lưới Rửa Tiền & Bơm Đơn Ảo Khép Kín (Circular Wash-Trading Rings):
 *      Shop A ➔ Shop B ➔ Shop C ➔ Shop A (mua chéo luân chuyển tiền nhằm giả mạo số lượng bán và đẩy vị trí hiển thị).
 *    - Tự Động Gắn Cờ Phong Tỏa & Tính Điểm Rủi Ro Cụm Gian Lận (Cluster Risk Scoring).
 */

export class TarjanSccFraudDetector {
  constructor() {
    this.adjacencyList = new Map(); // nodeId -> Set of neighborNodeIds
    this.edgeMetadata = new Map();  // "from->to" -> Array of transaction objects
    this.nodes = new Set();
  }

  /**
   * Thêm một đỉnh (Shop / User ID) vào đồ thị
   * @param {string} nodeId
   */
  addNode(nodeId) {
    if (!this.nodes.has(nodeId)) {
      this.nodes.add(nodeId);
      this.adjacencyList.set(nodeId, new Set());
    }
  }

  /**
   * Thêm một giao dịch mua bán có hướng (fromBuyer ➔ toSeller)
   * @param {string} fromId - Người mua / Shop chuyển tiền
   * @param {string} toId - Người bán / Shop nhận tiền
   * @param {Object} [metadata={}] - Dữ liệu giao dịch { orderId, amount, timestamp }
   */
  addTransaction(fromId, toId, metadata = {}) {
    if (!fromId || !toId) return;

    this.addNode(fromId);
    this.addNode(toId);

    this.adjacencyList.get(fromId).add(toId);

    const edgeKey = `${fromId}->${toId}`;
    if (!this.edgeMetadata.has(edgeKey)) {
      this.edgeMetadata.set(edgeKey, []);
    }
    this.edgeMetadata.get(edgeKey).push({
      amount: metadata.amount || 0,
      orderId: metadata.orderId || `TX_${Date.now()}`,
      timestamp: metadata.timestamp || new Date().toISOString()
    });
  }

  /**
   * Chạy thuật toán Tarjan tìm tất cả các thành phần liên thông mạnh (SCCs)
   * @returns {Array<Array<string>>} Danh sách các SCC
   */
  findStronglyConnectedComponents() {
    let index = 0;
    const indices = new Map();
    const lowlink = new Map();
    const onStack = new Map();
    const stack = [];
    const sccs = [];

    const strongConnect = (v) => {
      indices.set(v, index);
      lowlink.set(v, index);
      index++;
      stack.push(v);
      onStack.set(v, true);

      const neighbors = this.adjacencyList.get(v) || new Set();
      for (const w of neighbors) {
        if (!indices.has(w)) {
          // Đỉnh w chưa được duyệt
          strongConnect(w);
          lowlink.set(v, Math.min(lowlink.get(v), lowlink.get(w)));
        } else if (onStack.get(w)) {
          // Đỉnh w nằm trên ngăn xếp -> thuộc SCC hiện tại
          lowlink.set(v, Math.min(lowlink.get(v), indices.get(w)));
        }
      }

      // Nếu v là nút gốc của SCC
      if (lowlink.get(v) === indices.get(v)) {
        const component = [];
        let w = null;
        do {
          w = stack.pop();
          onStack.set(w, false);
          component.push(w);
        } while (w !== v);

        sccs.push(component);
      }
    };

    for (const node of this.nodes) {
      if (!indices.has(node)) {
        strongConnect(node);
      }
    }

    return sccs;
  }

  /**
   * Phát hiện các vòng lặp bơm đơn ảo khép kín (Circular Wash-Trading & Review Sybils)
   * @param {Object} [options={}]
   * @param {number} [options.minSize=2] - Kích thước tối thiểu của chu trình gian lận
   * @returns {Array<Object>} Danh sách các cụm gian lận đã phân tích
   */
  detectWashTradingRings({ minSize = 2 } = {}) {
    const sccs = this.findStronglyConnectedComponents();
    const suspiciousRings = [];

    for (const component of sccs) {
      // 1. Vòng lặp giữa 2 hoặc nhiều shop/tài khoản (A ➔ B ➔ A hoặc A ➔ B ➔ C ➔ A)
      const hasMultiNodeCycle = component.length >= minSize;

      // 2. Tự mua hàng của chính mình (Self-loop: A ➔ A)
      const hasSelfLoop = component.length === 1 && (this.adjacencyList.get(component[0])?.has(component[0]) ?? false);

      if (hasMultiNodeCycle || hasSelfLoop) {
        // Tính toán tổng số lượng giao dịch và kim ngạch nội bộ vòng lặp
        let totalWashVolume = 0;
        let transactionCount = 0;
        const internalEdges = [];

        for (const u of component) {
          const neighbors = this.adjacencyList.get(u) || new Set();
          for (const v of neighbors) {
            if (component.includes(v)) {
              const edgeKey = `${u}->${v}`;
              const txs = this.edgeMetadata.get(edgeKey) || [];
              internalEdges.push({ from: u, to: v, count: txs.length });
              for (const tx of txs) {
                totalWashVolume += tx.amount;
                transactionCount++;
              }
            }
          }
        }

        // Đánh giá mức độ rủi ro (Risk Level)
        let riskLevel = "MEDIUM";
        if (component.length >= 3 || totalWashVolume > 10000000 || transactionCount >= 10) {
          riskLevel = "CRITICAL";
        } else if (component.length >= 2 || totalWashVolume > 2000000) {
          riskLevel = "HIGH";
        }

        suspiciousRings.push({
          ringId: `RING_SCC_${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
          nodes: component,
          nodeCount: component.length,
          riskLevel,
          totalWashVolume,
          transactionCount,
          internalEdges,
          recommendedAction: riskLevel === "CRITICAL"
            ? "QUARANTINE_SHOPS_AND_REVERSE_ESCROW"
            : "FLAG_ACCOUNTS_FOR_AUDIT"
        });
      }
    }

    // Sắp xếp các cụm có rủi ro cao nhất lên đầu
    suspiciousRings.sort((a, b) => b.totalWashVolume - a.totalWashVolume);
    return suspiciousRings;
  }

  /**
   * Thống kê đồ thị
   */
  getStats() {
    let edgeCount = 0;
    for (const [, neighbors] of this.adjacencyList) {
      edgeCount += neighbors.size;
    }
    return {
      nodeCount: this.nodes.size,
      edgeCount,
      txCount: Array.from(this.edgeMetadata.values()).reduce((sum, list) => sum + list.length, 0)
    };
  }
}
