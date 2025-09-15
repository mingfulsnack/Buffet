const express = require('express');
const router = express.Router();
const { authenticateToken, checkRole } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

// Tất cả routes cần đăng nhập và quyền xem báo cáo
router.use(authenticateToken);
router.use(checkRole(['Admin', 'Manager']));

// Lấy doanh thu theo ngày
router.get('/revenue/daily', reportController.getRevenueByDate);

// Lấy doanh thu theo tháng
router.get('/revenue/monthly', reportController.getRevenueByMonth);

// Lấy doanh thu theo năm
router.get('/revenue/yearly', reportController.getRevenueByYear);

// Lấy thống kê tổng quan
router.get('/stats/overall', reportController.getOverallStats);

// Lấy top ngày có doanh thu cao nhất
router.get('/stats/top-revenue-days', reportController.getTopRevenueDays);

// Lấy thống kê theo trạng thái thanh toán
router.get('/stats/payment-status', reportController.getPaymentStatusStats);

module.exports = router;
