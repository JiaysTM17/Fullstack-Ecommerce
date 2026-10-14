/**
 * Time-Decayed Reservoir Sampling for Live Hot Deals Stream
 * Thuật Toán Lấy Mẫu Hồ Chứa Suy Giảm Theo Thời Gian Cấp Doanh Nghiệp
 * 
 * Nguyên lý:
 * - Khi có hàng nghìn luồng giao dịch/sự kiện mua sắm dồn dập (Live Stream),
 *   hồ chứa (Reservoir) dung lượng K tự động chọn lọc mẫu phần tử đại diện.
 * - Trọng số của mỗi sự kiện suy giảm theo hàm mũ thời gian: w(t) = baseWeight * exp(-lambda * (now - t)).
 * - Sử dụng thuật toán A-Res (Efraimidis & Spirakis) kết hợp nhãn thời gian thực,
 *   đảm bảo các deal vừa mua gần đây có xác suất lưu giữ cao hơn,
 *   phục vụ widget "Deal Mới Mua / Xu Hướng Hot Trực Tiếp" mà không tốn RAM.
 */

export class TimeDecayedReservoirSampler {
  /**
   * @param {number} [capacity=10] - Dung lượng hồ chứa (số lượng deal tối đa cần giữ)
   * @param {Object} [options={}]
   * @param {number} [options.decayLambda=0.0001] - Hệ số suy giảm theo thời gian (giây)
   */
  constructor(capacity = 10, { decayLambda = 0.0001 } = {}) {
    this.capacity = Math.max(1, capacity);
    this.decayLambda = Math.max(1e-8, decayLambda);
    this.reservoir = []; // Array<{ item, key, timestamp, baseWeight, id }>
    this.totalProcessed = 0;
  }

  /**
   * Tính toán khóa ngẫu nhiên A-Res có tính đến suy giảm thời gian
   * key = u^(1 / w_eff), trong đó u ~ Uniform(0, 1), w_eff = baseWeight * exp(lambda * (t - t0))
   * Tương đương: log(key) = ln(u) / w_eff
   */
  _computeKey(baseWeight, timestamp, referenceTime) {
    const u = Math.random();
    const safeU = Math.max(1e-7, Math.min(0.9999999, u));
    // Thời gian trôi qua tính bằng giây
    const ageSeconds = Math.max(0, (referenceTime - timestamp) / 1000);
    const decayedWeight = Math.max(1e-6, baseWeight * Math.exp(-this.decayLambda * ageSeconds));

    // A-Res priority key: k = u^(1 / decayedWeight) -> càng gần 1 càng ưu tiên cao
    return Math.pow(safeU, 1.0 / decayedWeight);
  }

  /**
   * Thêm một sự kiện giao dịch / sản phẩm vào hồ chứa
   * @param {Object} item - Thông tin deal / đơn hàng
   * @param {number} [timestamp=Date.now()] - Thời điểm phát sinh sự kiện (ms)
   * @param {number} [baseWeight=1.0] - Trọng số ban đầu (ví dụ: giá trị đơn hàng hoặc số lượng mua)
   * @returns {boolean} true nếu được đưa vào reservoir
   */
  addItem(item, timestamp = Date.now(), baseWeight = 1.0) {
    this.totalProcessed++;
    const now = Date.now();
    const key = this._computeKey(baseWeight, timestamp, now);

    const entry = {
      item,
      key,
      timestamp,
      baseWeight: Number(baseWeight) || 1.0,
      id: item.id || `ITEM_${this.totalProcessed}`
    };

    if (this.reservoir.length < this.capacity) {
      this.reservoir.push(entry);
      // Sắp xếp tăng dần theo key (phần tử đầu tiên có key nhỏ nhất để dễ thay thế)
      this.reservoir.sort((a, b) => a.key - b.key);
      return true;
    }

    // Nếu reservoir đã đầy, kiểm tra xem key mới có lớn hơn phần tử nhỏ nhất (reservoir[0]) không
    if (key > this.reservoir[0].key) {
      this.reservoir[0] = entry;
      this.reservoir.sort((a, b) => a.key - b.key);
      return true;
    }

    return false;
  }

  /**
   * Lấy danh sách mẫu hiện tại trong hồ chứa, sắp xếp theo thời gian mới nhất
   * @returns {Array<Object>}
   */
  getSample() {
    return [...this.reservoir]
      .sort((a, b) => b.timestamp - a.timestamp)
      .map(entry => ({
        ...entry.item,
        sampledKey: Number(entry.key.toFixed(6)),
        timestamp: entry.timestamp,
        ageSeconds: Math.round((Date.now() - entry.timestamp) / 1000)
      }));
  }

  /**
   * Lấy top K deal hot có điểm xu hướng (Trending Score) cao nhất
   * Điểm xu hướng kết hợp trọng số đã suy giảm và giá trị deal
   * @param {number} [topK=5]
   * @returns {Array<Object>}
   */
  getTrendingDeals(topK = 5) {
    const now = Date.now();
    return [...this.reservoir]
      .map(entry => {
        const ageSec = Math.max(0, (now - entry.timestamp) / 1000);
        const currentEffectiveWeight = entry.baseWeight * Math.exp(-this.decayLambda * ageSec);
        return {
          ...entry.item,
          effectiveWeight: Number(currentEffectiveWeight.toFixed(4)),
          ageSeconds: Math.round(ageSec)
        };
      })
      .sort((a, b) => b.effectiveWeight - a.effectiveWeight)
      .slice(0, topK);
  }

  /**
   * Xóa toàn bộ hồ chứa
   */
  clear() {
    this.reservoir = [];
    this.totalProcessed = 0;
  }

  /**
   * Kích thước hiện tại của hồ chứa
   */
  get size() {
    return this.reservoir.length;
  }
}

export default TimeDecayedReservoirSampler;
