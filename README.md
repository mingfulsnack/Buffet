# Buffet Restaurant Management System API

Backend API cho hệ thống quản lý nhà hàng buffet, hỗ trợ đặt bàn online, quản lý thực đơn, khách hàng và báo cáo thống kê.

## 🚀 Tính năng chính

- **Quản lý đặt bàn trực tuyến**: Tiếp nhận, xử lý, xác nhận đặt bàn; hỗ trợ khách hàng hủy/chỉnh sửa
- **Quản lý sơ đồ bàn ăn**: Hiển thị và cập nhật tình trạng bàn (trống, đã đặt, đang sử dụng)
- **Quản lý thực đơn**: Set buffet, món ăn, khuyến mãi và phụ thu
- **Quản lý khách hàng**: Thông tin, lịch sử đặt bàn, chương trình khách hàng thân thiết
- **Quản lý nhân viên**: Thông tin, ca làm việc và phân quyền hệ thống
- **Báo cáo thống kê**: Doanh thu, hiệu suất sử dụng bàn, khách hàng
- **Bảo mật**: JWT authentication, phân quyền theo vai trò, rate limiting

## 📋 Yêu cầu hệ thống

- Node.js >= 16.x
- PostgreSQL >= 12.x
- npm hoặc yarn

## 🛠️ Cài đặt

### 1. Clone dự án
```bash
git clone <repository-url>
cd buffet-restaurant-backend
```

### 2. Cài đặt dependencies
```bash
npm install
```

### 3. Cấu hình database
- Tạo database PostgreSQL với tên `buffet_restaurant`
- Chạy script SQL để tạo bảng (file script được cung cấp riêng)

### 4. Cấu hình môi trường
Sao chép file `.env.example` thành `.env` và cập nhật thông tin:

```bash
cp .env.example .env
```

Chỉnh sửa file `.env`:
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

### 5. Khởi chạy server

#### Development mode
```bash
npm run dev
```

#### Production mode
```bash
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

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

### Endpoints chính

#### Public APIs (không cần đăng nhập)
- `GET /api/public/menu` - Xem thực đơn
- `GET /api/public/tables` - Xem bàn trống
- `POST /api/public/bookings` - Đặt bàn
- `GET /api/public/bookings/:token` - Xem thông tin đặt bàn
- `PUT /api/public/bookings/:token/cancel` - Hủy đặt bàn

#### Admin APIs (cần đăng nhập)

**Auth**
- `POST /api/auth/login` - Đăng nhập
- `GET /api/auth/profile` - Thông tin profile
- `PUT /api/auth/change-password` - Đổi mật khẩu

**Bookings**
- `GET /api/bookings` - Danh sách đặt bàn
- `GET /api/bookings/:id` - Chi tiết đặt bàn
- `PUT /api/bookings/:id/confirm` - Xác nhận đặt bàn
- `PUT /api/bookings/:id/cancel` - Hủy đặt bàn

**Tables**
- `GET /api/tables` - Danh sách bàn
- `POST /api/tables` - Tạo bàn mới
- `PUT /api/tables/:id` - Cập nhật bàn
- `PUT /api/tables/:id/status` - Cập nhật trạng thái bàn

**Menu**
- `GET /api/menu/dishes` - Danh sách món ăn
- `POST /api/menu/dishes` - Tạo món ăn
- `GET /api/menu/buffet-sets` - Danh sách set buffet
- `POST /api/menu/buffet-sets` - Tạo set buffet
- `GET /api/menu/promotions` - Danh sách khuyến mãi

**Customers**
- `GET /api/customers` - Danh sách khách hàng
- `POST /api/customers` - Tạo khách hàng
- `GET /api/customers/phone/:phone` - Tìm theo SĐT

**Employees**
- `GET /api/employees` - Danh sách nhân viên
- `POST /api/employees` - Tạo nhân viên
- `GET /api/employees/roles/list` - Danh sách vai trò

**Reports**
- `GET /api/reports/dashboard` - Thống kê dashboard
- `GET /api/reports/revenue` - Báo cáo doanh thu
- `GET /api/reports/table-usage` - Báo cáo hiệu suất bàn
- `GET /api/reports/customers` - Báo cáo khách hàng

### Response Format
```json
{
  "success": true,
  "message": "Success message",
  "data": {...},
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

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "details": ["Validation errors..."]
}
```

## 🔒 Phân quyền

### Vai trò mặc định:
- **Admin**: Toàn quyền hệ thống
- **Manager**: Quản lý nhà hàng, xem báo cáo
- **Staff**: Nhân viên phục vụ, xử lý đặt bàn

### Quyền chính:
- `booking.create`, `booking.read`, `booking.update`, `booking.delete`
- `table.create`, `table.read`, `table.update`, `table.delete`
- `menu.create`, `menu.read`, `menu.update`, `menu.delete`
- `customer.create`, `customer.read`, `customer.update`, `customer.delete`
- `employee.create`, `employee.read`, `employee.update`, `employee.delete`
- `report.read`

## 📊 Database Schema

Hệ thống sử dụng PostgreSQL với các bảng chính:
- `hangthanhvien` - Hạng thành viên
- `khachhang` - Khách hàng
- `vung`, `ban` - Vùng và bàn
- `vai_tro`, `quyen`, `nhanvien` - Nhân viên và phân quyền
- `phieudatban` - Phiếu đặt bàn
- `danhmucmonan`, `monan` - Thực đơn
- `setbuffet` - Set buffet
- `khuyenmai` - Khuyến mãi
- `hoadon`, `thanhtoan` - Hóa đơn và thanh toán

## 🔧 Scripts

```bash
# Chạy development server
npm run dev

# Chạy production server
npm start

# Chạy tests
npm test
```

## 🌟 Tính năng nổi bật

### Booking Token System
- Mỗi đặt bàn có token unique để khách hàng quản lý mà không cần đăng nhập
- Hỗ trợ hủy đặt bàn với deadline time
- Optimistic locking cho cập nhật trạng thái bàn

### Security Features
- JWT authentication với refresh token
- Rate limiting cho API calls
- Input validation với Joi
- SQL injection protection
- XSS protection với Helmet

### Performance Optimization
- Database connection pooling
- Efficient queries với proper indexing
- Pagination cho large datasets
- Async/await error handling

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production` trong file `.env`
2. Cấu hình reverse proxy (Nginx)
3. Setup SSL certificate
4. Configure database backup
5. Setup monitoring and logging

### Docker (Optional)
```dockerfile
# Dockerfile sẽ được tạo riêng nếu cần
```

## 🤝 Contributing

1. Fork dự án
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Mở Pull Request

## 📝 License

Distributed under the MIT License.

## 📞 Support

Nếu có vấn đề hoặc cần hỗ trợ, vui lòng tạo issue trên GitHub repository.

---

**Note**: Đây là phiên bản backend API. Frontend admin panel và customer booking page cần được phát triển riêng để tương tác với API này.
