/**
 * CalQLPricing - Calibrated Offline Reinforcement Learning for Safe E-Commerce Dynamic Pricing
 * 
 * References:
 * - Mitsuhiko Nakamoto, Yuexiang Zhai, Anikait Singh, Max Sobol Mark, Yi Ma, Chelsea Finn,
 *   Aviral Kumar, Sergey Levine (NeurIPS 2023):
 *   "Cal-QL: Calibrated Offline RL for Efficient Online Fine-Tuning"
 * 
 * Core Breakthrough:
 * - Solves the extreme over-conservatism of standard Conservative Q-Learning (CQL).
 * - Calibrated Conservative Penalty: Penalizes Q(s, a) ONLY when it exceeds the reference behavior value V^mu(s):
 *     Penalty = alpha * max(0, Q(s, a) - V^mu(s))
 * - When Q-values are below or equal to the empirical business baseline V^mu(s), no artificial underestimation occurs,
 *   allowing merchants to actively capture profitable Flash Sale demand within proven historical limits.
 * - Enterprise Safeguard: Mandatory profit protection floor Price >= COGS * 1.05 and competitor ceiling.
 */

class CalQLPricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.alphaCalibration=1.2] - Calibration penalty multiplier
   * @param {number} [options.learningRate=0.01] - Optimization step size
   * @param {number} [options.gamma=0.95] - Bellman discount factor
   * @param {number} [options.cogsFloorMultiplier=1.05] - Mandatory net margin barrier
   */
  constructor(options = {}) {
    this.alpha = options.alphaCalibration !== undefined ? options.alphaCalibration : 1.2;
    this.learningRate = options.learningRate || 0.01;
    this.gamma = options.gamma !== undefined ? options.gamma : 0.95;
    this.cogsFloorMultiplier = options.cogsFloorMultiplier || 1.05;

    // State dimension: [compPriceNorm, stockNorm, hourNorm, demandElasticity, historicalConversion]
    this.featureDim = 5;

    // Reference Behavior Value Model V^mu(s) = W_ref . s + bias_ref (represents baseline business return)
    this.vReference = {
      wState: [0.4, -0.1, 0.05, -0.2, 0.5],
      bias: 5.0,
    };

    // Primary Critic Model Q(s, a) = W_s . s + W_a * a + W_a2 * a^2 + bias
    this.critic = {
      wState: [0.5, -0.15, 0.08, -0.3, 0.6],
      wAction: 2.0,
      wActionSq: -0.8, // Concave profit curve
      bias: 4.5,
    };

    // Target Critic for stable Bellman bootstrapping
    this.targetCritic = JSON.parse(JSON.stringify(this.critic));

    // Actor Policy pi(s) = clamp(W_pi . s + bias_pi, 0.70, 1.40)
    this.actor = {
      wState: [0.3, -0.25, 0.04, -0.35, 0.4],
      bias: 1.0,
    };

    this.replayBuffer = [];
    this.maxBufferSize = 5000;
  }

  /**
   * State feature extraction
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
   * Evaluate Reference Behavior Value V^mu(s)
   */
  evaluateReferenceValue(state) {
    const s = this._extractStateVector(state);
    let v = this.vReference.bias;
    for (let j = 0; j < this.featureDim; j++) {
      v += this.vReference.wState[j] * s[j];
    }
    return Math.max(0, v);
  }

  /**
   * Evaluate Critic Q(s, a)
   */
  evaluateCritic(state, action, useTarget = false) {
    const s = this._extractStateVector(state);
    const c = useTarget ? this.targetCritic : this.critic;
    let q = c.bias + c.wAction * action + c.wActionSq * action * action;
    for (let j = 0; j < this.featureDim; j++) {
      q += c.wState[j] * s[j];
    }
    return q;
  }

  /**
   * Actor policy forward pass: output pricing multiplier action in [0.70, 1.40]
   */
  predictAction(state) {
    const s = this._extractStateVector(state);
    let rawAction = this.actor.bias;
    for (let j = 0; j < this.featureDim; j++) {
      rawAction += this.actor.wState[j] * s[j];
    }
    return Math.max(0.70, Math.min(1.40, rawAction));
  }

  /**
   * Record transition in offline replay buffer
   */
  recordTransition(state, action, reward, nextState, done = false) {
    if (this.replayBuffer.length >= this.maxBufferSize) {
      this.replayBuffer.shift();
    }
    this.replayBuffer.push({ state, action, reward, nextState, done });
  }

  /**
   * Train Cal-QL with Calibrated Reference Value Regularization
   * @param {Array<Object>} [transitions]
   * @param {number} [epochs=5]
   * @returns {Object} Training metrics
   */
  optimizeBatch(transitions = null, epochs = 5) {
    const data = transitions || this.replayBuffer;
    if (!data || data.length === 0) {
      return { trained: false, reason: "No training transitions available" };
    }

    let totalBellmanLoss = 0;
    let totalCalibratedPenalty = 0;
    let calibratedActiveCount = 0;

    for (let epoch = 0; epoch < epochs; epoch++) {
      for (const t of data) {
        const s = this._extractStateVector(t.state);
        const sNext = this._extractStateVector(t.nextState || t.state);
        const a = t.action;
        const r = t.reward;

        // 1. Compute Bellman Target via Target Critic
        const nextAction = this.predictAction(t.nextState || t.state);
        const nextQ = this.evaluateCritic(t.nextState || t.state, nextAction, true);
        const targetQ = r + (t.done ? 0 : this.gamma * nextQ);

        // 2. Compute Calibrated Conservative Penalty: max(0, Q(s, a_pi) - V^mu(s))
        const policyAction = this.predictAction(t.state);
        const predPolicyQ = this.evaluateCritic(t.state, policyAction, false);
        const refV = this.evaluateReferenceValue(t.state);

        // Key CalQL property: only penalize if policy Q exceeds behavior reference return
        const qSurplus = predPolicyQ - refV;
        const isCalibratedActive = qSurplus > 0;
        const calPenalty = isCalibratedActive ? this.alpha * qSurplus : 0;

        if (isCalibratedActive) {
          calibratedActiveCount++;
          totalCalibratedPenalty += calPenalty;
        }

        // 3. Update Critic
        const currentQ = this.evaluateCritic(t.state, a, false);
        const bellmanError = currentQ - targetQ;
        totalBellmanLoss += Math.abs(bellmanError);

        // Total Critic gradient = Bellman gradient + Calibrated penalty gradient
        const effectiveGrad = bellmanError + calPenalty;
        const step = this.learningRate;

        for (let j = 0; j < this.featureDim; j++) {
          this.critic.wState[j] -= step * effectiveGrad * s[j];
        }
        this.critic.wAction -= step * effectiveGrad * a;
        this.critic.wActionSq -= step * effectiveGrad * a * a;
        this.critic.bias -= step * effectiveGrad;

        // 4. Update Actor to maximize Q(s, pi(s))
        const actorGrad = -predPolicyQ * 0.05;
        for (let j = 0; j < this.featureDim; j++) {
          this.actor.wState[j] -= step * actorGrad * s[j];
        }
        this.actor.bias -= step * actorGrad;

        // Soft target update (Polyak averaging tau = 0.05)
        const tau = 0.05;
        for (let j = 0; j < this.featureDim; j++) {
          this.targetCritic.wState[j] = tau * this.critic.wState[j] + (1 - tau) * this.targetCritic.wState[j];
        }
        this.targetCritic.wAction = tau * this.critic.wAction + (1 - tau) * this.targetCritic.wAction;
        this.targetCritic.wActionSq = tau * this.critic.wActionSq + (1 - tau) * this.targetCritic.wActionSq;
        this.targetCritic.bias = tau * this.critic.bias + (1 - tau) * this.targetCritic.bias;
      }
    }

    const totalSamples = data.length * epochs;
    return {
      trained: true,
      samples: data.length,
      epochs,
      avgBellmanLoss: Number((totalBellmanLoss / totalSamples).toFixed(4)),
      avgCalibratedPenalty: Number((totalCalibratedPenalty / totalSamples).toFixed(4)),
      calibratedActiveRate: Number((calibratedActiveCount / totalSamples).toFixed(4)),
    };
  }

  /**
   * Optimize Price for Enterprise E-Commerce SKU
   * Applies COGS profit protection floor and competitor ceiling
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

    const policyAction = this.predictAction(state);
    const candidateMultipliers = [
      policyAction - 0.12,
      policyAction - 0.04,
      policyAction,
      policyAction + 0.04,
      policyAction + 0.12,
    ];

    let bestAction = policyAction;
    let bestValue = -Infinity;
    const refV = this.evaluateReferenceValue(state);

    for (const action of candidateMultipliers) {
      const qVal = this.evaluateCritic(state, action);
      // Cal-QL score: Q-value penalized only if above reference value
      const penalty = Math.max(0, qVal - refV) * (this.alpha * 0.5);
      const score = qVal - penalty;

      if (score > bestValue) {
        bestValue = score;
        bestAction = action;
      }
    }

    let rawSuggestedPrice = Math.round(basePrice * bestAction);
    const ceilingPrice = Math.round(competitorPrice * 1.20);
    let constrainedPrice = Math.min(rawSuggestedPrice, ceilingPrice);

    // Hard floor: never sell below COGS * cogsFloorMultiplier (e.g. 5% minimum net margin)
    const hardFloorPrice = Math.round(cogs * this.cogsFloorMultiplier);
    const isFloorTriggered = constrainedPrice < hardFloorPrice;
    const finalPrice = Math.max(constrainedPrice, hardFloorPrice);

    const netProfitMargin = (finalPrice - cogs) / finalPrice;

    return {
      productId: product.id || product.productId || 'SKU_CALQL_OPTIMIZED',
      cogs,
      basePrice,
      competitorPrice,
      suggestedPrice: finalPrice,
      rawAction: Number(bestAction.toFixed(4)),
      referenceValueV: Number(refV.toFixed(2)),
      estimatedQValue: Number(this.evaluateCritic(state, bestAction).toFixed(2)),
      hardFloorPrice,
      ceilingPrice,
      isFloorTriggered,
      netProfitMargin: Number(netProfitMargin.toFixed(4)),
      safetyStatus: isFloorTriggered ? 'FLOOR_OVERRIDE_SECURED' : 'CALIBRATED_OPTIMAL',
    };
  }
}

export { CalQLPricing };
export default CalQLPricing;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CalQLPricing };
  }
} catch (e) {}
