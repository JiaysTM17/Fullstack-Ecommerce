import React, { useState, useEffect } from 'react';
import { formatCurrency } from '../utils/formatCurrency';
import { useToast } from '../context/ToastContext';
import {
  CloseIcon,
  CopyIcon,
  CheckIcon,
  ClockIcon,
  ShieldCheckIcon,
  DownloadIcon,
  RefreshIcon,
  QrCodeIcon,
  AlertCircleIcon,
  CreditCardIcon,
  TagIcon,
} from './OrdersIcons';

const SUPPORTED_BANKS = [
  {
    id: 'mbbank',
    name: 'MBBank (Quân Đội)',
    bin: '970422',
    accountNo: '0909123456',
    accountName: 'CONG TY TNHH FULLSTACK ECOMMERCE',
    color: '#1d4ed8',
    badge: 'Khuyên Dùng (Nhanh Nhất)',
  },
  {
    id: 'vietcombank',
    name: 'Vietcombank (VCB)',
    bin: '970436',
    accountNo: '9909123456',
    accountName: 'CONG TY TNHH FULLSTACK ECOMMERCE',
    color: '#059669',
    badge: 'Phổ Biến',
  },
  {
    id: 'techcombank',
    name: 'Techcombank (TCB)',
    bin: '970407',
    accountNo: '8809123456',
    accountName: 'CONG TY TNHH FULLSTACK ECOMMERCE',
    color: '#dc2626',
    badge: 'Xác Thực Tức Thì',
  },
];

export default function VietQRPaymentModal({
  isOpen,
  onClose,
  orderId = 'ORD123456',
  amount = 0,
  onPaymentSuccess,
}) {
  const { showToast } = useToast();
  const [selectedBank, setSelectedBank] = useState(SUPPORTED_BANKS[0]);
  const [timeLeft, setTimeLeft] = useState(900); // 15 minutes = 900 seconds
  const [isVerifying, setIsVerifying] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [copiedField, setCopiedField] = useState(null);
  const [qrImgError, setQrImgError] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (!isOpen) {
      setTimeLeft(900);
      setIsVerifying(false);
      setIsPaid(false);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen]);

  if (!isOpen) return null;

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const memoText = `THANH TOAN ${orderId}`.toUpperCase();

  const handleCopy = (text, fieldName) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
    }
    setCopiedField(fieldName);
    showToast(`Đã sao chép ${fieldName}!`, 'success');
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  const handleVerifyPayment = () => {
    setIsVerifying(true);
    showToast('Đang kết nối cổng Napas & VietQR kiểm tra giao dịch...', 'info');

    setTimeout(() => {
      setIsVerifying(false);
      setIsPaid(true);
      showToast('Giao dịch chuyển khoản thành công! Đơn hàng đã được xác nhận.', 'success');
      if (onPaymentSuccess) {
        setTimeout(() => {
          onPaymentSuccess();
        }, 1500);
      }
    }, 2000);
  };

  // Dynamic QR URLs
  const primaryQrUrl = `https://img.vietqr.io/image/${selectedBank.bin}-${selectedBank.accountNo}-compact2.png?amount=${Math.round(amount)}&addInfo=${encodeURIComponent(memoText)}&accountName=${encodeURIComponent(selectedBank.accountName)}`;
  const fallbackQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=2|99|${selectedBank.accountNo}|${encodeURIComponent(selectedBank.accountName)}|${Math.round(amount)}|${encodeURIComponent(memoText)}`;

  const currentQrSrc = qrImgError ? fallbackQrUrl : primaryQrUrl;

  const handleDownloadQr = () => {
    const link = document.createElement('a');
    link.href = currentQrSrc;
    link.target = '_blank';
    link.download = `VietQR-${orderId}.png`;
    link.click();
    showToast('Đang tải hình ảnh mã VietQR xuống thiết bị...', 'success');
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(5px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          border: '1px solid var(--border-medium, #e2e8f0)',
          position: 'relative',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid var(--border-light, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(135deg, #f8fafc 0%, #ffffff 100%)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(37, 99, 235, 0.3)',
                flexShrink: 0,
              }}
            >
              <QrCodeIcon size={20} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>Thanh Toán VietQR Tự Động</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    background: '#dcfce7',
                    color: '#15803d',
                    padding: '2px 8px',
                    borderRadius: '999px',
                    border: '1px solid #bbf7d0',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <ShieldCheckIcon size={11} color="#16a34a" />
                  <span>Napas 247</span>
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Quét mã chuyển khoản tức thì — Xác nhận tự động trong 3 giây
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloseIcon size={12} color="#ef4444" />
            </span>
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px 24px' }}>
          {isPaid ? (
            /* Success State */
            <div style={{ textAlign: 'center', padding: '32px 16px' }}>
              <div
                style={{
                  width: '68px',
                  height: '68px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #10b981, #059669)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  boxShadow: '0 10px 25px rgba(16, 185, 129, 0.4)',
                }}
              >
                <CheckIcon size={34} color="#ffffff" />
              </div>
              <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
                Thanh Toán Đơn Hàng Thành Công!
              </h3>
              <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 20px', lineHeight: '1.5' }}>
                Hệ thống ngân hàng Napas đã khớp lệnh cho đơn hàng <strong>{orderId}</strong> với số tiền{' '}
                <strong style={{ color: '#059669' }}>{formatCurrency(amount)}</strong>.
              </p>
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  fontSize: '13px',
                  color: '#166534',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '24px',
                }}
              >
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShieldCheckIcon size={13} color="#16a34a" />
                </span>
                <span>Giao dịch được bảo hộ 100% qua chuẩn Napas VietQR</span>
              </div>
              <div>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  onClick={onClose}
                  style={{ minWidth: '160px', padding: '10px 24px', fontWeight: 700 }}
                >
                  Hoàn Tất & Xem Đơn Hàng
                </button>
              </div>
            </div>
          ) : (
            /* Normal Payment Flow */
            <>
              {/* Countdown Session Banner */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: timeLeft < 120 ? '#fff1f2' : '#eff6ff',
                  border: `1px solid ${timeLeft < 120 ? '#fecdd3' : '#bfdbfe'}`,
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '22px',
                      height: '22px',
                      borderRadius: '50%',
                      background: timeLeft < 120 ? '#ffe4e6' : '#dbeafe',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <ClockIcon size={13} color={timeLeft < 120 ? '#e11d48' : '#2563eb'} />
                  </span>
                  <span style={{ fontSize: '13px', color: timeLeft < 120 ? '#9f1239' : '#1e40af', fontWeight: 600 }}>
                    Thời gian giữ mã thanh toán:
                  </span>
                </div>
                <div
                  style={{
                    fontSize: '15px',
                    fontWeight: 800,
                    color: timeLeft < 120 ? '#e11d48' : '#1d4ed8',
                    fontFamily: 'monospace',
                    letterSpacing: '1px',
                  }}
                >
                  {formattedTime}
                </div>
              </div>

              {/* Bank Selection Tabs */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                  CHỌN NGÂN HÀNG THỤ HƯỞNG:
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
                  {SUPPORTED_BANKS.map((bank) => {
                    const isSelected = selectedBank.id === bank.id;
                    return (
                      <button
                        key={bank.id}
                        type="button"
                        onClick={() => {
                          setSelectedBank(bank);
                          setQrImgError(false);
                        }}
                        style={{
                          background: isSelected ? '#ffffff' : 'var(--bg-muted, #f8fafc)',
                          border: `2px solid ${isSelected ? bank.color : 'var(--border-light, #e2e8f0)'}`,
                          borderRadius: '10px',
                          padding: '10px 8px',
                          cursor: 'pointer',
                          textAlign: 'center',
                          transition: 'all 0.15s ease',
                          boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.06)' : 'none',
                        }}
                      >
                        <div style={{ fontSize: '13px', fontWeight: 800, color: isSelected ? bank.color : 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                          <CreditCardIcon size={12} color={isSelected ? bank.color : "#64748b"} />
                          <span>{bank.name.split(' ')[0]}</span>
                        </div>
                        <div style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {bank.badge}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* QR Image & Bank Details Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '190px 1fr',
                  gap: '18px',
                  background: '#f8fafc',
                  padding: '16px',
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  marginBottom: '16px',
                }}
              >
                {/* QR Code Container */}
                <div style={{ textAlign: 'center' }}>
                  <div
                    style={{
                      background: '#ffffff',
                      padding: '8px',
                      borderRadius: '10px',
                      border: '1px solid #cbd5e1',
                      display: 'inline-block',
                      boxShadow: '0 4px 10px rgba(0,0,0,0.04)',
                    }}
                  >
                    <img
                      src={currentQrSrc}
                      alt="VietQR Napas 247"
                      onError={() => setQrImgError(true)}
                      style={{
                        width: '168px',
                        height: '168px',
                        display: 'block',
                        borderRadius: '6px',
                        objectFit: 'contain',
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleDownloadQr}
                    style={{
                      marginTop: '8px',
                      background: '#ffffff',
                      border: '1px solid #cbd5e1',
                      borderRadius: '6px',
                      padding: '4px 10px',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#2563eb',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <DownloadIcon size={11} color="#2563eb" />
                    </span>
                    <span>Tải mã QR</span>
                  </button>
                </div>

                {/* Transfer Info Fields */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', justifyContent: 'center' }}>
                  {/* Account Number */}
                  <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10.5px', color: '#2563eb', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CreditCardIcon size={11} color="#2563eb" />
                      </span>
                      <span>SỐ TÀI KHOẢN:</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', letterSpacing: '0.5px' }}>
                        {selectedBank.accountNo}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(selectedBank.accountNo, 'Số tài khoản')}
                        style={{
                          background: copiedField === 'Số tài khoản' ? '#dcfce7' : '#eff6ff',
                          border: `1px solid ${copiedField === 'Số tài khoản' ? '#86efac' : '#bfdbfe'}`,
                          color: copiedField === 'Số tài khoản' ? '#15803d' : '#2563eb',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        {copiedField === 'Số tài khoản' ? (
                          <span style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'rgba(21, 128, 61, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckIcon size={10} color="#15803d" />
                          </span>
                        ) : (
                          <span style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CopyIcon size={10} color="#2563eb" />
                          </span>
                        )}
                        <span>{copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Account Name */}
                  <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10.5px', color: '#16a34a', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <ShieldCheckIcon size={11} color="#16a34a" />
                      </span>
                      <span>CHỦ TÀI KHOẢN:</span>
                    </div>
                    <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0f172a', marginTop: '2px' }}>
                      {selectedBank.accountName}
                    </div>
                  </div>

                  {/* Amount */}
                  <div style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ fontSize: '10.5px', color: '#ea580c', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TagIcon size={11} color="#ea580c" />
                      </span>
                      <span>SỐ TIỀN CẦN CHUYỂN:</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ fontSize: '16px', fontWeight: 800, color: '#ea580c' }}>
                        {formatCurrency(amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(Math.round(amount).toString(), 'Số tiền')}
                        style={{
                          background: copiedField === 'Số tiền' ? '#dcfce7' : '#eff6ff',
                          border: `1px solid ${copiedField === 'Số tiền' ? '#86efac' : '#bfdbfe'}`,
                          color: copiedField === 'Số tiền' ? '#15803d' : '#2563eb',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        {copiedField === 'Số tiền' ? (
                          <span style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'rgba(21, 128, 61, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckIcon size={10} color="#15803d" />
                          </span>
                        ) : (
                          <span style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CopyIcon size={10} color="#2563eb" />
                          </span>
                        )}
                        <span>{copiedField === 'Số tiền' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Memo */}
                  <div style={{ background: '#fffbeb', padding: '8px 10px', borderRadius: '8px', border: '1px solid #fde68a' }}>
                    <div style={{ fontSize: '10.5px', color: '#92400e', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(217, 119, 6, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <AlertCircleIcon size={11} color="#d97706" />
                      </span>
                      <span>NỘI DUNG CHUYỂN KHOẢN (BẮT BUỘC):</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ fontSize: '14px', fontWeight: 800, color: '#b45309', fontFamily: 'monospace' }}>
                        {memoText}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(memoText, 'Nội dung')}
                        style={{
                          background: copiedField === 'Nội dung' ? '#dcfce7' : '#fef3c7',
                          border: `1px solid ${copiedField === 'Nội dung' ? '#86efac' : '#fcd34d'}`,
                          color: copiedField === 'Nội dung' ? '#15803d' : '#b45309',
                          borderRadius: '4px',
                          padding: '2px 8px',
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        {copiedField === 'Nội dung' ? (
                          <span style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'rgba(21, 128, 61, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CheckIcon size={10} color="#15803d" />
                          </span>
                        ) : (
                          <span style={{ width: '15px', height: '15px', borderRadius: '3px', background: 'rgba(180, 83, 9, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CopyIcon size={10} color="#b45309" />
                          </span>
                        )}
                        <span>{copiedField === 'Nội dung' ? 'Đã chép' : 'Sao chép'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Guidance Tips */}
              <div
                style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '12px 14px',
                  fontSize: '12px',
                  color: '#475569',
                  lineHeight: '1.5',
                  marginBottom: '20px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#1e293b', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheckIcon size={12} color="#16a34a" />
                  </span>
                  <span>Hướng dẫn thanh toán nhanh:</span>
                </div>
                <div>1. Mở App ngân hàng bất kỳ (MB, Vietcombank, Techcombank, VPBank, TPBank...) hoặc ví điện tử.</div>
                <div>2. Chọn tính năng <strong>Quét mã QR</strong> và quét hình ảnh trên để hệ thống tự điền thông tin.</div>
                <div>3. Kiểm tra số tiền và bấm <strong>Xác nhận</strong>. Đơn hàng sẽ tự động duyệt trong vài giây.</div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    background: '#f1f5f9',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    padding: '10px 18px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#475569',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={10} color="#ef4444" />
                  </span>
                  <span>Đóng & Thanh Toán Sau</span>
                </button>
                <button
                  type="button"
                  onClick={handleVerifyPayment}
                  disabled={isVerifying}
                  style={{
                    background: 'linear-gradient(135deg, #ea580c, #c2410c)',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '10px 20px',
                    fontSize: '13.5px',
                    fontWeight: 700,
                    color: '#ffffff',
                    cursor: isVerifying ? 'wait' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                    opacity: isVerifying ? 0.75 : 1,
                  }}
                >
                  {isVerifying ? (
                    <>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <RefreshIcon size={11} color="#ffffff" className="spin-animation" />
                      </span>
                      <span>Đang Kiểm Tra...</span>
                    </>
                  ) : (
                    <>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon size={12} color="#ffffff" />
                      </span>
                      <span>Tôi Đã Chuyển Khoản</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
