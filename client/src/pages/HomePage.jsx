import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  EmptyState, 
  FlashDeals, 
  HeroBanner, 
  ProductFilters, 
  ProductGrid,
  QuickViewModal,
  RecentlyViewed
} from "../components";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { getProducts } from "../services/productService";
import { formatCurrency } from "../utils/formatCurrency";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const filters = useMemo(
    () => ({
      keyword: searchParams.get("keyword") || "",
      category: searchParams.get("category") || "",
      sort: searchParams.get("sort") || "",
      minPrice: searchParams.get("minPrice") || "",
      maxPrice: searchParams.get("maxPrice") || "",
      minRating: searchParams.get("minRating") || "",
      fastDelivery: searchParams.get("fastDelivery") || "",
      inStock: searchParams.get("inStock") || "",
      badge: searchParams.get("badge") || "",
      shopId: searchParams.get("shopId") || "",
      page: searchParams.get("page") || "1",
      limit: searchParams.get("limit") || "12",
    }),
    [searchParams],
  );

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");
        const result = await getProducts(filters);

        if (!ignore) {
          setProducts(result.products);
          setPagination(result.pagination);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Không thể tải danh sách sản phẩm");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadProducts();

    return () => {
      ignore = true;
    };
  }, [filters]);

  function updateFilter(key, value) {
    const nextParams = new URLSearchParams(searchParams);

    if (value) {
      nextParams.set(key, value);
    } else {
      nextParams.delete(key);
    }

    if (key !== "page") {
      nextParams.set("page", "1");
    }

    setSearchParams(nextParams);
  }

  function handlePageChange(newPage) {
    updateFilter("page", String(newPage));
    const catalogEl = document.getElementById("catalog-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams({ page: "1", limit: filters.limit || "12" }));
  }

  const hasActiveFilters = Boolean(
    filters.keyword ||
    filters.category ||
    filters.minPrice ||
    filters.maxPrice ||
    filters.minRating ||
    filters.badge ||
    filters.fastDelivery ||
    filters.inStock ||
    filters.shopId
  );

  function viewProductDetail(product) {
    const productId = product._id || product.id;
    if (productId) {
      navigate(`/products/${productId}`);
    }
  }

  return (
    <main className="shopee-container" style={{ padding: "20px 0" }}>
      {/* 1. Hero Banner Carousel */}
      <HeroBanner onSelectCategory={(cat) => updateFilter("category", cat)} />

      {/* 2. Flash Deals Section */}
      <FlashDeals
        products={products}
        onProductClick={viewProductDetail}
        formatCurrency={formatCurrency}
      />

      {/* 3. Main Catalog Section with Sidebar Filters */}
      <div
        id="catalog-section"
        style={{
          display: "grid",
          gridTemplateColumns: "260px 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left Sidebar Filters */}
        <ProductFilters
          filters={filters}
          onFilterChange={updateFilter}
          onResetFilters={resetFilters}
        />

        {/* Right Product Grid Area */}
        <section>
          {/* Top Filter Bar & Sorting */}
          <div
            style={{
              background: "var(--bg-card, #fff)",
              borderRadius: "10px",
              padding: "16px 20px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              border: "1px solid var(--border-medium, #e2e8f0)",
              boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                {t('results_found', 'Tìm thấy')} <strong style={{ color: "var(--primary-color, #ea580c)" }}>{pagination?.total || products.length}</strong> {t('products_count', 'sản phẩm')}
              </span>

              {/* Active Filter Chips */}
              {filters.keyword && (
                <span className="shopee-filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {t('keyword', 'Từ khóa')}: "{filters.keyword}"
                  <button type="button" onClick={() => updateFilter("keyword", "")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: 0 }}>✕</button>
                </span>
              )}
              {filters.category && (
                <span className="shopee-filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {t('category', 'Danh mục')}: {filters.category}
                  <button type="button" onClick={() => updateFilter("category", "")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: 0 }}>✕</button>
                </span>
              )}
              {filters.badge && (
                <span className="shopee-filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {filters.badge === "Amazon's Choice" ? t('nav_featured_picks', 'Tuyển chọn') : filters.badge}
                  <button type="button" onClick={() => updateFilter("badge", "")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: 0 }}>✕</button>
                </span>
              )}
              {filters.fastDelivery && (
                <span className="shopee-filter-chip" style={{ background: "var(--primary-light, #ffedd5)", color: "var(--primary-color, #ea580c)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  ⚡ {t('nav_fast_delivery', 'Giao siêu tốc 2H')}
                  <button type="button" onClick={() => updateFilter("fastDelivery", "")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: 0 }}>✕</button>
                </span>
              )}
              {filters.minRating && (
                <span className="shopee-filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  ⭐ Từ {filters.minRating} sao
                  <button type="button" onClick={() => updateFilter("minRating", "")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: 0 }}>✕</button>
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="shopee-filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  💰 {filters.minPrice ? formatCurrency(Number(filters.minPrice)) : "0₫"} - {filters.maxPrice ? formatCurrency(Number(filters.maxPrice)) : "Vô cực"}
                  <button type="button" onClick={() => { updateFilter("minPrice", ""); updateFilter("maxPrice", ""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "inherit", padding: 0 }}>✕</button>
                </span>
              )}

              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  style={{
                    background: "transparent",
                    border: "1px dashed var(--primary-color, #ea580c)",
                    color: "var(--primary-color, #ea580c)",
                    borderRadius: "16px",
                    padding: "4px 10px",
                    fontSize: "12px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "var(--primary-color, #ea580c)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--primary-color, #ea580c)"; }}
                >
                  ✕ Xóa tất cả
                </button>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <label htmlFor="limit-select" style={{ fontSize: "13px", color: "var(--text-secondary, #64748b)" }}>
                  Hiển thị:
                </label>
                <select
                  id="limit-select"
                  aria-label="Số sản phẩm mỗi trang"
                  className="shopee-form-select"
                  style={{ width: "auto", minWidth: "75px", padding: "6px 10px" }}
                  value={filters.limit}
                  onChange={(event) => updateFilter("limit", event.target.value)}
                >
                  <option value="8">8</option>
                  <option value="12">12</option>
                  <option value="16">16</option>
                  <option value="24">24</option>
                </select>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <label htmlFor="sort-select" style={{ fontSize: "13px", color: "var(--text-secondary, #64748b)" }}>
                  {t('sort_by', 'Sắp xếp theo')}:
                </label>
                <select
                  id="sort-select"
                  aria-label="Sắp xếp sản phẩm"
                  className="shopee-form-select"
                  style={{ width: "auto", minWidth: "170px" }}
                  value={filters.sort}
                  onChange={(event) => updateFilter("sort", event.target.value)}
                >
                  <option value="">{t('sort_featured', 'Nổi bật nhất')}</option>
                  <option value="sold_desc">{t('sort_best_seller', 'Bán chạy hàng đầu')}</option>
                  <option value="rating_desc">{t('sort_rating', 'Đánh giá cao nhất')}</option>
                  <option value="price_asc">{t('sort_price_asc', 'Giá: Thấp đến Cao')}</option>
                  <option value="price_desc">{t('sort_price_desc', 'Giá: Cao đến Thấp')}</option>
                </select>
              </div>
            </div>
          </div>

          {error && <p className="shopee-feedback shopee-feedback-error">{error}</p>}

          {!error ? (
            <>
              <ProductGrid
                products={products}
                loading={loading}
                onAddToCart={addToCart}
                onViewDetail={viewProductDetail}
                onQuickView={(p) => setQuickViewProduct(p)}
                onResetFilter={resetFilters}
                emptyTitle={t('no_products_found', 'Không tìm thấy sản phẩm phù hợp')}
                emptyDescription={t('no_products_desc', 'Hãy thử điều chỉnh lại bộ lọc hoặc tìm kiếm với từ khóa khác.')}
                formatCurrency={formatCurrency}
              />

              {!loading && pagination && pagination.totalPages > 1 ? (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "16px",
                    marginTop: "32px",
                    padding: "16px 20px",
                    background: "var(--bg-card, #fff)",
                    borderRadius: "10px",
                    border: "1px solid var(--border-medium, #e2e8f0)",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                  }}
                >
                  <div style={{ fontSize: "14px", color: "var(--text-secondary, #64748b)" }}>
                    Hiển thị <strong>{Math.min((pagination.page - 1) * pagination.limit + 1, pagination.total)}</strong> - <strong>{Math.min(pagination.page * pagination.limit, pagination.total)}</strong> trên <strong>{pagination.total}</strong> sản phẩm
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <button
                      type="button"
                      disabled={pagination.page <= 1}
                      onClick={() => handlePageChange(pagination.page - 1)}
                      style={{
                        padding: "8px 14px",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: "1px solid var(--border-medium, #cbd5e1)",
                        borderRadius: "6px",
                        background: pagination.page <= 1 ? "var(--bg-disabled, #f1f5f9)" : "#fff",
                        color: pagination.page <= 1 ? "var(--text-disabled, #94a3b8)" : "var(--text-primary, #0f172a)",
                        cursor: pagination.page <= 1 ? "not-allowed" : "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      « Trước
                    </button>

                    {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => {
                      const isActive = p === pagination.page;
                      return (
                        <button
                          key={p}
                          type="button"
                          onClick={() => handlePageChange(p)}
                          style={{
                            minWidth: "36px",
                            height: "36px",
                            padding: "0 10px",
                            fontSize: "13px",
                            fontWeight: isActive ? 700 : 500,
                            border: isActive ? "1px solid var(--primary-color, #ea580c)" : "1px solid var(--border-medium, #cbd5e1)",
                            borderRadius: "6px",
                            background: isActive ? "var(--primary-color, #ea580c)" : "#fff",
                            color: isActive ? "#fff" : "var(--text-primary, #0f172a)",
                            cursor: "pointer",
                            transition: "all 0.15s ease",
                          }}
                        >
                          {p}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      disabled={pagination.page >= pagination.totalPages}
                      onClick={() => handlePageChange(pagination.page + 1)}
                      style={{
                        padding: "8px 14px",
                        fontSize: "13px",
                        fontWeight: 600,
                        border: "1px solid var(--border-medium, #cbd5e1)",
                        borderRadius: "6px",
                        background: pagination.page >= pagination.totalPages ? "var(--bg-disabled, #f1f5f9)" : "#fff",
                        color: pagination.page >= pagination.totalPages ? "var(--text-disabled, #94a3b8)" : "var(--text-primary, #0f172a)",
                        cursor: pagination.page >= pagination.totalPages ? "not-allowed" : "pointer",
                        transition: "all 0.15s ease",
                      }}
                    >
                      Sau »
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <EmptyState
              title={t('cannot_load_products', 'Không thể tải sản phẩm')}
              description={error}
              actionText={t('try_again', 'Thử lại')}
              onAction={() => window.location.reload()}
            />
          )}
        </section>
      </div>

      {/* 4. Recently Viewed Products Section */}
      <RecentlyViewed onProductClick={viewProductDetail} />

      {/* 5. Quick View Modal */}
      <QuickViewModal
        product={quickViewProduct}
        isOpen={Boolean(quickViewProduct)}
        onClose={() => setQuickViewProduct(null)}
        onAddToCart={addToCart}
        onViewDetail={viewProductDetail}
      />
    </main>
  );
}
