import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { formatCurrency } from '../utils/formatCurrency';
import '../styles/dashboard.css';

const INITIAL_ALL_SHOPS = [
  {
    id: "shop_01",
    name: "Thời Trang GenZ Official",
    ownerName: "Trần Thị Chủ Shop",
    email: "shop.genz@shopee.vn",
    phone: "0912345678",
    productsCount: 3,
    totalRevenue: 857000,
    status: "active",
    statusText: "Đang hoạt động"
  },
  {
    id: "shop_02",
    name: "TechWorld Store",
    ownerName: "Lê Văn Chủ Shop",
    email: "shop.tech@shopee.vn",
    phone: "0987654321",
    productsCount: 4,
    totalRevenue: 2820000,
    status: "active",
    statusText: "Đang hoạt động"
  },
  {
    id: "shop_03",
    name: "Mỹ Phẩm Xách Tay H&K (Vi phạm)",
    ownerName: "Hoàng Văn C",
    email: "shop.hk@example.com",
    phone: "0944332211",
    productsCount: 1,
    totalRevenue: 0,
    status: "locked",
    statusText: "Đang bị khóa"
  }
];

const INITIAL_ALL_USERS = [
  { id: "usr_01", fullName: "Nguyễn Văn Khách", email: "khachhang@shopee.vn", role: "customer", ordersCount: 2, status: "active" },
  { id: "usr_02", fullName: "Trần Thị Chủ Shop", email: "shop.genz@shopee.vn", role: "seller", shopName: "Thời Trang GenZ", status: "active" },
  { id: "usr_03", fullName: "Lê Văn Chủ Shop", email: "shop.tech@shopee.vn", role: "seller", shopName: "TechWorld Store", status: "active" },
  { id: "usr_04", fullName: "Tổng Quản Trị Viên", email: "admin@shopee.vn", role: "admin", status: "active" }
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'shops' | 'users' | 'products'
  const [shops, setShops] = useState(INITIAL_ALL_SHOPS);
  const [users, setUsers] = useState(INITIAL_ALL_USERS);

  // Tính số liệu toàn sàn
  const totalPlatformRevenue = shops.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalActiveShops = shops.filter(s => s.status === 'active').length;
  const totalProducts = shops.reduce((sum, s) => sum + s.productsCount, 0);

  // Khóa / Mở khóa Shop
  const handleToggleShopStatus = (shopId) => {
    setShops(prev => prev.map(s => {
      if (s.id === shopId) {
        const nextStatus = s.status === 'active' ? 'locked' : 'active';
        return {
          ...s,
          status: nextStatus,
          statusText: nextStatus === 'active' ? 'Đang hoạt động' : 'Đang bị khóa'
        };
      }
      return s;
    }));
  };

  // Khóa / Mở khóa User
  const handleToggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, status: u.status === 'active' ? 'banned' : 'active' };
      }
      return u;
    }));
  };

  return (
    <div className="shopee-dashboard-container">
      {/* Sidebar Super Admin */}
      <aside className="shopee-sidebar">
        <div className="shopee-sidebar-brand">
          <div style={{ width: '40px', height: '40px', borderRadius: '4px', background: 'var(--primary-color)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            🛡️
          </div>
          <div className="shopee-sidebar-info">
            <h3>Super Admin</h3>
            <span className="shopee-sidebar-badge" style={{ background: '#e3f2fd', color: '#1976d2' }}>
              Quản Trị Toàn Sàn
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Tổng Quan Sàn
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'shops' ? 'active' : ''}`}
          onClick={() => setActiveTab('shops')}
        >
          🏪 Quản Lý Cửa Hàng ({shops.length})
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          👥 Quản Lý Người Dùng ({users.length})
        </button>
      </aside>

      {/* Main Content */}
      <main className="shopee-dashboard-main">
        <div className="shopee-dashboard-header">
          <div>
            <h1 className="shopee-dashboard-title">Hệ Thống Quản Trị Tối Cao Sàn Mini Shopee</h1>
            <p className="shopee-dashboard-subtitle">
              Giám sát toàn bộ cửa hàng, người bán, khách hàng và dòng tiền trên sàn.
            </p>
          </div>
        </div>

        {/* 4 Thẻ chỉ số toàn sàn */}
        <div className="shopee-metrics-grid">
          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Doanh Thu Toàn Hệ Thống</span>
            <span className="shopee-metric-value">{formatCurrency(totalPlatformRevenue)}</span>
            <span className="shopee-metric-hint">Tổng giá trị giao dịch GMV</span>
          </div>
          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Số Shop Đang Hoạt Động</span>
            <span className="shopee-metric-value">{totalActiveShops} / {shops.length}</span>
            <span className="shopee-metric-hint">{shops.length - totalActiveShops} shop bị khóa</span>
          </div>
          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Tổng Mặt Hàng Trên Sàn</span>
            <span className="shopee-metric-value">{totalProducts}</span>
            <span className="shopee-metric-hint">Phân bổ qua nhiều Shop</span>
          </div>
          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Tổng Tài Khoản Người Dùng</span>
            <span className="shopee-metric-value">{users.length}</span>
            <span className="shopee-metric-hint">Khách hàng & Chủ shop</span>
          </div>
        </div>

        {/* TAB 1: TỔNG QUAN SÀN */}
        {activeTab === 'overview' && (
          <div className="shopee-table-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 16px', fontWeight: 700 }}>
              Cửa Hàng Hoạt Động Tiêu Biểu Trên Sàn
            </h2>
            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Tên Shop</th>
                    <th>Chủ sở hữu</th>
                    <th>Hotline</th>
                    <th>Số sản phẩm</th>
                    <th>Doanh số đóng góp</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.ownerName}</td>
                      <td>{s.phone}</td>
                      <td>{s.productsCount} mặt hàng</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                        {formatCurrency(s.totalRevenue)}
                      </td>
                      <td>
                        <span className={`shopee-status-badge ${s.status === 'active' ? 'status-active' : 'status-hidden'}`}>
                          {s.statusText}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: QUẢN LÝ CỬA HÀNG (SHOPS) */}
        {activeTab === 'shops' && (
          <div className="shopee-table-card">
            <div className="shopee-table-toolbar">
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>
                Danh Sách Tất Cả Cửa Hàng / Người Bán ({shops.length})
              </h2>
            </div>

            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Shop ID</th>
                    <th>Tên Cửa Hàng</th>
                    <th>Chủ sở hữu / Email</th>
                    <th>Số hàng hóa</th>
                    <th>Doanh thu</th>
                    <th>Trạng thái</th>
                    <th>Hành động Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map(shop => (
                    <tr key={shop.id}>
                      <td><code>{shop.id}</code></td>
                      <td><strong>{shop.name}</strong></td>
                      <td>
                        <div>{shop.ownerName}</div>
                        <small style={{ color: 'var(--text-muted)' }}>{shop.email}</small>
                      </td>
                      <td>{shop.productsCount} mặt hàng</td>
                      <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                        {formatCurrency(shop.totalRevenue)}
                      </td>
                      <td>
                        <span className={`shopee-status-badge ${shop.status === 'active' ? 'status-active' : 'status-hidden'}`}>
                          {shop.statusText}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`shopee-btn shopee-btn-sm ${shop.status === 'active' ? 'shopee-btn-secondary' : 'shopee-btn-primary'}`}
                          style={shop.status === 'active' ? { color: 'var(--color-error)' } : {}}
                          onClick={() => handleToggleShopStatus(shop.id)}
                        >
                          {shop.status === 'active' ? '🔒 Khóa Shop' : '🔓 Mở Khóa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: QUẢN LÝ NGƯỜI DÙNG */}
        {activeTab === 'users' && (
          <div className="shopee-table-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 16px', fontWeight: 700 }}>
              Danh Sách Người Dùng Hệ Thống ({users.length})
            </h2>

            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th>Vai trò (Role)</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td><code>{u.id}</code></td>
                      <td><strong>{u.fullName}</strong></td>
                      <td>{u.email}</td>
                      <td>
                        <span className="shopee-sidebar-badge">
                          {u.role === 'admin' ? '🛡️ Admin' : u.role === 'seller' ? '🏪 Seller (Người bán)' : '🛒 Customer (Người mua)'}
                        </span>
                      </td>
                      <td>
                        <span className={`shopee-status-badge ${u.status === 'active' ? 'status-active' : 'status-hidden'}`}>
                          {u.status === 'active' ? 'Bình thường' : 'Đã bị cấm'}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'admin' && (
                          <button
                            type="button"
                            className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                            style={u.status === 'active' ? { color: 'var(--color-error)' } : { color: 'var(--color-success)' }}
                            onClick={() => handleToggleUserStatus(u.id)}
                          >
                            {u.status === 'active' ? 'Cấm tài khoản' : 'Mở khóa'}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
