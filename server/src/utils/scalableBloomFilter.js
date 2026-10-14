/**
 * Scalable Bloom Filter with Dynamic Tightening Slices
 * Thuật Toán Lọc Bloom Mở Rộng Không Giới Hạn Almeida et al. (2007)
 * 
 * Ứng dụng TMĐT:
 * - Chống trùng lặp mã giao dịch thanh toán VietQR / Thẻ tín dụng và voucher redeemed không giới hạn kích thước.
 * - Danh sách đen (Blacklist) IP gian lận, bot click ảo tự động mở rộng lát cắt (slices).
 * - Tỷ lệ sai số dương (False Positive Rate) tổng thể luôn được khống chế chặt chẽ dưới ngưỡng mục tiêu P_target (<= 1%)
 *   bất kể dữ liệu tăng trưởng gấp hàng trăm lần dung lượng dự tính ban đầu.
 */

export class BloomSlice {
  /**
   * @param {number} capacity - Số lượng phần tử tối đa cho lát cắt này
   * @param {number} fpRate - Tỷ lệ lỗi dương tính giả mong muốn cho lát cắt này
   * @param {number} sliceIndex - Thứ tự lát cắt (dùng để biến thiên seed băm)
   */
  constructor(capacity, fpRate, sliceIndex = 0) {
    this.capacity = Math.max(10, capacity);
    this.fpRate = Math.min(0.5, Math.max(1e-6, fpRate));
    this.sliceIndex = sliceIndex;
    this.count = 0;

    // m = - (n * ln(p)) / (ln(2)^2)
    this.m = Math.ceil(- (this.capacity * Math.log(this.fpRate)) / (Math.LN2 * Math.LN2));
    // k = (m / n) * ln(2)
    this.k = Math.max(1, Math.round((this.m / this.capacity) * Math.LN2));

    this.bitArray = new Uint8Array(Math.ceil(this.m / 8));
  }

  /**
   * Murmur3 băm biến thiên theo hạt giống
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

    return (h1 >>> 0) % this.m;
  }

  add(item) {
    for (let i = 0; i < this.k; i++) {
      const bitIndex = this._hash(item, (this.sliceIndex * 1000) + (i * 31) + 17);
      const byteIndex = bitIndex >> 3;
      const bitOffset = bitIndex & 7;
      this.bitArray[byteIndex] |= (1 << bitOffset);
    }
    this.count++;
  }

  has(item) {
    for (let i = 0; i < this.k; i++) {
      const bitIndex = this._hash(item, (this.sliceIndex * 1000) + (i * 31) + 17);
      const byteIndex = bitIndex >> 3;
      const bitOffset = bitIndex & 7;
      if ((this.bitArray[byteIndex] & (1 << bitOffset)) === 0) {
        return false;
      }
    }
    return true;
  }

  isFull() {
    return this.count >= this.capacity;
  }
}

export class ScalableBloomFilter {
  /**
   * @param {Object} [options]
   * @param {number} [options.initialCapacity=1000] - Sức chứa lát cắt đầu tiên
   * @param {number} [options.targetFpRate=0.01] - Tỷ lệ dương tính giả mục tiêu tổng thể (ví dụ: 0.01 = 1%)
   * @param {number} [options.scaleFactor=2] - Hệ số nhân sức chứa cho các lát cắt tiếp theo (s)
   * @param {number} [options.tighteningRatio=0.85] - Tỷ lệ thắt chặt sai số cho từng lát cắt (r)
   */
  constructor(options = {}) {
    this.initialCapacity = Math.max(10, options.initialCapacity || 1000);
    this.targetFpRate = Math.min(0.2, Math.max(0.0001, options.targetFpRate || 0.01));
    this.scaleFactor = Math.max(1.5, options.scaleFactor || 2.0);
    this.tighteningRatio = Math.min(0.95, Math.max(0.5, options.tighteningRatio || 0.85));

    // Sai số của lát cắt đầu tiên p_0 sao cho tổng sai số hình học không vượt quá targetFpRate:
    // p_total = p0 / (1 - r) <= targetFpRate => p0 = targetFpRate * (1 - r)
    this.initialSliceFp = this.targetFpRate * (1 - this.tighteningRatio);

    this.slices = [
      new BloomSlice(this.initialCapacity, this.initialSliceFp, 0)
    ];

    this.totalElements = 0;
  }

  /**
   * Thêm một phần tử vào Scalable Bloom Filter
   * @param {string|number} item
   */
  add(item) {
    if (item === undefined || item === null) return;
    const str = String(item);

    // Kiểm tra lát cắt hiện tại, nếu đầy thì tạo lát cắt mới với dung lượng nhân lên và sai số thắt chặt
    let activeSlice = this.slices[this.slices.length - 1];
    if (activeSlice.isFull()) {
      const nextIndex = this.slices.length;
      const nextCapacity = Math.round(this.initialCapacity * Math.pow(this.scaleFactor, nextIndex));
      const nextFp = this.initialSliceFp * Math.pow(this.tighteningRatio, nextIndex);
      activeSlice = new BloomSlice(nextCapacity, nextFp, nextIndex);
      this.slices.push(activeSlice);
    }

    activeSlice.add(str);
    this.totalElements++;
  }

  /**
   * Kiểm tra một phần tử có thể đã tồn tại hay chưa
   * @param {string|number} item
   * @returns {boolean} true nếu có thể tồn tại, false chắc chắn không tồn tại
   */
  has(item) {
    if (item === undefined || item === null) return false;
    const str = String(item);

    // Duyệt từ lát cắt mới nhất về cũ nhất (xác suất trùng cao hơn ở lát cắt gần đây)
    for (let i = this.slices.length - 1; i >= 0; i--) {
      if (this.slices[i].has(str)) {
        return true;
      }
    }
    return false;
  }

  /**
   * Thống kê các thông số của Scalable Bloom Filter
   */
  getStats() {
    let totalBits = 0;
    let totalBytes = 0;
    for (const slice of this.slices) {
      totalBits += slice.m;
      totalBytes += slice.bitArray.length;
    }

    return {
      totalElements: this.totalElements,
      totalSlices: this.slices.length,
      targetFpRate: this.targetFpRate,
      currentTheoreticalFpRate: Number((this.targetFpRate * (1 - Math.pow(this.tighteningRatio, this.slices.length))).toFixed(6)),
      totalMemoryBytes: totalBytes,
      totalBits: totalBits,
      slicesDetail: this.slices.map(s => ({
        sliceIndex: s.sliceIndex,
        capacity: s.capacity,
        count: s.count,
        mBits: s.m,
        kHashes: s.k,
        fpRate: s.fpRate
      }))
    };
  }

  /**
   * Xóa sạch các lát cắt và đưa về trạng thái ban đầu
   */
  clear() {
    this.slices = [
      new BloomSlice(this.initialCapacity, this.initialSliceFp, 0)
    ];
    this.totalElements = 0;
  }
}

export default ScalableBloomFilter;
