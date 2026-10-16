/**
 * Q-Digest (Quantile Digest) for Streaming Distributed E-Commerce Telemetry
 * 
 * Based on foundational research:
 * - Nisheeth Shrivastava, Chiranjeeb Buragohain, Divyakant Agrawal, Subhash Suri (ACM PODS 2004):
 *   "Medians and Beyond: New Aggregation Techniques for Sensor Networks"
 * 
 * Mathematical Foundations:
 * - Given a stream of integer values from a bounded universe U = [0, sigma - 1] where sigma = 2^b,
 *   Q-Digest maintains an error-bounded hierarchical tree of intervals.
 * - For error parameter epsilon in (0, 0.5] and compression factor k >= 2:
 *   Threshold theta = floor((epsilon * N) / k), where N is total count of items.
 * - Invariant 1 (Capacity bound): For each node v, count(v) <= theta (except possibly the root).
 * - Invariant 2 (Sibling/Parent density): For any non-root node v with count(v) > 0:
 *   count(v) + count(parent(v)) + count(sibling(v)) > theta.
 * - Invariant 3: Leaves have interval size 1.
 * - Quantile Query Guarantee:
 *   For any rank q in [0, 1], qDigest.quantile(q) returns a value whose true rank is
 *   within [q*N - epsilon*N, q*N + epsilon*N].
 * - Distributed Mergeability:
 *   Two Q-Digests Q1 and Q2 can be losslessly combined by summing node counts and running compress(),
 *   maintaining epsilon-accuracy across distributed edge nodes.
 */

export class QDigestQuantiles {
  /**
   * @param {Object} options
   * @param {number} [options.universeSize=1024] Upper bound of values [0, universeSize - 1] (power of 2)
   * @param {number} [options.epsilon=0.05] Approximation error guarantee (0 < epsilon <= 0.5)
   * @param {number} [options.compressionFactor=2] Branching compression factor k (default 2 for binary tree)
   */
  constructor(options = {}) {
    let rawSize = Math.max(16, Math.floor(options.universeSize || 1024));
    // Round up to nearest power of 2
    let power = 1;
    while (power < rawSize) {
      power <<= 1;
    }
    this.universeSize = power;
    this.epsilon = Math.max(0.001, Math.min(0.5, Number(options.epsilon || 0.05)));
    this.compressionFactor = Math.max(1, Math.floor(options.compressionFactor || 2));

    // Internal storage: map of nodeKey -> { left, right, count }
    // Node key format: `${left}:${right}`
    this.nodes = new Map();
    this.totalElements = 0;
    this.compressionsCount = 0;
    this.uncompressedCount = 0;
    this.compressThreshold = 50; // Periodic compression every 50 inserts
  }

  /**
   * Generates unique key for interval [left, right]
   * @param {number} left 
   * @param {number} right 
   * @returns {string}
   */
  _nodeKey(left, right) {
    return `${left}:${right}`;
  }

  /**
   * Computes parent interval for [left, right]
   * @param {number} left 
   * @param {number} right 
   * @returns {{ left: number, right: number } | null}
   */
  _getParent(left, right) {
    if (left === 0 && right === this.universeSize - 1) return null; // Root has no parent
    const length = right - left + 1;
    const parentLength = length * 2;
    const parentLeft = Math.floor(left / parentLength) * parentLength;
    const parentRight = parentLeft + parentLength - 1;
    return { left: parentLeft, right: parentRight };
  }

  /**
   * Computes sibling interval for [left, right]
   * @param {number} left 
   * @param {number} right 
   * @returns {{ left: number, right: number } | null}
   */
  _getSibling(left, right) {
    if (left === 0 && right === this.universeSize - 1) return null; // Root has no sibling
    const length = right - left + 1;
    const isLeftChild = (left % (length * 2)) === 0;
    if (isLeftChild) {
      return { left: left + length, right: right + length };
    } else {
      return { left: left - length, right: right - length };
    }
  }

  /**
   * Current compression threshold theta = floor((epsilon * N) / k)
   * @returns {number}
   */
  getTheta() {
    return Math.max(1, Math.floor((this.epsilon * this.totalElements) / this.compressionFactor));
  }

  /**
   * Insert an element with given frequency
   * @param {number} value Integer in [0, universeSize - 1]
   * @param {number} [weight=1] Frequency/weight of item
   */
  insert(value, weight = 1) {
    const val = Math.max(0, Math.min(this.universeSize - 1, Math.floor(Number(value) || 0)));
    const count = Math.max(1, Math.floor(Number(weight) || 1));

    const key = this._nodeKey(val, val);
    const existing = this.nodes.get(key);
    if (existing) {
      existing.count += count;
    } else {
      this.nodes.set(key, { left: val, right: val, count });
    }

    this.totalElements += count;
    this.uncompressedCount += count;

    if (this.uncompressedCount >= this.compressThreshold) {
      this.compress();
      this.uncompressedCount = 0;
    }
  }

  /**
   * Insert multiple streaming values
   * @param {Array<number>} values 
   */
  insertBatch(values) {
    if (!Array.isArray(values)) return;
    for (let i = 0; i < values.length; i++) {
      this.insert(values[i], 1);
    }
    this.compress();
  }

  /**
   * Compresses the digest by bottom-up promotion of sibling node counts to parent
   * satisfying Invariant 1 and 2.
   */
  compress() {
    if (this.nodes.size <= 1 || this.totalElements === 0) return;
    const theta = this.getTheta();

    // Group nodes by interval length (from length 1 up to universeSize / 2)
    // We sort intervals ascending by length so bottom nodes are processed first
    const nodeList = Array.from(this.nodes.values()).filter(n => n.count > 0);
    nodeList.sort((a, b) => {
      const lenA = a.right - a.left + 1;
      const lenB = b.right - b.left + 1;
      if (lenA !== lenB) return lenA - lenB;
      return a.left - b.left;
    });

    const visitedKeys = new Set();

    for (let i = 0; i < nodeList.length; i++) {
      const node = nodeList[i];
      const key = this._nodeKey(node.left, node.right);
      if (visitedKeys.has(key)) continue;

      const parentRange = this._getParent(node.left, node.right);
      if (!parentRange) continue; // Root cannot be compressed into higher node

      const siblingRange = this._getSibling(node.left, node.right);
      const siblingKey = siblingRange ? this._nodeKey(siblingRange.left, siblingRange.right) : null;
      const parentKey = this._nodeKey(parentRange.left, parentRange.right);

      const siblingNode = siblingKey ? this.nodes.get(siblingKey) : null;
      const parentNode = this.nodes.get(parentKey);

      const countNode = node.count;
      const countSibling = siblingNode ? siblingNode.count : 0;
      const countParent = parentNode ? parentNode.count : 0;

      // Invariant: if sum of counts <= theta, promote children to parent
      if (countNode + countSibling + countParent <= theta) {
        const totalPromoted = countNode + countSibling;
        if (parentNode) {
          parentNode.count += totalPromoted;
        } else {
          this.nodes.set(parentKey, {
            left: parentRange.left,
            right: parentRange.right,
            count: totalPromoted
          });
        }

        // Delete children from map
        this.nodes.delete(key);
        if (siblingKey) {
          this.nodes.delete(siblingKey);
          visitedKeys.add(siblingKey);
        }
      }
      visitedKeys.add(key);
    }

    this.compressionsCount++;
  }

  /**
   * Estimates quantile q in [0, 1]
   * @param {number} q Quantile rank (0.0 to 1.0)
   * @returns {number} Estimated universe value at quantile q
   */
  quantile(q) {
    if (this.totalElements === 0) return 0;
    const clampedQ = Math.max(0, Math.min(1.0, Number(q)));
    const targetRank = clampedQ * this.totalElements;

    // Collect all intervals and sort by center/upper bound
    const intervals = Array.from(this.nodes.values())
      .filter(n => n.count > 0)
      .sort((a, b) => {
        if (a.right !== b.right) return a.right - b.right;
        return a.left - b.left;
      });

    let cumulative = 0;
    for (const node of intervals) {
      cumulative += node.count;
      if (cumulative >= targetRank) {
        // Return mid-point of the interval
        return Math.floor((node.left + node.right) / 2);
      }
    }

    // Default return last interval
    return intervals.length > 0 ? intervals[intervals.length - 1].right : 0;
  }

  /**
   * Estimates cumulative rank (number of items <= value)
   * @param {number} value 
   * @returns {{ estimatedRank: number, relativeRank: number, theoreticalMaxError: number }}
   */
  rank(value) {
    if (this.totalElements === 0) {
      return { estimatedRank: 0, relativeRank: 0, theoreticalMaxError: 0 };
    }
    const val = Math.max(0, Math.min(this.universeSize - 1, Math.floor(Number(value) || 0)));
    let cumulative = 0;

    for (const node of this.nodes.values()) {
      if (node.count <= 0) continue;
      if (node.right <= val) {
        // Completely below or equal to value
        cumulative += node.count;
      } else if (node.left <= val) {
        // Overlapping interval: proportional interpolation
        const intervalLen = node.right - node.left + 1;
        const covered = val - node.left + 1;
        cumulative += (covered / intervalLen) * node.count;
      }
    }

    const estimatedRank = Math.min(this.totalElements, Math.max(0, Math.round(cumulative)));
    const relativeRank = Number((estimatedRank / this.totalElements).toFixed(4));
    const theoreticalMaxError = Math.round(this.epsilon * this.totalElements);

    return {
      estimatedRank,
      relativeRank,
      theoreticalMaxError
    };
  }

  /**
   * Range query: estimate count of elements within [low, high]
   * @param {number} low 
   * @param {number} high 
   * @returns {number} Estimated count in range
   */
  rangeQuery(low, high) {
    const l = Math.max(0, Math.min(this.universeSize - 1, Math.floor(Number(low) || 0)));
    const h = Math.max(l, Math.min(this.universeSize - 1, Math.floor(Number(high) || 0)));
    if (this.totalElements === 0) return 0;

    let rangeCount = 0;
    for (const node of this.nodes.values()) {
      if (node.count <= 0) continue;
      // Disjoint
      if (node.right < l || node.left > h) continue;

      // Fully enclosed
      if (node.left >= l && node.right <= h) {
        rangeCount += node.count;
      } else {
        // Partial overlap
        const overlapStart = Math.max(node.left, l);
        const overlapEnd = Math.min(node.right, h);
        const overlapLen = overlapEnd - overlapStart + 1;
        const totalLen = node.right - node.left + 1;
        rangeCount += (overlapLen / totalLen) * node.count;
      }
    }

    return Math.min(this.totalElements, Math.max(0, Math.round(rangeCount)));
  }

  /**
   * Merge another Q-Digest into this instance (lossless distributed aggregation)
   * @param {QDigestQuantiles} otherDigest 
   */
  merge(otherDigest) {
    if (!otherDigest || !(otherDigest instanceof QDigestQuantiles)) return;
    if (otherDigest.universeSize !== this.universeSize) {
      throw new Error(`Cannot merge Q-Digests with differing universe sizes (${this.universeSize} vs ${otherDigest.universeSize})`);
    }

    for (const [key, otherNode] of otherDigest.nodes.entries()) {
      if (otherNode.count <= 0) continue;
      const existing = this.nodes.get(key);
      if (existing) {
        existing.count += otherNode.count;
      } else {
        this.nodes.set(key, {
          left: otherNode.left,
          right: otherNode.right,
          count: otherNode.count
        });
      }
    }

    this.totalElements += otherDigest.totalElements;
    this.compress();
  }

  /**
   * Returns telemetry metrics and state of Q-Digest
   * @returns {Object}
   */
  getMetrics() {
    const activeNodes = Array.from(this.nodes.values()).filter(n => n.count > 0);
    const theta = this.getTheta();
    const maxTheoreticalNodes = Math.ceil((3 * this.compressionFactor) / this.epsilon);

    return {
      universeSize: this.universeSize,
      epsilon: this.epsilon,
      compressionFactor: this.compressionFactor,
      totalElements: this.totalElements,
      activeNodesCount: activeNodes.length,
      maxTheoreticalNodes,
      currentTheta: theta,
      compressionsCount: this.compressionsCount,
      compressionRatio: Number((this.totalElements > 0 ? (activeNodes.length / this.totalElements) : 1.0).toFixed(4)),
      median: this.quantile(0.5),
      p90: this.quantile(0.9),
      p95: this.quantile(0.95),
      p99: this.quantile(0.99)
    };
  }
}

export default QDigestQuantiles;
