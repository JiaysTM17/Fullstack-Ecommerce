/**
 * vitterReservoirSampler.js - Thuật Toán Lấy Mẫu Hồ Chứa Tối Ưu Vitter (Algorithm L - Exponential Skip)
 * 
 * NGUYÊN LÝ TOÁN HỌC (Jeffrey Vitter 1985):
 * 1. Hạn chế của Algorithm R truyền thống:
 *    - Tạo số ngẫu nhiên cho TỪNG phần tử trong luồng dữ liệu (O(N) lần gọi Math.random()).
 * 2. Đột phá của Algorithm L:
 *    - Sử dụng biến ngẫu nhiên hình học (Geometric Random Variable) để TÍNH TRƯỚC khoảng cách nhảy S
 *      (số phần tử cần bỏ qua trước khi có một phần tử mới được chọn vào hồ chứa).
 *    - Công thức bước nhảy: S = floor( ln(U) / ln(1 - W) )
 *      với W được cập nhật: W = W * exp( ln(U) / K )
 * 3. Hiệu năng vượt bậc:
 *    - Giảm số lượng phép tính ngẫu nhiên từ O(N) xuống chỉ còn O(K * log(N / K)).
 *    - Đảm bảo xác suất lấy mẫu hoàn toàn đồng nhất và không thiên lệch (Uniform Unbiased Sampling):
 *      Mỗi phần tử trong luồng N phần tử có đúng xác suất K / N được nằm trong hồ chứa.
 */

export class VitterReservoirSampler {
  /**
   * @param {number} reservoirSize - Kích thước hồ chứa K
   * @param {Function} [randomFn=Math.random] - Bộ sinh số ngẫu nhiên (cho phép seed trong test)
   */
  constructor(reservoirSize = 100, randomFn = Math.random) {
    this.k = Math.max(1, reservoirSize);
    this.random = randomFn;
    this.reservoir = [];
    this.streamCount = 0;

    // Biến trạng thái Algorithm L
    this.w = 0;
    this.skipDistance = 0;
  }

  _nextRandom() {
    // Tránh giá trị 0 tuyệt đối để không lỗi ln(0) = -Infinity
    return Math.max(1e-12, Math.min(1 - 1e-12, this.random()));
  }

  _computeSkip() {
    const u = this._nextRandom();
    const s = Math.floor(Math.log(u) / Math.log(1 - this.w));
    return Math.max(0, s);
  }

  /**
   * Nạp một phần tử từ luồng sự kiện vào bộ lấy mẫu
   * @param {any} item - Giao dịch, clickstream event, SKU view
   * @returns {boolean} - true nếu phần tử được đưa vào hồ chứa, false nếu bị bỏ qua
   */
  add(item) {
    this.streamCount++;

    // Giai đoạn 1: Điền đầy K phần tử đầu tiên
    if (this.reservoir.length < this.k) {
      this.reservoir.push(item);
      if (this.reservoir.length === this.k) {
        // Khởi tạo trọng số W và khoảng nhảy S đầu tiên
        this.w = Math.exp(Math.log(this._nextRandom()) / this.k);
        this.skipDistance = this._computeSkip();
      }
      return true;
    }

    // Giai đoạn 2: Vitter Algorithm L exponential jump
    if (this.skipDistance > 0) {
      this.skipDistance--;
      return false;
    }

    // skipDistance == 0 -> Thay thế một phần tử ngẫu nhiên trong hồ chứa
    const replaceIdx = Math.floor(this._nextRandom() * this.k);
    this.reservoir[replaceIdx] = item;

    // Cập nhật lại W và tính bước nhảy S tiếp theo
    this.w = this.w * Math.exp(Math.log(this._nextRandom()) / this.k);
    this.skipDistance = this._computeSkip();
    return true;
  }

  /**
   * Thêm một mảng nhiều phần tử cùng lúc (Batch Streaming)
   * @param {Array<any>} items
   * @returns {number} - Số phần tử thực tế được đưa vào hồ chứa
   */
  addBatch(items) {
    if (!Array.isArray(items)) return 0;
    let accepted = 0;
    for (const item of items) {
      if (this.add(item)) accepted++;
    }
    return accepted;
  }

  /**
   * Trả về bản sao các mẫu ngẫu nhiên hiện có trong hồ chứa
   * @returns {Array<any>}
   */
  getSamples() {
    return [...this.reservoir];
  }

  /**
   * Thống kê thông số bộ lấy mẫu
   */
  getStats() {
    return {
      reservoirCapacity: this.k,
      currentSampleSize: this.reservoir.length,
      totalStreamCount: this.streamCount,
      samplingRate: this.streamCount > 0
        ? Math.round((Math.min(this.k, this.streamCount) / this.streamCount) * 10000) / 100
        : 100
    };
  }

  /**
   * Xóa sạch hồ chứa
   */
  reset() {
    this.reservoir = [];
    this.streamCount = 0;
    this.w = 0;
    this.skipDistance = 0;
  }
}

export default VitterReservoirSampler;
