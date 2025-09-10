const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const menuController = require('../controllers/menuController');
const bookingController = require('../controllers/bookingController');
const tableController = require('../controllers/tableController');

// Routes public - không cần đăng nhập

// Lấy thực đơn public
router.get('/menu', menuController.getPublicMenu);

// Lấy danh sách bàn trống
router.get('/tables', tableController.getTables);

// Lấy danh sách vùng/khu vực
router.get('/areas', tableController.getAreas);

// Tạo đặt bàn mới (khách hàng)
router.post('/bookings', validate(schemas.booking), bookingController.createBooking);

// Lấy thông tin đặt bàn bằng token (khách hàng)
router.get('/bookings/:token', bookingController.getBookingByToken);

// Hủy đặt bàn bằng token (khách hàng)
router.put('/bookings/:token/cancel', bookingController.cancelBooking);

module.exports = router;
