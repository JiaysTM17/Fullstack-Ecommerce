import React, { useState, useEffect } from 'react';
import { BoltIcon, FlameIcon, ChevronRightIcon, ClockIcon, ShoppingBagIcon } from './OrdersIcons';
import '../styles/deals.css';

const TIME_SLOTS = [
  { id: 'slot-1', time: '09:00', label: 'Đang Diễn Ra', active: true },
  { id: 'slot-2', time: '12:00', label: 'Sắp Diễn Ra', active: false },
  { id: 'slot-3', time: '16:00', label: 'Sắp Diễn Ra', active: false },
  { id: 'slot-4', time: '20:00', label: 'Sắp Diễn Ra', active: false },
];

export default function FlashDeals({ products = [], onProductClick, formatCurrency }) {
  const [selectedSlot, setSelectedSlot] = useState(TIME_SLOTS[0].id);

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

  // Filter discounted products for flash deals
  const dealProducts = products
    .filter((p) => p.originalPrice && p.originalPrice > p.price)
    .slice(0, 6);

  if (dealProducts.length === 0) return null;

  return (
    <section id="flash-deals-section" className="shopee-deals-section">
      {/* Top Main Deals Header */}
      <div className="shopee-deals-header">
        <div className="shopee-deals-title-area">
          <div className="shopee-deals-badge">
            <span className="shopee-deals-bolt">
              <BoltIcon size={18} color="#ffffff" />
            </span>
            <span>FLASH SALE</span>
          </div>

          <div className="shopee-countdown-box">
            <span className="shopee-countdown-label">
              <ClockIcon size={14} color="#ea580c" />
              <span>KẾT THÚC TRONG</span>
            </span>
            <div className="shopee-timer-digits">
              <span className="shopee-timer-unit">{formatUnit(timeLeft.hours)}</span>
              <span className="shopee-timer-colon">:</span>
              <span className="shopee-timer-unit">{formatUnit(timeLeft.minutes)}</span>
              <span className="shopee-timer-colon">:</span>
              <span className="shopee-timer-unit">{formatUnit(timeLeft.seconds)}</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="shopee-deals-view-all"
          onClick={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>Xem tất cả deal sốc</span>
          <ChevronRightIcon size={14} color="currentColor" />
        </button>
      </div>

      {/* Time Slots Timeline Bar */}
      <div className="shopee-time-slots-bar">
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              className={`shopee-time-slot-btn ${isSelected ? 'active' : ''}`}
              onClick={() => setSelectedSlot(slot.id)}
            >
              <div className="shopee-slot-time">
                {isSelected && <FlameIcon size={15} color="#ea580c" />}
                <span>{slot.time}</span>
              </div>
              <div className="shopee-slot-label">
                {slot.label}
              </div>
            </button>
          );
        })}
      </div>

      {/* Deals Product Grid */}
      <div className="shopee-deals-grid">
        {dealProducts.map((prod, idx) => {
          const discountPercent = Math.round(
            ((prod.originalPrice - prod.price) / prod.originalPrice) * 100
          );
          const percentSold = Math.min(95, Math.max(30, ((prod.sold || 50) % 70) + 25 + idx * 4));

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
                <div className="shopee-deal-discount-badge">
                  <span className="shopee-discount-number">-{discountPercent}%</span>
                  <span className="shopee-discount-text">GIẢM</span>
                </div>
              </div>

              <div className="shopee-deal-info">
                <div className="shopee-deal-price-row">
                  <span className="shopee-deal-price">
                    {formatCurrency ? formatCurrency(prod.price) : `${prod.price.toLocaleString()}₫`}
                  </span>
                  <span className="shopee-deal-original">
                    {formatCurrency
                      ? formatCurrency(prod.originalPrice)
                      : `${prod.originalPrice.toLocaleString()}₫`}
                  </span>
                </div>

                <div className="shopee-deal-name">
                  {prod.name}
                </div>

                {/* Fire progress bar */}
                <div className="shopee-fire-bar-container">
                  <div
                    className="shopee-fire-bar-fill"
                    style={{ width: `${percentSold}%` }}
                  />
                  <div className="shopee-fire-bar-content">
                    <FlameIcon size={12} color="#ffffff" />
                    <span>ĐÃ BÁN {percentSold}%</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
