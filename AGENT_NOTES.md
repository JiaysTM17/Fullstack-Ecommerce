# AGENT_NOTES — Claude Backend

**Branch:** `agent/claude-backend` | **Phạm vi:** `server/`, `docs/progress/claude-progress.md`, `AGENT_NOTES.md`

## Yêu cầu với Front-end / Integration Agent

1. **Biến môi trường client:** đặt `VITE_API_URL=http://localhost:5000` trong `client/.env`.

2. **Response shape của `GET /api/products`** (quan trọng, khác default):
   ```json
   { "success": true, "data": { "products": [...], "pagination": {...} } }
   ```
   → Client đọc `res.data.data.products` và `res.data.data.pagination`.

3. **Response shape của `GET /api/products/:id`:** `{ "success": true, "data": product }`

4. **Response shape của `POST /api/orders`:** 201 `{ "success": true, "data": { "orderId, total, status, message } }`
   - Lỗi 400: `{ "success": false, "message": "..." }`
   - Sau thành công, client nên điều hướng sang trang success kèm `orderId`.

5. **Validate phía client nên khớp backend:**
   - email regex
   - phone 9–11 chữ số (backend bỏ qua space)
   - `items` không được rỗng
   - customer: fullName, phone, email, address là bắt buộc

6. **Server CORS** chỉ cho phép `CLIENT_URL` (mặc định `http://localhost:5173`). Nếu client chạy port khác, sửa `server/.env`.

7. **Seed data:** chạy `cd server && npm run seed` để nạp 16 sản phẩm mẫu. Ảnh dùng Unsplash URL (cần internet).

## Git

- Không push lên `main`/`master`.
- Nếu push `agent/claude-backend` bị conflict remote → **không tự merge**, ghi lỗi vào đây và dừng an toàn cho Integration Agent.

## Trạng thái

- Xem `docs/progress/claude-progress.md` để biết API contract chi tiết và tiến độ.

---

## Cập nhật cải tiến backend (2026-09-25)

1. **Server tự tính lại total:** `POST /api/orders` giờ tự tính `subtotal = Σ(price × quantity)` và `total = subtotal + shippingFee` từ items. Client **vẫn gửi được** subtotal/total để tương thích, nhưng server ưu tiên giá trị tự tính — chống manipulated total.

2. **Validate items chi tiết:** mỗi item cần có `productId`, `name`, `price`, `image`, `quantity` (integer ≥ 1). Thiếu/truyền sai → 400 với message nêu rõ item thứ mấy.

3. **paymentMethod whitelist:** chỉ nhận `COD | BANK_TRANSFER | MOMO | VNPAY`, giá trị lạ → mặc định về `COD`.

4. **JSON body limit 100kb:** tránh request body quá lớn.

5. **CORS multi-origin:** biến `CLIENT_URL` trong `server/.env` giờ accept comma-separated list:
   ```
   CLIENT_URL=http://localhost:5173,http://localhost:5174
   ```

6. **Pagination an toàn:** `page` parse thành integer ≥ 1, `limit` clamp về 1–100, tránh query phá page/limit lạ (`?page=abc`, `?limit=99999`).

### Nếu push bị lỗi branch conflict/remote change:
- **KHÔNG tự merge/rebase/pull --force.** Ghi lỗi vào section này và dừng, để Integration Agent xử lý.
