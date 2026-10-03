import React, { useState } from 'react';
import { useCoins } from '../context/CoinContext';
import { useToast } from '../context/ToastContext';
import {
  CoinIcon,
  CheckIcon,
  BoltIcon,
  StarIcon,
  ChevronRightIcon,
} from './OrdersIcons';

export default function DailyCheckinStreakCard({ onOpenRewardsModal }) {
  const {
    coins,
    streak,
    streakRewards = [500, 1000, 1500, 2000, 2500, 3000, 5000],
    hasCheckedInToday,
    checkInToday,
    totalSpins,
  } = useCoins();
  const { showToast } = useToast();
  const [isClaiming, setIsClaiming] = useState(false);

  const nextDay = (streak % 7) + 1;
  const todayReward = streakRewards[nextDay - 1] || 500;

  const handleClaim = () => {
    if (hasCheckedInToday) {
      showToast('Bạn đã điểm danh hôm nay rồi! Hãy quay lại vào ngày mai nhé.', 'info');
      return;
    }

    setIsClaiming(true);
    const result = checkInToday();
    setIsClaiming(false);

    if (result?.success) {
      showToast(result.message, 'success');
    } else if (result?.message) {
      showToast(result.message, 'info');
    }
  };

  return (
    <div
      style={{
        background: 'linear-gradient(135deg, #fffbeb 0%, #ffffff 50%, #fef3c7 100%)',
        border: '1.5px solid #fde68a',
        borderRadius: '16px',
        padding: '20px 24px',
        boxShadow: '0 4px 16px rgba(245, 158, 11, 0.08)',
        marginBottom: '28px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Background decorative coin watermark */}
      <div
        style={{
          position: 'absolute',
          top: '-15px',
          right: '-15px',
          opacity: 0.08,
          pointerEvents: 'none',
          transform: 'rotate(15deg)',
        }}
      >
        <CoinIcon size={120} color="#f59e0b" />
      </div>

      {/* Top Header Row */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '18px',
        }}
      >
        {/* Left balance & title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b, #d97706)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(245, 158, 11, 0.35)',
            }}
          >
            <CoinIcon size={24} color="#ffffff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '16px', fontWeight: 800, color: '#92400e' }}>
                Mini Xu Thưởng Hàng Ngày
              </span>
              <span
                style={{
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  borderRadius: '999px',
                  padding: '1px 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#b45309',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <BoltIcon size={11} color="#d97706" /> Chuỗi {streak}/7 ngày
              </span>
            </div>
            <div style={{ fontSize: '13px', color: '#78350f', marginTop: '2px' }}>
              Số dư: <strong style={{ color: '#d97706', fontSize: '15px' }}>{coins.toLocaleString('vi-VN')} Xu</strong> (Dùng trừ trực tiếp tới 50% hóa đơn)
            </div>
          </div>
        </div>

        {/* Right CTA button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {onOpenRewardsModal && (
            <button
              type="button"
              onClick={onOpenRewardsModal}
              style={{
                background: '#ffffff',
                border: '1px solid #fcd34d',
                color: '#b45309',
                borderRadius: '8px',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
              }}
            >
              <span>Vòng Quay ({totalSpins})</span>
              <ChevronRightIcon size={13} color="#b45309" />
            </button>
          )}

          <button
            type="button"
            onClick={handleClaim}
            disabled={hasCheckedInToday || isClaiming}
            style={{
              background: hasCheckedInToday
                ? '#f1f5f9'
                : 'linear-gradient(135deg, #ea580c, #c2410c)',
              border: hasCheckedInToday ? '1px solid #cbd5e1' : 'none',
              color: hasCheckedInToday ? '#64748b' : '#ffffff',
              borderRadius: '8px',
              padding: '8px 18px',
              fontSize: '13px',
              fontWeight: 800,
              cursor: hasCheckedInToday ? 'default' : 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: hasCheckedInToday ? 'none' : '0 4px 12px rgba(234, 88, 12, 0.3)',
              transition: 'all 0.15s ease',
            }}
          >
            {hasCheckedInToday ? (
              <>
                <CheckIcon size={14} color="#15803d" />
                <span>Đã Điểm Danh Hôm Nay</span>
              </>
            ) : (
              <>
                <StarIcon size={14} color="#ffffff" fill="#ffffff" />
                <span>Điểm Danh (+{todayReward.toLocaleString('vi-VN')} Xu)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* 7-Day Streak Nodes Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: '8px',
        }}
      >
        {streakRewards.map((reward, index) => {
          const dayNumber = index + 1;
          const isDone = dayNumber <= streak;
          const isCurrentTarget = dayNumber === nextDay && !hasCheckedInToday;
          const isJackpot = dayNumber === 7;

          return (
            <div
              key={dayNumber}
              style={{
                background: isDone
                  ? '#ecfdf5'
                  : isCurrentTarget
                  ? '#ffffff'
                  : 'rgba(255, 255, 255, 0.65)',
                border: isDone
                  ? '1.5px solid #a7f3d0'
                  : isCurrentTarget
                  ? '2px solid #ea580c'
                  : '1px solid #e2e8f0',
                borderRadius: '10px',
                padding: '10px 4px',
                textAlign: 'center',
                boxShadow: isCurrentTarget ? '0 4px 12px rgba(234, 88, 12, 0.2)' : 'none',
                position: 'relative',
                transition: 'all 0.15s ease',
              }}
            >
              {isJackpot && (
                <div
                  style={{
                    position: 'absolute',
                    top: '-7px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#dc2626',
                    color: '#ffffff',
                    fontSize: '9px',
                    fontWeight: 800,
                    borderRadius: '4px',
                    padding: '1px 5px',
                    whiteSpace: 'nowrap',
                    letterSpacing: '0.2px',
                  }}
                >
                  JACKPOT
                </div>
              )}

              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  color: isDone ? '#065f46' : isCurrentTarget ? '#ea580c' : '#64748b',
                }}
              >
                Ngày {dayNumber}
              </div>

              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  background: isDone
                    ? '#10b981'
                    : isCurrentTarget
                    ? '#ffedd5'
                    : '#f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '6px auto',
                }}
              >
                {isDone ? (
                  <CheckIcon size={14} color="#ffffff" />
                ) : (
                  <CoinIcon
                    size={14}
                    color={isCurrentTarget ? '#ea580c' : '#94a3b8'}
                  />
                )}
              </div>

              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  color: isDone ? '#047857' : isCurrentTarget ? '#ea580c' : '#475569',
                }}
              >
                +{reward >= 1000 ? `${reward / 1000}k` : reward}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
