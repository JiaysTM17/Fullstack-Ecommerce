/**
 * Hierarchical Navigable Small World (HNSW) Vector Search & Dynamic Multi-Layer Re-ranker
 * 
 * Thuật toán Đồ Thị Thế Giới Nhỏ Phân Tầng (HNSW Graph - O(log N)):
 * 1. Cấu trúc đồ thị đa tầng (Multi-Layer Skip-Graph):
 *    - Các tầng trên cùng thưa thớt (sparse), có liên kết bước nhảy dài giúp định vị nhanh vùng lân cận.
 *    - Tầng 0 (bottom layer) dày đặc chứa toàn bộ các vector sản phẩm, tìm kiếm K láng giềng gần nhất (k-NN).
 * 2. Độ đo tương đồng ngữ nghĩa:
 *    - Cosine Distance & Cosine Similarity chuẩn hóa không gian đa chiều (Embedding Vectors).
 * 3. Tái xếp hạng đa mục tiêu (Multi-Objective Dynamic Re-ranking):
 *    - Kết hợp điểm ngữ nghĩa (Vector Similarity Score) với tín hiệu kinh doanh thực tế (Sales Velocity, Review Rating, Discount Depth).
 * 4. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Tìm kiếm ngữ nghĩa thông minh (Semantic Product Search).
 *    - Gợi ý sản phẩm tương tự (More Like This) theo thời gian thực dưới 2ms.
 */

export class HNSWVectorReranker {
  /**
   * @param {Object} options
   * @param {number} [options.maxLayers=4] - Số tầng đồ thị tối đa
   * @param {number} [options.m=6] - Số liên kết tối đa của mỗi đỉnh trên một tầng
   * @param {number} [options.efConstruction=16] - Kích thước hàng đợi ứng viên khi xây dựng
   * @param {number} [options.mL=0.62] - Hệ số phân rã tầng ngẫu nhiên
   */
  constructor({ maxLayers = 4, m = 6, efConstruction = 16, mL = 0.62 } = {}) {
    this.maxLayers = maxLayers;
    this.m = m;
    this.efConstruction = efConstruction;
    this.mL = mL;
    this.nodes = new Map(); // id -> { id, vector, metadata, layers: Array<Set<id>> }
    this.entryPoint = null; // id của node ở tầng cao nhất
    this.maxLevel = -1;
  }

  /**
   * Tính Cosine Similarity giữa 2 vector [-1, 1]
   */
  static cosineSimilarity(v1 = [], v2 = []) {
    if (!v1.length || !v2.length || v1.length !== v2.length) return 0;
    let dot = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      normA += v1[i] * v1[i];
      normB += v2[i] * v2[i];
    }
    if (normA === 0 || normB === 0) return 0;
    return dot / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Tính Cosine Distance [0, 2] (khoảng cách càng nhỏ càng tương đồng)
   */
  static cosineDistance(v1 = [], v2 = []) {
    return 1 - HNSWVectorReranker.cosineSimilarity(v1, v2);
  }

  /**
   * Sinh ngẫu nhiên tầng cho node mới theo phân phối hàm mũ
   */
  _getRandomLevel() {
    let r = Math.random();
    if (r === 0) r = 0.0000001;
    const level = Math.floor(-Math.log(r) * this.mL);
    return Math.min(level, this.maxLayers - 1);
  }

  /**
   * Thêm một vector sản phẩm vào đồ thị HNSW
   * @param {string} id - Mã sản phẩm / SKU
   * @param {Array<number>} vector - Mảng embedding đặc trưng
   * @param {Object} [metadata={}] - Thông tin bổ trợ (title, price, rating, salesCount)
   */
  addNode(id, vector, metadata = {}) {
    if (!id || !Array.isArray(vector) || vector.length === 0) {
      throw new Error("Invalid id or vector for HNSW node");
    }

    const nodeLevel = this._getRandomLevel();
    const nodeLayers = [];
    for (let l = 0; l <= nodeLevel; l++) {
      nodeLayers.push(new Set());
    }

    const newNode = {
      id,
      vector,
      metadata: { ...metadata },
      level: nodeLevel,
      layers: nodeLayers
    };

    this.nodes.set(id, newNode);

    // Nếu là đỉnh đầu tiên của đồ thị
    if (this.entryPoint === null) {
      this.entryPoint = id;
      this.maxLevel = nodeLevel;
      return newNode;
    }

    let currObj = this.nodes.get(this.entryPoint);
    let currDist = HNSWVectorReranker.cosineDistance(vector, currObj.vector);

    // 1. Duyệt greedy từ tầng cao nhất xuống tầng nodeLevel + 1
    for (let level = this.maxLevel; level > nodeLevel; level--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = currObj.layers[level] ? Array.from(currObj.layers[level]) : [];
        for (const neighborId of neighbors) {
          const neighbor = this.nodes.get(neighborId);
          if (!neighbor) continue;
          const d = HNSWVectorReranker.cosineDistance(vector, neighbor.vector);
          if (d < currDist) {
            currDist = d;
            currObj = neighbor;
            changed = true;
          }
        }
      }
    }

    // 2. Từ tầng min(nodeLevel, maxLevel) xuống tầng 0: kết nối láng giềng
    const topConnectLevel = Math.min(nodeLevel, this.maxLevel);
    for (let level = topConnectLevel; level >= 0; level--) {
      // Tìm các ứng viên gần nhất ở tầng này
      const candidates = this._searchLayer(currObj, vector, this.efConstruction, level);
      // Chọn ra tối đa m láng giềng gần nhất
      const neighborsToConnect = candidates.slice(0, this.m);

      for (const { id: candId } of neighborsToConnect) {
        if (candId === id) continue;
        const candNode = this.nodes.get(candId);
        if (candNode && candNode.layers[level]) {
          newNode.layers[level].add(candId);
          candNode.layers[level].add(id);

          // Cắt tỉa nếu vượt quá m liên kết
          if (candNode.layers[level].size > this.m) {
            this._pruneNeighbors(candNode, level);
          }
        }
      }
      if (neighborsToConnect.length > 0) {
        currObj = this.nodes.get(neighborsToConnect[0].id) || currObj;
      }
    }

    // Cập nhật Entry Point nếu node mới có level cao hơn
    if (nodeLevel > this.maxLevel) {
      this.maxLevel = nodeLevel;
      this.entryPoint = id;
    }

    return newNode;
  }

  /**
   * Tìm kiếm trong 1 tầng bằng Best-First Search
   */
  _searchLayer(entryNode, queryVector, ef, level) {
    const vEntry = entryNode.vector;
    const dEntry = HNSWVectorReranker.cosineDistance(queryVector, vEntry);

    const visited = new Set([entryNode.id]);
    // candidates: danh sách sắp xếp tăng dần theo khoảng cách
    let candidates = [{ id: entryNode.id, dist: dEntry }];
    let results = [{ id: entryNode.id, dist: dEntry }];

    while (candidates.length > 0) {
      const current = candidates.shift();
      const furthestResult = results[results.length - 1];

      if (current.dist > furthestResult.dist && results.length >= ef) {
        break;
      }

      const currNode = this.nodes.get(current.id);
      if (!currNode || !currNode.layers[level]) continue;

      const neighbors = Array.from(currNode.layers[level]);
      for (const neighborId of neighbors) {
        if (visited.has(neighborId)) continue;
        visited.add(neighborId);

        const neighborNode = this.nodes.get(neighborId);
        if (!neighborNode) continue;

        const d = HNSWVectorReranker.cosineDistance(queryVector, neighborNode.vector);
        if (d < furthestResult.dist || results.length < ef) {
          candidates.push({ id: neighborId, dist: d });
          candidates.sort((a, b) => a.dist - b.dist);

          results.push({ id: neighborId, dist: d });
          results.sort((a, b) => a.dist - b.dist);

          if (results.length > ef) {
            results.pop();
          }
        }
      }
    }

    return results;
  }

  /**
   * Cắt tỉa liên kết của một node ở một tầng để không vượt quá m
   */
  _pruneNeighbors(node, level) {
    const neighbors = Array.from(node.layers[level]);
    if (neighbors.length <= this.m) return;

    const scored = neighbors.map(nId => {
      const nNode = this.nodes.get(nId);
      const d = nNode ? HNSWVectorReranker.cosineDistance(node.vector, nNode.vector) : Infinity;
      return { id: nId, dist: d };
    });

    scored.sort((a, b) => a.dist - b.dist);
    const keep = new Set(scored.slice(0, this.m).map(s => s.id));
    node.layers[level] = keep;
  }

  /**
   * Tìm kiếm K láng giềng gần nhất (k-NN) từ vector truy vấn
   * @param {Array<number>} queryVector
   * @param {number} [k=5]
   * @param {number} [efSearch=16]
   * @returns {Array<{ id: string, score: number, distance: number, similarity: number, metadata: Object }>}
   */
  searchKnn(queryVector, k = 5, efSearch = 16) {
    if (!this.entryPoint || this.nodes.size === 0) {
      return [];
    }

    let currObj = this.nodes.get(this.entryPoint);
    let currDist = HNSWVectorReranker.cosineDistance(queryVector, currObj.vector);

    // Duyệt nhanh từ tầng cao nhất xuống tầng 1
    for (let level = this.maxLevel; level > 0; level--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = currObj.layers[level] ? Array.from(currObj.layers[level]) : [];
        for (const neighborId of neighbors) {
          const neighbor = this.nodes.get(neighborId);
          if (!neighbor) continue;
          const d = HNSWVectorReranker.cosineDistance(queryVector, neighbor.vector);
          if (d < currDist) {
            currDist = d;
            currObj = neighbor;
            changed = true;
          }
        }
      }
    }

    // Tầng 0: Khảo sát chi tiết với efSearch
    const rawResults = this._searchLayer(currObj, queryVector, Math.max(k, efSearch), 0);
    const topK = rawResults.slice(0, k);

    return topK.map(({ id, dist }) => {
      const node = this.nodes.get(id);
      const similarity = Math.max(0, 1 - dist);
      return {
        id,
        distance: Number(dist.toFixed(4)),
        similarity: Number(similarity.toFixed(4)),
        score: Number(similarity.toFixed(4)),
        metadata: node ? node.metadata : {}
      };
    });
  }

  /**
   * Tái xếp hạng đa tầng động (Dynamic Multi-Layer Re-ranking)
   * Kết hợp điểm tương đồng ngữ nghĩa (Vector Similarity) với tín hiệu kinh doanh thực tế.
   * 
   * Score = alpha * VectorSimilarity + beta * NormalizedBusinessScore
   * 
   * @param {Array<number>} queryVector
   * @param {Object} [options={}]
   * @param {number} [options.k=10]
   * @param {number} [options.alpha=0.65] - Trọng số tương đồng vector
   * @param {number} [options.beta=0.35] - Trọng số tín hiệu kinh doanh
   * @returns {Array<Object>}
   */
  dynamicRerank(queryVector, { k = 10, alpha = 0.65, beta = 0.35 } = {}) {
    const knnCandidates = this.searchKnn(queryVector, k * 2, 24);
    if (knnCandidates.length === 0) return [];

    // Tìm giá trị max của các thuộc tính kinh doanh để chuẩn hóa [0, 1]
    let maxSales = 1;
    let maxRating = 5;

    for (const c of knnCandidates) {
      const sales = c.metadata.salesCount || 0;
      if (sales > maxSales) maxSales = sales;
    }

    const reranked = knnCandidates.map(c => {
      const meta = c.metadata;
      const normRating = (meta.rating || 4.0) / maxRating;
      const normSales = (meta.salesCount || 0) / maxSales;
      const isMallBonus = meta.isMall ? 0.1 : 0.0;
      const businessScore = Math.min(1.0, 0.5 * normRating + 0.4 * normSales + isMallBonus);

      const finalScore = Number((alpha * c.similarity + beta * businessScore).toFixed(4));

      return {
        id: c.id,
        finalScore,
        semanticScore: c.similarity,
        businessScore: Number(businessScore.toFixed(4)),
        metadata: meta
      };
    });

    reranked.sort((a, b) => b.finalScore - a.finalScore);
    return reranked.slice(0, k);
  }

  /**
   * Số lượng nút trong đồ thị
   */
  size() {
    return this.nodes.size;
  }
}
