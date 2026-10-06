import React from 'react';
import { StoreIcon, ShieldIcon, ReceiptIcon, LockIcon, CloseIcon, CheckIcon } from './OrdersIcons';

/**
 * Enterprise Legal & Privacy Policy Modal
 * Displays dedicated, separate policy content based directly on the clicked link (Customer vs Seller, Terms vs Privacy)
 * Eliminates confusing mixed multi-tab controls inside the modal.
 * Author: Kiệt Trương <truonggiakiet110806@gmail.com>
 */
export default function LegalModal({
  isOpen,
  onClose,
  initialTab = 'terms',
  role = 'customer',
  onAgree
}) {
  if (!isOpen) return null;

  const isSeller = role === 'seller';
  const isTerms = initialTab === 'terms';

  // Modal configuration depending specifically on what link was clicked
  const getModalMeta = () => {
    if (isSeller) {
      if (isTerms) {
        return {
          icon: <StoreIcon size={20} color="#ffffff" />,
          gradient: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
          shadow: 'rgba(234, 88, 12, 0.35)',
          title: 'Điều Khoản Dịch Vụ Đối Tác Gian Hàng (Seller Terms)',
          subtitle: 'Quy chuẩn thương mại, đăng bán sản phẩm và quy trình phê duyệt gian hàng',
          badgeText: 'Dành Riêng Cho Người Bán / Chủ Shop',
          badgeBg: 'rgba(245, 158, 11, 0.1)',
          badgeColor: '#b45309',
          borderColor: '#f59e0b'
        };
      }
      return {
        icon: <ShieldIcon size={20} color="#ffffff" />,
        gradient: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
        shadow: 'rgba(99, 102, 241, 0.35)',
        title: 'Chính Sách Bảo Mật & An Ninh Dữ Liệu Gian Hàng',
        subtitle: 'Quy chuẩn bảo vệ dữ liệu khách hàng, mã hóa API và bảo vệ ví doanh thu',
        badgeText: 'An Ninh & Bảo Mật Shop',
        badgeBg: 'rgba(99, 102, 241, 0.1)',
        badgeColor: '#4338ca',
        borderColor: '#6366f1'
      };
    }

    // Customer
    if (isTerms) {
      return {
        icon: <ReceiptIcon size={20} color="#ffffff" />,
        gradient: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
        shadow: 'rgba(37, 99, 235, 0.35)',
        title: 'Điều Khoản Dịch Vụ Khách Hàng (Customer Terms)',
        subtitle: 'Quy chế giao dịch, chính sách bảo vệ người mua và cam kết hàng chính hãng',
        badgeText: 'Dành Riêng Cho Khách Mua Hàng',
        badgeBg: 'rgba(59, 130, 246, 0.1)',
        badgeColor: '#1d4ed8',
        borderColor: '#3b82f6'
      };
    }
    return {
      icon: <LockIcon size={20} color="#ffffff" />,
      gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      shadow: 'rgba(16, 185, 129, 0.35)',
      title: 'Chính Sách Bảo Mật Dữ Liệu Khách Hàng (Privacy Policy)',
      subtitle: 'Tuân thủ Nghị định 13/2023/NĐ-CP • Bảo mật thông tin cá nhân và thanh toán',
      badgeText: 'Bảo Vệ Quyền Riêng Tư',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      badgeColor: '#047857',
      borderColor: '#10b981'
    };
  };

  const meta = getModalMeta();

  const handleAgreeAndClose = () => {
    if (typeof onAgree === 'function') {
      onAgree();
    }
    onClose();
  };

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: meta.gradient,
                boxShadow: `0 4px 12px ${meta.shadow}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {meta.icon}
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: '17.5px', fontWeight: 800, color: 'var(--text-primary, #0f172a)' }}>
                {meta.title}
              </h3>
              <span style={{ fontSize: '12px', color: '#64748b' }}>
                {meta.subtitle}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'rgba(239, 68, 68, 0.08)',
              border: '1px solid rgba(239, 68, 68, 0.2)',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s ease',
            }}
            aria-label="Đóng"
          >
            <span style={{ width: '20px', height: '20px', borderRadius: '4px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
              <CloseIcon size={12} color="#ef4444" />
            </span>
          </button>
        </div>

        {/* Category Badge Banner */}
        <div
          style={{
            background: meta.badgeBg,
            borderLeft: `4px solid ${meta.borderColor}`,
            padding: '8px 14px',
            borderRadius: '8px',
            marginBottom: '14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span style={{ fontSize: '12.5px', fontWeight: 700, color: meta.badgeColor, display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
            <span>{meta.badgeText}</span>
          </span>
          <span style={{ fontSize: '11.5px', color: '#64748b' }}>
            Sàn Fullstack E-Commerce • Quy chế 2026
          </span>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ overflowY: 'auto', flex: 1, paddingRight: '8px', fontSize: '13px', color: '#334155', lineHeight: '1.65' }}>
          {isSeller ? (
            /* =================== SELLER ONLY CONTENT =================== */
            isTerms ? (
              <div>
                <h5 style={{ color: '#1e293b', margin: '10px 0 4px', fontSize: '13.5px' }}>1. Quy Trình Phê Duyệt Hồ Sơ Gian Hàng Bởi Admin</h5>
                <p>
                  Sau khi hoàn tất đăng ký tài khoản Người Bán, hồ sơ shop của bạn sẽ được chuyển sang trạng thái <strong>Chờ Quản Trị Viên (Admin) Phê Duyệt</strong> trong vòng 24 giờ. Admin sẽ kiểm tra tên gian hàng, danh mục sản phẩm và thông tin liên hệ trước khi kích hoạt quyền đăng bán và mở cổng ví shop.
                </p>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>2. Tiêu Chuẩn Hàng Hóa & Nghiêm Cấm Hàng Giả</h5>
                <ul>
                  <li>Cam kết 100% sản phẩm có nguồn gốc xuất xứ rõ ràng, có hóa đơn chứng từ hợp lệ theo quy định pháp luật.</li>
                  <li><strong>Nghiêm cấm tuyệt đối hàng giả, hàng nhái, hàng vi phạm sở hữu trí tuệ:</strong> Nếu vi phạm, gian hàng sẽ bị phạt 200% giá trị lô hàng, đóng băng ví shop và chuyển hồ sơ sang cơ quan quản lý thị trường.</li>
                </ul>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>3. Chính Sách 0% Phí Sàn Tháng Đầu & Phí Minh Bạch</h5>
                <p>
                  Tân chủ shop được hưởng trọn vẹn <strong>0% phí cố định sàn</strong> trong 30 ngày đầu tiên kinh doanh. Sau thời gian ưu đãi, mức phí chiết khấu hoa hồng tiêu chuẩn là 5% trên mỗi đơn hàng thành công, không phát sinh bất kỳ khoản phụ phí ẩn nào.
                </p>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>4. Thời Gian Xử Lý Đơn & Bàn Giao Vận Chuyển</h5>
                <p>
                  Người bán có nghĩa vụ xác nhận và bàn giao kiện hàng cho đối tác vận chuyển (SPX Express, GHN, Viettel Post) trong vòng tối đa 24 giờ kể từ khi đơn hàng phát sinh. Tỷ lệ hủy đơn do hết hàng không được vượt quá 3%.
                </p>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>5. Ví Doanh Thu & Rút Tiền Siêu Tốc 24/7</h5>
                <p>
                  Doanh thu bán hàng được tự động cộng vào Ví Shop ngay khi người mua nhận hàng thành công. Chủ gian hàng có quyền gửi lệnh rút tiền 24/7 về bất kỳ tài khoản ngân hàng nào tại Việt Nam mà không bị giới hạn số lần.
                </p>
              </div>
            ) : (
              <div>
                <h5 style={{ color: '#1e293b', margin: '10px 0 4px', fontSize: '13.5px' }}>1. Cam Kết Bảo Vệ Dữ Liệu Khách Mua Hàng</h5>
                <p>
                  Chủ shop chỉ được sử dụng thông tin của người mua (tên, số điện thoại, địa chỉ) cho mục đích in vận đơn và giao hàng. Nghiêm cấm mọi hành vi sao chép, thu thập hay liên hệ khách hàng ngoài nền tảng sàn nhằm mục đích bán hàng trực tiếp hoặc tiếp thị riêng.
                </p>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>2. Khóa API & Nhật Ký Kiểm Toán (Audit Logging)</h5>
                <ul>
                  <li>Mọi thông tin định danh và tài khoản ngân hàng rút tiền của shop đều được mã hóa theo tiêu chuẩn an ninh thanh toán PCI-DSS.</li>
                  <li>Hệ thống tự động ghi nhật ký kiểm toán (Audit Log) đối với các hành vi điều chỉnh giá, thay đổi tồn kho đột biến, hoặc sửa đổi số tài khoản nhận tiền nhằm ngăn chặn hoàn toàn rủi ro bị chiếm đoạt tài khoản shop.</li>
                </ul>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>3. Trách Nhiệm Bảo Mật Tài Khoản Chủ Shop</h5>
                <p>
                  Chủ shop có trách nhiệm kích hoạt bảo mật 2 bước (2FA OTP) khi thực hiện các tác vụ nhạy cảm như đổi mật khẩu hoặc rút tiền ví shop trên 50.000.000đ.
                </p>
              </div>
            )
          ) : (
            /* =================== CUSTOMER ONLY CONTENT =================== */
            isTerms ? (
              <div>
                <h5 style={{ color: '#1e293b', margin: '10px 0 4px', fontSize: '13.5px' }}>1. Quyền Lợi & Bảo Vệ Người Mua (Buyer Protection)</h5>
                <p>
                  Mọi đơn hàng trên sàn đều được áp dụng cơ chế <strong>Ký Quỹ Trung Gian (Escrow)</strong>: Tiền thanh toán của bạn sẽ được hệ thống giữ an toàn và chỉ thanh toán cho người bán sau khi bạn đã nhận hàng nguyên vẹn và xác nhận hài lòng.
                </p>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>2. Cam Kết Hàng Chính Hãng & Đổi Trả 30 Ngày</h5>
                <ul>
                  <li>Cam kết 100% hàng chính hãng: Đền bù gấp đôi (200%) giá trị đơn hàng nếu phát hiện hàng giả, hàng nhái.</li>
                  <li>Đổi trả miễn phí trong vòng 30 ngày kể từ lúc nhận hàng: Shipper của sàn (SPX Express) đến tận nơi thu hồi hoàn toàn miễn phí.</li>
                  <li>Hoàn tiền tức thì về Ví Tiền Sàn hoặc tài khoản ngân hàng trong vòng 2-5 phút sau khi đơn đổi trả được tiếp nhận.</li>
                </ul>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>3. Tích Lũy Mini Xu & Sử Dụng Voucher Kép</h5>
                <p>
                  Người mua được cộng 1.000 Xu tân thủ khi đăng ký tài khoản và tích lũy tối đa 50.000 Xu mỗi ngày khi hoàn tất đơn hàng. Mini Xu có thể trừ trực tiếp 50% tổng giá trị thanh toán. Cho phép áp dụng cộng dồn đồng thời Voucher Giảm Giá Sàn và Voucher Freeship Xtra.
                </p>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>4. Trách Nhiệm Của Khách Hàng</h5>
                <p>
                  Người mua có nghĩa vụ cung cấp số điện thoại chính xác (định dạng 10 số di động Việt Nam) và địa chỉ nhận hàng cụ thể. Tuyệt đối không thực hiện các hành vi gian lận mã giảm giá, đặt đơn hàng ảo hoặc lạm dụng chính sách trả hàng.
                </p>
              </div>
            ) : (
              <div>
                <h5 style={{ color: '#1e293b', margin: '10px 0 4px', fontSize: '13.5px' }}>1. Dữ Liệu Được Thu Thập</h5>
                <p>
                  Chúng tôi chỉ thu thập các dữ liệu cần thiết phục vụ mua sắm và giao nhận: Họ và tên, email, số điện thoại, địa chỉ nhận hàng và lịch sử giao dịch. Chúng tôi tuyệt đối không thu thập các dữ liệu cá nhân nhạy cảm ngoài phạm vi mua sắm.
                </p>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>2. Chuẩn Mã Hóa Bảo Mật & Xác Thực 2 Bước (2FA)</h5>
                <ul>
                  <li>Mật khẩu được băm một chiều bằng chuẩn <strong>Argon2 / Bcrypt</strong> kết hợp chuỗi muối ngẫu nhiên (salt).</li>
                  <li>Giao thức mã hóa SSL/TLS 256-Bit toàn trình cho mọi giao dịch thanh toán trực tuyến.</li>
                  <li>Bảo vệ tài khoản qua mã xác thực ngẫu nhiên 6 chữ số gửi trực tiếp về email định danh.</li>
                </ul>

                <h5 style={{ color: '#1e293b', margin: '14px 0 4px', fontSize: '13.5px' }}>3. Cam Kết Tuyệt Đối Về Dữ Liệu</h5>
                <p>
                  Sàn cam kết <strong>không mua bán, cho thuê hay chia sẻ dữ liệu người mua</strong> cho bất kỳ đối tác quảng cáo nào. Dữ liệu địa chỉ và số điện thoại chỉ được cung cấp cho đơn vị vận chuyển (SPX Express, GHN) để phục vụ duy nhất mục đích giao hàng tận tay.
                </p>
              </div>
            )
          )}
        </div>

        {/* Footer */}
        <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: '#64748b' }}>
            {isSeller ? 'Áp dụng cho Đối tác Gian hàng' : 'Áp dụng cho Người Mua Hàng'} • Phiên bản 2026.1
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '7px 16px',
                fontSize: '12.5px',
                fontWeight: 600,
                borderRadius: '8px',
                background: '#f1f5f9',
                color: '#475569',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloseIcon size={11} color="#ef4444" />
              </span>
              <span>Đóng</span>
            </button>
            <button
              type="button"
              className="shopee-btn shopee-btn-primary"
              onClick={handleAgreeAndClose}
              style={{
                padding: '7px 20px',
                fontSize: '13px',
                fontWeight: 700,
                borderRadius: '8px',
                background: isSeller ? '#f59e0b' : '#2563eb',
                color: '#ffffff',
                border: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <span style={{ width: '18px', height: '18px', borderRadius: '50%', background: 'rgba(255,255,255,0.22)', border: '1px solid rgba(255,255,255,0.35)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                <CheckIcon size={12} color="#ffffff" />
              </span>
              <span>Tôi Đã Đọc & Đồng Ý</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
