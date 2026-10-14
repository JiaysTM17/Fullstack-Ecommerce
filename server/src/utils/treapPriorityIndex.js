/**
 * Treap (Cartesian Tree) for Dual Price-Priority Indexing & Dynamic Range Search
 * Cấu Trúc Dữ Liệu Lai Cây Tìm Kiếm Nhị Phân & Đống Cực Đại (Aragon & Seidel 1989)
 * 
 * Ứng dụng TMĐT:
 * - Chỉ mục 2 chiều kết hợp: Sắp xếp theo Khóa Giá Bán (Key BST) và Điểm Tài Trợ / Flash Sale (Priority Max-Heap).
 * - Hỗ trợ lọc khoảng giá [minPrice, maxPrice] đồng thời tự động đưa sản phẩm có điểm tài trợ cao nhất lên đỉnh.
 * - Các thao tác Insert, Delete, Search đạt thời gian kỳ vọng O(log N) với tính cân bằng ngẫu nhiên tự nhiên.
 */

export class TreapNode {
  constructor(key, priority, value) {
    this.key = key;          // Giá bán hoặc mã số định danh (BST Key)
    this.priority = priority ?? Math.random(); // Điểm tài trợ / Sales priority (Max-Heap Priority)
    this.value = value;      // Metadata sản phẩm
    this.left = null;
    this.right = null;
    this.size = 1;
  }
}

export class TreapPriorityIndex {
  constructor() {
    this.root = null;
  }

  /**
   * Cập nhật kích thước của cây con
   * @private
   */
  _size(node) {
    return node ? node.size : 0;
  }

  _update(node) {
    if (node) {
      node.size = 1 + this._size(node.left) + this._size(node.right);
    }
  }

  /**
   * Phép xoay phải (Right Rotation)
   * @private
   */
  _rotateRight(y) {
    const x = y.left;
    if (!x) return y;
    y.left = x.right;
    x.right = y;
    this._update(y);
    this._update(x);
    return x;
  }

  /**
   * Phép xoay trái (Left Rotation)
   * @private
   */
  _rotateLeft(x) {
    const y = x.right;
    if (!y) return x;
    x.right = y.left;
    y.left = x;
    this._update(x);
    this._update(y);
    return y;
  }

  /**
   * Thêm một phần tử vào Treap
   * @param {number|string} key - Khóa giá bán
   * @param {number} priority - Điểm tài trợ quảng cáo / Flash Sale
   * @param {*} value - Thông tin chi tiết sản phẩm
   */
  insert(key, priority, value) {
    const prio = typeof priority === 'number' ? priority : Math.random();

    const insertNode = (node, k, p, val) => {
      if (!node) {
        return new TreapNode(k, p, val);
      }

      if (k === node.key) {
        // Cập nhật giá trị và ưu tiên
        node.value = val;
        node.priority = p;
        return node;
      }

      if (k < node.key) {
        node.left = insertNode(node.left, k, p, val);
        // Kiểm tra thuộc tính Max-Heap
        if (node.left.priority > node.priority) {
          node = this._rotateRight(node);
        }
      } else {
        node.right = insertNode(node.right, k, p, val);
        // Kiểm tra thuộc tính Max-Heap
        if (node.right.priority > node.priority) {
          node = this._rotateLeft(node);
        }
      }

      this._update(node);
      return node;
    };

    this.root = insertNode(this.root, key, prio, value);
  }

  /**
   * Tìm kiếm theo khóa
   * @param {number|string} key
   * @returns {*} Giá trị value hoặc null
   */
  search(key) {
    let curr = this.root;
    while (curr) {
      if (key === curr.key) return curr.value;
      if (key < curr.key) curr = curr.left;
      else curr = curr.right;
    }
    return null;
  }

  /**
   * Xóa một phần tử theo khóa
   * @param {number|string} key
   * @returns {boolean} true nếu xóa thành công
   */
  delete(key) {
    let found = false;

    const deleteNode = (node, k) => {
      if (!node) return null;

      if (k < node.key) {
        node.left = deleteNode(node.left, k);
      } else if (k > node.key) {
        node.right = deleteNode(node.right, k);
      } else {
        found = true;
        // Đã tìm thấy nút cần xóa
        if (!node.left) return node.right;
        if (!node.right) return node.left;

        // Cả 2 con đều tồn tại: Xoay nút con có priority lớn hơn lên trên
        if (node.left.priority > node.right.priority) {
          node = this._rotateRight(node);
          node.right = deleteNode(node.right, k);
        } else {
          node = this._rotateLeft(node);
          node.left = deleteNode(node.left, k);
        }
      }

      this._update(node);
      return node;
    };

    this.root = deleteNode(this.root, key);
    return found;
  }

  /**
   * Truy vấn khoảng giá [minKey, maxKey] kết hợp sắp xếp ưu tiên giảm dần
   * @param {number} minKey - Mức giá thấp nhất
   * @param {number} maxKey - Mức giá cao nhất
   * @returns {Array<Object>} Danh sách các sản phẩm trong khoảng giá
   */
  rangeQuery(minKey, maxKey) {
    const results = [];

    const traverse = (node) => {
      if (!node) return;

      if (node.key >= minKey) {
        traverse(node.left);
      }

      if (node.key >= minKey && node.key <= maxKey) {
        results.push({
          key: node.key,
          priority: node.priority,
          value: node.value
        });
      }

      if (node.key <= maxKey) {
        traverse(node.right);
      }
    };

    traverse(this.root);
    // Sắp xếp các kết quả theo thứ tự điểm ưu tiên priority giảm dần
    results.sort((a, b) => b.priority - a.priority);
    return results;
  }

  /**
   * Lấy sản phẩm có điểm tài trợ / ưu tiên cao nhất toàn bộ cây
   * @returns {Object|null}
   */
  getMaxPriorityItem() {
    if (!this.root) return null;
    return {
      key: this.root.key,
      priority: this.root.priority,
      value: this.root.value
    };
  }

  /**
   * Số lượng phần tử trong Treap
   */
  size() {
    return this._size(this.root);
  }

  /**
   * Xóa toàn bộ cây
   */
  clear() {
    this.root = null;
  }
}

export default TreapPriorityIndex;
