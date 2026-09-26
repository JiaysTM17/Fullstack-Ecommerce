import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { useCompare } from "../context/CompareContext";
import { RecentlyViewed, saveRecentlyViewed } from "../components/RecentlyViewed";
import ShopChatModal from "../components/ShopChatModal";
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
  const [hoverStar, setHoverStar] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showShopChat, setShowShopChat] = useState(false);
  const [selectedStarFilter, setSelectedStarFilter] = useState("all");

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast("Đã sao chép liên kết sản phẩm vào bộ nhớ tạm!", "success");
    }
  };

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
        <p style={{ fontSize: "16px", color: "var(--text-secondary, #666)" }}>{t('pdp_loading', 'Đang tải thông tin chi tiết sản phẩm...')}</p>
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
  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === "all") return reviewsList;
    return reviewsList.filter((r) => Number(r.rating) === Number(selectedStarFilter));
  }, [reviewsList, selectedStarFilter]);

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

          {product.stock > 0 && product.stock <= 30 && (
            <div style={{ margin: "10px 0", padding: "10px 12px", background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "var(--primary-color, #ea580c)", marginBottom: "6px" }}>
                <span>🔥 Sắp hết hàng</span>
                <span>Chỉ còn {product.stock} sản phẩm</span>
              </div>
              <div style={{ height: "6px", background: "#fed7aa", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, Math.max(12, (product.stock / 30) * 100))}%`, height: "100%", background: "var(--primary-color, #ea580c)", borderRadius: "3px" }} />
              </div>
            </div>
          )}

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
                min="1"
                max={product?.stock || 99}
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
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{ fontWeight: 700, fontSize: "12px", padding: "8px 6px" }}
                onClick={handleCopyLink}
              >
                📋 Sao Chép Link
              </button>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{ fontWeight: 700, fontSize: "12px", padding: "8px 6px" }}
                onClick={() => setShowShareModal(true)}
              >
                🔗 Chia Sẻ & QR
              </button>
            </div>
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
            onClick={() => setShowShopChat(true)}
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

                <div style={{ marginBottom: "14px" }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>
                    Số sao đánh giá:
                  </label>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        style={{
                          fontSize: "30px",
                          cursor: "pointer",
                          color: (hoverStar || reviewRating) >= star ? "#ffa41c" : "var(--border-medium, #cbd5e1)",
                          transition: "transform 0.15s ease",
                          transform: (hoverStar || reviewRating) >= star ? "scale(1.1)" : "scale(1)",
                        }}
                        onMouseEnter={() => setHoverStar(star)}
                        onMouseLeave={() => setHoverStar(0)}
                        onClick={() => setReviewRating(star)}
                        title={`${star} sao`}
                      >
                        ★
                      </span>
                    ))}
                    <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--primary-color, #ea580c)", marginLeft: "10px" }}>
                      {reviewRating === 5 ? "Tuyệt vời (5 sao)" : reviewRating === 4 ? "Hài lòng (4 sao)" : reviewRating === 3 ? "Bình thường (3 sao)" : reviewRating === 2 ? "Không hài lòng (2 sao)" : "Rất tệ (1 sao)"}
                    </span>
                  </div>
                </div>

                {/* Quick Feedback Chips */}
                <div style={{ marginBottom: "12px" }}>
                  <label style={{ display: "block", fontSize: "12px", color: "var(--text-muted)", marginBottom: "6px" }}>
                    Nhấp để thêm nhanh cảm nhận:
                  </label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                    {["📦 Giao hàng siêu nhanh", "✨ Đúng như mô tả", "💎 Chất lượng tuyệt vời", "👍 Đóng gói rất kỹ", "💯 Sẽ ủng hộ tiếp"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => setReviewContent((prev) => (prev ? `${prev} - ${chip}` : chip))}
                        style={{
                          background: "var(--bg-muted, #f8fafc)",
                          border: "1px solid var(--border-medium, #cbd5e1)",
                          borderRadius: "14px",
                          padding: "3px 10px",
                          fontSize: "12px",
                          cursor: "pointer",
                          color: "var(--text-primary)",
                        }}
                      >
                        + {chip}
                      </button>
                    ))}
                  </div>
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

            {/* Star Rating Filter Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px", padding: "12px", background: "var(--bg-muted, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-medium, #e2e8f0)" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Lọc đánh giá:</span>
              {[
                { id: "all", label: `Tất cả (${reviewsList.length})` },
                { id: "5", label: `5 Sao (${reviewsList.filter(r => r.rating === 5).length})` },
                { id: "4", label: `4 Sao (${reviewsList.filter(r => r.rating === 4).length})` },
                { id: "3", label: `3 Sao (${reviewsList.filter(r => r.rating === 3).length})` },
                { id: "2", label: `2 Sao (${reviewsList.filter(r => r.rating === 2).length})` },
                { id: "1", label: `1 Sao (${reviewsList.filter(r => r.rating === 1).length})` },
              ].map((tab) => {
                const isActive = selectedStarFilter === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedStarFilter(tab.id)}
                    style={{
                      padding: "5px 12px",
                      fontSize: "12.5px",
                      fontWeight: isActive ? 700 : 500,
                      borderRadius: "16px",
                      border: isActive ? "1px solid var(--primary-color, #ea580c)" : "1px solid var(--border-medium, #cbd5e1)",
                      background: isActive ? "var(--primary-color, #ea580c)" : "#fff",
                      color: isActive ? "#fff" : "var(--text-primary, #0f172a)",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* List */}
            {filteredReviews.length > 0 ? (
              filteredReviews.map((rev) => (
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
                      ✓ Đã chứng nhận mua hàng chính hãng tại Fullstack E-Commerce
                    </div>
                  )}

                  <p className="amazon-review-body">{rev.content}</p>
                </div>
              ))
            ) : (
              <div style={{ color: "#777", fontSize: "14px", padding: "16px 0" }}>
                {selectedStarFilter === "all" 
                  ? "Chưa có đánh giá nào cho sản phẩm này. Hãy là người đầu tiên trải nghiệm và chia sẻ cảm nhận!"
                  : `Không có đánh giá nào ${selectedStarFilter} sao.`}
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
                  background: "var(--bg-card, #fff)",
                  borderRadius: "8px",
                  padding: "12px",
                  border: "1px solid var(--border-medium, #e0e0e0)",
                  cursor: "pointer",
                }}
                onClick={() => navigate(`/products/${p._id || p.id}`)}
              >
                <img
                  src={p.image || p.images?.[0]}
                  alt={p.name}
                  style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: "6px", marginBottom: "8px" }}
                />
                <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary, #111)", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", marginBottom: "4px" }}>
                  {p.name}
                </div>
                <div style={{ fontSize: "15px", fontWeight: 800, color: "var(--primary-color, #ea580c)" }}>
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

      {/* Share Product & QR Code Modal */}
      {showShareModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowShareModal(false)}
        >
          <div
            style={{
              background: 'var(--bg-card, #ffffff)',
              borderRadius: '16px',
              maxWidth: '460px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
              border: '1px solid var(--border-medium, #e2e8f0)',
              textAlign: 'center',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                🔗 Chia Sẻ Sản Phẩm
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--text-primary)' }}
              >
                ✕
              </button>
            </div>

            {/* QR Code */}
            <div style={{ background: 'var(--bg-muted, #f8fafc)', padding: '16px', borderRadius: '12px', border: '1px solid var(--border-light, #e2e8f0)', marginBottom: '16px' }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(window.location.href)}`}
                alt="QR Code chia sẻ"
                style={{ width: '160px', height: '160px', borderRadius: '8px', margin: '0 auto', display: 'block' }}
              />
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '8px 0 0' }}>
                Quét mã QR bằng Camera điện thoại hoặc Zalo để mở sản phẩm
              </p>
            </div>

            {/* Direct Link Input */}
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                readOnly
                value={window.location.href}
                className="shopee-form-input"
                style={{ fontSize: '12px', background: 'var(--bg-page, #f8fafc)', color: 'var(--text-muted)' }}
              />
              <button
                type="button"
                className="shopee-btn shopee-btn-primary"
                style={{ fontSize: '13px', padding: '8px 14px', whiteSpace: 'nowrap', fontWeight: 700 }}
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast('Đã sao chép liên kết sản phẩm vào bộ nhớ tạm!', 'success');
                }}
              >
                📋 Sao chép
              </button>
            </div>

            {/* Quick Share Chips */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
              <button
                type="button"
                onClick={() => {
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`, '_blank');
                }}
                className="shopee-btn shopee-btn-secondary"
                style={{ fontSize: '12px', borderRadius: '20px' }}
              >
                Facebook
              </button>
              <button
                type="button"
                onClick={() => {
                  window.open(`https://t.me/share/url?url=${encodeURIComponent(window.location.href)}&text=${encodeURIComponent(product.name)}`, '_blank');
                }}
                className="shopee-btn shopee-btn-secondary"
                style={{ fontSize: '12px', borderRadius: '20px' }}
              >
                Telegram
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Shop Seller Chat Modal */}
      {showShopChat && (
        <ShopChatModal
          shop={{
            name: product.shopName || "Thời Trang GenZ Official",
            logo: product.shopLogo || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=80",
          }}
          currentProduct={product}
          onClose={() => setShowShopChat(false)}
        />
      )}
    </main>
  );
}
