import React, { useState, useEffect } from 'react';
import { useAuth, DEMO_ACCOUNTS } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';
import ShippingLabelModal from '../components/ShippingLabelModal';
import '../styles/dashboard.css';


// Danh sách các Shop mẫu để demo tính năng nhiều shop quản lý độc lập
const INITIAL_SHOPS = [
  {
    id: "shop_01",
    name: "Thời Trang GenZ Official",
    logo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120",
    phone: "0912345678",
    address: "Kho Tân Bình, TP. Hồ Chí Minh",
    rating: 4.9,
    status: "active"
  },
  {
    id: "shop_02",
    name: "TechWorld Store",
    logo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120",
    phone: "0987654321",
    address: "Kho Cầu Giấy, Hà Nội",
    rating: 4.8,
    status: "active"
  }
];

// Dữ liệu sản phẩm mẫu phân bổ theo từng shopId
const INITIAL_SELLER_PRODUCTS = [
  {
    _id: "prod_01",
    shopId: "shop_01",
    name: "Áo thun nam basic cotton 100% thoáng mát",
    price: 199000,
    originalPrice: 299000,
    stock: 50,
    sold: 120,
    category: "Thời trang",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300",
    isActive: true
  },
  {
    _id: "prod_02",
    shopId: "shop_01",
    name: "Áo sơ mi nữ công sở lụa cao cấp chống nhăn",
    price: 259000,
    originalPrice: 359000,
    stock: 35,
    sold: 85,
    category: "Thời trang",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=300",
    isActive: true
  },
  {
    _id: "prod_03",
    shopId: "shop_01",
    name: "Quần jean nam ống đứng co giãn 4 chiều",
    price: 399000,
    originalPrice: 549000,
    stock: 42,
    sold: 210,
    category: "Thời trang",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=300",
    isActive: true
  },
  {
    _id: "prod_04",
    shopId: "shop_02",
    name: "Tai nghe Bluetooth True Wireless chống ồn ANC",
    price: 650000,
    originalPrice: 950000,
    stock: 80,
    sold: 540,
    category: "Điện tử",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=300",
    isActive: true
  },
  {
    _id: "prod_05",
    shopId: "shop_02",
    name: "Chuột không dây công thái học Silent Click",
    price: 290000,
    originalPrice: 420000,
    stock: 65,
    sold: 340,
    category: "Điện tử",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300",
    isActive: true
  },
  {
    _id: "prod_06",
    shopId: "shop_02",
    name: "Bàn phím cơ không dây RGB Hot-swap 87 phím",
    price: 890000,
    originalPrice: 1290000,
    stock: 25,
    sold: 190,
    category: "Điện tử",
    image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=300",
    isActive: true
  }
];

// Danh sách đơn hàng thuộc từng shop
const INITIAL_SELLER_ORDERS = [
  {
    orderId: "ORD918231",
    shopId: "shop_01",
    customerName: "Nguyễn Văn Khách",
    phone: "0901234567",
    productName: "Áo thun nam basic cotton (x2)",
    total: 428000,
    status: "shipping",
    statusText: "Đang giao hàng",
    createdAt: "2026-09-24 14:20"
  },
  {
    orderId: "ORD716254",
    shopId: "shop_01",
    customerName: "Lê Minh Tuấn",
    phone: "0933445566",
    productName: "Quần jean nam ống đứng (x1)",
    total: 429000,
    status: "pending",
    statusText: "Chờ xác nhận",
    createdAt: "2026-09-25 08:30"
  },
  {
    orderId: "ORD827103",
    shopId: "shop_02",
    customerName: "Trần Anh Khoa",
    phone: "0944556677",
    productName: "Tai nghe Bluetooth True Wireless (x1)",
    total: 680000,
    status: "completed",
    statusText: "Đã hoàn thành",
    createdAt: "2026-09-20 09:15"
  }
];

export default function SellerDashboardPage() {
  const { user, loginAsDemo } = useAuth();
  const toast = useToast();

  // Shop hiện tại đang được quản lý (cho phép đổi shop linh hoạt để trải nghiệm đa shop)
  const [selectedShopId, setSelectedShopId] = useState(() => {
    return user?.shopId || "shop_01";
  });

  const [shops] = useState(INITIAL_SHOPS);
  const currentShop = shops.find(s => s.id === selectedShopId) || shops[0];

  const [activeTab, setActiveTab] = useState('products'); // 'products' | 'orders' | 'settings'
  const [products, setProducts] = useState(INITIAL_SELLER_PRODUCTS);
  const [orders, setOrders] = useState(INITIAL_SELLER_ORDERS);

  // Modal thêm / sửa mặt hàng
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [printingOrder, setPrintingOrder] = useState(null);

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    originalPrice: '',
    stock: '',
    category: 'Thời trang',
    image: ''
  });

  // Lọc sản phẩm & đơn hàng theo đúng Shop đang chọn
  const shopProducts = products.filter(p => p.shopId === selectedShopId);
  const shopOrders = orders.filter(o => o.shopId === selectedShopId);

  // Tính số liệu thống kê cho riêng shop này
  const totalRevenue = shopOrders
    .filter(o => o.status !== 'cancelled')
    .reduce((sum, o) => sum + o.total, 0);

  const totalSoldItems = shopProducts.reduce((sum, p) => sum + (p.sold || 0), 0);

  // Mở modal thêm sản phẩm mới
  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      price: '',
      originalPrice: '',
      stock: '50',
      category: selectedShopId === 'shop_02' ? 'Điện tử' : 'Thời trang',
      image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300'
    });
    setShowProductModal(true);
  };

  // Mở modal sửa sản phẩm
  const handleOpenEditModal = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name,
      price: prod.price,
      originalPrice: prod.originalPrice || '',
      stock: prod.stock,
      category: prod.category,
      image: prod.image
    });
    setShowProductModal(true);
  };

  // Lưu sản phẩm (Thêm mới hoặc Cập nhật)
  const handleSaveProduct = (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) return;

    if (editingProduct) {
      setProducts(prev => prev.map(p => {
        if (p._id === editingProduct._id) {
          return {
            ...p,
            name: productForm.name,
            price: Number(productForm.price),
            originalPrice: Number(productForm.originalPrice) || Number(productForm.price),
            stock: Number(productForm.stock),
            category: productForm.category,
            image: productForm.image
          };
        }
        return p;
      }));
      toast.success(`Đã cập nhật sản phẩm "${productForm.name}" thành công!`);
    } else {
      const newProd = {
        _id: 'prod_' + Date.now(),
        shopId: selectedShopId,
        name: productForm.name,
        price: Number(productForm.price),
        originalPrice: Number(productForm.originalPrice) || Number(productForm.price) * 1.3,
        stock: Number(productForm.stock) || 50,
        sold: 0,
        category: productForm.category,
        image: productForm.image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300',
        isActive: true
      };
      setProducts(prev => [newProd, ...prev]);
      toast.success(`Đã đăng bán mới "${productForm.name}" cho Shop!`);
    }
    setShowProductModal(false);
  };

  // Xóa sản phẩm
  const handleDeleteProduct = (prodId) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa sản phẩm này khỏi Shop?")) {
      setProducts(prev => prev.filter(p => p._id !== prodId));
      toast.info("Đã xóa sản phẩm khỏi danh sách cửa hàng");
    }
  };

  // Bật/tắt trạng thái ẩn hiện sản phẩm
  const handleToggleActive = (prodId) => {
    setProducts(prev => prev.map(p => {
      if (p._id === prodId) {
        const nextState = !p.isActive;
        toast.info(nextState ? `Đã hiển thị sản phẩm trên sàn` : `Đã tạm ẩn sản phẩm`);
        return { ...p, isActive: nextState };
      }
      return p;
    }));
  };

  // Đổi trạng thái đơn hàng (Xác nhận / Giao hàng)
  const handleUpdateOrderStatus = (orderId, nextStatus, nextText) => {
    setOrders(prev => prev.map(o => {
      if (o.orderId === orderId) {
        return { ...o, status: nextStatus, statusText: nextText };
      }
      return o;
    }));
    toast.success(`Đã cập nhật đơn #${orderId}: ${nextText}`);
  };

  return (
    <div className="shopee-dashboard-container">
      {/* Sidebar điều hướng Kênh Người Bán */}
      <aside className="shopee-sidebar">
        <div className="shopee-sidebar-brand">
          <img src={currentShop.logo} alt={currentShop.name} className="shopee-sidebar-logo" />
          <div className="shopee-sidebar-info">
            <h3>{currentShop.name}</h3>
            <span className="shopee-sidebar-badge">Kênh Người Bán</span>
          </div>
        </div>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          📦 Quản Lý Mặt Hàng ({shopProducts.length})
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
        >
          📑 Đơn Hàng Của Shop ({shopOrders.length})
        </button>

        <button
          type="button"
          className={`shopee-nav-item ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          ⚙️ Cài Đặt Shop
        </button>
      </aside>

      {/* Main Content Area */}
      <main className="shopee-dashboard-main">
        {/* Header Dashboard & Bộ chuyển đổi Shop Demo */}
        <div className="shopee-dashboard-header">
          <div>
            <h1 className="shopee-dashboard-title">Kênh Quản Lý Cửa Hàng: {currentShop.name}</h1>
            <p className="shopee-dashboard-subtitle">
              Không gian riêng của Shop. Sản phẩm và đơn hàng tại đây được cách ly độc lập.
            </p>
          </div>

          {/* Công cụ chuyển đổi Shop để demo tính năng nhiều Shop khác nhau */}
          <div className="shopee-shop-switcher">
            <span style={{ fontWeight: 600, color: 'var(--primary-color)' }}>🔄 Xem Shop khác:</span>
            <select
              value={selectedShopId}
              onChange={(e) => setSelectedShopId(e.target.value)}
              aria-label="Chọn Shop quản lý"
            >
              <option value="shop_01">Shop 1: Thời Trang GenZ Official</option>
              <option value="shop_02">Shop 2: TechWorld Store</option>
            </select>
          </div>
        </div>

        {/* 4 Thẻ chỉ số thống kê của Shop hiện tại */}
        <div className="shopee-metrics-grid">
          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Tổng Doanh Thu Shop</span>
            <span className="shopee-metric-value">{formatCurrency(totalRevenue)}</span>
            <span className="shopee-metric-hint">Đã thanh toán & đang giao</span>
          </div>
          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Đơn Hàng Của Shop</span>
            <span className="shopee-metric-value">{shopOrders.length}</span>
            <span className="shopee-metric-hint">Cần xử lý: {shopOrders.filter(o => o.status === 'pending').length} đơn</span>
          </div>
          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Số Mặt Hàng Đang Bán</span>
            <span className="shopee-metric-value">{shopProducts.filter(p => p.isActive).length}</span>
            <span className="shopee-metric-hint">Tổng tồn kho: {shopProducts.reduce((sum, p) => sum + p.stock, 0)} cái</span>
          </div>
          <div className="shopee-metric-card">
            <span className="shopee-metric-label">Đánh Giá Shop</span>
            <span className="shopee-metric-value">★ {currentShop.rating} / 5.0</span>
            <span className="shopee-metric-hint">Đã bán {totalSoldItems} sản phẩm</span>
          </div>
        </div>

        {/* TAB 1: QUẢN LÝ SẢN PHẨM CỦA SHOP */}
        {activeTab === 'products' && (
          <div className="shopee-table-card">
            <div className="shopee-table-toolbar">
              <h2 style={{ fontSize: '16px', margin: 0, fontWeight: 700 }}>
                Danh Sách Mặt Hàng Của Shop ({shopProducts.length})
              </h2>
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                onClick={handleOpenAddModal}
              >
                + Đăng Bán Sản Phẩm Mới
              </button>
            </div>

            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Hình ảnh</th>
                    <th>Tên mặt hàng</th>
                    <th>Danh mục</th>
                    <th>Giá bán</th>
                    <th>Kho hàng</th>
                    <th>Đã bán</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {shopProducts.length === 0 ? (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '30px' }}>
                        Shop hiện chưa có mặt hàng nào. Bấm <strong>+ Đăng Bán Sản Phẩm Mới</strong> để đăng bài!
                      </td>
                    </tr>
                  ) : (
                    shopProducts.map(prod => (
                      <tr key={prod._id}>
                        <td>
                          <img src={prod.image} alt={prod.name} className="shopee-table-thumb" />
                        </td>
                        <td>
                          <div className="shopee-table-item-name" title={prod.name}>
                            {prod.name}
                          </div>
                        </td>
                        <td>{prod.category}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                          {formatCurrency(prod.price)}
                        </td>
                        <td>{prod.stock}</td>
                        <td>{prod.sold || 0}</td>
                        <td>
                          <span className={`shopee-status-badge ${prod.isActive ? 'status-active' : 'status-hidden'}`}>
                            {prod.isActive ? 'Đang bán' : 'Đã ẩn'}
                          </span>
                        </td>
                        <td>
                          <div className="shopee-table-actions">
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              onClick={() => handleOpenEditModal(prod)}
                            >
                              Sửa
                            </button>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              onClick={() => handleToggleActive(prod._id)}
                            >
                              {prod.isActive ? 'Ẩn' : 'Hiện'}
                            </button>
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              style={{ color: 'var(--color-error)' }}
                              onClick={() => handleDeleteProduct(prod._id)}
                            >
                              Xóa
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: ĐƠN HÀNG THUỘC SHOP */}
        {activeTab === 'orders' && (
          <div className="shopee-table-card">
            <h2 style={{ fontSize: '16px', margin: '0 0 16px', fontWeight: 700 }}>
              Đơn Hàng Khách Đặt Tại {currentShop.name} ({shopOrders.length})
            </h2>

            <div className="shopee-table-responsive">
              <table className="shopee-data-table">
                <thead>
                  <tr>
                    <th>Mã đơn</th>
                    <th>Thời gian</th>
                    <th>Khách hàng</th>
                    <th>Mặt hàng đặt</th>
                    <th>Tổng tiền</th>
                    <th>Trạng thái</th>
                    <th>Xử lý đơn</th>
                  </tr>
                </thead>
                <tbody>
                  {shopOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                        Chưa có đơn hàng nào phát sinh cho Shop này.
                      </td>
                    </tr>
                  ) : (
                    shopOrders.map(ord => (
                      <tr key={ord.orderId}>
                        <td><strong>#{ord.orderId}</strong></td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{ord.createdAt}</td>
                        <td>
                          <div>{ord.customerName}</div>
                          <small style={{ color: 'var(--text-muted)' }}>{ord.phone}</small>
                        </td>
                        <td>{ord.productName}</td>
                        <td style={{ fontWeight: 600, color: 'var(--primary-color)' }}>
                          {formatCurrency(ord.total)}
                        </td>
                        <td>
                          <span className={`shopee-status-badge status-${ord.status}`}>
                            {ord.statusText}
                          </span>
                        </td>
                        <td>
                          {ord.status === 'pending' && (
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-primary shopee-btn-sm"
                              onClick={() => handleUpdateOrderStatus(ord.orderId, 'shipping', 'Đang giao hàng')}
                            >
                              Xác nhận & Giao shipper
                            </button>
                          )}
                          {ord.status === 'shipping' && (
                            <button
                              type="button"
                              className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                              onClick={() => handleUpdateOrderStatus(ord.orderId, 'completed', 'Đã hoàn thành')}
                            >
                              Giao thành công
                            </button>
                          )}
                          {ord.status === 'completed' && (
                            <span style={{ fontSize: '12px', color: 'var(--color-success)' }}>✓ Đã hoàn tất</span>
                          )}
                          <button
                            type="button"
                            className="shopee-btn shopee-btn-secondary shopee-btn-sm"
                            style={{ marginLeft: '6px' }}
                            onClick={() => setPrintingOrder(ord)}
                            title="In phiếu gửi hàng & Hóa đơn"
                          >
                            🖨️ In Vận Đơn
                          </button>
                        </td>
                      </tr>
                    ))

                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: CÀI ĐẶT THÔNG TIN SHOP */}
        {activeTab === 'settings' && (
          <div className="shopee-table-card" style={{ maxWidth: '650px' }}>
            <h2 style={{ fontSize: '16px', margin: '0 0 16px', fontWeight: 700 }}>
              Hồ Sơ Cửa Hàng
            </h2>
            <div className="shopee-form-group">
              <label className="shopee-form-label">Tên Shop</label>
              <input type="text" className="shopee-form-input" value={currentShop.name} readOnly />
            </div>
            <div className="shopee-form-group">
              <label className="shopee-form-label">Hotline Shop</label>
              <input type="text" className="shopee-form-input" value={currentShop.phone} readOnly />
            </div>
            <div className="shopee-form-group">
              <label className="shopee-form-label">Địa chỉ kho lấy hàng</label>
              <input type="text" className="shopee-form-input" value={currentShop.address} readOnly />
            </div>
            <div className="shopee-form-group">
              <label className="shopee-form-label">Mã định danh Shop (Shop ID)</label>
              <input type="text" className="shopee-form-input" value={currentShop.id} readOnly style={{ opacity: 0.8 }} />
            </div>
          </div>
        )}

        {/* MODAL THÊM / CHỈNH SỬA SẢN PHẨM CỦA SHOP */}
        {showProductModal && (
          <div className="shopee-modal-overlay" onClick={() => setShowProductModal(false)}>
            <div className="shopee-modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="shopee-modal-header">
                <h3>{editingProduct ? 'Chỉnh Sửa Mặt Hàng' : 'Đăng Bán Mặt Hàng Mới Cho Shop'}</h3>
                <button
                  type="button"
                  className="shopee-modal-close"
                  onClick={() => setShowProductModal(false)}
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleSaveProduct}>
                <div className="shopee-form-group">
                  <label className="shopee-form-label" htmlFor="name">Tên mặt hàng *</label>
                  <input
                    id="name"
                    type="text"
                    className="shopee-form-input"
                    placeholder="Ví dụ: Áo khoác hoodie nỉ ngoại..."
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    required
                  />
                </div>

                <div className="shopee-form-row">
                  <div className="shopee-form-group">
                    <label className="shopee-form-label" htmlFor="price">Giá bán (VND) *</label>
                    <input
                      id="price"
                      type="number"
                      className="shopee-form-input"
                      placeholder="199000"
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      required
                    />
                  </div>

                  <div className="shopee-form-group">
                    <label className="shopee-form-label" htmlFor="originalPrice">Giá gốc (VND)</label>
                    <input
                      id="originalPrice"
                      type="number"
                      className="shopee-form-input"
                      placeholder="299000"
                      value={productForm.originalPrice}
                      onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    />
                  </div>
                </div>

                <div className="shopee-form-row">
                  <div className="shopee-form-group">
                    <label className="shopee-form-label" htmlFor="stock">Số lượng tồn kho *</label>
                    <input
                      id="stock"
                      type="number"
                      className="shopee-form-input"
                      placeholder="50"
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      required
                    />
                  </div>

                  <div className="shopee-form-group">
                    <label className="shopee-form-label" htmlFor="category">Danh mục</label>
                    <select
                      id="category"
                      className="shopee-form-select"
                      value={productForm.category}
                      onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    >
                      <option value="Thời trang">Thời trang</option>
                      <option value="Điện tử">Điện tử</option>
                      <option value="Gia dụng">Gia dụng</option>
                      <option value="Phụ kiện">Phụ kiện</option>
                      <option value="Mỹ phẩm">Mỹ phẩm</option>
                    </select>
                  </div>
                </div>

                <div className="shopee-form-group">
                  <label className="shopee-form-label" htmlFor="image">Link ảnh sản phẩm (URL)</label>
                  <input
                    id="image"
                    type="url"
                    className="shopee-form-input"
                    placeholder="https://images.unsplash.com/..."
                    value={productForm.image}
                    onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                  />
                  {productForm.image && (
                    <img
                      src={productForm.image}
                      alt="Xem trước"
                      style={{ width: '80px', height: '80px', objectFit: 'cover', marginTop: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    />
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    onClick={() => setShowProductModal(false)}
                  >
                    Hủy bỏ
                  </button>
                  <button type="submit" className="shopee-btn shopee-btn-primary">
                    {editingProduct ? 'Cập Nhật Mặt Hàng' : 'Đăng Bán Ngay'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal In Phiếu Giao Hàng & Hóa Đơn */}
        {printingOrder && (
          <ShippingLabelModal
            order={printingOrder}
            shopName={currentShop.name}
            onClose={() => setPrintingOrder(null)}
          />
        )}

      </main>
    </div>
  );
}

