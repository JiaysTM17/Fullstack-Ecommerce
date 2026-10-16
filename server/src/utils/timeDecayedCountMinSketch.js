/**
 * Time-Decayed Count-Min Sketch (TimeDecayedCountMinSketch)
 * 
 * Theoretical Foundations:
 * - Graham Cormode, Vladislav Shkapenyuk, Divesh Srivastava, Bojian Xu (VLDB 2008 / IEEE TKDE)
 *   "Forward Decay: A Practical Approach to Time-Decaying Streams"
 * - X. Chen, Y. Zhang (IEEE TKDE 2006)
 *   "Tracking Frequent Items over Time-Decaying Streaming Data"
 * - Graham Cormode, S. Muthukrishnan (ACM TODS 2005)
 *   "An Improved Data Stream Summary: The Count-Min Sketch and Its Applications"
 * 
 * Mathematical Formulation:
 * 1. Exponential Time Decay Model:
 *    Let an event e_i arrive at timestamp t_i with initial weight v_i.
 *    At a query reference time t >= t_i, the effective decayed weight is:
 *      w(e_i, t) = v_i \cdot e^{-\lambda (t - t_i)}
 *    where \lambda > 0 is the decay parameter, related to the half-life T_{1/2}:
 *      \lambda = \frac{\ln 2}{T_{1/2}}
 * 
 * 2. Lazy Forward Decay Propagation:
 *    Instead of updating all w \cdot d buckets on every tick (which would be O(w \cdot d)),
 *    each counter bucket C[j, k] stores its last update timestamp \tau[j, k].
 *    When a new event arrives at time t:
 *      \Delta t = t - \tau[j, k]
 *      C[j, k] \leftarrow C[j, k] \cdot e^{-\lambda \Delta t} + v
 *      \tau[j, k] \leftarrow t
 *    This maintains exact exponential decay while achieving O(d) = O(1) update time!
 * 
 * 3. Total Decayed Stream Weight:
 *    The global stream weight W(t) decays similarly:
 *      W(t) \leftarrow W(t_{\text{prev}}) \cdot e^{-\lambda (t - t_{\text{prev}})} + v
 * 
 * 4. Point Query Frequency Estimation:
 *    At query time t_{\text{now}}:
 *      \hat{f}(x, t_{\text{now}}) = \min_{j=0}^{d-1} \left( C[j, h_j(x)] \cdot e^{-\lambda (t_{\text{now}} - \tau[j, h_j(x)])} \right)
 * 
 * 5. Dynamic Heavy Hitters Tracking:
 *    An item is a \phi-Heavy Hitter at time t if \hat{f}(x, t) >= \phi \cdot W(t).
 *    A candidate set is pruned dynamically when items fall below threshold.
 */

export class TimeDecayedCountMinSketch {
  /**
   * @param {Object} [options]
   * @param {number} [options.depth=5] Number of hash rows (d)
   * @param {number} [options.width=256] Number of hash buckets per row (w)
   * @param {number} [options.decayLambda=0.001] Decay rate lambda (sec^-1)
   * @param {number} [options.halfLifeSec] Half-life in seconds (overrides decayLambda if provided)
   * @param {number} [options.phi=0.02] Heavy hitter threshold fraction
   * @param {number} [options.seed=10007] Hash seed for deterministic mergeability
   */
  constructor(options = {}) {
    this.depth = Math.max(3, Math.floor(Number(options.depth || options.d || 5)));
    this.width = Math.max(16, Math.floor(Number(options.width || options.w || 256)));

    if (options.halfLifeSec && options.halfLifeSec > 0) {
      this.decayLambda = Math.LN2 / Number(options.halfLifeSec);
    } else {
      this.decayLambda = Math.max(1e-8, Number(options.decayLambda || 0.001));
    }

    this.phi = Math.max(0.001, Math.min(0.5, Number(options.phi || 0.02)));

    // Counter matrix and timestamp matrix
    this.table = Array.from({ length: this.depth }, () => new Float64Array(this.width));
    this.timestamps = Array.from({ length: this.depth }, () => new Float64Array(this.width));

    this.totalWeight = 0;
    this.lastStreamTimestamp = 0;
    this.itemsInserted = 0;

    // Deterministic 2-universal hash functions
    this.prime = 2147483647;
    const baseSeed = options.seed !== undefined ? Number(options.seed) : 10007;
    this.hashParams = [];
    for (let j = 0; j < this.depth; j++) {
      const a = 1 + (((baseSeed * (j + 1) * 31) ^ (j * 16777619)) >>> 1);
      const b = ((baseSeed + 997) * (j + 1) * 17) >>> 1;
      this.hashParams.push({
        a: (a % (this.prime - 2)) + 1,
        b: b % this.prime
      });
    }

    this.candidates = new Map(); // key -> last recorded timestamp
  }

  _hashKey(key) {
    const str = String(key);
    let hash = 2166136261;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  _getRowBucket(row, rawHash) {
    const { a, b } = this.hashParams[row];
    const val = (Number(BigInt(a) * BigInt(rawHash) + BigInt(b)) % this.prime + this.prime) % this.prime;
    return val % this.width;
  }

  /**
   * Adds an item with timestamp (in seconds or ms)
   * @param {string|number} key Item identifier
   * @param {number} [weight=1] Event weight
   * @param {number} [timestamp] Timestamp in seconds (defaults to Date.now() / 1000)
   */
  update(key, weight = 1, timestamp = null) {
    const t = timestamp !== null ? Number(timestamp) : Date.now() / 1000;
    const w = Math.max(0, Number(weight) || 1);
    const rawHash = this._hashKey(key);

    // Update global stream weight with decay
    if (this.lastStreamTimestamp > 0 && t > this.lastStreamTimestamp) {
      const deltaT = t - this.lastStreamTimestamp;
      this.totalWeight = this.totalWeight * Math.exp(-this.decayLambda * deltaT) + w;
    } else {
      this.totalWeight += w;
    }
    this.lastStreamTimestamp = Math.max(this.lastStreamTimestamp, t);
    this.itemsInserted++;

    // Update each row with lazy decay
    for (let j = 0; j < this.depth; j++) {
      const bucket = this._getRowBucket(j, rawHash);
      const lastT = this.timestamps[j][bucket];

      if (lastT > 0 && t > lastT) {
        const delta = t - lastT;
        this.table[j][bucket] = this.table[j][bucket] * Math.exp(-this.decayLambda * delta) + w;
      } else {
        this.table[j][bucket] += w;
      }
      this.timestamps[j][bucket] = t;
    }

    this.candidates.set(key, t);

    // Periodically prune candidate set if too large
    if (this.candidates.size > 200) {
      this._pruneCandidates(t);
    }

    return this;
  }

  /**
   * Estimates decayed frequency of an item at a specific reference time
   * @param {string|number} key
   * @param {number} [queryTimestamp]
   */
  estimate(key, queryTimestamp = null) {
    const tNow = queryTimestamp !== null ? Number(queryTimestamp) : (this.lastStreamTimestamp || Date.now() / 1000);
    const rawHash = this._hashKey(key);
    let minVal = Infinity;

    for (let j = 0; j < this.depth; j++) {
      const bucket = this._getRowBucket(j, rawHash);
      const lastT = this.timestamps[j][bucket];
      let val = this.table[j][bucket];

      if (lastT > 0 && tNow > lastT) {
        val *= Math.exp(-this.decayLambda * (tNow - lastT));
      }

      if (val < minVal) {
        minVal = val;
      }
    }

    return Number(Math.max(0, minVal).toFixed(4));
  }

  /**
   * Returns current effective total decayed weight
   * @param {number} [queryTimestamp]
   */
  getTotalDecayedWeight(queryTimestamp = null) {
    const tNow = queryTimestamp !== null ? Number(queryTimestamp) : (this.lastStreamTimestamp || Date.now() / 1000);
    if (this.lastStreamTimestamp > 0 && tNow > this.lastStreamTimestamp) {
      return Number((this.totalWeight * Math.exp(-this.decayLambda * (tNow - this.lastStreamTimestamp))).toFixed(4));
    }
    return Number(this.totalWeight.toFixed(4));
  }

  _pruneCandidates(referenceTime) {
    const threshold = this.phi * this.getTotalDecayedWeight(referenceTime);
    for (const [key] of this.candidates) {
      const est = this.estimate(key, referenceTime);
      if (est < threshold * 0.5) {
        this.candidates.delete(key);
      }
    }
  }

  /**
   * Retrieves active trending Heavy Hitters exceeding phi fraction of stream
   * @param {number} [queryTimestamp]
   * @param {number} [customPhi]
   */
  getHeavyHitters(queryTimestamp = null, customPhi = null) {
    const tNow = queryTimestamp !== null ? Number(queryTimestamp) : (this.lastStreamTimestamp || Date.now() / 1000);
    const activeWeight = this.getTotalDecayedWeight(tNow);
    const phi = customPhi !== null ? customPhi : this.phi;
    const threshold = phi * activeWeight;

    const list = [];
    for (const [key] of this.candidates) {
      const est = this.estimate(key, tNow);
      if (est >= threshold && est > 0) {
        list.push({
          key,
          estimatedDecayedFrequency: est,
          fractionOfStream: Number((est / Math.max(1e-6, activeWeight)).toFixed(4)),
          halfLifeSec: Number((Math.LN2 / this.decayLambda).toFixed(1))
        });
      }
    }

    list.sort((a, b) => b.estimatedDecayedFrequency - a.estimatedDecayedFrequency);
    return list;
  }

  /**
   * Merges another TimeDecayedCountMinSketch with identical dimensions and decay rate
   * @param {TimeDecayedCountMinSketch} other
   * @param {number} [referenceTime]
   */
  merge(other, referenceTime = null) {
    if (!other || other.depth !== this.depth || other.width !== this.width) {
      throw new Error("Cannot merge TimeDecayedCountMinSketches with mismatched dimensions");
    }

    const tNow = referenceTime !== null ? Number(referenceTime) : Math.max(this.lastStreamTimestamp, other.lastStreamTimestamp);

    for (let j = 0; j < this.depth; j++) {
      for (let k = 0; k < this.width; k++) {
        const val1 = this.timestamps[j][k] > 0 && tNow > this.timestamps[j][k]
          ? this.table[j][k] * Math.exp(-this.decayLambda * (tNow - this.timestamps[j][k]))
          : this.table[j][k];

        const val2 = other.timestamps[j][k] > 0 && tNow > other.timestamps[j][k]
          ? other.table[j][k] * Math.exp(-other.decayLambda * (tNow - other.timestamps[j][k]))
          : other.table[j][k];

        this.table[j][k] = val1 + val2;
        this.timestamps[j][k] = tNow;
      }
    }

    const w1 = this.getTotalDecayedWeight(tNow);
    const w2 = other.getTotalDecayedWeight(tNow);
    this.totalWeight = w1 + w2;
    this.lastStreamTimestamp = tNow;
    this.itemsInserted += other.itemsInserted;

    for (const [k] of other.candidates) {
      this.candidates.set(k, tNow);
    }

    return this;
  }

  getStats() {
    return {
      depth: this.depth,
      width: this.width,
      decayLambda: this.decayLambda,
      halfLifeSec: Number((Math.LN2 / this.decayLambda).toFixed(2)),
      totalWeight: Number(this.totalWeight.toFixed(4)),
      itemsInserted: this.itemsInserted,
      candidateCount: this.candidates.size,
      phi: this.phi
    };
  }

  clear() {
    for (let j = 0; j < this.depth; j++) {
      this.table[j].fill(0);
      this.timestamps[j].fill(0);
    }
    this.totalWeight = 0;
    this.lastStreamTimestamp = 0;
    this.itemsInserted = 0;
    this.candidates.clear();
  }
}
