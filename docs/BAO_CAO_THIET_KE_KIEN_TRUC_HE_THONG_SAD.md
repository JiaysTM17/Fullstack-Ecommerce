# BÁO CÁO THIẾT KẾ KIẾN TRÚC & CÔNG NGHỆ HỆ THỐNG (SAD/TDD)
## DỰ ÁN: NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ MINI SHOPEE MULTI-VENDOR
**Mã tài liệu:** `SAD-MINISHOPEE-V2.0` | **Phiên bản:** `2.0.0 Enterprise` | **Ngày ban hành:** `2026-10-23`

---

## MỤC LỤC
1. [Tổng Quan Kiến Trúc Tầng (Layered Architecture)](#1-tổng-quan-kiến-trúc-tầng-layered-architecture)
2. [Thiết Kế Tầng Giao Diện Người Dùng (Frontend Architecture)](#2-thiết-kế-tầng-giao-diện-người-dùng-frontend-architecture)
3. [Thiết Kế Tầng Dịch Vụ Ứng Dụng (Backend API Gateway & Express)](#3-thiết-kế-tầng-dịch-vụ-ứng-dụng-backend-api-gateway--express)
4. [Thiết Kế Tầng Dữ Liệu Lai (Hybrid In-Memory & Persistence Store)](#4-thiết-kế-tầng-dữ-liệu-lai-hybrid-in-memory--persistence-store)
5. [Cơ Chế Kiểm Soát Đồng Thời & Chống Sập Hệ Thống (High-Concurrency Patterns)](#5-cơ-chế-kiểm-soát-đồng-thời--chống-sập-hệ-thống-high-concurrency-patterns)
6. [Mô Hình Dữ Liệu & Từ Điển Thực Thể (Database Schema & ERD)](#6-mô-hình-dữ-liệu--từ-điển-thực-thể-database-schema--erd)
7. [Kiến Trúc An Ninh Đa Tầng & Bảo Mật Dữ Liệu (Defense-in-Depth Security)](#7-kiến-trúc-an-ninh-đa-tầng--bảo-mật-dữ-liệu-defense-in-depth-security)

---

## 1. TỔNG QUAN KIẾN TRÚC TẦNG (LAYERED ARCHITECTURE)

Hệ thống Mini Shopee được xây dựng theo mô hình **Client-Server tách biệt hoàn toàn**, kết hợp với cơ chế **Event-Driven Cross-Tab Synchronization** và **In-Memory Store Proxy** với khả năng bền vững hóa dữ liệu xuống đĩa theo thời gian thực (Debounced Disk Persistence).

```mermaid
flowchart TB
    subgraph ClientTier ["1. TẦNG KHÁCH HÀNG (CLIENT TIER - React 18 SPA)"]
        UI_Buyer["Storefront & PDP / Cart"]
        UI_Seller["Seller Center / Inventory / Ads"]
        UI_Admin["Admin Governance / Finance / Risk"]
        DesignTokens["CSS Design Tokens (:root, [data-theme='dark'])"]
        ClientAI["In-Memory Edge AI Engines (Tri-Role Copilots)"]
    end

    subgraph GatewayTier ["2. TẦNG KẾT NỐI & BẢO VỆ (API GATEWAY & SECURITY)"]
        CORS["CORS Policy Guard"]
        RateLimiter["Token Bucket Rate Limiter (RFC 429)"]
        JWTAuth["JWT Bearer Authentication & RBAC"]
        Sanitization["Input Validator & Schema Sanitization"]
    end

    subgraph BusinessTier ["3. TẦNG NGHIỆP VỤ (BUSINESS LOGIC TIER - Express Controllers)"]
        OrderController["Order & Flash Sale Controller (OCC/CAS)"]
        PaymentController["VietQR & Escrow Settlement Controller"]
        SellerController["Inventory & Shop Wallet Controller"]
        AdminController["Dispute & Tax Withholding Controller"]
        LogisticsController["SPX Dynamic EV Routing Controller"]
    end

    subgraph DataTier ["4. TẦNG DỮ LIỆU & BẢO CHỨNG (DATA & PERSISTENCE TIER)"]
        MemoryStore["High-Performance In-Memory Store (RAM Engine)"]
        LRUCache["LRU Cache with TTL (Catalog & Pricing)"]
        DiskPersistence["Debounced JSON Disk Persistence"]
        LedgerMerkle["Double-Entry Ledger & Merkle Audit Tree"]
        MongoProxy["Mongoose Database Proxy Layer"]
    end

    ClientTier --> GatewayTier
    GatewayTier --> BusinessTier
    BusinessTier --> DataTier
```

---

## 2. THIẾT KẾ TẦNG GIAO DIỆN NGƯỜI DÙNG (FRONTEND ARCHITECTURE)

### 2.1. Công nghệ & Tối ưu hóa Build
- **React 18 SPA + Vite 5.2 Bundler:** Khởi tạo và biên dịch tức thì với Rollup, đóng gói CSS và JS đạt kích thước nén tối ưu (Gzip ~35KB CSS, ~673KB JS).
- **React Router v6:** Định tuyến phía máy khách (Client-side routing) với các tuyến bảo vệ (Protected Routes) ngăn chặn người dùng chưa xác thực truy cập trái phép.

### 2.2. Hệ thống Design Tokens & Chế độ Tối (Theme Engine)
- Toàn bộ giao diện tuân thủ bảng mã màu CSS Design Tokens chuẩn mực tại `client/src/styles/theme.css`:
  - `--primary-color: #2563eb;` (Xanh thương hiệu chủ đạo)
  - `--bg-page: #f8fafc;` (Chế độ sáng)
  - `[data-theme="dark"] --bg-page: #0f172a;` (Chế độ tối bảo vệ thị giác)
- **Hệ thống Vector SVG Icons:** Loại bỏ hoàn toàn hơn 450 khung viền bọc cứng nhắc (rigid border boxes), thay thế bằng các icon SVG tinh gọn với màu sắc bổ trợ tự nhiên.

### 2.3. Quản lý trạng thái & Đồng bộ hóa đa tab (Cross-Tab Event Bus)
- Sử dụng **React Context API** kết hợp `CustomEvent` và `storage` listener trên trình duyệt để đồng bộ tức thì giỏ hàng, số dư Mini Xu và trạng thái đơn hàng khi người dùng mở nhiều tab cùng lúc mà không cần tải lại trang.

---

## 3. THIẾT KẾ TẦNG DỊCH VỤ ỨNG DỤNG (BACKEND API GATEWAY & EXPRESS)

### 3.1. Cấu trúc mô-đun hóa Controller-Service
```
server/src/
├── controllers/          # Xử lý logic nghiệp vụ, điều phối dữ liệu
│   ├── adminController.js
│   ├── authController.js
│   ├── cartController.js
│   ├── orderController.js
│   ├── productController.js
│   └── sellerController.js
├── middlewares/          # Các tầng kiểm soát bảo mật và lọc dữ liệu
│   ├── auth.js           # Xác thực JWT Token & Phân quyền RBAC
│   ├── rateLimiter.js    # Thuật toán Token Bucket Rate Limiting
│   ├── validator.js      # Kiểm tra và làm sạch dữ liệu đầu vào
│   └── errorHandler.js   # Bắt lỗi tập trung chuẩn RFC 7807
├── models/               # Đại diện thực thể và In-Memory Store
│   ├── memoryStore.js
│   ├── Order.js
│   ├── Product.js
│   ├── Shop.js
│   └── User.js
└── utils/                # 86 Phase thuật toán doanh nghiệp & công cụ bổ trợ
```

---

## 4. THIẾT KẾ TẦNG DỮ LIỆU LAI (HYBRID IN-MEMORY & PERSISTENCE STORE)

### 4.1. Nguyên lý vận hành In-Memory Store kết hợp Disk Persistence
1. **Truy xuất siêu tốc trong RAM:** Toàn bộ bảng dữ liệu (`users`, `shops`, `products`, `orders`, `vouchers`, `reviews`, `escrowBalances`) được quản lý trong bộ nhớ RAM thông qua `MemoryStore`. Các thao tác tìm kiếm, lọc và cập nhật diễn ra trong thời gian $O(1)$ đến $O(\log N)$.
2. **Bền vững hóa xuống đĩa (Debounced Persistence):** Mỗi khi có thao tác ghi dữ liệu (đặt hàng, cập nhật kho, thanh toán), hệ thống gom cụm các sự kiện ghi thông qua cơ chế Debounce ($500\text{ms}$) và ghi bất đồng bộ ra tệp `server/data/store.json`, đảm bảo không mất dữ liệu ngay cả khi tiến trình máy chủ khởi động lại.
3. **Mongoose Database Proxy:** Mã nguồn controller được thiết kế tương thích hoàn toàn với cú pháp Mongoose ORM/ODM (`Product.find()`, `Order.create()`), cho phép chuyển đổi sang cụm MongoDB vật lý chỉ bằng việc thay đổi cấu hình biến môi trường `MONGO_URI`.

---

## 5. CƠ CHẾ KIỂM SOÁT ĐỒNG THỜI & CHỐNG SẬP HỆ THỐNG (HIGH-CONCURRENCY PATTERNS)

### 5.1. Chống Bán Vượt Kho Bằng Optimistic Concurrency Control (OCC / Atomic CAS)
Trong chiến dịch Flash Sale với hàng nghìn người cùng mua một mặt hàng có số lượng tồn kho ít ỏi, việc khóa dòng dữ liệu theo kiểu truyền thống (Pessimistic Locking) sẽ gây nghẽn cổ chai (Deadlock) và làm tê liệt hệ thống. Hệ thống áp dụng thuật toán **Kiểm soát đồng thời lạc quan (OCC)** với trường số nguyên phiên bản (`version`):
$$\text{UPDATE products SET stock = stock - qty, version = version + 1 WHERE id = productId AND stock} \ge \text{qty AND version = currentVersion}$$
- Nếu phát hiện phiên bản đã bị thay đổi bởi giao dịch khác (Concurrent Write Conflict), hệ thống tự động Retry tối đa $N=3$ lần với thuật toán **Exponential Backoff with Full Jitter**.
- Kết quả kiểm chứng thực nghiệm: Xử lý 100 giao dịch song song mua 10 món hàng cuối cùng, tồn kho kết thúc chính xác bằng 0, không bao giờ âm, không bán vượt kho.

### 5.2. Cắt mạch tự phục hồi Circuit Breaker Pattern
Bảo vệ hệ thống khỏi hiệu ứng sụp đổ dây chuyền (Cascading Failure) khi các dịch vụ bên thứ ba (Cổng thanh toán VietQR, Webhook bưu tá SPX, Gemini AI Gateway) gặp sự cố:
```mermaid
stateDiagram-v2
    [*] --> CLOSED
    CLOSED --> OPEN: Tỷ lệ lỗi > 50% trong cửa sổ trượt
    OPEN --> HALF_OPEN: Hết thời gian chờ (Reset Timeout)
    HALF_OPEN --> CLOSED: Thử nghiệm lưu lượng thành công (probingSuccess >= 3)
    HALF_OPEN --> OPEN: Phát hiện lỗi tiếp tục xảy ra
```

### 5.3. Cấp phát Token Bucket Rate Limiter
Mỗi người dùng hoặc địa chỉ IP được cấp một xô Token (Capacity = 30 tokens, Refill Rate = 10 tokens/giây). Mọi yêu cầu nhạy cảm (`POST /api/orders`, `POST /api/auth/login`) phải tiêu thụ token. Khi xô cạn, hệ thống phản hồi ngay mã `429 Too Many Requests` kèm tiêu đề `Retry-After`, chặn đứng hoàn toàn các bot săn deal Flash Sale và tấn công brute-force.

---

## 6. MÔ HÌNH DỮ LIỆU & TỪ ĐIỂN THỰC THỂ (DATABASE SCHEMA & ERD)

```mermaid
erDiagram
    USER ||--o{ ORDER : "đặt hàng"
    USER ||--o| SHOP : "sở hữu"
    SHOP ||--o{ PRODUCT : "đăng bán"
    PRODUCT ||--o{ ORDER_ITEM : "chứa trong"
    ORDER ||--|{ ORDER_ITEM : "bao gồm"
    ORDER ||--o| ESCROW_TRANSACTION : "ký quỹ"
    SHOP ||--o{ SELLER_WITHDRAWAL : "rút doanh thu"
    PRODUCT ||--o{ REVIEW : "nhận đánh giá"
```

### 6.1. Chi tiết Schema các bảng dữ liệu cốt lõi
1. **Users (`users`):** `id`, `name`, `email`, `password` (hashed), `role` (`customer` | `seller` | `admin`), `coinBalance`, `trustScore`, `createdAt`.
2. **Shops (`shops`):** `id`, `ownerId`, `name`, `description`, `status` (`active` | `locked` | `under_review`), `bankAccount`, `rating`, `taxCode`, `createdAt`.
3. **Products (`products`):** `id`, `shopId`, `name`, `price`, `originalPrice`, `cogs` (giá vốn), `stock`, `version` (OCC integer), `category`, `variants` (màu sắc/kích thước), `rating`, `soldCount`.
4. **Orders (`orders`):** `id`, `userId`, `items` (array: `productId`, `shopId`, `quantity`, `price`), `subtotal`, `shippingFee`, `discountAmount`, `coinDeducted`, `totalAmount`, `paymentMethod` (`VIETQR` | `COD`), `paymentStatus` (`PENDING` | `PAID`), `orderStatus` (`CONFIRMED` | `PACKED` | `SHIPPING` | `DELIVERED` | `CANCELLED` | `RETURNED`), `spxTracking` (step, courierName, liveCoords), `createdAt`.
5. **EscrowVault (`escrow_transactions`):** `orderId`, `shopId`, `grossAmount`, `platformFee` (5%), `withholdingTax` (2.5%), `netSellerPayout`, `status` (`HELD` | `DISBURSED` | `REFUNDED`), `merkleProof`.

---

## 7. KIẾN TRÚC AN NINH ĐA TẦNG & BẢO MẬT DỮ LIỆU (DEFENSE-IN-DEPTH SECURITY)

1. **Xác thực mã hóa JWT & Phân tách quyền hạn RBAC:**
   - Phiên làm việc duy trì qua JWT Token có thời hạn hợp lệ, lưu trữ an toàn trong localStorage phía client và đính kèm trong header `Authorization: Bearer <token>`.
   - Middleware `auth.js` xác thực tính hợp lệ của chữ ký bí mật (`JWT_SECRET`) và kiểm tra quyền hạn (`req.user.role`).
2. **Cô lập dữ liệu người bán (Multi-Tenant Isolation):**
   - Mọi thao tác truy xuất hoặc cập nhật sản phẩm, đơn hàng, rút tiền trong Seller Center bắt buộc phải đối khớp giữa `req.user.id` và `shop.ownerId`. Ngăn chặn hoàn toàn việc người bán Shop A can thiệp vào đơn hàng hoặc doanh thu của Shop B.
3. **Phòng chống các lỗ hổng OWASP Top 10:**
   - **Cross-Site Scripting (XSS):** Làm sạch toàn bộ dữ liệu người dùng nhập bằng `validator.js` và cơ chế escape tự động của React JSX.
   - **SQL / NoSQL Injection:** Sử dụng định dạng tham số hóa và kiểm tra kiểu dữ liệu nghiêm ngặt trước khi tương tác với `MemoryStore`.
   - **Cross-Site Request Forgery (CSRF):** Sử dụng token dạng Bearer trong header thay cho cookie mặc định, vô hiệu hóa hoàn toàn các kịch bản tấn công mạo danh phiên làm việc.

---
*Tài liệu kiến trúc này là tài sản kỹ thuật bàn giao chính thức cho Khách hàng, làm chuẩn mực cho quá trình bảo trì, mở rộng và phát triển các phiên bản tiếp theo.*
