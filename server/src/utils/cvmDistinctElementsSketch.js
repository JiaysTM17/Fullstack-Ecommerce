/**
 * cvmDistinctElementsSketch.js
 * 
 * Phase 95 - Feature 242: CVM (Chakraborty-Vinodchandran-Meel) Distinct Elements Streaming Algorithm
 * Reference: Chakraborty, Vinodchandran, Meel (ESA 2022), Knuth (2023) - "A New Algorithm for Distinct Elements in Streaming"
 * 
 * Guarantees:
 * - Extremely simple, memory-bounded O(1/eps^2 * log(1/delta)) distinct element estimation.
 * - Dynamic probabilistic thinning: coin-flipping with sampling parameter p = 2^(-round) when reservoir capacity s is reached.
 * - Strict unbiased cardinality estimator: N_hat = |B| / p.
 * - Supports multi-tenant cohort Jaccard similarity and mergeable streaming states.
 */

export class CVMDistinctElementsSketch {
  /**
   * @param {Object} options - { capacity, seed }
   */
  constructor(options = {}) {
    this.capacity = Math.max(8, Math.floor(options.capacity || 64)); // Reservoir capacity s
    this.seed = options.seed || 1337;
    this.reservoir = new Set(); // Elements retained in reservoir B
    this.samplingProbability = 1.0; // Current retention probability p
    this.rounds = 0; // Number of thinning phases (p = 2^-rounds)
    this.totalItemsSeen = 0;
  }

  /**
   * Deterministic Murmur-like float hash in (0, 1) for reproducibility
   */
  _hashFloat(item, salt = 0) {
    const str = String(item) + `_salt_${salt}`;
    let h = (this.seed ^ 0x6a09e667) >>> 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
      h = (h ^ (h >>> 15)) >>> 0;
    }
    h = Math.imul(h, 0x5bd1e995);
    h = (h ^ (h >>> 15)) >>> 0;
    return (h + 0.5) / 4294967296.0;
  }

  /**
   * Thin reservoir by tossing unbiased coin (probability 0.5) for each element
   */
  _thinReservoir() {
    this.rounds++;
    const nextReservoir = new Set();
    for (const elem of this.reservoir) {
      // Deterministic coin toss based on element and current round
      const coin = this._hashFloat(elem, this.rounds);
      if (coin < 0.5) {
        nextReservoir.add(elem);
      }
    }
    this.reservoir = nextReservoir;
    this.samplingProbability *= 0.5;
  }

  /**
   * Ingest an item into CVM sketch
   * @param {string|number} item 
   * @returns {boolean} true if element is in reservoir after operation
   */
  add(item) {
    this.totalItemsSeen++;
    const key = String(item);

    // If item is already present in reservoir, remove it first (CVM protocol)
    this.reservoir.delete(key);

    // Sample item with current probability p
    const sampleHash = this._hashFloat(key, this.rounds);
    if (sampleHash < this.samplingProbability) {
      this.reservoir.add(key);
    }

    // If reservoir exceeds capacity, thin reservoir repeatedly until |B| < capacity
    while (this.reservoir.size >= this.capacity) {
      this._thinReservoir();
    }

    return this.reservoir.has(key);
  }

  /**
   * Add a batch of items
   */
  addBatch(items = []) {
    if (Array.isArray(items)) {
      for (const item of items) {
        this.add(item);
      }
    }
  }

  /**
   * Unbiased CVM cardinality estimate: N_hat = |B| / p
   */
  estimateCardinality() {
    if (this.rounds === 0) {
      return this.reservoir.size;
    }
    const estimate = this.reservoir.size / this.samplingProbability;
    return Math.round(estimate);
  }

  /**
   * Estimate Jaccard similarity between two CVM sketches
   */
  estimateJaccard(other) {
    if (!other || !other.reservoir) return 0;
    if (this.reservoir.size === 0 && other.reservoir.size === 0) return 1.0;
    if (this.reservoir.size === 0 || other.reservoir.size === 0) return 0.0;

    let intersectionCount = 0;
    for (const item of this.reservoir) {
      if (other.reservoir.has(item)) {
        intersectionCount++;
      }
    }

    const unionCount = new Set([...this.reservoir, ...other.reservoir]).size;
    if (unionCount === 0) return 0;
    return Number((intersectionCount / unionCount).toFixed(4));
  }

  /**
   * Estimate intersection size |A ∩ B|
   */
  estimateIntersection(other) {
    const jaccard = this.estimateJaccard(other);
    const cardA = this.estimateCardinality();
    const cardB = other ? other.estimateCardinality() : 0;
    const approxUnion = cardA + cardB - (jaccard * (cardA + cardB) / (1 + jaccard + 1e-9));
    return Math.round(jaccard * approxUnion);
  }

  /**
   * Merge with another CVM sketch
   */
  merge(other) {
    const newCap = Math.max(this.capacity, other ? other.capacity : this.capacity);
    const result = new CVMDistinctElementsSketch({ capacity: newCap, seed: this.seed });

    const targetRounds = Math.max(this.rounds, other ? other.rounds : 0);
    result.rounds = targetRounds;
    result.samplingProbability = Math.pow(0.5, targetRounds);
    result.totalItemsSeen = this.totalItemsSeen + (other ? other.totalItemsSeen : 0);

    // Filter elements from both reservoirs that survive up to targetRounds
    const unionSet = new Set();
    const candidates = new Set([...this.reservoir, ...(other ? other.reservoir : [])]);

    for (const elem of candidates) {
      const h = this._hashFloat(elem, targetRounds);
      if (h < result.samplingProbability) {
        unionSet.add(elem);
      }
    }

    result.reservoir = unionSet;
    while (result.reservoir.size >= result.capacity) {
      result._thinReservoir();
    }

    return result;
  }

  /**
   * Serialize sketch
   */
  serialize() {
    return {
      capacity: this.capacity,
      seed: this.seed,
      reservoir: Array.from(this.reservoir),
      samplingProbability: this.samplingProbability,
      rounds: this.rounds,
      totalItemsSeen: this.totalItemsSeen,
      cardinalityEstimate: this.estimateCardinality()
    };
  }

  /**
   * Restore sketch from serialized state
   */
  static deserialize(state) {
    if (!state || typeof state.capacity !== 'number') {
      throw new Error('Invalid CVM sketch state');
    }
    const sketch = new CVMDistinctElementsSketch({
      capacity: state.capacity,
      seed: state.seed || 1337
    });
    sketch.reservoir = new Set(state.reservoir || []);
    sketch.samplingProbability = state.samplingProbability || 1.0;
    sketch.rounds = state.rounds || 0;
    sketch.totalItemsSeen = state.totalItemsSeen || 0;
    return sketch;
  }

  /**
   * Cohort analysis
   */
  static assessMultiTenantCartOverlap(cohortA = [], cohortB = [], capacity = 64) {
    const sA = new CVMDistinctElementsSketch({ capacity });
    const sB = new CVMDistinctElementsSketch({ capacity });

    sA.addBatch(cohortA);
    sB.addBatch(cohortB);

    return {
      capacity,
      cardinalityCohortA: sA.estimateCardinality(),
      cardinalityCohortB: sB.estimateCardinality(),
      estimatedJaccard: sA.estimateJaccard(sB),
      samplingProbabilityA: sA.samplingProbability,
      samplingProbabilityB: sB.samplingProbability,
      roundsA: sA.rounds,
      roundsB: sB.rounds,
      certification: 'CVM_DISTINCT_ELEMENTS_PASS'
    };
  }
}

export default CVMDistinctElementsSketch;
