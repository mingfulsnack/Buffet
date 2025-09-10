const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, checkRole } = require('../middleware/auth');
const customerController = require('../controllers/customerController');

// Tất cả routes cần đăng nhập
router.use(authenticateToken);

// Lấy danh sách khách hàng
router.get('/', customerController.getCustomers);

// Lấy chi tiết khách hàng
router.get('/:id', customerController.getCustomerDetail);

// Tìm khách hàng theo số điện thoại
router.get('/phone/:sodienthoai', customerController.findCustomerByPhone);

// Tạo khách hàng mới
router.post('/', 
  checkRole(['Admin', 'Manager', 'Staff']),
  validate(schemas.customer),
  customerController.createCustomer
);

// Cập nhật thông tin khách hàng
router.put('/:id', 
  checkRole(['Admin', 'Manager', 'Staff']),
  customerController.updateCustomer
);

// Xóa khách hàng
router.delete('/:id', 
  checkRole(['Admin', 'Manager']),
  customerController.deleteCustomer
);

// Quản lý hạng thành viên
router.get('/membership/tiers', customerController.getMembershipTiers);

router.post('/membership/tiers', 
  checkRole(['Admin', 'Manager']),
  customerController.createMembershipTier
);

module.exports = router;
