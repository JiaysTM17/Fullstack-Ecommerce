import React, { useState, useEffect, useRef } from "react";
import { Link, Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import VoucherPickerModal from "../components/VoucherPickerModal";
import VietQRPaymentModal from "../components/VietQRPaymentModal";
import { useCoins } from "../context/CoinContext";
import { createOrder, reserveStock, releaseStock } from "../services/orderService";
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
  PlusIcon,
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
    iconBorder: "none",
  },
  {
    id: "express",
    name: "Giao Hỏa Tốc 2H (Prime Express)",
    fee: 45000,
    desc: "Nhận hàng trong vòng 2 giờ kể từ khi shop xác nhận",
    icon: BoltIcon,
    iconColor: "#ea580c",
    iconBg: "rgba(234, 88, 12, 0.1)",
    iconBorder: "none",
  },
  {
    id: "economy",
    name: "Giao Tiết Kiệm (4-5 ngày)",
    fee: 15000,
    desc: "Tối ưu chi phí cho các đơn hàng cồng kềnh",
    icon: PackageIcon,
    iconColor: "#16a34a",
    iconBg: "rgba(22, 163, 74, 0.1)",
    iconBorder: "none",
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

  // Idempotency Key & Cart Stock Reservation (Feature 84)
  const [idempotencyKey] = useState(() => `IDEMP_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`);
  const [reservation, setReservation] = useState(null);
  const [reservationTimeRemaining, setReservationTimeRemaining] = useState(15 * 60);
  const orderCompletedRef = useRef(false);

  useEffect(() => {
    if (!checkoutItems || checkoutItems.length === 0) return;

    let isMounted = true;
    let localReservationId = null;

    const reqItems = checkoutItems.map((it) => ({
      productId: it.productId || it._id || it.id,
      quantity: Number(it.quantity) || 1,
    }));

    reserveStock({ items: reqItems, ttlMinutes: 15 })
      .then((res) => {
        if (!isMounted) return;
        const resData = res?.reservation || res?.data?.reservation;
        if (resData) {
          setReservation(resData);
          localReservationId = resData.reservationId;
          if (resData.expiresAt) {
            const diffSec = Math.max(0, Math.floor((new Date(resData.expiresAt).getTime() - Date.now()) / 1000));
            setReservationTimeRemaining(diffSec || 15 * 60);
          }
        }
      })
      .catch((err) => {
        console.warn("Stock reservation error:", err);
      });

    return () => {
      isMounted = false;
      if (!orderCompletedRef.current && localReservationId) {
        releaseStock({ reservationId: localReservationId }).catch(() => {});
      }
    };
  }, []);

  useEffect(() => {
    if (!reservation) return;
    const timer = setInterval(() => {
      setReservationTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [reservation]);

  const formatReservationTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

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

  // Dịch vụ gói quà tặng & thiệp chúc mừng (Feature 92)
  const [giftWrapEnabled, setGiftWrapEnabled] = useState(false);
  const [giftWrapTheme, setGiftWrapTheme] = useState("LUXURY_RED");
  const [greetingMessage, setGreetingMessage] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const giftWrapFee = giftWrapEnabled ? 25000 : 0;

  // Dịch vụ Đồng Kiểm Khi Nhận Hàng (Feature 97)
  const [doorstepInspectionEnabled, setDoorstepInspectionEnabled] = useState(true);

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
  const finalOrderTotal = Math.max(0, currentSubtotal - voucherDiscount - coinDiscount + finalShippingFee + giftWrapFee);

  async function handleFinalPlaceOrder() {
    setSubmitError("");
    setSubmitting(true);

    const activeVoucherCodes = [appliedDiscountVoucher?.code, appliedShippingVoucher?.code]
      .filter(Boolean)
      .join(" + ") || appliedVoucher?.code || null;

    const orderPayload = {
      idempotencyKey,
      reservationId: reservation?.reservationId || null,
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
      giftWrap: {
        enabled: giftWrapEnabled,
        fee: giftWrapFee,
        theme: giftWrapTheme,
        greetingMessage: greetingMessage.trim(),
        recipientName: recipientName.trim(),
        senderName: senderName.trim(),
      },
      doorstepInspection: {
        enabled: doorstepInspectionEnabled,
        fee: 0,
        status: doorstepInspectionEnabled ? "requested" : "none",
      },
      total: finalOrderTotal,
      paymentMethod,
    };

    try {
      const order = await createOrder(orderPayload);
      orderCompletedRef.current = true;
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
          <div
            className="checkout-step-number"
            style={{
              background: currentStep > 1 ? "#10b981" : currentStep === 1 ? "#ea580c" : "rgba(234, 88, 12, 0.12)",
              color: currentStep >= 1 ? "#ffffff" : "#ea580c",
              border: currentStep === 1 ? "none" : currentStep > 1 ? "none" : "1px solid rgba(234, 88, 12, 0.25)",
            }}
          >
            {currentStep > 1 ? <CheckIcon size={13} color="#ffffff" /> : <MapPinIcon size={13} color={currentStep === 1 ? "#ffffff" : "#ea580c"} />}
          </div>
          <span>1. Địa Chỉ Nhận Hàng</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", color: "#94a3b8" }}>
          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRightIcon size={10} color="#64748b" />
          </span>
        </span>

        <div className={`checkout-step-item ${currentStep === 2 ? "active" : currentStep > 2 ? "completed" : ""}`}>
          <div
            className="checkout-step-number"
            style={{
              background: currentStep > 2 ? "#10b981" : currentStep === 2 ? "#0284c7" : "rgba(2, 132, 199, 0.12)",
              color: currentStep >= 2 ? "#ffffff" : "#0284c7",
              border: currentStep === 2 ? "none" : currentStep > 2 ? "none" : "1px solid rgba(2, 132, 199, 0.25)",
            }}
          >
            {currentStep > 2 ? <CheckIcon size={13} color="#ffffff" /> : <TruckIcon size={13} color={currentStep === 2 ? "#ffffff" : "#0284c7"} />}
          </div>
          <span>2. Vận Chuyển</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", color: "#94a3b8" }}>
          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRightIcon size={10} color="#64748b" />
          </span>
        </span>

        <div className={`checkout-step-item ${currentStep === 3 ? "active" : currentStep > 3 ? "completed" : ""}`}>
          <div
            className="checkout-step-number"
            style={{
              background: currentStep > 3 ? "#10b981" : currentStep === 3 ? "#7c3aed" : "rgba(124, 58, 237, 0.12)",
              color: currentStep >= 3 ? "#ffffff" : "#7c3aed",
              border: currentStep === 3 ? "none" : currentStep > 3 ? "none" : "1px solid rgba(124, 58, 237, 0.25)",
            }}
          >
            {currentStep > 3 ? <CheckIcon size={13} color="#ffffff" /> : <CreditCardIcon size={13} color={currentStep === 3 ? "#ffffff" : "#7c3aed"} />}
          </div>
          <span>3. Phương Thức Thanh Toán</span>
        </div>
        <span style={{ display: "inline-flex", alignItems: "center", color: "#94a3b8" }}>
          <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(148, 163, 184, 0.15)', border: '1px solid rgba(148, 163, 184, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRightIcon size={10} color="#64748b" />
          </span>
        </span>

        <div className={`checkout-step-item ${currentStep === 4 ? "active" : ""}`}>
          <div
            className="checkout-step-number"
            style={{
              background: currentStep === 4 ? "#16a34a" : "rgba(22, 163, 74, 0.12)",
              color: currentStep === 4 ? "#ffffff" : "#16a34a",
              border: currentStep === 4 ? "none" : "1px solid rgba(22, 163, 74, 0.25)",
            }}
          >
            <ShieldCheckIcon size={13} color={currentStep === 4 ? "#ffffff" : "#16a34a"} />
          </div>
          <span>4. Xác Nhận & Đặt Hàng</span>
        </div>
      </nav>

      {/* Real-time Cart Stock Reservation & Security Banner (Feature 84) */}
      {reservation && (
        <div
          style={{
            background: reservationTimeRemaining > 180 ? "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)" : "linear-gradient(135deg, #fff1f2 0%, #ffe4e6 100%)",
            border: `1px solid ${reservationTimeRemaining > 180 ? "#a7f3d0" : "#fecdd3"}`,
            borderRadius: "10px",
            padding: "12px 18px",
            marginBottom: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.03)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "50%",
                background: reservationTimeRemaining > 180 ? "rgba(16, 185, 129, 0.18)" : "rgba(239, 68, 68, 0.18)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <ShieldCheckIcon size={18} color={reservationTimeRemaining > 180 ? "#059669" : "#dc2626"} />
            </span>
            <div>
              <div style={{ fontWeight: 700, fontSize: "14px", color: reservationTimeRemaining > 180 ? "#065f46" : "#991b1b" }}>
                {reservationTimeRemaining > 0 ? "⚡ Tồn kho giỏ hàng đã được giữ chỗ độc quyền" : "⚠️ Hết hạn giữ chỗ tồn kho giỏ hàng"}
              </div>
              <div style={{ fontSize: "12.5px", color: reservationTimeRemaining > 180 ? "#047857" : "#b91c1c" }}>
                {reservationTimeRemaining > 0
                  ? `Mã phiên: ${reservation.reservationId} • Đang khóa số lượng để tránh bị người khác mua mất`
                  : "Phiên giữ chỗ đã hết hạn. Bạn vẫn có thể hoàn tất thanh toán nếu sản phẩm còn hàng."}
              </div>
            </div>
          </div>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              padding: "6px 14px",
              background: "#ffffff",
              borderRadius: "20px",
              border: `1px solid ${reservationTimeRemaining > 180 ? "#6ee7b7" : "#fda4af"}`,
              fontWeight: 800,
              fontSize: "14px",
              color: reservationTimeRemaining > 180 ? "#047857" : "#dc2626",
            }}
          >
            <span>Thời gian giữ chỗ:</span>
            <span style={{ fontFamily: "monospace", fontSize: "16px" }}>
              {formatReservationTime(reservationTimeRemaining)}
            </span>
          </div>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "28px", alignItems: "start" }}>
        {/* Left Column: Multi-Step Forms */}
        <section style={{ background: "#fff", borderRadius: "10px", padding: "24px", border: "1px solid #e0e0e0" }}>
          {/* STEP 1: Address */}
          {currentStep === 1 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #f1f5f9", paddingBottom: "14px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, margin: 0, display: "inline-flex", alignItems: "center", gap: "10px", color: "#0f172a" }}>
                    <span style={{ width: "34px", height: "34px", borderRadius: "10px", background: "linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%)", border: "1px solid #fed7aa", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <MapPinIcon size={18} color="#ea580c" />
                    </span>
                    <span>Bước 1: Địa Chỉ Nhận Hàng</span>
                  </h2>
                  <p style={{ margin: "4px 0 0", fontSize: "12.5px", color: "#64748b" }}>
                    Chọn địa chỉ có sẵn từ sổ tay hoặc thêm địa chỉ nhận hàng mới
                  </p>
                </div>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  style={{ fontSize: "12.5px", padding: "8px 16px", fontWeight: 700, borderRadius: "8px", display: "inline-flex", alignItems: "center", gap: "8px", background: "#fff7ed", border: "1px solid #fed7aa", color: "#ea580c" }}
                  onClick={() => setShowAddAddressModal(true)}
                >
                  <PlusIcon size={13} color="#ea580c" />
                  <span>+ Thêm Địa Chỉ Mới</span>
                </button>
              </div>

              {/* Lưới Thẻ Địa Chỉ Đã Lưu */}
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
                      >
                        <div>
                          {/* Header Thẻ: Tên, SĐT, Tag, Huy hiệu mặc định */}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", gap: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                              <strong style={{ fontSize: "15px", color: isSelected ? "#ea580c" : "#0f172a" }}>
                                {addr.name || addr.fullName}
                              </strong>
                              <span style={{ fontSize: "13px", fontWeight: 600, color: "#64748b" }}>
                                ({addr.phone})
                              </span>
                              <span style={{
                                fontSize: "11px",
                                fontWeight: 700,
                                color: addr.tag === 'Văn phòng' || addr.tag === 'Văn Phòng' ? '#0284c7' : '#ea580c',
                                background: addr.tag === 'Văn phòng' || addr.tag === 'Văn Phòng' ? '#e0f2fe' : '#fff7ed',
                                border: `1px solid ${addr.tag === 'Văn phòng' || addr.tag === 'Văn Phòng' ? '#bae6fd' : '#fed7aa'}`,
                                padding: "2px 8px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px"
                              }}>
                                {addr.tag === 'Văn phòng' || addr.tag === 'Văn Phòng' ? <StoreIcon size={10} color="#0284c7" /> : <HomeIcon size={10} color="#ea580c" />}
                                <span>{addr.tag || 'Nhà riêng'}</span>
                              </span>
                            </div>

                            {addr.isDefault && (
                              <span className="address-default-badge">
                                <CheckIcon size={10} color="#ffffff" />
                                <span>MẶC ĐỊNH</span>
                              </span>
                            )}
                          </div>

                          {/* Địa chỉ chi tiết */}
                          <div style={{ fontSize: "13px", color: "#334155", lineHeight: 1.5, display: "flex", alignItems: "flex-start", gap: "8px", marginBottom: "14px" }}>
                            <span style={{ width: "20px", height: "20px", borderRadius: "5px", background: isSelected ? "rgba(234, 88, 12, 0.12)" : "#f1f5f9", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                              <MapPinIcon size={12} color={isSelected ? "#ea580c" : "#64748b"} />
                            </span>
                            <span>{addr.address}</span>
                          </div>
                        </div>

                        {/* Thao tác địa chỉ */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px dashed #e2e8f0" }}>
                          <div>
                            {!addr.isDefault && (
                              <button
                                type="button"
                                onClick={(e) => handleSetDefaultAddress(addr.id, e)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ea580c",
                                  fontSize: "12px",
                                  fontWeight: 700,
                                  cursor: "pointer",
                                  padding: 0,
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "5px",
                                }}
                              >
                                <StarIcon size={12} color="#ea580c" />
                                <span>Đặt mặc định</span>
                              </button>
                            )}
                          </div>
                          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditAddress(addr, e)}
                              style={{
                                background: "#f8fafc",
                                border: "1px solid #e2e8f0",
                                color: "#475569",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: "pointer",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                              }}
                              title="Sửa địa chỉ"
                            >
                              <PencilIcon size={11} color="#64748b" />
                              <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeleteAddress(addr.id, e)}
                              style={{
                                background: "#fef2f2",
                                border: "1px solid #fecaca",
                                color: "#dc2626",
                                fontSize: "12px",
                                cursor: "pointer",
                                padding: "3px 8px",
                                borderRadius: "6px",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "5px",
                                fontWeight: 600,
                              }}
                              title="Xóa địa chỉ"
                            >
                              <TrashIcon size={11} color="#dc2626" />
                              <span>Xóa</span>
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="address-card selected" style={{ padding: "18px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                      <span className="address-default-badge">
                        <CheckIcon size={10} color="#ffffff" />
                        <span>MẶC ĐỊNH</span>
                      </span>
                      <strong style={{ fontSize: "15px" }}>{fullName} ({phone})</strong>
                    </div>
                    <div style={{ color: "#334155", fontSize: "13.5px", lineHeight: "1.5" }}>{address}</div>
                  </div>
                )}
              </div>

              {/* Chỉnh sửa nhanh thông tin nếu muốn đổi người nhận */}
              <div style={{ background: "#f8fafc", padding: "18px 20px", borderRadius: "12px", border: "1px solid #e2e8f0", marginBottom: "20px" }}>
                <div style={{ fontSize: "13.5px", fontWeight: 700, color: "#0f172a", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
                  <PencilIcon size={14} color="#ea580c" />
                  <span>Xác nhận thông tin người nhận đơn hàng này:</span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "12px" }}>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Họ và tên người nhận:
                    </label>
                    <input
                      type="text"
                      className="shopee-form-input"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      style={{ borderRadius: "8px", padding: "8px 12px", fontSize: "13px" }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                      Số điện thoại liên hệ:
                    </label>
                    <input
                      type="text"
                      className="shopee-form-input"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      style={{ borderRadius: "8px", padding: "8px 12px", fontSize: "13px" }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: 700, color: "#475569", display: "block", marginBottom: "4px" }}>
                    Địa chỉ giao hàng chi tiết:
                  </label>
                  <input
                    type="text"
                    className="shopee-form-input"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ borderRadius: "8px", padding: "8px 12px", fontSize: "13px" }}
                  />
                </div>
              </div>

              {/* Navigation button */}
              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-primary"
                  onClick={() => setCurrentStep(2)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 24px", fontSize: "14.5px", fontWeight: 700, borderRadius: "8px" }}
                >
                  <span>Tiếp Tục: Chọn Vận Chuyển</span>
                  <ChevronRightIcon size={14} color="#ffffff" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Shipping */}
          {currentStep === 2 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 100%)", border: "1px solid #7dd3fc", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <TruckIcon size={17} color="#0284c7" />
                    </span>
                    <span>Bước 2: Phương Thức Vận Chuyển & Thời Gian Giao Hàng</span>
                  </h2>
                  <div style={{ fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                    Đơn vị vận chuyển liên kết chính hãng: <strong>SPX Express &amp; Shopee Xpress Hub</strong>
                  </div>
                </div>

                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#f0fdf4", border: "1px solid #86efac", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", color: "#16a34a", fontWeight: 700 }}>
                  <ShieldCheckIcon size={14} color="#16a34a" />
                  <span>Cam kết đúng hẹn · Bồi thường 15k nếu giao trễ</span>
                </div>
              </div>

              <div className="shipping-options-list">
                {SHIPPING_OPTIONS.map((opt) => {
                  const IconComponent = opt.icon || TruckIcon;
                  const isSelected = selectedShipping === opt.id;
                  
                  // Tính ngày nhận hàng dự kiến
                  const today = new Date();
                  let estimateText = "";
                  if (opt.id === "express") {
                    estimateText = "Nhận trong 2 giờ hôm nay";
                  } else if (opt.id === "economy") {
                    const fromDate = new Date(today);
                    fromDate.setDate(fromDate.getDate() + 4);
                    const toDate = new Date(today);
                    toDate.setDate(toDate.getDate() + 5);
                    estimateText = `Dự kiến: ${fromDate.getDate()}/${fromDate.getMonth() + 1} - ${toDate.getDate()}/${toDate.getMonth() + 1}`;
                  } else {
                    const fromDate = new Date(today);
                    fromDate.setDate(fromDate.getDate() + 2);
                    const toDate = new Date(today);
                    toDate.setDate(toDate.getDate() + 3);
                    estimateText = `Dự kiến: ${fromDate.getDate()}/${fromDate.getMonth() + 1} - ${toDate.getDate()}/${toDate.getMonth() + 1}`;
                  }

                  const hasFreeship = appliedVoucher?.type === "shipping" || appliedShippingVoucher;

                  return (
                    <div
                      key={opt.id}
                      className={`shipping-option-card ${isSelected ? "selected" : ""}`}
                      onClick={() => setSelectedShipping(opt.id)}
                      style={{
                        padding: "16px 20px",
                        position: "relative",
                        overflow: "hidden"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: 1 }}>
                        <div
                          style={{
                            width: "46px",
                            height: "46px",
                            borderRadius: "12px",
                            background: opt.iconBg || "rgba(37, 99, 235, 0.1)",
                            border: opt.iconBorder || "none",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            boxShadow: isSelected ? "0 4px 12px rgba(2, 132, 199, 0.2)" : "none"
                          }}
                        >
                          <IconComponent size={24} color={opt.iconColor || "#2563eb"} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: "15px", marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                            <span>{opt.name}</span>
                            {opt.id === "express" && (
                              <span style={{ background: "#ea580c", color: "#ffffff", fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px", textTransform: "uppercase" }}>
                                HỎA TỐC 2H
                              </span>
                            )}
                            {opt.id === "standard" && (
                              <span style={{ background: "#0284c7", color: "#ffffff", fontSize: "10px", fontWeight: 800, padding: "2px 6px", borderRadius: "4px" }}>
                                PHỔ BIẾN NHẤT
                              </span>
                            )}
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
                                <span style={{ width: '15px', height: '15px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckIcon size={9} color="#ffffff" />
                                </span>
                                <span>Đã chọn</span>
                              </span>
                            )}
                          </div>
                          <div style={{ color: "var(--text-muted, #64748b)", fontSize: "13px", marginBottom: "4px" }}>{opt.desc}</div>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#0284c7", fontWeight: 600 }}>
                            <span style={{ display: "inline-block", width: "6px", height: "6px", borderRadius: "50%", background: "#0284c7" }}></span>
                            <span>{estimateText}</span>
                          </div>
                        </div>
                      </div>

                      <div style={{ textAlign: "right", marginLeft: "16px" }}>
                        <div className="shipping-price-tag" style={{ fontSize: "16px", fontWeight: 800 }}>
                          {hasFreeship ? (
                            <div>
                              <div style={{ color: "#16a34a", fontSize: "16px" }}>MIỄN PHÍ</div>
                              <div style={{ fontSize: "11.5px", color: "var(--text-muted, #94a3b8)", textDecoration: "line-through" }}>
                                {formatCurrency(opt.fee)}
                              </div>
                            </div>
                          ) : (
                            <div style={{ color: "var(--primary-color, #ea580c)" }}>
                              {formatCurrency(opt.fee)}
                            </div>
                          )}
                        </div>
                        {hasFreeship && (
                          <span style={{ display: "inline-block", background: "rgba(22, 163, 74, 0.12)", color: "#16a34a", fontSize: "10.5px", fontWeight: 700, padding: "2px 6px", borderRadius: "4px", marginTop: "2px" }}>
                            Freeship Xtra
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ghi chú đồng bộ kho vận */}
              <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "10px", padding: "12px 16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "10px", fontSize: "12.5px", color: "#475569" }}>
                <span style={{ fontSize: "16px" }}>📦</span>
                <span>
                  Đơn hàng được chuẩn bị và bàn giao cho bưu tá SPX trong vòng <strong>2-4 giờ</strong>. Quý khách có thể theo dõi hành trình trực tuyến ngay sau khi đặt hàng.
                </span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setCurrentStep(1)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRightIcon size={13} color="#ffffff" />
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Payment */}
          {currentStep === 3 && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
                <div>
                  <h2 style={{ fontSize: "18px", fontWeight: 800, margin: "0 0 4px", display: "inline-flex", alignItems: "center", gap: "10px" }}>
                    <span style={{ width: "32px", height: "32px", borderRadius: "10px", background: "linear-gradient(135deg, #ede9fe 0%, #ddd6fe 100%)", border: "1px solid #c4b5fd", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <CreditCardIcon size={17} color="#7c3aed" />
                    </span>
                    <span>Bước 3: Phương Thức Thanh Toán An Toàn</span>
                  </h2>
                  <div style={{ fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                    Được bảo vệ bởi <strong>Escrow Vault Shopee</strong> · Cam kết giữ tiền an toàn tới khi nhận hàng thành công
                  </div>
                </div>

                <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#faf5ff", border: "1px solid #d8b4fe", padding: "6px 12px", borderRadius: "20px", fontSize: "12px", color: "#7c3aed", fontWeight: 700 }}>
                  <LockIcon size={13} color="#7c3aed" />
                  <span>Mã hóa SSL 256-bit chuẩn PCI-DSS</span>
                </div>
              </div>

              <div className="payment-methods-grid">
                {/* 1. COD */}
                <div
                  className={`payment-method-card ${paymentMethod === "COD" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("COD")}
                  style={{
                    padding: "16px 20px",
                    position: "relative",
                  }}
                >
                  <div className="payment-card-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span
                        className="payment-method-icon"
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "12px",
                          background: "rgba(16, 185, 129, 0.12)",
                          border: "1px solid rgba(16, 185, 129, 0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: paymentMethod === "COD" ? "0 4px 12px rgba(16, 185, 129, 0.2)" : "none",
                        }}
                      >
                        <HomeIcon size={24} color="#10b981" />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span>Thanh toán khi nhận hàng (COD)</span>
                          <span style={{ background: "#dcfce7", color: "#15803d", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>
                            Tiền mặt
                          </span>
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
                        <div style={{ fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                          Nhận hàng, kiểm tra cùng shipper rồi mới trả tiền. An tâm tuyệt đối 100%!
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Bank Transfer VietQR */}
                <div
                  className={`payment-method-card ${paymentMethod === "BANK" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("BANK")}
                  style={{
                    padding: "16px 20px",
                    position: "relative",
                  }}
                >
                  <div className="payment-card-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span
                        className="payment-method-icon"
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "12px",
                          background: "rgba(2, 132, 199, 0.12)",
                          border: "1px solid rgba(2, 132, 199, 0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: paymentMethod === "BANK" ? "0 4px 12px rgba(2, 132, 199, 0.2)" : "none",
                        }}
                      >
                        <QrCodeIcon size={24} color="#0284c7" />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span>Chuyển Khoản Ngân Hàng (VietQR Tự Động)</span>
                          <span style={{ background: "#e0f2fe", color: "#0369a1", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>
                            Xác nhận 3 giây
                          </span>
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
                        <div style={{ fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                          Quét mã QR qua ứng dụng MBBank, Vietcombank, Techcombank,... Hoàn toàn miễn phí phí giao dịch!
                        </div>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === "BANK" && (
                    <div className="payment-qr-preview" style={{ textAlign: "center", marginTop: "16px", background: "#f8fafc", padding: "18px", borderRadius: "12px", border: "1.5px solid #bae6fd" }}>
                      <div style={{ display: "inline-block", background: "#ffffff", padding: "10px", borderRadius: "12px", border: "1px solid #cbd5e1", boxShadow: "0 4px 12px rgba(0,0,0,0.06)" }}>
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=2|99|0909123456|MINI%20SHOPEE|${finalOrderTotal}|THANH%20TOAN%20DON%20HANG`}
                          alt="VietQR thanh toán"
                          className="payment-qr-img"
                          style={{ width: "150px", height: "150px", display: "block", margin: 0, border: "none" }}
                        />
                      </div>

                      <div style={{ fontSize: "14px", fontWeight: 800, marginTop: "12px", color: "#0f172a" }}>
                        NGÂN HÀNG QUÂN ĐỘI (MBBANK)
                      </div>

                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", margin: "8px 0" }}>
                        <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--primary-color, #ea580c)" }}>STK: 0909123456</span>
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
                            borderRadius: "6px",
                            padding: "3px 10px",
                            fontSize: "12px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                          }}
                        >
                          <CopyIcon size={12} color="#ea580c" />
                          <span>Sao chép STK</span>
                        </button>
                      </div>

                      <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)" }}>
                        Chủ Tài Khoản: <strong>CÔNG TY TNHH FULLSTACK E-COMMERCE</strong>
                      </div>

                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#16a34a", marginTop: "6px" }}>
                        Số tiền thanh toán: {formatCurrency(finalOrderTotal)}
                      </div>

                      <div style={{ marginTop: "14px" }}>
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
                            borderRadius: "8px",
                            padding: "8px 18px",
                            fontSize: "13px",
                            fontWeight: 700,
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            boxShadow: "0 2px 8px rgba(2, 132, 199, 0.3)",
                          }}
                        >
                          <QrCodeIcon size={14} color="#ffffff" />
                          <span>Mở Chi Tiết VietQR Động &amp; Đếm Ngược</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Credit Card */}
                <div
                  className={`payment-method-card ${paymentMethod === "CARD" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("CARD")}
                  style={{
                    padding: "16px 20px",
                    position: "relative",
                  }}
                >
                  <div className="payment-card-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span
                        className="payment-method-icon"
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "12px",
                          background: "rgba(37, 99, 235, 0.12)",
                          border: "1px solid rgba(37, 99, 235, 0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: paymentMethod === "CARD" ? "0 4px 12px rgba(37, 99, 235, 0.2)" : "none",
                        }}
                      >
                        <CreditCardIcon size={24} color="#2563eb" />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span>Thẻ Tín Dụng / Ghi Nợ Quốc Tế (Visa, MasterCard, JCB)</span>
                          <span style={{ background: "#dbeafe", color: "#1d4ed8", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>
                            3D-Secure 2.0
                          </span>
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
                        <div style={{ fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                          Hỗ trợ thẻ tín dụng &amp; ghi nợ trong nước và quốc tế. Trả góp 0% lãi suất.
                        </div>
                      </div>
                    </div>
                  </div>

                  {paymentMethod === "CARD" && (
                    <div style={{ marginTop: "16px", padding: "18px", background: "#f8fafc", borderRadius: "12px", border: "1.5px solid #cbd5e1" }}>
                      <div style={{ marginBottom: "14px" }}>
                        <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                          SỐ THẺ QUỐC TẾ (16 CHỮ SỐ):
                        </label>
                        <input
                          type="text"
                          className="shopee-form-input"
                          placeholder="4111 2222 3333 4444"
                          value={cardNumber}
                          onChange={(e) => setCardNumber(e.target.value)}
                          style={{ letterSpacing: "1px", fontWeight: 600 }}
                        />
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                        <div>
                          <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                            HỌ VÀ TÊN CHỦ THẺ:
                          </label>
                          <input
                            type="text"
                            className="shopee-form-input"
                            placeholder="NGUYEN VAN A"
                            value={cardHolder}
                            onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                            style={{ textTransform: "uppercase", fontWeight: 600 }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: "12px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                            HẠN DÙNG (MM/YY):
                          </label>
                          <input
                            type="text"
                            className="shopee-form-input"
                            placeholder="12/28"
                            value={cardExpiry}
                            onChange={(e) => setCardExpiry(e.target.value)}
                            style={{ fontWeight: 600 }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. MoMo */}
                <div
                  className={`payment-method-card ${paymentMethod === "MOMO" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("MOMO")}
                  style={{
                    padding: "16px 20px",
                    position: "relative",
                  }}
                >
                  <div className="payment-card-content" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                      <span
                        className="payment-method-icon"
                        style={{
                          width: "46px",
                          height: "46px",
                          borderRadius: "12px",
                          background: "rgba(217, 70, 239, 0.12)",
                          border: "1px solid rgba(217, 70, 239, 0.25)",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          boxShadow: paymentMethod === "MOMO" ? "0 4px 12px rgba(217, 70, 239, 0.2)" : "none",
                        }}
                      >
                        <QrCodeIcon size={24} color="#d946ef" />
                      </span>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span>Ví Điện Tử MoMo / ShopeePay / ZaloPay</span>
                          <span style={{ background: "#fae8ff", color: "#a21caf", fontSize: "11px", fontWeight: 700, padding: "2px 8px", borderRadius: "4px" }}>
                            Ưu đãi hoàn xu 5%
                          </span>
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
                        <div style={{ fontSize: "13px", color: "var(--text-muted, #64748b)" }}>
                          Quét mã trên điện thoại hoặc tự động mở app để xác nhận thanh toán an toàn.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px" }}>
                <button
                  type="button"
                  className="shopee-btn shopee-btn-secondary"
                  onClick={() => setCurrentStep(2)}
                  style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.22)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", background: "var(--bg-page, #f8fafc)", border: "1.5px solid var(--border-medium, #e2e8f0)", borderRadius: "12px", padding: "18px 20px", marginBottom: "20px", fontSize: "13.5px" }}>
                <div style={{ borderRight: "1px dashed #cbd5e1", paddingRight: "16px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, color: "var(--primary-color, #ea580c)", marginBottom: "8px", fontSize: "12.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <MapPinIcon size={14} color="var(--primary-color, #ea580c)" />
                    <span>ĐỊA CHỈ NHẬN HÀNG</span>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "15px", color: "var(--text-primary, #0f172a)", marginBottom: "4px" }}>
                    {fullName} <span style={{ color: "var(--text-muted, #64748b)", fontWeight: 500 }}>·</span> <span style={{ color: "#0284c7" }}>{phone}</span>
                  </div>
                  <div style={{ color: "var(--text-secondary, #334155)", lineHeight: "1.5", fontSize: "13px" }}>
                    {address}
                  </div>
                </div>

                <div style={{ paddingLeft: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 800, color: "#0284c7", marginBottom: "8px", fontSize: "12.5px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    <TruckIcon size={14} color="#0284c7" />
                    <span>VẬN CHUYỂN &amp; THANH TOÁN</span>
                  </div>
                  <div style={{ marginBottom: "6px", fontSize: "13.5px" }}>
                    <span style={{ color: "var(--text-muted, #64748b)" }}>Gói vận chuyển: </span>
                    <strong style={{ color: "var(--text-primary, #0f172a)" }}>{shippingOption.name}</strong>
                  </div>
                  <div style={{ fontSize: "13.5px" }}>
                    <span style={{ color: "var(--text-muted, #64748b)" }}>Phương thức: </span>
                    <strong style={{ color: "#7c3aed" }}>
                      {paymentMethod === "COD" && "Thanh toán khi nhận hàng (COD)"}
                      {paymentMethod === "BANK" && "Chuyển khoản VietQR tự động"}
                      {paymentMethod === "CARD" && "Thẻ tín dụng / Ghi nợ quốc tế"}
                      {paymentMethod === "MOMO" && "Ví điện tử MoMo / ZaloPay"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Voucher status banner in Step 4 */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--bg-page, #f8fafc)", border: "1px solid var(--border-medium, #e2e8f0)", borderRadius: "8px", padding: "12px 16px", marginBottom: "12px", fontSize: "13.5px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <span style={{ fontWeight: 700, color: "var(--text-primary)", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: '22px', height: '22px', borderRadius: '5px', background: 'rgba(234, 88, 12, 0.12)', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TicketIcon size={13} color="var(--primary-color, #ea580c)" />
                    </span>
                    <span>Voucher Áp Dụng:</span>
                  </span>
                  {(appliedDiscountVoucher || appliedShippingVoucher) ? (
                    <span style={{ marginLeft: "4px" }}>
                      {appliedShippingVoucher && (
                        <strong style={{ color: "#0284c7", marginRight: "8px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.12)', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <TruckIcon size={11} color="#0284c7" />
                          </span>
                          <span>{appliedShippingVoucher.code} (-{formatCurrency(appliedShippingDiscount)})</span>
                        </strong>
                      )}
                      {appliedDiscountVoucher && (
                        <strong style={{ color: "var(--primary-color, #ea580c)", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                          <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                  style={{ background: "none", border: "none", color: "var(--primary-color, #ea580c)", fontWeight: 700, fontSize: "13px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <span>{(appliedDiscountVoucher || appliedShippingVoucher) ? "Đổi mã khác" : "Chọn mã giảm giá"}</span>
                  <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ChevronRightIcon size={10} color="var(--primary-color, #ea580c)" />
                  </span>
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
                  <span style={{ width: '28px', height: '28px', borderRadius: '7px', background: 'rgba(245, 158, 11, 0.14)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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

              {/* Dịch vụ gói quà tặng & Thiệp chúc mừng cao cấp (Feature 92) */}
              <div style={{
                background: giftWrapEnabled ? "rgba(244, 63, 94, 0.04)" : "#f8fafc",
                border: giftWrapEnabled ? "1.5px solid #f43f5e" : "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                transition: "all 0.2s ease"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: giftWrapEnabled ? "14px" : "0" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(244, 63, 94, 0.12)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      🎁
                    </span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a" }}>
                        Dịch Vụ Gói Quà Tặng &amp; Thiệp Chúc Mừng Cao Cấp
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b" }}>
                        Hộp quà sang trọng, nơ ruy băng thủ công + Thiệp viết tay theo yêu cầu (+25.000₫)
                      </div>
                    </div>
                  </div>

                  <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={giftWrapEnabled}
                      onChange={(e) => setGiftWrapEnabled(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "#f43f5e", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: giftWrapEnabled ? "#f43f5e" : "#64748b" }}>
                      {giftWrapEnabled ? "Đang chọn (+25k)" : "Đăng ký gói"}
                    </span>
                  </label>
                </div>

                {giftWrapEnabled && (
                  <div style={{ borderTop: "1px dashed #cbd5e1", paddingTop: "14px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div>
                      <label style={{ fontSize: "12.5px", fontWeight: 700, color: "#334155", display: "block", marginBottom: "6px" }}>
                        Chủ Đề Hộp Quà &amp; Màu Ruy Băng:
                      </label>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "8px" }}>
                        {[
                          { id: "LUXURY_RED", name: "Đỏ Rượu Sang Trọng", emoji: "🍷" },
                          { id: "PASTEL_PINK", name: "Hồng Pastel Ngọt Ngào", emoji: "🌸" },
                          { id: "BIRTHDAY_CELEBRATION", name: "Sinh Nhật Rực Rỡ", emoji: "🎂" },
                          { id: "STANDARD", name: "Tối Giản Thanh Lịch", emoji: "🎀" },
                        ].map((th) => (
                          <button
                            key={th.id}
                            type="button"
                            onClick={() => setGiftWrapTheme(th.id)}
                            style={{
                              padding: "8px 10px",
                              borderRadius: "8px",
                              border: giftWrapTheme === th.id ? "2px solid #f43f5e" : "1px solid #cbd5e1",
                              background: giftWrapTheme === th.id ? "#fff1f2" : "#ffffff",
                              color: giftWrapTheme === th.id ? "#e11d48" : "#475569",
                              fontSize: "12px",
                              fontWeight: 700,
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              justifyContent: "center"
                            }}
                          >
                            <span>{th.emoji}</span>
                            <span>{th.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Người gửi (tùy chọn):
                        </label>
                        <input
                          type="text"
                          className="shopee-form-input"
                          placeholder="VD: Tuấn Anh"
                          style={{ fontSize: "12.5px", padding: "6px 10px" }}
                          value={senderName}
                          onChange={(e) => setSenderName(e.target.value)}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                          Người nhận thiệp:
                        </label>
                        <input
                          type="text"
                          className="shopee-form-input"
                          placeholder="VD: Em Trang iu"
                          style={{ fontSize: "12.5px", padding: "6px 10px" }}
                          value={recipientName}
                          onChange={(e) => setRecipientName(e.target.value)}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#475569", display: "block", marginBottom: "4px" }}>
                        Lời nhắn chúc mừng in trên thiệp hoa:
                      </label>
                      <textarea
                        className="shopee-form-input"
                        rows="2"
                        placeholder="VD: Chúc mừng sinh nhật em gái, chúc em tuổi mới luôn xinh đẹp và rạng rỡ nhé!"
                        style={{ fontSize: "12.5px", padding: "8px 10px", width: "100%", resize: "none" }}
                        value={greetingMessage}
                        onChange={(e) => setGreetingMessage(e.target.value)}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Dịch vụ Đồng Kiểm Khi Nhận Hàng (Feature 97) */}
              <div style={{
                background: doorstepInspectionEnabled ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)" : "#ffffff",
                border: doorstepInspectionEnabled ? "1.5px solid #22c55e" : "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "16px",
                marginBottom: "20px",
                transition: "all 0.2s ease"
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(34, 197, 94, 0.15)",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center"
                    }}>
                      <ShieldCheckIcon size={18} color="#16a34a" />
                    </span>
                    <div>
                      <div style={{ fontSize: "14px", fontWeight: 800, color: "#0f172a", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span>Đồng Kiểm Khi Nhận Hàng (SPX Co-Inspection)</span>
                        <span style={{
                          background: "#22c55e",
                          color: "#ffffff",
                          fontSize: "10.5px",
                          fontWeight: 800,
                          padding: "2px 6px",
                          borderRadius: "4px"
                        }}>
                          0₫ MIỄN PHÍ
                        </span>
                      </div>
                      <div style={{ fontSize: "12px", color: "#475569" }}>
                        Được mở gói hàng kiểm tra số lượng, mẫu mã cùng bưu tá trước khi nhận. Đổi trả ngay nếu lỗi ngoại quan!
                      </div>
                    </div>
                  </div>

                  <label style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={doorstepInspectionEnabled}
                      onChange={(e) => setDoorstepInspectionEnabled(e.target.checked)}
                      style={{ width: "18px", height: "18px", accentColor: "#16a34a", cursor: "pointer" }}
                    />
                    <span style={{ fontSize: "13px", fontWeight: 700, color: doorstepInspectionEnabled ? "#16a34a" : "#64748b" }}>
                      {doorstepInspectionEnabled ? "Đã Kích Hoạt" : "Bỏ qua"}
                    </span>
                  </label>
                </div>
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
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(100, 116, 139, 0.12)', border: '1px solid rgba(100, 116, 139, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(255, 255, 255, 0.25)', border: '1px solid rgba(255, 255, 255, 0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
        <aside className="checkout-summary-box">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", paddingBottom: "12px", borderBottom: "1.5px solid var(--border-medium, #e2e8f0)" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 800, margin: 0, color: "var(--text-primary, #0f172a)", display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ width: "24px", height: "24px", borderRadius: "6px", background: "rgba(234, 88, 12, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <PackageIcon size={14} color="#ea580c" />
              </span>
              <span>Bảng Kê Đơn Hàng</span>
            </h3>
            <span style={{ fontSize: "12px", background: "#f1f5f9", color: "#475569", fontWeight: 700, padding: "3px 8px", borderRadius: "12px" }}>
              {checkoutItems.length} sản phẩm
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px", marginBottom: "16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary, #64748b)" }}>Tổng tiền hàng:</span>
              <span style={{ fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>{formatCurrency(currentSubtotal)}</span>
            </div>

            {/* Interactive Dual Voucher Section in Checkout summary */}
            <div style={{ background: "#f8fafc", borderRadius: "10px", padding: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: (appliedDiscountVoucher || appliedShippingVoucher) ? "10px" : "0" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                  <TicketIcon size={14} color="var(--primary-color, #ea580c)" />
                  <span>Voucher Shopee:</span>
                </span>
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  style={{ background: "none", border: "none", color: "var(--primary-color, #ea580c)", fontWeight: 700, fontSize: "12.5px", cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                >
                  <span>{(appliedDiscountVoucher && appliedShippingVoucher) ? "Đổi mã khác" : "Chọn mã ưu đãi"}</span>
                  <ChevronRightIcon size={11} color="var(--primary-color, #ea580c)" />
                </button>
              </div>

              {appliedShippingVoucher && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", background: "#f0f9ff", padding: "6px 10px", borderRadius: "6px", border: "1px solid #bae6fd" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "#0284c7" }}>
                    <TruckIcon size={12} color="#0284c7" />
                    <span>{appliedShippingVoucher.code} (-{formatCurrency(appliedShippingDiscount)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={removeShippingVoucher}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: "11px" }}
                  >
                    Gỡ
                  </button>
                </div>
              )}

              {appliedDiscountVoucher && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff7ed", padding: "6px 10px", borderRadius: "6px", border: "1px solid #fed7aa" }}>
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", fontWeight: 700, color: "var(--primary-color, #ea580c)" }}>
                    <TagIcon size={12} color="var(--primary-color, #ea580c)" />
                    <span>{appliedDiscountVoucher.code} (-{formatCurrency(voucherDiscount)})</span>
                  </span>
                  <button
                    type="button"
                    onClick={removeDiscountVoucher}
                    style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: 700, fontSize: "11px" }}
                  >
                    Gỡ
                  </button>
                </div>
              )}

              {(!appliedDiscountVoucher && !appliedShippingVoucher) && (
                <button
                  type="button"
                  onClick={() => setShowVoucherModal(true)}
                  style={{ width: "100%", marginTop: "6px", padding: "8px", borderRadius: "8px", border: "1px dashed #ea580c", background: "rgba(234, 88, 12, 0.04)", color: "#ea580c", fontSize: "12.5px", fontWeight: 700, cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                >
                  <TicketIcon size={12} color="#ea580c" />
                  <span>Áp dụng Voucher giảm giá &amp; Freeship</span>
                </button>
              )}
            </div>

            {/* Interactive Mini Xu Section in Checkout summary */}
            <div style={{ background: useCoinsToggle ? "rgba(245, 158, 11, 0.08)" : "#f8fafc", borderRadius: "10px", padding: "10px 12px", border: useCoinsToggle ? "1px solid #f59e0b" : "1px solid #e2e8f0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
                  <CoinIcon size={15} color="#f59e0b" />
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
                  <span style={{ fontSize: "12px", fontWeight: 700, color: useCoinsToggle ? "#d97706" : "var(--text-muted, #94a3b8)" }}>
                    {useCoinsToggle ? `Giảm ${formatCurrency(maxCoinsUsable)}` : "Dùng Xu"}
                  </span>
                </label>
              </div>
            </div>

            {voucherDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#16a34a", fontSize: "13.5px" }}>
                <span>Voucher giảm giá ({appliedDiscountVoucher?.code}):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(voucherDiscount)}</span>
              </div>
            )}

            {coinDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#d97706", fontSize: "13.5px" }}>
                <span>Khấu trừ Mini Xu ({coinDiscount.toLocaleString("vi-VN")} xu):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(coinDiscount)}</span>
              </div>
            )}

            {appliedShippingDiscount > 0 && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#0284c7", fontSize: "13.5px" }}>
                <span>Ưu đãi FreeShip ({appliedShippingVoucher?.code}):</span>
                <span style={{ fontWeight: 700 }}>-{formatCurrency(appliedShippingDiscount)}</span>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--text-secondary, #64748b)" }}>Phí vận chuyển:</span>
              <span style={{ fontWeight: 600, color: finalShippingFee === 0 ? "#16a34a" : "var(--text-primary, #0f172a)" }}>
                {finalShippingFee === 0 ? "MIỄN PHÍ" : formatCurrency(finalShippingFee)}
              </span>
            </div>

            {giftWrapEnabled && (
              <div style={{ display: "flex", justifyContent: "space-between", color: "#e11d48", fontSize: "13.5px" }}>
                <span>🎁 Dịch vụ gói quà &amp; thiệp:</span>
                <span style={{ fontWeight: 700 }}>+{formatCurrency(giftWrapFee)}</span>
              </div>
            )}

            <div style={{ borderTop: "2px solid #0f172a", paddingTop: "14px", marginTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
              <span style={{ fontSize: "15px", fontWeight: 800, color: "#0f172a" }}>TỔNG THANH TOÁN:</span>
              <span style={{ fontSize: "22px", fontWeight: 800, color: "var(--primary-color, #ea580c)" }}>
                {formatCurrency(finalOrderTotal)}
              </span>
            </div>
          </div>

          <div style={{ fontSize: "12px", color: "var(--text-muted, #64748b)", lineHeight: "1.5", borderTop: "1px solid #e2e8f0", paddingTop: "14px", display: "flex", alignItems: "flex-start", gap: "8px" }}>
            <span style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'rgba(22, 163, 74, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: "1px" }}>
              <ShieldCheckIcon size={12} color="#16a34a" />
            </span>
            <span>Shopee bảo vệ người mua: Hoàn tiền 100% nếu hàng không đúng mô tả hoặc hư hỏng do vận chuyển.</span>
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
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      border: '1px solid rgba(239, 68, 68, 0.22)',
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
                      border: '1px solid rgba(255, 255, 255, 0.35)',
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
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', border: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                <span style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
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
                      border: '1px solid rgba(239, 68, 68, 0.22)',
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
                      border: '1px solid rgba(255, 255, 255, 0.35)',
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
