/**
 * Soft Actor-Critic with Automatic Entropy Temperature Tuning (SAC-Auto)
 * (Haarnoja, Zhou, Abbeel, Levine, ICML 2018 / arXiv:1812.05905)
 * Thuật toán Học Tăng Cường Tối Đa Hóa Entropy (Maximum Entropy RL)
 * Tự động điều chỉnh tham số nhiệt độ entropy alpha theo mục tiêu Target Entropy H_bar = -dim(A)
 * Cặp đôi Twin Q-Networks (Q1, Q2) giảm thiểu chệch ước lượng (Overestimation Bias)
 * Ứng dụng: Tự động điều chỉnh giá thầu đấu giá tài trợ Shopee Ads (CPC Bidding)
 * Tối đa hóa tỷ suất sinh lời ROAS trong khi liên tục khám phá từ khóa tìm kiếm mới
 */

class SACAutoBiddingEngine {
  constructor(options = {}) {
    this.stateDim = options.stateDim || 4; // [adRank, currentCtr, roasRatio, budgetRemainingRatio]
    this.actionDim = options.actionDim || 1; // [normalizedBidAdjustment: -1.0 -> +1.0]
    this.gamma = options.gamma || 0.95;
    this.tau = options.tau || 0.05; // Soft target update (Polyak)
    this.lr = options.lr || 0.02;

    // Mục tiêu Entropy tự động: H_bar = -dim(A)
    this.targetEntropy = options.targetEntropy || -this.actionDim;
    // Log alpha khởi tạo (nhiệt độ entropy)
    this.logAlpha = options.initLogAlpha !== undefined ? options.initLogAlpha : 0.0;
    this.alphaLr = options.alphaLr || 0.01;

    // Khởi tạo trọng số Actor Policy: mu và logStd
    this.actorMu = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.actorLogStd = new Array(this.stateDim).fill(0).map(() => -0.5); // std ban đầu ~ 0.6

    // Khởi tạo Twin Critic Q-Networks: Q1 và Q2
    this.q1Weights = new Array(this.stateDim + this.actionDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.q2Weights = new Array(this.stateDim + this.actionDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);

    // Target Critic Networks
    this.targetQ1Weights = [...this.q1Weights];
    this.targetQ2Weights = [...this.q2Weights];

    this.replayBuffer = [];
    this.maxBufferSize = options.maxBufferSize || 500;
  }

  get alpha() {
    return Math.exp(this.logAlpha);
  }

  /**
   * Tính toán tham số phân phối hành động [mu, std] từ trạng thái
   */
  _forwardActor(state) {
    let mu = 0;
    let logStd = 0;
    for (let i = 0; i < this.stateDim; i++) {
      mu += (state[i] || 0) * this.actorMu[i];
      logStd += (state[i] || 0) * this.actorLogStd[i];
    }
    // Kẹp logStd trong khoảng [-2, 1] để ổn định số học
    logStd = Math.max(-2, Math.min(1, logStd));
    const std = Math.exp(logStd);
    return { mu, std, logStd };
  }

  /**
   * Lấy mẫu hành động bằng Reparameterization Trick kết hợp hàm Squashed Tanh
   * a = tanh(mu + std * eps)
   */
  sampleAction(state, deterministic = false) {
    const { mu, std } = this._forwardActor(state);
    if (deterministic) {
      const a = Math.tanh(mu);
      return { action: a, logProb: 0 };
    }

    // Box-Muller transform sinh biến chuẩn tắc N(0, 1)
    const u1 = Math.max(1e-7, Math.random());
    const u2 = Math.random();
    const eps = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);

    const preTanh = mu + std * eps;
    const action = Math.tanh(preTanh);

    // Tính log xác suất có hiệu chỉnh Jacobian của hàm tanh:
    // log pi(a|s) = log N(preTanh | mu, std) - sum log(1 - a^2 + 1e-6)
    const logGaussian = -0.5 * Math.log(2 * Math.PI) - Math.log(std) - 0.5 * Math.pow((preTanh - mu) / std, 2);
    const logJacobian = Math.log(Math.max(1e-6, 1.0 - Math.pow(action, 2)));
    const logProb = logGaussian - logJacobian;

    return { action, logProb };
  }

  /**
   * Đánh giá giá trị Q của Critic
   */
  _predictQ(weights, state, action) {
    let q = 0;
    for (let i = 0; i < this.stateDim; i++) {
      q += (state[i] || 0) * weights[i];
    }
    q += action * weights[this.stateDim];
    return q;
  }

  /**
   * Lưu chuyển tiếp trạng thái vào Replay Buffer
   */
  recordExperience(state, action, reward, nextState, done = false) {
    this.replayBuffer.push({
      state: [...state],
      action: Number(action),
      reward: Number(reward),
      nextState: [...nextState],
      done: Boolean(done)
    });
    if (this.replayBuffer.length > this.maxBufferSize) {
      this.replayBuffer.shift();
    }
  }

  /**
   * Bước huấn luyện SAC-Auto:
   * 1. Cập nhật Twin Critic Q1, Q2
   * 2. Cập nhật Actor Policy với Entropy Regularization
   * 3. Tự động điều chỉnh nhiệt độ alpha (Automatic Entropy Tuning)
   * 4. Cập nhật Polyak sang Target Networks
   */
  trainStep(batchSize = 16) {
    if (this.replayBuffer.length < 4) {
      return { trained: false, alpha: this.alpha };
    }

    const size = Math.min(batchSize, this.replayBuffer.length);
    let totalCriticLoss = 0;
    let avgLogProb = 0;

    for (let b = 0; b < size; b++) {
      const idx = Math.floor(Math.random() * this.replayBuffer.length);
      const { state, action, reward, nextState, done } = this.replayBuffer[idx];

      // 1. Tính Q-Target từ next state
      const nextSample = this.sampleAction(nextState, false);
      const targetQ1 = this._predictQ(this.targetQ1Weights, nextState, nextSample.action);
      const targetQ2 = this._predictQ(this.targetQ2Weights, nextState, nextSample.action);
      const minTargetQ = Math.min(targetQ1, targetQ2) - this.alpha * nextSample.logProb;
      const targetValue = reward + (done ? 0 : this.gamma * minTargetQ);

      // Cập nhật Q1, Q2
      const currentQ1 = this._predictQ(this.q1Weights, state, action);
      const currentQ2 = this._predictQ(this.q2Weights, state, action);
      const err1 = targetValue - currentQ1;
      const err2 = targetValue - currentQ2;

      for (let i = 0; i < this.stateDim; i++) {
        this.q1Weights[i] += this.lr * err1 * (state[i] || 0) * 0.1;
        this.q2Weights[i] += this.lr * err2 * (state[i] || 0) * 0.1;
      }
      this.q1Weights[this.stateDim] += this.lr * err1 * action * 0.1;
      this.q2Weights[this.stateDim] += this.lr * err2 * action * 0.1;

      totalCriticLoss += (err1 * err1 + err2 * err2) / 2;

      // 2. Lấy mẫu hành động từ chính sách hiện tại để cập nhật Actor
      const actorSample = this.sampleAction(state, false);
      const qVal = this._predictQ(this.q1Weights, state, actorSample.action);
      // Actor loss gradient: maximize (Q(s, a) - alpha * log_pi(a|s))
      const actorAdvantage = qVal - this.alpha * actorSample.logProb;

      for (let i = 0; i < this.stateDim; i++) {
        this.actorMu[i] += this.lr * actorAdvantage * (state[i] || 0) * 0.05;
        this.actorLogStd[i] += this.lr * (this.alpha * -actorSample.logProb) * (state[i] || 0) * 0.01;
      }

      avgLogProb += actorSample.logProb;
    }

    avgLogProb /= size;

    // 3. Tự động điều chỉnh nhiệt độ Entropy Alpha:
    // J(alpha) = E [-alpha * log_pi(a|s) - alpha * targetEntropy]
    // dJ/d(log_alpha) = -alpha * (log_pi(a|s) + targetEntropy)
    const alphaGrad = -this.alpha * (avgLogProb + this.targetEntropy);
    this.logAlpha -= this.alphaLr * alphaGrad;
    // Giới hạn logAlpha để ổn định nhiệt độ
    this.logAlpha = Math.max(-5.0, Math.min(2.0, this.logAlpha));

    // 4. Cập nhật mềm Polyak Target Networks
    for (let i = 0; i < this.targetQ1Weights.length; i++) {
      this.targetQ1Weights[i] = (1 - this.tau) * this.targetQ1Weights[i] + this.tau * this.q1Weights[i];
      this.targetQ2Weights[i] = (1 - this.tau) * this.targetQ2Weights[i] + this.tau * this.q2Weights[i];
    }

    return {
      trained: true,
      criticLoss: Number((totalCriticLoss / size).toFixed(4)),
      currentAlpha: Number(this.alpha.toFixed(4)),
      avgEntropy: Number((-avgLogProb).toFixed(4))
    };
  }

  /**
   * Tối ưu hóa giá thầu từ khóa Shopee Ads theo trạng thái phiên đấu giá
   */
  optimizeBid(campaignContext) {
    const {
      baseBidVND = 2000,
      currentCtr = 0.045,
      currentRoas = 3.8,
      targetRoas = 3.5,
      budgetRemainingRatio = 0.65
    } = campaignContext;

    const roasRatio = targetRoas > 0 ? currentRoas / targetRoas : 1.0;
    const state = [
      Math.min(1.0, currentCtr * 10), // chuẩn hóa CTR
      Math.min(2.0, roasRatio),       // tỷ số ROAS đạt được
      Math.min(1.0, budgetRemainingRatio),
      this.alpha                      // đưa cả mức nhiệt độ entropy vào state
    ];

    const { action } = this.sampleAction(state, true);
    // Action biến thiên từ -0.5 đến +0.5 (tối đa +/- 50% giá thầu cơ sở)
    const adjustmentPct = action * 0.5;
    const recommendedBid = Math.max(500, Math.round(baseBidVND * (1 + adjustmentPct)));

    return {
      baseBidVND,
      recommendedBidVND: recommendedBid,
      adjustmentPercent: Number((adjustmentPct * 100).toFixed(1)),
      entropyAlpha: Number(this.alpha.toFixed(4)),
      strategy: roasRatio >= 1.2
        ? 'EXPAND_EXPLORATION_BID'
        : roasRatio <= 0.8
        ? 'CONSERVATIVE_REDUCTION_BID'
        : 'BALANCED_STABLE_BID'
    };
  }
}

export { SACAutoBiddingEngine };
export default SACAutoBiddingEngine;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SACAutoBiddingEngine };
  }
} catch (e) {}
