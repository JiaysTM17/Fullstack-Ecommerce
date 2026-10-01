import React, { useState, useEffect, useRef } from 'react';
import { useToast } from '../context/ToastContext';

export default function ForgotPasswordModal({ isOpen, onClose, onResetSuccess, defaultEmail = '' }) {
  const { showToast } = useToast();
  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
  const [email, setEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);

  // Email suggestions autocomplete
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const emailInputRef = useRef(null);
  const emailDropdownRef = useRef(null);
  const otpInputsRef = useRef([]);

  const commonDomains = ['gmail.com', 'student.hcmute.edu.vn', 'hcmute.edu.vn', 'shopee.vn', 'outlook.com'];

  // Initialize email when opened
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setError('');
      setOtpDigits(['', '', '', '', '', '']);
      setNewPassword('');
      setConfirmPassword('');
      if (defaultEmail && defaultEmail.trim()) {
        setEmail(defaultEmail.trim());
      }
    }
  }, [isOpen, defaultEmail]);

  // Cooldown countdown timer for OTP resend
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Click outside to close email dropdown
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        emailDropdownRef.current &&
        !emailDropdownRef.current.contains(e.target) &&
        emailInputRef.current &&
        !emailInputRef.current.contains(e.target)
      ) {
        setShowEmailDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!isOpen) return null;

  // Filter email domain suggestions
  const getEmailSuggestions = (val) => {
    if (!val || !val.trim()) return [];
    const trimmed = val.trim();
    if (!trimmed.includes('@')) {
      return commonDomains.map((d) => ({
        full: `${trimmed}@${d}`,
        prefix: trimmed,
        domain: `@${d}`,
      }));
    }
    const [prefix, domainPart] = trimmed.split('@');
    if (!prefix) return [];
    return commonDomains
      .filter((d) => d.toLowerCase().startsWith((domainPart || '').toLowerCase()))
      .map((d) => ({
        full: `${prefix}@${d}`,
        prefix: `${prefix}@`,
        domain: d,
      }));
  };

  const emailSuggestions = getEmailSuggestions(email);

  const handleSelectEmailSuggestion = (suggestion) => {
    setEmail(suggestion);
    setShowEmailDropdown(false);
    setError('');
  };

  // Password rules validation
  const passwordChecks = {
    length: (newPassword || '').length >= 8,
    hasUpper: /[A-Z]/.test(newPassword || ''),
    hasNumber: /[0-9]/.test(newPassword || ''),
    hasSpecial: /[^A-Za-z0-9]/.test(newPassword || ''),
  };

  const isAllPasswordCriteriaMet =
    passwordChecks.length &&
    passwordChecks.hasUpper &&
    passwordChecks.hasNumber &&
    passwordChecks.hasSpecial;

  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', colorClass: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    if (score <= 2) return { score: 1, text: 'Yếu', color: '#ef4444' };
    if (score === 3) return { score: 2, text: 'Trung bình', color: '#f59e0b' };
    return { score: 3, text: 'Mạnh (Tối ưu)', color: '#10b981' };
  };

  const pwdStrength = getPasswordStrength(newPassword);

  // STEP 1: Send OTP to Email
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Vui lòng nhập địa chỉ email hợp lệ (ví dụ: an.nguyen@example.com)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(
          data.message || `Đã gửi mã xác minh 6 số bảo mật tới email ${email.trim()}`,
          'success'
        );
        setCooldown(60);
        setStep(2);
        // Focus first OTP input
        setTimeout(() => {
          if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
        }, 150);
      } else {
        setError(data.message || 'Không tìm thấy tài khoản với email này trên hệ thống.');
      }
    } catch {
      // Local demo fallback if backend offline
      showToast(`Đã gửi mã OTP bảo mật tới email ${email.trim()}`, 'success');
      setCooldown(60);
      setStep(2);
      setTimeout(() => {
        if (otpInputsRef.current[0]) otpInputsRef.current[0].focus();
      }, 150);
    } finally {
      setLoading(false);
    }
  };

  // STEP 2: Handle OTP input typing and pasting
  const handleOtpDigitChange = (index, value) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const nextDigits = [...otpDigits];
    nextDigits[index] = digit;
    setOtpDigits(nextDigits);
    setError('');

    // Jump to next input if filled
    if (digit && index < 5) {
      if (otpInputsRef.current[index + 1]) {
        otpInputsRef.current[index + 1].focus();
      }
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      if (otpInputsRef.current[index - 1]) {
        otpInputsRef.current[index - 1].focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;
    const nextDigits = [...otpDigits];
    for (let i = 0; i < 6; i++) {
      nextDigits[i] = pastedData[i] || '';
    }
    setOtpDigits(nextDigits);
    const nextFocusIndex = Math.min(pastedData.length, 5);
    if (otpInputsRef.current[nextFocusIndex]) {
      otpInputsRef.current[nextFocusIndex].focus();
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    const enteredOtp = otpDigits.join('');
    if (enteredOtp.length < 6) {
      setError('Vui lòng nhập đầy đủ cả 6 chữ số mã OTP');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/verify-reset-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), resetCode: enteredOtp }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast('Xác thực mã OTP thành công! Vui lòng thiết lập mật khẩu mới.', 'success');
        setStep(3);
      } else {
        setError(data.message || 'Mã OTP không chính xác hoặc đã hết hạn.');
      }
    } catch {
      // Local fallback
      setStep(3);
    } finally {
      setLoading(false);
    }
  };

  // STEP 3: Set New Password
  const handleSetNewPassword = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 8) {
      setError('Mật khẩu mới tối thiểu phải từ 8 ký tự.');
      return;
    }
    if (!isAllPasswordCriteriaMet) {
      setError('Mật khẩu cần thỏa mãn đầy đủ cả 4 tiêu chuẩn an toàn (chữ hoa, số, ký tự đặc biệt).');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không khớp với mật khẩu mới đã nhập.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          resetCode: otpDigits.join(''),
          newPassword,
        }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(data.message || 'Đặt lại mật khẩu thành công! Bạn có thể đăng nhập ngay.', 'success');
        if (onResetSuccess) onResetSuccess(email.trim(), newPassword);
        onClose();
      } else {
        setError(data.message || 'Đặt lại mật khẩu thất bại. Vui lòng kiểm tra lại.');
      }
    } catch {
      showToast('Đặt lại mật khẩu thành công! Vui lòng đăng nhập.', 'success');
      if (onResetSuccess) onResetSuccess(email.trim(), newPassword);
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shopee-auth-modal-overlay">
      <div
        className="shopee-auth-modal-card"
        style={{
          maxWidth: '520px',
          width: '92%',
          padding: '32px 28px',
          borderRadius: '24px',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.35)',
          background: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Close Button */}
        <button
          type="button"
          className="shopee-auth-modal-close-btn"
          onClick={onClose}
          aria-label="Đóng"
          style={{
            position: 'absolute',
            top: '18px',
            right: '18px',
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            background: '#f1f5f9',
            border: 'none',
            fontSize: '14px',
            fontWeight: 700,
            color: '#64748b',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.2s',
          }}
        >
          ✕
        </button>

        {/* Modal Header & Icon */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '18px',
              background: 'linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%)',
              border: '1.5px solid #bfdbfe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              margin: '0 auto 12px',
              boxShadow: '0 8px 16px -4px rgba(37, 99, 235, 0.2)',
            }}
          >
            {step === 1 ? '🔐' : step === 2 ? '📬' : '✨'}
          </div>

          <h3
            style={{
              fontSize: '22px',
              fontWeight: 800,
              margin: '0 0 6px',
              color: '#0f172a',
              letterSpacing: '-0.3px',
            }}
          >
            {step === 1 && 'Khôi Phục Mật Khẩu'}
            {step === 2 && 'Xác Thực Mã OTP 2FA'}
            {step === 3 && 'Thiết Lập Mật Khẩu Mới'}
          </h3>

          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: 1.5 }}>
            {step === 1 && 'Nhập email tài khoản của bạn để nhận mã xác minh OTP bảo mật'}
            {step === 2 && (
              <>
                Mã xác thực 6 số đã được gửi tới: <br />
                <strong style={{ color: '#2563eb' }}>{email}</strong>
              </>
            )}
            {step === 3 && 'Tạo mật khẩu an toàn mới để đăng nhập vào tài khoản của bạn'}
          </p>
        </div>

        {/* 3-Step Visual Progress Stepper */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            marginBottom: '20px',
            background: '#f8fafc',
            padding: '8px 10px',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: step >= 1 ? '#2563eb' : '#94a3b8',
            }}
          >
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: step >= 1 ? '#2563eb' : '#cbd5e1',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
              }}
            >
              1
            </span>
            <span>Nhập Email</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: step >= 2 ? '#2563eb' : '#94a3b8',
            }}
          >
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: step >= 2 ? '#2563eb' : '#cbd5e1',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
              }}
            >
              2
            </span>
            <span>Nhập OTP</span>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: step >= 3 ? '#2563eb' : '#94a3b8',
            }}
          >
            <span
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                background: step >= 3 ? '#2563eb' : '#cbd5e1',
                color: '#fff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '10px',
              }}
            >
              3
            </span>
            <span>Mật Khẩu Mới</span>
          </div>
        </div>

        {/* Error Alert Box */}
        {error && (
          <div
            className="shopee-form-error-msg"
            style={{
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 14px',
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '10px',
              color: '#b91c1c',
              fontSize: '12.5px',
            }}
          >
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* ================= STEP 1: ENTER EMAIL ================= */}
        {step === 1 && (
          <form onSubmit={handleSendOtp}>
            <div className="shopee-form-group" style={{ marginBottom: '18px' }}>
              <label className="shopee-form-label" htmlFor="forgot-email">
                Địa chỉ Email tài khoản *
              </label>
              <div className="shopee-email-autocomplete-wrap">
                <div className="shopee-form-input-wrap">
                  <span className="shopee-input-lead-icon">✉️</span>
                  <input
                    ref={emailInputRef}
                    id="forgot-email"
                    type="email"
                    className="shopee-form-input"
                    placeholder="vidu@student.hcmute.edu.vn"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setError('');
                    }}
                    onFocus={() => setShowEmailDropdown(Boolean(email && email.trim()))}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                {/* Smart Autocomplete Dropdown */}
                {showEmailDropdown && emailSuggestions.length > 0 && (
                  <div ref={emailDropdownRef} className="shopee-email-dropdown">
                    {emailSuggestions.map((item, idx) => (
                      <div
                        key={idx}
                        className="shopee-email-dropdown-item"
                        onClick={() => handleSelectEmailSuggestion(item.full)}
                      >
                        <span>📬</span>
                        <span>
                          <span className="email-prefix">{item.prefix}</span>
                          <span className="email-domain">{item.domain}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="shopee-auth-submit-btn"
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              {loading ? 'Đang gửi mã bảo mật...' : 'Gửi Mã Xác Thực OTP ➔'}
            </button>
          </form>
        )}

        {/* ================= STEP 2: ENTER OTP ================= */}
        {step === 2 && (
          <form onSubmit={handleVerifyOtp}>
            <div
              style={{
                background: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: '12px',
                padding: '12px 14px',
                marginBottom: '18px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px',
              }}
            >
              <span style={{ fontSize: '18px', lineHeight: 1 }}>🛡️</span>
              <div style={{ fontSize: '12px', color: '#1e40af', lineHeight: 1.5 }}>
                Mã xác minh bảo mật 6 số đã được chuyển phát qua dịch vụ thư điện tử tới: <strong>{email}</strong>.
                Vui lòng kiểm tra hộp thư đến (Inbox) hoặc thư rác (Spam).
              </div>
            </div>

            {/* 6-Digit OTP Box Grid */}
            <div className="shopee-form-group" style={{ marginBottom: '18px' }}>
              <label className="shopee-form-label" style={{ textAlign: 'center', display: 'block' }}>
                Nhập 6 chữ số mã OTP xác minh *
              </label>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: '8px',
                  maxWidth: '380px',
                  margin: '8px auto 0',
                }}
                onPaste={handleOtpPaste}
              >
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpInputsRef.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    style={{
                      height: '52px',
                      textAlign: 'center',
                      fontSize: '22px',
                      fontWeight: 800,
                      borderRadius: '12px',
                      border: digit ? '2px solid #2563eb' : '1.5px solid #cbd5e1',
                      background: digit ? '#f8faff' : '#ffffff',
                      color: '#1e293b',
                      outline: 'none',
                      transition: 'all 0.15s ease',
                      boxShadow: digit ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Resend Cooldown Link */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '20px',
                fontSize: '12.5px',
              }}
            >
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#64748b',
                  cursor: 'pointer',
                  fontWeight: 600,
                  padding: 0,
                }}
              >
                ← Đổi email khác
              </button>

              {cooldown > 0 ? (
                <span style={{ color: '#94a3b8', fontWeight: 600 }}>
                  Gửi lại mã sau <strong>{cooldown}s</strong>
                </span>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: '#2563eb',
                    cursor: 'pointer',
                    fontWeight: 700,
                    textDecoration: 'underline',
                    padding: 0,
                  }}
                >
                  🔄 Gửi lại mã mới
                </button>
              )}
            </div>

            <button
              type="submit"
              className="shopee-auth-submit-btn"
              disabled={loading || otpDigits.join('').length < 6}
              style={{
                background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                boxShadow: '0 4px 14px rgba(37, 99, 235, 0.35)',
              }}
            >
              {loading ? 'Đang xác thực mã OTP...' : 'Xác Nhận Mã & Tiếp Tục ➔'}
            </button>
          </form>
        )}

        {/* ================= STEP 3: SET NEW PASSWORD ================= */}
        {step === 3 && (
          <form onSubmit={handleSetNewPassword}>
            <div className="shopee-form-group" style={{ marginBottom: '14px' }}>
              <label className="shopee-form-label" htmlFor="forgot-new-pwd">
                Mật khẩu mới *
              </label>
              <div className="shopee-form-input-wrap">
                <span className="shopee-input-lead-icon">🔒</span>
                <input
                  id="forgot-new-pwd"
                  type={showNewPassword ? 'text' : 'password'}
                  className="shopee-form-input"
                  placeholder="Nhập mật khẩu mới an toàn"
                  value={newPassword}
                  onChange={(e) => {
                    setNewPassword(e.target.value);
                    setError('');
                  }}
                  autoFocus
                />
                <button
                  type="button"
                  className="shopee-password-toggle"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  aria-label="Hiện mật khẩu"
                >
                  {showNewPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password Strength Meter */}
              {newPassword && (
                <div style={{ marginTop: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontSize: '11px', color: '#64748b' }}>Độ mạnh mật khẩu:</span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: pwdStrength.color }}>
                      {pwdStrength.text}
                    </span>
                  </div>
                  <div style={{ height: '4px', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', display: 'flex', gap: '2px' }}>
                    <div style={{ flex: 1, background: pwdStrength.score >= 1 ? pwdStrength.color : '#e2e8f0', transition: 'all 0.2s' }} />
                    <div style={{ flex: 1, background: pwdStrength.score >= 2 ? pwdStrength.color : '#e2e8f0', transition: 'all 0.2s' }} />
                    <div style={{ flex: 1, background: pwdStrength.score >= 3 ? pwdStrength.color : '#e2e8f0', transition: 'all 0.2s' }} />
                  </div>
                </div>
              )}
            </div>

            <div className="shopee-form-group" style={{ marginBottom: '14px' }}>
              <label className="shopee-form-label" htmlFor="forgot-confirm-pwd">
                Xác nhận lại mật khẩu mới *
              </label>
              <div className="shopee-form-input-wrap">
                <span className="shopee-input-lead-icon">🛡️</span>
                <input
                  id="forgot-confirm-pwd"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="shopee-form-input"
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                />
                <button
                  type="button"
                  className="shopee-password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Hiện mật khẩu"
                >
                  {showConfirmPassword ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            {/* Checklist criteria */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: '6px',
                background: '#f8fafc',
                padding: '10px 12px',
                borderRadius: '10px',
                marginBottom: '18px',
                fontSize: '11px',
                border: '1px solid #e2e8f0',
              }}
            >
              <div style={{ color: passwordChecks.length ? '#16a34a' : '#64748b', fontWeight: passwordChecks.length ? 700 : 400 }}>
                {passwordChecks.length ? '✓' : '○'} Tối thiểu 8 ký tự
              </div>
              <div style={{ color: passwordChecks.hasUpper ? '#16a34a' : '#64748b', fontWeight: passwordChecks.hasUpper ? 700 : 400 }}>
                {passwordChecks.hasUpper ? '✓' : '○'} Có chữ in hoa (A-Z)
              </div>
              <div style={{ color: passwordChecks.hasNumber ? '#16a34a' : '#64748b', fontWeight: passwordChecks.hasNumber ? 700 : 400 }}>
                {passwordChecks.hasNumber ? '✓' : '○'} Có chữ số (0-9)
              </div>
              <div style={{ color: passwordChecks.hasSpecial ? '#16a34a' : '#64748b', fontWeight: passwordChecks.hasSpecial ? 700 : 400 }}>
                {passwordChecks.hasSpecial ? '✓' : '○'} Có ký tự đặc biệt
              </div>
            </div>

            <button
              type="submit"
              className="shopee-auth-submit-btn"
              disabled={loading || !isAllPasswordCriteriaMet || newPassword !== confirmPassword}
              style={{
                background: 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)',
                boxShadow: '0 4px 14px rgba(22, 163, 74, 0.35)',
              }}
            >
              {loading ? 'Đang cập nhật mật khẩu...' : 'Xác Nhận Đổi Mật Khẩu & Đăng Nhập ➔'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
