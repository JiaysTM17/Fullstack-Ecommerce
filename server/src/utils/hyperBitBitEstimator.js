/**
 * HyperBitBit Cardinality Estimator
 * (Robert Sedgewick, Analytic Combinatorics and Algorithms, Princeton 2014)
 * Thuật toán Ước Lượng Độ Tập Hợp Siêu Nén Bằng 2-Bit Sketching
 * 
 * Khác với HyperLogLog cần 6 đến 8 bit cho mỗi thanh ghi, HyperBitBit của Sedgewick
 * chỉ sử dụng đúng 2 bit cho mỗi bucket (sketchBit và auxBit), kết hợp biến đếm nấc thang step.
 * 
 * Nguyên lý hoạt động:
 * 1. Duy trì 2 mảng bit: sketch (m bits) và aux (m bits), cùng với số nguyên `step` (bắt đầu từ 0).
 * 2. Với mỗi phần tử item, băm thành mã 32-bit:
 *    - p bit đầu xác định bucket index: idx = hash >>> (32 - p)
 *    - Các bit còn lại: đếm số leading zeros `k`.
 * 3. Nếu k > step:
 *    - Đánh dấu sketch[idx] = 1.
 * 4. Nếu k > step + 1:
 *    - Đánh dấu aux[idx] = 1.
 * 5. Khi sketch đạt ngưỡng đầy (ví dụ > 80% bits = 1):
 *    - Nâng step <- step + 1
 *    - Đổi sketch <- aux, xóa trắng aux <- 0.
 * 6. Ước lượng Cardinality:
 *    N_hat = 2^(step) * m * alpha * (fraction of bits set)
 * 
 * Ưu thế vượt trội:
 * - Tiết kiệm bộ nhớ cực hạn: Chỉ 64 bytes cho m = 256, 128 bytes cho m = 512.
 * - Lý tưởng để gắn trực tiếp vào các microservice Edge Gateway và API Rate Limiter
 *   đếm lượng khách truy cập độc nhất (UV) của từng chiến dịch Flash Sale.
 */

class HyperBitBitEstimator {
  /**
   * @param {Object} options
   * @param {number} options.precision Số bit bucket (mặc định 8 -> m = 256 buckets)
   */
  constructor(options = {}) {
    this.p = options.precision || 8;
    if (this.p < 4 || this.p > 12) {
      throw new Error("Precision p must be between 4 and 12");
    }
    this.m = 1 << this.p;
    this.sketch = new Uint8Array(this.m);
    this.aux = new Uint8Array(this.m);
    this.step = 0;
    this.sketchCount = 0;
    this.auxCount = 0;
  }

  _hash(key) {
    let h = 0x811c9dc5;
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
    return h >>> 0;
  }

  _clz(val, maxBits) {
    if (val === 0) return maxBits;
    let count = 0;
    for (let i = maxBits - 1; i >= 0; i--) {
      if ((val & (1 << i)) === 0) {
        count++;
      } else {
        break;
      }
    }
    return count;
  }

  /**
   * Thêm một phần tử vào HyperBitBit
   * @param {string} item
   */
  add(item) {
    if (!item && item !== 0) return this.estimate();

    const hashVal = this._hash(item);
    const idx = hashVal >>> (32 - this.p);
    const w = hashVal & ((1 << (32 - this.p)) - 1);
    const k = this._clz(w, 32 - this.p);

    if (k > this.step) {
      if (this.sketch[idx] === 0) {
        this.sketch[idx] = 1;
        this.sketchCount++;
      }
    }

    if (k > this.step + 1) {
      if (this.aux[idx] === 0) {
        this.aux[idx] = 1;
        this.auxCount++;
      }
    }

    // Khi sketch đạt ngưỡng bão hòa >= 80% (Sedgewick rule: fraction >= 0.8)
    if (this.sketchCount >= Math.floor(this.m * 0.8)) {
      this.step++;
      // Chuyển aux thành sketch
      this.sketch.set(this.aux);
      this.sketchCount = this.auxCount;
      this.aux.fill(0);
      this.auxCount = 0;
    }

    return this.estimate();
  }

  /**
   * Ước lượng số lượng phần tử độc nhất (Cardinality)
   */
  estimate() {
    if (this.step === 0 && this.sketchCount === 0) {
      return 0;
    }

    // Tỷ lệ bit được bật trong sketch
    const fraction = this.sketchCount / this.m;
    if (fraction === 0) {
      return 0;
    }

    // Hằng số hiệu chuẩn Sedgewick: alpha ~ 1.0 / (1 - ln(2)) ~ 3.25
    const alpha = 1.0 / (1.0 - Math.log(2));

    // Công thức Sedgewick HyperBitBit
    let raw = Math.pow(2, this.step + 5.4) * (alpha * fraction);
    if (this.step === 0) {
      // Khi ở step 0, dùng Linear Counting hiệu chỉnh cho tập nhỏ
      const zeros = this.m - this.sketchCount;
      if (zeros > 0) {
        raw = this.m * Math.log(this.m / zeros);
      } else {
        raw = this.sketchCount;
      }
    }

    return Math.max(this.sketchCount, Math.round(raw));
  }

  getEstimate() {
    return this.estimate();
  }

  getStats() {
    return {
      precision: this.p,
      numBuckets: this.m,
      step: this.step,
      sketchBitsSet: this.sketchCount,
      auxBitsSet: this.auxCount,
      sketchFillRatio: Number((this.sketchCount / this.m).toFixed(3)),
      cardinalityEstimate: this.estimate()
    };
  }

  reset() {
    this.sketch.fill(0);
    this.aux.fill(0);
    this.step = 0;
    this.sketchCount = 0;
    this.auxCount = 0;
  }
}

export { HyperBitBitEstimator };
export default HyperBitBitEstimator;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HyperBitBitEstimator };
  }
} catch (e) {}
