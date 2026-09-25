# KẾ HOẠCH DỰ ÁN: WEBSITE THƯƠNG MẠI ĐIỆN TỬ MINI

## 1. Tổng quan dự án

### 1.1. Tên dự án

**Mini Shopee - Website Thương Mại Điện Tử Full-stack JavaScript**

### 1.2. Mô tả ngắn

Dự án xây dựng một website mua sắm trực tuyến phiên bản mini, cho phép người dùng xem danh sách sản phẩm, tìm kiếm, lọc sản phẩm, xem chi tiết sản phẩm, thêm sản phẩm vào giỏ hàng, cập nhật số lượng, xóa sản phẩm khỏi giỏ và gửi form thanh toán cơ bản.

Hệ thống gồm:

- **Front-end:** React JS, HTML, CSS hoặc Bootstrap/Tailwind.
- **Back-end:** Node.js, Express.js.
- **Database:** MongoDB.
- **API:** RESTful API phục vụ danh sách sản phẩm và đơn hàng.
- **State:** Quản lý giỏ hàng bằng React state, Context API hoặc Redux Toolkit.
- **Storage phía client:** localStorage để lưu giỏ hàng tạm thời.

### 1.3. Mục tiêu học tập

Sau khi hoàn thành dự án, người thực hiện có thể:

- Xây dựng giao diện web bán hàng bằng React.
- Tách component front-end rõ ràng.
- Gọi API từ front-end bằng fetch hoặc Axios.
- Xây dựng REST API bằng Express.
- Kết nối Node.js với MongoDB bằng Mongoose.
- Thiết kế schema sản phẩm và đơn hàng.
- Xử lý logic giỏ hàng động.
- Validate form thanh toán.
- Hiển thị loading, error, empty state.
- Tổ chức code full-stack theo cấu trúc thực tế.
- Có một sản phẩm đủ tốt để đưa vào portfolio.

### 1.4. Đối tượng người dùng

Người dùng chính của website:

- Khách hàng truy cập website để xem sản phẩm.
- Người muốn mua sản phẩm nhanh mà không cần đăng nhập ở phiên bản MVP.
- Người quản trị sản phẩm ở phiên bản mở rộng.

### 1.5. Kết quả đầu ra

Một website thương mại điện tử mini có các chức năng:

- Trang danh sách sản phẩm.
- Trang chi tiết sản phẩm.
- Giỏ hàng động.
- Trang thanh toán.
- API sản phẩm.
- API tạo đơn hàng.
- Dữ liệu sản phẩm được lưu trong MongoDB.
- Giao diện responsive trên desktop và mobile.

---

## 2. Phạm vi dự án

### 2.1. Phạm vi MVP

Phiên bản MVP cần có:

- Hiển thị danh sách sản phẩm từ API.
- Hiển thị chi tiết sản phẩm.
- Thêm sản phẩm vào giỏ hàng.
- Cập nhật số lượng sản phẩm trong giỏ.
- Xóa sản phẩm khỏi giỏ.
- Tính tổng tiền.
- Lưu giỏ hàng vào localStorage.
- Form thanh toán cơ bản.
- Gửi đơn hàng lên server.
- Lưu đơn hàng vào MongoDB.
- Hiển thị thông báo đặt hàng thành công.

### 2.2. Ngoài phạm vi MVP

Các chức năng chưa bắt buộc ở phiên bản đầu:

- Đăng nhập, đăng ký.
- Thanh toán online thật.
- Tích hợp cổng thanh toán.
- Chat realtime.
- Voucher, mã giảm giá nâng cao.
- Phân quyền admin hoàn chỉnh.
- Upload ảnh thật lên cloud.
- Theo dõi vận chuyển.
- Đánh giá sản phẩm.

### 2.3. Phiên bản nâng cao

Sau MVP có thể mở rộng:

- Đăng ký, đăng nhập bằng JWT.
- Trang admin quản lý sản phẩm.
- Trang admin quản lý đơn hàng.
- Lịch sử mua hàng của user.
- Tìm kiếm nâng cao.
- Lọc theo giá, danh mục, thương hiệu.
- Sắp xếp theo giá, bán chạy, mới nhất.
- Phân trang hoặc infinite scroll.
- Wishlist.
- Voucher.
- Tồn kho.
- Dashboard doanh thu.

---

## 3. Công nghệ đề xuất

### 3.1. Front-end

Khuyến nghị:

- React JS.
- React Router DOM.
- Axios hoặc fetch.
- Context API cho giỏ hàng.
- CSS Modules, Tailwind CSS hoặc Bootstrap.
- React Hook Form hoặc validate thủ công.
- Vite để tạo project React nhanh.

Lý do chọn React:

- Phù hợp với dự án thương mại điện tử có nhiều component.
- Quản lý state thuận tiện.
- Dễ chia layout thành Header, ProductCard, CartItem, CheckoutForm.
- Sát với yêu cầu tuyển dụng front-end/full-stack hiện nay.

### 3.2. Back-end

Khuyến nghị:

- Node.js.
- Express.js.
- Mongoose.
- dotenv.
- cors.
- morgan.
- express-validator hoặc zod, nếu muốn validate chuyên nghiệp hơn.

Back-end chịu trách nhiệm:

- Kết nối MongoDB.
- Định nghĩa model Product.
- Định nghĩa model Order.
- Cung cấp API sản phẩm.
- Nhận dữ liệu đơn hàng.
- Validate dữ liệu đầu vào.
- Trả lỗi rõ ràng cho front-end.

### 3.3. Database

Khuyến nghị:

- MongoDB Atlas cho môi trường online.
- MongoDB local cho giai đoạn học và phát triển.
- Mongoose để định nghĩa schema.

### 3.4. Công cụ phát triển

- VS Code.
- Git.
- GitHub.
- Postman hoặc Thunder Client.
- MongoDB Compass.
- Chrome DevTools.
- npm hoặc pnpm.

---

## 4. Kiến trúc tổng thể

### 4.1. Mô hình hoạt động

Front-end React gửi request đến Express API. Express xử lý request, truy vấn MongoDB thông qua Mongoose, sau đó trả JSON về cho front-end.

Luồng cơ bản:

```txt
React UI
  -> gọi API bằng Axios/fetch
    -> Express route
      -> Controller
        -> Mongoose model
          -> MongoDB
        <- dữ liệu
      <- JSON response
  <- render giao diện
```

### 4.2. Kiến trúc thư mục đề xuất

```txt
ecommerce-mini/
├── client/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   │   ├── Header.jsx
│   │   │   ├── Footer.jsx
│   │   │   ├── ProductCard.jsx
│   │   │   ├── ProductGrid.jsx
│   │   │   ├── CartItem.jsx
│   │   │   ├── QuantityControl.jsx
│   │   │   ├── CheckoutForm.jsx
│   │   │   ├── Loading.jsx
│   │   │   └── EmptyState.jsx
│   │   ├── context/
│   │   │   └── CartContext.jsx
│   │   ├── hooks/
│   │   │   ├── useProducts.js
│   │   │   └── useLocalStorage.js
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── ProductDetailPage.jsx
│   │   │   ├── CartPage.jsx
│   │   │   ├── CheckoutPage.jsx
│   │   │   ├── OrderSuccessPage.jsx
│   │   │   └── NotFoundPage.jsx
│   │   ├── services/
│   │   │   ├── api.js
│   │   │   ├── productService.js
│   │   │   └── orderService.js
│   │   ├── utils/
│   │   │   ├── formatCurrency.js
│   │   │   └── validators.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── .env
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js
│   │   ├── controllers/
│   │   │   ├── productController.js
│   │   │   └── orderController.js
│   │   ├── models/
│   │   │   ├── Product.js
│   │   │   └── Order.js
│   │   ├── routes/
│   │   │   ├── productRoutes.js
│   │   │   └── orderRoutes.js
│   │   ├── middlewares/
│   │   │   ├── errorHandler.js
│   │   │   └── notFound.js
│   │   ├── seed/
│   │   │   └── productSeed.js
│   │   ├── utils/
│   │   │   └── response.js
│   │   └── app.js
│   ├── server.js
│   ├── .env
│   └── package.json
│
├── README.md
└── .gitignore
```

---

## 5. Chức năng chi tiết

## 5.1. Trang chủ và danh sách sản phẩm

### Mục tiêu

Hiển thị danh sách sản phẩm để người dùng duyệt và chọn mua.

### Thành phần giao diện

- Header.
- Logo.
- Thanh tìm kiếm.
- Icon giỏ hàng kèm số lượng sản phẩm.
- Bộ lọc danh mục.
- Bộ sắp xếp.
- Lưới sản phẩm.
- Footer.

### Product card cần có

- Ảnh sản phẩm.
- Tên sản phẩm.
- Giá sản phẩm.
- Giá gốc, nếu có.
- Badge giảm giá, nếu có.
- Đánh giá sao.
- Số lượng đã bán.
- Nút thêm vào giỏ.
- Link xem chi tiết.

### Logic xử lý

- Khi vào trang, front-end gọi `GET /api/products`.
- Nếu đang tải dữ liệu, hiển thị loading.
- Nếu lỗi API, hiển thị thông báo lỗi.
- Nếu không có sản phẩm, hiển thị empty state.
- Khi bấm thêm vào giỏ, gọi hàm `addToCart(product)`.
- Cập nhật số lượng trên icon giỏ hàng.
- Lưu giỏ hàng vào localStorage.

### Tiêu chí hoàn thành

- Sản phẩm hiển thị đúng từ database.
- Giao diện không vỡ trên mobile.
- Nút thêm vào giỏ hoạt động.
- Giỏ hàng không mất khi reload trang.

---

## 5.2. Trang chi tiết sản phẩm

### Mục tiêu

Cho phép người dùng xem thông tin đầy đủ của một sản phẩm.

### Thành phần giao diện

- Ảnh lớn.
- Tên sản phẩm.
- Giá.
- Đánh giá.
- Số lượng đã bán.
- Mô tả.
- Thương hiệu.
- Danh mục.
- Tồn kho.
- Chọn số lượng.
- Nút thêm vào giỏ.
- Nút mua ngay, nếu muốn mở rộng.

### Logic xử lý

- Lấy `id` từ URL.
- Gọi `GET /api/products/:id`.
- Nếu sản phẩm không tồn tại, hiển thị trang lỗi.
- Người dùng chọn số lượng.
- Không cho chọn số lượng nhỏ hơn 1.
- Không cho chọn vượt quá tồn kho.
- Thêm sản phẩm vào giỏ với quantity đã chọn.

### Tiêu chí hoàn thành

- URL chi tiết hoạt động đúng.
- Dữ liệu chi tiết đúng với sản phẩm.
- Quantity control hoạt động ổn định.
- Thêm vào giỏ đúng số lượng.

---

## 5.3. Giỏ hàng

### Mục tiêu

Quản lý danh sách sản phẩm người dùng muốn mua.

### Thành phần giao diện

- Danh sách sản phẩm trong giỏ.
- Ảnh sản phẩm.
- Tên sản phẩm.
- Giá.
- Số lượng.
- Thành tiền từng dòng.
- Nút tăng số lượng.
- Nút giảm số lượng.
- Nút xóa.
- Tổng số sản phẩm.
- Tổng tiền.
- Nút tiếp tục mua hàng.
- Nút thanh toán.

### Logic xử lý giỏ hàng

#### Thêm sản phẩm

Nếu sản phẩm chưa có trong giỏ:

```js
{
  productId,
  name,
  price,
  image,
  quantity: 1
}
```

Nếu sản phẩm đã có:

```js
quantity = quantity + 1
```

#### Xóa sản phẩm

Xóa item khỏi mảng cart theo `productId`.

#### Tăng số lượng

Tăng quantity lên 1, nhưng không vượt tồn kho nếu có dữ liệu stock.

#### Giảm số lượng

Giảm quantity xuống 1. Nếu quantity đang là 1, có thể:

- Không cho giảm nữa.
- Hoặc hỏi xác nhận xóa.
- Hoặc xóa ngay khỏi giỏ.

Phiên bản MVP nên không cho giảm dưới 1 và có nút xóa riêng.

#### Tính tổng tiền

```js
cart.reduce((total, item) => total + item.price * item.quantity, 0)
```

#### Lưu localStorage

Mỗi khi cart thay đổi:

```js
localStorage.setItem("cart", JSON.stringify(cart))
```

Khi app khởi động:

```js
const savedCart = JSON.parse(localStorage.getItem("cart")) || []
```

### Tiêu chí hoàn thành

- Thêm sản phẩm không bị trùng dòng.
- Sản phẩm đã có trong giỏ thì tăng quantity.
- Xóa sản phẩm hoạt động.
- Tăng/giảm số lượng hoạt động.
- Tổng tiền cập nhật ngay.
- Reload trang vẫn giữ cart.

---

## 5.4. Thanh toán

### Mục tiêu

Người dùng nhập thông tin giao hàng và gửi đơn hàng.

### Thành phần giao diện

- Form thông tin khách hàng:
  - Họ tên.
  - Số điện thoại.
  - Email.
  - Địa chỉ.
  - Tỉnh/thành phố, nếu muốn mở rộng.
  - Ghi chú.
- Tóm tắt đơn hàng:
  - Danh sách sản phẩm.
  - Số lượng.
  - Tạm tính.
  - Phí giao hàng.
  - Tổng tiền.
- Nút xác nhận đặt hàng.

### Validate form

Quy tắc MVP:

- Họ tên bắt buộc.
- Số điện thoại bắt buộc.
- Số điện thoại nên có 9-11 chữ số.
- Email bắt buộc và đúng định dạng.
- Địa chỉ bắt buộc.
- Giỏ hàng không được rỗng.

### Dữ liệu gửi lên server

```js
{
  customer: {
    fullName: "Nguyen Van A",
    phone: "0909123456",
    email: "a@example.com",
    address: "123 Nguyen Trai, Quan 1, TP.HCM",
    note: "Giao gio hanh chinh"
  },
  items: [
    {
      productId: "product_id",
      name: "Ao thun nam basic",
      price: 199000,
      image: "image-url",
      quantity: 2
    }
  ],
  subtotal: 398000,
  shippingFee: 30000,
  total: 428000,
  paymentMethod: "COD"
}
```

### Sau khi đặt hàng thành công

- Gọi `POST /api/orders`.
- Server lưu order vào MongoDB.
- Front-end xóa cart khỏi localStorage.
- Điều hướng sang trang đặt hàng thành công.
- Hiển thị mã đơn hàng.

### Tiêu chí hoàn thành

- Không gửi form nếu dữ liệu sai.
- Gửi order thành công.
- Có thông báo thành công.
- Cart được xóa sau khi đặt hàng.
- Người dùng có thể quay về trang chủ.

---

## 6. Thiết kế database

## 6.1. Product schema

```js
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    slug: {
      type: String,
      required: true,
      unique: true
    },
    description: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    originalPrice: {
      type: Number,
      default: 0
    },
    image: {
      type: String,
      required: true
    },
    images: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      required: true
    },
    brand: {
      type: String,
      default: "No brand"
    },
    stock: {
      type: Number,
      default: 0
    },
    sold: {
      type: Number,
      default: 0
    },
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
)
```

## 6.2. Order schema

```js
const orderSchema = new mongoose.Schema(
  {
    customer: {
      fullName: {
        type: String,
        required: true,
        trim: true
      },
      phone: {
        type: String,
        required: true,
        trim: true
      },
      email: {
        type: String,
        required: true,
        trim: true
      },
      address: {
        type: String,
        required: true
      },
      note: {
        type: String,
        default: ""
      }
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true
        },
        name: {
          type: String,
          required: true
        },
        price: {
          type: Number,
          required: true
        },
        image: {
          type: String,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        }
      }
    ],
    subtotal: {
      type: Number,
      required: true
    },
    shippingFee: {
      type: Number,
      default: 0
    },
    total: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["COD", "BANK_TRANSFER", "MOMO", "VNPAY"],
      default: "COD"
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "shipping", "completed", "cancelled"],
      default: "pending"
    }
  },
  {
    timestamps: true
  }
)
```

---

## 7. Thiết kế API

## 7.1. Product APIs

### Lấy danh sách sản phẩm

```txt
GET /api/products
```

Query hỗ trợ:

```txt
?keyword=ao
?category=thoi-trang
?minPrice=100000
?maxPrice=500000
?sort=price_asc
?page=1
?limit=12
```

Response mẫu:

```json
{
  "success": true,
  "data": [
    {
      "_id": "product_id",
      "name": "Ao thun nam basic",
      "price": 199000,
      "image": "https://example.com/image.jpg",
      "category": "Thoi trang",
      "rating": 4.5,
      "sold": 120
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 12,
    "total": 100,
    "totalPages": 9
  }
}
```

### Lấy chi tiết sản phẩm

```txt
GET /api/products/:id
```

Response mẫu:

```json
{
  "success": true,
  "data": {
    "_id": "product_id",
    "name": "Ao thun nam basic",
    "description": "Ao thun cotton thoang mat",
    "price": 199000,
    "image": "https://example.com/image.jpg",
    "category": "Thoi trang",
    "brand": "Local Brand",
    "stock": 50,
    "rating": 4.5,
    "sold": 120
  }
}
```

### Tạo sản phẩm

```txt
POST /api/products
```

Chức năng này dành cho admin ở phiên bản mở rộng.

### Cập nhật sản phẩm

```txt
PUT /api/products/:id
```

Chức năng này dành cho admin ở phiên bản mở rộng.

### Xóa sản phẩm

```txt
DELETE /api/products/:id
```

Chức năng này dành cho admin ở phiên bản mở rộng.

## 7.2. Order APIs

### Tạo đơn hàng

```txt
POST /api/orders
```

Request body:

```json
{
  "customer": {
    "fullName": "Nguyen Van A",
    "phone": "0909123456",
    "email": "a@example.com",
    "address": "TP.HCM",
    "note": "Giao buoi sang"
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
  "subtotal": 398000,
  "shippingFee": 30000,
  "total": 428000,
  "paymentMethod": "COD"
}
```

Response mẫu:

```json
{
  "success": true,
  "message": "Dat hang thanh cong",
  "data": {
    "orderId": "order_id",
    "total": 428000,
    "status": "pending"
  }
}
```

### Lấy danh sách đơn hàng

```txt
GET /api/orders
```

Dành cho admin ở phiên bản mở rộng.

### Lấy chi tiết đơn hàng

```txt
GET /api/orders/:id
```

Dành cho admin hoặc user đăng nhập ở phiên bản mở rộng.

---

## 8. Thiết kế giao diện

## 8.1. Phong cách thiết kế

Giao diện nên lấy cảm hứng từ các sàn thương mại điện tử phổ biến nhưng giữ đơn giản:

- Màu chủ đạo: cam, trắng, xám nhạt.
- Nút mua hàng nổi bật.
- Card sản phẩm rõ ảnh, rõ giá.
- Khoảng cách hợp lý.
- Giao diện ưu tiên mobile trước.
- Header cố định hoặc dễ truy cập.
- Giỏ hàng luôn nhìn thấy được ở header.

## 8.2. Màn hình desktop

Trang chủ desktop:

- Header ngang.
- Search bar lớn ở giữa.
- Giỏ hàng bên phải.
- Sidebar filter bên trái, nếu có.
- Grid sản phẩm 4 cột.

Trang giỏ hàng desktop:

- Danh sách sản phẩm bên trái.
- Tổng đơn hàng bên phải.

Trang checkout desktop:

- Form thông tin bên trái.
- Tóm tắt đơn hàng bên phải.

## 8.3. Màn hình mobile

Trang chủ mobile:

- Header gọn.
- Search bar full width.
- Grid sản phẩm 2 cột.
- Bộ lọc có thể dùng dropdown.

Trang giỏ hàng mobile:

- Mỗi sản phẩm là một block.
- Tổng tiền nằm cuối trang.
- Nút thanh toán full width.

Trang checkout mobile:

- Form 1 cột.
- Tóm tắt đơn hàng nằm dưới form.

## 8.4. Component chính

### Header

Props/state:

- `cartCount`
- keyword tìm kiếm

Chức năng:

- Link về trang chủ.
- Search sản phẩm.
- Link sang giỏ hàng.

### ProductCard

Props:

- `product`
- `onAddToCart`

Chức năng:

- Hiển thị thông tin ngắn.
- Bấm card để sang chi tiết.
- Bấm nút để thêm giỏ hàng.

### CartItem

Props:

- `item`
- `onIncrease`
- `onDecrease`
- `onRemove`

Chức năng:

- Hiển thị sản phẩm trong giỏ.
- Cập nhật số lượng.
- Xóa khỏi giỏ.

### CheckoutForm

Props:

- `onSubmit`
- `loading`

Chức năng:

- Nhập thông tin khách hàng.
- Validate dữ liệu.
- Submit đơn hàng.

---

## 9. Quản lý state phía front-end

## 9.1. State sản phẩm

Ở mỗi trang:

- `products`
- `product`
- `loading`
- `error`
- `filters`
- `sort`
- `pagination`

## 9.2. State giỏ hàng

Nên đặt trong `CartContext`.

State:

```js
const cartState = {
  items: [],
  totalQuantity: 0,
  subtotal: 0
}
```

Actions:

- `ADD_TO_CART`
- `REMOVE_FROM_CART`
- `INCREASE_QUANTITY`
- `DECREASE_QUANTITY`
- `CLEAR_CART`
- `LOAD_CART_FROM_STORAGE`

## 9.3. Hàm tiện ích cho giỏ hàng

- `addToCart(product, quantity = 1)`
- `removeFromCart(productId)`
- `increaseQuantity(productId)`
- `decreaseQuantity(productId)`
- `clearCart()`
- `getCartTotal()`
- `getCartCount()`

---

## 10. Back-end chi tiết

## 10.1. Cấu hình server

Server cần:

- Đọc biến môi trường từ `.env`.
- Kết nối MongoDB.
- Bật CORS.
- Parse JSON body.
- Mount routes.
- Xử lý route không tồn tại.
- Xử lý lỗi tập trung.

Ví dụ `.env`:

```txt
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/ecommerce_mini
CLIENT_URL=http://localhost:5173
```

## 10.2. Middleware lỗi

Cần có:

- `notFound` cho route không tồn tại.
- `errorHandler` cho lỗi server.

Response lỗi thống nhất:

```json
{
  "success": false,
  "message": "Product not found"
}
```

## 10.3. Seed data

Cần chuẩn bị 12-24 sản phẩm mẫu.

Mỗi sản phẩm nên có:

- Tên.
- Giá.
- Ảnh.
- Mô tả.
- Danh mục.
- Thương hiệu.
- Tồn kho.
- Đã bán.
- Rating.

Danh mục gợi ý:

- Thời trang.
- Điện tử.
- Mỹ phẩm.
- Gia dụng.
- Phụ kiện.
- Sách.

---

## 11. Quy trình phát triển

## 11.1. Giai đoạn 1: Chuẩn bị dự án

Việc cần làm:

- Tạo repository Git.
- Tạo thư mục `client`.
- Tạo thư mục `server`.
- Cài dependencies.
- Tạo file `.gitignore`.
- Tạo file `.env.example`.
- Viết README ban đầu.

Dependencies front-end:

```txt
react
react-dom
react-router-dom
axios
```

Dependencies back-end:

```txt
express
mongoose
cors
dotenv
morgan
```

Dev dependencies:

```txt
nodemon
eslint
prettier
```

## 11.2. Giai đoạn 2: Back-end API sản phẩm

Việc cần làm:

- Tạo Express app.
- Kết nối MongoDB.
- Tạo Product model.
- Tạo product routes.
- Tạo product controller.
- Tạo seed data.
- Test API bằng Postman.

API cần hoàn thành:

- `GET /api/products`
- `GET /api/products/:id`

Tiêu chí:

- API trả đúng JSON.
- Trường hợp không tìm thấy sản phẩm trả 404.
- Server không crash khi lỗi.

## 11.3. Giai đoạn 3: Front-end danh sách sản phẩm

Việc cần làm:

- Tạo layout tổng.
- Tạo Header.
- Tạo ProductCard.
- Tạo ProductGrid.
- Gọi API sản phẩm.
- Hiển thị loading/error.
- Format giá VND.

Tiêu chí:

- Sản phẩm từ MongoDB hiển thị trên UI.
- Card sản phẩm rõ ràng.
- Responsive cơ bản.

## 11.4. Giai đoạn 4: Chi tiết sản phẩm

Việc cần làm:

- Cấu hình React Router.
- Tạo route `/products/:id`.
- Gọi API chi tiết sản phẩm.
- Tạo giao diện chi tiết.
- Tạo quantity selector.
- Thêm vào giỏ theo số lượng.

Tiêu chí:

- Bấm sản phẩm vào đúng trang chi tiết.
- Sản phẩm không tồn tại có fallback.
- Thêm giỏ từ trang chi tiết hoạt động.

## 11.5. Giai đoạn 5: Giỏ hàng

Việc cần làm:

- Tạo CartContext.
- Tạo reducer hoặc state handlers.
- Tạo CartPage.
- Tạo CartItem.
- Thêm logic tăng/giảm/xóa.
- Tính tổng tiền.
- Lưu localStorage.

Tiêu chí:

- Cart hoạt động toàn app.
- Reload không mất cart.
- Tổng tiền đúng.
- Empty cart hiển thị đẹp.

## 11.6. Giai đoạn 6: Checkout và Order API

Việc cần làm:

- Tạo Order model.
- Tạo order routes.
- Tạo order controller.
- Tạo CheckoutPage.
- Tạo CheckoutForm.
- Validate form.
- Gửi order lên server.
- Xóa cart sau khi thành công.

Tiêu chí:

- Không thể checkout với cart rỗng.
- Form có validate rõ ràng.
- Đơn hàng được lưu vào MongoDB.
- User thấy trang thành công.

## 11.7. Giai đoạn 7: Hoàn thiện UI/UX

Việc cần làm:

- Thêm toast thông báo.
- Thêm trạng thái loading khi đặt hàng.
- Thêm empty state.
- Thêm error state.
- Tối ưu mobile.
- Tối ưu hover/focus.
- Kiểm tra màu sắc và khoảng cách.

Tiêu chí:

- Website dùng mượt.
- Không có layout bị vỡ.
- Người dùng hiểu rõ mình đang ở bước nào.

## 11.8. Giai đoạn 8: Kiểm thử và sửa lỗi

Việc cần làm:

- Test API bằng Postman.
- Test UI thủ công.
- Test responsive.
- Test localStorage.
- Test dữ liệu sai.
- Test giỏ hàng với nhiều sản phẩm.
- Test reload trang.

Tiêu chí:

- Các luồng chính chạy ổn định.
- Không có lỗi console nghiêm trọng.
- API trả lỗi dễ hiểu.

## 11.9. Giai đoạn 9: Deploy

Gợi ý deploy:

- Front-end: Vercel hoặc Netlify.
- Back-end: Render, Railway hoặc Fly.io.
- Database: MongoDB Atlas.

Việc cần làm:

- Tạo MongoDB Atlas cluster.
- Cấu hình biến môi trường production.
- Deploy server.
- Deploy client.
- Cập nhật `VITE_API_URL`.
- Test lại toàn bộ luồng production.

---

## 12. Timeline đề xuất

### Phương án 7 ngày

Ngày 1:

- Chuẩn bị project.
- Tạo back-end cơ bản.
- Kết nối MongoDB.
- Tạo Product model.

Ngày 2:

- Tạo API sản phẩm.
- Seed dữ liệu mẫu.
- Test API.

Ngày 3:

- Tạo React app.
- Tạo layout.
- Hiển thị danh sách sản phẩm.

Ngày 4:

- Làm trang chi tiết sản phẩm.
- Làm chức năng thêm vào giỏ.

Ngày 5:

- Làm trang giỏ hàng.
- Xử lý tăng, giảm, xóa, tổng tiền.
- Lưu localStorage.

Ngày 6:

- Làm checkout.
- Tạo Order API.
- Lưu đơn hàng.

Ngày 7:

- Hoàn thiện UI.
- Test responsive.
- Sửa bug.
- Viết README.
- Chuẩn bị demo.

### Phương án 14 ngày

Tuần 1:

- Hoàn thành MVP gồm sản phẩm, chi tiết, giỏ hàng, checkout.

Tuần 2:

- Làm nâng cao: filter, sort, search, admin đơn giản, deploy, README portfolio.

---

## 13. Backlog theo độ ưu tiên

## 13.1. Must have

- Danh sách sản phẩm.
- Chi tiết sản phẩm.
- Giỏ hàng động.
- localStorage cart.
- Checkout form.
- API sản phẩm.
- API tạo đơn hàng.
- MongoDB lưu sản phẩm và đơn hàng.
- Responsive cơ bản.

## 13.2. Should have

- Search sản phẩm.
- Filter danh mục.
- Sort theo giá.
- Toast thông báo.
- Loading skeleton.
- Empty cart state.
- Order success page.

## 13.3. Could have

- Đăng nhập user.
- Trang admin sản phẩm.
- Trang admin đơn hàng.
- Wishlist.
- Voucher.
- Upload ảnh.
- Rating/review.

## 13.4. Won't have trong MVP

- Thanh toán online thật.
- Chat realtime.
- Giao vận thật.
- Đồng bộ kho nâng cao.
- Hệ thống recommendation.

---

## 14. Tiêu chí nghiệm thu

## 14.1. Front-end

- Trang chủ hiển thị sản phẩm từ API.
- Tìm kiếm hoặc lọc hoạt động nếu đã làm.
- Chi tiết sản phẩm hoạt động.
- Giỏ hàng cập nhật tức thì.
- Tổng tiền tính đúng.
- Reload trang vẫn giữ giỏ hàng.
- Checkout validate đúng.
- Giao diện responsive.

## 14.2. Back-end

- Server chạy ổn định.
- Kết nối MongoDB thành công.
- API sản phẩm trả dữ liệu đúng.
- API chi tiết trả 404 khi sản phẩm không tồn tại.
- API tạo order validate dữ liệu cơ bản.
- Lỗi được trả về dạng JSON thống nhất.

## 14.3. Database

- Product document có đầy đủ trường cần thiết.
- Order document lưu đủ customer, items, total.
- Không lưu dữ liệu rỗng hoặc sai nghiêm trọng.

## 14.4. Portfolio

- README có mô tả dự án.
- Có ảnh chụp màn hình.
- Có link demo.
- Có hướng dẫn cài đặt.
- Có danh sách công nghệ.
- Có tài khoản demo nếu có admin.

---

## 15. Checklist test thủ công

## 15.1. Test sản phẩm

- Vào trang chủ thấy danh sách sản phẩm.
- Sản phẩm có ảnh, tên, giá.
- Bấm vào sản phẩm sang trang chi tiết.
- API lỗi thì UI không trắng màn hình.

## 15.2. Test giỏ hàng

- Thêm 1 sản phẩm vào giỏ.
- Thêm cùng sản phẩm lần nữa thì quantity tăng.
- Thêm nhiều sản phẩm khác nhau.
- Tăng số lượng.
- Giảm số lượng.
- Xóa sản phẩm.
- Tổng tiền thay đổi đúng.
- Reload trang cart vẫn còn.
- Xóa hết sản phẩm thì hiện empty cart.

## 15.3. Test checkout

- Vào checkout khi cart rỗng thì bị chặn hoặc redirect.
- Submit form trống thì hiện lỗi.
- Nhập email sai thì hiện lỗi.
- Nhập số điện thoại sai thì hiện lỗi.
- Submit hợp lệ thì tạo đơn hàng.
- Sau khi thành công cart được xóa.

## 15.4. Test responsive

- Kiểm tra mobile 360px.
- Kiểm tra tablet 768px.
- Kiểm tra desktop 1440px.
- Header không bị tràn.
- Product card không vỡ.
- Nút bấm đủ lớn trên mobile.

---

## 16. Rủi ro và cách xử lý

### Rủi ro 1: Không kết nối được MongoDB

Cách xử lý:

- Kiểm tra `MONGO_URI`.
- Kiểm tra MongoDB local hoặc Atlas có đang chạy không.
- Kiểm tra IP whitelist trên Atlas.
- Log lỗi kết nối rõ ràng.

### Rủi ro 2: Front-end không gọi được API

Cách xử lý:

- Kiểm tra server có chạy không.
- Kiểm tra port.
- Kiểm tra CORS.
- Kiểm tra `VITE_API_URL`.
- Test API bằng Postman trước.

### Rủi ro 3: Giỏ hàng mất khi reload

Cách xử lý:

- Kiểm tra logic load localStorage khi app khởi động.
- Kiểm tra useEffect lưu cart khi cart thay đổi.
- Bọc JSON.parse bằng try/catch.

### Rủi ro 4: Tổng tiền sai

Cách xử lý:

- Luôn tính total từ `items`.
- Không tin total gửi từ client ở back-end.
- Back-end nên kiểm tra lại giá sản phẩm từ database ở bản nâng cao.

### Rủi ro 5: Layout vỡ trên mobile

Cách xử lý:

- Dùng responsive grid.
- Kiểm tra ảnh có `object-fit: cover`.
- Không dùng width cố định quá lớn.
- Test nhiều viewport.

---

## 17. Định hướng bảo mật

MVP chưa có đăng nhập nhưng vẫn nên lưu ý:

- Không commit file `.env`.
- Validate dữ liệu từ client.
- Không tin `total` từ client ở bản production.
- Giới hạn kích thước body request.
- Bật CORS theo domain cụ thể khi deploy.
- Dùng helmet ở bản production.
- Sanitize dữ liệu nếu có input tự do.

Khi thêm đăng nhập:

- Hash password bằng bcrypt.
- Dùng JWT.
- Lưu token cẩn thận.
- Bảo vệ route admin.
- Không trả password về client.

---

## 18. Kế hoạch mở rộng thành dự án portfolio mạnh

## 18.1. Admin dashboard

Chức năng:

- Xem tổng sản phẩm.
- Xem tổng đơn hàng.
- Xem doanh thu.
- Thêm/sửa/xóa sản phẩm.
- Cập nhật trạng thái đơn hàng.

## 18.2. Authentication

Chức năng:

- Đăng ký.
- Đăng nhập.
- Đăng xuất.
- Lưu thông tin user.
- Lịch sử đơn hàng.

## 18.3. Search và filter nâng cao

Chức năng:

- Search theo tên.
- Filter theo danh mục.
- Filter theo khoảng giá.
- Sort theo giá tăng/giảm.
- Sort theo bán chạy.
- Sort theo mới nhất.

## 18.4. Tối ưu trải nghiệm

Chức năng:

- Skeleton loading.
- Toast notification.
- Modal xác nhận xóa.
- Sticky cart summary.
- Recently viewed products.
- Related products.

## 18.5. Tối ưu kỹ thuật

Chức năng:

- Pagination.
- Index MongoDB cho search.
- Error boundary.
- Unit test cho cart reducer.
- API integration test.
- Docker compose cho local development.

---

## 19. README portfolio nên có

README nên gồm:

- Tên dự án.
- Ảnh demo.
- Link demo.
- Link API, nếu public.
- Mô tả dự án.
- Công nghệ sử dụng.
- Chức năng chính.
- Cấu trúc thư mục.
- Hướng dẫn cài đặt.
- Biến môi trường.
- API endpoints.
- Những gì đã học được.
- Hướng phát triển tiếp theo.

Ví dụ phần mô tả ngắn:

```txt
Mini Shopee is a full-stack e-commerce web application built with React, Node.js, Express, and MongoDB. It allows users to browse products, manage a shopping cart, and place basic orders.
```

---

## 20. Definition of Done

Dự án được xem là hoàn thành MVP khi:

- Người dùng xem được danh sách sản phẩm từ MongoDB.
- Người dùng xem được chi tiết sản phẩm.
- Người dùng thêm sản phẩm vào giỏ hàng.
- Người dùng cập nhật số lượng trong giỏ.
- Người dùng xóa sản phẩm khỏi giỏ.
- Tổng tiền được tính đúng.
- Giỏ hàng lưu trong localStorage.
- Người dùng điền form checkout.
- Server nhận và lưu đơn hàng vào MongoDB.
- Website có giao diện responsive.
- Không có lỗi console nghiêm trọng.
- README đủ để người khác cài và chạy dự án.

---

## 21. Lộ trình code gợi ý theo thứ tự commit

Commit 1:

```txt
Initialize client and server projects
```

Commit 2:

```txt
Configure Express server and MongoDB connection
```

Commit 3:

```txt
Add product model, routes, controllers, and seed data
```

Commit 4:

```txt
Build product listing UI
```

Commit 5:

```txt
Add product detail page
```

Commit 6:

```txt
Implement cart context and localStorage persistence
```

Commit 7:

```txt
Build cart page and quantity controls
```

Commit 8:

```txt
Add order model and checkout API
```

Commit 9:

```txt
Build checkout page and order success flow
```

Commit 10:

```txt
Polish responsive UI and update README
```

---

## 22. Kết luận

Dự án **Website Thương Mại Điện Tử Mini** là một bài tập full-stack rất đáng làm vì có đầy đủ các phần quan trọng của một ứng dụng thực tế:

- UI nhiều màn hình.
- API back-end.
- Database.
- State management.
- Form validation.
- Local storage.
- Xử lý lỗi.
- Quy trình đặt hàng.

Nếu hoàn thành tốt, đây có thể là một dự án portfolio mạnh cho vị trí Front-end Developer, Back-end Node.js Developer hoặc Full-stack JavaScript Developer.

