import React, { useState, useEffect, useRef } from 'react';

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
  title = 'Xác Thực Bảo Mật 2 Bước (2FA)',
  subtitle = 'Nhập mã OTP 6 số để hoàn tất quy trình an ninh'
}) {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(60);
  const [canResend, setCanResend] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentOtp, setCurrentOtp] = useState('');
  const [resendNotice, setResendNotice] = useState('');
  const inputRefs = useRef([]);

  const displayEmail = targetEmail || email;
  const displayPhone = targetPhone || phone;

  // Initialize or generate random 6-digit OTP when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const generated = expectedOtp || Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOtp(generated);
    setDigits(['', '', '', '', '', '']);
    setError('');
    setResendNotice('');
    setCountdown(60);
    setCanResend(false);

    // Auto focus first input
    const timer = setTimeout(() => {
      if (inputRefs.current[0]) inputRefs.current[0].focus();
    }, 150);
    return () => clearTimeout(timer);
  }, [isOpen, expectedOtp]);

  // Countdown timer: 60s
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
      if (currentOtp && code !== currentOtp) {
        setError('Mã OTP không chính xác hoặc đã hết hạn. Vui lòng kiểm tra lại');
        setLoading(false);
        return;
      }
      if (typeof onVerify === 'function') await onVerify(code);
      if (typeof onVerifySuccess === 'function') await onVerifySuccess(code);
    } catch (err) {
      setError(err.message || 'Xác thực không thành công');
    } finally {
      setLoading(false);
    }
  };

  const handleResendClick = () => {
    if (!canResend) return;
    const freshOtp = Math.floor(100000 + Math.random() * 900000).toString();
    setCurrentOtp(freshOtp);
    setCountdown(60);
    setCanResend(false);
    setDigits(['', '', '', '', '', '']);
    setError('');
    const timeStr = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setResendNotice(`✓ Đã gửi mã OTP ngẫu nhiên mới về hòm thư lúc ${timeStr}!`);
    if (typeof onResend === 'function') onResend(freshOtp);
    if (inputRefs.current[0]) inputRefs.current[0].focus();
  };

  return (
    <div className="shopee-auth-modal-overlay">
      <div
        className="shopee-auth-modal-card"
        style={{
          maxWidth: '480px',
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
        <p style={{ fontSize: '13px', color: 'var(--text-secondary, #64748b)', margin: '0 0 16px', lineHeight: 1.5 }}>
          {subtitle}
          {displayEmail && (
            <span style={{ display: 'block', fontWeight: 700, color: '#3b82f6', marginTop: '4px' }}>
              📧 {displayEmail} {displayPhone ? `· 📞 ${displayPhone}` : ''}
            </span>
          )}
        </p>

        {resendNotice && (
          <div style={{
            background: '#ecfdf5',
            border: '1px solid #10b981',
            borderRadius: '10px',
            padding: '8px 12px',
            fontSize: '12px',
            color: '#047857',
            marginBottom: '14px',
            fontWeight: 600,
          }}>
            {resendNotice}
          </div>
        )}

        {/* Real OTP simulation notification card */}
        <div
          style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px dashed rgba(59, 130, 246, 0.35)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '12.5px',
            color: '#1e40af',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '8px',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            <span style={{ display: 'block', fontSize: '11px', color: '#64748b' }}>Mã xác nhận bảo mật gửi về hộp thư:</span>
            <strong style={{ letterSpacing: '3px', fontSize: '15px', color: '#1d4ed8' }}>{currentOtp}</strong>
          </div>
          <button
            type="button"
            onClick={() => {
              const splitted = currentOtp.split('');
              setDigits(splitted);
              setError('');
            }}
            style={{
              padding: '5px 12px',
              background: '#3b82f6',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: '0 2px 6px rgba(59, 130, 246, 0.25)',
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
          {loading ? 'Đang kiểm tra an ninh...' : 'Xác Nhận & Tiếp Tục ➔'}
        </button>

        {/* Resend Countdown */}
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748b)' }}>
          Chưa nhận được mã qua email?{' '}
          {canResend ? (
            <span
              onClick={handleResendClick}
              style={{ color: '#3b82f6', fontWeight: 700, cursor: 'pointer', textDecoration: 'underline' }}
            >
              Gửi lại mã OTP
            </span>
          ) : (
            <span style={{ color: '#94a3b8' }}>
              Yêu cầu gửi lại sau <strong style={{ color: '#3b82f6' }}>{countdown}s</strong>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
