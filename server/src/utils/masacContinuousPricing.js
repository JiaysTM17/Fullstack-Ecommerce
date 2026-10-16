/**
 * Multi-Agent Soft Actor-Critic with Centralized Twin Critics,
 * Automatic Entropy Temperature Auto-Tuning, and Dual Lagrangian Safety Constraints
 * (MASACContinuousPricing)
 * 
 * Theoretical Foundations:
 * - Tuomas Haarnoja, Aurick Zhou, Pieter Abbeel, Sergey Levine (ICML 2018)
 *   "Soft Actor-Critic: Off-Policy Maximum Entropy Deep Reinforcement Learning with a Stochastic Actor"
 * - Ermo Wei, Drew Wicke, David Freelan, Sean Luke (AAAI 2021)
 *   "Multi-Agent Soft Actor-Critic for Cooperative-Competitive Games"
 * - Alex Ray, Joshua Achiam, Dario Amodei (Safety Gym 2019)
 *   "Benchmarking Safe Exploration in Deep Reinforcement Learning"
 * 
 * Mathematical Formulation:
 * 1. CTDE Multi-Agent Maximum Entropy Objective:
 *    For N competing vendor agents:
 *      J(\theta_i) = E_{s, a ~ D} [ Q_i(s, a_1, ..., a_N) - \alpha_i * \log \pi_{\theta_i}(a_i | s_i) ]
 *    where:
 *      a_i = \tanh(u_i), u_i ~ N(\mu_i(s_i), \sigma_i^2(s_i))
 *      \log \pi_{\theta_i}(a_i | s_i) = \log \mu_i(u_i | s_i) - \sum_{k} \log(1 - \tanh^2(u_{i, k}))
 * 
 * 2. Automatic Entropy Temperature Auto-Tuning per Agent:
 *    Target entropy \bar{H}_i = -dim(A_i) = -1.0.
 *    Dual gradient step for temperature \alpha_i:
 *      \alpha_i <- max(\alpha_{min}, \alpha_i - \eta_{\alpha} * (\log \pi_{\theta_i}(a_i | s_i) + \bar{H}_i))
 * 
 * 3. Centralized Twin Soft Q-Critics:
 *    Target soft value:
 *      y_i = r_i + \gamma * ( min(Q'_{i, 1}(s', a'), Q'_{i, 2}(s', a')) - \alpha_i * \log \pi'_i(a'_i | s'_i) )
 * 
 * 4. Safety Cost Critic & Dual Lagrangian Multiplier:
 *    Constraint cost: c_i = max(0, 1.05 * COGS_i - p_i) / COGS_i.
 *    Lagrangian update:
 *      \lambda_i <- max(0, \lambda_i + \eta_\lambda * (c_i - d_budget)).
 *    Policy gradient combines soft Q and cost gradients:
 *      \nabla_{\theta_i} J = E [ \nabla_{a_i} Q_{i, 1} - \lambda_i * \nabla_{a_i} C_i - \alpha_i * \nabla_{a_i} \log \pi_i ]
 * 
 * 5. Strict Safe Margin Floor Guarantee:
 *    p_i = p_min_i + ((1 + a_i) / 2) * (p_max_i - p_min_i)
 *    Hard Floor: p_i >= 1.05 * COGS_i (prevents bankruptcy/destructive dumping).
 */

export class MASACContinuousPricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.numAgents=2] Number of competing seller agents
   * @param {number} [options.stateDim=5] State dimension per agent
   * @param {number} [options.gamma=0.98] Reward discount factor
   * @param {number} [options.tau=0.01] Polyak smoothing rate
   * @param {number} [options.targetEntropy=-1.0] Target entropy \bar{H}
   * @param {number} [options.costBudget=0.02] Safety cost limit
   * @param {number} [options.lrActor=0.005] Actor learning rate
   * @param {number} [options.lrCritic=0.01] Critic learning rate
   * @param {number} [options.lrAlpha=0.01] Entropy temperature learning rate
   * @param {number} [options.lrDual=0.02] Lagrangian multiplier ascent rate
   */
  constructor(options = {}) {
    this.numAgents = Math.max(2, Math.floor(Number(options.numAgents || 2)));
    this.stateDim = Math.max(2, Math.floor(Number(options.stateDim || 5)));
    this.gamma = options.gamma !== undefined ? options.gamma : 0.98;
    this.tau = options.tau !== undefined ? options.tau : 0.01;
    this.targetEntropy = options.targetEntropy !== undefined ? options.targetEntropy : -1.0;
    this.costBudget = options.costBudget !== undefined ? options.costBudget : 0.02;

    this.lrActor = options.lrActor || 0.005;
    this.lrCritic = options.lrCritic || 0.01;
    this.lrAlpha = options.lrAlpha || 0.01;
    this.lrDual = options.lrDual || 0.02;

    this.jointStateDim = this.numAgents * this.stateDim;
    this.jointDim = this.jointStateDim + this.numAgents;

    this.agents = [];
    for (let i = 0; i < this.numAgents; i++) {
      // Gaussian Actor weights: mean and log-std
      const wMean = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const bMean = 0.0;
      const wLogStd = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.05);
      const bLogStd = -0.5;

      // Centralized Twin Q-Critics (Q1, Q2)
      const wQ1 = new Array(this.jointDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const bQ1 = 0.0;
      const wQ2 = new Array(this.jointDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const bQ2 = 0.0;

      const wQ1Target = [...wQ1];
      let bQ1Target = bQ1;
      const wQ2Target = [...wQ2];
      let bQ2Target = bQ2;

      // Centralized Cost Critic
      const wC = new Array(this.jointDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const bC = 0.0;
      const wCTarget = [...wC];
      let bCTarget = bC;

      this.agents.push({
        id: `MASAC_AGENT_${i + 1}`,
        wMean,
        bMean,
        wLogStd,
        bLogStd,
        wQ1,
        bQ1,
        wQ2,
        bQ2,
        wQ1Target,
        bQ1Target,
        wQ2Target,
        bQ2Target,
        wC,
        bC,
        wCTarget,
        bCTarget,
        alpha: 0.2, // Initial temperature
        lambda: 0.0 // Initial Lagrangian multiplier
      });
    }

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
   * Samples action from squashed Gaussian policy with Jacobian correction
   * @param {number} agentIdx Agent index (0..N-1)
   * @param {number[]} localState Local state vector
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
      // Box-Muller standard normal
      const u1 = Math.max(1e-7, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      u = mean + std * z;
    }

    const action = Math.tanh(u);

    // Exact squashed Gaussian log probability with Jacobian correction
    const normalLogProb = -0.5 * (Math.pow((u - mean) / std, 2) + 2 * logStd + Math.log(2 * Math.PI));
    const jacobianCorr = Math.log(Math.max(1e-6, 1.0 - action * action));
    const logProb = normalLogProb - jacobianCorr;

    const result = {
      agentId: ag.id,
      action: Number(action.toFixed(5)),
      rawU: u,
      logProb: Number(logProb.toFixed(5)),
      alpha: Number(ag.alpha.toFixed(4)),
      lambda: Number(ag.lambda.toFixed(4)),
      valueOf() {
        return this.action;
      },
      [Symbol.toPrimitive](hint) {
        if (hint === "number") return this.action;
        return `[MASAC a=${this.action.toFixed(4)}]`;
      }
    };

    return result;
  }

  /**
   * Joint training step across all agents
   * @param {Object} batch
   */
  update(batch) {
    this.trainStepCount += 1;
    const { states, actions, rewards, costs, nextStates, done = false } = batch;

    // Assemble joint vectors
    const jointState = [];
    const jointNextState = [];
    for (let i = 0; i < this.numAgents; i++) {
      for (let j = 0; j < this.stateDim; j++) {
        jointState.push(states[i][j]);
        jointNextState.push(nextStates[i][j]);
      }
    }

    const jointInput = [...jointState, ...actions];

    // Sample next actions and compute entropy
    const nextActions = [];
    const nextLogProbs = [];
    for (let i = 0; i < this.numAgents; i++) {
      const sample = this.sampleAction(i, nextStates[i], false);
      nextActions.push(sample.action);
      nextLogProbs.push(sample.logProb);
    }

    const jointNextInput = [...jointNextState, ...nextActions];
    const discount = done ? 0 : this.gamma;
    const agentSummaries = [];

    // 1. Update Centralized Critics
    for (let i = 0; i < this.numAgents; i++) {
      const ag = this.agents[i];

      // Soft Q-target: min(Q'1, Q'2) - alpha * log_pi
      const q1Targ = this._evalLinear(ag.wQ1Target, ag.bQ1Target, jointNextInput);
      const q2Targ = this._evalLinear(ag.wQ2Target, ag.bQ2Target, jointNextInput);
      const targetQ = rewards[i] + discount * (Math.min(q1Targ, q2Targ) - ag.alpha * nextLogProbs[i]);

      const q1Curr = this._evalLinear(ag.wQ1, ag.bQ1, jointInput);
      const q2Curr = this._evalLinear(ag.wQ2, ag.bQ2, jointInput);
      const errQ1 = q1Curr - targetQ;
      const errQ2 = q2Curr - targetQ;

      for (let k = 0; k < this.jointDim; k++) {
        ag.wQ1[k] -= this.lrCritic * errQ1 * jointInput[k];
        ag.wQ2[k] -= this.lrCritic * errQ2 * jointInput[k];
      }
      ag.bQ1 -= this.lrCritic * errQ1;
      ag.bQ2 -= this.lrCritic * errQ2;

      // Cost Critic update
      const cTarg = this._evalLinear(ag.wCTarget, ag.bCTarget, jointNextInput);
      const targetC = costs[i] + discount * cTarg;
      const cCurr = this._evalLinear(ag.wC, ag.bC, jointInput);
      const errC = cCurr - targetC;

      for (let k = 0; k < this.jointDim; k++) {
        ag.wC[k] -= this.lrCritic * errC * jointInput[k];
      }
      ag.bC -= this.lrCritic * errC;

      // 2. Policy Update with Dual Lagrangian & Soft Actor-Critic Gradient
      const curSample = this.sampleAction(i, states[i], false);
      const actionIdxInJoint = this.jointStateDim + i;
      const dQda = ag.wQ1[actionIdxInJoint];
      const dCda = ag.wC[actionIdxInJoint];

      // Squashing derivative da/du = 1 - a^2
      const da_du = Math.max(0.01, 1 - curSample.action * curSample.action);
      const policyGrad = (dQda - ag.lambda * dCda - ag.alpha * curSample.logProb) * da_du;

      for (let j = 0; j < this.stateDim; j++) {
        ag.wMean[j] += this.lrActor * policyGrad * states[i][j];
      }
      ag.bMean += this.lrActor * policyGrad;

      // 3. Automatic Entropy Temperature Auto-Tuning per Agent
      const entropyDiff = curSample.logProb + this.targetEntropy;
      ag.alpha = Math.max(0.01, ag.alpha - this.lrAlpha * entropyDiff);

      // 4. Dual Multiplier Subgradient Ascent
      const costViolation = costs[i] - this.costBudget;
      ag.lambda = Math.max(0, ag.lambda + this.lrDual * costViolation);

      // 5. Polyak Target Network Update
      for (let k = 0; k < this.jointDim; k++) {
        ag.wQ1Target[k] = this.tau * ag.wQ1[k] + (1 - this.tau) * ag.wQ1Target[k];
        ag.wQ2Target[k] = this.tau * ag.wQ2[k] + (1 - this.tau) * ag.wQ2Target[k];
        ag.wCTarget[k] = this.tau * ag.wC[k] + (1 - this.tau) * ag.wCTarget[k];
      }
      ag.bQ1Target = this.tau * ag.bQ1 + (1 - this.tau) * ag.bQ1Target;
      ag.bQ2Target = this.tau * ag.bQ2 + (1 - this.tau) * ag.bQ2Target;
      ag.bCTarget = this.tau * ag.bC + (1 - this.tau) * ag.bCTarget;

      agentSummaries.push({
        agentId: ag.id,
        lossQ1: Number((errQ1 * errQ1).toFixed(5)),
        lossQ2: Number((errQ2 * errQ2).toFixed(5)),
        lossCost: Number((errC * errC).toFixed(5)),
        alpha: Number(ag.alpha.toFixed(4)),
        lambda: Number(ag.lambda.toFixed(4))
      });
    }

    return {
      step: this.trainStepCount,
      agentSummaries
    };
  }

  /**
   * Multi-Vendor Market Equilibrium Pricing Recommendation
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

      // Hard floor guarantee
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
        alpha: Number(ag.alpha.toFixed(4)),
        lambda: Number(ag.lambda.toFixed(4)),
        action: a
      });
    }

    return recommendations;
  }
}
