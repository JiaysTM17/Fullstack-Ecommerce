import React, { useEffect, useState, useRef, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getAllShops } from '../services/shopService';
import {
  SearchIcon,
  PackageIcon,
  ShoppingBagIcon,
  StoreIcon,
  RefreshIcon,
  FlameIcon,
  BoltIcon,
  CloseIcon,
  LayersIcon,
  DressIcon,
  LaptopIcon,
  BeautyIcon,
  CookingIcon,
  BabyIcon,
  SportIcon,
  SmartphoneIcon,
  BookOpenIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './OrdersIcons';
import '../styles/category-drawer.css';

const getDrawerCategoryIcon = (id, size = 22, color = null) => {
  switch (id) {
    case 'thoi-trang':
      return <DressIcon size={size} color={color || '#ec4899'} />;
    case 'dien-tu':
      return <LaptopIcon size={size} color={color || '#3b82f6'} />;
    case 'sac-dep':
      return <BeautyIcon size={size} color={color || '#f43f5e'} />;
    case 'gia-dung':
      return <CookingIcon size={size} color={color || '#f59e0b'} />;
    case 'the-thao':
      return <SportIcon size={size} color={color || '#10b981'} />;
    case 'doi-song':
    case 'me-va-be':
      return <BabyIcon size={size} color={color || '#14b8a6'} />;
    case 'phu-kien-cong-nghe':
      return <SmartphoneIcon size={size} color={color || '#6366f1'} />;
    case 'balo-tui-xach':
      return <ShoppingBagIcon size={size} color={color || '#8b5cf6'} />;
    case 'gaming-gear':
      return <BoltIcon size={size} color={color || '#ef4444'} />;
    case 'sach-van-phong-pham':
      return <BookOpenIcon size={size} color={color || '#0284c7'} />;
    default:
      return <PackageIcon size={size} color={color || '#64748b'} />;
  }
};

const CATEGORIES_DATA = [
  {
    id: 'thoi-trang',
    name: 'Thời Trang & May Mặc',
    categoryParam: 'Thời trang',
    group: 'fashion',
    badge: '13 Sản phẩm',
    description: 'Áo thun cotton basic, sơ mi lụa satin, quần jean ống đứng, áo khoác bomber, váy dạ tweed',
    subItems: ['Áo thun cotton', 'Sơ mi lụa', 'Quần jean', 'Áo khoác gió', 'Váy dạ tweed', 'Giày cao gót'],
    shop: 'Thời Trang GenZ Official',
    shopId: 'shop_01',
    color: '#ec4899',
  },
  {
    id: 'dien-tu',
    name: 'Thiết Bị Điện Tử & Công Nghệ',
    categoryParam: 'Điện tử',
    group: 'tech',
    badge: '14 Sản phẩm',
    description: 'Bàn phím cơ hot-swap, chuột không dây công thái học, màn hình 4K, webcam Ultra HD, tablet',
    subItems: ['Bàn phím cơ', 'Chuột không dây', 'Webcam 4K', 'Máy tính bảng', 'Ổ cứng SSD', 'Sạc nhanh GaN'],
    shop: 'TechWorld Store',
    shopId: 'shop_02',
    color: '#3b82f6',
  },
  {
    id: 'sac-dep',
    name: 'Sắc Đẹp & Dược Mỹ Phẩm',
    categoryParam: 'Sắc đẹp',
    group: 'beauty',
    badge: '10 Sản phẩm',
    description: 'Serum Vitamin C & B5, kem chống nắng SPF50+, son kem lì, nước tẩy trang, máy rửa mặt sóng âm',
    subItems: ['Serum Vitamin C', 'Serum B5', 'Kem chống nắng', 'Son kem lì', 'Nước tẩy trang', 'Máy rửa mặt'],
    shop: 'Beauty Cosmetics Official',
    shopId: 'shop_03',
    color: '#f43f5e',
  },
  {
    id: 'gia-dung',
    name: 'Gia Dụng & Đời Sống Thông Minh',
    categoryParam: 'Gia dụng',
    group: 'home',
    badge: '10 Sản phẩm',
    description: 'Nồi cơm điện cao tần IH, nồi chiên không dầu 6.5L, máy hút bụi, máy lọc không khí HEPA, máy ép chậm',
    subItems: ['Nồi cơm điện', 'Nồi chiên không dầu', 'Máy hút bụi', 'Máy lọc không khí', 'Máy ép chậm', 'Ghế công thái học'],
    shop: 'HomePro Gia Dụng Thông Minh',
    shopId: 'shop_04',
    color: '#f59e0b',
  },
  {
    id: 'the-thao',
    name: 'Thể Thao & Dã Ngoại',
    categoryParam: 'Thể thao',
    group: 'life',
    badge: '3 Sản phẩm',
    description: 'Lều cắm trại tự bung thủy lực, thảm tập yoga định tuyến TPE 8mm, bình nước thể thao Tritan 1500ml',
    subItems: ['Lều cắm trại', 'Thảm tập yoga', 'Bình nước thể thao'],
    shop: 'SportZone Thể Thao & Dã Ngoại',
    shopId: 'shop_01',
    color: '#10b981',
  },
  {
    id: 'doi-song',
    name: 'Đời Sống & Tiện Ích Văn Phòng',
    categoryParam: 'Đời sống',
    group: 'life',
    badge: '2 Sản phẩm',
    description: 'Bình giữ nhiệt Lock&Lock hiển thị nhiệt độ thông minh, đèn bàn LED bảo vệ mắt chống cận thị',
    subItems: ['Bình giữ nhiệt', 'Đèn bàn LED'],
    shop: 'HomePro Gia Dụng Thông Minh',
    shopId: 'shop_01',
    color: '#14b8a6',
  },
  {
    id: 'am-thanh',
    name: 'Thiết Bị Âm Thanh & Tai Nghe',
    filterType: 'keyword',
    keywordParam: 'Tai nghe',
    group: 'tech',
    badge: '2 Sản phẩm',
    description: 'Tai nghe Bluetooth ANC SoundPeak Pro chống ồn chủ động, tai nghe gaming chụp tai âm thanh vòm 7.1',
    subItems: ['Tai nghe Bluetooth', 'Tai nghe chống ồn', 'Tai nghe Gaming 7.1'],
    shop: 'TechWorld Store',
    shopId: 'shop_02',
    color: '#6366f1',
  },
  {
    id: 'dong-ho',
    name: 'Đồng Hồ Thông Minh & Smartwatch',
    filterType: 'keyword',
    keywordParam: 'Đồng hồ',
    group: 'tech',
    badge: '1 Sản phẩm',
    description: 'Đồng hồ thông minh Smartwatch Pro màn hình AMOLED sắc nét, cảm biến đo SpO2 & điện tâm đồ ECG',
    subItems: ['Đồng hồ thông minh', 'Smartwatch AMOLED', 'Đo SpO2'],
    shop: 'TechWorld Store',
    shopId: 'shop_02',
    color: '#8b5cf6',
  },
  {
    id: 'balo-vi',
    name: 'Balo, Ví Da & Phụ Kiện',
    filterType: 'keyword',
    keywordParam: 'da bò',
    group: 'fashion',
    badge: '4 Sản phẩm',
    description: 'Balo laptop chống rạch cổng USB, ví da bò sáp nam khâu tay, thắt lưng da bò, kính mát phi công',
    subItems: ['Balo laptop', 'Ví da bò', 'Thắt lưng da bò', 'Kính mát phi công'],
    shop: 'Thời Trang GenZ Official',
    shopId: 'shop_01',
    color: '#06b6d4',
  },
  {
    id: 'gaming-gear',
    name: 'Gaming Gear & Phụ Kiện PC',
    filterType: 'keyword',
    keywordParam: 'Bàn phím',
    group: 'tech',
    badge: '4 Sản phẩm',
    description: 'Bàn phím cơ không dây RGB, chuột công thái học, tay cầm chơi game Hall Effect, giá đỡ laptop',
    subItems: ['Bàn phím cơ', 'Chuột không dây', 'Tay cầm chơi game', 'Giá đỡ laptop'],
    shop: 'TechWorld Store',
    shopId: 'shop_02',
    color: '#d946ef',
  },
  {
    id: 'me-be',
    name: 'Mẹ & Bé - Đồ Chơi Trẻ Em',
    filterType: 'keyword',
    keywordParam: 'bé',
    group: 'life',
    badge: '3 Sản phẩm',
    description: 'Tã bỉm organic cao cấp, sữa bột dinh dưỡng công thức, máy hút sữa điện đôi, bình sữa silicone',
    subItems: ['Tã bỉm cho bé', 'Sữa bột dinh dưỡng', 'Bình sữa silicone', 'Xe đẩy em bé'],
    shop: 'BabyCare Official Store',
    shopId: 'shop_03',
    color: '#f97316',
  },
  {
    id: 'sach-vpp',
    name: 'Sách & Văn Phòng Phẩm',
    filterType: 'keyword',
    keywordParam: 'sách',
    group: 'life',
    badge: '2 Sản phẩm',
    description: 'Sách kinh tế khởi nghiệp, sổ tay bìa da cao cấp, bút ký kim loại sang trọng, đèn học chống lóa',
    subItems: ['Sách kinh tế', 'Sổ tay bìa da', 'Bút ký cao cấp', 'Đèn học chống cận'],
    shop: 'Fahasa BookStore',
    shopId: 'shop_04',
    color: '#0284c7',
  },
];

const FILTER_CHIPS = [
  { id: 'all', label: 'Tất Cả', icon: <FlameIcon size={13} color="#ea580c" /> },
  { id: 'fashion', label: 'Thời Trang & Phụ Kiện', icon: <DressIcon size={13} color="#ec4899" /> },
  { id: 'tech', label: 'Công Nghệ & Điện Tử', icon: <LaptopIcon size={13} color="#3b82f6" /> },
  { id: 'beauty', label: 'Sắc Đẹp Mỹ Phẩm', icon: <BeautyIcon size={13} color="#f43f5e" /> },
  { id: 'home', label: 'Gia Dụng Thông Minh', icon: <CookingIcon size={13} color="#f59e0b" /> },
  { id: 'life', label: 'Đời Sống & Mẹ Bé', icon: <BabyIcon size={13} color="#10b981" /> },
];

export default function CategoryMegaMenuDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const shopsScrollRef = useRef(null);
  const [shopsList, setShopsList] = useState([]);

  useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    let cancelled = false;
    getAllShops().then((shops) => {
      if (!cancelled) setShopsList(shops);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!isOpen) return null;

  const handleSelectCategory = (cat) => {
    onClose();
    if (!cat) return;
    if (typeof cat === 'object' && cat.filterType === 'keyword') {
      navigate(`/?keyword=${encodeURIComponent(cat.keywordParam || cat.name)}`);
    } else {
      const param = typeof cat === 'string' ? cat : cat.categoryParam;
      navigate(`/?category=${encodeURIComponent(param)}`);
    }
  };

  const handleSelectShop = (shopId) => {
    onClose();
    navigate(`/shop/${shopId}`);
  };

  const scrollToTargetSection = (targetId) => {
    onClose();
    if (window.location.pathname !== '/') {
      navigate('/');
    }
    setTimeout(() => {
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        const headerOffset = 110;
        const elementPosition = targetEl.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
        window.scrollTo({
          top: Math.max(0, offsetPosition),
          behavior: 'smooth',
        });
      }
    }, 120);
  };

  const filteredCategories = CATEGORIES_DATA.filter((cat) => {
    if (selectedGroup !== 'all' && cat.group !== selectedGroup) {
      return false;
    }
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      cat.name.toLowerCase().includes(q) ||
      cat.description.toLowerCase().includes(q) ||
      cat.shop.toLowerCase().includes(q) ||
      cat.subItems.some((s) => s.toLowerCase().includes(q))
    );
  });

  const modalContent = (
    <div className="category-drawer-backdrop" onClick={onClose}>
      <div className="category-drawer-modal" onClick={(e) => e.stopPropagation()}>
        {/* Mega Menu Top Banner Header */}
        <div className="category-drawer-header">
          <div className="category-drawer-header-left">
            <div className="category-drawer-logo-icon" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayersIcon size={22} color="#ffffff" />
            </div>
            <div className="category-drawer-title-wrap">
              <h2 className="category-drawer-title">
                Tất Cả Ngành Hàng & Danh Mục Sản Phẩm
                <span className="category-drawer-title-badge">12 Ngành Hàng</span>
              </h2>
              <p className="category-drawer-desc">
                Khám phá hơn 107+ sản phẩm chính hãng thuộc 12 phân hệ ngành hàng & 12 Shop Mall uy tín
              </p>
            </div>
          </div>

          <div className="category-drawer-header-right">
            <button
              type="button"
              onClick={() => scrollToTargetSection('category-showcase-section')}
              className="category-drawer-btn category-drawer-btn-outline"
              title="Cuộn tới danh mục ngành hàng trên trang chủ"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(2, 132, 199, 0.15)', border: '1px solid rgba(2, 132, 199, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <PackageIcon size={13} color="#0284c7" />
              </span>
              <span>Xem Danh Mục Trang Chủ</span>
            </button>
            <button
              type="button"
              onClick={() => scrollToTargetSection('catalog-section')}
              className="category-drawer-btn category-drawer-btn-primary"
              title="Cuộn tới danh sách toàn bộ sản phẩm trên trang chủ"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShoppingBagIcon size={13} color="#ffffff" />
              </span>
              <span>Xem Tất Cả Sản Phẩm</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="category-drawer-close-btn"
              title="Đóng bảng ngành hàng"
              aria-label="Đóng bảng danh mục ngành hàng"
              style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: '8px',
                width: '32px',
                height: '32px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s ease',
              }}
            >
              <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloseIcon size={12} color="#ef4444" />
              </span>
            </button>
          </div>
        </div>

        {/* Quick Filter Search & Chips Bar */}
        <div className="category-drawer-filter-bar">
          <div className="category-drawer-filter-top-row">
            <div className="category-drawer-search-wrapper">
              <span className="category-drawer-search-icon" style={{ display: 'inline-flex', alignItems: 'center' }}>
                <SearchIcon size={16} color="#ea580c" />
              </span>
              <input
                type="text"
                autoComplete="off"
                spellCheck="false"
                placeholder="Lọc nhanh ngành hàng, sản phẩm (ví dụ: Nồi cơm, Tai nghe, Áo thun)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="category-drawer-search-input"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="category-drawer-clear-btn"
                  title="Xóa tìm kiếm"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={10} color="#ef4444" />
                  </span>
                </button>
              )}
            </div>

            <div className="category-drawer-count-badge">
              Hiển thị <strong>{filteredCategories.length}</strong> / {CATEGORIES_DATA.length} ngành hàng
            </div>
          </div>

          {/* Group Filter Chips */}
          <div className="category-drawer-chips-wrap">
            {FILTER_CHIPS.map((chip) => (
              <button
                key={chip.id}
                type="button"
                className={`category-drawer-chip ${selectedGroup === chip.id ? 'active' : ''}`}
                onClick={() => setSelectedGroup(chip.id)}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: selectedGroup === chip.id ? 'rgba(255, 255, 255, 0.22)' : 'rgba(0, 0, 0, 0.05)', border: selectedGroup === chip.id ? '1px solid rgba(255, 255, 255, 0.35)' : '1px solid rgba(0, 0, 0, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    {chip.icon}
                  </span>
                  <span>{chip.label}</span>
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Mega Menu Body: Category Cards in Responsive Grid */}
        <div className="category-drawer-body">
          {filteredCategories.length === 0 ? (
            <div className="category-drawer-empty">
              <div className="category-drawer-empty-icon" style={{ width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.1)', border: '1px solid rgba(100, 116, 139, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                <SearchIcon size={28} color="#64748b" />
              </div>
              <div className="category-drawer-empty-text">
                Không tìm thấy ngành hàng phù hợp với "{searchTerm}"
              </div>
              <div className="category-drawer-empty-subtext">
                Thử thay đổi từ khóa hoặc chọn nhóm ngành hàng khác
              </div>
              <button
                type="button"
                className="category-drawer-reset-btn"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGroup('all');
                }}
                style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
              >
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(234, 88, 12, 0.15)', border: '1px solid rgba(234, 88, 12, 0.28)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RefreshIcon size={13} color="#ea580c" />
                </span>
                <span>Xóa bộ lọc & Xem tất cả</span>
              </button>
            </div>
          ) : (
            filteredCategories.map((cat, idx) => (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat)}
              className="category-drawer-card"
              style={{
                animationDelay: `${idx * 35}ms`,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = cat.color;
                e.currentTarget.style.boxShadow = `0 12px 28px ${cat.color}22`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--border-medium, #e2e8f0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
              }}
            >
              <div>
                {/* Header row of card: Icon + Name (strictly no squish) + Badge */}
                <div className="category-card-header">
                  <div className="category-card-title-group">
                    <span className="category-card-icon" style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${cat.color}15`, border: `1px solid ${cat.color}35`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {getDrawerCategoryIcon(cat.id, 18, cat.color)}
                    </span>
                    <strong className="category-card-name" title={cat.name}>
                      {cat.name}
                    </strong>
                  </div>
                  <span
                    className="category-card-badge"
                    style={{
                      background: `${cat.color}15`,
                      color: cat.color,
                      border: `1px solid ${cat.color}40`,
                    }}
                  >
                    {cat.badge}
                  </span>
                </div>

                <p className="category-card-desc" title={cat.description}>
                  {cat.description}
                </p>

                {/* Subcategory Interactive Pills */}
                <div className="category-card-subitems">
                  {cat.subItems.map((sub, sIdx) => (
                    <span
                      key={sIdx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        navigate(`/?keyword=${encodeURIComponent(sub)}`);
                      }}
                      className="category-card-subitem-pill"
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = cat.color;
                        e.currentTarget.style.color = '#fff';
                        e.currentTarget.style.borderColor = cat.color;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'var(--bg-muted, #f1f5f9)';
                        e.currentTarget.style.color = 'var(--text-primary)';
                        e.currentTarget.style.borderColor = 'var(--border-light, #e2e8f0)';
                      }}
                      title={`Tìm kiếm "${sub}"`}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>

              {/* Bottom Shop Link */}
              <div className="category-card-shop-row">
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectShop(cat.shopId);
                  }}
                  className="category-card-shop-name"
                  title={cat.shop}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StoreIcon size={11} color="#ea580c" />
                  </span>
                  <span>{cat.shop}</span>
                </span>
                <span className="category-card-action-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <span>Xem ngành hàng</span>
                  <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRightIcon size={10} color="#ea580c" />
                  </span>
                </span>
              </div>
            </div>
          )))}
        </div>

        {/* Mega Menu Footer: 12 Mall Shops Strip */}
        <div className="category-drawer-footer">
          <div className="category-drawer-footer-title" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <StoreIcon size={13} color="#dc2626" />
            </span>
            <span>12 Gian Hàng Mall:</span>
          </div>

          <button
            type="button"
            onClick={() => shopsScrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
            className="category-drawer-scroll-arrow"
            title="Cuộn sang trái"
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
          >
            <ChevronLeftIcon size={12} color="#2563eb" />
          </button>

          <div ref={shopsScrollRef} className="category-drawer-mall-pills-row">
            {shopsList.map((shop) => (
              <button
                key={shop.id}
                type="button"
                onClick={() => handleSelectShop(shop.id)}
                className="category-drawer-mall-btn"
              >
                <span className="mall-red-badge">Mall</span>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StoreIcon size={10} color="#ea580c" />
                </span>
                <span>{shop.name}</span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => shopsScrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
            className="category-drawer-scroll-arrow"
            title="Cuộn sang phải"
            style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
          >
            <ChevronRightIcon size={12} color="#2563eb" />
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined') {
    return createPortal(modalContent, document.body);
  }
  return modalContent;
}
