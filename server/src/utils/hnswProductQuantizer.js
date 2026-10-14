/**
 * HNSW Product Quantizer (PQ) for Multimodal Visual & Text Vector Search
 * 
 * Compresses high-dimensional embeddings by decomposing vectors into M sub-vectors
 * and uses Asymmetric Distance Computation (ADC) with precomputed lookup tables for O(M) distance queries.
 */

class HNSWProductQuantizer {
  /**
   * @param {Object} options
   * @param {number} options.dim - Total vector dimension (default 8)
   * @param {number} options.numSubspaces - Number of sub-quantizers M (default 2)
   * @param {number} options.numCentroids - Centroids per subspace K (default 4)
   */
  constructor({ dim = 8, numSubspaces = 2, numCentroids = 4 } = {}) {
    this.dim = Math.max(2, dim);
    this.M = Math.max(1, numSubspaces);
    if (this.dim % this.M !== 0) {
      throw new Error(`Vector dimension dim (${this.dim}) must be divisible by numSubspaces M (${this.M})`);
    }
    this.subDim = this.dim / this.M;
    this.K = Math.max(2, numCentroids);

    // Codebook: M arrays, each containing K centroid vectors of dimension subDim
    this.codebook = [];
    this.isTrained = false;

    // Item store: id -> { id, code: Uint8Array(M), meta }
    this.items = new Map();
  }

  _euclideanDistSq(vecA, vecB) {
    let sum = 0;
    for (let i = 0; i < vecA.length; i++) {
      const diff = vecA[i] - vecB[i];
      sum += diff * diff;
    }
    return sum;
  }

  trainCodebook(trainingVectors = []) {
    if (trainingVectors.length < this.K) {
      // Create random or uniform default centroids if dataset is small
      this.codebook = [];
      for (let m = 0; m < this.M; m++) {
        const subCentroids = [];
        for (let k = 0; k < this.K; k++) {
          const c = new Array(this.subDim).fill(0).map((_, idx) => (k + 1) * 0.2 + idx * 0.1);
          subCentroids.push(c);
        }
        this.codebook.push(subCentroids);
      }
      this.isTrained = true;
      return this;
    }

    this.codebook = [];

    // Train K-means for each subspace m independently
    for (let m = 0; m < this.M; m++) {
      const startIdx = m * this.subDim;
      const subVectors = trainingVectors.map((v) => v.slice(startIdx, startIdx + this.subDim));

      // 1. Pick initial centroids
      let centroids = [];
      const step = Math.floor(subVectors.length / this.K);
      for (let k = 0; k < this.K; k++) {
        centroids.push(subVectors[k * step].slice());
      }

      // 2. Run small K-means iterations
      for (let iter = 0; iter < 5; iter++) {
        const clusters = Array.from({ length: this.K }, () => []);
        for (const sv of subVectors) {
          let bestK = 0;
          let minDist = Infinity;
          for (let k = 0; k < this.K; k++) {
            const d = this._euclideanDistSq(sv, centroids[k]);
            if (d < minDist) {
              minDist = d;
              bestK = k;
            }
          }
          clusters[bestK].push(sv);
        }

        // Recompute centroids
        for (let k = 0; k < this.K; k++) {
          if (clusters[k].length === 0) continue;
          const newCentroid = new Array(this.subDim).fill(0);
          for (const vec of clusters[k]) {
            for (let d = 0; d < this.subDim; d++) {
              newCentroid[d] += vec[d];
            }
          }
          for (let d = 0; d < this.subDim; d++) {
            newCentroid[d] /= clusters[k].length;
          }
          centroids[k] = newCentroid;
        }
      }

      this.codebook.push(centroids);
    }

    this.isTrained = true;
    return this;
  }

  encodeVector(vector = []) {
    if (!this.isTrained) {
      this.trainCodebook([vector]);
    }

    const code = new Uint8Array(this.M);

    for (let m = 0; m < this.M; m++) {
      const startIdx = m * this.subDim;
      const subVec = vector.slice(startIdx, startIdx + this.subDim);
      const centroids = this.codebook[m];

      let bestK = 0;
      let minDist = Infinity;
      for (let k = 0; k < centroids.length; k++) {
        const d = this._euclideanDistSq(subVec, centroids[k]);
        if (d < minDist) {
          minDist = d;
          bestK = k;
        }
      }
      code[m] = bestK;
    }

    return code;
  }

  add(id, vector = [], meta = {}) {
    const code = this.encodeVector(vector);
    this.items.set(String(id), {
      id: String(id),
      code,
      meta
    });
    return this;
  }

  search(queryVector = [], topK = 5) {
    if (!this.isTrained || this.items.size === 0) return [];

    // Asymmetric Distance Computation (ADC): Precompute distance table T[M][K]
    const distTable = [];
    for (let m = 0; m < this.M; m++) {
      const startIdx = m * this.subDim;
      const qSub = queryVector.slice(startIdx, startIdx + this.subDim);
      const row = new Float32Array(this.K);
      for (let k = 0; k < this.K; k++) {
        row[k] = this._euclideanDistSq(qSub, this.codebook[m][k]);
      }
      distTable.push(row);
    }

    // Accumulate table lookups in O(M) time per stored item
    const results = [];
    for (const item of this.items.values()) {
      let approxDistSq = 0;
      for (let m = 0; m < this.M; m++) {
        const centroidIdx = item.code[m];
        approxDistSq += distTable[m][centroidIdx];
      }
      results.push({
        id: item.id,
        distance: Math.sqrt(approxDistSq),
        meta: item.meta
      });
    }

    results.sort((a, b) => a.distance - b.distance);
    return results.slice(0, topK);
  }

  getMemorySavings() {
    // Standard float32 vector: dim * 4 bytes
    const uncompressedBytesPerItem = this.dim * 4;
    // PQ compressed code: M bytes
    const compressedBytesPerItem = this.M;
    const compressionRatio = Number((1 - compressedBytesPerItem / uncompressedBytesPerItem).toFixed(4));
    return {
      uncompressedBytesPerItem,
      compressedBytesPerItem,
      compressionRatioPercent: Number((compressionRatio * 100).toFixed(2)),
      totalItems: this.items.size
    };
  }
}

export { HNSWProductQuantizer };
export default HNSWProductQuantizer;
