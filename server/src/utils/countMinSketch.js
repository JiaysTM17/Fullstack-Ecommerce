/**
 * Count-Min Sketch (Cấu trúc dữ liệu ước lượng tần suất luồng lớn & Heavy Hitters)
 * 
 * Vấn đề:
 * Trong các sự kiện Flash Sale hoặc Mega Campaign, hàng chục triệu lượt xem sản phẩm (Product Views),
 * lượt tìm kiếm (Search Queries), hoặc lượt click dồn dập vào sàn.
 * Lưu trữ một Map đếm tần suất cho mọi SKU sẽ làm tràn RAM (hàng triệu items * bộ nhớ object).
 * 
 * Giải pháp Count-Min Sketch:
 * 1. Không gian bộ nhớ cố định O(d * w): Sử dụng ma trận kích thước d x w gồm d hàng và w cột
 *    với d hàm băm độc lập (sử dụng các hạt giống seed khác nhau).
 * 2. Tự động tính toán tham số theo lý thuyết:
 *    - w = ceil(e / epsilon): kiểm soát sai số epsilon (mặc định 0.005)
 *    - d = ceil(ln(1 / delta)): kiểm soát độ tin cậy 1 - delta (mặc định 99%)
 * 3. Không bao giờ ước lượng thiếu (Zero Underestimation):
 *    Ước lượng luôn là: count(x) <= estimate(x) <= count(x) + epsilon * N.
 * 4. Heavy Hitters Tracker: Giữ danh sách Top-K sản phẩm thịnh hành (Trending Deals) trong thời gian thực.
 */

import { murmur32 } from "./bloomFilter.js";

export class CountMinSketch {
  /**
   * @param {Object} options
   * @param {number} options.epsilon - Sai số cho phép (mặc định 0.005 = 0.5%)
   * @param {number} options.delta - Xác suất vượt quá sai số (mặc định 0.01 = 1%, tức tin cậy 99%)
   */
  constructor({ epsilon = 0.005, delta = 0.01 } = {}) {
    this.epsilon = Math.max(0.0001, epsilon);
    this.delta = Math.max(0.0001, delta);

    // w = ceil(e / epsilon)
    this.w = Math.ceil(Math.E / this.epsilon);
    // d = ceil(ln(1 / delta))
    this.d = Math.max(2, Math.ceil(Math.log(1 / this.delta)));

    // Ma trận d x w kiểu mảng phẳng Uint32Array (tiết kiệm bộ nhớ tối đa)
    this.table = new Uint32Array(this.d * this.w);
    this.totalEvents = 0;

    // Danh sách seed độc lập cho d hàm băm
    this.seeds = Array.from({ length: this.d }, (_, i) => (0x9e3779b9 + i * 0x85ebca6b) >>> 0);

    // Bộ nhớ Top-K Heavy Hitters (sản phẩm Hot Trend)
    this.topCandidates = new Map(); // itemId -> estimatedCount
  }

  /**
   * Tính vị trí cột băm cho hàng rowIdx
   */
  _hash(item, rowIdx) {
    const str = String(item);
    const seed = this.seeds[rowIdx];
    return murmur32(str, seed) % this.w;
  }

  /**
   * Cập nhật tần suất cho phần tử
   * @param {string|number} item
   * @param {number} count
   */
  update(item, count = 1) {
    if (item === undefined || item === null || count <= 0) return;

    for (let r = 0; r < this.d; r++) {
      const col = this._hash(item, r);
      const index = r * this.w + col;
      this.table[index] += count;
    }

    this.totalEvents += count;

    // Cập nhật bộ đếm Heavy Hitters
    const est = this.estimate(item);
    this.topCandidates.set(String(item), est);

    // Giữ kích thước topCandidates gọn gàng (tối đa 100 phần tử)
    if (this.topCandidates.size > 100) {
      let minKey = null;
      let minVal = Infinity;
      for (const [k, v] of this.topCandidates.entries()) {
        if (v < minVal) {
          minVal = v;
          minKey = k;
        }
      }
      if (minKey) this.topCandidates.delete(minKey);
    }
  }

  /**
   * Ước lượng tần suất xuất hiện của phần tử
   * @returns {number} - Tần suất ước lượng (luôn >= giá trị thực tế)
   */
  estimate(item) {
    if (item === undefined || item === null) return 0;
    let minVal = Infinity;

    for (let r = 0; r < this.d; r++) {
      const col = this._hash(item, r);
      const index = r * this.w + col;
      const val = this.table[index];
      if (val < minVal) {
        minVal = val;
      }
    }

    return minVal === Infinity ? 0 : minVal;
  }

  /**
   * Lấy danh sách Top-K phần tử có tần suất cao nhất (Heavy Hitters / Trending Items)
   * @param {number} k
   */
  getTopK(k = 5) {
    const list = [];
    for (const [item, count] of this.topCandidates.entries()) {
      list.push({ item, estimatedCount: this.estimate(item) });
    }
    list.sort((a, b) => b.estimatedCount - a.estimatedCount);
    return list.slice(0, k);
  }

  /**
   * Xóa sạch ma trận
   */
  clear() {
    this.table.fill(0);
    this.totalEvents = 0;
    this.topCandidates.clear();
  }

  /**
   * Thống kê thông số kỹ thuật
   */
  getStats() {
    return {
      rows: this.d,
      columns: this.w,
      totalCells: this.d * this.w,
      memoryBytes: this.table.byteLength,
      totalEventsProcessed: this.totalEvents,
      epsilon: this.epsilon,
      delta: this.delta,
    };
  }
}
