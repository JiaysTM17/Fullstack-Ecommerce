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
  if (/tồn kho|hết hàng|nhập kho|nhập hàng|sắp hết|safety stock|ngưỡng an toàn|po/i.test(raw)) {
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
  if (/flash sale|khung giờ|giảm giá|săn deal|deal chớp nhoáng|khuyến mãi/i.test(raw)) {
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
  if (/quảng cáo|ads|roas|cpc|ctr|từ khóa|đấu thầu|hiệu quả ads/i.test(raw)) {
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
  if (/đơn hàng|xử lý đơn|giao hàng|in phiếu|spx|chờ xác nhận/i.test(raw)) {
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
  if (/định giá|giá bán|hòa vốn|breakeven|bán lỗ|chi phí đóng gói|unit economics/i.test(raw)) {
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

  // 9. Tổng Quan Trợ Lý Người Bán (Default Shop Copilot Greeting)
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
