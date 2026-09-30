import React, { useState, useEffect } from 'react';

/**
 * Enterprise Legal, Terms of Service & Privacy Policy Modal
 * Dedicated separate legal documents for Customer and Seller
 * Author: Kiệt Trương <truonggiakiet110806@gmail.com>
 */
export default function LegalModal({
  isOpen,
  onClose,
  initialTab = 'terms',
  role: initialRole = 'customer'
}) {
  const [activeTab, setActiveTab] = useState(initialTab); // 'terms' | 'privacy'
  const [activeRole, setActiveRole] = useState(initialRole); // 'customer' | 'seller'

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setActiveRole(initialRole);
    }
  }, [isOpen, initialTab, initialRole]);

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
        style={{
          maxWidth: '680px',
          width: '92%',
          padding: '24px 28px',
          maxHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box'
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '24px' }}>📜</span>
            <div>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                Quy Định Pháp Lý & Chính Sách Sàn
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                Hệ thống Thương Mại Điện Tử Fullstack E-Commerce
              </span>
            </div>
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
              fontSize: '15px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Đóng"
          >
            ✕
          </button>
        </div>

        {/* Role Switcher: Khách Mua Hàng vs Đối Tác Shop */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
          <button
            type="button"
            onClick={() => setActiveRole('customer')}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: activeRole === 'customer' ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
              background: activeRole === 'customer' ? 'rgba(59, 130, 246, 0.08)' : '#ffffff',
              color: activeRole === 'customer' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>🛒</span>
            <span>Dành Cho Khách Mua Hàng</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveRole('seller')}
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              border: activeRole === 'seller' ? '1.5px solid #3b82f6' : '1px solid #cbd5e1',
              background: activeRole === 'seller' ? 'rgba(59, 130, 246, 0.08)' : '#ffffff',
              color: activeRole === 'seller' ? '#2563eb' : '#64748b',
              fontWeight: 700,
              fontSize: '12.5px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              transition: 'all 0.2s ease',
            }}
          >
            <span>🏪</span>
            <span>Dành Cho Đối Tác Shop (Người Bán)</span>
          </button>
        </div>

        {/* Tab switcher: Điều khoản dịch vụ vs Chính sách bảo mật */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', background: '#f1f5f9', padding: '4px', borderRadius: '12px', marginBottom: '14px' }}>
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
            🔒 Chính Sách Bảo Mật & Dữ Liệu
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px', fontSize: '13px', color: '#334155', lineHeight: '1.6' }}>
          {activeRole === 'customer' ? (
            /* =================== CUSTOMER POLICIES =================== */
            activeTab === 'terms' ? (
              <div>
                <div style={{ background: 'rgba(59, 130, 246, 0.08)', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', borderLeft: '4px solid #3b82f6' }}>
                  <strong style={{ color: '#1d4ed8', display: 'block', fontSize: '13.5px' }}>
                    QUY CHẾ DỊCH VỤ DÀNH CHO KHÁCH MUA HÀNG (CUSTOMER TERMS)
                  </strong>
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    Áp dụng cho mọi giao dịch đặt mua, thanh toán và bảo vệ quyền lợi người tiêu dùng trên sàn.
                  </span>
                </div>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>1. Quyền Lợi & Bảo Vệ Người Mua (Buyer Protection)</h5>
                <p>
                  Mọi đơn hàng trên sàn đều được áp dụng cơ chế <strong>Ký Quỹ Trung Gian (Escrow)</strong>: Tiền thanh toán của bạn sẽ được hệ thống giữ an toàn và chỉ thanh toán cho người bán sau khi bạn đã nhận hàng nguyên vẹn và xác nhận hài lòng.
                </p>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>2. Cam Kết Hàng Chính Hãng & Đổi Trả 30 Ngày</h5>
                <ul>
                  <li>Cam kết 100% hàng chính hãng: Đền bù gấp đôi (200%) giá trị đơn hàng nếu phát hiện hàng giả, hàng nhái.</li>
                  <li>Đổi trả miễn phí trong vòng 30 ngày kể từ lúc nhận hàng: Shipper của sàn (SPX Express) đến tận nơi thu hồi hoàn toàn miễn phí.</li>
                  <li>Hoàn tiền tức thì về Ví Tiền Sàn hoặc tài khoản ngân hàng trong vòng 2-5 phút sau khi đơn đổi trả được tiếp nhận.</li>
                </ul>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>3. Tích Lũy Mini Xu & Sử Dụng Voucher Kép</h5>
                <p>
                  Người mua được cộng 1.000 Xu tân thủ khi đăng ký tài khoản và tích lũy tối đa 50.000 Xu mỗi ngày khi hoàn tất đơn hàng. Mini Xu có thể trừ trực tiếp 50% tổng giá trị thanh toán. Cho phép áp dụng cộng dồn đồng thời Voucher Giảm Giá Sàn và Voucher Freeship Xtra.
                </p>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>4. Trách Nhiệm Của Khách Hàng</h5>
                <p>
                  Người mua có nghĩa vụ cung cấp số điện thoại chính xác (định dạng 10 số di động Việt Nam) và địa chỉ nhận hàng cụ thể. Tuyệt đối không thực hiện các hành vi gian lận mã giảm giá, đặt đơn hàng ảo hoặc lạm dụng chính sách trả hàng.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', borderLeft: '4px solid #10b981' }}>
                  <strong style={{ color: '#047857', display: 'block', fontSize: '13.5px' }}>
                    CHÍNH SÁCH BẢO MẬT THÔNG TIN NGƯỜI MUA (PRIVACY POLICY)
                  </strong>
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    Tuân thủ nghiêm ngặt Nghị định 13/2023/NĐ-CP về bảo vệ dữ liệu cá nhân tại Việt Nam.
                  </span>
                </div>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>1. Dữ Liệu Được Thu Thập</h5>
                <p>
                  Chúng tôi chỉ thu thập các dữ liệu cần thiết phục vụ mua sắm và giao nhận: Họ và tên, email, số điện thoại, địa chỉ nhận hàng và lịch sử giao dịch. Chúng tôi tuyệt đối không thu thập các dữ liệu cá nhân nhạy cảm ngoài phạm vi mua sắm.
                </p>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>2. Chuẩn Mã Hóa Bảo Mật & Xác Thực 2 Bước (2FA)</h5>
                <ul>
                  <li>Mật khẩu được băm một chiều bằng chuẩn <strong>Argon2 / Bcrypt</strong> kết hợp chuỗi muối ngẫu nhiên (salt).</li>
                  <li>Giao thức mã hóa SSL/TLS 256-Bit toàn trình cho mọi giao dịch thanh toán trực tuyến.</li>
                  <li>Bảo vệ tài khoản qua mã xác thực ngẫu nhiên 6 chữ số gửi trực tiếp về email định danh.</li>
                </ul>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>3. Cam Kết Tuyệt Đối Về Dữ Liệu</h5>
                <p>
                  Sàn cam kết <strong>không mua bán, cho thuê hay chia sẻ dữ liệu người mua</strong> cho bất kỳ đối tác quảng cáo nào. Dữ liệu địa chỉ và số điện thoại chỉ được cung cấp cho đơn vị vận chuyển (SPX Express, GHN) để phục vụ duy nhất mục đích giao hàng tận tay.
                </p>
              </div>
            )
          ) : (
            /* =================== SELLER / SHOP POLICIES =================== */
            activeTab === 'terms' ? (
              <div>
                <div style={{ background: 'rgba(245, 158, 11, 0.08)', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', borderLeft: '4px solid #f59e0b' }}>
                  <strong style={{ color: '#b45309', display: 'block', fontSize: '13.5px' }}>
                    ĐIỀU KHOẢN VẬN HÀNH DÀNH CHO ĐỐI TÁC GIAN HÀNG (SELLER TERMS)
                  </strong>
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    Quy chuẩn thương mại, quản lý chất lượng hàng hóa và phê duyệt gian hàng chính thức.
                  </span>
                </div>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>1. Quy Trình Phê Duyệt Hồ Sơ Gian Hàng Bởi Admin</h5>
                <p>
                  Sau khi đăng ký tài khoản Người Bán, hồ sơ gian hàng sẽ được chuyển sang trạng thái <strong>Chờ Quản Trị Viên (Admin) Phê Duyệt</strong> trong vòng 24 giờ. Admin sẽ kiểm tra tên gian hàng, danh mục sản phẩm và thông tin liên hệ trước khi kích hoạt quyền đăng bán và mở cổng ví shop.
                </p>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>2. Tiêu Chuẩn Hàng Hóa & Nghiêm Cấm Hàng Giả</h5>
                <ul>
                  <li>Cam kết 100% sản phẩm có nguồn gốc xuất xứ rõ ràng, có hóa đơn chứng từ hợp lệ theo quy định pháp luật.</li>
                  <li><strong>Nghiêm cấm tuyệt đối hàng giả, hàng nhái, hàng vi phạm sở hữu trí tuệ:</strong> Nếu vi phạm, gian hàng sẽ bị phạt 200% giá trị lô hàng, đóng băng ví shop và chuyển hồ sơ sang cơ quan quản lý thị trường.</li>
                </ul>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>3. Chính Sách 0% Phí Sàn Tháng Đầu & Phí Minh Bạch</h5>
                <p>
                  Tân chủ shop được hưởng trọn vẹn <strong>0% phí cố định sàn</strong> trong 30 ngày đầu tiên kinh doanh. Sau thời gian ưu đãi, mức phí chiết khấu hoa hồng tiêu chuẩn là 5% trên mỗi đơn hàng thành công, không phát sinh bất kỳ khoản phụ phí ẩn nào.
                </p>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>4. Thời Gian Xử Lý Đơn & Bàn Giao Vận Chuyển</h5>
                <p>
                  Người bán có nghĩa vụ xác nhận và bàn giao kiện hàng cho đối tác vận chuyển (SPX Express, GHN, Viettel Post) trong vòng tối đa 24 giờ kể từ khi đơn hàng phát sinh. Tỷ lệ hủy đơn do hết hàng không được vượt quá 3%.
                </p>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>5. Ví Doanh Thu & Rút Tiền Siêu Tốc 24/7</h5>
                <p>
                  Doanh thu bán hàng được tự động cộng vào Ví Shop ngay khi người mua nhận hàng thành công. Chủ gian hàng có quyền gửi lệnh rút tiền 24/7 về bất kỳ tài khoản ngân hàng nào tại Việt Nam mà không bị giới hạn số lần.
                </p>
              </div>
            ) : (
              <div>
                <div style={{ background: 'rgba(99, 102, 241, 0.08)', padding: '10px 14px', borderRadius: '10px', marginBottom: '14px', borderLeft: '4px solid #6366f1' }}>
                  <strong style={{ color: '#4338ca', display: 'block', fontSize: '13.5px' }}>
                    CHÍNH SÁCH BẢO MẬT & DỮ LIỆU GIAN HÀNG (SELLER PRIVACY & SECURITY)
                  </strong>
                  <span style={{ fontSize: '12px', color: '#475569' }}>
                    Bảo vệ dữ liệu khách hàng, mã hóa khóa API và nhật ký kiểm toán giao dịch (Audit Log).
                  </span>
                </div>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>1. Cam Kết Bảo Vệ Dữ Liệu Khách Mua Hàng</h5>
                <p>
                  Chủ shop chỉ được sử dụng thông tin của người mua (tên, số điện thoại, địa chỉ) cho mục đích in vận đơn và giao hàng. Nghiêm cấm mọi hành vi sao chép, thu thập hay liên hệ khách hàng ngoài nền tảng sàn nhằm mục đích bán hàng trực tiếp hoặc tiếp thị riêng.
                </p>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>2. Khóa API & Nhật Ký Kiểm Toán (Audit Logging)</h5>
                <ul>
                  <li>Mọi thông tin định danh và tài khoản ngân hàng rút tiền của shop đều được mã hóa theo tiêu chuẩn an ninh thanh toán PCI-DSS.</li>
                  <li>Hệ thống tự động ghi nhật ký kiểm toán (Audit Log) đối với các hành vi điều chỉnh giá, thay đổi tồn kho đột biến, hoặc sửa đổi số tài khoản nhận tiền nhằm ngăn chặn hoàn toàn rủi ro bị chiếm đoạt tài khoản shop.</li>
                </ul>

                <h5 style={{ color: '#1e293b', margin: '12px 0 4px', fontSize: '13.5px' }}>3. Trách Nhiệm Bảo Mật Tài Khoản Chủ Shop</h5>
                <p>
                  Chủ shop có trách nhiệm kích hoạt bảo mật 2 bước (2FA OTP) khi thực hiện các tác vụ nhạy cảm như đổi mật khẩu hoặc rút tiền ví shop trên 50.000.000đ.
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {activeRole === 'seller' ? 'Áp dụng cho Đối tác Gian hàng' : 'Áp dụng cho Người Mua Hàng'} • Phiên bản 2026.1
          </span>
          <button
            type="button"
            className="shopee-btn shopee-btn-primary"
            onClick={onClose}
            style={{
              padding: '7px 20px',
              fontSize: '13px',
              fontWeight: 700,
              borderRadius: '8px',
              background: '#2563eb',
              color: '#ffffff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            Đã Hiểu & Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
