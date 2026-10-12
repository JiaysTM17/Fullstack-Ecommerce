/**
 * Consistent Hashing with Virtual Nodes (Thuật toán Băm Nhất Quán)
 * 
 * Vấn đề:
 * Trong hệ thống phân tán (Distributed Caching, Session Sharding, Database Partitioning),
 * thuật toán chia dư thông thường hash(key) % N có nhược điểm chí mạng: khi tăng hoặc giảm
 * 1 node (N -> N+1 hoặc N -> N-1), hầu như 100% keys bị đổi vị trí, gây ra hiện tượng sập hệ thống
 * do bão tải cơ sở dữ liệu (Cache Avalanche / Thundering Herd).
 * 
 * Giải pháp Consistent Hashing:
 * 1. Không gian băm 32-bit: Ánh xạ cả Node và Key lên một vòng tròn 2^32 (0 -> 4,294,967,295).
 * 2. Virtual Nodes (Điểm băm ảo): Mỗi node vật lý được nhân bản thành k virtual nodes
 *    (ví dụ: node1#vn0, node1#vn1,...). Điều này loại bỏ hoàn toàn hiện tượng lệch tải (Data Skewness)
 *    và triệt tiêu các điểm nóng (Hotspots).
 * 3. Tìm kiếm nhị phân O(log(N * k)): Định tuyến key đến node đầu tiên có hash >= keyHash theo chiều kim đồng hồ.
 * 4. Tái cân bằng tối thiểu: Khi thêm/xóa node, chỉ có xấp xỉ 1/N keys cần di dời, còn (N-1)/N keys giữ nguyên.
 */

/**
 * FNV-1a 32-bit hash function cho phân bổ đều đồng nhất
 */
export function fnv1a32(str) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    // 32-bit FNV prime: 16777619 = (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24)
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0; // Convert to unsigned 32-bit integer [0, 4294967295]
}

export class ConsistentHashRing {
  /**
   * @param {Object} options
   * @param {number} options.replicas - Số lượng virtual nodes cho mỗi physical node (mặc định 150)
   * @param {Function} options.hashFn - Hàm băm 32-bit tùy chọn
   */
  constructor({ replicas = 150, hashFn = fnv1a32 } = {}) {
    this.replicas = replicas;
    this.hashFn = hashFn;
    this.ring = []; // Sorted array of { hash: number, nodeId: string }
    this.nodes = new Set(); // Set of active physical node IDs
  }

  /**
   * Thêm một physical node vào vòng tròn băm kèm k virtual nodes
   */
  addNode(nodeId) {
    if (!nodeId || this.nodes.has(nodeId)) return;
    this.nodes.add(nodeId);

    for (let i = 0; i < this.replicas; i++) {
      const vnodeKey = `${nodeId}#vn${i}`;
      const hash = this.hashFn(vnodeKey);
      this.ring.push({ hash, nodeId, vnodeKey });
    }

    // Luôn giữ ring được sắp xếp tăng dần theo giá trị băm
    this.ring.sort((a, b) => a.hash - b.hash);
  }

  /**
   * Xóa một physical node và toàn bộ virtual nodes của nó khỏi vòng tròn băm
   */
  removeNode(nodeId) {
    if (!this.nodes.has(nodeId)) return;
    this.nodes.delete(nodeId);
    this.ring = this.ring.filter((entry) => entry.nodeId !== nodeId);
  }

  /**
   * Xác định physical node phụ trách key theo chiều kim đồng hồ qua Binary Search O(log(N * k))
   */
  getNode(key) {
    if (this.ring.length === 0) return null;

    const hash = this.hashFn(String(key));

    // Tìm kiếm nhị phân phần tử đầu tiên trong ring có entry.hash >= hash
    let low = 0;
    let high = this.ring.length - 1;
    let targetIndex = 0;

    // Trường hợp biên: nếu hash lớn hơn node cuối cùng trên vòng, quấn tròn (wrap around) về node 0
    if (hash > this.ring[high].hash) {
      return this.ring[0].nodeId;
    }

    while (low <= high) {
      const mid = Math.floor((low + high) / 2);
      if (this.ring[mid].hash >= hash) {
        targetIndex = mid;
        high = mid - 1; // Tiếp tục tìm sang trái xem có node nào nhỏ hơn mà vẫn >= hash không
      } else {
        low = mid + 1;
      }
    }

    return this.ring[targetIndex].nodeId;
  }

  /**
   * Lấy danh sách tất cả các physical nodes đang hoạt động
   */
  getNodes() {
    return Array.from(this.nodes);
  }

  /**
   * Thống kê độ phân bổ keys trên các nodes vật lý
   */
  getDistribution(keys = []) {
    const counts = {};
    for (const node of this.nodes) {
      counts[node] = 0;
    }
    for (const k of keys) {
      const assignedNode = this.getNode(k);
      if (assignedNode) {
        counts[assignedNode] = (counts[assignedNode] || 0) + 1;
      }
    }
    const total = keys.length || 1;
    const distribution = {};
    for (const node of Object.keys(counts)) {
      distribution[node] = {
        count: counts[node],
        percentage: Number(((counts[node] / total) * 100).toFixed(2)),
      };
    }
    return distribution;
  }

  /**
   * Đo độ lệch chuẩn (Standard Deviation) để kiểm chứng tính đồng đều không bị skew
   */
  calculateSkewness(keys = []) {
    if (this.nodes.size === 0 || keys.length === 0) return 0;
    const dist = this.getDistribution(keys);
    const counts = Object.values(dist).map((d) => d.count);
    const mean = keys.length / this.nodes.size;
    const variance = counts.reduce((sum, c) => sum + Math.pow(c - mean, 2), 0) / this.nodes.size;
    const stdDev = Math.sqrt(variance);
    return Number(((stdDev / mean) * 100).toFixed(2)); // Hệ số biến thiên (Coefficient of Variation %)
  }
}
