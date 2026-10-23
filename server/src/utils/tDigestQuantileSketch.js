/**
 * TDigestQuantileSketch - Enterprise Streaming Quantile Sketch
 * Reference: Ted Dunning (2021) "Computing Extremely Accurate Quantiles Using t-Digests"
 *
 * Provides accurate sub-linear space estimation of extreme percentiles (p90, p99, p99.9, p99.99)
 * for Flash Sale checkout latencies, order totals, and dynamic bidding distributions.
 */

export class TDigestQuantileSketch {
  constructor(options = {}) {
    this.delta = options.delta || 100; // compression factor (default 100)
    this.maxBufferSize = options.maxBufferSize || 500;
    this.centroids = []; // Array of { mean: number, weight: number }
    this.buffer = []; // Unmerged values: { mean: number, weight: number }
    this.totalWeight = 0;
    this.min = Infinity;
    this.max = -Infinity;
  }

  /**
   * Add a data point with an optional weight
   * @param {number} value
   * @param {number} weight
   */
  add(value, weight = 1) {
    if (typeof value !== 'number' || isNaN(value)) return;
    if (weight <= 0) return;

    this.buffer.push({ mean: value, weight });
    this.totalWeight += weight;
    if (value < this.min) this.min = value;
    if (value > this.max) this.max = value;

    if (this.buffer.length >= this.maxBufferSize) {
      this.compress();
    }
  }

  /**
   * Add an array of values
   * @param {number[]} values
   */
  addBatch(values) {
    if (!Array.isArray(values)) return;
    for (const v of values) {
      this.add(v, 1);
    }
  }

  /**
   * Compress buffer into centroids maintaining scale function limits
   */
  compress() {
    if (this.buffer.length === 0 && this.centroids.length <= 1) return;

    // Combine existing centroids and unmerged buffer, then sort by mean
    const all = [...this.centroids, ...this.buffer];
    all.sort((a, b) => a.mean - b.mean);

    this.buffer = [];
    this.centroids = [];

    const totalW = this.totalWeight;
    if (totalW === 0 || all.length === 0) return;

    let currentCentroid = { mean: all[0].mean, weight: all[0].weight };
    let weightSoFar = 0;

    for (let i = 1; i < all.length; i++) {
      const next = all[i];
      const proposedWeight = currentCentroid.weight + next.weight;
      const q = (weightSoFar + currentCentroid.weight / 2) / totalW;

      // Scale limit: k-size bound k(q, delta) = 2 * PI * N * sqrt(q * (1 - q)) / delta
      const qNorm = Math.max(0.0001, Math.min(0.9999, q));
      const maxAllowedWeight = Math.max(1, (2 * Math.PI * totalW * Math.sqrt(qNorm * (1 - qNorm))) / this.delta);

      if (proposedWeight <= maxAllowedWeight) {
        // Merge into current centroid
        const combinedMean =
          (currentCentroid.mean * currentCentroid.weight + next.mean * next.weight) / proposedWeight;
        currentCentroid.mean = combinedMean;
        currentCentroid.weight = proposedWeight;
      } else {
        weightSoFar += currentCentroid.weight;
        this.centroids.push(currentCentroid);
        currentCentroid = { mean: next.mean, weight: next.weight };
      }
    }

    this.centroids.push(currentCentroid);
  }

  /**
   * Estimate the quantile value q in [0, 1] (e.g. 0.5 for median, 0.99 for p99)
   * @param {number} q
   * @returns {number}
   */
  quantile(q) {
    if (this.totalWeight === 0) return 0;
    if (q <= 0) return this.min;
    if (q >= 1) return this.max;

    if (this.buffer.length > 0) {
      this.compress();
    }

    if (this.centroids.length === 0) return 0;
    if (this.centroids.length === 1) return this.centroids[0].mean;

    const targetWeight = q * this.totalWeight;
    let accumulatedWeight = 0;

    // Edge check: below first centroid
    const first = this.centroids[0];
    if (targetWeight <= first.weight / 2) {
      return this.min + (targetWeight / (first.weight / 2)) * (first.mean - this.min);
    }

    for (let i = 0; i < this.centroids.length - 1; i++) {
      const c1 = this.centroids[i];
      const c2 = this.centroids[i + 1];
      const w1Mid = accumulatedWeight + c1.weight / 2;
      const w2Mid = accumulatedWeight + c1.weight + c2.weight / 2;

      if (targetWeight >= w1Mid && targetWeight <= w2Mid) {
        const fraction = (targetWeight - w1Mid) / (w2Mid - w1Mid);
        return c1.mean + fraction * (c2.mean - c1.mean);
      }
      accumulatedWeight += c1.weight;
    }

    // Above last centroid
    const last = this.centroids[this.centroids.length - 1];
    const remainingFraction = Math.min(1, (targetWeight - (this.totalWeight - last.weight / 2)) / (last.weight / 2));
    return last.mean + remainingFraction * (this.max - last.mean);
  }

  /**
   * Cumulative distribution function: estimate fraction of data <= value
   * @param {number} value
   * @returns {number}
   */
  cdf(value) {
    if (this.totalWeight === 0) return 0;
    if (value < this.min) return 0;
    if (value >= this.max) return 1;

    if (this.buffer.length > 0) {
      this.compress();
    }

    if (this.centroids.length === 1) return value >= this.centroids[0].mean ? 1 : 0;

    let accumulatedWeight = 0;
    for (let i = 0; i < this.centroids.length; i++) {
      const c = this.centroids[i];
      if (value < c.mean) {
        if (i === 0) {
          const frac = (value - this.min) / Math.max(1e-9, c.mean - this.min);
          return (frac * (c.weight / 2)) / this.totalWeight;
        } else {
          const prev = this.centroids[i - 1];
          const frac = (value - prev.mean) / Math.max(1e-9, c.mean - prev.mean);
          const segmentWeight = (prev.weight + c.weight) / 2;
          return (accumulatedWeight - prev.weight / 2 + frac * segmentWeight) / this.totalWeight;
        }
      }
      accumulatedWeight += c.weight;
    }

    return 1;
  }

  /**
   * Trimmed mean between lower quantile pLow and upper quantile pHigh
   * @param {number} pLow
   * @param {number} pHigh
   * @returns {number}
   */
  trimmedMean(pLow = 0.05, pHigh = 0.95) {
    if (pLow >= pHigh) return this.quantile(0.5);
    const lowVal = this.quantile(pLow);
    const highVal = this.quantile(pHigh);

    if (this.buffer.length > 0) this.compress();

    let sum = 0;
    let weight = 0;
    for (const c of this.centroids) {
      if (c.mean >= lowVal && c.mean <= highVal) {
        sum += c.mean * c.weight;
        weight += c.weight;
      }
    }
    return weight > 0 ? sum / weight : (lowVal + highVal) / 2;
  }

  /**
   * Summary diagnostics report
   */
  getSummary() {
    this.compress();
    return {
      totalWeight: this.totalWeight,
      centroidCount: this.centroids.length,
      min: this.min === Infinity ? 0 : this.min,
      max: this.max === -Infinity ? 0 : this.max,
      median: this.quantile(0.5),
      p90: this.quantile(0.9),
      p99: this.quantile(0.99),
      p999: this.quantile(0.999),
      trimmedMean: this.trimmedMean(0.05, 0.95)
    };
  }

  toJSON() {
    this.compress();
    return {
      delta: this.delta,
      totalWeight: this.totalWeight,
      min: this.min,
      max: this.max,
      centroids: this.centroids
    };
  }

  static fromJSON(data) {
    const sketch = new TDigestQuantileSketch({ delta: data.delta });
    sketch.totalWeight = data.totalWeight || 0;
    sketch.min = data.min !== undefined ? data.min : Infinity;
    sketch.max = data.max !== undefined ? data.max : -Infinity;
    sketch.centroids = Array.isArray(data.centroids) ? [...data.centroids] : [];
    return sketch;
  }
}

export default TDigestQuantileSketch;
