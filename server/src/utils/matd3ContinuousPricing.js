/**
 * Multi-Agent Twin Delayed Deep Deterministic Policy Gradient (MATD3)
 * with Lagrangian Safety Constraints for Multi-Vendor Dynamic Pricing
 * (MATD3ContinuousPricing)
 * 
 * Theoretical Foundations:
 * - Ryan Lowe, Yi Wu, Aviv Tamar, Jean Harb, Pieter Abbeel, Igor Mordatch (NeurIPS 2017)
 *   "Multi-Agent Actor-Critic for Mixed Cooperative-Competitive Environments" (MADDPG)
 * - Scott Fujimoto, Herke van Hoof, David Meger (ICML 2018)
 *   "Addressing Function Approximation Error in Actor-Critic Methods" (TD3)
 * - Joshua Achiam, David Held, Aviv Tamar, Pieter Abbeel (ICML 2017)
 *   "Constrained Policy Optimization"
 * - Johannes Ackermann et al. (AAMAS 2019)
 *   "Reducing Overestimation Bias in Multi-Agent Reinforcement Learning" (MATD3)
 * 
 * Mathematical Formulation:
 * 1. Centralized Training with Decentralized Execution (CTDE):
 *    Let N = number of competing shops (e.g. N = 2).
 *    Each agent i observes local state s_i in R^5.
 *    Decentralized deterministic actor: a_i = \mu_{\theta_i}(s_i) in [-1, 1].
 *    Global joint state s = (s_1, ..., s_N), joint action a = (a_1, ..., a_N).
 * 2. Centralized Twin Critics:
 *    To eliminate overestimation bias in competitive multi-agent dynamics:
 *      y_i = r_i + \gamma * min( Q'_{i, 1}(s', \tilde{a}), Q'_{i, 2}(s', \tilde{a}) )
 *    with target policy smoothing:
 *      \tilde{a}_j = clip( \mu'_{j}(s'_j) + clip(\epsilon_j, -c, c), -1, 1 ), \epsilon_j ~ N(0, \sigma^2)
 * 3. Delayed Policy Updates (d = 2):
 *    Actors and target networks are updated once every 2 critic training steps.
 * 4. Safety Cost Critic & Multi-Agent Lagrangian Multipliers:
 *    Cost signal c_i(s, a) = max(0, 1.05 * COGS_i - p_i) / COGS_i.
 *    Dual ascent: \lambda_i <- max(0, \lambda_i + \eta_\lambda * (c_bar_i - d_budget)).
 * 5. Price Mapping & Strict Hard Margin Floor:
 *    p_i = p_min_i + ((1 + a_i) / 2) * (p_max_i - p_min_i)
 *    Hard Floor Guarantee: p_i >= 1.05 * COGS_i (prevents destructive price wars).
 */

export class MATD3ContinuousPricing {
  /**
   * @param {Object} [options]
   * @param {number} [options.numAgents=2] Number of competing seller agents
   * @param {number} [options.stateDim=5] Dimension of private state per agent
   * @param {number} [options.gamma=0.98] Reward discount factor
   * @param {number} [options.tau=0.01] Polyak target network smoothing rate
   * @param {number} [options.policyDelay=2] Actor update delay frequency
   * @param {number} [options.targetNoise=0.1] Smoothing noise standard deviation
   * @param {number} [options.noiseClip=0.25] Smoothing noise clipping bound
   * @param {number} [options.costBudget=0.02] Safety cost limit
   * @param {number} [options.lrActor=0.005] Actor learning rate
   * @param {number} [options.lrCritic=0.01] Critic learning rate
   * @param {number} [options.lrDual=0.02] Lagrangian multiplier ascent rate
   */
  constructor(options = {}) {
    this.numAgents = Math.max(2, Math.floor(Number(options.numAgents || 2)));
    this.stateDim = Math.max(2, Math.floor(Number(options.stateDim || 5)));
    this.gamma = options.gamma !== undefined ? options.gamma : 0.98;
    this.tau = options.tau !== undefined ? options.tau : 0.01;
    this.policyDelay = options.policyDelay || 2;
    this.targetNoise = options.targetNoise !== undefined ? options.targetNoise : 0.1;
    this.noiseClip = options.noiseClip !== undefined ? options.noiseClip : 0.25;
    this.costBudget = options.costBudget !== undefined ? options.costBudget : 0.02;

    this.lrActor = options.lrActor || 0.005;
    this.lrCritic = options.lrCritic || 0.01;
    this.lrDual = options.lrDual || 0.02;

    // Joint state-action dimensionality for centralized critics
    this.jointStateDim = this.numAgents * this.stateDim;
    this.jointDim = this.jointStateDim + this.numAgents; // Joint states + joint actions

    this.agents = [];
    for (let i = 0; i < this.numAgents; i++) {
      // Decentralized Actor parameters
      const wActor = new Array(this.stateDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const bActor = 0.0;
      const wActorTarget = [...wActor];
      let bActorTarget = bActor;

      // Centralized Twin Q-Critics (Q1, Q2) conditioning on joint (s, a)
      const wQ1 = new Array(this.jointDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const bQ1 = 0.0;
      const wQ2 = new Array(this.jointDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const bQ2 = 0.0;

      const wQ1Target = [...wQ1];
      let bQ1Target = bQ1;
      const wQ2Target = [...wQ2];
      let bQ2Target = bQ2;

      // Centralized Cost Critic & Lagrangian Multiplier
      const wC = new Array(this.jointDim).fill(0).map(() => (Math.random() - 0.5) * 0.1);
      const bC = 0.0;
      const wCTarget = [...wC];
      let bCTarget = bC;

      this.agents.push({
        id: `SELLER_AGENT_${i + 1}`,
        wActor,
        bActor,
        wActorTarget,
        bActorTarget,
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
        lambda: 0.0
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
   * Decentralized action selection for a single agent i
   * @param {number} agentIdx Agent index (0..N-1)
   * @param {number[]} localState Private state of agent i
   * @param {boolean} [explore=false] Add exploration noise
   */
  selectAction(agentIdx, localState, explore = false) {
    const ag = this.agents[agentIdx];
    let u = ag.bActor;
    for (let j = 0; j < this.stateDim; j++) {
      u += ag.wActor[j] * localState[j];
    }

    if (explore) {
      // Gaussian exploration noise
      const u1 = Math.max(1e-7, Math.random());
      const u2 = Math.random();
      const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
      u += z * 0.15;
    }

    const action = Math.max(-1.0, Math.min(1.0, Math.tanh(u)));

    const result = {
      agentId: ag.id,
      action: Number(action.toFixed(5)),
      rawU: u,
      lambda: ag.lambda,
      valueOf() {
        return this.action;
      },
      [Symbol.toPrimitive](hint) {
        if (hint === "number") return this.action;
        return `[MATD3 a=${this.action.toFixed(4)}]`;
      }
    };

    return result;
  }

  /**
   * Centralized joint update step for all agents
   * @param {Object} batch
   * @param {number[][]} batch.states Array of local states for each agent [s_1, ..., s_N]
   * @param {number[]} batch.actions Array of chosen actions [a_1, ..., a_N]
   * @param {number[]} batch.rewards Array of rewards [r_1, ..., r_N]
   * @param {number[]} batch.costs Array of constraint violation costs [c_1, ..., c_N]
   * @param {number[][]} batch.nextStates Array of next local states [s'_1, ..., s'_N]
   * @param {boolean} [batch.done=false]
   */
  update(batch) {
    this.trainStepCount += 1;
    const { states, actions, rewards, costs, nextStates, done = false } = batch;

    // Build joint state and joint input vectors
    const jointState = [];
    const jointNextState = [];
    for (let i = 0; i < this.numAgents; i++) {
      for (let j = 0; j < this.stateDim; j++) {
        jointState.push(states[i][j]);
        jointNextState.push(nextStates[i][j]);
      }
    }

    const jointInput = [...jointState, ...actions];

    // Compute target actions with smoothing noise
    const smoothedNextActions = [];
    for (let i = 0; i < this.numAgents; i++) {
      const ag = this.agents[i];
      let uNext = ag.bActorTarget;
      for (let j = 0; j < this.stateDim; j++) {
        uNext += ag.wActorTarget[j] * nextStates[i][j];
      }
      let aNext = Math.tanh(uNext);

      // Add clipped target smoothing noise
      const u1 = Math.max(1e-7, Math.random());
      const u2 = Math.random();
      const noise = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2) * this.targetNoise;
      const clippedNoise = Math.max(-this.noiseClip, Math.min(this.noiseClip, noise));
      aNext = Math.max(-1.0, Math.min(1.0, aNext + clippedNoise));
      smoothedNextActions.push(aNext);
    }

    const jointNextInput = [...jointNextState, ...smoothedNextActions];
    const discount = done ? 0 : this.gamma;
    const losses = [];

    // 1. Update Centralized Critics for each agent
    for (let i = 0; i < this.numAgents; i++) {
      const ag = this.agents[i];

      // Target Q-value: min(Q'1, Q'2)
      const q1Targ = this._evalLinear(ag.wQ1Target, ag.bQ1Target, jointNextInput);
      const q2Targ = this._evalLinear(ag.wQ2Target, ag.bQ2Target, jointNextInput);
      const targetQ = rewards[i] + discount * Math.min(q1Targ, q2Targ);

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

      losses.push({
        agentId: ag.id,
        lossQ1: Number((errQ1 * errQ1).toFixed(5)),
        lossQ2: Number((errQ2 * errQ2).toFixed(5)),
        lossCost: Number((errC * errC).toFixed(5))
      });
    }

    // 2. Delayed Policy (Actor) and Lagrangian Multiplier Updates
    if (this.trainStepCount % this.policyDelay === 0) {
      for (let i = 0; i < this.numAgents; i++) {
        const ag = this.agents[i];

        // Action index in joint vector
        const actionIdxInJoint = this.jointStateDim + i;
        const dQda = ag.wQ1[actionIdxInJoint];
        const dCda = ag.wC[actionIdxInJoint];

        // Current action and derivative: da/du = 1 - a^2
        const actObj = this.selectAction(i, states[i], false);
        const aPred = actObj.action;
        const da_du = Math.max(0.01, 1 - aPred * aPred);

        // Constrained policy gradient: dJ/da = dQ/da - lambda * dC/da
        const gradA = (dQda - ag.lambda * dCda) * da_du;

        for (let j = 0; j < this.stateDim; j++) {
          ag.wActor[j] += this.lrActor * gradA * states[i][j];
        }
        ag.bActor += this.lrActor * gradA;

        // Dual multiplier subgradient ascent
        const costViolation = costs[i] - this.costBudget;
        ag.lambda = Math.max(0, ag.lambda + this.lrDual * costViolation);

        // Polyak moving average for targets
        for (let j = 0; j < this.stateDim; j++) {
          ag.wActorTarget[j] = this.tau * ag.wActor[j] + (1 - this.tau) * ag.wActorTarget[j];
        }
        ag.bActorTarget = this.tau * ag.bActor + (1 - this.tau) * ag.bActorTarget;

        for (let k = 0; k < this.jointDim; k++) {
          ag.wQ1Target[k] = this.tau * ag.wQ1[k] + (1 - this.tau) * ag.wQ1Target[k];
          ag.wQ2Target[k] = this.tau * ag.wQ2[k] + (1 - this.tau) * ag.wQ2Target[k];
          ag.wCTarget[k] = this.tau * ag.wC[k] + (1 - this.tau) * ag.wCTarget[k];
        }
        ag.bQ1Target = this.tau * ag.bQ1 + (1 - this.tau) * ag.bQ1Target;
        ag.bQ2Target = this.tau * ag.bQ2 + (1 - this.tau) * ag.bQ2Target;
        ag.bCTarget = this.tau * ag.bC + (1 - this.tau) * ag.bCTarget;
      }
    }

    return {
      step: this.trainStepCount,
      delayedPolicyUpdated: this.trainStepCount % this.policyDelay === 0,
      agentLosses: losses
    };
  }

  /**
   * Multi-Seller Equilibrium Pricing Recommendation
   * @param {Object[]} sellerContexts Array of { cogs, basePrice, inventory, priceElasticity, competitorPrice }
   */
  recommendPrices(sellerContexts = []) {
    const recommendations = [];

    for (let i = 0; i < Math.min(this.numAgents, sellerContexts.length); i++) {
      const ctx = sellerContexts[i];
      const ag = this.agents[i];

      const cogs = Math.max(1000, Number(ctx.cogs || 100000));
      const basePrice = Math.max(cogs, Number(ctx.basePrice || cogs * 1.3));
      const competitorPrice = Number(ctx.competitorPrice || basePrice);
      const inventory = Math.max(0, Number(ctx.inventory || 100));
      const elasticity = Math.max(0.1, Number(ctx.priceElasticity || 1.5));

      const localState = [
        Math.min(2.0, cogs / basePrice),
        Math.min(2.0, competitorPrice / basePrice),
        Math.min(2.0, inventory / 100),
        Math.min(2.0, elasticity / 3.0),
        0.5
      ];

      const actRes = this.selectAction(i, localState, false);
      const a = actRes.action;

      const pMin = cogs * 0.95;
      const pMax = basePrice * 1.5;
      const rawPrice = pMin + ((1 + a) / 2) * (pMax - pMin);

      // Enforce strict 1.05 * COGS safety floor
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
