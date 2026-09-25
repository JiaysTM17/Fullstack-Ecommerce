import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { formatCurrency } from '../utils/formatCurrency';
import { useLanguage } from '../context/LanguageContext';
import { useToast } from '../context/ToastContext';

export default function OrderSuccessPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();

  const orderId = location.state?.orderId || `ORD${Math.floor(100000 + Math.random() * 900000)}`;
  const total = location.state?.total || 0;
  const paymentMethod = location.state?.paymentMethod || 'COD';

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
            fontSize: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 20px',
            boxShadow: '0 8px 24px rgba(16, 185, 129, 0.35)',
          }}
        >
          ✓
        </div>

        <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {t('order_success_title')}
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: '0 0 24px', lineHeight: '1.6' }}>
          {t('order_success_subtitle')} Thông tin xác nhận và mã vận đơn đã được gửi tới hệ thống xử lý.
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
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{t('order_code_label')}:</span>
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
                }}
              >
                📋 Sao chép
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
              {paymentMethod === 'BANK' ? '🏦 Chuyển khoản VietQR' : paymentMethod === 'MOMO' ? '📱 Ví MoMo/ZaloPay' : paymentMethod === 'CARD' ? '💳 Thẻ Visa/Master' : '💵 Thanh toán khi nhận hàng (COD)'}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Đơn vị vận chuyển:</span>
            <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#16a34a' }}>
              🚀 SPX Express (Giao hàng dự kiến 24H)
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            style={{ padding: '12px 24px', fontSize: '15px', fontWeight: 800, width: '100%', borderRadius: '10px' }}
            onClick={() => navigate('/orders')}
          >
            {t('order_view_tracking_btn')}
          </button>

          <Link
            to="/"
            className="shopee-btn shopee-btn-secondary"
            style={{ padding: '12px 24px', fontSize: '14px', fontWeight: 700, width: '100%', textAlign: 'center', borderRadius: '10px', textDecoration: 'none' }}
          >
            {t('order_continue_shopping_btn')}
          </Link>
        </div>
      </div>
    </main>
  );
}
