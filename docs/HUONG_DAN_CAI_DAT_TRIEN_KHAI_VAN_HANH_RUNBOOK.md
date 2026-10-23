# TÀI LIỆU HƯỚNG DẪN CÀI ĐẶT, TRIỂN KHAI & VẬN HÀNH (DEVOPS RUNBOOK)
## DỰ ÁN: NỀN TẢNG THƯƠNG MẠI ĐIỆN TỬ MINI SHOPEE MULTI-VENDOR
**Mã tài liệu:** `OPS-MINISHOPEE-V2.0` | **Phiên bản:** `2.0.0 Enterprise` | **Ngày ban hành:** `2026-10-23`

---

## MỤC LỤC
1. [Yêu Cầu Môi Trường & Hạ Tầng Kỹ Thuật (System Prerequisites)](#1-yêu-cầu-môi-trường--hạ-tầng-kỹ-thuật-system-prerequisites)
2. [Cấu Trúc Tệp Tin & Thư Mục Dự Án](#2-cấu-trúc-tệp-tin--thư-mục-dự-án)
3. [Bảng Cấu Hình Biến Môi Trường (.env Configuration)](#3-bảng-cấu-hình-biến-môi-trường-env-configuration)
4. [Hướng Dẫn Cài Đặt & Chạy Môi Trường Phát Triển (Development Setup)](#4-hướng-dẫn-cài-đặt--chạy-môi-trường-phát-triển-development-setup)
5. [Hướng Dẫn Đóng Gói & Triển Khai Production (Production Deployment)](#5-hướng-dẫn-đóng-gói--triển-khai-production-production-deployment)
6. [Triển Khai Bằng Docker & Docker Compose](#6-triển-khai-bằng-docker--docker-compose)
7. [Cấu Hình Máy Chủ Web Nginx & Chứng Chỉ SSL HTTPS](#7-cấu-hình-máy-chủ-web-nginx--chứng-chỉ-ssl-https)
8. [Quy Trình Sao Lưu & Khôi Phục Dữ Liệu Sự Cố (Backup & Disaster Recovery)](#8-quy-trình-sao-lưu--khôi-phục-dữ-liệu-sự-cố-backup--disaster-recovery)
9. [Sổ Tay Xử Lý Sự Cố Thường Gặp (Troubleshooting Playbook)](#9-sổ-tay-xử-lý-sự-cố-thường-gặp-troubleshooting-playbook)

---

## 1. YÊU CẦU MÔI TRƯỜNG & HẠ TẦNG KỸ THUẬT (SYSTEM PREREQUISITES)

### 1.1. Cấu hình phần cứng tối thiểu & khuyến nghị
| Thành Phần | Cấu Hình Tối Thiểu (Testing/Dev) | Cấu Hình Khuyến Nghị (Production) |
| :--- | :--- | :--- |
| **Hệ Điều Hành** | Windows 10/11, Ubuntu 20.04+, macOS | Ubuntu 22.04 LTS / Debian 12 / RHEL 9 |
| **CPU (Vi xử lý)** | 2 Cores | 4 - 8 Cores (x86_64 hoặc ARM64) |
| **RAM (Bộ nhớ)** | 4 GB RAM | 8 GB - 16 GB RAM |
| **Ổ Cứng (SSD)** | 20 GB dung lượng trống | 50 GB - 100 GB NVMe SSD |
| **Băng Thông Mạng** | 10 Mbps | 100 Mbps - 1 Gbps kèm IP tĩnh |

### 1.2. Môi trường phần mềm yêu cầu
- **Node.js:** Phiên bản `v18.x` hoặc `v20.x LTS` (Khuyến nghị: Node.js 20.12+)
- **NPM:** Phiên bản `v9.x` hoặc `v10.x`
- **Docker & Docker Compose (Tùy chọn container):** Docker Engine `v24.x+`, Compose `v2.x+`
- **Nginx (Tùy chọn Reverse Proxy):** Phiên bản `1.22+`

---

## 2. CẤU TRÚC TỆP TIN & THƯ MỤC DỰ ÁN

```
Website-Thuong-Mai-Dien-Tu-Mini-Plan/
├── client/                     # Mã nguồn Frontend React 18 SPA + Vite
│   ├── src/
│   │   ├── components/         # Giao diện UI, Modals, Header, Footer
│   │   ├── context/            # AuthContext, CartContext, ThemeContext
│   │   ├── pages/              # Trang Khách hàng, Seller Center, Admin Portal
│   │   ├── services/           # aiAlgorithms.js (Dual-Parity), api.js
│   │   └── styles/             # Modular CSS & theme.css (Design tokens)
│   ├── package.json
│   └── vite.config.js
├── server/                     # Mã nguồn Backend Node.js / Express REST API
│   ├── src/
│   │   ├── controllers/        # Điều phối nghiệp vụ và dữ liệu
│   │   ├── middlewares/        # JWT Auth, Rate Limiter, Error Handler
│   │   ├── models/             # In-Memory Store, Order, Product, Shop
│   │   └── utils/              # 86 Phase thuật toán doanh nghiệp
│   ├── data/                   # store.json (Tệp lưu trữ bền vững)
│   ├── package.json
│   └── server.js
├── tests/                      # Bộ kiểm thử tự động 4 Tầng (3,055 tests)
│   ├── run-all.js              # Script thực thi toàn bộ kiểm thử
│   ├── tier1_features/         # Kiểm thử tính năng và thuật toán
│   ├── tier2_boundaries/       # Kiểm thử ràng buộc biên
│   ├── tier3_combinations/     # Kiểm thử tương tác chéo
│   └── tier4_scenarios/        # Kiểm thử hành trình thực tế E2E
├── docs/                       # Toàn bộ hồ sơ báo cáo kỹ thuật & bàn giao
├── docker-compose.yml          # Cấu hình container đa dịch vụ
└── README.md                   # Chỉ mục tài liệu và tổng quan dự án
```

---

## 3. BẢNG CẤU HÌNH BIẾN MÔI TRƯỜNG (.ENV CONFIGURATION)

### 3.1. Cấu hình Backend (`server/.env`)
Tạo tệp `server/.env` dựa trên `server/.env.example`:
```env
# Cổng lắng nghe của Express Server
PORT=5000

# Môi trường chạy (development | test | production)
NODE_ENV=production

# Khóa bí mật ký mã hóa JWT Token (Bắt buộc thay đổi chuỗi ngẫu nhiên phức tạp)
JWT_SECRET=super_secret_enterprise_jwt_key_shopee_2026_min_32_chars

# Thời hạn sống của Access Token
JWT_EXPIRES_IN=7d

# Địa chỉ nguồn được phép gọi CORS
CLIENT_URL=http://localhost:5173

# Cấu hình lưu trữ tệp bền vững
STORE_FILE_PATH=./data/store.json

# Cấu hình MongoDB (Nếu chuyển đổi từ In-Memory sang MongoDB Cluster vật lý)
MONGO_URI=mongodb://localhost:27017/mini_shopee_db
USE_MONGO_PERSISTENCE=false

# Cấu hình Token Bucket Rate Limiter
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=120
```

### 3.2. Cấu hình Frontend (`client/.env`)
Tạo tệp `client/.env`:
```env
# Địa chỉ URL của Backend API Gateway
VITE_API_URL=http://localhost:5000/api

# Bật tính năng gỡ lỗi AI Copilot trong Console (true | false)
VITE_ENABLE_AI_DEBUG=false
```

---

## 4. HƯỚNG DẪN CÀI ĐẶT & CHẠY MÔI TRƯỜNG PHÁT TRIỂN (DEVELOPMENT SETUP)

### Bước 1: Sao chép mã nguồn và kiểm tra phiên bản
```bash
git clone <repository_url>
cd Website-Thuong-Mai-Dien-Tu-Mini-Plan
node -v   # Phải là v18+ hoặc v20+
npm -v
```

### Bước 2: Cài đặt thư viện phụ thuộc (Dependencies)
```bash
# Cài đặt thư viện Backend
cd server
npm install

# Cài đặt thư viện Frontend
cd ../client
npm install
cd ..
```

### Bước 3: Chạy bộ kiểm tra tự động (Khuyến nghị trước khi khởi động)
```bash
npm test
```
*Kỳ vọng: Toàn bộ 3.055 tests vượt qua 100% trong vòng dưới 2 giây.*

### Bước 4: Khởi động hệ thống phát triển
- **Khởi động Backend (Port 5000):**
  ```bash
  cd server
  npm run dev
  # hoặc dùng script trên Windows: ..\run-server.cmd
  ```
- **Khởi động Frontend (Port 5173):** Mở cửa sổ terminal thứ 2:
  ```bash
  cd client
  npm run dev
  # hoặc dùng script trên Windows: ..\run-client.cmd
  ```
- Truy cập trình duyệt: `http://localhost:5173` để trải nghiệm nền tảng.

---

## 5. HƯỚNG DẪN ĐÓNG GÓI & TRIỂN KHAI PRODUCTION (PRODUCTION DEPLOYMENT)

### 5.1. Biên dịch tối ưu hóa Frontend Client
```bash
cd client
npm run build
```
Thư mục `client/dist/` được sinh ra chứa toàn bộ mã nguồn HTML/CSS/JS đã nén và sẵn sàng để phân phối tĩnh qua Nginx.

### 5.2. Quản lý tiến trình Backend bằng PM2 (Process Manager)
Trên máy chủ Linux Production, cài đặt PM2 để giám sát và tự động khởi động lại khi có sự cố:
```bash
npm install -g pm2

# Khởi động Backend với 2 tiến trình cân bằng tải cluster
cd server
pm2 start server.js --name "mini-shopee-backend" -i 2 --env NODE_ENV=production

# Lưu cấu hình tự khởi động cùng hệ điều hành
pm2 save
pm2 startup
```

---

## 6. TRIỂN KHAI BẰNG DOCKER & DOCKER COMPOSE

Dự án cung cấp sẵn cấu hình Docker hóa toàn diện, giúp triển khai 1-click trên mọi hạ tầng đám mây (AWS EC2, Google Cloud Compute, DigitalOcean Droplet, v.v.):

```bash
# Khởi động toàn bộ cụm dịch vụ trong chế độ ngầm (Detached)
docker-compose up -d --build

# Kiểm tra trạng thái các container đang chạy
docker-compose ps

# Xem nhật ký hoạt động (Logs)
docker-compose logs -f backend
```

---

## 7. CẤU HÌNH MÁY CHỦ WEB NGINX & CHỨNG CHỈ SSL HTTPS

Tạo tệp cấu hình `/etc/nginx/sites-available/mini-shopee.conf`:
```nginx
server {
    listen 80;
    server_name shopee.yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name shopee.yourdomain.com;

    # Chứng chỉ bảo mật SSL Let's Encrypt
    ssl_certificate /etc/letsencrypt/live/shopee.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/shopee.yourdomain.com/privkey.pem;

    # Giao diện Frontend Client
    location / {
        root /var/www/mini-shopee/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Chuyển tiếp API Gateway đến Backend Node.js
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```
Kích hoạt cấu hình và kiểm tra:
```bash
sudo ln -s /etc/nginx/sites-available/mini-shopee.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 8. QUY TRÌNH SAO LƯU & KHÔI PHỤC DỮ LIỆU SỰ CỐ (BACKUP & DISASTER RECOVERY)

### 8.1. Chính sách sao lưu tự động định kỳ
Dữ liệu đơn hàng, người dùng và số dư ví được lưu giữ an toàn tại `server/data/store.json`. Thiết lập sao lưu tự động hàng ngày bằng Cron Job:
```bash
# Mở bảng lập lịch crontab
crontab -e

# Thêm lệnh sao lưu vào lúc 02:00 sáng mỗi ngày
0 2 * * * cp /var/www/mini-shopee/server/data/store.json /var/backups/mini-shopee/store_$(date +\%Y\%m\%d).json
```

### 8.2. Quy trình khôi phục dữ liệu khẩn cấp
Khi xảy ra sự cố phần cứng hoặc lỗi dữ liệu:
1. Tạm dừng tiến trình máy chủ: `pm2 stop mini-shopee-backend`
2. Sao chép bản backup gần nhất vào thư mục hoạt động:
   ```bash
   cp /var/backups/mini-shopee/store_YYYYMMDD.json /var/www/mini-shopee/server/data/store.json
   ```
3. Khởi động lại dịch vụ: `pm2 start mini-shopee-backend`
4. Kiểm tra tính toàn vẹn dữ liệu qua API Admin: `curl -H "Authorization: Bearer <TOKEN>" https://shopee.yourdomain.com/api/admin/metrics`

---

## 9. SỔ TAY XỬ LÝ SỰ CỐ THƯỜNG GẶP (TROUBLESHOOTING PLAYBOOK)

| Tình Trạng Lỗi | Nguyên Nhân Gây Ra | Cách Khắc Phục Chuẩn |
| :--- | :--- | :--- |
| **Lỗi `EADDRINUSE: port 5000`** | Cổng 5000 đang bị chiếm giữ bởi tiến trình khác | Tìm PID qua `netstat -ano \| findstr :5000` (Win) hoặc `lsof -i :5000` (Linux) và giải phóng tiến trình |
| **Lỗi `429 Too Many Requests`** | Token Bucket chặn do gửi yêu cầu quá tần suất | Đợi 5 giây để xô token tự động hồi phục hoặc nâng tham số `RATE_LIMIT_MAX_REQUESTS` trong `.env` |
| **Lỗi CORS khi gọi API** | URL của client khác với cấu hình `CLIENT_URL` trên server | Cập nhật chính xác `CLIENT_URL=http://your-frontend-domain` trong `server/.env` và khởi động lại server |
| **Không tải được dữ liệu cũ sau khởi động** | Quyền ghi tệp thư mục `server/data/` bị khóa | Cấp quyền đọc/ghi cho thư mục dữ liệu: `chmod -R 775 server/data/` |
| **Mất kết nối mạng tạm thời (Offline)** | Mạng người dùng chập chờn | Hệ thống tự động kích hoạt bộ đệm CRDT Cart và LRU Cache để lưu trữ giỏ hàng ngoại tuyến |

---
*Tài liệu hướng dẫn triển khai và vận hành này được bàn giao cho bộ phận Quản trị Hệ thống (DevOps/SysAdmin) của Khách hàng.*
