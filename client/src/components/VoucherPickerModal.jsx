import React, { useState, useEffect, useMemo } from "react";
import { getVouchers, validateVoucher } from "../services/voucherService";
import { formatCurrency } from "../utils/formatCurrency";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import { TicketIcon, TruckIcon, TagIcon, StarIcon, BoltIcon, CheckIcon, CoinIcon, CloseIcon } from "./OrdersIcons";
import "../styles/voucher-modal.css";

export default function VoucherPickerModal({
  isOpen,
  onClose,
  appliedDiscountVoucher = null,
  appliedShippingVoucher = null,
  appliedVoucher = null,
  onApplyDiscountVoucher,
  onApplyShippingVoucher,
  onApplyVoucher,
  onRemoveDiscountVoucher,
  onRemoveShippingVoucher,
  onRemoveVoucher,
  currentSubtotal = 0,
  defaultShippingFee = 25000,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [customCode, setCustomCode] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'shipping' | 'discount'
  const [errorMessage, setErrorMessage] = useState("");

  // Local pending selections inside modal
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [selectedDiscount, setSelectedDiscount] = useState(null);

  // Sync state when modal opens
  useEffect(() => {
    if (isOpen) {
      getVouchers().then(v => setVouchers(v || []));
      setErrorMessage("");
      setCustomCode("");

      // Determine initial discount voucher
      const initialDiscount =
        appliedDiscountVoucher ||
        (appliedVoucher && appliedVoucher.type !== "shipping"
          ? appliedVoucher
          : null);
      setSelectedDiscount(initialDiscount);

      // Determine initial shipping voucher
      const initialShipping =
        appliedShippingVoucher ||
        (appliedVoucher && appliedVoucher.type === "shipping"
          ? appliedVoucher
          : null);
      setSelectedShipping(initialShipping);
    }
  }, [isOpen, appliedDiscountVoucher, appliedShippingVoucher, appliedVoucher]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Hàm tính số tiền tiết kiệm thực tế cho từng voucher
  const getVoucherSavings = (v) => {
    if (!v) return 0;
    const isEligible =
      v.minOrderValue === 0 ||
      currentSubtotal >= v.minOrderValue ||
      currentSubtotal === 0;
    if (!isEligible) return 0;

    if (v.type === "shipping") {
      const val = v.value || 30000;
      return Math.min(val, defaultShippingFee > 0 ? defaultShippingFee : 30000);
    }
    const base = currentSubtotal > 0 ? currentSubtotal : 100000;
    if (v.type === "percent") {
      const raw = Math.round((base * v.value) / 100);
      return v.maxDiscount ? Math.min(raw, v.maxDiscount) : raw;
    }
    return Math.min(v.value || 0, base);
  };

  // Hàm sắp xếp thông minh: Tốt nhất (giảm giá cao nhất) lên trên, sau đó giảm dần
  const sortVouchersSmart = (list) => {
    return [...list].sort((a, b) => {
      const aEligible =
        a.minOrderValue === 0 ||
        currentSubtotal >= a.minOrderValue ||
        currentSubtotal === 0;
      const bEligible =
        b.minOrderValue === 0 ||
        currentSubtotal >= b.minOrderValue ||
        currentSubtotal === 0;

      // Cả 2 đều đủ điều kiện: Voucher nào tiết kiệm nhiều tiền hơn thì đẩy lên trước
      if (aEligible && bEligible) {
        const savA = getVoucherSavings(a);
        const savB = getVoucherSavings(b);
        if (savB !== savA) return savB - savA;
        return a.minOrderValue - b.minOrderValue;
      }

      // Đủ điều kiện luôn ưu tiên xếp trên chưa đủ điều kiện
      if (aEligible && !bEligible) return -1;
      if (!aEligible && bEligible) return 1;

      // Cả 2 chưa đủ điều kiện: Voucher nào cần mua thêm ít tiền hơn (gần đủ điều kiện hơn) đẩy lên trước
      const missA = Math.max(0, a.minOrderValue - currentSubtotal);
      const missB = Math.max(0, b.minOrderValue - currentSubtotal);
      return missA - missB;
    });
  };

  // Split vouchers into 2 sorted groups (Tốt nhất xếp trên cùng)
  const shippingVouchers = useMemo(() => {
    const list = vouchers.filter((v) => v.type === "shipping");
    return sortVouchersSmart(list);
  }, [vouchers, currentSubtotal, defaultShippingFee]);

  const discountVouchers = useMemo(() => {
    const list = vouchers.filter((v) => v.type === "percent" || v.type === "fixed");
    return sortVouchersSmart(list);
  }, [vouchers, currentSubtotal]);

  // Tìm voucher tốt nhất trong mỗi nhóm
  const bestShippingVoucher = useMemo(() => {
    return (
      shippingVouchers.find((v) => {
        const eligible =
          v.minOrderValue === 0 ||
          currentSubtotal >= v.minOrderValue ||
          currentSubtotal === 0;
        return eligible && getVoucherSavings(v) > 0;
      }) || null
    );
  }, [shippingVouchers, currentSubtotal, defaultShippingFee]);

  const bestDiscountVoucher = useMemo(() => {
    return (
      discountVouchers.find((v) => {
        const eligible =
          v.minOrderValue === 0 ||
          currentSubtotal >= v.minOrderValue ||
          currentSubtotal === 0;
        return eligible && getVoucherSavings(v) > 0;
      }) || null
    );
  }, [discountVouchers, currentSubtotal]);

  const bestComboSavings = useMemo(() => {
    const shipSav = bestShippingVoucher ? getVoucherSavings(bestShippingVoucher) : 0;
    const discSav = bestDiscountVoucher ? getVoucherSavings(bestDiscountVoucher) : 0;
    return shipSav + discSav;
  }, [bestShippingVoucher, bestDiscountVoucher, currentSubtotal, defaultShippingFee]);

  const handleAutoApplyBestCombo = () => {
    if (bestShippingVoucher) setSelectedShipping(bestShippingVoucher);
    if (bestDiscountVoucher) setSelectedDiscount(bestDiscountVoucher);
    showToast(
      `Đã tự động chọn gói Voucher tốt nhất! Tiết kiệm: ${formatCurrency(bestComboSavings)}`,
      "success",
    );
  };

  // Live savings calculation for preview
  const previewShippingDiscount = useMemo(() => {
    if (!selectedShipping) return 0;
    const value = selectedShipping.value || 30000;
    return Math.min(value, defaultShippingFee);
  }, [selectedShipping, defaultShippingFee]);

  const previewOrderDiscount = useMemo(() => {
    if (!selectedDiscount) return 0;
    const base = currentSubtotal > 0 ? currentSubtotal : 100000;
    if (selectedDiscount.type === "percent") {
      const raw = Math.round((base * selectedDiscount.value) / 100);
      return selectedDiscount.maxDiscount
        ? Math.min(raw, selectedDiscount.maxDiscount)
        : raw;
    }
    return Math.min(selectedDiscount.value || 0, base);
  }, [selectedDiscount, currentSubtotal]);

  const totalPreviewSavings = previewShippingDiscount + previewOrderDiscount;

  if (!isOpen) return null;

  // Handle custom voucher code input
  const handleApplyCustomCode = async (e) => {
    e.preventDefault();
    const code = customCode.trim().toUpperCase();
    if (!code) {
      setErrorMessage("Vui lòng nhập mã voucher");
      return;
    }

    const res = await validateVoucher(code, currentSubtotal);
    if (!res.valid) {
      setErrorMessage(res.message);
      return;
    }

    setErrorMessage("");
    if (res.voucher.type === "shipping") {
      setSelectedShipping(res.voucher);
      showToast(`Đã chọn mã Freeship "${res.voucher.code}"`, "success");
    } else {
      setSelectedDiscount(res.voucher);
      showToast(`Đã chọn mã giảm giá "${res.voucher.code}"`, "success");
    }
    setCustomCode("");
  };

  // Toggle selection for shipping voucher
  const handleToggleShipping = (v) => {
    const isEligible =
      v.minOrderValue === 0 ||
      currentSubtotal >= v.minOrderValue ||
      currentSubtotal === 0;

    if (!isEligible) {
      const missing = Math.max(0, v.minOrderValue - currentSubtotal);
      showToast(
        `Chưa đủ điều kiện: Cần mua thêm ${formatCurrency(missing)} để dùng mã freeship này`,
        "info",
      );
      return;
    }

    if (selectedShipping?.code === v.code) {
      setSelectedShipping(null);
    } else {
      setSelectedShipping(v);
    }
  };

  // Toggle selection for discount voucher
  const handleToggleDiscount = (v) => {
    const isEligible =
      v.minOrderValue === 0 ||
      currentSubtotal >= v.minOrderValue ||
      currentSubtotal === 0;

    if (!isEligible) {
      const missing = Math.max(0, v.minOrderValue - currentSubtotal);
      showToast(
        `Chưa đủ điều kiện: Cần mua thêm ${formatCurrency(missing)} để dùng mã giảm giá này`,
        "info",
      );
      return;
    }

    if (selectedDiscount?.code === v.code) {
      setSelectedDiscount(null);
    } else {
      setSelectedDiscount(v);
    }
  };

  // Commit both selected vouchers to CartContext
  const handleConfirmApply = () => {
    // 1. Discount voucher
    if (selectedDiscount) {
      if (onApplyDiscountVoucher) {
        onApplyDiscountVoucher(selectedDiscount);
      } else if (onApplyVoucher) {
        onApplyVoucher(selectedDiscount);
      }
    } else {
      if (onRemoveDiscountVoucher) {
        onRemoveDiscountVoucher();
      } else if (onRemoveVoucher) {
        onRemoveVoucher("discount");
      }
    }

    // 2. Shipping voucher
    if (selectedShipping) {
      if (onApplyShippingVoucher) {
        onApplyShippingVoucher(selectedShipping);
      } else if (onApplyVoucher) {
        onApplyVoucher(selectedShipping);
      }
    } else {
      if (onRemoveShippingVoucher) {
        onRemoveShippingVoucher();
      } else if (onRemoveVoucher) {
        onRemoveVoucher("shipping");
      }
    }

    const appliedCount = (selectedDiscount ? 1 : 0) + (selectedShipping ? 1 : 0);
    if (appliedCount === 2) {
      showToast(
        `Đã áp dụng 2 Voucher: ${selectedDiscount.code} & ${selectedShipping.code}!`,
        "success",
      );
    } else if (appliedCount === 1) {
      const single = selectedDiscount || selectedShipping;
      showToast(`Đã áp dụng voucher ${single.code}!`, "success");
    } else {
      showToast("Đã gỡ tất cả mã giảm giá", "info");
    }

    onClose();
  };

  const handleClearAll = () => {
    setSelectedDiscount(null);
    setSelectedShipping(null);
  };

  return (
    <div
      className="voucher-modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="voucher-modal-dialog"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "620px" }}
      >
        {/* Header */}
        <div className="voucher-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 3px 8px rgba(234, 88, 12, 0.3)',
                flexShrink: 0,
              }}
            >
              <TicketIcon size={20} color="#ffffff" />
            </div>
            <div>
              <h3 className="voucher-modal-title" style={{ margin: 0 }}>
                <span>{t("select_voucher_title", "Chọn Shopee Voucher")}</span>
              </h3>
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--text-muted, #64748b)",
                  margin: "3px 0 0",
                }}
              >
                Áp dụng tối đa <strong>1 Mã Miễn Phí Vận Chuyển</strong> &{" "}
                <strong>1 Mã Giảm Giá Đơn Hàng</strong> cùng lúc
              </p>
            </div>
          </div>
          <button
            type="button"
            className="voucher-modal-close"
            onClick={onClose}
            aria-label="Đóng"
            style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <span style={{ width: '22px', height: '22px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloseIcon size={12} color="#ef4444" />
            </span>
          </button>
        </div>

        {/* Custom Voucher Input Bar */}
        <form className="voucher-input-bar" onSubmit={handleApplyCustomCode}>
          <input
            type="text"
            className="voucher-input-field"
            placeholder={t(
              "enter_voucher_placeholder",
              "Nhập mã voucher (VD: FREESHIP, MINI10, SUPERDEAL)...",
            )}
            value={customCode}
            onChange={(e) => {
              setCustomCode(e.target.value);
              setErrorMessage("");
            }}
          />
          <button
            type="submit"
            className="voucher-apply-btn select"
            style={{ padding: "0 18px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "6px" }}
          >
            <span style={{ width: "18px", height: "18px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
              <CheckIcon size={11} color="#ffffff" />
            </span>
            <span>{t("apply", "Áp Dụng")}</span>
          </button>
        </form>

        {errorMessage && (
          <div
            style={{
              padding: "8px 22px",
              background: "rgba(239, 68, 68, 0.08)",
              color: "var(--color-error, #ef4444)",
              fontSize: "12.5px",
              fontWeight: 600,
            }}
          >
            {errorMessage}
          </div>
        )}

        {/* Smart Best Combo Recommendation Hero */}
        {bestComboSavings > 0 && (
          <div className="voucher-smart-recommendation-hero">
            <div className="voucher-smart-hero-left">
              <span className="voucher-smart-tag" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "16px", height: "16px", borderRadius: "3px", background: "rgba(245, 158, 11, 0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <StarIcon size={10} color="#f59e0b" filled />
                </span>
                <span>GỢI Ý TỐI ƯU NHẤT CHO BẠN</span>
              </span>
              <div className="voucher-smart-hero-title">
                Tiết kiệm tối đa: <span style={{ color: "#ea580c" }}>-{formatCurrency(bestComboSavings)}</span>
              </div>
              <div className="voucher-smart-hero-desc">
                {bestShippingVoucher && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "18px", height: "18px", borderRadius: "4px", background: "rgba(2, 132, 199, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <TruckIcon size={11} color="#0284c7" />
                    </span>
                    <span>{bestShippingVoucher.code} (-{formatCurrency(getVoucherSavings(bestShippingVoucher))})</span>
                  </span>
                )}
                {bestShippingVoucher && bestDiscountVoucher && <span> + </span>}
                {bestDiscountVoucher && (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ width: "18px", height: "18px", borderRadius: "4px", background: "rgba(234, 88, 12, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                      <TagIcon size={11} color="#ea580c" />
                    </span>
                    <span>{bestDiscountVoucher.code} (-{formatCurrency(getVoucherSavings(bestDiscountVoucher))})</span>
                  </span>
                )}
              </div>
            </div>
            <button
              type="button"
              className="btn-apply-best-combo"
              onClick={handleAutoApplyBestCombo}
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span style={{ width: "20px", height: "20px", borderRadius: "50%", background: "rgba(255, 255, 255, 0.25)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <BoltIcon size={12} color="#ffffff" />
              </span>
              <span>Áp Dụng Ngay</span>
            </button>
          </div>
        )}

        {/* Category Tabs */}
        <div className="voucher-tabs-row">
          <button
            type="button"
            className={`voucher-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}>
              <TicketIcon size={12} color="#ea580c" />
            </span>
            <span>{t("all_vouchers", "Tất Cả")} ({vouchers.length})</span>
          </button>
          <button
            type="button"
            className={`voucher-tab-btn ${activeTab === "shipping" ? "active" : ""}`}
            onClick={() => setActiveTab("shipping")}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(2, 132, 199, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}>
              <TruckIcon size={12} color="#0284c7" />
            </span>
            <span>{t("shipping_voucher", "Miễn Phí Vận Chuyển")} ({shippingVouchers.length})</span>
            {selectedShipping && (
              <span
                style={{
                  marginLeft: "6px",
                  background: "#10b981",
                  color: "#fff",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "10.5px",
                }}
              >
                1
              </span>
            )}
          </button>
          <button
            type="button"
            className={`voucher-tab-btn ${activeTab === "discount" ? "active" : ""}`}
            onClick={() => setActiveTab("discount")}
            style={{ display: "inline-flex", alignItems: "center" }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginRight: '6px' }}>
              <TagIcon size={12} color="#ea580c" />
            </span>
            <span>{t("order_discount", "Giảm Giá Đơn Hàng")} ({discountVouchers.length})</span>
            {selectedDiscount && (
              <span
                style={{
                  marginLeft: "6px",
                  background: "#10b981",
                  color: "#fff",
                  padding: "1px 6px",
                  borderRadius: "10px",
                  fontSize: "10.5px",
                }}
              >
                1
              </span>
            )}
          </button>
        </div>

        {/* Scrollable Dual Voucher List */}
        <div
          className="voucher-list-scroll"
          style={{ maxHeight: "460px", padding: "16px 20px" }}
        >
          {/* SECTION 1: FREESHIP VOUCHERS */}
          {(activeTab === "all" || activeTab === "shipping") && (
            <div style={{ marginBottom: "20px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                  paddingBottom: "6px",
                  borderBottom: "1.5px solid #0284c7",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#e0f2fe", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TruckIcon size={14} color="#0284c7" />
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "#0369a1",
                    }}
                  >
                    Mã Miễn Phí Vận Chuyển
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      background: "#e0f2fe",
                      color: "#0284c7",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Chọn tối đa 1 mã
                  </span>
                </div>
                {selectedShipping && (
                  <button
                    type="button"
                    onClick={() => setSelectedShipping(null)}
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      color: "#ef4444",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.15)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CloseIcon size={10} color="#ef4444" />
                    </span>
                    <span>Bỏ chọn ({selectedShipping.code})</span>
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {shippingVouchers.map((v) => {
                  const isSelected = selectedShipping?.code === v.code;
                  const isEligible =
                    v.minOrderValue === 0 ||
                    currentSubtotal >= v.minOrderValue ||
                    currentSubtotal === 0;
                  const missingAmount = Math.max(
                    0,
                    v.minOrderValue - currentSubtotal,
                  );
                  const saving = getVoucherSavings(v);
                  const isBest = bestShippingVoucher?.code === v.code;

                  return (
                    <div
                      key={v.id}
                      className={`voucher-ticket ${isSelected ? "selected" : ""} ${!isEligible ? "not-eligible" : ""}`}
                      onClick={() => handleToggleShipping(v)}
                      style={{
                        cursor: isEligible ? "pointer" : "default",
                        borderColor: isSelected ? "#0284c7" : undefined,
                        boxShadow: isSelected
                          ? "0 0 0 2px #0284c7"
                          : undefined,
                      }}
                    >
                      <div className="voucher-ticket-left shipping">
                        <span className="voucher-stub-icon">
                          <TruckIcon size={24} color="#0284c7" />
                        </span>
                        <span className="voucher-stub-tag">FREESHIP</span>
                        <span className="voucher-stub-sub">Toàn sàn</span>
                      </div>

                      <div className="voucher-ticket-body">
                        <div className="voucher-ticket-top">
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <h4 className="voucher-title">{v.name}</h4>
                              {isBest && (
                                <span className="voucher-best-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <span style={{ width: "15px", height: "15px", borderRadius: "3px", background: "rgba(245, 158, 11, 0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                    <StarIcon size={9} color="#f59e0b" filled />
                                  </span>
                                  <span>TỐT NHẤT CHO BẠN</span>
                                </span>
                              )}
                            </div>
                            <span className="voucher-code-badge" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <span style={{ width: "15px", height: "15px", borderRadius: "3px", background: "rgba(2, 132, 199, 0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                <TruckIcon size={9} color="#0284c7" />
                              </span>
                              <span>{v.code}</span>
                            </span>
                            {isEligible && saving > 0 && (
                              <div className="voucher-saving-highlight" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <span style={{ width: "16px", height: "16px", borderRadius: "3px", background: "rgba(2, 132, 199, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                  <BoltIcon size={10} color="#0284c7" />
                                </span>
                                <span>Tiết kiệm: -{formatCurrency(saving)}</span>
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              border: isSelected
                                ? "#0284c7"
                                : "2px solid #cbd5e1",
                              background: "#fff",
                              transition: "all 0.15s ease",
                            }}
                          />
                        </div>

                        <p className="voucher-desc">{v.description}</p>

                        <div className="voucher-ticket-footer">
                          <div className="voucher-condition-tag">
                            {isEligible ? (
                              <span className="eligible" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(5, 150, 105, 0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                  <CheckIcon size={9} color="#059669" />
                                </span>
                                <span>Đủ điều kiện</span>
                              </span>
                            ) : (
                              <span className="ineligible">
                                Mua thêm {formatCurrency(missingAmount)}
                              </span>
                            )}
                            <span
                              style={{
                                color: "var(--text-muted)",
                                marginLeft: "6px",
                              }}
                            >
                              · HSD: {v.expiryDate || "31/12/2026"}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`voucher-apply-btn ${isSelected ? "applied" : isEligible ? "select" : "disabled"}`}
                            style={{
                              background: isSelected
                                ? "#0284c7"
                                : isEligible
                                  ? undefined
                                  : undefined,
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleShipping(v);
                            }}
                          >
                            {isSelected ? (
                              <>
                                <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckIcon size={11} color="#ffffff" />
                                </span>
                                <span>Đã chọn</span>
                              </>
                            ) : isEligible ? (
                              <>
                                <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(2, 132, 199, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <TicketIcon size={10} color="#0284c7" />
                                </span>
                                <span>Chọn mã</span>
                              </>
                            ) : (
                              "Chưa đủ ĐK"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SECTION 2: PRODUCT / ORDER DISCOUNT VOUCHERS */}
          {(activeTab === "all" || activeTab === "discount") && (
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "10px",
                  paddingBottom: "6px",
                  borderBottom: "1.5px solid var(--primary-color, #ea580c)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <span style={{ width: "26px", height: "26px", borderRadius: "7px", background: "#ffedd5", display: "inline-flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <TagIcon size={14} color="#ea580c" />
                  </span>
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "var(--primary-color, #ea580c)",
                    }}
                  >
                    Mã Giảm Giá Sàn / Shop
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      background: "rgba(234, 88, 12, 0.1)",
                      color: "var(--primary-color, #ea580c)",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      fontWeight: 700,
                    }}
                  >
                    Chọn tối đa 1 mã
                  </span>
                </div>
                {selectedDiscount && (
                  <button
                    type="button"
                    onClick={() => setSelectedDiscount(null)}
                    style={{
                      background: "rgba(239, 68, 68, 0.08)",
                      border: "1px solid rgba(239, 68, 68, 0.2)",
                      borderRadius: "6px",
                      padding: "4px 8px",
                      color: "#ef4444",
                      fontSize: "12px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.15s ease",
                    }}
                  >
                    <span
                      style={{
                        width: "16px",
                        height: "16px",
                        borderRadius: "50%",
                        background: "rgba(239, 68, 68, 0.15)",
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <CloseIcon size={10} color="#ef4444" />
                    </span>
                    <span>Bỏ chọn ({selectedDiscount.code})</span>
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                }}
              >
                {discountVouchers.map((v) => {
                  const isSelected = selectedDiscount?.code === v.code;
                  const isEligible =
                    v.minOrderValue === 0 ||
                    currentSubtotal >= v.minOrderValue ||
                    currentSubtotal === 0;
                  const missingAmount = Math.max(
                    0,
                    v.minOrderValue - currentSubtotal,
                  );
                  const saving = getVoucherSavings(v);
                  const isBest = bestDiscountVoucher?.code === v.code;

                  let stubText = "";
                  let stubIcon = <TagIcon size={22} color="#ea580c" />;
                  let stubClass = "discount";

                  if (v.type === "percent") {
                    stubText = `GIẢM ${v.value}%`;
                    stubIcon = <BoltIcon size={22} color="#ea580c" />;
                  } else {
                    stubText = `GIẢM ${formatCurrency(v.value)}`;
                    stubIcon = <CoinIcon size={22} color="#f59e0b" />;
                    stubClass = "fixed";
                  }

                  return (
                    <div
                      key={v.id}
                      className={`voucher-ticket ${isSelected ? "selected" : ""} ${!isEligible ? "not-eligible" : ""}`}
                      onClick={() => handleToggleDiscount(v)}
                      style={{
                        cursor: isEligible ? "pointer" : "default",
                      }}
                    >
                      <div className={`voucher-ticket-left ${stubClass}`}>
                        <span className="voucher-stub-icon">{stubIcon}</span>
                        <span className="voucher-stub-tag">{stubText}</span>
                        <span className="voucher-stub-sub">
                          {v.isGlobal ? "Toàn sàn" : "Shop"}
                        </span>
                      </div>

                      <div className="voucher-ticket-body">
                        <div className="voucher-ticket-top">
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                              <h4 className="voucher-title">{v.name}</h4>
                              {isBest && (
                                <span className="voucher-best-badge" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                  <span style={{ width: "15px", height: "15px", borderRadius: "3px", background: "rgba(245, 158, 11, 0.2)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                    <StarIcon size={9} color="#f59e0b" filled />
                                  </span>
                                  <span>TỐT NHẤT CHO BẠN</span>
                                </span>
                              )}
                            </div>
                            <span className="voucher-code-badge" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                              <span style={{ width: "15px", height: "15px", borderRadius: "3px", background: "rgba(234, 88, 12, 0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                <TagIcon size={9} color="#ea580c" />
                              </span>
                              <span>{v.code}</span>
                            </span>
                            {isEligible && saving > 0 && (
                              <div className="voucher-saving-highlight" style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                                <span style={{ width: "16px", height: "16px", borderRadius: "3px", background: "rgba(234, 88, 12, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                  <BoltIcon size={10} color="#ea580c" />
                                </span>
                                <span>Tiết kiệm: -{formatCurrency(saving)}</span>
                              </div>
                            )}
                          </div>
                          <div
                            style={{
                              width: "20px",
                              height: "20px",
                              borderRadius: "50%",
                              border: isSelected
                                ? "6px solid var(--primary-color, #ea580c)"
                                : "2px solid #cbd5e1",
                              background: "#fff",
                              transition: "all 0.15s ease",
                            }}
                          />
                        </div>

                        <p className="voucher-desc">{v.description}</p>

                        <div className="voucher-ticket-footer">
                          <div className="voucher-condition-tag">
                            {isEligible ? (
                              <span className="eligible" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: "16px", height: "16px", borderRadius: "50%", background: "rgba(5, 150, 105, 0.15)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                                  <CheckIcon size={9} color="#059669" />
                                </span>
                                <span>Đủ điều kiện</span>
                              </span>
                            ) : (
                              <span className="ineligible">
                                Mua thêm {formatCurrency(missingAmount)}
                              </span>
                            )}
                            <span
                              style={{
                                color: "var(--text-muted)",
                                marginLeft: "6px",
                              }}
                            >
                              · HSD: {v.expiryDate || "31/12/2026"}
                            </span>
                          </div>

                          <button
                            type="button"
                            className={`voucher-apply-btn ${isSelected ? "applied" : isEligible ? "select" : "disabled"}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '5px',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleDiscount(v);
                            }}
                          >
                            {isSelected ? (
                              <>
                                <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(255, 255, 255, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <CheckIcon size={11} color="#ffffff" />
                                </span>
                                <span>Đã chọn</span>
                              </>
                            ) : isEligible ? (
                              <>
                                <span style={{ width: '16px', height: '16px', borderRadius: '3px', background: 'rgba(234, 88, 12, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <TicketIcon size={10} color="#ea580c" />
                                </span>
                                <span>Chọn mã</span>
                              </>
                            ) : (
                              "Chưa đủ ĐK"
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer with Dual Voucher Total Savings Breakdown */}
        <div
          className="voucher-modal-footer"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
            background: "#fff",
            borderTop: "2px solid #e2e8f0",
            padding: "16px 22px",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            <div
              style={{
                fontSize: "12.5px",
                color: "var(--text-secondary, #475569)",
                display: "flex",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "18px", height: "18px", borderRadius: "4px", background: "rgba(2, 132, 199, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <TruckIcon size={11} color="#0284c7" />
                </span>
                <span>
                  Ship:{" "}
                  <strong style={{ color: "#0284c7" }}>
                    {selectedShipping
                      ? `-${formatCurrency(previewShippingDiscount)} (${selectedShipping.code})`
                      : "0₫"}
                  </strong>
                </span>
              </span>
              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "18px", height: "18px", borderRadius: "4px", background: "rgba(234, 88, 12, 0.12)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <TagIcon size={11} color="#ea580c" />
                </span>
                <span>
                  Đơn:{" "}
                  <strong style={{ color: "var(--primary-color, #ea580c)" }}>
                    {selectedDiscount
                      ? `-${formatCurrency(previewOrderDiscount)} (${selectedDiscount.code})`
                      : "0₫"}
                  </strong>
                </span>
              </span>
            </div>
            <div style={{ fontSize: "14px", fontWeight: 800 }}>
              Tiết kiệm tổng cộng:{" "}
              <span
                style={{
                  color: "var(--color-success, #10b981)",
                  fontSize: "16px",
                }}
              >
                -{formatCurrency(totalPreviewSavings)}
              </span>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            {(selectedDiscount || selectedShipping) && (
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{ fontSize: "13px", padding: "9px 14px", display: "inline-flex", alignItems: "center", gap: "6px" }}
                onClick={handleClearAll}
              >
                <span style={{ width: "18px", height: "18px", borderRadius: "4px", background: "rgba(239, 68, 68, 0.1)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <CloseIcon size={10} color="#ef4444" />
                </span>
                <span>Bỏ chọn tất cả</span>
              </button>
            )}
            <button
              type="button"
              className="shopee-btn shopee-btn-primary"
              style={{
                fontSize: "13.5px",
                padding: "9px 24px",
                fontWeight: 800,
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
              }}
              onClick={handleConfirmApply}
            >
              <span style={{ width: "20px", height: "20px", borderRadius: "4px", background: "rgba(255, 255, 255, 0.22)", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                <CheckIcon size={12} color="#ffffff" />
              </span>
              <span>
                Áp Dụng
                {selectedDiscount && selectedShipping
                  ? " (2 Voucher)"
                  : selectedDiscount || selectedShipping
                    ? " (1 Voucher)"
                    : ""}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
