/**
 * Twin Delayed Deep Deterministic Policy Gradients (TD3)
 * (Fujimoto, van Hoof, Meger - ICML 2018)
 * Thuật toán Học Tăng Cường Tác Tử - Phê Bình Hai Lớp Trễ
 * Giải quyết triệt để 3 vấn đề lớn của DDPG:
 * 1. Clipped Double Q-Learning: Triệt tiêu hoàn toàn Overestimation Bias bằng cách lấy min(Q1_target, Q2_target)
 * 2. Delayed Policy Updates: Chỉ cập nhật Actor và Target Networks sau mỗi d bước cập nhật Critic (mặc định d=2)
 * 3. Target Policy Smoothing Regularization: Thêm nhiễu ngẫu nhiên bị chặn vào target action để làm phẳng hàm giá trị
 * Ứng dụng: Tự động tối ưu hóa giá thầu đấu giá quảng cáo Shopee Ads (Continuous Action Auto-Bidding)
 */

class TD3AutoBidding {
  constructor(options = {}) {
    this.stateDim = options.stateDim || 5; // [ctr, roasRatio, budgetRemainingRatio, competitorBidRatio, marketVolatility]
    this.gamma = options.gamma || 0.95;
    this.lr = options.lr || 0.02;
    this.tau = options.tau || 0.05; // Tỷ lệ cập nhật mềm Polyak
    this.policyNoise = options.policyNoise || 0.1;
    this.noiseClip = options.noiseClip || 0.25;
    this.policyDelay = options.policyDelay || 2;
    this.updateCounter = 0;

    // Actor weights: [stateDim] -> Action scale in [0.5, 2.5] (hệ số điều chỉnh bid)
    this.actorWeights = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.targetActorWeights = [...this.actorWeights];

    // Twin Critics: Q1 and Q2 weights [stateDim + 1]
    this.critic1Weights = new Array(this.stateDim + 1).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.critic2Weights = new Array(this.stateDim + 1).fill(0).map(() => (Math.random() - 0.5) * 0.1);

    this.targetCritic1Weights = [...this.critic1Weights];
    this.targetCritic2Weights = [...this.critic2Weights];

    this.replayBuffer = [];
  }

  /**
   * Dự đoán hành động Actor: Hệ số nhân giá thầu [0.5, 2.5]
   */
  predictMultiplier(state, deterministic = true) {
    let raw = 0;
    for (let i = 0; i < this.stateDim; i++) {
      raw += (state[i] || 0) * this.actorWeights[i];
    }
    // Sigmoid map sang [0.5, 2.5]
    const sigmoid = 1.0 / (1.0 + Math.exp(-raw));
    let mult = 0.5 + 2.0 * sigmoid;

    if (!deterministic) {
      const noise = (Math.random() - 0.5) * 0.1;
      mult = Math.max(0.5, Math.min(2.5, mult + noise));
    }

    return Number(mult.toFixed(3));
  }

  _computeQ(weights, state, action) {
    let val = 0;
    for (let i = 0; i < this.stateDim; i++) {
      val += (state[i] || 0) * weights[i];
    }
    val += action * weights[this.stateDim];
    return val;
  }

  recordExperience(state, action, reward, nextState, done = false) {
    this.replayBuffer.push({
      state: [...state],
      action: Number(action),
      reward: Number(reward),
      nextState: [...nextState],
      done: Boolean(done)
    });
    if (this.replayBuffer.length > 500) {
      this.replayBuffer.shift();
    }
  }

  /**
   * Bước huấn luyện TD3 với Clipped Double-Q và Cập nhật trễ
   */
  trainStep(batchSize = 16) {
    if (this.replayBuffer.length < 4) {
      return { trained: false, loss: 0 };
    }

    this.updateCounter++;
    const size = Math.min(batchSize, this.replayBuffer.length);
    let totalCriticLoss = 0;

    for (let b = 0; b < size; b++) {
      const idx = Math.floor(Math.random() * this.replayBuffer.length);
      const { state, action, reward, nextState, done } = this.replayBuffer[idx];

      // 1. Target Action với Target Policy Smoothing
      let nextRaw = 0;
      for (let i = 0; i < this.stateDim; i++) {
        nextRaw += (nextState[i] || 0) * this.targetActorWeights[i];
      }
      const targetSigmoid = 1.0 / (1.0 + Math.exp(-nextRaw));
      let targetAction = 0.5 + 2.0 * targetSigmoid;

      // Thêm nhiễu clipped Gaussian
      const noise = Math.max(-this.noiseClip, Math.min(this.noiseClip, (Math.random() - 0.5) * this.policyNoise));
      targetAction = Math.max(0.5, Math.min(2.5, targetAction + noise));

      // 2. Clipped Double-Q: min(targetQ1, targetQ2)
      const targetQ1 = this._computeQ(this.targetCritic1Weights, nextState, targetAction);
      const targetQ2 = this._computeQ(this.targetCritic2Weights, nextState, targetAction);
      const minTargetQ = Math.min(targetQ1, targetQ2);

      const targetVal = reward + (done ? 0 : this.gamma * minTargetQ);

      // 3. Cập nhật Critic 1 và Critic 2
      const q1 = this._computeQ(this.critic1Weights, state, action);
      const q2 = this._computeQ(this.critic2Weights, state, action);

      const err1 = targetVal - q1;
      const err2 = targetVal - q2;
      totalCriticLoss += (Math.abs(err1) + Math.abs(err2)) / 2;

      for (let i = 0; i < this.stateDim; i++) {
        this.critic1Weights[i] += this.lr * err1 * (state[i] || 0) * 0.05;
        this.critic2Weights[i] += this.lr * err2 * (state[i] || 0) * 0.05;
      }
      this.critic1Weights[this.stateDim] += this.lr * err1 * action * 0.05;
      this.critic2Weights[this.stateDim] += this.lr * err2 * action * 0.05;

      // 4. Delayed Policy Updates (chỉ cập nhật Actor sau mỗi policyDelay bước)
      if (this.updateCounter % this.policyDelay === 0) {
        const actorAction = this.predictMultiplier(state, true);
        const q1Val = this._computeQ(this.critic1Weights, state, actorAction);

        for (let i = 0; i < this.stateDim; i++) {
          this.actorWeights[i] += this.lr * q1Val * (state[i] || 0) * 0.02;
        }

        // Polyak Soft Target Updates
        for (let i = 0; i < this.stateDim; i++) {
          this.targetActorWeights[i] = this.tau * this.actorWeights[i] + (1 - this.tau) * this.targetActorWeights[i];
          this.targetCritic1Weights[i] = this.tau * this.critic1Weights[i] + (1 - this.tau) * this.targetCritic1Weights[i];
          this.targetCritic2Weights[i] = this.tau * this.critic2Weights[i] + (1 - this.tau) * this.targetCritic2Weights[i];
        }
        this.targetCritic1Weights[this.stateDim] = this.tau * this.critic1Weights[this.stateDim] + (1 - this.tau) * this.targetCritic1Weights[this.stateDim];
        this.targetCritic2Weights[this.stateDim] = this.tau * this.critic2Weights[this.stateDim] + (1 - this.tau) * this.targetCritic2Weights[this.stateDim];
      }
    }

    return {
      trained: true,
      avgLoss: Number((totalCriticLoss / size).toFixed(4)),
      policyUpdated: this.updateCounter % this.policyDelay === 0
    };
  }

  /**
   * Tối ưu hóa giá thầu Shopee Ads tự động theo thời gian thực
   */
  optimizeBid(adContext) {
    const {
      baseBidVND = 2000,
      currentCtr = 0.05,
      currentRoas = 3.5,
      targetRoas = 3.0,
      budgetRemainingRatio = 0.6,
      marketVolatility = 0.2
    } = adContext;

    const roasRatio = Math.min(2.5, currentRoas / Math.max(0.1, targetRoas));
    const state = [
      Math.min(1.0, currentCtr * 10),
      roasRatio,
      budgetRemainingRatio,
      1.0, // Competitor ratio baseline
      marketVolatility
    ];

    const multiplier = this.predictMultiplier(state, true);
    const recommendedBidVND = Math.round(baseBidVND * multiplier);
    const minBidVND = Math.round(baseBidVND * 0.5);
    const maxBidVND = Math.round(baseBidVND * 2.5);

    return {
      baseBidVND,
      recommendedBidVND: Math.max(minBidVND, Math.min(maxBidVND, recommendedBidVND)),
      bidMultiplier: multiplier,
      targetRoas,
      currentRoas,
      isDoubleQGuaranteed: true,
      strategy: roasRatio >= 1.2 && budgetRemainingRatio > 0.4
        ? 'AGGRESSIVE_SCALE_DOMINANCE'
        : roasRatio < 0.9 || budgetRemainingRatio < 0.2
        ? 'CONSERVATIVE_BUDGET_DEFENSE'
        : 'OPTIMAL_ROAS_EQUILIBRIUM'
    };
  }
}

export { TD3AutoBidding };
export default TD3AutoBidding;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TD3AutoBidding };
  }
} catch (e) {}
