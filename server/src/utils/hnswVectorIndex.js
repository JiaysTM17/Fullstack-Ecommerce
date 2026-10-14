/**
 * Hierarchical Navigable Small World (HNSW) Vector Index
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 10 - Feature 157)
 * 
 * Vấn đề:
 * Trong sàn TMĐT hiện đại, sản phẩm được biểu diễn dưới dạng vector đa chiều (Embeddings)
 * từ các mô hình AI (như CLIP cho tìm kiếm hình ảnh, BERT/MiniLM cho tìm kiếm ngữ nghĩa).
 * Tìm kiếm chính xác vét cạn K láng giềng gần nhất (Exact KNN) tốn thời gian O(N * D),
 * không thể đáp ứng thời gian thực (< 10ms) khi catalog mở rộng lên hàng trăm nghìn sản phẩm.
 * 
 * Giải pháp HNSW (Approximate Nearest Neighbors - ANN Search):
 * 1. Cấu trúc đồ thị phân tầng đa mức (Multi-layer Proximity Graph):
 *    - Tầng cao nhất (Layer L) thưa thớt, chứa các cạnh xa đóng vai trò đường cao tốc (Skip-List Graph).
 *    - Tầng cơ sở (Layer 0) chứa tất cả các vector với các cạnh dày đặc liên kết láng giềng gần.
 * 2. Xác suất tầng phân phối hàm mũ: P(level = l) ~ exp(-l / mL) với mL = 1 / ln(M).
 * 3. Tìm kiếm tham lam (Greedy Search):
 *    - Từ entry point ở tầng cao nhất, nhảy tham lam tới nút gần query nhất cho đến cực tiểu cục bộ.
 *    - Xuống tầng tiếp theo lấy nút cực tiểu đó làm điểm xuất phát mới.
 *    - Tại tầng 0, thực hiện Beam Search với hàng đợi ưu tiên kích thước efSearch để trả về Top-K láng giềng.
 * 4. Độ phức tạp:
 *    - Tìm kiếm: O(log N)
 *    - Bộ nhớ: O(N * M)
 */

/**
 * Tính khoảng cách Cosine giữa 2 vector: distance = 1 - cosine_similarity
 * Giá trị trong khoảng [0, 2]. 0 nghĩa là đồng hướng tuyệt đối.
 */
export function cosineDistance(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return 1.0;
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  const len = vecA.length;

  for (let i = 0; i < len; i++) {
    const a = vecA[i];
    const b = vecB[i];
    dot += a * b;
    normA += a * a;
    normB += b * b;
  }

  if (normA === 0 || normB === 0) return 1.0;
  const similarity = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  // Kẹp giá trị trong [-1, 1] để tránh sai số dấu phẩy động
  const clampedSim = Math.max(-1, Math.min(1, similarity));
  return 1 - clampedSim;
}

/**
 * Tính khoảng cách Euclid (L2 Distance) giữa 2 vector
 */
export function euclideanDistance(vecA, vecB) {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) {
    return Infinity;
  }
  let sum = 0;
  const len = vecA.length;
  for (let i = 0; i < len; i++) {
    const diff = vecA[i] - vecB[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

/**
 * Priority Queue đơn giản hỗ trợ Min-Heap hoặc Max-Heap
 */
export class PriorityQueue {
  constructor(comparator = (a, b) => a.dist - b.dist) {
    this.comparator = comparator;
    this.data = [];
  }

  push(item) {
    this.data.push(item);
    this.data.sort(this.comparator);
  }

  pop() {
    return this.data.shift();
  }

  peek() {
    return this.data[0];
  }

  get size() {
    return this.data.length;
  }

  values() {
    return [...this.data];
  }
}

/**
 * HNSW Node đại diện cho một sản phẩm trong đồ thị vector
 */
export class HNSWNode {
  constructor(id, vector, level, metadata = {}) {
    this.id = String(id);
    this.vector = Array.from(vector);
    this.level = level;
    this.metadata = metadata;
    // neighborsByLevel[l] là Set chứa ID các láng giềng ở tầng l
    this.neighborsByLevel = Array.from({ length: level + 1 }, () => new Set());
  }
}

/**
 * Lớp HNSWIndex quản lý việc đánh chỉ mục và tìm kiếm vector xấp xỉ
 */
export class HNSWIndex {
  constructor({
    dim = 128,
    M = 16,
    efConstruction = 64,
    efSearch = 32,
    metric = "cosine", // "cosine" hoặc "euclidean"
    randomSeed = null,
  } = {}) {
    this.dim = dim;
    this.M = Math.max(4, Number(M) || 16);
    this.M0 = 2 * this.M; // Tầng 0 cho phép số cạnh gấp đôi
    this.efConstruction = Math.max(this.M, Number(efConstruction) || 64);
    this.efSearch = Math.max(1, Number(efSearch) || 32);
    this.metric = metric === "euclidean" ? "euclidean" : "cosine";
    this.distanceFn = this.metric === "euclidean" ? euclideanDistance : cosineDistance;
    this.mL = 1 / Math.log(this.M);

    this.nodes = new Map(); // id -> HNSWNode
    this.entryPointId = null;
    this.maxLevel = -1;
    this._rng = this._createRng(randomSeed);
  }

  _createRng(seed) {
    if (seed == null) {
      return Math.random;
    }
    let s = Number(seed) || 1;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /**
   * Sinh tầng ngẫu nhiên cho nút mới theo luật phân phối hình học / hàm mũ
   */
  _randomLevel() {
    const r = Math.max(1e-7, this._rng());
    const level = Math.floor(-Math.log(r) * this.mL);
    return Math.min(level, 16); // Giới hạn tối đa 16 tầng để tránh tràn độ sâu
  }

  get size() {
    return this.nodes.size;
  }

  /**
   * Thêm một vector sản phẩm vào chỉ mục HNSW
   */
  insert(id, vector, metadata = {}) {
    const strId = String(id);
    if (!vector || vector.length !== this.dim) {
      throw new Error(`Vector dimension mismatch. Expected ${this.dim}, got ${vector ? vector.length : 0}`);
    }

    if (this.nodes.has(strId)) {
      // Nếu đã tồn tại, xóa bỏ nút cũ rồi thêm lại
      this.remove(strId);
    }

    const nodeLevel = this._randomLevel();
    const newNode = new HNSWNode(strId, vector, nodeLevel, metadata);
    this.nodes.set(strId, newNode);

    // Trường hợp đồ thị chưa có phần tử nào
    if (this.entryPointId === null) {
      this.entryPointId = strId;
      this.maxLevel = nodeLevel;
      return newNode;
    }

    let currObj = this.nodes.get(this.entryPointId);
    let currDist = this.distanceFn(vector, currObj.vector);

    // 1. Giai đoạn 1: Greedy search từ tầng cao nhất xuống tầng nodeLevel + 1
    for (let l = this.maxLevel; l > nodeLevel; l--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = currObj.neighborsByLevel[l] || new Set();
        for (const neighborId of neighbors) {
          const neighborNode = this.nodes.get(neighborId);
          if (!neighborNode) continue;
          const d = this.distanceFn(vector, neighborNode.vector);
          if (d < currDist) {
            currDist = d;
            currObj = neighborNode;
            changed = true;
          }
        }
      }
    }

    // 2. Giai đoạn 2: Từ min(maxLevel, nodeLevel) xuống tầng 0
    let enterNodes = [currObj];
    const topLevel = Math.min(this.maxLevel, nodeLevel);

    for (let l = topLevel; l >= 0; l--) {
      // Tìm các láng giềng ứng viên tốt nhất ở tầng l bằng beam search
      const candidates = this._searchLayer(vector, enterNodes, this.efConstruction, l);

      // Chọn tối đa M láng giềng (hoặc M0 ở tầng 0)
      const maxM = l === 0 ? this.M0 : this.M;
      const selectedNeighbors = this._selectNeighbors(candidates, maxM);

      // Thêm cạnh 2 chiều giữa newNode và các láng giềng được chọn
      for (const n of selectedNeighbors) {
        const neighborNode = this.nodes.get(n.id);
        if (!neighborNode) continue;

        newNode.neighborsByLevel[l].add(n.id);
        neighborNode.neighborsByLevel[l].add(strId);

        // Nếu láng giềng vượt quá số liên kết tối đa, tỉa bớt cạnh xa nhất
        const nLimit = l === 0 ? this.M0 : this.M;
        if (neighborNode.neighborsByLevel[l].size > nLimit) {
          this._shrinkNeighbors(neighborNode, l, nLimit);
        }
      }

      enterNodes = selectedNeighbors.map((sn) => this.nodes.get(sn.id));
    }

    // 3. Nếu node mới có tầng cao hơn maxLevel hiện tại, cập nhật entry point
    if (nodeLevel > this.maxLevel) {
      this.maxLevel = nodeLevel;
      this.entryPointId = strId;
    }

    return newNode;
  }

  /**
   * Beam Search trên một tầng xác định
   */
  _searchLayer(queryVector, enterNodes, ef, level) {
    const visited = new Set();
    // Candidates queue: Min-heap theo khoảng cách (ưu tiên duyệt nút gần nhất)
    const candidates = new PriorityQueue((a, b) => a.dist - b.dist);
    // Dynamic result set W: Max-heap theo khoảng cách (để dễ dàng lấy ra nút xa nhất trong top ef)
    const w = new PriorityQueue((a, b) => b.dist - a.dist);

    for (const en of enterNodes) {
      if (!en) continue;
      const d = this.distanceFn(queryVector, en.vector);
      visited.add(en.id);
      candidates.push({ id: en.id, dist: d });
      w.push({ id: en.id, dist: d });
    }

    while (candidates.size > 0) {
      const current = candidates.pop();
      const furthestInW = w.peek();

      if (current.dist > furthestInW.dist) {
        break;
      }

      const currentNode = this.nodes.get(current.id);
      if (!currentNode) continue;

      const neighbors = currentNode.neighborsByLevel[level] || new Set();
      for (const nId of neighbors) {
        if (!visited.has(nId)) {
          visited.add(nId);
          const neighborNode = this.nodes.get(nId);
          if (!neighborNode) continue;

          const d = this.distanceFn(queryVector, neighborNode.vector);
          const worstW = w.peek();

          if (d < worstW.dist || w.size < ef) {
            candidates.push({ id: nId, dist: d });
            w.push({ id: nId, dist: d });

            if (w.size > ef) {
              w.pop(); // Bỏ phần tử xa nhất
            }
          }
        }
      }
    }

    // Trả về danh sách sắp xếp tăng dần theo khoảng cách
    return w.values().sort((a, b) => a.dist - b.dist);
  }

  _selectNeighbors(candidates, maxM) {
    return candidates.slice(0, maxM);
  }

  _shrinkNeighbors(node, level, maxM) {
    const neighbors = Array.from(node.neighborsByLevel[level]).map((nId) => {
      const nNode = this.nodes.get(nId);
      return {
        id: nId,
        dist: nNode ? this.distanceFn(node.vector, nNode.vector) : Infinity,
      };
    });

    neighbors.sort((a, b) => a.dist - b.dist);
    const kept = neighbors.slice(0, maxM);
    node.neighborsByLevel[level] = new Set(kept.map((k) => k.id));
  }

  /**
   * Tìm kiếm K láng giềng gần nhất cho vector truy vấn (Approximate K-NN Search)
   * @param {Array<number>} queryVector Vector cần tìm kiếm
   * @param {number} k Số lượng sản phẩm tương đồng muốn lấy (mặc định 10)
   * @param {number} efSearch Kích thước beam search tầng đáy (mặc định this.efSearch)
   * @returns {Array<Object>} Danh sách top K kết quả kèm điểm tương đồng (similarity)
   */
  searchKNN(queryVector, k = 10, efSearch = null) {
    if (this.nodes.size === 0 || !this.entryPointId) {
      return [];
    }

    if (!queryVector || queryVector.length !== this.dim) {
      throw new Error(`Query vector dimension mismatch. Expected ${this.dim}, got ${queryVector ? queryVector.length : 0}`);
    }

    const ef = Math.max(k, efSearch || this.efSearch);
    let currObj = this.nodes.get(this.entryPointId);
    let currDist = this.distanceFn(queryVector, currObj.vector);

    // 1. Greedy search từ tầng đỉnh xuống tầng 1
    for (let l = this.maxLevel; l > 0; l--) {
      let changed = true;
      while (changed) {
        changed = false;
        const neighbors = currObj.neighborsByLevel[l] || new Set();
        for (const nId of neighbors) {
          const nNode = this.nodes.get(nId);
          if (!nNode) continue;
          const d = this.distanceFn(queryVector, nNode.vector);
          if (d < currDist) {
            currDist = d;
            currObj = nNode;
            changed = true;
          }
        }
      }
    }

    // 2. Beam search ở tầng 0 với danh sách ứng viên kích thước ef
    const candidates = this._searchLayer(queryVector, [currObj], ef, 0);

    // 3. Trích xuất Top K kết quả
    const topK = candidates.slice(0, k);

    return topK.map((item) => {
      const node = this.nodes.get(item.id);
      const similarity = this.metric === "cosine" ? Math.max(0, 1 - item.dist) : 1 / (1 + item.dist);
      return {
        id: item.id,
        distance: Number(item.dist.toFixed(6)),
        similarity: Number(similarity.toFixed(4)),
        metadata: node ? node.metadata : {},
      };
    });
  }

  /**
   * Xóa một nút khỏi chỉ mục
   */
  remove(id) {
    const strId = String(id);
    const node = this.nodes.get(strId);
    if (!node) return false;

    // Gỡ liên kết của nút khỏi tất cả các láng giềng
    for (let l = 0; l <= node.level; l++) {
      for (const nId of node.neighborsByLevel[l]) {
        const neighbor = this.nodes.get(nId);
        if (neighbor && neighbor.neighborsByLevel[l]) {
          neighbor.neighborsByLevel[l].delete(strId);
        }
      }
    }

    this.nodes.delete(strId);

    // Cập nhật lại entryPoint nếu nút vừa xóa là entryPoint
    if (this.entryPointId === strId) {
      if (this.nodes.size === 0) {
        this.entryPointId = null;
        this.maxLevel = -1;
      } else {
        // Chọn nút có tầng cao nhất còn lại làm entryPoint mới
        let highestLevel = -1;
        let newEntry = null;
        for (const [remId, remNode] of this.nodes.entries()) {
          if (remNode.level > highestLevel) {
            highestLevel = remNode.level;
            newEntry = remId;
          }
        }
        this.entryPointId = newEntry;
        this.maxLevel = highestLevel;
      }
    }

    return true;
  }

  /**
   * Xuất chỉ mục sang định dạng JSON
   */
  toJSON() {
    const nodesData = [];
    for (const [id, node] of this.nodes.entries()) {
      nodesData.push({
        id,
        vector: node.vector,
        level: node.level,
        metadata: node.metadata,
        neighborsByLevel: node.neighborsByLevel.map((set) => Array.from(set)),
      });
    }

    return {
      dim: this.dim,
      M: this.M,
      M0: this.M0,
      efConstruction: this.efConstruction,
      efSearch: this.efSearch,
      metric: this.metric,
      maxLevel: this.maxLevel,
      entryPointId: this.entryPointId,
      nodes: nodesData,
    };
  }

  /**
   * Nạp lại chỉ mục từ JSON
   */
  static fromJSON(data) {
    if (!data) return new HNSWIndex();
    const index = new HNSWIndex({
      dim: data.dim,
      M: data.M,
      efConstruction: data.efConstruction,
      efSearch: data.efSearch,
      metric: data.metric,
    });

    index.maxLevel = data.maxLevel;
    index.entryPointId = data.entryPointId;

    if (Array.isArray(data.nodes)) {
      for (const n of data.nodes) {
        const node = new HNSWNode(n.id, n.vector, n.level, n.metadata);
        if (Array.isArray(n.neighborsByLevel)) {
          node.neighborsByLevel = n.neighborsByLevel.map((arr) => new Set(arr));
        }
        index.nodes.set(n.id, node);
      }
    }

    return index;
  }
}

export default {
  HNSWIndex,
  HNSWNode,
  PriorityQueue,
  cosineDistance,
  euclideanDistance,
};
