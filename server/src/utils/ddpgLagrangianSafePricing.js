/**
 * DDPG-Lagrangian Safe Dynamic Pricing (DDPGLagrangianSafePricing)
 * 
 * Foundational Academic References:
 * - Timothy P. Lillicrap et al. (Google DeepMind, ICLR 2016):
 *   "Continuous Control with Deep Reinforcement Learning" (DDPG)
 * - Joshua Achiam, David Held, Aviv Tamar, Pieter Abbeel (ICML 2017):
 *   "Constrained Policy Optimization"
 * - Alex Ray, Joshua Achiam, Dario Amodei (OpenAI Safety Starter Kit 2019):
 *   "Benchmarking Safe Exploration in Deep Reinforcement Learning"
 * 
 * Mathematical Foundations:
 * - In high-velocity e-commerce price discovery, discrete action spaces (e.g. +/- 1%, 2%)
 *   lead to combinatorial explosions. DDPG provides deterministic continuous action control:
 *   a = mu(s | theta^mu) in [-0.20, +0.20] (relative price adjustment).
 * - Safety Constraints under Lagrangian Relaxation:
 *   E_{s,a}[C(s, a)] <= d_budget, where C(s, a) represents margin compression or inventory stockout risk.
 * - Saddle-point Lagrangian objective:
 *   min_{lambda >= 0} max_{theta^mu} J(theta^mu) - lambda * (J_C(theta^mu) - d_budget).
 * - Critic Networks:
 *   1. Reward Critic Q(s, a | theta^Q): Estimates discounted cumulative revenue.
 *   2. Cost Critic Q_C(s, a | theta^{Q_C}): Estimates safety violations.
 * - Target Networks with Polyak soft averaging parameter tau in [0.005, 0.05]:
 *   theta' <- tau * theta + (1 - tau) * theta'.
 * - Dual Multiplier Update via Subgradient Ascent:
 *   lambda <- max(0, lambda + alpha_lambda * (bar{C} - d_budget)).
 * - Policy Gradient with Safe Action Damping:
 *   nabla_{theta^mu} J_safe approx E[ nabla_a (Q(s, a) - lambda * Q_C(s, a))|_{a=mu(s)} * nabla_{theta^mu} mu(s) ].
 * - Strict Hard Boundary:
 *   Price recommendation is strictly clamped to safety floor >= 1.05 * COGS.
 */

export class DDPGLagrangianSafePricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.stateDim=5] State vector dimension
   * @param {number} [options.tau=0.02] Polyak soft update rate
   * @param {number} [options.gamma=0.95] Discount factor
   * @param {number} [options.actorLr=0.02] Actor learning rate
   * @param {number} [options.criticLr=0.03] Critic learning rate
   * @param {number} [options.lambdaLr=0.015] Dual multiplier learning rate
   * @param {number} [options.costBudget=0.05] Maximum allowable safety risk budget
   * @param {number} [options.initLambda=0.10] Initial Lagrangian multiplier
   * @param {number} [options.noiseStd=0.03] Exploration noise standard deviation
   */
  constructor(options = {}) {
    this.stateDim = Math.max(2, Math.floor(Number(options.stateDim || 5)));
    this.tau = Math.max(0.001, Math.min(0.2, Number(options.tau || 0.02)));
    this.gamma = Math.max(0.8, Math.min(0.99, Number(options.gamma || 0.95)));
    this.actorLr = Math.max(0.001, Number(options.actorLr || 0.02));
    this.criticLr = Math.max(0.001, Number(options.criticLr || 0.03));
    this.lambdaLr = Math.max(0.001, Number(options.lambdaLr || 0.015));
    this.costBudget = Math.max(0.001, Number(options.costBudget || 0.05));
    this.lambda = Math.max(0.0, Number(options.initLambda !== undefined ? options.initLambda : 0.0));
    this.noiseStd = Math.max(0.001, Number(options.noiseStd || 0.03));

    // Online Networks
    this.actorWeights = new Float64Array(this.stateDim);
    this.criticWeights = new Float64Array(this.stateDim + 1); // state + action
    this.costCriticWeights = new Float64Array(this.stateDim + 1);

    // Target Networks (Polyak averaging)
    this.targetActorWeights = new Float64Array(this.stateDim);
    this.targetCriticWeights = new Float64Array(this.stateDim + 1);
    this.targetCostCriticWeights = new Float64Array(this.stateDim + 1);

    // Initial parameters
    const initActor = [0.03, 0.04, -0.02, 0.01, 0.02];
    const initCritic = [0.5, 0.4, 0.3, 0.2, 0.1, 0.8];
    const initCost = [0.02, -0.01, 0.03, 0.02, 0.01, 0.5];

    for (let i = 0; i < this.stateDim; i++) {
      this.actorWeights[i] = i < initActor.length ? initActor[i] : 0.01;
      this.targetActorWeights[i] = this.actorWeights[i];
    }
    for (let i = 0; i < this.stateDim + 1; i++) {
      this.criticWeights[i] = i < initCritic.length ? initCritic[i] : 0.02;
      this.targetCriticWeights[i] = this.criticWeights[i];
      this.costCriticWeights[i] = i < initCost.length ? initCost[i] : 0.01;
      this.targetCostCriticWeights[i] = this.costCriticWeights[i];
    }

    this.updatesCount = 0;
    this.lastActorLoss = 0;
    this.lastCriticLoss = 0;
  }

  /**
   * Linear dot product helper
   * @private
   */
  _dot(w, vec) {
    let sum = 0;
    const len = Math.min(w.length, vec.length);
    for (let i = 0; i < len; i++) {
      sum += w[i] * vec[i];
    }
    return sum;
  }

  /**
   * Deterministic continuous action in [-0.20, +0.20]
   * @param {Float64Array|Array<number>} state 
   * @param {boolean} [addNoise=false] 
   * @returns {number}
   */
  predictAction(state, addNoise = false) {
    const raw = this._dot(this.actorWeights, state);
    let action = Math.max(-0.20, Math.min(0.20, raw));
    if (addNoise) {
      // Box-Muller Gaussian noise
      const u1 = Math.max(1e-6, Math.random());
      const u2 = Math.random();
      const z0 = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      action += z0 * this.noiseStd;
      action = Math.max(-0.20, Math.min(0.20, action));
    }
    return action;
  }

  /**
   * Predicts action using Target Actor
   * @param {Float64Array|Array<number>} state 
   * @returns {number}
   */
  predictTargetAction(state) {
    const raw = this._dot(this.targetActorWeights, state);
    return Math.max(-0.20, Math.min(0.20, raw));
  }

  /**
   * Evaluates Reward Critic Q(s, a)
   * @param {Float64Array|Array<number>} state 
   * @param {number} action 
   * @returns {number}
   */
  evaluateQ(state, action) {
    const sa = new Float64Array(this.stateDim + 1);
    for (let i = 0; i < this.stateDim; i++) sa[i] = state[i] || 0;
    sa[this.stateDim] = action;
    return this._dot(this.criticWeights, sa);
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
   * Soft target network update via Polyak averaging: theta' <- tau * theta + (1 - tau) * theta'
   * @private
   */
  _polyakUpdate() {
    for (let i = 0; i < this.stateDim; i++) {
      this.targetActorWeights[i] = this.tau * this.actorWeights[i] + (1 - this.tau) * this.targetActorWeights[i];
    }
    for (let i = 0; i < this.stateDim + 1; i++) {
      this.targetCriticWeights[i] = this.tau * this.criticWeights[i] + (1 - this.tau) * this.targetCriticWeights[i];
      this.targetCostCriticWeights[i] = this.tau * this.costCriticWeights[i] + (1 - this.tau) * this.targetCostCriticWeights[i];
    }
  }

  /**
   * Performs DDPG-Lagrangian gradient step on transition batch
   * @param {Array<{ state: Array<number>, action: number, reward: number, cost: number, nextState: Array<number>, done: boolean }>} transitions 
   * @returns {Object}
   */
  update(transitions) {
    if (!Array.isArray(transitions) || transitions.length === 0) {
      return { success: false, reason: "EMPTY_TRANSITIONS" };
    }

    const N = transitions.length;
    let criticLossSum = 0;
    let actorLossSum = 0;
    let totalCost = 0;

    for (let i = 0; i < N; i++) {
      const t = transitions[i];
      const s = new Float64Array(this.stateDim);
      const sNext = new Float64Array(this.stateDim);
      for (let j = 0; j < this.stateDim; j++) {
        s[j] = Number(t.state ? t.state[j] : 0) || 0;
        sNext[j] = Number(t.nextState ? t.nextState[j] : 0) || 0;
      }
      const a = Number(t.action || 0);
      const r = Number(t.reward || 0);
      const c = Math.max(0, Number(t.cost || 0));
      totalCost += c;

      // Target Q Computation
      const targetAction = this.predictTargetAction(sNext);
      const saNext = new Float64Array(this.stateDim + 1);
      for (let j = 0; j < this.stateDim; j++) saNext[j] = sNext[j];
      saNext[this.stateDim] = targetAction;

      const targetQ = r + (t.done ? 0 : this.gamma * this._dot(this.targetCriticWeights, saNext));
      const targetCostQ = c + (t.done ? 0 : this.gamma * this._dot(this.targetCostCriticWeights, saNext));

      // Critic Update via TD Error
      const currentQ = this.evaluateQ(s, a);
      const qErr = targetQ - currentQ;
      criticLossSum += (qErr * qErr) / N;

      const currentCostQ = this.evaluateCost(s, a);
      const costErr = targetCostQ - currentCostQ;

      const sa = new Float64Array(this.stateDim + 1);
      for (let j = 0; j < this.stateDim; j++) sa[j] = s[j];
      sa[this.stateDim] = a;

      for (let j = 0; j < this.stateDim + 1; j++) {
        this.criticWeights[j] += (this.criticLr * qErr * sa[j]) / N;
        this.costCriticWeights[j] += (this.criticLr * costErr * sa[j]) / N;
      }

      // Safe Deterministic Policy Gradient:
      // nabla_mu = nabla_a (Q - lambda * Q_C) * nabla_{theta} mu
      const muAction = this.predictAction(s, false);
      const qActionGrad = this.criticWeights[this.stateDim] - this.lambda * this.costCriticWeights[this.stateDim];
      actorLossSum += (-qActionGrad * muAction) / N;

      for (let j = 0; j < this.stateDim; j++) {
        this.actorWeights[j] += (this.actorLr * qActionGrad * s[j]) / N;
      }
    }

    // Lagrangian Multiplier Ascent: lambda <- max(0, lambda + alpha_lambda * (bar{c} - d_budget))
    const avgCost = totalCost / N;
    const costViolation = avgCost - this.costBudget;
    this.lambda = Math.max(0.0, this.lambda + this.lambdaLr * costViolation);

    // Polyak Target Updates
    this._polyakUpdate();

    this.updatesCount++;
    this.lastCriticLoss = criticLossSum;
    this.lastActorLoss = actorLossSum;

    return {
      success: true,
      updatesCount: this.updatesCount,
      criticLoss: Number(criticLossSum.toFixed(5)),
      actorLoss: Number(actorLossSum.toFixed(5)),
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
      predictedQ: Number(predictedQ.toFixed(4)),
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
      algorithm: "DDPGLagrangianSafePricing",
      stateDim: this.stateDim,
      tau: this.tau,
      gamma: this.gamma,
      lambda: this.lambda,
      costBudget: this.costBudget,
      updatesCount: this.updatesCount,
      lastCriticLoss: this.lastCriticLoss,
      lastActorLoss: this.lastActorLoss
    };
  }
}

export default DDPGLagrangianSafePricing;
