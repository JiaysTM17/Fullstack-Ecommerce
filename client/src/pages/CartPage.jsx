import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartItem, EmptyState } from "../components";
import VoucherPickerModal from "../components/VoucherPickerModal";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { formatCurrency } from "../utils/formatCurrency";

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
    voucherError,
    voucherDiscount,
    shippingFee,
    finalTotal,
    increaseQuantity,
    decreaseQuantity,
    setQuantity,
    removeFromCart,
    toggleSelectItem,
    selectAllItems,
    unselectAllItems,
    isItemSelected,
    saveForLater,
    moveToCartFromSaved,
    removeFromSaved,
    applyVoucher,
    removeVoucher,
  } = useCart();

  const { addToWishlist } = useWishlist();
  const { showToast } = useToast();

  const [voucherInput, setVoucherInput] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");
  const [showVoucherModal, setShowVoucherModal] = useState(false);

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

  const handleVoucherSubmit = (e) => {
    e.preventDefault();
    if (!voucherInput.trim()) return;
    const res = applyVoucher(voucherInput.trim());
    if (res.success) {
      setVoucherMessage(res.message);
      setVoucherInput("");
    } else {
      setVoucherMessage(res.message);
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "28px", alignItems: "start" }}>
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
                  <span style={{ color: "var(--color-success, #10b981)" }}>
                    🎉 {t('freeship_qualified', 'Chúc mừng! Bạn đã đủ điều kiện nhận MIỄN PHÍ VẬN CHUYỂN!')}
                  </span>
                ) : (
                  <span>
                    🚚 {t('freeship_needed', 'Mua thêm')} <strong style={{ color: "var(--primary-color)" }}>{formatCurrency(neededAmount)}</strong> {t('freeship_to_qualify', 'để được MIỄN PHÍ VẬN CHUYỂN toàn quốc!')}
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
                    gap: "4px",
                    padding: 0,
                  }}
                >
                  🗑️ Xóa đã chọn ({selectedItemIds.length})
                </button>
              )}

              <span style={{ fontSize: "13px", color: "var(--text-secondary, #666)" }}>
                {t('selected_items', 'Đã chọn')} <strong>{selectedItems.length}</strong> {t('products_count', 'sản phẩm')}
              </span>
            </div>
          </div>

          {/* Cart Item Cards */}
          {items.map((item) => {
            const isChecked = isItemSelected(item.productId);
            return (
              <div
                key={item.productId}
                style={{
                  background: isChecked ? "var(--bg-card, #ffffff)" : "var(--bg-muted, #f8fafc)",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "14px",
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
                      style={{ background: "none", border: "none", color: "var(--secondary-color, #0284c7)", cursor: "pointer", fontWeight: 600, padding: 0 }}
                      onClick={() => saveForLater(item.productId)}
                    >
                      📦 Để dành mua sau
                    </button>
                    <span style={{ color: "var(--border-dark, #cbd5e1)" }}>|</span>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "var(--primary-color, #ea580c)", cursor: "pointer", fontWeight: 600, padding: 0 }}
                      onClick={() => handleMoveToWishlist(item)}
                    >
                      ❤️ Chuyển vào Yêu thích
                    </button>
                    <span style={{ color: "var(--border-dark, #cbd5e1)" }}>|</span>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "var(--color-error, #ef4444)", cursor: "pointer", padding: 0 }}
                      onClick={() => removeFromCart(item.productId)}
                    >
                      Xóa khỏi giỏ
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Save For Later Section (Amazon style) */}
          {savedItems.length > 0 && (
            <div style={{ marginTop: "36px", background: "var(--bg-card, #ffffff)", borderRadius: "8px", padding: "20px", border: "1px solid var(--border-medium, #e2e8f0)", boxShadow: "var(--shadow-sm)" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary, #0f172a)" }}>
                📦 Để Dành Mua Sau ({savedItems.length} sản phẩm)
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
                        style={{ fontSize: "12px" }}
                        onClick={() => moveToCartFromSaved(saved)}
                      >
                        🛒 Chuyển Vào Giỏ Hàng
                      </button>
                      <button
                        type="button"
                        style={{ background: "none", border: "none", color: "#888", cursor: "pointer", fontSize: "12px" }}
                        onClick={() => removeFromSaved(saved.productId)}
                      >
                        Xóa
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
              <span style={{ fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)" }}>
                🎟️ {t('voucher_code', 'Mã Giảm Giá / Voucher')}:
              </span>
              <button
                type="button"
                onClick={() => setShowVoucherModal(true)}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--primary-color, #ea580c)",
                  fontWeight: 700,
                  fontSize: "13px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  padding: "2px 4px",
                }}
              >
                {appliedVoucher ? "Đổi mã khác >" : "Chọn mã có sẵn >"}
              </button>
            </div>

            {appliedVoucher ? (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--primary-light, rgba(234, 88, 12, 0.08))", padding: "8px 12px", borderRadius: "8px", border: "1px solid var(--primary-color, #ea580c)", marginBottom: "10px" }}>
                <div>
                  <span style={{ fontWeight: 800, color: "var(--primary-color, #ea580c)", fontSize: "13.5px" }}>
                    🎟️ {appliedVoucher.code}
                  </span>
                  <span style={{ fontSize: "12px", color: "var(--color-success, #10b981)", marginLeft: "8px", fontWeight: 700 }}>
                    ({appliedVoucher.type === 'shipping' ? 'Miễn phí vận chuyển' : `-${formatCurrency(voucherDiscount)}`})
                  </span>
                </div>
                <button
                  type="button"
                  onClick={removeVoucher}
                  style={{ background: "none", border: "none", color: "var(--color-error, #d32f2f)", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}
                >
                  ✕ {t('remove', 'Gỡ')}
                </button>
              </div>
            ) : (
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
                  marginBottom: "10px",
                  borderColor: "var(--primary-color, #ea580c)",
                  color: "var(--primary-color, #ea580c)",
                  background: "var(--primary-light, rgba(234, 88, 12, 0.03))"
                }}
              >
                <span>🎟️ Nhấn để chọn mã giảm giá & Freeship</span>
                <span style={{ fontSize: "14px", fontWeight: 700 }}>›</span>
              </button>
            )}

            <form onSubmit={handleVoucherSubmit} style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                className="shopee-form-input"
                placeholder="Hoặc nhập mã (VD: MINI10)..."
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                style={{ fontSize: "12.5px", textTransform: "uppercase" }}
              />
              <button type="submit" className="shopee-btn shopee-btn-secondary" style={{ whiteSpace: "nowrap", fontSize: "12.5px" }}>
                {t('apply', 'Áp Dụng')}
              </button>
            </form>

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
                <span>{t('voucher_discount', 'Giảm giá Voucher')}:</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}

            {appliedVoucher?.type === "shipping" && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-success, #2e7d32)" }}>
                <span>Miễn phí ship ({appliedVoucher.code}):</span>
                <span style={{ fontWeight: 700 }}>-25.000₫</span>
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
              style={{ display: "block", textAlign: "center", padding: "14px", fontSize: "16px", fontWeight: 700 }}
            >
              {t('proceed_to_checkout', 'Tiến Hành Thanh Toán')} ({selectedItems.length}) →
            </Link>
          ) : (
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              disabled
              style={{ width: "100%", padding: "14px", fontSize: "14px", opacity: 0.6 }}
            >
              {t('select_items_warning', 'Vui lòng chọn sản phẩm để thanh toán')}
            </button>
          )}

          <div style={{ textAlign: "center", marginTop: "14px" }}>
            <Link to="/" style={{ fontSize: "13px", color: "var(--secondary-color, #007185)", textDecoration: "none" }}>
              ← {t('continue_shopping', 'Tiếp tục chọn thêm sản phẩm')}
            </Link>
          </div>
        </aside>
      </div>

      {/* Voucher Selection Modal */}
      <VoucherPickerModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        onApplyVoucher={(code) => applyVoucher(code)}
        onRemoveVoucher={removeVoucher}
        appliedVoucher={appliedVoucher}
        currentSubtotal={selectedSubtotal || items.reduce((t, i) => t + i.price * i.quantity, 0)}
      />
    </main>
  );
}
