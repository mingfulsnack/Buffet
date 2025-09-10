const pool = require('../config/database');

class BaseModel {
  constructor(tableName) {
    this.tableName = tableName;
    this.pool = pool;
  }

  // Thực thi query cơ bản
  async query(sql, params = []) {
    try {
      const result = await this.pool.query(sql, params);
      return result;
    } catch (error) {
      console.error(`Query error in ${this.tableName}:`, error);
      throw error;
    }
  }

  // Lấy tất cả records
  async findAll(conditions = {}, orderBy = null, limit = null, offset = null) {
    let sql = `SELECT * FROM ${this.tableName}`;
    const params = [];
    let paramCount = 0;

    // Thêm điều kiện WHERE
    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions).map(key => {
        paramCount++;
        params.push(conditions[key]);
        return `${key} = $${paramCount}`;
      }).join(' AND ');
      sql += ` WHERE ${whereClause}`;
    }

    // Thêm ORDER BY
    if (orderBy) {
      sql += ` ORDER BY ${orderBy}`;
    }

    // Thêm LIMIT
    if (limit) {
      paramCount++;
      sql += ` LIMIT $${paramCount}`;
      params.push(limit);
    }

    // Thêm OFFSET
    if (offset) {
      paramCount++;
      sql += ` OFFSET $${paramCount}`;
      params.push(offset);
    }

    const result = await this.query(sql, params);
    return result.rows;
  }

  // Lấy một record theo ID
  async findById(id, idColumn = null) {
    const column = idColumn || this.getDefaultIdColumn();
    const result = await this.query(
      `SELECT * FROM ${this.tableName} WHERE ${column} = $1`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Lấy một record theo điều kiện
  async findOne(conditions) {
    const records = await this.findAll(conditions, null, 1);
    return records[0] || null;
  }

  // Tạo record mới
  async create(data) {
    const columns = Object.keys(data);
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const sql = `
      INSERT INTO ${this.tableName} (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;

    const result = await this.query(sql, values);
    return result.rows[0];
  }

  // Cập nhật record
  async update(id, data, idColumn = null) {
    const column = idColumn || this.getDefaultIdColumn();
    const columns = Object.keys(data);
    const values = Object.values(data);
    
    const setClause = columns.map((col, index) => `${col} = $${index + 1}`).join(', ');
    
    const sql = `
      UPDATE ${this.tableName} 
      SET ${setClause}
      WHERE ${column} = $${columns.length + 1}
      RETURNING *
    `;

    const result = await this.query(sql, [...values, id]);
    return result.rows[0];
  }

  // Xóa record
  async delete(id, idColumn = null) {
    const column = idColumn || this.getDefaultIdColumn();
    const result = await this.query(
      `DELETE FROM ${this.tableName} WHERE ${column} = $1 RETURNING *`,
      [id]
    );
    return result.rows[0] || null;
  }

  // Soft delete
  async softDelete(id, idColumn = null) {
    const column = idColumn || this.getDefaultIdColumn();
    return await this.update(id, { 
      is_deleted: true, 
      updated_at: new Date() 
    }, column);
  }

  // Đếm records
  async count(conditions = {}) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName}`;
    const params = [];
    let paramCount = 0;

    if (Object.keys(conditions).length > 0) {
      const whereClause = Object.keys(conditions).map(key => {
        paramCount++;
        params.push(conditions[key]);
        return `${key} = $${paramCount}`;
      }).join(' AND ');
      sql += ` WHERE ${whereClause}`;
    }

    const result = await this.query(sql, params);
    return parseInt(result.rows[0].count);
  }

  // Phân trang
  async paginate(conditions = {}, page = 1, limit = 10, orderBy = null) {
    const offset = (page - 1) * limit;
    const total = await this.count(conditions);
    const records = await this.findAll(conditions, orderBy, limit, offset);
    
    return {
      data: records,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1
      }
    };
  }

  // Lấy tên cột ID mặc định
  getDefaultIdColumn() {
    // Quy ước: ma + tên bảng (ví dụ: nhanvien -> manv)
    const tableMap = {
      'nhanvien': 'manv',
      'khachhang': 'makh',
      'ban': 'maban',
      'vung': 'mavung',
      'phieudatban': 'maphieu',
      'monan': 'mamon',
      'danhmucmonan': 'madanhmuc',
      'setbuffet': 'maset',
      'khuyenmai': 'makm',
      'hangthanhvien': 'mahang',
      'vai_tro': 'mavaitro',
      'quyen': 'maquyen',
      'hoadon': 'mahd'
    };
    
    return tableMap[this.tableName] || 'id';
  }

  // Transaction wrapper
  async transaction(callback) {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  // Thực thi raw SQL
  async raw(sql, params = []) {
    const result = await this.query(sql, params);
    return result.rows;
  }
}

module.exports = BaseModel;
