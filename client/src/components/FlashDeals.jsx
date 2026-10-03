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
          <div className="shopee-deals-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <BoltIcon size={16} color="#ffffff" />
            <span>FLASH DEALS / GIỜ VÀNG</span>
          </div>
          <div className="shopee-countdown-box">
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 600, fontSize: '13px' }}>
              <ClockIcon size={14} color="#ea580c" /> KẾT THÚC TRONG
            </span>
            <span className="shopee-timer-unit">{formatUnit(timeLeft.hours)}</span>
            <span className="shopee-timer-colon">:</span>
            <span className="shopee-timer-unit">{formatUnit(timeLeft.minutes)}</span>
            <span className="shopee-timer-colon">:</span>
            <span className="shopee-timer-unit">{formatUnit(timeLeft.seconds)}</span>
          </div>
        </div>

        <span
          style={{
            fontSize: '13px',
            color: 'var(--primary-color, #ea580c)',
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            cursor: 'pointer',
          }}
          onClick={() => {
            const el = document.getElementById('catalog-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <span>Xem tất cả deal sốc</span>
          <ChevronRightIcon size={13} color="var(--primary-color, #ea580c)" />
        </span>
      </div>

      {/* Time Slots Timeline Bar */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          background: 'var(--bg-muted, #f8fafc)',
          borderRadius: '10px',
          border: '1px solid var(--border-light, #e2e8f0)',
          overflow: 'hidden',
          marginBottom: '18px',
        }}
      >
        {TIME_SLOTS.map((slot) => {
          const isSelected = selectedSlot === slot.id;
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => setSelectedSlot(slot.id)}
              style={{
                background: isSelected ? 'var(--primary-color, #ea580c)' : 'transparent',
                color: isSelected ? '#ffffff' : 'var(--text-secondary, #475569)',
                border: 'none',
                padding: '10px 4px',
                textAlign: 'center',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              <div style={{ fontSize: '15px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                {isSelected && <FlameIcon size={13} color="#ffffff" />}
                <span>{slot.time}</span>
              </div>
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  opacity: isSelected ? 1 : 0.8,
                  marginTop: '2px',
                }}
              >
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
                <span className="shopee-deal-tag">-{discountPercent}%</span>
              </div>

              <div style={{ flex: 1, marginTop: '8px' }}>
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
                    color: 'var(--text-primary, #0f172a)',
                    display: '-webkit-box',
                    WebkitLineClamp: 1,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    margin: '4px 0 8px',
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
                <span className="shopee-progress-bar-text" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', justifyContent: 'center' }}>
                  <FlameIcon size={12} color="#ffffff" />
                  <span>ĐÃ BÁN {percentSold}%</span>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
