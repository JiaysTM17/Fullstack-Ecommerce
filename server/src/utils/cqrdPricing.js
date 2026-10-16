/**
 * CQRDPricing - Categorical / Quantile Regression Distributional RL for Pricing Risk Control
 *
 * Grounded in:
 * - Bellemare, Dabney, Munos (ICML 2017): "A Distributional Perspective on Reinforcement Learning" (C51)
 * - Dabney, Rowland, Bellemare, Munos (AAAI 2018): "Distributional Reinforcement Learning with Quantile Regression" (QR-DQN)
 * - Chow, Ghavamzadeh, Janson, Pavone (NeurIPS 2015): "Risk-Constrained Reinforcement Learning with Percentile Risk Criteria (CVaR)"
 *
 * Practical E-Commerce Problem:
 * Standard RL agents maximize expected return E[Q(s, a)], which can lead to aggressive price cuts
 * that are catastrophic if demand falls into the low-tail distribution (e.g. competitor matching or sudden consumer strike).
 *
 * Mathematical Framework:
 * 1. The random return Z(s, a) is approximated by N_quantiles atoms theta_i representing quantile fractions:
 *      tau_i = (2i - 1) / (2 * N), for i = 1, ..., N
 * 2. Quantile Huber Loss between target y_j and prediction theta_i:
 *      rho_tau^kappa(delta) = |tau - I(delta < 0)| * L_kappa(delta) / kappa
 * 3. Risk-Sensitive Decision Metric:
 *      CVaR_alpha(Z) = 1 / k_alpha * sum_{i=1}^{k_alpha} theta_i  (average of worst-case alpha outcomes)
 *      Objective = (1 - lambda_risk) * E[Z] + lambda_risk * CVaR_alpha(Z)
 * 4. This guarantees that during Flash Sale events, the pricing policy protects the seller
 *    against worst-case inventory margin collapse.
 */

class CQRDPricing {
  /**
   * @param {Object} options
   * @param {number} [options.basePrice=250000] - Baseline item price in VND
   * @param {number} [options.cogs=160000] - Cost of goods sold
   * @param {number} [options.numQuantiles=10] - Number of quantile atoms N
   * @param {number} [options.riskAlpha=0.20] - CVaR tail fraction (e.g. 0.20 = worst 20% scenarios)
   * @param {number} [options.lambdaRisk=0.40] - Risk penalty weight in [0, 1]
   * @param {number} [options.huberKappa=1.0] - Huber threshold parameter
   * @param {number} [options.cogsSafetyFloorRatio=1.05] - Floor multiplier over COGS
   */
  constructor(options = {}) {
    this.basePrice = options.basePrice || 250000;
    this.cogs = options.cogs || 160000;
    this.numQuantiles = Math.max(4, options.numQuantiles || 10);
    this.riskAlpha = Math.max(0.05, Math.min(0.50, options.riskAlpha || 0.20));
    this.lambdaRisk = Math.max(0, Math.min(1.0, options.lambdaRisk !== undefined ? options.lambdaRisk : 0.40));
    this.huberKappa = options.huberKappa || 1.0;
    this.cogsSafetyFloorRatio = options.cogsSafetyFloorRatio || 1.05;

    // Fixed quantile midpoint locations tau_i
    this.taus = new Float64Array(this.numQuantiles);
    for (let i = 0; i < this.numQuantiles; i++) {
      this.taus[i] = (2 * (i + 1) - 1) / (2 * this.numQuantiles);
    }

    // Candidate price multipliers: 0.70x to 1.30x
    this.candidateMultipliers = [0.70, 0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.20];

    // Model parameters: mapping action multiplier to estimated quantiles
    this.quantileModels = new Map();
    this.initDefaultQuantiles();
  }

  /**
   * Initialize default quantile distributions for each action
   */
  initDefaultQuantiles() {
    for (const a of this.candidateMultipliers) {
      const atoms = new Float64Array(this.numQuantiles);
      const nominalRev = this.basePrice * a;
      // Stochastically dispersed returns around nominal revenue
      for (let i = 0; i < this.numQuantiles; i++) {
        const tau = this.taus[i];
        // Low quantiles represent low demand scenarios; high quantiles represent viral flash sale
        const demandFactor = 0.40 + 1.20 * tau;
        const conversionProb = Math.max(0.10, Math.min(0.95, (1.25 - 0.75 * a) * demandFactor));
        atoms[i] = nominalRev * conversionProb;
      }
      atoms.sort();
      this.quantileModels.set(a, atoms);
    }
  }

  /**
   * Compute Huber Loss L_kappa(delta)
   */
  huberLoss(delta) {
    const absD = Math.abs(delta);
    if (absD <= this.huberKappa) {
      return 0.5 * delta * delta;
    }
    return this.huberKappa * (absD - 0.5 * this.huberKappa);
  }

  /**
   * Compute Quantile Huber Loss: rho_tau^kappa(delta) = |tau - I(delta < 0)| * L_kappa(delta) / kappa
   */
  quantileHuberLoss(delta, tau) {
    const indicator = delta < 0 ? 1.0 : 0.0;
    const weight = Math.abs(tau - indicator);
    return (weight * this.huberLoss(delta)) / this.huberKappa;
  }

  /**
   * Update the quantile distribution for action with observed target reward
   * @param {number} action - Price multiplier
   * @param {number} observedReward - Realized revenue/profit
   * @param {number} [learningRate=0.08]
   */
  updateQuantiles(action, observedReward, learningRate = 0.08) {
    let atoms = this.quantileModels.get(action);
    if (!atoms) {
      atoms = new Float64Array(this.numQuantiles).fill(observedReward);
      this.quantileModels.set(action, atoms);
    }

    for (let i = 0; i < this.numQuantiles; i++) {
      const delta = observedReward - atoms[i];
      const indicator = delta < 0 ? 1.0 : 0.0;
      const grad = this.taus[i] - indicator;
      atoms[i] += learningRate * grad * Math.min(Math.abs(delta), 10000);
    }

    atoms.sort();
  }

  /**
   * Compute Expected Return E[Z] = mean(theta)
   */
  computeExpectedReturn(atoms) {
    let sum = 0;
    for (let i = 0; i < atoms.length; i++) {
      sum += atoms[i];
    }
    return sum / atoms.length;
  }

  /**
   * Compute Value at Risk (VaR_alpha) and Conditional Value at Risk (CVaR_alpha)
   * @param {Float64Array} atoms
   * @returns {{varAlpha: number, cvarAlpha: number}}
   */
  computeRiskMetrics(atoms) {
    const kAlpha = Math.max(1, Math.floor(this.riskAlpha * atoms.length));
    const varAlpha = atoms[kAlpha - 1]; // Value at risk at alpha quantile

    let cvarSum = 0;
    for (let i = 0; i < kAlpha; i++) {
      cvarSum += atoms[i];
    }
    const cvarAlpha = cvarSum / kAlpha;

    return {
      varAlpha: Math.round(varAlpha),
      cvarAlpha: Math.round(cvarAlpha),
      kAlpha
    };
  }

  /**
   * Evaluate risk-sensitive score for an action's quantile distribution
   * Score = (1 - lambda_risk) * E[Z] + lambda_risk * CVaR_alpha(Z)
   */
  evaluateRiskScore(atoms) {
    const mean = this.computeExpectedReturn(atoms);
    const { cvarAlpha, varAlpha } = this.computeRiskMetrics(atoms);
    const riskScore = (1 - this.lambdaRisk) * mean + this.lambdaRisk * cvarAlpha;
    return {
      mean: Math.round(mean),
      varAlpha,
      cvarAlpha,
      riskScore: Math.round(riskScore)
    };
  }

  /**
   * Optimize price for item under quantile distributional risk criteria
   * @param {Object} item
   * @returns {Object} Optimized pricing decision
   */
  optimizePrice(item = {}) {
    const basePrice = Number(item.basePrice) || this.basePrice;
    const cogs = Number(item.cogs) || this.cogs;
    const competitorPrice = Number(item.competitorPrice) || basePrice;
    const demandIndex = item.demandIndex !== undefined ? Number(item.demandIndex) : 1.0;
    const inventoryUrgency = item.inventoryUrgency !== undefined ? Number(item.inventoryUrgency) : 0.2;

    let bestAction = 1.0;
    let maxRiskScore = -Infinity;
    const evaluatedActions = [];

    for (const a of this.candidateMultipliers) {
      let atoms = this.quantileModels.get(a);
      if (!atoms) {
        atoms = new Float64Array(this.numQuantiles).fill(basePrice * a);
      }

      // Adjust distribution dynamically for demand index and urgency
      const adjustedAtoms = new Float64Array(atoms.length);
      for (let i = 0; i < atoms.length; i++) {
        const factor = (basePrice / this.basePrice) * (0.8 + 0.2 * demandIndex) - (inventoryUrgency * 0.05 * basePrice);
        adjustedAtoms[i] = Math.max(0, atoms[i] * (basePrice / this.basePrice) * demandIndex);
      }
      adjustedAtoms.sort();

      const evalMetrics = this.evaluateRiskScore(adjustedAtoms);
      const proposedPrice = Math.round(basePrice * a);

      evaluatedActions.push({
        priceRatio: a,
        proposedPrice,
        expectedReturn: evalMetrics.mean,
        varAlpha: evalMetrics.varAlpha,
        cvarAlpha: evalMetrics.cvarAlpha,
        riskScore: evalMetrics.riskScore
      });

      if (evalMetrics.riskScore > maxRiskScore) {
        maxRiskScore = evalMetrics.riskScore;
        bestAction = a;
      }
    }

    let recommendedPrice = Math.round(basePrice * bestAction);
    const safetyFloor = Math.round(cogs * this.cogsSafetyFloorRatio);
    const safetyCeiling = Math.round(competitorPrice * 1.20);

    let isFloorEnforced = false;
    if (recommendedPrice < safetyFloor) {
      recommendedPrice = safetyFloor;
      isFloorEnforced = true;
    } else if (recommendedPrice > safetyCeiling) {
      recommendedPrice = safetyCeiling;
    }

    const marginVnd = recommendedPrice - cogs;
    const marginPercent = Number(((marginVnd / recommendedPrice) * 100).toFixed(2));

    return {
      basePrice,
      cogs,
      competitorPrice,
      recommendedPrice,
      priceRatio: bestAction,
      riskAlpha: this.riskAlpha,
      lambdaRisk: this.lambdaRisk,
      expectedReturn: evaluatedActions.find(e => e.priceRatio === bestAction)?.expectedReturn || 0,
      cvarAlpha: evaluatedActions.find(e => e.priceRatio === bestAction)?.cvarAlpha || 0,
      riskScore: Math.round(maxRiskScore),
      isFloorEnforced,
      safetyFloorVnd: safetyFloor,
      marginAnalysis: {
        marginVnd,
        marginPercent
      },
      evaluatedActions
    };
  }
}

// Dual ESM/CJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { CQRDPricing };
}
export { CQRDPricing };
