# 🚀 HƯỚNG DẪN TRIỂN KHAI VẬN HÀNH (DEPLOYMENT & DEVOPS GUIDE)

> **Dự án:** Mini Shopee Multi-Vendor Platform  
> **Môi trường mục tiêu:** Linux VPS (Ubuntu 22.04 LTS), Nginx Reverse Proxy, Node.js PM2, Docker Container.

---

## 🛠️ 1. TRIỂN KHAI TRÊN LINUX VPS VỚI PM2 & NGINX

### Bước 1: Chuẩn Bị Môi Trường Server (Ubuntu 22.04)
```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài đặt Node.js v20 LTS và Git
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs git nginx

# Cài đặt trình quản lý tiến trình PM2 toàn cục
sudo npm install -g pm2
```

### Bước 2: Kéo Mã Nguồn & Cài Đặt Dependencies
```bash
# Clone dự án từ GitHub
git clone https://github.com/JiaysTM17/Fullstack-Ecommerce.git /var/www/mini-shopee
cd /var/www/mini-shopee

# Cài đặt thư viện Backend
cd server
npm install --production
cp .env.example .env
nano .env  # Cấu hình PORT=5000, JWT_SECRET, CLIENT_URL

# Cài đặt thư viện Frontend và Build
cd ../client
npm install
npm run build
```

### Bước 3: Khởi Chạy Backend Bằng PM2 (Cluster Mode)
```bash
cd /var/www/mini-shopee/server

# Khởi chạy ứng dụng với 2 instances cân bằng tải
pm2 start server.js --name "mini-shopee-api" -i 2

# Lưu cấu hình để tự động khởi động khi reboot server
pm2 save
pm2 startup
```

### Bước 4: Cấu Hình Nginx Làm Reverse Proxy & Phục Vụ Frontend
Tạo file cấu hình Nginx: `sudo nano /etc/nginx/sites-available/mini-shopee.conf`

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # 1. Phục vụ Frontend React SPA tĩnh (Gzip nén cao độ)
    location / {
        root /var/www/mini-shopee/client/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # 2. Chuyển tiếp các request /api sang Node.js Backend PM2
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Kích hoạt cấu hình và khởi động lại Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/mini-shopee.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Bước 5: Cấp Chứng Chỉ Bảo Mật SSL/TLS Miễn Phí (Let's Encrypt)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

## 🐳 2. TRIỂN KHAI NHANH BẰNG DOCKER COMPOSE

Tạo file `docker-compose.yml` ở thư mục gốc:

```yaml
version: '3.8'

services:
  # Database MongoDB
  database:
    image: mongo:6.0
    container_name: mini_shopee_db
    restart: always
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  # Backend REST API
  api:
    build:
      context: ./server
      dockerfile: Dockerfile
    container_name: mini_shopee_server
    restart: always
    ports:
      - "5000:5000"
    environment:
      - PORT=5000
      - MONGO_URI=mongodb://database:27017/ecommerce_mini
      - CLIENT_URL=http://localhost:5173
    depends_on:
      - database

  # Frontend Web Client
  web:
    build:
      context: ./client
      dockerfile: Dockerfile
    container_name: mini_shopee_client
    restart: always
    ports:
      - "5173:80"
    depends_on:
      - api

volumes:
  mongo_data:
```

Chạy toàn bộ cụm dịch vụ:
```bash
docker-compose up -d
```
