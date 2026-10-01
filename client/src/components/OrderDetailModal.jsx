import React, { useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';

export default function OrderDetailModal({
  order,
  isOpen = true,
  onClose,
  onOpenChat,
  onOpenTracking,
  onOpenLiveMap,
  onOpenInvoice,
  onBuyAgainItem,
  onReorderWhole,
}) {
  if (isOpen === false || !order) return null;

  // Safe context resolution with fallbacks
  let showToast = () => {};
  try {
    const toastContext = useToast();
    if (toastContext?.showToast) showToast = toastContext.showToast;
  } catch {}

  let t = (key, fallback) => fallback || key;
  try {
    const langContext = useLanguage();
    if (langContext?.t) t = langContext.t;
  } catch {}

  const handleOpenTracking = onOpenTracking || onOpenLiveMap;

  // Escape key listener to dismiss modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // 1-Click Clipboard Copy with Toast Feedback
  const handleCopy = (text, label) => {
    if (!text) return;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => showToast(`Đã sao chép ${label}: ${text}`, 'success'))
        .catch(() => fallbackCopy(text, label));
    } else {
      fallbackCopy(text, label);
    }
  };

  const fallbackCopy = (text, label) => {
    try {
      const el = document.createElement('textarea');
      el.value = text;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      showToast(`Đã sao chép ${label}: ${text}`, 'success');
    } catch {
      showToast(`Đã sao chép: ${text}`, 'info');
    }
  };

  const orderId = String(order.orderId || order._id || order.id || '');
  const trackingCode = order.trackingCode || (orderId ? `SPX-VN-${orderId}` : 'SPX-VN-84729104');
  const carrierName = order.courier?.carrier || order.carrier || 'SPX Express (Shopee Xpress)';
  const hotline = '1900 1221';

  // Format Order Date
  const formattedDate = (() => {
    const raw = order.createdAt || order.orderDate;
    if (!raw) return 'Hôm nay';
    try {
      const d = new Date(raw);
      if (!isNaN(d.getTime())) {
        return d.toLocaleString('vi-VN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        });
      }
    } catch {}
    return String(raw);
  })();

  // Lifecycle Stage Resolution
  const getActiveStep = () => {
    if (order.status === 'cancelled') return 0;
    if (order.status === 'completed' || order.status === 'delivered') return 4;
    if (order.status === 'shipping' || order.status === 'delivering') return 3;
    if (order.status === 'confirmed') return 2;
    if (order.status === 'pending') return 1;
    return Number(order.stepIndex) || 1;
  };
  const activeStep = getActiveStep();

  const isShipping = order.status === 'shipping' || order.status === 'delivering' || activeStep === 3;
  const isCompleted = order.status === 'completed' || order.status === 'delivered' || activeStep === 4;
  const isCancelled = order.status === 'cancelled' || activeStep === 0;

  // Status Badge Colors & Labels
  const getStatusBadge = () => {
    if (isCancelled) {
      return { text: order.statusText || 'Đã hủy', className: 'status-cancelled', bg: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' };
    }
    if (isCompleted) {
      return { text: order.statusText || 'Giao thành công', className: 'status-completed', bg: 'rgba(16, 185, 129, 0.15)', color: '#10b981' };
    }
    if (isShipping) {
      return { text: order.statusText || 'Đang giao hàng', className: 'status-shipping', bg: 'rgba(2, 132, 199, 0.15)', color: '#0284c7' };
    }
    if (order.status === 'confirmed') {
      return { text: order.statusText || 'Đã xác nhận', className: 'status-confirmed', bg: 'rgba(59, 130, 246, 0.15)', color: '#2563eb' };
    }
    return { text: order.statusText || 'Chờ xác nhận', className: 'status-pending', bg: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b' };
  };
  const statusBadge = getStatusBadge();

  // Recipient Card Information
  const recipientName =
    order.shippingAddress?.fullName ||
    order.customerName ||
    order.recipientName ||
    order.customer?.fullName ||
    order.customer?.name ||
    'Khách Hàng Mini Shopee';

  const recipientPhone =
    order.shippingAddress?.phone ||
    order.phone ||
    order.customer?.phone ||
    '0901234567';

  let recipientAddress = 'Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';
  if (typeof order.shippingAddress === 'string' && order.shippingAddress.trim()) {
    recipientAddress = order.shippingAddress;
  } else if (order.shippingAddress && typeof order.shippingAddress === 'object') {
    const parts = [
      order.shippingAddress.address || order.shippingAddress.street,
      order.shippingAddress.ward,
      order.shippingAddress.district,
      order.shippingAddress.city,
    ].filter(Boolean);
    if (parts.length > 0) {
      recipientAddress = parts.join(', ');
    }
  } else if (order.address) {
    recipientAddress = order.address;
  } else if (order.customer?.address) {
    recipientAddress = order.customer.address;
  }

  const orderNote = order.note || order.shippingAddress?.note || '';

  // Payment Details
  const paymentMethod = order.paymentMethodText || order.paymentMethod || 'Thanh toán khi nhận hàng (COD)';
  const isCOD = String(paymentMethod).toUpperCase().includes('COD');
  const isPaid =
    order.paymentStatus === 'paid' ||
    order.paymentStatus === 'Đã thanh toán' ||
    isCompleted ||
    (!isCOD && !isCancelled);

  const paymentStatusText = order.paymentStatus || (
    isCancelled
      ? 'Đã hủy đơn'
      : isPaid
      ? 'Đã thanh toán'
      : 'Thanh toán khi nhận hàng'
  );

  // Fee Breakdown Calculation
  const items = Array.isArray(order.items) && order.items.length > 0 ? order.items : [];
  const itemSubtotal = order.subtotal !== undefined
    ? Number(order.subtotal)
    : items.reduce((sum, it) => sum + (Number(it.price || 0) * (Number(it.quantity) || 1)), 0);

  const voucherDiscount = Number(order.voucherDiscount || order.discount || 0);
  const coinsDiscount = Number(order.coinsDiscount || order.coinDiscount || order.coinsUsed || order.coinsDeducted || 0);

  const shippingFee = order.shippingFee !== undefined
    ? Number(order.shippingFee)
    : Math.max(0, Number(order.total || 0) - itemSubtotal + voucherDiscount + coinsDiscount);

  const finalTotal = order.total !== undefined
    ? Number(order.total)
    : order.finalTotal !== undefined
    ? Number(order.finalTotal)
    : Math.max(0, itemSubtotal + shippingFee - voucherDiscount - coinsDiscount);

  // Stepper Stages Definition
  const STEPS = [
    { step: 1, label: 'Đã đặt hàng', desc: 'Đơn hàng đã được tạo' },
    { step: 2, label: 'Đã xác nhận', desc: 'Shop đã đóng gói kiện hàng' },
    { step: 3, label: 'Đang giao hàng', desc: 'SPX Express đang vận chuyển' },
    { step: 4, label: 'Giao thành công', desc: 'Đã giao tới người nhận' },
  ];

  return (
    <div
      className="shopee-modal-overlay order-detail-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
    >
      <div className="order-detail-modal-container">
        {/* Modal Header */}
        <div className="order-detail-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h3 id="order-detail-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>
                📦 {t('order_detail_title', 'Chi Tiết Đơn Hàng')}
              </h3>
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  background: 'var(--bg-muted, #f1f5f9)',
                  padding: '3px 8px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  border: '1px solid var(--border-medium, #e2e8f0)',
                }}
                onClick={() => handleCopy(orderId, 'Mã đơn')}
                title="Nhấn để sao chép mã đơn"
              >
                #{orderId}
                <span style={{ fontSize: '11px', color: 'var(--primary-color, #ea580c)' }}>📋</span>
              </span>
              <span
                className={`shopee-status-badge ${statusBadge.className}`}
                style={{ background: statusBadge.bg, color: statusBadge.color }}
              >
                {statusBadge.text}
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              {t('order_date', 'Ngày đặt')}: <strong>{formattedDate}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
              onClick={() => window.print()}
              title="In chi tiết đơn hàng"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              🖨️ {t('print', 'In')}
            </button>
            <button
              type="button"
              className="shopee-modal-close"
              onClick={onClose}
              aria-label="Đóng chi tiết đơn hàng"
              style={{ fontSize: '20px', lineHeight: 1 }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Cancelled Notice if Order is Cancelled */}
        {isCancelled && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '18px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
            }}
          >
            <span style={{ fontSize: '18px' }}>⚠️</span>
            <div>
              <div style={{ fontSize: '13.5px', fontWeight: 700, color: '#ef4444' }}>
                Đơn hàng đã được hủy thành công
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                Lý do hủy: {order.cancelReason || 'Người mua yêu cầu hủy đơn'}
                {order.cancelNote ? ` · Ghi chú: ${order.cancelNote}` : ''}
              </div>
            </div>
          </div>
        )}

        {/* Real-time SPX Delivery Stepper */}
        {!isCancelled && (
          <div className="spx-stepper" style={{ marginBottom: '20px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '16px' }}>🚚</span>
                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {carrierName}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: 'var(--primary-color, #ea580c)',
                    background: 'var(--primary-light, #fff7ed)',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    border: '1px solid var(--primary-border, #fed7aa)',
                  }}
                  onClick={() => handleCopy(trackingCode, 'Mã vận đơn SPX')}
                  title="Nhấn để sao chép mã vận đơn"
                >
                  {trackingCode} 📋
                </span>
              </div>

              {isShipping && handleOpenTracking && (
                <button
                  type="button"
                  className="shopee-btn shopee-btn-sm"
                  style={{
                    background: 'var(--secondary-color, #0284c7)',
                    color: '#fff',
                    borderColor: 'var(--secondary-color, #0284c7)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  onClick={() => handleOpenTracking(order)}
                >
                  🗺️ {t('spx_live_tracking', 'Bản đồ Shipper SPX')}
                </button>
              )}
            </div>

            {/* Stepper Progress Bar */}
            <div className="stepper-track-wrapper">
              <div className="stepper-stages">
                {STEPS.map((s, idx) => {
                  const isPassed = activeStep > s.step;
                  const isCurrent = activeStep === s.step;
                  return (
                    <div
                      key={s.step}
                      className={`stepper-node ${isPassed ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                    >
                      <div className="stepper-circle">
                        {isPassed ? '✓' : s.step}
                      </div>
                      <div className="stepper-label">{s.label}</div>
                      <div className="stepper-desc">{s.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Events if present */}
            {Array.isArray(order.timeline) && order.timeline.length > 0 && (
              <div
                style={{
                  marginTop: '14px',
                  background: 'var(--bg-muted, #f8fafc)',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  border: '1px solid var(--border-light, #f1f5f9)',
                  fontSize: '12.5px',
                  maxHeight: '120px',
                  overflowY: 'auto',
                }}
              >
                {order.timeline.map((tl, index) => (
                  <div
                    key={index}
                    style={{
                      display: 'flex',
                      gap: '10px',
                      padding: '4px 0',
                      borderBottom: index < order.timeline.length - 1 ? '1px dashed var(--border-light, #e2e8f0)' : 'none',
                    }}
                  >
                    <span style={{ color: 'var(--primary-color, #ea580c)', fontWeight: 700, minWidth: '85px' }}>
                      {tl.time}
                    </span>
                    <span style={{ color: 'var(--text-primary)' }}>{tl.text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2-Column Grid: Recipient Info & Payment Info */}
        <div
          className="order-detail-info-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '14px',
            marginBottom: '20px',
          }}
        >
          {/* Recipient Card */}
          <div className="recipient-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px' }}>📍</span>
              <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {t('shipping_address_title', 'Địa Chỉ Nhận Hàng')}
              </span>
            </div>
            <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
              {recipientName}
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              📞 {recipientPhone}
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.4 }}>
              {recipientAddress}
            </div>
            {orderNote && (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '8px',
                  paddingTop: '6px',
                  borderTop: '1px dashed var(--border-medium, #e2e8f0)',
                  fontStyle: 'italic',
                }}
              >
                Ghi chú: {orderNote}
              </div>
            )}
          </div>

          {/* Payment Card */}
          <div className="recipient-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ fontSize: '15px' }}>💳</span>
              <span style={{ fontWeight: 800, fontSize: '13.5px', color: 'var(--text-primary)' }}>
                {t('payment_info_title', 'Thông Tin Thanh Toán')}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>
              Phương thức: <strong>{paymentMethod}</strong>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>Trạng thái:</span>
              <span
                style={{
                  fontSize: '11px',
                  padding: '2px 8px',
                  borderRadius: '999px',
                  fontWeight: 700,
                  background: isPaid ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                  color: isPaid ? '#10b981' : '#f59e0b',
                }}
              >
                {paymentStatusText}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
              Tổng tiền cần thanh toán: <strong style={{ color: 'var(--primary-color, #ea580c)' }}>{formatCurrency(finalTotal)}</strong>
            </div>
            <div style={{ fontSize: '11.5px', color: 'var(--text-muted)', marginTop: '4px' }}>
              Đơn vị vận chuyển: {carrierName} · Hotline: {hotline}
            </div>
          </div>
        </div>

        {/* Order Items List */}
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '10px',
              paddingBottom: '6px',
              borderBottom: '1px solid var(--border-light, #f1f5f9)',
            }}
          >
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
              🏪 {order.shopName || 'Mini Shopee Mall'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              {items.length} {t('items_count', 'sản phẩm')}
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {items.map((item, idx) => {
              const itemPrice = Number(item.price) || 0;
              const itemQty = Number(item.quantity) || 1;
              const itemTotal = itemPrice * itemQty;
              const itemImg =
                item.image ||
                item.thumbnail ||
                'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

              return (
                <div
                  key={item._id || item.id || idx}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '12px',
                    padding: '10px 12px',
                    borderRadius: '8px',
                    background: 'var(--bg-muted, #f8fafc)',
                    border: '1px solid var(--border-light, #f1f5f9)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: '1 1 240px', minWidth: '220px' }}>
                    <img
                      src={itemImg}
                      alt={item.name}
                      style={{
                        width: '52px',
                        height: '52px',
                        borderRadius: '6px',
                        objectFit: 'cover',
                        border: '1px solid var(--border-medium, #e2e8f0)',
                        flexShrink: 0,
                      }}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                      }}
                    />
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: '13px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.name}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        x{itemQty} · {formatCurrency(itemPrice)}
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {formatCurrency(itemTotal)}
                      </div>
                    </div>

                    {onBuyAgainItem && (
                      <button
                        type="button"
                        className="shopee-btn shopee-btn-sm"
                        style={{
                          background: 'var(--primary-light, #fff7ed)',
                          color: 'var(--primary-color, #ea580c)',
                          borderColor: 'var(--primary-border, #fed7aa)',
                          fontWeight: 700,
                          whiteSpace: 'nowrap',
                        }}
                        onClick={() => onBuyAgainItem(item)}
                        title="Thêm sản phẩm này vào giỏ hàng"
                      >
                        🔁 {t('buy_again', 'Mua lại')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Transparent Fee Breakdown */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            marginBottom: '20px',
          }}
        >
          <div className="fee-breakdown-table" style={{ width: '100%', maxWidth: '380px' }}>
            <div className="fee-row">
              <span className="fee-label">{t('subtotal', 'Tiền hàng (tạm tính)')}:</span>
              <span className="fee-value">{formatCurrency(itemSubtotal)}</span>
            </div>

            <div className="fee-row">
              <span className="fee-label">{t('shipping_fee', 'Phí vận chuyển')}:</span>
              <span className="fee-value">
                {shippingFee === 0 ? 'Miễn phí' : `+${formatCurrency(shippingFee)}`}
              </span>
            </div>

            {voucherDiscount > 0 && (
              <div className="fee-row discount-row">
                <span className="fee-label">{t('voucher_discount', 'Giảm giá Voucher')}:</span>
                <span className="fee-value discount">-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}

            {coinsDiscount > 0 && (
              <div className="fee-row discount-row">
                <span className="fee-label">🪙 {t('coins_discount', 'Giảm giá Xu')}:</span>
                <span className="fee-value discount">-{formatCurrency(coinsDiscount)}</span>
              </div>
            )}

            <div className="fee-row total-row" style={{ marginTop: '8px', paddingTop: '8px', borderTop: '2px solid var(--border-medium, #e2e8f0)' }}>
              <span className="fee-label" style={{ fontWeight: 800, fontSize: '14.5px' }}>
                {t('total_payment', 'Tổng thanh toán')}:
              </span>
              <span className="fee-value total" style={{ color: 'var(--primary-color, #ea580c)', fontWeight: 800, fontSize: '17px' }}>
                {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* Action Buttons at Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: '16px',
            borderTop: '1px solid var(--border-light, #f1f5f9)',
            flexWrap: 'wrap',
            gap: '10px',
          }}
        >
          <div>
            {onOpenChat && (
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{
                  borderColor: '#818cf8',
                  color: '#4f46e5',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => onOpenChat(order)}
              >
                💬 {t('chat_with_shop', 'Chat với Shop')}
              </button>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {isShipping && handleOpenTracking && (
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{
                  borderColor: '#38bdf8',
                  color: '#0284c7',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => handleOpenTracking(order)}
              >
                🚚 {t('spx_live_tracking', 'Bản đồ Shipper SPX')}
              </button>
            )}

            {isCompleted && onOpenInvoice && (
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{
                  borderColor: '#cbd5e1',
                  color: '#475569',
                  fontWeight: 600,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => onOpenInvoice(order)}
              >
                🧾 {t('vat_invoice', 'In hóa đơn VAT')}
              </button>
            )}

            {onReorderWhole && items.length > 0 && (
              <button
                type="button"
                className="shopee-btn"
                style={{
                  background: 'var(--primary-color, #ea580c)',
                  color: '#ffffff',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => onReorderWhole(order)}
              >
                🔁 {t('buy_again_whole', 'Mua lại cả đơn')}
              </button>
            )}

            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              onClick={onClose}
              style={{ fontWeight: 600 }}
            >
              ✕ {t('close', 'Đóng')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
