import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { StarIcon, CheckIcon, ShieldCheckIcon } from './OrdersIcons';

const QUICK_TAGS = [
  'Đúng với mô tả',
  'Chất lượng sản phẩm tuyệt vời',
  'Đóng gói rất đẹp & chắc chắn',
  'Giao hàng siêu nhanh',
  'Shop phục vụ rất chu đáo',
  'Giá cả hợp lý, đáng tiền',
  'Đáng đồng tiền bát gạo',
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

  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [
    {
      name: order.productName || 'Sản phẩm mua sắm',
      price: order.total || 0,
      quantity: 1,
      image: order.productImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200',
    }
  ];

  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState(['Đúng với mô tả', 'Chất lượng sản phẩm tuyệt vời']);
  const [comment, setComment] = useState('');
  const [reviewPhotos, setReviewPhotos] = useState([]);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentItem = items[selectedItemIndex] || items[0] || {};

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleAddPhoto = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const newPhotos = files.map((file, idx) => ({
      id: `${Date.now()}-${idx}`,
      name: file.name,
      url: URL.createObjectURL(file),
    }));
    setReviewPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
  };

  const handleRemovePhoto = (id) => {
    setReviewPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (rating < 1) {
      setErrorMsg('Vui lòng chọn số sao đánh giá sản phẩm.');
      return;
    }

    if (comment.trim() && comment.trim().length < 5) {
      setErrorMsg('Nhận xét vui lòng nhập tối thiểu 5 ký tự.');
      return;
    }

    setIsSubmitting(true);
    const reviewData = {
      orderId: order.orderId,
      productId: currentItem.productId || currentItem.id || 'prod_default',
      productName: currentItem.name || currentItem.title,
      productImage: currentItem.image,
      shopName: order.shopName,
      rating,
      tags: selectedTags,
      comment: comment.trim() || 'Sản phẩm rất tốt, giao hàng nhanh, đúng như mô tả!',
      photos: reviewPhotos.map((p) => p.name),
      isAnonymous,
      createdAt: new Date().toISOString(),
      verifiedPurchase: true,
      coinsRewarded: 200,
    };

    setTimeout(() => {
      onSubmitReview(reviewData);
      setIsSubmitting(false);
    }, 280);
  };

  return (
    <div
      className="shopee-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        animation: 'modalOverlayFadeIn 0.2s ease-out forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="anim-modal-content"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '580px',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.28)',
          overflow: 'hidden',
          border: '1px solid #e2e8f0',
          position: 'relative',
          margin: 'auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-light, #f1f5f9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-muted, #f8fafc)',
            flexShrink: 0,
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '18px',
                fontWeight: 800,
                color: '#0f172a',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <StarIcon size={20} color="#f59e0b" filled /> Đánh Giá Sản Phẩm
            </h3>
            <span style={{ fontSize: '12.5px', color: '#64748b' }}>
              Đơn hàng: <strong>#{order.orderId}</strong> · Shop: {order.shopName || 'Shopee Mall'}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shopee-modal-close"
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#64748b',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Form Body with Smooth Scroll */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            boxSizing: 'border-box',
          }}
        >
          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '12.5px',
                fontWeight: 600,
                marginBottom: '14px',
              }}
            >
              {errorMsg}
            </div>
          )}

          {/* Shopee Xu Reward Banner - Royal Blue & Amber Accent */}
          <div
            style={{
              background: 'linear-gradient(135deg, #eff6ff 0%, #fef3c7 100%)',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              marginBottom: '18px',
            }}
          >
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#fef08a',
                border: '2px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.3)',
              }}
            >
              <StarIcon size={20} color="#d97706" filled />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '13.5px', color: '#1e3a8a' }}>
                Thưởng Ngay +200 Shopee Xu Vào Ví!
              </div>
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '1px' }}>
                Đánh giá chất lượng giúp cộng đồng người mua và nhận ngay 200 Xu dùng trừ tiền trực tiếp cho đơn hàng tiếp theo.
              </div>
            </div>
          </div>

          {/* Item Selector if multi-item */}
          {items.length > 1 && (
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12.5px', fontWeight: 700, color: '#475569', marginBottom: '8px', display: 'block' }}>
                Chọn sản phẩm muốn đánh giá:
              </label>
              <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '6px' }}>
                {items.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedItemIndex(idx)}
                    style={{
                      border: selectedItemIndex === idx ? '2px solid #2563eb' : '1px solid #cbd5e1',
                      background: selectedItemIndex === idx ? '#eff6ff' : '#ffffff',
                      borderRadius: '8px',
                      padding: '6px 10px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      cursor: 'pointer',
                      fontSize: '12px',
                      fontWeight: selectedItemIndex === idx ? 700 : 500,
                      color: selectedItemIndex === idx ? '#2563eb' : '#475569',
                      transition: 'all 0.15s ease',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={item.name}
                      style={{ width: '28px', height: '28px', objectFit: 'cover', borderRadius: '4px' }}
                    />
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
              marginBottom: '18px',
              alignItems: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <img
              src={currentItem.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
              alt={currentItem.name}
              style={{ width: '50px', height: '50px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #cbd5e1', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentItem.name || currentItem.title}
              </div>
              <div style={{ fontSize: '12.5px', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>
                {formatCurrency(currentItem.price || 0)} · <span style={{ color: '#64748b', fontWeight: 500 }}>Số lượng: x{currentItem.quantity || 1}</span>
              </div>
            </div>
          </div>

          {/* Star Rating Section */}
          <div style={{ textAlign: 'center', marginBottom: '20px', padding: '12px', background: '#fafaf9', borderRadius: '10px', border: '1px solid #f5f5f4' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 700, marginBottom: '6px', color: 'var(--text-primary)' }}>
              Chất Lượng Sản Phẩm
            </div>
            <div style={{ display: 'inline-flex', gap: '8px', fontSize: '34px', cursor: 'pointer' }}>
              {[1, 2, 3, 4, 5].map((star) => {
                const isLit = (hoverRating || rating) >= star;
                return (
                  <span
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => {
                      setRating(star);
                      setErrorMsg('');
                    }}
                    style={{
                      color: isLit ? '#f59e0b' : '#cbd5e1',
                      transition: 'transform 0.12s ease, color 0.12s ease',
                      transform: isLit ? 'scale(1.15)' : 'scale(1)',
                      userSelect: 'none',
                      lineHeight: 1,
                    }}
                    title={`${star} sao`}
                  >
                    ★
                  </span>
                );
              })}
            </div>
            <div style={{ fontSize: '13px', fontWeight: 800, color: '#d97706', marginTop: '6px' }}>
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
                      border: active ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      background: active ? '#eff6ff' : '#ffffff',
                      color: active ? '#2563eb' : '#64748b',
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

          {/* Review Photos Upload */}
          <div style={{ marginBottom: '18px' }}>
            <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' }}>
              Hình ảnh thực tế khi nhận hàng (Tùy chọn):
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {reviewPhotos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    position: 'relative',
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(0,0,0,0.6)',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '50%',
                      width: '16px',
                      height: '16px',
                      fontSize: '9px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
              {reviewPhotos.length < 5 && (
                <label
                  style={{
                    width: '60px',
                    height: '60px',
                    borderRadius: '8px',
                    border: '1px dashed #2563eb',
                    background: '#eff6ff',
                    color: '#2563eb',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  <span>📷</span>
                  <span>+ Ảnh</span>
                  <input type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleAddPhoto} />
                </label>
              )}
            </div>
          </div>

          {/* Comment Textarea */}
          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 700, color: '#475569' }}>
                Nhận xét chi tiết:
              </label>
              <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                {comment.length} ký tự
              </span>
            </div>
            <textarea
              className="shopee-form-input"
              rows={3}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Chia sẻ trải nghiệm thực tế về chất lượng sản phẩm, độ bền, tốc độ giao hàng SPX để giúp người mua khác nhé..."
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontFamily: 'inherit',
                fontSize: '13px',
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Anonymous toggle */}
          <div style={{ marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="anonymousReview"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <label htmlFor="anonymousReview" style={{ fontSize: '12.5px', color: '#475569', cursor: 'pointer' }}>
              Đánh giá ẩn danh (Tên tài khoản sẽ hiển thị dạng n*****a trên trang sản phẩm)
            </label>
          </div>

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '14px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '7px 18px',
                fontSize: '12.5px',
                borderRadius: '8px',
                fontWeight: 600,
              }}
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              className="shopee-order-btn-primary"
              disabled={isSubmitting}
              style={{
                padding: '7px 22px',
                fontSize: '12.5px',
                borderRadius: '8px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <StarIcon size={14} color="#fef08a" filled />
              {isSubmitting ? 'Đang gửi đánh giá...' : 'Gửi Đánh Giá (+200 Shopee Xu)'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
