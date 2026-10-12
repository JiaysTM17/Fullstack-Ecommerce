/**
 * Bloom Filter (Cấu trúc dữ liệu xác suất chặn Cache Penetration)
 * 
 * Vấn đề:
 * Trong các đợt Siêu Sale của Shopee, hàng triệu bot hoặc người dùng liên tục quét thử
 * các mã voucher giảm giá rác hoặc truy vấn các SKU không tồn tại. Nếu mọi truy vấn đều chạm
 * tới database/disk, hệ thống sẽ bị nghẽn I/O và sập nguồn (Hiện tượng Cache Penetration).
 * 
 * Giải pháp Bloom Filter:
 * 1. Không gian bộ nhớ cực nhỏ: Sử dụng mảng bit Uint8Array kích thước m bits và k hàm băm tối ưu.
 * 2. Không bao giờ bỏ sót (Zero False Negatives): Nếu Bloom Filter trả về false, phần tử
 *    chắc chắn 100% không tồn tại trong hệ thống.
 * 3. Tỷ lệ dương tính giả FPR được kiểm soát bằng toán học: Xác suất một phần tử không có mà
 *    Bloom Filter báo có xấp xỉ p <= 1% (hoặc cấu hình theo nhu cầu).
 * 4. Kỹ thuật Double Hashing: Sinh k vị trí băm từ 2 hàm băm độc lập (h1, h2) theo công thức
 *    Kirsch-Mitzenmacher: gi(x) = (h1(x) + i * h2(x)) % m, đạt độ phức tạp O(k) siêu tốc (< 0.05ms).
 */

import { fnv1a32 } from "./consistentHashing.js";

/**
 * Murmur3-like 32-bit hash function độc lập thứ 2 cho kỹ thuật Double Hashing
 */
export function murmur32(str, seed = 0x9747b28c) {
  let h = seed ^ str.length;
  for (let i = 0; i < str.length; i++) {
    let k = str.charCodeAt(i);
    k = Math.imul(k, 0xcc9e2d51);
    k = (k << 15) | (k >>> 17);
    k = Math.imul(k, 0x1b873593);

    h ^= k;
    h = (h << 13) | (h >>> 19);
    h = (Math.imul(h, 5) + 0xe6546b64) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  h ^= h >>> 16;
  return h >>> 0;
}

export class BloomFilter {
  /**
   * @param {Object} options
   * @param {number} options.expectedElements - Số lượng phần tử dự kiến đưa vào bộ lọc (mặc định 10,000)
   * @param {number} options.falsePositiveRate - Tỷ lệ dương tính giả mục tiêu (mặc định 0.01 = 1%)
   */
  constructor({ expectedElements = 10000, falsePositiveRate = 0.01 } = {}) {
    this.n = Math.max(1, expectedElements);
    this.p = Math.min(Math.max(falsePositiveRate, 0.0001), 0.5);

    // Tính toán kích thước mảng bit tối ưu m = ceil(- (n * ln(p)) / (ln(2)^2))
    const ln2 = Math.LN2;
    const ln2Sq = ln2 * ln2;
    this.m = Math.ceil(-(this.n * Math.log(this.p)) / ln2Sq);

    // Tính toán số hàm băm tối ưu k = ceil((m / n) * ln(2))
    this.k = Math.max(1, Math.ceil((this.m / this.n) * ln2));

    // Khởi tạo mảng byte Uint8Array để lưu trữ m bits (mỗi byte = 8 bits)
    const byteLength = Math.ceil(this.m / 8);
    this.bitArray = new Uint8Array(byteLength);
    this.count = 0;
  }

  /**
   * Tạo ra k vị trí bit từ phần tử item bằng kỹ thuật Double Hashing
   */
  _getHashIndices(item) {
    const str = String(item);
    const h1 = fnv1a32(str);
    const h2 = murmur32(str);
    const indices = [];

    for (let i = 0; i < this.k; i++) {
      // gi(x) = (h1 + i * h2) % m
      const combined = (h1 + Math.imul(i, h2)) >>> 0;
      const index = combined % this.m;
      indices.push(index);
    }
    return indices;
  }

  /**
   * Thêm một phần tử vào Bloom Filter
   */
  add(item) {
    if (item === undefined || item === null) return;
    const indices = this._getHashIndices(item);
    for (const idx of indices) {
      const byteIdx = Math.floor(idx / 8);
      const bitOffset = idx % 8;
      this.bitArray[byteIdx] |= 1 << bitOffset;
    }
    this.count++;
  }

  /**
   * Thêm hàng loạt phần tử
   */
  addMany(items = []) {
    for (const it of items) {
      this.add(it);
    }
  }

  /**
   * Kiểm tra một phần tử có thể thuộc về tập hợp hay không
   * @returns {boolean}
   * - false: Chắc chắn 100% phần tử KHÔNG TỒN TẠI (Zero False Negatives)
   * - true: Phần tử CÓ THỂ TỒN TẠI (với xác suất dương tính giả <= p)
   */
  has(item) {
    if (item === undefined || item === null) return false;
    const indices = this._getHashIndices(item);
    for (const idx of indices) {
      const byteIdx = Math.floor(idx / 8);
      const bitOffset = idx % 8;
      if ((this.bitArray[byteIdx] & (1 << bitOffset)) === 0) {
        return false; // Phát hiện ít nhất 1 bit = 0 -> chắc chắn không có!
      }
    }
    return true; // Tất cả k bits đều = 1
  }

  /**
   * Xóa sạch bộ lọc
   */
  clear() {
    this.bitArray.fill(0);
    this.count = 0;
  }

  /**
   * Thống kê trạng thái và tính toán tỷ lệ lấp đầy (Fill Ratio)
   */
  getStats() {
    let bitsSet = 0;
    for (let i = 0; i < this.bitArray.length; i++) {
      let byte = this.bitArray[i];
      // Đếm số bit 1 trong byte (Brian Kernighan's algorithm)
      while (byte > 0) {
        byte &= byte - 1;
        bitsSet++;
      }
    }
    const fillRatio = Number(((bitsSet / this.m) * 100).toFixed(2));
    
    // Ước tính tỷ lệ False Positive thực tế hiện tại: (1 - e^(-k * count / m))^k
    const expTerm = Math.exp((-this.k * this.count) / this.m);
    const estimatedFPR = Math.pow(1 - expTerm, this.k);

    return {
      sizeBits: this.m,
      sizeBytes: this.bitArray.byteLength,
      numHashFunctions: this.k,
      expectedElements: this.n,
      currentElements: this.count,
      targetFpr: this.p,
      fillRatioPercent: fillRatio,
      estimatedCurrentFpr: Number(estimatedFPR.toFixed(6)),
    };
  }
}
