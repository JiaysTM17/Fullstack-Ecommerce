import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { EmptyState, ProductGrid } from "../components";
import { useCart } from "../context/CartContext";
import { getProducts } from "../services/productService";
import { formatCurrency } from "../utils/formatCurrency";

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [products, setProducts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const filters = useMemo(
    () => ({
      keyword: searchParams.get("keyword") || "",
      category: searchParams.get("category") || "",
      sort: searchParams.get("sort") || "",
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
          setError(err.message || "Khong the tai danh sach san pham");
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
    <main className="shopee-container">
      <section className="shopee-page-header">
        <div>
          <h1>Mini Shopee</h1>
          <p>Duyet san pham, them vao gio va dat hang COD nhanh chong.</p>
        </div>
      </section>

      <section className="shopee-filter-bar" aria-label="Bo loc san pham">
        {filters.keyword ? (
          <span className="shopee-filter-chip">Tu khoa: {filters.keyword}</span>
        ) : null}
        <select
          aria-label="Sap xep san pham"
          className="shopee-form-select"
          value={filters.sort}
          onChange={(event) => updateFilter("sort", event.target.value)}
        >
          <option value="">Mac dinh</option>
          <option value="price_asc">Gia tang dan</option>
          <option value="price_desc">Gia giam dan</option>
        </select>
        {(filters.keyword || filters.sort || filters.category) ? (
          <button className="shopee-btn shopee-btn-secondary" type="button" onClick={resetFilters}>
            Xoa bo loc
          </button>
        ) : null}
      </section>

      {error && <p className="shopee-feedback shopee-feedback-error">{error}</p>}

      {!error ? (
        <>
          <ProductGrid
            products={products}
            loading={loading}
            onAddToCart={addToCart}
            onViewDetail={viewProductDetail}
            onResetFilter={resetFilters}
            emptyTitle="Chua co san pham"
            emptyDescription="Backend can tra du lieu tu GET /api/products hoac hay thu bo loc khac."
            formatCurrency={formatCurrency}
          />

          {!loading && pagination ? (
            <p className="shopee-pagination-summary">
              Trang {pagination.page || 1}/{pagination.totalPages || 1}
            </p>
          ) : null}
        </>
      ) : (
        <EmptyState
          title="Khong the tai san pham"
          description={error}
          actionText="Thu lai"
          onAction={() => window.location.reload()}
        />
      )}
    </main>
  );
}
