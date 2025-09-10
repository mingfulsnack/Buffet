const { Customer } = require('../models');
const { formatResponse, formatErrorResponse } = require('../utils/helpers');

// Lấy danh sách khách hàng
const getCustomers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, mahang } = req.query;

    const conditions = {};
    if (search) conditions.search = search;
    if (mahang) conditions.mahang = mahang;

    const result = await Customer.findAllWithMembership(conditions, page, limit);

    res.json(formatResponse(
      true,
      result.data,
      'Lấy danh sách khách hàng thành công',
      { pagination: result.pagination }
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

    const customer = await Customer.findByIdWithHistory(id);

    if (!customer) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy khách hàng'));
    }

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
    const phoneExists = await Customer.isPhoneExists(sodienthoai);
    if (phoneExists) {
      return res.status(400).json(formatErrorResponse('Số điện thoại đã được sử dụng'));
    }

    const customerData = {
      hoten,
      gioitinh,
      sodienthoai,
      email,
      diachi,
      mahang
    };

    const result = await Customer.create(customerData);

    res.status(201).json(formatResponse(true, result, 'Tạo khách hàng thành công'));

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
    const existing = await Customer.findById(id);
    if (!existing) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy khách hàng'));
    }

    // Kiểm tra số điện thoại trùng lặp nếu thay đổi
    if (sodienthoai && sodienthoai !== existing.sodienthoai) {
      const phoneExists = await Customer.isPhoneExists(sodienthoai, id);
      if (phoneExists) {
        return res.status(400).json(formatErrorResponse('Số điện thoại đã được sử dụng'));
      }
    }

    const updateData = {};
    if (hoten !== undefined) updateData.hoten = hoten;
    if (gioitinh !== undefined) updateData.gioitinh = gioitinh;
    if (sodienthoai !== undefined) updateData.sodienthoai = sodienthoai;
    if (email !== undefined) updateData.email = email;
    if (diachi !== undefined) updateData.diachi = diachi;
    if (mahang !== undefined) updateData.mahang = mahang;

    const result = await Customer.update(id, updateData);

    res.json(formatResponse(true, result, 'Cập nhật khách hàng thành công'));

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
    const hasActiveBookings = await Customer.hasActiveBookings(id);
    if (hasActiveBookings) {
      return res.status(400).json(formatErrorResponse('Không thể xóa khách hàng đang có đặt bàn hoạt động'));
    }

    const result = await Customer.softDelete(id);

    if (!result) {
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

    const customer = await Customer.findByPhone(sodienthoai);

    if (!customer) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy khách hàng'));
    }

    res.json(formatResponse(true, customer, 'Tìm khách hàng thành công'));

  } catch (error) {
    console.error('Find customer by phone error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách hạng thành viên
const getMembershipTiers = async (req, res) => {
  try {
    const membershipTiers = await Customer.getMembershipTiers();

    res.json(formatResponse(true, membershipTiers, 'Lấy danh sách hạng thành viên thành công'));

  } catch (error) {
    console.error('Get membership tiers error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo hạng thành viên mới
const createMembershipTier = async (req, res) => {
  try {
    const { tenhang, uudai } = req.body;

    const result = await Customer.createMembershipTier({ tenhang, uudai });

    res.status(201).json(formatResponse(true, result, 'Tạo hạng thành viên thành công'));

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
