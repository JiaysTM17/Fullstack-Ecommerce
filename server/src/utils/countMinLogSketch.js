/**
 * Count-Min-Log Sketch (CML Sketch)
 * (Pavan & Tirthapura 2017, Ting 2018)
 * Thuật toán phác thảo tần suất xấp xỉ Logarithmic Count-Min Sketch
 * Nén các bộ đếm tần suất 32/64 bit xuống chỉ còn 8-bit (Uint8Array)
 * Tăng bậc đếm theo xác suất P(inc) = gamma^(-c) với gamma = 1.08
 * Tiết kiệm 75% dung lượng RAM so với Count-Min Sketch truyền thống
 * Ứng dụng: Đo lường tần suất xem, click và giỏ hàng của hàng triệu SKU trong Flash Sale
 */

class CountMinLogSketch {
  /**
   * @param {Object} options
   * @param {number} options.depth Số hàng hàm băm d (mặc định 4)
   * @param {number} options.width Số cột bảng băm w (mặc định 1024)
   * @param {number} options.gamma Cơ số logarit gamma (mặc định 1.08)
   */
  constructor(options = {}) {
    this.depth = options.depth || 4;
    this.width = options.width || 1024;
    this.gamma = options.gamma || 1.08;

    // Bảng 8-bit counters: Tiết kiệm tối đa bộ nhớ RAM
    this.table = Array.from({ length: this.depth }, () => new Uint8Array(this.width));
  }

  _hash(key, seed = 0) {
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
   * Chuyển đổi giá trị logarit counter c sang tần suất xấp xỉ thực tế:
   * E[c] = (gamma^c - 1) / (gamma - 1)
   */
  _logValueToFrequency(c) {
    if (c === 0) return 0;
    return Math.round((Math.pow(this.gamma, c) - 1) / (this.gamma - 1));
  }

  /**
   * Ghi nhận một sự kiện vào CML Sketch
   * Tăng bộ đếm với xác suất P = gamma^(-c)
   * @param {string} item
   * @param {number} count Số lần xuất hiện (mặc định 1)
   */
  add(item, count = 1) {
    if (!item || count <= 0) return;

    for (let c = 0; c < count; c++) {
      for (let i = 0; i < this.depth; i++) {
        const col = this._hash(item, i * 7919 + 31);
        const currentVal = this.table[i][col];

        if (currentVal < 255) { // Tránh tràn Uint8
          const p = Math.pow(this.gamma, -currentVal);
          if (Math.random() < p) {
            this.table[i][col]++;
          }
        }
      }
    }
  }

  /**
   * Ước lượng tần suất xuất hiện của một phần tử:
   * Lấy giá trị nhỏ nhất qua d hàng băm (Point Query)
   * @param {string} item
   */
  estimate(item) {
    if (!item) return 0;

    let minLogVal = 255;
    for (let i = 0; i < this.depth; i++) {
      const col = this._hash(item, i * 7919 + 31);
      const val = this.table[i][col];
      if (val < minLogVal) {
        minLogVal = val;
      }
    }

    if (minLogVal === 0) return 0;
    return this._logValueToFrequency(minLogVal);
  }

  /**
   * Hợp nhất (Merge) hai CML Sketch có cùng kích thước
   * @param {CountMinLogSketch} other
   */
  merge(other) {
    if (!other || other.depth !== this.depth || other.width !== this.width) {
      throw new Error("Cannot merge CML sketches of mismatched dimensions");
    }
    for (let i = 0; i < this.depth; i++) {
      for (let j = 0; j < this.width; j++) {
        if (other.table[i][j] > this.table[i][j]) {
          this.table[i][j] = other.table[i][j];
        }
      }
    }
  }

  /**
   * Reset bộ đếm về 0
   */
  reset() {
    for (let i = 0; i < this.depth; i++) {
      this.table[i].fill(0);
    }
  }
}

export { CountMinLogSketch };
export default CountMinLogSketch;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CountMinLogSketch };
  }
} catch (e) {}
