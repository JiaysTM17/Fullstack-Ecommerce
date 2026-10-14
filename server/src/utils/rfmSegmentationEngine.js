/**
 * RFM Customer Segmentation & Customer Lifetime Value (CLV) Engine
 * Hệ thống sàn TMĐT Mini Shopee Multi-Vendor (Phase 12 - Feature 159)
 * 
 * Vấn đề:
 * Trong quản trị sàn và tiếp thị của Người Bán:
 * 1. Không thể áp dụng cùng một chiến dịch khuyến mãi hoặc mức voucher đại trà cho mọi người mua.
 *    Lãng phí ngân sách marketing và làm giảm giá trị thương hiệu.
 * 2. Cần nhận diện sớm các khách hàng VIP có nguy cơ rời bỏ (At-Risk / Can't Lose Them)
 *    và tự động nuôi dưỡng các khách hàng tiềm năng (Potential Loyalists).
 * 
 * Nguyên lý Thuật Toán RFM:
 * Phân tích hành vi mua sắm khách hàng dựa trên 3 trục đo lường chuẩn hóa:
 * 1. Recency ($R$): Số ngày kể từ đơn hàng thành công gần nhất. (Thời gian càng ngắn điểm càng cao 1-5).
 * 2. Frequency ($F$): Tổng số đơn hàng đã hoàn thành trong chu kỳ quan sát. (Tần suất càng cao điểm càng cao 1-5).
 * 3. Monetary ($M$): Tổng doanh số chi tiêu thực tế (GMV). (Giá trị càng lớn điểm càng cao 1-5).
 * 
 * Ma trận 11 Phân khúc Khách Hàng Chuẩn TMĐT (Shopee Standard Segment Matrix):
 * - Champions (Khách Hàng Thượng Khách VIP)
 * - Loyal Customers (Khách Hàng Trung Thành)
 * - Potential Loyalists (Khách Hàng Tiềm Năng)
 * - Recent / New Customers (Khách Hàng Mới)
 * - Promising (Khách Hàng Triển Vọng)
 * - Customers Needing Attention (Khách Cần Chăm Sóc)
 * - About to Sleep (Khách Sắp Ngủ Đông)
 * - At Risk (Khách Hàng Nguy Cơ Rời Bỏ Cao)
 * - Can't Lose Them (Khách VIP Cần Giữ Chân Khẩn Cấp)
 * - Hibernating (Khách Hàng Đang Ngủ Đông)
 * - Lost (Khách Hàng Đã Mất)
 * 
 * Tính toán Customer Lifetime Value (CLV):
 * Dự báo giá trị trọn đời kỳ vọng dựa trên AOV (Average Order Value), tần suất đặt hàng
 * và tỷ lệ giữ chân (Retention Rate).
 */

export const RFM_SEGMENT_RULES = [
  {
    code: "CHAMPIONS",
    title: "Khách Hàng Thượng Khách (Champions)",
    description: "Khách hàng mua thường xuyên nhất, chi tiêu lớn nhất và vừa đặt hàng gần đây.",
    action: "Tri ân quà tặng đặc biệt, cấp huy hiệu VIP Shopee Mall, quyền lợi miễn phí vận chuyển trọn đời.",
    match: (r, f, m) => r >= 4 && f >= 4 && m >= 4,
  },
  {
    code: "LOYAL_CUSTOMERS",
    title: "Khách Hàng Trung Thành (Loyal Customers)",
    description: "Mua sắm đều đặn, phản hồi tích cực và có giá trị đơn hàng ổn định.",
    action: "Upsell các sản phẩm phân khúc cao hơn, tích điểm Mini Xu x2, mời đánh giá sản phẩm có quà.",
    match: (r, f, m) => r >= 3 && f >= 3 && m >= 3,
  },
  {
    code: "POTENTIAL_LOYALISTS",
    title: "Khách Hàng Tiềm Năng (Potential Loyalists)",
    description: "Khách hàng mới mua 2-3 đơn gần đây với số tiền khá tốt.",
    action: "Gợi ý gói combo Mua Kèm Deal Sốc, tặng voucher bậc thang cho đơn kế tiếp.",
    match: (r, f, m) => r >= 4 && f >= 2 && f <= 3,
  },
  {
    code: "NEW_CUSTOMERS",
    title: "Khách Hàng Mới (New Customers)",
    description: "Vừa có đơn hàng đầu tiên gần đây, đang trải nghiệm sàn.",
    action: "Hỗ trợ hướng dẫn sử dụng, gửi voucher tân thủ giảm 15% cho đơn thứ hai.",
    match: (r, f, m) => r >= 4 && f === 1,
  },
  {
    code: "PROMISING",
    title: "Khách Hàng Triển Vọng (Promising)",
    description: "Đã mua đơn hàng cách đây không lâu, giá trị đơn hàng trung bình.",
    action: "Tặng voucher Freeship Max và thông báo Flash Sale hàng ngày để tạo thói quen mở app.",
    match: (r, f, m) => r === 3 && f <= 2,
  },
  {
    code: "NEED_ATTENTION",
    title: "Khách Hàng Cần Chú Ý (Need Attention)",
    description: "Đã từng mua nhiều đơn nhưng tần suất đang chậm lại hơn 1 tháng qua.",
    action: "Gửi thông báo đẩy về các sản phẩm mới trong danh mục yêu thích, ưu đãi có thời hạn 48h.",
    match: (r, f, m) => r === 3 && f >= 3,
  },
  {
    code: "ABOUT_TO_SLEEP",
    title: "Khách Hàng Sắp Ngủ Đông (About to Sleep)",
    description: "Đã hơn 2 tháng chưa phát sinh đơn mới, nguy cơ quên mất sàn.",
    action: "Gửi thông báo 'Mini Shopee nhớ bạn' kèm voucher độc quyền giảm 20k.",
    match: (r, f, m) => r === 2 && f <= 2,
  },
  {
    code: "AT_RISK",
    title: "Khách Hàng Nguy Cơ Rời Bỏ (At Risk)",
    description: "Từng mua rất nhiều đơn và chi nhiều tiền, nhưng đã lâu không quay lại.",
    action: "Cảnh báo khẩn cấp: Gửi voucher chiết khấu sâu 30-50k, nhân viên CSKH liên hệ chăm sóc.",
    match: (r, f, m) => r <= 2 && f >= 3 && m >= 3,
  },
  {
    code: "CANT_LOSE_THEM",
    title: "Khách VIP Không Thể Mất (Can't Lose Them)",
    description: "Từng là khách hàng chi tiêu lớn nhất sàn, nhưng thời gian qua hoàn toàn vắng bóng.",
    action: "Kích hoạt chiến dịch Re-engagement đặc quyền: Tặng combo quà tặng trực tiếp từ sàn.",
    match: (r, f, m) => r === 1 && f >= 4 && m >= 4,
  },
  {
    code: "HIBERNATING",
    title: "Khách Hàng Ngủ Đông (Hibernating)",
    description: "Lần mua cuối cách đây nhiều tháng, tần suất mua ít và chi tiêu thấp.",
    action: "Chỉ gửi thông báo các chiến dịch Mega Sale lớn (11.11, 12.12), sản phẩm xả kho giá sốc.",
    match: (r, f, m) => r <= 2 && f <= 2,
  },
  {
    code: "LOST",
    title: "Khách Hàng Đã Mất (Lost)",
    description: "Chỉ mua 1 đơn cách đây rất lâu với giá trị thấp và không bao giờ quay lại.",
    action: "Không lãng phí ngân sách quảng cáo cá nhân hóa. Chỉ tiếp cận qua chiến dịch tiếp thị đại trà.",
    match: (r, f, m) => true, // Fallback mặc định
  },
];

/**
 * Trình giải thuật toán phân khúc khách hàng RFM & CLV
 */
export class RFMSegmentationEngine {
  constructor(referenceDate = new Date()) {
    this.referenceDate = new Date(referenceDate);
  }

  /**
   * Tính toán điểm Recency (1 - 5) dựa trên số ngày kể từ lần mua gần nhất
   */
  calculateRecencyScore(daysSinceLastPurchase) {
    const days = Math.max(0, Number(daysSinceLastPurchase) || 0);
    if (days <= 14) return 5;
    if (days <= 30) return 4;
    if (days <= 60) return 3;
    if (days <= 90) return 2;
    return 1;
  }

  /**
   * Tính toán điểm Frequency (1 - 5) dựa trên tổng số đơn hoàn thành
   */
  calculateFrequencyScore(orderCount) {
    const count = Math.max(0, Number(orderCount) || 0);
    if (count >= 15) return 5;
    if (count >= 8) return 4;
    if (count >= 4) return 3;
    if (count >= 2) return 2;
    if (count === 1) return 1;
    return 1;
  }

  /**
   * Tính toán điểm Monetary (1 - 5) dựa trên tổng chi tiêu (VND)
   */
  calculateMonetaryScore(totalSpentVnd) {
    const spent = Math.max(0, Number(totalSpentVnd) || 0);
    if (spent >= 5000000) return 5;
    if (spent >= 2000000) return 4;
    if (spent >= 800000) return 3;
    if (spent >= 300000) return 2;
    return 1;
  }

  /**
   * Phân tích RFM cho một khách hàng cụ thể
   * @param {Object} customer { id, name, orders: [{ createdAt, totalAmount, status }] }
   */
  analyzeCustomer(customer) {
    const customerId = customer.id || customer._id || "anon";
    const customerName = customer.name || customer.fullName || "Khách Hàng";
    const orders = (customer.orders || []).filter(
      (o) => o.status === "DELIVERED" || o.status === "COMPLETED" || !o.status
    );

    if (orders.length === 0) {
      return {
        customerId,
        customerName,
        recencyDays: Infinity,
        orderCount: 0,
        totalSpentVnd: 0,
        averageOrderValue: 0,
        rScore: 1,
        fScore: 1,
        mScore: 1,
        rfmCode: "111",
        rfmScore: 3,
        segment: RFM_SEGMENT_RULES.find((s) => s.code === "LOST"),
        projectedCLV: 0,
      };
    }

    // 1. Tính Recency: Số ngày kể từ đơn mới nhất
    let latestOrderDate = new Date(0);
    let totalSpent = 0;

    for (const o of orders) {
      const orderDate = new Date(o.createdAt || o.date || this.referenceDate);
      if (orderDate > latestOrderDate) {
        latestOrderDate = orderDate;
      }
      totalSpent += Number(o.totalAmount || o.total || 0);
    }

    const diffTime = Math.max(0, this.referenceDate.getTime() - latestOrderDate.getTime());
    const recencyDays = Math.floor(diffTime / (1000 * 3600 * 24));
    const orderCount = orders.length;
    const averageOrderValue = Math.round(totalSpent / orderCount);

    // 2. Tính điểm R, F, M
    const rScore = this.calculateRecencyScore(recencyDays);
    const fScore = this.calculateFrequencyScore(orderCount);
    const mScore = this.calculateMonetaryScore(totalSpent);

    // 3. Khớp phân khúc khách hàng
    let matchedSegment = RFM_SEGMENT_RULES.find((rule) => rule.match(rScore, fScore, mScore));
    if (!matchedSegment) {
      matchedSegment = RFM_SEGMENT_RULES[RFM_SEGMENT_RULES.length - 1]; // Fallback to LOST
    }

    // 4. Ước tính CLV (Customer Lifetime Value) dự kiến trong 12 tháng tới
    // CLV = AOV * Dự báo số đơn hàng năm tới (dựa trên tần suất hiện tại và hệ số giữ chân theo phân khúc)
    const retentionMultipliers = {
      CHAMPIONS: 1.8,
      LOYAL_CUSTOMERS: 1.5,
      POTENTIAL_LOYALISTS: 1.3,
      NEW_CUSTOMERS: 1.1,
      PROMISING: 1.0,
      NEED_ATTENTION: 0.7,
      ABOUT_TO_SLEEP: 0.4,
      AT_RISK: 0.3,
      CANT_LOSE_THEM: 0.2,
      HIBERNATING: 0.1,
      LOST: 0.05,
    };

    const multiplier = retentionMultipliers[matchedSegment.code] || 1.0;
    const projectedAnnualOrders = Math.max(1, Math.round(orderCount * multiplier));
    const projectedCLV = averageOrderValue * projectedAnnualOrders;

    return {
      customerId,
      customerName,
      recencyDays,
      orderCount,
      totalSpentVnd: totalSpent,
      averageOrderValue,
      rScore,
      fScore,
      mScore,
      rfmCode: `${rScore}${fScore}${mScore}`,
      rfmScore: rScore + fScore + mScore,
      segment: {
        code: matchedSegment.code,
        title: matchedSegment.title,
        description: matchedSegment.description,
        recommendedAction: matchedSegment.action,
      },
      projectedCLV,
    };
  }

  /**
   * Phân tích tổng thể toàn bộ danh sách khách hàng của sàn hoặc gian hàng
   * @param {Array<Object>} customers Danh sách khách hàng kèm lịch sử đơn
   */
  analyzeBatch(customers = []) {
    const analysisList = customers.map((c) => this.analyzeCustomer(c));
    const segmentCounts = {};
    let totalGMV = 0;
    let totalProjectedCLV = 0;

    for (const rule of RFM_SEGMENT_RULES) {
      segmentCounts[rule.code] = 0;
    }

    for (const a of analysisList) {
      segmentCounts[a.segment.code] = (segmentCounts[a.segment.code] || 0) + 1;
      totalGMV += a.totalSpentVnd;
      totalProjectedCLV += a.projectedCLV;
    }

    const totalCustomers = analysisList.length;
    const segmentBreakdown = Object.keys(segmentCounts).map((code) => {
      const rule = RFM_SEGMENT_RULES.find((r) => r.code === code);
      const count = segmentCounts[code];
      const pct = totalCustomers > 0 ? Number(((count / totalCustomers) * 100).toFixed(1)) : 0;
      return {
        code,
        title: rule ? rule.title : code,
        count,
        percentage: pct,
        recommendedAction: rule ? rule.action : "",
      };
    });

    return {
      totalCustomers,
      totalHistoricalGMV: totalGMV,
      totalProjectedCLV,
      averageCLV: totalCustomers > 0 ? Math.round(totalProjectedCLV / totalCustomers) : 0,
      segmentBreakdown,
      customers: analysisList,
    };
  }
}
