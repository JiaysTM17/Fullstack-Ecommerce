import React, { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { getAllShops } from '../services/shopService';

const CATEGORIES_DATA = [
  {
    id: 'thoi-trang',
    name: 'Thời Trang & May Mặc',
    icon: '👗',
    categoryParam: 'Thời trang',
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
    icon: '💻',
    categoryParam: 'Điện tử',
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
    icon: '💄',
    categoryParam: 'Sắc đẹp',
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
    icon: '🍳',
    categoryParam: 'Gia dụng',
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
    icon: '⚽',
    categoryParam: 'Thể thao',
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
    icon: '🌿',
    categoryParam: 'Đời sống',
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
    icon: '🎧',
    filterType: 'keyword',
    keywordParam: 'Tai nghe',
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
    icon: '⌚',
    filterType: 'keyword',
    keywordParam: 'Đồng hồ',
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
    icon: '🎒',
    filterType: 'keyword',
    keywordParam: 'da bò',
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
    icon: '🎮',
    filterType: 'keyword',
    keywordParam: 'Bàn phím',
    badge: '4 Sản phẩm',
    description: 'Bàn phím cơ không dây RGB, chuột công thái học, tay cầm chơi game Hall Effect, giá đỡ laptop',
    subItems: ['Bàn phím cơ', 'Chuột không dây', 'Tay cầm chơi game', 'Giá đỡ laptop'],
    shop: 'TechWorld Store',
    shopId: 'shop_02',
    color: '#d946ef',
  },
];

export default function CategoryMegaMenuDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
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
    getAllShops().then(shops => { if (!cancelled) setShopsList(shops); });
    return () => { cancelled = true; };
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

  const handleViewAll = () => {
    onClose();
    navigate('/');
  };

  const filteredCategories = CATEGORIES_DATA.filter((cat) => {
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
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(15, 23, 42, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
        overflowY: 'auto',
        animation: 'modalOverlayFadeIn 0.22s ease-out forwards',
      }}
      onClick={onClose}
    >
      <div
        className="anim-modal-content"
        style={{
          width: '1120px',
          maxWidth: '96vw',
          height: 'min(82vh, 760px)',
          minHeight: '520px',
          maxHeight: 'calc(100vh - 40px)',
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '18px',
          boxShadow: '0 24px 60px rgba(0, 0, 0, 0.45)',
          border: '1px solid var(--border-medium, #cbd5e1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          margin: '0 auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mega Menu Top Banner Header */}
        <div
          style={{
            padding: '16px 24px',
            background: 'linear-gradient(135deg, #090d16 0%, #1e1b4b 60%, #312e81 100%)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.12)',
            flexShrink: 0,
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, var(--primary-color, #4f46e5), #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.4)',
                flexShrink: 0,
              }}
            >
              ☰
            </div>
            <div>
              <h2 style={{ margin: 0, fontSize: '17px', fontWeight: 800, letterSpacing: '-0.3px' }}>
                Tất Cả Ngành Hàng & Danh Mục Sản Phẩm
              </h2>
              <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                Khám phá hơn 107+ sản phẩm chính hãng thuộc 12 phân hệ ngành hàng & 12 Shop Mall uy tín
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              type="button"
              onClick={handleViewAll}
              className="shopee-btn shopee-btn-primary"
              style={{ fontSize: '12px', padding: '6px 14px', borderRadius: '18px', fontWeight: 700 }}
            >
              🏠 Xem Tất Cả Sản Phẩm
            </button>
            <button
              type="button"
              onClick={onClose}
              style={{
                background: 'rgba(255, 255, 255, 0.15)',
                border: 'none',
                color: '#ffffff',
                width: '32px',
                height: '32px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255, 255, 255, 0.15)')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Quick Filter Search Bar */}
        <div
          style={{
            padding: '10px 24px',
            background: 'var(--bg-card, #ffffff)',
            borderBottom: '1px solid var(--border-light, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'relative',
              flex: 1,
              maxWidth: '480px',
            }}
          >
            <input
              type="text"
              placeholder="🔍 Lọc nhanh theo tên ngành hàng, sản phẩm (ví dụ: Nồi cơm, Tai nghe, Áo thun)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '7px 32px 7px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border-medium, #cbd5e1)',
                fontSize: '13px',
                outline: 'none',
                background: 'var(--bg-muted, #f8fafc)',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#888',
                  fontSize: '12px',
                }}
              >
                ✕
              </button>
            )}
          </div>
          <span style={{ fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
            Hiển thị <strong>{filteredCategories.length}</strong> / {CATEGORIES_DATA.length} ngành hàng
          </span>
        </div>

        {/* Mega Menu Body: Category Cards in Responsive Grid */}
        <div
          className="mega-menu-scroll-hide"
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: '1 1 0%',
            minHeight: '0',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '14px',
            background: 'var(--bg-muted, #f8fafc)',
          }}
        >
          {filteredCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat)}
              style={{
                background: 'var(--bg-card, #ffffff)',
                borderRadius: '14px',
                padding: '16px',
                border: '1px solid var(--border-medium, #e2e8f0)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)';
                e.currentTarget.style.boxShadow = '0 10px 24px rgba(0, 0, 0, 0.08)';
                e.currentTarget.style.borderColor = cat.color;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'none';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.04)';
                e.currentTarget.style.borderColor = 'var(--border-medium, #e2e8f0)';
              }}
            >
              <div>
                {/* Header row of card */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '24px' }}>{cat.icon}</span>
                    <strong style={{ fontSize: '13.5px', color: 'var(--text-primary)' }}>
                      {cat.name}
                    </strong>
                  </div>
                  <span
                    style={{
                      fontSize: '10.5px',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: '10px',
                      background: `${cat.color}15`,
                      color: cat.color,
                      border: `1px solid ${cat.color}40`,
                    }}
                  >
                    {cat.badge}
                  </span>
                </div>

                <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748b)', margin: '0 0 10px', lineHeight: '1.4' }}>
                  {cat.description}
                </p>

                {/* Subcategory Interactive Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                  {cat.subItems.map((sub, idx) => (
                    <span
                      key={idx}
                      onClick={(e) => {
                        e.stopPropagation();
                        onClose();
                        navigate(`/?keyword=${encodeURIComponent(sub)}`);
                      }}
                      style={{
                        fontSize: '11px',
                        background: 'var(--bg-muted, #f1f5f9)',
                        color: 'var(--text-primary)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light, #e2e8f0)',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
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
              <div
                style={{
                  paddingTop: '8px',
                  borderTop: '1px dashed var(--border-light, #e2e8f0)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '11px',
                  gap: '8px',
                }}
              >
                <span
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectShop(cat.shopId);
                  }}
                  style={{
                    color: 'var(--primary-color, #4f46e5)',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                  title={cat.shop}
                >
                  🏪 {cat.shop}
                </span>
                <span style={{ color: 'var(--text-muted, #64748b)', fontWeight: 700, whiteSpace: 'nowrap', flexShrink: 0 }}>
                  Xem ngành hàng →
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mega Menu Footer: 12 Mall Shops Strip */}
        <div
          style={{
            padding: '12px 24px',
            background: 'var(--bg-card, #ffffff)',
            borderTop: '1px solid var(--border-medium, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary, #475569)', whiteSpace: 'nowrap', flexShrink: 0 }}>
            🏪 12 Gian Hàng Mall:
          </div>

          {/* Left Scroll Button */}
          <button
            type="button"
            onClick={() => shopsScrollRef.current?.scrollBy({ left: -220, behavior: 'smooth' })}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'var(--bg-muted, #f1f5f9)',
              border: '1px solid var(--border-medium, #cbd5e1)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: 800,
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Cuộn sang trái"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-color, #4f46e5)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-muted, #f1f5f9)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            ‹
          </button>

          <div
            ref={shopsScrollRef}
            className="mega-menu-scroll-hide"
            style={{
              display: 'flex',
              gap: '8px',
              overflowX: 'auto',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              WebkitOverflowScrolling: 'touch',
              flex: 1,
              padding: '2px 0',
            }}
          >
            {shopsList.map((shop) => (
              <button
                key={shop.id}
                type="button"
                onClick={() => handleSelectShop(shop.id)}
                style={{
                  whiteSpace: 'nowrap',
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '4px 10px',
                  borderRadius: '14px',
                  background: 'var(--bg-muted, #f1f5f9)',
                  border: '1px solid var(--border-medium, #cbd5e1)',
                  color: 'var(--text-primary)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'var(--primary-color, #4f46e5)';
                  e.currentTarget.style.color = '#fff';
                  e.currentTarget.style.borderColor = 'var(--primary-color, #4f46e5)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'var(--bg-muted, #f1f5f9)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-medium, #cbd5e1)';
                }}
              >
                <span style={{ background: '#ea580c', color: '#fff', fontSize: '9px', padding: '1px 4px', borderRadius: '4px', fontWeight: 800 }}>Mall</span>
                <span>{shop.name}</span>
              </button>
            ))}
          </div>

          {/* Right Scroll Button */}
          <button
            type="button"
            onClick={() => shopsScrollRef.current?.scrollBy({ left: 220, behavior: 'smooth' })}
            style={{
              width: '26px',
              height: '26px',
              borderRadius: '50%',
              background: 'var(--bg-muted, #f1f5f9)',
              border: '1px solid var(--border-medium, #cbd5e1)',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: 800,
              flexShrink: 0,
              transition: 'all 0.15s ease',
            }}
            title="Cuộn sang phải"
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'var(--primary-color, #4f46e5)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'var(--bg-muted, #f1f5f9)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
          >
            ›
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
