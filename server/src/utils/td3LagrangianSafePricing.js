/**
 * Twin Delayed DDPG with Lagrangian Safety Multiplier (TD3LagrangianSafePricing)
 * 
 * Theoretical Foundations:
 * - Scott Fujimoto, Herke van Hoof, David Meger (ICML 2018) - "Addressing Function Approximation Error in Actor-Critic Methods" (TD3)
 * - Joshua Achiam, David Held, Aviv Tamar, Pieter Abbeel (ICML 2017) - "Constrained Policy Optimization" (Lagrangian Dual Multiplier)
 * 
 * Mathematical Formulation:
 * 1. Continuous Deterministic Actor:
 *    Action a = \mu(s | \theta^\mu) \in [-0.20, +0.20] (Price adjustment percentage)
 * 2. Twin Critics (Mitigate Overestimation Bias):
 *    Q_1(s, a), Q_2(s, a) for reward; Q_C(s, a) for financial constraint violation cost
 * 3. Target Policy Smoothing Regularization:
 *    a' = clip(\mu'(s') + clip(N(0, \sigma_target), -c_noise, c_noise), -a_max, a_max)
 *    y = r + \gamma * \min(Q_1'(s', a'), Q_2'(s', a'))
 *    y_C = c + \gamma * Q_C'(s', a')
 * 4. Delayed Policy & Target Updates:
 *    Policy \mu updated every policyDelay (default 2) critic training steps
 *    \nabla_{\theta^\mu} J = \nabla_a (Q_1(s, a) - \lambda * Q_C(s, a)) * \nabla_{\theta^\mu} \mu(s)
 * 5. Dual Lagrangian Multiplier Ascent:
 *    \lambda <- max(0, \lambda + \alpha_\lambda * (\bar{c} - d_budget))
 * 6. Financial Safety Hard Sizing:
 *    Floor: \ge 1.05 * COGS (Strict anti-loss barrier)
 *    Ceiling: \le 1.25 * MSRP
 */

export class TD3LagrangianSafePricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.stateDim=5] State vector dimensions
   * @param {number} [options.tau=0.01] Polyak target averaging parameter
   * @param {number} [options.gamma=0.95] Reward discount factor
   * @param {number} [options.actorLr=0.02] Learning rate for actor
   * @param {number} [options.criticLr=0.03] Learning rate for twin critics
   * @param {number} [options.lambdaLr=0.015] Learning rate for dual multiplier
   * @param {number} [options.costBudget=0.05] Acceptable maximum safety cost budget
   * @param {number} [options.initLambda=0.0] Initial Lagrangian multiplier
   * @param {number} [options.policyDelay=2] Frequency of delayed actor updates
   * @param {number} [options.targetNoiseStd=0.02] Target action smoothing noise std
   * @param {number} [options.noiseClip=0.05] Target noise clipping threshold
   * @param {number} [options.actionMax=0.20] Maximum action bounds
   */
  constructor(options = {}) {
    this.stateDim = Math.max(2, Math.floor(Number(options.stateDim || 5)));
    this.tau = Math.max(0.001, Math.min(0.2, Number(options.tau || 0.01)));
    this.gamma = Math.max(0.8, Math.min(0.99, Number(options.gamma || 0.95)));
    this.actorLr = Math.max(0.001, Number(options.actorLr || 0.02));
    this.criticLr = Math.max(0.001, Number(options.criticLr || 0.03));
    this.lambdaLr = Math.max(0.001, Number(options.alphaLambda || options.lambdaLr || 0.015));
    this.costBudget = Math.max(0.001, Number(options.costBudget || 0.05));
    this.lambda = Math.max(0.0, Number(options.initLambda !== undefined ? options.initLambda : 0.0));
    this.policyDelay = Math.max(1, Math.floor(Number(options.policyDelay || 2)));
    this.targetNoiseStd = Math.max(0.005, Number(options.targetNoiseStd || 0.02));
    this.noiseClip = Math.max(0.01, Number(options.noiseClip || 0.05));
    this.actionMax = Math.max(0.05, Math.min(0.50, Number(options.actionBound || options.actionMax || 0.20)));

    // Online Networks
    this.actorWeights = new Float64Array(this.stateDim);
    this.critic1Weights = new Float64Array(this.stateDim + 1); // Q1
    this.critic2Weights = new Float64Array(this.stateDim + 1); // Q2
    this.costCriticWeights = new Float64Array(this.stateDim + 1); // QC

    // Target Networks (Polyak averaging)
    this.targetActorWeights = new Float64Array(this.stateDim);
    this.targetCritic1Weights = new Float64Array(this.stateDim + 1);
    this.targetCritic2Weights = new Float64Array(this.stateDim + 1);
    this.targetCostCriticWeights = new Float64Array(this.stateDim + 1);

    // Initial deterministic weights
    const initActor = [0.03, 0.04, -0.02, 0.01, 0.02];
    const initQ1 = [0.5, 0.4, 0.3, 0.2, 0.1, 0.8];
    const initQ2 = [0.48, 0.42, 0.29, 0.21, 0.11, 0.79];
    const initCost = [0.02, -0.01, 0.03, 0.02, 0.01, 0.5];

    for (let i = 0; i < this.stateDim; i++) {
      this.actorWeights[i] = i < initActor.length ? initActor[i] : 0.01;
      this.targetActorWeights[i] = this.actorWeights[i];
    }
    for (let i = 0; i < this.stateDim + 1; i++) {
      this.critic1Weights[i] = i < initQ1.length ? initQ1[i] : 0.02;
      this.targetCritic1Weights[i] = this.critic1Weights[i];

      this.critic2Weights[i] = i < initQ2.length ? initQ2[i] : 0.02;
      this.targetCritic2Weights[i] = this.critic2Weights[i];

      this.costCriticWeights[i] = i < initCost.length ? initCost[i] : 0.01;
      this.targetCostCriticWeights[i] = this.costCriticWeights[i];
    }

    this.updatesCount = 0;
    this.lastCriticLoss = 0;
    this.lastActorLoss = 0;
  }

  get actionBound() { return this.actionMax; }
  get targetPolicyDelay() { return this.policyDelay; }
  get totalSteps() { return this.updatesCount; }
  get critic1() { return this.critic1Weights; }
  get critic2() { return this.critic2Weights; }

  selectAction(state, addNoise = false) {
    return this.predictAction(state, addNoise);
  }

  forwardCritic(weights, state, action) {
    const sa = new Float64Array(this.stateDim + 1);
    for (let i = 0; i < this.stateDim; i++) sa[i] = state[i] || 0;
    sa[this.stateDim] = action;
    return this._dot(weights, sa);
  }

  getTargetSmoothedAction(state) {
    return this.predictTargetAction(state);
  }

  computeClippedTargetQ(reward, nextState, done = false) {
    const targetAction = this.predictTargetAction(nextState);
    const saNext = new Float64Array(this.stateDim + 1);
    for (let j = 0; j < this.stateDim; j++) saNext[j] = nextState[j] || 0;
    saNext[this.stateDim] = targetAction;
    const q1 = this._dot(this.targetCritic1Weights, saNext);
    const q2 = this._dot(this.targetCritic2Weights, saNext);
    return reward + (done ? 0 : this.gamma * Math.min(q1, q2));
  }

  updateDualMultiplier(avgCost) {
    const costViolation = avgCost - this.costBudget;
    this.lambda = Math.max(0.0, this.lambda + this.lambdaLr * costViolation);
    return this.lambda;
  }

  getSafePrice(basePrice, cogs, state) {
    const res = this.recommendPrice({ price: basePrice, cogs, msrp: basePrice * 1.3 });
    return {
      recommendedPrice: res.recommendedPrice,
      marginFloor: res.safetyFloor,
      discountPct: res.priceAdjustmentPct,
      ...res
    };
  }

  /**
   * Dot product helper
   * @private
   */
  _dot(w, vec) {
    let sum = 0;
    const len = Math.min(w.length, vec.length);
    for (let i = 0; i < len; i++) sum += w[i] * vec[i];
    return sum;
  }

  /**
   * Predicts continuous action via Actor
   * @param {Float64Array|Array<number>} state 
   * @param {boolean} [addNoise=false] 
   * @returns {number}
   */
  predictAction(state, addNoise = false) {
    const raw = this._dot(this.actorWeights, state);
    let action = Math.max(-this.actionMax, Math.min(this.actionMax, raw));

    if (addNoise) {
      // Box-Muller Gaussian Noise
      const u1 = Math.max(1e-6, Math.random());
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      action += z0 * 0.02;
      action = Math.max(-this.actionMax, Math.min(this.actionMax, action));
    }

    return action;
  }

  /**
   * Predicts target action with Target Policy Smoothing Regularization
   * @param {Float64Array|Array<number>} state 
   * @returns {number}
   */
  predictTargetAction(state) {
    const raw = this._dot(this.targetActorWeights, state);

    // Target policy smoothing noise clipped to [-noiseClip, +noiseClip]
    const u1 = Math.max(1e-6, Math.random());
    const u2 = Math.random();
    const noise = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * this.targetNoiseStd;
    const clippedNoise = Math.max(-this.noiseClip, Math.min(this.noiseClip, noise));

    const smoothedAction = raw + clippedNoise;
    return Math.max(-this.actionMax, Math.min(this.actionMax, smoothedAction));
  }

  /**
   * Evaluates Twin Q1 and Q2 values
   * @param {Float64Array|Array<number>} state 
   * @param {number} action 
   * @returns {{ q1: number, q2: number, minQ: number }}
   */
  evaluateQ(state, action) {
    const sa = new Float64Array(this.stateDim + 1);
    for (let i = 0; i < this.stateDim; i++) sa[i] = state[i] || 0;
    sa[this.stateDim] = action;

    const q1 = this._dot(this.critic1Weights, sa);
    const q2 = this._dot(this.critic2Weights, sa);
    return { q1, q2, minQ: Math.min(q1, q2) };
  }

  /**
   * Evaluates Cost Critic Q_C(s, a)
   * @param {Float64Array|Array<number>} state 
   * @param {number} action 
   * @returns {number}
   */
  evaluateCost(state, action) {
    const sa = new Float64Array(this.stateDim + 1);
    for (let i = 0; i < this.stateDim; i++) sa[i] = state[i] || 0;
    sa[this.stateDim] = action;

    return Math.max(0.0, this._dot(this.costCriticWeights, sa));
  }

  /**
   * Polyak soft target updates
   * @private
   */
  _polyakUpdate(updateActorOnly = false) {
    if (updateActorOnly) {
      for (let i = 0; i < this.stateDim; i++) {
        this.targetActorWeights[i] = this.tau * this.actorWeights[i] + (1 - this.tau) * this.targetActorWeights[i];
      }
      return;
    }

    // Critics polyak update
    for (let i = 0; i < this.stateDim + 1; i++) {
      this.targetCritic1Weights[i] = this.tau * this.critic1Weights[i] + (1 - this.tau) * this.targetCritic1Weights[i];
      this.targetCritic2Weights[i] = this.tau * this.critic2Weights[i] + (1 - this.tau) * this.targetCritic2Weights[i];
      this.targetCostCriticWeights[i] = this.tau * this.costCriticWeights[i] + (1 - this.tau) * this.targetCostCriticWeights[i];
    }
  }

  /**
   * Trains TD3 on an experience replay batch with delayed actor updates
   * @param {Array<Object>} batch Batch of { state, action, reward, cost, nextState, done }
   * @returns {Object}
   */
  trainStep(batch = []) {
    if (!Array.isArray(batch) || batch.length === 0) {
      return { success: false, reason: "EMPTY_BATCH" };
    }

    const N = batch.length;
    let criticLossSum = 0;
    let actorLossSum = 0;
    let totalCost = 0;

    const s = new Float64Array(this.stateDim);
    const sNext = new Float64Array(this.stateDim);

    for (let i = 0; i < N; i++) {
      const t = batch[i];
      for (let j = 0; j < this.stateDim; j++) {
        s[j] = Number(t.state ? t.state[j] : 0) || 0;
        sNext[j] = Number(t.nextState ? t.nextState[j] : 0) || 0;
      }
      const a = Number(t.action || 0);
      const r = Number(t.reward || 0);
      const c = Math.max(0, Number(t.cost || 0));
      totalCost += c;

      // 1. Target Action with Policy Smoothing
      const targetAction = this.predictTargetAction(sNext);
      const saNext = new Float64Array(this.stateDim + 1);
      for (let j = 0; j < this.stateDim; j++) saNext[j] = sNext[j];
      saNext[this.stateDim] = targetAction;

      // 2. Clipped Double Q Target
      const targetQ1 = this._dot(this.targetCritic1Weights, saNext);
      const targetQ2 = this._dot(this.targetCritic2Weights, saNext);
      const minTargetQ = Math.min(targetQ1, targetQ2);
      const targetY = r + (t.done ? 0 : this.gamma * minTargetQ);

      const targetCostQ = this._dot(this.targetCostCriticWeights, saNext);
      const targetCostY = c + (t.done ? 0 : this.gamma * targetCostQ);

      // 3. Update Twin Critics & Cost Critic via TD Error
      const sa = new Float64Array(this.stateDim + 1);
      for (let j = 0; j < this.stateDim; j++) sa[j] = s[j];
      sa[this.stateDim] = a;

      const q1Err = targetY - this._dot(this.critic1Weights, sa);
      const q2Err = targetY - this._dot(this.critic2Weights, sa);
      const costErr = targetCostY - this._dot(this.costCriticWeights, sa);

      criticLossSum += (q1Err * q1Err + q2Err * q2Err) / (2 * N);

      for (let j = 0; j < this.stateDim + 1; j++) {
        this.critic1Weights[j] += (this.criticLr * q1Err * sa[j]) / N;
        this.critic2Weights[j] += (this.criticLr * q2Err * sa[j]) / N;
        this.costCriticWeights[j] += (this.criticLr * costErr * sa[j]) / N;
      }
    }

    this._polyakUpdate(false); // Update target critics
    this.updatesCount++;

    // 4. Delayed Policy Updates (Actor & Target Actor)
    let isActorUpdated = false;
    if (this.updatesCount % this.policyDelay === 0) {
      for (let i = 0; i < N; i++) {
        const t = batch[i];
        for (let j = 0; j < this.stateDim; j++) s[j] = Number(t.state ? t.state[j] : 0) || 0;

        const muAction = this.predictAction(s, false);
        // Safe policy gradient: nabla_mu = nabla_a (Q1 - lambda * Q_C) * nabla_theta mu
        const qActionGrad = this.critic1Weights[this.stateDim] - this.lambda * this.costCriticWeights[this.stateDim];
        actorLossSum += (-qActionGrad * muAction) / N;

        for (let j = 0; j < this.stateDim; j++) {
          this.actorWeights[j] += (this.actorLr * qActionGrad * s[j]) / N;
        }
      }

      this._polyakUpdate(true); // Update target actor
      isActorUpdated = true;
    }

    // 5. Dual Lagrangian Multiplier Update
    const avgCost = totalCost / N;
    const costViolation = avgCost - this.costBudget;
    this.lambda = Math.max(0.0, this.lambda + this.lambdaLr * costViolation);

    this.lastCriticLoss = criticLossSum;
    if (isActorUpdated) this.lastActorLoss = actorLossSum;

    return {
      success: true,
      updatesCount: this.updatesCount,
      isActorUpdated,
      actorUpdated: isActorUpdated,
      criticLoss: Number(criticLossSum.toFixed(5)),
      actorLoss: Number(this.lastActorLoss.toFixed(5)),
      lambda: Number(this.lambda.toFixed(4)),
      avgCost: Number(avgCost.toFixed(5)),
      isBudgetExceeded: costViolation > 0
    };
  }

  /**
   * Alias for trainStep
   */
  update(transitions = []) {
    return this.trainStep(transitions);
  }

  /**
   * Recommends optimal safe pricing for product given current market state
   * @param {Object} product
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

    const deterministicAction = this.predictAction(state, false);
    const predictedQ = this.evaluateQ(state, deterministicAction);
    const predictedCost = this.evaluateCost(state, deterministicAction);

    // Lagrangian damping factor
    const lagrangianDamping = Math.max(0.35, 1.0 - this.lambda * predictedCost);
    const safeAction = deterministicAction * lagrangianDamping;

    const rawPrice = currentPrice * (1.0 + safeAction);
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
      predictedQ: Number(predictedQ.minQ.toFixed(4)),
      predictedCost: Number(predictedCost.toFixed(4)),
      lagrangianDamping: Number(lagrangianDamping.toFixed(3)),
      lambda: Number(this.lambda.toFixed(4)),
      isBudgetExceeded: predictedCost > this.costBudget
    };
  }

  /**
   * Diagnostic telemetry
   * @returns {Object}
   */
  getTelemetry() {
    return {
      algorithm: "TD3LagrangianSafePricing",
      stateDim: this.stateDim,
      tau: this.tau,
      gamma: this.gamma,
      lambda: this.lambda,
      costBudget: this.costBudget,
      policyDelay: this.policyDelay,
      updatesCount: this.updatesCount,
      lastCriticLoss: this.lastCriticLoss,
      lastActorLoss: this.lastActorLoss
    };
  }
}

export default TD3LagrangianSafePricing;
