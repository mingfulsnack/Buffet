const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, checkRole } = require('../middleware/auth');
const tableController = require('../controllers/tableController');

// Tất cả routes cần đăng nhập
router.use(authenticateToken);

// Lấy danh sách bàn
router.get('/', tableController.getTables);

// Lấy bàn trống tại thời điểm cụ thể (cho booking)
router.get('/available', tableController.getAvailableTablesAtTime);

// Quản lý vùng/khu vực (phải đặt trước /:id)
router.get('/areas', tableController.getAreas);

router.post(
  '/areas',
  checkRole(['Admin', 'Manager']),
  tableController.createArea
);

// Kiểm tra trạng thái bàn tại thời điểm cụ thể
router.get('/:id/status', tableController.getTableStatusAtTime);

// Lấy chi tiết bàn
router.get('/:id', tableController.getTableDetail);

// Tạo bàn mới
router.post(
  '/',
  checkRole(['Admin', 'Manager']),
  validate(schemas.table),
  tableController.createTable
);

// Cập nhật thông tin bàn
router.put(
  '/:id',
  checkRole(['Admin', 'Manager']),
  tableController.updateTable
);

// Cập nhật trạng thái bàn
router.put(
  '/:id/status',
  checkRole(['Admin', 'Manager', 'Staff']),
  tableController.updateTableStatus
);

// Xóa bàn
router.delete(
  '/:id',
  checkRole(['Admin', 'Manager']),
  tableController.deleteTable
);

module.exports = router;
