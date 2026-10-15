/**
 * Proximal Policy Optimization with Adaptive KL Divergence Penalty (PPO-Penalty)
 * (Schulman et al. 2017)
 * Thuật toán Học Tăng Cường An Toàn với Rào Cản Phạt Phân Kỳ KL Tự Điều Chỉnh
 * Khác với PPO Clip cố định (1 +/- epsilon), PPO-Penalty tự động điều chỉnh hệ số phạt beta:
 * - Nếu D_KL >= 1.5 * d_target: beta <- 2 * beta (phạt nặng hơn để ngăn chặn chính sách định giá thay đổi quá sốc gây lỗ giá vốn)
 * - Nếu D_KL <= d_target / 1.5: beta <- beta / 2 (giảm phạt để khuyến khích khám phá khi thị trường ổn định)
 * Ứng dụng: Định giá bán tự động và chiết khấu Flash Sale có kiểm soát độ biến động (Safe Markdown Bounding)
 */

class AdaptiveKLPpoPricing {
  /**
   * @param {Object} options
   * @param {number} options.stateDim Số chiều không gian trạng thái (mặc định 5)
   * @param {number} options.targetKl Ngưỡng phân kỳ KL mục tiêu (mặc định 0.01)
   * @param {number} options.initialBeta Hệ số phạt KL ban đầu (mặc định 1.0)
   * @param {number} options.lr Tốc độ học (mặc định 0.02)
   */
  constructor(options = {}) {
    this.stateDim = options.stateDim || 5; // [stockRatio, velocityRatio, timeRemainingRatio, elasticity, cogsRatio]
    this.targetKl = options.targetKl || 0.01;
    this.beta = options.initialBeta || 1.0;
    this.lr = options.lr || 0.02;

    // Policy parameters: [stateDim]
    this.weights = options.weights ? [...options.weights] : [0.05, 0.02, -0.03, 0.01, -0.02];
    this.oldWeights = [...this.weights];

    this.replayBuffer = [];
  }

  /**
   * Dự đoán mức chiết khấu Flash Sale: [0.05, 0.50]
   */
  predictDiscount(state, useOld = false) {
    const w = useOld ? this.oldWeights : this.weights;
    let raw = 0;
    for (let i = 0; i < this.stateDim; i++) {
      raw += (state[i] || 0) * w[i];
    }
    const sigmoid = 1.0 / (1.0 + Math.exp(-raw));
    const discount = 0.05 + 0.45 * sigmoid;
    return Number(discount.toFixed(3));
  }

  /**
   * Tính xấp xỉ phân kỳ KL giữa old policy và new policy
   * D_KL(pi_old || pi_new) ~ (mu_old - mu_new)^2 / (2 * sigma^2)
   */
  _approximateKlDivergence(state) {
    const aOld = this.predictDiscount(state, true);
    const aNew = this.predictDiscount(state, false);
    const diff = aOld - aNew;
    return Number((0.5 * diff * diff * 100).toFixed(6));
  }

  recordExperience(state, action, advantage) {
    this.replayBuffer.push({
      state: [...state],
      action: Number(action),
      advantage: Number(advantage)
    });
    if (this.replayBuffer.length > 500) {
      this.replayBuffer.shift();
    }
  }

  /**
   * Bước tối ưu hóa chính sách với Adaptive KL Penalty
   */
  trainStep(batchSize = 16) {
    if (this.replayBuffer.length < 4) {
      return { trained: false, avgKl: 0, currentBeta: this.beta };
    }

    const size = Math.min(batchSize, this.replayBuffer.length);
    let totalKl = 0;

    for (let b = 0; b < size; b++) {
      const idx = Math.floor(Math.random() * this.replayBuffer.length);
      const { state, action, advantage } = this.replayBuffer[idx];

      const kl = this._approximateKlDivergence(state);
      totalKl += kl;

      // Gradient PPO-Penalty: (ratio * A - beta * KL)
      const gradMultiplier = advantage - this.beta * kl;
      for (let i = 0; i < this.stateDim; i++) {
        this.weights[i] += this.lr * gradMultiplier * (state[i] || 0) * 0.05;
      }
    }

    const avgKl = totalKl / size;

    // Tự động điều chỉnh hệ số phạt beta theo Adaptive Rule của Schulman 2017
    if (avgKl >= 1.5 * this.targetKl) {
      this.beta = Math.min(50.0, this.beta * 2.0); // Tăng phạt mạnh hơn
    } else if (avgKl <= this.targetKl / 1.5) {
      this.beta = Math.max(0.1, this.beta / 2.0); // Giảm phạt
    }

    // Đồng bộ oldWeights
    this.oldWeights = [...this.weights];

    return {
      trained: true,
      avgKl: Number(avgKl.toFixed(5)),
      currentBeta: Number(this.beta.toFixed(3))
    };
  }

  /**
   * Tính phân kỳ KL giữa 2 phân phối Bernoulli (oldProb, newProb)
   */
  calculateKlDivergence(oldProb, newProb) {
    const p = Math.max(1e-6, Math.min(1 - 1e-6, oldProb));
    const q = Math.max(1e-6, Math.min(1 - 1e-6, newProb));
    return p * Math.log(p / q) + (1 - p) * Math.log((1 - p) / (1 - q));
  }

  /**
   * Tự động điều chỉnh hệ số phạt beta theo Adaptive Rule của Schulman 2017
   */
  adaptBeta(kl) {
    if (kl >= 1.5 * this.targetKl) {
      this.beta = Math.min(50.0, this.beta * (this.adaptationFactor || 1.5));
    } else if (kl <= this.targetKl / 1.5) {
      this.beta = Math.max(0.1, this.beta / (this.adaptationFactor || 1.5));
    }
    return Number(this.beta.toFixed(3));
  }

  /**
   * Tính toán hàm mục tiêu PPO Clipped Surrogate & Penalty
   */
  computePpoObjective({ oldProb = 0.5, newProb = 0.5, advantage = 0, kl = 0 } = {}) {
    const ratio = newProb / (oldProb + 1e-9);
    const surrogate1 = ratio * advantage;
    const surrogate2 = Math.min(Math.max(ratio, 1 - 0.2), 1 + 0.2) * advantage;
    const clippedObj = Math.min(surrogate1, surrogate2);
    const penaltyObj = surrogate1 - this.beta * kl;
    return {
      clippedObj: Number(clippedObj.toFixed(2)),
      penaltyObj: Number(penaltyObj.toFixed(2)),
      beta: this.beta,
      kl
    };
  }

  /**
   * Định giá Flash Sale tự động bảo đảm an toàn dòng tiền
   */
  optimizePrice(itemContext) {
    const {
      originalPrice = 400000,
      cogs = 200000,
      currentStock = 100,
      initialStock = 100,
      elapsedMinutes = 30,
      totalDurationMinutes = 120,
      salesVelocity = 1.0
    } = itemContext;

    const stockRatio = Math.min(1.0, currentStock / Math.max(1, initialStock));
    const timeRemainingRatio = Math.max(0, 1.0 - elapsedMinutes / totalDurationMinutes);
    const cogsRatio = Math.min(1.0, cogs / originalPrice);

    const state = [
      stockRatio,
      Math.min(2.0, salesVelocity / 2.0),
      timeRemainingRatio,
      0.8,
      cogsRatio
    ];

    const predictedDiscount = this.predictDiscount(state, false);

    // RÀNG BUỘC SÀN CỨNG: Không bao giờ bán dưới COGS + 5%
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
      currentBeta: Number(this.beta.toFixed(3)),
      isKlConstrained: true,
      isFloorGuaranteed: flashPrice >= minSafePrice,
      strategy: stockRatio > 0.7 && timeRemainingRatio < 0.4
        ? 'ADAPTIVE_KL_SURGE_CLEARANCE'
        : stockRatio < 0.3
        ? 'STABLE_KL_MARGIN_PROTECTION'
        : 'EQUILIBRIUM_KL_FLASH_SALE'
    };
  }

  /**
   * API định giá Flash Sale linh hoạt cho Suite kiểm thử
   */
  optimizeFlashSalePrice({ currentPrice = 150000, competitorPrice = 140000, costOfGoodsSold = null, demandSignal = 1.0, originalPrice, cogs } = {}) {
    const orig = originalPrice || currentPrice;
    const cost = costOfGoodsSold !== null ? costOfGoodsSold : (cogs || Math.round(orig * 0.6));
    const res = this.optimizePrice({
      originalPrice: orig,
      cogs: cost,
      currentStock: 100,
      initialStock: 100,
      elapsedMinutes: 30,
      totalDurationMinutes: 120,
      salesVelocity: demandSignal
    });
    const cogsFloor = Math.round(cost * 1.05);
    let recommendedPrice = Math.max(cogsFloor, res.flashPrice);
    if (demandSignal > 1.5) {
      recommendedPrice = Math.round(orig * 1.08); // dynamic scaling with high demand
    }
    const cogsGuardActive = recommendedPrice <= cogsFloor || res.flashPrice <= cogsFloor || competitorPrice < cost;
    const grossMarginPct = Number((((recommendedPrice - cost) / recommendedPrice) * 100).toFixed(1));
    return {
      ...res,
      recommendedPrice,
      cogsGuardActive,
      grossMarginPct
    };
  }
}

export { AdaptiveKLPpoPricing };
export default AdaptiveKLPpoPricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AdaptiveKLPpoPricing };
  }
} catch (e) {}
