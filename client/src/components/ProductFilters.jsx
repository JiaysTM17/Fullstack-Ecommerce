import React, { useState, useEffect } from 'react';
import { getAllShops } from '../services/shopService';
import { useLanguage } from '../context/LanguageContext';
import {
  PackageIcon,
  TagIcon,
  StoreIcon,
  BoltIcon,
  SparklesIcon,
  StarIcon,
  CloseIcon,
  TruckIcon,
  CoinIcon,
  CheckIcon,
} from './OrdersIcons';
import '../styles/filters.css';

const CATEGORIES = ["Tất cả", "Thời trang", "Điện tử", "Sắc đẹp", "Gia dụng", "Thể thao", "Đời sống"];

const PRICE_PRESETS = [
  { label: "Dưới 200k", labelEn: "Under 200k", min: "", max: "200000" },
  { label: "200k - 500k", labelEn: "200k - 500k", min: "200000", max: "500000" },
  { label: "500k - 1tr", labelEn: "500k - 1M", min: "500000", max: "1000000" },
  { label: "Trên 1tr", labelEn: "Over 1M", min: "1000000", max: "" },
];

export default function ProductFilters({ filters = {}, onFilterChange, onResetFilters, onFilterBatch }) {
  const { t, language } = useLanguage();
  const [allShops, setAllShops] = useState([]);
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice || "");
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice || "");

  useEffect(() => {
    getAllShops().then(shops => setAllShops(shops || []));
  }, []);

  const handlePriceApply = (e) => {
    e.preventDefault();
    if (onFilterBatch) {
      onFilterBatch({ minPrice: minPriceInput, maxPrice: maxPriceInput });
    } else {
      onFilterChange("minPrice", minPriceInput);
      onFilterChange("maxPrice", maxPriceInput);
    }
  };

  const handlePresetClick = (preset) => {
    setMinPriceInput(preset.min);
    setMaxPriceInput(preset.max);
    if (onFilterBatch) {
      onFilterBatch({ minPrice: preset.min, maxPrice: preset.max });
    } else {
      onFilterChange("minPrice", preset.min);
      onFilterChange("maxPrice", preset.max);
    }
  };

  const isPresetActive = (preset) => {
    return filters.minPrice === preset.min && filters.maxPrice === preset.max;
  };

  const hasActiveFilters = Boolean(
    filters.category ||
    filters.brand ||
    filters.shopId ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minRating ||
    filters.fastDelivery ||
    filters.inStock ||
    filters.badge
  );

  return (
    <aside className="shopee-filter-sidebar">
      {/* 1. Category */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(234, 88, 12, 0.1)', border: '1px solid rgba(234, 88, 12, 0.2)', flexShrink: 0 }}>
            <PackageIcon size={13} color="#ea580c" />
          </span>
          <span>{t('filter_categories', 'Danh Mục')}</span>
        </h4>
        <div className="shopee-filter-list">
          {CATEGORIES.map((cat) => (
            <div
              key={cat}
              className={`shopee-filter-item ${
                (filters.category === cat || (!filters.category && cat === "Tất cả"))
                  ? "active"
                  : ""
              }`}
              onClick={() => onFilterChange("category", cat === "Tất cả" ? "" : cat)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                {cat === "Tất cả" ? (
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PackageIcon size={12} color="#ea580c" />
                  </span>
                ) : (
                  <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: filters.category === cat ? 'rgba(234, 88, 12, 0.15)' : 'rgba(100, 116, 139, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: filters.category === cat ? '#ea580c' : '#64748b' }}>
                    •
                  </span>
                )}
                <span>{cat === "Tất cả" ? t('all_categories', 'Tất cả danh mục') : cat}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Brand Filter (Hãng / Thương hiệu) */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.2)', flexShrink: 0 }}>
            <TagIcon size={13} color="#2563eb" />
          </span>
          <span>{t('filter_brands', 'Thương Hiệu / Hãng')}</span>
        </h4>
        <div className="shopee-filter-list" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          <div
            className={`shopee-filter-item ${!filters.brand ? "active" : ""}`}
            onClick={() => onFilterChange("brand", "")}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <TagIcon size={12} color="#ea580c" />
              </span>
              <span>{t('all_brands', 'Tất cả thương hiệu')}</span>
            </span>
          </div>
          {["Apple", "Samsung", "Sony", "Xiaomi", "Asus", "Dell", "Nike", "Adidas", "Lock&Lock", "Dyson", "Shopee Basic", "Elegance"].map((b) => (
            <div
              key={b}
              className={`shopee-filter-item ${filters.brand === b ? "active" : ""}`}
              onClick={() => onFilterChange("brand", filters.brand === b ? "" : b)}
            >
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '16px', height: '16px', borderRadius: '4px', background: filters.brand === b ? 'rgba(37, 99, 235, 0.15)' : 'rgba(100, 116, 139, 0.08)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: filters.brand === b ? '#2563eb' : '#64748b' }}>
                  •
                </span>
                <span>{b}</span>
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Shop Filter */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.2)', flexShrink: 0 }}>
            <StoreIcon size={13} color="#dc2626" />
          </span>
          <span>{t('filter_official_shops', 'Cửa Hàng (Shop Chính Hãng)')}</span>
        </h4>
        <div className="shopee-filter-list" style={{ maxHeight: '240px', overflowY: 'auto' }}>
          <div
            className={`shopee-filter-item ${!filters.shopId ? "active" : ""}`}
            onClick={() => onFilterChange("shopId", "")}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(220, 38, 38, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <StoreIcon size={12} color="#dc2626" />
              </span>
              <span>{t('all_shops', 'Tất cả gian hàng')} ({allShops.length})</span>
            </span>
          </div>
          {allShops.map((s) => {
            return (
              <div
                key={s.id}
                className={`shopee-filter-item ${filters.shopId === s.id ? "active" : ""}`}
                onClick={() => onFilterChange("shopId", filters.shopId === s.id ? "" : s.id)}
                title={s.description}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <StoreIcon size={12} color="#ea580c" />
                  </span>
                  <span>{s.name}</span>
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Fast Delivery */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(5, 150, 105, 0.2)', flexShrink: 0 }}>
            <TruckIcon size={13} color="#059669" />
          </span>
          <span>{t('filter_shipping', 'Vận Chuyển')}</span>
        </h4>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={Boolean(filters.fastDelivery)}
            onChange={(e) => onFilterChange("fastDelivery", e.target.checked ? "1" : "")}
          />
          <span className="shopee-fast-delivery-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', flexShrink: 0 }}>
              <BoltIcon size={11} color="#ffffff" />
            </span>
            <span>{t('fast_delivery_2h', 'Giao Nhanh 2H')}</span>
          </span>
        </label>
      </div>

      {/* 5. Price Filter */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.2)', flexShrink: 0 }}>
            <CoinIcon size={13} color="#d97706" />
          </span>
          <span>{t('filter_price_range', 'Khoảng Giá')}</span>
        </h4>
        <div className="shopee-price-presets">
          {PRICE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`shopee-price-chip ${isPresetActive(p) ? "active" : ""}`}
              onClick={() => handlePresetClick(p)}
            >
              {language === 'en' ? p.labelEn : p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handlePriceApply} className="shopee-custom-price-inputs">
          <input
            type="number"
            placeholder={language === 'en' ? "From ₫" : "Từ ₫"}
            className="shopee-custom-price-input"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
          />
          <span>-</span>
          <input
            type="number"
            placeholder={language === 'en' ? "To ₫" : "Đến ₫"}
            className="shopee-custom-price-input"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
          />
          <button type="submit" className="shopee-price-apply-btn">
            {t('apply_filter', 'Áp Dụng')}
          </button>
        </form>
      </div>

      {/* 6. Rating Filter */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', flexShrink: 0 }}>
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
          </span>
          <span>{t('filter_rating', 'Đánh Giá Khách Hàng')}</span>
        </h4>
        <div
          className={`shopee-rating-filter-row ${filters.minRating === "4" ? "active" : ""}`}
          onClick={() => onFilterChange("minRating", filters.minRating === "4" ? "" : "4")}
        >
          <span className="shopee-rating-stars" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" /><StarIcon size={13} color="#f59e0b" fill="#f59e0b" /><StarIcon size={13} color="#f59e0b" fill="#f59e0b" /><StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
            <StarIcon size={13} color="#cbd5e1" />
          </span>
          <span>{t('rating_4_up', 'Từ 4 sao trở lên')}</span>
        </div>
        <div
          className={`shopee-rating-filter-row ${filters.minRating === "4.8" ? "active" : ""}`}
          onClick={() => onFilterChange("minRating", filters.minRating === "4.8" ? "" : "4.8")}
        >
          <span className="shopee-rating-stars" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#f59e0b', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" /><StarIcon size={13} color="#f59e0b" fill="#f59e0b" /><StarIcon size={13} color="#f59e0b" fill="#f59e0b" /><StarIcon size={13} color="#f59e0b" fill="#f59e0b" /><StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
          </span>
          <span>{t('rating_48_up', 'Từ 4.8 sao (Xuất sắc)')}</span>
        </div>
      </div>

      {/* 7. Special Badges */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.2)', flexShrink: 0 }}>
            <SparklesIcon size={13} color="#8b5cf6" />
          </span>
          <span>{t('filter_certifications', 'Chứng Nhận Sàn')}</span>
        </h4>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={filters.badge === "Amazon's Choice"}
            onChange={(e) =>
              onFilterChange("badge", e.target.checked ? "Amazon's Choice" : "")
            }
          />
          <span style={{ fontWeight: 600, color: "var(--text-primary)", display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <SparklesIcon size={12} color="#ea580c" />
            </span>
            <span>{t('featured_picks', 'Hàng Tuyển Chọn')}</span>
          </span>
        </label>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(e) => onFilterChange("inStock", e.target.checked ? "1" : "")}
          />
          <span style={{ fontWeight: 600, color: "var(--text-primary)", display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(5, 150, 105, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckIcon size={11} color="#059669" />
            </span>
            <span>{t('in_stock_only', 'Chỉ xem hàng còn trong kho')}</span>
          </span>
        </label>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          type="button"
          className="shopee-clear-filters-btn"
          onClick={onResetFilters}
          style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.25)', flexShrink: 0 }}>
            <CloseIcon size={11} color="#ef4444" />
          </span>
          <span>{t('clear_all_filters', 'Xóa tất cả bộ lọc')}</span>
        </button>
      )}
    </aside>
  );
}
