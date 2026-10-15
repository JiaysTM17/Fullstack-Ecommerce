/**
 * Multi-Agent Deep Deterministic Policy Gradient (MADDPG) for Multi-Shop Coordinated Pricing
 * (Lowe et al., NeurIPS 2017)
 * Kiến trúc Huấn luyện Tập trung & Thực thi Phi tập trung (CTDE)
 * Điều phối giá bán và chiến dịch Flash Sale giữa các gian hàng đối tác/cạnh tranh
 */

class MultiAgentReplayBuffer {
  constructor(capacity = 1000) {
    this.capacity = capacity;
    this.buffer = [];
    this.position = 0;
  }

  push(allObs, allActions, allRewards, nextAllObs, done) {
    if (this.buffer.length < this.capacity) {
      this.buffer.push({ allObs, allActions, allRewards, nextAllObs, done });
    } else {
      this.buffer[this.position] = { allObs, allActions, allRewards, nextAllObs, done };
    }
    this.position = (this.position + 1) % this.capacity;
  }

  sample(batchSize) {
    const size = Math.min(batchSize, this.buffer.length);
    const samples = [];
    const indices = new Set();
    while (samples.length < size) {
      const idx = Math.floor(Math.random() * this.buffer.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        samples.push(this.buffer[idx]);
      }
    }
    return samples;
  }

  size() {
    return this.buffer.length;
  }
}

class MaddpgPricingCoordinator {
  constructor(options = {}) {
    const {
      numAgents = 3,       // Số gian hàng trong cụm ngành hàng (ví dụ: 3 shop)
      obsDim = 4,          // [priceRatio, stockRatio, velocityRate, marginTarget]
      learningRate = 0.01,
      gamma = 0.95,
      noiseStd = 0.1,
      replayCapacity = 1000
    } = options;

    this.numAgents = numAgents;
    this.obsDim = obsDim;
    this.totalObsDim = numAgents * obsDim;
    this.actionDim = 1; // Mỗi shop điều chỉnh 1 giá trị chiết khấu [-1.0 .. +1.0]
    this.learningRate = learningRate;
    this.gamma = gamma;
    this.noiseStd = noiseStd;

    // 1. Decentralized Actors: mỗi agent i có ma trận trọng số actorWeights[i] (obsDim)
    this.actorWeights = [];
    this.actorBiases = [];
    for (let i = 0; i < numAgents; i++) {
      const w = [];
      for (let d = 0; d < obsDim; d++) {
        w.push((Math.random() - 0.5) * 0.2);
      }
      this.actorWeights.push(w);
      this.actorBiases.push(0.0);
    }

    // 2. Centralized Critics: mỗi agent i có Critic Q_i(allObs, allActions)
    // Trọng số critic: totalObsDim + numAgents
    this.criticObsWeights = [];
    this.criticActWeights = [];
    this.criticBiases = [];
    for (let i = 0; i < numAgents; i++) {
      const wo = new Array(this.totalObsDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const wa = new Array(numAgents).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      this.criticObsWeights.push(wo);
      this.criticActWeights.push(wa);
      this.criticBiases.push(0.0);
    }

    this.replayBuffer = new MultiAgentReplayBuffer(replayCapacity);
  }

  /**
   * Decentralized Actor Policy: shop i chỉ quan sát o_i và sinh hành động a_i trong [-1, 1]
   */
  getAgentAction(agentIdx, obs_i, explore = false) {
    let raw = this.actorBiases[agentIdx];
    const w = this.actorWeights[agentIdx];
    for (let d = 0; d < this.obsDim; d++) {
      raw += w[d] * (obs_i[d] || 0);
    }

    // Tanh activation -> [-1, 1]
    let action = Math.tanh(raw);

    if (explore) {
      const noise = (Math.random() - 0.5) * 2 * this.noiseStd;
      action = Math.max(-1, Math.min(1, action + noise));
    }

    return Math.round(action * 1000) / 1000;
  }

  /**
   * Thu thập hành động phân tán của toàn bộ các shop
   */
  getAllActions(allObs, explore = false) {
    const actions = [];
    for (let i = 0; i < this.numAgents; i++) {
      actions.push(this.getAgentAction(i, allObs[i], explore));
    }
    return actions;
  }

  /**
   * Centralized Critic: đánh giá Q_i(allObs, allActions)
   */
  evaluateJointQ(agentIdx, allObsFlat, allActions) {
    let q = this.criticBiases[agentIdx];
    const wo = this.criticObsWeights[agentIdx];
    for (let d = 0; d < this.totalObsDim; d++) {
      q += wo[d] * (allObsFlat[d] || 0);
    }
    const wa = this.criticActWeights[agentIdx];
    for (let i = 0; i < this.numAgents; i++) {
      q += wa[i] * (allActions[i] || 0);
    }
    return q;
  }

  /**
   * Lưu trữ chuyển dịch đa tác tử
   */
  storeTransition(allObs, allActions, allRewards, nextAllObs, done = false) {
    this.replayBuffer.push(allObs, allActions, allRewards, nextAllObs, done);
  }

  /**
   * Huấn luyện tập trung Centralized Training
   */
  trainMiniBatch(batchSize = 32) {
    if (this.replayBuffer.size() < 10) {
      return { trained: false, loss: 0 };
    }

    const batch = this.replayBuffer.sample(batchSize);
    let totalLoss = 0;

    for (const sample of batch) {
      const { allObs, allActions, allRewards, nextAllObs, done } = sample;
      const flatObs = allObs.flat();
      const flatNextObs = nextAllObs ? nextAllObs.flat() : null;

      // Cập nhật từng Critic & Actor
      for (let i = 0; i < this.numAgents; i++) {
        const currentQ = this.evaluateJointQ(i, flatObs, allActions);
        let targetQ = allRewards[i] || 0;

        if (!done && flatNextObs) {
          const nextActions = [];
          for (let j = 0; j < this.numAgents; j++) {
            nextActions.push(this.getAgentAction(j, nextAllObs[j], false));
          }
          const nextQ = this.evaluateJointQ(i, flatNextObs, nextActions);
          targetQ += this.gamma * nextQ;
        }

        const tdError = targetQ - currentQ;
        totalLoss += tdError * tdError;

        // Gradient descent cho Critic i
        this.criticBiases[i] += this.learningRate * tdError * 0.5;
        for (let d = 0; d < this.totalObsDim; d++) {
          this.criticObsWeights[i][d] += this.learningRate * tdError * 0.1 * flatObs[d];
        }
        for (let j = 0; j < this.numAgents; j++) {
          this.criticActWeights[i][j] += this.learningRate * tdError * 0.1 * allActions[j];
        }

        // Gradient ascent cho Actor i theo Q value
        const policyGrad = this.criticActWeights[i][i] * (1 - Math.pow(allActions[i], 2)); // dQ/da * dtanh
        for (let d = 0; d < this.obsDim; d++) {
          this.actorWeights[i][d] += this.learningRate * policyGrad * (allObs[i][d] || 0);
        }
        this.actorBiases[i] += this.learningRate * policyGrad;
      }
    }

    return {
      trained: true,
      batchSize: batch.length,
      avgLoss: Math.round((totalLoss / (batch.length * this.numAgents)) * 1000) / 1000
    };
  }

  /**
   * Đề xuất giá bán phối hợp giữa các shop tránh phá giá thị trường
   */
  coordinatePricingRecommendations(shopsData) {
    const allObs = shopsData.map(s => [
      s.currentPriceRatio || 1.0,
      s.stockRemainingRatio || 0.5,
      s.velocityRate || 0.5,
      s.targetMarginRatio || 0.3
    ]);

    const actions = this.getAllActions(allObs, false);

    return shopsData.map((s, idx) => {
      const act = actions[idx];
      // Map action [-1, 1] sang mức chiết khấu Flash Sale: 0% .. 30%
      const discountPercent = Math.max(0, Math.min(30, Math.round((act + 1.0) * 15)));
      const suggestedPrice = Math.round((s.basePrice || 100000) * (1 - discountPercent / 100));

      return {
        shopId: s.shopId,
        basePrice: s.basePrice || 100000,
        suggestedPrice,
        discountPercent,
        actionScore: act,
        coordinationNote: act > 0.3
          ? 'Nhu cầu cao & ít xung đột: Cho phép kích hoạt Flash Sale sâu'
          : act < -0.3
          ? 'Cạnh tranh gay gắt: Khuyến nghị giữ giá ổn định để bảo vệ biên lãi gộp'
          : 'Thị trường cân bằng: Áp dụng chiết khấu vừa phải'
      };
    });
  }
}

export { MultiAgentReplayBuffer, MaddpgPricingCoordinator };
export default MaddpgPricingCoordinator;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MultiAgentReplayBuffer, MaddpgPricingCoordinator };
  }
} catch (e) {}
