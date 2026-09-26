import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';
import { getVouchers, createVoucher, deleteVoucher } from '../services/voucherService';
import '../styles/dashboard.css';

const INITIAL_ALL_SHOPS = [
  { id: "shop_01", name: "Thời Trang GenZ Official", ownerName: "Trần Thị Minh Tâm", email: "shop.genz@marketplace.vn", phone: "0912345678", productsCount: 9, totalRevenue: 18450000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_02", name: "TechWorld Store", ownerName: "Lê Văn Hùng", email: "shop.tech@marketplace.vn", phone: "0987654321", productsCount: 9, totalRevenue: 34820000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_03", name: "Beauty Cosmetics Official", ownerName: "Nguyễn Hương Giang", email: "shop.beauty@marketplace.vn", phone: "0909888999", productsCount: 9, totalRevenue: 27600000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_04", name: "HomePro Gia Dụng Thông Minh", ownerName: "Hoàng Gia Bách", email: "shop.homepro@marketplace.vn", phone: "0936789123", productsCount: 9, totalRevenue: 42100000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_05", name: "SportZone Thể Thao & Dã Ngoại", ownerName: "Đỗ Tuấn Kiệt", email: "shop.sport@marketplace.vn", phone: "0968123456", productsCount: 9, totalRevenue: 19800000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_06", name: "GreenFarm Nông Sản & Organic Sạch", ownerName: "Phạm Thúy Hằng", email: "shop.greenfarm@marketplace.vn", phone: "0977888666", productsCount: 9, totalRevenue: 15300000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_07", name: "Tri Thức BookStore & Văn Phòng Phẩm", ownerName: "Vũ Đình Trọng", email: "shop.books@marketplace.vn", phone: "0918223344", productsCount: 9, totalRevenue: 11200000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_08", name: "AutoPro Phụ Kiện Ô Tô Xe Máy", ownerName: "Mai Quốc Cường", email: "shop.autopro@marketplace.vn", phone: "0933555777", productsCount: 9, totalRevenue: 24700000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_09", name: "BabyCare Siêu Thị Mẹ & Bé Yêu", ownerName: "Trịnh Thị Tuyết", email: "shop.babycare@marketplace.vn", phone: "0908112233", productsCount: 9, totalRevenue: 28900000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_10", name: "AudioHiFi Âm Thanh Đẳng Cấp", ownerName: "Đặng Hoàng Nam", email: "shop.audio@marketplace.vn", phone: "0945667788", productsCount: 9, totalRevenue: 38500000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_11", name: "PetParadise Vương Quốc Thú Cưng", ownerName: "Bùi Mỹ Linh", email: "shop.pet@marketplace.vn", phone: "0922446688", productsCount: 8, totalRevenue: 14600000, status: "active", statusText: "Đang hoạt động" },
  { id: "shop_12", name: "LuxeTime Đồng Hồ Cơ Khí & Phụ Kiện", ownerName: "Cao Anh Tuấn", email: "shop.luxetime@marketplace.vn", phone: "0915999111", productsCount: 8, totalRevenue: 52400000, status: "active", statusText: "Đang hoạt động" },
];

const INITIAL_MODERATION_PRODUCTS = [
  { id: 'p_mod_01', name: 'Áo thun nam basic cotton 100%', shopName: 'Thời Trang GenZ Official', shopId: 'shop_01', price: 199000, category: 'Thời trang', stock: 50, status: 'approved', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100' },
  { id: 'p_mod_02', name: 'Tai nghe Bluetooth True Wireless ANC', shopName: 'TechWorld Store', shopId: 'shop_02', price: 650000, category: 'Điện tử', stock: 80, status: 'approved', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=100' },
  { id: 'p_mod_03', name: 'Kem dưỡng trắng da cấp tốc 7 ngày (Chưa kiểm định)', shopName: 'Mỹ Phẩm Xách Tay H&K', shopId: 'shop_03', price: 89000, category: 'Mỹ phẩm', stock: 15, status: 'rejected', reason: 'Chưa có giấy phép lưu hành', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=100' },
  { id: 'p_mod_04', name: 'Bàn phím cơ Bluetooth RGB Hot-swap', shopName: 'TechWorld Store', shopId: 'shop_02', price: 890000, category: 'Điện tử', stock: 25, status: 'pending', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=100' },
  { id: 'p_mod_05', name: 'Áo khoác gió bomber chống nước siêu nhẹ', shopName: 'Thời Trang GenZ Official', shopId: 'shop_01', price: 349000, category: 'Thời trang', stock: 40, status: 'pending', image: 'https://images.unsplash.com/photo-1544441893-675973e31985?w=100' },
];

const INITIAL_CATEGORIES = [
  { id: 'cat_01', name: 'Thời trang', icon: '👕', count: 42, active: true },
  { id: 'cat_02', name: 'Điện tử & Công nghệ', icon: '🎧', count: 35, active: true },
  { id: 'cat_03', name: 'Đời sống & Nhà cửa', icon: '🏠', count: 28, active: true },
  { id: 'cat_04', name: 'Sức khỏe & Làm đẹp', icon: '💄', count: 19, active: true },
  { id: 'cat_05', name: 'Thể thao & Du lịch', icon: '⚽', count: 14, active: true },
];

const INITIAL_FINANCE_SETTLEMENTS = [
  { id: 'fin_01', shopId: 'shop_01', shopName: 'Thời Trang GenZ Official', gmv: 857000, commission: 42850, netPayout: 814150, period: 'Kỳ 1 (01/09 - 15/09)', status: 'paid', statusText: 'Đã thanh toán' },
  { id: 'fin_02', shopId: 'shop_02', shopName: 'TechWorld Store', gmv: 2820000, commission: 141000, netPayout: 2679000, period: 'Kỳ 1 (01/09 - 15/09)', status: 'pending', statusText: 'Chờ đối soát' },
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
  const [activeTab, setActiveTab] = useState('overview'); // 'overview' | 'shops' | 'users' | 'products' | 'categories' | 'finance' | 'vouchers'
  const [shops, setShops] = useState(INITIAL_ALL_SHOPS);
  const [users, setUsers] = useState(INITIAL_ALL_USERS);
  const [moderationProducts, setModerationProducts] = useState(INITIAL_MODERATION_PRODUCTS);
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📦');
  const [financeList, setFinanceList] = useState(INITIAL_FINANCE_SETTLEMENTS);

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
    const code = voucherForm.code.trim().toUpperCase();
    if (!code) {
      toast.error('Vui lòng nhập mã voucher!');
      return;
    }
    const val = Number(voucherForm.value);
    if (isNaN(val) || val <= 0) {
      toast.error('Mức giảm giá phải lớn hơn 0!');
      return;
    }
    if (voucherForm.type === 'percent') {
      if (val > 100) {
        toast.error('Mức giảm theo % chỉ được từ 1% đến tối đa 100%!');
        return;
      }
    } else {
      if (val < 1000) {
        toast.error('Mức giảm tiền mặt hoặc phí vận chuyển tối thiểu là 1.000₫!');
        return;
      }
    }

    const created = createVoucher({
      code,
      name: voucherForm.name.trim() || `Voucher ${code}`,
      type: voucherForm.type,
      value: val,
      minOrderValue: Math.max(0, Number(voucherForm.minOrderValue) || 0),
      maxDiscount: voucherForm.type === 'percent' ? (Number(voucherForm.maxDiscount) || null) : null,
      description: voucherForm.description || `Giảm ${val}${voucherForm.type === 'percent' ? '%' : '₫'}`,
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

  const handleApproveProduct = (prodId) => {
    setModerationProducts(prev => prev.map(p => p.id === prodId ? { ...p, status: 'approved' } : p));
    toast.success('Đã duyệt sản phẩm lên sàn thành công!');
  };

  const handleRejectProduct = (prodId) => {
    setModerationProducts(prev => prev.map(p => p.id === prodId ? { ...p, status: 'rejected', reason: 'Vi phạm chính sách sàn' } : p));
    toast.info('Đã từ chối / gỡ bỏ sản phẩm khỏi sàn');
  };

  const handleAddCategory = (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const newCat = {
      id: `cat_${Date.now()}`,
      name: newCatName.trim(),
      icon: newCatIcon || '📦',
      count: 0,
      active: true,
    };
    setCategories(prev => [...prev, newCat]);
    setNewCatName('');
    toast.success(`Đã thêm danh mục "${newCat.name}" vào hệ thống sàn!`);
  };

  const handleToggleCategory = (catId) => {
    setCategories(prev => prev.map(c => c.id === catId ? { ...c, active: !c.active } : c));
  };

  const handleDeleteCategory = (catId) => {
    setCategories(prev => prev.filter(c => c.id !== catId));
    toast.info('Đã xóa danh mục');
  };

  const handleSettlePayout = (finId) => {
    setFinanceList(prev => prev.map(f => f.id === finId ? { ...f, status: 'paid', statusText: 'Đã thanh toán' } : f));
    toast.success('Đã xác nhận đối soát và chuyển khoản tiền hàng cho Shop!');
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
          className={`shopee-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Kiểm Duyệt Sản Phẩm ({moderationProducts.length})
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
          className={`shopee-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
        >
          📑 Quản Lý Danh Mục ({categories.length})
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'vouchers' ? 'active' : ''}`}
          onClick={() => setActiveTab('vouchers')}
        >
          🎟️ Quản Lý Voucher Sàn ({vouchers.length})
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
        >
          💰 Đối Soát & Tài Chính
        </button>
      </aside>

      {/* Main Content */}
      <main className="shopee-dashboard-main">
        <div className="shopee-dashboard-header">
          <div>
            <h1 className="shopee-dashboard-title">Hệ Thống Quản Trị Sàn Fullstack E-Commerce</h1>
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
              <form onSubmit={handleCreateVoucher} className="anim-accordion" style={{ background: 'var(--bg-card-hover, rgba(0,0,0,0.02))', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-medium)', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 700, margin: '0 0 12px' }}>Tạo Mã Giảm Giá Toàn Sàn</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Mã Voucher (Code) *:</label>
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
                      onChange={(e) => setVoucherForm({ 
                        ...voucherForm, 
                        type: e.target.value,
                        value: e.target.value === 'percent' ? '10' : '20000'
                      })}
                    >
                      <option value="percent">Giảm theo % (Tối đa 100%)</option>
                      <option value="fixed">Giảm tiền mặt (₫)</option>
                      <option value="shipping">Miễn phí ship (₫)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>
                      {voucherForm.type === 'percent' ? 'Mức giảm (%) [1% - 100%] *:' : 'Số tiền giảm (₫) [Min 1.000₫] *:'}
                    </label>
                    <input
                      type="number"
                      required
                      min={voucherForm.type === 'percent' ? 1 : 1000}
                      max={voucherForm.type === 'percent' ? 100 : undefined}
                      step={voucherForm.type === 'percent' ? 1 : 1000}
                      placeholder={voucherForm.type === 'percent' ? 'VD: 10, 15, 20' : 'VD: 20000, 50000'}
                      className="shopee-form-input"
                      value={voucherForm.value}
                      onChange={(e) => {
                        let val = e.target.value;
                        if (voucherForm.type === 'percent' && Number(val) > 100) {
                          val = '100';
                        }
                        setVoucherForm({ ...voucherForm, value: val });
                      }}
                    />
                  </div>

                  {voucherForm.type === 'percent' && (
                    <div>
                      <label style={{ fontSize: '11px', fontWeight: 700 }}>Giảm tối đa (₫) [Tùy chọn]:</label>
                      <input
                        type="number"
                        min="1000"
                        step="1000"
                        placeholder="VD: 50000, 100000"
                        className="shopee-form-input"
                        value={voucherForm.maxDiscount || ''}
                        onChange={(e) => setVoucherForm({ ...voucherForm, maxDiscount: e.target.value })}
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ fontSize: '11px', fontWeight: 700 }}>Đơn tối thiểu (₫) [0 = Mọi đơn]:</label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="VD: 150000, 200000"
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

        {/* TAB: KIỂM DUYỆT SẢN PHẨM TOÀN SÀN */}
        {activeTab === 'products' && (
          <div className="shopee-table-card">
            <div className="shopee-table-header">
              <div>
                <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>
                  Kiểm Duyệt Sản Phẩm Toàn Sàn ({moderationProducts.length})
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Phê duyệt sản phẩm mới đăng của các shop trước khi xuất hiện trên sàn hoặc xử lý sản phẩm vi phạm.
                </p>
              </div>
            </div>

            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Sản Phẩm</th>
                    <th>Gian Hàng Bán</th>
                    <th>Danh Mục</th>
                    <th>Giá Bán</th>
                    <th>Tồn Kho</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác Duyệt</th>
                  </tr>
                </thead>
                <tbody>
                  {moderationProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <img src={p.image} alt={p.name} style={{ width: '38px', height: '38px', borderRadius: '4px', objectFit: 'cover' }} />
                          <strong style={{ fontSize: '13px' }}>{p.name}</strong>
                        </div>
                      </td>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>{p.shopName}</span>
                      </td>
                      <td>{p.category}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(p.price)}</td>
                      <td>{p.stock}</td>
                      <td>
                        <span
                          className="shopee-status-badge"
                          style={{
                            background: p.status === 'approved' ? 'rgba(16, 185, 129, 0.1)' : p.status === 'pending' ? 'rgba(245, 158, 11, 0.12)' : 'rgba(239, 68, 68, 0.1)',
                            color: p.status === 'approved' ? '#059669' : p.status === 'pending' ? '#d97706' : '#dc2626',
                            fontWeight: 700,
                          }}
                        >
                          {p.status === 'approved' ? '✓ Đã Duyệt' : p.status === 'pending' ? '⏳ Chờ Duyệt' : '✕ Từ Chối / Gỡ Bỏ'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {p.status !== 'approved' && (
                          <button
                            type="button"
                            className="shopee-btn shopee-btn-sm"
                            style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', marginRight: '6px' }}
                            onClick={() => handleApproveProduct(p.id)}
                          >
                            ✓ Duyệt Bán
                          </button>
                        )}
                        {p.status !== 'rejected' && (
                          <button
                            type="button"
                            className="shopee-btn shopee-btn-sm"
                            style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444' }}
                            onClick={() => handleRejectProduct(p.id)}
                          >
                            ✕ Gỡ Bỏ
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

        {/* TAB: QUẢN LÝ DANH MỤC SÀN */}
        {activeTab === 'categories' && (
          <div className="shopee-table-card">
            <div className="shopee-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>
                  Quản Lý Cây Danh Mục Sàn ({categories.length})
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Định hình các nhóm ngành hàng để phân loại sản phẩm và hiển thị trên Mega Menu.
                </p>
              </div>
            </div>

            {/* Form thêm danh mục */}
            <form onSubmit={handleAddCategory} style={{ display: 'flex', gap: '10px', margin: '16px 0', padding: '16px', background: 'var(--bg-muted, #f8fafc)', borderRadius: '8px' }}>
              <input
                type="text"
                className="shopee-form-input"
                placeholder="Nhập biểu tượng Emoji (VD: 📚, 🍔, 🚗)..."
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                style={{ width: '140px' }}
              />
              <input
                type="text"
                required
                className="shopee-form-input"
                placeholder="Nhập tên ngành hàng / danh mục mới (VD: Sách & Văn Phòng Phẩm)..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="shopee-btn shopee-btn-primary" style={{ whiteSpace: 'nowrap' }}>
                + Thêm Danh Mục
              </button>
            </form>

            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Icon</th>
                    <th>Tên Danh Mục Ngành Hàng</th>
                    <th>Số Mặt Hàng Đang Bán</th>
                    <th>Trạng Thái Hiển Thị</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontSize: '20px' }}>{c.icon}</td>
                      <td><strong>{c.name}</strong></td>
                      <td>{c.count} sản phẩm</td>
                      <td>
                        <span className={`shopee-status-badge ${c.active ? 'status-delivered' : 'status-cancelled'}`}>
                          {c.active ? 'Hiển thị công khai' : 'Tạm ẩn'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                          onClick={() => handleToggleCategory(c.id)}
                          style={{ marginRight: '6px' }}
                        >
                          {c.active ? 'Tạm Ẩn' : 'Bật Hiển Thị'}
                        </button>
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-sm"
                          style={{ background: '#fee2e2', color: '#dc2626', border: 'none' }}
                          onClick={() => handleDeleteCategory(c.id)}
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

        {/* TAB: BÁO CÁO TÀI CHÍNH & ĐỐI SOÁT HOA HỒNG SÀN */}
        {activeTab === 'finance' && (
          <div className="shopee-table-card">
            <div className="shopee-table-header">
              <div>
                <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>
                  Đối Soát Doanh Thu & Hoa Hồng Sàn (Commission 5%)
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Kỳ đối soát định kỳ 15 ngày/lần. Tự động tính toán phí chiết khấu sàn và số tiền thực nhận chuyển khoản cho từng Shop.
                </p>
              </div>
            </div>

            <div className="shopee-metrics-grid" style={{ margin: '16px 0 24px' }}>
              <div className="shopee-metric-card">
                <span className="shopee-metric-label">Tổng GMV Toàn Sàn Đối Soát</span>
                <div className="shopee-metric-value">{formatCurrency(totalPlatformRevenue)}</div>
              </div>
              <div className="shopee-metric-card">
                <span className="shopee-metric-label">Phí Hoa Hồng Sàn Thu Được (5%)</span>
                <div className="shopee-metric-value" style={{ color: 'var(--primary-color)' }}>{formatCurrency(platformCommission)}</div>
              </div>
              <div className="shopee-metric-card">
                <span className="shopee-metric-label">Tiền Cần Giải Ngân Cho Shop</span>
                <div className="shopee-metric-value" style={{ color: 'var(--color-success)' }}>{formatCurrency(totalPlatformRevenue - platformCommission)}</div>
              </div>
            </div>

            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Cửa Hàng Đối Tác</th>
                    <th>Kỳ Đối Soát</th>
                    <th>Tổng GMV Bán Được</th>
                    <th>Phí Sàn Khấu Trừ (5%)</th>
                    <th>Số Tiền Thực Trả Shop</th>
                    <th>Trạng Thái</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác Giải Ngân</th>
                  </tr>
                </thead>
                <tbody>
                  {financeList.map((f) => (
                    <tr key={f.id}>
                      <td>
                        <strong style={{ color: 'var(--text-primary)' }}>{f.shopName}</strong>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>ID: {f.shopId}</div>
                      </td>
                      <td>{f.period}</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(f.gmv)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--primary-color)' }}>-{formatCurrency(f.commission)}</td>
                      <td style={{ fontWeight: 800, color: 'var(--color-success)', fontSize: '14px' }}>
                        {formatCurrency(f.netPayout)}
                      </td>
                      <td>
                        <span className={`shopee-status-badge ${f.status === 'paid' ? 'status-delivered' : 'status-pending'}`}>
                          {f.statusText}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        {f.status === 'pending' ? (
                          <button
                            type="button"
                            className="shopee-btn shopee-btn-primary shopee-btn-sm"
                            onClick={() => handleSettlePayout(f.id)}
                          >
                            💳 Chuyển Khoản & Quyết Toán
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700 }}>
                            ✓ Đã Giải Ngân Thành Công
                          </span>
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
