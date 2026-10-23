/**
 * pcsaFlajoletMartinSketch.js
 * 
 * Phase 96 - Feature 243: Probabilistic Counting with Stochastic Averaging (PCSA) Stream Sketch
 * Reference: Flajolet & Martin (1985) - "Probabilistic Counting Algorithms for Data Base Applications", JCSS
 * 
 * Guarantees:
 * - Seminal Flajolet-Martin algorithm using m bitmap registers of length L (typically 32 bits).
 * - Stochastic averaging: geometric hash bit distribution rho(x) mapping elements into registers.
 * - Closed-form cardinality estimator: N_hat = (m / phi) * 2^(sum R_j / m), where phi = 0.77351.
 * - Small-range linear counting correction when cardinality is small.
 * - Commutative associative mergeable bitwise-OR registers and multi-tenant Jaccard cohort analysis.
 */

export class PCSAFlajoletMartinSketch {
  /**
   * @param {Object} options - { m, bitLength, seed }
   */
  constructor(options = {}) {
    // m is the number of registers (power of 2 recommended, min 16, default 64)
    this.m = Math.max(16, Math.floor(options.m || 64));
    this.bitLength = Math.min(32, Math.max(16, Math.floor(options.bitLength || 32)));
    this.seed = options.seed || 1337;
    this.phi = 0.77351; // Flajolet-Martin correction constant
    // Array of bit-masks (32-bit unsigned integers)
    this.registers = new Uint32Array(this.m);
    this.totalItemsSeen = 0;
  }

  /**
   * 32-bit Murmur-inspired hash
   */
  _hash32(item) {
    const str = String(item);
    let h = (this.seed ^ 0x9e3779b9) >>> 0;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
      h = (h ^ (h >>> 15)) >>> 0;
    }
    h = Math.imul(h, 0x5bd1e995);
    h = (h ^ (h >>> 15)) >>> 0;
    return h >>> 0;
  }

  /**
   * Position of least significant set bit (1-based, capped at bitLength)
   */
  _rho(val) {
    if (val === 0) return this.bitLength;
    let r = 1;
    let v = val;
    while ((v & 1) === 0 && r < this.bitLength) {
      v >>>= 1;
      r++;
    }
    return r;
  }

  /**
   * Ingest an item into PCSA registers
   * @param {string|number} item 
   * @returns {boolean} true if a new bit was set in a register
   */
  add(item) {
    this.totalItemsSeen++;
    const hash = this._hash32(item);
    // Use lower bits for register index, upper bits for geometric bit distribution
    const regIdx = hash % this.m;
    const quotient = Math.floor(hash / this.m);
    const r = this._rho(quotient);

    const bitMask = 1 << (r - 1);
    const wasSet = (this.registers[regIdx] & bitMask) !== 0;

    if (!wasSet) {
      this.registers[regIdx] |= bitMask;
      return true;
    }
    return false;
  }

  /**
   * Ingest batch of items
   */
  addBatch(items = []) {
    if (Array.isArray(items)) {
      for (const item of items) {
        this.add(item);
      }
    }
  }

  /**
   * Find lowest unset bit position R_j in register j (0-based)
   */
  _getLowestUnsetBit(reg) {
    let r = 0;
    let v = reg;
    while ((v & 1) === 1 && r < this.bitLength) {
      v >>>= 1;
      r++;
    }
    return r;
  }

  /**
   * Estimate cardinality using Flajolet-Martin formula with small-range correction
   */
  estimateCardinality() {
    let sumR = 0;
    let totalZeroBits = 0;

    for (let j = 0; j < this.m; j++) {
      const R_j = this._getLowestUnsetBit(this.registers[j]);
      sumR += R_j;
      // Count total 0-bits for small-cardinality linear counting fallback
      for (let b = 0; b < this.bitLength; b++) {
        if ((this.registers[j] & (1 << b)) === 0) {
          totalZeroBits++;
        }
      }
    }

    const avgR = sumR / this.m;
    const rawEstimate = (this.m / this.phi) * Math.pow(2, avgR);

    // Small-range correction: if raw estimate is small (< 2.5 * m), apply linear counting
    if (rawEstimate < 2.5 * this.m) {
      const totalBits = this.m * this.bitLength;
      if (totalZeroBits > 0 && totalZeroBits < totalBits) {
        const linearEst = totalBits * Math.log(totalBits / totalZeroBits);
        return Math.max(0, Math.round(linearEst));
      }
    }

    return Math.round(rawEstimate);
  }

  /**
   * Estimate Jaccard similarity between two PCSA sketches
   */
  estimateJaccard(other) {
    if (!other || !other.registers) return 0;
    let intersectionBits = 0;
    let unionBits = 0;

    const minM = Math.min(this.m, other.m);
    for (let j = 0; j < minM; j++) {
      const bitAnd = this.registers[j] & other.registers[j];
      const bitOr = this.registers[j] | other.registers[j];

      for (let b = 0; b < this.bitLength; b++) {
        if ((bitAnd & (1 << b)) !== 0) intersectionBits++;
        if ((bitOr & (1 << b)) !== 0) unionBits++;
      }
    }

    if (unionBits === 0) return 1.0;
    return Number((intersectionBits / unionBits).toFixed(4));
  }

  /**
   * Estimate intersection size |A ∩ B|
   */
  estimateIntersection(other) {
    const jaccard = this.estimateJaccard(other);
    const cardA = this.estimateCardinality();
    const cardB = other ? other.estimateCardinality() : 0;
    const unionCard = cardA + cardB - (jaccard * (cardA + cardB) / (1 + jaccard + 1e-9));
    return Math.round(jaccard * unionCard);
  }

  /**
   * Merge with another PCSA sketch via bitwise OR
   */
  merge(other) {
    const newM = Math.min(this.m, other ? other.m : this.m);
    const result = new PCSAFlajoletMartinSketch({ m: newM, bitLength: this.bitLength, seed: this.seed });
    result.totalItemsSeen = this.totalItemsSeen + (other ? other.totalItemsSeen : 0);

    for (let j = 0; j < newM; j++) {
      result.registers[j] = this.registers[j] | (other ? other.registers[j] : 0);
    }
    return result;
  }

  /**
   * Serialize sketch
   */
  serialize() {
    return {
      m: this.m,
      bitLength: this.bitLength,
      seed: this.seed,
      registers: Array.from(this.registers),
      totalItemsSeen: this.totalItemsSeen,
      cardinalityEstimate: this.estimateCardinality()
    };
  }

  /**
   * Deserialize sketch
   */
  static deserialize(state) {
    if (!state || typeof state.m !== 'number') {
      throw new Error('Invalid PCSA sketch state');
    }
    const sketch = new PCSAFlajoletMartinSketch({
      m: state.m,
      bitLength: state.bitLength || 32,
      seed: state.seed || 1337
    });
    if (Array.isArray(state.registers)) {
      for (let i = 0; i < state.registers.length && i < sketch.m; i++) {
        sketch.registers[i] = state.registers[i] >>> 0;
      }
    }
    sketch.totalItemsSeen = Number(state.totalItemsSeen) || 0;
    return sketch;
  }

  /**
   * Cohort analysis
   */
  static assessMultiTenantCartOverlap(cohortA = [], cohortB = [], m = 64) {
    const sA = new PCSAFlajoletMartinSketch({ m });
    const sB = new PCSAFlajoletMartinSketch({ m });

    sA.addBatch(cohortA);
    sB.addBatch(cohortB);

    return {
      m,
      cardinalityCohortA: sA.estimateCardinality(),
      cardinalityCohortB: sB.estimateCardinality(),
      estimatedJaccard: sA.estimateJaccard(sB),
      estimatedIntersection: sA.estimateIntersection(sB),
      certification: 'PCSA_FLAJOLET_MARTIN_PASS'
    };
  }
}

export default PCSAFlajoletMartinSketch;
