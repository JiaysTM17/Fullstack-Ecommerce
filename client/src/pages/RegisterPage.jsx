import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { SecuritySliderCaptcha, OtpVerificationModal } from '../components';
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
    shopAddress: '',
    shopCategory: 'Thời trang'
  });
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Security & 2FA states
  const [sliderVerified, setSliderVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Password rules checklist
  const passwordChecks = {
    length: (formData.password || '').length >= 8,
    hasUpper: /[A-Z]/.test(formData.password || ''),
    hasNumber: /[0-9]/.test(formData.password || ''),
    hasSpecial: /[^A-Za-z0-9]/.test(formData.password || '')
  };

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

  const pwdStrength = getPasswordStrength(formData.password);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.password) {
      setError(t('auth_error_required_fields', 'Vui lòng điền đầy đủ các trường bắt buộc'));
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có tối thiểu 6 ký tự');
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
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      return;
    }
    if (!sliderVerified) {
      setError('Vui lòng kéo thanh trượt xác minh bảo mật bên dưới trước khi tiếp tục');
      return;
    }

    setError('');
    setShowOtpModal(true);
  };

  const handleOtpVerified = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await register({
        ...formData,
        role
      });
      if (res && res.success) {
        // Tặng thưởng onboarding: +1.000 Xu bonus & Voucher tân thủ 50K
        if (res.user?.id) {
          const coinKey = `mini_shopee_user_coins_customer_${res.user.id}`;
          const current = localStorage.getItem(coinKey);
          const newAmount = (current !== null ? Number(current) : 25000) + 1000;
          localStorage.setItem(coinKey, String(newAmount));
        }

        showToast(
          role === 'seller'
            ? t('auth_register_seller_success', 'Chào mừng chủ shop mới! Gian hàng của bạn đã sẵn sàng kinh doanh cùng mã định danh chính thức.')
            : 'Đăng ký bảo mật thành công! Bạn nhận được 1.000 Xu tích lũy và Voucher tân thủ 50.000đ.',
          'success'
        );
        setShowOtpModal(false);
        if (role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || t('auth_error_register_failed', 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'));
      setShowOtpModal(false);
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
              <span>🎁</span>
              <span>GIA NHẬP CỘNG ĐỒNG HÔM NAY</span>
            </div>
            <h1 className="shopee-auth-hero-title">
              Mở khóa đặc quyền <span>hấp dẫn hàng đầu</span>
            </h1>
            <p className="shopee-auth-hero-desc">
              Tạo tài khoản chỉ trong 30 giây để tận hưởng trọn vẹn ưu đãi độc quyền dành cho khách hàng và nhà bán hàng.
            </p>
          </div>

          {/* Perks list */}
          <div className="shopee-auth-hero-features">
            <div className="shopee-auth-hero-feat-item">
              <div className="shopee-auth-hero-feat-icon">🎉</div>
              <div className="shopee-auth-hero-feat-text">
                <strong>Gói voucher tân thủ 500.000đ</strong>
                <span>Tặng ngay mã giảm 50K cho đơn hàng đầu tiên</span>
              </div>
            </div>

            <div className="shopee-auth-hero-feat-item">
              <div className="shopee-auth-hero-feat-icon">🪙</div>
              <div className="shopee-auth-hero-feat-text">
                <strong>Tặng 1.000 Xu tích lũy khởi điểm</strong>
                <span>Dùng trừ tiền trực tiếp vào hóa đơn thanh toán</span>
              </div>
            </div>

            <div className="shopee-auth-hero-feat-item">
              <div className="shopee-auth-hero-feat-icon">🏪</div>
              <div className="shopee-auth-hero-feat-text">
                <strong>Dành cho Người Bán: 0% Phí sàn tháng đầu</strong>
                <span>Tiếp cận 50.000+ người mua tiềm năng tức thì</span>
              </div>
            </div>

            <div className="shopee-auth-hero-feat-item">
              <div className="shopee-auth-hero-feat-icon">🚚</div>
              <div className="shopee-auth-hero-feat-text">
                <strong>Freeship Xtra Không Giới Hạn</strong>
                <span>Miễn phí vận chuyển toàn quốc cho mọi đơn hàng</span>
              </div>
            </div>
          </div>

          {/* Hero Statistics */}
          <div className="shopee-auth-hero-stats">
            <div className="shopee-auth-hero-stat-card">
              <strong>100%</strong>
              <span>Bảo mật</span>
            </div>
            <div className="shopee-auth-hero-stat-card">
              <strong>30s</strong>
              <span>Đăng ký nhanh</span>
            </div>
            <div className="shopee-auth-hero-stat-card">
              <strong>24/7</strong>
              <span>Hỗ trợ tận tâm</span>
            </div>
          </div>
        </div>

        {/* Right Form Column */}
        <div className="shopee-auth-form-col">
          <div className="shopee-auth-header" style={{ marginBottom: '14px' }}>
            <div className="shopee-auth-brand-badge">
              <span>✨</span>
              <span>TẠO TÀI KHOẢN MỚI</span>
            </div>
            <h2 className="shopee-auth-title" style={{ fontSize: '24px' }}>
              {t('register_title', 'Đăng Ký Tài Khoản')}
            </h2>
            <p className="shopee-auth-subtitle">
              {t('register_subtitle', 'Chọn phân hệ mong muốn để thiết lập quyền truy cập')}
            </p>
          </div>

          {/* Role selector: Khách hàng vs Mở shop */}
          <div className="shopee-role-tabs" style={{ gridTemplateColumns: '1fr 1fr', marginBottom: '16px' }}>
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
              <label className="shopee-form-label" htmlFor="reg-fullName">
                {t('full_name', 'Họ và tên')} *
              </label>
              <div className="shopee-form-input-wrap">
                <span className="shopee-input-lead-icon">👤</span>
                <input
                  id="reg-fullName"
                  name="fullName"
                  type="text"
                  className="shopee-form-input"
                  placeholder="Ví dụ: Nguyễn Văn An"
                  value={formData.fullName}
                  onChange={handleChange}
                  autoComplete="name"
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="reg-email">Email *</label>
                <div className="shopee-form-input-wrap">
                  <span className="shopee-input-lead-icon">✉️</span>
                  <input
                    id="reg-email"
                    name="email"
                    type="email"
                    className="shopee-form-input"
                    placeholder="an.nguyen@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="reg-phone">{t('phone', 'Số điện thoại')}</label>
                <div className="shopee-form-input-wrap">
                  <span className="shopee-input-lead-icon">📞</span>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    className="shopee-form-input"
                    placeholder="0912 345 678"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
              </div>
            </div>

            {/* Mở rộng nếu là Chủ Shop */}
            {role === 'seller' && (
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.28)', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🏪</span>
                  <span>THÔNG TIN THIẾT LẬP GIAN HÀNG BÁN HÀNG</span>
                </div>
                <div className="shopee-form-group" style={{ marginBottom: '10px' }}>
                  <label className="shopee-form-label" htmlFor="reg-shopName">
                    {t('shop_name_label', 'Tên Cửa Hàng / Shop')} *
                  </label>
                  <div className="shopee-form-input-wrap">
                    <span className="shopee-input-lead-icon">🏬</span>
                    <input
                      id="reg-shopName"
                      name="shopName"
                      type="text"
                      className="shopee-form-input"
                      placeholder="Ví dụ: Thời Trang Trẻ Official Store"
                      value={formData.shopName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div className="shopee-form-group" style={{ marginBottom: 0 }}>
                    <label className="shopee-form-label" htmlFor="reg-shopCategory">Ngành hàng chính</label>
                    <select
                      id="reg-shopCategory"
                      name="shopCategory"
                      className="shopee-form-input"
                      value={formData.shopCategory}
                      onChange={handleChange}
                      style={{ height: '42px', cursor: 'pointer', paddingLeft: '14px' }}
                    >
                      <option value="Thời trang">Thời trang & Phụ kiện</option>
                      <option value="Công nghệ">Điện tử & Công nghệ</option>
                      <option value="Gia dụng">Đời sống & Gia dụng</option>
                      <option value="Mỹ phẩm">Sắc đẹp & Sức khỏe</option>
                    </select>
                  </div>
                  <div className="shopee-form-group" style={{ marginBottom: 0 }}>
                    <label className="shopee-form-label" htmlFor="reg-shopAddress">Kho lấy hàng</label>
                    <div className="shopee-form-input-wrap">
                      <span className="shopee-input-lead-icon">📍</span>
                      <input
                        id="reg-shopAddress"
                        name="shopAddress"
                        type="text"
                        className="shopee-form-input"
                        placeholder="Quận/Huyện, Tỉnh/TP"
                        value={formData.shopAddress}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="reg-password">
                  {t('password', 'Mật khẩu')} *
                </label>
                <div className="shopee-form-input-wrap">
                  <span className="shopee-input-lead-icon">🔒</span>
                  <input
                    id="reg-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    className="shopee-form-input"
                    placeholder={t('password_min_chars', 'Tối thiểu 6 ký tự')}
                    value={formData.password}
                    onChange={handleChange}
                    autoComplete="new-password"
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

              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="reg-confirmPassword">
                  {t('confirm_password', 'Xác nhận mật khẩu')} *
                </label>
                <div className="shopee-form-input-wrap">
                  <span className="shopee-input-lead-icon">🛡️</span>
                  <input
                    id="reg-confirmPassword"
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    className="shopee-form-input"
                    placeholder={t('confirm_password_placeholder', 'Nhập lại mật khẩu')}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                </div>
              </div>
            </div>

            {/* Password strength meter & live security checklist */}
            {formData.password && (
              <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '12px 14px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                <div className="shopee-pwd-strength" style={{ marginBottom: '8px', marginTop: 0 }}>
                  <div className="shopee-pwd-bars">
                    <div className={`shopee-pwd-bar ${pwdStrength.score >= 1 ? pwdStrength.colorClass : ''}`} />
                    <div className={`shopee-pwd-bar ${pwdStrength.score >= 2 ? pwdStrength.colorClass : ''}`} />
                    <div className={`shopee-pwd-bar ${pwdStrength.score >= 3 ? pwdStrength.colorClass : ''}`} />
                  </div>
                  <span className="shopee-pwd-text">
                    Độ mạnh: <strong>{pwdStrength.text}</strong>
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11px' }}>
                  <div style={{ color: passwordChecks.length ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontWeight: 800 }}>{passwordChecks.length ? '✓' : '○'}</span> Tối thiểu 8 ký tự
                  </div>
                  <div style={{ color: passwordChecks.hasUpper ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontWeight: 800 }}>{passwordChecks.hasUpper ? '✓' : '○'}</span> Có chữ in hoa (A-Z)
                  </div>
                  <div style={{ color: passwordChecks.hasNumber ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontWeight: 800 }}>{passwordChecks.hasNumber ? '✓' : '○'}</span> Có chữ số (0-9)
                  </div>
                  <div style={{ color: passwordChecks.hasSpecial ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontWeight: 800 }}>{passwordChecks.hasSpecial ? '✓' : '○'}</span> Ký tự đặc biệt (!@#$)
                  </div>
                </div>
              </div>
            )}

            {/* Anti-Bot Security Slider */}
            <div style={{ marginBottom: '14px' }}>
              <SecuritySliderCaptcha
                onVerified={() => {
                  setSliderVerified(true);
                  setError('');
                }}
              />
            </div>

            <div style={{ marginBottom: '18px', fontSize: '12px', color: 'var(--text-secondary)' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ accentColor: 'var(--primary-color, #3b82f6)', marginTop: '2px' }}
                />
                <span>
                  Tôi đồng ý với{' '}
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>Điều khoản dịch vụ</span> &{' '}
                  <span style={{ color: '#3b82f6', fontWeight: 600 }}>Chính sách bảo mật</span> của Shopee Mini Plan.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="shopee-auth-submit-btn"
              disabled={loading}
            >
              {loading 
                ? t('creating_account', 'Đang thiết lập tài khoản...') 
                : role === 'seller' 
                  ? 'Tiếp tục xác thực OTP mở gian hàng' 
                  : 'Tiếp tục xác thực OTP tạo tài khoản'}
            </button>
          </form>

          <div className="shopee-auth-footer" style={{ marginTop: '18px' }}>
            {t('already_have_account', 'Đã có tài khoản?')}
            <Link to="/login">{t('login_now', 'Đăng nhập ngay')}</Link>
          </div>
        </div>
      </div>

      {/* 2-Step Registration OTP Verification Modal */}
      <OtpVerificationModal
        isOpen={showOtpModal}
        email={formData.email}
        onClose={() => setShowOtpModal(false)}
        onVerifySuccess={handleOtpVerified}
      />
    </div>
  );
}
