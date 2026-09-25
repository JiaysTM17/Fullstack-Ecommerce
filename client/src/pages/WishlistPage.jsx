import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EmptyState, ProductCard } from '../components';
import { useWishlist } from '../context/WishlistContext';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { FALLBACK_PRODUCTS, getProductById } from '../services/productService';
import { formatCurrency } from '../utils/formatCurrency';

export default function WishlistPage() {
  const { wishlistIds, clearWishlist } = useWishlist();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const [wishlistProducts, setWishlistProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleClear = () => {
    clearWishlist();
    showToast(t('wishlist_cleared', 'Đã xóa toàn bộ sản phẩm yêu thích'), 'info');
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
            ❤️ {t('wishlist_title', 'Danh Sách Sản Phẩm Yêu Thích')} ({wishlistProducts.length})
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)', fontSize: '14px' }}>
            {t('wishlist_subtitle', 'Các sản phẩm bạn đã lưu để theo dõi giá và khuyến mãi.')}
          </p>
        </div>

        <button
          type="button"
          className="shopee-btn shopee-btn-secondary"
          onClick={handleClear}
          style={{ fontSize: '13px' }}
        >
          {t('clear_all_wishlist', 'Xóa toàn bộ yêu thích')}
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '16px',
        }}
      >
        {wishlistProducts.map((product) => (
          <div key={product._id || product.id} style={{ display: 'flex', flexDirection: 'column' }}>
            <ProductCard
              product={product}
              formatCurrency={formatCurrency}
              onAddToCart={(p) => addToCart(p, 1)}
              onViewDetail={(p) => navigate(`/products/${p._id || p.id}`)}
            />
          </div>
        ))}
      </div>
    </main>
  );
}
