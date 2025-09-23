const { Table } = require('../models');
const { formatResponse, formatErrorResponse } = require('../utils/helpers');

// Lấy danh sách bàn với sơ đồ (trạng thái theo thời gian thực)
const getTables = async (req, res) => {
  try {
    const { mavung, trangthai, checkTime } = req.query;

    const conditions = {};
    if (mavung) conditions.mavung = mavung;
    if (trangthai) conditions.trangthai = trangthai;

    const tablesByArea = await Table.findAllWithArea(conditions);

    res.json(
      formatResponse(true, tablesByArea, 'Lấy danh sách bàn thành công')
    );
  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách bàn có thể đặt tại thời điểm cụ thể
const getAvailableTablesAtTime = async (req, res) => {
  try {
    const { thoigian_dat, songuoi } = req.query;

    if (!thoigian_dat) {
      return res
        .status(400)
        .json(formatErrorResponse('Thiếu thời gian đặt bàn'));
    }

    // Validate thời gian đặt
    const bookingTime = new Date(thoigian_dat);
    const now = new Date();

    if (bookingTime <= now) {
      return res
        .status(400)
        .json(formatErrorResponse('Thời gian đặt bàn phải trong tương lai'));
    }

    const tablesByArea = await Table.findAvailableTablesAtTime(
      bookingTime,
      songuoi ? parseInt(songuoi) : null
    );

    res.json(
      formatResponse(
        true,
        tablesByArea,
        `Lấy danh sách bàn trống lúc ${bookingTime.toLocaleString(
          'vi-VN'
        )} thành công`
      )
    );
  } catch (error) {
    console.error('Get available tables error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Kiểm tra trạng thái bàn tại thời điểm cụ thể
const getTableStatusAtTime = async (req, res) => {
  try {
    const { id } = req.params;
    const { checkTime } = req.query;

    const timeToCheck = checkTime ? new Date(checkTime) : new Date();
    const tableStatus = await Table.getTableStatusAtTime(id, timeToCheck);

    if (!tableStatus) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy bàn'));
    }

    res.json(
      formatResponse(
        true,
        tableStatus,
        `Trạng thái bàn tại ${timeToCheck.toLocaleString('vi-VN')}`
      )
    );
  } catch (error) {
    console.error('Get table status error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy chi tiết bàn
const getTableDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const table = await Table.findByIdWithHistory(id);

    if (!table) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy bàn'));
    }

    res.json(formatResponse(true, table, 'Lấy chi tiết bàn thành công'));
  } catch (error) {
    console.error('Get table detail error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo bàn mới
const createTable = async (req, res) => {
  try {
    const { mavung, tenban, soghe, vitri, ghichu } = req.body;

    const tableData = {
      mavung,
      tenban,
      soghe,
      vitri,
      trangthai: 'Trong',
      ghichu,
    };

    const result = await Table.create(tableData);

    res.status(201).json(formatResponse(true, result, 'Tạo bàn thành công'));
  } catch (error) {
    console.error('Create table error:', error);
    if (error.code === '23505') {
      res
        .status(400)
        .json(formatErrorResponse('Tên bàn đã tồn tại trong vùng này'));
    } else if (error.code === '23503') {
      res.status(404).json(formatErrorResponse('Không tìm thấy vùng'));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Cập nhật thông tin bàn
const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenban, mavung, soghe, vitri, ghichu } = req.body;

    console.log('UpdateTable - ID:', id);
    console.log('UpdateTable - Request body:', req.body);

    // Kiểm tra bàn có tồn tại
    const existing = await Table.findById(id);
    if (!existing) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy bàn'));
    }

    console.log('UpdateTable - Existing table:', existing);

    const updateData = {};
    if (tenban !== undefined) updateData.tenban = tenban;
    if (mavung !== undefined) updateData.mavung = mavung;
    if (soghe !== undefined) updateData.soghe = soghe;
    if (vitri !== undefined) updateData.vitri = vitri;
    if (ghichu !== undefined) updateData.ghichu = ghichu;

    console.log('UpdateTable - Update data:', updateData);

    const result = await Table.update(id, updateData);

    console.log('UpdateTable - Result:', result);

    res.json(formatResponse(true, result, 'Cập nhật bàn thành công'));
  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Cập nhật trạng thái bàn
const updateTableStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangthai, version } = req.body;
    const manv = req.user.manv;

    // Sử dụng Table model với optimistic locking - đã handle tất cả business logic
    const result = await Table.updateStatus(id, trangthai, version, manv);

    if (!result) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy bàn'));
    }

    res.json(
      formatResponse(true, result, 'Cập nhật trạng thái bàn thành công')
    );
  } catch (error) {
    console.error('Update table status error:', error);
    if (error.message.includes('version')) {
      res
        .status(409)
        .json(
          formatErrorResponse(
            'Bàn đã được cập nhật bởi người khác. Vui lòng tải lại trang.'
          )
        );
    } else if (error.message.includes('trạng thái')) {
      res.status(400).json(formatErrorResponse(error.message));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Xóa bàn
const deleteTable = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra bàn có đặt chỗ đang hoạt động không
    const hasActiveBookings = await Table.hasActiveBookings(id);
    if (hasActiveBookings) {
      return res
        .status(400)
        .json(formatErrorResponse('Không thể xóa bàn đang có đặt chỗ'));
    }

    const result = await Table.delete(id);

    if (!result) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy bàn'));
    }

    res.json(formatResponse(true, null, 'Xóa bàn thành công'));
  } catch (error) {
    console.error('Delete table error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách vùng
const getAreas = async (req, res) => {
  try {
    const areas = await Table.getAreas();
    res.json(formatResponse(true, areas, 'Lấy danh sách vùng thành công'));
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo vùng mới
const createArea = async (req, res) => {
  try {
    const { tenvung, mota } = req.body;

    const result = await Table.createArea({ tenvung, mota });

    res.status(201).json(formatResponse(true, result, 'Tạo vùng thành công'));
  } catch (error) {
    console.error('Create area error:', error);
    if (error.code === '23505') {
      res.status(400).json(formatErrorResponse('Tên vùng đã tồn tại'));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

module.exports = {
  getTables,
  getAvailableTablesAtTime,
  getTableStatusAtTime,
  getTableDetail,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  getAreas,
  createArea,
};
