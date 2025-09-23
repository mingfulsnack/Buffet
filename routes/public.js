const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const menuController = require('../controllers/menuController');
const bookingController = require('../controllers/bookingController');
const tableController = require('../controllers/tableController');

// Middleware to prevent caching for public routes
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Routes public - không cần đăng nhập

// Lấy thực đơn public
router.get('/menu', menuController.getPublicMenu);

// Lấy danh sách bàn trống
router.get('/tables', tableController.getTables);

// Lấy bàn trống tại thời điểm cụ thể (cho booking)
router.get('/tables/available', tableController.getAvailableTablesAtTime);

// Lấy danh sách vùng/khu vực
router.get('/areas', tableController.getAreas);

// Tạo đặt bàn mới (khách hàng)
router.post(
  '/bookings',
  validate(schemas.booking),
  bookingController.createBooking
);

// Lấy thông tin đặt bàn bằng token (khách hàng)
router.get('/bookings/:token', bookingController.getBookingByToken);

// Hủy đặt bàn bằng token (khách hàng)
router.put('/bookings/:token/cancel', bookingController.cancelBooking);

module.exports = router;
