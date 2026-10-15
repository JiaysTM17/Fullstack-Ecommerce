/**
 * K-Minimum Values (KMV) Sketch & Set Similarity Estimator
 * (Ziv Bar-Yossef, T.S. Jayram, Ravi Kumar, D. Sivakumar, JCSS 2002 / Kevin Beyer et al., ACM SIGMOD 2007)
 * 
 * Thuật toán Ước Lượng Độ Tập Hợp & Độ Tương Đồng Tập Hợp Bằng K Giá Trị Nhỏ Nhất
 * 
 * Đột phá:
 * - Thay vì lưu trữ toàn bộ ID khách hàng (gây tốn hàng chục MB RAM), KMV chuẩn hóa giá trị băm
 *   vào đoạn [0, 1) và duy trì đúng k giá trị nhỏ nhất bằng cấu trúc Max-Heap.
 * - Ước lượng độ tập hợp không thiên lệch:
 *   N_hat = (k - 1) / U_{(k)}  với U_{(k)} là giá trị băm thứ k trong heap.
 * - Sai số tương đối chuẩn:
 *   SE ~ 1 / sqrt(k - 2)
 * - Khả năng hợp nhất hoàn hảo (Mergeable Synopsis): Hợp nhất 2 sketch A và B bằng cách lấy k giá trị nhỏ nhất của (KMV_A U KMV_B).
 * - Ước lượng hệ số tương đồng Jaccard giữa hai luồng truy cập mà không cần dữ liệu gốc:
 *   J_hat(A, B) = |KMV(A U B) ∩ KMV(A) ∩ KMV(B)| / k
 * - Thích hợp phân tích trùng lặp khách hàng giữa các Flash Sale và shop đối thủ.
 */

class KMVSketchEstimator {
  /**
   * @param {Object} options
   * @param {number} options.k Số lượng phần tử nhỏ nhất cần lưu (mặc định k = 128 => SE ~ 8.9%)
   */
  constructor(options = {}) {
    this.k = options.k || 128;
    this.heap = []; // Max-heap lưu trữ các số thực trong đoạn (0, 1]
    this.totalInserts = 0;
  }

  /**
   * Hàm băm 64-bit FNV-1a tạo số thực chuẩn hóa u in (0, 1]
   * @param {string|number} item 
   * @returns {number} Giá trị thực chuẩn hóa trong (0, 1]
   */
  _hashToUnitInterval(item) {
    const str = String(item);
    let h1 = 0x811c9dc5;
    let h2 = 0x27d4eb2f;

    for (let i = 0; i < str.length; i++) {
      const code = str.charCodeAt(i);
      h1 ^= code;
      h1 = Math.imul(h1, 0x01000193);
      h2 ^= (code >> 4) ^ (h1 & 0xFF);
      h2 = Math.imul(h2, 0x01000193);
    }

    // Kết hợp 2 số 32-bit thành số thực dương trong (0, 1]
    const uint32_1 = (h1 >>> 0);
    const uint32_2 = (h2 >>> 0);
    const floatVal = ((uint32_1 % 4294967291) + (uint32_2 / 4294967296)) / 4294967296;
    return Math.max(1e-12, Math.min(0.999999999999, floatVal));
  }

  // Max-Heap operations
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
   * Thêm một phần tử vào KMV sketch
   * @param {string|number} item 
   */
  add(item) {
    if (item === undefined || item === null) return;
    this.totalInserts++;
    const u = this._hashToUnitInterval(item);

    // Kiểm tra xem u đã tồn tại trong heap chưa (chống trùng lặp giá trị băm)
    if (this.heap.includes(u)) return;

    if (this.heap.length < this.k) {
      this.heap.push(u);
      this._siftUp(this.heap.length - 1);
    } else if (u < this.heap[0]) {
      // Thay thế phần tử lớn nhất bằng u
      this.heap[0] = u;
      this._siftDown(0);
    }
  }

  /**
   * Ước lượng độ tập hợp (Cardinality)
   * N_hat = (k - 1) / U_{(k)} khi heap đầy, hoặc heap.length khi chưa đầy
   * @returns {number} Số lượng phần tử duy nhất ước tính
   */
  estimate() {
    if (this.heap.length === 0) return 0;
    if (this.heap.length < this.k) {
      return this.heap.length;
    }
    const u_k = this.heap[0]; // Giá trị băm lớn nhất trong heap (tức giá trị thứ k nhỏ nhất)
    if (u_k <= 0) return this.heap.length;
    const est = (this.k - 1) / u_k;
    return Math.round(est);
  }

  /**
   * Hợp nhất với một KMV Sketch khác
   * @param {KMVSketchEstimator} other 
   */
  merge(other) {
    if (!other || !Array.isArray(other.heap)) return;
    for (const val of other.heap) {
      if (this.heap.includes(val)) continue;
      if (this.heap.length < this.k) {
        this.heap.push(val);
        this._siftUp(this.heap.length - 1);
      } else if (val < this.heap[0]) {
        this.heap[0] = val;
        this._siftDown(0);
      }
    }
    this.totalInserts += other.totalInserts;
    return this;
  }

  /**
   * Số lượng phần tử hiện tại trong heap
   */
  size() {
    return this.heap.length;
  }

  /**
   * Sai số chuẩn lý thuyết
   */
  standardError() {
    return this.k > 2 ? Number((1.0 / Math.sqrt(this.k - 2)).toFixed(4)) : 1.0;
  }

  /**
   * Lấy danh sách các giá trị băm đã sắp xếp
   */
  getValues() {
    return [...this.heap].sort((a, b) => a - b);
  }

  /**
   * Alias cho estimateJaccard
   */
  jaccardSimilarity(other) {
    return this.estimateJaccard(other);
  }

  /**
   * Xuất dữ liệu sketch sang định dạng JSON
   */
  toJSON() {
    return {
      k: this.k,
      heap: [...this.heap],
      values: [...this.heap].sort((a, b) => a - b),
      totalInserts: this.totalInserts
    };
  }

  /**
   * Khôi phục sketch từ đối tượng JSON
   */
  static fromJSON(data = {}) {
    const inst = new KMVSketchEstimator({ k: data.k || 128 });
    inst.heap = [...(data.heap || data.values || [])];
    inst.totalInserts = data.totalInserts || 0;
    return inst;
  }

  /**
   * Ước tính hệ số tương đồng Jaccard giữa tập này và tập khác
   * J_hat = |KMV(A U B) ∩ KMV(A) ∩ KMV(B)| / k
   * @param {KMVSketchEstimator} other 
   * @returns {number} Hệ số tương đồng Jaccard trong [0.0, 1.0]
   */
  estimateJaccard(other) {
    if (!other || this.heap.length === 0 || other.heap.length === 0) return 0.0;
    
    // Tạo union sketch
    const unionValues = new Set([...this.heap, ...other.heap]);
    const sortedUnion = Array.from(unionValues).sort((a, b) => a - b);
    const kPrime = Math.min(this.k, sortedUnion.length);
    if (kPrime === 0) return 0.0;

    const topKUnion = new Set(sortedUnion.slice(0, kPrime));
    const setA = new Set(this.heap);
    const setB = new Set(other.heap);

    let intersectionCount = 0;
    for (const val of topKUnion) {
      if (setA.has(val) && setB.has(val)) {
        intersectionCount++;
      }
    }

    const jaccard = intersectionCount / kPrime;
    return Number(Math.min(1.0, Math.max(0.0, jaccard)).toFixed(4));
  }

  /**
   * Trả về thống kê bộ nhớ và sai số lý thuyết
   */
  getStats() {
    const memoryBytes = this.k * 8; // Float64Array tương đương
    const standardError = this.k > 2 ? Number((1.0 / Math.sqrt(this.k - 2)).toFixed(4)) : 1.0;
    return {
      k: this.k,
      heapSize: this.heap.length,
      isHeapFull: this.heap.length >= this.k,
      uKValue: this.heap.length > 0 ? Number(this.heap[0].toFixed(8)) : 1.0,
      estimatedCardinality: this.estimate(),
      totalInserts: this.totalInserts,
      memoryBytes,
      standardError
    };
  }

  reset() {
    this.heap = [];
    this.totalInserts = 0;
  }
}

export { KMVSketchEstimator };
export default KMVSketchEstimator;

try {
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { KMVSketchEstimator };
  }
} catch (e) {}
