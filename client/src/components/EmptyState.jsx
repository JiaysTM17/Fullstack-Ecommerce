import React from 'react';
import '../styles/feedback.css';

/**
 * EmptyState Component - Hiển thị trạng thái dữ liệu trống
 *
 * @param {Object} props
 * @param {string} [props.title='Không có dữ liệu'] - Tiêu đề thông báo
 * @param {string} [props.description='Hiện tại chưa có mục nào để hiển thị.'] - Mô tả chi tiết
 * @param {React.ReactNode} [props.icon] - Icon hoặc hình minh họa tùy chỉnh
 * @param {string} [props.actionText] - Nhãn nút hành động (ví dụ: 'Mua sắm ngay')
 * @param {function} [props.onAction] - Callback khi click nút hành động
 */
const EmptyState = ({
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có mục nào để hiển thị.',
  icon,
  actionText,
  onAction
}) => {
  return (
    <div className="shopee-empty-state">
      <div className="shopee-empty-icon">
        {icon || (
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="20" y="35" width="60" height="45" rx="4" stroke="#cbd5e1" strokeWidth="3" fill="#f8fafc" />
            <path d="M15 35L26 18H74L85 35H15Z" stroke="#94a3b8" strokeWidth="3" fill="#eff6ff" />
            <path d="M38 48C38 54.6274 43.3726 60 50 60C56.6274 60 62 54.6274 62 48" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
            <line x1="32" y1="26" x2="68" y2="26" stroke="#93c5fd" strokeWidth="3" strokeLinecap="round" />
          </svg>
        )}
      </div>

      <h3 className="shopee-empty-title">{title}</h3>
      <p className="shopee-empty-desc">{description}</p>

      {actionText && (
        <button
          type="button"
          className="shopee-btn shopee-btn-primary shopee-empty-action-btn"
          onClick={onAction}
        >
          {actionText}
        </button>
      )}
    </div>
  );
};

export default EmptyState;
