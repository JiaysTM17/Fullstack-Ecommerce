import React, { useState } from 'react';
import { useWishlist } from '../context/WishlistContext';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import { useCompare } from '../context/CompareContext';
import {
  ScaleIcon,
  BoltIcon,
  HeartIcon,
  EyeIcon,
  StarIcon,
  CheckIcon,
  CartIcon,
  ShieldCheckIcon,
  FlameIcon,
} from './OrdersIcons';
import '../styles/product.css';

const defaultFormatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

const ProductCard = ({
  product = {},
  onAddToCart,
  onViewDetail,
  onQuickView,
  formatCurrency = defaultFormatCurrency
}) => {
  const [imgSrc, setImgSrc] = useState(product?.image || product?.images?.[0] || FALLBACK_IMAGE);
  const [justAdded, setJustAdded] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { addToCompare, isCompared } = useCompare();

  if (!product || !product.name) {
    return null;
  }

  const {
    _id,
    id,
    name,
    price = 0,
    originalPrice = 0,
    rating = 5,
    sold = 0,
    isMall = false,
    badge,
    isFastDelivery = false,
    reviewCount = 50,
  } = product;

  const productId = _id || id;
  const wishlisted = isWishlisted(productId);

  const hasDiscount = originalPrice > price;
  const discountPercent = hasDiscount
    ? Math.round(((originalPrice - price) / originalPrice) * 100)
    : 0;

  const handleCardClick = (e) => {
    if (onViewDetail) {
      onViewDetail(product, e);
    }
  };

  const handleAddClick = (e) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(product, e);
    }
    setJustAdded(true);
    showToast(t('add_to_cart_success', 'Đã thêm sản phẩm vào giỏ hàng!'), 'success');
    setTimeout(() => {
      setJustAdded(false);
    }, 1200);
  };

  const handleWishlistClick = (e) => {
    e.stopPropagation();
    toggleWishlist(productId);
    showToast(
      wishlisted
        ? t('wishlist_removed', 'Đã xóa khỏi danh sách yêu thích')
        : t('wishlist_added', 'Đã thêm vào danh sách yêu thích!'),
      'info'
    );
  };

  const handleImageError = () => {
    setImgSrc(FALLBACK_IMAGE);
  };

  return (
    <article
      className="shopee-product-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
      data-id={productId}
      style={{ position: 'relative' }}
    >
      {/* Khung ảnh sản phẩm */}
      <div className="shopee-card-image-wrapper">
        <img
          src={imgSrc}
          alt={name}
          className="shopee-card-image"
          onError={handleImageError}
          loading="lazy"
        />

        {/* Wishlist Heart Button */}
        <button
          type="button"
          onClick={handleWishlistClick}
          aria-label={wishlisted ? t('wishlist_removed', "Xóa khỏi yêu thích") : t('wishlist_added', "Thêm vào yêu thích")}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'rgba(255, 255, 255, 0.85)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            color: wishlisted ? 'var(--primary-color, #ea580c)' : '#888',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: wishlisted ? 'rgba(239, 68, 68, 0.15)' : 'rgba(244, 63, 94, 0.08)', border: wishlisted ? '1px solid rgba(239, 68, 68, 0.3)' : '1px solid rgba(244, 63, 94, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <HeartIcon
              size={16}
              fill={wishlisted ? "#ef4444" : "none"}
              color={wishlisted ? "#ef4444" : "#f43f5e"}
            />
          </span>
        </button>

        {/* Compare Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addToCompare(product);
          }}
          title={isCompared(productId) ? "Đang trong danh sách so sánh" : "Thêm vào so sánh"}
          aria-label="So sánh sản phẩm"
          style={{
            position: 'absolute',
            top: '46px',
            right: '8px',
            background: isCompared(productId) ? 'var(--primary-color, #ea580c)' : 'rgba(255, 255, 255, 0.85)',
            color: isCompared(productId) ? '#fff' : '#475569',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            fontSize: '13px',
            transition: 'all 0.2s',
          }}
        >
          <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: isCompared(productId) ? 'rgba(255, 255, 255, 0.25)' : 'rgba(71, 85, 105, 0.1)', border: isCompared(productId) ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(71, 85, 105, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ScaleIcon size={14} color={isCompared(productId) ? "#ffffff" : "#475569"} />
          </span>
        </button>

        {/* Quick View Button */}
        {onQuickView && (
          <button
            type="button"
            className="shopee-quickview-btn"
            onClick={(e) => {
              e.stopPropagation();
              onQuickView(product, e);
            }}
            aria-label={t('quick_view_title', 'Xem nhanh')}
          >
            <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <EyeIcon size={11} color="#2563eb" />
            </span>
            <span>{t('quick_view_title', 'Xem nhanh')}</span>
          </button>
        )}

        {/* Badge */}
        {badge ? (
          <span
            style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              background: badge === "Amazon's Choice" ? '#1e293b' : 'var(--primary-color, #ea580c)',
              color: '#fff',
              fontSize: '10px',
              fontWeight: 700,
              padding: '3px 8px',
              borderRadius: '4px',
              zIndex: 1,
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            {badge === "Amazon's Choice" ? (
              <>
                <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.22)', border: '1px solid rgba(245, 158, 11, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StarIcon size={10} color="#f59e0b" fill="#f59e0b" />
                </span>
                <span>{t('nav_featured_picks', 'Tuyển Chọn')}</span>
              </>
            ) : (
              <span>{badge}</span>
            )}
          </span>
        ) : isMall ? (
          <span className="shopee-mall-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '14px', height: '14px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheckIcon size={9} color="#ffffff" />
            </span>
            <span>Mall</span>
          </span>
        ) : null}

        {/* Huy hiệu giảm giá */}
        {hasDiscount && (
          <div className="shopee-discount-badge" style={{ top: badge ? '32px' : '0' }}>
            <span className="shopee-discount-percent" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
              <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.18)', border: '1px solid rgba(234, 88, 12, 0.3)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <FlameIcon size={9} color="#ea580c" />
              </span>
              <span>-{discountPercent}%</span>
            </span>
            <span className="shopee-discount-label">{t('sale_off', 'GIẢM')}</span>
          </div>
        )}
      </div>

      {/* Nội dung chi tiết card */}
      <div className="shopee-card-content">
        <h3 className="shopee-card-title" title={name}>
          {name}
        </h3>

        {/* Hàng giá */}
        <div className="shopee-card-price-row">
          <span className="shopee-card-price">{formatCurrency(price)}</span>
          {hasDiscount && (
            <span className="shopee-card-original-price">
              {formatCurrency(originalPrice)}
            </span>
          )}
        </div>

        {/* Thông tin phụ: Rating, reviewCount và Đã bán */}
        <div className="shopee-card-meta">
          <div className="shopee-card-rating">
            <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <StarIcon size={10} color="#f59e0b" fill="#f59e0b" />
            </span>
            <span>{Number(rating).toFixed(1)}</span>
            <span style={{ color: 'var(--text-muted, #888)', fontSize: '11px', marginLeft: '2px' }}>({reviewCount})</span>
          </div>
          <span className="shopee-card-sold">
            {sold > 1000 ? `${t('sold', 'Đã bán')} ${(sold / 1000).toFixed(1)}k` : `${t('sold', 'Đã bán')} ${sold}`}
          </span>
        </div>

        {/* Fast Delivery Badge */}
        {isFastDelivery && (
          <div style={{ margin: '6px 0 2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ fontSize: '11px', color: 'var(--secondary-color, #0284c7)', fontWeight: 700, background: 'var(--primary-light, #f0f9ff)', padding: '2px 6px', borderRadius: '4px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(2, 132, 199, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <BoltIcon size={10} color="#0284c7" />
              </span>
              <span>{t('nav_fast_delivery', 'Giao 2H')}</span>
            </span>
          </div>
        )}

        {/* Nút thêm vào giỏ */}
        <div className="shopee-card-actions">
          <button
            type="button"
            className={`shopee-card-add-btn ${justAdded ? 'added' : ''}`}
            onClick={handleAddClick}
            aria-label={`${t('add_to_cart')} ${name}`}
          >
            {justAdded ? (
              <>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', border: '1px solid rgba(255,255,255,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckIcon size={11} color="#ffffff" />
                </span>
                <span>{t('added_to_cart', 'Đã thêm!')}</span>
              </>
            ) : (
              <>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CartIcon size={11} color="#ffffff" />
                </span>
                <span>{t('add_to_cart', 'Thêm vào giỏ')}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
