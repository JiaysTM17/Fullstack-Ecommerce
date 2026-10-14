/**
 * Splay Tree for Self-Adjusting Hot Products Cache & Recent Search Queries
 * Thuật Toán Cây Tự Điều Chỉnh Sleator & Tarjan (1985)
 * 
 * Ứng dụng TMĐT:
 * - Tự động đẩy các sản phẩm hot, flash sale deal hoặc từ khóa tìm kiếm thường xuyên lên Gốc (Root)
 *   qua các phép xoay Zig, Zig-Zig, Zig-Zag.
 * - Thao tác truy xuất các sản phẩm truy cập liên tục đạt O(1), thời gian khấu hao tổng thể O(log N).
 * - Tự động thích ứng với biến động nhu cầu thời gian thực mà không cần cấu hình thủ công.
 */

export class SplayNode {
  constructor(key, value, score = 1) {
    this.key = key;
    this.value = value;
    this.score = score; // Tần suất truy cập hoặc điểm hot
    this.accessCount = 1;
    this.lastAccessed = Date.now();
    this.left = null;
    this.right = null;
    this.parent = null;
  }
}

export class SplayTreeHotCache {
  /**
   * @param {Object} [options]
   * @param {number} [options.maxSize=1000] - Dung lượng bộ đệm tối đa
   */
  constructor(options = {}) {
    this.root = null;
    this.size = 0;
    this.maxSize = Math.max(1, options.maxSize || 1000);
    this.totalAccesses = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }

  /**
   * Phép xoay phải (Right Rotation / Zig)
   * @private
   */
  _rotateRight(x) {
    const y = x.left;
    if (!y) return;

    x.left = y.right;
    if (y.right) {
      y.right.parent = x;
    }

    y.parent = x.parent;
    if (!x.parent) {
      this.root = y;
    } else if (x === x.parent.right) {
      x.parent.right = y;
    } else {
      x.parent.left = y;
    }

    y.right = x;
    x.parent = y;
  }

  /**
   * Phép xoay trái (Left Rotation / Zag)
   * @private
   */
  _rotateLeft(x) {
    const y = x.right;
    if (!y) return;

    x.right = y.left;
    if (y.left) {
      y.left.parent = x;
    }

    y.parent = x.parent;
    if (!x.parent) {
      this.root = y;
    } else if (x === x.parent.left) {
      x.parent.left = y;
    } else {
      x.parent.right = y;
    }

    y.left = x;
    x.parent = y;
  }

  /**
   * Phép Splay: Đẩy nút x lên làm Gốc của cây qua các phép xoay tương ứng
   * @private
   */
  _splay(x) {
    if (!x) return;

    while (x.parent) {
      const p = x.parent;
      const g = p.parent;

      if (!g) {
        // Zig bước đơn (khi cha là Root)
        if (x === p.left) {
          this._rotateRight(p);
        } else {
          this._rotateLeft(p);
        }
      } else {
        if (x === p.left && p === g.left) {
          // Zig-Zig cùng hướng trái
          this._rotateRight(g);
          this._rotateRight(p);
        } else if (x === p.right && p === g.right) {
          // Zag-Zag cùng hướng phải
          this._rotateLeft(g);
          this._rotateLeft(p);
        } else if (x === p.right && p === g.left) {
          // Zig-Zag đổi hướng
          this._rotateLeft(p);
          this._rotateRight(g);
        } else {
          // Zag-Zig đổi hướng
          this._rotateRight(p);
          this._rotateLeft(g);
        }
      }
    }
  }

  /**
   * So sánh 2 khóa (hỗ trợ chuỗi hoặc số)
   * @private
   */
  _compare(a, b) {
    if (a < b) return -1;
    if (a > b) return 1;
    return 0;
  }

  /**
   * Thêm hoặc cập nhật một mục trong Splay Tree
   * @param {string|number} key - Mã sản phẩm hoặc từ khóa
   * @param {*} value - Dữ liệu chi tiết sản phẩm / metadata
   * @param {number} [score=1] - Điểm khởi tạo
   */
  put(key, value, score = 1) {
    if (key === undefined || key === null) return null;

    if (!this.root) {
      this.root = new SplayNode(key, value, score);
      this.size++;
      return this.root;
    }

    let curr = this.root;
    let parent = null;
    let cmp = 0;

    while (curr) {
      parent = curr;
      cmp = this._compare(key, curr.key);
      if (cmp === 0) {
        // Khóa đã tồn tại: Cập nhật giá trị, tăng điểm và đưa lên root
        curr.value = value;
        curr.score += score;
        curr.accessCount++;
        curr.lastAccessed = Date.now();
        this._splay(curr);
        return curr;
      } else if (cmp < 0) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }

    const newNode = new SplayNode(key, value, score);
    newNode.parent = parent;
    if (cmp < 0) {
      parent.left = newNode;
    } else {
      parent.right = newNode;
    }

    this.size++;
    this._splay(newNode);

    // Kiểm tra giới hạn dung lượng: nếu vượt quá maxSize thì cắt tỉa nút ít truy cập nhất
    if (this.size > this.maxSize) {
      this._evictColdest();
    }

    return newNode;
  }

  /**
   * Tìm kiếm và đưa nút tìm thấy lên làm Root (Splay Access)
   * @param {string|number} key
   * @returns {*} Giá trị value hoặc null nếu không tồn tại
   */
  get(key) {
    this.totalAccesses++;
    if (!this.root || key === undefined || key === null) {
      this.cacheMisses++;
      return null;
    }

    let curr = this.root;
    let lastVisited = null;

    while (curr) {
      lastVisited = curr;
      const cmp = this._compare(key, curr.key);
      if (cmp === 0) {
        curr.accessCount++;
        curr.lastAccessed = Date.now();
        this._splay(curr);
        this.cacheHits++;
        return curr.value;
      } else if (cmp < 0) {
        curr = curr.left;
      } else {
        curr = curr.right;
      }
    }

    // Nếu không tìm thấy, splay nút gần nhất được duyệt
    if (lastVisited) {
      this._splay(lastVisited);
    }
    this.cacheMisses++;
    return null;
  }

  /**
   * Xóa một khóa khỏi cây
   * @param {string|number} key
   * @returns {boolean} true nếu xóa thành công
   */
  delete(key) {
    if (!this.root) return false;

    // Splay khóa cần xóa lên root
    this.get(key);
    if (this.root.key !== key) {
      return false; // Không tìm thấy
    }

    const leftSubtree = this.root.left;
    const rightSubtree = this.root.right;

    if (!leftSubtree) {
      this.root = rightSubtree;
      if (this.root) this.root.parent = null;
    } else {
      leftSubtree.parent = null;
      // Tìm phần tử lớn nhất bên cây con trái để làm root mới
      let maxLeft = leftSubtree;
      while (maxLeft.right) {
        maxLeft = maxLeft.right;
      }
      // Splay phần tử lớn nhất lên làm root của cây trái
      this._splaySubtree(maxLeft, leftSubtree);
      maxLeft.right = rightSubtree;
      if (rightSubtree) rightSubtree.parent = maxLeft;
      this.root = maxLeft;
    }

    this.size--;
    return true;
  }

  /**
   * Splay trên cây con độc lập
   * @private
   */
  _splaySubtree(x, subRoot) {
    while (x !== subRoot) {
      const p = x.parent;
      if (p === subRoot) {
        if (x === p.left) this._rotateRight(p);
        else this._rotateLeft(p);
        break;
      }
      const g = p.parent;
      if (x === p.left && p === g.left) {
        this._rotateRight(g);
        this._rotateRight(p);
      } else if (x === p.right && p === g.right) {
        this._rotateLeft(g);
        this._rotateLeft(p);
      } else if (x === p.right && p === g.left) {
        this._rotateLeft(p);
        this._rotateRight(g);
      } else {
        this._rotateRight(p);
        this._rotateLeft(g);
      }
    }
  }

  /**
   * Tự động loại bỏ nút lạnh nhất (ít truy cập và lâu nhất không đụng tới)
   * @private
   */
  _evictColdest() {
    let coldest = null;

    const traverse = (node) => {
      if (!node) return;
      if (!coldest ||
          node.score < coldest.score ||
          (node.score === coldest.score && node.accessCount < coldest.accessCount) ||
          (node.score === coldest.score && node.accessCount === coldest.accessCount && String(node.key) < String(coldest.key))) {
        coldest = node;
      }
      traverse(node.left);
      traverse(node.right);
    };

    traverse(this.root);
    if (coldest) {
      this.delete(coldest.key);
    }
  }

  /**
   * Lấy Top K sản phẩm hot nhất theo tần suất truy cập / điểm số
   * @param {number} [limit=10]
   * @returns {Array<Object>}
   */
  getTopHotItems(limit = 10) {
    const items = [];
    const traverse = (node) => {
      if (!node) return;
      traverse(node.left);
      items.push({
        key: node.key,
        value: node.value,
        score: node.score,
        accessCount: node.accessCount,
        lastAccessed: node.lastAccessed
      });
      traverse(node.right);
    };

    traverse(this.root);
    items.sort((a, b) => b.score !== a.score ? b.score - a.score : b.accessCount - a.accessCount);
    return items.slice(0, limit);
  }

  /**
   * Thống kê hiệu suất bộ đệm Splay Tree
   */
  getStats() {
    const hitRate = this.totalAccesses > 0
      ? Number(((this.cacheHits / this.totalAccesses) * 100).toFixed(2))
      : 0;

    return {
      size: this.size,
      maxSize: this.maxSize,
      rootKey: this.root ? this.root.key : null,
      totalAccesses: this.totalAccesses,
      cacheHits: this.cacheHits,
      cacheMisses: this.cacheMisses,
      hitRatePercent: hitRate
    };
  }

  /**
   * Xóa toàn bộ cây
   */
  clear() {
    this.root = null;
    this.size = 0;
    this.totalAccesses = 0;
    this.cacheHits = 0;
    this.cacheMisses = 0;
  }
}

export default SplayTreeHotCache;
