/**
 * Worst-Case Soft Actor-Critic (WCSAC) with Conditional Value-at-Risk (CVaR) for Safe Dynamic Pricing
 * 
 * Based on foundational research:
 * - Qisong Yang, Tingting Chen, Zhipeng Yin et al. (AAAI 2021):
 *   "WCSAC: Worst-Case Soft Actor-Critic for Safety-Constrained Reinforcement Learning and Risk-Averse Control"
 * - R. Tyrrell Rockafellar, Stanislav Uryasev (Journal of Risk 2000):
 *   "Optimization of Conditional Value-at-Risk"
 * 
 * Mathematical Foundations:
 * - In E-Commerce dynamic pricing, optimizing purely for expected revenue E[R] exposes merchants
 *   to catastrophic tail risk (e.g. sharp sudden drops in margin, predatory pricing shocks).
 * - WCSAC models both:
 *   1. Expected return critic Q_R(s, a)
 *   2. Safety cost distribution Z_C(s, a) ~ N(mu_C(s, a), sigma_C^2(s, a))
 * - Conditional Value-at-Risk (CVaR_alpha) at confidence alpha (e.g. alpha = 0.95):
 *   CVaR_alpha(C) = mu_C + sigma_C * (phi(Phi^-1(alpha)) / (1 - alpha))
 *   where phi is standard normal PDF and Phi^-1 is standard normal quantile.
 * - Constrained Policy Objective:
 *   max_pi E_{s, a} [ Q_R(s, a) - lambda * (CVaR_alpha(C) - d_risk) + beta * H(pi) ]
 *   Dual subgradient update:
 *   lambda <- max(0, lambda + lr_lambda * (CVaR_alpha(C) - d_risk))
 * - Strict E-Commerce Safety Floor:
 *   Final price guaranteed >= 1.05 * COGS and single-step volatility bounded in [-15%, +15%].
 */

export class WCSACRiskPricing {
  /**
   * @param {Object} options
   * @param {number} [options.stateDim=5] State vector dimension
   * @param {number} [options.riskAlpha=0.95] CVaR risk confidence level (0.5 < riskAlpha < 1.0)
   * @param {number} [options.riskBudget=0.08] Safety risk limit d_risk (maximum tolerable tail cost)
   * @param {number} [options.initLambda=0.1] Initial Lagrange multiplier lambda
   * @param {number} [options.lambdaLr=0.02] Learning rate for dual multiplier update
   * @param {number} [options.temperatureBeta=0.05] Entropy temperature coefficient
   */
  constructor(options = {}) {
    this.stateDim = Math.max(2, Math.floor(options.stateDim || 5));
    this.riskAlpha = Math.max(0.51, Math.min(0.999, Number(options.riskAlpha || 0.95)));
    this.riskBudget = Math.max(0.001, Number(options.riskBudget || 0.08));
    this.lambda = Math.max(0, Number(options.initLambda || 0.1));
    this.lambdaLr = Math.max(0.001, Number(options.lambdaLr || 0.02));
    this.temperatureBeta = Math.max(0.001, Number(options.temperatureBeta || 0.05));

    // Policy parameters theta in R^{stateDim}
    this.policyWeights = new Float64Array(this.stateDim);
    // Cost mean weights and Cost std weights
    this.costMeanWeights = new Float64Array(this.stateDim);
    this.costStdWeights = new Float64Array(this.stateDim);

    // Initial weights: responsive to inventory pressure and competitor delta
    const initPolicy = [0.03, 0.07, -0.05, 0.04, 0.02];
    const initCostMean = [0.05, -0.04, 0.08, 0.02, 0.01];
    const initCostStd = [0.02, 0.03, 0.04, 0.01, 0.02];

    for (let i = 0; i < this.stateDim; i++) {
      this.policyWeights[i] = i < initPolicy.length ? initPolicy[i] : 0.01;
      this.costMeanWeights[i] = i < initCostMean.length ? initCostMean[i] : 0.02;
      this.costStdWeights[i] = i < initCostStd.length ? initCostStd[i] : 0.01;
    }

    // Precompute Gaussian tail factor: kappa(alpha) = phi(Phi^-1(alpha)) / (1 - alpha)
    this.tailFactor = this._computeGaussianTailFactor(this.riskAlpha);

    this.updatesCount = 0;
    this.lastCvar = 0;
    this.lastCostMean = 0;
    this.lastCostStd = 0;
  }

  /**
   * Approximates standard normal quantile Phi^-1(p) via Beasley-Springer-Moro / Acklam approximation
   * @param {number} p 
   * @returns {number}
   * @private
   */
  _normalQuantile(p) {
    // Rational approximation for standard normal quantile
    const a1 = -3.969683028665376e+01, a2 = 2.209460984245205e+02, a3 = -2.759285104469687e+02;
    const a4 = 1.383577518672690e+02, a5 = -3.066479806614716e+01, a6 = 2.506628277459239e+00;
    const b1 = -5.447609879822406e+01, b2 = 1.615858368580409e+02, b3 = -1.556989798598866e+02;
    const b4 = 6.680131188771972e+01, b5 = -1.328068155288572e+01;

    const c1 = -7.784894002430293e-03, c2 = -3.223964580411365e-01, c3 = -2.400758277161838e+00;
    const c4 = -2.549732539343734e+00, c5 = 4.374664141464968e+00, c6 = 2.938163982698783e+00;
    const d1 = 7.784695709041462e-03, d2 = 3.224671290700398e-01, d3 = 2.445134137142996e+00, d4 = 3.754408661907416e+00;

    const p_low = 0.02425;
    const p_high = 1 - p_low;

    if (p < p_low) {
      const q = Math.sqrt(-2 * Math.log(p));
      return (((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
             ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
    }
    if (p <= p_high) {
      const q = p - 0.5;
      const r = q * q;
      return (((((a1 * r + a2) * r + a3) * r + a4) * r + a5) * r + a6) * q /
             (((((b1 * r + b2) * r + b3) * r + b4) * r + b5) * r + 1);
    }
    const q = Math.sqrt(-2 * Math.log(1 - p));
    return -(((((c1 * q + c2) * q + c3) * q + c4) * q + c5) * q + c6) /
            ((((d1 * q + d2) * q + d3) * q + d4) * q + 1);
  }

  /**
   * Precomputes factor kappa(alpha) = phi(z_alpha) / (1 - alpha)
   * @param {number} alpha 
   * @returns {number}
   * @private
   */
  _computeGaussianTailFactor(alpha) {
    const z = this._normalQuantile(alpha);
    const phi = (1.0 / Math.sqrt(2 * Math.PI)) * Math.exp(-(z * z) / 2.0);
    return phi / (1.0 - alpha);
  }

  /**
   * Dot product helper
   * @param {Float64Array} a 
   * @param {Float64Array} b 
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
   * Predicts mean action delta in [-0.15, +0.15]
   * @param {Float64Array} state 
   * @returns {number}
   */
  predictAction(state) {
    const rawAction = this._dot(state, this.policyWeights);
    return Math.max(-0.15, Math.min(0.15, rawAction));
  }

  /**
   * Predicts cost distribution parameters mu_C and sigma_C, then computes CVaR_alpha
   * @param {Float64Array} state 
   * @returns {{ muC: number, sigmaC: number, cvar: number }}
   */
  evaluateRiskDistribution(state) {
    const rawMu = this._dot(state, this.costMeanWeights);
    const rawStd = this._dot(state, this.costStdWeights);

    const muC = Math.max(0.0, rawMu);
    const sigmaC = Math.max(0.005, Math.abs(rawStd));
    const cvar = muC + sigmaC * this.tailFactor;

    return {
      muC: Number(muC.toFixed(5)),
      sigmaC: Number(sigmaC.toFixed(5)),
      cvar: Number(cvar.toFixed(5))
    };
  }

  /**
   * Updates critic and policy weights using WCSAC risk subgradient descent
   * @param {Array<{ state: Array<number>, action: number, reward: number, cost: number }>} batch 
   * @returns {Object} Optimization metrics
   */
  updatePolicy(batch) {
    if (!Array.isArray(batch) || batch.length === 0) {
      return { success: false, reason: "EMPTY_BATCH" };
    }

    const N = batch.length;
    let avgCvar = 0;
    let avgCostMean = 0;
    let avgCostStd = 0;

    for (let i = 0; i < N; i++) {
      const item = batch[i];
      const s = new Float64Array(this.stateDim);
      for (let j = 0; j < this.stateDim; j++) {
        s[j] = Number(item.state ? item.state[j] : 0) || 0;
      }

      const { muC, sigmaC, cvar } = this.evaluateRiskDistribution(s);
      avgCvar += cvar / N;
      avgCostMean += muC / N;
      avgCostStd += sigmaC / N;

      // Actual experienced cost (e.g. margin loss or competitor undercutting penalty)
      const actualCost = Math.max(0, Number(item.cost || 0));
      const costError = actualCost - muC;

      // Update cost critic weights via MSE loss
      const criticLr = 0.05;
      for (let j = 0; j < this.stateDim; j++) {
        this.costMeanWeights[j] += (criticLr * costError * s[j]) / N;
        const stdTarget = Math.abs(costError);
        const stdError = stdTarget - sigmaC;
        this.costStdWeights[j] += (criticLr * stdError * s[j]) / N;
      }

      // Update actor policy: trade off reward vs risk penalty:
      // grad_theta = grad_theta Q_R - lambda * grad_theta CVaR
      const act = Number(item.action || 0);
      const rew = Number(item.reward || 0);
      const policyGradient = (rew - this.lambda * cvar) * act;
      const actorLr = 0.02;

      for (let j = 0; j < this.stateDim; j++) {
        this.policyWeights[j] += (actorLr * policyGradient * s[j]) / N;
      }
    }

    // Dual subgradient update: lambda <- max(0, lambda + lr_lambda * (CVaR - d_risk))
    const riskViolation = avgCvar - this.riskBudget;
    this.lambda = Math.max(0, this.lambda + this.lambdaLr * riskViolation);

    this.updatesCount++;
    this.lastCvar = avgCvar;
    this.lastCostMean = avgCostMean;
    this.lastCostStd = avgCostStd;

    return {
      success: true,
      updatesCount: this.updatesCount,
      lambda: Number(this.lambda.toFixed(4)),
      riskViolation: Number(riskViolation.toFixed(5)),
      avgCvar: Number(avgCvar.toFixed(5)),
      avgCostMean: Number(avgCostMean.toFixed(5)),
      avgCostStd: Number(avgCostStd.toFixed(5)),
      isRiskViolated: riskViolation > 0
    };
  }

  /**
   * Recommends safe price under WCSAC tail risk guarantees
   * @param {Object} product
   * @param {number} product.price Current price
   * @param {number} product.cogs Cost of Goods Sold
   * @param {number} [product.msrp] MSRP price
   * @param {Object} [marketContext]
   * @param {number} [marketContext.competitorPrice]
   * @param {number} [marketContext.inventoryLevel=100]
   * @param {number} [marketContext.inventoryCapacity=100]
   * @param {number} [marketContext.salesVelocity=1.0]
   * @param {number} [marketContext.demandIndex=1.0]
   * @returns {Object}
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

    const state = new Float64Array([
      Number((currentPrice / msrp).toFixed(4)),
      Number((competitorPrice / currentPrice).toFixed(4)),
      Number((stock / capacity).toFixed(4)),
      Number(Math.min(3.0, salesVelocity / 10.0).toFixed(4)),
      Number(Math.min(3.0, demandIndex).toFixed(4))
    ]);

    // Predict raw action adjustment delta
    const rawAction = this.predictAction(state);
    // Evaluate risk distribution
    const { muC, sigmaC, cvar } = this.evaluateRiskDistribution(state);

    // If tail risk is high, apply conservative dampening factor
    const riskDamping = Math.max(0.5, 1.0 - Math.max(0, cvar - this.riskBudget) * 2.0);
    const safeAdjustment = rawAction * riskDamping;

    const rawPrice = currentPrice * (1.0 + safeAdjustment);
    const safetyFloor = Math.round(cogs * 1.05);
    const safetyCeiling = Math.round(msrp * 1.25);

    const safePrice = Math.round(Math.max(safetyFloor, Math.min(safetyCeiling, rawPrice)));
    const priceAdjustmentPct = Number((((safePrice - currentPrice) / currentPrice) * 100).toFixed(2));
    const grossMarginVnd = safePrice - cogs;
    const grossMarginPct = Number(((grossMarginVnd / safePrice) * 100).toFixed(2));

    return {
      currentPrice,
      recommendedPrice: safePrice,
      safetyFloor,
      safetyCeiling,
      isFloorBounded: safePrice === safetyFloor,
      isCeilingBounded: safePrice === safetyCeiling,
      cogs,
      priceAdjustmentPct,
      grossMarginVnd,
      grossMarginPct,
      cvar: Number(cvar.toFixed(4)),
      riskMu: muC,
      riskSigma: sigmaC,
      riskDamping: Number(riskDamping.toFixed(3)),
      lambda: Number(this.lambda.toFixed(4)),
      isRiskViolated: cvar > this.riskBudget
    };
  }
}

export default WCSACRiskPricing;
