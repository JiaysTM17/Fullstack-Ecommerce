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
  CloseIcon,
  ChevronRightIcon,
  UserIcon,
  MapPinIcon,
  CreditCardIcon,
  LockIcon,
  TicketIcon,
  CoinIcon,
  HeartIcon,
  PencilIcon,
  ShieldIcon,
} from './OrdersIcons';

/**
 * AccountSidebar
 * Master-Grade E-Commerce Sticky Navigation & Status Filter Sidebar
 * Rebuilt from scratch: Zero emojis, 100% precision SVG vector icons,
 * perfect vertical/horizontal alignment, and harmonized neutral aesthetic.
 */
export default function AccountSidebar({
  activeSection = 'orders', // 'orders' | 'tracking' | 'profile' | 'addresses' | 'payments' | 'security' | 'vouchers' | 'coins' | 'wishlist'
  orderCounts = { all: 0, pending: 0, shipping: 0, completed: 0, returning: 0, cancelled: 0 },
  activeStatusTab = 'all',
  onSelectStatusTab,
  onSelectTrackingView,
  isTrackingView = false,
}) {
  const { user } = useAuth();
  const { coins } = useCoin();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const displayName = user?.name || user?.fullName || (user?.email ? user.email.split('@')[0] : 'Khách Hàng');
  const initialLetter = displayName.charAt(0).toUpperCase();
  const avatarUrl = user?.avatar;

  const STATUS_ITEMS = [
    { id: 'all', label: 'Tất cả đơn', count: orderCounts.all, icon: <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><PackageIcon size={12} color="#2563eb" /></span> },
    { id: 'pending', label: 'Chờ xác nhận', count: orderCounts.pending, icon: <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#fef3c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><ClockIcon size={12} color="#d97706" /></span> },
    { id: 'shipping', label: 'Đang vận chuyển', count: orderCounts.shipping, icon: <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#d1fae5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><TruckIcon size={12} color="#059669" /></span> },
    { id: 'completed', label: 'Hoàn thành', count: orderCounts.completed, icon: <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CheckIcon size={12} color="#16a34a" /></span> },
    { id: 'returning', label: 'Đổi trả / Hoàn tiền', count: orderCounts.returning, icon: <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#f3e8ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><ReturnIcon size={12} color="#9333ea" /></span> },
    { id: 'cancelled', label: 'Đã hủy', count: orderCounts.cancelled, icon: <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}><CloseIcon size={12} color="#ef4444" /></span> },
  ];

  return (
    <aside className="shopee-account-sidebar-container" aria-label="Thanh điều hướng tài khoản">
      {/* 1. User Profile Header */}
      <div className="account-sidebar-profile-card">
        <div className="account-sidebar-avatar-wrapper">
          {avatarUrl ? (
            <img src={avatarUrl} alt={displayName} className="account-sidebar-avatar-img" />
          ) : (
            <div className="account-sidebar-avatar-fallback">{initialLetter}</div>
          )}
          <span className="account-sidebar-online-dot" title="Tài khoản trực tuyến" />
        </div>

        <div className="account-sidebar-user-info">
          <strong className="account-sidebar-user-name" title={displayName}>
            {displayName}
          </strong>
          <span className="account-sidebar-role-badge">
            {user?.role === 'admin'
              ? 'Super Admin'
              : user?.role === 'seller'
              ? 'Chủ Gian Hàng'
              : 'Thành Viên Thân Thiết'}
          </span>
          <Link to="/profile?tab=profile" className="account-sidebar-edit-link">
            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <PencilIcon size={10} color="#2563eb" />
            </span>
            <span>Sửa hồ sơ</span>
          </Link>
        </div>
      </div>

      {/* 2. Primary Navigation Tree */}
      <nav className="account-sidebar-nav" aria-label="Điều hướng chính">
        {/* GROUP 1: ĐƠN HÀNG & VẬN CHUYỂN */}
        <div className="account-sidebar-group">
          <div className="account-sidebar-group-title">
            <span>ĐƠN HÀNG & VẬN CHUYỂN</span>
          </div>

          <div className="account-sidebar-group-content">
            {/* Main Orders Navigation Button */}
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
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell" style={{ background: '#e0f2fe', borderColor: '#bae6fd' }}><PackageIcon size={15} color="#0284c7" /></span>
                <span className="sidebar-menu-label">Lịch sử đơn mua</span>
              </div>
              {orderCounts.all > 0 && (
                <span className="account-sidebar-badge-count">{orderCounts.all}</span>
              )}
            </button>

            {/* Quick Status Sub-Filter Tree */}
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
                      <div className="sidebar-subitem-left">
                        <span className="subitem-icon-cell">{item.icon}</span>
                        <span className="subitem-label">{item.label}</span>
                      </div>
                      {item.count > 0 && (
                        <span className={`subitem-count-badge ${isActive ? 'active' : ''}`}>
                          {item.count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* SPX Express Tracking Button */}
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
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell" style={{ background: '#d1fae5', borderColor: '#a7f3d0' }}><TruckIcon size={15} color="#059669" /></span>
                <span className="sidebar-menu-label">Tra cứu vận đơn SPX</span>
              </div>
              <span className="account-sidebar-badge-spx">Trực tiếp</span>
            </button>
          </div>
        </div>

        {/* GROUP 2: TÀI KHOẢN CỦA TÔI */}
        <div className="account-sidebar-group">
          <div className="account-sidebar-group-title">
            <span>TÀI KHOẢN CỦA TÔI</span>
          </div>

          <div className="account-sidebar-group-content">
            <Link
              to="/profile?tab=profile"
              className={`account-sidebar-link ${activeSection === 'profile' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell" style={{ background: '#ede9fe', borderColor: '#ddd6fe' }}><UserIcon size={15} color="#7c3aed" /></span>
                <span className="sidebar-menu-label">Hồ sơ cá nhân</span>
              </div>
            </Link>

            <Link
              to="/profile?tab=addresses"
              className={`account-sidebar-link ${activeSection === 'addresses' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell" style={{ background: '#ffedd5', borderColor: '#fed7aa' }}><MapPinIcon size={15} color="#ea580c" /></span>
                <span className="sidebar-menu-label">Sổ địa chỉ nhận hàng</span>
              </div>
            </Link>

            <Link
              to="/profile?tab=payments"
              className={`account-sidebar-link ${activeSection === 'payments' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell" style={{ background: '#ccfbf1', borderColor: '#99f6e4' }}><CreditCardIcon size={15} color="#0d9488" /></span>
                <span className="sidebar-menu-label">Ngân hàng & Thẻ liên kết</span>
              </div>
            </Link>

            <Link
              to="/profile?tab=security"
              className={`account-sidebar-link ${activeSection === 'security' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell" style={{ background: '#e0e7ff', borderColor: '#c7d2fe' }}><LockIcon size={15} color="#6366f1" /></span>
                <span className="sidebar-menu-label">Đổi mật khẩu & Bảo mật</span>
              </div>
            </Link>
          </div>
        </div>

        {/* GROUP 3: ƯU ĐÃI & ĐIỂM THƯỞNG */}
        <div className="account-sidebar-group">
          <div className="account-sidebar-group-title">
            <span>ƯU ĐÃI & ĐIỂM THƯỞNG</span>
          </div>

          <div className="account-sidebar-group-content">
            <Link
              to="/profile?tab=vouchers"
              className={`account-sidebar-link ${activeSection === 'vouchers' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell" style={{ background: '#ffedd5', borderColor: '#fed7aa' }}><TicketIcon size={15} color="#f97316" /></span>
                <span className="sidebar-menu-label">Kho Voucher Giảm Giá</span>
              </div>
            </Link>

            <Link
              to="/profile?tab=coins"
              className={`account-sidebar-link ${activeSection === 'coins' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell" style={{ background: '#fef3c7', borderColor: '#fde68a' }}><CoinIcon size={15} color="#d97706" /></span>
                <span className="sidebar-menu-label">Điểm Xu tích lũy</span>
              </div>
              <span className="account-sidebar-badge-coins">
                {(coins || 0).toLocaleString('vi-VN')} Xu
              </span>
            </Link>

            <Link
              to="/wishlist"
              className={`account-sidebar-link ${activeSection === 'wishlist' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell" style={{ background: '#fee2e2', borderColor: '#fecaca' }}><HeartIcon size={15} color="#ef4444" /></span>
                <span className="sidebar-menu-label">Sản phẩm Yêu thích</span>
              </div>
            </Link>
          </div>
        </div>

        {/* GROUP 4: KÊNH QUẢN TRỊ / KÊNH BÁN HÀNG */}
        {user?.role === 'seller' && (
          <div className="account-sidebar-group">
            <div className="account-sidebar-group-title">
              <span>KÊNH BÁN HÀNG</span>
            </div>
            <div className="account-sidebar-group-content">
              <Link to="/seller/dashboard" className="account-sidebar-link seller-portal-link">
                <div className="sidebar-btn-left">
                  <span className="sidebar-icon-cell" style={{ background: '#ffedd5', borderColor: '#fed7aa' }}><StoreIcon size={15} color="#ea580c" /></span>
                  <span className="sidebar-menu-label">Kênh Người Bán Hàng</span>
                </div>
                <span className="link-arrow" style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRightIcon size={11} color="#ea580c" />
                </span>
              </Link>
            </div>
          </div>
        )}

        {user?.role === 'admin' && (
          <div className="account-sidebar-group">
            <div className="account-sidebar-group-title admin-title">
              <span>QUẢN TRỊ VIÊN SÀN</span>
            </div>
            <div className="account-sidebar-group-content">
              <Link to="/admin/dashboard" className="account-sidebar-link admin-portal-link">
                <div className="sidebar-btn-left">
                  <span className="sidebar-icon-cell" style={{ background: '#fee2e2', borderColor: '#fecaca' }}><ShieldIcon size={15} color="#dc2626" /></span>
                  <span className="sidebar-menu-label">Bảng Quản Trị Toàn Sàn</span>
                </div>
                <span className="link-arrow" style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRightIcon size={11} color="#dc2626" />
                </span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
