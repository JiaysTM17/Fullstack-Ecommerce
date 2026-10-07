import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  CartIcon,
  CheckIcon,
  TruckIcon,
  CreditCardIcon,
  QrCodeIcon,
  PhoneIcon,
  MailIcon,
  GlobeIcon,
  ShieldCheckIcon,
  SparklesIcon,
} from './OrdersIcons';
import '../styles/footer.css';

/**
 * Footer Component - Mini Shopee
 *
 * @param {Object} props
 * @param {string} [props.shopName='Mini Shopee'] - Tên cửa hàng
 * @param {string|number} [props.brandYear=2026] - Năm hiển thị bản quyền
 */
const Footer = ({ shopName = 'Fullstack E-Commerce', brandYear = 2026 }) => {
  const { t, language } = useLanguage();

  return (
    <footer className="shopee-footer">
      <div className="shopee-container">
        {/* 1. Shopee-style SEO Marketplace Introduction Section */}
        <section className="footer-seo-section">
          <div className="footer-seo-title">
            <CartIcon size={20} color="#ea580c" />
            <span>{language === 'en' ? 'ABOUT FULLSTACK E-COMMERCE SMART MARKETPLACE' : 'VỀ SÀN THƯƠNG MẠI ĐIỆN TỬ FULLSTACK E-COMMERCE'}</span>
          </div>
          <p className="footer-seo-text">
            {language === 'en'
              ? 'Fullstack E-Commerce is a next-generation smart online shopping platform connecting millions of consumers with authentic brand merchants across Vietnam. With over 20 top product categories, high-speed 2H express delivery, and transparent order tracking powered by SPX Express, we ensure every shopping journey is seamless, convenient, and safe.'
              : 'Fullstack E-Commerce là nền tảng thương mại điện tử thông minh thế hệ mới, kết nối hàng triệu người tiêu dùng với các gian hàng chính hãng hàng đầu tại Việt Nam. Với hơn 20 ngành hàng đa dạng từ Thời trang, Thiết bị điện tử, Sắc đẹp mỹ phẩm đến Gia dụng và Mẹ & Bé, cùng mạng lưới giao vận siêu tốc 2H qua SPX Express, chúng tôi mang tới trải nghiệm mua sắm tiện ích, tiết kiệm và an tâm tuyệt đối.'}
          </p>
          <p className="footer-seo-text">
            {language === 'en'
              ? 'Innovative Dual Voucher Stacking allows buyers to combine Shop-level discounts with Platform-wide Freeship codes in a single checkout. Engaging daily gamification features—such as the 7-day Check-in Streak and interactive Lucky Wheel—empower shoppers to accumulate Mini Xu rewards, convert coins into instant discounts, and unlock personalized member privileges.'
              : 'Hệ sinh thái ưu đãi tích hợp cơ chế Voucher Kép độc quyền cho phép cộng dồn Mã giảm giá của Shop cùng Mã Freeship toàn sàn trong một lần thanh toán. Bên cạnh đó, các tính năng Gamification như Chuỗi Điểm Danh 7 Ngày và Vòng Quay May Mắn giúp người dùng tích lũy Mini Xu dễ dàng, quy đổi trực tiếp thành tiền mặt khấu trừ vào đơn hàng và mở khóa đặc quyền thành viên.'}
          </p>
          <p className="footer-seo-text" style={{ marginBottom: 0 }}>
            {language === 'en'
              ? 'Security & Customer Satisfaction: 100% genuine merchandise guarantee with 15-day hassle-free returns, multi-method payment including VietQR dynamic QR code and COD, alongside 24/7 omnichannel assistance combining AI Copilot and live human support agents.'
              : 'An tâm mua sắm: Cam kết 100% hàng chính hãng, chính sách đổi trả 15 ngày bảo vệ người mua tối đa, đa dạng phương thức thanh toán an toàn từ VietQR động đến COD, cùng dịch vụ chăm sóc khách hàng đa kênh tích hợp Trợ lý ảo AI và đội ngũ nhân viên trực tuyến 24/7.'}
          </p>
        </section>



        {/* 3. Main Footer Grid (Navigation Links, Badges, Logistics) */}
        <div className="shopee-footer-grid">
          {/* Col 1 */}
          <div className="shopee-footer-col">
            <h4>{t('footer_customer_service', 'Chăm Sóc Khách Hàng')}</h4>
            <ul className="shopee-footer-list">
              <li className="shopee-footer-item"><span className="shopee-footer-link">{t('footer_help_center', 'Trung Tâm Trợ Giúp')}</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">{shopName} Blog</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">{t('footer_shopping_guide', 'Hướng Dẫn Mua Hàng')}</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">{t('footer_shipping_policy', 'Chính Sách Vận Chuyển')}</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">{t('footer_returns', 'Trả Hàng & Hoàn Tiền')}</span></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="shopee-footer-col">
            <h4>{t('footer_about', 'Về')} {shopName}</h4>
            <ul className="shopee-footer-list">
              <li className="shopee-footer-item"><span className="shopee-footer-link">{t('footer_about_us', 'Giới Thiệu Về Chúng Tôi')}</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">{t('footer_careers', 'Tuyển Dụng')}</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">{t('footer_terms', 'Điều Khoản Dịch Vụ')}</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">{t('footer_privacy', 'Chính Sách Bảo Mật')}</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">{t('footer_genuine', 'Cam Kết Chính Hãng')}</span></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="shopee-footer-col">
            <h4>{t('footer_payment', 'Thanh Toán')}</h4>
            <div className="shopee-footer-badges">
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <TruckIcon size={13} color="#ea580c" />
                <span>COD</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <QrCodeIcon size={13} color="#2563eb" />
                <span>VietQR</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CreditCardIcon size={13} color="#16a34a" />
                <span>Visa</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <CreditCardIcon size={13} color="#d97706" />
                <span>MasterCard</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <SparklesIcon size={13} color="#c026d3" />
                <span>Momo</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ShieldCheckIcon size={13} color="#4338ca" />
                <span>VNPay</span>
              </span>
            </div>
            <h4 style={{ marginTop: '20px' }}>{t('footer_shipping_units', 'Đơn Vị Vận Chuyển')}</h4>
            <div className="shopee-footer-badges">
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <TruckIcon size={13} color="#ea580c" />
                <span>SPX Express</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <TruckIcon size={13} color="#0284c7" />
                <span>Giao Hàng Nhanh</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <TruckIcon size={13} color="#16a34a" />
                <span>Viettel Post</span>
              </span>
            </div>
          </div>

          {/* Col 4 */}
          <div className="shopee-footer-col">
            <h4>{t('footer_connect', 'Kết Nối Với Chúng Tôi')}</h4>
            <ul className="shopee-footer-list">
              <li className="shopee-footer-item">
                <span className="shopee-footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <GlobeIcon size={14} color="#2563eb" />
                  <span>GitHub Portfolio</span>
                </span>
              </li>
              <li className="shopee-footer-item">
                <span className="shopee-footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <GlobeIcon size={14} color="#0284c7" />
                  <span>LinkedIn</span>
                </span>
              </li>
              <li className="shopee-footer-item">
                <span className="shopee-footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <GlobeIcon size={14} color="#3b82f6" />
                  <span>Facebook</span>
                </span>
              </li>
            </ul>
            <h4 style={{ marginTop: '20px' }}>{language === 'en' ? 'Hotline & Support' : 'Tổng Đài Hỗ Trợ'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary, #0f172a)' }}>
                <PhoneIcon size={14} color="#16a34a" />
                <span style={{ fontWeight: 600 }}>1900 6868</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>(8:00 - 21:00)</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #475569)' }}>
                <MailIcon size={14} color="#ea580c" />
                <span>support@shopee-mini.vn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="shopee-footer-bottom">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span className="portfolio-credit-pill" style={{ color: '#16a34a', borderColor: 'rgba(22, 163, 74, 0.25)', background: 'rgba(22, 163, 74, 0.05)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheckIcon size={13} color="#16a34a" />
              <span>{language === 'en' ? 'Verified Ministry of Industry and Trade' : 'Đã Thông Báo Bộ Công Thương'}</span>
            </span>
            <span className="portfolio-credit-pill" style={{ color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.25)', background: 'rgba(37, 99, 235, 0.05)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <CheckIcon size={13} color="#2563eb" />
              <span>{language === 'en' ? '100% Secure Checkout SSL' : 'Thanh Toán Chuẩn An Toàn SSL'}</span>
            </span>
          </div>
          <p>© {brandYear} {shopName}. {t('footer_rights', 'Tất cả các quyền được bảo lưu.')}</p>
          <p>{t('footer_portfolio_project', 'Dự án Website Thương Mại Điện Tử Mini - Full-stack Portfolio Project.')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
