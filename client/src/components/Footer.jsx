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
            <span style={{ display: 'inline-flex', alignItems: 'center' }}><CartIcon size={18} /></span>
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
              <span style={{ display: 'inline-flex', alignItems: 'center' }}><LayersIcon size={18} /></span>
              <span>{language === 'en' ? 'DESIGN INSPIRATIONS & ARCHITECTURAL REFERENCES' : 'NGUỒN CẢM HỨNG THIẾT KẾ & TIÊU CHUẨN KIẾN TRÚC'}</span>
            </div>
            <span style={{ fontSize: '11.5px', color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <CheckIcon size={12} />
              <span>Ethical Software Engineering</span>
            </span>
          </div>

          <div className="footer-attribution-grid">
            <div className="footer-attribution-card">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <ShoppingBagIcon size={15} />
                <span>Shopee VN (SEA)</span>
              </strong>
              <span>
                {language === 'en'
                  ? 'Referenced 2-tier Category carousel, Dual Voucher Stacking, and Gamification Xu rewards.'
                  : 'Cảm hứng bố cục Danh mục 2 tầng, cơ chế Voucher kép (Shop + Freeship) và hệ thống Gamification Xu thưởng.'}
              </span>
            </div>

            <div className="footer-attribution-card">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <PackageIcon size={15} />
                <span>Tiki (Vietnam)</span>
              </strong>
              <span>
                {language === 'en'
                  ? 'Referenced 100% Authentic Mall Guarantee, Fast Delivery 2H, and transparent logistics tracking.'
                  : 'Cảm hứng cam kết Hàng Chính Hãng 100%, huy hiệu Giao nhanh 2H và luồng tra cứu vận đơn minh bạch.'}
              </span>
            </div>

            <div className="footer-attribution-card">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <StoreIcon size={15} />
                <span>Lazada (Alibaba Group)</span>
              </strong>
              <span>
                {language === 'en'
                  ? 'Referenced multi-level Category Mega Menu and official brand flagship store discovery.'
                  : 'Cảm hứng phân nhánh Mega Menu đa cấp và trải nghiệm khám phá gian hàng thương hiệu chính hãng Mall.'}
              </span>
            </div>

            <div className="footer-attribution-card">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <StarIcon size={15} />
                <span>Amazon (Global)</span>
              </strong>
              <span>
                {language === 'en'
                  ? 'Referenced Amazon\'s Choice badge, faceted multi-attribute filters, and structured review stars.'
                  : 'Cảm hứng chứng nhận Hàng Tuyển Chọn, bộ lọc thông số đa chiều và hệ thống đánh giá sao chuẩn mực.'}
              </span>
            </div>

            <div className="footer-attribution-card">
              <strong style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                <SparklesIcon size={15} />
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
            ℹ️ <strong>{language === 'en' ? 'Intellectual Property & Professional Ethics Note:' : 'Tuyên Bố Bản Quyền & Tính Chuyên Nghiệp:'}</strong>{' '}
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
              <span className="shopee-footer-badge">COD</span>
              <span className="shopee-footer-badge">VietQR</span>
              <span className="shopee-footer-badge">Visa</span>
              <span className="shopee-footer-badge">MasterCard</span>
              <span className="shopee-footer-badge">Momo</span>
              <span className="shopee-footer-badge">VNPay</span>
            </div>
            <h4 style={{ marginTop: '20px' }}>{t('footer_shipping_units', 'Đơn Vị Vận Chuyển')}</h4>
            <div className="shopee-footer-badges">
              <span className="shopee-footer-badge">SPX Express</span>
              <span className="shopee-footer-badge">Giao Hàng Nhanh</span>
              <span className="shopee-footer-badge">Viettel Post</span>
            </div>
          </div>

          {/* Col 4 */}
          <div className="shopee-footer-col">
            <h4>{t('footer_connect', 'Kết Nối Với Chúng Tôi')}</h4>
            <ul className="shopee-footer-list">
              <li className="shopee-footer-item"><span className="shopee-footer-link">GitHub Portfolio</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">LinkedIn</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">Facebook</span></li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="shopee-footer-bottom">
          <p>© {brandYear} {shopName}. {t('footer_rights', 'Tất cả các quyền được bảo lưu.')}</p>
          <p>{t('footer_portfolio_project', 'Dự án Website Thương Mại Điện Tử Mini - Full-stack Portfolio Project.')}</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
