import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [role, setRole] = useState('customer'); // 'customer' | 'seller'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    shopName: '',
    shopAddress: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      setError(t('auth_error_required_fields', 'Vui lòng điền đầy đủ các trường bắt buộc'));
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth_error_password_match', 'Mật khẩu xác nhận không khớp'));
      return;
    }
    if (role === 'seller' && !formData.shopName) {
      setError(t('auth_error_shop_name', 'Vui lòng nhập tên Cửa Hàng / Shop của bạn'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await register({
        ...formData,
        role
      });
      if (res.success) {
        showToast(
          role === 'seller'
            ? t('auth_register_seller_success', 'Chào mừng chủ shop mới! Gian hàng của bạn đã sẵn sàng.')
            : t('auth_register_customer_success', 'Đăng ký thành công! Bắt đầu mua sắm ngay.'),
          'success'
        );
        if (role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || t('auth_error_register_failed', 'Đăng ký thất bại'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shopee-auth-wrapper">
      <div className="shopee-auth-card">
        <div className="shopee-auth-header">
          <div className="shopee-auth-brand-badge">
            <span>✨</span>
            <span>JOIN FULLSTACK E-COMMERCE ECOSYSTEM</span>
          </div>
          <h2 className="shopee-auth-title">{t('register_title', 'Đăng Ký Tài Khoản')}</h2>
          <p className="shopee-auth-subtitle">{t('register_subtitle', 'Tham gia hệ sinh thái thương mại điện tử thông minh')}</p>
        </div>

        {/* Tab chuyển đổi mục đích đăng ký */}
        <div className="shopee-role-tabs" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button
            type="button"
            className={`shopee-role-tab ${role === 'customer' ? 'active' : ''}`}
            onClick={() => setRole('customer')}
          >
            <span>🛒</span>
            <span>{t('register_role_customer', 'Mua Hàng')}</span>
          </button>
          <button
            type="button"
            className={`shopee-role-tab ${role === 'seller' ? 'active' : ''}`}
            onClick={() => setRole('seller')}
          >
            <span>🏪</span>
            <span>{t('register_role_seller', 'Mở Shop Bán Hàng')}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="shopee-form-error-msg">{error}</div>}

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="fullName">{t('full_name', 'Họ và tên')} *</label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className="shopee-form-input"
              placeholder="Nguyễn Văn A"
              value={formData.fullName}
              onChange={handleChange}
            />
          </div>

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="email">Email *</label>
            <input
              id="email"
              name="email"
              type="email"
              className="shopee-form-input"
              placeholder="youremail@example.com"
              value={formData.email}
              onChange={handleChange}
            />
          </div>

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="phone">{t('phone', 'Số điện thoại')}</label>
            <input
              id="phone"
              name="phone"
              type="tel"
              className="shopee-form-input"
              placeholder="0912345678"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          {/* Trường mở rộng nếu là Người Bán Hàng */}
          {role === 'seller' && (
            <>
              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="shopName">{t('shop_name_label', 'Tên Cửa Hàng / Shop')} *</label>
                <input
                  id="shopName"
                  name="shopName"
                  type="text"
                  className="shopee-form-input"
                  placeholder="Ví dụ: Thời Trang Trẻ Official"
                  value={formData.shopName}
                  onChange={handleChange}
                />
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="shopAddress">{t('warehouse_address', 'Địa chỉ kho hàng')}</label>
                <input
                  id="shopAddress"
                  name="shopAddress"
                  type="text"
                  className="shopee-form-input"
                  placeholder="Địa chỉ lấy hàng của shipper..."
                  value={formData.shopAddress}
                  onChange={handleChange}
                />
              </div>
            </>
          )}

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="password">{t('password', 'Mật khẩu')} *</label>
            <div className="shopee-form-input-wrap">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                className="shopee-form-input"
                placeholder={t('password_min_chars', 'Tối thiểu 6 ký tự')}
                value={formData.password}
                onChange={handleChange}
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

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="confirmPassword">{t('confirm_password', 'Xác nhận mật khẩu')} *</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              className="shopee-form-input"
              placeholder={t('confirm_password_placeholder', 'Nhập lại mật khẩu')}
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="shopee-auth-submit-btn"
            disabled={loading}
          >
            {loading 
              ? t('creating_account', 'Đang tạo tài khoản...') 
              : role === 'seller' 
                ? t('create_seller_account', 'Tạo Tài Khoản & Mở Gian Hàng') 
                : t('create_customer_account', 'Đăng Ký Tài Khoản Mua Sắm')}
          </button>
        </form>

        <div className="shopee-auth-footer">
          {t('already_have_account', 'Đã có tài khoản?')}
          <Link to="/login">{t('login_now', 'Đăng nhập ngay')}</Link>
        </div>
      </div>
    </div>
  );
}
