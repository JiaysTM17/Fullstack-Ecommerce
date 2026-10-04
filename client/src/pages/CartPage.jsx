import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartItem, EmptyState } from "../components";
import VoucherPickerModal from "../components/VoucherPickerModal";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { formatCurrency } from "../utils/formatCurrency";
import { previewVoucherDiscount } from "../services/voucherService";
import {
  TicketIcon,
  TruckIcon,
  StoreIcon,
  PackageIcon,
  HeartIcon,
  CartIcon,
  TrashIcon,
  TagIcon,
  CloseIcon,
  SparklesIcon,
  PencilIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  HomeIcon,
} from "../components/OrdersIcons";

const FREE_SHIPPING_THRESHOLD = 300000;

export default function CartPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const {
    items,
    selectedItems,
    selectedItemIds,
    selectedSubtotal,
    savedItems,
    appliedVoucher,
    appliedDiscountVoucher,
    appliedShippingVoucher,
    voucherError,
    voucherDiscount,
    shippingDiscount,
    shippingFee,
    defaultShippingFee,
    finalTotal,
    increaseQuantity,
    decreaseQuantity,
    setQuantity,
    removeFromCart,
    toggleSelectItem,
    selectAllItems,
    unselectAllItems,
    toggleSelectShop,
    isItemSelected,
    saveForLater,
    moveToCartFromSaved,
    removeFromSaved,
    applyVoucher,
    applyDiscountVoucher,
    applyShippingVoucher,
    removeVoucher,
    removeDiscountVoucher,
    removeShippingVoucher,
  } = useCart();

  const { addToWishlist } = useWishlist();
  const { showToast } = useToast();

  const [voucherInput, setVoucherInput] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [voucherLivePreview, setVoucherLivePreview] = useState(null);
  const [showVoucherModal, setShowVoucherModal] = useState(false);

  useEffect(() => {
    const trimmed = voucherInput.trim().toUpperCase();
    if (trimmed.length < 3) {
      setVoucherLivePreview(null);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const baseSubtotal = selectedSubtotal > 0 ? selectedSubtotal : 100000;
        const preview = await previewVoucherDiscount(trimmed, baseSubtotal);
        setVoucherLivePreview(preview);
      } catch {
        setVoucherLivePreview(null);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [voucherInput, selectedSubtotal]);

  const [shopNotes, setShopNotes] = useState(() => {
    try {
      const saved = localStorage.getItem("mini_shopee_cart_shop_notes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleShopNoteChange = (shopId, text) => {
    setShopNotes((prev) => {
      const next = { ...prev, [shopId]: text };
      try {
        localStorage.setItem("mini_shopee_cart_shop_notes", JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const shopNameMap = {
    shop_01: "Thời Trang GenZ Official",
    shop_02: "TechWorld Store",
    shop_03: "GlowCosmetics Mall",
    shop_04: "HomePro Living Store",
  };

  const cartItemsByShop = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      const sId = item.shopId || "shop_01";
      const sName = item.shopName || shopNameMap[sId] || "Fullstack Official Store";
      if (!groups[sId]) {
        groups[sId] = {
          shopId: sId,
          shopName: sName,
          items: [],
        };
      }
      groups[sId].items.push(item);
    });
    return Object.values(groups);
  }, [items]);

  const allSelected = items.length > 0 && selectedItemIds.length === items.length;
  const hasFreeShipping = selectedSubtotal >= FREE_SHIPPING_THRESHOLD;
  const progressPercent = Math.min(100, Math.round((selectedSubtotal / FREE_SHIPPING_THRESHOLD) * 100));
  const neededAmount = Math.max(0, FREE_SHIPPING_THRESHOLD - selectedSubtotal);

  const handleBulkRemoveSelected = () => {
    if (selectedItemIds.length === 0) return;
    if (window.confirm(`Bạn có chắc chắn muốn xóa ${selectedItemIds.length} sản phẩm đã chọn khỏi giỏ hàng?`)) {
      selectedItemIds.forEach((id) => removeFromCart(id));
      showToast(`Đã xóa ${selectedItemIds.length} sản phẩm khỏi giỏ hàng`, 'info');
    }
  };

  const handleMoveToWishlist = (item) => {
    addToWishlist({
      _id: item.productId,
      id: item.productId,
      name: item.name,
      price: item.price,
      image: item.image,
      stock: item.stock || 50,
      rating: 5,
    });
    removeFromCart(item.productId);
    showToast(`Đã chuyển "${item.name}" sang danh sách Yêu thích!`, 'success');
  };

  const handleVoucherSubmit = async (e) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    const res = await applyVoucher(voucherInput.trim());
    if (res?.success) {
      setVoucherMessage(res.message);
      setVoucherInput("");
    } else {
      setVoucherMessage(res?.message || "Mã giảm giá không hợp lệ");
    }
  };

  if (items.length === 0 && savedItems.length === 0) {
    return (
      <main className="shopee-container" style={{ padding: "40px 0" }}>
        <EmptyState
          title={t('empty_cart_title', 'Giỏ hàng của bạn đang trống')}
          description={t('empty_cart_desc', 'Khám phá hàng ngàn sản phẩm giá tốt và ưu đãi hấp dẫn ngay hôm nay.')}
          actionText={t('start_shopping', 'Bắt đầu mua sắm')}
          onAction={() => navigate("/")}
        />
      </main>
    );
  }

  return (
    <main className="shopee-container" style={{ padding: "24px 0" }}>
      <div className="shopee-cart-page" style={{ gap: "28px" }}>
        {/* Left Column: Cart Items & Save For Later */}
        <section>
          {/* Free Shipping Progress Bar */}
          <div
            style={{
              background: "var(--bg-card, #fff)",
              borderRadius: "8px",
              padding: "16px 20px",
              marginBottom: "16px",
              border: "1px solid var(--border-medium, #e0e0e0)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", fontWeight: 700, color: "var(--text-primary)" }}>
                {hasFreeShipping ? (
                  <span style={{ color: "var(--color-success, #10b981)", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#d1fae5", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <SparklesIcon size={15} color="#059669" />
                    </span>
                    <span>{t('freeship_qualified', 'Chúc mừng! Bạn đã đủ điều kiện nhận MIỄN PHÍ VẬN CHUYỂN!')}</span>
                  </span>
                ) : (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#e0f2fe", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <TruckIcon size={15} color="#0284c7" />
                    </span>
                    <span>{t('freeship_needed', 'Mua thêm')} <strong style={{ color: "var(--primary-color)" }}>{formatCurrency(neededAmount)}</strong> {t('freeship_to_qualify', 'để được MIỄN PHÍ VẬN CHUYỂN toàn quốc!')}</span>
                  </span>
                )}
              </span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-secondary)" }}>
                {progressPercent}%
              </span>
            </div>
            <div
              style={{
                height: "8px",
                width: "100%",
                backgroundColor: "var(--bg-muted, #e2e8f0)",
                borderRadius: "9999px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  height: "100%",
                  width: `${progressPercent}%`,
                  background: hasFreeShipping
                    ? "linear-gradient(90deg, #10b981, #059669)"
                    : "linear-gradient(90deg, #ea580c, #f97316)",
                  borderRadius: "9999px",
                  transition: "width 0.4s ease",
                }}
              />
            </div>
          </div>

          {items.length === 0 ? (
            <div
              style={{
                background: "var(--bg-card, #fff)",
                borderRadius: "8px",
                padding: "24px 20px",
                marginBottom: "16px",
                border: "1px solid var(--border-medium, #e0e0e0)",
                textAlign: "center",
              }}
            >
              <div style={{ marginBottom: "12px", display: "flex", justifyContent: "center" }}>
                <CartIcon size={44} color="#ea580c" />
              </div>
              <div style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>
                {t('empty_cart_title', 'Giỏ hàng chính hiện đang trống')}
              </div>
              <p style={{ fontSize: "13px", color: "var(--text-secondary)", margin: "6px 0 14px" }}>
                Các sản phẩm bạn đã lưu để dành mua sau đang nằm ở danh sách phía dưới.
              </p>
              <Link
                to="/"
                className="shopee-btn shopee-btn-secondary"
                style={{ padding: "6px 16px", fontSize: "13px", textDecoration: "none", display: "inline-block" }}
              >
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <HomeIcon size={12} color="#2563eb" />
                  </span>
                  <span>{t('start_shopping', 'Tiếp tục mua sắm')}</span>
                </span>
              </Link>
            </div>
          ) : (
            <div style={{ background: "var(--bg-card, #fff)", borderRadius: "8px", padding: "16px 20px", marginBottom: "16px", border: "1px solid var(--border-medium, #e0e0e0)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "10px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer", color: "var(--text-primary)" }}>
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => (allSelected ? unselectAllItems() : selectAllItems())}
                  style={{ width: "18px", height: "18px" }}
                />
                <span>{t('select_all', 'CHỌN TẤT CẢ')} ({items.length} {t('products_count', 'sản phẩm')})</span>
              </label>

              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {selectedItemIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleBulkRemoveSelected}
                    style={{
                      background: "none",
                      border: "none",
                      color: "var(--color-error, #ef4444)",
                      fontSize: "13px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      padding: 0,
                    }}
                  >
                    <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrashIcon size={12} color="#ef4444" />
                    </span>
                    <span>Xóa đã chọn ({selectedItemIds.length})</span>
                  </button>
                )}

                <span style={{ fontSize: "13px", color: "var(--text-secondary, #666)" }}>
                  {t('selected_items', 'Đã chọn')} <strong>{selectedItems.length}</strong> {t('products_count', 'sản phẩm')}
                </span>
              </div>
            </div>
          )}

          {/* Cart Item Cards Grouped by Shop */}
          {cartItemsByShop.map((shopGroup) => (
            <div
              key={shopGroup.shopId}
              style={{
                background: "var(--bg-card, #ffffff)",
                borderRadius: "10px",
                padding: "16px 20px",
                marginBottom: "20px",
                border: "1px solid var(--border-medium, #e2e8f0)",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
              }}
            >
              {/* Shop Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingBottom: "12px",
                  marginBottom: "14px",
                  borderBottom: "1px solid var(--border-medium, #e2e8f0)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <input
                    type="checkbox"
                    aria-label={`Chọn tất cả sản phẩm của ${shopGroup.shopName}`}
                    checked={shopGroup.items.length > 0 && shopGroup.items.every((it) => isItemSelected(it.productId))}
                    onChange={() => toggleSelectShop(shopGroup.items.map((it) => it.productId))}
                    style={{ width: "16px", height: "16px", cursor: "pointer" }}
                  />
                  <span style={{ width: "26px", height: "26px", borderRadius: "6px", background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "1px solid #fed7aa", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <StoreIcon size={14} color="#ea580c" />
                  </span>
                  <strong style={{ fontSize: "14px", color: "var(--text-primary, #0f172a)" }}>
                    {shopGroup.shopName}
                  </strong>
                  <span
                    style={{
                      background: "var(--primary-color, #ea580c)",
                      color: "#fff",
                      fontSize: "10.5px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                    }}
                  >
                    Mall
                  </span>
                </div>
                <span style={{ fontSize: "12.5px", color: "var(--text-secondary, #64748b)" }}>
                  {shopGroup.items.length} món
                </span>
              </div>

              {/* Items for this Shop */}
              {shopGroup.items.map((item) => {
                const isChecked = isItemSelected(item.productId);
                return (
                  <div
                    key={item.productId}
                    style={{
                      background: isChecked ? "var(--bg-card, #ffffff)" : "var(--bg-muted, #f8fafc)",
                      borderRadius: "8px",
                      padding: "14px",
                      marginBottom: "12px",
                      border: isChecked ? "1px solid var(--border-medium, #e2e8f0)" : "1px dashed var(--border-medium, #cbd5e1)",
                      opacity: isChecked ? 1 : 0.85,
                      display: "flex",
                      gap: "14px",
                      alignItems: "center",
                      transition: "all 0.2s ease",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => toggleSelectItem(item.productId)}
                      style={{ width: "18px", height: "18px", flexShrink: 0, cursor: "pointer" }}
                    />

                    <div style={{ flex: 1 }}>
                      <CartItem
                        item={item}
                        onIncrease={(cartItem) => increaseQuantity(cartItem.productId)}
                        onDecrease={(cartItem) => decreaseQuantity(cartItem.productId)}
                        onQuantityChange={(cartItem, quantity) => setQuantity(cartItem.productId, quantity)}
                        onRemove={(cartItem) => removeFromCart(cartItem.productId)}
                        onItemClick={(cartItem) => navigate(`/products/${cartItem.productId}`)}
                        formatCurrency={formatCurrency}
                      />

                      {/* Actions row: Save for later & Move to Wishlist */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "14px", marginTop: "10px", paddingLeft: "100px", fontSize: "13px" }}>
                        <button
                          type="button"
                          style={{ background: "none", border: "none", color: "var(--secondary-color, #0284c7)", cursor: "pointer", fontWeight: 600, padding: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}
                          onClick={() => saveForLater(item.productId)}
                        >
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <PackageIcon size={11} color="#0284c7" />
                          </span>
                          <span>Để dành mua sau</span>
                        </button>
                        <span style={{ color: "var(--border-dark, #cbd5e1)" }}>|</span>
                        <button
                          type="button"
                          style={{ background: "none", border: "none", color: "var(--primary-color, #ea580c)", cursor: "pointer", fontWeight: 600, padding: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}
                          onClick={() => handleMoveToWishlist(item)}
                        >
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(236, 72, 153, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <HeartIcon size={11} color="#ec4899" />
                          </span>
                          <span>Chuyển vào Yêu thích</span>
                        </button>
                        <span style={{ color: "var(--border-dark, #cbd5e1)" }}>|</span>
                        <button
                          type="button"
                          style={{ background: "none", border: "none", color: "var(--color-error, #ef4444)", cursor: "pointer", padding: 0, display: "inline-flex", alignItems: "center", gap: "6px" }}
                          onClick={() => removeFromCart(item.productId)}
                        >
                          <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TrashIcon size={11} color="#ef4444" />
                          </span>
                          <span>Xóa khỏi giỏ</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}

              {/* Order note for this Shop */}
              <div
                style={{
                  marginTop: "10px",
                  padding: "10px 14px",
                  background: "var(--bg-muted, #f8fafc)",
                  borderRadius: "8px",
                  border: "1px dashed var(--border-medium, #cbd5e1)",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  flexWrap: "wrap",
                }}
              >
                <span style={{ fontSize: "13px", fontWeight: 600, color: "var(--text-secondary, #475569)", whiteSpace: "nowrap", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PencilIcon size={12} color="#2563eb" />
                  </span>
                  <span>Lời nhắn cho Người bán:</span>
                </span>
                <input
                  type="text"
                  placeholder={`Lưu ý cho shop (màu sắc, kích thước, đóng gói quà...)...`}
                  value={shopNotes[shopGroup.shopId] || ""}
                  onChange={(e) => handleShopNoteChange(shopGroup.shopId, e.target.value)}
                  className="shopee-form-input"
                  style={{ flex: 1, minWidth: "220px", fontSize: "13px", padding: "6px 12px" }}
                />
              </div>
            </div>
          ))}

          {/* Save For Later Section (Amazon style) */}
          {savedItems.length > 0 && (
            <div style={{ marginTop: "36px", background: "var(--bg-card, #ffffff)", borderRadius: "8px", padding: "20px", border: "1px solid var(--border-medium, #e2e8f0)", boxShadow: "var(--shadow-sm)" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary, #0f172a)", display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(2, 132, 199, 0.12)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageIcon size={15} color="#0284c7" />
                </span>
                <span>Để Dành Mua Sau ({savedItems.length} sản phẩm)</span>
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {savedItems.map((saved) => (
                  <div
                    key={saved.productId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #f0f0f0",
                      paddingBottom: "12px",
                      flexWrap: "wrap",
                      gap: "12px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={saved.image}
                        alt={saved.name}
                        style={{ width: "64px", height: "64px", objectFit: "cover", borderRadius: "6px" }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "14px" }}>{saved.name}</div>
                        <div style={{ color: "var(--primary-color, #ea580c)", fontWeight: 700, fontSize: "14px" }}>
                          {formatCurrency(saved.price)}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "10px" }}>
                      <button
                        type="button"
                        className="shopee-btn shopee-btn-secondary"
                        style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "8px", borderColor: "rgba(234, 88, 12, 0.3)", color: "var(--primary-color, #ea580c)" }}
                        onClick={() => moveToCartFromSaved(saved)}
                      >
                        <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <CartIcon size={12} color="#ea580c" />
                        </span>
                        <span>{t('move_to_cart', 'Chuyển Vào Giỏ Hàng')}</span>
                      </button>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", padding: 0 }}
                        onClick={() => removeFromSaved(saved.productId)}
                        aria-label="Xóa khỏi danh sách lưu lại mua sau"
                      >
                        <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          <TrashIcon size={10} color="#ef4444" />
                        </span>
                        <span>Xóa</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Sticky Order Summary & Voucher Input */}
        <aside className="shopee-cart-summary">
          <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary)" }}>{t('order_summary', 'Tóm Tắt Đơn Hàng')}</h2>

          {/* Voucher Section with Picker & Input */}
          <div style={{ marginBottom: "18px", borderBottom: "1px solid var(--border-medium, #eee)", paddingBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)", display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: "#ffedd5", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <TicketIcon size={14} color="#ea580c" />
                </span>
                <span>{t('voucher_code', 'Mã Giảm Giá / Voucher')}:</span>
              </span>
              <button
                type="button"
                onClick={() => setShowVoucherModal(true)}
                style={{
                  background: "rgba(234, 88, 12, 0.08)",
                  border: "1px solid rgba(234, 88, 12, 0.2)",
                  borderRadius: "6px",
                  color: "var(--primary-color, #ea580c)",
                  fontWeight: 700,
                  fontSize: "12.5px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "4px 8px",
                  transition: "all 0.15s ease",
                }}
              >
                <span>{appliedVoucher ? "Đổi mã khác" : "Chọn mã có sẵn"}</span>
                <span
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    background: 'rgba(234, 88, 12, 0.15)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <ChevronRightIcon size={10} color="#ea580c" />
                </span>
              </button>
            </div>

            {/* Dual Voucher Badges */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "10px" }}>
              {appliedShippingVoucher && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#f0f9ff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #0284c7" }}>
                  <div>
                    <span style={{ fontWeight: 800, color: "#0284c7", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "20px", height: "20px", borderRadius: "4px", background: "#e0f2fe", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <TruckIcon size={12} color="#0284c7" />
                      </span>
                      <span>{appliedShippingVoucher.code}</span>
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--color-success, #10b981)", marginLeft: "8px", fontWeight: 700 }}>
                      (-{formatCurrency(shippingDiscount)} ship)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeShippingVoucher}
                    style={{ background: "none", border: "none", color: "var(--color-error, #d32f2f)", cursor: "pointer", fontWeight: 700, fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloseIcon size={9} color="#ef4444" />
                    </span>
                    <span>{t('remove', 'Gỡ')}</span>
                  </button>
                </div>
              )}

              {appliedDiscountVoucher && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--primary-light, rgba(234, 88, 12, 0.08))", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--primary-color, #ea580c)" }}>
                  <div>
                    <span style={{ fontWeight: 800, color: "var(--primary-color, #ea580c)", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ width: "20px", height: "20px", borderRadius: "4px", background: "#ffedd5", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                        <TagIcon size={12} color="#ea580c" />
                      </span>
                      <span>{appliedDiscountVoucher.code}</span>
                    </span>
                    <span style={{ fontSize: "12px", color: "var(--color-success, #10b981)", marginLeft: "8px", fontWeight: 700 }}>
                      (-{formatCurrency(voucherDiscount)})
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={removeDiscountVoucher}
                    style={{ background: "none", border: "none", color: "var(--color-error, #d32f2f)", cursor: "pointer", fontWeight: 700, fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloseIcon size={9} color="#ef4444" />
                    </span>
                    <span>{t('remove', 'Gỡ')}</span>
                  </button>
                </div>
              )}

              {(!appliedDiscountVoucher || !appliedShippingVoucher) && (
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setShowVoucherModal(true)}
                  style={{
                    width: "100%",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "9px 12px",
                    fontSize: "13px",
                    fontWeight: 600,
                    borderColor: "var(--primary-color, #ea580c)",
                    color: "var(--primary-color, #ea580c)",
                    background: "var(--primary-light, rgba(234, 88, 12, 0.03))"
                  }}
                >
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TicketIcon size={13} color="#ea580c" />
                    </span>
                    <span>{appliedDiscountVoucher || appliedShippingVoucher ? "+ Chọn thêm mã còn lại" : "Nhấn để chọn mã giảm giá & Freeship"}</span>
                  </span>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRightIcon size={12} color="var(--primary-color, #ea580c)" />
                  </span>
                </button>
              )}
            </div>

            <form onSubmit={handleVoucherSubmit} style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                className="shopee-form-input"
                placeholder="Hoặc nhập mã (VD: MINI10, FREESHIP)..."
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                style={{ fontSize: "12.5px", textTransform: "uppercase" }}
              />
              <button
                type="submit"
                className="shopee-btn shopee-btn-secondary"
                style={{
                  whiteSpace: "nowrap",
                  fontSize: "12.5px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: 600,
                }}
              >
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TagIcon size={10} color="#ea580c" />
                </span>
                <span>{t('apply', 'Áp Dụng')}</span>
              </button>
            </form>

            {voucherLivePreview && (
              <div
                style={{
                  marginTop: "8px",
                  padding: "6px 10px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px dashed #10b981",
                  borderRadius: "6px",
                  fontSize: "12px",
                  color: "#047857",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                  <SparklesIcon size={13} color="#047857" /> <strong>{voucherLivePreview.voucherCode}</strong>: Giảm xem trước
                </span>
                <strong style={{ color: "#059669" }}>-{formatCurrency(voucherLivePreview.discountAmount)}</strong>
              </div>
            )}

            {voucherMessage && (
              <div style={{ fontSize: "12px", color: appliedVoucher ? "var(--color-success, #2e7d32)" : "var(--color-error, #d32f2f)", marginTop: "6px", fontWeight: 600 }}>
                {voucherMessage}
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #666)" }}>{t('selected_items', 'Sản phẩm đã chọn')}:</span>
              <span style={{ fontWeight: 600 }}>{selectedItems.length} {t('products_count', 'món')}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #666)" }}>{t('subtotal', 'Tạm tính')}:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(selectedSubtotal)}</span>
            </div>

            {voucherDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-success, #2e7d32)" }}>
                <span>{t('voucher_discount', 'Giảm giá Voucher')} ({appliedDiscountVoucher?.code}):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}

            {shippingDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#0284c7" }}>
                <span>Ưu đãi Freeship ({appliedShippingVoucher?.code}):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(shippingDiscount)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #666)" }}>{t('shipping_fee', 'Phí vận chuyển')}:</span>
              <span style={{ fontWeight: 600 }}>
                {shippingFee === 0 ? t('free', 'MIỄN PHÍ') : formatCurrency(shippingFee)}
              </span>
            </div>

            <div style={{ borderTop: "2px solid var(--border-dark, #333)", paddingTop: "12px", marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "16px", fontWeight: 800 }}>{t('total', 'TỔNG CỘNG')}:</span>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary-color, var(--primary-color, #ea580c))" }}>
                {formatCurrency(finalTotal)}
              </span>
            </div>
          </div>

          {/* Proceed to checkout button */}
          {selectedItems.length > 0 ? (
            <Link
              className="shopee-btn shopee-btn-primary"
              to="/checkout"
              state={{ shopNotes }}
              style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", padding: "14px", fontSize: "16px", fontWeight: 700 }}
            >
              <span>{t('proceed_to_checkout', 'Tiến Hành Thanh Toán')} ({selectedItems.length})</span>
              <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ChevronRightIcon size={14} color="#ffffff" />
              </span>
            </Link>
          ) : (
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              disabled
              style={{ width: "100%", padding: "14px", fontSize: "14px", opacity: 0.85, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px" }}
            >
              <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <AlertCircleIcon size={12} color="#ea580c" />
              </span>
              <span>{t('select_items_warning', 'Vui lòng chọn sản phẩm để thanh toán')}</span>
            </button>
          )}

          <div style={{ textAlign: "center", marginTop: "14px" }}>
            <Link to="/" style={{ fontSize: "13px", color: "var(--secondary-color, #007185)", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ArrowLeftIcon size={12} color="#2563eb" />
              </span>
              <span>{t('continue_shopping', 'Tiếp tục chọn thêm sản phẩm')}</span>
            </Link>
          </div>
        </aside>
      </div>

      {/* Voucher Selection Modal */}
      <VoucherPickerModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        appliedDiscountVoucher={appliedDiscountVoucher}
        appliedShippingVoucher={appliedShippingVoucher}
        onApplyDiscountVoucher={applyDiscountVoucher}
        onApplyShippingVoucher={applyShippingVoucher}
        onRemoveDiscountVoucher={removeDiscountVoucher}
        onRemoveShippingVoucher={removeShippingVoucher}
        onApplyVoucher={applyVoucher}
        onRemoveVoucher={removeVoucher}
        currentSubtotal={selectedSubtotal || items.reduce((t, i) => t + i.price * i.quantity, 0)}
        defaultShippingFee={defaultShippingFee || 25000}
      />
    </main>
  );
}
