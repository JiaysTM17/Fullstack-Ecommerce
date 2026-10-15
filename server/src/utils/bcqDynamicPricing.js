/**
 * BCQDynamicPricing - Batch-Constrained Q-Learning for Safe Offline Reinforcement Learning in Dynamic Pricing
 * References:
 * - Scott Fujimoto, Edoardo Meger, Doina Precup (ICML 2019), "Off-Policy Deep Reinforcement Learning without Exploration"
 * 
 * Key Principles:
 * - Eliminates extrapolation error in offline RL by strictly constraining actions to the support of the behavior distribution.
 * - Generative model G_omega(s) creates candidate actions within observed historical discount intervals.
 * - Perturbation model xi_phi(s, a) adds bounded fine-tuning adjustment [-xi_max, +xi_max].
 * - Clipped Double Q-Learning: Q_bcq(s, a) = lambda * min(Q1, Q2) + (1 - lambda) * max(Q1, Q2) to penalize overestimation bias.
 * - Strict Hard Floor: COGS x 1.05 & Competitor Ceiling: competitorPrice x 1.15.
 */

class BCQDynamicPricing {
  /**
   * @param {Object} options
   * @param {number} [options.cogsSafetyFloorRatio=1.05] - Minimum gross margin floor
   * @param {number} [options.competitorCeilingRatio=1.15] - Maximum price ceiling vs competitor
   * @param {number} [options.doubleQLambda=0.75] - Weight on min(Q1, Q2) in double Q evaluation
   * @param {number} [options.maxPerturbation=0.05] - Maximum action adjustment xi_max
   * @param {number} [options.candidateCount=5] - Number of sampled action candidates
   */
  constructor(options = {}) {
    this.cogsSafetyFloorRatio = options.cogsSafetyFloorRatio || 1.05;
    this.competitorCeilingRatio = options.competitorCeilingRatio || 1.15;
    this.doubleQLambda = Math.max(0.5, Math.min(1.0, options.doubleQLambda !== undefined ? options.doubleQLambda : 0.75));
    this.maxPerturbation = Math.max(0.01, Math.min(0.20, options.maxPerturbation || 0.05));
    this.candidateCount = Math.max(2, options.candidateCount || 5);

    // Q1 network linear weights (trained on expected revenue)
    this.q1Weights = options.q1Weights || [0.20, 0.30, -0.05, 0.45, -0.15, 0.35];
    this.q1Bias = options.q1Bias !== undefined ? options.q1Bias : 0.05;

    // Q2 network linear weights (trained independently for pessimistic clipping)
    this.q2Weights = options.q2Weights || [0.18, 0.32, -0.08, 0.40, -0.22, 0.30];
    this.q2Bias = options.q2Bias !== undefined ? options.q2Bias : -0.02;

    // Behavioral generator weights
    this.genWeights = options.genWeights || [0.05, 0.12, -0.03, 0.15, -0.10];
    this.genBias = options.genBias !== undefined ? options.genBias : 0.0;
  }

  get safetyMargin() {
    return Number((this.cogsSafetyFloorRatio - 1.0).toFixed(2));
  }

  get regularizer() {
    return this.doubleQLambda;
  }

  get featureDim() {
    return 6;
  }

  /**
   * Normalize state features
   */
  extractStateFeatures(state) {
    const cogs = Math.max(1, state.cogs || 100000);
    const basePrice = Math.max(1, state.basePrice || cogs * 1.25);
    const competitorPrice = Math.max(1, state.competitorPrice || basePrice);
    const demandIndex = Math.max(0, Math.min(2.0, state.demandIndex !== undefined ? state.demandIndex : 1.0));
    const inventoryUrgency = Math.max(0, Math.min(1.0, state.inventoryUrgency !== undefined ? state.inventoryUrgency : 0.2));

    return [
      Math.log(cogs) / 15.0,
      Math.log(basePrice) / 15.0,
      Math.log(competitorPrice) / 15.0,
      demandIndex,
      inventoryUrgency
    ];
  }

  /**
   * Generative behavioral model: G_omega(s) -> baseline action
   */
  sampleBehavioralAction(state) {
    const sNorm = this.extractStateFeatures(state);
    let dot = this.genBias;
    for (let i = 0; i < sNorm.length; i++) {
      dot += sNorm[i] * this.genWeights[i];
    }
    const tanh = Math.tanh(dot);
    // Base action centered around 1.0 in range [0.80, 1.25]
    return Math.max(0.75, Math.min(1.35, 1.0 + tanh * 0.20));
  }

  /**
   * Generate action candidates sampled from behavior distribution with bounded perturbations
   */
  generateActionCandidates(state, count = this.candidateCount) {
    const baseAction = this.sampleBehavioralAction(state);
    const candidates = [];
    const step = (2 * this.maxPerturbation) / Math.max(1, count - 1);

    for (let i = 0; i < count; i++) {
      const perturbation = -this.maxPerturbation + i * step;
      const act = Math.max(0.70, Math.min(1.40, baseAction + perturbation));
      candidates.push(Number(act.toFixed(4)));
    }
    return candidates;
  }

  /**
   * Evaluate Q1(s, a)
   */
  evaluateQ1(state, action) {
    const sNorm = this.extractStateFeatures(state);
    const sa = [...sNorm, action];
    let q = this.q1Bias;
    for (let i = 0; i < sa.length; i++) {
      q += sa[i] * this.q1Weights[i];
    }
    return q;
  }

  /**
   * Evaluate Q2(s, a)
   */
  evaluateQ2(state, action) {
    const sNorm = this.extractStateFeatures(state);
    const sa = [...sNorm, action];
    let q = this.q2Bias;
    for (let i = 0; i < sa.length; i++) {
      q += sa[i] * this.q2Weights[i];
    }
    return q;
  }

  /**
   * Clipped Double Q evaluation: Q_bcq(s, a) = lambda * min(Q1, Q2) + (1 - lambda) * max(Q1, Q2)
   */
  evaluateDoubleQ(state, action) {
    const q1 = this.evaluateQ1(state, action);
    const q2 = this.evaluateQ2(state, action);
    const minQ = Math.min(q1, q2);
    const maxQ = Math.max(q1, q2);
    const doubleQ = this.doubleQLambda * minQ + (1 - this.doubleQLambda) * maxQ;
    return { q1, q2, minQ, maxQ, doubleQ };
  }

  /**
   * Optimize price proposal using Batch-Constrained Q-Learning
   * @param {Object} item
   */
  optimizePrice(item) {
    const cogs = Math.max(1000, Number(item.cogs) || 100000);
    const basePrice = Math.max(1, Number(item.basePrice) || Math.round(cogs * 1.3));
    const competitorPrice = Number(item.competitorPrice) || basePrice;
    const demandIndex = item.demandIndex !== undefined ? Number(item.demandIndex) : 1.0;
    const inventoryUrgency = item.inventoryUrgency !== undefined ? Number(item.inventoryUrgency) : 0.2;

    const state = { cogs, basePrice, competitorPrice, demandIndex, inventoryUrgency };
    const candidates = this.generateActionCandidates(state);
    const behavioralAction = this.sampleBehavioralAction(state);

    let bestAction = behavioralAction;
    let bestDoubleQ = -Infinity;
    let bestDetails = null;

    for (const a of candidates) {
      const qEval = this.evaluateDoubleQ(state, a);
      if (qEval.doubleQ > bestDoubleQ) {
        bestDoubleQ = qEval.doubleQ;
        bestAction = a;
        bestDetails = qEval;
      }
    }

    let calculatedPrice = Math.round(basePrice * bestAction);

    const safetyFloor = Math.round(cogs * this.cogsSafetyFloorRatio);
    const safetyCeiling = Math.max(safetyFloor, Math.round(competitorPrice * this.competitorCeilingRatio));

    let decisionTag = "BCQ_BATCH_CONSTRAINED_OPTIMAL";

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
      behavioralAction: Number(behavioralAction.toFixed(4)),
      bestDoubleQ: Number(bestDoubleQ.toFixed(4)),
      q1Value: Number((bestDetails ? bestDetails.q1 : 0).toFixed(4)),
      q2Value: Number((bestDetails ? bestDetails.q2 : 0).toFixed(4)),
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
   * Batch optimize multiple items
   */
  batchOptimize(items = []) {
    return (items || []).map(item => this.optimizePrice(item));
  }

  /**
   * Model telemetry summary
   */
  getModelSummary() {
    return {
      algorithm: "BCQDynamicPricing",
      cogsSafetyFloorRatio: this.cogsSafetyFloorRatio,
      competitorCeilingRatio: this.competitorCeilingRatio,
      doubleQLambda: this.doubleQLambda,
      maxPerturbation: this.maxPerturbation,
      candidateCount: this.candidateCount,
      featureDim: this.featureDim
    };
  }
}

export { BCQDynamicPricing };
export default BCQDynamicPricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BCQDynamicPricing };
  }
} catch (e) {}
