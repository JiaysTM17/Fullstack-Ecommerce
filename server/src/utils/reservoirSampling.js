/**
 * Reservoir Sampling (Algorithm R) for Unbounded Streaming E-Commerce Telemetry
 * 
 * Thuật toán Hồ Chứa Lấy Mẫu Ngẫu Nhiên Đồng Đều Kích Thước Cố Định O(1) Memory:
 * 1. Thu thập mẫu đại diện ngẫu nhiên K phần tử từ dòng chảy đơn hàng vô hạn (Unbounded Stream)
 *    mà không cần lưu toàn bộ dữ liệu vào RAM, chống tràn bộ nhớ Heap Out-of-Memory trong Siêu Sale.
 * 2. Bảo chứng toán học (Jeffrey Vitter 1985): Tại bất kỳ thời điểm N phần tử đã trôi qua,
 *    xác suất mỗi phần tử nằm trong hồ chứa K là hoàn toàn công bằng tuyệt đối: P = K / N.
 * 3. Hỗ trợ Super Admin và Data Science tính toán các chỉ số thống kê tức thời (Realtime AOV,
 *    tỷ lệ áp mã Voucher, độ lệch chuẩn giá trị đơn hàng) mà không làm tắc nghẽn luồng xử lý giao dịch.
 */

export class ReservoirSampling {
  /**
   * @param {number} [capacity=100] - Kích thước tối đa của hồ chứa mẫu
   * @param {Function} [randomFn=Math.random] - Hàm sinh số ngẫu nhiên (phục vụ deterministic testing)
   */
  constructor(capacity = 100, randomFn = Math.random) {
    if (capacity <= 0) throw new Error("Dung lượng hồ chứa phải lớn hơn 0.");
    this.capacity = capacity;
    this.randomFn = randomFn;

    this.reservoir = [];
    this.totalStreamCount = 0; // Tổng số phần tử đã trôi qua trong stream
  }

  /**
   * Đẩy một phần tử mới từ dòng chảy vào hồ chứa
   * @param {any} item - Dữ liệu đơn hàng hoặc sự kiện
   * @returns {boolean} true nếu phần tử được nhận vào hồ chứa, false nếu bị bỏ qua
   */
  add(item) {
    this.totalStreamCount++;

    // Giai đoạn 1: Khi hồ chứa chưa đầy (total <= capacity), nhận thẳng vào hồ
    if (this.reservoir.length < this.capacity) {
      this.reservoir.push(item);
      return true;
    }

    // Giai đoạn 2: Khi hồ chứa đã đầy, chọn ngẫu nhiên vị trí j trong [0, totalStreamCount - 1]
    // Xác suất trúng j < capacity đúng bằng capacity / totalStreamCount
    const j = Math.floor(this.randomFn() * this.totalStreamCount);

    if (j < this.capacity) {
      this.reservoir[j] = item;
      return true;
    }

    return false;
  }

  /**
   * Đẩy hàng loạt phần tử vào hồ chứa
   * @param {any[]} items
   */
  addBatch(items) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      this.add(item);
    }
  }

  /**
   * Lấy bản sao danh sách mẫu hiện tại trong hồ chứa
   * @returns {any[]}
   */
  getSample() {
    return [...this.reservoir];
  }

  /**
   * Tính toán các chỉ số thống kê thời gian thực từ mẫu hồ chứa
   * @param {Function} [valueExtractor=(item) => Number(item.total || item.amount || item)]
   * @returns {Object}
   */
  computeSampleStats(valueExtractor = (item) => Number(item.total || item.amount || item)) {
    const sampleSize = this.reservoir.length;
    if (sampleSize === 0) {
      return {
        sampleSize: 0,
        totalStreamCount: this.totalStreamCount,
        samplingRate: 0,
        mean: 0,
        min: 0,
        max: 0,
        stdDev: 0
      };
    }

    const values = this.reservoir.map(valueExtractor).filter(v => !isNaN(v));
    const count = values.length;
    if (count === 0) {
      return { sampleSize, totalStreamCount: this.totalStreamCount, mean: 0 };
    }

    const sum = values.reduce((s, v) => s + v, 0);
    const mean = Number((sum / count).toFixed(2));
    const min = Math.min(...values);
    const max = Math.max(...values);

    // Tính độ lệch chuẩn
    const variance = values.reduce((s, v) => s + Math.pow(v - mean, 2), 0) / count;
    const stdDev = Number(Math.sqrt(variance).toFixed(2));

    const samplingRate = Number(((sampleSize / this.totalStreamCount) * 100).toFixed(2));

    return {
      sampleSize,
      totalStreamCount: this.totalStreamCount,
      samplingRate: `${samplingRate}%`,
      mean,
      min,
      max,
      stdDev
    };
  }

  /**
   * Làm mới hồ chứa
   */
  reset() {
    this.reservoir = [];
    this.totalStreamCount = 0;
  }
}

export default {
  ReservoirSampling
};
