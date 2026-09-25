import React, { useState } from 'react';
import '../styles/product.css';

/**
 * Utility format tiền tệ VND
 */
const defaultFormatCurrency = (value) => {
  if (typeof value !== 'number' || isNaN(value)) return '0 ₫';
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0
  }).format(value);
};

// Fallback ảnh placeholder khi link ảnh bị lỗi hoặc rỗng
const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80';

/**
 * ProductCard Component - Shopee Card
 *
 * @param {Object} props
 * @param {Object} props.product - Thông tin sản phẩm
 * @param {string} props.product._id - ID sản phẩm
 * @param {string} props.product.name - Tên sản phẩm
 * @param {number} props.product.price - Giá bán hiện tại
 * @param {number} [props.product.originalPrice] - Giá gốc trước giảm
 * @param {string} [props.product.image] - URL ảnh sản phẩm
 * @param {number} [props.product.rating] - Đánh giá sao (0-5)
 * @param {number} [props.product.sold] - Số lượng đã bán
 * @param {string} [props.product.brand] - Thương hiệu
 * @param {boolean} [props.product.isMall] - Nhãn Shopee Mall
 * @param {function} [props.onAddToCart] - Callback khi click nút thêm vào giỏ (product, e)
 * @param {function} [props.onViewDetail] - Callback khi click xem chi tiết sản phẩm (product, e)
 * @param {function} [props.formatCurrency] - Hàm tùy chỉnh định dạng tiền tệ
 */
const ProductCard = ({
  product = {},
  onAddToCart,
  onViewDetail,
  formatCurrency = defaultFormatCurrency
}) => {
  const [imgSrc, setImgSrc] = useState(product?.image || FALLBACK_IMAGE);

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
    isMall = false
  } = product;

  // Tính phần trăm giảm giá nếu có
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
    e.stopPropagation(); // Không trigger click vào xem chi tiết
    if (onAddToCart) {
      onAddToCart(product, e);
    }
  };

  const handleImageError = () => {
    setImgSrc(FALLBACK_IMAGE);
  };

  return (
    <div
      className="shopee-product-card"
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && handleCardClick(e)}
      data-id={_id || id}
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

        {/* Huy hiệu Shopee Mall nếu có */}
        {isMall && <span className="shopee-mall-badge">Mall</span>}

        {/* Huy hiệu giảm giá góc trên phải */}
        {hasDiscount && (
          <div className="shopee-discount-badge">
            <span className="shopee-discount-percent">-{discountPercent}%</span>
            <span className="shopee-discount-label">GIẢM</span>
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

        {/* Thông tin phụ: Rating và Đã bán */}
        <div className="shopee-card-meta">
          <div className="shopee-card-rating">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
            <span>{Number(rating).toFixed(1)}</span>
          </div>
          <span className="shopee-card-sold">
            {sold > 1000 ? `Đã bán ${(sold / 1000).toFixed(1)}k` : `Đã bán ${sold}`}
          </span>
        </div>

        {/* Nút thêm vào giỏ */}
        <div className="shopee-card-actions">
          <button
            type="button"
            className="shopee-card-add-btn"
            onClick={handleAddClick}
            aria-label={`Thêm ${name} vào giỏ hàng`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            <span>Thêm vào giỏ</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
