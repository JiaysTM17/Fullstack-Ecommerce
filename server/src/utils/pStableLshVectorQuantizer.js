/**
 * Locality-Sensitive Hashing with p-Stable Random Projections (Vector Quantizer)
 * 
 * Thuật toán Băm Cảm Nhận Vị Trí Dựa Trên Phân Phối p-Stable (O(1) Bucket Lookup):
 * 1. Cơ sở toán học:
 *    - Sử dụng các phép chiếu ngẫu nhiên (Random Projections) qua vector Gaussian chuẩn N(0, 1) cho không gian Euclidean (L2).
 *    - Hàm băm: h_{a, b}(v) = floor((a . v + b) / w) với a ~ N(0, I), b ~ Uniform[0, w), và w là độ rộng cửa sổ (bin width).
 *    - Gộp k hàm băm thành một bảng băm (Compound Hash Key) và sử dụng L bảng băm độc lập để tăng độ hồi tưởng (Recall).
 * 2. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Phân cụm đặc trưng người mua theo thói quen chi tiêu (Buyer Persona Clustering) trong không gian vector liên tục.
 *    - Tìm kiếm xấp xỉ láng giềng gần nhất (Approximate Nearest Neighbors) cho gợi ý sản phẩm thời gian thực mà không quét cạn O(N).
 */

export class PStableLSHVectorQuantizer {
  /**
   * @param {Object} options
   * @param {number} [options.dimensions=8] - Số chiều của vector đặc trưng
   * @param {number} [options.numHashFunctions=4] - Số hàm băm trên một bảng (k)
   * @param {number} [options.numTables=3] - Số bảng băm độc lập (L)
   * @param {number} [options.binWidth=2.0] - Độ rộng cửa sổ chiếu (w)
   */
  constructor({ dimensions = 8, numHashFunctions = 4, numTables = 3, binWidth = 2.0 } = {}) {
    this.dimensions = dimensions;
    this.k = numHashFunctions;
    this.L = numTables;
    this.w = binWidth;

    this.tables = []; // Array of Maps: bucketKey -> Array of items { id, vector, metadata }
    this.projections = []; // Array of L tables, each having k projection vectors [a] and offsets [b]

    this._initHashFunctions();
  }

  /**
   * Sinh số ngẫu nhiên theo phân phối Gaussian chuẩn N(0, 1) bằng Box-Muller Transform
   */
  static _randomGaussian() {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  }

  _initHashFunctions() {
    this.tables = [];
    this.projections = [];

    for (let l = 0; l < this.L; l++) {
      this.tables.push(new Map());
      const tableProjections = [];

      for (let i = 0; i < this.k; i++) {
        const a = [];
        for (let d = 0; d < this.dimensions; d++) {
          a.push(PStableLSHVectorQuantizer._randomGaussian());
        }
        const b = Math.random() * this.w;
        tableProjections.push({ a, b });
      }

      this.projections.push(tableProjections);
    }
  }

  /**
   * Tính mã băm kết hợp cho một vector tại bảng băm thứ tableIdx
   */
  _computeHashKey(vector, tableIdx) {
    const tableProj = this.projections[tableIdx];
    const hashValues = [];

    for (let i = 0; i < this.k; i++) {
      const { a, b } = tableProj[i];
      let dot = 0;
      for (let d = 0; d < this.dimensions; d++) {
        dot += a[d] * (vector[d] || 0);
      }
      const h = Math.floor((dot + b) / this.w);
      hashValues.push(h);
    }

    return hashValues.join(",");
  }

  /**
   * Thêm một vector thực thể vào hệ thống LSH
   * @param {string} id - Mã thực thể (ví dụ: BUYER_123, SKU_888)
   * @param {Array<number>} vector - Vector đặc trưng liên tục
   * @param {Object} [metadata={}]
   */
  addVector(id, vector = [], metadata = {}) {
    if (!id || !Array.isArray(vector)) return;

    for (let l = 0; l < this.L; l++) {
      const bucketKey = this._computeHashKey(vector, l);
      const table = this.tables[l];

      if (!table.has(bucketKey)) {
        table.set(bucketKey, []);
      }
      table.get(bucketKey).push({ id, vector: [...vector], metadata: { ...metadata } });
    }
  }

  /**
   * Khoảng cách Euclidean giữa 2 vector
   */
  static euclideanDistance(v1 = [], v2 = []) {
    let sum = 0;
    const len = Math.min(v1.length, v2.length);
    for (let i = 0; i < len; i++) {
      const diff = v1[i] - v2[i];
      sum += diff * diff;
    }
    return Math.sqrt(sum);
  }

  /**
   * Tìm kiếm các ứng viên tương đồng trong cùng xô băm với vector truy vấn
   * @param {Array<number>} queryVector
   * @param {Object} [options={}]
   * @param {number} [options.topK=5]
   * @returns {Array<{ id: string, distance: number, metadata: Object }>}
   */
  queryCandidates(queryVector = [], { topK = 5 } = {}) {
    const candidateMap = new Map(); // id -> item

    // Thu thập ứng viên từ tất cả L bảng băm (Union of buckets)
    for (let l = 0; l < this.L; l++) {
      const bucketKey = this._computeHashKey(queryVector, l);
      const bucket = this.tables[l].get(bucketKey);

      if (bucket) {
        for (const item of bucket) {
          if (!candidateMap.has(item.id)) {
            candidateMap.set(item.id, item);
          }
        }
      }
    }

    const scored = [];
    for (const item of candidateMap.values()) {
      const dist = PStableLSHVectorQuantizer.euclideanDistance(queryVector, item.vector);
      scored.push({
        id: item.id,
        distance: Number(dist.toFixed(4)),
        metadata: item.metadata
      });
    }

    scored.sort((a, b) => a.distance - b.distance);
    return scored.slice(0, topK);
  }

  /**
   * Thống kê dung lượng và phân bố xô băm
   */
  getStats() {
    let totalBuckets = 0;
    let totalItemsIndexed = 0;

    for (const table of this.tables) {
      totalBuckets += table.size;
      for (const bucket of table.values()) {
        totalItemsIndexed += bucket.length;
      }
    }

    return {
      numTables: this.L,
      dimensions: this.dimensions,
      totalBuckets,
      averageBucketDepth: totalBuckets > 0 ? Number((totalItemsIndexed / totalBuckets).toFixed(2)) : 0
    };
  }
}
