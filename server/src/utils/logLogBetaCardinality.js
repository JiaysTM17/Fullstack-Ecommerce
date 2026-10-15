/**
 * LogLog-Beta: A More Accurate and Memory-Efficient Cardinality Estimator
 * (Jason Qin, Denys Kim, Yumei Tung - Google / arXiv:1612.02284, 2016)
 * Thuật toán ước lượng độ tập hợp (Cardinality Estimator) LogLog-Beta
 * Thay thế hàm hiệu chỉnh LinearCounting và Empirical Bias Table của HyperLogLog / HLL++
 * bằng công thức giải tích nghiệm kín beta(tau) trơn tru liên tục từ cardinality 0 đến vô cực.
 * Ứng dụng: Đo lường chính xác số người xem duy nhất (UV), thiết bị duy nhất theo từng Shop/Livestream
 */

function murmur32(key, seed = 0) {
  let h = seed;
  for (let i = 0; i < key.length; i++) {
    let k = key.charCodeAt(i);
    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);
    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = Math.imul(h, 5) + 0xe6546b64;
  }
  h ^= key.length;
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return (h >>> 0);
}

class LogLogBetaCardinality {
  /**
   * @param {Object} options
   * @param {number} options.precision Độ chính xác p (từ 4 đến 16, mặc định 10 -> m = 1024 registers)
   */
  constructor(options = {}) {
    this.p = Math.min(16, Math.max(4, options.precision || 10));
    this.m = 1 << this.p; // Số thanh ghi m = 2^p
    this.registers = new Uint8Array(this.m);

    // Hằng số alpha_m của Flajolet 2007
    if (this.m === 16) this.alphaM = 0.673;
    else if (this.m === 32) this.alphaM = 0.697;
    else if (this.m === 64) this.alphaM = 0.709;
    else this.alphaM = 0.7213 / (1 + 1.079 / this.m);
  }

  _hash(str) {
    return murmur32(str);
  }

  /**
   * Đếm số bit 0 liên tiếp dẫn đầu (Leading Zeros) + 1
   */
  _countLeadingZeros(val, maxBits) {
    if (val === 0) return maxBits + 1;
    let count = 1;
    let bit = 1 << (maxBits - 1);
    while ((val & bit) === 0 && count <= maxBits) {
      count++;
      bit >>>= 1;
    }
    return count;
  }

  /**
   * Ghi nhận một phần tử vào bộ đếm (ví dụ userId, deviceId, IP)
   * @param {string} item
   */
  add(item) {
    if (!item) return;
    const h = this._hash(String(item));
    // p bit đầu tiên xác định chỉ số thanh ghi (Register Index)
    const idx = h >>> (32 - this.p);
    // (32 - p) bit còn lại đếm số số 0 liên tiếp
    const w = h & ((1 << (32 - this.p)) - 1);
    const leadingZeros = this._countLeadingZeros(w, 32 - this.p);

    if (leadingZeros > this.registers[idx]) {
      this.registers[idx] = leadingZeros;
    }
  }

  /**
   * Hàm hiệu chỉnh sai số giải tích beta(tau) của LogLog-Beta (Qin et al. 2016)
   */
  _computeBeta(ez) {
    if (ez === 0) return 0;
    const zl = Math.log(ez + 1);
    return -0.370393911 * ez +
      0.070471823 * zl +
      0.17393686 * Math.pow(zl, 2) +
      0.163398357 * Math.pow(zl, 3) +
      -0.09237745 * Math.pow(zl, 4) +
      0.03738027 * Math.pow(zl, 5) +
      -0.005384159 * Math.pow(zl, 6);
  }

  /**
   * Ước lượng độ tập hợp (Cardinality) bằng công thức LogLog-Beta
   */
  estimate() {
    let sumHarmonic = 0;
    let numZeros = 0;

    for (let i = 0; i < this.m; i++) {
      const val = this.registers[i];
      sumHarmonic += Math.pow(2, -val);
      if (val === 0) {
        numZeros++;
      }
    }

    const z = numZeros;
    if (z === this.m) return 0;

    // LogLog-Beta blending
    if (z > 0) {
      const lc = this.m * Math.log(this.m / z);
      if (lc <= 2.5 * this.m) {
        return Math.round(lc);
      }
    }

    let estimateVal = (this.alphaM * this.m * this.m) / sumHarmonic;

    // Hiệu chỉnh biên trên cho phạm vi 32-bit
    if (estimateVal > (1 / 30) * Math.pow(2, 32)) {
      estimateVal = -Math.pow(2, 32) * Math.log(1 - estimateVal / Math.pow(2, 32));
    }

    return Math.max(0, Math.round(estimateVal));
  }

  /**
   * Hợp nhất (Merge) hai bộ đếm LogLogBeta có cùng tham số precision
   * @param {LogLogBetaCardinality} other
   */
  merge(other) {
    if (!other || other.p !== this.p) {
      throw new Error(`Cannot merge estimators with different precision: ${this.p} vs ${other?.p}`);
    }
    for (let i = 0; i < this.m; i++) {
      if (other.registers[i] > this.registers[i]) {
        this.registers[i] = other.registers[i];
      }
    }
  }

  /**
   * Reset bộ đếm về trạng thái rỗng
   */
  reset() {
    this.registers.fill(0);
  }
}

export { LogLogBetaCardinality };
export default LogLogBetaCardinality;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { LogLogBetaCardinality };
  }
} catch (e) {}
