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
            background: var(--bg-card, rgba(255, 255, 255, 0.98));
            backdrop-filter: blur(16px);
            -webkit-backdrop-filter: blur(16px);
            border-top: 1px solid var(--border-medium, #e2e8f0);
            box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.06);
            z-index: 9998;
            padding-bottom: env(safe-area-inset-bottom, 0px);
          }
          body {
            padding-bottom: calc(56px + env(safe-area-inset-bottom, 0px)) !important;
          }
          .mobile-nav-item {
            background: none;
            border: none;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 3px;
            cursor: pointer;
            padding: 4px 0;
            transition: all 0.15s ease;
            position: relative;
          }
          .mobile-nav-item:active {
            transform: scale(0.92);
          }
          .mobile-nav-indicator {
            position: absolute;
            bottom: 2px;
            width: 14px;
            height: 3px;
            border-radius: 2px;
          }
        }
      `}</style>

      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {/* 1. Home */}
        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => navigate('/')}
          style={{
            color: currentPath === '/' ? '#2563eb' : '#64748b',
          }}
        >
          <HomeIcon
            size={20}
            color={currentPath === '/' ? '#2563eb' : '#64748b'}
          />
          <span style={{ fontSize: '10.5px', fontWeight: currentPath === '/' ? 700 : 500 }}>
            Trang Chủ
          </span>
          {currentPath === '/' && (
            <span className="mobile-nav-indicator" style={{ backgroundColor: '#2563eb' }} />
          )}
        </button>

        {/* 2. Categories */}
        <button
          type="button"
          className="mobile-nav-item"
          onClick={handleOpenCategories}
          style={{
            color: '#ea580c',
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
          className="mobile-nav-item"
          onClick={handleOpenChat}
          style={{
            color: '#0284c7',
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
          className="mobile-nav-item"
          onClick={() => navigate('/cart')}
          style={{
            color: currentPath === '/cart' ? '#9333ea' : '#64748b',
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
                  background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
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
                  boxShadow: '0 1px 4px rgba(220, 38, 38, 0.4)',
                }}
              >
                {totalQuantity > 99 ? '99+' : totalQuantity}
              </span>
            )}
          </div>
          <span style={{ fontSize: '10.5px', fontWeight: currentPath === '/cart' ? 700 : 500 }}>
            Giỏ Hàng
          </span>
          {currentPath === '/cart' && (
            <span className="mobile-nav-indicator" style={{ backgroundColor: '#9333ea' }} />
          )}
        </button>

        {/* 5. User / Profile */}
        <button
          type="button"
          className="mobile-nav-item"
          onClick={() => navigate(user ? '/profile' : '/login')}
          style={{
            color: (currentPath === '/profile' || currentPath === '/orders' || currentPath === '/login') ? '#10b981' : '#64748b',
          }}
        >
          <UserIcon
            size={20}
            color={(currentPath === '/profile' || currentPath === '/orders' || currentPath === '/login') ? '#10b981' : '#64748b'}
          />
          <span style={{ fontSize: '10.5px', fontWeight: (currentPath === '/profile' || currentPath === '/orders') ? 700 : 500 }}>
            {user ? 'Tôi' : 'Tài Khoản'}
          </span>
          {(currentPath === '/profile' || currentPath === '/orders' || currentPath === '/login') && (
            <span className="mobile-nav-indicator" style={{ backgroundColor: '#10b981' }} />
          )}
        </button>
      </nav>
    </>
  );
}
