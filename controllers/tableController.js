const pool = require('../config/database');
const { formatResponse, formatErrorResponse, getPaginationOffset } = require('../utils/helpers');

// Lấy danh sách bàn với sơ đồ
const getTables = async (req, res) => {
  try {
    const { mavung, trangthai } = req.query;

    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    if (mavung) {
      paramCount++;
      whereClause += ` AND b.mavung = $${paramCount}`;
      params.push(mavung);
    }

    if (trangthai) {
      paramCount++;
      whereClause += ` AND b.trangthai = $${paramCount}`;
      params.push(trangthai);
    }

    const result = await pool.query(`
      SELECT b.*, v.tenvung, v.mota as vung_mota
      FROM ban b
      JOIN vung v ON b.mavung = v.mavung
      ${whereClause}
      ORDER BY v.tenvung, b.tenban
    `, params);

    // Nhóm bàn theo vùng
    const tablesByArea = {};
    result.rows.forEach(table => {
      const areaName = table.tenvung;
      if (!tablesByArea[areaName]) {
        tablesByArea[areaName] = {
          mavung: table.mavung,
          tenvung: table.tenvung,
          mota: table.vung_mota,
          tables: []
        };
      }
      
      // Loại bỏ thông tin vùng khỏi bàn
      const { tenvung, vung_mota, ...tableInfo } = table;
      tablesByArea[areaName].tables.push(tableInfo);
    });

    res.json(formatResponse(true, Object.values(tablesByArea), 'Lấy danh sách bàn thành công'));

  } catch (error) {
    console.error('Get tables error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy chi tiết bàn
const getTableDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query(`
      SELECT b.*, v.tenvung, v.mota as vung_mota
      FROM ban b
      JOIN vung v ON b.mavung = v.mavung
      WHERE b.maban = $1
    `, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy bàn'));
    }

    const table = result.rows[0];

    // Lấy lịch sử đặt bàn gần đây
    const bookingResult = await pool.query(`
      SELECT p.maphieu, p.guest_hoten, p.songuoi, p.thoigian_dat, 
             p.trangthai, kh.hoten as khachhang_hoten
      FROM phieudatban p
      LEFT JOIN khachhang kh ON p.makh = kh.makh
      WHERE p.maban = $1
      ORDER BY p.thoigian_dat DESC
      LIMIT 5
    `, [id]);

    table.lich_su_dat_ban = bookingResult.rows;

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

    // Kiểm tra vùng có tồn tại
    const areaResult = await pool.query('SELECT * FROM vung WHERE mavung = $1', [mavung]);
    if (areaResult.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy vùng'));
    }

    // Kiểm tra tên bàn trùng trong cùng vùng
    const duplicateResult = await pool.query(
      'SELECT * FROM ban WHERE mavung = $1 AND tenban = $2',
      [mavung, tenban]
    );

    if (duplicateResult.rows.length > 0) {
      return res.status(400).json(formatErrorResponse('Tên bàn đã tồn tại trong vùng này'));
    }

    const result = await pool.query(`
      INSERT INTO ban (mavung, tenban, soghe, vitri, trangthai, ghichu)
      VALUES ($1, $2, $3, $4, 'Trong', $5)
      RETURNING *
    `, [mavung, tenban, soghe, vitri, ghichu]);

    res.status(201).json(formatResponse(true, result.rows[0], 'Tạo bàn thành công'));

  } catch (error) {
    console.error('Create table error:', error);
    if (error.code === '23505') {
      res.status(400).json(formatErrorResponse('Tên bàn đã tồn tại'));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

// Cập nhật thông tin bàn
const updateTable = async (req, res) => {
  try {
    const { id } = req.params;
    const { tenban, soghe, vitri, ghichu } = req.body;

    // Kiểm tra bàn có tồn tại
    const existingResult = await pool.query('SELECT * FROM ban WHERE maban = $1', [id]);
    if (existingResult.rows.length === 0) {
      return res.status(404).json(formatErrorResponse('Không tìm thấy bàn'));
    }

    const result = await pool.query(`
      UPDATE ban 
      SET tenban = COALESCE($1, tenban),
          soghe = COALESCE($2, soghe),
          vitri = COALESCE($3, vitri),
          ghichu = COALESCE($4, ghichu),
          version = version + 1
      WHERE maban = $5
      RETURNING *
    `, [tenban, soghe, vitri, ghichu, id]);

    res.json(formatResponse(true, result.rows[0], 'Cập nhật bàn thành công'));

  } catch (error) {
    console.error('Update table error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Cập nhật trạng thái bàn
const updateTableStatus = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { trangthai, version } = req.body;
    const manv = req.user.manv;

    // Kiểm tra bàn có tồn tại và version
    const existingResult = await client.query(
      'SELECT * FROM ban WHERE maban = $1',
      [id]
    );

    if (existingResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json(formatErrorResponse('Không tìm thấy bàn'));
    }

    const currentTable = existingResult.rows[0];

    // Optimistic locking - kiểm tra version
    if (version && currentTable.version !== version) {
      await client.query('ROLLBACK');
      return res.status(409).json(formatErrorResponse('Bàn đã được cập nhật bởi người khác. Vui lòng tải lại trang.'));
    }

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ['Trong', 'DaDat', 'DangSuDung', 'Lock'];
    if (!validStatuses.includes(trangthai)) {
      await client.query('ROLLBACK');
      return res.status(400).json(formatErrorResponse('Trạng thái không hợp lệ'));
    }

    // Kiểm tra logic chuyển trạng thái
    if (currentTable.trangthai === 'DaDat' && trangthai === 'DangSuDung') {
      // Khách đã đến, bắt đầu sử dụng
      await client.query(
        'UPDATE phieudatban SET trangthai = $1, thoigian_den = NOW() WHERE maban = $2 AND trangthai IN ($3, $4)',
        ['DangSuDung', id, 'DaDat', 'DaXacNhan']
      );
    } else if (currentTable.trangthai === 'DangSuDung' && trangthai === 'Trong') {
      // Kết thúc sử dụng
      await client.query(
        'UPDATE phieudatban SET trangthai = $1 WHERE maban = $2 AND trangthai = $3',
        ['HoanThanh', id, 'DangSuDung']
      );
    }

    // Cập nhật trạng thái bàn
    const result = await client.query(`
      UPDATE ban 
      SET trangthai = $1, version = version + 1
      WHERE maban = $2
      RETURNING *
    `, [trangthai, id]);

    // Ghi log audit
    await client.query(`
      INSERT INTO auditlog (manv, entity, entity_id, action, noidung)
      VALUES ($1, 'ban', $2, 'update_status', $3)
    `, [manv, id, `Chuyển trạng thái từ ${currentTable.trangthai} sang ${trangthai}`]);

    await client.query('COMMIT');

    res.json(formatResponse(true, result.rows[0], 'Cập nhật trạng thái bàn thành công'));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update table status error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  } finally {
    client.release();
  }
};

// Xóa bàn
const deleteTable = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;

    // Kiểm tra bàn có đặt chỗ nào không
    const bookingResult = await client.query(
      'SELECT COUNT(*) as count FROM phieudatban WHERE maban = $1 AND trangthai IN ($2, $3, $4)',
      [id, 'DaDat', 'DaXacNhan', 'DangSuDung']
    );

    if (parseInt(bookingResult.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json(formatErrorResponse('Không thể xóa bàn đang có đặt chỗ'));
    }

    // Xóa bàn
    const result = await client.query('DELETE FROM ban WHERE maban = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json(formatErrorResponse('Không tìm thấy bàn'));
    }

    await client.query('COMMIT');

    res.json(formatResponse(true, null, 'Xóa bàn thành công'));

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Delete table error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  } finally {
    client.release();
  }
};

// Lấy danh sách vùng
const getAreas = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vung ORDER BY tenvung');
    res.json(formatResponse(true, result.rows, 'Lấy danh sách vùng thành công'));
  } catch (error) {
    console.error('Get areas error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo vùng mới
const createArea = async (req, res) => {
  try {
    const { tenvung, mota } = req.body;

    const result = await pool.query(`
      INSERT INTO vung (tenvung, mota)
      VALUES ($1, $2)
      RETURNING *
    `, [tenvung, mota]);

    res.status(201).json(formatResponse(true, result.rows[0], 'Tạo vùng thành công'));

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
  getTableDetail,
  createTable,
  updateTable,
  updateTableStatus,
  deleteTable,
  getAreas,
  createArea
};
