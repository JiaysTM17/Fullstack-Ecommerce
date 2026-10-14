/**
 * fenwickRankTree.js - Cây Fenwick (Binary Indexed Tree - BIT) Xếp Hạng Doanh Số & Phân Vị Doanh Nghiệp
 * 
 * NGUYÊN LÝ TOÁN HỌC & ĐỘ PHỨC TẠP:
 * 1. Cấu trúc BIT (Binary Indexed Tree):
 *    - Mỗi nút tại chỉ số `i` (1-based) lưu trữ tổng tích lũy của một đoạn độ dài `LSB(i) = i & (-i)`.
 *    - Thao tác cập nhật điểm/doanh số: `update(idx, delta)` nhảy theo chiều dương `i += i & (-i)` trong O(log M).
 *    - Thao tác tính tổng tiền tích lũy: `query(idx)` nhảy lùi `i -= i & (-i)` trong O(log M).
 * 2. Range Query:
 *    - `rangeQuery(left, right) = query(right) - query(left - 1)` trong O(log M).
 * 3. Binary Lifting trên BIT (Find K-th / Percentile Cutoff):
 *    - Tìm kiếm nhị phân trên các lũy thừa của 2 ngay trong cây BIT để xác định chỉ số có tổng tích lũy >= K trong O(log M).
 */

export class FenwickRankTree {
  /**
   * @param {number} maxSize - Kích thước tối đa của miền giá trị (mặc định 10,000 buckets)
   */
  constructor(maxSize = 10000) {
    this.maxSize = Math.max(16, maxSize);
    this.tree = new Float64Array(this.maxSize + 1);
    this.counts = new Int32Array(this.maxSize + 1);
    this.totalRecords = 0;
    this.totalGmv = 0;
  }

  /**
   * Cập nhật doanh số hoặc số lượng tại bucket chỉ số `idx`
   * @param {number} idx - Chỉ số bucket (1..maxSize)
   * @param {number} delta - Giá trị thay đổi (GMV hoặc số lượng)
   */
  update(idx, delta) {
    if (idx < 1 || idx > this.maxSize || isNaN(delta)) return false;
    let i = idx;
    while (i <= this.maxSize) {
      this.tree[i] += delta;
      i += i & (-i);
    }
    this.totalGmv += delta;
    return true;
  }

  /**
   * Truy vấn tổng tiền tích lũy (Prefix Sum) từ bucket 1 đến bucket `idx`
   * @param {number} idx - Chỉ số kết thúc
   * @returns {number}
   */
  query(idx) {
    if (idx < 1) return 0;
    const cappedIdx = Math.min(idx, this.maxSize);
    let sum = 0;
    let i = cappedIdx;
    while (i > 0) {
      sum += this.tree[i];
      i -= i & (-i);
    }
    return sum;
  }

  /**
   * Truy vấn tổng tiền trong một khoảng phân khúc [left, right]
   * @param {number} left
   * @param {number} right
   * @returns {number}
   */
  rangeQuery(left, right) {
    if (left > right) return 0;
    const l = Math.max(1, left);
    const r = Math.min(right, this.maxSize);
    return this.query(r) - this.query(l - 1);
  }

  /**
   * Ghi nhận một giao dịch người bán: cập nhật số lượng shop ở rank đó và GMV
   * @param {number} rankBucket - Phân bậc doanh số (1..maxSize)
   * @param {number} gmv - Doanh số giao dịch
   */
  recordMerchantSales(rankBucket, gmv) {
    const bucket = Math.max(1, Math.min(this.maxSize, Math.floor(rankBucket)));
    this.update(bucket, gmv);

    // Cập nhật số đếm merchant ở bucket đó
    let i = bucket;
    while (i <= this.maxSize) {
      this.counts[i] += 1;
      i += i & (-i);
    }
    this.totalRecords += 1;
  }

  /**
   * Đếm số lượng merchant có rank <= `idx`
   * @param {number} idx
   * @returns {number}
   */
  countMerchantsUpTo(idx) {
    if (idx < 1) return 0;
    const cappedIdx = Math.min(idx, this.maxSize);
    let count = 0;
    let i = cappedIdx;
    while (i > 0) {
      count += this.counts[i];
      i -= i & (-i);
    }
    return count;
  }

  /**
   * Binary Lifting trên BIT: Tìm bucket nhỏ nhất có tổng doanh số tích lũy đạt targetGmv trong O(log M)
   * @param {number} targetGmv
   * @returns {number} - Chỉ số bucket đạt ngưỡng
   */
  findBucketForGmv(targetGmv) {
    if (targetGmv <= 0) return 1;
    if (targetGmv > this.totalGmv) return this.maxSize;

    let idx = 0;
    let currentAccum = 0;

    // Tìm lũy thừa lớn nhất của 2 <= maxSize
    let p = 1;
    while (p * 2 <= this.maxSize) {
      p *= 2;
    }

    for (let step = p; step > 0; step >>= 1) {
      if (idx + step <= this.maxSize && currentAccum + this.tree[idx + step] < targetGmv) {
        idx += step;
        currentAccum += this.tree[idx];
      }
    }
    return idx + 1;
  }

  /**
   * Tính toán phân vị phân phối (Percentile) của một rank bucket (0% - 100%)
   * @param {number} bucket
   * @returns {number}
   */
  getPercentile(bucket) {
    if (this.totalRecords === 0) return 0;
    const merchantsBelow = this.countMerchantsUpTo(bucket);
    return Math.round((merchantsBelow / this.totalRecords) * 10000) / 100;
  }

  /**
   * Trả về thông tin tóm tắt tổng thể cây Fenwick
   */
  getSummary() {
    return {
      maxSize: this.maxSize,
      totalRecords: this.totalRecords,
      totalGmv: Math.round(this.totalGmv * 100) / 100,
      medianBucket: this.totalRecords > 0 ? this.findBucketForGmv(this.totalGmv / 2) : 1
    };
  }
}

export default FenwickRankTree;
