import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemo } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [activeRole, setActiveRole] = useState('customer'); // 'customer' | 'seller' | 'admin'
  const [authMethod, setAuthMethod] = useState('password'); // 'password' | 'qr'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectAfterLogin = (role) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'seller') navigate('/seller/dashboard');
    else navigate(location.state?.from || '/');
  };

  const handleQuickLogin = async (roleKey) => {
    setLoading(true);
    setError('');
    try {
      const u = await loginAsDemo(roleKey);
      if (u) {
        showToast(
          t('auth_demo_success', `Đăng nhập thành công với vai trò ${u.role === 'admin' ? 'Quản Trị Viên' : u.role === 'seller' ? 'Chủ Shop' : 'Khách Mua Hàng'}!`),
          'success'
        );
        redirectAfterLogin(u.role);
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập demo thất bại');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError(t('auth_error_required', 'Vui lòng nhập đầy đủ email và mật khẩu'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password, activeRole);
      if (res.success) {
        showToast(t('auth_login_success', 'Đăng nhập thành công! Chào mừng bạn quay lại.'), 'success');
        redirectAfterLogin(res.user.role);
      }
    } catch (err) {
      setError(err.message || t('auth_error_failed', 'Đăng nhập không thành công. Vui lòng kiểm tra lại thông tin.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shopee-auth-page-wrapper">
      <div className="shopee-auth-split-container">
        {/* Left Hero Branding Column */}
        <div className="shopee-auth-hero-col">
          <div className="shopee-auth-hero-brand">
            <div className="shopee-auth-hero-badge">
              <span>🛡️</span>
              <span>ENTERPRISE E-COMMERCE PLATFORM</span>
            </div>
            <h1 className="shopee-auth-hero-title">
              Trải nghiệm mua sắm & kinh doanh <span>chuẩn Quốc Tế</span>
            </h1>
            <p className="shopee-auth-hero-desc">
              Hệ sinh thái thương mại điện tử đồng bộ đa phân hệ, tối ưu tốc độ và an toàn giao dịch hàng đầu.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="shopee-auth-hero-features">
            <div className="shopee-auth-hero-feat-item">
              <div className="shopee-auth-hero-feat-icon">⚡</div>
              <div className="shopee-auth-hero-feat-text">
                <strong>Giao siêu tốc 2H & Hỏa tốc</strong>
                <span>Nhận hàng tận tay cùng bảo hiểm toàn diện đơn hàng</span>
              </div>
            </div>

            <div className="shopee-auth-hero-feat-item">
              <div className="shopee-auth-hero-feat-icon">💎</div>
              <div className="shopee-auth-hero-feat-text">
                <strong>100% Chính Hãng Cam Kết</strong>
                <span>Hoàn tiền 200% nếu phát hiện hàng không chuẩn</span>
              </div>
            </div>

            <div className="shopee-auth-hero-feat-item">
              <div className="shopee-auth-hero-feat-icon">🔄</div>
              <div className="shopee-auth-hero-feat-text">
                <strong>Đổi trả 30 ngày tiện lợi</strong>
                <span>Miễn phí lấy hàng tận nhà, hoàn tiền tức thì qua Ví</span>
              </div>
            </div>

            <div className="shopee-auth-hero-feat-item">
              <div className="shopee-auth-hero-feat-icon">🎁</div>
              <div className="shopee-auth-hero-feat-text">
                <strong>Voucher & Ví Xu thưởng</strong>
                <span>Tích luỹ xu hoàn tiền không giới hạn mỗi lần chốt đơn</span>
              </div>
            </div>
          </div>

          {/* Hero Statistics */}
          <div className="shopee-auth-hero-stats">
            <div className="shopee-auth-hero-stat-card">
              <strong>50.000+</strong>
              <span>Khách hàng</span>
            </div>
            <div className="shopee-auth-hero-stat-card">
              <strong>1.200+</strong>
              <span>Chủ gian hàng</span>
            </div>
            <div className="shopee-auth-hero-stat-card">
              <strong>99.9%</strong>
              <span>Hài lòng</span>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="shopee-auth-form-col">
          <div className="shopee-auth-header" style={{ marginBottom: '16px' }}>
            <div className="shopee-auth-brand-badge">
              <span>🔐</span>
              <span>CỔNG TRUY CẬP BẢO MẬT SSL 256-BIT</span>
            </div>
            <h2 className="shopee-auth-title" style={{ fontSize: '24px' }}>
              {t('login_title', 'Đăng Nhập')} Fullstack E-Commerce
            </h2>
            <p className="shopee-auth-subtitle">
              {t('login_subtitle', 'Chọn phân hệ và phương thức xác thực của bạn')}
            </p>
          </div>

          {/* Role Picker (3 roles) */}
          <div className="shopee-role-picker">
            <button
              type="button"
              className={`shopee-role-card ${activeRole === 'customer' ? 'active' : ''}`}
              onClick={() => setActiveRole('customer')}
            >
              <span className="role-icon">🛒</span>
              <span className="role-name">{t('role_customer', 'Người Mua')}</span>
              <span className="role-desc">Mua sắm & Săn Sale</span>
            </button>

            <button
              type="button"
              className={`shopee-role-card ${activeRole === 'seller' ? 'active' : ''}`}
              onClick={() => setActiveRole('seller')}
            >
              <span className="role-icon">🏪</span>
              <span className="role-name">{t('role_seller', 'Kênh Shop')}</span>
              <span className="role-desc">Quản lý gian hàng</span>
            </button>

            <button
              type="button"
              className={`shopee-role-card ${activeRole === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveRole('admin')}
            >
              <span className="role-icon">🛡️</span>
              <span className="role-name">{t('role_admin', 'Quản Trị')}</span>
              <span className="role-desc">Toàn quyền hệ thống</span>
            </button>
          </div>

          {/* Auth Method Switcher: Password vs QR Code */}
          <div className="shopee-auth-method-switcher">
            <button
              type="button"
              className={`shopee-auth-method-tab ${authMethod === 'password' ? 'active' : ''}`}
              onClick={() => setAuthMethod('password')}
            >
              <span>🔑</span>
              <span>Mật khẩu & Email</span>
            </button>
            <button
              type="button"
              className={`shopee-auth-method-tab ${authMethod === 'qr' ? 'active' : ''}`}
              onClick={() => setAuthMethod('qr')}
            >
              <span>📱</span>
              <span>Quét mã QR</span>
            </button>
          </div>

          {/* QR Method */}
          {authMethod === 'qr' ? (
            <div className="shopee-qr-container">
              <div className="shopee-qr-box">
                <div className="shopee-qr-laser"></div>
                <svg width="150" height="150" viewBox="0 0 100 100" fill="currentColor">
                  {/* Outer corner 1 */}
                  <rect x="10" y="10" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="16" y="16" width="14" height="14" rx="2" fill="currentColor" />
                  {/* Outer corner 2 */}
                  <rect x="64" y="10" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="70" y="16" width="14" height="14" rx="2" fill="currentColor" />
                  {/* Outer corner 3 */}
                  <rect x="10" y="64" width="26" height="26" rx="4" fill="none" stroke="currentColor" strokeWidth="4" />
                  <rect x="16" y="70" width="14" height="14" rx="2" fill="currentColor" />
                  {/* Data dots */}
                  <rect x="44" y="12" width="6" height="6" rx="1" />
                  <rect x="52" y="12" width="6" height="6" rx="1" />
                  <rect x="44" y="24" width="6" height="6" rx="1" />
                  <rect x="12" y="44" width="6" height="6" rx="1" />
                  <rect x="24" y="44" width="6" height="6" rx="1" />
                  <rect x="44" y="44" width="12" height="12" rx="2" fill="#3b82f6" />
                  <rect x="64" y="44" width="6" height="6" rx="1" />
                  <rect x="76" y="44" width="6" height="6" rx="1" />
                  <rect x="84" y="52" width="6" height="6" rx="1" />
                  <rect x="64" y="64" width="8" height="8" rx="1" />
                  <rect x="80" y="72" width="8" height="8" rx="1" />
                  <rect x="44" y="64" width="6" height="6" rx="1" />
                  <rect x="44" y="80" width="6" height="6" rx="1" />
                </svg>
              </div>
              <div className="shopee-qr-instruct">
                <strong>Mở ứng dụng Shopee trên di động</strong>
                <span>Chọn biểu tượng Quét mã QR trên thanh tìm kiếm để đăng nhập tức thì</span>
              </div>
            </div>
          ) : (
            <>
              {/* 1-Click Demo Logins */}
              <div className="shopee-demo-section" style={{ marginBottom: '16px' }}>
                <div className="shopee-demo-title">
                  <span>⚡</span>
                  <span>{t('demo_quick_access', 'Chọn nhanh tài khoản trải nghiệm:')}</span>
                </div>
                <div className="shopee-demo-buttons">
                  {activeRole === 'customer' && (
                    <button
                      type="button"
                      className="shopee-demo-btn"
                      onClick={() => handleQuickLogin('customer')}
                      disabled={loading}
                    >
                      <strong>👤 Nguyễn Văn Khách (Customer)</strong>
                      <span>khachhang@shopee.vn</span>
                    </button>
                  )}
                  {activeRole === 'seller' && (
                    <>
                      <button
                        type="button"
                        className="shopee-demo-btn"
                        onClick={() => handleQuickLogin('seller_fashion')}
                        disabled={loading}
                      >
                        <strong>🏪 Thời Trang GenZ Official (Shop A)</strong>
                        <span>shop.genz@shopee.vn</span>
                      </button>
                      <button
                        type="button"
                        className="shopee-demo-btn"
                        onClick={() => handleQuickLogin('seller_tech')}
                        disabled={loading}
                      >
                        <strong>💻 TechWorld Store (Shop B)</strong>
                        <span>shop.tech@shopee.vn</span>
                      </button>
                    </>
                  )}
                  {activeRole === 'admin' && (
                    <button
                      type="button"
                      className="shopee-demo-btn"
                      onClick={() => handleQuickLogin('admin')}
                      disabled={loading}
                    >
                      <strong>🛡️ Tổng Quản Trị Viên Sàn (Super Admin)</strong>
                      <span>admin@shopee.vn</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Normal Login Form */}
              <form onSubmit={handleSubmit}>
                {error && <div className="shopee-form-error-msg">{error}</div>}

                <div className="shopee-form-group">
                  <label className="shopee-form-label" htmlFor="page-email">Email đăng nhập</label>
                  <div className="shopee-form-input-wrap">
                    <span className="shopee-input-lead-icon">✉️</span>
                    <input
                      id="page-email"
                      type="email"
                      className="shopee-form-input"
                      placeholder={activeRole === 'customer' ? 'khachhang@shopee.vn' : activeRole === 'seller' ? 'shop.genz@shopee.vn' : 'admin@shopee.vn'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label" htmlFor="page-password">{t('password', 'Mật khẩu')}</label>
                  <div className="shopee-form-input-wrap">
                    <span className="shopee-input-lead-icon">🔒</span>
                    <input
                      id="page-password"
                      type={showPassword ? 'text' : 'password'}
                      className="shopee-form-input"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      className="shopee-password-toggle"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Hiện mật khẩu"
                    >
                      {showPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', fontSize: '12.5px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: 'var(--primary-color, #3b82f6)' }}
                    />
                    <span>{t('remember_me', 'Ghi nhớ đăng nhập')}</span>
                  </label>
                  <span
                    onClick={() => showToast('Vui lòng liên hệ CSKH qua Live Chat hoặc Hotline 1900 6868 để đặt lại mật khẩu!', 'info')}
                    style={{ color: '#3b82f6', cursor: 'pointer', fontWeight: 600 }}
                  >
                    {t('forgot_password', 'Quên mật khẩu?')}
                  </span>
                </div>

                <button
                  type="submit"
                  className="shopee-auth-submit-btn"
                  disabled={loading}
                >
                  {loading ? t('authenticating', 'Đang xác thực...') : `${t('login', 'Đăng Nhập')} (${activeRole === 'customer' ? t('role_customer', 'Người Mua') : activeRole === 'seller' ? t('role_seller', 'Chủ Shop') : t('role_admin', 'Admin')})`}
                </button>
              </form>

              {/* Social Login Buttons */}
              <div className="shopee-social-divider">
                <span>HOẶC TIẾP TỤC VỚI</span>
              </div>
              <div className="shopee-social-buttons">
                <button
                  type="button"
                  className="shopee-social-btn"
                  onClick={() => handleQuickLogin('customer')}
                  title="Đăng nhập với Google"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Google</span>
                </button>

                <button
                  type="button"
                  className="shopee-social-btn"
                  onClick={() => handleQuickLogin('seller_fashion')}
                  title="Đăng nhập với Facebook"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>

                <button
                  type="button"
                  className="shopee-social-btn"
                  onClick={() => handleQuickLogin('admin')}
                  title="Đăng nhập với Apple ID"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.75 1.04-1.8 1.01-2.84-.9.04-1.99.6-2.63 1.35-.57.65-1.07 1.72-1.03 2.74 1 .08 2.03-.5 2.65-1.25z"/>
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
            </>
          )}

          <div className="shopee-auth-footer" style={{ marginTop: '20px' }}>
            {t('no_account_yet', 'Chưa có tài khoản?')}
            <Link to="/register">{t('register_now', 'Đăng ký ngay')}</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
