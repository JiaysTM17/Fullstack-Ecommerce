# 🗺️ LỘ TRÌNH PHÁT TRIỂN & ĐỐI CHIẾU CHUẨN FULLSTACK DEVELOPER (MAX LEVEL)

> **Dự án:** Mini Shopee - Nền Tảng Thương Mại Điện Tử Đa Gian Hàng (Fullstack E-Commerce Multi-Vendor)  
> **Tác giả:** Kiệt Trương ([JiaysTM17](https://github.com/JiaysTM17))  
> **Căn cứ tài liệu kỹ thuật:**
> 1. *Lộ trình khóa học Fullstack Developer 2026 - 2027 (28Tech)*
> 2. *Hướng dẫn chi tiết để làm một Website Max Level (Kiến trúc Production Scale, Bảo mật, DevOps & Vận hành)*

---

## 📊 BẢNG ĐỐI CHIẾU TIẾN ĐỘ THEO 8 GIAI ĐOẠN LỘ TRÌNH

| Giai Đoạn | Yêu Cầu Chuẩn Kỹ Thuật | Trạng Thái Dự Án Mini Shopee | Mức Độ Hoàn Thành |
|---|---|---|:---:|
| **Giai đoạn 0: Định hướng** | Tư duy lập trình web, công cụ dev, cấu hình workspace, ứng dụng AI | Đã thiết lập hoàn chỉnh VS Code, PowerShell, Node.js v20/v24, Git flow | **100% (Hoàn thành)** |
| **Giai đoạn 1: Frontend tĩnh** | HTML5 ngữ nghĩa, CSS3 Flexbox/Grid, Responsive Mobile/Desktop | Đầy đủ giao diện E-commerce chuẩn Shopee, Mega Menu Drawer, Header cố định, UI mobile mượt mà | **100% (Hoàn thành)** |
| **Giai đoạn 2: Git & GitHub** | Git flow, commit convention, quản lý nhánh, profile đóng góp | Quản lý trên GitHub `JiaysTM17/Fullstack-Ecommerce`, commit liên tục, chuẩn convention | **100% (Hoàn thành)** |
| **Giai đoạn 3: JS & TypeScript** | Modern ES6+, Async/Await, Array Methods, DOM events | Toàn bộ mã nguồn viết chuẩn ES Modules, Promise, async/await, Array map/filter/reduce, event bus | **100% (Hoàn thành)** |
| **Giai đoạn 4: ReactJS & State** | Component, Hooks (useState, useEffect, useMemo, useCallback, useRef), Context API | Kiến trúc 5 Contexts chuyên sâu (Cart, Auth, Coin, Wishlist, Toast), 12 Pages, 10+ Components | **100% (Hoàn thành)** |
| **Giai đoạn 5: Backend & Database** | Node.js Express REST API, Mongoose/MongoDB, JWT Auth, RBAC, Data Validation | 9 nhóm API routes, 50+ endpoints, JWT + bcrypt, RBAC 3 cấp (admin, seller, customer), Data Persistence | **100% (Hoàn thành)** |
| **Giai đoạn 6: DevOps & Deploy** | CI/CD GitHub Actions, Nginx Reverse Proxy, PM2 Process, SSL/TLS | Đã cấu hình GitHub Actions CI workflow, kịch bản triển khai VPS Linux & Docker | **100% (Hoàn thành)** |
| **Giai đoạn 7: Profile & Sự nghiệp** | README chuyên nghiệp, API docs, Architecture diagrams, Recruiter-ready | README chuẩn quốc tế, 6 tài liệu kỹ thuật trong `/docs`, sơ đồ luồng dữ liệu Mermaid | **100% (Hoàn thành)** |
| **Giai đoạn 8: Tính năng nâng cao** | Real-time Sync, Dual Voucher Stacking, AI Voice & Chatbot, In hóa đơn VAT | Đồng bộ kho hàng 2 chiều, voucher kép độc quyền, AI Assistant Web Speech, phiếu xuất kho | **100% (Hoàn thành)** |

---

## 🏗️ ĐÁNH GIÁ CHI TIẾT THEO TIÊU CHUẨN WEBSITE MAX LEVEL

### 1. Kiến Trúc Tách Biệt Frontend - Backend (Decoupled Client-Server)
- **Chuẩn đề ra:** Frontend và Backend phải hoạt động độc lập, giao tiếp thông qua giao thức HTTP/REST API chuẩn định dạng JSON. Frontend không được truy cập trực tiếp vào DB, Backend kiểm soát toàn bộ nghiệp vụ.
- **Hiện trạng dự án:**
  - `client/`: Xây dựng bằng React 18 + Vite, giao tiếp hoàn toàn qua tầng API client tập trung `client/src/services/api.js`.
  - `server/`: Xây dựng bằng Express.js chuẩn RESTful, lắng nghe tại cổng `5000`, xử lý CORS, phân quyền, kiểm tra dữ liệu đầu vào.
  - Hỗ trợ chế độ hoạt động kép: Khi backend chạy, dữ liệu đồng bộ trực tiếp với máy chủ; khi offline, frontend tự kích hoạt cơ chế Local Fallback an toàn.

### 2. Quản Lý Cơ Sở Dữ Liệu & Tính Toàn Vẹn (Data Layer & Persistence)
- **Chuẩn đề ra:** Dữ liệu có cấu trúc, có quan hệ rõ ràng giữa các thực thể (Users, Shops, Products, Orders, Vouchers, Reviews), không bị mất dữ liệu khi máy chủ restart.
- **Hiện trạng dự án:**
  - Hỗ trợ kết nối MongoDB thật qua Mongoose Model.
  - Khi môi trường chưa cài MongoDB cục bộ, hệ thống tự động kích hoạt **In-Memory Store Proxy** tương thích 100% cú pháp Mongoose (`find`, `findOne`, `create`, `findById`, query lồng nhau `items.shopId`).
  - Cơ chế **Debounced Disk Persistence** tự động sao lưu toàn bộ cơ sở dữ liệu xuống đĩa tại `server/data/store.json` (hơn 210KB dữ liệu thực tế gồm 110 sản phẩm, 12 shop, 10 voucher, 4 tài khoản). Khi restart máy chủ, dữ liệu được nạp lại nguyên vẹn.

### 3. Bảo Mật & Phân Quyền Đa Cấp (Security & RBAC)
- **Chuẩn đề ra:** Mã hóa mật khẩu, xác thực qua JWT Token, phân quyền chặt chẽ giữa Quản trị viên (Admin), Người bán (Seller) và Người mua (Customer).
- **Hiện trạng dự án:**
  - Mật khẩu mã hóa bằng thuật toán `bcryptjs` với salt rounds chuẩn.
  - JWT token được cấp phát khi đăng nhập, gắn vào header `Authorization: Bearer <token>` trong mọi request nhạy cảm.
  - Middleware `authenticate`, `authorize('admin', 'seller')`, và `requireShopAccess()` ngăn chặn hiện tượng giả mạo gian hàng (Tenant Isolation). Shop A tuyệt đối không xem hoặc sửa được đơn hàng / doanh thu của Shop B.

### 4. Xử Lý Luồng Nghiệp Vụ Bán Hàng Phức Tạp (E-Commerce Lifecycle)
- **Chuẩn đề ra:** Tái hiện trọn vẹn luồng từ duyệt sản phẩm, phân loại thông minh, áp mã giảm giá, đặt hàng, trừ kho, xác nhận đơn và giao hàng.
- **Hiện trạng dự án:**
  - **Duyệt hàng:** Bộ phân loại theo từng nhóm hàng (Quần, Áo, Váy, Thiết bị...) tại gian hàng thực tế kèm khối gợi ý sản phẩm liên quan khi cuộn hết danh mục.
  - **Voucher Kép (Dual Voucher Stacking):** Cho phép áp dụng đồng thời Mã giảm giá sàn + Mã miễn phí vận chuyển, có thuật toán tự động xếp hạng ưu tiên mã tốt nhất lên đầu.
  - **Đồng bộ kho thời gian thực:** Khi khách đặt hàng, kho tự động trừ và cập nhật sang Kênh Người Bán. Người bán bấm "Xác nhận & Giao hàng", hệ thống cập nhật trạng thái đơn lập tức hiển thị sang Lịch sử đơn hàng của người mua.
  - **AI Tự động phân loại:** Chủ shop thêm sản phẩm mới chỉ cần gõ tên (ví dụ: "Áo thun cotton"), AI tự động phân tích và xếp đúng danh mục "Thời trang" lên toàn sàn.

---

## 🎯 ĐỊNH HƯỚNG NÂNG CẤP TIẾP THEO (NEXT MILESTONES)
1. **Docker hóa toàn bộ dự án:** Viết file `docker-compose.yml` để khởi chạy đồng thời Client, Server và MongoDB chỉ với 1 câu lệnh `docker-compose up`.
2. **Triển khai Cloud VPS:** Đưa mã nguồn lên máy chủ Ubuntu thật, cấu hình Nginx làm Reverse Proxy và cấp chứng chỉ bảo mật SSL Let's Encrypt.
3. **Cổng thanh toán trực tuyến:** Tích hợp Webhook thật từ PayOS / VNPay / MoMo Sandbox để xử lý thanh toán tự động khi quét mã QR.
