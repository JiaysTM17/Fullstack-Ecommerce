import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCoin } from '../context/CoinContext';
import { useLanguage } from '../context/LanguageContext';
import {
  PackageIcon,
  TruckIcon,
  StoreIcon,
  ClockIcon,
  CheckIcon,
  ReturnIcon,
  ReceiptIcon,
  PrinterIcon,
} from './OrdersIcons';

/**
 * AccountSidebar
 * Standard E-Commerce 2-Column Left Sticky Navigation & Filter Sidebar
 * Keeps user navigation, status filters, date range filters and account links
 * persistently anchored on the left during long scrolls.
 */
export default function AccountSidebar({
  activeSection = 'orders', // 'orders' | 'tracking' | 'profile' | 'addresses' | 'payments' | 'security' | 'vouchers' | 'coins' | 'wishlist'
  orderCounts = { all: 0, pending: 0, shipping: 0, completed: 0, returning: 0, cancelled: 0 },
  activeStatusTab = 'all',
  onSelectStatusTab,
  dateRange = 'all',
  onSelectDateRange,
  onExportCSV,
  onPrintReport,
  onSelectTrackingView,
  isTrackingView = false,
}) {
  const { user } = useAuth();
  const { coins } = useCoin();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const initialLetter = (user?.name || user?.fullName || user?.email || 'U').charAt(0).toUpperCase();
  const avatarUrl = user?.avatar;

  const STATUS_ITEMS = [
    { id: 'all', label: 'Tất cả đơn', count: orderCounts.all, icon: <PackageIcon size={14} /> },
    { id: 'pending', label: 'Chờ xác nhận', count: orderCounts.pending, icon: <ClockIcon size={14} /> },
    { id: 'shipping', label: 'Đang vận chuyển', count: orderCounts.shipping, icon: <TruckIcon size={14} /> },
    { id: 'completed', label: 'Hoàn thành', count: orderCounts.completed, icon: <CheckIcon size={14} /> },
    { id: 'returning', label: 'Đổi trả / Hoàn tiền', count: orderCounts.returning, icon: <ReturnIcon size={14} /> },
    { id: 'cancelled', label: 'Đã hủy', count: orderCounts.cancelled, icon: <span style={{ fontSize: '13px', lineHeight: 1 }}>✕</span> },
  ];

  const DATE_OPTIONS = [
    { id: 'all', label: 'Tất cả thời gian' },
    { id: '30days', label: '30 ngày gần đây' },
    { id: '3months', label: '3 tháng qua' },
    { id: 'year2026', label: 'Năm 2026' },
  ];

  return (
    <aside className="shopee-account-sidebar-container">
      {/* 1. Quick User Profile Header */}
      <div className="account-sidebar-profile-card">
        <div className="account-sidebar-avatar-wrapper">
          {avatarUrl ? (
            <img src={avatarUrl} alt="Avatar" className="account-sidebar-avatar-img" />
          ) : (
            <div className="account-sidebar-avatar-fallback">{initialLetter}</div>
          )}
          <span className="account-sidebar-online-dot" title="Tài khoản đang hoạt động" />
        </div>

        <div className="account-sidebar-user-info">
          <strong className="account-sidebar-user-name">
            {user?.name || user?.fullName || (user?.email ? user.email.split('@')[0] : 'Khách Hàng')}
          </strong>
          <span className="account-sidebar-role-badge">
            {user?.role === 'admin'
              ? '🛡️ Super Admin'
              : user?.role === 'seller'
              ? '🏪 Chủ Gian Hàng'
              : '✨ Thành Viên Thân Thiết'}
          </span>
          <Link to="/profile?tab=profile" className="account-sidebar-edit-link">
            <span>✏️ Sửa thông tin</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary Navigation Tree */}
      <nav className="account-sidebar-nav" aria-label="Điều hướng tài khoản">
        {/* SECTION: ĐƠN MUA */}
        <div className="account-sidebar-group">
          <div className="account-sidebar-group-title">
            <span style={{ color: '#2563eb' }}><PackageIcon size={16} /></span>
            <span>ĐƠN HÀNG CỦA TÔI</span>
          </div>

          <div className="account-sidebar-group-content">
            {/* Main Orders Navigation Item */}
            <button
              type="button"
              className={`account-sidebar-menu-btn ${activeSection === 'orders' && !isTrackingView ? 'active' : ''}`}
              onClick={() => {
                if (isTrackingView && onSelectTrackingView) {
                  onSelectTrackingView(false);
                }
                navigate('/orders');
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="sidebar-bullet-icon">📦</span>
                <span className="sidebar-menu-label">Lịch sử đơn mua</span>
              </div>
              {orderCounts.all > 0 && (
                <span className="account-sidebar-total-badge">{orderCounts.all}</span>
              )}
            </button>

            {/* Persistent Sticky Order Status Filter Pills (Expanded when in Orders view) */}
            {activeSection === 'orders' && !isTrackingView && (
              <div className="account-sidebar-status-sublist">
                {STATUS_ITEMS.map((item) => {
                  const isActive = activeStatusTab === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      className={`account-sidebar-subitem-btn ${isActive ? 'active' : ''}`}
                      onClick={() => onSelectStatusTab && onSelectStatusTab(item.id)}
                    >
                      <span className="subitem-icon">{item.icon}</span>
                      <span className="subitem-label">{item.label}</span>
                      {item.count > 0 && (
                        <span className={`subitem-count-badge ${isActive ? 'active' : ''}`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Quick Date Range Filter Inside Sticky Sidebar */}
                {onSelectDateRange && (
                  <div className="account-sidebar-date-filter-box">
                    <div className="date-filter-label">
                      <span>🕒</span> <span>Khoảng thời gian:</span>
                    </div>
                    <div className="date-filter-pills">
                      {DATE_OPTIONS.map((opt) => (
                        <button
                          key={opt.id}
                          type="button"
                          className={`date-pill-btn ${dateRange === opt.id ? 'active' : ''}`}
                          onClick={() => onSelectDateRange(opt.id)}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Export & Print Actions inside Sticky Sidebar */}
                {(onExportCSV || onPrintReport) && (
                  <div className="account-sidebar-quick-actions">
                    {onExportCSV && (
                      <button
                        type="button"
                        className="sidebar-quick-btn"
                        onClick={onExportCSV}
                        title="Xuất lịch sử đơn hàng dạng file CSV"
                      >
                        <ReceiptIcon size={12} /> Xuất CSV
                      </button>
                    )}
                    {onPrintReport && (
                      <button
                        type="button"
                        className="sidebar-quick-btn"
                        onClick={onPrintReport}
                        title="In bảng thống kê đơn hàng"
                      >
                        <PrinterIcon size={12} /> In Báo Cáo
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* SPX Express Tracking Dedicated Navigation Item */}
            <button
              type="button"
              className={`account-sidebar-menu-btn ${activeSection === 'tracking' || isTrackingView ? 'active' : ''}`}
              onClick={() => {
                if (onSelectTrackingView) {
                  onSelectTrackingView(true);
                } else {
                  navigate('/orders?view=tracking');
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="sidebar-bullet-icon">🚚</span>
                <span className="sidebar-menu-label">Tra cứu vận đơn SPX</span>
              </div>
              <span className="account-sidebar-live-tag">Trực tiếp</span>
            </button>
          </div>
        </div>

        {/* SECTION: TÀI KHOẢN CỦA TÔI */}
        <div className="account-sidebar-group">
          <div className="account-sidebar-group-title">
            <span style={{ color: '#2563eb' }}>👤</span>
            <span>TÀI KHOẢN CỦA TÔI</span>
          </div>

          <div className="account-sidebar-group-content">
            <Link
              to="/profile?tab=profile"
              className={`account-sidebar-link ${activeSection === 'profile' ? 'active' : ''}`}
            >
              <span className="sidebar-bullet-icon">📝</span>
              <span className="sidebar-menu-label">Hồ sơ cá nhân</span>
            </Link>

            <Link
              to="/profile?tab=addresses"
              className={`account-sidebar-link ${activeSection === 'addresses' ? 'active' : ''}`}
            >
              <span className="sidebar-bullet-icon">📍</span>
              <span className="sidebar-menu-label">Sổ địa chỉ nhận hàng</span>
            </Link>

            <Link
              to="/profile?tab=payments"
              className={`account-sidebar-link ${activeSection === 'payments' ? 'active' : ''}`}
            >
              <span className="sidebar-bullet-icon">💳</span>
              <span className="sidebar-menu-label">Ngân hàng & Thẻ liên kết</span>
            </Link>

            <Link
              to="/profile?tab=security"
              className={`account-sidebar-link ${activeSection === 'security' ? 'active' : ''}`}
            >
              <span className="sidebar-bullet-icon">🔒</span>
              <span className="sidebar-menu-label">Đổi mật khẩu & Bảo mật</span>
            </Link>
          </div>
        </div>

        {/* SECTION: ƯU ĐÃI & THƯỞNG */}
        <div className="account-sidebar-group">
          <div className="account-sidebar-group-title">
            <span style={{ color: '#2563eb' }}>🎁</span>
            <span>ƯU ĐÃI & ĐIỂM THƯỞNG</span>
          </div>

          <div className="account-sidebar-group-content">
            <Link
              to="/profile?tab=vouchers"
              className={`account-sidebar-link ${activeSection === 'vouchers' ? 'active' : ''}`}
            >
              <span className="sidebar-bullet-icon">🎟️</span>
              <span className="sidebar-menu-label">Kho Voucher Giảm Giá</span>
            </Link>

            <Link
              to="/profile?tab=coins"
              className={`account-sidebar-link ${activeSection === 'coins' ? 'active' : ''}`}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="sidebar-bullet-icon">🪙</span>
                <span className="sidebar-menu-label">Điểm Xu tích lũy</span>
              </div>
              <span className="account-sidebar-coins-pill">
                {(coins || 0).toLocaleString('vi-VN')} Xu
              </span>
            </Link>

            <Link
              to="/wishlist"
              className={`account-sidebar-link ${activeSection === 'wishlist' ? 'active' : ''}`}
            >
              <span className="sidebar-bullet-icon">❤️</span>
              <span className="sidebar-menu-label">Sản phẩm Yêu thích</span>
            </Link>
          </div>
        </div>

        {/* SECTION: KÊNH QUẢN TRỊ / KÊNH SHOP */}
        {user?.role === 'seller' && (
          <div className="account-sidebar-group">
            <div className="account-sidebar-group-title">
              <span style={{ color: '#2563eb' }}><StoreIcon size={14} /></span>
              <span>KÊNH BÁN HÀNG</span>
            </div>
            <div className="account-sidebar-group-content">
              <Link to="/seller/dashboard" className="account-sidebar-link seller-portal-link">
                <span className="sidebar-bullet-icon">🏪</span>
                <span className="sidebar-menu-label">Kênh Người Bán Hàng</span>
                <span className="link-arrow">→</span>
              </Link>
            </div>
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="account-sidebar-group">
            <div className="account-sidebar-group-title">
              <span style={{ color: '#dc2626' }}>⚡</span>
              <span style={{ color: '#dc2626' }}>QUẢN TRỊ VIÊN SÀN</span>
            </div>
            <div className="account-sidebar-group-content">
              <Link to="/admin/dashboard" className="account-sidebar-link admin-portal-link">
                <span className="sidebar-bullet-icon">🛡️</span>
                <span className="sidebar-menu-label">Bảng Quản Trị Toàn Sàn</span>
                <span className="link-arrow">→</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
