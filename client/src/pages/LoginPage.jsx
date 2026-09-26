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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectAfterLogin = (role) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'seller') navigate('/seller/dashboard');
    else navigate(location.state?.from || '/');
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
      setError(err.message || t('auth_error_failed', 'Đăng nhập không thành công'));
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleKey) => {
    const user = loginAsDemo(roleKey);
    if (user) {
      showToast(t('auth_demo_success', `Đăng nhập nhanh thành công với quyền ${user.role}!`), 'info');
      redirectAfterLogin(user.role);
    }
  };

  return (
    <div className="shopee-auth-wrapper">
      <div className="shopee-auth-card">
        <div className="shopee-auth-header">
          <div className="shopee-auth-brand-badge">
            <span>🛡️</span>
            <span>SECURE ACCESS PORTAL</span>
          </div>
          <h2 className="shopee-auth-title">{t('login_title', 'Đăng Nhập')} Fullstack E-Commerce</h2>
          <p className="shopee-auth-subtitle">{t('login_subtitle', 'Chọn đúng phân hệ và vai trò truy cập của bạn')}</p>
        </div>

        {/* Tab chuyển đổi 3 vai trò */}
        <div className="shopee-role-tabs">
          <button
            type="button"
            className={`shopee-role-tab ${activeRole === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveRole('customer')}
          >
            <span>🛒</span>
            <span>{t('role_customer', 'Người Mua')}</span>
          </button>
          <button
            type="button"
            className={`shopee-role-tab ${activeRole === 'seller' ? 'active' : ''}`}
            onClick={() => setActiveRole('seller')}
          >
            <span>🏪</span>
            <span>{t('role_seller', 'Kênh Shop')}</span>
          </button>
          <button
            type="button"
            className={`shopee-role-tab ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin')}
          >
            <span>🛡️</span>
            <span>{t('role_admin', 'Quản Trị')}</span>
          </button>
        </div>

        {/* Nút đăng nhập nhanh bằng tài khoản mẫu */}
        <div className="shopee-demo-section">
          <div className="shopee-demo-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>{t('demo_quick_access', 'Trải nghiệm nhanh 1-Click:')}</span>
          </div>
          <div className="shopee-demo-buttons">
            {activeRole === 'customer' && (
              <button
                type="button"
                className="shopee-demo-btn"
                onClick={() => handleQuickLogin('customer')}
              >
                <strong>Nguyễn Văn Khách (Customer)</strong>
                <span>khachhang@shopee.vn</span>
              </button>
            )}

            {activeRole === 'seller' && (
              <>
                <button
                  type="button"
                  className="shopee-demo-btn"
                  onClick={() => handleQuickLogin('seller_fashion')}
                >
                  <strong>Thời Trang GenZ Official (Shop A)</strong>
                  <span>shop.genz@shopee.vn</span>
                </button>
                <button
                  type="button"
                  className="shopee-demo-btn"
                  onClick={() => handleQuickLogin('seller_tech')}
                >
                  <strong>TechWorld Store (Shop B)</strong>
                  <span>shop.tech@shopee.vn</span>
                </button>
              </>
            )}

            {activeRole === 'admin' && (
              <button
                type="button"
                className="shopee-demo-btn"
                onClick={() => handleQuickLogin('admin')}
              >
                <strong>Tổng Quản Trị Viên Toàn Sàn (Super Admin)</strong>
                <span>admin@shopee.vn</span>
              </button>
            )}
          </div>
        </div>

        {/* Form đăng nhập thông thường */}
        <form onSubmit={handleSubmit}>
          {error && <div className="shopee-form-error-msg">{error}</div>}

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="shopee-form-input"
              placeholder={activeRole === 'customer' ? 'khachhang@shopee.vn' : activeRole === 'seller' ? 'shop.genz@shopee.vn' : 'admin@shopee.vn'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="password">{t('password', 'Mật khẩu')}</label>
            <div className="shopee-form-input-wrap">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="shopee-form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                className="shopee-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Hiện mật khẩu"
              >
                {showPassword ? "🙈" : "👁️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="shopee-auth-submit-btn"
            disabled={loading}
          >
            {loading ? t('authenticating', 'Đang xác thực...') : `${t('login', 'Đăng Nhập')} (${activeRole === 'customer' ? t('role_customer', 'Người Mua') : activeRole === 'seller' ? t('role_seller', 'Chủ Shop') : t('role_admin', 'Admin')})`}
          </button>
        </form>

        <div className="shopee-auth-footer">
          {t('no_account_yet', 'Chưa có tài khoản?')}
          <Link to="/register">{t('register_now', 'Đăng ký ngay')}</Link>
        </div>
      </div>
    </div>
  );
}
