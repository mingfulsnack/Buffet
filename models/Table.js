const BaseModel = require('./BaseModel');

class Table extends BaseModel {
  constructor() {
    super('ban');
  }

  // Lấy danh sách bàn với vùng và trạng thái theo thời gian thực
  async findAllWithArea(conditions = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (conditions.mavung) {
      paramCount++;
      whereClause += ` AND b.mavung = $${paramCount}`;
      params.push(conditions.mavung);
    }

    // Lấy thời gian hiện tại để tính trạng thái động
    const currentTime = new Date();

    const result = await this.query(
      `
      SELECT 
        b.*,
        v.tenvung, 
        v.mota as vung_mota,
        -- Tính trạng thái động theo thời gian thực
        CASE 
          -- Bàn bị khóa hoặc bảo trì (ưu tiên cao nhất)
          WHEN b.trangthai IN ('Lock', 'BaoTri') THEN b.trangthai
          
          -- Đang được sử dụng: có booking DaXacNhan trong khoảng thời gian hoạt động (30 phút trước đến 2 giờ sau giờ đặt)
          WHEN EXISTS (
            SELECT 1 FROM phieudatban p 
            WHERE p.maban = b.maban 
              AND p.trangthai = 'DaXacNhan'
              AND NOW() >= p.thoigian_dat - INTERVAL '30 minutes'
              AND NOW() < p.thoigian_dat + INTERVAL '2 hours'
          ) THEN 'DangSuDung'
          
          -- Đang đặt: có booking DaDat và thời gian hiện tại gần đến giờ đặt (30 phút trước đến 2 giờ sau)
          WHEN EXISTS (
            SELECT 1 FROM phieudatban p 
            WHERE p.maban = b.maban 
              AND p.trangthai = 'DaDat'
              AND NOW() >= p.thoigian_dat - INTERVAL '30 minutes'
              AND NOW() < p.thoigian_dat + INTERVAL '2 hours'
          ) THEN 'DaDat'
          
          -- Mặc định là trống
          ELSE 'Trong'
        END as trangthai_thuc_te,
        
        -- Lấy thông tin đặt bàn hiện tại hoặc sắp tới (nếu có)
        (
          SELECT json_build_object(
            'maphieu', p.maphieu,
            'guest_hoten', p.guest_hoten,
            'thoigian_dat', p.thoigian_dat,
            'songuoi', p.songuoi,
            'trangthai', p.trangthai
          )
          FROM phieudatban p 
          WHERE p.maban = b.maban 
            AND p.trangthai IN ('DaXacNhan', 'DaDat')
            AND p.thoigian_dat + INTERVAL '2 hours' >= NOW()
          ORDER BY p.thoigian_dat ASC
          LIMIT 1
        ) as dat_ban_hien_tai
        
      FROM ${this.tableName} b
      JOIN vung v ON b.mavung = v.mavung
      ${whereClause}
      ORDER BY v.tenvung, b.tenban
    `,
      params
    );

    // Nhóm bàn theo vùng
    const tablesByArea = {};
    result.rows.forEach((table) => {
      const areaName = table.tenvung;
      if (!tablesByArea[areaName]) {
        tablesByArea[areaName] = {
          mavung: table.mavung,
          tenvung: table.tenvung,
          mota: table.vung_mota,
          tables: [],
        };
      }

      // Sử dụng trạng thái động thay vì trạng thái tĩnh
      const {
        tenvung,
        vung_mota,
        trangthai_thuc_te,
        dat_ban_hien_tai,
        ...tableInfo
      } = table;
      tableInfo.trangthai = trangthai_thuc_te; // Ghi đè trạng thái bằng trạng thái động
      tableInfo.booking_info = dat_ban_hien_tai; // Thêm thông tin đặt bàn

      // Lọc theo trạng thái nếu có điều kiện
      if (conditions.trangthai && conditions.trangthai !== trangthai_thuc_te) {
        return; // Bỏ qua bàn này nếu không khớp điều kiện lọc
      }

      tablesByArea[areaName].tables.push(tableInfo);
    });

    return Object.values(tablesByArea);
  }

  // Lấy chi tiết bàn với lịch sử đặt bàn
  async findByIdWithHistory(id) {
    const table = await this.query(
      `
      SELECT b.*, v.tenvung, v.mota as vung_mota
      FROM ${this.tableName} b
      JOIN vung v ON b.mavung = v.mavung
      WHERE b.maban = $1
    `,
      [id]
    );

    if (table.rows.length === 0) {
      return null;
    }

    const tableInfo = table.rows[0];

    // Lấy lịch sử đặt bàn gần đây
    const bookingHistory = await this.query(
      `
      SELECT p.maphieu, p.guest_hoten, p.songuoi, p.thoigian_dat, 
             p.trangthai, kh.hoten as khachhang_hoten
      FROM phieudatban p
      LEFT JOIN khachhang kh ON p.makh = kh.makh
      WHERE p.maban = $1
      ORDER BY p.thoigian_dat DESC
      LIMIT 5
    `,
      [id]
    );

    tableInfo.lich_su_dat_ban = bookingHistory.rows;

    return tableInfo;
  }

  // Cập nhật trạng thái bàn với optimistic locking
  async updateStatus(id, trangthai, version, manv) {
    return await this.transaction(async (client) => {
      // Kiểm tra version
      const current = await client.query('SELECT * FROM ban WHERE maban = $1', [
        id,
      ]);

      if (current.rows.length === 0) {
        throw new Error('Không tìm thấy bàn');
      }

      const currentTable = current.rows[0];

      if (version && currentTable.version !== version) {
        throw new Error(
          'Bàn đã được cập nhật bởi người khác. Vui lòng tải lại trang.'
        );
      }

      // Không cho phép thay đổi thủ công sang DaDat hoặc DangSuDung
      // Những trạng thái này được quản lý tự động bởi hệ thống booking
      if (['DaDat', 'DangSuDung'].includes(trangthai)) {
        throw new Error(
          'Không thể thay đổi trạng thái bàn thành "Đang đặt" hoặc "Đang sử dụng" thủ công. Trạng thái này được quản lý tự động bởi hệ thống đặt bàn.'
        );
      }

      // Chỉ cho phép chuyển sang: Trong, Lock, BaoTri
      if (!['Trong', 'Lock', 'BaoTri'].includes(trangthai)) {
        throw new Error('Trạng thái không hợp lệ');
      }

      // Nếu chuyển sang Trong, tự động hoàn thành các booking đang hoạt động
      if (trangthai === 'Trong') {
        const activeBooking = await client.query(
          `SELECT * FROM phieudatban 
           WHERE maban = $1 
           AND trangthai IN ('DaDat', 'DaXacNhan')
           AND NOW() >= thoigian_dat - INTERVAL '30 minutes'
           AND NOW() < thoigian_dat + INTERVAL '2 hours'`,
          [id]
        );

        // Nếu có booking đang hoạt động, tự động chuyển sang HoanThanh
        if (activeBooking.rows.length > 0) {
          const booking = activeBooking.rows[0];
          
          // Cập nhật trạng thái booking sang HoanThanh
          await client.query(
            `UPDATE phieudatban 
             SET trangthai = 'HoanThanh',
                 ghichu = COALESCE(ghichu, '') || ' [Đã chuyển bàn về trống lúc ' || TO_CHAR(NOW(), 'DD/MM/YYYY HH24:MI') || ']',
                 updated_at = NOW()
             WHERE maphieu = $1`,
            [booking.maphieu]
          );

          console.log(`Auto-completed booking ${booking.maphieu} when freeing table ${id}`);
        }
      }

      // Cập nhật trạng thái bàn
      const result = await client.query(
        `
        UPDATE ban 
        SET trangthai = $1, version = version + 1
        WHERE maban = $2
        RETURNING *
      `,
        [trangthai, id]
      );

      // Ghi log audit
      await client.query(
        `
        INSERT INTO auditlog (manv, entity, entity_id, action, noidung)
        VALUES ($1, 'ban', $2, 'update_status', $3)
      `,
        [
          manv,
          id,
          `Chuyển trạng thái từ ${currentTable.trangthai} sang ${trangthai}`,
        ]
      );

      return result.rows[0];
    });
  }

  // Kiểm tra bàn có thể đặt không tại thời điểm cụ thể
  async isAvailable(maban, thoigian_dat) {
    const result = await this.query(
      `
      SELECT * FROM phieudatban 
      WHERE maban = $1 
        AND trangthai IN ('DaDat', 'DaXacNhan', 'DangSuDung')
        AND thoigian_dat <= $2::timestamp + INTERVAL '2 hours'
        AND thoigian_dat + INTERVAL '2 hours' >= $2::timestamp
    `,
      [maban, thoigian_dat]
    );

    return result.rows.length === 0;
  }

  // Lấy trạng thái bàn tại thời điểm cụ thể
  async getTableStatusAtTime(maban, checkTime = null) {
    if (!checkTime) {
      checkTime = new Date();
    }

    const result = await this.query(
      `
      SELECT 
        b.maban,
        b.tenban,
        b.trangthai as trang_thai_co_ban,
        CASE 
          -- Nếu bàn đang được sử dụng tại thời điểm check
          WHEN EXISTS (
            SELECT 1 FROM phieudatban p 
            WHERE p.maban = b.maban 
              AND p.trangthai = 'DangSuDung'
              AND p.thoigian_dat <= $2::timestamp
              AND (p.thoigian_dat + INTERVAL '2 hours') > $2::timestamp
          ) THEN 'DangSuDung'
          
          -- Nếu có đặt bàn trong khoảng thời gian check (30 phút trước đến 2 giờ sau)
          WHEN EXISTS (
            SELECT 1 FROM phieudatban p 
            WHERE p.maban = b.maban 
              AND p.trangthai IN ('DaXacNhan', 'DaDat')
              AND p.thoigian_dat <= $2::timestamp + INTERVAL '30 minutes'
              AND (p.thoigian_dat + INTERVAL '2 hours') > $2::timestamp
          ) THEN 'DaDat'
          
          -- Nếu bàn bị khóa hoặc bảo trì
          WHEN b.trangthai IN ('Lock', 'BaoTri') THEN b.trangthai
          
          -- Mặc định là trống
          ELSE 'Trong'
        END as trang_thai_tai_thoi_diem,
        
        -- Lấy thông tin đặt bàn (nếu có)
        (
          SELECT json_build_object(
            'maphieu', p.maphieu,
            'guest_hoten', p.guest_hoten,
            'thoigian_dat', p.thoigian_dat,
            'songuoi', p.songuoi,
            'trangthai', p.trangthai,
            'thoi_gian_con_lai', EXTRACT(EPOCH FROM (p.thoigian_dat - $2))/60
          )
          FROM phieudatban p 
          WHERE p.maban = b.maban 
            AND p.trangthai IN ('DaXacNhan', 'DaDat', 'DangSuDung')
            AND p.thoigian_dat <= $2::timestamp + INTERVAL '4 hours'
            AND (p.thoigian_dat + INTERVAL '2 hours') > $2::timestamp
          ORDER BY p.thoigian_dat ASC
          LIMIT 1
        ) as thong_tin_dat_ban
        
      FROM ${this.tableName} b
      WHERE b.maban = $1
    `,
      [maban, checkTime]
    );

    return result.rows[0] || null;
  }

  // Lấy danh sách bàn với trạng thái tại thời điểm cụ thể (cho booking form)
  async findAvailableTablesAtTime(thoigian_dat, songuoi = null, mavung = null) {
    const params = [thoigian_dat];
    let sogheFilter = '';
    let mavungFilter = '';

    if (songuoi) {
      params.push(songuoi);
      sogheFilter = `AND b.soghe >= $${params.length}`;
    }

    if (mavung) {
      params.push(mavung);
      mavungFilter = `AND b.mavung = $${params.length}`;
    }

    const result = await this.query(
      `
      SELECT 
        b.*,
        v.tenvung,
        v.mota as vung_mota,
        CASE 
          -- Kiểm tra xung đột thời gian đặt bàn
          WHEN EXISTS (
            SELECT 1 FROM phieudatban p 
            WHERE p.maban = b.maban 
              AND p.trangthai IN ('DaXacNhan', 'DaDat', 'DangSuDung')
              -- Kiểm tra overlap: đặt bàn mới có giao với đặt bàn hiện tại không
              AND NOT (
                $1::timestamp + INTERVAL '2 hours' <= p.thoigian_dat OR 
                $1::timestamp >= p.thoigian_dat + INTERVAL '2 hours'
              )
          ) THEN false
          
          -- Nếu bàn bị khóa hoặc bảo trì
          WHEN b.trangthai IN ('Lock', 'BaoTri') THEN false
          
          -- Bàn có thể đặt
          ELSE true
        END as co_the_dat
        
      FROM ${this.tableName} b
      JOIN vung v ON b.mavung = v.mavung
      WHERE 1=1 ${sogheFilter} ${mavungFilter}
      ORDER BY v.tenvung, b.tenban
    `,
      params
    );

    // Nhóm theo vùng và chỉ lấy bàn có thể đặt
    const tablesByArea = {};
    result.rows.forEach((table) => {
      if (!table.co_the_dat) return; // Bỏ qua bàn không thể đặt

      const areaName = table.tenvung;
      if (!tablesByArea[areaName]) {
        tablesByArea[areaName] = {
          mavung: table.mavung,
          tenvung: table.tenvung,
          mota: table.vung_mota,
          tables: [],
        };
      }

      const { tenvung, vung_mota, co_the_dat, ...tableInfo } = table;
      tableInfo.trangthai = 'Trong'; // Tất cả bàn trong list này đều trống tại thời điểm đặt
      tablesByArea[areaName].tables.push(tableInfo);
    });

    return Object.values(tablesByArea);
  }

  // Kiểm tra tên bàn trùng trong vùng
  async isTableNameExists(mavung, tenban, excludeId = null) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE mavung = $1 AND tenban = $2`;
    const params = [mavung, tenban];

    if (excludeId) {
      sql += ` AND maban != $3`;
      params.push(excludeId);
    }

    const result = await this.query(sql, params);
    return parseInt(result.rows[0].count) > 0;
  }

  // Xóa bàn (kiểm tra có đặt chỗ không)
  async deleteTable(id) {
    // Kiểm tra bàn có đặt chỗ nào không
    const bookings = await this.query(
      'SELECT COUNT(*) as count FROM phieudatban WHERE maban = $1 AND trangthai IN ($2, $3, $4)',
      [id, 'DaDat', 'DaXacNhan', 'DangSuDung']
    );

    if (parseInt(bookings.rows[0].count) > 0) {
      throw new Error('Không thể xóa bàn đang có đặt chỗ');
    }

    return await this.delete(id);
  }

  // Lấy danh sách vùng
  async getAreas() {
    const result = await this.query('SELECT * FROM vung ORDER BY tenvung');
    return result.rows;
  }

  // Tạo vùng mới
  async createArea(data) {
    const result = await this.query(
      `
      INSERT INTO vung (tenvung, mota)
      VALUES ($1, $2)
      RETURNING *
    `,
      [data.tenvung, data.mota]
    );

    return result.rows[0];
  }

  // Báo cáo hiệu suất sử dụng bàn
  async getUsageReport(fromDate, toDate) {
    const result = await this.query(
      `
      SELECT 
        b.maban,
        b.tenban,
        v.tenvung,
        b.soghe,
        COUNT(p.maphieu) as so_lan_dat,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as lan_hoan_thanh,
        COALESCE(SUM(hd.thanhtoan), 0) as doanh_thu,
        ROUND(
          COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) * 100.0 / 
          NULLIF(COUNT(p.maphieu), 0), 2
        ) as ty_le_hoan_thanh
      FROM ${this.tableName} b
      JOIN vung v ON b.mavung = v.mavung
      LEFT JOIN phieudatban p ON b.maban = p.maban 
        AND p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      GROUP BY b.maban, b.tenban, v.tenvung, b.soghe
      ORDER BY so_lan_dat DESC, doanh_thu DESC
    `,
      [fromDate, toDate]
    );

    return result.rows;
  }

  // Thống kê theo vùng
  async getAreaStats(fromDate, toDate) {
    const result = await this.query(
      `
      SELECT 
        v.tenvung,
        COUNT(DISTINCT b.maban) as so_ban,
        COUNT(p.maphieu) as so_lan_dat,
        COALESCE(SUM(hd.thanhtoan), 0) as doanh_thu
      FROM vung v
      LEFT JOIN ${this.tableName} b ON v.mavung = b.mavung
      LEFT JOIN phieudatban p ON b.maban = p.maban 
        AND p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      GROUP BY v.mavung, v.tenvung
      ORDER BY doanh_thu DESC
    `,
      [fromDate, toDate]
    );

    return result.rows;
  }

  // Lấy trạng thái bàn hiện tại cho dashboard
  async getCurrentStatus() {
    const result = await this.query(`
      SELECT 
        trangthai,
        COUNT(*) as so_luong
      FROM ${this.tableName}
      GROUP BY trangthai
    `);

    return result.rows;
  }

  // Kiểm tra bàn có đặt chỗ đang hoạt động không
  async hasActiveBookings(maban) {
    const result = await this.query(
      `
      SELECT COUNT(*) as count
      FROM phieudatban 
      WHERE maban = $1 
      AND trangthai IN ('ChoXacNhan', 'DaXacNhan')
      AND thoigian_dat >= CURRENT_DATE
    `,
      [maban]
    );

    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = new Table();
