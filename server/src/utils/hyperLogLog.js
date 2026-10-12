/**
 * HyperLogLog (HLL - Thuật toán ước lượng Cardinality đếm phần tử phân biệt siêu nhỏ)
 * 
 * Vấn đề:
 * Để đếm số lượng người xem độc nhất (Unique Viewers) trên phiên Shopee Live Stream
 * hoặc lượng người dùng hoạt động hàng ngày (Daily Active Users - DAU) lên tới hàng triệu người,
 * nếu dùng Set<string> lưu toàn bộ userId sẽ tiêu tốn hàng trăm MB đến hàng GB bộ nhớ RAM.
 * 
 * Giải pháp HyperLogLog (Flajolet et al.):
 * 1. Không gian bộ nhớ cố định siêu nhỏ (< 12KB):
 *    Sử dụng m = 2^b thanh ghi (registers) kiểu Uint8Array (mỗi thanh ghi chỉ tốn 1 byte).
 *    Ví dụ với b = 10 -> m = 1,024 bytes (~1KB RAM); với b = 12 -> m = 4,096 bytes (~4KB RAM).
 * 2. Kỹ thuật đếm số số 0 liên tiếp ở đầu chuỗi (Leading Zeros):
 *    Xác suất để một chuỗi băm ngẫu nhiên có k số 0 liên tiếp ở đầu là 2^(-k).
 *    Do đó, nếu số 0 liên tiếp lớn nhất ghi nhận được là k, số lượng phần tử xấp xỉ 2^k.
 * 3. Trung bình điều hòa (Harmonic Mean):
 *    Giảm thiểu tác động của các giá trị ngoại lai (Outliers) qua m thanh ghi.
 * 4. Hiệu chỉnh cho vùng số nhỏ (Linear Counting) & vùng số lớn (Large Range Correction).
 * 5. Khả năng gộp (Mergeable): Hai phiên đếm HLL có thể gộp lại tức thì bằng phép max(M1, M2).
 */

import { murmur32 } from "./bloomFilter.js";

export class HyperLogLog {
  /**
   * @param {number} precision - Số bit chỉ số thanh ghi (b = 4..16, mặc định b = 10 -> m = 1024 thanh ghi)
   */
  constructor(precision = 10) {
    this.b = Math.min(Math.max(precision, 4), 16);
    this.m = 1 << this.b; // m = 2^b
    this.registers = new Uint8Array(this.m);

    // Tính toán hằng số alpha_m để khử độ lệch (bias correction)
    if (this.m === 16) this.alpha = 0.673;
    else if (this.m === 32) this.alpha = 0.697;
    else if (this.m === 64) this.alpha = 0.709;
    else this.alpha = 0.7213 / (1 + 1.079 / this.m);
  }

  /**
   * Đếm số lượng bit 0 liên tiếp ở đầu (Leading Zeros) sau vị trí thứ b
   */
  _countLeadingZeros(value, maxBits) {
    let zeros = 0;
    for (let i = maxBits - 1; i >= 0; i--) {
      if ((value & (1 << i)) === 0) {
        zeros++;
      } else {
        break;
      }
    }
    return zeros + 1; // rho(w) = leading_zeros + 1
  }

  /**
   * Thêm một phần tử vào HLL
   */
  add(item) {
    if (item === undefined || item === null) return;
    const str = String(item);
    const hash = murmur32(str);

    // b bit đầu tiên dùng làm chỉ số thanh ghi (0 <= j < m)
    const j = hash >>> (32 - this.b);

    // 32 - b bit còn lại dùng để đếm số 0 liên tiếp
    const w = hash & ((1 << (32 - this.b)) - 1);
    const leadingZeros = this._countLeadingZeros(w, 32 - this.b);

    if (leadingZeros > this.registers[j]) {
      this.registers[j] = leadingZeros;
    }
  }

  /**
   * Thêm hàng loạt phần tử
   */
  addMany(items = []) {
    for (const it of items) this.add(it);
  }

  /**
   * Ước lượng số lượng phần tử duy nhất (Cardinality)
   */
  count() {
    // 1. Tính tổng trung bình điều hòa: sum(2^(-M[j]))
    let sum = 0;
    let zeroRegisters = 0;

    for (let j = 0; j < this.m; j++) {
      const val = this.registers[j];
      sum += Math.pow(2, -val);
      if (val === 0) {
        zeroRegisters++;
      }
    }

    // 2. Ước lượng thô (Raw Estimate): E = alpha_m * m^2 / sum
    let estimate = (this.alpha * this.m * this.m) / sum;

    // 3. Hiệu chỉnh vùng số lượng nhỏ (Small Range Correction - Linear Counting)
    if (estimate <= 2.5 * this.m) {
      if (zeroRegisters > 0) {
        estimate = this.m * Math.log(this.m / zeroRegisters);
      }
    }
    // 4. Hiệu chỉnh vùng số lượng cực lớn 32-bit (Large Range Correction)
    else if (estimate > (1 / 30) * 4294967296) {
      estimate = -4294967296 * Math.log(1 - estimate / 4294967296);
    }

    return Math.round(estimate);
  }

  /**
   * Gộp (Union) một HLL khác có cùng độ chính xác b vào HLL hiện tại
   */
  merge(otherHLL) {
    if (!otherHLL || otherHLL.m !== this.m) {
      throw new Error("Cannot merge HyperLogLog with different precision");
    }
    for (let j = 0; j < this.m; j++) {
      if (otherHLL.registers[j] > this.registers[j]) {
        this.registers[j] = otherHLL.registers[j];
      }
    }
  }

  /**
   * Xóa toàn bộ thanh ghi
   */
  clear() {
    this.registers.fill(0);
  }

  /**
   * Thống kê thông số kỹ thuật
   */
  getStats() {
    return {
      precisionBits: this.b,
      registersCount: this.m,
      memoryBytes: this.registers.byteLength,
      standardErrorPercent: Number(((1.04 / Math.sqrt(this.m)) * 100).toFixed(2)),
      estimatedCardinality: this.count(),
    };
  }
}
