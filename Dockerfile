# Sử dụng Node.js image chính thức
FROM node:18

# Tạo thư mục làm việc trong container
WORKDIR /app

# Copy file package.json và package-lock.json trước
COPY package*.json ./

# Cài đặt thư viện
RUN npm install

# Copy toàn bộ source vào
COPY . .

# Mở port 3000
EXPOSE 3000

# Lệnh chạy app
CMD ["node", "app.js"]
