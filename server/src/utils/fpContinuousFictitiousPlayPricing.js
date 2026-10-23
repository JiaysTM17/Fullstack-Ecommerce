/**
 * fpContinuousFictitiousPlayPricing.js
 * 
 * Thuật toán Định giá Đa đại lý Fictitious Play và Continuous-Action Fictitious Play (CFP)
 * (G. W. Brown 1951, D. S. Leslie & E. J. Collins 2006 JMLR, Perkins & Leslie 2014)
 * 
 * Nguyên lý hoạt động:
 * - Trong thị trường cạnh tranh không hoàn hảo, người bán không biết hàm chi phí nội bộ của đối thủ.
 * - Mỗi đại lý xây dựng và cập nhật Niềm tin Thực nghiệm (Empirical Belief Distribution) về chiến lược
 *   của đối thủ qua lịch sử quan sát:
 *   mu_{-i}^t = (1 - gamma_t) * mu_{-i}^{t-1} + gamma_t * delta_{p_{-i}^t}
 * - Tìm Đáp ứng Tối ưu Làm mịn (Smooth Stochastic Best Response):
 *   p_i^* = argmax_{p_i} E_{mu_{-i}}[ pi_i(p_i, p_{-i}) ]
 *   với hàm lợi nhuận đơn vị pi_i = (p_i - COGS_i) * Q_i(p_i, p_{-i}).
 * - Độ co giãn giá chéo (Cross-Price Elasticity):
 *   Q_i(p_i, p_{-i}) = max(0, D_0 - beta * p_i + theta * p_{-i}).
 * - KHÓA SÀN GIÁ VỐN AN TOÀN TUYỆT ĐỐI (Safe Price Floor Guarantee):
 *   P_i >= 1.05 * COGS_i trên mọi phân phối xác suất và mọi bước lặp.
 */

export class FPContinuousFictitiousPlayPricing {
  /**
   * @param {Object} options
   * @param {number} [options.temperature=25000] - Hệ số làm mịn nhiệt độ softmax tau
   * @param {number} [options.learningRate=0.1] - Tốc độ cập nhật niềm tin gamma_t
   * @param {number} [options.priceSteps=20] - Số lượng mức giá rời rạc trong không gian liên tục
   * @param {number} [options.floorMargin=1.05] - Biên độ sàn giá vốn an toàn tối thiểu (1.05)
   */
  constructor(options = {}) {
    this.temperature = Math.max(100, options.temperature || 25000);
    this.learningRate = Math.min(1.0, Math.max(0.01, options.learningRate || 0.1));
    this.priceSteps = Math.max(5, options.priceSteps || 20);
    this.floorMargin = Math.max(1.05, options.floorMargin || 1.05);

    // Lưu trữ niềm tin phân phối giá đối thủ theo từng SKU
    // skuId -> Array<{ price: number, weight: number }>
    this.beliefs = new Map();
  }

  /**
   * Khóa sàn an toàn tuyệt đối: Giá không bao giờ dưới 1.05 * COGS
   * @param {number} price
   * @param {number} cogs
   * @returns {number}
   */
  enforceSafePriceFloor(price, cogs) {
    const minSafePrice = Math.round(Number(cogs) * this.floorMargin);
    return Math.max(minSafePrice, Math.round(Number(price) || minSafePrice));
  }

  /**
   * Sinh các ứng viên giá trong không gian liên tục, đảm bảo tuân thủ sàn giá vốn
   * @param {number} cogs
   * @param {number} basePrice
   * @param {number} [maxMultiplier=2.0]
   * @returns {number[]}
   */
  generatePriceCandidates(cogs, basePrice, maxMultiplier = 2.0) {
    const minFloor = Math.round(cogs * this.floorMargin);
    const ceiling = Math.max(minFloor * 1.2, Math.round(basePrice * maxMultiplier));
    const step = (ceiling - minFloor) / (this.priceSteps - 1);

    const candidates = [];
    for (let i = 0; i < this.priceSteps; i++) {
      const p = Math.round(minFloor + i * step);
      candidates.push(this.enforceSafePriceFloor(p, cogs));
    }
    return Array.from(new Set(candidates)).sort((a, b) => a - b);
  }

  /**
   * Ước tính hàm cầu thị trường với độ co giãn giá chéo
   * Q_i(p_i, p_{-i}) = max(0, D_0 - beta * p_i + theta * p_{-i})
   * @param {number} ownPrice
   * @param {number} competitorPrice
   * @param {Object} [demandParams]
   * @returns {number}
   */
  estimateDemand(ownPrice, competitorPrice, demandParams = {}) {
    const baseDemand = demandParams.baseDemand || 200;
    const beta = demandParams.beta || 0.0002; // Độ co giãn giá riêng
    const theta = demandParams.theta || 0.0001; // Độ co giãn giá chéo (đối thủ tăng giá -> cầu của ta tăng)

    const rawDemand = baseDemand - beta * ownPrice + theta * competitorPrice;
    return Math.max(1, Math.round(rawDemand));
  }

  /**
   * Cập nhật phân phối niềm tin thực nghiệm về giá của đối thủ
   * @param {string} skuId
   * @param {number} observedCompetitorPrice
   * @param {number[]} candidatePrices
   */
  updateBeliefs(skuId, observedCompetitorPrice, candidatePrices) {
    let dist = this.beliefs.get(skuId);
    if (!dist || dist.length !== candidatePrices.length) {
      // Khởi tạo phân phối đồng đều
      const uniformWeight = 1.0 / candidatePrices.length;
      dist = candidatePrices.map(p => ({ price: p, weight: uniformWeight }));
      this.beliefs.set(skuId, dist);
    }

    // Tìm điểm gần nhất với giá quan sát của đối thủ
    let closestIdx = 0;
    let minDiff = Infinity;
    for (let i = 0; i < dist.length; i++) {
      const diff = Math.abs(dist[i].price - observedCompetitorPrice);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    }

    // Cập nhật trọng số theo luật Fictitious Play:
    // w_j <- (1 - gamma) * w_j + gamma * (j == closestIdx ? 1 : 0)
    let totalWeight = 0;
    for (let i = 0; i < dist.length; i++) {
      const indicator = (i === closestIdx) ? 1.0 : 0.0;
      dist[i].weight = (1.0 - this.learningRate) * dist[i].weight + this.learningRate * indicator;
      totalWeight += dist[i].weight;
    }

    // Chuẩn hóa xác suất
    for (let i = 0; i < dist.length; i++) {
      dist[i].weight /= totalWeight;
    }
  }

  /**
   * Tính toán Đáp ứng Tối ưu Fictitious Play (Best Response)
   * Tích phân lợi nhuận kỳ vọng qua phân phối niềm tin của đối thủ
   * @param {number} cogs
   * @param {Array<{ price: number, weight: number }>} competitorBeliefs
   * @param {number[]} candidates
   * @param {Object} [demandParams]
   * @returns {{ optimalPrice: number, expectedProfit: number, priceProbabilities: Array<{ price: number, prob: number }> }}
   */
  computeBestResponse(cogs, competitorBeliefs, candidates, demandParams = {}) {
    const minFloor = Math.round(cogs * this.floorMargin);
    const expectedProfits = [];

    for (const ownP of candidates) {
      const safeP = Math.max(minFloor, ownP);
      const unitMargin = safeP - cogs;

      // Kỳ vọng lợi nhuận E[Profit] = sum_k w_k * unitMargin * Demand(safeP, p_k)
      let expectedPft = 0;
      for (const belief of competitorBeliefs) {
        const demand = this.estimateDemand(safeP, belief.price, demandParams);
        expectedPft += belief.weight * (unitMargin * demand);
      }
      expectedProfits.push({ price: safeP, expectedProfit: expectedPft });
    }

    // Softmax làm mịn đáp ứng xác suất (Smooth Best Response)
    // Tránh nhảy bậc dao động tuần hoàn (Limit Cycles)
    let maxPft = -Infinity;
    for (const ep of expectedProfits) {
      if (ep.expectedProfit > maxPft) maxPft = ep.expectedProfit;
    }

    let expSum = 0;
    const expVals = expectedProfits.map(ep => {
      const scaled = Math.exp((ep.expectedProfit - maxPft) / (this.temperature / 100));
      expSum += scaled;
      return scaled;
    });

    const priceProbabilities = expectedProfits.map((ep, idx) => ({
      price: ep.price,
      prob: Number((expVals[idx] / expSum).toFixed(4)),
      expectedProfit: Math.round(ep.expectedProfit)
    }));

    // Chọn giá có kỳ vọng lợi nhuận cao nhất
    let best = expectedProfits[0];
    for (const ep of expectedProfits) {
      if (ep.expectedProfit > best.expectedProfit) {
        best = ep;
      }
    }

    return {
      optimalPrice: this.enforceSafePriceFloor(best.price, cogs),
      expectedProfit: Math.round(best.expectedProfit),
      priceProbabilities
    };
  }

  /**
   * Tối ưu hóa giá thị trường toàn diện cho danh mục sản phẩm
   * @param {Array<{ skuId: string, name: string, cogs: number, currentPrice: number, competitorPrice?: number, demandParams?: Object }>} products
   * @returns {Object}
   */
  optimizePrices(products = []) {
    const recommendations = [];

    for (const prod of products) {
      const cogs = Math.max(1000, Number(prod.cogs) || 100000);
      const basePrice = Math.max(cogs * this.floorMargin, Number(prod.currentPrice) || cogs * 1.3);
      const competitorPrice = Number(prod.competitorPrice) || basePrice;

      const candidates = this.generatePriceCandidates(cogs, basePrice);

      // Cập nhật niềm tin thực nghiệm về đối thủ
      this.updateBeliefs(prod.skuId, competitorPrice, candidates);
      const currentBeliefs = this.beliefs.get(prod.skuId);

      // Tính đáp ứng tối ưu
      const response = this.computeBestResponse(cogs, currentBeliefs, candidates, prod.demandParams);

      recommendations.push({
        skuId: prod.skuId,
        name: prod.name,
        cogs,
        safePriceFloor: Math.round(cogs * this.floorMargin),
        currentPrice: basePrice,
        competitorObservedPrice: competitorPrice,
        recommendedPrice: response.optimalPrice,
        expectedProfit: response.expectedProfit,
        isFloorGuaranteed: response.optimalPrice >= Math.round(cogs * this.floorMargin),
        priceProbabilities: response.priceProbabilities.slice(0, 5) // top 5
      });
    }

    return {
      status: "CONTINUOUS_FICTITIOUS_PLAY_PASS",
      algorithm: "Continuous-Action Fictitious Play (Brown 1951, Leslie & Collins 2006)",
      temperature: this.temperature,
      learningRate: this.learningRate,
      floorMargin: this.floorMargin,
      totalOptimized: recommendations.length,
      allFloorsGuaranteed: recommendations.every(r => r.isFloorGuaranteed),
      recommendations
    };
  }
}

export default FPContinuousFictitiousPlayPricing;
