import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function ProfilePage() {
  const { user, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    phone: user?.phone || '',
    email: user?.email || '',
    address: user?.address || ''
  });

  const [savedMessage, setSavedMessage] = useState(false);

  if (!user) {
    return (
      <main className="shopee-container" style={{ padding: '60px 0', textAlign: 'center' }}>
        <h2>Vui lòng đăng nhập để xem thông tin cá nhân</h2>
      </main>
    );
  }

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 2000);
  };

  return (
    <main className="shopee-container" style={{ padding: '30px 16px', maxWidth: '700px' }}>
      <div className="shopee-table-card">
        <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 8px', color: 'var(--text-primary)' }}>
          Hồ Sơ Của Tôi
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', margin: '0 0 20px' }}>
          Quản lý thông tin hồ sơ để bảo mật tài khoản
        </p>

        {savedMessage && (
          <div style={{ background: '#e8f5e9', color: '#2e7d32', padding: '10px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px' }}>
            ✓ Đã lưu thay đổi thông tin thành công!
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="text"
              className="shopee-form-input"
              value={formData.email}
              disabled
              style={{ background: '#f5f5f5' }}
            />
          </div>

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="fullName">Họ và tên</label>
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
            <label className="shopee-form-label" htmlFor="phone">Số điện thoại</label>
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
            <label className="shopee-form-label" htmlFor="address">Địa chỉ mặc định</label>
            <textarea
              id="address"
              name="address"
              className="shopee-form-textarea"
              rows={3}
              value={formData.address}
              onChange={handleChange}
            />
          </div>

          <div className="shopee-form-group">
            <label className="shopee-form-label">Vai trò hiện tại</label>
            <span className="shopee-sidebar-badge" style={{ alignSelf: 'flex-start' }}>
              {user.role === 'admin' ? '🛡️ Quản trị viên sàn' : user.role === 'seller' ? `🏪 Chủ Shop (${user.shopName || 'Cửa hàng'})` : '🛒 Khách mua hàng'}
            </span>
          </div>

          <button type="submit" className="shopee-btn shopee-btn-primary" style={{ marginTop: '12px' }}>
            Lưu Thay Đổi
          </button>
        </form>
      </div>
    </main>
  );
}
