import React, { useState } from 'react';
import QuantityControl from './QuantityControl';
import '../styles/cart.css';

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

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200&q=80';

/**
 * CartItem Component - Một dòng sản phẩm trong giỏ hàng
 *
 * @param {Object} props
 * @param {Object} props.item - Thông tin dòng sản phẩm
 * @param {string} [props.item.productId] - ID sản phẩm
 * @param {string} props.item.name - Tên sản phẩm
 * @param {number} props.item.price - Đơn giá sản phẩm
 * @param {string} [props.item.image] - Ảnh sản phẩm
 * @param {number} props.item.quantity - Số lượng sản phẩm
 * @param {number} [props.item.stock] - Tồn kho tối đa
 * @param {function} [props.onIncrease] - Callback tăng số lượng: (item)
 * @param {function} [props.onDecrease] - Callback giảm số lượng: (item)
 * @param {function} [props.onQuantityChange] - Callback đổi số lượng trực tiếp: (item, newQuantity)
 * @param {function} [props.onRemove] - Callback xóa sản phẩm khỏi giỏ: (item)
 * @param {function} [props.onItemClick] - Callback click vào ảnh/tên sản phẩm để xem chi tiết
 * @param {function} [props.formatCurrency] - Hàm format tiền tùy biến
 */
const CartItem = ({
  item = {},
  onIncrease,
  onDecrease,
  onQuantityChange,
  onRemove,
  onItemClick,
  formatCurrency = defaultFormatCurrency
}) => {
  const [imgSrc, setImgSrc] = useState(item?.image || FALLBACK_IMAGE);

  if (!item || !item.name) {
    return null;
  }

  const {
    productId,
    _id,
    id,
    name,
    price = 0,
    quantity = 1,
    stock = 999
  } = item;

  const currentId = productId || _id || id;
  const subtotal = price * quantity;

  const handleProductClick = (e) => {
    if (onItemClick) {
      onItemClick(item, e);
    }
  };

  const handleIncrease = () => {
    if (onIncrease) {
      onIncrease(item);
    } else if (onQuantityChange) {
      onQuantityChange(item, quantity + 1);
    }
  };

  const handleDecrease = () => {
    if (quantity <= 1) return;
    if (onDecrease) {
      onDecrease(item);
    } else if (onQuantityChange) {
      onQuantityChange(item, quantity - 1);
    }
  };

  const handleQtyChange = (newQty) => {
    if (onQuantityChange) {
      onQuantityChange(item, newQty);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (onRemove) {
      onRemove(item);
    }
  };

  return (
    <div className="shopee-cart-item" data-product-id={currentId}>
      {/* Cột sản phẩm: Ảnh + Tên */}
      <div
        className="shopee-cart-item-product"
        onClick={handleProductClick}
        role={onItemClick ? 'button' : undefined}
        tabIndex={onItemClick ? 0 : undefined}
      >
        <div className="shopee-cart-item-image-wrapper">
          <img
            src={imgSrc}
            alt={name}
            className="shopee-cart-item-image"
            onError={() => setImgSrc(FALLBACK_IMAGE)}
          />
        </div>
        <div className="shopee-cart-item-info">
          <h4 className="shopee-cart-item-name" title={name}>
            {name}
          </h4>
          {stock && stock < 20 && (
            <span className="shopee-cart-item-stock-tag">
              Chỉ còn {stock} sản phẩm
            </span>
          )}
        </div>
      </div>

      {/* Cột đơn giá (Desktop) */}
      <div className="shopee-cart-item-price">
        <span>{formatCurrency(price)}</span>
      </div>

      {/* Cột số lượng */}
      <div className="shopee-cart-item-quantity">
        <QuantityControl
          quantity={quantity}
          min={1}
          max={stock || 999}
          onIncrease={handleIncrease}
          onDecrease={handleDecrease}
          onChange={handleQtyChange}
          size="sm"
        />
      </div>

      {/* Cột số tiền (subtotal) */}
      <div className="shopee-cart-item-subtotal">
        <span>{formatCurrency(subtotal)}</span>
      </div>

      {/* Cột thao tác xóa */}
      <div className="shopee-cart-item-actions">
        <button
          type="button"
          className="shopee-cart-item-remove-btn"
          onClick={handleRemove}
          aria-label={`Xóa ${name} khỏi giỏ`}
        >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
          <span>Xóa</span>
        </button>
      </div>
    </div>
  );
};

export default CartItem;
