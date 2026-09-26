import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';

export default function DeliveryLiveMapModal({ order, onClose }) {
  const { showToast } = useToast();
  const [progress, setProgress] = useState(65); // percent of transit completed
  const [etaMinutes, setEtaMinutes] = useState(18);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + 1));
      setEtaMinutes((prev) => (prev <= 5 ? 5 : prev - 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handleCallShipper = () => {
    showToast('📞 Đang kết nối cuộc gọi tới Shipper Nguyễn Văn Hùng (0912 888 999)...', 'info');
  };

  const handleChatShipper = () => {
    showToast('💬 Đã mở khung chat với Shipper SPX Express!', 'success');
  };

  const trackingCode = order?.trackingCode || 'SPX-VN-84729104';
  const customerAddress = order?.shippingAddress || 'Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';

  return (
    <div
      className="shopee-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1200,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        overflowY: 'auto',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: 'var(--bg-card, #ffffff)',
          color: 'var(--text-primary, #0f172a)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: '640px',
          padding: '24px',
          boxShadow: 'var(--shadow-modal, 0 20px 40px rgba(0,0,0,0.3))',
          border: '1px solid var(--border-medium, #e2e8f0)',
          position: 'relative',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
            paddingBottom: '12px',
            borderBottom: '1px solid var(--border-light, #f1f5f9)',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '18px' }}>🗺️</span>
              <h3 style={{ margin: 0, fontSize: '17px', fontWeight: 800 }}>
                Theo Dõi Vị Trí Shipper Trực Tiếp
              </h3>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Vận đơn: <strong>{trackingCode}</strong> · Đơn vị: <strong>SPX Express Siêu Tốc</strong>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
            }}
          >
            ✕
          </button>
        </div>

        {/* Live GPS Map Simulation Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '18px',
            border: '1px solid #334155',
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.4)',
          }}
        >
          {/* Stylized Grid Roads Background */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.25 }}>
            <pattern id="roadGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#64748b" strokeWidth="1" />
            </pattern>
            <rect width="100%" height="100%" fill="url(#roadGrid)" />
          </svg>

          {/* Delivery Route Path */}
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            {/* Base Route Line */}
            <path
              d="M 60 180 Q 200 40 320 140 T 560 70"
              fill="none"
              stroke="#475569"
              strokeWidth="6"
              strokeLinecap="round"
            />
            {/* Traveled Route Line */}
            <path
              d="M 60 180 Q 200 40 320 140 T 560 70"
              fill="none"
              stroke="#ea580c"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="600"
              strokeDashoffset={600 - (600 * progress) / 100}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>

          {/* Node 1: Warehouse Start */}
          <div
            style={{
              position: 'absolute',
              left: '42px',
              top: '160px',
              background: '#0284c7',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🏢 Kho Tân Bình
          </div>

          {/* Node 2: Customer Destination */}
          <div
            style={{
              position: 'absolute',
              right: '20px',
              top: '50px',
              background: '#10b981',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            🏠 Nhà của bạn
          </div>

          {/* Moving Shipper Marker */}
          <div
            style={{
              position: 'absolute',
              left: `${progress * 0.8 + 8}%`,
              top: `${130 - Math.sin((progress / 100) * Math.PI) * 60}px`,
              transform: 'translate(-50%, -50%)',
              transition: 'all 0.8s ease',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              zIndex: 10,
            }}
          >
            <div
              style={{
                background: '#ea580c',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 800,
                padding: '2px 8px',
                borderRadius: '12px',
                whiteSpace: 'nowrap',
                boxShadow: '0 2px 6px rgba(0,0,0,0.4)',
                marginBottom: '4px',
              }}
            >
              🛵 Shipper đang di chuyển ({Math.round(progress)}%)
            </div>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '3px solid #ea580c',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                boxShadow: '0 4px 12px rgba(234, 88, 12, 0.6)',
                animation: 'pulse-glow 1.5s infinite',
              }}
            >
              🛵
            </div>
          </div>

          {/* Floating ETA Badge */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              background: 'rgba(15, 23, 42, 0.88)',
              backdropFilter: 'blur(6px)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: '8px',
              border: '1px solid rgba(255,255,255,0.15)',
              fontSize: '12px',
            }}
          >
            ⏱️ Dự kiến giao: <strong style={{ color: '#f59e0b' }}>{etaMinutes} phút nữa</strong> · Cách bạn ~1.8 km
          </div>
        </div>

        {/* Shipper Details Profile Card */}
        <div
          style={{
            background: 'var(--bg-muted, #f8fafc)',
            border: '1px solid var(--border-medium, #e2e8f0)',
            borderRadius: '10px',
            padding: '14px 18px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '16px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"
              alt="Shipper"
              style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary-color, #ea580c)' }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Nguyễn Văn Hùng <span style={{ fontSize: '11px', color: '#16a34a', fontWeight: 700 }}>✓ Bưu tá chính thức SPX</span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Biển số: <strong>59-P1 839.22</strong> (Honda Wave đỏ) · Đánh giá: ⭐ <strong>4.95</strong>/5.0
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCallShipper}
              className="shopee-btn"
              style={{
                background: 'var(--primary-color, #ea580c)',
                color: '#fff',
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '8px',
              }}
            >
              📞 Gọi Điện
            </button>
            <button
              type="button"
              onClick={handleChatShipper}
              className="shopee-btn shopee-btn-secondary"
              style={{
                padding: '8px 14px',
                fontSize: '12.5px',
                fontWeight: 700,
                borderRadius: '8px',
              }}
            >
              💬 Nhắn Tin
            </button>
          </div>
        </div>

        {/* Destination & Safety Info */}
        <div style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
          📍 <strong>Địa chỉ giao tới:</strong> {customerAddress}<br />
          🛡️ <em>Đơn hàng được bảo hiểm 100% bởi Fullstack E-Commerce Care & SPX Express. Vui lòng kiểm tra kiện hàng còn nguyên tem phong niêm phong trước khi nhận.</em>
        </div>
      </div>
    </div>
  );
}
