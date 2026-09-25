import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FALLBACK_PRODUCTS, getProductById } from '../services/productService';
import { formatCurrency } from '../utils/formatCurrency';
import { useLanguage } from '../context/LanguageContext';

const RECENT_STORAGE_KEY = 'mini_shopee_recent_views';

export function saveRecentlyViewed(productId) {
  try {
    const raw = localStorage.getItem(RECENT_STORAGE_KEY);
    const list = raw ? JSON.parse(raw) : [];
    const filtered = list.filter((id) => id !== productId);
    const updated = [productId, ...filtered].slice(0, 8); // Keep up to 8
    localStorage.setItem(RECENT_STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Lỗi lưu recently viewed:", e);
  }
}

export function RecentlyViewed({ currentProductId }) {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [recentProducts, setRecentProducts] = useState([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_STORAGE_KEY);
      const ids = raw ? JSON.parse(raw) : [];
      const filteredIds = ids.filter((id) => id !== currentProductId).slice(0, 5);

      const prods = filteredIds.map((id) => {
        return FALLBACK_PRODUCTS.find((p) => p._id === id || p.id === id);
      }).filter(Boolean);

      setRecentProducts(prods);
    } catch {
      setRecentProducts([]);
    }
  }, [currentProductId]);

  if (recentProducts.length === 0) return null;

  return (
    <section
      style={{
        marginTop: '36px',
        padding: '20px 24px',
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '12px',
        border: '1px solid var(--border-color, #e2e8f0)',
      }}
    >
      <h3
        style={{
          fontSize: '17px',
          fontWeight: 800,
          margin: '0 0 16px',
          color: 'var(--text-primary, #0f172a)',
        }}
      >
        🕒 {t('recently_viewed')}
      </h3>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
          gap: '14px',
        }}
      >
        {recentProducts.map((p) => (
          <div
            key={p._id || p.id}
            onClick={() => navigate(`/products/${p._id || p.id}`)}
            style={{
              cursor: 'pointer',
              borderRadius: '8px',
              border: '1px solid var(--border-color, #e2e8f0)',
              padding: '10px',
              background: 'var(--bg-card, #fff)',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            <img
              src={p.image || p.images?.[0]}
              alt={p.name}
              style={{
                width: '100%',
                aspectRatio: '1',
                objectFit: 'cover',
                borderRadius: '6px',
                marginBottom: '8px',
              }}
            />
            <div
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                color: 'var(--text-primary, #111)',
                display: '-webkit-box',
                WebkitLineClamp: 1,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                marginBottom: '4px',
              }}
            >
              {p.name}
            </div>
            <div style={{ fontSize: '14px', fontWeight: 800, color: '#ea580c' }}>
              {formatCurrency(p.price)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export default RecentlyViewed;
