const { Employee } = require('../models');
const { verifyPassword, generateToken, formatResponse, formatErrorResponse } = require('../utils/helpers');

// Đăng nhập
const login = async (req, res) => {
  try {
    const { tendangnhap, matkhau } = req.body;

    if (!tendangnhap || !matkhau) {
      return res.status(400).json(formatErrorResponse('Tên đăng nhập và mật khẩu là bắt buộc'));
    }

    // Tìm nhân viên
    const employee = await Employee.findByUsername(tendangnhap);

    if (!employee) {
      return res.status(401).json(formatErrorResponse('Tên đăng nhập hoặc mật khẩu không đúng'));
    }

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

    // Lấy thông tin nhân viên hiện tại
    const employee = await Employee.findById(manv);
    if (!employee) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy nhân viên'));
    }

    // Kiểm tra mật khẩu cũ
    const isValidOldPassword = await verifyPassword(matkhau_cu, employee.matkhauhash);
    if (!isValidOldPassword) {
      return res.status(400).json(formatErrorResponse('Mật khẩu cũ không đúng'));
    }

    // Cập nhật mật khẩu
    await Employee.updatePassword(manv, matkhau_moi);

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

    const employee = await Employee.findByIdWithPermissions(manv);

    if (!employee) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy thông tin nhân viên'));
    }

    res.json(formatResponse(true, employee, 'Lấy thông tin profile thành công'));

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
