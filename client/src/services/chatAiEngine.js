/**
 * chatAiEngine.js - Trí Tuệ Nhân Tạo & Bộ Xử Lý Tri Thức TMĐT Toàn Diện
 * Chuyên trách xử lý ngôn ngữ tự nhiên tiếng Việt, phân loại đa ý định (Compound Intent Classification),
 * tra cứu 109 sản phẩm theo đa tiêu chí, điều phối Dual Voucher, kiểm tra vận đơn SPX Express,
 * và giải đáp tức thì không lòng vòng mọi tình huống mua sắm & hậu mãi.
 */

import { FALLBACK_PRODUCTS } from './productService';

// 1. CƠ SỞ TRI THỨC VOUCHER & KHUYẾN MÃI (Dual Voucher Stacking Engine)
export const VOUCHER_KNOWLEDGE = [
  {
    code: 'MINI10',
    name: 'Giảm 10% Toàn Sàn',
    discount: '10%',
    discountType: 'percentage',
    value: 10,
    maxDiscount: '100.000₫',
    minOrder: '100.000₫',
    desc: 'Áp dụng cho mọi ngành hàng từ 100k, giảm tối đa 100.000₫.',
    badge: 'MÃ ĐƠN HÀNG',
    type: 'order',
  },
  {
    code: 'MINI50K',
    name: 'Giảm Ngay 50.000₫',
    discount: '50K',
    discountType: 'fixed',
    value: 50000,
    maxDiscount: '50.000₫',
    minOrder: '500.000₫',
    desc: 'Giảm thẳng 50.000₫ cho đơn hàng công nghệ, gia dụng từ 500k.',
    badge: 'HOT DEAL',
    type: 'order',
  },
  {
    code: 'SUPERDEAL',
    name: 'Siêu Giảm Giá 15%',
    discount: '15%',
    discountType: 'percentage',
    value: 15,
    maxDiscount: '150.000₫',
    minOrder: '300.000₫',
    desc: 'Ưu đãi ngày hội mua sắm, giảm tới 150.000₫.',
    badge: 'ĐẶC QUYỀN VIP',
    type: 'order',
  },
  {
    code: 'FREESHIP',
    name: 'Miễn Phí Vận Chuyển 30K',
    discount: '30.000₫',
    discountType: 'shipping',
    value: 30000,
    maxDiscount: '30.000₫',
    minOrder: '0₫',
    desc: 'Freeship 30k toàn quốc không giới hạn giá trị đơn hàng.',
    badge: 'MÃ FREESHIP',
    type: 'shipping',
  },
  {
    code: 'FREESHIPEXTRA',
    name: 'Freeship Xtra Tiết Kiệm 15K',
    discount: '15.000₫',
    discountType: 'shipping',
    value: 15000,
    maxDiscount: '15.000₫',
    minOrder: '50.000₫',
    desc: 'Giảm 15.000₫ phí giao hàng cho đơn từ 50.000₫.',
    badge: 'TIẾT KIỆM',
    type: 'shipping',
  },
  {
    code: 'FREESHIPVIP',
    name: 'Freeship Hỏa Tốc 2H 50K',
    discount: '50.000₫',
    discountType: 'shipping',
    value: 50000,
    maxDiscount: '50.000₫',
    minOrder: '200.000₫',
    desc: 'Giảm 50.000₫ cước hỏa tốc SPX Now nhận trong 2 giờ nội thành.',
    badge: 'HỎA TỐC 2H',
    type: 'shipping',
  },
];

// 2. CƠ SỞ TRI THỨC 12 GIAN HÀNG CHÍNH HÃNG SHOPEE MALL
export const MALL_STORES_KNOWLEDGE = [
  { id: 'shop_01', name: 'TechWorld Apple & Samsung Authorized', category: 'Điện tử', rating: 4.96, desc: 'Đại lý ủy quyền iPhone, iPad, màn hình 4K, chuột công thái học, bàn phím cơ.' },
  { id: 'shop_02', name: 'SoundMax Audio Pro Official', category: 'Điện tử', rating: 4.93, desc: 'Chuyên tai nghe Bluetooth chống ồn ANC, loa di động IPX7, DAC giải mã âm thanh Hi-Res.' },
  { id: 'shop_03', name: 'Anker & Baseus Phụ Kiện Chính Hãng', category: 'Điện tử', rating: 4.94, desc: 'Củ sạc GaN 65W, cáp sạc nhanh 100W, pin dự phòng 20.000mAh, tẩu sạc ô tô.' },
  { id: 'shop_04', name: 'MenStyle Thời Trang Phái Mạnh', category: 'Thời trang', rating: 4.92, desc: 'Áo polo thoáng khí, quần tây âu slimfit, quần jean baggy denim, giày sneaker da nam.' },
  { id: 'shop_05', name: 'ChicLady Thời Trang Nữ Cao Cấp', category: 'Thời trang', rating: 4.95, desc: 'Áo sơ mi lụa satin, đầm voan hoa nhí, váy dạ tweed tiểu thư, giày sandal quai mảnh.' },
  { id: 'shop_06', name: 'SportPro Thể Thao & Dã Ngoại', category: 'Thể thao', rating: 4.91, desc: 'Thảm yoga TPE định tuyến, bình nước Tritan 1.5L, lều cắm trại tự bung, vợt cầu lông.' },
  { id: 'shop_07', name: 'HomeMaster Gia Dụng Thông Minh', category: 'Gia dụng', rating: 4.94, desc: 'Nồi chiên không dầu 6.5L, máy hút bụi 25.000Pa, nồi cơm cao tần IH, máy lọc không khí.' },
  { id: 'shop_08', name: 'Lock&Living Gia Đình Tiện Ích', category: 'Đời sống', rating: 4.92, desc: 'Bình giữ nhiệt Inox 316, bộ chăn ga lụa Tencel 60S, thùng rác cảm ứng thông minh.' },
  { id: 'shop_09', name: 'BeautyCosmetics Hàn Quốc & Nhật Bản', category: 'Sắc đẹp', rating: 4.97, desc: 'Serum Vitamin C 15%, kem chống nắng quang phổ rộng, son lì dưỡng ẩm, serum rau má.' },
  { id: 'shop_10', name: 'HealthyLife Organic & Thực Dưỡng', category: 'Đời sống', rating: 4.93, desc: 'Hạt dinh dưỡng macca, trà hoa cúc gạo lứt, mật ong hoa rừng nguyên chất 100%, hạt chia.' },
  { id: 'shop_11', name: 'KidsWorld Mẹ & Bé Cao Cấp', category: 'Mẹ & Bé', rating: 4.96, desc: 'Bình sữa thủy tinh PPSU chống đầy hơi, tã dán hữu cơ, xe đẩy gấp gọn, máy tiệt trùng UV.' },
  { id: 'shop_12', name: 'LuxeTime Đồng Hồ Cơ Khí & Phụ Kiện', category: 'Thời trang', rating: 4.95, desc: 'Đồng hồ cơ Automatic kính sapphire, đồng hồ nữ Swarovski, hộp xoay đồng hồ tự động.' },
];

// Helper: Phân tích khoảng giá từ câu hỏi tự nhiên
export function extractPriceConstraint(text) {
  const lower = text.toLowerCase();
  let maxPrice = null;
  let minPrice = null;

  // Dưới Xk hoặc dưới X triệu
  const underMatch = lower.match(/(?:dưới|<|không quá|nhỏ hơn)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn|triệu|tr)?/i);
  if (underMatch) {
    const num = parseFloat(underMatch[1].replace(',', '.'));
    const unit = (underMatch[2] || '').toLowerCase();
    maxPrice = (unit.startsWith('tr') || unit.startsWith('triệu')) ? num * 1000000 : num * 1000;
  }

  // Trên Xk hoặc trên X triệu
  const aboveMatch = lower.match(/(?:trên|>|hơn|từ)\s*(\d+(?:[.,]\d+)?)\s*(k|nghìn|ngàn|triệu|tr)/i);
  if (aboveMatch && !lower.includes('đến') && !lower.includes('-')) {
    const num = parseFloat(aboveMatch[1].replace(',', '.'));
    const unit = (aboveMatch[2] || '').toLowerCase();
    minPrice = (unit.startsWith('tr') || unit.startsWith('triệu')) ? num * 1000000 : num * 1000;
  }

  // Từ X đến Y
  const rangeMatch = lower.match(/(?:từ|khoảng)\s*(\d+)\s*(k|tr)?\s*(?:đến|-)\s*(\d+)\s*(k|nghìn|ngàn|triệu|tr)/i);
  if (rangeMatch) {
    const minVal = parseInt(rangeMatch[1], 10);
    const maxVal = parseInt(rangeMatch[3], 10);
    const maxUnit = rangeMatch[4].toLowerCase();
    const multiplier = (maxUnit.startsWith('tr') || maxUnit.startsWith('triệu')) ? 1000000 : 1000;
    minPrice = rangeMatch[2]?.startsWith('tr') ? minVal * 1000000 : minVal * 1000;
    maxPrice = maxVal * multiplier;
  }

  return { minPrice, maxPrice };
}

// Helper: Tra cứu đơn hàng từ LocalStorage
export function lookupCustomerOrders(query) {
  try {
    const rawCustomer = localStorage.getItem('mini_shopee_customer_orders');
    const rawGeneral = localStorage.getItem('mini_shopee_orders');
    const listCustomer = rawCustomer ? JSON.parse(rawCustomer) : [];
    const listGeneral = rawGeneral ? JSON.parse(rawGeneral) : [];
    const all = [...listCustomer, ...listGeneral];

    if (!query) return all.slice(0, 3);

    const q = query.toUpperCase().trim();
    const codeMatch = q.match(/ORD[0-9A-Z]+/i);
    if (codeMatch) {
      const code = codeMatch[0];
      const found = all.filter(o => (o.orderId || o.id || '').toUpperCase().includes(code));
      if (found.length > 0) return found;
    }

    return all.slice(0, 3);
  } catch {
    return [];
  }
}

// Helper: Tìm kiếm sản phẩm thông minh theo danh mục, tên, giá, thương hiệu
export function searchSmartProducts(query, options = {}) {
  const products = options.productList || FALLBACK_PRODUCTS;
  if (!query || !query.trim()) {
    return products.slice(0, 4);
  }

  const raw = query.toLowerCase().trim();
  const { minPrice, maxPrice } = extractPriceConstraint(raw);

  // Suy luận ngành hàng chính xác
  let targetCategory = null;
  if (/áo|quần|váy|đầm|polo|túi|ví|thắt lưng|kính|thời trang/i.test(raw)) targetCategory = 'Thời trang';
  else if (/tai nghe|chuột|bàn phím|laptop|sạc|màn hình|ssd|webcam|cáp|điện tử|công nghệ|loa/i.test(raw)) targetCategory = 'Điện tử';
  else if (/nồi|hút bụi|lọc khí|quạt|ấm|nồi chiên|nồi cơm|gia dụng/i.test(raw)) targetCategory = 'Gia dụng';
  else if (/yoga|lều|vợt|thể thao|dã ngoại/i.test(raw)) targetCategory = 'Thể thao';
  else if (/serum|kem chống nắng|son|mặt nạ|mỹ phẩm|sắc đẹp|rửa mặt/i.test(raw)) targetCategory = 'Sắc đẹp';
  else if (/sữa|tã|xe đẩy|mẹ|bé|tiệt trùng/i.test(raw)) targetCategory = 'Mẹ & Bé';
  else if (/hạt|trà|mật ong|sách|đèn|bình giữ nhiệt|đời sống/i.test(raw)) targetCategory = 'Đời sống';

  const stopWords = ['tôi', 'muốn', 'tìm', 'mua', 'cho', 'sản', 'phẩm', 'có', 'gì', 'không', 'nào', 'bán', 'giá', 'dưới', 'khoảng', 'từ', 'đến', 'xin', 'cần'];
  const tokens = raw.replace(/[.,?!]/g, '').split(/\s+/).filter(w => w.length > 1 && !stopWords.includes(w));

  let results = products.filter(p => {
    // 1. Phù hợp danh mục
    if (targetCategory && p.category !== targetCategory) {
      if (!(/giày|sandal|sneaker/i.test(raw) && (p.category === 'Thời trang' || p.category === 'Thể thao'))) {
        return false;
      }
    }

    // 2. Lọc theo giá
    if (minPrice !== null && p.price < minPrice) return false;
    if (maxPrice !== null && p.price > maxPrice) return false;

    // 3. Khớp từ khóa
    if (tokens.length === 0) return true;
    const searchTarget = `${p.name} ${p.category} ${p.brand || ''} ${p.description || ''} ${p.shopName || ''}`.toLowerCase();
    return tokens.some(t => searchTarget.includes(t));
  });

  // Nếu quá chặt chẽ làm kết quả rỗng, nới lỏng từ khóa nhưng giữ giá
  if (results.length === 0 && (minPrice !== null || maxPrice !== null)) {
    results = products.filter(p => {
      if (minPrice !== null && p.price < minPrice) return false;
      if (maxPrice !== null && p.price > maxPrice) return false;
      return true;
    });
  }

  // Fallback nếu vẫn rỗng
  if (results.length === 0) {
    results = products.filter(p => p.badge === "Amazon's Choice" || p.badge === 'Best Seller').slice(0, 4);
  }

  // Sắp xếp
  if (/rẻ nhất|tiết kiệm/i.test(raw)) {
    results.sort((a, b) => a.price - b.price);
  } else if (/đắt nhất|cao cấp|xịn/i.test(raw)) {
    results.sort((a, b) => b.price - a.price);
  } else {
    results.sort((a, b) => (b.sold || 0) - (a.sold || 0));
  }

  return results.slice(0, 4);
}

// 3. BỘ SUY LUẬN TRÍ TUỆ NHÂN TẠO CHÍNH (MASTER AI NLP ENGINE)
// Hỗ trợ cả 2 dạng gọi: generateAiChatResponse(text, options) và generateAiChatResponse({ query, ... })
export function generateAiChatResponse(firstArg, secondArg = {}) {
  let text = '';
  let options = {};

  if (typeof firstArg === 'string') {
    text = firstArg;
    options = secondArg || {};
  } else if (firstArg && typeof firstArg === 'object') {
    text = firstArg.query || firstArg.text || '';
    options = firstArg;
  }

  const {
    chatMode = 'ai',
    userCoins = 0,
    totalSpins = 0,
    targetShop = null,
  } = options;

  const raw = (text || '').trim();
  const lower = raw.toLowerCase();

  // -------------------------------------------------------------
  // CHUYỂN GIAO NHÂN VIÊN TRỰC (HANDOVER PROTOCOL)
  // -------------------------------------------------------------
  const handoverKeywords = [
    'gặp nhân viên', 'nhân viên', 'tư vấn viên', 'người trực', 'human',
    'người thật', 'kết nối nhân viên', 'cskh', 'tổng đài', 'chăm sóc khách hàng',
    'khiếu nại', 'gọi người', 'chuyển máy', 'chat với người', 'hotline'
  ];
  if (handoverKeywords.some(k => lower.includes(k)) && chatMode === 'ai') {
    return {
      intent: 'HANDOVER_TRIGGER',
      handoverTriggered: true,
      replyText: `🔄 **Đang kết nối Chuyên Viên CSKH Kim Ngân (#CSKH-8821)!**\n\n• Toàn bộ lịch sử trao đổi của bạn đã được chuyển giao an toàn.\n• Chuyên viên sẽ trực tiếp giải quyết khiếu nại, hỗ trợ đổi trả và áp mã độc quyền ngay lập tức.`,
      suggestions: ['Kiểm tra tiến độ đơn hàng gấp', 'Yêu cầu đổi hàng / hoàn tiền', 'Tư vấn bảo hành sản phẩm'],
    };
  }

  // -------------------------------------------------------------
  // PHẢN HỒI KHI ĐANG Ở CHẾ ĐỘ HUMAN AGENT (KIM NGÂN)
  // -------------------------------------------------------------
  if (chatMode === 'human') {
    if (/quay lại ai|về ai|bot|trợ lý|tự động/i.test(lower)) {
      return {
        intent: 'SWITCH_BACK_AI',
        switchBackAi: true,
        replyText: `✨ Dạ em Kim Ngân xin chào tạm biệt anh/chị ạ! Quyền hỗ trợ đã được chuyển lại cho Trợ Lý AI Fullstack 24/7. Chúc anh/chị mua sắm vui vẻ!`,
        suggestions: ['Gợi ý hàng bán chạy', 'Săn mã giảm giá', 'Tra cứu đơn hàng'],
      };
    }

    if (/đơn|vận chuyển|ship|chậm|giao|bưu cục|spx/i.test(lower)) {
      return {
        intent: 'HUMAN_ORDER_SUPPORT',
        replyText: `Dạ em Kim Ngân đã kiểm tra mã vận đơn trên hệ thống SPX Express nội bộ:\n\n• Kiện hàng của anh/chị đã được gắn cờ **[ƯU TIÊN HỎA TỐC]**.\n• Bưu cục đang điều phối tài xế giao trong chiều nay.\n• Anh/chị chú ý số điện thoại để nhận hàng nhé ạ!`,
        suggestions: ['Khi nào shipper tới?', 'Yêu cầu đổi địa chỉ giao', 'Quay lại Trợ lý AI'],
      };
    }

    if (/hoàn tiền|trả hàng|lỗi|hỏng|bể|vỡ|sai/i.test(lower)) {
      return {
        intent: 'HUMAN_REFUND_SUPPORT',
        replyText: `Dạ em rất xin lỗi vì trải nghiệm chưa hoàn hảo này ạ! Em đã mở sẵn **Hồ sơ Đổi trả & Hoàn tiền 100% miễn phí tận nhà**:\n\n1. Shipper SPX sẽ đến tận nơi lấy lại hàng (không tốn phí).\n2. Số tiền thanh toán sẽ được hoàn về ví/tài khoản trong 24 giờ.\n3. Anh/chị chỉ cần giữ lại bao bì và hóa đơn nhé ạ!`,
        suggestions: ['Xác nhận tạo yêu cầu đổi trả', 'Đổi sang sản phẩm khác', 'Quay lại Trợ lý AI'],
      };
    }

    if (/voucher|giảm giá|khuyến mãi|ưu đãi/i.test(lower)) {
      return {
        intent: 'HUMAN_VOUCHER_GIFT',
        replyText: `Dạ em Kim Ngân xin gửi tặng anh/chị mã giảm giá đặc quyền **SUPERDEAL** (Giảm 15% tối đa 150k) và mã **FREESHIP** toàn quốc. Anh/chị nhấn "Dùng ngay" bên dưới để áp vào giỏ hàng nhé:`,
        vouchers: VOUCHER_KNOWLEDGE.slice(0, 3),
        suggestions: ['Áp dụng mã ngay', 'Xem sản phẩm áp dụng', 'Quay lại Trợ lý AI'],
      };
    }

    return {
      intent: 'HUMAN_GENERAL',
      replyText: `Dạ em Kim Ngân đã ghi nhận thông tin của mình. Em đang trực tiếp xử lý trên hệ thống để đảm bảo quyền lợi tối đa cho anh/chị. Anh/chị cần em hỗ trợ thêm chi tiết gì nữa không ạ?`,
      suggestions: ['Kiểm tra đơn hàng', 'Bảo hành chính hãng', 'Quay lại Trợ lý AI'],
    };
  }

  // -------------------------------------------------------------
  // CÂU HỎI PHỨC TẠP KẾT HỢP (COMPOUND MULTI-INTENT QUERIES)
  // -------------------------------------------------------------

  // 1. Kết hợp Tìm sản phẩm + Xin Voucher / Freeship
  if (
    (/mua|tìm|sản phẩm|áo|quần|tai nghe|chuột|bàn phím|nồi|son|giày/i.test(lower)) &&
    (/voucher|mã|giảm giá|freeship|miễn phí ship/i.test(lower))
  ) {
    const foundProds = searchSmartProducts(lower);
    return {
      intent: 'COMPOUND_PRODUCT_VOUCHER',
      replyText: `🎯 **Đã tìm thấy sản phẩm phù hợp & tặng kèm mã giảm giá kép cho bạn:**\n\n• Áp dụng mã \`MINI10\` (Giảm 10%) hoặc \`SUPERDEAL\` (Giảm 15%).\n• Xếp chồng cùng lúc mã \`FREESHIP\` (Giảm 30.000₫ vận chuyển).\n\nNhấn **[🛒 Thêm giỏ]** hoặc **[⚡ Mua ngay]** bên dưới:`,
      products: foundProds,
      vouchers: VOUCHER_KNOWLEDGE.slice(0, 3),
      suggestions: ['Áp mã vào giỏ hàng', 'Xem hàng giao hỏa tốc 2H', '👨‍💼 Kết nối nhân viên trực'],
    };
  }

  // 2. Kết hợp Shop cụ thể + Sản phẩm
  const matchedShop = MALL_STORES_KNOWLEDGE.find(s => lower.includes(s.name.toLowerCase()) || lower.includes(s.id));
  if (matchedShop || targetShop) {
    const currentShop = matchedShop || targetShop;
    const shopProds = searchSmartProducts(lower).filter(p => p.shopName?.toLowerCase().includes(currentShop.name.toLowerCase()) || true).slice(0, 3);
    return {
      intent: 'SHOP_PRODUCT_QUERY',
      replyText: `🏪 **Gian hàng chính hãng: ${currentShop.name}**\n\n• Danh mục: ${currentShop.category} (Đánh giá: ⭐ ${currentShop.rating})\n• 100% hàng chính hãng đầy đủ hóa đơn VAT, hỗ trợ bảo hành từ 12-24 tháng.\n• Dưới đây là sản phẩm nổi bật của gian hàng:`,
      products: shopProds,
      suggestions: [`Xem toàn bộ hàng ${currentShop.name}`, 'Lấy mã giảm giá shop', 'Chính sách bảo hành'],
    };
  }

  // 3. Kết hợp Cách dùng 2 Voucher + Điểm Xu
  if (
    (/dùng|áp|xếp chồng|cùng lúc/i.test(lower)) &&
    (/2 voucher|hai voucher|cả hai mã|vừa voucher vừa xu|mã và xu/i.test(lower))
  ) {
    return {
      intent: 'DUAL_VOUCHER_EXPLAIN',
      replyText: `💡 **HƯỚNG DẪN ÁP DỤNG ĐỒNG THỜI DUAL VOUCHER & MINI XU:**\n\n1. **Bước 1 (Mã Đơn Hàng):** Chọn 1 mã giảm giá sản phẩm (\`MINI10\` giảm 10% hoặc \`SUPERDEAL\` giảm 15%).\n2. **Bước 2 (Mã Vận Chuyển):** Chọn thêm 1 mã \`FREESHIP\` để trừ 30.000₫ cước vận chuyển.\n3. **Bước 3 (Khấu Trừ Mini Xu):** Gạt công tắc "Dùng Mini Xu" tại trang thanh toán để cấn trừ thêm tới **50% giá trị đơn hàng** (1 Xu = 1 VNĐ).\n\n✨ Cả 3 ưu đãi này được tự động cộng dồn giúp bạn tiết kiệm tối đa!`,
      vouchers: VOUCHER_KNOWLEDGE.slice(0, 3),
      suggestions: ['Xem giỏ hàng của tôi', 'Săn thêm mã giảm giá', 'Mở vòng quay nhận xu'],
    };
  }

  // -------------------------------------------------------------
  // ĐƠN HÀNG, TIẾN ĐỘ VẬN ĐƠN, KHIẾU NẠI GIAO TRỄ
  // -------------------------------------------------------------
  if (/đơn hàng|tra cứu|vận đơn|tiến độ|giao đến đâu|đơn của tôi|ord/i.test(lower)) {
    const orders = lookupCustomerOrders(lower);
    if (orders.length > 0) {
      return {
        intent: 'ORDER_TRACKING',
        replyText: `📦 **TÌNH TRẠNG VẬN ĐƠN THỜI GIAN THỰC (SPX EXPRESS)**\n\n• Hệ thống ghi nhận **${orders.length} đơn hàng** gần nhất của bạn.\n• Trạng thái: **Đang luân chuyển trên mạng lưới SPX** và dự kiến phát hàng thành công trong ngày hôm nay.`,
        orders,
        suggestions: ['Xem tất cả đơn hàng', 'Yêu cầu giao hỏa tốc', '👨‍💼 Kết nối nhân viên trực'],
      };
    }
    return {
      intent: 'ORDER_EMPTY',
      replyText: `Hiện tại tài khoản chưa có đơn hàng nào đang vận chuyển. Bạn hãy chọn món đồ ưng ý và đặt hàng ngay để nhận ưu đãi Freeship và +1 lượt quay thưởng nhé!`,
      suggestions: ['Gợi ý sản phẩm bán chạy', 'Săn mã giảm giá 15%', 'Xem chính sách giao 2H'],
    };
  }

  // -------------------------------------------------------------
  // HỦY ĐƠN HÀNG / ĐỔI TRẢ / HOÀN TIỀN
  // -------------------------------------------------------------
  if (/hủy đơn|hủy hàng|đổi trả|hoàn tiền|trả hàng|bảo hành|lỗi/i.test(lower)) {
    return {
      intent: 'RETURN_REFUND_POLICY',
      replyText: `🛡️ **CHÍNH SÁCH ĐỔI TRẢ & HOÀN TIỀN 100% MIỄN PHÍ:**\n\n• **Thời hạn:** Miễn phí đổi trả trong vòng **7 ngày** kể từ khi nhận hàng.\n• **Quy trình:** Shipper SPX đến tận nhà thu hồi hàng, tiền hoàn về tài khoản trong **24 giờ**.\n• **Hủy đơn:** Nếu đơn ở trạng thái *Chờ xác nhận*, bạn có thể bấm Hủy ngay trong mục Đơn Mua.\n• **Bảo hành:** Cam kết bảo hành chính hãng từ 12 - 24 tháng đối với thiết bị điện tử.`,
      suggestions: ['👨‍💼 Gặp Chuyên viên Kim Ngân hỗ trợ đổi trả', 'Xem lịch sử đơn mua', 'Tiếp tục mua sắm'],
    };
  }

  // -------------------------------------------------------------
  // VÒNG QUAY MAY MẮN & MINI XU (GAMIFICATION RULES)
  // -------------------------------------------------------------
  if (/vòng quay|quay thưởng|lượt quay|mini xu|xu|điểm danh|thưởng/i.test(lower)) {
    return {
      intent: 'GAMIFICATION_INFO',
      replyText: `🎡 **QUY TẮC VÒNG QUAY MAY MẮN & MINI XU CHUẨN XÁC:**\n\n• **Hoàn toàn miễn phí, TUYỆT ĐỐI KHÔNG trừ xu khi quay** (Xu được giữ để giảm giá khi mua sắm).\n• **1 lượt quay miễn phí mỗi ngày** (làm mới tự động vào 00:00 nửa đêm).\n• **Tặng thêm +1 lượt quay cho MỖI ĐƠN HÀNG đặt thành công**!\n• 100% cơ hội trúng quà: Xu thưởng khủng tới 5.000 Xu, Voucher 10%, Freeship 30k.\n\n🎯 **Số dư của bạn:** **${userCoins.toLocaleString('vi-VN')} Xu** | **Lượt quay:** **${totalSpins} lượt**`,
      rewardsInfo: {
        coins: userCoins,
        totalSpins,
      },
      suggestions: ['Mở vòng quay may mắn', 'Điểm danh nhận xu 7 ngày', 'Cách dùng xu thanh toán'],
    };
  }

  // -------------------------------------------------------------
  // VẬN CHUYỂN, GIAO HỎA TỐC 2H (SPX EXPRESS)
  // -------------------------------------------------------------
  if (/giao hàng|ship|vận chuyển|hỏa tốc|2h|spx now|phí ship|khi nào nhận/i.test(lower)) {
    return {
      intent: 'SHIPPING_INFO',
      replyText: `⚡ **DỊCH VỤ VẬN CHUYỂN HỎA TỐC SPX EXPRESS:**\n\n• 🚀 **Giao Siêu Tốc 2H (SPX Now):** Áp dụng nội thành TP.HCM & Hà Nội, nhận hàng trong vòng 120 phút.\n• 🚚 **Giao Tiêu Chuẩn 24H:** Phủ sóng toàn quốc 63 tỉnh thành, giao nhanh đúng hẹn.\n• 🆓 **Freeship toàn quốc:** Áp dụng mã \`FREESHIP\` để trừ ngay 30.000₫ cước vận chuyển!`,
      vouchers: VOUCHER_KNOWLEDGE.filter(v => v.type === 'shipping'),
      suggestions: ['Lấy mã FREESHIP', 'Xem sản phẩm giao 2H', 'Tra cứu đơn hàng'],
    };
  }

  // -------------------------------------------------------------
  // PHƯƠNG THỨC THANH TOÁN & ĐỒNG KIỂM COD
  // -------------------------------------------------------------
  if (/thanh toán|chuyển khoản|vietqr|momo|zalopay|thẻ|visa|cod|đồng kiểm/i.test(lower)) {
    return {
      intent: 'PAYMENT_INFO',
      replyText: `💳 **PHƯƠNG THỨC THANH TOÁN TIỆN LỢI & AN TOÀN:**\n\n1. 📲 **VietQR Ngân Hàng:** Quét mã QR tự động điền tiền & nội dung, xác nhận sau 3 giây.\n2. 👛 **Ví MoMo & ZaloPay:** Thanh toán 1-chạm cực nhanh.\n3. 💳 **Thẻ Quốc Tế Visa/MasterCard:** Bảo mật chuẩn PCI-DSS.\n4. 💵 **Thanh toán khi nhận hàng (COD):** Được **đồng kiểm ngoại quan** cùng shipper trước khi thanh toán.`,
      suggestions: ['Xem giỏ hàng của tôi', 'Săn mã giảm giá', 'Tiếp tục mua sắm'],
    };
  }

  // -------------------------------------------------------------
  // GIAN HÀNG CHÍNH HÃNG SHOPEE MALL
  // -------------------------------------------------------------
  if (/gian hàng|shop|cửa hàng|mall|chính hãng|hãng/i.test(lower)) {
    return {
      intent: 'MALL_STORES',
      replyText: `🏪 **12 GIAN HÀNG CHÍNH HÃNG SHOPEE MALL ĐỘC QUYỀN:**\n\n100% hàng chính hãng, hóa đơn VAT đầy đủ, chính sách đổi trả 7 ngày tận nhà. Dưới đây là các gian hàng uy tín nhất:`,
      stores: MALL_STORES_KNOWLEDGE.slice(0, 6),
      suggestions: ['Xem TechWorld', 'Xem ChicLady', 'Xem HomeMaster'],
    };
  }

  // -------------------------------------------------------------
  // KHO VOUCHER & KHUYẾN MÃI
  // -------------------------------------------------------------
  if (/voucher|mã|giảm giá|khuyến mãi|ưu đãi|deal/i.test(lower)) {
    return {
      intent: 'VOUCHER_EXPLORE',
      replyText: `🎁 **KHO MÃ GIẢM GIÁ ĐỘC QUYỀN ĐANG KHẢ DỤNG:**\n\nNhấn **[⚡ Dùng ngay]** để hệ thống tự động áp dụng trực tiếp vào đơn hàng của bạn:`,
      vouchers: VOUCHER_KNOWLEDGE.slice(0, 4),
      suggestions: ['Hướng dẫn dùng 2 voucher', 'Gợi ý hàng bán chạy', 'Mở vòng quay nhận quà'],
    };
  }

  // -------------------------------------------------------------
  // TÌM KIẾM SẢN PHẨM THÔNG MINH
  // -------------------------------------------------------------
  const matchingProducts = searchSmartProducts(lower);
  if (matchingProducts.length > 0 && (
    /áo|quần|tai nghe|chuột|bàn phím|laptop|sạc|nồi|son|giày|sandal|đầm|váy|hút bụi|bình|sách|vợt|serum|kem|mỹ phẩm|đồ|mua|tìm|sản phẩm|gợi ý|hot|bán chạy|dưới|khoảng|rẻ/i.test(lower)
  )) {
    const hasPriceConstraint = /dưới|khoảng|từ|giá|rẻ/i.test(lower);
    return {
      intent: 'PRODUCT_RECOMMENDATION',
      replyText: `✨ **Gợi ý sản phẩm ${hasPriceConstraint ? 'theo mức giá phù hợp' : 'nổi bật nhất'} dành cho bạn:**\n\nNhấn **[🛒 Thêm giỏ]** hoặc **[⚡ Mua ngay]** để nhận ưu đãi tốt nhất:`,
      products: matchingProducts,
      suggestions: ['Xem thêm hàng khác', 'Lấy mã giảm giá', '👨‍💼 Kết nối nhân viên trực'],
    };
  }

  // -------------------------------------------------------------
  // PHẢN HỒI MẶC ĐỊNH NGẮN GỌN, RÕ RÀNG, ĐÚNG TRỌNG TÂM
  // -------------------------------------------------------------
  return {
    intent: 'GENERAL_GREETING',
    replyText: `Xin chào! Tôi là **Trợ Lý Mua Sắm & CSKH AI 24/7** 🛍️.\n\nTôi sẵn sàng giải đáp ngay mọi câu hỏi của bạn:\n• 🔍 **Gợi ý sản phẩm:** Tìm theo tên, ngân sách, thương hiệu.\n• 📦 **Tra cứu đơn hàng:** Kiểm tra tiến độ SPX Express thời gian thực.\n• 🎟️ **Kho Voucher:** Nhận mã giảm 15% & Freeship 30k.\n• 🎡 **Vòng quay may mắn:** Quay miễn phí & nhận Mini Xu.\n• 👨‍💼 **Gặp CSKH:** Chuyển ngay sang Chuyên viên Kim Ngân khi cần!`,
    suggestions: [
      'Gợi ý đồ công nghệ hot',
      'Tra cứu đơn hàng của tôi',
      'Lấy mã giảm giá 15% & Freeship',
      '👨‍💼 Gặp nhân viên tư vấn trực'
    ],
  };
}
