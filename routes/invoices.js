const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoiceController');
const { authenticateToken } = require('../middleware/auth');

// Tất cả routes đều cần xác thực
router.use(authenticateToken);

// Lấy danh sách hóa đơn
router.get('/', invoiceController.getAllInvoices);

// Lấy thống kê hóa đơn
router.get('/stats', invoiceController.getInvoiceStats);

// Lấy hóa đơn theo ID
router.get('/:id', invoiceController.getInvoiceById);

// Cập nhật trạng thái thanh toán
router.patch('/:id/payment-status', invoiceController.updatePaymentStatus);

// Cập nhật hóa đơn
router.put('/:id', invoiceController.updateInvoice);

module.exports = router;
