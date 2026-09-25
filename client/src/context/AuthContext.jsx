import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

// Danh sách tài khoản mẫu để trải nghiệm tức thì cho cả 3 vai trò
export const DEMO_ACCOUNTS = {
  customer: {
    _id: "user_customer_01",
    id: "user_customer_01",
    email: "khachhang@shopee.vn",
    fullName: "Nguyễn Văn Khách",
    phone: "0901234567",
    role: "customer",
    address: "123 Đường Lê Lợi, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh",
    avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120"
  },
  seller_fashion: {
    _id: "user_seller_01",
    id: "user_seller_01",
    email: "shop.genz@shopee.vn",
    fullName: "Trần Thị Chủ Shop (Thời Trang)",
    phone: "0912345678",
    role: "seller",
    shopId: "shop_01",
    shopName: "Thời Trang GenZ Official",
    shopLogo: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=120",
    shopAddress: "Kho Tân Bình, TP. Hồ Chí Minh"
  },
  seller_tech: {
    _id: "user_seller_02",
    id: "user_seller_02",
    email: "shop.tech@shopee.vn",
    fullName: "Lê Văn Chủ Shop (Công Nghệ)",
    phone: "0987654321",
    role: "seller",
    shopId: "shop_02",
    shopName: "TechWorld Store",
    shopLogo: "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=120",
    shopAddress: "Kho Cầu Giấy, Hà Nội"
  },
  admin: {
    _id: "user_admin_01",
    id: "user_admin_01",
    email: "admin@shopee.vn",
    fullName: "Tổng Quản Trị Viên Sàn",
    phone: "0999999999",
    role: "admin",
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

  // Đăng nhập
  const login = async (email, password, roleHint = 'customer') => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        return { success: true, user: data.user };
      }
    } catch (err) {
      console.warn("API Auth offline, falling back to local session:", err);
    }

    // Mock Login nếu backend chưa có endpoint auth
    let matched = Object.values(DEMO_ACCOUNTS).find(acc => acc.email === email);
    if (!matched) {
      matched = {
        _id: 'user_' + Date.now(),
        id: 'user_' + Date.now(),
        email,
        fullName: email.split('@')[0],
        role: roleHint,
        shopId: roleHint === 'seller' ? 'shop_' + Date.now() : undefined,
        shopName: roleHint === 'seller' ? `Shop ${email.split('@')[0]}` : undefined
      };
    }

    setUser(matched);
    setToken('mock_jwt_token_' + matched.role + '_' + Date.now());
    return { success: true, user: matched };
  };

  // Đăng nhập nhanh bằng tài khoản mẫu
  const loginAsDemo = (roleKey) => {
    const account = DEMO_ACCOUNTS[roleKey];
    if (account) {
      setUser(account);
      setToken('mock_jwt_token_' + account.role + '_' + Date.now());
      return account;
    }
    return null;
  };

  // Đăng ký
  const register = async (userData) => {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        setToken(data.token);
        return { success: true, user: data.user };
      }
    } catch (err) {
      console.warn("API Auth offline, registering locally:", err);
    }

    const newUser = {
      _id: 'user_' + Date.now(),
      id: 'user_' + Date.now(),
      email: userData.email,
      fullName: userData.fullName || userData.email.split('@')[0],
      phone: userData.phone || '',
      role: userData.role || 'customer',
      shopId: userData.role === 'seller' ? 'shop_' + Date.now() : undefined,
      shopName: userData.shopName || (userData.role === 'seller' ? 'Cửa Hàng Mới' : undefined),
      address: userData.address || ''
    };

    setUser(newUser);
    setToken('mock_jwt_token_' + newUser.role + '_' + Date.now());
    return { success: true, user: newUser };
  };

  // Đăng xuất
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mini_shopee_user');
    localStorage.removeItem('mini_shopee_token');
  };

  // Cập nhật thông tin profile
  const updateProfile = (data) => {
    setUser(prev => {
      const updated = { ...prev, ...data };
      return updated;
    });
  };

  // Kiểm tra quyền
  const isCustomer = user?.role === 'customer';
  const isSeller = user?.role === 'seller';
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isCustomer,
        isSeller,
        isAdmin,
        login,
        loginAsDemo,
        register,
        logout,
        updateProfile
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
