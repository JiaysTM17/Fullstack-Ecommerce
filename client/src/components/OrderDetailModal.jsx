import React, { useEffect, useState } from 'react';
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
  const carrierName = order.courier?.carrier || order.carrier || 'SPX Express (Shopee Xpress)';
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
      return { text: order.statusText || 'Đã hủy', className: 'status-cancelled', bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444', icon: <ReturnIcon size={12} /> };
    }
    if (isReturning) {
      return { text: order.statusText || 'Đang xử lý đổi trả', className: 'status-returning', bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', icon: <ReturnIcon size={12} /> };
    }
    if (isCompleted) {
      return { text: order.statusText || 'Giao thành công', className: 'status-completed', bg: 'rgba(16, 185, 129, 0.12)', color: '#059669', icon: <CheckIcon size={12} /> };
    }
    if (isShipping) {
      return { text: order.statusText || 'Đang giao hàng', className: 'status-shipping', bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', icon: <TruckIcon size={12} /> };
    }
    if (isConfirmed) {
      return { text: order.statusText || 'Đã xác nhận', className: 'status-confirmed', bg: 'rgba(37, 99, 235, 0.12)', color: '#2563eb', icon: <PackageIcon size={12} /> };
    }
    return { text: order.statusText || 'Chờ xác nhận', className: 'status-pending', bg: 'rgba(245, 158, 11, 0.12)', color: '#d97706', icon: <ClockIcon size={12} /> };
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
    { step: 1, label: 'Đã đặt hàng', desc: 'Đơn hàng đã được tạo thành công' },
    { step: 2, label: 'Đã xác nhận', desc: 'Shop đã đóng gói & in mã vận đơn' },
    { step: 3, label: 'Đang giao hàng', desc: 'SPX Express đang vận chuyển' },
    { step: 4, label: 'Giao thành công', desc: 'Đã giao tới người nhận & ký nhận' },
  ];

  // Timeline events fallback
  const timelineEvents = Array.isArray(order.timeline) && order.timeline.length > 0
    ? order.timeline
    : [
        { time: formattedDate, text: 'Đơn hàng đã được tạo và chuyển thông tin sang người bán' },
        ...(activeStep >= 2 ? [{ time: 'Giai đoạn 2', text: 'Người bán đã chuẩn bị kiện hàng và bàn giao cho bưu tá' }] : []),
        ...(activeStep >= 3 ? [{ time: 'Giai đoạn 3', text: 'Kiện hàng đang được trung chuyển qua bưu cục SPX Express' }] : []),
        ...(activeStep >= 4 ? [{ time: 'Hoàn thành', text: 'Đã giao hàng thành công đến người nhận' }] : []),
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
    >
      <div
        className="order-detail-modal-container"
        style={{
          background: '#ffffff',
          color: '#0f172a',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '780px',
          maxHeight: '86vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.28)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden',
          padding: 0,
          margin: 'auto',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        }}
      >
        {/* ==========================================================================
            Modal Header: Order ID, Date, Status Pill, Print & Close Actions
            ========================================================================== */}
        <div
          className="order-detail-header"
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid #f1f5f9',
            background: '#f8fafc',
            flexShrink: 0,
            margin: 0,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <h3 id="order-detail-title" style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <PackageIcon size={20} />
                <span>{t('order_detail_title', 'Chi Tiết Đơn Hàng')}</span>
              </h3>
              <button
                type="button"
                className="order-id-badge"
                onClick={() => handleCopy(orderId, 'Mã đơn')}
                title="Nhấn để sao chép mã đơn"
              >
                #{orderId}
                <CopyIcon size={11} />
              </button>
              <span
                className={`shopee-status-badge ${statusBadge.className}`}
                style={{
                  background: statusBadge.bg,
                  color: statusBadge.color,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  fontWeight: 700,
                  padding: '3px 10px',
                  borderRadius: '999px',
                  fontSize: '12px'
                }}
              >
                {statusBadge.icon}
                <span>{statusBadge.text}</span>
              </span>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '5px' }}>
              {t('order_date', 'Thời gian đặt hàng')}: <strong style={{ color: 'var(--text-secondary)' }}>{formattedDate}</strong>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
              onClick={() => window.print()}
              title="In hóa đơn chi tiết đơn hàng"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}
            >
              <PrinterIcon size={13} /> {t('print', 'In')}
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

        {/* Scrollable Modal Content */}
        <div
          className="order-detail-scroll-body"
          style={{
            padding: '24px',
            overflowY: 'auto',
            flex: 1,
            boxSizing: 'border-box',
          }}
        >

        {/* ==========================================================================
            Cancelled Notice Banner (If order was cancelled)
            ========================================================================== */}
        {isCancelled && (
          <div
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <span style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }}>
              <ShieldCheckIcon size={20} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#ef4444' }}>
                Đơn hàng đã được hủy thành công
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '3px' }}>
                Lý do hủy: <strong>{order.cancelReason || 'Người mua yêu cầu hủy đơn'}</strong>
                {order.cancelNote ? ` · Ghi chú: ${order.cancelNote}` : ''}
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
                Tiền thanh toán (nếu đã trừ) và điểm Shopee Xu đã được hoàn về tài khoản của bạn theo chính sách bảo vệ người mua.
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================================
            Return / Refund Processing Notice Banner
            ========================================================================== */}
        {isReturning && (
          <div
            style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px',
              padding: '14px 18px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
            }}
          >
            <span style={{ color: '#2563eb', flexShrink: 0, marginTop: '2px' }}>
              <ReturnIcon size={20} />
            </span>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '14px', fontWeight: 700, color: '#1d4ed8' }}>
                Yêu cầu Trả hàng / Hoàn tiền đang được xử lý
              </div>
              <div style={{ fontSize: '13px', color: '#334155', marginTop: '3px' }}>
                Lý do: <strong>{order.returnDetails?.reason || 'Sản phẩm lỗi hoặc hư hỏng'}</strong>
                {order.returnDetails?.refundAmount ? ` · Số tiền hoàn dự kiến: ${formatCurrency(order.returnDetails.refundAmount)}` : ''}
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Hệ thống Shopee và Người bán đang xử lý khiếu nại. Nhân viên SPX Express sẽ liên hệ thu hồi sản phẩm miễn phí tại địa chỉ của bạn.
              </div>
            </div>
          </div>
        )}

        {/* ==========================================================================
            Logistics & Delivery Stepper Card (Carrier, Code, Cable Progress, Timeline)
            ========================================================================== */}
        {!isCancelled && (
          <div className="order-detail-logistics-box">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                flexWrap: 'wrap',
                gap: '10px',
                paddingBottom: '12px',
                borderBottom: '1px solid var(--border-light, #f1f5f9)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <TruckIcon size={16} />
                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {carrierName}
                </span>
                <button
                  type="button"
                  className="copy-pill"
                  onClick={() => handleCopy(trackingCode, 'Mã vận đơn SPX')}
                  title="Nhấn để sao chép mã vận đơn"
                >
                  {trackingCode} <CopyIcon size={11} />
                </button>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  · Hotline: <strong>{hotline}</strong> (24/7)
                </span>
              </div>

              {isShipping && handleOpenTracking && (
                <button
                  type="button"
                  className="shopee-btn shopee-btn-sm"
                  style={{
                    background: 'var(--primary-color, #2563eb)',
                    color: '#fff',
                    borderColor: 'var(--primary-color, #2563eb)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontWeight: 600,
                  }}
                  onClick={() => handleOpenTracking(order)}
                >
                  <MapPinIcon size={13} /> {t('spx_live_tracking', 'Bản đồ Shipper SPX')}
                </button>
              )}
            </div>

            {/* Stepper Progress Bar with Continuous Connector Wire */}
            <div className="stepper-track-wrapper" style={{ position: 'relative', margin: '12px 0 16px' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  left: '12.5%',
                  height: '3px',
                  background: 'linear-gradient(90deg, #38bdf8 0%, #2563eb 100%)',
                  borderRadius: '999px',
                  zIndex: 1,
                  width: `${((Math.min(activeStep || 1, 4) - 1) / 3) * 75}%`,
                  transition: 'width 0.4s ease',
                  boxShadow: '0 0 6px rgba(37, 99, 235, 0.35)',
                }}
              />
              <div className="stepper-stages">
                {STEPS.map((s) => {
                  const isPassed = activeStep > s.step || (activeStep === 4 && s.step === 4);
                  const isCurrent = activeStep === s.step && activeStep !== 4;
                  return (
                    <div
                      key={s.step}
                      className={`stepper-node ${isPassed ? 'completed' : ''} ${isCurrent ? 'active' : ''}`}
                    >
                      <div className="stepper-circle">
                        {isPassed ? <CheckIcon size={12} /> : s.step}
                      </div>
                      <div className="stepper-label">{s.label}</div>
                      <div className="stepper-desc">{s.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Timeline Events Audit Log (Vertical Logistics Stepper) */}
            {timelineEvents.length > 0 && (
              <div className="order-detail-timeline-container">
                <div className="order-detail-timeline-title">
                  <ClockIcon size={14} />
                  <span>Nhật ký hành trình đơn hàng:</span>
                </div>
                <div className="order-vertical-timeline">
                  {timelineEvents.map((tl, index) => {
                    const isLatest = index === timelineEvents.length - 1;
                    return (
                      <div key={index} className={`vertical-timeline-item ${isLatest ? 'latest' : ''}`}>
                        <div className="timeline-dot-wrap">
                          <div className="timeline-dot" />
                          {index < timelineEvents.length - 1 && <div className="timeline-connector-line" />}
                        </div>
                        <div className="timeline-content">
                          <div className="timeline-time">{tl.time}</div>
                          <div className="timeline-text">{tl.text}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==========================================================================
            2-Column Information Grid: Recipient Info & Payment/Invoice Info
            ========================================================================== */}
        <div className="order-detail-info-grid">
          {/* Recipient Information Card */}
          <div className="order-detail-info-card">
            <div className="info-card-header">
              <div className="info-card-title-group">
                <MapPinIcon size={15} />
                <span className="info-card-heading">
                  {t('shipping_address_title', 'THÔNG TIN NGƯỜI NHẬN')}
                </span>
              </div>
              <span className="info-card-tag">Người mua</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
              <strong style={{ fontSize: '14.5px', color: 'var(--text-primary)', fontWeight: 700 }}>
                {recipientName}
              </strong>
              <button
                type="button"
                className="copy-pill"
                onClick={() => handleCopy(recipientPhone, 'Số điện thoại')}
                title="Sao chép số điện thoại"
                style={{ fontSize: '12px' }}
              >
                {recipientPhone} <CopyIcon size={11} />
              </button>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '6px', lineHeight: 1.5, display: 'flex', alignItems: 'flex-start', gap: '6px' }}>
              <span>{recipientAddress}</span>
            </div>
            {orderNote ? (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--text-muted)',
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px dashed var(--border-medium, #e2e8f0)',
                  fontStyle: 'italic',
                }}
              >
                Ghi chú: {orderNote}
              </div>
            ) : (
              <div style={{ fontSize: '11.5px', color: '#059669', marginTop: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <CheckIcon size={12} /> Giao hàng tiêu chuẩn SPX Express an toàn
              </div>
            )}
          </div>

          {/* Payment & Invoice Information Card */}
          <div className="order-detail-info-card">
            <div className="info-card-header">
              <div className="info-card-title-group">
                <CreditCardIcon size={15} />
                <span className="info-card-heading">
                  {t('payment_info_title', 'THÔNG TIN THANH TOÁN')}
                </span>
              </div>
              <span className={`payment-status-badge ${isPaid ? 'paid' : isCancelled ? 'cancelled' : 'cod'}`}>
                {paymentStatusText}
              </span>
            </div>
            <div style={{ fontSize: '13px', color: 'var(--text-primary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: 'var(--text-secondary)' }}>Hình thức:</span>
              <strong style={{ fontWeight: 700 }}>{paymentMethod}</strong>
            </div>
            <div style={{ fontSize: '12.5px', color: 'var(--text-muted)', marginTop: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Mã giao dịch:</span>
              <button
                type="button"
                className="copy-pill"
                onClick={() => handleCopy(transactionId, 'Mã giao dịch')}
                title="Sao chép mã giao dịch"
                style={{ fontSize: '11.5px' }}
              >
                {transactionId} <CopyIcon size={11} />
              </button>
            </div>
            <div style={{ fontSize: '11.5px', color: '#1e40af', background: '#eff6ff', padding: '6px 10px', borderRadius: '6px', marginTop: '10px', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheckIcon size={13} color="#2563eb" />
              <span>Giao dịch an toàn được bảo hộ bởi Shopee SafePay</span>
            </div>
          </div>
        </div>

        {/* ==========================================================================
            Shop / Seller Profile Card (Avatar, Mall Badge, Rating, Chat Button)
            ========================================================================== */}
        <div className="order-detail-shop-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563eb 0%, #0ea5e9 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(37, 99, 235, 0.25)',
              }}
            >
              <StoreIcon size={20} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 800, fontSize: '14px', color: 'var(--text-primary)' }}>
                  {shopName}
                </span>
                <span
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '10.5px',
                    fontWeight: 800,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    letterSpacing: '0.5px',
                  }}
                >
                  MALL
                </span>
                <span
                  style={{
                    background: 'var(--primary-light, #eff6ff)',
                    color: 'var(--primary-color, #2563eb)',
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '1px 6px',
                    borderRadius: '4px',
                    border: '1px solid var(--primary-border, #bfdbfe)',
                  }}
                >
                  Yêu thích+
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <StarIcon size={12} className="text-amber-500" />
                <span>4.9/5.0 (12.4k đánh giá) · Phản hồi Chat: 100% trong 5 phút</span>
              </div>
            </div>
          </div>

          <div>
            {onOpenChat && (
              <button
                type="button"
                className="shopee-order-btn-outline"
                style={{
                  fontWeight: 600,
                  fontSize: '12.5px',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
                onClick={() => onOpenChat(order)}
              >
                <ChatIcon size={13} /> {t('chat_with_shop', 'Chat với Shop')}
              </button>
            )}
          </div>
        </div>

        {/* ==========================================================================
            Order Items List (Images, Variant SKU, Pricing, Buy Again Item)
            ========================================================================== */}
        <div className="order-detail-items-card">
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid var(--border-light, #f1f5f9)',
            }}
          >
            <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Danh Sách Sản Phẩm ({items.length})
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <ShieldCheckIcon size={13} /> Đổi trả miễn phí 15 ngày · 100% Chính hãng
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
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
                    gap: '14px',
                    padding: '12px 14px',
                    borderRadius: '10px',
                    background: 'var(--bg-muted, #f8fafc)',
                    border: '1px solid var(--border-medium, #e2e8f0)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: '1 1 260px', minWidth: '220px' }}>
                    <img
                      src={itemImg}
                      alt={item.name}
                      style={{
                        width: '56px',
                        height: '56px',
                        borderRadius: '8px',
                        objectFit: 'cover',
                        border: '1px solid var(--border-medium, #cbd5e1)',
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
                          fontSize: '13.5px',
                          fontWeight: 600,
                          color: 'var(--text-primary)',
                          lineHeight: 1.35,
                        }}
                      >
                        {item.name}
                      </div>
                      {(() => {
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
                          <div className="shopee-order-item-meta-line" style={{ marginTop: '4px' }}>
                            <span>Phân loại: {finalVariant}</span>
                            <span className="meta-pipe"> | </span>
                            <span>Kích thước: {finalSize}</span>
                            <span className="meta-pipe"> | </span>
                            <span>Số lượng: x{itemQty}</span>
                          </div>
                        );
                      })()}
                      <div className="shopee-order-trust-tag" style={{ marginTop: '4px' }}>
                        <ShieldCheckIcon size={13} color="#2563eb" />
                        <span>100% Chính hãng</span>
                        <span className="trust-dot">·</span>
                        <ReturnIcon size={12} color="#2563eb" />
                        <span>Đổi trả trong 15 ngày</span>
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '14.5px', fontWeight: 800, color: 'var(--text-primary)' }}>
                        {formatCurrency(itemTotal)}
                      </div>
                    </div>

                    {onBuyAgainItem && (
                      <button
                        type="button"
                        className="shopee-order-btn-outline"
                        style={{
                          fontSize: '12px',
                          padding: '5px 12px',
                          fontWeight: 600,
                          whiteSpace: 'nowrap',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                        onClick={() => onBuyAgainItem(item)}
                        title="Thêm sản phẩm này vào giỏ hàng"
                      >
                        <RefreshIcon size={12} /> {t('buy_again', 'Mua lại')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==========================================================================
            Transparent Financial Cost Sheet (Bảng Kê Chi Phí Chi Tiết Minh Bạch)
            ========================================================================== */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '20px' }}>
          <div className="fee-breakdown-table" style={{ width: '100%', maxWidth: '420px', borderRadius: '12px', padding: '16px 20px' }}>
            <div style={{ fontSize: '13.5px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '10px', paddingBottom: '6px', borderBottom: '1px solid var(--border-light, #e2e8f0)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ReceiptIcon size={14} />
              <span>Bảng Kê Chi Phí Đơn Hàng</span>
            </div>

            <div className="fee-row">
              <span className="fee-label">{t('subtotal', 'Tiền hàng (tạm tính)')}:</span>
              <span className="fee-value">{formatCurrency(itemSubtotal)}</span>
            </div>

            <div className="fee-row">
              <span className="fee-label">{t('shipping_fee', 'Phí vận chuyển tiêu chuẩn')}:</span>
              <span className="fee-value">
                {shippingFee === 0 ? 'Miễn phí' : `+${formatCurrency(shippingFee)}`}
              </span>
            </div>

            {voucherDiscount > 0 && (
              <div className="fee-row discount-row">
                <span className="fee-label">{t('voucher_discount', 'Giảm giá Voucher Sàn')}:</span>
                <span className="fee-value discount">-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}

            {coinsDiscount > 0 && (
              <div className="fee-row discount-row">
                <span className="fee-label">{t('coins_discount', 'Giảm trừ Shopee Xu')}:</span>
                <span className="fee-value discount">-{formatCurrency(coinsDiscount)}</span>
              </div>
            )}

            <div
              className="fee-row total-row"
              style={{
                marginTop: '10px',
                paddingTop: '10px',
                borderTop: '2px dashed var(--border-medium, #cbd5e1)',
              }}
            >
              <div>
                <div className="fee-label" style={{ fontWeight: 800, fontSize: '15px' }}>
                  {t('total_payment', 'Tổng số tiền thanh toán')}:
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  (Đã bao gồm thuế GTGT và phí vận chuyển)
                </div>
              </div>
              <span
                className="fee-value total"
                style={{
                  color: 'var(--text-primary, #0f172a)',
                  fontWeight: 800,
                  fontSize: '20px',
                  letterSpacing: '-0.4px',
                }}
              >
                {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>
        </div>

        {/* ==========================================================================
            Buyer Guarantee & Protection Banner
            ========================================================================== */}
        {/* ==========================================================================
            Buyer Guarantee & Protection Banner
            ========================================================================== */}
        <div
          style={{
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <span style={{ color: '#2563eb', flexShrink: 0 }}>
            <ShieldCheckIcon size={20} />
          </span>
          <div style={{ fontSize: '12.5px', color: '#475569', lineHeight: 1.4 }}>
            <strong style={{ color: '#0f172a' }}>Shopee Đảm Bảo:</strong> Tiền thanh toán của bạn sẽ được giữ an toàn và chỉ chuyển cho Người bán khi bạn hài lòng với kiện hàng. Đổi trả miễn phí trong vòng 15 ngày nếu có lỗi từ nhà sản xuất.
          </div>
        </div>
        </div>

        {/* ==========================================================================
            Action Toolbar at Footer (Stage-Specific Buttons)
            ========================================================================== */}
        <div
          className="order-detail-footer-bar"
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            borderTop: '1px solid #f1f5f9',
            background: '#f8fafc',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: '8px',
            margin: 0,
          }}
        >
          {/* Left actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {onOpenChat && (
              <button
                type="button"
                className="shopee-order-btn-outline"
                onClick={() => onOpenChat(order)}
              >
                <ChatIcon size={13} /> {t('chat_with_shop', 'Chat với Shop')}
              </button>
            )}

            {!isCancelled && !isReturning && activeStep < 4 && onSimulateStep && (
              <button
                type="button"
                className="shopee-btn"
                style={{
                  fontSize: '12px',
                  background: 'var(--primary-light, #eff6ff)',
                  border: '1px solid var(--primary-border, #bfdbfe)',
                  color: 'var(--primary-color, #2563eb)',
                  fontWeight: 700,
                  padding: '6px 12px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  height: '32px',
                }}
                onClick={() => onSimulateStep(orderId)}
                title="Mô phỏng bưu tá giao hàng bước tiếp theo"
              >
                {t('order_track_simulate_step', 'Mô phỏng giao')}
              </button>
            )}
          </div>

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* If pending or confirmed: Cancel Order button */}
            {(isPending || isConfirmed) && !isReturning && onOpenCancelOrder && (
              <button
                type="button"
                className="shopee-order-btn-danger-outline"
                onClick={() => onOpenCancelOrder(order)}
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
              >
                <TruckIcon size={13} /> {t('spx_live_tracking', 'Bản đồ Shipper SPX')}
              </button>
            )}

            {/* If returning: show processing status tag & VAT invoice */}
            {isReturning && (
              <>
                <span
                  style={{
                    fontSize: '12px',
                    padding: '5px 12px',
                    borderRadius: '6px',
                    background: '#eff6ff',
                    color: '#2563eb',
                    border: '1px solid #bfdbfe',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    height: '32px',
                  }}
                >
                  <ReturnIcon size={13} /> {t('return_processing_status', 'Đang xử lý đổi trả')}
                </span>
                {onOpenInvoice && (
                  <button
                    type="button"
                    className="shopee-order-btn-outline"
                    onClick={() => onOpenInvoice(order)}
                  >
                    <ReceiptIcon size={13} /> {t('vat_invoice', 'In hóa đơn VAT')}
                  </button>
                )}
              </>
            )}

            {/* If completed: Review (+200 coins), Return/Refund, VAT Invoice */}
            {isCompleted && !isReturning && (
              <>
                {onOpenReviewModal && (
                  <button
                    type="button"
                    className="shopee-order-btn-review"
                    onClick={() => onOpenReviewModal(order)}
                  >
                    <StarIcon size={13} color="#facc15" filled /> {t('review_order_reward', 'Đánh giá (+200 Xu)')}
                  </button>
                )}

                {onOpenReturnModal && (
                  <button
                    type="button"
                    className="shopee-order-btn-outline"
                    onClick={() => onOpenReturnModal(order)}
                  >
                    <ReturnIcon size={13} /> {t('return_refund', 'Trả hàng / Hoàn tiền')}
                  </button>
                )}

                {onOpenInvoice && (
                  <button
                    type="button"
                    className="shopee-order-btn-outline"
                    onClick={() => onOpenInvoice(order)}
                  >
                    <ReceiptIcon size={13} /> {t('vat_invoice', 'In hóa đơn VAT')}
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
              >
                <RefreshIcon size={13} /> {t('buy_again_whole', 'Mua lại cả đơn')}
              </button>
            )}

            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={onClose}
            >
              ✕ {t('close', 'Đóng')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
