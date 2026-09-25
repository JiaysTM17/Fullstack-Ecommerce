import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatCurrency';
import '../styles/auth.css';

const SAVED_ADDRESSES_KEY = 'mini_shopee_saved_addresses';

const INITIAL_ADDRESSES = [
  {
    id: 'addr_01',
    name: 'Nguyễn Văn Khách',
    phone: '0909 123 456',
    address: 'Số 123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
    tag: 'Nhà riêng',
    isDefault: true,
  },
  {
    id: 'addr_02',
    name: 'Nguyễn Văn Khách (Văn phòng)',
    phone: '0909 123 456',
    address: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh',
    tag: 'Văn phòng',
    isDefault: false,
  },
];

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState('profile'); // 'profile' | 'addresses' | 'vouchers' | 'orders'

  // Tab 1: Profile form state
  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || '',
  });

  // Tab 2: Address book state
  const [addresses, setAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem(SAVED_ADDRESSES_KEY);
      return saved ? JSON.parse(saved) : INITIAL_ADDRESSES;
    } catch {
      return INITIAL_ADDRESSES;
    }
  });

  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    name: '',
    phone: '',
    address: '',
    tag: 'Nhà riêng',
  });

  // Save addresses to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(SAVED_ADDRESSES_KEY, JSON.stringify(addresses));
    } catch {
      // ignore
    }
  }, [addresses]);

  if (!user) {
    return (
      <main className="shopee-container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>{t('please_login_profile', 'Vui lòng đăng nhập để xem thông tin cá nhân')}</h2>
        <Link to="/login" className="shopee-btn shopee-btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>
          Đăng Nhập Ngay
        </Link>
      </main>
    );
  }

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    showToast(t('profile_saved_success', 'Đã lưu thay đổi thông tin cá nhân thành công!'), 'success');
  };

  const handleSetDefaultAddress = (addrId) => {
    setAddresses((prev) =>
      prev.map((a) => ({
        ...a,
        isDefault: a.id === addrId,
      }))
    );
    showToast('Đã đặt làm địa chỉ giao hàng mặc định!', 'success');
  };

  const handleDeleteAddress = (addrId) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa địa chỉ này?')) {
      setAddresses((prev) => prev.filter((a) => a.id !== addrId));
      showToast('Đã xóa địa chỉ thành công', 'info');
    }
  };

  const handleAddAddressSubmit = (e) => {
    e.preventDefault();
    if (!newAddressForm.name || !newAddressForm.phone || !newAddressForm.address) return;

    const newAddr = {
      id: `addr_${Date.now()}`,
      ...newAddressForm,
      isDefault: addresses.length === 0,
    };

    setAddresses((prev) => [...prev, newAddr]);
    setShowAddAddressModal(false);
    setNewAddressForm({ name: '', phone: '', address: '', tag: 'Nhà riêng' });
    showToast('Đã thêm địa chỉ giao hàng mới thành công!', 'success');
  };

  return (
    <main className="shopee-container" style={{ padding: '36px 16px', maxWidth: '880px' }}>
      {/* Account Hub Card */}
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border-medium, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        {/* Header Profile Summary */}
        <div
          style={{
            padding: '24px 28px',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                background: 'var(--primary-color, #ea580c)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '24px',
                fontWeight: 800,
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.4)',
              }}
            >
              {(user.fullName || user.email)[0].toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                {user.fullName || user.email}
              </h2>
              <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>✉️ {user.email}</span>
                <span>·</span>
                <span style={{ background: 'rgba(255,255,255,0.15)', padding: '1px 8px', borderRadius: '10px', fontSize: '11px', fontWeight: 700 }}>
                  {user.role === 'admin' ? '🛡️ Super Admin' : user.role === 'seller' ? '🏪 Chủ Shop' : '🛒 Thành Viên'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              style={{ fontSize: '12.5px', padding: '6px 14px' }}
              onClick={() => navigate('/orders')}
            >
              📦 Xem Đơn Mua
            </button>
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              style={{ fontSize: '12.5px', padding: '6px 14px' }}
              onClick={() => navigate('/wishlist')}
            >
              ❤️ Yêu Thích
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          style={{
            display: 'flex',
            borderBottom: '1px solid var(--border-medium, #e2e8f0)',
            background: 'var(--bg-muted, #f8fafc)',
            overflowX: 'auto',
          }}
        >
          <button
            type="button"
            style={{
              padding: '14px 24px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: activeTab === 'profile' ? 700 : 500,
              color: activeTab === 'profile' ? 'var(--primary-color, #ea580c)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'profile' ? '2.5px solid var(--primary-color, #ea580c)' : '2.5px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setActiveTab('profile')}
          >
            👤 Thông Tin Cá Nhân
          </button>

          <button
            type="button"
            style={{
              padding: '14px 24px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: activeTab === 'addresses' ? 700 : 500,
              color: activeTab === 'addresses' ? 'var(--primary-color, #ea580c)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'addresses' ? '2.5px solid var(--primary-color, #ea580c)' : '2.5px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setActiveTab('addresses')}
          >
            📍 Sổ Địa Chỉ Giao Hàng ({addresses.length})
          </button>

          <button
            type="button"
            style={{
              padding: '14px 24px',
              border: 'none',
              background: 'transparent',
              fontSize: '14px',
              fontWeight: activeTab === 'vouchers' ? 700 : 500,
              color: activeTab === 'vouchers' ? 'var(--primary-color, #ea580c)' : 'var(--text-secondary)',
              borderBottom: activeTab === 'vouchers' ? '2.5px solid var(--primary-color, #ea580c)' : '2.5px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
            onClick={() => setActiveTab('vouchers')}
          >
            🎟️ Ví Voucher Của Tôi
          </button>
        </div>

        {/* Tab 1: Profile Information */}
        {activeTab === 'profile' && (
          <div style={{ padding: '28px' }}>
            <form onSubmit={handleProfileSubmit}>
              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="email">Email Tài Khoản</label>
                <input
                  id="email"
                  type="text"
                  className="shopee-form-input"
                  value={formData.email}
                  disabled
                  style={{ background: 'var(--bg-muted, #f1f5f9)', color: 'var(--text-muted, #94a3b8)', cursor: 'not-allowed' }}
                />
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="fullName">{t('full_name', 'Họ và tên')}</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  className="shopee-form-input"
                  value={formData.fullName}
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
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label" htmlFor="address">{t('default_address', 'Địa chỉ mặc định')}</label>
                <textarea
                  id="address"
                  name="address"
                  className="shopee-form-input"
                  rows={3}
                  value={formData.address}
                  onChange={handleChange}
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                />
              </div>

              <button type="submit" className="shopee-btn shopee-btn-primary" style={{ marginTop: '16px', padding: '10px 24px', fontWeight: 700 }}>
                {t('save_changes', 'Lưu Thay Đổi')}
              </button>
            </form>
          </div>
        )}

        {/* Tab 2: Address Book */}
        {activeTab === 'addresses' && (
          <div style={{ padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Danh Sách Địa Chỉ Nhận Hàng
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                  Địa chỉ sẽ được tự động đồng bộ khi bạn tiến hành thanh toán giỏ hàng.
                </p>
              </div>

              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                style={{ fontSize: '13px', padding: '8px 16px', fontWeight: 700 }}
                onClick={() => setShowAddAddressModal(true)}
              >
                + Thêm Địa Chỉ Mới
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {addresses.map((addr) => (
                <div
                  key={addr.id}
                  style={{
                    background: addr.isDefault ? 'var(--primary-light, #fff7ed)' : 'var(--bg-card, #ffffff)',
                    border: addr.isDefault ? '1.5px solid var(--primary-color, #ea580c)' : '1px solid var(--border-medium, #e2e8f0)',
                    borderRadius: '12px',
                    padding: '16px 20px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                      <strong style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{addr.name}</strong>
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>({addr.phone})</span>
                      <span style={{ background: 'var(--bg-muted, #f1f5f9)', color: 'var(--text-muted)', fontSize: '11px', padding: '2px 8px', borderRadius: '4px' }}>
                        {addr.tag}
                      </span>
                      {addr.isDefault && (
                        <span style={{ background: 'var(--primary-color, #ea580c)', color: '#ffffff', fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px' }}>
                          ✓ MẶC ĐỊNH
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                      📍 {addr.address}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!addr.isDefault && (
                      <button
                        type="button"
                        className="shopee-btn shopee-btn-secondary"
                        style={{ fontSize: '12px', padding: '5px 12px' }}
                        onClick={() => handleSetDefaultAddress(addr.id)}
                      >
                        Đặt Mặc Định
                      </button>
                    )}
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: '#ef4444', fontSize: '13px', cursor: 'pointer', padding: '6px' }}
                      onClick={() => handleDeleteAddress(addr.id)}
                      title="Xóa địa chỉ"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Voucher Wallet */}
        {activeTab === 'vouchers' && (
          <div style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 800, margin: '0 0 16px', color: 'var(--text-primary)' }}>
              🎟️ Kho Mã Giảm Giá Đang Khả Dụng
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              {[
                { code: 'MINI10', title: 'Giảm 10% Toàn Sàn', desc: 'Không giới hạn đơn tối thiểu, giảm tối đa 100k', tag: 'Sàn' },
                { code: 'FREESHIP', title: 'Miễn Phí Vận Chuyển', desc: 'Giảm 30.000₫ phí ship toàn quốc cho mọi đơn', tag: 'Vận chuyển' },
                { code: 'SUPERDEAL', title: 'Siêu Deal Giảm 15%', desc: 'Ưu đãi giờ vàng, áp dụng cho mọi đơn hàng', tag: 'Hot Deal' },
                { code: 'SHOPGENZ', title: 'Voucher Shop 20.000₫', desc: 'Đơn từ 100k các sản phẩm Thời Trang GenZ', tag: 'Shop' },
                { code: 'TECHDEAL', title: 'Voucher Công Nghệ 50.000₫', desc: 'Đơn từ 200k thiết bị công nghệ TechWorld', tag: 'Shop' },
              ].map((v) => (
                <div
                  key={v.code}
                  style={{
                    background: 'var(--bg-card, #ffffff)',
                    border: '1.5px dashed var(--primary-color, #ea580c)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <strong style={{ fontSize: '16px', color: 'var(--primary-color, #ea580c)' }}>{v.code}</strong>
                    <span style={{ fontSize: '11px', background: 'var(--primary-light)', color: 'var(--primary-color)', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      {v.tag}
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)' }}>{v.title}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '4px 0 12px' }}>{v.desc}</div>

                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    style={{ width: '100%', fontSize: '12px', padding: '6px' }}
                    onClick={() => {
                      navigator.clipboard?.writeText(v.code);
                      showToast(`Đã sao chép mã voucher ${v.code}!`, 'success');
                    }}
                  >
                    📋 Sao Chép Mã
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Modal Add New Address */}
      {showAddAddressModal && (
        <div className="shopee-modal-overlay">
          <div className="shopee-modal-content" style={{ maxWidth: '480px' }}>
            <div className="shopee-modal-header">
              <h3>Thêm Địa Chỉ Giao Hàng Mới</h3>
              <button
                type="button"
                className="shopee-modal-close"
                onClick={() => setShowAddAddressModal(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddAddressSubmit}>
              <div className="shopee-form-group">
                <label className="shopee-form-label">Tên Người Nhận</label>
                <input
                  type="text"
                  required
                  className="shopee-form-input"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={newAddressForm.name}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label">Số Điện Thoại</label>
                <input
                  type="tel"
                  required
                  className="shopee-form-input"
                  placeholder="Ví dụ: 0909 123 456"
                  value={newAddressForm.phone}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label">Địa Chỉ Chi Tiết (Số nhà, đường, phường, quận, TP)</label>
                <textarea
                  required
                  rows="3"
                  className="shopee-form-input"
                  placeholder="Ví dụ: Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM"
                  value={newAddressForm.address}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                />
              </div>

              <div className="shopee-form-group">
                <label className="shopee-form-label">Nhãn Địa Chỉ</label>
                <select
                  className="shopee-form-select"
                  value={newAddressForm.tag}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, tag: e.target.value }))}
                >
                  <option value="Nhà riêng">Nhà riêng</option>
                  <option value="Văn phòng">Văn phòng</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
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
    </main>
  );
}
