import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useCoins } from '../context/CoinContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';
import {
  CoinIcon,
  BoltIcon,
  CalendarIcon,
  ReceiptIcon,
  TicketIcon,
  CheckIcon,
  ShoppingBagIcon,
  SparklesIcon,
  TargetIcon,
  GiftIcon,
  ClockIcon,
  CloseIcon,
} from './OrdersIcons';

const renderWheelSectorIcon = (type) => {
  switch (type) {
    case 'coin':
      return (
        <g transform="translate(125, 23)" stroke="#ffffff" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="9" fill="rgba(255,255,255,0.22)" />
          <path d="M10 5v10M8 7.5h4a1.2 1.2 0 0 1 0 2.5H8a1.2 1.2 0 0 0 0 2.5h4" stroke="#ffffff" strokeWidth="1.8" />
        </g>
      );
    case 'voucher':
      return (
        <g transform="translate(125, 23)" stroke="#ffffff" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 7a2.5 2.5 0 0 1 0 5v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2a2.5 2.5 0 0 1 0-5V5a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z" fill="rgba(255,255,255,0.22)" />
          <line x1="11" y1="4" x2="11" y2="16" strokeDasharray="2 2" />
        </g>
      );
    case 'shipping':
      return (
        <g transform="translate(124, 23)" stroke="#ffffff" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="11" height="9" fill="rgba(255,255,255,0.22)" />
          <polygon points="13 7 16 7 19 10 19 13 13 13 7" fill="rgba(255,255,255,0.22)" />
          <circle cx="5.5" cy="15" r="2" fill="#ffffff" />
          <circle cx="15.5" cy="15" r="2" fill="#ffffff" />
        </g>
      );
    case 'diamond':
      return (
        <g transform="translate(125, 23)" stroke="#ffffff" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <polygon points="5 3 15 3 19 8 10 18 1 8" fill="rgba(255,255,255,0.25)" />
          <line x1="1" y1="8" x2="19" y2="8" />
          <polyline points="6 8 10 18 14 8" />
        </g>
      );
    default:
      return null;
  }
};

export default function RewardsHubModal({ onClose }) {
  const {
    coins,
    streak,
    streakRewards,
    hasCheckedInToday,
    hasSpunFreeToday,
    dailySpinsRemaining = 0,
    orderSpins = 0,
    totalSpins = 0,
    checkInToday,
    coinHistory,
    spinWheel,
  } = useCoins();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('spin'); // Mặc định mở tab spin theo yêu cầu người dùng
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);
  const [spinCountdown, setSpinCountdown] = useState(0);
  const [nextDailyCountdown, setNextDailyCountdown] = useState('00:00:00');

  // Đếm ngược trực tiếp đến 00:00 nửa đêm cho lượt quay miễn phí kế tiếp
  useEffect(() => {
    const calculateCountdown = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0);
      const diffSecs = Math.max(0, Math.floor((midnight - now) / 1000));
      const hours = String(Math.floor(diffSecs / 3600)).padStart(2, '0');
      const minutes = String(Math.floor((diffSecs % 3600) / 60)).padStart(2, '0');
      const seconds = String(diffSecs % 60).padStart(2, '0');
      setNextDailyCountdown(`${hours}:${minutes}:${seconds}`);
    };

    calculateCountdown();
    const timer = setInterval(calculateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleCheckIn = () => {
    const res = checkInToday();
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'info');
    }
  };

  const handleSpin = () => {
    if (isSpinning) return;

    if (totalSpins <= 0) {
      showToast('Bạn đã hết lượt quay! Hoàn thành đơn hàng mới để nhận thêm 1 lượt quay.', 'info');
      return;
    }

    setIsSpinning(true);
    setWonPrize(null);
    setSpinCountdown(4);

    const countdownInterval = setInterval(() => {
      setSpinCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Quay 6 vòng cộng ngẫu nhiên góc rơi
    const extraRotations = 6 * 360;
    const randomSector = Math.floor(Math.random() * 6);
    const sectorAngle = 60;
    const targetDeg = spinDeg + extraRotations + randomSector * sectorAngle + 30;

    setSpinDeg(targetDeg);

    setTimeout(() => {
      clearInterval(countdownInterval);
      setIsSpinning(false);
      const res = spinWheel();
      if (res && res.success !== false) {
        setWonPrize(res);
        const sourceNotice = res.wasDailyFree ? '(Lượt quay ngày)' : '(Thưởng từ đơn hàng)';
        showToast(`Xin chúc mừng! Bạn đã quay trúng: ${res.text} ${sourceNotice}!`, 'success');
      } else {
        showToast(res?.message || 'Không thể quay thưởng, vui lòng thử lại!', 'error');
      }
    }, 4500);
  };

  const handleGoShopping = () => {
    onClose();
    setTimeout(() => {
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) {
        catalogEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 150);
  };

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, []);

  const modalContent = (
    <div
      className="shopee-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999,
        background: 'rgba(0, 0, 0, 0.78)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSpinning) onClose();
      }}
    >
      <div
        className="anim-modal-content"
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          padding: '24px 22px',
          boxShadow: 'var(--shadow-modal, 0 20px 40px rgba(0,0,0,0.3))',
          border: '1px solid var(--border-medium, #e2e8f0)',
          position: 'relative',
        }}
      >
        {/* Header with Coin Counter */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-light, #f1f5f9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
              }}
            >
              <CoinIcon size={22} color="#ffffff" />
            </div>
            <div>
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                Số Dư Shopee Xu Của Bạn
              </div>
              <div style={{ fontSize: '19px', fontWeight: 900, color: 'var(--primary-color, #2563eb)' }}>
                {coins.toLocaleString('vi-VN')} Xu <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>(= {formatCurrency(coins)})</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isSpinning}
            onClick={onClose}
            aria-label="Đóng cửa sổ thưởng"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              padding: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon size={18} color="var(--text-muted, #64748b)" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '6px',
            background: 'var(--bg-muted, #f1f5f9)',
            padding: '4px',
            borderRadius: '10px',
            marginBottom: '18px',
          }}
        >
          <button
            type="button"
            onClick={() => !isSpinning && setActiveTab('spin')}
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              background: activeTab === 'spin' ? 'var(--bg-card, #fff)' : 'transparent',
              color: activeTab === 'spin' ? 'var(--primary-color, #ea580c)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'spin' ? 'var(--shadow-sm)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: activeTab === 'spin' ? '#fff7ed' : 'rgba(245, 158, 11, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <BoltIcon size={12} color={activeTab === 'spin' ? '#ea580c' : '#f59e0b'} />
            </span>
            <span>Vòng Quay ({totalSpins})</span>
          </button>
          <button
            type="button"
            onClick={() => !isSpinning && setActiveTab('checkin')}
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              background: activeTab === 'checkin' ? 'var(--bg-card, #fff)' : 'transparent',
              color: activeTab === 'checkin' ? 'var(--primary-color, #ea580c)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'checkin' ? 'var(--shadow-sm)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: activeTab === 'checkin' ? '#fff7ed' : 'rgba(22, 163, 74, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <CalendarIcon size={12} color={activeTab === 'checkin' ? '#ea580c' : '#16a34a'} />
            </span>
            <span>Điểm Danh 7 Ngày</span>
          </button>
          <button
            type="button"
            onClick={() => !isSpinning && setActiveTab('history')}
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: isSpinning ? 'not-allowed' : 'pointer',
              background: activeTab === 'history' ? 'var(--bg-card, #fff)' : 'transparent',
              color: activeTab === 'history' ? 'var(--primary-color, #ea580c)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'history' ? 'var(--shadow-sm)' : 'none',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: activeTab === 'history' ? '#fff7ed' : 'rgba(2, 132, 199, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <ReceiptIcon size={12} color={activeTab === 'history' ? '#ea580c' : '#0284c7'} />
            </span>
            <span>Lịch Sử Xu</span>
          </button>
        </div>

        {/* Tab 1: Lucky Spin Wheel */}
        {activeTab === 'spin' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '12px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'center' }}>
                <span style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #fff7ed, #ffedd5)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SparklesIcon size={14} color="#ea580c" />
                </span>
                <span>Vòng Quay May Mắn Fullstack E-Commerce</span>
              </h4>
              <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                1 lượt/ngày + 1 lượt cho mỗi đơn hàng thành công · 100% trúng quà không tốn xu!
              </p>
            </div>

            {/* Live Spins Status & Countdown Alert */}
            <div
              style={{
                background: totalSpins > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(234, 88, 12, 0.08)',
                border: `1px solid ${totalSpins > 0 ? '#10b981' : '#fed7aa'}`,
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '14px',
                textAlign: 'left',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div style={{ fontSize: '13px', fontWeight: 800, color: totalSpins > 0 ? '#059669' : '#ea580c', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
                  <TargetIcon size={15} color={totalSpins > 0 ? '#059669' : '#ea580c'} />
                  <span>Lượt quay khả dụng: <strong>{totalSpins} lượt</strong></span>
                </div>
                <div style={{ fontSize: '11.5px', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {dailySpinsRemaining > 0 ? (
                    <>
                      <CheckIcon size={12} color="#059669" />
                      <span>1 lượt miễn phí hôm nay</span>
                    </>
                  ) : (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <CheckIcon size={12} color="#94a3b8" />
                      <span>Đã dùng lượt miễn phí hôm nay</span>
                    </span>
                  )}
                  {orderSpins > 0 ? ` · + ${orderSpins} lượt thưởng đơn hàng` : ''}
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>
                  Lượt miễn phí tiếp theo:
                </div>
                <div style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'monospace', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                  <ClockIcon size={13} color="#0284c7" />
                  <span>{nextDailyCountdown}</span>
                </div>
              </div>
            </div>

            {/* Wheel Canvas Graphic Container */}
            <div
              style={{
                position: 'relative',
                width: '270px',
                height: '270px',
                margin: '0 auto 14px',
                borderRadius: '50%',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.28)',
                border: '6px solid #0f172a',
                overflow: 'hidden',
                transition: 'transform 4.5s cubic-bezier(0.12, 0.9, 0.2, 1)',
                transform: `rotate(${spinDeg}deg)`,
                background: '#0f172a',
              }}
            >
              <svg width="270" height="270" viewBox="0 0 270 270">
                <defs>
                  <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.3" />
                  </filter>
                </defs>
                {/* 6 Sectors with Distinct Colors & Vector Icons */}
                {[
                  { label: '500 Xu', iconType: 'coin', color: '#ea580c' },
                  { label: 'Voucher 10%', iconType: 'voucher', color: '#d97706' },
                  { label: '1.000 Xu', iconType: 'coin', color: '#0284c7' },
                  { label: 'Freeship 30k', iconType: 'shipping', color: '#059669' },
                  { label: '2.000 Xu', iconType: 'coin', color: '#7c3aed' },
                  { label: '5.000 Xu', iconType: 'diamond', color: '#db2777' },
                ].map((sec, idx) => {
                  const startA = ((idx * 60 - 90) * Math.PI) / 180;
                  const endA = (((idx + 1) * 60 - 90) * Math.PI) / 180;
                  const x1 = 135 + 132 * Math.cos(startA);
                  const y1 = 135 + 132 * Math.sin(startA);
                  const x2 = 135 + 132 * Math.cos(endA);
                  const y2 = 135 + 132 * Math.sin(endA);
                  const pathData = `M 135 135 L ${x1} ${y1} A 132 132 0 0 1 ${x2} ${y2} Z`;
                  const midAngle = idx * 60 + 30;

                  return (
                    <g key={sec.label}>
                      <path d={pathData} fill={sec.color} stroke="#ffffff" strokeWidth="2.5" />
                      <g transform={`rotate(${midAngle}, 135, 135)`}>
                        {renderWheelSectorIcon(sec.iconType)}
                        <text
                          x="135"
                          y="62"
                          textAnchor="middle"
                          fill="#ffffff"
                          fontWeight="800"
                          fontSize="11.5px"
                          style={{ textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                        >
                          {sec.label}
                        </text>
                      </g>
                    </g>
                  );
                })}
                {/* Center Hub */}
                <circle cx="135" cy="135" r="32" fill="#ffffff" stroke="#f59e0b" strokeWidth="4" />
                <g transform="translate(123, 123)">
                  <rect x="2" y="7" width="20" height="5" fill="none" stroke="#ea580c" strokeWidth="2" />
                  <polyline points="20 12 20 22 4 22 4 12" fill="none" stroke="#ea580c" strokeWidth="2" />
                  <line x1="12" y1="22" x2="12" y2="7" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" fill="none" stroke="#ea580c" strokeWidth="2" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" fill="none" stroke="#ea580c" strokeWidth="2" />
                </g>
              </svg>
            </div>

            {/* Pointer Arrow */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '14px solid transparent',
                borderRight: '14px solid transparent',
                borderTop: '20px solid #ea580c',
                margin: '-26px auto 14px',
                position: 'relative',
                zIndex: 6,
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.35))',
              }}
            />

            {/* Won Prize Celebration Card */}
            {wonPrize && (
              <div
                style={{
                  background: 'linear-gradient(135deg, #fff7ed, #ffedd5)',
                  border: '1.5px solid var(--primary-border, #fed7aa)',
                  color: 'var(--primary-color, #ea580c)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  marginBottom: '14px',
                  animation: 'fade-in 0.3s ease-out',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 900 }}>
                  Chúc mừng bạn đã trúng: {wonPrize.text}!
                </div>
                {wonPrize.type === 'voucher' && (
                  <div style={{ fontSize: '12px', color: '#059669', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <TicketIcon size={13} color="#059669" /> Mã <strong>{wonPrize.code}</strong> đã được thêm vào Kho Voucher của bạn!
                  </div>
                )}
                {wonPrize.type === 'coins' && (
                  <div style={{ fontSize: '12px', color: '#d97706', fontWeight: 700, marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <CoinIcon size={13} color="#d97706" /> Đã tự động cộng +{wonPrize.value.toLocaleString('vi-VN')} Xu vào ví của bạn!
                  </div>
                )}
              </div>
            )}

            {/* Spin Trigger Button */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <button
                type="button"
                disabled={isSpinning || totalSpins <= 0}
                onClick={handleSpin}
                className="shopee-btn shopee-btn-primary"
                style={{
                  width: '100%',
                  padding: '13px',
                  fontSize: '15px',
                  fontWeight: 800,
                  borderRadius: '10px',
                  opacity: totalSpins <= 0 ? 0.6 : 1,
                  cursor: totalSpins <= 0 ? 'not-allowed' : 'pointer',
                  boxShadow: totalSpins > 0 ? '0 4px 14px rgba(234, 88, 12, 0.35)' : 'none',
                  transition: 'all 0.2s ease',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                }}
              >
                {isSpinning ? (
                  <>
                    <BoltIcon size={16} color="#ffffff" /> ĐANG QUAY THƯỞNG... ({spinCountdown}s)
                  </>
                ) : totalSpins > 0 ? (
                  <>
                    <BoltIcon size={16} color="#ffffff" /> QUAY NGAY ({totalSpins} lượt khả dụng)
                  </>
                ) : (
                  'ĐÃ HẾT LƯỢT QUAY HÔM NAY'
                )}
              </button>

              {totalSpins <= 0 && (
                <button
                  type="button"
                  onClick={handleGoShopping}
                  style={{
                    background: 'none',
                    border: '1px dashed var(--primary-color, #ea580c)',
                    color: 'var(--primary-color, #ea580c)',
                    borderRadius: '8px',
                    padding: '8px 14px',
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <ShoppingBagIcon size={14} color="#ea580c" /> Đặt hàng ngay để nhận thêm +1 lượt quay!
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: 7-Day Check-in Streak */}
        {activeTab === 'checkin' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '16px' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800 }}>
                Chuỗi Điểm Danh: {streak}/7 Ngày
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                Điểm danh liên tục mỗi ngày để nhận tới <strong>+5.000 Shopee Xu</strong> vào ngày thứ 7!
              </p>
            </div>

            {/* 7 Days Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '8px',
                marginBottom: '20px',
              }}
            >
              {streakRewards.map((rewardAmount, idx) => {
                const dayNum = idx + 1;
                const isClaimed = dayNum <= streak;
                const isToday = dayNum === streak && hasCheckedInToday;
                const isNext = dayNum === streak + 1 && !hasCheckedInToday;

                return (
                  <div
                    key={dayNum}
                    style={{
                      background: isClaimed
                        ? 'rgba(16, 185, 129, 0.12)'
                        : isNext
                        ? 'var(--primary-light, #fff7ed)'
                        : 'var(--bg-muted, #f8fafc)',
                      border: `1.5px solid ${
                        isClaimed
                          ? '#10b981'
                          : isNext
                          ? 'var(--primary-color, #ea580c)'
                          : 'var(--border-medium, #e2e8f0)'
                      }`,
                      borderRadius: '8px',
                      padding: '10px 4px',
                      textAlign: 'center',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)' }}>
                      N{dayNum}
                    </span>
                    <span style={{ fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isClaimed ? <CheckIcon size={16} color="#059669" /> : <CoinIcon size={16} color="#f59e0b" />}
                    </span>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 800,
                        color: isClaimed ? '#10b981' : isNext ? 'var(--primary-color)' : 'var(--text-primary)',
                      }}
                    >
                      +{rewardAmount >= 1000 ? `${rewardAmount / 1000}k` : rewardAmount}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Checkin Action Button */}
            <button
              type="button"
              disabled={hasCheckedInToday}
              onClick={handleCheckIn}
              className="shopee-btn shopee-btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 800,
                borderRadius: '10px',
                opacity: hasCheckedInToday ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {hasCheckedInToday ? (
                <>
                  <CheckIcon size={16} color="#ffffff" /> Bạn đã điểm danh hôm nay rồi!
                </>
              ) : (
                <>
                  <CoinIcon size={16} color="#ffffff" /> Điểm Danh Ngay (+{streakRewards[streak % 7]?.toLocaleString('vi-VN')} Xu)
                </>
              )}
            </button>
          </div>
        )}

        {/* Tab 3: Coins History */}
        {activeTab === 'history' && (
          <div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {!coinHistory || coinHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                  <div style={{ marginBottom: '8px', display: 'flex', justifyContent: 'center' }}>
                    <CoinIcon size={32} color="#cbd5e1" />
                  </div>
                  <span>Chưa có giao dịch xu nào.</span>
                </div>
              ) : (
                coinHistory.map((tx) => {
                  const isPlus = tx.type === 'plus' || tx.type === 'credit' || tx.isCredit;
                  const label = tx.desc || tx.description || 'Giao dịch Shopee Xu';
                  const dateStr = tx.date || tx.timestamp || '';
                  return (
                    <div
                      key={tx.id}
                      style={{
                        padding: '10px 0',
                        borderBottom: '1px solid var(--border-light, #f1f5f9)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '10px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '8px',
                            background: isPlus ? '#ecfdf5' : '#fef2f2',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <CoinIcon size={14} color={isPlus ? '#10b981' : '#ef4444'} />
                        </div>
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            {label}
                          </div>
                          <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                            {dateStr}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          fontSize: '14px',
                          fontWeight: 800,
                          color: isPlus ? '#10b981' : '#ef4444',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isPlus ? '+' : '-'}{tx.amount.toLocaleString('vi-VN')} Xu
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
