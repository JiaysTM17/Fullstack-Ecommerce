import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

const CHAT_STORAGE_KEY = 'mini_shopee_live_chat_history';

const DEFAULT_WELCOME_MESSAGES = [
  {
    id: 'msg_welcome_1',
    sender: 'agent',
    agentName: 'Hỗ Trợ Mini Shopee',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
    text: 'Xin chào! Mini Shopee rất hân hạnh được hỗ trợ bạn. Bạn đang cần tìm hiểu về đơn hàng, mã giảm giá hay muốn tư vấn sản phẩm nào ạ?',
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
        replyText = '🔄 Mini Shopee cam kết chính sách ĐỔI TRẢ 30 NGÀY MIỄN PHÍ tận nhà nếu sản phẩm có lỗi từ nhà sản xuất hoặc không vừa kích cỡ. Bạn hoàn toàn an tâm nhé!';
      } else if (lower.includes('nhân viên') || lower.includes('tư vấn') || lower.includes('người')) {
        replyText = '👨‍💼 Dạ vâng, tư vấn viên Kim Ngân đã tiếp nhận cuộc trò chuyện của bạn và đang sẵn sàng giải đáp mọi thắc mắc.';
      } else if (targetShop) {
        replyText = `Dạ ${targetShop.name} đã nhận được yêu cầu của bạn về sản phẩm. Bên mình hiện còn đầy đủ size và màu, sẵn sàng đóng gói gửi bạn ngay hôm nay ạ!`;
      }

      const agentMsg = {
        id: `msg_agent_${Date.now()}`,
        sender: 'agent',
        agentName: targetShop ? targetShop.name : 'CSKH Mini Shopee',
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
            zIndex: 998,
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, var(--primary-color, #ea580c), #c2410c)',
            color: '#fff',
            border: 'none',
            boxShadow: '0 8px 24px rgba(234, 88, 12, 0.45)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '28px',
            transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.08)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          title={t('chat_support_title')}
        >
          💬
          <span
            style={{
              position: 'absolute',
              top: '2px',
              right: '2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: '#22c55e',
              border: '2px solid #fff',
            }}
          />
        </button>
      )}

      {/* Chat Window Popup */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            zIndex: 999,
            width: '380px',
            maxWidth: 'calc(100vw - 32px)',
            height: '560px',
            maxHeight: 'calc(100vh - 48px)',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '16px',
            boxShadow: '0 12px 36px rgba(0, 0, 0, 0.2)',
            border: '1px solid var(--border-medium, #e2e8f0)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'inherit',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 16px',
              background: 'linear-gradient(135deg, #0f172a, #1e293b)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <img
                  src={targetShop?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                  alt="Avatar"
                  style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(255,255,255,0.4)' }}
                />
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
                <div style={{ fontWeight: 700, fontSize: '14.5px', lineHeight: '1.2' }}>
                  {targetShop ? targetShop.name : t('chat_support_title')}
                </div>
                <div style={{ fontSize: '11.5px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <span style={{ color: '#22c55e' }}>●</span> {t('chat_online')} · {targetShop ? 'Phản hồi trong 10p' : 'Tự động & Nhân viên 24/7'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button
                type="button"
                onClick={handleClearHistory}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '6px', fontSize: '14px', borderRadius: '4px' }}
                title="Xóa lịch sử chat"
              >
                🗑️
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ background: 'transparent', border: 'none', color: '#ffffff', cursor: 'pointer', padding: '6px', fontSize: '18px', lineHeight: 1 }}
                title="Đóng chat"
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
                    <img
                      src={m.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                      alt="Agent"
                      style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                    />
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
