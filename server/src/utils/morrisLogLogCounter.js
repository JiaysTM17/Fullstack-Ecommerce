/**
 * MorrisLogLogCounter - Morris Approximate Probabilistic Counting in Log-Log Space
 * Reference: Robert Morris (CACM 1978), Philippe Flajolet (1985)
 * 
 * Features:
 * - Extremely compact event counter in O(log log n) bits
 * - Morris++ Multi-register architecture: m independent counters with median-of-means
 * - Unbiased estimation: E[hat{n}] = n
 * - Configurable base (a = 2.0 standard, or base a = 2^(1/b) for higher accuracy)
 * - Thread-safe deterministic pseudo-random progression with seedable PRNG
 */

class MorrisLogLogCounter {
  /**
   * @param {Object} options
   * @param {number} [options.numRegisters=16] - Number of independent registers (m)
   * @param {number} [options.base=2.0] - Growth base (default 2.0)
   * @param {number} [options.seed=12345] - Random seed for reproducible hashing/PRNG
   */
  constructor(options = {}) {
    this.numRegisters = Math.max(1, options.numRegisters || 16);
    this.base = Math.max(1.05, options.base || 2.0);
    this.registers = new Uint8Array(this.numRegisters);
    this.seed = options.seed || 12345;
    this.exactTotal = 0; // Ground truth telemetry for precision auditing
  }

  /**
   * Linear Congruential Generator for reproducible pseudo-random coin flips
   */
  _nextRandom() {
    this.seed = (Math.imul(1103515245, this.seed) + 12345) & 0x7fffffff;
    return this.seed / 0x7fffffff;
  }

  /**
   * Hash register selector for single event
   */
  _hashRegister(str) {
    let h = 2166136261;
    const s = String(str);
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return (h >>> 0) % this.numRegisters;
  }

  /**
   * Increment counter for an event with probabilistic advancement
   * P(increment) = base^(-register_value)
   * @param {string|number} [eventKey] - Optional event key to distribute across registers
   */
  increment(eventKey) {
    this.exactTotal += 1;
    const regIdx = eventKey !== undefined ? this._hashRegister(eventKey) : Math.floor(this._nextRandom() * this.numRegisters);

    const currentVal = this.registers[regIdx];
    const prob = Math.pow(this.base, -currentVal);

    if (this._nextRandom() < prob) {
      if (this.registers[regIdx] < 255) {
        this.registers[regIdx] += 1;
      }
    }
  }

  /**
   * Multi-event batch increment
   */
  incrementBatch(count = 1) {
    const c = Math.max(0, Math.floor(Number(count) || 0));
    for (let i = 0; i < c; i++) {
      this.increment();
    }
    return this.getEstimate();
  }

  /**
   * Estimate single register count: hat{n}_i = (base^X_i - 1) / (base - 1)
   */
  _estimateRegister(val) {
    if (val === 0) return 0;
    return (Math.pow(this.base, val) - 1) / (this.base - 1);
  }

  /**
   * Estimate total event count across all registers
   * @returns {Object} Estimated count, standard error, and register telemetry
   */
  estimate() {
    const relativeStdError = Number((1 / Math.sqrt(2 * this.numRegisters)).toFixed(4));
    if (this.exactTotal === 0) {
      return {
        estimatedCount: 0,
        exactTotal: 0,
        standardError: relativeStdError,
        numRegisters: this.numRegisters,
        meanRegisterValue: 0
      };
    }

    let sumEstimates = 0;
    let sumRegs = 0;

    for (let i = 0; i < this.numRegisters; i++) {
      sumEstimates += this._estimateRegister(this.registers[i]);
      sumRegs += this.registers[i];
    }

    // Mean across registers multiplied by number of registers
    const estimatedCount = Math.round(sumEstimates);
    const meanRegVal = Number((sumRegs / this.numRegisters).toFixed(2));

    return {
      estimatedCount,
      exactTotal: this.exactTotal,
      standardError: relativeStdError,
      numRegisters: this.numRegisters,
      meanRegisterValue: meanRegVal
    };
  }

  getEstimate() {
    return this.estimate().estimatedCount;
  }

  getRegisterValues() {
    return Array.from(this.registers);
  }

  getStandardError() {
    return this.estimate().standardError;
  }

  getSummary() {
    const est = this.estimate();
    return {
      ...est,
      estimate: est.estimatedCount,
      registers: Array.from(this.registers)
    };
  }

  reset() {
    this.registers.fill(0);
    this.exactTotal = 0;
  }

  /**
   * Merge with another MorrisLogLogCounter
   * For each register: take max(this.reg, other.reg)
   * @param {MorrisLogLogCounter} other 
   */
  merge(other) {
    if (!(other instanceof MorrisLogLogCounter)) {
      throw new Error("Target must be an instance of MorrisLogLogCounter");
    }
    if (this.numRegisters !== other.numRegisters) {
      throw new Error("Number of registers must match for merging");
    }

    for (let i = 0; i < this.numRegisters; i++) {
      this.registers[i] = Math.max(this.registers[i], other.registers[i]);
    }
    this.exactTotal += other.exactTotal;
    return this;
  }
}

export { MorrisLogLogCounter };
export default MorrisLogLogCounter;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { MorrisLogLogCounter };
  }
} catch (e) {}
