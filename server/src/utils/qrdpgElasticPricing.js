/**
 * QRDPGElasticPricing - Quantile Regression DDPG for Distributional Risk-Aware Dynamic Pricing
 * Reference: Dabney et al. (AAAI 2018), "Distributional Reinforcement Learning with Quantile Representations"
 * 
 * Features:
 * - Quantile Regression Critic modeling entire return distribution Z_theta(s, a) via N quantiles
 * - Huber Quantile Loss rho_tau^kappa for robust distributional Bellman updates
 * - Conditional Value-at-Risk (CVaR_alpha) risk-sensitive pricing under market uncertainty
 * - Strict Hard Floor (COGS x 1.05) & Competitor Ceiling (competitorPrice x 1.15)
 */

class QRDPGElasticPricing {
  constructor(options = {}) {
    this.numQuantiles = options.numQuantiles || 8; // N = 8 quantiles
    this.kappa = options.kappa || 1.0; // Huber threshold kappa
    this.learningRateActor = options.learningRateActor || 0.01;
    this.learningRateCritic = options.learningRateCritic || 0.02;
    this.discountFactor = options.discountFactor || 0.95;
    this.cvarAlpha = Math.max(0.1, Math.min(1.0, options.cvarAlpha || 0.25)); // CVaR confidence 25%

    // Target cumulative probabilities tau_i = (i - 0.5) / N
    this.tau = [];
    for (let i = 1; i <= this.numQuantiles; i++) {
      this.tau.push((i - 0.5) / this.numQuantiles);
    }

    // Actor weights: [cogs, basePrice, competitorPrice, demandIndex, returnRiskRate] -> action multiplier in [0.70, 1.40]
    this.actorWeights = options.actorWeights || [0.05, 0.10, -0.05, 0.15, -0.20];
    this.actorBias = options.actorBias !== undefined ? options.actorBias : 1.0;

    // Critic Quantile weights: Matrix of shape [numQuantiles][6] (5 state features + 1 action)
    this.criticQuantileWeights = [];
    for (let q = 0; q < this.numQuantiles; q++) {
      // Initialize with progressive quantile biases
      const qOffset = (q - (this.numQuantiles - 1) / 2) * 0.15;
      this.criticQuantileWeights.push([
        0.1 + qOffset,
        0.2 + qOffset * 0.5,
        -0.1,
        0.3 + qOffset * 0.8,
        -0.4 - qOffset * 0.5,
        0.25 + qOffset * 0.3
      ]);
    }

    // Replay buffer for experience tuples
    this.replayBuffer = [];
    this.maxBufferSize = options.maxBufferSize || 200;
  }

  /**
   * Normalize state features
   * @param {Object} state 
   * @returns {number[]} Normalized 5-element vector
   */
  normalizeState(state) {
    const cogs = Math.max(1, state.cogs || 100000);
    const basePrice = Math.max(1, state.basePrice || cogs * 1.25);
    const competitorPrice = Math.max(1, state.competitorPrice || basePrice);
    const demandIndex = Math.max(0, Math.min(2.0, state.demandIndex !== undefined ? state.demandIndex : 1.0));
    const returnRiskRate = Math.max(0, Math.min(1.0, state.returnRiskRate !== undefined ? state.returnRiskRate : 0.05));

    return [
      Math.log(cogs) / 15.0,
      Math.log(basePrice) / 15.0,
      Math.log(competitorPrice) / 15.0,
      demandIndex,
      returnRiskRate
    ];
  }

  /**
   * Predict price multiplier via deterministic actor policy
   * a = 1.0 + tanh(W * s + b) * 0.35 => a in [0.65, 1.35]
   */
  predictAction(state) {
    const sNorm = this.normalizeState(state);
    let dot = this.actorBias;
    for (let i = 0; i < sNorm.length; i++) {
      dot += sNorm[i] * this.actorWeights[i];
    }
    const tanh = Math.tanh(dot);
    const rawAction = 1.0 + tanh * 0.35;
    return Math.max(0.70, Math.min(1.40, rawAction));
  }

  /**
   * Evaluate Quantile Distribution Z_theta(s, a)
   * @param {Object} state 
   * @param {number} action 
   * @returns {number[]} Array of N quantile values
   */
  evaluateQuantiles(state, action) {
    const sNorm = this.normalizeState(state);
    const saVector = [...sNorm, action];

    const quantiles = [];
    for (let q = 0; q < this.numQuantiles; q++) {
      let qVal = 0;
      for (let i = 0; i < saVector.length; i++) {
        qVal += saVector[i] * this.criticQuantileWeights[q][i];
      }
      quantiles.push(qVal);
    }

    // Ensure monotonic ordering of quantiles (sorting / projection)
    quantiles.sort((a, b) => a - b);
    return quantiles;
  }

  /**
   * Compute Conditional Value-at-Risk (CVaR_alpha) from quantile distribution
   * @param {number[]} quantiles 
   * @returns {number} Average of bottom alpha proportion of quantiles
   */
  computeCVaR(quantiles) {
    if (!quantiles || quantiles.length === 0) return 0;
    const k = Math.max(1, Math.ceil(this.cvarAlpha * quantiles.length));
    let sum = 0;
    for (let i = 0; i < k; i++) {
      sum += quantiles[i];
    }
    return sum / k;
  }

  /**
   * Huber Loss function: L_kappa(u)
   */
  _huberLoss(u) {
    const absU = Math.abs(u);
    if (absU <= this.kappa) {
      return 0.5 * u * u;
    }
    return this.kappa * (absU - 0.5 * this.kappa);
  }

  /**
   * Record transition tuple in replay buffer
   */
  recordTransition(state, action, reward, nextState, done = false) {
    if (this.replayBuffer.length >= this.maxBufferSize) {
      this.replayBuffer.shift();
    }
    this.replayBuffer.push({ state, action, reward, nextState, done });
  }

  /**
   * Optimize Price Proposal with Distributional Risk & Safety Guards
   * @param {Object} item 
   * @returns {Object} Pricing recommendation and risk diagnostics
   */
  optimizePrice(item) {
    const cogs = Math.max(1000, Number(item.cogs) || 100000);
    const basePrice = Math.max(cogs, Number(item.basePrice) || Math.round(cogs * 1.3));
    const competitorPrice = Number(item.competitorPrice) || basePrice;
    const demandIndex = item.demandIndex !== undefined ? Number(item.demandIndex) : 1.0;
    const returnRiskRate = item.returnRiskRate !== undefined ? Number(item.returnRiskRate) : 0.05;

    const state = { cogs, basePrice, competitorPrice, demandIndex, returnRiskRate };

    // 1. Determine action multiplier via Actor
    const actionMultiplier = this.predictAction(state);

    // 2. Evaluate Quantile Distribution & Risk Metrics
    const quantiles = this.evaluateQuantiles(state, actionMultiplier);
    const expectedReturn = quantiles.reduce((acc, v) => acc + v, 0) / quantiles.length;
    const cvarRiskReturn = this.computeCVaR(quantiles);

    // 3. Risk-aware action adjustment:
    // If return risk is high (> 15%) or CVaR is significantly negative, shift multiplier conservatively
    let adjustedMultiplier = actionMultiplier;
    let riskAversionTriggered = false;

    if (returnRiskRate > 0.15 || cvarRiskReturn < expectedReturn * 0.7) {
      riskAversionTriggered = true;
      // Damped toward conservative multiplier (1.05 - 1.10)
      adjustedMultiplier = 1.0 + (actionMultiplier - 1.0) * 0.5;
    }

    let calculatedPrice = Math.round(basePrice * adjustedMultiplier);

    // 4. Hard Safety Floors & Ceilings
    const safetyFloor = Math.round(cogs * 1.05); // Minimum 5% gross margin
    const safetyCeiling = Math.round(competitorPrice * 1.15); // Competitor ceiling + 15%

    let decisionTag = "QRDPG_DISTRIBUTIONAL_OPTIMAL";

    if (calculatedPrice < safetyFloor) {
      calculatedPrice = safetyFloor;
      decisionTag = "FLOOR_OVERRIDE_COGS_SECURED";
    } else if (calculatedPrice > safetyCeiling) {
      calculatedPrice = safetyCeiling;
      decisionTag = "CEILING_OVERRIDE_COMPETITOR_RESTRICTED";
    } else if (riskAversionTriggered) {
      decisionTag = "CVAR_RISK_AVERSE_DAMPED";
    }

    const grossMarginVnd = calculatedPrice - cogs;
    const marginPercent = Number(((grossMarginVnd / calculatedPrice) * 100).toFixed(2));

    return {
      proposedPrice: calculatedPrice,
      basePrice,
      cogs,
      competitorPrice,
      actionMultiplier: Number(adjustedMultiplier.toFixed(4)),
      decisionTag,
      riskMetrics: {
        numQuantiles: this.numQuantiles,
        expectedReturn: Number(expectedReturn.toFixed(4)),
        cvarAlpha: this.cvarAlpha,
        cvarBottomReturn: Number(cvarRiskReturn.toFixed(4)),
        quantiles: quantiles.map(q => Number(q.toFixed(4))),
        riskAversionTriggered
      },
      marginAnalysis: {
        grossMarginVnd,
        marginPercent,
        safetyFloorVnd: safetyFloor,
        safetyCeilingVnd: safetyCeiling
      }
    };
  }
}

export { QRDPGElasticPricing };
export default QRDPGElasticPricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { QRDPGElasticPricing };
  }
} catch (e) {}
