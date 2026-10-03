import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import {
  HomeIcon,
  PackageIcon,
  ChatIcon,
  CartIcon,
  UserIcon,
} from './OrdersIcons';

export default function MobileBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalQuantity } = useCart();
  const { user } = useAuth();

  const currentPath = location.pathname;

  const handleOpenCategories = () => {
    window.dispatchEvent(new CustomEvent('open_category_drawer'));
  };

  const handleOpenChat = () => {
    window.dispatchEvent(new CustomEvent('open_live_chat'));
  };

  return (
    <>
      <style>{`
        .mobile-bottom-nav {
          display: none;
        }
        @media (max-width: 768px) {
          .mobile-bottom-nav {
            display: grid !important;
            grid-template-columns: repeat(5, 1fr);
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            height: 56px;
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid var(--border-light, #e2e8f0);
            box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
            z-index: 9998;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          body {
            padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important;
          }
        }
      `}</style>

      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {/* 1. Home */}
        <button
          type="button"
          onClick={() => navigate('/')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer',
            padding: '4px 0',
            color: currentPath === '/' ? '#2563eb' : '#64748b',
            transition: 'transform 0.1s ease',
          }}
        >
          <HomeIcon
            size={20}
            color={currentPath === '/' ? '#2563eb' : '#64748b'}
          />
          <span style={{ fontSize: '10.5px', fontWeight: currentPath === '/' ? 700 : 500 }}>
            Trang Chủ
          </span>
        </button>

        {/* 2. Categories */}
        <button
          type="button"
          onClick={handleOpenCategories}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer',
            padding: '4px 0',
            color: '#ea580c',
            transition: 'transform 0.1s ease',
          }}
        >
          <PackageIcon size={20} color="#ea580c" />
          <span style={{ fontSize: '10.5px', fontWeight: 600 }}>
            Danh Mục
          </span>
        </button>

        {/* 3. Live Chat CSKH AI */}
        <button
          type="button"
          onClick={handleOpenChat}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer',
            padding: '4px 0',
            color: '#0284c7',
            position: 'relative',
            transition: 'transform 0.1s ease',
          }}
        >
          <div style={{ position: 'relative' }}>
            <ChatIcon size={20} color="#0284c7" />
            <span
              style={{
                position: 'absolute',
                top: '-2px',
                right: '-4px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: '#10b981',
                border: '1.5px solid #ffffff',
              }}
            />
          </div>
          <span style={{ fontSize: '10.5px', fontWeight: 600 }}>
            Chat 24/7
          </span>
        </button>

        {/* 4. Cart */}
        <button
          type="button"
          onClick={() => navigate('/cart')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer',
            padding: '4px 0',
            color: currentPath === '/cart' ? '#9333ea' : '#64748b',
            position: 'relative',
            transition: 'transform 0.1s ease',
          }}
        >
          <div style={{ position: 'relative' }}>
            <CartIcon
              size={20}
              color={currentPath === '/cart' ? '#9333ea' : '#64748b'}
            />
            {totalQuantity > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-8px',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '9.5px',
                  fontWeight: 800,
                  borderRadius: '999px',
                  minWidth: '15px',
                  height: '15px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 3px',
                  border: '1.5px solid #ffffff',
                }}
              >
                {totalQuantity > 99 ? '99+' : totalQuantity}
              </span>
            )}
          </div>
          <span style={{ fontSize: '10.5px', fontWeight: currentPath === '/cart' ? 700 : 500 }}>
            Giỏ Hàng
          </span>
        </button>

        {/* 5. User / Profile */}
        <button
          type="button"
          onClick={() => navigate(user ? '/profile' : '/login')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            cursor: 'pointer',
            padding: '4px 0',
            color: (currentPath === '/profile' || currentPath === '/orders' || currentPath === '/login') ? '#10b981' : '#64748b',
            transition: 'transform 0.1s ease',
          }}
        >
          <UserIcon
            size={20}
            color={(currentPath === '/profile' || currentPath === '/orders' || currentPath === '/login') ? '#10b981' : '#64748b'}
          />
          <span style={{ fontSize: '10.5px', fontWeight: (currentPath === '/profile' || currentPath === '/orders') ? 700 : 500 }}>
            {user ? 'Tôi' : 'Tài Khoản'}
          </span>
        </button>
      </nav>
    </>
  );
}
