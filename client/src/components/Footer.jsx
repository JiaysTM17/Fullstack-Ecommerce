import React from 'react';
import { useLanguage } from '../context/LanguageContext';
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
          
          {/* Subtle Architectural Credit */}
          <div>
            <span className="portfolio-credit-pill">
              💡 {language === 'vi' 
                ? 'Thiết kế kiến trúc hệ thống & luồng nghiệp vụ tham khảo chuẩn sàn TMĐT hiện đại (Core E-commerce Architecture)'
                : 'System architecture & workflow patterns referenced from modern e-commerce industry standards'}
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
