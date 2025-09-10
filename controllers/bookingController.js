const pool = require('../config/database');
const { formatResponse, formatErrorResponse, getPaginationOffset, generateBookingToken } = require('../utils/helpers');
const moment = require('moment');

// Tạo đặt bàn mới (cho khách hàng)
const createBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const {
      makh,
      guest_hoten,
      guest_sodienthoai,
      guest_email,
      maban,
      songuoi,
      thoigian_dat,
      ghichu
    } = req.body;

    // Kiểm tra thời gian đặt bàn (phải trong tương lai)
    const bookingTime = moment(thoigian_dat);
    if (bookingTime.isBefore(moment())) {
      await client.query('ROLLBACK');
      return res.status(400).json(formatErrorResponse('Thời gian đặt bàn phải trong tương lai'));
    }

    // Kiểm tra bàn có tồn tại và đủ chỗ ngồi
    const tableResult = await client.query(
      'SELECT * FROM ban WHERE maban = $1',
      [maban]
    );

    if (tableResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json(formatErrorResponse('Không tìm thấy bàn'));
    }

    const table = tableResult.rows[0];
    if (table.soghe < songuoi) {
      await client.query('ROLLBACK');
      return res.status(400).json(formatErrorResponse(`Bàn chỉ có ${table.soghe} ghế, không đủ cho ${songuoi} người`));
    }

    // Kiểm tra bàn có trống trong thời gian đặt không
    const conflictResult = await client.query(`
      SELECT * FROM phieudatban 
      WHERE maban = $1 
        AND trangthai IN ('DaDat', 'DaXacNhan', 'DangSuDung')
        AND thoigian_dat <= $2 + INTERVAL '2 hours'
        AND thoigian_dat + INTERVAL '2 hours' >= $2
    `, [maban, thoigian_dat]);

    if (conflictResult.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json(formatErrorResponse('Bàn đã được đặt trong thời gian này'));
    }

    // Tạo booking token
    const bookingToken = generateBookingToken();
    
    // Tính deadline để hủy (1 giờ trước giờ đặt)
    const cancelDeadline = moment(thoigian_dat).subtract(1, 'hour').toISOString();

    // Tạo phiếu đặt bàn
    const bookingResult = await client.query(`
      INSERT INTO phieudatban (
        makh, guest_hoten, guest_sodienthoai, guest_email, maban, songuoi,
        thoigian_dat, trangthai, nguon_dat, booking_token, cancel_deadline, ghichu
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'DaDat', 'Online', $8, $9, $10)
      RETURNING *
    `, [
      makh || null, guest_hoten, guest_sodienthoai, guest_email,
      maban, songuoi, thoigian_dat, bookingToken, cancelDeadline, ghichu
    ]);

    const booking = bookingResult.rows[0];

    // Cập nhật trạng thái bàn
    await client.query(
      'UPDATE ban SET trangthai = $1 WHERE maban = $2',
      ['DaDat', maban]
    );

    // Ghi log lịch sử
    await client.query(`
      INSERT INTO phieudatban_lichsu (maphieu, hanh_dong, noidung)
      VALUES ($1, 'Created', $2)
    `, [booking.maphieu, `Đặt bàn online cho ${songuoi} người`]);

    // Tạo thông báo
    await client.query(`
      INSERT INTO thongbao (maphieu, loai, noidung)
      VALUES ($1, 'BookingCreated', $2)
    `, [booking.maphieu, `Đặt bàn mới: ${guest_hoten || 'Khách hàng'} - ${songuoi} người`]);

    await client.query('COMMIT');

    // Lấy thông tin đầy đủ để trả về
    const fullBookingResult = await pool.query(`
      SELECT p.*, b.tenban, v.tenvung
      FROM phieudatban p
      JOIN ban b ON p.maban = b.maban
      JOIN vung v ON b.mavung = v.mavung
      WHERE p.maphieu = $1
    `, [booking.maphieu]);

    res.status(201).json(formatResponse(
      true, 
      fullBookingResult.rows[0], 
      'Đặt bàn thành công'
    ));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create booking error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  } finally {
    client.release();
  }
};

// Lấy danh sách đặt bàn (cho admin)
const getBookings = async (req, res) => {
  try {
    const { page = 1, limit = 10, trangthai, ngay_bat_dau, ngay_ket_thuc } = req.query;
    const { offset, limit: pageLimit } = getPaginationOffset(page, limit);

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (trangthai) {
      paramCount++;
      whereClause += ` AND p.trangthai = $${paramCount}`;
      params.push(trangthai);
    }

    if (ngay_bat_dau) {
      paramCount++;
      whereClause += ` AND p.thoigian_dat >= $${paramCount}`;
      params.push(ngay_bat_dau);
    }

    if (ngay_ket_thuc) {
      paramCount++;
      whereClause += ` AND p.thoigian_dat <= $${paramCount}`;
      params.push(ngay_ket_thuc);
    }

    // Đếm tổng số bản ghi
    const countResult = await pool.query(`
      SELECT COUNT(*) as total FROM phieudatban p ${whereClause}
    `, params);

    const total = parseInt(countResult.rows[0].total);

    // Lấy dữ liệu với phân trang
    params.push(pageLimit, offset);
    const result = await pool.query(`
      SELECT p.*, 
             kh.hoten as khachhang_hoten,
             b.tenban, 
             v.tenvung,
             nv.hoten as nhanvien_tao
      FROM phieudatban p
      LEFT JOIN khachhang kh ON p.makh = kh.makh
      JOIN ban b ON p.maban = b.maban
      JOIN vung v ON b.mavung = v.mavung
      LEFT JOIN nhanvien nv ON p.created_by = nv.manv
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    const totalPages = Math.ceil(total / pageLimit);

    res.json(formatResponse(
      true,
      result.rows,
      'Lấy danh sách đặt bàn thành công',
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
    console.error('Get bookings error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy chi tiết đặt bàn
const getBookingDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT p.*, 
             kh.hoten as khachhang_hoten, kh.sodienthoai as khachhang_sdt,
             kh.email as khachhang_email,
             b.tenban, b.soghe,
             v.tenvung,
             nv.hoten as nhanvien_tao
      FROM phieudatban p
      LEFT JOIN khachhang kh ON p.makh = kh.makh
      JOIN ban b ON p.maban = b.maban
      JOIN vung v ON b.mavung = v.mavung
      LEFT JOIN nhanvien nv ON p.created_by = nv.manv
      WHERE p.maphieu = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy phiếu đặt bàn'));
    }

    // Lấy lịch sử thay đổi
    const historyResult = await pool.query(`
      SELECT ls.*, nv.hoten as nhanvien_thuchien
      FROM phieudatban_lichsu ls
      LEFT JOIN nhanvien nv ON ls.thuchienboi = nv.manv
      WHERE ls.maphieu = $1
      ORDER BY ls.thoi_gian DESC
    `, [id]);

    const booking = result.rows[0];
    booking.lich_su = historyResult.rows;

    res.json(formatResponse(true, booking, 'Lấy chi tiết đặt bàn thành công'));

  } catch (error) {
    console.error('Get booking detail error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Xác nhận đặt bàn (admin)
const confirmBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const manv = req.user.manv;

    // Kiểm tra đặt bàn có tồn tại
    const bookingResult = await client.query(
      'SELECT * FROM phieudatban WHERE maphieu = $1',
      [id]
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json(formatErrorResponse('Không tìm thấy phiếu đặt bàn'));
    }

    const booking = bookingResult.rows[0];

    if (booking.trangthai !== 'DaDat') {
      await client.query('ROLLBACK');
      return res.status(400).json(formatErrorResponse('Chỉ có thể xác nhận đặt bàn ở trạng thái "Đã đặt"'));
    }

    // Cập nhật trạng thái
    await client.query(
      'UPDATE phieudatban SET trangthai = $1, updated_at = NOW() WHERE maphieu = $2',
      ['DaXacNhan', id]
    );

    // Ghi log
    await client.query(`
      INSERT INTO phieudatban_lichsu (maphieu, hanh_dong, noidung, thuchienboi)
      VALUES ($1, 'Confirmed', 'Xác nhận đặt bàn', $2)
    `, [id, manv]);

    await client.query('COMMIT');

    res.json(formatResponse(true, null, 'Xác nhận đặt bàn thành công'));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Confirm booking error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  } finally {
    client.release();
  }
};

// Hủy đặt bàn (khách hàng hoặc admin)
const cancelBooking = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { token } = req.params; // booking_token cho khách hàng
    const { id } = req.params; // maphieu cho admin
    const { ly_do } = req.body;
    
    let whereClause, params;
    
    if (token) {
      // Khách hàng hủy bằng token
      whereClause = 'WHERE booking_token = $1';
      params = [token];
    } else if (id) {
      // Admin hủy bằng ID
      whereClause = 'WHERE maphieu = $1';
      params = [id];
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json(formatErrorResponse('Thiếu thông tin để hủy đặt bàn'));
    }

    // Lấy thông tin đặt bàn
    const bookingResult = await client.query(
      `SELECT * FROM phieudatban ${whereClause}`,
      params
    );

    if (bookingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json(formatErrorResponse('Không tìm thấy phiếu đặt bàn'));
    }

    const booking = bookingResult.rows[0];

    if (!['DaDat', 'DaXacNhan'].includes(booking.trangthai)) {
      await client.query('ROLLBACK');
      return res.status(400).json(formatErrorResponse('Không thể hủy đặt bàn ở trạng thái hiện tại'));
    }

    // Kiểm tra deadline (chỉ cho khách hàng)
    if (token && moment().isAfter(moment(booking.cancel_deadline))) {
      await client.query('ROLLBACK');
      return res.status(400).json(formatErrorResponse('Đã quá thời hạn hủy đặt bàn'));
    }

    // Cập nhật trạng thái đặt bàn
    await client.query(
      'UPDATE phieudatban SET trangthai = $1, thoigian_huy = NOW(), updated_at = NOW() WHERE maphieu = $2',
      ['DaHuy', booking.maphieu]
    );

    // Cập nhật trạng thái bàn về trống
    await client.query(
      'UPDATE ban SET trangthai = $1 WHERE maban = $2',
      ['Trong', booking.maban]
    );

    // Ghi log
    const manv = req.user ? req.user.manv : null;
    await client.query(`
      INSERT INTO phieudatban_lichsu (maphieu, hanh_dong, noidung, thuchienboi)
      VALUES ($1, 'Cancelled', $2, $3)
    `, [booking.maphieu, ly_do || 'Hủy đặt bàn', manv]);

    await client.query('COMMIT');

    res.json(formatResponse(true, null, 'Hủy đặt bàn thành công'));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel booking error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  } finally {
    client.release();
  }
};

// Lấy thông tin đặt bàn bằng token (cho khách hàng)
const getBookingByToken = async (req, res) => {
  try {
    const { token } = req.params;

    const result = await pool.query(`
      SELECT p.*, 
             b.tenban, b.soghe,
             v.tenvung
      FROM phieudatban p
      JOIN ban b ON p.maban = b.maban
      JOIN vung v ON b.mavung = v.mavung
      WHERE p.booking_token = $1
    `, [token]);

    if (result.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy phiếu đặt bàn'));
    }

    const booking = result.rows[0];
    
    // Không trả về thông tin nhạy cảm
    delete booking.makh;
    delete booking.created_by;

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
  getBookingByToken
};
