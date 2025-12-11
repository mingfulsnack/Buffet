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

// Lấy báo cáo hiệu suất bàn
router.get('/table-performance', reportController.getTablePerformanceReport);

// I. Báo cáo doanh thu tổng hợp theo ngày (doanh thu, số hóa đơn, số đơn hàng)
router.get(
  '/daily-revenue-comprehensive',
  reportController.getDailyRevenueComprehensive
);

// II. Báo cáo doanh thu theo tháng (với số hóa đơn)
router.get(
  '/monthly-revenue-invoices',
  reportController.getMonthlyRevenueWithInvoices
);

// III. Báo cáo doanh thu theo món ăn
router.get('/revenue-by-dish', reportController.getRevenueByDish);

// IV. Báo cáo doanh thu theo set buffet
router.get('/revenue-by-buffet-set', reportController.getRevenueByBuffetSet);

// V. Báo cáo booking bàn (đặt bàn)
router.get('/booking-report', reportController.getBookingReport);

module.exports = router;
