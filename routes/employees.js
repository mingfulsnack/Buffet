const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, checkRole } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

// Tất cả routes cần đăng nhập
router.use(authenticateToken);

// Lấy danh sách nhân viên
router.get('/', checkRole(['Admin', 'Manager']), employeeController.getEmployees);

// Lấy chi tiết nhân viên
router.get('/:id', checkRole(['Admin', 'Manager']), employeeController.getEmployeeDetail);

// Tạo nhân viên mới
router.post('/', 
  checkRole(['Admin']),
  validate(schemas.employee),
  employeeController.createEmployee
);

// Cập nhật thông tin nhân viên
router.put('/:id', 
  checkRole(['Admin']),
  employeeController.updateEmployee
);

// Reset mật khẩu nhân viên
router.put('/:id/reset-password', 
  checkRole(['Admin']),
  employeeController.resetEmployeePassword
);

// Quản lý vai trò
router.get('/roles/list', checkRole(['Admin']), employeeController.getRoles);

router.post('/roles', 
  checkRole(['Admin']),
  employeeController.createRole
);

// Quản lý quyền
router.get('/permissions/list', checkRole(['Admin']), employeeController.getPermissions);

router.post('/permissions', 
  checkRole(['Admin']),
  employeeController.createPermission
);

// Cập nhật quyền cho vai trò
router.put('/roles/:id/permissions', 
  checkRole(['Admin']),
  employeeController.updateRolePermissions
);

module.exports = router;
