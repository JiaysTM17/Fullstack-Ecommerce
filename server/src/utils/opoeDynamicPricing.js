/**
 * OPOEDynamicPricing - Offline Policy Optimization with Epistemic Uncertainty Penalization
 * References:
 * - Jin, Yang, Wang (ICLR 2021), "Is Pessimism Provably Efficient for Offline RL?"
 * - Rashidinejad, Zhu, Ma, Jiao, Russell (2021), "Bridging Offline Reinforcement Learning and Imitation Learning"
 * 
 * Key Principles:
 * - Quantifies Epistemic Uncertainty Gamma(s, a) = kappa * sqrt(phi(s, a)^T * Sigma^(-1) * phi(s, a))
 * - Pessimistic Q-Evaluation: Q_hat(s, a) = Q_nominal(s, a) - Gamma(s, a)
 * - Strict Hard Floor (COGS x 1.05) & Competitor Ceiling (competitorPrice x 1.15)
 * - Safely handles out-of-distribution (OOD) pricing queries without reckless price dumping
 */

class OPOEDynamicPricing {
  /**
   * @param {Object} options
   * @param {number} [options.kappaUncertainty=0.35] - Uncertainty penalty multiplier kappa
   * @param {number} [options.ridgeLambda=1.0] - Ridge regularization lambda for covariance matrix
   * @param {number} [options.cogsSafetyFloorRatio=1.05]
   * @param {number} [options.competitorCeilingRatio=1.15]
   */
  constructor(options = {}) {
    this.kappaUncertainty = Math.max(0.01, options.kappaUncertainty !== undefined ? options.kappaUncertainty : 0.35);
    this.ridgeLambda = Math.max(0.1, options.ridgeLambda || 1.0);
    this.cogsSafetyFloorRatio = options.cogsSafetyFloorRatio || 1.05;
    this.competitorCeilingRatio = options.competitorCeilingRatio || 1.15;

    // Feature dimension d = 6 (5 state features + 1 action multiplier)
    this.dim = 6;
    // Diagonal empirical covariance approximation (for O(d) in-memory inversion)
    this.covDiag = new Float64Array(this.dim).fill(this.ridgeLambda);

    // Baseline nominal Q weights
    this.qWeights = options.qWeights || [0.15, 0.35, -0.05, 0.40, -0.20, 0.25];
    this.qBias = options.qBias !== undefined ? options.qBias : 0.0;

    // Behavioral reference weights
    this.behavioralWeights = options.behavioralWeights || [0.08, 0.16, -0.04, 0.12, -0.08];
    this.behavioralBias = options.behavioralBias !== undefined ? options.behavioralBias : 0.0;

    this.sampleCount = 0;
  }

  /**
   * Extract state-action feature vector phi(s, a)
   */
  extractFeatures(state, action) {
    const cogs = Math.max(1, state.cogs || 100000);
    const basePrice = Math.max(1, state.basePrice || cogs * 1.25);
    const competitorPrice = Math.max(1, state.competitorPrice || basePrice);
    const demandIndex = Math.max(0, Math.min(2.0, state.demandIndex !== undefined ? state.demandIndex : 1.0));
    const inventoryUrgency = Math.max(0, Math.min(1.0, state.inventoryUrgency !== undefined ? state.inventoryUrgency : 0.2));
    const act = Math.max(0.70, Math.min(1.40, Number(action) || 1.0));

    return [
      Math.log(cogs) / 15.0,
      Math.log(basePrice) / 15.0,
      Math.log(competitorPrice) / 15.0,
      demandIndex,
      inventoryUrgency,
      act
    ];
  }

  /**
   * Update empirical covariance with historical sample
   */
  recordSample(state, action) {
    const phi = this.extractFeatures(state, action);
    for (let i = 0; i < this.dim; i++) {
      this.covDiag[i] += phi[i] * phi[i];
    }
    this.sampleCount += 1;
  }

  /**
   * Epistemic uncertainty penalty Gamma(s, a) = kappa * sqrt(phi^T * Sigma^(-1) * phi)
   */
  computeUncertaintyPenalty(state, action) {
    const phi = this.extractFeatures(state, action);
    let mahalanobisSq = 0;
    for (let i = 0; i < this.dim; i++) {
      const prec = 1.0 / this.covDiag[i];
      mahalanobisSq += phi[i] * phi[i] * prec;
    }
    const norm = Math.sqrt(Math.max(0, mahalanobisSq));
    return this.kappaUncertainty * norm;
  }

  /**
   * Nominal Q-value evaluation
   */
  evaluateNominalQ(state, action) {
    const phi = this.extractFeatures(state, action);
    let q = this.qBias;
    for (let i = 0; i < this.dim; i++) {
      q += phi[i] * this.qWeights[i];
    }
    return q;
  }

  /**
   * Pessimistic Q-value evaluation: Q_hat(s, a) = Q_nominal(s, a) - Gamma(s, a)
   */
  evaluatePessimisticQ(state, action) {
    const qNom = this.evaluateNominalQ(state, action);
    const penalty = this.computeUncertaintyPenalty(state, action);
    return qNom - penalty;
  }

  /**
   * Predict baseline behavioral action
   */
  predictBehavioralAction(state) {
    const phi = this.extractFeatures(state, 1.0);
    let dot = this.behavioralBias;
    for (let i = 0; i < 5; i++) {
      dot += phi[i] * this.behavioralWeights[i];
    }
    const tanh = Math.tanh(dot);
    return Math.max(0.70, Math.min(1.40, 1.0 + tanh * 0.25));
  }

  get featureDim() {
    return this.dim;
  }

  get regularizer() {
    return this.ridgeLambda;
  }

  get uncertaintyWeight() {
    return this.kappaUncertainty;
  }

  get safetyMargin() {
    return Number((this.cogsSafetyFloorRatio - 1.0).toFixed(2));
  }

  updateCovariance(state, action) {
    return this.recordSample(state, action);
  }

  getModelSummary() {
    return {
      featureDim: this.dim,
      regularizer: this.ridgeLambda,
      kappaUncertainty: this.kappaUncertainty,
      sampleCount: this.sampleCount,
      cogsSafetyFloorRatio: this.cogsSafetyFloorRatio,
      competitorCeilingRatio: this.competitorCeilingRatio
    };
  }

  batchOptimize(items = []) {
    return (items || []).map(item => this.optimizePrice(item));
  }

  /**
   * Optimize Price Proposal via Pessimistic Offline Policy Optimization
   * @param {Object} item 
   * @returns {Object} Optimized pricing proposal and policy telemetry
   */
  optimizePrice(item) {
    const cogs = Math.max(1000, Number(item.cogs) || 100000);
    const basePrice = Math.max(1, Number(item.basePrice) || Math.round(cogs * 1.3));
    const competitorPrice = Number(item.competitorPrice) || basePrice;
    const demandIndex = item.demandIndex !== undefined ? Number(item.demandIndex) : 1.0;
    const inventoryUrgency = item.inventoryUrgency !== undefined ? Number(item.inventoryUrgency) : 0.2;

    const state = { cogs, basePrice, competitorPrice, demandIndex, inventoryUrgency };

    const behavioralAction = this.predictBehavioralAction(state);

    const candidates = [
      behavioralAction * 0.90,
      behavioralAction * 0.95,
      behavioralAction,
      behavioralAction * 1.05,
      behavioralAction * 1.10
    ].map(a => Math.max(0.70, Math.min(1.40, a)));

    let bestPessimisticQ = -Infinity;
    let bestAction = behavioralAction;
    let selectedPenalty = 0;

    for (const a of candidates) {
      const qPess = this.evaluatePessimisticQ(state, a);
      if (qPess > bestPessimisticQ) {
        bestPessimisticQ = qPess;
        bestAction = a;
        selectedPenalty = this.computeUncertaintyPenalty(state, a);
      }
    }

    let calculatedPrice = Math.round(basePrice * bestAction);

    const safetyFloor = Math.round(cogs * this.cogsSafetyFloorRatio);
    const safetyCeiling = Math.max(safetyFloor, Math.round(competitorPrice * this.competitorCeilingRatio));

    let decisionTag = "OPOE_PESSIMISTIC_OPTIMAL";

    if (calculatedPrice < safetyFloor) {
      calculatedPrice = safetyFloor;
      decisionTag = "FLOOR_OVERRIDE_COGS_SECURED";
    } else if (calculatedPrice > safetyCeiling) {
      calculatedPrice = safetyCeiling;
      decisionTag = "CEILING_OVERRIDE_COMPETITOR_RESTRICTED";
    } else if (selectedPenalty > 0.40) {
      decisionTag = "EPISTEMIC_UNCERTAINTY_DAMPED";
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
      pessimisticQ: Number(bestPessimisticQ.toFixed(4)),
      bestPessimisticQ: Number(bestPessimisticQ.toFixed(4)),
      bestBaseQ: Number(this.evaluateNominalQ(state, bestAction).toFixed(4)),
      epistemicPenalty: Number(selectedPenalty.toFixed(4)),
      uncertaintyPenalty: Number(selectedPenalty.toFixed(4)),
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
}

export { OPOEDynamicPricing };
export default OPOEDynamicPricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { OPOEDynamicPricing };
  }
} catch (e) {}
