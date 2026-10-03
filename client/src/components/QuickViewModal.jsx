import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatCurrency';
import { CloseIcon, ChevronRightIcon, MinusIcon, PlusIcon, CartIcon, CheckIcon, HeartIcon, ShieldCheckIcon, TruckIcon, TagIcon } from './OrdersIcons';

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
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
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
            color: 'var(--text-secondary, #64748b)',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10,
          }}
          aria-label="Đóng"
        >
          <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <CloseIcon size={14} color="var(--text-secondary, #64748b)" />
          </span>
        </button>

        <div className="quickview-modal-grid">
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
              <div style={{ fontSize: '12px', color: '#0284c7', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TagIcon size={12} color="#0284c7" />
                </span>
                <span>{product.brand || 'Chính Hãng'} · {product.category}</span>
              </div>
              <button
                type="button"
                onClick={() => toggleWishlist(product)}
                style={{
                  background: wishlisted ? '#fef2f2' : 'var(--bg-muted, #f1f5f9)',
                  border: '1px solid ' + (wishlisted ? '#fecaca' : 'var(--border-color, #e2e8f0)'),
                  borderRadius: '6px',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11.5px',
                  color: wishlisted ? '#dc2626' : 'var(--text-secondary, #64748b)',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                }}
                title={wishlisted ? 'Đã yêu thích' : 'Thêm vào yêu thích'}
              >
                <HeartIcon size={13} color={wishlisted ? '#ef4444' : '#64748b'} fill={wishlisted ? '#ef4444' : 'none'} />
                <span>{wishlisted ? 'Đã thích' : 'Yêu thích'}</span>
              </button>
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
                  aria-label="Giảm số lượng"
                >
                  <MinusIcon size={11} color={quantity <= 1 ? "#cbd5e1" : "#475569"} />
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
                  aria-label="Tăng số lượng"
                >
                  <PlusIcon size={11} color={quantity >= (product.stock || 50) ? "#cbd5e1" : "#ea580c"} />
                </button>
              </div>
              <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckIcon size={11} color="#16a34a" />
                </span>
                <span>{t('pdp_in_stock')}</span>
              </span>
            </div>

            {/* Trust Badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '8px 12px', background: 'var(--bg-muted, #f8fafc)', borderRadius: '8px', border: '1px solid var(--border-light, #e2e8f0)', fontSize: '11.5px', color: 'var(--text-secondary, #475569)' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TruckIcon size={12} color="#16a34a" />
                </span>
                <span style={{ fontWeight: 600 }}>SPX Giao Nhanh 24H</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheckIcon size={12} color="#2563eb" />
                </span>
                <span style={{ fontWeight: 600 }}>100% Chính Hãng</span>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                style={{ flex: 1, padding: '10px', fontSize: '14px', fontWeight: 700 }}
                onClick={handleAddToCart}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CartIcon size={13} color="#ffffff" />
                  </span>
                  <span>{t('card_add_to_cart')}</span>
                </span>
              </button>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{ padding: '10px 14px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={handleFullDetail}
              >
                <span>Xem chi tiết đầy đủ</span>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ChevronRightIcon size={12} color="#2563eb" />
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
