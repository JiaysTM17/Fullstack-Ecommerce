/**
 * GKQuantileSummary - Greenwald-Khanna Deterministic Streaming Quantile Summary
 * Reference: Michael Greenwald & Sanjeev Khanna (SIGMOD 2001),
 * "Space-Efficient Online Computation of Quantile Summaries"
 * 
 * Features:
 * - Deterministic eps-approximate streaming quantile queries
 * - Space complexity O((1/eps) * log(eps * n)) tuples
 * - Invariant: g_i + delta_i <= floor(2 * eps * n)
 * - Zero random seed dependence; 100% reproducible precision
 * - P50, P90, P95, P99 percentile latency and GMV distribution analysis
 */

class GKQuantileSummary {
  /**
   * @param {Object} options
   * @param {number} [options.epsilon=0.05] - Maximum relative quantile error (e.g. 0.05 = +/-5%)
   */
  constructor(options = {}) {
    this.epsilon = Math.max(0.001, Math.min(0.20, options.epsilon || 0.05));
    this.entries = []; // Array of { v: number, g: number, delta: number }
    this.totalElements = 0;
    this.compressFrequency = Math.max(10, Math.floor(1 / (2 * this.epsilon)));
  }

  /**
   * Insert value into the quantile summary
   * @param {number} val 
   */
  insert(val) {
    const v = Number(val);
    if (!Number.isFinite(v)) return;

    this.totalElements += 1;
    const n = this.totalElements;
    const maxDelta = Math.floor(2 * this.epsilon * n);

    if (this.entries.length === 0) {
      this.entries.push({ v, g: 1, delta: 0 });
      return;
    }

    if (v < this.entries[0].v) {
      // Insert at the very beginning
      this.entries.unshift({ v, g: 1, delta: 0 });
    } else if (v >= this.entries[this.entries.length - 1].v) {
      // Insert at the very end
      this.entries.push({ v, g: 1, delta: 0 });
    } else {
      // Find insertion point via binary search
      let low = 0;
      let high = this.entries.length - 1;
      let insertIdx = high;

      while (low <= high) {
        const mid = (low + high) >> 1;
        if (this.entries[mid].v >= v) {
          insertIdx = mid;
          high = mid - 1;
        } else {
          low = mid + 1;
        }
      }

      const delta = maxDelta;
      this.entries.splice(insertIdx, 0, { v, g: 1, delta });
    }

    // Periodic compression
    if (this.totalElements % this.compressFrequency === 0) {
      this.compress();
    }
  }

  /**
   * Compress step: merge tuples that satisfy the invariant g_i + g_{i+1} + delta_{i+1} <= 2 * eps * n
   */
  compress() {
    if (this.entries.length <= 2) return;

    const threshold = Math.floor(2 * this.epsilon * this.totalElements);
    const newEntries = [];
    newEntries.push(this.entries[0]);

    let i = 1;
    while (i < this.entries.length - 1) {
      const current = this.entries[i];
      const next = this.entries[i + 1];

      if (current.g + next.g + next.delta <= threshold) {
        // Merge current into next
        next.g += current.g;
        // next remains in loop to be potentially merged again
        i++;
      } else {
        newEntries.push(current);
        i++;
      }
    }

    newEntries.push(this.entries[this.entries.length - 1]);
    this.entries = newEntries;
  }

  /**
   * Query quantile phi in [0, 1]
   * @param {number} phi - Desired quantile in range [0, 1]
   * @returns {number} Estimated value at quantile
   */
  queryQuantile(phi) {
    if (this.entries.length === 0) return 0;
    const clampedPhi = Math.max(0, Math.min(1.0, Number(phi) || 0));

    if (clampedPhi === 0) return this.entries[0].v;
    if (clampedPhi === 1.0) return this.entries[this.entries.length - 1].v;

    const targetRank = clampedPhi * this.totalElements;

    let cumulativeG = 0;
    let prevRank = 0;
    let prevVal = this.entries[0].v;

    for (let i = 0; i < this.entries.length; i++) {
      cumulativeG += this.entries[i].g;
      const curRank = cumulativeG + (this.entries[i].delta / 2);

      if (curRank >= targetRank) {
        if (i === 0 || curRank === prevRank) {
          return this.entries[i].v;
        }
        const alpha = (targetRank - prevRank) / (curRank - prevRank);
        return Number((prevVal + alpha * (this.entries[i].v - prevVal)).toFixed(2));
      }

      prevRank = curRank;
      prevVal = this.entries[i].v;
    }

    return this.entries[this.entries.length - 1].v;
  }

  /**
   * Shortcut for median (P50)
   */
  queryMedian() {
    return this.queryQuantile(0.50);
  }

  /**
   * Standard e-commerce latency & pricing distribution profile
   */
  getDistributionSummary() {
    return {
      totalElements: this.totalElements,
      activeTuples: this.entries.length,
      epsilon: this.epsilon,
      min: this.entries.length > 0 ? this.entries[0].v : 0,
      p25: this.queryQuantile(0.25),
      p50: this.queryQuantile(0.50),
      p75: this.queryQuantile(0.75),
      p90: this.queryQuantile(0.90),
      p95: this.queryQuantile(0.95),
      p99: this.queryQuantile(0.99),
      max: this.entries.length > 0 ? this.entries[this.entries.length - 1].v : 0
    };
  }

  /**
   * Merge with another GK summary
   * @param {GKQuantileSummary} other 
   */
  merge(other) {
    if (!(other instanceof GKQuantileSummary)) {
      throw new Error("Target must be an instance of GKQuantileSummary");
    }

    // Merge sorted streams
    const merged = [];
    let i = 0;
    let j = 0;

    while (i < this.entries.length && j < other.entries.length) {
      if (this.entries[i].v <= other.entries[j].v) {
        merged.push({ ...this.entries[i++] });
      } else {
        merged.push({ ...other.entries[j++] });
      }
    }

    while (i < this.entries.length) merged.push({ ...this.entries[i++] });
    while (j < other.entries.length) merged.push({ ...other.entries[j++] });

    this.entries = merged;
    this.totalElements += other.totalElements;
    this.epsilon = Math.max(this.epsilon, other.epsilon);
    this.compress();
    return this;
  }
}

export { GKQuantileSummary };
export default GKQuantileSummary;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GKQuantileSummary };
  }
} catch (e) {}
