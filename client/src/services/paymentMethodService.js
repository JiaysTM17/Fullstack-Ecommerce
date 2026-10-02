/**
 * Payment Methods Management Service
 * Manages linked Credit/Debit Cards, Domestic Bank Accounts, and E-Wallets.
 */

export const SAVED_PAYMENTS_BASE_KEY = 'mini_shopee_saved_payment_methods';

export function getUserPaymentKey(userOrId) {
  const userId = typeof userOrId === 'object' ? (userOrId?.id || userOrId?._id) : userOrId;
  return userId ? `${SAVED_PAYMENTS_BASE_KEY}_${userId}` : `${SAVED_PAYMENTS_BASE_KEY}_guest`;
}

export function getDefaultPaymentMethods(user) {
  return [
    {
      id: 'pay_vcb_01',
      type: 'bank',
      provider: 'Vietcombank',
      bankName: 'Ngân hàng TMCP Ngoại Thương VN (Vietcombank)',
      accountNumber: '**** **** 8899',
      accountName: (user?.fullName || 'NGUYEN VAN KHACH').toUpperCase(),
      branch: 'Chi nhánh Bến Thành, TP.HCM',
      isDefault: true,
      color: '#006241',
      icon: '🏛️'
    },
    {
      id: 'pay_visa_02',
      type: 'card',
      provider: 'Visa',
      cardBrand: 'Visa Platinum',
      cardNumber: '**** **** **** 4242',
      cardHolder: (user?.fullName || 'NGUYEN VAN KHACH').toUpperCase(),
      expiry: '12/28',
      isDefault: false,
      color: '#1a1f71',
      icon: '💳'
    },
    {
      id: 'pay_momo_03',
      type: 'wallet',
      provider: 'MoMo',
      walletName: 'Ví MoMo Pay',
      phone: user?.phone || '0909 123 456',
      accountName: user?.fullName || 'Nguyễn Văn Khách',
      isDefault: false,
      color: '#a50064',
      icon: '👛'
    }
  ];
}

export function getSavedPaymentMethods(user) {
  const key = getUserPaymentKey(user);
  try {
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Failed reading payment methods from localStorage:', err);
  }

  const initial = getDefaultPaymentMethods(user);
  try {
    localStorage.setItem(key, JSON.stringify(initial));
  } catch {}
  return initial;
}

export function savePaymentMethods(methods, user) {
  const key = getUserPaymentKey(user);
  try {
    localStorage.setItem(key, JSON.stringify(methods));
    window.dispatchEvent(new Event('mini_shopee_payment_updated'));
  } catch (err) {
    console.warn('Failed saving payment methods to localStorage:', err);
  }
}

export function addPaymentMethod(newMethod, user) {
  const current = getSavedPaymentMethods(user);
  const methodWithId = {
    ...newMethod,
    id: `pay_${Date.now()}`,
    isDefault: current.length === 0 ? true : Boolean(newMethod.isDefault)
  };

  let updated = [...current, methodWithId];
  if (methodWithId.isDefault) {
    updated = updated.map((m) => ({
      ...m,
      isDefault: m.id === methodWithId.id
    }));
  }

  savePaymentMethods(updated, user);
  return updated;
}

export function deletePaymentMethod(methodId, user) {
  const current = getSavedPaymentMethods(user);
  let updated = current.filter((m) => m.id !== methodId);
  if (updated.length > 0 && !updated.some((m) => m.isDefault)) {
    updated[0].isDefault = true;
  }
  savePaymentMethods(updated, user);
  return updated;
}

export function setDefaultPaymentMethod(methodId, user) {
  const current = getSavedPaymentMethods(user);
  const updated = current.map((m) => ({
    ...m,
    isDefault: m.id === methodId
  }));
  savePaymentMethods(updated, user);
  return updated;
}
