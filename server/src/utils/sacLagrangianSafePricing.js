/**
 * Soft Actor-Critic with Adaptive Entropy & Lagrangian Safety Constraints (SAC-Lagrangian)
 * 
 * Based on foundational research:
 * - Tuomas Haarnoja, Aurick Zhou, Pieter Abbeel, Sergey Levine (ICML 2018):
 *   "Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor"
 * - Alex Ray, Joshua Achiam, Dario Amodei (OpenAI Safety Starter Kit 2019):
 *   "Benchmarking Safe Exploration in Deep Reinforcement Learning"
 * 
 * Mathematical Foundations:
 * - In E-Commerce dynamic pricing, balancing exploratory discovery of consumer price elasticity
 *   while avoiding margin-destroying price plunges requires simultaneous:
 *   1. Maximum Entropy exploration: H(pi(.|s)) prevents policy from prematurely collapsing to sub-optimal local peaks.
 *   2. Dual safety constraint satisfaction: J_C(pi) <= d_budget protects profitability.
 * - Unified Lagrangian Soft Objective:
 *   J(pi) = E_{(s, a) ~ rho_pi} [ Q_R(s, a) + alpha * H(pi(.|s)) - lambda * (Q_C(s, a) - d_budget) ]
 * - Dual Multiplier Dynamics:
 *   - Adaptive Entropy Temperature alpha:
 *     alpha <- max(alpha_min, alpha - lr_alpha * (log_pi + target_entropy))
 *     with target_entropy = -dim(A) = -1.0.
 *   - Adaptive Safety Multiplier lambda:
 *     lambda <- max(0, lambda + lr_lambda * (cost - d_budget))
 * - E-Commerce Safety Guarantees:
 *   - The policy dynamically dampens price volatility: damping = max(0.4, 1.0 - lambda * cost).
 *   - Strict COGS Floor: safePrice guaranteed >= 1.05 * COGS.
 */

export class SACLagrangianSafePricing {
  /**
   * @param {Object} options
   * @param {number} [options.stateDim=5] State vector dimension
   * @param {number} [options.costBudget=0.07] Safety cost budget d_budget
   * @param {number} [options.initAlpha=0.2] Initial entropy temperature alpha
   * @param {number} [options.initLambda=0.1] Initial safety multiplier lambda
   * @param {number} [options.targetEntropy=-1.0] Target entropy H_target = -dim(A)
   * @param {number} [options.alphaLr=0.02] Learning rate for temperature alpha
   * @param {number} [options.lambdaLr=0.015] Learning rate for safety multiplier lambda
   * @param {number} [options.actorLr=0.03] Actor policy learning rate
   */
  constructor(options = {}) {
    this.stateDim = Math.max(2, Math.floor(options.stateDim || 5));
    this.costBudget = Math.max(0.001, Number(options.costBudget || 0.07));
    this.alpha = Math.max(0.01, Number(options.initAlpha || 0.2));
    this.lambda = Math.max(0.0, Number(options.initLambda || 0.1));
    this.targetEntropy = Number(options.targetEntropy !== undefined ? options.targetEntropy : -1.0);
    this.alphaLr = Math.max(0.001, Number(options.alphaLr || 0.02));
    this.lambdaLr = Math.max(0.001, Number(options.lambdaLr || 0.015));
    this.actorLr = Math.max(0.001, Number(options.actorLr || 0.03));

    // Policy parameters theta
    this.policyWeights = new Float64Array(this.stateDim);
    // Cost critic weights
    this.costWeights = new Float64Array(this.stateDim);

    // Initial domain priors
    const initPolicy = [0.035, 0.065, -0.045, 0.025, 0.02];
    const initCost = [0.04, -0.03, 0.06, 0.02, 0.015];

    for (let i = 0; i < this.stateDim; i++) {
      this.policyWeights[i] = i < initPolicy.length ? initPolicy[i] : 0.01;
      this.costWeights[i] = i < initCost.length ? initCost[i] : 0.02;
    }

    this.updatesCount = 0;
    this.lastCost = 0;
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
   * Predicts continuous action delta in [-0.15, +0.15]
   * @param {Float64Array} state 
   * @returns {number}
   */
  predictAction(state) {
    const rawAction = this._dot(this.policyWeights, state);
    return Math.max(-0.15, Math.min(0.15, rawAction));
  }

  /**
   * Evaluates expected cost constraint
   * @param {Float64Array} state 
   * @returns {number}
   */
  evaluateCost(state) {
    const rawCost = this._dot(this.costWeights, state);
    return Math.max(0.0, rawCost);
  }

  /**
   * Performs dual updates on Actor, Cost Critic, Alpha, and Lambda
   * @param {Array<{ state: Array<number>, action: number, reward: number, cost: number }>} batch 
   * @returns {Object}
   */
  updatePolicy(batch) {
    if (!Array.isArray(batch) || batch.length === 0) {
      return { success: false, reason: "EMPTY_BATCH" };
    }

    const N = batch.length;
    let avgCost = 0;
    let avgEntropy = 0;

    for (let i = 0; i < N; i++) {
      const item = batch[i];
      const s = new Float64Array(this.stateDim);
      for (let j = 0; j < this.stateDim; j++) {
        s[j] = Number(item.state ? item.state[j] : 0) || 0;
      }

      const predictedCost = this.evaluateCost(s);
      const actualCost = Math.max(0, Number(item.cost || 0));
      avgCost += actualCost / N;

      // Estimate log probability of action under Gaussian policy
      const act = Number(item.action || 0);
      const mu = this.predictAction(s);
      const sigma = 0.05;
      const logPi = -0.5 * Math.log(2 * Math.PI * sigma * sigma) - ((act - mu) ** 2) / (2 * sigma * sigma);
      const currentEntropy = -logPi;
      avgEntropy += currentEntropy / N;

      // 1. Update Cost Critic via MSE
      const costError = actualCost - predictedCost;
      const criticLr = 0.05;
      for (let j = 0; j < this.stateDim; j++) {
        this.costWeights[j] += (criticLr * costError * s[j]) / N;
      }

      // 2. Update Actor policy: grad_theta [ Q_R + alpha * H - lambda * Q_C ]
      const reward = Number(item.reward || 0);
      const softLagrangianReward = reward + this.alpha * currentEntropy - this.lambda * actualCost;
      const policyGrad = softLagrangianReward * act;

      for (let j = 0; j < this.stateDim; j++) {
        this.policyWeights[j] += (this.actorLr * policyGrad * s[j]) / N;
      }

      // 3. Update temperature alpha: alpha <- alpha - lr_alpha * (logPi + targetEntropy)
      const alphaGrad = -(logPi + this.targetEntropy);
      this.alpha = Math.max(0.01, this.alpha - (this.alphaLr * alphaGrad) / N);
    }

    // 4. Update safety multiplier lambda: lambda <- max(0, lambda + lr_lambda * (avgCost - costBudget))
    const costViolation = avgCost - this.costBudget;
    this.lambda = Math.max(0.0, this.lambda + this.lambdaLr * costViolation);

    this.updatesCount++;
    this.lastCost = avgCost;
    this.lastEntropy = avgEntropy;

    return {
      success: true,
      updatesCount: this.updatesCount,
      alpha: Number(this.alpha.toFixed(4)),
      lambda: Number(this.lambda.toFixed(4)),
      avgCost: Number(avgCost.toFixed(5)),
      avgEntropy: Number(avgEntropy.toFixed(4)),
      costViolation: Number(costViolation.toFixed(5)),
      isBudgetExceeded: costViolation > 0
    };
  }

  /**
   * Safe dynamic price recommendation under SAC-Lagrangian constraints
   * @param {Object} product
   * @param {number} product.price Current price
   * @param {number} product.cogs Cost of Goods Sold
   * @param {number} [product.msrp]
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

    // Apply Lagrangian safety penalty damping
    const sacDamping = Math.max(0.4, 1.0 - this.lambda * predictedCost);
    const safeAdjustment = rawAction * sacDamping;

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
      sacDamping: Number(sacDamping.toFixed(3)),
      alpha: Number(this.alpha.toFixed(4)),
      lambda: Number(this.lambda.toFixed(4)),
      isBudgetExceeded: predictedCost > this.costBudget
    };
  }
}

export default SACLagrangianSafePricing;
