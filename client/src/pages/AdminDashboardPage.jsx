import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';
import { getVouchers, createVoucher, deleteVoucher } from '../services/voucherService';
import '../styles/dashboard.css';

const INITIAL_ALL_SHOPS = [
  {
    id: "shop_01",
    name: "Thời Trang GenZ Official",
    ownerName: "Trần Thị Chủ Shop",
    email: "shop.genz@shopee.vn",
    phone: "0912345678",
    productsCount: 4,
    totalRevenue: 857000,
    status: "active",
    statusText: "Đang hoạt động",
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
    statusText: "Đang hoạt động",
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
    statusText: "Đang bị khóa",
  },
];

const INITIAL_ALL_USERS = [
  { id: "usr_01", fullName: "Nguyễn Văn Khách", email: "khachhang@shopee.vn", role: "customer", ordersCount: 2, status: "active" },
  { id: "usr_02", fullName: "Trần Thị Chủ Shop", email: "shop.genz@shopee.vn", role: "seller", shopName: "Thời Trang GenZ", status: "active" },
  { id: "usr_03", fullName: "Lê Văn Chủ Shop", email: "shop.tech@shopee.vn", role: "seller", shopName: "TechWorld Store", status: "active" },
  { id: "usr_04", fullName: "Tổng Quản Trị Viên", email: "admin@shopee.vn", role: "admin", status: "active" },
];

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'shops' | 'users' | 'vouchers'
  const [shops, setShops] = useState(INITIAL_ALL_SHOPS);
  const [users, setUsers] = useState(INITIAL_ALL_USERS);

  // Voucher Management
  const [vouchers, setVouchers] = useState(getVouchers);
  const [showAddVoucher, setShowAddVoucher] = useState(false);
  const [voucherForm, setVoucherForm] = useState({
    code: '',
    name: '',
    type: 'percent',
    value: '10',
    minOrderValue: '200000',
    maxDiscount: '100000',
    description: '',
  });

  // Số liệu toàn sàn
  const totalPlatformRevenue = shops.reduce((sum, s) => sum + s.totalRevenue, 0);
  const totalActiveShops = shops.filter(s => s.status === 'active').length;
  const totalProducts = shops.reduce((sum, s) => sum + s.productsCount, 0);
  const platformCommission = Math.round(totalPlatformRevenue * 0.05); // 5% take rate

  const handleToggleShopStatus = (shopId) => {
    setShops(prev => prev.map(s => {
      if (s.id === shopId) {
        const nextStatus = s.status === 'active' ? 'locked' : 'active';
        toast.info(nextStatus === 'active' ? `Đã mở khóa hoạt động cho ${s.name}` : `Đã khóa gian hàng ${s.name}`);
        return {
          ...s,
          status: nextStatus,
          statusText: nextStatus === 'active' ? 'Đang hoạt động' : 'Đang bị khóa',
        };
      }
      return s;
    }));
  };

  const handleToggleUserStatus = (userId) => {
    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const nextStatus = u.status === 'active' ? 'banned' : 'active';
        toast.info(nextStatus === 'active' ? `Đã mở khóa tài khoản ${u.fullName}` : `Đã tạm khóa tài khoản ${u.fullName}`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  const handleCreateVoucher = (e) => {
    e.preventDefault();
    if (!voucherForm.code || !voucherForm.value) return;

    const created = createVoucher({
      code: voucherForm.code.toUpperCase(),
      name: voucherForm.name || `Voucher ${voucherForm.code.toUpperCase()}`,
      type: voucherForm.type,
      value: Number(voucherForm.value),
      minOrderValue: Number(voucherForm.minOrderValue) || 0,
      maxDiscount: Number(voucherForm.maxDiscount) || null,
      description: voucherForm.description || `Giảm ${voucherForm.value}${voucherForm.type === 'percent' ? '%' : 'đ'}`,
      isGlobal: true,
      usageLimit: 500,
    });

    setVouchers([created, ...vouchers]);
    toast.success(`Đã phát hành mã giảm giá ${created.code} thành công!`);
    setShowAddVoucher(false);
    setVoucherForm({
      code: '',
      name: '',
      type: 'percent',
      value: '10',
      minOrderValue: '200000',
      maxDiscount: '100000',
      description: '',
    });
  };

  const handleDeleteVoucher = (vouchId) => {
    if (window.confirm("Bạn có chắc muốn xóa mã voucher này khỏi sàn?")) {
      const updated = deleteVoucher(vouchId);
      setVouchers(updated);
      toast.info("Đã xóa mã voucher khỏi hệ thống");
    }
  };

  return (
    <div className="shopee-dashboard-container">
      {/* Sidebar Super Admin */}
      <aside className="shopee-sidebar">
        <div className="shopee-sidebar-brand">
          <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'linear-gradient(135deg, var(--primary-color), var(--primary-hover))', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
            🛡️
          </div>
          <div className="shopee-sidebar-info">
            <h3>Super Admin</h3>
            <span className="shopee-sidebar-badge" style={{ background: 'var(--primary-light, rgba(234, 88, 12, 0.1))', color: 'var(--primary-color)' }}>
              Quản Trị Toàn Sàn
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📊 Tổng Quan Sàn & GMV
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

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'vouchers' ? 'active' : ''}`}
          onClick={() => setActiveTab('vouchers')}
        >
          🎟️ Quản Lý Voucher Sàn ({vouchers.length})
        </button>
      </aside>

      {/* Main Content */}
      <main className="shopee-dashboard-main">
        <div className="shopee-dashboard-header">
          <div>
            <h1 className="shopee-dashboard-title">Hệ Thống Quản Trị Tối Cao Sàn Mini Shopee</h1>
            <p className="shopee-dashboard-subtitle">
              Giám sát toàn bộ cửa hàng, người bán, khách hàng, voucher khuyến mãi và doanh thu toàn sàn.
            </p>
          </div>
        </div>

        {/* 4 Thẻ chỉ số toàn sàn */}
        <div className="shopee-metrics-grid">
          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Tổng Doanh Số Sàn (GMV)</span>
            <div className="shopee-metric-value">{formatCurrency(totalPlatformRevenue)}</div>
            <span style={{ fontSize: '11px', color: 'var(--color-success)' }}>+18.4% so với tháng trước</span>
          </div>

          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Hoa Hồng Thu Sàn (5%)</span>
            <div className="shopee-metric-value" style={{ color: 'var(--color-success)' }}>
              {formatCurrency(platformCommission)}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Doanh thu thuần của sàn</span>
          </div>

          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Gian Hàng Hoạt Động</span>
            <div className="shopee-metric-value">{totalActiveShops} / {shops.length}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tỷ lệ duyệt shop: 95%</span>
          </div>

          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Tổng Thành Viên Sàn</span>
            <div className="shopee-metric-value">{users.length}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{totalProducts} mặt hàng niêm yết</span>
          </div>
        </div>

        {/* TAB 1: TỔNG QUAN */}
        {activeTab === 'overview' && (
          <div className="shopee-table-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 16px', fontWeight: 700 }}>
              Xếp Hạng Doanh Thu Các Gian Hàng Trên Sàn
            </h2>
            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Tên Cửa Hàng</th>
                    <th>Chủ Sở Hữu</th>
                    <th>Số Mặt Hàng</th>
                    <th>Doanh Thu GMV</th>
                    <th>Hoa Hồng Sàn (5%)</th>
                    <th>Trạng Thái</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map(s => (
                    <tr key={s.id}>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.ownerName} ({s.email})</td>
                      <td>{s.productsCount} sản phẩm</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>
                        {formatCurrency(s.totalRevenue)}
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--color-success)' }}>
                        {formatCurrency(Math.round(s.totalRevenue * 0.05))}
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

        {/* TAB 2: QUẢN LÝ CỬA HÀNG */}
        {activeTab === 'shops' && (
          <div className="shopee-table-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 16px', fontWeight: 700 }}>
              Danh Sách Gian Hàng Đăng Ký ({shops.length})
            </h2>
            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Shop ID</th>
                    <th>Tên Gian Hàng</th>
                    <th>Chủ Sở Hữu</th>
                    <th>Hotline</th>
                    <th>Doanh Số</th>
                    <th>Tình Trạng</th>
                    <th>Quyết Định</th>
                  </tr>
                </thead>
                <tbody>
                  {shops.map(s => (
                    <tr key={s.id}>
                      <td><code>{s.id}</code></td>
                      <td><strong>{s.name}</strong></td>
                      <td>{s.ownerName}</td>
                      <td>{s.phone}</td>
                      <td>{formatCurrency(s.totalRevenue)}</td>
                      <td>
                        <span className={`shopee-status-badge ${s.status === 'active' ? 'status-active' : 'status-hidden'}`}>
                          {s.statusText}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                          style={s.status === 'active' ? { color: 'var(--color-error)' } : { color: 'var(--color-success)' }}
                          onClick={() => handleToggleShopStatus(s.id)}
                        >
                          {s.status === 'active' ? '🚫 Khóa gian hàng' : '✓ Mở khóa hoạt động'}
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
              Danh Sách Tài Khoản Người Dùng Toàn Sàn ({users.length})
            </h2>
            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>User ID</th>
                    <th>Họ Và Tên</th>
                    <th>Email</th>
                    <th>Vai Trò (Phân Quyền)</th>
                    <th>Trạng Thái</th>
                    <th>Thao Tác</th>
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

        {/* TAB 4: QUẢN LÝ VOUCHER KHUYẾN MÃI TOÀN SÀN */}
        {activeTab === 'vouchers' && (
          <div className="shopee-table-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>
                Quản Lý Mã Giảm Giá Sàn ({vouchers.length})
              </h2>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary shopee-btn-sm"
                onClick={() => setShowAddVoucher(prev => !prev)}
              >
                {showAddVoucher ? '✕ Đóng form' : '+ Tạo Voucher Mới'}
              </button>
            </div>

            {/* Create voucher form */}
            {showAddVoucher && (
              <form onSubmit={handleCreateVoucher} style={{ background: 'var(--bg-card-hover, rgba(0,0,0,0.02))', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-medium)', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px' }}>Tạo Mã Giảm Giá Toàn Sàn</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Mã Voucher (Code):</label>
                    <input
                      type="text"
                      required
                      placeholder="VD: SUPERDEAL"
                      className="shopee-form-input"
                      value={voucherForm.code}
                      onChange={(e) => setVoucherForm({ ...voucherForm, code: e.target.value })}
                      style={{ textTransform: 'uppercase' }}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Loại giảm giá:</label>
                    <select
                      className="shopee-form-select"
                      value={voucherForm.type}
                      onChange={(e) => setVoucherForm({ ...voucherForm, type: e.target.value })}
                    >
                      <option value="percent">Giảm theo %</option>
                      <option value="fixed">Giảm tiền mặt (₫)</option>
                      <option value="shipping">Miễn phí ship (₫)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Mức giảm (% hoặc ₫):</label>
                    <input
                      type="number"
                      required
                      className="shopee-form-input"
                      value={voucherForm.value}
                      onChange={(e) => setVoucherForm({ ...voucherForm, value: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Đơn tối thiểu (₫):</label>
                    <input
                      type="number"
                      className="shopee-form-input"
                      value={voucherForm.minOrderValue}
                      onChange={(e) => setVoucherForm({ ...voucherForm, minOrderValue: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button type="submit" className="shopee-btn shopee-btn-primary">
                    ✓ Phát Hành Voucher Toàn Sàn
                  </button>
                </div>
              </form>
            )}

            {/* Vouchers Table */}
            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Mã Code</th>
                    <th>Tên Voucher</th>
                    <th>Mức Giảm</th>
                    <th>Đơn Tối Thiểu</th>
                    <th>Giảm Tối Đa</th>
                    <th>Đã Dùng</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {vouchers.map(v => (
                    <tr key={v.id}>
                      <td><strong style={{ color: 'var(--primary-color)', background: 'var(--primary-light, rgba(234, 88, 12, 0.1))', padding: '2px 8px', borderRadius: '4px' }}>{v.code}</strong></td>
                      <td>{v.name}</td>
                      <td style={{ fontWeight: 700 }}>
                        {v.type === 'percent' ? `${v.value}%` : formatCurrency(v.value)}
                      </td>
                      <td>{formatCurrency(v.minOrderValue)}</td>
                      <td>{v.maxDiscount ? formatCurrency(v.maxDiscount) : 'Không giới hạn'}</td>
                      <td>{v.usedCount} lượt</td>
                      <td>
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                          style={{ color: 'var(--color-error)' }}
                          onClick={() => handleDeleteVoucher(v.id)}
                        >
                          Xóa
                        </button>
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
