# ------------------------------------------------------------
# DOCKERFILE FOR MINI SHOPEE FRONTEND (React 18 + Vite + Nginx)
# ------------------------------------------------------------

# TẦNG 1: Build mã nguồn React
FROM node:20-alpine AS build

WORKDIR /app
COPY package*.json ./
RUN npm ci || npm install
COPY . .
RUN npm run build

# TẦNG 2: Phục vụ file tĩnh bằng Nginx siêu nhẹ
FROM nginx:alpine

# Sao chép bản build sang thư mục Nginx
COPY --from=build /app/dist /usr/share/nginx/html

# Cấu hình Nginx custom cho SPA và Reverse Proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
