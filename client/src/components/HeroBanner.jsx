import React, { useState, useEffect } from 'react';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  SparklesIcon,
  FlameIcon,
  ShieldCheckIcon,
  TruckIcon,
  RefreshIcon,
  CoinIcon,
  ChatIcon,
} from './OrdersIcons';
import '../styles/banner.css';

const SLIDES = [
  {
    id: 1,
    badge: "Siêu Hội Mua Sắm 2026",
    title: "Đại Tiệc Công Nghệ & Phụ Kiện Cao Cấp",
    description: "Giảm tới 50% tai nghe chống ồn, bàn phím cơ và chuột công thái học. Miễn phí vận chuyển toàn quốc.",
    buttonText: "Khám Phá Ngay",
    category: "Điện tử",
    image: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=1200",
  },
  {
    id: 2,
    badge: "Bộ Sưu Tập Xu Hướng",
    title: "Thời Trang Hiện Đại - Phong Cách Tối Giản",
    description: "Áo thun cotton dệt sợi thiên nhiên, sơ mi lụa satin ngọc trai và quần jean denim cao cấp.",
    buttonText: "Mua Sắm Xu Hướng",
    category: "Thời trang",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200",
  },
  {
    id: 3,
    badge: "Chính Hãng 100% Shopee Mall",
    title: "Không Gian Sống Tiện Nghi & Thông Minh",
    description: "Đèn bàn bảo vệ thị lực chuẩn y khoa, bình giữ nhiệt hiển thị nhiệt độ thông minh.",
    buttonText: "Xem Ưu Đãi",
    category: "Đời sống",
    image: "https://images.unsplash.com/photo-1513694203232-719a280e022f?w=1200",
  },
];

export default function HeroBanner({ onSelectCategory }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  };

  return (
    <div style={{ marginBottom: '20px' }}>
      <div className="shopee-hero-wrapper" style={{ marginBottom: 0 }}>
        <div
          className="shopee-hero-carousel"
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {SLIDES.map((slide, idx) => (
            <div
              key={slide.id}
              className="shopee-hero-slide"
              style={{ backgroundImage: `url(${slide.image})` }}
            >
              <div className="shopee-hero-overlay" />
              <div className="shopee-hero-content">
                <span className="shopee-hero-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  {idx === 0 ? <SparklesIcon size={12} color="#f59e0b" /> : idx === 1 ? <FlameIcon size={12} color="#ef4444" /> : <ShieldCheckIcon size={12} color="#10b981" />}
                  <span>{slide.badge}</span>
                </span>
                <h2 className="shopee-hero-title">{slide.title}</h2>
                <p className="shopee-hero-desc">{slide.description}</p>
                <button
                  type="button"
                  className="shopee-hero-btn"
                  onClick={() => onSelectCategory && onSelectCategory(slide.category)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <span>{slide.buttonText}</span>
                  <ChevronRightIcon size={16} color="#ffffff" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Navigation Buttons */}
        <button
          type="button"
          className="shopee-hero-nav-btn shopee-hero-prev"
          onClick={prevSlide}
          aria-label="Slide trước"
        >
          <ChevronLeftIcon size={20} color="#ffffff" />
        </button>
        <button
          type="button"
          className="shopee-hero-nav-btn shopee-hero-next"
          onClick={nextSlide}
          aria-label="Slide kế tiếp"
        >
          <ChevronRightIcon size={20} color="#ffffff" />
        </button>

        {/* Pagination Dots */}
        <div className="shopee-hero-dots">
          {SLIDES.map((slide, idx) => (
            <button
              key={slide.id}
              type="button"
              className={`shopee-hero-dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
              aria-label={`Chuyển tới slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Shopee-style Top Value Propositions Strip */}
      <div className="shopee-hero-features">
        <div className="shopee-hero-feature-item">
          <ShieldCheckIcon size={22} color="#16a34a" />
          <div>
            <strong>100% Chính Hãng</strong>
            <span>Cam kết hoàn tiền</span>
          </div>
        </div>
        <div className="shopee-hero-feature-item">
          <TruckIcon size={22} color="#ea580c" />
          <div>
            <strong>Freeship Toàn Quốc</strong>
            <span>Đơn từ 300.000₫</span>
          </div>
        </div>
        <div className="shopee-hero-feature-item">
          <RefreshIcon size={22} color="#2563eb" />
          <div>
            <strong>Đổi Trả 30 Ngày</strong>
            <span>Thủ tục dễ dàng</span>
          </div>
        </div>
        <div className="shopee-hero-feature-item">
          <CoinIcon size={22} color="#f59e0b" />
          <div>
            <strong>Tích Lũy Mini Xu</strong>
            <span>Đổi voucher & quà</span>
          </div>
        </div>
        <div className="shopee-hero-feature-item">
          <ChatIcon size={22} color="#0284c7" />
          <div>
            <strong>Hỗ Trợ 24/7</strong>
            <span>AI Copilot & CSKH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
