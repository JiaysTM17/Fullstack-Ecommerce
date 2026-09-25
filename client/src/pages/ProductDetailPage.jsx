import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { useCompare } from "../context/CompareContext";
import { RecentlyViewed, saveRecentlyViewed } from "../components/RecentlyViewed";
import { addProductReview, getProductById, getProducts } from "../services/productService";
import { formatCurrency } from "../utils/formatCurrency";
import "../styles/amazon-pdp.css";

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const { addToCompare, isCompared } = useCompare();

  const [product, setProduct] = useState(null);
  const [activeImage, setActiveImage] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);

  // New review form state
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewAuthor, setReviewAuthor] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function loadData() {
      try {
        setLoading(true);
        setError("");
        const result = await getProductById(id);

        if (!ignore && result) {
          setProduct(result);
          saveRecentlyViewed(result._id || result.id || id);
          setActiveImage(result.image || result.images?.[0] || "");
          if (result.variants?.colors?.length > 0) {
            setSelectedColor(result.variants.colors[0]);
          }
          if (result.variants?.sizes?.length > 0) {
            setSelectedSize(result.variants.sizes[0]);
          }

          // Load related products from same category
          const related = await getProducts({ category: result.category });
          if (!ignore) {
            setRelatedProducts(
              (related.products || []).filter((p) => (p._id || p.id) !== (result._id || result.id)).slice(0, 4)
            );
          }
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Không thể tải chi tiết sản phẩm");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    }

    loadData();

    return () => {
      ignore = true;
    };
  }, [id]);

  function updateQuantity(nextQuantity) {
    const stock = Number(product?.stock) || 0;
    const safeQuantity = Math.max(1, Number(nextQuantity) || 1);
    setQuantity(stock > 0 ? Math.min(safeQuantity, stock) : safeQuantity);
  }

  function handleAddToCart() {
    addToCart(
      {
        ...product,
        selectedColor,
        selectedSize,
      },
      quantity
    );
    showToast(t('add_to_cart_success', 'Đã thêm sản phẩm vào giỏ hàng!'), 'success');
  }

  function handleBuyNow() {
    addToCart(
      {
        ...product,
        selectedColor,
        selectedSize,
      },
      quantity
    );
    navigate("/checkout");
  }

  function handleReviewSubmit(e) {
    e.preventDefault();
    if (!reviewAuthor || !reviewContent) return;

    const newRev = addProductReview(product._id || product.id, {
      author: reviewAuthor,
      rating: Number(reviewRating),
      title: reviewTitle || "Nhận xét của khách hàng",
      content: reviewContent,
    });

    setProduct((prev) => ({
      ...prev,
      reviews: [newRev, ...(prev.reviews || [])],
      reviewCount: (prev.reviewCount || 0) + 1,
    }));

    setReviewSuccess(true);
    showToast(t('review_submit_success', 'Cảm ơn bạn đã gửi đánh giá!'), 'success');
    setReviewAuthor("");
    setReviewTitle("");
    setReviewContent("");
    setTimeout(() => {
      setReviewSuccess(false);
      setShowReviewForm(false);
    }, 2000);
  }

  if (loading) {
    return (
      <main className="shopee-container" style={{ padding: "40px 0", textAlign: "center" }}>
        <p style={{ fontSize: "16px", color: "#666" }}>Đang tải dữ liệu sản phẩm chuẩn Amazon...</p>
      </main>
    );
  }

  if (error || !product) {
    return (
      <main className="shopee-container shopee-empty-state" style={{ padding: "40px 0" }}>
        <h1>Không tìm thấy sản phẩm</h1>
        <p>{error || "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh."}</p>
        <Link className="shopee-btn shopee-btn-primary" to="/">
          Về trang chủ
        </Link>
      </main>
    );
  }

  const productId = product._id || product.id;
  const wishlisted = isWishlisted(productId);
  const imagesList = product.images && product.images.length > 0 ? product.images : [product.image];
  const hasDiscount = product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const reviewsList = product.reviews || [];

  return (
    <main className="shopee-container" style={{ padding: "20px 0" }}>
      {/* Breadcrumb Navigation */}
      <nav style={{ fontSize: "13px", color: "#777", marginBottom: "16px" }}>
        <Link to="/" style={{ color: "#007185", textDecoration: "none" }}>Trang chủ</Link>
        {" > "}
        <span style={{ color: "#007185" }}>{product.category || "Danh mục"}</span>
        {" > "}
        <span style={{ color: "#333", fontWeight: 600 }}>{product.name}</span>
      </nav>

      {/* Main 3-Column PDP Container */}
      <div className="amazon-pdp-container">
        {/* Column 1: Gallery & Images */}
        <div className="amazon-gallery-col">
          <div className="amazon-main-image-wrap">
            <img src={activeImage} alt={product.name} className="amazon-main-image" />
            {product.badge && (
              <span className={`amazon-badge-corner ${product.badge === "Hot Deal" ? "hot" : ""}`}>
                {product.badge}
              </span>
            )}
          </div>

          {imagesList.length > 1 && (
            <div className="amazon-thumbnails-strip">
              {imagesList.map((img, idx) => (
                <div
                  key={idx}
                  className={`amazon-thumbnail ${activeImage === img ? "active" : ""}`}
                  onClick={() => setActiveImage(img)}
                >
                  <img src={img} alt={`Góc nhìn ${idx + 1}`} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Column 2: Product Specifications & Variant Picker */}
        <div className="amazon-info-col">
          <div>
            <span className="amazon-product-brand">Thương hiệu: {product.brand || "Chính hãng"}</span>
            <h1 className="amazon-product-title">{product.name}</h1>
          </div>

          <div className="amazon-ratings-summary">
            <span className="amazon-stars">★★★★★</span>
            <span style={{ fontWeight: 700, color: "#111" }}>{product.rating || 5.0}</span>
            <span>·</span>
            <span className="amazon-ratings-count">
              {product.reviewCount || reviewsList.length || 50} đánh giá từ khách hàng
            </span>
            <span>·</span>
            <span style={{ color: "#555" }}>Đã bán {product.sold || 100}+</span>
          </div>

          <div className="amazon-price-row">
            <span className="amazon-current-price">{formatCurrency(product.price)}</span>
            {hasDiscount && (
              <>
                <span className="amazon-original-price">{formatCurrency(product.originalPrice)}</span>
                <span className="amazon-discount-percent">Tiết kiệm {discountPercent}%</span>
              </>
            )}
          </div>

          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#333", margin: 0 }}>
            {product.description}
          </p>

          {/* Color Selection */}
          {product.variants?.colors && product.variants.colors.length > 0 && (
            <div className="amazon-variant-block">
              <div className="amazon-variant-label">
                Màu sắc: <strong>{selectedColor}</strong>
              </div>
              <div className="amazon-variant-chips">
                {product.variants.colors.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`amazon-chip ${selectedColor === c ? "active" : ""}`}
                    onClick={() => setSelectedColor(c)}
                  >
                    {c}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          {product.variants?.sizes && product.variants.sizes.length > 0 && (
            <div className="amazon-variant-block">
              <div className="amazon-variant-label">
                Kích thước / Cấu hình: <strong>{selectedSize}</strong>
              </div>
              <div className="amazon-variant-chips">
                {product.variants.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    className={`amazon-chip ${selectedSize === s ? "active" : ""}`}
                    onClick={() => setSelectedSize(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Specifications Table */}
          {product.specifications && product.specifications.length > 0 && (
            <div style={{ marginTop: "12px" }}>
              <div style={{ fontSize: "14px", fontWeight: 700, color: "#111", marginBottom: "6px" }}>
                Thông Số Kỹ Thuật Chi Tiết
              </div>
              <table className="amazon-specs-table">
                <tbody>
                  {product.specifications.map((spec, idx) => (
                    <tr key={idx}>
                      <td>{spec.label}</td>
                      <td>{spec.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Column 3: Amazon Buy Box */}
        <aside className="amazon-buy-box">
          <div className="amazon-buy-box-price">{formatCurrency(product.price)}</div>

          <div className={`amazon-stock-status ${product.stock <= 5 ? "low" : ""}`}>
            {product.stock > 0
              ? product.stock <= 5
                ? `⚡ Chỉ còn ${product.stock} sản phẩm trong kho - Đặt ngay!`
                : "✓ Còn hàng trong kho"
              : "✕ Tạm thời hết hàng"}
          </div>

          <div className="amazon-delivery-info">
            <div style={{ fontWeight: 700, color: "#007185", marginBottom: "4px" }}>
              🚀 Vận chuyển tiêu chuẩn & Siêu tốc
            </div>
            <div>Giao hàng tới bạn vào <strong>Ngày mai</strong>. Miễn phí vận chuyển khi dùng mã FREESHIP.</div>
          </div>

          {/* Quantity selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "13px", fontWeight: 600 }}>Số lượng:</span>
            <div className="shopee-qty-control shopee-qty-sm">
              <button
                className="shopee-qty-btn"
                disabled={quantity <= 1}
                type="button"
                onClick={() => updateQuantity(quantity - 1)}
              >
                -
              </button>
              <input
                className="shopee-qty-input"
                type="number"
                value={quantity}
                onChange={(e) => updateQuantity(e.target.value)}
              />
              <button
                className="shopee-qty-btn"
                disabled={quantity >= product.stock}
                type="button"
                onClick={() => updateQuantity(quantity + 1)}
              >
                +
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="amazon-buy-box-actions">
            <button
              type="button"
              className="amazon-btn-add-cart"
              onClick={handleAddToCart}
            >
              🛒 Thêm Vào Giỏ Hàng
            </button>
            <button
              type="button"
              className="amazon-btn-buy-now"
              onClick={handleBuyNow}
            >
              ⚡ Mua Ngay
            </button>
            <button
              type="button"
              className="amazon-btn-wishlist"
              onClick={() => toggleWishlist(productId)}
            >
              {wishlisted ? "❤️ Đã lưu vào Yêu thích" : "🤍 Thêm vào Yêu thích"}
            </button>
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              style={{ width: "100%", marginTop: "8px", fontWeight: 700, fontSize: "13px" }}
              onClick={() => addToCompare(product)}
            >
              {isCompared(productId) ? "⚖️ Đã thêm vào so sánh" : "⚖️ So sánh với sản phẩm khác"}
            </button>
          </div>

          {/* Guarantees */}
          <div className="amazon-guarantees">
            <div>🛡️ <strong>Chính hãng 100%:</strong> Bồi thường gấp đôi nếu phát hiện hàng giả.</div>
            <div>🔄 <strong>Đổi trả 30 ngày:</strong> Miễn phí hoàn hàng tận nơi.</div>
            <div>🔒 <strong>Thanh toán bảo mật:</strong> Mã hóa SSL chuẩn quốc tế.</div>
          </div>
        </aside>
      </div>

      {/* Shop Profile Card */}
      <section className="amazon-shop-card">
        <div className="amazon-shop-left">
          <div className="amazon-shop-avatar">
            {(product.shopName || "S")[0]}
          </div>
          <div>
            <div className="amazon-shop-name">{product.shopName || "Thời Trang GenZ"}</div>
            <div style={{ fontSize: "12px", color: "var(--text-muted, #666)" }}>Đang hoạt động online · Phản hồi trong 10 phút</div>
          </div>
        </div>

        <div className="amazon-shop-stats">
          <div>Đánh giá: <strong>{product.shopRating || "4.9"} / 5.0</strong></div>
          <div>Tỷ lệ phản hồi: <strong>{product.shopResponseRate || "98"}%</strong></div>
          <div>Người theo dõi: <strong>12.4k</strong></div>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            className="shopee-btn shopee-btn-secondary"
            onClick={() => {
              window.dispatchEvent(
                new CustomEvent('open_live_chat', {
                  detail: {
                    shopName: product.shopName || "Thời Trang GenZ Official",
                    shopId: product.shopId || "shop_01",
                  },
                })
              );
            }}
          >
            💬 Chat Ngay
          </button>
          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            onClick={() => navigate(`/shop/${product.shopId || "shop_01"}`)}
          >
            🏪 Xem Gian Hàng
          </button>
        </div>
      </section>

      {/* Customer Reviews & Ratings Section */}
      <section className="amazon-reviews-section">
        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "20px" }}>
          Đánh Giá Từ Khách Hàng Đã Mua
        </h2>

        <div className="amazon-reviews-grid">
          {/* Breakdown column */}
          <div>
            <div style={{ display: "flex", alignItems: "baseline", gap: "8px", marginBottom: "12px" }}>
              <span style={{ fontSize: "36px", fontWeight: 800, color: "#111" }}>
                {product.rating || 4.9}
              </span>
              <span style={{ fontSize: "18px", color: "#ffa41c" }}>★★★★★</span>
              <span style={{ fontSize: "13px", color: "#777" }}>trên 5 sao</span>
            </div>

            <div className="amazon-breakdown-bar-row">
              <span>5 sao</span>
              <div className="amazon-breakdown-bar-bg">
                <div className="amazon-breakdown-bar-fill" style={{ width: "82%" }} />
              </div>
              <span>82%</span>
            </div>
            <div className="amazon-breakdown-bar-row">
              <span>4 sao</span>
              <div className="amazon-breakdown-bar-bg">
                <div className="amazon-breakdown-bar-fill" style={{ width: "12%" }} />
              </div>
              <span>12%</span>
            </div>
            <div className="amazon-breakdown-bar-row">
              <span>3 sao</span>
              <div className="amazon-breakdown-bar-bg">
                <div className="amazon-breakdown-bar-fill" style={{ width: "4%" }} />
              </div>
              <span>4%</span>
            </div>
            <div className="amazon-breakdown-bar-row">
              <span>2 sao</span>
              <div className="amazon-breakdown-bar-bg">
                <div className="amazon-breakdown-bar-fill" style={{ width: "1%" }} />
              </div>
              <span>1%</span>
            </div>
            <div className="amazon-breakdown-bar-row">
              <span>1 sao</span>
              <div className="amazon-breakdown-bar-bg">
                <div className="amazon-breakdown-bar-fill" style={{ width: "1%" }} />
              </div>
              <span>1%</span>
            </div>

            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              style={{ width: "100%", marginTop: "18px", fontSize: "13px" }}
              onClick={() => setShowReviewForm((prev) => !prev)}
            >
              ✍️ Viết Đánh Giá Của Bạn
            </button>
          </div>

          {/* Reviews list column */}
          <div>
            {/* Write review form toggle */}
            {showReviewForm && (
              <form onSubmit={handleReviewSubmit} className="amazon-write-review-box">
                <h3 style={{ fontSize: "16px", fontWeight: 700, margin: "0 0 12px" }}>
                  Đánh Giá Sản Phẩm Này
                </h3>

                {reviewSuccess && (
                  <div style={{ background: "#e8f5e9", color: "#2e7d32", padding: "10px", borderRadius: "6px", marginBottom: "12px", fontSize: "13px" }}>
                    ✓ Cảm ơn bạn! Đánh giá đã được đăng thành công.
                  </div>
                )}

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Họ và tên của bạn:
                  </label>
                  <input
                    type="text"
                    required
                    className="shopee-form-input"
                    value={reviewAuthor}
                    onChange={(e) => setReviewAuthor(e.target.value)}
                    placeholder="Ví dụ: Nguyễn Văn A"
                  />
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Số sao đánh giá:
                  </label>
                  <select
                    className="shopee-form-select"
                    value={reviewRating}
                    onChange={(e) => setReviewRating(e.target.value)}
                  >
                    <option value="5">★★★★★ (5 sao - Tuyệt vời)</option>
                    <option value="4">★★★★☆ (4 sao - Hài lòng)</option>
                    <option value="3">★★★☆☆ (3 sao - Bình thường)</option>
                    <option value="2">★★☆☆☆ (2 sao - Không hài lòng)</option>
                    <option value="1">★☆☆☆☆ (1 sao - Rất tệ)</option>
                  </select>
                </div>

                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Tiêu đề nhận xét:
                  </label>
                  <input
                    type="text"
                    className="shopee-form-input"
                    value={reviewTitle}
                    onChange={(e) => setReviewTitle(e.target.value)}
                    placeholder="Tóm tắt ngắn gọn cảm nhận của bạn"
                  />
                </div>

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Nội dung chi tiết:
                  </label>
                  <textarea
                    required
                    rows="3"
                    className="shopee-form-input"
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    placeholder="Chất lượng sản phẩm, đóng gói, thời gian giao hàng thế nào?"
                  />
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button type="submit" className="shopee-btn shopee-btn-primary">
                    Gửi Đánh Giá Ngay
                  </button>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    onClick={() => setShowReviewForm(false)}
                  >
                    Hủy
                  </button>
                </div>
              </form>
            )}

            {/* List */}
            {reviewsList.length > 0 ? (
              reviewsList.map((rev) => (
                <div key={rev.id} className="amazon-review-item">
                  <div className="amazon-review-header">
                    <img
                      src={rev.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"}
                      alt={rev.author}
                      className="amazon-review-avatar"
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13.5px" }}>{rev.author}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>Đánh giá ngày {rev.date}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ color: "#ffa41c", fontSize: "14px" }}>
                      {"★".repeat(rev.rating)}
                      {"☆".repeat(5 - rev.rating)}
                    </span>
                    <span className="amazon-review-title">{rev.title}</span>
                  </div>

                  {rev.verifiedPurchase && (
                    <div className="amazon-review-verified">
                      ✓ Đã chứng nhận mua hàng tại Mini Shopee
                    </div>
                  )}

                  <p className="amazon-review-body">{rev.content}</p>
                </div>
              ))
            ) : (
              <div style={{ color: "#777", fontSize: "14px", padding: "16px 0" }}>
                Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Frequently Bought Together / Related Products */}
      {relatedProducts.length > 0 && (
        <section style={{ marginTop: "32px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "16px" }}>
            Khách Hàng Cũng Mua Cùng Sản Phẩm Này
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
              gap: "16px",
            }}
          >
            {relatedProducts.map((p) => (
              <div
                key={p._id || p.id}
                style={{
                  background: "#fff",
                  borderRadius: "8px",
                  padding: "12px",
                  border: "1px solid #e0e0e0",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/products/${p._id || p.id}`)}
              >
                <img
                  src={p.image || p.images?.[0]}
                  alt={p.name}
                  style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "6px", marginBottom: "8px" }}
                />
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#111", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "4px" }}>
                  {p.name}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "#ee4d2d" }}>
                  {formatCurrency(p.price)}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recently Viewed Products */}
      <RecentlyViewed
        currentProductId={id}
        onProductClick={(p) => navigate(`/products/${p._id || p.id}`)}
      />
    </main>
  );
}
