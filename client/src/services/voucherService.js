/**
 * Voucher Service - Quản lý mã giảm giá sàn và shop theo chuẩn Amazon / Shopee
 */

const VOUCHER_STORAGE_KEY = 'mini_shopee_vouchers';

const INITIAL_VOUCHERS = [
  {
    id: 'vouch_01',
    code: 'AMAZON10',
    name: 'Giảm 10% Toàn Sàn',
    type: 'percent',
    value: 10,
    maxDiscount: 100000,
    minOrderValue: 200000,
    description: 'Giảm 10% tối đa 100k cho đơn từ 200k',
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
    minOrderValue: 150000,
    description: 'Giảm tối đa 30k phí giao hàng cho đơn từ 150k',
    expiryDate: '2026-12-31',
    usageLimit: 1000,
    usedCount: 420,
    isGlobal: true,
  },
  {
    id: 'vouch_03',
    code: 'WELCOME50',
    name: 'Mừng Bạn Mới',
    type: 'fixed',
    value: 50000,
    maxDiscount: 50000,
    minOrderValue: 300000,
    description: 'Giảm trực tiếp 50k cho khách hàng mới với đơn từ 300k',
    expiryDate: '2026-12-31',
    usageLimit: 200,
    usedCount: 78,
    isGlobal: true,
  },
  {
    id: 'vouch_04',
    code: 'SHOPGENZ',
    name: 'Voucher Shop GenZ',
    type: 'fixed',
    value: 20000,
    maxDiscount: 20000,
    minOrderValue: 250000,
    description: 'Shop Thời trang GenZ tặng 20k cho đơn từ 250k',
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
    return JSON.parse(raw);
  } catch {
    return INITIAL_VOUCHERS;
  }
}

export function validateVoucher(code, orderSubtotal = 0) {
  if (!code) return { valid: false, message: 'Vui lòng nhập mã giảm giá' };
  const vouchers = getVouchers();
  const voucher = vouchers.find(
    (v) => v.code.toUpperCase() === code.trim().toUpperCase()
  );

  if (!voucher) {
    return { valid: false, message: 'Mã giảm giá không tồn tại hoặc đã hết hạn' };
  }

  if (orderSubtotal < voucher.minOrderValue) {
    return {
      valid: false,
      message: `Đơn hàng tối thiểu phải từ ${voucher.minOrderValue.toLocaleString('vi-VN')}₫ để dùng mã này`,
      voucher,
    };
  }

  let discountAmount = 0;
  if (voucher.type === 'percent') {
    discountAmount = Math.round((orderSubtotal * voucher.value) / 100);
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
