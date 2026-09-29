# 🔌 TÀI LIỆU CHI TIẾT RESTFUL API (API DOCUMENTATION)

> **Base URL:** `http://localhost:5000/api`  
> **Định dạng dữ liệu:** `application/json`  
> **Cơ chế xác thực:** JWT Bearer Token (`Authorization: Bearer <token>`)

---

## 📑 DANH MỤC NHÓM ENDPOINTS

1. [Xác Thực & Tài Khoản (Auth API)](#1-xác-thực--tài-khoản-auth-api)
2. [Sản Phẩm (Product API)](#2-sản-phẩm-product-api)
3. [Gian Hàng (Shop API)](#3-gian-hàng-shop-api)
4. [Giỏ Hàng (Cart API)](#4-giỏ-hàng-cart-api)
5. [Đơn Hàng (Order API)](#5-đơn-hàng-order-api)
6. [Mã Giảm Giá & Voucher (Voucher API)](#6-mã-giảm-giá--voucher-voucher-api)
7. [Đánh Giá & Nhận Xét (Review API)](#7-đánh-giá--nhận-xét-review-api)
8. [Kênh Quản Lý Người Bán (Seller API)](#8-kênh-quản-lý-người-bán-seller-api)
9. [Quản Trị Hệ Thống Toàn Sàn (Admin API)](#9-quản-trị-hệ-thống-toàn-sàn-admin-api)

---

## 1. Xác Thực & Tài Khoản (Auth API)

### `POST /api/auth/register`
Đăng ký tài khoản mới.
- **Quyền truy cập:** Public
- **Request Body:**
```json
{
  "fullName": "Nguyễn Văn A",
  "email": "user@example.com",
  "password": "password123",
  "phone": "0912345678"
}
```
- **Response (201 Created):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "user_1727581234567_abc",
    "fullName": "Nguyễn Văn A",
    "email": "user@example.com",
    "role": "customer"
  }
}
```

### `POST /api/auth/login`
Đăng nhập hệ thống bằng email và mật khẩu.
- **Request Body:** `{ "email": "user@example.com", "password": "password123" }`
- **Response (200 OK):** Trả về JWT token và thông tin người dùng.

### `POST /api/auth/demo`
Đăng nhập nhanh 1-click theo vai trò (Customer, Seller Thời trang, Seller Công nghệ, Admin).
- **Request Body:** `{ "roleKey": "customer" }` (hoặc `"seller_fashion"`, `"seller_tech"`, `"admin"`)
- **Response (200 OK):** Trả về Token và User Profile đầy đủ.

### `GET /api/auth/me`
Lấy thông tin tài khoản hiện tại dựa trên Bearer Token.
- **Headers:** `Authorization: Bearer <token>`
- **Response (200 OK):** Dữ liệu tài khoản, phân quyền, số dư xu, shopId liên kết.

---

## 2. Sản Phẩm (Product API)

### `GET /api/products`
Lấy danh sách sản phẩm có phân trang, bộ lọc và sắp xếp.
- **Query Params:**
  - `keyword`: Tìm kiếm theo từ khóa
  - `category`: Lọc theo danh mục (Thời trang, Điện tử,...)
  - `minPrice`, `maxPrice`: Khoảng giá bán
  - `rating`: Đánh giá tối thiểu
  - `shopId`: Lọc sản phẩm theo gian hàng
  - `sort`: `price`, `sold`, `rating`, `createdAt`
  - `order`: `asc` hoặc `desc`
  - `page`: Trang hiện tại (Mặc định: 1)
  - `limit`: Số sản phẩm mỗi trang (Mặc định: 20)
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "products": [...],
    "pagination": { "page": 1, "limit": 20, "total": 110, "totalPages": 6 }
  }
}
```

### `GET /api/products/:id`
Lấy thông tin chi tiết một sản phẩm theo ID hoặc Slug.

### `GET /api/products/search?q=keyword`
Tìm kiếm nhanh sản phẩm theo từ khóa (hỗ trợ Live Search).

### `GET /api/products/categories/list`
Lấy danh sách các ngành hàng trên sàn kèm số lượng sản phẩm.

---

## 3. Gian Hàng (Shop API)

### `GET /api/shops`
Lấy danh sách tất cả các gian hàng chính hãng (Shopee Mall) trên sàn.

### `GET /api/shops/:id`
Lấy thông tin chi tiết gian hàng theo ID kèm thống kê số lượng sản phẩm, người theo dõi, đánh giá.

### `GET /api/shops/:id/products`
Lấy toàn bộ sản phẩm thuộc quyền phân phối của gian hàng cụ thể.

---

## 4. Giỏ Hàng (Cart API)

### `GET /api/cart`
Lấy thông tin giỏ hàng của tài khoản đang đăng nhập.
- **Headers:** `Authorization: Bearer <token>`

### `POST /api/cart`
Thêm sản phẩm vào giỏ hàng hoặc cập nhật số lượng.
- **Request Body:** `{ "productId": "prod_01", "quantity": 1 }`

### `DELETE /api/cart/:productId`
Xóa sản phẩm ra khỏi giỏ hàng.

### `DELETE /api/cart`
Xóa toàn bộ giỏ hàng (sau khi hoàn tất đặt hàng).

---

## 5. Đơn Hàng (Order API)

### `POST /api/orders`
Tạo đơn hàng mới từ giỏ hàng.
- **Request Body:**
```json
{
  "items": [
    { "productId": "prod_01", "name": "Áo thun cotton", "price": 189000, "quantity": 2, "shopId": "shop_01" }
  ],
  "customer": {
    "fullName": "Kiệt Trương",
    "phone": "0901234567",
    "address": "TP. Hồ Chí Minh"
  },
  "subtotal": 378000,
  "shippingFee": 25000,
  "discount": 30000,
  "coinDiscount": 5000,
  "total": 368000,
  "paymentMethod": "COD"
}
```
- **Response (201 Created):** Trả về mã đơn hàng (ví dụ: `orders_1727581234_abc`), mã vận đơn SPX Express, thời gian tạo.

### `GET /api/orders/mine`
Lấy toàn bộ lịch sử đơn hàng của người mua đang đăng nhập.

### `GET /api/orders/:id`
Xem chi tiết một đơn hàng, tiến trình vận chuyển (Timeline Tracking), mã vận đơn.

### `POST /api/orders/:id/cancel`
Người mua gửi yêu cầu hủy đơn hàng (hoàn lại tồn kho cho shop).

---

## 6. Mã Giảm Giá & Voucher (Voucher API)

### `GET /api/vouchers`
Lấy danh sách mã giảm giá còn hiệu lực trên toàn sàn và của các shop.

### `POST /api/vouchers/apply`
Xác thực và tính toán số tiền chiết khấu khi áp mã voucher.
- **Request Body:** `{ "code": "FREESHIP", "orderSubtotal": 350000 }`
- **Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "valid": true,
    "discountAmount": 30000,
    "voucher": { "code": "FREESHIP", "name": "Miễn Phí Vận Chuyển", "type": "shipping" }
  }
}
```

---

## 7. Đánh Giá & Nhận Xét (Review API)

### `GET /api/reviews/product/:productId`
Lấy danh sách bình luận, số sao và hình ảnh feedback của sản phẩm.

### `POST /api/reviews`
Gửi đánh giá và chấm điểm sao cho sản phẩm sau khi đã nhận hàng.

---

## 8. Kênh Quản Lý Người Bán (Seller API)
*(Yêu cầu Header `Authorization: Bearer <seller_token>`)*

### `GET /api/seller/stats`
Lấy số liệu kinh doanh: Tổng doanh thu, hoa hồng sàn (5%), doanh thu thực nhận, số đơn chờ xác nhận, số mặt hàng đang bán.

### `GET /api/seller/orders`
Lấy danh sách các đơn hàng của khách hàng gửi về cho shop.

### `PATCH /api/seller/orders/:id/status`
Chuyển đổi trạng thái đơn hàng:
- **Request Body:** `{ "status": "shipping" }` (hoặc `"completed"`, `"cancelled"`)
- Tự động đồng bộ `statusText` (`Đang giao hàng`, `Đã hoàn thành`) và phát thông báo sang phía người mua.

### `POST /api/seller/products`
Đăng bán sản phẩm mới lên sàn. Tự động liên kết đúng `shopId`, tích hợp AI phân loại danh mục.

### `PUT /api/seller/products/:id`
Cập nhật giá bán, số lượng tồn kho, hình ảnh, mô tả sản phẩm.

### `DELETE /api/seller/products/:id`
Gỡ hoặc xóa sản phẩm khỏi gian hàng.

---

## 9. Quản Trị Hệ Thống Toàn Sàn (Admin API)
*(Yêu cầu Header `Authorization: Bearer <admin_token>`)*

### `GET /api/admin/metrics`
Lấy toàn bộ chỉ số vĩ mô toàn sàn: Tổng doanh thu toàn sàn, tổng hoa hồng thu được, số lượng shop hoạt động, lượng người dùng đăng ký.

### `PATCH /api/admin/shops/:id/status`
Khóa hoặc mở khóa hoạt động kinh doanh của gian hàng vi phạm.

### `POST /api/admin/vouchers`
Phát hành mã khuyến mãi toàn sàn (Flash Sale, Siêu Sale Ngày Đôi).

### `DELETE /api/admin/vouchers/:id`
Hủy hoặc thu hồi mã khuyến mãi.

---

## 10. Mở Rộng Nghiệp Vụ Người Mua & Vận Chuyển (Buyer Experience & Logistics API)

### `GET /api/orders/:id/tracking`
Tra cứu hành trình vận chuyển thời gian thực của đơn hàng qua đơn vị vận chuyển SPX Express:
- **Header:** `Authorization: Bearer <token>`
- **Response:**
  - `trackingCode`: Mã vận đơn SPX (ví dụ: `SPXVNORD123456`)
  - `carrier`: Đơn vị vận chuyển (`SPX Express Standard`)
  - `courier`: Thông tin bưu tá (họ tên, số điện thoại, biển số xe, điểm đánh giá 4.95⭐)
  - `currentLocation`: Tọa độ GPS thời gian thực (lat, lng) và địa chỉ bưu cục hiện tại
  - `checkpoints`: Mảng tiến trình 4 giai đoạn (`confirmed`, `warehouse_pickup`, `hub_transit`, `out_for_delivery`)

### `GET /api/orders/:id/invoice`
Tạo và xuất dữ liệu hóa đơn điện tử giá trị gia tăng (E-Invoice):
- **Header:** `Authorization: Bearer <token>`
- **Response:**
  - `invoiceNumber`: Ký hiệu số hóa đơn điện tử (ví dụ: `INV-2026-ORD123`)
  - `vatRate`: Thuế suất giá trị gia tăng quy định (8% / 0.08)
  - `subtotal`: Tổng tiền hàng trước thuế
  - `vatAmount`: Tiền thuế VAT được khấu trừ
  - `totalWithVat`: Tổng tiền thanh toán đã bao gồm thuế
  - `buyerTaxCode`: Mã số thuế người mua
  - `digitalSignature`: Chữ ký điện tử bảo mật SHA-256
  - `qrCodeUrl`: Đường dẫn mã QR xác thực hóa đơn trực tuyến

### `GET /api/products/:id/questions`
Lấy danh sách các câu hỏi cộng đồng và phản hồi của người bán cho sản phẩm:
- **Response:** Mảng danh sách câu hỏi kèm câu trả lời của Shop, thời gian phản hồi và số lượt upvote hữu ích.

### `POST /api/products/:id/questions`
Người mua gửi câu hỏi thắc mắc mới về sản phẩm:
- **Header:** `Authorization: Bearer <token>` (Tùy chọn)
- **Request Body:** `{ "questionText": "Sản phẩm có sẵn hàng không shop?", "customerName": "Kiệt Trương" }`
- **Response:** Bản ghi câu hỏi mới khởi tạo (`isAnswered: false`, `upvotes: 0`).

### `POST /api/products/:id/questions/:questionId/vote`
Bình chọn (hoặc bỏ bình chọn) câu hỏi hữu ích:
- **Request Body:** `{ "userId": "usr-123" }`
- **Response:** `{ "success": true, "upvotes": 5, "hasVoted": true }`

