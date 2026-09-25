import React, { useState, useEffect } from 'react';
import '../styles/banner.css';

const SLIDES = [
  {
    id: 1,
    badge: "Siêu Hội Mua Sắm 2026",
    title: "Amazon Prime Days & Đại Tiệc Công Nghệ",
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
    <div className="shopee-hero-wrapper">
      <div
        className="shopee-hero-carousel"
        style={{ transform: `translateX(-${currentSlide * 100}%)` }}
      >
        {SLIDES.map((slide) => (
          <div
            key={slide.id}
            className="shopee-hero-slide"
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="shopee-hero-overlay" />
            <div className="shopee-hero-content">
              <span className="shopee-hero-badge">{slide.badge}</span>
              <h2 className="shopee-hero-title">{slide.title}</h2>
              <p className="shopee-hero-desc">{slide.description}</p>
              <button
                type="button"
                className="shopee-hero-btn"
                onClick={() => onSelectCategory && onSelectCategory(slide.category)}
              >
                {slide.buttonText} →
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
        ‹
      </button>
      <button
        type="button"
        className="shopee-hero-nav-btn shopee-hero-next"
        onClick={nextSlide}
        aria-label="Slide kế tiếp"
      >
        ›
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
  );
}
