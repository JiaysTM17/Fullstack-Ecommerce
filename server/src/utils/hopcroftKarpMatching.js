/**
 * Hopcroft-Karp Algorithm for Maximum Cardinality Bipartite Matching
 * Hệ thống gán bưu tá SPX Express cho các đơn hàng hỏa tốc trong giờ cao điểm Mega Sale
 * 
 * Độ phức tạp thời gian: O(|E| * sqrt(|V|))
 * Nhanh hơn vượt bậc so với thuật toán Hungarian O(V^3) khi xử lý hàng nghìn đơn/phút.
 */

export class HopcroftKarpMatching {
  constructor() {
    // Tập đỉnh bên trái: Bưu tá (Shippers) U
    this.shippers = new Set();
    // Tập đỉnh bên phải: Đơn hàng (Orders) V
    this.orders = new Set();
    // Danh sách kề: shipperId -> Array of orderId
    this.adj = new Map();

    // Kết quả ghép cặp:
    // pairU: shipperId -> orderId (hoặc null)
    this.pairU = new Map();
    // pairV: orderId -> shipperId (hoặc null)
    this.pairV = new Map();

    // Mảng khoảng cách cho BFS: shipperId -> number
    this.dist = new Map();
  }

  /**
   * Thêm bưu tá vào mạng lưới
   * @param {string} shipperId
   */
  addShipper(shipperId) {
    if (!this.shippers.has(shipperId)) {
      this.shippers.add(shipperId);
      this.adj.set(shipperId, []);
      this.pairU.set(shipperId, null);
    }
    return this;
  }

  /**
   * Thêm đơn hàng vào mạng lưới
   * @param {string} orderId
   */
  addOrder(orderId) {
    if (!this.orders.has(orderId)) {
      this.orders.add(orderId);
      this.pairV.set(orderId, null);
    }
    return this;
  }

  /**
   * Thiết lập quan hệ khả dụng giữa bưu tá và đơn hàng (VD: Bưu tá nằm trong bán kính giao hàng 5km)
   * @param {string} shipperId
   * @param {string} orderId
   */
  addEdge(shipperId, orderId) {
    this.addShipper(shipperId);
    this.addOrder(orderId);
    this.adj.get(shipperId).push(orderId);
    return this;
  }

  /**
   * Pha 1: BFS phân tầng đồ thị và tìm độ dài của đường mở (Augmenting Path) ngắn nhất
   * @private
   */
  _bfs() {
    const queue = [];
    for (const u of this.shippers) {
      if (this.pairU.get(u) === null) {
        // Đỉnh tự do bên U
        this.dist.set(u, 0);
        queue.push(u);
      } else {
        this.dist.set(u, Infinity);
      }
    }

    this.dist.set(null, Infinity);

    while (queue.length > 0) {
      const u = queue.shift();
      if (this.dist.get(u) < this.dist.get(null)) {
        const neighbors = this.adj.get(u) || [];
        for (const v of neighbors) {
          const nextU = this.pairV.get(v);
          if (this.dist.get(nextU) === Infinity) {
            this.dist.set(nextU, this.dist.get(u) + 1);
            queue.push(nextU);
          }
        }
      }
    }

    return this.dist.get(null) !== Infinity;
  }

  /**
   * Pha 2: DFS tìm và hoán đổi các đường mở phân tầng không giao nhau
   * @private
   */
  _dfs(u) {
    if (u !== null) {
      const neighbors = this.adj.get(u) || [];
      for (const v of neighbors) {
        const nextU = this.pairV.get(v);
        if (this.dist.get(nextU) === this.dist.get(u) + 1) {
          if (this._dfs(nextU)) {
            this.pairV.set(v, u);
            this.pairU.set(u, v);
            return true;
          }
        }
      }
      this.dist.set(u, Infinity);
      return false;
    }
    return true;
  }

  /**
   * Tính toán Ghép Cặp Cực Đại (Maximum Bipartite Matching)
   * @returns {Object} Danh sách các cặp được gán, tỷ lệ hoàn tất
   */
  computeMaxMatching() {
    // Reset cặp ghép
    for (const u of this.shippers) this.pairU.set(u, null);
    for (const v of this.orders) this.pairV.set(v, null);

    let matchingSize = 0;

    // Lặp chừng nào còn tìm thấy đường mở qua BFS
    while (this._bfs()) {
      for (const u of this.shippers) {
        if (this.pairU.get(u) === null) {
          if (this._dfs(u)) {
            matchingSize++;
          }
        }
      }
    }

    const assignments = [];
    for (const [u, v] of this.pairU.entries()) {
      if (v !== null) {
        assignments.push({ shipperId: u, orderId: v });
      }
    }

    const unassignedOrders = [];
    for (const [v, u] of this.pairV.entries()) {
      if (u === null) {
        unassignedOrders.push(v);
      }
    }

    const totalOrders = this.orders.size;
    const fulfillmentRate = totalOrders > 0 ? Number(((matchingSize / totalOrders) * 100).toFixed(1)) : 100;

    return {
      matchingSize,
      totalShippers: this.shippers.size,
      totalOrders,
      fulfillmentRate,
      assignments,
      unassignedOrders
    };
  }
}

export default {
  HopcroftKarpMatching
};
