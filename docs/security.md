# 🔒 CHÍNH SÁCH BẢO MẬT & AN TOÀN THÔNG TIN (SECURITY POLICY & OWASP STANDARDS)

> **Dự án:** Mini Shopee Multi-Vendor Platform  
> **Tiêu chuẩn áp dụng:** OWASP Top 10 Web Application Security, Principle of Least Privilege (PoLP), Multi-Tenant Guard.

---

## 🛡️ 1. CÁC TẦNG BẢO VỆ CHÍNH (DEFENSE-IN-DEPTH)

```
[Người dùng truy cập]
         │
         ▼
┌──────────────────────────────────────────────┐
│ 1. Tầng Mạng & HTTP: CORS, Helmet, HTTPS     │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ 2. Tầng Xác Thực: JWT Bearer Token & bcrypt  │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ 3. Tầng Phân Quyền: RBAC & Tenant Isolation  │
└──────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────┐
│ 4. Tầng Dữ Liệu: Input Validation & Sanitizer│
└──────────────────────────────────────────────┘
```

---

## 🔑 2. CƠ CHẾ XÁC THỰC & MÃ HÓA (AUTHENTICATION & CRYPTO)

1. **Mã Hóa Mật Khẩu (Password Hashing):**
   - Tuyệt đối không lưu mật khẩu ở dạng plain-text.
   - Sử dụng thư viện `bcryptjs` với salt rounds chuẩn (`10 rounds`), bảo vệ tài khoản người dùng trước các cuộc tấn công Rainbow Table hoặc Brute-force.

2. **Cấp Phát & Xác Thực Token (JWT - JSON Web Token):**
   - Sau khi đăng nhập hợp lệ, máy chủ ký một token JWT sử dụng thuật toán HMAC-SHA256 với khóa bí mật `JWT_SECRET`.
   - Payload chứa thông tin định danh tối thiểu: `{ id, role, shopId }`, không chứa thông tin nhạy cảm.
   - Thời hạn hiệu lực (TTL) có thể cấu hình (ví dụ: 7 ngày hoặc 24 giờ).

3. **Xác Thực Tùy Chọn Cho Khách Vãng Lai (Optional Authentication):**
   - Middleware `optionalAuthenticate` cho phép người dùng chưa đăng nhập vẫn có thể duyệt sản phẩm, xem đánh giá và đặt hàng dạng Khách vãng lai (Guest Checkout) mà không bị từ chối kết nối 401.

---

## 🏢 3. BẢO VỆ CÔ LẬP GIAN HÀNG (TENANT ISOLATION & ANTI-SPOOFING)

Trong một hệ thống TMĐT đa người bán (Multi-Vendor), rủi ro lớn nhất là **Shop A can thiệp hoặc xem trộm dữ liệu của Shop B**:

- **Server-Side Enforcement:**
  - Khi chủ shop gửi yêu cầu tạo sản phẩm mới (`POST /api/seller/products`), máy chủ **tuyệt đối không tin tưởng `shopId` do client gửi lên**.
  - `shopId` luôn được trích xuất an toàn từ `req.user.shopId` đã được ký trong JWT token.
- **Guard Kiểm Tra Quyền Sở Hữu:**
  - Khi cập nhật trạng thái đơn hàng (`PATCH /api/seller/orders/:id/status`), server kiểm tra xem đơn hàng đó có thực sự chứa ít nhất 1 sản phẩm của shop hay không. Nếu không, server lập tức trả mã lỗi `403 Forbidden`.

---

## 🚫 4. PHÒNG CHỐNG CÁC LỖ HỔNG PHỔ BIẾN (OWASP TOP 10)

| Lỗ hổng OWASP | Biện pháp phòng chống trong Mini Shopee |
|---|---|
| **A01: Broken Access Control** | Middleware `authorize('admin', 'seller')` bảo vệ nghiêm ngặt các route nhạy cảm. Kiểm tra quyền sở hữu cấp độ từng bản ghi. |
| **A02: Cryptographic Failures** | Mã hóa 100% mật khẩu bằng bcrypt. Sử dụng HTTPS/SSL khi triển khai production. |
| **A03: Injection (SQL / NoSQL)** | Sử dụng Mongoose Schema định kiểu chặt chẽ, loại bỏ các ký tự điều khiển trong chuỗi tìm kiếm regex. |
| **A04: Insecure Design** | Phân tách rõ ràng giữa frontend state và backend validation. Giá tiền, khuyến mãi voucher và tồn kho luôn được server tính toán lại độc lập. |
| **A05: Security Misconfiguration** | Cấu hình CORS chặt chẽ với danh sách origin cho phép (`CLIENT_URL`), tắt thông tin hiển thị lỗi nhạy cảm trên production. |
| **A07: Identification and Authentication Failures** | Khóa đăng nhập nếu tài khoản bị Admin gắn cờ vi phạm (`status === 'banned'`). |
