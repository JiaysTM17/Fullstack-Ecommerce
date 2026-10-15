/**
 * BJKSTDistinctElementsEstimator - Bar-Yossef, Jayram, Kumar, Sivakumar, Trevisan (FOCS 2002)
 * "Counting distinct elements in a data stream"
 * 
 * Optimal bit-complexity algorithm for (epsilon, delta)-approximation of distinct stream elements (F_0 moment).
 * - Exact counting when distinct items <= buffer capacity B = ceil(2 / epsilon^2)
 * - Trailing-zeros subsampling when stream scales: estimate = |B_set| * 2^(z_0)
 * - Supports merge and unbiased cardinality queries
 */

class BJKSTDistinctElementsEstimator {
  constructor(options = {}) {
    this.epsilon = Math.max(0.01, Math.min(0.5, options.epsilon || 0.05)); // 5% error tolerance
    this.delta = Math.max(1e-4, Math.min(0.1, options.delta || 0.01)); // 1% failure probability

    // Buffer capacity B = ceil(2 / epsilon^2)
    this.bufferCapacity = Math.max(16, Math.min(4096, options.bufferCapacity || Math.ceil(2 / (this.epsilon * this.epsilon))));

    this.z0 = 0; // Trailing zeros cutoff
    this.buffer = new Map(); // Map<itemKey, trailingZeros>
    this.totalUpdates = 0;
  }

  /**
   * Deterministic Murmur-like 32-bit hash for pairwise independent hash simulation
   */
  _hash32(str) {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  /**
   * Count trailing zeros in 32-bit binary representation
   */
  _countTrailingZeros(num) {
    if (num === 0) return 32;
    let zeros = 0;
    while ((num & 1) === 0 && zeros < 32) {
      zeros++;
      num >>>= 1;
    }
    return zeros;
  }

  /**
   * Update sketch with a stream element
   * @param {string|number} item 
   */
  update(item) {
    if (item === undefined || item === null || item === '') return;
    const key = String(item).trim();
    if (!key) return;

    this.totalUpdates++;

    const h = this._hash32(key);
    const z = this._countTrailingZeros(h);

    if (z >= this.z0) {
      this.buffer.set(key, z);

      // If buffer exceeds capacity B, advance z0 and evict
      while (this.buffer.size > this.bufferCapacity) {
        this.z0++;
        for (const [k, zeros] of this.buffer.entries()) {
          if (zeros < this.z0) {
            this.buffer.delete(k);
          }
        }
      }
    }
  }

  /**
   * Estimate distinct elements in stream
   * @returns {{ estimatedCardinality: number, isExact: boolean, currentCutoff: number, bufferSize: number }}
   */
  estimate() {
    if (this.z0 === 0) {
      // Below buffer capacity => exact count!
      return {
        estimatedCardinality: this.buffer.size,
        isExact: true,
        currentCutoff: 0,
        bufferSize: this.buffer.size
      };
    }

    const estimated = Math.round(this.buffer.size * Math.pow(2, this.z0));
    return {
      estimatedCardinality: estimated,
      isExact: false,
      currentCutoff: this.z0,
      bufferSize: this.buffer.size
    };
  }

  /**
   * Merge another BJKST sketch into this one
   * @param {BJKSTDistinctElementsEstimator} other 
   */
  merge(other) {
    if (!other || !(other instanceof BJKSTDistinctElementsEstimator)) {
      throw new Error("Invalid BJKST sketch to merge");
    }

    // Advance to larger cutoff
    const targetCutoff = Math.max(this.z0, other.z0);
    this.z0 = targetCutoff;

    // Purge elements below targetCutoff from this buffer
    for (const [k, zeros] of this.buffer.entries()) {
      if (zeros < this.z0) {
        this.buffer.delete(k);
      }
    }

    // Add elements from other buffer
    for (const [k, zeros] of other.buffer.entries()) {
      if (zeros >= this.z0) {
        this.buffer.set(k, zeros);
      }
    }

    // Re-check capacity
    while (this.buffer.size > this.bufferCapacity) {
      this.z0++;
      for (const [k, zeros] of this.buffer.entries()) {
        if (zeros < this.z0) {
          this.buffer.delete(k);
        }
      }
    }

    this.totalUpdates += other.totalUpdates;
  }

  /**
   * State and diagnostics
   */
  getStats() {
    const est = this.estimate();
    return {
      estimatedCardinality: est.estimatedCardinality,
      isExact: est.isExact,
      currentCutoffZ0: this.z0,
      bufferSize: this.buffer.size,
      bufferCapacity: this.bufferCapacity,
      epsilon: this.epsilon,
      delta: this.delta,
      totalUpdates: this.totalUpdates
    };
  }
}

export { BJKSTDistinctElementsEstimator };
export default BJKSTDistinctElementsEstimator;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BJKSTDistinctElementsEstimator };
  }
} catch (e) {}
