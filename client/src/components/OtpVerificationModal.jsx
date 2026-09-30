import React, { useState, useEffect, useRef } from 'react';

/**
 * Enterprise 2FA OTP Verification Modal
 * Professional banking & e-commerce design:
 * - Direct hand-input into 6 individual digit cells
 * - Smooth auto-advance, backspace navigation, arrow keys, and multi-digit paste support
 * - Eliminates public OTP banners and instant auto-fill shortcuts
 * - 60s countdown timer with re-request capability
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
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendNotice, setResendNotice] = useState('');
  const [activeOtp, setActiveOtp] = useState(expectedOtp || '');
  const inputRefs = useRef([]);

  const displayEmail = targetEmail || email;
  const displayPhone = targetPhone || phone;

  // Initialize state when modal opens
  useEffect(() => {
    if (!isOpen) return;
    setDigits(['', '', '', '', '', '']);
    setError('');
    setResendNotice('');
    setCountdown(60);
    setCanResend(false);
    if (expectedOtp) setActiveOtp(expectedOtp);

    // Auto-focus the first digit input
    const timer = setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
        inputRefs.current[0].select();
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [isOpen, expectedOtp]);

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

  // Handle single digit typing with auto-advance
  const handleChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      const next = [...digits];
      next[index] = '';
      setDigits(next);
      return;
    }

    const digit = cleaned.slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    setError('');

    // Move to next input box automatically
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
      inputRefs.current[index + 1].select();
    }
  };

  // Handle backspace and arrow navigation
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!digits[index] && index > 0 && inputRefs.current[index - 1]) {
        inputRefs.current[index - 1].focus();
        const next = [...digits];
        next[index - 1] = '';
        setDigits(next);
      }
    } else if (e.key === 'ArrowLeft' && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1].focus();
    } else if (e.key === 'ArrowRight' && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    } else if (e.key === 'Enter') {
      if (digits.join('').length === 6) {
        handleVerify();
      }
    }
  };

  // Support pasting full 6-digit code copied from email
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;

    const next = [...digits];
    for (let i = 0; i < 6; i++) {
      next[i] = pasted[i] || '';
    }
    setDigits(next);
    setError('');

    const targetIdx = Math.min(pasted.length, 5);
    if (inputRefs.current[targetIdx]) {
      inputRefs.current[targetIdx].focus();
    }
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Vui lòng tự tay nhập đầy đủ 6 chữ số mã OTP xác nhận');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (activeOtp && code !== activeOtp) {
        setError('Mã OTP không chính xác. Vui lòng kiểm tra lại hòm thư email của bạn');
        setLoading(false);
        return;
      }
      if (typeof onVerify === 'function') await onVerify(code);
      if (typeof onVerifySuccess === 'function') await onVerifySuccess(code);
    } catch (err) {
      setError(err.message || 'Xác thực mã OTP thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = async () => {
    if (!canResend) return;
    setDigits(['', '', '', '', '', '']);
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
    setResendNotice(`✓ Mã xác thực OTP mới đã được gửi lại vào hòm thư lúc ${timeStr}!`);

    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
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
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '15px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        )}

        {/* Security Shield Icon */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.1) 0%, rgba(14, 165, 233, 0.15) 100%)',
            border: '1.5px solid rgba(37, 99, 235, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '30px',
            margin: '0 auto 16px',
            boxShadow: '0 8px 20px -6px rgba(37, 99, 235, 0.25)',
          }}
        >
          🔐
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
              gap: '6px',
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
            <span>📧</span>
            <span>{displayEmail}</span>
            {displayPhone && <span style={{ color: '#93c5fd' }}>• 📞 {displayPhone}</span>}
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
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 6 Individual Digit Inputs - Hand typed */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '24px',
          }}
          onPaste={handlePaste}
        >
          {digits.map((digit, idx) => (
            <input
              key={idx}
              ref={(el) => (inputRefs.current[idx] = el)}
              type="text"
              inputMode="numeric"
              maxLength={1}
              autoComplete="one-time-code"
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: '48px',
                height: '56px',
                textAlign: 'center',
                fontSize: '24px',
                fontWeight: 800,
                color: '#0f172a',
                background: digit ? '#f0fdf4' : '#f8fafc',
                border: digit ? '2px solid #22c55e' : '1.5px solid #cbd5e1',
                borderRadius: '12px',
                outline: 'none',
                boxShadow: digit
                  ? '0 0 0 3px rgba(34, 197, 94, 0.15)'
                  : 'inset 0 1px 2px rgba(0, 0, 0, 0.05)',
                transition: 'all 0.18s ease',
              }}
            />
          ))}
        </div>

        {/* Verify Action Button */}
        <button
          type="button"
          className="shopee-btn shopee-btn-primary"
          onClick={handleVerify}
          disabled={loading || digits.join('').length < 6}
          style={{
            width: '100%',
            height: '46px',
            fontSize: '14.5px',
            fontWeight: 700,
            borderRadius: '12px',
            background: digits.join('').length === 6 ? '#2563eb' : '#94a3b8',
            color: '#ffffff',
            border: 'none',
            cursor: digits.join('').length === 6 ? 'pointer' : 'not-allowed',
            boxShadow: digits.join('').length === 6 ? '0 4px 14px rgba(37, 99, 235, 0.35)' : 'none',
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
              <span>Xác Nhận & Kích Hoạt Tài Khoản</span>
              <span>➔</span>
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
              }}
            >
              Gửi lại mã OTP mới
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>
              Yêu cầu gửi lại sau <strong style={{ color: '#2563eb' }}>{countdown}s</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
