import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import '../styles/auth.css';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, loginAsDemo } = useAuth();

  const [activeRole, setActiveRole] = useState('customer'); // 'customer' | 'seller' | 'admin'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const redirectAfterLogin = (role) => {
    if (role === 'admin') navigate('/admin/dashboard');
    else if (role === 'seller') navigate('/seller/dashboard');
    else navigate(location.state?.from || '/');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await login(email, password, activeRole);
      if (res.success) {
        redirectAfterLogin(res.user.role);
      }
    } catch (err) {
      setError(err.message || 'Đăng nhập không thành công');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (roleKey) => {
    const user = loginAsDemo(roleKey);
    if (user) {
      redirectAfterLogin(user.role);
    }
  };

  return (
    <div className="shopee-auth-wrapper">
      <div className="shopee-auth-card">
        <div className="shopee-auth-header">
          <h2 className="shopee-auth-title">Đăng Nhập Mini Shopee</h2>
          <p className="shopee-auth-subtitle">Chọn đúng phân hệ và vai trò truy cập của bạn</p>
        </div>

        {/* Tab chuyển đổi 3 vai trò */}
        <div className="shopee-role-tabs">
          <button
            type="button"
            className={`shopee-role-tab ${activeRole === 'customer' ? 'active' : ''}`}
            onClick={() => setActiveRole('customer')}
          >
            🛒 Người Mua
          </button>
          <button
            type="button"
            className={`shopee-role-tab ${activeRole === 'seller' ? 'active' : ''}`}
            onClick={() => setActiveRole('seller')}
          >
            🏪 Kênh Người Bán
          </button>
          <button
            type="button"
            className={`shopee-role-tab ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => setActiveRole('admin')}
          >
            🛡️ Quản Trị Sàn
          </button>
        </div>

        {/* Nút đăng nhập nhanh bằng tài khoản mẫu */}
        <div className="shopee-demo-section">
          <div className="shopee-demo-title">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Trải nghiệm nhanh bằng 1 click:</span>
          </div>
          <div className="shopee-demo-buttons">
            {activeRole === 'customer' && (
              <button
                type="button"
                className="shopee-demo-btn"
                onClick={() => handleQuickLogin('customer')}
              >
                <strong>Khách mua hàng: Nguyễn Văn Khách</strong>
                <span>khachhang@shopee.vn</span>
              </button>
            )}

            {activeRole === 'seller' && (
              <>
                <button
                  type="button"
                  className="shopee-demo-btn"
                  onClick={() => handleQuickLogin('seller_fashion')}
                >
                  <strong>Shop A: Thời Trang GenZ Official</strong>
                  <span>shop.genz@shopee.vn</span>
                </button>
                <button
                  type="button"
                  className="shopee-demo-btn"
                  onClick={() => handleQuickLogin('seller_tech')}
                >
                  <strong>Shop B: TechWorld Store</strong>
                  <span>shop.tech@shopee.vn</span>
                </button>
              </>
            )}

            {activeRole === 'admin' && (
              <button
                type="button"
                className="shopee-demo-btn"
                onClick={() => handleQuickLogin('admin')}
              >
                <strong>Tổng Quản Trị Viên Toàn Sàn</strong>
                <span>admin@shopee.vn</span>
              </button>
            )}
          </div>
        </div>

        {/* Form đăng nhập thông thường */}
        <form onSubmit={handleSubmit}>
          {error && <div className="shopee-form-error-msg" style={{ marginBottom: '14px' }}>{error}</div>}

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              className="shopee-form-input"
              placeholder={activeRole === 'customer' ? 'khachhang@shopee.vn' : activeRole === 'seller' ? 'shop.genz@shopee.vn' : 'admin@shopee.vn'}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="shopee-form-group">
            <label className="shopee-form-label" htmlFor="password">Mật khẩu</label>
            <input
              id="password"
              type="password"
              className="shopee-form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            className="shopee-btn shopee-btn-primary"
            style={{ width: '100%', height: '42px', marginTop: '10px' }}
            disabled={loading}
          >
            {loading ? 'Đang xác thực...' : `Đăng Nhập (${activeRole === 'customer' ? 'Khách Mua' : activeRole === 'seller' ? 'Chủ Shop' : 'Admin Sàn'})`}
          </button>
        </form>

        <div className="shopee-auth-footer">
          Chưa có tài khoản?
          <Link to="/register">Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}
