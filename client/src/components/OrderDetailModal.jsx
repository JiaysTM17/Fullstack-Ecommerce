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
  SparklesIcon,
  CloseIcon,
  ArrowLeftIcon,
} from './OrdersIcons';

// Safe date parsing supporting multiple formats: ISO, DD/MM/YYYY, HH:mm DD/MM/YYYY
const parseDateSafe = (val) => {
  if (!val) return new Date();
  if (val instanceof Date && !isNaN(val.getTime())) return val;
  const s = String(val).trim();
  const d1 = new Date(s);
  if (!isNaN(d1.getTime())) return d1;
  // Regex matching "HH:mm DD/MM/YYYY" or "DD/MM/YYYY HH:mm" or "DD/MM/YYYY"
  const m = s.match(/(?:(\d{1,2}):(\d{2})(?::(\d{2}))?\s+)?(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (m) {
    const [, hh, mm, ss, day, mon, yr] = m;
    const d2 = new Date(Number(yr), Number(mon) - 1, Number(day), Number(hh || 12), Number(mm || 0), Number(ss || 0));
    if (!isNaN(d2.getTime())) return d2;
  }
  return new Date();
};

const formatDateTime = (d) => {
  try {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const mon = String(d.getMonth() + 1).padStart(2, '0');
    const yr = d.getFullYear();
    return `${hh}:${mm} ${day}/${mon}/${yr}`;
  } catch {
    return 'Hôm nay';
  }
};

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
  inline = false,
}) {
  if (isOpen === false || !order) return null;

  // Timeline collapsed by default so products & payments are immediately visible without long scroll
  const [showDetailedTimeline, setShowDetailedTimeline] = useState(false);

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

  // Format Order Date robustly
  const orderDateObj = parseDateSafe(order.createdAt || order.orderDate);
  const formattedDate = formatDateTime(orderDateObj);

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
      return { text: order.statusText || 'Đã hủy', className: 'status-cancelled', bg: '#fef2f2', color: '#dc2626', icon: <ReturnIcon size={12} color="#dc2626" /> };
    }
    if (isReturning) {
      return { text: order.statusText || 'Đang xử lý đổi trả', className: 'status-returning', bg: '#eff6ff', color: '#2563eb', icon: <ReturnIcon size={12} color="#9333ea" /> };
    }
    if (isCompleted) {
      return { text: order.statusText || 'Giao thành công', className: 'status-completed', bg: '#f0fdf4', color: '#16a34a', icon: <CheckIcon size={12} color="#16a34a" /> };
    }
    if (isShipping) {
      return { text: order.statusText || 'Đang giao hàng', className: 'status-shipping', bg: '#eff6ff', color: '#2563eb', icon: <TruckIcon size={12} color="#2563eb" /> };
    }
    if (isConfirmed) {
      return { text: order.statusText || 'Đã xác nhận', className: 'status-confirmed', bg: '#eff6ff', color: '#2563eb', icon: <PackageIcon size={12} color="#2563eb" /> };
    }
    return { text: order.statusText || 'Chờ xác nhận', className: 'status-pending', bg: '#fefce8', color: '#ca8a04', icon: <ClockIcon size={12} color="#ca8a04" /> };
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

  // Fee Breakdown Calculation - Ultra Thorough & Transparent
  let rawItems = Array.isArray(order.items) && order.items.length > 0
    ? order.items
    : Array.isArray(order.products) && order.products.length > 0
    ? order.products
    : Array.isArray(order.orderItems) && order.orderItems.length > 0
    ? order.orderItems
    : [];

  if (rawItems.length === 0) {
    rawItems = [{
      name: order.productName || order.name || (order.shopName?.toLowerCase().includes('tech') ? 'Tai nghe Bluetooth True Wireless chống ồn chủ động Hybrid ANC SoundPeak Pro' : 'Áo sơ mi nữ công sở lụa satin cao cấp chống nhăn thanh lịch'),
      price: Math.max(0, order.price || order.subtotal || order.total || 259000),
      quantity: order.quantity || 2,
      variant: order.variant || order.color || 'Xanh dương',
      size: order.size || 'Freesize',
      image: order.image || order.thumbnail || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
    }];
  }

  // Deep sanitize each item to guarantee proper display without collapsing
  const items = rawItems.map((it, idx) => {
    const rawName = it?.name || it?.title || it?.productName || order.productName || order.name;
    const defaultName = order.shopName?.toLowerCase().includes('tech')
      ? 'Tai nghe Bluetooth True Wireless chống ồn chủ động Hybrid ANC SoundPeak Pro'
      : 'Áo sơ mi nữ công sở lụa satin cao cấp chống nhăn thanh lịch';
    return {
      _id: it?._id || it?.id || `item-${idx}`,
      name: rawName || defaultName,
      price: Number(it?.price) || Number(order.price) || (rawItems.length === 1 ? Number(order.subtotal) || Number(order.total) || 259000 : 259000),
      quantity: Number(it?.quantity) || Number(order.quantity) || 1,
      variant: it?.variant || it?.color || 'Xanh dương',
      size: it?.size || 'Freesize',
      image: it?.image || it?.thumbnail || 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200',
    };
  });

  const itemSubtotal = order.subtotal !== undefined
    ? Number(order.subtotal)
    : items.reduce((sum, it) => sum + (Number(it.price || 0) * (Number(it.quantity) || 1)), 0);

  const rawTotal = order.total !== undefined
    ? Number(order.total)
    : order.finalTotal !== undefined
    ? Number(order.finalTotal)
    : itemSubtotal;

  let voucherDiscount = Number(
    order.voucherDiscount ||
    order.discount ||
    order.discountAmount ||
    order.voucherAmount ||
    order.voucher?.discount ||
    order.voucher?.discountAmount ||
    order.appliedVoucher?.discount ||
    order.appliedVoucher?.discountAmount ||
    0
  );

  let coinsDiscount = Number(
    order.coinsDiscount ||
    order.coinDiscount ||
    order.coinsUsed ||
    order.coinsDeducted ||
    order.usedCoinsDiscount ||
    0
  );

  let shippingFee = 0;
  if (order.shippingFee !== undefined && order.shippingFee !== null) {
    shippingFee = Number(order.shippingFee);
  } else if (rawTotal > itemSubtotal) {
    shippingFee = rawTotal - itemSubtotal;
  }

  // Deduce voucher discount if subtotal + shippingFee exceeds total and no explicit voucher discount was provided
  const netDue = (itemSubtotal + shippingFee) - (rawTotal + coinsDiscount);
  if (netDue > 0 && voucherDiscount === 0) {
    voucherDiscount = netDue;
  } else if (netDue > voucherDiscount) {
    voucherDiscount = netDue;
  }

  const finalTotal = rawTotal;
  const totalSavings = Math.max(0, voucherDiscount + coinsDiscount);
  const voucherCode = order.voucherCode || order.voucher?.code || order.appliedVoucher?.code || (voucherDiscount > 0 ? 'SHOPEEVOUCHER100K' : null);

  // Stepper Stages Definition
  const STEPS = [
    { step: 1, label: 'Đặt hàng' },
    { step: 2, label: 'Đã xác nhận' },
    { step: 3, label: 'Đang giao' },
    { step: 4, label: 'Giao thành công' },
  ];

  const shopName = order.shopName || 'Shopee Mall Official';

  // Construct Detailed Tracking Timeline Events Log with Robust Time Formatting
  const getTrackingEvents = () => {
    const baseDate = orderDateObj;
    const formatEventTime = (offsetHours) => {
      const d = new Date(baseDate.getTime() + offsetHours * 3600 * 1000);
      return formatDateTime(d);
    };

    const events = [];

    if (isCancelled) {
      events.push({
        time: formatEventTime(2),
        title: 'Đơn hàng đã hủy',
        desc: `Đơn hàng đã được hủy thành công. Lý do: ${order.cancelReason || 'Người mua yêu cầu hủy'}. Tiền và Shopee Xu (nếu có) đã hoàn về ví.`,
        active: true,
        type: 'danger',
      });
      events.push({
        time: formatEventTime(0),
        title: 'Đặt hàng thành công',
        desc: 'Đơn hàng đã được tạo thành công trên hệ thống Shopee.',
        active: false,
        type: 'done',
      });
      return events;
    }

    if (isReturning) {
      events.push({
        time: formatEventTime(30),
        title: 'Yêu cầu trả hàng / hoàn tiền đang xử lý',
        desc: `Hệ thống tiếp nhận yêu cầu khiếu nại trả hàng. Lý do: ${order.returnDetails?.reason || 'Hàng lỗi / hư hỏng'}.`,
        active: true,
        type: 'primary',
      });
    }

    if (isCompleted) {
      events.push({
        time: formatEventTime(28),
        title: 'Giao hàng thành công',
        desc: 'Người nhận đã nhận hàng và ký xác nhận kiện hàng nguyên vẹn.',
        active: true,
        type: 'success',
      });
    }

    if (isShipping || isCompleted) {
      events.push({
        time: formatEventTime(24),
        title: 'Bưu tá đang phát hàng',
        desc: `Shipper Nguyễn Văn Hùng (${order.courier?.phone || '0908 123 456'}) đang trên đường giao hàng đến địa chỉ người nhận.`,
        active: isShipping && !isCompleted,
        type: 'primary',
      });
      events.push({
        time: formatEventTime(18),
        title: 'Đã đến trạm phân loại đích',
        desc: 'Kiện hàng đã nhập kho phân loại SPX Tân Bình, TP. Hồ Chí Minh.',
        active: false,
        type: 'done',
      });
      events.push({
        time: formatEventTime(10),
        title: 'Rời kho trung chuyển',
        desc: 'Kiện hàng đã xuất kho trung chuyển tổng SPX Hub Củ Chi.',
        active: false,
        type: 'done',
      });
    }

    if (isConfirmed || isShipping || isCompleted) {
      events.push({
        time: formatEventTime(4),
        title: 'Đã bàn giao cho đơn vị vận chuyển',
        desc: `Shop đã đóng gói hoàn tất và bàn giao cho bưu tá ${carrierName}.`,
        active: isConfirmed && !isShipping && !isCompleted,
        type: isConfirmed && !isShipping && !isCompleted ? 'primary' : 'done',
      });
      events.push({
        time: formatEventTime(1),
        title: 'Shop đã xác nhận đơn hàng',
        desc: 'Người bán đã chuẩn bị hàng và in phiếu đóng gói.',
        active: false,
        type: 'done',
      });
    }

    events.push({
      time: formatEventTime(0),
      title: 'Đặt hàng thành công',
      desc: 'Đơn hàng đã được khởi tạo và ghi nhận thành công trên hệ thống Shopee.',
      active: isPending,
      type: isPending ? 'primary' : 'done',
    });

    return events;
  };

  const trackingEvents = getTrackingEvents();

  const modalInner = (
    <div
      className={`order-detail-modal-container ${inline ? 'order-detail-inline-container' : 'anim-modal-content'}`}
      style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: inline ? '12px' : '14px',
        width: '100%',
        maxWidth: inline ? '100%' : '760px',
        maxHeight: inline ? 'none' : '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: inline ? 'none' : '0 20px 40px -10px rgba(0, 0, 0, 0.28)',
        border: inline ? 'none' : '1px solid #e2e8f0',
        position: 'relative',
        overflow: inline ? 'visible' : 'hidden',
        padding: 0,
        margin: inline ? '0' : 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
        {/* ==========================================================================
            1. Header: Order ID, Date, Status Pill, Print & Close Actions
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
                  gap: '4px',
                  marginRight: '4px',
                }}
              >
                <ArrowLeftIcon size={13} color="#2563eb" />
                <span>Quay lại danh sách</span>
              </button>
            )}
            <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
              <PackageIcon size={17} color="#2563eb" />
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
              <CopyIcon size={10} color="#2563eb" />
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
              <PrinterIcon size={12} color="#6366f1" /> {t('print', 'In')}
            </button>
            {!inline && (
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
                  borderRadius: '6px',
                }}
              >
                <CloseIcon size={14} color="#64748b" />
              </button>
            )}
          </div>
        </div>

        {/* ==========================================================================
            2. Scrollable Body: Natural height in inline mode
            ========================================================================== */}
        <div
          className="order-detail-scroll-body"
          style={{
            padding: inline ? '16px 0' : '14px 18px',
            overflowY: inline ? 'visible' : 'auto',
            flex: inline ? 'initial' : '1 1 auto',
            minHeight: 0,
            maxHeight: inline ? 'none' : 'calc(90vh - 110px)',
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
                <ReturnIcon size={15} color="#ef4444" />
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
                <ReturnIcon size={15} color="#9333ea" />
              </span>
              <div style={{ flex: 1, fontSize: '12px', color: '#1e40af', lineHeight: 1.4 }}>
                <strong>Yêu cầu Trả hàng / Hoàn tiền đang được xử lý:</strong> {order.returnDetails?.reason || 'Sản phẩm lỗi hoặc hư hỏng'}
                {order.returnDetails?.refundAmount ? ` · Tiền hoàn: ${formatCurrency(order.returnDetails.refundAmount)}` : ''}. Shopee & Người bán đang giải quyết khiếu nại.
              </div>
            </div>
          )}

          {/* Logistics & Tracking Stepper + Detailed Event History */}
          {!isCancelled && (
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
              }}
            >
              {/* Carrier Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <TruckIcon size={14} color="#2563eb" />
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                    {carrierName}
                  </span>
                  <span style={{ fontSize: '11px', color: '#64748b' }}>
                    · Mã vận đơn: <strong style={{ color: '#0f172a' }}>{trackingCode}</strong>
                  </span>
                  <button
                    type="button"
                    className="copy-pill"
                    onClick={() => handleCopy(trackingCode, 'Mã vận đơn')}
                    title="Sao chép mã vận đơn"
                    style={{ fontSize: '10.5px', padding: '1px 6px', cursor: 'pointer' }}
                  >
                    <CopyIcon size={10} color="#2563eb" />
                  </button>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button
                    type="button"
                    onClick={() => setShowDetailedTimeline((prev) => !prev)}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      color: '#2563eb',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '2px 4px',
                    }}
                  >
                    <ClockIcon size={11} color="#2563eb" />
                    {showDetailedTimeline ? 'Thu gọn lịch trình' : 'Xem lịch trình chi tiết'}
                  </button>

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
                      <MapPinIcon size={11} color="#2563eb" /> {t('spx_live_tracking', 'Bản đồ Shipper SPX')}
                    </button>
                  )}
                </div>
              </div>

              {/* Horizontal Stepper Progress */}
              <div style={{ position: 'relative', width: '100%', margin: '6px 0 8px' }}>
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

              {/* Detailed Logistics Timeline Events Log */}
              {showDetailedTimeline && (
                <div
                  style={{
                    marginTop: '10px',
                    paddingTop: '8px',
                    borderTop: '1px dashed #cbd5e1',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                  }}
                >
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                    Nhật ký hành trình bưu kiện ({trackingEvents.length} mốc thời gian)
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '140px', overflowY: 'auto' }}>
                    {trackingEvents.map((evt, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '8px',
                          fontSize: '11.5px',
                          lineHeight: 1.4,
                        }}
                      >
                        <div
                          style={{
                            width: '7px',
                            height: '7px',
                            borderRadius: '50%',
                            background: evt.active ? '#2563eb' : '#94a3b8',
                            boxShadow: evt.active ? '0 0 0 3px #bfdbfe' : 'none',
                            marginTop: '5px',
                            flexShrink: 0,
                          }}
                        />
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: evt.active ? 700 : 600, color: evt.active ? '#2563eb' : '#0f172a' }}>
                            {evt.title}
                          </span>
                          <span style={{ color: '#64748b', margin: '0 4px' }}>·</span>
                          <span style={{ color: '#64748b', fontSize: '11px' }}>{evt.time}</span>
                          <div style={{ color: '#475569', fontSize: '11px', marginTop: '1px' }}>
                            {evt.desc}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. 2-Column Delivery Address & Logistics Profile Grid */}
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
                    {recipientPhone} <CopyIcon size={10} color="#2563eb" />
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

            {/* Carrier & Delivery Dispatch Info Card */}
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
                    <TruckIcon size={13} color="#2563eb" />
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.4px', textTransform: 'uppercase' }}>
                      {t('logistics_info_title', 'Thông Tin Giao Nhận')}
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '1px 6px',
                      borderRadius: '4px',
                      background: '#eff6ff',
                      color: '#1d4ed8',
                    }}
                  >
                    Tiết Kiệm (SPX)
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: '#0f172a', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: '#64748b' }}>Đơn vị vận chuyển:</span>
                  <strong>{carrierName}</strong>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span>Hotline khiếu nại:</span>
                  <strong style={{ color: '#0f172a' }}>{hotline}</strong>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span>Thời gian giao dự kiến:</span>
                  <span style={{ color: '#16a34a', fontWeight: 600 }}>Trong ngày</span>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#15803d', background: '#f0fdf4', padding: '4px 8px', borderRadius: '4px', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                <ShieldCheckIcon size={12} color="#16a34a" />
                <span>Giao hàng an toàn · Cho phép kiểm tra hàng</span>
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
                <span style={{ fontSize: '11px', color: '#64748b', display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  · 4.9 <StarIcon size={11} color="#f59e0b" /> (12k đánh giá)
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
                  <ChatIcon size={11} color="#2563eb" /> {t('chat_with_shop', 'Chat Shop')}
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
                        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px' }}>
                            Phân loại: {finalVariant}
                          </span>
                          <span style={{ background: '#f1f5f9', padding: '1px 5px', borderRadius: '3px' }}>
                            Kích thước: {finalSize}
                          </span>
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            x{itemQty}
                          </span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '3px' }}>
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
                          <RefreshIcon size={10} color="#2563eb" /> Mua lại
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 5. Comprehensive Financial Cost Breakdown & Payment Details (2-Column Grid) */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '10px',
            }}
          >
            {/* Payment & Trust Card */}
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
                      {t('payment_info_title', 'Phương Thức Thanh Toán')}
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
                  <span style={{ color: '#64748b' }}>Hình thức:</span>
                  <strong>{paymentMethod}</strong>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginTop: '3px' }}>
                  <span>Mã giao dịch:</span>
                  <span
                    className="copy-pill"
                    onClick={() => handleCopy(transactionId, 'Mã GD')}
                    style={{ fontSize: '11px', cursor: 'pointer' }}
                  >
                    {transactionId} <CopyIcon size={10} color="#2563eb" />
                  </span>
                </div>
              </div>

              <div style={{ fontSize: '11px', color: '#1e40af', background: '#eff6ff', padding: '6px 8px', borderRadius: '4px', marginTop: '6px', display: 'flex', alignItems: 'flex-start', gap: '6px', lineHeight: 1.35 }}>
                <ShieldCheckIcon size={13} color="#2563eb" style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>Shopee SafePay bảo hộ: Tiền chỉ chuyển cho shop sau khi bạn nhận hàng và hài lòng 100%.</span>
              </div>
            </div>

            {/* Financial Cost Breakdown Card */}
            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '10px 14px',
                boxSizing: 'border-box',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontSize: '11px', fontWeight: 800, color: '#475569', letterSpacing: '0.4px', textTransform: 'uppercase', marginBottom: '6px' }}>
                  Bảng Kê Chi Phí Thanh Toán
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Tiền hàng (tạm tính):</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>{formatCurrency(itemSubtotal)}</span>
                </div>
                <div style={{ fontSize: '11.5px', color: '#64748b', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span>Phí vận chuyển (SPX):</span>
                  <span style={{ color: '#0f172a', fontWeight: 600 }}>
                    {shippingFee === 0 ? 'Miễn phí (Freeship Xtra)' : formatCurrency(shippingFee)}
                  </span>
                </div>
                {voucherDiscount > 0 && (
                  <div style={{ fontSize: '11.5px', color: '#16a34a', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <span>Voucher giảm giá:</span>
                      {voucherCode && (
                        <span style={{ fontSize: '10px', background: '#dcfce7', color: '#15803d', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                          #{voucherCode}
                        </span>
                      )}
                    </span>
                    <strong>-{formatCurrency(voucherDiscount)}</strong>
                  </div>
                )}
                {coinsDiscount > 0 && (
                  <div style={{ fontSize: '11.5px', color: '#16a34a', display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                    <span>Shopee Xu khấu trừ:</span>
                    <strong>-{formatCurrency(coinsDiscount)}</strong>
                  </div>
                )}
              </div>

              <div>
                <div
                  style={{
                    marginTop: '6px',
                    paddingTop: '6px',
                    borderTop: '1px dashed #cbd5e1',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'baseline',
                  }}
                >
                  <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a' }}>
                    Tổng thanh toán:
                  </span>
                  <span style={{ fontSize: '17px', fontWeight: 800, color: '#2563eb' }}>
                    {formatCurrency(finalTotal)}
                  </span>
                </div>

                {totalSavings > 0 && (
                  <div
                    style={{
                      marginTop: '4px',
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      borderRadius: '4px',
                      padding: '3px 8px',
                      color: '#15803d',
                      fontSize: '11px',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <SparklesIcon size={13} color="#15803d" />
                    <span>Tiết kiệm được {formatCurrency(totalSavings)} cho đơn hàng này</span>
                  </div>
                )}
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
                style={{ height: '32px', fontSize: '12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <ReceiptIcon size={12} color="#2563eb" /> {t('vat_invoice', 'In hóa đơn VAT')}
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
                style={{ height: '32px', fontSize: '12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
              >
                <CloseIcon size={12} color="#ef4444" /> {t('cancel_order', 'Hủy đơn hàng')}
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
                <TruckIcon size={12} color="#2563eb" /> {t('spx_live_tracking', 'Bản đồ Shipper SPX')}
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
                <ReturnIcon size={12} color="#9333ea" /> {t('return_processing_status', 'Đang xử lý đổi trả')}
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
                    <CheckIcon size={12} color="#16a34a" /> Đã đánh giá (+200 Xu)
                  </span>
                ) : (
                  onOpenReviewModal && (
                    <button
                      type="button"
                      className="shopee-order-btn-review"
                      onClick={() => onOpenReviewModal(order)}
                      style={{
                        height: '32px',
                        fontSize: '12px',
                        borderRadius: '6px',
                        background: '#2563eb',
                        borderColor: '#2563eb',
                        color: '#ffffff',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '5px',
                        fontWeight: 700,
                      }}
                    >
                      <StarIcon size={13} color="#facc15" filled /> {t('review_order_reward', 'Đánh giá (+200 Xu)')}
                    </button>
                  )
                )}

                {onOpenReturnModal && (
                  <button
                    type="button"
                    className="shopee-order-btn-outline"
                    onClick={() => onOpenReturnModal(order)}
                    style={{ height: '32px', fontSize: '12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                  >
                    <ReturnIcon size={12} color="#9333ea" /> {t('return_refund', 'Trả hàng / Hoàn tiền')}
                  </button>
                )}
              </>
            )}

            {/* Reorder button - Clear, friendly Shopee action */}
            {onReorderWhole && items.length > 0 && (
              <button
                type="button"
                className="shopee-order-btn-outline"
                onClick={() => onReorderWhole(order)}
                title="Thêm các sản phẩm của đơn hàng này vào giỏ hàng"
                style={{
                  height: '32px',
                  fontSize: '12px',
                  borderRadius: '6px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px',
                  borderColor: '#bfdbfe',
                  color: '#2563eb',
                  background: '#eff6ff',
                  fontWeight: 600,
                }}
              >
                <RefreshIcon size={12} color="#2563eb" /> {t('buy_again', 'Mua lại')}
              </button>
            )}

            <button
              type="button"
              className="shopee-order-btn-outline"
              onClick={onClose}
              style={{ height: '32px', fontSize: '12px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
            >
              <CloseIcon size={12} color="#64748b" /> {t('close', 'Đóng')}
            </button>
          </div>
        </div>
      </div>
  );

  if (inline) {
    return modalInner;
  }

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
      {modalInner}
    </div>
  );
}
