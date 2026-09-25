import React from 'react';
import '../styles/feedback.css';

/**
 * Loading Component - Trạng thái đang tải dữ liệu
 *
 * @param {Object} props
 * @param {'spinner'|'skeleton-grid'|'skeleton-card'} [props.type='spinner'] - Loại loading
 * @param {string} [props.message='Đang tải dữ liệu...'] - Thông điệp loading
 * @param {number} [props.count=8] - Số lượng thẻ skeleton khi type là skeleton-grid
 * @param {boolean} [props.fullScreen=false] - Hiển thị che phủ toàn màn hình
 */
const Loading = ({
  type = 'spinner',
  message = 'Đang tải dữ liệu...',
  count = 8,
  fullScreen = false
}) => {
  // Skeleton Grid cho danh sách sản phẩm
  if (type === 'skeleton-grid') {
    const items = Array.from({ length: count });
    return (
      <div className="shopee-product-grid" style={{ width: '100%' }}>
        {items.map((_, idx) => (
          <div key={idx} className="shopee-skeleton-card">
            <div className="shopee-skeleton-image shopee-skeleton-shimmer" />
            <div className="shopee-skeleton-line shopee-skeleton-shimmer" />
            <div className="shopee-skeleton-line shopee-skeleton-line-short shopee-skeleton-shimmer" />
            <div className="shopee-skeleton-line shopee-skeleton-line-price shopee-skeleton-shimmer" />
          </div>
        ))}
      </div>
    );
  }

  // Skeleton Card đơn lẻ
  if (type === 'skeleton-card') {
    return (
      <div className="shopee-skeleton-card">
        <div className="shopee-skeleton-image shopee-skeleton-shimmer" />
        <div className="shopee-skeleton-line shopee-skeleton-shimmer" />
        <div className="shopee-skeleton-line shopee-skeleton-line-short shopee-skeleton-shimmer" />
        <div className="shopee-skeleton-line shopee-skeleton-line-price shopee-skeleton-shimmer" />
      </div>
    );
  }

  // Spinner xoay tròn mặc định
  return (
    <div className={`shopee-loading-wrapper ${fullScreen ? 'shopee-loading-fullscreen' : ''}`}>
      <div className="shopee-spinner" />
      {message && <div className="shopee-loading-text">{message}</div>}
    </div>
  );
};

export default Loading;
