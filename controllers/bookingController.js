const { Booking, Table } = require('../models');
const { formatResponse, formatErrorResponse } = require('../utils/helpers');
const moment = require('moment');

// Tạo đặt bàn mới (cho khách hàng)
const createBooking = async (req, res) => {
  try {
    console.log('=== CREATE BOOKING REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    console.log('Request headers:', req.headers);

    const bookingData = {
      makh: req.body.makh,
      guest_hoten: req.body.guest_hoten,
      guest_sodienthoai: req.body.guest_sodienthoai,
      guest_email: req.body.guest_email,
      maban: req.body.maban,
      songuoi: req.body.songuoi,
      thoigian_dat: req.body.thoigian_dat,
      ghichu: req.body.ghichu,
    };

    console.log(
      'Processed booking data:',
      JSON.stringify(bookingData, null, 2)
    );
    console.log('thoigian_dat type:', typeof bookingData.thoigian_dat);
    console.log('thoigian_dat value:', bookingData.thoigian_dat);

    const booking = await Booking.createBooking(bookingData);

    // Lấy thông tin đầy đủ để trả về
    const fullBooking = await Booking.findByIdWithHistory(booking.maphieu);

    console.log('Booking created successfully:', booking.maphieu);
    res
      .status(201)
      .json(formatResponse(true, fullBooking, 'Đặt bàn thành công'));
  } catch (error) {
    console.error('=== CREATE BOOKING ERROR ===');
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Error details:', error);
    res.status(500).json(formatErrorResponse(error.message || 'Lỗi server'));
  }
};

// Lấy danh sách đặt bàn (cho admin)
const getBookings = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      trangthai,
      ngay_bat_dau,
      ngay_ket_thuc,
    } = req.query;

    const conditions = {};
    if (trangthai) conditions.trangthai = trangthai;
    if (ngay_bat_dau) conditions.ngay_bat_dau = ngay_bat_dau;
    if (ngay_ket_thuc) conditions.ngay_ket_thuc = ngay_ket_thuc;

    const result = await Booking.findAllWithDetails(conditions, page, limit);

    res.json(
      formatResponse(true, result.data, 'Lấy danh sách đặt bàn thành công', {
        pagination: result.pagination,
      })
    );
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy chi tiết đặt bàn
const getBookingDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await Booking.findByIdWithHistory(id);

    if (!booking) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy phiếu đặt bàn'));
    }

    res.json(formatResponse(true, booking, 'Lấy chi tiết đặt bàn thành công'));
  } catch (error) {
    console.error('Get booking detail error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Xác nhận đặt bàn (admin)
const confirmBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const manv = req.user.manv;

    const result = await Booking.confirmBooking(id, manv);

    if (!result) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy phiếu đặt bàn'));
    }

    res.json(formatResponse(true, null, 'Xác nhận đặt bàn thành công'));
  } catch (error) {
    console.error('Confirm booking error:', error);
    if (error.message.includes('trạng thái')) {
      res.status(400).json(formatErrorResponse(error.message));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Hủy đặt bàn (khách hàng hoặc admin)
const cancelBooking = async (req, res) => {
  try {
    const { token } = req.params; // booking_token cho khách hàng
    const { id } = req.params; // maphieu cho admin
    const { reason } = req.body; // Frontend gửi 'reason', không phải 'ly_do'
    const manv = req.user?.manv; // Có thể null nếu là khách hàng

    // Tạo identifier object theo format mà model expect
    let identifier;
    if (token) {
      identifier = { token: token };
    } else if (id) {
      identifier = { id: id };
    } else {
      return res
        .status(400)
        .json(formatErrorResponse('Thiếu thông tin để hủy đặt bàn'));
    }

    const result = await Booking.cancelBooking(identifier, manv, reason);

    if (!result) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy phiếu đặt bàn'));
    }

    res.json(formatResponse(true, null, 'Hủy đặt bàn thành công'));
  } catch (error) {
    console.error('Cancel booking error:', error);
    if (
      error.message.includes('deadline') ||
      error.message.includes('trạng thái')
    ) {
      res.status(400).json(formatErrorResponse(error.message));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Lấy thông tin đặt bàn bằng token (cho khách hàng)
const getBookingByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const booking = await Booking.findByToken(token);

    if (!booking) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy phiếu đặt bàn'));
    }

    res.json(formatResponse(true, booking, 'Lấy thông tin đặt bàn thành công'));
  } catch (error) {
    console.error('Get booking by token error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

module.exports = {
  createBooking,
  getBookings,
  getBookingDetail,
  confirmBooking,
  cancelBooking,
  getBookingByToken,
};
