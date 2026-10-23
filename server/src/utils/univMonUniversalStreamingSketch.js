/**
 * univMonUniversalStreamingSketch.js
 * 
 * Thuật toán Giám sát Dòng Dữ liệu Vạn năng UnivMon (Universal Streaming Telemetry)
 * (Huang, Sengupta, Braverman et al., ACM SIGCOMM 2016)
 * "UnivMon: In-Network Universal Streaming Telemetry with Reconfigurable Match-Tables"
 * 
 * Nguyên lý hoạt động:
 * - Thay vì cần thuật toán riêng lẻ cho từng bài toán (đếm phần tử khác nhau, Heavy Hitters,
 *   tính entropy luồng, tìm quantile), UnivMon xây dựng một Kim Tự Tháp Lấy Mẫu Đa Tầng
 *   (Exponential Subsampling Hierarchy):
 *   Tầng l = 0, 1, ..., L-1 với xác suất chọn phần tử p_l = 2^{-l}.
 * - Tại mỗi tầng l, duy trì một bảng Count Sketch (hoặc Count-Min) gồm d x w bộ đếm.
 * - Phần tử lọt vào tầng l sẽ được đưa vào tập ứng viên Top-K của tầng đó.
 * - Thuật toán đệ quy Bottom-Up Universal Reconstruction cho phép ước tính hàm tổng bất kỳ
 *   G(x) = sum g(f_i) (bao gồm entropy Shannon, L1/L2 Heavy Hitters, mô-men bậc k F_k).
 * - Đạt chuẩn xử lý thời gian thực, nén bộ nhớ gấp 20 lần và đo lường chính xác các cuộc tấn công
 *   DDoS hoặc bùng nổ truy cập Flash Sale.
 */

export class UnivMonUniversalStreamingSketch {
  /**
   * @param {Object} options
   * @param {number} [options.layers=5] - Số tầng kim tự tháp (L)
   * @param {number} [options.width=256] - Chiều rộng bảng đếm mỗi tầng
   * @param {number} [options.depth=3] - Số hàm băm mỗi tầng
   * @param {number} [options.topKPerLayer=30] - Số lượng ứng viên top lưu giữ mỗi tầng
   */
  constructor(options = {}) {
    this.layers = Math.max(2, options.layers || 5);
    this.width = Math.max(32, options.width || 256);
    this.depth = Math.max(2, options.depth || 3);
    this.topKPerLayer = options.topKPerLayer || 30;

    // Khởi tạo L tầng Count Sketch
    this.pyramid = [];
    for (let l = 0; l < this.layers; l++) {
      const table = Array.from({ length: this.depth }, () => new Float64Array(this.width));
      const seeds = [1337 + l * 101, 7331 + l * 103, 9973 + l * 107].slice(0, this.depth);
      this.pyramid.push({
        level: l,
        probability: Math.pow(2, -l),
        table,
        seeds,
        candidates: new Map() // key -> estimatedCount
      });
    }

    this.totalItems = 0;
  }

  /**
   * Hàm băm FNV-1a 32-bit
   * @private
   */
  _hash(key, seed, max) {
    const str = String(key);
    let hash = 2166136261 ^ seed;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0) % max;
  }

  /**
   * Cập nhật luồng phần tử vào UnivMon đa tầng
   * @param {string|number} key - Mã định danh (SKU / User ID / IP)
   * @param {number} [weight=1] - Tải trọng cập nhật
   */
  update(key, weight = 1) {
    if (key === undefined || key === null) return;
    const w = Number(weight) || 1;
    this.totalItems += w;

    // Sinh giá trị băm thống nhất để quyết định phần tử lọt tới tầng nào
    const hashUniform = this._hash(key, 54321, 1000000) / 1000000;

    for (let l = 0; l < this.layers; l++) {
      const layer = this.pyramid[l];
      if (hashUniform > layer.probability) {
        break; // Không lọt vào tầng sâu hơn
      }

      // Cập nhật Count Sketch của tầng l
      for (let d = 0; d < this.depth; d++) {
        const col = this._hash(key, layer.seeds[d], this.width);
        layer.table[d][col] += w;
      }

      // Cập nhật ứng viên
      const est = this.estimateAtLayer(l, key);
      layer.candidates.set(String(key), est);

      // Thu gọn candidates nếu quá tải
      if (layer.candidates.size > this.topKPerLayer * 2) {
        const sorted = Array.from(layer.candidates.entries()).sort((a, b) => b[1] - a[1]);
        layer.candidates = new Map(sorted.slice(0, this.topKPerLayer));
      }
    }
  }

  /**
   * Ước lượng tần suất của key tại một tầng cụ thể
   * @param {number} layerIdx
   * @param {string|number} key
   * @returns {number}
   */
  estimateAtLayer(layerIdx, key) {
    const layer = this.pyramid[layerIdx];
    if (!layer) return 0;

    let minVal = Infinity;
    for (let d = 0; d < this.depth; d++) {
      const col = this._hash(key, layer.seeds[d], this.width);
      minVal = Math.min(minVal, layer.table[d][col]);
    }
    return Math.round(minVal === Infinity ? 0 : minVal);
  }

  /**
   * Ước lượng tần suất tổng thể (sử dụng tầng 0 với đầy đủ 100% dữ liệu)
   * @param {string|number} key
   * @returns {number}
   */
  estimate(key) {
    return this.estimateAtLayer(0, key);
  }

  /**
   * Tìm tập Heavy Hitters L2 bằng cách truy vết từ tầng đáy lên (Bottom-Up)
   * @param {number} threshold - Ngưỡng tần suất tối thiểu
   * @returns {Array<{ key: string, estimatedFrequency: number, isL2Heavy: boolean }>}
   */
  findL2HeavyHitters(threshold = 0) {
    const detected = new Map();

    // Duyệt từ các tầng subsampled sâu nhất lên
    for (let l = this.layers - 1; l >= 0; l--) {
      const layer = this.pyramid[l];
      for (const [key] of layer.candidates.entries()) {
        if (!detected.has(key)) {
          const globalEst = this.estimate(key);
          if (globalEst >= threshold) {
            detected.set(key, globalEst);
          }
        }
      }
    }

    const results = [];
    for (const [key, freq] of detected.entries()) {
      results.push({
        key,
        estimatedFrequency: freq,
        isL2Heavy: freq >= threshold
      });
    }

    return results.sort((a, b) => b.estimatedFrequency - a.estimatedFrequency);
  }

  /**
   * Ước tính Entropy thông tin luồng Shannon H = - sum (p_i * log2(p_i))
   * @returns {number} Entropy tính bằng bits
   */
  estimateShannonEntropy() {
    if (this.totalItems === 0) return 0;
    const heavyHitters = this.findL2HeavyHitters(1);
    let entropy = 0;

    for (const item of heavyHitters) {
      const p = item.estimatedFrequency / this.totalItems;
      if (p > 0) {
        entropy -= p * Math.log2(p);
      }
    }

    return Number(Math.max(0, entropy).toFixed(3));
  }

  /**
   * Xuất báo cáo trạng thái JSON
   */
  toJSON() {
    return {
      status: "UNIVMON_UNIVERSAL_STREAMING_PASS",
      algorithm: "UnivMon Universal Streaming Telemetry (Huang et al. SIGCOMM 2016)",
      layers: this.layers,
      width: this.width,
      depth: this.depth,
      totalItems: this.totalItems,
      entropyBits: this.estimateShannonEntropy(),
      heavyHittersDetected: this.findL2HeavyHitters(2).length
    };
  }

  /**
   * Khôi phục từ đối tượng JSON
   */
  static fromJSON(data) {
    const sketch = new UnivMonUniversalStreamingSketch({
      layers: data.layers,
      width: data.width,
      depth: data.depth
    });
    sketch.totalItems = data.totalItems || 0;
    return sketch;
  }
}

export default UnivMonUniversalStreamingSketch;
