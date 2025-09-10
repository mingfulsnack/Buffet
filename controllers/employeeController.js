const pool = require('../config/database');
const { hashPassword, formatResponse, formatErrorResponse, getPaginationOffset } = require('../utils/helpers');

// Lấy danh sách nhân viên
const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, mavaitro, is_active, search } = req.query;
    const { offset, limit: pageLimit } = getPaginationOffset(page, limit);

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (mavaitro) {
      paramCount++;
      whereClause += ` AND nv.mavaitro = $${paramCount}`;
      params.push(mavaitro);
    }

    if (is_active !== undefined) {
      paramCount++;
      whereClause += ` AND nv.is_active = $${paramCount}`;
      params.push(is_active === 'true');
    }

    if (search) {
      paramCount++;
      whereClause += ` AND (nv.hoten ILIKE $${paramCount} OR nv.tendangnhap ILIKE $${paramCount} OR nv.sodienthoai ILIKE $${paramCount})`;
      params.push(`%${search}%`);
    }

    // Đếm tổng số bản ghi
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM nhanvien nv ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);

    // Lấy dữ liệu với phân trang
    params.push(pageLimit, offset);
    const result = await pool.query(`
      SELECT nv.manv, nv.hoten, nv.tendangnhap, nv.sodienthoai, nv.email,
             nv.calam, nv.ngayvaolam, nv.is_active, nv.created_at,
             vt.tenvaitro
      FROM nhanvien nv
      LEFT JOIN vai_tro vt ON nv.mavaitro = vt.mavaitro
      ${whereClause}
      ORDER BY nv.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    const totalPages = Math.ceil(total / pageLimit);

    res.json(formatResponse(
      true,
      result.rows,
      'Lấy danh sách nhân viên thành công',
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
    console.error('Get employees error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy chi tiết nhân viên
const getEmployeeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT nv.manv, nv.hoten, nv.tendangnhap, nv.sodienthoai, nv.email,
             nv.calam, nv.ngayvaolam, nv.is_active, nv.created_at, nv.mavaitro,
             vt.tenvaitro
      FROM nhanvien nv
      LEFT JOIN vai_tro vt ON nv.mavaitro = vt.mavaitro
      WHERE nv.manv = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy nhân viên'));
    }

    const employee = result.rows[0];

    // Lấy quyền của nhân viên
    const permissionsResult = await pool.query(`
      SELECT q.maquyen, q.tenquyen
      FROM vaitro_quyen vq
      JOIN quyen q ON vq.maquyen = q.maquyen
      WHERE vq.mavaitro = $1
      ORDER BY q.tenquyen
    `, [employee.mavaitro]);

    employee.quyen = permissionsResult.rows;

    res.json(formatResponse(true, employee, 'Lấy chi tiết nhân viên thành công'));

  } catch (error) {
    console.error('Get employee detail error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo nhân viên mới
const createEmployee = async (req, res) => {
  try {
    const { hoten, tendangnhap, matkhau, mavaitro, sodienthoai, email, calam } = req.body;

    // Kiểm tra tên đăng nhập đã tồn tại
    if (tendangnhap) {
      const existingResult = await pool.query(
        'SELECT * FROM nhanvien WHERE tendangnhap = $1',
        [tendangnhap]
      );

      if (existingResult.rows.length > 0) {
        return res.status(400).json(formatErrorResponse('Tên đăng nhập đã được sử dụng'));
      }
    }

    // Kiểm tra vai trò có tồn tại
    if (mavaitro) {
      const roleResult = await pool.query('SELECT * FROM vai_tro WHERE mavaitro = $1', [mavaitro]);
      if (roleResult.rows.length === 0) {
        return res.status(404).json(formatErrorResponse('Không tìm thấy vai trò'));
      }
    }

    // Hash mật khẩu nếu có
    let matkhauhash = null;
    if (matkhau) {
      matkhauhash = await hashPassword(matkhau);
    }

    const result = await pool.query(`
      INSERT INTO nhanvien (hoten, tendangnhap, matkhauhash, mavaitro, sodienthoai, email, calam)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING manv, hoten, tendangnhap, sodienthoai, email, calam, ngayvaolam, is_active, created_at
    `, [hoten, tendangnhap, matkhauhash, mavaitro, sodienthoai, email, calam]);

    res.status(201).json(formatResponse(true, result.rows[0], 'Tạo nhân viên thành công'));

  } catch (error) {
    console.error('Create employee error:', error);
    if (error.code === '23505') {
      res.status(400).json(formatErrorResponse('Tên đăng nhập đã được sử dụng'));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Cập nhật thông tin nhân viên
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const { hoten, tendangnhap, mavaitro, sodienthoai, email, calam, is_active } = req.body;

    // Kiểm tra nhân viên có tồn tại
    const existingResult = await pool.query('SELECT * FROM nhanvien WHERE manv = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy nhân viên'));
    }

    // Kiểm tra tên đăng nhập trùng lặp nếu thay đổi
    if (tendangnhap && tendangnhap !== existingResult.rows[0].tendangnhap) {
      const duplicateResult = await pool.query(
        'SELECT * FROM nhanvien WHERE tendangnhap = $1 AND manv != $2',
        [tendangnhap, id]
      );

      if (duplicateResult.rows.length > 0) {
        return res.status(400).json(formatErrorResponse('Tên đăng nhập đã được sử dụng'));
      }
    }

    // Kiểm tra vai trò nếu có
    if (mavaitro) {
      const roleResult = await pool.query('SELECT * FROM vai_tro WHERE mavaitro = $1', [mavaitro]);
      if (roleResult.rows.length === 0) {
        return res.status(404).json(formatErrorResponse('Không tìm thấy vai trò'));
      }
    }

    const result = await pool.query(`
      UPDATE nhanvien 
      SET hoten = COALESCE($1, hoten),
          tendangnhap = COALESCE($2, tendangnhap),
          mavaitro = COALESCE($3, mavaitro),
          sodienthoai = COALESCE($4, sodienthoai),
          email = COALESCE($5, email),
          calam = COALESCE($6, calam),
          is_active = COALESCE($7, is_active)
      WHERE manv = $8
      RETURNING manv, hoten, tendangnhap, sodienthoai, email, calam, ngayvaolam, is_active, created_at
    `, [hoten, tendangnhap, mavaitro, sodienthoai, email, calam, is_active, id]);

    res.json(formatResponse(true, result.rows[0], 'Cập nhật nhân viên thành công'));

  } catch (error) {
    console.error('Update employee error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Reset mật khẩu nhân viên
const resetEmployeePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { matkhau_moi } = req.body;

    if (!matkhau_moi || matkhau_moi.length < 6) {
      return res.status(400).json(formatErrorResponse('Mật khẩu mới phải có ít nhất 6 ký tự'));
    }

    // Kiểm tra nhân viên có tồn tại
    const existingResult = await pool.query('SELECT * FROM nhanvien WHERE manv = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy nhân viên'));
    }

    // Hash mật khẩu mới
    const matkhauhash = await hashPassword(matkhau_moi);

    await pool.query('UPDATE nhanvien SET matkhauhash = $1 WHERE manv = $2', [matkhauhash, id]);

    res.json(formatResponse(true, null, 'Reset mật khẩu thành công'));

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách vai trò
const getRoles = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT vt.*, COUNT(nv.manv) as so_nhan_vien
      FROM vai_tro vt
      LEFT JOIN nhanvien nv ON vt.mavaitro = nv.mavaitro AND nv.is_active = true
      GROUP BY vt.mavaitro, vt.tenvaitro
      ORDER BY vt.tenvaitro
    `);

    res.json(formatResponse(true, result.rows, 'Lấy danh sách vai trò thành công'));

  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo vai trò mới
const createRole = async (req, res) => {
  try {
    const { tenvaitro } = req.body;

    const result = await pool.query(`
      INSERT INTO vai_tro (tenvaitro)
      VALUES ($1)
      RETURNING *
    `, [tenvaitro]);

    res.status(201).json(formatResponse(true, result.rows[0], 'Tạo vai trò thành công'));

  } catch (error) {
    console.error('Create role error:', error);
    if (error.code === '23505') {
      res.status(400).json(formatErrorResponse('Tên vai trò đã tồn tại'));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Lấy danh sách quyền
const getPermissions = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM quyen ORDER BY tenquyen');
    res.json(formatResponse(true, result.rows, 'Lấy danh sách quyền thành công'));

  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo quyền mới
const createPermission = async (req, res) => {
  try {
    const { tenquyen } = req.body;

    const result = await pool.query(`
      INSERT INTO quyen (tenquyen)
      VALUES ($1)
      RETURNING *
    `, [tenquyen]);

    res.status(201).json(formatResponse(true, result.rows[0], 'Tạo quyền thành công'));

  } catch (error) {
    console.error('Create permission error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Cập nhật quyền cho vai trò
const updateRolePermissions = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params; // mavaitro
    const { permissions } = req.body; // array of maquyen

    // Kiểm tra vai trò có tồn tại
    const roleResult = await client.query('SELECT * FROM vai_tro WHERE mavaitro = $1', [id]);
    if (roleResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json(formatErrorResponse('Không tìm thấy vai trò'));
    }

    // Xóa quyền cũ
    await client.query('DELETE FROM vaitro_quyen WHERE mavaitro = $1', [id]);

    // Thêm quyền mới
    if (permissions && permissions.length > 0) {
      for (const maquyen of permissions) {
        await client.query(`
          INSERT INTO vaitro_quyen (mavaitro, maquyen)
          VALUES ($1, $2)
        `, [id, maquyen]);
      }
    }

    await client.query('COMMIT');

    res.json(formatResponse(true, null, 'Cập nhật quyền cho vai trò thành công'));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update role permissions error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  } finally {
    client.release();
  }
};

module.exports = {
  getEmployees,
  getEmployeeDetail,
  createEmployee,
  updateEmployee,
  resetEmployeePassword,
  getRoles,
  createRole,
  getPermissions,
  createPermission,
  updateRolePermissions
};
