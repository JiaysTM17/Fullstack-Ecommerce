/**
 * Proximal Policy Optimization (PPO) with Generalized Advantage Estimation (GAE)
 * Thuật toán Học Tăng Cường Tối Ưu Chính Sách Gần (Schulman et al., 2017)
 * Tối ưu hóa tỷ lệ giảm giá combo mua kèm (Bundle Discount & Cross-Selling)
 * Khắc phục hiện tượng chính sách nhảy vọt (Policy Collapse) bằng Clipped Surrogate Objective
 */

class PpoBundleOptimizer {
  constructor(options = {}) {
    this.stateDim = options.stateDim || 4; // [cartTotalRatio, avgMarginRatio, candidatePriceRatio, userEngagement]
    this.actionDim = options.actionDim || 6; // Các mức chiết khấu: 0%, 5%, 10%, 15%, 20%, 25%
    this.discountTiers = options.discountTiers || [0, 5, 10, 15, 20, 25];

    this.clipEps = options.clipEps || 0.2;
    this.gamma = options.gamma || 0.99;
    this.gaeLambda = options.gaeLambda || 0.95;
    this.actorLr = options.actorLr || 0.01;
    this.criticLr = options.criticLr || 0.02;

    // Trọng số Actor Policy W_a (actionDim x stateDim)
    this.actorWeights = Array.from({ length: this.actionDim }, () =>
      new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1)
    );

    // Trọng số Value Function Critic W_c (stateDim)
    this.criticWeights = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.criticBias = 0.0;

    this.trajectoryBuffer = [];
  }

  /**
   * Tính hàm giá trị trạng thái V(s) của Critic
   */
  evaluateValue(state) {
    let val = this.criticBias;
    for (let i = 0; i < this.stateDim; i++) {
      val += (state[i] || 0) * this.criticWeights[i];
    }
    return val;
  }

  /**
   * Tính phân phối xác suất hành động qua hàm Softmax
   */
  getPolicyDistribution(state) {
    const logits = new Array(this.actionDim).fill(0);
    let maxLogit = -Infinity;

    for (let a = 0; a < this.actionDim; a++) {
      let sum = 0;
      for (let s = 0; s < this.stateDim; s++) {
        sum += (state[s] || 0) * this.actorWeights[a][s];
      }
      logits[a] = sum;
      if (sum > maxLogit) maxLogit = sum;
    }

    // Softmax ổn định số học (Numerically stable softmax)
    let sumExp = 0;
    const probs = new Array(this.actionDim);
    for (let a = 0; a < this.actionDim; a++) {
      probs[a] = Math.exp(logits[a] - maxLogit);
      sumExp += probs[a];
    }
    for (let a = 0; a < this.actionDim; a++) {
      probs[a] = probs[a] / (sumExp || 1.0);
    }

    return probs;
  }

  /**
   * Lấy mẫu hành động từ phân phối chính sách
   */
  selectAction(state) {
    const probs = this.getPolicyDistribution(state);
    const rand = Math.random();
    let cumulative = 0;
    let chosenAction = this.actionDim - 1;

    for (let a = 0; a < this.actionDim; a++) {
      cumulative += probs[a];
      if (rand <= cumulative) {
        chosenAction = a;
        break;
      }
    }

    const valueEstimate = this.evaluateValue(state);

    return {
      action: chosenAction,
      discountPercent: this.discountTiers[chosenAction],
      prob: probs[chosenAction],
      value: valueEstimate,
      probs
    };
  }

  /**
   * Lưu chuyển trạng thái (s, a, r, v, prob, done) vào bộ nhớ kinh nghiệm
   */
  recordStep(state, action, reward, value, prob, done = false) {
    this.trajectoryBuffer.push({
      state: [...state],
      action,
      reward: Number(reward) || 0,
      value: Number(value) || 0,
      prob: Number(prob) || 0.1,
      done: Boolean(done)
    });
  }

  /**
   * Tính Generalized Advantage Estimation (GAE)
   * A_t = sum_{l=0} (gamma * lambda)^l * delta_{t+l}
   */
  computeGae(nextValue = 0) {
    const T = this.trajectoryBuffer.length;
    const advantages = new Array(T).fill(0);
    const returns = new Array(T).fill(0);
    let gae = 0;

    for (let t = T - 1; t >= 0; t--) {
      const step = this.trajectoryBuffer[t];
      const nextVal = (t === T - 1) ? nextValue : this.trajectoryBuffer[t + 1].value;
      const nonTerminal = step.done ? 0 : 1;
      const delta = step.reward + this.gamma * nextVal * nonTerminal - step.value;

      gae = delta + this.gamma * this.gaeLambda * nonTerminal * gae;
      advantages[t] = gae;
      returns[t] = advantages[t] + step.value;
    }

    // Chuẩn hóa Advantage (Zero mean, unit variance)
    const meanAdv = advantages.reduce((a, b) => a + b, 0) / (T || 1);
    const varianceAdv = advantages.reduce((sum, a) => sum + Math.pow(a - meanAdv, 2), 0) / (T || 1);
    const stdAdv = Math.sqrt(varianceAdv) + 1e-6;

    for (let t = 0; t < T; t++) {
      advantages[t] = (advantages[t] - meanAdv) / stdAdv;
    }

    return { advantages, returns };
  }

  /**
   * Cập nhật trọng số Actor và Critic bằng Clipped Surrogate Objective
   */
  trainEpoch(epochs = 3) {
    if (this.trajectoryBuffer.length === 0) {
      return { trained: false, loss: 0 };
    }

    const { advantages, returns } = this.computeGae();
    let totalPolicyLoss = 0;
    let totalValueLoss = 0;

    for (let ep = 0; ep < epochs; ep++) {
      for (let t = 0; t < this.trajectoryBuffer.length; t++) {
        const step = this.trajectoryBuffer[t];
        const currentProbs = this.getPolicyDistribution(step.state);
        const currentProb = currentProbs[step.action];
        const oldProb = step.prob || 1e-6;

        // Ratio r_t(theta) = pi_theta(a|s) / pi_theta_old(a|s)
        const ratio = currentProb / oldProb;
        const adv = advantages[t];

        // Clipped surrogate objective
        const surr1 = ratio * adv;
        const clippedRatio = Math.max(1 - this.clipEps, Math.min(1 + this.clipEps, ratio));
        const surr2 = clippedRatio * adv;
        const policyLoss = -Math.min(surr1, surr2);
        totalPolicyLoss += policyLoss;

        // Gradient update cho Actor
        const actorGradFactor = (ratio <= 1 + this.clipEps && ratio >= 1 - this.clipEps) ? adv : 0;
        for (let s = 0; s < this.stateDim; s++) {
          this.actorWeights[step.action][s] += this.actorLr * actorGradFactor * (step.state[s] || 0);
        }

        // Value loss: MSE(V(s), returns)
        const predVal = this.evaluateValue(step.state);
        const valError = returns[t] - predVal;
        totalValueLoss += valError * valError;

        // Gradient update cho Critic
        for (let s = 0; s < this.stateDim; s++) {
          this.criticWeights[s] += this.criticLr * valError * (step.state[s] || 0);
        }
        this.criticBias += this.criticLr * valError;
      }
    }

    const samples = this.trajectoryBuffer.length * epochs;
    this.trajectoryBuffer = []; // Xóa buffer sau khi update

    return {
      trained: true,
      avgPolicyLoss: Number((totalPolicyLoss / samples).toFixed(4)),
      avgValueLoss: Number((totalValueLoss / samples).toFixed(4))
    };
  }

  /**
   * Đề xuất mức chiết khấu combo mua kèm tối ưu
   */
  recommendBundleDiscount(cartContext) {
    const {
      cartTotal = 250000,
      marginPercent = 35,
      candidatePrice = 80000,
      userPurchasesCount = 3
    } = cartContext;

    // Chuẩn hóa state
    const state = [
      Math.min(2.0, cartTotal / 500000),
      Math.min(1.0, marginPercent / 100),
      Math.min(1.0, candidatePrice / 200000),
      Math.min(1.0, userPurchasesCount / 10)
    ];

    const decision = this.selectAction(state);

    // Tính toán lợi nhuận biên kỳ vọng
    const candidateDiscountPrice = Math.round(candidatePrice * (1 - decision.discountPercent / 100));
    const profitBeforeDiscount = candidatePrice * (marginPercent / 100);
    const profitAfterDiscount = candidateDiscountPrice - (candidatePrice * (1 - marginPercent / 100));

    return {
      suggestedDiscountPercent: decision.discountPercent,
      originalPrice: candidatePrice,
      bundlePrice: candidateDiscountPrice,
      expectedProfit: Math.max(0, Math.round(profitAfterDiscount)),
      confidenceScore: Math.round(decision.prob * 100) / 100,
      stateFeatures: state
    };
  }
}

export { PpoBundleOptimizer };
export default PpoBundleOptimizer;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PpoBundleOptimizer };
  }
} catch (e) {}
