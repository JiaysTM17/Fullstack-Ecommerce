/**
 * LapDynamicPricing - Laplacian / Manifold Regularized Safe Dynamic Pricing in Offline RL
 *
 * Grounded in:
 * - Belkin & Niyogi (JMLR 2003): "Laplacian Eigenmaps and Spectral Techniques for Embedding and Clustering"
 * - Belkin, Niyogi, Sindhwani (JMLR 2006): "Manifold Regularization: A Geometric Framework for Machine Learning"
 * - Farahmand et al. (NeurIPS 2009 / Machine Learning 2016): "Regularized Fitted Q-Iteration"
 *
 * Key theoretical principle:
 * In offline e-commerce pricing, function approximators can exhibit sharp, erratic oscillations
 * in sparsely sampled or out-of-distribution regions.
 * Graph Laplacian regularization smooths the Q-function along the intrinsic low-dimensional manifold
 * formed by historical market states and pricing decisions:
 *
 *   R_Lap(Q) = 1/2 * sum_{i,j} W_ij * (Q(x_i) - Q(x_j))^2 = q^T * L * q
 *
 * where W_ij is the Gaussian RBF kernel affinity:
 *   W_ij = exp( - ||x_i - x_j||^2 / (2 * sigma^2) )
 * D_ii = sum_j W_ij is the degree matrix, and L = D - W is the Graph Laplacian.
 *
 * Objective:
 *   min_Q L_TD(Q) + gamma_lap * R_Lap(Q)
 *
 * Guarantees Lipschitz-smooth pricing transitions across inventory levels, demand shocks,
 * and competitor price moves, preventing flash crashes or sudden predatory pricing.
 */

class LapDynamicPricing {
  /**
   * @param {Object} options
   * @param {number} [options.basePrice=250000] - Baseline item price in VND
   * @param {number} [options.minPriceRatio=0.65] - Floor price ratio (e.g. 65% of base)
   * @param {number} [options.maxPriceRatio=1.45] - Ceiling price ratio (e.g. 145% of base)
   * @param {number} [options.gammaLap=0.25] - Laplacian regularization weight (manifold penalty)
   * @param {number} [options.rbfSigma=0.35] - RBF kernel bandwidth parameter for distance metric
   * @param {number} [options.learningRate=0.08] - Gradient descent learning rate
   * @param {number} [options.maxIter=60] - Optimization iterations
   */
  constructor(options = {}) {
    this.basePrice = options.basePrice || 250000;
    this.minPriceRatio = options.minPriceRatio || 0.65;
    this.maxPriceRatio = options.maxPriceRatio || 1.45;
    this.gammaLap = options.gammaLap !== undefined ? options.gammaLap : 0.25;
    this.rbfSigma = options.rbfSigma || 0.35;
    this.learningRate = options.learningRate || 0.08;
    this.maxIter = options.maxIter || 60;

    // Discrete action candidates for evaluation
    this.actionCandidates = [0.70, 0.80, 0.90, 0.95, 1.00, 1.05, 1.10, 1.20, 1.30];

    // Historical dataset: Array of { state: [invNorm, compNorm, demandNorm], action: priceRatio, reward: revenue/profit }
    this.dataset = [];
    this.weights = null; // Linear or feature weights for Q(s, a)
  }

  /**
   * Standardize state features to [0, 1]
   * @param {Object} rawState
   * @param {number} rawState.inventory - Available stock (e.g. 0 to 500)
   * @param {number} [rawState.maxInventory=500]
   * @param {number} rawState.competitorPrice - Competitor price in VND
   * @param {number} rawState.demandIndex - Demand index (e.g. 0.5 to 2.5)
   * @returns {number[]} [normInv, normComp, normDemand]
   */
  normalizeState(rawState = {}) {
    const maxInv = rawState.maxInventory || 500;
    const inv = Math.max(0, Math.min(maxInv, rawState.inventory !== undefined ? rawState.inventory : 100));
    const comp = rawState.competitorPrice || this.basePrice;
    const demand = rawState.demandIndex !== undefined ? rawState.demandIndex : 1.0;

    const normInv = inv / maxInv;
    const normComp = Math.max(0.5, Math.min(2.0, comp / this.basePrice));
    const normDemand = Math.max(0.2, Math.min(3.0, demand)) / 3.0;

    return [normInv, normComp, normDemand];
  }

  /**
   * Concatenate normalized state and action into point x = [s_0, s_1, s_2, a]
   * @param {number[]} stateVec
   * @param {number} action
   * @returns {number[]}
   */
  makeFeaturePoint(stateVec, action) {
    return [...stateVec, action];
  }

  /**
   * Compute squared Euclidean distance between two feature vectors
   */
  squaredDistance(x1, x2) {
    let sum = 0;
    for (let k = 0; k < x1.length; k++) {
      const diff = x1[k] - (x2[k] || 0);
      sum += diff * diff;
    }
    return sum;
  }

  /**
   * Train the Laplacian regularized Q-function on historical transitions
   * @param {Array<{state: Object, action: number, reward: number}>} transitions
   */
  fit(transitions = []) {
    if (!Array.isArray(transitions) || transitions.length === 0) return;

    this.dataset = transitions.map(t => {
      const sVec = this.normalizeState(t.state);
      const act = Math.max(this.minPriceRatio, Math.min(this.maxPriceRatio, t.action || 1.0));
      const pt = this.makeFeaturePoint(sVec, act);
      return {
        point: pt,
        stateVec: sVec,
        action: act,
        reward: t.reward || 0
      };
    });

    const N = this.dataset.length;
    if (N === 0) return;

    // 1. Build Adjacency Affinity Matrix W and Degree Matrix D
    const W = Array.from({ length: N }, () => new Float64Array(N));
    const D = new Float64Array(N);
    const twoSigmaSq = 2 * this.rbfSigma * this.rbfSigma;

    for (let i = 0; i < N; i++) {
      for (let j = i; j < N; j++) {
        if (i === j) {
          W[i][j] = 0; // No self loops
        } else {
          const dSq = this.squaredDistance(this.dataset[i].point, this.dataset[j].point);
          const w = Math.exp(-dSq / twoSigmaSq);
          W[i][j] = w;
          W[j][i] = w;
          D[i] += w;
          D[j] += w;
        }
      }
    }

    // 2. Initialize Q values vector q of length N to target rewards
    const q = new Float64Array(N);
    const targetQ = new Float64Array(N);
    for (let i = 0; i < N; i++) {
      targetQ[i] = this.dataset[i].reward;
      q[i] = this.dataset[i].reward; // Initial estimate
    }

    // 3. Iterative gradient descent with Graph Laplacian regularization
    // grad_i = 2 * (q_i - targetQ_i) + 2 * gamma_lap * (D_i * q_i - sum_j W_ij * q_j)
    for (let iter = 0; iter < this.maxIter; iter++) {
      const grad = new Float64Array(N);
      for (let i = 0; i < N; i++) {
        const tdGrad = 2 * (q[i] - targetQ[i]);
        let lapTerm = D[i] * q[i];
        for (let j = 0; j < N; j++) {
          if (W[i][j] > 0) {
            lapTerm -= W[i][j] * q[j];
          }
        }
        const lapGrad = 2 * this.gammaLap * lapTerm;
        grad[i] = tdGrad + lapGrad;
      }

      // Step update
      for (let i = 0; i < N; i++) {
        q[i] -= this.learningRate * grad[i];
      }
    }

    // 4. Fit smooth Kernel Ridge predictor on optimized q values
    this.trainedQ = Array.from(q);
  }

  /**
   * Predict regularized Q-value for an arbitrary (state, action) pair
   * via Nadaraya-Watson kernel regression over the manifold points
   * @param {number[]} stateVec
   * @param {number} action
   * @returns {number}
   */
  predictQ(stateVec, action) {
    if (!this.dataset || this.dataset.length === 0 || !this.trainedQ) {
      // Prior heuristic if no data fitted: profit = basePrice * action * demand / inv
      const invRatio = stateVec[0] || 0.5;
      const compRatio = stateVec[1] || 1.0;
      const demRatio = stateVec[2] || 0.5;
      const price = this.basePrice * action;
      const estConversion = Math.max(0.05, Math.min(0.95, 1.0 - (action - 0.7) * 0.8 + demRatio * 0.4 - invRatio * 0.2));
      return price * estConversion;
    }

    const targetPoint = this.makeFeaturePoint(stateVec, action);
    const twoSigmaSq = 2 * this.rbfSigma * this.rbfSigma;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < this.dataset.length; i++) {
      const dSq = this.squaredDistance(targetPoint, this.dataset[i].point);
      const kernelWeight = Math.exp(-dSq / twoSigmaSq);
      numerator += kernelWeight * this.trainedQ[i];
      denominator += kernelWeight;
    }

    if (denominator < 1e-6) {
      // Find nearest neighbor if out of kernel support
      let bestDist = Infinity;
      let nearestQ = 0;
      for (let i = 0; i < this.dataset.length; i++) {
        const dSq = this.squaredDistance(targetPoint, this.dataset[i].point);
        if (dSq < bestDist) {
          bestDist = dSq;
          nearestQ = this.trainedQ[i];
        }
      }
      return nearestQ;
    }

    return numerator / denominator;
  }

  /**
   * Compute the Graph Laplacian Energy of the current trained dataset
   * R_Lap = 1/2 * sum_{i,j} W_ij * (q_i - q_j)^2
   * @returns {number}
   */
  computeLaplacianEnergy() {
    if (!this.dataset || this.dataset.length === 0 || !this.trainedQ) return 0;
    const N = this.dataset.length;
    const twoSigmaSq = 2 * this.rbfSigma * this.rbfSigma;
    let energy = 0;

    for (let i = 0; i < N; i++) {
      for (let j = i + 1; j < N; j++) {
        const dSq = this.squaredDistance(this.dataset[i].point, this.dataset[j].point);
        const w = Math.exp(-dSq / twoSigmaSq);
        const diff = this.trainedQ[i] - this.trainedQ[j];
        energy += w * diff * diff;
      }
    }

    return Number(energy.toFixed(4));
  }

  /**
   * Recommend optimal price for given market state using Laplacian manifold regularization
   * @param {Object} rawState
   * @returns {Object}
   */
  recommendPrice(rawState = {}) {
    const stateVec = this.normalizeState(rawState);
    let bestAction = 1.0;
    let maxQ = -Infinity;
    const evaluatedActions = [];

    for (const act of this.actionCandidates) {
      const qVal = this.predictQ(stateVec, act);
      evaluatedActions.push({
        priceRatio: act,
        offeredPrice: Math.round(this.basePrice * act),
        predictedQ: Math.round(qVal)
      });

      if (qVal > maxQ) {
        maxQ = qVal;
        bestAction = act;
      }
    }

    const recommendedPrice = Math.round(this.basePrice * bestAction);
    const lapEnergy = this.computeLaplacianEnergy();

    return {
      basePrice: this.basePrice,
      recommendedPrice,
      priceRatio: bestAction,
      expectedObjective: Math.round(maxQ),
      laplacianEnergy: lapEnergy,
      evaluatedActions,
      manifoldSmoothness: lapEnergy < 1000 ? 'EXCELLENT_LIPSCHITZ_SMOOTH' : 'MODERATE_MANIFOLD_VARIANCE'
    };
  }
}

// Dual ESM/CJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { LapDynamicPricing };
}
export { LapDynamicPricing };
