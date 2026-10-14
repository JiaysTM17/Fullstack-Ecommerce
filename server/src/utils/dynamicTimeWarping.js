/**
 * Dynamic Time Warping (DTW) for Purchasing Cycles & Churn Pattern Recognition
 * 
 * Thuật toán So Khớp Chuỗi Thời Gian DTW (Quy hoạch động ma trận chi phí tích lũy O(N * M)):
 * 1. Đo lường khoảng cách tương đồng giữa hai chuỗi thời gian mua sắm có độ dài khác nhau
 *    hoặc bị biến dạng tốc độ/lệch pha thời gian (Time-shifted purchasing habits).
 * 2. So sánh lịch sử đơn hàng của người mua với các chuỗi hành vi chuẩn mực:
 *    - PATTERN_ACTIVE_LOYAL: Mua đều đặn, chu kỳ lặp lại ổn định (VIP Shopper).
 *    - PATTERN_CHURNING_RISK: Chu kỳ mua thưa dần, khoảng cách giữa các đơn tăng đột biến (Nguy cơ rời bỏ sàn).
 *    - PATTERN_SEASONAL_SALE: Chỉ xuất hiện mua dồn dập vào các đợt Siêu Sale 11.11, 12.12.
 * 3. Hỗ trợ hệ thống kích hoạt tự động các chiến dịch voucher tái kích cầu đúng thời điểm vàng.
 */

export class DynamicTimeWarping {
  /**
   * Tính khoảng cách DTW giữa hai chuỗi số (Time series 1D)
   * Sử dụng bảng quy hoạch động ma trận chi phí tích lũy
   * 
   * @param {number[]} seriesA - Chuỗi thời gian thứ nhất (VD: Khoảng cách ngày giữa các đơn của khách)
   * @param {number[]} seriesB - Chuỗi thời gian thứ hai (VD: Mẫu chu kỳ chuẩn)
   * @param {Function} [distFn] - Hàm tính khoảng cách giữa 2 điểm (mặc định |a - b|)
   * @returns {Object} Khoảng cách DTW, ma trận chi phí, và đường đi cong vênh tối ưu (Warping Path)
   */
  static computeDistance(seriesA, seriesB, distFn = (x, y) => Math.abs(x - y)) {
    if (!Array.isArray(seriesA) || !Array.isArray(seriesB) || seriesA.length === 0 || seriesB.length === 0) {
      throw new Error("Chuỗi dữ liệu phải là mảng không rỗng.");
    }

    const n = seriesA.length;
    const m = seriesB.length;

    // Khởi tạo ma trận chi phí tích lũy (n+1) x (m+1) với giá trị Infinity
    const dtw = Array.from({ length: n + 1 }, () => Array(m + 1).fill(Infinity));
    dtw[0][0] = 0;

    // Điền bảng quy hoạch động
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        const cost = distFn(seriesA[i - 1], seriesB[j - 1]);
        dtw[i][j] = cost + Math.min(
          dtw[i - 1][j],     // Chèn (Insertion)
          dtw[i][j - 1],     // Xóa (Deletion)
          dtw[i - 1][j - 1]  // Khớp (Match)
        );
      }
    }

    const totalDistance = Number(dtw[n][m].toFixed(4));
    // Khoảng cách chuẩn hóa theo độ dài đường đi (Normalized DTW Distance)
    const normalizedDistance = Number((totalDistance / (n + m)).toFixed(4));

    // Truy vết đường đi tối ưu (Optimal Warping Path) từ dtw[n][m] ngược về dtw[0][0]
    const path = [];
    let i = n;
    let j = m;

    while (i > 0 || j > 0) {
      path.unshift({ aIndex: i - 1, bIndex: j - 1 });
      if (i === 0) {
        j--;
      } else if (j === 0) {
        i--;
      } else {
        const minVal = Math.min(dtw[i - 1][j], dtw[i][j - 1], dtw[i - 1][j - 1]);
        if (minVal === dtw[i - 1][j - 1]) {
          i--;
          j--;
        } else if (minVal === dtw[i - 1][j]) {
          i--;
        } else {
          j--;
        }
      }
    }

    return {
      distance: totalDistance,
      normalizedDistance,
      pathLength: path.length,
      path
    };
  }

  /**
   * Phân loại mẫu hành vi mua sắm của người dùng bằng cách so sánh với các chuỗi hành vi chuẩn
   * 
   * @param {number[]} intervalsDays - Chuỗi khoảng cách ngày giữa các lần mua hàng [Δt1, Δt2, ...]
   * @returns {Object} Kết quả phân loại và khuyến nghị hành động
   */
  static classifyPurchasingPattern(intervalsDays) {
    if (!intervalsDays || intervalsDays.length === 0) {
      return { pattern: "NEW_CUSTOMER", riskScore: 0, recommendation: "Khách hàng mới, cần tặng voucher tân thủ 15%." };
    }

    // Các chuỗi mẫu chuẩn (Standard Archetypes)
    const templates = {
      LOYAL_ROUTINE: [5, 7, 6, 7, 5, 6],       // Mua đều đặn hàng tuần
      CHURNING_RISK: [7, 10, 18, 28, 45, 60],  // Khoảng cách ngày dãn rộng liên tục
      FLASH_SALE_HUNTER: [30, 1, 1, 29, 1, 30] // Dồn dập theo ngày hội sale hàng tháng
    };

    let bestPattern = "UNKNOWN";
    let minNormalizedDist = Infinity;

    for (const [name, template] of Object.entries(templates)) {
      const { normalizedDistance } = this.computeDistance(intervalsDays, template);
      if (normalizedDistance < minNormalizedDist) {
        minNormalizedDist = normalizedDistance;
        bestPattern = name;
      }
    }

    let riskLevel = "LOW";
    let recommendation = "";

    if (bestPattern === "CHURNING_RISK") {
      riskLevel = "HIGH";
      recommendation = "Cảnh báo: Chu kỳ mua sắm thưa dần! Kích hoạt ngay voucher giảm 30k để tái thu hút.";
    } else if (bestPattern === "LOYAL_ROUTINE") {
      riskLevel = "LOW";
      recommendation = "Khách hàng VIP mua sắm đều đặn. Thưởng Mini Xu x2 và cấp quyền Freeship không giới hạn.";
    } else {
      riskLevel = "MEDIUM";
      recommendation = "Khách hàng săn sale. Gửi thông báo nhắc hẹn trước 2 giờ khi chiến dịch Flash Sale mở màn.";
    }

    return {
      intervalsDays,
      detectedPattern: bestPattern,
      similarityScore: Number(Math.max(0, 100 - minNormalizedDist * 10).toFixed(1)),
      riskLevel,
      recommendation
    };
  }
}

export default {
  DynamicTimeWarping
};
