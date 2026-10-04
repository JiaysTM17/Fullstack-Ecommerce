import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { useCompare } from "../context/CompareContext";
import { RecentlyViewed, saveRecentlyViewed } from "../components/RecentlyViewed";
import RecentlyViewedSection from "../components/RecentlyViewedSection";
import ProductQASection from "../components/ProductQASection";
import { addRecentlyViewed } from "../services/recentlyViewedService";
import ShopChatModal from "../components/ShopChatModal";
import { addProductReview, getProductById, getProducts, getRelatedProducts, getProductReviewStats } from "../services/productService";
import { addToWishlist as apiAddToWishlist, removeFromWishlist as apiRemoveFromWishlist } from "../services/wishlistService";
import { formatCurrency } from "../utils/formatCurrency";
import {
  ShoppingBagIcon,
  BoltIcon,
  HeartIcon,
  CopyIcon,
  ShieldIcon,
  ChatIcon,
  StoreIcon,
  PencilIcon,
  StarIcon,
  TagIcon,
  CheckIcon,
  CloseIcon,
  FlameIcon,
  TruckIcon,
  MinusIcon,
  PlusIcon,
  GlobeIcon,
  ChevronRightIcon,
  ScaleIcon,
  QrCodeIcon,
} from "../components/OrdersIcons";
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
  const [reviewStats, setReviewStats] = useState(null);

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
  const [isAddedFeedback, setIsAddedFeedback] = useState(false);

  const reviewsList = useMemo(() => (Array.isArray(product?.reviews) ? product.reviews : []), [product?.reviews]);
  const filteredReviews = useMemo(() => {
    if (selectedStarFilter === "all") return reviewsList;
    return reviewsList.filter((r) => Number(r?.rating) === Number(selectedStarFilter));
  }, [reviewsList, selectedStarFilter]);

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
          addRecentlyViewed(result);
          setActiveImage(result.image || result.images?.[0] || "");
          if (result.variants?.colors?.length > 0) {
            setSelectedColor(result.variants.colors[0]);
          }
          if (result.variants?.sizes?.length > 0) {
            setSelectedSize(result.variants.sizes[0]);
          }

          // Load related products from same category
          const related = await getRelatedProducts(result._id || result.id || id, 6);
          if (!ignore) {
            setRelatedProducts(related || []);
          }

          // Load review stats breakdown
          const stats = await getProductReviewStats(result._id || result.id || id);
          if (!ignore && stats) {
            setReviewStats(stats);
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
    setIsAddedFeedback(true);
    setTimeout(() => setIsAddedFeedback(false), 1800);
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
  const imagesList = Array.isArray(product.images) && product.images.length > 0 ? product.images : [product.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&q=80"];
  const hasDiscount = product.originalPrice > product.price;
  const discountPercent = hasDiscount
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  return (
    <main className="shopee-container" style={{ padding: "20px 0" }}>
      {/* Breadcrumb Navigation */}
      <nav style={{ fontSize: "13px", color: "var(--text-secondary, #64748b)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
        <Link to="/" style={{ color: "var(--secondary-color, #0284c7)", textDecoration: "none" }}>Trang chủ</Link>
        <ChevronRightIcon size={11} color="#ea580c" />
        <span style={{ color: "var(--secondary-color, #0284c7)" }}>{product.category || "Danh mục"}</span>
        <ChevronRightIcon size={11} color="#ea580c" />
        <span style={{ color: "var(--text-primary, #0f172a)", fontWeight: 600 }}>{product.name}</span>
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
            <span className="amazon-stars" style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
              {[1, 2, 3, 4, 5].map((s) => (
                <StarIcon key={s} size={14} color="#ffa41c" />
              ))}
            </span>
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
          {Array.isArray(product.variants?.colors) && product.variants.colors.length > 0 && (
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
          {Array.isArray(product.variants?.sizes) && product.variants.sizes.length > 0 && (
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
          {Array.isArray(product.specifications) && product.specifications.length > 0 && (
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
            {product.stock > 0 ? (
              product.stock <= 5 ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fef3c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BoltIcon size={10} color="#f59e0b" />
                  </span>
                  <span>Chỉ còn {product.stock} sản phẩm trong kho - Đặt ngay!</span>
                </span>
              ) : (
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckIcon size={10} color="#16a34a" />
                  </span>
                  <span>Còn hàng trong kho</span>
                </span>
              )
            ) : (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CloseIcon size={10} color="#dc2626" />
                </span>
                <span>Tạm thời hết hàng</span>
              </span>
            )}
          </div>

          {product.stock > 0 && product.stock <= 30 && (
            <div style={{ margin: "10px 0", padding: "10px 12px", background: "#fff7ed", border: "1px solid #ffedd5", borderRadius: "8px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontWeight: 700, color: "var(--primary-color, #ea580c)", marginBottom: "6px" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                  <FlameIcon size={14} color="#ea580c" /> Sắp hết hàng
                </span>
                <span>Chỉ còn {product.stock} sản phẩm</span>
              </div>
              <div style={{ height: "6px", background: "#fed7aa", borderRadius: "3px", overflow: "hidden" }}>
                <div style={{ width: `${Math.min(100, Math.max(12, (product.stock / 30) * 100))}%`, height: "100%", background: "var(--primary-color, #ea580c)", borderRadius: "3px" }} />
              </div>
            </div>
          )}

          <div className="amazon-delivery-info">
            <div style={{ fontWeight: 700, color: "#007185", marginBottom: "4px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
              <TruckIcon size={16} color="#16a34a" />
              <span>Vận chuyển tiêu chuẩn & Siêu tốc</span>
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
                aria-label="Giảm số lượng"
              >
                <MinusIcon size={11} color={quantity <= 1 ? "#cbd5e1" : "#475569"} />
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
                aria-label="Tăng số lượng"
              >
                <PlusIcon size={11} color={quantity >= product.stock ? "#cbd5e1" : "#ea580c"} />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="amazon-buy-box-actions">
            <button
              type="button"
              className="amazon-btn-add-cart"
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                backgroundColor: isAddedFeedback ? "#ecfdf5" : undefined,
                borderColor: isAddedFeedback ? "#10b981" : undefined,
                color: isAddedFeedback ? "#059669" : undefined,
                transition: "all 0.2s ease",
              }}
              onClick={handleAddToCart}
            >
              {isAddedFeedback ? (
                <>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CheckIcon size={14} color="#059669" />
                  </span>
                  <span>Đã Thêm Vào Giỏ!</span>
                </>
              ) : (
                <>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <ShoppingBagIcon size={14} color="#ffffff" />
                  </span>
                  <span>Thêm Vào Giỏ Hàng</span>
                </>
              )}
            </button>
            <button
              type="button"
              className="amazon-btn-buy-now"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onClick={handleBuyNow}
            >
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <BoltIcon size={14} color="#ffffff" />
              </span>
              <span>Mua Ngay</span>
            </button>
            <button
              type="button"
              className="amazon-btn-wishlist"
              style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
              onClick={() => toggleWishlist(productId)}
            >
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: wishlisted ? '#fee2e2' : '#f1f5f9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <HeartIcon size={14} color={wishlisted ? "#f43f5e" : "#64748b"} fill={wishlisted ? "#f43f5e" : "none"} />
              </span>
              <span>{wishlisted ? "Đã lưu vào Yêu thích" : "Thêm vào Yêu thích"}</span>
            </button>
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              style={{
                width: "100%",
                marginTop: "8px",
                fontWeight: 700,
                fontSize: "13px",
                borderRadius: "8px",
                padding: "9px",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
              }}
              onClick={() => addToCompare(product)}
            >
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: isCompared(productId) ? 'rgba(234, 88, 12, 0.12)' : 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <ScaleIcon size={12} color={isCompared(productId) ? "var(--primary-color, #ea580c)" : "#2563eb"} />
              </span>
              <span>{isCompared(productId) ? "Đã thêm vào so sánh" : "So sánh với sản phẩm khác"}</span>
            </button>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "8px" }}>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{ fontWeight: 700, fontSize: "12px", padding: "8px 6px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onClick={handleCopyLink}
              >
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CopyIcon size={11} color="#2563eb" />
                </span>
                <span>Sao Chép Link</span>
              </button>
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{ fontWeight: 700, fontSize: "12px", padding: "8px 6px", borderRadius: "8px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                onClick={() => setShowShareModal(true)}
              >
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(139, 92, 246, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <QrCodeIcon size={11} color="#8b5cf6" />
                </span>
                <span>Chia Sẻ & QR</span>
              </button>
            </div>
          </div>

          {/* Guarantees */}
          <div className="amazon-guarantees">
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: "#d1fae5", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShieldIcon size={13} color="#059669" />
              </span>
              <span><strong>Chính hãng 100%:</strong> Bồi thường gấp đôi nếu phát hiện hàng giả.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: "#e0f2fe", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckIcon size={13} color="#0284c7" />
              </span>
              <span><strong>Đổi trả 30 ngày:</strong> Miễn phí hoàn hàng tận nơi.</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "22px", height: "22px", borderRadius: "5px", background: "#ede9fe", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <ShieldIcon size={13} color="#6366f1" />
              </span>
              <span><strong>Thanh toán bảo mật:</strong> Mã hóa SSL chuẩn quốc tế.</span>
            </div>
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
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            onClick={() => setShowShopChat(true)}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ChatIcon size={12} color="#2563eb" />
            </span>
            <span>Chat Ngay</span>
          </button>
          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            onClick={() => navigate(`/shop/${product.shopId || "shop_01"}`)}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <StoreIcon size={12} color="#ffffff" />
            </span>
            <span>Xem Gian Hàng</span>
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
              <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <StarIcon key={s} size={18} color="#ffa41c" />
                ))}
              </span>
              <span style={{ fontSize: "13px", color: "#777" }}>trên 5 sao</span>
            </div>

            {(() => {
              const breakdown = reviewStats?.ratingBreakdown || { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
              const totalRev = (breakdown[5] + breakdown[4] + breakdown[3] + breakdown[2] + breakdown[1]) || 1;
              return [5, 4, 3, 2, 1].map((star) => {
                const count = breakdown[star] || 0;
                const pct = Math.round((count / totalRev) * 100);
                const isSelected = selectedStarFilter === String(star);
                return (
                  <div
                    key={star}
                    className="amazon-breakdown-bar-row"
                    onClick={() => setSelectedStarFilter(isSelected ? "all" : String(star))}
                    style={{
                      cursor: "pointer",
                      padding: "2px 6px",
                      borderRadius: "4px",
                      backgroundColor: isSelected ? "rgba(234, 88, 12, 0.08)" : "transparent",
                      transition: "background-color 0.15s ease",
                    }}
                    title={`Lọc đánh giá ${star} sao`}
                  >
                    <span style={{ fontWeight: isSelected ? 700 : 400, color: isSelected ? "var(--primary-color, #ea580c)" : undefined }}>
                      {star} sao
                    </span>
                    <div className="amazon-breakdown-bar-bg">
                      <div className="amazon-breakdown-bar-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span>{pct}%</span>
                  </div>
                );
              });
            })()}

            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              style={{ width: "100%", marginTop: "18px", fontSize: "13px", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", fontWeight: 600 }}
              onClick={() => setShowReviewForm((prev) => !prev)}
            >
              <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <PencilIcon size={13} color="#2563eb" />
              </span>
              <span>Viết Đánh Giá Của Bạn</span>
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
                    Cảm ơn bạn! Đánh giá đã được đăng thành công.
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
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = (hoverStar || reviewRating) >= star;
                      return (
                        <button
                          key={star}
                          type="button"
                          style={{
                            background: "transparent",
                            border: "none",
                            padding: "2px",
                            cursor: "pointer",
                            transition: "transform 0.15s ease",
                            transform: isActive ? "scale(1.15)" : "scale(1)",
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                          onMouseEnter={() => setHoverStar(star)}
                          onMouseLeave={() => setHoverStar(0)}
                          onClick={() => setReviewRating(star)}
                          title={`${star} sao`}
                        >
                          <StarIcon
                            size={24}
                            color={isActive ? "#ffa41c" : "var(--border-medium, #cbd5e1)"}
                            fill={isActive ? "#ffa41c" : "none"}
                          />
                        </button>
                      );
                    })}
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
                    {["Giao hàng siêu nhanh", "Đúng như mô tả", "Chất lượng tuyệt vời", "Đóng gói rất kỹ", "Sẽ ủng hộ tiếp"].map((chip) => (
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
                  <button
                    type="submit"
                    className="shopee-btn shopee-btn-primary"
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "4px",
                        background: "rgba(255, 255, 255, 0.22)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CheckIcon size={11} color="#ffffff" />
                    </span>
                    <span>Gửi Đánh Giá Ngay</span>
                  </button>
                  <button
                    type="button"
                    className="shopee-btn shopee-btn-secondary"
                    onClick={() => setShowReviewForm(false)}
                    style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                  >
                    <span
                      style={{
                        width: "18px",
                        height: "18px",
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.12)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <CloseIcon size={10} color="#ef4444" />
                    </span>
                    <span>Hủy</span>
                  </button>
                </div>
              </form>
            )}

            {/* Star Rating Filter Bar */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "16px", padding: "12px", background: "var(--bg-muted, #f8fafc)", borderRadius: "8px", border: "1px solid var(--border-medium, #e2e8f0)" }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary, #64748b)" }}>Lọc đánh giá:</span>
              {[
                { id: "all", label: `Tất cả (${reviewsList.length})` },
                { id: "5", label: `5 Sao (${reviewsList.filter(r => Number(r?.rating) === 5).length})` },
                { id: "4", label: `4 Sao (${reviewsList.filter(r => Number(r?.rating) === 4).length})` },
                { id: "3", label: `3 Sao (${reviewsList.filter(r => Number(r?.rating) === 3).length})` },
                { id: "2", label: `2 Sao (${reviewsList.filter(r => Number(r?.rating) === 2).length})` },
                { id: "1", label: `1 Sao (${reviewsList.filter(r => Number(r?.rating) === 1).length})` },
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
                      alt={rev.author || rev.userName || "Khách hàng"}
                      className="amazon-review-avatar"
                    />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "13.5px" }}>{rev.author || rev.userName || "Khách hàng Mini Shopee"}</div>
                      <div style={{ fontSize: "12px", color: "#888" }}>Đánh giá ngày {rev.date}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "2px" }}>
                      {[1, 2, 3, 4, 5].map((st) => {
                        const filled = st <= Math.round(Number(rev?.rating) || 5);
                        return (
                          <StarIcon
                            key={st}
                            size={14}
                            color={filled ? "#ffa41c" : "var(--border-medium, #cbd5e1)"}
                            fill={filled ? "#ffa41c" : "none"}
                          />
                        );
                      })}
                    </span>
                    <span className="amazon-review-title">{rev?.title || "Nhận xét của khách hàng"}</span>
                  </div>

                  {rev.verifiedPurchase && (
                    <div className="amazon-review-verified" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                      <CheckIcon size={12} color="#16a34a" />
                      <span>Đã chứng nhận mua hàng chính hãng tại Fullstack E-Commerce</span>
                    </div>
                  )}

                  {Array.isArray(rev?.tags) && rev.tags.length > 0 && (
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0" }}>
                      {rev.tags.map((tag, tIdx) => (
                        <span
                          key={tIdx}
                          style={{
                            fontSize: "11px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            border: "1px solid #bfdbfe",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontWeight: 600,
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <TagIcon size={11} color="#2563eb" /> {tag}
                        </span>
                      ))}
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

      {/* Product Questions & Answers Section */}
      <ProductQASection
        productId={product._id || product.id || id}
        shopName={product.shopName || "Thời Trang GenZ Official"}
      />

      {/* Recently Viewed Products */}
      <RecentlyViewedSection
        currentProductId={id}
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
            className="anim-modal-content"
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
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <GlobeIcon size={15} color="var(--primary-color, #ea580c)" />
                </span>
                <span>Chia Sẻ Sản Phẩm</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowShareModal(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Đóng modal chia sẻ"
              >
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CloseIcon size={14} color="#ef4444" />
                </span>
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
                style={{ fontSize: '13px', padding: '8px 14px', whiteSpace: 'nowrap', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href);
                  showToast('Đã sao chép liên kết sản phẩm vào bộ nhớ tạm!', 'success');
                }}
              >
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CopyIcon size={11} color="#ffffff" />
                </span>
                <span>Sao chép</span>
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

      {/* Mobile Sticky Action Bar */}
      <div className="amazon-mobile-sticky-bar">
        <div className="mobile-action-left">
          <Link
            to={product.shopId ? `/shop/${product.shopId}` : '/'}
            className="mobile-icon-btn"
            title="Xem Shop"
          >
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <StoreIcon size={12} color="#ea580c" />
            </span>
            <span>Shop</span>
          </Link>
          <button
            type="button"
            className="mobile-icon-btn"
            onClick={() => toggleWishlist(productId)}
            title="Yêu thích"
          >
            <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: wishlisted ? 'rgba(244, 63, 94, 0.15)' : 'rgba(100, 116, 139, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <HeartIcon size={12} color={wishlisted ? "#f43f5e" : "#64748b"} fill={wishlisted ? "#f43f5e" : "none"} />
            </span>
            <span>{wishlisted ? "Đã lưu" : "Thích"}</span>
          </button>
        </div>
        <div className="mobile-action-right">
          <button
            type="button"
            className="mobile-btn-cart"
            style={{
              backgroundColor: isAddedFeedback ? "#ecfdf5" : undefined,
              color: isAddedFeedback ? "#059669" : undefined,
              borderColor: isAddedFeedback ? "#10b981" : undefined,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
            onClick={handleAddToCart}
          >
            {isAddedFeedback ? (
              <>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#d1fae5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <CheckIcon size={12} color="#059669" />
                </span>
                <span>Đã thêm!</span>
              </>
            ) : (
              <>
                <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: '#ffedd5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ShoppingBagIcon size={12} color="#ea580c" />
                </span>
                <span>Thêm giỏ</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="mobile-btn-buy"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            onClick={handleBuyNow}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <BoltIcon size={13} color="#ffffff" />
            </span>
            <span>Mua Ngay</span>
          </button>
        </div>
      </div>
    </main>
  );
}
