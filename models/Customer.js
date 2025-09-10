const BaseModel = require('./BaseModel');

class Customer extends BaseModel {
  constructor() {
    super('khachhang');
  }

  // Lấy danh sách khách hàng với hạng thành viên
  async findAllWithMembership(conditions = {}, page = 1, limit = 20) {
    let whereClause = 'WHERE kh.is_deleted = false';
    const params = [];
    let paramCount = 0;

    if (conditions.search) {
      paramCount++;
      whereClause += ` AND (kh.hoten ILIKE $${paramCount} OR kh.sodienthoai ILIKE $${paramCount} OR kh.email ILIKE $${paramCount})`;
      params.push(`%${conditions.search}%`);
    }

    if (conditions.mahang) {
      paramCount++;
      whereClause += ` AND kh.mahang = $${paramCount}`;
      params.push(conditions.mahang);
    }

    // Đếm tổng số
    const countResult = await this.query(`
      SELECT COUNT(*) as total FROM ${this.tableName} kh ${whereClause}
    `, params);
    const total = parseInt(countResult.rows[0].total);

    // Lấy dữ liệu với phân trang
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const result = await this.query(`
      SELECT kh.*, htv.tenhang, htv.uudai,
             COUNT(p.maphieu) as so_lan_dat,
             MAX(p.created_at) as lan_dat_cuoi
      FROM ${this.tableName} kh
      LEFT JOIN hangthanhvien htv ON kh.mahang = htv.mahang
      LEFT JOIN phieudatban p ON kh.makh = p.makh
      ${whereClause}
      GROUP BY kh.makh, kh.hoten, kh.gioitinh, kh.sodienthoai, kh.email, 
               kh.diachi, kh.mahang, kh.created_at, kh.updated_at, kh.is_deleted,
               htv.tenhang, htv.uudai
      ORDER BY kh.created_at DESC
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

  // Lấy chi tiết khách hàng với lịch sử và thống kê
  async findByIdWithHistory(id) {
    const customer = await this.query(`
      SELECT kh.*, htv.tenhang, htv.uudai
      FROM ${this.tableName} kh
      LEFT JOIN hangthanhvien htv ON kh.mahang = htv.mahang
      WHERE kh.makh = $1 AND kh.is_deleted = false
    `, [id]);

    if (customer.rows.length === 0) {
      return null;
    }

    const cust = customer.rows[0];

    // Lấy lịch sử đặt bàn
    const bookingHistory = await this.query(`
      SELECT p.maphieu, p.songuoi, p.thoigian_dat, p.trangthai, p.created_at,
             b.tenban, v.tenvung, hd.thanhtoan
      FROM phieudatban p
      JOIN ban b ON p.maban = b.maban
      JOIN vung v ON b.mavung = v.mavung
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.makh = $1
      ORDER BY p.created_at DESC
      LIMIT 10
    `, [id]);

    cust.lich_su_dat_ban = bookingHistory.rows;

    // Thống kê
    const stats = await this.query(`
      SELECT 
        COUNT(*) as tong_lan_dat,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as lan_hoan_thanh,
        COALESCE(SUM(hd.thanhtoan), 0) as tong_chi_tieu
      FROM phieudatban p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.makh = $1
    `, [id]);

    cust.thong_ke = stats.rows[0];

    return cust;
  }

  // Tìm khách hàng theo số điện thoại
  async findByPhone(sodienthoai) {
    const result = await this.query(`
      SELECT kh.*, htv.tenhang, htv.uudai
      FROM ${this.tableName} kh
      LEFT JOIN hangthanhvien htv ON kh.mahang = htv.mahang
      WHERE kh.sodienthoai = $1 AND kh.is_deleted = false
    `, [sodienthoai]);

    return result.rows[0] || null;
  }

  // Kiểm tra số điện thoại có tồn tại không
  async isPhoneExists(sodienthoai, excludeId = null) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE sodienthoai = $1 AND is_deleted = false`;
    const params = [sodienthoai];

    if (excludeId) {
      sql += ` AND makh != $2`;
      params.push(excludeId);
    }

    const result = await this.query(sql, params);
    return parseInt(result.rows[0].count) > 0;
  }

  // Soft delete
  async softDelete(id) {
    // Kiểm tra có đặt bàn đang hoạt động không
    const activeBookings = await this.query(
      'SELECT COUNT(*) as count FROM phieudatban WHERE makh = $1 AND trangthai IN ($2, $3, $4)',
      [id, 'DaDat', 'DaXacNhan', 'DangSuDung']
    );

    if (parseInt(activeBookings.rows[0].count) > 0) {
      throw new Error('Không thể xóa khách hàng đang có đặt bàn hoạt động');
    }

    return await this.update(id, {
      is_deleted: true,
      updated_at: new Date()
    });
  }

  // Lấy danh sách hạng thành viên
  async getMembershipTiers() {
    const result = await this.query(`
      SELECT htv.*, COUNT(kh.makh) as so_thanh_vien
      FROM hangthanhvien htv
      LEFT JOIN ${this.tableName} kh ON htv.mahang = kh.mahang AND kh.is_deleted = false
      GROUP BY htv.mahang, htv.tenhang, htv.uudai, htv.created_at
      ORDER BY htv.created_at
    `);

    return result.rows;
  }

  // Tạo hạng thành viên mới
  async createMembershipTier(data) {
    const result = await this.query(`
      INSERT INTO hangthanhvien (tenhang, uudai)
      VALUES ($1, $2)
      RETURNING *
    `, [data.tenhang, data.uudai]);

    return result.rows[0];
  }

  // Báo cáo khách hàng theo khoảng thời gian
  async getCustomerReport(fromDate, toDate, sortBy = 'doanh_thu') {
    let orderBy = 'SUM(hd.thanhtoan) DESC';
    if (sortBy === 'so_lan') {
      orderBy = 'COUNT(p.maphieu) DESC';
    } else if (sortBy === 'gan_nhat') {
      orderBy = 'MAX(p.created_at) DESC';
    }

    const result = await this.query(`
      SELECT 
        kh.makh,
        kh.hoten,
        kh.sodienthoai,
        kh.email,
        htv.tenhang,
        COUNT(p.maphieu) as so_lan_dat,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as lan_hoan_thanh,
        COUNT(CASE WHEN p.trangthai = 'DaHuy' THEN 1 END) as lan_huy,
        COALESCE(SUM(hd.thanhtoan), 0) as tong_chi_tieu,
        AVG(hd.thanhtoan) as chi_tieu_trung_binh,
        MAX(p.created_at) as lan_dat_cuoi
      FROM ${this.tableName} kh
      JOIN phieudatban p ON kh.makh = p.makh
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      LEFT JOIN hangthanhvien htv ON kh.mahang = htv.mahang
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
        AND kh.is_deleted = false
      GROUP BY kh.makh, kh.hoten, kh.sodienthoai, kh.email, htv.tenhang
      ORDER BY ${orderBy}
      LIMIT 100
    `, [fromDate, toDate]);

    return result.rows;
  }

  // Thống kê theo hạng thành viên
  async getMembershipStats(fromDate, toDate) {
    const result = await this.query(`
      SELECT 
        COALESCE(htv.tenhang, 'Chưa có hạng') as ten_hang,
        COUNT(DISTINCT kh.makh) as so_khach_hang,
        COUNT(p.maphieu) as so_lan_dat,
        COALESCE(SUM(hd.thanhtoan), 0) as doanh_thu,
        AVG(hd.thanhtoan) as chi_tieu_trung_binh
      FROM ${this.tableName} kh
      LEFT JOIN hangthanhvien htv ON kh.mahang = htv.mahang
      JOIN phieudatban p ON kh.makh = p.makh
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
        AND kh.is_deleted = false
      GROUP BY htv.mahang, htv.tenhang
      ORDER BY doanh_thu DESC
    `, [fromDate, toDate]);

    return result.rows;
  }
}

module.exports = new Customer();
