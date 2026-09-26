import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function QuickViewModal({ product, onClose }) {
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const { t } = useLanguage();

  if (!product) return null;

  const imagesList = product.images && product.images.length > 0 ? product.images : [product.image];
  const [selectedImg, setSelectedImg] = useState(imagesList[0]);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(product.variants?.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.variants?.sizes?.[0] || '');

  const productId = product._id || product.id;
  const wishlisted = isWishlisted(productId);

  const hasDiscount = product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const handleAddToCart = () => {
    addToCart(
      {
        ...product,
        selectedColor,
        selectedSize,
      },
      quantity
    );
    showToast(t('card_add_to_cart') + ': ' + product.name, 'success', {
      label: t('cart_title'),
      onClick: () => navigate('/cart'),
    });
    onClose();
  };

  const handleFullDetail = () => {
    onClose();
    navigate(`/products/${productId}`);
  };

  return (
    <div className="shopee-modal-overlay" onClick={onClose} style={{ zIndex: 9998 }}>
      <div
        className="shopee-modal anim-modal-content"
        style={{
          maxWidth: '780px',
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '12px',
          padding: '24px',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'none',
            border: 'none',
            fontSize: '20px',
            color: 'var(--text-secondary, #64748b)',
            cursor: 'pointer',
          }}
          aria-label="Đóng"
        >
          ✕
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px', alignItems: 'start' }}>
          {/* Gallery */}
          <div>
            <div
              style={{
                width: '100%',
                aspectRatio: '1',
                borderRadius: '8px',
                overflow: 'hidden',
                border: '1px solid var(--border-color, #e2e8f0)',
                marginBottom: '10px',
              }}
            >
              <img
                src={selectedImg}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </div>

            {imagesList.length > 1 && (
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                {imagesList.map((img, idx) => (
                  <img
                    key={idx}
                    src={img}
                    alt=""
                    onClick={() => setSelectedImg(img)}
                    style={{
                      width: '54px',
                      height: '54px',
                      borderRadius: '4px',
                      objectFit: 'cover',
                      cursor: 'pointer',
                      border: selectedImg === img ? '2px solid var(--primary-color, #4f46e5)' : '1px solid var(--border-color, #e2e8f0)',
                    }}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Info & Buy Box */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600 }}>
              {product.brand || 'Chính Hãng'} · {product.category}
            </div>

            <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, lineHeight: 1.3 }}>
              {product.name}
            </h2>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '10px' }}>
              <span style={{ fontSize: '24px', fontWeight: 800, color: 'var(--primary-color, #4f46e5)' }}>
                {formatCurrency(product.price)}
              </span>
              {hasDiscount && (
                <>
                  <span style={{ fontSize: '14px', color: '#94a3b8', textDecoration: 'line-through' }}>
                    {formatCurrency(product.originalPrice)}
                  </span>
                  <span style={{ fontSize: '12px', color: '#ef4444', fontWeight: 700 }}>
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', margin: 0, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {product.description}
            </p>

            {/* Colors */}
            {product.variants?.colors && product.variants.colors.length > 0 && (
              <div>
                <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px' }}>
                  Màu sắc: <strong>{selectedColor}</strong>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {product.variants.colors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        background: selectedColor === c ? 'var(--primary-color, #4f46e5)' : 'var(--bg-card, #fff)',
                        color: selectedColor === c ? '#fff' : 'var(--text-primary, #111)',
                        border: selectedColor === c ? '1px solid var(--primary-color, #4f46e5)' : '1px solid var(--border-color, #ccc)',
                      }}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Số lượng:</span>
              <div className="shopee-qty-control shopee-qty-sm">
                <button
                  className="shopee-qty-btn"
                  disabled={quantity <= 1}
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </button>
                <input
                  className="shopee-qty-input"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                />
                <button
                  className="shopee-qty-btn"
                  disabled={quantity >= (product.stock || 50)}
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </button>
              </div>
              <span style={{ fontSize: '12px', color: '#10b981', fontWeight: 600 }}>
                {t('pdp_in_stock')}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 700 }}
                onClick={handleAddToCart}
              >
                {t('card_add_to_cart')}
              </button>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{ padding: '10px 14px', fontSize: '13px' }}
                onClick={handleFullDetail}
              >
                Xem chi tiết đầy đủ →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
