/**
 * Voucher Service - Quản lý mã giảm giá sàn và shop theo chuẩn Amazon / Shopee
 */

const VOUCHER_STORAGE_KEY = 'mini_shopee_vouchers';

const INITIAL_VOUCHERS = [
  {
    id: 'vouch_01',
    code: 'MINI10',
    name: 'Giảm 10% Toàn Sàn',
    type: 'percent',
    value: 10,
    maxDiscount: 100000,
    minOrderValue: 0,
    description: 'Giảm 10% tối đa 100k cho mọi đơn hàng (Không giới hạn)',
    expiryDate: '2026-12-31',
    usageLimit: 500,
    usedCount: 142,
    isGlobal: true,
  },
  {
    id: 'vouch_02',
    code: 'FREESHIP',
    name: 'Miễn Phí Vận Chuyển',
    type: 'shipping',
    value: 30000,
    maxDiscount: 30000,
    minOrderValue: 0,
    description: 'Giảm 30k phí giao hàng toàn quốc cho mọi đơn hàng',
    expiryDate: '2026-12-31',
    usageLimit: 1000,
    usedCount: 420,
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
    description: 'Giảm 15% tối đa 150k cho đơn hàng hôm nay',
    expiryDate: '2026-12-31',
    usageLimit: 300,
    usedCount: 88,
    isGlobal: true,
  },
  {
    id: 'vouch_04',
    code: 'WELCOME50',
    name: 'Mừng Bạn Mới',
    type: 'fixed',
    value: 50000,
    maxDiscount: 50000,
    minOrderValue: 100000,
    description: 'Giảm trực tiếp 50k cho đơn từ 100.000₫',
    expiryDate: '2026-12-31',
    usageLimit: 200,
    usedCount: 78,
    isGlobal: true,
  },
  {
    id: 'vouch_05',
    code: 'SHOPGENZ',
    name: 'Voucher Shop GenZ',
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
    discountAmount = Math.round((base * voucher.value) / 100);
    if (voucher.maxDiscount && discountAmount > voucher.maxDiscount) {
      discountAmount = voucher.maxDiscount;
    }
  } else if (voucher.type === 'fixed' || voucher.type === 'shipping') {
    discountAmount = voucher.value;
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
  const created = {
    ...newVoucher,
    id: `vouch_${Date.now()}`,
    code: newVoucher.code.toUpperCase().trim(),
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
