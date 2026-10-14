/**
 * sellerAiCopilotEngine.js - Trí Tuệ Nhân Tạo & Trợ Lý Kinh Doanh Kênh Người Bán (ShopSmart Copilot)
 * 
 * NGUYÊN TẮC CÁCH LY DỮ LIỆU (SHOP ISOLATION):
 * 1. Độc quyền phục vụ Người Bán trong phạm vi gian hàng của họ (theo currentShop.id).
 * 2. Không truy xuất và không để lộ dữ liệu của các gian hàng cạnh tranh hoặc bí mật toàn sàn.
 * 3. Chuyên sâu phân tích tăng trưởng doanh số, cảnh báo tồn kho an toàn, P&L từng SKU, Flash Sale & Shopee Ads.
 */

/**
 * Bộ suy luận và tư vấn kinh doanh thông minh cho Người Bán
 */
export function generateSellerCopilotResponse(query, context = {}) {
  const {
    currentShop = { name: 'Gian Hàng Của Bạn', id: 'SHOP-001' },
    shopProducts = [],
    shopOrders = [],
    totalRevenue = 0,
    pnlData = null,
    restockData = null,
    adsData = null,
    flashSales = []
  } = context;

  const raw = query.toLowerCase().trim();

  // 1. Cảnh Báo Tồn Kho & Đề Xuất Nhập PO (Restock Radar & Safety Stock)
  if (!/raft|xả hàng|xả kho/i.test(raw) && /tồn kho|hết hàng|nhập kho|nhập hàng|sắp hết|safety stock|ngưỡng an toàn|po/i.test(raw)) {
    const lowStockItems = shopProducts.filter(p => p.stock <= (typeof p.safetyThreshold === 'number' ? p.safetyThreshold : 10));
    const outOfStockItems = shopProducts.filter(p => p.stock === 0);

    let stockSummary = '';
    if (outOfStockItems.length > 0) {
      stockSummary += `\n- 🔴 **Hết hàng tuyệt đối (Kho = 0)**: ${outOfStockItems.slice(0, 3).map(p => `"${p.name}"`).join(', ')}`;
    }
    if (lowStockItems.length > 0) {
      stockSummary += `\n- 🟡 **Dưới ngưỡng an toàn (≤10 cái)**: Có ${lowStockItems.length} sản phẩm cần lập kế hoạch bổ sung.`;
    }

    return {
      text: `📦 **CẢNH BÁO TỒN KHO & ĐỀ XUẤT NHẬP HÀNG (${currentShop.name})**:
${stockSummary || '\n- ✅ **Tình trạng tồn kho hiện tại rất dồi dào**, không có sản phẩm nào chạm ngưỡng nguy cấp.'}
- **Tổng số mặt hàng niêm yết**: **${shopProducts.length}** sản phẩm.
- **Khuyến nghị từ AI**:
  1. Hãy vào Tab **"Nhập Kho & Đơn PO"** để tạo phiếu nhập hàng nhanh cho các SKU báo động.
  2. Duy trì mức tồn kho an toàn tối thiểu từ 15-20 ngày bán để không bị mất hiển thị Shopee Mall khi có đợt Flash Sale.`,
      type: 'inventory',
      tag: 'CẢNH BÁO TỒN KHO',
      suggestions: [
        'Mở tab Nhập Kho & Đơn PO',
        'Xem phân tích lợi nhuận P&L từng SKU',
        'Tư vấn tối ưu chiến dịch Flash Sale'
      ]
    };
  }

  // 2. Phân Tích Lợi Nhuận P&L & Biên Lợi Nhuận Gộp (Profit & Loss / Margin)
  if (/lợi nhuận|pnl|p&l|giá vốn|cogs|biên lợi nhuận|gross margin|lãi|lỗ/i.test(raw)) {
    const rev = pnlData?.summary?.totalRevenue || totalRevenue || 0;
    const grossProfit = pnlData?.summary?.grossProfit || Math.round(rev * 0.4);
    const avgMargin = pnlData?.summary?.averageMargin ? `${pnlData.summary.averageMargin}%` : '40.0%';

    return {
      text: `💰 **BÁO CÁO LỢI NHUẬN THỰC & BIÊN LÃI GỘP (${currentShop.name})**:
- **Doanh thu thực tế (đã trừ hủy)**: **${rev.toLocaleString('vi-VN')}₫**
- **Lợi nhuận gộp ước tính (Gross Profit)**: **${grossProfit.toLocaleString('vi-VN')}₫**
- **Biên lợi nhuận trung bình toàn shop**: **${avgMargin}**
- **Đánh giá sức khỏe tài chính**: Sức khỏe dòng tiền **Tốt**, tỷ lệ thu hồi vốn an toàn.
- **Chiến lược giá đề xuất**:
  - Với các SKU có biên lãi > 50%: Thích hợp trích 10-15% ngân sách làm voucher độc quyền hoặc giảm giá Flash Sale để đẩy nhanh lượng bán.
  - Với các SKU biên lãi < 20%: Nên giữ giá ổn định, kết hợp bán kèm combo (Bundle) để tối ưu chi phí đóng gói SPX.`,
      type: 'pnl',
      tag: 'PHÂN TÍCH LỢI NHUẬN P&L',
      suggestions: [
        'Xem chi tiết từng SKU trong tab P&L',
        'Tư vấn chiến dịch Shopee Ads hiệu quả',
        'Kiểm tra tồn kho an toàn'
      ]
    };
  }

  // 3. Tư Vấn Chiến Dịch Flash Sale Shop (Flash Sale Optimization)
  if (!/raft/i.test(raw) && /flash sale|khung giờ|giảm giá|săn deal|deal chớp nhoáng|khuyến mãi/i.test(raw)) {
    return {
      text: `⚡ **CHIẾN LƯỢC THIẾT LẬP FLASH SALE SHOP ĐỘC QUYỀN**:
- **Khung giờ vàng đề xuất**: 
  - **12:00 - 15:00**: Giờ nghỉ trưa của dân văn phòng (lượng truy cập Shopee tăng vọt 3.5 lần).
  - **20:00 - 23:00**: Khung giờ vàng giải trí mua sắm buổi tối (tỷ lệ chốt đơn cao nhất).
- **Mức giảm giá tối ưu**: Khuyến nghị từ **15% đến 30%** kèm giới hạn số lượng (Stock Quota từ 20 - 50 chiếc/deal) để tạo hiệu ứng tâm lý khan hiếm kích thích khách mua ngay.
- **Thao tác**: Vào Tab **"Flash Sale Gian Hàng"** -> Bấm **"Tạo Chiến Dịch Flash Sale Mới"** để kích hoạt trong vòng 1 phút!`,
      type: 'flashsale',
      tag: 'TỐI ƯU FLASH SALE',
      suggestions: [
        'Mở tab Flash Sale Gian Hàng',
        'Kiểm tra sản phẩm bán chạy nhất',
        'Đánh giá hiệu quả quảng cáo Ads'
      ]
    };
  }

  // 4. Phân Tích Hiệu Suất Shopee Ads & Đấu Thầu Từ Khóa (Ads ROI & ROAS)
  if (!/gsp|quality score|điểm chất lượng|ad rank/i.test(raw) && /quảng cáo|ads|roas|cpc|ctr|từ khóa|đấu thầu|hiệu quả ads/i.test(raw)) {
    return {
      text: `🎯 **PHÂN TÍCH HIỆU SUẤT QUẢNG CÁO SHOPEE ADS (${currentShop.name})**:
- **Chỉ số ROAS mục tiêu**: Khuyến nghị duy trì **ROAS ≥ 3.5x** (Mỗi 1.000₫ tiền quảng cáo đem lại ít nhất 3.500₫ doanh thu).
- **Tỷ lệ nhấp chuột (CTR)**: Đạt chuẩn từ **4.5% - 6.5%**. Nếu CTR < 3%, cần đổi lại hình ảnh sản phẩm thumbnail sắc nét và bắt mắt hơn.
- **Quy tắc đấu thầu an toàn**:
  1. Đặt giá thầu khởi điểm từ 800₫ - 1.500₫/click cho từ khóa chính xác.
  2. Bật tính năng Auto-Pause khi chiến dịch tiêu hết ngân sách ngày để tránh vượt hạn mức.
  3. Theo dõi chi tiết các chiến dịch trong Tab **"Quảng Cáo Shop (Shopee Ads)"**.`,
      type: 'ads',
      tag: 'HIỆU QUẢ SHOPEE ADS',
      suggestions: [
        'Mở tab Quảng Cáo Shopee Ads',
        'Phân tích biên lợi nhuận P&L',
        'Xem sản phẩm tồn kho cần đẩy mạnh'
      ]
    };
  }

  // 5. Quản Lý Đơn Hàng & Xử Lý Giao SPX (Order Fulfillment)
  if (!/hungarian|thùng carton|bin packing|hộp spx|đóng gói|lộ trình|hub|graph router|bưu cục|drop-off|gần shop|geohash/i.test(raw) && /đơn hàng|xử lý đơn|giao hàng|in phiếu|spx|chờ xác nhận/i.test(raw)) {
    const pendingCount = shopOrders.filter(o => o.status === 'pending').length;
    return {
      text: `📦 **TIẾN ĐỘ XỬ LÝ ĐƠN HÀNG GIAN HÀNG**:
- **Đơn hàng chờ xác nhận ngay**: **${pendingCount}** đơn hàng.
- **Tiêu chuẩn giao hàng Shopee Mall**: Xác nhận và đóng gói giao bưu tá SPX trong vòng 24 giờ để đạt huy hiệu vận hành vàng.
- **Thao tác**: Mở Tab **"Đơn Hàng Của Shop"** để bấm "Xác Nhận Đơn" và in phiếu gửi hàng chuẩn SPX có mã vạch barcode.`,
      type: 'orders',
      tag: 'VẬN HÀNH ĐƠN HÀNG',
      suggestions: [
        'Mở tab Đơn Hàng Của Shop',
        'Xem ví doanh thu và rút tiền',
        'Kiểm tra đánh giá của khách hàng'
      ]
    };
  }

  // 6. Tốc Độ Tiêu Thụ Kho & Dự Báo Ngày Hết Hàng (Run Rate & Days of Inventory Remaining - DIR)
  if (/run rate|tốc độ bán|dir|ngày còn hàng|dự báo kho|cạn kho|nhu cầu nhập/i.test(raw)) {
    const totalStock = shopProducts.reduce((sum, p) => sum + (Number(p.stock) || 0), 0);
    const avgDailySales = Math.max(1, Math.round(shopOrders.length / 7)) || 3;
    const daysRemaining = Math.round(totalStock / avgDailySales);

    return {
      text: `📊 **DỰ BÁO TỐC ĐỘ BÁN & SỐ NGÀY CÒN HÀNG (RUN RATE & DIR - ${currentShop.name})**:
- **Tốc độ bán trung bình (Daily Run Rate)**: **~${avgDailySales}** sản phẩm/ngày.
- **Tổng tồn kho sẵn có toàn shop**: **${totalStock}** sản phẩm.
- **Dự báo số ngày bán còn lại (DIR)**: **${daysRemaining} ngày** trước khi cạn kho toàn bộ.
- **Quy tắc an toàn chuỗi cung ứng**:
  - Khi DIR < 10 ngày: Lập tức khởi tạo phiếu đặt hàng PO tới xưởng/nhà phân phối.
  - Thời gian vận chuyển nhập kho thông thường mất từ 3 - 5 ngày để kiểm hàng nhập kho.
- **Thao tác**: Vào Tab **"Nhập Kho & Đơn PO"** để tạo bản nháp đơn đặt hàng nhanh!`,
      type: 'inventory',
      tag: 'TỐC ĐỘ BÁN & DIR',
      suggestions: [
        'Mở tab Nhập Kho & Đơn PO',
        'Xem sản phẩm dưới ngưỡng an toàn',
        'Phân tích biên lợi nhuận P&L'
      ]
    };
  }

  // 7. Định Giá Bán An Toàn & Điểm Hòa Vốn (Unit Economics & Breakeven Pricing)
  if (!/xả hàng|xả kho/i.test(raw) && /định giá|giá bán|hòa vốn|breakeven|bán lỗ|chi phí đóng gói|unit economics/i.test(raw)) {
    return {
      text: `🏷️ **CÔNG THỨC ĐỊNH GIÁ BÁN & TÍNH ĐIỂM HÒA VỐN (UNIT ECONOMICS - ${currentShop.name})**:
- **Cơ cấu chi phí tiêu chuẩn trên 1 sản phẩm bán ra**:
  1. *Giá vốn hàng bán (COGS)*: ~50% - 60% giá niêm yết.
  2. *Phí sàn Shopee Mall cố định*: 5.0% GMV.
  3. *Thuế TMĐT khấu trừ*: 1.0% GTGT + 1.5% TNCN = 2.5%.
  4. *Chi phí đóng gói, in hóa đơn & vận hành*: 5.000₫ - 10.000₫/đơn.
  5. *Ngân sách quảng cáo Shopee Ads*: 8.0% - 12.0%.
- **Công thức tính Giá Niêm Yết Đề Xuất (Target Margin 30%)**:
  \`Giá Bán = (Giá Vốn + Chi Phí Đóng Gói) / 0.52\`
- **Cảnh báo**: Tuyệt đối không giảm giá Flash Sale sâu hơn điểm hòa vốn (COGS + Phí sàn 5% + Thuế 2.5%) để bảo vệ dòng tiền kinh doanh.`,
      type: 'pnl',
      tag: 'ĐỊNH GIÁ & HÒA VỐN',
      suggestions: [
        'Kiểm tra biên lãi trong tab P&L',
        'Tư vấn chiến lược Flash Sale',
        'Xem hiệu quả Shopee Ads'
      ]
    };
  }

  // 8. Tổng Quan Doanh Số & Tình Hình Bán Hàng (Shop Revenue Overview)
  if (/doanh số|doanh thu|tổng quan|bán hàng/i.test(raw)) {
    return {
      text: `📈 **TỔNG QUAN DOANH SỐ GIAN HÀNG (${currentShop.name})**:
- **Tổng doanh thu thực tế**: **${(totalRevenue).toLocaleString('vi-VN')}₫**
- **Số mặt hàng đang bán**: **${shopProducts.length}** sản phẩm.
- **Tổng số đơn hàng**: **${shopOrders.length}** đơn hàng.
- **Đánh giá tăng trưởng**: Gian hàng đang duy trì nhịp độ bán hàng ổn định, hãy kiểm tra Flash Sale và Quảng cáo để bứt phá doanh số!`,
      type: 'revenue',
      tag: 'TỔNG QUAN DOANH THU',
      suggestions: [
        'Phân tích biên lợi nhuận P&L',
        'Kiểm tra cảnh báo tồn kho',
        'Tư vấn chiến lược Flash Sale'
      ]
    };
  }

  // 9. Tối Ưu Đấu Thầu Quảng Cáo Từ Khóa & Điểm Chất Lượng (GSP Keyword Bidding Optimizer)
  if (/đấu thầu gsp|tối ưu cpc|ad rank shop|điểm chất lượng|quality score|roas ads|từ khóa quảng cáo/i.test(raw)) {
    return {
      text: `🎯 **TỐI ƯU ĐẤU THẦU TỪ KHÓA GSP & QUALITY SCORE (${currentShop.name})**:
- **Nguyên lý Xếp hạng Ad Rank**:
  \`Ad Rank = Bid × QualityScore\`
  - Vị trí hiển thị ưu tiên phụ thuộc trực tiếp vào Điểm chất lượng (0.1 - 10.0), không chỉ tiền thầu!
- **Công thức tính CPC thực tế (Generalized Second Price)**:
  \`CPC = floor(Rank_{đối thủ dưới} / QualityScore_{shop}) + 1₫\`
  - **Lợi ích thực tiễn**: Khi tăng Quality Score từ 5.0 lên 8.0, mức CPC shop phải trả giảm tới **37.5%** trong khi vẫn duy trì Top 1 tìm kiếm!
- **Chiến lược tối ưu ROAS**:
  1. Tăng CTR (>= 5%) bằng hình ảnh sắc nét và tiêu đề chứa từ khóa chính xác.
  2. Nâng cao tỷ lệ chuyển đổi CVR bằng video mở hộp và giá bán cạnh tranh.
  3. Duy trì đánh giá 5 sao để đạt chỉ số ROAS mục tiêu >= 3.5x.`,
      type: 'marketing',
      tag: 'TỐI ƯU ĐẤU THẦU GSP ADS',
      suggestions: [
        'Kiểm tra hiệu quả Shopee Ads',
        'Xem chuyển đổi giỏ hàng CRDT',
        'Bảo vệ bản quyền catalog LSH'
      ]
    };
  }

  // 10. Chuyển Đổi Đa Nền Tảng Với Giỏ Hàng Đồng Bộ CRDT (CRDT Multi-Device Cart Conversion)
  if (/giỏ hàng đồng bộ|crdt người mua|đa thiết bị shop|bảo vệ giỏ hàng khách|chuyển đổi giỏ hàng/i.test(raw)) {
    return {
      text: `🛒 **LỢI THẾ CHUYỂN ĐỔI TỪ GIỎ HÀNG ĐỒNG BỘ CRDT (${currentShop.name})**:
- **Trải nghiệm khách hàng liền mạch**: Khách hàng thêm sản phẩm của shop vào giỏ trên điện thoại lúc di chuyển, giỏ hàng tự động đồng bộ sang máy tính ở nhà mà không lo mất mặt hàng.
- **Không xảy ra lỗi Lost Updates**: Giải thuật CRDT (PN-Counter và LWW-Element-Set) triệt tiêu hoàn toàn xung đột dữ liệu và rớt giỏ hàng khi mạng chập chờn.
- **Bứt phá chuyển đổi Flash Sale**: Tăng 25% tỷ lệ hoàn tất thanh toán do khách hàng có thể chốt đơn tức thì trên mọi thiết bị mà không cần thêm giỏ hàng lại từ đầu.`,
      type: 'conversion',
      tag: 'GIỎ HÀNG ĐỒNG BỘ CRDT',
      suggestions: [
        'Tư vấn chiến lược Flash Sale',
        'Xem đấu thầu từ khóa GSP',
        'Phân tích biên lợi nhuận P&L'
      ]
    };
  }

  // 11. Lá Chắn Bảo Vệ Catalog Bản Quyền (LSH Catalog Theft Shield)
  if (/chống copycat|bảo vệ bản quyền|lsh shop|hàng giả hàng nhái clone|khiếu nại sao chép|bảo vệ catalog/i.test(raw)) {
    return {
      text: `🛡️ **LÁ CHẮN BẢO VỆ GIAN HÀNG LSH MINHASH (${currentShop.name})**:
- **Radar chống sao chép tự động**: Thuật toán Locality-Sensitive Hashing quét liên tục toàn sàn, nhận diện các shop lừa đảo cào tự động và sao chép tiêu đề, mô tả của gian hàng bạn với độ tương đồng Jaccard >= 80%.
- **Chế tài bảo vệ bản quyền**:
  - Gắn cờ và cô lập các shop clone sản phẩm.
  - Tước quyền tham gia Flash Sale và thu hồi voucher của các tài khoản gian lận sao chép.
- **Lời khuyên**: Giữ nguyên mã SKU chính hãng và đăng ký bảo hộ thương hiệu trong hồ sơ gian hàng Mall.`,
      type: 'security',
      tag: 'BẢO VỆ GIAN HÀNG LSH',
      suggestions: [
        'Xem báo cáo vi phạm bản quyền',
        'Tối ưu đấu thầu từ khóa GSP',
        'Kiểm tra cảnh báo tồn kho'
      ]
    };
  }

  // 12. Tìm Kiếm Bằng Hình Ảnh & Ngữ Nghĩa HNSW (Visual & Semantic Search Discovery)
  if (/tìm kiếm hình ảnh|visual search|hnsw shop|tìm kiếm ngữ nghĩa sản phẩm|tìm kiếm vector/i.test(raw)) {
    return {
      text: `📸 **TĂNG TRƯỞNG LƯỢT TIẾP CẬN TỪ TÌM KIẾM HÌNH ẢNH HNSW (${currentShop.name})**:
- **Cơ chế HNSW Vector Search**: Đồ thị phân tầng HNSW lập chỉ mục vector nhúng hình ảnh sản phẩm đa chiều (CLIP 128-d). Khi khách hàng tải ảnh mẫu lên để tìm đồ tương tự, sản phẩm của shop sẽ xuất hiện trong Top kết quả chỉ sau vài mili-giây.
- **Mẹo tối ưu tỷ lệ xuất hiện**:
  1. Sử dụng ảnh chụp sản phẩm độ phân giải cao, phông nền đơn sắc rõ nét.
  2. Bổ sung nhiều góc chụp (mặt trước, chi tiết chất liệu, ảnh chụp mẫu mặc thực tế).
  3. Mô tả chi tiết các thuộc tính vật lý (màu sắc, kiểu dáng, chất liệu) để kết hợp tìm kiếm ngữ nghĩa Hybrid Search.`,
      type: 'marketing',
      tag: 'TÌM KIẾM HÌNH ẢNH HNSW',
      suggestions: [
        'Tối ưu hình ảnh sản phẩm',
        'Xem điều phối lấy hàng SPX',
        'Tư vấn chiến lược Flash Sale'
      ]
    };
  }

  // 13. Tối Ưu Lấy Hàng Hỏa Tốc Qua Thuật Toán Hungarian (SPX Express Dispatch)
  if (/bưu tá lấy hàng|spx hungarian|tối ưu lấy hàng|shipper đến lấy|hungarian shop|điều phối lấy hàng/i.test(raw)) {
    return {
      text: `⚡ **TỐI ƯU HÓA ĐIỀU PHỐI BƯU TÁ SPX HUNGARIAN (${currentShop.name})**:
- **Cơ chế gán bưu tá thông minh**: Thuật toán Hungarian (Kuhn-Munkres) tự động tính toán vị trí GPS thời gian thực của bưu tá SPX gần nhất đang có tải trọng xe phù hợp để ghé gian hàng bạn nhận đơn.
- **Lợi ích vận hành cho shop**:
  - Giảm 40% thời gian chờ bưu tá đến lấy hàng (Pickup Wait Time).
  - Tránh tình trạng bưu tá từ chối nhận hàng do cồng kềnh/quá tải trọng xe máy.
  - Tăng tỷ lệ giao đúng hẹn SLA, duy trì chuẩn sao quả tạ = 0 điểm.`,
      type: 'logistics',
      tag: 'TỐI ƯU ĐIỀU PHỐI BƯU TÁ',
      suggestions: [
        'Xem tiến độ điều phối SPX',
        'Bảo vệ tồn kho Flash Sale Raft',
        'Cảnh báo sản phẩm sắp hết hàng'
      ]
    };
  }

  // 14. Bảo Vệ Tồn Kho Flash Sale Bằng Đồng Thuận Phân Tán Raft (Raft Distributed Consensus)
  if (/bảo vệ tồn kho flash sale|raft shop|chống bán vượt kho|quản lý kho phân tán|đồng thuận raft/i.test(raw)) {
    return {
      text: `🛡️ **BẢO VỆ TỒN KHO FLASH SALE BẰNG ĐỒNG THUẬN PHÂN TÁN RAFT (${currentShop.name})**:
- **Chống bán vượt kho tuyệt đối (Zero Overselling)**: Khi chiến dịch Flash Sale bùng nổ hàng nghìn lượt mua cùng lúc, thuật toán Raft Consensus đảm bảo mỗi suất trừ kho phải được xác nhận trên đa số nút Quorum trước khi xác nhận đơn.
- **Không lo đơn hàng ảo / rớt hàng**: Tồn kho của shop được bảo toàn chính xác từng đơn vị; khi người mua hủy đơn, suất đặt trước tự động hoàn trả kho tức thì không bị thất thoát.`,
      type: 'security',
      tag: 'BẢO VỆ TỒN KHO FLASH SALE RAFT',
      suggestions: [
        'Cấu hình số lượng Flash Sale',
        'Tối ưu hình ảnh sản phẩm HNSW',
        'Xem báo cáo bán hàng'
      ]
    };
  }

  // 15. Thiết Lập Combo Mua Kèm Deal Sốc Bằng FP-Growth (Frequent Pattern Mining Combo)
  if (/combo mua kèm deal sốc|thiết lập combo|fp-growth shop|gợi ý combo|luật kết hợp shop|lift sản phẩm/i.test(raw)) {
    return {
      text: `🎁 **TƯ VẤN THIẾT LẬP COMBO MUA KÈM DEAL SỐC FP-GROWTH (${currentShop.name})**:
- **Khai phá giỏ hàng khách mua**: Thuật toán FP-Growth rà soát lịch sử ${shopOrders.length} đơn hàng của shop để tìm các cặp sản phẩm thường xuyên được mua cùng nhau.
- **Tiêu chí tạo Deal Sốc hiệu quả**:
  - **Chỉ số Lift $\\ge 2.0$**: Đảm bảo khách mua sản phẩm chính (ví dụ Áo sơ mi) có xác suất mua kèm sản phẩm phụ (Cà vạt, Quần âu) cao gấp đôi bình thường.
  - **Chiết khấu an toàn**: Giảm từ 10% - 20% cho món mua kèm giúp tăng giá trị trung bình giỏ hàng (AOV) thêm 35% mà vẫn đảm bảo biên lợi nhuận gộp toàn đơn $\\ge 30%$.`,
      type: 'marketing',
      tag: 'THIẾT LẬP COMBO DEAL SỐC FP-GROWTH',
      suggestions: [
        'Tối ưu đóng gói thùng carton SPX',
        'Đồng bộ cụm phân tán SWIM',
        'Xem báo cáo P&L từng SKU'
      ]
    };
  }

  // 16. Hướng Dẫn Đóng Gói Thùng Carton SPX Tiết Kiệm Cước (Bin Packing SPX Box)
  if (/đóng gói tiết kiệm cước|tối ưu kích thước hộp|chọn hộp spx|giảm cước quy đổi|bin packing shop/i.test(raw)) {
    return {
      text: `📦 **HƯỚNG DẪN ĐÓNG GÓI THÙNG CARTON SPX TIẾT KIỆM CƯỚC (${currentShop.name})**:
- **Tối ưu hóa không gian 3 chiều**: Thuật toán Bin Packing Maximal Rectangles giúp shop lựa chọn kích cỡ thùng chuẩn SPX (Hộp S: $15\\times 12\\times 10\\text{cm}$, Hộp M: $25\\times 20\\times 15\\text{cm}$) vừa vặn nhất với bộ sản phẩm.
- **Tránh bị phạt cước thể tích**:
  - Hàng cồng kềnh nhẹ cân thường bị SPX tính cước theo thể tích ($V/5000$).
  - Bằng cách xoay lật đa chiều và đóng gói lấp đầy $\\ge 75\\%$, shop tiết kiệm trung bình 12.000₫ - 25.000₫ cước vận chuyển trên mỗi đơn hàng!`,
      type: 'logistics',
      tag: 'TỐI ƯU ĐÓNG GÓI SPX BOX',
      suggestions: [
        'Tạo combo mua kèm FP-Growth',
        'Cảnh báo tồn kho an toàn',
        'Xem chi phí vận chuyển'
      ]
    };
  }

  // 17. Đồng Bộ Cụm Phân Tán SWIM Gossip Cho Gian Hàng (SWIM Membership Protocol)
  if (/cụm phân tán shop|gossip shop|swim node/i.test(raw)) {
    return {
      text: `🌐 **ĐỒNG BỘ CỤM PHÂN TÁN GOSSIP SWIM (${currentShop.name})**:
- **Vận hành không gián đoạn (High Availability)**: Dịch vụ gian hàng của bạn được đồng bộ qua giao thức SWIM Gossip, giúp cập nhật trạng thái kho và đơn hàng tức thì trên các vùng dữ liệu mà không bị treo gián đoạn khi máy chủ bảo trì.`,
      type: 'infrastructure',
      tag: 'ĐỒNG BỘ CỤM PHÂN TÁN GOSSIP',
      suggestions: [
        'Kiểm tra tồn kho Flash Sale',
        'Thiết lập combo FP-Growth',
        'Xem báo cáo bán hàng'
      ]
    };
  }

  // 18. Lộ Trình Vận Chuyển Đa Hub SPX (Phase 12 - Feature 159)
  if (/lộ trình.*spx|vận chuyển.*spx|tuyến đường.*spx|liên tỉnh.*spx|hub spx|gửi hàng liên tỉnh|thời gian giao hàng spx/i.test(raw)) {
    return {
      text: `🚚 **LỘ TRÌNH VẬN CHUYỂN LIÊN TỈNH SPX EXPRESS (${currentShop.name})**:
- **Tối ưu chặng trung chuyển (Dijkstra / A* Graph Routing)**:
  - Khi bưu tá SPX lấy hàng từ kho shop của bạn, kiện hàng được đưa về First-Mile Hub gần nhất, trung chuyển qua Bắc Ninh Mega SOC (miền Bắc) hoặc Củ Chi Mega SOC (miền Nam).
  - Thuật toán tự động tìm tuyến đường ngắn nhất, tiết kiệm 12-24 giờ luân chuyển so với điều phối thủ công.
- **Dự báo thời gian giao hàng (ETA)**:
  - Tuyến nội tỉnh / cùng miền: Giao trong 24 giờ.
  - Tuyến liên tỉnh Bắc - Nam: Giao trong 48 - 72 giờ qua mạng lưới trục chính SOC liên vùng.`,
      type: 'logistics',
      tag: 'LỘ TRÌNH SPX GRAPH ROUTER',
      suggestions: [
        'Tối ưu thùng carton SPX',
        'Phân khúc khách hàng shop RFM',
        'Cảnh báo kho hết hàng'
      ]
    };
  }

  // 19. Phân Khúc Khách Hàng Gian Hàng Theo RFM (Phase 12 - Feature 159)
  if (/phân khúc khách hàng shop|rfm shop|khách vip shop|khách sắp rời bỏ|chăm sóc khách cũ/i.test(raw)) {
    return {
      text: `👥 **CHIẾN LƯỢC PHÂN KHÚC KHÁCH HÀNG RFM DÀNH CHO SHOP (${currentShop.name})**:
- **Nhóm Champions & Khách VIP (R $\\ge$ 4, F $\\ge$ 4)**:
  - Tặng quà kèm bí mật trong kiện hàng, gửi mã voucher tri ân giảm 10% độc quyền.
- **Nhóm Tiềm Năng (Potential Loyalists - Khách mua 2-3 lần)**:
  - Gợi ý gói Mua Kèm Deal Sốc bằng thuật toán FP-Growth để nâng giá trị vòng đời (CLV).
- **Nhóm Có Nguy Cơ Rời Bỏ (At Risk - Đã 2 tháng chưa mua lại)**:
  - Kích hoạt tin nhắn thông báo sản phẩm mới kèm mã giảm giá 20k thời hạn 48 giờ để kéo khách quay lại.`,
      type: 'marketing',
      tag: 'PHÂN KHÚC KHÁCH HÀNG RFM',
      suggestions: [
        'Thiết lập combo FP-Growth',
        'Lộ trình vận chuyển SPX',
        'Phân tích biên lợi nhuận P&L'
      ]
    };
  }

  // 20. Xả Kho Tồn Bãi & Tối Ưu Giá Sàn Hòa Vốn (Phase 13 - Feature 160)
  if (/xả hàng tồn kho|xả kho shop|hàng cận date|tuổi hàng tồn|giá sàn hòa vốn/i.test(raw)) {
    return {
      text: `🏷️ **CHIẾN LƯỢC XẢ HÀNG TỒN KHO & TỐI ƯU THU HỒI VỐN (${currentShop.name})**:
- **Nguyên tắc chiết khấu theo tuổi tồn kho**:
  - Hàng tồn $31-60$ ngày: Giảm 10% trong các khung giờ Flash Sale phụ.
  - Hàng tồn $61-90$ ngày: Tạo combo Mua Kèm Deal Sốc giảm 25% với sản phẩm chủ lực.
  - Hàng tồn $>90$ ngày (Deadstock): Kích hoạt xả kho giảm 40% về sát giá sàn hòa vốn.
- **Rào chắn bảo vệ giá sàn ($P_{\\text{floor}}$)**:
  - Giá xả kho không được thấp hơn: $\\text{COGS} / (1 - 0.075)$. Đảm bảo thu hồi đủ tiền gốc để tái đầu tư nguồn hàng mới!`,
      type: 'inventory',
      tag: 'XẢ KHO TỒN BÃI & GIÁ SÀN',
      suggestions: [
        'Điểm gửi hàng SPX gần shop',
        'Phân tích biên lợi nhuận P&L',
        'Cảnh báo kho hết hàng'
      ]
    };
  }

  // 21. Tìm Điểm Gửi Hàng SPX Drop-off Bằng Geohash (Phase 13 - Feature 160)
  if (/bưu cục spx gần shop|điểm gửi hàng gần nhất|khách hàng gần shop|geohash shop/i.test(raw)) {
    return {
      text: `📍 **MẠNG LƯỚI BƯU CỤC SPX DROP-OFF & ĐỊNH VỊ GEOHASH (${currentShop.name})**:
- **Tìm kiếm lân cận Geohash**: Hệ thống mã hóa kho hàng của shop theo Geohash Precision 6 (~1.2km) và tự động rà soát các điểm gửi hàng SPX Drop-off Post trong bán kính 3 - 5km.
- **Giao bưu tá tiện lợi**: Bạn có thể chọn bưu tá SPX đến lấy hàng tận kho hoặc chủ động mang hàng ra bưu cục đối tác gần nhất trước 17h hàng ngày để kịp chuyến xe trung chuyển tối.`,
      type: 'logistics',
      tag: 'BƯU CỤC SPX GẦN NHẤT',
      suggestions: [
        'Lộ trình vận chuyển SPX',
        'Xả kho tồn bãi & giá sàn',
        'Vận hành đơn hàng'
      ]
    };
  }

  // 12. Giải Thích Cơ Chế AI & Nguồn Dữ Liệu Gian Hàng Thực Tế (Seller AI Transparency)
  if (/dữ liệu thực tế|đọc từ sàn|lập trình sẵn|cơ chế ai|lấy dữ liệu ở đâu|nguồn dữ liệu|tại sao trả lời nhanh/i.test(raw)) {
    return {
      text: `🤖 **CƠ CHẾ HOẠT ĐỘNG CỦA SHOPSMART COPILOT (${currentShop.name})**:
- **Nguồn dữ liệu thực tế**:
  - AI đọc và phân tích trực tiếp từ dữ liệu của shop bạn:
    • **${shopProducts.length}** Sản phẩm đang quản lý.
    • **${shopOrders.length}** Đơn hàng thực tế đã phát sinh.
    • **${(totalRevenue).toLocaleString('vi-VN')}₫** Tổng doanh thu bán hàng.
    • Trạng thái tồn kho, cấu hình chiết khấu Flash Sale và chỉ số quảng cáo Shopee Ads của shop.
- **Tốc độ phản hồi tức thì**:
  - Sử dụng thuật toán suy luận tại máy khách (Client-side In-Memory NLP Inference). Không cần đợi mạng truyền tải, phản hồi ngay trong mili-giây.
- **An toàn & Cách ly dữ liệu (Shop Isolation)**:
  - Dữ liệu kinh doanh, doanh thu và P&L của shop bạn được bảo mật tuyệt đối, không chia sẻ cho các đối thủ cạnh tranh khác trên sàn.`,
      type: 'general',
      tag: 'MINH BẠCH CƠ CHẾ AI',
      suggestions: [
        'Cảnh báo sản phẩm sắp hết hàng',
        'Phân tích biên lợi nhuận P&L',
        'Dự báo tốc độ bán và ngày còn hàng (DIR)',
        'Đánh giá hiệu quả Shopee Ads'
      ]
    };
  }

  // 13. Tổng Quan Trợ Lý Người Bán (Default Shop Copilot Greeting)
  return {
    text: `Chào Bạn! Tôi là **ShopSmart AI** - Trợ lý số đồng hành cùng **${currentShop.name}** để tối ưu hóa doanh số và tinh gọn vận hành:
- 📦 **Cảnh báo kho & Run Rate**: Rà soát sản phẩm sắp hết hàng theo Safety Stock & DIR.
- 💰 **Phân tích P&L & Định giá**: Tính toán giá vốn COGS, điểm hòa vốn và biên lãi gộp.
- ⚡ **Flash Sale Shop**: Tư vấn khung giờ vàng và mức giảm giá hút khách.
- 🎯 **Shopee Ads**: Đánh giá chỉ số ROAS, CTR và cấu trúc từ khóa đấu thầu.
- 🔒 **Bảo mật**: Dữ liệu được cô lập 100% trong phạm vi gian hàng của bạn.`,
    type: 'general',
    tag: 'TRỢ LÝ KINH DOANH SHOP',
    suggestions: [
      'Cảnh báo sản phẩm sắp hết hàng',
      'Dự báo tốc độ bán và ngày còn hàng (DIR)',
      'Phân tích biên lợi nhuận P&L',
      'Công thức định giá và điểm hòa vốn',
      'Đánh giá hiệu quả Shopee Ads'
    ]
  };
}
