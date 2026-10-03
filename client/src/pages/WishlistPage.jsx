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
import {
  ShoppingBagIcon,
  CheckIcon,
  HeartIcon,
  TrashIcon,
  SearchIcon,
  CloseIcon,
} from '../components/OrdersIcons';
import { pushBuyerNotification } from '../utils/notificationHelper';

export default function WishlistPage() {
  const { wishlistIds, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [wishlistSearch, setWishlistSearch] = useState('');
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

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
    let list = wishlistProducts;
    if (selectedCategory !== 'all') {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (wishlistSearch.trim()) {
      const q = wishlistSearch.toLowerCase().trim();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
    }
    return list;
  }, [wishlistProducts, selectedCategory, wishlistSearch]);

  const availableCount = useMemo(() => {
    return wishlistProducts.filter((p) => (Number(p.stock) || 0) > 0).length;
  }, [wishlistProducts]);

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

    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 2000);
    showToast(`Đã thêm ${availableItems.length} sản phẩm còn hàng vào giỏ!`, 'success');

    pushBuyerNotification({
      type: 'order',
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
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '14px' }}>
                  <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <HeartIcon size={20} color="#ef4444" fill="#ef4444" />
                      </span>
                      <span>{t('wishlist_title', 'Sản Phẩm Yêu Thích')} ({wishlistProducts.length})</span>
                    </h1>
                    <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {t('wishlist_subtitle', 'Các sản phẩm bạn đã lưu để theo dõi giá và khuyến mãi.')}
                      <span style={{ marginLeft: '6px', color: '#16a34a', fontWeight: 600 }}>
                        • {availableCount} sản phẩm sẵn sàng giao ngay
                      </span>
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {/* Search inside wishlist */}
                    {wishlistProducts.length > 2 && (
                      <div style={{ position: 'relative', width: '220px' }}>
                        <input
                          type="text"
                          className="shopee-form-input"
                          placeholder="Tìm sản phẩm đã lưu..."
                          value={wishlistSearch}
                          onChange={(e) => setWishlistSearch(e.target.value)}
                          style={{ padding: '6px 12px 6px 30px', fontSize: '12.5px', borderRadius: '6px', height: '34px' }}
                        />
                        <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                          <SearchIcon size={13} color="#94a3b8" />
                        </span>
                        {wishlistSearch && (
                          <button
                            type="button"
                            onClick={() => setWishlistSearch('')}
                            style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                            title="Xóa tìm kiếm"
                          >
                            <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CloseIcon size={9} color="#64748b" />
                            </span>
                          </button>
                        )}
                      </div>
                    )}

                    <button
                      type="button"
                      className="shopee-btn shopee-btn-primary"
                      onClick={handleAddAllToCart}
                      style={{
                        fontSize: '12.5px',
                        fontWeight: 700,
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '8px',
                        height: '34px',
                        padding: '0 14px',
                        backgroundColor: isAddedFeedback ? '#10b981' : undefined,
                        borderColor: isAddedFeedback ? '#10b981' : undefined,
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {isAddedFeedback ? (
                        <>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckIcon size={12} color="#ffffff" />
                          </span>
                          <span>Đã thêm vào giỏ!</span>
                        </>
                      ) : (
                        <>
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ShoppingBagIcon size={12} color="#ffffff" />
                          </span>
                          <span>Thêm tất cả vào giỏ</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-secondary"
                      onClick={handleClear}
                      style={{ fontSize: '12.5px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px', height: '34px', padding: '0 12px' }}
                    >
                      <span style={{ width: '20px', height: '20px', borderRadius: '5px', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TrashIcon size={12} color="#dc2626" />
                      </span>
                      <span>{t('clear_all_wishlist', 'Xóa toàn bộ')}</span>
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

                {displayedProducts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>
                    <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(203, 213, 225, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                      <SearchIcon size={28} color="#94a3b8" />
                    </div>
                    <p style={{ margin: '8px 0 0', fontSize: '14px', fontWeight: 600 }}>
                      Không tìm thấy sản phẩm yêu thích nào khớp với từ khóa "{wishlistSearch}"
                    </p>
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-secondary"
                      onClick={() => {
                        setWishlistSearch('');
                        setSelectedCategory('all');
                      }}
                      style={{ marginTop: '12px', fontSize: '12.5px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                    >
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CloseIcon size={10} color="#ef4444" />
                      </span>
                      <span>Xóa bộ lọc</span>
                    </button>
                  </div>
                ) : (
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
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
