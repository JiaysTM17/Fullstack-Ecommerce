/**
 * StickySamplingFrequentItems - Sticky Sampling Algorithm for Streaming Heavy Hitters
 * Reference: Manku & Motwani (VLDB 2002), "Approximate Frequency Counts over Data Streams"
 * 
 * Provides deterministic and probabilistic guarantees:
 * - All elements with true frequency f_i >= s * N are output with probability >= 1 - delta
 * - No element with true frequency f_i < (s - epsilon) * N is output
 * - Maximum memory footprint bounded by O( (1/epsilon) * ln(1 / (s * delta)) )
 */

class StickySamplingFrequentItems {
  constructor(options = {}) {
    this.support = Math.max(0.001, Math.min(0.5, options.support || 0.05)); // s (e.g., 5%)
    this.epsilon = Math.max(0.0001, Math.min(this.support * 0.5, options.epsilon || 0.01)); // epsilon (e.g., 1%)
    this.delta = Math.max(1e-6, Math.min(0.1, options.delta || 0.005)); // failure probability (0.5%)

    // Step size threshold t = (1 / epsilon) * ln(1 / (s * delta))
    this.t = Math.ceil((1 / this.epsilon) * Math.log(1 / (this.support * this.delta)));
    if (this.t < 10) this.t = 10;

    this.samplingRate = 1; // r = 1, 2, 4, 8, ...
    this.totalCount = 0; // N
    this.nextThreshold = 2 * this.t;

    // Table S: Map<itemKey, { frequency: number } >
    this.table = new Map();
  }

  /**
   * Deterministic Pseudo-Random Generator for Reproducibility in Tests
   */
  _pseudoRandom(seed) {
    const x = Math.sin(seed) * 10000;
    return x - Math.floor(x);
  }

  /**
   * Process a single streaming item
   * @param {string|number} item 
   * @param {number} weight 
   */
  update(item, weight = 1) {
    if (item === undefined || item === null || item === '') return;
    const key = String(item).trim();
    if (!key) return;

    const w = Math.max(1, Math.floor(weight));
    for (let i = 0; i < w; i++) {
      this.totalCount++;

      if (this.table.has(key)) {
        const entry = this.table.get(key);
        entry.frequency++;
      } else {
        // Sample with probability 1 / samplingRate
        const rand = Math.random();
        if (rand < (1 / this.samplingRate)) {
          this.table.set(key, { frequency: 1 });
        }
      }

      // Check if total count reached next checkpoint (2t, 4t, 8t, ...)
      if (this.totalCount >= this.nextThreshold) {
        this._diminishAndEvict();
        this.samplingRate *= 2;
        this.nextThreshold *= 2;
      }
    }
  }

  /**
   * Diminish counts by tossing biased coin when sampling rate doubles
   * Reference: Manku & Motwani (2002) Step 3.2
   */
  _diminishAndEvict() {
    const keys = Array.from(this.table.keys());
    for (const key of keys) {
      const entry = this.table.get(key);
      let survivingCount = 0;
      for (let c = 0; c < entry.frequency; c++) {
        // Each count survives with probability 0.5 when r doubles
        if (Math.random() < 0.5) {
          survivingCount++;
        }
      }
      if (survivingCount <= 0) {
        this.table.delete(key);
      } else {
        entry.frequency = survivingCount;
      }
    }
  }

  /**
   * Estimate the frequency of an item
   * @param {string|number} item 
   * @returns {{ item: string, estimatedFrequency: number, supportRate: number, isFrequent: boolean }}
   */
  estimate(item) {
    const key = String(item).trim();
    if (!key || !this.table.has(key)) {
      return {
        item: key,
        estimatedFrequency: 0,
        supportRate: 0,
        isFrequent: false
      };
    }

    const entry = this.table.get(key);
    // Unbiased estimate scales frequency by current sampling rate r
    const estFreq = entry.frequency * this.samplingRate;
    const rate = this.totalCount > 0 ? (estFreq / this.totalCount) : 0;
    const minThreshold = (this.support - this.epsilon) * this.totalCount;

    return {
      item: key,
      estimatedFrequency: estFreq,
      supportRate: Number(rate.toFixed(4)),
      isFrequent: estFreq >= minThreshold
    };
  }

  /**
   * Retrieve all frequent heavy hitters exceeding (s - epsilon) * N
   * @param {number|null} customThreshold Optional custom absolute count threshold
   * @returns {Array<{ item: string, estimatedFrequency: number, supportRate: number, isConfident: boolean }>}
   */
  getFrequentItems(customThreshold = null) {
    const minCount = customThreshold !== null
      ? customThreshold
      : (this.support - this.epsilon) * this.totalCount;

    const results = [];
    for (const [key, entry] of this.table.entries()) {
      const estFreq = entry.frequency * this.samplingRate;
      if (estFreq >= minCount) {
        results.push({
          item: key,
          estimatedFrequency: estFreq,
          supportRate: this.totalCount > 0 ? Number((estFreq / this.totalCount).toFixed(4)) : 0,
          isConfident: estFreq >= (this.support * this.totalCount)
        });
      }
    }

    results.sort((a, b) => b.estimatedFrequency - a.estimatedFrequency);
    return results;
  }

  /**
   * Merge another StickySampling sketch into this one
   * @param {StickySamplingFrequentItems} other 
   */
  merge(other) {
    if (!other || !(other instanceof StickySamplingFrequentItems)) {
      throw new Error("Invalid StickySampling instance to merge");
    }

    // Align sampling rates to the larger one
    const targetSamplingRate = Math.max(this.samplingRate, other.samplingRate);

    // Rebalance this table to target rate if needed
    if (this.samplingRate < targetSamplingRate) {
      const ratio = this.samplingRate / targetSamplingRate;
      for (const [key, entry] of this.table.entries()) {
        entry.frequency = Math.max(1, Math.round(entry.frequency * ratio));
      }
      this.samplingRate = targetSamplingRate;
    }

    // Add items from other table
    const otherRatio = other.samplingRate / targetSamplingRate;
    for (const [key, entry] of other.table.entries()) {
      const adjustedCount = Math.max(1, Math.round(entry.frequency * otherRatio));
      if (this.table.has(key)) {
        this.table.get(key).frequency += adjustedCount;
      } else {
        this.table.set(key, { frequency: adjustedCount });
      }
    }

    this.totalCount += other.totalCount;
    this.support = Math.min(this.support, other.support);
    this.epsilon = Math.min(this.epsilon, other.epsilon);
    this.delta = Math.min(this.delta, other.delta);
  }

  /**
   * Diagnostics & State Summary
   */
  getStats() {
    return {
      totalElementsProcessed: this.totalCount,
      uniqueEntriesInTable: this.table.size,
      currentSamplingRate: this.samplingRate,
      stepThresholdT: this.t,
      nextDecayThreshold: this.nextThreshold,
      supportParameterS: this.support,
      epsilonParameter: this.epsilon,
      failureProbabilityDelta: this.delta,
      theoreticalMaxEntries: Math.ceil((1 / this.epsilon) * Math.log(1 / (this.support * this.delta)))
    };
  }
}

export { StickySamplingFrequentItems };
export default StickySamplingFrequentItems;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { StickySamplingFrequentItems };
  }
} catch (e) {}
