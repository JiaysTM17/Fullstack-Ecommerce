/**
 * Frequent Directions Matrix Sketching for Streaming E-Commerce Analytics
 * 
 * Based on foundational research:
 * - Edo Liberty (ACM SIGKDD 2013): "Simple and Deterministic Matrix Sketching"
 * - Mina Ghashami, Edo Liberty, Jeff M. Phillips, David P. Woodruff (SIAM Journal on Computing 2016):
 *   "Frequent Directions: Simple and Deterministic Matrix Sketching"
 * 
 * Mathematical Foundations:
 * - Given an incoming streaming matrix A in R^{n x d} (rows arrive one by one),
 *   Frequent Directions maintains a small sketch matrix B in R^{l x d} with l = 2k rows.
 * - SVD Step: When B becomes full (l rows), compute B = U * Sigma * V^T.
 * - Directional Shrinkage: Let delta = sigma_k^2 (the k-th squared singular value).
 *   Shrink singular values: sigma_i' = sqrt(max(0, sigma_i^2 - delta)).
 * - Reset: B = Sigma' * V^T, which zeros out at least (l - k + 1) rows,
 *   freeing up space for the next streaming batch.
 * - Deterministic Error Bound:
 *   0 <= ||A^T A - B^T B||_2 <= (1 / (l - k)) * ||A - A_k||_F^2 <= (1 / k) * ||A||_F^2
 */

export class FrequentDirectionsSketch {
  /**
   * @param {Object} options
   * @param {number} [options.dimension=8] Feature vector dimension d
   * @param {number} [options.rankK=4] Target rank k for low-rank approximation
   * @param {number} [options.sketchSize=8] Total rows l in sketch matrix (l >= 2k recommended)
   */
  constructor(options = {}) {
    this.dimension = Math.max(2, Math.floor(options.dimension || 8));
    this.rankK = Math.max(1, Math.min(this.dimension, Math.floor(options.rankK || 4)));
    this.sketchSize = Math.max(this.rankK * 2, Math.floor(options.sketchSize || this.rankK * 2));

    // Sketch matrix B in R^{sketchSize x dimension}
    this.sketchRows = [];
    this.totalRowsProcessed = 0;
    this.frobeniusNormSq = 0;
    this.shrinkageOperationsCount = 0;
  }

  /**
   * Add a single streaming vector (row vector a_i in R^d)
   * @param {Array<number>} vector
   */
  addRow(vector) {
    if (!Array.isArray(vector)) return;
    const row = new Float64Array(this.dimension);
    let rowNormSq = 0;
    for (let j = 0; j < this.dimension; j++) {
      const val = Number(vector[j]) || 0;
      row[j] = val;
      rowNormSq += val * val;
    }

    this.sketchRows.push(row);
    this.totalRowsProcessed++;
    this.frobeniusNormSq += rowNormSq;

    if (this.sketchRows.length >= this.sketchSize) {
      this.shrink();
    }
  }

  /**
   * Add a batch of streaming rows
   * @param {Array<Array<number>>} matrix
   */
  addBatch(matrix) {
    if (!Array.isArray(matrix)) return;
    for (const row of matrix) {
      this.addRow(row);
    }
  }

  /**
   * Perform SVD-based directional shrinkage when buffer fills up
   * Approximates B^T B via Jacobi one-sided rotation / Gramian eigendecomposition
   */
  shrink() {
    this.shrinkageOperationsCount++;
    const l = this.sketchRows.length;
    const d = this.dimension;

    // Compute Gram matrix G = B^T * B (d x d)
    const G = new Array(d).fill(0).map(() => new Float64Array(d));
    for (let r = 0; r < l; r++) {
      const row = this.sketchRows[r];
      for (let i = 0; i < d; i++) {
        const ri = row[i];
        if (ri === 0) continue;
        for (let j = 0; j < d; j++) {
          G[i][j] += ri * row[j];
        }
      }
    }

    // Jacobi Eigendecomposition of symmetric positive semi-definite matrix G
    const { eigenvalues, eigenvectors } = this._jacobiEigen(G, d);

    // Sort eigenvalues descending
    const indices = Array.from({ length: d }, (_, i) => i);
    indices.sort((a, b) => eigenvalues[b] - eigenvalues[a]);

    // delta = sigma_k^2 (k-th singular value squared)
    const kIdx = Math.min(this.rankK, d) - 1;
    const delta = Math.max(0, eigenvalues[indices[kIdx]] || 0);

    // Form new shrunk rows: B' = diag(sqrt(max(0, s_i - delta))) * V^T
    const newRows = [];
    for (let idx = 0; idx < d; idx++) {
      const origEigen = eigenvalues[indices[idx]];
      const shrunkEigen = Math.max(0, origEigen - delta);
      if (shrunkEigen > 1e-12) {
        const singularValue = Math.sqrt(shrunkEigen);
        const row = new Float64Array(d);
        for (let j = 0; j < d; j++) {
          row[j] = singularValue * eigenvectors[j][indices[idx]];
        }
        newRows.push(row);
      }
    }

    this.sketchRows = newRows;
  }

  /**
   * Classical Jacobi eigenvalue algorithm for symmetric matrix
   * @private
   */
  _jacobiEigen(A, n, maxIter = 50) {
    // V starts as identity matrix
    const V = new Array(n).fill(0).map((_, i) => {
      const col = new Float64Array(n);
      col[i] = 1.0;
      return col;
    });

    const mat = A.map(row => Float64Array.from(row));

    for (let iter = 0; iter < maxIter; iter++) {
      let maxOff = 0;
      let p = 0;
      let q = 1;

      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const absVal = Math.abs(mat[i][j]);
          if (absVal > maxOff) {
            maxOff = absVal;
            p = i;
            q = j;
          }
        }
      }

      if (maxOff < 1e-10) break;

      const app = mat[p][p];
      const aqq = mat[q][q];
      const apq = mat[p][q];

      const theta = 0.5 * Math.atan2(2 * apq, aqq - app);
      const c = Math.cos(theta);
      const s = Math.sin(theta);

      // Rotate A
      mat[p][p] = c * c * app - 2 * s * c * apq + s * s * aqq;
      mat[q][q] = s * s * app + 2 * s * c * apq + c * c * aqq;
      mat[p][q] = 0;
      mat[q][p] = 0;

      for (let k = 0; k < n; k++) {
        if (k !== p && k !== q) {
          const akp = mat[k][p];
          const akq = mat[k][q];
          mat[k][p] = c * akp - s * akq;
          mat[p][k] = mat[k][p];
          mat[k][q] = s * akp + c * akq;
          mat[q][k] = mat[k][q];
        }
      }

      // Rotate V
      for (let k = 0; k < n; k++) {
        const vkp = V[k][p];
        const vkq = V[k][q];
        V[k][p] = c * vkp - s * vkq;
        V[k][q] = s * vkp + c * vkq;
      }
    }

    const eigenvalues = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      eigenvalues[i] = Math.max(0, mat[i][i]);
    }

    return { eigenvalues, eigenvectors: V };
  }

  /**
   * Return the current sketch matrix B as 2D array
   * @returns {Array<Array<number>>}
   */
  getSketchMatrix() {
    return this.sketchRows.map(row => Array.from(row).map(v => Number(v.toFixed(6))));
  }

  /**
   * Compute covariance matrix approximation B^T * B
   * @returns {Array<Array<number>>}
   */
  getCovarianceApproximation() {
    const d = this.dimension;
    const cov = new Array(d).fill(0).map(() => new Array(d).fill(0));
    for (const row of this.sketchRows) {
      for (let i = 0; i < d; i++) {
        if (row[i] === 0) continue;
        for (let j = 0; j < d; j++) {
          cov[i][j] += row[i] * row[j];
        }
      }
    }
    return cov.map(row => row.map(v => Number(v.toFixed(4))));
  }

  /**
   * Project a query vector x onto the principal subspace defined by the sketch
   * @param {Array<number>} query
   * @returns {{projectionNorm: number, projectedVector: Array<number>}}
   */
  project(query) {
    if (!Array.isArray(query) || query.length === 0) {
      return { projectionNorm: 0, projectedVector: [] };
    }
    const d = this.dimension;
    const x = new Float64Array(d);
    for (let j = 0; j < d; j++) x[j] = Number(query[j]) || 0;

    const projected = new Float64Array(d);
    for (const bRow of this.sketchRows) {
      // Unit normalize row
      let rowNorm = 0;
      for (let j = 0; j < d; j++) rowNorm += bRow[j] * bRow[j];
      if (rowNorm < 1e-10) continue;
      rowNorm = Math.sqrt(rowNorm);

      let dot = 0;
      for (let j = 0; j < d; j++) dot += x[j] * (bRow[j] / rowNorm);

      for (let j = 0; j < d; j++) {
        projected[j] += dot * (bRow[j] / rowNorm);
      }
    }

    let projNormSq = 0;
    for (let j = 0; j < d; j++) projNormSq += projected[j] * projected[j];

    return {
      projectionNorm: Number(Math.sqrt(projNormSq).toFixed(4)),
      projectedVector: Array.from(projected).map(v => Number(v.toFixed(4)))
    };
  }

  /**
   * Summary diagnostics and theoretical error bounds
   * @returns {Object}
   */
  getDiagnostics() {
    let sketchFrobeniusNormSq = 0;
    for (const r of this.sketchRows) {
      for (let j = 0; j < this.dimension; j++) {
        sketchFrobeniusNormSq += r[j] * r[j];
      }
    }

    const theoreticalMaxError = Number((this.frobeniusNormSq / this.rankK).toFixed(4));

    return {
      dimension: this.dimension,
      rankK: this.rankK,
      sketchSize: this.sketchSize,
      currentSketchRows: this.sketchRows.length,
      totalRowsProcessed: this.totalRowsProcessed,
      streamFrobeniusNormSq: Number(this.frobeniusNormSq.toFixed(4)),
      sketchFrobeniusNormSq: Number(sketchFrobeniusNormSq.toFixed(4)),
      shrinkageOperationsCount: this.shrinkageOperationsCount,
      theoreticalMaxError,
      compressionRatio: Number((this.totalRowsProcessed > 0 ? (this.sketchRows.length / this.totalRowsProcessed) : 1.0).toFixed(4))
    };
  }
}

export default FrequentDirectionsSketch;
