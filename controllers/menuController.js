const { Menu } = require('../models');
const { formatResponse, formatErrorResponse } = require('../utils/helpers');

// Lấy thực đơn (public - cho khách hàng)
const getPublicMenu = async (req, res) => {
  try {
    const menu = await Menu.getPublicMenu();

    res.json(formatResponse(true, menu, 'Lấy thực đơn thành công'));
  } catch (error) {
    console.error('Get public menu error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách món ăn (admin)
const getDishes = async (req, res) => {
  try {
    const { page = 1, limit = 20, madanhmuc, trangthai, search } = req.query;

    const conditions = {};
    if (madanhmuc) conditions.madanhmuc = madanhmuc;
    if (trangthai) conditions.trangthai = trangthai;
    if (search) conditions.search = search;

    const result = await Menu.findAllWithCategory(conditions, page, limit);

    res.json(
      formatResponse(true, result.data, 'Lấy danh sách món ăn thành công', {
        pagination: result.pagination,
      })
    );
  } catch (error) {
    console.error('Get dishes error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo món ăn mới
const createDish = async (req, res) => {
  try {
    const { tenmon, madanhmuc, dongia, trangthai, is_addon, ghichu, image } =
      req.body;

    const dishData = {
      tenmon,
      madanhmuc,
      dongia,
      trangthai: trangthai || 'Con',
      is_addon: is_addon || false,
      ghichu,
      image: image || null,
    };

    const result = await Menu.create(dishData);

    res.status(201).json(formatResponse(true, result, 'Tạo món ăn thành công'));
  } catch (error) {
    console.error('Create dish error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Cập nhật món ăn
const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenmon, madanhmuc, dongia, trangthai, is_addon, ghichu, image } =
      req.body;

    // Kiểm tra món ăn có tồn tại
    const existing = await Menu.findById(id);
    if (!existing) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy món ăn'));
    }

    const updateData = {};
    if (tenmon !== undefined) updateData.tenmon = tenmon;
    if (madanhmuc !== undefined) updateData.madanhmuc = madanhmuc;
    if (dongia !== undefined) updateData.dongia = dongia;
    if (trangthai !== undefined) updateData.trangthai = trangthai;
    if (is_addon !== undefined) updateData.is_addon = is_addon;
    if (ghichu !== undefined) updateData.ghichu = ghichu;
    if (image !== undefined) updateData.image = image;

    const result = await Menu.update(id, updateData);

    res.json(formatResponse(true, result, 'Cập nhật món ăn thành công'));
  } catch (error) {
    console.error('Update dish error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Xóa món ăn
const deleteDish = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting dish with ID:', id);

    // Kiểm tra món ăn có tồn tại không
    const dish = await Menu.findById(id);
    if (!dish) {
      console.log('Dish not found:', id);
      return res.status(404).json(formatErrorResponse('Không tìm thấy món ăn'));
    }

    // Xóa món ăn (hard delete with cascade)
    const result = await Menu.deleteDish(id);
    console.log('Delete result:', result);

    if (!result) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy món ăn'));
    }

    res.json(formatResponse(true, null, 'Xóa món ăn thành công'));
  } catch (error) {
    console.error('Delete dish error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách danh mục
const getCategories = async (req, res) => {
  try {
    const categories = await Menu.getCategories();

    res.json(
      formatResponse(true, categories, 'Lấy danh sách danh mục thành công')
    );
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo danh mục mới
const createCategory = async (req, res) => {
  try {
    const { tendanhmuc, mota } = req.body;

    const result = await Menu.createCategory({ tendanhmuc, mota });

    res
      .status(201)
      .json(formatResponse(true, result, 'Tạo danh mục thành công'));
  } catch (error) {
    console.error('Create category error:', error);
    if (error.code === '23505') {
      res.status(400).json(formatErrorResponse('Tên danh mục đã tồn tại'));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Lấy danh sách set buffet
const getBuffetSets = async (req, res) => {
  try {
    const { trangthai, madanhmuc, search } = req.query;

    const conditions = {};
    if (trangthai) conditions.trangthai = trangthai;
    if (madanhmuc) conditions.madanhmuc = madanhmuc;
    if (search) conditions.search = search;

    const buffetSets = await Menu.getBuffetSets(conditions);

    res.json(
      formatResponse(true, buffetSets, 'Lấy danh sách set buffet thành công')
    );
  } catch (error) {
    console.error('Get buffet sets error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo set buffet mới
const createBuffetSet = async (req, res) => {
  try {
    console.log('Create buffet set request body:', req.body);

    const {
      tenset,
      dongia,
      thoigian_batdau,
      thoigian_ketthuc,
      mota,
      mon_an,
      image,
      madanhmuc,
    } = req.body;

    const buffetSetData = {
      tenset,
      dongia,
      thoigian_batdau,
      thoigian_ketthuc,
      mota,
      mon_an,
      image: image || null,
      madanhmuc,
    };

    console.log('Buffet set data to create:', buffetSetData);

    const buffetSet = await Menu.createBuffetSet(buffetSetData);

    res
      .status(201)
      .json(formatResponse(true, buffetSet, 'Tạo set buffet thành công'));
  } catch (error) {
    console.error('Create buffet set error:', error);
    if (error.code === '23505') {
      res.status(400).json(formatErrorResponse('Tên set buffet đã tồn tại'));
    } else if (error.code === '23503') {
      res
        .status(400)
        .json(formatErrorResponse('Danh mục buffet không tồn tại'));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Cập nhật set buffet
const updateBuffetSet = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      tenset,
      dongia,
      thoigian_batdau,
      thoigian_ketthuc,
      mota,
      trangthai,
      mon_an,
      image,
      madanhmuc,
    } = req.body;

    const updateData = {
      tenset,
      dongia,
      thoigian_batdau,
      thoigian_ketthuc,
      mota,
      trangthai,
      mon_an,
      image,
      madanhmuc,
    };

    const result = await Menu.updateBuffetSet(id, updateData);

    res.json(formatResponse(true, result, 'Cập nhật set buffet thành công'));
  } catch (error) {
    console.error('Update buffet set error:', error);
    res.status(500).json(formatErrorResponse(error.message || 'Lỗi server'));
  }
};

// Xóa set buffet
const deleteBuffetSet = async (req, res) => {
  try {
    const { id } = req.params;
    console.log('Deleting buffet set with ID:', id);

    // Kiểm tra set buffet có tồn tại không bằng query trực tiếp
    const checkResult = await Menu.query(
      'SELECT * FROM setbuffet WHERE maset = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      console.log('Buffet set not found:', id);
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy set buffet'));
    }

    // Xóa set buffet (hard delete with cascade)
    const result = await Menu.deleteBuffetSet(id);
    console.log('Delete buffet set result:', result);

    if (!result) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy set buffet'));
    }

    res.json(formatResponse(true, null, 'Xóa set buffet thành công'));
  } catch (error) {
    console.error('Delete buffet set error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách khuyến mãi
const getPromotions = async (req, res) => {
  try {
    const { is_active } = req.query;

    const isActive = is_active !== undefined ? is_active === 'true' : null;
    const promotions = await Menu.getPromotions(isActive);

    res.json(
      formatResponse(true, promotions, 'Lấy danh sách khuyến mãi thành công')
    );
  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo khuyến mãi mới
const createPromotion = async (req, res) => {
  try {
    const {
      tenkm,
      loai_km,
      giatri,
      ngay_batdau,
      ngay_ketthuc,
      dieu_kien,
      is_active,
      ap_dung,
    } = req.body;

    const promotionData = {
      tenkm,
      loai_km,
      giatri,
      ngay_batdau,
      ngay_ketthuc,
      dieu_kien,
      is_active,
      ap_dung,
    };

    const promotion = await Menu.createPromotion(promotionData);

    res
      .status(201)
      .json(formatResponse(true, promotion, 'Tạo khuyến mãi thành công'));
  } catch (error) {
    console.error('Create promotion error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách danh mục buffet
const getBuffetCategories = async (req, res) => {
  try {
    const categories = await Menu.getBuffetCategories();

    res.json(
      formatResponse(
        true,
        categories,
        'Lấy danh sách danh mục buffet thành công'
      )
    );
  } catch (error) {
    console.error('Get buffet categories error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo danh mục buffet mới
const createBuffetCategory = async (req, res) => {
  try {
    const { tendanhmuc, mota } = req.body;

    const categoryData = {
      tendanhmuc,
      mota,
    };

    const category = await Menu.createBuffetCategory(categoryData);

    res
      .status(201)
      .json(formatResponse(true, category, 'Tạo danh mục buffet thành công'));
  } catch (error) {
    console.error('Create buffet category error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Cập nhật danh mục buffet
const updateBuffetCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { tendanhmuc, mota } = req.body;

    const updateData = {
      tendanhmuc,
      mota,
    };

    const result = await Menu.updateBuffetCategory(id, updateData);

    res.json(
      formatResponse(true, result, 'Cập nhật danh mục buffet thành công')
    );
  } catch (error) {
    console.error('Update buffet category error:', error);
    if (error.message === 'Không tìm thấy danh mục buffet') {
      res.status(404).json(formatErrorResponse(error.message));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Xóa danh mục buffet
const deleteBuffetCategory = async (req, res) => {
  try {
    const { id } = req.params;

    await Menu.deleteBuffetCategory(id);

    res.json(formatResponse(true, null, 'Xóa danh mục buffet thành công'));
  } catch (error) {
    console.error('Delete buffet category error:', error);
    if (
      error.message === 'Không tìm thấy danh mục buffet' ||
      error.message === 'Không thể xóa danh mục vì đang có set buffet sử dụng'
    ) {
      res.status(400).json(formatErrorResponse(error.message));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

module.exports = {
  getPublicMenu,
  getDishes,
  createDish,
  updateDish,
  deleteDish,
  getCategories,
  createCategory,
  getBuffetSets,
  createBuffetSet,
  updateBuffetSet,
  deleteBuffetSet,
  getBuffetCategories,
  createBuffetCategory,
  updateBuffetCategory,
  deleteBuffetCategory,
  getPromotions,
  createPromotion,
};
