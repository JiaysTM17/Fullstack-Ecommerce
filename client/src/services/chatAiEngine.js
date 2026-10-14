/**
 * chatAiEngine.js - Trí Tuệ Nhân Tạo & Bộ Xử Lý Tri Thức TMĐT Toàn Diện
 * Chuyên trách xử lý ngôn ngữ tự nhiên tiếng Việt, phân loại đa ý định (Compound Intent Classification),
 * tra cứu 109 sản phẩm theo đa tiêu chí, điều phối Dual Voucher, kiểm tra vận đơn SPX Express,
 * và giải đáp tức thì không lòng vòng mọi tình huống mua sắm & hậu mãi.
 */

import { FALLBACK_PRODUCTS } from './productService.js';
import { analyzeSentiment } from './aiAlgorithms.js';

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
  const sentiment = analyzeSentiment(raw);

  // Khách hàng bức xúc cực độ -> Tự động kích hoạt cơ chế ưu tiên xoa dịu (trừ trường hợp hỏi về chế tài bom hàng)
  if (sentiment.isFrustrated && chatMode === 'ai' && !/bom hàng|bùng hàng|bùng đơn|tại sao bị khóa cod/i.test(lower)) {
    return {
      intent: 'FRUSTRATED_CUSTOMER_RECOVERY',
      sentiment,
      replyText: `**[ƯU TIÊN ĐẶC BIỆT] Em vô cùng thấu hiểu và xin lỗi về trải nghiệm chưa tốt của bạn!**\n\n• Hệ thống đã ghi nhận tình huống khẩn cấp này và gán cờ hỗ trợ VIP.\n• Tặng bạn Voucher thiện chí **MINI50K** (Giảm ngay 50.000₫) cho đơn hàng tiếp theo.\n• Bạn có muốn em kết nối trực tiếp với Chuyên Viên CSKH Kim Ngân ngay bây giờ không ạ?`,
      suggestions: ['Kết nối ngay với Kim Ngân', 'Tra cứu mã vận đơn SPX', 'Yêu cầu trả hàng hoàn tiền 1-click'],
    };
  }

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
      replyText: `**[KẾT NỐI] Đang kết nối Chuyên Viên CSKH Kim Ngân (#CSKH-8821)!**\n\n• Toàn bộ lịch sử trao đổi của bạn đã được chuyển giao an toàn.\n• Chuyên viên sẽ trực tiếp giải quyết khiếu nại, hỗ trợ đổi trả và áp mã độc quyền ngay lập tức.`,
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
        replyText: `Dạ em Kim Ngân xin chào tạm biệt anh/chị ạ! Quyền hỗ trợ đã được chuyển lại cho Trợ Lý AI Fullstack 24/7. Chúc anh/chị mua sắm vui vẻ!`,
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
      replyText: `**[GỢI Ý] Đã tìm thấy sản phẩm phù hợp & tặng kèm mã giảm giá kép cho bạn:**\n\n• Áp dụng mã \`MINI10\` (Giảm 10%) hoặc \`SUPERDEAL\` (Giảm 15%).\n• Xếp chồng cùng lúc mã \`FREESHIP\` (Giảm 30.000₫ vận chuyển).\n\nNhấn **[Thêm giỏ]** hoặc **[Mua ngay]** bên dưới:`,
      products: foundProds,
      vouchers: VOUCHER_KNOWLEDGE.slice(0, 3),
      suggestions: ['Áp mã vào giỏ hàng', 'Xem hàng giao hỏa tốc 2H', 'Kết nối nhân viên trực'],
    };
  }

  // 2. Kết hợp Shop cụ thể + Sản phẩm
  const matchedShop = MALL_STORES_KNOWLEDGE.find(s => lower.includes(s.name.toLowerCase()) || lower.includes(s.id));
  if (matchedShop || targetShop) {
    const currentShop = matchedShop || targetShop;
    const shopProds = searchSmartProducts(lower).filter(p => p.shopName?.toLowerCase().includes(currentShop.name.toLowerCase()) || true).slice(0, 3);
    return {
      intent: 'SHOP_PRODUCT_QUERY',
      replyText: `**[GIAN HÀNG] Gian hàng chính hãng: ${currentShop.name}**\n\n• Danh mục: ${currentShop.category} (Đánh giá: ${currentShop.rating} / 5 sao)\n• 100% hàng chính hãng đầy đủ hóa đơn VAT, hỗ trợ bảo hành từ 12-24 tháng.\n• Dưới đây là sản phẩm nổi bật của gian hàng:`,
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
      replyText: `**HƯỚNG DẪN ÁP DỤNG ĐỒNG THỜI DUAL VOUCHER & MINI XU:**\n\n1. **Bước 1 (Mã Đơn Hàng):** Chọn 1 mã giảm giá sản phẩm (\`MINI10\` giảm 10% hoặc \`SUPERDEAL\` giảm 15%).\n2. **Bước 2 (Mã Vận Chuyển):** Chọn thêm 1 mã \`FREESHIP\` để trừ 30.000₫ cước vận chuyển.\n3. **Bước 3 (Khấu Trừ Mini Xu):** Gạt công tắc "Dùng Mini Xu" tại trang thanh toán để cấn trừ thêm tới **50% giá trị đơn hàng** (1 Xu = 1 VNĐ).\n\nCả 3 ưu đãi này được tự động cộng dồn giúp bạn tiết kiệm tối đa!`,
      vouchers: VOUCHER_KNOWLEDGE.slice(0, 3),
      suggestions: ['Xem giỏ hàng của tôi', 'Săn thêm mã giảm giá', 'Mở vòng quay nhận xu'],
    };
  }

  // -------------------------------------------------------------
  // TIẾNG LÓNG MUA SẮM & XỬ LÝ GENZ / TÌNH HUỐNG THƯỜNG GẶP
  // -------------------------------------------------------------

  // 1. Pass đơn / Nhượng đơn
  if (/pass đơn|nhượng đơn|chuyển đơn/i.test(lower)) {
    return {
      intent: 'PASS_ORDER_EXPLAIN',
      replyText: `**[LƯU Ý] CHÍNH SÁCH BẢO MẬT & ĐIỀU PHỐI ĐƠN HÀNG:**\n\n• Sàn **không hỗ trợ chuyển nhượng trực tiếp đơn hàng** giữa 2 tài khoản nhằm bảo mật thông tin cá nhân và chống lừa đảo giả mạo.\n• **Giải pháp tối ưu:**\n  1. Nếu chưa nhận hàng: Bạn có thể bấm **Hủy đơn** để được hoàn tiền/mã giảm giá 100% tự động.\n  2. Bạn bè của bạn có thể áp dụng mã \`MINI10\` và \`FREESHIP\` để đặt lại đơn mới với giá ưu đãi tương đương!`,
      vouchers: VOUCHER_KNOWLEDGE.slice(0, 2),
      suggestions: ['Xem đơn hàng để hủy', 'Lấy mã giảm giá mới', 'Gặp nhân viên CSKH'],
    };
  }

  // 2. Cháy deal / Săn sale
  if (!/mua kèm|combo|bundle|fp-growth/i.test(lower) && /cháy deal|hết deal|deal sốc|săn sale|khung giờ sale/i.test(lower)) {
    return {
      intent: 'FLASH_SALE_TIPS',
      replyText: `**[MẸO SĂN DEAL] BÍ KÍP KHÔNG BỊ "CHÁY DEAL" TẠI MINI SHOPEE:**\n\n• **3 Khung Giờ Vàng Mỗi Ngày:** **00:00** (Siêu Deal Nửa Đêm) | **12:00** (Chính Ngọ Freeship) | **20:00** (Xả Kho Shopee Mall).\n• **Mẹo giật voucher 150k:** Cho sản phẩm vào giỏ trước 5 phút -> Canh đúng giây thứ 00 bấm Thanh toán với mã lưu sẵn.\n• Áp dụng cùng lúc **Dual Voucher** (Mã Đơn + Mã Ship) để đạt giá đáy!`,
      vouchers: VOUCHER_KNOWLEDGE.slice(0, 3),
      suggestions: ['Xem sản phẩm Flash Sale', 'Lưu trước mã giảm giá', 'Mở vòng quay nhận xu'],
    };
  }

  // 3. Bom hàng / Bùng hàng / Khóa COD
  if (/bom hàng|bùng hàng|bùng đơn|tài khoản xấu/i.test(lower)) {
    return {
      intent: 'TRUST_SCORE_WARNING',
      replyText: `**[CẢNH BÁO AN TOÀN] HỆ QUẢ CỦA HÀNH VI BÙNG ĐƠN / BOM HÀNG:**\n\n• Tài khoản có tỷ lệ từ chối nhận hàng vô cớ > 30% sẽ bị **hạ điểm uy tín Trust Score dưới 50 điểm**.\n• **Chế tài tự động:** Hệ thống sẽ tạm khóa phương thức thanh toán tiền mặt (COD), yêu cầu thanh toán trước qua **VietQR** hoặc Thẻ.\n• Nếu có sự cố bất khả kháng khi bưu tá giao đến, vui lòng chọn "Hẹn lại lịch giao" thay vì từ chối nhận để bảo toàn điểm uy tín nhé!`,
      suggestions: ['Xem đơn hàng đang giao', 'Thanh toán VietQR an toàn', 'Gặp CSKH giải quyết'],
    };
  }

  // 4. Tư vấn phối đồ & Gợi ý Combo mua kèm (Cross-sell & Bundle)
  if (!/deal sốc|tiết kiệm|fp-growth|lift/i.test(lower) && /phối đồ|combo|mua kèm|set đồ|mix đồ|đi cùng|phù hợp với/i.test(lower)) {
    const isFashion = /áo|quần|giày|đầm|váy/i.test(lower);
    const isTech = /sạc|tai nghe|chuột|bàn phím|laptop/i.test(lower);

    if (isTech) {
      return {
        intent: 'TECH_BUNDLE_RECOMMEND',
        replyText: `**[COMBO CÔNG NGHỆ CHÍNH HÃNG] GỢI Ý MUA KÈM HOÀN HẢO:**\n\n• **Combo Bàn Làm Việc Pro:** Củ sạc nhanh GaN 65W + Cáp sạc bọc dù 100W + Chuột công thái học Bluetooth.\n• **Đặc quyền:** Mua combo tiết kiệm thêm 10% và được tặng mã Freeship 0Đ!`,
        products: searchSmartProducts('sạc GaN chuột tai nghe').slice(0, 3),
        suggestions: ['Thêm combo vào giỏ', 'Lấy mã FREESHIP', 'Xem sản phẩm bảo hành 24T'],
      };
    }

    return {
      intent: 'FASHION_BUNDLE_RECOMMEND',
      replyText: `**[GỢI Ý PHỐI ĐỒ CHUẨN GU SHOPEE MALL]:**\n\n• **Phong cách Smart Casual:** Áo Polo thoáng khí + Quần Tây Âu Slimfit + Giày Sneaker da trắng thanh lịch.\n• **Phong cách Dạo Phố GenZ:** Áo thun Oversize + Quần Jean Baggy Denim + Túi đeo chéo Canvas.\n\nNhấn xem sản phẩm bên dưới để chọn size vừa vặn:`,
      products: searchSmartProducts('áo polo quần tây sneaker').slice(0, 3),
      suggestions: ['Xem bảng size chuẩn', 'Lấy voucher 15%', 'Thêm combo vào giỏ'],
    };
  }

  // 5. Shipper gọi nhỡ / Giao không thành công / Hẹn lại lịch
  if (/gọi nhỡ|không có nhà|hẹn lại|giao lại|chưa nhận được hàng/i.test(lower)) {
    return {
      intent: 'REDELIVERY_GUIDE',
      replyText: `**[HỖ TRỢ PHÁT HÀNG SPX EXPRESS]:**\n\n• **Quy chế phát hàng:** Bưu tá SPX sẽ tự động thử giao lại **tối đa 3 lần trong vòng 48 giờ** hoàn toàn miễn phí.\n• **Nếu bạn bận hoặc đi vắng:** Hãy gọi lại cho số điện thoại của shipper hiển thị trên mục "Chi tiết đơn hàng" hoặc nhắn tin hẹn giờ nhận hàng thuận tiện.\n• Kiện hàng được bảo quản an toàn tại Bưu cục địa phương cho đến khi giao thành công!`,
      suggestions: ['Xem số điện thoại shipper', 'Tra cứu mã vận đơn', 'Kết nối CSKH Kim Ngân'],
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
        replyText: `**[VẬN ĐƠN] TÌNH TRẠNG VẬN ĐƠN THỜI GIAN THỰC (SPX EXPRESS)**\n\n• Hệ thống ghi nhận **${orders.length} đơn hàng** gần nhất của bạn.\n• Trạng thái: **Đang luân chuyển trên mạng lưới SPX** và dự kiến phát hàng thành công trong ngày hôm nay.`,
        orders,
        suggestions: ['Xem tất cả đơn hàng', 'Yêu cầu giao hỏa tốc', 'Kết nối nhân viên trực'],
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
      replyText: `**[CHÍNH SÁCH] ĐỔI TRẢ & HOÀN TIỀN 100% MIỄN PHÍ:**\n\n• **Thời hạn:** Miễn phí đổi trả trong vòng **7 ngày** kể từ khi nhận hàng.\n• **Quy trình:** Shipper SPX đến tận nhà thu hồi hàng, tiền hoàn về tài khoản trong **24 giờ**.\n• **Hủy đơn:** Nếu đơn ở trạng thái *Chờ xác nhận*, bạn có thể bấm Hủy ngay trong mục Đơn Mua.\n• **Bảo hành:** Cam kết bảo hành chính hãng từ 12 - 24 tháng đối với thiết bị điện tử.`,
      suggestions: ['Gặp Chuyên viên Kim Ngân hỗ trợ đổi trả', 'Xem lịch sử đơn mua', 'Tiếp tục mua sắm'],
    };
  }

  // -------------------------------------------------------------
  // VÒNG QUAY MAY MẮN & MINI XU (GAMIFICATION RULES)
  // -------------------------------------------------------------
  if (/vòng quay|quay thưởng|lượt quay|mini xu|xu|điểm danh|thưởng/i.test(lower)) {
    return {
      intent: 'GAMIFICATION_INFO',
      replyText: `**[ĐẶC QUYỀN] QUY TẮC VÒNG QUAY MAY MẮN & MINI XU CHUẨN XÁC:**\n\n• **Hoàn toàn miễn phí, TUYỆT ĐỐI KHÔNG trừ xu khi quay** (Xu được giữ để giảm giá khi mua sắm).\n• **1 lượt quay miễn phí mỗi ngày** (làm mới tự động vào 00:00 nửa đêm).\n• **Tặng thêm +1 lượt quay cho MỖI ĐƠN HÀNG đặt thành công**!\n• 100% cơ hội trúng quà: Xu thưởng khủng tới 5.000 Xu, Voucher 10%, Freeship 30k.\n\n**Số dư của bạn:** **${userCoins.toLocaleString('vi-VN')} Xu** | **Lượt quay:** **${totalSpins} lượt**`,
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
  if (!/hungarian|ghép bưu tá/i.test(lower) && /giao hàng|ship|vận chuyển|hỏa tốc|2h|spx now|phí ship|khi nào nhận/i.test(lower)) {
    return {
      intent: 'SHIPPING_INFO',
      replyText: `**[VẬN CHUYỂN] DỊCH VỤ VẬN CHUYỂN HỎA TỐC SPX EXPRESS:**\n\n• **Giao Siêu Tốc 2H (SPX Now):** Áp dụng nội thành TP.HCM & Hà Nội, nhận hàng trong vòng 120 phút.\n• **Giao Tiêu Chuẩn 24H:** Phủ sóng toàn quốc 63 tỉnh thành, giao nhanh đúng hẹn.\n• **Freeship toàn quốc:** Áp dụng mã \`FREESHIP\` để trừ ngay 30.000₫ cước vận chuyển!`,
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
      replyText: `**[THANH TOÁN] PHƯƠNG THỨC THANH TOÁN TIỆN LỢI & AN TOÀN:**\n\n1. **VietQR Ngân Hàng:** Quét mã QR tự động điền tiền & nội dung, xác nhận sau 3 giây.\n2. **Ví MoMo & ZaloPay:** Thanh toán 1-chạm cực nhanh.\n3. **Thẻ Quốc Tế Visa/MasterCard:** Bảo mật chuẩn PCI-DSS.\n4. **Thanh toán khi nhận hàng (COD):** Được **đồng kiểm ngoại quan** cùng shipper trước khi thanh toán.`,
      suggestions: ['Xem giỏ hàng của tôi', 'Săn mã giảm giá', 'Tiếp tục mua sắm'],
    };
  }

  // -------------------------------------------------------------
  // GIAN HÀNG CHÍNH HÃNG SHOPEE MALL
  // -------------------------------------------------------------
  if (/gian hàng|shop|cửa hàng|mall|chính hãng|hãng/i.test(lower)) {
    return {
      intent: 'MALL_STORES',
      replyText: `**[SHOPEE MALL] 12 GIAN HÀNG CHÍNH HÃNG ĐỘC QUYỀN:**\n\n100% hàng chính hãng, hóa đơn VAT đầy đủ, chính sách đổi trả 7 ngày tận nhà. Dưới đây là các gian hàng uy tín nhất:`,
      stores: MALL_STORES_KNOWLEDGE.slice(0, 6),
      suggestions: ['Xem TechWorld', 'Xem ChicLady', 'Xem HomeMaster'],
    };
  }

  // -------------------------------------------------------------
  // KHO VOUCHER & KHUYẾN MÃI
  // -------------------------------------------------------------
  if (!/raft|bảo đảm tồn kho|hết hàng vô lý|mua kèm|combo|bundle|fp-growth/i.test(lower) && /voucher|mã|giảm giá|khuyến mãi|ưu đãi|deal/i.test(lower)) {
    return {
      intent: 'VOUCHER_EXPLORE',
      replyText: `**[VOUCHER] KHO MÃ GIẢM GIÁ ĐỘC QUYỀN ĐANG KHẢ DỤNG:**\n\nNhấn **[Dùng ngay]** để hệ thống tự động áp dụng trực tiếp vào đơn hàng của bạn:`,
      vouchers: VOUCHER_KNOWLEDGE.slice(0, 4),
      suggestions: ['Hướng dẫn dùng 2 voucher', 'Gợi ý hàng bán chạy', 'Mở vòng quay nhận quà'],
    };
  }

  // -------------------------------------------------------------
  // PHASE 9: TRI-ROLE AI COPILOT BUYER ASSISTANT INTENTS
  // -------------------------------------------------------------

  // 1. Bảo Vệ & Đồng Bộ Giỏ Hàng Đa Thiết Bị CRDT (CART_CRDT_SYNC_PROTECT)
  if (/giỏ hàng.*không mất|đồng bộ giỏ hàng.*điện thoại|giỏ hàng.*máy tính|giỏ hàng offline|crdt giỏ hàng|bảo vệ giỏ hàng/i.test(lower)) {
    return {
      intent: 'CART_CRDT_SYNC_PROTECT',
      replyText: `**[BẢO VỆ GIỎ HÀNG THÔNG MINH CRDT] BẠN HOÀN TOÀN YÊN TÂM NHÉ!**\n\n• **Công nghệ đồng bộ không khóa (CRDT)**: Mọi sản phẩm bạn thêm vào giỏ hàng trên điện thoại sẽ tự động xuất hiện nguyên vẹn trên laptop hoặc máy tính bảng.\n• **Chế độ Ngoại tuyến (Offline-First)**: Dù mạng di động chập chờn hay mất kết nối tạm thời, giỏ hàng của bạn vẫn được lưu giữ an toàn và tự động đồng bộ ngay khi có mạng trở lại.\n• Không lo bị mất hàng hay phải tìm lại sản phẩm từ đầu trong các đợt Flash Sale!`,
      suggestions: ['Xem giỏ hàng của tôi', 'Săn thêm mã giảm giá', 'Tiếp tục mua sắm'],
    };
  }

  // 2. Đề Xuất Sản Phẩm Độc Đáo, Tránh Hàng Trùng Lặp Clone (UNIQUE_CATALOG_RECOMMEND)
  if (/tìm sản phẩm độc lạ|không trùng lặp|tránh hàng clone|hàng chính hãng khác biệt|sản phẩm độc đáo|catalog clone/i.test(lower)) {
    return {
      intent: 'UNIQUE_CATALOG_RECOMMEND',
      replyText: `**[GỢI Ý SẢN PHẨM ĐỘC ĐÁO CHÍNH HÃNG]:**\n\n• Hệ thống radar **LSH MinHash** của sàn đã tự động lọc bỏ các danh mục copycat, hàng giả và shop clone lừa đảo.\n• Dưới đây là các sản phẩm chính hãng độc quyền từ gian hàng Shopee Mall uy tín với chất lượng và thiết kế khác biệt hoàn toàn:`,
      products: searchSmartProducts('độc đáo cao cấp chính hãng').slice(0, 3),
      suggestions: ['Xem thêm hàng Mall', 'Lấy voucher 15%', 'Xem chính sách bảo hành'],
    };
  }

  // 3. Minh Bạch Vị Trí Tài Trợ & Đấu Thầu Quảng Cáo (SPONSORED_ADS_TRANSPARENCY)
  if (/tại sao có nhãn tài trợ|quảng cáo tìm kiếm|sản phẩm tài trợ là gì|shop tài trợ|quảng cáo tài trợ/i.test(lower)) {
    return {
      intent: 'SPONSORED_ADS_TRANSPARENCY',
      replyText: `**[MINH BẠCH QUẢNG CÁO TÀI TRỢ]:**\n\n• Nhãn **"Tài trợ"** (Sponsored) biểu thị sản phẩm được hiển thị ưu tiên thông qua cơ chế đấu thầu vị trí **GSP (Generalized Second Price)** công khai.\n• **Tiêu chuẩn kiểm duyệt khắt khe**: Sản phẩm chỉ được xuất hiện ở vị trí tài trợ khi đạt Điểm chất lượng (Quality Score) cao: tỷ lệ đánh giá tốt >= 4.5 sao, nguồn gốc chính hãng và tỷ lệ hoàn tất đơn hàng uy tín.\n• Người bán thắng thầu chỉ trả mức chi phí hợp lý để đem lại những gợi ý chuẩn xác nhất cho bạn!`,
      suggestions: ['Xem gian hàng Mall uy tín', 'Săn voucher giảm giá', 'Tra cứu đơn hàng'],
    };
  }

  // 4. Minh Bạch Nguồn Dữ Liệu & Cơ Chế Hoạt Động Chat AI (BUYER_AI_TRANSPARENCY)
  if (/dữ liệu thực tế|đọc từ sàn|lập trình sẵn|cơ chế ai|lấy dữ liệu ở đâu|nguồn dữ liệu|tại sao trả lời nhanh/i.test(lower)) {
    return {
      intent: 'BUYER_AI_TRANSPARENCY',
      replyText: `**[MINH BẠCH DỮ LIỆU & CƠ CHẾ TRỢ LÝ AI]:**\n\n• **Dữ liệu thực tế 100%**: AI đọc trực tiếp danh mục **109 sản phẩm**, kho voucher đang mở, giỏ hàng cá nhân và trạng thái đơn hàng SPX Express của chính bạn.\n• **Tốc độ phản hồi tức thì**: Sử dụng engine AI suy luận biên (Client-side Inference) giúp phân tích ý định và tìm kiếm sản phẩm trong vòng mili-giây mà không làm gián đoạn trải nghiệm mua sắm.\n• **Gợi ý chuẩn xác**: Kết hợp thuật toán lọc cộng tác (Item Affinity) và lọc từ cấm an toàn, đảm bảo bạn luôn nhận được sản phẩm chính hãng với giá tốt nhất!`,
      suggestions: ['Gợi ý sản phẩm hot', 'Lấy voucher giảm giá', 'Kiểm tra đơn hàng'],
    };
  }

  // -------------------------------------------------------------
  // PHASE 10: ADVANCED DISTRIBUTED & HEURISTIC ALGORITHMS SUITE
  // -------------------------------------------------------------

  // 5. Tìm Kiếm Bằng Ảnh & Sản Phẩm Tương Tự Vector HNSW (VISUAL_IMAGE_SEARCH_HNSW)
  if (/tìm bằng ảnh|tìm kiếm bằng hình ảnh|visual search|sản phẩm tương tự bằng ảnh|quét ảnh tìm đồ/i.test(lower)) {
    return {
      intent: 'VISUAL_IMAGE_SEARCH_HNSW',
      replyText: `**[TÌM KIẾM HÌNH ẢNH VECTOR HNSW] TÌM ĐỒ CHUẨN XÁC CHỈ SAU 1 CÚ NHẤP!**\n\n• **Công nghệ HNSW Vector Search**: Hệ thống trích xuất vector đặc trưng hình ảnh (CLIP Embedding 128 chiều) và tìm kiếm trên đồ thị phân tầng HNSW với độ trễ siêu tốc dưới 5 mili-giây.\n• **Độ tương đồng cao**: Bạn chỉ cần tải ảnh mẫu hoặc chụp món đồ yêu thích, AI sẽ tự động gợi ý các sản phẩm có cùng kiểu dáng, màu sắc và chất liệu chính hãng với giá tốt nhất!`,
      products: searchSmartProducts('thời trang giày áo túi xách').slice(0, 3),
      suggestions: ['Tải ảnh tìm kiếm', 'Gợi ý sản phẩm hot', 'Săn voucher 15%'],
    };
  }

  // 6. Giao Hỏa Tốc 2H & Ghép Bưu Tá Tối Ưu Hungarian (EXPRESS_COURIER_DISPATCH_HUNGARIAN)
  if (/giao hỏa tốc 2h|ghép bưu tá|shipper giao nhanh|tại sao giao hàng nhanh|spx hungarian/i.test(lower)) {
    return {
      intent: 'EXPRESS_COURIER_DISPATCH_HUNGARIAN',
      replyText: `**[SPX EXPRESS 2H] ĐIỀU PHỐI BƯU TÁ TỐI ƯU HUNGARIAN:**\n\n• **Ghép bưu tá thông minh**: Thuật toán Hungarian Algorithm tự động gán bưu tá SPX đang ở gần Shop nhất và có lộ trình di chuyển tối ưu tới địa chỉ nhận của bạn.\n• **Đảm bảo SLA giao hàng 2h**: Giảm tối đa thời gian chờ lấy hàng và tránh tắc đường, đảm bảo gói hàng được giao hỏa tốc tận tay đúng cam kết.\n• **Theo dõi trực tiếp**: Bạn có thể theo dõi vị trí bưu tá di chuyển từng phút trên bản đồ GPS của đơn hàng!`,
      suggestions: ['Tra cứu đơn hàng của tôi', 'Xem chính sách SPX 2H', 'Liên hệ CSKH'],
    };
  }

  // 7. Bảo Đảm Công Bằng & Không Bán Vượt Kho Flash Sale Raft (FLASH_SALE_CONSENSUS_FAIR_QUEUE)
  if (/giật deal flash sale|săn deal không sợ ảo|hết hàng flash sale|bảo đảm tồn kho flash sale|raft flash sale/i.test(lower)) {
    return {
      intent: 'FLASH_SALE_CONSENSUS_FAIR_QUEUE',
      replyText: `**[BẢO ĐẢM CÔNG BẰNG FLASH SALE RAFT CONSENSUS]:**\n\n• **Chống bán vượt kho (Zero Overselling)**: Cụm máy chủ phân tán đồng thuận qua thuật toán Raft Consensus, đảm bảo chỉ những đơn hàng hợp lệ được ghi nhận vào Quorum mới xác nhận thành công.\n• **Xếp hàng công bằng tuyệt đối**: Triệt tiêu hiện tượng bot gian lận hoặc lỗi phân mảnh não đôi (Split-Brain). Mỗi chiếc deal sốc 1,000₫ đều được trao minh bạch cho người mua nhanh tay nhất!`,
      suggestions: ['Xem khung giờ Flash Sale', 'Nạp ví Mini Xu', 'Săn voucher Freeship'],
    };
  }

  // -------------------------------------------------------------
  // PHASE 11: PATTERN MINING, BIN PACKING & GOSSIP PROTOCOL
  // -------------------------------------------------------------

  // 8. Mua Kèm Deal Sốc & Gợi Ý Combo Tiết Kiệm (COMBO_BUNDLE_FP_GROWTH)
  if (/mua kèm deal sốc|combo tiết kiệm|mua chung giảm giá|gợi ý combo|deal sốc mua kèm/i.test(lower)) {
    return {
      intent: 'COMBO_BUNDLE_FP_GROWTH',
      replyText: `**[MUA KÈM DEAL SỐC FP-GROWTH] TIẾT KIỆM TỐI ĐA KHI MUA THEO BỘ!**\n\n• **Gợi ý thông minh từ giỏ hàng**: Thuật toán FP-Growth tự động nhận diện các sản phẩm thường được mua cùng nhau với hệ số tương quan cao (Lift ≥ 2.0).\n• **Ưu đãi kép**: Mua kèm phụ kiện hoặc sản phẩm bổ trợ với mức giảm thêm từ 10% - 20%, áp dụng chồng đồng thời với voucher toàn sàn và mã Freeship 30k!`,
      products: searchSmartProducts('phụ kiện cáp sạc ốp lưng chuột').slice(0, 3),
      suggestions: ['Xem các gói combo hot', 'Lấy voucher 15%', 'Thêm vào giỏ hàng'],
    };
  }

  // 9. Quy Chuẩn Đóng Gói & Kích Thước Kiện Hàng SPX Box (SPX_PACKING_BOX_STANDARDS)
  if (/kích thước kiện hàng|quy chuẩn đóng gói spx|hộp carton spx|cước quy đổi thể tích/i.test(lower)) {
    return {
      intent: 'SPX_PACKING_BOX_STANDARDS',
      replyText: `**[QUY CHUẨN ĐÓNG GÓI SPX BOX] TỐI ƯU HÓA THỂ TÍCH & BẢO VỆ ĐƠN HÀNG:**\n\n• **Thùng carton chuẩn SPX**: Hệ thống áp dụng thuật toán Bin Packing xếp đặt hàng hóa vào các hộp tiêu chuẩn (Hộp S: 15x12x10cm, Hộp M: 25x20x15cm, Hộp L: 35x25x20cm) đảm bảo an toàn tuyệt đối chống va đập.\n• **Không lo đội cước**: Giữ tỷ lệ lấp đầy ≥ 75% giúp giảm tối đa trọng lượng quy đổi thể tích ($V/5000$), mang lại giá cước vận chuyển tiết kiệm nhất cho bạn!`,
      suggestions: ['Tra cứu cước vận chuyển', 'Xem tiến độ đơn hàng', 'Chính sách đổi trả hàng'],
    };
  }

  // -------------------------------------------------------------
  // PHASE 12: SPX GRAPH ROUTING, ROARING BITMAPS & VIP RFM TIERS
  // -------------------------------------------------------------

  // 10. Lộ Trình Vận Chuyển Liên Tỉnh SPX Multi-Hub (SPX_MULTI_HUB_ROUTING)
  if (/lộ trình vận chuyển spx|spx chuyển qua đâu|các trạm trung chuyển spx|thời gian giao hàng liên tỉnh|định tuyến spx/i.test(lower)) {
    return {
      intent: 'SPX_MULTI_HUB_ROUTING',
      replyText: `**[SPX EXPRESS MULTI-HUB ROUTING] LỘ TRÌNH ĐIỀU PHỐI THÔNG MINH DIJKSTRA / A*:**\n\n• **Mạng lưới trạm trung chuyển toàn quốc**: Đơn hàng của bạn được luân chuyển qua các trung tâm khai thác quy mô lớn (Bắc Ninh Mega SOC, Vinh SOC, Đà Nẵng SOC, Củ Chi Mega SOC) theo lộ trình tối ưu thời gian di chuyển.\n• **Cập nhật từng trạm (Live Stepper)**: Mỗi khi gói hàng nhập và xuất kho trạm trung chuyển, hệ thống sẽ gửi thông báo đẩy và cập nhật ngay trên bản đồ theo dõi đơn hàng của bạn!`,
      suggestions: ['Tra cứu đơn hàng của tôi', 'Xem kích thước kiện hàng', 'Liên hệ bưu tá'],
    };
  }

  // 11. Bộ Lọc Đa Thuộc Tính Siêu Tốc (ROARING_BITMAPS_FACETED_FILTER)
  if (/lọc sản phẩm thông minh|tìm đồ theo nhiều tiêu chí|lọc theo giá và đánh giá|bộ lọc roaring/i.test(lower)) {
    return {
      intent: 'ROARING_BITMAPS_FACETED_FILTER',
      replyText: `**[TÌM KIẾM ĐA TIÊU CHÍ ROARING BITMAPS] TÌM ĐÚNG MÓN ĐỒ BẠN CẦN TRONG CHỚP MẮT!**\n\n• **Chỉ mục lọc siêu tốc**: Hệ thống áp dụng cấu trúc dữ liệu Roaring Bitmaps giúp bạn kết hợp đồng thời nhiều bộ lọc: Danh mục, Thương hiệu chính hãng, Khoảng giá, Đánh giá sao và Tỉnh thành kho hàng.\n• **Phản hồi tức thì**: Kết quả lọc hiển thị ngay lập tức không có độ trễ, giúp bạn nhanh chóng chọn được sản phẩm ưng ý với giá hời nhất!`,
      products: searchSmartProducts('thời trang công nghệ chính hãng').slice(0, 3),
      suggestions: ['Lọc hàng dưới 200k', 'Săn hàng Mall 5 sao', 'Lấy voucher Freeship'],
    };
  }

  // 12. Quyền Lợi Hạng Thành Viên & Khách Thân Thiết RFM (VIP_RFM_BENEFITS)
  if (/quyền lợi khách vip|hạng thành viên|khách hàng thân thiết|mini xu vip|champions shopee/i.test(lower)) {
    return {
      intent: 'VIP_RFM_BENEFITS',
      replyText: `**[HẠNG THÀNH VIÊN VIP MINI SHOPEE] ĐẶC QUYỀN MUA SẮM KHÔNG GIỚI HẠN!**\n\n• **Phân hạng tự động RFM**: Dựa trên tần suất mua sắm và tổng giá trị đơn hàng, hệ thống tự động thăng hạng khách hàng lên **Loyal** hoặc **Champions**.\n• **Đặc quyền độc quyền**: Tích lũy Mini Xu x2 cho mọi đơn hàng, mã hoàn xu 20%, voucher Freeship trọn đời và ưu tiên hỗ trợ trực tiếp từ Chuyên viên CSKH 24/7!`,
      suggestions: ['Xem số dư Mini Xu', 'Vào kho voucher của tôi', 'Quay vòng quay may mắn'],
    };
  }

  // -------------------------------------------------------------
  // PHASE 13: INVENTORY CLEARANCE, GEOHASH NEARBY & LINUCB FEED
  // -------------------------------------------------------------

  // 13. Săn Deal Xả Kho Giá Sốc Về Giá Sàn (CLEARANCE_DEALS_EXPLORE)
  if (/săn hàng xả kho|deal xả kho|hàng giảm giá sâu|xả tồn kho|xả hàng đón mẫu mới/i.test(lower)) {
    return {
      intent: 'CLEARANCE_DEALS_EXPLORE',
      replyText: `**[CHỢ XẢ KHO MINI SHOPEE] GIẢM ĐẾN 40% - 50% VỀ SÁT GIÁ GỐC!**\n\n• **Thanh lý tồn kho chính hãng**: Các sản phẩm tồn kho được giảm giá sâu theo thuật toán suy giảm tuổi tồn kho (Inventory Age Decay) để nhường chỗ cho bộ sưu tập mới.\n• **Cam kết chất lượng**: 100% hàng mới nguyên seal, chính hãng từ các Shop Mall uy tín với chính sách bảo hành và đổi trả 15 ngày miễn phí!`,
      products: searchSmartProducts('xả kho giảm giá rẻ').slice(0, 3),
      suggestions: ['Xem đồ gia dụng xả kho', 'Thời trang xả kho', 'Lấy voucher Freeship'],
    };
  }

  // 14. Tìm Bưu Cục SPX & Điểm Gửi Hàng Gần Nhất Bằng Geohash (GEOHASH_NEARBY_SPX_POST)
  if (/bưu cục spx gần tôi|điểm gửi hàng spx gần nhất|tìm bưu cục gần đây|spx drop-off gần/i.test(lower)) {
    return {
      intent: 'GEOHASH_NEARBY_SPX_POST',
      replyText: `**[ĐỊNH VỊ BƯU CỤC SPX GEOHASH] TÌM ĐIỂM GỬI & NHẬN HÀNG TRONG BÁN KÍNH 3KM!**\n\n• **Chỉ mục không gian Geohash**: Hệ thống tự động xác định vị trí của bạn và quét 8 ô lân cận để hiển thị các bưu cục SPX Express và điểm gửi hàng Drop-off Post gần nhất.\n• **Giờ làm việc**: Mở cửa từ 07:30 - 21:00 hàng ngày (kể cả Thứ 7 & Chủ Nhật) để bạn gửi và nhận hàng hỏa tốc thuận tiện nhất!`,
      suggestions: ['Xem bản đồ bưu cục', 'Tra cứu mã vận đơn SPX', 'Gặp CSKH'],
    };
  }

  // 15. Gợi Ý Hôm Nay Cá Nhân Hóa LinUCB (LINUCB_PERSONALIZED_FEED)
  if (/gợi ý hôm nay|sản phẩm dành riêng cho tôi|daily discover|cá nhân hóa|đề xuất cho tôi/i.test(lower)) {
    return {
      intent: 'LINUCB_PERSONALIZED_FEED',
      replyText: `**[DAILY DISCOVER LINUCB] BỘ SƯU TẬP ĐƯỢC CHỌN LỌC RIÊNG CHO BẠN!**\n\n• **AI LinUCB đa ngữ cảnh**: Phân tích khung giờ truy cập, thiết bị và sở thích danh mục của bạn để đề xuất các sản phẩm phù hợp nhất trong tầm giá.\n• **Ưu đãi kèm theo**: Các sản phẩm được cá nhân hóa kèm mã giảm giá độc quyền dành riêng cho tài khoản của bạn!`,
      products: searchSmartProducts('hot bán chạy mới').slice(0, 3),
      suggestions: ['Gợi ý thêm sản phẩm', 'Lấy voucher giảm 15%', 'Xem deal Flash Sale'],
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
      replyText: `**[GỢI Ý] Sản phẩm ${hasPriceConstraint ? 'theo mức giá phù hợp' : 'nổi bật nhất'} dành cho bạn:**\n\nNhấn **[Thêm giỏ]** hoặc **[Mua ngay]** để nhận ưu đãi tốt nhất:`,
      products: matchingProducts,
      suggestions: ['Xem thêm hàng khác', 'Lấy mã giảm giá', 'Kết nối nhân viên trực'],
    };
  }

  // -------------------------------------------------------------
  // PHẢN HỒI MẶC ĐỊNH NGẮN GỌN, RÕ RÀNG, ĐÚNG TRỌNG TÂM
  // -------------------------------------------------------------
  return {
    intent: 'GENERAL_GREETING',
    replyText: `Xin chào! Tôi là **Trợ Lý Mua Sắm & CSKH AI 24/7**.\n\nTôi sẵn sàng giải đáp ngay mọi câu hỏi của bạn:\n• **Gợi ý sản phẩm:** Tìm theo tên, ngân sách, thương hiệu.\n• **Tra cứu đơn hàng:** Kiểm tra tiến độ SPX Express thời gian thực.\n• **Kho Voucher:** Nhận mã giảm 15% & Freeship 30k.\n• **Vòng quay may mắn:** Quay miễn phí & nhận Mini Xu.\n• **Gặp CSKH:** Chuyển ngay sang Chuyên viên Kim Ngân khi cần!`,
    suggestions: [
      'Gợi ý đồ công nghệ hot',
      'Tra cứu đơn hàng của tôi',
      'Lấy mã giảm giá 15% & Freeship',
      'Gặp nhân viên tư vấn trực'
    ],
  };
}
