import React, { useState, useRef, useEffect } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FALLBACK_PRODUCTS } from '../services/productService';
import { formatCurrency } from '../utils/formatCurrency';
import CategoryMegaMenuDrawer from './CategoryMegaMenuDrawer';
import NotificationsPopover from './NotificationsPopover';
import RewardsHubModal from './RewardsHubModal';
import { useCoins } from '../context/CoinContext';
import '../styles/header.css';

const RECENT_SEARCHES_KEY = 'mini_shopee_recent_searches';
const DEFAULT_RECENTS = ['Tai nghe ANC', 'Áo thun cotton', 'Bàn phím cơ RGB', 'Bình giữ nhiệt'];

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
  logoText = 'Fullstack E-Commerce',
  subTitle = 'Smart Marketplace'
}) => {
  const [localSearch, setLocalSearch] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showCategoryDrawer, setShowCategoryDrawer] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const searchWrapRef = useRef(null);
  const { wishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { coins } = useCoins();

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return DEFAULT_RECENTS;
  });

  const addRecentSearch = (text) => {
    if (!text || !text.trim()) return;
    const term = text.trim();
    setRecentSearches((prev) => {
      const updated = [term, ...prev.filter((item) => item.toLowerCase() !== term.toLowerCase())].slice(0, 6);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const clearRecentSearches = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch {}
  };

  const removeRecentSearch = (e, term) => {
    e.stopPropagation();
    setRecentSearches((prev) => {
      const updated = prev.filter((item) => item !== term);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

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
    if (currentSearch.trim()) {
      addRecentSearch(currentSearch.trim());
    }
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
    addRecentSearch(text);
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

  const matchingProducts = currentSearch.trim()
    ? FALLBACK_PRODUCTS.filter((p) =>
        p.name.toLowerCase().includes(currentSearch.toLowerCase())
      ).slice(0, 3)
    : [];

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
              🏪 {t('nav_seller_channel', 'Kênh Người Bán')}
            </span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span
              className="shopee-topbar-link"
              onClick={() => navTo('/admin/dashboard')}
              style={{ cursor: 'pointer', fontWeight: 600 }}
            >
              🛡️ {t('nav_admin_portal', 'Quản Trị Sàn')}
            </span>
            <span style={{ opacity: 0.3 }}>|</span>
            <span className="shopee-topbar-link" style={{ opacity: 0.9 }}>
              📞 Hotline: 1900 6868
            </span>
          </div>

          <div className="shopee-topbar-right">
            {/* Language Switcher */}
            <button
              type="button"
              className="header-toggle-btn"
              onClick={toggleLanguage}
              title={language === 'vi' ? 'Switch to English' : 'Chuyển sang Tiếng Việt'}
            >
              {language === 'vi' ? '🇻🇳 VI' : '🇺🇸 EN'}
            </button>

            {/* Dark / Light Theme Toggle */}
            <button
              type="button"
              className="header-toggle-btn"
              onClick={toggleTheme}
              title={theme === 'dark' ? 'Chế độ Sáng' : 'Chế độ Tối'}
            >
              {theme === 'dark' ? '🌙 Tối' : '☀️ Sáng'}
            </button>

            {/* Xu Rewards Trigger */}
            <button
              type="button"
              onClick={() => setShowRewardsModal(true)}
              title="Điểm Thưởng & Săn Xu Hàng Ngày"
              style={{
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '12px',
                border: 'none',
                padding: '3px 10px',
                borderRadius: '999px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 8px rgba(245, 158, 11, 0.4)',
                transition: 'transform 0.15s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <span>🪙</span>
              <span>{(coins || 0).toLocaleString('vi-VN')} Xu</span>
            </button>

            <span style={{ opacity: 0.3 }}>|</span>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  className="shopee-topbar-link"
                  onClick={() => navTo('/orders')}
                  style={{ cursor: 'pointer', fontWeight: 500 }}
                >
                  📦 {t('nav_orders', 'Đơn Mua')}
                </span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span
                  className="shopee-topbar-link"
                  onClick={() => navTo('/profile')}
                  style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  👤 <strong>{user.fullName || user.email}</strong>
                  <small style={{ background: 'rgba(255,255,255,0.25)', padding: '1px 6px', borderRadius: '10px', fontSize: '10px' }}>
                    {user.role}
                  </small>
                </span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span
                  className="shopee-topbar-link"
                  onClick={onLogout}
                  style={{ cursor: 'pointer', color: '#fecaca', fontWeight: 600 }}
                >
                  🚪 {t('logout', 'Đăng xuất')}
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span
                  className="shopee-topbar-link"
                  onClick={() => navTo('/register')}
                  style={{ cursor: 'pointer', fontWeight: 500 }}
                >
                  {t('register', 'Đăng Ký')}
                </span>
                <span style={{ opacity: 0.3 }}>|</span>
                <span
                  className="shopee-topbar-link"
                  onClick={() => navTo('/login')}
                  style={{ cursor: 'pointer', fontWeight: 700 }}
                >
                  🔑 {t('login', 'Đăng Nhập')}
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
                placeholder={t('search_placeholder')}
                value={currentSearch}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
              />
              {currentSearch && (
                <button
                  type="button"
                  className="shopee-search-clear"
                  onClick={handleClearSearch}
                  aria-label={t('clear_search', 'Xóa từ khóa')}
                >
                  ✕
                </button>
              )}
              <button type="submit" className="shopee-search-btn" aria-label={t('search', 'Tìm kiếm')}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </button>
            </form>

            {/* Autocomplete Dropdown */}
            {showSuggestions && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-card, #fff)',
                  borderRadius: '0 0 12px 12px',
                  boxShadow: 'var(--shadow-modal, 0 10px 25px rgba(0,0,0,0.18))',
                  zIndex: 100,
                  border: '1px solid var(--border-medium, #e2e8f0)',
                  marginTop: '2px',
                  overflow: 'hidden',
                }}
              >
                {!currentSearch.trim() ? (
                  <div>
                    {/* Recent Searches */}
                    {recentSearches.length > 0 && (
                      <div>
                        <div
                          style={{
                            padding: '8px 14px',
                            fontSize: '11px',
                            color: 'var(--text-muted, #888)',
                            fontWeight: 700,
                            textTransform: 'uppercase',
                            background: 'var(--bg-muted, #fafafa)',
                            borderBottom: '1px solid var(--border-light, #f0f0f0)',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <span>🕒 Lịch Sử Tìm Kiếm Gần Đây</span>
                          <span
                            onClick={clearRecentSearches}
                            style={{ cursor: 'pointer', textTransform: 'none', color: 'var(--primary-color, #ea580c)', fontWeight: 600 }}
                          >
                            Xóa lịch sử
                          </span>
                        </div>
                        {recentSearches.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(item)}
                            style={{
                              padding: '8px 14px',
                              fontSize: '13px',
                              color: 'var(--text-primary, #222)',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-light, #f5f5f5)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ color: 'var(--text-muted)' }}>🕒</span>
                              <span>{item}</span>
                            </div>
                            <span
                              onClick={(e) => removeRecentSearch(e, item)}
                              style={{ color: 'var(--text-muted)', fontSize: '12px', padding: '2px 6px', cursor: 'pointer' }}
                              title="Xóa mục này"
                            >
                              ✕
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Popular Searches */}
                    <div>
                      <div style={{ padding: '8px 14px', fontSize: '11px', color: 'var(--text-muted, #888)', fontWeight: 700, textTransform: 'uppercase', background: 'var(--bg-muted, #fafafa)', borderTop: recentSearches.length > 0 ? '1px solid var(--border-light, #f0f0f0)' : 'none', borderBottom: '1px solid var(--border-light, #f0f0f0)' }}>
                        🔥 {t('suggested_searches', 'Gợi Ý Tìm Kiếm Phổ Biến')}
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', padding: '10px 14px' }}>
                        {POPULAR_SEARCHES.slice(0, 6).map((item, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectSuggestion(item)}
                            style={{
                              background: 'var(--bg-muted, #f1f5f9)',
                              border: '1px solid var(--border-medium, #e2e8f0)',
                              borderRadius: '20px',
                              padding: '4px 12px',
                              fontSize: '12px',
                              color: 'var(--text-secondary, #475569)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <span>🔍</span>
                            <span>{item}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    {/* Search Keywords */}
                    {filteredSuggestions.length > 0 && (
                      <div>
                        <div style={{ padding: '8px 14px', fontSize: '11px', color: 'var(--text-muted, #888)', fontWeight: 700, textTransform: 'uppercase', background: 'var(--bg-muted, #fafafa)', borderBottom: '1px solid var(--border-light, #f0f0f0)' }}>
                          {t('suggested_searches')}
                        </div>
                        {filteredSuggestions.map((item, idx) => (
                          <div
                            key={idx}
                            onClick={() => handleSelectSuggestion(item)}
                            style={{
                              padding: '9px 14px',
                              fontSize: '13px',
                              color: 'var(--text-primary, #222)',
                              cursor: 'pointer',
                              borderBottom: '1px solid var(--border-light, #f5f5f5)',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                          >
                            <span style={{ color: 'var(--primary-color, #ea580c)' }}>🔍</span>
                            <span>{item}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Matching Products with Thumbnail & Price */}
                    {matchingProducts.length > 0 && (
                      <div>
                        <div style={{ padding: '8px 14px', fontSize: '11px', color: 'var(--text-muted, #888)', fontWeight: 700, textTransform: 'uppercase', background: 'var(--bg-muted, #fafafa)', borderTop: '1px solid var(--border-light, #f0f0f0)', borderBottom: '1px solid var(--border-light, #f0f0f0)' }}>
                          ✨ Sản Phẩm Trùng Khớp
                        </div>
                        {matchingProducts.map((p) => {
                          const id = p._id || p.id;
                          return (
                            <div
                              key={id}
                              onClick={() => {
                                setShowSuggestions(false);
                                navTo(`/products/${id}`);
                              }}
                              style={{
                                padding: '8px 14px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                cursor: 'pointer',
                                borderBottom: '1px solid var(--border-light, #f5f5f5)',
                                transition: 'background 0.15s ease',
                              }}
                              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover, #f8fafc)')}
                              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                            >
                              <img
                                src={p.image || p.images?.[0]}
                                alt={p.name}
                                style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px', border: '1px solid var(--border-light, #eee)' }}
                              />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {p.name}
                                </div>
                                <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                                  {p.brand || 'Chính hãng'} · {p.category}
                                </div>
                              </div>
                              <div style={{ fontSize: '13px', fontWeight: 800, color: 'var(--primary-color, #ea580c)' }}>
                                {formatCurrency(p.price)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Header Action Buttons: Notifications, Wishlist & Cart */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {/* Notification Bell Dropdown */}
            <NotificationsPopover />

            {/* Wishlist Icon */}
            <button
              type="button"
              className="shopee-header-cart"
              onClick={() => navTo('/wishlist')}
              aria-label={`Yêu thích, ${wishlistCount} sản phẩm`}
              title={t('wishlist_title')}
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
              title={t('cart')}
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

        {/* Mega Subnav Bar Redesign */}
        <nav className="shopee-subnav">
          <button
            type="button"
            className="shopee-subnav-cat-btn"
            onClick={() => setShowCategoryDrawer(true)}
            title="Mở danh mục ngành hàng"
          >
            <span>☰</span>
            <span>{t('nav_all_categories', 'Tất Cả Danh Mục')}</span>
            <span style={{ fontSize: '9px', opacity: 0.8 }}>▼</span>
          </button>

          <span
            className="shopee-subnav-link highlight"
            onClick={() => navTo('/?badge=Hot+Deal')}
            title="Săn deal chớp nhoáng"
          >
            🔥 {t('nav_flash_deals', 'Flash Deals')}
          </span>

          <span
            className="shopee-subnav-link"
            onClick={() => navTo('/?badge=Best+Seller')}
          >
            ⭐ {t('nav_best_sellers', 'Bán Chạy Nhất')}
          </span>

          <span
            className="shopee-subnav-link"
            onClick={() => navTo('/?badge=Amazon%27s+Choice')}
          >
            ✨ {t('nav_featured_picks', 'Hàng Tuyển Chọn')}
          </span>

          <span
            className="shopee-subnav-link"
            onClick={() => navTo('/?fastDelivery=1')}
          >
            ⚡ {t('nav_fast_delivery', 'Giao 2H Siêu Tốc')}
          </span>

          <span
            className="shopee-subnav-link badge-pill"
            onClick={() => setShowRewardsModal(true)}
            title="Vào Rewards Hub nhận xu & quay thưởng"
          >
            🎁 {t('nav_rewards_hub', 'Săn Xu & Voucher')}
          </span>

          <span
            className="shopee-subnav-seller-btn"
            onClick={() => navTo('/seller/dashboard')}
            title="Đến kênh nhà bán hàng"
          >
            🚀 {t('nav_become_seller', 'Kênh Gian Hàng')}
          </span>
        </nav>
      </div>

      {/* Category Mega Menu Drawer */}
      <CategoryMegaMenuDrawer
        isOpen={showCategoryDrawer}
        onClose={() => setShowCategoryDrawer(false)}
      />

      {/* Rewards Hub Modal */}
      {showRewardsModal && (
        <RewardsHubModal onClose={() => setShowRewardsModal(false)} />
      )}
    </header>
  );
};

export default Header;
