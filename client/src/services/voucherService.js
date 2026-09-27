/**
 * Voucher Service - Quản lý mã giảm giá sàn và shop theo chuẩn Amazon / Shopee
 */

const VOUCHER_STORAGE_KEY = 'mini_shopee_vouchers';

const INITIAL_VOUCHERS = [
  // 1. Mã Miễn Phí Vận Chuyển (Shipping Vouchers)
  {
    id: 'vouch_ship_01',
    code: 'FREESHIP',
    name: 'Miễn Phí Vận Chuyển Toàn Quốc',
    type: 'shipping',
    value: 30000,
    maxDiscount: 30000,
    minOrderValue: 0,
    description: 'Giảm 30.000₫ phí giao hàng toàn quốc cho mọi đơn hàng (Không giới hạn)',
    expiryDate: '2026-12-31',
    usageLimit: 1000,
    usedCount: 420,
    isGlobal: true,
  },
  {
    id: 'vouch_ship_02',
    code: 'FREESHIPEXTRA',
    name: 'Freeship Xtra Tiết Kiệm',
    type: 'shipping',
    value: 15000,
    maxDiscount: 15000,
    minOrderValue: 50000,
    description: 'Giảm 15.000₫ phí giao hàng cho đơn từ 50.000₫',
    expiryDate: '2026-12-31',
    usageLimit: 800,
    usedCount: 215,
    isGlobal: true,
  },
  {
    id: 'vouch_ship_03',
    code: 'FREESHIPVIP',
    name: 'Freeship Hỏa Tốc 2H',
    type: 'shipping',
    value: 50000,
    maxDiscount: 50000,
    minOrderValue: 200000,
    description: 'Giảm 50.000₫ cước vận chuyển Hỏa tốc 2H cho đơn từ 200.000₫',
    expiryDate: '2026-12-31',
    usageLimit: 500,
    usedCount: 112,
    isGlobal: true,
  },
  {
    id: 'vouch_ship_04',
    code: 'FREESHIPMALL',
    name: 'Freeship Gian Hàng Chính Hãng Mall',
    type: 'shipping',
    value: 35000,
    maxDiscount: 35000,
    minOrderValue: 150000,
    description: 'Giảm 35.000₫ phí vận chuyển đơn hàng thuộc Shopee Mall từ 150.000₫',
    expiryDate: '2026-12-31',
    usageLimit: 400,
    usedCount: 96,
    isGlobal: true,
  },

  // 2. Mã Giảm Giá Sản Phẩm & Toàn Sàn (Product & Order Discount Vouchers)
  {
    id: 'vouch_01',
    code: 'MINI10',
    name: 'Giảm 10% Toàn Sàn',
    type: 'percent',
    value: 10,
    maxDiscount: 100000,
    minOrderValue: 0,
    description: 'Giảm 10% tối đa 100k cho mọi đơn hàng (Áp dụng chung cùng mã Freeship)',
    expiryDate: '2026-12-31',
    usageLimit: 500,
    usedCount: 142,
    isGlobal: true,
  },
  {
    id: 'vouch_03',
    code: 'SUPERDEAL',
    name: 'Siêu Giảm Giá 15%',
    type: 'percent',
    value: 15,
    maxDiscount: 150000,
    minOrderValue: 0,
    description: 'Giảm 15% tối đa 150k cho đơn hàng hôm nay (Áp dụng chung cùng mã Freeship)',
    expiryDate: '2026-12-31',
    usageLimit: 300,
    usedCount: 88,
    isGlobal: true,
  },
  {
    id: 'vouch_04',
    code: 'WELCOME50',
    name: 'Mừng Bạn Mới Giảm 50K',
    type: 'fixed',
    value: 50000,
    maxDiscount: 50000,
    minOrderValue: 100000,
    description: 'Giảm trực tiếp 50k cho đơn từ 100.000₫ (Áp dụng chung cùng mã Freeship)',
    expiryDate: '2026-12-31',
    usageLimit: 200,
    usedCount: 78,
    isGlobal: true,
  },
  {
    id: 'vouch_05',
    code: 'SHOPGENZ',
    name: 'Voucher Shop Thời Trang GenZ',
    type: 'fixed',
    value: 20000,
    maxDiscount: 20000,
    minOrderValue: 100000,
    description: 'Shop Thời trang GenZ tặng 20k cho đơn từ 100.000₫',
    expiryDate: '2026-11-30',
    usageLimit: 100,
    usedCount: 35,
    isGlobal: false,
    shopId: 'shop_01',
  },
  {
    id: 'vouch_06',
    code: 'TECH50',
    name: 'Voucher Đồ Công Nghệ & Điện Tử',
    type: 'fixed',
    value: 50000,
    maxDiscount: 50000,
    minOrderValue: 250000,
    description: 'Giảm ngay 50k cho đơn hàng thiết bị điện tử, công nghệ từ 250.000₫',
    expiryDate: '2026-12-31',
    usageLimit: 250,
    usedCount: 64,
    isGlobal: true,
  },
  {
    id: 'vouch_07',
    code: 'LUCKY100',
    name: 'Đại Tiệc Mua Sắm Giảm 100K',
    type: 'fixed',
    value: 100000,
    maxDiscount: 100000,
    minOrderValue: 500000,
    description: 'Giảm sốc 100.000₫ cho đơn hàng giá trị từ 500.000₫',
    expiryDate: '2026-12-31',
    usageLimit: 150,
    usedCount: 42,
    isGlobal: true,
  },
];

export function getVouchers() {
  try {
    const raw = localStorage.getItem(VOUCHER_STORAGE_KEY);
    if (!raw) {
      localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(INITIAL_VOUCHERS));
      return INITIAL_VOUCHERS;
    }
    let parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(INITIAL_VOUCHERS));
      return INITIAL_VOUCHERS;
    }
    // Update existing vouchers with latest friendly minOrderValue
    parsed = parsed.map((v) => {
      const match = INITIAL_VOUCHERS.find(
        (init) => init.code === v.code || (v.code === 'AMAZON10' && init.code === 'MINI10')
      );
      if (match) {
        return { ...v, ...match };
      }
      return v;
    });
    // Ensure all default initial vouchers are present
    for (const initV of INITIAL_VOUCHERS) {
      if (!parsed.some((v) => v.code === initV.code)) {
        parsed.unshift(initV);
      }
    }
    localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(parsed));
    return parsed;
  } catch {
    return INITIAL_VOUCHERS;
  }
}

export function validateVoucher(code, orderSubtotal = 0) {
  if (!code) return { valid: false, message: 'Vui lòng nhập mã giảm giá' };
  const normalized = code.trim().toUpperCase() === 'AMAZON10' ? 'MINI10' : code.trim().toUpperCase();
  const vouchers = getVouchers();
  const voucher = vouchers.find(
    (v) => v.code.toUpperCase() === normalized
  );

  if (!voucher) {
    return { valid: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' };
  }

  // Check minimum order value only if minOrderValue > 0 and subtotal > 0
  if (voucher.minOrderValue > 0 && orderSubtotal > 0 && orderSubtotal < voucher.minOrderValue) {
    return {
      valid: false,
      message: `Đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString('vi-VN')}₫ để dùng mã này`,
      voucher,
    };
  }

  let discountAmount = 0;
  if (voucher.type === 'percent') {
    const base = orderSubtotal > 0 ? orderSubtotal : 100000;
    const boundedPercent = Math.min(100, Math.max(1, Number(voucher.value) || 10));
    discountAmount = Math.round((base * boundedPercent) / 100);
    if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
      discountAmount = voucher.maxDiscount;
    }
    if (orderSubtotal > 0 && discountAmount > orderSubtotal) {
      discountAmount = orderSubtotal;
    }
  } else if (voucher.type === 'fixed' || voucher.type === 'shipping') {
    discountAmount = Number(voucher.value) || 0;
    if (orderSubtotal > 0 && discountAmount > orderSubtotal && voucher.type === 'fixed') {
      discountAmount = orderSubtotal;
    }
  }

  return {
    valid: true,
    message: `Áp dụng thành công mã ${voucher.code}!`,
    discountAmount,
    voucher,
  };
}

export function createVoucher(newVoucher) {
  const current = getVouchers();
  const rawType = newVoucher.type || 'percent';
  let boundedValue = Number(newVoucher.value) || 10;
  if (rawType === 'percent') {
    boundedValue = Math.min(100, Math.max(1, boundedValue));
  } else {
    boundedValue = Math.max(1000, boundedValue);
  }

  const created = {
    ...newVoucher,
    id: `vouch_${Date.now()}`,
    code: newVoucher.code.toUpperCase().trim(),
    type: rawType,
    value: boundedValue,
    usedCount: 0,
  };
  const updated = [created, ...current];
  localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(updated));
  return created;
}

export function deleteVoucher(voucherId) {
  const current = getVouchers();
  const updated = current.filter((v) => v.id !== voucherId);
  localStorage.setItem(VOUCHER_STORAGE_KEY, JSON.stringify(updated));
  return updated;
}
