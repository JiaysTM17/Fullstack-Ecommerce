# Mini Shopee - Full-stack Ecommerce

Mini Shopee is a small full-stack ecommerce project built with React, Node.js, Express, and MongoDB. It supports browsing products, viewing product details, managing a localStorage cart, and submitting checkout orders through a REST API.

## Tech Stack

- Front-end: React, Vite, React Router DOM, CSS
- Back-end: Node.js, Express, Mongoose
- Database: MongoDB
- Client state: React Context API
- Client storage: localStorage

## Project Structure

```txt
client/
  src/
    components/
    context/
    pages/
    services/
    styles/
    utils/
server/
  src/
    config/
    controllers/
    middlewares/
    models/
    routes/
    seed/
    utils/
docs/progress/
```

## Environment Setup

Create `server/.env` from `server/.env.example`:

```txt
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_mini
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Create `client/.env` from `client/.env.example`:

```txt
VITE_API_URL=http://localhost:5000
```

## Install

```bash
cd server
npm install

cd ../client
pnpm install
```

## Seed Products

MongoDB must be running before seeding.

```bash
cd server
npm run seed
```

## Run

Terminal 1:

```bash
cd server
npm run dev
```

Terminal 2:

```bash
cd client
pnpm run dev
```

Open the client at `http://localhost:5173`.

## API Endpoints

- `GET /api/products`
- `GET /api/products/:id`
- `POST /api/orders`

`GET /api/products` response:

```json
{
  "success": true,
  "data": {
    "products": [],
    "pagination": {
      "page": 1,
      "limit": 12,
      "total": 0,
      "totalPages": 1
    }
  }
}
```

`POST /api/orders` request:

```json
{
  "customer": {
    "fullName": "Nguyen Van A",
    "phone": "0909123456",
    "email": "a@example.com",
    "address": "123 Nguyen Trai, TP.HCM",
    "note": ""
  },
  "items": [
    {
      "productId": "product_id",
      "name": "Ao thun nam basic",
      "price": 199000,
      "image": "https://example.com/image.jpg",
      "quantity": 2
    }
  ],
  "shippingFee": 30000,
  "paymentMethod": "COD"
}
```

The server recalculates `subtotal` and `total` from submitted items.

## Main Features
 
 - Product listing with search and sort query params
 - Product detail page
 - Cart Context with add/remove/increase/decrease/direct quantity change
 - Cart persistence in localStorage
 - Checkout form validation
 - Order creation through Express API
 - Responsive ecommerce UI components
 
-## Hệ Thống 3 Phân Quyền & Quản Lý Đa Shop (Multi-Role & Multi-Vendor)
+### 1. Phân Quyền Khách Hàng (Customer Portal)
+- Đăng nhập & Đăng ký: `/login`, `/register`
+- Mua sắm, giỏ hàng, đặt hàng thanh toán COD/Banking/Momo
+- Xem lịch sử đơn mua theo trạng thái: `/orders`
+- Quản lý hồ sơ cá nhân và sổ địa chỉ: `/profile`
+
+### 2. Kênh Người Bán / Chủ Shop (Seller Portal - Multi-Shop)
+- Truy cập: `/seller/dashboard`
+- Độc lập dữ liệu giữa các shop: Mỗi shop chỉ nhìn thấy, chỉnh sửa sản phẩm và đơn hàng của chính mình.
+- Thêm/Sửa/Xóa sản phẩm, bật/tắt ẩn hiện sản phẩm tức thì.
+- Cập nhật tiến độ xử lý đơn hàng cho shop.
+- Thống kê doanh thu, tồn kho, đơn hàng theo thời gian thực.
+
+### 3. Kênh Quản Trị Sàn (Super Admin Portal)
+- Truy cập: `/admin/dashboard`
+- Giám sát toàn sàn: Tổng doanh thu GMV, tổng số shop, tổng người dùng, tổng đơn hàng.
+- Quản lý & phê duyệt danh sách Shop (Khóa/Mở khóa vi phạm, kích hoạt shop mới).
+- Quản lý người dùng sàn (Khóa/Mở khóa tài khoản).
+
+## Tài Khoản Demo Sẵn Có (1-Click Login tại `/login`)
+
+| Phân quyền | Email | Mật khẩu | Chức năng nổi bật |
+|---|---|---|---|
+| **Khách hàng** | `khachhang@shopee.vn` | `123456` | Mua sắm, theo dõi đơn, sửa hồ sơ cá nhân |
+| **Chủ Shop 1 (Thời trang)** | `shop.genz@shopee.vn` | `123456` | Quản lý thời trang GenZ, đăng tải quần áo |
+| **Chủ Shop 2 (Công nghệ)** | `shop.tech@shopee.vn` | `123456` | Quản lý đồ công nghệ, tai nghe, phụ kiện |
+| **Quản trị viên** | `admin@shopee.vn` | `admin123` | Phê duyệt shop, quản lý người dùng, xem doanh thu toàn sàn |
+
+## Cách Khởi Chạy Nhanh Bằng File Batch (Windows)
+
+- Chạy Front-end: Click đúp vào `run-client.cmd` (mở tại `http://localhost:5173`)
+- Chạy Back-end: Click đúp vào `run-server.cmd` (mở tại `http://localhost:5000`)
+
+## Notes
 
 - The app requires MongoDB local or MongoDB Atlas (hoặc tự động fallback sang offline mock data khi chưa kết nối MongoDB).
 - Seed product images use remote Unsplash URLs.
 - If client and server use different ports, update `VITE_API_URL` and `CLIENT_URL`.

