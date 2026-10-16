/**
 * Reward Constrained Policy Optimization (RCPO) for Safe Dynamic Pricing
 * 
 * Based on foundational research:
 * - Chen Tessler, Daniel J. Mankowitz, Shie Mannor (ICLR 2019):
 *   "Reward Constrained Policy Optimization"
 * - Vivek S. Borkar (2008):
 *   "Stochastic Approximation: A Dynamical Systems Viewpoint"
 * 
 * Mathematical Foundations:
 * - In Constrained Markov Decision Processes (CMDP), we maximize expected return J_R(pi)
 *   subject to a safety cost constraint J_C(pi) <= d_budget.
 * - Standard Lagrangian relaxation updates (theta, lambda) on the same timescale, often causing
 *   unstable policy oscillations or constraint violations during training.
 * - RCPO utilizes a Multi-Timescale Stochastic Approximation scheme:
 *   - Fast timescale step size alpha_k updates the policy theta and value critics.
 *   - Slow timescale step size beta_k updates the penalty multiplier lambda.
 *   - Condition: lim_{k -> infty} (beta_k / alpha_k) = 0.
 * - Augmented reward formulation:
 *   r_aug(s, a) = r(s, a) - lambda * c(s, a)
 * - Dual multiplier update with projection:
 *   lambda_{k+1} = Gamma[ lambda_k + beta_k * (J_C(pi_k) - d_budget) ]
 *   where Gamma[x] = max(0, x) is the projection onto the non-negative orthant.
 * - Convergence Guarantee:
 *   Converges almost surely (a.s.) to a local saddle point of the Lagrangian satisfying constraints.
 * - Strict E-Commerce Safety Floor:
 *   Recommended price guaranteed >= 1.05 * COGS and bounded within safe elasticity limits.
 */

export class RCPOConstrainedPricing {
  /**
   * @param {Object} options
   * @param {number} [options.stateDim=5] State vector dimension
   * @param {number} [options.costBudget=0.06] Maximum allowable constraint violation cost d_budget
   * @param {number} [options.actorLr=0.03] Fast timescale learning rate alpha_k
   * @param {number} [options.lambdaLr=0.005] Slow timescale learning rate beta_k (beta_k << alpha_k)
   * @param {number} [options.initLambda=0.1] Initial Lagrange penalty multiplier
   */
  constructor(options = {}) {
    this.stateDim = Math.max(2, Math.floor(options.stateDim || 5));
    this.costBudget = Math.max(0.001, Number(options.costBudget || 0.06));
    this.actorLr = Math.max(0.001, Number(options.actorLr || 0.03));
    this.lambdaLr = Math.max(0.0001, Number(options.lambdaLr || 0.005));
    this.lambda = Math.max(0, Number(options.initLambda || 0.1));

    // Policy parameters theta in R^{stateDim}
    this.policyWeights = new Float64Array(this.stateDim);
    // Cost critic weights in R^{stateDim}
    this.costWeights = new Float64Array(this.stateDim);

    // Initial domain priors
    const initPolicy = [0.04, 0.06, -0.05, 0.03, 0.02];
    const initCost = [0.03, -0.02, 0.05, 0.01, 0.02];

    for (let i = 0; i < this.stateDim; i++) {
      this.policyWeights[i] = i < initPolicy.length ? initPolicy[i] : 0.01;
      this.costWeights[i] = i < initCost.length ? initCost[i] : 0.02;
    }

    this.updatesCount = 0;
    this.lastCost = 0;
    this.lastConstraintDelta = 0;
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
   * Predicts expected safety constraint cost J_C(s)
   * @param {Float64Array} state 
   * @returns {number} Non-negative cost
   */
  evaluateCost(state) {
    const rawCost = this._dot(this.costWeights, state);
    return Math.max(0.0, rawCost);
  }

  /**
   * Multi-timescale RCPO update step
   * @param {Array<{ state: Array<number>, action: number, reward: number, cost: number }>} batch
   * @returns {Object} Optimization metrics
   */
  updatePolicy(batch) {
    if (!Array.isArray(batch) || batch.length === 0) {
      return { success: false, reason: "EMPTY_BATCH" };
    }

    const N = batch.length;
    let avgReward = 0;
    let avgCost = 0;

    for (let i = 0; i < N; i++) {
      const item = batch[i];
      const s = new Float64Array(this.stateDim);
      for (let j = 0; j < this.stateDim; j++) {
        s[j] = Number(item.state ? item.state[j] : 0) || 0;
      }

      const predictedCost = this.evaluateCost(s);
      const actualCost = Math.max(0, Number(item.cost || 0));
      avgCost += actualCost / N;
      avgReward += Number(item.reward || 0) / N;

      // 1. Update cost critic via MSE loss
      const costError = actualCost - predictedCost;
      const criticLr = 0.05;
      for (let j = 0; j < this.stateDim; j++) {
        this.costWeights[j] += (criticLr * costError * s[j]) / N;
      }

      // 2. Fast timescale: Update actor policy with augmented reward
      // grad_theta = (reward - lambda * actualCost) * action * s
      const act = Number(item.action || 0);
      const augmentedReward = Number(item.reward || 0) - this.lambda * actualCost;
      const policyGrad = augmentedReward * act;

      for (let j = 0; j < this.stateDim; j++) {
        this.policyWeights[j] += (this.actorLr * policyGrad * s[j]) / N;
      }
    }

    // 3. Slow timescale: Update Lagrange multiplier lambda with projection onto [0, infty)
    const constraintDelta = avgCost - this.costBudget;
    this.lambda = Math.max(0, this.lambda + this.lambdaLr * constraintDelta);

    this.updatesCount++;
    this.lastCost = avgCost;
    this.lastConstraintDelta = constraintDelta;

    return {
      success: true,
      updatesCount: this.updatesCount,
      lambda: Number(this.lambda.toFixed(5)),
      avgCost: Number(avgCost.toFixed(5)),
      avgReward: Number(avgReward.toFixed(5)),
      constraintDelta: Number(constraintDelta.toFixed(5)),
      isBudgetExceeded: constraintDelta > 0
    };
  }

  /**
   * Safe dynamic price recommendation under RCPO constraints
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

    // Apply RCPO penalty dampening factor
    const rcpoDamping = Math.max(0.4, 1.0 - this.lambda * predictedCost);
    const safeAdjustment = rawAction * rcpoDamping;

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
      rcpoDamping: Number(rcpoDamping.toFixed(3)),
      lambda: Number(this.lambda.toFixed(4)),
      isBudgetExceeded: predictedCost > this.costBudget
    };
  }
}

export default RCPOConstrainedPricing;
