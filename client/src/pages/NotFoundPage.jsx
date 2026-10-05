import React from 'react';
import { Link } from 'react-router-dom';
import { HomeIcon, CartIcon, PackageIcon, AlertCircleIcon } from '../components/OrdersIcons';

export default function NotFoundPage() {
  return (
    <main className="shopee-container shopee-empty-state" style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', textAlign: 'center' }}>
      <div style={{
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: '#fff7ed',
        border: '2px solid #fed7aa',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '20px',
        boxShadow: '0 8px 24px rgba(234, 88, 12, 0.12)'
      }}>
        <AlertCircleIcon size={52} color="#ea580c" />
      </div>

      <div style={{
        fontSize: '44px',
        fontWeight: 900,
        color: '#ea580c',
        lineHeight: 1,
        marginBottom: '8px',
        letterSpacing: '1px'
      }}>
        404
      </div>

      <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0f172a', margin: '0 0 10px 0' }}>
        Không Tìm Thấy Trang Yêu Cầu
      </h1>

      <p style={{ maxWidth: '460px', color: '#64748b', fontSize: '14px', lineHeight: 1.6, margin: '0 0 28px 0' }}>
        Đường dẫn bạn vừa truy cập có thể không tồn tại, đã bị thay đổi địa chỉ hoặc tạm thời không khả dụng trên hệ thống Fullstack E-Commerce.
      </p>

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link
          to="/"
          className="shopee-btn shopee-btn-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 22px',
            borderRadius: '8px',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '14px'
          }}
        >
          <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: 'rgba(255,255,255,0.2)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <HomeIcon size={13} color="#ffffff" />
          </span>
          <span>Về Trang Chủ</span>
        </Link>

        <Link
          to="/user/orders"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1.5px solid #cbd5e1',
            background: '#ffffff',
            color: '#1e293b',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', border: '1px solid rgba(234, 88, 12, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <PackageIcon size={12} color="#ea580c" />
          </span>
          <span>Đơn Hàng Của Tôi</span>
        </Link>

        <Link
          to="/cart"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 20px',
            borderRadius: '8px',
            border: '1.5px solid #cbd5e1',
            background: '#ffffff',
            color: '#1e293b',
            textDecoration: 'none',
            fontWeight: 700,
            fontSize: '14px',
            transition: 'all 0.2s ease'
          }}
        >
          <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.12)', border: '1px solid rgba(37, 99, 235, 0.22)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
            <CartIcon size={12} color="#2563eb" />
          </span>
          <span>Xem Giỏ Hàng</span>
        </Link>
      </div>
    </main>
  );
}
