import React, { useState, useRef, useEffect } from 'react';
import { useWishlist } from '../context/WishlistContext';
import '../styles/header.css';

const POPULAR_SEARCHES = [
  "Áo thun cotton",
  "Tai nghe Bluetooth ANC",
  "Quần jean nam",
  "Chuột công thái học",
  "Bàn phím cơ không dây",
  "Bình giữ nhiệt Lock&Lock",
  "Balo laptop chống nước",
  "Đồng hồ Smartwatch",
];

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
  subTitle = 'Mua Sắm Đa Kênh - Chuẩn Amazon'
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchWrapRef = useRef(null);
  const { wishlistCount } = useWishlist();

  const isControlled = typeof searchTerm === 'string';
  const currentSearch = isControlled ? searchTerm : localSearch;

  useEffect(() => {
    function handleClickOutside(event) {
      if (searchWrapRef.current && !searchWrapRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleInputChange = (e) => {
    const val = e.target.value;
    if (!isControlled) {
      setLocalSearch(val);
    }
    if (onSearchChange) {
      onSearchChange(val, e);
    }
    setShowSuggestions(true);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    setShowSuggestions(false);
    if (onSearchSubmit) {
      onSearchSubmit(currentSearch.trim(), e);
    }
  };

  const handleSelectSuggestion = (text) => {
    if (!isControlled) {
      setLocalSearch(text);
    }
    if (onSearchChange) {
      onSearchChange(text, null);
    }
    setShowSuggestions(false);
    if (onSearchSubmit) {
      onSearchSubmit(text, null);
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

  const filteredSuggestions = currentSearch
    ? POPULAR_SEARCHES.filter((s) =>
        s.toLowerCase().includes(currentSearch.toLowerCase())
      )
    : POPULAR_SEARCHES.slice(0, 5);

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
            <span className="shopee-topbar-link">Hotline: 1900 6868</span>
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

          {/* Search Form with Autocomplete */}
          <div ref={searchWrapRef} style={{ flex: 1, position: 'relative' }}>
            <form className="shopee-search-form" onSubmit={handleFormSubmit}>
              <input
                type="text"
                className="shopee-search-input"
                placeholder="Tìm kiếm hơn 100.000+ sản phẩm chính hãng, flash deals, thương hiệu..."
                value={currentSearch}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
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

            {/* Autocomplete Dropdown */}
            {showSuggestions && filteredSuggestions.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  borderRadius: '0 0 8px 8px',
                  boxShadow: '0 6px 16px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  border: '1px solid #e0e0e0',
                  marginTop: '2px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '8px 14px', fontSize: '11px', color: '#888', fontWeight: 700, textTransform: 'uppercase', background: '#fafafa', borderBottom: '1px solid #f0f0f0' }}>
                  🔍 Gợi ý tìm kiếm phổ biến
                </div>
                {filteredSuggestions.map((item, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectSuggestion(item)}
                    style={{
                      padding: '10px 14px',
                      fontSize: '13.5px',
                      color: '#222',
                      cursor: 'pointer',
                      borderBottom: idx < filteredSuggestions.length - 1 ? '1px solid #f5f5f5' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#fff5f2')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
                  >
                    <span style={{ color: '#ee4d2d' }}>•</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Header Action Buttons: Wishlist & Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Wishlist Icon */}
            <button
              type="button"
              className="shopee-header-cart"
              onClick={() => navTo('/wishlist')}
              aria-label={`Yêu thích, ${wishlistCount} sản phẩm`}
              title="Danh sách sản phẩm yêu thích"
            >
              <div className="shopee-cart-icon-wrapper">
                <svg width="24" height="24" viewBox="0 0 24 24" fill={wishlistCount > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {wishlistCount > 0 && (
                  <span className="shopee-cart-badge" style={{ background: '#ffb703', color: '#111' }}>
                    {wishlistCount > 99 ? '99+' : wishlistCount}
                  </span>
                )}
              </div>
            </button>

            {/* Cart Icon */}
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

        {/* Mega Subnav Bar */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '24px',
            padding: '10px 0 4px',
            borderTop: '1px solid rgba(255, 255, 255, 0.2)',
            fontSize: '13.5px',
            fontWeight: 600,
            color: '#fff',
            overflowX: 'auto',
          }}
        >
          <span
            onClick={() => navTo('/')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            ☰ Tất Cả Danh Mục
          </span>
          <span
            onClick={() => navTo('/?badge=Hot+Deal')}
            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', color: '#ffe082' }}
          >
            ⚡ Flash Deals
          </span>
          <span
            onClick={() => navTo('/?badge=Best+Seller')}
            style={{ cursor: 'pointer' }}
          >
            🏆 Bán Chạy Nhất
          </span>
          <span
            onClick={() => navTo('/?badge=Amazon%27s+Choice')}
            style={{ cursor: 'pointer' }}
          >
            ✨ Amazon's Choice
          </span>
          <span
            onClick={() => navTo('/?fastDelivery=1')}
            style={{ cursor: 'pointer' }}
          >
            🚀 Giao Siêu Tốc 2H
          </span>
          <span
            onClick={() => navTo('/seller/dashboard')}
            style={{ cursor: 'pointer', marginLeft: 'auto', color: '#fff9c4' }}
          >
            🏪 Đăng Bán Cùng Mini Shopee
          </span>
        </nav>
      </div>
    </header>
  );
};

export default Header;
