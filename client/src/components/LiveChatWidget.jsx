import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const CHAT_STORAGE_KEY = 'mini_shopee_live_chat_history';

// Biểu tượng Chatbot AI thông minh & hiện đại
export function BotIcon({ size = 32, glow = false }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block', filter: glow ? 'drop-shadow(0 2px 8px rgba(56, 189, 248, 0.6))' : 'none' }}
    >
      {/* Ăng-ten phát tín hiệu */}
      <circle cx="18" cy="4" r="2.5" fill="#38bdf8" />
      <line x1="18" y1="6.5" x2="18" y2="10" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      
      {/* Tai nghe / Headset 2 bên */}
      <rect x="3" y="14" width="3" height="8" rx="1.5" fill="#4f46e5" />
      <rect x="30" y="14" width="3" height="8" rx="1.5" fill="#4f46e5" />
      
      {/* Khung đầu Robot */}
      <rect x="5.5" y="9.5" width="25" height="18" rx="7" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
      
      {/* Màn hình hiển thị LED */}
      <rect x="8" y="12" width="20" height="13" rx="4" fill="#1e293b" />
      
      {/* Mắt LED phát sáng */}
      <ellipse cx="13" cy="17" rx="2.4" ry="2.8" fill="#38bdf8" />
      <ellipse cx="23" cy="17" rx="2.4" ry="2.8" fill="#38bdf8" />
      <circle cx="14" cy="16" r="0.8" fill="#ffffff" />
      <circle cx="24" cy="16" r="0.8" fill="#ffffff" />
      
      {/* Nụ cười thân thiện */}
      <path d="M15 21.5Q18 24 21 21.5" stroke="#38bdf8" strokeWidth="1.8" strokeLinecap="round" />
      
      {/* Khung vai áo hiện đại */}
      <path d="M10 29C10 29 12 32.5 18 32.5C24 32.5 26 29 26 29" stroke="#4f46e5" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

const DEFAULT_WELCOME_MESSAGES = [
  {
    id: 'msg_welcome_1',
    sender: 'agent',
    agentName: 'Trợ Lý AI Fullstack E-Commerce',
    avatar: null,
    text: 'Xin chào! Tôi là Trợ Lý AI của sàn Fullstack E-Commerce. Tôi có thể hỗ trợ bạn tra cứu đơn hàng, tư vấn mã giảm giá voucher hoặc giải đáp chính sách giao hàng 24/7 ạ!',
    time: 'Vừa xong',
  }
];

export default function LiveChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [targetShop, setTargetShop] = useState(null);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? JSON.parse(saved) : DEFAULT_WELCOME_MESSAGES;
    } catch {
      return DEFAULT_WELCOME_MESSAGES;
    }
  });

  const messagesEndRef = useRef(null);
  const { t } = useLanguage();
  const { theme } = useTheme();

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isTyping]);

  // Persist messages to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Listen for custom trigger to open chat for specific shop
  useEffect(() => {
    const handleOpenChat = (event) => {
      const detail = event.detail;
      if (detail && detail.shopName) {
        setTargetShop({
          name: detail.shopName,
          id: detail.shopId,
          avatar: detail.shopAvatar,
        });

        // Add contextual greeting if not present
        setMessages((prev) => [
          ...prev,
          {
            id: `msg_shop_${Date.now()}`,
            sender: 'agent',
            agentName: detail.shopName,
            avatar: detail.shopAvatar || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=100',
            text: `Dạ chào bạn! Đây là kênh chat chính thức của ${detail.shopName}. Gian hàng có thể tư vấn mẫu mã hoặc ưu đãi gì cho bạn không ạ?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          }
        ]);
      }
      setIsOpen(true);
    };

    window.addEventListener('open_live_chat', handleOpenChat);
    return () => window.removeEventListener('open_live_chat', handleOpenChat);
  }, []);

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

    // Simulate smart bot/shop agent response
    setTimeout(() => {
      let replyText = 'Cảm ơn bạn đã nhắn tin! Nhân viên tư vấn của chúng tôi đang kiểm tra thông tin và sẽ phản hồi chi tiết tới bạn trong giây lát.';
      const lower = content.toLowerCase();

      if (lower.includes('giao') || lower.includes('ship') || lower.includes('thời gian')) {
        replyText = '📦 Đơn hàng tại TP.HCM & Hà Nội được giao siêu tốc trong 2H hoặc 24H qua SPX Express. Các tỉnh thành khác thời gian nhận hàng từ 2-3 ngày bạn nhé!';
      } else if (lower.includes('voucher') || lower.includes('giảm giá') || lower.includes('mã')) {
        replyText = '🎟️ Hiện sàn đang có mã MINI10 (giảm 10%), FREESHIP (miễn phí ship 30k) và SUPERDEAL (giảm 15%) không giới hạn đơn tối thiểu. Bạn có thể nhấn nút "Chọn mã giảm giá" trong giỏ hàng để dùng ngay!';
      } else if (lower.includes('đổi') || lower.includes('trả') || lower.includes('bảo hành')) {
        replyText = '🔄 Fullstack E-Commerce cam kết chính sách ĐỔI TRẢ 30 NGÀY MIỄN PHÍ tận nhà nếu sản phẩm có lỗi từ nhà sản xuất hoặc không vừa kích cỡ. Bạn hoàn toàn an tâm nhé!';
      } else if (lower.includes('nhân viên') || lower.includes('tư vấn') || lower.includes('người')) {
        replyText = '👨‍💼 Dạ vâng, tư vấn viên Kim Ngân đã tiếp nhận cuộc trò chuyện của bạn và đang sẵn sàng giải đáp mọi thắc mắc.';
      } else if (targetShop) {
        replyText = `Dạ ${targetShop.name} đã nhận được yêu cầu của bạn về sản phẩm. Bên mình hiện còn đầy đủ size và màu, sẵn sàng đóng gói gửi bạn ngay hôm nay ạ!`;
      }

      const agentMsg = {
        id: `msg_agent_${Date.now()}`,
        sender: 'agent',
        agentName: targetShop ? targetShop.name : 'CSKH Fullstack E-Commerce',
        avatar: targetShop?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
        text: replyText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, agentMsg]);
      setIsTyping(false);
    }, 800);
  };

  const handleClearHistory = () => {
    if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử đoạn chat này?')) {
      setMessages(DEFAULT_WELCOME_MESSAGES);
      localStorage.removeItem(CHAT_STORAGE_KEY);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 99998,
            width: '62px',
            height: '62px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#fff',
            border: '2px solid rgba(56, 189, 248, 0.45)',
            boxShadow: '0 8px 24px rgba(15, 23, 42, 0.45), 0 0 16px rgba(56, 189, 248, 0.25)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.25s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 10px 28px rgba(15, 23, 42, 0.55), 0 0 20px rgba(56, 189, 248, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(15, 23, 42, 0.45), 0 0 16px rgba(56, 189, 248, 0.25)';
          }}
          title={t('chat_support_title', 'Trợ Lý AI & Tư Vấn 24/7')}
          aria-label="Mở Trợ lý ảo AI"
        >
          <BotIcon size={34} glow />
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '13px',
              height: '13px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #0f172a',
              boxShadow: '0 0 6px #22c55e',
            }}
          />
        </button>
      )}

      {/* Chat Window Popup */}
      {isOpen && (
        <div
          className="anim-chat-box"
          style={{
            position: 'fixed',
            bottom: '20px',
            right: '20px',
            zIndex: 100000,
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: 'min(490px, calc(100vh - 100px))',
            maxHeight: 'calc(100vh - 100px)',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
            border: '1px solid var(--border-medium, #cbd5e1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'inherit',
            animation: 'chatPopUp 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexShrink: 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                {targetShop?.avatar ? (
                  <img
                    src={targetShop.avatar}
                    alt={targetShop.name}
                    style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.5)' }}
                  />
                ) : (
                  <div
                    style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '50%',
                      background: '#0f172a',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '2px solid #38bdf8',
                      boxShadow: '0 0 10px rgba(56, 189, 248, 0.4)',
                    }}
                  >
                    <BotIcon size={26} glow />
                  </div>
                )}
                <span
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: '#22c55e',
                    border: '2px solid #0f172a',
                  }}
                />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', lineHeight: '1.2' }}>
                  {targetShop ? targetShop.name : (t('brand_name') + ' Support')}
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{ color: '#22c55e' }}>●</span> {t('chat_online')} · {targetShop ? 'Phản hồi trong 10p' : 'Hỗ trợ 24/7'}
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
                  color: '#94a3b8',
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
                  fontSize: '15px',
                  fontWeight: 700,
                  boxShadow: '0 2px 6px rgba(234, 88, 12, 0.4)',
                  transition: 'background 0.2s',
                }}
                title="Đóng cửa sổ chat"
                aria-label="Đóng chat"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Quick FAQ Chips */}
          <div
            style={{
              padding: '10px 12px',
              background: 'var(--bg-muted, #f8fafc)',
              borderBottom: '1px solid var(--border-light, #e2e8f0)',
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              whiteSpace: 'nowrap',
            }}
          >
            <button
              type="button"
              onClick={() => handleSendMessage(t('chat_faq_shipping'))}
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-medium, #cbd5e1)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {t('chat_faq_shipping')}
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage(t('chat_faq_voucher'))}
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-medium, #cbd5e1)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {t('chat_faq_voucher')}
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage(t('chat_faq_return'))}
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-medium, #cbd5e1)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {t('chat_faq_return')}
            </button>
            <button
              type="button"
              onClick={() => handleSendMessage(t('chat_faq_advisor'))}
              style={{
                background: 'var(--bg-card, #ffffff)',
                border: '1px solid var(--border-medium, #cbd5e1)',
                color: 'var(--text-primary)',
                padding: '4px 10px',
                borderRadius: '12px',
                fontSize: '12px',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              {t('chat_faq_advisor')}
            </button>
          </div>

          {/* Message List */}
          <div
            style={{
              flex: 1,
              padding: '16px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
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
                    alignItems: 'flex-end',
                    gap: '8px',
                  }}
                >
                  {!isUser && (
                    m.avatar ? (
                      <img
                        src={m.avatar}
                        alt="Agent"
                        style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                      />
                    ) : (
                      <div
                        style={{
                          width: '28px',
                          height: '28px',
                          borderRadius: '50%',
                          background: '#0f172a',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: '1.5px solid #38bdf8',
                          flexShrink: 0,
                        }}
                      >
                        <BotIcon size={18} />
                      </div>
                    )
                  )}

                  <div style={{ maxWidth: '78%' }}>
                    {!isUser && m.agentName && (
                      <div style={{ fontSize: '10.5px', color: 'var(--text-muted, #64748b)', marginBottom: '3px', marginLeft: '4px' }}>
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
                      }}
                    >
                      {m.text}
                    </div>
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
                  }}
                >
                  Đang soạn phản hồi...
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            style={{
              padding: '12px',
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
              placeholder={t('chat_placeholder')}
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              style={{
                flex: 1,
                padding: '9px 12px',
                fontSize: '13px',
                borderRadius: '9999px',
                background: 'var(--bg-page, #f8fafc)',
              }}
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: inputMessage.trim() ? 'var(--primary-color, #ea580c)' : 'var(--bg-muted, #cbd5e1)',
                color: '#ffffff',
                border: 'none',
                cursor: inputMessage.trim() ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '15px',
                transition: 'background 0.2s ease',
              }}
              title={t('chat_send')}
            >
              ➤
            </button>
          </form>
        </div>
      )}
    </>
  );
}
