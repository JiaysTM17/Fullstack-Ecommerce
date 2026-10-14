/**
 * Edmonds-Karp Maximum Flow Network Algorithm for SPX Cross-Dock Logistics
 * 
 * Thuật toán Luồng Cực Đại Edmonds-Karp (triển khai BFS trên mạng thặng dư O(V * E^2)):
 * 1. Tính toán dung lượng hàng hóa tối đa (Max Parcel Throughput) có thể luân chuyển từ nguồn (Trung tâm gom hàng/Kho Seller)
 *    đến đích (Các cụm dân cư người mua / Hub phát hàng Last-mile) trong các đợt Siêu Sale 11.11, 12.12.
 * 2. Xác định các điểm nút thắt cổ chai (Min-Cut Bottlenecks) theo Định lý Luồng Cực Đại - Lát Cắt Hẹp Nhất (Max-Flow Min-Cut Theorem).
 * 3. Hỗ trợ Admin điều phối thêm đội xe trung chuyển tải nặng và nhân sự ca đêm cho các tuyến xung yếu.
 */

export class EdmondsKarpMaxFlow {
  constructor() {
    // Danh sách đỉnh: id -> { id, label, type }
    this.nodes = new Map();
    // Ma trận dung lượng: from -> to -> capacity
    this.capacities = new Map();
    // Danh sách kề: from -> Set of to
    this.adjList = new Map();
  }

  /**
   * Thêm nút vào mạng lưới giao vận
   * @param {string} id - Mã định danh nút (VD: 'HUB_HN_CENTRAL')
   * @param {string} [label] - Tên hiển thị
   * @param {string} [type='hub'] - Loại nút: 'source' | 'hub' | 'sink' | 'station'
   */
  addNode(id, label = id, type = 'hub') {
    if (!this.nodes.has(id)) {
      this.nodes.set(id, { id, label, type });
      this.capacities.set(id, new Map());
      this.adjList.set(id, new Set());
    }
    return this;
  }

  /**
   * Thêm tuyến đường vận chuyển có hướng giữa 2 trạm với sức chứa kiện/giờ
   * @param {string} from - Điểm đi
   * @param {string} to - Điểm đến
   * @param {number} capacity - Sức chứa/năng lực xử lý tối đa (kiện hàng / giờ)
   */
  addEdge(from, to, capacity) {
    if (capacity <= 0) return this;

    this.addNode(from);
    this.addNode(to);

    // Cập nhật dung lượng cạnh xuôi
    const currentCap = this.capacities.get(from).get(to) || 0;
    this.capacities.get(from).set(to, currentCap + capacity);

    // Thêm vào danh sách kề cả 2 chiều (để phục vụ đồ thị thặng dư luồng ngược)
    this.adjList.get(from).add(to);
    this.adjList.get(to).add(from);

    // Cạnh ngược ban đầu có dung lượng 0 nếu chưa được gán
    if (!this.capacities.get(to).has(from)) {
      this.capacities.get(to).set(from, 0);
    }

    return this;
  }

  /**
   * Thuật toán BFS tìm đường tăng luồng ngắn nhất từ source đến sink trên đồ thị thặng dư
   * @private
   */
  _bfsAugmentingPath(source, sink, residual) {
    const parent = new Map();
    const visited = new Set();
    const queue = [source];
    visited.add(source);

    while (queue.length > 0) {
      const u = queue.shift();
      if (u === sink) break;

      const neighbors = this.adjList.get(u) || new Set();
      for (const v of neighbors) {
        const resCap = (residual.get(u) && residual.get(u).get(v)) || 0;
        if (!visited.has(v) && resCap > 0) {
          visited.add(v);
          parent.set(v, u);
          queue.push(v);
        }
      }
    }

    if (!visited.has(sink)) {
      return null;
    }

    // Truy vết đường tăng luồng và tìm dung lượng thặng dư nhỏ nhất (bottleneck capacity)
    const path = [];
    let curr = sink;
    let bottleneck = Infinity;

    while (curr !== source) {
      const prev = parent.get(curr);
      const cap = residual.get(prev).get(curr);
      bottleneck = Math.min(bottleneck, cap);
      path.unshift({ from: prev, to: curr });
      curr = prev;
    }

    return { path, bottleneck };
  }

  /**
   * Tính toán Luồng Cực Đại (Maximum Parcel Flow) từ source tới sink
   * @param {string} source - Điểm nguồn (VD: Kho tổng xuất hàng)
   * @param {string} sink - Điểm đích (VD: Khu vực giao nhận cuối)
   * @returns {Object} Kết quả thông lượng tối đa, chi tiết luồng qua từng tuyến
   */
  computeMaxFlow(source, sink) {
    if (!this.nodes.has(source) || !this.nodes.has(sink)) {
      throw new Error(`Điểm nguồn (${source}) hoặc điểm đích (${sink}) không tồn tại trong mạng lưới.`);
    }

    // Khởi tạo đồ thị thặng dư (residual graph) bằng bản sao của capacities
    const residual = new Map();
    for (const [u, map] of this.capacities.entries()) {
      residual.set(u, new Map(map));
    }

    // Bảng lưu trữ luồng thực tế đã phân bổ qua các cạnh ban đầu
    const flows = new Map();
    for (const [u, map] of this.capacities.entries()) {
      flows.set(u, new Map());
      for (const [v, cap] of map.entries()) {
        if (cap > 0) flows.get(u).set(v, 0);
      }
    }

    let maxFlow = 0;
    const augmentedPaths = [];

    // Lặp tìm đường tăng luồng qua BFS
    while (true) {
      const result = this._bfsAugmentingPath(source, sink, residual);
      if (!result) break;

      const { path, bottleneck } = result;
      maxFlow += bottleneck;
      augmentedPaths.push({ path, flowAdded: bottleneck });

      // Cập nhật luồng trên đồ thị thặng dư
      for (const edge of path) {
        const { from, to } = edge;
        // Trừ dung lượng trên cạnh xuôi
        const forwardCap = residual.get(from).get(to);
        residual.get(from).set(to, forwardCap - bottleneck);

        // Cộng dung lượng trên cạnh ngược
        const backwardCap = residual.get(to).get(from) || 0;
        residual.get(to).set(from, backwardCap + bottleneck);

        // Ghi nhận luồng thực tế
        if (this.capacities.get(from) && this.capacities.get(from).get(to) > 0) {
          flows.get(from).set(to, (flows.get(from).get(to) || 0) + bottleneck);
        } else {
          // Luồng hủy bớt trên cạnh ngược
          flows.get(to).set(from, (flows.get(to).get(from) || 0) - bottleneck);
        }
      }
    }

    // Định dạng danh sách tuyến đường và tỷ lệ sử dụng công suất
    const edgeDetails = [];
    for (const [from, map] of this.capacities.entries()) {
      for (const [to, originalCap] of map.entries()) {
        if (originalCap > 0) {
          const usedFlow = Math.max(0, flows.get(from).get(to) || 0);
          const utilizationRate = originalCap > 0 ? Number((usedFlow / originalCap).toFixed(3)) : 0;
          edgeDetails.push({
            from,
            to,
            capacity: originalCap,
            flow: usedFlow,
            utilizationRate,
            isSaturated: usedFlow === originalCap
          });
        }
      }
    }

    return {
      source,
      sink,
      maxFlow,
      totalPathsFound: augmentedPaths.length,
      edgeDetails,
      residual
    };
  }

  /**
   * Tìm lát cắt hẹp nhất (Minimum Cut) để phát hiện các tuyến nghẽn cổ chai (Bottlenecks)
   * Theo định lý Max-Flow Min-Cut: Tập cạnh nối giữa tập đỉnh S (các đỉnh còn vươn tới được từ source trên đồ thị thặng dư)
   * và tập đỉnh T (phần còn lại chứa sink) chính là các tuyến đạt 100% tải gây giới hạn toàn bộ hệ thống.
   * 
   * @param {string} source
   * @param {string} sink
   * @returns {Object}
   */
  findBottlenecks(source, sink) {
    const flowResult = this.computeMaxFlow(source, sink);
    const { residual, maxFlow } = flowResult;

    // Tìm tập S: Các nút có thể đi đến từ source trên đồ thị thặng dư còn dung lượng > 0
    const reachable = new Set();
    const queue = [source];
    reachable.add(source);

    while (queue.length > 0) {
      const u = queue.shift();
      const neighbors = this.adjList.get(u) || new Set();
      for (const v of neighbors) {
        const resCap = (residual.get(u) && residual.get(u).get(v)) || 0;
        if (!reachable.has(v) && resCap > 0) {
          reachable.add(v);
          queue.push(v);
        }
      }
    }

    // Các cạnh xuất phát từ tập S (reachable) sang tập T (không reachable) và có dung lượng ban đầu > 0
    const bottlenecks = [];
    let cutCapacity = 0;

    for (const u of reachable) {
      const capMap = this.capacities.get(u) || new Map();
      for (const [v, originalCap] of capMap.entries()) {
        if (originalCap > 0 && !reachable.has(v)) {
          bottlenecks.push({
            from: u,
            fromLabel: (this.nodes.get(u) && this.nodes.get(u).label) || u,
            to: v,
            toLabel: (this.nodes.get(v) && this.nodes.get(v).label) || v,
            capacity: originalCap,
            recommendation: `Tăng công suất xe tải/bưu tá thêm tối thiểu 30-50% cho tuyến ${u} -> ${v} để giải phóng nút thắt.`
          });
          cutCapacity += originalCap;
        }
      }
    }

    return {
      source,
      sink,
      maxFlow,
      cutCapacity,
      isMinCutVerified: maxFlow === cutCapacity,
      bottleneckCount: bottlenecks.length,
      bottlenecks
    };
  }
}

export default {
  EdmondsKarpMaxFlow
};

