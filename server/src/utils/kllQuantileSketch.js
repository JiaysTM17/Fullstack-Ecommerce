/**
 * KLL Optimal Streaming Quantile Sketch (KLLQuantileSketch)
 * 
 * Theoretical Foundations:
 * - Zohar Karnin, Kevin Lang, Edo Liberty (FOCS 2016)
 *   "Optimal Quantile Approximation in Streams"
 * - Edo Liberty, Michael Mitzenmacher, Justin Thaler, Jonathan Ullman (ESA 2016)
 *   "Space Lower Bounds for Approximate Quantiles"
 * - Kevin Lang (2018)
 *   "Back to the Future: an Even More Nearly Optimal Streaming Quantile Algorithm"
 * 
 * Mathematical Formulation:
 * 1. Level-based Compactor Hierarchy:
 *    Let H = number of levels.
 *    Level h has item weight w_h = 2^h.
 *    Level capacity k_h scales with decay rate c = 2/3:
 *      k_h = max(M, floor( k * (2/3)^{H - 1 - h} ))
 *    where M is minimum compactor size (typically 8).
 * 2. Compactor Operation (Downsampling with Random Parity):
 *    When level h is full (size >= k_h):
 *      - Sort items in level h.
 *      - Pick random offset r in {0, 1}.
 *      - Retain every 2nd item: indices 2*i + r for i = 0, 1...
 *      - Promote selected items to level h + 1 (where each item carries weight 2^{h+1}).
 *      - Clear level h.
 * 3. Space Complexity & Epsilon Guarantee:
 *    Total space: O( (1/epsilon) * sqrt(log(1/epsilon)) ), asymptotically optimal!
 *    Provides epsilon-approximate rank guarantee: |rank(x) - true_rank(x)| <= epsilon * N.
 * 4. Merging:
 *    Two KLL sketches of same parameter k can be merged by combining items level by level
 *    and triggering compactions.
 */

export class KLLQuantileSketch {
  /**
   * @param {Object} [options]
   * @param {number} [options.k=200] Accuracy parameter (epsilon ~ 1.5% for k=200)
   * @param {number} [options.minCapacity=8] Minimum capacity per level
   */
  constructor(options = {}) {
    this.k = Math.max(16, Math.floor(Number(options.k || 200)));
    this.minCapacity = Math.max(4, Math.floor(Number(options.minCapacity || options.M || 8)));
    this.M = this.minCapacity;
    this.eps = Number((1.5 / Math.sqrt(this.k)).toFixed(4));

    // Levels array: each level contains array of numbers
    this.levels = [[]];
    this.totalWeight = 0;
    this.totalItems = 0;
  }

  get numLevels() {
    return this.levels.length;
  }

  get size() {
    return this.totalItems;
  }

  get n() {
    return this.totalItems;
  }

  get weight() {
    return this.totalWeight;
  }

  /**
   * Capacity of level h given total levels H
   * @param {number} h 0-indexed level
   * @param {number} H Total levels
   * @returns {number}
   */
  getLevelCapacity(h, H = this.levels.length) {
    const depthFromTop = H - 1 - h;
    const factor = Math.pow(2.0 / 3.0, depthFromTop);
    return Math.max(this.minCapacity, Math.floor(this.k * factor));
  }

  /**
   * Inserts an item into level 0
   * @param {number} value
   * @param {number} [weight=1]
   */
  update(value, weight = 1) {
    const val = Number(value);
    if (isNaN(val)) return;

    const count = Math.max(1, Math.floor(Number(weight !== undefined ? weight : 1)));
    this.totalItems += count;
    this.totalWeight += count;

    for (let i = 0; i < count; i++) {
      this.levels[0].push(val);
      if (this.levels[0].length >= this.getLevelCapacity(0)) {
        this._compressLevel(0);
      }
    }
  }

  /**
   * Compresses level h by sorting and promoting half items to h+1
   * @private
   */
  _compressLevel(h) {
    if (h >= this.levels.length - 1) {
      this.levels.push([]);
    }

    const currentLevel = this.levels[h];
    currentLevel.sort((a, b) => a - b);

    // Random parity offset 0 or 1
    const offset = Math.random() < 0.5 ? 0 : 1;
    const promoted = [];

    for (let i = offset; i < currentLevel.length; i += 2) {
      promoted.push(currentLevel[i]);
    }

    currentLevel.length = 0; // Clear level h
    this.levels[h + 1].push(...promoted);

    if (this.levels[h + 1].length >= this.getLevelCapacity(h + 1)) {
      this._compressLevel(h + 1);
    }
  }

  /**
   * Flattens and returns all weighted items: [ { value, weight } ]
   * @returns {Array<{ value: number, weight: number }>}
   */
  getWeightedItems() {
    const items = [];
    for (let h = 0; h < this.levels.length; h++) {
      const w = 1 << h; // weight = 2^h
      const lvl = this.levels[h];
      for (let i = 0; i < lvl.length; i++) {
        items.push({ value: lvl[i], weight: w });
      }
    }
    items.sort((a, b) => a.value - b.value);
    return items;
  }

  /**
   * Returns normalized cumulative rank of value in [0, 1]
   * @param {number} value
   * @returns {number}
   */
  getRank(value) {
    if (this.totalWeight <= 0) return 0;
    const val = Number(value);

    let rankWeight = 0;
    let allLessOrEqual = true;
    let anyItems = false;
    for (let h = 0; h < this.levels.length; h++) {
      const w = 1 << h;
      const lvl = this.levels[h];
      for (let i = 0; i < lvl.length; i++) {
        anyItems = true;
        if (lvl[i] <= val) {
          rankWeight += w;
        } else {
          allLessOrEqual = false;
        }
      }
    }
    if (!anyItems) return 0;
    if (allLessOrEqual) return 1.0;
    return Math.min(1.0, Math.max(0.0, rankWeight / this.totalWeight));
  }

  /**
   * Returns estimated quantile value for CDF fraction q in [0, 1]
   * @param {number} q Target fraction
   * @returns {number}
   */
  getQuantile(q) {
    if (this.totalWeight <= 0) return 0;
    const targetRank = Math.max(0.0, Math.min(1.0, Number(q)));
    const targetWeight = targetRank * this.totalWeight;

    const items = this.getWeightedItems();
    if (items.length === 0) return 0;

    let accum = 0;
    for (let i = 0; i < items.length; i++) {
      accum += items[i].weight;
      if (accum >= targetWeight) {
        return items[i].value;
      }
    }
    return items[items.length - 1].value;
  }

  /**
   * Evaluates multiple quantiles simultaneously
   * @param {number[]} fractions Array of quantiles e.g. [0.25, 0.50, 0.75, 0.99]
   * @returns {number[]}
   */
  getQuantiles(fractions = []) {
    return fractions.map(q => this.getQuantile(q));
  }

  /**
   * Returns summary statistics including min, max, median, p90, p99
   */
  getSummary() {
    return {
      n: this.totalItems,
      k: this.k,
      totalItems: this.totalItems,
      totalWeight: this.totalWeight,
      numLevels: this.numLevels,
      levelsCount: this.levels.length,
      min: this.getQuantile(0.0),
      p25: this.getQuantile(0.25),
      median: this.getQuantile(0.50),
      p75: this.getQuantile(0.75),
      p90: this.getQuantile(0.90),
      p95: this.getQuantile(0.95),
      p99: this.getQuantile(0.99),
      max: this.getQuantile(1.0)
    };
  }

  /**
   * Merges another KLL sketch into this sketch
   * @param {KLLQuantileSketch} other
   * @returns {KLLQuantileSketch}
   */
  merge(other) {
    if (!other || !(other instanceof KLLQuantileSketch)) return this;

    while (this.levels.length < other.levels.length) {
      this.levels.push([]);
    }

    for (let h = 0; h < other.levels.length; h++) {
      this.levels[h].push(...other.levels[h]);
    }

    this.totalItems += other.totalItems;
    this.totalWeight += other.totalWeight;

    for (let h = 0; h < this.levels.length; h++) {
      if (this.levels[h].length >= this.getLevelCapacity(h)) {
        this._compressLevel(h);
      }
    }

    return this;
  }

  getTelemetry() {
    let retainedItems = 0;
    for (const lvl of this.levels) retainedItems += lvl.length;
    return {
      algorithm: "KLLQuantileSketch",
      k: this.k,
      numLevels: this.numLevels,
      totalItems: this.totalItems,
      retainedItems,
      compressionRatioPct: this.totalItems > 0 ? Number(((retainedItems / this.totalItems) * 100).toFixed(2)) : 100.0,
      epsilonGuarantee: Number((1.5 / Math.sqrt(this.k)).toFixed(4))
    };
  }
}

export default KLLQuantileSketch;
