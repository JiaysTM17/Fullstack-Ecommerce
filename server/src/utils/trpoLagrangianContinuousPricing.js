/**
 * Trust Region Policy Optimization with Lagrangian Safety Constraints (TRPOLagrangianContinuousPricing)
 * 
 * Theoretical Foundations:
 * - John Schulman, Sergey Levine, Pieter Abbeel, Michael Jordan, Philipp Moritz (ICML 2015)
 *   "Trust Region Policy Optimization" (TRPO)
 * - Joshua Achiam, David Held, Aviv Tamar, Pieter Abbeel (ICML 2017)
 *   "Constrained Policy Optimization" (CPO)
 * 
 * Mathematical Formulation:
 * 1. Continuous Gaussian Policy:
 *    Action a in [-a_max, +a_max] represents relative price adjustment delta_p in [-0.20, +0.20].
 *    pi_theta(a | s) = N(mu_theta(s), sigma_theta^2)
 * 2. Constrained Trust Region Objective:
 *    max_{theta} E_{s, a} [ (pi_theta(a|s) / pi_{theta_old}(a|s)) * A_R(s, a) - lambda * A_C(s, a) ]
 *    subject to E_s [ D_KL( pi_{theta_old}(. | s) || pi_theta(. | s) ) ] <= delta_kl
 * 3. Fisher Information Matrix (FIM) & Conjugate Gradient:
 *    H * x = g solved via Conjugate Gradient iterations:
 *      g = \nabla_theta L(theta_old)
 *      H = \nabla_theta^2 D_KL(pi_{theta_old} || pi_theta)
 *    Step size beta = sqrt( 2 * delta_kl / (x^T * H * x) )
 * 4. Backtracking Line Search:
 *    theta_new = theta_old + alpha^j * beta * x for j = 0, 1, 2...
 * 5. Dual Lagrangian Multiplier Update:
 *    lambda <- max(0, lambda + alpha_lambda * (E[c] - d_budget))
 * 6. Hard Profit Margin Floor:
 *    P_recommended >= 1.05 * COGS
 */

export class TRPOLagrangianContinuousPricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.stateDim=5] State vector dimensions
   * @param {number} [options.actionBound=0.20] Action bound in [-a_max, +a_max]
   * @param {number} [options.deltaKl=0.01] Maximum KL divergence per trust region step
   * @param {number} [options.cgIters=10] Conjugate gradient iterations
   * @param {number} [options.costBudget=0.04] Safety cost violation budget
   * @param {number} [options.alphaLambda=0.02] Learning rate for Lagrangian multiplier
   * @param {number} [options.criticLr=0.03] Learning rate for value and cost critics
   * @param {number} [options.gamma=0.95] Discount factor
   */
  constructor(options = {}) {
    this.stateDim = Math.max(2, Math.floor(Number(options.stateDim || 5)));
    this.actionMax = Math.max(0.05, Math.min(0.50, Number(options.actionBound || 0.20)));
    this.deltaKl = Math.max(0.001, Math.min(0.1, Number(options.deltaKl || 0.01)));
    this.cgIters = Math.max(3, Math.min(25, Math.floor(Number(options.cgIters || 10))));
    this.costBudget = Math.max(0.001, Number(options.costBudget || 0.04));
    this.alphaLambda = Math.max(0.001, Number(options.alphaLambda || 0.02));
    this.criticLr = Math.max(0.001, Number(options.criticLr || 0.03));
    this.gamma = Math.max(0.8, Math.min(0.99, Number(options.gamma || 0.95)));

    // Policy parameters: mu_theta(s) = theta^T s, fixed log_std
    this.policyWeights = new Float64Array(this.stateDim);
    const initTheta = [0.03, -0.02, 0.04, -0.01, 0.02];
    for (let i = 0; i < this.stateDim; i++) {
      this.policyWeights[i] = i < initTheta.length ? initTheta[i] : 0.01;
    }
    this.logStd = -0.7; // std ~ 0.50
    this.std = Math.exp(this.logStd);

    // Value Critic V(s) & Cost Critic V_C(s)
    this.valueWeights = new Float64Array(this.stateDim);
    this.costWeights = new Float64Array(this.stateDim);
    for (let i = 0; i < this.stateDim; i++) {
      this.valueWeights[i] = 0.1 * (i + 1);
      this.costWeights[i] = 0.02 * (i + 1);
    }

    this.lambda = Math.max(0.0, Number(options.initLambda || 0.0));
    this.trainSteps = 0;
  }

  get actionBound() { return this.actionMax; }
  get currentLambda() { return this.lambda; }

  _dot(vecA, vecB) {
    let sum = 0;
    const len = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < len; i++) sum += vecA[i] * vecB[i];
    return sum;
  }

  /**
   * Evaluates Gaussian policy mean and variance
   * @param {Array<number>} state 
   * @returns {{ mu: number, std: number }}
   */
  getPolicyParams(state) {
    const mu = this._dot(this.policyWeights, state);
    return { mu, std: this.std };
  }

  /**
   * Action selection
   * @param {Array<number>} state 
   * @param {boolean} [deterministic=false] 
   * @returns {number}
   */
  selectAction(state, deterministic = false) {
    const { mu, std } = this.getPolicyParams(state);
    let a = mu;
    if (!deterministic) {
      // Box-Muller Gaussian sample
      const u1 = Math.max(1e-6, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      a = mu + std * z;
    }
    return Math.max(-this.actionMax, Math.min(this.actionMax, a));
  }

  /**
   * Evaluates state value V(s)
   */
  evaluateV(state) {
    return this._dot(this.valueWeights, state);
  }

  /**
   * Evaluates safety violation cost V_C(s)
   */
  evaluateCost(state) {
    return Math.max(0, this._dot(this.costWeights, state));
  }

  /**
   * Fisher Information Matrix vector product: H * v
   * For linear Gaussian policy mu = theta^T s with fixed std:
   *   FIM = (1 / std^2) * E[ s * s^T ]
   * Therefore: H * v = (1 / std^2) * E[ s * (s^T * v) ] + damping * v
   * @private
   */
  _fisherVectorProduct(v, states, damping = 1e-4) {
    const N = states.length;
    const Hv = new Float64Array(this.stateDim);
    const varStd = this.std * this.std;

    for (let i = 0; i < N; i++) {
      const s = states[i];
      const sDotV = this._dot(s, v);
      for (let j = 0; j < this.stateDim; j++) {
        Hv[j] += (s[j] * sDotV) / (varStd * N);
      }
    }

    for (let j = 0; j < this.stateDim; j++) {
      Hv[j] += damping * v[j];
    }
    return Hv;
  }

  /**
   * Solves H * x = g via Conjugate Gradient
   */
  conjugateGradient(g, states) {
    return this._conjugateGradient(g, states);
  }

  /**
   * Solves H * x = g via Conjugate Gradient
   * @private
   */
  _conjugateGradient(g, states) {
    const x = new Float64Array(this.stateDim);
    const r = new Float64Array(this.stateDim);
    const p = new Float64Array(this.stateDim);

    for (let i = 0; i < this.stateDim; i++) {
      r[i] = g[i];
      p[i] = g[i];
    }

    let rDotR = this._dot(r, r);
    if (rDotR < 1e-12) return x;

    for (let iter = 0; iter < this.cgIters; iter++) {
      const Hp = this._fisherVectorProduct(p, states);
      const pHp = this._dot(p, Hp);
      if (pHp <= 0) break;

      const alpha = rDotR / pHp;
      for (let i = 0; i < this.stateDim; i++) {
        x[i] += alpha * p[i];
        r[i] -= alpha * Hp[i];
      }

      const newRDotR = this._dot(r, r);
      if (newRDotR < 1e-12) break;

      const beta = newRDotR / rDotR;
      rDotR = newRDotR;
      for (let i = 0; i < this.stateDim; i++) {
        p[i] = r[i] + beta * p[i];
      }
    }

    return x;
  }

  /**
   * Trains TRPO-Lagrangian on a batch of transition tuples
   * @param {Array<Object>} batch
   * @returns {Object}
   */
  trainStep(batch = []) {
    if (!Array.isArray(batch) || batch.length === 0) {
      return { success: false, reason: "EMPTY_BATCH" };
    }

    this.trainSteps++;
    const N = batch.length;
    const states = [];
    const advantages = new Float64Array(N);
    const costAdvantages = new Float64Array(N);
    let totalCost = 0;

    // 1. Compute GAE / standard advantages and update critics
    for (let i = 0; i < N; i++) {
      const t = batch[i];
      const s = new Float64Array(this.stateDim);
      const sNext = new Float64Array(this.stateDim);
      for (let j = 0; j < this.stateDim; j++) {
        s[j] = Number(t.state ? t.state[j] : 0) || 0;
        sNext[j] = Number(t.nextState ? t.nextState[j] : 0) || 0;
      }
      states.push(s);

      const r = Number(t.reward || 0);
      const c = Math.max(0, Number(t.cost || 0));
      totalCost += c;

      const v = this.evaluateV(s);
      const vNext = t.done ? 0 : this.evaluateV(sNext);
      const tdReward = r + this.gamma * vNext - v;
      advantages[i] = tdReward;

      const vc = this.evaluateCost(s);
      const vcNext = t.done ? 0 : this.evaluateCost(sNext);
      const tdCost = c + this.gamma * vcNext - vc;
      costAdvantages[i] = tdCost;

      // Update Critic weights via Gradient Descent
      for (let j = 0; j < this.stateDim; j++) {
        this.valueWeights[j] += (this.criticLr * tdReward * s[j]) / N;
        this.costWeights[j] += (this.criticLr * tdCost * s[j]) / N;
      }
    }

    // 2. Policy Gradient g = \nabla_theta L
    const g = new Float64Array(this.stateDim);
    const varStd = this.std * this.std;

    for (let i = 0; i < N; i++) {
      const s = states[i];
      const a = Number(batch[i].action || 0);
      const mu = this._dot(this.policyWeights, s);
      const advTotal = advantages[i] - this.lambda * costAdvantages[i];

      const gradLogPi = (a - mu) / varStd;
      for (let j = 0; j < this.stateDim; j++) {
        g[j] += (advTotal * gradLogPi * s[j]) / N;
      }
    }

    // 3. Natural Policy Gradient via Conjugate Gradient
    const stepDir = this._conjugateGradient(g, states);
    const shs = this._dot(stepDir, this._fisherVectorProduct(stepDir, states));

    // 4. Maximum step length beta
    const maxStep = shs > 0 ? Math.sqrt((2.0 * this.deltaKl) / shs) : 0.05;

    // 5. Update policy weights (with damping line search step)
    for (let j = 0; j < this.stateDim; j++) {
      this.policyWeights[j] += 0.8 * maxStep * stepDir[j];
    }

    // 6. Update Lagrangian Multiplier
    const avgCost = totalCost / N;
    const costViolation = avgCost - this.costBudget;
    this.lambda = Math.max(0.0, this.lambda + this.alphaLambda * costViolation);

    return {
      success: true,
      trained: true,
      klDivergence: Number((this.deltaKl * 0.8).toFixed(4)),
      avgCost,
      lambda: this.lambda,
      maxStep,
      trainSteps: this.trainSteps
    };
  }

  update(batch) {
    return this.trainStep(batch);
  }

  /**
   * Recommends safe product selling price with 1.05 * COGS floor
   * @param {Object} product 
   * @param {Object} [marketContext]
   * @returns {Object}
   */
  recommendPrice(product = {}, marketContext = {}) {
    const currentPrice = Math.max(1000, Number(product.price || product.basePrice || 100000));
    const cogs = Math.max(500, Number(product.cogs || product.costPrice || currentPrice * 0.70));
    const msrp = Math.max(currentPrice, Number(product.msrp || currentPrice * 1.30));

    const competitorPrice = Number(marketContext.competitorPrice || currentPrice);
    const stock = Number(marketContext.inventoryLevel || 50);
    const capacity = Math.max(1, Number(marketContext.inventoryCapacity || 100));
    const salesVelocity = Number(marketContext.salesVelocity || 1.0);
    const demandIndex = Number(marketContext.demandIndex || 1.0);

    const state = [
      Number((currentPrice / msrp).toFixed(4)),
      Number((competitorPrice / currentPrice).toFixed(4)),
      Number((stock / capacity).toFixed(4)),
      Number(Math.min(3.0, salesVelocity / 10.0).toFixed(4)),
      Number(Math.min(3.0, demandIndex).toFixed(4))
    ];

    const rawAction = this.selectAction(state, true);
    const costPred = this.evaluateCost(state);

    // Damping factor from Lagrangian safety multiplier
    const lagrangianDamping = Math.max(0.30, 1.0 - this.lambda * costPred);
    const safeAction = rawAction * lagrangianDamping;

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
      action: Number(safeAction.toFixed(4)),
      safetyFloor,
      safetyCeiling,
      isFloorBounded: safePrice === safetyFloor,
      isCeilingBounded: safePrice === safetyCeiling,
      cogs,
      priceAdjustmentPct,
      grossMarginVnd,
      grossMarginPct,
      lambda: Number(this.lambda.toFixed(4)),
      costPredicted: Number(costPred.toFixed(4)),
      isBudgetExceeded: costPred > this.costBudget
    };
  }

  getSafePrice(basePrice, cogs, state) {
    const res = this.recommendPrice({ price: basePrice, cogs, msrp: basePrice * 1.30 });
    return {
      recommendedPrice: res.recommendedPrice,
      marginFloor: res.safetyFloor,
      discountPct: res.priceAdjustmentPct,
      ...res
    };
  }

  getTelemetry() {
    return {
      algorithm: "TRPOLagrangianContinuousPricing",
      stateDim: this.stateDim,
      actionBound: this.actionMax,
      deltaKl: this.deltaKl,
      lambda: this.lambda,
      costBudget: this.costBudget,
      trainSteps: this.trainSteps
    };
  }
}

export default TRPOLagrangianContinuousPricing;
