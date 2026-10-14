/**
 * fenwick2DRangeTree.js - Cây Fenwick 2 Chiều (2D Binary Indexed Tree) Phân Tích Doanh Số & Khoảng Đa Chiều Flash Sale
 * 
 * NGUYÊN LÝ TOÁN HỌC & ĐỘ PHỨC TẠP:
 * 1. Thách thức phân tích ma trận dữ liệu TMĐT:
 *    - Quản trị viên và người bán liên tục cần truy vấn tổng GMV hoặc số lượng đơn hàng
 *      của các sản phẩm nằm trong khoảng giá [P_min, P_max] VÀ khoảng rating [R_min, R_max].
 *    - Duyệt quét toàn bộ danh mục sản phẩm mất O(N), không đáp ứng được tần suất truy vấn mili-giây.
 * 2. Cấu trúc Cây Fenwick 2 Chiều (2D BIT):
 *    - Mở rộng hàm bitwise LSB: lowbit(x) = x & (-x).
 *    - Cập nhật điểm (Point Update): update(r, c, delta) với hai vòng lặp lồng nhau qua lowbit(r) và lowbit(c).
 *      Độ phức tạp cập nhật: O(log R * log C).
 *    - Truy vấn tổng tiền tố 2D (2D Prefix Sum):
 *      queryPrefix(r, c) = sum_{i=1..r} sum_{j=1..c} A[i][j] trong O(log R * log C).
 *    - Truy vấn tổng hình chữ nhật (2D Subgrid Query):
 *      queryRange(r1, c1, r2, c2) = Q(r2, c2) - Q(r1-1, c2) - Q(r2, c1-1) + Q(r1-1, c1-1) trong O(log R * log C).
 */

export class Fenwick2DRangeTree {
  /**
   * @param {number} maxRows - Kích thước hàng tối đa (ví dụ: các bucket khoảng giá 1..100)
   * @param {number} maxCols - Kích thước cột tối đa (ví dụ: các bucket rating hoặc chiết khấu 1..50)
   */
  constructor(maxRows = 100, maxCols = 50) {
    this.maxRows = Math.max(1, maxRows);
    this.maxCols = Math.max(1, maxCols);

    // Mảng 2D kích thước (maxRows + 1) x (maxCols + 1), khởi tạo toàn bộ bằng 0
    this.tree = Array.from({ length: this.maxRows + 1 }, () => new Float64Array(this.maxCols + 1));
    this.totalEntries = 0;
  }

  _lowbit(x) {
    return x & (-x);
  }

  /**
   * Cập nhật cộng thêm delta vào ô (r, c)
   * @param {number} r - Chỉ số hàng (1-based)
   * @param {number} c - Chỉ số cột (1-based)
   * @param {number} delta - Giá trị thay đổi (doanh số, số lượng đơn)
   */
  update(r, c, delta) {
    const row = Math.floor(r);
    const col = Math.floor(c);
    const val = Number(delta);

    if (row < 1 || row > this.maxRows || col < 1 || col > this.maxCols) {
      return;
    }

    for (let i = row; i <= this.maxRows; i += this._lowbit(i)) {
      for (let j = col; j <= this.maxCols; j += this._lowbit(j)) {
        this.tree[i][j] += val;
      }
    }
    this.totalEntries++;
  }

  /**
   * Tính tổng ma trận con từ (1, 1) đến (r, c)
   * @param {number} r
   * @param {number} c
   * @returns {number}
   */
  queryPrefix(r, c) {
    const row = Math.min(this.maxRows, Math.floor(r));
    const col = Math.min(this.maxCols, Math.floor(c));

    if (row < 1 || col < 1) return 0;

    let sum = 0;
    for (let i = row; i > 0; i -= this._lowbit(i)) {
      for (let j = col; j > 0; j -= this._lowbit(j)) {
        sum += this.tree[i][j];
      }
    }
    return sum;
  }

  /**
   * Truy vấn tổng trong miền chữ nhật [r1..r2] x [c1..c2]
   * @param {number} r1
   * @param {number} c1
   * @param {number} r2
   * @param {number} c2
   * @returns {number}
   */
  queryRange(r1, c1, r2, c2) {
    const minR = Math.max(1, Math.min(Math.floor(r1), Math.floor(r2)));
    const maxR = Math.min(this.maxRows, Math.max(Math.floor(r1), Math.floor(r2)));
    const minC = Math.max(1, Math.min(Math.floor(c1), Math.floor(c2)));
    const maxC = Math.min(this.maxCols, Math.max(Math.floor(c1), Math.floor(c2)));

    if (minR > maxR || minC > maxC) return 0;

    const total = this.queryPrefix(maxR, maxC)
                - this.queryPrefix(minR - 1, maxC)
                - this.queryPrefix(maxR, minC - 1)
                + this.queryPrefix(minR - 1, minC - 1);

    return Math.round(total * 100) / 100;
  }

  clear() {
    for (let i = 0; i <= this.maxRows; i++) {
      this.tree[i].fill(0);
    }
    this.totalEntries = 0;
  }
}

export default Fenwick2DRangeTree;
