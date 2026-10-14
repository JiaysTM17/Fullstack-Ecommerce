/**
 * Contextual Thompson Sampling with Bayesian Linear Bandit (LinTS)
 * 
 * Provides personalized incentive and dynamic promotion allocation based on buyer context vectors.
 * Uses Sherman-Morrison Rank-1 matrix updates for O(d^2) online learning without matrix inversion.
 */

class ContextualBanditEngine {
  /**
   * @param {Array<string>} armIds - List of candidate actions/incentives
   * @param {number} featureDim - Dimension d of context features
   * @param {Object} options - { v: explorationVariance, lambda: l2Regularization }
   */
  constructor(armIds = ["VOUCHER_10", "VOUCHER_20", "FREESHIP_MAX", "GIFT_BONUS"], featureDim = 3, options = {}) {
    this.armIds = armIds.slice();
    this.d = Math.max(1, featureDim);
    this.v = options.v !== undefined ? Number(options.v) : 0.5; // exploration factor
    this.lambda = options.lambda !== undefined ? Number(options.lambda) : 1.0; // prior precision

    this.arms = new Map();
    for (const armId of this.armIds) {
      this._initArm(armId);
    }
  }

  _initArm(armId) {
    // B_inv initialized to (1/lambda) * I_d
    const B_inv = [];
    for (let i = 0; i < this.d; i++) {
      const row = new Array(this.d).fill(0);
      row[i] = 1.0 / this.lambda;
      B_inv.push(row);
    }

    this.arms.set(armId, {
      id: armId,
      pulls: 0,
      totalReward: 0,
      f: new Array(this.d).fill(0), // cumulative reward vector
      mu: new Array(this.d).fill(0), // mean weights B_inv * f
      B_inv
    });
  }

  _cholesky(matrix) {
    const n = this.d;
    const L = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      for (let j = 0; j <= i; j++) {
        let sum = 0;
        for (let k = 0; k < j; k++) {
          sum += L[i][k] * L[j][k];
        }
        if (i === j) {
          const val = matrix[i][i] - sum;
          L[i][j] = Math.sqrt(Math.max(val, 1e-12));
        } else {
          L[i][j] = (matrix[i][j] - sum) / (L[j][j] || 1e-6);
        }
      }
    }
    return L;
  }

  _sampleGaussian() {
    // Box-Muller transform
    const u1 = Math.max(1e-15, Math.random());
    const u2 = Math.random();
    return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  }

  _sampleTheta(arm) {
    const L = this._cholesky(arm.B_inv);
    const z = Array.from({ length: this.d }, () => this._sampleGaussian());
    const theta = new Array(this.d).fill(0);

    for (let i = 0; i < this.d; i++) {
      let noise = 0;
      for (let j = 0; j <= i; j++) {
        noise += L[i][j] * z[j];
      }
      theta[i] = arm.mu[i] + this.v * noise;
    }
    return theta;
  }

  _dot(vecA, vecB) {
    let sum = 0;
    for (let i = 0; i < this.d; i++) {
      sum += (vecA[i] || 0) * (vecB[i] || 0);
    }
    return sum;
  }

  /**
   * Select best arm for current user context vector x
   */
  selectArm(contextVector = []) {
    const x = contextVector.slice(0, this.d);
    while (x.length < this.d) x.push(0);

    let bestArmId = this.armIds[0];
    let maxSampledValue = -Infinity;
    const predictions = {};

    for (const armId of this.armIds) {
      const arm = this.arms.get(armId);
      const thetaSample = this._sampleTheta(arm);
      const sampledScore = this._dot(x, thetaSample);
      const expectedScore = this._dot(x, arm.mu);

      predictions[armId] = {
        sampledScore,
        expectedScore,
        pulls: arm.pulls
      };

      if (sampledScore > maxSampledValue) {
        maxSampledValue = sampledScore;
        bestArmId = armId;
      }
    }

    return {
      selectedArm: bestArmId,
      sampledValue: maxSampledValue,
      predictions
    };
  }

  /**
   * Update arm with observed reward r for context vector x
   * Uses Sherman-Morrison rank-1 update for B_inv
   */
  update(armId, contextVector = [], reward = 0) {
    const arm = this.arms.get(armId);
    if (!arm) return false;

    const x = contextVector.slice(0, this.d);
    while (x.length < this.d) x.push(0);
    const r = Number(reward);

    // u = B_inv * x
    const u = new Array(this.d).fill(0);
    for (let i = 0; i < this.d; i++) {
      let sum = 0;
      for (let j = 0; j < this.d; j++) {
        sum += arm.B_inv[i][j] * x[j];
      }
      u[i] = sum;
    }

    // denom = 1 + x^T * u
    let xTu = 0;
    for (let i = 0; i < this.d; i++) {
      xTu += x[i] * u[i];
    }
    const denom = 1.0 + xTu;

    // B_inv_new = B_inv - (u * u^T) / denom
    for (let i = 0; i < this.d; i++) {
      for (let j = 0; j < this.d; j++) {
        arm.B_inv[i][j] -= (u[i] * u[j]) / denom;
      }
    }

    // f = f + r * x
    for (let i = 0; i < this.d; i++) {
      arm.f[i] += r * x[i];
    }

    // mu = B_inv * f
    for (let i = 0; i < this.d; i++) {
      let sum = 0;
      for (let j = 0; j < this.d; j++) {
        sum += arm.B_inv[i][j] * arm.f[j];
      }
      arm.mu[i] = sum;
    }

    arm.pulls += 1;
    arm.totalReward += r;
    return true;
  }

  predictExpectedReward(armId, contextVector = []) {
    const arm = this.arms.get(armId);
    if (!arm) return 0;
    const x = contextVector.slice(0, this.d);
    while (x.length < this.d) x.push(0);
    return this._dot(x, arm.mu);
  }

  getArmStats() {
    const stats = {};
    for (const [id, arm] of this.arms.entries()) {
      stats[id] = {
        pulls: arm.pulls,
        totalReward: arm.totalReward,
        avgReward: arm.pulls > 0 ? arm.totalReward / arm.pulls : 0,
        weights: arm.mu.slice()
      };
    }
    return stats;
  }
}

export { ContextualBanditEngine };
export default ContextualBanditEngine;
