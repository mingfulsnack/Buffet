const pool = require('../config/database');
const { formatResponse, formatErrorResponse, getPaginationOffset } = require('../utils/helpers');

// Lấy danh sách khách hàng
const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, mahang } = req.query;
    const { offset, limit: pageLimit } = getPaginationOffset(page, limit);

    let whereClause = 'WHERE kh.is_deleted = false';
    const params = [];
    let paramCount = 0;

    if (search) {
      paramCount++;
      whereClause += ` AND (kh.hoten ILIKE $${paramCount} OR kh.sodienthoai ILIKE $${paramCount} OR kh.email ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    if (mahang) {
      paramCount++;
      whereClause += ` AND kh.mahang = $${paramCount}`;
      params.push(mahang);
    }

    // Đếm tổng số bản ghi
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM khachhang kh ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);

    // Lấy dữ liệu với phân trang
    params.push(pageLimit, offset);
    const result = await pool.query(`
      SELECT kh.*, htv.tenhang, htv.uudai,
             COUNT(p.maphieu) as so_lan_dat,
             MAX(p.created_at) as lan_dat_cuoi
      FROM khachhang kh
      LEFT JOIN hangthanhvien htv ON kh.mahang = htv.mahang
      LEFT JOIN phieudatban p ON kh.makh = p.makh
      ${whereClause}
      GROUP BY kh.makh, kh.hoten, kh.gioitinh, kh.sodienthoai, kh.email, 
               kh.diachi, kh.mahang, kh.created_at, kh.updated_at, kh.is_deleted,
               htv.tenhang, htv.uudai
      ORDER BY kh.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    const totalPages = Math.ceil(total / pageLimit);

    res.json(formatResponse(
      true,
      result.rows,
      'Lấy danh sách khách hàng thành công',
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
    console.error('Get customers error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy chi tiết khách hàng
const getCustomerDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT kh.*, htv.tenhang, htv.uudai
      FROM khachhang kh
      LEFT JOIN hangthanhvien htv ON kh.mahang = htv.mahang
      WHERE kh.makh = $1 AND kh.is_deleted = false
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy khách hàng'));
    }

    const customer = result.rows[0];

    // Lấy lịch sử đặt bàn
    const bookingHistory = await pool.query(`
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

    customer.lich_su_dat_ban = bookingHistory.rows;

    // Thống kê
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as tong_lan_dat,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as lan_hoan_thanh,
        COALESCE(SUM(hd.thanhtoan), 0) as tong_chi_tieu
      FROM phieudatban p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.makh = $1
    `, [id]);

    customer.thong_ke = statsResult.rows[0];

    res.json(formatResponse(true, customer, 'Lấy chi tiết khách hàng thành công'));

  } catch (error) {
    console.error('Get customer detail error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo khách hàng mới
const createCustomer = async (req, res) => {
  try {
    const { hoten, gioitinh, sodienthoai, email, diachi, mahang } = req.body;

    // Kiểm tra số điện thoại đã tồn tại
    const existingResult = await pool.query(
      'SELECT * FROM khachhang WHERE sodienthoai = $1 AND is_deleted = false',
      [sodienthoai]
    );

    if (existingResult.rows.length > 0) {
      return res.status(400).json(formatErrorResponse('Số điện thoại đã được sử dụng'));
    }

    // Kiểm tra hạng thành viên nếu có
    if (mahang) {
      const membershipResult = await pool.query('SELECT * FROM hangthanhvien WHERE mahang = $1', [mahang]);
      if (membershipResult.rows.length === 0) {
        return res.status(404).json(formatErrorResponse('Không tìm thấy hạng thành viên'));
      }
    }

    const result = await pool.query(`
      INSERT INTO khachhang (hoten, gioitinh, sodienthoai, email, diachi, mahang)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [hoten, gioitinh, sodienthoai, email, diachi, mahang]);

    res.status(201).json(formatResponse(true, result.rows[0], 'Tạo khách hàng thành công'));

  } catch (error) {
    console.error('Create customer error:', error);
    if (error.code === '23505') {
      res.status(400).json(formatErrorResponse('Số điện thoại đã được sử dụng'));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Cập nhật thông tin khách hàng
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { hoten, gioitinh, sodienthoai, email, diachi, mahang } = req.body;

    // Kiểm tra khách hàng có tồn tại
    const existingResult = await pool.query(
      'SELECT * FROM khachhang WHERE makh = $1 AND is_deleted = false',
      [id]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy khách hàng'));
    }

    // Kiểm tra số điện thoại trùng lặp nếu thay đổi
    if (sodienthoai && sodienthoai !== existingResult.rows[0].sodienthoai) {
      const duplicateResult = await pool.query(
        'SELECT * FROM khachhang WHERE sodienthoai = $1 AND makh != $2 AND is_deleted = false',
        [sodienthoai, id]
      );

      if (duplicateResult.rows.length > 0) {
        return res.status(400).json(formatErrorResponse('Số điện thoại đã được sử dụng'));
      }
    }

    // Kiểm tra hạng thành viên nếu có
    if (mahang) {
      const membershipResult = await pool.query('SELECT * FROM hangthanhvien WHERE mahang = $1', [mahang]);
      if (membershipResult.rows.length === 0) {
        return res.status(404).json(formatErrorResponse('Không tìm thấy hạng thành viên'));
      }
    }

    const result = await pool.query(`
      UPDATE khachhang 
      SET hoten = COALESCE($1, hoten),
          gioitinh = COALESCE($2, gioitinh),
          sodienthoai = COALESCE($3, sodienthoai),
          email = COALESCE($4, email),
          diachi = COALESCE($5, diachi),
          mahang = COALESCE($6, mahang),
          updated_at = NOW()
      WHERE makh = $7
      RETURNING *
    `, [hoten, gioitinh, sodienthoai, email, diachi, mahang, id]);

    res.json(formatResponse(true, result.rows[0], 'Cập nhật khách hàng thành công'));

  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Xóa khách hàng (soft delete)
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra khách hàng có đặt bàn đang hoạt động không
    const activeBookingResult = await pool.query(
      'SELECT COUNT(*) as count FROM phieudatban WHERE makh = $1 AND trangthai IN ($2, $3, $4)',
      [id, 'DaDat', 'DaXacNhan', 'DangSuDung']
    );

    if (parseInt(activeBookingResult.rows[0].count) > 0) {
      return res.status(400).json(formatErrorResponse('Không thể xóa khách hàng đang có đặt bàn hoạt động'));
    }

    const result = await pool.query(
      'UPDATE khachhang SET is_deleted = true, updated_at = NOW() WHERE makh = $1 AND is_deleted = false RETURNING *',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy khách hàng'));
    }

    res.json(formatResponse(true, null, 'Xóa khách hàng thành công'));

  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tìm khách hàng theo số điện thoại
const findCustomerByPhone = async (req, res) => {
  try {
    const { sodienthoai } = req.params;

    const result = await pool.query(`
      SELECT kh.*, htv.tenhang, htv.uudai
      FROM khachhang kh
      LEFT JOIN hangthanhvien htv ON kh.mahang = htv.mahang
      WHERE kh.sodienthoai = $1 AND kh.is_deleted = false
    `, [sodienthoai]);

    if (result.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy khách hàng'));
    }

    res.json(formatResponse(true, result.rows[0], 'Tìm khách hàng thành công'));

  } catch (error) {
    console.error('Find customer by phone error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách hạng thành viên
const getMembershipTiers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT htv.*, COUNT(kh.makh) as so_thanh_vien
      FROM hangthanhvien htv
      LEFT JOIN khachhang kh ON htv.mahang = kh.mahang AND kh.is_deleted = false
      GROUP BY htv.mahang, htv.tenhang, htv.uudai, htv.created_at
      ORDER BY htv.created_at
    `);

    res.json(formatResponse(true, result.rows, 'Lấy danh sách hạng thành viên thành công'));

  } catch (error) {
    console.error('Get membership tiers error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo hạng thành viên mới
const createMembershipTier = async (req, res) => {
  try {
    const { tenhang, uudai } = req.body;

    const result = await pool.query(`
      INSERT INTO hangthanhvien (tenhang, uudai)
      VALUES ($1, $2)
      RETURNING *
    `, [tenhang, uudai]);

    res.status(201).json(formatResponse(true, result.rows[0], 'Tạo hạng thành viên thành công'));

  } catch (error) {
    console.error('Create membership tier error:', error);
    if (error.code === '23505') {
      res.status(400).json(formatErrorResponse('Tên hạng thành viên đã tồn tại'));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

module.exports = {
  getCustomers,
  getCustomerDetail,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  findCustomerByPhone,
  getMembershipTiers,
  createMembershipTier
};
