/**
 * Soft Actor-Critic (SAC) with Maximum Entropy Reinforcement Learning (Haarnoja et al., ICML 2018)
 * Thuật toán Học Tăng Cường Cực Đại Hóa Entropy cho Tối Ưu Hóa Giá Xả Hàng Tồn Kho (Clearance Markdown)
 * Cân bằng tối ưu giữa Khám phá và Khai thác, sử dụng Double Q-Critics chống thiên lệch ước lượng quá mức
 */

class SacDynamicMarkdownPricing {
  constructor(options = {}) {
    this.obsDim = options.obsDim || 4; // [daysToExpiryRatio, stockRatio, velocityRate, currentMargin]
    this.actionDim = 1; // Mức chiết khấu xả hàng continuous a in [0.0, 1.0]

    this.gamma = options.gamma || 0.98;
    this.tau = options.tau || 0.05; // Tỷ lệ cập nhật mạng mục tiêu Polyak
    this.alpha = options.alpha || 0.2; // Hệ số nhiệt độ Entropy (Temperature)
    this.actorLr = options.actorLr || 0.01;
    this.criticLr = options.criticLr || 0.02;

    // Trọng số Actor Policy (Linear-Gaussian policy)
    this.actorMeanWeights = new Array(this.obsDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.actorLogStd = 0.0;

    // Double Q-Critics: W_q1, W_q2
    this.q1Weights = new Array(this.obsDim + 1).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.q2Weights = new Array(this.obsDim + 1).fill(0).map(() => (Math.random() - 0.5) * 0.1);

    // Target Critics: W_target_q1, W_target_q2
    this.targetQ1Weights = [...this.q1Weights];
    this.targetQ2Weights = [...this.q2Weights];

    this.replayBuffer = [];
    this.maxBufferSize = options.maxBufferSize || 1000;
  }

  /**
   * Tính kỳ vọng hành động (Mean Action) qua hàm kích hoạt Sigmoid
   */
  _forwardActor(obs) {
    let z = 0;
    for (let i = 0; i < this.obsDim; i++) {
      z += (obs[i] || 0) * this.actorMeanWeights[i];
    }
    // Sigmoid ánh xạ về [0, 1]
    const mean = 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, z))));
    const std = Math.exp(Math.max(-2, Math.min(1, this.actorLogStd)));
    return { mean, std };
  }

  /**
   * Lấy mẫu hành động qua thủ thuật tái tham số hóa (Reparameterization Trick)
   */
  sampleAction(obs, deterministic = false) {
    const { mean, std } = this._forwardActor(obs);
    if (deterministic) {
      return { action: mean, logProb: 0 };
    }

    // Box-Muller transform sinh biến ngẫu nhiên chuẩn Gauss
    const u1 = Math.max(1e-7, Math.random());
    const u2 = Math.random();
    const eps = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    let rawAction = mean + std * eps;
    // Kẹp hành động trong khoảng [0, 1] đại diện cho mức giảm giá từ 0% đến 50%
    const action = Math.max(0.0, Math.min(1.0, rawAction));

    // Log xác suất Gaussian
    const logProb = -0.5 * Math.pow((rawAction - mean) / (std + 1e-6), 2) - Math.log(std * Math.sqrt(2 * Math.PI));

    return { action, logProb };
  }

  /**
   * Đánh giá giá trị Q1(s, a) và Q2(s, a)
   */
  evaluateQ(obs, action, useTarget = false) {
    const input = [...obs, action];
    const w1 = useTarget ? this.targetQ1Weights : this.q1Weights;
    const w2 = useTarget ? this.targetQ2Weights : this.q2Weights;

    let q1 = 0;
    let q2 = 0;
    for (let i = 0; i < input.length; i++) {
      q1 += (input[i] || 0) * w1[i];
      q2 += (input[i] || 0) * w2[i];
    }
    return { q1, q2 };
  }

  /**
   * Lưu chuyển trạng thái (s, a, r, s', done)
   */
  storeTransition(obs, action, reward, nextObs, done = false) {
    if (this.replayBuffer.length >= this.maxBufferSize) {
      this.replayBuffer.shift();
    }
    this.replayBuffer.push({
      obs: [...obs],
      action: Number(action) || 0,
      reward: Number(reward) || 0,
      nextObs: [...nextObs],
      done: Boolean(done)
    });
  }

  /**
   * Cập nhật mạng Actor và Double Critics với mục tiêu Max-Entropy
   */
  trainBatch(batchSize = 16) {
    if (this.replayBuffer.length < 8) {
      return { trained: false, avgLoss: 0 };
    }

    const size = Math.min(batchSize, this.replayBuffer.length);
    let criticLossSum = 0;

    for (let i = 0; i < size; i++) {
      const idx = Math.floor(Math.random() * this.replayBuffer.length);
      const { obs, action, reward, nextObs, done } = this.replayBuffer[idx];

      // 1. Tính toán giá trị đích Bellman Target với Entropy Penalty:
      // y = r + gamma * (min(Q1_target, Q2_target) - alpha * log_pi(a'|s'))
      let targetQ = reward;
      if (!done) {
        const nextSample = this.sampleAction(nextObs, false);
        const nextQ = this.evaluateQ(nextObs, nextSample.action, true);
        const minNextQ = Math.min(nextQ.q1, nextQ.q2);
        targetQ += this.gamma * (minNextQ - this.alpha * nextSample.logProb);
      }

      // 2. Cập nhật Double Critics
      const currentQ = this.evaluateQ(obs, action, false);
      const err1 = targetQ - currentQ.q1;
      const err2 = targetQ - currentQ.q2;
      criticLossSum += err1 * err1 + err2 * err2;

      const input = [...obs, action];
      for (let d = 0; d < input.length; d++) {
        this.q1Weights[d] += this.criticLr * err1 * input[d];
        this.q2Weights[d] += this.criticLr * err2 * input[d];
      }

      // 3. Cập nhật Actor Policy: Tối đa hóa min(Q1, Q2) - alpha * log_pi
      const currentSample = this.sampleAction(obs, false);
      const qEval = this.evaluateQ(obs, currentSample.action, false);
      const minCurrentQ = Math.min(qEval.q1, qEval.q2);
      const actorAdvantage = minCurrentQ - this.alpha * currentSample.logProb;

      for (let d = 0; d < this.obsDim; d++) {
        this.actorMeanWeights[d] += this.actorLr * actorAdvantage * (obs[d] || 0) * 0.05;
      }

      // 4. Cập nhật mềm Polyak mạng mục tiêu (Polyak Averaging)
      for (let d = 0; d < input.length; d++) {
        this.targetQ1Weights[d] = this.tau * this.q1Weights[d] + (1 - this.tau) * this.targetQ1Weights[d];
        this.targetQ2Weights[d] = this.tau * this.q2Weights[d] + (1 - this.tau) * this.targetQ2Weights[d];
      }
    }

    return {
      trained: true,
      avgLoss: Number((criticLossSum / size).toFixed(4)),
      currentAlpha: this.alpha
    };
  }

  /**
   * Tính toán mức giá xả hàng tối ưu (Clearance Markdown Pricing)
   */
  computeClearancePricing(productContext) {
    const {
      basePrice = 200000,
      daysToExpiry = 45,      // Số ngày còn hạn sử dụng hoặc cuối mùa
      totalShelfDays = 180,   // Tổng vòng đời sản phẩm
      stockRemaining = 80,    // Tồn kho còn lại
      initialStock = 100,     // Tồn kho ban đầu
      dailySalesRate = 0.5,   // Tốc độ bán (sản phẩm/ngày)
      costPrice = 120000      // Giá vốn hàng bán (COGS)
    } = productContext;

    // Chuẩn hóa observation
    const daysRatio = Math.max(0, Math.min(1.0, daysToExpiry / (totalShelfDays || 1)));
    const stockRatio = Math.max(0, Math.min(1.0, stockRemaining / (initialStock || 1)));
    const velocityRate = Math.max(0, Math.min(1.0, dailySalesRate / 5.0));
    const marginRatio = Math.max(0, Math.min(1.0, (basePrice - costPrice) / (basePrice || 1)));

    const obs = [daysRatio, stockRatio, velocityRate, marginRatio];
    const { action } = this.sampleAction(obs, true); // Hành động tất định cho khuyến nghị

    // Ánh xạ action sang tỷ lệ chiết khấu (0% - 50%)
    const discountPercent = Math.round(action * 50);
    const clearancePrice = Math.max(costPrice * 0.95, Math.round(basePrice * (1 - discountPercent / 100)));
    const expectedRecoveryCash = Math.round(clearancePrice * stockRemaining);
    const estimatedDaysToClear = Math.max(1, Math.round(stockRemaining / (Math.max(0.1, dailySalesRate * (1 + action * 2)))));

    return {
      originalPrice: basePrice,
      costPrice,
      discountPercent,
      clearancePrice,
      expectedRecoveryCash,
      estimatedDaysToClear,
      entropyPolicyConfidence: Number((1.0 - Math.abs(action - 0.5)).toFixed(2)),
      recommendationLevel: daysRatio < 0.25 ? 'URGENT_CLEARANCE' : daysRatio < 0.5 ? 'MODERATE_MARKDOWN' : 'NORMAL_SALE'
    };
  }
}

export { SacDynamicMarkdownPricing };
export default SacDynamicMarkdownPricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SacDynamicMarkdownPricing };
  }
} catch (e) {}
