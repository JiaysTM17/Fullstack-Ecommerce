import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import {
  getNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} from '../services/notificationService';
import {
  BellIcon,
  PackageIcon,
  TicketIcon,
  BoltIcon,
  CheckIcon,
  SparklesIcon,
  TrashIcon,
  ChevronRightIcon,
} from './OrdersIcons';

const INITIAL_NOTIFICATIONS = [
  {
    id: 'notif_01',
    type: 'order',
    title: 'Đơn hàng SPX-VN-84729104 đang giao',
    message: 'Bưu tá SPX Express đang di chuyển giao hàng đến bạn. Dự kiến trước 18h hôm nay!',
    time: '15 phút trước',
    isRead: false,
    link: '/orders',
  },
  {
    id: 'notif_02',
    type: 'voucher',
    title: 'Quà tặng độc quyền: Voucher 50.000₫',
    message: 'Fullstack E-Commerce gửi tặng bạn mã WELCOME50 giảm 50.000₫ cho đơn từ 100k. Dùng ngay kẻo hết hạn!',
    time: '2 giờ trước',
    isRead: false,
    link: '/cart',
  },
  {
    id: 'notif_03',
    type: 'promo',
    title: 'Flash Sale Giờ Vàng đang bùng nổ',
    message: 'Giảm sốc tới 50% tai nghe chống ồn SoundPeak Pro & Bàn phím cơ RGB chỉ trong 2 giờ.',
    time: '5 giờ trước',
    isRead: false,
    link: '/?badge=Flash+Sale',
  },
  {
    id: 'notif_04',
    type: 'order',
    title: 'Giao hàng thành công: Đơn ORD827103',
    message: 'Kiện hàng từ TechWorld Store đã được ký nhận thành công. Hãy chia sẻ đánh giá 5 sao nhé!',
    time: '1 ngày trước',
    isRead: true,
    link: '/orders',
  },
];

const NOTIFS_STORAGE_KEY = 'mini_shopee_buyer_notifications';

export default function NotificationsPopover() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'unread'
  const popoverRef = useRef(null);

  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem(NOTIFS_STORAGE_KEY) || localStorage.getItem('mini_shopee_notifications');
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
      window.dispatchEvent(new CustomEvent('mini_shopee_notifications_updated', { detail: { list: newNotifs } }));
    } catch {
      // ignore
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const orderCount = notifications.filter((n) => n.type === 'order').length;
  const voucherCount = notifications.filter((n) => n.type === 'voucher' || n.type === 'promo').length;

  useEffect(() => {
    let ignore = false;
    async function fetchServerNotifications() {
      try {
        const data = await getNotifications(1, 30);
        if (!ignore && data?.notifications?.length > 0) {
          setNotifications(data.notifications);
        }
      } catch (err) {
        // use local
      }
    }
    fetchServerNotifications();

    const handleSync = () => {
      try {
        const saved = localStorage.getItem(NOTIFS_STORAGE_KEY) || localStorage.getItem('mini_shopee_notifications');
        if (saved) setNotifications(JSON.parse(saved));
      } catch {}
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('mini_shopee_new_notification', handleSync);
    window.addEventListener('mini_shopee_notifications_updated', handleSync);
    return () => {
      ignore = true;
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mini_shopee_new_notification', handleSync);
      window.removeEventListener('mini_shopee_notifications_updated', handleSync);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAllRead = async () => {
    const updated = notifications.map((n) => ({ ...n, isRead: true }));
    saveNotifications(updated);
    try {
      await markAllNotificationsAsRead();
    } catch {}
  };

  const handleClearRead = () => {
    const updated = notifications.filter((n) => !n.isRead);
    saveNotifications(updated);
  };

  const handleItemClick = async (notif) => {
    const updated = notifications.map((n) => ((n.id || n._id) === (notif.id || notif._id) ? { ...n, isRead: true } : n));
    saveNotifications(updated);
    try {
      await markNotificationAsRead(notif.id || notif._id);
    } catch {}
    setIsOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  };

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === 'unread') return !n.isRead;
    if (activeTab === 'order') return n.type === 'order';
    if (activeTab === 'voucher') return n.type === 'voucher' || n.type === 'promo';
    return true;
  });

  return (
    <div style={{ position: 'relative' }} ref={popoverRef}>
      {/* Bell Button */}
      <button
        type="button"
        className="shopee-header-action-btn"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label="Thông báo hệ thống"
        title="Thông báo"
        style={{ position: 'relative' }}
      >
        <BellIcon size={22} color="#f59e0b" />
        {unreadCount > 0 && (
          <span className="shopee-action-badge badge-indigo">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div
          className="anim-dropdown"
          style={{
            position: 'absolute',
            top: 'calc(100% + 12px)',
            right: '-60px',
            width: '360px',
            maxWidth: '90vw',
            background: 'var(--bg-card, #ffffff)',
            borderRadius: '12px',
            boxShadow: 'var(--shadow-modal, 0 16px 36px rgba(0,0,0,0.22))',
            border: '1px solid var(--border-medium, #e2e8f0)',
            zIndex: 1000,
            overflow: 'hidden',
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
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 800, fontSize: '15px', color: 'var(--text-primary, #0f172a)' }}>
                <BellIcon size={16} color="#ea580c" />
                <span>Thông Báo Mới</span>
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
              padding: '8px 12px',
              gap: '6px',
              overflowX: 'auto',
              borderBottom: '1px solid var(--border-light, #f1f5f9)',
              background: 'var(--bg-card, #ffffff)',
            }}
          >
            {[
              { id: 'all', label: `Tất cả (${notifications.length})`, icon: null },
              { id: 'order', label: `Đơn hàng (${orderCount})`, icon: <PackageIcon size={12} color={activeTab === 'order' ? '#ffffff' : '#0284c7'} /> },
              { id: 'voucher', label: `Ưu đãi (${voucherCount})`, icon: <TicketIcon size={12} color={activeTab === 'voucher' ? '#ffffff' : '#ea580c'} /> },
              { id: 'unread', label: `Chưa đọc (${unreadCount})`, icon: null },
            ].map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    background: active ? 'var(--primary-color, #ea580c)' : 'transparent',
                    color: active ? '#ffffff' : 'var(--text-secondary, #475569)',
                    border: 'none',
                    borderRadius: '20px',
                    padding: '4px 10px',
                    fontSize: '11.5px',
                    fontWeight: active ? 700 : 500,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Notifications List */}
          <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
            {filteredNotifs.length === 0 ? (
              <div style={{ padding: '32px 16px', textAlign: 'center', color: 'var(--text-muted, #94a3b8)', fontSize: '13px' }}>
                <span style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '8px', color: 'var(--primary-color, #ea580c)' }}>
                  <SparklesIcon size={24} color="#ea580c" />
                </span>
                <p style={{ margin: 0 }}>Bạn không có thông báo nào chưa đọc!</p>
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
                      fontSize: '16px',
                      flexShrink: 0,
                    }}
                  >
                    {item.type === 'order' ? (
                      <PackageIcon size={18} color="#0284c7" />
                    ) : item.type === 'voucher' ? (
                      <TicketIcon size={18} color="#d97706" />
                    ) : (
                      <BoltIcon size={18} color="#dc2626" />
                    )}
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
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
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
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <span>Xem tất cả đơn hàng</span>
                <ChevronRightIcon size={12} color="#ea580c" />
              </span>
            </button>

            {notifications.some((n) => n.isRead) && (
              <button
                type="button"
                onClick={handleClearRead}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted, #94a3b8)',
                  fontSize: '11.5px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                title="Xóa các thông báo đã đọc"
              >
                <TrashIcon size={12} color="#64748b" />
                <span>Dọn dẹp</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
