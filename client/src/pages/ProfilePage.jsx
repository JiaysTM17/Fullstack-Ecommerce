import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import '../styles/auth.css';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || ''
  });

  if (!user) {
    return (
      <main className="shopee-container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>{t('please_login_profile', 'Vui lòng đăng nhập để xem thông tin cá nhân')}</h2>
      </main>
    );
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    showToast(t('profile_saved_success', 'Đã lưu thay đổi thông tin cá nhân thành công!'), 'success');
  };

  return (
    <main className="shopee-container" style={{ padding: '36px 16px', maxWidth: '680px' }}>
      <div 
        style={{ 
          background: 'var(--bg-card, #ffffff)', 
          borderRadius: 'var(--radius-lg, 12px)', 
          padding: '28px', 
          border: '1px solid var(--border-medium, #e2e8f0)',
          boxShadow: 'var(--shadow-sm)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px' }}>
            👤
          </div>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
              {t('my_profile', 'Hồ Sơ Của Tôi')}
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
              {t('profile_manage_subtitle', 'Quản lý thông tin tài khoản và địa chỉ giao hàng')}
            </p>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid var(--border-light, #e2e8f0)', margin: '20px 0' }} />

        <form onSubmit={handleSubmit}>
          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="email">Email</label>
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

          <div className="shopee-form-group">
            <label className="shopee-form-label">{t('current_role', 'Vai trò tài khoản')}</label>
            <span 
              style={{ 
                display: 'inline-block',
                background: 'var(--primary-light, #fff7ed)',
                border: '1px solid var(--primary-border, #fed7aa)',
                color: 'var(--primary-color, #ea580c)',
                padding: '4px 12px',
                borderRadius: '9999px',
                fontSize: '12px',
                fontWeight: 700
              }}
            >
              {user.role === 'admin' 
                ? '🛡️ ' + t('role_admin', 'Quản trị viên sàn') 
                : user.role === 'seller' 
                  ? `🏪 ${t('role_seller', 'Chủ Shop')} (${user.shopName || 'Cửa hàng'})` 
                  : '🛒 ' + t('role_customer', 'Khách mua hàng')}
            </span>
          </div>

          <button type="submit" className="shopee-btn shopee-btn-primary" style={{ marginTop: '16px', padding: '10px 24px', fontWeight: 700 }}>
            {t('save_changes', 'Lưu Thay Đổi')}
          </button>
        </form>
      </div>
    </main>
  );
}
