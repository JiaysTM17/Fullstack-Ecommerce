import React, { useState, useEffect, useRef } from 'react';
import { KeyIcon, MailIcon, PhoneIcon, CloseIcon, AlertCircleIcon, ChevronRightIcon, CheckIcon, ClockIcon, RefreshIcon } from './OrdersIcons';

/**
 * Enterprise 2FA OTP Verification Modal
 * Uses Single-Input Segmented UI Display pattern:
 * - Completely immune to Windows IME / Unikey key repeat bugs
 * - Perfectly captures every typed digit sequentially (e.g. 271880)
 * - Full paste, backspace, arrow, and enter key bindings
 * - 60s countdown timer with fresh OTP resend support
 * Author: Kiệt Trương <truonggiakiet110806@gmail.com>
 */
export default function OtpVerificationModal({
  isOpen,
  targetEmail,
  email,
  targetPhone,
  phone,
  expectedOtp,
  onVerify,
  onVerifySuccess,
  onResend,
  onClose,
  title = 'Xác Thực Tài Khoản (2FA OTP)',
  subtitle = 'Nhập mã bảo mật 6 số để kích hoạt tài khoản của bạn'
}) {
  const [otpValue, setOtpValue] = useState('');
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendNotice, setResendNotice] = useState('');
  const [activeOtp, setActiveOtp] = useState(expectedOtp || '');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);

  const displayEmail = targetEmail || email;
  const displayPhone = targetPhone || phone;

  // Initialize and auto-focus when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setOtpValue('');
    setError('');
    setResendNotice('');
    setCountdown(60);
    setCanResend(false);
    if (expectedOtp) setActiveOtp(expectedOtp);

    const timer = setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isOpen, expectedOtp]);

  // Keep activeOtp updated if prop changes
  useEffect(() => {
    if (expectedOtp) setActiveOtp(expectedOtp);
  }, [expectedOtp]);

  // Countdown timer for OTP re-send
  useEffect(() => {
    if (!isOpen || countdown <= 0) {
      setCanResend(true);
      return;
    }
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  // Handle typing inside the unified input
  const handleInputChange = (e) => {
    const raw = e.target.value;
    const digitsOnly = raw.replace(/\D/g, '').slice(0, 6);
    setOtpValue(digitsOnly);
    setError('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && otpValue.length === 6) {
      e.preventDefault();
      handleVerify();
    }
  };

  const handleBoxClick = () => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleVerify = async () => {
    if (otpValue.length < 6) {
      setError('Vui lòng tự tay nhập đầy đủ 6 chữ số mã OTP xác nhận');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (activeOtp && otpValue !== activeOtp) {
        setError('Mã OTP không chính xác. Vui lòng kiểm tra lại hòm thư email của bạn');
        setLoading(false);
        return;
      }
      if (typeof onVerify === 'function') await onVerify(otpValue);
      if (typeof onVerifySuccess === 'function') await onVerifySuccess(otpValue);
    } catch (err) {
      setError(err.message || 'Xác thực mã OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (!canResend) return;
    setOtpValue('');
    setError('');
    setCountdown(60);
    setCanResend(false);

    let freshOtp = '';
    if (typeof onResend === 'function') {
      const res = await onResend();
      if (res && typeof res === 'string') freshOtp = res;
    }

    if (!freshOtp) {
      freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
    }
    setActiveOtp(freshOtp);

    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setResendNotice(`Mã xác thực OTP mới đã được gửi lại vào hòm thư lúc ${timeStr}!`);

    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <div className="shopee-auth-modal-overlay" style={{ zIndex: 10000 }}>
      <div
        className="shopee-auth-modal-card"
        style={{
          maxWidth: '480px',
          width: '92%',
          textAlign: 'center',
          padding: '36px 32px',
          borderRadius: '20px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.3)',
          background: '#ffffff',
          position: 'relative',
        }}
      >
        {onClose && (
          <button
            type="button"
            className="shopee-auth-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              position: 'absolute',
              top: '18px',
              right: '18px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '15px',
              color: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon size={16} color="#ef4444" />
          </button>
        )}

        {/* Security Shield Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 16px',
            boxShadow: '0 8px 24px -4px rgba(37, 99, 235, 0.45)',
          }}
        >
          <KeyIcon size={30} color="#ffffff" />
        </div>

        {/* Title & Email Destination Notice */}
        <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: '#0f172a' }}>
          {title}
        </h3>

        <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 8px', lineHeight: 1.5 }}>
          {subtitle}
        </p>

        {displayEmail && (
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              padding: '6px 14px',
              borderRadius: '9999px',
              fontSize: '12.5px',
              fontWeight: 700,
              color: '#1d4ed8',
              marginBottom: '16px',
            }}
          >
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <MailIcon size={12} color="#1d4ed8" />
            </span>
            <span>{displayEmail}</span>
            {displayPhone && (
              <span style={{ color: '#93c5fd', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                • <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneIcon size={11} color="#1d4ed8" />
                </span>
                <span>{displayPhone}</span>
              </span>
            )}
          </div>
        )}

        <div style={{ fontSize: '12px', color: '#475569', marginBottom: '22px', lineHeight: 1.5 }}>
          Vui lòng kiểm tra <strong>Hộp thư đến</strong> (hoặc thư mục <strong>Spam/Rác</strong>) trong email của bạn và tự tay nhập dãy 6 chữ số bên dưới.
        </div>

        {resendNotice && (
          <div
            style={{
              background: '#ecfdf5',
              border: '1px solid #10b981',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12px',
              color: '#047857',
              marginBottom: '18px',
              fontWeight: 600,
            }}
          >
            {resendNotice}
          </div>
        )}

        {error && (
          <div
            style={{
              background: '#fef2f2',
              border: '1px solid #f87171',
              borderRadius: '10px',
              padding: '8px 14px',
              fontSize: '12.5px',
              color: '#b91c1c',
              marginBottom: '18px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <AlertCircleIcon size={15} color="#ef4444" />
            <span>{error}</span>
          </div>
        )}

        {/* Unified 6-Digit Container (Clicking any box focuses the hidden master input) */}
        <div
          onClick={handleBoxClick}
          style={{
            position: 'relative',
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '24px',
            cursor: 'text',
          }}
        >
          {/* Master Hidden Input: handles all keystrokes smoothly without focus jumps */}
          <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoComplete="one-time-code"
            value={otpValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              opacity: 0,
              zIndex: 3,
              cursor: 'text',
            }}
          />

          {/* 6 Visual Segmented Boxes */}
          {[0, 1, 2, 3, 4, 5].map((idx) => {
            const digit = otpValue[idx] || '';
            const isActive = isFocused && (otpValue.length === idx || (idx === 5 && otpValue.length === 6));
            return (
              <div
                key={idx}
                style={{
                  width: '48px',
                  height: '56px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 800,
                  color: '#0f172a',
                  background: digit ? '#f0fdf4' : '#f8fafc',
                  border: isActive
                    ? '2px solid #2563eb'
                    : digit
                    ? '2px solid #22c55e'
                    : '1.5px solid #cbd5e1',
                  borderRadius: '12px',
                  boxShadow: isActive
                    ? '0 0 0 3px rgba(37, 99, 235, 0.2)'
                    : digit
                    ? '0 0 0 3px rgba(34, 197, 94, 0.12)'
                    : 'inset 0 1px 2px rgba(0, 0, 0, 0.04)',
                  transition: 'all 0.18s ease',
                  userSelect: 'none',
                }}
              >
                {digit}
              </div>
            );
          })}
        </div>

        {/* Verify Action Button */}
        <button
          type="button"
          className="shopee-btn shopee-btn-primary"
          onClick={handleVerify}
          disabled={loading || otpValue.length < 6}
          style={{
            width: '100%',
            height: '46px',
            fontSize: '14.5px',
            fontWeight: 700,
            borderRadius: '12px',
            background: otpValue.length === 6 ? '#2563eb' : '#94a3b8',
            color: '#ffffff',
            border: 'none',
            cursor: otpValue.length === 6 ? 'pointer' : 'not-allowed',
            boxShadow: otpValue.length === 6 ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
            transition: 'all 0.2s ease',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          {loading ? (
            'Đang đối soát an ninh...'
          ) : (
            <>
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={12} color="#ffffff" />
              </span>
              <span>Xác Nhận & Kích Hoạt Tài Khoản</span>
            </>
          )}
        </button>

        {/* Resend Countdown Notice */}
        <div style={{ fontSize: '12.5px', color: '#64748b' }}>
          Chưa nhận được mã trong hộp thư?{' '}
          {canResend ? (
            <span
              onClick={handleResendClick}
              style={{
                color: '#2563eb',
                fontWeight: 700,
                cursor: 'pointer',
                textDecoration: 'underline',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshIcon size={11} color="#2563eb" />
              </span>
              <span>Gửi lại mã OTP mới</span>
            </span>
          ) : (
            <span style={{ color: '#94a3b8', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClockIcon size={11} color="#2563eb" />
              </span>
              <span>Yêu cầu gửi lại sau <strong style={{ color: '#2563eb' }}>{countdown}s</strong></span>
            </span>
          )}
        </div>

        {/* Development Mode Helper Badge - Subtle & Non-Intrusive */}
        {activeOtp && (
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0' }}>
            <span
              onClick={() => {
                alert(`[Mã Xác Thực 2FA]: ${activeOtp}\n(Hệ thống mô phỏng gửi đến email: ${displayEmail || 'của bạn'})\nVui lòng tự tay nhập 6 chữ số này vào các ô phía trên để kích hoạt.`);
              }}
              style={{
                fontSize: '11px',
                color: '#1e40af',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                userSelect: 'none',
                padding: '4px 10px',
                borderRadius: '8px',
                background: 'rgba(37, 99, 235, 0.08)',
                border: '1px solid rgba(37, 99, 235, 0.2)',
                fontWeight: 600,
              }}
              title="Nhấn để xem mã nếu chưa kết nối hòm thư thực tế"
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <MailIcon size={11} color="#2563eb" />
              </span>
              <span>Xem thông điệp mã hộp thư (Môi trường Test)</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
