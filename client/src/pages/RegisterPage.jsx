import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { SecuritySliderCaptcha, OtpVerificationModal, LegalModal } from '../components';
import '../styles/auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [role, setRole] = useState('customer'); // 'customer' | 'seller'
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState('terms');

  const quickEmailDomains = ['@gmail.com', '@student.hcmute.edu.vn', '@hcmute.edu.vn', '@outlook.com'];

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    if (error) setError('');
  };

  const handleApplyEmailDomain = (domain) => {
    let raw = (formData.email || '').trim();
    if (raw.includes('@')) {
      raw = raw.split('@')[0];
    }
    setFormData(prev => ({ ...prev, email: `${raw}${domain}` }));
    if (error) setError('');
  };

  // Password rules checklist
  const passwordChecks = {
    length: (formData.password || '').length >= 8,
    hasUpper: /[A-Z]/.test(formData.password || ''),
    hasNumber: /[0-9]/.test(formData.password || ''),
    hasSpecial: /[^A-Za-z0-9]/.test(formData.password || '')
  };

  const isAllPasswordCriteriaMet = 
    passwordChecks.length && 
    passwordChecks.hasUpper && 
    passwordChecks.hasNumber && 
    passwordChecks.hasSpecial;

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
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setError(t('auth_error_required_fields', 'Vui lòng điền đầy đủ các trường bắt buộc (*)'));
      return;
    }
    // Ràng buộc nghiêm ngặt: Phải đạt đủ cả 4 tiêu chuẩn (4 tick xanh)
    if (!isAllPasswordCriteriaMet) {
      setError('Mật khẩu chưa đạt tiêu chuẩn! Cần thỏa mãn đầy đủ cả 4 tiêu chí bảo mật (Tối thiểu 8 ký tự, có chữ in hoa, có chữ số và ký tự đặc biệt).');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(t('auth_error_password_match', 'Mật khẩu xác nhận không khớp với mật khẩu đã nhập'));
      return;
    }
    if (formData.phone && !/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phone.replace(/\s+/g, ''))) {
      setError('Số điện thoại không đúng định dạng di động Việt Nam (gồm 10 số, ví dụ 0362 217 721).');
      return;
    }
    if (role === 'seller' && !formData.shopName.trim()) {
      setError(t('auth_error_shop_name', 'Vui lòng nhập tên Cửa Hàng / Shop của bạn'));
      return;
    }
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản dịch vụ và Chính sách bảo mật');
      return;
    }
    if (!sliderVerified) {
      setError('Vui lòng kéo thanh trượt xác minh bảo mật bên dưới trước khi tiếp tục.');
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
                {/* Domain Quick-fill Tags */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '6px' }}>
                  {quickEmailDomains.map((dom) => (
                    <button
                      key={dom}
                      type="button"
                      onClick={() => handleApplyEmailDomain(dom)}
                      style={{
                        background: '#f1f5f9',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        padding: '2px 6px',
                        fontSize: '10.5px',
                        color: '#2563eb',
                        cursor: 'pointer',
                        fontWeight: 600,
                      }}
                      title={`Nhấp để chọn đuôi ${dom}`}
                    >
                      {dom}
                    </button>
                  ))}
                </div>
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="reg-phone">
                  {t('phone', 'Số điện thoại')}
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, marginLeft: '4px' }}>
                    (10 số)
                  </span>
                </label>
                <div className="shopee-form-input-wrap">
                  <span className="shopee-input-lead-icon">📞</span>
                  <input
                    id="reg-phone"
                    name="phone"
                    type="tel"
                    className="shopee-form-input"
                    placeholder="0362 217 721"
                    value={formData.phone}
                    onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
                {formData.phone && !/(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phone.replace(/\s+/g, '')) && (
                  <span style={{ fontSize: '10.5px', color: '#d97706', marginTop: '4px', display: 'block' }}>
                    ⚠️ Cần đúng định dạng 10 chữ số (VD: 0362 217 721)
                  </span>
                )}
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
                    placeholder="Nhập mật khẩu an toàn"
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
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="shopee-form-input"
                    placeholder={t('confirm_password_placeholder', 'Nhập lại mật khẩu')}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    className="shopee-password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label="Hiện xác nhận mật khẩu"
                  >
                    {showConfirmPassword ? '🙈' : '👁️'}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <div style={{ marginTop: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {formData.password === formData.confirmPassword ? (
                      <span style={{ color: '#10b981', fontWeight: 600 }}>✓ Mật khẩu xác nhận hoàn toàn trùng khớp</span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: 600 }}>✕ Mật khẩu xác nhận chưa khớp</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Password strength meter & live security checklist */}
            {formData.password && (
              <div style={{ marginBottom: '14px', background: '#f8fafc', padding: '12px 14px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div className="shopee-pwd-strength" style={{ marginBottom: '10px', marginTop: 0 }}>
                  <div className="shopee-pwd-bars">
                    <div className={`shopee-pwd-bar ${pwdStrength.score >= 1 ? pwdStrength.colorClass : ''}`} />
                    <div className={`shopee-pwd-bar ${pwdStrength.score >= 2 ? pwdStrength.colorClass : ''}`} />
                    <div className={`shopee-pwd-bar ${pwdStrength.score >= 3 ? pwdStrength.colorClass : ''}`} />
                  </div>
                  <span className="shopee-pwd-text">
                    Độ mạnh: <strong>{pwdStrength.text}</strong>
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', fontSize: '11.5px' }}>
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
                isVerified={sliderVerified}
                onVerified={() => {
                  setSliderVerified(true);
                  setError('');
                }}
                onSuccess={() => {
                  setSliderVerified(true);
                  setError('');
                }}
                onReset={() => {
                  setSliderVerified(false);
                }}
              />
            </div>

            <div style={{ marginBottom: '18px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                  style={{ accentColor: 'var(--primary-color, #3b82f6)', marginTop: '2px' }}
                />
                <span>
                  Tôi đồng ý với{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLegalInitialTab('terms');
                      setShowLegalModal(true);
                    }}
                    style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Điều khoản dịch vụ
                  </span>
                  {' '}&{' '}
                  <span
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setLegalInitialTab('privacy');
                      setShowLegalModal(true);
                    }}
                    style={{ color: '#2563eb', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' }}
                  >
                    Chính sách bảo mật
                  </span>
                  {' '}của Fullstack E-Commerce.
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

          {/* Security Trust Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            fontSize: '11px',
            color: '#64748b',
            marginTop: '16px',
            textAlign: 'center',
            padding: '8px 12px',
            background: '#f8fafc',
            borderRadius: '8px',
            border: '1px solid #e2e8f0',
          }}>
            <span>🔒 SSL 256-Bit</span>
            <span>•</span>
            <span>🛡️ Bảo mật 2FA OTP</span>
            <span>•</span>
            <span>✨ 100% Bảo vệ tài khoản</span>
          </div>

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

      {/* Terms of Service & Privacy Policy Modal */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialTab={legalInitialTab}
      />
    </div>
  );
}
