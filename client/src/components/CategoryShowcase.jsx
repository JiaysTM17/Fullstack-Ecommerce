import React, { useRef, useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ShirtIcon,
  SmartphoneIcon,
  TvIcon,
  LaptopIcon,
  CameraIcon,
  WatchIcon,
  FootwearIcon,
  CookingIcon,
  SportIcon,
  BikeIcon,
  DressIcon,
  BabyIcon,
  HomeIcon,
  BeautyIcon,
  PillIcon,
  BagIcon,
  SparklesIcon,
  FoodIcon,
  BookOpenIcon,
  LayersIcon,
  TruckIcon,
} from './OrdersIcons';

const getCategoryFallbackIcon = (id, size = 28, color = null) => {
  switch (id) {
    case 'men-clothes':
      return <ShirtIcon size={size} color={color || '#2563eb'} />;
    case 'mobile-gadgets':
      return <SmartphoneIcon size={size} color={color || '#16a34a'} />;
    case 'consumer-electronics':
      return <TvIcon size={size} color={color || '#9333ea'} />;
    case 'computer-accessories':
      return <LaptopIcon size={size} color={color || '#0284c7'} />;
    case 'cameras':
      return <CameraIcon size={size} color={color || '#dc2626'} />;
    case 'watches':
      return <WatchIcon size={size} color={color || '#d97706'} />;
    case 'men-shoes':
    case 'women-shoes':
      return <FootwearIcon size={size} color={color || '#475569'} />;
    case 'home-appliances':
      return <CookingIcon size={size} color={color || '#ea580c'} />;
    case 'sport-outdoor':
      return <SportIcon size={size} color={color || '#059669'} />;
    case 'automotive':
      return <BikeIcon size={size} color={color || '#0284c7'} />;
    case 'women-clothes':
      return <DressIcon size={size} color={color || '#ec4899'} />;
    case 'moms-babies':
      return <BabyIcon size={size} color={color || '#f97316'} />;
    case 'home-living':
      return <HomeIcon size={size} color={color || '#0d9488'} />;
    case 'beauty':
      return <BeautyIcon size={size} color={color || '#f43f5e'} />;
    case 'health':
      return <PillIcon size={size} color={color || '#10b981'} />;
    case 'women-bags':
      return <BagIcon size={size} color={color || '#8b5cf6'} />;
    case 'fashion-accessories':
      return <SparklesIcon size={size} color={color || '#f59e0b'} />;
    case 'grocery':
      return <FoodIcon size={size} color={color || '#ca8a04'} />;
    case 'books-stationery':
      return <BookOpenIcon size={size} color={color || '#0284c7'} />;
    default:
      return <SparklesIcon size={size} color={color || '#ea580c'} />;
  }
};

const CATEGORIES_SHOWCASE = [
  // Row 1
  {
    id: 'men-clothes',
    nameVi: 'Thời Trang Nam',
    nameEn: 'Men Clothes',
    categoryParam: 'Thời trang',
    keywordParam: 'nam',
    filterType: 'both',
    bg: '#eff6ff',
    color: '#2563eb',
    img: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=160',
  },
  {
    id: 'mobile-gadgets',
    nameVi: 'Điện Thoại & Phụ Kiện',
    nameEn: 'Mobile & Gadgets',
    categoryParam: 'Điện tử',
    keywordParam: 'sạc|điện thoại|tai nghe',
    filterType: 'both',
    bg: '#f0fdf4',
    color: '#16a34a',
    img: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=160',
  },
  {
    id: 'consumer-electronics',
    nameVi: 'Thiết Bị Điện Tử',
    nameEn: 'Consumer Electronics',
    categoryParam: 'Điện tử',
    keywordParam: '',
    filterType: 'category',
    bg: '#faf5ff',
    color: '#9333ea',
    img: 'https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=160',
  },
  {
    id: 'computer-accessories',
    nameVi: 'Máy Tính & Laptop',
    nameEn: 'Computer & Accessories',
    categoryParam: 'Điện tử',
    keywordParam: 'laptop|chuột|bàn phím|màn hình|ssd',
    filterType: 'both',
    bg: '#f0f9ff',
    color: '#0284c7',
    img: 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=160',
  },
  {
    id: 'cameras',
    nameVi: 'Máy Ảnh & Quay Phim',
    nameEn: 'Cameras',
    categoryParam: 'Điện tử',
    keywordParam: 'camera|webcam',
    filterType: 'both',
    bg: '#fef2f2',
    color: '#dc2626',
    img: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=160',
  },
  {
    id: 'watches',
    nameVi: 'Đồng Hồ & Smartwatch',
    nameEn: 'Watches',
    categoryParam: '',
    keywordParam: 'đồng hồ',
    filterType: 'keyword',
    bg: '#fffbeb',
    color: '#d97706',
    img: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=160',
  },
  {
    id: 'men-shoes',
    nameVi: 'Giày Dép Nam',
    nameEn: 'Men Shoes',
    categoryParam: '',
    keywordParam: 'giày nam|sneaker',
    filterType: 'both',
    bg: '#f1f5f9',
    color: '#475569',
    img: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=160',
  },
  {
    id: 'home-appliances',
    nameVi: 'Thiết Bị Gia Dụng',
    nameEn: 'Home Appliances',
    categoryParam: 'Gia dụng',
    keywordParam: '',
    filterType: 'category',
    bg: '#ecfdf5',
    color: '#059669',
    img: 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=160',
  },
  {
    id: 'sport-outdoor',
    nameVi: 'Thể Thao & Dã Ngoại',
    nameEn: 'Sport & Outdoor',
    categoryParam: 'Thể thao',
    keywordParam: '',
    filterType: 'category',
    bg: '#fff7ed',
    color: '#ea580c',
    img: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=160',
  },
  {
    id: 'automotive',
    nameVi: 'Ô Tô & Xe Máy',
    nameEn: 'Automotive',
    categoryParam: '',
    keywordParam: 'ô tô|rửa xe',
    filterType: 'keyword',
    bg: '#f8fafc',
    color: '#334155',
    img: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=160',
  },

  // Row 2
  {
    id: 'women-clothes',
    nameVi: 'Thời Trang Nữ',
    nameEn: 'Women Clothes',
    categoryParam: 'Thời trang',
    keywordParam: 'nữ|đầm|váy',
    filterType: 'both',
    bg: '#fdf2f8',
    color: '#db2777',
    img: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=160',
  },
  {
    id: 'moms-babies',
    nameVi: 'Mẹ & Bé',
    nameEn: 'Moms, Kids & Babies',
    categoryParam: 'Mẹ & Bé',
    keywordParam: '',
    filterType: 'category',
    bg: '#fefce8',
    color: '#ca8a04',
    img: 'https://images.unsplash.com/photo-1515488042361-ee00e0ddd4e4?w=160',
  },
  {
    id: 'home-living',
    nameVi: 'Nhà Cửa & Đời Sống',
    nameEn: 'Home & Living',
    categoryParam: 'Đời sống',
    keywordParam: '',
    filterType: 'category',
    bg: '#f0fdfa',
    color: '#0d9488',
    img: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=160',
  },
  {
    id: 'beauty',
    nameVi: 'Sắc Đẹp & Mỹ Phẩm',
    nameEn: 'Beauty & Skincare',
    categoryParam: 'Sắc đẹp',
    keywordParam: '',
    filterType: 'category',
    bg: '#fdf4ff',
    color: '#c026d3',
    img: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=160',
  },
  {
    id: 'health',
    nameVi: 'Sức Khỏe & Chăm Sóc',
    nameEn: 'Health & Wellness',
    categoryParam: 'Sắc đẹp',
    keywordParam: 'serum|dưỡng|phục hồi',
    filterType: 'both',
    bg: '#ecfeff',
    color: '#0891b2',
    img: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=160',
  },
  {
    id: 'women-shoes',
    nameVi: 'Giày Dép Nữ',
    nameEn: 'Women Shoes',
    categoryParam: '',
    keywordParam: 'giày nữ|cao gót|sandal',
    filterType: 'both',
    bg: '#fff1f2',
    color: '#e11d48',
    img: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=160',
  },
  {
    id: 'women-bags',
    nameVi: 'Túi Ví Nữ & Balo',
    nameEn: 'Women Bags & Wallets',
    categoryParam: '',
    keywordParam: 'balo|ví da',
    filterType: 'keyword',
    bg: '#fef3c7',
    color: '#b45309',
    img: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=160',
  },
  {
    id: 'fashion-accessories',
    nameVi: 'Phụ Kiện Thời Trang',
    nameEn: 'Fashion Accessories',
    categoryParam: 'Thời trang',
    keywordParam: 'kính|thắt lưng|ví|đồng hồ',
    filterType: 'both',
    bg: '#f5f3ff',
    color: '#7c3aed',
    img: 'https://images.unsplash.com/photo-1576053139778-7e32f2ae3cfd?w=160',
  },
  {
    id: 'grocery',
    nameVi: 'Bách Hóa & Organic',
    nameEn: 'Grocery & Organic',
    categoryParam: 'Đời sống',
    keywordParam: 'dinh dưỡng|trà thảo mộc|mật ong|hạt chia|tinh bột nghệ',
    filterType: 'both',
    bg: '#fef9c3',
    color: '#a16207',
    img: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=160',
  },
  {
    id: 'books-stationery',
    nameVi: 'Sách & Văn Phòng Phẩm',
    nameEn: 'Books & Stationery',
    categoryParam: 'Đời sống',
    keywordParam: 'sách|sổ tay|bút|đèn bàn',
    filterType: 'both',
    bg: '#f0fdf4',
    color: '#15803d',
    img: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=160',
  },
];

export default function CategoryShowcase({ onSelectCategory, onSelectKeyword, onSelectShowcase }) {
  const { language, t } = useLanguage();
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Divide into 2 rows of 10 items
  const row1 = CATEGORIES_SHOWCASE.slice(0, 10);
  const row2 = CATEGORIES_SHOWCASE.slice(10, 20);

  const checkScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 10);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, []);

  const handleScroll = (direction) => {
    if (!scrollContainerRef.current) return;
    const scrollAmount = direction === 'left' ? -360 : 360;
    scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    setTimeout(checkScroll, 350);
  };

  const handleCategoryClick = (item) => {
    if (onSelectShowcase) {
      onSelectShowcase({
        category: item.categoryParam || '',
        keyword: item.keywordParam || '',
      });
    } else if (item.filterType === 'keyword' && onSelectKeyword) {
      onSelectKeyword(item.keywordParam);
    } else if (onSelectCategory) {
      onSelectCategory(item.categoryParam);
    }
    const catalogEl = document.getElementById('catalog-section');
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const renderItem = (item) => {
    const displayName = language === 'en' ? item.nameEn : item.nameVi;
    return (
      <div
        key={item.id}
        onClick={() => handleCategoryClick(item)}
        className="category-showcase-card"
        style={{
          width: '124px',
          minWidth: '124px',
          height: '156px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 8px',
          margin: '4px',
          borderRadius: '12px',
          background: 'var(--bg-card, #ffffff)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          textAlign: 'center',
          userSelect: 'none',
          boxSizing: 'border-box',
          position: 'relative',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.08)';
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.background = 'var(--bg-page, #f8fafc)';
          const imgEl = e.currentTarget.querySelector('img');
          if (imgEl) imgEl.style.transform = 'scale(1.1)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = 'none';
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.background = 'var(--bg-card, #ffffff)';
          const imgEl = e.currentTarget.querySelector('img');
          if (imgEl) imgEl.style.transform = 'scale(1)';
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            borderRadius: '50%',
            background: item.bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '10px',
            position: 'relative',
            overflow: 'hidden',
            border: `2px solid ${item.bg}`,
            transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            boxShadow: '0 3px 10px rgba(0,0,0,0.06)',
          }}
        >
          <img
            src={item.img}
            alt={displayName}
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transition: 'transform 0.3s ease',
            }}
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              if (e.currentTarget.nextSibling) {
                e.currentTarget.nextSibling.style.display = 'flex';
              }
            }}
          />
          <div
            style={{
              display: 'none',
              width: '100%',
              height: '100%',
              alignItems: 'center',
              justifyContent: 'center',
              color: item.color || '#475569',
            }}
          >
            {getCategoryFallbackIcon(item.id, 28, item.color)}
          </div>
        </div>

        <span
          style={{
            fontSize: '12.5px',
            fontWeight: 600,
            lineHeight: 1.35,
            color: 'var(--text-primary, #0f172a)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            padding: '0 4px',
            height: '34px',
          }}
        >
          {displayName}
        </span>
      </div>
    );
  };

  return (
    <section
      aria-label="Categories Showcase"
      style={{
        background: 'var(--bg-card, #ffffff)',
        borderRadius: '16px',
        marginBottom: '28px',
        border: '1px solid var(--border-medium, #e2e8f0)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
        overflow: 'hidden',
        position: 'relative',
        padding: '6px 0 12px',
      }}
    >
      {/* Header Bar */}
      <div
        style={{
          padding: '16px 24px 12px',
          borderBottom: '1px solid var(--border-light, #f1f5f9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '6px',
              background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(234, 88, 12, 0.3)',
              flexShrink: 0,
            }}
          >
            <LayersIcon size={16} color="#ffffff" />
          </div>
          <h3
            style={{
              margin: 0,
              fontSize: '16.5px',
              fontWeight: 800,
              letterSpacing: '0.5px',
              color: 'var(--text-primary, #0f172a)',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <span>{t('nav_categories', 'DANH MỤC')}</span>
          </h3>
        </div>

        <span
          style={{
            fontSize: '12px',
            color: 'var(--text-secondary, #64748b)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            background: 'var(--bg-muted, #f8fafc)',
            padding: '4px 10px',
            borderRadius: '999px',
            border: '1px solid var(--border-light, #e2e8f0)',
          }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.12)', border: '1px solid rgba(5, 150, 105, 0.25)', flexShrink: 0 }}>
            <TruckIcon size={12} color="#059669" />
          </span>
          <span>{language === 'en' ? '20 Top Categories · Fast Delivery 2H' : '20 Ngành hàng nổi bật · Giao hỏa tốc 2H'}</span>
        </span>
      </div>

      {/* Carousel Container */}
      <div style={{ position: 'relative' }}>
        {/* Left Scroll Button */}
        {canScrollLeft && (
          <button
            type="button"
            onClick={() => handleScroll('left')}
            aria-label="Previous categories"
            style={{
              position: 'absolute',
              left: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.96)',
              border: '1px solid var(--border-medium, #cbd5e1)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              color: '#2563eb',
              fontSize: '20px',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ee4d2d';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = '#ee4d2d';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.96)';
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.borderColor = 'var(--border-medium, #cbd5e1)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', flexShrink: 0 }}>
              <ChevronLeftIcon size={16} color="currentColor" />
            </span>
          </button>
        )}

        {/* Scrollable Area (2 Rows) */}
        <div
          ref={scrollContainerRef}
          onScroll={checkScroll}
          className="mega-menu-scroll-hide"
          style={{
            overflowX: 'auto',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch',
            display: 'flex',
            flexDirection: 'column',
            padding: '4px 10px',
            gap: '4px',
          }}
        >
          {/* Row 1 */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {row1.map(renderItem)}
          </div>
          {/* Row 2 */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {row2.map(renderItem)}
          </div>
        </div>

        {/* Right Scroll Button */}
        {canScrollRight && (
          <button
            type="button"
            onClick={() => handleScroll('right')}
            aria-label="Next categories"
            style={{
              position: 'absolute',
              right: '8px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              background: 'rgba(255, 255, 255, 0.96)',
              border: '1px solid var(--border-medium, #cbd5e1)',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.12)',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#ee4d2d';
              e.currentTarget.style.color = '#fff';
              e.currentTarget.style.borderColor = '#ee4d2d';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1.08)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255, 255, 255, 0.96)';
              e.currentTarget.style.color = '#2563eb';
              e.currentTarget.style.borderColor = 'var(--border-medium, #cbd5e1)';
              e.currentTarget.style.transform = 'translateY(-50%) scale(1)';
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.08)', flexShrink: 0 }}>
              <ChevronRightIcon size={16} color="currentColor" />
            </span>
          </button>
        )}
      </div>
    </section>
  );
}
