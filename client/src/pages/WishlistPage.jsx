import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ProductCard } from '../components';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { FALLBACK_PRODUCTS, getProductById } from '../services/productService';
import { clearWishlist as clearWishlistService, moveAllWishlistToCart } from '../services/wishlistService';
import { formatCurrency } from '../utils/formatCurrency';
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

  if (wishlistIds.length === 0 || wishlistProducts.length === 0) {
    return (
      <main className="shopee-container" style={{ padding: '40px 0' }}>
        <EmptyState
          title={t('empty_wishlist_title', 'Danh sách yêu thích đang trống')}
          description={t('empty_wishlist_desc', 'Hãy bấm vào biểu tượng trái tim trên các sản phẩm bạn thích để lưu lại xem sau.')}
          actionText={t('explore_now', 'Khám phá ngay')}
          onAction={() => navigate('/')}
        />
      </main>
    );
  }

  return (
    <main className="shopee-container" style={{ padding: '28px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            ❤️ {t('wishlist_title', 'Danh Sách Sản Phẩm Yêu Thích')} ({wishlistProducts.length})
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {t('wishlist_subtitle', 'Các sản phẩm bạn đã lưu để theo dõi giá và khuyến mãi.')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            onClick={handleAddAllToCart}
            style={{ fontSize: '13px', fontWeight: 700 }}
          >
            🛒 Thêm tất cả vào giỏ
          </button>
          <button
            type="button"
            className="shopee-btn shopee-btn-secondary"
            onClick={handleClear}
            style={{ fontSize: '13px' }}
          >
            {t('clear_all_wishlist', 'Xóa toàn bộ')}
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
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '13px',
                fontWeight: selectedCategory === cat ? 700 : 500,
                border: '1px solid',
                borderColor: selectedCategory === cat ? 'var(--primary, #ee4d2d)' : 'var(--border-light, #e2e8f0)',
                background: selectedCategory === cat ? 'var(--primary, #ee4d2d)' : 'var(--bg-card, #fff)',
                color: selectedCategory === cat ? '#fff' : 'var(--text-primary)',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
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
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
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
    </main>
  );
}
