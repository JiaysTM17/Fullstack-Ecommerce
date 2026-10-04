import React, { useState, useEffect, useRef } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { SendIcon, ArrowLeftIcon, CloseIcon, ChatIcon, PackageIcon, TruckIcon, TicketIcon, ShieldCheckIcon } from './OrdersIcons';

const DEFAULT_MESSAGES = [
  {
    id: 1,
    sender: 'shop',
    text: 'Dạ xin chào bạn! Cảm ơn bạn đã ghé thăm gian hàng. Shop có thể hỗ trợ gì cho bạn về sản phẩm này ạ?',
    time: 'Vừa xong'
  }
];

const QUICK_QUESTIONS = [
  'Sản phẩm này còn hàng không shop?',
  'Thời gian giao hàng dự kiến bao lâu ạ?',
  'Shop có mã giảm giá riêng không?',
  'Sản phẩm có được bảo hành chính hãng không?'
];

export default function ShopChatModal({ shop, currentProduct, onClose, inline = false }) {
  const [messages, setMessages] = useState(DEFAULT_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatBodyRef = useRef(null);

  useEffect(() => {
    if (chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSendMessage = (textToSend) => {
    const text = (textToSend || inputText).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    // Simulate smart shop seller reply
    setTimeout(() => {
      let replyText = 'Dạ sản phẩm bên em cam kết 100% chính hãng, có sẵn hàng tại kho và hỗ trợ đổi trả trong 7 ngày ạ!';
      const lower = text.toLowerCase();
      if (lower.includes('còn hàng') || lower.includes('hết hàng')) {
        replyText = `Dạ mẫu "${currentProduct?.name || 'này'}" hiện tại bên em vẫn còn sẵn đủ màu và size tại kho, bạn yên tâm đặt hàng nhé!`;
      } else if (lower.includes('thời gian') || lower.includes('bao lâu') || lower.includes('giao')) {
        replyText = 'Dạ nếu bạn ở TP.HCM/Hà Nội sẽ nhận trong 1-2 ngày, các tỉnh khác từ 2-3 ngày qua đơn vị SPX Express ạ!';
      } else if (lower.includes('mã') || lower.includes('giảm giá') || lower.includes('voucher')) {
        replyText = 'Dạ bạn nhập mã SHOPGENZ hoặc MINI10 ở bước thanh toán để được giảm thêm đến 10% nha!';
      } else if (lower.includes('bảo hành') || lower.includes('chính hãng')) {
        replyText = 'Dạ sản phẩm được bảo hành chính hãng 12 tháng, 1 đổi 1 trong 30 ngày nếu có lỗi từ nhà sản xuất ạ!';
      }

      const shopMsg = {
        id: Date.now() + 1,
        sender: 'shop',
        text: replyText,
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, shopMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div
      className={inline ? 'shop-chat-inline-container' : 'anim-chat-box'}
      style={{
        position: inline ? 'relative' : 'fixed',
        bottom: inline ? 'auto' : '24px',
        right: inline ? 'auto' : '24px',
        width: '100%',
        maxWidth: inline ? '100%' : '380px',
        height: inline ? '620px' : '520px',
        background: 'var(--bg-card, #ffffff)',
        borderRadius: inline ? '12px' : '16px',
        boxShadow: inline ? 'none' : '0 12px 36px rgba(0,0,0,0.22)',
        border: '1px solid var(--border-medium, #e2e8f0)',
        display: 'flex',
        flexDirection: 'column',
        zIndex: inline ? 10 : 9999,
        overflow: 'hidden',
        animation: inline ? 'fadeIn 0.25s ease-out' : 'chatPopUp 0.26s cubic-bezier(0.16, 1, 0.3, 1) forwards'
      }}
    >
      {/* Chat Header */}
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {inline && (
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: '#fff',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <ArrowLeftIcon size={12} color="#ffffff" />
              <span>Quay lại</span>
            </button>
          )}
          <img
            src={shop?.logo || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80'}
            alt={shop?.name || 'Shop'}
            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #ea580c' }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>{shop?.name || 'Gian Hàng Đối Tác'}</span>
              <span style={{ fontSize: '10px', background: '#dc2626', color: '#fff', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '13px', height: '13px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheckIcon size={8} color="#ffffff" />
                </span>
                <span>Mall</span>
              </span>
            </div>
            <div style={{ fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
              <span style={{ width: '6px', height: '6px', background: '#10b981', borderRadius: '50%' }}></span>
              Đang hoạt động (Phản hồi &lt; 5 phút)
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          title="Đóng chat"
          aria-label="Đóng chat với gian hàng"
        >
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon size={14} color="#ef4444" />
          </span>
        </button>
      </div>

      {/* Product Highlight Banner */}
      {currentProduct && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 14px',
            background: 'var(--bg-muted, #f8fafc)',
            borderBottom: '1px solid var(--border-light, #f1f5f9)',
            fontSize: '12px'
          }}
        >
          <img
            src={currentProduct.image}
            alt={currentProduct.name}
            style={{ width: '36px', height: '36px', borderRadius: '4px', objectFit: 'cover' }}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
              {currentProduct.name}
            </div>
            <div style={{ fontWeight: 800, color: 'var(--primary-color, #ea580c)' }}>
              {formatCurrency(currentProduct.price)}
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleSendMessage(`Tôi đang quan tâm đến sản phẩm "${currentProduct.name}" (${formatCurrency(currentProduct.price)}), shop tư vấn giúp tôi nhé!`)}
            style={{
              background: 'rgba(234, 88, 12, 0.08)',
              border: '1px solid var(--primary-color, #ea580c)',
              color: 'var(--primary-color, #ea580c)',
              fontSize: '11px',
              fontWeight: 700,
              padding: '4px 8px',
              borderRadius: '6px',
              cursor: 'pointer'
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChatIcon size={11} color="#ea580c" />
              </span>
              <span>Hỏi sản phẩm</span>
            </span>
          </button>
        </div>
      )}

      {/* Chat Messages Body */}
      <div
        ref={chatBodyRef}
        style={{
          flex: 1,
          padding: '14px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          background: 'var(--bg-page, #ffffff)'
        }}
      >
        {messages.map((m) => {
          const isUser = m.sender === 'user';
          return (
            <div
              key={m.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '82%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: isUser ? 'flex-end' : 'flex-start'
              }}
            >
              <div
                style={{
                  background: isUser ? 'linear-gradient(135deg, #ea580c, #c2410c)' : 'var(--bg-muted, #f1f5f9)',
                  color: isUser ? '#ffffff' : 'var(--text-primary, #0f172a)',
                  padding: '9px 13px',
                  borderRadius: isUser ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  fontSize: '13px',
                  lineHeight: '1.45',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.08)'
                }}
              >
                {m.text}
              </div>
              <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', marginTop: '3px', padding: '0 4px' }}>
                {m.time}
              </span>
            </div>
          );
        })}

        {isTyping && (
          <div style={{ alignSelf: 'flex-start', background: 'var(--bg-muted, #f1f5f9)', padding: '6px 12px', borderRadius: '12px', fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', background: '#ea580c' }}></span>
            <span>Shop đang soạn câu trả lời...</span>
          </div>
        )}
      </div>

      {/* Quick Prompts */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          padding: '6px 10px',
          overflowX: 'auto',
          background: 'var(--bg-card, #ffffff)',
          borderTop: '1px solid var(--border-light, #f1f5f9)'
        }}
      >
        {QUICK_QUESTIONS.map((q, idx) => {
          let qIcon = <PackageIcon size={11} color="#ea580c" />;
          let iconBg = 'rgba(234, 88, 12, 0.1)';
          if (idx === 1) {
            qIcon = <TruckIcon size={11} color="#16a34a" />;
            iconBg = 'rgba(22, 163, 74, 0.1)';
          }
          if (idx === 2) {
            qIcon = <TicketIcon size={11} color="#f59e0b" />;
            iconBg = 'rgba(245, 158, 11, 0.1)';
          }
          if (idx === 3) {
            qIcon = <ShieldCheckIcon size={11} color="#059669" />;
            iconBg = 'rgba(5, 150, 105, 0.1)';
          }
          return (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(q)}
              style={{
                background: 'var(--bg-muted, #f8fafc)',
                border: '1px solid var(--border-medium, #e2e8f0)',
                borderRadius: '999px',
                padding: '3px 10px 3px 4px',
                fontSize: '11px',
                color: 'var(--text-secondary, #475569)',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: iconBg, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {qIcon}
              </span>
              <span>{q}</span>
            </button>
          );
        })}
      </div>

      {/* Chat Input Bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendMessage();
        }}
        style={{
          display: 'flex',
          padding: '10px 12px',
          background: 'var(--bg-card, #ffffff)',
          borderTop: '1px solid var(--border-medium, #e2e8f0)',
          gap: '8px'
        }}
      >
        <input
          type="text"
          placeholder="Nhập tin nhắn cho shop..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          style={{
            flex: 1,
            padding: '8px 12px',
            borderRadius: '20px',
            border: '1px solid var(--border-medium, #cbd5e1)',
            fontSize: '13px',
            outline: 'none',
            background: 'var(--bg-muted, #f8fafc)',
            color: 'var(--text-primary)'
          }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          style={{
            background: inputText.trim() ? 'var(--primary-color, #ea580c)' : '#cbd5e1',
            color: '#ffffff',
            border: 'none',
            borderRadius: '50%',
            width: '36px',
            height: '36px',
            cursor: inputText.trim() ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s ease'
          }}
        >
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: inputText.trim() ? 'rgba(255, 255, 255, 0.25)' : 'transparent', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <SendIcon size={14} color="#ffffff" />
          </span>
        </button>
      </form>
    </div>
  );
}
