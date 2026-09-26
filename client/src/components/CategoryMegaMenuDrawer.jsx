import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getAllShops } from '../services/shopService';

export default function CategoryMegaMenuDrawer({ isOpen, onClose }) {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleNavigate = (path) => {
    onClose();
    navigate(path);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1100,
        background: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        animation: 'modalOverlayFadeIn 0.22s ease-out forwards',
      }}
      onClick={onClose}
    >
      <div
        className="anim-drawer-left"
        style={{
          width: '340px',
          maxWidth: '85vw',
          height: '100%',
          background: 'var(--bg-card, #ffffff)',
          boxShadow: '4px 0 24px rgba(0, 0, 0, 0.25)',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px 24px',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                background: 'var(--primary-color, #ea580c)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '18px',
                fontWeight: 700,
              }}
            >
              {user ? (user.fullName || user.email)[0].toUpperCase() : '👤'}
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700 }}>
                {user ? `Chào, ${user.fullName || user.email}` : 'Xin chào bạn mới!'}
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                {user ? `Vai trò: ${user.role}` : 'Đăng nhập để nhận ưu đãi'}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#ffffff',
              fontSize: '22px',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Drawer Content List */}
        <div style={{ padding: '16px 0', flex: 1, overflowY: 'auto' }}>
          {/* Main Highlights */}
          <div style={{ padding: '0 24px 12px', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Nổi Bật & Ưu Đãi
          </div>
          <div
            className="drawer-item"
            onClick={() => handleNavigate('/?badge=Hot+Deal')}
            style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}
          >
            <span style={{ fontSize: '18px' }}>⚡</span>
            <strong>Flash Deals Giờ Vàng</strong>
          </div>
          <div
            className="drawer-item"
            onClick={() => handleNavigate('/?badge=Best+Seller')}
            style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}
          >
            <span style={{ fontSize: '18px' }}>🔥</span>
            <strong>Top Sản Phẩm Bán Chạy</strong>
          </div>
          <div
            className="drawer-item"
            onClick={() => handleNavigate('/?fastDelivery=1')}
            style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)', borderBottom: '1px solid var(--border-light, #f1f5f9)' }}
          >
            <span style={{ fontSize: '18px' }}>🚀</span>
            <strong>Giao Siêu Tốc 2H (SPX Express)</strong>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light, #e2e8f0)', margin: '16px 0' }} />

          {/* Departments */}
          <div style={{ padding: '0 24px 12px', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Danh Mục Ngành Hàng
          </div>
          <div
            className="drawer-item"
            onClick={() => handleNavigate('/?category=Thời+trang')}
            style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}
          >
            <span style={{ fontSize: '18px' }}>👗</span>
            <span>Thời Trang & Phụ Kiện GenZ</span>
          </div>
          <div
            className="drawer-item"
            onClick={() => handleNavigate('/?category=Điện+tử')}
            style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}
          >
            <span style={{ fontSize: '18px' }}>🎧</span>
            <span>Thiết Bị Điện Tử & Công Nghệ</span>
          </div>
          <div
            className="drawer-item"
            onClick={() => handleNavigate('/?category=Sắc+đẹp')}
            style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}
          >
            <span style={{ fontSize: '18px' }}>💄</span>
            <span>Sắc Đẹp & Dược Mỹ Phẩm Chính Hãng</span>
          </div>
          <div
            className="drawer-item"
            onClick={() => handleNavigate('/?category=Gia+dụng')}
            style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}
          >
            <span style={{ fontSize: '18px' }}>🍳</span>
            <span>Gia Dụng & Thiết Bị Nhà Bếp Thông Minh</span>
          </div>
          <div
            className="drawer-item"
            onClick={() => handleNavigate('/?category=Đời+sống')}
            style={{ padding: '12px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '14px', color: 'var(--text-primary)' }}
          >
            <span style={{ fontSize: '18px' }}>🏠</span>
            <span>Đời Sống & Tiện Ích Gia Đình</span>
          </div>

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light, #e2e8f0)', margin: '16px 0' }} />

          {/* Shops */}
          <div style={{ padding: '0 24px 12px', fontSize: '12px', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Gian Hàng Chính Hãng Nổi Bật ({getAllShops().length} Shopee Mall)
          </div>
          {getAllShops().map((shop) => {
            const icons = {
              shop_01: '👗', shop_02: '🎧', shop_03: '💄', shop_04: '🏡',
              shop_05: '⚽', shop_06: '🌿', shop_07: '📚', shop_08: '🚗',
              shop_09: '🍼', shop_10: '🎵', shop_11: '🐾', shop_12: '⌚'
            };
            return (
              <div
                key={shop.id}
                className="drawer-item"
                onClick={() => handleNavigate(`/shop/${shop.id}`)}
                style={{ padding: '10px 24px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '13.5px', color: 'var(--text-primary)' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '17px' }}>{icons[shop.id] || '🏪'}</span>
                  <span style={{ fontWeight: 500 }}>{shop.name}</span>
                </div>
                <span style={{ fontSize: '10px', background: 'var(--primary-color, #ea580c)', color: '#fff', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>
                  Mall
                </span>
              </div>
            );
          })}

          <hr style={{ border: 'none', borderTop: '1px solid var(--border-light, #e2e8f0)', margin: '16px 0' }} />
        </div>
      </div>
    </div>
  );
}
