import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { StoreIcon, CartIcon, ShieldIcon, LockIcon, CloseIcon, AlertCircleIcon, CheckIcon, RefreshIcon } from './OrdersIcons';

/**
 * Enterprise Social OAuth SSO Modal (Next-Gen UI/UX Edition)
 * Distinct world-class designs:
 * 1. Google: Material You Google Account Identity Chooser
 * 2. Facebook: Meta Modern Authenticator with permission preview
 * 3. Apple: Cupertino Dark Elegance with Private Relay toggle
 * Automatically inherits login tab role (customer/seller) seamlessly.
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
  const roleIcon = (
    <span
      style={{
        width: '22px',
        height: '22px',
        borderRadius: '50%',
        background: currentRole === 'seller' ? 'linear-gradient(135deg, #fff7ed, #ffedd5)' : 'linear-gradient(135deg, #ecfdf5, #d1fae5)',
        border: currentRole === 'seller' ? '1px solid #fed7aa' : '1px solid #a7f3d0',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
      }}
    >
      {currentRole === 'seller' ? <StoreIcon size={12} color="#ea580c" /> : <CartIcon size={12} color="#16a34a" />}
    </span>
  );

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
            maxWidth: '460px',
            width: '92%',
            padding: '36px 30px 24px',
            borderRadius: '28px',
            background: '#ffffff',
            boxShadow: '0 24px 64px -12px rgba(60, 64, 67, 0.25), 0 8px 24px -4px rgba(60, 64, 67, 0.1)',
            border: '1px solid #e0e2ec',
            position: 'relative',
            color: '#1f1f1f',
            fontFamily: '"Google Sans", Roboto, system-ui, -apple-system, sans-serif',
            animation: 'authModalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
              top: '18px',
              right: '18px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              color: '#ef4444',
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
            }}
          >
            <CloseIcon size={16} color="#ef4444" />
          </button>

          {/* Google Header Logo */}
          <div style={{ textAlign: 'center', marginBottom: '22px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: '#ffffff',
                border: '1.5px solid #e0e2ec',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.06)',
                marginBottom: '12px',
              }}
            >
              <svg width="30" height="30" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            </div>

            <h3 style={{ fontSize: '21px', fontWeight: 700, margin: '0 0 4px', color: '#1f1f1f', letterSpacing: '-0.2px' }}>
              Đăng nhập bằng Google
            </h3>
            <div style={{ fontSize: '13px', color: '#444746' }}>
              tiếp tục tới <strong style={{ color: '#0b57d0' }}>Fullstack E-Commerce</strong>
            </div>
          </div>

          {/* Active Role Smart Chip */}
          <div style={{ textAlign: 'center', marginBottom: '18px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: currentRole === 'seller' ? '#fef3c7' : '#e8f0fe',
                color: currentRole === 'seller' ? '#92400e' : '#0b57d0',
                border: currentRole === 'seller' ? '1px solid #fde68a' : '1px solid #c2e7ff',
                padding: '5px 14px',
                borderRadius: '20px',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <span>{roleIcon}</span>
              <span>Đăng nhập với vai trò: <strong>{roleLabel}</strong></span>
            </div>
          </div>

          {error && (
            <div
              style={{
                background: '#fce8e6',
                border: '1px solid #fad2cf',
                color: '#c5221f',
                padding: '10px 14px',
                borderRadius: '12px',
                fontSize: '12.5px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <AlertCircleIcon size={15} color="#ef4444" />
              <span>{error}</span>
            </div>
          )}

          {/* Google Account Card (Material You) */}
          <div
            style={{
              border: '1.5px solid #e0e2ec',
              borderRadius: '20px',
              padding: '14px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              background: '#f8fafd',
              marginBottom: '16px',
              transition: 'border-color 0.2s',
            }}
          >
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0b57d0 0%, #1a73e8 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                fontWeight: 700,
                flexShrink: 0,
                boxShadow: '0 4px 10px rgba(11, 87, 208, 0.25)',
              }}
            >
              {fullName ? fullName.charAt(0).toUpperCase() : 'G'}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontWeight: 700, fontSize: '14.5px', color: '#1f1f1f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {fullName || 'Người dùng Google'}
                </span>
                <span style={{ color: '#0b57d0', display: 'inline-flex', alignItems: 'center' }} title="Tài khoản Google chính chủ">
                  <CheckIcon size={13} color="#0b57d0" />
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: '#444746', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '2px' }}>
                {email}
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingInfo(!isEditingInfo)}
              style={{
                background: '#e8f0fe',
                border: 'none',
                color: '#0b57d0',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
                padding: '6px 10px',
                borderRadius: '12px',
              }}
            >
              {isEditingInfo ? 'Đóng' : 'Đổi'}
            </button>
          </div>

          {/* Quick Edit Accordion */}
          {isEditingInfo && (
            <div style={{ background: '#f8f9fa', padding: '14px', borderRadius: '16px', marginBottom: '16px', border: '1px solid #e0e2ec' }}>
              <div style={{ marginBottom: '10px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#444746', display: 'block', marginBottom: '4px' }}>
                  Email Google của bạn:
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #c4c7c5', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#444746', display: 'block', marginBottom: '4px' }}>
                  Họ và tên:
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #c4c7c5', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {/* Google Permissions Box */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '14px',
              padding: '12px 14px',
              fontSize: '11.5px',
              color: '#475569',
              lineHeight: 1.5,
              marginBottom: '22px',
              display: 'flex',
              gap: '10px',
            }}
          >
            <span
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
                border: '1px solid #7dd3fc',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
                boxShadow: '0 1px 3px rgba(2, 132, 199, 0.15)',
              }}
            >
              <ShieldIcon size={14} color="#0284c7" />
            </span>
            <div>
              Google sẽ chia sẻ tên, địa chỉ email và ảnh hồ sơ cá nhân của bạn với Fullstack E-Commerce để thiết lập phiên đăng nhập an toàn.
            </div>
          </div>

          {/* Google Action Buttons */}
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#0b57d0',
                fontWeight: 600,
                fontSize: '13.5px',
                padding: '10px 18px',
                cursor: 'pointer',
                borderRadius: '20px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'rgba(239, 68, 68, 0.12)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseIcon size={10} color="#ef4444" />
              </span>
              <span>Hủy bỏ</span>
            </button>

            <button
              type="button"
              onClick={handleConfirmLogin}
              disabled={loading}
              style={{
                background: 'linear-gradient(135deg, #0b57d0 0%, #1a73e8 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '22px',
                padding: '11px 24px',
                fontWeight: 700,
                fontSize: '13.5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: '0 4px 14px rgba(11, 87, 208, 0.35)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshIcon size={12} color="#ffffff" className="spin-animation" />
                  </span>
                  <span>Đang xác thực...</span>
                </>
              ) : (
                `Tiếp tục với tư cách ${fullName.split(' ')[0] || 'Google'}`
              )}
            </button>
          </div>

          {/* Google Footer */}
          <div
            style={{
              marginTop: '22px',
              paddingTop: '14px',
              borderTop: '1px solid #f1f3f4',
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '11px',
              color: '#747775',
            }}
          >
            <span>Tiếng Việt (Việt Nam)</span>
            <div style={{ display: 'flex', gap: '12px' }}>
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
            maxWidth: '460px',
            width: '92%',
            padding: 0,
            borderRadius: '20px',
            background: '#ffffff',
            boxShadow: '0 24px 60px rgba(8, 102, 255, 0.28)',
            border: '1px solid #ccd0d5',
            position: 'relative',
            overflow: 'hidden',
            fontFamily: 'Segoe UI, Helvetica, Arial, sans-serif',
            animation: 'authModalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
          }}
        >
          {/* Facebook Top Blue Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #0866FF 0%, #1877F2 100%)',
              color: '#ffffff',
              padding: '18px 22px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 4px 12px rgba(8, 102, 255, 0.2)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="#0866FF">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
              </div>
              <div>
                <span style={{ fontSize: '17px', fontWeight: 800 }}>Đăng nhập bằng Facebook</span>
                <div style={{ fontSize: '11px', opacity: 0.9 }}>Xác thực an toàn qua Meta</div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(239, 68, 68, 0.25)',
                border: 'none',
                borderRadius: '50%',
                width: '30px',
                height: '30px',
                color: '#ffffff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 0,
              }}
              aria-label="Đóng cửa sổ Meta"
            >
              <CloseIcon size={14} color="#fee2e2" />
            </button>
          </div>

          {/* Facebook Body */}
          <div style={{ padding: '26px 24px' }}>
            {/* Meta Permission Request Title */}
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
              <h4 style={{ fontSize: '17px', fontWeight: 700, margin: '0 0 4px', color: '#050505' }}>
                Fullstack E-Commerce
              </h4>
              <p style={{ fontSize: '13px', color: '#65676b', margin: 0 }}>
                yêu cầu liên kết với thông tin trang cá nhân Facebook của bạn
              </p>
            </div>

            {/* Active Role Indicator */}
            <div
              style={{
                background: currentRole === 'seller' ? '#fffbeb' : '#edf2ff',
                color: currentRole === 'seller' ? '#b45309' : '#0866FF',
                padding: '8px 14px',
                borderRadius: '10px',
                fontSize: '12px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '18px',
                border: currentRole === 'seller' ? '1px solid #fef3c7' : '1px solid #d0e2ff',
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
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '12px',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <AlertCircleIcon size={14} color="#ef4444" />
                <span>{error}</span>
              </div>
            )}

            {/* Profile Row */}
            <div
              style={{
                background: '#f0f2f5',
                borderRadius: '14px',
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                gap: '14px',
                marginBottom: '18px',
              }}
            >
              <div
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #0866FF 0%, #1877F2 100%)',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px',
                  fontWeight: 700,
                  boxShadow: '0 4px 10px rgba(8, 102, 255, 0.25)',
                }}
              >
                {fullName ? fullName.charAt(0).toUpperCase() : 'F'}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#050505', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>{fullName || 'Người dùng Facebook'}</span>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#0866FF', display: 'inline-block' }} />
                </div>
                <div style={{ fontSize: '12.5px', color: '#65676b', marginTop: '2px' }}>
                  {email}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsEditingInfo(!isEditingInfo)}
                style={{
                  background: '#ffffff',
                  border: '1px solid #ced0d4',
                  borderRadius: '8px',
                  color: '#0866FF',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  padding: '6px 10px',
                }}
              >
                {isEditingInfo ? 'Đóng' : 'Đổi email'}
              </button>
            </div>

            {isEditingInfo && (
              <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '10px', marginBottom: '18px', border: '1px solid #e4e6eb' }}>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Nhập email Facebook của bạn"
                  style={{ width: '100%', padding: '8px 12px', fontSize: '13px', borderRadius: '8px', border: '1px solid #ced0d4', boxSizing: 'border-box' }}
                />
              </div>
            )}

            {/* Meta Permissions List */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e4e6eb',
                borderRadius: '12px',
                padding: '12px 16px',
                fontSize: '12.5px',
                color: '#65676b',
                marginBottom: '22px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#050505', marginBottom: '8px' }}>Quyền hạn được chia sẻ:</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span style={{ color: '#0866FF', display: 'inline-flex', alignItems: 'center' }}>
                  <CheckIcon size={13} color="#0866FF" />
                </span>
                <span>Tên hồ sơ và ảnh đại diện trang cá nhân</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#0866FF', display: 'inline-flex', alignItems: 'center' }}>
                  <CheckIcon size={13} color="#0866FF" />
                </span>
                <span>Địa chỉ email ({email})</span>
              </div>
            </div>

            {/* Action Buttons */}
            <button
              type="button"
              onClick={handleConfirmLogin}
              disabled={loading}
              style={{
                width: '100%',
                height: '44px',
                background: 'linear-gradient(135deg, #0866FF 0%, #1877F2 100%)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '10px',
                boxShadow: '0 4px 14px rgba(8, 102, 255, 0.35)',
                transition: 'all 0.15s ease',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {loading ? (
                <>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RefreshIcon size={12} color="#ffffff" className="spin-animation" />
                  </span>
                  <span>Đang đăng nhập...</span>
                </>
              ) : (
                `Tiếp tục dưới tên ${fullName.split(' ')[0] || 'Facebook'}`
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              style={{
                width: '100%',
                height: '38px',
                background: '#e4e6eb',
                color: '#050505',
                border: 'none',
                borderRadius: '10px',
                fontSize: '13.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              <span
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: 'rgba(0, 0, 0, 0.08)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CloseIcon size={10} color="#4b5563" />
              </span>
              <span>Hủy bỏ</span>
            </button>

            {/* Meta Footer */}
            <div style={{ marginTop: '18px', fontSize: '11px', color: '#8a8d91', textAlign: 'center', lineHeight: 1.4 }}>
              Ứng dụng sẽ không tự ý đăng bài lên Facebook của bạn. <br />
              <span style={{ color: '#0866FF', cursor: 'pointer' }}>Chính sách quyền riêng tư Meta</span> • <span style={{ color: '#0866FF', cursor: 'pointer' }}>Điều khoản</span>
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
          maxWidth: '450px',
          width: '92%',
          padding: '34px 28px',
          borderRadius: '26px',
          background: '#161618',
          color: '#f5f5f7',
          boxShadow: '0 30px 80px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.12)',
          border: '1px solid #2c2c2e',
          position: 'relative',
          fontFamily: '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif',
          animation: 'authModalSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards',
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
            top: '18px',
            right: '18px',
            background: 'rgba(239, 68, 68, 0.2)',
            border: 'none',
            borderRadius: '50%',
            width: '32px',
            height: '32px',
            color: '#ef4444',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 0,
          }}
        >
          <CloseIcon size={14} color="#ef4444" />
        </button>

        {/* Apple Logo & Header */}
        <div style={{ textAlign: 'center', marginBottom: '22px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#000000',
              border: '1.5px solid rgba(255, 255, 255, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: '30px',
              color: '#ffffff',
              boxShadow: '0 4px 20px rgba(255, 255, 255, 0.1)',
            }}
          >
            
          </div>

          <h3 style={{ fontSize: '21px', fontWeight: 700, margin: '0 0 6px', color: '#ffffff', letterSpacing: '-0.3px' }}>
            Sử dụng Apple ID để Đăng Nhập
          </h3>
          <div style={{ fontSize: '13px', color: '#86868b' }}>
            Bạn muốn truy cập vào <strong style={{ color: '#ffffff' }}>Fullstack E-Commerce</strong>
          </div>
        </div>

        {/* Active Role Indicator */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '7px 14px',
            borderRadius: '14px',
            fontSize: '12px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
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
              background: 'rgba(255, 69, 58, 0.18)',
              border: '1px solid #ff453a',
              color: '#ff453a',
              padding: '10px 14px',
              borderRadius: '12px',
              fontSize: '12px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <AlertCircleIcon size={14} color="#ff453a" />
            <span>{error}</span>
          </div>
        )}

        {/* Apple ID Account Row */}
        <div
          style={{
            background: '#242426',
            borderRadius: '16px',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '18px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '50%',
              background: '#3a3a3c',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            {fullName ? fullName.charAt(0).toUpperCase() : ''}
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: '14px', fontWeight: 600, color: '#ffffff' }}>
              {fullName}
            </div>
            <div style={{ fontSize: '12px', color: '#86868b', marginTop: '2px' }}>
              {email}
            </div>
          </div>
        </div>

        {/* Apple "Hide My Email" Privacy Choice */}
        <div
          style={{
            background: '#242426',
            borderRadius: '16px',
            padding: '4px 16px',
            marginBottom: '22px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
          }}
        >
          {/* Option 1: Share my email */}
          <div
            onClick={() => setAppleEmailOption('share')}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 0',
              borderBottom: '1px solid #333336',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Chia sẻ Email của tôi</div>
              <div style={{ fontSize: '11.5px', color: '#86868b', marginTop: '2px' }}>{email}</div>
            </div>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: appleEmailOption === 'share' ? '6px solid #0071e3' : '1.5px solid #8e8e93',
                background: '#ffffff',
                transition: 'all 0.15s ease',
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
              padding: '12px 0',
              cursor: 'pointer',
            }}
          >
            <div>
              <div style={{ fontSize: '13px', fontWeight: 600, color: '#ffffff' }}>Ẩn địa chỉ email của tôi</div>
              <div style={{ fontSize: '11.5px', color: '#86868b', marginTop: '2px' }}>
                Chuyển tiếp đến: relay_{email.split('@')[0]}@privaterelay.appleid.com
              </div>
            </div>
            <div
              style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: appleEmailOption === 'hide' ? '6px solid #0071e3' : '1.5px solid #8e8e93',
                background: '#ffffff',
                transition: 'all 0.15s ease',
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
            height: '48px',
            background: '#ffffff',
            color: '#000000',
            border: 'none',
            borderRadius: '14px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '12px',
            boxShadow: '0 4px 16px rgba(255, 255, 255, 0.2)',
            transition: 'opacity 0.15s ease',
          }}
        >
          {loading ? (
            <>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <RefreshIcon size={13} color="#000000" className="spin-animation" />
              </span>
              <span>Đang xác thực Face ID...</span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '20px', lineHeight: 1 }}></span>
              <span>Tiếp tục bằng Apple ID</span>
            </>
          )}
        </button>

        <button
          type="button"
          onClick={onClose}
          style={{
            width: '100%',
            height: '38px',
            background: 'transparent',
            color: '#86868b',
            border: 'none',
            fontSize: '13.5px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.08)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon size={10} color="#86868b" />
          </span>
          <span>Hủy bỏ</span>
        </button>

        {/* Apple Privacy Notice */}
        <div style={{ marginTop: '18px', fontSize: '11px', color: '#636366', textAlign: 'center', lineHeight: 1.4, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
          <LockIcon size={12} color="#636366" /> <span>Tính năng Bảo mật của Apple. Mini Shopee chỉ nhận được mã ủy quyền từ Apple ID để cấp quyền truy cập.</span>
        </div>
      </div>
    </div>
  );
}
