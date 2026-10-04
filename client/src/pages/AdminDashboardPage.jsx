import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';
import { getVouchers, createVoucher, deleteVoucher } from '../services/voucherService';
import {
  getAdminUsers,
  deleteAdminUser,
  updateAdminUserStatus,
  getAdminShops,
  deleteAdminShop,
  updateAdminShopStatus,
} from '../services/adminService';
import {
  ShieldIcon,
  ChartBarIcon,
  StoreIcon,
  PackageIcon,
  UsersIcon,
  LayersIcon,
  TicketIcon,
  CreditCardIcon,
  RefreshIcon,
  TrashIcon,
  CartIcon,
  UserIcon,
  SparklesIcon,
  CheckIcon,
  CloseIcon,
  ClockIcon,
  ShirtIcon,
  LaptopIcon,
  HomeIcon,
  TargetIcon,
  PlusIcon,
  BookOpenIcon,
  FoodIcon,
  SearchIcon,
} from '../components/OrdersIcons';
import '../styles/dashboard.css';

const renderAdminCategoryIcon = (icon) => {
  switch (icon) {
    case 'fashion':
    case 'shirt':
    case '\u{1F455}':
      return <ShirtIcon size={20} color="#2563eb" />;
    case 'electronics':
    case 'headphones':
    case 'laptop':
    case '\u{1F3A7}':
      return <LaptopIcon size={20} color="#0284c7" />;
    case 'home':
    case 'living':
    case '\u{1F3E0}':
      return <HomeIcon size={20} color="#0d9488" />;
    case 'beauty':
    case '\u{1F484}':
      return <SparklesIcon size={20} color="#db2777" />;
    case 'sports':
    case '\u{26BD}':
      return <TargetIcon size={20} color="#ea580c" />;
    case 'book':
      return <BookOpenIcon size={20} color="#8b5cf6" />;
    case 'food':
      return <FoodIcon size={20} color="#f59e0b" />;
    default:
      return <PackageIcon size={20} color="#64748b" />;
  }
};

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
  { id: 'cat_01', name: 'Thời trang', icon: 'fashion', count: 42, active: true },
  { id: 'cat_02', name: 'Điện tử & Công nghệ', icon: 'electronics', count: 35, active: true },
  { id: 'cat_03', name: 'Đời sống & Nhà cửa', icon: 'living', count: 28, active: true },
  { id: 'cat_04', name: 'Sức khỏe & Làm đẹp', icon: 'beauty', count: 19, active: true },
  { id: 'cat_05', name: 'Thể thao & Du lịch', icon: 'sports', count: 14, active: true },
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
  const [shops, setShops] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_seller_shops');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const existingIds = new Set(INITIAL_ALL_SHOPS.map(s => s.id));
          const additions = parsed.filter(s => !existingIds.has(s.id));
          return [...additions, ...INITIAL_ALL_SHOPS];
        }
      }
    } catch (e) {
      // fallback
    }
    return INITIAL_ALL_SHOPS;
  });
  const [users, setUsers] = useState(INITIAL_ALL_USERS);
  const [moderationProducts, setModerationProducts] = useState(INITIAL_MODERATION_PRODUCTS);
  const [productModerationFilter, setProductModerationFilter] = useState('all');
  const [productSearch, setProductSearch] = useState('');
  const [categories, setCategories] = useState(INITIAL_CATEGORIES);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('package');
  const [financeList, setFinanceList] = useState(INITIAL_FINANCE_SETTLEMENTS);

  // States cho tính năng Xóa tài khoản & Xóa gian hàng
  const [userToDelete, setUserToDelete] = useState(null);
  const [shopToDelete, setShopToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Voucher Management
  const [vouchers, setVouchers] = useState([]);
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

  const refreshUserData = async (showToastNotice = false) => {
    try {
      const res = await getAdminUsers();
      if (Array.isArray(res) && res.length > 0) {
        setUsers(res.map(u => ({
          id: u._id || u.id,
          fullName: u.fullName || 'Người dùng',
          email: u.email,
          role: u.role || 'customer',
          status: u.status || (u.isActive ? 'active' : 'banned'),
          shopName: u.shopName || '',
          shopId: u.shopId || '',
          ordersCount: u.ordersCount || 0,
        })));
        if (showToastNotice) toast.success(`Đã đồng bộ ${res.length} tài khoản từ Database!`);
        return res.length;
      }
    } catch {
      // ignore
    }
    return 0;
  };

  const refreshShopData = async (showToastNotice = false) => {
    try {
      const res = await getAdminShops();
      if (Array.isArray(res) && res.length > 0) {
        setShops(res.map(s => ({
          id: s._id || s.id || s.shopId,
          shopId: s.shopId || s._id,
          name: s.name,
          ownerName: typeof s.ownerId === 'object' ? s.ownerId?.fullName : (s.ownerName || 'Chủ Shop'),
          email: typeof s.ownerId === 'object' ? s.ownerId?.email : (s.email || ''),
          phone: s.phone || '',
          productsCount: s.productsCount || 0,
          totalRevenue: s.totalRevenue || 0,
          status: s.status || 'active',
          statusText: s.status === 'active' ? 'Đang hoạt động' : s.status === 'locked' ? 'Đang bị khóa' : 'Chờ phê duyệt',
        })));
        if (showToastNotice) toast.success(`Đã đồng bộ ${res.length} gian hàng từ Database!`);
        return res.length;
      }
    } catch {
      // ignore
    }
    return 0;
  };

  // Load vouchers, users, shops from backend on mount and tab switch
  useEffect(() => {
    getVouchers().then(v => setVouchers(v || []));
    refreshUserData();
    refreshShopData();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') {
      refreshUserData();
    } else if (activeTab === 'shops') {
      refreshShopData();
    }
  }, [activeTab]);

  // Số liệu toàn sàn
  const totalPlatformRevenue = shops.reduce((sum, s) => sum + (s.totalRevenue || 0), 0);
  const totalActiveShops = shops.filter(s => s.status === 'active').length;
  const totalProducts = shops.reduce((sum, s) => sum + (s.productsCount || 0), 0);
  const platformCommission = Math.round(totalPlatformRevenue * 0.05); // 5% take rate

  const filteredModerationProducts = useMemo(() => {
    return moderationProducts.filter(p => {
      if (productModerationFilter !== 'all' && p.status !== productModerationFilter) return false;
      if (productSearch.trim()) {
        const q = productSearch.toLowerCase().trim();
        return (p.name || '').toLowerCase().includes(q) || (p.shopName || '').toLowerCase().includes(q);
      }
      return true;
    });
  }, [moderationProducts, productModerationFilter, productSearch]);

  const handleApproveShop = (shopId) => {
    setShops(prev => {
      const updated = prev.map(s => {
        if (s.id === shopId) {
          toast.success(`Đã chính thức phê duyệt mở gian hàng: ${s.name}`);
          return {
            ...s,
            status: 'active',
            statusText: 'Đang hoạt động',
          };
        }
        return s;
      });
      localStorage.setItem('mini_shopee_seller_shops', JSON.stringify(updated));
      return updated;
    });
  };

  const handleRejectShop = (shopId) => {
    setShops(prev => {
      const updated = prev.map(s => {
        if (s.id === shopId) {
          toast.info(`Đã từ chối phê duyệt hồ sơ gian hàng: ${s.name}`);
          return {
            ...s,
            status: 'locked',
            statusText: 'Bị từ chối',
          };
        }
        return s;
      });
      localStorage.setItem('mini_shopee_seller_shops', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleShopStatus = async (shopId) => {
    const targetShop = shops.find(s => s.id === shopId);
    const nextStatus = targetShop?.status === 'active' ? 'locked' : 'active';
    try {
      await updateAdminShopStatus(shopId, nextStatus);
    } catch {
      // Offline fallback
    }

    setShops(prev => {
      const updated = prev.map(s => {
        if (s.id === shopId) {
          toast.info(nextStatus === 'active' ? `Đã mở khóa hoạt động cho ${s.name}` : `Đã khóa gian hàng ${s.name}`);
          return {
            ...s,
            status: nextStatus,
            statusText: nextStatus === 'active' ? 'Đang hoạt động' : 'Đang bị khóa',
          };
        }
        return s;
      });
      localStorage.setItem('mini_shopee_seller_shops', JSON.stringify(updated));
      return updated;
    });
  };

  const handleToggleUserStatus = async (userId) => {
    const targetUser = users.find(u => u.id === userId);
    const nextStatus = targetUser?.status === 'active' ? 'banned' : 'active';
    try {
      await updateAdminUserStatus(userId, nextStatus);
    } catch {
      // Offline fallback
    }

    setUsers(prev => prev.map(u => {
      if (u.id === userId) {
        toast.info(nextStatus === 'active' ? `Đã mở khóa tài khoản ${u.fullName}` : `Đã tạm khóa tài khoản ${u.fullName}`);
        return { ...u, status: nextStatus };
      }
      return u;
    }));
  };

  // Xóa tài khoản Người mua hoặc Người bán
  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminUser(userToDelete.id);
    } catch (err) {
      console.warn("Delete API warning:", err.message);
    }

    // Cập nhật state UI
    setUsers(prev => prev.filter(u => u.id !== userToDelete.id && u.email !== userToDelete.email));

    // Nếu xóa người bán, loại bỏ luôn gian hàng liên kết khỏi UI & localStorage
    if (userToDelete.role === 'seller' || userToDelete.shopId) {
      setShops(prev => prev.filter(s => 
        s.ownerId !== userToDelete.id &&
        s.email !== userToDelete.email &&
        s.id !== userToDelete.shopId &&
        s.shopId !== userToDelete.shopId
      ));
      try {
        const saved = localStorage.getItem('mini_shopee_seller_shops');
        if (saved) {
          const parsed = JSON.parse(saved);
          const filtered = parsed.filter(s => s.id !== userToDelete.shopId && s.email !== userToDelete.email);
          localStorage.setItem('mini_shopee_seller_shops', JSON.stringify(filtered));
        }
      } catch (e) {
        // ignore
      }
    }

    toast.success(`Đã xóa vĩnh viễn tài khoản ${userToDelete.fullName} (${userToDelete.email}). Bạn có thể dùng email này để test đăng ký lại ngay bây giờ!`);
    setIsDeleting(false);
    setUserToDelete(null);
  };

  // Xóa gian hàng
  const handleConfirmDeleteShop = async () => {
    if (!shopToDelete) return;
    setIsDeleting(true);
    try {
      await deleteAdminShop(shopToDelete.id || shopToDelete.shopId);
    } catch (err) {
      console.warn("Delete shop API warning:", err.message);
    }

    setShops(prev => prev.filter(s => s.id !== shopToDelete.id && s.shopId !== shopToDelete.shopId));
    try {
      const saved = localStorage.getItem('mini_shopee_seller_shops');
      if (saved) {
        const parsed = JSON.parse(saved);
        const filtered = parsed.filter(s => s.id !== shopToDelete.id && s.shopId !== shopToDelete.shopId);
        localStorage.setItem('mini_shopee_seller_shops', JSON.stringify(filtered));
      }
    } catch (e) {
      // ignore
    }

    toast.success(`Đã xóa gian hàng "${shopToDelete.name}" thành công!`);
    setIsDeleting(false);
    setShopToDelete(null);
  };

  const handleCreateVoucher = async (e) => {
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

    const created = await createVoucher({
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

  const handleDeleteVoucher = async (vouchId) => {
    if (window.confirm("Bạn có chắc muốn xóa mã voucher này khỏi sàn?")) {
      await deleteVoucher(vouchId);
      // Reload vouchers from backend
      const updated = await getVouchers();
      setVouchers(updated || []);
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
      icon: newCatIcon || 'package',
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
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)', border: '1px solid #fed7aa', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(234, 88, 12, 0.25)' }}>
            <ShieldIcon size={20} color="#ffffff" />
          </div>
          <div className="shopee-sidebar-info">
            <h3>Super Admin</h3>
            <span
              className="shopee-sidebar-badge"
              style={{
                background: 'rgba(234, 88, 12, 0.1)',
                color: 'var(--primary-color, #ea580c)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              <span
                style={{
                  width: '14px',
                  height: '14px',
                  borderRadius: '50%',
                  background: 'rgba(234, 88, 12, 0.2)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldIcon size={9} color="#ea580c" />
              </span>
              <span>Quản Trị Toàn Sàn</span>
            </span>
          </div>
        </div>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: activeTab === 'overview' ? '#e0f2fe' : '#f1f5f9', flexShrink: 0 }}>
            <ChartBarIcon size={16} color="#0284c7" />
          </span>
          <span>Tổng Quan Sàn & GMV</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'shops' ? 'active' : ''}`}
          onClick={() => setActiveTab('shops')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: activeTab === 'shops' ? '#ffedd5' : '#f1f5f9', flexShrink: 0 }}>
            <StoreIcon size={16} color="#ea580c" />
          </span>
          <span>Quản Lý Cửa Hàng ({shops.length})</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: activeTab === 'products' ? '#dbeafe' : '#f1f5f9', flexShrink: 0 }}>
            <PackageIcon size={16} color="#2563eb" />
          </span>
          <span>Kiểm Duyệt Sản Phẩm ({moderationProducts.length})</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: activeTab === 'users' ? '#d1fae5' : '#f1f5f9', flexShrink: 0 }}>
            <UsersIcon size={16} color="#10b981" />
          </span>
          <span>Quản Lý Người Dùng ({users.length})</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'categories' ? 'active' : ''}`}
          onClick={() => setActiveTab('categories')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: activeTab === 'categories' ? '#ede9fe' : '#f1f5f9', flexShrink: 0 }}>
            <LayersIcon size={16} color="#8b5cf6" />
          </span>
          <span>Quản Lý Danh Mục ({categories.length})</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'vouchers' ? 'active' : ''}`}
          onClick={() => setActiveTab('vouchers')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: activeTab === 'vouchers' ? '#fef3c7' : '#f1f5f9', flexShrink: 0 }}>
            <TicketIcon size={16} color="#f59e0b" />
          </span>
          <span>Quản Lý Voucher Sàn ({vouchers.length})</span>
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'finance' ? 'active' : ''}`}
          onClick={() => setActiveTab('finance')}
          style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '28px', height: '28px', borderRadius: '7px', background: activeTab === 'finance' ? '#d1fae5' : '#f1f5f9', flexShrink: 0 }}>
            <CreditCardIcon size={16} color="#059669" />
          </span>
          <span>Đối Soát & Tài Chính</span>
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
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="shopee-metric-label">Tổng Doanh Số Sàn (GMV)</span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChartBarIcon size={18} color="#2563eb" />
              </div>
            </div>
            <div className="shopee-metric-value">{formatCurrency(totalPlatformRevenue)}</div>
            <span style={{ fontSize: '11px', color: 'var(--color-success, #16a34a)' }}>+18.4% so với tháng trước</span>
          </div>

          <div className="shopee-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="shopee-metric-label">Hoa Hồng Thu Sàn (5%)</span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CreditCardIcon size={18} color="#16a34a" />
              </div>
            </div>
            <div className="shopee-metric-value" style={{ color: 'var(--color-success, #16a34a)' }}>
              {formatCurrency(platformCommission)}
            </div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Doanh thu thuần của sàn</span>
          </div>

          <div className="shopee-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="shopee-metric-label">Gian Hàng Hoạt Động</span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(234, 88, 12, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <StoreIcon size={18} color="#ea580c" />
              </div>
            </div>
            <div className="shopee-metric-value">{totalActiveShops} / {shops.length}</div>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Tỷ lệ duyệt shop: 95%</span>
          </div>

          <div className="shopee-metric-card">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span className="shopee-metric-label">Tổng Thành Viên Sàn</span>
              <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(147, 51, 234, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <UsersIcon size={18} color="#9333ea" />
              </div>
            </div>
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>
                Danh Sách Gian Hàng Đăng Ký ({shops.length})
              </h2>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                onClick={() => refreshShopData(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '5px', background: '#dbeafe' }}>
                  <RefreshIcon size={13} color="#2563eb" />
                </span>
                <span>Đồng Bộ / Làm Mới</span>
              </button>
            </div>
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
                        {s.status === 'pending' ? (
                          <span
                            className="shopee-status-badge"
                            style={{
                              background: '#fef3c7',
                              color: '#b45309',
                              border: '1px solid #f59e0b',
                              fontWeight: 700,
                              fontSize: '11px',
                              padding: '3px 8px',
                              borderRadius: '6px',
                            }}
                          >
                            Chờ phê duyệt
                          </span>
                        ) : (
                          <span className={`shopee-status-badge ${s.status === 'active' ? 'status-active' : 'status-hidden'}`}>
                            {s.statusText}
                          </span>
                        )}
                      </td>
                      <td>
                        {s.status === 'pending' ? (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-sm"
                              style={{
                                background: '#10b981',
                                color: '#ffffff',
                                border: 'none',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                              }}
                              onClick={() => handleApproveShop(s.id)}
                            >
                              Duyệt
                            </button>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              style={{ color: '#ef4444', padding: '4px 8px', borderRadius: '6px' }}
                              onClick={() => handleRejectShop(s.id)}
                            >
                              Từ chối
                            </button>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-sm"
                              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => setShopToDelete(s)}
                              title="Xóa gian hàng này"
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrashIcon size={11} color="#dc2626" />
                              </span>
                              <span>Xóa</span>
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              style={s.status === 'active' ? { color: 'var(--color-error)' } : { color: 'var(--color-success)' }}
                              onClick={() => handleToggleShopStatus(s.id)}
                            >
                              {s.status === 'active' ? 'Khóa' : 'Mở khóa'}
                            </button>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-sm"
                              style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => setShopToDelete(s)}
                              title="Xóa gian hàng này"
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrashIcon size={11} color="#dc2626" />
                              </span>
                              <span>Xóa</span>
                            </button>
                          </div>
                        )}
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
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>
                Danh Sách Tài Khoản Người Dùng Toàn Sàn ({users.length})
              </h2>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                onClick={() => refreshUserData(true)}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontWeight: 600, padding: '6px 12px', borderRadius: '6px' }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '5px', background: '#dbeafe' }}>
                  <RefreshIcon size={13} color="#2563eb" />
                </span>
                <span>Đồng Bộ / Làm Mới</span>
              </button>
            </div>
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
                        <span className="shopee-sidebar-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                          {u.role === 'admin' ? (
                            <><ShieldIcon size={13} color="var(--primary-color)" /> Admin</>
                          ) : u.role === 'seller' ? (
                            <><StoreIcon size={13} color="#0284c7" /> Seller (Người bán)</>
                          ) : (
                            <><CartIcon size={13} color="#16a34a" /> Customer (Người mua)</>
                          )}
                        </span>
                      </td>
                      <td>
                        <span className={`shopee-status-badge ${u.status === 'active' ? 'status-active' : 'status-hidden'}`}>
                          {u.status === 'active' ? 'Bình thường' : 'Đã bị cấm'}
                        </span>
                      </td>
                      <td>
                        {u.role !== 'admin' ? (
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              style={u.status === 'active' ? { color: 'var(--color-error)' } : { color: 'var(--color-success)' }}
                              onClick={() => handleToggleUserStatus(u.id)}
                            >
                              {u.status === 'active' ? 'Cấm' : 'Mở'}
                            </button>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-sm"
                              style={{
                                background: '#fee2e2',
                                color: '#dc2626',
                                border: '1px solid #fca5a5',
                                fontWeight: 700,
                                padding: '4px 10px',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '6px'
                              }}
                              onClick={() => setUserToDelete(u)}
                              title="Xóa tài khoản vĩnh viễn để test đăng ký lại"
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrashIcon size={11} color="#dc2626" />
                              </span>
                              <span>Xóa</span>
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontSize: '11px', color: '#64748b', fontStyle: 'italic', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldIcon size={12} color="#dc2626" /> Bảo vệ Admin
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
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                {showAddVoucher ? (
                  <>
                    <CloseIcon size={14} color="#64748b" />
                    <span>Đóng form</span>
                  </>
                ) : (
                  <>
                    <PlusIcon size={14} color="#ffffff" />
                    <span>Tạo Voucher Mới</span>
                  </>
                )}
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
                  <button type="submit" className="shopee-btn shopee-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CheckIcon size={12} color="#ffffff" />
                    </span>
                    <span>Phát Hành Voucher Toàn Sàn</span>
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
                          style={{ color: 'var(--color-error)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={() => handleDeleteVoucher(v.id)}
                        >
                          <span
                            style={{
                              width: '16px',
                              height: '16px',
                              borderRadius: '4px',
                              background: 'rgba(239, 68, 68, 0.12)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <TrashIcon size={10} color="#ef4444" />
                          </span>
                          <span>Xóa</span>
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
            <div className="shopee-table-header" style={{ marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>
                  Kiểm Duyệt Sản Phẩm Toàn Sàn ({moderationProducts.length})
                </h2>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Phê duyệt sản phẩm mới đăng của các shop trước khi xuất hiện trên sàn hoặc xử lý sản phẩm vi phạm.
                </p>
              </div>
            </div>

            {/* Toolbar: Filter Tabs & Search */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap', marginBottom: '16px', borderBottom: '1px solid var(--border-light, #f1f5f9)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className={`seller-tab-btn ${productModerationFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setProductModerationFilter('all')}
                >
                  Tất cả ({moderationProducts.length})
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${productModerationFilter === 'pending' ? 'active' : ''}`}
                  onClick={() => setProductModerationFilter('pending')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '4px', background: '#fef3c7' }}>
                      <ClockIcon size={11} color="#d97706" />
                    </span>
                    <span>Chờ duyệt ({moderationProducts.filter(p => p.status === 'pending').length})</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${productModerationFilter === 'approved' ? 'active' : ''}`}
                  onClick={() => setProductModerationFilter('approved')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '4px', background: '#dcfce7' }}>
                      <CheckIcon size={11} color="#059669" />
                    </span>
                    <span>Đã duyệt ({moderationProducts.filter(p => p.status === 'approved').length})</span>
                  </span>
                </button>
                <button
                  type="button"
                  className={`seller-tab-btn ${productModerationFilter === 'rejected' ? 'active' : ''}`}
                  onClick={() => setProductModerationFilter('rejected')}
                >
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '4px', background: '#fee2e2' }}>
                      <CloseIcon size={11} color="#dc2626" />
                    </span>
                    <span>Từ chối / Gỡ ({moderationProducts.filter(p => p.status === 'rejected').length})</span>
                  </span>
                </button>
              </div>

              <div style={{ position: 'relative', minWidth: '240px' }}>
                <input
                  type="text"
                  className="shopee-form-input"
                  placeholder="Tìm kiếm sản phẩm, shop..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  style={{ padding: '6px 12px 6px 32px', fontSize: '13px', borderRadius: '6px' }}
                />
                <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', display: 'flex', alignItems: 'center' }}>
                  <SearchIcon size={13} color="#94a3b8" />
                </span>
                {productSearch && (
                  <button
                    type="button"
                    onClick={() => setProductSearch('')}
                    style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                    title="Xóa tìm kiếm"
                  >
                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloseIcon size={10} color="#ef4444" />
                    </span>
                  </button>
                )}
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
                  {filteredModerationProducts.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                        Không có sản phẩm nào phù hợp với điều kiện kiểm duyệt.
                      </td>
                    </tr>
                  ) : (
                    filteredModerationProducts.map((p) => (
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
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {p.status === 'approved' ? (
                              <>
                                <CheckIcon size={12} color="#059669" />
                                <span>Đã Duyệt</span>
                              </>
                            ) : p.status === 'pending' ? (
                              <>
                                <ClockIcon size={12} color="#d97706" />
                                <span>Chờ Duyệt</span>
                              </>
                            ) : (
                              <>
                                <CloseIcon size={12} color="#dc2626" />
                                <span>Từ Chối / Gỡ Bỏ</span>
                              </>
                            )}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          {p.status !== 'approved' && (
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-sm"
                              style={{ background: '#ecfdf5', color: '#059669', border: '1px solid #10b981', marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => handleApproveProduct(p.id)}
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckIcon size={10} color="#059669" />
                              </span>
                              <span>Duyệt Bán</span>
                            </button>
                          )}
                          {p.status !== 'rejected' && (
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-sm"
                              style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #ef4444', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => handleRejectProduct(p.id)}
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CloseIcon size={10} color="#dc2626" />
                              </span>
                              <span>Gỡ Bỏ</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
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
              <select
                className="shopee-form-select"
                value={newCatIcon}
                onChange={(e) => setNewCatIcon(e.target.value)}
                style={{ width: '170px' }}
              >
                <option value="package">Mặc định (Kiện hàng)</option>
                <option value="fashion">Thời trang</option>
                <option value="electronics">Điện tử & CN</option>
                <option value="living">Đời sống & Nhà cửa</option>
                <option value="beauty">Sắc đẹp & Sức khỏe</option>
                <option value="sports">Thể thao & Dã ngoại</option>
                <option value="book">Sách & Văn phòng</option>
                <option value="food">Ẩm thực & Bách hóa</option>
              </select>
              <input
                type="text"
                required
                className="shopee-form-input"
                placeholder="Nhập tên ngành hàng / danh mục mới (VD: Sách & Văn Phòng Phẩm)..."
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ flex: 1 }}
              />
              <button type="submit" className="shopee-btn shopee-btn-primary" style={{ whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PlusIcon size={12} color="#ffffff" />
                </span>
                <span>Thêm Danh Mục</span>
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
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '32px', height: '32px', borderRadius: '6px', background: '#f1f5f9' }}>
                          {renderAdminCategoryIcon(c.icon)}
                        </span>
                      </td>
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
                          style={{ marginRight: '6px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                        >
                          {c.active ? (
                            <>
                              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(245, 158, 11, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <ClockIcon size={10} color="#d97706" />
                              </span>
                              <span>Tạm Ẩn</span>
                            </>
                          ) : (
                            <>
                              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckIcon size={10} color="#16a34a" />
                              </span>
                              <span>Bật Hiển Thị</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          className="shopee-btn shopee-btn-sm"
                          style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #fca5a5', display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '4px 8px', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
                          onClick={() => handleDeleteCategory(c.id)}
                        >
                          <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(220, 38, 38, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrashIcon size={10} color="#dc2626" />
                          </span>
                          <span>Xóa</span>
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
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                          >
                            <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                              <CreditCardIcon size={12} color="#ffffff" />
                            </span>
                            <span>Chuyển Khoản & Quyết Toán</span>
                          </button>
                        ) : (
                          <span style={{ fontSize: '12px', color: 'var(--color-success)', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                            <CheckIcon size={14} color="var(--color-success)" />
                            <span>Đã Giải Ngân Thành Công</span>
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

        {/* ==================== MODAL XÁC NHẬN XÓA TÀI KHOẢN (NGƯỜI MUA & NGƯỜI BÁN) ==================== */}
        {userToDelete && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}>
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                padding: '18px 24px',
                borderBottom: '1px solid #fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <TrashIcon size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#991b1b' }}>
                    Xác Nhận Xóa Vĩnh Viễn Tài Khoản
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#b91c1c' }}>
                    Hỗ trợ dọn sạch dữ liệu để kiểm thử (Test) đăng ký lại
                  </p>
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '22px 24px' }}>
                <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                  Bạn có chắc chắn muốn xóa vĩnh viễn tài khoản người dùng sau?
                </p>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Họ và tên:</span>
                    <strong style={{ color: '#0f172a' }}>{userToDelete.fullName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Email:</span>
                    <code style={{ color: '#dc2626', fontWeight: 700, background: '#fee2e2', padding: '2px 6px', borderRadius: '4px' }}>
                      {userToDelete.email}
                    </code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Phân quyền vai trò:</span>
                    <span style={{
                      fontWeight: 700,
                      fontSize: '12px',
                      padding: '2px 8px',
                      borderRadius: '999px',
                      background: userToDelete.role === 'seller' ? '#e0f2fe' : '#f1f5f9',
                      color: userToDelete.role === 'seller' ? '#0369a1' : '#475569',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      {userToDelete.role === 'seller' ? (
                        <><StoreIcon size={12} color="#2563eb" /> Người bán (Seller)</>
                      ) : (
                        <><CartIcon size={12} color="#059669" /> Người mua (Customer)</>
                      )}
                    </span>
                  </div>
                  {userToDelete.role === 'seller' && (
                    <div style={{
                      marginTop: '6px',
                      paddingTop: '8px',
                      borderTop: '1px dashed #cbd5e1',
                      color: '#b45309',
                      fontSize: '12px',
                      lineHeight: 1.5
                    }}>
                      <strong>Gian hàng đi kèm:</strong> Hệ thống sẽ tự động dọn sạch gian hàng của người bán này và các mặt hàng niêm yết để giải phóng hoàn toàn tên shop.
                    </div>
                  )}
                </div>

                <div style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: '8px',
                  padding: '10px 14px',
                  fontSize: '13px',
                  color: '#166534',
                  display: 'flex',
                  gap: '8px',
                  alignItems: 'center'
                }}>
                  <SparklesIcon size={15} color="#16a34a" />
                  <span><strong>Mục đích kiểm thử:</strong> Sau khi xóa, bạn có thể nhập lại email này trên trang Đăng ký để test lại toàn bộ luồng từ đầu.</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setUserToDelete(null)}
                  style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.12)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CloseIcon size={10} color="#ef4444" />
                  </span>
                  <span>Hủy Bỏ</span>
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="shopee-btn"
                  onClick={handleConfirmDeleteUser}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <TrashIcon size={14} color="#ffffff" />
                  <span>{isDeleting ? 'Đang Xóa...' : 'Xác Nhận Xóa Vĩnh Viễn'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== MODAL XÁC NHẬN XÓA GIAN HÀNG ==================== */}
        {shopToDelete && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '16px'
          }}>
            <div style={{
              background: '#ffffff',
              borderRadius: '16px',
              maxWidth: '520px',
              width: '100%',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)',
                padding: '18px 24px',
                borderBottom: '1px solid #fca5a5',
                display: 'flex',
                alignItems: 'center',
                gap: '14px'
              }}>
                <div style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '50%',
                  background: '#ef4444',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <StoreIcon size={20} color="#ffffff" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800, color: '#991b1b' }}>
                    Xác Nhận Xóa Gian Hàng
                  </h3>
                  <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#b91c1c' }}>
                    Gỡ bỏ gian hàng và toàn bộ sản phẩm niêm yết
                  </p>
                </div>
              </div>

              <div style={{ padding: '22px 24px' }}>
                <p style={{ margin: '0 0 14px', fontSize: '14px', color: '#334155', lineHeight: 1.5 }}>
                  Bạn có chắc chắn muốn xóa gian hàng sau khỏi sàn?
                </p>

                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '14px 16px',
                  marginBottom: '16px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Tên gian hàng:</span>
                    <strong style={{ color: '#0f172a' }}>{shopToDelete.name}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Mã Shop:</span>
                    <code style={{ color: '#0284c7', fontWeight: 700 }}>{shopToDelete.shopId || shopToDelete.id}</code>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                    <span style={{ color: '#64748b' }}>Chủ sở hữu:</span>
                    <span style={{ color: '#334155' }}>{shopToDelete.ownerName || 'N/A'}</span>
                  </div>
                </div>

                <p style={{ margin: 0, fontSize: '12px', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <TrashIcon size={13} color="#dc2626" />
                  <span>Cảnh báo: Thao tác này sẽ xóa vĩnh viễn gian hàng và toàn bộ sản phẩm của gian hàng này.</span>
                </p>
              </div>

              <div style={{
                padding: '16px 24px',
                background: '#f8fafc',
                borderTop: '1px solid #e2e8f0',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px'
              }}>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setShopToDelete(null)}
                  style={{ padding: '8px 18px', borderRadius: '8px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.12)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CloseIcon size={10} color="#ef4444" />
                  </span>
                  <span>Hủy Bỏ</span>
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  className="shopee-btn"
                  onClick={handleConfirmDeleteShop}
                  style={{
                    background: '#dc2626',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 20px',
                    borderRadius: '8px',
                    fontWeight: 700,
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    opacity: isDeleting ? 0.7 : 1,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <TrashIcon size={14} color="#ffffff" />
                  <span>{isDeleting ? 'Đang Xóa...' : 'Xác Nhận Xóa Gian Hàng'}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
