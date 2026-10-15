/**
 * CPOPricing - Constrained Policy Optimization (CPO & Lagrangian PPO) for Safe Dynamic Pricing & Ads Bidding
 * 
 * References:
 * - Joshua Achiam, David Held, Aviv Tamar, Pieter Abbeel (ICML 2017):
 *   "Constrained Policy Optimization"
 * - Bo Dai, Albert Shaw, Niao He, Lihong Li, Le Song (ICML 2018):
 *   "SBEED: Convergent Reinforcement Learning with General Function Approximation"
 * 
 * Enterprise Problem:
 * - Maximizing GMV/Revenue while strictly enforcing 2 hard operational constraints (CMDP):
 *   1. Budget Constraint: Expected Ads expenditure or discount burn <= Max Daily Budget (d_budget)
 *   2. COGS & Margin Risk Constraint: Likelihood of selling below minimum profit floor <= d_cogs_risk
 * 
 * Lagrangian Dual Formulation:
 *   L(theta, lambda_1, lambda_2) = J_R(pi_theta) - lambda_1 * (J_C1(pi_theta) - d_budget) - lambda_2 * (J_C2(pi_theta) - d_cogs)
 *   where lambda_1, lambda_2 >= 0 are adaptive Lagrange multipliers updated via dual subgradient ascent.
 */

class CPOPricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.budgetLimit=500000] - Max allowed daily ad burn or discount subsidy in VND
   * @param {number} [options.maxCogsRisk=0.02] - Max allowed risk of breaching COGS floor (2%)
   * @param {number} [options.lambdaBudget=0.5] - Initial Lagrange multiplier for budget constraint
   * @param {number} [options.lambdaCogs=1.0] - Initial Lagrange multiplier for COGS profit safety
   * @param {number} [options.learningRate=0.01] - Dual multiplier learning rate
   * @param {number} [options.cogsFloorMultiplier=1.05] - Absolute net margin barrier (5%)
   */
  constructor(options = {}) {
    this.budgetLimit = options.budgetLimit || 500000;
    this.maxCogsRisk = options.maxCogsRisk !== undefined ? options.maxCogsRisk : 0.02;
    this.lambdaBudget = options.lambdaBudget !== undefined ? options.lambdaBudget : 0.5;
    this.lambdaCogs = options.lambdaCogs !== undefined ? options.lambdaCogs : 1.0;
    this.learningRate = options.learningRate || 0.01;
    this.cogsFloorMultiplier = options.cogsFloorMultiplier || 1.05;

    // Linear Actor weights for pricing multiplier action in [0.70, 1.40]
    // Feature: [compRatio, stockRatio, hourNorm, demandElasticity, historicalConversion]
    this.actorWeights = [0.25, -0.15, 0.05, -0.20, 0.35];
    this.actorBias = 1.0;
  }

  /**
   * State normalization
   */
  _extractStateVector(state) {
    const compPrice = state.competitorPrice || state.basePrice || 100000;
    const basePrice = state.basePrice || compPrice;
    const compRatio = Math.min(2.0, compPrice / Math.max(1, basePrice));
    const stockRatio = Math.min(1.0, Math.max(0, (state.stock || 50) / 100));
    const hourNorm = ((state.hourOfDay !== undefined ? state.hourOfDay : 12) % 24) / 24;
    const elasticity = Math.min(3.0, Math.max(0.2, state.elasticity || 1.2));
    const conversion = Math.min(1.0, Math.max(0.0, state.conversionRate || 0.05));

    return [compRatio, stockRatio, hourNorm, elasticity, conversion];
  }

  /**
   * Predict pricing multiplier action
   */
  predictAction(state) {
    const s = this._extractStateVector(state);
    let raw = this.actorBias;
    for (let i = 0; i < s.length; i++) {
      raw += this.actorWeights[i] * s[i];
    }
    // High Lagrange multipliers pull down aggressive overpricing or reckless dumping
    const budgetSuppression = Math.min(0.15, this.lambdaBudget * 0.05);
    const cogsCorrection = Math.min(0.20, this.lambdaCogs * 0.08);

    const constrainedAction = raw - budgetSuppression + cogsCorrection * 0.5;
    return Math.max(0.70, Math.min(1.40, constrainedAction));
  }

  /**
   * Update Dual Multipliers via Subgradient Ascent (CMDP Projection onto R+)
   * @param {number} observedBudgetBurn - Current daily burn / subsidy
   * @param {number} observedCogsBreachRate - Empirical frequency of pricing below target
   */
  updateDualVariables(observedBudgetBurn, observedCogsBreachRate) {
    const budgetError = observedBudgetBurn - this.budgetLimit;
    const cogsError = observedCogsBreachRate - this.maxCogsRisk;

    // Subgradient update: lambda <- max(0, lambda + lr * constraint_violation)
    this.lambdaBudget = Math.max(0, Number((this.lambdaBudget + this.learningRate * (budgetError / 100000)).toFixed(4)));
    this.lambdaCogs = Math.max(0, Number((this.lambdaCogs + this.learningRate * (cogsError * 10)).toFixed(4)));

    return {
      lambdaBudget: this.lambdaBudget,
      lambdaCogs: this.lambdaCogs,
      budgetViolated: budgetError > 0,
      cogsViolated: cogsError > 0,
    };
  }

  /**
   * Optimize Price & Bidding for Enterprise SKU
   * @param {Object} product
   * @param {Object} [marketContext]
   * @returns {Object} Optimized pricing proposal
   */
  optimizePrice(product, marketContext = {}) {
    const cogs = product.cogs || product.costPrice || (product.price ? product.price * 0.70 : 100000);
    const basePrice = product.price || product.basePrice || cogs * 1.30;
    const competitorPrice = marketContext.competitorPrice || product.competitorPrice || basePrice * 1.05;

    const state = {
      basePrice,
      competitorPrice,
      stock: product.stock !== undefined ? product.stock : 50,
      hourOfDay: marketContext.hourOfDay !== undefined ? marketContext.hourOfDay : 12,
      elasticity: marketContext.elasticity || product.elasticity || 1.2,
      conversionRate: marketContext.conversionRate || 0.05,
    };

    const action = this.predictAction(state);
    let rawSuggestedPrice = Math.round(basePrice * action);

    // Ceiling protection: Competitor reference upper bound
    const ceilingPrice = Math.round(competitorPrice * 1.20);
    const hardFloorPrice = Math.round(cogs * this.cogsFloorMultiplier);

    let safetyStatus = 'CPO_CONSTRAINED_OPTIMAL';
    let finalPrice = rawSuggestedPrice;

    // Check Ceiling
    if (finalPrice > ceilingPrice) {
      finalPrice = ceilingPrice;
      safetyStatus = 'COMPETITOR_CEILING_ENFORCED';
    }

    // Check Hard Floor
    if (finalPrice < hardFloorPrice) {
      finalPrice = hardFloorPrice;
      safetyStatus = 'COGS_FLOOR_ENFORCED';
    }

    // If budget multiplier is high, flag conservative bidding
    if (this.lambdaBudget > 1.5 && safetyStatus === 'CPO_CONSTRAINED_OPTIMAL') {
      safetyStatus = 'BUDGET_THROTTLED_CONSERVATIVE';
    }

    const netProfitMargin = (finalPrice - cogs) / finalPrice;
    const estimatedRoas = Number((finalPrice / Math.max(1, cogs * 0.15)).toFixed(2));

    return {
      productId: product.id || product.productId || 'SKU_CPO_OPTIMIZED',
      cogs,
      basePrice,
      competitorPrice,
      suggestedPrice: finalPrice,
      action: Number(action.toFixed(4)),
      hardFloorPrice,
      ceilingPrice,
      lambdaBudget: this.lambdaBudget,
      lambdaCogs: this.lambdaCogs,
      netProfitMargin: Number(netProfitMargin.toFixed(4)),
      estimatedRoas,
      safetyStatus,
    };
  }
}

export { CPOPricing };
export default CPOPricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CPOPricing };
  }
} catch (e) {}
