# 🍽️ Buffet Restaurant Management System

Hệ thống quản lý nhà hàng buffet hoàn chỉnh với backend API và frontend React, hỗ trợ đặt bàn online, quản lý thực đơn, đơn hàng, hóa đơn và báo cáo thống kê.

## 🚀 Tính năng chính

### 🔓 Chức năng công khai (Không cần đăng nhập)

- **Xem thực đơn**: Danh sách món ăn và set buffet với giá
- **Đặt bàn trực tuyến**: Form đặt bàn với token để quản lý
- **Kiểm tra đặt bàn**: Xem và hủy đặt bàn bằng token
- **Xem bàn trống**: Sơ đồ bàn theo khu vực và trạng thái

### 🔐 Chức năng quản trị (Cần đăng nhập)

- **Dashboard**: Biểu đồ doanh thu, thống kê tổng quan với Chart.js
- **Quản lý đặt bàn**: Xác nhận, hủy đặt bàn với toast notification
- **Quản lý bàn ăn**: CRUD bàn theo khu vực, cập nhật trạng thái real-time
- **Quản lý thực đơn**: CRUD món ăn, danh mục, set buffet, khuyến mãi
- **Quản lý khách hàng**: Thông tin, lịch sử, chương trình thành viên
- **Quản lý nhân viên**: CRUD nhân viên, vai trò, phân quyền hệ thống
- **Quản lý đơn hàng**: Tạo đơn hàng với chi tiết món ăn, xác nhận tạo hóa đơn
- **Quản lý hóa đơn**: Cập nhật trạng thái thanh toán, thống kê
- **Báo cáo thống kê**: Doanh thu theo ngày/tháng/năm, hiệu suất bàn

### 🎨 Giao diện & UX

- **React 19**: UI framework hiện đại với hooks và context
- **Toast Notifications**: Thông báo thành công/lỗi cho mọi action
- **Loading States**: Hiệu ứng loading khi xử lý dữ liệu
- **Form Validation**: Kiểm tra dữ liệu frontend + backend với toast hiển thị
- **Responsive Design**: Tương thích mobile, tablet
- **Modern UI**: Layout sidebar + header cố định với SCSS

### 🔒 Bảo mật & Phân quyền

- **JWT Authentication**: Access token với auto-refresh
- **Role-based Access**: Admin, Manager, Staff với quyền khác nhau
- **Protected Routes**: Frontend routes bảo vệ theo vai trò
- **Rate Limiting**: Giới hạn API calls, input validation
- **Security Headers**: Helmet, CORS, XSS protection

## �️ Công nghệ sử dụng

### Backend

- **Node.js** >= 16.x - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** >= 12.x - Database
- **JWT** - Authentication & authorization
- **Joi** - Data validation
- **Helmet** - Security middleware
- **Rate Limiting** - API protection

### Frontend

- **React 19** - UI Framework hiện đại
- **Vite** - Build tool & dev server nhanh
- **React Router DOM** - Client-side routing
- **React Toastify** - Toast notification system
- **Chart.js + React-Chartjs-2** - Data visualization
- **SCSS/Sass** - Advanced styling với variables
- **React Icons** - Icon library
- **Axios** - HTTP client với interceptors

## �📋 Yêu cầu hệ thống

- Node.js >= 16.x
- PostgreSQL >= 12.x
- npm hoặc yarn

## 🛠️ Cài đặt

### 1. Clone dự án

```bash
git clone <repository-url>
cd buffet
```

### 2. Cài đặt Backend

```bash
# Cài đặt dependencies cho backend
npm install
```

### 3. Cài đặt Frontend

```bash
# Di chuyển vào thư mục frontend và cài đặt
cd fe
npm install
cd ..
```

### 4. Cấu hình database

- Tạo database PostgreSQL với tên `buffet_restaurant`
- Chạy script SQL để tạo bảng: `scripts/init-data.sql`

### 5. Cấu hình môi trường

#### Backend (.env)

Tạo file `.env` ở thư mục gốc:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=buffet_restaurant
DB_USER=postgres
DB_PASSWORD=your_password

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3000
NODE_ENV=development
```

#### Frontend (fe/.env)

Tạo file `.env` trong thư mục `fe/`:

```env
VITE_API_URL=http://localhost:3000/api
```

### 6. Chạy ứng dụng

#### Cách 1: Chạy riêng biệt

```bash
# Terminal 1: Backend (từ thư mục root)
npm start
# hoặc
node server.js

# Terminal 2: Frontend
cd fe
npm run dev
```

#### Cách 2: Chạy cùng lúc (nếu có concurrently)

```bash
npm run dev
```

### 7. Truy cập ứng dụng

- **Backend API**: http://localhost:3000
- **Frontend**: http://localhost:5173
- **API Documentation**: http://localhost:3000/api

## 🏗️ Cấu trúc dự án

```
buffet/
├── backend (root)/
│   ├── server.js              # Entry point
│   ├── package.json           # Backend dependencies
│   ├── config/
│   │   └── database.js        # Database config
│   ├── controllers/           # Business logic
│   │   ├── authController.js  # Authentication
│   │   ├── bookingController.js # Booking management
│   │   ├── customerController.js # Customer CRUD
│   │   ├── employeeController.js # Employee & roles
│   │   ├── menuController.js    # Menu & categories
│   │   ├── tableController.js   # Tables & areas
│   │   ├── orderController.js   # Order management
│   │   ├── invoiceController.js # Invoice tracking
│   │   └── reportController.js  # Analytics & reports
│   ├── models/                # Data models
│   │   ├── BaseModel.js       # Base CRUD operations
│   │   ├── Employee.js        # Employee model
│   │   ├── Customer.js        # Customer model
│   │   ├── Table.js          # Table model
│   │   ├── Booking.js        # Booking model
│   │   ├── Menu.js           # Menu model
│   │   └── index.js          # Model exports
│   ├── routes/               # API routes
│   │   ├── auth.js           # /api/auth/*
│   │   ├── public.js         # /api/public/*
│   │   ├── bookings.js       # /api/bookings/*
│   │   ├── tables.js         # /api/tables/*
│   │   ├── menu.js           # /api/menu/*
│   │   ├── customers.js      # /api/customers/*
│   │   ├── employees.js      # /api/employees/*
│   │   ├── orderRoutes.js    # /api/orders/*
│   │   ├── invoices.js       # /api/invoices/*
│   │   └── reports.js        # /api/reports/*
│   ├── middleware/           # Express middleware
│   │   ├── auth.js          # JWT & role checking
│   │   ├── validation.js    # Joi schemas
│   │   └── upload.js        # File upload
│   ├── utils/               # Utilities
│   │   └── helpers.js       # Response formatting
│   └── scripts/             # Database scripts
│       └── init-data.sql    # Initial database setup
│
├── fe/                      # Frontend React app
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   ├── index.html          # HTML template
│   ├── src/
│   │   ├── main.jsx        # App entry point
│   │   ├── App.jsx         # Root component với ToastContainer
│   │   ├── components/     # Reusable components
│   │   │   ├── Header.jsx  # Header với auth info
│   │   │   └── Sidebar.jsx # Navigation sidebar
│   │   ├── context/        # React Context
│   │   │   └── AuthContext.jsx # Authentication state
│   │   ├── layouts/        # Layout components
│   │   │   └── AppLayout.jsx # Main app layout
│   │   ├── pages/          # Page components
│   │   │   ├── Login.jsx        # Login page
│   │   │   ├── Dashboard.jsx    # Main dashboard
│   │   │   ├── MenuPage.jsx     # Public menu view
│   │   │   ├── BookingPage.jsx  # Public booking form
│   │   │   ├── TablesPage.jsx   # Table management
│   │   │   ├── OrdersPage.jsx   # Order management
│   │   │   ├── InvoicesPage.jsx # Invoice management
│   │   │   └── ReportsPage.jsx  # Analytics & reports
│   │   ├── services/       # API integration
│   │   │   └── api.js      # Axios instance & API calls
│   │   ├── utils/          # Frontend utilities
│   │   │   └── toast.js    # Toast notification helpers
│   │   └── styles/         # Global styles
│   │       ├── variables.scss # SCSS variables
│   │       └── globals.scss   # Global styles
│   └── public/             # Static assets
│       └── images/         # Images (logo, backgrounds)
```

## 📚 API Documentation

### Base URL

```
http://localhost:3000/api
```

### Authentication

Sử dụng JWT token trong header:

```
Authorization: Bearer <token>
```

### Tài khoản test

```
Username: admin
Password: admin123
Role: Admin (full access)
```

### API Endpoints

#### 🔓 Public APIs (không cần đăng nhập)

```bash
# Xem thực đơn công khai
GET /api/public/menu

# Xem bàn trống và khu vực
GET /api/public/tables
GET /api/public/areas

# Đặt bàn (khách hàng)
POST /api/public/bookings

# Kiểm tra đặt bàn bằng token
GET /api/public/bookings/:token

# Hủy đặt bàn bằng token
PUT /api/public/bookings/:token/cancel
```

#### 🔐 Auth APIs

```bash
# Đăng nhập
POST /api/auth/login

# Lấy thông tin profile
GET /api/auth/profile

# Đổi mật khẩu
PUT /api/auth/change-password
```

#### 📋 Booking Management APIs (Admin/Manager/Staff)

```bash
# Lấy danh sách đặt bàn
GET /api/bookings

# Chi tiết đặt bàn
GET /api/bookings/:id

# Xác nhận đặt bàn
PUT /api/bookings/:id/confirm

# Hủy đặt bàn (admin)
PUT /api/bookings/:id/cancel
```

#### 🪑 Table Management APIs

```bash
# Danh sách bàn theo khu vực
GET /api/tables

# Chi tiết bàn với lịch sử
GET /api/tables/:id

# Tạo bàn mới
POST /api/tables

# Cập nhật thông tin bàn
PUT /api/tables/:id

# Cập nhật trạng thái bàn
PUT /api/tables/:id/status

# Xóa bàn
DELETE /api/tables/:id

# Quản lý khu vực/vùng
GET /api/tables/areas
POST /api/tables/areas
```

#### 🍽️ Menu Management APIs

```bash
# Danh sách món ăn (admin)
GET /api/menu/dishes
POST /api/menu/dishes
PUT /api/menu/dishes/:id
DELETE /api/menu/dishes/:id

# Quản lý danh mục
GET /api/menu/categories
POST /api/menu/categories

# Set buffet
GET /api/menu/buffet-sets
POST /api/menu/buffet-sets
PUT /api/menu/buffet-sets/:id
DELETE /api/menu/buffet-sets/:id

# Khuyến mãi
GET /api/menu/promotions
POST /api/menu/promotions
```

#### 👥 Customer Management APIs

```bash
# Danh sách khách hàng
GET /api/customers

# Tạo khách hàng mới
POST /api/customers

# Cập nhật khách hàng
PUT /api/customers/:id

# Xóa khách hàng
DELETE /api/customers/:id

# Tìm theo số điện thoại
GET /api/customers/phone/:phone

# Quản lý hạng thành viên
GET /api/customers/membership/tiers
POST /api/customers/membership/tiers
```

#### 👨‍💼 Employee Management APIs

```bash
# Danh sách nhân viên
GET /api/employees

# Chi tiết nhân viên
GET /api/employees/:id

# Tạo nhân viên mới
POST /api/employees

# Cập nhật nhân viên
PUT /api/employees/:id

# Reset mật khẩu nhân viên
PUT /api/employees/:id/reset-password

# Xóa nhân viên
DELETE /api/employees/:id

# Quản lý vai trò
GET /api/employees/roles
POST /api/employees/roles

# Quản lý quyền
GET /api/employees/permissions
POST /api/employees/permissions
PUT /api/employees/roles/:id/permissions
```

#### 🛒 Order Management APIs

```bash
# Danh sách đơn hàng
GET /api/orders

# Lấy menu để tạo đơn
GET /api/orders/menu

# Chi tiết đơn hàng
GET /api/orders/:id

# Tạo đơn hàng mới
POST /api/orders

# Cập nhật đơn hàng (thêm/bớt món)
PUT /api/orders/:id

# Xóa đơn hàng
DELETE /api/orders/:id

# Xác nhận đơn hàng (tạo hóa đơn)
POST /api/orders/:id/confirm
```

#### 🧾 Invoice Management APIs

```bash
# Danh sách hóa đơn
GET /api/invoices

# Chi tiết hóa đơn
GET /api/invoices/:id

# Cập nhật trạng thái thanh toán
PATCH /api/invoices/:id/payment-status

# Cập nhật hóa đơn
PUT /api/invoices/:id

# Thống kê hóa đơn
GET /api/invoices/stats
```

#### 📊 Reports & Analytics APIs

```bash
# Doanh thu theo ngày/tháng/năm
GET /api/reports/revenue/daily
GET /api/reports/revenue/monthly
GET /api/reports/revenue/yearly

# Thống kê tổng quan
GET /api/reports/stats/overall

# Top ngày có doanh thu cao
GET /api/reports/stats/top-revenue-days

# Báo cáo theo trạng thái thanh toán
GET /api/reports/stats/payment-status
```

### Request/Response Format

#### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": {
    // Response data
  },
  "meta": {
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10
    }
  }
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "details": ["Validation errors..."]
}
```

### API Examples

#### Tạo đơn hàng mới

```bash
POST /api/orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "maban": 5,
  "ghichu": "Khách VIP",
  "items": [
    {
      "id": 1,
      "type": "monan",
      "name": "Thịt nướng",
      "price": 150000,
      "soluong": 2
    },
    {
      "id": 2,
      "type": "setbuffet",
      "name": "Set Buffet Premium",
      "price": 199000,
      "soluong": 1
    }
  ]
}
```

#### Response tạo đơn hàng

```json
{
  "success": true,
  "message": "Tạo đơn hàng thành công",
  "data": {
    "madonhang": 123,
    "maban": 5,
    "tongtien": 499000,
    "trangthai": "Đang xử lý",
    "items": [...]
  }
}
```

## 🎨 Frontend Features & Usage

### Toast Notification System

Ứng dụng sử dụng React Toastify để hiển thị thông báo user-friendly:

```javascript
// Import toast utilities
import {
  showSuccess,
  showError,
  showLoadingToast,
  showValidationError,
} from '../utils/toast';

// Success notification
showSuccess('Đơn hàng đã được tạo thành công!');

// Error notification
showError('Có lỗi xảy ra khi xóa món ăn');

// Loading notification với promise
showLoadingToast(apiCall(), {
  pending: 'Đang xử lý...',
  success: 'Thành công!',
  error: 'Có lỗi xảy ra!',
});

// Backend validation errors
showValidationError(error.response);
```

### Chức năng chính Frontend

#### 🏠 Dashboard

- Biểu đồ doanh thu theo tháng (Chart.js)
- Thống kê tổng quan (đơn hàng, khách hàng, doanh thu)
- Widget trạng thái bàn real-time
- Quick actions cho các tác vụ thường dùng

#### 🍽️ Quản lý thực đơn

- CRUD món ăn với upload hình ảnh
- Quản lý danh mục và set buffet
- Filter theo danh mục, trạng thái
- Search món ăn theo tên
- Toast notification cho mọi thao tác

#### 🛒 Quản lý đơn hàng

- Tạo đơn hàng với giao diện intuitive
- Thêm/bớt món ăn với validation
- Tính tổng tiền tự động
- Xác nhận tạo hóa đơn
- Loading states và toast feedback

#### 🧾 Quản lý hóa đơn

- Danh sách hóa đơn với filter
- Cập nhật trạng thái thanh toán
- Xuất hóa đơn PDF (future feature)
- Thống kê theo trạng thái

#### 🪑 Quản lý bàn

- Sơ đồ bàn theo khu vực
- Cập nhật trạng thái real-time
- Drag & drop để sắp xếp
- Color coding theo trạng thái

#### � Quản lý khách hàng & nhân viên

- CRUD với form validation
- Phân quyền theo vai trò
- Search và pagination
- Export danh sách

### Frontend Architecture

#### State Management

```javascript
// AuthContext.jsx - Global auth state
const AuthContext = createContext();

// Usage trong component
const { user, login, logout } = useContext(AuthContext);
```

#### API Integration

```javascript
// services/api.js - Axios instance
const api = axios.create({
  baseURL: process.env.VITE_API_URL,
  timeout: 10000,
});

// Auto token attachment
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Global error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    showError(error.response?.data?.message || 'Có lỗi xảy ra');
    return Promise.reject(error);
  }
);
```

#### Protected Routing

```javascript
// Protected routes theo role
<Route
  path="/admin"
  element={
    <ProtectedRoute roles={['Admin', 'Manager']}>
      <AdminDashboard />
    </ProtectedRoute>
  }
/>
```

## 🔒 Phân quyền & Security

### Vai trò hệ thống

- **Admin**: Toàn quyền hệ thống (CRUD tất cả)
- **Manager**: Quản lý nhà hàng, xem báo cáo (không quản lý nhân viên)
- **Staff**: Nhân viên phục vụ (xử lý đặt bàn, đơn hàng)

### Quyền chi tiết

```javascript
// Quyền chính trong hệ thống
const permissions = {
  // Booking permissions
  'booking.create': ['Admin', 'Manager', 'Staff'],
  'booking.read': ['Admin', 'Manager', 'Staff'],
  'booking.update': ['Admin', 'Manager', 'Staff'],
  'booking.delete': ['Admin', 'Manager'],

  // Table permissions
  'table.create': ['Admin', 'Manager'],
  'table.read': ['Admin', 'Manager', 'Staff'],
  'table.update': ['Admin', 'Manager'],
  'table.delete': ['Admin', 'Manager'],

  // Menu permissions
  'menu.create': ['Admin', 'Manager'],
  'menu.read': ['Admin', 'Manager', 'Staff'],
  'menu.update': ['Admin', 'Manager'],
  'menu.delete': ['Admin', 'Manager'],

  // Customer permissions
  'customer.create': ['Admin', 'Manager', 'Staff'],
  'customer.read': ['Admin', 'Manager', 'Staff'],
  'customer.update': ['Admin', 'Manager', 'Staff'],
  'customer.delete': ['Admin', 'Manager'],

  // Employee permissions
  'employee.create': ['Admin'],
  'employee.read': ['Admin', 'Manager'],
  'employee.update': ['Admin'],
  'employee.delete': ['Admin'],

  // Order permissions
  'order.create': ['Admin', 'Manager', 'Staff'],
  'order.read': ['Admin', 'Manager', 'Staff'],
  'order.update': ['Admin', 'Manager', 'Staff'],
  'order.delete': ['Admin', 'Manager'],

  // Invoice permissions
  'invoice.read': ['Admin', 'Manager', 'Staff'],
  'invoice.update': ['Admin', 'Manager', 'Staff'],

  // Report permissions
  'report.read': ['Admin', 'Manager'],
};
```

### Security Features

#### Backend Security

- **JWT Authentication**: Access token với auto-refresh
- **Rate Limiting**: Giới hạn API calls (100 requests/15 phút)
- **Input Validation**: Joi schemas cho tất cả endpoints
- **SQL Injection Protection**: Parameterized queries
- **XSS Protection**: Helmet middleware
- **CORS**: Configured cho frontend domain
- **Password Hashing**: bcrypt với salt rounds
- **Environment Variables**: Sensitive data trong .env

#### Frontend Security

- **Protected Routes**: Role-based routing
- **Token Management**: Auto-refresh, secure storage
- **Input Sanitization**: Form validation trước khi gửi API
- **Error Handling**: Không expose sensitive data
- **HTTPS Ready**: Production configuration

## 📊 Database Schema

Hệ thống sử dụng PostgreSQL với các bảng chính:

### Core Tables

- **`vung`** - Khu vực/vùng bàn (VIP, thường, ngoài trời)
- **`ban`** - Bàn ăn với số ghế và trạng thái
- **`phieudatban`** - Phiếu đặt bàn với token quản lý
- **`khachhang`** - Khách hàng và thông tin liên hệ
- **`hangthanhvien`** - Hạng thành viên và ưu đãi

### Menu & Orders

- **`danhmucmonan`** - Danh mục món ăn (khai vị, chính, tráng miệng)
- **`monan`** - Món ăn với giá và hình ảnh
- **`setbuffet`** - Set buffet với giá theo khung giờ
- **`donhang`** - Đơn hàng của khách
- **`chitietdonhang`** - Chi tiết món ăn trong đơn hàng

### Invoicing & Payment

- **`hoadon`** - Hóa đơn thanh toán
- **`chitiethoadon`** - Chi tiết items trong hóa đơn
- **`thanhtoan`** - Lịch sử thanh toán

### Staff Management

- **`vai_tro`** - Vai trò nhân viên (Admin, Manager, Staff)
- **`quyen`** - Quyền hạn chi tiết
- **`vai_tro_quyen`** - Mapping vai trò và quyền
- **`nhanvien`** - Nhân viên với thông tin và credentials

### Relationships

```sql
-- Key relationships
phieudatban.makhachhang → khachhang.makhachhang
phieudatban.maban → ban.maban
ban.mavung → vung.mavung
monan.madanhmuc → danhmucmonan.madanhmuc
donhang.maban → ban.maban
chitietdonhang.madonhang → donhang.madonhang
hoadon.madonhang → donhang.madonhang
nhanvien.mavaitro → vai_tro.mavaitro
```

### Indexes & Performance

- Primary keys trên tất cả bảng
- Foreign key indexes cho joins
- Search indexes cho tên món ăn, khách hàng
- Date indexes cho báo cáo theo thời gian
- Unique constraints cho username, email, token

## 🌟 Tính năng nổi bật

### Backend Features

- **Booking Token System**: Mỗi đặt bàn có token unique cho khách hàng quản lý
- **Optimistic Locking**: Cập nhật trạng thái bàn với race condition handling
- **Base Model Pattern**: CRUD operations tái sử dụng cho tất cả models
- **Transaction Support**: Database transactions cho operations phức tạp
- **Pagination**: Hỗ trợ phân trang cho tất cả list APIs
- **Search & Filter**: Advanced filtering với multiple conditions
- **Soft Delete**: Logical delete cho data integrity
- **Audit Trail**: Track created/updated timestamps
- **Role-based Permissions**: Dynamic permission checking

### Frontend Features

- **React 19**: Latest React với concurrent features
- **Toast Notifications**: User-friendly feedback thay thế alert()
- **Loading States**: Professional loading experience
- **Form Validation**: Real-time validation với backend integration
- **Responsive Design**: Mobile-first design approach
- **Chart.js Integration**: Interactive charts cho dashboard
- **Context API**: Global state management
- **Protected Routing**: Role-based access control
- **Optimistic Updates**: UI updates before API confirmation
- **Error Boundaries**: Graceful error handling

### Performance Optimizations

- **Database Connection Pooling**: Efficient DB connections
- **Indexed Queries**: Optimized database queries
- **API Pagination**: Limit data transfer
- **Lazy Loading**: Code splitting cho frontend
- **HTTP Interceptors**: Global request/response handling
- **Caching Strategy**: API response caching
- **Bundle Optimization**: Vite build optimizations

### Developer Experience

- **Hot Module Replacement**: Fast development với Vite
- **Environment Configuration**: Separate configs cho dev/prod
- **Error Logging**: Comprehensive error logging
- **API Documentation**: Self-documenting API endpoints
- **Code Organization**: Clean architecture patterns
- **Git Hooks**: Pre-commit validation (future)
- **Docker Support**: Containerization ready (future)

### Business Logic

- **Multi-language Support**: Vietnamese/English ready
- **Currency Formatting**: VND formatting với proper localization
- **Date/Time Handling**: Timezone-aware operations
- **Membership Tiers**: Customer loyalty program
- **Promotion System**: Flexible discount management
- **Reporting Analytics**: Business intelligence dashboards
- **Order Management**: Complete order lifecycle
- **Invoice Tracking**: Payment status management

## 🚀 Deployment

### Development Environment

```bash
# Chạy development mode
npm run dev

# Check database connection
node check-data.js

# Test models
node test-models.js

# Initialize database
psql -U postgres -d buffet_restaurant -f scripts/init-data.sql
```

### Production Setup

#### Backend Production

1. **Environment Configuration**

```bash
# .env production settings
NODE_ENV=production
PORT=3000
DB_HOST=your-production-db-host
DB_SSL=true
JWT_SECRET=production-secret-key
```

2. **Database Setup**

```bash
# Create production database
createdb buffet_restaurant_prod

# Run migrations
psql -d buffet_restaurant_prod -f scripts/init-data.sql
```

3. **Process Management**

```bash
# Using PM2
npm install -g pm2
pm2 start server.js --name "buffet-backend"
pm2 save
pm2 startup
```

#### Frontend Production

1. **Build Application**

```bash
cd fe
npm run build
```

2. **Nginx Configuration**

```nginx
# /etc/nginx/sites-available/buffet-restaurant
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /path/to/buffet/fe/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API proxy
    location /api/ {
        proxy_pass http://localhost:3000;
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

3. **SSL Certificate**

```bash
# Using Certbot
sudo certbot --nginx -d your-domain.com
```

#### Docker Deployment (Optional)

```dockerfile
# Dockerfile.backend
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3000
CMD ["node", "server.js"]
```

```dockerfile
# Dockerfile.frontend
FROM node:18-alpine as builder
WORKDIR /app
COPY fe/package*.json ./
RUN npm ci
COPY fe/ .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:14-alpine
    environment:
      POSTGRES_DB: buffet_restaurant
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./scripts/init-data.sql:/docker-entrypoint-initdb.d/init.sql

  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    environment:
      DB_HOST: postgres
      DB_USER: postgres
      DB_PASSWORD: password
      DB_NAME: buffet_restaurant
    depends_on:
      - postgres
    ports:
      - '3000:3000'

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - '80:80'
    depends_on:
      - backend

volumes:
  postgres_data:
```

## 🐛 Troubleshooting

### Common Backend Issues

#### Database Connection Failed

```bash
# Check PostgreSQL service
sudo service postgresql status

# Check database exists
psql -U postgres -l | grep buffet_restaurant

# Test connection manually
psql -U postgres -d buffet_restaurant -c "SELECT NOW();"
```

#### JWT Token Issues

```bash
# Check JWT_SECRET in .env
echo $JWT_SECRET

# Clear invalid tokens
# Frontend: localStorage.removeItem('accessToken')
```

#### API 500 Errors

```bash
# Check server logs
tail -f logs/server.log

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Common Frontend Issues

#### CORS Errors

- Đảm bảo backend đang chạy trên port 3000
- Kiểm tra VITE_API_URL trong fe/.env
- Verify CORS configuration trong server.js

#### API Not Found (404)

- Kiểm tra backend endpoints trong routes/
- Verify API base URL: http://localhost:3000/api
- Check network tab trong DevTools

#### Toast Notifications Not Showing

- Verify ToastContainer trong App.jsx
- Check import của toast utilities
- Ensure react-toastify styles được import

#### Login Failed

```javascript
// Test với curl
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Performance Issues

#### Slow Database Queries

```sql
-- Enable query logging
SET log_statement = 'all';
SET log_min_duration_statement = 1000;

-- Check slow queries
SELECT query, mean_time, calls
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

#### Frontend Bundle Size

```bash
# Analyze bundle size
cd fe
npm run build
npx vite-bundle-analyzer dist/stats.json
```

### Development Debugging

#### Backend Debugging

```javascript
// Add debug logging
console.log('Debug:', {
  user: req.user,
  body: req.body,
  params: req.params,
});

// Use debugger
const result = await Model.create(data);
debugger; // Breakpoint here
```

#### Frontend Debugging

```javascript
// React DevTools
// Install React Developer Tools extension

// Network debugging
// Check Network tab trong DevTools
// Verify request/response data

// State debugging
console.log('Auth context:', { user, token });
```

### Logs & Monitoring

```bash
# Backend logs
tail -f logs/access.log
tail -f logs/error.log

# PM2 logs (production)
pm2 logs buffet-backend
pm2 monit

# System logs
journalctl -u nginx -f
journalctl -u postgresql -f
```

## 📈 Roadmap & Future Features

### Short Term (1-2 months)

- [ ] **Real-time Updates**: WebSocket cho trạng thái bàn real-time
- [ ] **PDF Export**: Xuất hóa đơn và báo cáo PDF
- [ ] **Email Notifications**: Gửi email xác nhận đặt bàn
- [ ] **SMS Integration**: SMS notification cho khách hàng
- [ ] **Image Upload**: Upload hình ảnh món ăn với cloud storage

### Medium Term (3-6 months)

- [ ] **Mobile App**: React Native app cho staff và customers
- [ ] **QR Code Menu**: QR code menu cho bàn ăn
- [ ] **Online Payment**: VNPay/MoMo integration
- [ ] **Inventory Management**: Quản lý nguyên liệu và kho
- [ ] **Staff Scheduling**: Lịch làm việc nhân viên

### Long Term (6+ months)

- [ ] **Multi-branch**: Hỗ trợ nhiều chi nhánh
- [ ] **Loyalty Program**: Chương trình tích điểm nâng cao
- [ ] **AI Analytics**: Machine learning cho dự đoán doanh thu
- [ ] **Voice Ordering**: Voice interface cho ordering
- [ ] **IoT Integration**: Smart table sensors

### Technical Improvements

- [ ] **E2E Testing**: Cypress/Playwright testing
- [ ] **CI/CD Pipeline**: GitHub Actions deployment
- [ ] **Microservices**: Service-oriented architecture
- [ ] **Redis Caching**: Performance optimization
- [ ] **GraphQL API**: Alternative to REST APIs
- [ ] **TypeScript**: Type safety cho codebase

## 🤝 Contributing

### Getting Started

1. Fork dự án trên GitHub
2. Clone fork về local machine
3. Tạo feature branch từ main
4. Implement feature với tests
5. Submit Pull Request với description chi tiết

### Development Guidelines

```bash
# Setup development environment
git clone https://github.com/yourusername/buffet-restaurant
cd buffet-restaurant

# Install dependencies
npm install
cd fe && npm install && cd ..

# Create feature branch
git checkout -b feature/your-feature-name

# Make changes and test
npm run test
cd fe && npm run test && cd ..

# Commit with meaningful message
git commit -m "feat: add order management functionality"

# Push and create PR
git push origin feature/your-feature-name
```

### Code Standards

- **Backend**: Node.js best practices, async/await, proper error handling
- **Frontend**: React best practices, functional components, hooks
- **Database**: PostgreSQL naming conventions, proper indexing
- **API**: RESTful design, consistent response format
- **Security**: Input validation, authentication, authorization
- **Documentation**: Code comments, API documentation, README updates

### Development Team

- **Backend Developer**: API design, database architecture, security implementation
- **Frontend Developer**: React UI/UX, state management, responsive design
- **DevOps Engineer**: Deployment, monitoring, performance optimization
- **UI/UX Designer**: Interface design, user experience, accessibility

### Technologies & Libraries

- **Backend**: Express.js, PostgreSQL, JWT, Joi validation, Helmet security
- **Frontend**: React 19, Vite, Chart.js, React Toastify, SCSS, Axios
- **Development**: Node.js, npm, Git, VS Code, Postman
- **Deployment**: Nginx, PM2, Docker, PostgreSQL
