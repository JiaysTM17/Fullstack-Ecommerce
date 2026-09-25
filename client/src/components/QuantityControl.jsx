import React from 'react';
import '../styles/cart.css';

/**
 * QuantityControl Component - Bộ điều chỉnh số lượng
 *
 * @param {Object} props
 * @param {number} [props.quantity=1] - Số lượng hiện tại
 * @param {number} [props.min=1] - Số lượng tối thiểu cho phép
 * @param {number} [props.max=999] - Số lượng tối đa cho phép (theo tồn kho)
 * @param {function} [props.onChange] - Callback khi số lượng thay đổi (newQuantity)
 * @param {function} [props.onIncrease] - Callback khi bấm nút tăng (+)
 * @param {function} [props.onDecrease] - Callback khi bấm nút giảm (-)
 * @param {boolean} [props.disabled=false] - Trạng thái vô hiệu hóa
 * @param {'sm'|'md'|'lg'} [props.size='md'] - Kích thước giao diện
 */
const QuantityControl = ({
  quantity = 1,
  min = 1,
  max = 999,
  onChange,
  onIncrease,
  onDecrease,
  disabled = false,
  size = 'md'
}) => {
  const currentVal = Number(quantity) || min;

  const handleDecrease = (e) => {
    e.stopPropagation();
    if (disabled || currentVal <= min) return;
    const nextVal = currentVal - 1;
    if (onDecrease) {
      onDecrease(nextVal);
    } else if (onChange) {
      onChange(nextVal);
    }
  };

  const handleIncrease = (e) => {
    e.stopPropagation();
    if (disabled || currentVal >= max) return;
    const nextVal = currentVal + 1;
    if (onIncrease) {
      onIncrease(nextVal);
    } else if (onChange) {
      onChange(nextVal);
    }
  };

  const handleInputChange = (e) => {
    const rawVal = e.target.value;
    if (rawVal === '') {
      if (onChange) onChange(min);
      return;
    }
    const parsed = parseInt(rawVal, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.max(min, Math.min(max, parsed));
      if (onChange) onChange(clamped);
    }
  };

  const sizeClass = size === 'sm' ? 'shopee-qty-sm' : size === 'lg' ? 'shopee-qty-lg' : 'shopee-qty-md';

  return (
    <div className={`shopee-qty-control ${sizeClass}`}>
      <button
        type="button"
        className="shopee-qty-btn"
        onClick={handleDecrease}
        disabled={disabled || currentVal <= min}
        aria-label="Giảm số lượng"
      >
        −
      </button>

      <input
        type="number"
        className="shopee-qty-input"
        value={currentVal}
        onChange={handleInputChange}
        disabled={disabled}
        min={min}
        max={max}
        aria-label="Số lượng sản phẩm"
      />

      <button
        type="button"
        className="shopee-qty-btn"
        onClick={handleIncrease}
        disabled={disabled || currentVal >= max}
        aria-label="Tăng số lượng"
      >
        +
      </button>
    </div>
  );
};

export default QuantityControl;
