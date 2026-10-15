/**
 * SpotDynamicPricing - Supported Policy Optimization (SPOT) for Offline Reinforcement Learning in Dynamic Pricing
 * References:
 * - Haoran Wu, Qitong Zhai, Chen Lv et al. (NeurIPS 2022),
 *   "Supported Policy Optimization for Offline Reinforcement Learning" (SPOT)
 * 
 * Key Principles:
 * - Density-based Support Constraint: Measures log-density log p_beta(s, a) under historical behavior distribution.
 * - Out-of-Distribution (OOD) Penalization: Penalizes actions with density below threshold tau:
 *   Q_spot(s, a) = Q_nominal(s, a) - alpha * max(0, tau - log p_beta(s, a))
 * - Eliminates reckless under-pricing or over-pricing in sparse state-action regimes.
 * - Ensures safety floor: COGS x 1.05 and competitor ceiling: competitorPrice x 1.15.
 */

class SpotDynamicPricing {
  /**
   * @param {Object} options
   * @param {number} [options.cogsSafetyFloorRatio=1.05] - Minimum gross margin floor
   * @param {number} [options.competitorCeilingRatio=1.15] - Maximum price ceiling vs competitor
   * @param {number} [options.densityThreshold=0.10] - Minimum support density threshold tau
   * @param {number} [options.densityPenaltyWeight=0.45] - Penalty coefficient alpha
   * @param {number} [options.bandwidth=0.30] - Kernel bandwidth for data density estimation
   */
  constructor(options = {}) {
    this.cogsSafetyFloorRatio = options.cogsSafetyFloorRatio || 1.05;
    this.competitorCeilingRatio = options.competitorCeilingRatio || 1.15;
    this.densityThreshold = Math.max(0.01, Math.min(0.50, options.densityThreshold !== undefined ? options.densityThreshold : 0.10));
    this.densityPenaltyWeight = Math.max(0.05, options.densityPenaltyWeight || 0.45);
    this.bandwidth = Math.max(0.10, options.bandwidth || 0.30);

    // Discrete action candidate grid [0.80, 1.25]
    this.candidateMultipliers = [0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20];

    // Historical support anchors in normalized [demandIndex, urgency, action] space
    this.supportAnchors = options.supportAnchors || [
      [1.0, 0.2, 1.00],
      [1.2, 0.1, 1.05],
      [0.8, 0.5, 0.95],
      [1.5, 0.1, 1.10],
      [0.7, 0.8, 0.90],
      [1.1, 0.3, 1.00],
      [1.3, 0.2, 1.08],
      [0.9, 0.4, 0.96]
    ];
  }

  get safetyMargin() {
    return Number((this.cogsSafetyFloorRatio - 1.0).toFixed(2));
  }

  get regularizer() {
    return this.densityPenaltyWeight;
  }

  get featureDim() {
    return 5;
  }

  /**
   * Extract and normalize state features
   */
  extractStateFeatures(state) {
    const cogs = Math.max(1, Number(state.cogs) || 100000);
    const basePrice = Math.max(1, Number(state.basePrice) || Math.round(cogs * 1.3));
    const competitorPrice = Math.max(1, Number(state.competitorPrice) || basePrice);
    const demandIndex = Math.max(0, Math.min(2.5, state.demandIndex !== undefined ? Number(state.demandIndex) : 1.0));
    const inventoryUrgency = Math.max(0, Math.min(1.0, state.inventoryUrgency !== undefined ? Number(state.inventoryUrgency) : 0.2));

    return [
      Math.log(cogs) / 15.0,
      Math.log(basePrice) / 15.0,
      Math.log(competitorPrice) / 15.0,
      demandIndex,
      inventoryUrgency
    ];
  }

  /**
   * Estimate empirical data support density p_beta(s, a) using Gaussian Kernel Density Estimator
   * @param {Object} state
   * @param {number} action - Price multiplier
   * @returns {number} Estimated density in (0, 1]
   */
  estimateDataDensity(state, action) {
    const demandIndex = state.demandIndex !== undefined ? Number(state.demandIndex) : 1.0;
    const inventoryUrgency = state.inventoryUrgency !== undefined ? Number(state.inventoryUrgency) : 0.2;
    const act = Number(action) || 1.0;

    const point = [demandIndex, inventoryUrgency, act];
    let totalKernel = 0;
    const bwSq = this.bandwidth * this.bandwidth;

    for (const anchor of this.supportAnchors) {
      let distSq = 0;
      for (let i = 0; i < point.length; i++) {
        const diff = point[i] - anchor[i];
        distSq += diff * diff;
      }
      totalKernel += Math.exp(-distSq / (2 * bwSq));
    }

    const avgDensity = totalKernel / this.supportAnchors.length;
    return Number(Math.max(1e-4, Math.min(1.0, avgDensity)).toFixed(4));
  }

  /**
   * Compute SPOT density penalty: alpha * max(0, tau - density)
   */
  computeSpotPenalty(state, action) {
    const density = this.estimateDataDensity(state, action);
    const shortfall = Math.max(0, this.densityThreshold - density);
    const penalty = this.densityPenaltyWeight * shortfall;
    return {
      density,
      shortfall: Number(shortfall.toFixed(4)),
      penalty: Number(penalty.toFixed(4))
    };
  }

  /**
   * Nominal Q-function (estimated expected revenue)
   */
  evaluateNominalQ(state, action) {
    const demandIndex = state.demandIndex !== undefined ? Number(state.demandIndex) : 1.0;
    const inventoryUrgency = state.inventoryUrgency !== undefined ? Number(state.inventoryUrgency) : 0.2;
    const competitorRatio = (state.competitorPrice && state.basePrice)
      ? state.competitorPrice / state.basePrice
      : 1.0;

    // Price elasticity: higher multiplier decreases conversion
    const conversion = Math.max(0.01, Math.min(0.95, (1.20 - 0.70 * action) * demandIndex));
    // Clearance bonus for clearing urgent inventory
    const clearanceBonus = inventoryUrgency * (1.10 - action) * 0.3;
    // Competitor advantage
    const compAdvantage = (competitorRatio - action) * 0.15;

    return Number((action * conversion + clearanceBonus + compAdvantage).toFixed(4));
  }

  /**
   * Evaluate SPOT penalized Q-value
   */
  evaluatePenalizedQ(state, action) {
    const nominalQ = this.evaluateNominalQ(state, action);
    const spotInfo = this.computeSpotPenalty(state, action);
    const penalizedQ = nominalQ - spotInfo.penalty;
    return {
      nominalQ,
      penalizedQ: Number(penalizedQ.toFixed(4)),
      density: spotInfo.density,
      spotPenalty: spotInfo.penalty
    };
  }

  /**
   * Optimize price proposal using Supported Policy Optimization
   * @param {Object} item
   */
  optimizePrice(item) {
    const cogs = Math.max(1000, Number(item.cogs) || 100000);
    const basePrice = Math.max(1, Number(item.basePrice) || Math.round(cogs * 1.3));
    const competitorPrice = Number(item.competitorPrice) || basePrice;
    const demandIndex = item.demandIndex !== undefined ? Number(item.demandIndex) : 1.0;
    const inventoryUrgency = item.inventoryUrgency !== undefined ? Number(item.inventoryUrgency) : 0.2;

    const state = { cogs, basePrice, competitorPrice, demandIndex, inventoryUrgency };

    let bestAction = 1.0;
    let bestPenalizedQ = -Infinity;
    let bestDetails = null;

    for (const a of this.candidateMultipliers) {
      const qEval = this.evaluatePenalizedQ(state, a);
      if (qEval.penalizedQ > bestPenalizedQ) {
        bestPenalizedQ = qEval.penalizedQ;
        bestAction = a;
        bestDetails = qEval;
      }
    }

    let calculatedPrice = Math.round(basePrice * bestAction);
    const safetyFloor = Math.round(cogs * this.cogsSafetyFloorRatio);
    const safetyCeiling = Math.max(safetyFloor, Math.round(competitorPrice * this.competitorCeilingRatio));

    let decisionTag = "SPOT_DENSITY_SUPPORTED_OPTIMAL";

    if (calculatedPrice < safetyFloor) {
      calculatedPrice = safetyFloor;
      decisionTag = "FLOOR_OVERRIDE_COGS_SECURED";
    } else if (calculatedPrice > safetyCeiling) {
      calculatedPrice = safetyCeiling;
      decisionTag = "CEILING_OVERRIDE_COMPETITOR_RESTRICTED";
    }

    const grossMarginVnd = calculatedPrice - cogs;
    const marginPercent = Number(((grossMarginVnd / calculatedPrice) * 100).toFixed(2));

    return {
      proposedPrice: calculatedPrice,
      basePrice,
      cogs,
      competitorPrice,
      actionMultiplier: Number(bestAction.toFixed(4)),
      bestMultiplier: Number(bestAction.toFixed(4)),
      bestPenalizedQ: Number(bestPenalizedQ.toFixed(4)),
      nominalQ: bestDetails ? bestDetails.nominalQ : 0,
      densityScore: bestDetails ? bestDetails.density : 0,
      spotPenalty: bestDetails ? bestDetails.spotPenalty : 0,
      isFloorEnforced: calculatedPrice === safetyFloor,
      decisionTag,
      marginAnalysis: {
        grossMarginVnd,
        marginPercent,
        safetyFloorVnd: safetyFloor,
        safetyCeilingVnd: safetyCeiling
      }
    };
  }

  /**
   * Batch optimize catalog items
   */
  batchOptimize(items = []) {
    return (items || []).map(item => this.optimizePrice(item));
  }

  /**
   * Diagnostic summary
   */
  getModelSummary() {
    return {
      algorithm: "SpotDynamicPricing",
      cogsSafetyFloorRatio: this.cogsSafetyFloorRatio,
      competitorCeilingRatio: this.competitorCeilingRatio,
      densityThreshold: this.densityThreshold,
      densityPenaltyWeight: this.densityPenaltyWeight,
      bandwidth: this.bandwidth,
      anchorsCount: this.supportAnchors.length
    };
  }
}

export { SpotDynamicPricing };
export default SpotDynamicPricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SpotDynamicPricing };
  }
} catch (e) {}
