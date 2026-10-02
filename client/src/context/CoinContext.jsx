import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const CoinContext = createContext(null);

const BASE_COINS_STORAGE_KEY = 'mini_shopee_user_coins';
const BASE_COIN_HISTORY_KEY = 'mini_shopee_coin_history';
const BASE_STREAK_KEY = 'mini_shopee_checkin_streak';
const BASE_LAST_CHECKIN_KEY = 'mini_shopee_last_checkin_date';
const BASE_LAST_SPIN_KEY = 'mini_shopee_last_spin_date';
const BASE_ORDER_SPINS_KEY = 'mini_shopee_order_spins';

const INITIAL_HISTORY = [
  {
    id: 'tx_init_1',
    date: '25/09/2026 09:00',
    timestamp: '25/09/2026 09:00',
    amount: 15000,
    type: 'plus',
    isCredit: true,
    desc: 'Thưởng chào mừng thành viên mới Fullstack E-Commerce',
    description: 'Thưởng chào mừng thành viên mới Fullstack E-Commerce',
    category: 'welcome',
  },
  {
    id: 'tx_init_2',
    date: '26/09/2026 10:30',
    timestamp: '26/09/2026 10:30',
    amount: 10000,
    type: 'plus',
    isCredit: true,
    desc: 'Hoàn xu 5% từ đơn hàng công nghệ TechWorld',
    description: 'Hoàn xu 5% từ đơn hàng công nghệ TechWorld',
    category: 'order',
  },
];

const STREAK_REWARDS = [500, 1000, 1500, 2000, 2500, 3000, 5000];

export function CoinProvider({ children }) {
  const { user } = useAuth();

  // Xác định tiền tố lưu trữ riêng biệt cho từng tài khoản
  const getUserStorageKey = useCallback((baseKey) => {
    if (!user) return `${baseKey}_guest`;
    if (user.role === 'admin') return `${baseKey}_admin_${user.id || 'admin'}`;
    if (user.role === 'seller') return `${baseKey}_seller_${user.shopId || user.id || 'seller'}`;
    return `${baseKey}_customer_${user.id || 'customer'}`;
  }, [user]);

  // Khởi tạo số dư xu tương ứng với vai trò tài khoản
  const [coins, setCoins] = useState(() => {
    try {
      // Nếu chưa đăng nhập hoặc là admin, mặc định 0 xu
      if (!user || user?.role === 'admin') return 0;
      // Nếu là seller, mặc định 0 xu (chủ shop quản lý doanh thu VND riêng)
      if (user?.role === 'seller') {
        const key = `mini_shopee_user_coins_seller_${user.shopId || user.id}`;
        const saved = localStorage.getItem(key);
        return saved !== null ? Number(saved) : 0;
      }
      // Nếu là khách hàng
      if (user?.role === 'customer') {
        const custKey = `mini_shopee_user_coins_customer_${user?.id || 'user_customer_01'}`;
        const saved = localStorage.getItem(custKey);
        if (saved !== null) return Number(saved);
        return user?.id === 'user_customer_01' ? 25000 : 10000;
      }
    } catch {}
    return 0;
  });

  const [coinHistory, setCoinHistory] = useState(() => {
    try {
      if (!user || user?.role === 'admin') return [];
      if (user?.role === 'seller') {
        const key = `mini_shopee_coin_history_seller_${user.shopId || user.id}`;
        const saved = localStorage.getItem(key);
        return saved ? JSON.parse(saved) : [];
      }
      if (user?.role === 'customer') {
        const custKey = `mini_shopee_coin_history_customer_${user?.id || 'user_customer_01'}`;
        const saved = localStorage.getItem(custKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
        return INITIAL_HISTORY;
      }
    } catch {}
    return [];
  });

  const [streak, setStreak] = useState(() => {
    if (!user || user?.role === 'admin' || user?.role === 'seller') return 0;
    try {
      const custKey = `mini_shopee_checkin_streak_customer_${user?.id || 'user_customer_01'}`;
      const saved = localStorage.getItem(custKey) || localStorage.getItem(BASE_STREAK_KEY);
      if (saved !== null) return Number(saved);
    } catch {}
    return 2;
  });

  const [lastCheckInDate, setLastCheckInDate] = useState(() => {
    try {
      const custKey = `mini_shopee_last_checkin_date_customer_${user?.id || 'user_customer_01'}`;
      return localStorage.getItem(custKey) || localStorage.getItem(BASE_LAST_CHECKIN_KEY) || '2026-09-25';
    } catch {}
    return '2026-09-25';
  });

  const [lastSpinDate, setLastSpinDate] = useState(() => {
    try {
      const custKey = `mini_shopee_last_spin_date_customer_${user?.id || 'user_customer_01'}`;
      return localStorage.getItem(custKey) || localStorage.getItem(BASE_LAST_SPIN_KEY) || '';
    } catch {}
    return '';
  });

  const [orderSpins, setOrderSpins] = useState(() => {
    if (!user || user?.role === 'admin' || user?.role === 'seller') return 0;
    try {
      const custKey = `mini_shopee_order_spins_customer_${user?.id || 'user_customer_01'}`;
      const saved = localStorage.getItem(custKey) || localStorage.getItem(BASE_ORDER_SPINS_KEY);
      if (saved !== null) return Math.max(0, parseInt(saved, 10) || 0);
    } catch {}
    return 1;
  });

  // Tự động tải lại đúng dữ liệu độc lập khi chuyển đổi tài khoản (Customer / Seller / Admin)
  useEffect(() => {
    if (!user) {
      setCoins(0);
      setCoinHistory([]);
      setStreak(0);
      setOrderSpins(0);
      return;
    }

    if (user.role === 'admin') {
      // Tài khoản Quản trị sàn hoàn toàn không dùng xu của người mua
      setCoins(0);
      setCoinHistory([]);
      setStreak(0);
      setOrderSpins(0);
      return;
    }

    if (user.role === 'seller') {
      // Chủ shop có ví xu riêng biệt (mặc định 0 xu vì doanh thu tính bằng VND)
      const sellerCoinsKey = getUserStorageKey(BASE_COINS_STORAGE_KEY);
      const savedCoins = localStorage.getItem(sellerCoinsKey);
      setCoins(savedCoins !== null ? Number(savedCoins) : 0);

      const sellerHistKey = getUserStorageKey(BASE_COIN_HISTORY_KEY);
      const savedHist = localStorage.getItem(sellerHistKey);
      setCoinHistory(savedHist ? JSON.parse(savedHist) : []);

      setStreak(0);
      setOrderSpins(0);
      return;
    }

    // Tài khoản Khách hàng mua sắm (Customer)
    const custCoinsKey = getUserStorageKey(BASE_COINS_STORAGE_KEY);
    const savedCoins = localStorage.getItem(custCoinsKey);
    if (savedCoins !== null) {
      setCoins(Number(savedCoins));
    } else {
      const defaultCoins = user.id === 'user_customer_01' ? 25000 : 10000;
      setCoins(defaultCoins);
      try {
        localStorage.setItem(custCoinsKey, String(defaultCoins));
      } catch {}
    }

    const custHistKey = getUserStorageKey(BASE_COIN_HISTORY_KEY);
    const savedHist = localStorage.getItem(custHistKey);
    if (savedHist) {
      try {
        setCoinHistory(JSON.parse(savedHist));
      } catch {
        setCoinHistory(INITIAL_HISTORY);
      }
    } else {
      setCoinHistory(INITIAL_HISTORY);
    }

    const custStreakKey = getUserStorageKey(BASE_STREAK_KEY);
    const savedStreak = localStorage.getItem(custStreakKey);
    setStreak(savedStreak !== null ? Number(savedStreak) : 2);

    const custSpinsKey = getUserStorageKey(BASE_ORDER_SPINS_KEY);
    const savedSpins = localStorage.getItem(custSpinsKey);
    setOrderSpins(savedSpins !== null ? Number(savedSpins) : 1);
  }, [user?.id, user?.role, getUserStorageKey]);

  const todayStr = new Date().toISOString().split('T')[0];
  const hasCheckedInToday = lastCheckInDate === todayStr;
  const hasSpunFreeToday = lastSpinDate === todayStr;
  const dailySpinsRemaining = hasSpunFreeToday ? 0 : 1;
  const totalSpins = dailySpinsRemaining + orderSpins;

  const saveCoins = (newCoins) => {
    setCoins(newCoins);
    try {
      const userKey = getUserStorageKey(BASE_COINS_STORAGE_KEY);
      localStorage.setItem(userKey, String(newCoins));
      if (user?.role === 'customer' || !user) {
        localStorage.setItem(BASE_COINS_STORAGE_KEY, String(newCoins));
      }
    } catch {}
  };

  const saveHistory = (newHistory) => {
    setCoinHistory(newHistory);
    try {
      const userKey = getUserStorageKey(BASE_COIN_HISTORY_KEY);
      localStorage.setItem(userKey, JSON.stringify(newHistory));
      if (user?.role === 'customer' || !user) {
        localStorage.setItem(BASE_COIN_HISTORY_KEY, JSON.stringify(newHistory));
      }
    } catch {}
  };

  const saveOrderSpins = (spins) => {
    setOrderSpins(spins);
    try {
      const userKey = getUserStorageKey(BASE_ORDER_SPINS_KEY);
      localStorage.setItem(userKey, String(spins));
      if (user?.role === 'customer' || !user) {
        localStorage.setItem(BASE_ORDER_SPINS_KEY, String(spins));
      }
    } catch {}
  };

  const addTransaction = (amount, type, desc, orderId = null, category = 'general') => {
    const nowStr = new Date().toLocaleString('vi-VN');
    const newTx = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      date: nowStr,
      timestamp: nowStr,
      amount,
      type, // 'plus' | 'minus'
      isCredit: type === 'plus' || type === 'credit',
      desc,
      description: desc,
      category,
      orderId,
    };
    const nextHistory = [newTx, ...coinHistory];
    saveHistory(nextHistory);
  };

  // Điểm danh nhận xu hàng ngày
  const checkInToday = () => {
    if (user?.role === 'admin') {
      return { success: false, message: 'Tài khoản Quản trị viên sàn không tham gia chương trình tích xu người mua.' };
    }
    if (user?.role === 'seller') {
      return { success: false, message: 'Tài khoản Chủ shop tập trung quản trị doanh thu bán hàng tại Kênh Người Bán.' };
    }

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
      const streakKey = getUserStorageKey(BASE_STREAK_KEY);
      const checkinKey = getUserStorageKey(BASE_LAST_CHECKIN_KEY);
      localStorage.setItem(streakKey, String(nextStreak));
      localStorage.setItem(checkinKey, todayStr);
      if (user?.role === 'customer' || !user) {
        localStorage.setItem(BASE_STREAK_KEY, String(nextStreak));
        localStorage.setItem(BASE_LAST_CHECKIN_KEY, todayStr);
      }
    } catch {}

    addTransaction(reward, 'plus', `Điểm danh ngày ${nextStreak}/7 (+${reward} Shopee Xu)`, null, 'checkin');

    return {
      success: true,
      reward,
      streak: nextStreak,
      message: `Chúc mừng! Bạn nhận được ${reward.toLocaleString('vi-VN')} Shopee Xu từ điểm danh ngày ${nextStreak}!`,
    };
  };

  // Sử dụng xu giảm giá lúc thanh toán
  const redeemCoins = (amountToUse, orderId) => {
    const validAmount = Math.min(coins, Math.max(0, amountToUse));
    if (validAmount <= 0) return 0;

    const nextCoins = coins - validAmount;
    saveCoins(nextCoins);
    addTransaction(validAmount, 'minus', `Đổi xu thanh toán đơn hàng ${orderId || ''}`, orderId, 'order');
    return validAmount;
  };

  // Hoàn xu hoặc nhận thưởng
  const earnCoins = (amountToEarn, desc, orderId = null, category = 'reward') => {
    if (amountToEarn <= 0) return;
    const nextCoins = coins + amountToEarn;
    saveCoins(nextCoins);
    addTransaction(amountToEarn, 'plus', desc, orderId, category);
  };

  // Cộng thêm 1 lượt quay may mắn khi khách hàng hoàn tất một đơn hàng
  const grantOrderSpin = (orderId = null) => {
    const nextSpins = orderSpins + 1;
    saveOrderSpins(nextSpins);
    return nextSpins;
  };

  // Quay vòng quay may mắn hoàn toàn không trừ xu:
  // - 1 lượt miễn phí mỗi ngày (làm mới lúc 00:00)
  // - Lượt cộng thêm từ mỗi đơn hàng đã hoàn tất
  const spinWheel = () => {
    if (user?.role === 'admin') {
      return {
        success: false,
        error: 'ADMIN_NOT_ALLOWED',
        message: 'Tài khoản Quản trị viên sàn không tham gia chương trình vòng quay người mua.',
      };
    }
    if (user?.role === 'seller') {
      return {
        success: false,
        error: 'SELLER_NOT_ALLOWED',
        message: 'Tài khoản Chủ shop tập trung quản lý Kênh Người Bán, không tham gia vòng quay người mua.',
      };
    }

    if (totalSpins <= 0) {
      return {
        success: false,
        error: 'NO_SPINS',
        message: 'Bạn đã hết lượt quay! Hoàn thành thêm đơn hàng để nhận thêm +1 lượt quay hoặc chờ lượt miễn phí vào 00:00 ngày mai.',
      };
    }

    let wasDailyFree = false;
    if (dailySpinsRemaining > 0) {
      // Dùng lượt miễn phí ngày hôm nay
      setLastSpinDate(todayStr);
      try {
        const spinKey = getUserStorageKey(BASE_LAST_SPIN_KEY);
        localStorage.setItem(spinKey, todayStr);
        if (user?.role === 'customer' || !user) {
          localStorage.setItem(BASE_LAST_SPIN_KEY, todayStr);
        }
      } catch {}
      wasDailyFree = true;
    } else if (orderSpins > 0) {
      // Dùng 1 lượt quay tích lũy từ đơn hàng
      saveOrderSpins(orderSpins - 1);
    }

    const PRIZES = [
      { id: 1, text: '500 Shopee Xu', type: 'coins', value: 500, icon: 'coin', color: '#2563eb', badge: '+500 Xu' },
      { id: 2, text: 'Voucher Giảm 10%', type: 'voucher', code: 'MINI10', value: '10%', icon: 'voucher', color: '#0284c7', badge: 'Mã Giảm 10%' },
      { id: 3, text: '1.000 Shopee Xu', type: 'coins', value: 1000, icon: 'coin', color: '#0284c7', badge: '+1.000 Xu' },
      { id: 4, text: 'Freeship 30.000₫', type: 'voucher', code: 'FREESHIP', value: '30.000₫', icon: 'shipping', color: '#059669', badge: 'Freeship 30k' },
      { id: 5, text: '2.000 Shopee Xu', type: 'coins', value: 2000, icon: 'coin', color: '#7c3aed', badge: '+2.000 Xu' },
      { id: 6, text: '5.000 Shopee Xu Siêu Cấp', type: 'coins', value: 5000, icon: 'diamond', color: '#db2777', badge: '+5.000 Xu' },
    ];

    const randomPrize = PRIZES[Math.floor(Math.random() * PRIZES.length)];
    if (randomPrize.type === 'coins') {
      earnCoins(randomPrize.value, `Trúng thưởng ${randomPrize.text} từ Vòng Quay May Mắn`, null, 'spin');
    } else if (randomPrize.type === 'voucher' && randomPrize.code) {
      try {
        const claimed = JSON.parse(localStorage.getItem('mini_shopee_claimed_vouchers') || '[]');
        if (!claimed.includes(randomPrize.code)) {
          localStorage.setItem('mini_shopee_claimed_vouchers', JSON.stringify([...claimed, randomPrize.code]));
        }
      } catch {}
    }

    const nextRemaining = wasDailyFree ? orderSpins : Math.max(0, orderSpins - 1);

    return {
      success: true,
      ...randomPrize,
      wasDailyFree,
      remainingSpins: nextRemaining,
    };
  };

  const value = {
    coins,
    coinHistory,
    streak,
    streakRewards: STREAK_REWARDS,
    hasCheckedInToday,
    hasSpunFreeToday,
    dailySpinsRemaining,
    orderSpins,
    totalSpins,
    freeSpinsRemaining: totalSpins,
    extraSpinCost: 0, // Không dùng xu để quay
    checkInToday,
    redeemCoins,
    earnCoins,
    grantOrderSpin,
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

export const useCoin = useCoins;

