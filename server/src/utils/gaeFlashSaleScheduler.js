/**
 * Actor-Critic with Generalized Advantage Estimation (GAE-lambda)
 * (Schulman et al., ICLR 2016)
 * Thuật toán Học Tăng Cường Ước Lượng Lợi Thế Tổng Quát cho Lập Lịch Khung Giờ Flash Sale
 * Cân bằng tối ưu giữa Độ chệch (Bias) và Phương sai (Variance)
 * Tự động chọn khung giờ mở bán và tỷ lệ chiết khấu theo độ co giãn của lưu lượng truy cập
 */

class GaeFlashSaleScheduler {
  constructor(options = {}) {
    this.numSlots = options.numSlots || 6; // Các slot tiêu chuẩn: 0h, 9h, 12h, 15h, 18h, 21h
    this.stateDim = options.stateDim || 5; // [trafficSurge, currentStock, historicConversion, hourOfDay, categoryMargin]
    this.actionDim = this.numSlots;

    this.gamma = options.gamma || 0.99; // Hệ số chiết khấu
    this.lambda = options.lambda || 0.95; // Hệ số GAE trọng số vết
    this.actorLr = options.actorLr || 0.02;
    this.criticLr = options.criticLr || 0.05;

    // Trọng số Actor Policy Softmax [actionDim x stateDim]
    this.actorWeights = Array.from({ length: this.actionDim }, () =>
      new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1)
    );

    // Trọng số Value Function Critic [stateDim]
    this.criticWeights = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.criticBias = 0.0;

    this.trajectories = []; // Buffer lưu trữ các bước chuyển trong episode
  }

  /**
   * Tính phân phối xác suất chọn Slot qua Softmax Policy
   */
  getPolicyDistribution(state) {
    const logits = [];
    let maxLogit = -Infinity;

    for (let a = 0; a < this.actionDim; a++) {
      let z = 0;
      for (let s = 0; s < this.stateDim; s++) {
        z += (state[s] || 0) * (this.actorWeights[a][s] || 0);
      }
      logits.push(z);
      if (z > maxLogit) maxLogit = z;
    }

    const expVals = logits.map(z => Math.exp(Math.max(-20, Math.min(20, z - maxLogit))));
    const sumExp = expVals.reduce((a, b) => a + b, 0) || 1;
    return expVals.map(v => v / sumExp);
  }

  /**
   * Đánh giá giá trị kỳ vọng V(s) của trạng thái
   */
  evaluateValue(state) {
    let val = this.criticBias;
    for (let s = 0; s < this.stateDim; s++) {
      val += (state[s] || 0) * (this.criticWeights[s] || 0);
    }
    return val;
  }

  /**
   * Lấy mẫu hành động chọn slot và mức chiết khấu
   */
  selectSlot(state, deterministic = false) {
    const probs = this.getPolicyDistribution(state);

    let chosenSlot = 0;
    if (deterministic) {
      let maxP = -1;
      for (let a = 0; a < probs.length; a++) {
        if (probs[a] > maxP) {
          maxP = probs[a];
          chosenSlot = a;
        }
      }
    } else {
      const rand = Math.random();
      let cum = 0;
      for (let a = 0; a < probs.length; a++) {
        cum += probs[a];
        if (rand <= cum) {
          chosenSlot = a;
          break;
        }
      }
    }

    const slotNames = ['00:00 - 02:00', '09:00 - 11:00', '12:00 - 14:00', '15:00 - 17:00', '18:00 - 20:00', '21:00 - 23:00'];
    return {
      slotIndex: chosenSlot,
      slotTime: slotNames[chosenSlot] || `Slot ${chosenSlot + 1}`,
      probability: Number(probs[chosenSlot].toFixed(4)),
      allProbabilities: probs.map(p => Number(p.toFixed(4)))
    };
  }

  /**
   * Lưu chuyển trạng thái trong chuỗi quỹ đạo (Trajectory)
   */
  recordStep(state, action, reward, nextState, done = false) {
    this.trajectories.push({
      state: [...state],
      action: Number(action),
      reward: Number(reward),
      nextState: [...nextState],
      done: Boolean(done)
    });
  }

  /**
   * Tính toán Generalized Advantage Estimation (GAE)
   * delta_t = r_t + gamma * V(s_{t+1}) - V(s_t)
   * A_t = sum_{l=0} (gamma * lambda)^l * delta_{t+l}
   */
  computeGae() {
    const T = this.trajectories.length;
    const advantages = new Array(T).fill(0);
    const returns = new Array(T).fill(0);
    let gae = 0;

    for (let t = T - 1; t >= 0; t--) {
      const step = this.trajectories[t];
      const nextVal = step.done ? 0 : this.evaluateValue(step.nextState);
      const currVal = this.evaluateValue(step.state);

      const delta = step.reward + this.gamma * nextVal - currVal;
      gae = delta + this.gamma * this.lambda * (step.done ? 0 : gae);
      advantages[t] = gae;
      returns[t] = advantages[t] + currVal;
    }

    return { advantages, returns };
  }

  /**
   * Cập nhật gradient cho Actor và Critic qua GAE
   */
  trainBatch() {
    if (this.trajectories.length === 0) {
      return { trained: false, actorLoss: 0, criticLoss: 0 };
    }

    const { advantages, returns } = this.computeGae();
    let totalActorLoss = 0;
    let totalCriticLoss = 0;

    for (let t = 0; t < this.trajectories.length; t++) {
      const step = this.trajectories[t];
      const probs = this.getPolicyDistribution(step.state);
      const adv = advantages[t];

      // Actor gradient: - log(pi(a|s)) * A_t
      totalActorLoss -= Math.log(Math.max(1e-6, probs[step.action])) * adv;

      for (let s = 0; s < this.stateDim; s++) {
        for (let a = 0; a < this.actionDim; a++) {
          const indicator = (a === step.action ? 1 : 0);
          const grad = (indicator - probs[a]) * adv * (step.state[s] || 0);
          this.actorWeights[a][s] += this.actorLr * grad * 0.1;
        }
      }

      // Critic gradient: MSE(V(s), returns)
      const currentV = this.evaluateValue(step.state);
      const vError = returns[t] - currentV;
      totalCriticLoss += vError * vError;

      for (let s = 0; s < this.stateDim; s++) {
        this.criticWeights[s] += this.criticLr * vError * (step.state[s] || 0);
      }
      this.criticBias += this.criticLr * vError;
    }

    const n = this.trajectories.length;
    this.trajectories = []; // Clear buffer

    return {
      trained: true,
      avgActorLoss: Number((totalActorLoss / n).toFixed(4)),
      avgCriticLoss: Number((totalCriticLoss / n).toFixed(4))
    };
  }

  /**
   * Khuyến nghị lịch mở Flash Sale tối ưu cho gian hàng
   */
  scheduleFlashSale(shopContext) {
    const {
      trafficSurge = 1.8,
      stock = 150,
      historicConversion = 0.08,
      hourOfDay = 11,
      categoryMargin = 0.40
    } = shopContext;

    const state = [
      Math.min(3.0, trafficSurge),
      Math.min(2.0, stock / 100),
      Math.min(1.0, historicConversion * 5),
      Math.min(1.0, hourOfDay / 24),
      Math.min(1.0, categoryMargin)
    ];

    const decision = this.selectSlot(state, true);
    // Tính mức chiết khấu an toàn dựa trên biên lợi nhuận
    const recommendedDiscount = Math.round(categoryMargin * 0.6 * 100);

    return {
      recommendedSlot: decision.slotTime,
      slotIndex: decision.slotIndex,
      confidence: decision.probability,
      recommendedDiscountPercent: recommendedDiscount,
      expectedConversionRate: Number((historicConversion * (1 + trafficSurge * 0.2)).toFixed(3)),
      strategy: trafficSurge > 1.5 ? 'MEGA_PEAK_SURGE' : 'STEADY_DEMAND'
    };
  }
}

export { GaeFlashSaleScheduler };
export default GaeFlashSaleScheduler;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GaeFlashSaleScheduler };
  }
} catch (e) {}
