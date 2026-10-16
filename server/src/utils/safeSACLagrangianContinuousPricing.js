/**
 * Safe Soft Actor-Critic with Lagrangian Constraints for Continuous Dynamic Pricing
 * (SafeSACLagrangianContinuousPricing)
 * 
 * Theoretical Foundations:
 * - Tuomas Haarnoja, Aurick Zhou, Pieter Abbeel, Sergey Levine (ICML 2018)
 *   "Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor"
 * - Tuomas Haarnoja et al. (2018)
 *   "Soft Actor-Critic Algorithms and Applications"
 * - Joshua Achiam, David Held, Aviv Tamar, Pieter Abbeel (ICML 2017)
 *   "Constrained Policy Optimization"
 * - Alex Ray, Joshua Achiam, Dario Amodei (Safety Gym / OpenAI 2019)
 *   "Benchmarking Safe Exploration in Deep Reinforcement Learning"
 * 
 * Mathematical Formulation:
 * 1. State Representation (5-dim normalized):
 *    s = [cogs_norm, competitor_ratio, inventory_ratio, elasticity_norm, hour_norm]
 * 2. Squashed Gaussian Policy with Reparameterization Trick:
 *    u ~ N(mu(s), sigma(s)) where mu = W_mu * s + b_mu, log_sigma = clamp(W_sigma * s + b_sigma, -5, 2)
 *    Action a = tanh(u) in (-1, 1)
 *    Log-probability with Jacobian correction:
 *      log pi(a|s) = log N(u; mu, sigma) - sum(log(1 - a^2 + 1e-6))
 * 3. Continuous Price Mapping:
 *    p = p_min + ((1 + a) / 2) * (p_max - p_min)
 *    Strict Hard Floor: p >= 1.05 * COGS (5% gross margin guarantee)
 * 4. Twin Soft Q-Critics & Target Networks:
 *    To prevent overestimation bias:
 *      y_r = r + gamma * (min(Q_targ1(s', a'), Q_targ2(s', a')) - alpha * log pi(a'|s'))
 *    Weights updated via Polyak averaging: theta_targ <- tau * theta + (1 - tau) * theta_targ
 * 5. Automatic Entropy Temperature Tuning (alpha):
 *    Target entropy H_bar = -dim(A) = -1.0
 *    log_alpha <- log_alpha - eta_alpha * (log pi(a|s) + H_bar)
 *    alpha = exp(log_alpha)
 * 6. Safety Cost Critic & Dual Multiplier Ascent (lambda):
 *    Cost signal c(s, a) = max(0, 1.05 * COGS - p) / COGS
 *    y_c = c + gamma_c * C_targ(s', a')
 *    Dual ascent: lambda <- max(0, lambda + eta_lambda * (c_bar - d_budget))
 * 7. Policy Objective:
 *    max_theta E [ min(Q_1, Q_2) - alpha * log pi(a|s) - lambda * C(s, a) ]
 */

export class SafeSACLagrangianContinuousPricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.stateDim=5] State vector dimensionality
   * @param {number} [options.gamma=0.98] Discount factor
   * @param {number} [options.tau=0.01] Polyak moving average rate
   * @param {number} [options.alpha=0.2] Initial temperature parameter
   * @param {number} [options.targetEntropy=-1.0] Target entropy \bar{H}
   * @param {number} [options.costBudget=0.02] Safety cost constraint budget
   * @param {number} [options.lrActor=0.005] Actor learning rate
   * @param {number} [options.lrCritic=0.01] Critic learning rate
   * @param {number} [options.lrDual=0.02] Lagrangian multiplier ascent rate
   */
  constructor(options = {}) {
    this.stateDim = options.stateDim || 5;
    this.gamma = options.gamma !== undefined ? options.gamma : 0.98;
    this.tau = options.tau !== undefined ? options.tau : 0.01;
    this.costBudget = options.costBudget !== undefined ? options.costBudget : 0.02;

    this.lrActor = options.lrActor || 0.005;
    this.lrCritic = options.lrCritic || 0.01;
    this.lrDual = options.lrDual || 0.02;
    this.lrAlpha = options.lrAlpha || 0.01;

    // Automatic Entropy Temperature Tuning
    this.targetEntropy = options.targetEntropy !== undefined ? options.targetEntropy : -1.0;
    const initialAlpha = Math.max(0.01, options.alpha || 0.2);
    this.logAlpha = Math.log(initialAlpha);

    // Lagrangian multiplier lambda >= 0
    this.lambda = Math.max(0, options.lambda || 0.0);

    // Gaussian Actor parameters (linear projections for mean and log_std)
    this.wMean = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bMean = 0.0;
    this.wLogStd = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.05);
    this.bLogStd = -0.5; // Initial std ~ exp(-0.5) ~ 0.606

    // Twin Q-Critics (Q1, Q2): state (5) + action (1) = 6 dims
    this.dimQA = this.stateDim + 1;
    this.wQ1 = new Array(this.dimQA).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bQ1 = 0.0;
    this.wQ2 = new Array(this.dimQA).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bQ2 = 0.0;

    // Target Q-Critics
    this.wQ1Target = [...this.wQ1];
    this.bQ1Target = this.bQ1;
    this.wQ2Target = [...this.wQ2];
    this.bQ2Target = this.bQ2;

    // Safety Cost Critic (C)
    this.wC = new Array(this.dimQA).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bC = 0.0;
    this.wCTarget = [...this.wC];
    this.bCTarget = this.bC;

    // Training statistics tracking
    this.stepCount = 0;
    this.totalReward = 0;
    this.totalCostViolations = 0;
  }

  get alpha() {
    return Math.exp(this.logAlpha);
  }

  /**
   * Gaussian probability density function log N(u; mu, sigma)
   */
  _gaussianLogProb(u, mean, std) {
    const varSq = std * std;
    return -0.5 * Math.log(2 * Math.PI) - Math.log(std) - ((u - mean) * (u - mean)) / (2 * varSq);
  }

  /**
   * Evaluates Q-network for state s and continuous action a
   */
  _evalQ(weights, bias, state, action) {
    let sum = bias;
    for (let i = 0; i < this.stateDim; i++) {
      sum += weights[i] * state[i];
    }
    sum += weights[this.stateDim] * action;
    return sum;
  }

  /**
   * Generates continuous action a in [-1, 1] via squashed Gaussian policy
   * @param {number[]} state
   * @param {boolean} [evaluate=false] Deterministic mean mode
   */
  selectAction(state, evaluate = false) {
    let mean = this.bMean;
    let logStd = this.bLogStd;
    for (let i = 0; i < this.stateDim; i++) {
      mean += this.wMean[i] * state[i];
      logStd += this.wLogStd[i] * state[i];
    }
    logStd = Math.max(-5, Math.min(2, logStd));
    const std = Math.exp(logStd);

    let u;
    if (evaluate) {
      u = mean;
    } else {
      // Box-Muller transform for standard normal sample
      const u1 = Math.max(1e-7, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      u = mean + std * z;
    }

    const action = Math.tanh(u);
    // Jacobian log-determinant correction for tanh squashing
    const rawLogProb = this._gaussianLogProb(u, mean, std);
    const squashedLogProb = rawLogProb - Math.log(Math.max(1e-6, 1 - action * action));

    const result = {
      action: Number(action.toFixed(5)),
      rawU: u,
      mean: Number(mean.toFixed(5)),
      std: Number(std.toFixed(5)),
      logProb: Number(squashedLogProb.toFixed(5)),
      alpha: Number(this.alpha.toFixed(5)),
      lambda: Number(this.lambda.toFixed(5)),
      valueOf() {
        return this.action;
      },
      [Symbol.toPrimitive](hint) {
        if (hint === "number") return this.action;
        return `[SafeSAC a=${this.action.toFixed(4)}, p=${this.action}]`;
      }
    };

    return result;
  }

  /**
   * Updates actor, twin critics, cost critic, temperature alpha, and dual multiplier lambda
   * @param {Object} batch
   * @param {number[]} batch.state
   * @param {number} batch.action
   * @param {number} batch.reward
   * @param {number} batch.cost
   * @param {number[]} batch.nextState
   * @param {boolean} [batch.done=false]
   */
  update(batch) {
    const { state, action, reward, cost, nextState, done = false } = batch;
    this.stepCount += 1;

    // 1. Sample next action from current policy for target Bellman value
    const nextActObj = this.selectAction(nextState, false);
    const aNext = nextActObj.action;
    const logProbNext = nextActObj.logProb;

    // Target Q-values
    const q1Targ = this._evalQ(this.wQ1Target, this.bQ1Target, nextState, aNext);
    const q2Targ = this._evalQ(this.wQ2Target, this.bQ2Target, nextState, aNext);
    const minQTarg = Math.min(q1Targ, q2Targ);

    const discount = done ? 0 : this.gamma;
    const targetQ = reward + discount * (minQTarg - this.alpha * logProbNext);

    // Current Q-values
    const q1Curr = this._evalQ(this.wQ1, this.bQ1, state, action);
    const q2Curr = this._evalQ(this.wQ2, this.bQ2, state, action);

    // Critic gradients & updates (MSE loss)
    const errQ1 = q1Curr - targetQ;
    const errQ2 = q2Curr - targetQ;

    for (let i = 0; i < this.stateDim; i++) {
      this.wQ1[i] -= this.lrCritic * errQ1 * state[i];
      this.wQ2[i] -= this.lrCritic * errQ2 * state[i];
    }
    this.wQ1[this.stateDim] -= this.lrCritic * errQ1 * action;
    this.wQ2[this.stateDim] -= this.lrCritic * errQ2 * action;
    this.bQ1 -= this.lrCritic * errQ1;
    this.bQ2 -= this.lrCritic * errQ2;

    // 2. Cost Critic update
    const cTarg = this._evalQ(this.wCTarget, this.bCTarget, nextState, aNext);
    const targetC = cost + discount * cTarg;
    const cCurr = this._evalQ(this.wC, this.bC, state, action);
    const errC = cCurr - targetC;

    for (let i = 0; i < this.stateDim; i++) {
      this.wC[i] -= this.lrCritic * errC * state[i];
    }
    this.wC[this.stateDim] -= this.lrCritic * errC * action;
    this.bC -= this.lrCritic * errC;

    // 3. Policy (Actor) update
    // Sample action at current state
    const currActObj = this.selectAction(state, false);
    const aPred = currActObj.action;
    const logProbPred = currActObj.logProb;

    // Gradient of min(Q1, Q2) - lambda * C w.r.t action a
    const dQ1da = this.wQ1[this.stateDim];
    const dQ2da = this.wQ2[this.stateDim];
    const dQda = q1Curr <= q2Curr ? dQ1da : dQ2da;
    const dCda = this.wC[this.stateDim];

    // Combined actor surrogate gradient: dJ/da = dQ/da - lambda * dC/da
    const gradAction = dQda - this.lambda * dCda;
    // Tanh derivative: da/du = 1 - a^2
    const da_du = Math.max(0.01, 1 - aPred * aPred);
    const effectiveGrad = gradAction * da_du;

    for (let i = 0; i < this.stateDim; i++) {
      this.wMean[i] += this.lrActor * effectiveGrad * state[i];
      // Entropy bonus on standard deviation
      this.wLogStd[i] += this.lrActor * (this.alpha - 0.1) * state[i];
    }
    this.bMean += this.lrActor * effectiveGrad;
    this.bLogStd += this.lrActor * (this.alpha - 0.1);
    this.bLogStd = Math.max(-5, Math.min(2, this.bLogStd));

    // 4. Automatic Entropy Temperature Update
    const alphaLossGrad = -(logProbPred + this.targetEntropy);
    this.logAlpha -= this.lrAlpha * alphaLossGrad;
    this.logAlpha = Math.max(-5, Math.min(2, this.logAlpha));

    // 5. Dual Multiplier Ascent (lambda)
    const costViolation = cost - this.costBudget;
    this.lambda = Math.max(0, this.lambda + this.lrDual * costViolation);

    // 6. Polyak Target Network Update
    for (let i = 0; i < this.dimQA; i++) {
      this.wQ1Target[i] = this.tau * this.wQ1[i] + (1 - this.tau) * this.wQ1Target[i];
      this.wQ2Target[i] = this.tau * this.wQ2[i] + (1 - this.tau) * this.wQ2Target[i];
      this.wCTarget[i] = this.tau * this.wC[i] + (1 - this.tau) * this.wCTarget[i];
    }
    this.bQ1Target = this.tau * this.bQ1 + (1 - this.tau) * this.bQ1Target;
    this.bQ2Target = this.tau * this.bQ2 + (1 - this.tau) * this.bQ2Target;
    this.bCTarget = this.tau * this.bC + (1 - this.tau) * this.bCTarget;

    return {
      lossQ1: Number((errQ1 * errQ1).toFixed(5)),
      lossQ2: Number((errQ2 * errQ2).toFixed(5)),
      lossCost: Number((errC * errC).toFixed(5)),
      alpha: Number(this.alpha.toFixed(5)),
      lambda: Number(this.lambda.toFixed(5)),
      qEst: Number(minQTarg.toFixed(4)),
      cEst: Number(cCurr.toFixed(4))
    };
  }

  /**
   * Enterprise Pricing Recommendation Engine
   * @param {Object} context
   * @param {number} context.cogs Cost of goods sold
   * @param {number} context.basePrice Reference market price
   * @param {number} [context.competitorPrice] Competitor price
   * @param {number} [context.inventory=100] Current stock
   * @param {number} [context.targetInventory=100] Ideal stock
   * @param {number} [context.priceElasticity=1.5] Demand elasticity
   * @param {number} [context.hourOfDay=12] Current hour (0-23)
   * @param {number} [context.minMarkup=1.05] Minimum gross margin multiplier
   */
  recommendPrice(context) {
    const cogs = Math.max(1000, Number(context.cogs || 100000));
    const basePrice = Math.max(cogs, Number(context.basePrice || cogs * 1.3));
    const competitorPrice = Number(context.competitorPrice || basePrice);
    const inventory = Math.max(0, Number(context.inventory || 100));
    const targetInventory = Math.max(1, Number(context.targetInventory || 100));
    const elasticity = Math.max(0.1, Number(context.priceElasticity || 1.5));
    const hour = Math.max(0, Math.min(23, Number(context.hourOfDay || 12)));
    const minMarkup = Math.max(1.01, Number(context.minMarkup || 1.05));

    // Form 5-dim normalized state vector
    const state = [
      Math.min(2.0, cogs / basePrice),
      Math.min(2.0, competitorPrice / basePrice),
      Math.min(2.0, inventory / targetInventory),
      Math.min(2.0, elasticity / 3.0),
      hour / 24.0
    ];

    // Select continuous action a in [-1, 1]
    const actRes = this.selectAction(state, true);
    const a = actRes.action;

    // Price action range: [pMin, pMax]
    const pMin = cogs * 0.95; // Unconstrained lower bound
    const pMax = basePrice * 1.5; // Upper bound
    const rawPrice = pMin + ((1 + a) / 2) * (pMax - pMin);

    // Apply strict Lagrangian safety floor: minimum markup * COGS
    const safeFloorPrice = Math.round(cogs * minMarkup);
    const recommendedPrice = Math.max(safeFloorPrice, Math.round(rawPrice));

    // Projected economics
    const expectedMargin = recommendedPrice - cogs;
    const grossMarginRate = Number((expectedMargin / recommendedPrice).toFixed(4));
    const expectedDemand = Math.max(1, Math.round(100 * Math.pow(basePrice / recommendedPrice, elasticity)));
    const expectedRevenue = recommendedPrice * expectedDemand;

    const safetyCost = Math.max(0, safeFloorPrice - rawPrice);
    const isSafe = rawPrice >= safeFloorPrice;

    return {
      recommendedPrice,
      rawPrice: Math.round(rawPrice),
      safeFloorPrice,
      isSafe,
      safetyCost: Math.round(safetyCost),
      expectedMargin,
      grossMarginRate,
      expectedDemand,
      expectedRevenue,
      actorAction: a,
      alphaTemperature: Number(this.alpha.toFixed(4)),
      lagrangianMultiplier: Number(this.lambda.toFixed(4)),
      costBudget: this.costBudget,
      summary: `Safe SAC continuous price: ${recommendedPrice.toLocaleString("vi-VN")} VND (Margin: ${(grossMarginRate * 100).toFixed(1)}%, alpha=${this.alpha.toFixed(3)}, lambda=${this.lambda.toFixed(3)})`
    };
  }
}
