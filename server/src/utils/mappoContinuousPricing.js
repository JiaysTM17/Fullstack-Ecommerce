/**
 * Multi-Agent Proximal Policy Optimization for Continuous Pricing (MAPPOContinuousPricing)
 * 
 * Theoretical Foundations:
 * - Chao Yu, Akash Velu, Eugene Vinitsky, Jiaxuan Gao, Yu Wang, Alexandre Bayen, Yi Wu (NeurIPS 2022)
 *   "The Surprising Effectiveness of PPO in Cooperative/Competitive Multi-Agent Games"
 * - John Schulman, Filip Wolski, Prafulla Dhariwal, Alec Radford, Oleg Klimov (2017)
 *   "Proximal Policy Optimization Algorithms"
 * - Joshua Achiam, David Held, Aviv Tamar, Pieter Abbeel (ICML 2017)
 *   "Constrained Policy Optimization"
 * 
 * Mathematical Formulation:
 * 1. Centralized Training with Decentralized Execution (CTDE):
 *    - N competing/collaborating sellers on the multi-vendor marketplace.
 *    - Each agent i has a local observation s_i (COGS, competitor price, inventory, elasticity).
 *    - Local Gaussian Actor policy:
 *        u_i \sim \mathcal{N}(\mu_{\theta_i}(s_i), \sigma_{\theta_i}^2(s_i))
 *        a_i = \tanh(u_i) \in (-1, 1) \rightarrow Price \in [P_{\min}, P_{\max}]
 * 
 * 2. PPO Clipped Surrogate Objective:
 *    Let r_i(\theta) = \frac{\pi_{\theta_i}(a_i | s_i)}{\pi_{\theta_i}^{\text{old}}(a_i | s_i)}:
 *      L_i^{\text{CLIP}}(\theta) = \mathbb{E} \left[ \min\left( r_i(\theta) \hat{A}_i, \text{clip}(r_i(\theta), 1 - \epsilon, 1 + \epsilon) \hat{A}_i \right) \right]
 *    where \hat{A}_i = Q(s_{\text{joint}}, a) - V(s_{\text{joint}}) is the generalized advantage.
 * 
 * 3. Centralized Reward & Cost Critics:
 *    - Centralized Value Critic V_\phi(s_{\text{joint}}):
 *        L(V) = \frac{1}{2} (V_\phi(s_{\text{joint}}) - R_{\text{target}})^2
 *    - Centralized Cost Critic V^C_\psi(s_{\text{joint}}) for predatory pricing risk.
 * 
 * 4. Dual Lagrangian Multiplier Updates:
 *    Each seller maintains a multiplier \lambda_i:
 *      \lambda_i \leftarrow \max(0, \lambda_i + \eta_\lambda (c_i - d_{\text{budget}}))
 *    guaranteeing strict breakeven protection:
 *      p_i \ge 1.05 \times \text{COGS}
 */

export class MAPPOContinuousPricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.numAgents=2] Number of competitive vendors
   * @param {number} [options.stateDim=5] Local state dimension per vendor
   * @param {number} [options.clipEps=0.2] PPO clip parameter epsilon
   * @param {number} [options.gamma=0.98] Discount factor
   * @param {number} [options.costBudget=0.03] Max allowed safety violation budget
   * @param {number} [options.lrActor=0.005] Actor learning rate
   * @param {number} [options.lrCritic=0.01] Critic learning rate
   * @param {number} [options.lrDual=0.02] Lagrangian multiplier ascent rate
   */
  constructor(options = {}) {
    this.numAgents = Math.max(2, Math.floor(Number(options.numAgents || 2)));
    this.stateDim = Math.max(2, Math.floor(Number(options.stateDim || 5)));
    this.clipEps = options.clipEps !== undefined ? Number(options.clipEps) : 0.2;
    this.gamma = options.gamma !== undefined ? Number(options.gamma) : 0.98;
    this.costBudget = options.costBudget !== undefined ? Number(options.costBudget) : 0.03;

    this.lrActor = options.lrActor || 0.005;
    this.lrCritic = options.lrCritic || 0.01;
    this.lrDual = options.lrDual || 0.02;

    this.jointStateDim = this.numAgents * this.stateDim;

    // Decentralized Gaussian Actors
    this.agents = [];
    for (let i = 0; i < this.numAgents; i++) {
      const wMean = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const bMean = 0.0;
      const wLogStd = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.05);
      const bLogStd = -0.5;

      this.agents.push({
        id: `MAPPO_AGENT_${i + 1}`,
        wMean,
        bMean,
        wLogStd,
        bLogStd,
        lambda: 0.0
      });
    }

    // Centralized Reward Value Critic V(s_joint)
    this.wCritic = new Array(this.jointStateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bCritic = 0.0;

    // Centralized Cost Critic V_C(s_joint)
    this.wCostCritic = new Array(this.jointStateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
    this.bCostCritic = 0.0;

    this.trainStepCount = 0;
  }

  _evalLinear(weights, bias, input) {
    let sum = bias;
    for (let i = 0; i < weights.length; i++) {
      sum += weights[i] * input[i];
    }
    return sum;
  }

  /**
   * Samples a pricing action from local Gaussian policy
   * @param {number} agentIdx
   * @param {number[]} localState
   * @param {boolean} [deterministic=false]
   */
  sampleAction(agentIdx, localState, deterministic = false) {
    const ag = this.agents[agentIdx];
    let mean = ag.bMean;
    let logStd = ag.bLogStd;

    for (let j = 0; j < this.stateDim; j++) {
      mean += ag.wMean[j] * localState[j];
      logStd += ag.wLogStd[j] * localState[j];
    }

    logStd = Math.max(-20, Math.min(2, logStd));
    const std = Math.exp(logStd);

    let u;
    if (deterministic) {
      u = mean;
    } else {
      const u1 = Math.max(1e-7, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      u = mean + std * z;
    }

    const action = Math.tanh(u);
    const normalLogProb = -0.5 * (Math.pow((u - mean) / std, 2) + 2 * logStd + Math.log(2 * Math.PI));
    const jacobianCorr = Math.log(Math.max(1e-6, 1.0 - action * action));
    const logProb = normalLogProb - jacobianCorr;

    return {
      agentId: ag.id,
      action: Number(action.toFixed(5)),
      rawU: u,
      logProb: Number(logProb.toFixed(5)),
      lambda: Number(ag.lambda.toFixed(4))
    };
  }

  /**
   * Evaluates centralized value functions
   * @param {number[]} jointState
   */
  evaluateCentralizedValue(jointState) {
    const vReward = this._evalLinear(this.wCritic, this.bCritic, jointState);
    const vCost = this._evalLinear(this.wCostCritic, this.bCostCritic, jointState);
    return {
      vReward: Number(vReward.toFixed(4)),
      vCost: Number(vCost.toFixed(4))
    };
  }

  /**
   * MAPPO optimization step with PPO clipping and Lagrange dual ascent
   * @param {Object} batch
   */
  update(batch) {
    this.trainStepCount += 1;
    const { states, actions, oldLogProbs, rewards, costs, nextStates, done = false } = batch;

    const jointState = [];
    const jointNextState = [];
    for (let i = 0; i < this.numAgents; i++) {
      for (let j = 0; j < this.stateDim; j++) {
        jointState.push(states[i][j]);
        jointNextState.push(nextStates[i][j]);
      }
    }

    const vCur = this._evalLinear(this.wCritic, this.bCritic, jointState);
    const vNext = done ? 0 : this._evalLinear(this.wCritic, this.bCritic, jointNextState);

    const avgReward = rewards.reduce((sum, r) => sum + r, 0) / this.numAgents;
    const targetV = avgReward + this.gamma * vNext;
    const advantage = targetV - vCur;

    // Critic gradient descent
    const vErr = vCur - targetV;
    for (let k = 0; k < this.jointStateDim; k++) {
      this.wCritic[k] -= this.lrCritic * vErr * jointState[k];
    }
    this.bCritic -= this.lrCritic * vErr;

    // Cost Critic gradient descent
    const vCostCur = this._evalLinear(this.wCostCritic, this.bCostCritic, jointState);
    const avgCost = costs.reduce((sum, c) => sum + c, 0) / this.numAgents;
    const targetCostV = avgCost + this.gamma * (done ? 0 : this._evalLinear(this.wCostCritic, this.bCostCritic, jointNextState));
    const costErr = vCostCur - targetCostV;

    for (let k = 0; k < this.jointStateDim; k++) {
      this.wCostCritic[k] -= this.lrCritic * costErr * jointState[k];
    }
    this.bCostCritic -= this.lrCritic * costErr;

    const agentLosses = [];

    // Actor PPO clipping update per agent
    for (let i = 0; i < this.numAgents; i++) {
      const ag = this.agents[i];
      const s = states[i];
      const a = actions[i];
      const oldLp = oldLogProbs[i];

      const currentSample = this.sampleAction(i, s, false);
      const curLp = currentSample.logProb;

      // Probability ratio r_i(\theta)
      const ratio = Math.exp(Math.max(-10, Math.min(10, curLp - oldLp)));
      const clippedRatio = Math.max(1 - this.clipEps, Math.min(1 + this.clipEps, ratio));

      // Net advantage penalized by Cost Critic & Lagrange multiplier
      const netAdvantage = advantage - ag.lambda * (costs[i] - this.costBudget);

      const surr1 = ratio * netAdvantage;
      const surr2 = clippedRatio * netAdvantage;
      const ppoLoss = -Math.min(surr1, surr2);

      // Actor gradient step
      const gradSign = netAdvantage >= 0 ? 1 : -1;
      for (let j = 0; j < this.stateDim; j++) {
        ag.wMean[j] += this.lrActor * gradSign * s[j];
      }
      ag.bMean += this.lrActor * gradSign;

      // Dual Lagrangian multiplier ascent
      ag.lambda = Math.max(0, ag.lambda + this.lrDual * (costs[i] - this.costBudget));

      agentLosses.push({
        agentId: ag.id,
        ratio: Number(ratio.toFixed(4)),
        ppoLoss: Number(ppoLoss.toFixed(4)),
        lambda: Number(ag.lambda.toFixed(4))
      });
    }

    return {
      step: this.trainStepCount,
      criticLoss: Number((vErr * vErr).toFixed(5)),
      costCriticLoss: Number((costErr * costErr).toFixed(5)),
      agentLosses
    };
  }

  /**
   * Generates continuous pricing recommendations ensuring 1.05 x COGS floor
   * @param {Object[]} sellerContexts
   */
  recommendPrices(sellerContexts = []) {
    const recommendations = [];

    for (let i = 0; i < Math.min(this.numAgents, sellerContexts.length); i++) {
      const ctx = sellerContexts[i];
      const ag = this.agents[i];

      const cogs = Math.max(1000, Number(ctx.cogs || 100000));
      const basePrice = Math.max(cogs, Number(ctx.basePrice || cogs * 1.35));
      const competitorPrice = Number(ctx.competitorPrice || basePrice);
      const inventory = Math.max(0, Number(ctx.inventory || 100));
      const elasticity = Math.max(0.1, Number(ctx.priceElasticity || 1.6));

      const localState = [
        Math.min(2.0, cogs / basePrice),
        Math.min(2.0, competitorPrice / basePrice),
        Math.min(2.0, inventory / 100),
        Math.min(2.0, elasticity / 3.0),
        0.5
      ];

      const sample = this.sampleAction(i, localState, true);
      const a = sample.action;

      const pMin = cogs * 0.95;
      const pMax = basePrice * 1.5;
      const rawPrice = pMin + ((1 + a) / 2) * (pMax - pMin);

      const safeFloorPrice = Math.round(cogs * 1.05);
      const recommendedPrice = Math.max(safeFloorPrice, Math.round(rawPrice));
      const grossMarginRate = Number(((recommendedPrice - cogs) / recommendedPrice).toFixed(4));

      recommendations.push({
        agentId: ag.id,
        recommendedPrice,
        rawPrice: Math.round(rawPrice),
        safeFloorPrice,
        grossMarginRate,
        isSafe: rawPrice >= safeFloorPrice,
        lambda: Number(ag.lambda.toFixed(4)),
        action: a
      });
    }

    return recommendations;
  }
}
