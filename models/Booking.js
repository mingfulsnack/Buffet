const BaseModel = require('./BaseModel');
const { generateBookingToken } = require('../utils/helpers');
const moment = require('moment');

class Booking extends BaseModel {
  constructor() {
    super('phieudatban');
  }

  // Tạo đặt bàn mới
  async createBooking(data) {
    return await this.transaction(async (client) => {
      console.log('=== BOOKING MODEL CREATE ===');
      console.log('Input data:', JSON.stringify(data, null, 2));

      const {
        makh,
        guest_hoten,
        guest_sodienthoai,
        guest_email,
        maban,
        songuoi,
        thoigian_dat,
        ghichu,
      } = data;

      console.log('Extracted booking time:', thoigian_dat);
      console.log('Booking time type:', typeof thoigian_dat);

      // Kiểm tra thời gian đặt bàn
      const bookingTime = moment(thoigian_dat);
      console.log('Parsed moment:', bookingTime.format());
      console.log('Is valid moment:', bookingTime.isValid());
      console.log('Current time:', moment().format());

      if (!bookingTime.isValid()) {
        throw new Error('Thời gian đặt bàn không hợp lệ');
      }

      if (bookingTime.isBefore(moment())) {
        throw new Error('Thời gian đặt bàn phải trong tương lai');
      }

      // Kiểm tra bàn có tồn tại và đủ chỗ ngồi
      console.log('Checking table:', maban);
      const table = await client.query('SELECT * FROM ban WHERE maban = $1', [
        maban,
      ]);
      if (table.rows.length === 0) {
        throw new Error('Không tìm thấy bàn');
      }

      console.log('Table info:', table.rows[0]);
      if (table.rows[0].soghe < songuoi) {
        throw new Error(
          `Bàn chỉ có ${table.rows[0].soghe} ghế, không đủ cho ${songuoi} người`
        );
      }

      // Chuẩn bị thời gian cho query conflict check
      const bookingStart = bookingTime.toISOString();
      const bookingEnd = bookingTime.clone().add(2, 'hours').toISOString();

      console.log('Checking conflict with booking window:');
      console.log('Start:', bookingStart);
      console.log('End:', bookingEnd);

      // Kiểm tra bàn có trống không (sửa lại query để tránh lỗi interval)
      const conflict = await client.query(
        `
        SELECT * FROM ${this.tableName} 
        WHERE maban = $1 
          AND trangthai IN ('DaDat', 'DaXacNhan', 'DangSuDung')
          AND (
            (thoigian_dat <= $2 AND thoigian_dat + INTERVAL '2 hours' > $2)
            OR (thoigian_dat < $3 AND thoigian_dat + INTERVAL '2 hours' >= $3)
            OR (thoigian_dat >= $2 AND thoigian_dat < $3)
          )
      `,
        [maban, bookingStart, bookingEnd]
      );

      console.log(
        'Conflict check result:',
        conflict.rows.length,
        'conflicts found'
      );
      if (conflict.rows.length > 0) {
        console.log('Conflicting bookings:', conflict.rows);
        throw new Error('Bàn đã được đặt trong thời gian này');
      }

      // Tạo booking token và deadline
      const bookingToken = generateBookingToken();
      const cancelDeadline = moment(thoigian_dat)
        .subtract(1, 'hour')
        .toISOString();

      console.log('Creating booking with:');
      console.log('- Token:', bookingToken);
      console.log('- Cancel deadline:', cancelDeadline);
      console.log('- Final booking time:', thoigian_dat);

      // Tạo phiếu đặt bàn
      const booking = await client.query(
        `
        INSERT INTO ${this.tableName} (
          makh, guest_hoten, guest_sodienthoai, guest_email, maban, songuoi,
          thoigian_dat, trangthai, nguon_dat, booking_token, cancel_deadline, ghichu
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'DaDat', 'Online', $8, $9, $10)
        RETURNING *
      `,
        [
          makh || null,
          guest_hoten,
          guest_sodienthoai,
          guest_email,
          maban,
          songuoi,
          thoigian_dat,
          bookingToken,
          cancelDeadline,
          ghichu,
        ]
      );

      console.log('Booking created:', booking.rows[0]);

      // Cập nhật trạng thái bàn
      await client.query('UPDATE ban SET trangthai = $1 WHERE maban = $2', [
        'DaDat',
        maban,
      ]);
      console.log('Table status updated to DaDat');

      // Ghi log lịch sử
      await client.query(
        `
        INSERT INTO phieudatban_lichsu (maphieu, hanh_dong, noidung)
        VALUES ($1, 'Created', $2)
      `,
        [booking.rows[0].maphieu, `Đặt bàn online cho ${songuoi} người`]
      );

      // Tạo thông báo
      await client.query(
        `
        INSERT INTO thongbao (maphieu, loai, noidung)
        VALUES ($1, 'BookingCreated', $2)
      `,
        [
          booking.rows[0].maphieu,
          `Đặt bàn mới: ${guest_hoten || 'Khách hàng'} - ${songuoi} người`,
        ]
      );

      console.log('Booking process completed successfully');
      return booking.rows[0];
    });
  }

  // Lấy danh sách đặt bàn với thông tin chi tiết
  async findAllWithDetails(conditions = {}, page = 1, limit = 10) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (conditions.trangthai) {
      paramCount++;
      whereClause += ` AND p.trangthai = $${paramCount}`;
      params.push(conditions.trangthai);
    }

    if (conditions.ngay_bat_dau) {
      paramCount++;
      whereClause += ` AND p.thoigian_dat >= $${paramCount}`;
      params.push(conditions.ngay_bat_dau);
    }

    if (conditions.ngay_ket_thuc) {
      paramCount++;
      whereClause += ` AND p.thoigian_dat <= $${paramCount}`;
      params.push(conditions.ngay_ket_thuc);
    }

    // Đếm tổng số
    const countResult = await this.query(
      `
      SELECT COUNT(*) as total FROM ${this.tableName} p ${whereClause}
    `,
      params
    );
    const total = parseInt(countResult.rows[0].total);

    // Lấy dữ liệu với phân trang
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const result = await this.query(
      `
      SELECT p.*, 
             kh.hoten as khachhang_hoten,
             b.tenban, 
             v.tenvung,
             nv.hoten as nhanvien_tao
      FROM ${this.tableName} p
      LEFT JOIN khachhang kh ON p.makh = kh.makh
      JOIN ban b ON p.maban = b.maban
      JOIN vung v ON b.mavung = v.mavung
      LEFT JOIN nhanvien nv ON p.created_by = nv.manv
      ${whereClause}
      ORDER BY p.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `,
      params
    );

    return {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    };
  }

  // Lấy chi tiết đặt bàn với lịch sử
  async findByIdWithHistory(id) {
    const booking = await this.query(
      `
      SELECT p.*, 
             kh.hoten as khachhang_hoten, kh.sodienthoai as khachhang_sdt,
             kh.email as khachhang_email,
             b.tenban, b.soghe,
             v.tenvung,
             nv.hoten as nhanvien_tao
      FROM ${this.tableName} p
      LEFT JOIN khachhang kh ON p.makh = kh.makh
      JOIN ban b ON p.maban = b.maban
      JOIN vung v ON b.mavung = v.mavung
      LEFT JOIN nhanvien nv ON p.created_by = nv.manv
      WHERE p.maphieu = $1
    `,
      [id]
    );

    if (booking.rows.length === 0) {
      return null;
    }

    const bookingInfo = booking.rows[0];

    // Lấy lịch sử thay đổi
    const history = await this.query(
      `
      SELECT ls.*, nv.hoten as nhanvien_thuchien
      FROM phieudatban_lichsu ls
      LEFT JOIN nhanvien nv ON ls.thuchienboi = nv.manv
      WHERE ls.maphieu = $1
      ORDER BY ls.thoi_gian DESC
    `,
      [id]
    );

    bookingInfo.lich_su = history.rows;

    return bookingInfo;
  }

  // Lấy đặt bàn theo token
  async findByToken(token) {
    const result = await this.query(
      `
      SELECT p.*, 
             b.tenban, b.soghe,
             v.tenvung
      FROM ${this.tableName} p
      JOIN ban b ON p.maban = b.maban
      JOIN vung v ON b.mavung = v.mavung
      WHERE p.booking_token = $1
    `,
      [token]
    );

    if (result.rows.length === 0) {
      return null;
    }

    const booking = result.rows[0];

    // Không trả về thông tin nhạy cảm
    delete booking.makh;
    delete booking.created_by;

    return booking;
  }

  // Xác nhận đặt bàn
  async confirmBooking(id, manv) {
    return await this.transaction(async (client) => {
      const booking = await client.query(
        `SELECT * FROM ${this.tableName} WHERE maphieu = $1`,
        [id]
      );

      if (booking.rows.length === 0) {
        throw new Error('Không tìm thấy phiếu đặt bàn');
      }

      if (booking.rows[0].trangthai !== 'DaDat') {
        throw new Error('Chỉ có thể xác nhận đặt bàn ở trạng thái "Đã đặt"');
      }

      // Cập nhật trạng thái
      await client.query(
        `UPDATE ${this.tableName} SET trangthai = $1, updated_at = NOW() WHERE maphieu = $2`,
        ['DaXacNhan', id]
      );

      // Ghi log
      await client.query(
        `
        INSERT INTO phieudatban_lichsu (maphieu, hanh_dong, noidung, thuchienboi)
        VALUES ($1, 'Confirmed', 'Xác nhận đặt bàn', $2)
      `,
        [id, manv]
      );

      return true;
    });
  }

  // Hủy đặt bàn
  async cancelBooking(identifier, manv = null, reason = null) {
    return await this.transaction(async (client) => {
      let whereClause, params;

      if (identifier.token) {
        // Khách hàng hủy bằng token
        whereClause = 'WHERE booking_token = $1';
        params = [identifier.token];
      } else if (identifier.id) {
        // Admin hủy bằng ID
        whereClause = 'WHERE maphieu = $1';
        params = [identifier.id];
      } else {
        throw new Error('Thiếu thông tin để hủy đặt bàn');
      }

      // Lấy thông tin đặt bàn
      const booking = await client.query(
        `SELECT * FROM ${this.tableName} ${whereClause}`,
        params
      );

      if (booking.rows.length === 0) {
        throw new Error('Không tìm thấy phiếu đặt bàn');
      }

      const bookingInfo = booking.rows[0];

      if (!['DaDat', 'DaXacNhan'].includes(bookingInfo.trangthai)) {
        throw new Error('Không thể hủy đặt bàn ở trạng thái hiện tại');
      }

      // Kiểm tra deadline (chỉ cho khách hàng)
      if (
        identifier.token &&
        moment().isAfter(moment(bookingInfo.cancel_deadline))
      ) {
        throw new Error('Đã quá thời hạn hủy đặt bàn');
      }

      // Cập nhật trạng thái đặt bàn
      await client.query(
        `UPDATE ${this.tableName} SET trangthai = $1, thoigian_huy = NOW(), updated_at = NOW() WHERE maphieu = $2`,
        ['DaHuy', bookingInfo.maphieu]
      );

      // Cập nhật trạng thái bàn về trống
      await client.query('UPDATE ban SET trangthai = $1 WHERE maban = $2', [
        'Trong',
        bookingInfo.maban,
      ]);

      // Ghi log
      await client.query(
        `
        INSERT INTO phieudatban_lichsu (maphieu, hanh_dong, noidung, thuchienboi)
        VALUES ($1, 'Cancelled', $2, $3)
      `,
        [bookingInfo.maphieu, reason || 'Hủy đặt bàn', manv]
      );

      return true;
    });
  }

  // Lấy thống kê đặt bàn theo ngày
  async getDailyStats(date) {
    const result = await this.query(
      `
      SELECT 
        COUNT(CASE WHEN p.trangthai IN ('DaDat', 'DaXacNhan') THEN 1 END) as dat_ban_cho_xac_nhan,
        COUNT(CASE WHEN p.trangthai = 'DangSuDung' THEN 1 END) as ban_dang_su_dung,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as hoan_thanh_hom_nay,
        COALESCE(SUM(CASE WHEN p.trangthai = 'HoanThanh' AND hd.thanhtoan IS NOT NULL THEN hd.thanhtoan END), 0) as doanh_thu_hom_nay
      FROM ${this.tableName} p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE DATE(p.thoigian_dat) = $1
    `,
      [date]
    );

    return result.rows[0];
  }

  // Lấy thống kê đặt bàn theo tháng
  async getMonthlyStats(month) {
    const result = await this.query(
      `
      SELECT 
        COUNT(*) as tong_dat_ban_thang,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as hoan_thanh_thang,
        COALESCE(SUM(hd.thanhtoan), 0) as doanh_thu_thang
      FROM ${this.tableName} p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE DATE_TRUNC('month', p.thoigian_dat) = $1
    `,
      [month + '-01']
    );

    return result.rows[0];
  }

  // Báo cáo doanh thu theo khoảng thời gian
  async getRevenueReport(fromDate, toDate, groupBy = 'day') {
    let dateGroupBy;
    switch (groupBy) {
      case 'week':
        dateGroupBy = "DATE_TRUNC('week', p.thoigian_dat)";
        break;
      case 'month':
        dateGroupBy = "DATE_TRUNC('month', p.thoigian_dat)";
        break;
      default:
        dateGroupBy = 'DATE(p.thoigian_dat)';
    }

    const result = await this.query(
      `
      SELECT 
        ${dateGroupBy} as ngay,
        COUNT(p.maphieu) as so_dat_ban,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as dat_ban_hoan_thanh,
        COUNT(CASE WHEN p.trangthai = 'DaHuy' THEN 1 END) as dat_ban_huy,
        COALESCE(SUM(hd.tongtien), 0) as tong_tien,
        COALESCE(SUM(hd.giamgia), 0) as tong_giam_gia,
        COALESCE(SUM(hd.thanhtoan), 0) as doanh_thu,
        AVG(hd.thanhtoan) as doanh_thu_trung_binh
      FROM ${this.tableName} p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
      GROUP BY ${dateGroupBy}
      ORDER BY ngay
    `,
      [fromDate, toDate]
    );

    return result.rows;
  }

  // Tổng kết báo cáo
  async getReportSummary(fromDate, toDate) {
    const result = await this.query(
      `
      SELECT 
        COUNT(p.maphieu) as tong_dat_ban,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as tong_hoan_thanh,
        COUNT(CASE WHEN p.trangthai = 'DaHuy' THEN 1 END) as tong_huy,
        COALESCE(SUM(hd.tongtien), 0) as tong_tien_goc,
        COALESCE(SUM(hd.giamgia), 0) as tong_giam_gia,
        COALESCE(SUM(hd.thanhtoan), 0) as tong_doanh_thu
      FROM ${this.tableName} p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
    `,
      [fromDate, toDate]
    );

    return result.rows[0];
  }
}

module.exports = new Booking();
