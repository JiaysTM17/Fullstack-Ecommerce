/**
 * Stochastic Gradient Bandit with Softmax Policy & Reward Baseline
 * 
 * Implements policy gradient reinforcement learning for dynamic Flash Sale Hero banners
 * and Top Deal allocations without parametric assumptions, using Softmax action preferences and running baseline.
 */

class SoftmaxGradientBandit {
  /**
   * @param {Array<string>} armIds - List of actions (e.g. Banners / Deals)
   * @param {Object} options
   * @param {number} options.alpha - Learning rate step size (default 0.1)
   * @param {boolean} options.useBaseline - Whether to subtract average reward baseline (default true)
   */
  constructor(armIds = ["HERO_BANNER_A", "HERO_BANNER_B", "HERO_BANNER_C"], options = {}) {
    this.armIds = armIds.slice();
    this.alpha = options.alpha !== undefined ? Number(options.alpha) : 0.1;
    this.useBaseline = options.useBaseline !== false;

    // Action preferences H(a)
    this.preferences = new Map();
    // Action statistics
    this.pulls = new Map();
    this.totalRewards = new Map();

    for (const arm of this.armIds) {
      this.preferences.set(arm, 0.0);
      this.pulls.set(arm, 0);
      this.totalRewards.set(arm, 0.0);
    }

    this.totalSteps = 0;
    this.averageReward = 0.0;
  }

  getProbabilities() {
    const k = this.armIds.length;
    if (k === 0) return {};

    // Numerical stability: Subtract max preference
    let maxPref = -Infinity;
    for (const arm of this.armIds) {
      const pref = this.preferences.get(arm);
      if (pref > maxPref) maxPref = pref;
    }

    let sumExp = 0;
    const expMap = new Map();
    for (const arm of this.armIds) {
      const expVal = Math.exp(this.preferences.get(arm) - maxPref);
      expMap.set(arm, expVal);
      sumExp += expVal;
    }

    const probs = {};
    for (const arm of this.armIds) {
      probs[arm] = Number((expMap.get(arm) / (sumExp || 1)).toFixed(6));
    }
    return probs;
  }

  selectArm() {
    const probs = this.getProbabilities();
    const rand = Math.random();
    let cumulative = 0;

    for (const arm of this.armIds) {
      cumulative += probs[arm];
      if (rand <= cumulative) {
        return arm;
      }
    }
    return this.armIds[this.armIds.length - 1];
  }

  update(chosenArm, reward) {
    if (!this.preferences.has(chosenArm)) return false;

    const r = Number(reward);
    const baseline = this.useBaseline ? this.averageReward : 0.0;
    const advantage = r - baseline;

    this.totalSteps += 1;
    this.averageReward = this.averageReward + (r - this.averageReward) / this.totalSteps;

    const probs = this.getProbabilities();

    // 3. Gradient ascent update on H(a)
    for (const arm of this.armIds) {
      const pi = probs[arm];
      const currentH = this.preferences.get(arm);
      if (arm === chosenArm) {
        // H(a) = H(a) + alpha * (R - baseline) * (1 - pi(a))
        const newH = currentH + this.alpha * advantage * (1 - pi);
        this.preferences.set(arm, newH);
      } else {
        // H(b) = H(b) - alpha * (R - baseline) * pi(b)
        const newH = currentH - this.alpha * advantage * pi;
        this.preferences.set(arm, newH);
      }
    }

    // 4. Update arm stats
    this.pulls.set(chosenArm, this.pulls.get(chosenArm) + 1);
    this.totalRewards.set(chosenArm, this.totalRewards.get(chosenArm) + r);

    return true;
  }

  getArmStats() {
    const probs = this.getProbabilities();
    const stats = {};
    for (const arm of this.armIds) {
      const n = this.pulls.get(arm);
      stats[arm] = {
        preference: Number(this.preferences.get(arm).toFixed(4)),
        probability: probs[arm],
        pulls: n,
        totalReward: this.totalRewards.get(arm),
        avgReward: n > 0 ? Number((this.totalRewards.get(arm) / n).toFixed(4)) : 0
      };
    }
    return {
      arms: stats,
      totalSteps: this.totalSteps,
      runningAverageReward: Number(this.averageReward.toFixed(4))
    };
  }
}

export { SoftmaxGradientBandit };
export default SoftmaxGradientBandit;
