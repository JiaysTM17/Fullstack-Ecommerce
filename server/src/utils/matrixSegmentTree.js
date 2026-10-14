/**
 * 2D Matrix Segment Tree (Quad / Nested Segment Tree)
 * Range Sum & Range Max Queries with Point / Sub-matrix Updates
 *
 * Applications in E-Commerce:
 * 1. Multi-Warehouse x SKU Category Matrix:
 *    Rows = Fulfillment Hubs (HN, DN, HCM, Can Tho, Hai Phong, ...)
 *    Cols = Product Categories (Electronics, Fashion, FMCG, Home, Beauty, ...)
 * 2. Instant O(log R * log C) range sum:
 *    "Total stock of Electronics & FMCG across Southern Regional Hubs".
 * 3. Instant O(log R * log C) range max:
 *    "Max safe buffer capacity across Flash Sale hours x Geographic Zones".
 *
 * Time Complexity:
 * - Update: O(log R * log C)
 * - Range Query: O(log R * log C)
 * Space Complexity: O(R * C)
 */

class MatrixSegmentTree {
  /**
   * @param {number} rows - Number of rows (e.g. warehouses)
   * @param {number} cols - Number of columns (e.g. categories)
   * @param {Array<Array<number>>} [initialData] - Optional initial matrix
   */
  constructor(rows = 8, cols = 8, initialData = null) {
    this.R = Math.max(1, rows);
    this.C = Math.max(1, cols);

    // 2D Segment tree storage: 4*R by 4*C
    this.treeSum = Array.from({ length: 4 * this.R }, () => new Float64Array(4 * this.C));
    this.treeMax = Array.from({ length: 4 * this.R }, () => new Float64Array(4 * this.C).fill(-Infinity));

    // Underlying matrix for verification / direct access
    this.matrix = Array.from({ length: this.R }, () => new Float64Array(this.C));

    if (initialData && Array.isArray(initialData)) {
      this.build(initialData);
    }
  }

  /**
   * Build trees from 2D data
   * @param {Array<Array<number>>} data
   */
  build(data) {
    for (let r = 0; r < Math.min(this.R, data.length); r++) {
      for (let c = 0; c < Math.min(this.C, data[r].length); c++) {
        this.set(r, c, Number(data[r][c]) || 0);
      }
    }
  }

  /**
   * Internal recursive column update
   */
  _updateCol(vx, lx, rx, vy, ly, ry, x, y, val) {
    if (ly === ry) {
      if (lx === rx) {
        this.treeSum[vx][vy] = val;
        this.treeMax[vx][vy] = val;
      } else {
        this.treeSum[vx][vy] = this.treeSum[vx * 2][vy] + this.treeSum[vx * 2 + 1][vy];
        this.treeMax[vx][vy] = Math.max(this.treeMax[vx * 2][vy], this.treeMax[vx * 2 + 1][vy]);
      }
      return;
    }

    const my = (ly + ry) >> 1;
    if (y <= my) {
      this._updateCol(vx, lx, rx, vy * 2, ly, my, x, y, val);
    } else {
      this._updateCol(vx, lx, rx, vy * 2 + 1, my + 1, ry, x, y, val);
    }

    this.treeSum[vx][vy] = this.treeSum[vx][vy * 2] + this.treeSum[vx][vy * 2 + 1];
    this.treeMax[vx][vy] = Math.max(this.treeMax[vx][vy * 2], this.treeMax[vx][vy * 2 + 1]);
  }

  /**
   * Internal recursive row update
   */
  _updateRow(vx, lx, rx, x, y, val) {
    if (lx !== rx) {
      const mx = (lx + rx) >> 1;
      if (x <= mx) {
        this._updateRow(vx * 2, lx, mx, x, y, val);
      } else {
        this._updateRow(vx * 2 + 1, mx + 1, rx, x, y, val);
      }
    }
    this._updateCol(vx, lx, rx, 1, 0, this.C - 1, x, y, val);
  }

  /**
   * Set value at (r, c)
   * @param {number} r - Row index [0, R - 1]
   * @param {number} c - Column index [0, C - 1]
   * @param {number} value
   */
  set(r, c, value) {
    if (r < 0 || r >= this.R || c < 0 || c >= this.C) return;
    const v = Number(value) || 0;
    this.matrix[r][c] = v;
    this._updateRow(1, 0, this.R - 1, r, c, v);
  }

  /**
   * Add delta to (r, c)
   * @param {number} r
   * @param {number} c
   * @param {number} delta
   */
  add(r, c, delta) {
    if (r < 0 || r >= this.R || c < 0 || c >= this.C) return;
    const current = this.matrix[r][c];
    this.set(r, c, current + (Number(delta) || 0));
  }

  /**
   * Internal query sum along column tree
   */
  _querySumY(vx, vy, tly, try_, ly, ry) {
    if (ly > ry) return 0;
    if (ly === tly && ry === try_) return this.treeSum[vx][vy];
    const tmy = (tly + try_) >> 1;
    return (
      this._querySumY(vx, vy * 2, tly, tmy, ly, Math.min(ry, tmy)) +
      this._querySumY(vx, vy * 2 + 1, tmy + 1, try_, Math.max(ly, tmy + 1), ry)
    );
  }

  /**
   * Internal query sum along row tree
   */
  _querySumX(vx, tlx, trx, lx, rx, ly, ry) {
    if (lx > rx) return 0;
    if (lx === tlx && rx === trx) {
      return this._querySumY(vx, 1, 0, this.C - 1, ly, ry);
    }
    const tmx = (tlx + trx) >> 1;
    return (
      this._querySumX(vx * 2, tlx, tmx, lx, Math.min(rx, tmx), ly, ry) +
      this._querySumX(vx * 2 + 1, tmx + 1, trx, Math.max(lx, tmx + 1), rx, ly, ry)
    );
  }

  /**
   * Query sum in bounding rectangle [r1..r2] x [c1..c2]
   * @param {number} r1
   * @param {number} c1
   * @param {number} r2
   * @param {number} c2
   * @returns {number}
   */
  querySum(r1, c1, r2, c2) {
    const minR = Math.max(0, Math.min(r1, r2));
    const maxR = Math.min(this.R - 1, Math.max(r1, r2));
    const minC = Math.max(0, Math.min(c1, c2));
    const maxC = Math.min(this.C - 1, Math.max(c1, c2));

    if (minR > maxR || minC > maxC) return 0;
    return this._querySumX(1, 0, this.R - 1, minR, maxR, minC, maxC);
  }

  /**
   * Internal query max along column tree
   */
  _queryMaxY(vx, vy, tly, try_, ly, ry) {
    if (ly > ry) return -Infinity;
    if (ly === tly && ry === try_) return this.treeMax[vx][vy];
    const tmy = (tly + try_) >> 1;
    return Math.max(
      this._queryMaxY(vx, vy * 2, tly, tmy, ly, Math.min(ry, tmy)),
      this._queryMaxY(vx, vy * 2 + 1, tmy + 1, try_, Math.max(ly, tmy + 1), ry)
    );
  }

  /**
   * Internal query max along row tree
   */
  _queryMaxX(vx, tlx, trx, lx, rx, ly, ry) {
    if (lx > rx) return -Infinity;
    if (lx === tlx && rx === trx) {
      return this._queryMaxY(vx, 1, 0, this.C - 1, ly, ry);
    }
    const tmx = (tlx + trx) >> 1;
    return Math.max(
      this._queryMaxX(vx * 2, tlx, tmx, lx, Math.min(rx, tmx), ly, ry),
      this._queryMaxX(vx * 2 + 1, tmx + 1, trx, Math.max(lx, tmx + 1), rx, ly, ry)
    );
  }

  /**
   * Query maximum value in bounding rectangle [r1..r2] x [c1..c2]
   * @param {number} r1
   * @param {number} c1
   * @param {number} r2
   * @param {number} c2
   * @returns {number}
   */
  queryMax(r1, c1, r2, c2) {
    const minR = Math.max(0, Math.min(r1, r2));
    const maxR = Math.min(this.R - 1, Math.max(r1, r2));
    const minC = Math.max(0, Math.min(c1, c2));
    const maxC = Math.min(this.C - 1, Math.max(c1, c2));

    if (minR > maxR || minC > maxC) return -Infinity;
    const res = this._queryMaxX(1, 0, this.R - 1, minR, maxR, minC, maxC);
    return res === -Infinity ? 0 : res;
  }

  /**
   * Get direct element
   */
  get(r, c) {
    if (r < 0 || r >= this.R || c < 0 || c >= this.C) return 0;
    return this.matrix[r][c];
  }

  /**
   * Get matrix snapshot
   */
  getMatrix() {
    return this.matrix.map(row => Array.from(row));
  }

  /**
   * Get metrics
   */
  getStats() {
    return {
      rows: this.R,
      cols: this.C,
      totalCells: this.R * this.C,
      grandTotal: this.querySum(0, 0, this.R - 1, this.C - 1),
      peakValue: this.queryMax(0, 0, this.R - 1, this.C - 1),
    };
  }
}

export { MatrixSegmentTree };
export default MatrixSegmentTree;
