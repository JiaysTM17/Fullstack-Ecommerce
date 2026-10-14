/**
 * Space-Saving Algorithm for Real-Time Streaming Heavy Hitters (Top-K Trending Products)
 * 
 * Thuật toán Space-Saving (Metwally, Agrawal, El Abbadi - ACM PODS 2005):
 * 1. Giải quyết bài toán luồng dữ liệu (Data Stream) hàng triệu lượt xem/tìm kiếm/click mỗi phút
 *    để xác định Top-K sản phẩm "cháy hàng" (Heavy Hitters) mà chỉ dùng bộ nhớ cố định O(K).
 * 2. Cơ chế ước lượng với sai số có cận trên:
 *    - Bảng duy trì đúng K phần tử: { item, count, error }.
 *    - Nếu item đã có trong bảng: count tăng thêm weight.
 *    - Nếu bảng chưa đầy (< K): chèn mới với count = weight, error = 0.
 *    - Nếu bảng đã đầy: Thay thế phần tử có count nhỏ nhất (minItem).
 *      Item mới nhận count = minCount + weight, error = minCount.
 * 3. Bảo chứng lý thuyết:
 *    - Bất kỳ sản phẩm nào có tần suất thực tế f_i > N / K đều được đảm bảo 100% có mặt trong bảng!
 *    - Tần suất thực tế luôn nằm trong khoảng: [count - error, count].
 */

export class StreamEntry {
  constructor(item, count = 1, error = 0) {
    this.item = String(item);
    this.count = count;
    this.error = error;
    this.lastUpdated = Date.now();
  }
}

export class SpaceSavingHeavyHitters {
  /**
   * @param {number} [capacity=20] - K: Số lượng phần tử tối đa theo dõi (Top-K)
   */
  constructor(capacity = 20) {
    this.capacity = Math.max(1, capacity);
    this.entries = new Map(); // item -> StreamEntry
    this.totalStreamCount = 0;
  }

  /**
   * Ghi nhận một sự kiện sản phẩm được click/mua/tìm kiếm
   * @param {string|number} item - Mã sản phẩm hoặc từ khóa
   * @param {number} [weight=1]   - Trọng số tương tác
   * @returns {StreamEntry}
   */
  update(item, weight = 1) {
    const key = String(item);
    const w = Math.max(1, Number(weight) || 1);
    this.totalStreamCount += w;

    if (this.entries.has(key)) {
      const entry = this.entries.get(key);
      entry.count += w;
      entry.lastUpdated = Date.now();
      return entry;
    }

    if (this.entries.size < this.capacity) {
      const entry = new StreamEntry(key, w, 0);
      this.entries.set(key, entry);
      return entry;
    }

    // Bảng đầy: Tìm phần tử có count nhỏ nhất
    let minKey = null;
    let minCount = Infinity;
    let minError = 0;

    for (const [k, entry] of this.entries.entries()) {
      if (entry.count < minCount) {
        minCount = entry.count;
        minError = entry.error;
        minKey = k;
      }
    }

    // Trục xuất minKey, thay bằng item mới
    this.entries.delete(minKey);
    const newEntry = new StreamEntry(key, minCount + w, minCount);
    this.entries.set(key, newEntry);
    return newEntry;
  }

  /**
   * Trả về danh sách Top-K Heavy Hitters xếp theo thứ tự tần suất giảm dần
   * @param {number} [limit=10]
   * @returns {Array<Object>}
   */
  getTopK(limit = 10) {
    const list = Array.from(this.entries.values()).map(e => ({
      item: e.item,
      estimatedCount: e.count,
      maxError: e.error,
      minGuaranteedCount: Math.max(1, e.count - e.error),
      relativeFrequency: Number((e.count / Math.max(1, this.totalStreamCount)).toFixed(4))
    }));

    list.sort((a, b) => b.estimatedCount - a.estimatedCount);
    return list.slice(0, limit);
  }

  /**
   * Ước lượng tần suất của một sản phẩm
   * @param {string|number} item
   * @returns {Object}
   */
  estimateFrequency(item) {
    const key = String(item);
    if (this.entries.has(key)) {
      const e = this.entries.get(key);
      return {
        item: key,
        isInTopK: true,
        estimatedCount: e.count,
        maxError: e.error,
        lowerBound: Math.max(1, e.count - e.error),
        upperBound: e.count
      };
    }

    // Nếu không nằm trong bảng, tần suất thực tế không thể vượt quá minCount
    let minCount = 0;
    if (this.entries.size > 0) {
      minCount = Math.min(...Array.from(this.entries.values()).map(e => e.count));
    }

    return {
      item: key,
      isInTopK: false,
      estimatedCount: 0,
      maxError: minCount,
      lowerBound: 0,
      upperBound: minCount
    };
  }

  /**
   * Tổng số lượt xem/click đã đi qua stream
   * @returns {number}
   */
  getTotalStreamCount() {
    return this.totalStreamCount;
  }

  /**
   * Xóa toàn bộ bộ nhớ cache stream
   */
  reset() {
    this.entries.clear();
    this.totalStreamCount = 0;
  }
}

export default {
  StreamEntry,
  SpaceSavingHeavyHitters
};
