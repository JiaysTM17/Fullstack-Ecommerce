import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_01',
    type: 'order',
    icon: '📦',
    title: 'Đơn hàng SPX-VN-84729104 đang giao',
    message: 'Bưu tá SPX Express đang di chuyển giao hàng đến bạn. Dự kiến trước 18h hôm nay!',
    time: '15 phút trước',
    isRead: false,
    link: '/orders',
  },
  {
    id: 'notif_02',
    type: 'voucher',
    icon: '🎟️',
    title: 'Quà tặng độc quyền: Voucher 50.000₫',
    message: 'Mini Shopee gửi tặng bạn mã WELCOME50 giảm 50.000₫ cho đơn từ 100k. Dùng ngay kẻo hết hạn!',
    time: '2 giờ trước',
    isRead: false,
    link: '/cart',
  },
  {
    id: 'notif_03',
    type: 'promo',
    icon: '⚡',
    title: 'Flash Sale Giờ Vàng đang bùng nổ',
    message: 'Giảm sốc tới 50% tai nghe chống ồn SoundPeak Pro & Bàn phím cơ RGB chỉ trong 2 giờ.',
    time: '5 giờ trước',
    isRead: false,
    link: '/?badge=Flash+Sale',
  },
  {
    id: 'notif_04',
    type: 'order',
    icon: '✓',
    title: 'Giao hàng thành công: Đơn ORD827103',
    message: 'Kiện hàng từ TechWorld Store đã được ký nhận thành công. Hãy chia sẻ đánh giá 5 sao nhé!',
    time: '1 ngày trước',
    isRead: true,
    link: '/orders',
  },
];

const NOTIFS_STORAGE_KEY = 'mini_shopee_notifications';

export default function NotificationsPopover() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const popoverRef = useRef(null);

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIFS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS;
  });

  const saveNotifications = (newNotifs) => {
    setNotifications(newNotifs);
    try {
      localStorage.setItem(NOTIFS_STORAGE_KEY, JSON.stringify(newNotifs));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    saveNotifications(updated);
  };

  const handleItemClick = (notif) => {
    const updated = notifications.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n));
    saveNotifications(updated);
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    return true;
  });

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        className="shopee-header-cart"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Thông báo hệ thống"
        title="Thông báo"
        style={{ position: 'relative' }}
      >
        <div className="shopee-cart-icon-wrapper">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          {unreadCount > 0 && (
            <span
              className="shopee-cart-badge"
              style={{
                background: 'var(--primary-color, #ea580c)',
                color: '#ffffff',
                animation: 'pulse-glow 2s infinite',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: '-60px',
            width: '360px',
            maxWidth: '90vw',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-modal, 0 12px 32px rgba(0,0,0,0.18))',
            border: '1px solid var(--border-medium, #e2e8f0)',
            zIndex: 1000,
            overflow: 'hidden',
            animation: 'fade-in 0.2s ease-out',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border-light, #f1f5f9)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'var(--bg-muted, #f8fafc)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontWeight: 800, fontSize: '15px', color: 'var(--text-primary, #0f172a)' }}>
                🔔 Thông Báo Mới
              </span>
              {unreadCount > 0 && (
                <span
                  style={{
                    background: 'var(--primary-light, #fff7ed)',
                    color: 'var(--primary-color, #ea580c)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '10px',
                    border: '1px solid var(--primary-border, #fed7aa)',
                  }}
                >
                  {unreadCount} mới
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary-color, #ea580c)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                }}
              >
                Đã đọc tất cả
              </button>
            )}
          </div>

          {/* Filter Tabs */}
          <div
            style={{
              display: 'flex',
              padding: '8px 14px',
              gap: '8px',
              borderBottom: '1px solid var(--border-light, #f1f5f9)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              style={{
                background: activeTab === 'all' ? 'var(--primary-color, #ea580c)' : 'transparent',
                color: activeTab === 'all' ? '#ffffff' : 'var(--text-secondary, #475569)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Tất cả ({notifications.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('unread')}
              style={{
                background: activeTab === 'unread' ? 'var(--primary-color, #ea580c)' : 'transparent',
                color: activeTab === 'unread' ? '#ffffff' : 'var(--text-secondary, #475569)',
                border: 'none',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Chưa đọc ({unreadCount})
            </button>
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '13px' }}>
                🎉 Bạn không có thông báo nào chưa đọc!
              </div>
            ) : (
              filteredNotifs.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  style={{
                    padding: '12px 16px',
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'flex-start',
                    borderBottom: '1px solid var(--border-light, #f1f5f9)',
                    cursor: 'pointer',
                    background: item.isRead ? 'transparent' : 'var(--primary-light, rgba(234, 88, 12, 0.05))',
                    transition: 'background 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = item.isRead
                      ? 'transparent'
                      : 'var(--primary-light, rgba(234, 88, 12, 0.05))')
                  }
                >
                  <div
                    style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: item.type === 'order' ? '#e0f2fe' : item.type === 'voucher' ? '#fef3c7' : '#fee2e2',
                      color: item.type === 'order' ? '#0284c7' : item.type === 'voucher' ? '#d97706' : '#dc2626',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '18px',
                      flexShrink: 0,
                    }}
                  >
                    {item.icon}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '13px',
                        fontWeight: item.isRead ? 600 : 700,
                        color: 'var(--text-primary, #0f172a)',
                        marginBottom: '3px',
                        lineHeight: 1.3,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: '12px',
                        color: 'var(--text-secondary, #475569)',
                        lineHeight: 1.4,
                        marginBottom: '4px',
                      }}
                    >
                      {item.message}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>{item.time}</div>
                  </div>

                  {!item.isRead && (
                    <span
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: 'var(--primary-color, #ea580c)',
                        flexShrink: 0,
                        marginTop: '4px',
                      }}
                    />
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              padding: '10px 16px',
              textAlign: 'center',
              borderTop: '1px solid var(--border-light, #f1f5f9)',
              background: 'var(--bg-muted, #f8fafc)',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate('/orders');
              }}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--primary-color, #ea580c)',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Xem tiến trình tất cả đơn hàng →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
