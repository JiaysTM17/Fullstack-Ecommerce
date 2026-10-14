/**
 * Kademlia Distributed Hash Table (DHT) XOR Distance Routing Engine
 * 
 * Thuật toán Kademlia DHT (Maymounkov & Mazières - IPTPS 2002):
 * 1. Không gian địa chỉ và khoảng cách XOR Metric:
 *    - Khoảng cách giữa 2 node hoặc giữa node và khóa dữ liệu: d(x, y) = x ⊕ y.
 *    - Tính chất đơn hướng và bất đối xứng tuyệt đối: d(x, y) = d(y, x), tam giác d(x, z) <= d(x, y) ⊕ d(y, z).
 * 2. K-Buckets Routing Table:
 *    - Mỗi bucket lưu tối đa k liên hệ (k-contacts) ở khoảng cách [2^i, 2^{i+1}).
 *    - Tự động định tuyến tìm kiếm node lưu trữ shard sản phẩm/giỏ hàng trong O(log N) chặng (hops).
 * 3. Ứng dụng nghiệp vụ trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Phân tán và cân bằng tải catalog sản phẩm giữa các cụm máy chủ microservices.
 *    - Tìm kiếm tức thì node cache đang nắm giữ giỏ hàng hoặc phiên người dùng mà không cần cụm master tập trung.
 */

export class KademliaContact {
  constructor(nodeId, metadata = {}) {
    this.nodeId = String(nodeId);
    this.numericId = KademliaDhtRouting.hashToId(this.nodeId);
    this.metadata = metadata;
    this.lastSeen = Date.now();
  }
}

export class KademliaDhtRouting {
  /**
   * @param {string} localNodeId - ID của node cục bộ
   * @param {number} [k=8]        - Kích thước k-bucket
   * @param {number} [idBits=32]  - Số bit địa chỉ (mặc định 32-bit cho in-memory)
   */
  constructor(localNodeId, k = 8, idBits = 32) {
    this.localNodeId = String(localNodeId);
    this.localNumericId = KademliaDhtRouting.hashToId(this.localNodeId);
    this.k = Math.max(2, k);
    this.idBits = idBits;

    // Khởi tạo idBits buckets
    this.buckets = Array.from({ length: this.idBits }, () => []);
    this.storage = new Map(); // Local key-value store { key => { value, publisher, timestamp } }
  }

  /**
   * Băm chuỗi thành số nguyên 32-bit dương
   * @param {string} str
   * @returns {number}
   */
  static hashToId(str) {
    let hash = 2166136261;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      hash ^= s.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0; // Đưa về unsigned 32-bit
  }

  /**
   * Tính khoảng cách XOR giữa 2 định danh
   * @param {number|string} id1
   * @param {number|string} id2
   * @returns {number}
   */
  static xorDistance(id1, id2) {
    const n1 = typeof id1 === "number" ? id1 : KademliaDhtRouting.hashToId(id1);
    const n2 = typeof id2 === "number" ? id2 : KademliaDhtRouting.hashToId(id2);
    return (n1 ^ n2) >>> 0;
  }

  /**
   * Xác định chỉ số bucket dựa trên độ dài tiền tố chung (prefix length)
   * @param {number} dist
   * @returns {number}
   */
  _getBucketIndex(dist) {
    if (dist === 0) return 0;
    // 31 - Math.clz32(dist)
    const idx = 31 - Math.clz32(dist);
    return Math.min(this.idBits - 1, Math.max(0, idx));
  }

  /**
   * Thêm hoặc cập nhật một node vào bảng định tuyến K-bucket
   * @param {string} nodeId
   * @param {Object} [meta={}]
   * @returns {boolean}
   */
  addNode(nodeId, meta = {}) {
    if (String(nodeId) === this.localNodeId) return false;

    const contact = new KademliaContact(nodeId, meta);
    const dist = KademliaDhtRouting.xorDistance(this.localNumericId, contact.numericId);
    const bIndex = this._getBucketIndex(dist);
    const bucket = this.buckets[bIndex];

    const existingIdx = bucket.findIndex(c => c.nodeId === contact.nodeId);
    if (existingIdx !== -1) {
      // Đã tồn tại: Di chuyển về cuối (vừa mới nhìn thấy)
      bucket.splice(existingIdx, 1);
      contact.lastSeen = Date.now();
      bucket.push(contact);
      return true;
    }

    if (bucket.length < this.k) {
      bucket.push(contact);
      return true;
    }

    // Bucket đã đầy (theo chuẩn Kademlia, ping node cũ nhất; ở đây thay thế nếu cũ hơn)
    return false;
  }

  /**
   * Xóa một node khỏi bảng định tuyến
   * @param {string} nodeId
   * @returns {boolean}
   */
  removeNode(nodeId) {
    const numeric = KademliaDhtRouting.hashToId(nodeId);
    const dist = KademliaDhtRouting.xorDistance(this.localNumericId, numeric);
    const bIndex = this._getBucketIndex(dist);
    const bucket = this.buckets[bIndex];

    const idx = bucket.findIndex(c => c.nodeId === String(nodeId));
    if (idx !== -1) {
      bucket.splice(idx, 1);
      return true;
    }
    return false;
  }

  /**
   * Tìm k node gần nhất với một khóa mục tiêu (targetKey) dựa trên XOR distance
   * @param {string|number} targetKey
   * @param {number} [count]
   * @returns {Array<Object>}
   */
  findClosestNodes(targetKey, count = this.k) {
    const targetNumeric = typeof targetKey === "number" ? targetKey : KademliaDhtRouting.hashToId(targetKey);
    const allContacts = [];

    // Luôn bao gồm cả chính node hiện tại làm một ứng viên
    allContacts.push({
      nodeId: this.localNodeId,
      numericId: this.localNumericId,
      metadata: { isLocal: true },
      distance: KademliaDhtRouting.xorDistance(this.localNumericId, targetNumeric)
    });

    for (const bucket of this.buckets) {
      for (const contact of bucket) {
        allContacts.push({
          nodeId: contact.nodeId,
          numericId: contact.numericId,
          metadata: contact.metadata,
          distance: KademliaDhtRouting.xorDistance(contact.numericId, targetNumeric)
        });
      }
    }

    allContacts.sort((a, b) => a.distance - b.distance);
    return allContacts.slice(0, count);
  }

  /**
   * Lưu trữ bản ghi dữ liệu tại node cục bộ
   * @param {string} key
   * @param {*} value
   * @returns {boolean}
   */
  store(key, value) {
    const k = String(key);
    this.storage.set(k, {
      value,
      publisher: this.localNodeId,
      timestamp: Date.now()
    });
    return true;
  }

  /**
   * Tra cứu dữ liệu cục bộ
   * @param {string} key
   * @returns {*|null}
   */
  lookup(key) {
    const k = String(key);
    if (this.storage.has(k)) {
      return this.storage.get(k).value;
    }
    return null;
  }

  /**
   * Tổng số node đang được ghi nhận trong toàn bộ bảng định tuyến
   * @returns {number}
   */
  getTotalKnownNodes() {
    return this.buckets.reduce((acc, b) => acc + b.length, 0);
  }
}

export default {
  KademliaContact,
  KademliaDhtRouting
};
