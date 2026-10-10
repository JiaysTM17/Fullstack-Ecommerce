import React, { useState } from 'react';
import { submitOrderCsatFeedbackAPI } from '../services/api';
import { useToast } from '../context/ToastContext';
import {
  StarIcon,
  CloseIcon,
  CheckIcon,
  TruckIcon,
  UserIcon,
  SparklesIcon,
} from './OrdersIcons';

export default function DeliveryCsatFeedbackModal({ order, onClose, onSuccess }) {
  const [rating, setRating] = useState(5);
  const [deliverySpeedRating, setDeliverySpeedRating] = useState(5);
  const [courierAttitudeRating, setCourierAttitudeRating] = useState(5);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { showToast } = useToast();

  if (!order) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      const res = await submitOrderCsatFeedbackAPI(order.orderId || order._id, {
        rating,
        deliverySpeedRating,
        courierAttitudeRating,
        comment: comment.trim(),
      });
      showToast('Cảm ơn bạn đã đánh giá dịch vụ giao hàng SPX Express!', 'success');
      onSuccess?.(res?.data?.csatFeedback || res?.csatFeedback);
      onClose();
    } catch (err) {
      showToast(err.message || 'Lỗi gửi đánh giá, vui lòng thử lại', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStarSelector = (currentVal, setterFn, label, icon) => (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
        {icon}
        <span style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>{label}</span>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => setterFn(star)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              transition: 'transform 0.15s ease',
            }}
            title={`${star} sao`}
          >
            <StarIcon
              size={24}
              color={star <= currentVal ? '#f59e0b' : '#cbd5e1'}
              fill={star <= currentVal ? '#f59e0b' : 'none'}
            />
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100000,
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '460px',
          padding: '24px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          overflow: 'hidden',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'rgba(234, 88, 12, 0.12)',
                border: '1px solid rgba(234, 88, 12, 0.25)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <TruckIcon size={16} color="#ea580c" />
            </span>
            <div>
              <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                Đánh Giá Giao Vận SPX
              </h3>
              <div style={{ fontSize: '11.5px', color: '#64748b' }}>
                Đơn hàng #{order.orderId || order._id}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px' }}
          >
            <CloseIcon size={16} color="#64748b" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {renderStarSelector(
            rating,
            setRating,
            'Trải nghiệm giao hàng tổng quan',
            <SparklesIcon size={14} color="#ea580c" />
          )}

          {renderStarSelector(
            deliverySpeedRating,
            setDeliverySpeedRating,
            'Tốc độ giao nhận bưu kiện',
            <TruckIcon size={14} color="#0284c7" />
          )}

          {renderStarSelector(
            courierAttitudeRating,
            setCourierAttitudeRating,
            'Thái độ phục vụ của bưu tá',
            <UserIcon size={14} color="#10b981" />
          )}

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 700, color: '#334155', marginBottom: '6px' }}>
              Nhận xét chi tiết (tùy chọn)
            </label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Chia sẻ thêm về trải nghiệm nhận hàng, gọi điện thoại trước khi giao..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                outline: 'none',
                resize: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              onClick={onClose}
              style={{ fontSize: '13px' }}
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="shopee-btn shopee-btn-primary"
              style={{ fontSize: '13px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <CheckIcon size={12} color="#ffffff" />
              <span>{isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
