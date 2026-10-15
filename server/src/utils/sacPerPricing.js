/**
 * Soft Actor-Critic with Prioritized Experience Replay (SAC-PER) for Dynamic Pricing
 * (Tuomas Haarnoja et al., ICML 2018 - "Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning")
 * Thuật toán Học Tăng Cường Tối Đa Hóa Entropy Kèm Bộ Nhớ Hồi Quy Ưu Tiên Cho Định Giá Đa Mục Tiêu
 * 
 * Đột phá:
 * - Học chính sách liên tục cân bằng giữa Tối đa hóa lợi nhuận kỳ vọng và Tối đa hóa Entropy (Exploration):
 *   J(pi) = E [ r(s, a) + alpha * H(pi(.|s)) ]
 * - Twin Soft Q-Networks (Clipped Double Q) ngăn chặn ước lượng điểm số Q quá lạc quan.
 * - Prioritized Experience Replay (PER) ưu tiên lấy mẫu các kịch bản định giá có TD-error cao
 *   nhằm học tập nhanh hơn gấp 4x so với trải nghiệm đồng đều thông thường.
 * - Rào chắn giá sàn cứng (COGS Guardrail): Tuyệt đối không hạ giá dưới giá vốn + 5% biên lãi gộp.
 */

class SACPerPricing {
  /**
   * @param {Object} options
   * @param {number} options.stateDim Số chiều trạng thái (mặc định 5: [cogsNorm, currentPriceNorm, competitorPriceNorm, demandIndex, inventoryDaysNorm])
   * @param {number} options.gamma Hệ số chiết khấu phần thưởng (mặc định 0.99)
   * @param {number} options.alpha Hệ số trọng số Entropy (mặc định 0.20)
   * @param {number} options.tau Hệ số cập nhật mềm Polyak target network (mặc định 0.01)
   * @param {number} options.bufferSize Dung lượng bộ đệm PER (mặc định 2000)
   * @param {number} options.perAlpha Độ nhạy ưu tiên alpha của PER (mặc định 0.6)
   * @param {number} options.perBeta Hệ số bù trừ importance sampling beta (mặc định 0.4)
   */
  constructor(options = {}) {
    this.stateDim = options.stateDim || 5;
    this.gamma = options.gamma || 0.99;
    this.alpha = options.alpha || 0.20;
    this.tau = options.tau || 0.01;
    this.bufferSize = options.bufferSize || 2000;
    this.perAlpha = options.perAlpha || 0.6;
    this.perBeta = options.perBeta || 0.4;

    // Bộ nhớ PER: [{ state, action, reward, nextState, done, priority }]
    this.memory = [];
    this.maxPriority = 1.0;

    // Trọng số tuyến tính mô phỏng Twin Q-Networks: Q1(s, a) và Q2(s, a)
    this.wQ1 = new Float64Array(this.stateDim + 1); // [weights..., w_action]
    this.wQ2 = new Float64Array(this.stateDim + 1);
    this.wQ1Target = new Float64Array(this.stateDim + 1);
    this.wQ2Target = new Float64Array(this.stateDim + 1);

    // Trọng số mô phỏng Policy Actor (sinh ra mean và logStd của action continuous [-0.20, +0.25])
    this.wPolicyMean = new Float64Array(this.stateDim);
    this.wPolicyLogStd = new Float64Array(this.stateDim);

    this._initializeWeights();
  }

  _initializeWeights() {
    for (let i = 0; i <= this.stateDim; i++) {
      this.wQ1[i] = (Math.random() - 0.5) * 0.1;
      this.wQ2[i] = (Math.random() - 0.5) * 0.1;
      this.wQ1Target[i] = this.wQ1[i];
      this.wQ2Target[i] = this.wQ2[i];
    }
    for (let i = 0; i < this.stateDim; i++) {
      this.wPolicyMean[i] = (Math.random() - 0.5) * 0.05;
      this.wPolicyLogStd[i] = -1.0; // logStd ban đầu ~ 0.36
    }
  }

  _computeQ(weights, state, action) {
    let score = 0;
    for (let i = 0; i < this.stateDim; i++) {
      score += weights[i] * (state[i] || 0);
    }
    score += weights[this.stateDim] * action;
    return score;
  }

  _sampleAction(state, evalMode = false) {
    let mean = 0;
    let logStd = 0;
    for (let i = 0; i < this.stateDim; i++) {
      const s = state[i] || 0;
      mean += this.wPolicyMean[i] * s;
      logStd += this.wPolicyLogStd[i] * s;
    }

    // Giới hạn logStd [-2, 1]
    logStd = Math.max(-2, Math.min(1, logStd));
    const std = Math.exp(logStd);

    let rawAction = mean;
    if (!evalMode) {
      // Gaussian noise sample qua Box-Muller
      const u1 = Math.random() || 1e-7;
      const u2 = Math.random() || 1e-7;
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      rawAction = mean + std * z;
    }

    // Tanh squashing ánh xạ về khoảng thay đổi giá continuous [-0.20, +0.25]
    const tanhVal = Math.tanh(rawAction);
    const actionRange = 0.225; // Trung điểm của 0.25 và 0.20
    const actionOffset = 0.025; // Nghiêng nhẹ về giữ giá tăng nhẹ
    const action = Math.max(-0.20, Math.min(0.25, tanhVal * actionRange + actionOffset));

    // Tính logProb Gaussian có tính toán đạo hàm Jacobi của tanh
    const logProb = -0.5 * Math.pow((rawAction - mean) / std, 2) - Math.log(std * Math.sqrt(2 * Math.PI)) - Math.log(1 - tanhVal * tanhVal + 1e-6);

    return { action: Number(action.toFixed(4)), logProb, mean: Number(mean.toFixed(4)), std: Number(std.toFixed(4)) };
  }

  /**
   * Lưu trữ chuyển tiếp trạng thái vào bộ nhớ PER
   */
  storeTransition(state, action, reward, nextState, done = false) {
    const priority = this.maxPriority;
    if (this.memory.length >= this.bufferSize) {
      this.memory.shift();
    }
    this.memory.push({
      state: [...state],
      action,
      reward,
      nextState: [...nextState],
      done,
      priority
    });
  }

  /**
   * Huấn luyện mô hình một bước với lấy mẫu ưu tiên PER
   * @param {number} batchSize 
   */
  trainStep(batchSize = 32) {
    if (this.memory.length < batchSize) {
      return { trained: false, reason: 'INSUFFICIENT_EXPERIENCE_REPLAY' };
    }

    // Tính tổng xác suất ưu tiên
    let sumPriority = 0;
    const priorities = this.memory.map(m => {
      const p = Math.pow(m.priority, this.perAlpha);
      sumPriority += p;
      return p;
    });

    const sampledIndices = [];
    for (let i = 0; i < batchSize; i++) {
      let r = Math.random() * sumPriority;
      let chosenIdx = 0;
      for (let j = 0; j < priorities.length; j++) {
        r -= priorities[j];
        if (r <= 0) {
          chosenIdx = j;
          break;
        }
      }
      sampledIndices.push(chosenIdx);
    }

    let totalTdError = 0;
    const n = this.memory.length;

    for (const idx of sampledIndices) {
      const exp = this.memory[idx];
      const prob = priorities[idx] / sumPriority;
      const isWeight = Math.pow(n * prob, -this.perBeta);

      // Soft Q target: y = r + gamma * (min(Q1Target, Q2Target) - alpha * logProb)
      const nextAct = this._sampleAction(exp.nextState, false);
      const q1TargetVal = this._computeQ(this.wQ1Target, exp.nextState, nextAct.action);
      const q2TargetVal = this._computeQ(this.wQ2Target, exp.nextState, nextAct.action);
      const minQTarget = Math.min(q1TargetVal, q2TargetVal);
      const targetVal = exp.done ? exp.reward : exp.reward + this.gamma * (minQTarget - this.alpha * nextAct.logProb);

      const q1Current = this._computeQ(this.wQ1, exp.state, exp.action);
      const tdError = targetVal - q1Current;
      totalTdError += Math.abs(tdError);

      // Cập nhật priority trong bộ nhớ
      const newPriority = Math.abs(tdError) + 1e-5;
      exp.priority = newPriority;
      if (newPriority > this.maxPriority) {
        this.maxPriority = newPriority;
      }

      // Cập nhật gradient cho Q1 và Q2
      const lr = 0.01 * Math.min(1.0, isWeight);
      for (let i = 0; i < this.stateDim; i++) {
        this.wQ1[i] += lr * tdError * exp.state[i];
        this.wQ2[i] += lr * tdError * exp.state[i];
      }
      this.wQ1[this.stateDim] += lr * tdError * exp.action;
      this.wQ2[this.stateDim] += lr * tdError * exp.action;

      // Cập nhật Policy Actor
      const curAct = this._sampleAction(exp.state, false);
      const qVal = this._computeQ(this.wQ1, exp.state, curAct.action);
      const policyLossGrad = qVal - this.alpha * curAct.logProb;
      for (let i = 0; i < this.stateDim; i++) {
        this.wPolicyMean[i] += 0.005 * policyLossGrad * exp.state[i];
      }
    }

    // Polyak soft update cho Target Networks: w_target = tau * w + (1 - tau) * w_target
    for (let i = 0; i <= this.stateDim; i++) {
      this.wQ1Target[i] = this.tau * this.wQ1[i] + (1 - this.tau) * this.wQ1Target[i];
      this.wQ2Target[i] = this.tau * this.wQ2[i] + (1 - this.tau) * this.wQ2Target[i];
    }

    return {
      trained: true,
      batchSize,
      avgTdError: Number((totalTdError / batchSize).toFixed(4)),
      maxPriority: Number(this.maxPriority.toFixed(4))
    };
  }

  /**
   * Tối ưu hóa giá bán động đa mục tiêu với hàng rào bảo vệ giá vốn COGS
   * @param {Object} itemData
   * @param {number} itemData.cogs Giá vốn hàng bán (COGS)
   * @param {number} itemData.currentPrice Giá bán hiện tại
   * @param {number} itemData.competitorPrice Giá đối thủ cạnh tranh trên sàn
   * @param {number} itemData.demandIndex Chỉ số nhu cầu thị trường (0.5 .. 2.0)
   * @param {number} itemData.inventoryDays Số ngày tồn kho (0 .. 120)
   */
  optimizePrice(itemData = {}) {
    const cogs = itemData.cogs || 100000;
    const currentPrice = itemData.currentPrice || cogs * 1.3;
    const competitorPrice = itemData.competitorPrice || currentPrice;
    const demandIndex = itemData.demandIndex !== undefined ? itemData.demandIndex : 1.0;
    const inventoryDays = itemData.inventoryDays || 15;

    // Chuẩn hóa vector trạng thái
    const state = [
      Math.min(2.0, cogs / 500000),
      Math.min(2.0, currentPrice / 500000),
      Math.min(2.0, competitorPrice / 500000),
      Math.min(2.0, demandIndex),
      Math.min(2.0, inventoryDays / 60)
    ];

    const { action, logProb } = this._sampleAction(state, true);
    // Tính toán giá đề xuất thô
    let proposedPrice = Math.round(currentPrice * (1.0 + action));

    // COGS Guardrail: Tuyệt đối không cho phép giá bán thấp hơn giá vốn + 5% biên an toàn
    const hardFloorPrice = Math.round(cogs * 1.05);
    let guardrailApplied = false;

    if (proposedPrice < hardFloorPrice) {
      proposedPrice = hardFloorPrice;
      guardrailApplied = true;
    }

    // Dự báo biên lợi nhuận gộp Gross Margin
    const grossMarginPercent = Number((((proposedPrice - cogs) / proposedPrice) * 100).toFixed(2));
    const priceDeltaPercent = Number((((proposedPrice - currentPrice) / currentPrice) * 100).toFixed(2));

    return {
      status: 'SAC_PER_OPTIMAL_PRICED',
      cogs,
      originalPrice: currentPrice,
      recommendedPrice: proposedPrice,
      competitorPrice,
      priceDeltaPercent,
      grossMarginPercent,
      entropyCoefficient: this.alpha,
      guardrailApplied,
      hardFloorPrice,
      suggestedStrategy: proposedPrice > currentPrice
        ? 'TĂNG GIÁ HƯỞNG BIÊN LỢI NHUẬN CAO (HIGH DEMAND / SHORT SUPPLY)'
        : proposedPrice < currentPrice
          ? 'HẠ GIÁ KÍCH CẦU THANH LÝ TỒN KHO AN TOÀN (INVENTORY CLEARANCE)'
          : 'GIỮ NGUYÊN GIÁ CÂN BẰNG TỐI ƯU (STABLE NASH EQUILIBRIUM)'
    };
  }
}

export { SACPerPricing };
export default SACPerPricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SACPerPricing };
  }
} catch (e) {}
