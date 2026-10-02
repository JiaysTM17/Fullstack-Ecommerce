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
} from './OrdersIcons';

// Vector SVG Icons for Pixel-Perfect Navigation (Zero Emojis)
function UserIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function MapPinIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  );
}

function CreditCardIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

function LockIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function TicketIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" />
      <line x1="9" y1="9" x2="9.01" y2="9" />
      <line x1="15" y1="15" x2="15.01" y2="15" />
    </svg>
  );
}

function CoinIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v10" />
      <path d="M15 9.5a2.5 2.5 0 0 0-5 0c0 3 5 2 5 5a2.5 2.5 0 0 1-5 0" />
    </svg>
  );
}

function HeartIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function PencilIcon({ size = 12, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

function ShieldIcon({ size = 16, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

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
    { id: 'all', label: 'Tất cả đơn', count: orderCounts.all, icon: <PackageIcon size={14} /> },
    { id: 'pending', label: 'Chờ xác nhận', count: orderCounts.pending, icon: <ClockIcon size={14} /> },
    { id: 'shipping', label: 'Đang vận chuyển', count: orderCounts.shipping, icon: <TruckIcon size={14} /> },
    { id: 'completed', label: 'Hoàn thành', count: orderCounts.completed, icon: <CheckIcon size={14} /> },
    { id: 'returning', label: 'Đổi trả / Hoàn tiền', count: orderCounts.returning, icon: <ReturnIcon size={14} /> },
    { id: 'cancelled', label: 'Đã hủy', count: orderCounts.cancelled, icon: <CloseIcon size={14} /> },
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
            <PencilIcon size={11} />
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
                <span className="sidebar-icon-cell"><PackageIcon size={16} /></span>
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
                <span className="sidebar-icon-cell"><TruckIcon size={16} /></span>
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
                <span className="sidebar-icon-cell"><UserIcon size={16} /></span>
                <span className="sidebar-menu-label">Hồ sơ cá nhân</span>
              </div>
            </Link>

            <Link
              to="/profile?tab=addresses"
              className={`account-sidebar-link ${activeSection === 'addresses' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell"><MapPinIcon size={16} /></span>
                <span className="sidebar-menu-label">Sổ địa chỉ nhận hàng</span>
              </div>
            </Link>

            <Link
              to="/profile?tab=payments"
              className={`account-sidebar-link ${activeSection === 'payments' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell"><CreditCardIcon size={16} /></span>
                <span className="sidebar-menu-label">Ngân hàng & Thẻ liên kết</span>
              </div>
            </Link>

            <Link
              to="/profile?tab=security"
              className={`account-sidebar-link ${activeSection === 'security' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell"><LockIcon size={16} /></span>
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
                <span className="sidebar-icon-cell"><TicketIcon size={16} /></span>
                <span className="sidebar-menu-label">Kho Voucher Giảm Giá</span>
              </div>
            </Link>

            <Link
              to="/profile?tab=coins"
              className={`account-sidebar-link ${activeSection === 'coins' ? 'active' : ''}`}
            >
              <div className="sidebar-btn-left">
                <span className="sidebar-icon-cell"><CoinIcon size={16} /></span>
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
                <span className="sidebar-icon-cell"><HeartIcon size={16} /></span>
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
                  <span className="sidebar-icon-cell"><StoreIcon size={16} /></span>
                  <span className="sidebar-menu-label">Kênh Người Bán Hàng</span>
                </div>
                <span className="link-arrow">→</span>
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
                  <span className="sidebar-icon-cell"><ShieldIcon size={16} /></span>
                  <span className="sidebar-menu-label">Bảng Quản Trị Toàn Sàn</span>
                </div>
                <span className="link-arrow">→</span>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
}
