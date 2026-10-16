/**
 * PPO-Clip with Continuous Action Space & Lagrangian Safety Constraints (PPOClipLagrangianContinuousPricing)
 * 
 * Theoretical Foundations:
 * - John Schulman, Filip Wolski, Prafulla Dhariwal, Alec Radford, Oleg Klimov (arXiv:1707.06347, 2017)
 *   "Proximal Policy Optimization Algorithms" (PPO-Clip)
 * - Joshua Achiam, David Held, Aviv Tamar, Pieter Abbeel (ICML 2017)
 *   "Constrained Policy Optimization" (CPO)
 * 
 * Mathematical Formulation:
 * 1. Continuous Gaussian Policy:
 *    pi_theta(a | s) = (1 / (sqrt(2*pi) * sigma)) * exp( - (a - mu_theta(s))^2 / (2 * sigma^2) )
 *    Log likelihood: log pi_theta(a | s) = -0.5 * log(2*pi) - log(sigma) - (a - mu)^2 / (2 * sigma^2)
 * 2. PPO-Clip Surrogate Objective with Lagrangian Cost:
 *    Probability ratio: r_t(theta) = pi_theta(a_t | s_t) / pi_{theta_old}(a_t | s_t)
 *    Total constrained advantage: A_t^{total} = A_t^R - lambda * A_t^C
 *    L^{CLIP}(theta) = E_t [ min( r_t(theta) * A_t^{total}, clip(r_t(theta), 1 - eps, 1 + eps) * A_t^{total} ) ]
 * 3. Entropy Regularization:
 *    H(pi_theta) = 0.5 * (1 + log(2 * pi * sigma^2))
 * 4. Dual Multiplier Ascent:
 *    lambda <- max(0, lambda + alpha_lambda * (E[cost] - d_budget))
 * 5. Margin Preservation Floor:
 *    P_recommended >= 1.05 * COGS
 */

export class PPOClipLagrangianContinuousPricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.stateDim=5] State vector dimension
   * @param {number} [options.actionBound=0.20] Action bound in [-a_max, +a_max]
   * @param {number} [options.clipEps=0.20] PPO clip parameter epsilon (typically 0.20)
   * @param {number} [options.entropyCoeff=0.01] Entropy exploration coefficient
   * @param {number} [options.costBudget=0.04] Safety violation budget
   * @param {number} [options.alphaLambda=0.02] Learning rate for Lagrangian multiplier
   * @param {number} [options.actorLr=0.02] Actor learning rate
   * @param {number} [options.criticLr=0.03] Value and cost critic learning rate
   * @param {number} [options.gamma=0.95] Discount factor
   */
  constructor(options = {}) {
    this.stateDim = Math.max(2, Math.floor(Number(options.stateDim || 5)));
    this.actionMax = Math.max(0.05, Math.min(0.50, Number(options.actionBound || 0.20)));
    this.clipEps = Math.max(0.05, Math.min(0.40, Number(options.clipEps || 0.20)));
    this.entropyCoeff = Math.max(0.0001, Number(options.entropyCoeff || 0.01));
    this.costLimit = options.costLimit !== undefined ? Number(options.costLimit) : (options.costBudget !== undefined ? Number(options.costBudget) : 0.04);
    this.costBudget = this.costLimit;
    this.lambdaLr = options.lambdaLr !== undefined ? Number(options.lambdaLr) : (options.alphaLambda !== undefined ? Number(options.alphaLambda) : 0.02);
    this.alphaLambda = this.lambdaLr;
    this.cogsFloorMultiplier = Number(options.cogsFloorMultiplier || 1.05);

    if (options.minAction !== undefined || options.maxAction !== undefined) {
      this.actionMax = Math.max(Math.abs(Number(options.minAction) || 0.2), Math.abs(Number(options.maxAction) || 0.2));
    }

    this.actorLr = Math.max(0.001, Number(options.actorLr || 0.02));
    this.criticLr = Math.max(0.001, Number(options.criticLr || 0.03));
    this.gamma = Math.max(0.8, Math.min(0.99, Number(options.gamma || 0.95)));

    // Policy parameters
    this.policyWeights = new Float64Array(this.stateDim);
    const initWeights = [0.04, -0.02, 0.03, -0.01, 0.02];
    for (let i = 0; i < this.stateDim; i++) {
      this.policyWeights[i] = i < initWeights.length ? initWeights[i] : 0.01;
    }
    this.logStd = -0.7; // sigma ~ 0.50
    this.std = Math.exp(this.logStd);

    // Value Critic & Cost Critic
    this.valueWeights = new Float64Array(this.stateDim);
    this.costWeights = new Float64Array(this.stateDim);

    // Dual multiplier lambda
    this.lambda = Number(options.lambda !== undefined ? options.lambda : 0.0);
    this.trainSteps = 0;
  }

  _dot(w, s) {
    let sum = 0;
    for (let i = 0; i < this.stateDim; i++) {
      sum += (w[i] || 0) * (s[i] || 0);
    }
    return sum;
  }

  _logProb(a, mu) {
    const varStd = this.std * this.std;
    const diff = a - mu;
    return -0.5 * Math.log(2 * Math.PI) - this.logStd - (diff * diff) / (2 * varStd);
  }

  /**
   * Samples or evaluates action from Gaussian policy
   * @param {number[]} state
   * @param {boolean} [deterministic=false]
   * @returns {Object}
   */
  selectAction(state, deterministic = false) {
    const mu = this._dot(this.policyWeights, state);
    let chosenA = mu;
    if (!deterministic) {
      // Box-Muller transform for standard normal sample
      const u1 = Math.max(1e-7, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      chosenA = mu + this.std * z;
    }
    const clampedA = Math.max(-this.actionMax, Math.min(this.actionMax, chosenA));
    const logP = this._logProb(clampedA, mu);

    const result = {
      action: clampedA,
      logProb: logP,
      mean: mu,
      valueOf() { return clampedA; },
      toString() { return String(clampedA); },
      [Symbol.toPrimitive](hint) {
        if (hint === 'string') return String(clampedA);
        return clampedA;
      }
    };
    return result;
  }

  evaluateV(state) {
    return this._dot(this.valueWeights, state);
  }

  evaluateCost(state) {
    return Math.max(0, this._dot(this.costWeights, state));
  }

  /**
   * PPO-Clip Policy Update with continuous action surrogate objective
   * @param {Array<{ state: number[], action: number, reward: number, cost: number, nextState: number[], done: boolean }>} batch
   * @returns {Object}
   */
  trainStep(batch = []) {
    if (!Array.isArray(batch) || batch.length === 0) {
      return { success: false, trained: false, reason: "EMPTY_BATCH" };
    }

    this.trainSteps++;
    const N = batch.length;
    const states = [];
    const actions = new Float64Array(N);
    const oldLogProbs = new Float64Array(N);
    const advantages = new Float64Array(N);
    const costAdvantages = new Float64Array(N);
    let totalCost = 0;
    let totalVLoss = 0;
    let totalCostLoss = 0;

    for (let i = 0; i < N; i++) {
      const t = batch[i];
      const s = new Float64Array(this.stateDim);
      const sNext = new Float64Array(this.stateDim);
      for (let j = 0; j < this.stateDim; j++) {
        s[j] = Number(t.state ? t.state[j] : 0) || 0;
        sNext[j] = Number(t.nextState ? t.nextState[j] : 0) || 0;
      }
      states.push(s);

      const a = Number(t.action || 0);
      actions[i] = a;
      const muOld = this._dot(this.policyWeights, s);
      oldLogProbs[i] = t.oldLogProb !== undefined ? Number(t.oldLogProb) : this._logProb(a, muOld);

      const r = Number(t.reward || 0);
      const c = Math.max(0, Number(t.cost || 0));
      totalCost += c;

      const v = this.evaluateV(s);
      const vNext = t.done ? 0 : this.evaluateV(sNext);
      const tdReward = r + this.gamma * vNext - v;
      advantages[i] = tdReward;
      totalVLoss += tdReward * tdReward;

      const vc = this.evaluateCost(s);
      const vcNext = t.done ? 0 : this.evaluateCost(sNext);
      const tdCost = c + this.gamma * vcNext - vc;
      costAdvantages[i] = tdCost;
      totalCostLoss += tdCost * tdCost;

      // Update Critic weights via SGD
      for (let j = 0; j < this.stateDim; j++) {
        this.valueWeights[j] += (this.criticLr * tdReward * s[j]) / N;
        this.costWeights[j] += (this.criticLr * tdCost * s[j]) / N;
      }
    }

    // PPO-Clip Policy Gradient
    const varStd = this.std * this.std;
    let clipCount = 0;
    let totalActorLoss = 0;
    let totalRatio = 0;

    for (let i = 0; i < N; i++) {
      const s = states[i];
      const a = actions[i];
      const mu = this._dot(this.policyWeights, s);
      const newLogProb = this._logProb(a, mu);
      const ratio = Math.exp(Math.max(-10, Math.min(10, newLogProb - oldLogProbs[i])));
      totalRatio += ratio;

      // Total advantage with Lagrangian safety multiplier
      const advTotal = advantages[i] - this.lambda * costAdvantages[i];

      const surr1 = ratio * advTotal;
      const clampedRatio = Math.max(1.0 - this.clipEps, Math.min(1.0 + this.clipEps, ratio));
      const surr2 = clampedRatio * advTotal;

      totalActorLoss += -Math.min(surr1, surr2);

      if (Math.abs(ratio - 1.0) > this.clipEps) clipCount++;

      // Effective gradient weight from PPO clipping
      const gradWeight = surr1 <= surr2 ? ratio : 0.0;
      const gradLogPi = (a - mu) / varStd;

      for (let j = 0; j < this.stateDim; j++) {
        const ppoGrad = (gradWeight * advTotal * gradLogPi * s[j]) / N;
        this.policyWeights[j] += this.actorLr * ppoGrad;
      }
    }

    // Dual Lagrangian update
    const avgCost = totalCost / N;
    const costViolation = avgCost - this.costBudget;
    this.lambda = Math.max(0.0, this.lambda + this.alphaLambda * costViolation);

    return {
      success: true,
      trained: true,
      actorLoss: totalActorLoss / N,
      vLoss: totalVLoss / N,
      costLoss: totalCostLoss / N,
      avgRatio: totalRatio / N,
      avgCost,
      lambda: this.lambda,
      clippedRatioPct: Number(((clipCount / N) * 100).toFixed(1)),
      trainSteps: this.trainSteps
    };
  }

  update(batch) {
    return this.trainStep(batch);
  }

  /**
   * Recommends safe selling price for product
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

    const rawActionObj = this.selectAction(state, true);
    const rawAction = typeof rawActionObj === "number" ? rawActionObj : rawActionObj.action;
    const costPred = this.evaluateCost(state);

    // Lagrangian safety damping
    const lagrangianDamping = Math.max(0.30, 1.0 - this.lambda * costPred);
    const safeAction = rawAction * lagrangianDamping;

    const rawPrice = currentPrice * (1.0 + safeAction);
    const safetyFloor = Math.round(cogs * this.cogsFloorMultiplier);
    const safetyCeiling = Math.round(msrp * 1.25);

    const safePrice = Math.round(Math.max(safetyFloor, Math.min(safetyCeiling, rawPrice)));
    const priceAdjustmentPct = Number((((safePrice - currentPrice) / currentPrice) * 100).toFixed(2));
    const grossMarginVnd = safePrice - cogs;
    const grossMarginPct = Number(((grossMarginVnd / safePrice) * 100).toFixed(2));

    return {
      currentPrice,
      recommendedPrice: safePrice,
      action: Number(safeAction.toFixed(4)),
      floorPrice: safetyFloor,
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
    return res.recommendedPrice;
  }

  getTelemetry() {
    return {
      algorithm: "PPOClipLagrangianContinuousPricing",
      stateDim: this.stateDim,
      actionBound: this.actionMax,
      clipEps: this.clipEps,
      lambda: this.lambda,
      costBudget: this.costBudget,
      trainSteps: this.trainSteps
    };
  }
}

export default PPOClipLagrangianContinuousPricing;
