import React, { useState, useEffect } from "react";
import { getVouchers, validateVoucher } from "../services/voucherService";
import { formatCurrency } from "../utils/formatCurrency";
import { useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";
import "../styles/voucher-modal.css";

export default function VoucherPickerModal({
  isOpen,
  onClose,
  onApplyVoucher,
  onRemoveVoucher,
  appliedVoucher,
  currentSubtotal = 0,
}) {
  const { t } = useLanguage();
  const { showToast } = useToast();
  const [vouchers, setVouchers] = useState([]);
  const [customCode, setCustomCode] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'discount' | 'shipping'
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (isOpen) {
      setVouchers(getVouchers());
      setErrorMessage("");
      setCustomCode("");
    }
  }, [isOpen]);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter vouchers by tab
  const filteredVouchers = vouchers.filter((v) => {
    if (activeTab === "shipping") return v.type === "shipping";
    if (activeTab === "discount") return v.type === "percent" || v.type === "fixed";
    return true;
  });

  const handleApplyCustomCode = (e) => {
    e.preventDefault();
    const code = customCode.trim().toUpperCase();
    if (!code) {
      setErrorMessage("Vui lòng nhập mã voucher");
      return;
    }

    const res = onApplyVoucher(code);
    if (res && res.success === false) {
      setErrorMessage(res.message);
    } else {
      showToast(`✓ Đã áp dụng mã "${code}" thành công!`, "success");
      onClose();
    }
  };

  const handleSelectVoucher = (v) => {
    if (v.minOrderValue > 0 && currentSubtotal > 0 && currentSubtotal < v.minOrderValue) {
      showToast(`Chưa đủ điều kiện: Cần mua thêm ${formatCurrency(v.minOrderValue - currentSubtotal)}`, "info");
      return;
    }

    const res = onApplyVoucher(v.code);
    if (res && res.success === false) {
      showToast(res.message || "Không thể áp dụng mã", "error");
    } else {
      showToast(`✓ Đã áp dụng mã "${v.code}"!`, "success");
      onClose();
    }
  };

  const handleRemove = () => {
    if (onRemoveVoucher) {
      onRemoveVoucher();
      showToast("Đã gỡ mã giảm giá", "info");
    }
  };

  return (
    <div className="voucher-modal-overlay" onClick={onClose} role="dialog" aria-modal="true">
      <div className="voucher-modal-dialog" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="voucher-modal-header">
          <h3 className="voucher-modal-title">
            <span>🎟️</span>
            <span>{t("select_voucher_title", "Chọn Mã Giảm Giá / Voucher Sàn")}</span>
          </h3>
          <button
            type="button"
            className="voucher-modal-close"
            onClick={onClose}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Custom Voucher Input Bar */}
        <form className="voucher-input-bar" onSubmit={handleApplyCustomCode}>
          <input
            type="text"
            className="voucher-input-field"
            placeholder={t("enter_voucher_placeholder", "Nhập mã voucher (VD: MINI10, FREESHIP)...")}
            value={customCode}
            onChange={(e) => {
              setCustomCode(e.target.value);
              setErrorMessage("");
            }}
          />
          <button
            type="submit"
            className="voucher-apply-btn select"
            style={{ padding: "0 18px" }}
          >
            {t("apply", "Áp Dụng")}
          </button>
        </form>

        {errorMessage && (
          <div style={{ padding: "8px 22px", background: "rgba(239, 68, 68, 0.08)", color: "var(--color-error, #ef4444)", fontSize: "12.5px", fontWeight: 600 }}>
            ⚠️ {errorMessage}
          </div>
        )}

        {/* Category Tabs */}
        <div className="voucher-tabs-row">
          <button
            type="button"
            className={`voucher-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            {t("all_vouchers", "Tất Cả")} ({vouchers.length})
          </button>
          <button
            type="button"
            className={`voucher-tab-btn ${activeTab === "discount" ? "active" : ""}`}
            onClick={() => setActiveTab("discount")}
          >
            🏷️ {t("order_discount", "Giảm Giá Đơn Hàng")}
          </button>
          <button
            type="button"
            className={`voucher-tab-btn ${activeTab === "shipping" ? "active" : ""}`}
            onClick={() => setActiveTab("shipping")}
          >
            🚚 {t("shipping_voucher", "Miễn Phí Vận Chuyển")}
          </button>
        </div>

        {/* Scrollable Voucher List */}
        <div className="voucher-list-scroll">
          {filteredVouchers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
              <div style={{ fontSize: "36px", marginBottom: "8px" }}>🎟️</div>
              <p>Hiện không có mã giảm giá nào thuộc mục này.</p>
            </div>
          ) : (
            filteredVouchers.map((v) => {
              const isSelected = appliedVoucher?.code === v.code;
              const isEligible = v.minOrderValue === 0 || currentSubtotal >= v.minOrderValue || currentSubtotal === 0;
              const missingAmount = Math.max(0, v.minOrderValue - currentSubtotal);

              let stubText = "";
              let stubIcon = "🏷️";
              let stubClass = "discount";

              if (v.type === "percent") {
                stubText = `GIẢM ${v.value}%`;
                stubIcon = "⚡";
              } else if (v.type === "shipping") {
                stubText = "FREESHIP";
                stubIcon = "🚚";
                stubClass = "shipping";
              } else {
                stubText = `GIẢM ${formatCurrency(v.value)}`;
                stubIcon = "💰";
                stubClass = "fixed";
              }

              return (
                <div
                  key={v.id}
                  className={`voucher-ticket ${isSelected ? "selected" : ""} ${!isEligible ? "not-eligible" : ""}`}
                  onClick={() => {
                    if (isSelected) {
                      handleRemove();
                    } else if (isEligible) {
                      handleSelectVoucher(v);
                    } else {
                      showToast(`Chưa đủ điều kiện: Cần mua thêm ${formatCurrency(missingAmount)}`, "info");
                    }
                  }}
                  style={{ cursor: isEligible ? "pointer" : "default" }}
                >
                  {/* Left Ticket Stub */}
                  <div className={`voucher-ticket-left ${stubClass}`}>
                    <span className="voucher-stub-icon">{stubIcon}</span>
                    <span className="voucher-stub-tag">{stubText}</span>
                    <span className="voucher-stub-sub">{v.isGlobal ? "Toàn sàn" : "Shop"}</span>
                  </div>

                  {/* Body */}
                  <div className="voucher-ticket-body">
                    <div className="voucher-ticket-top">
                      <div>
                        <h4 className="voucher-title">{v.name}</h4>
                        <span className="voucher-code-badge">{v.code}</span>
                      </div>
                      {isSelected && (
                        <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--color-success, #10b981)", background: "rgba(16, 185, 129, 0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                          ✓ Đang dùng
                        </span>
                      )}
                    </div>

                    <p className="voucher-desc">{v.description}</p>

                    <div className="voucher-ticket-footer">
                      <div className="voucher-condition-tag">
                        {isEligible ? (
                          <span className="eligible">✓ Đủ điều kiện</span>
                        ) : (
                          <span className="ineligible">
                            Mua thêm {formatCurrency(missingAmount)}
                          </span>
                        )}
                        <span style={{ color: "var(--text-muted)", marginLeft: "6px" }}>
                          · HSD: {v.expiryDate || "31/12/2026"}
                        </span>
                      </div>

                      {isSelected ? (
                        <button
                          type="button"
                          className="voucher-apply-btn applied"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemove();
                          }}
                          title="Bỏ dùng mã này"
                        >
                          ✕ Gỡ mã
                        </button>
                      ) : isEligible ? (
                        <button
                          type="button"
                          className="voucher-apply-btn select"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectVoucher(v);
                          }}
                        >
                          Áp Dụng
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="voucher-apply-btn disabled"
                          disabled
                          onClick={(e) => e.stopPropagation()}
                          title={`Đơn hàng tối thiểu ${formatCurrency(v.minOrderValue)}`}
                        >
                          Chưa đủ ĐK
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="voucher-modal-footer">
          <div className="voucher-active-status">
            {appliedVoucher ? (
              <span>
                Đang áp dụng: <strong>{appliedVoucher.code}</strong>
              </span>
            ) : (
              <span>Chưa áp dụng voucher nào</span>
            )}
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            {appliedVoucher && (
              <button
                type="button"
                className="shopee-btn shopee-btn-secondary"
                style={{ fontSize: "12.5px", padding: "8px 14px" }}
                onClick={handleRemove}
              >
                Bỏ chọn
              </button>
            )}
            <button
              type="button"
              className="shopee-btn shopee-btn-primary"
              style={{ fontSize: "12.5px", padding: "8px 20px" }}
              onClick={onClose}
            >
              OK / Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
