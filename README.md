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

## Hệ Thống Tính Năng Chuẩn Sàn Quốc Tế (Amazon / Shopee / Lazada)

### 🛒 1. Trải Nghiệm Mua Sắm Khách Hàng (Customer Experience)
- **Trang chủ Amazon:**
  - Hero Banner Carousel trình chiếu siêu khuyến mãi.
  - Flash Deals / Giờ vàng giá sốc tích hợp đồng hồ đếm ngược (`HH:MM:SS`) và thanh tiến độ % đã bán.
  - Sidebar bộ lọc đa tiêu chí (ProductFilters): lọc theo khoảng giá, đánh giá 4★+, giao nhanh 2h, huy hiệu Amazon's Choice.
- **Trang chi tiết sản phẩm Amazon PDP (`/products/:id`):**
  - Gallery nhiều ảnh chất lượng cao kèm thanh thumbnails chuyển góc nhìn.
  - Khung Amazon Buy Box: Cảnh báo tồn kho ("Còn hàng", "Chỉ còn 3 sản phẩm"), nút "Thêm vào giỏ" và "Mua ngay 1-click".
  - Bộ chọn biến thể Màu sắc và Kích cỡ trực quan.
  - Bảng thông số kỹ thuật chi tiết (Specifications table).
  - Thẻ thông tin Shop uy tín: Tỷ lệ chat 98%, điểm đánh giá 4.9★, nút Xem Shop / Chat ngay.
  - Hệ thống đánh giá 5 sao: Biểu đồ thanh tỷ lệ phân bổ sao, danh sách nhận xét Đã mua hàng (Verified Purchase), form viết đánh giá có chấm điểm sao.
- **Giỏ hàng & Thanh toán đa bước:**
  - Chọn từng món hàng để thanh toán bằng checkbox.
  - Tính năng "Lưu lại mua sau" (Save for later).
  - Hệ thống mã giảm giá Voucher sàn & shop trừ tiền trực tiếp.
  - Quy trình thanh toán 4 bước: Địa chỉ -> Vận chuyển (Tiêu chuẩn/2H/Tiết kiệm) -> Thanh toán (COD/Visa Card mockup/MoMo/VietQR) -> Xác nhận đơn.
- **Danh sách yêu thích (`/wishlist`):** Lưu trữ sản phẩm thả tim và chuyển nhanh vào giỏ hàng.
- **Theo dõi đơn hàng (`/orders`):** Stepper 4 mốc hành trình vận chuyển thời gian thực.

### 🏪 2. Kênh Người Bán (Amazon Seller Central)
- Truy cập: `/seller/dashboard`
- Cô lập dữ liệu giữa các shop: Mỗi shop chỉ nhìn thấy, chỉnh sửa sản phẩm và đơn hàng của chính mình.
- Thêm/Sửa/Xóa sản phẩm, SKU, mã vạch, bật/tắt ẩn hiện sản phẩm tức thì.
- In phiếu giao hàng & Hóa đơn (Shipping Label Modal) chuẩn đơn vị vận chuyển SPX Express.
- Thống kê doanh thu, tồn kho, đơn hàng theo thời gian thực.

### 🛡️ 3. Kênh Quản Trị Sàn (Super Admin Portal)
- Truy cập: `/admin/dashboard`
- Giám sát toàn sàn: Tổng doanh thu GMV, hoa hồng sàn thu về (5%), tổng số shop, tổng người dùng, tổng đơn hàng.
- Quản lý mã giảm giá sàn (Voucher Engine): Tạo mã mới, thiết lập % giảm hoặc số tiền cố định, mức đơn tối thiểu.
- Quản lý & phê duyệt danh sách Shop (Khóa/Mở khóa vi phạm, kích hoạt shop mới).
- Quản lý người dùng sàn (Khóa/Mở khóa tài khoản).

## Mã Giảm Giá / Voucher Sẵn Có Để Thử Nghiệm

| Mã Code | Loại Giảm | Mức Giảm | Đơn Hàng Tối Thiểu |
|---|---|---|---|
| `AMAZON10` | Phần trăm | Giảm 10% (tối đa 100k) | Đơn từ 200.000₫ |
| `FREESHIP` | Vận chuyển | Giảm 30.000₫ phí ship | Đơn từ 150.000₫ |
| `WELCOME50` | Tiền mặt | Giảm trực tiếp 50.000₫ | Đơn từ 300.000₫ |
| `SHOPGENZ` | Voucher Shop | Giảm 20.000₫ từ Shop GenZ | Đơn từ 250.000₫ |

## Tài Khoản Demo Sẵn Có (1-Click Login tại `/login`)

| Phân quyền | Email | Mật khẩu | Chức năng nổi bật |
|---|---|---|---|
| **Khách hàng** | `khachhang@shopee.vn` | `123456` | Mua sắm, theo dõi đơn, Wishlist, sửa hồ sơ cá nhân |
| **Chủ Shop 1 (Thời trang)** | `shop.genz@shopee.vn` | `123456` | Quản lý thời trang GenZ, đăng tải quần áo, in vận đơn |
| **Chủ Shop 2 (Công nghệ)** | `shop.tech@shopee.vn` | `123456` | Quản lý đồ công nghệ, tai nghe, phụ kiện, in vận đơn |
| **Quản trị viên** | `admin@shopee.vn` | `admin123` | Phê duyệt shop, tạo voucher sàn, xem GMV toàn sàn |

## Cách Khởi Chạy Nhanh Bằng File Batch (Windows)

- Chạy Front-end: Click đúp vào `run-client.cmd` (mở tại `http://localhost:5173`)
- Chạy Back-end: Click đúp vào `run-server.cmd` (mở tại `http://localhost:5000`)

## Notes

- The app requires MongoDB local or MongoDB Atlas (hoặc tự động fallback sang offline mock data khi chưa kết nối MongoDB).
- Seed product images use remote Unsplash URLs.
- If client and server use different ports, update `VITE_API_URL` and `CLIENT_URL`.


