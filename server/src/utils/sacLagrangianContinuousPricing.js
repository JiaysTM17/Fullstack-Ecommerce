/**
 * Soft Actor-Critic with Lagrangian Constraint & Temperature Auto-Tuning (SACLagrangianContinuousPricing)
 * 
 * Theoretical Foundations:
 * - Tuomas Haarnoja, Aurick Zhou, Pieter Abbeel, Sergey Levine (ICML 2018) - "Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor"
 * - Joshua Achiam, David Held, Aviv Tamar, Pieter Abbeel (ICML 2017) - "Constrained Policy Optimization"
 * 
 * Mathematical Formulation:
 * 1. Maximum Entropy Objective:
 *    J(\pi) = \sum_{t=0}^T \mathbb{E}_{(s_t, a_t) \sim \rho_\pi} [ r(s_t, a_t) + \alpha \mathcal{H}(\pi(\cdot | s_t)) ]
 *    subject to \mathbb{E}_{(s, a)} [ c(s, a) ] \le d_{budget}
 * 2. Squashed Gaussian Stochastic Actor:
 *    u \sim \mathcal{N}(\mu_\theta(s), \sigma_\theta(s)^2)
 *    a = a_{max} \cdot \tanh(u)
 *    \log \pi(a|s) = \log \mu(u|s) - \sum_{i=1}^{dim} \log(1 - \tanh^2(u_i) + 1e-6)
 * 3. Twin Critics Q_1, Q_2 and Cost Critic Q_C:
 *    y = r + \gamma ( \min(Q'_1(s', a'), Q'_2(s', a')) - \alpha \log \pi(a'|s') )
 *    y_C = c + \gamma Q'_C(s', a')
 * 4. Automatic Temperature Adjustment:
 *    \mathcal{L}(\alpha) = \mathbb{E}_{a \sim \pi} [ -\alpha (\log \pi(a|s) + \bar{\mathcal{H}}) ]
 * 5. Dual Lagrangian Multiplier Update:
 *    \lambda \leftarrow \max(0, \lambda + \alpha_\lambda (\bar{c} - d_{budget}))
 * 6. Policy Loss:
 *    \mathcal{L}(\theta) = \mathbb{E}_{s \sim \mathcal{D}, a \sim \pi} [ \alpha \log \pi(a|s) - \min(Q_1, Q_2) + \lambda Q_C ]
 * 7. Profit Floor Protection:
 *    Safety floor: \ge 1.05 * COGS
 */

export class SACLagrangianContinuousPricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.stateDim=5] State vector dimensions
   * @param {number} [options.actionBound=0.20] Maximum action bounds
   * @param {number} [options.gamma=0.95] Reward discount factor
   * @param {number} [options.tau=0.01] Polyak target averaging parameter
   * @param {number} [options.actorLr=0.02] Learning rate for actor
   * @param {number} [options.criticLr=0.03] Learning rate for twin critics
   * @param {number} [options.alphaLr=0.01] Learning rate for temperature alpha
   * @param {number} [options.lambdaLr=0.015] Learning rate for Lagrangian multiplier
   * @param {number} [options.costBudget=0.05] Acceptable maximum safety cost budget
   * @param {number} [options.initLambda=0.0] Initial Lagrangian multiplier
   * @param {number} [options.targetEntropy=-1.0] Target entropy (-actionDim)
   */
  constructor(options = {}) {
    this.stateDim = Math.max(2, Math.floor(Number(options.stateDim || 5)));
    this.actionMax = Math.max(0.05, Math.min(0.50, Number(options.actionBound || options.actionMax || 0.20)));
    this.gamma = Math.max(0.8, Math.min(0.99, Number(options.gamma || 0.95)));
    this.tau = Math.max(0.001, Math.min(0.2, Number(options.tau || 0.01)));
    this.actorLr = Math.max(0.001, Number(options.actorLr || 0.02));
    this.criticLr = Math.max(0.001, Number(options.criticLr || 0.03));
    this.alphaLr = Math.max(0.001, Number(options.alphaLr || 0.01));
    this.lambdaLr = Math.max(0.001, Number(options.lambdaLr || options.alphaLambda || 0.015));
    this.costBudget = Math.max(0.001, Number(options.costBudget || 0.05));
    this.lambda = Math.max(0.0, Number(options.initLambda !== undefined ? options.initLambda : 0.0));
    this.targetEntropy = Number(options.targetEntropy !== undefined ? options.targetEntropy : -1.0);
    this.logAlpha = 0.0;
    this.alpha = Math.exp(this.logAlpha);

    // Online Networks
    this.actorMuWeights = new Float64Array(this.stateDim);
    this.actorLogStdWeights = new Float64Array(this.stateDim);
    this.critic1Weights = new Float64Array(this.stateDim + 1); // Q1
    this.critic2Weights = new Float64Array(this.stateDim + 1); // Q2
    this.costCriticWeights = new Float64Array(this.stateDim + 1); // QC

    // Target Networks
    this.targetCritic1Weights = new Float64Array(this.stateDim + 1);
    this.targetCritic2Weights = new Float64Array(this.stateDim + 1);
    this.targetCostCriticWeights = new Float64Array(this.stateDim + 1);

    // Initial deterministic weights
    const initMu = [0.03, 0.04, -0.02, 0.01, 0.02];
    const initLogStd = [-0.5, -0.5, -0.5, -0.5, -0.5];
    const initQ1 = [0.5, 0.4, 0.3, 0.2, 0.1, 0.8];
    const initQ2 = [0.48, 0.42, 0.29, 0.21, 0.11, 0.79];
    const initCost = [0.02, -0.01, 0.03, 0.02, 0.01, 0.5];

    for (let i = 0; i < this.stateDim; i++) {
      this.actorMuWeights[i] = i < initMu.length ? initMu[i] : 0.01;
      this.actorLogStdWeights[i] = i < initLogStd.length ? initLogStd[i] : -0.5;
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
  get totalSteps() { return this.updatesCount; }
  get critic1() { return this.critic1Weights; }
  get critic2() { return this.critic2Weights; }

  _dot(w, vec) {
    let sum = 0;
    const len = Math.min(w.length, vec.length);
    for (let i = 0; i < len; i++) sum += w[i] * vec[i];
    return sum;
  }

  /**
   * Samples action from policy given state
   * @param {Float64Array|Array<number>} state 
   * @param {boolean} [deterministic=false] 
   * @returns {{ action: number, logProb: number }}
   */
  sampleAction(state, deterministic = false) {
    const mu = this._dot(this.actorMuWeights, state);
    const logStd = Math.max(-20, Math.min(2, this._dot(this.actorLogStdWeights, state)));
    const std = Math.exp(logStd);

    let u = mu;
    let eps = 0;
    if (!deterministic) {
      // Box-Muller Gaussian sample
      const u1 = Math.max(1e-6, Math.random());
      const u2 = Math.random();
      eps = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      u = mu + std * eps;
    }

    const tanhU = Math.tanh(u);
    const action = this.actionMax * tanhU;

    // Squashed Gaussian log prob: log pi(a|s) = log N(u|mu, std) - log(1 - tanh^2(u) + 1e-6)
    const logNorm = -0.5 * Math.log(2 * Math.PI) - logStd - 0.5 * ((u - mu) / std) ** 2;
    const logJac = Math.log(Math.max(1e-6, 1.0 - tanhU * tanhU));
    const logProb = logNorm - logJac;

    return { action, logProb };
  }

  /**
   * Action selection alias
   */
  selectAction(state, deterministic = false) {
    const { action } = this.sampleAction(state, deterministic);
    return Math.max(-this.actionMax, Math.min(this.actionMax, action));
  }

  /**
   * Evaluates twin critics
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
   * Evaluates cost critic
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
  _polyakUpdate() {
    for (let i = 0; i < this.stateDim + 1; i++) {
      this.targetCritic1Weights[i] = this.tau * this.critic1Weights[i] + (1 - this.tau) * this.targetCritic1Weights[i];
      this.targetCritic2Weights[i] = this.tau * this.critic2Weights[i] + (1 - this.tau) * this.targetCritic2Weights[i];
      this.targetCostCriticWeights[i] = this.tau * this.costCriticWeights[i] + (1 - this.tau) * this.targetCostCriticWeights[i];
    }
  }

  /**
   * Trains SAC-Lagrangian on an experience replay batch
   * @param {Array<Object>} batch
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

      // 1. Next state action & entropy from current policy
      const nextSample = this.sampleAction(sNext, false);
      const saNext = new Float64Array(this.stateDim + 1);
      for (let j = 0; j < this.stateDim; j++) saNext[j] = sNext[j];
      saNext[this.stateDim] = nextSample.action;

      // 2. Twin Target Q with Entropy Bonus
      const targetQ1 = this._dot(this.targetCritic1Weights, saNext);
      const targetQ2 = this._dot(this.targetCritic2Weights, saNext);
      const minTargetQ = Math.min(targetQ1, targetQ2) - this.alpha * nextSample.logProb;
      const targetY = r + (t.done ? 0 : this.gamma * minTargetQ);

      const targetCostQ = this._dot(this.targetCostCriticWeights, saNext);
      const targetCostY = c + (t.done ? 0 : this.gamma * targetCostQ);

      // 3. Update Critics
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

      // 4. Update Actor Policy
      const curSample = this.sampleAction(s, false);
      const curSa = new Float64Array(this.stateDim + 1);
      for (let j = 0; j < this.stateDim; j++) curSa[j] = s[j];
      curSa[this.stateDim] = curSample.action;

      const qVal = Math.min(this._dot(this.critic1Weights, curSa), this._dot(this.critic2Weights, curSa));
      const costVal = this._dot(this.costCriticWeights, curSa);
      const qAdv = qVal - this.lambda * costVal - this.alpha * curSample.logProb;

      actorLossSum += -qAdv / N;
      for (let j = 0; j < this.stateDim; j++) {
        this.actorMuWeights[j] += (this.actorLr * qAdv * s[j]) / N;
      }

      // 5. Automatic Temperature Tuning
      const alphaLoss = -this.alpha * (curSample.logProb + this.targetEntropy);
      this.logAlpha -= (this.alphaLr * alphaLoss) / N;
      this.alpha = Math.max(0.01, Math.min(2.0, Math.exp(this.logAlpha)));
    }

    // 6. Dual Multiplier Ascent
    const avgCost = totalCost / N;
    const costViolation = avgCost - this.costBudget;
    this.lambda = Math.max(0.0, this.lambda + this.lambdaLr * costViolation);

    this._polyakUpdate();
    this.updatesCount++;
    this.lastCriticLoss = criticLossSum;
    this.lastActorLoss = actorLossSum;

    return {
      success: true,
      updatesCount: this.updatesCount,
      criticLoss: Number(criticLossSum.toFixed(5)),
      actorLoss: Number(this.lastActorLoss.toFixed(5)),
      alpha: Number(this.alpha.toFixed(4)),
      lambda: Number(this.lambda.toFixed(4)),
      avgCost: Number(avgCost.toFixed(5)),
      isBudgetExceeded: costViolation > 0
    };
  }

  update(batch = []) {
    return this.trainStep(batch);
  }

  updateDualMultiplier(avgCost) {
    const costViolation = avgCost - this.costBudget;
    this.lambda = Math.max(0.0, this.lambda + this.lambdaLr * costViolation);
    return this.lambda;
  }

  /**
   * Recommends safe selling price for product
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

    const deterministicAction = this.selectAction(state, true);
    const predictedQ = this.evaluateQ(state, deterministicAction);
    const predictedCost = this.evaluateCost(state, deterministicAction);

    // Lagrangian risk damping
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
      alpha: Number(this.alpha.toFixed(4)),
      lambda: Number(this.lambda.toFixed(4)),
      isBudgetExceeded: predictedCost > this.costBudget
    };
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

  getTelemetry() {
    return {
      algorithm: "SACLagrangianContinuousPricing",
      stateDim: this.stateDim,
      alpha: this.alpha,
      lambda: this.lambda,
      costBudget: this.costBudget,
      updatesCount: this.updatesCount
    };
  }
}

export default SACLagrangianContinuousPricing;
