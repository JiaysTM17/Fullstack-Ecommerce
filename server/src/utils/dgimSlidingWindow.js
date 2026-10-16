/**
 * DGIM Sliding Window Bit Stream Counter
 * 
 * Based on foundational research:
 * - Mayur Datar, Aristides Gionis, Piotr Indyk, Rajeev Motwani (SIAM Journal on Computing 2002 / SODA 2002):
 *   "Maintaining Stream Statistics over Sliding Windows"
 * 
 * Mathematical Foundations:
 * - Given an infinite streaming sequence of bits (e.g. order conversions, add-to-carts, flash sale click events),
 *   DGIM estimates the number of 1-bits in the most recent sliding window of size W.
 * - Exact counting requires W bits of storage.
 * - DGIM achieves an (1 +/- epsilon) approximation using only O((1 / epsilon) * log^2(W)) bits of memory!
 * - Bucketing Invariants:
 *   1. Each bucket represents a timestamped block containing a power-of-two number of 1-bits (1, 2, 4, 8, ...).
 *   2. Bucket sizes are non-decreasing as we move back in time.
 *   3. For every bucket size 2^j (except possibly the largest), there are at least 1 and at most k = ceil(1 / epsilon) buckets.
 *      (Typically k = 2 for epsilon <= 0.5).
 * - Merge Operation:
 *   When adding a 1-bit creates k + 1 buckets of the same size 2^j, the two oldest buckets of size 2^j
 *   are deterministically merged into a single bucket of size 2^{j+1}. Merges propagate up the hierarchy.
 * - Estimation Rule:
 *   count = sum_{b in window} size(b) + floor(size(b_oldest) / 2)
 *   Guaranteed relative error <= epsilon / 2.
 */

export class DGIMSlidingWindow {
  /**
   * @param {Object} options
   * @param {number} [options.windowSize=1000] Sliding window size W in ticks/events
   * @param {number} [options.epsilon=0.5] Error parameter (0 < epsilon <= 1.0, k = ceil(1 / epsilon))
   */
  constructor(options = {}) {
    this.windowSize = Math.max(10, Math.floor(options.windowSize || 1000));
    this.epsilon = Math.max(0.05, Math.min(1.0, Number(options.epsilon || 0.5)));
    this.maxBucketsPerSize = Math.max(2, Math.ceil(1.0 / this.epsilon));

    // Internal storage: array of { timestamp: number, size: number }
    // Sorted descending by timestamp (newest at index 0)
    this.buckets = [];
    this.currentTimestamp = 0;
    this.totalBitsProcessed = 0;
    this.mergesCount = 0;
  }

  /**
   * Add a single bit to the stream
   * @param {number|boolean} bit 1 or 0 (true or false)
   * @param {number} [timestamp] Optional explicit timestamp
   */
  addBit(bit, timestamp) {
    this.totalBitsProcessed++;
    const ts = timestamp !== undefined ? Math.floor(Number(timestamp)) : ++this.currentTimestamp;
    if (ts > this.currentTimestamp) {
      this.currentTimestamp = ts;
    }

    const isOne = Boolean(Number(bit) === 1 || bit === true);

    if (isOne) {
      // 1. Prepend new bucket of size 1
      this.buckets.unshift({ timestamp: ts, size: 1 });

      // 2. Enforce invariant: at most maxBucketsPerSize of any size 2^j
      this._maintainInvariants();
    }

    // 3. Evict expired buckets outside window [ts - windowSize + 1, ts]
    this._evictExpired(ts);
  }

  /**
   * Add multiple bits from an array
   * @param {Array<number|boolean>} bits 
   */
  addBits(bits) {
    if (!Array.isArray(bits)) return;
    for (let i = 0; i < bits.length; i++) {
      this.addBit(bits[i]);
    }
  }

  /**
   * Maintains invariant that at most maxBucketsPerSize buckets of any power of 2 exist.
   * If k + 1 buckets of size 2^j exist, merge the oldest two into size 2^{j+1}.
   * @private
   */
  _maintainInvariants() {
    let currentPower = 1;
    let keepChecking = true;

    while (keepChecking) {
      // Find all buckets of size currentPower
      const matchingIndices = [];
      for (let i = 0; i < this.buckets.length; i++) {
        if (this.buckets[i].size === currentPower) {
          matchingIndices.push(i);
        }
      }

      if (matchingIndices.length > this.maxBucketsPerSize) {
        // We have k + 1 buckets of size currentPower.
        // Merge the two oldest ones (which have the largest indices in matchingIndices)
        const idxOldest = matchingIndices[matchingIndices.length - 1];
        const idxSecondOldest = matchingIndices[matchingIndices.length - 2];

        // The merged bucket gets timestamp of the second oldest (the newer of the two)
        const mergedTimestamp = this.buckets[idxSecondOldest].timestamp;
        const mergedSize = currentPower * 2;

        // Replace idxSecondOldest with merged bucket and remove idxOldest
        this.buckets[idxSecondOldest] = { timestamp: mergedTimestamp, size: mergedSize };
        this.buckets.splice(idxOldest, 1);
        this.mergesCount++;

        // Proceed to check the next power of 2
        currentPower = mergedSize;
      } else {
        // If this size is valid and has at least one bucket, check next power of 2
        if (matchingIndices.length > 0) {
          currentPower *= 2;
        } else {
          // No more buckets of higher size
          keepChecking = false;
        }
      }
    }
  }

  /**
   * Evicts buckets that are completely outside the sliding window
   * @param {number} currentTs 
   * @private
   */
  _evictExpired(currentTs) {
    const cutoff = currentTs - this.windowSize;
    let lastValidIndex = this.buckets.length - 1;
    while (lastValidIndex >= 0 && this.buckets[lastValidIndex].timestamp <= cutoff) {
      lastValidIndex--;
    }
    if (lastValidIndex < this.buckets.length - 1) {
      this.buckets.length = lastValidIndex + 1;
    }
  }

  /**
   * Estimates the number of 1-bits in the last kWindow elements
   * @param {number} [kWindow=this.windowSize] Window query length (<= windowSize)
   * @returns {number} Estimated count of 1-bits
   */
  countOnes(kWindow = this.windowSize) {
    if (this.buckets.length === 0) return 0;
    const queryWindow = Math.max(1, Math.min(this.windowSize, Math.floor(Number(kWindow) || this.windowSize)));
    const cutoff = this.currentTimestamp - queryWindow;

    let count = 0;
    for (let i = 0; i < this.buckets.length; i++) {
      const bucket = this.buckets[i];
      if (bucket.timestamp > cutoff) {
        count += bucket.size;
      } else {
        // First bucket that falls on or outside the cutoff boundary:
        // By DGIM theorem, at least one 1-bit fell inside the window, so we add floor(size / 2)
        count += Math.floor(bucket.size / 2);
        break;
      }
    }

    return count;
  }

  /**
   * Computes the 1-bit density (conversion rate) in the specified window
   * @param {number} [kWindow=this.windowSize]
   * @returns {number} Value between 0.0 and 1.0
   */
  getDensity(kWindow = this.windowSize) {
    const queryWindow = Math.max(1, Math.min(this.windowSize, Math.floor(Number(kWindow) || this.windowSize)));
    const estimatedOnes = this.countOnes(queryWindow);
    return Number((estimatedOnes / queryWindow).toFixed(4));
  }

  /**
   * Returns memory and efficiency telemetry metrics
   * @returns {Object}
   */
  getMetrics() {
    const rawWindowBits = this.windowSize;
    // Each bucket stores a timestamp (approx log W bits) and size (approx log log W bits)
    const estimatedBitsMemory = this.buckets.length * (Math.ceil(Math.log2(this.windowSize + 1)) + 8);
    const compressionRatio = rawWindowBits > 0 ? Number((estimatedBitsMemory / rawWindowBits).toFixed(4)) : 1.0;

    return {
      windowSize: this.windowSize,
      epsilon: this.epsilon,
      maxBucketsPerSize: this.maxBucketsPerSize,
      activeBucketsCount: this.buckets.length,
      currentTimestamp: this.currentTimestamp,
      totalBitsProcessed: this.totalBitsProcessed,
      mergesCount: this.mergesCount,
      estimatedOnesInFullWindow: this.countOnes(),
      density: this.getDensity(),
      rawWindowBits,
      estimatedBitsMemory,
      compressionRatio
    };
  }
}

export default DGIMSlidingWindow;
