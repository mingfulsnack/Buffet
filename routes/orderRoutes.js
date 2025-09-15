const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');
const { authenticateToken } = require('../middleware/auth');

// Áp dụng middleware xác thực cho tất cả routes
router.use(authenticateToken);

// GET /api/orders - Lấy danh sách đơn hàng
router.get('/', orderController.getAllOrders);

// GET /api/orders/menu - Lấy menu để chọn món
router.get('/menu', orderController.getMenuForOrder);

// GET /api/orders/:id - Lấy đơn hàng theo ID
router.get('/:id', orderController.getOrderById);

// POST /api/orders - Tạo đơn hàng mới
router.post('/', orderController.createOrder);

// PUT /api/orders/:id - Cập nhật đơn hàng
router.put('/:id', orderController.updateOrder);

// DELETE /api/orders/:id - Xóa đơn hàng
router.delete('/:id', orderController.deleteOrder);

// POST /api/orders/:id/confirm - Xác nhận đơn hàng (tạo hóa đơn)
router.post('/:id/confirm', orderController.confirmOrder);

module.exports = router;
