/**
 * Greenwald-Khanna Deterministic Streaming Quantile Sketch (GKQuantileMergeableSketch)
 * 
 * Theoretical Foundations:
 * - Michael Greenwald, Sanjeev Khanna (ACM SIGMOD 2001)
 *   "Space-Efficient Online Computation of Quantile Summaries"
 * - Pankaj K. Agarwal, Graham Cormode, Zengfeng Huang, Jeff M. Phillips, Zhewei Wei, Ke Yi (ACM TALG 2013)
 *   "Mergeable Summaries"
 * - Graham Cormode, Minos Garofalakis, Peter J. Haas, Chris Jermaine (Foundations and Trends in Databases 2012)
 *   "Synopses for Massive Data: Samples, Histograms, Wavelets, Sketches"
 * 
 * Mathematical Formulation:
 * 1. Tuple Representation:
 *    Maintains an ordered sequence S = (t_0, t_1, ..., t_{s-1}) of tuples:
 *      t_i = (v_i, g_i, \Delta_i)
 *    where:
 *      - v_i: sampled element value, strictly sorted v_0 <= v_1 <= ... <= v_{s-1}
 *      - g_i = r_min(v_i) - r_min(v_{i-1}) (marginal minimum rank difference, g_0 = 1)
 *      - \Delta_i = r_max(v_i) - r_min(v_i) (rank uncertainty bound)
 * 2. Deterministic Epsilon Invariant:
 *    For every tuple t_i:
 *      g_i + \Delta_i <= 2 * \epsilon * n
 *    where n = \sum_{i=0}^{s-1} g_i is the total number of items inserted.
 * 3. Quantile Query Guarantee:
 *    For any target quantile q in [0, 1] with target rank r* = ceil(q * n):
 *    The returned estimate satisfies:
 *      |rank(estimate) - r*| <= \epsilon * n
 * 4. Compression (Compaction):
 *    Periodically scans adjacent elements from right to left:
 *    If g_i + g_{i+1} + \Delta_{i+1} <= 2 * \epsilon * n:
 *      Merge t_i into t_{i+1}: g_{i+1} <- g_{i+1} + g_i, delete t_i.
 * 5. Deterministic Merging:
 *    Two GK sketches S_1, S_2 can be merged into a new summary with n = n_1 + n_2
 *    and error bound eps = max(eps_1, eps_2).
 */

export class GKQuantileMergeableSketch {
  /**
   * @param {Object} [options]
   * @param {number} [options.epsilon=0.01] Maximum rank error bound (0.01 = 1%)
   * @param {number} [options.eps] Alias for epsilon
   */
  constructor(options = {}) {
    const rawEps = options.epsilon !== undefined ? options.epsilon : (options.eps !== undefined ? options.eps : 0.01);
    this.epsilon = Math.min(0.5, Math.max(0.0001, Number(rawEps)));
    this.eps = this.epsilon;

    // Ordered array of tuples: { v: number, g: number, delta: number }
    this.entries = [];
    this.totalCount = 0;
    this.minVal = Infinity;
    this.maxVal = -Infinity;
  }

  get n() {
    return this.totalCount;
  }

  get size() {
    return this.entries.length;
  }

  get min() {
    return this.totalCount === 0 ? null : this.minVal;
  }

  get max() {
    return this.totalCount === 0 ? null : this.maxVal;
  }

  /**
   * Inserts a single numerical value into the GK sketch
   * @param {number} x
   */
  insert(x) {
    const val = Number(x);
    if (!Number.isFinite(val)) return;

    if (val < this.minVal) this.minVal = val;
    if (val > this.maxVal) this.maxVal = val;

    const threshold = Math.floor(2 * this.epsilon * this.totalCount);

    if (this.entries.length === 0) {
      // First element: g=1, delta=0
      this.entries.push({ v: val, g: 1, delta: 0 });
      this.totalCount = 1;
      return;
    }

    // Binary search for insertion index where entries[i].v > val
    let low = 0;
    let high = this.entries.length;
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      if (this.entries[mid].v <= val) {
        low = mid + 1;
      } else {
        high = mid;
      }
    }

    const insertIdx = low;

    if (insertIdx === 0) {
      // Smallest element seen so far
      this.entries.unshift({ v: val, g: 1, delta: 0 });
    } else if (insertIdx === this.entries.length) {
      // Largest element seen so far
      this.entries.push({ v: val, g: 1, delta: 0 });
    } else {
      // Intermediate element: g=1, delta = floor(2 * eps * n)
      this.entries.splice(insertIdx, 0, {
        v: val,
        g: 1,
        delta: Math.max(0, threshold)
      });
    }

    this.totalCount += 1;

    // Periodic compression
    const compressPeriod = Math.max(10, Math.floor(1 / (2 * this.epsilon)));
    if (this.totalCount % compressPeriod === 0) {
      this.compress();
    }
  }

  /**
   * Compresses the summary by merging adjacent tuples that satisfy the invariant:
   * g_i + g_{i+1} + delta_{i+1} <= 2 * eps * n
   */
  compress() {
    if (this.entries.length <= 2) return;

    const maxCapacity = Math.floor(2 * this.epsilon * this.totalCount);

    // Scan backwards from right to left, preserving boundaries (index 0 and index last)
    for (let i = this.entries.length - 2; i >= 1; i--) {
      const curr = this.entries[i];
      const next = this.entries[i + 1];

      if (curr.g + next.g + next.delta <= maxCapacity) {
        next.g += curr.g;
        this.entries.splice(i, 1);
      }
    }
  }

  /**
   * Estimates the value corresponding to target quantile q in [0, 1]
   * @param {number} q Quantile between 0 and 1
   * @returns {number|null}
   */
  query(q) {
    if (this.totalCount === 0 || this.entries.length === 0) return null;

    const clampedQ = Math.max(0, Math.min(1, Number(q)));
    if (clampedQ === 0) return this.minVal;
    if (clampedQ === 1) return this.maxVal;

    const targetRank = Math.ceil(clampedQ * this.totalCount);
    const epsRank = this.epsilon * this.totalCount;

    let cumulativeG = 0;
    let bestVal = this.entries[0].v;
    let minDiff = Infinity;

    for (let i = 0; i < this.entries.length; i++) {
      cumulativeG += this.entries[i].g;
      const rMin = cumulativeG;
      const rMax = cumulativeG + this.entries[i].delta;
      const estRank = (rMin + rMax) / 2;

      const diff = Math.abs(estRank - targetRank);
      if (diff < minDiff) {
        minDiff = diff;
        bestVal = this.entries[i].v;
      }

      // Check Greenwald-Khanna bounds: r* - eps * n <= r <= r* + eps * n
      if (rMax >= targetRank - epsRank && rMin <= targetRank + epsRank) {
        // Suitable candidate found
        if (diff <= epsRank) {
          return this.entries[i].v;
        }
      }
    }

    return bestVal;
  }

  /**
   * Alias for query(q)
   */
  getQuantile(q) {
    return this.query(q);
  }

  /**
   * Estimates normalized rank in [0, 1] for a given query value x
   * @param {number} x
   * @returns {number}
   */
  getRank(x) {
    if (this.totalCount === 0 || this.entries.length === 0) return 0;
    const val = Number(x);

    if (val < this.minVal) return 0;
    if (val >= this.maxVal) return 1;

    let cumulativeG = 0;
    let bestEstimatedRank = 0;

    for (let i = 0; i < this.entries.length; i++) {
      if (this.entries[i].v <= val) {
        cumulativeG += this.entries[i].g;
        bestEstimatedRank = cumulativeG + this.entries[i].delta / 2;
      } else {
        break;
      }
    }

    return Math.max(0, Math.min(1, bestEstimatedRank / this.totalCount));
  }

  /**
   * Returns exact rank bounds [rMin, rMax] for value x
   * @param {number} x
   */
  getRankBounds(x) {
    if (this.totalCount === 0 || this.entries.length === 0) {
      return { rMin: 0, rMax: 0, estimatedRank: 0, normalizedRank: 0 };
    }
    const val = Number(x);
    let cumulativeG = 0;
    let rMin = 0;
    let rMax = 0;

    for (let i = 0; i < this.entries.length; i++) {
      if (this.entries[i].v <= val) {
        cumulativeG += this.entries[i].g;
        rMin = cumulativeG;
        rMax = cumulativeG + this.entries[i].delta;
      } else {
        break;
      }
    }

    const estimatedRank = (rMin + rMax) / 2;
    return {
      rMin,
      rMax,
      estimatedRank,
      normalizedRank: Number((estimatedRank / this.totalCount).toFixed(4)),
      errorMargin: this.epsilon * this.totalCount
    };
  }

  /**
   * Computes multi-percentile summary
   * @param {number[]} [quantiles=[0.25, 0.5, 0.75, 0.9, 0.95, 0.99]]
   */
  getQuantileSummary(quantiles = [0.25, 0.5, 0.75, 0.9, 0.95, 0.99]) {
    const summary = {
      n: this.totalCount,
      size: this.entries.length,
      epsilon: this.epsilon,
      min: this.minVal === Infinity ? 0 : this.minVal,
      max: this.maxVal === -Infinity ? 0 : this.maxVal,
      quantiles: {}
    };

    for (const q of quantiles) {
      const qKey = `p${Math.round(q * 100)}`;
      summary.quantiles[qKey] = this.query(q);
    }

    return summary;
  }

  /**
   * Deterministically merges another GK sketch into this one
   * @param {GKQuantileMergeableSketch} other
   */
  merge(other) {
    if (!other || other.totalCount === 0) return this;
    if (this.totalCount === 0) {
      this.entries = other.entries.map(e => ({ ...e }));
      this.totalCount = other.totalCount;
      this.minVal = other.minVal;
      this.maxVal = other.maxVal;
      this.epsilon = other.epsilon;
      this.eps = this.epsilon;
      return this;
    }

    // Merge two sorted tuple arrays
    const combined = [];
    let i = 0;
    let j = 0;

    while (i < this.entries.length && j < other.entries.length) {
      if (this.entries[i].v <= other.entries[j].v) {
        combined.push({ ...this.entries[i] });
        i++;
      } else {
        combined.push({ ...other.entries[j] });
        j++;
      }
    }

    while (i < this.entries.length) {
      combined.push({ ...this.entries[i] });
      i++;
    }
    while (j < other.entries.length) {
      combined.push({ ...other.entries[j] });
      j++;
    }

    this.entries = combined;
    this.totalCount += other.totalCount;
    this.minVal = Math.min(this.minVal, other.minVal);
    this.maxVal = Math.max(this.maxVal, other.maxVal);
    this.epsilon = Math.max(this.epsilon, other.epsilon);
    this.eps = this.epsilon;

    this.compress();
    return this;
  }
}
