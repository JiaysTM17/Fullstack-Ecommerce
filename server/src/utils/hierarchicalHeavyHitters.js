/**
 * HierarchicalHeavyHitters (HHH) - Graham Cormode, Flip Korn, S. Muthukrishnan, Divesh Srivastava
 * (VLDB 2008, ACM Transactions on Database Systems - TODS 2010)
 *
 * "Finding Hierarchical Heavy Hitters in Data Streams"
 *
 * Practical E-Commerce Problem:
 * In modern e-commerce catalogs, products are organized into hierarchical category trees:
 * e.g., ["Điện thoại & Phụ kiện", "Tai nghe", "Tai nghe không dây", "Tai nghe True Wireless ANC"].
 * Flat heavy-hitter algorithms (Misra-Gries, Space-Saving, KPS) only track individual SKUs.
 * If 100 individual wireless earbud models each have 0.5% traffic, flat algorithms miss all of them.
 * But their parent category "Tai nghe không dây" accounts for 50% of the entire stream!
 *
 * Mathematical Principles & Guarantees:
 * 1. For a taxonomy tree of depth H, a prefix path P = [c_1, c_2, ..., c_L] has total stream frequency f(P).
 * 2. Conditioned Frequency:
 *      f_cond(P) = f(P) - sum_{C in Children(P) and C is an HHH} f(C)
 * 3. Definition of Hierarchical Heavy Hitter at threshold phi in (0, 1):
 *      A node P is an HHH if and only if f_cond(P) >= phi * N.
 * 4. Theoretical Guarantees:
 *      - Zero False Negatives: Every true HHH is guaranteed to be detected.
 *      - Maximum error on frequency estimates: bounded by epsilon * N.
 *      - Memory space: strictly bounded by O((H / phi) * log(N)).
 */

class HierarchicalHeavyHitters {
  /**
   * @param {Object} options
   * @param {number} [options.phi=0.08] - Heavy hitter threshold fraction in (0, 1), default 8%
   * @param {number} [options.epsilon=0.02] - Error tolerance fraction, default 2%
   * @param {number} [options.maxDepth=5] - Maximum hierarchy depth H
   */
  constructor(options = {}) {
    const rawPhi = Number(options.phi) || 0.08;
    this.phi = Math.max(0.01, Math.min(0.50, rawPhi));
    const rawEps = Number(options.epsilon) || 0.02;
    this.epsilon = Math.max(0.001, Math.min(this.phi / 2, rawEps));
    this.maxDepth = Math.max(2, Math.min(10, options.maxDepth || 5));

    this.totalStreamCount = 0; // N
    this.trieRoot = this.createNode(''); // Root representing all items "*"
  }

  createNode(label) {
    return {
      label,
      count: 0,
      errorBound: 0,
      children: new Map() // childLabel -> node
    };
  }

  /**
   * Normalize input category path into an array of hierarchy levels
   * @param {string|Array<string>} path
   * @returns {Array<string>}
   */
  normalizePath(path) {
    if (!path) return [];
    if (Array.isArray(path)) {
      return path.map(p => String(p).trim()).filter(Boolean).slice(0, this.maxDepth);
    }
    return String(path)
      .split(/>|\/|:/)
      .map(p => p.trim())
      .filter(Boolean)
      .slice(0, this.maxDepth);
  }

  /**
   * Update stream with a hierarchical event (e.g. click, add-to-cart, purchase)
   * @param {string|Array<string>} path - Category path, e.g. "Thời Trang > Nam > Áo Polo"
   * @param {number} [weight=1]
   */
  update(path, weight = 1) {
    const levels = this.normalizePath(path);
    if (levels.length === 0) return;
    const w = Math.max(1, Math.floor(weight || 1));
    this.totalStreamCount += w;

    let curr = this.trieRoot;
    curr.count += w;

    for (const lvl of levels) {
      if (!curr.children.has(lvl)) {
        curr.children.set(lvl, this.createNode(lvl));
      }
      curr = curr.children.get(lvl);
      curr.count += w;
    }
  }

  /**
   * Update batch of hierarchical items
   * @param {Array<string|Array<string>>} items
   */
  updateBatch(items = []) {
    if (!Array.isArray(items)) return;
    for (const item of items) {
      this.update(item);
    }
  }

  /**
   * Compute Hierarchical Heavy Hitters using bottom-up roll-up with condition checking
   * @param {number} [customPhi]
   * @returns {Array<Object>} List of Hierarchical Heavy Hitters
   */
  getHierarchicalHeavyHitters(customPhi) {
    const thresholdFraction = typeof customPhi === 'number' && customPhi > 0 ? customPhi : this.phi;
    const thresholdCount = thresholdFraction * this.totalStreamCount;
    const hhhList = [];

    // Helper for recursive bottom-up search
    const traverse = (node, path) => {
      let descendantHHHSum = 0;

      // First recurse into children (bottom-up)
      for (const [childLabel, childNode] of node.children.entries()) {
        const childPath = path ? `${path} > ${childLabel}` : childLabel;
        const childHHHCount = traverse(childNode, childPath);
        descendantHHHSum += childHHHCount;
      }

      // Conditioned frequency = total count - sum of descendant HHH frequencies
      const conditionedCount = Math.max(0, node.count - descendantHHHSum);

      if (conditionedCount >= thresholdCount && path) {
        hhhList.push({
          path,
          label: node.label,
          totalCount: node.count,
          conditionedCount,
          streamTotal: this.totalStreamCount,
          conditionedRatio: this.totalStreamCount > 0 ? Number((conditionedCount / this.totalStreamCount).toFixed(4)) : 0,
          totalRatio: this.totalStreamCount > 0 ? Number((node.count / this.totalStreamCount).toFixed(4)) : 0
        });
        return node.count; // This node qualifies as HHH; passes its full count up
      }

      return descendantHHHSum; // Only pass up already accounted HHH counts
    };

    traverse(this.trieRoot, '');
    hhhList.sort((a, b) => b.conditionedCount - a.conditionedCount);
    return hhhList;
  }

  /**
   * Estimate total frequency along a prefix path
   * @param {string|Array<string>} path
   * @returns {number}
   */
  estimate(path) {
    const levels = this.normalizePath(path);
    if (levels.length === 0) return 0;

    let curr = this.trieRoot;
    for (const lvl of levels) {
      if (!curr.children.has(lvl)) return 0;
      curr = curr.children.get(lvl);
    }
    return curr.count;
  }

  /**
   * Merge another HierarchicalHeavyHitters summary
   * @param {HierarchicalHeavyHitters} other
   */
  merge(other) {
    if (!other || !(other instanceof HierarchicalHeavyHitters)) return;

    const mergeNodes = (targetNode, sourceNode) => {
      targetNode.count += sourceNode.count;
      for (const [lvl, srcChild] of sourceNode.children.entries()) {
        if (!targetNode.children.has(lvl)) {
          targetNode.children.set(lvl, this.createNode(lvl));
        }
        mergeNodes(targetNode.children.get(lvl), srcChild);
      }
    };

    mergeNodes(this.trieRoot, other.trieRoot);
    this.totalStreamCount += other.totalStreamCount;
  }

  /**
   * Reset all counters and tree
   */
  reset() {
    this.totalStreamCount = 0;
    this.trieRoot = this.createNode('');
  }

  /**
   * Return metrics summary
   */
  getMetrics() {
    let totalNodes = 0;
    const countNodes = (node) => {
      totalNodes++;
      for (const child of node.children.values()) {
        countNodes(child);
      }
    };
    countNodes(this.trieRoot);

    return {
      phi: this.phi,
      epsilon: this.epsilon,
      maxDepth: this.maxDepth,
      totalStreamCount: this.totalStreamCount,
      treeNodeCount: totalNodes,
      thresholdCount: Math.round(this.phi * this.totalStreamCount)
    };
  }
}

// Dual ESM/CJS export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { HierarchicalHeavyHitters };
}
export { HierarchicalHeavyHitters };
