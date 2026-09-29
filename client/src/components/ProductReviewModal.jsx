import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';

const QUICK_TAGS = [
  'Đúng với mô tả',
  'Chất lượng sản phẩm tuyệt vời',
  'Đóng gói rất đẹp & chắc chắn',
  'Giao hàng siêu nhanh',
  'Shop phục vụ rất chu đáo',
  'Giá cả hợp lý, đáng tiền',
];

const STAR_LABELS = {
  5: 'Tuyệt vời (Rất hài lòng)',
  4: 'Hài lòng',
  3: 'Bình thường',
  2: 'Không hài lòng',
  1: 'Rất tệ',
};

export default function ProductReviewModal({ order, onClose, onSubmitReview }) {
  if (!order) return null;

  const items = order.items || [];
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['Đúng với mô tả', 'Chất lượng sản phẩm tuyệt vời']);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentItem = items[selectedItemIndex] || items[0] || {};

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1) return;

    setIsSubmitting(true);
    const reviewData = {
      orderId: order.orderId,
      productId: currentItem.productId || currentItem.id || 'prod_default',
      productName: currentItem.name || currentItem.title,
      productImage: currentItem.image,
      shopName: order.shopName,
      rating,
      tags: selectedTags,
      comment: comment.trim() || 'Sản phẩm rất tốt, giao hàng nhanh, đúng mô tả!',
      createdAt: new Date().toISOString(),
      verifiedPurchase: true,
      coinsRewarded: 200,
    };

    setTimeout(() => {
      onSubmitReview(reviewData);
      setIsSubmitting(false);
    }, 300);
  };

  return (
    <div
      className="shopee-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0, 0, 0, 0.72)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
        animation: 'modalOverlayFadeIn 0.2s ease-out forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="anim-modal-content"
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          border: '1px solid var(--border-medium, #e2e8f0)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid var(--border-light, #f1f5f9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-muted, #f8fafc)',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
              ⭐ Đánh Giá Sản Phẩm
            </h3>
            <span style={{ fontSize: '13px', color: 'var(--text-muted, #64748b)' }}>
              Đơn hàng: <strong>{order.orderId}</strong> · {order.shopName}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shopee-modal-close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '22px',
              cursor: 'pointer',
              color: 'var(--text-muted, #64748b)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
          {/* Shopee Xu Reward Banner */}
          <div
            style={{
              background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)',
              border: '1px solid #fed7aa',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '20px',
            }}
          >
            <span style={{ fontSize: '28px' }}>🪙</span>
            <div>
              <div style={{ fontWeight: 800, fontSize: '14px', color: '#c2410c' }}>
                Thưởng Ngay +200 Mini Xu!
              </div>
              <div style={{ fontSize: '12px', color: '#9a3412' }}>
                Đánh giá chất lượng giúp cộng đồng người mua và nhận xu giảm giá trực tiếp vào đơn sau.
              </div>
            </div>
          </div>

          {/* Item Selector if multi-item */}
          {items.length > 1 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary, #475569)', marginBottom: '8px', display: 'block' }}>
                Chọn sản phẩm muốn đánh giá:
              </label>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                {items.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedItemIndex(idx)}
                    style={{
                      border: selectedItemIndex === idx ? '2px solid var(--primary-color, #ea580c)' : '1px solid var(--border-medium, #cbd5e1)',
                      background: selectedItemIndex === idx ? 'var(--primary-light, #fff7ed)' : 'transparent',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: selectedItemIndex === idx ? 700 : 500,
                    }}
                  >
                    <img src={item.image} alt={item.name} style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }} />
                    <span style={{ maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Current Item Preview */}
          <div
            style={{
              display: 'flex',
              gap: '12px',
              padding: '12px',
              background: 'var(--bg-muted, #f8fafc)',
              borderRadius: '10px',
              marginBottom: '20px',
              alignItems: 'center',
            }}
          >
            <img
              src={currentItem.image || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200'}
              alt={currentItem.name}
              style={{ width: '54px', height: '54px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                {currentItem.name || currentItem.title}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--primary-color, #ea580c)', fontWeight: 600 }}>
                {formatCurrency(currentItem.price || 0)} · Số lượng: x{currentItem.quantity || 1}
              </div>
            </div>
          </div>

          {/* Star Rating Section */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, marginBottom: '8px', color: 'var(--text-primary)' }}>
              Chất Lượng Sản Phẩm
            </div>
            <div style={{ display: 'inline-flex', gap: '8px', fontSize: '36px', cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = (hoverRating || rating) >= star;
                return (
                  <span
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setRating(star)}
                    style={{
                      color: isLit ? '#f59e0b' : '#cbd5e1',
                      transition: 'transform 0.12s ease, color 0.12s ease',
                      transform: isLit ? 'scale(1.15)' : 'scale(1)',
                      userSelect: 'none',
                    }}
                    title={`${star} sao`}
                  >
                    ★
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', marginTop: '6px' }}>
              {STAR_LABELS[hoverRating || rating]}
            </div>
          </div>

          {/* Quick Tags Selection */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary, #475569)', marginBottom: '8px', display: 'block' }}>
              Tiêu chí nổi bật bạn ấn tượng nhất:
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {QUICK_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: active ? 700 : 500,
                      border: active ? '1.5px solid var(--primary-color, #ea580c)' : '1px solid var(--border-medium, #cbd5e1)',
                      background: active ? 'var(--primary-light, #fff7ed)' : 'var(--bg-card, #ffffff)',
                      color: active ? 'var(--primary-color, #ea580c)' : 'var(--text-secondary, #64748b)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {active ? '✓ ' : '+ '} {tag}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea */}
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary, #475569)', marginBottom: '8px', display: 'block' }}>
              Nhận xét chi tiết:
            </label>
            <textarea
              className="shopee-form-input"
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Hãy chia sẻ cảm nhận thực tế về chất lượng, đóng gói và thời gian giao hàng để giúp người mua khác nhé..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #cbd5e1)',
                fontFamily: 'inherit',
                fontSize: '13.5px',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', paddingTop: '12px', borderTop: '1px solid var(--border-light, #f1f5f9)' }}>
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              onClick={onClose}
              disabled={isSubmitting}
              style={{ padding: '10px 20px', fontSize: '13px' }}
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="shopee-btn shopee-btn-primary"
              disabled={isSubmitting}
              style={{
                padding: '10px 24px',
                fontSize: '13px',
                fontWeight: 700,
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.25)',
              }}
            >
              {isSubmitting ? 'Đang gửi đánh giá...' : '⭐ Gửi Đánh Giá (+200 Xu)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
