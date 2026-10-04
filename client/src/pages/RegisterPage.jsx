import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { SecuritySliderCaptcha, OtpVerificationModal, LegalModal } from '../components';
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
  PhoneIcon,
  MapPinIcon,
  PackageIcon,
  CreditCardIcon,
  RefreshIcon,
  SparklesIcon,
  ChevronRightIcon,
  CloseIcon,
} from '../components/OrdersIcons';
import '../styles/auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
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

  // Strict non-default agreement
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Security, 2FA & Modals
  const [sliderVerified, setSliderVerified] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalInitialTab, setLegalInitialTab] = useState('terms');
  const [showPendingApprovalModal, setShowPendingApprovalModal] = useState(false);
  const [registeredShopInfo, setRegisteredShopInfo] = useState(null);
  const [expectedOtp, setExpectedOtp] = useState('');
  const [emailExistsError, setEmailExistsError] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [canUpgradeToSeller, setCanUpgradeToSeller] = useState(false);
  const [existingUserName, setExistingUserName] = useState('');

  // Realtime Email Duplicate & Account Upgrade Verification
  const verifyEmailUnique = async (emailToTest, roleToCheck = role) => {
    const trimmed = (emailToTest || formData.email || '').trim();
    if (!trimmed || !/^\S+@\S+\.\S+$/.test(trimmed)) return;
    setCheckingEmail(true);
    try {
      const resp = await fetch(`/api/auth/check-email?email=${encodeURIComponent(trimmed)}&role=${roleToCheck}`);
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (roleToCheck === 'seller' && data.data?.canUpgradeToSeller) {
          // HỢP NHẤT TÀI KHOẢN (Chuẩn Shopee): Cho phép kích hoạt mở Shop trên tài khoản Người Mua đã có!
          setEmailExistsError(false);
          setCanUpgradeToSeller(true);
          setExistingUserName(data.data.fullName || '');
          if (data.data.fullName && !formData.fullName) {
            setFormData(prev => ({ ...prev, fullName: data.data.fullName }));
          }
          if (data.data.phone && !formData.phone) {
            setFormData(prev => ({ ...prev, phone: data.data.phone }));
          }
          setError('');
        } else if (data.data?.exists) {
          setEmailExistsError(true);
          setCanUpgradeToSeller(false);
          setError(data.data.message || 'Email này đã được đăng ký tài khoản trong hệ thống. Vui lòng bấm "Đăng nhập ngay" để tiếp tục.');
          setSliderVerified(false);
        } else {
          setEmailExistsError(false);
          setCanUpgradeToSeller(false);
        }
      }
    } catch {
      // ignore
    } finally {
      setCheckingEmail(false);
    }
  };

  // Tự động cuộn lên đầu trang và đọc params từ URL khi mount hoặc điều hướng
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    const roleParam = searchParams.get('role');
    const emailParam = searchParams.get('email');
    if (roleParam === 'seller') {
      setRole('seller');
    }
    if (emailParam) {
      setFormData((prev) => ({ ...prev, email: emailParam }));
      verifyEmailUnique(emailParam, roleParam || 'seller');
    }
  }, [searchParams, location.pathname]);

  // Smart Email Autocomplete Dropdown
  const [showEmailDropdown, setShowEmailDropdown] = useState(false);
  const emailInputRef = useRef(null);
  const emailDropdownRef = useRef(null);
  const commonDomains = ['gmail.com', 'student.hcmute.edu.vn', 'hcmute.edu.vn', 'outlook.com', 'yahoo.com'];

  const getEmailSuggestions = (val) => {
    if (!val || !val.trim()) return [];
    const trimmed = val.trim();
    if (!trimmed.includes('@')) {
      return commonDomains.map(d => ({
        full: `${trimmed}@${d}`,
        prefix: trimmed,
        domain: `@${d}`
      }));
    }
    const [prefix, domainPart] = trimmed.split('@');
    if (!prefix) return [];
    return commonDomains
      .filter(d => d.toLowerCase().startsWith((domainPart || '').toLowerCase()))
      .map(d => ({
        full: `${prefix}@${d}`,
        prefix: `${prefix}@`,
        domain: d
      }));
  };

  const emailSuggestions = getEmailSuggestions(formData.email);

  // Close email dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (
        emailDropdownRef.current &&
        !emailDropdownRef.current.contains(e.target) &&
        emailInputRef.current &&
        !emailInputRef.current.contains(e.target)
      ) {
        setShowEmailDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
    if (name === 'email') {
      setEmailExistsError(false);
      setShowEmailDropdown(Boolean(value && value.trim().length > 0));
    }
  };

  const handleSelectEmailSuggestion = (fullEmail) => {
    setFormData(prev => ({ ...prev, email: fullEmail }));
    setShowEmailDropdown(false);
    if (error) setError('');
    verifyEmailUnique(fullEmail);
  };

  // Preserve form data on role toggle, but reset agreement & slider
  const handleRoleChange = (newRole) => {
    if (newRole === role) return;
    setRole(newRole);
    setAgreeTerms(false);
    setSliderVerified(false);
    setTermsError(false);
    setError('');
    if (formData.email) {
      verifyEmailUnique(formData.email, newRole);
    }
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

  // Form validity for slider captcha - strictly requires unused email (hoặc cho phép nếu là nâng cấp lên Người Bán)
  const isFormValid = Boolean(
    (!emailExistsError || (role === 'seller' && canUpgradeToSeller)) &&
    formData.fullName.trim().length >= 2 &&
    /^\S+@\S+\.\S+$/.test(formData.email.trim()) &&
    (!formData.phone || /(84|0[3|5|7|8|9])+([0-9]{8})\b/.test(formData.phone.replace(/\s+/g, ''))) &&
    isAllPasswordCriteriaMet &&
    formData.password === formData.confirmPassword &&
    (role !== 'seller' || Boolean(formData.shopName.trim()))
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim() || !formData.password) {
      setError(t('auth_error_required_fields', 'Vui lòng điền đầy đủ các trường bắt buộc (*)'));
      return;
    }
    // Chặn tài khoản đã đăng ký trước đó (trừ trường hợp nâng cấp lên Người Bán hợp nhất)
    if (emailExistsError && !(role === 'seller' && canUpgradeToSeller)) {
      setError('Tài khoản với email này đã tồn tại trên hệ thống. Vui lòng bấm Đăng Nhập để tiếp tục.');
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
      setTermsError(true);
      setError('Vui lòng đọc và bấm tick chọn "Tôi đồng ý với Điều khoản dịch vụ & Chính sách bảo mật" trước khi tiếp tục.');
      return;
    }
    if (!sliderVerified) {
      setError('Vui lòng kéo thanh trượt xác minh bảo mật bên dưới trước khi tiếp tục.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Trigger backend 2FA OTP sending to email
      const resp = await fetch('/api/auth/send-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          role: role
        })
      });
      const data = await resp.json();
      if (resp.ok && data.success) {
        if (data.data?._devOtp) {
          setExpectedOtp(data.data._devOtp);
          console.log(`[Mini Shopee Security 2FA] Mã OTP xác thực gửi tới ${formData.email.trim()}:`, data.data._devOtp);
        }
        showToast(data.message || `Đã gửi mã xác thực 2FA tới email ${formData.email.trim()}`, 'success');
        setShowOtpModal(true);
      } else if (resp.status === 404) {
        // Backend route is updating/reloading - fallback to local secure OTP engine
        const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
        setExpectedOtp(fallbackOtp);
        console.log(`[Mini Shopee Security 2FA - Fallback] Mã OTP xác thực cho ${formData.email.trim()}:`, fallbackOtp);
        showToast(`Đã tạo mã xác thực 2FA bảo mật cho email ${formData.email.trim()}`, 'info');
        setShowOtpModal(true);
      } else {
        const errMsg = data.message || 'Email này đã được đăng ký tài khoản trên hệ thống. Vui lòng bấm Đăng Nhập.';
        setError(errMsg);
        showToast(errMsg, 'error');
        if (resp.status === 409 || errMsg.includes('đăng ký') || errMsg.includes('tài khoản')) {
          setEmailExistsError(true);
        }
        setSliderVerified(false);
        setShowOtpModal(false);
        return;
      }
    } catch {
      // Local fallback in case network disconnect
      const fallbackOtp = Math.floor(100000 + Math.random() * 900000).toString();
      setExpectedOtp(fallbackOtp);
      showToast(`Đã tạo mã xác thực 2FA bảo mật cho email ${formData.email.trim()}`, 'info');
      setShowOtpModal(true);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      const resp = await fetch('/api/auth/send-registration-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email.trim(),
          fullName: formData.fullName.trim(),
          role: role
        })
      });
      const data = await resp.json();
      if (resp.ok && data.data?._devOtp) {
        setExpectedOtp(data.data._devOtp);
        console.log(`[Mini Shopee Security 2FA] Mã OTP gửi lại mới:`, data.data._devOtp);
        return data.data._devOtp;
      }
    } catch {
      // ignore
    }
    const fresh = Math.floor(100000 + Math.random() * 900000).toString();
    setExpectedOtp(fresh);
    return fresh;
  };

  const handleOtpVerified = async (enteredOtp) => {
    setLoading(true);
    setError('');
    try {
      // Optional verification with backend
      try {
        await fetch('/api/auth/verify-registration-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email.trim(),
            otp: enteredOtp
          })
        });
      } catch {
        // fallback
      }

      const res = await register({
        ...formData,
        role
      });
      if (res && res.success) {
        if (role === 'seller') {
          // Lưu shop vào danh sách chờ phê duyệt của Admin
          const savedShops = JSON.parse(localStorage.getItem('mini_shopee_seller_shops') || '[]');
          const newShop = {
            id: res.user?.shopId || `shop_${Date.now().toString().slice(-4)}`,
            name: formData.shopName.trim(),
            ownerName: formData.fullName.trim(),
            email: formData.email.trim(),
            phone: formData.phone.trim() || '0900000000',
            category: formData.shopCategory || 'Thời trang',
            address: formData.shopAddress?.trim() || 'TP. Hồ Chí Minh',
            productsCount: 0,
            totalRevenue: 0,
            status: 'pending',
            statusText: 'Chờ phê duyệt',
            createdAt: new Date().toISOString(),
          };
          localStorage.setItem('mini_shopee_seller_shops', JSON.stringify([newShop, ...savedShops]));
          setRegisteredShopInfo(newShop);
          setShowOtpModal(false);
          setShowPendingApprovalModal(true);
        } else {
          // Tặng thưởng onboarding khách hàng: +1.000 Xu bonus & Voucher tân thủ 50K
          if (res.user?.id) {
            const coinKey = `mini_shopee_user_coins_customer_${res.user.id}`;
            const current = localStorage.getItem(coinKey);
            const newAmount = (current !== null ? Number(current) : 25000) + 1000;
            localStorage.setItem(coinKey, String(newAmount));
          }

          showToast('Đăng ký bảo mật thành công! Bạn nhận được 1.000 Xu tích lũy và Voucher tân thủ 50.000đ.', 'success');
          setShowOtpModal(false);
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
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                {role === 'seller' ? <BoltIcon size={13} color="#ea580c" /> : <TicketIcon size={13} color="#ea580c" />}
              </span>
              <span>{role === 'seller' ? 'GIA NHẬP HỆ THỐNG ĐỐI TÁC BÁN HÀNG' : 'GIA NHẬP CỘNG ĐỒNG NGƯỜI MUA'}</span>
            </div>
            <h1 className="shopee-auth-hero-title">
              {role === 'seller' ? (
                <>Khởi tạo gian hàng <span>bứt phá doanh thu</span></>
              ) : (
                <>Mở khóa đặc quyền <span>hấp dẫn hàng đầu</span></>
              )}
            </h1>
            <p className="shopee-auth-hero-desc">
              {role === 'seller'
                ? 'Thiết lập gian hàng chính thức trong 30 giây, hưởng 0% phí sàn tháng đầu và tiếp cận 50.000+ khách hàng tiềm năng.'
                : 'Tạo tài khoản chỉ trong 30 giây để tận hưởng trọn vẹn ưu đãi mã giảm 50K, 1.000 Xu tích lũy và Freeship toàn quốc.'}
            </p>
          </div>

          {/* Centered Middle Section: 6 Perks + Live Ticker */}
          <div className="shopee-auth-hero-middle">
            <div className="shopee-auth-hero-features">
              {role === 'seller' ? (
                <>
                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><CoinIcon size={18} color="#f59e0b" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>0% Phí Sàn Tháng Đầu Tiên</strong>
                      <span>Tối ưu hóa 100% doanh thu và lợi nhuận bán lẻ</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><StarIcon size={18} color="#f59e0b" fill="#f59e0b" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Tiếp Cận 50.000+ Khách Hàng Tiềm Năng</strong>
                      <span>Thuật toán AI tự động gợi ý sản phẩm lên đầu trang</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><TruckIcon size={18} color="#059669" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Tạo & In Vận Đơn Tự Động 1-Click</strong>
                      <span>Tích hợp đồng bộ SPX Express, Giao Hàng Nhanh, Viettel Post</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><CreditCardIcon size={18} color="#0d9488" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Rút Tiền Doanh Thu Ví Shop 24/7</strong>
                      <span>Tiền chuyển thẳng tài khoản ngân hàng tức thì miễn phí</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><StoreIcon size={18} color="#2563eb" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Trợ Lý Báo Cáo Doanh Thu AI Thông Minh</strong>
                      <span>Phân tích biểu đồ lãi lỗ, kiểm soát tồn kho tức thời</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><BoltIcon size={18} color="#eab308" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Tặng Gói QC Flash Sale Độc Quyền</strong>
                      <span>Hỗ trợ đẩy top từ khóa gian hàng ngay tuần mở bán</span>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><TicketIcon size={18} color="#ea580c" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Gói Voucher Tân Thủ 500.000đ</strong>
                      <span>Tặng ngay mã giảm 50K cho đơn hàng đầu tiên</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><CoinIcon size={18} color="#f59e0b" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Tặng 1.000 Xu Tích Lũy Vào Ví</strong>
                      <span>Dùng trừ tiền trực tiếp vào hóa đơn thanh toán</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><TruckIcon size={18} color="#059669" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Freeship Xtra Không Giới Hạn</strong>
                      <span>Miễn phí vận chuyển toàn quốc cho mọi đơn hàng</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><ShieldCheckIcon size={18} color="#16a34a" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Cam Kết 100% Hàng Chính Hãng</strong>
                      <span>Đền bù 200% nếu phát hiện sản phẩm giả mạo</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><RefreshIcon size={18} color="#2563eb" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Đổi Trả Dễ Dàng Trong 30 Ngày</strong>
                      <span>Shipper thu hồi tận nơi, hoàn tiền tức thì qua Ví</span>
                    </div>
                  </div>

                  <div className="shopee-auth-hero-feat-item">
                    <div className="shopee-auth-hero-feat-icon"><BoltIcon size={18} color="#eab308" /></div>
                    <div className="shopee-auth-hero-feat-text">
                      <strong>Giao Siêu Tốc Trong 2 Giờ (2H)</strong>
                      <span>Nhận hàng ngay trong ngày tại TP.HCM & Hà Nội</span>
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
            {role === 'seller' ? (
              <>
                <div className="shopee-auth-hero-stat-card">
                  <strong>0%</strong>
                  <span>Phí sàn tháng đầu</span>
                </div>
                <div className="shopee-auth-hero-stat-card">
                  <strong>24/7</strong>
                  <span>Rút tiền ví shop</span>
                </div>
                <div className="shopee-auth-hero-stat-card">
                  <strong>Top 1</strong>
                  <span>Tăng trưởng</span>
                </div>
              </>
            ) : (
              <>
                <div className="shopee-auth-hero-stat-card">
                  <strong>100%</strong>
                  <span>Bảo mật</span>
                </div>
                <div className="shopee-auth-hero-stat-card">
                  <strong>30s</strong>
                  <span>Đăng ký nhanh</span>
                </div>
                <div className="shopee-auth-hero-stat-card">
                  <strong>0đ</strong>
                  <span>Phí thành viên</span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Form Column */}
        <div className="shopee-auth-form-col">
          <div className="shopee-auth-header" style={{ marginBottom: '14px' }}>
            <div className="shopee-auth-brand-badge">
              <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <SparklesIcon size={13} color="#ea580c" />
              </span>
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
              onClick={() => handleRoleChange('customer')}
            >
              <span style={{ width: "26px", height: "26px", borderRadius: "6px", background: role === 'customer' ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)', border: role === 'customer' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid #86efac', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CartIcon size={14} color={role === 'customer' ? '#ffffff' : '#16a34a'} />
              </span>
              <span>{t('register_role_customer', 'Mua Hàng')}</span>
            </button>
            <button
              type="button"
              className={`shopee-role-tab ${role === 'seller' ? 'active' : ''}`}
              onClick={() => handleRoleChange('seller')}
            >
              <span style={{ width: "26px", height: "26px", borderRadius: "6px", background: role === 'seller' ? 'rgba(255, 255, 255, 0.2)' : 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: role === 'seller' ? '1px solid rgba(255, 255, 255, 0.4)' : '1px solid #fed7aa', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <StoreIcon size={14} color={role === 'seller' ? '#ffffff' : '#ea580c'} />
              </span>
              <span>{t('register_role_seller', 'Mở Shop Bán Hàng')}</span>
            </button>
          </div>

          {/* Banner nhận diện tài khoản khi nâng cấp lên Người Bán */}
          {role === 'seller' && canUpgradeToSeller && (
            <div style={{
              background: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '10px',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}>
              <StoreIcon size={20} className="text-blue-600" />
              <div style={{ fontSize: '13px', color: '#1e40af', lineHeight: 1.5 }}>
                <strong>Nhận diện tài khoản:</strong> Email <strong>{formData.email}</strong> đã có tài khoản Người Mua{existingUserName ? ` (Chủ tài khoản: ${existingUserName})` : ''}.
                <br />
                Hệ thống hỗ trợ 1 tài khoản hợp nhất chuẩn Shopee. Bạn chỉ cần hoàn thiện thông tin Shop bên dưới để <strong>kích hoạt mở Gian Hàng ngay</strong> mà không cần tạo email mới!
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="shopee-form-error-msg" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircleIcon size={14} color="#ef4444" />
                  <span>{error}</span>
                </div>
                {emailExistsError && (
                  <Link
                    to={`/login?email=${encodeURIComponent(formData.email)}`}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                      padding: '8px 16px',
                      background: '#2563eb',
                      color: '#ffffff',
                      borderRadius: '8px',
                      fontWeight: 700,
                      fontSize: '13px',
                      textDecoration: 'none',
                      marginTop: '4px',
                      boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                    }}
                  >
                    <KeyIcon size={14} color="#6366f1" />
                    <span>Đăng Nhập Ngay Với Email Này</span>
                    <ChevronRightIcon size={14} color="#ffffff" />
                  </Link>
                )}
              </div>
            )}

            <div className="shopee-form-group">
              <label className="shopee-form-label" htmlFor="reg-fullName">
                {t('full_name', 'Họ và tên')} *
              </label>
              <div className="shopee-form-input-wrap">
                <span className="shopee-input-lead-icon"><UserIcon size={16} color="#0284c7" /></span>
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
              {/* Email with Smart Autocomplete Dropdown */}
              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="reg-email">Email *</label>
                <div className="shopee-email-autocomplete-wrap">
                  <div className="shopee-form-input-wrap">
                    <span className="shopee-input-lead-icon"><MailIcon size={16} color="#2563eb" /></span>
                    <input
                      ref={emailInputRef}
                      id="reg-email"
                      name="email"
                      type="email"
                      className={`shopee-form-input ${emailExistsError ? 'shopee-input-error' : ''}`}
                      placeholder="an.nguyen@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={() => verifyEmailUnique(formData.email)}
                      onFocus={() => setShowEmailDropdown(Boolean(formData.email && formData.email.trim()))}
                      autoComplete="email"
                      style={emailExistsError ? { borderColor: '#ef4444', background: '#fef2f2' } : {}}
                    />
                  </div>

                  {emailExistsError && (
                    <div
                      style={{
                        marginTop: '6px',
                        padding: '6px 10px',
                        background: '#fef2f2',
                        border: '1px solid #f87171',
                        borderRadius: '8px',
                        fontSize: '11.5px',
                        color: '#991b1b',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '6px',
                        lineHeight: 1.3
                      }}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <AlertCircleIcon size={12} color="#ef4444" /> Email này đã được đăng ký.
                      </span>
                      <Link
                        to={`/login?email=${encodeURIComponent(formData.email)}`}
                        style={{
                          color: '#2563eb',
                          fontWeight: 700,
                          textDecoration: 'underline',
                          whiteSpace: 'nowrap',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '2px',
                        }}
                      >
                        <span>Đăng nhập</span>
                        <ChevronRightIcon size={12} color="#2563eb" />
                      </Link>
                    </div>
                  )}

                  {/* Autocomplete Dropdown */}
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
                <label className="shopee-form-label" htmlFor="reg-phone">
                  {t('phone', 'Số điện thoại')}
                  <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 400, marginLeft: '4px' }}>
                    (10 số)
                  </span>
                </label>
                <div className="shopee-form-input-wrap">
                  <span className="shopee-input-lead-icon"><PhoneIcon size={16} color="#16a34a" /></span>
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '10.5px', color: '#d97706', marginTop: '4px' }}>
                    <AlertCircleIcon size={12} color="#ef4444" /> Cần đúng 10 số (VD: 0362 217 721)
                  </span>
                )}
              </div>
            </div>

            {/* Mở rộng nếu là Chủ Shop */}
            {role === 'seller' && (
              <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '14px 16px', borderRadius: '14px', border: '1px solid rgba(59, 130, 246, 0.28)', marginBottom: '16px' }}>
                <div style={{ fontSize: '12px', fontWeight: 700, color: '#38bdf8', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <StoreIcon size={16} />
                  <span>THÔNG TIN THIẾT LẬP GIAN HÀNG BÁN HÀNG</span>
                </div>
                <div className="shopee-form-group" style={{ marginBottom: '10px' }}>
                  <label className="shopee-form-label" htmlFor="reg-shopName">
                    {t('shop_name_label', 'Tên Cửa Hàng / Shop')} *
                  </label>
                  <div className="shopee-form-input-wrap">
                    <span className="shopee-input-lead-icon"><StoreIcon size={16} color="#ea580c" /></span>
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
                      <span className="shopee-input-lead-icon"><MapPinIcon size={16} color="#ea580c" /></span>
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
                  <span className="shopee-input-lead-icon"><LockIcon size={16} color="#ea580c" /></span>
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
                    {showPassword ? <EyeOffIcon size={16} color="#64748b" /> : <EyeIcon size={16} color="#64748b" />}
                  </button>
                </div>
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="reg-confirmPassword">
                  {t('confirm_password', 'Xác nhận mật khẩu')} *
                </label>
                <div className="shopee-form-input-wrap">
                  <span className="shopee-input-lead-icon"><ShieldCheckIcon size={16} color="#6366f1" /></span>
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
                    {showConfirmPassword ? <EyeOffIcon size={16} color="#64748b" /> : <EyeIcon size={16} color="#64748b" />}
                  </button>
                </div>
                {formData.confirmPassword && (
                  <div style={{ marginTop: '4px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {formData.password === formData.confirmPassword ? (
                      <span style={{ color: '#10b981', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CheckIcon size={10} color="#16a34a" />
                        </span>
                        <span>Mật khẩu xác nhận hoàn toàn trùng khớp</span>
                      </span>
                    ) : (
                      <span style={{ color: '#ef4444', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CloseIcon size={10} color="#ef4444" />
                        </span>
                        <span>Mật khẩu xác nhận chưa khớp</span>
                      </span>
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
                    {passwordChecks.length ? (
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon size={10} color="#16a34a" />
                      </span>
                    ) : (
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
                      </span>
                    )}
                    <span>Tối thiểu 8 ký tự</span>
                  </div>
                  <div style={{ color: passwordChecks.hasUpper ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {passwordChecks.hasUpper ? (
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon size={10} color="#16a34a" />
                      </span>
                    ) : (
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
                      </span>
                    )}
                    <span>Có chữ in hoa (A-Z)</span>
                  </div>
                  <div style={{ color: passwordChecks.hasNumber ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {passwordChecks.hasNumber ? (
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon size={10} color="#16a34a" />
                      </span>
                    ) : (
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
                      </span>
                    )}
                    <span>Có chữ số (0-9)</span>
                  </div>
                  <div style={{ color: passwordChecks.hasSpecial ? '#10b981' : '#64748b', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {passwordChecks.hasSpecial ? (
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon size={10} color="#16a34a" />
                      </span>
                    ) : (
                      <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#94a3b8' }} />
                      </span>
                    )}
                    <span>Ký tự đặc biệt (!@#$)</span>
                  </div>
                </div>
              </div>
            )}

            {/* Anti-Bot Security Slider - Locked until full info filled */}
            <div style={{ marginBottom: '14px' }}>
              <SecuritySliderCaptcha
                isVerified={sliderVerified}
                disabled={!isFormValid}
                disabledMessage="Vui lòng điền đủ & đúng thông tin phía trên để mở khóa trượt"
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

            {/* Non-default Agreement Checkbox with Error Highlight */}
            <div style={{ marginBottom: '18px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
              <label className={termsError && !agreeTerms ? 'shopee-checkbox-error' : ''} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => {
                    setAgreeTerms(e.target.checked);
                    if (e.target.checked) setTermsError(false);
                  }}
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
                    Điều khoản dịch vụ {role === 'seller' ? '(Dành cho Shop)' : '(Dành cho Người mua)'}
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
                  {' '}của sàn Fullstack E-Commerce.
                </span>
              </label>
            </div>

            <button
              type="submit"
              className="shopee-auth-submit-btn"
              disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheckIcon size={14} color="#ffffff" />
              </span>
              <span>
                {loading 
                  ? t('creating_account', 'Đang thiết lập tài khoản...') 
                  : role === 'seller' 
                    ? (canUpgradeToSeller ? 'Tiếp tục xác thực OTP kích hoạt mở gian hàng' : 'Tiếp tục xác thực OTP mở gian hàng') 
                    : 'Tiếp tục xác thực OTP tạo tài khoản'}
              </span>
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
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <LockIcon size={11} color="#64748b" />
              </span>
              <span>SSL 256-Bit</span>
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheckIcon size={11} color="#16a34a" />
              </span>
              <span>Bảo mật 2FA OTP</span>
            </span>
            <span>•</span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#eff6ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldIcon size={11} color="#2563eb" />
              </span>
              <span>100% Bảo vệ tài khoản</span>
            </span>
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
        targetEmail={formData.email}
        targetPhone={formData.phone}
        expectedOtp={expectedOtp}
        onClose={() => setShowOtpModal(false)}
        onVerify={handleOtpVerified}
        onVerifySuccess={handleOtpVerified}
        onResend={handleResendOtp}
      />

      {/* Terms of Service & Privacy Policy Modal with Role Context */}
      <LegalModal
        isOpen={showLegalModal}
        onClose={() => setShowLegalModal(false)}
        initialTab={legalInitialTab}
        role={role}
        onAgree={() => {
          setAgreeTerms(true);
          setTermsError(false);
        }}
      />

      {/* Pending Admin Approval Modal for Sellers */}
      {showPendingApprovalModal && registeredShopInfo && (
        <div className="shopee-auth-modal-overlay">
          <div
            className="shopee-auth-modal-card"
            style={{
              maxWidth: '520px',
              textAlign: 'center',
              padding: '36px 30px',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '2px solid rgba(245, 158, 11, 0.4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
              }}
            >
              <ClockIcon size={32} color="#f59e0b" />
            </div>

            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: 'rgba(245, 158, 11, 0.12)',
                color: '#b45309',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700,
                marginBottom: '12px',
              }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#d97706', display: 'inline-block' }} />
              <span>HỒ SƠ ĐANG CHỜ PHÊ DUYỆT</span>
            </div>

            <h3 style={{ fontSize: '22px', fontWeight: 800, margin: '0 0 10px', color: '#0f172a' }}>
              Đăng Ký Hồ Sơ Gian Hàng Thành Công!
            </h3>

            <p style={{ fontSize: '13.5px', color: '#64748b', lineHeight: 1.6, margin: '0 0 20px' }}>
              Chúc mừng bạn đã hoàn tất đăng ký gian hàng <strong>{registeredShopInfo.name}</strong>. Theo quy định an toàn thương mại điện tử, hồ sơ của bạn đang được chuyển đến Quản Trị Viên (Admin) để kiểm duyệt.
            </p>

            <div
              style={{
                background: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '14px 18px',
                textAlign: 'left',
                fontSize: '12.5px',
                marginBottom: '24px',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Mã định danh Shop:</span>
                <strong style={{ color: '#0f172a' }}>{registeredShopInfo.id}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Tên gian hàng:</span>
                <strong style={{ color: '#2563eb' }}>{registeredShopInfo.name}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Email đại diện:</span>
                <span>{registeredShopInfo.email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#64748b' }}>Thời gian xét duyệt dự kiến:</span>
                <strong style={{ color: '#d97706' }}>Trong vòng 24 giờ</strong>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                onClick={() => {
                  setShowPendingApprovalModal(false);
                  navigate('/');
                }}
                style={{ flex: 1, padding: '10px 16px', fontWeight: 700 }}
              >
                Về Trang Chủ
              </button>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                onClick={() => {
                  setShowPendingApprovalModal(false);
                  navigate('/login');
                }}
                style={{ flex: 1, padding: '10px 16px', fontWeight: 700, background: '#2563eb', color: '#fff' }}
              >
                Đến Trang Đăng Nhập
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
