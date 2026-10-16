/**
 * PPO-Lagrangian Constrained Safe Dynamic Pricing Engine
 * 
 * Based on foundational research:
 * - Joshua Achiam, David Held, Aviv Tamar, Pieter Abbeel (ICML 2017):
 *   "Constrained Policy Optimization"
 * - Alex Ray, Joshua Achiam, Dario Amodei (OpenAI Safety Starter 2019):
 *   "Benchmarking Safe Exploration in Deep Reinforcement Learning"
 * - Adam Stooke, Joshua Achiam, Pieter Abbeel (ICLR 2020):
 *   "Responsive Safety in Reinforcement Learning by PID Lagrangian Methods"
 * 
 * Mathematical Foundations:
 * - Maximize expected revenue J(theta) subject to business safety constraints:
 *   E[C_margin(theta)] <= d_margin  (Enforce minimum gross margin >= 5% over COGS)
 *   E[C_velocity(theta)] <= d_velocity (Enforce inventory velocity within safe bounds)
 * 
 * - Lagrangian Dual Formulation:
 *   L(theta, lambda) = J(theta) - lambda_margin * (C_margin(theta) - d_margin)
 *                              - lambda_vel * (C_vel(theta) - d_vel)
 * 
 * - Dual Multiplier Adaptive Update (Subgradient Ascent with projection onto R_+):
 *   lambda_k <- max(0, lambda_k + lr_lambda * (C_k(theta) - d_k))
 * 
 * - PPO Clipped Surrogate:
 *   L_CLIP(theta) = E [ min(r_t(theta) * A_t, clip(r_t(theta), 1 - eps, 1 + eps) * A_t) ]
 */

export class PPOLagrangianSafePricing {
  /**
   * @param {Object} options
   * @param {number} [options.basePrice=200000] Base product list price (VND)
   * @param {number} [options.cogs=120000] Cost of Goods Sold (VND)
   * @param {number} [options.clipEpsilon=0.20] PPO policy clipping threshold eps
   * @param {number} [options.lrDual=0.05] Dual learning rate for Lagrange multipliers
   * @param {number} [options.marginFloorRatio=1.05] Strict COGS safety multiplier
   * @param {number} [options.targetRunRate=10] Target sales velocity units/day
   */
  constructor(options = {}) {
    this.basePrice = Number(options.basePrice) || 200000;
    this.cogs = Number(options.cogs) || 120000;
    this.clipEpsilon = Number(options.clipEpsilon) || 0.20;
    this.lrDual = Number(options.lrDual) || 0.05;
    this.marginFloorRatio = Number(options.marginFloorRatio) || 1.05;
    this.targetRunRate = Number(options.targetRunRate) || 10;

    // Discrete action space (price multipliers relative to basePrice)
    this.actionMultipliers = [0.80, 0.85, 0.90, 0.95, 1.00, 1.05, 1.10, 1.15, 1.20];

    // Current policy logits and old policy probabilities
    this.policyLogits = new Array(this.actionMultipliers.length).fill(0.0);
    this.oldProbabilities = new Array(this.actionMultipliers.length).fill(1 / this.actionMultipliers.length);

    // Adaptive Lagrange multipliers for safety constraints (initialized to 0.1)
    this.lambdaMargin = 0.25;
    this.lambdaVelocity = 0.15;

    // Constraint thresholds
    this.dMargin = 0.0; // Margin deficit tolerance
    this.dVelocity = 3.0; // Velocity deviation tolerance (units/day)

    this.trainingStepsCount = 0;
  }

  /**
   * Softmax calculation with numerical stability
   * @param {Array<number>} logits
   * @returns {Array<number>}
   */
  _computeProbabilities(logits) {
    const maxVal = Math.max(...logits);
    const exps = logits.map(v => Math.exp(v - maxVal));
    const sumExps = exps.reduce((acc, v) => acc + v, 0);
    return exps.map(v => (sumExps > 0 ? v / sumExps : 1 / logits.length));
  }

  /**
   * Estimate demand based on constant elasticity demand curve
   * Demand(p) = BaseDemand * (p / BasePrice)^(-eta)
   * @param {number} price
   * @param {number} demandIndex
   * @returns {number} Estimated units per day
   */
  estimateDemand(price, demandIndex = 1.0) {
    const priceRatio = Math.max(0.2, price / this.basePrice);
    const elasticityEta = 1.6;
    const baseDemand = this.targetRunRate * demandIndex;
    const estimated = baseDemand * Math.pow(priceRatio, -elasticityEta);
    return Number(Math.max(0.5, estimated).toFixed(2));
  }

  /**
   * Evaluate cost constraint violations for a candidate price
   * @param {number} candidatePrice
   * @param {number} demand
   * @returns {{marginCost: number, velocityCost: number}}
   */
  evaluateConstraints(candidatePrice, demand) {
    const cogsFloor = this.cogs * this.marginFloorRatio;
    // Margin deficit in ratio units
    const marginDeficit = Math.max(0, (cogsFloor - candidatePrice) / this.basePrice);

    // Velocity deviation in units/day
    const velocityDeviation = Math.abs(demand - this.targetRunRate);

    return {
      marginCost: Number(marginDeficit.toFixed(4)),
      velocityCost: Number(velocityDeviation.toFixed(2))
    };
  }

  /**
   * Perform one step of PPO-Lagrangian update using observed trajectory transition
   * @param {number} actionMultiplier
   * @param {number} observedRevenue
   * @param {number} observedSalesUnits
   */
  updatePolicyAndDuals(actionMultiplier, observedRevenue, observedSalesUnits) {
    this.trainingStepsCount++;
    const actionIdx = this.actionMultipliers.indexOf(actionMultiplier);
    if (actionIdx === -1) return;

    const currentProbs = this._computeProbabilities(this.policyLogits);
    const oldProb = this.oldProbabilities[actionIdx] || (1 / this.actionMultipliers.length);
    const newProb = currentProbs[actionIdx];

    // Probability ratio r_t(theta) = pi_theta(a) / pi_old(a)
    const ratio = newProb / Math.max(1e-4, oldProb);

    // Baseline value (average revenue across base)
    const baselineRevenue = this.basePrice * this.targetRunRate * 0.9;
    const advantage = (observedRevenue - baselineRevenue) / Math.max(1, baselineRevenue);

    // Safety costs
    const candidatePrice = this.basePrice * actionMultiplier;
    const costs = this.evaluateConstraints(candidatePrice, observedSalesUnits);

    // PPO Clipped objective
    const unclipped = ratio * advantage;
    const clipped = Math.max(1 - this.clipEpsilon, Math.min(1 + this.clipEpsilon, ratio)) * advantage;
    const ppoLoss = Math.min(unclipped, clipped);

    // Lagrangian penalized loss: L_CLIP - lambda_margin * C_margin - lambda_vel * C_vel
    const totalPenalizedAdvantage = ppoLoss 
      - (this.lambdaMargin * costs.marginCost * 10) 
      - (this.lambdaVelocity * (costs.velocityCost / this.targetRunRate));

    // Policy gradient update for chosen action
    this.policyLogits[actionIdx] += 0.1 * totalPenalizedAdvantage;

    // Dual updates via subgradient ascent: lambda <- max(0, lambda + lr * (C - d))
    const marginConstraintViolation = costs.marginCost - this.dMargin;
    this.lambdaMargin = Number(Math.max(0, this.lambdaMargin + this.lrDual * marginConstraintViolation * 5).toFixed(4));

    const velConstraintViolation = (costs.velocityCost - this.dVelocity) / this.targetRunRate;
    this.lambdaVelocity = Number(Math.max(0, this.lambdaVelocity + this.lrDual * velConstraintViolation).toFixed(4));

    // Update old probabilities towards current
    this.oldProbabilities = this._computeProbabilities(this.policyLogits);
  }

  /**
   * Recommend safe optimal price under current constraints
   * @param {Object} item
   * @returns {Object} Pricing decision with safety metrics
   */
  recommendPrice(item = {}) {
    const basePrice = Number(item.basePrice) || this.basePrice;
    const cogs = Number(item.cogs) || this.cogs;
    const competitorPrice = Number(item.competitorPrice) || basePrice;
    const demandIndex = item.demandIndex !== undefined ? Number(item.demandIndex) : 1.0;
    const inventoryLevel = item.inventoryLevel !== undefined ? Number(item.inventoryLevel) : 100;

    const probs = this._computeProbabilities(this.policyLogits);
    const evaluatedActions = [];

    for (let i = 0; i < this.actionMultipliers.length; i++) {
      const mult = this.actionMultipliers[i];
      const proposedPrice = Math.round(basePrice * mult);
      const estDemand = this.estimateDemand(proposedPrice, demandIndex);
      const costs = this.evaluateConstraints(proposedPrice, estDemand);

      const expRevenue = Math.round(proposedPrice * estDemand);
      const marginVnd = proposedPrice - cogs;
      const marginPercent = Number(((marginVnd / proposedPrice) * 100).toFixed(2));

      // Lagrangian score = Expected Revenue - Lambda Penalties
      const lagrangianScore = Math.round(
        expRevenue 
        - (this.lambdaMargin * costs.marginCost * basePrice * estDemand)
        - (this.lambdaVelocity * costs.velocityCost * basePrice * 0.05)
      );

      evaluatedActions.push({
        priceMultiplier: mult,
        proposedPrice,
        estimatedDemand: estDemand,
        expectedRevenue: expRevenue,
        marginPercent,
        marginCost: costs.marginCost,
        velocityCost: costs.velocityCost,
        policyProbability: Number(probs[i].toFixed(4)),
        lagrangianScore
      });
    }

    // Select action maximizing Lagrangian score
    let bestIdx = 0;
    let maxScore = -Infinity;
    for (let i = 0; i < evaluatedActions.length; i++) {
      if (evaluatedActions[i].lagrangianScore > maxScore) {
        maxScore = evaluatedActions[i].lagrangianScore;
        bestIdx = i;
      }
    }

    const chosenAction = evaluatedActions[bestIdx];
    let recommendedPrice = chosenAction.proposedPrice;

    // Hard boundary enforcement: COGS floor and competitor ceiling
    const safetyFloor = Math.round(cogs * this.marginFloorRatio);
    const safetyCeiling = Math.round(competitorPrice * 1.25);

    let isFloorEnforced = false;
    if (recommendedPrice < safetyFloor) {
      recommendedPrice = safetyFloor;
      isFloorEnforced = true;
    } else if (recommendedPrice > safetyCeiling) {
      recommendedPrice = safetyCeiling;
    }

    const marginVnd = recommendedPrice - cogs;
    const marginPercent = Number(((marginVnd / recommendedPrice) * 100).toFixed(2));

    return {
      basePrice,
      cogs,
      competitorPrice,
      recommendedPrice,
      priceMultiplier: chosenAction.priceMultiplier,
      estimatedDemand: chosenAction.estimatedDemand,
      expectedRevenue: chosenAction.expectedRevenue,
      lagrangianScore: chosenAction.lagrangianScore,
      lambdaMargin: this.lambdaMargin,
      lambdaVelocity: this.lambdaVelocity,
      isFloorEnforced,
      safetyFloorVnd: safetyFloor,
      evaluatedActions,
      marginAnalysis: {
        marginVnd,
        marginPercent,
        isSafe: recommendedPrice >= safetyFloor
      },
      dualStatus: {
        lambdaMargin: this.lambdaMargin,
        lambdaVelocity: this.lambdaVelocity,
        trainingStepsCount: this.trainingStepsCount
      }
    };
  }
}

export default PPOLagrangianSafePricing;
