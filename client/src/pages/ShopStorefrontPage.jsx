import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getShopById, getProductsByShop, isShopFollowed, toggleFollowShop } from '../services/shopService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useToast } from '../context/ToastContext';
import { useLanguage } from '../context/LanguageContext';
import { formatCurrency } from '../utils/formatCurrency';
import ProductCard from '../components/ProductCard';
import {
  StarIcon,
  PackageIcon,
  StoreIcon,
  TicketIcon,
  MapPinIcon,
  ChatIcon,
  ClockIcon,
  CheckIcon,
  LayersIcon,
  SearchIcon,
  CloseIcon,
  ShoppingBagIcon,
  SparklesIcon,
  ScaleIcon,
  PlusIcon,
  ChevronRightIcon,
  ShieldCheckIcon,
  UserIcon,
  HomeIcon,
  AlertCircleIcon,
  FlameIcon,
  BoltIcon,
} from '../components/OrdersIcons';

// Hàm phân loại chuyên nghiệp cho từng mặt hàng trong gian hàng
function getProductClassification(product) {
  const name = (product?.name || '').toLowerCase();

  // 1. Quần các loại
  if (/(quần|jean|jeans|short|kaki|jogger|tây âu|quần dài|quần đùi)/i.test(name)) {
    return { key: 'quan', label: 'Quần Các Loại', group: 'quần' };
  }
  // 2. Áo các loại
  if (/(áo|thun|sơ mi|polo|hoodie|khoác|jacket|blazer|cardigan|sweater|t-shirt)/i.test(name)) {
    return { key: 'ao', label: 'Áo Các Loại', group: 'áo' };
  }
  // 3. Váy & Đầm
  if (/(váy|đầm|chân váy|skirt|dress|yếm)/i.test(name)) {
    return { key: 'vay', label: 'Váy & Đầm Nữ', group: 'váy đầm' };
  }
  // 4. Tai nghe & Âm thanh
  if (/(tai nghe|headphone|earphone|airpods|tws|anc|soundbar|loa|speaker)/i.test(name)) {
    return { key: 'audio', label: 'Tai Nghe & Loa', group: 'tai nghe & loa' };
  }
  // 5. Bàn phím & Chuột
  if (/(bàn phím|keyboard|chuột|mouse|lót chuột|keycap)/i.test(name)) {
    return { key: 'gear', label: 'Bàn Phím & Chuột', group: 'bàn phím & chuột' };
  }
  // 6. Mỹ phẩm / Dưỡng da
  if (/(serum|kem dưỡng|tinh chất|toner|nước hoa hồng|essence|ampoule)/i.test(name)) {
    return { key: 'duongda', label: 'Serum & Dưỡng Da', group: 'serum & dưỡng da' };
  }
  if (/(sữa rửa mặt|tẩy trang|cleanser|mặt nạ|tẩy tế bào)/i.test(name)) {
    return { key: 'lamchuyen', label: 'Làm Sạch & Chăm Sóc', group: 'sữa rửa mặt' };
  }
  if (/(son|lipstick|phấn|mascara|eyeliner|cushion|bb cream)/i.test(name)) {
    return { key: 'trangdiem', label: 'Son Môi & Trang Điểm', group: 'son môi & trang điểm' };
  }
  // 7. Đồ gia dụng
  if (/(nồi|chảo|nồi chiên|nồi cơm|bếp|chống dính|nấu ăn)/i.test(name)) {
    return { key: 'nhabep', label: 'Nồi Chiên & Nhà Bếp', group: 'nồi chiên & bếp' };
  }
  if (/(robot|máy hút bụi|lọc không khí|máy lọc nước|hút bụi)/i.test(name)) {
    return { key: 'thietbi', label: 'Robot & Hút Bụi', group: 'thiết bị gia dụng' };
  }

  // Fallback theo Category gốc
  if (product?.category) {
    return { key: product.category.toLowerCase().replace(/\s+/g, '_'), label: product.category, group: product.category };
  }
  return { key: 'khac', label: 'Phụ Kiện & Khác', group: 'phụ kiện' };
}

export default function ShopStorefrontPage() {
  const { shopId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { showToast } = useToast();
  const { applyVoucher } = useCart();
  const { toggleWishlist, isWishlisted } = useWishlist();
  const { addToCompare, isCompared } = useCompare();

  const [shop, setShop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [isFollowing, setIsFollowing] = useState(() => (shopId ? isShopFollowed(shopId) : false));
  const [followerCount, setFollowerCount] = useState(12000);
  const [shopSearch, setShopSearch] = useState('');
  const [sortBy, setSortBy] = useState('featured');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [claimedVouchers, setClaimedVouchers] = useState([]);

  // Load shop và danh sách sản phẩm theo shopId
  useEffect(() => {
    let cancelled = false;
    async function loadShop() {
      setLoading(true);
      try {
        const loadedShop = await getShopById(shopId);
        if (cancelled) return;
        setShop(loadedShop);
        setFollowerCount(loadedShop?.followers || 12000);
        if (loadedShop?.id) {
          setIsFollowing(isShopFollowed(loadedShop.id));
          const shopProds = await getProductsByShop(loadedShop.id);
          if (!cancelled) setProducts(shopProds || []);
        }
      } catch (err) {
        console.error("Lỗi tải gian hàng:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadShop();
    window.scrollTo(0, 0);
    return () => { cancelled = true; };
  }, [shopId]);

  // Đồng bộ thời gian thực khi Chủ Shop thêm sản phẩm hoặc cập nhật tồn kho
  useEffect(() => {
    const handleLiveSync = async () => {
      if (!shopId) return;
      const loadedShop = await getShopById(shopId);
      if (loadedShop?.id) {
        setShop(loadedShop);
        const prods = await getProductsByShop(loadedShop.id);
        setProducts(prods || []);
      }
    };

    window.addEventListener('storage', handleLiveSync);
    window.addEventListener('mini_shopee_inventory_updated', handleLiveSync);
    return () => {
      window.removeEventListener('storage', handleLiveSync);
      window.removeEventListener('mini_shopee_inventory_updated', handleLiveSync);
    };
  }, [shopId]);

  // Trích xuất các danh mục phân loại độc quyền có trong shop (Luôn chạy trước mọi early return)
  const shopCategories = useMemo(() => {
    const list = products || [];
    const map = new Map();
    map.set('all', { key: 'all', label: 'Tất Cả Sản Phẩm', count: list.length });

    list.forEach((p) => {
      const cls = getProductClassification(p);
      if (!map.has(cls.key)) {
        map.set(cls.key, { key: cls.key, label: cls.label, group: cls.group, count: 0 });
      }
      map.get(cls.key).count += 1;
    });

    return Array.from(map.values());
  }, [products]);

  // Deal Flash Sale độc quyền của Shop (giảm giá sâu và đang cháy hàng)
  const shopFlashDeals = useMemo(() => {
    return (products || [])
      .filter((p) => p.originalPrice && p.originalPrice > p.price)
      .map((p) => {
        const discountPercent = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
        const stock = Number(p.stock) || 0;
        const sold = Number(p.sold) || 0;
        const initialPool = Math.max(1, stock + sold);
        const percentSold = Math.min(99, Math.max(25, Math.round((sold / initialPool) * 100)));
        const isBurningOut = stock <= 10 || percentSold >= 75;
        return {
          ...p,
          discountPercent,
          percentSold,
          isBurningOut,
        };
      })
      .sort((a, b) => b.discountPercent - a.discountPercent)
      .slice(0, 4);
  }, [products]);

  // Phân chia sản phẩm theo phân loại được chọn và nhóm sản phẩm gợi ý thêm
  const { matchingProducts, otherProducts } = useMemo(() => {
    let list = [...(products || [])];

    // Lọc theo từ khóa tìm kiếm trong shop
    if (shopSearch.trim()) {
      const q = shopSearch.toLowerCase().trim();
      list = list.filter((p) => (p.name || '').toLowerCase().includes(q));
    }

    // Sắp xếp
    if (sortBy === 'price_asc') list.sort((a, b) => a.price - b.price);
    else if (sortBy === 'price_desc') list.sort((a, b) => b.price - a.price);
    else if (sortBy === 'best_selling') list.sort((a, b) => (b.sold || 0) - (a.sold || 0));

    if (selectedCategory === 'all') {
      return { matchingProducts: list, otherProducts: [] };
    }

    const matches = [];
    const others = [];

    list.forEach((p) => {
      const cls = getProductClassification(p);
      if (cls.key === selectedCategory) {
        matches.push(p);
      } else {
        others.push(p);
      }
    });

    return { matchingProducts: matches, otherProducts: others };
  }, [products, shopSearch, sortBy, selectedCategory]);

  const handleToggleFollow = () => {
    if (!shop?.id) return;
    const nextState = toggleFollowShop(shop.id);
    setIsFollowing(nextState);
    setFollowerCount((prev) => (nextState ? prev + 1 : prev - 1));
    showToast(
      nextState ? `Đã theo dõi ${shop.name}!` : `Đã bỏ theo dõi ${shop.name}`,
      nextState ? 'success' : 'info'
    );
  };

  const handleOpenShopChat = () => {
    if (!shop?.id) return;
    window.dispatchEvent(
      new CustomEvent('open_live_chat', {
        detail: {
          shopName: shop.name,
          shopId: shop.id,
          shopAvatar: shop.avatar,
        },
      })
    );
  };

  const handleClaimVoucher = async (voucher) => {
    if (!voucher?.code) return;
    setClaimedVouchers((prev) => (prev.includes(voucher.code) ? prev : [...prev, voucher.code]));
    const res = await applyVoucher(voucher.code);
    if (res?.success) {
      showToast(`Đã áp dụng mã ${voucher.code} của ${shop?.name || 'Shop'} thành công!`, 'success');
    } else {
      showToast(`Đã lưu mã ${voucher.code} vào ví voucher của bạn!`, 'success');
    }
  };

  if (loading) {
    return (
      <main className="shopee-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ position: 'relative', width: '56px', height: '56px', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              border: '3px solid rgba(13, 148, 136, 0.15)',
              borderTopColor: '#0d9488',
              borderRadius: '50%',
              animation: 'shopSpin 0.9s linear infinite',
            }}
          />
          <span style={{ width: '30px', height: '30px', borderRadius: '50%', background: 'rgba(13, 148, 136, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <StoreIcon size={16} color="#0d9488" />
          </span>
        </div>
        <h3 style={{ color: 'var(--text-primary)', fontSize: '15px', fontWeight: 700, margin: '0 0 6px' }}>
          Đang tải thông tin gian hàng...
        </h3>
        <p style={{ fontSize: "13px", color: "var(--text-muted)", margin: 0 }}>
          Vui lòng đợi giây lát trong khi tải sản phẩm và khuyến mãi từ người bán.
        </p>
        <style>{`@keyframes shopSpin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </main>
    );
  }

  if (!shop) {
    return (
      <main className="shopee-container" style={{ padding: '80px 20px', textAlign: 'center' }}>
        <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '18px' }}>
          <span style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1.5px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.12)' }}>
            <AlertCircleIcon size={34} color="#ef4444" />
          </span>
        </div>
        <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 8px' }}>
          {t('shop_not_found')}
        </h2>
        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 24px' }}>
          Gian hàng này không tồn tại hoặc đã tạm dừng hoạt động. Vui lòng quay về trang chủ để khám phá các đối tác chính hãng khác.
        </p>
        <Link to="/" className="shopee-btn shopee-btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 24px', borderRadius: '10px', textDecoration: 'none', fontWeight: 700, fontSize: '14px' }}>
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <HomeIcon size={13} color="#ffffff" />
          </span>
          <span>Về trang chủ</span>
        </Link>
      </main>
    );
  }

  return (
    <main className="shopee-container" style={{ padding: '24px 0' }}>
      <style>{`
        .mall-official-ribbon {
          background: linear-gradient(90deg, #b91c1c 0%, #dc2626 40%, #ea580c 100%);
          color: #ffffff;
          padding: 10px 24px;
          border-radius: 16px 16px 0 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 12px;
          box-shadow: 0 4px 15px rgba(220, 38, 38, 0.25);
        }
        .mall-badge-brand {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #ffffff;
          color: #dc2626;
          padding: 3px 10px;
          border-radius: 6px;
          font-weight: 900;
          font-size: 11px;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          box-shadow: 0 2px 6px rgba(0,0,0,0.12);
        }
        .mall-title-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: linear-gradient(135deg, #d0011b 0%, #ee4d2d 100%);
          color: #ffffff;
          padding: 4px 12px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 800;
          letter-spacing: 0.8px;
          text-transform: uppercase;
          box-shadow: 0 3px 10px rgba(208, 1, 27, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.35);
        }
        .mall-metric-card {
          background: var(--bg-card, #ffffff);
          border: 1px solid var(--border-medium, #e2e8f0);
          border-radius: 12px;
          padding: 14px 18px;
          display: flex;
          align-items: center;
          gap: 14px;
          box-shadow: var(--shadow-sm);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .mall-metric-card:hover {
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .mall-metric-icon {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 20px;
          flex-shrink: 0;
        }
        .mall-voucher-ticket {
          background: var(--bg-card, #ffffff);
          border: 1.5px dashed var(--primary-color, #ea580c);
          border-radius: 12px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          box-shadow: var(--shadow-sm);
          overflow: hidden;
          transition: all 0.2s ease;
        }
        .mall-voucher-ticket:hover {
          border-color: #dc2626;
          box-shadow: 0 6px 18px rgba(234, 88, 12, 0.18);
        }
        .mall-voucher-ticket::before {
          content: '';
          position: absolute;
          left: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--bg-page, #f8fafc);
          border-right: 1.5px dashed var(--primary-color, #ea580c);
        }
        .mall-voucher-ticket::after {
          content: '';
          position: absolute;
          right: -8px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: var(--bg-page, #f8fafc);
          border-left: 1.5px dashed var(--primary-color, #ea580c);
        }
        @media (max-width: 640px) {
          .mall-official-ribbon {
            padding: 8px 14px;
          }
          .shop-header-info-row {
            padding: 0 16px 20px !important;
            margin-top: -40px !important;
          }
          .shop-avatar-img {
            width: 80px !important;
            height: 80px !important;
          }
        }
      `}</style>

      {/* Breadcrumb Navigation */}
      <nav style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Link to="/" style={{ color: 'var(--primary-color, #ea580c)', textDecoration: 'none', fontWeight: 600 }}>Trang chủ</Link>
        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRightIcon size={10} color="#64748b" />
        </span>
        <span style={{ color: 'var(--text-muted)' }}>Gian hàng chính hãng</span>
        <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
          <ChevronRightIcon size={10} color="#64748b" />
        </span>
        <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>{shop.name}</span>
      </nav>

      {/* Official Shopee Mall / TikTok Shop Header Card */}
      <section
        style={{
          background: 'var(--bg-card, #ffffff)',
          borderRadius: '16px',
          overflow: 'hidden',
          border: '1px solid var(--border-medium, #e2e8f0)',
          boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
          marginBottom: '28px',
        }}
      >
        {/* Top Official Guarantee Ribbon */}
        <div className="mall-official-ribbon">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="mall-badge-brand">
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.12)', border: '1px solid rgba(220, 38, 38, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheckIcon size={12} color="#dc2626" />
              </span>
              SHOPEE MALL
            </span>
            <span style={{ fontSize: '12.5px', fontWeight: 700, letterSpacing: '0.4px' }}>
              GIAN HÀNG CHÍNH HÃNG 100% • TIKTOK SHOP & SHOPEE OFFICIAL STORE
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '18px', fontSize: '12px', fontWeight: 600 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={10} color="#ffffff" />
              </span>
              <span>Trả hàng miễn phí 15 ngày</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={10} color="#ffffff" />
              </span>
              <span>Đền bù 200% nếu phát hiện giả</span>
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={10} color="#ffffff" />
              </span>
              <span>Giao hỏa tốc toàn quốc</span>
            </span>
          </div>
        </div>

        {/* Cover Photo Backdrop */}
        <div
          style={{
            height: '220px',
            width: '100%',
            backgroundImage: `linear-gradient(180deg, rgba(15, 23, 42, 0.25) 0%, rgba(15, 23, 42, 0.8) 100%), url(${shop.banner})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            position: 'relative',
          }}
        >
          <div style={{
            position: 'absolute',
            bottom: '16px',
            right: '24px',
            background: 'rgba(0, 0, 0, 0.55)',
            backdropFilter: 'blur(8px)',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '20px',
            fontSize: '12px',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e', display: 'inline-block' }}></span>
            <span>Đang trực tuyến • Sẵn sàng hỗ trợ 24/7</span>
          </div>
        </div>

        {/* Shop Info Row */}
        <div
          className="shop-header-info-row"
          style={{
            padding: '0 28px 24px',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: '24px',
            marginTop: '-60px',
            position: 'relative',
          }}
        >
          {/* Avatar & Title Block */}
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '20px' }}>
            <div style={{ position: 'relative' }}>
              <img
                src={shop.avatar}
                alt={shop.name}
                className="shop-avatar-img"
                style={{
                  width: '110px',
                  height: '110px',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  border: '4px solid var(--bg-card, #ffffff)',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                  background: '#ffffff',
                }}
              />
              {/* Verified Blue/Gold Seal on Avatar */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '4px',
                  right: '4px',
                  background: '#d0011b',
                  color: '#ffffff',
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 900,
                  border: '2px solid #ffffff',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
                }}
                title="Đã được Shopee Mall xác thực chứng nhận"
              >
                <CheckIcon size={12} color="#ffffff" />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>
                  {shop.name}
                </h1>
                
                {/* Shopee Mall / TikTok Official Luxury Badge */}
                <span className="mall-title-badge">
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldCheckIcon size={11} color="#ffffff" />
                  </span>
                  SHOPEE MALL
                </span>

                <span style={{
                  fontSize: '11.5px',
                  fontWeight: 700,
                  color: '#15803d',
                  background: '#dcfce7',
                  padding: '3px 10px',
                  borderRadius: '9999px',
                  border: '1px solid #bbf7d0',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }}></span>
                  Chính Hãng 100%
                </span>
              </div>

              <p style={{ margin: '6px 0 0', fontSize: '13px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <MapPinIcon size={11} color="#ea580c" />
                  </span>
                  <span>{shop.location}</span>
                </span>
                <span>•</span>
                <span>Hoạt động {shop.joinedDate}</span>
                <span>•</span>
                <span style={{ color: '#ea580c', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ClockIcon size={11} color="#ea580c" />
                  </span>
                  <span>Mở cửa: 08:00 - 21:00 hàng ngày</span>
                </span>
              </p>
            </div>
          </div>

          {/* Action Buttons: Follow, Chat, Hotline */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className={isFollowing ? 'shopee-btn shopee-btn-secondary' : 'shopee-btn'}
              style={{
                padding: '10px 22px',
                fontWeight: 700,
                borderRadius: '10px',
                fontSize: '13.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: isFollowing ? 'var(--bg-muted, #f1f5f9)' : 'linear-gradient(135deg, #d0011b 0%, #ee4d2d 100%)',
                color: isFollowing ? 'var(--text-primary)' : '#ffffff',
                border: isFollowing ? '1px solid var(--border-medium, #cbd5e1)' : 'none',
                boxShadow: isFollowing ? 'none' : '0 4px 14px rgba(238, 77, 45, 0.35)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              onClick={handleToggleFollow}
            >
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: isFollowing ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.25)', border: isFollowing ? '1px solid rgba(0, 0, 0, 0.12)' : '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {isFollowing ? <CheckIcon size={12} color={isFollowing ? 'var(--text-primary)' : '#ffffff'} /> : <PlusIcon size={12} color="#ffffff" />}
              </span>
              <span>{isFollowing ? t('shop_following') : 'Theo Dõi Shop'}</span>
            </button>

            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              style={{
                padding: '10px 20px',
                fontWeight: 700,
                borderRadius: '10px',
                fontSize: '13.5px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: '#ffffff',
                border: '1.5px solid var(--primary-color, #ea580c)',
                color: 'var(--primary-color, #ea580c)',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
                transition: 'all 0.2s ease',
              }}
              onClick={handleOpenShopChat}
            >
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ChatIcon size={12} color="#ea580c" />
              </span>
              <span>Chat Với Shop</span>
            </button>
          </div>
        </div>

        {/* 4 Professional Key Metric Cards */}
        <div
          style={{
            borderTop: '1px solid var(--border-light, #f1f5f9)',
            padding: '20px 28px',
            background: 'var(--bg-muted, #f8fafc)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '16px',
          }}
        >
          <div className="mall-metric-card">
            <div className="mall-metric-icon" style={{ background: 'rgba(217, 119, 6, 0.12)', border: '1px solid rgba(217, 119, 6, 0.22)' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(217, 119, 6, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <StarIcon size={18} color="#d97706" fill="#d97706" />
              </span>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Đánh Giá Gian Hàng</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {shop.rating} / 5.0 <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>(Xuất sắc)</span>
              </div>
            </div>
          </div>

          <div className="mall-metric-card">
            <div className="mall-metric-icon" style={{ background: 'rgba(225, 29, 72, 0.12)', border: '1px solid rgba(225, 29, 72, 0.22)' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(225, 29, 72, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <UserIcon size={18} color="#e11d48" />
              </span>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Người Theo Dõi</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {followerCount.toLocaleString()} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Khách hàng</span>
              </div>
            </div>
          </div>

          <div className="mall-metric-card">
            <div className="mall-metric-icon" style={{ background: 'rgba(21, 128, 61, 0.12)', border: '1px solid rgba(21, 128, 61, 0.22)' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(21, 128, 61, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClockIcon size={18} color="#15803d" />
              </span>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Tỉ Lệ Phản Hồi Chat</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {shop.responseRate || 99}% <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: 600 }}>({shop.responseTime || 'vài phút'})</span>
              </div>
            </div>
          </div>

          <div className="mall-metric-card">
            <div className="mall-metric-icon" style={{ background: 'rgba(67, 56, 202, 0.12)', border: '1px solid rgba(67, 56, 202, 0.22)' }}>
              <span style={{ width: '28px', height: '28px', borderRadius: '6px', background: 'rgba(67, 56, 202, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <PackageIcon size={18} color="#4338ca" />
              </span>
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>Sản Phẩm Phân Phối</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                {products.length} <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 500 }}>Mặt hàng sẵn kho</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Shop Exclusive Vouchers / Coupon Section */}
      {shop.vouchers && shop.vouchers.length > 0 && (
        <section style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TicketIcon size={16} color="#ea580c" />
              </span>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  {t('shop_vouchers_title')}
                </h2>
                <div style={{ fontSize: '12.5px', color: 'var(--text-muted)' }}>
                  Lưu voucher độc quyền của {shop.name} để áp dụng ngay khi đặt hàng
                </div>
              </div>
            </div>
            <span style={{ fontSize: '12.5px', color: '#ea580c', fontWeight: 700 }}>
              Áp dụng chung cùng Freeship Xtra
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
            {shop.vouchers.map((v) => (
              <div key={v.code} className="mall-voucher-ticket">
                <div style={{ paddingRight: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{
                      background: '#fee2e2',
                      color: '#dc2626',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontWeight: 800,
                      fontSize: '11px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                    }}>
                      <span style={{ width: '14px', height: '14px', borderRadius: '3px', background: 'rgba(220, 38, 38, 0.15)', border: '1px solid rgba(220, 38, 38, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <TicketIcon size={9} color="#dc2626" />
                      </span>
                      <span>MÃ SHOP</span>
                    </span>
                    <strong style={{ fontSize: '15px', color: '#ea580c', letterSpacing: '0.5px' }}>
                      {v.code}
                    </strong>
                  </div>
                  <div style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', margin: '4px 0 2px' }}>
                    {v.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    HSD: {v.expires} • {v.desc}
                  </div>
                </div>

                <button
                  type="button"
                  className={`shopee-btn ${claimedVouchers.includes(v.code) ? 'shopee-btn-secondary' : 'shopee-btn-primary'}`}
                  style={{
                    padding: '8px 16px',
                    fontSize: '12.5px',
                    fontWeight: 700,
                    borderRadius: '8px',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    background: claimedVouchers.includes(v.code) ? '#f0fdf4' : 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                    color: claimedVouchers.includes(v.code) ? '#16a34a' : '#ffffff',
                    border: claimedVouchers.includes(v.code) ? '1px solid #86efac' : 'none',
                    boxShadow: claimedVouchers.includes(v.code) ? 'none' : '0 2px 8px rgba(234, 88, 12, 0.3)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                  onClick={() => handleClaimVoucher(v)}
                >
                  {claimedVouchers.includes(v.code) ? (
                    <>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#dcfce7', border: '1px solid rgba(22, 163, 74, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <CheckIcon size={11} color="#16a34a" />
                      </span>
                      <span>Đã Lưu</span>
                    </>
                  ) : (
                    <>
                      <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <TicketIcon size={11} color="#ffffff" />
                      </span>
                      <span>Lưu Mã</span>
                    </>
                  )}
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Shop Exclusive Flash Deals Section */}
      {shopFlashDeals && shopFlashDeals.length > 0 && (
        <section
          style={{
            background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 100%)',
            padding: '20px',
            borderRadius: '16px',
            border: '1.5px solid rgba(234, 88, 12, 0.2)',
            marginBottom: '28px',
            boxShadow: '0 4px 16px rgba(234, 88, 12, 0.08)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{
                background: 'linear-gradient(135deg, #ea580c 0%, #dc2626 100%)',
                color: '#ffffff',
                padding: '6px 12px',
                borderRadius: '8px',
                fontWeight: 900,
                fontSize: '13px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                boxShadow: '0 2px 8px rgba(234, 88, 12, 0.35)',
              }}>
                <BoltIcon size={14} color="#ffffff" />
                <span>FLASH SALE CỦA SHOP</span>
              </span>
              <span style={{ fontSize: '12.5px', color: '#c2410c', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <FlameIcon size={14} color="#dc2626" />
                <span>Đang cháy hàng • Số lượng có hạn</span>
              </span>
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600 }}>
              Cập nhật tồn kho theo thời gian thực
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            {shopFlashDeals.map((prod) => (
              <div
                key={`shop-fs-${prod._id || prod.id}`}
                style={{
                  background: 'var(--bg-card, #ffffff)',
                  borderRadius: '12px',
                  border: '1px solid rgba(234, 88, 12, 0.15)',
                  padding: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  gap: '12px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onClick={() => navigate(`/products/${prod._id || prod.id}`)}
              >
                <div style={{ position: 'relative', width: '80px', height: '80px', flexShrink: 0, borderRadius: '8px', overflow: 'hidden' }}>
                  <img
                    src={prod.image || prod.images?.[0]}
                    alt={prod.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    loading="lazy"
                  />
                  <div style={{
                    position: 'absolute',
                    top: '2px',
                    left: '2px',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '10px',
                    fontWeight: 900,
                    padding: '1px 5px',
                    borderRadius: '4px',
                  }}>
                    -{prod.discountPercent}%
                  </div>
                </div>

                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: 'var(--text-primary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {prod.name}
                  </div>

                  <div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                      <span style={{ fontSize: '15px', fontWeight: 800, color: '#ea580c' }}>
                        {formatCurrency(prod.price)}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {formatCurrency(prod.originalPrice)}
                      </span>
                    </div>

                    {/* Mini Fire Bar */}
                    <div style={{
                      marginTop: '6px',
                      height: '14px',
                      borderRadius: '9999px',
                      background: '#fed7aa',
                      position: 'relative',
                      overflow: 'hidden',
                    }}>
                      <div style={{
                        position: 'absolute',
                        left: 0,
                        top: 0,
                        bottom: 0,
                        width: `${prod.percentSold}%`,
                        background: prod.isBurningOut
                          ? 'linear-gradient(90deg, #dc2626, #ea580c)'
                          : 'linear-gradient(90deg, #f97316, #fb923c)',
                        borderRadius: '9999px',
                      }} />
                      <div style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '9.5px',
                        fontWeight: 800,
                        color: '#ffffff',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)',
                        letterSpacing: '0.2px',
                      }}>
                        {prod.isBurningOut ? `CHÁY HÀNG • ĐÃ BÁN ${prod.percentSold}%` : `ĐÃ BÁN ${prod.percentSold}%`}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Phân Loại Ngành Hàng Độc Quyền Của Shop */}
      <div style={{
        background: 'var(--bg-card, #ffffff)',
        padding: '14px 18px',
        borderRadius: '12px',
        border: '1px solid var(--border-medium, #e2e8f0)',
        marginBottom: '16px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ width: '26px', height: '26px', borderRadius: '6px', background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <LayersIcon size={14} color="#ea580c" />
            </span>
            <span style={{ fontSize: '13.5px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--text-primary)' }}>
              Danh Mục & Phân Loại Hàng Của Shop
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              ({shopCategories.length - 1} phân loại chuyên sâu)
            </span>
          </div>
          {selectedCategory !== 'all' && (
            <button
              type="button"
              onClick={() => setSelectedCategory('all')}
              style={{
                background: '#ffedd5',
                border: '1px solid #fed7aa',
                color: '#ea580c',
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '6px',
                padding: '4px 10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: '#fdba74', border: '1px solid rgba(124, 45, 18, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloseIcon size={10} color="#7c2d12" />
              </span>
              <span>Bỏ lọc phân loại (Xem tất cả)</span>
            </button>
          )}
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          overflowX: 'auto',
          paddingBottom: '4px',
          scrollbarWidth: 'thin'
        }}>
          {shopCategories.map((cat) => {
            const isActive = selectedCategory === cat.key;
            return (
              <button
                key={cat.key}
                type="button"
                onClick={() => setSelectedCategory(cat.key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 16px',
                  borderRadius: '20px',
                  border: isActive ? '2px solid var(--primary-color, #ea580c)' : '1px solid var(--border-medium, #e2e8f0)',
                  background: isActive ? 'linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)' : 'var(--bg-page, #f8fafc)',
                  color: isActive ? 'var(--primary-color, #ea580c)' : 'var(--text-primary)',
                  fontWeight: isActive ? 800 : 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  boxShadow: isActive ? '0 2px 8px rgba(234, 88, 12, 0.2)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span>{cat.label}</span>
                <span style={{
                  fontSize: '11px',
                  background: isActive ? 'var(--primary-color, #ea580c)' : 'var(--border-medium, #cbd5e1)',
                  color: isActive ? '#ffffff' : 'var(--text-secondary)',
                  padding: '1px 6px',
                  borderRadius: '10px',
                  fontWeight: 700
                }}>
                  {cat.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Shop Catalog Header & Search */}
      <section>
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            padding: '16px 20px',
            borderRadius: '12px',
            border: '1px solid var(--border-medium, #e2e8f0)',
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            marginBottom: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ShoppingBagIcon size={20} color="var(--primary-color, #ea580c)" />
            </span>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                {selectedCategory === 'all'
                  ? `Tất Cả Sản Phẩm Gian Hàng (${matchingProducts.length})`
                  : `${shopCategories.find(c => c.key === selectedCategory)?.label || 'Sản Phẩm'} (${matchingProducts.length})`}
              </h2>
              <small style={{ color: 'var(--text-muted)' }}>
                {selectedCategory === 'all'
                  ? 'Cam kết 100% chính hãng, có sẵn giao ngay toàn quốc'
                  : `Đang lọc các sản phẩm theo phân loại "${shopCategories.find(c => c.key === selectedCategory)?.label}"`}
              </small>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* Search inside shop */}
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder={t('shop_search_placeholder')}
                className="shopee-form-input"
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
                style={{ width: '250px', padding: shopSearch ? '8px 32px 8px 38px' : '8px 14px 8px 38px', fontSize: '13px', borderRadius: '8px' }}
              />
              <span style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center' }}>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.1)', border: '1px solid rgba(100, 116, 139, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SearchIcon size={11} color="#64748b" />
                </span>
              </span>
              {shopSearch && (
                <button
                  type="button"
                  onClick={() => setShopSearch('')}
                  style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', padding: 0, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                  title="Xóa tìm kiếm"
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CloseIcon size={10} color="#ef4444" />
                  </span>
                </button>
              )}
            </div>

            {/* Sort */}
            <select
              className="shopee-form-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={{ padding: '8px 14px', fontSize: '13px', borderRadius: '8px', fontWeight: 600 }}
            >
              <option value="featured">Nổi Bật Nhất</option>
              <option value="best_selling">Bán Chạy Nhất</option>
              <option value="price_asc">Giá: Thấp đến Cao</option>
              <option value="price_desc">Giá: Cao đến Thấp</option>
            </select>
          </div>
        </div>

        {/* Product Grid */}
        {matchingProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: 'var(--bg-card, #ffffff)', borderRadius: '12px', border: '1px solid var(--border-medium, #e2e8f0)', color: 'var(--text-muted)' }}>
            <div style={{ display: 'inline-flex', justifyContent: 'center', marginBottom: '14px' }}>
              <span style={{ width: '64px', height: '64px', borderRadius: '16px', background: 'rgba(100, 116, 139, 0.08)', border: '1px solid rgba(100, 116, 139, 0.18)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <SearchIcon size={32} color="#94a3b8" />
              </span>
            </div>
            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
              Không tìm thấy sản phẩm nào
            </div>
            <p style={{ margin: '6px 0 16px', fontSize: '13px' }}>
              Không có sản phẩm nào phù hợp với bộ lọc hiện tại trong gian hàng này.
            </p>
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              onClick={() => {
                setShopSearch('');
                setSelectedCategory('all');
              }}
              style={{ padding: '8px 18px', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloseIcon size={10} color="#ef4444" />
              </span>
              <span>Xóa bộ lọc tìm kiếm</span>
            </button>
          </div>
        ) : (
          <div className="shopee-product-grid">
            {matchingProducts.map((p) => {
              const id = p._id || p.id;
              return (
                <div key={id} style={{ position: 'relative' }}>
                  <ProductCard product={p} />
                  {/* Compare button overlay */}
                  <button
                    type="button"
                    onClick={() => addToCompare(p)}
                    style={{
                      position: 'absolute',
                      bottom: '12px',
                      left: '12px',
                      background: isCompared(id) ? 'var(--primary-color)' : 'var(--bg-card, #ffffff)',
                      color: isCompared(id) ? '#ffffff' : 'var(--text-primary)',
                      border: '1px solid var(--border-medium, #cbd5e1)',
                      borderRadius: '6px',
                      padding: '4px 8px',
                      fontSize: '11px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      zIndex: 2,
                      boxShadow: 'var(--shadow-sm)',
                    }}
                    title={t('compare_btn')}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                      <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: isCompared(id) ? 'rgba(255, 255, 255, 0.22)' : 'rgba(37, 99, 235, 0.12)', border: isCompared(id) ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <ScaleIcon size={10} color={isCompared(id) ? "#ffffff" : "#2563eb"} />
                      </span>
                      <span>{isCompared(id) ? 'Đã so sánh' : 'So sánh'}</span>
                    </span>
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* Phần Gợi Ý Thông Minh Khi Kéo Hết Phân Loại */}
        {selectedCategory !== 'all' && otherProducts.length > 0 && (
          <div style={{ marginTop: '48px', paddingTop: '32px', borderTop: '2px dashed var(--border-medium, #cbd5e1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '30px', height: '30px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <SparklesIcon size={16} color="#f59e0b" />
                  </span>
                  <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                    Gợi Ý Thêm Sản Phẩm Khác Từ Gian Hàng (Bạn Có Thể Cũng Thích)
                  </h3>
                </div>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                  Bạn vừa xem hết các mẫu <strong>{shopCategories.find(c => c.key === selectedCategory)?.label || 'sản phẩm'}</strong>. Đừng bỏ lỡ các mặt hàng bán chạy khác từ {shop.name}!
                </p>
              </div>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                onClick={() => setSelectedCategory('all')}
                style={{ fontSize: '12.5px', padding: '6px 14px', borderRadius: '8px', fontWeight: 700 }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span>Xem Toàn Bộ {products.length} Sản Phẩm</span>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRightIcon size={11} color="#ea580c" />
                  </span>
                </span>
              </button>
            </div>

            <div className="shopee-product-grid">
              {otherProducts.map((p) => {
                const id = p._id || p.id;
                return (
                  <div key={id} style={{ position: 'relative' }}>
                    <ProductCard product={p} />
                    <button
                      type="button"
                      onClick={() => addToCompare(p)}
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        left: '12px',
                        background: isCompared(id) ? 'var(--primary-color)' : 'var(--bg-card, #ffffff)',
                        color: isCompared(id) ? '#ffffff' : 'var(--text-primary)',
                        border: '1px solid var(--border-medium, #cbd5e1)',
                        borderRadius: '6px',
                        padding: '4px 8px',
                        fontSize: '11px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        zIndex: 2,
                        boxShadow: 'var(--shadow-sm)',
                      }}
                      title={t('compare_btn')}
                    >
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: isCompared(id) ? 'rgba(255, 255, 255, 0.22)' : 'rgba(37, 99, 235, 0.12)', border: isCompared(id) ? '1px solid rgba(255, 255, 255, 0.3)' : '1px solid rgba(37, 99, 235, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <ScaleIcon size={10} color={isCompared(id) ? "#ffffff" : "#2563eb"} />
                        </span>
                        <span>{isCompared(id) ? 'Đã so sánh' : 'So sánh'}</span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
