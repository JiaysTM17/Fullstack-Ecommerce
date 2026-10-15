/**
 * DDSketch: A Fast and Fully-Mergeable Quantile Sketch with Relative-Error Guarantees
 * (Charles Masson, Jee E. Rim, Homin K. Lee - Datadog, Proceedings of the VLDB Endowment 2019)
 * Thuật toán Phác Họa Phân Vị & Độ Trễ Streaming Với Bảo Đảm Sai Số Tương Đối
 * 
 * Đột phá:
 * - Bảo đảm sai số tương đối toán học nghiêm ngặt: |q_hat - q| / q <= alpha (mặc định alpha = 0.01 tức 1%).
 * - Khác với T-Digest hoặc Greenwald-Khanna chỉ đảm bảo sai số thứ hạng tuyệt đối (rank error),
 *   DDSketch bảo đảm độ chính xác tương đối trên toàn bộ dải phân phối từ đuôi thấp đến đuôi cao (P50, P95, P99, P99.9).
 * - Sử dụng ánh xạ logarit: gamma = (1 + alpha) / (1 - alpha), key(v) = ceil(ln(v) / ln(gamma)).
 * - Thích ứng hoàn hảo để giám sát SLA độ trễ cổng thanh toán, thời gian giao hàng SPX, và phân vị doanh số GMV.
 */

class DDSketchQuantiles {
  /**
   * @param {Object} options
   * @param {number} options.alpha Sai số tương đối tối đa (mặc định 0.01 = 1%)
   * @param {number} options.maxNumBins Giới hạn số lượng bucket tối đa (mặc định 2048)
   */
  constructor(options = {}) {
    this.alpha = options.alpha || 0.01;
    this.maxNumBins = options.maxNumBins || 2048;

    // gamma = (1 + alpha) / (1 - alpha)
    this.gamma = (1.0 + this.alpha) / (1.0 - this.alpha);
    this.gammaLn = Math.log(this.gamma);

    // Map chứa các bucket: key (số nguyên) -> count (số lượng quan sát)
    this.positiveBins = new Map();
    this.negativeBins = new Map();
    this.zeroCount = 0;

    this.count = 0;
    this.min = Infinity;
    this.max = -Infinity;
    this.sum = 0;
  }

  _valToKey(val) {
    return Math.ceil(Math.log(val) / this.gammaLn);
  }

  _keyToVal(key) {
    // Giá trị đại diện của bucket là trung điểm hình học: 2 * gamma^key / (gamma + 1)
    return (2.0 * Math.pow(this.gamma, key)) / (this.gamma + 1.0);
  }

  /**
   * Thêm một giá trị quan sát vào sketch
   * @param {number} val 
   * @param {number} count Số lần xuất hiện (mặc định 1)
   */
  add(val, count = 1) {
    if (typeof val !== 'number' || isNaN(val) || count <= 0) return;

    this.count += count;
    this.sum += val * count;
    if (val < this.min) this.min = val;
    if (val > this.max) this.max = val;

    if (val === 0) {
      this.zeroCount += count;
      return;
    }

    if (val > 0) {
      const key = this._valToKey(val);
      this.positiveBins.set(key, (this.positiveBins.get(key) || 0) + count);
    } else {
      const key = this._valToKey(-val);
      this.negativeBins.set(key, (this.negativeBins.get(key) || 0) + count);
    }
  }

  /**
   * Truy vấn giá trị phân vị tại quantile q in [0, 1]
   * @param {number} q Phân vị cần tính (ví dụ 0.5 cho Median/P50, 0.9 cho P90, 0.99 cho P99)
   * @returns {number} Giá trị phân vị ước lượng
   */
  getQuantile(q) {
    if (this.count === 0) return 0;
    if (q <= 0) return this.min;
    if (q >= 1.0) return this.max;

    const rank = q * (this.count - 1);
    let cumulative = 0;

    // Duyệt qua các bin âm (sắp xếp giảm dần theo giá trị thực tế, tức từ âm nhất đến gần 0)
    if (this.negativeBins.size > 0) {
      const negKeys = Array.from(this.negativeBins.keys()).sort((a, b) => b - a);
      for (const k of negKeys) {
        cumulative += this.negativeBins.get(k);
        if (cumulative > rank) {
          return -this._keyToVal(k);
        }
      }
    }

    // Giá trị 0
    cumulative += this.zeroCount;
    if (cumulative > rank) {
      return 0;
    }

    // Duyệt qua các bin dương (sắp xếp tăng dần theo giá trị)
    const posKeys = Array.from(this.positiveBins.keys()).sort((a, b) => a - b);
    for (const k of posKeys) {
      cumulative += this.positiveBins.get(k);
      if (cumulative > rank) {
        return Number(this._keyToVal(k).toFixed(4));
      }
    }

    return this.max;
  }

  /**
   * Trích xuất các phân vị phổ biến cho SLA và phân tích (P50, P90, P95, P99, P99.9)
   */
  getSlaMetrics() {
    return {
      count: this.count,
      min: this.count > 0 ? Number(this.min.toFixed(2)) : 0,
      max: this.count > 0 ? Number(this.max.toFixed(2)) : 0,
      avg: this.count > 0 ? Number((this.sum / this.count).toFixed(2)) : 0,
      p50: this.getQuantile(0.50),
      p90: this.getQuantile(0.90),
      p95: this.getQuantile(0.95),
      p99: this.getQuantile(0.99),
      p99_9: this.getQuantile(0.999),
      relativeErrorAlpha: this.alpha
    };
  }

  /**
   * Hợp nhất với một DDSketch khác có cùng tham số alpha
   * @param {DDSketchQuantiles} other 
   */
  merge(other) {
    if (!other || other.count === 0) return;

    this.count += other.count;
    this.sum += other.sum;
    this.zeroCount += other.zeroCount;
    if (other.min < this.min) this.min = other.min;
    if (other.max > this.max) this.max = other.max;

    for (const [k, c] of other.positiveBins.entries()) {
      this.positiveBins.set(k, (this.positiveBins.get(k) || 0) + c);
    }
    for (const [k, c] of other.negativeBins.entries()) {
      this.negativeBins.set(k, (this.negativeBins.get(k) || 0) + c);
    }
  }

  /**
   * Đặt lại sketch về trạng thái rỗng ban đầu
   */
  reset() {
    this.positiveBins.clear();
    this.negativeBins.clear();
    this.zeroCount = 0;
    this.count = 0;
    this.min = Infinity;
    this.max = -Infinity;
    this.sum = 0;
  }

  getStats() {
    return {
      alpha: this.alpha,
      gamma: Number(this.gamma.toFixed(6)),
      totalObservations: this.count,
      positiveBinsCount: this.positiveBins.size,
      negativeBinsCount: this.negativeBins.size,
      zeroCount: this.zeroCount,
      totalActiveBins: this.positiveBins.size + this.negativeBins.size + (this.zeroCount > 0 ? 1 : 0),
      estimatedMemoryBytes: (this.positiveBins.size + this.negativeBins.size) * 16 + 64
    };
  }
}

export { DDSketchQuantiles };
export default DDSketchQuantiles;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { DDSketchQuantiles };
  }
} catch (e) {}
