import React, { useState } from 'react';
import { useCoins } from '../context/CoinContext';
import { useToast } from '../context/ToastContext';
import { formatCurrency } from '../utils/formatCurrency';

export default function RewardsHubModal({ onClose }) {
  const { coins, streak, streakRewards, hasCheckedInToday, checkInToday, coinHistory, spinWheel } = useCoins();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('checkin'); // 'checkin' | 'spin' | 'history'
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinDeg, setSpinDeg] = useState(0);
  const [wonPrize, setWonPrize] = useState(null);

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
    setIsSpinning(true);
    setWonPrize(null);

    // Random rotations + landing
    const extraRotations = 5 * 360;
    const randomSector = Math.floor(Math.random() * 6);
    const sectorAngle = 60;
    const targetDeg = spinDeg + extraRotations + randomSector * sectorAngle + 30;

    setSpinDeg(targetDeg);

    setTimeout(() => {
      setIsSpinning(false);
      const prize = spinWheel();
      setWonPrize(prize);
      showToast(`🎉 Xin chúc mừng! Bạn đã quay trúng: ${prize.text}!`, 'success');
    }, 3000);
  };

  return (
    <div
      className="shopee-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
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
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '560px',
          padding: '28px 24px',
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
            marginBottom: '18px',
            paddingBottom: '14px',
            borderBottom: '1px solid var(--border-light, #f1f5f9)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                color: '#fff',
                fontSize: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.4)',
              }}
            >
              🪙
            </div>
            <div>
              <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase' }}>
                Số Dư Mini Xu Của Bạn
              </div>
              <div style={{ fontSize: '20px', fontWeight: 900, color: 'var(--primary-color, #ea580c)' }}>
                {coins.toLocaleString('vi-VN')} Xu <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>(= {formatCurrency(coins)})</span>
              </div>
            </div>
          </div>

          <button
            type="button"
            disabled={isSpinning}
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            ✕
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
            marginBottom: '20px',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('checkin')}
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'checkin' ? 'var(--bg-card, #fff)' : 'transparent',
              color: activeTab === 'checkin' ? 'var(--primary-color, #ea580c)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'checkin' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            📅 Điểm Danh 7 Ngày
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('spin')}
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'spin' ? 'var(--bg-card, #fff)' : 'transparent',
              color: activeTab === 'spin' ? 'var(--primary-color, #ea580c)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'spin' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            🎡 Vòng Quay May Mắn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              border: 'none',
              borderRadius: '8px',
              padding: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
              background: activeTab === 'history' ? 'var(--bg-card, #fff)' : 'transparent',
              color: activeTab === 'history' ? 'var(--primary-color, #ea580c)' : 'var(--text-secondary)',
              boxShadow: activeTab === 'history' ? 'var(--shadow-sm)' : 'none',
            }}
          >
            📜 Lịch Sử Xu
          </button>
        </div>

        {/* Tab 1: 7-Day Check-in Streak */}
        {activeTab === 'checkin' && (
          <div>
            <div style={{ textAlign: 'center', marginBottom: '18px' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '16px', fontWeight: 800 }}>
                Chuỗi Điểm Danh: {streak}/7 Ngày
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                Điểm danh liên tục mỗi ngày để nhận tới <strong>+5.000 Mini Xu</strong> vào ngày thứ 7!
              </p>
            </div>

            {/* 7 Days Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '8px',
                marginBottom: '22px',
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
                    <span style={{ fontSize: '18px' }}>{isClaimed ? '✓' : '🪙'}</span>
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
              }}
            >
              {hasCheckedInToday
                ? '✓ Bạn đã điểm danh hôm nay rồi!'
                : `🎁 Điểm Danh Ngay (+${streakRewards[streak % 7]?.toLocaleString('vi-VN')} Xu)`}
            </button>
          </div>
        )}

        {/* Tab 2: Lucky Spin Wheel */}
        {activeTab === 'spin' && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ marginBottom: '14px' }}>
              <h4 style={{ margin: '0 0 4px', fontSize: '16px', fontWeight: 800 }}>
                🎡 Vòng Quay May Mắn Fullstack E-Commerce
              </h4>
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-secondary)' }}>
                Quay là 100% trúng quà: Xu thưởng khủng, Mã giảm 10%, Mã Freeship toàn quốc!
              </p>
            </div>

            {/* Wheel Canvas Graphic Container */}
            <div
              style={{
                position: 'relative',
                width: '260px',
                height: '260px',
                margin: '0 auto 20px',
                borderRadius: '50%',
                border: '6px solid var(--header-bg, #0f172a)',
                overflow: 'hidden',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.25)',
                transition: 'transform 3s cubic-bezier(0.15, 0.9, 0.25, 1)',
                transform: `rotate(${spinDeg}deg)`,
              }}
            >
              {/* 6 Circular Wedge Sections */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'conic-gradient(#ea580c 0deg 60deg, #f59e0b 60deg 120deg, #0284c7 120deg 180deg, #10b981 180deg 240deg, #8b5cf6 240deg 300deg, #ec4899 300deg 360deg)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    width: '60px',
                    height: '60px',
                    borderRadius: '50%',
                    background: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '22px',
                    fontWeight: 900,
                    color: '#ea580c',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    zIndex: 2,
                  }}
                >
                  🎁
                </div>
              </div>
            </div>

            {/* Pointer Arrow */}
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: '12px solid transparent',
                borderRight: '12px solid transparent',
                borderTop: '18px solid #ea580c',
                margin: '-30px auto 16px',
                position: 'relative',
                zIndex: 4,
              }}
            />

            {/* Won Prize Banner */}
            {wonPrize && (
              <div
                style={{
                  background: 'var(--primary-light, #fff7ed)',
                  border: '1px solid var(--primary-border, #fed7aa)',
                  color: 'var(--primary-color, #ea580c)',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  fontWeight: 800,
                  fontSize: '14px',
                  marginBottom: '16px',
                  animation: 'fade-in 0.3s ease-out',
                }}
              >
                🎉 Chúc mừng bạn đã trúng: {wonPrize.text}!
              </div>
            )}

            {/* Spin Trigger Button */}
            <button
              type="button"
              disabled={isSpinning}
              onClick={handleSpin}
              className="shopee-btn shopee-btn-primary"
              style={{
                width: '100%',
                padding: '12px',
                fontSize: '15px',
                fontWeight: 800,
                borderRadius: '10px',
              }}
            >
              {isSpinning ? '⏳ Đang quay thưởng...' : '⚡ QUAY NGAY (Miễn phí)'}
            </button>
          </div>
        )}

        {/* Tab 3: Coins History */}
        {activeTab === 'history' && (
          <div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {coinHistory.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                  Chưa có giao dịch xu nào.
                </div>
              ) : (
                coinHistory.map((tx) => (
                  <div
                    key={tx.id}
                    style={{
                      padding: '10px 0',
                      borderBottom: '1px solid var(--border-light, #f1f5f9)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {tx.desc}
                      </div>
                      <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                        {tx.date}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: '14px',
                        fontWeight: 800,
                        color: tx.type === 'plus' ? '#10b981' : '#ef4444',
                      }}
                    >
                      {tx.type === 'plus' ? `+${tx.amount.toLocaleString('vi-VN')}` : `-${tx.amount.toLocaleString('vi-VN')}`} Xu
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
