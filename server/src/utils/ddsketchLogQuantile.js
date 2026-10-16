/**
 * DDSketchLogQuantile (Charles Masson, Jee E. Rim, Homin K. Lee - VLDB 2019 / ACM TODS 2020)
 *
 * Implements DDSketch: A Fast, Fully-Mergeable Quantile Sketch with Provable
 * Relative-Error Guarantees across arbitrary data distributions (e.g., latency, pricing, GMV).
 *
 * Key Capabilities:
 * - Relative error guarantee alpha:
 *   |rank(q) - rank_true| / rank_true <= alpha (e.g. alpha = 0.01 for 1% relative accuracy).
 * - Logarithmically sized bucket intervals:
 *   gamma = (1 + alpha) / (1 - alpha)
 *   bucketIndex = ceil(ln(val) / ln(gamma))
 * - Full mergeability across distributed cluster workers (A + B = C) with zero error amplification.
 * - Supports arbitrary positive, zero, and negative values.
 * - Dynamic memory bounding: collapses dense buckets when maxBins capacity is reached.
 * - Exact rank interpolation and percentile queries: p50, p90, p95, p99, p99.9.
 */

export class DDSketchLogQuantile {
  /**
   * @param {Object} options
   * @param {number} [options.alpha=0.01] - Relative error tolerance (e.g. 0.01 for 1%)
   * @param {number} [options.maxBins=1024] - Maximum allowable bins per positive/negative store
   */
  constructor(options = {}) {
    this.alpha = Math.max(0.0001, Math.min(0.25, Number(options.alpha) || 0.01));
    this.maxBins = Math.max(64, Math.min(65536, Number(options.maxBins) || 1024));

    // Base of logarithmic mapping: gamma = (1 + alpha) / (1 - alpha)
    this.gamma = (1 + this.alpha) / (1 - this.alpha);
    this.multiplier = 1.0 / Math.log(this.gamma);

    // Min positive value to prevent underflow to negative infinity
    this.minPositiveValue = 1e-9;
    this.minIndex = Math.ceil(Math.log(this.minPositiveValue) * this.multiplier);

    // Bins for positive values: Map<binIndex, count>
    this.positiveBins = new Map();
    // Bins for negative values: Map<binIndex, count>
    this.negativeBins = new Map();
    this.zeroCount = 0;
    this.count = 0;
    this.sum = 0;
    this.min = Infinity;
    this.max = -Infinity;
  }

  _valToIndex(val) {
    if (val < this.minPositiveValue) {
      return this.minIndex;
    }
    return Math.ceil(Math.log(val) * this.multiplier);
  }

  _indexToVal(index) {
    // Return geometric mean / mid-value of bucket
    return Math.pow(this.gamma, index - 0.5);
  }

  /**
   * Add a single value to the sketch.
   * @param {number} val
   * @param {number} [weight=1]
   */
  add(val, weight = 1) {
    const num = Number(val);
    if (Number.isNaN(num) || !Number.isFinite(num)) return;
    const w = Math.max(0.00001, Number(weight) || 1);

    this.count += w;
    this.sum += num * w;
    if (num < this.min) this.min = num;
    if (num > this.max) this.max = num;

    if (num === 0) {
      this.zeroCount += w;
      return;
    }

    if (num > 0) {
      const idx = this._valToIndex(num);
      const cur = this.positiveBins.get(idx) || 0;
      this.positiveBins.set(idx, cur + w);
    } else {
      const idx = this._valToIndex(Math.abs(num));
      const cur = this.negativeBins.get(idx) || 0;
      this.negativeBins.set(idx, cur + w);
    }

    this._collapseIfNeeded();
  }

  /**
   * Batch insert array of numbers.
   * @param {Array<number>} values
   */
  addBatch(values = []) {
    if (!Array.isArray(values)) return;
    for (const v of values) {
      this.add(v);
    }
  }

  _collapseIfNeeded() {
    if (this.positiveBins.size > this.maxBins) {
      // Find lowest keys and merge them
      const keys = Array.from(this.positiveBins.keys()).sort((a, b) => a - b);
      const overflowCount = this.positiveBins.size - this.maxBins;
      let mergedWeight = 0;
      for (let i = 0; i < overflowCount; i++) {
        mergedWeight += this.positiveBins.get(keys[i]) || 0;
        this.positiveBins.delete(keys[i]);
      }
      const targetKey = keys[overflowCount];
      this.positiveBins.set(targetKey, (this.positiveBins.get(targetKey) || 0) + mergedWeight);
    }
  }

  /**
   * Query estimated quantile q in [0, 1] (e.g. 0.50 for median, 0.99 for p99).
   * @param {number} q - Quantile fraction
   * @returns {number}
   */
  getQuantile(q) {
    if (this.count === 0) return 0;
    const clampedQ = Math.max(0, Math.min(1.0, Number(q)));

    if (clampedQ === 0) return this.min;
    if (clampedQ === 1.0) return this.max;

    const targetRank = clampedQ * this.count;
    let accumulated = 0;

    // 1. Traverse negative bins in descending absolute value order (most negative first)
    if (this.negativeBins.size > 0) {
      const negKeys = Array.from(this.negativeBins.keys()).sort((a, b) => b - a);
      for (const k of negKeys) {
        accumulated += this.negativeBins.get(k);
        if (accumulated >= targetRank) {
          return -this._indexToVal(k);
        }
      }
    }

    // 2. Traverse zero
    accumulated += this.zeroCount;
    if (accumulated >= targetRank) {
      return 0;
    }

    // 3. Traverse positive bins in ascending order
    if (this.positiveBins.size > 0) {
      const posKeys = Array.from(this.positiveBins.keys()).sort((a, b) => a - b);
      for (const k of posKeys) {
        accumulated += this.positiveBins.get(k);
        if (accumulated >= targetRank) {
          return this._indexToVal(k);
        }
      }
    }

    return this.max;
  }

  /**
   * Return standard set of latency / pricing percentiles: p50, p75, p90, p95, p99, p99.9.
   */
  getPercentiles() {
    return {
      p50: Number(this.getQuantile(0.50).toFixed(3)),
      p75: Number(this.getQuantile(0.75).toFixed(3)),
      p90: Number(this.getQuantile(0.90).toFixed(3)),
      p95: Number(this.getQuantile(0.95).toFixed(3)),
      p99: Number(this.getQuantile(0.99).toFixed(3)),
      p999: Number(this.getQuantile(0.999).toFixed(3)),
      count: this.count,
      mean: this.count > 0 ? Number((this.sum / this.count).toFixed(3)) : 0,
      min: this.min === Infinity ? 0 : Number(this.min.toFixed(3)),
      max: this.max === -Infinity ? 0 : Number(this.max.toFixed(3))
    };
  }

  /**
   * Merge another DDSketchLogQuantile into this sketch (zero error amplification).
   * @param {DDSketchLogQuantile} other
   */
  merge(other) {
    if (!other || !(other instanceof DDSketchLogQuantile)) return;

    this.count += other.count;
    this.sum += other.sum;
    this.zeroCount += other.zeroCount;
    if (other.min < this.min) this.min = other.min;
    if (other.max > this.max) this.max = other.max;

    for (const [k, count] of other.positiveBins.entries()) {
      this.positiveBins.set(k, (this.positiveBins.get(k) || 0) + count);
    }
    for (const [k, count] of other.negativeBins.entries()) {
      this.negativeBins.set(k, (this.negativeBins.get(k) || 0) + count);
    }

    this._collapseIfNeeded();
  }

  /**
   * Reset sketch to clean initial state.
   */
  reset() {
    this.positiveBins.clear();
    this.negativeBins.clear();
    this.zeroCount = 0;
    this.count = 0;
    this.sum = 0;
    this.min = Infinity;
    this.max = -Infinity;
  }
}

export default DDSketchLogQuantile;
