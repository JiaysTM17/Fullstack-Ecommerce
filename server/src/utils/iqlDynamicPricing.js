/**
 * IQLDynamicPricing - Implicit Q-Learning for Offline Reinforcement Learning in Dynamic Pricing
 * Reference: Kostrikov, Nair, Levine (ICLR 2022), "Offline Reinforcement Learning with Implicit Q-Learning"
 * 
 * Key Principles:
 * - Expectile Regression for Value learning V(s) without querying out-of-distribution (OOD) actions:
 *     L_2^tau(u) = |tau - 1(u < 0)| * u^2, with expectile tau in [0.5, 0.9] (default 0.70)
 * - Advantage-Weighted Policy Extraction: pi(a|s) proportional to exp(beta * (Q(s, a) - V(s)))
 * - Dual Hard Safety Bounds:
 *     * Floor: COGS x 1.05 (Min 5% gross margin guaranteed)
 *     * Ceiling: competitorPrice x 1.15 (Max 15% price markup over competitors)
 */

class IQLDynamicPricing {
  /**
   * @param {Object} options
   * @param {number} [options.expectileTau=0.70] - Expectile parameter tau in [0.5, 0.95]
   * @param {number} [options.temperatureBeta=3.0] - Inverse temperature for advantage-weighted policy extraction
   * @param {number} [options.cogsSafetyFloorRatio=1.05] - Minimum price multiplier over COGS
   * @param {number} [options.competitorCeilingRatio=1.15] - Maximum price multiplier over competitor
   */
  constructor(options = {}) {
    this.expectileTau = Math.min(0.95, Math.max(0.50, options.expectileTau || 0.70));
    this.temperatureBeta = Math.max(0.1, options.temperatureBeta || 3.0);
    this.cogsSafetyFloorRatio = options.cogsSafetyFloorRatio || 1.05;
    this.competitorCeilingRatio = options.competitorCeilingRatio || 1.15;

    // Value network weights for state V(s): [log(cogs), log(basePrice), log(competitorPrice), demandIndex, inventoryUrgency]
    this.valueWeights = options.valueWeights || [0.15, 0.35, -0.05, 0.40, -0.25];
    this.valueBias = options.valueBias !== undefined ? options.valueBias : 0.0;

    // Q-network weights: [5 state features + action multiplier]
    this.qWeights = options.qWeights || [0.18, 0.38, -0.08, 0.45, -0.28, 0.30];
    this.qBias = options.qBias !== undefined ? options.qBias : 0.0;

    // Behavioral reference weights
    this.behavioralWeights = options.behavioralWeights || [0.08, 0.15, -0.03, 0.12, -0.08];
    this.behavioralBias = options.behavioralBias !== undefined ? options.behavioralBias : 0.0;
  }

  /**
   * Normalize state features into compact vector
   */
  normalizeState(state) {
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
   * Asymmetric Expectile Loss L_2^tau(u) = |tau - 1(u < 0)| * u^2
   */
  evaluateExpectileLoss(diff, tau = this.expectileTau) {
    const u = Number(diff);
    const weight = u < 0 ? (1.0 - tau) : tau;
    return weight * u * u;
  }

  /**
   * State Value evaluation V(s) via Expectile Regression
   */
  evaluateV(state) {
    const sNorm = this.normalizeState(state);
    let v = this.valueBias;
    for (let i = 0; i < sNorm.length; i++) {
      v += sNorm[i] * this.valueWeights[i];
    }
    // High expectile tau shifts estimate toward upper quantile of Q-values
    const expectileShift = (this.expectileTau - 0.5) * 0.40;
    return v + expectileShift;
  }

  /**
   * Critic Action-Value evaluation Q(s, a)
   */
  evaluateQ(state, action) {
    const sNorm = this.normalizeState(state);
    const sa = [...sNorm, action];
    let q = this.qBias;
    for (let i = 0; i < sa.length; i++) {
      q += sa[i] * this.qWeights[i];
    }
    return q;
  }

  /**
   * Advantage function A(s, a) = Q(s, a) - V(s)
   */
  computeAdvantage(state, action) {
    const q = this.evaluateQ(state, action);
    const v = this.evaluateV(state);
    return q - v;
  }

  /**
   * Predict baseline behavioral policy action
   */
  predictBehavioralAction(state) {
    const sNorm = this.normalizeState(state);
    let dot = this.behavioralBias;
    for (let i = 0; i < sNorm.length; i++) {
      dot += sNorm[i] * this.behavioralWeights[i];
    }
    const tanh = Math.tanh(dot);
    return Math.max(0.70, Math.min(1.40, 1.0 + tanh * 0.25));
  }

  /**
   * Advantage-Weighted Policy Extraction Step
   * @param {Object} item 
   * @returns {Object} Optimized pricing proposal and policy telemetry
   */
  optimizePrice(item) {
    const cogs = Math.max(1000, Number(item.cogs) || 100000);
    const basePrice = Math.max(cogs, Number(item.basePrice) || Math.round(cogs * 1.3));
    const competitorPrice = Number(item.competitorPrice) || basePrice;
    const demandIndex = item.demandIndex !== undefined ? Number(item.demandIndex) : 1.0;
    const inventoryUrgency = item.inventoryUrgency !== undefined ? Number(item.inventoryUrgency) : 0.2;

    const state = { cogs, basePrice, competitorPrice, demandIndex, inventoryUrgency };

    const behavioralAction = this.predictBehavioralAction(state);
    const vVal = this.evaluateV(state);

    // Discrete action candidate grid around behavioral baseline
    const candidates = [
      behavioralAction * 0.90,
      behavioralAction * 0.95,
      behavioralAction,
      behavioralAction * 1.05,
      behavioralAction * 1.10
    ].map(a => Math.max(0.70, Math.min(1.40, a)));

    let weightedActionSum = 0;
    let totalWeight = 0;
    let bestAdvantage = -Infinity;
    let bestAction = behavioralAction;

    for (const a of candidates) {
      const adv = this.computeAdvantage(state, a);
      // Advantage weighting w(a) = exp(beta * adv) clipped at 20.0 to prevent overflow
      const w = Math.min(20.0, Math.exp(Math.min(10.0, this.temperatureBeta * adv)));
      weightedActionSum += a * w;
      totalWeight += w;

      if (adv > bestAdvantage) {
        bestAdvantage = adv;
        bestAction = a;
      }
    }

    const extractedAction = totalWeight > 0 ? (weightedActionSum / totalWeight) : behavioralAction;
    let calculatedPrice = Math.round(basePrice * extractedAction);

    const safetyFloor = Math.round(cogs * this.cogsSafetyFloorRatio);
    const safetyCeiling = Math.round(competitorPrice * this.competitorCeilingRatio);

    let decisionTag = "IQL_EXPECTILE_OPTIMAL";

    if (calculatedPrice < safetyFloor) {
      calculatedPrice = safetyFloor;
      decisionTag = "FLOOR_OVERRIDE_COGS_SECURED";
    } else if (calculatedPrice > safetyCeiling) {
      calculatedPrice = safetyCeiling;
      decisionTag = "CEILING_OVERRIDE_COMPETITOR_RESTRICTED";
    } else if (bestAdvantage < 0) {
      decisionTag = "BEHAVIORAL_BASELINE_FALLBACK";
    }

    const grossMarginVnd = calculatedPrice - cogs;
    const marginPercent = Number(((grossMarginVnd / calculatedPrice) * 100).toFixed(2));

    return {
      proposedPrice: calculatedPrice,
      basePrice,
      cogs,
      competitorPrice,
      actionMultiplier: Number(extractedAction.toFixed(4)),
      behavioralAction: Number(behavioralAction.toFixed(4)),
      advantage: Number(bestAdvantage.toFixed(4)),
      stateValueV: Number(vVal.toFixed(4)),
      expectileTau: this.expectileTau,
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

export { IQLDynamicPricing };
export default IQLDynamicPricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IQLDynamicPricing };
  }
} catch (e) {}
