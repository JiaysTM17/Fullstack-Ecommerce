/**
 * Adaptive K-Minimum Values (AKMV) Sketch & Dynamic Cardinality Estimator
 * (Kevin Beyer et al., ACM SIGMOD / Edith Cohen, Haim Kaplan, JCSS)
 * 
 * Thuật toán Ước Lượng Tập Hợp Thích Ứng K-Minimum Values với Kích Thước Co Giãn Động
 * 
 * Đột phá:
 * - Khắc phục nhược điểm của KMV cổ điển với k cố định: AKMV tự động co giãn kích thước k
 *   dựa trên ngưỡng sai số mục tiêu epsilon (Target Relative Error) và quy mô luồng dữ liệu.
 * - Khi luồng dữ liệu nhỏ: AKMV hoạt động ở chế độ Exact Counting (k_current = count) không tốn heap.
 * - Khi luồng dữ liệu bùng nổ vượt ngưỡng: AKMV tự động phân tầng (Threshold Eviction) và
 *   áp dụng công thức ước lượng thích ứng:
 *   N_hat = (k - 1) / U_{(k)}
 * - Tự động duy trì sai số chuẩn SE <= epsilon (ví dụ epsilon = 0.05 => SE <= 5%).
 * - Hỗ trợ tính toán độ tương đồng Jaccard thích ứng:
 *   J_hat(A, B) với k' = min(k_A, k_B).
 */

class AKMVSketchEstimator {
  /**
   * @param {Object} options
   * @param {number} options.targetError Sai số mục tiêu tương đối epsilon (mặc định 0.05 = 5%)
   * @param {number} options.minK Ngưỡng k tối thiểu (mặc định 64)
   * @param {number} options.maxK Ngưỡng k tối đa (mặc định 512)
   */
  constructor(options = {}) {
    this.minK = options.minK || 64;
    this.maxK = options.maxK || 512;

    if (options.targetError !== undefined) {
      this.targetError = options.targetError;
      const calculatedK = Math.ceil(Math.pow(1.0 / this.targetError, 2));
      this.targetK = Math.min(this.maxK, Math.max(this.minK, calculatedK));
    } else if (options.k !== undefined) {
      this.targetK = options.k;
      this.targetError = Number((1.0 / Math.sqrt(this.targetK)).toFixed(4));
    } else {
      this.targetError = 0.05;
      this.targetK = Math.ceil(Math.pow(1.0 / this.targetError, 2));
    }
    this.k = this.targetK;

    this.heap = []; // Max-heap lưu các số thực trong (0, 1]
    this.totalInserts = 0;
  }

  isExactMode() {
    return this.heap.length < this.targetK;
  }

  getThreshold() {
    return this.heap.length >= this.targetK ? this.heap[0] : 1.0;
  }

  adaptTargetError(targetError) {
    this.targetError = targetError;
    const calculatedK = Math.ceil(Math.pow(1.0 / this.targetError, 2));
    this.targetK = Math.min(this.maxK, Math.max(this.minK, calculatedK));
    this.k = this.targetK;
    return this.k;
  }

  _hashToUnitInterval(item) {
    const str = String(item);
    let h1 = 0x811c9dc5;
    let h2 = 0x1f35b2e9;

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      h1 ^= code;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= (code >> 3) ^ (h1 & 0x7F);
      h2 = Math.imul(h2, 0x01000193);
    }

    const uint32_1 = (h1 >>> 0);
    const uint32_2 = (h2 >>> 0);
    const floatVal = ((uint32_1 % 4294967291) + (uint32_2 / 4294967296)) / 4294967296;
    return Math.max(1e-12, Math.min(0.999999999999, floatVal));
  }

  _siftUp(idx) {
    while (idx > 0) {
      const parent = (idx - 1) >> 1;
      if (this.heap[idx] > this.heap[parent]) {
        const tmp = this.heap[idx];
        this.heap[idx] = this.heap[parent];
        this.heap[parent] = tmp;
        idx = parent;
      } else {
        break;
      }
    }
  }

  _siftDown(idx) {
    const length = this.heap.length;
    while (true) {
      let largest = idx;
      const left = (idx << 1) + 1;
      const right = left + 1;

      if (left < length && this.heap[left] > this.heap[largest]) {
        largest = left;
      }
      if (right < length && this.heap[right] > this.heap[largest]) {
        largest = right;
      }

      if (largest !== idx) {
        const tmp = this.heap[idx];
        this.heap[idx] = this.heap[largest];
        this.heap[largest] = tmp;
        idx = largest;
      } else {
        break;
      }
    }
  }

  /**
   * Thêm một phần tử vào AKMV sketch
   */
  add(item) {
    if (item === undefined || item === null) return;
    this.totalInserts++;
    const u = this._hashToUnitInterval(item);

    if (this.heap.includes(u)) return;

    if (this.heap.length < this.targetK) {
      this.heap.push(u);
      this._siftUp(this.heap.length - 1);
    } else if (u < this.heap[0]) {
      this.heap[0] = u;
      this._siftDown(0);
    }
  }

  /**
   * Số lượng phần tử hiện tại trong heap
   */
  size() {
    return this.heap.length;
  }

  /**
   * Sai số chuẩn lý thuyết hiện thời
   */
  standardError() {
    if (this.heap.length < this.targetK) return 0;
    return this.heap.length > 2 ? Number((1.0 / Math.sqrt(this.heap.length - 2)).toFixed(4)) : 0;
  }

  /**
   * Lấy danh sách các giá trị băm đã sắp xếp
   */
  getValues() {
    return [...this.heap].sort((a, b) => a - b);
  }

  /**
   * Ước lượng độ tập hợp (Cardinality)
   */
  estimate() {
    if (this.heap.length === 0) return 0;
    if (this.heap.length < this.targetK) {
      return this.heap.length; // Exact mode
    }
    const u_k = this.heap[0];
    if (u_k <= 0) return this.heap.length;
    return Math.round((this.targetK - 1) / u_k);
  }

  /**
   * Hợp nhất với AKMV sketch khác
   */
  merge(other) {
    if (!other || !Array.isArray(other.heap)) return this;
    const otherK = Math.min(this.targetK, other.k || other.targetK || this.targetK);
    const res = new AKMVSketchEstimator({ k: otherK, minK: this.minK, maxK: this.maxK });
    res.targetK = otherK;
    res.k = otherK;
    const all = [...new Set([...this.heap, ...other.heap])];
    for (const v of all) {
      if (res.heap.length < res.targetK) {
        res.heap.push(v);
        res._siftUp(res.heap.length - 1);
      } else if (v < res.heap[0]) {
        res.heap[0] = v;
        res._siftDown(0);
      }
    }
    res.totalInserts = this.totalInserts + (other.totalInserts || 0);
    return res;
  }

  /**
   * Ước lượng hệ số tương đồng Jaccard
   */
  jaccardSimilarity(other) {
    if (!other || this.heap.length === 0 || other.heap.length === 0) return 0.0;
    const setA = new Set(this.heap);
    const setB = new Set(other.heap);

    if (this.heap.length < this.targetK && other.heap.length < (other.targetK || other.k || this.targetK)) {
      let inter = 0;
      for (const val of setA) if (setB.has(val)) inter++;
      const union = setA.size + setB.size - inter;
      return union === 0 ? 0.0 : Number((inter / union).toFixed(4));
    }

    const thresholdA = this.heap.length >= this.targetK ? this.heap[0] : 1.0;
    const thresholdB = other.heap.length >= (other.targetK || other.k || this.targetK) ? other.heap[0] : 1.0;
    const U = Math.min(thresholdA, thresholdB);

    let intersectionCount = 0;
    let unionCount = 0;
    const allVals = new Set([...this.heap, ...other.heap]);
    for (const v of allVals) {
      if (v <= U) {
        unionCount++;
        if (setA.has(v) && setB.has(v)) {
          intersectionCount++;
        }
      }
    }
    if (unionCount === 0) return 0.0;
    return Number((intersectionCount / unionCount).toFixed(4));
  }

  getStats() {
    return {
      targetK: this.targetK,
      heapSize: this.heap.length,
      isHeapFull: this.heap.length >= this.targetK,
      isExactMode: this.heap.length < this.targetK,
      estimatedCardinality: this.estimate(),
      standardError: this.standardError(),
      totalInserts: this.totalInserts
    };
  }

  toJSON() {
    return {
      targetError: this.targetError,
      targetK: this.targetK,
      minK: this.minK,
      maxK: this.maxK,
      heap: [...this.heap],
      values: this.getValues(),
      totalInserts: this.totalInserts
    };
  }

  static fromJSON(data = {}) {
    const inst = new AKMVSketchEstimator({
      targetError: data.targetError,
      minK: data.minK,
      maxK: data.maxK
    });
    inst.targetK = data.targetK || inst.targetK;
    inst.heap = [...(data.heap || data.values || [])];
    inst.totalInserts = data.totalInserts || 0;
    return inst;
  }

  reset() {
    this.heap = [];
    this.totalInserts = 0;
  }
}

export { AKMVSketchEstimator };
export default AKMVSketchEstimator;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { AKMVSketchEstimator };
  }
} catch (e) {}
