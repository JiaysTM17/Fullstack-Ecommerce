/**
 * Holt-Winters Triple Exponential Smoothing Demand & Seasonality Forecaster
 * 
 * Thuật toán Dự Báo Chuỗi Thời Gian Holt-Winters (O(N) time, O(1) space):
 * 1. Mô hình dự báo ba thành phần thích ứng (Triple Exponential Smoothing):
 *    - Thành phần Mức cơ sở (Level - alpha): L_t = alpha * (Y_t - S_{t-m}) + (1 - alpha) * (L_{t-1} + T_{t-1})
 *    - Thành phần Xu hướng (Trend - beta): T_t = beta * (L_t - L_{t-1}) + (1 - beta) * T_{t-1}
 *    - Thành phần Mùa vụ (Seasonality - gamma): S_t = gamma * (Y_t - L_t) + (1 - gamma) * S_{t-m}
 * 2. Dự báo tương lai h bước nhảy (h-step ahead forecast):
 *    - F_{t+h} = L_t + h * T_t + S_{t - m + ((h - 1) % m) + 1}
 * 3. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Dự báo nhu cầu nhập kho theo mùa vụ (Mega Sale 11.11, 12.12, Tết Nguyên Đán, Flash Sale giờ vàng).
 *    - Tính toán điểm đặt hàng lại (Reorder Point) có điều chỉnh hệ số mùa vụ.
 */

export class HoltWintersDemandForecaster {
  /**
   * @param {Object} options
   * @param {number} [options.seasonLength=7] - Chu kỳ mùa vụ (m: 7 ngày cho chu kỳ tuần, 24 cho chu kỳ giờ)
   * @param {number} [options.alpha=0.3] - Trọng số làm mượt mức cơ sở (Level)
   * @param {number} [options.beta=0.1] - Trọng số làm mượt xu hướng (Trend)
   * @param {number} [options.gamma=0.2] - Trọng số làm mượt thành phần mùa vụ (Seasonality)
   */
  constructor({ seasonLength = 7, alpha = 0.3, beta = 0.1, gamma = 0.2 } = {}) {
    if (seasonLength < 2) throw new Error("seasonLength must be >= 2");
    this.seasonLength = seasonLength;
    this.alpha = alpha;
    this.beta = beta;
    this.gamma = gamma;
    this.level = 0;
    this.trend = 0;
    this.seasonal = [];
  }

  /**
   * Khởi tạo các giá trị ban đầu cho Level, Trend, và Seasonal Indices
   */
  _initModel(history = []) {
    const m = this.seasonLength;
    if (history.length < 2 * m) {
      throw new Error(`History length must be at least 2 * seasonLength (${2 * m}) for initialization`);
    }

    // 1. Khởi tạo Level ban đầu (trung bình chu kỳ đầu tiên)
    let sumSeason1 = 0;
    for (let i = 0; i < m; i++) sumSeason1 += history[i];
    this.level = sumSeason1 / m;

    // 2. Khởi tạo Trend ban đầu (độ chênh lệch trung bình giữa chu kỳ 2 và chu kỳ 1)
    let sumSeason2 = 0;
    for (let i = m; i < 2 * m; i++) sumSeason2 += history[i];
    this.trend = (sumSeason2 / m - this.level) / m;

    // 3. Khởi tạo Seasonal Indices ban đầu
    this.seasonal = new Array(m);
    for (let i = 0; i < m; i++) {
      this.seasonal[i] = history[i] - this.level;
    }
  }

  /**
   * Huấn luyện mô hình làm mượt lũy tiến trên toàn bộ dữ liệu lịch sử
   * @param {Array<number>} history - Mảng số lượng bán lịch sử theo chuỗi thời gian
   */
  fit(history = []) {
    if (!Array.isArray(history) || history.length < 2 * this.seasonLength) {
      throw new Error(`Insufficient history data. Need at least ${2 * this.seasonLength} data points.`);
    }

    this._initModel(history);
    const m = this.seasonLength;

    for (let t = 0; t < history.length; t++) {
      const y = history[t];
      const sIndex = t % m;
      const prevLevel = this.level;
      const prevTrend = this.trend;
      const prevSeasonal = this.seasonal[sIndex];

      // Cập nhật Level
      this.level = this.alpha * (y - prevSeasonal) + (1 - this.alpha) * (prevLevel + prevTrend);

      // Cập nhật Trend
      this.trend = this.beta * (this.level - prevLevel) + (1 - this.beta) * prevTrend;

      // Cập nhật Seasonal
      this.seasonal[sIndex] = this.gamma * (y - this.level) + (1 - this.gamma) * prevSeasonal;
    }

    return this;
  }

  /**
   * Dự báo nhu cầu bán hàng cho h bước tiếp theo (ví dụ: 7 ngày tới)
   * @param {number} [steps=7] - Số bước dự báo tương lai
   * @returns {Array<{ step: number, forecast: number, lowerBound: number, upperBound: number }>}
   */
  predict(steps = 7) {
    const m = this.seasonLength;
    const predictions = [];

    for (let h = 1; h <= steps; h++) {
      const sIndex = (h - 1) % m;
      const rawForecast = this.level + h * this.trend + this.seasonal[sIndex];
      const forecastVal = Math.max(0, Math.round(rawForecast));

      // Khoảng tin cậy ước lượng (Confidence Interval ±15%)
      const margin = Math.round(forecastVal * 0.15);

      predictions.push({
        step: h,
        forecast: forecastVal,
        lowerBound: Math.max(0, forecastVal - margin),
        upperBound: forecastVal + margin
      });
    }

    return predictions;
  }

  /**
   * Tính toán đề xuất nhập kho bổ sung (Reorder Planning)
   * @param {Object} inventoryParams
   * @param {number} inventoryParams.currentStock - Tồn kho hiện có
   * @param {number} inventoryParams.safetyStock - Ngưỡng tồn kho an toàn tối thiểu
   * @param {number} inventoryParams.leadTimeDays - Thời gian nhà cung cấp giao hàng (ngày)
   * @param {number} [inventoryParams.planningHorizonDays=7] - Khung thời gian lập kế hoạch (ngày)
   * @returns {Object}
   */
  calculateRestockRecommendation({ currentStock = 0, safetyStock = 10, leadTimeDays = 2, planningHorizonDays = 7 } = {}) {
    const predictions = this.predict(planningHorizonDays + leadTimeDays);
    const totalForecastDemand = predictions.reduce((sum, p) => sum + p.forecast, 0);

    const reorderPoint = safetyStock + predictions.slice(0, leadTimeDays).reduce((sum, p) => sum + p.forecast, 0);
    const needsReorder = currentStock <= reorderPoint;
    const recommendedOrderQty = needsReorder ? Math.max(0, totalForecastDemand + safetyStock - currentStock) : 0;

    return {
      currentStock,
      safetyStock,
      reorderPoint,
      needsReorder,
      recommendedOrderQty,
      forecastDemand: totalForecastDemand,
      dailyForecasts: predictions.slice(0, planningHorizonDays)
    };
  }
}
