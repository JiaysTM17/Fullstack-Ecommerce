/**
 * Count-Sketch with Median of Means
 * (Charikar, Chen, Farach-Colton 2004)
 * Thuật toán phác thảo dòng dữ liệu không thiên lệch (Unbiased Stream Frequency Estimator)
 * Khác với Count-Min Sketch (chỉ hỗ trợ tăng và luôn bị dương tính overcounting),
 * Count-Sketch sử dụng thêm hàm băm dấu Rademacher s(x) in {-1, +1}
 * và lấy trung vị (Median of Means) qua d hàng băm.
 * Đặc tính:
 * 1. E[f_hat(x)] = f(x) (Ước lượng hoàn toàn không thiên lệch - Unbiased)
 * 2. Hỗ trợ cả thao tác tăng (mua hàng, thêm giỏ) và giảm (hủy đơn, hoàn hàng)
 * 3. Phương sai được chặn bởi Var[f_hat(x)] <= (1/w) * F_2(A) với chuẩn L2 Frobenius
 * Ứng dụng: Theo dõi biến động ròng (Net Velocity) của sản phẩm trong ngày Mega Sale
 */

class CountSketchMedian {
  /**
   * @param {Object} options
   * @param {number} options.depth Số hàng hàm băm d (mặc định 5, nên là số lẻ để lấy median chuẩn)
   * @param {number} options.width Số cột bảng băm w (mặc định 1024)
   */
  constructor(options = {}) {
    this.depth = options.depth || 5;
    if (this.depth % 2 === 0) {
      this.depth += 1; // Đảm bảo d luôn lẻ để tính median chính xác
    }
    this.width = options.width || 1024;

    // Bảng số nguyên 32-bit có dấu (Int32Array) để hỗ trợ số âm
    this.table = Array.from({ length: this.depth }, () => new Int32Array(this.width));
  }

  _hashIndex(key, seed = 0) {
    let h = 0x811c9dc5 ^ seed;
    const str = String(key);
    for (let i = 0; i < str.length; i++) {
      let k = str.charCodeAt(i);
      k = Math.imul(k, 0xcc9e2d51);
      k = (k << 15) | (k >>> 17);
      k = Math.imul(k, 0x1b873593);
      h ^= k;
      h = (h << 13) | (h >>> 19);
      h = Math.imul(h, 5) + 0xe6546b64;
    }
    h ^= str.length;
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    h = Math.imul(h, 0xc2b2ae35);
    h ^= h >>> 16;
    return (h >>> 0) % this.width;
  }

  /**
   * Hàm băm dấu Rademacher s(x) thuộc {-1, +1}
   */
  _hashSign(key, seed = 0) {
    let h = 0x9e3779b9 ^ seed;
    const str = String(key);
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
      h ^= h >>> 15;
    }
    return (h & 1) === 0 ? 1 : -1;
  }

  /**
   * Cập nhật tần suất cho phần tử (hỗ trợ cả delta dương và âm)
   * @param {string} item
   * @param {number} delta Lượng thay đổi (mặc định +1)
   */
  update(item, delta = 1) {
    if (!item || delta === 0) return;

    for (let i = 0; i < this.depth; i++) {
      const col = this._hashIndex(item, i * 7919 + 31);
      const sign = this._hashSign(item, i * 9973 + 17);
      this.table[i][col] += sign * delta;
    }
  }

  /**
   * Ước lượng tần suất thực tế của phần tử bằng trung vị (Median of Means)
   * @param {string} item
   */
  estimate(item) {
    if (!item) return 0;

    const estimates = [];
    for (let i = 0; i < this.depth; i++) {
      const col = this._hashIndex(item, i * 7919 + 31);
      const sign = this._hashSign(item, i * 9973 + 17);
      estimates.push(this.table[i][col] * sign);
    }

    estimates.sort((a, b) => a - b);
    const mid = Math.floor(this.depth / 2);
    const val = estimates[mid];
    return val === 0 ? 0 : val;
  }

  /**
   * Hợp nhất (Merge) hai Count-Sketch có cùng kích thước
   * @param {CountSketchMedian} other
   */
  merge(other) {
    if (!other || other.depth !== this.depth || other.width !== this.width) {
      throw new Error("Cannot merge Count-Sketches of mismatched dimensions");
    }
    for (let i = 0; i < this.depth; i++) {
      for (let j = 0; j < this.width; j++) {
        this.table[i][j] += other.table[i][j];
      }
    }
  }

  /**
   * Reset bảng về 0
   */
  reset() {
    for (let i = 0; i < this.depth; i++) {
      this.table[i].fill(0);
    }
  }
}

export { CountSketchMedian };
export default CountSketchMedian;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CountSketchMedian };
  }
} catch (e) {}
