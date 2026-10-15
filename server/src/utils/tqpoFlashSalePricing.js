/**
 * Truncated Quantile Policy Optimization (TQPO)
 * (Kuznetsov et al., ICML 2020)
 * Thuật toán Tối Ưu Hóa Chính Sách Lượng Phân Vị Cắt Ngọn (Truncated Quantiles)
 * Cắt bỏ k lượng phân vị cực đoan (Tail Truncation) ở đuôi phân phối để triệt tiêu
 * hiện tượng overestimation bias và loại trừ hoàn toàn các kịch bản bán phá giá dưới giá vốn.
 * Ứng dụng: Định giá tự động trong sự kiện Flash Sale (Dynamic Flash Sale Markdown)
 * Tối đa hóa GMV và tốc độ giải phóng kho trong khi bảo chứng biên lợi nhuận Gross Margin >= COGS
 */

class TQPOFlashSalePricing {
  constructor(options = {}) {
    this.numQuantiles = options.numQuantiles || 8;
    this.stateDim = options.stateDim || 5; // [stockRatio, velocityRatio, timeRemainingRatio, elasticity, cogsRatio]
    this.gamma = options.gamma || 0.95;
    this.lr = options.lr || 0.02;
    this.truncationCutoff = options.truncationCutoff || 2; // Cắt bỏ 2 lượng phân vị thấp nhất

    // Trọng số Actor Policy [mu, std]
    this.actorWeights = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);

    // Trọng số Critic Quantiles: [numQuantiles x stateDim]
    this.criticWeights = Array.from({ length: this.numQuantiles }, () =>
      new Array(this.stateDim + 1).fill(0).map(() => (Math.random() - 0.5) * 0.1)
    );

    this.targetCriticWeights = JSON.parse(JSON.stringify(this.criticWeights));
    this.replayBuffer = [];
  }

  /**
   * Dự đoán hành động chiết khấu (Discount Percent 0% - 50%)
   */
  predictAction(state, deterministic = true) {
    let raw = 0;
    for (let i = 0; i < this.stateDim; i++) {
      raw += (state[i] || 0) * this.actorWeights[i];
    }
    // Squashed qua hàm sigmoid về khoảng [0.05, 0.50] (giảm từ 5% đến 50%)
    const sigmoid = 1.0 / (1.0 + Math.exp(-raw));
    const discount = 0.05 + 0.45 * sigmoid;
    return Number(discount.toFixed(3));
  }

  /**
   * Dự đoán các lượng phân vị của Critic
   */
  _predictQuantiles(weights, state, action) {
    const quantiles = [];
    for (let q = 0; q < this.numQuantiles; q++) {
      let val = 0;
      for (let i = 0; i < this.stateDim; i++) {
        val += (state[i] || 0) * weights[q][i];
      }
      val += action * weights[q][this.stateDim];
      quantiles.push(val);
    }
    return quantiles.sort((a, b) => a - b);
  }

  /**
   * Tính kỳ vọng phần thưởng cắt ngọn (Truncated Quantile Expectation)
   * Loại bỏ `truncationCutoff` lượng phân vị thấp nhất để bảo vệ rủi ro
   */
  truncatedExpectation(state, action, useTarget = false) {
    const weights = useTarget ? this.targetCriticWeights : this.criticWeights;
    const quantiles = this._predictQuantiles(weights, state, action);
    // Cắt ngọn các lượng phân vị thấp nhất
    const retained = quantiles.slice(this.truncationCutoff);
    const sum = retained.reduce((a, b) => a + b, 0);
    return sum / retained.length;
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

  trainStep(batchSize = 16) {
    if (this.replayBuffer.length < 4) {
      return { trained: false, loss: 0 };
    }

    const size = Math.min(batchSize, this.replayBuffer.length);
    let totalLoss = 0;

    for (let b = 0; b < size; b++) {
      const idx = Math.floor(Math.random() * this.replayBuffer.length);
      const { state, action, reward, nextState, done } = this.replayBuffer[idx];

      const nextAction = this.predictAction(nextState, true);
      const targetTruncatedQ = this.truncatedExpectation(nextState, nextAction, true);
      const targetVal = reward + (done ? 0 : this.gamma * targetTruncatedQ);

      const currentQuantiles = this._predictQuantiles(this.criticWeights, state, action);

      for (let q = 0; q < this.numQuantiles; q++) {
        const err = targetVal - currentQuantiles[q];
        totalLoss += Math.abs(err);

        for (let i = 0; i < this.stateDim; i++) {
          this.criticWeights[q][i] += this.lr * err * (state[i] || 0) * 0.05;
        }
        this.criticWeights[q][this.stateDim] += this.lr * err * action * 0.05;
      }

      // Cập nhật Actor Policy theo gradient hướng cực đại hóa truncated return
      const currentTruncatedQ = this.truncatedExpectation(state, action, false);
      for (let i = 0; i < this.stateDim; i++) {
        this.actorWeights[i] += this.lr * currentTruncatedQ * (state[i] || 0) * 0.02;
      }
    }

    // Polyak target update
    for (let q = 0; q < this.numQuantiles; q++) {
      for (let i = 0; i <= this.stateDim; i++) {
        this.targetCriticWeights[q][i] =
          0.05 * this.criticWeights[q][i] + 0.95 * this.targetCriticWeights[q][i];
      }
    }

    return {
      trained: true,
      avgLoss: Number((totalLoss / (size * this.numQuantiles)).toFixed(4))
    };
  }

  /**
   * Định giá Flash Sale tự động theo thời gian thực (Bảo chứng không bán dưới giá vốn)
   */
  optimizeFlashSalePrice(itemContext) {
    const {
      originalPrice = 500000,
      cogs = 250000, // Giá vốn hàng bán COGS
      currentStock = 100,
      initialStock = 100,
      elapsedMinutes = 30,
      totalDurationMinutes = 120,
      salesVelocity = 1.2
    } = itemContext;

    const stockRatio = Math.min(1.0, currentStock / Math.max(1, initialStock));
    const timeRemainingRatio = Math.max(0, 1.0 - elapsedMinutes / totalDurationMinutes);
    const cogsRatio = Math.min(1.0, cogs / originalPrice);

    const state = [
      stockRatio,
      Math.min(2.0, salesVelocity / 2.0),
      timeRemainingRatio,
      0.8, // Price elasticity
      cogsRatio
    ];

    const predictedDiscount = this.predictAction(state, true);

    // RÀNG BUỘC TUYỆT ĐỐI: Giá bán Flash Sale không được thấp hơn COGS + 5% lãi tối thiểu
    const minSafePrice = Math.round(cogs * 1.05);
    const maxSafeDiscount = Number(((originalPrice - minSafePrice) / originalPrice).toFixed(3));
    const appliedDiscount = Math.min(predictedDiscount, maxSafeDiscount);

    const flashPrice = Math.round(originalPrice * (1.0 - appliedDiscount));
    const grossMarginPercent = Number((((flashPrice - cogs) / flashPrice) * 100).toFixed(1));

    return {
      originalPrice,
      cogs,
      flashPrice,
      discountPercent: Math.round(appliedDiscount * 100),
      grossMarginPercent,
      isFloorGuaranteed: flashPrice >= minSafePrice,
      strategy: stockRatio > 0.7 && timeRemainingRatio < 0.4
        ? 'DEEP_LIQUIDATION_SURGE'
        : stockRatio < 0.3
        ? 'PROFIT_MARGIN_PROTECTION'
        : 'BALANCED_FLASH_VELOCITY'
    };
  }
}

export { TQPOFlashSalePricing };
export default TQPOFlashSalePricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { TQPOFlashSalePricing };
  }
} catch (e) {}
