import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { SecuritySliderCaptcha, ForgotPasswordModal, SocialAuthModal } from '../components';
import {
  ShieldIcon,
  ShieldCheckIcon,
  StoreIcon,
  ShoppingBagIcon,
  LockIcon,
  MailIcon,
  ClockIcon,
  EyeIcon,
  EyeOffIcon,
  BoltIcon,
  StarIcon,
  TagIcon,
  TruckIcon,
  ChatIcon,
  CheckIcon,
  UserIcon,
  QrCodeIcon,
  KeyIcon,
  AlertCircleIcon,
  CartIcon,
  CoinIcon,
  TicketIcon,
} from '../components/OrdersIcons';
import '../styles/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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

  // Email Smart Autocomplete Dropdown State
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const emailInputRef = useRef(null);
  const emailDropdownRef = useRef(null);
  const commonDomains = ['gmail.com', 'student.hcmute.edu.vn', 'hcmute.edu.vn', 'shopee.vn', 'outlook.com'];

  // Social Login SSO Modal State
  const [socialModalConfig, setSocialModalConfig] = useState({ isOpen: false, provider: 'google' });

  // Tự động cuộn lên đầu trang mỗi khi vào trang Đăng Nhập (fix lỗi bị rơi vào giữa trang)
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [location.pathname]);

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
    if (error) setError('');
  };

  // Prefill email if redirected from duplicate registration warning
  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  // Enterprise Security & Rate Limiting States
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [sliderVerified, setSliderVerified] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTimer, setLockoutTimer] = useState(0);
  const [showForgotModal, setShowForgotModal] = useState(false);

  // Lockout countdown timer
  useEffect(() => {
    if (!isLocked || lockoutTimer <= 0) {
      if (isLocked && lockoutTimer <= 0) {
        setIsLocked(false);
        setFailedAttempts(2); // Relax to required slider state
      }
      return;
    }
    const timer = setInterval(() => {
      setLockoutTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isLocked, lockoutTimer]);

  const redirectAfterLogin = (userRole) => {
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else if (userRole === 'seller') {
      if (activeRole === 'customer') {
        // Chủ shop đăng nhập ở tab Khách Hàng -> Đi vào trang mua sắm bình thường
        navigate(location.state?.from || '/');
      } else {
        // Đăng nhập ở tab Kênh Người Bán -> Đi vào Kênh Bán Hàng
        navigate('/seller/dashboard');
      }
    } else {
      // userRole === 'customer'
      if (activeRole === 'seller') {
        // Tài khoản khách hàng đăng nhập ở tab Shop -> Gợi ý mở Shop ngay
        showToast('Tài khoản của bạn chưa kích hoạt Gian Hàng. Đang chuyển hướng để bạn mở Shop ngay!', 'info');
        navigate(`/register?role=seller&email=${encodeURIComponent(email)}`);
      } else {
        navigate(location.state?.from || '/');
      }
    }
  };

  const handleQuickLogin = async (roleKey) => {
    setLoading(true);
    setError('');
    try {
      const u = await loginAsDemo(roleKey);
      if (u) {
        showToast(
          t('auth_demo_success', `Đăng nhập an toàn thành công với vai trò ${u.role === 'admin' ? 'Quản Trị Viên' : u.role === 'seller' ? 'Chủ Shop' : 'Khách Mua Hàng'}!`),
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
    if (isLocked) {
      setError(`Hệ thống đang tạm khóa để bảo vệ an ninh. Vui lòng chờ ${lockoutTimer} giây nữa.`);
      return;
    }
    if (!email || !password) {
      setError(t('auth_error_required', 'Vui lòng nhập đầy đủ email và mật khẩu'));
      return;
    }
    if (failedAttempts >= 3 && !sliderVerified) {
      setError('Vui lòng kéo thanh trượt bảo mật để xác minh chống dò mật khẩu');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await login(email, password, activeRole);
      if (res.success) {
        setFailedAttempts(0);
        // Nếu user chỉ mới là customer mà đăng nhập ở tab seller -> Không báo đăng nhập thành công
        // redirectAfterLogin sẽ hiển thị thông báo chuyển hướng mở Shop một cách rõ ràng và duy nhất
        if (activeRole === 'seller' && res.user.role === 'customer') {
          redirectAfterLogin(res.user.role);
        } else {
          const currentTime = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
          showToast(`Đăng nhập bảo mật thành công! Phiên hoạt động ghi nhận lúc ${currentTime}`, 'success');
          redirectAfterLogin(res.user.role);
        }
      } else {
        const nextAttempts = failedAttempts + 1;
        setFailedAttempts(nextAttempts);
        setSliderVerified(false);

        if (nextAttempts >= 5) {
          setIsLocked(true);
          setLockoutTimer(30);
          setError('Phát hiện 5 lần nhập sai liên tiếp. Để bảo vệ an toàn tài khoản, hệ thống tạm khóa 30 giây.');
        } else if (nextAttempts >= 3) {
          setError('Email hoặc mật khẩu chưa chính xác. Vui lòng kéo thanh trượt bảo mật để tiếp tục thử.');
        } else {
          setError(res.error || t('auth_error_failed', 'Email hoặc mật khẩu không chính xác'));
        }
      }
    } catch (err) {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      setSliderVerified(false);
      if (nextAttempts >= 5) {
        setIsLocked(true);
        setLockoutTimer(30);
        setError('Phát hiện 5 lần nhập sai liên tiếp. Tạm khóa 30 giây để bảo vệ an toàn.');
      } else {
        setError(err.message || t('auth_error_failed', 'Đăng nhập không thành công. Vui lòng kiểm tra lại.'));
      }
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
              <span>{activeRole === 'admin' ? <ShieldIcon size={14} color="#6366f1" /> : activeRole === 'seller' ? <StoreIcon size={14} color="#ea580c" /> : <ShoppingBagIcon size={14} color="#ea580c" />}</span>
              <span>
                {activeRole === 'admin'
                  ? 'QUẢN TRỊ VIÊN HỆ THỐNG'
                  : activeRole === 'seller'
                  ? 'KÊNH NGƯỜI BÁN CHUYÊN NGHIỆP'
                  : 'KHÁCH HÀNG THÂN THIẾT'}
              </span>
            </div>
            <h1 className="shopee-auth-hero-title">
              {activeRole === 'admin' ? (
                <>Trung tâm kiểm soát <span>toàn diện nền tảng</span></>
              ) : activeRole === 'seller' ? (
                <>Quản lý gian hàng <span>chuẩn thương mại</span></>
              ) : (
                <>Trải nghiệm mua sắm <span>tiện lợi & an toàn</span></>
              )}
            </h1>
            <p className="shopee-auth-hero-desc">
              {activeRole === 'admin'
                ? 'Giám sát điều hành hệ sinh thái thương mại điện tử, phân quyền RBAC và an ninh bảo mật cao cấp.'
                : activeRole === 'seller'
                ? 'Tối ưu hóa quy trình bán hàng, xử lý đơn hàng đa kênh và rút tiền về tài khoản tức thì 24/7.'
                : 'Khám phá hàng triệu sản phẩm chính hãng, tận hưởng voucher độc quyền và bảo vệ giao dịch toàn diện.'}
            </p>
          </div>

          {/* Centered Middle Section: Feature highlights + Live Ticker */}
          <div className="shopee-auth-hero-middle">
            <div className="shopee-auth-hero-features">
              {activeRole === 'admin' ? (
                <>
                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><LockIcon size={18} color="#6366f1" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Phân Quyền RBAC Đa Cấp Nghiêm Ngặt</strong>
                      <span>Bảo vệ quyền truy cập và dữ liệu nhạy cảm cấp doanh nghiệp</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><ReceiptIcon size={18} color="#0284c7" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Dashboard Thống Kê Real-Time</strong>
                      <span>Theo dõi biến động dòng tiền, đơn hàng và lượng truy cập</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><BoltIcon size={18} color="#eab308" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Giám Sát Sức Khỏe Toàn Sàn</strong>
                      <span>Tự động phát hiện tấn công DDoS, brute-force & quét bất thường</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><TagIcon size={18} color="#10b981" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Quản Trị Chiến Dịch Flash Sale</strong>
                      <span>Phê duyệt sản phẩm, mã khuyến mại và ban hành chính sách</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><CreditCardIcon size={18} color="#8b5cf6" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Kiểm Soát Đối Soát & Luân Chuyển Dòng Tiền</strong>
                      <span>Minh bạch số dư ví, phí sàn và doanh thu người bán</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><ShieldCheckIcon size={18} color="#16a34a" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Nhật Ký Kiểm Toán Audit Log</strong>
                      <span>Lưu vết mọi hành vi thay đổi dữ liệu đảm bảo tính an toàn</span>
                    </div>
                  </div>
                </>
              ) : activeRole === 'seller' ? (
                <>
                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><TruckIcon size={18} color="#0284c7" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Xử Lý & In Vận Đơn 1-Click</strong>
                      <span>Tự động liên kết SPX Express, GHN, Viettel Post</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><CoinIcon size={18} color="#eab308" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Ví Doanh Thu Shop Rút Tiền 24/7</strong>
                      <span>Tiền về tài khoản ngân hàng tức thì không giới hạn số lần</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><StarIcon size={18} color="#f59e0b" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Phân Tích Dữ Liệu Tăng Trưởng AI</strong>
                      <span>Dự báo nhu cầu tồn kho và cảnh báo sản phẩm bán chạy</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><TicketIcon size={18} color="#ea580c" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Tạo Flash Sale & Voucher Gian Hàng</strong>
                      <span>Tự do thiết kế ưu đãi thu hút thêm hàng ngàn khách mới</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><ChatIcon size={18} color="#2563eb" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Chat CSKH Trực Tuyến Tức Thì</strong>
                      <span>Tương tác nhanh với người mua để nâng cao tỷ lệ chuyển đổi</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><StoreIcon size={18} color="#10b981" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Tối Ưu Hóa Bài Đăng Sản Phẩm</strong>
                      <span>Gợi ý từ khóa SEO giúp sản phẩm lọt top kết quả tìm kiếm</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><BoltIcon size={18} color="#ea580c" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Giao Siêu Tốc 2H & Hỏa Tốc</strong>
                      <span>Nhận hàng tận tay cùng bảo hiểm toàn diện đơn hàng</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><ShieldCheckIcon size={18} color="#16a34a" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>100% Chính Hãng Cam Kết</strong>
                      <span>Hoàn tiền 200% nếu phát hiện sản phẩm giả mạo</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><CheckIcon size={18} color="#059669" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Đổi Trả Dễ Dàng Trong 30 Ngày</strong>
                      <span>Shipper thu hồi tận nơi, hoàn tiền tức thì qua Ví</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><TicketIcon size={18} color="#ea580c" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Voucher & Ví Xu Thưởng</strong>
                      <span>Tích lũy xu hoàn tiền trừ thẳng vào hóa đơn thanh toán</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><TruckIcon size={18} color="#059669" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Freeship Xtra Toàn Quốc</strong>
                      <span>Miễn phí vận chuyển cho hàng triệu sản phẩm mỗi ngày</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><ShieldIcon size={18} color="#6366f1" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Bảo Vệ Người Mua Tuyệt Đối</strong>
                      <span>Tiền chỉ chuyển cho người bán khi bạn xác nhận hài lòng</span>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Live Activity & Security Trust Ticker */}
            <div className="shopee-auth-live-ticker">
              <div className="shopee-auth-live-pulse-dot" />
              <div className="shopee-auth-live-text">
                <span>Hơn <strong>1.480+</strong> người dùng & đối tác đang trực tuyến</span>
                <small style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheckIcon size={12} color="#16a34a" /> Mã hóa dữ liệu SSL 256-Bit • Xác thực an ninh 2 bước (2FA OTP)
                </small>
              </div>
            </div>
          </div>

          {/* Hero Statistics */}
          <div className="shopee-auth-hero-stats">
            {activeRole === 'admin' ? (
              <>
                <div className="shopee-auth-hero-stat-card">
                  <strong>99.99%</strong>
                  <span>Uptime SLA</span>
                </div>
                <div className="shopee-auth-hero-stat-card">
                  <strong>256-Bit</strong>
                  <span>Mã hóa SSL</span>
                </div>
                <div className="shopee-auth-hero-stat-card">
                  <strong>0s</strong>
                  <span>Độ trễ cảnh báo</span>
                </div>
              </>
            ) : activeRole === 'seller' ? (
              <>
                <div className="shopee-auth-hero-stat-card">
                  <strong>0%</strong>
                  <span>Phí mở shop</span>
                </div>
                <div className="shopee-auth-hero-stat-card">
                  <strong>24/7</strong>
                  <span>Rút tiền tức thì</span>
                </div>
                <div className="shopee-auth-hero-stat-card">
                  <strong>1-Click</strong>
                  <span>In vận đơn</span>
                </div>
              </>
            ) : (
              <>
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
              </>
            )}
          </div>
        </div>

        {/* Right Form Column */}
        <div className="shopee-auth-form-col">
          <div className="shopee-auth-header" style={{ marginBottom: '16px' }}>
            <div className="shopee-auth-brand-badge">
              <ShieldCheckIcon size={14} color="#2563eb" />
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
              <span className="role-icon" style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", border: "1px solid #86efac", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                <CartIcon size={18} color="#16a34a" />
              </span>
              <span className="role-name">{t('role_customer', 'Người Mua')}</span>
              <span className="role-desc">Mua sắm & Săn Sale</span>
            </button>

            <button
              type="button"
              className={`shopee-role-card ${activeRole === 'seller' ? 'active' : ''}`}
              onClick={() => setActiveRole('seller')}
            >
              <span className="role-icon" style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "1px solid #fed7aa", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                <StoreIcon size={18} color="#ea580c" />
              </span>
              <span className="role-name">{t('role_seller', 'Kênh Shop')}</span>
              <span className="role-desc">Quản lý gian hàng</span>
            </button>

            <button
              type="button"
              className={`shopee-role-card ${activeRole === 'admin' ? 'active' : ''}`}
              onClick={() => setActiveRole('admin')}
            >
              <span className="role-icon" style={{ width: "32px", height: "32px", borderRadius: "8px", background: "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)", border: "1px solid #a5b4fc", display: "inline-flex", alignItems: "center", justifyContent: "center", margin: "0 auto 6px" }}>
                <ShieldCheckIcon size={18} color="#4f46e5" />
              </span>
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
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(99, 102, 241, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <KeyIcon size={12} color="#6366f1" />
              </span>
              <span>Mật khẩu & Email</span>
            </button>
            <button
              type="button"
              className={`shopee-auth-method-tab ${authMethod === 'qr' ? 'active' : ''}`}
              onClick={() => setAuthMethod('qr')}
            >
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <QrCodeIcon size={12} color="#2563eb" />
              </span>
              <span>Quét mã QR</span>
            </button>
          </div>

          {/* QR Method */}
          {authMethod === 'qr' ? (
            <div className="shopee-qr-container">
              <div className="shopee-qr-box">
                <div className="shopee-qr-laser"></div>
                <svg width="150" height="150" viewBox="0 0 100 100" fill="#0f172a">
                  {/* Outer corner 1 */}
                  <rect x="10" y="10" width="26" height="26" rx="4" fill="none" stroke="#0f172a" strokeWidth="4" />
                  <rect x="16" y="16" width="14" height="14" rx="2" fill="#0f172a" />
                  {/* Outer corner 2 */}
                  <rect x="64" y="10" width="26" height="26" rx="4" fill="none" stroke="#0f172a" strokeWidth="4" />
                  <rect x="70" y="16" width="14" height="14" rx="2" fill="#0f172a" />
                  {/* Outer corner 3 */}
                  <rect x="10" y="64" width="26" height="26" rx="4" fill="none" stroke="#0f172a" strokeWidth="4" />
                  <rect x="16" y="70" width="14" height="14" rx="2" fill="#0f172a" />
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
                  <BoltIcon size={14} color="#ea580c" />
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
                      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <UserIcon size={13} color="#16a34a" /> Nguyễn Văn Khách (Customer)
                      </strong>
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
                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <StoreIcon size={13} color="#ea580c" /> Thời Trang GenZ Official (Shop A)
                        </strong>
                        <span>shop.genz@shopee.vn</span>
                      </button>
                      <button
                        type="button"
                        className="shopee-demo-btn"
                        onClick={() => handleQuickLogin('seller_tech')}
                        disabled={loading}
                      >
                        <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          <StoreIcon size={13} color="#0284c7" /> TechWorld Store (Shop B)
                        </strong>
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
                      <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <ShieldCheckIcon size={13} color="#6366f1" /> Tổng Quản Trị Viên Sàn (Super Admin)
                      </strong>
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
                  <div className="shopee-email-autocomplete-wrap">
                    <div className="shopee-form-input-wrap">
                      <span className="shopee-input-lead-icon"><MailIcon size={16} color="#2563eb" /></span>
                      <input
                        ref={emailInputRef}
                        id="page-email"
                        type="email"
                        className="shopee-form-input"
                        placeholder={activeRole === 'customer' ? 'khachhang@shopee.vn' : activeRole === 'seller' ? 'shop.genz@shopee.vn' : 'admin@shopee.vn'}
                        value={email}
                        onChange={(e) => {
                          setEmail(e.target.value);
                          if (error) setError('');
                        }}
                        onFocus={() => setShowEmailDropdown(Boolean(email && email.trim()))}
                        autoComplete="email"
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
                            <MailIcon size={14} color="#2563eb" />
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

                <div className="shopee-form-group">
                  <label className="shopee-form-label" htmlFor="page-password">{t('password', 'Mật khẩu')}</label>
                  <div className="shopee-form-input-wrap">
                    <span className="shopee-input-lead-icon"><LockIcon size={16} color="#ea580c" /></span>
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
                      {showPassword ? <EyeOffIcon size={16} color="#64748b" /> : <EyeIcon size={16} color="#64748b" />}
                    </button>
                  </div>
                </div>

                {/* Lockout Warning Banner */}
                {isLocked && (
                  <div
                    style={{
                      background: 'rgba(239, 68, 68, 0.12)',
                      border: '1.5px solid #ef4444',
                      borderRadius: '12px',
                      padding: '12px 14px',
                      color: '#b91c1c',
                      fontSize: '12.5px',
                      marginBottom: '16px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                    }}
                  >
                    <ClockIcon size={22} color="#dc2626" />
                    <div>
                      <strong>Tạm khóa đăng nhập an toàn!</strong>
                      <div>Hệ thống phát hiện nhiều lần nhập sai. Thử lại sau <strong>{lockoutTimer}s</strong>.</div>
                    </div>
                  </div>
                )}

                {/* Anti-Bot Security Slider (shown after 3 failed attempts) */}
                {failedAttempts >= 3 && !isLocked && !sliderVerified && (
                  <div style={{ marginBottom: '14px' }}>
                    <div style={{ fontSize: '12px', fontWeight: 700, color: '#dc2626', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <AlertCircleIcon size={14} color="#dc2626" /> Yêu cầu kiểm tra an ninh (Lần thử {failedAttempts}/5):
                    </div>
                    <SecuritySliderCaptcha
                      isVerified={sliderVerified}
                      onSuccess={() => setSliderVerified(true)}
                      onVerified={() => setSliderVerified(true)}
                      onReset={() => setSliderVerified(false)}
                    />
                  </div>
                )}

                {failedAttempts >= 3 && sliderVerified && (
                  <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <CheckIcon size={14} color="#16a34a" /> Xác minh an ninh hoàn tất!
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px', fontSize: '12.5px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--text-secondary)' }}>
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      style={{ accentColor: 'var(--primary-color, #3b82f6)' }}
                    />
                    <span>{t('remember_me', 'Ghi nhớ đăng nhập (30 ngày)')}</span>
                  </label>
                  <span
                    onClick={() => setShowForgotModal(true)}
                    style={{ color: '#2563eb', cursor: 'pointer', fontWeight: 700 }}
                  >
                    {t('forgot_password', 'Quên mật khẩu?')}
                  </span>
                </div>

                <button
                  type="submit"
                  className="shopee-auth-submit-btn"
                  disabled={loading || isLocked}
                >
                  {loading
                    ? t('authenticating', 'Đang xác thực an toàn...')
                    : isLocked
                    ? `Đang khóa tạm thời (${lockoutTimer}s)`
                    : `${t('login', 'Đăng Nhập An Toàn')} (${activeRole === 'customer' ? t('role_customer', 'Người Mua') : activeRole === 'seller' ? t('role_seller', 'Chủ Shop') : t('role_admin', 'Admin')})`}
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
                  onClick={() => setSocialModalConfig({ isOpen: true, provider: 'google' })}
                  title="Đăng nhập an toàn với tài khoản Google của bạn"
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
                  onClick={() => setSocialModalConfig({ isOpen: true, provider: 'facebook' })}
                  title="Đăng nhập an toàn với tài khoản Facebook của bạn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>Facebook</span>
                </button>

                <button
                  type="button"
                  className="shopee-social-btn"
                  onClick={() => setSocialModalConfig({ isOpen: true, provider: 'apple' })}
                  title="Đăng nhập an toàn với Apple ID của bạn"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#000000">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.84c.62-.75 1.04-1.8 1.01-2.84-.9.04-1.99.6-2.63 1.35-.57.65-1.07 1.72-1.03 2.74 1 .08 2.03-.5 2.65-1.25z"/>
                  </svg>
                  <span>Apple ID</span>
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

      {/* Forgot Password Modal */}
      <ForgotPasswordModal
        isOpen={showForgotModal}
        defaultEmail={email}
        onClose={() => setShowForgotModal(false)}
        onResetSuccess={(resetEmail, newPwd) => {
          setEmail(resetEmail);
          if (newPwd) setPassword(newPwd);
          setShowForgotModal(false);
          showToast(t('reset_pwd_success_prompt', 'Mật khẩu đã đặt lại thành công! Bạn có thể bấm Đăng Nhập ngay.'), 'success');
        }}
      />

      {/* Social OAuth SSO Modal */}
      <SocialAuthModal
        isOpen={socialModalConfig.isOpen}
        provider={socialModalConfig.provider}
        role={activeRole}
        initialEmail={email}
        onClose={() => setSocialModalConfig({ isOpen: false, provider: 'google' })}
        onSuccess={(ssoUser) => {
          redirectAfterLogin(ssoUser.role);
        }}
      />
    </div>
  );
}
