/**
 * Probabilistic Skiplist (Danh Sách Nhảy Đa Tầng) - Flash Sale Dynamic Price Range Index
 * 
 * Vấn đề:
 * Trong sự kiện Flash Sale với hàng chục nghìn sản phẩm giảm giá chớp nhoáng:
 * 1. Người mua thường xuyên lọc theo các khoảng giá (ví dụ: "Deal dưới 50.000₫", "Deal từ 100k - 200k").
 * 2. Nếu dùng mảng thông thường Array.filter().sort(), mỗi lượt click tốn O(N log N) thời gian,
 *    gây nghẽn CPU khi hàng triệu lượt truy vấn diễn ra đồng thời.
 * 3. Nếu dùng Balanced BST (Cây đỏ-đen / AVL), việc cân bằng lại cây khi cập nhật giá gây locking phức tạp.
 * 
 * Giải pháp: Cấu trúc dữ liệu Skiplist (William Pugh 1990)
 * 1. Kiến trúc phân tầng ngẫu nhiên (Probabilistic Hierarchy):
 *    - Mỗi node có một mảng con trỏ forward[] với chiều cao ngẫu nhiên (xác suất p = 0.5, tối đa maxLevel = 16).
 *    - Tầng 0 chứa toàn bộ danh sách liên kết theo thứ tự tăng dần.
 *    - Các tầng cao hơn đóng vai trò như các "làn đường cao tốc" (Express lanes) bỏ qua hàng loạt phần tử.
 * 2. Hiệu năng vượt trội:
 *    - Tìm kiếm (Search), Chèn (Insert), Xóa (Delete): Độ phức tạp kỳ vọng O(log N).
 *    - Quét khoảng giá (Range Query): O(log N + K) với K là số phần tử trong khoảng.
 *    - Kết quả tự động được sắp xếp theo giá tăng dần mà không cần thêm bước Sort.
 */

class SkiplistNode {
  constructor(key, value, level) {
    this.key = key; // Giá sản phẩm (hoặc khóa số)
    this.value = value; // Metadata sản phẩm { id, name, originalPrice, discountPercent, ... }
    this.forward = new Array(level).fill(null); // Con trỏ tới các node tiếp theo ở từng tầng
  }
}

export class SkiplistIndex {
  /**
   * @param {object} options
   * @param {number} options.maxLevel - Số tầng tối đa (mặc định: 16, đủ cho 2^16 = 65,536 phần tử)
   * @param {number} options.p - Xác suất tăng tầng (mặc định: 0.5)
   */
  constructor({ maxLevel = 16, p = 0.5 } = {}) {
    this.maxLevel = maxLevel;
    this.p = p;
    this.level = 1; // Chiều cao hiện tại của skiplist
    this.size = 0;

    // Node gốc đại diện (Head sentinel)
    this.header = new SkiplistNode(-Infinity, null, this.maxLevel);
  }

  /**
   * Sinh số tầng ngẫu nhiên cho node mới với phân phối hình học
   */
  _randomLevel() {
    let lvl = 1;
    while (Math.random() < this.p && lvl < this.maxLevel) {
      lvl++;
    }
    return lvl;
  }

  /**
   * Chèn một phần tử vào Skiplist
   * @param {number} key - Giá niêm yết/khóa sắp xếp
   * @param {any} value - Dữ liệu sản phẩm
   */
  insert(key, value) {
    const numKey = Number(key);
    const update = new Array(this.maxLevel).fill(null);
    let curr = this.header;

    // 1. Duyệt từ tầng cao nhất xuống để tìm vị trí chèn ở từng tầng
    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.forward[i] !== null && curr.forward[i].key < numKey) {
        curr = curr.forward[i];
      }
      update[i] = curr;
    }

    curr = curr.forward[0];

    // 2. Tạo node mới với tầng ngẫu nhiên
    const newLevel = this._randomLevel();

    // Nếu tầng mới cao hơn chiều cao hiện tại, cập nhật mảng update
    if (newLevel > this.level) {
      for (let i = this.level; i < newLevel; i++) {
        update[i] = this.header;
      }
      this.level = newLevel;
    }

    const newNode = new SkiplistNode(numKey, value, newLevel);

    // 3. Nối các con trỏ ở từng tầng
    for (let i = 0; i < newLevel; i++) {
      newNode.forward[i] = update[i].forward[i];
      update[i].forward[i] = newNode;
    }

    this.size++;
    return newNode;
  }

  /**
   * Tìm kiếm chính xác một phần tử theo giá (Point Lookup)
   * @param {number} key - Giá cần tìm
   * @returns {any | null} Giá trị tìm thấy hoặc null
   */
  search(key) {
    const numKey = Number(key);
    let curr = this.header;

    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.forward[i] !== null && curr.forward[i].key < numKey) {
        curr = curr.forward[i];
      }
    }

    curr = curr.forward[0];

    if (curr !== null && curr.key === numKey) {
      return curr.value;
    }
    return null;
  }

  /**
   * Truy vấn các phần tử trong khoảng giá [minPrice, maxPrice]
   * Độ phức tạp: O(log N + K) - Cực nhanh cho tính năng lọc giá Flash Sale
   * @param {number} minPrice - Giá tối thiểu
   * @param {number} maxPrice - Giá tối đa
   * @param {number} limit - Giới hạn số lượng phần tử trả về
   */
  rangeQuery(minPrice = 0, maxPrice = Infinity, limit = 50) {
    const min = Number(minPrice);
    const max = Number(maxPrice);
    const results = [];
    let curr = this.header;

    // 1. Nhảy nhanh tới vị trí đầu tiên có key >= minPrice bằng các tầng cao
    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.forward[i] !== null && curr.forward[i].key < min) {
        curr = curr.forward[i];
      }
    }

    // 2. Đi tuần tự trên tầng 0 cho đến khi vượt quá maxPrice hoặc đạt limit
    curr = curr.forward[0];
    while (curr !== null && curr.key <= max && results.length < limit) {
      results.push({
        price: curr.key,
        data: curr.value
      });
      curr = curr.forward[0];
    }

    return results;
  }

  /**
   * Xóa một phần tử khỏi Skiplist
   */
  delete(key) {
    const numKey = Number(key);
    const update = new Array(this.maxLevel).fill(null);
    let curr = this.header;

    for (let i = this.level - 1; i >= 0; i--) {
      while (curr.forward[i] !== null && curr.forward[i].key < numKey) {
        curr = curr.forward[i];
      }
      update[i] = curr;
    }

    curr = curr.forward[0];

    if (curr !== null && curr.key === numKey) {
      for (let i = 0; i < this.level; i++) {
        if (update[i].forward[i] !== curr) break;
        update[i].forward[i] = curr.forward[i];
      }

      // Giảm chiều cao nếu các tầng trên cùng trống
      while (this.level > 1 && this.header.forward[this.level - 1] === null) {
        this.level--;
      }

      this.size--;
      return true;
    }
    return false;
  }

  /**
   * Xóa toàn bộ phần tử
   */
  clear() {
    this.header = new SkiplistNode(-Infinity, null, this.maxLevel);
    this.level = 1;
    this.size = 0;
  }
}
