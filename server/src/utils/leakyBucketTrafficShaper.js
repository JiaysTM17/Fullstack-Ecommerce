/**
 * leakyBucketTrafficShaper.js - Bộ Định Hình Lưu Lượng Leaky Bucket Bounded-Buffer & Fair Queue
 * 
 * NGUYÊN LÝ HOẠT ĐỘNG:
 * 1. Khắc phục nhược điểm của Token Bucket:
 *    - Token Bucket cho phép "Burst" lưu lượng tới hạn mức tối đa, có thể làm sụp đổ các dịch vụ DB / Payment.
 *    - Leaky Bucket đảm bảo tốc độ rò rỉ (leak rate) hoàn toàn êm dịu, đều đặn theo thời gian.
 * 2. Bounded Queue & Drop Policies:
 *    - Hàng đợi giới hạn dung lượng `capacity`.
 *    - Chính sách loại bỏ:
 *      + `TAIL_DROP`: Từ chối ngay lập tức yêu cầu đến sau khi hàng đợi đầy.
 *      + `PRIORITY_DROP`: Loại bỏ yêu cầu có mức ưu tiên thấp nhất (LOW/NORMAL) để nhường chỗ cho HIGH priority.
 * 3. Fair Queueing & Metrics:
 *    - Thống kê tỷ lệ nghẽn theo shop, thời gian chờ trung bình và số gói bị drop.
 */

export const SHAPER_PRIORITY = {
  HIGH: 3,     // Ví dụ: Thanh toán đơn hàng, trừ tiền ví
  NORMAL: 2,   // Thêm giỏ hàng, xem chi tiết
  LOW: 1       // Tracking log, background telemetry
};

export class LeakyBucketTrafficShaper {
  /**
   * @param {Object} options
   * @param {number} options.capacity - Sức chứa hàng đợi tối đa
   * @param {number} options.leakRatePerSec - Số yêu cầu được phép xử lý mỗi giây
   * @param {string} options.dropPolicy - 'TAIL_DROP' hoặc 'PRIORITY_DROP'
   */
  constructor({ capacity = 100, leakRatePerSec = 10, dropPolicy = 'TAIL_DROP' } = {}) {
    this.capacity = Math.max(1, capacity);
    this.leakRatePerSec = Math.max(1, leakRatePerSec);
    this.dropPolicy = dropPolicy;
    this.queue = [];
    this.lastLeakTime = Date.now();
    this.totalEnqueued = 0;
    this.totalLeaked = 0;
    this.totalDropped = 0;
    this.shopDropCounts = {};
  }

  /**
   * Thêm một yêu cầu vào hàng đợi đệm
   * @param {Object} item
   * @param {string} item.id - ID gói tin/yêu cầu
   * @param {string} [item.shopId='platform'] - Định danh gian hàng gửi yêu cầu
   * @param {number} [item.priority=SHAPER_PRIORITY.NORMAL] - Mức ưu tiên
   * @param {any} [item.payload] - Dữ liệu kèm theo
   * @returns {{ accepted: boolean, queueLength: number, reason?: string, droppedId?: string }}
   */
  enqueue(item) {
    if (!item || !item.id) {
      return { accepted: false, queueLength: this.queue.length, reason: 'INVALID_ITEM' };
    }

    const priority = item.priority || SHAPER_PRIORITY.NORMAL;
    const packet = {
      id: item.id,
      shopId: item.shopId || 'platform',
      priority,
      payload: item.payload || null,
      enqueuedAt: Date.now()
    };

    if (this.queue.length >= this.capacity) {
      if (this.dropPolicy === 'PRIORITY_DROP') {
        // Tìm phần tử có priority thấp nhất trong queue
        let lowestIdx = -1;
        let lowestPriority = priority; // Chỉ thay thế nếu phần tử cũ có priority thấp hơn phần tử mới

        for (let i = 0; i < this.queue.length; i++) {
          if (this.queue[i].priority < lowestPriority) {
            lowestPriority = this.queue[i].priority;
            lowestIdx = i;
          }
        }

        if (lowestIdx !== -1) {
          // Loại bỏ phần tử thấp hơn và đưa phần tử mới vào
          const dropped = this.queue.splice(lowestIdx, 1)[0];
          this.queue.push(packet);
          this.totalDropped += 1;
          this.totalEnqueued += 1;
          this.shopDropCounts[dropped.shopId] = (this.shopDropCounts[dropped.shopId] || 0) + 1;
          return { accepted: true, queueLength: this.queue.length, droppedId: dropped.id };
        }
      }

      // TAIL_DROP hoặc không tìm thấy phần tử ưu tiên thấp hơn
      this.totalDropped += 1;
      this.shopDropCounts[packet.shopId] = (this.shopDropCounts[packet.shopId] || 0) + 1;
      return { accepted: false, queueLength: this.queue.length, reason: 'BUFFER_OVERFLOW' };
    }

    this.queue.push(packet);
    this.totalEnqueued += 1;
    return { accepted: true, queueLength: this.queue.length };
  }

  /**
   * Giải phóng (leak) các yêu cầu ra khỏi bộ đệm theo thời gian trôi qua
   * @param {number} [now=Date.now()]
   * @returns {Array<Object>} - Danh sách các gói tin được xuất xưởng xử lý
   */
  leak(now = Date.now()) {
    const elapsedSec = Math.max(0, (now - this.lastLeakTime) / 1000);
    const quota = Math.floor(elapsedSec * this.leakRatePerSec);

    if (quota <= 0 || this.queue.length === 0) {
      if (quota > 0) {
        this.lastLeakTime = now;
      }
      return [];
    }

    const itemsToLeak = Math.min(quota, this.queue.length);
    // Sắp xếp các gói tin theo priority giảm dần trước khi xuất nếu có nhiều gói
    this.queue.sort((a, b) => b.priority - a.priority || a.enqueuedAt - b.enqueuedAt);

    const leaked = this.queue.splice(0, itemsToLeak);
    this.totalLeaked += leaked.length;
    this.lastLeakTime = now;

    return leaked;
  }

  /**
   * Đo lường các chỉ số hàng đợi công bằng (Fair Queue Metrics)
   */
  getMetrics() {
    const shopQueueDistribution = {};
    for (const item of this.queue) {
      shopQueueDistribution[item.shopId] = (shopQueueDistribution[item.shopId] || 0) + 1;
    }

    const now = Date.now();
    const waitTimes = this.queue.map(p => now - p.enqueuedAt);
    const avgWaitMs = waitTimes.length > 0
      ? Math.round(waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length)
      : 0;

    return {
      capacity: this.capacity,
      currentLength: this.queue.length,
      leakRatePerSec: this.leakRatePerSec,
      totalEnqueued: this.totalEnqueued,
      totalLeaked: this.totalLeaked,
      totalDropped: this.totalDropped,
      avgWaitMs,
      shopQueueDistribution,
      shopDropCounts: { ...this.shopDropCounts }
    };
  }

  /**
   * Xóa sạch bộ đệm
   */
  clear() {
    this.queue = [];
    this.lastLeakTime = Date.now();
  }
}

export default LeakyBucketTrafficShaper;
