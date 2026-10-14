/**
 * Segment Tree with Lazy Propagation for Time-Windowed Flash Sale Inventory
 * 
 * Cấu trúc Cây Đoạn Kèm Kỹ Thuật Lan Truyền Lười (Segment Tree with Lazy Propagation - O(log N)):
 * 1. Cơ sở toán học:
 *    - Quản lý một dải thời gian liên tục gồm N khung giờ/thời điểm (ví dụ: 24 khung giờ Flash Sale trong ngày).
 *    - Mỗi nút quản lý một đoạn [start, end] lưu giữ: Tồn kho nhỏ nhất (minStock), Tồn kho lớn nhất, Giá thấp nhất (minPrice).
 *    - Kỹ thuật Lazy Propagation: Khi cập nhật một đoạn [L, R], giá trị biến đổi chỉ lưu tạm tại nút cao nhất và chỉ đẩy xuống nút con (Push Down) khi thực sự có truy vấn con.
 *    - Độ phức tạp tối ưu: Cả truy vấn khoảng (Range Query) và cập nhật khoảng (Range Update) đều đạt O(log N).
 * 2. Ứng dụng thực tiễn trên sàn TMĐT Mini Shopee Multi-Vendor:
 *    - Quản lý tồn kho Flash Sale theo từng khung giờ (00h-02h, 12h-14h, 20h-22h).
 *    - Đặt chỗ hàng trước (Slot Reservation) bảo đảm không bán vượt kho (Zero Overselling) trong bất kỳ giây nào.
 */

export class LazySegmentTreeInventory {
  /**
   * @param {number} size - Kích thước dải thời gian (ví dụ: 24 cho 24 giờ, 100 cho 100 slot)
   * @param {number} [initialStock=100] - Tồn kho ban đầu cho mỗi khung giờ
   * @param {number} [basePrice=100000] - Giá niêm yết ban đầu
   */
  constructor(size = 24, initialStock = 100, basePrice = 100000) {
    this.n = size;
    this.treeMinStock = new Array(4 * size).fill(0);
    this.treeMinPrice = new Array(4 * size).fill(0);
    this.lazyStock = new Array(4 * size).fill(0);
    this.lazyPriceMultiplier = new Array(4 * size).fill(1.0);

    this._build(1, 0, this.n - 1, initialStock, basePrice);
  }

  _build(node, start, end, initialStock, basePrice) {
    if (start === end) {
      this.treeMinStock[node] = initialStock;
      this.treeMinPrice[node] = basePrice;
      return;
    }

    const mid = (start + end) >> 1;
    this._build(2 * node, start, mid, initialStock, basePrice);
    this._build(2 * node + 1, mid + 1, end, initialStock, basePrice);

    this.treeMinStock[node] = Math.min(this.treeMinStock[2 * node], this.treeMinStock[2 * node + 1]);
    this.treeMinPrice[node] = Math.min(this.treeMinPrice[2 * node], this.treeMinPrice[2 * node + 1]);
  }

  /**
   * Đẩy cập nhật lười từ nút cha xuống 2 nút con (Push Down)
   */
  _pushDown(node, start, end) {
    if (start === end) return;

    // 1. Đẩy Lazy Stock
    if (this.lazyStock[node] !== 0) {
      const delta = this.lazyStock[node];
      this.treeMinStock[2 * node] += delta;
      this.treeMinStock[2 * node + 1] += delta;
      this.lazyStock[2 * node] += delta;
      this.lazyStock[2 * node + 1] += delta;
      this.lazyStock[node] = 0;
    }

    // 2. Đẩy Lazy Price Multiplier
    if (this.lazyPriceMultiplier[node] !== 1.0) {
      const mult = this.lazyPriceMultiplier[node];
      this.treeMinPrice[2 * node] = Math.round(this.treeMinPrice[2 * node] * mult);
      this.treeMinPrice[2 * node + 1] = Math.round(this.treeMinPrice[2 * node + 1] * mult);
      this.lazyPriceMultiplier[2 * node] *= mult;
      this.lazyPriceMultiplier[2 * node + 1] *= mult;
      this.lazyPriceMultiplier[node] = 1.0;
    }
  }

  /**
   * Cập nhật cộng/trừ tồn kho trong đoạn [L, R]
   */
  updateStockRange(l, r, delta, node = 1, start = 0, end = this.n - 1) {
    if (l > end || r < start) return;

    if (l <= start && end <= r) {
      this.treeMinStock[node] += delta;
      this.lazyStock[node] += delta;
      return;
    }

    this._pushDown(node, start, end);
    const mid = (start + end) >> 1;
    this.updateStockRange(l, r, delta, 2 * node, start, mid);
    this.updateStockRange(l, r, delta, 2 * node + 1, mid + 1, end);

    this.treeMinStock[node] = Math.min(this.treeMinStock[2 * node], this.treeMinStock[2 * node + 1]);
  }

  /**
   * Áp dụng chiết khấu giá (ví dụ: giảm 20% -> discountRate = 0.2) cho đoạn [L, R]
   */
  applyPriceDiscountRange(l, r, discountRate = 0.2, node = 1, start = 0, end = this.n - 1) {
    if (l > end || r < start) return;

    const multiplier = 1 - discountRate;
    if (l <= start && end <= r) {
      this.treeMinPrice[node] = Math.round(this.treeMinPrice[node] * multiplier);
      this.lazyPriceMultiplier[node] *= multiplier;
      return;
    }

    this._pushDown(node, start, end);
    const mid = (start + end) >> 1;
    this.applyPriceDiscountRange(l, r, discountRate, 2 * node, start, mid);
    this.applyPriceDiscountRange(l, r, discountRate, 2 * node + 1, mid + 1, end);

    this.treeMinPrice[node] = Math.min(this.treeMinPrice[2 * node], this.treeMinPrice[2 * node + 1]);
  }

  /**
   * Truy vấn tồn kho khả dụng nhỏ nhất trong khung giờ [L, R]
   */
  queryMinStock(l, r, node = 1, start = 0, end = this.n - 1) {
    if (l > end || r < start) return Infinity;
    if (l <= start && end <= r) {
      return this.treeMinStock[node];
    }

    this._pushDown(node, start, end);
    const mid = (start + end) >> 1;
    const leftMin = this.queryMinStock(l, r, 2 * node, start, mid);
    const rightMin = this.queryMinStock(l, r, 2 * node + 1, mid + 1, end);
    return Math.min(leftMin, rightMin);
  }

  /**
   * Truy vấn mức giá thấp nhất trong khung giờ [L, R]
   */
  queryMinPrice(l, r, node = 1, start = 0, end = this.n - 1) {
    if (l > end || r < start) return Infinity;
    if (l <= start && end <= r) {
      return this.treeMinPrice[node];
    }

    this._pushDown(node, start, end);
    const mid = (start + end) >> 1;
    const leftMin = this.queryMinPrice(l, r, 2 * node, start, mid);
    const rightMin = this.queryMinPrice(l, r, 2 * node + 1, mid + 1, end);
    return Math.min(leftMin, rightMin);
  }

  /**
   * Đặt trước hàng trong khung giờ [L, R] có kiểm tra an toàn tồn kho (Atomic Reservation)
   * @param {number} l - Khung giờ bắt đầu
   * @param {number} r - Khung giờ kết thúc
   * @param {number} quantity - Số lượng cần đặt
   * @returns {Object} { success: boolean, availableStock: number, reservedQty: number }
   */
  reserveSlot(l, r, quantity = 1) {
    const minAvail = this.queryMinStock(l, r);
    if (minAvail < quantity) {
      return {
        success: false,
        availableStock: minAvail,
        reservedQty: 0,
        reason: "INSUFFICIENT_TIME_WINDOW_STOCK"
      };
    }

    this.updateStockRange(l, r, -quantity);
    return {
      success: true,
      availableStock: minAvail - quantity,
      reservedQty: quantity
    };
  }
}
