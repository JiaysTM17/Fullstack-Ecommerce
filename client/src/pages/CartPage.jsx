import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CartItem, EmptyState } from "../components";
import { useCart } from "../context/CartContext";
import { formatCurrency } from "../utils/formatCurrency";

export default function CartPage() {
  const navigate = useNavigate();
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

  const [voucherInput, setVoucherInput] = useState("");
  const [voucherMessage, setVoucherMessage] = useState("");

  const allSelected = items.length > 0 && selectedItemIds.length === items.length;

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
          title="Giỏ hàng của bạn đang trống"
          description="Khám phá hàng ngàn sản phẩm giá tốt và ưu đãi hấp dẫn ngay hôm nay."
          actionText="Bắt đầu mua sắm"
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
          <div style={{ background: "#fff", borderRadius: "8px", padding: "16px 20px", marginBottom: "16px", border: "1px solid #e0e0e0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={() => (allSelected ? unselectAllItems() : selectAllItems())}
                style={{ width: "18px", height: "18px" }}
              />
              <span>CHỌN TẤT CẢ ({items.length} sản phẩm trong giỏ)</span>
            </label>

            <span style={{ fontSize: "13px", color: "#666" }}>
              Đã chọn <strong>{selectedItems.length}</strong> sản phẩm để thanh toán
            </span>
          </div>

          {/* Cart Item Cards */}
          {items.map((item) => {
            const isChecked = isItemSelected(item.productId);
            return (
              <div
                key={item.productId}
                style={{
                  background: isChecked ? "#fff" : "#fafafa",
                  borderRadius: "8px",
                  padding: "16px",
                  marginBottom: "14px",
                  border: isChecked ? "1px solid #e0e0e0" : "1px dashed #ddd",
                  opacity: isChecked ? 1 : 0.8,
                  display: "flex",
                  gap: "14px",
                  alignItems: "center",
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

                  {/* Actions row: Save for later */}
                  <div style={{ display: "flex", gap: "14px", marginTop: "10px", paddingLeft: "100px", fontSize: "13px" }}>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#007185", cursor: "pointer", fontWeight: 600, padding: 0 }}
                      onClick={() => saveForLater(item.productId)}
                    >
                      📦 Lưu lại mua sau
                    </button>
                    <span style={{ color: "#ccc" }}>|</span>
                    <button
                      type="button"
                      style={{ background: "none", border: "none", color: "#b12704", cursor: "pointer", padding: 0 }}
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
            <div style={{ marginTop: "36px", background: "#fff", borderRadius: "8px", padding: "20px", border: "1px solid #e0e0e0" }}>
              <h3 style={{ fontSize: "17px", fontWeight: 800, margin: "0 0 16px", color: "#111" }}>
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
                        <div style={{ color: "#ee4d2d", fontWeight: 700, fontSize: "14px" }}>
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
          <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px" }}>Tóm Tắt Đơn Hàng</h2>

          {/* Voucher Input Box */}
          <div style={{ marginBottom: "18px", borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
            <label style={{ fontSize: "13px", fontWeight: 700, display: "block", marginBottom: "6px" }}>
              Mã Giảm Giá / Voucher Sàn:
            </label>
            <form onSubmit={handleVoucherSubmit} style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                className="shopee-form-input"
                placeholder="Nhập: AMAZON10, FREESHIP"
                value={voucherInput}
                onChange={(e) => setVoucherInput(e.target.value)}
                style={{ fontSize: "13px", textTransform: "uppercase" }}
              />
              <button type="submit" className="shopee-btn shopee-btn-secondary" style={{ whiteSpace: "nowrap" }}>
                Áp Dụng
              </button>
            </form>

            {voucherMessage && (
              <div style={{ fontSize: "12px", color: appliedVoucher ? "#2e7d32" : "#d32f2f", marginTop: "6px", fontWeight: 600 }}>
                {voucherMessage}
              </div>
            )}

            {appliedVoucher && (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#e8f5e9", padding: "6px 10px", borderRadius: "4px", marginTop: "8px", fontSize: "12px", color: "#2e7d32" }}>
                <span>✓ Mã: <strong>{appliedVoucher.code}</strong> (-{formatCurrency(voucherDiscount)})</span>
                <button
                  type="button"
                  onClick={removeVoucher}
                  style={{ background: "none", border: "none", color: "#d32f2f", cursor: "pointer", fontWeight: 700 }}
                >
                  ✕ Gỡ
                </button>
              </div>
            )}
          </div>

          {/* Price Breakdown */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "14px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666" }}>Sản phẩm đã chọn:</span>
              <span style={{ fontWeight: 600 }}>{selectedItems.length} món</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666" }}>Tạm tính:</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(selectedSubtotal)}</span>
            </div>

            {voucherDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#2e7d32" }}>
                <span>Giảm giá Voucher:</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "#666" }}>Phí vận chuyển dự kiến:</span>
              <span style={{ fontWeight: 600 }}>
                {shippingFee === 0 ? "MIỄN PHÍ" : formatCurrency(shippingFee)}
              </span>
            </div>

            <div style={{ borderTop: "2px solid #333", paddingTop: "12px", marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "16px", fontWeight: 800 }}>TỔNG CỘNG:</span>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "#ee4d2d" }}>
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
              Tiến Hành Thanh Toán ({selectedItems.length}) →
            </Link>
          ) : (
            <button
              type="button"
              className="shopee-btn shopee-btn-secondary"
              disabled
              style={{ width: "100%", padding: "14px", fontSize: "14px", opacity: 0.6 }}
            >
              Vui lòng chọn sản phẩm để thanh toán
            </button>
          )}

          <div style={{ textAlign: "center", marginTop: "14px" }}>
            <Link to="/" style={{ fontSize: "13px", color: "#007185", textDecoration: "none" }}>
              ← Tiếp tục chọn thêm sản phẩm
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
