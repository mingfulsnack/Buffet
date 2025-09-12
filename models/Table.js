const BaseModel = require('./BaseModel');

class Table extends BaseModel {
  constructor() {
    super('ban');
  }

  // Lấy danh sách bàn với vùng
  async findAllWithArea(conditions = {}) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (conditions.mavung) {
      paramCount++;
      whereClause += ` AND b.mavung = $${paramCount}`;
      params.push(conditions.mavung);
    }

    if (conditions.trangthai) {
      paramCount++;
      whereClause += ` AND b.trangthai = $${paramCount}`;
      params.push(conditions.trangthai);
    }

    const result = await this.query(
      `
      SELECT b.*, v.tenvung, v.mota as vung_mota
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

      // Loại bỏ thông tin vùng khỏi bàn
      const { tenvung, vung_mota, ...tableInfo } = table;
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

      // Xử lý logic chuyển trạng thái
      if (currentTable.trangthai === 'DaDat' && trangthai === 'DangSuDung') {
        // Khách đã đến, bắt đầu sử dụng
        await client.query(
          'UPDATE phieudatban SET trangthai = $1, thoigian_den = NOW() WHERE maban = $2 AND trangthai IN ($3, $4)',
          ['DangSuDung', id, 'DaDat', 'DaXacNhan']
        );
      } else if (
        currentTable.trangthai === 'DangSuDung' &&
        trangthai === 'Trong'
      ) {
        // Kết thúc sử dụng
        await client.query(
          'UPDATE phieudatban SET trangthai = $1 WHERE maban = $2 AND trangthai = $3',
          ['HoanThanh', id, 'DangSuDung']
        );
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

  // Kiểm tra bàn có thể đặt không
  async isAvailable(maban, thoigian_dat) {
    const result = await this.query(
      `
      SELECT * FROM phieudatban 
      WHERE maban = $1 
        AND trangthai IN ('DaDat', 'DaXacNhan', 'DangSuDung')
        AND thoigian_dat <= $2 + INTERVAL '2 hours'
        AND thoigian_dat + INTERVAL '2 hours' >= $2
    `,
      [maban, thoigian_dat]
    );

    return result.rows.length === 0;
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
      FROM datban 
      WHERE maban = $1 
      AND trangthai IN ('ChoXacNhan', 'DaXacNhan')
      AND ngaydat >= CURRENT_DATE
    `,
      [maban]
    );

    return parseInt(result.rows[0].count) > 0;
  }
}

module.exports = new Table();
