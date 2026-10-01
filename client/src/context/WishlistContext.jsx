import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);
const BASE_WISHLIST_STORAGE_KEY = 'mini_shopee_wishlist';

export function WishlistProvider({ children }) {
  const { user } = useAuth();

  const getStorageKey = useCallback(() => {
    if (!user) return `${BASE_WISHLIST_STORAGE_KEY}_guest`;
    if (user.role === 'admin') return `${BASE_WISHLIST_STORAGE_KEY}_admin_${user.id || user._id || 'admin'}`;
    if (user.role === 'seller') return `${BASE_WISHLIST_STORAGE_KEY}_seller_${user.shopId || user.id || 'seller'}`;
    return `${BASE_WISHLIST_STORAGE_KEY}_customer_${user.id || user._id || 'customer'}`;
  }, [user]);

  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      if (typeof window === 'undefined') return [];
      // Xóa bỏ mock cũ nếu khách vãng lai bị dính 2 sản phẩm mẫu
      const guestKey = `${BASE_WISHLIST_STORAGE_KEY}_guest`;
      const legacyGuest = localStorage.getItem(guestKey);
      if (legacyGuest && (legacyGuest.includes('prod_01') || legacyGuest.includes('prod_04'))) {
        localStorage.removeItem(guestKey);
        localStorage.removeItem(BASE_WISHLIST_STORAGE_KEY);
      }

      if (!user || user.role === 'admin' || user.role === 'seller') {
        return [];
      }

      const key = `${BASE_WISHLIST_STORAGE_KEY}_customer_${user.id || user._id || 'customer'}`;
      const saved = localStorage.getItem(key);
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });

  // Tự động chuyển đổi danh sách yêu thích tương ứng với từng tài khoản khi đổi user
  useEffect(() => {
    try {
      if (!user || user.role === 'admin' || user.role === 'seller') {
        setWishlistIds([]);
        return;
      }
      const key = getStorageKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        setWishlistIds(JSON.parse(saved));
      } else {
        setWishlistIds([]);
      }
    } catch {
      setWishlistIds([]);
    }
  }, [user?.id, user?.role, getStorageKey]);

  useEffect(() => {
    try {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(wishlistIds));
    } catch (e) {
      console.error('Lỗi khi lưu wishlist:', e);
    }
  }, [wishlistIds, getStorageKey]);

  const toggleWishlist = (productId) => {
    setWishlistIds((prev) => {
      if (prev.includes(productId)) {
        return prev.filter((id) => id !== productId);
      } else {
        return [...prev, productId];
      }
    });
  };

  const isWishlisted = (productId) => {
    return wishlistIds.includes(productId);
  };

  const removeFromWishlist = (productId) => {
    setWishlistIds((prev) => prev.filter((id) => id !== productId));
  };

  const clearWishlist = () => {
    setWishlistIds([]);
  };

  const value = {
    wishlistIds,
    wishlistCount: wishlistIds.length,
    toggleWishlist,
    isWishlisted,
    removeFromWishlist,
    clearWishlist,
  };

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist phải được sử dụng trong WishlistProvider');
  }
  return context;
}
