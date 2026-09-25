import React from 'react';
import '../styles/footer.css';

/**
 * Footer Component - Mini Shopee
 *
 * @param {Object} props
 * @param {string} [props.shopName='Mini Shopee'] - Tên cửa hàng
 * @param {string|number} [props.brandYear=2026] - Năm hiển thị bản quyền
 */
const Footer = ({ shopName = 'Mini Shopee', brandYear = 2026 }) => {
  return (
    <footer className="shopee-footer">
      <div className="shopee-container">
        <div className="shopee-footer-grid">
          {/* Col 1 */}
          <div className="shopee-footer-col">
            <h4>Chăm Sóc Khách Hàng</h4>
            <ul className="shopee-footer-list">
              <li className="shopee-footer-item"><span className="shopee-footer-link">Trung Tâm Trợ Giúp</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">Shopee Blog</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">Hướng Dẫn Mua Hàng</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">Chính Sách Vận Chuyển</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">Trả Hàng & Hoàn Tiền</span></li>
            </ul>
          </div>

          {/* Col 2 */}
          <div className="shopee-footer-col">
            <h4>Về {shopName}</h4>
            <ul className="shopee-footer-list">
              <li className="shopee-footer-item"><span className="shopee-footer-link">Giới Thiệu Về Chúng Tôi</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">Tuyển Dụng</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">Điều Khoản {shopName}</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">Chính Sách Bảo Mật</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">Chính Hãng</span></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="shopee-footer-col">
            <h4>Thanh Toán</h4>
            <div className="shopee-footer-badges">
              <span className="shopee-footer-badge">COD</span>
              <span className="shopee-footer-badge">Visa</span>
              <span className="shopee-footer-badge">MasterCard</span>
              <span className="shopee-footer-badge">Momo</span>
              <span className="shopee-footer-badge">VNPay</span>
            </div>
            <h4 style={{ marginTop: '20px' }}>Đơn Vị Vận Chuyển</h4>
            <div className="shopee-footer-badges">
              <span className="shopee-footer-badge">SPX Express</span>
              <span className="shopee-footer-badge">Giao Hàng Nhanh</span>
              <span className="shopee-footer-badge">Viettel Post</span>
            </div>
          </div>

          {/* Col 4 */}
          <div className="shopee-footer-col">
            <h4>Kết Nối Với Chúng Tôi</h4>
            <ul className="shopee-footer-list">
              <li className="shopee-footer-item"><span className="shopee-footer-link">Facebook</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">Instagram</span></li>
              <li className="shopee-footer-item"><span className="shopee-footer-link">LinkedIn</span></li>
            </ul>
          </div>
        </div>

        {/* Footer bottom */}
        <div className="shopee-footer-bottom">
          <p>© {brandYear} {shopName}. Tất cả các quyền được bảo lưu.</p>
          <p>Dự án Website Thương Mại Điện Tử Mini Full-stack JavaScript.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
