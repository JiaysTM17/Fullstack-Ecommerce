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

    setSearchParams(nextParams);
  }

  function resetFilters() {
    setSearchParams(new URLSearchParams());
  }

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
              borderRadius: "8px",
              padding: "14px 18px",
              marginBottom: "16px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "12px",
              border: "1px solid var(--border-medium, #e0e0e0)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary, #111)" }}>
                {t('results_found', 'Tìm thấy')} <strong>{products.length}</strong> {t('products_count', 'sản phẩm')}
              </span>
              {filters.keyword && (
                <span className="shopee-filter-chip">{t('keyword', 'Từ khóa')}: "{filters.keyword}"</span>
              )}
              {filters.category && (
                <span className="shopee-filter-chip">{t('category', 'Danh mục')}: {filters.category}</span>
              )}
              {filters.badge && (
                <span className="shopee-filter-chip">{filters.badge === "Amazon's Choice" ? t('nav_featured_picks', 'Tuyển chọn') : filters.badge}</span>
              )}
              {filters.fastDelivery && (
                <span className="shopee-filter-chip" style={{ background: "var(--primary-light, #e3f2fd)", color: "var(--secondary-color, #1976d2)" }}>
                  ⚡ {t('nav_fast_delivery', 'Giao siêu tốc 2H')}
                </span>
              )}
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <label htmlFor="sort-select" style={{ fontSize: "13px", color: "var(--text-secondary, #666)" }}>
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

              {!loading && pagination ? (
                <p className="shopee-pagination-summary">
                  {t('page', 'Trang')} {pagination.page || 1}/{pagination.totalPages || 1}
                </p>
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
