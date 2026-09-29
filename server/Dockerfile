# ------------------------------------------------------------
# DOCKERFILE FOR MINI SHOPEE BACKEND API (Node.js + Express)
# ------------------------------------------------------------
FROM node:20-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Cài đặt dependencies
COPY package*.json ./
RUN npm ci --only=production || npm install --production

# Sao chép mã nguồn và dữ liệu khởi tạo
COPY . .

# Mở cổng giao tiếp
EXPOSE 5000

# Biến môi trường mặc định
ENV NODE_ENV=production
ENV PORT=5000

# Khởi chạy máy chủ
CMD ["node", "server.js"]
