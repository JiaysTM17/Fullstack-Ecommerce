import React, { useState, useEffect } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import VoucherPickerModal from "../components/VoucherPickerModal";
import VietQRPaymentModal from "../components/VietQRPaymentModal";
import { useCoins } from "../context/CoinContext";
import { createOrder } from "../services/orderService";
import { deductProductStock } from "../services/productService";
import { formatCurrency } from "../utils/formatCurrency";
import { pushBuyerNotification } from "../utils/notificationHelper";
import {
  getSavedAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getDefaultAddress,
} from "../services/addressService";
import {
  MapPinIcon,
  TruckIcon,
  CreditCardIcon,
  CheckIcon,
  PencilIcon,
  StarIcon,
  TicketIcon,
  ShieldCheckIcon,
  CoinIcon,
  CloseIcon,
  CopyIcon,
  LockIcon,
  PackageIcon,
  TagIcon,
  StoreIcon,
  HomeIcon,
  BoltIcon,
  ChevronRightIcon,
  ArrowLeftIcon,
  QrCodeIcon,
  TrashIcon,
} from "../components/OrdersIcons";
import "../styles/checkout-multistep.css";

const SHIPPING_OPTIONS = [
  {
    id: "standard",
    name: "Giao Tiêu Chuẩn (2-3 ngày)",
    fee: 25000,
    desc: "Đơn vị vận chuyển SPX Express an toàn, tiết kiệm",
    icon: TruckIcon,
    iconColor: "#2563eb",
    iconBg: "rgba(37, 99, 235, 0.1)",
  },
  {
    id: "express",
    name: "Giao Hỏa Tốc 2H (Prime Express)",
    fee: 45000,
    desc: "Nhận hàng trong vòng 2 giờ kể từ khi shop xác nhận",
    icon: BoltIcon,
    iconColor: "#ea580c",
    iconBg: "rgba(234, 88, 12, 0.1)",
  },
  {
    id: "economy",
    name: "Giao Tiết Kiệm (4-5 ngày)",
    fee: 15000,
    desc: "Tối ưu chi phí cho các đơn hàng cồng kềnh",
    icon: PackageIcon,
    iconColor: "#16a34a",
    iconBg: "rgba(22, 163, 74, 0.1)",
  },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [shopNotes] = useState(() => {
    if (location.state?.shopNotes && Object.keys(location.state.shopNotes).length > 0) {
      return location.state.shopNotes;
    }
    try {
      const saved = localStorage.getItem("mini_shopee_cart_shop_notes");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const {
    items,
    selectedItems,
    selectedSubtotal,
    appliedVoucher,
    appliedDiscountVoucher,
    appliedShippingVoucher,
    voucherDiscount,
    shippingDiscount,
    applyVoucher,
    applyDiscountVoucher,
    applyShippingVoucher,
    removeVoucher,
    removeDiscountVoucher,
    removeShippingVoucher,
    clearCart,
  } = useCart();
  const { coins, redeemCoins, grantOrderSpin } = useCoins();

  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [useCoinsToggle, setUseCoinsToggle] = useState(false);
  const [showVietQRModal, setShowVietQRModal] = useState(false);

  const handleCopyAccount = () => {
    navigator.clipboard?.writeText("0909123456");
    showToast(t('copied_account', "Đã sao chép số tài khoản MBBank: 0909123456"), "success");
  };

  // Active items for checkout
  const checkoutItems = selectedItems.length > 0 ? selectedItems : items;
  const currentSubtotal = selectedSubtotal > 0 ? selectedSubtotal : items.reduce((t, i) => t + i.price * i.quantity, 0);

  // Stepper state (1: Address, 2: Shipping, 3: Payment, 4: Review)
  const [currentStep, setCurrentStep] = useState(1);

  // Address Book State
  const [savedAddresses, setSavedAddresses] = useState(() => getSavedAddresses(user));
  const defaultSaved = getDefaultAddress(savedAddresses);

  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddressForm, setNewAddressForm] = useState({
    name: '',
    phone: '',
    address: '',
    tag: 'Nhà riêng',
    isDefault: false,
  });

  const [showEditAddressModal, setShowEditAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [editAddressForm, setEditAddressForm] = useState({
    name: '',
    phone: '',
    address: '',
    tag: 'Nhà riêng',
    isDefault: false,
  });

  // Form State
  const [fullName, setFullName] = useState(defaultSaved?.name || defaultSaved?.fullName || user?.fullName || "Nguyễn Văn A");
  const [phone, setPhone] = useState(defaultSaved?.phone || user?.phone || "0909123456");
  const [email, setEmail] = useState(user?.email || "khachhang@shopee.vn");
  const [address, setAddress] = useState(defaultSaved?.address || user?.address || "123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh");
  const [note, setNote] = useState("");

  // Sync addresses with active user or external changes
  useEffect(() => {
    const list = getSavedAddresses(user);
    setSavedAddresses(list);
    const def = getDefaultAddress(list);
    if (def) {
      setFullName(def.name || def.fullName);
      setPhone(def.phone);
      setAddress(def.address);
    }
  }, [user]);

  useEffect(() => {
    const handleSync = () => {
      const list = getSavedAddresses(user);
      setSavedAddresses(list);
    };
    window.addEventListener('storage', handleSync);
    window.addEventListener('mini_shopee_address_updated', handleSync);
    return () => {
      window.removeEventListener('storage', handleSync);
      window.removeEventListener('mini_shopee_address_updated', handleSync);
    };
  }, [user]);

  const handleAddNewAddress = (e) => {
    e.preventDefault();
    if (!newAddressForm.name.trim() || !newAddressForm.phone.trim() || !newAddressForm.address.trim()) {
      showToast('Vui lòng điền đầy đủ tên người nhận, số điện thoại và địa chỉ!', 'error');
      return;
    }
    const updated = addAddress({
      name: newAddressForm.name.trim(),
      phone: newAddressForm.phone.trim(),
      address: newAddressForm.address.trim(),
      tag: newAddressForm.tag || 'Nhà riêng',
      isDefault: newAddressForm.isDefault || savedAddresses.length === 0,
    }, user);
    setSavedAddresses(updated);

    setFullName(newAddressForm.name.trim());
    setPhone(newAddressForm.phone.trim());
    setAddress(newAddressForm.address.trim());
    setShowAddAddressModal(false);
    setNewAddressForm({ name: '', phone: '', address: '', tag: 'Nhà riêng', isDefault: false });
    showToast('Đã thêm và tự động áp dụng địa chỉ giao hàng mới!', 'success');
  };

  const handleSetDefaultAddress = (addrId, e) => {
    e?.stopPropagation();
    const updated = setDefaultAddress(addrId, user);
    setSavedAddresses(updated);
    const target = updated.find((a) => a.id === addrId);
    if (target) {
      setFullName(target.name || target.fullName);
      setPhone(target.phone);
      setAddress(target.address);
    }
    showToast('Đã đặt làm địa chỉ mặc định!', 'info');
  };

  const handleOpenEditAddress = (addr, e) => {
    e?.stopPropagation();
    setEditingAddress(addr);
    setEditAddressForm({
      name: addr.name || addr.fullName || '',
      phone: addr.phone || '',
      address: addr.address || '',
      tag: addr.tag || 'Nhà riêng',
      isDefault: Boolean(addr.isDefault),
    });
    setShowEditAddressModal(true);
  };

  const handleEditAddressSubmit = (e) => {
    e.preventDefault();
    if (!editingAddress) return;
    if (!editAddressForm.name.trim() || !editAddressForm.phone.trim() || !editAddressForm.address.trim()) {
      showToast('Vui lòng điền đầy đủ họ tên, số điện thoại và địa chỉ!', 'error');
      return;
    }
    const updated = updateAddress(editingAddress.id, editAddressForm, user);
    setSavedAddresses(updated);
    if (fullName === (editingAddress.name || editingAddress.fullName)) {
      setFullName(editAddressForm.name.trim());
      setPhone(editAddressForm.phone.trim());
      setAddress(editAddressForm.address.trim());
    }
    setShowEditAddressModal(false);
    setEditingAddress(null);
    showToast('Đã cập nhật địa chỉ thành công!', 'success');
  };

  const handleDeleteAddress = (addrId, e) => {
    e?.stopPropagation();
    if (window.confirm('Bạn có chắc muốn xóa địa chỉ này?')) {
      const updated = deleteAddress(addrId, user);
      setSavedAddresses(updated);
      const def = getDefaultAddress(updated);
      if (def) {
        setFullName(def.name || def.fullName);
        setPhone(def.phone);
        setAddress(def.address);
      }
      showToast('Đã xóa địa chỉ thành công!', 'info');
    }
  };

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
  const appliedShippingDiscount = appliedShippingVoucher
    ? Math.min(appliedShippingVoucher.value || 30000, shippingOption.fee)
    : (appliedVoucher?.type === "shipping" ? shippingOption.fee : 0);
  const finalShippingFee = Math.max(0, shippingOption.fee - appliedShippingDiscount);
  
  // Coin calculation: 1 Xu = 1 VND, max 50% of currentSubtotal
  const maxCoinsUsable = Math.min(coins || 0, Math.floor(currentSubtotal * 0.5));
  const coinDiscount = (useCoinsToggle && maxCoinsUsable > 0) ? maxCoinsUsable : 0;
  const finalOrderTotal = Math.max(0, currentSubtotal - voucherDiscount - coinDiscount + finalShippingFee);

  async function handleFinalPlaceOrder() {
    setSubmitError("");
    setSubmitting(true);

    const activeVoucherCodes = [appliedDiscountVoucher?.code, appliedShippingVoucher?.code]
      .filter(Boolean)
      .join(" + ") || appliedVoucher?.code || null;

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
      voucherCode: activeVoucherCodes,
      voucherDiscount,
      shippingDiscount: appliedShippingDiscount,
      coinDiscount,
      coinsUsed: coinDiscount,
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

      // Deduct used coins if redeemed
      if (coinDiscount > 0) {
        redeemCoins(coinDiscount, generatedOrderId);
      }

      // 1. Tự động trừ tồn kho (stock) và tăng số lượng đã bán (sold) của các sản phẩm vừa mua
      deductProductStock(checkoutItems);

      // Group checkout items by shopId
      const itemsByShop = {};
      checkoutItems.forEach((it) => {
        const sId = it.shopId || "shop_01";
        if (!itemsByShop[sId]) {
          itemsByShop[sId] = [];
        }
        itemsByShop[sId].push(it);
      });

      const shopKeys = Object.keys(itemsByShop);
      const allocatedShippingFee = Math.round(finalShippingFee / Math.max(1, shopKeys.length));
      const allocatedVoucherDiscount = Math.round(voucherDiscount / Math.max(1, shopKeys.length));

      // 2. Tạo đơn hàng gửi trực tiếp về Kênh Quản Lý Người Bán cho từng Shop
      const newSellerOrders = shopKeys.map((sId) => {
        const shopItems = itemsByShop[sId];
        const shopSubtotal = shopItems.reduce((acc, it) => acc + (it.price * it.quantity), 0);
        const shopTotal = Math.max(0, shopSubtotal + allocatedShippingFee - allocatedVoucherDiscount);

        return {
          orderId: generatedOrderId,
          shopId: sId,
          customerName: fullName || "Khách Hàng",
          phone: phone || "0901234567",
          address: address || "TP. Hồ Chí Minh / Hà Nội",
          productName: shopItems.map((it) => `${it.name} (x${it.quantity})`).join(", "),
          items: shopItems.map((it) => ({
            productId: it.productId || it._id || it.id,
            id: it.productId || it._id || it.id,
            name: it.name,
            price: it.price,
            quantity: it.quantity,
            image: it.image,
          })),
          total: shopTotal,
          shippingFee: allocatedShippingFee,
          paymentMethod: paymentMethod === 'BANK' ? 'VietQR Ngân Hàng' : paymentMethod === 'MOMO' ? 'Ví MoMo' : paymentMethod === 'CARD' ? 'Thẻ Tín Dụng' : 'Thanh toán khi nhận hàng (COD)',
          trackingCode: trackingCode,
          status: 'pending',
          statusText: 'Chờ xác nhận',
          createdAt: nowStr,
          note: note || '',
        };
      });

      try {
        const existingSellerOrdersRaw = localStorage.getItem('mini_shopee_seller_orders');
        const existingSellerOrders = existingSellerOrdersRaw ? JSON.parse(existingSellerOrdersRaw) : [];
        const mergedSellerOrders = [...newSellerOrders, ...existingSellerOrders];
        localStorage.setItem('mini_shopee_seller_orders', JSON.stringify(mergedSellerOrders));

        // Phát sự kiện thông báo thời gian thực tới Kênh Người Bán
        window.dispatchEvent(new CustomEvent('mini_shopee_order_placed', { detail: newSellerOrders }));
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error("Lỗi đồng bộ đơn hàng người bán:", err);
      }

      // Build customer order record for OrderHistoryPage
      const newCustomerOrder = {
        orderId: generatedOrderId,
        userId: user?.id || 'user_customer_01',
        trackingCode,
        createdAt: nowStr,
        shopName: checkoutItems[0]?.shopName || (checkoutItems[0]?.shopId === 'shop_02' ? 'TechWorld Store' : 'Thời Trang GenZ Official'),
        shopId: checkoutItems[0]?.shopId || 'shop_01',
        items: checkoutItems.map((it) => ({
          productId: it.productId || it._id || it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          image: it.image,
          shopId: it.shopId || 'shop_01',
        })),
        total: finalOrderTotal,
        coinDiscount,
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

      // Phát thông báo tức thời tới Notification Center của Người Mua
      pushBuyerNotification({
        type: 'order',
        title: `Đặt hàng thành công #${generatedOrderId}`,
        message: `Đơn hàng trị giá ${formatCurrency(finalOrderTotal)} đã được ghi nhận. Bạn được tặng +1 lượt quay may mắn!`,
        link: '/orders',
      });

      // Tặng +1 lượt quay Vòng Quay May Mắn cho đơn hàng thành công
      if (typeof grantOrderSpin === 'function') {
        grantOrderSpin(generatedOrderId);
      }

      clearCart();
      navigate("/order-success", {
        replace: true,
        state: {
          orderId: generatedOrderId,
          total: finalOrderTotal,
          paymentMethod,
          shippingAddress: address,
          customerName: fullName,
          phone,
          items: checkoutItems,
          voucherDiscount,
          shippingFee: finalShippingFee,
          voucherCode: activeVoucherCodes,
          earnedSpin: 1,
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
          <div className="checkout-step-number">{currentStep > 1 ? <CheckIcon size={12} color="#ffffff" /> : "1"}</div>
          <span>1. Địa Chỉ Nhận Hàng</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", color: "#94a3b8" }}>
          <ChevronRightIcon size={14} color="#94a3b8" />
        </span>

        <div className={`checkout-step-item ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}>
          <div className="checkout-step-number">{currentStep > 2 ? <CheckIcon size={12} color="#ffffff" /> : "2"}</div>
          <span>2. Vận Chuyển</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", color: "#94a3b8" }}>
          <ChevronRightIcon size={14} color="#94a3b8" />
        </span>

        <div className={`checkout-step-item ${currentStep === 3 ? "active" : currentStep > 3 ? "completed" : ""}`}>
          <div className="checkout-step-number">{currentStep > 3 ? <CheckIcon size={12} color="#ffffff" /> : "3"}</div>
          <span>3. Phương Thức Thanh Toán</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", color: "#94a3b8" }}>
          <ChevronRightIcon size={14} color="#94a3b8" />
        </span>

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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
                <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, display: "inline-flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "1px solid #fed7aa", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <MapPinIcon size={16} color="#ea580c" />
                  </span>
                  <span>Bước 1: Chọn Địa Chỉ Giao Hàng</span>
                </h2>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  style={{ fontSize: "12.5px", padding: "6px 14px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => setShowAddAddressModal(true)}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlusIcon size={11} color="#ea580c" />
                  </span>
                  <span>Thêm Địa Chỉ Mới</span>
                </button>
              </div>

              <div className="address-card-grid">
                {savedAddresses.length > 0 ? (
                  savedAddresses.map((addr) => {
                    const isSelected = fullName === (addr.name || addr.fullName) && phone === addr.phone && address === addr.address;
                    return (
                      <div
                        key={addr.id}
                        className={`address-card ${isSelected ? "selected" : ""}`}
                        onClick={() => {
                          setFullName(addr.name || addr.fullName);
                          setPhone(addr.phone);
                          setAddress(addr.address);
                        }}
                        style={{ cursor: "pointer", position: "relative" }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                          <div style={{ fontWeight: 700, fontSize: "14.5px", display: "inline-flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                            <span>{addr.name || addr.fullName} ({addr.phone})</span>
                            <span style={{ fontSize: "11px", color: "#2563eb", background: "rgba(37, 99, 235, 0.08)", border: "1px solid rgba(37, 99, 235, 0.2)", padding: "2px 8px", borderRadius: "12px", display: "inline-flex", alignItems: "center", gap: "5px", fontWeight: 600 }}>
                              <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                {addr.tag === 'Văn Phòng' ? <StoreIcon size={9} color="#2563eb" /> : <HomeIcon size={9} color="#2563eb" />}
                              </span>
                              <span>{addr.tag || 'Nhà Riêng'}</span>
                            </span>
                          </div>
                          {addr.isDefault && (
                            <span className="address-default-badge" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckIcon size={9} color="#ffffff" />
                              </span>
                              <span>MẶC ĐỊNH</span>
                            </span>
                          )}
                        </div>
                        <div style={{ color: "var(--text-secondary)", fontSize: "13px", lineHeight: "1.4", display: "flex", alignItems: "flex-start", gap: "8px" }}>
                          <span style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: "2px" }}>
                            <MapPinIcon size={12} color="#2563eb" />
                          </span>
                          <span>{addr.address}</span>
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px", paddingTop: "8px", borderTop: "1px dashed var(--border-light, #e2e8f0)" }}>
                          <div>
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--primary-color, #ea580c)",
                                  fontSize: "11.5px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: "2px 0",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "6px",
                                }}
                              >
                                <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <StarIcon size={10} color="#ea580c" />
                                </span>
                                <span>Đặt mặc định</span>
                              </button>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditAddress(addr, e)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "var(--text-secondary, #475569)",
                                fontSize: "11.5px",
                                fontWeight: 600,
                                cursor: "pointer",
                                padding: "2px 4px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                              title="Sửa địa chỉ"
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <PencilIcon size={10} color="#64748b" />
                              </span>
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(addr.id, e)}
                              style={{
                                background: "none",
                                border: "none",
                                color: "#ef4444",
                                fontSize: "11.5px",
                                cursor: "pointer",
                                padding: "2px 4px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontWeight: 600,
                              }}
                              title="Xóa địa chỉ"
                            >
                              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <TrashIcon size={10} color="#ef4444" />
                              </span>
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="address-card selected">
                    <span className="address-default-badge" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                      <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(5, 150, 105, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon size={9} color="#059669" />
                      </span>
                      <span>MẶC ĐỊNH</span>
                    </span>
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
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span>Tiếp Tục: Chọn Vận Chuyển</span>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRightIcon size={13} color="#ffffff" />
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping */}
          {currentStep === 2 && (
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", border: "1px solid #7dd3fc", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <TruckIcon size={16} color="#0284c7" />
                </span>
                <span>Bước 2: Tốc Độ & Phương Thức Vận Chuyển</span>
              </h2>

              <div className="shipping-options-list">
                {SHIPPING_OPTIONS.map((opt) => {
                  const IconComponent = opt.icon || TruckIcon;
                  const isSelected = selectedShipping === opt.id;
                  return (
                    <div
                      key={opt.id}
                      className={`shipping-option-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedShipping(opt.id)}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                        <div
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "10px",
                            background: opt.iconBg || "rgba(37, 99, 235, 0.1)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <IconComponent size={22} color={opt.iconColor || "#2563eb"} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>{opt.name}</span>
                            {isSelected && (
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                  background: "var(--primary-color, #ea580c)",
                                  color: "#ffffff",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  padding: "2px 8px",
                                  borderRadius: "12px",
                                }}
                              >
                                <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckIcon size={9} color="#ffffff" />
                                </span>
                                <span>Đã chọn</span>
                              </span>
                            )}
                          </div>
                          <div style={{ color: "#64748b", fontSize: "13px" }}>{opt.desc}</div>
                        </div>
                      </div>
                      <div className="shipping-price-tag">
                        {appliedVoucher?.type === "shipping" ? "MIỄN PHÍ" : formatCurrency(opt.fee)}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setCurrentStep(1)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeftIcon size={11} color="#64748b" />
                  </span>
                  <span>Quay Lại Địa Chỉ</span>
                </button>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  onClick={() => setCurrentStep(3)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span>Tiếp Tục: Chọn Thanh Toán</span>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRightIcon size={13} color="#ffffff" />
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {currentStep === 3 && (
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)", border: "1px solid #c4b5fd", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <CreditCardIcon size={16} color="#7c3aed" />
                </span>
                <span>Bước 3: Phương Thức Thanh Toán</span>
              </h2>

              <div className="payment-methods-grid">
                {/* 1. COD */}
                <div
                  className={`payment-method-card ${paymentMethod === "COD" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("COD")}
                >
                  <div className="payment-card-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span
                        className="payment-method-icon"
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: "rgba(16, 185, 129, 0.12)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <HomeIcon size={22} color="#10b981" />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>Thanh toán khi nhận hàng (COD)</span>
                          {paymentMethod === "COD" && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "var(--primary-color, #ea580c)",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "12px",
                              }}
                            >
                              <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckIcon size={9} color="#ffffff" />
                              </span>
                              <span>Đã chọn</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>Nhận hàng kiểm tra xong mới trả tiền mặt cho shipper</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Credit Card */}
                <div
                  className={`payment-method-card ${paymentMethod === "CARD" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("CARD")}
                >
                  <div className="payment-card-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span
                        className="payment-method-icon"
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: "rgba(37, 99, 235, 0.12)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CreditCardIcon size={22} color="#2563eb" />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>Thẻ Tín Dụng / Ghi Nợ Quốc Tế (Visa, MasterCard)</span>
                          {paymentMethod === "CARD" && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "var(--primary-color, #ea580c)",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "12px",
                              }}
                            >
                              <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckIcon size={9} color="#ffffff" />
                              </span>
                              <span>Đã chọn</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>Bảo mật mã hóa quốc tế 3D-Secure 256-bit</div>
                      </div>
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
                  <div className="payment-card-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span
                        className="payment-method-icon"
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: "rgba(217, 70, 239, 0.12)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <QrCodeIcon size={22} color="#d946ef" />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>Ví Điện Tử MoMo / ZaloPay</span>
                          {paymentMethod === "MOMO" && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "var(--primary-color, #ea580c)",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "12px",
                              }}
                            >
                              <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckIcon size={9} color="#ffffff" />
                              </span>
                              <span>Đã chọn</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>Quét mã QR trên ứng dụng ví để thanh toán tức thì</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Bank Transfer VietQR */}
                <div
                  className={`payment-method-card ${paymentMethod === "BANK" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("BANK")}
                >
                  <div className="payment-card-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                      <span
                        className="payment-method-icon"
                        style={{
                          width: "42px",
                          height: "42px",
                          borderRadius: "10px",
                          background: "rgba(2, 132, 199, 0.12)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <ShieldCheckIcon size={22} color="#0284c7" />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>Chuyển Khoản Ngân Hàng (VietQR Tự Động)</span>
                          {paymentMethod === "BANK" && (
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                background: "var(--primary-color, #ea580c)",
                                color: "#ffffff",
                                fontSize: "11px",
                                fontWeight: 700,
                                padding: "2px 8px",
                                borderRadius: "12px",
                              }}
                            >
                              <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <CheckIcon size={9} color="#ffffff" />
                              </span>
                              <span>Đã chọn</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "13px", color: "#64748b" }}>Miễn phí chuyển khoản qua mọi App ngân hàng tại VN</div>
                      </div>
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
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(37, 99, 235, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <CopyIcon size={11} color="#2563eb" />
                          </span>
                          <span>{t('copy', 'Sao chép')}</span>
                        </button>
                      </div>
                      <div style={{ fontSize: "11.5px", color: "var(--text-muted)" }}>Chủ TK: CONG TY TNHH FULLSTACK ECOMMERCE</div>
                      <div style={{ fontSize: "13px", fontWeight: 800, color: "var(--color-success, #10b981)", marginTop: "4px" }}>
                        Số tiền: {formatCurrency(finalOrderTotal)}
                      </div>
                      <div style={{ marginTop: "10px" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowVietQRModal(true);
                          }}
                          style={{
                            background: "linear-gradient(135deg, #0284c7, #0369a1)",
                            color: "#ffffff",
                            border: "none",
                            borderRadius: "6px",
                            padding: "7px 14px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 2px 6px rgba(2, 132, 199, 0.25)",
                          }}
                        >
                          <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255, 255, 255, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <QrCodeIcon size={13} color="#ffffff" />
                          </span>
                          <span>Mở Chi Tiết VietQR Động & Đếm Ngược</span>
                        </button>
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
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeftIcon size={11} color="#64748b" />
                  </span>
                  <span>Quay Lại Vận Chuyển</span>
                </button>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  onClick={() => setCurrentStep(4)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span>Tiếp Tục: Xem Lại Đơn Hàng</span>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRightIcon size={13} color="#ffffff" />
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: Review and Place Order */}
          {currentStep === 4 && (
            <div>
              <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 16px", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                <span style={{ width: "30px", height: "30px", borderRadius: "8px", background: "linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%)", border: "1px solid #86efac", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <ShieldCheckIcon size={16} color="#16a34a" />
                </span>
                <span>Bước 4: Kiểm Tra & Đặt Hàng</span>
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
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-page, #f8fafc)", border: "1px solid var(--border-medium, #e2e8f0)", borderRadius: "8px", padding: "12px 16px", marginBottom: "12px", fontSize: "13.5px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TicketIcon size={13} color="var(--primary-color, #ea580c)" />
                    </span>
                    <span>Voucher Áp Dụng:</span>
                  </span>
                  {(appliedDiscountVoucher || appliedShippingVoucher) ? (
                    <span style={{ marginLeft: "4px" }}>
                      {appliedShippingVoucher && (
                        <strong style={{ color: "#0284c7", marginRight: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TruckIcon size={11} color="#0284c7" />
                          </span>
                          <span>{appliedShippingVoucher.code} (-{formatCurrency(appliedShippingDiscount)})</span>
                        </strong>
                      )}
                      {appliedDiscountVoucher && (
                        <strong style={{ color: "var(--primary-color, #ea580c)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TagIcon size={11} color="var(--primary-color, #ea580c)" />
                          </span>
                          <span>{appliedDiscountVoucher.code} (-{formatCurrency(voucherDiscount)})</span>
                        </strong>
                      )}
                    </span>
                  ) : (
                    <span style={{ color: "var(--text-muted)" }}>Chưa chọn voucher nào</span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  style={{ background: "none", border: "none", color: "var(--primary-color, #ea580c)", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <span>{(appliedDiscountVoucher || appliedShippingVoucher) ? "Đổi mã khác" : "Chọn mã giảm giá"}</span>
                  <ChevronRightIcon size={12} color="var(--primary-color, #ea580c)" />
                </button>
              </div>

              {/* Mini Xu Redemption Banner in Step 4 */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: useCoinsToggle ? "rgba(245, 158, 11, 0.08)" : "var(--bg-page, #f8fafc)",
                  border: useCoinsToggle ? "1.5px solid #f59e0b" : "1px solid var(--border-medium, #e2e8f0)",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "20px",
                  fontSize: "13.5px",
                  transition: "all 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(245, 158, 11, 0.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <CoinIcon size={18} color="#f59e0b" />
                  </span>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--text-primary)" }}>
                      Dùng Mini Xu để thanh toán
                      <span style={{ color: "#d97706", marginLeft: "6px", fontWeight: 600 }}>
                        [Số dư: {(coins || 0).toLocaleString("vi-VN")} Xu]
                      </span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {maxCoinsUsable > 0
                        ? `Dùng ${maxCoinsUsable.toLocaleString("vi-VN")} Xu để giảm trực tiếp ${formatCurrency(maxCoinsUsable)} (tối đa 50% tiền hàng)`
                        : "Cần tối thiểu 1.000 Xu để áp dụng giảm trừ đơn hàng"}
                    </div>
                  </div>
                </div>

                <label
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    cursor: maxCoinsUsable > 0 ? "pointer" : "not-allowed",
                    userSelect: "none",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={useCoinsToggle}
                    disabled={maxCoinsUsable <= 0}
                    onChange={(e) => setUseCoinsToggle(e.target.checked)}
                    style={{
                      width: "18px",
                      height: "18px",
                      accentColor: "#d97706",
                      cursor: maxCoinsUsable > 0 ? "pointer" : "not-allowed",
                    }}
                  />
                  <span style={{ fontWeight: 700, color: useCoinsToggle ? "#d97706" : "var(--text-muted)", fontSize: "13px" }}>
                    {useCoinsToggle ? `Đang dùng ${maxCoinsUsable.toLocaleString("vi-VN")} Xu` : "Dùng Xu"}
                  </span>
                </label>
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
                    <div style={{ fontWeight: 700, color: "var(--primary-color, #ea580c)" }}>
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
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ArrowLeftIcon size={11} color="#64748b" />
                  </span>
                  <span>Sửa Phương Thức</span>
                </button>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  style={{ padding: "12px 32px", fontSize: "16px", fontWeight: 800 }}
                  disabled={submitting}
                  onClick={handleFinalPlaceOrder}
                >
                  {submitting ? "Đang xử lý đơn hàng..." : (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        <CheckIcon size={13} color="#ffffff" />
                      </span>
                      <span>Xác Nhận Đặt Hàng ({formatCurrency(finalOrderTotal)})</span>
                    </span>
                  )}
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

            {/* Interactive Dual Voucher Section in Checkout summary */}
            <div style={{ borderTop: "1px dashed var(--border-medium, #ddd)", borderBottom: "1px dashed var(--border-medium, #ddd)", padding: "10px 0", margin: "4px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: (appliedDiscountVoucher || appliedShippingVoucher) ? "8px" : "0" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TicketIcon size={12} color="var(--primary-color, #ea580c)" />
                  </span>
                  <span>Voucher / Giảm giá:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  style={{ background: "none", border: "none", color: "var(--primary-color, #ea580c)", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                >
                  <span>{(appliedDiscountVoucher && appliedShippingVoucher) ? "Đổi mã" : "Chọn mã"}</span>
                  <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRightIcon size={10} color="var(--primary-color, #ea580c)" />
                  </span>
                </button>
              </div>

              {appliedShippingVoucher && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", background: "#f0f9ff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #0284c7" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, color: "#0284c7" }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TruckIcon size={11} color="#0284c7" />
                    </span>
                    <span>{appliedShippingVoucher.code} (-{formatCurrency(appliedShippingDiscount)} ship)</span>
                  </span>
                  <button
                    type="button"
                    onClick={removeShippingVoucher}
                    style={{ background: "none", border: "none", color: "var(--color-error, #d32f2f)", cursor: "pointer", fontWeight: 700, fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloseIcon size={9} color="#ef4444" />
                    </span>
                    <span>Gỡ</span>
                  </button>
                </div>
              )}

              {appliedDiscountVoucher && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--primary-light, rgba(234, 88, 12, 0.08))", padding: "6px 10px", borderRadius: "6px", border: "1px solid var(--primary-color, #ea580c)" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 800, color: "var(--primary-color, #ea580c)" }}>
                    <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TagIcon size={11} color="var(--primary-color, #ea580c)" />
                    </span>
                    <span>{appliedDiscountVoucher.code} (-{formatCurrency(voucherDiscount)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={removeDiscountVoucher}
                    style={{ background: "none", border: "none", color: "var(--color-error, #d32f2f)", cursor: "pointer", fontWeight: 700, fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                  >
                    <span style={{ width: '16px', height: '16px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <CloseIcon size={9} color="#ef4444" />
                    </span>
                    <span>Gỡ</span>
                  </button>
                </div>
              )}

              {(!appliedDiscountVoucher && !appliedShippingVoucher) && (
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  style={{ width: "100%", marginTop: "8px", padding: "8px", borderRadius: "6px", border: "1px dashed var(--primary-color, #ea580c)", background: "rgba(234, 88, 12, 0.03)", color: "var(--primary-color, #ea580c)", fontSize: "12.5px", fontWeight: 600, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <TicketIcon size={10} color="#ea580c" />
                  </span>
                  <span>Nhấn để chọn mã giảm giá / Freeship</span>
                </button>
              )}
            </div>

            {/* Interactive Mini Xu Section in Checkout summary */}
            <div style={{ borderBottom: "1px dashed var(--border-medium, #ddd)", padding: "10px 0", margin: "2px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary)" }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '5px', background: 'rgba(245, 158, 11, 0.14)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CoinIcon size={13} color="#f59e0b" />
                  </span>
                  <span>Mini Xu [{(coins || 0).toLocaleString("vi-VN")}]:</span>
                </span>
                <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: maxCoinsUsable > 0 ? "pointer" : "not-allowed" }}>
                  <input
                    type="checkbox"
                    checked={useCoinsToggle}
                    disabled={maxCoinsUsable <= 0}
                    onChange={(e) => setUseCoinsToggle(e.target.checked)}
                    style={{ width: "16px", height: "16px", accentColor: "#d97706", cursor: maxCoinsUsable > 0 ? "pointer" : "not-allowed" }}
                  />
                  <span style={{ fontSize: "12px", fontWeight: 700, color: useCoinsToggle ? "#d97706" : "var(--text-muted)" }}>
                    {useCoinsToggle ? `Giảm ${formatCurrency(maxCoinsUsable)}` : "Dùng Xu"}
                  </span>
                </label>
              </div>
            </div>

            {voucherDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-success, #2e7d32)" }}>
                <span>Voucher giảm giá ({appliedDiscountVoucher?.code}):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}

            {coinDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#d97706" }}>
                <span>Dùng Mini Xu ({coinDiscount.toLocaleString("vi-VN")} xu):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(coinDiscount)}</span>
              </div>
            )}

            {appliedShippingDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#0284c7" }}>
                <span>Ưu đãi FreeShip ({appliedShippingVoucher?.code}):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(appliedShippingDiscount)}</span>
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
              <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary-color, #ea580c)" }}>
                {formatCurrency(finalOrderTotal)}
              </span>
            </div>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-muted, #777)", lineHeight: "1.5", borderTop: "1px solid var(--border-light, #eee)", paddingTop: "12px", display: "inline-flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(22, 163, 74, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: "2px" }}>
              <LockIcon size={11} color="#16a34a" />
            </span>
            <span>Nhấn &quot;Xác Nhận Đặt Hàng&quot; đồng nghĩa bạn đồng ý với Điều khoản sử dụng và Chính sách bảo mật của Fullstack E-Commerce.</span>
          </div>
        </aside>
      </div>

      {/* Voucher Picker Modal */}
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
        currentSubtotal={currentSubtotal}
        defaultShippingFee={shippingOption.fee}
      />

      {/* Modal Thêm Địa Chỉ Giao Hàng Mới Trong Checkout */}
      {showAddAddressModal && (
        <div
          className="shopee-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1150,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'modalOverlayFadeIn 0.2s ease-out forwards',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowAddAddressModal(false);
          }}
        >
          <div
            className="anim-modal-content"
            style={{
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-medium, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MapPinIcon size={15} color="var(--primary-color, #ea580c)" />
                </span>
                <span>Thêm Địa Chỉ Giao Hàng Mới</span>
              </h3>
              <button
                type="button"
                className="shopee-modal-close"
                onClick={() => setShowAddAddressModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Đóng modal thêm địa chỉ"
              >
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CloseIcon size={14} color="#ef4444" />
                </span>
              </button>
            </div>

            <form onSubmit={handleAddNewAddress}>
              <div className="shopee-form-group" style={{ marginBottom: '14px' }}>
                <label className="shopee-form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Họ và tên người nhận *
                </label>
                <input
                  type="text"
                  className="shopee-form-input"
                  placeholder="Ví dụ: Nguyễn Văn A"
                  value={newAddressForm.name}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="shopee-form-group" style={{ marginBottom: '14px' }}>
                <label className="shopee-form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Số điện thoại liên hệ *
                </label>
                <input
                  type="tel"
                  className="shopee-form-input"
                  placeholder="Ví dụ: 0909 123 456"
                  value={newAddressForm.phone}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="shopee-form-group" style={{ marginBottom: '14px' }}>
                <label className="shopee-form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Địa chỉ chi tiết (Số nhà, đường, phường, quận/huyện, tỉnh/TP) *
                </label>
                <textarea
                  className="shopee-form-input"
                  rows={3}
                  placeholder="Ví dụ: Số 45 Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh"
                  value={newAddressForm.address}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                  required
                />
              </div>

              <div className="shopee-form-group" style={{ marginBottom: '16px' }}>
                <label className="shopee-form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Loại địa chỉ
                </label>
                <select
                  className="shopee-form-select"
                  value={newAddressForm.tag}
                  onChange={(e) => setNewAddressForm((prev) => ({ ...prev, tag: e.target.value }))}
                >
                  <option value="Nhà riêng">Nhà riêng</option>
                  <option value="Văn phòng">Văn phòng / Cơ quan</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="shopee-form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={newAddressForm.isDefault}
                    onChange={(e) => setNewAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color, #ea580c)' }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Đặt làm địa chỉ giao hàng mặc định</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setShowAddAddressModal(false)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.12)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CloseIcon size={10} color="#ef4444" />
                  </span>
                  <span>Hủy Bỏ</span>
                </button>
                <button
                  type="submit"
                  className="shopee-btn shopee-btn-primary"
                  style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.22)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckIcon size={11} color="#ffffff" />
                  </span>
                  <span>Lưu & Áp Dụng Ngay</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chỉnh Sửa Địa Chỉ Trong Checkout */}
      {showEditAddressModal && editingAddress && (
        <div
          className="shopee-modal-overlay"
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1150,
            background: 'rgba(0, 0, 0, 0.72)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            animation: 'modalOverlayFadeIn 0.2s ease-out forwards',
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowEditAddressModal(false);
              setEditingAddress(null);
            }
          }}
        >
          <div
            className="anim-modal-content"
            style={{
              background: 'var(--bg-card, #ffffff)',
              color: 'var(--text-primary, #0f172a)',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '480px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35)',
              border: '1px solid var(--border-medium, #e2e8f0)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PencilIcon size={15} color="var(--primary-color, #ea580c)" />
                </span>
                <span>Chỉnh Sửa Địa Chỉ Giao Hàng</span>
              </h3>
              <button
                type="button"
                className="shopee-modal-close"
                onClick={() => {
                  setShowEditAddressModal(false);
                  setEditingAddress(null);
                }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                aria-label="Đóng modal sửa địa chỉ"
              >
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CloseIcon size={14} color="#ef4444" />
                </span>
              </button>
            </div>

            <form onSubmit={handleEditAddressSubmit}>
              <div className="shopee-form-group" style={{ marginBottom: '14px' }}>
                <label className="shopee-form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Họ và tên người nhận *
                </label>
                <input
                  type="text"
                  className="shopee-form-input"
                  value={editAddressForm.name}
                  onChange={(e) => setEditAddressForm((prev) => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div className="shopee-form-group" style={{ marginBottom: '14px' }}>
                <label className="shopee-form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Số điện thoại liên hệ *
                </label>
                <input
                  type="tel"
                  className="shopee-form-input"
                  value={editAddressForm.phone}
                  onChange={(e) => setEditAddressForm((prev) => ({ ...prev, phone: e.target.value }))}
                  required
                />
              </div>

              <div className="shopee-form-group" style={{ marginBottom: '14px' }}>
                <label className="shopee-form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Địa chỉ chi tiết (Số nhà, đường, phường, quận/huyện, tỉnh/TP) *
                </label>
                <textarea
                  className="shopee-form-input"
                  rows={3}
                  value={editAddressForm.address}
                  onChange={(e) => setEditAddressForm((prev) => ({ ...prev, address: e.target.value }))}
                  style={{ fontFamily: 'inherit', resize: 'vertical' }}
                  required
                />
              </div>

              <div className="shopee-form-group" style={{ marginBottom: '16px' }}>
                <label className="shopee-form-label" style={{ display: 'block', fontSize: '13px', fontWeight: 700, marginBottom: '6px' }}>
                  Loại địa chỉ
                </label>
                <select
                  className="shopee-form-select"
                  value={editAddressForm.tag}
                  onChange={(e) => setEditAddressForm((prev) => ({ ...prev, tag: e.target.value }))}
                >
                  <option value="Nhà riêng">Nhà riêng</option>
                  <option value="Văn phòng">Văn phòng / Cơ quan</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>

              <div className="shopee-form-group" style={{ marginBottom: '20px' }}>
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px' }}>
                  <input
                    type="checkbox"
                    checked={editAddressForm.isDefault}
                    onChange={(e) => setEditAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                    style={{ width: '16px', height: '16px', accentColor: 'var(--primary-color, #ea580c)' }}
                  />
                  <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Đặt làm địa chỉ giao hàng mặc định</span>
                </label>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => {
                    setShowEditAddressModal(false);
                    setEditingAddress(null);
                  }}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: 'rgba(239, 68, 68, 0.12)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CloseIcon size={10} color="#ef4444" />
                  </span>
                  <span>Hủy Bỏ</span>
                </button>
                <button
                  type="submit"
                  className="shopee-btn shopee-btn-primary"
                  style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '4px',
                      background: 'rgba(255, 255, 255, 0.22)',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <CheckIcon size={11} color="#ffffff" />
                  </span>
                  <span>Lưu Thay Đổi</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showVietQRModal && (
        <VietQRPaymentModal
          isOpen={showVietQRModal}
          onClose={() => setShowVietQRModal(false)}
          orderId={`ORD${Math.floor(100000 + Math.random() * 900000)}`}
          amount={finalOrderTotal}
          onPaymentSuccess={() => {
            setShowVietQRModal(false);
            setCurrentStep(4);
          }}
        />
      )}
    </main>
  );
}
