/**
 * HeavyKeeper with Exponential Decay for Real-Time Top-K Trending Products
 * (Chen et al., ACM SIGCOMM 2018)
 * Thuật toán HeavyKeeper bắt dòng lớn (Elephant Flows / Top-K Viral Items)
 * Loại bỏ nhiễu dòng nhỏ (Mice Flows) bằng xác suất suy giảm P(decay) = b^(-c)
 * Tích hợp suy giảm theo thời gian thực (Exponential Time Decay)
 * Ứng dụng: Bảng xếp hạng xu hướng xem & tìm kiếm sản phẩm bùng nổ (Shopee Live Trending)
 */

class MinHeapTopK {
  constructor(maxK = 10) {
    this.maxK = maxK;
    this.heap = []; // [{ key, count }]
    this.keyToIndex = new Map();
  }

  size() {
    return this.heap.length;
  }

  peek() {
    return this.heap[0] || null;
  }

  insertOrUpdate(key, count) {
    if (this.keyToIndex.has(key)) {
      const idx = this.keyToIndex.get(key);
      this.heap[idx].count = count;
      this._bubbleDown(idx);
      this._bubbleUp(idx);
      return;
    }

    if (this.heap.length < this.maxK) {
      this.heap.push({ key, count });
      const idx = this.heap.length - 1;
      this.keyToIndex.set(key, idx);
      this._bubbleUp(idx);
    } else if (count > this.heap[0].count) {
      this.keyToIndex.delete(this.heap[0].key);
      this.heap[0] = { key, count };
      this.keyToIndex.set(key, 0);
      this._bubbleDown(0);
    }
  }

  getTopK() {
    return [...this.heap].sort((a, b) => b.count - a.count);
  }

  _bubbleUp(idx) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[idx].count < this.heap[parent].count) {
        this._swap(idx, parent);
        idx = parent;
      } else break;
    }
  }

  _bubbleDown(idx) {
    const len = this.heap.length;
    while (true) {
      let left = 2 * idx + 1;
      let right = 2 * idx + 2;
      let smallest = idx;

      if (left < len && this.heap[left].count < this.heap[smallest].count) smallest = left;
      if (right < len && this.heap[right].count < this.heap[smallest].count) smallest = right;

      if (smallest !== idx) {
        this._swap(idx, smallest);
        idx = smallest;
      } else break;
    }
  }

  _swap(i, j) {
    const tmp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = tmp;
    this.keyToIndex.set(this.heap[i].key, i);
    this.keyToIndex.set(this.heap[j].key, j);
  }
}

class HeavyKeeperTrendRadar {
  constructor(options = {}) {
    this.depth = options.depth || 4; // Số hàng bảng băm d
    this.width = options.width || 1024; // Số cột w trong mỗi hàng
    this.decayBase = options.decayBase || 1.08; // Cơ số suy giảm b = 1.08
    this.topKLimit = options.topKLimit || 10;
    this.halfLifeMs = options.halfLifeMs || 60000; // Chu kỳ bán rã thời gian (60s)

    // Khởi tạo bảng ma trận cell: [{ fingerprint, count, lastUpdated }]
    this.table = Array.from({ length: this.depth }, () =>
      Array.from({ length: this.width }, () => ({ fingerprint: 0, count: 0, lastUpdated: Date.now() }))
    );

    this.topKHeap = new MinHeapTopK(this.topKLimit);
  }

  _hash(str, seed) {
    let h = 0x811c9dc5 ^ seed;
    for (let i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 0x01000193);
    }
    return (h >>> 0);
  }

  _fingerprint(str) {
    let fp = 0;
    for (let i = 0; i < str.length; i++) {
      fp = (fp * 31 + str.charCodeAt(i)) & 0xFFFF;
    }
    return fp || 1;
  }

  _applyTimeDecay(cell, now) {
    if (cell.count === 0) {
      cell.lastUpdated = now;
      return;
    }
    const elapsed = now - cell.lastUpdated;
    if (elapsed > 0) {
      const decayFactor = Math.pow(0.5, elapsed / this.halfLifeMs);
      cell.count = Math.floor(cell.count * decayFactor);
      if (cell.count === 0) {
        cell.fingerprint = 0;
      }
      cell.lastUpdated = now;
    }
  }

  /**
   * Ghi nhận một sự kiện xem/tương tác sản phẩm theo luồng
   * @param {string} itemId Mã sản phẩm hoặc từ khóa tìm kiếm
   * @param {number} weight Trọng số sự kiện (mặc định 1)
   */
  record(itemId, weight = 1) {
    if (!itemId) return 0;
    const now = Date.now();
    const fp = this._fingerprint(itemId);
    let maxEstimatedCount = 0;

    for (let i = 0; i < this.depth; i++) {
      const col = this._hash(itemId, i * 7919 + 31) % this.width;
      const cell = this.table[i][col];

      this._applyTimeDecay(cell, now);

      if (cell.count === 0) {
        cell.fingerprint = fp;
        cell.count = weight;
      } else if (cell.fingerprint === fp) {
        cell.count += weight;
      } else {
        // Va chạm giữa 2 dòng khác nhau: Suy giảm với xác suất b^(-count)
        for (let w = 0; w < weight; w++) {
          const pDecay = Math.pow(this.decayBase, -cell.count);
          if (Math.random() < pDecay) {
            cell.count--;
            if (cell.count <= 0) {
              cell.fingerprint = fp;
              cell.count = weight - w;
              break;
            }
          }
        }
      }

      if (cell.fingerprint === fp && cell.count > maxEstimatedCount) {
        maxEstimatedCount = cell.count;
      }
    }

    if (maxEstimatedCount > 0) {
      this.topKHeap.insertOrUpdate(itemId, maxEstimatedCount);
    }

    return maxEstimatedCount;
  }

  /**
   * Truy vấn ước lượng số lượt xem của sản phẩm
   */
  query(itemId) {
    if (!itemId) return 0;
    const now = Date.now();
    const fp = this._fingerprint(itemId);
    let estimated = 0;

    for (let i = 0; i < this.depth; i++) {
      const col = this._hash(itemId, i * 7919 + 31) % this.width;
      const cell = this.table[i][col];
      this._applyTimeDecay(cell, now);

      if (cell.fingerprint === fp && cell.count > estimated) {
        estimated = cell.count;
      }
    }

    return estimated;
  }

  /**
   * Lấy Top-K sản phẩm thịnh hành nhất thời gian thực
   */
  getTrendingTopK() {
    return this.topKHeap.getTopK().map(item => ({
      itemId: item.key,
      estimatedViews: item.count,
      heatScore: Math.min(100, Math.round(item.count * 1.5))
    }));
  }
}

export { HeavyKeeperTrendRadar, MinHeapTopK };
export default HeavyKeeperTrendRadar;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HeavyKeeperTrendRadar, MinHeapTopK };
  }
} catch (e) {}
