# 🤝 HƯỚNG DẪN ĐÓNG GÓP PHÁT TRIỂN (CONTRIBUTING GUIDELINES)

Cảm ơn bạn đã quan tâm đến dự án **Mini Shopee - Multi-Vendor E-Commerce Platform**! Chúng tôi hoan nghênh mọi đóng góp từ cộng đồng nhà phát triển để hoàn thiện sản phẩm theo chuẩn **Website Max Level**.

---

## 🛠️ 1. QUY TRÌNH PHÁT TRIỂN (WORKFLOW)

1. **Fork Repository:** Nhấn nút `Fork` ở góc trên bên phải trang GitHub.
2. **Clone về máy cá nhân:**
   ```bash
   git clone https://github.com/<your-username>/Fullstack-Ecommerce.git
   cd Fullstack-Ecommerce
   ```
3. **Tạo nhánh tính năng mới (Feature Branch):**
   ```bash
   git checkout -b feat/ten-tinh-nang-moi
   # hoặc
   git checkout -b fix/ten-loi-can-sua
   ```
4. **Cài đặt thư viện & chạy thử:**
   ```bash
   # Cài đặt toàn bộ dependencies
   npm run install:all

   # Khởi chạy server & client
   npm run dev:server
   npm run dev:client
   ```

---

## 📝 2. QUY CHUẨN ĐẶT TÊN COMMIT (CONVENTIONAL COMMITS)

Mọi commit đẩy lên repository cần tuân thủ theo định dạng chuẩn:

```
<type>(<scope>): <mô tả ngắn gọn về thay đổi bằng tiếng Anh hoặc tiếng Việt>
```

### Các loại `type` hợp lệ:
* `feat`: Thêm tính năng mới (ví dụ: `feat(order): Add real-time order tracking with WebSockets`)
* `fix`: Sửa lỗi (ví dụ: `fix(cart): Fix total price calculation when multiple vouchers applied`)
* `docs`: Cập nhật tài liệu (ví dụ: `docs(api): Add request/response spec for seller endpoints`)
* `refactor`: Tái cấu trúc mã nguồn mà không làm thay đổi tính năng
* `test`: Thêm hoặc chỉnh sửa các bộ kiểm thử
* `chore`: Các công việc phụ trợ (cập nhật build scripts, package.json, gitignore)
* `ci`: Chỉnh sửa cấu hình CI/CD (`.github/workflows`)

---

## 🧪 3. KIỂM THỬ TRƯỚC KHI MỞ PULL REQUEST

Trước khi gửi Pull Request, hãy đảm bảo tất cả các bài kiểm thử và build frontend đều vượt qua thành công:

```bash
# 1. Kiểm tra build Frontend không có lỗi
npm run build

# 2. Chạy toàn bộ 450 tests tự động
npm test
```

---

## 🚀 4. GỬI PULL REQUEST (PR)

1. Đẩy nhánh của bạn lên GitHub:
   ```bash
   git push origin feat/ten-tinh-nang-moi
   ```
2. Truy cập repository chính trên GitHub và nhấn **Compare & pull request**.
3. Điền đầy đủ thông tin theo mẫu **Pull Request Template** được cung cấp.
4. Đội ngũ kiểm duyệt sẽ xem xét, phản hồi và merge mã nguồn của bạn.
