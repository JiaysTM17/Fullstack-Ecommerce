import React from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllShops } from '../services/shopService';

const CATEGORIES_DATA = [
  {
    id: 'thoi-trang',
    name: 'Thời Trang & May Mặc',
    icon: '👗',
    categoryParam: 'Thời trang',
    badge: '18+ Sản phẩm',
    description: 'Áo thun cotton, sơ mi lụa satin, quần jean ống đứng, polo dệt tổ ong',
    subItems: ['Áo Thun Cotton Basic', 'Sơ Mi Lụa Satin', 'Quần Jean Baggy', 'Áo Polo Bo Cổ', 'Áo Khoác Gió'],
    shop: 'Thời Trang GenZ Official',
    shopId: 'shop_01',
    color: '#ec4899',
  },
  {
    id: 'dien-tu',
    name: 'Thiết Bị Điện Tử & Công Nghệ',
    icon: '🎧',
    categoryParam: 'Điện tử',
    badge: '22+ Sản phẩm',
    description: 'Chuột gaming 58g, bàn phím cơ gasket, tai nghe ANC, màn hình 2K 165Hz',
    subItems: ['Chuột Gaming Không Dây', 'Bàn Phím Cơ Hot-swap', 'Tai Nghe Chống Ồn', 'Màn Hình 27 Inch 2K'],
    shop: 'TechWorld Store',
    shopId: 'shop_02',
    color: '#3b82f6',
  },
  {
    id: 'sac-dep',
    name: 'Sắc Đẹp & Dược Mỹ Phẩm',
    icon: '💄',
    categoryParam: 'Sắc đẹp',
    badge: '16+ Sản phẩm',
    description: 'Serum rau má B5, kem chống nắng phổ rộng, son velvet lì, nước tẩy trang',
    subItems: ['Serum B5 Phục Hồi', 'Kem Chống Nắng SPF50+', 'Son Kem Lì Velvet', 'Nước Tẩy Trang Dịu Nhẹ'],
    shop: 'Beauty Cosmetics Official',
    shopId: 'shop_03',
    color: '#f43f5e',
  },
  {
    id: 'gia-dung',
    name: 'Gia Dụng & Đời Sống',
    icon: '🍳',
    categoryParam: 'Gia dụng',
    badge: '15+ Sản phẩm',
    description: 'Nồi cơm điện cao tần IH, nồi chiên 6.5L, máy hút bụi 20k Pa, máy lọc HEPA',
    subItems: ['Nồi Cơm Điện Cao Tần IH', 'Nồi Chiên Không Dầu', 'Máy Hút Bụi Không Dây', 'Máy Lọc Không Khí'],
    shop: 'HomePro Gia Dụng Thông Minh',
    shopId: 'shop_04',
    color: '#f59e0b',
  },
  {
    id: 'the-thao',
    name: 'Thể Thao & Dã Ngoại',
    icon: '⚽',
    categoryParam: 'Thể thao',
    badge: '8+ Sản phẩm',
    description: 'Lều cắm trại tự bung thủy lực, thảm yoga TPE định tuyến, bình nước 1.5L',
    subItems: ['Lều Cắm Trại Tự Bung', 'Thảm Tập Yoga Định Tuyến', 'Dây Kháng Lực Gym', 'Bình Nước 1500ml'],
    shop: 'SportZone Thể Thao & Dã Ngoại',
    shopId: 'shop_05',
    color: '#10b981',
  },
  {
    id: 'nong-san',
    name: 'Nông Sản & Bách Hóa Sạch',
    icon: '🌿',
    categoryParam: 'Đời sống',
    badge: '7+ Sản phẩm',
    description: 'Hạt dinh dưỡng macca óc chó organic, trà hoa cúc gạo lứt, mật ong hoa rừng',
    subItems: ['Hạt Macca & Óc Chó', 'Trà Hoa Cúc Gạo Lứt', 'Hạt Chia Hữu Cơ', 'Mật Ong Hoa Rừng'],
    shop: 'GreenFarm Nông Sản & Organic Sạch',
    shopId: 'shop_06',
    color: '#14b8a6',
  },
  {
    id: 'sach',
    name: 'Sách & Văn Phòng Phẩm',
    icon: '📚',
    categoryParam: 'Đời sống',
    badge: '6+ Sản phẩm',
    description: 'Sách phát triển bản thân, sổ tay da A5, bộ 12 bút gel mực đen mịn không lem',
    subItems: ['Sách Kỹ Năng & Tư Duy', 'Sổ Tay Da Bìa Cứng A5', 'Bộ 12 Bút Gel Mực Đen', 'Balo Đựng Laptop'],
    shop: 'Tri Thức BookStore',
    shopId: 'shop_07',
    color: '#8b5cf6',
  },
  {
    id: 'oto-xe-may',
    name: 'Phụ Kiện Ô Tô Xe Máy',
    icon: '🚗',
    categoryParam: 'Điện tử',
    badge: '5+ Sản phẩm',
    description: 'Bơm lốp mini 150 PSI tự ngắt, cam hành trình 4K Sony, tẩu sạc nhanh 60W',
    subItems: ['Bơm Lốp Điện Tử Mini', 'Camera Hành Trình 4K', 'Tẩu Sạc Ô Tô 60W', 'Xịt Phủ Bóng Ceramic'],
    shop: 'AutoPro Phụ Kiện Ô Tô Xe Máy',
    shopId: 'shop_08',
    color: '#06b6d4',
  },
  {
    id: 'me-va-be',
    name: 'Mẹ & Bé Yêu',
    icon: '🍼',
    categoryParam: 'Đời sống',
    badge: '5+ Sản phẩm',
    description: 'Bình sữa silicone y tế, tã bỉm hữu cơ kháng khuẩn, xe đẩy gấp gọn 5.4kg',
    subItems: ['Bình Sữa Cổ Rộng PPSU', 'Tã Bỉm Hữu Cơ', 'Xe Đẩy Gấp Gọn Siêu Nhẹ', 'Bộ Đồ Chơi Gỗ'],
    shop: 'BabyCare Siêu Thị Mẹ & Bé Yêu',
    shopId: 'shop_09',
    color: '#f97316',
  },
  {
    id: 'am-thanh',
    name: 'Âm Thanh & Hi-Fi',
    icon: '🎵',
    categoryParam: 'Điện tử',
    badge: '5+ Sản phẩm',
    description: 'Loa Bluetooth 40W IPX7, tai nghe kiểm âm Studio, soundbar Dolby 120W',
    subItems: ['Loa Bluetooth 40W IPX7', 'Tai Nghe Studio Monitor', 'Soundbar Dolby Audio 120W', 'DAC Giải Mã Hi-Res'],
    shop: 'AudioHiFi Âm Thanh Đẳng Cấp',
    shopId: 'shop_10',
    color: '#6366f1',
  },
  {
    id: 'thu-cung',
    name: 'Vương Quốc Thú Cưng',
    icon: '🐾',
    categoryParam: 'Đời sống',
    badge: '4+ Sản phẩm',
    description: 'Thức ăn hạt cá hồi tươi cho mèo, đệm nhung ấm áp thú cưng, trụ cào 3 tầng',
    subItems: ['Thức Ăn Hạt Hữu Cơ', 'Đệm Nhung Mềm Mại', 'Trụ Cào Móng 3 Tầng', 'Bát Ăn Inox Đôi'],
    shop: 'PetParadise Vương Quốc Thú Cưng',
    shopId: 'shop_11',
    color: '#eab308',
  },
  {
    id: 'dong-ho',
    name: 'Đồng Hồ & Thời Gian',
    icon: '⌚',
    categoryParam: 'Thời trang',
    badge: '4+ Sản phẩm',
    description: 'Đồng hồ cơ khí Automatic lộ cơ mặt Sapphire thép 316L, đồng hồ Smartwatch Pro',
    subItems: ['Đồng Hồ Automatic Lộ Cơ', 'Đồng Hồ Đính Đá Nữ', 'Hộp Xoay Đồng Hồ', 'Dây Da Bò Khóa Bướm'],
    shop: 'LuxeTime Đồng Hồ Cơ Khí',
    shopId: 'shop_12',
    color: '#e11d48',
  },
];

export default function CategoryMegaMenuDrawer({ isOpen, onClose }) {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSelectCategory = (catParam) => {
    onClose();
    navigate(`/?category=${encodeURIComponent(catParam)}`);
  };

  const handleSelectShop = (shopId) => {
    onClose();
    navigate(`/shop/${shopId}`);
  };

  const handleViewAll = () => {
    onClose();
    navigate('/');
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '20px 14px',
        overflowY: 'auto',
        animation: 'modalOverlayFadeIn 0.22s ease-out forwards',
      }}
      onClick={onClose}
    >
      <div
        className="anim-modal-content"
        style={{
          width: '1080px',
          maxWidth: '96vw',
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

        {/* Mega Menu Body: 12 Category Cards in Responsive Grid */}
        <div
          style={{
            padding: '20px 24px',
            overflowY: 'auto',
            flex: 1,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '14px',
            background: 'var(--bg-muted, #f8fafc)',
          }}
        >
          {CATEGORIES_DATA.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat.categoryParam)}
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

                {/* Subcategory Pills */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '5px', marginBottom: '12px' }}>
                  {cat.subItems.map((sub, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '11px',
                        background: 'var(--bg-muted, #f1f5f9)',
                        color: 'var(--text-primary)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        border: '1px solid var(--border-light, #e2e8f0)',
                      }}
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
          <div
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
            {getAllShops().map((shop) => (
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
        </div>
      </div>
    </div>
  );
}
