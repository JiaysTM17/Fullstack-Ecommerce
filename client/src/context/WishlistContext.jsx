import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useAuth } from './AuthContext';

const WishlistContext = createContext(null);
const BASE_WISHLIST_STORAGE_KEY = 'mini_shopee_wishlist';

export function WishlistProvider({ children }) {
  const { user } = useAuth();

  const getStorageKey = useCallback(() => {
    return user ? `${BASE_WISHLIST_STORAGE_KEY}_${user.id || user._id}` : `${BASE_WISHLIST_STORAGE_KEY}_guest`;
  }, [user]);

  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const key = user ? `${BASE_WISHLIST_STORAGE_KEY}_${user.id || user._id}` : BASE_WISHLIST_STORAGE_KEY;
      const saved = localStorage.getItem(key) || localStorage.getItem(BASE_WISHLIST_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    return user?.role === 'customer' || !user ? ['prod_01', 'prod_04'] : [];
  });

  // Tự động chuyển đổi danh sách yêu thích tương ứng với từng tài khoản khi đổi user
  useEffect(() => {
    try {
      const key = getStorageKey();
      const saved = localStorage.getItem(key);
      if (saved) {
        setWishlistIds(JSON.parse(saved));
      } else {
        const defaultList = user?.role === 'customer' || !user ? ['prod_01', 'prod_04'] : [];
        setWishlistIds(defaultList);
      }
    } catch {
      setWishlistIds([]);
    }
  }, [user?.id, getStorageKey]);

  useEffect(() => {
    try {
      const key = getStorageKey();
      localStorage.setItem(key, JSON.stringify(wishlistIds));
      if (!user || user.role === 'customer') {
        localStorage.setItem(BASE_WISHLIST_STORAGE_KEY, JSON.stringify(wishlistIds));
      }
    } catch (e) {
      console.error('Lỗi khi lưu wishlist:', e);
    }
  }, [wishlistIds, getStorageKey, user]);

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
