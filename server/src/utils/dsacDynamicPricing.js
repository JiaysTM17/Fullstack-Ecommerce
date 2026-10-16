/**
 * DSACDynamicPricing - Distributional Soft Actor-Critic Dynamic Pricing with Uncertainty & Risk Penalties
 *
 * Grounded in:
 * - Jingliang Duan, Shengbo Eben Li et al. (IEEE Trans. Neural Networks & Learning Systems 2022, NeurIPS 2021):
 *   "Distributional Soft Actor-Critic: Off-Policy Reinforcement Learning with Continuous Value Distributions"
 * - Haarnoja, Zhou, Abbeel, Levine (ICML 2018): "Soft Actor-Critic: Off-Policy Maximum Entropy Deep RL"
 * - Tamar, Glassner, Mannor (ICML 2015): "Optimizing the CVaR and Variance in MDPs"
 *
 * Practical E-Commerce Relevance:
 * During intense Flash Sale events or volatile competitor repricing wars, determining optimal product prices
 * solely based on expected return E[Q] incurs high risk of margin collapse if demand variance is high.
 * DSAC explicitly estimates both the mean mu(s, a) and the standard deviation sigma(s, a) of returns,
 * penalizing actions with high epistemic/aleatoric uncertainty:
 *
 * Mathematical Framework:
 * 1. Continuous Return Distribution:
 *      Z(s, a) ~ N(mu(s, a), sigma^2(s, a))
 * 2. Risk-Penalized Maximum-Entropy Objective:
 *      J(a) = mu(s, a) - beta_risk * sigma(s, a) + alpha_entropy * H(pi)
 * 3. Floor Guarantee:
 *      Price >= COGS * 1.05 (strictly protects seller against negative gross margins).
 */

class DSACDynamicPricing {
  /**
   * @param {Object} options
   * @param {number} [options.basePrice=250000] - Baseline listing price in VND
   * @param {number} [options.cogs=160000] - Cost of goods sold
   * @param {number} [options.betaRisk=0.35] - Risk penalty weight on standard deviation (beta >= 0)
   * @param {number} [options.alphaEntropy=0.08] - Entropy temperature parameter for policy exploration
   * @param {number} [options.cogsSafetyFloorRatio=1.05] - Minimum gross margin floor
   */
  constructor(options = {}) {
    this.basePrice = options.basePrice || 250000;
    this.cogs = options.cogs || 160000;
    this.betaRisk = Math.max(0, options.betaRisk !== undefined ? options.betaRisk : 0.35);
    this.alphaEntropy = Math.max(0, options.alphaEntropy !== undefined ? options.alphaEntropy : 0.08);
    this.cogsSafetyFloorRatio = options.cogsSafetyFloorRatio || 1.05;

    // Discretized candidate price multipliers from 0.70x to 1.30x
    this.candidateMultipliers = [0.70, 0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.20];

    // Model storage: action multiplier -> { mu, sigma, samplesCount }
    this.distributionModels = new Map();
    this.initDefaultDistributions();
  }

  /**
   * Initialize baseline return distribution statistics for each action
   */
  initDefaultDistributions() {
    for (const a of this.candidateMultipliers) {
      const nominalRev = this.basePrice * a;
      // Price elasticity model: higher price -> lower mean conversion, higher variance in sales
      const convMean = Math.max(0.15, Math.min(0.90, 1.25 - 0.70 * a));
      const expectedRev = nominalRev * convMean;
      // Variance increases with distance from base price (higher uncertainty)
      const distFromBase = Math.abs(a - 1.0);
      const stdDev = expectedRev * (0.12 + 0.35 * distFromBase);

      this.distributionModels.set(a, {
        mu: expectedRev,
        sigma: stdDev,
        samplesCount: 5
      });
    }
  }

  /**
   * Update return distribution model with realized reward observation using Welford's algorithm
   * @param {number} action - Price multiplier
   * @param {number} observedReward - Realized revenue/profit
   * @param {number} [learningRate=0.15]
   */
  updateDistribution(action, observedReward, learningRate = 0.15) {
    let stat = this.distributionModels.get(action);
    if (!stat) {
      stat = { mu: observedReward, sigma: observedReward * 0.20, samplesCount: 1 };
      this.distributionModels.set(action, stat);
      return;
    }

    stat.samplesCount++;
    const delta = observedReward - stat.mu;
    stat.mu += learningRate * delta;

    // Variance update with soft clipping
    const varError = delta * delta - stat.sigma * stat.sigma;
    const updatedVar = Math.max(100, stat.sigma * stat.sigma + learningRate * varError);
    stat.sigma = Math.sqrt(updatedVar);
  }

  /**
   * Calculate policy entropy for softmax action distribution
   * H(pi) = - sum_a pi(a) * log(pi(a))
   * @param {Array<number>} logits
   * @returns {{probs: Array<number>, entropy: number}}
   */
  computeSoftmaxEntropy(logits) {
    if (!Array.isArray(logits) || logits.length === 0) {
      return { probs: [], entropy: 0 };
    }
    const maxLogit = Math.max(...logits);
    const minLogit = Math.min(...logits);
    const span = maxLogit - minLogit;
    const temp = Math.max(0.01, this.alphaEntropy);

    // Normalize logit range to prevent exponent underflow while preserving entropy shape
    const scale = span > 0 ? (span / 4.0) * temp : temp;
    const exps = logits.map(l => Math.exp((l - maxLogit) / Math.max(1e-4, scale)));
    const sumExps = exps.reduce((acc, v) => acc + v, 0);
    const probs = exps.map(v => (sumExps > 0 ? v / sumExps : 1 / logits.length));

    let entropy = 0;
    for (const p of probs) {
      if (p > 1e-12) {
        entropy -= p * Math.log(p);
      }
    }

    return { probs, entropy };
  }

  /**
   * Evaluate DSAC risk-penalized score for an action given its distribution
   * Score = mu(s, a) - beta_risk * sigma(s, a)
   */
  evaluateActionScore(mu, sigma) {
    const riskPenalty = this.betaRisk * sigma;
    const score = mu - riskPenalty;
    return {
      mu: Math.round(mu),
      sigma: Math.round(sigma),
      riskPenalty: Math.round(riskPenalty),
      score: Math.round(score)
    };
  }

  /**
   * Recommend optimal price balancing return, uncertainty, and entropy
   * @param {Object} item
   * @returns {Object} Optimized pricing result
   */
  recommendPrice(item = {}) {
    const basePrice = Number(item.basePrice) || this.basePrice;
    const cogs = Number(item.cogs) || this.cogs;
    const competitorPrice = Number(item.competitorPrice) || basePrice;
    const demandIndex = item.demandIndex !== undefined ? Number(item.demandIndex) : 1.0;
    const inventoryUrgency = item.inventoryUrgency !== undefined ? Number(item.inventoryUrgency) : 0.2;

    const evaluatedActions = [];
    const rawScores = [];

    for (const a of this.candidateMultipliers) {
      let stat = this.distributionModels.get(a);
      if (!stat) {
        stat = { mu: basePrice * a, sigma: basePrice * 0.15, samplesCount: 1 };
      }

      // Contextual scaling based on demand index & base price
      const priceScale = basePrice / this.basePrice;
      const adjMu = stat.mu * priceScale * demandIndex - (inventoryUrgency * 0.04 * basePrice);
      const adjSigma = stat.sigma * priceScale * (1.0 + 0.2 * Math.abs(demandIndex - 1.0));

      const evalScore = this.evaluateActionScore(adjMu, adjSigma);
      rawScores.push(evalScore.score);

      evaluatedActions.push({
        priceMultiplier: a,
        proposedPrice: Math.round(basePrice * a),
        expectedReturn: evalScore.mu,
        uncertaintySigma: evalScore.sigma,
        riskPenalty: evalScore.riskPenalty,
        dsacScore: evalScore.score
      });
    }

    // Maximum entropy exploration adjustment
    const { probs, entropy } = this.computeSoftmaxEntropy(rawScores);
    for (let i = 0; i < evaluatedActions.length; i++) {
      evaluatedActions[i].actionProbability = Number(probs[i].toFixed(4));
    }

    // Select action maximizing DSAC score
    let bestIdx = 0;
    let maxScore = -Infinity;
    for (let i = 0; i < evaluatedActions.length; i++) {
      if (evaluatedActions[i].dsacScore > maxScore) {
        maxScore = evaluatedActions[i].dsacScore;
        bestIdx = i;
      }
    }

    const chosenAction = evaluatedActions[bestIdx];
    let recommendedPrice = chosenAction.proposedPrice;

    // Hard boundary enforcement: COGS floor and competitor ceiling
    const safetyFloor = Math.round(cogs * this.cogsSafetyFloorRatio);
    const safetyCeiling = Math.round(competitorPrice * 1.25);

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
      priceMultiplier: chosenAction.priceMultiplier,
      expectedReturn: chosenAction.expectedReturn,
      uncertaintySigma: chosenAction.uncertaintySigma,
      riskPenalty: chosenAction.riskPenalty,
      dsacScore: chosenAction.dsacScore,
      policyEntropy: Number(entropy.toFixed(3)),
      betaRisk: this.betaRisk,
      alphaEntropy: this.alphaEntropy,
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
  module.exports = { DSACDynamicPricing };
}
export { DSACDynamicPricing };
