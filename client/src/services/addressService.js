import { updateProfileAPI } from './api';

export const SAVED_ADDRESSES_BASE_KEY = 'mini_shopee_saved_addresses';

/**
 * Returns user-scoped storage key
 */
export function getUserAddressKey(userOrId) {
  const userId = typeof userOrId === 'object' ? (userOrId?.id || userOrId?._id) : userOrId;
  return userId ? `${SAVED_ADDRESSES_BASE_KEY}_${userId}` : `${SAVED_ADDRESSES_BASE_KEY}_guest`;
}

/**
 * Normalizes address list to strictly enforce Single Default Invariant:
 * Exactly one address per user has isDefault: true (unless list is empty).
 */
export function normalizeAddresses(list) {
  if (!Array.isArray(list) || list.length === 0) return [];

  const normalized = list.map((item, idx) => ({
    id: item.id || `addr_${Date.now()}_${idx}`,
    name: item.name || item.fullName || '',
    fullName: item.fullName || item.name || '',
    phone: item.phone || '',
    address: item.address || '',
    tag: item.tag || 'Nhà riêng',
    isDefault: Boolean(item.isDefault),
  }));

  const defaultIdx = normalized.findIndex((a) => a.isDefault);
  if (defaultIdx === -1) {
    // If no address is set as default, promote the first address
    normalized[0].isDefault = true;
  } else {
    // Ensure only the first marked default remains true
    normalized.forEach((a, idx) => {
      a.isDefault = idx === defaultIdx;
    });
  }

  return normalized;
}

/**
 * Generates initial fallback addresses depending on user profile and role
 */
export function getInitialAddresses(user) {
  if (user?.role === 'seller') {
    return [
      {
        id: 'addr_seller_01',
        name: user.fullName || 'Chủ Shop',
        fullName: user.fullName || 'Chủ Shop',
        phone: user.phone || '0912345678',
        address: user.shopAddress || 'Kho Hàng Tân Bình, TP. Hồ Chí Minh',
        tag: 'Kho xuất hàng',
        isDefault: true,
      },
    ];
  }

  if (user?.role === 'admin') {
    return [
      {
        id: 'addr_admin_01',
        name: 'Trụ Sở Điều Hành Sàn Mini Shopee',
        fullName: 'Trụ Sở Điều Hành Sàn Mini Shopee',
        phone: '1900 1221',
        address: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, P.22, Bình Thạnh, TP.HCM',
        tag: 'Trụ sở sàn',
        isDefault: true,
      },
    ];
  }

  return [
    {
      id: 'addr_01',
      name: user?.fullName || 'Nguyễn Văn Khách',
      fullName: user?.fullName || 'Nguyễn Văn Khách',
      phone: user?.phone || '0909 123 456',
      address: user?.address || 'Số 123 Đường Nguyễn Trãi, Phường Bến Thành, Quận 1, TP. Hồ Chí Minh',
      tag: 'Nhà riêng',
      isDefault: true,
    },
    {
      id: 'addr_02',
      name: user?.fullName ? `${user.fullName} (Văn phòng)` : 'Nguyễn Văn Khách (Văn phòng)',
      fullName: user?.fullName ? `${user.fullName} (Văn phòng)` : 'Nguyễn Văn Khách (Văn phòng)',
      phone: user?.phone || '0909 123 456',
      address: 'Tòa nhà Landmark 81, 720A Điện Biên Phủ, Phường 22, Bình Thạnh, TP. Hồ Chí Minh',
      tag: 'Văn phòng',
      isDefault: false,
    },
  ];
}

/**
 * Reads saved addresses from localStorage (user partition, fallback base key, or initial defaults)
 */
export function getSavedAddresses(user) {
  try {
    const userKey = getUserAddressKey(user);
    const userSaved = localStorage.getItem(userKey);
    if (userSaved) {
      const parsed = JSON.parse(userSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return normalizeAddresses(parsed);
      }
    }

    // Fallback to base key for backward compatibility
    const baseSaved = localStorage.getItem(SAVED_ADDRESSES_BASE_KEY);
    if (baseSaved) {
      const parsed = JSON.parse(baseSaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const normalized = normalizeAddresses(parsed);
        // Sync to user-specific key
        localStorage.setItem(userKey, JSON.stringify(normalized));
        return normalized;
      }
    }

    // Backend user object might have savedAddresses array
    if (Array.isArray(user?.savedAddresses) && user.savedAddresses.length > 0) {
      const normalized = normalizeAddresses(user.savedAddresses);
      saveAddresses(normalized, user);
      return normalized;
    }
  } catch (err) {
    console.warn('[AddressService] Failed to load saved addresses from localStorage:', err);
  }

  const initial = normalizeAddresses(getInitialAddresses(user));
  // Auto initialize persistence
  try {
    const userKey = getUserAddressKey(user);
    localStorage.setItem(userKey, JSON.stringify(initial));
    localStorage.setItem(SAVED_ADDRESSES_BASE_KEY, JSON.stringify(initial));
  } catch {}
  return initial;
}

/**
 * Persists addresses to both user-scoped key and base key, dispatches sync events,
 * and optionally syncs with backend if user token is active.
 */
export function saveAddresses(addresses, user) {
  const normalized = normalizeAddresses(addresses);
  const userKey = getUserAddressKey(user);

  try {
    localStorage.setItem(userKey, JSON.stringify(normalized));
    localStorage.setItem(SAVED_ADDRESSES_BASE_KEY, JSON.stringify(normalized));

    // Dispatch global and custom storage events
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('mini_shopee_address_updated', { detail: normalized }));
  } catch (err) {
    console.warn('[AddressService] Failed to save addresses to localStorage:', err);
  }

  // Sync to backend if authenticated
  const token = localStorage.getItem('mini_shopee_token');
  if (token && !token.startsWith('mock_') && (user?.id || user?._id)) {
    updateProfileAPI({ savedAddresses: normalized }).catch((err) => {
      console.warn('[AddressService] Backend address sync failed (offline or network):', err.message);
    });
  }

  return normalized;
}

/**
 * Adds a new address and enforces single default invariant
 */
export function addAddress(newAddrData, user) {
  const current = getSavedAddresses(user);
  const isDefault = Boolean(newAddrData.isDefault) || current.length === 0;

  const newAddress = {
    id: newAddrData.id || `addr_${Date.now()}`,
    name: newAddrData.name?.trim() || newAddrData.fullName?.trim() || '',
    fullName: newAddrData.fullName?.trim() || newAddrData.name?.trim() || '',
    phone: newAddrData.phone?.trim() || '',
    address: newAddrData.address?.trim() || '',
    tag: newAddrData.tag || 'Nhà riêng',
    isDefault,
  };

  let updatedList;
  if (isDefault) {
    // Demote all existing
    updatedList = [...current.map((a) => ({ ...a, isDefault: false })), newAddress];
  } else {
    updatedList = [...current, newAddress];
  }

  return saveAddresses(updatedList, user);
}

/**
 * Updates an existing address by id and enforces single default invariant
 */
export function updateAddress(addrId, updatedFields, user) {
  const current = getSavedAddresses(user);
  const target = current.find((a) => a.id === addrId);
  if (!target) return current;

  const willBeDefault = updatedFields.isDefault !== undefined ? Boolean(updatedFields.isDefault) : target.isDefault;

  let nextList = current.map((a) => {
    if (a.id !== addrId) {
      return willBeDefault ? { ...a, isDefault: false } : a;
    }
    return {
      ...a,
      ...updatedFields,
      name: updatedFields.name !== undefined ? updatedFields.name.trim() : a.name,
      fullName: updatedFields.fullName !== undefined ? updatedFields.fullName.trim() : (updatedFields.name !== undefined ? updatedFields.name.trim() : a.fullName),
      phone: updatedFields.phone !== undefined ? updatedFields.phone.trim() : a.phone,
      address: updatedFields.address !== undefined ? updatedFields.address.trim() : a.address,
      tag: updatedFields.tag || a.tag,
      isDefault: willBeDefault,
    };
  });

  return saveAddresses(nextList, user);
}

/**
 * Deletes an address by id and auto-promotes the first remaining address if default was deleted
 */
export function deleteAddress(addrId, user) {
  const current = getSavedAddresses(user);
  const target = current.find((a) => a.id === addrId);
  const remaining = current.filter((a) => a.id !== addrId);

  if (remaining.length > 0 && target?.isDefault) {
    remaining[0].isDefault = true;
  }

  return saveAddresses(remaining, user);
}

/**
 * Sets specified address as default and clears others
 */
export function setDefaultAddress(addrId, user) {
  const current = getSavedAddresses(user);
  const updated = current.map((a) => ({
    ...a,
    isDefault: a.id === addrId,
  }));

  return saveAddresses(updated, user);
}

/**
 * Helper to get active default address
 */
export function getDefaultAddress(addresses) {
  if (!Array.isArray(addresses) || addresses.length === 0) return null;
  return addresses.find((a) => a.isDefault) || addresses[0];
}
