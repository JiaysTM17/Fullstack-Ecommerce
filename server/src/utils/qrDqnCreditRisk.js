/**
 * Distributional Reinforcement Learning with Quantile Regression (QR-DQN)
 * (Dabney, Rowland, Bellemare, Munos, AAAI 2018)
 * Học Tăng Cường Phân Phối với Hồi Quy Lượng Phân Vị (Quantile Regression)
 * Ứng dụng: Quản trị rủi ro tín dụng Ví Trả Sau Mini SpayLater & Cấp hạn mức ví an toàn
 * Bảo toàn rủi ro đuôi (Tail-Risk Minimization / Conditional Value-at-Risk - CVaR)
 */

class QRDQNCreditRisk {
  constructor(options = {}) {
    this.numQuantiles = options.numQuantiles || 8; // N lượng phân vị
    this.stateDim = options.stateDim || 5; // [trustScore, orderSuccessRate, monthlySpendRatio, cancelRate, accountAge]
    this.actionDim = options.actionDim || 4; // Cấp hạn mức: [0, 5M, 15M, 30M VND]
    this.gamma = options.gamma || 0.95;
    this.kappa = options.kappa || 1.0; // Ngưỡng Huber loss
    this.lr = options.lr || 0.01;

    // Các vị trí lượng phân vị cố định: tau_i = (2i - 1) / (2N)
    this.tau = Array.from({ length: this.numQuantiles }, (_, i) => (2 * i + 1) / (2 * this.numQuantiles));

    // Trọng số mô hình lượng phân vị: [actionDim x numQuantiles x stateDim]
    this.weights = Array.from({ length: this.actionDim }, () =>
      Array.from({ length: this.numQuantiles }, () =>
        new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1)
      )
    );

    // Target weights
    this.targetWeights = JSON.parse(JSON.stringify(this.weights));
    this.buffer = [];
  }

  /**
   * Dự đoán vector N lượng phân vị theta(s, a)
   */
  predictQuantiles(state, action, useTarget = false) {
    const W = useTarget ? this.targetWeights[action] : this.weights[action];
    const quantiles = [];

    for (let i = 0; i < this.numQuantiles; i++) {
      let val = 0;
      for (let s = 0; s < this.stateDim; s++) {
        val += (state[s] || 0) * (W[i][s] || 0);
      }
      quantiles.push(val);
    }

    return quantiles.sort((a, b) => a - b);
  }

  /**
   * Tính kỳ vọng Q(s, a) = (1/N) * sum_i theta_i(s, a)
   */
  expectedQ(state, action, useTarget = false) {
    const quantiles = this.predictQuantiles(state, action, useTarget);
    const sum = quantiles.reduce((acc, q) => acc + q, 0);
    return sum / this.numQuantiles;
  }

  /**
   * Tính Giá Trị Rủi Ro Có Điều Kiện (Conditional Value at Risk - CVaR_alpha)
   * Lấy trung bình của 25% lượng phân vị thấp nhất để đo lường kịch bản xấu nhất (Tail Risk)
   */
  computeCVaR(state, action, alpha = 0.25) {
    const quantiles = this.predictQuantiles(state, action, false);
    const cutoffCount = Math.max(1, Math.floor(this.numQuantiles * alpha));
    const worstQuantiles = quantiles.slice(0, cutoffCount);
    const sum = worstQuantiles.reduce((a, b) => a + b, 0);
    return Number((sum / cutoffCount).toFixed(2));
  }

  selectAction(state, riskAverse = true) {
    let bestAction = 0;
    let bestMetric = -Infinity;

    for (let a = 0; a < this.actionDim; a++) {
      const metric = riskAverse
        ? this.computeCVaR(state, a, 0.25) // Đánh giá thận trọng theo đuôi rủi ro xấu nhất
        : this.expectedQ(state, a, false);

      if (metric > bestMetric) {
        bestMetric = metric;
        bestAction = a;
      }
    }

    const limits = [0, 5000000, 15000000, 30000000];
    return {
      actionIndex: bestAction,
      approvedLimitVND: limits[bestAction] || 0,
      cvarScore: Number(bestMetric.toFixed(2)),
      expectedReward: Number(this.expectedQ(state, bestAction, false).toFixed(2))
    };
  }

  recordExperience(state, action, reward, nextState, done = false) {
    this.buffer.push({
      state: [...state],
      action: Number(action),
      reward: Number(reward),
      nextState: [...nextState],
      done: Boolean(done)
    });
    if (this.buffer.length > 500) {
      this.buffer.shift();
    }
  }

  /**
   * Huber Quantile Regression Loss
   */
  _huberQuantileLoss(u, tau) {
    const absU = Math.abs(u);
    const huber = absU <= this.kappa ? 0.5 * u * u : this.kappa * (absU - 0.5 * this.kappa);
    const indicator = u < 0 ? 1 : 0;
    return Math.abs(tau - indicator) * huber / this.kappa;
  }

  trainStep(batchSize = 16) {
    if (this.buffer.length < 4) {
      return { trained: false, loss: 0 };
    }

    const size = Math.min(batchSize, this.buffer.length);
    let totalLoss = 0;

    for (let b = 0; b < size; b++) {
      const idx = Math.floor(Math.random() * this.buffer.length);
      const { state, action, reward, nextState, done } = this.buffer[idx];

      // Tìm hành động tốt nhất ở trạng thái tiếp theo theo target network
      let bestNextA = 0;
      let maxNextQ = -Infinity;
      for (let a = 0; a < this.actionDim; a++) {
        const qVal = this.expectedQ(nextState, a, true);
        if (qVal > maxNextQ) {
          maxNextQ = qVal;
          bestNextA = a;
        }
      }

      const nextQuantiles = this.predictQuantiles(nextState, bestNextA, true);
      const currentQuantiles = this.predictQuantiles(state, action, false);

      // Cập nhật từng lượng phân vị
      for (let i = 0; i < this.numQuantiles; i++) {
        const tau_i = this.tau[i];
        let errorSum = 0;

        for (let j = 0; j < this.numQuantiles; j++) {
          const target_j = reward + (done ? 0 : this.gamma * nextQuantiles[j]);
          const u = target_j - currentQuantiles[i];
          const loss = this._huberQuantileLoss(u, tau_i);
          totalLoss += loss;

          // Gradient bước đơn
          const gradSign = u < 0 ? (tau_i - 1) : tau_i;
          errorSum += gradSign;
        }

        const avgGrad = errorSum / this.numQuantiles;
        for (let s = 0; s < this.stateDim; s++) {
          this.weights[action][i][s] += this.lr * avgGrad * (state[s] || 0) * 0.1;
        }
      }
    }

    // Cập nhật mềm (Polyak) sang targetWeights
    for (let a = 0; a < this.actionDim; a++) {
      for (let i = 0; i < this.numQuantiles; i++) {
        for (let s = 0; s < this.stateDim; s++) {
          this.targetWeights[a][i][s] = 0.05 * this.weights[a][i][s] + 0.95 * this.targetWeights[a][i][s];
        }
      }
    }

    return {
      trained: true,
      avgLoss: Number((totalLoss / (size * this.numQuantiles * this.numQuantiles)).toFixed(4))
    };
  }

  assessCustomerCredit(customerContext) {
    const {
      trustScore = 75,
      completedOrders = 15,
      totalOrders = 16,
      monthlySpend = 4500000,
      accountAgeMonths = 8
    } = customerContext;

    const successRate = totalOrders > 0 ? completedOrders / totalOrders : 0.5;
    const cancelRate = 1.0 - successRate;
    const state = [
      Math.min(1.0, trustScore / 100),
      Math.min(1.0, successRate),
      Math.min(2.0, monthlySpend / 5000000),
      Math.min(1.0, cancelRate),
      Math.min(1.0, accountAgeMonths / 24)
    ];

    const decision = this.selectAction(state, true);
    let riskTier = 'LOW_RISK';
    if (decision.actionIndex === 0) riskTier = 'HIGH_DEFAULT_RISK';
    else if (decision.actionIndex === 1) riskTier = 'MODERATE_CAUTIOUS';
    else if (decision.actionIndex >= 2) riskTier = 'PRIME_EXCELLENT';

    return {
      riskTier,
      approvedSpayLaterLimit: decision.approvedLimitVND,
      cvarTailRiskScore: decision.cvarScore,
      canInstantRefund: decision.approvedLimitVND >= 5000000 && successRate >= 0.85,
      recommendation: riskTier === 'HIGH_DEFAULT_RISK'
        ? 'Chặn cấp tín dụng ví trả sau, yêu cầu thanh toán trước VietQR'
        : `Cấp hạn mức Ví Trả Sau ${decision.approvedLimitVND.toLocaleString('vi-VN')}₫ bảo toàn rủi ro CVaR`
    };
  }
}

export { QRDQNCreditRisk };
export default QRDQNCreditRisk;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QRDQNCreditRisk };
  }
} catch (e) {}
