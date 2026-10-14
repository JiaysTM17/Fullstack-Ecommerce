/**
 * Ted Dunning's t-Digest Accurate Streaming Quantile Estimator
 * Dunning & Ertl (2019) "Computing Extremely Accurate Quantiles Using t-Digests"
 *
 * Applications in E-Commerce:
 * 1. Tracking ultra-accurate tail latencies (P50, P90, P95, P99, P99.9) for checkout APIs, payment gateways and SPX deliveries.
 * 2. Compresses millions of data points into a bounded set of centroids (O(delta) memory).
 * 3. Near-zero relative error at extreme tails (q -> 0 and q -> 1) due to arcsin scale function.
 */

class Centroid {
  constructor(mean, weight = 1) {
    this.mean = mean;
    this.weight = weight;
  }
}

class TDigestPercentileEstimator {
  /**
   * @param {Object} options
   * @param {number} [options.compression=100] - Delta parameter controlling accuracy and memory. Centroids count <= 2*delta.
   */
  constructor(options = {}) {
    this.compression = Math.max(20, options.compression || 100);
    this.centroids = []; // Array of Centroid, sorted by mean
    this.buffer = [];    // Temporary unmerged samples
    this.bufferSize = Math.max(200, this.compression * 5);
    this.totalWeight = 0;
    this.min = Infinity;
    this.max = -Infinity;
  }

  /**
   * Scale function k_1(q) = (delta / (2 * pi)) * arcsin(2q - 1)
   * Scale function controls max weight of centroids near tails.
   * @param {number} q - Quantile in [0, 1]
   * @returns {number}
   */
  _scale(q) {
    const clampedQ = Math.max(0, Math.min(1, q));
    return (this.compression / (2 * Math.PI)) * Math.asin(2 * clampedQ - 1);
  }

  /**
   * Add a single value with an optional weight
   * @param {number} value
   * @param {number} [weight=1]
   */
  add(value, weight = 1) {
    if (isNaN(value) || weight <= 0) return;

    this.buffer.push({ mean: value, weight });
    if (value < this.min) this.min = value;
    if (value > this.max) this.max = value;

    if (this.buffer.length >= this.bufferSize) {
      this.compress();
    }
  }

  /**
   * Merge buffer into sorted centroids obeying scale constraint
   */
  compress() {
    if (this.buffer.length === 0 && this.centroids.length <= this.compression) {
      return;
    }

    // Merge existing centroids and buffer into a single sorted stream
    const all = [...this.centroids, ...this.buffer].sort((a, b) => a.mean - b.mean);
    this.buffer = [];

    let totalW = 0;
    for (const c of all) totalW += c.weight;
    this.totalWeight = totalW;

    if (totalW === 0) {
      this.centroids = [];
      return;
    }

    const newCentroids = [];
    let curCentroid = new Centroid(all[0].mean, all[0].weight);
    let cumulativeWeight = 0;

    for (let i = 1; i < all.length; i++) {
      const next = all[i];
      const proposedWeight = curCentroid.weight + next.weight;
      const q0 = cumulativeWeight / totalW;
      const q1 = (cumulativeWeight + proposedWeight) / totalW;

      // Check scale function limit: delta_k <= 1
      const deltaK = this._scale(q1) - this._scale(q0);

      if (deltaK <= 1.0) {
        // Merge into current centroid
        curCentroid.mean = (curCentroid.mean * curCentroid.weight + next.mean * next.weight) / proposedWeight;
        curCentroid.weight = proposedWeight;
      } else {
        // Commit current centroid and start new one
        newCentroids.push(curCentroid);
        cumulativeWeight += curCentroid.weight;
        curCentroid = new Centroid(next.mean, next.weight);
      }
    }

    newCentroids.push(curCentroid);
    this.centroids = newCentroids;
  }

  /**
   * Estimate value at quantile q in [0, 1]
   * @param {number} q - e.g. 0.50 (P50), 0.95 (P95), 0.99 (P99)
   * @returns {number}
   */
  quantile(q) {
    if (this.buffer.length > 0) {
      this.compress();
    }

    if (this.centroids.length === 0) return 0;
    if (this.centroids.length === 1) return this.centroids[0].mean;

    const clampedQ = Math.max(0, Math.min(1, q));
    const targetWeight = clampedQ * this.totalWeight;

    if (targetWeight <= 0) return this.min;
    if (targetWeight >= this.totalWeight) return this.max;

    let cumWeight = 0;
    for (let i = 0; i < this.centroids.length; i++) {
      const cur = this.centroids[i];
      const nextWeight = cumWeight + cur.weight;

      if (targetWeight <= nextWeight) {
        // Interpolate between centroids or min/max
        const leftBound = i === 0 ? this.min : (this.centroids[i - 1].mean + cur.mean) / 2;
        const rightBound = i === this.centroids.length - 1 ? this.max : (cur.mean + this.centroids[i + 1].mean) / 2;
        const fraction = cur.weight > 0 ? (targetWeight - cumWeight) / cur.weight : 0;
        return leftBound + fraction * (rightBound - leftBound);
      }
      cumWeight = nextWeight;
    }

    return this.max;
  }

  /**
   * Estimate Cumulative Distribution Function (CDF) at value x: P(X <= x)
   * @param {number} x
   * @returns {number} quantile in [0, 1]
   */
  cdf(x) {
    if (this.buffer.length > 0) {
      this.compress();
    }

    if (this.centroids.length === 0) return 0;
    if (x <= this.min) return 0;
    if (x >= this.max) return 1;

    let cumWeight = 0;
    for (let i = 0; i < this.centroids.length; i++) {
      const cur = this.centroids[i];
      if (x < cur.mean) {
        const prevMean = i === 0 ? this.min : this.centroids[i - 1].mean;
        const fraction = cur.mean !== prevMean ? (x - prevMean) / (cur.mean - prevMean) : 0;
        const weightSoFar = cumWeight + fraction * (cur.weight / 2);
        return Math.max(0, Math.min(1, weightSoFar / this.totalWeight));
      }
      cumWeight += cur.weight;
    }

    return 1;
  }

  /**
   * Get comprehensive latency report (P50, P90, P95, P99, P99.9)
   * @returns {Object}
   */
  getLatencySummary() {
    return {
      count: this.totalWeight + this.buffer.length,
      min: Math.round(this.min * 100) / 100,
      p50: Math.round(this.quantile(0.50) * 100) / 100,
      p90: Math.round(this.quantile(0.90) * 100) / 100,
      p95: Math.round(this.quantile(0.95) * 100) / 100,
      p99: Math.round(this.quantile(0.99) * 100) / 100,
      p999: Math.round(this.quantile(0.999) * 100) / 100,
      max: Math.round(this.max * 100) / 100,
      centroidsCount: this.centroids.length,
    };
  }
}

export { TDigestPercentileEstimator };
export default TDigestPercentileEstimator;
