import React, { useState, useEffect, useRef } from 'react';

export default function OtpVerificationModal({
  isOpen,
  targetEmail,
  targetPhone,
  expectedOtp = '889966',
  onVerify,
  onResend,
  onClose,
  title = 'Xác Thực Bảo Mật 2 Bước (2FA)',
  subtitle = 'Nhập mã OTP 6 số để hoàn tất quy trình an ninh'
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef([]);

  useEffect(() => {
    if (!isOpen) return;
    setDigits(['', '', '', '', '', '']);
    setError('');
    setCountdown(60);
    setCanResend(false);

    // Auto focus first input
    const timer = setTimeout(() => {
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [isOpen]);

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

  const handleChange = (index, value) => {
    // Only accept numeric digit
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

    // Advance to next input
    if (index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      // Move focus back
      inputRefs.current[index - 1].focus();
    }
  };

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
    const lastFilled = Math.min(pasted.length, 5);
    if (inputRefs.current[lastFilled]) inputRefs.current[lastFilled].focus();
  };

  const handleVerify = async () => {
    const code = digits.join('');
    if (code.length < 6) {
      setError('Vui lòng nhập đủ 6 chữ số mã OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (expectedOtp && code !== expectedOtp) {
        setError('Mã OTP không chính xác. Vui lòng kiểm tra lại');
        setLoading(false);
        return;
      }
      if (onVerify) await onVerify(code);
    } catch (err) {
      setError(err.message || 'Xác thực không thành công');
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = () => {
    if (!canResend) return;
    setCountdown(60);
    setCanResend(false);
    setDigits(['', '', '', '', '', '']);
    setError('');
    if (onResend) onResend();
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  };

  return (
    <div className="shopee-auth-modal-overlay">
      <div
        className="shopee-auth-modal-card"
        style={{
          maxWidth: '460px',
          textAlign: 'center',
          padding: '36px 30px',
        }}
      >
        {onClose && (
          <button
            type="button"
            className="shopee-auth-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        )}

        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(14, 165, 233, 0.2) 100%)',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '26px',
            margin: '0 auto 16px',
            color: '#3b82f6',
          }}
        >
          🔐
        </div>

        <h3 style={{ fontSize: '20px', fontWeight: 800, margin: '0 0 8px', color: 'var(--text-primary, #0f172a)' }}>
          {title}
        </h3>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', margin: '0 0 20px', lineHeight: 1.5 }}>
          {subtitle}
          {targetEmail && (
            <span style={{ display: 'block', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
              {targetEmail} {targetPhone ? `· ${targetPhone}` : ''}
            </span>
          )}
        </p>

        {/* Test code hint banner */}
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px dashed rgba(59, 130, 246, 0.35)',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#2563eb',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
          }}
        >
          <span>💡 Mã OTP bảo mật của bạn:</span>
          <strong style={{ letterSpacing: '2px', fontSize: '13.5px' }}>{expectedOtp}</strong>
          <button
            type="button"
            onClick={() => {
              const splitted = expectedOtp.split('');
              setDigits(splitted);
              setError('');
            }}
            style={{
              marginLeft: '8px',
              padding: '2px 8px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Nhập nhanh
          </button>
        </div>

        {error && (
          <div className="shopee-form-error-msg" style={{ marginBottom: '16px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* 6 Digit Input Group */}
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
              value={digit}
              onChange={(e) => handleChange(idx, e.target.value)}
              onKeyDown={(e) => handleKeyDown(idx, e)}
              style={{
                width: '46px',
                height: '52px',
                textAlign: 'center',
                fontSize: '22px',
                fontWeight: 800,
                color: 'var(--text-primary, #0f172a)',
                background: 'var(--bg-muted, #f8fafc)',
                border: digit ? '2px solid #3b82f6' : '1.5px solid var(--border-medium, #cbd5e1)',
                borderRadius: '12px',
                outline: 'none',
                boxShadow: digit ? '0 0 0 3px rgba(59, 130, 246, 0.15)' : 'none',
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Verify Action Button */}
        <button
          type="button"
          className="shopee-auth-submit-btn"
          onClick={handleVerify}
          disabled={loading || digits.join('').length < 6}
          style={{ marginBottom: '16px' }}
        >
          {loading ? 'Đang kiểm tra...' : 'Xác Nhận & Tiếp Tục ➔'}
        </button>

        {/* Resend Countdown */}
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748b)' }}>
          Chưa nhận được mã?{' '}
          {canResend ? (
            <span
              onClick={handleResendClick}
              style={{ color: '#3b82f6', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Gửi lại mã OTP
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>
              Gửi lại sau <strong style={{ color: '#3b82f6' }}>{countdown}s</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
