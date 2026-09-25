import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getShopById, getProductsByShop, isShopFollowed, toggleFollowShop } from '../services/shopService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatCurrency';
import ProductCard from '../components/ProductCard';

export default function ShopStorefrontPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { applyVoucher } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addToCompare, isCompared } = useCompare();

  const [shop, setShop] = useState(null);
  const [products, setProducts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [shopSearch, setShopSearch] = useState('');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    const loadedShop = getShopById(shopId);
    setShop(loadedShop);
    setFollowerCount(loadedShop.followers || 12000);
    setIsFollowing(isShopFollowed(loadedShop.id));

    const shopProds = getProductsByShop(loadedShop.id);
    setProducts(shopProds);
    window.scrollTo(0, 0);
  }, [shopId]);

  if (!shop) {
    return (
      <main className="shopee-container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>{t('shop_not_found')}</h2>
        <Link to="/" className="shopee-btn shopee-btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
          Về trang chủ
        </Link>
      </main>
    );
  }

  const handleToggleFollow = () => {
    const nextState = toggleFollowShop(shop.id);
    setIsFollowing(nextState);
    setFollowerCount((prev) => (nextState ? prev + 1 : prev - 1));
    showToast(
      nextState ? `Đã theo dõi ${shop.name}!` : `Đã bỏ theo dõi ${shop.name}`,
      nextState ? 'success' : 'info'
    );
  };

  const handleOpenShopChat = () => {
    window.dispatchEvent(
      new CustomEvent('open_live_chat', {
        detail: {
          shopName: shop.name,
          shopId: shop.id,
          shopAvatar: shop.avatar,
        },
      })
    );
  };

  const handleClaimVoucher = (voucher) => {
    const res = applyVoucher(voucher.code);
    if (res?.success) {
      showToast(`Đã áp dụng mã ${voucher.code} của ${shop.name} thành công!`, 'success');
    } else {
      showToast(`Đã lưu mã ${voucher.code} vào ví voucher của bạn!`, 'success');
    }
  };

  // Filter & sort products in this shop
  const filteredProducts = products.filter((p) => {
    if (!shopSearch.trim()) return true;
    return p.name.toLowerCase().includes(shopSearch.toLowerCase());
  }).sort((a, b) => {
    if (sortBy === 'price_asc') return a.price - b.price;
    if (sortBy === 'price_desc') return b.price - a.price;
    if (sortBy === 'best_selling') return (b.sold || 0) - (a.sold || 0);
    return 0;
  });

  return (
    <main className="shopee-container" style={{ padding: '24px 0' }}>
      {/* Breadcrumb */}
      <nav style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px' }}>
        <Link to="/" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Trang chủ</Link>
        {' > '}
        <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>Gian hàng: {shop.name}</span>
      </nav>

      {/* Shop Profile Banner & Header Card */}
      <section
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border-medium, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)',
          marginBottom: '24px',
        }}
      >
        {/* Cover Banner */}
        <div
          style={{
            height: '180px',
            width: '100%',
            backgroundImage: `linear-gradient(rgba(15, 23, 42, 0.4), rgba(15, 23, 42, 0.7)), url(${shop.banner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        />

        {/* Shop Info Row */}
        <div
          style={{
            padding: '0 24px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '20px',
            marginTop: '-50px',
            position: 'relative',
          }}
        >
          {/* Avatar & Title */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '18px' }}>
            <img
              src={shop.avatar}
              alt={shop.name}
              style={{
                width: '100px',
                height: '100px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid var(--bg-card, #ffffff)',
                boxShadow: 'var(--shadow-md)',
                background: '#ffffff',
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {shop.name}
                </h1>
                {shop.isOfficial && (
                  <span
                    style={{
                      background: 'var(--primary-color, #ea580c)',
                      color: '#ffffff',
                      fontSize: '11px',
                      fontWeight: 800,
                      padding: '2px 8px',
                      borderRadius: '4px',
                      letterSpacing: '0.5px',
                    }}
                  >
                    ✓ SHOPEE MALL
                  </span>
                )}
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                📍 {shop.location} · Hoạt động {shop.joinedDate}
              </p>
            </div>
          </div>

          {/* Action Buttons: Follow & Chat */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              className={isFollowing ? 'shopee-btn shopee-btn-secondary' : 'shopee-btn shopee-btn-primary'}
              style={{ padding: '10px 20px', fontWeight: 700, borderRadius: '8px' }}
              onClick={handleToggleFollow}
            >
              {isFollowing ? t('shop_following') : t('shop_follow')}
            </button>

            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              style={{ padding: '10px 20px', fontWeight: 700, borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}
              onClick={handleOpenShopChat}
            >
              {t('shop_chat_btn')}
            </button>
          </div>
        </div>

        {/* Shop Key Metrics Bar */}
        <div
          style={{
            borderTop: '1px solid var(--border-light, #e2e8f0)',
            padding: '16px 24px',
            background: 'var(--bg-muted, #f8fafc)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: '16px',
            textAlign: 'center',
          }}
        >
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('shop_rating')}</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              ⭐ {shop.rating} / 5.0
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('shop_followers')}</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {followerCount.toLocaleString()}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{t('shop_response_rate')}</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {shop.responseRate}% ({shop.responseTime})
            </div>
          </div>
          <div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tổng sản phẩm</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
              {products.length} mặt hàng
            </div>
          </div>
        </div>
      </section>

      {/* Shop Exclusive Vouchers */}
      {shop.vouchers && shop.vouchers.length > 0 && (
        <section style={{ marginBottom: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
            <span style={{ fontSize: '20px' }}>🎟️</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {t('shop_vouchers_title')}
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {shop.vouchers.map((v) => (
              <div
                key={v.code}
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1.5px dashed var(--primary-color, #ea580c)',
                  borderRadius: '12px',
                  padding: '16px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary-color, #ea580c)' }}>
                    {v.code}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    HSD: {v.expires} · {v.desc}
                  </div>
                </div>

                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  style={{ padding: '6px 14px', fontSize: '12px', fontWeight: 700 }}
                  onClick={() => handleClaimVoucher(v)}
                >
                  Lưu & Dùng
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shop Catalog Header & Search */}
      <section>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-medium, #e2e8f0)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🛍️</span>
            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {t('shop_all_products')} ({filteredProducts.length})
            </h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search inside shop */}
            <input
              type="text"
              placeholder={t('shop_search_placeholder')}
              className="shopee-form-input"
              value={shopSearch}
              onChange={(e) => setShopSearch(e.target.value)}
              style={{ width: '240px', padding: '8px 12px', fontSize: '13px' }}
            />

            {/* Sort */}
            <select
              className="shopee-form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '8px 12px', fontSize: '13px' }}
            >
              <option value="featured">Nổi bật nhất</option>
              <option value="best_selling">Bán chạy nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
            Không tìm thấy sản phẩm nào phù hợp với từ khóa "{shopSearch}".
          </div>
        ) : (
          <div className="shopee-product-grid">
            {filteredProducts.map((p) => {
              const id = p._id || p.id;
              return (
                <div key={id} style={{ position: 'relative' }}>
                  <ProductCard product={p} />
                  {/* Compare button overlay */}
                  <button
                    type="button"
                    onClick={() => addToCompare(p)}
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      background: isCompared(id) ? 'var(--primary-color)' : 'var(--bg-card, #ffffff)',
                      color: isCompared(id) ? '#ffffff' : 'var(--text-primary)',
                      border: '1px solid var(--border-medium, #cbd5e1)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      zIndex: 2,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    title={t('compare_btn')}
                  >
                    ⚖️ {isCompared(id) ? 'Đã so sánh' : 'So sánh'}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
