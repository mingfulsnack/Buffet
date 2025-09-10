const BaseModel = require('./BaseModel');

class Menu extends BaseModel {
  constructor() {
    super('monan');
  }

  // Lấy thực đơn public cho khách hàng
  async getPublicMenu() {
    // Lấy danh mục món ăn
    const categories = await this.query(`
      SELECT dm.*, COUNT(m.mamon) as so_mon
      FROM danhmucmonan dm
      LEFT JOIN ${this.tableName} m ON dm.madanhmuc = m.madanhmuc AND m.trangthai = 'Con'
      GROUP BY dm.madanhmuc, dm.tendanhmuc, dm.mota
      ORDER BY dm.tendanhmuc
    `);

    // Lấy món ăn theo danh mục (bao gồm image)
    const dishes = await this.query(`
      SELECT m.*, dm.tendanhmuc
      FROM ${this.tableName} m
      JOIN danhmucmonan dm ON m.madanhmuc = dm.madanhmuc
      WHERE m.trangthai = 'Con'
      ORDER BY dm.tendanhmuc, m.tenmon
    `);

    // Lấy set buffet đang hoạt động (bao gồm image)
    const buffetSets = await this.query(`
      SELECT s.*, 
             JSON_AGG(
               JSON_BUILD_OBJECT(
                 'mamon', m.mamon,
                 'tenmon', m.tenmon,
                 'image', m.image,
                 'soluong', sc.soluong
               )
             ) as mon_an
      FROM setbuffet s
      LEFT JOIN setbuffet_chitiet sc ON s.maset = sc.maset
      LEFT JOIN ${this.tableName} m ON sc.mamon = m.mamon
      WHERE s.trangthai = 'HoatDong'
      GROUP BY s.maset, s.tenset, s.dongia, s.thoigian_batdau, s.thoigian_ketthuc, s.mota, s.trangthai, s.image
      ORDER BY s.dongia
    `);

    // Lấy khuyến mãi đang hoạt động
    const promotions = await this.query(`
      SELECT km.*
      FROM khuyenmai km
      WHERE km.is_active = true
        AND (km.ngay_batdau IS NULL OR km.ngay_batdau <= CURRENT_DATE)
        AND (km.ngay_ketthuc IS NULL OR km.ngay_ketthuc >= CURRENT_DATE)
      ORDER BY km.ngay_ketthuc ASC
    `);

    // Nhóm món ăn theo danh mục
    const menuByCategory = {};
    categories.rows.forEach(category => {
      menuByCategory[category.madanhmuc] = {
        ...category,
        mon_an: []
      };
    });

    dishes.rows.forEach(dish => {
      if (menuByCategory[dish.madanhmuc]) {
        menuByCategory[dish.madanhmuc].mon_an.push(dish);
      }
    });

    return {
      danh_muc: Object.values(menuByCategory),
      set_buffet: buffetSets.rows,
      khuyen_mai: promotions.rows
    };
  }

  // Lấy danh sách món ăn cho admin
  async findAllWithCategory(conditions = {}, page = 1, limit = 20) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (conditions.madanhmuc) {
      paramCount++;
      whereClause += ` AND m.madanhmuc = $${paramCount}`;
      params.push(conditions.madanhmuc);
    }

    if (conditions.trangthai) {
      paramCount++;
      whereClause += ` AND m.trangthai = $${paramCount}`;
      params.push(conditions.trangthai);
    }

    if (conditions.search) {
      paramCount++;
      whereClause += ` AND m.tenmon ILIKE $${paramCount}`;
      params.push(`%${conditions.search}%`);
    }

    // Đếm tổng số
    const countResult = await this.query(`
      SELECT COUNT(*) as total 
      FROM ${this.tableName} m 
      JOIN danhmucmonan dm ON m.madanhmuc = dm.madanhmuc
      ${whereClause}
    `, params);
    const total = parseInt(countResult.rows[0].total);

    // Lấy dữ liệu với phân trang
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const result = await this.query(`
      SELECT m.*, dm.tendanhmuc
      FROM ${this.tableName} m
      JOIN danhmucmonan dm ON m.madanhmuc = dm.madanhmuc
      ${whereClause}
      ORDER BY dm.tendanhmuc, m.tenmon
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // Kiểm tra món ăn có trong set buffet không
  async isInBuffetSet(id) {
    const result = await this.query(
      'SELECT COUNT(*) as count FROM setbuffet_chitiet WHERE mamon = $1',
      [id]
    );
    return parseInt(result.rows[0].count) > 0;
  }

  // Lấy danh sách danh mục
  async getCategories() {
    const result = await this.query(`
      SELECT dm.*, COUNT(m.mamon) as so_mon
      FROM danhmucmonan dm
      LEFT JOIN ${this.tableName} m ON dm.madanhmuc = m.madanhmuc
      GROUP BY dm.madanhmuc, dm.tendanhmuc, dm.mota
      ORDER BY dm.tendanhmuc
    `);

    return result.rows;
  }

  // Tạo danh mục mới
  async createCategory(data) {
    const result = await this.query(`
      INSERT INTO danhmucmonan (tendanhmuc, mota)
      VALUES ($1, $2)
      RETURNING *
    `, [data.tendanhmuc, data.mota]);

    return result.rows[0];
  }

  // Lấy danh sách set buffet
  async getBuffetSets(trangthai = null) {
    let whereClause = '';
    const params = [];

    if (trangthai) {
      whereClause = 'WHERE s.trangthai = $1';
      params.push(trangthai);
    }

    const result = await this.query(`
      SELECT s.*, 
             COALESCE(
               JSON_AGG(
                 JSON_BUILD_OBJECT(
                   'mamon', m.mamon,
                   'tenmon', m.tenmon,
                   'image', m.image,
                   'soluong', sc.soluong,
                   'dongia', m.dongia
                 )
               ) FILTER (WHERE m.mamon IS NOT NULL), 
               '[]'
             ) as mon_an
      FROM setbuffet s
      LEFT JOIN setbuffet_chitiet sc ON s.maset = sc.maset
      LEFT JOIN ${this.tableName} m ON sc.mamon = m.mamon
      ${whereClause}
      GROUP BY s.maset, s.tenset, s.dongia, s.thoigian_batdau, s.thoigian_ketthuc, s.mota, s.trangthai, s.image
      ORDER BY s.dongia
    `, params);

    return result.rows;
  }

  // Tạo set buffet mới
  async createBuffetSet(data) {
    return await this.transaction(async (client) => {
      const { tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota, mon_an, image } = data;

      // Tạo set buffet
      const setResult = await client.query(`
        INSERT INTO setbuffet (tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota, trangthai, image)
        VALUES ($1, $2, $3, $4, $5, 'HoatDong', $6)
        RETURNING *
      `, [tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota, image]);

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

      return buffetSet;
    });
  }

  // Cập nhật set buffet
  async updateBuffetSet(id, data) {
    return await this.transaction(async (client) => {
      const { tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota, trangthai, mon_an, image } = data;

      // Kiểm tra set có tồn tại
      const existing = await client.query('SELECT * FROM setbuffet WHERE maset = $1', [id]);
      if (existing.rows.length === 0) {
        throw new Error('Không tìm thấy set buffet');
      }

      // Cập nhật thông tin set
      const result = await client.query(`
        UPDATE setbuffet 
        SET tenset = COALESCE($1, tenset),
            dongia = COALESCE($2, dongia),
            thoigian_batdau = COALESCE($3, thoigian_batdau),
            thoigian_ketthuc = COALESCE($4, thoigian_ketthuc),
            mota = COALESCE($5, mota),
            trangthai = COALESCE($6, trangthai),
            image = COALESCE($7, image)
        WHERE maset = $8
        RETURNING *
      `, [tenset, dongia, thoigian_batdau, thoigian_ketthuc, mota, trangthai, image, id]);

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

      return result.rows[0];
    });
  }

  // Lấy danh sách khuyến mãi
  async getPromotions(isActive = null) {
    let whereClause = '';
    const params = [];

    if (isActive !== null) {
      whereClause = 'WHERE km.is_active = $1';
      params.push(isActive);
    }

    const result = await this.query(`
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

    return result.rows;
  }

  // Tạo khuyến mãi mới
  async createPromotion(data) {
    return await this.transaction(async (client) => {
      const { 
        tenkm, loai_km, giatri, ngay_batdau, ngay_ketthuc, 
        dieu_kien, is_active, ap_dung 
      } = data;

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
          const objectId = item.object_id || 0;
          await client.query(`
            INSERT INTO khuyenmai_apdung (makm, object_type, object_id)
            VALUES ($1, $2, $3)
          `, [promotion.makm, item.object_type, objectId]);
        }
      }

      return promotion;
    });
  }

  // Báo cáo món ăn phổ biến
  async getPopularDishes(fromDate, toDate) {
    const result = await this.query(`
      SELECT 
        m.mamon,
        m.tenmon,
        dm.tendanhmuc,
        m.dongia,
        SUM(dc.soluong) as tong_so_luong,
        COUNT(DISTINCT dc.madon) as so_don_goi,
        SUM(dc.soluong * dc.dongia) as doanh_thu
      FROM ${this.tableName} m
      JOIN danhmucmonan dm ON m.madanhmuc = dm.madanhmuc
      JOIN donhang_chitiet dc ON m.mamon = dc.mamon
      JOIN donhang d ON dc.madon = d.madon
      JOIN phieudatban p ON d.maphieu = p.maphieu
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
      GROUP BY m.mamon, m.tenmon, dm.tendanhmuc, m.dongia
      ORDER BY tong_so_luong DESC
      LIMIT 20
    `, [fromDate, toDate]);

    return result.rows;
  }

  // Thống kê theo danh mục
  async getCategoryStats(fromDate, toDate) {
    const result = await this.query(`
      SELECT 
        dm.tendanhmuc,
        COUNT(DISTINCT m.mamon) as so_mon,
        SUM(dc.soluong) as tong_so_luong,
        SUM(dc.soluong * dc.dongia) as doanh_thu
      FROM danhmucmonan dm
      JOIN ${this.tableName} m ON dm.madanhmuc = m.madanhmuc
      JOIN donhang_chitiet dc ON m.mamon = dc.mamon
      JOIN donhang d ON dc.madon = d.madon
      JOIN phieudatban p ON d.maphieu = p.maphieu
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
      GROUP BY dm.madanhmuc, dm.tendanhmuc
      ORDER BY doanh_thu DESC
    `, [fromDate, toDate]);

    return result.rows;
  }
}

module.exports = new Menu();
