const express = require('express');
const router = express.Router();
const { validate, schemas } = require('../middleware/validation');
const { authenticateToken, checkRole } = require('../middleware/auth');
const menuController = require('../controllers/menuController');

// Tất cả routes cần đăng nhập
router.use(authenticateToken);

// Quản lý món ăn
router.get('/dishes', menuController.getDishes);
router.post(
  '/dishes',
  checkRole(['Admin', 'Manager']),
  validate(schemas.dish),
  menuController.createDish
);
router.put(
  '/dishes/:id',
  checkRole(['Admin', 'Manager']),
  menuController.updateDish
);
router.delete(
  '/dishes/:id',
  checkRole(['Admin', 'Manager']),
  menuController.deleteDish
);

// Quản lý danh mục
router.get('/categories', menuController.getCategories);
router.post(
  '/categories',
  checkRole(['Admin', 'Manager']),
  menuController.createCategory
);

// Quản lý danh mục buffet
router.get('/buffet-categories', menuController.getBuffetCategories);
router.post(
  '/buffet-categories',
  checkRole(['Admin', 'Manager']),
  menuController.createBuffetCategory
);
router.put(
  '/buffet-categories/:id',
  checkRole(['Admin', 'Manager']),
  menuController.updateBuffetCategory
);
router.delete(
  '/buffet-categories/:id',
  checkRole(['Admin', 'Manager']),
  menuController.deleteBuffetCategory
);

// Quản lý set buffet
router.get('/buffet-sets', menuController.getBuffetSets);
router.post(
  '/buffet-sets',
  checkRole(['Admin', 'Manager']),
  validate(schemas.buffetSet),
  menuController.createBuffetSet
);
router.put(
  '/buffet-sets/:id',
  checkRole(['Admin', 'Manager']),
  menuController.updateBuffetSet
);
router.delete(
  '/buffet-sets/:id',
  checkRole(['Admin', 'Manager']),
  menuController.deleteBuffetSet
);

// Quản lý khuyến mãi
router.get('/promotions', menuController.getPromotions);
router.post(
  '/promotions',
  checkRole(['Admin', 'Manager']),
  validate(schemas.promotion),
  menuController.createPromotion
);

module.exports = router;
