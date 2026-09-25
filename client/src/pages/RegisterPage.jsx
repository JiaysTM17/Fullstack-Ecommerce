import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/auth.css';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { register } = useAuth();

  const [role, setRole] = useState('customer'); // 'customer' | 'seller'
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
      setError('Vui lòng điền đầy đủ các trường bắt buộc');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }
    if (role === 'seller' && !formData.shopName) {
      setError('Vui lòng nhập tên Cửa Hàng / Shop của bạn');
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
        if (role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      setError(err.message || 'Đăng ký thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="shopee-auth-wrapper">
      <div className="shopee-auth-card">
        <div className="shopee-auth-header">
          <h2 className="shopee-auth-title">Đăng Ký Tài Khoản</h2>
          <p className="shopee-auth-subtitle">Tham gia hệ sinh thái thương mại điện tử Mini Shopee</p>
        </div>

        {/* Tab chuyển đổi mục đích đăng ký */}
        <div className="shopee-role-tabs" style={{ gridTemplateColumns: '1fr 1fr' }}>
          <button
            type="button"
            className={`shopee-role-tab ${role === 'customer' ? 'active' : ''}`}
            onClick={() => setRole('customer')}
          >
            🛒 Đăng Ký Mua Hàng
          </button>
          <button
            type="button"
            className={`shopee-role-tab ${role === 'seller' ? 'active' : ''}`}
            onClick={() => setRole('seller')}
          >
            🏪 Đăng Ký Mở Cửa Hàng (Shop)
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {error && <div className="shopee-form-error-msg" style={{ marginBottom: '14px' }}>{error}</div>}

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="fullName">Họ và tên *</label>
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
            <label className="shopee-form-label" htmlFor="phone">Số điện thoại</label>
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
                <label className="shopee-form-label" htmlFor="shopName">Tên Cửa Hàng / Shop *</label>
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
                <label className="shopee-form-label" htmlFor="shopAddress">Địa chỉ kho hàng</label>
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
            <label className="shopee-form-label" htmlFor="password">Mật khẩu *</label>
            <input
              id="password"
              name="password"
              type="password"
              className="shopee-form-input"
              placeholder="Tối thiểu 6 ký tự"
              value={formData.password}
              onChange={handleChange}
            />
          </div>

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="confirmPassword">Xác nhận mật khẩu *</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="shopee-form-input"
              placeholder="Nhập lại mật khẩu"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="shopee-btn shopee-btn-primary"
            style={{ width: '100%', height: '42px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Đang tạo tài khoản...' : role === 'seller' ? 'Tạo Tài Khoản & Mở Shop' : 'Đăng Ký Tài Khoản'}
          </button>
        </form>

        <div className="shopee-auth-footer">
          Đã có tài khoản?
          <Link to="/login">Đăng nhập</Link>
        </div>
      </div>
    </div>
  );
}
