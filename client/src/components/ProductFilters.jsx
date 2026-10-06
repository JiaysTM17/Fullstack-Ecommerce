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
        <h4 className="shopee-filter-title">
          <PackageIcon size={16} color="#ea580c" />
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
              <span style={{ fontSize: '12px', color: (filters.category === cat || (!filters.category && cat === "Tất cả")) ? '#ea580c' : '#94a3b8' }}>
                {(filters.category === cat || (!filters.category && cat === "Tất cả")) ? '▸' : '•'}
              </span>
              <span>{cat === "Tất cả" ? t('all_categories', 'Tất cả danh mục') : cat}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Brand Filter (Hãng / Thương hiệu) */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">
          <TagIcon size={16} color="#2563eb" />
          <span>{t('filter_brands', 'Thương Hiệu / Hãng')}</span>
        </h4>
        <div className="shopee-filter-scrollable shopee-filter-list">
          <div
            className={`shopee-filter-item ${!filters.brand ? "active" : ""}`}
            onClick={() => onFilterChange("brand", "")}
          >
            <span style={{ fontSize: '12px', color: !filters.brand ? '#ea580c' : '#94a3b8' }}>
              {!filters.brand ? '▸' : '•'}
            </span>
            <span>{t('all_brands', 'Tất cả thương hiệu')}</span>
          </div>
          {["Apple", "Samsung", "Sony", "Xiaomi", "Asus", "Dell", "Nike", "Adidas", "Lock&Lock", "Dyson", "Shopee Basic", "Elegance"].map((b) => (
            <div
              key={b}
              className={`shopee-filter-item ${filters.brand === b ? "active" : ""}`}
              onClick={() => onFilterChange("brand", filters.brand === b ? "" : b)}
            >
              <span style={{ fontSize: '12px', color: filters.brand === b ? '#ea580c' : '#94a3b8' }}>
                {filters.brand === b ? '▸' : '•'}
              </span>
              <span>{b}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Shop Filter */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">
          <StoreIcon size={16} color="#dc2626" />
          <span>{t('filter_official_shops', 'Cửa Hàng (Shop Chính Hãng)')}</span>
        </h4>
        <div className="shopee-filter-scrollable shopee-filter-list">
          <div
            className={`shopee-filter-item ${!filters.shopId ? "active" : ""}`}
            onClick={() => onFilterChange("shopId", "")}
          >
            <span style={{ fontSize: '12px', color: !filters.shopId ? '#ea580c' : '#94a3b8' }}>
              {!filters.shopId ? '▸' : '•'}
            </span>
            <span>{t('all_shops', 'Tất cả gian hàng')} ({allShops.length})</span>
          </div>
          {allShops.map((s) => (
            <div
              key={s.id}
              className={`shopee-filter-item ${filters.shopId === s.id ? "active" : ""}`}
              onClick={() => onFilterChange("shopId", filters.shopId === s.id ? "" : s.id)}
              title={s.description}
            >
              <span style={{ fontSize: '12px', color: filters.shopId === s.id ? '#ea580c' : '#94a3b8' }}>
                {filters.shopId === s.id ? '▸' : '•'}
              </span>
              <span>{s.name}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 4. Fast Delivery */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">
          <TruckIcon size={16} color="#059669" />
          <span>{t('filter_shipping', 'Vận Chuyển')}</span>
        </h4>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={Boolean(filters.fastDelivery)}
            onChange={(e) => onFilterChange("fastDelivery", e.target.checked ? "1" : "")}
          />
          <span className="shopee-fast-delivery-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <BoltIcon size={12} color="#0891b2" />
            <span>{t('fast_delivery_2h', 'Giao Nhanh 2H')}</span>
          </span>
        </label>
      </div>

      {/* 5. Price Filter */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">
          <CoinIcon size={16} color="#d97706" />
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
        <h4 className="shopee-filter-title">
          <StarIcon size={16} color="#f59e0b" fill="#f59e0b" />
          <span>{t('filter_rating', 'Đánh Giá Khách Hàng')}</span>
        </h4>
        <div
          className={`shopee-rating-filter-row ${filters.minRating === "4" ? "active" : ""}`}
          onClick={() => onFilterChange("minRating", filters.minRating === "4" ? "" : "4")}
        >
          <span className="shopee-rating-stars" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#f59e0b' }}>
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
            <StarIcon size={13} color="#cbd5e1" />
          </span>
          <span>{t('rating_4_up', 'Từ 4 sao trở lên')}</span>
        </div>
        <div
          className={`shopee-rating-filter-row ${filters.minRating === "4.8" ? "active" : ""}`}
          onClick={() => onFilterChange("minRating", filters.minRating === "4.8" ? "" : "4.8")}
        >
          <span className="shopee-rating-stars" style={{ display: 'inline-flex', alignItems: 'center', gap: '2px', color: '#f59e0b' }}>
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
            <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
          </span>
          <span>{t('rating_48_up', 'Từ 4.8 sao (Xuất sắc)')}</span>
        </div>
      </div>

      {/* 7. Special Badges */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">
          <SparklesIcon size={16} color="#8b5cf6" />
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
          <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
            {t('featured_picks', 'Hàng Tuyển Chọn')}
          </span>
        </label>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(e) => onFilterChange("inStock", e.target.checked ? "1" : "")}
          />
          <span style={{ fontWeight: 500, color: "var(--text-primary)" }}>
            {t('in_stock_only', 'Chỉ xem hàng còn trong kho')}
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
          <CloseIcon size={13} color="currentColor" />
          <span>{t('clear_all_filters', 'Xóa tất cả bộ lọc')}</span>
        </button>
      )}
    </aside>
  );
}
