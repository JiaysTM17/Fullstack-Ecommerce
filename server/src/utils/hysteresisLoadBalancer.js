/**
 * hysteresisLoadBalancer.js - Bộ Điều Phối Tải Độ Trễ Từ Trễ (Hysteresis) & Chống Rung Giật (Anti-Flapping)
 * 
 * NGUYÊN LÝ ĐIỀU KHIỂN HỆ THỐNG:
 * 1. Hiện tượng Flapping / Churn trong hệ thống TMĐT:
 *    - Khi áp dụng ngưỡng đơn (Single Threshold: ví dụ 80% CPU hoặc 1000 req/s), lưu lượng dao động
 *      quanh ngưỡng này khiến hệ thống liên tục chuyển đổi trạng thái BÌNH THƯỜNG <-> THOÁI HÓA (Flapping).
 * 2. Vòng lặp Từ Trễ (Hysteresis Loop - Dual Watermarks):
 *    - Ngưỡng cao (High Watermark H): Chuyển từ NORMAL sang DEGRADED khi tải > H (ví dụ: 80%).
 *    - Ngưỡng thấp (Low Watermark L < H): Chuyển từ DEGRADED về NORMAL khi tải < L (ví dụ: 50%).
 *    - Vùng chết (Deadband / Hysteresis Band) giữa L và H: Giữ nguyên trạng thái hiện tại.
 * 3. Làm mịn trung bình động hàm mũ (EWMA) & Cooldown:
 *    - S_t = alpha * X_t + (1 - alpha) * S_{t-1} loại bỏ các gai nhọn tạm thời (Spikes).
 *    - Cooldown Time: Thời gian tối thiểu giữa 2 lần thay đổi trạng thái liên tiếp.
 */

export const HYSTERESIS_STATE = {
  NORMAL: 'NORMAL',         // Đầy đủ tính năng: AI recommendations, Real-time telemetry
  DEGRADED: 'DEGRADED'      // Thoái hóa an toàn: Tắt background AI, bật Read-only cache fallback
};

export class HysteresisLoadBalancer {
  /**
   * @param {Object} options
   * @param {number} [options.highWatermark=80] - Ngưỡng tải cao kích hoạt thoái hóa
   * @param {number} [options.lowWatermark=50] - Ngưỡng tải thấp phục hồi bình thường
   * @param {number} [options.ewmaAlpha=0.3] - Hệ số làm mịn EWMA (0 < alpha <= 1)
   * @param {number} [options.cooldownMs=2000] - Thời gian chờ chống đổi trạng thái liên tục
   */
  constructor({
    highWatermark = 80,
    lowWatermark = 50,
    ewmaAlpha = 0.3,
    cooldownMs = 2000
  } = {}) {
    if (lowWatermark >= highWatermark) {
      throw new Error("lowWatermark must be strictly less than highWatermark");
    }
    this.highWatermark = highWatermark;
    this.lowWatermark = lowWatermark;
    this.alpha = Math.max(0.01, Math.min(1.0, ewmaAlpha));
    this.cooldownMs = Math.max(0, cooldownMs);

    this.state = HYSTERESIS_STATE.NORMAL;
    this.smoothedMetric = 0;
    this.lastTransitionTime = 0;
    this.transitionsCount = 0;
    this.totalSamples = 0;
  }

  /**
   * Cập nhật chỉ số tải hệ thống (ví dụ: CPU%, Request Queue Length, Memory%)
   * @param {number} currentMetric - Giá trị tức thời hiện tại
   * @param {number} [now=Date.now()]
   * @returns {{ state: string, smoothedMetric: number, stateChanged: boolean }}
   */
  recordSample(currentMetric, now = Date.now()) {
    const val = Number(currentMetric);
    this.totalSamples++;

    if (this.totalSamples === 1) {
      this.smoothedMetric = val;
    } else {
      this.smoothedMetric = this.alpha * val + (1 - this.alpha) * this.smoothedMetric;
    }

    let stateChanged = false;
    const canTransition = (now - this.lastTransitionTime) >= this.cooldownMs;

    if (canTransition) {
      if (this.state === HYSTERESIS_STATE.NORMAL && this.smoothedMetric > this.highWatermark) {
        this.state = HYSTERESIS_STATE.DEGRADED;
        this.lastTransitionTime = now;
        this.transitionsCount++;
        stateChanged = true;
      } else if (this.state === HYSTERESIS_STATE.DEGRADED && this.smoothedMetric < this.lowWatermark) {
        this.state = HYSTERESIS_STATE.NORMAL;
        this.lastTransitionTime = now;
        this.transitionsCount++;
        stateChanged = true;
      }
    }

    return {
      state: this.state,
      smoothedMetric: Math.round(this.smoothedMetric * 100) / 100,
      stateChanged
    };
  }

  /**
   * Quyết định xem một dịch vụ tùy chọn (như AI Gợi ý hay Telemetry nặng) có nên bị hạn chế (shed)
   * @param {string} [serviceType='OPTIONAL'] - 'CRITICAL' (thanh toán) hoặc 'OPTIONAL' (gợi ý)
   * @returns {boolean} - true nếu nên tiết giảm, false nếu cho phép chạy đầy đủ
   */
  shouldShedLoad(serviceType = 'OPTIONAL') {
    if (serviceType === 'CRITICAL') {
      return false; // Giao dịch cốt lõi không bao giờ bị shed
    }
    return this.state === HYSTERESIS_STATE.DEGRADED;
  }

  /**
   * Trả về thông số chi tiết của bộ điều phối tải
   */
  getMetrics() {
    return {
      state: this.state,
      highWatermark: this.highWatermark,
      lowWatermark: this.lowWatermark,
      deadbandWidth: this.highWatermark - this.lowWatermark,
      smoothedMetric: Math.round(this.smoothedMetric * 100) / 100,
      transitionsCount: this.transitionsCount,
      totalSamples: this.totalSamples
    };
  }

  reset() {
    this.state = HYSTERESIS_STATE.NORMAL;
    this.smoothedMetric = 0;
    this.lastTransitionTime = 0;
    this.transitionsCount = 0;
    this.totalSamples = 0;
  }
}

export default HysteresisLoadBalancer;
