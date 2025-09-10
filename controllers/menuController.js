const pool = require('../config/database');
const { formatResponse, formatErrorResponse, getPaginationOffset } = require('../utils/helpers');

// Lấy thực đơn (public - cho khách hàng)
const getPublicMenu = async (req, res) => {
  try {
    // Lấy danh mục món ăn
    const categoriesResult = await pool.query(`
      SELECT dm.*, COUNT(m.mamon) as so_mon
      FROM danhmucmonan dm
      LEFT JOIN monan m ON dm.madanhmuc = m.madanhmuc AND m.trangthai = 'Con'
      GROUP BY dm.madanhmuc, dm.tendanhmuc, dm.mota
      ORDER BY dm.tendanhmuc
    `);

    // Lấy món ăn theo danh mục
    const dishesResult = await pool.query(`
      SELECT m.*, dm.tendanhmuc
      FROM monan m
      JOIN danhmucmonan dm ON m.madanhmuc = dm.madanhmuc
      WHERE m.trangthai = 'Con'
      ORDER BY dm.tendanhmuc, m.tenmon
    `);

    // Lấy set buffet đang hoạt động
    const buffetSetsResult = await pool.query(`
      SELECT s.*, 
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'mamon', m.mamon,
                 'tenmon', m.tenmon,
                 'soluong', sc.soluong
               )
             ) as mon_an
      FROM setbuffet s
      LEFT JOIN setbuffet_chitiet sc ON s.maset = sc.maset
      LEFT JOIN monan m ON sc.mamon = m.mamon
      WHERE s.trangthai = 'HoatDong'
      GROUP BY s.maset, s.tenset, s.dongia, s.thoigian_batdau, s.thoigian_ketthuc, s.mota, s.trangthai
      ORDER BY s.dongia
    `);

    // Lấy khuyến mãi đang hoạt động
    const promotionsResult = await pool.query(`
      SELECT km.*
      FROM khuyenmai km
      WHERE km.is_active = true
        AND (km.ngay_batdau IS NULL OR km.ngay_batdau <= CURRENT_DATE)
        AND (km.ngay_ketthuc IS NULL OR km.ngay_ketthuc >= CURRENT_DATE)
      ORDER BY km.ngay_ketthuc ASC
    `);

    // Nhóm món ăn theo danh mục
    const menuByCategory = {};
    categoriesResult.rows.forEach(category => {
      menuByCategory[category.madanhmuc] = {
        ...category,
        mon_an: []
      };
    });

    dishesResult.rows.forEach(dish => {
      if (menuByCategory[dish.madanhmuc]) {
        menuByCategory[dish.madanhmuc].mon_an.push(dish);
      }
    });

    const menu = {
      danh_muc: Object.values(menuByCategory),
      set_buffet: buffetSetsResult.rows,
      khuyen_mai: promotionsResult.rows
    };

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
    const { offset, limit: pageLimit } = getPaginationOffset(page, limit);

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (madanhmuc) {
      paramCount++;
      whereClause += ` AND m.madanhmuc = $${paramCount}`;
      params.push(madanhmuc);
    }

    if (trangthai) {
      paramCount++;
      whereClause += ` AND m.trangthai = $${paramCount}`;
      params.push(trangthai);
    }

    if (search) {
      paramCount++;
      whereClause += ` AND m.tenmon ILIKE $${paramCount}`;
      params.push(`%${search}%`);
    }

    // Đếm tổng số bản ghi
    const countResult = await pool.query(`
      SELECT COUNT(*) as total 
      FROM monan m 
      JOIN danhmucmonan dm ON m.madanhmuc = dm.madanhmuc
      ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);

    // Lấy dữ liệu với phân trang
    params.push(pageLimit, offset);
    const result = await pool.query(`
      SELECT m.*, dm.tendanhmuc
      FROM monan m
      JOIN danhmucmonan dm ON m.madanhmuc = dm.madanhmuc
      ${whereClause}
      ORDER BY dm.tendanhmuc, m.tenmon
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    const totalPages = Math.ceil(total / pageLimit);

    res.json(formatResponse(
      true,
      result.rows,
      'Lấy danh sách món ăn thành công',
      {
        pagination: {
          page: parseInt(page),
          limit: pageLimit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      }
    ));

  } catch (error) {
    console.error('Get dishes error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo món ăn mới
const createDish = async (req, res) => {
  try {
    const { tenmon, madanhmuc, dongia, trangthai, is_addon, ghichu } = req.body;

    // Kiểm tra danh mục có tồn tại
    const categoryResult = await pool.query('SELECT * FROM danhmucmonan WHERE madanhmuc = $1', [madanhmuc]);
    if (categoryResult.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy danh mục'));
    }

    const result = await pool.query(`
      INSERT INTO monan (tenmon, madanhmuc, dongia, trangthai, is_addon, ghichu)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [tenmon, madanhmuc, dongia, trangthai || 'Con', is_addon || false, ghichu]);

    res.status(201).json(formatResponse(true, result.rows[0], 'Tạo món ăn thành công'));

  } catch (error) {
    console.error('Create dish error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Cập nhật món ăn
const updateDish = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenmon, madanhmuc, dongia, trangthai, is_addon, ghichu } = req.body;

    // Kiểm tra món ăn có tồn tại
    const existingResult = await pool.query('SELECT * FROM monan WHERE mamon = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy món ăn'));
    }

    // Kiểm tra danh mục nếu có cập nhật
    if (madanhmuc) {
      const categoryResult = await pool.query('SELECT * FROM danhmucmonan WHERE madanhmuc = $1', [madanhmuc]);
      if (categoryResult.rows.length === 0) {
        return res.status(404).json(formatErrorResponse('Không tìm thấy danh mục'));
      }
    }

    const result = await pool.query(`
      UPDATE monan 
      SET tenmon = COALESCE($1, tenmon),
          madanhmuc = COALESCE($2, madanhmuc),
          dongia = COALESCE($3, dongia),
          trangthai = COALESCE($4, trangthai),
          is_addon = COALESCE($5, is_addon),
          ghichu = COALESCE($6, ghichu)
      WHERE mamon = $7
      RETURNING *
    `, [tenmon, madanhmuc, dongia, trangthai, is_addon, ghichu, id]);

    res.json(formatResponse(true, result.rows[0], 'Cập nhật món ăn thành công'));

  } catch (error) {
    console.error('Update dish error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Xóa món ăn
const deleteDish = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra món ăn có trong set buffet nào không
    const setResult = await pool.query('SELECT COUNT(*) as count FROM setbuffet_chitiet WHERE mamon = $1', [id]);
    if (parseInt(setResult.rows[0].count) > 0) {
      return res.status(400).json(formatErrorResponse('Không thể xóa món ăn đang có trong set buffet'));
    }

    const result = await pool.query('DELETE FROM monan WHERE mamon = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
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
    const result = await pool.query(`
      SELECT dm.*, COUNT(m.mamon) as so_mon
      FROM danhmucmonan dm
      LEFT JOIN monan m ON dm.madanhmuc = m.madanhmuc
      GROUP BY dm.madanhmuc, dm.tendanhmuc, dm.mota
      ORDER BY dm.tendanhmuc
    `);

    res.json(formatResponse(true, result.rows, 'Lấy danh sách danh mục thành công'));

  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo danh mục mới
const createCategory = async (req, res) => {
  try {
    const { tendanhmuc, mota } = req.body;

    const result = await pool.query(`
      INSERT INTO danhmucmonan (tendanhmuc, mota)
      VALUES ($1, $2)
      RETURNING *
    `, [tendanhmuc, mota]);

    res.status(201).json(formatResponse(true, result.rows[0], 'Tạo danh mục thành công'));

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
    const { trangthai } = req.query;

    let whereClause = '';
    const params = [];

    if (trangthai) {
      whereClause = 'WHERE s.trangthai = $1';
      params.push(trangthai);
    }

    const result = await pool.query(`
      SELECT s.*, 
             COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'mamon', m.mamon,
                   'tenmon', m.tenmon,
                   'soluong', sc.soluong,
                   'dongia', m.dongia
                 )
               ) FILTER (WHERE m.mamon IS NOT NULL), 
               '[]'
             ) as mon_an
      FROM setbuffet s
      LEFT JOIN setbuffet_chitiet sc ON s.maset = sc.maset
      LEFT JOIN monan m ON sc.mamon = m.mamon
      ${whereClause}
      GROUP BY s.maset, s.tenset, s.dongia, s.thoigian_batdau, s.thoigian_ketthuc, s.mota, s.trangthai
      ORDER BY s.dongia
    `, params);

    res.json(formatResponse(true, result.rows, 'Lấy danh sách set buffet thành công'));

  } catch (error) {
    console.error('Get buffet sets error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo set buffet mới
const createBuffetSet = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota, mon_an } = req.body;

    // Tạo set buffet
    const setResult = await client.query(`
      INSERT INTO setbuffet (tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota, trangthai)
      VALUES ($1, $2, $3, $4, $5, 'HoatDong')
      RETURNING *
    `, [tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota]);

    const buffetSet = setResult.rows[0];

    // Thêm món ăn vào set
    if (mon_an && mon_an.length > 0) {
      for (const dish of mon_an) {
        await client.query(`
          INSERT INTO setbuffet_chitiet (maset, mamon, soluong)
          VALUES ($1, $2, $3)
        `, [buffetSet.maset, dish.mamon, dish.soluong || 1]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json(formatResponse(true, buffetSet, 'Tạo set buffet thành công'));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create buffet set error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  } finally {
    client.release();
  }
};

// Cập nhật set buffet
const updateBuffetSet = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota, trangthai, mon_an } = req.body;

    // Kiểm tra set có tồn tại
    const existingResult = await client.query('SELECT * FROM setbuffet WHERE maset = $1', [id]);
    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json(formatErrorResponse('Không tìm thấy set buffet'));
    }

    // Cập nhật thông tin set
    const result = await client.query(`
      UPDATE setbuffet 
      SET tenset = COALESCE($1, tenset),
          dongia = COALESCE($2, dongia),
          thoigian_batdau = COALESCE($3, thoigian_batdau),
          thoigian_ketthuc = COALESCE($4, thoigian_ketthuc),
          mota = COALESCE($5, mota),
          trangthai = COALESCE($6, trangthai)
      WHERE maset = $7
      RETURNING *
    `, [tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota, trangthai, id]);

    // Cập nhật món ăn nếu có
    if (mon_an) {
      // Xóa món ăn cũ
      await client.query('DELETE FROM setbuffet_chitiet WHERE maset = $1', [id]);
      
      // Thêm món ăn mới
      for (const dish of mon_an) {
        await client.query(`
          INSERT INTO setbuffet_chitiet (maset, mamon, soluong)
          VALUES ($1, $2, $3)
        `, [id, dish.mamon, dish.soluong || 1]);
      }
    }

    await client.query('COMMIT');

    res.json(formatResponse(true, result.rows[0], 'Cập nhật set buffet thành công'));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update buffet set error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  } finally {
    client.release();
  }
};

// Lấy danh sách khuyến mãi
const getPromotions = async (req, res) => {
  try {
    const { is_active } = req.query;

    let whereClause = '';
    const params = [];

    if (is_active !== undefined) {
      whereClause = 'WHERE km.is_active = $1';
      params.push(is_active === 'true');
    }

    const result = await pool.query(`
      SELECT km.*,
             COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'object_type', kma.object_type,
                   'object_id', CASE WHEN kma.object_id = 0 THEN NULL ELSE kma.object_id END
                 )
               ) FILTER (WHERE kma.makm IS NOT NULL),
               '[]'
             ) as ap_dung
      FROM khuyenmai km
      LEFT JOIN khuyenmai_apdung kma ON km.makm = kma.makm
      ${whereClause}
      GROUP BY km.makm, km.tenkm, km.loai_km, km.giatri, km.ngay_batdau, 
               km.ngay_ketthuc, km.dieu_kien, km.is_active
      ORDER BY km.ngay_ketthuc DESC
    `, params);

    res.json(formatResponse(true, result.rows, 'Lấy danh sách khuyến mãi thành công'));

  } catch (error) {
    console.error('Get promotions error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo khuyến mãi mới
const createPromotion = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      tenkm, loai_km, giatri, ngay_batdau, ngay_ketthuc, 
      dieu_kien, is_active, ap_dung 
    } = req.body;

    // Tạo khuyến mãi
    const result = await client.query(`
      INSERT INTO khuyenmai (tenkm, loai_km, giatri, ngay_batdau, ngay_ketthuc, dieu_kien, is_active)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [tenkm, loai_km, giatri, ngay_batdau, ngay_ketthuc, dieu_kien, is_active]);

    const promotion = result.rows[0];

    // Thêm áp dụng khuyến mãi
    if (ap_dung && ap_dung.length > 0) {
      for (const item of ap_dung) {
        // Nếu object_id là null/undefined, dùng 0 để đại diện cho "áp dụng toàn bộ"
        const objectId = item.object_id || 0;
        await client.query(`
          INSERT INTO khuyenmai_apdung (makm, object_type, object_id)
          VALUES ($1, $2, $3)
        `, [promotion.makm, item.object_type, objectId]);
      }
    }

    await client.query('COMMIT');

    res.status(201).json(formatResponse(true, promotion, 'Tạo khuyến mãi thành công'));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create promotion error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  } finally {
    client.release();
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
  getPromotions,
  createPromotion
};
