import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import { getOrderTracking } from '../services/orderService';
import {
  PackageIcon,
  StoreIcon,
  ChatIcon,
  CopyIcon,
  TruckIcon,
  MapPinIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  PrinterIcon,
  ReceiptIcon,
  EyeIcon,
  RefreshIcon,
  ClockIcon,
  CheckIcon,
  ReturnIcon,
  StarIcon,
  PhoneIcon,
  ArrowLeftIcon,
  CloseIcon,
} from './OrdersIcons';

export default function DeliveryLiveMapModal({ order, onClose, inline = false }) {
  const { showToast } = useToast();
  const [progress, setProgress] = useState(65); // percent of transit completed
  const [etaMinutes, setEtaMinutes] = useState(18);
  const [liveTracking, setLiveTracking] = useState(null);

  useEffect(() => {
    const orderId = order?.orderId || order?._id || order?.id;
    if (orderId) {
      getOrderTracking(orderId)
        .then((data) => {
          if (data) {
            setLiveTracking(data);
            if (data.currentLocation?.etaMinutes) {
              setEtaMinutes(data.currentLocation.etaMinutes);
            }
          }
        })
        .catch((err) => {
          console.warn('Could not load live tracking:', err);
        });
    }
  }, [order]);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((prev) => (prev >= 95 ? 95 : prev + 1));
      setEtaMinutes((prev) => (prev <= 5 ? 5 : prev - 1));
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const courier = liveTracking?.courier || {
    name: 'Nguyễn Văn Hùng',
    phone: '0908 123 456',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
    vehicle: 'Xe máy Honda Wave Alpha',
    licensePlate: '59-P1 839.22',
    rating: 4.95,
  };

  const currentLocation = liveTracking?.currentLocation || {
    lat: 10.7769,
    lng: 106.7009,
    label: 'Bưu cục phát SPX Express Quận 1, TP. Hồ Chí Minh',
    address: 'Bưu cục phát SPX Express Quận 1, TP. Hồ Chí Minh',
    bearing: 45,
    speedKmh: 28,
    distanceRemainingKm: 1.2,
    etaMinutes: 15,
  };

  const hubs = liveTracking?.hubs || [
    { name: 'Hub Củ Chi SOC', time: '08:30', completed: true },
    { name: 'Hub Tân Bình', time: '11:15', completed: true },
    { name: 'Bưu cục phát Quận 1', time: '14:45', completed: false },
  ];

  const carrier = liveTracking?.carrier || 'SPX Express';
  const trackingCode = liveTracking?.trackingCode || liveTracking?.trackingNumber || order?.trackingCode || 'SPX-VN-84729104';
  const customerAddress = order?.shippingAddress || 'Số 123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh';

  const handleCallShipper = () => {
    showToast(`Đang kết nối cuộc gọi tới Shipper ${courier.name} (${courier.phone})...`, 'info');
  };

  const handleChatShipper = () => {
    showToast(`Đã mở khung chat với Shipper ${carrier}!`, 'success');
  };

  const mapContent = (
    <div
      className={inline ? 'delivery-map-inline-container' : 'anim-modal-content'}
      style={{
        background: '#ffffff',
        color: '#0f172a',
        borderRadius: inline ? '12px' : '16px',
        width: '100%',
        maxWidth: inline ? '100%' : '640px',
        maxHeight: inline ? 'none' : '86vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: inline ? 'none' : '0 25px 50px -12px rgba(0, 0, 0, 0.28)',
        border: inline ? 'none' : '1px solid #e2e8f0',
        position: 'relative',
        overflow: inline ? 'visible' : 'hidden',
        margin: inline ? '0' : 'auto',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: inline ? '14px 18px' : '16px 22px',
          borderBottom: '1px solid #f1f5f9',
          background: '#f8fafc',
          borderRadius: inline ? '12px 12px 0 0' : 0,
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {inline && (
                <button
                type="button"
                className="shopee-order-btn-outline"
                onClick={onClose}
                style={{
                  borderRadius: '6px',
                  padding: '0 10px',
                  fontWeight: 600,
                  fontSize: '11.5px',
                  height: '28px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  marginRight: '6px',
                }}
              >
                <ArrowLeftIcon size={12} color="#2563eb" />
                <span>Quay lại</span>
              </button>
            )}
            <span style={{ color: '#2563eb', display: 'flex', alignItems: 'center' }}>
              <MapPinIcon size={18} color="#2563eb" />
            </span>
            <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: '#0f172a' }}>
              Theo Dõi Vị Trí Shipper Trực Tiếp
            </h3>
            <span
              style={{
                background: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                padding: '2px 8px',
                borderRadius: '12px',
                fontSize: '11px',
                fontWeight: 700,
              }}
            >
              {carrier}
            </span>
          </div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
            Mã vận đơn: <strong style={{ color: '#0f172a' }}>{trackingCode}</strong> · Trạng thái: <strong>{liveTracking?.statusText || 'Đang giao hàng'}</strong>
          </div>
        </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              width: '30px',
              height: '30px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#64748b',
              transition: 'all 0.15s ease',
            }}
          >
            <CloseIcon size={14} color="#64748b" />
          </button>
        </div>

        {/* Scrollable Map Body */}
        <div
          style={{
            padding: '20px 22px',
            overflowY: 'auto',
            flex: 1,
            boxSizing: 'border-box',
          }}
        >

        {/* Live GPS Map Simulation Container */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '240px',
            background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)',
            borderRadius: '12px',
            overflow: 'hidden',
            marginBottom: '16px',
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
              stroke="#2563eb"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray="600"
              strokeDashoffset={600 - (600 * progress) / 100}
              style={{ transition: 'stroke-dashoffset 0.8s ease' }}
            />
          </svg>

          {/* Node 1: Warehouse / Hub Start */}
          <div
            style={{
              position: 'absolute',
              left: '32px',
              top: '160px',
              background: '#0f172a',
              color: '#fff',
              border: '1px solid #334155',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <StoreIcon size={12} color="#94a3b8" />
            <span>{hubs[1]?.name || 'Kho Tân Bình'}</span>
          </div>

          {/* Node 2: Customer Destination */}
          <div
            style={{
              position: 'absolute',
              right: '20px',
              top: '50px',
              background: '#059669',
              color: '#fff',
              padding: '4px 8px',
              borderRadius: '6px',
              fontSize: '11px',
              fontWeight: 700,
              boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <MapPinIcon size={12} color="#ffffff" />
            <span>Nhà của bạn</span>
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
                background: '#2563eb',
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
              Shipper đang di chuyển ({Math.round(progress)}%)
            </div>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: '#ffffff',
                border: '3px solid #2563eb',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(37, 99, 235, 0.5)',
                animation: 'pulse-glow 1.5s infinite',
              }}
            >
              <TruckIcon size={18} color="#2563eb" />
            </div>
          </div>

          {/* Floating ETA & Telemetry Badge */}
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
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              flexWrap: 'wrap',
            }}
          >
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ClockIcon size={12} color="#38bdf8" />
              <span>Dự kiến giao: <strong style={{ color: '#38bdf8' }}>{etaMinutes} phút nữa</strong></span>
            </span>
            <span>·</span>
            <span>Cách bạn ~{currentLocation.distanceRemainingKm || 1.2} km</span>
            <span>·</span>
            <span>Vận tốc: {currentLocation.speedKmh || 28} km/h</span>
          </div>
        </div>

        {/* Real-time GPS Telemetry Bar */}
        <div
          style={{
            background: 'var(--bg-muted, #f8fafc)',
            border: '1px solid var(--border-medium, #e2e8f0)',
            borderRadius: '8px',
            padding: '8px 12px',
            marginBottom: '14px',
            fontSize: '11.5px',
            color: 'var(--text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '6px',
          }}
        >
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <MapPinIcon size={12} color="#2563eb" />
            <span><strong>Vị trí hiện tại:</strong> {currentLocation.label || currentLocation.address}</span>
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <span>Tọa độ: <strong>{typeof currentLocation.lat === 'number' ? currentLocation.lat.toFixed(4) : currentLocation.lat}, {typeof currentLocation.lng === 'number' ? currentLocation.lng.toFixed(4) : currentLocation.lng}</strong></span>
            <span>Góc hướng: <strong>{currentLocation.bearing || 45}°</strong></span>
          </div>
        </div>

        {/* 3-Stage Hub Progress Timeline */}
        <div
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1px solid var(--border-medium, #e2e8f0)',
            borderRadius: '10px',
            padding: '12px 14px',
            marginBottom: '14px',
          }}
        >
          <div
            style={{
              fontSize: '12.5px',
              fontWeight: 800,
              color: 'var(--text-primary)',
              marginBottom: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <PackageIcon size={14} color="#0284c7" />
              <span>Tiến Trình Luân Chuyển 3 Hub SPX Express</span>
            </span>
            <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700 }}>
              {hubs.filter((h) => h.completed).length}/{hubs.length} trạm hoàn tất
            </span>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '8px',
            }}
          >
            {hubs.map((hub, idx) => (
              <div
                key={idx}
                style={{
                  background: hub.completed
                    ? 'rgba(5, 150, 105, 0.08)'
                    : idx === 1
                    ? 'rgba(37, 99, 235, 0.08)'
                    : 'var(--bg-muted, #f8fafc)',
                  border: hub.completed
                    ? '1px solid #a7f3d0'
                    : idx === 1
                    ? '1px solid #bfdbfe'
                    : '1px solid var(--border-light, #e2e8f0)',
                  borderRadius: '8px',
                  padding: '8px 10px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '3px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      width: '18px',
                      height: '18px',
                      borderRadius: '50%',
                      background: hub.completed ? '#059669' : idx === 1 ? '#2563eb' : '#94a3b8',
                      color: '#ffffff',
                      fontSize: '10px',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {hub.completed ? <CheckIcon size={10} /> : idx + 1}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {hub.time || '--:--'}
                  </span>
                </div>
                <div style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px' }}>
                  {hub.name}
                </div>
                <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                  {hub.completed ? 'Đã hoàn tất' : idx === 1 ? 'Đang luân chuyển' : 'Chờ tiếp nhận'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipper Details Profile Card */}
        <div
          style={{
            background: 'var(--bg-muted, #f8fafc)',
            border: '1px solid var(--border-medium, #e2e8f0)',
            borderRadius: '10px',
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
            marginBottom: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={courier.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100'}
              alt="Shipper"
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #2563eb',
              }}
            />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>{courier.name}</span>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                  <CheckIcon size={11} color="#059669" /> Bưu tá chính thức SPX
                </span>
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'wrap', marginTop: '2px' }}>
                <span>Biển số:</span>
                <strong
                  style={{
                    background: '#e2e8f0',
                    color: '#0f172a',
                    padding: '1px 6px',
                    borderRadius: '4px',
                    fontWeight: 800,
                  }}
                >
                  {courier.licensePlate || '59-P1 839.22'}
                </strong>
                <span>({courier.vehicle || 'Xe máy'}) · Đánh giá:</span>
                <StarIcon size={12} color="#f59e0b" filled />
                <strong>{courier.rating || 4.95}</strong>/5.0
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={handleCallShipper}
              className="shopee-order-btn-primary"
              style={{
                fontSize: '12px',
                fontWeight: 700,
                borderRadius: '8px',
                padding: '6px 14px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <PhoneIcon size={13} color="#ffffff" />
              <span>Gọi ({courier.phone || '0908 123 456'})</span>
            </button>
            <button
              type="button"
              onClick={handleChatShipper}
              className="shopee-order-btn-outline"
              style={{
                padding: '6px 14px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <ChatIcon size={13} color="#2563eb" />
              <span>Nhắn Tin</span>
            </button>
          </div>
        </div>

        {/* Destination & Safety Info */}
        <div style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
            <MapPinIcon size={13} color="#2563eb" />
            <span><strong>Địa chỉ giao tới:</strong> {customerAddress}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '5px', marginTop: '4px' }}>
            <ShieldCheckIcon size={13} color="#15803d" style={{ flexShrink: 0, marginTop: '2px' }} />
            <em>
              Đơn hàng được bảo hiểm 100% bởi Shopee Care & {carrier}. Vui lòng kiểm tra
              kiện hàng còn nguyên tem phong niêm phong trước khi nhận.
            </em>
          </div>
        </div>
        </div>
      </div>
  );

  if (inline) {
    return (
      <div style={{ width: '100%', animation: 'fadeIn 0.25s ease-out' }}>
        {mapContent}
      </div>
    );
  }

  return (
    <div
      className="shopee-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1400,
        background: 'rgba(15, 23, 42, 0.65)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
        overflowY: 'auto',
        boxSizing: 'border-box',
        animation: 'modalOverlayFadeIn 0.2s ease-out forwards',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {mapContent}
    </div>
  );
}
