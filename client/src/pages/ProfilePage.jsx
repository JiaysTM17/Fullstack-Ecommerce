import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import AccountSidebar from '../components/AccountSidebar';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatCurrency';
import { useCoins } from '../context/CoinContext';
import { getVouchers } from '../services/voucherService';
import { fetchMyOrders } from '../services/api';
import RewardsHubModal from '../components/RewardsHubModal';
import {
  getSavedAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
} from '../services/addressService';
import {
  getSavedPaymentMethods,
  addPaymentMethod,
  deletePaymentMethod,
  setDefaultPaymentMethod,
} from '../services/paymentMethodService';
import {
  VIETNAM_PROVINCES,
  getDistrictsByProvince,
  getWardsByDistrict,
} from '../data/vietnamLocations';
import {
  PackageIcon,
  TruckIcon,
  CreditCardIcon,
  MapPinIcon,
  LockIcon,
  TicketIcon,
  CoinIcon,
  HeartIcon,
  PencilIcon,
  ShieldIcon,
  StoreIcon,
  CheckIcon,
  ShieldCheckIcon,
  ShoppingBagIcon,
} from '../components/OrdersIcons';
import '../styles/auth.css';
import '../styles/profile.css';

// Preset Avatars for Instant Selection
const PRESET_AVATARS = [
  { id: 'av1', label: 'Doanh nhân', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=160&auto=format&fit=crop&q=80' },
  { id: 'av2', label: 'Công nghệ', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=160&auto=format&fit=crop&q=80' },
  { id: 'av3', label: 'Hiện đại', url: 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=160&auto=format&fit=crop&q=80' },
  { id: 'av4', label: 'Tối giản', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=160&auto=format&fit=crop&q=80' },
  { id: 'av5', label: 'Thanh lịch', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=160&auto=format&fit=crop&q=80' },
  { id: 'av6', label: 'Năng động', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=160&auto=format&fit=crop&q=80' },
];

export default function ProfilePage() {
  const { user, updateProfile, changePassword } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { coins, streak, hasCheckedInToday, checkInToday, coinHistory, addCoins } = useCoins();

  // Navigation & Sliding Tab Indicator State
  const [activeTab, setActiveTab] = useState(() => searchParams.get('tab') || 'profile'); // 'profile' | 'addresses' | 'payments' | 'security' | 'settings' | 'vouchers' | 'coins'

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['profile', 'addresses', 'payments', 'security', 'settings', 'vouchers', 'coins'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 });
  const tabRefs = useRef({});
  const fileInputRef = useRef(null);

  // Rewards Hub Modal State
  const [showSpinModal, setShowSpinModal] = useState(false);

  // Tab 1: Profile form state
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
    avatar: user?.avatar || '',
    gender: user?.gender || 'other',
    birthday: user?.birthday || '',
    bio: user?.bio || '',
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || '');
  const [showCustomAvatarInput, setShowCustomAvatarInput] = useState(false);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');
  const [isSubmittingProfile, setIsSubmittingProfile] = useState(false);

  // Synchronize form with user when auth user state loads/changes
  useEffect(() => {
    if (user) {
      setFormData({
        fullName: user.fullName || '',
        phone: user.phone || '',
        email: user.email || '',
        address: user.address || '',
        avatar: user.avatar || '',
        gender: user.gender || 'other',
        birthday: user.birthday || '',
        bio: user.bio || '',
      });
      setAvatarPreview(user.avatar || '');
    }
  }, [user]);

  // Tab 2: Address book state with unified addressService
  const [addresses, setAddresses] = useState(() => getSavedAddresses(user));
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    name: '',
    phone: '',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    street: '',
    tag: 'Nhà riêng',
    isDefault: false,
  });

  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState({
    name: '',
    phone: '',
    province: 'TP. Hồ Chí Minh',
    district: 'Quận 1',
    ward: 'Phường Bến Nghé',
    street: '',
    tag: 'Nhà riêng',
    isDefault: false,
  });

  // Re-sync addresses when user changes or cross-tab updates occur
  useEffect(() => {
    setAddresses(getSavedAddresses(user));
  }, [user]);

  useEffect(() => {
    const handleSync = () => {
      setAddresses(getSavedAddresses(user));
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('mini_shopee_address_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mini_shopee_address_updated', handleSync);
    };
  }, [user]);

  // Tab 3: Payment Methods State
  const [paymentMethods, setPaymentMethods] = useState(() => getSavedPaymentMethods(user));
  const [showAddPaymentModal, setShowAddPaymentModal] = useState(false);
  const [newPaymentForm, setNewPaymentForm] = useState({
    type: 'bank',
    provider: 'Vietcombank',
    accountNumber: '',
    accountName: '',
    expiry: '',
    phone: '',
    isDefault: false,
  });

  useEffect(() => {
    setPaymentMethods(getSavedPaymentMethods(user));
  }, [user]);

  useEffect(() => {
    const handleSyncPayments = () => {
      setPaymentMethods(getSavedPaymentMethods(user));
    };
    window.addEventListener('storage', handleSyncPayments);
    window.addEventListener('mini_shopee_payment_updated', handleSyncPayments);
    return () => {
      window.removeEventListener('storage', handleSyncPayments);
      window.removeEventListener('mini_shopee_payment_updated', handleSyncPayments);
    };
  }, [user]);

  // Tab 4: Security & Password Change State
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA Security state
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(() => {
    try {
      return localStorage.getItem('mini_shopee_2fa_enabled') === 'true';
    } catch {
      return false;
    }
  });

  // Tab 5: Settings & Privacy State
  const [settings, setSettings] = useState(() => {
    const key = `mini_shopee_settings_${user?.id || user?._id || 'guest'}`;
    try {
      const saved = localStorage.getItem(key);
      return saved
        ? JSON.parse(saved)
        : {
            notifyOrderWeb: true,
            notifyOrderEmail: true,
            notifyDeliverySMS: true,
            notifyPromotions: true,
            notifyDailyCheckin: true,
            anonymousReview: false,
            personalizedAds: true,
          };
    } catch {
      return {
        notifyOrderWeb: true,
        notifyOrderEmail: true,
        notifyDeliverySMS: true,
        notifyPromotions: true,
        notifyDailyCheckin: true,
        anonymousReview: false,
        personalizedAds: true,
      };
    }
  });

  const handleUpdateSetting = (key, value) => {
    setSettings((prev) => {
      const next = { ...prev, [key]: value };
      const storageKey = `mini_shopee_settings_${user?.id || user?._id || 'guest'}`;
      try {
        localStorage.setItem(storageKey, JSON.stringify(next));
      } catch {}
      showToast('Đã lưu tùy chọn cài đặt thành công!', 'success');
      return next;
    });
  };

  // Tab 6: Voucher Wallet State
  const [vouchersList, setVouchersList] = useState([]);
  const [savedVoucherCodes, setSavedVoucherCodes] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_saved_voucher_codes');
      return saved ? JSON.parse(saved) : ['MINI10', 'FREESHIP'];
    } catch {
      return ['MINI10', 'FREESHIP'];
    }
  });
  const [voucherFilterTab, setVoucherFilterTab] = useState('all');

  // Tab 7: Coin History Filter
  const [coinFilter, setCoinFilter] = useState('all'); // 'all' | 'in' | 'out'

  // User Orders Summary & Loyalty Rank
  const [ordersSummary, setOrdersSummary] = useState({
    total: 0,
    processing: 0,
    completed: 0,
    totalSpent: 0,
  });

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const orderData = await fetchMyOrders();
        const list = Array.isArray(orderData) ? orderData : (orderData?.orders || []);
        if (active && list.length > 0) {
          const processingCount = list.filter((o) =>
            ['pending', 'confirmed', 'shipping', 'processing'].includes(o.orderStatus || o.status)
          ).length;
          const completedCount = list.filter((o) =>
            ['completed', 'delivered'].includes(o.orderStatus || o.status)
          ).length;
          const totalSpent = list
            .filter((o) => ['completed', 'delivered'].includes(o.orderStatus || o.status))
            .reduce((acc, o) => acc + (Number(o.totalAmount || o.finalAmount || o.subtotal) || 0), 0);

          setOrdersSummary({
            total: list.length,
            processing: processingCount,
            completed: completedCount,
            totalSpent,
          });
        }
      } catch (err) {
        console.warn('Unable to load order stats for profile:', err?.message);
      }
    })();
    return () => { active = false; };
  }, [user]);

  // Determine Loyalty Tier
  const loyaltyTier = useMemo(() => {
    const spent = ordersSummary.totalSpent;
    const totalOrders = ordersSummary.total;
    if (spent >= 10000000 || totalOrders >= 15) {
      return { name: 'Thành viên Kim Cương', icon: '💎', color: '#38bdf8' };
    }
    if (spent >= 3000000 || totalOrders >= 8) {
      return { name: 'Thành viên Vàng', icon: '🥇', color: '#fbbf24' };
    }
    if (spent >= 1000000 || totalOrders >= 3) {
      return { name: 'Thành viên Bạc', icon: '🥈', color: '#cbd5e1' };
    }
    return { name: 'Thành viên Đồng', icon: '🥉', color: '#f59e0b' };
  }, [ordersSummary]);

  // Profile Completeness Meter Calculation
  const profileCompleteness = useMemo(() => {
    const tasks = [
      { id: 'name_email', label: 'Họ tên & Email', isDone: Boolean(formData.fullName?.trim() && formData.email) },
      { id: 'phone', label: 'Số điện thoại', isDone: Boolean(formData.phone?.trim()) },
      { id: 'birthday_gender', label: 'Ngày sinh & Giới tính', isDone: Boolean(formData.birthday && formData.gender !== 'other') },
      { id: 'address', label: 'Địa chỉ giao hàng', isDone: addresses.length > 0 },
      { id: 'payment', label: 'Phương thức thanh toán', isDone: paymentMethods.length > 0 },
    ];

    const completedCount = tasks.filter((t) => t.isDone).length;
    const percentage = Math.round((completedCount / tasks.length) * 100);

    const bonusClaimKey = `mini_shopee_profile_bonus_claimed_${user?.id || user?._id}`;
    let isBonusClaimed = false;
    try {
      isBonusClaimed = localStorage.getItem(bonusClaimKey) === 'true';
    } catch {}

    return {
      percentage,
      tasks,
      isComplete: percentage === 100,
      isBonusClaimed,
    };
  }, [formData, addresses.length, paymentMethods.length, user]);

  const handleClaimProfileBonus = () => {
    if (!profileCompleteness.isComplete) {
      showToast('Vui lòng hoàn thành 100% hồ sơ để nhận quà!', 'error');
      return;
    }
    if (profileCompleteness.isBonusClaimed) {
      showToast('Bạn đã nhận phần thưởng này rồi!', 'info');
      return;
    }

    if (addCoins) {
      addCoins(500, 'Thưởng hoàn thiện 100% hồ sơ cá nhân');
    }
    const bonusClaimKey = `mini_shopee_profile_bonus_claimed_${user?.id || user?._id}`;
    try {
      localStorage.setItem(bonusClaimKey, 'true');
    } catch {}
    showToast('🎉 Chúc mừng bạn đã nhận +500 Shopee Xu thưởng hoàn thiện hồ sơ!', 'success');
  };

  // Load Vouchers
  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const vList = await getVouchers();
        if (active && Array.isArray(vList)) {
          setVouchersList(vList);
        }
      } catch (err) {
        console.warn('Failed to load vouchers:', err);
      }
    })();
    return () => { active = false; };
  }, []);

  // Update Sliding Indicator Position on Tab Change or Resize
  useEffect(() => {
    const updateIndicator = () => {
      const activeEl = tabRefs.current[activeTab];
      if (activeEl) {
        setIndicatorStyle({
          left: activeEl.offsetLeft,
          width: activeEl.offsetWidth,
        });
      }
    };

    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    const timer = setTimeout(updateIndicator, 50);

    return () => {
      window.removeEventListener('resize', updateIndicator);
      clearTimeout(timer);
    };
  }, [activeTab, addresses.length, paymentMethods.length, vouchersList.length]);

  // Password validation metrics
  const passwordMetrics = useMemo(() => {
    const pwd = passwordForm.newPassword;
    const hasMinLength = pwd.length >= 8;
    const hasUppercase = /[A-Z]/.test(pwd);
    const hasNumber = /[0-9]/.test(pwd);
    const isMatching = passwordForm.confirmPassword && pwd === passwordForm.confirmPassword;

    let score = 0;
    if (hasMinLength) score++;
    if (hasUppercase) score++;
    if (hasNumber) score++;
    if (pwd.length >= 12) score++;

    let strength = 'weak';
    if (score >= 3) strength = 'strong';
    else if (score >= 2) strength = 'medium';

    return {
      hasMinLength,
      hasUppercase,
      hasNumber,
      isMatching,
      strength,
      isValid: hasMinLength && hasUppercase && hasNumber && isMatching,
    };
  }, [passwordForm.newPassword, passwordForm.confirmPassword]);

  if (!user) {
    return (
      <main className="profile-page-wrapper" style={{ textAlign: 'center', padding: '80px 16px' }}>
        <div style={{ maxWidth: '440px', margin: '0 auto', background: '#fff', padding: '40px 32px', borderRadius: '18px', border: '1px solid #e2e8f0', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: '#eff6ff', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', fontSize: '28px' }}>
            👤
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: 800, color: '#0f172a', margin: '0 0 8px' }}>
            {t('please_login_profile', 'Vui lòng đăng nhập để xem thông tin')}
          </h2>
          <p style={{ fontSize: '13.5px', color: '#64748b', margin: '0 0 24px' }}>
            Đăng nhập để quản lý đơn hàng, địa chỉ giao hàng và ví quà tặng cá nhân.
          </p>
          <Link to="/login" className="shopee-btn shopee-btn-primary" style={{ display: 'block', padding: '12px', fontWeight: 700 }}>
            Đăng Nhập Ngay
          </Link>
        </div>
      </main>
    );
  }

  // Handle Form Change
  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  // Avatar Selection Handlers
  const handleSelectPresetAvatar = (url) => {
    setAvatarPreview(url);
    setFormData((prev) => ({ ...prev, avatar: url }));
    showToast('Đã chọn ảnh đại diện mẫu! Nhấn "Lưu Thay Đổi" để cập nhật.', 'info');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Vui lòng chọn tệp hình ảnh hợp lệ (PNG, JPG, WEBP)!', 'error');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Kích thước ảnh tối đa là 2MB để đảm bảo tốc độ tải!', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result;
      setAvatarPreview(dataUrl);
      setFormData((prev) => ({ ...prev, avatar: dataUrl }));
      showToast('Đã tải ảnh lên! Nhấn "Lưu Thay Đổi" để áp dụng.', 'success');
    };
    reader.readAsDataURL(file);
  };

  const handleApplyCustomUrl = () => {
    if (!customAvatarUrl.trim()) return;
    setAvatarPreview(customAvatarUrl.trim());
    setFormData((prev) => ({ ...prev, avatar: customAvatarUrl.trim() }));
    setShowCustomAvatarInput(false);
    showToast('Đã áp dụng liên kết ảnh! Nhấn "Lưu Thay Đổi" để áp dụng.', 'info');
  };

  // Save Profile Handler
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setIsSubmittingProfile(true);

    try {
      await updateProfile(formData);
      showToast(t('profile_saved_success', 'Đã lưu thay đổi thông tin cá nhân thành công!'), 'success');
    } catch (err) {
      showToast(err.message || 'Lưu thông tin thất bại, vui lòng thử lại', 'error');
    } finally {
      setIsSubmittingProfile(false);
    }
  };

  // Address Handlers with Cascading Locations
  const handleSetDefaultAddress = (addrId) => {
    const updated = setDefaultAddress(addrId, user);
    setAddresses(updated);
    showToast('Đã đặt làm địa chỉ giao hàng mặc định!', 'success');
  };

  const handleDeleteAddress = (addrId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      const updated = deleteAddress(addrId, user);
      setAddresses(updated);
      showToast('Đã xóa địa chỉ thành công', 'info');
    }
  };

  const handleAddAddressSubmit = (e) => {
    e.preventDefault();
    if (!newAddressForm.name.trim() || !newAddressForm.phone.trim() || !newAddressForm.street.trim()) {
      showToast('Vui lòng điền đầy đủ họ tên, số điện thoại và số nhà/đường!', 'error');
      return;
    }

    const fullFormattedAddress = `${newAddressForm.street.trim()}, ${newAddressForm.ward}, ${newAddressForm.district}, ${newAddressForm.province}`;
    const payload = {
      name: newAddressForm.name.trim(),
      phone: newAddressForm.phone.trim(),
      address: fullFormattedAddress,
      tag: newAddressForm.tag,
      isDefault: newAddressForm.isDefault,
    };

    const updated = addAddress(payload, user);
    setAddresses(updated);
    setShowAddAddressModal(false);
    setNewAddressForm({
      name: '',
      phone: '',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      street: '',
      tag: 'Nhà riêng',
      isDefault: false,
    });
    showToast('Đã thêm địa chỉ giao hàng mới chuẩn xác thành công!', 'success');
  };

  const handleOpenEditModal = (addr) => {
    setEditingAddress(addr);
    setEditAddressForm({
      name: addr.name || addr.fullName || '',
      phone: addr.phone || '',
      province: 'TP. Hồ Chí Minh',
      district: 'Quận 1',
      ward: 'Phường Bến Nghé',
      street: addr.address || '',
      tag: addr.tag || 'Nhà riêng',
      isDefault: Boolean(addr.isDefault),
    });
    setShowEditAddressModal(true);
  };

  const handleEditAddressSubmit = (e) => {
    e.preventDefault();
    if (!editingAddress) return;
    if (!editAddressForm.name.trim() || !editAddressForm.phone.trim() || !editAddressForm.street.trim()) {
      showToast('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ!', 'error');
      return;
    }

    const fullFormattedAddress = editAddressForm.street.includes(editAddressForm.province)
      ? editAddressForm.street.trim()
      : `${editAddressForm.street.trim()}, ${editAddressForm.ward}, ${editAddressForm.district}, ${editAddressForm.province}`;

    const payload = {
      name: editAddressForm.name.trim(),
      phone: editAddressForm.phone.trim(),
      address: fullFormattedAddress,
      tag: editAddressForm.tag,
      isDefault: editAddressForm.isDefault,
    };

    const updated = updateAddress(editingAddress.id, payload, user);
    setAddresses(updated);
    setShowEditAddressModal(false);
    setEditingAddress(null);
    showToast('Đã cập nhật địa chỉ giao hàng thành công!', 'success');
  };

  // Payment Methods Handlers
  const handleAddPaymentSubmit = (e) => {
    e.preventDefault();
    if (newPaymentForm.type === 'bank' && !newPaymentForm.accountNumber.trim()) {
      showToast('Vui lòng nhập số tài khoản ngân hàng!', 'error');
      return;
    }
    if (newPaymentForm.type === 'card' && !newPaymentForm.accountNumber.trim()) {
      showToast('Vui lòng nhập số thẻ thanh toán!', 'error');
      return;
    }
    if (newPaymentForm.type === 'wallet' && !newPaymentForm.phone.trim()) {
      showToast('Vui lòng nhập số điện thoại đăng ký ví!', 'error');
      return;
    }

    const payload = {
      type: newPaymentForm.type,
      provider: newPaymentForm.provider,
      isDefault: newPaymentForm.isDefault,
      accountName: (newPaymentForm.accountName || user?.fullName || 'CHỦ TÀI KHOẢN').toUpperCase(),
    };

    if (newPaymentForm.type === 'bank') {
      payload.bankName = `Ngân hàng TMCP ${newPaymentForm.provider}`;
      const rawNum = newPaymentForm.accountNumber.replace(/\s+/g, '');
      payload.accountNumber = `**** **** ${rawNum.slice(-4) || '8899'}`;
      payload.icon = '🏛️';
      payload.color = '#006241';
    } else if (newPaymentForm.type === 'card') {
      payload.cardBrand = `${newPaymentForm.provider} Card`;
      const rawNum = newPaymentForm.accountNumber.replace(/\s+/g, '');
      payload.cardNumber = `**** **** **** ${rawNum.slice(-4) || '4242'}`;
      payload.expiry = newPaymentForm.expiry || '12/28';
      payload.icon = '💳';
      payload.color = '#1a1f71';
    } else {
      payload.walletName = `Ví ${newPaymentForm.provider} Pay`;
      payload.phone = newPaymentForm.phone || user?.phone || '0909 123 456';
      payload.icon = '👛';
      payload.color = '#a50064';
    }

    const updated = addPaymentMethod(payload, user);
    setPaymentMethods(updated);
    setShowAddPaymentModal(false);
    setNewPaymentForm({
      type: 'bank',
      provider: 'Vietcombank',
      accountNumber: '',
      accountName: '',
      expiry: '',
      phone: '',
      isDefault: false,
    });
    showToast('Đã liên kết phương thức thanh toán mới thành công!', 'success');
  };

  const handleSetDefaultPayment = (payId) => {
    const updated = setDefaultPaymentMethod(payId, user);
    setPaymentMethods(updated);
    showToast('Đã đặt làm phương thức thanh toán mặc định!', 'success');
  };

  const handleDeletePayment = (payId) => {
    if (window.confirm('Bạn có chắc chắn muốn hủy liên kết phương thức thanh toán này?')) {
      const updated = deletePaymentMethod(payId, user);
      setPaymentMethods(updated);
      showToast('Đã xóa phương thức thanh toán thành công', 'info');
    }
  };

  // Change Password Handler
  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!passwordForm.oldPassword) {
      showToast('Vui lòng nhập mật khẩu hiện tại', 'error');
      return;
    }

    if (!passwordMetrics.isValid) {
      showToast('Vui lòng đáp ứng đầy đủ yêu cầu mật khẩu mới!', 'error');
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await changePassword(passwordForm.oldPassword, passwordForm.newPassword);
      if (res.success) {
        showToast('Đổi mật khẩu thành công! Tài khoản của bạn đã được bảo vệ.', 'success');
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        showToast(res.error || 'Đổi mật khẩu thất bại', 'error');
      }
    } catch (err) {
      showToast(err.message || 'Lỗi kết nối máy chủ', 'error');
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Toggle 2FA Handler
  const handleToggle2FA = () => {
    const nextState = !twoFactorEnabled;
    setTwoFactorEnabled(nextState);
    try {
      localStorage.setItem('mini_shopee_2fa_enabled', String(nextState));
    } catch {}
    showToast(
      nextState
        ? '🛡️ Đã kích hoạt bảo mật 2 lớp (2FA)! Mã OTP sẽ được gửi khi đăng nhập từ thiết bị lạ.'
        : 'Đã tắt bảo mật 2 lớp.',
      nextState ? 'success' : 'info'
    );
  };

  // Logout other sessions handler
  const handleLogoutOtherSessions = () => {
    showToast('Đã hủy và đăng xuất thành công khỏi tất cả các thiết bị khác!', 'success');
  };

  // Voucher Saved toggle
  const handleToggleSaveVoucher = (code) => {
    setSavedVoucherCodes((prev) => {
      const isSaved = prev.includes(code);
      const next = isSaved ? prev.filter((c) => c !== code) : [...prev, code];
      try {
        localStorage.setItem('mini_shopee_saved_voucher_codes', JSON.stringify(next));
      } catch {}
      if (!isSaved) {
        showToast(`🎉 Đã lưu mã ${code} vào ví voucher cá nhân!`, 'success');
      } else {
        showToast(`Đã bỏ lưu mã ${code}`, 'info');
      }
      return next;
    });
  };

  // Display initial letter if no avatar
  const initialLetter = (user.fullName || user.email || 'U').charAt(0).toUpperCase();

  return (
    <main className="profile-page-wrapper" style={{ maxWidth: '1240px', margin: '0 auto', padding: '24px 16px' }}>
      <div className="account-portal-layout">
        {/* Left Sticky Navigation & Filter Sidebar */}
        <AccountSidebar
          activeSection={activeTab}
          onSelectTrackingView={() => navigate('/orders?view=tracking')}
          onSelectStatusTab={(tabId) => navigate(`/orders?tab=${tabId}`)}
          orderCounts={{
            all: ordersSummary.total,
            pending: 0,
            shipping: ordersSummary.processing,
            completed: ordersSummary.completed,
            returning: 0,
            cancelled: 0,
          }}
        />

        {/* Right Main Content Area */}
        <div className="account-portal-main-content">
          <div className="profile-hub-card">
        {/* ============================================================
            HEADER PROFILE HERO BANNER
            ============================================================ */}
        <div className="profile-header-banner">
          <div className="profile-banner-content">
            <div className="profile-user-summary">
              {/* Avatar with click-to-edit action */}
              <div
                className="profile-banner-avatar-wrapper"
                onClick={() => {
                  setActiveTab('profile');
                  fileInputRef.current?.click();
                }}
                title="Bấm để tải ảnh đại diện mới"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="profile-banner-avatar-img" />
                ) : (
                  <div className="profile-banner-avatar-fallback">{initialLetter}</div>
                )}
                <div className="profile-avatar-online-dot" title="Tài khoản đang hoạt động" />
                <div className="profile-avatar-edit-overlay">📷</div>
              </div>

              {/* User details & Loyalty Tier */}
              <div className="profile-user-details">
                <div className="profile-user-name-row">
                  <h1 className="profile-user-name">{user.fullName || user.email.split('@')[0]}</h1>
                  <span className={`profile-role-badge ${user.role || 'customer'}`}>
                    {user.role === 'admin' ? '🛡️ Super Admin' : user.role === 'seller' ? '🏪 Chủ Gian Hàng' : '✨ Thành Viên'}
                  </span>
                </div>

                <div className="profile-user-meta">
                  <span>✉️ {user.email}</span>
                  {user.phone && <span>· 📞 {user.phone}</span>}
                  <span>·</span>
                  <div className="profile-loyalty-tier" style={{ color: loyaltyTier.color }}>
                    <span>{loyaltyTier.icon}</span>
                    <span>{loyaltyTier.name}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Action Navigation Buttons */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="shopee-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontSize: '13px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => navigate('/orders')}
              >
                <PackageIcon size={15} /> Đơn Mua ({ordersSummary.total})
              </button>
              <button
                type="button"
                className="shopee-btn"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontSize: '13px',
                  padding: '8px 16px',
                  borderRadius: '10px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onClick={() => navigate('/wishlist')}
              >
                <HeartIcon size={15} /> Yêu Thích
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="profile-stats-grid">
            <div className="profile-stat-box" onClick={() => navigate('/orders')}>
              <div className="profile-stat-label">
                <PackageIcon size={14} /> Tổng Đơn Hàng
              </div>
              <div className="profile-stat-value">{ordersSummary.total} đơn</div>
            </div>

            <div className="profile-stat-box" onClick={() => navigate('/orders')}>
              <div className="profile-stat-label">
                <TruckIcon size={14} /> Đang Vận Chuyển
              </div>
              <div className="profile-stat-value">{ordersSummary.processing} đơn</div>
            </div>

            <div className="profile-stat-box" onClick={() => setActiveTab('coins')}>
              <div className="profile-stat-label">
                <CoinIcon size={14} /> Số Dư Shopee Xu
              </div>
              <div className="profile-stat-value" style={{ color: '#fde047' }}>
                {(coins || 0).toLocaleString('vi-VN')} Xu
              </div>
            </div>

            <div className="profile-stat-box" onClick={() => setActiveTab('vouchers')}>
              <div className="profile-stat-label">
                <TicketIcon size={14} /> Ví Voucher
              </div>
              <div className="profile-stat-value">{vouchersList.length || 5} mã</div>
            </div>
          </div>
        </div>

        {/* ============================================================
            SLIDING ANIMATED TABS BAR
            ============================================================ */}
        <div className="profile-tabs-nav-container">
          <div className="profile-tabs-list">
            <button
              ref={(el) => (tabRefs.current['profile'] = el)}
              type="button"
              className={`profile-tab-button ${activeTab === 'profile' ? 'active' : ''}`}
              onClick={() => setActiveTab('profile')}
            >
              <PencilIcon size={15} />
              <span>Thông Tin Cá Nhân</span>
            </button>

            <button
              ref={(el) => (tabRefs.current['addresses'] = el)}
              type="button"
              className={`profile-tab-button ${activeTab === 'addresses' ? 'active' : ''}`}
              onClick={() => setActiveTab('addresses')}
            >
              <MapPinIcon size={15} />
              <span>Sổ Địa Chỉ</span>
              <span className="profile-tab-badge">{addresses.length}</span>
            </button>

            <button
              ref={(el) => (tabRefs.current['payments'] = el)}
              type="button"
              className={`profile-tab-button ${activeTab === 'payments' ? 'active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              <CreditCardIcon size={15} />
              <span>Thanh Toán & Ngân Hàng</span>
              <span className="profile-tab-badge">{paymentMethods.length}</span>
            </button>

            <button
              ref={(el) => (tabRefs.current['security'] = el)}
              type="button"
              className={`profile-tab-button ${activeTab === 'security' ? 'active' : ''}`}
              onClick={() => setActiveTab('security')}
            >
              <LockIcon size={15} />
              <span>Bảo Mật & Mật Khẩu</span>
            </button>

            <button
              ref={(el) => (tabRefs.current['settings'] = el)}
              type="button"
              className={`profile-tab-button ${activeTab === 'settings' ? 'active' : ''}`}
              onClick={() => setActiveTab('settings')}
            >
              <ShieldIcon size={15} />
              <span>Cài Đặt & Quyền Riêng Tư</span>
            </button>

            <button
              ref={(el) => (tabRefs.current['vouchers'] = el)}
              type="button"
              className={`profile-tab-button ${activeTab === 'vouchers' ? 'active' : ''}`}
              onClick={() => setActiveTab('vouchers')}
            >
              <TicketIcon size={15} />
              <span>Ví Voucher</span>
              <span className="profile-tab-badge">{vouchersList.length || 5}</span>
            </button>

            <button
              ref={(el) => (tabRefs.current['coins'] = el)}
              type="button"
              className={`profile-tab-button ${activeTab === 'coins' ? 'active' : ''}`}
              onClick={() => setActiveTab('coins')}
            >
              <CoinIcon size={15} />
              <span>Ví Shopee Xu</span>
            </button>

            {/* The sliding indicator bar smoothly follows the active tab */}
            <div
              className="profile-tab-sliding-indicator"
              style={{
                left: `${indicatorStyle.left}px`,
                width: `${indicatorStyle.width}px`,
              }}
            />
          </div>
        </div>

        {/* ============================================================
            TAB 1: PERSONAL INFORMATION & AVATAR STUDIO
            ============================================================ */}
        {activeTab === 'profile' && (
          <div className="profile-tab-content-pane">
            {/* Profile Completeness Meter Card */}
            <div className="profile-completeness-card">
              <div className="profile-completeness-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '18px' }}>🏆</span>
                    <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                      Mức Độ Hoàn Thiện Hồ Sơ: {profileCompleteness.percentage}%
                    </strong>
                    {profileCompleteness.isComplete && (
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '10px' }}>
                        ✓ HOÀN HẢO
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12.5px', color: '#64748b', marginTop: '2px' }}>
                    {profileCompleteness.isComplete
                      ? 'Hồ sơ đã đạt 100%! Bạn nhận được độ uy tín tối đa và ưu đãi tốt nhất.'
                      : 'Hoàn tất đủ các thông tin bên dưới để nhận ngay phần thưởng +500 Shopee Xu!'}
                  </div>
                </div>

                {profileCompleteness.isComplete && !profileCompleteness.isBonusClaimed && (
                  <button
                    type="button"
                    onClick={handleClaimProfileBonus}
                    style={{
                      background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '8px 16px',
                      fontWeight: 700,
                      fontSize: '13px',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
                    }}
                  >
                    🎁 Nhận +500 Shopee Xu
                  </button>
                )}

                {profileCompleteness.isBonusClaimed && (
                  <span style={{ fontSize: '12.5px', color: '#059669', fontWeight: 700 }}>
                    ✨ Đã nhận thưởng +500 Xu
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="profile-completeness-bar-bg">
                <div
                  className={`profile-completeness-bar-fill ${profileCompleteness.isComplete ? 'complete' : ''}`}
                  style={{ width: `${profileCompleteness.percentage}%` }}
                />
              </div>

              {/* Task Milestones Chips */}
              <div className="profile-completeness-tasks">
                {profileCompleteness.tasks.map((task) => (
                  <div
                    key={task.id}
                    className={`profile-completeness-chip ${task.isDone ? 'done' : ''}`}
                    onClick={() => {
                      if (task.id === 'address') setActiveTab('addresses');
                      else if (task.id === 'payment') setActiveTab('payments');
                    }}
                    style={{ cursor: task.id === 'address' || task.id === 'payment' ? 'pointer' : 'default' }}
                  >
                    <span>{task.isDone ? '✓' : '○'}</span>
                    <span>{task.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Avatar Studio Box */}
            <div className="profile-avatar-studio-box">
              <div className="profile-studio-preview-col">
                <div className="profile-studio-avatar-circle">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar Preview" className="profile-studio-avatar-img" />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '36px', fontWeight: 800 }}>
                      {initialLetter}
                    </div>
                  )}
                </div>
                <span style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Ảnh đại diện hiện tại</span>
              </div>

              <div style={{ flex: 1 }}>
                <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
                  🎨 Studio Ảnh Đại Diện
                </h4>
                <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b', lineHeight: '1.4' }}>
                  Chọn một ảnh đại diện chuyên nghiệp từ bộ sưu tập mẫu, hoặc tải ảnh cá nhân từ thiết bị của bạn.
                </p>

                {/* Preset Avatars Row */}
                <div style={{ marginBottom: '14px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#475569', marginBottom: '8px' }}>
                    Bộ Sưu Tập Mẫu Sẵn Có:
                  </div>
                  <div className="profile-studio-presets-row">
                    {PRESET_AVATARS.map((p) => {
                      const isSelected = avatarPreview === p.url;
                      return (
                        <button
                          key={p.id}
                          type="button"
                          className={`profile-preset-avatar-btn ${isSelected ? 'selected' : ''}`}
                          onClick={() => handleSelectPresetAvatar(p.url)}
                          title={p.label}
                        >
                          <img src={p.url} alt={p.label} />
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* File Upload & Actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    style={{ fontSize: '12.5px', padding: '7px 14px', fontWeight: 600 }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    📁 Tải Ảnh Từ Máy
                  </button>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    style={{ fontSize: '12.5px', padding: '7px 14px', fontWeight: 600 }}
                    onClick={() => setShowCustomAvatarInput((prev) => !prev)}
                  >
                    🔗 Nhập URL Ảnh
                  </button>
                  {avatarPreview && (
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', padding: '6px 10px' }}
                      onClick={() => {
                        setAvatarPreview('');
                        setFormData((prev) => ({ ...prev, avatar: '' }));
                        showToast('Đã đặt lại ảnh đại diện mặc định.', 'info');
                      }}
                    >
                      Đặt lại
                    </button>
                  )}
                </div>

                {showCustomAvatarInput && (
                  <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                    <input
                      type="url"
                      placeholder="https://example.com/my-photo.jpg"
                      className="profile-form-input"
                      value={customAvatarUrl}
                      onChange={(e) => setCustomAvatarUrl(e.target.value)}
                      style={{ fontSize: '13px', padding: '8px 12px' }}
                    />
                    <button
                      type="button"
                      className="shopee-btn shopee-btn-primary"
                      style={{ fontSize: '13px', padding: '8px 16px', whiteSpace: 'nowrap' }}
                      onClick={handleApplyCustomUrl}
                    >
                      Áp Dụng
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleProfileSubmit}>
              <div className="profile-grid-2col">
                {/* Email (Disabled with verified status) */}
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="email">
                    Email Tài Khoản
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="email"
                      type="text"
                      className="profile-form-input"
                      value={formData.email}
                      disabled
                      style={{ paddingRight: '105px' }}
                    />
                    <span
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: '#dcfce7',
                        color: '#15803d',
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '3px 8px',
                        borderRadius: '6px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      ✓ Đã Xác Thực
                    </span>
                  </div>
                </div>

                {/* Full Name */}
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="fullName">
                    {t('full_name', 'Họ và tên')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    required
                    className="profile-form-input"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
              </div>

              <div className="profile-grid-2col">
                {/* Phone Number */}
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="phone">
                    {t('phone', 'Số điện thoại')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    className="profile-form-input"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="Ví dụ: 0909 123 456"
                  />
                </div>

                {/* Date of Birth */}
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="birthday">
                    Ngày Sinh
                  </label>
                  <input
                    id="birthday"
                    name="birthday"
                    type="date"
                    className="profile-form-input"
                    value={formData.birthday}
                    onChange={handleChange}
                  />
                </div>
              </div>

              {/* Gender Selection */}
              <div className="profile-form-group">
                <label className="profile-form-label">Giới Tính</label>
                <div className="profile-gender-group">
                  {[
                    { id: 'male', label: 'Nam', icon: '👨' },
                    { id: 'female', label: 'Nữ', icon: '👩' },
                    { id: 'other', label: 'Khác', icon: '🧑' },
                  ].map((g) => (
                    <div
                      key={g.id}
                      className={`profile-gender-option ${formData.gender === g.id ? 'selected' : ''}`}
                      onClick={() => setFormData((prev) => ({ ...prev, gender: g.id }))}
                    >
                      <span>{g.icon}</span>
                      <span>{g.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Default Address */}
              <div className="profile-form-group">
                <label className="profile-form-label" htmlFor="address">
                  {t('default_address', 'Địa chỉ mặc định')}
                </label>
                <textarea
                  id="address"
                  name="address"
                  className="profile-form-textarea"
                  rows={2}
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành phố"
                />
              </div>

              {/* Bio / Introduction */}
              <div className="profile-form-group">
                <label className="profile-form-label" htmlFor="bio">
                  Giới Thiệu Bản Thân (Bio)
                </label>
                <textarea
                  id="bio"
                  name="bio"
                  className="profile-form-textarea"
                  rows={2}
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Sở thích, câu châm ngôn hoặc ghi chú nhận hàng đặc biệt..."
                />
              </div>

              {/* Submit Button */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="submit"
                  disabled={isSubmittingProfile}
                  className="shopee-btn shopee-btn-primary"
                  style={{
                    padding: '11px 28px',
                    fontWeight: 700,
                    fontSize: '14px',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  {isSubmittingProfile ? 'Đang Lưu...' : '💾 Lưu Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ============================================================
            TAB 2: ADDRESS BOOK (WITH CASCADING LOCATIONS)
            ============================================================ */}
        {activeTab === 'addresses' && (
          <div className="profile-tab-content-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                  📍 Sổ Địa Chỉ Giao Hàng ({addresses.length})
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Địa chỉ giao hàng sẽ được tự động đồng bộ khi bạn tiến hành thanh toán giỏ hàng.
                </p>
              </div>

              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                style={{ fontSize: '13px', padding: '9px 18px', fontWeight: 700, borderRadius: '10px' }}
                onClick={() => setShowAddAddressModal(true)}
              >
                + Thêm Địa Chỉ Mới
              </button>
            </div>

            {/* Address List */}
            {addresses.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '48px 16px', background: '#f8fafc', borderRadius: '14px', border: '1px dashed #cbd5e1' }}>
                <div style={{ fontSize: '32px', marginBottom: '10px' }}>🏠</div>
                <div style={{ fontWeight: 700, fontSize: '15px', color: '#0f172a', marginBottom: '4px' }}>
                  Chưa có địa chỉ giao hàng nào
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px' }}>
                  Thêm địa chỉ ngay để việc thanh toán và giao nhận diễn ra nhanh chóng nhất.
                </p>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  onClick={() => setShowAddAddressModal(true)}
                >
                  Thêm Địa Chỉ Đầu Tiên
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    className={`profile-address-card ${addr.isDefault ? 'is-default' : ''}`}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', flexWrap: 'wrap' }}>
                        <strong style={{ fontSize: '15.5px', color: '#0f172a' }}>
                          {addr.name || addr.fullName}
                        </strong>
                        <span style={{ fontSize: '13.5px', color: '#64748b' }}>({addr.phone})</span>
                        <span className="profile-address-tag-pill">{addr.tag || 'Nhà riêng'}</span>
                        {addr.isDefault && (
                          <span className="profile-address-default-badge">✓ MẶC ĐỊNH</span>
                        )}
                      </div>
                      <div style={{ fontSize: '13.5px', color: '#334155', lineHeight: '1.5' }}>
                        📍 {addr.address}
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {!addr.isDefault && (
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-secondary"
                          style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px' }}
                          onClick={() => handleSetDefaultAddress(addr.id)}
                        >
                          Thiết Lập Mặc Định
                        </button>
                      )}
                      <button
                        type="button"
                        className="shopee-btn shopee-btn-secondary"
                        style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
                        onClick={() => handleOpenEditModal(addr)}
                        title="Chỉnh sửa địa chỉ"
                      >
                        ✏️ Sửa
                      </button>
                      <button
                        type="button"
                        style={{
                          background: 'transparent',
                          border: 'none',
                          color: '#ef4444',
                          fontSize: '16px',
                          cursor: 'pointer',
                          padding: '6px',
                          borderRadius: '6px',
                          transition: 'background 0.15s ease',
                        }}
                        onClick={() => handleDeleteAddress(addr.id)}
                        title="Xóa địa chỉ"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ============================================================
            TAB 3: PAYMENT METHODS & BANK ACCOUNTS HUB
            ============================================================ */}
        {activeTab === 'payments' && (
          <div className="profile-tab-content-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                  💳 Tài Khoản Ngân Hàng & Thẻ Thanh Toán ({paymentMethods.length})
                </h3>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                  Liên kết an toàn để thanh toán 1-chạm hoặc nhận tiền hoàn khi có yêu cầu trả hàng.
                </p>
              </div>

              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                style={{ fontSize: '13px', padding: '9px 18px', fontWeight: 700, borderRadius: '10px' }}
                onClick={() => setShowAddPaymentModal(true)}
              >
                + Thêm Thẻ / Tài Khoản Mới
              </button>
            </div>

            {/* Payment Methods Grid */}
            <div className="profile-payment-grid">
              {paymentMethods.map((pm) => (
                <div
                  key={pm.id}
                  className={`profile-payment-card ${pm.isDefault ? 'is-default' : ''}`}
                >
                  <div>
                    <div className="profile-payment-card-banner">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '20px' }}>{pm.icon || '💳'}</span>
                        <strong style={{ fontSize: '15px', color: '#0f172a' }}>
                          {pm.provider || pm.bankName || pm.cardBrand}
                        </strong>
                      </div>
                      <div className="profile-payment-card-chip">CHIP</div>
                    </div>

                    <div className="profile-payment-card-number">
                      {pm.accountNumber || pm.cardNumber || pm.phone}
                    </div>

                    <div style={{ fontSize: '12.5px', color: '#475569', textTransform: 'uppercase', fontWeight: 700 }}>
                      {pm.accountName || pm.cardHolder}
                    </div>
                  </div>

                  <div className="profile-payment-card-footer">
                    <div>
                      {pm.isDefault ? (
                        <span className="profile-address-default-badge">✓ MẶC ĐỊNH</span>
                      ) : (
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-secondary"
                          style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '6px' }}
                          onClick={() => handleSetDefaultPayment(pm.id)}
                        >
                          Đặt làm mặc định
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '14px', cursor: 'pointer', padding: '4px' }}
                      onClick={() => handleDeletePayment(pm.id)}
                      title="Xóa phương thức thanh toán"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 4: SECURITY & PASSWORD CHANGE (SECURITY HUB)
            ============================================================ */}
        {activeTab === 'security' && (
          <div className="profile-tab-content-pane">
            {/* Change Password Card */}
            <div className="profile-security-card">
              <h3 style={{ fontSize: '17px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
                🔑 Đổi Mật Khẩu Đăng Nhập
              </h3>
              <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 20px' }}>
                Để bảo vệ an toàn cho tài khoản và số dư ví, mật khẩu mới nên có độ dài tối thiểu 8 ký tự, bao gồm cả chữ in hoa và chữ số.
              </p>

              <form onSubmit={handleChangePasswordSubmit}>
                {/* Old Password */}
                <div className="profile-form-group">
                  <label className="profile-form-label" htmlFor="oldPassword">
                    Mật Khẩu Hiện Tại <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      id="oldPassword"
                      type={showOldPassword ? 'text' : 'password'}
                      required
                      className="profile-form-input"
                      value={passwordForm.oldPassword}
                      onChange={(e) => setPasswordForm((prev) => ({ ...prev, oldPassword: e.target.value }))}
                      placeholder="Nhập mật khẩu hiện tại"
                      style={{ paddingRight: '44px' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOldPassword((prev) => !prev)}
                      style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        color: '#64748b',
                        cursor: 'pointer',
                        fontSize: '15px',
                      }}
                    >
                      {showOldPassword ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                <div className="profile-grid-2col">
                  {/* New Password */}
                  <div className="profile-form-group">
                    <label className="profile-form-label" htmlFor="newPassword">
                      Mật Khẩu Mới <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        required
                        className="profile-form-input"
                        value={passwordForm.newPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, newPassword: e.target.value }))}
                        placeholder="Tối thiểu 8 ký tự"
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: '15px',
                        }}
                      >
                        {showNewPassword ? '🙈' : '👁️'}
                      </button>
                    </div>

                    {/* Password Strength Meter */}
                    {passwordForm.newPassword && (
                      <div className="profile-pwd-strength-container">
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
                          <span style={{ color: '#64748b' }}>Độ mạnh mật khẩu:</span>
                          <strong
                            style={{
                              color:
                                passwordMetrics.strength === 'strong'
                                  ? '#059669'
                                  : passwordMetrics.strength === 'medium'
                                  ? '#d97706'
                                  : '#dc2626',
                            }}
                          >
                            {passwordMetrics.strength === 'strong'
                              ? 'Rất mạnh'
                              : passwordMetrics.strength === 'medium'
                              ? 'Trung bình'
                              : 'Yếu'}
                          </strong>
                        </div>
                        <div className="profile-pwd-strength-bar">
                          <div className={`profile-pwd-strength-fill ${passwordMetrics.strength}`} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="profile-form-group">
                    <label className="profile-form-label" htmlFor="confirmPassword">
                      Xác Nhận Mật Khẩu Mới <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <div style={{ position: 'relative' }}>
                      <input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        className="profile-form-input"
                        value={passwordForm.confirmPassword}
                        onChange={(e) => setPasswordForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                        placeholder="Nhập lại mật khẩu mới"
                        style={{ paddingRight: '44px' }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        style={{
                          position: 'absolute',
                          right: '12px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          background: 'transparent',
                          border: 'none',
                          color: '#64748b',
                          cursor: 'pointer',
                          fontSize: '15px',
                        }}
                      >
                        {showConfirmPassword ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Password Criteria Checklist */}
                <div className="profile-pwd-hints-list">
                  <div className={`profile-pwd-hint-item ${passwordMetrics.hasMinLength ? 'valid' : ''}`}>
                    <span>{passwordMetrics.hasMinLength ? '✓' : '○'}</span>
                    <span>Độ dài từ 8 ký tự trở lên</span>
                  </div>
                  <div className={`profile-pwd-hint-item ${passwordMetrics.hasUppercase ? 'valid' : ''}`}>
                    <span>{passwordMetrics.hasUppercase ? '✓' : '○'}</span>
                    <span>Có ít nhất 1 chữ hoa (A-Z)</span>
                  </div>
                  <div className={`profile-pwd-hint-item ${passwordMetrics.hasNumber ? 'valid' : ''}`}>
                    <span>{passwordMetrics.hasNumber ? '✓' : '○'}</span>
                    <span>Có ít nhất 1 chữ số (0-9)</span>
                  </div>
                  {passwordForm.confirmPassword && (
                    <div className={`profile-pwd-hint-item ${passwordMetrics.isMatching ? 'valid' : ''}`}>
                      <span>{passwordMetrics.isMatching ? '✓' : '○'}</span>
                      <span>Mật khẩu xác nhận trùng khớp</span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                  <button
                    type="submit"
                    disabled={isChangingPassword || !passwordMetrics.isValid}
                    className="shopee-btn shopee-btn-primary"
                    style={{
                      padding: '10px 24px',
                      fontWeight: 700,
                      borderRadius: '10px',
                      opacity: !passwordMetrics.isValid ? 0.6 : 1,
                      cursor: !passwordMetrics.isValid ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {isChangingPassword ? 'Đang Xử Lý...' : 'Cập Nhật Mật Khẩu'}
                  </button>
                </div>
              </form>
            </div>

            {/* Two-Factor Authentication Card */}
            <div className="profile-security-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                      🛡️ Xác Thực Hai Yếu Tố (2FA)
                    </h3>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 700,
                        padding: '2px 8px',
                        borderRadius: '6px',
                        background: twoFactorEnabled ? '#dcfce7' : '#f1f5f9',
                        color: twoFactorEnabled ? '#15803d' : '#64748b',
                      }}
                    >
                      {twoFactorEnabled ? 'ĐÃ BẬT' : 'ĐANG TẮT'}
                    </span>
                  </div>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Tăng cường bảo vệ tài khoản bằng cách yêu cầu mã xác minh OTP qua email hoặc SMS khi đăng nhập thiết bị lạ.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleToggle2FA}
                  className={`shopee-btn ${twoFactorEnabled ? 'shopee-btn-secondary' : 'shopee-btn-primary'}`}
                  style={{ fontSize: '13px', padding: '8px 18px', fontWeight: 700, borderRadius: '10px' }}
                >
                  {twoFactorEnabled ? 'Tắt 2FA' : 'Kích Hoạt 2FA'}
                </button>
              </div>
            </div>

            {/* Active Sessions Management */}
            <div className="profile-security-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                    💻 Thiết Bị Đăng Nhập Hoạt Động
                  </h3>
                  <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>
                    Theo dõi danh sách các trình duyệt và thiết bị đang đăng nhập vào tài khoản của bạn.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleLogoutOtherSessions}
                  className="shopee-btn shopee-btn-secondary"
                  style={{ fontSize: '12.5px', padding: '7px 14px', borderRadius: '8px', color: '#dc2626' }}
                >
                  Đăng Xuất Phiên Khác
                </button>
              </div>

              {/* Current Session */}
              <div className="profile-session-item" style={{ borderLeft: '4px solid #10b981' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '24px' }}>💻</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>Windows PC · Google Chrome</span>
                      <span style={{ fontSize: '11px', background: '#dcfce7', color: '#15803d', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                        Phiên Hiện Tại
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      IP: 118.69.182.xx · TP. Hồ Chí Minh, Việt Nam · Đang hoạt động
                    </div>
                  </div>
                </div>
              </div>

              {/* Other Session 1 */}
              <div className="profile-session-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ fontSize: '24px' }}>📱</div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '14px', color: '#0f172a' }}>
                      iPhone 15 Pro · Safari Mobile
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
                      IP: 14.161.42.xx · TP. Hồ Chí Minh · Hoạt động 3 giờ trước
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '12.5px', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => showToast('Đã đăng xuất khỏi iPhone 15 Pro', 'info')}
                >
                  Đăng xuất
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 5: SETTINGS & PRIVACY
            ============================================================ */}
        {activeTab === 'settings' && (
          <div className="profile-tab-content-pane">
            <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 6px', color: '#0f172a' }}>
              ⚙️ Cài Đặt Thông Báo & Quyền Riêng Tư
            </h3>
            <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 24px' }}>
              Tùy chỉnh trải nghiệm nhận tin và bảo mật hiển thị thông tin khi mua sắm tại Shopee.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Setting 1: Order Web Notifications */}
              <div className="profile-setting-row">
                <div>
                  <strong style={{ fontSize: '14.5px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                    🔔 Thông báo đơn hàng trực tiếp trên Web
                  </strong>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Nhận thông báo nổi ngay khi người bán chuẩn bị hàng và giao cho Shipper.
                  </span>
                </div>
                <label className="profile-switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifyOrderWeb}
                    onChange={(e) => handleUpdateSetting('notifyOrderWeb', e.target.checked)}
                  />
                  <span className="profile-switch-slider" />
                </label>
              </div>

              {/* Setting 2: Email Updates */}
              <div className="profile-setting-row">
                <div>
                  <strong style={{ fontSize: '14.5px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                    ✉️ Cập nhật hóa đơn và đơn hàng qua Email
                  </strong>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Gửi hóa đơn điện tử VAT và mã vận đơn chi tiết vào hòm thư cá nhân.
                  </span>
                </div>
                <label className="profile-switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifyOrderEmail}
                    onChange={(e) => handleUpdateSetting('notifyOrderEmail', e.target.checked)}
                  />
                  <span className="profile-switch-slider" />
                </label>
              </div>

              {/* Setting 3: SMS Delivery */}
              <div className="profile-setting-row">
                <div>
                  <strong style={{ fontSize: '14.5px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                    📱 Tin nhắn SMS khi Shipper đến giao
                  </strong>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Nhận tin nhắn kèm số điện thoại tài xế SPX khi đơn bắt đầu phát.
                  </span>
                </div>
                <label className="profile-switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifyDeliverySMS}
                    onChange={(e) => handleUpdateSetting('notifyDeliverySMS', e.target.checked)}
                  />
                  <span className="profile-switch-slider" />
                </label>
              </div>

              {/* Setting 4: Daily Checkin Reminder */}
              <div className="profile-setting-row">
                <div>
                  <strong style={{ fontSize: '14.5px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                    🪙 Nhắc nhở điểm danh nhận Shopee Xu mỗi ngày
                  </strong>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Giữ vững chuỗi streak 7 ngày để không bỏ lỡ phần quà giá trị nhất.
                  </span>
                </div>
                <label className="profile-switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.notifyDailyCheckin}
                    onChange={(e) => handleUpdateSetting('notifyDailyCheckin', e.target.checked)}
                  />
                  <span className="profile-switch-slider" />
                </label>
              </div>

              {/* Setting 5: Anonymous Review */}
              <div className="profile-setting-row" style={{ borderLeft: '4px solid #2563eb' }}>
                <div>
                  <strong style={{ fontSize: '14.5px', color: '#0f172a', display: 'block', marginBottom: '2px' }}>
                    🕵️ Ẩn danh họ tên khi viết đánh giá sản phẩm
                  </strong>
                  <span style={{ fontSize: '12.5px', color: '#64748b' }}>
                    Bảo vệ sự riêng tư: Tên của bạn sẽ hiển thị dạng viết tắt (ví dụ: <code style={{ color: '#2563eb' }}>n***a</code>) trên trang chi tiết sản phẩm.
                  </span>
                </div>
                <label className="profile-switch-toggle">
                  <input
                    type="checkbox"
                    checked={settings.anonymousReview}
                    onChange={(e) => handleUpdateSetting('anonymousReview', e.target.checked)}
                  />
                  <span className="profile-switch-slider" />
                </label>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 6: VOUCHER WALLET
            ============================================================ */}
        {activeTab === 'vouchers' && (
          <div className="profile-tab-content-pane">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: '0 0 4px', color: '#0f172a' }}>
                  🎟️ Kho Voucher Của Tôi ({vouchersList.length || 5} mã)
                </h3>
                <span style={{ fontSize: '13px', color: '#64748b' }}>
                  Lưu voucher vào ví để hệ thống tự động gợi ý và áp dụng mức giảm tối đa khi mua hàng.
                </span>
              </div>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{ fontSize: '13px', padding: '8px 16px', borderRadius: '10px' }}
                onClick={() => navigate('/cart')}
              >
                🛒 Mua Sắm Ngay
              </button>
            </div>

            {/* Filter Pills */}
            <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '12px', marginBottom: '20px' }}>
              {[
                { id: 'all', label: `Tất cả (${vouchersList.length})` },
                { id: 'shipping', label: `🚚 Freeship (${vouchersList.filter((v) => v.type === 'shipping').length})` },
                { id: 'order', label: `🏷️ Giảm Giá Sàn (${vouchersList.filter((v) => v.type !== 'shipping' && v.isGlobal).length})` },
                { id: 'shop', label: `🏪 Voucher Shop (${vouchersList.filter((v) => !v.isGlobal && v.shopId).length})` },
                { id: 'saved', label: `⭐ Đã Lưu Trong Ví (${savedVoucherCodes.length})` },
              ].map((tab) => {
                const isActive = voucherFilterTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setVoucherFilterTab(tab.id)}
                    style={{
                      padding: '7px 16px',
                      borderRadius: '20px',
                      fontSize: '13px',
                      fontWeight: isActive ? 700 : 500,
                      border: isActive ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
                      background: isActive ? '#eff6ff' : '#ffffff',
                      color: isActive ? '#2563eb' : '#475569',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Voucher Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', gap: '16px' }}>
              {(vouchersList.length > 0 ? vouchersList : [
                { code: 'MINI10', name: 'Giảm 10% Toàn Sàn', type: 'order', value: 10, isPercentage: true, minOrderValue: 0, maxDiscount: 100000, expiryDate: '2026-12-31', description: 'Không giới hạn đơn tối thiểu, giảm tối đa 100k' },
                { code: 'FREESHIP', name: 'Miễn Phí Vận Chuyển', type: 'shipping', value: 30000, minOrderValue: 0, expiryDate: '2026-12-31', description: 'Giảm 30.000₫ phí ship toàn quốc cho mọi đơn' },
                { code: 'SUPERDEAL', name: 'Siêu Deal Giảm 15%', type: 'order', value: 15, isPercentage: true, minOrderValue: 150000, expiryDate: '2026-12-31', description: 'Ưu đãi giờ vàng, áp dụng cho mọi đơn hàng' },
                { code: 'SHOPGENZ', name: 'Voucher Shop Thời Trang', type: 'order', value: 20000, minOrderValue: 100000, expiryDate: '2026-12-31', description: 'Đơn từ 100k các sản phẩm Thời Trang GenZ' },
                { code: 'TECHDEAL', name: 'Voucher Công Nghệ 50k', type: 'order', value: 50000, minOrderValue: 200000, expiryDate: '2026-12-31', description: 'Đơn từ 200k thiết bị công nghệ TechWorld' },
              ])
                .filter((v) => {
                  if (voucherFilterTab === 'shipping') return v.type === 'shipping';
                  if (voucherFilterTab === 'order') return v.type !== 'shipping' && (v.isGlobal || !v.shopId);
                  if (voucherFilterTab === 'shop') return !v.isGlobal && v.shopId;
                  if (voucherFilterTab === 'saved') return savedVoucherCodes.includes(v.code);
                  return true;
                })
                .map((v) => {
                  const isSaved = savedVoucherCodes.includes(v.code);
                  const isShipping = v.type === 'shipping';
                  return (
                    <div
                      key={v.code || v.id}
                      style={{
                        background: '#ffffff',
                        border: isSaved ? '1.5px solid #2563eb' : '1px dashed #cbd5e1',
                        borderRadius: '14px',
                        padding: '18px',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      {/* Ticket Notches */}
                      <div
                        style={{
                          position: 'absolute',
                          left: '-8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      />
                      <div
                        style={{
                          position: 'absolute',
                          right: '-8px',
                          top: '50%',
                          transform: 'translateY(-50%)',
                          width: '16px',
                          height: '16px',
                          borderRadius: '50%',
                          background: '#f8fafc',
                          border: '1px solid #e2e8f0',
                        }}
                      />

                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 800,
                              textTransform: 'uppercase',
                              padding: '2px 8px',
                              borderRadius: '6px',
                              background: isShipping ? '#e0f2fe' : '#eff6ff',
                              color: isShipping ? '#0369a1' : '#2563eb',
                            }}
                          >
                            {isShipping ? '🚚 Freeship' : v.shopId ? '🏪 Voucher Shop' : '🏷️ Voucher Sàn'}
                          </span>
                          <strong style={{ fontSize: '15px', color: '#2563eb', letterSpacing: '0.5px' }}>
                            {v.code}
                          </strong>
                        </div>

                        <div style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
                          {v.name || v.title}
                        </div>

                        <div style={{ fontSize: '12.5px', color: '#64748b', lineHeight: '1.4', marginBottom: '8px' }}>
                          {v.description || v.desc}
                        </div>

                        <div style={{ fontSize: '11.5px', color: '#94a3b8', marginBottom: '14px' }}>
                          {v.minOrderValue > 0 ? `Đơn tối thiểu: ${formatCurrency(v.minOrderValue)}` : 'Đơn tối thiểu: 0₫'} · HSD: {v.expiryDate || '31/12/2026'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleSaveVoucher(v.code)}
                          style={{
                            flex: 1,
                            padding: '7px 10px',
                            borderRadius: '8px',
                            fontSize: '12.5px',
                            fontWeight: 700,
                            border: isSaved ? '1px solid #10b981' : '1px solid #cbd5e1',
                            background: isSaved ? '#ecfdf5' : '#ffffff',
                            color: isSaved ? '#059669' : '#475569',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {isSaved ? '✓ Đã Lưu' : '📥 Lưu Mã'}
                        </button>
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-primary"
                          style={{ fontSize: '12.5px', padding: '7px 14px', fontWeight: 700, borderRadius: '8px' }}
                          onClick={() => {
                            navigator.clipboard?.writeText(v.code);
                            showToast(`Đã sao chép mã ${v.code}! Chuyển đến giỏ hàng...`, 'success');
                            navigate('/cart');
                          }}
                        >
                          Dùng Ngay
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* ============================================================
            TAB 7: MINI XU & REWARDS HUB
            ============================================================ */}
        {activeTab === 'coins' && (
          <div className="profile-tab-content-pane">
            {/* Tech Luxury Balance Card */}
            <div
              style={{
                background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #172554 100%)',
                color: '#fff',
                borderRadius: '18px',
                padding: '28px 32px',
                boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.25)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '20px',
                marginBottom: '28px',
                border: '1px solid rgba(251, 191, 36, 0.25)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span style={{ fontSize: '28px' }}>🪙</span>
                  <span style={{ fontSize: '13.5px', textTransform: 'uppercase', letterSpacing: '1px', color: '#fde047', fontWeight: 800 }}>
                    Ví Shopee Xu Tích Lũy
                  </span>
                </div>
                <div style={{ fontSize: '38px', fontWeight: 900, color: '#fbbf24', letterSpacing: '-0.5px' }}>
                  {(coins || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '20px', fontWeight: 600, color: '#fef08a' }}>Xu</span>
                </div>
                <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
                  ≈ {formatCurrency(coins || 0)} (Tỷ lệ 1 Xu = 1 VND, cấn trừ trực tiếp tới 50% giá trị đơn hàng)
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setShowSpinModal(true)}
                  style={{
                    background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '12px 22px',
                    fontWeight: 800,
                    fontSize: '14px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    boxShadow: '0 4px 14px rgba(245, 158, 11, 0.4)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}
                >
                  <span>🎡</span> Vòng Quay May Mắn
                </button>

                <button
                  type="button"
                  disabled={hasCheckedInToday}
                  onClick={() => {
                    const res = checkInToday();
                    if (res?.success) {
                      showToast(`🎉 Điểm danh thành công! Nhận ngay +${res.reward.toLocaleString('vi-VN')} Xu`, 'success');
                    } else {
                      showToast('Hôm nay bạn đã điểm danh rồi!', 'info');
                    }
                  }}
                  style={{
                    background: hasCheckedInToday ? '#334155' : 'rgba(255, 255, 255, 0.15)',
                    color: hasCheckedInToday ? '#94a3b8' : '#ffffff',
                    border: hasCheckedInToday ? '1px solid #475569' : '1px solid rgba(255, 255, 255, 0.3)',
                    borderRadius: '12px',
                    padding: '12px 22px',
                    fontWeight: 700,
                    fontSize: '14px',
                    cursor: hasCheckedInToday ? 'default' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>📅</span> {hasCheckedInToday ? 'Đã Điểm Danh Hôm Nay' : 'Điểm Danh Nhận Xu'}
                </button>
              </div>
            </div>

            {/* 7-Day Streak Section */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
                marginBottom: '28px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                    📅 Chuỗi Điểm Danh 7 Ngày Nhận Thưởng
                  </h4>
                  <p style={{ margin: 0, fontSize: '13px', color: '#64748b' }}>
                    Duy trì điểm danh đều đặn không ngắt quãng để nhận quà giá trị cao nhất (+5,000 Xu) vào ngày thứ 7.
                  </p>
                </div>
                <div style={{ background: '#fef3c7', color: '#92400e', padding: '5px 14px', borderRadius: '20px', fontSize: '12.5px', fontWeight: 700 }}>
                  Chuỗi hiện tại: {streak}/7 ngày 🔥
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(90px, 1fr))', gap: '10px' }}>
                {[
                  { day: 1, reward: 500 },
                  { day: 2, reward: 1000 },
                  { day: 3, reward: 1500 },
                  { day: 4, reward: 2000 },
                  { day: 5, reward: 2500 },
                  { day: 6, reward: 3000 },
                  { day: 7, reward: 5000, special: true },
                ].map((item) => {
                  const isChecked = item.day <= streak;
                  const isNext = item.day === streak + 1 && !hasCheckedInToday;

                  return (
                    <div
                      key={item.day}
                      style={{
                        padding: '14px 10px',
                        borderRadius: '12px',
                        textAlign: 'center',
                        background: isChecked
                          ? 'rgba(16, 185, 129, 0.1)'
                          : isNext
                          ? 'rgba(37, 99, 235, 0.08)'
                          : '#f8fafc',
                        border: isChecked
                          ? '1.5px solid #10b981'
                          : isNext
                          ? '1.5px solid #2563eb'
                          : '1px solid #e2e8f0',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', marginBottom: '6px' }}>
                        Ngày {item.day}
                      </div>
                      <div style={{ fontSize: '20px', marginBottom: '4px' }}>
                        {isChecked ? '✅' : item.special ? '🎁' : '🪙'}
                      </div>
                      <div
                        style={{
                          fontSize: '12.5px',
                          fontWeight: 800,
                          color: isChecked ? '#059669' : item.special ? '#d97706' : '#0f172a',
                        }}
                      >
                        +{item.reward.toLocaleString('vi-VN')}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Coin Transaction History */}
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '14px',
                padding: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: '#0f172a' }}>
                  📜 Lịch Sử Biến Động Shopee Xu
                </h4>

                <div style={{ display: 'flex', gap: '6px' }}>
                  {[
                    { id: 'all', label: 'Tất cả' },
                    { id: 'in', label: 'Nhận xu (+)' },
                    { id: 'out', label: 'Dùng xu (-)' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setCoinFilter(f.id)}
                      style={{
                        padding: '4px 12px',
                        borderRadius: '16px',
                        fontSize: '12px',
                        fontWeight: coinFilter === f.id ? 700 : 500,
                        border: coinFilter === f.id ? '1px solid #2563eb' : '1px solid #e2e8f0',
                        background: coinFilter === f.id ? '#eff6ff' : 'transparent',
                        color: coinFilter === f.id ? '#2563eb' : '#64748b',
                        cursor: 'pointer',
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              {(!coinHistory || coinHistory.length === 0) ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: '#64748b', fontSize: '13px' }}>
                  Chưa có giao dịch xu nào. Hãy điểm danh hàng ngày hoặc quay Vòng quay may mắn!
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {coinHistory
                    .filter((rec) => {
                      const isPlus = rec.type === 'plus' || rec.type === 'credit' || rec.isCredit;
                      if (coinFilter === 'in') return isPlus;
                      if (coinFilter === 'out') return !isPlus;
                      return true;
                    })
                    .slice(0, 15)
                    .map((record) => {
                      const isPlus = record.type === 'plus' || record.type === 'credit' || record.isCredit;
                      const desc = record.desc || record.description || 'Giao dịch Shopee Xu';
                      const time = record.date || record.timestamp || '';
                      const getIcon = () => {
                        if (record.category === 'checkin' || desc.includes('Điểm danh')) return '📅';
                        if (record.category === 'spin' || desc.includes('Vòng Quay') || desc.includes('quay')) return '🎡';
                        if (record.category === 'order' || desc.includes('đơn hàng') || desc.includes('thanh toán')) return '🛒';
                        if (record.category === 'welcome' || desc.includes('chào mừng')) return '🌟';
                        return isPlus ? '🪙' : '💸';
                      };

                      return (
                        <div
                          key={record.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '12px 16px',
                            borderRadius: '10px',
                            background: '#f8fafc',
                            fontSize: '13px',
                            border: '1px solid #e2e8f0',
                            transition: 'background 0.15s ease',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '50%',
                                background: isPlus ? 'rgba(16, 185, 129, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '17px',
                                flexShrink: 0,
                              }}
                            >
                              {getIcon()}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0f172a' }}>{desc}</div>
                              <div style={{ fontSize: '11.5px', color: '#64748b', marginTop: '2px' }}>
                                {time}
                              </div>
                            </div>
                          </div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: '15px',
                              color: isPlus ? '#059669' : '#dc2626',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isPlus ? '+' : '-'}{Math.abs(record.amount).toLocaleString('vi-VN')} Xu
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      </div>

      {/* Rewards Hub Modal (Spin Wheel & Rewards) */}
      {showSpinModal && (
        <RewardsHubModal onClose={() => setShowSpinModal(false)} />
      )}

      {/* ============================================================
          MODAL: ADD NEW ADDRESS (CASCADING PROVINCE/DISTRICT/WARD)
          ============================================================ */}
      {showAddAddressModal && (
        <div className="profile-modal-backdrop" onClick={() => setShowAddAddressModal(false)}>
          <div className="profile-modal-window" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3 className="profile-modal-title">Thêm Địa Chỉ Giao Hàng Mới</h3>
              <button
                type="button"
                className="profile-modal-close-btn"
                onClick={() => setShowAddAddressModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddressSubmit}>
              <div className="profile-modal-body">
                <div className="profile-grid-2col">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Tên Người Nhận <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      required
                      className="profile-form-input"
                      placeholder="Ví dụ: Nguyễn Văn A"
                      value={newAddressForm.name}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Số Điện Thoại <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="tel"
                      required
                      className="profile-form-input"
                      placeholder="Ví dụ: 0909 123 456"
                      value={newAddressForm.phone}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                {/* Cascading 3-col Location Selectors */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Khu Vực Hành Chính (Tỉnh / Huyện / Xã) <span style={{ color: '#ef4444' }}>*</span></label>
                  <div className="profile-location-grid">
                    {/* Province Selector */}
                    <div>
                      <select
                        className="profile-form-select"
                        value={newAddressForm.province}
                        onChange={(e) => {
                          const provName = e.target.value;
                          const districts = getDistrictsByProvince(provName);
                          const firstDist = districts[0]?.name || '';
                          const wards = getWardsByDistrict(provName, firstDist);
                          const firstWard = wards[0] || '';
                          setNewAddressForm((prev) => ({
                            ...prev,
                            province: provName,
                            district: firstDist,
                            ward: firstWard,
                          }));
                        }}
                      >
                        {VIETNAM_PROVINCES.map((p) => (
                          <option key={p.id} value={p.name}>{p.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* District Selector */}
                    <div>
                      <select
                        className="profile-form-select"
                        value={newAddressForm.district}
                        onChange={(e) => {
                          const distName = e.target.value;
                          const wards = getWardsByDistrict(newAddressForm.province, distName);
                          setNewAddressForm((prev) => ({
                            ...prev,
                            district: distName,
                            ward: wards[0] || '',
                          }));
                        }}
                      >
                        {getDistrictsByProvince(newAddressForm.province).map((d) => (
                          <option key={d.id} value={d.name}>{d.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Ward Selector */}
                    <div>
                      <select
                        className="profile-form-select"
                        value={newAddressForm.ward}
                        onChange={(e) => setNewAddressForm((prev) => ({ ...prev, ward: e.target.value }))}
                      >
                        {getWardsByDistrict(newAddressForm.province, newAddressForm.district).map((w) => (
                          <option key={w} value={w}>{w}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Street Address */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Số Nhà & Tên Đường <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    required
                    className="profile-form-input"
                    placeholder="Ví dụ: Số 45 Lê Lợi hoặc Tòa nhà Landmark 81"
                    value={newAddressForm.street}
                    onChange={(e) => setNewAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Nhãn Địa Chỉ</label>
                  <select
                    className="profile-form-select"
                    value={newAddressForm.tag}
                    onChange={(e) => setNewAddressForm((prev) => ({ ...prev, tag: e.target.value }))}
                  >
                    <option value="Nhà riêng">Nhà riêng</option>
                    <option value="Văn phòng">Văn phòng</option>
                    <option value="Kho hàng">Kho hàng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="profile-form-group" style={{ marginTop: '12px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                    <input
                      type="checkbox"
                      checked={newAddressForm.isDefault}
                      onChange={(e) => setNewAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                    />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Đặt làm địa chỉ giao hàng mặc định</span>
                  </label>
                </div>
              </div>

              <div className="profile-modal-footer">
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setShowAddAddressModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="shopee-btn shopee-btn-primary">
                  Lưu Địa Chỉ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: EDIT ADDRESS
          ============================================================ */}
      {showEditAddressModal && editingAddress && (
        <div className="profile-modal-backdrop" onClick={() => { setShowEditAddressModal(false); setEditingAddress(null); }}>
          <div className="profile-modal-window" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3 className="profile-modal-title">Chỉnh Sửa Địa Chỉ Giao Hàng</h3>
              <button
                type="button"
                className="profile-modal-close-btn"
                onClick={() => {
                  setShowEditAddressModal(false);
                  setEditingAddress(null);
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditAddressSubmit}>
              <div className="profile-modal-body">
                <div className="profile-grid-2col">
                  <div className="profile-form-group">
                    <label className="profile-form-label">Tên Người Nhận <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="text"
                      required
                      className="profile-form-input"
                      value={editAddressForm.name}
                      onChange={(e) => setEditAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </div>

                  <div className="profile-form-group">
                    <label className="profile-form-label">Số Điện Thoại <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="tel"
                      required
                      className="profile-form-input"
                      value={editAddressForm.phone}
                      onChange={(e) => setEditAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Địa Chỉ Chi Tiết <span style={{ color: '#ef4444' }}>*</span></label>
                  <textarea
                    required
                    rows="3"
                    className="profile-form-textarea"
                    value={editAddressForm.street}
                    onChange={(e) => setEditAddressForm((prev) => ({ ...prev, street: e.target.value }))}
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Nhãn Địa Chỉ</label>
                  <select
                    className="profile-form-select"
                    value={editAddressForm.tag}
                    onChange={(e) => setEditAddressForm((prev) => ({ ...prev, tag: e.target.value }))}
                  >
                    <option value="Nhà riêng">Nhà riêng</option>
                    <option value="Văn phòng">Văn phòng</option>
                    <option value="Kho hàng">Kho hàng</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div className="profile-form-group" style={{ marginTop: '12px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                    <input
                      type="checkbox"
                      checked={editAddressForm.isDefault}
                      onChange={(e) => setEditAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                    />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Đặt làm địa chỉ giao hàng mặc định</span>
                  </label>
                </div>
              </div>

              <div className="profile-modal-footer">
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => {
                    setShowEditAddressModal(false);
                    setEditingAddress(null);
                  }}
                >
                  Hủy
                </button>
                <button type="submit" className="shopee-btn shopee-btn-primary">
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          MODAL: ADD PAYMENT METHOD (BANK / CARD / WALLET)
          ============================================================ */}
      {showAddPaymentModal && (
        <div className="profile-modal-backdrop" onClick={() => setShowAddPaymentModal(false)}>
          <div className="profile-modal-window" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3 className="profile-modal-title">Liên Kết Phương Thức Thanh Toán</h3>
              <button
                type="button"
                className="profile-modal-close-btn"
                onClick={() => setShowAddPaymentModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPaymentSubmit}>
              <div className="profile-modal-body">
                {/* Method Type Selection */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Loại Phương Thức</label>
                  <div className="profile-gender-group">
                    {[
                      { id: 'bank', label: 'Ngân Hàng', icon: '🏛️' },
                      { id: 'card', label: 'Thẻ Quốc Tế', icon: '💳' },
                      { id: 'wallet', label: 'Ví Điện Tử', icon: '👛' },
                    ].map((m) => (
                      <div
                        key={m.id}
                        className={`profile-gender-option ${newPaymentForm.type === m.id ? 'selected' : ''}`}
                        onClick={() => setNewPaymentForm((prev) => ({ ...prev, type: m.id }))}
                      >
                        <span>{m.icon}</span>
                        <span>{m.label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bank / Card Provider Selector */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Đơn Vị Cung Cấp</label>
                  <select
                    className="profile-form-select"
                    value={newPaymentForm.provider}
                    onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, provider: e.target.value }))}
                  >
                    {newPaymentForm.type === 'bank' && (
                      <>
                        <option value="Vietcombank">Vietcombank (Ngoại Thương)</option>
                        <option value="MB Bank">MB Bank (Quân Đội)</option>
                        <option value="Techcombank">Techcombank (Kỹ Thương)</option>
                        <option value="ACB">ACB (Á Châu)</option>
                        <option value="VPBank">VPBank (Việt Nam Thịnh Vượng)</option>
                        <option value="BIDV">BIDV (Đầu Tư & Phát Triển)</option>
                      </>
                    )}
                    {newPaymentForm.type === 'card' && (
                      <>
                        <option value="Visa">Visa (Thẻ Tín Dụng / Ghi Nợ)</option>
                        <option value="Mastercard">Mastercard</option>
                        <option value="JCB">JCB International</option>
                      </>
                    )}
                    {newPaymentForm.type === 'wallet' && (
                      <>
                        <option value="MoMo">Ví MoMo Pay</option>
                        <option value="ShopeePay">Ví ShopeePay</option>
                        <option value="ZaloPay">Ví ZaloPay</option>
                      </>
                    )}
                  </select>
                </div>

                {/* Account / Card / Phone Input */}
                {newPaymentForm.type !== 'wallet' ? (
                  <div className="profile-form-group">
                    <label className="profile-form-label">
                      {newPaymentForm.type === 'bank' ? 'Số Tài Khoản Ngân Hàng' : 'Số Thẻ (16 chữ số)'} <span style={{ color: '#ef4444' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      className="profile-form-input"
                      placeholder={newPaymentForm.type === 'bank' ? 'Ví dụ: 0071000123456' : 'Ví dụ: 4111 2222 3333 4444'}
                      value={newPaymentForm.accountNumber}
                      onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, accountNumber: e.target.value }))}
                    />
                  </div>
                ) : (
                  <div className="profile-form-group">
                    <label className="profile-form-label">Số Điện Thoại Ví <span style={{ color: '#ef4444' }}>*</span></label>
                    <input
                      type="tel"
                      required
                      className="profile-form-input"
                      placeholder="Ví dụ: 0909 123 456"
                      value={newPaymentForm.phone}
                      onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, phone: e.target.value }))}
                    />
                  </div>
                )}

                {/* Account Name */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Tên Chủ Tài Khoản / Thẻ <span style={{ color: '#ef4444' }}>*</span></label>
                  <input
                    type="text"
                    required
                    className="profile-form-input"
                    placeholder="Ví dụ: NGUYEN VAN A (viết hoa không dấu)"
                    value={newPaymentForm.accountName}
                    onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, accountName: e.target.value.toUpperCase() }))}
                  />
                </div>

                {/* Card Expiry */}
                {newPaymentForm.type === 'card' && (
                  <div className="profile-form-group">
                    <label className="profile-form-label">Ngày Hết Hạn (MM/YY)</label>
                    <input
                      type="text"
                      className="profile-form-input"
                      placeholder="Ví dụ: 12/28"
                      value={newPaymentForm.expiry}
                      onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, expiry: e.target.value }))}
                    />
                  </div>
                )}

                <div className="profile-form-group" style={{ marginTop: '12px' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px' }}>
                    <input
                      type="checkbox"
                      checked={newPaymentForm.isDefault}
                      onChange={(e) => setNewPaymentForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                      style={{ width: '16px', height: '16px', accentColor: '#2563eb' }}
                    />
                    <span style={{ fontWeight: 600, color: '#0f172a' }}>Đặt làm phương thức thanh toán mặc định</span>
                  </label>
                </div>
              </div>

              <div className="profile-modal-footer">
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setShowAddPaymentModal(false)}
                >
                  Hủy
                </button>
                <button type="submit" className="shopee-btn shopee-btn-primary">
                  Liên Kết Ngay
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
