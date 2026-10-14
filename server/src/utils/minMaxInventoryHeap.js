/**
 * minMaxInventoryHeap.js - Hàng Đợi Ưu Tiên Kép Min-Max Heap Tối Ưu Tồn Kho Hai Đầu
 * 
 * NGUYÊN LÝ TOÁN HỌC & CẤU TRÚC DỮ LIỆU:
 * 1. Min-Max Heap (Double-Ended Priority Queue - DEPQueue):
 *    - Cây nhị phân hoàn chỉnh lưu trên mảng phẳng 1-indexed.
 *    - Các tầng chẵn (0, 2, 4...) là MIN-LEVEL: Khóa của nút nhỏ hơn toàn bộ con cháu của nó.
 *    - Các tầng lẻ (1, 3, 5...) là MAX-LEVEL: Khóa của nút lớn hơn toàn bộ con cháu của nó.
 * 2. Hiệu năng vượt trội:
 *    - `getMin()` trong O(1): Luôn nằm tại gốc cây (index 1).
 *    - `getMax()` trong O(1): Luôn nằm tại một trong hai nút con của gốc (index 2 hoặc 3).
 *    - `insert(item)` trong O(log N).
 *    - `extractMin()` và `extractMax()` trong O(log N).
 * 3. Ứng dụng TMĐT:
 *    - Quản lý đồng thời:
 *      + SKU bán chạy nhất (Fast-moving inventory - High Velocity) để ưu tiên restock.
 *      + SKU tồn kho ứ đọng nhất (Dead stock - Low Velocity) để kích hoạt xả hàng/Flash Sale.
 */

export class MinMaxInventoryHeap {
  constructor() {
    // 1-indexed: phần tử đầu tiên tại index 1, index 0 bỏ trống
    this.heap = [null];
  }

  /**
   * Xác định tầng của một nút là MIN hay MAX level
   * @param {number} idx - 1-based index
   * @returns {boolean} - true nếu là MIN-LEVEL, false nếu là MAX-LEVEL
   */
  isMinLevel(idx) {
    if (idx < 1) return true;
    const level = Math.floor(Math.log2(idx));
    return level % 2 === 0;
  }

  /**
   * Số lượng phần tử hiện có trong Heap
   * @returns {number}
   */
  size() {
    return this.heap.length - 1;
  }

  /**
   * Kiểm tra Heap rỗng
   * @returns {boolean}
   */
  isEmpty() {
    return this.size() === 0;
  }

  /**
   * Tra cứu phần tử nhỏ nhất (Dead stock / Min velocity) trong O(1)
   */
  getMin() {
    if (this.isEmpty()) return null;
    return this.heap[1];
  }

  /**
   * Tra cứu phần tử lớn nhất (Top seller / Max velocity) trong O(1)
   */
  getMax() {
    const n = this.size();
    if (n === 0) return null;
    if (n === 1) return this.heap[1];
    if (n === 2) return this.heap[2];
    return this.heap[2].velocity >= this.heap[3].velocity ? this.heap[2] : this.heap[3];
  }

  /**
   * Thêm một mặt hàng SKU vào Heap trong O(log N)
   * @param {Object} item
   * @param {string} item.skuId - Mã định danh SKU
   * @param {number} item.velocity - Tốc độ bán / Điểm luân chuyển kho
   * @param {any} [item.data] - Thông tin chi tiết kèm theo
   */
  insert(item) {
    if (!item || item.velocity === undefined) return;
    const element = {
      skuId: item.skuId,
      velocity: Number(item.velocity),
      data: item.data || {}
    };

    this.heap.push(element);
    this._pushUp(this.size());
  }

  /**
   * Trích xuất và loại bỏ phần tử nhỏ nhất trong O(log N)
   */
  extractMin() {
    const n = this.size();
    if (n === 0) return null;
    if (n === 1) return this.heap.pop();

    const minItem = this.heap[1];
    this.heap[1] = this.heap.pop();
    this._pushDown(1);
    return minItem;
  }

  /**
   * Trích xuất và loại bỏ phần tử lớn nhất trong O(log N)
   */
  extractMax() {
    const n = this.size();
    if (n === 0) return null;
    if (n === 1) return this.heap.pop();
    if (n === 2) return this.heap.pop();

    const maxIdx = (n === 2 || this.heap[2].velocity >= this.heap[3].velocity) ? 2 : 3;
    const maxItem = this.heap[maxIdx];

    const lastItem = this.heap.pop();
    if (maxIdx < this.heap.length) {
      this.heap[maxIdx] = lastItem;
      this._pushDown(maxIdx);
    }
    return maxItem;
  }

  /**
   * Xem trước cả hai đầu Min và Max đồng thời
   */
  peekBoth() {
    return {
      deadStockMin: this.getMin(),
      fastMovingMax: this.getMax(),
      totalSkus: this.size()
    };
  }

  // --- CÁC PHƯƠNG THỨC NỘI BỘ (PUSH UP & PUSH DOWN) ---

  _swap(i, j) {
    const temp = this.heap[i];
    this.heap[i] = this.heap[j];
    this.heap[j] = temp;
  }

  _pushUp(i) {
    if (i <= 1) return;
    const p = Math.floor(i / 2);

    if (this.isMinLevel(i)) {
      if (this.heap[i].velocity > this.heap[p].velocity) {
        this._swap(i, p);
        this._pushUpMax(p);
      } else {
        this._pushUpMin(i);
      }
    } else {
      if (this.heap[i].velocity < this.heap[p].velocity) {
        this._swap(i, p);
        this._pushUpMin(p);
      } else {
        this._pushUpMax(i);
      }
    }
  }

  _pushUpMin(i) {
    const gp = Math.floor(i / 4);
    if (gp >= 1 && this.heap[i].velocity < this.heap[gp].velocity) {
      this._swap(i, gp);
      this._pushUpMin(gp);
    }
  }

  _pushUpMax(i) {
    const gp = Math.floor(i / 4);
    if (gp >= 1 && this.heap[i].velocity > this.heap[gp].velocity) {
      this._swap(i, gp);
      this._pushUpMax(gp);
    }
  }

  _pushDown(i) {
    if (this.isMinLevel(i)) {
      this._pushDownMin(i);
    } else {
      this._pushDownMax(i);
    }
  }

  _pushDownMin(i) {
    const n = this.size();
    if (2 * i > n) return; // Không có nút con

    // Tìm con hoặc cháu có velocity nhỏ nhất
    let m = 2 * i; // con trái
    if (2 * i + 1 <= n && this.heap[2 * i + 1].velocity < this.heap[m].velocity) {
      m = 2 * i + 1;
    }
    // Kiểm tra 4 nút cháu
    for (let k = 4 * i; k <= Math.min(n, 4 * i + 3); k++) {
      if (this.heap[k].velocity < this.heap[m].velocity) {
        m = k;
      }
    }

    if (m >= 4 * i) {
      // m là cháu
      if (this.heap[m].velocity < this.heap[i].velocity) {
        this._swap(m, i);
        const p = Math.floor(m / 2);
        if (this.heap[m].velocity > this.heap[p].velocity) {
          this._swap(m, p);
        }
        this._pushDownMin(m);
      }
    } else {
      // m là con
      if (this.heap[m].velocity < this.heap[i].velocity) {
        this._swap(m, i);
      }
    }
  }

  _pushDownMax(i) {
    const n = this.size();
    if (2 * i > n) return; // Không có nút con

    // Tìm con hoặc cháu có velocity lớn nhất
    let m = 2 * i; // con trái
    if (2 * i + 1 <= n && this.heap[2 * i + 1].velocity > this.heap[m].velocity) {
      m = 2 * i + 1;
    }
    // Kiểm tra 4 nút cháu
    for (let k = 4 * i; k <= Math.min(n, 4 * i + 3); k++) {
      if (this.heap[k].velocity > this.heap[m].velocity) {
        m = k;
      }
    }

    if (m >= 4 * i) {
      // m là cháu
      if (this.heap[m].velocity > this.heap[i].velocity) {
        this._swap(m, i);
        const p = Math.floor(m / 2);
        if (this.heap[m].velocity < this.heap[p].velocity) {
          this._swap(m, p);
        }
        this._pushDownMax(m);
      }
    } else {
      // m là con
      if (this.heap[m].velocity > this.heap[i].velocity) {
        this._swap(m, i);
      }
    }
  }
}

export default MinMaxInventoryHeap;
