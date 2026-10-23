/**
 * BJKST Distinct Count Sketch (Bar-Yossef, Jayram, Kumar, Sivakumar, Trevisan)
 *
 * Provides space-efficient streaming cardinality estimation (|F_0|) for high-concurrency
 * multi-tenant ecommerce visitor sessions, unique carts, and flash-sale participant streams.
 *
 * Mathematical formulation:
 * - Subsampling level z based on leading zeros of hash(x): Z(x) = ctz(hash(x))
 * - Dynamic buffer B storing elements whose level >= z
 * - When |B| exceeds max buffer capacity m = ceil(c / eps^2):
 *     Increment level z <- z + 1
 *     Evict all elements with Z(x) < z
 * - Unbiased cardinality estimate:
 *     F_0 = |B| * 2^z
 *
 * Space complexity: O(1/eps^2 * log(1/delta))
 * Time complexity per item: O(1) amortized
 */

export class BJKSTDistinctCountSketch {
  constructor(options = {}) {
    this.epsilon = Number(options.epsilon) || 0.1; // Error parameter (default 10%)
    this.delta = Number(options.delta) || 0.05;   // Failure probability (default 5%)
    this.seed = Number.isInteger(options.seed) ? options.seed : 0x811c9dc5;

    // Buffer capacity threshold m = ceil(3 / epsilon^2)
    this.maxBufferSize = Math.max(32, Math.ceil(3 / (this.epsilon * this.epsilon)));
    this.level = 0; // Current subsampling level z
    this.buffer = new Map(); // hash -> { item, level }
    this.totalInserts = 0;
  }

  /**
   * 32-bit MurmurHash3-like uniform integer hash
   */
  _hash(value) {
    const str = String(value);
    let h = this.seed;
    for (let i = 0; i < str.length; i++) {
      h = Math.imul(h ^ str.charCodeAt(i), 0x5bd1e995);
      h ^= h >>> 15;
    }
    h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
    return (h ^ (h >>> 15)) >>> 0;
  }

  /**
   * Number of trailing zeros (zeros from LSB)
   * Caps at 31
   */
  _trailingZeros(hashVal) {
    if (hashVal === 0) return 31;
    let zeros = 0;
    let val = hashVal;
    while ((val & 1) === 0 && zeros < 31) {
      zeros++;
      val >>>= 1;
    }
    return zeros;
  }

  /**
   * Insert item into sketch
   */
  update(item) {
    if (item === undefined || item === null) return this;
    const str = typeof item === 'object' ? JSON.stringify(item) : String(item);
    const h = this._hash(str);
    const itemLevel = this._trailingZeros(h);

    this.totalInserts++;

    // Only elements with level >= current z are retained
    if (itemLevel >= this.level) {
      this.buffer.set(h, { item: str, level: itemLevel });

      // If buffer exceeds capacity, increment level and shrink
      if (this.buffer.size > this.maxBufferSize) {
        this._shrink();
      }
    }
    return this;
  }

  /**
   * Shrink buffer by incrementing subsampling level and evicting lower-level items
   */
  _shrink() {
    while (this.buffer.size > this.maxBufferSize) {
      this.level++;
      for (const [hashKey, entry] of this.buffer.entries()) {
        if (entry.level < this.level) {
          this.buffer.delete(hashKey);
        }
      }
    }
  }

  /**
   * Estimate total distinct elements
   */
  estimate() {
    if (this.totalInserts === 0) return 0;
    if (this.level === 0) {
      return this.buffer.size;
    }
    const rawEstimate = this.buffer.size * Math.pow(2, this.level);
    return Math.round(rawEstimate);
  }

  /**
   * Relative theoretical error bound
   */
  getRelativeErrorBound() {
    return this.epsilon;
  }

  /**
   * Current subsampling level
   */
  getCurrentLevel() {
    return this.level;
  }

  /**
   * Number of items currently stored in memory buffer
   */
  getStoredBufferSize() {
    return this.buffer.size;
  }

  /**
   * Merge with another BJKST sketch (same epsilon and seed)
   */
  merge(other) {
    if (!(other instanceof BJKSTDistinctCountSketch)) {
      throw new Error('Can only merge with another BJKSTDistinctCountSketch');
    }
    const maxLevel = Math.max(this.level, other.level);
    this.level = maxLevel;

    // Filter local buffer
    for (const [hashKey, entry] of this.buffer.entries()) {
      if (entry.level < this.level) {
        this.buffer.delete(hashKey);
      }
    }

    // Insert other buffer items
    for (const [hashKey, entry] of other.buffer.entries()) {
      if (entry.level >= this.level) {
        this.buffer.set(hashKey, entry);
      }
    }

    this.totalInserts += other.totalInserts;

    if (this.buffer.size > this.maxBufferSize) {
      this._shrink();
    }
    return this;
  }

  /**
   * Serialize sketch for caching/session store
   */
  toJSON() {
    return {
      epsilon: this.epsilon,
      delta: this.delta,
      seed: this.seed,
      maxBufferSize: this.maxBufferSize,
      level: this.level,
      totalInserts: this.totalInserts,
      bufferEntries: Array.from(this.buffer.entries()).map(([k, v]) => [k, v.item, v.level])
    };
  }

  /**
   * Deserialize sketch
   */
  static fromJSON(json) {
    const sketch = new BJKSTDistinctCountSketch({
      epsilon: json.epsilon,
      delta: json.delta,
      seed: json.seed
    });
    sketch.maxBufferSize = json.maxBufferSize;
    sketch.level = json.level;
    sketch.totalInserts = json.totalInserts;
    sketch.buffer = new Map();
    if (Array.isArray(json.bufferEntries)) {
      for (const [k, item, level] of json.bufferEntries) {
        sketch.buffer.set(k, { item, level });
      }
    }
    return sketch;
  }
}

export default BJKSTDistinctCountSketch;
