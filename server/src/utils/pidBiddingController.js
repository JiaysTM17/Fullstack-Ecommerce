/**
 * PID Feedback Controller for Real-Time Dynamic Ad Bidding (Shopee Ads Pacing & ROAS Optimizer)
 * 
 * Áp dụng nguyên lý điều khiển hồi tiếp vi tích phân tỉ lệ (PID):
 * u(t) = Kp * e(t) + Ki * ∫ e(τ) dτ + Kd * (de(t)/dt)
 * 
 * Giúp người bán điều chỉnh giá thầu đấu giá CPC tự động để:
 * 1. Đạt mục tiêu chi tiêu ngân sách đều đặn theo thời gian thực (Budget Pacing).
 * 2. Cân bằng chỉ số sinh lời quảng cáo (Target ROAS).
 * 3. Ngăn ngừa vọt lố (Overshoot) và cạn kiệt ngân sách sớm nhờ rào chắn chống bão hòa tích phân (Anti-Windup).
 */

export class PidBiddingController {
  /**
   * @param {Object} options
   * @param {number} options.kp - Hệ số tỉ lệ (Proportional Gain)
   * @param {number} options.ki - Hệ số tích phân (Integral Gain)
   * @param {number} options.kd - Hệ số vi phân (Derivative Gain)
   * @param {number} options.targetRoas - Mục tiêu doanh thu trên chi phí quảng cáo (VD: 4.0 = 400%)
   * @param {number} options.minBid - Giá thầu sàn tối thiểu (VND)
   * @param {number} options.maxBid - Giá thầu trần tối đa (VND)
   * @param {number} [options.antiWindupLimit] - Giới hạn tích lũy sai số tích phân (chống tràn)
   */
  constructor({
    kp = 0.5,
    ki = 0.05,
    kd = 0.1,
    targetRoas = 3.5,
    minBid = 500,
    maxBid = 20000,
    antiWindupLimit = 50
  } = {}) {
    this.kp = kp;
    this.ki = ki;
    this.kd = kd;
    this.targetRoas = targetRoas;
    this.minBid = minBid;
    this.maxBid = maxBid;
    this.antiWindupLimit = antiWindupLimit;

    this.integral = 0;
    this.previousError = 0;
    this.lastTimestamp = null;
  }

  /**
   * Reset trạng thái điều khiển hồi tiếp
   */
  reset() {
    this.integral = 0;
    this.previousError = 0;
    this.lastTimestamp = null;
  }

  /**
   * Cập nhật và tính toán giá thầu tiếp theo dựa trên ROAS hiện tại
   * Sai số: error = currentRoas - targetRoas
   * - Nếu currentRoas > targetRoas (quảng cáo đang rất hời) -> Tăng giá thầu để chiếm thêm hiển thị
   * - Nếu currentRoas < targetRoas (quảng cáo đang lỗ) -> Giảm giá thầu để bảo toàn vốn
   * 
   * @param {number} currentRoas - Chỉ số ROAS đo lường tức thời
   * @param {number} currentBid - Giá thầu hiện tại (VND)
   * @param {number} [dt=1.0] - Bước thời gian hoặc chu kỳ cập nhật
   * @returns {Object} Kết quả điều chỉnh giá thầu kèm chi tiết P, I, D
   */
  computeBidAdjustment(currentRoas, currentBid, dt = 1.0) {
    if (dt <= 0) dt = 1.0;

    // Sai số chuẩn hóa theo mục tiêu
    const rawError = currentRoas - this.targetRoas;
    const normalizedError = rawError / Math.max(1, this.targetRoas);

    // 1. Khâu tỉ lệ (Proportional)
    const pTerm = this.kp * normalizedError;

    // 2. Khâu tích phân (Integral) kèm rào chắn Anti-Windup
    this.integral += normalizedError * dt;
    if (this.integral > this.antiWindupLimit) this.integral = this.antiWindupLimit;
    if (this.integral < -this.antiWindupLimit) this.integral = -this.antiWindupLimit;
    const iTerm = this.ki * this.integral;

    // 3. Khâu vi phân (Derivative)
    const derivative = (normalizedError - this.previousError) / dt;
    const dTerm = this.kd * derivative;

    // Lưu lại sai số cho chu kỳ tiếp theo
    this.previousError = normalizedError;

    // Tổng độ điều chỉnh phần trăm (control effort)
    const controlEffort = pTerm + iTerm + dTerm;

    // Tính giá thầu đề xuất mới
    // Tăng hoặc giảm giá thầu theo tỷ lệ phần trăm của controlEffort
    const deltaBid = currentBid * controlEffort;
    let proposedBid = Math.round(currentBid + deltaBid);

    // Kẹp trong dải an toàn [minBid, maxBid]
    const clampedBid = Math.max(this.minBid, Math.min(this.maxBid, proposedBid));

    return {
      currentRoas,
      targetRoas: this.targetRoas,
      error: Number(normalizedError.toFixed(4)),
      pTerm: Number(pTerm.toFixed(4)),
      iTerm: Number(iTerm.toFixed(4)),
      dTerm: Number(dTerm.toFixed(4)),
      controlEffort: Number(controlEffort.toFixed(4)),
      currentBid,
      proposedBid: clampedBid,
      isClamped: clampedBid !== proposedBid,
      action: clampedBid > currentBid ? 'INCREASE' : clampedBid < currentBid ? 'DECREASE' : 'HOLD'
    };
  }

  /**
   * Tính toán tiến độ ngân sách trong ngày (Budget Pacing Controller)
   * Điều chỉnh giá thầu để tránh tiêu hết ngân sách trước 12h trưa hoặc tồn ngân sách vào ban đêm
   * 
   * @param {number} dailyBudget - Tổng ngân sách ngày (VND)
   * @param {number} spentBudget - Ngân sách đã chi tính đến thời điểm hiện tại (VND)
   * @param {number} currentHour - Giờ hiện tại trong ngày (0..23)
   * @param {number} currentBid - Giá thầu hiện tại
   * @returns {Object}
   */
  computeBudgetPacingAdjustment(dailyBudget, spentBudget, currentHour, currentBid) {
    if (dailyBudget <= 0) {
      return { action: 'PAUSE', proposedBid: 0, reason: 'Ngân sách không hợp lệ' };
    }

    if (spentBudget >= dailyBudget) {
      return { action: 'PAUSE', proposedBid: 0, reason: 'Đã cạn kiệt ngân sách ngày' };
    }

    // Tỷ lệ thời gian đã trôi qua trong ngày
    const timeFraction = Math.max(0.01, Math.min(1.0, (currentHour + 1) / 24));
    // Ngân sách kỳ vọng đã tiêu tại thời điểm này
    const expectedSpend = dailyBudget * timeFraction;
    
    // Sai số chi tiêu: Dương = Tiêu quá chậm (cần tăng bid), Âm = Tiêu quá nhanh (cần giảm bid)
    const spendPacingRatio = spentBudget / expectedSpend;

    let multiplier = 1.0;
    let pacingStatus = 'ON_TRACK';

    if (spendPacingRatio > 1.25) {
      // Đang tiêu quá nhanh so với kế hoạch (>25%), giảm giá thầu
      multiplier = Math.max(0.7, 1 - (spendPacingRatio - 1) * 0.5);
      pacingStatus = 'SPENDING_TOO_FAST';
    } else if (spendPacingRatio < 0.75) {
      // Đang tiêu quá chậm so với kế hoạch (<75%), tăng giá thầu để kích traffic
      multiplier = Math.min(1.4, 1 + (1 - spendPacingRatio) * 0.4);
      pacingStatus = 'SPENDING_TOO_SLOW';
    }

    const proposedBid = Math.max(this.minBid, Math.min(this.maxBid, Math.round(currentBid * multiplier)));

    return {
      dailyBudget,
      spentBudget,
      currentHour,
      timeFraction: Number(timeFraction.toFixed(2)),
      expectedSpend: Math.round(expectedSpend),
      spendPacingRatio: Number(spendPacingRatio.toFixed(3)),
      pacingStatus,
      currentBid,
      proposedBid,
      multiplier: Number(multiplier.toFixed(3))
    };
  }
}

export default {
  PidBiddingController
};


