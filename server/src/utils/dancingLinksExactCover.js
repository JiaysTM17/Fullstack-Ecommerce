/**
 * Dancing Links (DLX) & Algorithm X (Donald Knuth) for Exact Cover & Non-Overlapping Exclusive Voucher Allocation
 * 
 * Thuật toán DLX (Knuth 2000):
 * 1. Cấu trúc dữ liệu danh sách liên kết đôi 4 hướng hình xuyến (Toroidal Doubly Linked List):
 *    - Mỗi node có 4 con trỏ: left, right, up, down.
 *    - Thao tác cover(col) và uncover(col) thực hiện trong O(1) nhờ "nhảy múa" các con trỏ:
 *      x.right.left = x.left; x.left.right = x.right;
 *      và phục hồi chính xác theo thứ tự đảo ngược.
 * 2. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Phân bổ bộ voucher độc quyền (Exclusive Non-Overlapping Voucher Allocation):
 *      Mỗi sản phẩm trong giỏ hàng chỉ được áp dụng đúng 1 voucher độc quyền (không trùng lặp).
 *    - Tìm tổ hợp mã giảm giá che phủ chính xác tập sản phẩm cần mua để đạt tổng chiết khấu tối đa.
 */

export class DLXNode {
  constructor(colHeader = null) {
    this.left = this;
    this.right = this;
    this.up = this;
    this.down = this;
    this.col = colHeader || this;
    this.rowId = -1;
    this.size = 0; // Chỉ dùng cho Column Header
    this.name = ""; // Tên cột hoặc mã sản phẩm
  }
}

export class DancingLinksExactCover {
  constructor() {
    this.root = new DLXNode(); // Header gốc
    this.columns = [];         // Danh sách các cột
    this.columnMap = new Map();
    this.solutions = [];
    this.rows = [];            // Metadata của các hàng (ví dụ: voucher info)
  }

  /**
   * Khởi tạo các cột (tương ứng với các Item/Product cần được che phủ chính xác)
   * @param {string[]} items
   */
  initColumns(items = []) {
    this.root = new DLXNode();
    this.columns = [];
    this.columnMap.clear();
    this.solutions = [];
    this.rows = [];

    let prev = this.root;
    for (const item of items) {
      const col = new DLXNode();
      col.name = String(item);
      col.size = 0;

      // Nối ngang
      col.left = prev;
      col.right = this.root;
      prev.right = col;
      this.root.left = col;

      prev = col;
      this.columns.push(col);
      this.columnMap.set(String(item), col);
    }
  }

  /**
   * Thêm một hàng vào ma trận (tương ứng với 1 Voucher bao phủ một danh sách sản phẩm)
   * @param {number|string} rowId - ID hoặc tên voucher
   * @param {string[]} coveredItems - Danh sách sản phẩm mà voucher này áp dụng
   * @param {Object} [meta={}] - Thông tin chiết khấu, giá trị voucher
   */
  addRow(rowId, coveredItems = [], meta = {}) {
    const validItems = coveredItems.filter(item => this.columnMap.has(String(item)));
    if (validItems.length === 0) return;

    const rowIndex = this.rows.length;
    this.rows.push({ rowId, coveredItems: validItems, meta });

    let firstNode = null;
    let prevNode = null;

    for (const item of validItems) {
      const col = this.columnMap.get(String(item));
      const newNode = new DLXNode(col);
      newNode.rowId = rowIndex;

      // Nối dọc vào cột col
      newNode.up = col.up;
      newNode.down = col;
      col.up.down = newNode;
      col.up = newNode;
      col.size++;

      // Nối ngang giữa các node trong cùng hàng
      if (!firstNode) {
        firstNode = newNode;
        prevNode = newNode;
      } else {
        newNode.left = prevNode;
        newNode.right = firstNode;
        prevNode.right = newNode;
        firstNode.left = newNode;
        prevNode = newNode;
      }
    }
  }

  /**
   * Che phủ một cột (Loại bỏ cột và tất cả các hàng giao nhau với cột này)
   * @param {DLXNode} col
   */
  cover(col) {
    col.right.left = col.left;
    col.left.right = col.right;

    for (let row = col.down; row !== col; row = row.down) {
      for (let node = row.right; node !== row; node = node.right) {
        node.down.up = node.up;
        node.up.down = node.down;
        node.col.size--;
      }
    }
  }

  /**
   * Phục hồi lại cột (Đảo ngược hoàn toàn thao tác cover theo thứ tự ngược lại)
   * @param {DLXNode} col
   */
  uncover(col) {
    for (let row = col.up; row !== col; row = row.up) {
      for (let node = row.left; node !== row; node = node.left) {
        node.col.size++;
        node.down.up = node;
        node.up.down = node;
      }
    }
    col.right.left = col;
    col.left.right = col;
  }

  /**
   * Tìm kiếm các giải pháp che phủ chính xác (Knuth's Algorithm X)
   * @param {number} [maxSolutions=10]
   * @returns {Array<Array<Object>>} Danh sách các bộ voucher hợp lệ
   */
  solve(maxSolutions = 10) {
    this.solutions = [];
    if (this.columns.length === 0) return [];
    const currentSolution = [];

    const search = () => {
      if (this.solutions.length >= maxSolutions) return;

      // Nếu tất cả các cột đã được che phủ, ta tìm thấy một nghiệm hợp lệ
      if (this.root.right === this.root) {
        const solRows = currentSolution.map(node => this.rows[node.rowId]);
        this.solutions.push(solRows);
        return;
      }

      // Chọn cột có kích thước size nhỏ nhất (Heuristic MRV - Minimum Remaining Values)
      let minCol = this.root.right;
      let minSize = minCol.size;

      for (let col = minCol.right; col !== this.root; col = col.right) {
        if (col.size < minSize) {
          minSize = col.size;
          minCol = col;
        }
      }

      // Nếu có cột không còn hàng nào che phủ được -> Nhánh cụt
      if (minSize === 0) return;

      this.cover(minCol);

      for (let row = minCol.down; row !== minCol; row = row.down) {
        currentSolution.push(row);

        for (let node = row.right; node !== row; node = node.right) {
          this.cover(node.col);
        }

        search();

        // Quay lui (Backtrack)
        currentSolution.pop();
        for (let node = row.left; node !== row; node = node.left) {
          this.uncover(node.col);
        }
      }

      this.uncover(minCol);
    };

    search();
    return this.solutions;
  }

  /**
   * Tìm tổ hợp voucher mang lại tổng số tiền giảm giá cao nhất
   * @returns {Object|null}
   */
  findOptimalVoucherCombination() {
    const allSolutions = this.solve(20);
    if (allSolutions.length === 0) return null;

    let bestSolution = null;
    let maxDiscount = -1;

    for (const sol of allSolutions) {
      const totalDiscount = sol.reduce((sum, item) => sum + (Number(item.meta?.discountAmount) || 0), 0);
      if (totalDiscount > maxDiscount) {
        maxDiscount = totalDiscount;
        bestSolution = {
          vouchers: sol,
          totalDiscount,
          coveredItemsCount: sol.reduce((acc, v) => acc + v.coveredItems.length, 0)
        };
      }
    }

    return bestSolution;
  }
}

export default {
  DLXNode,
  DancingLinksExactCover
};
