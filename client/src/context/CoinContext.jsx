import React, { createContext, useContext, useState, useEffect } from 'react';

const CoinContext = createContext(null);

const COINS_STORAGE_KEY = 'mini_shopee_user_coins';
const COIN_HISTORY_KEY = 'mini_shopee_coin_history';
const STREAK_KEY = 'mini_shopee_checkin_streak';
const LAST_CHECKIN_KEY = 'mini_shopee_last_checkin_date';

const INITIAL_HISTORY = [
  {
    id: 'tx_init_1',
    date: '25/09/2026 09:00',
    amount: 15000,
    type: 'plus',
    desc: 'Thưởng chào mừng thành viên mới Mini Shopee',
  },
  {
    id: 'tx_init_2',
    date: '26/09/2026 10:30',
    amount: 10000,
    type: 'plus',
    desc: 'Hoàn xu 5% từ đơn hàng công nghệ TechWorld',
  },
];

const STREAK_REWARDS = [500, 1000, 1500, 2000, 2500, 3000, 5000];

export function CoinProvider({ children }) {
  const [coins, setCoins] = useState(() => {
    try {
      const saved = localStorage.getItem(COINS_STORAGE_KEY);
      if (saved !== null) return Number(saved);
    } catch {}
    return 25000;
  });

  const [coinHistory, setCoinHistory] = useState(() => {
    try {
      const saved = localStorage.getItem(COIN_HISTORY_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_HISTORY;
  });

  const [streak, setStreak] = useState(() => {
    try {
      const saved = localStorage.getItem(STREAK_KEY);
      if (saved !== null) return Number(saved);
    } catch {}
    return 2; // Default 2-day streak for demo
  });

  const [lastCheckInDate, setLastCheckInDate] = useState(() => {
    try {
      return localStorage.getItem(LAST_CHECKIN_KEY) || '2026-09-25';
    } catch {}
    return '2026-09-25';
  });

  const todayStr = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = lastCheckInDate === todayStr;

  const saveCoins = (newCoins) => {
    setCoins(newCoins);
    try {
      localStorage.setItem(COINS_STORAGE_KEY, String(newCoins));
    } catch {}
  };

  const saveHistory = (newHistory) => {
    setCoinHistory(newHistory);
    try {
      localStorage.setItem(COIN_HISTORY_KEY, JSON.stringify(newHistory));
    } catch {}
  };

  const addTransaction = (amount, type, desc, orderId = null) => {
    const nowStr = new Date().toLocaleString('vi-VN');
    const newTx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: nowStr,
      amount,
      type,
      desc,
      orderId,
    };
    const nextHistory = [newTx, ...coinHistory];
    saveHistory(nextHistory);
  };

  // Điểm danh nhận xu hàng ngày
  const checkInToday = () => {
    if (hasCheckedInToday) {
      return { success: false, message: 'Bạn đã điểm danh hôm nay rồi! Hãy quay lại vào ngày mai nhé.' };
    }

    const nextStreak = (streak % 7) + 1;
    const reward = STREAK_REWARDS[nextStreak - 1] || 500;
    const nextCoins = coins + reward;

    saveCoins(nextCoins);
    setStreak(nextStreak);
    setLastCheckInDate(todayStr);

    try {
      localStorage.setItem(STREAK_KEY, String(nextStreak));
      localStorage.setItem(LAST_CHECKIN_KEY, todayStr);
    } catch {}

    addTransaction(reward, 'plus', `Điểm danh ngày ${nextStreak}/7 (+${reward} Mini Xu)`);

    return {
      success: true,
      reward,
      streak: nextStreak,
      message: `🎉 Chúc mừng! Bạn nhận được ${reward.toLocaleString('vi-VN')} Mini Xu từ điểm danh ngày ${nextStreak}!`,
    };
  };

  // Sử dụng xu giảm giá lúc thanh toán
  const redeemCoins = (amountToUse, orderId) => {
    const validAmount = Math.min(coins, Math.max(0, amountToUse));
    if (validAmount <= 0) return 0;

    const nextCoins = coins - validAmount;
    saveCoins(nextCoins);
    addTransaction(validAmount, 'minus', `Đổi xu thanh toán đơn hàng ${orderId || ''}`, orderId);
    return validAmount;
  };

  // Hoàn xu hoặc nhận thưởng
  const earnCoins = (amountToEarn, desc, orderId = null) => {
    if (amountToEarn <= 0) return;
    const nextCoins = coins + amountToEarn;
    saveCoins(nextCoins);
    addTransaction(amountToEarn, 'plus', desc, orderId);
  };

  // Quay vòng quay may mắn
  const spinWheel = () => {
    const PRIZES = [
      { id: 1, text: '500 Xu', type: 'coins', value: 500 },
      { id: 2, text: 'Voucher 10%', type: 'voucher', code: 'MINI10', value: '10%' },
      { id: 3, text: '1.000 Xu', type: 'coins', value: 1000 },
      { id: 4, text: 'Freeship 30k', type: 'voucher', code: 'FREESHIP', value: '30.000₫' },
      { id: 5, text: '2.000 Xu', type: 'coins', value: 2000 },
      { id: 6, text: '5.000 Xu Siêu Khủng', type: 'coins', value: 5000 },
    ];

    const randomPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    if (randomPrize.type === 'coins') {
      earnCoins(randomPrize.value, `Trúng thưởng ${randomPrize.text} từ Vòng Quay May Mắn`);
    }

    return randomPrize;
  };

  const value = {
    coins,
    coinHistory,
    streak,
    streakRewards: STREAK_REWARDS,
    hasCheckedInToday,
    checkInToday,
    redeemCoins,
    earnCoins,
    spinWheel,
  };

  return <CoinContext.Provider value={value}>{children}</CoinContext.Provider>;
}

export function useCoins() {
  const context = useContext(CoinContext);
  if (!context) {
    throw new Error('useCoins phải được sử dụng bên trong CoinProvider');
  }
  return context;
}
