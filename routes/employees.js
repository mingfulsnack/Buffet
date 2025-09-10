const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, checkRole } = require('../middleware/auth');
const employeeController = require('../controllers/employeeController');

// Tất cả routes cần đăng nhập
router.use(authenticateToken);

// Quản lý vai trò (đặt trước route :id)
router.get('/roles', checkRole(['Admin']), employeeController.getRoles);

router.post('/roles', checkRole(['Admin']), employeeController.createRole);

// Quản lý quyền
router.get(
  '/permissions',
  checkRole(['Admin']),
  employeeController.getPermissions
);

router.post(
  '/permissions',
  checkRole(['Admin']),
  employeeController.createPermission
);

// Lấy danh sách nhân viên
router.get(
  '/',
  checkRole(['Admin', 'Manager']),
  employeeController.getEmployees
);

// Lấy chi tiết nhân viên (đặt sau các route cụ thể)
router.get(
  '/:id',
  checkRole(['Admin', 'Manager']),
  employeeController.getEmployeeDetail
);

// Tạo nhân viên mới
router.post(
  '/',
  checkRole(['Admin']),
  validate(schemas.employee),
  employeeController.createEmployee
);

// Cập nhật thông tin nhân viên
router.put('/:id', checkRole(['Admin']), employeeController.updateEmployee);

// Reset mật khẩu nhân viên
router.put(
  '/:id/reset-password',
  checkRole(['Admin']),
  employeeController.resetEmployeePassword
);

// Xóa nhân viên
router.delete('/:id', checkRole(['Admin']), employeeController.deleteEmployee);

// Cập nhật quyền cho vai trò
router.put(
  '/roles/:id/permissions',
  checkRole(['Admin']),
  employeeController.updateRolePermissions
);

module.exports = router;
