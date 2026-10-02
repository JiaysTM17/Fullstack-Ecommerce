import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AccountSidebar from '../components/AccountSidebar';
import { EmptyState, ProductCard } from '../components';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { FALLBACK_PRODUCTS, getProductById } from '../services/productService';
import { clearWishlist as clearWishlistService, moveAllWishlistToCart } from '../services/wishlistService';
import { formatCurrency } from '../utils/formatCurrency';
import { ShoppingBagIcon } from '../components/OrdersIcons';

function TrashIcon({ size = 14, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  );
}

function HeartSvgIcon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#ef4444" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

export default function WishlistPage() {
  const { wishlistIds, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    let ignore = false;
    async function loadItems() {
      setLoading(true);
      try {
        const prods = await Promise.all(
          wishlistIds.map(async (id) => {
            const p = await getProductById(id);
            return p || FALLBACK_PRODUCTS.find((item) => item._id === id || item.id === id);
          })
        );
        if (!ignore) {
          setWishlistProducts(prods.filter(Boolean));
        }
      } catch (e) {
        console.error("Lỗi khi tải wishlist:", e);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadItems();
    return () => {
      ignore = true;
    };
  }, [wishlistIds]);

  const categories = useMemo(() => {
    const set = new Set();
    wishlistProducts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['all', ...Array.from(set)];
  }, [wishlistProducts]);

  const displayedProducts = useMemo(() => {
    if (selectedCategory === 'all') return wishlistProducts;
    return wishlistProducts.filter((p) => p.category === selectedCategory);
  }, [wishlistProducts, selectedCategory]);

  const handleClear = async () => {
    if (window.confirm('Bạn có chắc chắn muốn xóa toàn bộ sản phẩm khỏi danh sách yêu thích?')) {
      clearWishlist();
      try {
        await clearWishlistService();
      } catch {}
      showToast(t('wishlist_cleared', 'Đã xóa toàn bộ sản phẩm yêu thích'), 'info');
    }
  };

  const handleAddAllToCart = async () => {
    const availableItems = wishlistProducts.filter((p) => (Number(p.stock) || 0) > 0);
    if (availableItems.length === 0) {
      showToast('Tất cả sản phẩm trong danh sách yêu thích đều đang tạm hết hàng!', 'warning');
      return;
    }

    availableItems.forEach((p) => {
      addToCart(p, 1);
    });

    try {
      await moveAllWishlistToCart();
    } catch {}

    showToast(`Đã thêm ${availableItems.length} sản phẩm còn hàng vào giỏ!`, 'success');

    pushBuyerNotification({
      type: 'order',
      icon: '🛒',
      title: 'Đã chuyển danh sách yêu thích vào giỏ hàng',
      message: `Bạn vừa thêm ${availableItems.length} sản phẩm từ danh mục Yêu thích vào giỏ hàng thành công.`,
      link: '/cart',
    });
  };

  return (
    <main className="shopee-container" style={{ padding: '24px 16px', maxWidth: '1240px' }}>
      <div className="account-portal-layout">
        {/* Sticky Left Navigation Sidebar */}
        <AccountSidebar
          activeSection="wishlist"
          onSelectTrackingView={() => navigate('/orders?view=tracking')}
          onSelectStatusTab={(tabId) => navigate(`/orders?tab=${tabId}`)}
        />

        {/* Right Main Content Area */}
        <div className="account-portal-main-content">
          <div
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(15, 23, 42, 0.03)',
            }}
          >
            {wishlistIds.length === 0 || wishlistProducts.length === 0 ? (
              <EmptyState
                title={t('empty_wishlist_title', 'Danh sách yêu thích đang trống')}
                description={t('empty_wishlist_desc', 'Hãy bấm vào biểu tượng trái tim trên các sản phẩm bạn thích để lưu lại xem sau.')}
                actionText={t('explore_now', 'Khám phá ngay')}
                onAction={() => navigate('/')}
              />
            ) : (
              <>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center' }}>
                        <HeartSvgIcon size={24} />
                      </span>
                      <span>{t('wishlist_title', 'Sản Phẩm Yêu Thích')} ({wishlistProducts.length})</span>
                    </h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {t('wishlist_subtitle', 'Các sản phẩm bạn đã lưu để theo dõi giá và khuyến mãi.')}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-primary"
                      onClick={handleAddAllToCart}
                      style={{ fontSize: '12.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 14px' }}
                    >
                      <ShoppingBagIcon size={14} /> Thêm tất cả vào giỏ
                    </button>
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-secondary"
                      onClick={handleClear}
                      style={{ fontSize: '12.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 12px' }}
                    >
                      <TrashIcon size={13} /> {t('clear_all_wishlist', 'Xóa toàn bộ')}
                    </button>
                  </div>
                </div>

                {/* Category Filter Pills */}
                {categories.length > 2 && (
                  <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '4px' }}>
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '20px',
                          fontSize: '12.5px',
                          fontWeight: selectedCategory === cat ? 700 : 500,
                          border: '1px solid',
                          borderColor: selectedCategory === cat ? '#2563eb' : '#e2e8f0',
                          background: selectedCategory === cat ? '#2563eb' : '#ffffff',
                          color: selectedCategory === cat ? '#ffffff' : '#475569',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          transition: 'all 0.15s',
                        }}
                      >
                        {cat === 'all' ? 'Tất cả' : cat}
                      </button>
                    ))}
                  </div>
                )}

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
                    gap: '16px',
                  }}
                >
                  {displayedProducts.map((product) => (
                    <div key={product._id || product.id} style={{ display: 'flex', flexDirection: 'column' }}>
                      <ProductCard
                        product={product}
                        formatCurrency={formatCurrency}
                        onAddToCart={(p) => {
                          addToCart(p, 1);
                          showToast(t('add_to_cart_success', 'Đã thêm sản phẩm vào giỏ hàng!'), 'success');
                        }}
                        onViewDetail={(p) => navigate(`/products/${p._id || p.id}`)}
                      />
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
