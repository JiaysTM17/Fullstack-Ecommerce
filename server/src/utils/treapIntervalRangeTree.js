/**
 * treapIntervalRangeTree.js - Cây Treap Khoảng Giá (Interval Treap) Bắn Cảnh Báo Giảm Giá Flash Sale
 * 
 * NGUYÊN LÝ TOÁN HỌC & CẤU TRÚC CÂY KHOẢNG (INTERVAL TREAP):
 * 1. Cấu trúc Interval Treap:
 *    - Mỗi nút đại diện cho một khoảng giá cảnh báo [low, high] mà người mua đăng ký:
 *      • BST Key: low (cận dưới khoảng giá).
 *      • Heap Priority: Giá trị ưu tiên ngẫu nhiên duy trì Max-Heap cân bằng O(log N).
 *      • Thuộc tính mở rộng (Augmented Property): maxHigh = max(high, left.maxHigh, right.maxHigh).
 * 2. Tìm kiếm các khoảng chồng lấn (Overlapping Query):
 *    - Cho một mức giá Flash Sale [qLow, qHigh], tìm TẤT CẢ các cảnh báo của khách hàng có khoảng giá giao nhau.
 *    - Thuật toán cắt tỉa thông minh:
 *      • Nếu left.maxHigh >= qLow: Nhánh trái chắc chắn có thể chứa khoảng giao nhau -> duyệt trái.
 *      • Kiểm tra nút hiện tại: Nếu low <= qHigh && qLow <= high -> ghi nhận kết quả.
 *      • Nếu low <= qHigh: Duyệt sang nhánh phải.
 *    - Độ phức tạp tối ưu: O(log N + K) với K là số lượng cảnh báo thỏa mãn!
 */

export class IntervalNode {
  constructor(low, high, data = {}, priority = Math.random()) {
    this.low = Number(low);
    this.high = Number(high);
    this.data = data;
    this.priority = priority;
    this.maxHigh = this.high;
    this.left = null;
    this.right = null;
  }
}

export class TreapIntervalRangeTree {
  constructor() {
    this.root = null;
    this._size = 0;
  }

  size() {
    return this._size;
  }

  isEmpty() {
    return this._size === 0;
  }

  _getMaxHigh(node) {
    return node ? node.maxHigh : -Infinity;
  }

  _updateMaxHigh(node) {
    if (!node) return;
    node.maxHigh = Math.max(
      node.high,
      this._getMaxHigh(node.left),
      this._getMaxHigh(node.right)
    );
  }

  _rotateRight(y) {
    const x = y.left;
    y.left = x.right;
    x.right = y;
    this._updateMaxHigh(y);
    this._updateMaxHigh(x);
    return x;
  }

  _rotateLeft(x) {
    const y = x.right;
    x.right = y.left;
    y.left = x;
    this._updateMaxHigh(x);
    this._updateMaxHigh(y);
    return y;
  }

  /**
   * Đăng ký một khoảng cảnh báo giá [low, high]
   * @param {number} low - Cận dưới (ví dụ: giá sàn mong muốn)
   * @param {number} high - Cận trên (ví dụ: ngân sách tối đa)
   * @param {Object} [data={}] - Dữ liệu kèm theo (userId, alertId, skuId)
   * @param {number} [priority] - Độ ưu tiên tùy chọn (dùng cho test)
   */
  insert(low, high, data = {}, priority = Math.random()) {
    const l = Math.min(Number(low), Number(high));
    const h = Math.max(Number(low), Number(high));
    const newNode = new IntervalNode(l, h, data, priority);

    const insertNode = (node) => {
      if (!node) {
        this._size++;
        return newNode;
      }

      if (l < node.low || (l === node.low && h < node.high)) {
        node.left = insertNode(node.left);
        if (node.left.priority > node.priority) {
          node = this._rotateRight(node);
        }
      } else {
        node.right = insertNode(node.right);
        if (node.right.priority > node.priority) {
          node = this._rotateLeft(node);
        }
      }

      this._updateMaxHigh(node);
      return node;
    };

    this.root = insertNode(this.root);
  }

  /**
   * Truy vấn toàn bộ các khoảng cảnh báo có giao nhau với [qLow, qHigh]
   * @param {number} qLow - Giá bắt đầu
   * @param {number} qHigh - Giá kết thúc (hoặc cùng giá qLow nếu là điểm đơn)
   * @returns {Array<{ low: number, high: number, data: Object }>}
   */
  queryOverlapping(qLow, qHigh = qLow) {
    const minQ = Math.min(Number(qLow), Number(qHigh));
    const maxQ = Math.max(Number(qLow), Number(qHigh));
    const results = [];

    const search = (node) => {
      if (!node) return;

      // 1. Cắt tỉa: Nếu nhánh trái có maxHigh >= minQ, có thể có khoảng giao nhau
      if (node.left && node.left.maxHigh >= minQ) {
        search(node.left);
      }

      // 2. Kiểm tra khoảng của nút hiện tại: [node.low, node.high] giao [minQ, maxQ]
      if (node.low <= maxQ && minQ <= node.high) {
        results.push({
          low: node.low,
          high: node.high,
          data: node.data
        });
      }

      // 3. Nếu node.low <= maxQ, nhánh phải có thể chứa khoảng giao nhau
      if (node.low <= maxQ && node.right) {
        search(node.right);
      }
    };

    search(this.root);
    return results;
  }

  /**
   * Xóa toàn bộ cây
   */
  clear() {
    this.root = null;
    this._size = 0;
  }
}

export default TreapIntervalRangeTree;
