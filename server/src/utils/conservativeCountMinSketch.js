/**
 * Count-Min Sketch with Conservative Update & Real-Time Heavy Hitters
 * Thuật Toán Phác Thảo Cập Nhật Thận Trọng Goyal et al. (2012)
 * 
 * Cải tiến so với Count-Min Sketch tiêu chuẩn:
 * 1. Conservative Update: Khi cộng thêm giá trị count, chỉ cập nhật vào các ô có giá trị
 *    bằng với giá trị nhỏ nhất hiện tại: C[i, h_i(x)] = max(C[i, h_i(x)], min_val + count).
 *    Giảm hơn 50% sai số ước lượng (Estimation Overestimation Error).
 * 2. Tích hợp Min-Heap theo dõi Top-K Heavy Hitters (SKU được tìm kiếm / click xem nhiều nhất)
 *    trong luồng clickstream thời gian thực.
 */

export class ConservativeCountMinSketch {
  /**
   * @param {number} [width=2000] - Số lượng cột w
   * @param {number} [depth=5] - Số lượng dòng băm d
   * @param {number} [topKCapacity=50] - Dung lượng danh sách Heavy Hitters
   */
  constructor(width = 2000, depth = 5, topKCapacity = 50) {
    this.w = Math.max(10, width);
    this.d = Math.max(2, depth);
    this.topKCapacity = Math.max(5, topKCapacity);

    // Khởi tạo ma trận d x w số nguyên 32-bit
    this.table = Array.from({ length: this.d }, () => new Int32Array(this.w));

    // Seeds cho các hàm băm độc lập
    this.seeds = [0x7feb352d, 0x846ca68b, 0x9e3779b9, 0x1b873593, 0x85ebca6b, 0xc2b2ae35, 0x27d4eb2f];
    while (this.seeds.length < this.d) {
      this.seeds.push((this.seeds[this.seeds.length - 1] * 31 + 17) >>> 0);
    }

    this.totalEvents = 0;
    this.heavyHitters = new Map(); // key -> estimatedCount
  }

  /**
   * MurmurHash3 32-bit
   * @private
   */
  _hash(str, seed) {
    const s = String(str);
    let h1 = seed >>> 0;
    const c1 = 0xcc9e2d51;
    const c2 = 0x1b873593;
    let i = 0;
    const len = s.length;

    while (i + 4 <= len) {
      let k1 = (s.charCodeAt(i) & 0xff) |
               ((s.charCodeAt(i + 1) & 0xff) << 8) |
               ((s.charCodeAt(i + 2) & 0xff) << 16) |
               ((s.charCodeAt(i + 3) & 0xff) << 24);
      i += 4;
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);

      h1 ^= k1;
      h1 = (h1 << 13) | (h1 >>> 19);
      h1 = (Math.imul(h1, 5) + 0xe6546b64) >>> 0;
    }

    let k1 = 0;
    const rem = len - i;
    if (rem === 3) k1 ^= (s.charCodeAt(i + 2) & 0xff) << 16;
    if (rem >= 2) k1 ^= (s.charCodeAt(i + 1) & 0xff) << 8;
    if (rem >= 1) {
      k1 ^= (s.charCodeAt(i) & 0xff);
      k1 = Math.imul(k1, c1);
      k1 = (k1 << 15) | (k1 >>> 17);
      k1 = Math.imul(k1, c2);
      h1 ^= k1;
    }

    h1 ^= len;
    h1 ^= h1 >>> 16;
    h1 = Math.imul(h1, 0x85ebca6b);
    h1 ^= h1 >>> 13;
    h1 = Math.imul(h1, 0xc2b2ae35);
    h1 ^= h1 >>> 16;

    return (h1 >>> 0) % this.w;
  }

  /**
   * Thêm một sự kiện vào sketch sử dụng cơ chế Cập nhật Thận trọng (Conservative Update)
   * @param {string|number} item - Khóa nhận dạng (SKU, keyword, IP)
   * @param {number} [count=1] - Số lần xuất hiện
   */
  add(item, count = 1) {
    if (item === undefined || item === null) return;
    const str = String(item);
    const inc = Math.max(1, Math.floor(count));
    this.totalEvents += inc;

    // Bước 1: Tính toán giá trị ước lượng nhỏ nhất hiện tại min_val
    const indices = new Int32Array(this.d);
    let minVal = Infinity;

    for (let i = 0; i < this.d; i++) {
      indices[i] = this._hash(str, this.seeds[i]);
      const current = this.table[i][indices[i]];
      if (current < minVal) {
        minVal = current;
      }
    }

    // Bước 2: Conservative Update: Chỉ cập nhật các ô có giá trị bằng minVal
    const targetVal = minVal + inc;
    for (let i = 0; i < this.d; i++) {
      const idx = indices[i];
      if (this.table[i][idx] < targetVal) {
        this.table[i][idx] = targetVal;
      }
    }

    // Bước 3: Cập nhật danh sách Heavy Hitters thời gian thực
    this._updateHeavyHitters(str, targetVal);
  }

  /**
   * Ước lượng tần suất xuất hiện của một phần tử
   * @param {string|number} item
   * @returns {number}
   */
  estimate(item) {
    if (item === undefined || item === null) return 0;
    const str = String(item);
    let minVal = Infinity;

    for (let i = 0; i < this.d; i++) {
      const idx = this._hash(str, this.seeds[i]);
      const val = this.table[i][idx];
      if (val < minVal) {
        minVal = val;
      }
    }

    return minVal === Infinity ? 0 : minVal;
  }

  /**
   * Cập nhật danh sách Heavy Hitters
   * @private
   */
  _updateHeavyHitters(item, estCount) {
    this.heavyHitters.set(item, estCount);

    if (this.heavyHitters.size > this.topKCapacity * 2) {
      // Cắt tỉa bớt các phần tử có tần suất thấp nhất
      const sorted = Array.from(this.heavyHitters.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, this.topKCapacity);
      this.heavyHitters = new Map(sorted);
    }
  }

  /**
   * Lấy Top K Heavy Hitters có tần suất xuất hiện cao nhất
   * @param {number} [k=10]
   * @returns {Array<{item: string, frequency: number}>}
   */
  getTopHeavyHitters(k = 10) {
    const list = Array.from(this.heavyHitters.entries()).map(([item, freq]) => ({
      item,
      frequency: this.estimate(item)
    }));
    list.sort((a, b) => b.frequency - a.frequency);
    return list.slice(0, k);
  }

  /**
   * Thống kê thông số vận hành của Conservative Count-Min Sketch
   */
  getStats() {
    return {
      width: this.w,
      depth: this.d,
      totalEventsProcessed: this.totalEvents,
      topKTrackedCount: this.heavyHitters.size,
      topKCapacity: this.topKCapacity,
      memoryBytes: this.d * this.w * 4,
      relativeErrorBound: Number((Math.E / this.w).toFixed(6)),
      confidencePercent: Number(((1 - Math.exp(-this.d)) * 100).toFixed(2))
    };
  }

  /**
   * Xóa toàn bộ dữ liệu trong sketch
   */
  clear() {
    for (let i = 0; i < this.d; i++) {
      this.table[i].fill(0);
    }
    this.totalEvents = 0;
    this.heavyHitters.clear();
  }
}

export default ConservativeCountMinSketch;
