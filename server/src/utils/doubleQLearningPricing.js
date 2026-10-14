/**
 * Double Q-Learning with Experience Replay for Dynamic Flash Sale Pricing
 * van Hasselt (2010) / Mnih et al. (2015)
 *
 * Applications in E-Commerce:
 * 1. Solves Dynamic Markdown & Flash Sale Discounting (0%, 5%, 10%, 15%, 20%, 30%).
 * 2. Completely eliminates Maximization Bias found in standard Q-Learning via decoupled Q_A and Q_B estimators.
 * 3. Experience Replay breaks temporal correlations, enabling stable convergence of revenue policies.
 */

class DoubleQLearningPricing {
  /**
   * @param {Object} options
   * @param {Array<string|number>} [options.actions]  - Discount actions e.g. ["D0", "D5", "D10", "D15", "D20", "D30"]
   * @param {number} [options.alpha=0.1]             - Learning rate
   * @param {number} [options.gamma=0.95]            - Discount factor for future rewards
   * @param {number} [options.epsilon=0.2]            - Initial exploration probability
   * @param {number} [options.epsilonDecay=0.995]    - Exploration decay factor
   * @param {number} [options.minEpsilon=0.01]       - Minimum exploration probability
   * @param {number} [options.replayCapacity=1000]   - Max experience transitions in memory
   */
  constructor(options = {}) {
    this.actions = options.actions || ["D0", "D5", "D10", "D15", "D20", "D30"];
    this.alpha = options.alpha || 0.1;
    this.gamma = options.gamma !== undefined ? options.gamma : 0.95;
    this.epsilon = options.epsilon !== undefined ? options.epsilon : 0.2;
    this.epsilonDecay = options.epsilonDecay || 0.995;
    this.minEpsilon = options.minEpsilon || 0.01;
    this.replayCapacity = options.replayCapacity || 1000;

    // Decoupled Q-tables: state -> Map(action -> value)
    this.QA = new Map();
    this.QB = new Map();

    // Experience replay buffer
    this.replayBuffer = [];
    this.totalSteps = 0;
  }

  /**
   * Get Q-values for state, initializing if not present
   * @param {Map} table
   * @param {string} state
   * @returns {Map<string, number>}
   */
  _getQMap(table, state) {
    const s = String(state);
    if (!table.has(s)) {
      const actionMap = new Map();
      for (const a of this.actions) {
        actionMap.set(String(a), 0.0);
      }
      table.set(s, actionMap);
    }
    return table.get(s);
  }

  /**
   * Find action with maximum Q-value in given table
   * @param {Map} table
   * @param {string} state
   * @returns {string} best action
   */
  _argmax(table, state) {
    const qMap = this._getQMap(table, state);
    let bestAction = this.actions[0];
    let maxVal = -Infinity;

    for (const a of this.actions) {
      const aKey = String(a);
      const val = qMap.get(aKey);
      if (val > maxVal) {
        maxVal = val;
        bestAction = aKey;
      }
    }
    return bestAction;
  }

  /**
   * Epsilon-greedy action selection
   * @param {string} state
   * @param {boolean} [isEvaluating=false] - If true, purely greedy without exploration
   * @returns {string} chosen action
   */
  selectAction(state, isEvaluating = false) {
    const s = String(state);

    if (!isEvaluating && Math.random() < this.epsilon) {
      // Explore: random action
      const rndIdx = Math.floor(Math.random() * this.actions.length);
      return String(this.actions[rndIdx]);
    }

    // Exploit: evaluate on average (Q_A + Q_B)
    const qMapA = this._getQMap(this.QA, s);
    const qMapB = this._getQMap(this.QB, s);

    let bestAction = String(this.actions[0]);
    let maxAvg = -Infinity;

    for (const a of this.actions) {
      const aKey = String(a);
      const avgQ = (qMapA.get(aKey) + qMapB.get(aKey)) / 2.0;
      if (avgQ > maxAvg) {
        maxAvg = avgQ;
        bestAction = aKey;
      }
    }

    return bestAction;
  }

  /**
   * Store transition in experience replay buffer
   * @param {string} state
   * @param {string} action
   * @param {number} reward
   * @param {string} nextState
   * @param {boolean} [done=false]
   */
  recordExperience(state, action, reward, nextState, done = false) {
    this.replayBuffer.push({
      state: String(state),
      action: String(action),
      reward: Number(reward) || 0,
      nextState: String(nextState),
      done: Boolean(done),
    });

    if (this.replayBuffer.length > this.replayCapacity) {
      this.replayBuffer.shift();
    }
  }

  /**
   * Perform single Double Q-Learning update
   * Decouples action selection from value estimation!
   * @param {string} state
   * @param {string} action
   * @param {number} reward
   * @param {string} nextState
   * @param {boolean} done
   */
  update(state, action, reward, nextState, done = false) {
    const s = String(state);
    const a = String(action);
    const nextS = String(nextState);
    const r = Number(reward) || 0;

    // Flip coin to update Q_A or Q_B
    if (Math.random() < 0.5) {
      // Update Q_A: select optimal action using Q_A, but evaluate using Q_B
      const qMapA = this._getQMap(this.QA, s);
      const curVal = qMapA.get(a);

      let targetVal = r;
      if (!done) {
        const bestNextAction = this._argmax(this.QA, nextS);
        const qMapBNext = this._getQMap(this.QB, nextS);
        targetVal += this.gamma * qMapBNext.get(bestNextAction);
      }

      qMapA.set(a, curVal + this.alpha * (targetVal - curVal));
    } else {
      // Update Q_B: select optimal action using Q_B, but evaluate using Q_A
      const qMapB = this._getQMap(this.QB, s);
      const curVal = qMapB.get(a);

      let targetVal = r;
      if (!done) {
        const bestNextAction = this._argmax(this.QB, nextS);
        const qMapANext = this._getQMap(this.QA, nextS);
        targetVal += this.gamma * qMapANext.get(bestNextAction);
      }

      qMapB.set(a, curVal + this.alpha * (targetVal - curVal));
    }

    this.totalSteps++;
    // Decay exploration
    if (this.epsilon > this.minEpsilon) {
      this.epsilon = Math.max(this.minEpsilon, this.epsilon * this.epsilonDecay);
    }
  }

  /**
   * Sample random mini-batch from experience replay buffer and update
   * @param {number} [batchSize=16]
   * @returns {number} number of transitions trained
   */
  trainReplayBatch(batchSize = 16) {
    if (this.replayBuffer.length === 0) return 0;
    const actualBatch = Math.min(batchSize, this.replayBuffer.length);

    for (let i = 0; i < actualBatch; i++) {
      const rndIdx = Math.floor(Math.random() * this.replayBuffer.length);
      const exp = this.replayBuffer[rndIdx];
      this.update(exp.state, exp.action, exp.reward, exp.nextState, exp.done);
    }

    return actualBatch;
  }

  /**
   * Policy state summary
   * @param {string} state
   * @returns {Object}
   */
  getStatePolicy(state) {
    const s = String(state);
    const qMapA = this._getQMap(this.QA, s);
    const qMapB = this._getQMap(this.QB, s);

    const values = {};
    for (const a of this.actions) {
      const aKey = String(a);
      values[aKey] = {
        QA: Math.round(qMapA.get(aKey) * 100) / 100,
        QB: Math.round(qMapB.get(aKey) * 100) / 100,
        QAvg: Math.round(((qMapA.get(aKey) + qMapB.get(aKey)) / 2) * 100) / 100,
      };
    }

    return {
      state: s,
      bestAction: this.selectAction(s, true),
      epsilon: Math.round(this.epsilon * 1000) / 1000,
      totalSteps: this.totalSteps,
      values,
    };
  }
}

export { DoubleQLearningPricing };
export default DoubleQLearningPricing;
