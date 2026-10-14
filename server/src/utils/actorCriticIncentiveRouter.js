/**
 * Advantage Actor-Critic (A2C) Policy Gradient Incentive Router
 * Linear Function Approximation with Temporal Difference (TD) Baseline
 *
 * Applications in E-Commerce:
 * 1. Dynamic Incentive Allocation:
 *    Intelligently assigns personalized promotional perks (Freeship 0Đ, Voucher 15%, Hoàn Xu 20%, Quà Tặng Độc Quyền)
 *    based on customer behavioral vector s in R^D (cart value, recency, 30-day conversion rate, session duration).
 * 2. Triệt tiêu phương sai cao của REINFORCE truyền thống:
 *    Uses Critic state-value function V(s) to compute Advantage:
 *    A(s, a) = r + gamma * V(s') - V(s)
 * 3. Maximizes Platform GMV & CVR while minimizing unnecessary discount subsidies.
 */

class ActorCriticIncentiveRouter {
  /**
   * @param {Object} [options]
   * @param {Array<string>} [options.actions]    - Discrete action incentives
   * @param {number} [options.dim=4]             - Feature vector dimension
   * @param {number} [options.alphaActor=0.05]   - Actor policy learning rate
   * @param {number} [options.alphaCritic=0.1]   - Critic value learning rate
   * @param {number} [options.gamma=0.95]        - Reward discount factor
   */
  constructor(options = {}) {
    this.actions = options.actions || ["FREESHIP_MAX", "DISCOUNT_10", "DISCOUNT_20", "COIN_CASHBACK"];
    this.dim = Math.max(1, options.dim || 4);
    this.alphaActor = options.alphaActor || 0.05;
    this.alphaCritic = options.alphaCritic || 0.1;
    this.gamma = options.gamma !== undefined ? options.gamma : 0.95;

    // Critic parameters: w_v in R^dim (state value estimator V(s) = w_v . s)
    this.criticWeights = new Float64Array(this.dim).fill(0.0);

    // Actor parameters: W_pi in R^{K x dim} (action preference z_k = W_pi[k] . s)
    this.actorWeights = Array.from({ length: this.actions.length }, () => new Float64Array(this.dim).fill(0.0));

    this.totalSteps = 0;
  }

  /**
   * Safe dot product
   */
  _dot(w, x) {
    let sum = 0;
    const len = Math.min(w.length, x.length);
    for (let i = 0; i < len; i++) {
      sum += w[i] * x[i];
    }
    return sum;
  }

  /**
   * Critic: Predict V(s) = w_v . s
   * @param {Array<number>} stateVector
   * @returns {number}
   */
  predictValue(stateVector) {
    if (!stateVector || stateVector.length === 0) return 0;
    return this._dot(this.criticWeights, stateVector);
  }

  /**
   * Actor: Softmax policy distribution pi(a | s)
   * @param {Array<number>} stateVector
   * @returns {Array<number>} probability per action
   */
  getActionProbabilities(stateVector) {
    if (!stateVector || stateVector.length === 0) {
      return Array(this.actions.length).fill(1 / this.actions.length);
    }

    const logits = new Float64Array(this.actions.length);
    let maxLogit = -Infinity;

    for (let a = 0; a < this.actions.length; a++) {
      logits[a] = this._dot(this.actorWeights[a], stateVector);
      if (logits[a] > maxLogit) maxLogit = logits[a];
    }

    // Stable Softmax
    let sumExp = 0;
    const probs = new Float64Array(this.actions.length);
    for (let a = 0; a < this.actions.length; a++) {
      probs[a] = Math.exp(logits[a] - maxLogit);
      sumExp += probs[a];
    }

    if (sumExp === 0) {
      return Array(this.actions.length).fill(1 / this.actions.length);
    }

    for (let a = 0; a < this.actions.length; a++) {
      probs[a] /= sumExp;
    }

    return Array.from(probs);
  }

  /**
   * Sample action according to policy or greedy best
   * @param {Array<number>} stateVector
   * @param {boolean} [isEvaluating=false]
   * @returns {string} selected action
   */
  selectAction(stateVector, isEvaluating = false) {
    const probs = this.getActionProbabilities(stateVector);

    if (isEvaluating) {
      let bestIdx = 0;
      let maxP = -Infinity;
      for (let i = 0; i < probs.length; i++) {
        if (probs[i] > maxP) {
          maxP = probs[i];
          bestIdx = i;
        }
      }
      return this.actions[bestIdx];
    }

    // Stochastic sample from categorical distribution
    let r = Math.random();
    let cumulative = 0;
    for (let i = 0; i < probs.length; i++) {
      cumulative += probs[i];
      if (r <= cumulative) return this.actions[i];
    }

    return this.actions[this.actions.length - 1];
  }

  /**
   * Advantage Actor-Critic update:
   * delta = r + gamma * V(s') - V(s)
   * Critic: w_v <- w_v + alphaCritic * delta * s
   * Actor: W_pi[a] <- W_pi[a] + alphaActor * delta * (1(a == chosen) - pi(a|s)) * s
   *
   * @param {Array<number>} state
   * @param {string} action
   * @param {number} reward
   * @param {Array<number>} nextState
   * @param {boolean} [done=false]
   * @returns {number} TD error / advantage
   */
  update(state, action, reward, nextState, done = false) {
    if (!state || state.length === 0) return 0;

    const actionIdx = this.actions.indexOf(String(action));
    if (actionIdx === -1) return 0;

    const vS = this.predictValue(state);
    const vSNext = done || !nextState ? 0 : this.predictValue(nextState);

    // Advantage / TD error
    const tdError = (Number(reward) || 0) + this.gamma * vSNext - vS;

    // 1. Critic Update: gradient of (v - V(s))^2 is -2*(v - V(s))*s
    const len = Math.min(this.dim, state.length);
    for (let d = 0; d < len; d++) {
      this.criticWeights[d] += this.alphaCritic * tdError * state[d];
    }

    // 2. Actor Update: gradient of log pi(a|s) is (1(a == chosen) - pi(a|s)) * s
    const probs = this.getActionProbabilities(state);
    for (let a = 0; a < this.actions.length; a++) {
      const gradMultiplier = (a === actionIdx ? 1.0 : 0.0) - probs[a];
      const step = this.alphaActor * tdError * gradMultiplier;
      for (let d = 0; d < len; d++) {
        this.actorWeights[a][d] += step * state[d];
      }
    }

    this.totalSteps++;
    return Math.round(tdError * 1000) / 1000;
  }

  /**
   * Query policy metrics and distribution
   * @param {Array<number>} stateVector
   */
  getActionDistribution(stateVector) {
    const probs = this.getActionProbabilities(stateVector);
    const distribution = {};
    for (let i = 0; i < this.actions.length; i++) {
      distribution[this.actions[i]] = Math.round(probs[i] * 1000) / 1000;
    }

    return {
      distribution,
      bestAction: this.selectAction(stateVector, true),
      predictedValue: Math.round(this.predictValue(stateVector) * 100) / 100,
    };
  }

  /**
   * Router metrics
   */
  getStats() {
    return {
      totalSteps: this.totalSteps,
      actionsCount: this.actions.length,
      dimension: this.dim,
      alphaActor: this.alphaActor,
      alphaCritic: this.alphaCritic,
      gamma: this.gamma,
    };
  }
}

export { ActorCriticIncentiveRouter };
export default ActorCriticIncentiveRouter;
