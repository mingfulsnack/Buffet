# Buffet Restaurant Frontend

Giao diện người dùng cho hệ thống quản lý nhà hàng buffet được xây dựng bằng React + Vite.

## Tính năng

### 🔓 Khách hàng (Chưa đăng nhập)
- **Sidebar với 2 menu chính:**
  - Quản lý thực đơn (xem thực đơn)
  - Đặt bàn (đặt bàn trực tuyến)
- **Header:** Nút đăng nhập ở góc phải

### 🔐 Admin (Đã đăng nhập)
- **Sidebar đầy đủ:**
  - Quản Lý Thực Đơn
  - Quản Lý Khách Hàng
  - Quản Lý Nhân Viên
  - Quản Lý Bàn (đang được highlight)
  - Quản Lý Đơn Hàng
  - Báo Cáo
- **Header:** Thông tin user + nút đăng xuất

### 🎨 Giao diện
- **Login Page:** Thiết kế đặc biệt với background image và form 2 panel
- **Layout:** Sidebar cố định bên trái + Header cố định trên cùng
- **Responsive:** Tương thích mobile

## Công nghệ sử dụng

- **React 18** - UI Framework
- **Vite** - Build tool & dev server
- **React Router** - Routing
- **SCSS** - Styling
- **React Icons** - Icons
- **Axios** - HTTP client

## Cài đặt

```bash
# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build
```

## Cấu trúc thư mục

```
src/
├── components/          # Shared components
│   ├── Header.jsx
│   ├── Header.scss
│   ├── Sidebar.jsx
│   └── Sidebar.scss
├── context/            # React Context
│   └── AuthContext.jsx
├── layouts/            # Layout components
│   ├── AppLayout.jsx
│   └── AppLayout.scss
├── pages/              # Page components
│   ├── Login.jsx
│   ├── Login.scss
│   ├── Dashboard.jsx
│   ├── MenuPage.jsx
│   ├── BookingPage.jsx
│   └── TablesPage.jsx
├── services/           # API services
│   └── api.js
├── styles/             # Global styles
│   ├── variables.scss
│   └── globals.scss
├── App.jsx
└── main.jsx
```

## Cấu hình

Tạo file `.env` với:

```env
VITE_API_URL=http://localhost:3000/api
```

## Hình ảnh cần thêm

Để giao diện hoàn chỉnh, bạn cần thêm các hình ảnh sau vào thư mục `public/images/`:

1. **Logo nhà hàng:** `public/images/logo.png`
2. **Background trang login:** `public/images/login-background.jpg`
3. **Hình ảnh panel trái trang login:** `public/images/login-image.jpg`

## API Integration

Frontend đã được tích hợp sẵn với backend qua:
- Authentication (đăng nhập/đăng xuất)
- Protected routes (phân quyền)
- API interceptors (tự động thêm token, xử lý lỗi)

## Chạy cùng Backend

1. Khởi động backend: `cd .. && node server.js`
2. Khởi động frontend: `npm run dev`
3. Truy cập: http://localhost:5173

## Tài khoản test

- **Username:** admin
- **Password:** admin123
- **Role:** Admin (có quyền truy cập đầy đủ)