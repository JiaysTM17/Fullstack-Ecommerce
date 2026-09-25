import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import VoucherPickerModal from "../components/VoucherPickerModal";
import { createOrder } from "../services/orderService";
import { formatCurrency } from "../utils/formatCurrency";
import "../styles/checkout-multistep.css";

const SHIPPING_OPTIONS = [
  { id: "standard", name: "Giao Tiêu Chuẩn (2-3 ngày)", fee: 25000, desc: "Đơn vị vận chuyển SPX Express an toàn, tiết kiệm" },
  { id: "express", name: "Giao Hỏa Tốc 2H (Prime Express)", fee: 45000, desc: "Nhận hàng trong vòng 2 giờ kể từ khi shop xác nhận" },
  { id: "economy", name: "Giao Tiết Kiệm (4-5 ngày)", fee: 15000, desc: "Tối ưu chi phí cho các đơn hàng cồng kềnh" },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  const {
    items,
    selectedItems,
    selectedSubtotal,
    appliedVoucher,
    voucherDiscount,
    applyVoucher,
    removeVoucher,
    clearCart,
  } = useCart();

  const [showVoucherModal, setShowVoucherModal] = useState(false);

  const handleCopyAccount = () => {
    navigator.clipboard?.writeText("0909123456");
    showToast(t('copied_account', "Đã sao chép số tài khoản MBBank: 0909123456"), "success");
  };

  // Active items for checkout
  const checkoutItems = selectedItems.length > 0 ? selectedItems : items;
  const currentSubtotal = selectedSubtotal > 0 ? selectedSubtotal : items.reduce((t, i) => t + i.price * i.quantity, 0);

  // Stepper state (1: Address, 2: Shipping, 3: Payment, 4: Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Load saved addresses
  const [savedAddresses] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_saved_addresses');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const defaultSaved = savedAddresses.find((a) => a.isDefault) || savedAddresses[0];

  // Form State
  const [fullName, setFullName] = useState(defaultSaved?.name || user?.fullName || "Nguyễn Văn A");
  const [phone, setPhone] = useState(defaultSaved?.phone || user?.phone || "0909123456");
  const [email, setEmail] = useState(user?.email || "khachhang@shopee.vn");
  const [address, setAddress] = useState(defaultSaved?.address || user?.address || "123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh");
  const [note, setNote] = useState("");

  // Shipping Method
  const [selectedShipping, setSelectedShipping] = useState("standard");

  // Payment Method
  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardHolder, setCardHolder] = useState("NGUYEN VAN A");
  const [cardExpiry, setCardExpiry] = useState("12/28");

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  if (checkoutItems.length === 0) {
    return <Navigate to="/cart" replace />;
  }

  const shippingOption = SHIPPING_OPTIONS.find((s) => s.id === selectedShipping) || SHIPPING_OPTIONS[0];
  const finalShippingFee = appliedVoucher?.type === "shipping" ? 0 : shippingOption.fee;
  const finalOrderTotal = Math.max(0, currentSubtotal - voucherDiscount + finalShippingFee);

  async function handleFinalPlaceOrder() {
    setSubmitError("");
    setSubmitting(true);

    const orderPayload = {
      customer: {
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        note: note.trim(),
      },
      items: checkoutItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.image,
        quantity: item.quantity,
        shopId: item.shopId || "shop_01",
      })),
      subtotal: currentSubtotal,
      voucherCode: appliedVoucher?.code || null,
      voucherDiscount,
      shippingFee: finalShippingFee,
      shippingMethod: shippingOption.name,
      total: finalOrderTotal,
      paymentMethod,
    };

    try {
      const order = await createOrder(orderPayload);
      const generatedOrderId = order?.orderId || order?._id || order?.id || `ORD${Math.floor(100000 + Math.random() * 900000)}`;
      const trackingCode = `SPX-VN-${Math.floor(10000000 + Math.random() * 90000000)}`;
      const nowStr = new Date().toLocaleString('vi-VN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit', year: 'numeric' });

      // Build customer order record for OrderHistoryPage
      const newCustomerOrder = {
        orderId: generatedOrderId,
        trackingCode,
        createdAt: nowStr,
        shopName: checkoutItems[0]?.shopId === 'shop_02' ? 'TechWorld Store' : 'Thời Trang GenZ Official',
        items: checkoutItems.map((it) => ({
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
        })),
        total: finalOrderTotal,
        status: 'pending',
        statusText: 'Chờ xác nhận & đóng gói',
        stepIndex: 1,
        paymentMethod: paymentMethod === 'BANK' ? 'Chuyển khoản VietQR' : paymentMethod === 'MOMO' ? 'Ví MoMo/ZaloPay' : paymentMethod === 'CARD' ? 'Thẻ Tín Dụng' : 'COD',
        timeline: [
          { time: nowStr, text: 'Đơn hàng đã được đặt thành công trên hệ thống' },
          { time: 'Dự kiến hôm nay', text: 'Người bán đang chuẩn bị hàng và in vận đơn SPX Express' },
        ],
      };

      try {
        const existingOrders = JSON.parse(localStorage.getItem('mini_shopee_customer_orders') || '[]');
        localStorage.setItem('mini_shopee_customer_orders', JSON.stringify([newCustomerOrder, ...existingOrders]));
      } catch {
        // ignore
      }

      clearCart();
      navigate("/order-success", {
        replace: true,
        state: {
          orderId: generatedOrderId,
          total: finalOrderTotal,
          paymentMethod,
        },
      });
    } catch (err) {
      setSubmitError(err.message || "Không thể tạo đơn hàng, vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="shopee-container" style={{ padding: "24px 0" }}>
      {/* 4-Step Progress Indicator */}
      <nav className="checkout-steps-nav">
        <div className={`checkout-step-item ${currentStep === 1 ? "active" : currentStep > 1 ? "completed" : ""}`}>
          <div className="checkout-step-number">{currentStep > 1 ? "✓" : "1"}</div>
          <span>1. Địa Chỉ Nhận Hàng</span>
        </div>
        <span style={{ color: "#ccc" }}>→</span>

        <div className={`checkout-step-item ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}>
          <div className="checkout-step-number">{currentStep > 2 ? "✓" : "2"}</div>
          <span>2. Vận Chuyển</span>
        </div>
        <span style={{ color: "#ccc" }}>→</span>

        <div className={`checkout-step-item ${currentStep === 3 ? "active" : currentStep > 3 ? "completed" : ""}`}>
          <div className="checkout-step-number">{currentStep > 3 ? "✓" : "3"}</div>
          <span>3. Phương Thức Thanh Toán</span>
        </div>
        <span style={{ color: "#ccc" }}>→</span>

        <div className={`checkout-step-item ${currentStep === 4 ? "active" : ""}`}>
          <div className="checkout-step-number">4</div>
          <span>4. Xác Nhận & Đặt Hàng</span>
        </div>
      </nav>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "28px", alignItems: "start" }}>
        {/* Left Column: Multi-Step Forms */}
        <section style={{ background: "#fff", borderRadius: "10px", padding: "24px", border: "1px solid #e0e0e0" }}>
          {/* STEP 1: Address */}
          {currentStep === 1 && (
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px" }}>
                📍 Bước 1: Chọn Địa Chỉ Giao Hàng
              </h2>

              <div className="address-card-grid">
                {savedAddresses.length > 0 ? (
                  savedAddresses.map((addr) => {
                    const isSelected = fullName === addr.name && phone === addr.phone && address === addr.address;
                    return (
                      <div
                        key={addr.id}
                        className={`address-card ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          setFullName(addr.name);
                          setPhone(addr.phone);
                          setAddress(addr.address);
                        }}
                        style={{ cursor: "pointer" }}
                      >
                        {addr.isDefault && <span className="address-default-badge">✓ MẶC ĐỊNH</span>}
                        <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>
                          {addr.name} ({addr.phone}) · <span style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>{addr.tag}</span>
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.5" }}>
                          {addr.address}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="address-card selected">
                    <span className="address-default-badge">✓ MẶC ĐỊNH</span>
                    <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{fullName} ({phone})</div>
                    <div style={{ color: "var(--text-secondary)", fontSize: "13.5px", lineHeight: "1.5" }}>{address}</div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px", background: "#fafafa", padding: "16px", borderRadius: "8px", border: "1px solid #eee" }}>
                <div style={{ fontSize: "13px", fontWeight: 700, color: "#333" }}>Hoặc cập nhật thông tin người nhận:</div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600 }}>Họ và tên:</label>
                    <input
                      type="text"
                      className="shopee-form-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 600 }}>Số điện thoại:</label>
                    <input
                      type="text"
                      className="shopee-form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600 }}>Địa chỉ chi tiết (Số nhà, đường, phường, quận):</label>
                  <input
                    type="text"
                    className="shopee-form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ marginTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  onClick={() => setCurrentStep(2)}
                >
                  Tiếp Tục: Chọn Vận Chuyển →
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px" }}>
                🚀 Bước 2: Tốc Độ & Phương Thức Vận Chuyển
              </h2>

              <div className="shipping-options-list">
                {SHIPPING_OPTIONS.map((opt) => (
                  <div
                    key={opt.id}
                    className={`shipping-option-card ${selectedShipping === opt.id ? "selected" : ""}`}
                    onClick={() => setSelectedShipping(opt.id)}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px" }}>{opt.name}</div>
                      <div style={{ color: "#666", fontSize: "13px" }}>{opt.desc}</div>
                    </div>
                    <div className="shipping-price-tag">
                      {appliedVoucher?.type === "shipping" ? "MIỄN PHÍ" : formatCurrency(opt.fee)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setCurrentStep(1)}
                >
                  ← Quay Lại Địa Chỉ
                </button>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  onClick={() => setCurrentStep(3)}
                >
                  Tiếp Tục: Chọn Thanh Toán →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px" }}>
                💳 Bước 3: Phương Thức Thanh Toán
              </h2>

              <div className="payment-methods-grid">
                {/* 1. COD */}
                <div
                  className={`payment-method-card ${paymentMethod === "COD" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("COD")}
                >
                  <div className="payment-card-content">
                    <span className="payment-method-icon">💵</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>Thanh toán khi nhận hàng (COD)</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>Nhận hàng kiểm tra xong mới trả tiền mặt cho shipper</div>
                    </div>
                  </div>
                </div>

                {/* 2. Credit Card */}
                <div
                  className={`payment-method-card ${paymentMethod === "CARD" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("CARD")}
                >
                  <div className="payment-card-content">
                    <span className="payment-method-icon">💳</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>Thẻ Tín Dụng / Ghi Nợ Quốc Tế (Visa, MasterCard)</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>Bảo mật mã hóa quốc tế 3D-Secure 256-bit</div>
                    </div>
                  </div>

                  {paymentMethod === "CARD" && (
                    <div style={{ marginTop: "14px", padding: "14px", background: "#f8f9fa", borderRadius: "6px", border: "1px solid #ddd" }}>
                      <div style={{ marginBottom: "10px" }}>
                        <label style={{ fontSize: "11px", fontWeight: 700 }}>SỐ THẺ VISA / MASTERCARD:</label>
                        <input
                          type="text"
                          className="shopee-form-input"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 700 }}>TÊN CHỦ THẺ:</label>
                          <input
                            type="text"
                            className="shopee-form-input"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value)}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "11px", fontWeight: 700 }}>HẠN DÙNG (MM/YY):</label>
                          <input
                            type="text"
                            className="shopee-form-input"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. MoMo */}
                <div
                  className={`payment-method-card ${paymentMethod === "MOMO" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("MOMO")}
                >
                  <div className="payment-card-content">
                    <span className="payment-method-icon">👛</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>Ví Điện Tử MoMo / ZaloPay</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>Quét mã QR trên ứng dụng ví để thanh toán tức thì</div>
                    </div>
                  </div>
                </div>

                {/* 4. Bank Transfer VietQR */}
                <div
                  className={`payment-method-card ${paymentMethod === "BANK" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("BANK")}
                >
                  <div className="payment-card-content">
                    <span className="payment-method-icon">🏦</span>
                    <div>
                      <div style={{ fontWeight: 700 }}>Chuyển Khoản Ngân Hàng (VietQR Tự Động)</div>
                      <div style={{ fontSize: "12px", color: "#666" }}>Miễn phí chuyển khoản qua mọi App ngân hàng tại VN</div>
                    </div>
                  </div>

                  {paymentMethod === "BANK" && (
                    <div className="payment-qr-preview" style={{ textAlign: "center", marginTop: "12px", background: "var(--bg-muted, #f8f9fa)", padding: "16px", borderRadius: "8px", border: "1px solid var(--border-medium, #e2e8f0)" }}>
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=2|99|0909123456|MINI%20SHOPEE|${finalOrderTotal}|THANH%20TOAN%20DON%20HANG`}
                        alt="VietQR thanh toán"
                        className="payment-qr-img"
                        style={{ width: "150px", height: "150px", borderRadius: "6px", border: "1px solid #ddd" }}
                      />
                      <div style={{ fontSize: "13px", fontWeight: 700, marginTop: "8px", color: "var(--text-primary)" }}>
                        NGÂN HÀNG QUÂN ĐỘI (MBBANK)
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", margin: "6px 0" }}>
                        <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--primary-color)" }}>STK: 0909123456</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyAccount();
                          }}
                          style={{
                            background: "var(--primary-light, #fff7ed)",
                            border: "1px solid var(--primary-border, #fed7aa)",
                            color: "var(--primary-color, #ea580c)",
                            borderRadius: "4px",
                            padding: "2px 8px",
                            fontSize: "11px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          📋 {t('copy', 'Sao chép')}
                        </button>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Chủ TK: CONG TY TNHH MINI SHOPEE</div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-success, #10b981)", marginTop: "4px" }}>
                        Số tiền: {formatCurrency(finalOrderTotal)}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setCurrentStep(2)}
                >
                  ← Quay Lại Vận Chuyển
                </button>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  onClick={() => setCurrentStep(4)}
                >
                  Tiếp Tục: Xem Lại Đơn Hàng →
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review and Place Order */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px" }}>
                📋 Bước 4: Kiểm Tra & Đặt Hàng
              </h2>

              {submitError && (
                <div style={{ background: "#ffebee", color: "#d32f2f", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
                  {submitError}
                </div>
              )}

              {/* Delivery and payment summary */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "#fdfdfd", border: "1px solid #e0e0e0", borderRadius: "8px", padding: "16px", marginBottom: "20px", fontSize: "13.5px" }}>
                <div>
                  <div style={{ fontWeight: 700, color: "#555", marginBottom: "4px" }}>GIAO TỚI:</div>
                  <div style={{ fontWeight: 700 }}>{fullName} · {phone}</div>
                  <div style={{ color: "#444" }}>{address}</div>
                </div>

                <div>
                  <div style={{ fontWeight: 700, color: "#555", marginBottom: "4px" }}>VẬN CHUYỂN & THANH TOÁN:</div>
                  <div>Gói: <strong>{shippingOption.name}</strong></div>
                  <div>Thanh toán: <strong>{paymentMethod}</strong></div>
                </div>
              </div>

              {/* Voucher status banner in Step 4 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-page, #f8fafc)", border: "1px solid var(--border-medium, #e2e8f0)", borderRadius: "8px", padding: "12px 16px", marginBottom: "20px", fontSize: "13.5px" }}>
                <div>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)" }}>🎟️ Voucher Áp Dụng: </span>
                  {appliedVoucher ? (
                    <strong style={{ color: "var(--primary-color, #ea580c)" }}>{appliedVoucher.code} ({appliedVoucher.name}) - Giảm {formatCurrency(voucherDiscount)}</strong>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>Chưa chọn voucher nào</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  style={{ background: "none", border: "none", color: "var(--primary-color, #ea580c)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  {appliedVoucher ? "Đổi mã khác >" : "+ Chọn mã giảm giá >"}
                </button>
              </div>

              {/* Item rows */}
              <div style={{ marginBottom: "20px" }}>
                <div style={{ fontWeight: 700, fontSize: "14px", marginBottom: "8px" }}>
                  Danh sách sản phẩm ({checkoutItems.length}):
                </div>
                {checkoutItems.map((item) => (
                  <div
                    key={item.productId}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 0",
                      borderBottom: "1px solid var(--border-light, #f0f0f0)",
                      fontSize: "13.5px",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={item.image}
                        alt={item.name}
                        style={{ width: "48px", height: "48px", objectFit: "cover", borderRadius: "4px" }}
                      />
                      <div>
                        <div style={{ fontWeight: 600 }}>{item.name}</div>
                        <div style={{ color: "var(--text-muted)", fontSize: "12px" }}>Số lượng: x{item.quantity}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, color: "var(--primary-color, #ee4d2d)" }}>
                      {formatCurrency(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Order Note */}
              <div style={{ marginBottom: "24px" }}>
                <label style={{ fontSize: "13px", fontWeight: 600, display: "block", marginBottom: "4px" }}>
                  Ghi chú cho đơn hàng (tùy chọn):
                </label>
                <input
                  type="text"
                  className="shopee-form-input"
                  placeholder="Ví dụ: Giao hàng vào giờ hành chính, gọi trước khi giao"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setCurrentStep(3)}
                >
                  ← Sửa Phương Thức
                </button>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  style={{ padding: "12px 32px", fontSize: "16px", fontWeight: 800 }}
                  disabled={submitting}
                  onClick={handleFinalPlaceOrder}
                >
                  {submitting ? "Đang xử lý đơn hàng..." : `✓ Xác Nhận Đặt Hàng (${formatCurrency(finalOrderTotal)})`}
                </button>
              </div>
            </div>
          )}
        </section>

        {/* Right Column: Mini Bill Summary */}
        <aside style={{ background: "var(--bg-card, #fff)", borderRadius: "10px", padding: "20px", border: "1px solid var(--border-medium, #e0e0e0)" }}>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 16px", color: "var(--text-primary)" }}>Bảng Kê Chi Phí</h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #666)" }}>Tiền hàng ({checkoutItems.length} món):</span>
              <span style={{ fontWeight: 600 }}>{formatCurrency(currentSubtotal)}</span>
            </div>

            {/* Interactive Voucher Section in Checkout summary */}
            <div style={{ borderTop: "1px dashed var(--border-medium, #ddd)", borderBottom: "1px dashed var(--border-medium, #ddd)", padding: "10px 0", margin: "4px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>🎟️ Voucher / Giảm giá:</span>
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  style={{ background: "none", border: "none", color: "var(--primary-color, #ea580c)", fontWeight: 700, fontSize: "13px", cursor: "pointer" }}
                >
                  {appliedVoucher ? "Đổi mã >" : "Chọn mã >"}
                </button>
              </div>

              {appliedVoucher ? (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", background: "var(--primary-light, rgba(234, 88, 12, 0.08))", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--primary-color, #ea580c)" }}>
                  <span style={{ fontSize: "12.5px", fontWeight: 800, color: "var(--primary-color, #ea580c)" }}>
                    ✓ {appliedVoucher.code} ({appliedVoucher.type === 'shipping' ? 'Miễn phí ship' : `-${formatCurrency(voucherDiscount)}`})
                  </span>
                  <button
                    type="button"
                    onClick={removeVoucher}
                    style={{ background: "none", border: "none", color: "var(--color-error, #d32f2f)", cursor: "pointer", fontWeight: 700, fontSize: "12px" }}
                  >
                    ✕ Gỡ
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  style={{ width: "100%", marginTop: "8px", padding: "8px", borderRadius: "6px", border: "1px dashed var(--primary-color, #ea580c)", background: "transparent", color: "var(--primary-color, #ea580c)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer" }}
                >
                  + Nhấn để chọn mã giảm giá / Freeship
                </button>
              )}
            </div>

            {voucherDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-success, #2e7d32)" }}>
                <span>Voucher giảm giá ({appliedVoucher?.code}):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}

            {appliedVoucher?.type === "shipping" && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-success, #2e7d32)" }}>
                <span>Ưu đãi FreeShip ({appliedVoucher.code}):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(shippingOption.fee)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-secondary, #666)" }}>Phí vận chuyển:</span>
              <span style={{ fontWeight: 600 }}>
                {finalShippingFee === 0 ? "MIỄN PHÍ" : formatCurrency(finalShippingFee)}
              </span>
            </div>

            <div style={{ borderTop: "2px solid var(--border-dark, #222)", paddingTop: "12px", marginTop: "4px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "15px", fontWeight: 800 }}>TỔNG CỘNG:</span>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary-color, #ee4d2d)" }}>
                {formatCurrency(finalOrderTotal)}
              </span>
            </div>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-muted, #777)", lineHeight: "1.5", borderTop: "1px solid var(--border-light, #eee)", paddingTop: "12px" }}>
            🔒 Nhấn "Xác Nhận Đặt Hàng" đồng nghĩa bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Mini Shopee.
          </div>
        </aside>
      </div>

      {/* Voucher Picker Modal */}
      <VoucherPickerModal
        isOpen={showVoucherModal}
        onClose={() => setShowVoucherModal(false)}
        onApplyVoucher={(code) => applyVoucher(code)}
        onRemoveVoucher={removeVoucher}
        appliedVoucher={appliedVoucher}
        currentSubtotal={currentSubtotal}
      />
    </main>
  );
}
