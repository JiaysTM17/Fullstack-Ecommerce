import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useToast } from "../context/ToastContext";
import { useLanguage } from "../context/LanguageContext";
import { formatCurrency } from "../utils/formatCurrency";
import { getRecentlyViewed, clearRecentlyViewed } from "../services/recentlyViewedService";

export default function RecentlyViewedSection({ currentProductId, hideIfEmpty = true, onProductClick }) {
  const [recentItems, setRecentItems] = useState([]);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const scrollContainerRef = useRef(null);

  const { addToCart } = useCart();
  const { showToast } = useToast();
  const { t } = useLanguage();

  const loadRecent = () => {
    let items = getRecentlyViewed();
    if (currentProductId) {
      items = items.filter((p) => (p._id || p.id) !== currentProductId);
    }
    // Up to 20 items per requirement R2
    setRecentItems(items.slice(0, 20));
  };

  const checkScroll = () => {
    const el = scrollContainerRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 10);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 10);
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

  useEffect(() => {
    checkScroll();
    const el = scrollContainerRef.current;
    if (el) {
      el.addEventListener("scroll", checkScroll, { passive: true });
      window.addEventListener("resize", checkScroll);
      return () => {
        el.removeEventListener("scroll", checkScroll);
        window.removeEventListener("resize", checkScroll);
      };
    }
  }, [recentItems]);

  const handleScroll = (direction) => {
    const el = scrollContainerRef.current;
    if (!el) return;
    const scrollAmount = direction === "left" ? -el.clientWidth * 0.75 : el.clientWidth * 0.75;
    el.scrollBy({ left: scrollAmount, behavior: "smooth" });
  };

  if (hideIfEmpty && recentItems.length === 0) {
    return null;
  }

  const handleClear = () => {
    const confirmed = window.confirm(
      t("confirm_clear_history", "Bạn có chắc chắn muốn xóa toàn bộ lịch sử sản phẩm đã xem?")
    );
    if (confirmed) {
      clearRecentlyViewed();
      setRecentItems([]);
      showToast(t("cleared_recently_viewed", "Đã xóa lịch sử sản phẩm đã xem"), "info");
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
        position: "relative",
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
              {recentItems.length} sản phẩm được lưu gần đây (tối đa 20 sản phẩm)
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
        <div style={{ position: "relative" }}>
          {/* Left Scroll Navigation Button */}
          <button
            type="button"
            aria-label="Cuộn sang trái"
            onClick={() => handleScroll("left")}
            disabled={!canScrollLeft}
            style={{
              position: "absolute",
              left: "-14px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 3,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              cursor: canScrollLeft ? "pointer" : "default",
              opacity: canScrollLeft ? 1 : 0,
              pointerEvents: canScrollLeft ? "auto" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1e293b",
              fontSize: "20px",
              fontWeight: 800,
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              if (canScrollLeft) {
                e.currentTarget.style.background = "var(--primary-color, #ea580c)";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "var(--primary-color, #ea580c)";
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#1e293b";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            ‹
          </button>

          {/* Right Scroll Navigation Button */}
          <button
            type="button"
            aria-label="Cuộn sang phải"
            onClick={() => handleScroll("right")}
            disabled={!canScrollRight}
            style={{
              position: "absolute",
              right: "-14px",
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 3,
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "#ffffff",
              border: "1px solid #cbd5e1",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              cursor: canScrollRight ? "pointer" : "default",
              opacity: canScrollRight ? 1 : 0,
              pointerEvents: canScrollRight ? "auto" : "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#1e293b",
              fontSize: "20px",
              fontWeight: 800,
              transition: "all 0.2s ease",
            }}
            onMouseOver={(e) => {
              if (canScrollRight) {
                e.currentTarget.style.background = "var(--primary-color, #ea580c)";
                e.currentTarget.style.color = "#ffffff";
                e.currentTarget.style.borderColor = "var(--primary-color, #ea580c)";
              }
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.background = "#ffffff";
              e.currentTarget.style.color = "#1e293b";
              e.currentTarget.style.borderColor = "#cbd5e1";
            }}
          >
            ›
          </button>

          {/* Scrollable Horizontal Carousel Container */}
          <div
            ref={scrollContainerRef}
            style={{
              display: "flex",
              gap: "14px",
              overflowX: "auto",
              scrollBehavior: "smooth",
              padding: "4px 2px 14px",
              scrollbarWidth: "thin",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {recentItems.map((item) => {
              const pId = item._id || item.id;
              const discountPercent =
                item.discount ||
                (item.originalPrice && item.originalPrice > item.price
                  ? Math.round(((item.originalPrice - item.price) / item.originalPrice) * 100)
                  : 0);

              return (
                <div
                  key={pId}
                  style={{
                    flex: "0 0 180px",
                    width: "180px",
                    minWidth: "180px",
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
                    onClick={(e) => {
                      if (onProductClick) {
                        e.preventDefault();
                        onProductClick(item);
                      }
                    }}
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
        </div>
      )}
    </section>
  );
}
