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
    !/chuông báo|báo giá|interval treap|simrank|fm[- ]index|burrows|cql|vrptw|ukkonen|suffix tree|gae|contraction|heavykeeper|heavy keeper|qr[- ]dqn|benders|loglog|sac[- ]auto|sac auto|mdpdptw|count[- ]min[- ]log|cml|tqpo|d[- ]darp|dynamic darp|count[- ]sketch|td3|sdvrptw|split delivery|hll martingale|adaptive kl|hfvrptw|đội xe hỗn hợp|hyperbitbit|rainbow dqn|evrptw|trạm đổi pin|xe điện xanh|ddsketch|sac[- ]per|sac per|mdevrp|sạc phi tuyến|xe điện đa kho|ultraloglog|mopo|tdvrptw|phụ thuộc giao thông|giờ cao điểm spx|kmv|cql continuous|cql cont|2e-vrptw|cross-dock|xe tải trung chuyển|akmv|td3\+bc|td3-bc|evrp-bss|đổi pin siêu tốc|đổi pin 3 phút/i.test(lower) &&
    (/mua|tìm|sản phẩm|\báo\b|\bquần\b|tai nghe|chuột|bàn phím|nồi|son|giày/i.test(lower)) &&
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
  if (!/deal sốc|tiết kiệm|fp-growth|lift|ppo|succinct|space[- ]saving|lossy counting|cpo|evrp[- ]bds|sạc mặt trời/i.test(lower) && /phối đồ|combo|mua kèm|set đồ|mix đồ|đi cùng|phù hợp với/i.test(lower)) {
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

  if (!/fm[- ]index|burrows|cql|vrptw|ukkonen|suffix tree|gae|contraction|heavykeeper|heavy keeper|qr[- ]dqn|benders|loglog|sac[- ]auto|sac auto|mdpdptw|count[- ]min[- ]log|cml|tqpo|d[- ]darp|dynamic darp|count[- ]sketch|td3|sdvrptw|split delivery|hll martingale|adaptive kl|hfvrptw|đội xe hỗn hợp|hyperbitbit|rainbow dqn|evrptw|trạm đổi pin|xe điện xanh|ddsketch|sac[- ]per|sac per|mdevrp|sạc phi tuyến|xe điện đa kho|ultraloglog|mopo|tdvrptw|phụ thuộc giao thông|giờ cao điểm spx|kmv|cql continuous|cql cont|2e-vrptw|cross-dock|xe tải trung chuyển|akmv|td3\+bc|td3-bc|evrp-bss|đổi pin siêu tốc|đổi pin 3 phút|tandem|truck[- ]drone|vrptw[- ]tandem|trpo|q[- ]digest|qdigest|dgim|wcsac|evrptw[- ]nl|lossy counting moments|mô-men tần suất|rcpo|reward constrained|vrptw[- ]td[- ]green|time[- ]dependent green|basso|space[- ]saving stream summary|stream summary|space[- ]saving summary|sac[- ]lagrangian|multi[- ]tier charging|trạm sạc đa tầng|evrptw[- ]multi[- ]tier|count[- ]min hierarchical|ppo[- ]entropy|battery swapping decay|đổi pin suy giảm|evrptw[- ]bsd|dyadic[- ]range|ddpg[- ]lagrangian|evrptw[- ]dwpt|dynamic wireless/i.test(lower) && /đơn hàng|tra cứu|vận đơn|tiến độ|giao đến đâu|đơn của tôi|ord/i.test(lower)) {
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
  if (!/vrpspd|simultaneous|giao thu đồng thời|morris|opoe/i.test(lower) && /hủy đơn|hủy hàng|đổi trả|hoàn tiền|trả hàng|bảo hành|lỗi/i.test(lower)) {
    return {
      intent: 'RETURN_REFUND_POLICY',
      replyText: `**[CHÍNH SÁCH] ĐỔI TRẢ & HOÀN TIỀN 100% MIỄN PHÍ:**\n\n• **Thời hạn:** Miễn phí đổi trả trong vòng **7 ngày** kể từ khi nhận hàng.\n• **Quy trình:** Shipper SPX đến tận nhà thu hồi hàng, tiền hoàn về tài khoản trong **24 giờ**.\n• **Hủy đơn:** Nếu đơn ở trạng thái *Chờ xác nhận*, bạn có thể bấm Hủy ngay trong mục Đơn Mua.\n• **Bảo hành:** Cam kết bảo hành chính hãng từ 12 - 24 tháng đối với thiết bị điện tử.`,
      suggestions: ['Gặp Chuyên viên Kim Ngân hỗ trợ đổi trả', 'Xem lịch sử đơn mua', 'Tiếp tục mua sắm'],
    };
  }

  // -------------------------------------------------------------
  // VÒNG QUAY MAY MẮN & MINI XU (GAMIFICATION RULES)
  // -------------------------------------------------------------
  if (!/fisher-yates|provably fair|xu hướng|reservoir|hld|smart locker|spx locker|tủ khóa thông minh|vrptw-crs|space[- ]saving|lossy counting|cpo|evrp-bds|sạc mặt trời/i.test(lower) && /vòng quay|quay thưởng|lượt quay|mini xu|\bxu\b|điểm danh|thưởng/i.test(lower)) {
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
  if (!/hungarian|ghép bưu tá|ghép shipper|splay|nghẽn|thông lượng|edmonds-karp|hopcroft|johnson|vrp|giao hàng xanh|co2|branch[- ]and[- ]cut|vrptw|contraction|benders|mdpdptw|d[- ]darp|dynamic darp|tqpo|cml|count[- ]min[- ]log|count[- ]sketch|td3|sdvrptw|split delivery|hll martingale|adaptive kl|hfvrptw|đội xe hỗn hợp|hyperbitbit|rainbow dqn|evrptw|trạm đổi pin|xe điện xanh|ddsketch|sac[- ]per|sac per|mdevrp|sạc phi tuyến|xe điện đa kho|ultraloglog|mopo|tdvrptw|phụ thuộc giao thông|giờ cao điểm spx|kmv|cql continuous|cql cont|2e-vrptw|cross-dock|xe tải trung chuyển|akmv|td3\+bc|td3-bc|evrp-bss|đổi pin siêu tốc|đổi pin 3 phút|fcm|edac|dtrp|min-sum latency|chèn hỏa tốc|ams|f2 moment|calql|cal-ql|vrptw-crs|smart locker|spx locker|tủ khóa thông minh|space[- ]saving|lossy counting|cpo|evrp-bds|sạc mặt trời|solar micro-hub|sticky[- ]sampling|sticky sampling|qrdpg|qr-ddpg|drone|vrptw-d|giao hàng drone|bjkst|awac|vrptw-cc|trung chuyển gom hàng|gk[- ]quantile|iql|road[- ]pricing|mdvrptw|thu phí nội đô|phí chống ùn tắc|morris|loglog counter|đếm morris|opoe|epistemic uncertainty|bất định nhận thức|vrpspd|simultaneous pickup|giao thu đồng thời|đổi trả tận nhà|fast[- ]agms|agms sketch|bcq|mtvrptw|multi[- ]trip|spot|spot pricing|soft time window|cửa sổ mềm|vrptw[- ]soft|misra|gries|laplacian|vrptw[- ]stochastic|stochastic service|kps|karp|cqrd|cvar|battery degradation|evrptw[- ]battery|hhh|hierarchical|dsac|vrptw[- ]cross[- ]dock|bilateral|frequent[- ]directions|matrix sketch|ppo[- ]lagrangian|lagrangian|evrptw[- ]queue|hàng đợi trạm sạc|q[- ]digest|qdigest|trpo|trust region|vùng tin cậy|tandem|truck[- ]drone|vrptw[- ]tandem|dgim|wcsac|evrptw[- ]nl|lossy counting moments|mô-men tần suất|rcpo|reward constrained|vrptw[- ]td[- ]green|time[- ]dependent green|basso|space[- ]saving stream summary|stream summary|space[- ]saving summary|sac[- ]lagrangian|multi[- ]tier charging|trạm sạc đa tầng|evrptw[- ]multi[- ]tier|count[- ]min hierarchical|ppo[- ]entropy|battery swapping decay|đổi pin suy giảm|evrptw[- ]bsd|dyadic[- ]range|ddpg[- ]lagrangian|evrptw[- ]dwpt|dynamic wireless/i.test(lower) && /giao hàng|ship|vận chuyển|hỏa tốc|2h|spx now|phí ship|khi nào nhận/i.test(lower)) {
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
  if (!/leaky bucket|codel|suurballe/i.test(lower) && /thanh toán|chuyển khoản|vietqr|momo|zalopay|thẻ|visa|cod|đồng kiểm/i.test(lower)) {
    return {
      intent: 'PAYMENT_INFO',
      replyText: `**[THANH TOÁN] PHƯƠNG THỨC THANH TOÁN TIỆN LỢI & AN TOÀN:**\n\n1. **VietQR Ngân Hàng:** Quét mã QR tự động điền tiền & nội dung, xác nhận sau 3 giây.\n2. **Ví MoMo & ZaloPay:** Thanh toán 1-chạm cực nhanh.\n3. **Thẻ Quốc Tế Visa/MasterCard:** Bảo mật chuẩn PCI-DSS.\n4. **Thanh toán khi nhận hàng (COD):** Được **đồng kiểm ngoại quan** cùng shipper trước khi thanh toán.`,
      suggestions: ['Xem giỏ hàng của tôi', 'Săn mã giảm giá', 'Tiếp tục mua sắm'],
    };
  }

  // -------------------------------------------------------------
  // GIAN HÀNG CHÍNH HÃNG SHOPEE MALL
  // -------------------------------------------------------------
  if (!/k-d tree|kd tree|bán kính|quanh đây/i.test(lower) && /gian hàng|shop|cửa hàng|mall|chính hãng|hãng/i.test(lower)) {
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
  if (!/raft|bảo đảm tồn kho|hết hàng vô lý|mua kèm|combo|bundle|fp-growth|dancing links|exact cover|voucher độc quyền|reservoir|deal hot xu hướng|hld|leaky bucket|chuông báo|báo giá|interval treap|simrank|wavelet|voronoi|contextual|lints|hopcroft|planarity|hnsw pq|softmax bandit|sac|double[- ]array|multi[- ]commodity|fm[- ]index|burrows|cql|vrptw|ukkonen|suffix tree|gae|contraction|heavykeeper|heavy keeper|qr[- ]dqn|benders|loglog|sac[- ]auto|sac auto|mdpdptw|count[- ]min[- ]log|cml|tqpo|d[- ]darp|dynamic darp|count[- ]sketch|td3|sdvrptw|split delivery|hll martingale|adaptive kl|hfvrptw|đội xe hỗn hợp|hyperbitbit|rainbow dqn|evrptw|trạm đổi pin|xe điện xanh|ddsketch|sac[- ]per|sac per|mdevrp|sạc phi tuyến|xe điện đa kho|ultraloglog|mopo|tdvrptw|phụ thuộc giao thông|giờ cao điểm spx|kmv|cql continuous|cql cont|2e-vrptw|cross-dock|xe tải trung chuyển|akmv|td3\+bc|td3-bc|evrp-bss|đổi pin siêu tốc|đổi pin 3 phút|fcm|edac|dtrp|min-sum latency|chèn hỏa tốc|ams|f2 moment|calql|cal-ql|vrptw-crs|smart locker|spx locker|tủ khóa thông minh|space[- ]saving|lossy counting|cpo|evrp-bds|sạc mặt trời|solar micro-hub|sticky[- ]sampling|sticky sampling|qrdpg|qr-ddpg|drone|vrptw-d|giao hàng drone|bjkst|awac|vrptw-cc|trung chuyển gom hàng|gk[- ]quantile|iql|road[- ]pricing|mdvrptw|thu phí nội đô|phí chống ùn tắc|morris|loglog counter|đếm morris|opoe|epistemic uncertainty|bất định nhận thức|vrpspd|simultaneous pickup|giao thu đồng thời|đổi trả tận nhà|fast[- ]agms|agms sketch|bcq|mtvrptw|multi[- ]trip|spot|spot pricing|soft time window|cửa sổ mềm|vrptw[- ]soft|misra|gries|laplacian|vrptw[- ]stochastic|stochastic service|kps|karp|cqrd|cvar|battery degradation|evrptw[- ]battery|hhh|hierarchical|dsac|vrptw[- ]cross[- ]dock|bilateral|frequent[- ]directions|matrix sketch|ppo[- ]lagrangian|lagrangian|evrptw[- ]queue|hàng đợi trạm sạc|q[- ]digest|qdigest|trpo|trust region|vùng tin cậy|tandem|truck[- ]drone|vrptw[- ]tandem|dgim|wcsac|rủi ro đuôi|cvar pricing|evrptw[- ]nl|sạc phi tuyến|lossy counting moments|mô-men tần suất|rcpo|reward constrained|vrptw[- ]td[- ]green|time[- ]dependent green|basso|space[- ]saving stream summary|stream summary|space[- ]saving summary|sac[- ]lagrangian|multi[- ]tier charging|trạm sạc đa tầng|evrptw[- ]multi[- ]tier|count[- ]min hierarchical|ppo[- ]entropy|battery swapping decay|đổi pin suy giảm|evrptw[- ]bsd|dyadic[- ]range|ddpg[- ]lagrangian|evrptw[- ]dwpt|dynamic wireless/i.test(lower) && /voucher|mã|giảm giá|khuyến mãi|ưu đãi|deal/i.test(lower)) {
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
  if (!/splay|hopcroft|kuhn-munkres|tdigest|huffman/i.test(lower) && /giao hỏa tốc 2h|ghép bưu tá|shipper giao nhanh|tại sao giao hàng nhanh|spx hungarian/i.test(lower)) {
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
  if (!/ppo|succinct/i.test(lower) && /mua kèm deal sốc|combo tiết kiệm|mua chung giảm giá|gợi ý combo|deal sốc mua kèm/i.test(lower)) {
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
  if (!/sac|double[- ]array|multi[- ]commodity/i.test(lower) && /săn hàng xả kho|deal xả kho|hàng giảm giá sâu|xả tồn kho|xả hàng đón mẫu mới/i.test(lower)) {
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

  // 16. Thông Lượng Mạng Lưới Vận Chuyển SPX (SPX_MAX_FLOW_LOGISTICS)
  if (/mạng lưới spx|thông lượng spx|tại sao spx không bị nghẽn|giao hàng mùa sale|edmonds-karp/i.test(lower)) {
    return {
      intent: 'SPX_MAX_FLOW_LOGISTICS',
      replyText: `**[MẠNG LƯỚI SPX SIÊU TỐC] TẠI SAO ĐƠN HÀNG LUÔN THÔNG SUỐT NGAY CẢ MÙA SIÊU SALE?**\n\n• **Điều phối thông lượng cực đại**: Hệ thống SPX áp dụng thuật toán luồng cực đại (Edmonds-Karp Max Flow) kết hợp giám sát nút thắt cổ chai Min-Cut theo thời gian thực.\n• **Tự động giải phóng ách tắc**: Khi các trung tâm phân loại chính có nguy cơ quá tải, kiện hàng của bạn sẽ được tự động phân luồng qua các tuyến dự phòng để bảo đảm đúng hẹn giao nhận 100%!`,
      suggestions: ['Tra cứu mã vận đơn SPX', 'Xem bưu cục gần tôi', 'Gặp CSKH'],
    };
  }

  // 17. Ghép Shipper Siêu Tốc SPX (SPX_BATCH_DISPATCH_HOPCROFT)
  if (/ghép shipper tự động|tại sao shipper nhận đơn nhanh|spx hopcroft/i.test(lower)) {
    return {
      intent: 'SPX_BATCH_DISPATCH_HOPCROFT',
      replyText: `**[SPX TỰ ĐỘNG GHÉP SHIPPER] THUẬT TOÁN GHÉP CẶP LƯỠNG PHÂN HOPCROFT-KARP:**\n\n• **Gán đơn trong 3 giây**: Hệ thống tự động ghép đồng thời hàng trăm bưu tá đang trống chuyến với các gói hàng lân cận trong bán kính 3-5km.\n• **Tối đa hóa tỷ lệ giao thành công**: Loại bỏ thời gian shipper chờ đơn lẻ tẻ, đảm bảo đơn hỏa tốc của bạn được nhận và giao ngay trong 120 phút!`,
      suggestions: ['Tra cứu mã vận đơn SPX', 'Xem bưu cục gần tôi', 'Gặp CSKH'],
    };
  }

  // 18. Nhận Diện Chu Kỳ Mua Sắm Cá Nhân Hóa (BUYER_PURCHASE_CYCLE_ASSIST)
  if (/chu kỳ mua sắm của tôi|khi nào nên mua lại|nhắc mua hàng định kỳ|dtw chu kỳ/i.test(lower)) {
    return {
      intent: 'BUYER_PURCHASE_CYCLE_ASSIST',
      replyText: `**[TRỢ LÝ MUA SẮM THÔNG MINH DTW] DỰ BÁO CHU KỲ TÁI ĐẶT HÀNG CỦA BẠN:**\n\n• **Công nghệ Dynamic Time Warping (DTW)**: Hệ thống tự động so khớp mẫu khoảng cách thời gian giữa các lần bạn mua sắm (chuỗi thời gian co giãn), không phụ thuộc vào độ lệch ngày lẻ.\n• **Nhắc nhở thông minh không làm phiền**: Dựa trên chu kỳ tiêu dùng quen thuộc, AI sẽ chuẩn bị sẵn mã giảm giá Freeship và thông báo ngay khi sản phẩm yêu thích của bạn sắp hết để bạn kịp thời bổ sung với giá hời nhất!`,
      suggestions: ['Xem giỏ hàng của tôi', 'Săn mã giảm giá 15%', 'Xem hàng bán chạy'],
    };
  }

  // 19. Minh Bạch Đánh Giá & Chống Review Ảo Bằng SimHash (BUYER_REVIEW_INTEGRITY_ASSIST)
  if (/đánh giá có thật không|review ảo|seeding sản phẩm|tin cậy đánh giá|simhash review/i.test(lower)) {
    return {
      intent: 'BUYER_REVIEW_INTEGRITY_ASSIST',
      replyText: `**[BẢO CHỨNG MINH BẠCH] HỆ THỐNG QUÉT REVIEW THẬT BẰNG SIMHASH:**\n\n• **Lọc bỏ 100% review seeding sao chép**: Mọi đánh giá sản phẩm đều được quét mã vân tay SimHash 64-bit và đo khoảng cách Hamming theo thời gian thực để loại trừ các đánh giá copy hàng loạt.\n• **Đánh giá kèm ảnh/video thật**: Hệ thống chỉ gắn nhãn "Đã mua hàng chính hãng" cho những đơn hàng giao thành công qua SPX Express để bạn hoàn toàn yên tâm lựa chọn!`,
      suggestions: ['Xem sản phẩm bán chạy', 'Lấy voucher 15%', 'Gặp CSKH'],
    };
  }

  // 20. Tra Cứu Tuyến Vận Chuyển Liên Tỉnh SPX Johnson (SPX_INTERPROVINCE_ROUTING_JOHNSON)
  if (/tuyến giao hàng liên tỉnh|cước phí liên tỉnh|tại sao phí ship rẻ|johnson spx|vận chuyển liên tỉnh/i.test(lower)) {
    return {
      intent: 'SPX_INTERPROVINCE_ROUTING_JOHNSON',
      replyText: `**[SPX TOÀN QUỐC] ĐỊNH TUYẾN TỐI ƯU TOÀN MẠNG BẰNG THUẬT TOÁN JOHNSON:**\n\n• **Tối ưu cước phí toàn quốc**: Hệ thống tính trước ma trận luân chuyển tối ưu giữa tất cả các trung tâm phân loại Bắc - Trung - Nam, giúp giảm cước vận chuyển liên tỉnh đến 25%.\n• **Đảm bảo lộ trình nhanh nhất**: Kết hợp Bellman-Ford và Dijkstra tự động lựa chọn các tuyến luân chuyển có trợ giá và hạ tầng cao tốc thông suốt, giao hàng an toàn chỉ từ 24 - 48h!`,
      suggestions: ['Tra cứu mã vận đơn SPX', 'Lấy voucher Freeship 30k', 'Xem bưu cục gần tôi'],
    };
  }

  // 21. Gợi Ý Xếp Chồng Voucher Độc Quyền Bằng Dancing Links (EXCLUSIVE_VOUCHER_EXACT_COVER)
  if (/voucher độc quyền|dancing links|exact cover|xếp chồng voucher không xung đột|tối ưu voucher độc quyền/i.test(lower)) {
    return {
      intent: 'EXCLUSIVE_VOUCHER_EXACT_COVER',
      replyText: `**[XẾP CHỒNG VOUCHER ĐỘC QUYỀN] THUẬT TOÁN DANCING LINKS (DLX):**\n\n• **Tối đa hóa mức giảm giá**: Khi bạn có nhiều mã giảm giá độc quyền cho các nhóm sản phẩm khác nhau, thuật toán Dancing Links tự động tìm ra sự kết hợp hoàn hảo phủ trọn giỏ hàng của bạn mà không có món đồ nào bị xung đột hay bỏ phí.\n• **Tiết kiệm tối đa trong 1-chạm**: Hệ thống sẽ tự động ghép mã giảm giá sâu nhất cho từng sản phẩm phù hợp để đơn hàng đạt mức thanh toán thấp nhất có thể!`,
      suggestions: ['Xem giỏ hàng của tôi', 'Kiểm tra kho voucher', 'Tiếp tục mua sắm'],
    };
  }

  // 22. Cam Kết Minh Bạch & Công Bằng Vòng Quay May Mắn (LUCKY_WHEEL_PROVABLY_FAIR)
  if (/fisher-yates|provably fair|vòng quay.*minh bạch|quay thưởng.*công bằng|kiểm chứng lượt quay/i.test(lower)) {
    return {
      intent: 'LUCKY_WHEEL_PROVABLY_FAIR',
      replyText: `**[MINH BẠCH 100%] VÒNG QUAY MAY MẮN ÁP DỤNG THUẬT TOÁN FISHER-YATES (PROVABLY FAIR):**\n\n• **Tuyệt đối không can thiệp**: Mọi kết quả quay thưởng đều được sinh ngẫu nhiên từ cặp Server Seed và Client Seed bằng thuật toán xáo trộn Fisher-Yates chuẩn mật mã.\n• **Kiểm toán công khai**: Bạn hoàn toàn có thể sao chép mã Hash cam kết trước lượt quay để tự mình kiểm chứng tính trung thực sau khi nhận giải!`,
      suggestions: ['Mở vòng quay may mắn', 'Xem bảng phần thưởng', 'Tiếp tục mua sắm'],
    };
  }

  // 23. Tìm Kiếm Ngữ Nghĩa & Đề Xuất Đa Tầng HNSW (SEMANTIC_SEARCH_HNSW_ASSIST)
  if (!/pq|product quantiz|hopcroft|tuyến không giao cắt|multi-probe|chùm tia|cosine lsh/i.test(lower) && /hnsw|semantic search|tìm kiếm ngữ nghĩa|sản phẩm tương tự|re-ranking/i.test(lower)) {
    return {
      intent: 'SEMANTIC_SEARCH_HNSW_ASSIST',
      replyText: `**[TÌM KIẾM THÔNG MINH] HỆ THỐNG GỢI Ý NGỮ NGHĨA HNSW MULTI-LAYER:**\n\n• **Hiểu ý định tự nhiên**: Bạn có thể tìm kiếm bằng ngôn ngữ đời thường (ví dụ: "đồ đi biển", "củ sạc du lịch nhỏ gọn"), hệ thống tự động ánh xạ vector ngữ nghĩa để tìm ra món đồ ưng ý nhất.\n• **Tái xếp hạng ưu tiên chất lượng**: Tự động đưa các sản phẩm có đánh giá cao $\\ge 4.8$ sao, tỷ lệ phản hồi nhanh và gian hàng Mall lên đầu trang để bạn mua sắm an tâm nhất!`,
      suggestions: ['Gợi ý đồ công nghệ hot', 'Xem sản phẩm bán chạy', 'Lấy mã giảm giá'],
    };
  }

  // 24. Điều Hướng Cây Danh Mục Nén Patricia Trie (CATEGORY_ROUTER_PATRICIA_ASSIST)
  if (!/hld|reservoir/i.test(lower) && /patricia|cây danh mục|điều hướng danh mục|breadcrumb|gale-shapley|ghép đôi người bán/i.test(lower)) {
    return {
      intent: 'CATEGORY_ROUTER_PATRICIA_ASSIST',
      replyText: `**[ĐIỀU HƯỚNG DANH MỤC THÔNG MINH] CẤU TRÚC PATRICIA TRIE & GHÉP ĐÔI GALE-SHAPLEY:**\n\n• **Duyệt cây danh mục siêu tốc**: Áp dụng cây tiền tố nén Patricia Trie giúp bạn chuyển đổi mượt mà giữa các ngành hàng đa tầng (Thời trang ➔ Nam ➔ Áo polo ➔ Đồ thể thao) với độ trễ phản hồi dưới $1\\text{ms}$.\n• **Gợi ý Shop phù hợp nhất**: Thuật toán Gale-Shapley tự động ghép bạn với các gian hàng có khoảng cách gần nhất, giao hàng hỏa tốc 2h và có sẵn voucher ưu đãi cao nhất!`,
      suggestions: ['Khám phá danh mục hot', 'Xem sản phẩm bán chạy', 'Lấy mã giảm giá'],
    };
  }

  // 25. Lộ Trình Giao Hàng Xanh SPX & Khung Giờ Flash Sale (GREEN_LOGISTICS_VRP_ASSIST)
  if (!/vrptw|vrpspd|simultaneous|giao thu đồng thời|fm[- ]index|burrows|cql|tdvrptw|mdevrp|2e-vrptw|evrp-bss|đổi pin siêu tốc|đổi pin 3 phút|mtvrptw|multi[- ]trip|soft time window|cửa sổ mềm|vrptw[- ]soft|vrptw[- ]stochastic|stochastic service|battery degradation|evrptw[- ]battery/i.test(lower) && /vrp|giao hàng xanh|green logistics|giảm co2|tiết kiệm phát thải|lộ trình spx|khung giờ flash sale/i.test(lower)) {
    return {
      intent: 'GREEN_LOGISTICS_VRP_ASSIST',
      replyText: `**[VẬN CHUYỂN XANH SPX & FLASH SALE] THUẬT TOÁN ĐỊNH TUYẾN ĐỘI XE VRP & CÂY ĐOẠN:**\n\n• **Logistics Thân Thiện Môi Trường**: Thuật toán định tuyến đa kho (MULTI-DEPOT VRP) tự động tối ưu các điểm dừng giao hàng theo vòng cung ngắn nhất, cắt giảm trung bình 25% quãng đường di chuyển và giảm phát thải khí carbon (CO₂) cho mỗi kiện hàng của bạn!\n• **Săn Deal Khung Giờ Vàng**: Công nghệ Cây Đoạn (Lazy Segment Tree) bảo đảm bạn đặt mua thành công đúng số lượng hàng giảm giá trong các khung giờ vàng (00h, 12h, 20h) mà không bao giờ bị báo ảo hay hủy đơn vì thiếu hàng!`,
      suggestions: ['Xem khung giờ Flash Sale', 'Tra cứu mã vận đơn SPX', 'Lấy voucher Freeship'],
    };
  }

  // 26. Gợi Ý Xu Hướng Trực Tiếp (Time-Decayed Reservoir Sampling) & Cây Danh Mục Đa Tầng HLD (TRENDING_DEALS_RESERVOIR_ASSIST)
  if (/deal hot xu hướng|bắt trend mua sắm|hồ chứa suy giảm|reservoir sampling|mẫu thời gian thực|cây danh mục hld|phân rã cây danh mục/i.test(lower)) {
    return {
      intent: 'TRENDING_DEALS_RESERVOIR_ASSIST',
      replyText: `**[XU HƯỚNG MUA SẮM & CÂY DANH MỤC] RESERVOIR SAMPLING & HLD:**\n\n• **Deal Hot Thời Gian Thực**: Thuật toán lấy mẫu hồ chứa có trọng số suy giảm (Time-Decayed Reservoir Sampling) bắt trúng các sản phẩm đang được người mua săn lùng nhiều nhất trong những phút vừa qua, giúp bạn không bỏ lỡ bất kỳ xu hướng mua sắm hot nào!\n• **Cây Danh Mục Đa Tầng Siêu Tốc**: Hệ thống phân rã cây nặng-nhẹ (HLD) hỗ trợ bạn lướt mượt mà qua các danh mục hàng sâu nhất với mức chiết khấu và phụ phí minh bạch tuyệt đối!`,
      suggestions: ['Khám phá Deal Hot Xu Hướng', 'Xem cây danh mục sản phẩm', 'Lấy voucher độc quyền'],
    };
  }

  // 27. Tìm Kiếm Shop & Món Quanh Đây Theo Bán Kính Bằng K-D Tree (NEARBY_RADIUS_KDTREE_ASSIST)
  if (/quanh đây|bán kính.*km|gần nhất.*giá|tìm kiếm theo bán kính|k-d tree|kd tree/i.test(lower)) {
    return {
      intent: 'NEARBY_RADIUS_KDTREE_ASSIST',
      replyText: `**[TÌM KIẾM QUANH ĐÂY] CÔNG NGHỆ CÂY KHÔNG GIAN K-D TREE (K-DIMENSIONAL TREE):**\n\n• **Lọc đa chiều siêu tốc**: Cấu trúc cây K-D Tree giúp bạn tìm thấy ngay các gian hàng gần bạn nhất (trong bán kính 1km - 5km) thỏa mãn đồng thời mức giá mong muốn và điểm đánh giá uy tín (Rating $\\ge 4.5\\star$).\n• **Giao Hỏa Tốc Siêu Tiết Kiệm**: Mua sắm từ các Shop lân cận giúp giảm tối đa cước phí vận chuyển và nhận hàng thần tốc trong vòng 30 - 60 phút qua SPX Now!`,
      suggestions: ['Tìm shop gần trong 3km', 'Xem ưu đãi ship hỏa tốc', 'Khám phá quán hot quanh đây'],
    };
  }

  // 28. Gợi Ý Sản Phẩm Hot Bằng Splay Tree & Phân Bổ Shipper Hỏa Tốc (HOT_SPLAY_COURIER_BATCH_ASSIST)
  if (/splay|deal splay|sản phẩm hot splay|ghép shipper|bưu tá hopcroft|giao hỏa tốc.*ghép|phân bổ shipper/i.test(lower)) {
    return {
      intent: 'HOT_SPLAY_COURIER_BATCH_ASSIST',
      replyText: `**[SẢN PHẨM HOT & GIAO HỎA TỐC] BỘ ĐÔI CÔNG NGHỆ SPLAY TREE VÀ HOPCROFT-KARP:**\n\n• **Cây tự điều chỉnh Splay Tree**: Tự động đưa các món đồ đang được hàng ngàn người săn đón lên đầu trang với tốc độ phản hồi $O(1)$, giúp bạn không bao giờ bỏ lỡ Flash Sale giới hạn!\n• **Ghép bưu tá Hopcroft-Karp**: Tự động ghép nối đơn hàng hỏa tốc 2H của bạn với shipper gần nhất có sẵn chỗ chứa, đảm bảo bưu tá nhận đơn lập tức và xuất phát giao ngay!`,
      suggestions: ['Xem deal hot đang splay', 'Đặt giao hỏa tốc 2h', 'Săn voucher giảm giá sốc'],
    };
  }

  // 29. Định Tuyến Bưu Kiện ALT & Lọc Sản Phẩm Theo Khoảng Giá Treap (ALT_ROUTING_TREAP_PRIORITY_ASSIST)
  if (/alt.*(định tuyến|router)|định tuyến.*alt|treap|cây treap|ưu tiên khoảng giá.*treap|lọc giá.*treap/i.test(lower)) {
    return {
      intent: 'ALT_ROUTING_TREAP_PRIORITY_ASSIST',
      replyText: `**[ĐỊNH TUYẾN ALT & CHỈ MỤC TREAP] TRẢI NGHIỆM GIAO NHẬN VÀ TÌM KIẾM TỐI TÂN:**\n\n• **Định tuyến bưu kiện ALT**: Sử dụng các trạm mốc chiến lược giúp hàng hóa của bạn luân chuyển giữa các Hub tỉnh thành theo tuyến đường ngắn nhất, giảm 1 ngày thời gian nhận hàng!\n• **Cây ưu tiên Treap**: Lọc chớp nhoáng các sản phẩm trong đúng mức ngân sách của bạn và tự động đưa các deal uy tín có điểm đánh giá cao nhất lên đầu!`,
      suggestions: ['Lọc khoảng giá sản phẩm', 'Tra cứu lộ trình đơn hàng', 'Khám phá sản phẩm tài trợ'],
    };
  }

  // 30. Trải Nghiệm Giật Deal Mượt Mà Leaky Bucket & Săn Hàng Hot Min-Max Heap (LEAKY_BUCKET_MIN_MAX_DEALS)
  if (!/codel|suurballe/i.test(lower) && /leaky bucket|xếp hàng đặt deal|chống nghẽn thanh toán|min-max heap|deal bán chạy nhất.*đọng kho|săn deal êm dịu/i.test(lower)) {
    return {
      intent: 'LEAKY_BUCKET_MIN_MAX_DEALS',
      replyText: `**[SĂN DEAL ÊM DỊU & HÀNG ĐỢI LEAKY BUCKET] TRẢI NGHIỆM ĐẶT HÀNG KHÔNG GIẬT LAG:**\n\n• **Bộ điều tiết Leaky Bucket**: Khi có hàng triệu lượt tranh mua Flash Sale cùng lúc, hệ thống điều tiết lưu lượng mượt mà theo nhịp đều đặn, đảm bảo đơn hàng và thanh toán VietQR của bạn không bao giờ bị nghẽn hay lỗi mạng!\n• **Cấu trúc Min-Max Heap**: Tự động hiển thị các món đồ bán chạy nhất (Top Velocity) và các deal xả hàng cực sốc (Dead Stock Clearance) với mức chiết khấu lên đến 70%!`,
      suggestions: ['Săn deal xả hàng 70%', 'Đặt hàng Flash Sale mượt mà', 'Xem giỏ hàng ưu tiên'],
    };
  }

  // 31. Khám Phá Shop Tương Đồng SimRank & Đặt Chuông Báo Giá Interval Treap (SIMRANK_INTERVAL_ALERT_ASSIST)
  if (/simrank|shop tương đồng.*mua|chuông báo giá|đặt thông báo giảm giá|interval treap|báo giá flash sale/i.test(lower)) {
    return {
      intent: 'SIMRANK_INTERVAL_ALERT_ASSIST',
      replyText: `**[SHOP TƯƠNG ĐỒNG & CHUÔNG BÁO GIÁ] TRẢI NGHIỆM MUA SẮM CHỦ ĐỘNG:**\n\n• **Gợi ý Shop tương đồng SimRank**: Hệ thống tự động tìm các gian hàng có chung phong cách và tệp khách hàng yêu thích với shop bạn đang xem, giúp bạn có thêm nhiều lựa chọn đa dạng và giá cả cạnh tranh!\n• **Chuông báo giá Interval Treap**: Đặt khoảng ngân sách bạn mong muốn (ví dụ: 150.000₫ - 200.000₫). Ngay khi sản phẩm giảm giá lọt vào khoảng này, bạn sẽ nhận được thông báo tức thì để săn deal kịp lúc!`,
      suggestions: ['Đặt chuông báo giảm giá', 'Khám phá shop tương đồng', 'Xem danh sách Flash Sale'],
    };
  }

  // 32. Khoanh Vùng Shipper R-Tree & Ổn Định Tải Hysteresis Flash Sale (RTREE_HYSTERESIS_FLASH_ASSIST)
  if (/r-?tree|bưu tá gần nhất.*r-tree|khoanh vùng shipper.*r-tree|hysteresis|ổn định hệ thống.*flash sale|săn deal không lag.*hysteresis/i.test(lower)) {
    return {
      intent: 'RTREE_HYSTERESIS_FLASH_ASSIST',
      replyText: `**[GIAO NHANH R-TREE & ỔN ĐỊNH TẢI HYSTERESIS] TRẢI NGHIỆM MUA SẮM TỐI TÂN:**\n\n• **Định vị Shipper siêu tốc bằng R-Tree**: Khi bạn chốt đơn hỏa tốc, cây R-Tree tự động quét và điều phối bưu tá SPX Instant đang trực chiến gần kho shop trong bán kính 2km, giúp shipper lấy hàng ngay sau 15 phút!\n• **Bảo vệ hệ thống Hysteresis chống lag**: Cơ chế điều phối tải hai ngưỡng (Dual-Threshold) giữ cho luồng đặt hàng và thanh toán VietQR luôn trơn tru, không bị rung giật hay nghẽn mạng ngay cả trong đợt mở bán Flash Sale triệu traffic!`,
      suggestions: ['Đặt đơn giao hỏa tốc 2h', 'Săn deal Flash Sale mượt mà', 'Xem trạng thái đơn hàng'],
    };
  }

  // 33. Giao Hàng Dự Phòng Suurballe & Chống Nghẽn Thanh Toán CoDel (SUURBALLE_CODEL_ASSIST)
  if (/suurballe|giao hàng dự phòng.*suurballe|lộ trình không trùng cạnh|codel|hàng đợi codel|chống nghẽn thanh toán.*codel/i.test(lower)) {
    return {
      intent: 'SUURBALLE_CODEL_ASSIST',
      replyText: `**[LỘ TRÌNH DỰ PHÒNG SUURBALLE & HÀNG ĐỢI CODEL] ĐẶT HÀNG NHANH VÀ GIAO ĐÚNG HẸN:**\n\n• **Lộ trình dự phòng Suurballe**: Đơn hàng liên tỉnh của bạn luôn được hệ thống SPX tính toán sẵn 2 tuyến đường song song không trùng cạnh. Nếu tuyến cao tốc chính gặp sự cố thời tiết, gói hàng sẽ tự động chuyển hướng qua tuyến dự phòng để giao tận tay bạn đúng hẹn!\n• **Thanh toán tức thì CoDel**: Hàng đợi thông minh CoDel kiểm soát thời gian lưu trú (Sojourn Time) dưới 5ms, xử lý hàng triệu lượt quét mã VietQR và xác nhận đơn hàng chỉ trong tích tắc!`,
      suggestions: ['Theo dõi lộ trình giao hàng', 'Thanh toán đơn hàng nhanh', 'Săn deal Flash Sale'],
    };
  }

  // 34. Phân Vị Wavelet, Bưu Cục Voronoi & Ưu Đãi Ngữ Cảnh Contextual Bandit (WAVELET_VORONOI_BANDIT_ASSIST)
  if (/wavelet|phân vị giá.*wavelet|delaunay|voronoi|bưu cục voronoi|hub gần nhất.*voronoi|contextual bandit|ưu đãi riêng cho tôi/i.test(lower)) {
    return {
      intent: 'WAVELET_VORONOI_BANDIT_ASSIST',
      replyText: `**[PHÂN VỊ GIÁ WAVELET, BƯU CỤC VORONOI & ƯU ĐÃI LINTS] MUA SẮM THÔNG MINH CÙNG AI:**\n\n• **Phân vị giá Wavelet Matrix**: Hệ thống tính toán tức thì mức giá trung vị (Median P50) và phân khúc giá phổ biến trên toàn sàn, giúp bạn an tâm mua đúng giá tốt nhất mà không sợ bị mua đắt!\n• **Bưu cục SPX Voronoi gần nhất**: Tự động xác định trung tâm giao nhận SPX gần địa chỉ giao hàng của bạn nhất theo bản đồ tam giác Delaunay & ô Voronoi, rút ngắn tối đa thời gian giao vận chặng cuối.\n• **Ưu đãi may đo Contextual Bandit**: Thuật toán LinTS phân tích giỏ hàng để tự động cấp mã giảm giá phù hợp nhất (Freeship Max, Giảm 20% hoặc Quà tặng), giúp bạn tối đa hóa số tiền tiết kiệm được!`,
      suggestions: ['Xem phân khúc giá tốt nhất', 'Kiểm tra bưu cục SPX gần nhất', 'Nhận ưu đãi dành riêng cho bạn'],
    };
  }

  // 35. Tuyến Vận Tải Không Giao Cắt Hopcroft-Tarjan, Nén Ảnh HNSW PQ & Banner Softmax (PLANAR_PQ_SOFTMAX_ASSIST)
  if (/tuyến không giao cắt|hopcroft-tarjan|tìm kiếm ảnh hnsw pq|nén ảnh pq|banner flash sale thông minh|softmax bandit/i.test(lower)) {
    return {
      intent: 'PLANAR_PQ_SOFTMAX_ASSIST',
      replyText: `**[HÀNH LANG SPX KHÔNG GIAO CẮT, NÉN ẢNH HNSW PQ & BANNER DEAL THÔNG MINH]:**\n\n• **Lộ trình không xung đột Hopcroft-Tarjan**: Tuyến luân chuyển SPX liên tỉnh được thiết kế theo cấu trúc đồ thị phẳng (Planar Corridors), triệt tiêu các nút giao cắt mặt đất giúp kiện hàng về tay bạn nhanh chóng mà không lo tắc đường!\n• **Tìm kiếm bằng ảnh siêu tốc HNSW PQ**: Công nghệ nén lượng tử hóa tích Product Quantization cho phép bạn tìm đồ bằng ảnh ngay tức thì trong 2 mili-giây với độ chính xác cao.\n• **Gợi ý Deal hot qua Softmax Bandit**: Sàn tự động phân tích thị hiếu của người mua để đẩy những sản phẩm Flash Sale và mẫu Banner chất lượng nhất lên trang chủ!`,
      suggestions: ['Tìm kiếm bằng ảnh ngay', 'Xem lộ trình bưu kiện SPX', 'Săn banner Deal hot'],
    };
  }

  // 36. Ghép Bưu Tá Tối Ưu Kuhn-Munkres, Giám Sát Độ Trễ P99 t-Digest & Cây Danh Mục Huffman (KUHN_TDIGEST_HUFFMAN_ASSIST)
  if (/ghép bưu tá kuhn-munkres|kuhn-munkres|độ trễ p99 t-digest|tdigest|t-digest|phân loại cây huffman|hierarchical softmax/i.test(lower)) {
    return {
      intent: 'KUHN_TDIGEST_HUFFMAN_ASSIST',
      replyText: `**[ĐIỀU PHỐI BƯU TÁ KUHN-MUNKRES, GIÁM SÁT P99 T-DIGEST & CÂY DANH MỤC HUFFMAN]:**\n\n• **Ghép bưu tá tối ưu Kuhn-Munkres**: Đơn hỏa tốc 2H của bạn được thuật toán gán cho shipper gần nhất có điểm đánh giá uy tín cao và xe còn chỗ, đảm bảo lấy hàng trong 15 phút đầu!\n• **Giám sát độ trễ t-Digest chuẩn xác**: Hệ thống đo đạc thời gian thanh toán và xử lý đơn với độ trễ P99 dưới 1 giây, cam kết trải nghiệm mua sắm mượt mà không bao giờ giật lag.\n• **Tìm kiếm danh mục siêu tốc Cây Huffman**: Hàng triệu sản phẩm được sắp xếp theo cây nhị phân tối ưu tần suất mua sắm, giúp bạn lọc đúng danh mục mong muốn chỉ sau $O(\\log_2 |V|)$ bước!`,
      suggestions: ['Theo dõi bưu tá SPX', 'Kiểm tra tốc độ hệ thống', 'Duyệt danh mục theo cây Huffman'],
    };
  }

  // 37. Thông Lượng Push-Relabel, Bộ Đệm Cuckoo Stash & Gợi Ý Đa Mục Tiêu Pareto (PUSH_RELABEL_CUCKOO_PARETO_ASSIST)
  if (/luồng cực đại push-relabel|push-relabel|bảng băm cuckoo stash|cuckoo stash|gợi ý tối ưu pareto|pareto frontier/i.test(lower)) {
    return {
      intent: 'PUSH_RELABEL_CUCKOO_PARETO_ASSIST',
      replyText: `**[HẠ TẦNG PUSH-RELABEL, BỘ ĐỆM CUCKOO STASH & GỢI Ý ĐA MỤC TIÊU PARETO]:**\n\n• **Hạ tầng Flash Sale không nghẽn Push-Relabel**: Thuật toán Preflow-Push điều phối lưu lượng thanh toán thông suốt, đảm bảo bạn săn Deal sốc 11.11 mượt mà không lo bị lỗi mạng!\n• **Tra cứu giá tức thì Cuckoo Stash**: Giá bán và tồn kho các sản phẩm Hot được phản hồi ngay trong $O(1)$ mili-giây, giúp bạn xem và chốt đơn ngay không cần tải lại trang.\n• **Gợi ý chuẩn xác Pareto Front 1**: AI tự động lọc ra các sản phẩm tốt nhất toàn diện (giá rẻ nhất, đánh giá cao nhất và giao nhanh nhất) để bạn mua sắm thông thái nhất!`,
      suggestions: ['Săn Deal Flash Sale mượt mà', 'Xem sản phẩm Pareto tốt nhất', 'Kiểm tra giỏ hàng'],
    };
  }

  // 38. Radar Bản Quyền Cosine LSH, Tìm Kiếm Ảnh HNSW Multi-Probe & Giá Động Double Q-Learning (COSINE_HNSW_DOUBLE_Q_ASSIST)
  if (/chống sao chép cosine lsh|cosine lsh|tìm kiếm ảnh hnsw multi-probe|hnsw multi-probe|giá flash sale double q|double q-learning/i.test(lower)) {
    return {
      intent: 'COSINE_HNSW_DOUBLE_Q_ASSIST',
      replyText: `**[TRỢ LÝ MUA SẮM THÔNG MINH - BẢO VỆ BẢN QUYỀN, TÌM KIẾM ẢNH & SĂN GIÁ DEAL SỐC]:**\n\n• **An tâm mua sắm chuẩn gốc với Cosine LSH**: Sàn quét và loại bỏ các sản phẩm giả mạo, nhái catalog để bạn luôn mua đúng hàng chính hãng chất lượng cao.\n• **Tìm kiếm hình ảnh thông minh HNSW Multi-Probe**: Chụp hoặc tải ảnh món đồ bạn yêu thích, hệ thống dò tìm chùm tia vector sẽ tìm đúng sản phẩm trong chớp mắt với độ chính xác cao.\n• **Giá sốc Flash Sale tối ưu từ Double Q-Learning**: Trợ lý AI định giá động mang đến mức chiết khấu cực sâu cho bạn mà shop vẫn duy trì khuyến mãi bền vững!`,
      suggestions: ['Tìm kiếm bằng hình ảnh', 'Săn giá sốc Flash Sale', 'Xem sản phẩm chính hãng'],
    };
  }

  // 39. Chống Gian Lận Vòng Kín Johnson, Tồn Kho Đa Chiều Matrix & Gợi Ý Ưu Đãi Actor-Critic (WASH_TRADE_MATRIX_ACTOR_CRITIC_ASSIST)
  if (/chống giao dịch ảo johnson|chu trình johnson|tồn kho đa chiều matrix segment tree|matrix segment tree|phân bổ voucher actor-critic|actor-critic/i.test(lower)) {
    return {
      intent: 'WASH_TRADE_MATRIX_ACTOR_CRITIC_ASSIST',
      replyText: `**[HỆ THỐNG AN NINH & GỢI Ý MUA SẮM THÔNG MINH]:**\n\n• **Chống gian lận vòng kín Johnson**: Sàn tự động phát hiện và ngăn chặn các tài khoản đặt đơn ảo thổi phồng đánh giá, giúp bạn luôn đọc được review thật 100% từ người mua thực tế!\n• **Kho hàng thông suốt 2D Matrix Segment Tree**: Tồn kho tại các kho gần bạn nhất được cập nhật theo mili-giây, đảm bảo hàng luôn sẵn sàng giao ngay không lo bị hủy đơn.\n• **Ưu đãi may đo riêng Actor-Critic**: Trợ lý AI tự động tính toán gói voucher phù hợp nhất với giỏ hàng của bạn (Freeship hoặc giảm giá trực tiếp) để bạn tiết kiệm tối đa khi thanh toán!`,
      suggestions: ['Nhận voucher may đo riêng', 'Xem sản phẩm kho gần nhất', 'Kiểm tra giỏ hàng'],
    };
  }

  // 40. Giao Vận Quadtree Hỏa Tốc, Chống Sao Chép Manku & Trợ Lý Tìm Kiếm Dueling DQN (SPATIAL_QUADTREE_MANKU_DUELING_DQN_ASSIST)
  if (/giao vận quadtree|điều phối shipper quadtree|spatial quadtree|chống sao chép manku|bảng hoán vị simhash|manku simhash|tìm kiếm dueling dqn|dueling dqn/i.test(lower)) {
    return {
      intent: 'SPATIAL_QUADTREE_MANKU_DUELING_DQN_ASSIST',
      replyText: `**[CÔNG NGHỆ GIAO VẬN & TÌM KIẾM MUA SẮM SIÊU TỐC]:**\n\n• **Bưu tá SPX gõ cửa hỏa tốc (Spatial Quadtree)**: Đơn hàng của bạn được tự động phân vùng và điều phối tức thì cho shipper gần bạn nhất theo thuật toán k-NN và khoảng cách Haversine, giao đến tay chỉ trong chớp mắt!\n• **Mua hàng chuẩn chính hãng (Manku SimHash Deduplication)**: Bảng hoán vị SimHash lọc sạch các sản phẩm copy mạo danh hoặc đạo nhái mô tả, đảm bảo bạn luôn chọn đúng gian hàng uy tín thật sự.\n• **Đề xuất từ khóa thông minh (Dueling DQN)**: Trợ lý tìm kiếm tự động học hỏi nhu cầu và hiển thị những sản phẩm bạn quan tâm nhất với giá tốt nhất trên sàn!`,
      suggestions: ['Tra cứu shipper giao hàng', 'Xem sản phẩm chính hãng', 'Nhận mã giảm giá độc quyền'],
    };
  }

  // 41. Giao Vận Ưu Tiên Primal-Dual, Tìm Kiếm Vector IVF-PQ & Săn Deal Phối Hợp MADDPG (PRIMAL_DUAL_IVF_PQ_MADDPG_ASSIST)
  if (/giao vận ưu tiên primal[- ]dual|primal[- ]dual|tìm kiếm ảnh ivf[- ]pq|ivf[- ]pq|deal phối hợp maddpg|maddpg/i.test(lower)) {
    return {
      intent: 'PRIMAL_DUAL_IVF_PQ_MADDPG_ASSIST',
      replyText: `**[CÔNG NGHỆ GIAO VẬN HỎA TỐC & SĂN DEAL ĐỈNH CAO]:**\n\n• **Giao vận ưu tiên Primal-Dual**: Đơn hàng gấp và khách hàng VIP được hệ thống tự động gán cho tài xế 5 sao có tốc độ giao nhanh nhất, bảo đảm nhận hàng chuẩn xác đúng hẹn 2h!\n• **Tìm kiếm siêu tốc IVF-PQ**: Tìm sản phẩm bằng hình ảnh hoặc từ khóa tương đồng diễn ra trong chớp mắt nhờ công nghệ lượng tử hóa vector phân đoạn ADC.\n• **Săn deal Flash Sale tốt nhất (MADDPG)**: Thuật toán AI điều phối giá bán giữa các shop đối tác, mang lại cho bạn combo giá hời nhất mà không bị độn giá ảo!`,
      suggestions: ['Kiểm tra đơn hỏa tốc', 'Tìm sản phẩm tương đồng', 'Xem deal hot hôm nay'],
    };
  }

  // 42. Bộ Lọc Súc Tích Succinct Bitmap, Combo Mua Kèm PPO & Giao Vận Cao Điểm Hopcroft-Karp (SUCCINCT_PPO_HOPCROFT_ASSIST)
  if (/bộ lọc súc tích|succinct bitmap|combo mua kèm ppo|ppo bundle|bưu tá cao điểm hopcroft|hopcroft[- ]karp/i.test(lower)) {
    return {
      intent: 'SUCCINCT_PPO_HOPCROFT_ASSIST',
      replyText: `**[MUA SẮM THÔNG MINH, COMBO GIÁ HỜI & GIAO HÀNG SIÊU TỐC]:**\n\n• **Bộ lọc sản phẩm siêu tốc (Succinct Bitmap)**: Lọc hàng trăm nghìn deal Mall, Flash Sale, FreeShip Xtra trong nháy mắt với độ mượt tuyệt đối!\n• **Gợi ý Combo Mua Kèm Hời Nhất (PPO)**: Tự động đề xuất các món đồ hoàn hảo đi kèm (Áo + Quần, Điện thoại + Ốp sạc) với mức giảm giá combo sâu nhất tiết kiệm tối đa cho bạn!\n• **Điều phối giao hàng giờ cao điểm (Hopcroft-Karp)**: Vào các dịp Sale lớn, thuật toán ghép đơn song song giúp bưu tá lấy hàng và giao ngay tới tay bạn mà không bị tắc nghẽn kho!`,
      suggestions: ['Xem combo mua kèm hot', 'Lọc sản phẩm Flash Sale', 'Theo dõi bưu tá giao hàng'],
    };
  }

  // 43. Xả Hàng Tồn Cận Hạn SAC, Kiểm Duyệt Double-Array & Điều Chuyển Kho Hub (SAC_DOUBLE_ARRAY_COMMODITY_ASSIST)
  if (/sac markdown|xả hàng cận hạn sac|hạ giá sac|kiểm duyệt từ cấm double[- ]array|double[- ]array|luân chuyển đa hàng hóa|multi[- ]commodity/i.test(lower)) {
    return {
      intent: 'SAC_DOUBLE_ARRAY_COMMODITY_ASSIST',
      replyText: `**[XẢ HÀNG CẬN DATE SAC, KIỂM DUYỆT TỪ CẤM & LUÂN CHUYỂN KHO LIÊN MIỀN]:**\n\n• **Săn deal xả hàng cận date cực sốc (SAC)**: Các mặt hàng date gần được giảm sâu tới 50% - 70% theo thuật toán Soft Actor-Critic giúp bạn săn được sản phẩm chất lượng với giá rẻ nhất!\n• **Mua sắm an toàn, nói không với hàng giả/vi phạm (Double-Array)**: Bộ lọc từ cấm tốc độ cao giúp sàn quét sạch bài đăng lừa đảo hoặc vi phạm tiêu chuẩn cộng đồng.\n• **Giao hàng nhanh từ mạng lưới kho liên kết (Multi-Commodity)**: Hàng hóa được tự động luân chuyển giữa các tổng kho SPX Hà Nội - Đà Nẵng - TP.HCM để luôn có sẵn hàng giao tận tay bạn trong ngày!`,
      suggestions: ['Săn deal xả hàng cận date', 'Xem danh mục chính hãng', 'Tra cứu hành trình liên kho'],
    };
  }

  // 44. Tìm Kiếm Chuỗi Con FM-Index, Ngân Sách CQL & Giao Đúng Giờ VRPTW (FM_INDEX_CQL_VRPTW_ASSIST)
  if (/fm[- ]index|burrows[- ]wheeler|tra cứu toàn văn fm-index|cql budget|ngân sách cql|branch[- ]and[- ]cut vrptw|khung giờ hẹn giao|giao đúng hẹn vrptw/i.test(lower)) {
    return {
      intent: 'FM_INDEX_CQL_VRPTW_ASSIST',
      replyText: `**[TÌM KIẾM MÃ LINH KIỆN FM-INDEX, VOUCHER TOÀN SÀN & GIAO HÀNG ĐÚNG HẸN]:**\n\n• **Tìm mã sản phẩm, model chuẩn xác (FM-Index)**: Công nghệ nén toàn văn BWT giúp bạn tìm kiếm mọi mã linh kiện, model chi tiết trong tích tắc với độ chính xác tuyệt đối!\n• **Kho voucher trợ giá khủng (CQL)**: Hệ thống học tăng cường ngoại tuyến tự động cấp ngân sách ưu đãi cho các ngành hàng hot nhất, giúp bạn luôn có mã giảm sâu khi chốt đơn.\n• **Giao đúng khung giờ bạn chọn (VRPTW)**: Lựa chọn khung giờ nhận hàng thuận tiện (Sáng, Chiều, Tối), shipper SPX sẽ có mặt chính xác theo lịch hẹn cam kết!`,
      suggestions: ['Tìm theo mã linh kiện', 'Nhận voucher ngành hàng', 'Chọn khung giờ nhận hàng'],
    };
  }

  // 45. Lá Chắn Đánh Giá Ảo Ukkonen, Khung Giờ Flash Sale GAE & Vận Chuyển Liên Tỉnh CH (UKKONEN_GAE_CH_ASSIST)
  if (/ukkonen|suffix tree|đánh giá ảo ukkonen|lcs spam|gae flash sale|khung giờ flash sale gae|contraction hierarchies|định tuyến liên tỉnh ch/i.test(lower)) {
    return {
      intent: 'UKKONEN_GAE_CH_ASSIST',
      replyText: `**[LÁ CHẮN ĐÁNH GIÁ THẬT UKKONEN, FLASH SALE KHỦNG & GIAO HÀNG LIÊN TỈNH SIÊU TỐC]:**\n\n• **Bảo vệ bạn khỏi đánh giá ảo (Ukkonen)**: Thuật toán cây hậu tố rút gọn phát hiện các đoạn văn bản seeding sao chép, giúp bạn chỉ đọc các đánh giá thật 100% từ người mua thực tế!\n• **Săn Deal Vàng đúng khung giờ vàng (GAE)**: AI phân tích lưu lượng để mở bán Flash Sale giảm sâu tới 50% vào các khung giờ vàng (0h, 12h, 21h) với ưu đãi độc quyền dành riêng cho bạn.\n• **Giao hàng liên tỉnh Bắc - Nam siêu tốc (Contraction Hierarchies)**: Công nghệ định tuyến đường cao tốc thông minh giúp kiện hàng SPX Express luân chuyển xuyên Việt và giao đến tận cửa nhà bạn chỉ trong 24h!`,
      suggestions: ['Xem sản phẩm có đánh giá chuẩn', 'Săn Flash Sale khung giờ vàng', 'Tra cứu hành trình đơn liên tỉnh'],
    };
  }

  // 46. Bắt Trend HeavyKeeper, Hạn Mức SpayLater QR-DQN & Điều Phối Kho Benders (HEAVYKEEPER_QRDQN_BENDERS_ASSIST)
  if (/heavykeeper|heavy keeper|trending stream|bắt trend heavykeeper|qr[- ]dqn|hạn mức qr-dqn|ví trả sau qr-dqn|benders|chuỗi cung ứng benders/i.test(lower)) {
    return {
      intent: 'HEAVYKEEPER_QRDQN_BENDERS_ASSIST',
      replyText: `**[XU HƯỚNG BÙNG NỔ HEAVYKEEPER, VÍ TRẢ SAU SPAYLATER & KHO HÀNG LIÊN TỈNH BENDERS]:**\n\n• **Bắt trọn sản phẩm Hot Trend bùng nổ (HeavyKeeper)**: Thuật toán luồng streaming cập nhật từng giây danh sách các món đồ đang được hàng triệu người săn đón trong Livestream!\n• **Mua trước trả sau 0% lãi suất (QR-DQN)**: Hệ thống học phân phối tự động cấp hạn mức SpayLater lên tới 30.000.000₫ và hỗ trợ hoàn tiền 1-chạm cực kỳ an toàn.\n• **Hàng luôn sẵn kho gần bạn nhất (Benders)**: Mạng lưới chuỗi cung ứng đa tầng Bắc - Trung - Nam tự động điều phối tồn kho về bưu cục gần nhà bạn, đặt là có ngay không lo hết hàng!`,
      suggestions: ['Xem sản phẩm Hot Trend', 'Kích hoạt Ví Trả Sau SpayLater', 'Tra cứu kho hàng gần nhất'],
    };
  }

  // 47. Đếm Lượt Xem LogLog-Beta, Deal Tối Ưu SAC-Auto & Giao Hai Chiều MDPDPTW (LOGLOGBETA_SACAUTO_MDPDPTW_ASSIST)
  if (/loglog[- ]beta|đếm lượt xem loglog-beta|sac[- ]auto|deal tối ưu sac-auto|mdpdptw|giao hai chiều mdpdptw|lấy hàng và giao hàng time windows/i.test(lower)) {
    return {
      intent: 'LOGLOGBETA_SACAUTO_MDPDPTW_ASSIST',
      replyText: `**[ĐO LƯỜNG LƯỢT XEM LOGLOG-BETA, GIÁ THẦU TỐI ƯU SAC-AUTO & GIAO HỎA TỐC HAI CHIỀU MDPDPTW]:**\n\n• **Lượt xem thật, người dùng thật (LogLog-Beta)**: Thuật toán LogLog-Beta đếm chính xác số lượng người xem duy nhất trên toàn sàn, đảm bảo bạn luôn nhìn thấy con số uy tín thật không bị ảo!\n• **Giá deal cạnh tranh nhất (SAC-Auto)**: Hệ thống tự động cân đối giá thầu Shopee Ads để các nhà bán uy tín mang đến mức giá ưu đãi nhất cho bạn mà không bị đẩy chi phí lên cao.\n• **Lấy hàng tận nơi & Giao tận tay đúng hẹn (MDPDPTW)**: Lịch trình giao nhận hai chiều giữa shop và người mua được SPX Express tối ưu hóa theo khung giờ bạn chọn, đảm bảo kiện hàng đến tay đúng lúc không phải chờ đợi!`,
      suggestions: ['Xem deal giá hời nhất', 'Kiểm tra lượt xem thật sản phẩm', 'Chọn khung giờ nhận hàng'],
    };
  }

  // 48. Đếm Lượt Click CML, Giá Flash Sale Sốc TQPO & Giao Hỏa Tốc Gom Chuyến D-DARP (CML_TQPO_DDARP_ASSIST)
  if (/count[- ]min[- ]log|cml sketch|tqpo|deal flash sale tqpo|d[- ]darp|dynamic darp|gom đơn hỏa tốc d-darp/i.test(lower)) {
    return {
      intent: 'CML_TQPO_DDARP_ASSIST',
      replyText: `**[TẦN SUẤT XEM CML, DEAL AN TOÀN TQPO & GIAO HỎA TỐC GHÉP CHUYẾN D-DARP]:**\n\n• **Lượt tương tác chuẩn xác triệu người dùng (CML Sketch)**: Nén bộ đếm logarit 8-bit giúp cập nhật tức thời các sản phẩm đang được hàng triệu người thêm vào giỏ hàng mà không lo nghẽn mạng!\n• **Giá Flash Sale rẻ vô địch mà chuẩn chất lượng (TQPO)**: Định giá cắt ngọn phân vị bảo vệ giá trị sản phẩm, đảm bảo bạn nhận trọn vẹn Deal sốc mà không sợ hàng cận date hay giảm chất lượng.\n• **Giao hỏa tốc 2H ghép chuyến SPX siêu tiết kiệm (D-DARP)**: Đơn hàng hỏa tốc được gom chuyến tối ưu, cam kết thời gian bưu tá giao tới tay bạn trong vòng 75 phút mà cước phí ship cực rẻ!`,
      suggestions: ['Săn Deal Flash Sale TQPO', 'Đặt giao hỏa tốc 2H SPX', 'Xem sản phẩm tương tác cao CML'],
    };
  }

  // 49. Biến Động Ròng Thật Count-Sketch, Deal Tối Ưu TD3 & Giao Tách Kiện SDVRPTW (COUNTSKETCH_TD3_SDVRPTW_ASSIST)
  if (/count[- ]sketch|count sketch|td3|đấu thầu td3|deal tối ưu td3|sdvrptw|split delivery|chia nhỏ đơn hàng sdvrptw/i.test(lower)) {
    return {
      intent: 'COUNTSKETCH_TD3_SDVRPTW_ASSIST',
      replyText: `**[BIẾN ĐỘNG THẬT COUNT-SKETCH, DEAL TỐI ƯU TD3 & GIAO HỎA TỐC TÁCH KIỆN SDVRPTW]:**\n\n• **Biến động mua ròng chuẩn xác (Count-Sketch)**: Thuật toán Count-Sketch trung vị tính bù trừ cả số lượt mua và hủy, giúp bạn nhìn thấy sản phẩm thực sự đang bán chạy nhất mà không bị số ảo!\n• **Giá thầu và Voucher trợ giá tối ưu (TD3)**: Hệ thống học tăng cường TD3 với cơ chế Clipped Double-Q giúp người bán cân đối chi phí quảng cáo, đem đến deal giảm giá thật sâu và bền vững cho bạn.\n• **Giao đơn sỉ, kiện lớn tận cửa không lo quá tải (SDVRPTW)**: Khi bạn đặt giỏ hàng cồng kềnh hoặc mua sỉ nhiều thùng hàng, hệ thống tự động tách kiện cho nhiều bưu tá giao cùng lúc đúng khung giờ bạn hẹn!`,
      suggestions: ['Xem deal giá tối ưu TD3', 'Mua sỉ giao tận nơi SDVRPTW', 'Kiểm tra tốc độ bán thật Count-Sketch'],
    };
  }

  // 50. Lượt Xem Tức Thì HLL Martingale, Deal An Toàn Adaptive KL & Đội Xe Hỗn Hợp HFVRPTW (HLL_MARTINGALE_ADAPTIVEKL_HFVRPTW_ASSIST)
  if (/hll martingale|martingale estimator|adaptive kl|ppo[- ]penalty|deal an toàn adaptive kl|hfvrptw|đội xe hỗn hợp/i.test(lower)) {
    return {
      intent: 'HLL_MARTINGALE_ADAPTIVEKL_HFVRPTW_ASSIST',
      replyText: `**[LƯỢT XEM TỨC THÌ HLL MARTINGALE, DEAL AN TOÀN ADAPTIVE KL & ĐỘI XE GIAO HỖN HỢP HFVRPTW]:**\n\n• **Lượt xem trực tiếp O(1) tức thời (HLL Martingale)**: Bộ tích lũy martingale cập nhật từng phần tử xem live mà không cần quét thanh ghi, đảm bảo con số người xem luôn chuẩn xác theo thời gian thực!\n• **Deal giảm giá sâu mà không lo lỗ vốn (Adaptive KL PPO)**: Hệ thống học tăng cường tự động siết chặt hệ số phạt beta khi thị trường biến động, giữ mức giá Flash Sale luôn an toàn trên giá vốn COGS.\n• **Đội xe giao hàng thông minh đa chủng loại (HFVRPTW)**: Tự động ghép đơn cho xe máy ngõ hẹp, xe ba gác điện và xe tải nhẹ giao đúng khung giờ hẹn với cước ship rẻ nhất!`,
      suggestions: ['Xem lượt xem Live HLL Martingale', 'Săn deal an toàn Adaptive KL', 'Chọn hình thức giao hàng SPX'],
    };
  }

  // 51. Lượt Xem 2-Bit HyperBitBit, Đấu Thầu Rainbow DQN & Giao Xe Điện Đổi Pin EVRPTW (HYPERBITBIT_RAINBOWDQN_EVRPTWBSS_ASSIST)
  if (!/evrptw[- ]queue|hàng đợi trạm sạc|frequent[- ]directions|ppo[- ]lagrangian|battery degradation|evrptw[- ]battery/i.test(lower) && /hyperbitbit|hyper-bitbit|2-bit sketch|rainbow dqn|rainbow-dqn|evrptw|trạm đổi pin|xe điện xanh|e-vrptw-bss/i.test(lower)) {
    return {
      intent: 'HYPERBITBIT_RAINBOWDQN_EVRPTWBSS_ASSIST',
      replyText: `**[LƯỢT XEM SIÊU NÉN HYPERBITBIT, DEAL CHUẨN RAINBOW DQN & GIAO HÀNG XANH ĐỔI PIN EVRPTW]:**\n\n• **Lượt xem thật cập nhật từng tích tắc (HyperBitBit)**: Công nghệ phác thảo 2-bit siêu nhẹ đo lường hàng triệu lượt xem Flash Sale trên toàn sàn mà không bao giờ bị nghẽn mạng!\n• **Giá deal giảm sâu nhất nhờ học tăng cường đỉnh cao (Rainbow DQN)**: Hệ thống 6 cải tiến độc lập cân đối chi phí quảng cáo và trợ giá tối ưu để bạn luôn săn được deal giá rẻ nhất.\n• **Đội xe máy điện giao hàng Net-Zero đổi pin siêu tốc (E-VRPTW-BSS)**: Kiện hàng SPX Express được giao bằng 100% xe điện bảo vệ môi trường, ghé trạm đổi pin nhanh 5 phút để luôn giao tới tận tay bạn đúng hẹn!`,
      suggestions: ['Xem lượt xem thật HyperBitBit', 'Săn deal trợ giá Rainbow DQN', 'Theo dõi bưu tá xe điện SPX'],
    };
  }

  // 52. Phân Vị Độ Trễ DDSketch, Giá Đa Mục Tiêu SAC-PER & Xe Điện Đa Kho MDEVRP-NL (DDSKETCH_SACPER_MDEVRPNL_ASSIST)
  if (!/wcsac|dgim|evrptw[- ]nl|cc[- ]cv/i.test(lower) && /ddsketch|sac-per|sac per|mdevrp|sạc phi tuyến|độ trễ sla|xe điện đa kho/i.test(lower)) {
    return {
      intent: 'DDSKETCH_SACPER_MDEVRPNL_ASSIST',
      replyText: `**[GIÁM SÁT ĐỘ TRỄ DDSKETCH, ĐỊNH GIÁ TỐI ƯU SAC-PER & GIAO VẬN ĐA KHO MDEVRP-NL]:**\n\n• **Chốt đơn siêu tốc đảm bảo chuẩn SLA (DDSketch)**: Hệ thống giám sát độ trễ chốt đơn và thanh toán VietQR với sai số dưới 1%, cam kết trải nghiệm mượt mà không bao giờ giật lag!\n• **Giá bán luôn ưu đãi và công bằng (SAC-PER)**: AI cân bằng đa mục tiêu giúp bạn luôn nhận được mức giá trợ giá tốt nhất mà không lo gian lận tăng giá ảo.\n• **Đội xe điện đa kho giao nhanh đúng hẹn (MDEVRP-NL-TW)**: Đơn hàng được điều phối từ kho SPX gần bạn nhất với thuật toán sạc nhanh thông minh, giao hàng chuẩn giờ cam kết!`,
      suggestions: ['Kiểm tra độ trễ thanh toán DDSketch', 'Săn deal trợ giá SAC-PER', 'Xem bưu cục SPX gần nhất'],
    };
  }

  // 53. Lượt Xem 4-Bit UltraLogLog, Deal An Toàn MOPO & Đội Xe Tránh Tắc Đường TDVRPTW (ULTRALOGLOG_MOPO_TDVRPTW_ASSIST)
  if (/ultraloglog|mopo|tdvrptw|tránh tắc đường|giờ cao điểm spx|định giá ngoại tuyến|đếm khách 4-bit|phụ thuộc giao thông/i.test(lower)) {
    return {
      intent: 'ULTRALOGLOG_MOPO_TDVRPTW_ASSIST',
      replyText: `**[ĐẾM KHÁCH 4-BIT ULTRALOGLOG, ĐỊNH GIÁ AN TOÀN MOPO & GIAO VẬN NÉ TẮC ĐƯỜNG TDVRPTW]:**\n\n• **Lượt xem thật chuẩn xác siêu nén (UltraLogLog)**: Công nghệ nén thanh ghi 4-bit tiết kiệm 33% RAM ghi nhận chính xác từng người xem deal trên sàn Mini Shopee mà không lo quá tải!\n• **Giá trợ giá chuẩn mực từ dữ liệu lịch sử (MOPO)**: Học tăng cường ngoại tuyến với cơ chế phạt bất định giúp loại bỏ rủi ro, bảo đảm khách hàng nhận được mức giá trợ giá bền vững và không bao giờ bị đội giá ảo.\n• **Đội xe SPX Express thông minh thích ứng giờ cao điểm (TDVRPTW)**: Tự động điều chỉnh lộ trình né các tuyến phố ùn tắc sáng (07h-09h) và chiều tối (17h-19h), đảm bảo kiện hàng được giao tới tay bạn chuẩn từng phút!`,
      suggestions: ['Xem lượng khách xem UltraLogLog', 'Săn deal bảo đảm MOPO', 'Theo dõi lộ trình né tắc đường SPX'],
    };
  }

  // 54. Ước Lượng Lượng Khách KMV, Trợ Giá Liên Tục CQL & Giao Hàng Vệ Tinh Hai Tầng 2E-VRPTW (KMV_CQL_2EVRPTW_ASSIST)
  if (!/bjkst|awac|vrptw[- ]cc|hhh|hierarchical|dsac|bilateral|song phương/i.test(lower) && /kmv|cql continuous|cql cont|2e-vrptw|cross-dock|xe tải trung chuyển|giao hàng hai tầng|trạm vệ tinh/i.test(lower)) {
    return {
      intent: 'KMV_CQL_2EVRPTW_ASSIST',
      replyText: `**[ƯỚC LƯỢNG KHÁCH KMV, TRỢ GIÁ LIÊN TỤC CQL & GIAO HÀNG HAI TẦNG 2E-VRPTW-CD]:**\n\n• **Bảo mật tuyệt đối thông tin cá nhân (KMV Sketch)**: Công nghệ băm K-Minimum Values đo lường chính xác lượng khách quan tâm và sự tương đồng giữa các chương trình Flash Sale mà không lưu trữ ID hay số điện thoại của bạn!\n• **Giá trợ giá liên tục thông minh (CQL Continuous)**: Học tăng cường ngoại tuyến tự động điều chỉnh mức giá tối ưu theo thời gian thực mà không bao giờ bán dưới giá vốn an toàn.\n• **Giao hàng thần tốc qua trạm vệ tinh hai tầng (2E-VRPTW-CD)**: Xe tải van trung chuyển từ CDC tới các trạm vệ tinh đô thị, đội xe máy điện xanh phân phối chặng cuối tận ngõ nhà bạn đúng giờ hẹn!`,
      suggestions: ['Xem lượng quan tâm bằng KMV', 'Săn giá tốt CQL Continuous', 'Tra cứu giao hàng hai tầng 2E-VRPTW'],
    };
  }

  // 55. Ước Lượng Thích Ứng AKMV, Học Tăng Cường TD3+BC & Giao Vận Đổi Pin Siêu Tốc 3 Phút EVRP-BSS (AKMV_TD3BC_BSS_ASSIST)
  if (/akmv|td3\+bc|td3-bc|evrp-bss|đổi pin siêu tốc|đổi pin 3 phút|trạm đổi pin bss/i.test(lower)) {
    return {
      intent: 'AKMV_TD3BC_BSS_ASSIST',
      replyText: `**[ƯỚC LƯỢNG THÍCH ỨNG AKMV, TRỢ GIÁ HỌC TĂNG CƯỜNG TD3+BC & GIAO VẬN ĐỔI PIN SIÊU TỐC 3 PHÚT EVRP-BSS]:**\n\n• **Đo lường lượng khách thích ứng (AKMV Sketch)**: Tự động điều chỉnh kích thước bộ nhớ theo độ chính xác yêu cầu, bảo vệ riêng tư dữ liệu người mua sắm trên sàn.\n• **Trợ giá cân bằng học máy (TD3+BC)**: Định giá bán thông minh qua Reinforcement Learning kết hợp phạt lệch hành vi lịch sử, đảm bảo giá ưu đãi tối đa nhưng không bao giờ dưới sàn an toàn.\n• **Đội xe máy điện giao hàng đổi pin siêu tốc 3 phút (EVRP-BSS)**: Shipper SPX đổi trạm pin xanh trong tích tắc 3 phút, năng lượng hồi phục 100% giúp kiện hàng đến tay bạn đúng khung giờ cam kết (SLA)!`,
      suggestions: ['Xem lượng khách thích ứng AKMV', 'Tìm hiểu trợ giá TD3+BC', 'Theo dõi xe điện đổi pin 3 phút EVRP-BSS'],
    };
  }

  // 56. Phác Thảo Nhanh FCM, Trợ Giá Đa Dạng EDAC & Giao Hỏa Tốc DTRP (FCM_EDAC_DTRP_ASSIST)
  if (/fcm|conservative update|cu-cms|edac|ensemble-diversified|dtrp|min-sum latency|chèn hỏa tốc|giao hỏa tốc dtrp/i.test(lower)) {
    return {
      intent: 'FCM_EDAC_DTRP_ASSIST',
      replyText: `**[PHÁC THẢO NHANH FCM, TRỢ GIÁ AN TOÀN EDAC & GIAO HỎA TỐC DTRP]:**\n\n• **Bắt sóng sản phẩm sốt dẻo (FCM Sketch & Cây Dyadic)**: Đo lường chính xác lượng tương tác sản phẩm trong từng phân khúc giá Flash Sale mà không sợ nghẽn mạng hay sai số ảo!\n• **Trợ giá thông minh an toàn (EDAC Offline Pricing)**: AI đa chiều tự động cân đối giá ưu đãi tốt nhất cho bạn nhưng luôn bảo vệ uy tín và vốn sản xuất của shop đối tác.\n• **Giao hàng hỏa tốc tối ưu thời gian chờ (DTRP Router)**: Đơn hàng SPX Now 1-2h của bạn được chèn linh hoạt vào tuyến đường bưu tá gần nhất theo mục tiêu giảm thiểu thời gian chờ, nhận hàng đúng hẹn cam kết!`,
      suggestions: ['Xem khoảng giá hot Dyadic FCM', 'Săn giá trợ giá an toàn EDAC', 'Theo dõi bưu tá hỏa tốc DTRP'],
    };
  }

  // 57. Phác Thảo Moment AMS, Định Giá Hiệu Chuẩn Cal-QL & Tủ Khóa Thông Minh VRPTW-CRS (AMS_CALQL_LOCKER_ASSIST)
  if (/ams sketch|f2 moment|ams frequency|cal-ql|calql|value calibration|vrptw-crs|smart locker|tủ khóa thông minh|spx locker|nhận hàng tại tủ/i.test(lower)) {
    return {
      intent: 'AMS_CALQL_LOCKER_ASSIST',
      replyText: `**[MOMENT AMS, ĐỊNH GIÁ HIỆU CHUẨN CAL-QL & TỦ KHÓA THÔNG MINH VRPTW-CRS]:**\n\n• **Bắt sóng xu hướng bất ngờ (AMS Sketch $F_2$)**: Đo lường chuẩn xác độ biến động và độ tập trung lượt xem/mua trong Flash Sale bằng moment tần số bậc 2 $F_2$, phát hiện ngay trào lưu hot trend mà không lo nghẽn bộ nhớ!\n• **Định giá hiệu chuẩn an toàn (Cal-QL Pricing)**: AI định giá offline thông minh tự động hiệu chuẩn theo giá tham chiếu nền $V^\\mu(s)$, chỉ phạt thận trọng khi vượt ngưỡng và luôn khóa trần đối thủ cùng sàn giá vốn $+5\\%$.\n• **Nhận hàng tủ khóa thông minh (VRPTW-CRS Smart Locker)**: Tự động gom đơn tới 5 trạm SPX Smart Locker (Times City, Keangnam, Royal City, IPH, Tràng Tiền) trong bán kính đi bộ $\\le 400\\text{m}$, tặng ngay 500 Xu thưởng cho bạn và giảm khí thải CO2 bảo vệ môi trường!`,
      suggestions: ['Xem tủ SPX Smart Locker gần tôi', 'Săn giá ưu đãi Cal-QL an toàn', 'Nhận 500 Xu nhận hàng tại tủ'],
    };
  }

  // 58. Cặp Mua Kèm Space-Saving, Định Giá Ràng Buộc CPO & Xe Điện Sạc Mặt Trời EVRP-BDS (SPACE_SAVING_CPO_SOLAR_ASSIST)
  if (!/streamsummary|stream[- ]summary|sac[- ]lagrangian|multi[- ]tier/i.test(lower) && /space[- ]saving|lossy counting|frequent itemsets|mua kèm combo|cpo pricing|cpo[- ]pricing|evrp-bds|sạc mặt trời|solar micro-hub|xe điện mặt trời/i.test(lower)) {
    return {
      intent: 'SPACE_SAVING_CPO_SOLAR_ASSIST',
      replyText: `**[COMBO SPACE-SAVING, ĐỊNH GIÁ AN TOÀN CPO & XE ĐIỆN SẠC MẶT TRỜI EVRP-BDS]:**\n\n• **Gợi ý combo mua kèm hot (Space-Saving)**: AI tự động phân tích hàng triệu giỏ hàng thời gian thực để gợi ý ngay các cặp sản phẩm mua kèm thường xuyên nhất với giá ưu đãi kịch sàn!\n• **Định giá an toàn kép (CPO Pricing)**: Bảo đảm trợ giá tối đa cho người mua nhưng luôn khóa rào cản ngân sách và bảo vệ vốn sản xuất cho shop đối tác.\n• **Giao hàng bằng xe điện sạc năng lượng mặt trời (EVRP-BDS)**: Đơn hàng của bạn được giao bởi đội xe điện SPX nạp năng lượng sạch tại 4 Solar Micro-Hubs (Long Biên, Nam Từ Liêm, Hoàng Mai, Bắc Từ Liêm), giảm 100% khói bụi và bảo vệ môi trường!`,
      suggestions: ['Xem combo mua kèm Space-Saving', 'Săn deal trợ giá CPO', 'Khám phá lộ trình giao xe điện sạch'],
    };
  }

  // 59. Lấy Mẫu Dính Sticky Sampling, Định Giá CVaR QR-DDPG & Giao Hàng Drone Tự Hành VRPTW-D (STICKY_QRDPG_DRONE_ASSIST)
  if (!/tandem|truck[- ]drone|vrptw[- ]tandem/i.test(lower) && /sticky[- ]sampling|sticky sampling|lấy mẫu dính|qrdpg|qr-ddpg|cvar pricing|drone|vrptw-d|giao hàng drone|máy bay không người lái/i.test(lower)) {
    return {
      intent: 'STICKY_QRDPG_DRONE_ASSIST',
      replyText: `**[XU HƯỚNG VIRAL STICKY SAMPLING, ĐỊNH GIÁ AN TOÀN QR-DDPG & GIAO HỎA TỐC DRONE VRPTW-D]:**\n\n• **Bắt trọn sản phẩm viral tức thì (Sticky Sampling)**: AI liên tục lấy mẫu luồng thông minh với cam kết toán học $\\ge 99.5\\%$, đưa ngay các sản phẩm hot trend đang được săn đón lên trang chủ cho bạn!\n• **Giá sốc bảo vệ quyền lợi người mua (QR-DDPG CVaR Pricing)**: Tối ưu giá linh hoạt theo phân vị lợi nhuận và hạn chế tối đa rủi ro biến động, giúp bạn mua sắm với mức giá tốt nhất mà không lo bị tăng giá bất thường!\n• **Nhận hàng hỏa tốc bằng Drone tự hành (VRPTW-D Drone Dispatch)**: Đơn hàng nhẹ của bạn được Drone cất cánh từ nóc xe tải SPX Express giao tận tay trong tích tắc, né tránh kẹt xe và bảo vệ bầu không khí xanh sạch cho thành phố!`,
      suggestions: ['Khám phá sản phẩm hot Sticky Sampling', 'Săn deal trợ giá QR-DDPG', 'Trải nghiệm giao hàng bằng Drone SPX'],
    };
  }

  // 60. Đếm Khách Duy Nhất BJKST, Định Giá Thích Ứng AWAC & Gom Hàng Cross-Dock VRPTW-CC (BJKST_AWAC_CROSS_DOCK)
  if (!/hhh|hierarchical|dsac|bilateral|song phương|vrptw[- ]cross[- ]dock/i.test(lower) && /bjkst|distinct elements|awac|advantage-weighted|vrptw-cc|cross[- ]dock|trung chuyển gom hàng|cross-dock hub/i.test(lower)) {
    return {
      intent: 'BJKST_AWAC_CROSS_DOCK',
      replyText: `**[ĐẾM KHÁCH DUY NHẤT BJKST, ĐỊNH GIÁ ƯU ĐÃI AWAC & TRUNG CHUYỂN CROSS-DOCK VRPTW-CC]:**\n\n• **Nhận diện lượng người mua thực tế (BJKST Estimator)**: Hệ thống đếm chuẩn xác số lượng người mua duy nhất theo thời gian thực để tung ra các đợt trợ giá Flash Sale chớp nhoáng đúng lúc lượng truy cập cao nhất!\n• **Định giá ưu đãi thích ứng AWAC**: AI phân tích lịch sử mua sắm để đưa ra mức giá tốt nhất cho bạn, vừa tối đa hóa tiết kiệm vừa đảm bảo các shop đối tác không bị lỗ vốn.\n• **Giao hàng thông suốt qua Cross-Dock Hubs (VRPTW-CC)**: Đơn hàng từ các nhà xưởng ngoại thành được chuyển ngay qua 3 trung tâm trung chuyển không lưu kho SPX (Long Biên, Mỹ Đình, Hoàng Mai), rút ngắn $50\\%$ thời gian chờ và giao đến bạn nhanh chóng!`,
      suggestions: ['Khám phá Flash Sale trợ giá AWAC', 'Xem trung chuyển Cross-Dock SPX', 'Nhận ưu đãi người dùng duy nhất'],
    };
  }

  // 61. Phân Vị GK Quantile, Giá Tối Ưu IQL & Giao Vận Thích Ứng Thu Phí MDVRPTW (GK_IQL_ROAD_PRICING)
  if (/gk[- ]quantile|gk quantile|phân vị gk|iql|implicit q[- ]learning|road[- ]pricing|mdvrptw|thu phí nội đô|phí chống ùn tắc|vành đai 1|vành đai 2/i.test(lower)) {
    return {
      intent: 'GK_IQL_ROAD_PRICING',
      replyText: `**[PHÂN VỊ ĐƠN HÀNG GK QUANTILE, GIÁ BẢO ĐẢM IQL & GIAO HÀNG THÔNG MINH MDVRPTW]:**\n\n• **Thống kê phân vị đơn hàng chuẩn xác (GK Quantile)**: Công nghệ tóm tắt dòng dữ liệu tất định giúp Mini Shopee thiết lập các mức giá Flash Sale và hạn mức giảm giá Freeship sát nhất với túi tiền của bạn!\n• **Giá sốc công bằng được bảo chứng (IQL Dynamic Pricing)**: AI học trực tiếp từ giao dịch thực tế mà không đưa ra các mức giá thăm dò ảo, cam kết bạn luôn nhận được mức giảm sâu nhất mà chất lượng sản phẩm vẫn được đảm bảo.\n• **Giao hàng thông suốt không ngại giờ cao điểm (MDVRPTW Road Pricing)**: Đội xe bưu tá SPX Express từ 3 Hub ngoại vi (Tây Hồ, Cầu Giấy, Hoàng Mai) chủ động điều phối lộ trình né khung giờ thu phí chống ùn tắc nội đô, vừa giữ cước phí ship hạt dẻ vừa giao hàng đúng giờ cam kết!`,
      suggestions: ['Săn deal phân vị giá tốt GK', 'Xem giá bảo đảm IQL', 'Theo dõi bưu tá SPX tránh giờ cao điểm'],
    };
  }

  // 62. Bộ Đếm Morris LogLog, Giá An Toàn OPOE & Giao Thu Đồng Thời VRPSPDTW (MORRIS_OPOE_VRPSPD)
  if (/morris|loglog counter|đếm morris|opoe|epistemic uncertainty|bất định nhận thức|vrpspd|simultaneous pickup|giao thu đồng thời|đổi trả tận nhà/i.test(lower)) {
    return {
      intent: 'MORRIS_OPOE_VRPSPD',
      replyText: `**[BỘ ĐẾM SỰ KIỆN MORRIS, ĐỊNH GIÁ AN TOÀN OPOE & GIAO THU ĐỒNG THỜI VRPSPDTW]:**\n\n• **Theo dõi xu hướng hot tức thì (Morris LogLog Counter)**: Bộ đếm xác suất siêu nhẹ giúp sàn ghi nhận chính xác hàng triệu lượt quan tâm của người dùng, mang đến cho bạn danh sách gợi ý sản phẩm thịnh hành nhất thời gian thực!\n• **Mua sắm không lo biến động giá ảo (OPOE Offline Pricing)**: Thuật toán AI triệt tiêu rủi ro bất định, đảm bảo giá sản phẩm Flash Sale luôn minh bạch, hợp lý và không bao giờ bị đội giá vô cớ.\n• **Đổi trả bảo hành tận nhà 1 chạm (VRPSPDTW Simultaneous Delivery)**: Dịch vụ SPX Express nhận giao sản phẩm mới đồng thời thu hồi sản phẩm cần đổi trả/bảo hành trong cùng một chuyến bưu tá ghé nhà, giúp bạn tiết kiệm tối đa thời gian chờ đợi!`,
      suggestions: ['Khám phá sản phẩm hot Morris Counter', 'Xem giá bảo đảm OPOE', 'Trải nghiệm đổi trả tận nhà 1 chạm SPX'],
    };
  }

  // 63. Ước Lượng Luồng Fast-AGMS, Giá An Toàn BCQ & Xoay Vòng Đội Xe MTVRPTW (FAST_AGMS_BCQ_MTVRPTW)
  if (/fast[- ]agms|agms sketch|tích vô hướng luồng|bcq|batch[- ]constrained|mtvrptw|multi[- ]trip|nhiều chuyến trong ngày/i.test(lower)) {
    return {
      intent: 'FAST_AGMS_BCQ_MTVRPTW',
      replyText: `**[PHÂN TÍCH LUỒNG FAST-AGMS, GIÁ AN TOÀN BCQ & GIAO HỎA TỐC ĐA CHUYẾN MTVRPTW]:**\n\n• **Bắt trúng sở thích thời gian thực (Fast-AGMS Sketch)**: Tính toán tích vô hướng luồng sự kiện giúp gợi ý các sản phẩm phù hợp hoàn hảo với giỏ hàng của bạn chỉ trong vài mili-giây!\n• **Mua sắm với giá tốt nhất, không lo tăng giá (BCQ Dynamic Pricing)**: AI học tăng cường an toàn triệt tiêu rủi ro sai giá, đảm bảo các deal Flash Sale luôn có mức chiết khấu thật và sâu nhất mà vẫn bảo vệ uy tín sàn.\n• **Nhận hàng hỏa tốc trong ngày (MTVRPTW Multi-Trip Logistics)**: Đội xe bưu tá SPX Express quay vòng nhiều chuyến liên tục trong ca làm việc, giảm thời gian bưu kiện nằm chờ ở kho và giao ngay đến bạn trong tích tắc!`,
      suggestions: ['Khám phá gợi ý thông minh Fast-AGMS', 'Săn deal bảo đảm giá BCQ', 'Theo dõi bưu tá giao nhiều chuyến SPX'],
    };
  }

  // 64. Bắt Trend Lossy Counting, Giá An Toàn SPOT & Giao Hàng Cửa Sổ Mềm VRPTW-Soft (LOSSY_SPOT_VRPTW_SOFT)
  if (/lossy[- ]counting|đếm tổn hao|spot|spot pricing|supported policy|soft time window|cửa sổ mềm|vrptw[- ]soft|phạt trễ/i.test(lower)) {
    return {
      intent: 'LOSSY_SPOT_VRPTW_SOFT',
      replyText: `**[BẮT TREND VIRAL LOSSY COUNTING, GIÁ AN TOÀN SPOT & GIAO HÀNG LINH HOẠT VRPTW-SOFT]:**\n\n• **Bắt sóng sản phẩm bão đơn (Lossy Counting Heavy Hitters)**: Thuật toán luồng tất định với cam kết không bỏ sót, tự động đưa các deal Flash Sale đang được cả cộng đồng săn đón lên kệ trước mắt bạn!\n• **Giá sốc công bằng, minh bạch (SPOT Dynamic Pricing)**: AI bảo chứng mật độ dữ liệu thực tế, cam kết mọi voucher và mức giá ưu đãi đều có căn cứ vững chắc, bảo vệ quyền lợi tối đa cho người mua sắm.\n• **Giao hàng linh hoạt đúng cam kết (VRPTW-Soft Logistics)**: SPX Express ứng dụng mô hình cửa sổ thời gian mềm linh hoạt, bảo đảm 100% đơn hàng hỏa tốc đến tận tay bạn trong ngày mà không bị hủy đơn bất ngờ!`,
      suggestions: ['Khám phá deal bão đơn Lossy Counting', 'Săn ưu đãi bảo chứng giá SPOT', 'Theo dõi giao hàng linh hoạt SPX Soft-Window'],
    };
  }

  // 65. Bắt Trend Misra-Gries, Giá Mượt Mà Laplacian & Giao Đúng Hẹn VRPTW-Stochastic (MISRA_LAP_VRPTW_STOCHASTIC)
  if (!/kps|karp|cqrd|cvar|battery degradation|evrptw[- ]battery/i.test(lower) && /misra[- ]gries|misra|gries|laplacian|lap dynamic pricing|chính quy hóa laplacian|độ trơn đa tạp|vrptw[- ]stochastic|stochastic service time|thời gian phục vụ ngẫu nhiên|reliability buffer|đệm độ tin cậy/i.test(lower)) {
    return {
      intent: 'MISRA_LAP_VRPTW_STOCHASTIC',
      replyText: `**[BẮT TREND TẤT ĐỊNH MISRA-GRIES, GIÁ MƯỢT LAPLACIAN & GIAO HÀNG CHUẨN XÁC VRPTW-STOCHASTIC]:**\n\n• **Bắt trọn sản phẩm Hot Trend tức thì (Misra-Gries Heavy Hitters)**: Thuật toán tất định với $k-1$ bộ đếm cam kết không bỏ sót bất kỳ sản phẩm nào có lượt quan tâm vượt trội, đưa các deal Flash Sale hot nhất lên đầu trang cho bạn!\n• **Mua sắm không lo giá giật cục (Graph Laplacian Dynamic Pricing)**: AI học tăng cường chính quy hóa độ trơn đa tạp, đảm bảo giá bán ưu đãi biến chuyển mượt mà, hợp lý và minh bạch tuyệt đối.\n• **Đảm bảo giao đúng hẹn từng phút (VRPTW-Stochastic Reliability Buffer)**: Bưu tá SPX Express được trang bị đệm thời gian tin cậy chuẩn hóa $95\\%$, dự trù sẵn thời gian đồng kiểm COD để luôn giao hàng đúng khung giờ hẹn cho bạn!`,
      suggestions: ['Khám phá Hot Trend Misra-Gries', 'Xem giá bảo đảm Laplacian', 'Theo dõi đơn hàng SPX đệm tin cậy 95%'],
    };
  }

  // 66. Bắt Trend KPS, Giá Đảm Bảo Rủi Ro CQRD & Giao Hàng Xe Điện Bền Pin EVRPTW-Battery (KPS_CQRD_EVRPTW_BATTERY)
  if (!/hhh|hierarchical|dsac|cross[- ]dock|bilateral/i.test(lower) && /kps|karp[- ]papadimitriou|cqrd|cvar pricing|quantile risk|định giá cqrd|pin xe điện|hao mòn pin|battery degradation|evrptw[- ]battery/i.test(lower)) {
    return {
      intent: 'KPS_CQRD_EVRPTW_BATTERY',
      replyText: `**[BẮT TREND BÃO ĐƠN KPS, GIÁ ĐẢM BẢO RỦI RO CQRD & GIAO HÀNG XE ĐIỆN BỀN PIN EVRPTW-BATTERY]:**\n\n• **Bắt trọn sản phẩm bão đơn (Karp-Papadimitriou-Shenker Frequent Items)**: Thuật toán luồng một lượt với kích thước bộ nhớ cố định $O(1/\\theta)$ bảo đảm sai số tối đa $\\le \\theta N$ và cam kết không bỏ sót các deal Flash Sale bùng nổ traffic!\n• **Giá ưu đãi thích ứng rủi ro (CQRD Dynamic Pricing)**: AI tối ưu hóa phân phối lượng tử kết hợp kiểm soát rủi ro đuôi $\\text{CVaR}_\\alpha$, bảo đảm giá Flash Sale luôn bình ổn, công bằng và bảo vệ người tiêu dùng trước biến động thị trường.\n• **Đội xe điện giao hàng xanh bền vững (EVRPTW Battery Degradation Logistics)**: SPX Express ứng dụng mô hình định tuyến xe điện tích hợp kiểm soát suy giảm pin và nhiệt độ cell, mang đến dịch vụ giao hàng nhanh, sạch và bảo vệ môi trường!`,
      suggestions: ['Khám phá deal bão đơn KPS', 'Xem giá bảo đảm rủi ro CQRD', 'Theo dõi bưu tá xe điện SPX EVRPTW-Battery'],
    };
  }

  // 67. Bắt Trend Phân Cấp HHH, Giá Bất Định DSAC & Giao Hàng Gom Đơn Cross-Dock (HHH_DSAC_CROSSDOCK_BILATERAL)
  if (!/count[- ]min hierarchical|count[- ]min hhh/i.test(lower) && /hhh|hierarchical heavy hitters|heavy hitters phân cấp|dsac|dsac pricing|bất định dsac|vrptw[- ]cross[- ]dock|cross[- ]dock song phương|bilateral cross[- ]dock/i.test(lower)) {
    return {
      intent: 'HHH_DSAC_CROSSDOCK_BILATERAL',
      replyText: `**[BẮT TREND PHÂN CẤP HHH, GIÁ AN TOÀN DSAC & GOM ĐƠN SPX CROSS-DOCKING]:**\n\n• **Bắt trúng ngành hàng Hot Trend (Hierarchical Heavy Hitters)**: Thuật toán luồng cây phân cấp tự động phát hiện các nhóm ngành hàng đang bão đơn ngay cả khi từng mẫu mã riêng lẻ chưa bùng nổ, đưa các bộ sưu tập hot nhất lên đầu trang cho bạn!\n• **Giá Flash Sale cân bằng rủi ro (DSAC Dynamic Pricing)**: AI học tăng cường mô hình hóa phân phối liên tục, loại bỏ rủi ro giá sốc thất thường và cam kết mức giá ưu đãi cạnh tranh nhất sàn.\n• **Gom đơn đa người bán siêu tiết kiệm (Bilateral Cross-Docking)**: Mua sắm cùng lúc từ nhiều shop khác nhau vẫn được SPX Express gom về Hub trung tâm xử lý trong 25 phút, đóng chung 1 kiện hàng phát hỏa tốc giúp bạn tiết kiệm tối đa phí ship!`,
      suggestions: ['Khám phá ngành hàng hot HHH', 'Xem deal bảo chứng giá DSAC', 'Theo dõi gom đơn SPX Cross-Dock'],
    };
  }

  // 68. Phác Thảo Ma Trận Frequent Directions, Giá Ràng Buộc PPO-Lagrangian & Giao Xe Điện Hàng Đợi EVRPTW-Queue (FREQUENT_DIRECTIONS_PPO_EVRPTW_QUEUE)
  if (!/ppo[- ]entropy/i.test(lower) && /frequent[- ]directions|matrix sketch|phác thảo ma trận|ppo[- ]lagrangian|lagrangian pricing|evrptw[- ]queue|hàng đợi trạm sạc/i.test(lower)) {
    return {
      intent: 'FREQUENT_DIRECTIONS_PPO_EVRPTW_QUEUE',
      replyText: `**[PHÁC THẢO MA TRẬN DÒNG FREQUENT DIRECTIONS, GIÁ AN TOÀN PPO-LAGRANGIAN & XE ĐIỆN NÉ KẸT TRẠM SẠC EVRPTW-QUEUE]:**\n\n• **Hiểu đúng gu mua sắm của bạn (Frequent Directions Matrix Sketching)**: Thuật toán phác thảo ma trận xác định nén dữ liệu tìm kiếm và tương tác sản phẩm đa chiều với độ chính xác toán học tối ưu, gợi ý sản phẩm chuẩn gu mà không làm chậm hệ thống!\n• **Giá Flash Sale bảo vệ người tiêu dùng (PPO-Lagrangian Safe Pricing)**: AI định giá học tăng cường đa ràng buộc an toàn, duy trì mức giá ưu đãi cạnh tranh, cam kết bình ổn giá và không bao giờ xảy ra tình trạng tăng giá vô lý.\n• **Đội xe điện giao hàng xanh né trạm sạc đông đúc (EVRPTW Stochastic Queuing)**: Bưu tá SPX Express giao hàng bằng xe điện thông minh, tự động dự báo thời gian chờ trạm sạc theo mô hình Erlang $W_q$ để chọn trạm thông thoáng, bảo đảm đơn hàng đến tay bạn đúng khung giờ đã hẹn!`,
      suggestions: ['Khám phá gợi ý chuẩn gu Frequent Directions', 'Xem giá an toàn PPO-Lagrangian', 'Theo dõi bưu tá xe điện SPX'],
    };
  }

  // 69. Phân Vị Luồng Q-Digest, Giá Vùng Tin Cậy TRPO & Drone Đồng Hành VRPTW-Tandem (Q_DIGEST_TRPO_TANDEM_DRONE)
  if (/q[- ]digest|quantile digest|qdigest|trpo|trust region|vùng tin cậy|tandem drone|truck[- ]drone|vrptw[- ]tandem/i.test(lower)) {
    return {
      intent: 'Q_DIGEST_TRPO_TANDEM_DRONE',
      replyText: `**[PHÂN VỊ LUỒNG Q-DIGEST, GIÁ AN TOÀN TRPO & GIAO HỎA TỐC DRONE ĐỒNG HÀNH VRPTW-TANDEM]:**\n\n• **Bắt trọn phân vị giá rẻ & phản hồi siêu tốc (Q-Digest Streaming Quantiles)**: Cấu trúc cây nén đáy-lên theo dõi chính xác phân vị độ trễ và giá bán thị trường với sai số dưới $\\pm 5\\%$, giúp bạn săn đúng khung giá hời nhất trong từng đợt mở bán!\n• **Mua sắm an tâm với giá bình ổn TRPO (Trust Region Policy Optimization)**: AI định giá học tăng cường vùng tin cậy với bước nhảy ràng buộc phân kỳ KL, ngăn chặn tuyệt đối tình trạng giá nhảy thất thường, đảm bảo mức giá luôn công bằng và tiết kiệm nhất cho bạn!\n• **Giao hỏa tốc Drone kết hợp xe tải mẹ (VRPTW Tandem Drone Delivery)**: Kiện hàng khẩn cấp của bạn được Drone cất cánh trực tiếp từ nóc xe tải SPX đang di chuyển, bay thẳng qua các điểm ùn tắc giao thông để giao ngay tận cửa nhà bạn, tiết kiệm đến $45\\%$ thời gian chờ đợi!`,
      suggestions: ['Khám phá phân vị giá rẻ Q-Digest', 'Săn deal bình ổn giá TRPO', 'Trải nghiệm nhận hàng Drone đồng hành SPX'],
    };
  }

  // 70. Đếm Cửa Sổ Trượt DGIM, Định Giá Rủi Ro Đuôi WCSAC & Xe Điện Sạc Phi Tuyến EVRPTW-NL (DGIM_WCSAC_NONLINEAR_CHARGING)
  if (/dgim|cửa sổ trượt|wcsac|rủi ro đuôi|cvar pricing|evrptw[- ]nl|sạc phi tuyến|cc[- ]cv/i.test(lower)) {
    return {
      intent: 'DGIM_WCSAC_NONLINEAR_CHARGING',
      replyText: `**[ĐẾM CỬA SỔ TRƯỢT DGIM, ĐỊNH GIÁ RỦI RO ĐUÔI WCSAC & XE ĐIỆN SẠC PHI TUYẾN EVRPTW-NL]:**\n\n• **Bắt trọn xu hướng tương tác tức thì (DGIM Sliding Window Counter)**: Thuật toán nén dòng bit nhị phân Datar-Gionis-Indyk-Motwani lưu trữ cửa sổ trượt $W$ trong bộ nhớ $O(\\frac{1}{\\epsilon} \\log^2 W)$, ước lượng tần suất click và săn deal chuẩn xác dưới sai số $\\pm 10\\%$!\n• **Mua sắm không lo sốc giá (WCSAC Worst-Case Safe Pricing)**: Mô hình học tăng cường Soft Actor-Critic kiểm soát đuôi rủi ro $\\text{CVaR}_\\alpha$, tự động kích hoạt hệ số phạt Lagrange khi biên độ rủi ro tăng cao, cam kết mức giá Flash Sale minh bạch và an toàn tuyệt đối!\n• **Giao hàng xanh sạc tối ưu (EVRPTW Nonlinear CC-CV Charging)**: Đội xe điện SPX áp dụng biểu đồ sạc phi tuyến dòng không đổi - điện áp không đổi (CC-CV), tính toán sạc một phần thông minh để tránh đoạn cong sạc chậm, giúp kiện hàng giao hỏa tốc không trễ hẹn!`,
      suggestions: ['Khám phá đếm tương tác DGIM', 'Xem giá bảo vệ WCSAC', 'Lộ trình xe điện sạc nhanh SPX'],
    };
  }

  // 71. Đếm Tổn Hao Mô-men Lossy Counting, Giá An Toàn RCPO & Xe Điện Phụ Thuộc Giờ Cao Điểm TDEVRP (LOSSY_MOMENTS_RCPO_TDEVRP)
  if (/lossy counting moments|mô-men tần suất|rcpo|reward constrained|vrptw[- ]td[- ]green|time[- ]dependent green|basso/i.test(lower)) {
    return {
      intent: 'LOSSY_MOMENTS_RCPO_TDEVRP',
      replyText: `**[ĐẾM TỔN HAO MÔ-MEN LOSSY COUNTING, GIÁ AN TOÀN RCPO & XE ĐIỆN NÉ GIỜ CAO ĐIỂM TDEVRP]:**\n\n• **Bắt trọn sản phẩm hot xu hướng (Lossy Counting Frequency Moments)**: Thuật toán luồng nén với độ rộng bucket chuẩn xác, phát hiện lập tức các món hàng hot đang bùng nổ tìm kiếm và phân tích năng lượng phân phối $F_2$, giúp bạn không bao giờ bỏ lỡ deal hời!\n• **Mua sắm minh bạch với giá bình ổn RCPO (Reward Constrained Policy Optimization)**: Mô hình học tăng cường đa thang thời gian cân bằng doanh thu và giới hạn chi phí, tự động kích hoạt hệ số giảm chấn an toàn để bảo đảm mức giá Flash Sale luôn công bằng và tiết kiệm nhất cho bạn!\n• **Giao hàng thông minh né giờ cao điểm SPX (TDEVRP Green Logistics)**: Lộ trình xe điện thích ứng theo 5 khung giờ giao thông thực tế, tối ưu hóa mức tiêu hao pin khi kẹt xe và bảo đảm đơn hàng đến đúng khung giờ hẹn trước!`,
      suggestions: ['Xem sản phẩm hot Lossy Counting', 'Săn deal giá an toàn RCPO', 'Theo dõi bưu tá giờ cao điểm SPX'],
    };
  }

  // 72. Tóm Tắt Luồng Space-Saving, Định Giá An Toàn SAC-Lagrangian & Xe Điện Trạm Sạc Đa Tầng (SPACESAVING_SACLAGRANGIAN_MULTITIER_CHARGING)
  if (/space[- ]saving stream|streamsummary|stream[- ]summary|space[- ]saving summary|sac[- ]lagrangian|adaptive entropy|multi[- ]tier charging|trạm sạc đa tầng|evrptw[- ]multi[- ]tier/i.test(lower)) {
    return {
      intent: 'SPACESAVING_SACLAGRANGIAN_MULTITIER_CHARGING',
      replyText: `**[TÓM TẮT LUỒNG SPACE-SAVING, ĐỊNH GIÁ AN TOÀN SAC-LAGRANGIAN & XE ĐIỆN TRẠM SẠC ĐA TẦNG]:**\n\n• **Bắt trọn sản phẩm bão đơn chuẩn xác (Space-Saving StreamSummary)**: Thuật toán luồng với $m = \\lceil 1 / \\epsilon \\rceil$ bộ đếm cố định, lưu vết chính xác các mặt hàng có tần suất cao với sai số có cận trên, bảo đảm $0$ false negatives giúp bạn luôn bắt kịp mọi xu hướng mua sắm hot nhất!\n• **Mua sắm không lo trồi sụt giá (SAC-Lagrangian Safe Dynamic Pricing)**: Mô hình học tăng cường Soft Actor-Critic tự động cân bằng giữa tối đa hóa khám phá entropy và kiểm soát ngân sách an toàn Lagrangian, có hệ số giảm chấn co giãn và khóa sàn giá vốn giúp bạn luôn mua được sản phẩm với giá ưu đãi và minh bạch!\n• **Giao hàng thông minh trạm sạc đa tầng SPX (EVRPTW Multi-Tier Charging)**: Đội xe máy/ô tô điện SPX Express tự động lựa chọn trạm sạc tối ưu giữa 3 cấp độ (Tier 1: 120kW Siêu Nhanh, Tier 2: 60kW Nhanh, Tier 3: 22kW Tiêu Chuẩn), cân bằng giữa chi phí tiền điện và cam kết thời gian giao hàng đúng cửa sổ hẹn của bạn!`,
      suggestions: ['Khám phá sản phẩm Space-Saving', 'Xem chính sách giá an toàn SAC', 'Lộ trình giao hàng trạm sạc đa tầng SPX'],
    };
  }

  // 73. Nhận Diện Danh Mục Hot Count-Min HHH, Định Giá PPO Entropy & Xe Điện Đổi Pin Siêu Tốc (COUNTMIN_HHH_PPO_ENTROPY_SWAP_DECAY)
  if (/count[- ]min hierarchical|count[- ]min hhh|cây danh mục hhh|ppo[- ]entropy|entropy safe pricing|battery swapping decay|đổi pin suy giảm|evrptw[- ]bsd/i.test(lower)) {
    return {
      intent: 'COUNTMIN_HHH_PPO_ENTROPY_SWAP_DECAY',
      replyText: `**[PHẦN TỬ PHÂN CẤP COUNT-MIN HHH, ĐỊNH GIÁ PPO-ENTROPY & ĐỔI PIN SUY GIẢM EVRPTW-BSD]:**\n\n• **Đón đầu xu hướng mua sắm theo cây danh mục (Count-Min Hierarchical Heavy Hitters)**: Thuật toán lọc phân tầng với cấu trúc mảng Count-Min Sketch đa tầng bóc tách chính xác các ngành hàng thịnh hành theo tần suất có điều kiện $f_{\\text{cond}}(u) \\ge \\phi N$, bảo đảm 0 false negatives giúp bạn luôn đón đầu mọi hot trend mua sắm!\n• **Giá cả ưu đãi minh bạch & an toàn (PPO-Entropy Safe Dynamic Pricing)**: Trí tuệ nhân tạo PPO với số hạng thưởng Entropy cân bằng khám phá và rào chắn an toàn kép Lagrange bảo vệ sàn giá vốn $\\ge 1.05 \\times \\text{COGS}$, mang lại mức giá Flash Sale tốt nhất mà chất lượng sản phẩm luôn được đảm bảo tuyệt đối!\n• **Giao hàng siêu tốc không trễ hẹn (EVRPTW Battery Swapping & Capacity Decay)**: Đội xe máy điện giao hàng SPX Express tính toán chính xác mức độ suy giảm dung lượng $C_{\\text{eff}}(n)$ và tiếp năng lượng tại các trạm đổi pin cơ học tức thì chỉ **3 phút**, cam kết kiện hàng của bạn luôn được giao tận nơi đúng khung giờ hẹn trước!`,
      suggestions: ['Khám phá danh mục hot Count-Min HHH', 'Xem chính sách giá an toàn PPO-Entropy', 'Theo dõi xe điện đổi pin siêu tốc SPX'],
    };
  }

  // 74. Truy Vấn Khoảng Dyadic Range Sketch, Định Giá Tất Định DDPG-Lagrangian & Sạc Không Dây Động DWPT (DYADIC_RANGE_DDPG_LAGRANGIAN_DWPT_CHARGING)
  if (/dyadic[- ]range|phác thảo khoảng nhị phân|ddpg[- ]lagrangian|ddpg safe pricing|evrptw[- ]dwpt|sạc không dây động|dynamic wireless/i.test(lower)) {
    return {
      intent: 'DYADIC_RANGE_DDPG_LAGRANGIAN_DWPT_CHARGING',
      replyText: `**[TRUY VẤN KHOẢNG DYADIC RANGE SKETCH, ĐỊNH GIÁ TẤT ĐỊNH DDPG-LAGRANGIAN & SẠC KHÔNG DÂY ĐỘNG DWPT]:**\n\n• **Lọc phân khúc giá siêu tốc (Dyadic Range Count-Min Sketch)**: Cấu trúc phân rã nhị phân chính tắc cho phép tổng hợp số lượt mua và doanh thu trong mọi khoảng giá $[l, r]$ chỉ mất $O(\\log U)$, giúp bạn khám phá các tầng giá Flash Sale hấp dẫn nhất một cách tức thì!\n• **Mua sắm với giá bình ổn tối ưu (DDPG-Lagrangian Continuous Safe Pricing)**: Mô hình học tăng cường mạng Actor tất định liên tục tinh chỉnh biên độ giá Flash Sale, kết hợp mạng Critic đối ngẫu Lagrange kiểm soát chặt chẽ rủi ro và khóa sàn giá vốn $\\ge 1.05 \\times \\text{COGS}$, đảm bảo giá luôn rẻ nhất mà uy tín chất lượng không đổi!\n• **Giao hỏa tốc xuyên suốt không dừng sạc (EVRPTW Dynamic Wireless Power Transfer)**: Đội xe giao vận SPX Express chạy trên các hành lang xanh tích hợp cuộn cảm sạc không dây động $20\\text{ kW}$, vừa di chuyển vừa nạp điện mà không cần tốn thời gian dừng tại trạm sạc tĩnh, giúp kiện hàng đến tay bạn nhanh nhất có thể!`,
      suggestions: ['Khám phá phân khúc giá Dyadic', 'Xem chính sách giá DDPG-Lagrangian', 'Theo dõi xe điện sạc động DWPT SPX'],
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
