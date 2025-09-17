# Buffet Restaurant Frontend

Giao diện người dùng cho hệ thống quản lý nhà hàng buffet được xây dựng bằng React + Vite với hệ thống thông báo toast notification toàn diện.

## Tính năng

### 🔓 Khách hàng (Chưa đăng nhập)
- **Dashboard:** Trang chủ với thông tin tổng quan
- **Xem thực đơn:** Danh sách món ăn và set buffet
- **Đặt bàn trực tuyến:** Form đặt bàn với thông báo real-time

### 🔐 Admin (Đã đăng nhập)
- **Dashboard:** Biểu đồ doanh thu và thống kê
- **Quản lý thực đơn:** CRUD món ăn, danh mục, set buffet
- **Quản lý khách hàng:** Xem và chỉnh sửa thông tin khách hàng
- **Quản lý nhân viên:** CRUD nhân viên với validation
- **Quản lý bàn:** CRUD bàn ăn với trạng thái real-time
- **Quản lý đặt bàn:** Xác nhận/hủy đặt bàn
- **Quản lý đơn hàng:** Tạo, sửa, xóa đơn hàng với chi tiết món ăn
- **Quản lý hóa đơn:** Cập nhật trạng thái thanh toán
- **Báo cáo:** Thống kê doanh thu và đơn hàng

### 🎨 Giao diện & UX
- **Toast Notifications:** Thông báo thành công/lỗi cho mọi action
- **Loading States:** Hiệu ứng loading khi xử lý dữ liệu
- **Validation:** Kiểm tra dữ liệu frontend + backend
- **Responsive Design:** Tương thích mobile
- **Modern UI:** Layout sidebar + header cố định

## Công nghệ sử dụng

- **React 19** - UI Framework
- **Vite** - Build tool & dev server  
- **React Router DOM** - Client-side routing
- **React Toastify** - Toast notification system
- **Chart.js + React-Chartjs-2** - Data visualization
- **SCSS/Sass** - Advanced styling
- **React Icons** - Icon library
- **Axios** - HTTP client với interceptors

## Cài đặt & Chạy ứng dụng

```bash
# Di chuyển vào thư mục frontend
cd fe

# Cài đặt dependencies
npm install

# Chạy development server
npm run dev

# Build production
npm run build

# Preview production build
npm run preview
```

**Lưu ý:** Frontend chạy trên port 5173 (http://localhost:5173)

## Cấu trúc thư mục

```
src/
├── components/          # Shared components
│   ├── Header.jsx       # Header với auth info
│   ├── Header.scss
│   ├── Sidebar.jsx      # Navigation sidebar
│   └── Sidebar.scss
├── context/            # React Context
│   └── AuthContext.jsx # Authentication context
├── layouts/            # Layout components  
│   ├── AppLayout.jsx   # Main app layout
│   └── AppLayout.scss
├── pages/              # Page components
│   ├── admin/          # Admin-only pages
│   │   ├── AdminMenuPage.jsx    # Menu management
│   │   └── AdminMenuPage.scss
│   ├── user/           # User pages
│   │   ├── Dashboard.jsx        # User dashboard
│   │   ├── Dashboard.scss
│   │   ├── MenuPage.jsx         # Menu viewing
│   │   └── MenuPage.scss
│   ├── Login.jsx       # Login page
│   ├── Login.scss
│   ├── Dashboard.jsx   # Main dashboard
│   ├── AdminBookingsPage.jsx    # Booking management
│   ├── BookingPage.jsx          # Public booking
│   ├── EmployeesPage.jsx        # Employee management
│   ├── TablesPage.jsx           # Table management
│   ├── OrdersPage.jsx           # Order management
│   ├── InvoicesPage.jsx         # Invoice management
│   └── ReportsPage.jsx          # Reports & analytics
├── services/           # API services
│   └── api.js         # Axios instance & interceptors
├── utils/             # Utility functions
│   ├── toast.js       # Toast notification helpers
│   └── authUtils.js   # Authentication utilities
├── styles/            # Global styles
│   ├── variables.scss # SCSS variables
│   └── globals.scss   # Global styles
├── App.jsx           # Root component với ToastContainer
├── App.css
└── main.jsx          # App entry point
```

## Cấu hình

Tạo file `.env` trong thư mục `fe/`:

```env
VITE_API_URL=http://localhost:3000/api
```

## Toast Notification System

Ứng dụng sử dụng React Toastify để hiển thị thông báo:

```javascript
// Import toast utilities
import { showSuccess, showError, showLoadingToast, showValidationError } from '../utils/toast';

// Success notification
showSuccess('Đơn hàng đã được tạo thành công!');

// Error notification  
showError('Có lỗi xảy ra khi xóa món ăn');

// Loading notification with promise
showLoadingToast(
  apiCall(),
  {
    pending: 'Đang xử lý...',
    success: 'Thành công!',
    error: 'Có lỗi xảy ra!'
  }
);

// Backend validation errors
showValidationError(error.response);
```

## Hình ảnh cần thêm

Để giao diện hoàn chỉnh, bạn cần thêm các hình ảnh sau vào thư mục `public/images/`:

1. **Logo nhà hàng:** `public/images/logo.png`
2. **Background trang login:** `public/images/login-background.jpg`
3. **Hình ảnh panel trái trang login:** `public/images/login-image.jpg`

## API Integration

Frontend đã được tích hợp đầy đủ với backend:

### Authentication
- Đăng nhập/đăng xuất với JWT tokens
- Auto-refresh tokens
- Protected routes với role-based access

### HTTP Client (Axios)
- Request/Response interceptors
- Automatic token attachment
- Global error handling
- Loading states management

### CRUD Operations
- **Menu:** Món ăn, danh mục, set buffet
- **Customers:** Thông tin khách hàng
- **Employees:** Quản lý nhân viên
- **Tables:** Quản lý bàn ăn
- **Bookings:** Đặt bàn và xác nhận
- **Orders:** Đơn hàng với chi tiết món ăn
- **Invoices:** Hóa đơn và thanh toán
- **Reports:** Thống kê và báo cáo

### Real-time Features
- Toast notifications cho mọi API calls
- Loading states during data fetching
- Form validation with backend error display
- Auto-update UI after successful operations

## Chạy cùng Backend

### Cách 1: Chạy riêng biệt
```bash
# Terminal 1: Backend (từ thư mục root)
node server.js

# Terminal 2: Frontend  
cd fe
npm run dev
```

### Cách 2: Chạy đồng thời (nếu có concurrently)
```bash
# Từ thư mục root
npm start  # (nếu đã config script start)
```

### Ports
- **Backend:** http://localhost:3000
- **Frontend:** http://localhost:5173
- **API Base URL:** http://localhost:3000/api

## Tài khoản test

```
Username: admin
Password: admin123
Role: Admin (full access)
```

## Các tính năng nổi bật

### 🎯 UX/UI Improvements
- **Toast notifications** thay thế alert() cũ
- **Loading spinners** cho mọi API calls
- **Form validation** real-time
- **Error handling** từ backend hiển thị đẹp
- **Responsive design** hoạt động tốt trên mobile

### 🔧 Technical Features
- **JWT Authentication** với auto-refresh
- **Role-based routing** (admin/user)
- **API error interceptors** global
- **CRUD operations** đầy đủ cho tất cả entities
- **Chart.js integration** cho dashboard
- **SCSS variables** cho consistent theming

### 📊 Business Logic
- **Menu management** với categories và buffet sets
- **Table reservation** system
- **Order management** với detailed items
- **Invoice tracking** và payment status
- **Employee management** với roles
- **Reporting system** với charts và statistics

## Troubleshooting

### Common Issues:
1. **CORS Error:** Đảm bảo backend đang chạy trên port 3000
2. **API Not Found:** Kiểm tra VITE_API_URL trong .env
3. **Login Failed:** Verify database connection và user credentials
4. **Toast not showing:** Check ToastContainer trong App.jsx