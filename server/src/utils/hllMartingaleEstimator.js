/**
 * HyperLogLog with Martingale Estimator
 * (Ting 2014, Cohen 2015)
 * Thuật toán Ước Lượng Độ Tập Hợp Luồng Streaming Bằng Quá Trình Martingale
 * Khác với HLL truyền thống cần quét toàn bộ m thanh ghi và tính trung bình điều hòa O(m)
 * mỗi khi truy vấn, HLL Martingale duy trì bộ tích lũy martingale N_hat theo thời gian thực O(1):
 * N_hat_{t} = N_hat_{t-1} + 1 / p_t
 * với p_t = (1/m) * sum_{j=1}^m 2^(-M[j]) là xác suất chính xác một phần tử mới làm tăng giá trị thanh ghi.
 * Đặc tính vượt trội:
 * 1. Truy vấn Cardinality tức thời O(1) với 0 độ trễ (Zero Scan Time)
 * 2. Phương sai tiệm cận tối ưu ~ 1.0 / sqrt(m), thấp hơn sai số Flajolet 1.04 / sqrt(m)
 * 3. Hỗ trợ băm Murmur3 32-bit tối ưu hóa cho phân tích lưu lượng streaming
 * Ứng dụng: Đếm thời gian thực số lượt người xem độc nhất (UV) của các phiên Shopee Live triệu view
 */

class HLLMartingaleEstimator {
  /**
   * @param {Object} options
   * @param {number} options.precision Độ chính xác p (mặc định 10 -> m = 1024 thanh ghi)
   */
  constructor(options = {}) {
    this.p = options.precision || 10;
    if (this.p < 4 || this.p > 16) {
      throw new Error("Precision p must be between 4 and 16");
    }
    this.m = 1 << this.p;
    this.registers = new Uint8Array(this.m);

    // Tổng trọng số lũy thừa: sum_{j=1}^m 2^(-M[j])
    // Ban đầu mọi M[j] = 0 nên sum = m * 2^0 = m
    this.sumPowersOfTwo = this.m;
    this.sumInv = this.m;
    this.zeros = this.m;

    // Bộ tích lũy Martingale N_hat
    this.martingaleEstimate = 0.0;
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
    return count + 1;
  }

  /**
   * Thêm một phần tử vào HLL Martingale
   * Cập nhật tức thì N_hat theo công thức Martingale nếu thanh ghi thay đổi
   * @param {string} item
   */
  add(item) {
    if (!item && item !== 0) return this.estimate();

    const hashVal = this._hash(item);
    const regIdx = hashVal >>> (32 - this.p);
    const w = hashVal & ((1 << (32 - this.p)) - 1);
    const leadingZeros = this._clz(w, 32 - this.p);

    const oldVal = this.registers[regIdx];
    if (leadingZeros > oldVal) {
      // Xác suất phần tử gây ra biến cố nhảy thanh ghi trước khi cập nhật
      const pUpdate = this.sumPowersOfTwo / this.m;

      if (pUpdate > 0) {
        this.martingaleEstimate += 1.0 / pUpdate;
      }

      // Cập nhật sumPowersOfTwo: Trừ giá trị cũ, cộng giá trị mới
      this.sumPowersOfTwo -= Math.pow(2, -oldVal);
      this.sumPowersOfTwo += Math.pow(2, -leadingZeros);
      this.sumInv = this.sumPowersOfTwo;

      if (oldVal === 0) {
        this.zeros--;
      }

      this.registers[regIdx] = leadingZeros;
    }
    return this.estimate();
  }

  /**
   * Ước lượng độ tập hợp (Cardinality) hiện tại trong O(1)
   */
  estimate() {
    return Math.round(this.martingaleEstimate);
  }

  getEstimate() {
    return this.estimate();
  }

  getStandardHLLEstimate() {
    let sum = 0;
    let zeros = 0;
    for (let i = 0; i < this.m; i++) {
      sum += Math.pow(2, -this.registers[i]);
      if (this.registers[i] === 0) zeros++;
    }
    const alpha = 0.7213 / (1 + 1.079 / this.m);
    let raw = (alpha * this.m * this.m) / sum;
    if (raw <= 2.5 * this.m && zeros > 0) {
      return Math.round(this.m * Math.log(this.m / zeros));
    }
    return Math.round(raw);
  }

  getRegisterStats() {
    return {
      precision: this.p,
      numRegisters: this.m,
      zeroRegisters: this.zeros,
      sumPowersOfTwo: this.sumPowersOfTwo,
      sumInv: this.sumInv,
      martingaleEstimate: this.estimate()
    };
  }

  /**
   * Reset bộ ước lượng về trạng thái ban đầu
   */
  reset() {
    this.registers.fill(0);
    this.sumPowersOfTwo = this.m;
    this.sumInv = this.m;
    this.zeros = this.m;
    this.martingaleEstimate = 0.0;
  }
}

export { HLLMartingaleEstimator };
export default HLLMartingaleEstimator;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { HLLMartingaleEstimator };
  }
} catch (e) {}
