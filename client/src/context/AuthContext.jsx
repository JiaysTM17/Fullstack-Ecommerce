import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { loginAPI, registerAPI, demoLoginAPI, fetchCurrentUser, updateProfileAPI, changePasswordAPI, API_BASE_URL } from '../services/api';

const AuthContext = createContext(null);

// Demo accounts for quick UI preview (fallback only)
export const DEMO_ACCOUNTS = {
  customer: {
    _id: "user_customer_01", id: "user_customer_01",
    email: "khachhang@shopee.vn", fullName: "Nguyễn Văn Khách",
    phone: "0901234567", role: "customer",
    address: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"
  },
  seller_fashion: {
    _id: "user_seller_01", id: "user_seller_01",
    email: "shop.genz@shopee.vn", fullName: "Trần Thị Chủ Shop (Thời Trang)",
    phone: "0912345678", role: "seller",
    shopId: "shop_01", shopName: "Thời Trang GenZ Official",
    shopLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120",
    shopAddress: "Kho Tân Bình, TP. Hồ Chí Minh"
  },
  seller_tech: {
    _id: "user_seller_02", id: "user_seller_02",
    email: "shop.tech@shopee.vn", fullName: "Lê Văn Chủ Shop (Công Nghệ)",
    phone: "0987654321", role: "seller",
    shopId: "shop_02", shopName: "TechWorld Store",
    shopLogo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120",
    shopAddress: "Kho Cầu Giấy, Hà Nội"
  },
  admin: {
    _id: "user_admin_01", id: "user_admin_01",
    email: "admin@shopee.vn", fullName: "Tổng Quản Trị Viên Sàn",
    phone: "0999999999", role: "admin",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120"
  }
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('mini_shopee_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem('mini_shopee_token') || null;
  });

  // Persist user + token to localStorage
  useEffect(() => {
    if (user) {
      localStorage.setItem('mini_shopee_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('mini_shopee_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('mini_shopee_token', token);
    } else {
      localStorage.removeItem('mini_shopee_token');
    }
  }, [token]);

  // On mount: verify token is still valid
  useEffect(() => {
    if (token && !token.startsWith('mock_')) {
      fetchCurrentUser()
        .then((userData) => {
          if (userData) {
            setUser(prev => ({ ...prev, ...userData, id: userData._id || userData.id }));
          }
        })
        .catch(() => {
          // Token invalid or backend offline — keep local user data
        });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // === LOGIN — Backend-first, local fallback ===
  const login = useCallback(async (email, password, roleHint = 'customer') => {
    try {
      const data = await loginAPI(email, password);
      if (data.token && data.user) {
        const userData = { ...data.user, id: data.user._id || data.user.id };
        setUser(userData);
        setToken(data.token);
        return { success: true, user: userData };
      }
    } catch (err) {
      // If backend rejects with specific error, don't fallback
      if (err.status === 401 || err.status === 403) {
        return { success: false, error: err.message || 'Email hoặc mật khẩu không đúng' };
      }
      console.warn("Backend auth offline, using local fallback:", err.message);
    }

    // Local fallback (only if backend is unreachable)
    let matched = Object.values(DEMO_ACCOUNTS).find(acc => acc.email === email);
    if (!matched) {
      matched = {
        _id: 'user_' + Date.now(), id: 'user_' + Date.now(),
        email, fullName: email.split('@')[0], role: roleHint,
        shopId: roleHint === 'seller' ? 'shop_' + Date.now() : undefined,
        shopName: roleHint === 'seller' ? `Shop ${email.split('@')[0]}` : undefined
      };
    }
    setUser(matched);
    setToken('mock_jwt_token_' + matched.role + '_' + Date.now());
    return { success: true, user: matched };
  }, []);

  // === DEMO LOGIN — Uses backend /api/auth/demo for real JWT ===
  const loginAsDemo = useCallback(async (roleKey) => {
    try {
      const data = await demoLoginAPI(roleKey);
      if (data.token && data.user) {
        const userData = { ...data.user, id: data.user._id || data.user.id };
        setUser(userData);
        setToken(data.token);
        return userData;
      }
    } catch (err) {
      console.warn("Backend demo login offline, using local fallback:", err.message);
    }

    // Fallback
    const account = DEMO_ACCOUNTS[roleKey];
    if (account) {
      setUser(account);
      setToken('mock_jwt_token_' + account.role + '_' + Date.now());
      return account;
    }
    return null;
  }, []);

  // === REGISTER — Backend-first ===
  const register = useCallback(async (userData) => {
    try {
      const data = await registerAPI(userData);
      if (data.token && data.user) {
        const newUser = { ...data.user, id: data.user._id || data.user.id };
        setUser(newUser);
        setToken(data.token);
        return { success: true, user: newUser };
      }
    } catch (err) {
      if (err.status === 400 || err.status === 409) {
        return { success: false, error: err.message || 'Không thể đăng ký' };
      }
      console.warn("Backend register offline, using local fallback:", err.message);
    }

    // Local fallback
    const newUser = {
      _id: 'user_' + Date.now(), id: 'user_' + Date.now(),
      email: userData.email,
      fullName: userData.fullName || userData.email.split('@')[0],
      phone: userData.phone || '', role: userData.role || 'customer',
      shopId: userData.role === 'seller' ? 'shop_' + Date.now() : undefined,
      shopName: userData.shopName || (userData.role === 'seller' ? 'Cửa Hàng Mới' : undefined),
      address: userData.address || '', coins: 25000
    };
    setUser(newUser);
    setToken('mock_jwt_token_' + newUser.role + '_' + Date.now());
    return { success: true, user: newUser };
  }, []);

  // === LOGOUT ===
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mini_shopee_user');
    localStorage.removeItem('mini_shopee_token');
  }, []);

  // === UPDATE PROFILE — Sync with backend ===
  const updateProfile = useCallback(async (data) => {
    // Update local state immediately for responsive UI
    setUser(prev => {
      const updated = { ...prev, ...data };
      return updated;
    });

    // Sync to backend (fire & forget)
    if (token && !token.startsWith('mock_')) {
      try {
        await updateProfileAPI(data);
      } catch (err) {
        console.warn("Profile sync to backend failed:", err.message);
      }
    }
  }, [token]);

  // === CHANGE PASSWORD ===
  const changePassword = useCallback(async (oldPassword, newPassword) => {
    try {
      const res = await changePasswordAPI(oldPassword, newPassword);
      return { success: true, message: res?.message || 'Đổi mật khẩu thành công!' };
    } catch (err) {
      return { success: false, error: err.message || 'Đổi mật khẩu thất bại' };
    }
  }, []);

  const isCustomer = user?.role === 'customer';
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user, token,
        isAuthenticated: !!user,
        isCustomer, isSeller, isAdmin,
        login, loginAsDemo, register, logout, updateProfile, changePassword
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
