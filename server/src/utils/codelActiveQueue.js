/**
 * codelActiveQueue.js - Hàng Đợi Quản Lý Tắc Nghẽn Độ Trễ Kiểm Soát CoDel (Controlled Delay - RFC 8290)
 * 
 * NGUYÊN LÝ TOÁN HỌC & ĐỘ PHỨC TẠP:
 * 1. Hiện tượng Bufferbloat trong TMĐT:
 *    - Trong các đợt mở bán Flash Sale 0đ, hàng triệu request đổ về cổng thanh toán VietQR / Checkout API.
 *    - Nếu sử dụng hàng đợi kích thước lớn cố định (Drop-Tail Buffer), các gói tin bị ứ đọng
 *      hàng chục giây khiến client bị timeout trước khi server kịp xử lý, gây lãng phí tài nguyên máy chủ.
 * 2. Thuật toán CoDel (Kathleen Nichols & Van Jacobson 2012, RFC 8290):
 *    - Thay vì đo độ dài hàng đợi (queue size), CoDel đo Thời Gian Lưu Trú (Sojourn Time = Dequeue Time - Enqueue Time).
 *    - Độ trễ mục tiêu (Target Delay): Mức trễ cho phép tối đa trong hàng đợi (mặc định 5ms - 10ms).
 *    - Cửa sổ quan sát (Sliding Interval): Khoảng thời gian theo dõi độ trễ tối thiểu (mặc định 100ms).
 * 3. Trạng thái Thải Hồi (Dropping State) theo luật căn bậc hai nghịch đảo:
 *    - Nếu thời gian lưu trú tối thiểu trong 1 interval liên tục vượt Target Delay, CoDel chuyển sang trạng thái DROPPING.
 *    - Khoảng cách giữa các lần drop tiếp theo giảm dần theo:
 *      t_{next_drop} = t_{now} + interval / sqrt(dropCount)
 *    - Triệt tiêu hoàn toàn hiện tượng ứ đọng hàng đợi (Standing Queue) mà vẫn giữ trọn thông lượng mạng tối đa.
 */

export class CoDelActiveQueue {
  /**
   * @param {Object} options
   * @param {number} [options.targetDelayMs=5] - Độ trễ lưu trú mục tiêu trong hàng đợi (ms)
   * @param {number} [options.intervalMs=100] - Cửa sổ trượt theo dõi độ trễ (ms)
   * @param {number} [options.maxQueueSize=1000] - Ngưỡng đệm tràn cứng
   */
  constructor({
    targetDelayMs = 5,
    intervalMs = 100,
    maxQueueSize = 1000
  } = {}) {
    this.targetDelayMs = Math.max(1, targetDelayMs);
    this.intervalMs = Math.max(10, intervalMs);
    this.maxQueueSize = Math.max(1, maxQueueSize);

    this.queue = [];
    this.dropping = false;
    this.firstAboveTime = 0;
    this.dropNextTime = 0;
    this.dropCount = 0;
    this.totalEnqueued = 0;
    this.totalDequeued = 0;
    this.totalDropped = 0;
  }

  size() {
    return this.queue.length;
  }

  /**
   * Đẩy một request / giao dịch vào hàng đợi CoDel
   * @param {Object} item - Dữ liệu đơn hàng hoặc request
   * @param {number} [now=Date.now()]
   * @returns {boolean} - true nếu thêm thành công, false nếu tràn buffer cứng
   */
  enqueue(item, now = Date.now()) {
    if (this.queue.length >= this.maxQueueSize) {
      this.totalDropped++;
      return false; // Hard overflow drop
    }

    this.queue.push({
      data: item,
      enqueuedAt: now
    });
    this.totalEnqueued++;
    return true;
  }

  /**
   * Lấy một request ra khỏi hàng đợi và thực thi kiểm soát trễ CoDel
   * @param {number} [now=Date.now()]
   * @returns {{ item: Object|null, sojournTime: number, droppedCountThisCall: number }}
   */
  dequeue(now = Date.now()) {
    let droppedCount = 0;

    while (this.queue.length > 0) {
      const entry = this.queue.shift();
      this.totalDequeued++;
      const sojournTime = Math.max(0, now - entry.enqueuedAt);

      if (sojournTime < this.targetDelayMs) {
        // Hàng đợi phản hồi nhanh, trễ dưới mục tiêu -> Thoát khỏi dropping state
        this.firstAboveTime = 0;
        this.dropping = false;
        return {
          item: entry.data,
          sojournTime,
          droppedCountThisCall: droppedCount
        };
      }

      // Trễ vượt quá Target Delay
      if (this.firstAboveTime === 0) {
        // Bắt đầu chu kỳ trễ cao
        this.firstAboveTime = now + this.intervalMs;
      } else if (now >= this.firstAboveTime) {
        // Đã duy trì trễ cao vượt qua ngưỡng 1 interval -> Kích hoạt dropping state
        if (!this.dropping) {
          this.dropping = true;
          this.dropCount = 1;
          this.dropNextTime = now + this._computeNextDropInterval();
          // Drop gói tin hiện tại này vì đã bị ứ đọng quá lâu
          this.totalDropped++;
          droppedCount++;
          continue;
        }

        if (now >= this.dropNextTime) {
          // Đến thời điểm drop gói tiếp theo theo lịch căn bậc hai nghịch đảo
          this.dropCount++;
          this.dropNextTime = now + this._computeNextDropInterval();
          this.totalDropped++;
          droppedCount++;
          continue;
        }
      }

      return {
        item: entry.data,
        sojournTime,
        droppedCountThisCall: droppedCount
      };
    }

    return {
      item: null,
      sojournTime: 0,
      droppedCountThisCall: droppedCount
    };
  }

  _computeNextDropInterval() {
    // interval / sqrt(dropCount)
    return Math.max(1, Math.round(this.intervalMs / Math.sqrt(Math.max(1, this.dropCount))));
  }

  getStats() {
    return {
      currentQueueSize: this.queue.length,
      isDropping: this.dropping,
      dropCount: this.dropCount,
      totalEnqueued: this.totalEnqueued,
      totalDequeued: this.totalDequeued,
      totalDropped: this.totalDropped,
      targetDelayMs: this.targetDelayMs,
      intervalMs: this.intervalMs
    };
  }

  clear() {
    this.queue = [];
    this.dropping = false;
    this.firstAboveTime = 0;
    this.dropNextTime = 0;
    this.dropCount = 0;
  }
}

export default CoDelActiveQueue;
