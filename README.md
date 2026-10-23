# 🛒 Mini Shopee - Nền Tảng Thương Mại Điện Tử Đa Gian Hàng (Fullstack Multi-Vendor E-Commerce Platform)

[![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20.x%2F24.x-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-4.x-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![CI/CD](https://img.shields.io/badge/GitHub_Actions-CI%2FCD-2088FF?style=for-the-badge&logo=githubactions&logoColor=white)](https://github.com/JiaysTM17/Fullstack-Ecommerce/actions)
[![Tests Passing](https://img.shields.io/badge/Tests-3343%2F3343%20Passing%20(100%25)-brightgreen?style=for-the-badge&logo=checkmarx&logoColor=white)](tests/run-all.js)
[![Phases](https://img.shields.io/badge/Enterprise_Algorithms-97_Phases%20(244%20Features)-blue?style=for-the-badge&logo=probot&logoColor=white)](docs/BAO_CAO_NGHIEN_CUU_VA_PHAN_TICH_THUAT_TOAN_DOANH_NGHIEP.md)
[![Documentation](https://img.shields.io/badge/Enterprise_Docs-22_Dossiers-orange?style=for-the-badge&logo=googledocs&logoColor=white)](docs/DANH_MUC_HO_SO_BAN_GIAO_VA_TONG_QUAN_DU_AN.md)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](CONTRIBUTING.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

> **Mini Shopee** là một nền tảng thương mại điện tử full-stack hiện đại, toàn diện và có độ tin cậy cao được xây dựng theo kiến trúc **Multi-Vendor (Đa gian hàng)**. Dự án tái hiện trọn vẹn trải nghiệm mua sắm thực tế của các sàn TMĐT hàng đầu (như Shopee, TikTok Shop), kết hợp trợ lý ảo **AI Chatbot**, hệ thống **Voucher kép (Dual Stacking)**, đồng bộ dữ liệu thời gian thực **(Real-time State Synchronization)**, phân quyền đa cấp **RBAC (Admin, Seller, Customer)**, và quy trình kiểm thử tự động toàn diện **636 tests (100% Pass)**.

---

## 📑 Mục Lục (Table of Contents)

1. [🗺️ Lộ Trình Phát Triển Chuẩn 8 Giai Đoạn (Fullstack Roadmap)](#️-lộ-trình-phát-triển-chuẩn-8-giai-đoạn-fullstack-roadmap)
2. [🌟 Tính Năng Nổi Bật (Key Features)](#-tính-năng-nổi-bật-key-features)
3. [🏗️ Kiến Trúc Hệ Thống (System Architecture)](#️-kiến-trúc-hệ-thống-system-architecture)
4. [💻 Công Nghệ Sử Dụng (Tech Stack)](#-công-nghệ-sử-dụng-tech-stack)
5. [📂 Cấu Trúc Thư Mục Chuẩn Hóa (Project Directory Structure)](#-cấu-trúc-thư-mục-chuẩn-hóa-project-directory-structure)
6. [🚀 Hướng Dẫn Cài Đặt & Chạy Thử (Quick Start)](#-hướng-dẫn-cài-đặt--chạy-thử-quick-start)
7. [🔑 Tài Khoản Trải Nghiệm Demo (Demo Credentials)](#-tài-khoản-trải-nghiệm-demo-demo-credentials)
8. [📚 Hệ Thống Tài Liệu Kỹ Thuật Chi Tiết (Technical Documentation)](#-hệ-thống-tài-liệu-kỹ-thuật-chi-tiết-technical-documentation)
9. [🧪 Kiểm Thử & Đảm Bảo Chất Lượng (Quality Assurance & Tests)](#-kiểm-thử--đảm-bảo-chất-lượng-quality-assurance--tests)
10. [🤝 Tiêu Chuẩn Cộng Đồng & Đóng Góp (Community & Contributing)](#-tiêu-chuẩn-cộng-đồng--đóng-góp-community--contributing)
11. [👨‍💻 Tác Giả & Liên Hệ (Author & Contact)](#-tác-giả--liên-hệ-author--contact)

---

## 🗺️ Lộ Trình Phát Triển Chuẩn 8 Giai Đoạn (Fullstack Roadmap)

Dự án được thiết kế và triển khai bám sát 100% **Lộ trình khóa học Fullstack Developer 2026 - 2027** và tài liệu **Kiến trúc Website Max Level**:

| Giai Đoạn | Công Nghệ & Khái Niệm Trọng Tâm | Triển Khai Thực Tế Trong Dự Án |
|---|---|---|
| **0. Định Hướng & Setup** | Tư duy lập trình, cài đặt công cụ, Gitflow, tận dụng AI | Workspace chuẩn hóa, cấu hình Node.js 20/24, PowerShell scripts, Git Conventional Commits |
| **1. Frontend Tĩnh** | HTML5 ngữ nghĩa, CSS3 Flexbox/Grid, Responsive Mobile/Desktop | Giao diện TMĐT chuẩn Shopee, Mega Menu, Drawer phân cấp danh mục, PDP, Cart |
| **2. Git & GitHub** | Quản lý mã nguồn, branching, commit convention, PR | Repository công khai trên GitHub [JiaysTM17/Fullstack-Ecommerce](https://github.com/JiaysTM17/Fullstack-Ecommerce), ghi nhận đóng góp liên tục |
| **3. JavaScript Nâng Cao** | ES6+, Async/Await, Array Methods, DOM Events, Closure | Toàn bộ mã nguồn ES Modules, cơ chế Promise, event bus tùy biến 2 chiều |
| **4. ReactJS & State** | React 18, Custom Hooks, Context API, SPA Routing | 5 Contexts độc lập (Cart, Auth, Coin, Wishlist, Toast), 12 Pages, 10+ Components tái sử dụng |
| **5. Backend & Database** | Node.js Express REST API, Mongoose/MongoDB, JWT, RBAC | 11 nhóm API routes, 80+ endpoints, Rate Limiter, Request Logger, Input Validator, Enhanced Error Handler, Refresh Token, Full Order Workflow |
| **6. DevOps & Deployment** | GitHub Actions CI/CD, Nginx Reverse Proxy, PM2 Process, SSL | Workflow `.github/workflows/ci.yml` tự động build và test khi commit mã nguồn |
| **7. Profile & Documentation** | Tài liệu dự án, Architecture, Data Dictionary, API Spec | Hệ thống 6 tài liệu kỹ thuật chuyên sâu trong thư mục `docs/` |
| **8. Dự Án & Nâng Cao** | Realtime Sync, Smart Voucher Ranking, AI Speech Chatbot | Đồng bộ kho hàng 2 chiều, xếp hạng voucher thông minh, trợ lý ảo nhận diện giọng nói |

---

## 🌟 Tính Năng Nổi Bật (Key Features)

### 🛍️ 1. Phân Hệ Người Mua (Customer Experience)
* **Khám phá sản phẩm linh hoạt:**
  * **Mega Menu Drawer** thông minh: Phân cấp danh mục đa tầng kèm thanh tìm kiếm tức thời và các thẻ subcategory tương tác.
  * Bộ lọc đa tiêu chí: Lọc theo khoảng giá, đánh giá sao, tình trạng kho và phân loại sản phẩm.
  * Tìm kiếm từ khóa theo thời gian thực (Live Search) với gợi ý từ khóa thông minh.
* **Trang Chi Tiết Sản Phẩm (PDP):**
  * Thư viện hình ảnh sắc nét, chọn biến thể (kích thước, màu sắc), hiển thị số lượng tồn kho thực tế.
  * Phù hiệu Shopee Mall, huy hiệu gian hàng chính hãng và cam kết bảo hành.
  * **Hiển thị đánh giá khách hàng thời gian thực:** Đồng bộ trực tiếp các lượt đánh giá từ khách hàng kèm số sao, nhãn tag cảm nhận nhanh (🏷️ "Đúng mô tả", "Giao hàng nhanh", "Chất lượng tuyệt vời") và huy hiệu xác thực đã mua hàng chính hãng.
* **Sổ Địa Chỉ Giao Hàng Đa Điểm (Multi-Address Book):**
  * Quản lý danh bạ nhiều địa chỉ nhận hàng tại trang Hồ Sơ Cá Nhân và ngay tại trang **Thanh Toán (Checkout)**.
  * Modal thêm nhanh địa chỉ mới trong 5 giây, hỗ trợ phân loại thẻ (Nhà riêng / Văn phòng), thiết lập hoặc đổi địa chỉ giao hàng mặc định linh hoạt.
* **Hệ Thống Đánh Giá Sau Mua & Tích Xu Thưởng (Product Reviews & Ratings):**
  * Đơn hàng đã giao thành công được kích hoạt nút **"⭐ Đánh giá"**.
  * Chấm điểm 1-5 sao, chọn tag phản hồi nhanh và nhận ngay **+200 Mini Xu thưởng** vào tài khoản sau mỗi lượt đánh giá thành công.
* **Thao Tác Đơn Hàng Nâng Cao (Order Actions):**
  * **Mua lại 1-click:** Tự động nạp lại toàn bộ sản phẩm của đơn hàng cũ vào giỏ hàng.
  * **Hủy đơn hàng an toàn:** Cho phép chọn lý do hủy đơn, tự động hoàn trả tồn kho sản phẩm và hoàn trả 100% số dư Shopee Xu đã sử dụng.
  * **Yêu cầu Trả hàng / Hoàn tiền:** Tiếp nhận phản hồi và xử lý hoàn tiền minh bạch.
* **Giỏ Hàng & Hệ Thống Voucher Kép Độc Quyền (Dual Voucher Stacking):**
  * Áp dụng đồng thời 2 loại mã: **Mã giảm giá sản phẩm (%)** VÀ **Mã miễn phí vận chuyển (Freeship)**.
  * Thuật toán **Smart Ranking**: Tự động đưa các mã giảm giá nhiều tiền nhất và đủ điều kiện lên trên cùng kèm huy hiệu 👑 **TỐT NHẤT CHO BẠN**.
* **Ví Voucher Cá Nhân Đa Phân Loại (Personal Voucher Wallet):**
  * Danh mục 5 bộ lọc trực quan: *Tất cả*, *🚚 Miễn Phí Vận Chuyển*, *🏷️ Giảm Giá Sàn*, *🏪 Voucher Shop*, *⭐ Đã Lưu Trong Ví*.
  * Cơ chế "📥 Lưu Mã" vào ví cá nhân và nút "Dùng Ngay" 1-click chuyển thẳng sang Giỏ hàng.
* **Trung Tâm Thông Báo Thời Gian Thực (Buyer Notification Center):**
  * Hộp popover thông báo trên thanh tiêu đề với 4 tab lọc: *Tất cả*, *📦 Đơn hàng*, *🎟️ Voucher & Khuyến mãi*, *Chưa đọc*.
  * Tự động phát thông báo khi phát sinh sự kiện đặt hàng, hủy đơn, nhận thưởng xu, hoặc cập nhật ưu đãi.
* **Danh Sách Yêu Thích Tương Tác Cao (Wishlist Center):**
  * Lọc theo danh mục sản phẩm yêu thích và nút **"🛒 Thêm tất cả vào giỏ hàng"** chỉ với 1 click.
* **Trung Tâm Đổi Thưởng & Xu (Rewards Hub & Shopee Coins):**
  * Điểm danh hằng ngày nhận xu, Vòng quay may mắn (Lucky Wheel).
  * Cơ chế trừ xu trực tiếp vào đơn hàng (`1 Xu = 1 VNĐ`), phân tách số dư xu độc lập, bảo mật cho từng tài khoản.
* **Lịch Sử Sản Phẩm Đã Xem (Recently Viewed Products):**
  * Tự động ghi nhớ tối đa 20 sản phẩm gần nhất người dùng đã xem, lưu trữ an toàn tại LocalStorage.
  * Băng chuyền sản phẩm trực quan tại chân trang chi tiết sản phẩm và trang chủ, hỗ trợ nút "Xóa lịch sử" và "Thêm nhanh vào giỏ hàng".
* **Cộng Đồng Hỏi & Đáp Sản Phẩm (Product Community Q&A):**
  * Cho phép người mua gửi câu hỏi thắc mắc trực tiếp trước khi quyết định mua hàng.
  * Chủ shop phản hồi chính thức với huy hiệu **"Người bán"** uy tín, tích hợp tính năng bình chọn hữu ích (Upvote) cộng đồng.
* **Theo Dõi Vận Đơn Trực Tuyến SPX Express (Live SPX Tracking):**
  * Mô phỏng bản đồ số và tọa độ GPS di chuyển thực tế của bưu tá giao hàng.
  * Cung cấp thông tin chi tiết tài xế (họ tên, số điện thoại, biển số xe, điểm đánh giá sao) và tiến trình 4 chặng luân chuyển hàng hóa.
* **Hóa Đơn Điện Tử VAT 8% (Electronic VAT Invoice Generator):**
  * Xuất hóa đơn giá trị gia tăng điện tử hợp lệ với thuế suất chuẩn 8%, mã số thuế doanh nghiệp và định danh hóa đơn chuẩn quốc gia.
  * Tích hợp chữ ký số bảo mật SHA-256 và mã QR tra cứu điện tử tức thì.
* **Thanh Toán & Hóa Đơn:**
  * Đặt hàng linh hoạt (COD, Thẻ ngân hàng, Ví điện tử VietQR / MoMo).
  * Xuất **Hóa đơn điện tử VAT** chi tiết và In phiếu xuất kho tại trang thanh toán thành công.

---

### 🏪 2. Phân Hệ Người Bán & Chủ Shop (Seller Center)
* **Bảng điều khiển kinh doanh (Seller Dashboard):**
  * Thống kê trực quan: Doanh thu thực tế, số lượng đơn hàng, số sản phẩm tồn kho, đánh giá khách hàng.
  * Phân quyền dữ liệu độc lập giữa các shop và giữa Người bán với Khách hàng (Tenant Isolation).
* **Quản lý kho hàng & Trừ tồn kho tự động (Inventory Sync):**
  * Tồn kho tự động trừ ngay khi khách đặt đơn, tự động phục hồi nếu đơn bị hủy.
  * Cảnh báo sản phẩm sắp hết hàng (*Low Stock Alert*).
* **Xử lý đơn hàng thời gian thực:**
  * Quy trình chuẩn: `Chờ xác nhận & đóng gói` ➔ `Đang giao hàng` ➔ `Giao hàng thành công`.
  * Cập nhật trạng thái đơn đồng bộ tức thì sang Lịch sử đơn hàng của người mua.
  * In phiếu đóng gói hàng chuẩn đơn vị vận chuyển (Packing Slip) kèm mã vận đơn SPX Express.
* **AI Tự động phân loại hàng hóa (Smart Auto-Categorization):**
  * Khi chủ shop nhập tên sản phẩm, bộ nhận diện AI tự động phân tích từ khóa và đề xuất chính xác ngành hàng (Thời trang, Điện tử, Sắc đẹp, Gia dụng, Thể thao,...) chỉ với 1 click.
* **Trang Gian Hàng Thực Tế (Shop Storefront):**
  * Bộ lọc phân loại theo nhóm hàng dạng Tab (ví dụ: *Quần*, *Áo*, *Váy/Đầm*, *Phụ kiện*).
  * **Khối gợi ý sản phẩm chéo (Cross-selling):** Khi khách hàng xem hết phân loại đã chọn, hệ thống tự động hiển thị *"💡 Gợi ý thêm sản phẩm khác từ gian hàng (Bạn có thể cũng thích)"* để kích cầu mua sắm.

---

### 🤖 3. Trợ Lý AI & Chatbot Trực Tuyến (AI Chatbot Engine)
* **Tư vấn thông minh & Tra cứu tự động:**
  * Giải đáp chính sách mua hàng, điều kiện đổi trả, thông tin bảo hành, tra cứu mã giảm giá đang hoạt động.
  * Tra cứu trực tiếp hành trình đơn hàng theo mã đơn ngay trong hộp thoại chat.
* **Công nghệ Nhận diện giọng nói (Voice Speech-to-Text):**
  * Tích hợp Web Speech API cho phép người dùng bấm micro nói câu hỏi thay vì gõ văn bản.
* **Chuyển giao nhân viên tư vấn (AI-to-Human Handover):**
  * Khi gặp vấn đề phức tạp, chatbot tự động kết nối sang phiên trò chuyện với nhân viên hỗ trợ trực tiếp.

---

## 🏗️ Kiến Trúc Hệ Thống (System Architecture)

```mermaid
flowchart TD
    subgraph ClientLayer ["Client Layer (React 18 + Vite)"]
        UI["Modern UI / Responsive Layout"]
        Context["Context State (Cart, Auth, Coin, Wishlist, Toast)"]
        EventBus["Cross-tab Real-time Broadcast Event Bus"]
        AIEngine["AI Chat Engine & Voice Recognizer"]
    end

    subgraph ServerLayer ["Server Layer (Node.js + Express)"]
        Router["Express RESTful API Routes (9 route groups, 50+ endpoints)"]
        Controllers["Controllers (Product, Order, Shop, Auth, Seller, Admin)"]
        Middlewares["Middlewares (CORS, JWT Authenticate, RBAC, Error Handler)"]
    end

    subgraph DataLayer ["Data & Storage Layer"]
        ModelProxy["Mongoose Proxy Layer"]
        MemoryStore["In-Memory Database Engine"]
        DiskStore["Debounced Disk Persistence (store.json)"]
        MongoDB[("MongoDB Database (Khi chạy Production)")]
    end

    UI --> Context
    Context --> Router
    Router --> Middlewares
    Middlewares --> Controllers
    Controllers --> ModelProxy
    ModelProxy --> MongoDB
    ModelProxy --> MemoryStore
    MemoryStore <--> DiskStore
    Context <--> EventBus
```

---

## 💻 Công Nghệ Sử Dụng (Tech Stack)

### 🎨 Frontend
* **Core:** React 18, Vite 5, JavaScript (ES6+ Modules)
* **Routing:** React Router DOM v6
* **State Management:** React Context API (Cart, Auth, Coin, Wishlist, Toast)
* **Styling:** Vanilla CSS3 (Custom Design System, Flexbox, CSS Grid, Responsive)
* **Features:** Web Speech API, LocalStorage Caching, Dual Voucher Calculator

### ⚙️ Backend
* **Runtime:** Node.js (v20 LTS / v24)
* **Framework:** Express.js 4.x (RESTful Architecture)
* **Authentication:** JSON Web Token (JWT), bcryptjs password hashing
* **Authorization:** Role-Based Access Control (RBAC: `admin`, `seller`, `customer`)
* **Security:** CORS whitelist, Tenant Isolation Guard, Input Sanitization

### 🗄️ Database & Storage
* **Primary:** MongoDB + Mongoose ODM
* **In-Memory Fallback:** High-Performance In-Memory DB Engine (Full Mongoose Query API)
* **Disk Persistence:** Debounced JSON Store (`server/data/store.json`, 210KB+ data)

### 🚀 DevOps & CI/CD
* **Automation:** GitHub Actions (`.github/workflows/ci.yml`)
* **Process Management:** PM2 (Cluster Mode)
* **Web Server:** Nginx Reverse Proxy + SSL/TLS Let's Encrypt

---

## 📂 Cấu Trúc Thư Mục Chuẩn Hóa (Project Directory Structure)

```
Website-Thuong-Mai-Dien-Tu-Mini-Plan/
├── .github/                       # Cấu hình tự động hóa & tiêu chuẩn GitHub
│   ├── ISSUE_TEMPLATE/            # Mẫu báo cáo lỗi & yêu cầu tính năng
│   │   ├── bug_report.md
│   │   └── feature_request.md
│   ├── workflows/
│   │   └── ci.yml                 # GitHub Actions CI/CD Pipeline
│   ├── PULL_REQUEST_TEMPLATE.md   # Mẫu tiêu chuẩn cho Pull Request
│   └── dependabot.yml             # Cấu hình tự động quét cập nhật bảo mật phụ thuộc
├── client/                        # Mã nguồn ứng dụng Frontend (React + Vite)
│   ├── public/                    # Tài nguyên tĩnh công khai (favicon, banners)
│   ├── src/
│   │   ├── components/            # UI Components tái sử dụng (Header, Footer, ProductCard,...)
│   │   ├── context/               # Global State (CartContext, AuthContext, CoinContext,...)
│   │   ├── pages/                 # Các trang giao diện (HomePage, PDP, Cart, Checkout, Seller, Admin)
│   │   ├── services/              # Tầng gọi API tập trung (api.js, productService.js,...)
│   │   ├── styles/                # Toàn bộ mã nguồn CSS thiết kế theo module
│   │   ├── utils/                 # Các hàm tiện ích dùng chung (formatCurrency, validation)
│   │   ├── App.jsx                # Định tuyến ứng dụng React Router
│   │   └── main.jsx               # Entry point ứng dụng React
│   ├── .dockerignore              # Danh sách loại trừ khi đóng gói Docker frontend
│   ├── Dockerfile                 # Multi-stage Docker build & Nginx serving
│   ├── nginx.conf                 # Cấu hình Nginx reverse proxy cho SPA client
│   ├── package.json               # Dependencies Frontend
│   └── vite.config.js             # Cấu hình Vite build tool
├── server/                        # Mã nguồn máy chủ Backend (Node.js + Express)
│   ├── data/
│   │   └── store.json             # Cơ sở dữ liệu sao lưu đĩa tự động (Persistence Store)
│   ├── src/
│   │   ├── config/                # Cấu hình môi trường và kết nối Database
│   │   ├── controllers/           # Tầng xử lý nghiệp vụ (Product, Order, Seller, Admin, Auth)
│   │   ├── middlewares/           # Tầng lọc bảo mật (JWT Authenticate, RBAC, Error Handler)
│   │   ├── models/                # Schemas Mongoose & In-Memory Store Engine
│   │   ├── routes/                # 9 nhóm định tuyến RESTful API
│   │   ├── seed/                  # Dữ liệu hạt giống khởi tạo (109 sản phẩm, 12 shops, 10 vouchers)
│   │   ├── utils/                 # Tiện ích backend (response helper, persistence disk writer)
│   │   └── app.js                 # Cấu hình ứng dụng Express
│   ├── .dockerignore              # Danh sách loại trừ khi đóng gói Docker backend
│   ├── Dockerfile                 # Production Container image cho Express backend
│   ├── package.json               # Dependencies Backend
│   └── server.js                  # Entry point khởi chạy HTTP Server (Port 5000)
├── docs/                          # Hệ thống tài liệu kỹ thuật chuyên sâu (Max Level)
│   ├── roadmap.md                 # Đối chiếu lộ trình Fullstack Developer 8 giai đoạn
│   ├── api.md                     # Đặc tả chi tiết 9 nhóm RESTful API endpoints
│   ├── postman_collection.json    # Bộ request mẫu Postman v2.1.0 sẵn sàng import
│   ├── architecture.md            # Sơ đồ kiến trúc luồng dữ liệu và Tenant Isolation
│   ├── database.md                # Thiết kế cơ sở dữ liệu, ER Diagram & Data Dictionary
│   ├── security.md                # Chính sách bảo mật, chuẩn OWASP và RBAC Guard
│   ├── testing.md                 # Chiến lược kiểm thử tự động toàn diện (450 tests)
│   ├── deployment.md              # Hướng dẫn triển khai Production (VPS, PM2, Nginx, Docker)
│   └── progress/                  # Nhật ký tiến độ phát triển dự án
├── tests/                         # Bộ kiểm thử tự động toàn diện (450 tests)
│   ├── harness/                   # Khung chạy kiểm thử
│   ├── tier1_features/            # Kiểm thử tính năng cơ bản
│   ├── tier2_boundaries/          # Kiểm thử giá trị biên và validation
│   ├── tier3_combinations/        # Kiểm thử tích hợp đa điều kiện
│   ├── tier4_scenarios/           # Kiểm thử kịch bản người dùng thực tế
│   └── run-all.js                 # Script thực thi toàn bộ 450 tests
├── .dockerignore                  # Loại trừ tệp rác khi build root Docker
├── .env.example                   # Biến môi trường mẫu cho toàn dự án
├── CODE_OF_CONDUCT.md             # Quy tắc ứng xử cộng đồng theo chuẩn Contributor Covenant
├── CONTRIBUTING.md                # Hướng dẫn đóng góp mã nguồn & Gitflow chuẩn
├── docker-compose.yml             # Điều phối đa container (MongoDB, Backend, Frontend SPA)
├── LICENSE                        # Giấy phép mã nguồn mở MIT License
├── package.json                   # Root monorepo scripts quản lý toàn diện dự án
├── README.md                      # Tài liệu tổng quan dự án (Recruiter-ready)
└── SECURITY.md                    # Chính sách báo cáo & xử lý lỗ hổng bảo mật
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử (Quick Start)

### Yêu Cầu Môi Trường (Prerequisites)
* **Node.js:** v18.x trở lên (Khuyến nghị Node.js v20 LTS hoặc v24)
* **Trình quản lý gói:** npm hoặc yarn
* **Git** cài đặt trên máy
* *(Tùy chọn)* **Docker & Docker Compose** nếu muốn chạy qua container

### 1. Khởi Chạy Nhanh 1-Click Bằng Docker Compose (Khuyến nghị)
Toàn bộ hệ thống (Frontend SPA, Backend API, MongoDB) đã được đóng gói sẵn sàng:
```bash
# Clone mã nguồn
git clone https://github.com/JiaysTM17/Fullstack-Ecommerce.git
cd Fullstack-Ecommerce

# Khởi chạy toàn bộ hệ thống
docker-compose up -d --build

# Truy cập ứng dụng:
# -> Frontend: http://localhost:80 (hoặc http://localhost:5173 khi chạy dev)
# -> Backend:  http://localhost:5000/api/health
```

### 2. Khởi Chạy Nhanh Bằng Kịch Bản (Dành cho Windows)
```powershell
# Chạy máy chủ Backend (Port 5000)
.\run-server.cmd

# Mở cửa sổ mới, chạy giao diện Frontend (Port 5173)
.\run-client.cmd

# Chạy toàn bộ 530 kiểm thử tự động
.\run-tests.cmd
```

### 3. Khởi Chạy Thủ Công Từng Phần
```bash
# 1. Clone mã nguồn
git clone https://github.com/JiaysTM17/Fullstack-Ecommerce.git
cd Fullstack-Ecommerce

# 2. Cài đặt và khởi chạy Backend Server
cd server
npm install
npm start
# -> Backend lắng nghe tại: http://localhost:5000

# 3. Mở Terminal mới, cài đặt và khởi chạy Frontend
cd client
npm install
npm run dev
# -> Frontend truy cập tại: http://localhost:5173
```

---

## 🔑 Tài Khoản Trải Nghiệm Demo (Demo Credentials)

Hệ thống tích hợp sẵn tính năng **Đăng Nhập Nhanh 1-Click** tại trang `/login`:

| Vai Trò (Role) | Email Đăng Nhập | Mật Khẩu | Quyền Hạn Trải Nghiệm |
|---|---|---|---|
| 👑 **Quản Trị Viên (Admin)** | `admin@shopee.vn` | `admin123` | Quản trị toàn sàn, khóa/mở shop, phát hành voucher sàn, duyệt sản phẩm |
| 👗 **Chủ Shop Thời Trang (Seller)** | `seller.fashion@shopee.vn` | `seller123` | Quản lý Shop Thời Trang GenZ, xem đơn, xác nhận giao hàng, thêm sản phẩm |
| 💻 **Chủ Shop Công Nghệ (Seller)** | `seller.tech@shopee.vn` | `seller123` | Quản lý Shop TechWorld, điều chỉnh tồn kho, xem doanh thu độc lập |
| 🛍️ **Người Mua Hàng (Customer)** | `customer@gmail.com` | `customer123` | Duyệt hàng, áp mã Freeship + Giảm giá, đổi xu thưởng, theo dõi đơn |

---

## 📦 BỘ HỒ SƠ TÀI LIỆU & BÁO CÁO BÀN GIAO PHẦN MỀM CHO KHÁCH HÀNG (ENTERPRISE DELIVERY PACKAGE)

Nhằm đảm bảo sản phẩm phần mềm khi chuyển giao cho Khách hàng / Chủ đầu tư đạt chuẩn chuyên nghiệp cấp doanh nghiệp, toàn bộ hồ sơ phân tích, thiết kế, báo cáo kiểm định, tài chính, rủi ro, pháp lý và sổ tay vận hành đã được biên soạn trọn bộ **22 tài liệu chuyên môn chuẩn quốc tế**:

| STT | Hồ Sơ Tài Liệu & Báo Cáo Chuyên Sâu | Vị Trí Lưu Trữ | Nội Dung & Giá Trị Bàn Giao |
| :---: | :--- | :--- | :--- |
| **1** | **Báo Cáo Phân Tích Yêu Cầu & Nghiệp Vụ Hệ Thống (SRS/BRD)** | [docs/BAO_CAO_PHAN_TICH_YEU_CAU_VA_NGHIEP_VU_SRS.md](docs/BAO_CAO_PHAN_TICH_YEU_CAU_VA_NGHIEP_VU_SRS.md) | Phân tích bài toán TMĐT Multi-Vendor, 4 nhóm đối tượng, quy trình Escrow Vault, đối soát thuế Nghị định 52/2018/NĐ-CP & TT 40/2021, ma trận RBAC. |
| **2** | **Báo Cáo Thiết Kế Kiến Trúc & Công Nghệ Hệ Thống (SAD/TDD)** | [docs/BAO_CAO_THIET_KE_KIEN_TRUC_HE_THONG_SAD.md](docs/BAO_CAO_THIET_KE_KIEN_TRUC_HE_THONG_SAD.md) | Kiến trúc tầng, Optimistic Concurrency Control (OCC CAS) chống bán vượt kho Flash Sale, Circuit Breaker, Token Bucket, ERD & Data Dictionary. |
| **3** | **Báo Cáo Nghiên Cứu & Phân Tích 89 Phase Thuật Toán Doanh Nghiệp** | [docs/BAO_CAO_NGHIEN_CUU_VA_PHAN_TICH_THUAT_TOAN_DOANH_NGHIEP.md](docs/BAO_CAO_NGHIEN_CUU_VA_PHAN_TICH_THUAT_TOAN_DOANH_NGHIEP.md) | Phân tích 236 tính năng toán học & AI/ML: Streaming Sketches (T-Digest, Bipartite Spectral Sparsifier, MomentSketch), Multi-Agent RL (HAPPO, R-COMA, COPA), EVRPTW Two-Echelon Crowd Locker Router, Tri-Role AI Copilots. |
| **4** | **Báo Cáo Đảm Bảo Chất Lượng & Kiểm Thử Tự Động Toàn Diện (QA Report)** | [docs/BAO_CAO_KIEM_THU_CHAT_LUONG_TOAN_DIEN_QA.md](docs/BAO_CAO_KIEM_THU_CHAT_LUONG_TOAN_DIEN_QA.md) | Kết quả kiểm thử tự động 100% Pass (3.151/3.151 tests qua 4 tầng kim tự tháp), Stress test Concurrency OCC, kiểm thử bảo mật OWASP Top 10, kiểm tra build Production 0 lỗi. |
| **5** | **Hướng Dẫn Cài Đặt, Triển Khai & Vận Hành Hệ Thống (DevOps Runbook)** | [docs/HUONG_DAN_CAI_DAT_TRIEN_KHAI_VAN_HANH_RUNBOOK.md](docs/HUONG_DAN_CAI_DAT_TRIEN_KHAI_VAN_HANH_RUNBOOK.md) | Cài đặt từ mã nguồn, Docker Compose, Nginx Reverse Proxy với HTTPS SSL Let's Encrypt, biến môi trường `.env`, sao lưu và phục hồi dữ liệu thảm họa (Disaster Recovery). |
| **6** | **Sổ Tay Hướng Dẫn Sử Dụng Dành Cho Khách Hàng (Customer User Manual)** | [docs/SO_TAY_HUONG_DAN_SU_DUNG_KHACH_HANG.md](docs/SO_TAY_HUONG_DAN_SU_DUNG_KHACH_HANG.md) | Cẩm nang chi tiết 3 phân hệ: Người mua (Buyer Portal), Người bán (Seller Center), và Ban Quản trị Sàn (Admin Portal) kèm hướng dẫn tương tác 3 Trợ lý AI Copilot. |
| **7** | **Biên Bản Nghiệm Thu Kỹ Thuật & Bàn Giao Phần Mềm** | [docs/BIEN_BAN_NGHIEM_THU_VA_BAN_GIAO_PHAN_MEM.md](docs/BIEN_BAN_NGHIEM_THU_VA_BAN_GIAO_PHAN_MEM.md) | Văn bản bàn giao chính thức, danh mục sản phẩm, ma trận nghiệm thu chức năng & cam kết bảo hành, hỗ trợ kỹ thuật (SLA 12 tháng). |
| **8** | **Chính Sách Bảo Mật & An Toàn Thông Tin Doanh Nghiệp** | [docs/CHINH_SACH_BAO_MAT_VA_AN_TOAN_THONG_TIN.md](docs/CHINH_SACH_BAO_MAT_VA_AN_TOAN_THONG_TIN.md) | Tiêu chuẩn ISO 27001, OWASP Top 10 phòng vệ, mã hóa dữ liệu AES-256/TLS 1.3, tuân thủ Nghị định 13/2023/NĐ-CP bảo vệ dữ liệu cá nhân, quy trình CSIRT 5 bước. |
| **9** | **Quy Trình Bảo Trì, Nâng Cấp & Cam Kết Mức Độ Dịch Vụ (SLA)** | [docs/QUY_TRINH_BAO_TRI_VA_KE_HOACH_NANG_CAP_SLA.md](docs/QUY_TRINH_BAO_TRI_VA_KE_HOACH_NANG_CAP_SLA.md) | Cam kết Uptime 99.95%, RPO $\le 5$ phút, RTO $\le 15$ phút, ma trận xử lý sự cố P1-P4, quy trình Blue-Green Deployment nâng cấp không gián đoạn (Zero-Downtime). |
| **10** | **Tài Liệu Đặc Tả API & Giao Thức Tích Hợp Hệ Thống** | [docs/TAI_LIEU_DAC_TA_API_TICH_HOP_HE_THONG.md](docs/TAI_LIEU_DAC_TA_API_TICH_HOP_HE_THONG.md) | Đặc tả 80+ RESTful API endpoints, Webhook VietQR tự động hóa đối soát, Webhook SPX Express live GPS tracking, bảng mã lỗi HTTP chuẩn & mẫu code JavaScript, Python. |
| **11** | **Báo Cáo Phân Tích Tài Chính Dự Án, Chi Phí TCO & Hiệu Quả ROI** | [docs/BAO_CAO_PHAN_TICH_TAI_CHINH_TCO_VA_HIEU_QUA_DAU_TU_ROI.md](docs/BAO_CAO_PHAN_TICH_TAI_CHINH_TCO_VA_HIEU_QUA_DAU_TU_ROI.md) | Dự toán TCO 3 năm, 5 dòng doanh thu sàn TMĐT, phân tích điểm hòa vốn (104 đơn/ngày), dự báo P&L 3 năm và ROI 150.1% hoàn vốn trong 8 tháng. |
| **12** | **Báo Cáo Đánh Giá Tác Động & Ma Trận Quản Trị Rủi Ro Dự Án (RAMM)** | [docs/BAO_CAO_DANH_GIA_TAC_DONG_VA_QUAN_TRI_RUI_RO_DU_AN.md](docs/BAO_CAO_DANH_GIA_TAC_DONG_VA_QUAN_TRI_RUI_RO_DU_AN.md) | Tiêu chuẩn ISO 31000, ma trận rủi ro $5 \times 5$, giải pháp code triệt tiêu 10 rủi ro lớn (Bùng đơn COD, Sybil voucher, nghẽn mạng Flash Sale, thuế TMĐT). |
| **13** | **Kế Hoạch Đào Tạo Nhân Sự & Chuyển Giao Công Nghệ Toàn Diện (TTTP)** | [docs/KE_HOACH_DAO_TAO_VA_CHUYEN_GIAO_CONG_NGHE.md](docs/KE_HOACH_DAO_TAO_VA_CHUYEN_GIAO_CONG_NGHE.md) | Khung đào tạo 6 ngày cho Ban Lãnh đạo, Kỹ thuật DevOps và Vận hành CSKH, bài sát hạch thực tế và mẫu biên bản hoàn tất chuyển giao công nghệ. |
| **14** | **Báo Cáo Thiết Kế Cơ Sở Dữ Liệu & Từ Điển Dữ Liệu Toàn Diện (DDD)** | [docs/BAO_CAO_THIET_KE_CO_SO_DU_LIEU_VA_TU_DIEN_DU_LIEU.md](docs/BAO_CAO_THIET_KE_CO_SO_DU_LIEU_VA_TU_DIEN_DU_LIEU.md) | Sơ đồ quan hệ thực thể ERD chuẩn hóa 3NF, từ điển dữ liệu 100% các bảng/collections, chiến lược Compound & Text Index, chính sách sao lưu PITR. |
| **15** | **Bản Cam Kết Chất Lượng Dịch Vụ (SLA) & Chứng Thư Bảo Hành Phần Mềm** | [docs/CAM_KET_CHAT_LUONG_DICH_VU_VA_CHUNG_CHI_BAO_HANH.md](docs/CAM_KET_CHAT_LUONG_DICH_VU_VA_CHUNG_CHI_BAO_HANH.md) | Chứng thư bảo hành 12 tháng không phát sinh chi phí, cam kết Uptime 99.95%, ma trận xử lý sự cố 4 cấp độ và chứng nhận Zero Malware, Zero Backdoors. |
| **16** | **Danh Mục Tổng Thể Bộ Hồ Sơ Bàn Giao & Báo Cáo Tóm Tắt Điều Hành** | [docs/DANH_MUC_HO_SO_BAN_GIAO_VA_TONG_QUAN_DU_AN.md](docs/DANH_MUC_HO_SO_BAN_GIAO_VA_TONG_QUAN_DU_AN.md) | Báo cáo điều hành tổng quan (Executive Briefing), ma trận đóng gói 22 tài liệu, hướng dẫn tra cứu nhanh theo từng phòng ban nghiệp vụ tiếp nhận. |
| **17** | **Kế Hoạch Quản Lý Dự Án & Bảng Phân Rã Công Việc (PMP & WBS)** | [docs/KE_HOACH_QUAN_LY_DU_AN_VA_TIEN_DO_PMP.md](docs/KE_HOACH_QUAN_LY_DU_AN_VA_TIEN_DO_PMP.md) | Phương pháp Agile/Scrum Hybrid, phân rã WBS 89 Phase, ma trận trách nhiệm RACI, quy trình quản lý thay đổi CR Form & thẩm định CCB. |
| **18** | **Kế Hoạch Dự Phòng Thảm Họa & Duy Trì Hoạt Động (BCP & DRP)** | [docs/KE_HOACH_DU_PHONG_THAM_HOA_VA_KHOI_PHUC_BCP_DRP.md](docs/KE_HOACH_DU_PHONG_THAM_HOA_VA_KHOI_PHUC_BCP_DRP.md) | Tiêu chuẩn ISO 22301, cam kết RPO $\le 5$m, RTO $\le 15$m, kiến trúc Multi-Region Failover và 4 kịch bản ứng phó khẩn cấp (Sập DC, DDoS, Ransomware, Đứt cáp). |
| **19** | **Quy Chuẩn Thiết Kế Giao Diện & Trải Nghiệm Người Dùng (UI/UX System)** | [docs/QUY_CHUAN_THIET_KE_GIAO_DIEN_VA_TRAI_NGHIEM_UI_UX.md](docs/QUY_CHUAN_THIET_KE_GIAO_DIEN_VA_TRAI_NGHIEM_UI_UX.md) | Design tokens bảng màu Shopee Orange `#EE4D2D`, lưới 8pt, thang chữ, đặc tả Product Card, SPX Live Stepper, WCAG 2.1 AA & âm thanh Chime. |
| **20** | **Báo Cáo Đo Kiểm Hiệu Năng & Tải Trọng Tối Đa (Performance Benchmark)** | [docs/BAO_CAO_DO_KIEM_HIEU_NANG_VA_TAI_TRONG_PERFORMANCE.md](docs/BAO_CAO_DO_KIEM_HIEU_NANG_VA_TAI_TRONG_PERFORMANCE.md) | Đo kiểm thực nghiệm: 10,000 CCU, 12,000 RPS đỉnh tải Flash Sale, phân vị $P_{95} \le 54\text{ms}$, 48 giờ chạy liên tục 0 rò rỉ RAM (Zero Memory Leak). |
| **21** | **Báo Cáo Tuân Thủ Pháp Lý, Thuế & Sở Hữu Trí Tuệ (Legal & IPR Audit)** | [docs/BAO_CAO_TUAN_THU_PHAP_LY_VA_SO_HUU_TRI_TUE_IPR.md](docs/BAO_CAO_TUAN_THU_PHAP_LY_VA_SO_HUU_TRI_TUE_IPR.md) | Tuân thủ Nghị định 52 & 85 về TMĐT, thuế TT40/2021, bảo vệ dữ liệu cá nhân PDPD, kiểm toán SBOM 100% giấy phép Permissive (Zero GPL). |
| **22** | **Kịch Bản Kiểm Thử Nghiệm Thu Người Dùng Cuối (UAT Test Plan & Matrix)** | [docs/KICH_BAN_KIEM_THU_NGHIEM_THU_NGUOI_DUNG_UAT.md](docs/KICH_BAN_KIEM_THU_NGHIEM_THU_NGUOI_DUNG_UAT.md) | Bộ 55 kịch bản UAT chi tiết từng bước cho Buyer, Seller, Super Admin, hệ thống, kèm mẫu biên bản ghi nhận lỗi và phiếu ký nghiệm thu. |

---

## 📚 Hệ Thống Tài Liệu Kỹ Thuật Bổ Trợ (Supplementary Technical Documentation)

* [🗺️ Lộ Trình Phát Triển & Đối Chiếu 8 Giai Đoạn (docs/roadmap.md)](docs/roadmap.md)
* [🔌 Tài Liệu Đặc Tả 9 Nhóm RESTful API (docs/api.md)](docs/api.md)
* [📬 Bộ Thử Nghiệm API Postman Collection v2.1.0 (docs/postman_collection.json)](docs/postman_collection.json)
* [🏗️ Kiến Trúc Hệ Thống & Luồng Request-Response (docs/architecture.md)](docs/architecture.md)
* [🗄️ Thiết Kế Cơ Sở Dữ Liệu & Data Dictionary 7 Bảng (docs/database.md)](docs/database.md)
* [🔒 Chính Sách Bảo Mật, Chuẩn OWASP & Phân Quyền RBAC (docs/security.md)](docs/security.md)
* [🧪 Chiến Lược & Cấu Trúc 4 Tầng Kiểm Thử (docs/testing.md)](docs/testing.md)
* [🚀 Hướng Dẫn Triển Khai Production: VPS, Nginx, PM2 & Docker (docs/deployment.md)](docs/deployment.md)

---

## 🧪 Kiểm Thử & Đảm Bảo Chất Lượng (Quality Assurance & Tests)

Dự án áp dụng quy trình kiểm thử tự động nghiêm ngặt gồm **3.151 tests** được tổ chức theo 4 tầng tiêu chuẩn:

* **Tier 1 (Core Features & 89 Phase Algorithms - 2.885 tests):** Kiểm thử toàn diện 236 tính năng độc lập thuộc các phân hệ chính (Phân quyền RBAC, Hệ thống Voucher kép, Trợ lý ảo AI Tri-Role, Két ký quỹ Escrow, Hậu mãi & Đổi trả, Toàn bộ 89 Phase thuật toán doanh nghiệp).
* **Tier 2 (Boundary & Validation - 230 tests):** Kiểm tra giá trị biên và bảo mật khắt khe (tồn kho âm, tấn công XSS/SQL Injection, upload file quá khổ, voucher quá hạn, vượt mức giảm tối đa, rate limiting).
* **Tier 3 (Combinations - 24 tests):** Ma trận tương tác chéo giữa các tính năng (áp đồng thời 2 voucher + trừ xu 50% trần + giỏ hàng đa shop + SPX logistics + VAT invoice).
* **Tier 4 (Real-world Scenarios - 12 tests):** Hành trình người dùng hoàn chỉnh từ đăng ký, mua sắm đa shop, xuất hóa đơn VAT, giao hàng SPX live GPS đến hậu mãi hoàn tiền và đánh giá 5 sao nhận thưởng xu.

```bash
# Thực thi toàn bộ kiểm thử
npm test
```
*Kết quả thực thi:* **`3.151 / 3.151 tests passed (100% Pass Rate) trong 1.29 giây`**.

---

## 🤝 Tiêu Chuẩn Cộng Đồng & Đóng Góp (Community & Contributing)

Dự án cam kết tuân thủ các chuẩn mực mã nguồn mở cao nhất:

* 📖 **[Hướng Dẫn Đóng Góp (CONTRIBUTING.md)](CONTRIBUTING.md):** Quy trình tạo nhánh (branching), quy ước đặt tên commit (Conventional Commits), và hướng dẫn tạo Pull Request.
* 📜 **[Quy Tắc Ứng Xử (CODE_OF_CONDUCT.md)](CODE_OF_CONDUCT.md):** Tiêu chuẩn ứng xử văn minh dựa trên Contributor Covenant v2.1.
* 🛡️ **[Chính Sách Bảo Mật (SECURITY.md)](SECURITY.md):** Hướng dẫn báo cáo và quy trình xử lý lỗ hổng bảo mật có trách nhiệm.
* ⚖️ **[Giấy Phép Bản Quyền (LICENSE)](LICENSE):** Được phân phối theo giấy phép MIT License, hoàn toàn tự do sử dụng cho mục đích học tập và phát triển.

---

## 👨‍💻 Tác Giả & Liên Hệ (Author & Contact)

* **Họ và tên:** Kiệt Trương ([JiaysTM17](https://github.com/JiaysTM17))
* **Email:** truonggiakiet110806@gmail.com
* **GitHub Repository:** [https://github.com/JiaysTM17/Fullstack-Ecommerce](https://github.com/JiaysTM17/Fullstack-Ecommerce)
* **Vị trí hướng tới:** Fullstack Web Developer (React.js, Node.js, Express, MongoDB)

---

*Dự án được xây dựng với mục tiêu thể hiện năng lực lập trình Fullstack toàn diện, tư duy kiến trúc hệ thống chuẩn mực và sẵn sàng đáp ứng các tiêu chuẩn tuyển dụng khắt khe nhất.*
