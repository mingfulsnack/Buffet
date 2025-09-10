const pool = require('../config/database');
const { hashPassword, verifyPassword, generateToken, formatResponse, formatErrorResponse } = require('../utils/helpers');

// Đăng nhập
const login = async (req, res) => {
  try {
    const { tendangnhap, matkhau } = req.body;

    if (!tendangnhap || !matkhau) {
      return res.status(400).json(formatErrorResponse('Tên đăng nhập và mật khẩu là bắt buộc'));
    }

    // Tìm nhân viên
    const result = await pool.query(`
      SELECT nv.*, vt.tenvaitro 
      FROM nhanvien nv
      LEFT JOIN vai_tro vt ON nv.mavaitro = vt.mavaitro
      WHERE nv.tendangnhap = $1 AND nv.is_active = true
    `, [tendangnhap]);

    if (result.rows.length === 0) {
      return res.status(401).json(formatErrorResponse('Tên đăng nhập hoặc mật khẩu không đúng'));
    }

    const employee = result.rows[0];

    // Kiểm tra mật khẩu
    const isValidPassword = await verifyPassword(matkhau, employee.matkhauhash);
    if (!isValidPassword) {
      return res.status(401).json(formatErrorResponse('Tên đăng nhập hoặc mật khẩu không đúng'));
    }

    // Tạo token
    const token = generateToken({
      manv: employee.manv,
      tendangnhap: employee.tendangnhap,
      mavaitro: employee.mavaitro
    });

    // Loại bỏ mật khẩu khỏi response
    delete employee.matkhauhash;

    res.json(formatResponse(true, {
      token,
      employee
    }, 'Đăng nhập thành công'));

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Đổi mật khẩu
const changePassword = async (req, res) => {
  try {
    const { matkhau_cu, matkhau_moi } = req.body;
    const manv = req.user.manv;

    if (!matkhau_cu || !matkhau_moi) {
      return res.status(400).json(formatErrorResponse('Mật khẩu cũ và mật khẩu mới là bắt buộc'));
    }

    if (matkhau_moi.length < 6) {
      return res.status(400).json(formatErrorResponse('Mật khẩu mới phải có ít nhất 6 ký tự'));
    }

    // Lấy mật khẩu hiện tại
    const result = await pool.query('SELECT matkhauhash FROM nhanvien WHERE manv = $1', [manv]);
    if (result.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy nhân viên'));
    }

    // Kiểm tra mật khẩu cũ
    const isValidOldPassword = await verifyPassword(matkhau_cu, result.rows[0].matkhauhash);
    if (!isValidOldPassword) {
      return res.status(400).json(formatErrorResponse('Mật khẩu cũ không đúng'));
    }

    // Hash mật khẩu mới
    const newPasswordHash = await hashPassword(matkhau_moi);

    // Cập nhật mật khẩu
    await pool.query(
      'UPDATE nhanvien SET matkhauhash = $1 WHERE manv = $2',
      [newPasswordHash, manv]
    );

    res.json(formatResponse(true, null, 'Đổi mật khẩu thành công'));

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy thông tin profile
const getProfile = async (req, res) => {
  try {
    const manv = req.user.manv;

    const result = await pool.query(`
      SELECT nv.manv, nv.hoten, nv.tendangnhap, nv.sodienthoai, nv.email, 
             nv.calam, nv.ngayvaolam, nv.created_at, vt.tenvaitro
      FROM nhanvien nv
      LEFT JOIN vai_tro vt ON nv.mavaitro = vt.mavaitro
      WHERE nv.manv = $1 AND nv.is_active = true
    `, [manv]);

    if (result.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy thông tin nhân viên'));
    }

    res.json(formatResponse(true, result.rows[0], 'Lấy thông tin profile thành công'));

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

module.exports = {
  login,
  changePassword,
  getProfile
};
