/**
 * Dueling Deep Q-Network (Dueling DQN) Keyword Bidding Optimizer (Wang et al., ICML 2016)
 * Kiến trúc Dueling phân rã Q(s, a) = V(s) + (A(s, a) - mean(A))
 * Tối ưu hóa giá thầu từ khóa Shopee Ads tự động (Search & Discovery Ads)
 */

class ReplayBuffer {
  constructor(capacity = 1000) {
    this.capacity = capacity;
    this.buffer = [];
    this.position = 0;
  }

  push(state, action, reward, nextState, done) {
    if (this.buffer.length < this.capacity) {
      this.buffer.push({ state, action, reward, nextState, done });
    } else {
      this.buffer[this.position] = { state, action, reward, nextState, done };
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

class DuelingDqnBidding {
  constructor(options = {}) {
    const {
      stateDim = 6, // [CTR, CVR, avgPosition, competitorDensity, remainingBudgetRatio, timeOfDayFactor]
      actionMultipliers = [0.8, 0.9, 1.0, 1.1, 1.2], // 5 hành động điều chỉnh bid
      learningRate = 0.01,
      gamma = 0.95,
      epsilon = 0.2,
      epsilonDecay = 0.995,
      epsilonMin = 0.02,
      hiddenDim = 16,
      replayCapacity = 1000
    } = options;

    this.stateDim = stateDim;
    this.actionMultipliers = actionMultipliers;
    this.actionDim = actionMultipliers.length;
    this.learningRate = learningRate;
    this.gamma = gamma;
    this.epsilon = epsilon;
    this.epsilonDecay = epsilonDecay;
    this.epsilonMin = epsilonMin;
    this.hiddenDim = hiddenDim;

    this.actionNames = [
      'GIẢM_20% (Bảo toàn ngân sách)',
      'GIẢM_10% (Tối ưu ROAS)',
      'GIỮ_NGUYÊN_GIÁ_THẦU',
      'TĂNG_10% (Tăng hiển thị)',
      'TĂNG_20% (Chiếm top 1 tìm kiếm)'
    ];

    // Khởi tạo trọng số mạng Policy Network:
    // 1. Trọng số Hidden Layer: W_h (hiddenDim x stateDim), b_h (hiddenDim)
    this.Wh = this._initMatrix(hiddenDim, stateDim);
    this.bh = new Array(hiddenDim).fill(0.01);

    // 2. Value Stream: W_v (1 x hiddenDim), b_v (scalar)
    this.Wv = new Array(hiddenDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bv = 0.0;

    // 3. Advantage Stream: W_a (actionDim x hiddenDim), b_a (actionDim)
    this.Wa = this._initMatrix(this.actionDim, hiddenDim);
    this.ba = new Array(this.actionDim).fill(0.0);

    // Replay Buffer
    this.replayBuffer = new ReplayBuffer(replayCapacity);
  }

  _initMatrix(rows, cols) {
    const m = [];
    for (let r = 0; r < rows; r++) {
      const row = [];
      for (let c = 0; c < cols; c++) {
        row.push((Math.random() - 0.5) * (2 / Math.sqrt(cols)));
      }
      m.push(row);
    }
    return m;
  }

  /**
   * Tính toán forward pass qua mạng Dueling DQN
   * Q(s, a) = V(s) + (A(s, a) - 1/|A| * sum(A(s, a')))
   */
  forward(state) {
    // 1. Hidden Layer ReLU: h = max(0, Wh * s + bh)
    const h = new Array(this.hiddenDim).fill(0);
    for (let i = 0; i < this.hiddenDim; i++) {
      let sum = this.bh[i];
      for (let j = 0; j < this.stateDim; j++) {
        sum += this.Wh[i][j] * (state[j] || 0);
      }
      h[i] = Math.max(0, sum); // ReLU
    }

    // 2. Value Stream: V(s) = Wv * h + bv
    let V = this.bv;
    for (let i = 0; i < this.hiddenDim; i++) {
      V += this.Wv[i] * h[i];
    }

    // 3. Advantage Stream: A(s, :) = Wa * h + ba
    const A = new Array(this.actionDim).fill(0);
    let sumA = 0;
    for (let a = 0; a < this.actionDim; a++) {
      let sum = this.ba[a];
      for (let i = 0; i < this.hiddenDim; i++) {
        sum += this.Wa[a][i] * h[i];
      }
      A[a] = sum;
      sumA += sum;
    }

    const meanA = sumA / this.actionDim;

    // 4. Hợp nhất Dueling Architecture
    const Q = new Array(this.actionDim);
    for (let a = 0; a < this.actionDim; a++) {
      Q[a] = V + (A[a] - meanA);
    }

    return { Q, V, A, h };
  }

  /**
   * Chọn hành động theo chính sách Epsilon-Greedy
   */
  selectAction(state, explore = true) {
    if (explore && Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.actionDim);
    }
    const { Q } = this.forward(state);
    let bestAction = 0;
    let maxQ = Q[0];
    for (let a = 1; a < this.actionDim; a++) {
      if (Q[a] > maxQ) {
        maxQ = Q[a];
        bestAction = a;
      }
    }
    return bestAction;
  }

  /**
   * Ghi nhận bước chuyển dịch (s, a, r, s', done) vào Replay Buffer
   */
  storeTransition(state, action, reward, nextState, done = false) {
    this.replayBuffer.push(state, action, reward, nextState, done);
  }

  /**
   * Huấn luyện mạng Dueling DQN với một mini-batch từ Replay Buffer
   */
  trainMiniBatch(batchSize = 32) {
    if (this.replayBuffer.size() < 10) {
      return { trained: false, loss: 0 };
    }

    const batch = this.replayBuffer.sample(batchSize);
    let totalLoss = 0;

    for (const item of batch) {
      const { state, action, reward, nextState, done } = item;

      const { Q: currentQ, h } = this.forward(state);
      const currentVal = currentQ[action];

      let targetVal = reward;
      if (!done && nextState) {
        const { Q: nextQ } = this.forward(nextState);
        const maxNextQ = Math.max(...nextQ);
        targetVal = reward + this.gamma * maxNextQ;
      }

      const tdError = targetVal - currentVal;
      totalLoss += tdError * tdError;

      // Lan truyền ngược xấp xỉ đạo hàm gradient descent
      // Gradient đối với V(s) và A(s, a)
      this.bv += this.learningRate * tdError * 0.5;
      this.ba[action] += this.learningRate * tdError * 0.5;

      for (let i = 0; i < this.hiddenDim; i++) {
        this.Wv[i] += this.learningRate * tdError * 0.2 * h[i];
        this.Wa[action][i] += this.learningRate * tdError * 0.3 * h[i];
      }
    }

    // Suy giảm Epsilon
    this.epsilon = Math.max(this.epsilonMin, this.epsilon * this.epsilonDecay);

    return {
      trained: true,
      batchSize: batch.length,
      avgLoss: Math.round((totalLoss / batch.length) * 1000) / 1000,
      currentEpsilon: Math.round(this.epsilon * 1000) / 1000
    };
  }

  /**
   * Khuyến nghị tối ưu hóa giá thầu từ khóa thời gian thực
   */
  recommendBidOptimization(keyword, currentBid, stateFeatures, options = {}) {
    const { minBid = 500, maxBid = 50000 } = options;

    const { Q, V, A } = this.forward(stateFeatures);
    const actionIdx = this.selectAction(stateFeatures, false);
    const multiplier = this.actionMultipliers[actionIdx];

    const rawNewBid = Math.round(currentBid * multiplier);
    const optimizedBid = Math.max(minBid, Math.min(maxBid, rawNewBid));

    return {
      keyword,
      currentBid,
      optimizedBid,
      adjustmentPercent: Math.round((multiplier - 1.0) * 100),
      actionName: this.actionNames[actionIdx],
      stateValueEstimate: Math.round(V * 100) / 100,
      actionAdvantage: Math.round(A[actionIdx] * 100) / 100,
      qValues: Q.map(q => Math.round(q * 100) / 100),
      explanation: `Dueling DQN phân tích giá trị ngữ cảnh V(s)=${V.toFixed(2)} và lợi thế hành động A(s,a)=${A[actionIdx].toFixed(2)}, đề xuất hành động: ${this.actionNames[actionIdx]}.`
    };
  }
}

export {
  ReplayBuffer,
  DuelingDqnBidding
};
export default DuelingDqnBidding;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
      ReplayBuffer,
      DuelingDqnBidding
    };
  }
} catch (e) {}
