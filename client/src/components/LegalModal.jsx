import React, { useState } from 'react';

/**
 * Enterprise Legal, Terms of Service & Privacy Policy Modal
 * Author: Kiệt Trương <truonggiakiet110806@gmail.com>
 */
export default function LegalModal({ isOpen, onClose, initialTab = 'terms' }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  if (!isOpen) return null;

  return (
    <div
      className="shopee-auth-modal-overlay"
      onClick={onClose}
      style={{ zIndex: 10000 }}
    >
      <div
        className="shopee-auth-modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', padding: '28px 24px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', borderBottom: '1px solid #e2e8f0', paddingBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '22px' }}>📜</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>
              Chính Sách & Quy Định Pháp Lý
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              fontSize: '16px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>

        {/* Tab switch */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '16px' }}>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'terms' ? '#ffffff' : 'transparent',
              color: activeTab === 'terms' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: activeTab === 'terms' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            📋 Điều Khoản Dịch Vụ
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            style={{
              padding: '8px 14px',
              borderRadius: '8px',
              border: 'none',
              background: activeTab === 'privacy' ? '#ffffff' : 'transparent',
              color: activeTab === 'privacy' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: activeTab === 'privacy' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none',
              transition: 'all 0.2s ease',
            }}
          >
            🔒 Chính Sách Bảo Mật
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
          {activeTab === 'terms' ? (
            <div>
              <h4 style={{ color: '#0f172a', margin: '0 0 8px', fontSize: '15px' }}>
                ĐIỀU KHOẢN DỊCH VỤ SÀN FULLSTACK E-COMMERCE
              </h4>
              <p>
                Chào mừng bạn đến với <strong>Fullstack E-Commerce</strong>. Bằng việc đăng ký tài khoản hoặc sử dụng dịch vụ trên nền tảng của chúng tôi, bạn đồng ý tuân thủ các điều khoản và điều kiện được nêu dưới đây.
              </p>

              <h5 style={{ color: '#1e293b', margin: '14px 0 6px', fontSize: '13.5px' }}>1. Tài Khoản & Quyền Truy Cập</h5>
              <p>
                Người dùng có trách nhiệm bảo mật thông tin đăng nhập và mọi hoạt động diễn ra dưới tài khoản của mình. Mật khẩu phải tuân thủ tiêu chuẩn an toàn (tối thiểu 8 ký tự, gồm chữ hoa, số và ký tự đặc biệt). Không chia sẻ thông tin tài khoản cho bên thứ ba.
              </p>

              <h5 style={{ color: '#1e293b', margin: '14px 0 6px', fontSize: '13.5px' }}>2. Quy Định Đối Với Người Mua & Người Bán</h5>
              <ul>
                <li><strong>Người Mua:</strong> Được quyền hưởng trọn gói bảo vệ người mua, đổi trả trong 30 ngày, hoàn tiền 100% nếu phát hiện hàng giả/kém chất lượng.</li>
                <li><strong>Chủ Shop (Người Bán):</strong> Cam kết cung cấp hàng hóa chính hãng, giao hàng đúng hẹn trong khung giờ cam kết (Hỏa tốc 2H, Nhanh). Tuân thủ mức phí sàn minh bạch và chính sách hoàn tiền của hệ thống.</li>
              </ul>

              <h5 style={{ color: '#1e293b', margin: '14px 0 6px', fontSize: '13.5px' }}>3. Thanh Toán & Bảo Vệ Giao Dịch</h5>
              <p>
                Tất cả các giao dịch thanh toán trực tuyến qua VietQR, Ví điện tử hoặc Thẻ tín dụng đều được bảo mật chuẩn mã hóa SSL 256-Bit. Tiền thanh toán sẽ được giữ tại tài khoản trung gian của sàn và chỉ giải ngân cho người bán khi đơn hàng giao thành công mà không có khiếu nại.
              </p>

              <h5 style={{ color: '#1e293b', margin: '14px 0 6px', fontSize: '13.5px' }}>4. Xử Lý Vi Phạm</h5>
              <p>
                Hệ thống có quyền đình chỉ, khóa tài khoản hoặc hủy tư cách tham gia sàn vĩnh viễn nếu phát hiện hành vi gian lận, spam đơn ảo, cố tình tấn công dò mật khẩu (Brute-Force) hoặc vi phạm pháp luật hiện hành.
              </p>
            </div>
          ) : (
            <div>
              <h4 style={{ color: '#0f172a', margin: '0 0 8px', fontSize: '15px' }}>
                CHÍNH SÁCH BẢO MẬT & BẢO VỆ DỮ LIỆU CÁ NHÂN
              </h4>
              <p>
                <strong>Fullstack E-Commerce</strong> tôn trọng quyền riêng tư và cam kết bảo vệ dữ liệu cá nhân của mọi khách hàng và đối tác kinh doanh theo chuẩn Nghị định 13/2023/NĐ-CP và tiêu chuẩn quốc tế GDPR.
              </p>

              <h5 style={{ color: '#1e293b', margin: '14px 0 6px', fontSize: '13.5px' }}>1. Dữ Liệu Chúng Tôi Thu Thập</h5>
              <ul>
                <li>Họ và tên, địa chỉ email, số điện thoại đăng ký.</li>
                <li>Địa chỉ nhận hàng / địa chỉ kho hàng phục vụ vận chuyển.</li>
                <li>Lịch sử đơn hàng, điểm tích lũy Mini Xu và voucher khuyến mãi.</li>
                <li>Thông tin kỹ thuật phiên: Địa chỉ IP, thiết bị đăng nhập, nhật ký bảo mật.</li>
              </ul>

              <h5 style={{ color: '#1e293b', margin: '14px 0 6px', fontSize: '13.5px' }}>2. Tiêu Chuẩn Bảo Mật Công Nghệ Cao</h5>
              <p>
                Mọi mật khẩu đều được băm một chiều an toàn bằng thuật toán <strong>Argon2 / Bcrypt</strong> với salt ngẫu nhiên, không thể đảo ngược. Hệ thống bảo mật 2 lớp 2FA qua mã OTP 6 số và cơ chế thanh trượt chống bot tự động ngăn chặn hoàn toàn xâm nhập trái phép.
              </p>

              <h5 style={{ color: '#1e293b', margin: '14px 0 6px', fontSize: '13.5px' }}>3. Cam Kết Tuyệt Đối</h5>
              <p>
                Chúng tôi <strong>không bao giờ bán, cho thuê hoặc tiết lộ</strong> thông tin cá nhân của bạn cho bất kỳ bên thứ ba nào vì mục đích quảng cáo khi chưa có sự đồng ý của bạn. Dữ liệu chỉ được cung cấp cho đơn vị vận chuyển đối tác (SPX Express, Giao Hàng Nhanh) để thực hiện giao nhận đơn hàng.
              </p>

              <h5 style={{ color: '#1e293b', margin: '14px 0 6px', fontSize: '13.5px' }}>4. Quyền Của Khách Hàng</h5>
              <p>
                Bạn có toàn quyền truy cập, chỉnh sửa, yêu cầu trích xuất hoặc xóa vĩnh viễn dữ liệu tài khoản cá nhân bất kỳ lúc nào bằng cách truy cập Trung tâm tài khoản hoặc liên hệ Tổng đài CSKH 24/7 (1900 6868).
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
              color: '#ffffff',
              border: 'none',
              padding: '9px 24px',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '13px',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(37, 99, 235, 0.25)',
            }}
          >
            Đã Hiểu & Đồng Ý
          </button>
        </div>
      </div>
    </div>
  );
}
