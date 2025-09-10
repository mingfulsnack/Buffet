const { Employee } = require('../models');
const { formatResponse, formatErrorResponse } = require('../utils/helpers');

// Lấy danh sách nhân viên
const getEmployees = async (req, res) => {
  try {
    const { page = 1, limit = 20, mavaitro, is_active, search } = req.query;

    const conditions = {};
    if (mavaitro) conditions.mavaitro = mavaitro;
    if (is_active !== undefined) conditions.is_active = is_active === 'true';
    if (search) conditions.search = search;

    const result = await Employee.findAllWithRole(conditions, page, limit);

    res.json(
      formatResponse(true, result.data, 'Lấy danh sách nhân viên thành công', {
        pagination: result.pagination,
      })
    );
  } catch (error) {
    console.error('Get employees error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy chi tiết nhân viên
const getEmployeeDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findByIdWithPermissions(id);

    if (!employee) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy nhân viên'));
    }

    res.json(
      formatResponse(true, employee, 'Lấy chi tiết nhân viên thành công')
    );
  } catch (error) {
    console.error('Get employee detail error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo nhân viên mới
const createEmployee = async (req, res) => {
  try {
    const { hoten, tendangnhap, matkhau, mavaitro, sodienthoai, email, calam } =
      req.body;

    // Kiểm tra tên đăng nhập đã tồn tại
    if (tendangnhap) {
      const exists = await Employee.isUsernameExists(tendangnhap);
      if (exists) {
        return res
          .status(400)
          .json(formatErrorResponse('Tên đăng nhập đã được sử dụng'));
      }
    }

    const employeeData = {
      hoten,
      tendangnhap,
      mavaitro,
      sodienthoai,
      email,
      calam,
    };

    if (matkhau) {
      employeeData.matkhau = matkhau;
    }

    const result = await Employee.createEmployee(employeeData);

    // Loại bỏ mật khẩu khỏi response
    delete result.matkhauhash;

    res
      .status(201)
      .json(formatResponse(true, result, 'Tạo nhân viên thành công'));
  } catch (error) {
    console.error('Create employee error:', error);
    if (error.code === '23505') {
      res
        .status(400)
        .json(formatErrorResponse('Tên đăng nhập đã được sử dụng'));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Cập nhật thông tin nhân viên
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      hoten,
      tendangnhap,
      mavaitro,
      sodienthoai,
      email,
      calam,
      is_active,
    } = req.body;

    // Kiểm tra nhân viên có tồn tại
    const existing = await Employee.findById(id);
    if (!existing) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy nhân viên'));
    }

    // Kiểm tra tên đăng nhập trùng lặp nếu thay đổi
    if (tendangnhap && tendangnhap !== existing.tendangnhap) {
      const exists = await Employee.isUsernameExists(tendangnhap, id);
      if (exists) {
        return res
          .status(400)
          .json(formatErrorResponse('Tên đăng nhập đã được sử dụng'));
      }
    }

    const updateData = {};
    if (hoten) updateData.hoten = hoten;
    if (tendangnhap) updateData.tendangnhap = tendangnhap;
    if (mavaitro) updateData.mavaitro = mavaitro;
    if (sodienthoai) updateData.sodienthoai = sodienthoai;
    if (email) updateData.email = email;
    if (calam) updateData.calam = calam;
    if (is_active !== undefined) updateData.is_active = is_active;

    const result = await Employee.update(id, updateData);

    // Loại bỏ mật khẩu khỏi response
    delete result.matkhauhash;

    res.json(formatResponse(true, result, 'Cập nhật nhân viên thành công'));
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
      return res
        .status(400)
        .json(formatErrorResponse('Mật khẩu mới phải có ít nhất 6 ký tự'));
    }

    // Kiểm tra nhân viên có tồn tại
    const existing = await Employee.findById(id);
    if (!existing) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy nhân viên'));
    }

    await Employee.updatePassword(id, matkhau_moi);

    res.json(formatResponse(true, null, 'Reset mật khẩu thành công'));
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách vai trò
const getRoles = async (req, res) => {
  try {
    const roles = await Employee.getRoles();
    res.json(formatResponse(true, roles, 'Lấy danh sách vai trò thành công'));
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo vai trò mới
const createRole = async (req, res) => {
  try {
    const { tenvaitro } = req.body;

    const result = await Employee.createRole(tenvaitro);

    res
      .status(201)
      .json(formatResponse(true, result, 'Tạo vai trò thành công'));
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
    const permissions = await Employee.getPermissions();
    res.json(
      formatResponse(true, permissions, 'Lấy danh sách quyền thành công')
    );
  } catch (error) {
    console.error('Get permissions error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo quyền mới
const createPermission = async (req, res) => {
  try {
    const { tenquyen } = req.body;

    const result = await Employee.createPermission(tenquyen);

    res.status(201).json(formatResponse(true, result, 'Tạo quyền thành công'));
  } catch (error) {
    console.error('Create permission error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Cập nhật quyền cho vai trò
const updateRolePermissions = async (req, res) => {
  try {
    const { id } = req.params; // mavaitro
    const { permissions } = req.body; // array of maquyen

    await Employee.updateRolePermissions(id, permissions);

    res.json(
      formatResponse(true, null, 'Cập nhật quyền cho vai trò thành công')
    );
  } catch (error) {
    console.error('Update role permissions error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Xóa nhân viên
const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem nhân viên có tồn tại không
    const employee = await Employee.findById(id);
    if (!employee) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy nhân viên'));
    }

    // Đánh dấu không hoạt động thay vì xóa hoàn toàn
    await Employee.update(id, { is_active: false }, 'manv');

    res.json(formatResponse(true, null, 'Vô hiệu hóa nhân viên thành công'));
  } catch (error) {
    console.error('Delete employee error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

module.exports = {
  getEmployees,
  getEmployeeDetail,
  createEmployee,
  updateEmployee,
  resetEmployeePassword,
  deleteEmployee,
  getRoles,
  createRole,
  getPermissions,
  createPermission,
  updateRolePermissions,
};
