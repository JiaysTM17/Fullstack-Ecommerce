/**
 * adminAiCopilotEngine.js - Trí Tuệ Nhân Tạo & Trợ Lý Giám Sát Quản Trị Sàn (Admin Sentinel Copilot)
 * 
 * NGUYÊN TẮC AN TOÀN CỐT LÕI (SAFETY FIRST):
 * 1. Read-Only Intelligence: Đóng vai trò là trợ lý phân tích, tra cứu, đánh giá rủi ro và tổng hợp báo cáo.
 * 2. Zero-Destructive Guardrail: Tuyệt đối TỪ CHỐI mọi yêu cầu tự ý thay đổi quyền hạn, xóa database hoặc phá hủy dữ liệu.
 * 3. Audit Compliance: Mọi đề xuất đều tuân thủ quy chuẩn kiểm toán và Nghị định 52/2018/NĐ-CP về TMĐT.
 */

export const ADMIN_GUARDRAILS = {
  RESTRICTED_KEYWORDS: [
    'xóa database', 'xóa dữ liệu', 'xóa hết', 'drop database', 'drop table',
    'xóa sạch shop', 'xóa toàn bộ user', 'thay đổi quyền admin', 'cướp quyền',
    'bỏ qua kiểm toán', 'tắt bảo mật', 'hack hệ thống', 'reset trắng'
  ],
  SAFETY_MESSAGE: `🛡️ **CẢNH BÁO AN TOÀN HỆ THỐNG (ADMIN ZERO-DESTRUCTIVE GUARDRAIL)**:
Tôi là Trợ Lý Giám Sát Quản Trị Sàn (Admin Sentinel Copilot). Theo thiết kế bảo mật tối cao:
- Tôi **KHÔNG CÓ THẨM QUYỀN** thực hiện các thao tác phá hoại, xóa cơ sở dữ liệu hoặc can thiệp tước quyền của quản trị viên.
- Toàn bộ thao tác xóa gian hàng hoặc khóa tài khoản vi phạm phải được Super Admin phê duyệt trực tiếp trên giao diện Dashboard có ghi nhật ký kiểm toán (System Audit Trail).`
};

export const ADMIN_KNOWLEDGE_BASE = {
  platformFees: {
    commissionRate: 5, // 5% GMV sàn
    paymentProcessingFee: 2, // 2%
    escrowPeriodDays: 7, // Giữ tiền ký quỹ 7 ngày để xử lý đổi trả
  },
  taxRegulations: {
    decree: 'Nghị định 52/2018/NĐ-CP và Thông tư 40/2021/TT-BTC',
    withholdingTaxVat: '1.0% GTGT đối với doanh thu kinh doanh TMĐT',
    withholdingTaxPit: '1.5% TNCN đối với doanh thu dịch vụ',
    totalWithholdingRate: '2.5% tổng doanh thu cá nhân kinh doanh',
  },
  slaStandards: {
    targetOnTimeDelivery: 95.0,
    maxDisputeRate: 1.0,
    maxCancellationRate: 2.0,
  }
};

/**
 * Kiểm tra xem câu hỏi có vi phạm rào chắn an toàn phá hoại dữ liệu hay không
 */
export function checkAdminSafetyGuardrails(query) {
  if (!query) return { isSafe: true };
  const lower = query.toLowerCase();
  for (const kw of ADMIN_GUARDRAILS.RESTRICTED_KEYWORDS) {
    if (lower.includes(kw)) {
      return {
        isSafe: false,
        reason: 'RESTRICTED_DESTRUCTIVE_ACTION',
        message: ADMIN_GUARDRAILS.SAFETY_MESSAGE
      };
    }
  }
  return { isSafe: true };
}

/**
 * Bộ suy luận và sinh phản hồi độc quyền cho Admin Portal
 */
export function generateAdminCopilotResponse(query, context = {}) {
  const totalRevenue = Number(context.totalPlatformRevenue || context.totalRevenue || 0);
  const commission = Number(context.platformCommission || context.commission || 0);
  const shopsCount = Number(context.shopsCount || 0);
  const usersCount = Number(context.usersCount || 0);
  const withholdingTax = Number(context.withholdingTax || context.taxData?.totalWithholdingTax || 0);
  const fraudAnomaliesCount = Number(context.fraudAnomaliesCount || context.fraudData?.anomalies?.length || 0);
  const {
    slaMetrics = {},
    fraudData = {},
    taxData = {}
  } = context;

  // 1. Kiểm tra rào chắn an toàn (Safety Guardrails)
  const safetyCheck = checkAdminSafetyGuardrails(query);
  if (!safetyCheck.isSafe) {
    return {
      text: safetyCheck.message,
      type: 'warning',
      tag: 'BẢO MẬT HỆ THỐNG',
      suggestions: [
        'Tra cứu báo cáo GMV toàn sàn',
        'Kiểm tra radar gian lận buyer abuse',
        'Phân tích đối soát thuế Nghị định 52'
      ]
    };
  }

  const raw = query.toLowerCase().trim();

  // 2. Tra cứu Tài chính & Hoa hồng sàn (GMV, Commission, Doanh thu)
  if (/doanh số|gmv|doanh thu|hoa hồng|tiền sàn|phí sàn|lợi nhuận sàn/i.test(raw)) {
    const commVnd = commission || Math.round(totalRevenue * 0.05);
    return {
      text: `📊 **BÁO CÁO TÀI CHÍNH & HOA HỒNG TOÀN SÀN**:
- **Tổng Doanh Số Sàn (GMV)**: **${(totalRevenue).toLocaleString('vi-VN')}₫**
- **Doanh Thu Thuần Hoa Hồng Sàn (5%)**: **${commVnd.toLocaleString('vi-VN')}₫**
- **Tổng số gian hàng đóng góp**: **${shopsCount}** gian hàng
- **Chính sách trích thu**: Phí cố định 5% tính trên các đơn hàng hoàn tất thành công, không tính trên đơn hủy hoặc hoàn tiền.`,
      type: 'finance',
      tag: 'TÀI CHÍNH SÀN',
      suggestions: [
        'Đối soát nghĩa vụ thuế TMĐT',
        'Xem xếp hạng doanh số gian hàng',
        'Kiểm tra trạng thái ký quỹ dòng tiền'
      ]
    };
  }

  // 3. Tra cứu Thuế nhà thầu TMĐT (Tax Compliance)
  if (/thuế|nghị định 52|thông tư 40|vat|tncn|khấu trừ thuế|đối soát/i.test(raw)) {
    const totalTaxVal = withholdingTax || Math.round(totalRevenue * 0.025);
    const vatEst = Math.round(totalTaxVal * (1.0 / 2.5));
    const pitEst = totalTaxVal - vatEst;
    return {
      text: `⚖️ **BÁO CÁO TUÂN THỦ THUẾ TMĐT (NGHỊ ĐỊNH 52/2018/NĐ-CP & TT40/2021/TT-BTC)**:
- **Căn cứ pháp lý**: Sàn TMĐT có trách nhiệm khấu trừ, kê khai và nộp thuế thay cho người bán cá nhân theo định kỳ.
- **Thuế GTGT tạm tính (1.0%)**: **${vatEst.toLocaleString('vi-VN')}₫**
- **Thuế TNCN tạm tính (1.5%)**: **${pitEst.toLocaleString('vi-VN')}₫**
- **Tổng nghĩa vụ thuế sàn đối soát**: **${totalTaxVal.toLocaleString('vi-VN')}₫**
- **Khuyến nghị**: Toàn bộ dữ liệu doanh số được tự động đồng bộ sẵn sàng kết xuất báo cáo điện tử cho cơ quan Thuế quản lý trực tiếp.`,
      type: 'tax',
      tag: 'ĐỐI SOÁT THUẾ',
      suggestions: [
        'Xuất biên bản đối soát thuế định kỳ',
        'Kiểm tra danh sách shop đã khấu trừ',
        'Xem số dư ví chờ quyết toán'
      ]
    };
  }

  // 4. Radar phát hiện gian lận & Người mua bất thường (Fraud Radar / Buyer Abuse)
  if (/gian lận|bùng đơn|buyer abuse|radar|lừa đảo|bom hàng|đơn ảo|tài khoản xấu|bất thường/i.test(raw)) {
    const anomalyCount = fraudAnomaliesCount || (fraudData?.criticalCount ?? 0) || (fraudData?.mediumCount ?? 1);
    return {
      text: `🚨 **RADAR PHÁT HIỆN GIAN LẬN TOÀN SÀN (AI FRAUD GUARD)**:
- **Cảnh báo bất thường phát hiện**: **${anomalyCount}** trường hợp (hành vi bùng đơn hàng loạt hoặc lạm dụng mã giảm giá bất thường).
- **Cần theo dõi**: Tự động giám sát địa chỉ IP và lịch sử nhận hàng.
- **Biện pháp khuyến nghị**: 
  1. Yêu cầu thanh toán trước VietQR / Thẻ đối với tài khoản có tỷ lệ bom hàng > 40%.
  2. Tạm khóa quyền dùng voucher sàn nếu phát hiện dùng chung thiết bị/IP gian lận.
  3. Mọi quyết định xử lý thực tế do Quản trị viên kích hoạt trên Tab "Radar Gian Lận".`,
      type: 'radar',
      tag: 'RADAR GIAN LẬN',
      suggestions: [
        'Mở tab Radar Gian Lận để xem chi tiết',
        'Kiểm tra danh sách tài khoản đã bị khóa',
        'Đánh giá chất lượng vận hành sàn SLA'
      ]
    };
  }

  // 5. Đánh giá chất lượng vận hành & SLA giao hàng (Operational SLA)
  if (/sla|giao hàng|đúng hạn|khiếu nại|tranh chấp|vận hành sàn/i.test(raw)) {
    const onTime = slaMetrics?.onTimeRate ?? '97.4%';
    const avgDelivery = slaMetrics?.avgHours ?? '26.5 giờ';
    const dispute = slaMetrics?.disputeRate ?? '0.4%';
    return {
      text: `📈 **CHỈ SỐ VẬN HÀNH & CHẤT LƯỢNG DỊCH VỤ SÀN (SLA HEALTH)**:
- **Tỷ lệ giao đúng hạn (On-Time Delivery)**: **${onTime}** (Mục tiêu chuẩn: ≥ 95.0%).
- **Thời gian giao trung bình toàn sàn**: **${avgDelivery}**.
- **Tỷ lệ tranh chấp khiếu nại**: **${dispute}** (Rất thấp, đạt chuẩn an toàn sàn TMĐT).
- **Trạng thái hệ sinh thái SPX Express**: Đang vận hành ổn định, không có điểm nghẽn cục bộ tại các kho trung chuyển hub.`,
      type: 'sla',
      tag: 'CHỈ SỐ SLA',
      suggestions: [
        'Xem tình trạng xử lý đơn hàng các shop',
        'Kiểm tra thống kê khiếu nại đổi trả',
        'Soạn thảo thông báo phát sóng'
      ]
    };
  }

  // 6. Soạn thảo thông báo phát sóng toàn sàn (Broadcast Assistant)
  if (/soạn|phát sóng|thông báo|gửi tin nhắn|banner/i.test(raw)) {
    return {
      text: `📢 **TRỢ LÝ SOẠN THẢO THÔNG BÁO PHÁT SÓNG TOÀN SÀN**:
Dưới đây là mẫu bản tin đề xuất theo chuẩn sàn TMĐT:

**Tiêu đề**: [THÔNG BÁO QUAN TRỌNG] Nâng cấp hệ thống & Siêu Sale Shopee Mall  
**Nội dung**:  
*"Kính gửi Quý Người Bán & Quý Khách Hàng, sàn Mini Shopee triển khai chuỗi sự kiện Siêu Khuyến Mãi Hè với gói Freeship Xtra 0Đ và cam kết giao hàng hỏa tốc 2H. Mọi yêu cầu hỗ trợ đối soát xin liên hệ tổng đài 24/7."*

*(Bấm nút "Phát Sóng Thông Báo" trên Header để dán và gửi toàn sàn ngay).*`,
      type: 'broadcast',
      tag: 'SOẠN THẢO THÔNG BÁO',
      suggestions: [
        'Mở khung Phát Sóng Thông Báo',
        'Xem lại nhật ký thông báo cũ',
        'Kiểm tra lượng người dùng nhận tin'
      ]
    };
  }

  // 7. Phản hồi chung hỗ trợ Quản Trị Viên (Default Governance Copilot Overview)
  return {
    text: `Chào Quản Trị Viên! Tôi là **Admin Sentinel AI** - Trợ lý số chuyên trách giám sát, phân tích số liệu và đảm bảo tuân thủ vận hành sàn TMĐT:
- 📊 **Tra cứu GMV & Hoa hồng**: Phân tích doanh số và hoa hồng sàn 5%.
- ⚖️ **Tuân thủ thuế**: Đối soát số thuế TNCN/GTGT theo Nghị định 52.
- 🚨 **Radar gian lận**: Quét tài khoản bất thường và cảnh báo nguy cơ bom hàng.
- 📈 **Giám sát SLA**: Đánh giá tỷ lệ giao hàng đúng hạn và khiếu nại.
- 🛡️ **Bảo vệ dữ liệu**: Hoạt động theo nguyên tắc Read-Only an toàn, không can thiệp phá hủy dữ liệu.`,
    type: 'general',
    tag: 'TỔNG QUAN GIÁM SÁT',
    suggestions: [
      'Báo cáo doanh số GMV toàn sàn',
      'Kiểm tra nghĩa vụ thuế Nghị định 52',
      'Quét radar tài khoản gian lận',
      'Đánh giá chất lượng vận hành SLA'
    ]
  };
}
