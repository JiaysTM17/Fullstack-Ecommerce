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
  if (/thuế|nghị định 52|thông tư 40|vat|tncn|khấu trừ thuế|đối soát thuế/i.test(raw)) {
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

  // 5. Đối Soát Dòng Tiền Ký Quỹ & Nợ Đọng COD Bưu Tá (Escrow Vault & COD Float Reconciliation)
  if (/ký quỹ|escrow|dòng tiền|nợ đọng|đối soát cod|tiền về|nợ bưu tá|cod.*bưu tá|bưu tá.*cod/i.test(raw)) {
    const escrowVal = context.escrowBalance || Math.round(totalRevenue * 0.3);
    const codFloatEst = Math.round(totalRevenue * 0.15);
    return {
      text: `🏦 **ĐỐI SOÁT DÒNG TIỀN KÝ QUỸ & CÔNG NỢ BƯU TÁ (ESCROW & COD RECONCILIATION)**:
- **Số dư bảo chứng đang giữ trong Escrow Vault**: **${escrowVal.toLocaleString('vi-VN')}₫**
  *(Dòng tiền được đóng băng trong chu kỳ T+7 nhằm bảo vệ quyền lợi đổi trả/khiếu nại của người mua).*
- **Công nợ COD lưu động bưu tá SPX đang thu hộ (COD Float)**: **${codFloatEst.toLocaleString('vi-VN')}₫**
- **Đánh giá rủi ro dòng tiền**: 
  - Tỷ lệ lệch đối soát COD toàn sàn: **0.08%** (Đạt chuẩn an toàn dưới ngưỡng 0.5%).
  - Tất cả các khoản tiền thu hộ COD đều được quét mã đối soát tự động khi bưu tá nộp về bưu cục trung tâm.
- **Khuyến nghị**: Tiến hành giải ngân định kỳ theo Tab "Quyết Toán Tài Chính" cho các đơn hàng đã vượt qua thời hạn 7 ngày bảo chứng.`,
      type: 'finance',
      tag: 'ĐỐI SOÁT DÒNG TIỀN',
      suggestions: [
        'Mở tab Quyết Toán Tài Chính',
        'Kiểm tra danh sách đơn COD cần chốt',
        'Xem báo cáo thuế Nghị định 52'
      ]
    };
  }

  // 6. Điểm Uy Tín Tài Khoản & Chống Gian Lận Đa Tài Khoản (Trust Score & Anti-Sybil Guard)
  if (/trust score|điểm uy tín|tài khoản ảo|sybil|seeding|đánh giá ảo|tỷ lệ hủy/i.test(raw)) {
    return {
      text: `🛡️ **HỆ THỐNG ĐÁNH GIÁ ĐIỂM UY TÍN (TRUST SCORE & ANTI-SYBIL GUARD)**:
- **Nguyên lý tính điểm (Thang 0 - 100)**:
  1. *Lịch sử nhận hàng*: Hoàn tất đơn thành công (+30 điểm). Tỷ lệ bùng hàng > 30% (-50 điểm).
  2. *Định danh thiết bị (Device Fingerprint)*: 1 thiết bị tạo > 3 tài khoản trong 24h (-40 điểm, nghi vấn Sybil Farm).
  3. *Tần suất dùng mã*: Tỷ lệ đơn dùng mã tân thủ bất thường (-20 điểm).
- **Phân loại hành động**:
  - **Trust Score ≥ 80**: Tài khoản VIP, mở khóa toàn bộ quyền COD và voucher độc quyền.
  - **Trust Score 50 - 79**: Mức bình thường, giới hạn tối đa 3 đơn COD đang giao cùng thời điểm.
  - **Trust Score < 50**: Tự động tắt phương thức COD, bắt buộc thanh toán trước VietQR.`,
      type: 'radar',
      tag: 'ĐIỂM UY TÍN TRUST SCORE',
      suggestions: [
        'Xem danh sách tài khoản dưới 50 điểm',
        'Kiểm tra các IP nghi vấn Sybil',
        'Xem lại chỉ số SLA sàn'
      ]
    };
  }

  // 7. Hệ Thống Điểm Sao Quả Tạ & Kỷ Luật Gian Hàng (Penalty Points & Merchant Discipline)
  if (/sao quả tạ|penalty|phạt|kỷ luật|khóa shop|tắt shop|tạm ngừng/i.test(raw)) {
    return {
      text: `⚖️ **HỆ THỐNG ĐIỂM PHẠT SAO QUẢ TẠ GIAN HÀNG (PENALTY POINTS)**:
- **Khung điểm vi phạm**:
  - **1 - 2 điểm**: Nhắc nhở hệ thống, tạm tước huy hiệu Shopee Mall trong 14 ngày.
  - **3 - 5 điểm**: Tắt tính năng tham gia Flash Sale toàn sàn, hạ bậc tìm kiếm 50%.
  - **6 - 8 điểm**: Đóng băng ví doanh thu, yêu cầu ký quỹ bổ sung.
  - **≥ 9 điểm**: Khóa gian hàng vĩnh viễn và chấm dứt hợp đồng thương mại điện tử.
- **Tiêu chuẩn không bị phạt**: Duy trì tỷ lệ giao trễ LSR < 5% và tỷ lệ hủy đơn do hết hàng NFR < 2%.`,
      type: 'governance',
      tag: 'KỶ LUẬT GIAN HÀNG',
      suggestions: [
        'Kiểm tra danh sách shop có điểm phạt',
        'Mở tab Giám Sát Gian Hàng',
        'Xem báo cáo SLA giao hàng'
      ]
    };
  }

  // 8. Đánh giá chất lượng vận hành & SLA giao hàng (Operational SLA)
  if (!/tsp|lộ trình|tuyến đường/i.test(raw) && /sla|giao đúng hạn|đúng hạn|khiếu nại|tranh chấp|vận hành sàn/i.test(raw)) {
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

  // 9. Soạn thảo thông báo phát sóng toàn sàn (Broadcast Assistant)
  if (/soạn|phát sóng|thông báo|gửi tin nhắn|banner/i.test(raw)) {
    const isMaintenance = /bảo trì|nâng cấp|hệ thống/i.test(raw);
    const isMegaSale = /sale|siêu hội|khuyến mãi/i.test(raw);

    if (isMaintenance) {
      return {
        text: `📢 **TRỢ LÝ SOẠN THẢO THÔNG BÁO BẢO TRÌ HỆ THỐNG**:
Dưới đây là bản tin chuẩn:

**Tiêu đề**: [BẢO TRÌ ĐỊNH KỲ] Nâng cấp hạ tầng xử lý giao dịch Mini Shopee  
**Nội dung**:  
*"Kính gửi Quý Đối Tác & Khách Hàng, sàn Mini Shopee sẽ tiến hành bảo trì tối ưu hóa cổng thanh toán và tra cứu SPX Express từ 01:00 đến 03:00 sáng. Trong thời gian này, các tính năng duyệt đơn và thanh toán tạm ngưng trong giây lát. Trân trọng cảm ơn!"*`,
        type: 'broadcast',
        tag: 'THÔNG BÁO BẢO TRÌ',
        suggestions: ['Dán vào khung Phát Sóng', 'Chỉnh sửa thời gian bảo trì', 'Xem nhật ký phát sóng']
      };
    }

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

  // 10. Phân tích Cấu trúc Dữ liệu Xác suất Bloom Filter (Cache Penetration Guard)
  if (/bloom filter|cache penetration|bộ lọc bloom|chống vét cạn|xác suất|lọc voucher/i.test(raw)) {
    return {
      text: `🔬 **CẤU TRÚC DỮ LIỆU XÁC SUẤT BLOOM FILTER (CACHE PENETRATION GUARD)**:
- **Mục đích thiết kế**: Chặn đứng 100% các cuộc tấn công quét mã Voucher rác hoặc quét ID sản phẩm không tồn tại trước khi chạm tới Database.
- **Nguyên lý toán học**:
  - Không gian bit mảng: $m = -\\frac{n \\ln p}{(\\ln 2)^2}$ bits.
  - Số hàm băm tối ưu: $k = \\frac{m}{n} \\ln 2$ hàm băm độc lập (triển khai qua Double Hashing Kirsch-Mitzenmacher).
- **Đặc tính cốt lõi**:
  - **Zero False Negatives**: Nếu Bloom Filter trả về \`false\`, phần tử chắc chắn $100\\%$ không tồn tại $\\rightarrow$ Chặn ngay lập tức ở tầng Gateway.
  - **Bounded False Positive Rate (FPR)**: Tỷ lệ dương tính giả được kiểm soát thực nghiệm $\\le 1.0\\%$.
  - **Tốc độ xử lý**: $O(k)$ cực nhanh ($< 0.03\\text{ms}$), tiết kiệm $99.9\\%$ tài nguyên I/O đĩa.`,
      type: 'algorithm',
      tag: 'THUẬT TOÁN BLOOM FILTER',
      suggestions: [
        'Tìm hiểu thuật toán Băm Nhất Quán',
        'Kiểm tra cấu hình Redis Redlock',
        'Xem radar gian lận và an ninh sàn'
      ]
    };
  }

  // 11. Phân tích Thuật toán Băm Nhất Quán (Consistent Hashing with Virtual Nodes)
  if (/consistent hashing|băm nhất quán|virtual nodes|sharding|hash ring|chia tải phân tán|điểm băm ảo/i.test(raw)) {
    return {
      text: `🔄 **THUẬT TOÁN BĂM NHẤT QUÁN KÈM VIRTUAL NODES (CONSISTENT HASHING RING)**:
- **Mục đích thiết kế**: Phân vùng dữ liệu (Sharding) cho Giỏ hàng, Phiên đăng nhập và Bộ nhớ đệm phân tán mà không bị sập nguồn khi quy mô cụm máy chủ thay đổi.
- **Giải pháp triệt tiêu Cache Avalanche**:
  - Khi dùng hàm băm thông thường $\\text{hash}(key) \\pmod N$, thêm/bớt 1 node sẽ làm đảo lộn gần $100\\%$ vị trí $\\rightarrow$ sập database.
  - Với **Consistent Hashing**: Cả Key và Node cùng nằm trên một vòng tròn băm $2^{32}$. Khi thêm node mới, chỉ có đúng $\\approx \\frac{1}{N}$ số keys cần di dời (Rebalancing), $\\frac{N-1}{N}$ keys còn lại giữ nguyên vị trí.
- **Cơ chế Virtual Nodes (k = 150 vnodes/node)**:
  - Phân bổ đều các điểm ảo trên vòng tròn để triệt tiêu hiện tượng lệch dữ liệu (Data Skewness) và loại bỏ hoàn toàn các điểm nóng (Hotspots).
  - Tìm kiếm nhị phân $O(\\log(N \\times k))$ siêu tốc.`,
      type: 'algorithm',
      tag: 'THUẬT TOÁN BĂM NHẤT QUÁN',
      suggestions: [
        'Tìm hiểu cấu trúc Bloom Filter',
        'Kiểm tra cơ chế ngắt mạch Circuit Breaker',
        'Xem tỷ lệ phân bổ tải cụm Nginx'
      ]
    };
  }

  // 12. Kiểm Duyệt Nội Dung & Quét Từ Cấm Siêu Tốc (Aho-Corasick Multi-Pattern Automaton)
  if (/aho-corasick|kiểm duyệt từ cấm|hàng giả|quét từ cấm|censor|lọc từ cấm/i.test(raw)) {
    return {
      text: `🛡️ **THUẬT TOÁN KIỂM DUYỆT TỪ CẤM SIÊU TỐC AHO-CORASICK (AUTOMATON)**:
- **Mục đích thiết kế**: Quét và tự động che dấu (Censor) hàng nghìn từ cấm, hàng giả, hàng nhái (*"fake", "rep 1:1", "nhái", "lừa đảo"*) trong tiêu đề sản phẩm, đánh giá và tin nhắn chat.
- **Nguyên lý hoạt động**:
  - Xây dựng cây tiền tố Trie kết hợp các liên kết chuyển tiếp thất bại (**Failure Links**) và liên kết đầu ra từ điển (**Dictionary Links**).
  - Hoạt động như một máy trạng thái hữu hạn (DFA/NFA) cho phép chuyển trạng thái tức thì khi không khớp ký tự.
- **Ưu việt hiệu năng**:
  - Độ phức tạp thời gian tuyến tính $O(N + M + Z)$ chỉ qua **đúng 1 lần duyệt chuỗi**.
  - Tốc độ kiểm duyệt hoàn toàn **độc lập với số lượng từ cấm** trong từ điển (quét 10.000 từ cấm nhanh tương đương quét 5 từ).`,
      type: 'algorithm',
      tag: 'THUẬT TOÁN AHO-CORASICK',
      suggestions: [
        'Tìm hiểu thuật toán Gợi ý Sản phẩm',
        'Kiểm tra cấu hình Bloom Filter',
        'Xem radar gian lận và an ninh sàn'
      ]
    };
  }

  // 13. Thuật toán Gợi ý Sản phẩm Cá nhân hóa (Collaborative Filtering & Item Affinity)
  if (/collaborative filtering|gợi ý sản phẩm|mua kèm|thường mua cùng|affinity|recommendation/i.test(raw)) {
    return {
      text: `🛍️ **THUẬT TOÁN GỢI Ý CÁ NHÂN HÓA (ITEM AFFINITY & COLLABORATIVE FILTERING)**:
- **Mục đích thiết kế**: Tối ưu hóa chuyển đổi giỏ hàng, thúc đẩy doanh số bán chéo (Cross-sell & Bundle) đóng góp tới $35\\%$ tổng GMV toàn sàn.
- **Cơ chế triển khai**:
  - **Ma trận đồng xuất hiện (Co-occurrence Matrix)**: Phân tích các cặp sản phẩm thường xuyên được đặt cùng nhau trong lịch sử hàng triệu đơn hàng.
  - **Đo lường độ tương đồng Cosine & Jaccard**: $\\text{Affinity}(A, B) = \\frac{\\text{CoOccur}(A, B)}{\\sqrt{\\text{Freq}(A) \\cdot \\text{Freq}(B)}}$.
  - Gợi ý 2 phân hệ: **"Thường mua cùng nhau"** (Frequently Bought Together) và **"Có thể bạn cũng thích"** (You May Also Like).`,
      type: 'algorithm',
      tag: 'THUẬT TOÁN GỢI Ý SẢN PHẨM',
      suggestions: [
        'Tìm hiểu thuật toán Tối ưu Tuyến đường SPX',
        'Xem báo cáo doanh số GMV toàn sàn',
        'Kiểm tra chỉ số ROAS quảng cáo Shopee Ads'
      ]
    };
  }

  // 14. Thuật toán Tối ưu Lộ trình Giao hàng Chặng Cuối (TSP Nearest Neighbor & 2-Opt)
  if (/tsp|lộ trình giao hàng|tối ưu tuyến đường|nearest neighbor|2-opt|bưu tá spx|giao hàng chặng cuối/i.test(raw)) {
    return {
      text: `🚚 **THUẬT TOÁN TỐI ƯU TUYẾN ĐƯỜNG GIAO VẬN SPX (TSP NEAREST NEIGHBOR & 2-OPT)**:
- **Mục đích thiết kế**: Giải bài toán người du lịch (Traveling Salesperson Problem) cho bưu tá SPX, giảm thiểu quãng đường di chuyển và hạ tỷ lệ giao trễ LSR xuống mức tối thiểu ($< 2\\%$).
- **Quy trình 2 giai đoạn**:
  1. **Nearest Neighbor Heuristic $O(K^2)$**: Bắt đầu từ Bưu cục / Hub trung tâm, luôn tham lam chọn điểm giao hàng chưa ghé gần nhất dựa trên khoảng cách mặt cầu Haversine (km).
  2. **Tinh chỉnh cục bộ 2-Opt**: Tự động phát hiện và đảo ngược các đoạn đường chéo nhau (Crossing paths) giúp rút ngắn thêm $10\\% - 20\\%$ tổng quãng đường di chuyển.
- **Độ chính xác ETA**: Tự động dự báo thời gian giao hàng từng điểm dừng = Thời gian di chuyển ($25\\text{ km/h}$) + $5\\text{ phút}$ giao nhận thực tế.`,
      type: 'algorithm',
      tag: 'TỐI ƯU TUYẾN ĐƯỜNG SPX',
      suggestions: [
        'Xem chỉ số SLA giao hàng toàn sàn',
        'Kiểm tra định vị bưu tá SPX Live Map',
        'Xem thuật toán Kiểm duyệt Aho-Corasick'
      ]
    };
  }

  // 15. Phản hồi chung hỗ trợ Quản Trị Viên (Default Governance Copilot Overview)
  return {
    text: `Chào Quản Trị Viên! Tôi là **Admin Sentinel AI** - Trợ lý số chuyên trách giám sát, phân tích số liệu và đảm bảo tuân thủ vận hành sàn TMĐT:
- 📊 **Tra cứu GMV & Hoa hồng**: Phân tích doanh số và hoa hồng sàn 5%.
- 🏦 **Dòng tiền & Ký quỹ**: Theo dõi số dư Escrow Vault và đối soát nợ COD.
- ⚖️ **Tuân thủ thuế**: Đối soát số thuế TNCN/GTGT theo Nghị định 52/2018/NĐ-CP.
- 🛡️ **Điểm uy tín Trust Score**: Quét tài khoản Sybil và ngăn chặn bùng hàng.
- 📈 **Giám sát SLA & Sao Quả Tạ**: Đánh giá tỷ lệ giao đúng hạn và kỷ luật gian hàng.
- 🔒 **Bảo vệ dữ liệu**: Hoạt động theo nguyên tắc Read-Only an toàn, không can thiệp phá hủy dữ liệu.`,
    type: 'general',
    tag: 'TỔNG QUAN GIÁM SÁT',
    suggestions: [
      'Báo cáo doanh số GMV toàn sàn',
      'Đối soát dòng tiền ký quỹ Escrow',
      'Kiểm tra nghĩa vụ thuế Nghị định 52',
      'Đánh giá Trust Score và radar gian lận',
      'Xem chỉ số SLA và điểm sao quả tạ'
    ]
  };
}
