import React, { useState } from 'react';
import '../styles/filters.css';

const CATEGORIES = ["Tất cả", "Thời trang", "Điện tử", "Đời sống"];

const PRICE_PRESETS = [
  { label: "Dưới 200k", min: "", max: "200000" },
  { label: "200k - 500k", min: "200000", max: "500000" },
  { label: "500k - 1tr", min: "500000", max: "1000000" },
  { label: "Trên 1tr", min: "1000000", max: "" },
];

export default function ProductFilters({ filters = {}, onFilterChange, onResetFilters }) {
  const [minPriceInput, setMinPriceInput] = useState(filters.minPrice || "");
  const [maxPriceInput, setMaxPriceInput] = useState(filters.maxPrice || "");

  const handlePriceApply = (e) => {
    e.preventDefault();
    onFilterChange("minPrice", minPriceInput);
    onFilterChange("maxPrice", maxPriceInput);
  };

  const handlePresetClick = (preset) => {
    setMinPriceInput(preset.min);
    setMaxPriceInput(preset.max);
    onFilterChange("minPrice", preset.min);
    onFilterChange("maxPrice", preset.max);
  };

  const isPresetActive = (preset) => {
    return filters.minPrice === preset.min && filters.maxPrice === preset.max;
  };

  const hasActiveFilters = Boolean(
    filters.category ||
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
        <h4 className="shopee-filter-title">Danh Mục</h4>
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
              <span>{cat === "Tất cả" ? "📦 Tất cả danh mục" : `• ${cat}`}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 2. Fast Delivery */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">Vận Chuyển</h4>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={Boolean(filters.fastDelivery)}
            onChange={(e) => onFilterChange("fastDelivery", e.target.checked ? "1" : "")}
          />
          <span className="shopee-fast-delivery-badge">⚡ Giao Nhanh 2H</span>
        </label>
      </div>

      {/* 3. Price Filter */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">Khoảng Giá</h4>
        <div className="shopee-price-presets">
          {PRICE_PRESETS.map((p) => (
            <button
              key={p.label}
              type="button"
              className={`shopee-price-chip ${isPresetActive(p) ? "active" : ""}`}
              onClick={() => handlePresetClick(p)}
            >
              {p.label}
            </button>
          ))}
        </div>

        <form onSubmit={handlePriceApply} className="shopee-custom-price-inputs">
          <input
            type="number"
            placeholder="Từ ₫"
            className="shopee-custom-price-input"
            value={minPriceInput}
            onChange={(e) => setMinPriceInput(e.target.value)}
          />
          <span>-</span>
          <input
            type="number"
            placeholder="Đến ₫"
            className="shopee-custom-price-input"
            value={maxPriceInput}
            onChange={(e) => setMaxPriceInput(e.target.value)}
          />
          <button type="submit" className="shopee-price-apply-btn">
            Áp Dụng
          </button>
        </form>
      </div>

      {/* 4. Rating Filter */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">Đánh Giá Khách Hàng</h4>
        <div
          className={`shopee-rating-filter-row ${filters.minRating === "4" ? "active" : ""}`}
          onClick={() => onFilterChange("minRating", filters.minRating === "4" ? "" : "4")}
        >
          <span className="shopee-rating-stars">★★★★☆</span>
          <span>Từ 4 sao trở lên</span>
        </div>
        <div
          className={`shopee-rating-filter-row ${filters.minRating === "4.8" ? "active" : ""}`}
          onClick={() => onFilterChange("minRating", filters.minRating === "4.8" ? "" : "4.8")}
        >
          <span className="shopee-rating-stars">★★★★★</span>
          <span>Từ 4.8 sao (Xuất sắc)</span>
        </div>
      </div>

      {/* 5. Special Badges */}
      <div className="shopee-filter-section">
        <h4 className="shopee-filter-title">Chứng Nhận Sàn</h4>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={filters.badge === "Amazon's Choice"}
            onChange={(e) =>
              onFilterChange("badge", e.target.checked ? "Amazon's Choice" : "")
            }
          />
          <span style={{ fontWeight: 600, color: "#111" }}>Amazon's Choice</span>
        </label>
        <label className="shopee-filter-item">
          <input
            type="checkbox"
            checked={Boolean(filters.inStock)}
            onChange={(e) => onFilterChange("inStock", e.target.checked ? "1" : "")}
          />
          <span>Chỉ xem hàng còn trong kho</span>
        </label>
      </div>

      {/* Clear All */}
      {hasActiveFilters && (
        <button
          type="button"
          className="shopee-clear-filters-btn"
          onClick={onResetFilters}
        >
          ✕ Xóa tất cả bộ lọc
        </button>
      )}
    </aside>
  );
}
