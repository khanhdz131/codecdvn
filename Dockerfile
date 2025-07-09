# Sử dụng image Node.js chính thức
FROM node:18

# Tạo thư mục làm việc trong container
WORKDIR /app

# Sao chép package.json trước để tối ưu cache
COPY package*.json ./

# Cài đặt thư viện
RUN npm install

# Sao chép toàn bộ source code
COPY . .

# Mở cổng 3000
EXPOSE 3000

# Chạy app
CMD ["node", "app.js"]
