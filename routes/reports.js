const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Tất cả routes cần đăng nhập và quyền xem báo cáo
router.use(authenticateToken);
router.use(checkRole(['Admin', 'Manager']));

// Dashboard thống kê tổng quan
router.get('/dashboard', reportController.getDashboardStats);

// Báo cáo doanh thu
router.get('/revenue', reportController.getRevenueReport);

// Báo cáo hiệu suất sử dụng bàn
router.get('/table-usage', reportController.getTableUsageReport);

// Báo cáo khách hàng
router.get('/customers', reportController.getCustomerReport);

// Báo cáo món ăn phổ biến
router.get('/popular-dishes', reportController.getPopularDishesReport);

// Xuất báo cáo
router.post('/export', reportController.exportReport);

module.exports = router;
