/**
 * Turnstile Count-Sketch for Dynamic Heavy Hitters with Deletions
 * (TurnstileCountSketchHeavyHitters)
 * 
 * Theoretical Foundations:
 * - Moses Charikar, Kevin Chen, Martin Farach-Colton (ICALP 2002 / Theoretical Computer Science 2004)
 *   "Finding Frequent Items in Data Streams"
 * - Graham Cormode, S. Muthukrishnan (ACM TODS 2005 / PODS 2003)
 *   "What's Hot and What's Not: Tracking Most Frequent Items Dynamically"
 * - Graham Cormode, Minos Garofalakis, Peter J. Haas, Chris Jermaine (2012)
 *   "Synopses for Massive Data: Samples, Histograms, Wavelets, Sketches"
 * 
 * Mathematical Formulation:
 * 1. Turnstile Stream Model:
 *    Stream updates arrive as pairs (x, \Delta) with \Delta in \mathbb{R} (both positive additions
 *    and negative cancellations / refunds). Conventional sketches (Space-Saving, Lossy Counting)
 *    fail under deletions; Count-Sketch maintains provable linear invariants under arbitrary \Delta.
 * 2. Sketch Geometry:
 *    Matrix of d rows and w columns: C[j, k] for j = 0..d-1, k = 0..w-1.
 *    where:
 *      d = ceil(ln(1 / delta)) (typically 5 to 7)
 *      w = ceil(3 / epsilon^2) (typically 100 to 1000)
 *    Pairwise independent hash functions:
 *      h_j: U -> {0, ..., w - 1}
 *      s_j: U -> {-1, +1} (Rademacher random variable)
 * 3. Update Operation:
 *    For each row j:
 *      C[j, h_j(x)] <- C[j, h_j(x)] + \Delta * s_j(x)
 * 4. Unbiased Point Query:
 *    \hat{f}(x) = median_{j=0}^{d-1} ( s_j(x) * C[j, h_j(x)] )
 *    Guarantees:
 *      E[\hat{f}(x)] = f(x) (Strictly unbiased!)
 *      Var[\hat{f}(x)] <= ||a||_2^2 / w
 * 5. Heavy Hitters Tracking:
 *    An item is a phi-Heavy Hitter if |\hat{f}(x)| >= phi * ||a||_1 (or L2 norm).
 *    A candidate set is maintained and pruned dynamically.
 * 6. Mergeability:
 *    C_merged = C_A + C_B (exact component-wise sum).
 */

export class TurnstileCountSketchHeavyHitters {
  /**
   * @param {Object} [options]
   * @param {number} [options.depth=5] Number of hash rows (d)
   * @param {number} [options.width=256] Number of hash buckets per row (w)
   * @param {number} [options.epsilon=0.05] Accuracy parameter (epsilon)
   * @param {number} [options.phi=0.02] Heavy hitter threshold fraction (2% of stream)
   */
  constructor(options = {}) {
    this.depth = Math.max(3, Math.floor(Number(options.depth || options.d || 5)));
    this.width = Math.max(16, Math.floor(Number(options.width || options.w || 256)));
    this.epsilon = Number(options.epsilon || (Math.sqrt(3 / this.width)).toFixed(4));
    this.phi = Math.max(0.001, Math.min(0.5, Number(options.phi || 0.02)));

    // 2D Matrix of counters: depth x width
    this.table = Array.from({ length: this.depth }, () => new Float64Array(this.width));

    // Seeds for 2-universal hash functions: h_j(x) = (a_j * hash(x) + b_j) mod P mod w
    // and s_j(x) = ((c_j * hash(x) + d_j) mod P mod 2) == 0 ? 1 : -1
    this.prime = 2147483647; // 2^31 - 1 Mersenne prime
    this.hashParams = [];
    for (let j = 0; j < this.depth; j++) {
      this.hashParams.push({
        a: 1 + Math.floor(Math.random() * (this.prime - 2)),
        b: Math.floor(Math.random() * this.prime),
        c: 1 + Math.floor(Math.random() * (this.prime - 2)),
        d: Math.floor(Math.random() * this.prime)
      });
    }

    // Candidate tracking dictionary for efficient Heavy Hitters extraction
    this.candidates = new Map(); // key -> current estimated frequency
    this.totalPositiveUpdates = 0;
    this.totalNegativeUpdates = 0;
    this.netWeight = 0;
    this.totalL1Norm = 0;
  }

  get n() {
    return this.netWeight;
  }

  get l1Norm() {
    return this.totalL1Norm;
  }

  /**
   * Universal 32-bit FNV-1a hash for string or numeric key
   */
  _hashKey(key) {
    const str = String(key);
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  _getRowBucket(row, rawHash) {
    const { a, b } = this.hashParams[row];
    const val = (Number(BigInt(a) * BigInt(rawHash) + BigInt(b)) % this.prime + this.prime) % this.prime;
    return val % this.width;
  }

  _getRowSign(row, rawHash) {
    const { c, d } = this.hashParams[row];
    const val = (Number(BigInt(c) * BigInt(rawHash) + BigInt(d)) % this.prime + this.prime) % this.prime;
    return (val % 2 === 0) ? 1 : -1;
  }

  /**
   * Processes a turnstile update (key, delta) where delta can be positive or negative
   * @param {string|number} key Item identifier
   * @param {number} [delta=1] Increment or decrement (e.g. cancellation)
   */
  update(key, delta = 1) {
    const dVal = Number(delta);
    if (!Number.isFinite(dVal) || dVal === 0) return;

    const rawHash = this._hashKey(key);
    const keyStr = String(key);

    for (let j = 0; j < this.depth; j++) {
      const bucket = this._getRowBucket(j, rawHash);
      const sign = this._getRowSign(j, rawHash);
      this.table[j][bucket] += dVal * sign;
    }

    if (dVal > 0) {
      this.totalPositiveUpdates += dVal;
    } else {
      this.totalNegativeUpdates += Math.abs(dVal);
    }

    this.netWeight += dVal;
    this.totalL1Norm += Math.abs(dVal);

    // Track candidates with periodic pruning
    const est = this.estimate(keyStr);
    if (Math.abs(est) >= this.phi * Math.max(1, this.netWeight)) {
      this.candidates.set(keyStr, est);
    } else {
      this.candidates.delete(keyStr);
    }
  }

  /**
   * Alias for update(key, 1)
   */
  insert(key, weight = 1) {
    this.update(key, weight);
  }

  /**
   * Processes item return, revocation or cancellation
   */
  cancel(key, weight = 1) {
    this.update(key, -Math.abs(weight));
  }

  /**
   * Estimates frequency of key via row-wise median of signed counters
   * @param {string|number} key
   * @returns {number}
   */
  estimate(key) {
    const rawHash = this._hashKey(key);
    const estimates = new Float64Array(this.depth);

    for (let j = 0; j < this.depth; j++) {
      const bucket = this._getRowBucket(j, rawHash);
      const sign = this._getRowSign(j, rawHash);
      estimates[j] = this.table[j][bucket] * sign;
    }

    // Sort to compute median
    estimates.sort();
    const mid = Math.floor(this.depth / 2);
    const medianEst = (this.depth % 2 === 1)
      ? estimates[mid]
      : (estimates[mid - 1] + estimates[mid]) / 2;

    return Number(medianEst.toFixed(4));
  }

  /**
   * Returns heavy hitters exceeding phi fraction of stream volume
   * @param {number} [customPhi] Optional override threshold
   */
  getHeavyHitters(customPhi) {
    const thresholdFraction = customPhi !== undefined ? customPhi : this.phi;
    const threshold = thresholdFraction * Math.max(1, Math.abs(this.netWeight));

    const result = [];
    for (const [key] of this.candidates) {
      const est = this.estimate(key);
      if (Math.abs(est) >= threshold) {
        result.push({
          key,
          estimatedFrequency: Math.round(est),
          isPositive: est >= 0,
          fractionOfStream: Number((Math.abs(est) / Math.max(1, Math.abs(this.netWeight))).toFixed(4))
        });
      }
    }

    result.sort((a, b) => Math.abs(b.estimatedFrequency) - Math.abs(a.estimatedFrequency));
    return result;
  }

  /**
   * Merges another Turnstile Count-Sketch of identical dimensions
   * @param {TurnstileCountSketchHeavyHitters} other
   */
  merge(other) {
    if (!other || other.depth !== this.depth || other.width !== this.width) {
      throw new Error("Cannot merge Turnstile Count-Sketches with mismatched dimensions");
    }

    for (let j = 0; j < this.depth; j++) {
      for (let k = 0; k < this.width; k++) {
        this.table[j][k] += other.table[j][k];
      }
    }

    this.netWeight += other.netWeight;
    this.totalL1Norm += other.totalL1Norm;
    this.totalPositiveUpdates += other.totalPositiveUpdates;
    this.totalNegativeUpdates += other.totalNegativeUpdates;

    // Merge candidate pools
    for (const [key] of other.candidates) {
      const est = this.estimate(key);
      if (Math.abs(est) >= this.phi * Math.max(1, Math.abs(this.netWeight))) {
        this.candidates.set(key, est);
      }
    }

    return this;
  }

  /**
   * Returns internal sketch telemetry and summary metrics
   */
  getSummary() {
    return {
      depth: this.depth,
      width: this.width,
      epsilon: this.epsilon,
      phi: this.phi,
      netWeight: this.netWeight,
      totalL1Norm: this.totalL1Norm,
      totalPositiveUpdates: this.totalPositiveUpdates,
      totalNegativeUpdates: this.totalNegativeUpdates,
      trackedCandidatesCount: this.candidates.size,
      heavyHittersCount: this.getHeavyHitters().length
    };
  }
}
