import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';
import InvoiceReceiptModal from '../components/InvoiceReceiptModal';
import RewardsHubModal from '../components/RewardsHubModal';
import VietQRPaymentModal from '../components/VietQRPaymentModal';
import {
  CheckIcon,
  CopyIcon,
  TruckIcon,
  ReceiptIcon,
  BoltIcon,
  HomeIcon,
  QrCodeIcon,
  ShieldCheckIcon,
} from '../components/OrdersIcons';

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);
  const [showVietQRModal, setShowVietQRModal] = useState(false);
  const [isVietQRPaid, setIsVietQRPaid] = useState(false);

  const orderId = location.state?.orderId || `ORD${Math.floor(100000 + Math.random() * 900000)}`;
  const total = location.state?.total || 0;
  const paymentMethod = location.state?.paymentMethod || 'COD';
  const shippingAddress = location.state?.shippingAddress || '';
  const customerName = location.state?.customerName || '';
  const phone = location.state?.phone || '';
  const items = location.state?.items || [];
  const voucherDiscount = location.state?.voucherDiscount || 0;
  const shippingFee = location.state?.shippingFee || 0;
  const voucherCode = location.state?.voucherCode || null;

  const orderData = {
    orderId,
    total,
    paymentMethod: paymentMethod === 'BANK' ? 'Chuyển khoản VietQR' : paymentMethod === 'MOMO' ? 'Ví MoMo/ZaloPay' : paymentMethod === 'CARD' ? 'Thẻ Visa/Master' : 'Thanh toán khi nhận hàng (COD)',
    shippingAddress,
    customerName,
    phone,
    items,
    voucherDiscount,
    shippingFee,
    voucherCode,
    createdAt: new Date().toLocaleString('vi-VN'),
  };

  const handleCopyOrderId = () => {
    navigator.clipboard?.writeText(orderId);
    showToast(`Đã sao chép mã đơn: ${orderId}`, 'success');
  };

  return (
    <main className="shopee-container" style={{ padding: '48px 16px', maxWidth: '680px' }}>
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          padding: '36px 28px',
          border: '1px solid var(--border-medium, #e2e8f0)',
          boxShadow: 'var(--shadow-md, 0 4px 20px rgba(0,0,0,0.06))',
          textAlign: 'center',
        }}
      >
        {/* Animated Celebration Icon */}
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #10b981, #059669)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
          }}
        >
          <CheckIcon size={36} color="#ffffff" />
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {t('order_success_title', 'Đặt Hàng Thành Công!')}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: '1.6' }}>
          {t('order_success_subtitle', 'Cảm ơn bạn đã tin tưởng mua sắm tại Fullstack E-Commerce.')} Thông tin xác nhận và mã vận đơn đã được gửi tới hệ thống xử lý.
        </p>

        {/* Order Details Card */}
        <div
          style={{
            background: 'var(--bg-muted, #f8fafc)',
            borderRadius: '12px',
            padding: '20px',
            border: '1px solid var(--border-light, #e2e8f0)',
            textAlign: 'left',
            marginBottom: '28px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('order_code_label', 'Mã đơn hàng')}:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <strong style={{ fontSize: '16px', color: 'var(--primary-color, #ea580c)', letterSpacing: '0.5px' }}>
                {orderId}
              </strong>
              <button
                type="button"
                onClick={handleCopyOrderId}
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  border: '1px solid var(--border-medium, #cbd5e1)',
                  borderRadius: '6px',
                  padding: '2px 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <CopyIcon size={12} color="#2563eb" /> Sao chép
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
            <strong style={{ fontSize: '18px', color: 'var(--text-primary)', fontWeight: 800 }}>
              {formatCurrency(total)}
            </strong>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Phương thức thanh toán:</span>
            <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)' }}>
              {orderData.paymentMethod}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Đơn vị vận chuyển:</span>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#16a34a', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TruckIcon size={13} color="#16a34a" />
              </span>
              <span>SPX Express (Giao hàng dự kiến 24H)</span>
            </span>
          </div>
        </div>

        {/* VietQR Quick Payment Action for Bank Transfer orders */}
        {(paymentMethod === 'BANK' || orderData.paymentMethod.includes('VietQR')) && (
          <div
            style={{
              background: isVietQRPaid ? '#f0fdf4' : '#eff6ff',
              border: `1.5px solid ${isVietQRPaid ? '#bbf7d0' : '#bfdbfe'}`,
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              textAlign: 'left',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '10px',
                  background: isVietQRPaid ? '#dcfce7' : '#dbeafe',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {isVietQRPaid ? (
                  <CheckIcon size={22} color="#15803d" />
                ) : (
                  <QrCodeIcon size={22} color="#2563eb" />
                )}
              </div>
              <div>
                <div style={{ fontSize: '14.5px', fontWeight: 800, color: isVietQRPaid ? '#166534' : '#1e40af' }}>
                  {isVietQRPaid ? 'Đã Xác Nhận Thanh Toán VietQR' : 'Thanh Toán VietQR Tự Động'}
                </div>
                <div style={{ fontSize: '12px', color: isVietQRPaid ? '#15803d' : '#3b82f6', marginTop: '2px' }}>
                  {isVietQRPaid
                    ? 'Giao dịch ngân hàng đã được hệ thống ghi nhận thành công.'
                    : 'Quét mã QR để hoàn tất thanh toán hoặc xem lại chi tiết tài khoản.'}
                </div>
              </div>
            </div>
            {!isVietQRPaid && (
              <button
                type="button"
                onClick={() => setShowVietQRModal(true)}
                style={{
                  background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '8px',
                  padding: '9px 16px',
                  fontSize: '13px',
                  fontWeight: 800,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <QrCodeIcon size={14} color="#ffffff" /> Quét Mã QR
              </button>
            )}
          </div>
        )}

        {/* Bonus Lucky Spin Award Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
            border: '1.5px solid #fed7aa',
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            textAlign: 'left',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: 'linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)', flexShrink: 0 }}>
              <BoltIcon size={22} color="#c2410c" />
            </div>
            <div>
              <div style={{ fontSize: '14.5px', fontWeight: 800, color: '#ea580c' }}>
                Tặng +1 Lượt Quay Vòng Quay May Mắn!
              </div>
              <div style={{ fontSize: '12px', color: '#7c2d12', marginTop: '2px' }}>
                Đơn hàng thành công đã tặng bạn 1 lượt quay 100% trúng thưởng Mini Xu & Voucher.
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setShowRewardsModal(true)}
            style={{
              background: '#ea580c',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: '0 2px 8px rgba(234, 88, 12, 0.3)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <BoltIcon size={14} color="#ffffff" />
            <span>Quay Ngay</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 800, width: '100%', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => navigate('/orders')}
          >
            <TruckIcon size={16} color="#ffffff" /> {t('order_view_tracking_btn', 'Theo dõi vận chuyển đơn hàng')}
          </button>

          <button
            type="button"
            className="shopee-btn shopee-btn-secondary"
            style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700, width: '100%', borderRadius: '10px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={() => setShowInvoiceModal(true)}
          >
            <ReceiptIcon size={16} color="#0284c7" /> In Hóa Đơn / Xem Biên Lai VAT
          </button>

          <Link
            to="/"
            className="shopee-btn shopee-btn-secondary"
            style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700, width: '100%', textAlign: 'center', borderRadius: '10px', textDecoration: 'none' }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}><HomeIcon size={15} color="#2563eb" /> {t('order_continue_shopping_btn', 'Tiếp tục mua sắm')}</span>
          </Link>
        </div>
      </div>

      {showInvoiceModal && (
        <InvoiceReceiptModal
          order={orderData}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

      {showRewardsModal && (
        <RewardsHubModal onClose={() => setShowRewardsModal(false)} />
      )}

      {showVietQRModal && (
        <VietQRPaymentModal
          isOpen={showVietQRModal}
          onClose={() => setShowVietQRModal(false)}
          orderId={orderId}
          amount={total}
          onPaymentSuccess={() => {
            setIsVietQRPaid(true);
            setShowVietQRModal(false);
          }}
        />
      )}
    </main>
  );
}
