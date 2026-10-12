import React, { useState, useEffect, useRef } from 'react';
import { generateAdminCopilotResponse } from '../services/adminAiCopilotEngine';
import {
  SparklesIcon,
  SendIcon,
  TrashIcon,
  ShieldIcon,
  CloseIcon,
  ChartBarIcon,
  CheckIcon,
  AlertCircleIcon,
} from './OrdersIcons';

const ADMIN_CHAT_STORAGE_KEY = 'mini_shopee_admin_copilot_history_v1';

export default function AdminAiCopilotModal({ isOpen, onClose, contextData = {} }) {
  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(ADMIN_CHAT_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return [
      {
        id: 'msg-welcome',
        sender: 'ai',
        text: `Chào Quản Trị Viên! Tôi là **Admin Sentinel Copilot** - Trợ lý số chuyên trách phân tích số liệu, kiểm soát rủi ro và giám sát tuân thủ toàn sàn Shopee.

Tôi hoạt động với cơ chế **Zero-Destructive Read-Only Guardrails**: Hỗ trợ phân tích chuyên sâu nhưng **tuyệt đối không tự ý xóa dữ liệu hoặc thay đổi quyền quản trị**.`,
        tag: 'BẢO MẬT HỆ THỐNG',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Báo cáo doanh số GMV toàn sàn',
          'Kiểm tra nghĩa vụ thuế Nghị định 52',
          'Quét radar tài khoản gian lận',
          'Đánh giá chất lượng vận hành SLA'
        ]
      }
    ];
  });

  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(ADMIN_CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

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
      const resp = generateAdminCopilotResponse(q, contextData);
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
    localStorage.removeItem(ADMIN_CHAT_STORAGE_KEY);
    setMessages([
      {
        id: `msg-reset-${Date.now()}`,
        sender: 'ai',
        text: 'Đã làm mới phiên tư vấn. Mời Quản Trị Viên đặt câu hỏi để tôi hỗ trợ phân tích!',
        tag: 'PHIÊN MỚI',
        time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestions: [
          'Báo cáo doanh số GMV toàn sàn',
          'Kiểm tra nghĩa vụ thuế Nghị định 52',
          'Quét radar tài khoản gian lận'
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
        background: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.15)',
        borderLeft: '1px solid #e2e8f0',
        animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        {/* Header Admin Copilot */}
        <div style={{
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid #334155'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'rgba(37, 99, 235, 0.25)',
              border: '1px solid rgba(37, 99, 235, 0.5)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldIcon size={16} color="#60a5fa" />
            </span>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <strong style={{ fontSize: '14px', letterSpacing: '0.2px' }}>Admin Sentinel Copilot</strong>
                <span style={{ fontSize: '9.5px', background: '#1d4ed8', color: '#fff', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                  SUPER ADMIN
                </span>
              </div>
              <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#94a3b8' }}>
                Trợ lý giám sát, phân tích số liệu & rủi ro toàn sàn
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              onClick={handleClearHistory}
              title="Xóa lịch sử tư vấn"
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: 'none',
                color: '#94a3b8',
                borderRadius: '6px',
                width: '28px',
                height: '28px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <TrashIcon size={13} color="#94a3b8" />
            </button>
            <button
              type="button"
              onClick={onClose}
              title="Đóng bảng trợ lý"
              style={{
                background: 'rgba(255,255,255,0.1)',
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

        {/* Security Guardrail Notification Pill */}
        <div style={{
          background: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          padding: '8px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          fontSize: '11px',
          color: '#475569'
        }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
          <span>Chế độ an toàn: <strong>Read-Only Intelligence</strong> (Không tự ý xóa dữ liệu)</span>
        </div>

        {/* Message Stream */}
        <div ref={scrollRef} style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          background: '#f8fafc'
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
                  color: msg.type === 'warning' ? '#dc2626' : '#2563eb',
                  background: msg.type === 'warning' ? '#fee2e2' : '#eff6ff',
                  border: `1px solid ${msg.type === 'warning' ? '#fecaca' : '#bfdbfe'}`,
                  padding: '1px 6px',
                  borderRadius: '3px',
                  marginBottom: '4px'
                }}>
                  {msg.tag}
                </span>
              )}

              <div style={{
                background: msg.sender === 'user' ? '#1e293b' : '#ffffff',
                color: msg.sender === 'user' ? '#ffffff' : '#0f172a',
                padding: '10px 14px',
                borderRadius: msg.sender === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                fontSize: '12.5px',
                lineHeight: 1.5,
                border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
                whiteSpace: 'pre-wrap'
              }}>
                {msg.text}
              </div>

              <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', padding: '0 2px' }}>
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
                        background: '#ffffff',
                        border: '1px solid #cbd5e1',
                        borderRadius: '14px',
                        padding: '4px 10px',
                        fontSize: '11px',
                        color: '#334155',
                        cursor: 'pointer',
                        fontWeight: 500,
                        transition: 'all 0.15s ease'
                      }}
                      onMouseOver={e => { e.currentTarget.style.borderColor = '#2563eb'; e.currentTarget.style.color = '#2563eb'; }}
                      onMouseOut={e => { e.currentTarget.style.borderColor = '#cbd5e1'; e.currentTarget.style.color = '#334155'; }}
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
              background: '#ffffff',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              fontSize: '11.5px',
              color: '#64748b',
              alignSelf: 'flex-start'
            }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#2563eb', animation: 'pulse 1s infinite' }} />
              <span>Admin Copilot đang phân tích số liệu...</span>
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
            background: '#ffffff',
            borderTop: '1px solid #e2e8f0',
            display: 'flex',
            gap: '8px'
          }}
        >
          <input
            type="text"
            value={inputQuery}
            onChange={e => setInputQuery(e.target.value)}
            placeholder="Tra cứu GMV, thuế Nghị định 52, radar gian lận..."
            style={{
              flex: 1,
              padding: '8px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              fontSize: '12.5px',
              outline: 'none'
            }}
          />
          <button
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            style={{
              background: '#0f172a',
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
