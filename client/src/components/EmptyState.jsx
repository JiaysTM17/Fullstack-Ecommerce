import React from 'react';
import { ShoppingBagIcon } from './OrdersIcons';
import '../styles/feedback.css';

/**
 * EmptyState Component - Hiển thị trạng thái dữ liệu trống
 *
 * @param {Object} props
 * @param {string} [props.title='Không có dữ liệu'] - Tiêu đề thông báo
 * @param {string} [props.description='Hiện tại chưa có mục nào để hiển thị.'] - Mô tả chi tiết
 * @param {React.ReactNode} [props.icon] - Icon hoặc hình minh họa tùy chỉnh
 * @param {string} [props.actionText] - Nhãn nút hành động (ví dụ: 'Mua sắm ngay')
 * @param {React.ReactNode} [props.actionIcon] - Icon tùy chỉnh cho nút hành động
 * @param {function} [props.onAction] - Callback khi click nút hành động
 */
const EmptyState = ({
  title = 'Không có dữ liệu',
  description = 'Hiện tại chưa có mục nào để hiển thị.',
  icon,
  actionText,
  actionIcon,
  onAction
}) => {
  return (
    <div className="shopee-empty-state">
      <div className="shopee-empty-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '96px', height: '96px', borderRadius: '50%', background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(249, 115, 22, 0.04) 100%)', border: '1.5px solid rgba(234, 88, 12, 0.18)', boxShadow: '0 8px 24px rgba(234, 88, 12, 0.08)', margin: '0 auto 16px' }}>
        {icon || (
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '64px', height: '64px' }}>
            <circle cx="50" cy="50" r="46" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
            <rect x="24" y="36" width="52" height="42" rx="6" stroke="#cbd5e1" strokeWidth="2.5" fill="#ffffff" />
            <path d="M20 36L30 20H70L80 36H20Z" stroke="#94a3b8" strokeWidth="2.5" fill="#eff6ff" />
            <path d="M38 48C38 54.6274 43.3726 60 50 60C56.6274 60 62 54.6274 62 48" stroke="#ea580c" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="34" y1="27" x2="66" y2="27" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
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
          style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            {actionIcon || <ShoppingBagIcon size={13} color="#ffffff" />}
          </span>
          <span>{actionText}</span>
        </button>
      )}
    </div>
  );
};

export default EmptyState;
