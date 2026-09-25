import React, { useState } from 'react';
import '../styles/header.css';

/**
 * Header Component - Mini Shopee
 */
const Header = ({
  cartCount = 0,
  searchTerm,
  onSearchChange,
  onSearchSubmit,
  onCartClick,
  onLogoClick,
  user,
  onLogout,
  onNavigate,
  logoText = 'Mini Shopee',
  subTitle = 'Giá tốt mỗi ngày'
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const isControlled = typeof searchTerm === 'string';
  const currentSearch = isControlled ? searchTerm : localSearch;

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (!isControlled) {
      setLocalSearch(val);
    }
    if (onSearchChange) {
      onSearchChange(val, e);
    }
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSearchSubmit) {
      onSearchSubmit(currentSearch.trim(), e);
    }
  };

  const handleClearSearch = () => {
    if (!isControlled) {
      setLocalSearch('');
    }
    if (onSearchChange) {
      onSearchChange('', null);
    }
  };

  const navTo = (path) => {
    if (onNavigate) onNavigate(path);
  };

  return (
    <header className="shopee-header-wrapper">
      <div className="shopee-container">
        {/* Top Mini Bar */}
        <div className="shopee-topbar">
          <div className="shopee-topbar-left">
            <span
              className="shopee-topbar-link"
              onClick={() => navTo('/seller/dashboard')}
              style={{ cursor: 'pointer', fontWeight: 600 }}
            >
              🏪 Kênh Người Bán (Shop)
            </span>
            <span>|</span>
            <span
              className="shopee-topbar-link"
              onClick={() => navTo('/admin/dashboard')}
              style={{ cursor: 'pointer', fontWeight: 600 }}
            >
              🛡️ Quản Trị Sàn (Admin)
            </span>
            <span>|</span>
            <span className="shopee-topbar-link">Tải ứng dụng</span>
          </div>

          <div className="shopee-topbar-right">
            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  className="shopee-topbar-link"
                  onClick={() => navTo('/orders')}
                  style={{ cursor: 'pointer' }}
                >
                  📦 Đơn Mua
                </span>
                <span>|</span>
                <span
                  className="shopee-topbar-link"
                  onClick={() => navTo('/profile')}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  👤 <strong>{user.fullName || user.email}</strong>
                  <small style={{ background: 'rgba(255,255,255,0.25)', padding: '1px 6px', borderRadius: '10px' }}>
                    {user.role}
                  </small>
                </span>
                <span>|</span>
                <span
                  className="shopee-topbar-link"
                  onClick={onLogout}
                  style={{ cursor: 'pointer', color: '#ffebee' }}
                >
                  Đăng xuất
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  className="shopee-topbar-link"
                  onClick={() => navTo('/register')}
                  style={{ cursor: 'pointer', fontWeight: 500 }}
                >
                  Đăng Ký
                </span>
                <span>|</span>
                <span
                  className="shopee-topbar-link"
                  onClick={() => navTo('/login')}
                  style={{ cursor: 'pointer', fontWeight: 600 }}
                >
                  Đăng Nhập
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Main Header Row */}
        <div className="shopee-main-header">
          {/* Logo */}
          <div
            className="shopee-header-logo"
            onClick={onLogoClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onLogoClick && onLogoClick(e)}
          >
            <svg className="shopee-logo-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z" />
              <circle cx="12" cy="14" r="2" />
            </svg>
            <div>
              <div className="shopee-logo-title">{logoText}</div>
              <div className="shopee-logo-subtitle">{subTitle}</div>
            </div>
          </div>

          {/* Search Form */}
          <form className="shopee-search-form" onSubmit={handleFormSubmit}>
            <input
              type="text"
              className="shopee-search-input"
              placeholder="Shopee bao ship 0Đ - Hàng ngàn mặt hàng từ nhiều Shop!"
              value={currentSearch}
              onChange={handleInputChange}
            />
            {currentSearch && (
              <button
                type="button"
                className="shopee-search-clear"
                onClick={handleClearSearch}
                aria-label="Xóa từ khóa"
              >
                ✕
              </button>
            )}
            <button type="submit" className="shopee-search-btn" aria-label="Tìm kiếm">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
          </form>

          {/* Cart Icon & Badge */}
          <button
            type="button"
            className="shopee-header-cart"
            onClick={onCartClick}
            aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
          >
            <div className="shopee-cart-icon-wrapper">
              <svg className="shopee-cart-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
              </svg>
              <span className="shopee-cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
            </div>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
