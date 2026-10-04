import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import {
  CartIcon,
  LayersIcon,
  ShoppingBagIcon,
  PackageIcon,
  StoreIcon,
  StarIcon,
  SparklesIcon,
  CheckIcon,
  AlertCircleIcon,
  TruckIcon,
  CreditCardIcon,
  QrCodeIcon,
  PhoneIcon,
  MailIcon,
  GlobeIcon,
  ShieldCheckIcon,
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
            <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#ffedd5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <CartIcon size={15} color="#ea580c" />
            </span>
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
              ? 'Security & Customer Satisfaction: 100% genuine merchandise guarantee with 30-day hassle-free returns, multi-method payment including VietQR dynamic QR code and COD, alongside 24/7 omnichannel assistance combining AI Copilot and live human support agents.'
              : 'An tâm mua sắm: Cam kết 100% hàng chính hãng, chính sách đổi trả 30 ngày bảo vệ người mua tối đa, đa dạng phương thức thanh toán an toàn từ VietQR động đến COD, cùng dịch vụ chăm sóc khách hàng đa kênh tích hợp Trợ lý ảo AI và đội ngũ nhân viên trực tuyến 24/7.'}
          </p>
        </section>

        {/* 2. Design Inspiration & Architectural References Section */}
        <section className="footer-attribution-section">
          <div className="footer-attribution-header">
            <div className="footer-attribution-title">
              <span style={{ width: '26px', height: '26px', borderRadius: '7px', background: '#dbeafe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <LayersIcon size={15} color="#2563eb" />
              </span>
              <span>{language === 'en' ? 'DESIGN INSPIRATIONS & ARCHITECTURAL REFERENCES' : 'NGUỒN CẢM HỨNG THIẾT KẾ & TIÊU CHUẨN KIẾN TRÚC'}</span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckIcon size={12} color="#16a34a" />
              <span>Ethical Software Engineering</span>
            </span>
          </div>

          <div className="footer-attribution-grid">
            <div className="footer-attribution-card">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#ffedd5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShoppingBagIcon size={13} color="#ea580c" />
                </span>
                <span>Shopee VN (SEA)</span>
              </strong>
              <span>
                {language === 'en'
                  ? 'Referenced 2-tier Category carousel, Dual Voucher Stacking, and Gamification Xu rewards.'
                  : 'Cảm hứng bố cục Danh mục 2 tầng, cơ chế Voucher kép (Shop + Freeship) và hệ thống Gamification Xu thưởng.'}
              </span>
            </div>

            <div className="footer-attribution-card">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PackageIcon size={13} color="#0284c7" />
                </span>
                <span>Tiki (Vietnam)</span>
              </strong>
              <span>
                {language === 'en'
                  ? 'Referenced 100% Authentic Mall Guarantee, Fast Delivery 2H, and transparent logistics tracking.'
                  : 'Cảm hứng cam kết Hàng Chính Hãng 100%, huy hiệu Giao nhanh 2H và luồng tra cứu vận đơn minh bạch.'}
              </span>
            </div>

            <div className="footer-attribution-card">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#fee2e2', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StoreIcon size={13} color="#dc2626" />
                </span>
                <span>Lazada (Alibaba Group)</span>
              </strong>
              <span>
                {language === 'en'
                  ? 'Referenced multi-level Category Mega Menu and official brand flagship store discovery.'
                  : 'Cảm hứng phân nhánh Mega Menu đa cấp và trải nghiệm khám phá gian hàng thương hiệu chính hãng Mall.'}
              </span>
            </div>

            <div className="footer-attribution-card">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#fef3c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <StarIcon size={13} color="#f59e0b" fill="#f59e0b" />
                </span>
                <span>Amazon (Global)</span>
              </strong>
              <span>
                {language === 'en'
                  ? 'Referenced Amazon\'s Choice badge, faceted multi-attribute filters, and structured review stars.'
                  : 'Cảm hứng chứng nhận Hàng Tuyển Chọn, bộ lọc thông số đa chiều và hệ thống đánh giá sao chuẩn mực.'}
              </span>
            </div>

            <div className="footer-attribution-card">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '6px', background: '#ede9fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SparklesIcon size={13} color="#8b5cf6" />
                </span>
                <span>Apple & Vercel Systems</span>
              </strong>
              <span>
                {language === 'en'
                  ? 'Referenced typography contrast (WCAG 2.1 AAA), Dark/Light mode, and micro-interactions.'
                  : 'Cảm hứng bảng màu Dark/Light Mode, typography tương phản chuẩn WCAG 2.1 AAA và chuyển động vi mô.'}
              </span>
            </div>
          </div>

          <div className="footer-attribution-note">
            <span style={{ display: 'inline-flex', alignItems: 'center', verticalAlign: 'middle', marginRight: '6px', color: '#0284c7' }}><AlertCircleIcon size={15} color="#0284c7" /></span>
            <strong>{language === 'en' ? 'Intellectual Property & Professional Ethics Note:' : 'Tuyên Bố Bản Quyền & Tính Chuyên Nghiệp:'}</strong>{' '}
            {language === 'en'
              ? 'This system synthesizes industry-standard UX patterns from world-leading e-commerce platforms. All source code, database architectures, RESTful APIs, and UI designs were custom-engineered independently with clean-room implementation. No proprietary code or assets were duplicated, honoring intellectual property rights and academic integrity.'
              : 'Dự án kế thừa và chắt lọc các quy chuẩn trải nghiệm người dùng (UX best practices) từ các sàn thương mại điện tử hàng đầu thế giới. Toàn bộ mã nguồn React/Node.js, kiến trúc cơ sở dữ liệu, API RESTful và thiết kế giao diện được tự nghiên cứu, thiết kế riêng biệt và lập trình độc quyền (Clean-room Implementation), không sao chép nguyên mẫu, thể hiện tính chuyên nghiệp và tôn trọng bản quyền sở hữu trí tuệ.'}
          </div>
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
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#ffedd5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TruckIcon size={11} color="#ea580c" />
                </span>
                <span>COD</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <QrCodeIcon size={11} color="#2563eb" />
                </span>
                <span>VietQR</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCardIcon size={11} color="#16a34a" />
                </span>
                <span>Visa</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#fef3c7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CreditCardIcon size={11} color="#d97706" />
                </span>
                <span>MasterCard</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#fae8ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SparklesIcon size={11} color="#c026d3" />
                </span>
                <span>Momo</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#e0e7ff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <ShieldCheckIcon size={11} color="#4338ca" />
                </span>
                <span>VNPay</span>
              </span>
            </div>
            <h4 style={{ marginTop: '20px' }}>{t('footer_shipping_units', 'Đơn Vị Vận Chuyển')}</h4>
            <div className="shopee-footer-badges">
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#ffedd5', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TruckIcon size={11} color="#ea580c" />
                </span>
                <span>SPX Express</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#e0f2fe', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TruckIcon size={11} color="#0284c7" />
                </span>
                <span>Giao Hàng Nhanh</span>
              </span>
              <span className="shopee-footer-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '18px', height: '18px', borderRadius: '4px', background: '#dcfce7', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <TruckIcon size={11} color="#16a34a" />
                </span>
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
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GlobeIcon size={11} color="#2563eb" />
                  </span>
                  <span>GitHub Portfolio</span>
                </span>
              </li>
              <li className="shopee-footer-item">
                <span className="shopee-footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(2, 132, 199, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GlobeIcon size={11} color="#0284c7" />
                  </span>
                  <span>LinkedIn</span>
                </span>
              </li>
              <li className="shopee-footer-item">
                <span className="shopee-footer-link" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ width: '20px', height: '20px', borderRadius: '50%', background: 'rgba(59, 130, 246, 0.1)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                    <GlobeIcon size={11} color="#3b82f6" />
                  </span>
                  <span>Facebook</span>
                </span>
              </li>
            </ul>
            <h4 style={{ marginTop: '20px' }}>{language === 'en' ? 'Hotline & Support' : 'Tổng Đài Hỗ Trợ'}</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12.5px' }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary, #0f172a)' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <PhoneIcon size={12} color="#16a34a" />
                </span>
                <span style={{ fontWeight: 600 }}>1900 6868</span>
                <span style={{ fontSize: '11px', color: '#94a3b8' }}>(8:00 - 21:00)</span>
              </div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary, #475569)' }}>
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(234, 88, 12, 0.12)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <MailIcon size={12} color="#ea580c" />
                </span>
                <span>support@shopee-mini.vn</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="shopee-footer-bottom">
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', marginBottom: '12px' }}>
            <span className="portfolio-credit-pill" style={{ color: '#16a34a', borderColor: 'rgba(22, 163, 74, 0.25)', background: 'rgba(22, 163, 74, 0.05)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(22, 163, 74, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <ShieldCheckIcon size={11} color="#16a34a" />
              </span>
              <span>{language === 'en' ? 'Verified Ministry of Industry and Trade' : 'Đã Thông Báo Bộ Công Thương'}</span>
            </span>
            <span className="portfolio-credit-pill" style={{ color: '#2563eb', borderColor: 'rgba(37, 99, 235, 0.25)', background: 'rgba(37, 99, 235, 0.05)', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(37, 99, 235, 0.15)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={11} color="#2563eb" />
              </span>
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
