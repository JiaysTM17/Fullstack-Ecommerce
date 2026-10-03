import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { 
  EmptyState, 
  FlashDeals, 
  HeroBanner, 
  ProductFilters, 
  ProductGrid,
  QuickViewModal,
  RecentlyViewed,
  RecentlyViewedSection,
  CategoryShowcase
} from "../components";
import { useCart } from "../context/CartContext";
import { useLanguage } from "../context/LanguageContext";
import { getProducts, getFlashSale, getBestSellers, getNewArrivals } from "../services/productService";
import { formatCurrency } from "../utils/formatCurrency";
import {
  TruckIcon,
  ShoppingBagIcon,
  BoltIcon,
  StarIcon,
  CoinIcon,
  StoreIcon,
  CloseIcon,
} from "../components/OrdersIcons";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { t } = useLanguage();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
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
      limit: searchParams.get("limit") || "16",
    }),
    [searchParams],
  );

  useEffect(() => {
    let ignore = false;

    async function loadProducts() {
      try {
        setLoading(true);
        setError("");
        let result;

        if (activeTab === "best_sellers") {
          const prods = await getBestSellers(16);
          result = { products: prods, pagination: { total: prods.length, page: 1, totalPages: 1 } };
        } else if (activeTab === "new_arrivals") {
          const prods = await getNewArrivals(16);
          result = { products: prods, pagination: { total: prods.length, page: 1, totalPages: 1 } };
        } else if (activeTab === "flash_sale") {
          const prods = await getFlashSale(16);
          result = { products: prods, pagination: { total: prods.length, page: 1, totalPages: 1 } };
        } else {
          result = await getProducts(filters);
        }

        if (!ignore) {
          setProducts(result.products || []);
          setPagination(result.pagination || null);
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

    const handleMarketplaceSync = () => {
      loadProducts();
    };

    window.addEventListener("storage", handleMarketplaceSync);
    window.addEventListener("mini_shopee_inventory_updated", handleMarketplaceSync);

    return () => {
      ignore = true;
      window.removeEventListener("storage", handleMarketplaceSync);
      window.removeEventListener("mini_shopee_inventory_updated", handleMarketplaceSync);
    };
  }, [filters, activeTab]);

  // Tự động cuộn mượt xuống section tương ứng khi truy cập link từ Subnav/Banner
  useEffect(() => {
    const badge = searchParams.get("badge");
    const fastDelivery = searchParams.get("fastDelivery");

    if (badge || fastDelivery) {
      const timer = setTimeout(() => {
        let targetEl = null;
        if (badge === "Hot Deal") {
          targetEl = document.getElementById("flash-deals-section");
        } else {
          targetEl = document.getElementById("catalog-section");
        }

        if (targetEl) {
          const headerWrapper = document.querySelector('.shopee-header-wrapper');
          const headerHeight = headerWrapper ? headerWrapper.offsetHeight : 100;
          const elementPosition = targetEl.getBoundingClientRect().top + window.pageYOffset;
          const offsetPosition = Math.max(0, elementPosition - headerHeight - 16);

          window.scrollTo({
            top: offsetPosition,
            behavior: "smooth"
          });
        }
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [searchParams]);

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

  function updateFiltersBatch(updates) {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(updates).forEach(([key, val]) => {
      if (val !== undefined && val !== null && String(val).trim() !== "") {
        nextParams.set(key, String(val).trim());
      } else {
        nextParams.delete(key);
      }
    });
    nextParams.set("page", "1");
    setSearchParams(nextParams);
  }

  function handleSelectShowcase({ category, keyword }) {
    updateFiltersBatch({
      category: category || "",
      keyword: keyword || "",
      shopId: "",
      minPrice: "",
      maxPrice: "",
      badge: "",
      fastDelivery: "",
      minRating: "",
      page: "1",
    });
    const catalogEl = document.getElementById("catalog-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function handlePageChange(newPage) {
    updateFilter("page", String(newPage));
    const catalogEl = document.getElementById("catalog-section");
    if (catalogEl) {
      catalogEl.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams({ page: "1", limit: filters.limit || "16" }));
  }

  const hasActiveFilters = Boolean(
    filters.keyword ||
    filters.category ||
    filters.brand ||
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

      {/* 2. 2-Tier Categories Showcase (Shopee / Modern E-Commerce Style) */}
      <div id="category-showcase-section">
        <CategoryShowcase
          onSelectShowcase={handleSelectShowcase}
          onSelectCategory={(cat) => handleSelectShowcase({ category: cat, keyword: "" })}
          onSelectKeyword={(kw) => handleSelectShowcase({ category: "", keyword: kw })}
        />
      </div>

      {/* 3. Flash Deals Section */}
      <FlashDeals
        products={products}
        onProductClick={viewProductDetail}
        formatCurrency={formatCurrency}
      />

      {/* 3. Main Catalog Section with Sidebar Filters */}
      <div
        id="catalog-section"
        className="shopee-catalog-layout"
      >
        {/* Left Sidebar Filters */}
        <ProductFilters
          filters={filters}
          onFilterChange={updateFilter}
          onFilterBatch={updateFiltersBatch}
          onResetFilters={resetFilters}
        />

        {/* Right Product Grid Area */}
        <section>
          {/* Freeship Max Banner */}
          <div
            style={{
              background: "linear-gradient(90deg, #10b981 0%, #059669 100%)",
              color: "#fff",
              padding: "12px 18px",
              borderRadius: "10px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: "13px",
              fontWeight: 600,
              boxShadow: "0 2px 8px rgba(16, 185, 129, 0.2)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <TruckIcon size={18} color="#ffffff" />
              <span><strong>FREESHIP MAX:</strong> Miễn phí vận chuyển toàn quốc cho đơn hàng từ <strong>300.000₫</strong></span>
            </div>
            <span style={{ background: "rgba(255,255,255,0.2)", padding: "4px 10px", borderRadius: "12px", fontSize: "12px" }}>
              Tự động áp dụng
            </span>
          </div>

          {/* Discovery Tabs */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "16px", overflowX: "auto", paddingBottom: "4px" }}>
            {[
              { id: "all", label: "Tất cả sản phẩm", icon: <ShoppingBagIcon size={15} color={activeTab === 'all' ? '#ffffff' : '#ea580c'} /> },
              { id: "best_sellers", label: "Bán chạy nhất", icon: <BoltIcon size={15} color={activeTab === 'best_sellers' ? '#ffffff' : '#ea580c'} /> },
              { id: "new_arrivals", label: "Hàng mới về", icon: <StarIcon size={15} color={activeTab === 'new_arrivals' ? '#ffffff' : '#f59e0b'} /> },
              { id: "flash_sale", label: "Ưu đãi Flash Sale", icon: <BoltIcon size={15} color={activeTab === 'flash_sale' ? '#ffffff' : '#ea580c'} /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                style={{
                  padding: "10px 18px",
                  borderRadius: "20px",
                  border: activeTab === tab.id ? "2px solid var(--primary-color, #ea580c)" : "1px solid var(--border-medium, #e2e8f0)",
                  background: activeTab === tab.id ? "var(--primary-color, #ea580c)" : "var(--bg-card, #fff)",
                  color: activeTab === tab.id ? "#fff" : "var(--text-primary, #0f172a)",
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  transition: "all 0.2s ease",
                  whiteSpace: "nowrap",
                }}
              >
                <span>{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

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
                  <button type="button" onClick={() => updateFilter("keyword", "")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "inherit", padding: 0 }}><CloseIcon size={10} color="#ef4444" /></button>
                </span>
              )}
              {filters.category && (
                <span className="shopee-filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {t('category', 'Danh mục')}: {filters.category}
                  <button type="button" onClick={() => updateFilter("category", "")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "inherit", padding: 0 }}><CloseIcon size={10} color="#ef4444" /></button>
                </span>
              )}
              {filters.shopId && (
                <span className="shopee-filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <StoreIcon size={13} color="#ea580c" /> Shop: {filters.shopId}
                  <button type="button" onClick={() => updateFilter("shopId", "")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "inherit", padding: 0 }}><CloseIcon size={10} color="#ef4444" /></button>
                </span>
              )}
              {filters.badge && (
                <span className="shopee-filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  {filters.badge === "Amazon's Choice" ? t('nav_featured_picks', 'Tuyển chọn') : filters.badge}
                  <button type="button" onClick={() => updateFilter("badge", "")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "inherit", padding: 0 }}><CloseIcon size={10} color="#ef4444" /></button>
                </span>
              )}
              {filters.fastDelivery && (
                <span className="shopee-filter-chip" style={{ background: "var(--primary-light, #ffedd5)", color: "var(--primary-color, #ea580c)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <BoltIcon size={13} color="#ea580c" /> {t('nav_fast_delivery', 'Giao siêu tốc 2H')}
                  <button type="button" onClick={() => updateFilter("fastDelivery", "")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "inherit", padding: 0 }}><CloseIcon size={10} color="#ef4444" /></button>
                </span>
              )}
              {filters.minRating && (
                <span className="shopee-filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <StarIcon size={13} color="#f59e0b" /> Từ {filters.minRating} sao
                  <button type="button" onClick={() => updateFilter("minRating", "")} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "inherit", padding: 0 }}><CloseIcon size={10} color="#ef4444" /></button>
                </span>
              )}
              {(filters.minPrice || filters.maxPrice) && (
                <span className="shopee-filter-chip" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <CoinIcon size={13} color="#eab308" /> {filters.minPrice && filters.maxPrice
                    ? `${formatCurrency(Number(filters.minPrice))} - ${formatCurrency(Number(filters.maxPrice))}`
                    : filters.minPrice
                    ? `≥ ${formatCurrency(Number(filters.minPrice))}`
                    : `≤ ${formatCurrency(Number(filters.maxPrice))}`}
                  <button type="button" onClick={() => updateFiltersBatch({ minPrice: "", maxPrice: "" })} style={{ background: "none", border: "none", cursor: "pointer", display: "inline-flex", alignItems: "center", color: "inherit", padding: 0 }}><CloseIcon size={10} color="#ef4444" /></button>
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
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    transition: "all 0.2s ease"
                  }}
                  onMouseOver={(e) => { e.currentTarget.style.background = "var(--primary-color, #ea580c)"; e.currentTarget.style.color = "#fff"; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--primary-color, #ea580c)"; }}
                >
                  <CloseIcon size={11} />
                  <span>Xóa tất cả</span>
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
      <RecentlyViewedSection onProductClick={viewProductDetail} />

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
