import React, { useState, useEffect } from 'react';
import '../styles/deals.css';

export default function FlashDeals({ products = [], onProductClick, formatCurrency }) {
  // Real-time countdown timer (hours, minutes, seconds)
  const [timeLeft, setTimeLeft] = useState({
    hours: 2,
    minutes: 45,
    seconds: 30,
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 3, minutes: 0, seconds: 0 };
        }
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatUnit = (num) => String(num).padStart(2, '0');

  // Take top 4 discounted products
  const dealProducts = products
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .slice(0, 4);

  if (dealProducts.length === 0) return null;

  return (
    <section className="shopee-deals-section">
      <div className="shopee-deals-header">
        <div className="shopee-deals-title-area">
          <div className="shopee-deals-badge">
            ⚡ FLASH DEALS / GIỜ VÀNG
          </div>
          <div className="shopee-countdown-box">
            <span>KẾT THÚC TRONG</span>
            <span className="shopee-timer-unit">{formatUnit(timeLeft.hours)}</span>
            <span className="shopee-timer-colon">:</span>
            <span className="shopee-timer-unit">{formatUnit(timeLeft.minutes)}</span>
            <span className="shopee-timer-colon">:</span>
            <span className="shopee-timer-unit">{formatUnit(timeLeft.seconds)}</span>
          </div>
        </div>

        <span style={{ fontSize: '13px', color: '#ee4d2d', fontWeight: 600 }}>
          Xem tất cả deal sốc →
        </span>
      </div>

      <div className="shopee-deals-grid">
        {dealProducts.map((prod) => {
          const discountPercent = Math.round(
            ((prod.originalPrice - prod.price) / prod.originalPrice) * 100
          );
          const percentSold = Math.min(95, Math.max(30, ((prod.sold || 50) % 70) + 25));

          return (
            <div
              key={prod._id || prod.id}
              className="shopee-deal-card"
              onClick={() => onProductClick && onProductClick(prod)}
            >
              <div className="shopee-deal-img-wrapper">
                <img
                  src={prod.image || prod.images?.[0]}
                  alt={prod.name}
                  className="shopee-deal-img"
                  loading="lazy"
                />
                <span className="shopee-deal-tag">-{discountPercent}%</span>
              </div>

              <div style={{ flex: 1 }}>
                <div className="shopee-deal-price">
                  {formatCurrency ? formatCurrency(prod.price) : `${prod.price.toLocaleString()}₫`}
                  <span className="shopee-deal-original">
                    {formatCurrency
                      ? formatCurrency(prod.originalPrice)
                      : `${prod.originalPrice.toLocaleString()}₫`}
                  </span>
                </div>

                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#222',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {prod.name}
                </div>
              </div>

              {/* Progress bar */}
              <div className="shopee-progress-bar-wrapper">
                <div
                  className="shopee-progress-bar-fill"
                  style={{ width: `${percentSold}%` }}
                />
                <span className="shopee-progress-bar-text">
                  🔥 ĐÃ BÁN {percentSold}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
