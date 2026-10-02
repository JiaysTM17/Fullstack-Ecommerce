import React, { useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import {
  PackageIcon,
  StoreIcon,
  ChatIcon,
  CopyIcon,
  TruckIcon,
  MapPinIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  PrinterIcon,
  ReceiptIcon,
  EyeIcon,
  RefreshIcon,
  ClockIcon,
  CheckIcon,
  ReturnIcon,
  StarIcon,
} from './OrdersIcons';

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
  onOpenCancelOrder,
  onOpenReturnModal,
  onOpenReviewModal,
  onSimulateStep,
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
  const carrierName = order.courier?.carrier || order.carrier || 'SPX Express';
  const hotline = '1900 1221';
  const transactionId = order.transactionId || (orderId ? `TXN-${orderId}-MPE` : 'TXN-849201934');

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

  const isPending = order.status === 'pending' || activeStep === 1;
  const isConfirmed = order.status === 'confirmed' || activeStep === 2;
  const isShipping = order.status === 'shipping' || order.status === 'delivering' || activeStep === 3;
  const isCompleted = order.status === 'completed' || order.status === 'delivered' || activeStep === 4;
  const isCancelled = order.status === 'cancelled' || activeStep === 0;
  const isReturning = order.status === 'returning' || order.status === 'return_processing' || order.status === 'returned';

  // Status Badge Colors & Labels
  const getStatusBadge = () => {
    if (isCancelled) {
      return { text: order.statusText || 'Đã hủy', className: 'status-cancelled', bg: '#fef2f2', color: '#dc2626', icon: <ReturnIcon size={12} /> };
    }
    if (isReturning) {
      return { text: order.statusText || 'Đang xử lý đổi trả', className: 'status-returning', bg: '#eff6ff', color: '#2563eb', icon: <ReturnIcon size={12} /> };
    }
    if (isCompleted) {
      return { text: order.statusText || 'Giao thành công', className: 'status-completed', bg: '#f0fdf4', color: '#16a34a', icon: <CheckIcon size={12} /> };
    }
    if (isShipping) {
      return { text: order.statusText || 'Đang giao hàng', className: 'status-shipping', bg: '#eff6ff', color: '#2563eb', icon: <TruckIcon size={12} /> };
    }
    if (isConfirmed) {
      return { text: order.statusText || 'Đã xác nhận', className: 'status-confirmed', bg: '#eff6ff', color: '#2563eb', icon: <PackageIcon size={12} /> };
    }
    return { text: order.statusText || 'Chờ xác nhận', className: 'status-pending', bg: '#fefce8', color: '#ca8a04', icon: <ClockIcon size={12} /> };
  };
  const statusBadge = getStatusBadge();

  // Recipient Card Information
  const recipientName =
    order.shippingAddress?.fullName ||
    order.customerName ||
    order.recipientName ||
    order.customer?.fullName ||
    order.customer?.name ||
    'Khách Hàng';

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
      ? 'Đã hủy'
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
    { step: 1, label: 'Đặt hàng' },
    { step: 2, label: 'Đã xác nhận' },
    { step: 3, label: 'Đang giao' },
    { step: 4, label: 'Giao thành công' },
  ];

  const shopName = order.shopName || 'Shopee Mall Official';

  return (
    <div
      className="shopee-modal-overlay order-detail-modal-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && onClose) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="order-detail-title"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(15, 23, 42, 0.68)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px 14px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        animation: 'modalOverlayFadeIn 0.2s ease-out forwards',
      }}
    >
      <div
        className="order-detail-modal-container anim-modal-content"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '14px',
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.28)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden',
          padding: 0,
          margin: 'auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* ==========================================================================
            1. Header: Order ID, Date, Status Pill, Print & Close Actions (Slim 46px)
            ========================================================================== */}
        <div
          className="order-detail-header"
          style={{
            padding: '12px 18px',
            borderBottom: '1px solid #f1f5f9',
            background: '#f8fafc',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '10px',
            margin: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
              <PackageIcon size={17} />
            </span>
            <span style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a' }}>
              {t('order_detail_title', 'Chi Tiết Đơn Hàng')}
            </span>
            <button
              type="button"
              className="copy-pill"
              onClick={() => handleCopy(orderId, 'Mã đơn')}
              title="Nhấn để sao chép mã đơn"
              style={{
                fontSize: '11.5px',
                padding: '2px 8px',
                borderRadius: '4px',
                fontWeight: 600,
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                color: '#0f172a',
              }}
            >
              #{orderId}
              <CopyIcon size={10} />
            </button>
            <span
              style={{
                background: statusBadge.bg,
                color: statusBadge.color,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                border: `1px solid ${statusBadge.color}30`,
              }}
            >
              {statusBadge.icon}
              <span>{statusBadge.text}</span>
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '11.5px', color: '#64748b', marginRight: '4px' }}>
              {formattedDate}
            </span>
            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={() => window.print()}
              title="In chi tiết đơn hàng"
              style={{
                height: '28px',
                padding: '0 8px',
                fontSize: '11.5px',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <PrinterIcon size={12} /> {t('print', 'In')}
            </button>
            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={onClose}
              aria-label="Đóng chi tiết đơn hàng"
              style={{
                width: '28px',
                height: '28px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                borderRadius: '6px',
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* ==========================================================================
            2. Scrollable Body: Compact High-Density Content
            ========================================================================== */}
        <div
          className="order-detail-scroll-body"
          style={{
            padding: '14px 18px',
            overflowY: 'auto',
            flex: 1,
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
          }}
        >
          {/* Cancelled Notice Banner */}
          {isCancelled && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <span style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }}>
                <ReturnIcon size={15} />
              </span>
              <div style={{ flex: 1, fontSize: '12px', color: '#991b1b', lineHeight: 1.4 }}>
                <strong>Đơn hàng đã được hủy:</strong> {order.cancelReason || 'Người mua yêu cầu hủy đơn'}
                {order.cancelNote ? ` · Ghi chú: ${order.cancelNote}` : ''}. Tiền và Shopee Xu (nếu có) đã hoàn về ví.
              </div>
            </div>
          )}

          {/* Return / Refund Processing Notice Banner */}
          {isReturning && (
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '8px',
                padding: '9px 12px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
              }}
            >
              <span style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }}>
                <ReturnIcon size={15} />
              </span>
              <div style={{ flex: 1, fontSize: '12px', color: '#1e40af', lineHeight: 1.4 }}>
                <strong>Yêu cầu Trả hàng / Hoàn tiền đang được xử lý:</strong> {order.returnDetails?.reason || 'Sản phẩm lỗi hoặc hư hỏng'}
                {order.returnDetails?.refundAmount ? ` · Tiền hoàn: ${formatCurrency(order.returnDetails.refundAmount)}` : ''}. Shopee & Người bán đang giải quyết khiếu nại.
              </div>
            </div>
          )}

          {/* Stepper Progress Bar (Slim, Integrated, 42px) */}
          {!isCancelled && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px 6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TruckIcon size={14} color="#2563eb" />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                    {carrierName}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    · Mã vận đơn: <strong style={{ color: '#0f172a' }}>{trackingCode}</strong>
                  </span>
                </div>
                {isShipping && handleOpenTracking && (
                  <button
                    type="button"
                    className="shopee-order-btn-outline"
                    onClick={() => handleOpenTracking(order)}
                    style={{
                      height: '24px',
                      padding: '0 8px',
                      fontSize: '11px',
                      borderRadius: '4px',
                      color: '#2563eb',
                      borderColor: '#bfdbfe',
                      background: '#eff6ff',
                      fontWeight: 700,
                    }}
                  >
                    <MapPinIcon size={11} /> {t('spx_live_tracking', 'Bản đồ Shipper SPX')}
                  </button>
                )}
              </div>

              {/* Horizontal Stepper */}
              <div style={{ position: 'relative', width: '100%', margin: '4px 0 6px' }}>
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '12.5%',
                    right: '12.5%',
                    height: '2px',
                    background: '#e2e8f0',
                    zIndex: 1,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '12.5%',
                    height: '2px',
                    background: 'linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)',
                    zIndex: 2,
                    width: `${((Math.min(activeStep || 1, 4) - 1) / 3) * 75}%`,
                    transition: 'width 0.3s ease',
                  }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative', zIndex: 3 }}>
                  {STEPS.map((s) => {
                    const isPassed = activeStep >= s.step || (activeStep === 4 && s.step === 4);
                    const isCurrent = activeStep === s.step && activeStep !== 4;
                    return (
                      <div
                        key={s.step}
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          flex: 1,
                          textAlign: 'center',
                        }}
                      >
                        <div
                          style={{
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            background: isPassed ? '#2563eb' : isCurrent ? '#eff6ff' : '#ffffff',
                            border: `1.5px solid ${isPassed || isCurrent ? '#2563eb' : '#cbd5e1'}`,
                            color: isPassed ? '#ffffff' : isCurrent ? '#2563eb' : '#64748b',
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 0 0 2px #ffffff',
                          }}
                        >
                          {isPassed ? <CheckIcon size={10} color="#ffffff" /> : s.step}
                        </div>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: isPassed || isCurrent ? 700 : 500,
                            color: isPassed || isCurrent ? '#0f172a' : '#64748b',
                            marginTop: '4px',
                          }}
                        >
                          {s.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* 3. 2-Column Delivery Address & Payment Information Grid (Tight, clean) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '10px',
            }}
          >
            {/* Recipient Address Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' }}>
                  <MapPinIcon size={13} color="#2563eb" />
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                    {t('shipping_address_title', 'Địa Chỉ Nhận Hàng')}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px' }}>
                  <strong style={{ fontSize: '13px', color: '#0f172a' }}>{recipientName}</strong>
                  <span
                    className="copy-pill"
                    onClick={() => handleCopy(recipientPhone, 'SĐT')}
                    style={{ fontSize: '11.5px', color: '#475569', cursor: 'pointer' }}
                  >
                    {recipientPhone} <CopyIcon size={10} />
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#475569', marginTop: '3px', lineHeight: 1.4 }}>
                  {recipientAddress}
                </div>
              </div>
              {orderNote && (
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', paddingTop: '4px', borderTop: '1px dashed #cbd5e1' }}>
                  Ghi chú: {orderNote}
                </div>
              )}
            </div>

            {/* Payment & Invoice Details Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <CreditCardIcon size={13} color="#2563eb" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      {t('payment_info_title', 'Thanh Toán')}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: isPaid ? '#dcfce7' : isCancelled ? '#fee2e2' : '#eff6ff',
                      color: isPaid ? '#15803d' : isCancelled ? '#b91c1c' : '#1d4ed8',
                    }}
                  >
                    {paymentStatusText}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Phương thức:</span>
                  <strong>{paymentMethod}</strong>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span>Mã giao dịch:</span>
                  <span
                    className="copy-pill"
                    onClick={() => handleCopy(transactionId, 'Mã GD')}
                    style={{ fontSize: '11px', cursor: 'pointer' }}
                  >
                    {transactionId} <CopyIcon size={10} />
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#1e40af', background: '#eff6ff', padding: '4px 8px', borderRadius: '4px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheckIcon size={12} color="#2563eb" />
                <span>Bảo hộ bởi Shopee SafePay an toàn</span>
              </div>
            </div>
          </div>

          {/* 4. Integrated Shop Bar & Products List */}
          <div
            style={{
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              overflow: 'hidden',
            }}
          >
            {/* Shop Bar */}
            <div
              style={{
                background: '#f8fafc',
                padding: '8px 12px',
                borderBottom: '1px solid #f1f5f9',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '3px',
                  }}
                >
                  MALL
                </span>
                <span style={{ fontSize: '13px', fontWeight: 700, color: '#0f172a' }}>
                  {shopName}
                </span>
                <span style={{ fontSize: '11px', color: '#64748b' }}>
                  · 4.9★ (12k đánh giá)
                </span>
              </div>

              {onOpenChat && (
                <button
                  type="button"
                  className="shopee-order-btn-outline"
                  onClick={() => onOpenChat(order)}
                  style={{
                    height: '26px',
                    padding: '0 10px',
                    fontSize: '11.5px',
                    borderRadius: '4px',
                  }}
                >
                  <ChatIcon size={11} /> {t('chat_with_shop', 'Chat Shop')}
                </button>
              )}
            </div>

            {/* Products Table Rows */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {items.map((item, idx) => {
                const itemPrice = Number(item.price) || 0;
                const itemQty = Number(item.quantity) || 1;
                const itemTotal = itemPrice * itemQty;
                const itemImg =
                  item.image ||
                  item.thumbnail ||
                  'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';

                let variantText = item.variant || item.color;
                let sizeText = item.size;
                if (variantText && variantText.includes(',') && !sizeText) {
                  const parts = variantText.split(',').map((s) => s.trim());
                  variantText = parts[0];
                  sizeText = parts[1];
                }
                const finalVariant = variantText || (item.name?.toLowerCase().includes('giày') ? 'Đỏ Trắng' : item.name?.toLowerCase().includes('áo') ? 'Xanh dương' : 'Tiêu chuẩn');
                const finalSize = sizeText || (item.name?.toLowerCase().includes('giày') ? 'Size 42' : item.name?.toLowerCase().includes('áo') ? 'Freesize' : 'Tiêu chuẩn');

                return (
                  <div
                    key={item._id || item.id || idx}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '10px',
                      padding: '10px 12px',
                      borderBottom: idx < items.length - 1 ? '1px solid #f1f5f9' : 'none',
                      background: '#ffffff',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: 0 }}>
                      <img
                        src={itemImg}
                        alt={item.name}
                        style={{
                          width: '46px',
                          height: '46px',
                          borderRadius: '6px',
                          objectFit: 'cover',
                          border: '1px solid #cbd5e1',
                          flexShrink: 0,
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=200';
                        }}
                      />
                      <div style={{ minWidth: 0, flex: 1 }}>
                        <div
                          style={{
                            fontSize: '12.5px',
                            fontWeight: 600,
                            color: '#0f172a',
                            lineHeight: 1.3,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                          Phân loại: {finalVariant} | Kích thước: {finalSize} | Số lượng: x{itemQty}
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                          <ShieldCheckIcon size={11} color="#16a34a" /> 100% Chính hãng · Đổi trả trong 15 ngày
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 800, color: '#0f172a' }}>
                        {formatCurrency(itemTotal)}
                      </div>
                      <div style={{ fontSize: '11px', color: '#64748b' }}>
                        {formatCurrency(itemPrice)} / chiếc
                      </div>
                      {onBuyAgainItem && (
                        <button
                          type="button"
                          className="shopee-order-btn-outline"
                          onClick={() => onBuyAgainItem(item)}
                          style={{
                            height: '24px',
                            padding: '0 8px',
                            fontSize: '11px',
                            borderRadius: '4px',
                            marginTop: '3px',
                          }}
                        >
                          <RefreshIcon size={10} /> Mua lại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Financial Cost Breakdown (Compact right-aligned panel) */}
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <div
              style={{
                width: '100%',
                maxWidth: '340px',
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Tiền hàng (tạm tính):</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatCurrency(itemSubtotal)}</span>
              </div>
              <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                <span>Phí vận chuyển:</span>
                <span style={{ color: '#0f172a', fontWeight: 600 }}>
                  {shippingFee === 0 ? 'Miễn phí' : formatCurrency(shippingFee)}
                </span>
              </div>
              {voucherDiscount > 0 && (
                <div style={{ fontSize: '11.5px', color: '#16a34a', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Voucher giảm giá:</span>
                  <strong>-{formatCurrency(voucherDiscount)}</strong>
                </div>
              )}
              {coinsDiscount > 0 && (
                <div style={{ fontSize: '11.5px', color: '#16a34a', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Shopee Xu trừ:</span>
                  <strong>-{formatCurrency(coinsDiscount)}</strong>
                </div>
              )}
              <div
                style={{
                  marginTop: '6px',
                  paddingTop: '6px',
                  borderTop: '1px dashed #cbd5e1',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                  Tổng thanh toán:
                </span>
                <span style={{ fontSize: '16px', fontWeight: 800, color: '#2563eb' }}>
                  {formatCurrency(finalTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ==========================================================================
            6. Fixed Footer Toolbar (Height 48px, Uniform 32px Buttons)
            ========================================================================== */}
        <div
          className="order-detail-footer-bar"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '8px 18px',
            borderTop: '1px solid #f1f5f9',
            background: '#f8fafc',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: '8px',
            margin: 0,
          }}
        >
          {/* Left actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            {onOpenInvoice && (
              <button
                type="button"
                className="shopee-order-btn-outline"
                onClick={() => onOpenInvoice(order)}
                style={{ height: '32px', fontSize: '12px', borderRadius: '6px' }}
              >
                <ReceiptIcon size={12} /> {t('vat_invoice', 'In hóa đơn VAT')}
              </button>
            )}

            {!isCancelled && !isReturning && activeStep < 4 && onSimulateStep && (
              <button
                type="button"
                className="shopee-btn"
                style={{
                  fontSize: '11.5px',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  color: '#2563eb',
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  height: '32px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
                onClick={() => onSimulateStep(orderId)}
                title="Mô phỏng bưu tá giao hàng bước tiếp theo"
              >
                {t('order_track_simulate_step', 'Mô phỏng giao')}
              </button>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
            {/* If pending or confirmed: Cancel Order button */}
            {(isPending || isConfirmed) && !isReturning && onOpenCancelOrder && (
              <button
                type="button"
                className="shopee-order-btn-danger-outline"
                onClick={() => onOpenCancelOrder(order)}
                style={{ height: '32px', fontSize: '12px', borderRadius: '6px' }}
              >
                ✕ {t('cancel_order', 'Hủy đơn hàng')}
              </button>
            )}

            {/* If shipping: Live GPS map button */}
            {isShipping && !isReturning && handleOpenTracking && (
              <button
                type="button"
                className="shopee-order-btn-outline"
                onClick={() => handleOpenTracking(order)}
                style={{ height: '32px', fontSize: '12px', borderRadius: '6px' }}
              >
                <TruckIcon size={12} /> {t('spx_live_tracking', 'Bản đồ Shipper SPX')}
              </button>
            )}

            {/* If returning: show processing status tag */}
            {isReturning && (
              <span
                style={{
                  fontSize: '11.5px',
                  padding: '0 10px',
                  borderRadius: '6px',
                  background: '#eff6ff',
                  color: '#2563eb',
                  border: '1px solid #bfdbfe',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  height: '32px',
                }}
              >
                <ReturnIcon size={12} /> {t('return_processing_status', 'Đang xử lý đổi trả')}
              </span>
            )}

            {/* If completed: Review (+200 coins) and Return/Refund */}
            {isCompleted && !isReturning && (
              <>
                {order.reviewed ? (
                  <span
                    style={{
                      fontSize: '11.5px',
                      padding: '0 10px',
                      borderRadius: '6px',
                      background: '#f8fafc',
                      color: '#16a34a',
                      border: '1px solid #e2e8f0',
                      fontWeight: 700,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      height: '32px',
                    }}
                  >
                    <CheckIcon size={12} /> Đã đánh giá (+200 Xu)
                  </span>
                ) : (
                  onOpenReviewModal && (
                    <button
                      type="button"
                      className="shopee-order-btn-review"
                      onClick={() => onOpenReviewModal(order)}
                      style={{ height: '32px', fontSize: '12px', borderRadius: '6px' }}
                    >
                      <StarIcon size={12} color="#facc15" filled /> {t('review_order_reward', 'Đánh giá (+200 Xu)')}
                    </button>
                  )
                )}

                {onOpenReturnModal && (
                  <button
                    type="button"
                    className="shopee-order-btn-outline"
                    onClick={() => onOpenReturnModal(order)}
                    style={{ height: '32px', fontSize: '12px', borderRadius: '6px' }}
                  >
                    <ReturnIcon size={12} /> {t('return_refund', 'Trả hàng / Hoàn tiền')}
                  </button>
                )}
              </>
            )}

            {/* Reorder whole order button */}
            {onReorderWhole && items.length > 0 && (
              <button
                type="button"
                className="shopee-order-btn-primary"
                onClick={() => onReorderWhole(order)}
                style={{ height: '32px', fontSize: '12px', borderRadius: '6px' }}
              >
                <RefreshIcon size={12} /> {t('buy_again_whole', 'Mua lại cả đơn')}
              </button>
            )}

            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={onClose}
              style={{ height: '32px', fontSize: '12px', borderRadius: '6px' }}
            >
              ✕ {t('close', 'Đóng')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
