# Tiến độ Claude Backend Agent

**Branch:** `agent/claude-backend`
**Phạm vi:** `server/`, `docs/progress/claude-progress.md`, `AGENT_NOTES.md`

---

## Cập nhật lần cuối: 2026-09-25

### ✅ Model đã hoàn thành

| Model | File | Trạng thái |
|-------|------|-----------|
| Product | `server/src/models/Product.js` | ✅ Hoàn thành |
| Order | `server/src/models/Order.js` | ✅ Hoàn thành |

**Product schema:** name (required), slug (required, unique), description (required), price (required, min 0), originalPrice, image (required), images[], category (required), brand, stock, sold, rating (0-5), isActive, timestamps.

**Order schema:** customer{fullName, phone, email, address, note}, items[{productId ref Product, name, price, image, quantity min 1}], subtotal, shippingFee, total, paymentMethod (COD/BANK_TRANSFER/MOMO/VNPAY, default COD), status (pending/confirmed/shipping/completed/cancelled, default pending), timestamps.

### ✅ Route đã hoàn thành

| Route | Method | File |
|-------|--------|------|
| `/api/products` | GET | `server/src/routes/productRoutes.js` |
| `/api/products/:id` | GET | `server/src/routes/productRoutes.js` |
| `/api/orders` | POST | `server/src/routes/orderRoutes.js` |

### ✅ Controller hoàn thành

- `server/src/controllers/productController.js` — `getProducts`, `getProductById`
- `server/src/controllers/orderController.js` — `createOrder`

### ✅ Middleware hoàn thành

- `server/src/middlewares/errorHandler.js` — trả JSON `{success:false, message, stack}` (ẩn stack ở production)
- `server/src/middlewares/notFound.js` — trả 404 JSON cho route sai

### ✅ Config & App

- `server/src/config/db.js` — kết nối MongoDB qua `MONGO_URI`, log rõ lỗi, `process.exit(1)` nếu fail
- `server/src/app.js` — Express app: cors (origin `CLIENT_URL`), express.json, morgan (chỉ development), mount routes, notFound + errorHandler
- `server/server.js` — entry point, listen `PORT`
- `server/src/utils/response.js` — helper `sendSuccess` / `sendError` chuẩn hóa JSON

### ✅ Seed data

- `server/src/seed/productSeed.js` — 16 sản phẩm mẫu thuộc 6 danh mục (Thời trang, Điện tử, Mỹ phẩm, Gia dụng, Phụ kiện, Sách). Chạy `npm run seed`.

---

## 📡 API Contract

### 1. GET `/api/products`

Query params: `keyword`, `category`, `minPrice`, `maxPrice`, `sort` (`price_asc`|`price_desc`|`sold`|`rating`), `page` (default 1), `limit` (default 12). Chỉ trả sản phẩm `isActive: true`.

**Response 200:**
```json
{
  "success": true,
  "data": {
    "products": [{ "_id": "...", "name": "Áo thun nam basic cotton", "price": 199000, "originalPrice": 299000, "image": "...", "category": "Thời trang", "rating": 4.5, "sold": 120, "stock": 50, "isActive": true }],
    "pagination": { "page": 1, "limit": 12, "total": 16, "totalPages": 2 }
  }
}
```

**Response 500:**
```json
{ "success": false, "message": "..." }
```

### 2. GET `/api/products/:id`

**Response 200:** `{ "success": true, "data": { ...product } }`

**Response 404** (id sai định dạng ObjectId hoặc không tồn tại):
```json
{ "success": false, "message": "Product not found" }
```

### 3. POST `/api/orders`

**Request:**
```json
{
  "customer": { "fullName": "Nguyen Van A", "phone": "0909123456", "email": "a@example.com", "address": "123 Nguyen Trai, Quan 1, TP.HCM", "note": "Giao giờ hành chính" },
  "items": [{ "productId": "665f...", "name": "Áo thun nam basic cotton", "price": 199000, "image": "...", "quantity": 2 }],
  "subtotal": 398000,
  "shippingFee": 30000,
  "total": 428000,
  "paymentMethod": "COD"
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "orderId": "6660...",
    "total": 428000,
    "status": "pending",
    "message": "Order created successfully"
  }
}
```

**Response 400:**
- `{ "success": false, "message": "Customer information is required" }` — thiếu customer
- `{ "success": false, "message": "Order items cannot be empty" }` — items rỗng/không có
- `{ "success": false, "message": "Invalid email format" }`
- `{ "success": false, "message": "Phone number must be 9-11 digits" }`

---

## 🌍 Biến môi trường cần có (`server/.env`)

```txt
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_mini
CLIENT_URL=http://localhost:5173
NODE_ENV=development
```

Đã tạo `server/.env.example` (bản mẫu). Client cần set `VITE_API_URL=http://localhost:5000`.

---

## 📁 File đã tạo/sửa

```
server/
├── package.json               (express, mongoose, dotenv, cors, morgan; nodemon dev)
├── .env.example
├── .gitignore                 (node_modules, .env, *.log)
├── server.js
└── src/
    ├── app.js
    ├── config/db.js
    ├── models/Product.js
    ├── models/Order.js
    ├── controllers/productController.js
    ├── controllers/orderController.js
    ├── routes/productRoutes.js
    ├── routes/orderRoutes.js
    ├── middlewares/errorHandler.js
    ├── middlewares/notFound.js
    ├── seed/productSeed.js
    └── utils/response.js
docs/progress/claude-progress.md
```

---

## ⚠️ Vấn đề đang gặp

- Chưa chạy test thực tế do môi trường chưa cài dependencies (sẽ ghi cập nhật sau khi `npm install` + seed + start server).
- Server chưa verify bằng request thật.

## 🤝 Việc cần Integration Agent xử lý

1. **Cài dependencies và chạy server:** `cd server && npm install && cp .env.example .env && npm run seed && npm run dev` (cần MongoDB local chạy sẵn).
2. **Ghép branch:** `agent/claude-backend` → branch tích hợp. Nếu conflict thì tự resolve, **không merge ngược về phía tôi**.
3. **Client cần biết:**
   - `VITE_API_URL=http://localhost:5000`
   - Gọi `GET /api/products` nhận `{ success, data: { products, pagination } }` (lưu ý key là `products`, không phải `data` array)
   - Gọi `GET /api/products/:id` nhận `{ success, data: product }`
   - Gọi `POST /api/orders` với payload như contract trên → nhận 201 `{ success, data: { orderId, total, status } }`
4. **Đường dẫn ảnh seed** dùng Unsplash URL — nếu offline thì client cần fallback ảnh.

---

## 🔄 Cập nhật cải tiến (2026-09-25)

### Cải tiến đã áp dụng

| Hạng mục | Chi tiết | File |
|----------|---------|------|
| Server-side total | `POST /api/orders` tự tính subtotal/total, không tin client | `orderController.js` |
| Item validation chi tiết | Kiểm tra từng item: productId, name, price, image, quantity (integer ≥ 1) | `orderController.js` |
| paymentMethod whitelist | COD/BANK_TRANSFER/MOMO/VNPAY, sai thì default COD | `orderController.js` |
| JSON body limit | 100kb chống request quá lớn | `app.js` |
| CORS multi-origin | `CLIENT_URL` hỗ trợ comma-separated list | `app.js` |
| Pagination NaN guard | page ≥ 1, limit clamp 1–100 | `productController.js` |

### Endpoint update (POST /api/orders)

**Request (server tự tính subtotal & total):**
```json
{
  "customer": { "fullName": "...", "phone": "...", "email": "...", "address": "...", "note": "" },
  "items": [{ "productId": "...", "name": "...", "price": 199000, "image": "...", "quantity": 2 }],
  "shippingFee": 30000,
  "paymentMethod": "COD"
}
```

**Response 201:**
```json
{ "success": true, "data": { "orderId": "...", "total": 428000, "status": "pending", "message": "Order created successfully" } }
```

**Note:** subtotal & total trong request body bị **bỏ qua** — server tự tính từ items.

### Vấn đề môi trường làm việc (2026-09-25)

⚠️ **Agents đang share cùng working directory.** Khi agent khác checkout sang branch khác, thư mục `server/` (của tôi) biến mất khỏi filesystem. Commit đã push an toàn lên `origin/agent/claude-backend`.

**Cần Integration Agent xử lý:** Nếu mỗi agent cần working directory riêng, dùng `git worktree` hoặc mỗi agent chạy trong thư mục khác.

---

## ✅ Trạng thái verify (2026-09-25)

| Bước | Trạng thái |
|------|-----------|
| `npm install` | ✅ 123 packages, 0 vulnerabilities |
| Syntax check toàn bộ file (`node --check`) | ✅ 8/8 file pass |
| Smoke test `node server.js` | ✅ Server khởi động được |
| MongoDB local | ❌ Chưa cài/chưa chạy (không tìm thấy `mongod`, port 27017 đóng) |
| Seed data | ⏸ Chờ MongoDB |
| Test API thật | ⏸ Chờ MongoDB |

### Việc còn lại cho Integration Agent / người chạy dự án

1. **Cài & khởi động MongoDB local** (hoặc đổi `server/.env` sang MongoDB Atlas URI):
   ```
   MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/ecommerce_mini
   ```
2. Chạy seed: `cd server && npm run seed`
3. Chạy server: `cd server && npm run dev` (cần file `.env` copy từ `.env.example`)
4. Test nhanh 3 endpoint:
   - `GET http://localhost:5000/api/products`
   - `GET http://localhost:5000/api/products/<id>`
   - `POST http://localhost:5000/api/orders` (payload xem section API Contract)

### Commits đã push

- `7f24b25` — Build backend API (models, routes, controllers, middlewares, seed)
- `e038d36` — Improve backend: server-side total calc, item validation, JSON body limit, CORS multi-origin
