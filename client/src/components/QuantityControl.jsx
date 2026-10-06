import React from 'react';
import { PlusIcon, MinusIcon } from './OrdersIcons';
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

  const isDecDisabled = disabled || currentVal <= min;
  const isIncDisabled = disabled || currentVal >= max;

  return (
    <div className={`shopee-qty-control ${sizeClass}`}>
      <button
        type="button"
        className="shopee-qty-btn shopee-qty-btn-minus"
        onClick={handleDecrease}
        disabled={isDecDisabled}
        aria-label="Giảm số lượng"
      >
        <span style={{ width: size === 'sm' ? '16px' : '18px', height: size === 'sm' ? '16px' : '18px', borderRadius: '4px', background: isDecDisabled ? 'transparent' : 'rgba(241, 245, 249, 0.9)', border: isDecDisabled ? 'none' : '1px solid rgba(203, 213, 225, 0.4)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <MinusIcon size={size === 'sm' ? 10 : 12} color={isDecDisabled ? "#cbd5e1" : "#475569"} />
        </span>
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
        className="shopee-qty-btn shopee-qty-btn-plus"
        onClick={handleIncrease}
        disabled={isIncDisabled}
        aria-label="Tăng số lượng"
      >
        <span style={{ width: size === 'sm' ? '16px' : '18px', height: size === 'sm' ? '16px' : '18px', borderRadius: '4px', background: isIncDisabled ? 'transparent' : 'rgba(234, 88, 12, 0.12)', border: isIncDisabled ? 'none' : '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <PlusIcon size={size === 'sm' ? 10 : 12} color={isIncDisabled ? "#cbd5e1" : "#ea580c"} />
        </span>
      </button>
    </div>
  );
};

export default QuantityControl;
