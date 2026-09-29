import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { formatCurrency } from "../utils/formatCurrency";
import { getRecentlyViewed, clearRecentlyViewed } from "../services/recentlyViewedService";

export default function RecentlyViewedSection({ currentProductId, hideIfEmpty = true }) {
  const [recentItems, setRecentItems] = useState([]);
  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const loadRecent = () => {
    let items = getRecentlyViewed();
    if (currentProductId) {
      items = items.filter((p) => (p._id || p.id) !== currentProductId);
    }
    setRecentItems(items.slice(0, 8)); // Top 8 items
  };

  useEffect(() => {
    loadRecent();

    const handleUpdate = () => {
      loadRecent();
    };

    window.addEventListener("mini_shopee_recently_viewed_updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("mini_shopee_recently_viewed_updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [currentProductId]);

  if (hideIfEmpty && recentItems.length === 0) {
    return null;
  }

  const handleClear = () => {
    if (window.confirm("Bạn có chắc chắn muốn xóa toàn bộ lịch sử sản phẩm đã xem?")) {
      clearRecentlyViewed();
      setRecentItems([]);
      showToast("Đã xóa lịch sử sản phẩm đã xem", "info");
    }
  };

  const handleQuickAdd = (e, item) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(item, 1);
    showToast(`Đã thêm "${item.name}" vào giỏ hàng!`, "success");
  };

  return (
    <section
      style={{
        marginTop: "36px",
        background: "var(--bg-card, #ffffff)",
        borderRadius: "12px",
        padding: "20px 24px",
        border: "1px solid var(--border-medium, #e2e8f0)",
        boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "16px",
          paddingBottom: "12px",
          borderBottom: "1px solid var(--border-medium, #f1f5f9)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "20px" }}>👁️</span>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "var(--text-primary, #0f172a)" }}>
              {t("recently_viewed", "Sản phẩm bạn vừa xem")}
            </h3>
            <span style={{ fontSize: "12px", color: "var(--text-secondary, #64748b)" }}>
              {recentItems.length} sản phẩm được lưu gần đây
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleClear}
          style={{
            background: "none",
            border: "none",
            fontSize: "12.5px",
            color: "var(--text-muted, #94a3b8)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            padding: "4px 8px",
            borderRadius: "6px",
            transition: "all 0.15s ease",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.color = "#ef4444";
            e.currentTarget.style.background = "#fee2e2";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.color = "var(--text-muted, #94a3b8)";
            e.currentTarget.style.background = "none";
          }}
        >
          🗑️ {t("clear_history", "Xóa lịch sử")}
        </button>
      </div>

      {recentItems.length === 0 ? (
        <p style={{ textAlign: "center", color: "var(--text-muted, #94a3b8)", fontSize: "13.5px", margin: "20px 0" }}>
          Bạn chưa xem sản phẩm nào gần đây.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))",
            gap: "14px",
          }}
        >
          {recentItems.map((item) => {
            const pId = item._id || item.id;
            const discountPercent =
              item.originalPrice && item.originalPrice > item.price
                ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                : 0;

            return (
              <div
                key={pId}
                style={{
                  border: "1px solid var(--border-medium, #e2e8f0)",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#fff",
                  display: "flex",
                  flexDirection: "column",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.transform = "translateY(-2px)";
                  e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.08)";
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.transform = "none";
                  e.currentTarget.style.boxShadow = "none";
                }}
              >
                <Link
                  to={`/products/${pId}`}
                  style={{ textDecoration: "none", color: "inherit", display: "flex", flexDirection: "column", height: "100%" }}
                >
                  <div style={{ position: "relative", width: "100%", paddingTop: "100%", background: "#f8fafc" }}>
                    <img
                      src={item.image}
                      alt={item.name}
                      style={{
                        position: "absolute",
                        top: 0,
                        left: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                      loading="lazy"
                    />
                    {discountPercent > 0 && (
                      <span
                        style={{
                          position: "absolute",
                          top: "6px",
                          right: "6px",
                          background: "#ef4444",
                          color: "#fff",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "2px 5px",
                          borderRadius: "4px",
                        }}
                      >
                        -{discountPercent}%
                      </span>
                    )}
                  </div>

                  <div style={{ padding: "10px", display: "flex", flexDirection: "column", flex: 1, justifyContent: "space-between" }}>
                    <div>
                      <h4
                        style={{
                          margin: "0 0 6px",
                          fontSize: "12.5px",
                          fontWeight: 600,
                          color: "var(--text-primary, #0f172a)",
                          lineHeight: "1.35",
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                        title={item.name}
                      >
                        {item.name}
                      </h4>

                      <div style={{ display: "flex", alignItems: "baseline", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                        <strong style={{ fontSize: "13.5px", color: "var(--primary-color, #ea580c)" }}>
                          {formatCurrency(item.price)}
                        </strong>
                        {item.originalPrice > item.price && (
                          <span style={{ fontSize: "11px", color: "#94a3b8", textDecoration: "line-through" }}>
                            {formatCurrency(item.originalPrice)}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleQuickAdd(e, item)}
                      style={{
                        width: "100%",
                        padding: "6px 8px",
                        fontSize: "11.5px",
                        fontWeight: 600,
                        background: "var(--primary-light, #ffedd5)",
                        color: "var(--primary-color, #ea580c)",
                        border: "1px solid rgba(234, 88, 12, 0.3)",
                        borderRadius: "6px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        transition: "all 0.15s ease",
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.background = "var(--primary-color, #ea580c)";
                        e.currentTarget.style.color = "#fff";
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.background = "var(--primary-light, #ffedd5)";
                        e.currentTarget.style.color = "var(--primary-color, #ea580c)";
                      }}
                    >
                      🛒 Thêm nhanh
                    </button>
                  </div>
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
