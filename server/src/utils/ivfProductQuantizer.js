/**
 * Inverted File with Product Quantization (IVF-PQ) Index (Jegou et al., IEEE TPAMI 2011)
 * Chỉ mục vector xấp xỉ lân cận gần nhất (ANN) kết hợp phân cụm thô (IVF) và lượng tử hóa tích phân đoạn (PQ)
 * Hỗ trợ Asymmetric Distance Computation (ADC) với độ phức tạp tra cứu cực tốc O(n_probe * M)
 */

class IvfProductQuantizer {
  constructor(options = {}) {
    const {
      dimension = 16,
      numCentroids = 4,   // Số cụm thô (coarse clusters / Voronoi cells)
      numSubvectors = 4,  // M: số phân đoạn sub-vector (dimension chia hết cho M)
      subvectorK = 8      // Số tâm cụm con trên mỗi phân đoạn (codebook size)
    } = options;

    if (dimension % numSubvectors !== 0) {
      throw new Error(`Dimension (${dimension}) phải chia hết cho numSubvectors (${numSubvectors})`);
    }

    this.dimension = dimension;
    this.numCentroids = numCentroids;
    this.numSubvectors = numSubvectors;
    this.subvectorDim = dimension / numSubvectors;
    this.subvectorK = subvectorK;

    // 1. Cụm thô Coarse Centroids (numCentroids x dimension)
    this.coarseCentroids = this._initCentroids(numCentroids, dimension);

    // 2. Inverted Lists: Map(centroidId -> Array<{ id, codes, metadata }>)
    this.invertedLists = new Map();
    for (let i = 0; i < numCentroids; i++) {
      this.invertedLists.set(i, []);
    }

    // 3. Codebooks cho từng sub-vector: subvectorCodebooks[m][k] (subvectorDim)
    this.subvectorCodebooks = [];
    for (let m = 0; m < numSubvectors; m++) {
      this.subvectorCodebooks.push(this._initCentroids(subvectorK, this.subvectorDim));
    }

    this.indexedCount = 0;
  }

  _initCentroids(k, dim) {
    const centroids = [];
    for (let i = 0; i < k; i++) {
      const v = [];
      for (let d = 0; d < dim; d++) {
        v.push((Math.random() - 0.5) * 0.5);
      }
      centroids.push(v);
    }
    return centroids;
  }

  static euclideanDistanceSq(vecA, vecB) {
    let sum = 0;
    const len = Math.min(vecA.length, vecB.length);
    for (let i = 0; i < len; i++) {
      const diff = (vecA[i] || 0) - (vecB[i] || 0);
      sum += diff * diff;
    }
    return sum;
  }

  /**
   * Tìm cụm thô gần nhất cho một vector
   */
  _findNearestCoarseCentroid(vector) {
    let bestIdx = 0;
    let minDist = Infinity;
    for (let i = 0; i < this.numCentroids; i++) {
      const d = IvfProductQuantizer.euclideanDistanceSq(vector, this.coarseCentroids[i]);
      if (d < minDist) {
        minDist = d;
        bestIdx = i;
      }
    }
    return { centroidIdx: bestIdx, distanceSq: minDist };
  }

  /**
   * Lượng tử hóa vector phần dư (Residual) thành M mã số (codes)
   */
  _quantizeResidual(residual) {
    const codes = [];
    for (let m = 0; m < this.numSubvectors; m++) {
      const subVec = residual.slice(m * this.subvectorDim, (m + 1) * this.subvectorDim);
      let bestCode = 0;
      let minSubDist = Infinity;

      for (let k = 0; k < this.subvectorK; k++) {
        const d = IvfProductQuantizer.euclideanDistanceSq(subVec, this.subvectorCodebooks[m][k]);
        if (d < minSubDist) {
          minSubDist = d;
          bestCode = k;
        }
      }
      codes.push(bestCode);
    }
    return codes;
  }

  /**
   * Thêm vector vào chỉ mục IVF-PQ
   */
  insert(id, vector, metadata = {}) {
    if (!vector || vector.length !== this.dimension) {
      throw new Error(`Vector phải có số chiều đúng bằng ${this.dimension}`);
    }

    // Bước 1: Gán vào cụm thô
    const { centroidIdx } = this._findNearestCoarseCentroid(vector);
    const coarseVec = this.coarseCentroids[centroidIdx];

    // Bước 2: Tính vector phần dư r = x - c
    const residual = [];
    for (let i = 0; i < this.dimension; i++) {
      residual.push((vector[i] || 0) - coarseVec[i]);
    }

    // Bước 3: Lượng tử hóa phân đoạn PQ
    const codes = this._quantizeResidual(residual);

    // Bước 4: Lưu vào danh sách ngược (Inverted List)
    this.invertedLists.get(centroidIdx).push({
      id,
      codes,
      metadata
    });

    this.indexedCount++;
    return { centroidIdx, codes };
  }

  /**
   * Tìm kiếm Asymmetric Distance Computation (ADC) với n_probe cụm thô
   */
  search(queryVector, k = 5, nProbe = 2) {
    if (!queryVector || queryVector.length !== this.dimension) {
      return [];
    }

    // 1. Tìm n_probe cụm thô gần nhất với query
    const coarseDistances = [];
    for (let i = 0; i < this.numCentroids; i++) {
      coarseDistances.push({
        centroidIdx: i,
        distanceSq: IvfProductQuantizer.euclideanDistanceSq(queryVector, this.coarseCentroids[i])
      });
    }
    coarseDistances.sort((a, b) => a.distanceSq - b.distanceSq);
    const probedCentroids = coarseDistances.slice(0, Math.min(nProbe, this.numCentroids));

    const candidates = [];

    // 2. Tra cứu từng danh sách ngược với bảng khoảng cách Asymmetric Distance Table
    for (const probed of probedCentroids) {
      const cIdx = probed.centroidIdx;
      const coarseVec = this.coarseCentroids[cIdx];

      // Tính query residual đối với cụm này
      const queryResidual = [];
      for (let d = 0; d < this.dimension; d++) {
        queryResidual.push(queryVector[d] - coarseVec[d]);
      }

      // Xây dựng trước bảng khoảng cách sub-vector ADC: table[m][code]
      const distTable = [];
      for (let m = 0; m < this.numSubvectors; m++) {
        const qSub = queryResidual.slice(m * this.subvectorDim, (m + 1) * this.subvectorDim);
        const subDist = [];
        for (let code = 0; code < this.subvectorK; code++) {
          subDist.push(IvfProductQuantizer.euclideanDistanceSq(qSub, this.subvectorCodebooks[m][code]));
        }
        distTable.push(subDist);
      }

      // Quét các vector trong inverted list qua bảng tra cứu cực nhanh
      const items = this.invertedLists.get(cIdx);
      for (const item of items) {
        let adcDistSq = 0;
        for (let m = 0; m < this.numSubvectors; m++) {
          adcDistSq += distTable[m][item.codes[m]];
        }

        candidates.push({
          id: item.id,
          distanceSq: Math.round(adcDistSq * 1000) / 1000,
          similarityScore: Math.round((1 / (1 + adcDistSq)) * 100) / 100,
          coarseCluster: cIdx,
          metadata: item.metadata
        });
      }
    }

    candidates.sort((a, b) => a.distanceSq - b.distanceSq);
    return candidates.slice(0, k);
  }

  size() {
    return this.indexedCount;
  }
}

export { IvfProductQuantizer };
export default IvfProductQuantizer;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { IvfProductQuantizer };
  }
} catch (e) {}
