import React, { useState } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { StarIcon, CheckIcon, ShieldCheckIcon, CameraIcon, AlertCircleIcon, CloseIcon, ArrowLeftIcon, PlusIcon, CoinIcon } from './OrdersIcons';

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
  0: 'Vui lòng chọn số sao',
  5: 'Tuyệt vời (Rất hài lòng)',
  4: 'Hài lòng',
  3: 'Bình thường',
  2: 'Không hài lòng',
  1: 'Rất tệ',
};

export default function ProductReviewModal({ order, onClose, onSubmitReview, onSubmit, inline = false }) {
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
  const [rating, setRating] = useState(0); // Initial 0: requires user interaction!
  const [sellerRating, setSellerRating] = useState(5);
  const [deliveryRating, setDeliveryRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState([]);
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
    setErrorMsg('');

    // Accept both mime-types and file extensions for robust PNG/JPG support
    const validFiles = files.filter(
      (f) => f.type.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(f.name)
    );

    if (validFiles.length === 0) {
      setErrorMsg('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, JPEG, WEBP).');
      return;
    }

    const newPhotos = validFiles.map((file, idx) => ({
      id: `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
      name: file.name,
      url: URL.createObjectURL(file),
      file,
    }));

    setReviewPhotos((prev) => [...prev, ...newPhotos].slice(0, 5));
    // Clear input value so same file can be re-selected if removed
    e.target.value = '';
  };

  const handleRemovePhoto = (id) => {
    setReviewPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');

    // Strict validation 1: User must select stars (rating > 0)
    if (!rating || rating < 1) {
      setErrorMsg('Vui lòng chọn số sao để đánh giá chất lượng sản phẩm (từ 1 đến 5 sao)!');
      return;
    }

    // Strict validation 2: User must write meaningful comment (at least 10 characters)
    const trimmedComment = comment.trim();
    if (!trimmedComment) {
      setErrorMsg('Vui lòng nhập nhận xét chi tiết (tối thiểu 10 ký tự) về chất lượng và độ hoàn thiện của sản phẩm!');
      return;
    }

    if (trimmedComment.length < 10) {
      setErrorMsg(`Nội dung nhận xét quá ngắn (${trimmedComment.length}/10 ký tự). Vui lòng nhập tối thiểu 10 ký tự để chia sẻ trải nghiệm thực tế và nhận +200 Shopee Xu!`);
      return;
    }

    setIsSubmitting(true);

    const reviewData = {
      orderId: order.orderId || order._id || order.id,
      productId: currentItem.productId || currentItem.id || 'prod_default',
      productName: currentItem.name || currentItem.title,
      productImage: currentItem.image,
      shopName: order.shopName || 'Shopee Mall',
      rating,
      sellerRating,
      deliveryRating,
      tags: selectedTags,
      comment: trimmedComment,
      photos: reviewPhotos.map((p) => p.name),
      isAnonymous,
      createdAt: new Date().toISOString(),
      verifiedPurchase: true,
      coinsRewarded: 200,
    };

    const submitCallback = onSubmitReview || onSubmit;
    if (typeof submitCallback === 'function') {
      submitCallback(reviewData);
    }
    setIsSubmitting(false);
  };

  const reviewContent = (
    <div
      className={inline ? 'review-inline-container' : 'anim-modal-content'}
      style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: inline ? '12px' : '14px',
        width: '100%',
        maxWidth: inline ? '100%' : '540px',
        maxHeight: inline ? 'none' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: inline ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.28)',
        overflow: inline ? 'visible' : 'hidden',
        border: inline ? 'none' : '1px solid #e2e8f0',
        position: 'relative',
        margin: inline ? '0' : 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: inline ? '14px 18px' : '14px 20px',
          borderBottom: '1px solid #f1f5f9',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          background: '#f8fafc',
          borderRadius: inline ? '12px 12px 0 0' : 0,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {inline && (
            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={onClose}
              style={{
                borderRadius: '6px',
                padding: '0 10px',
                fontWeight: 600,
                fontSize: '11.5px',
                height: '28px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                marginRight: '6px',
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeftIcon size={11} color="#2563eb" />
              </span>
              <span>Quay lại</span>
            </button>
          )}
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 3px 8px rgba(245, 158, 11, 0.3)',
              flexShrink: 0,
            }}
          >
            <StarIcon size={18} color="#ffffff" filled />
          </div>
          <div>
            <h3
              style={{
                margin: 0,
                fontSize: '15px',
                fontWeight: 800,
                color: '#0f172a',
                letterSpacing: '-0.2px',
              }}
            >
              Đánh Giá Sản Phẩm
            </h3>
            <div style={{ fontSize: '11.5px', color: '#64748b' }}>
              Đơn hàng: <strong style={{ color: '#0f172a' }}>#{order.orderId || order._id}</strong> · Shop: {order.shopName || 'Shopee Mall'}
            </div>
          </div>
        </div>
          <button
            type="button"
            onClick={onClose}
            className="shopee-order-btn-outline"
            style={{
              width: '28px',
              height: '28px',
              padding: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
            }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(100, 116, 139, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloseIcon size={12} color="#64748b" />
            </span>
          </button>
        </div>

        {/* Form Body with Smooth Scroll */}
        <form
          onSubmit={handleSubmit}
          style={{
            padding: '16px 20px',
            overflowY: 'auto',
            flex: 1,
            boxSizing: 'border-box',
          }}
        >
          {/* Shopee Xu Reward Banner */}
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '14px',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #fef08a 0%, #fde047 100%)',
                border: '1.5px solid #f59e0b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(245, 158, 11, 0.25)',
                flexShrink: 0,
              }}
            >
              <CoinIcon size={18} color="#b45309" />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '13px', color: '#1e3a8a' }}>
                Thưởng Ngay +200 Shopee Xu Vào Ví!
              </div>
              <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '1px' }}>
                Đánh giá có tâm từ 10 ký tự giúp cộng đồng và nhận ngay 200 Shopee Xu trừ tiền trực tiếp.
              </div>
            </div>
          </div>

          {/* Item Selector if multi-item */}
          {items.length > 1 && (
            <div style={{ marginBottom: '12px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' }}>
                Chọn sản phẩm muốn đánh giá:
              </label>
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '4px' }}>
                {items.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedItemIndex(idx)}
                    style={{
                      border: selectedItemIndex === idx ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      background: selectedItemIndex === idx ? '#eff6ff' : '#ffffff',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      fontSize: '11.5px',
                      fontWeight: selectedItemIndex === idx ? 700 : 500,
                      color: selectedItemIndex === idx ? '#2563eb' : '#475569',
                      flexShrink: 0,
                    }}
                  >
                    <img
                      src={item.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100'}
                      alt={item.name}
                      style={{ width: '22px', height: '22px', objectFit: 'cover', borderRadius: '4px' }}
                    />
                    <span style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
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
              gap: '10px',
              padding: '10px 12px',
              background: '#f8fafc',
              borderRadius: '8px',
              marginBottom: '14px',
              alignItems: 'center',
              border: '1px solid #e2e8f0',
            }}
          >
            <img
              src={currentItem.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200'}
              alt={currentItem.name}
              style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #cbd5e1', flexShrink: 0 }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {currentItem.name || currentItem.title}
              </div>
              <div style={{ fontSize: '12px', color: '#2563eb', fontWeight: 700, marginTop: '2px' }}>
                {formatCurrency(currentItem.price || 0)} · <span style={{ color: '#64748b', fontWeight: 500 }}>Số lượng: x{currentItem.quantity || 1}</span>
              </div>
            </div>
          </div>

          {/* Star Rating Section (Mandatory: Rating > 0 required) */}
          <div
            style={{
              textAlign: 'center',
              marginBottom: '14px',
              padding: '12px',
              background: rating === 0 ? '#fefce8' : '#fafaf9',
              borderRadius: '8px',
              border: `1.5px solid ${rating === 0 ? '#fde047' : '#f1f5f9'}`,
              transition: 'all 0.2s ease',
            }}
          >
            <div style={{ fontSize: '12.5px', fontWeight: 700, marginBottom: '4px', color: '#0f172a' }}>
              Chất Lượng Sản Phẩm <span style={{ color: '#ef4444' }}>*</span>
            </div>
            <div style={{ display: 'inline-flex', gap: '6px', fontSize: '30px', cursor: 'pointer' }}>
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
                    title={`${star} sao`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      cursor: 'pointer',
                      transform: isLit ? 'scale(1.15)' : 'scale(1)',
                      transition: 'transform 0.12s ease',
                      color: isLit ? '#f59e0b' : '#cbd5e1',
                    }}
                  >
                    <StarIcon size={26} color={isLit ? '#f59e0b' : '#cbd5e1'} />
                  </span>
                );
              })}
            </div>
            <div
              style={{
                fontSize: '12px',
                fontWeight: 700,
                color: rating === 0 ? '#b45309' : '#d97706',
                marginTop: '4px',
              }}
            >
              {STAR_LABELS[hoverRating || rating]}
            </div>
          </div>

          {/* Quick Tags Selection */}
          <div style={{ marginBottom: '14px' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '6px', display: 'block' }}>
              Tiêu chí nổi bật bạn ấn tượng nhất (Tùy chọn):
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
              {QUICK_TAGS.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleToggleTag(tag)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '16px',
                      fontSize: '11.5px',
                      fontWeight: active ? 700 : 500,
                      border: active ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      background: active ? '#eff6ff' : '#ffffff',
                      color: active ? '#2563eb' : '#64748b',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    {active ? <CheckIcon size={11} color="#2563eb" /> : <PlusIcon size={11} color="#64748b" />}
                    <span>{tag}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Comment Textarea (Mandatory: Min 10 chars) */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Nhận xét chi tiết sản phẩm <span style={{ color: '#ef4444' }}>* (Tối thiểu 10 ký tự)</span>:
              </label>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: comment.trim().length >= 10 ? '#16a34a' : comment.trim().length > 0 ? '#d97706' : '#64748b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                {comment.trim().length >= 10 ? (
                  <>
                    <CheckIcon size={11} color="#16a34a" />
                    <span>Đạt yêu cầu ({comment.trim().length} ký tự)</span>
                  </>
                ) : (
                  `${comment.trim().length}/10 ký tự`
                )}
              </span>
            </div>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setErrorMsg('');
              }}
              placeholder="Chia sẻ trải nghiệm thực tế về chất lượng vải, đường may, kích thước, hiệu năng sản phẩm để giúp cộng đồng người mua nhé..."
              style={{
                width: '100%',
                padding: '8px 10px',
                borderRadius: '6px',
                border: `1px solid ${comment.trim().length > 0 && comment.trim().length < 10 ? '#fca5a5' : '#cbd5e1'}`,
                fontFamily: 'inherit',
                fontSize: '12px',
                resize: 'none',
                outline: 'none',
                boxSizing: 'border-box',
              }}
            />
          </div>

          {/* Review Photos Upload - Fully supports PNG, JPG, JPEG, WEBP */}
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569' }}>
                Hình ảnh thực tế khi nhận hàng (Tùy chọn):
              </label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>
                Hỗ trợ PNG, JPG, WEBP ({reviewPhotos.length}/5)
              </span>
            </div>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              {reviewPhotos.map((photo) => (
                <div
                  key={photo.id}
                  style={{
                    position: 'relative',
                    width: '54px',
                    height: '54px',
                    borderRadius: '6px',
                    overflow: 'hidden',
                    border: '1px solid #cbd5e1',
                  }}
                >
                  <img src={photo.url} alt={photo.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button
                    type="button"
                    onClick={() => handleRemovePhoto(photo.id)}
                    title="Xóa ảnh"
                    style={{
                      position: 'absolute',
                      top: '2px',
                      right: '2px',
                      background: 'rgba(15, 23, 42, 0.75)',
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
                      padding: 0,
                    }}
                  >
                    <CloseIcon size={10} color="#ffffff" />
                  </button>
                </div>
              ))}
              {reviewPhotos.length < 5 && (
                <label
                  style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '8px',
                    border: '1.5px dashed #3b82f6',
                    background: 'rgba(59, 130, 246, 0.08)',
                    color: '#2563eb',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  title="Tải thêm ảnh từ thiết bị"
                >
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#ffffff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 1px 3px rgba(37, 99, 235, 0.2)', marginBottom: '2px' }}>
                    <CameraIcon size={13} color="#2563eb" />
                  </span>
                  <span style={{ fontSize: '9.5px', color: '#1d4ed8' }}>+ Thêm ảnh</span>
                  <input
                    type="file"
                    multiple
                    accept="image/png,image/jpeg,image/jpg,image/webp,image/*,.png,.jpg,.jpeg,.webp"
                    style={{ display: 'none' }}
                    onChange={handleAddPhoto}
                  />
                </label>
              )}
            </div>
          </div>

          {/* Anonymous toggle */}
          <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="checkbox"
              id="anonymousReview"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              style={{ cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <label htmlFor="anonymousReview" style={{ fontSize: '11.5px', color: '#475569', cursor: 'pointer' }}>
              Đánh giá ẩn danh (Tên tài khoản sẽ hiển thị dạng n*****a trên trang sản phẩm)
            </label>
          </div>

          {/* Inline Validation Error Banner right above submit button */}
          {errorMsg && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#b91c1c',
                padding: '8px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                marginBottom: '12px',
                lineHeight: 1.4,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <span style={{ width: '20px', height: '20px', borderRadius: '5px', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <AlertCircleIcon size={13} color="#dc2626" />
              </span>
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Modal Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', paddingTop: '10px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={onClose}
              disabled={isSubmitting}
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                borderRadius: '6px',
                fontWeight: 600,
                height: '32px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(100, 116, 139, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloseIcon size={11} color="#64748b" />
              </span>
              <span>Hủy Bỏ</span>
            </button>
            <button
              type="submit"
              className="shopee-order-btn-primary"
              disabled={isSubmitting}
              style={{
                padding: '6px 18px',
                fontSize: '12px',
                borderRadius: '6px',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                height: '32px',
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <StarIcon size={12} color="#fef08a" filled />
              </span>
              {isSubmitting ? 'Đang gửi...' : 'Gửi Đánh Giá (+200 Điểm Xu)'}
            </button>
          </div>
        </form>
      </div>
  );

  if (inline) {
    return (
      <div style={{ width: '100%', animation: 'fadeIn 0.25s ease-out' }}>
        {reviewContent}
      </div>
    );
  }

  return (
    <div
      className="shopee-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400, // Higher than OrderDetailModal (1100)
        background: 'rgba(15, 23, 42, 0.68)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 14px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        animation: 'modalOverlayFadeIn 0.2s ease-out forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {reviewContent}
    </div>
  );
}
