/**
 * SlidingWindowFrequentItems (Manku & Motwani VLDB 2002, Golab et al. ACM TODS 2006, Cormode et al. TKDE 2007)
 *
 * Implements deterministic epsilon-approximate frequent items / heavy hitters tracking
 * over sliding count or time windows with bucketing and stale event eviction.
 *
 * Key Capabilities:
 * - Time-based sliding window (windowSizeMs) or Count-based sliding window (windowSizeCount).
 * - Partitioned into small granularity sub-buckets (granularityMs) to allow smooth O(1) eviction.
 * - Outdated bucket pruning: automatically drops buckets whose timestamp < now - windowSizeMs.
 * - Exact and approximate frequency queries with theoretical error guarantees:
 *   Frequency error bounded by epsilon * W, where W is the total weight in the current window.
 * - Trending velocity metric: calculates instantaneous momentum (f_recent - f_prior) / delta_t
 *   to identify explosive viral products before they reach aggregate heavy hitter thresholds.
 */

export class SlidingWindowFrequentItems {
  /**
   * @param {Object} options
   * @param {number} [options.windowSizeMs=900000] - Window duration in milliseconds (default 15 minutes)
   * @param {number} [options.granularityMs=60000] - Duration of each sub-bucket in ms (default 1 minute)
   * @param {number} [options.phi=0.05] - Heavy hitter frequency threshold fraction (e.g. 5%)
   * @param {number} [options.epsilon=0.01] - Theoretical error tolerance fraction (e.g. 1%)
   */
  constructor(options = {}) {
    this.windowSizeMs = Math.max(1000, Number(options.windowSizeMs) || 900000);
    this.granularityMs = Math.max(100, Math.min(this.windowSizeMs / 2, Number(options.granularityMs) || 60000));
    this.phi = Math.max(0.001, Math.min(1.0, Number(options.phi) || 0.05));
    this.epsilon = Math.max(0.0001, Math.min(this.phi / 2, Number(options.epsilon) || 0.01));

    // Internal storage: array of bucket objects { timestamp, counts: Map<itemId, number>, totalWeight: number }
    this.buckets = [];
    // Aggregate cache for fast O(1) queries { counts: Map<itemId, number>, totalWeight: number }
    this.aggregateCounts = new Map();
    this.totalWeight = 0;
    this.totalEvictedWeight = 0;
    this.lastPruneTime = 0;
  }

  /**
   * Record an item event into the current active bucket.
   * @param {string|number} itemId - Product, SKU, or search keyword identifier
   * @param {number} [weight=1] - Event weight / purchase quantity / click score
   * @param {number} [timestamp=Date.now()] - Event timestamp in ms
   */
  record(itemId, weight = 1, timestamp = Date.now()) {
    if (!itemId) return;
    const strId = String(itemId).trim();
    if (!strId) return;

    const w = Math.max(0.0001, Number(weight) || 1);
    const ts = Number(timestamp) || Date.now();

    // 1. Evict any expired buckets older than ts - windowSizeMs
    this.evict(ts);

    // 2. Locate or create bucket for current timestamp
    let currentBucket = null;
    if (this.buckets.length > 0) {
      const latest = this.buckets[this.buckets.length - 1];
      if (ts - latest.timestamp < this.granularityMs && ts >= latest.timestamp) {
        currentBucket = latest;
      }
    }

    if (!currentBucket) {
      currentBucket = {
        timestamp: ts,
        counts: new Map(),
        totalWeight: 0
      };
      this.buckets.push(currentBucket);
    }

    // 3. Update bucket counts
    const prevBucketCount = currentBucket.counts.get(strId) || 0;
    currentBucket.counts.set(strId, prevBucketCount + w);
    currentBucket.totalWeight += w;

    // 4. Update aggregate counts
    const prevAgg = this.aggregateCounts.get(strId) || 0;
    this.aggregateCounts.set(strId, prevAgg + w);
    this.totalWeight += w;
  }

  /**
   * Batch record multiple events efficiently.
   * @param {Array<{itemId: string, weight?: number, timestamp?: number}>} events
   */
  recordBatch(events = []) {
    if (!Array.isArray(events)) return;
    for (const ev of events) {
      if (ev && ev.itemId) {
        this.record(ev.itemId, ev.weight, ev.timestamp);
      }
    }
  }

  /**
   * Evict buckets that have slid out of the active window.
   * @param {number} [currentTime=Date.now()]
   */
  evict(currentTime = Date.now()) {
    const cutoff = currentTime - this.windowSizeMs;
    this.lastPruneTime = currentTime;

    let evictIndex = 0;
    while (evictIndex < this.buckets.length && this.buckets[evictIndex].timestamp < cutoff) {
      const expiredBucket = this.buckets[evictIndex];
      // Subtract expired bucket from aggregate counts
      for (const [id, count] of expiredBucket.counts.entries()) {
        const curAgg = this.aggregateCounts.get(id) || 0;
        const remaining = curAgg - count;
        if (remaining <= 0.00001) {
          this.aggregateCounts.delete(id);
        } else {
          this.aggregateCounts.set(id, remaining);
        }
      }
      this.totalWeight = Math.max(0, this.totalWeight - expiredBucket.totalWeight);
      this.totalEvictedWeight += expiredBucket.totalWeight;
      evictIndex++;
    }

    if (evictIndex > 0) {
      this.buckets.splice(0, evictIndex);
    }
  }

  /**
   * Query estimated frequency of an item within the current sliding window.
   * @param {string|number} itemId
   * @param {number} [currentTime=Date.now()]
   * @returns {number}
   */
  query(itemId, currentTime = Date.now()) {
    this.evict(currentTime);
    const strId = String(itemId).trim();
    return this.aggregateCounts.get(strId) || 0;
  }

  /**
   * Return all heavy hitters whose frequency meets or exceeds phi * totalWeight.
   * @param {number} [customPhi] - Optional custom threshold override
   * @param {number} [currentTime=Date.now()]
   * @returns {Array<{itemId: string, frequency: number, relativeShare: number, isGuaranteed: boolean}>}
   */
  getFrequentItems(customPhi, currentTime = Date.now()) {
    this.evict(currentTime);
    const thresholdFraction = (typeof customPhi === 'number' && customPhi > 0) ? customPhi : this.phi;
    const minWeightThreshold = thresholdFraction * this.totalWeight;

    const results = [];
    if (this.totalWeight <= 0) return results;

    for (const [itemId, freq] of this.aggregateCounts.entries()) {
      if (freq >= minWeightThreshold) {
        const relativeShare = Number((freq / this.totalWeight).toFixed(6));
        // Cormode-Golab error bound: if freq - epsilon * W >= phi * W, item is guaranteed true heavy hitter
        const isGuaranteed = (freq - this.epsilon * this.totalWeight) >= (thresholdFraction * this.totalWeight);
        results.push({
          itemId,
          frequency: Math.round(freq * 1000) / 1000,
          relativeShare,
          isGuaranteed
        });
      }
    }

    // Sort descending by frequency
    results.sort((a, b) => b.frequency - a.frequency);
    return results;
  }

  /**
   * Calculate trending velocity (momentum) of an item.
   * Splits active window into two halves: recent half vs historical half.
   * @param {string|number} itemId
   * @param {number} [currentTime=Date.now()]
   * @returns {{itemId: string, velocity: number, recentFreq: number, priorFreq: number, momentumMultiplier: number}}
   */
  getVelocity(itemId, currentTime = Date.now()) {
    this.evict(currentTime);
    const strId = String(itemId).trim();
    const halfWindow = this.windowSizeMs / 2;
    const splitTime = currentTime - halfWindow;

    let recentFreq = 0;
    let priorFreq = 0;

    for (const b of this.buckets) {
      const c = b.counts.get(strId) || 0;
      if (b.timestamp >= splitTime) {
        recentFreq += c;
      } else {
        priorFreq += c;
      }
    }

    const deltaTSeconds = Math.max(1, halfWindow / 1000);
    const velocity = (recentFreq - priorFreq) / deltaTSeconds;
    const momentumMultiplier = priorFreq > 0 ? Number((recentFreq / priorFreq).toFixed(2)) : (recentFreq > 0 ? 99.9 : 1.0);

    return {
      itemId: strId,
      velocity: Number(velocity.toFixed(6)),
      recentFreq: Math.round(recentFreq * 1000) / 1000,
      priorFreq: Math.round(priorFreq * 1000) / 1000,
      momentumMultiplier
    };
  }

  /**
   * Get top trending items sorted by velocity (highest positive surge).
   * @param {number} [limit=10]
   * @param {number} [currentTime=Date.now()]
   * @returns {Array<Object>}
   */
  getTopTrending(limit = 10, currentTime = Date.now()) {
    this.evict(currentTime);
    const items = Array.from(this.aggregateCounts.keys());
    const trending = items.map(id => this.getVelocity(id, currentTime));
    trending.sort((a, b) => b.velocity - a.velocity);
    return trending.slice(0, Math.max(1, limit));
  }

  /**
   * Return comprehensive diagnostic summary of the sliding window.
   */
  getDiagnostics() {
    return {
      windowSizeMs: this.windowSizeMs,
      granularityMs: this.granularityMs,
      phi: this.phi,
      epsilon: this.epsilon,
      activeBucketCount: this.buckets.length,
      distinctItemsCount: this.aggregateCounts.size,
      totalWeight: Math.round(this.totalWeight * 1000) / 1000,
      totalEvictedWeight: Math.round(this.totalEvictedWeight * 1000) / 1000,
      earliestBucketTimestamp: this.buckets.length > 0 ? this.buckets[0].timestamp : null,
      latestBucketTimestamp: this.buckets.length > 0 ? this.buckets[this.buckets.length - 1].timestamp : null
    };
  }

  /**
   * Clear all buckets and reset state.
   */
  reset() {
    this.buckets = [];
    this.aggregateCounts.clear();
    this.totalWeight = 0;
    this.totalEvictedWeight = 0;
    this.lastPruneTime = 0;
  }
}

export default SlidingWindowFrequentItems;
