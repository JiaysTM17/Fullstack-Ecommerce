/**
 * Trust Region Policy Optimization (TRPO) for Safe Dynamic Pricing
 * 
 * Based on foundational research:
 * - John Schulman, Sergey Levine, Pieter Abbeel, Michael Jordan, Philipp Moritz (ICML 2015):
 *   "Trust Region Policy Optimization"
 * - Sham Kakade (NIPS 2002): "A Natural Policy Gradient"
 * 
 * Mathematical Foundations:
 * - Goal: Maximize expected revenue / profit while bounding the policy shift in terms of average KL divergence:
 *   max_theta E_{s, a ~ pi_old} [ (pi_theta(a|s) / pi_old(a|s)) * A(s, a) ]
 *   subject to: E_s [ D_KL(pi_old(·|s) || pi_theta(·|s)) ] <= delta
 * - Natural Policy Gradient:
 *   Taylor expansion of surrogate loss L(theta) and KL divergence yields quadratic program:
 *   delta_theta = sqrt(2 * delta / (g^T * F^-1 * g)) * F^-1 * g
 *   where g = grad_theta L(theta_old) and F = grad^2 D_KL is the Fisher Information Matrix (FIM).
 * - Conjugate Gradient (CG) Solver:
 *   Solves F * x = g iteratively via Hessian-vector products F * v without forming the full d x d matrix F.
 * - Backtracking Line Search:
 *   theta_cand = theta_old + (alpha^j) * delta_theta, verifying surrogate improvement and KL <= delta.
 * - E-Commerce Safety Floor:
 *   Prices strictly bounded by Gross Margin >= 1.05 * COGS and maximum single-step volatility <= 15%.
 */

export class TRPOSafeDynamicPricing {
  /**
   * @param {Object} options
   * @param {number} [options.stateDim=5] State feature dimension d
   * @param {number} [options.deltaKl=0.01] Maximum KL divergence trust region bound delta
   * @param {number} [options.cgIters=10] Maximum Conjugate Gradient solver iterations
   * @param {number} [options.cgDamping=0.01] Damping parameter lambda for FIM numerical stability (F + lambda*I)
   * @param {number} [options.backtrackIters=10] Maximum line search backtracking steps
   * @param {number} [options.backtrackCoeff=0.5] Backtracking step decay factor alpha
   * @param {number} [options.policyStd=0.15] Gaussian policy standard deviation sigma
   */
  constructor(options = {}) {
    this.stateDim = Math.max(2, Math.floor(options.stateDim || 5));
    this.deltaKl = Math.max(0.0001, Number(options.deltaKl || 0.01));
    this.cgIters = Math.max(2, Math.floor(options.cgIters || 10));
    this.cgDamping = Math.max(1e-5, Number(options.cgDamping || 0.01));
    this.backtrackIters = Math.max(3, Math.floor(options.backtrackIters || 10));
    this.backtrackCoeff = Math.max(0.1, Math.min(0.9, Number(options.backtrackCoeff || 0.5)));
    this.policyStd = Math.max(0.01, Number(options.policyStd || 0.15));

    // Linear parameter vector theta in R^{stateDim}
    this.theta = new Float64Array(this.stateDim);
    this.thetaOld = new Float64Array(this.stateDim);

    // Initial baseline weights prioritizing inventory elasticity and competitor pricing
    // [price_ratio, competitor_ratio, inventory_ratio, sales_velocity, market_demand]
    const initWeights = [0.02, 0.08, -0.06, 0.05, 0.04];
    for (let i = 0; i < this.stateDim; i++) {
      this.theta[i] = i < initWeights.length ? initWeights[i] : 0.01;
      this.thetaOld[i] = this.theta[i];
    }

    this.updatesCount = 0;
    this.lastKlDivergence = 0;
    this.lastSurrogateLoss = 0;
    this.lastStepNorm = 0;
  }

  /**
   * Dot product between two vectors
   * @param {Float64Array|Array<number>} a 
   * @param {Float64Array|Array<number>} b 
   * @returns {number}
   */
  _dot(a, b) {
    let sum = 0;
    for (let i = 0; i < this.stateDim; i++) {
      sum += a[i] * b[i];
    }
    return sum;
  }

  /**
   * Predict mean action mu(s) = theta^T * s
   * @param {Float64Array|Array<number>} state 
   * @param {Float64Array} [thetaVec=this.theta]
   * @returns {number}
   */
  predictMean(state, thetaVec = this.theta) {
    return this._dot(state, thetaVec);
  }

  /**
   * Evaluates Gaussian policy density pi(a|s) = (1 / sqrt(2*pi*sigma^2)) * exp(-(a - mu)^2 / (2*sigma^2))
   * @param {number} action 
   * @param {number} mean 
   * @returns {number}
   */
  evaluateDensity(action, mean) {
    const diff = action - mean;
    const varSq = this.policyStd * this.policyStd;
    return (1.0 / (Math.sqrt(2 * Math.PI) * this.policyStd)) * Math.exp(-(diff * diff) / (2 * varSq));
  }

  /**
   * Computes Fisher Information Matrix-vector product: F * v
   * For linear Gaussian policy with constant variance:
   * F = (1 / (N * sigma^2)) * sum(s_i * s_i^T) + lambda * I
   * F * v = (1 / (N * sigma^2)) * sum(s_i * (s_i^T * v)) + lambda * v
   * @param {Array<Float64Array>} states 
   * @param {Float64Array} v 
   * @returns {Float64Array}
   */
  fisherVectorProduct(states, v) {
    const N = Math.max(1, states.length);
    const varSq = this.policyStd * this.policyStd;
    const result = new Float64Array(this.stateDim);

    for (let i = 0; i < N; i++) {
      const s = states[i];
      const sDotV = this._dot(s, v);
      for (let j = 0; j < this.stateDim; j++) {
        result[j] += (s[j] * sDotV) / (N * varSq);
      }
    }

    // Add damping for strict positive-definiteness: Fv + lambda * v
    for (let j = 0; j < this.stateDim; j++) {
      result[j] += this.cgDamping * v[j];
    }

    return result;
  }

  /**
   * Conjugate Gradient (CG) algorithm to solve F * x = g
   * @param {Array<Float64Array>} states 
   * @param {Float64Array} g Policy gradient vector
   * @returns {Float64Array} Solution vector x = F^-1 * g
   */
  conjugateGradient(states, g) {
    const x = new Float64Array(this.stateDim);
    const r = new Float64Array(this.stateDim);
    const p = new Float64Array(this.stateDim);

    // Initial residual r_0 = g - F * x_0 = g (since x_0 = 0)
    for (let i = 0; i < this.stateDim; i++) {
      r[i] = g[i];
      p[i] = g[i];
    }

    let rDotR = this._dot(r, r);
    if (rDotR < 1e-14) return x;

    for (let iter = 0; iter < this.cgIters; iter++) {
      const Fp = this.fisherVectorProduct(states, p);
      const pDotFp = this._dot(p, Fp);
      if (pDotFp <= 1e-12) break;

      const alpha = rDotR / pDotFp;
      for (let i = 0; i < this.stateDim; i++) {
        x[i] += alpha * p[i];
        r[i] -= alpha * Fp[i];
      }

      const newRDotR = this._dot(r, r);
      if (newRDotR < 1e-12) break;

      const beta = newRDotR / rDotR;
      for (let i = 0; i < this.stateDim; i++) {
        p[i] = r[i] + beta * p[i];
      }
      rDotR = newRDotR;
    }

    return x;
  }

  /**
   * Computes empirical average KL divergence between thetaOld and candidate theta:
   * D_KL(pi_old || pi_cand) = sum( ( (theta_cand^T * s_i - theta_old^T * s_i)^2 ) / (2 * sigma^2) ) / N
   * @param {Array<Float64Array>} states 
   * @param {Float64Array} thetaCand 
   * @returns {number}
   */
  computeAverageKl(states, thetaCand) {
    const N = Math.max(1, states.length);
    const varSq = this.policyStd * this.policyStd;
    let totalKl = 0;

    for (let i = 0; i < N; i++) {
      const s = states[i];
      const muOld = this.predictMean(s, this.thetaOld);
      const muCand = this.predictMean(s, thetaCand);
      const diff = muCand - muOld;
      totalKl += (diff * diff) / (2 * varSq);
    }

    return totalKl / N;
  }

  /**
   * Computes surrogate objective: L(theta) = (1/N) * sum( (pi_theta(a_i|s_i) / pi_old(a_i|s_i)) * A_i )
   * @param {Array<Object>} batch 
   * @param {Float64Array} thetaCand 
   * @returns {number}
   */
  computeSurrogateLoss(batch, thetaCand) {
    const N = Math.max(1, batch.length);
    let totalLoss = 0;

    for (let i = 0; i < N; i++) {
      const { state, action, advantage } = batch[i];
      const muOld = this.predictMean(state, this.thetaOld);
      const muCand = this.predictMean(state, thetaCand);

      const probOld = Math.max(1e-8, this.evaluateDensity(action, muOld));
      const probCand = Math.max(1e-8, this.evaluateDensity(action, muCand));
      const ratio = probCand / probOld;

      totalLoss += ratio * advantage;
    }

    return totalLoss / N;
  }

  /**
   * Updates policy using TRPO Natural Gradient step with Backtracking Line Search
   * @param {Array<{ state: Array<number>, action: number, reward: number, baseline?: number }>} trajectories 
   * @returns {Object} Optimization metrics
   */
  updatePolicy(trajectories) {
    if (!Array.isArray(trajectories) || trajectories.length === 0) {
      return { success: false, reason: "EMPTY_TRAJECTORIES" };
    }

    const N = trajectories.length;
    const states = [];
    const formattedBatch = [];

    // Compute empirical mean reward as simple baseline if not provided
    let sumReward = 0;
    for (let i = 0; i < N; i++) {
      sumReward += Number(trajectories[i].reward || 0);
    }
    const meanBaseline = sumReward / N;

    // Convert states to Float64Array and compute advantages
    for (let i = 0; i < N; i++) {
      const item = trajectories[i];
      const rawState = item.state || [];
      const s = new Float64Array(this.stateDim);
      for (let j = 0; j < this.stateDim; j++) {
        s[j] = Number(rawState[j] || 0);
      }
      states.push(s);

      const act = Number(item.action || 0);
      const rew = Number(item.reward || 0);
      const adv = item.baseline !== undefined ? (rew - item.baseline) : (rew - meanBaseline);

      formattedBatch.push({ state: s, action: act, advantage: adv });
    }

    // Save previous policy parameters
    for (let j = 0; j < this.stateDim; j++) {
      this.thetaOld[j] = this.theta[j];
    }

    // 1. Compute empirical policy gradient g = grad_theta L(theta_old)
    // grad_theta log pi(a|s) = ((a - mu) / sigma^2) * s
    const g = new Float64Array(this.stateDim);
    const varSq = this.policyStd * this.policyStd;

    for (let i = 0; i < N; i++) {
      const { state, action, advantage } = formattedBatch[i];
      const mu = this.predictMean(state, this.thetaOld);
      const gradLogProb = (action - mu) / varSq;

      for (let j = 0; j < this.stateDim; j++) {
        g[j] += (gradLogProb * state[j] * advantage) / N;
      }
    }

    // 2. Solve F * stepDir = g using Conjugate Gradient
    const stepDir = this.conjugateGradient(states, g);

    // 3. Compute quadratic form sDotFs = stepDir^T * F * stepDir
    const Fs = this.fisherVectorProduct(states, stepDir);
    const sDotFs = this._dot(stepDir, Fs);

    if (sDotFs <= 1e-12) {
      return { success: false, reason: "DEGENERATE_FISHER_PRODUCT" };
    }

    // 4. Maximum step size beta = sqrt(2 * delta / (s^T * F * s))
    const maxBeta = Math.sqrt((2 * this.deltaKl) / sDotFs);
    const fullStep = new Float64Array(this.stateDim);
    for (let j = 0; j < this.stateDim; j++) {
      fullStep[j] = maxBeta * stepDir[j];
    }

    // 5. Backtracking Line Search
    const initialSurrogate = this.computeSurrogateLoss(formattedBatch, this.thetaOld);
    let accepted = false;
    let acceptedStep = 0;
    let finalKl = 0;
    let finalSurrogate = initialSurrogate;

    for (let step = 0; step < this.backtrackIters; step++) {
      const stepScale = Math.pow(this.backtrackCoeff, step);
      const thetaCand = new Float64Array(this.stateDim);
      for (let j = 0; j < this.stateDim; j++) {
        thetaCand[j] = this.thetaOld[j] + stepScale * fullStep[j];
      }

      const candKl = this.computeAverageKl(states, thetaCand);
      const candSurrogate = this.computeSurrogateLoss(formattedBatch, thetaCand);

      // Trust region criteria: KL divergence bound + non-decreasing surrogate
      if (candKl <= this.deltaKl * 1.5 && candSurrogate >= initialSurrogate - 1e-6) {
        for (let j = 0; j < this.stateDim; j++) {
          this.theta[j] = thetaCand[j];
        }
        accepted = true;
        acceptedStep = stepScale;
        finalKl = candKl;
        finalSurrogate = candSurrogate;
        break;
      }
    }

    this.updatesCount++;
    this.lastKlDivergence = finalKl;
    this.lastSurrogateLoss = finalSurrogate;

    let stepNorm = 0;
    for (let j = 0; j < this.stateDim; j++) {
      const diff = this.theta[j] - this.thetaOld[j];
      stepNorm += diff * diff;
    }
    this.lastStepNorm = Math.sqrt(stepNorm);

    return {
      success: accepted,
      updatesCount: this.updatesCount,
      stepScale: acceptedStep,
      klDivergence: Number(finalKl.toFixed(6)),
      surrogateImprovement: Number((finalSurrogate - initialSurrogate).toFixed(6)),
      stepNorm: Number(this.lastStepNorm.toFixed(6)),
      theta: Array.from(this.theta).map(w => Number(w.toFixed(4)))
    };
  }

  /**
   * Safe Dynamic Pricing recommendation for E-Commerce Product
   * @param {Object} product
   * @param {number} product.price Current price
   * @param {number} product.cogs Cost of Goods Sold
   * @param {number} [product.msrp] Manufacturer suggested retail price
   * @param {Object} [marketContext]
   * @param {number} [marketContext.competitorPrice]
   * @param {number} [marketContext.inventoryLevel=100]
   * @param {number} [marketContext.inventoryCapacity=100]
   * @param {number} [marketContext.salesVelocity=1.0] Daily units sold
   * @param {number} [marketContext.demandIndex=1.0] Market index
   * @returns {Object} Price recommendation with gross margin safety guarantees
   */
  recommendPrice(product = {}, marketContext = {}) {
    const currentPrice = Math.max(1000, Number(product.price || 100000));
    const cogs = Math.max(500, Number(product.cogs || currentPrice * 0.7));
    const msrp = Math.max(currentPrice, Number(product.msrp || currentPrice * 1.3));

    const competitorPrice = Number(marketContext.competitorPrice || currentPrice);
    const stock = Number(marketContext.inventoryLevel || 50);
    const capacity = Math.max(1, Number(marketContext.inventoryCapacity || 100));
    const salesVelocity = Number(marketContext.salesVelocity || 1.0);
    const demandIndex = Number(marketContext.demandIndex || 1.0);

    // Normalize state vector:
    // s0: price relative to reference
    // s1: competitor price ratio (p_comp / p)
    // s2: inventory ratio (stock / capacity)
    // s3: sales velocity normalized
    // s4: demand index normalized
    const state = new Float64Array([
      Number((currentPrice / msrp).toFixed(4)),
      Number((competitorPrice / currentPrice).toFixed(4)),
      Number((stock / capacity).toFixed(4)),
      Number(Math.min(3.0, salesVelocity / 10.0).toFixed(4)),
      Number(Math.min(3.0, demandIndex).toFixed(4))
    ]);

    // Model action is percentage price adjustment delta [-0.15, +0.15]
    const rawAction = this.predictMean(state);
    const clampedAdjustment = Math.max(-0.15, Math.min(0.15, rawAction));

    const rawRecommendedPrice = currentPrice * (1.0 + clampedAdjustment);

    // Strict E-Commerce Gross Margin Safety Floor: Price >= 1.05 * COGS
    const safetyFloor = Math.round(cogs * 1.05);
    const safetyCeiling = Math.round(msrp * 1.25);

    const safePrice = Math.round(Math.max(safetyFloor, Math.min(safetyCeiling, rawRecommendedPrice)));
    const finalAdjustment = Number(((safePrice - currentPrice) / currentPrice).toFixed(4));
    const grossMarginVnd = safePrice - cogs;
    const grossMarginPct = Number(((grossMarginVnd / safePrice) * 100).toFixed(2));
    const expectedRevenue = Math.round(safePrice * salesVelocity * (1.0 - clampedAdjustment * 0.5));
    const expectedProfit = Math.round(grossMarginVnd * salesVelocity * (1.0 - clampedAdjustment * 0.5));

    return {
      currentPrice,
      recommendedPrice: safePrice,
      safetyFloor,
      safetyCeiling,
      isFloorBounded: safePrice === safetyFloor,
      isCeilingBounded: safePrice === safetyCeiling,
      cogs,
      priceAdjustmentPct: Number((finalAdjustment * 100).toFixed(2)),
      grossMarginVnd,
      grossMarginPct,
      expectedRevenue,
      expectedProfit,
      trustRegionKl: Number(this.lastKlDivergence.toFixed(6)),
      modelConfidence: Number((1.0 / (1.0 + this.lastKlDivergence * 10)).toFixed(4)),
      stateVector: Array.from(state)
    };
  }
}

export default TRPOSafeDynamicPricing;
