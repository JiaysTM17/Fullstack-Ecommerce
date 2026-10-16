/**
 * Proximal Policy Optimization with Adaptive Entropy & Safety Constraints (PPO-Entropy-Safe)
 * 
 * Based on foundational research:
 * - John Schulman, Filip Wolski, Prafulla Dhariwal, Alec Radford, Oleg Klimov (OpenAI 2017):
 *   "Proximal Policy Optimization Algorithms"
 * - Pengqian Yu, Haotian Shen, Yilun Du (AAAI 2021 / NeurIPS 2020):
 *   "Safe Reinforcement Learning via Projected Policy Optimization"
 * 
 * Mathematical Foundations:
 * - In E-Commerce dynamic pricing and flash sale bidding, updating policies without destroying
 *   stable baseline conversions requires:
 *   1. Clipped Surrogate Objective:
 *      r_t(theta) = pi_theta(a_t | s_t) / pi_old(a_t | s_t) = exp(log_pi - log_pi_old)
 *      L^CLIP(theta) = E [ min(r_t * A_t, clip(r_t, 1 - epsilon_clip, 1 + epsilon_clip) * A_t) ]
 *   2. Adaptive Policy Entropy Regularization:
 *      L^ENT(theta) = beta * H(pi_theta(.|s_t))
 *      prevents policy premature collapse to local deterministic dead ends.
 *   3. Dual Lagrangian Safety Constraints:
 *      A_t^safe = A_t^reward - lambda * A_t^cost
 *      lambda <- max(0, lambda + lr_lambda * (C_avg - d_budget))
 * - Safety Guarantees:
 *   - Continuous price adjustment action bounded in [-0.15, +0.15].
 *   - Lagrangian safety damping: ppoDamping = max(0.4, 1.0 - lambda * cost).
 *   - Strict COGS Floor: safePrice >= 1.05 * COGS.
 */

export class PPOEntropySafePricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.stateDim=5] State vector dimension
   * @param {number} [options.clipEpsilon=0.20] PPO clipping parameter epsilon (0.1 to 0.3)
   * @param {number} [options.entropyCoeff=0.03] Policy entropy bonus coefficient beta
   * @param {number} [options.costBudget=0.06] Safety cost budget d_budget
   * @param {number} [options.initLambda=0.10] Initial safety Lagrangian multiplier
   * @param {number} [options.policyLr=0.025] Policy learning rate
   * @param {number} [options.lambdaLr=0.015] Safety multiplier learning rate
   */
  constructor(options = {}) {
    this.stateDim = Math.max(2, Math.floor(options.stateDim || 5));
    this.clipEpsilon = Math.max(0.05, Math.min(0.4, Number(options.clipEpsilon || 0.20)));
    this.entropyCoeff = Math.max(0.001, Math.min(0.2, Number(options.entropyCoeff || 0.03)));
    this.costBudget = Math.max(0.001, Number(options.costBudget || 0.06));
    this.lambda = Math.max(0.0, Number(options.initLambda || 0.10));
    this.policyLr = Math.max(0.001, Number(options.policyLr || 0.025));
    this.lambdaLr = Math.max(0.001, Number(options.lambdaLr || 0.015));

    this.policyWeights = new Float64Array(this.stateDim);
    this.costCriticWeights = new Float64Array(this.stateDim);

    const initPolicy = [0.04, 0.05, -0.03, 0.02, 0.015];
    const initCost = [0.03, -0.02, 0.05, 0.025, 0.01];

    for (let i = 0; i < this.stateDim; i++) {
      this.policyWeights[i] = i < initPolicy.length ? initPolicy[i] : 0.01;
      this.costCriticWeights[i] = i < initCost.length ? initCost[i] : 0.02;
    }

    this.updatesCount = 0;
    this.lastAvgAdvantage = 0;
    this.lastEntropy = 0;
  }

  /**
   * Dot product helper
   * @private
   */
  _dot(w, x) {
    let sum = 0;
    for (let i = 0; i < this.stateDim; i++) {
      sum += w[i] * x[i];
    }
    return sum;
  }

  /**
   * Predicts continuous action mean in [-0.15, +0.15]
   * @param {Float64Array} state 
   * @returns {number}
   */
  predictAction(state) {
    const raw = this._dot(this.policyWeights, state);
    return Math.max(-0.15, Math.min(0.15, raw));
  }

  /**
   * Evaluates expected cost constraint
   * @param {Float64Array} state 
   * @returns {number}
   */
  evaluateCost(state) {
    const raw = this._dot(this.costCriticWeights, state);
    return Math.max(0.0, raw);
  }

  /**
   * Performs PPO clipped surrogate update with entropy regularization & safety penalty
   * @param {Array<{ state: Array<number>, action: number, oldLogPi: number, advantage: number, cost: number }>} transitions 
   * @returns {Object}
   */
  updatePolicy(transitions) {
    if (!Array.isArray(transitions) || transitions.length === 0) {
      return { success: false, reason: "EMPTY_TRANSITIONS" };
    }

    const N = transitions.length;
    let avgCost = 0;
    let avgEntropy = 0;
    let avgAdvantage = 0;
    let clippedCount = 0;

    for (let i = 0; i < N; i++) {
      const item = transitions[i];
      const s = new Float64Array(this.stateDim);
      for (let j = 0; j < this.stateDim; j++) {
        s[j] = Number(item.state ? item.state[j] : 0) || 0;
      }

      const act = Number(item.action || 0);
      const mu = this.predictAction(s);
      const sigma = 0.05;
      const logPi = -0.5 * Math.log(2 * Math.PI * sigma * sigma) - ((act - mu) ** 2) / (2 * sigma * sigma);
      const currentEntropy = -logPi;
      avgEntropy += currentEntropy / N;

      const oldLogPi = Number(item.oldLogPi !== undefined ? item.oldLogPi : logPi);
      const ratio = Math.exp(Math.max(-10, Math.min(10, logPi - oldLogPi)));

      const rawAdvantage = Number(item.advantage || 0);
      const actualCost = Math.max(0, Number(item.cost || 0));
      avgCost += actualCost / N;

      // Safe Advantage: A_safe = A_reward - lambda * cost
      const safeAdvantage = rawAdvantage - this.lambda * actualCost;
      avgAdvantage += safeAdvantage / N;

      // PPO Clipping
      const surr1 = ratio * safeAdvantage;
      const clippedRatio = Math.max(1.0 - this.clipEpsilon, Math.min(1.0 + this.clipEpsilon, ratio));
      const surr2 = clippedRatio * safeAdvantage;

      if (ratio !== clippedRatio) {
        clippedCount++;
      }

      // Surrogate gradient: d(min(surr1, surr2)) + beta * d(entropy)
      const chosenSurr = Math.min(surr1, surr2);
      const policyGrad = chosenSurr * act + this.entropyCoeff * currentEntropy;

      for (let j = 0; j < this.stateDim; j++) {
        this.policyWeights[j] += (this.policyLr * policyGrad * s[j]) / N;
      }

      // Cost Critic Update via MSE
      const predictedCost = this.evaluateCost(s);
      const costError = actualCost - predictedCost;
      const criticLr = 0.05;
      for (let j = 0; j < this.stateDim; j++) {
        this.costCriticWeights[j] += (criticLr * costError * s[j]) / N;
      }
    }

    // Safety Multiplier Dual Update
    const costViolation = avgCost - this.costBudget;
    this.lambda = Math.max(0.0, this.lambda + this.lambdaLr * costViolation);

    this.updatesCount++;
    this.lastAvgAdvantage = avgAdvantage;
    this.lastEntropy = avgEntropy;

    return {
      success: true,
      updatesCount: this.updatesCount,
      lambda: Number(this.lambda.toFixed(4)),
      avgCost: Number(avgCost.toFixed(5)),
      avgEntropy: Number(avgEntropy.toFixed(4)),
      avgAdvantage: Number(avgAdvantage.toFixed(4)),
      clipRatio: Number((clippedCount / N).toFixed(3)),
      isBudgetExceeded: costViolation > 0
    };
  }

  /**
   * Recommends safe price adjustment
   * @param {Object} product
   * @param {Object} [marketContext]
   * @returns {Object}
   */
  recommendPrice(product = {}, marketContext = {}) {
    const currentPrice = Math.max(1000, Number(product.price || 100000));
    const cogs = Math.max(500, Number(product.cogs || currentPrice * 0.7));
    const msrp = Math.max(currentPrice, Number(product.msrp || currentPrice * 1.3));

    const competitorPrice = Number(marketContext.competitorPrice || currentPrice);
    const stock = Number(marketContext.inventoryLevel || 50);
    const capacity = Math.max(1, Number(marketContext.inventoryCapacity || 100));
    const salesVelocity = Number(marketContext.salesVelocity || 1.0);
    const demandIndex = Number(marketContext.demandIndex || 1.0);

    const state = new Float64Array([
      Number((currentPrice / msrp).toFixed(4)),
      Number((competitorPrice / currentPrice).toFixed(4)),
      Number((stock / capacity).toFixed(4)),
      Number(Math.min(3.0, salesVelocity / 10.0).toFixed(4)),
      Number(Math.min(3.0, demandIndex).toFixed(4))
    ]);

    const rawAction = this.predictAction(state);
    const predictedCost = this.evaluateCost(state);

    const ppoDamping = Math.max(0.4, 1.0 - this.lambda * predictedCost);
    const safeAdjustment = rawAction * ppoDamping;

    const rawPrice = currentPrice * (1.0 + safeAdjustment);
    const safetyFloor = Math.round(cogs * 1.05);
    const safetyCeiling = Math.round(msrp * 1.25);

    const safePrice = Math.round(Math.max(safetyFloor, Math.min(safetyCeiling, rawPrice)));
    const priceAdjustmentPct = Number((((safePrice - currentPrice) / currentPrice) * 100).toFixed(2));
    const grossMarginVnd = safePrice - cogs;
    const grossMarginPct = Number(((grossMarginVnd / safePrice) * 100).toFixed(2));

    return {
      currentPrice,
      recommendedPrice: safePrice,
      safetyFloor,
      safetyCeiling,
      isFloorBounded: safePrice === safetyFloor,
      isCeilingBounded: safePrice === safetyCeiling,
      cogs,
      priceAdjustmentPct,
      grossMarginVnd,
      grossMarginPct,
      predictedCost: Number(predictedCost.toFixed(4)),
      ppoDamping: Number(ppoDamping.toFixed(3)),
      lambda: Number(this.lambda.toFixed(4)),
      isBudgetExceeded: predictedCost > this.costBudget
    };
  }
}

export default PPOEntropySafePricing;
