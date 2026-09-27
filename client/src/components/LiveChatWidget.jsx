import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { FALLBACK_PRODUCTS } from '../services/productService';

const CHAT_STORAGE_KEY = 'mini_shopee_live_chat_history';

/**
 * Biểu tượng Trợ lý AI Hologram / Cosmic Sparkle Orb hiện đại bậc nhất
 */
export function BotIcon({ size = 32, glow = false }) {
  const filterId = `aiGlow_${size}_${glow ? 'glow' : 'norm'}`;
  const gradId = `aiGrad_${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        display: 'block',
        filter: glow ? 'drop-shadow(0 4px 12px rgba(56, 189, 248, 0.65)) drop-shadow(0 0 18px rgba(99, 102, 241, 0.5))' : 'none',
        flexShrink: 0,
      }}
    >
      <defs>
        <linearGradient id={gradId} x1="2" y1="2" x2="38" y2="38" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="45%" stopColor="#06b6d4" />
          <stop offset="85%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#f59e0b" />
        </linearGradient>
        <radialGradient id={`${gradId}_radial`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
          <stop offset="60%" stopColor="#6366f1" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Aura vòng tròn phát sáng */}
      <circle cx="20" cy="20" r="18.5" fill={`url(#${gradId}_radial)`} />

      {/* Quả cầu năng lượng AI chính */}
      <circle cx="20" cy="20" r="15.5" fill={`url(#${gradId})`} />
      <circle cx="20" cy="20" r="15.5" stroke="rgba(255, 255, 255, 0.45)" strokeWidth="1.2" />

      {/* Quỹ đạo chuyển động AI (Orbit Ring) */}
      <ellipse
        cx="20"
        cy="20"
        rx="17"
        ry="6.5"
        stroke="rgba(255, 255, 255, 0.75)"
        strokeWidth="1.3"
        strokeDasharray="3.5 2"
        transform="rotate(-28 20 20)"
      />

      {/* Ngôi sao lấp lánh AI Sparkle 4 cánh trung tâm */}
      <path
        d="M20 8.5C20 14.5 14.5 20 8.5 20C14.5 20 20 25.5 20 31.5C20 25.5 25.5 20 31.5 20C25.5 20 20 14.5 20 8.5Z"
        fill="#ffffff"
      />

      {/* Hạt nhân năng lượng trung tâm */}
      <circle cx="20" cy="20" r="2.6" fill="#38bdf8" />
      <circle cx="20" cy="20" r="1.2" fill="#ffffff" />

      {/* Ngôi sao phụ phát sáng góc trên bên phải */}
      <path
        d="M30 7.5C30 9.2 28.5 10.5 26.8 10.5C28.5 10.5 30 11.8 30 13.5C30 11.8 31.5 10.5 33.2 10.5C31.5 10.5 30 9.2 30 7.5Z"
        fill="#fef08a"
      />

      {/* Ngôi sao phụ góc dưới bên trái */}
      <circle cx="10" cy="29" r="1.4" fill="#a5f3fc" />
    </svg>
  );
}

const DEFAULT_WELCOME_MESSAGES = [
  {
    id: 'msg_welcome_1',
    sender: 'agent',
    agentName: 'Trợ Lý AI Fullstack E-Commerce',
    avatar: null,
    text: 'Xin chào! Tôi là Trợ Lý AI của sàn Fullstack E-Commerce ✨. Tôi có thể giúp bạn tìm kiếm hàng trăm sản phẩm, tra cứu đơn hàng gần nhất hoặc tặng bạn các mã giảm giá hấp dẫn!',
    time: 'Vừa xong',
    suggestions: ['Gợi ý đồ công nghệ hot', 'Tra cứu đơn hàng của tôi', 'Lấy voucher 15%', 'Chính sách đổi trả 30 ngày'],
  }
];

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [targetShop, setTargetShop] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_WELCOME_MESSAGES;
    } catch {
      return DEFAULT_WELCOME_MESSAGES;
    }
  });

  const messagesEndRef = useRef(null);
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Tự động cuộn xuống cuối khi có tin nhắn mới
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Lưu lịch sử vào localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Nhận tín hiệu mở chat từ trang chi tiết shop
  useEffect(() => {
    const handleOpenChat = (event) => {
      const detail = event.detail;
      if (detail && detail.shopName) {
        setTargetShop({
          name: detail.shopName,
          id: detail.shopId,
          avatar: detail.shopAvatar,
        });

        setMessages((prev) => [
          ...prev,
          {
            id: `msg_shop_${Date.now()}`,
            sender: 'agent',
            agentName: detail.shopName,
            avatar: detail.shopAvatar || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100',
            text: `Dạ chào bạn! Đây là kênh chat chính thức của gian hàng ${detail.shopName}. Gian hàng sẵn sàng tư vấn mẫu mã, tình trạng còn hàng và gửi ưu đãi độc quyền cho bạn ạ!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            suggestions: ['Xem sản phẩm của shop', 'Shop có mã giảm giá không?', 'Thời gian giao hàng'],
          }
        ]);
      }
      setIsOpen(true);
    };

    window.addEventListener('open_live_chat', handleOpenChat);
    return () => window.removeEventListener('open_live_chat', handleOpenChat);
  }, []);

  // Helper sao chép voucher
  const handleCopyVoucher = (code) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2500);
    });
  };

  // Thuật toán AI tìm kiếm sản phẩm thông minh
  const searchMatchingProducts = (query) => {
    if (!query) return [];
    const q = query.toLowerCase().trim();
    const keywords = q.split(/\s+/).filter(Boolean);

    const matches = FALLBACK_PRODUCTS.filter((prod) => {
      const name = (prod.name || '').toLowerCase();
      const desc = (prod.description || '').toLowerCase();
      const cat = (prod.category || '').toLowerCase();
      const brand = (prod.brand || '').toLowerCase();
      const badge = (prod.badge || '').toLowerCase();

      return keywords.some(k => 
        name.includes(k) || desc.includes(k) || cat.includes(k) || brand.includes(k) || badge.includes(k)
      );
    });

    return matches.slice(0, 3);
  };

  // Tra cứu đơn hàng từ localStorage
  const getRecentOrders = () => {
    try {
      const raw = localStorage.getItem('mini_shopee_orders');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  };

  // Xử lý gửi tin nhắn
  const handleSendMessage = (textToSend) => {
    const content = (textToSend || inputMessage).trim();
    if (!content) return;

    const userMsg = {
      id: `msg_user_${Date.now()}`,
      sender: 'user',
      text: content,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsTyping(true);

    // Xử lý phản hồi AI thông minh
    setTimeout(() => {
      const lower = content.toLowerCase();
      let replyText = '';
      let products = null;
      let vouchers = null;
      let orders = null;
      let suggestions = [];

      // 1. Kiểm tra yêu cầu tra cứu đơn hàng
      if (lower.includes('đơn') || lower.includes('order') || lower.includes('tra cứu') || lower.includes('vận chuyển') || lower.includes('đến đâu')) {
        const recentOrders = getRecentOrders();
        if (recentOrders.length > 0) {
          orders = recentOrders.slice(0, 2);
          replyText = `Tôi đã tìm thấy ${recentOrders.length} đơn hàng trong hệ thống của bạn! Dưới đây là thông tin đơn hàng mới nhất:`;
          suggestions = ['Xem chi tiết tất cả đơn', 'Theo dõi vận chuyển', 'Lấy voucher cho đơn mới'];
        } else {
          replyText = 'Hiện bạn chưa có đơn hàng nào đang chờ xử lý trên hệ thống. Hãy chọn món hàng yêu thích và đặt ngay nhé!';
          suggestions = ['Gợi ý hàng bán chạy', 'Săn mã giảm giá', 'Giao siêu tốc 2H'];
        }
      } 
      // 2. Kiểm tra yêu cầu tìm kiếm sản phẩm hoặc danh mục cụ thể
      else if (
        lower.includes('áo') || lower.includes('quần') || lower.includes('chuột') || 
        lower.includes('bàn phím') || lower.includes('tai nghe') || lower.includes('nồi') || 
        lower.includes('cơm') || lower.includes('chiên') || lower.includes('son') || 
        lower.includes('mỹ phẩm') || lower.includes('giày') || lower.includes('túi') || 
        lower.includes('tìm') || lower.includes('sản phẩm') || lower.includes('gợi ý') || 
        lower.includes('hot') || lower.includes('mua')
      ) {
        // Tách từ khóa tìm kiếm
        let cleanKeyword = lower.replace(/tìm|sản phẩm|gợi ý|cho tôi|có|nào|không|bán/g, '').trim();
        if (!cleanKeyword) cleanKeyword = 'bán chạy';

        const found = searchMatchingProducts(cleanKeyword);
        if (found.length > 0) {
          products = found;
          replyText = `Dạ đây là các sản phẩm ${cleanKeyword ? `phù hợp với "${cleanKeyword}"` : 'nổi bật nhất'} đang có giá cực ưu đãi trên sàn:`;
          suggestions = ['Xem thêm hàng khác', 'Lấy mã giảm giá', 'Đổi trả miễn phí ra sao?'];
        } else {
          // Fallback sang top sản phẩm best seller
          products = FALLBACK_PRODUCTS.slice(0, 3);
          replyText = `Tôi xin gợi ý cho bạn top sản phẩm Best Seller được yêu thích nhất hiện nay:`;
          suggestions = ['Đồ công nghệ', 'Thời trang hot', 'Thiết bị gia dụng'];
        }
      }
      // 3. Kiểm tra yêu cầu về voucher, khuyến mãi
      else if (lower.includes('voucher') || lower.includes('giảm giá') || lower.includes('mã') || lower.includes('khuyến mãi') || lower.includes('deal')) {
        vouchers = [
          { code: 'MINI10', discount: 'Giảm 10%', max: 'Tối đa 100.000₫', desc: 'Áp dụng cho mọi đơn hàng từ 100k' },
          { code: 'FREESHIP', discount: 'Freeship 35K', max: 'Toàn quốc', desc: 'Miễn phí vận chuyển hỏa tốc & tiêu chuẩn' },
          { code: 'SUPERDEAL', discount: 'Giảm 15%', max: 'Tối đa 150.000₫', desc: 'Siêu sale ngày hội mua sắm' },
        ];
        replyText = '🎁 Dưới đây là các mã voucher độc quyền đang còn hiệu lực! Bạn hãy bấm "Sao Chép Mã" để dùng ngay trong giỏ hàng nhé:';
        suggestions = ['Hướng dẫn dùng voucher', 'Tìm sản phẩm hot', 'Kiểm tra giỏ hàng'];
      }
      // 4. Chính sách đổi trả & bảo hành
      else if (lower.includes('đổi') || lower.includes('trả') || lower.includes('bảo hành') || lower.includes('hoàn tiền')) {
        replyText = '🔄 Chính sách Đổi Trả & Bảo Hành Fullstack E-Commerce:\n• Miễn phí đổi trả 30 ngày tận nhà nếu có lỗi từ nhà sản xuất hoặc sai kích cỡ.\n• Cam kết hàng chính hãng 100%, đền bù gấp 2 lần nếu phát hiện hàng giả.\n• Bảo hành chính hãng từ 12 - 24 tháng đối với thiết bị điện tử gia dụng.';
        suggestions = ['Tra cứu đơn hàng', 'Tư vấn viên hỗ trợ', 'Tiếp tục mua sắm'];
      }
      // 5. Giao hàng & vận chuyển
      else if (lower.includes('giao') || lower.includes('ship') || lower.includes('2h') || lower.includes('hỏa tốc')) {
        replyText = '⚡ Dịch vụ vận chuyển siêu tốc:\n• Giao 2H Hỏa Tốc: Áp dụng nội thành TP.HCM & Hà Nội qua đối tác SPX Now.\n• Giao tiêu chuẩn: 24h - 48h trên toàn quốc với mức phí đồng giá cực rẻ.\n• Miễn phí giao hàng cho đơn từ 200k khi áp mã FREESHIP!';
        suggestions = ['Lấy mã FREESHIP', 'Tra cứu đơn hàng', 'Xem hàng giao 2H'];
      }
      // 6. Gặp nhân viên tư vấn
      else if (lower.includes('nhân viên') || lower.includes('tư vấn') || lower.includes('người') || lower.includes('cskh')) {
        replyText = '👨‍💼 Chuyên viên CSKH Hoàng Long đã tiếp nhận phiên hỗ trợ của bạn. Đang sẵn sàng phục vụ và giải đáp mọi yêu cầu chi tiết của bạn!';
        suggestions = ['Tư vấn sản phẩm', 'Hỗ trợ thanh toán', 'Bảo hành'];
      }
      // 7. Nhắn cho gian hàng cụ thể
      else if (targetShop) {
        replyText = `Dạ ${targetShop.name} đã nhận được lời nhắn của bạn. Gian hàng hiện đang online và sẽ phản hồi tư vấn chi tiết cho bạn ngay ạ!`;
        suggestions = ['Sản phẩm có sẵn không?', 'Shop có voucher riêng không?', 'Giao trong bao lâu?'];
      }
      // 8. Phản hồi mặc định thông minh
      else {
        replyText = 'Tôi có thể hỗ trợ bạn tìm kiếm bất kỳ món đồ nào từ Thời trang, Công nghệ, Gia dụng đến Mỹ phẩm, hoặc kiểm tra đơn hàng và mã giảm giá. Bạn cần tôi trợ giúp gì nào?';
        suggestions = ['Gợi ý hàng bán chạy', 'Lấy voucher 15%', 'Tra cứu đơn hàng', 'Giao 2H siêu tốc'];
      }

      const agentMsg = {
        id: `msg_agent_${Date.now()}`,
        sender: 'agent',
        agentName: targetShop ? targetShop.name : 'Trợ Lý AI Fullstack',
        avatar: targetShop?.avatar || null,
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        products,
        vouchers,
        orders,
        suggestions,
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 700);
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử trò chuyện AI này?')) {
      setMessages(DEFAULT_WELCOME_MESSAGES);
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  };

  return (
    <>
      {/* Nút bấm Floating Trigger mở Chatbot AI */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99998,
            width: '64px',
            height: '64px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #090d16, #1e1b4b)',
            color: '#fff',
            border: '2px solid rgba(56, 189, 248, 0.6)',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.6), 0 0 24px rgba(99, 102, 241, 0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.28s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.28s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.12) rotate(4deg)';
            e.currentTarget.style.boxShadow = '0 14px 36px rgba(15, 23, 42, 0.7), 0 0 32px rgba(56, 189, 248, 0.65)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
            e.currentTarget.style.boxShadow = '0 10px 30px rgba(15, 23, 42, 0.6), 0 0 24px rgba(99, 102, 241, 0.45)';
          }}
          title="Trợ Lý AI Fullstack - Hỗ trợ thông minh 24/7"
          aria-label="Mở Trợ lý ảo AI"
        >
          <BotIcon size={38} glow />
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2.5px solid #090d16',
              boxShadow: '0 0 8px #22c55e',
            }}
          />
        </button>
      )}

      {/* Cửa sổ Chatbot AI Nâng Cấp Toàn Diện */}
      {isOpen && (
        <div
          className="anim-chat-box"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 100000,
            width: '410px',
            maxWidth: 'calc(100vw - 28px)',
            height: 'min(580px, calc(100vh - 80px))',
            maxHeight: 'calc(100vh - 80px)',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '20px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(99, 102, 241, 0.2)',
            border: '1px solid var(--border-medium, #cbd5e1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'inherit',
            animation: 'chatPopUp 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Header Cửa Sổ Chatbot */}
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
              borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                {targetShop?.avatar ? (
                  <img
                    src={targetShop.avatar}
                    alt={targetShop.name}
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.6)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '50%',
                      background: 'radial-gradient(circle, #1e1b4b 0%, #090d16 100%)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid rgba(56, 189, 248, 0.6)',
                      boxShadow: '0 0 12px rgba(56, 189, 248, 0.4)',
                    }}
                  >
                    <BotIcon size={28} glow />
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    border: '2px solid #090d16',
                  }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '14.5px', lineHeight: '1.2', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{targetShop ? targetShop.name : 'Trợ Lý AI Thông Minh'}</span>
                  {!targetShop && (
                    <span style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', fontSize: '9.5px', padding: '1px 6px', borderRadius: '6px', fontWeight: 700 }}>
                      PRO AI
                    </span>
                  )}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{ color: '#22c55e' }}>●</span> Sẵn sàng phản hồi tức thì 24/7
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={handleClearHistory}
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: 'none',
                  color: '#cbd5e1',
                  cursor: 'pointer',
                  padding: '5px 8px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  transition: 'background 0.2s',
                }}
                title="Xóa lịch sử chat"
                aria-label="Xóa lịch sử"
              >
                🗑️
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  transition: 'background 0.2s',
                }}
                title="Thu nhỏ chat"
                aria-label="Thu nhỏ"
              >
                —
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{
                  background: '#ea580c',
                  border: 'none',
                  color: '#ffffff',
                  cursor: 'pointer',
                  width: '28px',
                  height: '28px',
                  borderRadius: '6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.4)',
                  transition: 'background 0.2s',
                }}
                title="Đóng chat"
                aria-label="Đóng chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick FAQ Strip */}
          <div
            style={{
              padding: '8px 12px',
              background: 'var(--bg-muted, #f8fafc)',
              borderBottom: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
              scrollbarWidth: 'none',
            }}
          >
            {[
              { label: '🔍 Tìm sản phẩm', text: 'Tìm sản phẩm hot deal' },
              { label: '📦 Đơn mua của tôi', text: 'Kiểm tra đơn hàng của tôi' },
              { label: '🎟️ Nhận voucher 15%', text: 'Cho tôi xin mã giảm giá' },
              { label: '⚡ Giao 2H', text: 'Chính sách giao 2H' },
              { label: '🔄 Đổi trả 30 ngày', text: 'Chính sách đổi trả bảo hành' },
            ].map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSendMessage(chip.text)}
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-medium, #cbd5e1)',
                  color: 'var(--text-primary, #0f172a)',
                  padding: '3px 10px',
                  borderRadius: '12px',
                  fontSize: '11.5px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {/* Danh Sách Tin Nhắn Đa Phương Tiện (Interactive Messages) */}
          <div
            style={{
              flex: 1,
              padding: '14px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              background: 'var(--bg-page, #f8fafc)',
            }}
          >
            {messages.map((m) => {
              const isUser = m.sender === 'user';
              return (
                <div
                  key={m.id}
                  style={{
                    display: 'flex',
                    flexDirection: isUser ? 'row-reverse' : 'row',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  {!isUser && (
                    m.avatar ? (
                      <img
                        src={m.avatar}
                        alt="Agent"
                        style={{ width: '30px', height: '30px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0, marginTop: '2px' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          background: '#090d16',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid #38bdf8',
                          flexShrink: 0,
                          marginTop: '2px',
                        }}
                      >
                        <BotIcon size={20} />
                      </div>
                    )
                  )}

                  <div style={{ maxWidth: '82%', width: '100%' }}>
                    {!isUser && m.agentName && (
                      <div style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)', marginBottom: '3px', marginLeft: '4px', fontWeight: 600 }}>
                        {m.agentName}
                      </div>
                    )}
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: isUser ? 'var(--primary-color, #ea580c)' : 'var(--bg-card, #ffffff)',
                        color: isUser ? '#ffffff' : 'var(--text-primary)',
                        fontSize: '13px',
                        lineHeight: '1.5',
                        boxShadow: 'var(--shadow-sm, 0 1px 3px rgba(0,0,0,0.08))',
                        border: isUser ? 'none' : '1px solid var(--border-medium, #e2e8f0)',
                        whiteSpace: 'pre-line',
                      }}
                    >
                      {m.text}

                      {/* Card Sản Phẩm Gợi Ý Thông Minh */}
                      {m.products && m.products.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {m.products.map((prod) => (
                            <div
                              key={prod.id || prod._id}
                              style={{
                                display: 'flex',
                                gap: '10px',
                                background: 'var(--bg-muted, #f1f5f9)',
                                border: '1px solid var(--border-medium, #cbd5e1)',
                                borderRadius: '10px',
                                padding: '8px',
                                alignItems: 'center',
                              }}
                            >
                              <img
                                src={prod.image}
                                alt={prod.name}
                                style={{ width: '52px', height: '52px', borderRadius: '6px', objectFit: 'cover', flexShrink: 0 }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {prod.name}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '2px' }}>
                                  <span style={{ color: '#ea580c', fontWeight: 800, fontSize: '13px' }}>
                                    {(prod.price || 0).toLocaleString('vi-VN')}₫
                                  </span>
                                  {prod.rating && (
                                    <span style={{ fontSize: '11px', color: '#f59e0b', fontWeight: 600 }}>
                                      ⭐ {prod.rating}
                                    </span>
                                  )}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  navigate(`/products/${prod.id || prod._id}`);
                                }}
                                style={{
                                  background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '5px 9px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  flexShrink: 0,
                                }}
                              >
                                Xem ngay
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Card Voucher Khuyến Mãi 1-Click Copy */}
                      {m.vouchers && m.vouchers.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {m.vouchers.map((vc) => (
                            <div
                              key={vc.code}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08), rgba(245, 158, 11, 0.08))',
                                border: '1px dashed #ea580c',
                                borderRadius: '10px',
                                padding: '8px 10px',
                              }}
                            >
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <strong style={{ fontSize: '13px', color: '#ea580c' }}>{vc.code}</strong>
                                  <span style={{ background: '#ea580c', color: '#fff', fontSize: '9.5px', padding: '1px 5px', borderRadius: '4px', fontWeight: 700 }}>
                                    {vc.discount}
                                  </span>
                                </div>
                                <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748b)', marginTop: '2px' }}>
                                  {vc.desc}
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleCopyVoucher(vc.code)}
                                style={{
                                  background: copiedCode === vc.code ? '#22c55e' : '#ea580c',
                                  color: '#ffffff',
                                  border: 'none',
                                  borderRadius: '6px',
                                  padding: '5px 10px',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                  transition: 'background 0.2s',
                                }}
                              >
                                {copiedCode === vc.code ? '✓ Đã sao chép' : 'Sao chép'}
                              </button>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Card Tra Cứu Đơn Hàng */}
                      {m.orders && m.orders.length > 0 && (
                        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {m.orders.map((ord, idx) => (
                            <div
                              key={ord.id || ord._id || idx}
                              style={{
                                background: 'var(--bg-muted, #f1f5f9)',
                                border: '1px solid var(--border-medium, #cbd5e1)',
                                borderRadius: '10px',
                                padding: '8px 10px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontWeight: 700, fontSize: '12px', color: '#4f46e5' }}>
                                  #{ord.id || ord._id || `ORD-${Date.now().toString().slice(-6)}`}
                                </span>
                                <span style={{ fontSize: '10px', background: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', padding: '2px 6px', borderRadius: '4px', fontWeight: 700 }}>
                                  {ord.status || 'Đang giao hàng (SPX 2H)'}
                                </span>
                              </div>
                              <div style={{ fontSize: '11.5px', marginTop: '4px', color: 'var(--text-muted, #64748b)' }}>
                                Tổng tiền: <strong style={{ color: '#ea580c' }}>{(ord.totalAmount || ord.total || 0).toLocaleString('vi-VN')}₫</strong>
                              </div>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => navigate('/orders')}
                            style={{
                              background: '#4f46e5',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '6px',
                              padding: '6px',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              cursor: 'pointer',
                              textAlign: 'center',
                              marginTop: '2px',
                            }}
                          >
                            📦 Xem toàn bộ lịch sử đơn mua
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Suggestion Chips phụ dưới tin nhắn bot */}
                    {m.suggestions && m.suggestions.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px', marginLeft: '4px' }}>
                        {m.suggestions.map((sug, sIdx) => (
                          <button
                            key={sIdx}
                            type="button"
                            onClick={() => handleSendMessage(sug)}
                            style={{
                              background: 'transparent',
                              border: '1px solid rgba(99, 102, 241, 0.35)',
                              color: 'var(--primary-color, #4f46e5)',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              fontSize: '11px',
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s',
                            }}
                          >
                            💬 {sug}
                          </button>
                        ))}
                      </div>
                    )}

                    <div
                      style={{
                        fontSize: '10px',
                        color: 'var(--text-muted, #94a3b8)',
                        marginTop: '3px',
                        textAlign: isUser ? 'right' : 'left',
                        padding: '0 4px',
                      }}
                    >
                      {m.time}
                    </div>
                  </div>
                </div>
              );
            })}

            {isTyping && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    padding: '8px 14px',
                    borderRadius: '16px 16px 16px 4px',
                    background: 'var(--bg-card, #ffffff)',
                    border: '1px solid var(--border-medium, #e2e8f0)',
                    fontSize: '12px',
                    color: 'var(--text-muted, #64748b)',
                    fontStyle: 'italic',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ display: 'inline-block', animation: 'spin 1.5s linear infinite' }}>✨</span>
                  Trợ lý AI đang tìm kiếm câu trả lời tối ưu...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Form Nhập Tin Nhắn */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '10px 14px',
              background: 'var(--bg-card, #ffffff)',
              borderTop: '1px solid var(--border-medium, #e2e8f0)',
              display: 'flex',
              gap: '8px',
              alignItems: 'center',
            }}
          >
            <input
              type="text"
              className="shopee-form-input"
              placeholder="Hỏi về sản phẩm, tra đơn, xin voucher..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{
                flex: 1,
                padding: '9px 14px',
                fontSize: '13px',
                borderRadius: '9999px',
                background: 'var(--bg-page, #f8fafc)',
                border: '1px solid var(--border-medium, #cbd5e1)',
              }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: inputMessage.trim() ? 'linear-gradient(135deg, #4f46e5, #06b6d4)' : 'var(--bg-muted, #cbd5e1)',
                color: '#ffffff',
                border: 'none',
                cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                transition: 'all 0.2s ease',
                boxShadow: inputMessage.trim() ? '0 2px 8px rgba(79, 70, 229, 0.4)' : 'none',
              }}
              title="Gửi tin nhắn"
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
