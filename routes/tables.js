const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, checkRole } = require('../middleware/auth');
const tableController = require('../controllers/tableController');

// Tất cả routes cần đăng nhập
router.use(authenticateToken);

// Lấy danh sách bàn
router.get('/', tableController.getTables);

// Lấy chi tiết bàn
router.get('/:id', tableController.getTableDetail);

// Tạo bàn mới
router.post('/', 
  checkRole(['Admin', 'Manager']),
  validate(schemas.table),
  tableController.createTable
);

// Cập nhật thông tin bàn
router.put('/:id', 
  checkRole(['Admin', 'Manager']),
  tableController.updateTable
);

// Cập nhật trạng thái bàn
router.put('/:id/status', 
  checkRole(['Admin', 'Manager', 'Staff']),
  tableController.updateTableStatus
);

// Xóa bàn
router.delete('/:id', 
  checkRole(['Admin', 'Manager']),
  tableController.deleteTable
);

// Quản lý vùng/khu vực
router.get('/areas/list', tableController.getAreas);

router.post('/areas', 
  checkRole(['Admin', 'Manager']),
  tableController.createArea
);

module.exports = router;
