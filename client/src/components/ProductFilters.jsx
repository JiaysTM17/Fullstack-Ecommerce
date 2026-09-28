import React, { useState } from 'react';
import { getAllShops } from '../services/shopService';
import { useLanguage } from '../context/LanguageContext';
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
  const allShops = getAllShops();
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice || "");
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice || "");

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
        <h4 className="shopee-filter-title">{t('filter_categories', 'Danh Mục')}</h4>
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
              <span>{cat === "Tất cả" ? `📦 ${t('all_categories', 'Tất cả danh mục')}` : `• ${cat}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Shop Filter */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">{t('filter_official_shops', 'Cửa Hàng (Shop Chính Hãng)')}</h4>
        <div className="shopee-filter-list" style={{ maxHeight: '240px', overflowY: 'auto' }}>
          <div
            className={`shopee-filter-item ${!filters.shopId ? "active" : ""}`}
            onClick={() => onFilterChange("shopId", "")}
          >
            <span>🏪 {t('all_shops', 'Tất cả gian hàng')} ({allShops.length})</span>
          </div>
          {allShops.map((s) => {
            const icons = {
              shop_01: '👗', shop_02: '🎧', shop_03: '💄', shop_04: '🏡',
              shop_05: '⚽', shop_06: '🌿', shop_07: '📚', shop_08: '🚗',
              shop_09: '🍼', shop_10: '🎵', shop_11: '🐾', shop_12: '⌚'
            };
            return (
              <div
                key={s.id}
                className={`shopee-filter-item ${filters.shopId === s.id ? "active" : ""}`}
                onClick={() => onFilterChange("shopId", filters.shopId === s.id ? "" : s.id)}
                title={s.description}
              >
                <span>{icons[s.id] || '🏪'} {s.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Fast Delivery */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">{t('filter_shipping', 'Vận Chuyển')}</h4>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={Boolean(filters.fastDelivery)}
            onChange={(e) => onFilterChange("fastDelivery", e.target.checked ? "1" : "")}
          />
          <span className="shopee-fast-delivery-badge">⚡ {t('fast_delivery_2h', 'Giao Nhanh 2H')}</span>
        </label>
      </div>

      {/* 4. Price Filter */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">{t('filter_price_range', 'Khoảng Giá')}</h4>
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

      {/* 5. Rating Filter */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">{t('filter_rating', 'Đánh Giá Khách Hàng')}</h4>
        <div
          className={`shopee-rating-filter-row ${filters.minRating === "4" ? "active" : ""}`}
          onClick={() => onFilterChange("minRating", filters.minRating === "4" ? "" : "4")}
        >
          <span className="shopee-rating-stars">★★★★☆</span>
          <span>{t('rating_4_up', 'Từ 4 sao trở lên')}</span>
        </div>
        <div
          className={`shopee-rating-filter-row ${filters.minRating === "4.8" ? "active" : ""}`}
          onClick={() => onFilterChange("minRating", filters.minRating === "4.8" ? "" : "4.8")}
        >
          <span className="shopee-rating-stars">★★★★★</span>
          <span>{t('rating_48_up', 'Từ 4.8 sao (Xuất sắc)')}</span>
        </div>
      </div>

      {/* 6. Special Badges */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">{t('filter_certifications', 'Chứng Nhận Sàn')}</h4>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={filters.badge === "Amazon's Choice"}
            onChange={(e) =>
              onFilterChange("badge", e.target.checked ? "Amazon's Choice" : "")
            }
          />
          <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>✨ {t('featured_picks', 'Hàng Tuyển Chọn')}</span>
        </label>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(e) => onFilterChange("inStock", e.target.checked ? "1" : "")}
          />
          <span>{t('in_stock_only', 'Chỉ xem hàng còn trong kho')}</span>
        </label>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          type="button"
          className="shopee-clear-filters-btn"
          onClick={onResetFilters}
        >
          ✕ {t('clear_all_filters', 'Xóa tất cả bộ lọc')}
        </button>
      )}
    </aside>
  );
}
