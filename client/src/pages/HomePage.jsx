import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { getProducts } from "../services/productService";
import { formatCurrency } from "../utils/formatCurrency";

function getDiscountPercent(product) {
  if (!product.originalPrice || product.originalPrice <= product.price) {
    return null;
  }

  return Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);
}

export default function HomePage() {
  const [searchParams, setSearchParams] = useSearchParams();
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

  return (
    <main className="shopee-container">
      <section className="shopee-page-header">
        <div>
          <h1>Mini Shopee</h1>
          <p>Danh sach san pham tu API backend.</p>
        </div>
      </section>

      <section className="shopee-filter-bar" aria-label="Bo loc san pham">
        <input
          aria-label="Tim san pham"
          className="shopee-form-input"
          placeholder="Tim san pham..."
          type="search"
          value={filters.keyword}
          onChange={(event) => updateFilter("keyword", event.target.value)}
        />
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
      </section>

      {loading && <p className="shopee-feedback">Dang tai san pham...</p>}
      {error && <p className="shopee-feedback shopee-feedback-error">{error}</p>}

      {!loading && !error && products.length === 0 && (
        <section className="shopee-empty-state">
          <h2>Chua co san pham</h2>
          <p>Backend can tra du lieu tu GET /api/products.</p>
        </section>
      )}

      {!loading && !error && products.length > 0 && (
        <>
          <section className="shopee-product-grid">
            {products.map((product) => {
              const productId = product._id || product.id;
              const discountPercent = getDiscountPercent(product);

              return (
                <article className="shopee-product-card" key={productId}>
                  <Link to={`/products/${productId}`} className="shopee-card-image-wrapper">
                    {product.image ? (
                      <img className="shopee-card-image" src={product.image} alt={product.name} />
                    ) : (
                      <div className="shopee-card-image" aria-label="Khong co anh" />
                    )}
                    {discountPercent ? (
                      <span className="shopee-discount-badge">-{discountPercent}%</span>
                    ) : null}
                  </Link>

                  <div className="shopee-card-content">
                    <Link to={`/products/${productId}`} className="shopee-card-title">
                      {product.name}
                    </Link>
                    <div className="shopee-card-price-row">
                      <span className="shopee-card-price">{formatCurrency(product.price)}</span>
                      {product.originalPrice ? (
                        <span className="shopee-card-original-price">
                          {formatCurrency(product.originalPrice)}
                        </span>
                      ) : null}
                    </div>
                    <div className="shopee-card-meta">
                      <span className="shopee-card-rating">★ {product.rating || 0}</span>
                      <span className="shopee-card-sold">Da ban {product.sold || 0}</span>
                    </div>
                    <button
                      className="shopee-card-add-btn"
                      type="button"
                      onClick={() => addToCart(product)}
                    >
                      Them vao gio
                    </button>
                  </div>
                </article>
              );
            })}
          </section>

          {pagination ? (
            <p className="shopee-pagination-summary">
              Trang {pagination.page || 1}/{pagination.totalPages || 1}
            </p>
          ) : null}
        </>
      )}
    </main>
  );
}
