import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuthModal } from '../context/AuthModalContext';
import '../styles/auth.css';

export default function AuthModal() {
  const { isOpen, authTab, setAuthTab, initialRole, closeAuthModal } = useAuthModal();
  const { login, register, loginAsDemo } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [activeRole, setActiveRole] = useState(initialRole || 'customer');
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'qr'
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login Form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register Form
  const [regData, setRegData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    shopAddress: '',
    shopCategory: 'Thời trang'
  });

  useEffect(() => {
    if (initialRole) setActiveRole(initialRole);
  }, [initialRole]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, closeAuthModal]);

  if (!isOpen) return null;

  // Calculate password strength
  const getPasswordStrength = (pwd) => {
    if (!pwd) return { score: 0, text: '', colorClass: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 2) return { score: 1, text: 'Yếu', colorClass: 'active-weak' };
    if (score <= 3) return { score: 2, text: 'Trung bình', colorClass: 'active-fair' };
    return { score: 3, text: 'Mạnh', colorClass: 'active-strong' };
  };

  const pwdStrength = getPasswordStrength(regData.password);

  const handleQuickDemoLogin = async (roleKey) => {
    setLoading(true);
    setError('');
    try {
      const u = await loginAsDemo(roleKey);
      if (u) {
        showToast(
          `Đăng nhập thành công với vai trò ${
            u.role === 'admin' ? 'Quản Trị Viên' : u.role === 'seller' ? 'Chủ Cửa Hàng' : 'Khách Mua Hàng'
          }!`,
          'success'
        );
        closeAuthModal();
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập demo thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginEmail || !loginPassword) {
      setError('Vui lòng nhập đầy đủ Email và Mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(loginEmail, loginPassword, activeRole);
      if (res.success) {
        showToast('Đăng nhập thành công! Chào mừng bạn quay lại.', 'success');
        closeAuthModal();
      }
    } catch (err) {
      setError(err.message || 'Tài khoản hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regData.fullName || !regData.email || !regData.password) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }
    if (regData.password !== regData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (activeRole === 'seller' && !regData.shopName) {
      setError('Vui lòng nhập Tên Cửa Hàng / Shop của bạn');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await register({
        ...regData,
        role: activeRole === 'admin' ? 'customer' : activeRole
      });
      if (res.success) {
        showToast(
          activeRole === 'seller'
            ? 'Đăng ký gian hàng thành công! Kênh Người Bán đã được kích hoạt.'
            : 'Đăng ký tài khoản thành công! Bắt đầu mua sắm ngay.',
          'success'
        );
        closeAuthModal();
      }
    } catch (err) {
      setError(err.message || 'Đăng ký tài khoản không thành công');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shopee-auth-modal-overlay" onClick={closeAuthModal}>
      <div className="shopee-auth-modal-card" onClick={(e) => e.stopPropagation()}>
        {/* Close Button */}
        <button
          type="button"
          className="shopee-auth-modal-close-btn"
          onClick={closeAuthModal}
          title="Đóng (ESC)"
        >
          ✕
        </button>

        {/* Master Mode Tabs: ĐĂNG NHẬP vs ĐĂNG KÝ */}
        <div className="shopee-auth-mode-tabs">
          <button
            type="button"
            className={`shopee-auth-mode-tab ${authTab === 'login' ? 'active' : ''}`}
            onClick={() => {
              setAuthTab('login');
              setError('');
            }}
          >
            🔑 Đăng Nhập
          </button>
          <button
            type="button"
            className={`shopee-auth-mode-tab ${authTab === 'register' ? 'active' : ''}`}
            onClick={() => {
              setAuthTab('register');
              setError('');
            }}
          >
            ✨ Đăng Ký Tài Khoản
          </button>
        </div>

        {/* Role Selector Tabs (3 roles) */}
        <div className="shopee-role-picker">
          <div
            className={`shopee-role-card ${activeRole === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveRole('customer')}
          >
            <span className="shopee-role-card-icon">🛒</span>
            <span className="shopee-role-card-title">Người Mua</span>
            <span className="shopee-role-card-sub">Mua sắm & Săn xu</span>
          </div>

          <div
            className={`shopee-role-card ${activeRole === 'seller' ? 'active' : ''}`}
            onClick={() => setActiveRole('seller')}
          >
            <span className="shopee-role-card-icon">🏪</span>
            <span className="shopee-role-card-title">Chủ Shop</span>
            <span className="shopee-role-card-sub">Quản lý gian hàng</span>
          </div>

          <div
            className={`shopee-role-card ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin')}
          >
            <span className="shopee-role-card-icon">🛡️</span>
            <span className="shopee-role-card-title">Quản Trị</span>
            <span className="shopee-role-card-sub">Tổng vận hành</span>
          </div>
        </div>

        {/* Demo 1-Click Quick Access Box */}
        {authTab === 'login' && (
          <div className="shopee-demo-container">
            <div className="shopee-demo-header">
              <span className="shopee-demo-tag">⚡ Chọn Nhanh Tài Khoản Trải Nghiệm</span>
            </div>
            <div className="shopee-demo-grid">
              {activeRole === 'customer' && (
                <button
                  type="button"
                  className="shopee-demo-item-btn"
                  onClick={() => handleQuickDemoLogin('customer')}
                >
                  <div className="shopee-demo-btn-left">
                    <img
                      src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"
                      alt="Customer"
                      className="shopee-demo-avatar"
                    />
                    <div className="shopee-demo-btn-text">
                      <strong>Nguyễn Văn Khách (Người Mua)</strong>
                      <span>khachhang@shopee.vn</span>
                    </div>
                  </div>
                  <span className="shopee-demo-action-pill">Vào ngay</span>
                </button>
              )}

              {activeRole === 'seller' && (
                <>
                  <button
                    type="button"
                    className="shopee-demo-item-btn"
                    onClick={() => handleQuickDemoLogin('seller_fashion')}
                  >
                    <div className="shopee-demo-btn-left">
                      <img
                        src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120"
                        alt="Seller A"
                        className="shopee-demo-avatar"
                      />
                      <div className="shopee-demo-btn-text">
                        <strong>Thời Trang GenZ Official (Shop A)</strong>
                        <span>shop.genz@shopee.vn</span>
                      </div>
                    </div>
                    <span className="shopee-demo-action-pill">Vào ngay</span>
                  </button>
                  <button
                    type="button"
                    className="shopee-demo-item-btn"
                    onClick={() => handleQuickDemoLogin('seller_tech')}
                  >
                    <div className="shopee-demo-btn-left">
                      <img
                        src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120"
                        alt="Seller B"
                        className="shopee-demo-avatar"
                      />
                      <div className="shopee-demo-btn-text">
                        <strong>TechWorld Store (Shop B)</strong>
                        <span>shop.tech@shopee.vn</span>
                      </div>
                    </div>
                    <span className="shopee-demo-action-pill">Vào ngay</span>
                  </button>
                </>
              )}

              {activeRole === 'admin' && (
                <button
                  type="button"
                  className="shopee-demo-item-btn"
                  onClick={() => handleQuickDemoLogin('admin')}
                >
                  <div className="shopee-demo-btn-left">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"
                      alt="Admin"
                      className="shopee-demo-avatar"
                    />
                    <div className="shopee-demo-btn-text">
                      <strong>Tổng Quản Trị Viên Sàn (Super Admin)</strong>
                      <span>admin@shopee.vn</span>
                    </div>
                  </div>
                  <span className="shopee-demo-action-pill">Vào ngay</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="shopee-form-error-msg">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* LOGIN FORM */}
        {authTab === 'login' ? (
          <div>
            <div className="shopee-auth-method-row">
              <span
                className="shopee-auth-method-link"
                onClick={() => setAuthMethod(authMethod === 'password' ? 'qr' : 'password')}
              >
                {authMethod === 'password' ? '📱 Quét mã QR đăng nhập' : '🔒 Đăng nhập bằng mật khẩu'}
              </span>
            </div>

            {authMethod === 'qr' ? (
              <div className="shopee-qr-container">
                <div className="shopee-qr-box">
                  <div className="shopee-qr-laser"></div>
                  <img
                    src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=mini-shopee-secure-auth-login"
                    alt="Shopee Auth QR Code"
                    className="shopee-qr-image"
                  />
                </div>
                <p className="shopee-qr-hint">
                  Mở ứng dụng <strong>Fullstack E-Commerce</strong> trên điện thoại, quét mã để đăng nhập an toàn mà không cần nhập mật khẩu.
                </p>
              </div>
            ) : (
              <form onSubmit={handleLoginSubmit}>
                <div className="shopee-form-group">
                  <label className="shopee-form-label" htmlFor="modal-login-email">
                    Email / Tên đăng nhập *
                  </label>
                  <input
                    id="modal-login-email"
                    type="email"
                    className="shopee-form-input"
                    placeholder={
                      activeRole === 'customer'
                        ? 'khachhang@shopee.vn'
                        : activeRole === 'seller'
                        ? 'shop.genz@shopee.vn'
                        : 'admin@shopee.vn'
                    }
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                  />
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label" htmlFor="modal-login-password">
                    Mật khẩu *
                  </label>
                  <div className="shopee-form-input-wrap">
                    <input
                      id="modal-login-password"
                      type={showPassword ? 'text' : 'password'}
                      className="shopee-form-input"
                      placeholder="••••••••"
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                    />
                    <button
                      type="button"
                      className="shopee-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                    fontSize: '12.5px',
                  }}
                >
                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      cursor: 'pointer',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: '#3b82f6' }}
                    />
                    <span>Ghi nhớ đăng nhập</span>
                  </label>

                  <span
                    onClick={() =>
                      showToast(
                        'Vui lòng liên hệ CSKH 1900 6868 hoặc dùng đăng nhập 1-Click để kiểm tra tài khoản!',
                        'info'
                      )
                    }
                    style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}
                  >
                    Quên mật khẩu?
                  </span>
                </div>

                <button type="submit" className="shopee-auth-submit-btn" disabled={loading}>
                  {loading ? 'Đang xác thực...' : 'Đăng Nhập Ngay'}
                </button>
              </form>
            )}

            <div className="shopee-auth-divider">
              <span>Hoặc tiếp tục với</span>
            </div>

            <div className="shopee-social-buttons">
              <button
                type="button"
                className="shopee-social-btn"
                onClick={() => handleQuickDemoLogin('customer')}
              >
                <span>🌐</span> Google
              </button>
              <button
                type="button"
                className="shopee-social-btn"
                onClick={() => handleQuickDemoLogin('customer')}
              >
                <span>📘</span> Facebook
              </button>
              <button
                type="button"
                className="shopee-social-btn"
                onClick={() => handleQuickDemoLogin('customer')}
              >
                <span>🍏</span> Apple
              </button>
            </div>
          </div>
        ) : (
          /* REGISTER FORM */
          <form onSubmit={handleRegisterSubmit}>
            <div className="shopee-form-group">
              <label className="shopee-form-label">Họ và tên *</label>
              <input
                type="text"
                className="shopee-form-input"
                placeholder="Nguyễn Văn A"
                value={regData.fullName}
                onChange={(e) => setRegData({ ...regData, fullName: e.target.value })}
              />
            </div>

            <div className="shopee-form-group">
              <label className="shopee-form-label">Địa chỉ Email *</label>
              <input
                type="email"
                className="shopee-form-input"
                placeholder="email@vidu.com"
                value={regData.email}
                onChange={(e) => setRegData({ ...regData, email: e.target.value })}
              />
            </div>

            <div className="shopee-form-group">
              <label className="shopee-form-label">Số điện thoại</label>
              <input
                type="tel"
                className="shopee-form-input"
                placeholder="09xx xxx xxx"
                value={regData.phone}
                onChange={(e) => setRegData({ ...regData, phone: e.target.value })}
              />
            </div>

            {/* SELLER SPECIFIC FIELDS */}
            {activeRole === 'seller' && (
              <>
                <div className="shopee-form-group">
                  <label className="shopee-form-label">Tên Cửa Hàng / Shop *</label>
                  <input
                    type="text"
                    className="shopee-form-input"
                    placeholder="Ví dụ: GenZ Fashion Store"
                    value={regData.shopName}
                    onChange={(e) => setRegData({ ...regData, shopName: e.target.value })}
                  />
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label">Địa chỉ kho hàng lấy hàng SPX</label>
                  <input
                    type="text"
                    className="shopee-form-input"
                    placeholder="Số nhà, Đường, Quận/Huyện, Tỉnh/TP"
                    value={regData.shopAddress}
                    onChange={(e) => setRegData({ ...regData, shopAddress: e.target.value })}
                  />
                </div>
              </>
            )}

            <div className="shopee-form-group">
              <label className="shopee-form-label">Mật khẩu *</label>
              <div className="shopee-form-input-wrap">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="shopee-form-input"
                  placeholder="Tối thiểu 6 ký tự"
                  value={regData.password}
                  onChange={(e) => setRegData({ ...regData, password: e.target.value })}
                />
                <button
                  type="button"
                  className="shopee-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? '🙈' : '👁️'}
                </button>
              </div>

              {/* Password strength meter */}
              {regData.password && (
                <div className="shopee-pwd-meter">
                  <div className="shopee-pwd-meter-bars">
                    <div className={`shopee-pwd-meter-segment ${pwdStrength.score >= 1 ? pwdStrength.colorClass : ''}`} />
                    <div className={`shopee-pwd-meter-segment ${pwdStrength.score >= 2 ? pwdStrength.colorClass : ''}`} />
                    <div className={`shopee-pwd-meter-segment ${pwdStrength.score >= 3 ? pwdStrength.colorClass : ''}`} />
                  </div>
                  <div className="shopee-pwd-meter-label">
                    <span>Độ bảo mật: <strong>{pwdStrength.text}</strong></span>
                    <span>Tối thiểu 6 ký tự</span>
                  </div>
                </div>
              )}
            </div>

            <div className="shopee-form-group">
              <label className="shopee-form-label">Xác nhận mật khẩu *</label>
              <input
                type={showPassword ? 'text' : 'password'}
                className="shopee-form-input"
                placeholder="Nhập lại mật khẩu"
                value={regData.confirmPassword}
                onChange={(e) => setRegData({ ...regData, confirmPassword: e.target.value })}
              />
            </div>

            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary)', lineHeight: '1.5', margin: '0 0 16px' }}>
              Bằng việc đăng ký, bạn đồng ý với <strong>Điều khoản dịch vụ</strong> và <strong>Chính sách bảo mật</strong> của Fullstack E-Commerce.
            </p>

            <button type="submit" className="shopee-auth-submit-btn" disabled={loading}>
              {loading
                ? 'Đang tạo tài khoản...'
                : activeRole === 'seller'
                ? 'Đăng Ký Mở Gian Hàng Ngay'
                : 'Đăng Ký Tài Khoản'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
