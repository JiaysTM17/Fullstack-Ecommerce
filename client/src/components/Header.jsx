import React, { useState, useRef, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { FALLBACK_PRODUCTS } from '../services/productService';
import { formatCurrency } from '../utils/formatCurrency';
import CategoryMegaMenuDrawer from './CategoryMegaMenuDrawer';
import NotificationsPopover from './NotificationsPopover';
import RewardsHubModal from './RewardsHubModal';
import { useCoins } from '../context/CoinContext';
import { useAuthModal } from '../context/AuthModalContext';
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

const QUICK_CATEGORY_CHIPS = [
  { label: 'Điện Thoại', icon: '📱', query: 'Điện tử' },
  { label: 'Thời Trang', icon: '👕', query: 'Thời trang' },
  { label: 'Gia Dụng', icon: '🏠', query: 'Gia dụng' },
  { label: 'Làm Đẹp', icon: '💄', query: 'Làm đẹp' },
  { label: 'Phụ Kiện', icon: '🎧', query: 'Tai nghe' },
];

const TICKER_ITEMS = [
  {
    id: 1,
    icon: '🚚',
    badge: 'FREESHIP XTRA',
    text: 'Miễn phí giao hàng toàn quốc đơn từ 0Đ hôm nay!',
    actionText: 'Nhận Ngay',
    type: 'link',
    target: '/?fastDelivery=1'
  },
  {
    id: 2,
    icon: '⚡',
    badge: 'FLASH SALE',
    text: 'Khung giờ vàng 12:00 & 20:00 giảm sốc đến 50%',
    actionText: 'Săn Deal',
    type: 'link',
    target: '/?badge=Hot+Deal'
  },
  {
    id: 3,
    icon: '🪙',
    badge: 'ĐIỂM DANH',
    text: 'Điểm danh nhận 5.000 Xu tích lũy mua sắm mỗi ngày',
    actionText: 'Vào Ví Xu',
    type: 'rewards'
  },
  {
    id: 4,
    icon: '🛡️',
    badge: 'CAM KẾT 100%',
    text: 'Hàng chính hãng bảo đảm - Đổi trả miễn phí 15 ngày',
    actionText: 'Chi Tiết',
    type: 'link',
    target: '/'
  }
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
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showCartPreview, setShowCartPreview] = useState(false);
  const [showOrderLookupModal, setShowOrderLookupModal] = useState(false);
  const [orderQuery, setOrderQuery] = useState('');
  const [orderLookupResult, setOrderLookupResult] = useState(null);
  const [orderLookupLoading, setOrderLookupLoading] = useState(false);
  const [orderLookupError, setOrderLookupError] = useState('');
  const [tickerIndex, setTickerIndex] = useState(0);

  const searchWrapRef = useRef(null);
  const searchInputRef = useRef(null);
  const userMenuRef = useRef(null);
  const cartWrapRef = useRef(null);
  const cartPreviewTimerRef = useRef(null);

  const { wishlistCount } = useWishlist();
  const { theme, toggleTheme } = useTheme();
  const { language, toggleLanguage, t } = useLanguage();
  const { coins } = useCoins();
  const { openAuthModal } = useAuthModal() || {};

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
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserDropdown(false);
      }
      if (cartWrapRef.current && !cartWrapRef.current.contains(event.target)) {
        setShowCartPreview(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Safely consume useCart
  let cartData = { items: [], subtotal: 0, removeFromCart: () => {} };
  try {
    const c = useCart();
    if (c) cartData = c;
  } catch {
    // If rendered outside CartProvider
  }
  const { items: cartItems = [], subtotal: cartSubtotal = 0, removeFromCart } = cartData;

  // Auto-rotating Promo Ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % TICKER_ITEMS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, []);

  // Global Keyboard Shortcuts (/ and Ctrl+K to search, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      const isInputActive = activeTag === 'INPUT' || activeTag === 'TEXTAREA';

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSuggestions(true);
      } else if (e.key === '/' && !isInputActive) {
        e.preventDefault();
        searchInputRef.current?.focus();
        setShowSuggestions(true);
      } else if (e.key === 'Escape') {
        setShowSuggestions(false);
        setShowCartPreview(false);
        setShowOrderLookupModal(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCartMouseEnter = () => {
    if (cartPreviewTimerRef.current) clearTimeout(cartPreviewTimerRef.current);
    setShowCartPreview(true);
  };

  const handleCartMouseLeave = () => {
    cartPreviewTimerRef.current = setTimeout(() => {
      setShowCartPreview(false);
    }, 280);
  };

  const handleLookupOrder = (codeToLookup) => {
    const code = (codeToLookup || orderQuery).trim();
    if (!code) {
      setOrderLookupError('Vui lòng nhập mã đơn hàng hoặc mã vận đơn');
      return;
    }
    setOrderLookupLoading(true);
    setOrderLookupError('');

    setTimeout(() => {
      // Check local storage for real orders if available
      let foundOrder = null;
      try {
        const raw = localStorage.getItem('orders') || localStorage.getItem('mini_shopee_orders');
        if (raw) {
          const list = JSON.parse(raw);
          if (Array.isArray(list)) {
            foundOrder = list.find(o => (o.id || o._id || o.orderId || '').toLowerCase() === code.toLowerCase());
          }
        }
      } catch {}

      if (foundOrder) {
        setOrderLookupResult({
          orderId: foundOrder.id || foundOrder._id || code,
          trackingNumber: 'SPX-VN-' + Math.floor(10000000 + Math.random() * 90000000),
          createdAt: foundOrder.createdAt ? new Date(foundOrder.createdAt).toLocaleDateString('vi-VN') : 'Gần đây',
          estimatedDelivery: 'Dự kiến: 1 - 2 ngày tới',
          status: foundOrder.status || 'Đang vận chuyển',
          statusLabel: 'Đang vận chuyển qua SPX Express',
          carrier: 'SPX Express Siêu Tốc',
          recipient: foundOrder.shippingAddress?.fullName || user?.fullName || 'Khách hàng',
          phone: foundOrder.shippingAddress?.phone || '0988 *** ***',
          steps: [
            { label: 'Đã xác nhận đơn hàng', time: 'Thành công', done: true },
            { label: 'Shop đang chuẩn bị kiện hàng', time: 'Đã hoàn tất', done: true },
            { label: 'SPX Express đang vận chuyển', time: 'Hiện tại', done: true, current: true },
            { label: 'Giao hàng thành công', time: 'Dự kiến sớm', done: false }
          ]
        });
      } else {
        // Fallback demo mock
        setOrderLookupResult({
          orderId: code.toUpperCase(),
          trackingNumber: 'SPX-VN-88492015',
          createdAt: 'Hôm nay lúc 09:15',
          estimatedDelivery: 'Hôm nay, trước 18:00',
          status: 'Đang phát hàng',
          statusLabel: 'Shipper đang trên đường giao đến bạn',
          carrier: 'SPX Express - Tài xế: Trần Tuấn Hưng (0934.***.789)',
          recipient: user?.fullName || 'Quý Khách Hàng',
          phone: '0988 *** 678',
          steps: [
            { label: 'Đơn hàng đã được xác nhận', time: '09:15', done: true },
            { label: 'Rời kho trung chuyển TP.HCM', time: '11:30', done: true },
            { label: 'Đang giao đến địa chỉ nhận', time: '14:45', done: true, current: true },
            { label: 'Giao hàng thành công', time: 'Dự kiến 18:00', done: false }
          ]
        });
      }
      setOrderLookupLoading(false);
    }, 350);
  };

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

  const handleGoHome = () => {
    handleClearSearch();
    navTo('/');
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
        {/* Top Mini Bar with Live Rotating Promo Ticker */}
        <div className="shopee-topbar">
          <div className="shopee-topbar-left">
            <span className="shopee-topbar-link" style={{ opacity: 0.9 }}>
              📱 {t('nav_download_app', 'Tải Ứng Dụng')}
            </span>
            <span className="shopee-topbar-divider" />
            <span className="shopee-topbar-link" style={{ opacity: 0.9 }}>
              📞 Hotline: 1900 6868
            </span>
            <span className="shopee-topbar-divider" />
            <button
              type="button"
              className="shopee-topbar-btn shopee-topbar-tracking-btn"
              onClick={() => setShowOrderLookupModal(true)}
              title="Tra cứu nhanh lộ trình đơn hàng & vận đơn SPX"
            >
              <span>📦</span>
              <span>{t('quick_tracking', 'Tra Cứu Đơn Hàng')}</span>
              <span className="topbar-pulse-dot" />
            </button>
            <span className="shopee-topbar-divider" />
            <span className="shopee-topbar-link" style={{ opacity: 0.9 }}>
              💬 {t('nav_support', 'CSKH 24/7')}
            </span>
          </div>

          {/* Smart Live Rotating Promotional Announcement Bar */}
          <div className="shopee-topbar-center">
            <div className="topbar-ticker-container" key={TICKER_ITEMS[tickerIndex].id}>
              <span className="ticker-badge">{TICKER_ITEMS[tickerIndex].badge}</span>
              <span className="ticker-icon">{TICKER_ITEMS[tickerIndex].icon}</span>
              <span className="ticker-text">{TICKER_ITEMS[tickerIndex].text}</span>
              {TICKER_ITEMS[tickerIndex].type === 'rewards' ? (
                <button
                  type="button"
                  className="ticker-action-btn"
                  onClick={() => setShowRewardsModal(true)}
                >
                  {TICKER_ITEMS[tickerIndex].actionText} →
                </button>
              ) : (
                <button
                  type="button"
                  className="ticker-action-btn"
                  onClick={() => navTo(TICKER_ITEMS[tickerIndex].target)}
                >
                  {TICKER_ITEMS[tickerIndex].actionText} →
                </button>
              )}
            </div>
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

            {/* Hiển thị Capsule theo từng vai trò: Admin / Seller / Customer */}
            {user?.role === 'admin' ? (
              <div
                className="header-admin-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'rgba(239, 68, 68, 0.12)',
                  color: '#dc2626',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                  fontSize: '11px',
                  fontWeight: 800,
                  letterSpacing: '0.4px',
                }}
              >
                <span>🛡️</span>
                <span>QUẢN TRỊ VIÊN SÀN</span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
              </div>
            ) : user?.role === 'seller' ? (
              <button
                type="button"
                className="header-seller-capsule"
                onClick={() => navTo('/seller/dashboard')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.15) 0%, rgba(208, 1, 27, 0.08) 100%)',
                  color: '#ea580c',
                  border: '1px solid rgba(234, 88, 12, 0.35)',
                  padding: '3px 12px',
                  borderRadius: '20px',
                  fontSize: '11.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
                title="Kênh Quản Trị Gian Hàng Của Bạn"
              >
                <span>🏪</span>
                <span>Kênh Người Bán</span>
                <span style={{ fontSize: '9.5px', background: '#dc2626', color: '#fff', padding: '1px 5px', borderRadius: '8px', fontWeight: 800 }}>MALL</span>
              </button>
            ) : (
              <button
                type="button"
                className="header-coin-capsule"
                onClick={() => setShowRewardsModal(true)}
                title="Điểm Thưởng & Săn Xu Hàng Ngày"
              >
                <span>🪙</span>
                <span>{(coins || 0).toLocaleString('vi-VN')} Xu</span>
                <span style={{ fontSize: '10px' }}>✨</span>
              </button>
            )}
          </div>
        </div>

        {/* Main Header Row */}
        <div className="shopee-main-header">
          {/* Logo with Modern Emblem */}
          <div
            className="shopee-header-logo"
            onClick={onLogoClick}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onLogoClick && onLogoClick(e)}
          >
            <div className="shopee-logo-icon-wrap">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <div className="shopee-logo-title-group">
              <div className="shopee-logo-title">
                Fullstack <span className="brand-gradient">E-Commerce</span>
              </div>
              <div className="shopee-logo-subtitle">SMART MARKETPLACE</div>
            </div>
          </div>

          {/* Search Form with Autocomplete */}
          <div ref={searchWrapRef} style={{ flex: 1, position: 'relative' }}>
            <form className="shopee-search-form" onSubmit={handleFormSubmit}>
              <input
                ref={searchInputRef}
                type="text"
                className="shopee-search-input"
                placeholder={t('search_placeholder')}
                value={currentSearch}
                onChange={handleInputChange}
                onFocus={() => setShowSuggestions(true)}
              />
              {!currentSearch && (
                <div
                  className="shopee-search-kbd-badge"
                  onClick={() => searchInputRef.current?.focus()}
                  title="Nhấn phím tắt / hoặc Ctrl + K để tìm kiếm"
                >
                  <kbd>Ctrl K</kbd>
                </div>
              )}
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
                className="anim-dropdown shopee-search-dropdown-menu"
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: 'var(--bg-card, #fff)',
                  borderRadius: '0 0 14px 14px',
                  boxShadow: 'var(--shadow-modal, 0 12px 30px rgba(0,0,0,0.2))',
                  zIndex: 100,
                  border: '1px solid var(--border-medium, #e2e8f0)',
                  marginTop: '2px',
                  overflow: 'hidden',
                }}
              >
                {/* Quick Category Discovery Chips */}
                <div className="search-quick-chips-wrapper">
                  <span className="search-quick-chips-label">⚡ Ngành hàng nổi bật:</span>
                  <div className="search-quick-chips-list">
                    {QUICK_CATEGORY_CHIPS.map((chip, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className="search-quick-chip-item"
                        onClick={() => handleSelectSuggestion(chip.query)}
                      >
                        <span>{chip.icon}</span>
                        <span>{chip.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

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

          {/* Header Action Dock: Notifications, Wishlist & Cart */}
          <div className="header-actions-dock">
            {/* Notification Bell Dropdown */}
            <NotificationsPopover />

            {/* Wishlist Icon */}
            <button
              type="button"
              className="shopee-header-action-btn"
              onClick={() => navTo('/wishlist')}
              aria-label={`Yêu thích, ${wishlistCount} sản phẩm`}
              title={t('wishlist_title')}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill={wishlistCount > 0 ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="shopee-action-badge badge-amber anim-badge-bounce">
                  {wishlistCount > 99 ? '99+' : wishlistCount}
                </span>
              )}
            </button>

            {/* Cart Icon with Interactive Mini Cart Hover Popover */}
            <div
              className="header-cart-wrapper"
              ref={cartWrapRef}
              onMouseEnter={handleCartMouseEnter}
              onMouseLeave={handleCartMouseLeave}
            >
              <button
                type="button"
                className="shopee-header-action-btn"
                onClick={onCartClick}
                aria-label={`Giỏ hàng, ${cartCount} sản phẩm`}
                title={t('cart')}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
                <span className="shopee-action-badge badge-indigo anim-badge-bounce">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              </button>

              {/* Mini Cart Hover Dropdown Popover */}
              {showCartPreview && (
                <div className="header-mini-cart-popover anim-dropdown">
                  <div className="mini-cart-header">
                    <div className="mini-cart-title">
                      <span>🛍️ Giỏ Hàng Của Bạn</span>
                      <span className="mini-cart-count-badge">{(cartItems.length || cartCount)} món</span>
                    </div>
                    <span className="mini-cart-tip">Xem nhanh các sản phẩm đã chọn</span>
                  </div>

                  {cartItems.length > 0 ? (
                    <>
                      <div className="mini-cart-items-list">
                        {cartItems.slice(-3).reverse().map((item, idx) => (
                          <div
                            key={item.productId || idx}
                            className="mini-cart-item-row"
                            onClick={() => {
                              setShowCartPreview(false);
                              if (item.productId) navTo(`/products/${item.productId}`);
                            }}
                          >
                            <img
                              src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&q=80'}
                              alt={item.name}
                              className="mini-cart-item-img"
                            />
                            <div className="mini-cart-item-details">
                              <div className="mini-cart-item-name">{item.name}</div>
                              {(item.selectedColor || item.selectedSize) && (
                                <div className="mini-cart-item-variant">
                                  {item.selectedColor ? `Màu: ${item.selectedColor}` : ''}
                                  {item.selectedColor && item.selectedSize ? ' · ' : ''}
                                  {item.selectedSize ? `Size: ${item.selectedSize}` : ''}
                                </div>
                              )}
                              <div className="mini-cart-item-price-qty">
                                <span className="mini-cart-qty">SL: {item.quantity}</span>
                                <span className="mini-cart-price">{formatCurrency(item.price)}</span>
                              </div>
                            </div>
                            <button
                              type="button"
                              className="mini-cart-remove-btn"
                              title="Xóa món này khỏi giỏ"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (removeFromCart) removeFromCart(item.productId);
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>

                      {cartItems.length > 3 && (
                        <div className="mini-cart-more-hint">
                          + và còn {cartItems.length - 3} sản phẩm khác trong giỏ
                        </div>
                      )}

                      <div className="mini-cart-footer">
                        <div className="mini-cart-subtotal-row">
                          <span className="mini-cart-subtotal-label">Tổng tiền tạm tính:</span>
                          <span className="mini-cart-subtotal-value">{formatCurrency(cartSubtotal)}</span>
                        </div>
                        <button
                          type="button"
                          className="mini-cart-checkout-btn"
                          onClick={() => {
                            setShowCartPreview(false);
                            if (onCartClick) onCartClick();
                            else navTo('/cart');
                          }}
                        >
                          <span>Xem Chi Tiết Giỏ Hàng & Mua Ngay</span>
                          <span>➔</span>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="mini-cart-empty">
                      <div className="mini-cart-empty-icon">🛒</div>
                      <div className="mini-cart-empty-title">Giỏ hàng của bạn đang trống</div>
                      <div className="mini-cart-empty-sub">Hãy chọn ngay các sản phẩm ưng ý với giá siêu ưu đãi!</div>
                      <button
                        type="button"
                        className="mini-cart-shop-now-btn"
                        onClick={() => {
                          setShowCartPreview(false);
                          navTo('/');
                        }}
                      >
                        Khám Phá Sản Phẩm Ngay
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            <span className="header-dock-divider" />

            {/* User Account Popover or Guest Auth */}
            {user ? (
              <div className="header-user-menu-container" ref={userMenuRef}>
                <button
                  type="button"
                  className={`header-user-dock-btn ${showUserDropdown ? 'active' : ''}`}
                  onClick={() => setShowUserDropdown((prev) => !prev)}
                  aria-expanded={showUserDropdown}
                  title="Tài khoản của tôi"
                >
                  <div className="header-user-avatar-circle">
                    {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                  </div>
                  <div className="header-user-dock-info">
                    <span className="header-user-dock-name">
                      {user.fullName || (user.email ? user.email.split('@')[0] : 'Tài khoản')}
                    </span>
                    <span className={`header-user-dock-role ${user.role}`}>
                      {user.role === 'admin' ? 'Quản Trị' : user.role === 'seller' ? 'Người Bán' : 'Thành Viên'}
                    </span>
                  </div>
                  <span className="header-user-caret">▼</span>
                </button>

                {showUserDropdown && (
                  <div className="header-user-dropdown-card">
                    <div className="user-dropdown-header">
                      <div className="user-dropdown-avatar-large">
                        {(user.fullName || user.email || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="user-dropdown-info">
                        <div className="user-dropdown-name">{user.fullName || user.email}</div>
                        <div className="user-dropdown-email">{user.email}</div>
                        <span className={`user-dropdown-role-pill ${user.role}`}>
                          {user.role === 'admin' ? '⚡ Quản Trị Viên' : user.role === 'seller' ? '🏪 Chủ Gian Hàng' : '✨ Thành Viên Shopee'}
                        </span>
                      </div>
                    </div>

                    <div className="user-dropdown-menu">
                      <button
                        type="button"
                        className="user-dropdown-item primary-accent"
                        onClick={() => {
                          setShowUserDropdown(false);
                          navTo('/orders');
                        }}
                      >
                        <span className="item-icon">📦</span>
                        <div className="item-text">
                          <strong>{t('nav_orders', 'Đơn Mua Của Tôi')}</strong>
                          <small>Kiểm tra đơn hàng & trạng thái vận chuyển</small>
                        </div>
                        <span className="item-badge">Xem ngay</span>
                      </button>

                      <button
                        type="button"
                        className="user-dropdown-item"
                        onClick={() => {
                          setShowUserDropdown(false);
                          navTo('/profile');
                        }}
                      >
                        <span className="item-icon">👤</span>
                        <div className="item-text">
                          <strong>Hồ Sơ Cá Nhân</strong>
                          <small>Cập nhật số điện thoại, địa chỉ nhận hàng</small>
                        </div>
                      </button>

                      {/* Mục Ví Xu & Điểm Thưởng chỉ dành riêng cho Khách hàng (Customer) */}
                      {(!user || user.role === 'customer') && (
                        <button
                          type="button"
                          className="user-dropdown-item"
                          onClick={() => {
                            setShowUserDropdown(false);
                            setShowRewardsModal(true);
                          }}
                        >
                          <span className="item-icon">🪙</span>
                          <div className="item-text">
                            <strong>Ví Xu & Điểm Thưởng</strong>
                            <small>{(coins || 0).toLocaleString('vi-VN')} Xu đang có</small>
                          </div>
                        </button>
                      )}

                      {/* Mục Kênh Người Bán & Ví Doanh Thu dành riêng cho Chủ Shop */}
                      {user?.role === 'seller' && (
                        <>
                          <button
                            type="button"
                            className="user-dropdown-item seller"
                            onClick={() => {
                              setShowUserDropdown(false);
                              navTo('/seller/dashboard');
                            }}
                          >
                            <span className="item-icon">🏪</span>
                            <div className="item-text">
                              <strong>Kênh Quản Lý Gian Hàng</strong>
                              <small>Đơn hàng shop, kho & sản phẩm bán</small>
                            </div>
                          </button>
                          <button
                            type="button"
                            className="user-dropdown-item"
                            onClick={() => {
                              setShowUserDropdown(false);
                              navTo('/seller/dashboard');
                            }}
                          >
                            <span className="item-icon">💳</span>
                            <div className="item-text">
                              <strong>Ví Doanh Thu & Rút Tiền</strong>
                              <small>Số dư thanh toán đơn hàng shop</small>
                            </div>
                          </button>
                        </>
                      )}

                      {user.role === 'admin' && (
                        <button
                          type="button"
                          className="user-dropdown-item admin"
                          onClick={() => {
                            setShowUserDropdown(false);
                            navTo('/admin/dashboard');
                          }}
                        >
                          <span className="item-icon">⚡</span>
                          <div className="item-text">
                            <strong>Bảng Điều Khiển Quản Trị</strong>
                            <small>Quản lý toàn bộ hệ thống e-commerce</small>
                          </div>
                        </button>
                      )}

                      <div className="user-dropdown-divider" />

                      <button
                        type="button"
                        className="user-dropdown-item logout"
                        onClick={() => {
                          setShowUserDropdown(false);
                          onLogout();
                        }}
                      >
                        <span className="item-icon">🚪</span>
                        <div className="item-text">
                          <strong style={{ color: '#ef4444' }}>{t('logout', 'Đăng Xuất')}</strong>
                          <small>Thoát khỏi phiên đăng nhập hiện tại</small>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="header-guest-auth-group">
                <button
                  type="button"
                  className="header-guest-login-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    navTo('/login');
                  }}
                >
                  <span>🔑</span>
                  <span>{t('login', 'Đăng Nhập')}</span>
                </button>
                <button
                  type="button"
                  className="header-guest-register-btn"
                  onClick={(e) => {
                    e.preventDefault();
                    navTo('/register');
                  }}
                >
                  {t('register', 'Đăng Ký')}
                </button>
              </div>
            )}
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
            className="shopee-subnav-link"
            style={{ fontWeight: 700, color: 'var(--primary-color, #ea580c)' }}
            onClick={handleGoHome}
            title="Quay lại trang chủ và xem toàn bộ sản phẩm"
          >
            🏠 {t('nav_all_products', 'Trang Chủ (Tất Cả)')}
          </span>

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

      {/* Quick Order Lookup Modal */}
      {showOrderLookupModal && (
        <div
          className="order-lookup-modal-backdrop anim-modal-fade"
          onClick={() => setShowOrderLookupModal(false)}
        >
          <div
            className="order-lookup-modal-card anim-modal-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="order-lookup-modal-header">
              <div className="order-lookup-header-left">
                <span className="order-lookup-badge-icon">📦</span>
                <div>
                  <h3 className="order-lookup-title">Tra Cứu Lộ Trình Đơn Hàng & Vận Đơn</h3>
                  <p className="order-lookup-desc">Cập nhật hành trình di chuyển thực tế từ hãng vận chuyển SPX Express</p>
                </div>
              </div>
              <button
                type="button"
                className="order-lookup-close-btn"
                onClick={() => setShowOrderLookupModal(false)}
                title="Đóng modal"
              >
                ✕
              </button>
            </div>

            <div className="order-lookup-modal-body">
              <div className="order-lookup-search-bar">
                <input
                  type="text"
                  placeholder="Nhập mã đơn hàng (VD: ORD-DEMO-01) hoặc mã vận đơn..."
                  value={orderQuery}
                  onChange={(e) => setOrderQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleLookupOrder()}
                  className="order-lookup-search-input"
                  autoFocus
                />
                <button
                  type="button"
                  className="order-lookup-search-btn"
                  onClick={() => handleLookupOrder()}
                  disabled={orderLookupLoading}
                >
                  {orderLookupLoading ? 'Đang Tra Cứu...' : 'Tra Cứu Ngay ➔'}
                </button>
              </div>

              {orderLookupError && (
                <div className="order-lookup-error-msg">⚠️ {orderLookupError}</div>
              )}

              {/* Demo Quick Chips */}
              <div className="order-lookup-demo-bar">
                <span className="order-lookup-demo-label">⚡ Tra cứu nhanh mã mẫu:</span>
                <div className="order-lookup-demo-chips">
                  <button
                    type="button"
                    className="order-lookup-demo-chip"
                    onClick={() => {
                      setOrderQuery('ORD-DEMO-01');
                      handleLookupOrder('ORD-DEMO-01');
                    }}
                  >
                    🚚 ORD-DEMO-01 (Đang Giao Hàng)
                  </button>
                  <button
                    type="button"
                    className="order-lookup-demo-chip"
                    onClick={() => {
                      setOrderQuery('ORD-DEMO-02');
                      handleLookupOrder('ORD-DEMO-02');
                    }}
                  >
                    📦 ORD-DEMO-02 (Rời Kho Phân Loại)
                  </button>
                </div>
              </div>

              {/* Order Result Card */}
              {orderLookupResult && (
                <div className="order-lookup-result-card">
                  <div className="result-meta-row">
                    <div className="result-meta-left">
                      <span className="result-order-id">Đơn hàng: <strong>#{orderLookupResult.orderId}</strong></span>
                      <span className="result-tracking-num">Vận đơn: <code>{orderLookupResult.trackingNumber}</code></span>
                    </div>
                    <div className="result-status-capsule">
                      <span className="live-status-dot" />
                      <span>{orderLookupResult.statusLabel}</span>
                    </div>
                  </div>

                  <div className="result-carrier-info">
                    <div className="carrier-badge">
                      <span>🚚</span>
                      <span>{orderLookupResult.carrier}</span>
                    </div>
                    <div className="delivery-eta">
                      <span>⏱️</span>
                      <span>{orderLookupResult.estimatedDelivery}</span>
                    </div>
                  </div>

                  {/* Stepper Timeline */}
                  <div className="order-lookup-timeline">
                    {orderLookupResult.steps.map((step, idx) => (
                      <div
                        key={idx}
                        className={`timeline-step-row ${step.done ? 'is-done' : ''} ${step.current ? 'is-current' : ''}`}
                      >
                        <div className="timeline-step-line-col">
                          <div className="timeline-step-circle">
                            {step.done ? '✓' : idx + 1}
                          </div>
                          {idx < orderLookupResult.steps.length - 1 && (
                            <div className="timeline-step-connector" />
                          )}
                        </div>
                        <div className="timeline-step-body">
                          <div className="timeline-step-name">{step.label}</div>
                          <div className="timeline-step-time">{step.time}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="order-lookup-footer-actions">
                    <button
                      type="button"
                      className="order-lookup-view-all-btn"
                      onClick={() => {
                        setShowOrderLookupModal(false);
                        navTo('/orders');
                      }}
                    >
                      <span>Xem chi tiết danh sách đơn mua của bạn</span>
                      <span>➔</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
