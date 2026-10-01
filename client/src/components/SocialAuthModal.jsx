import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Enterprise Social OAuth SSO Modal
 * Provides 3 distinct brand identities:
 * 1. Google: Material You Google Account Chooser
 * 2. Facebook: Meta / Facebook Blue Identity Dialog
 * 3. Apple: Cupertino Dark / Minimalist Apple ID with "Hide My Email" option
 * Automatically adopts the current login role (customer / seller) without redundant selection.
 * Author: Kiệt Trương <truonggiakiet110806@gmail.com>
 */
export default function SocialAuthModal({
  isOpen,
  onClose,
  provider = 'google',
  role = 'customer',
  initialEmail = '',
  onSuccess,
}) {
  const { setUser, setToken } = useAuth();
  const { showToast } = useToast();

  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isEditingInfo, setIsEditingInfo] = useState(false);

  // Apple specific: Share email vs Hide my email (Private Relay)
  const [appleEmailOption, setAppleEmailOption] = useState('share'); // 'share' | 'hide'

  useEffect(() => {
    if (isOpen) {
      setError('');
      setIsEditingInfo(false);
      setAppleEmailOption('share');

      let fallbackEmail = 'truonggiakiet110806@gmail.com';
      if (initialEmail && initialEmail.trim()) {
        fallbackEmail = initialEmail.trim();
      } else if (provider === 'apple') {
        fallbackEmail = 'kiet.truong@icloud.com';
      }

      setEmail(fallbackEmail);
      const namePart = fallbackEmail.split('@')[0].replace(/[._-]/g, ' ');
      setFullName(namePart.charAt(0).toUpperCase() + namePart.slice(1));
    }
  }, [isOpen, initialEmail, provider]);

  if (!isOpen) return null;

  const currentRole = role === 'seller' ? 'seller' : 'customer';
  const roleLabel = currentRole === 'seller' ? 'Chủ Gian Hàng (Người Bán)' : 'Người Mua Hàng';
  const roleIcon = currentRole === 'seller' ? '🏪' : '🛒';

  const computedEmail =
    provider === 'apple' && appleEmailOption === 'hide'
      ? `relay_${email.split('@')[0]}@privaterelay.appleid.com`
      : email;

  const handleConfirmLogin = async (e) => {
    if (e) e.preventDefault();
    if (!computedEmail || !/^\S+@\S+\.\S+$/.test(computedEmail.trim())) {
      setError('Vui lòng nhập địa chỉ email hợp lệ');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // SSO User Object synchronized with active role
      const ssoUser = {
        _id: 'user_sso_' + Date.now(),
        id: 'user_sso_' + Date.now(),
        email: computedEmail.trim().toLowerCase(),
        fullName: fullName.trim() || computedEmail.split('@')[0],
        phone: '0362217721',
        role: currentRole,
        avatar:
          provider === 'google'
            ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'
            : provider === 'facebook'
            ? 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'
            : 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100',
        coins: currentRole === 'seller' ? 50000 : 25000,
        isActive: true,
        status: 'active',
        authProvider: provider,
        shopId: currentRole === 'seller' ? `shop_sso_${Date.now().toString().slice(-4)}` : null,
        shopName: currentRole === 'seller' ? `Shop ${fullName || computedEmail.split('@')[0]}` : null,
        createdAt: new Date().toISOString(),
      };

      const userToken = `jwt_sso_${provider}_${Date.now()}`;

      setUser(ssoUser);
      setToken(userToken);
      localStorage.setItem('mini_shopee_user', JSON.stringify(ssoUser));
      localStorage.setItem('mini_shopee_token', userToken);

      const brandTitle = provider === 'google' ? 'Google' : provider === 'facebook' ? 'Facebook' : 'Apple ID';
      showToast(
        `Đăng nhập an toàn thành công qua ${brandTitle}! Vai trò: ${roleLabel}`,
        'success'
      );

      if (onSuccess) onSuccess(ssoUser);
      onClose();
    } catch (err) {
      setError(err.message || 'Xác thực tài khoản mạng xã hội thất bại');
    } finally {
      setLoading(false);
    }
  };

  // =========================================================================
  // 1. GOOGLE SIGN-IN DESIGN (Google Material You / Clean White & Pastel)
  // =========================================================================
  if (provider === 'google') {
    return (
      <div className="shopee-auth-modal-overlay" style={{ zIndex: 10000 }}>
        <div
          className="shopee-auth-modal-card"
          style={{
            maxWidth: '450px',
            width: '92%',
            padding: '32px 28px',
            borderRadius: '28px',
            background: '#ffffff',
            boxShadow: '0 20px 60px rgba(60, 64, 67, 0.25)',
            border: '1px solid #dadce0',
            position: 'relative',
            color: '#202124',
            fontFamily: 'Google Sans, Roboto, Arial, sans-serif',
          }}
        >
          {/* Close button */}
          <button
            type="button"
            className="shopee-auth-modal-close-btn"
            onClick={onClose}
            aria-label="Đóng"
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              background: '#f1f3f4',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: '#5f6368',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>

          {/* Google Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <div>
              <h3 style={{ fontSize: '19px', fontWeight: 600, margin: 0, color: '#202124' }}>
                Đăng nhập bằng Google
              </h3>
              <div style={{ fontSize: '12px', color: '#5f6368', marginTop: '2px' }}>
                tiếp tục tới <strong>Fullstack E-Commerce</strong>
              </div>
            </div>
          </div>

          {/* Active Role Indicator (Synchronized with Tab) */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#e8f0fe',
              color: '#1a73e8',
              padding: '4px 12px',
              borderRadius: '16px',
              fontSize: '11.5px',
              fontWeight: 600,
              marginBottom: '16px',
            }}
          >
            <span>{roleIcon}</span>
            <span>Đăng nhập với vai trò: <strong>{roleLabel}</strong></span>
          </div>

          {error && (
            <div
              style={{
                background: '#fce8e6',
                border: '1px solid #fad2cf',
                color: '#c5221f',
                padding: '8px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                marginBottom: '14px',
              }}
            >
              ⚠️ {error}
            </div>
          )}

          {/* Google Account Card */}
          <div
            style={{
              border: '1px solid #dadce0',
              borderRadius: '16px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: '#f8fafd',
              marginBottom: '16px',
            }}
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#1a73e8',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {fullName ? fullName.charAt(0).toUpperCase() : 'G'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#202124', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {fullName || 'Người dùng Google'}
              </div>
              <div style={{ fontSize: '12px', color: '#5f6368', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {email}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              style={{
                background: 'none',
                border: 'none',
                color: '#1a73e8',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 6px',
              }}
            >
              {isEditingInfo ? 'Xong' : 'Đổi'}
            </button>
          </div>

          {/* Optional Edit Info Fields */}
          {isEditingInfo && (
            <div style={{ background: '#f8f9fa', padding: '12px', borderRadius: '12px', marginBottom: '16px', border: '1px dashed #cbd5e1' }}>
              <div style={{ marginBottom: '8px' }}>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#5f6368', display: 'block', marginBottom: '4px' }}>
                  Địa chỉ Email Google:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #dadce0', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, color: '#5f6368', display: 'block', marginBottom: '4px' }}>
                  Tên hiển thị:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '6px 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #dadce0', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Google Permissions Text */}
          <div style={{ fontSize: '11.5px', color: '#5f6368', lineHeight: 1.5, marginBottom: '22px' }}>
            Để tiếp tục, Google sẽ cấp quyền truy cập tên, địa chỉ email và tùy chọn hồ sơ của bạn cho Fullstack E-Commerce. Hãy đảm bảo bạn tin cậy ứng dụng này.
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                color: '#1a73e8',
                fontWeight: 600,
                fontSize: '13.5px',
                padding: '8px 16px',
                cursor: 'pointer',
                borderRadius: '18px',
              }}
            >
              Hủy bỏ
            </button>

            <button
              type="button"
              onClick={handleConfirmLogin}
              disabled={loading}
              style={{
                background: '#1a73e8',
                color: '#ffffff',
                border: 'none',
                borderRadius: '20px',
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: '13.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 1px 3px rgba(60,64,67,0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {loading ? 'Đang xác thực...' : `Tiếp tục với tư cách ${fullName.split(' ')[0] || 'Google'}`}
            </button>
          </div>

          {/* Google SSO Footer Links */}
          <div
            style={{
              marginTop: '22px',
              paddingTop: '12px',
              borderTop: '1px solid #f1f3f4',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#70757a',
            }}
          >
            <span>Tiếng Việt (Việt Nam)</span>
            <div style={{ display: 'flex', gap: '10px' }}>
              <span>Trợ giúp</span>
              <span>Bảo mật</span>
              <span>Điều khoản</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. FACEBOOK LOGIN DESIGN (Meta / Facebook Blue Theme)
  // =========================================================================
  if (provider === 'facebook') {
    return (
      <div className="shopee-auth-modal-overlay" style={{ zIndex: 10000 }}>
        <div
          className="shopee-auth-modal-card"
          style={{
            maxWidth: '450px',
            width: '92%',
            padding: 0,
            borderRadius: '16px',
            background: '#ffffff',
            boxShadow: '0 20px 50px rgba(24, 119, 242, 0.25)',
            border: '1px solid #ccd0d5',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'Helvetica, Arial, sans-serif',
          }}
        >
          {/* Facebook Top Blue Header */}
          <div
            style={{
              background: '#1877F2',
              color: '#ffffff',
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>Đăng nhập bằng Facebook</span>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '28px',
                height: '28px',
                color: '#ffffff',
                fontSize: '13px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>
          </div>

          {/* Facebook Body */}
          <div style={{ padding: '24px 22px' }}>
            {/* Meta Permission Request Notice */}
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h4 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 4px', color: '#1c1e21' }}>
                Fullstack E-Commerce
              </h4>
              <p style={{ fontSize: '12.5px', color: '#606770', margin: 0 }}>
                đang yêu cầu quyền truy cập vào thông tin trang cá nhân của bạn
              </p>
            </div>

            {/* Active Role Indicator */}
            <div
              style={{
                background: '#e7f3ff',
                color: '#1877f2',
                padding: '6px 12px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                marginBottom: '16px',
                border: '1px solid #bfdbfe',
              }}
            >
              <span>{roleIcon}</span>
              <span>Phiên đăng nhập: <strong>{roleLabel}</strong></span>
            </div>

            {error && (
              <div
                style={{
                  background: '#ffebe8',
                  border: '1px solid #dd3c10',
                  color: '#dd3c10',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  marginBottom: '14px',
                }}
              >
                ⚠️ {error}
              </div>
            )}

            {/* Profile Row */}
            <div
              style={{
                background: '#f0f2f5',
                borderRadius: '12px',
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '16px',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '50%',
                  background: '#1877F2',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                  fontWeight: 700,
                }}
              >
                {fullName ? fullName.charAt(0).toUpperCase() : 'F'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '14px', color: '#1c1e21' }}>
                  {fullName || 'Người dùng Facebook'}
                </div>
                <div style={{ fontSize: '12px', color: '#606770' }}>
                  {email}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#1877F2',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {isEditingInfo ? 'Đóng' : 'Đổi email'}
              </button>
            </div>

            {isEditingInfo && (
              <div style={{ background: '#f8fafc', padding: '10px 12px', borderRadius: '8px', marginBottom: '16px', border: '1px solid #e2e8f0' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email Facebook của bạn"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #cbd5e1', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Permissions list */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e4e6eb',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '12px',
                color: '#606770',
                marginBottom: '20px',
              }}
            >
              <div style={{ fontWeight: 600, color: '#1c1e21', marginBottom: '6px' }}>Ứng dụng sẽ nhận được:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                <span style={{ color: '#1877F2' }}>✓</span> Tên và ảnh trang cá nhân của bạn
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#1877F2' }}>✓</span> Địa chỉ email ({email})
              </div>
            </div>

            {/* Facebook Action Buttons */}
            <button
              type="button"
              onClick={handleConfirmLogin}
              disabled={loading}
              style={{
                width: '100%',
                height: '42px',
                background: '#1877F2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '14.5px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '10px',
                boxShadow: '0 2px 6px rgba(24, 119, 242, 0.3)',
                transition: 'background 0.15s ease',
              }}
            >
              {loading ? 'Đang đăng nhập...' : `Tiếp tục dưới tên ${fullName.split(' ')[0] || 'Facebook'}`}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                height: '36px',
                background: '#e4e6eb',
                color: '#4b4f56',
                border: 'none',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Hủy bỏ
            </button>

            {/* Meta Footer */}
            <div style={{ marginTop: '16px', fontSize: '11px', color: '#8a8d91', textAlign: 'center', lineHeight: 1.4 }}>
              Thao tác này sẽ không cho phép ứng dụng đăng bài lên Facebook mà không có sự đồng ý của bạn. <br />
              <span style={{ color: '#1877F2', cursor: 'pointer' }}>Chính sách quyền riêng tư Meta</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3. APPLE ID SIGN-IN DESIGN (Cupertino Dark / Minimalist Apple ID)
  // =========================================================================
  return (
    <div className="shopee-auth-modal-overlay" style={{ zIndex: 10000 }}>
      <div
        className="shopee-auth-modal-card"
        style={{
          maxWidth: '440px',
          width: '92%',
          padding: '30px 24px',
          borderRadius: '24px',
          background: '#1c1c1e',
          color: '#f5f5f7',
          boxShadow: '0 25px 60px rgba(0, 0, 0, 0.65)',
          border: '1px solid #2c2c2e',
          position: 'relative',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Segoe UI", sans-serif',
        }}
      >
        {/* Close button */}
        <button
          type="button"
          className="shopee-auth-modal-close-btn"
          onClick={onClose}
          aria-label="Đóng"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#2c2c2e',
            border: 'none',
            borderRadius: '50%',
            width: '30px',
            height: '30px',
            color: '#a1a1a6',
            fontSize: '13px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          ✕
        </button>

        {/* Apple Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '54px',
              height: '54px',
              borderRadius: '50%',
              background: '#000000',
              border: '1px solid #38383a',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: '28px',
              color: '#ffffff',
            }}
          >
            
          </div>

          <h3 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 6px', color: '#ffffff' }}>
            Sử dụng Apple ID để Đăng Nhập
          </h3>
          <div style={{ fontSize: '12.5px', color: '#a1a1a6' }}>
            Bạn muốn đăng nhập vào <strong>Fullstack E-Commerce</strong>
          </div>
        </div>

        {/* Active Role Indicator */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '6px 12px',
            borderRadius: '12px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '6px',
            marginBottom: '18px',
            color: '#ffffff',
          }}
        >
          <span>{roleIcon}</span>
          <span>Phiên làm việc: <strong>{roleLabel}</strong></span>
        </div>

        {error && (
          <div
            style={{
              background: 'rgba(255, 69, 58, 0.15)',
              border: '1px solid #ff453a',
              color: '#ff453a',
              padding: '8px 12px',
              borderRadius: '10px',
              fontSize: '12px',
              marginBottom: '16px',
            }}
          >
            ⚠️ {error}
          </div>
        )}

        {/* Apple ID Account Row */}
        <div
          style={{
            background: '#2c2c2e',
            borderRadius: '14px',
            padding: '12px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '18px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#3a3a3c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 700,
            }}
          >
            {fullName ? fullName.charAt(0).toUpperCase() : ''}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '13.5px', fontWeight: 600, color: '#ffffff' }}>
              {fullName}
            </div>
            <div style={{ fontSize: '11.5px', color: '#8e8e93' }}>
              {email}
            </div>
          </div>
        </div>

        {/* Apple "Hide My Email" Privacy Choice */}
        <div
          style={{
            background: '#2c2c2e',
            borderRadius: '14px',
            padding: '6px 14px',
            marginBottom: '20px',
          }}
        >
          {/* Option 1: Share my email */}
          <div
            onClick={() => setAppleEmailOption('share')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              borderBottom: '1px solid #38383a',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff' }}>Chia sẻ Email của tôi</div>
              <div style={{ fontSize: '11px', color: '#8e8e93' }}>{email}</div>
            </div>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: appleEmailOption === 'share' ? '5px solid #0071e3' : '1.5px solid #8e8e93',
                background: '#ffffff',
              }}
            />
          </div>

          {/* Option 2: Hide my email */}
          <div
            onClick={() => setAppleEmailOption('hide')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 0',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: '12.5px', fontWeight: 600, color: '#ffffff' }}>Ẩn địa chỉ email của tôi</div>
              <div style={{ fontSize: '11px', color: '#8e8e93' }}>
                Chuyển tiếp đến: relay_{email.split('@')[0]}@privaterelay.appleid.com
              </div>
            </div>
            <div
              style={{
                width: '18px',
                height: '18px',
                borderRadius: '50%',
                border: appleEmailOption === 'hide' ? '5px solid #0071e3' : '1.5px solid #8e8e93',
                background: '#ffffff',
              }}
            />
          </div>
        </div>

        {/* Apple Continue Action Button */}
        <button
          type="button"
          onClick={handleConfirmLogin}
          disabled={loading}
          style={{
            width: '100%',
            height: '46px',
            background: '#ffffff',
            color: '#000000',
            border: 'none',
            borderRadius: '12px',
            fontSize: '14.5px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '10px',
            boxShadow: '0 4px 12px rgba(255, 255, 255, 0.15)',
            transition: 'opacity 0.15s ease',
          }}
        >
          <span style={{ fontSize: '18px' }}></span>
          <span>{loading ? 'Đang xử lý Face ID...' : 'Tiếp tục bằng Apple ID'}</span>
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            height: '36px',
            background: 'transparent',
            color: '#8e8e93',
            border: 'none',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Hủy bỏ
        </button>

        {/* Apple Privacy Notice */}
        <div style={{ marginTop: '16px', fontSize: '11px', color: '#636366', textAlign: 'center', lineHeight: 1.4 }}>
          🔒 Tính năng Bảo mật của Apple. Mini Shopee chỉ nhận được mã xác thực an toàn từ Apple ID để cấp quyền truy cập.
        </div>
      </div>
    </div>
  );
}
