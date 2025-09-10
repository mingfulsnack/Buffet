const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, checkRole } = require('../middleware/auth');
const bookingController = require('../controllers/bookingController');

// Routes cho admin (cần đăng nhập)
router.use(authenticateToken);

// Lấy danh sách đặt bàn
router.get('/', bookingController.getBookings);

// Lấy chi tiết đặt bàn
router.get('/:id', bookingController.getBookingDetail);

// Xác nhận đặt bàn
router.put('/:id/confirm', 
  checkRole(['Admin', 'Manager', 'Staff']), 
  bookingController.confirmBooking
);

// Hủy đặt bàn (admin)
router.put('/:id/cancel', 
  checkRole(['Admin', 'Manager']), 
  bookingController.cancelBooking
);

module.exports = router;
