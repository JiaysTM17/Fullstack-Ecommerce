import React, { useState, useEffect, useRef } from 'react';
import { generateSellerCopilotResponse } from '../services/sellerAiCopilotEngine';
import {
  SparklesIcon,
  SendIcon,
  TrashIcon,
  StoreIcon,
  CloseIcon,
  PackageIcon,
  CheckIcon,
  BoltIcon,
  ChartBarIcon,
} from './OrdersIcons';

export default function SellerAiCopilotModal({ isOpen, onClose, currentShop, shopProducts = [], shopOrders = [], totalRevenue = 0, pnlData = null, restockData = null, adsData = null }) {
  const shopId = currentShop?.id || 'default_shop';
  const SELLER_CHAT_STORAGE_KEY = `mini_shopee_seller_copilot_history_${shopId}`;

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(SELLER_CHAT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'msg-seller-welcome',
        sender: 'ai',
        text: `Chào Bạn! Tôi là **ShopSmart AI** - Trợ lý số đồng hành độc quyền cùng **${currentShop?.name || 'Gian Hàng Của Bạn'}**.

Tôi sẵn sàng hỗ trợ bạn tối ưu hóa kinh doanh với dữ liệu phân tích thời gian thực:
- 📦 Cảnh báo hết hàng & gợi ý số lượng nhập kho PO.
- 💰 Phân tích biên lợi nhuận gộp P&L cho từng mặt hàng.
- ⚡ Tư vấn khung giờ & mức giảm giá chiến dịch Flash Sale.
- 🎯 Đánh giá chỉ số ROI / ROAS chiến dịch Shopee Ads.`,
        tag: 'ĐỘC QUYỀN GIAN HÀNG',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Cảnh báo sản phẩm sắp hết hàng',
          'Phân tích biên lợi nhuận P&L',
          'Tư vấn chiến lược Flash Sale',
          'Đánh giá hiệu quả Shopee Ads'
        ]
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(SELLER_CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages, SELLER_CHAT_STORAGE_KEY]);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [isOpen, messages, isTyping]);

  function handleSendQuery(queryToSend) {
    const q = (queryToSend || inputQuery).trim();
    if (!q) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: q,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      const resp = generateSellerCopilotResponse(q, {
        currentShop,
        shopProducts,
        shopOrders,
        totalRevenue,
        pnlData,
        restockData,
        adsData
      });

      const aiMsg = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: resp.text,
        type: resp.type,
        tag: resp.tag,
        suggestions: resp.suggestions || [],
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 450);
  }

  function handleClearHistory() {
    localStorage.removeItem(SELLER_CHAT_STORAGE_KEY);
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'ai',
        text: `Đã làm mới phiên tư vấn cho ${currentShop?.name}. Hãy hỏi tôi về kho hàng, P&L, Flash Sale hoặc Shopee Ads!`,
        tag: 'PHIÊN MỚI',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Cảnh báo sản phẩm sắp hết hàng',
          'Phân tích biên lợi nhuận P&L',
          'Tư vấn chiến lược Flash Sale'
        ]
      }
    ]);
  }

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(15, 23, 42, 0.45)',
      backdropFilter: 'blur(3px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'flex-end',
      zIndex: 2200,
      animation: 'fadeIn 0.2s ease-out'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '460px',
        height: '100vh',
        background: 'var(--bg-card, #ffffff)',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        borderLeft: '1px solid var(--border-medium, #e2e8f0)',
        animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header Seller Copilot */}
        <div style={{
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.15)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.2)',
              border: '1px solid rgba(255, 255, 255, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <StoreIcon size={16} color="#ffffff" />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '14px', letterSpacing: '0.2px' }}>ShopSmart AI Copilot</strong>
                <span style={{ fontSize: '9.5px', background: '#fff', color: '#ea580c', padding: '1px 5px', borderRadius: '3px', fontWeight: 800 }}>
                  SELLER
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#ffedd5' }}>
                Trợ lý tối ưu doanh số &amp; kho hàng cho {currentShop?.name}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleClearHistory}
              title="Xóa lịch sử tư vấn"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TrashIcon size={13} color="#ffffff" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng bảng trợ lý"
              style={{
                background: 'rgba(255,255,255,0.18)',
                border: 'none',
                color: '#ffffff',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <CloseIcon size={14} color="#ffffff" />
            </button>
          </div>
        </div>

        {/* Isolation Context Banner */}
        <div style={{
          background: 'rgba(234, 88, 12, 0.08)',
          borderBottom: '1px solid var(--border-medium, #fed7aa)',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: 'var(--primary-color, #ea580c)'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary-color, #ea580c)' }} />
          <span>Ngữ cảnh độc quyền: <strong>#{currentShop?.id?.toUpperCase()} ({currentShop?.name})</strong></span>
        </div>

        {/* Message Stream */}
        <div ref={scrollRef} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: 'var(--bg-page, #f8fafc)'
        }}>
          {messages.map(msg => (
            <div
              key={msg.id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                alignSelf: msg.sender === 'user' ? 'flex-end' : 'flex-start'
              }}
            >
              {msg.tag && (
                <span style={{
                  fontSize: '9.5px',
                  fontWeight: 700,
                  color: 'var(--primary-color, #ea580c)',
                  background: 'rgba(234, 88, 12, 0.12)',
                  border: '1px solid rgba(234, 88, 12, 0.28)',
                  padding: '1px 6px',
                  borderRadius: '3px',
                  marginBottom: '4px'
                }}>
                  {msg.tag}
                </span>
              )}

              <div style={{
                background: msg.sender === 'user' ? 'var(--primary-color, #ea580c)' : 'var(--bg-card, #ffffff)',
                color: msg.sender === 'user' ? '#ffffff' : 'var(--text-primary, #0f172a)',
                padding: '10px 14px',
                borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                fontSize: '12.5px',
                lineHeight: 1.5,
                border: msg.sender === 'user' ? 'none' : '1px solid var(--border-medium, #e2e8f0)',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>

              <span style={{ fontSize: '10px', color: 'var(--text-muted, #94a3b8)', marginTop: '3px', padding: '0 2px' }}>
                {msg.time}
              </span>

              {/* Suggestions Chips */}
              {Array.isArray(msg.suggestions) && msg.suggestions.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '8px' }}>
                  {msg.suggestions.map((sug, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendQuery(sug)}
                      style={{
                        background: 'var(--bg-card, #ffffff)',
                        border: '1px solid var(--border-medium, #cbd5e1)',
                        borderRadius: '14px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        color: 'var(--text-secondary, #334155)',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = 'var(--primary-color, #ea580c)'; e.currentTarget.style.color = 'var(--primary-color, #ea580c)'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = 'var(--border-medium, #cbd5e1)'; e.currentTarget.style.color = 'var(--text-secondary, #334155)'; }}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 12px',
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '8px',
              border: '1px solid var(--border-medium, #e2e8f0)',
              fontSize: '11.5px',
              color: 'var(--text-muted, #64748b)',
              alignSelf: 'flex-start'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#ea580c', animation: 'pulse 1s infinite' }} />
              <span>ShopSmart Copilot đang phân tích số liệu...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={e => {
            e.preventDefault();
            handleSendQuery();
          }}
          style={{
            padding: '12px 14px',
            background: 'var(--bg-card, #ffffff)',
            borderTop: '1px solid var(--border-medium, #e2e8f0)',
            display: 'flex',
            gap: '8px'
          }}
        >
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder="Hỏi về tồn kho, biên lãi P&L, Flash Sale, Shopee Ads..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid var(--border-medium, #cbd5e1)',
              background: 'var(--bg-page, #f8fafc)',
              color: 'var(--text-primary)',
              fontSize: '12.5px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            style={{
              background: 'var(--primary-color, #ea580c)',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              padding: '0 14px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: inputQuery.trim() && !isTyping ? 'pointer' : 'not-allowed',
              opacity: inputQuery.trim() && !isTyping ? 1 : 0.6
            }}
          >
            <SendIcon size={13} color="#ffffff" />
            <span>Gửi</span>
          </button>
        </form>
      </div>
    </div>
  );
}
