const BaseModel = require('./BaseModel');
const { hashPassword } = require('../utils/helpers');

class Employee extends BaseModel {
  constructor() {
    super('nhanvien');
  }

  // Tìm nhân viên theo tên đăng nhập
  async findByUsername(username) {
    const result = await this.query(`
      SELECT nv.*, vt.tenvaitro 
      FROM ${this.tableName} nv
      LEFT JOIN vai_tro vt ON nv.mavaitro = vt.mavaitro
      WHERE nv.tendangnhap = $1 AND nv.is_active = true
    `, [username]);
    
    return result.rows[0] || null;
  }

  // Lấy danh sách nhân viên với vai trò
  async findAllWithRole(conditions = {}, page = 1, limit = 20) {
    let whereClause = 'WHERE 1=1';
    const params = [];
    let paramCount = 0;

    // Xử lý điều kiện tìm kiếm
    if (conditions.mavaitro) {
      paramCount++;
      whereClause += ` AND nv.mavaitro = $${paramCount}`;
      params.push(conditions.mavaitro);
    }

    if (conditions.is_active !== undefined) {
      paramCount++;
      whereClause += ` AND nv.is_active = $${paramCount}`;
      params.push(conditions.is_active);
    }

    if (conditions.search) {
      paramCount++;
      whereClause += ` AND (nv.hoten ILIKE $${paramCount} OR nv.tendangnhap ILIKE $${paramCount} OR nv.sodienthoai ILIKE $${paramCount})`;
      params.push(`%${conditions.search}%`);
    }

    // Đếm tổng số
    const countResult = await this.query(`
      SELECT COUNT(*) as total FROM ${this.tableName} nv ${whereClause}
    `, params);
    const total = parseInt(countResult.rows[0].total);

    // Lấy dữ liệu với phân trang
    const offset = (page - 1) * limit;
    params.push(limit, offset);
    
    const result = await this.query(`
      SELECT nv.manv, nv.hoten, nv.tendangnhap, nv.sodienthoai, nv.email,
             nv.calam, nv.ngayvaolam, nv.is_active, nv.created_at,
             vt.tenvaitro
      FROM ${this.tableName} nv
      LEFT JOIN vai_tro vt ON nv.mavaitro = vt.mavaitro
      ${whereClause}
      ORDER BY nv.created_at DESC
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `, params);

    return {
      data: result.rows,
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

  // Lấy chi tiết nhân viên với quyền
  async findByIdWithPermissions(id) {
    const employee = await this.query(`
      SELECT nv.manv, nv.hoten, nv.tendangnhap, nv.sodienthoai, nv.email,
             nv.calam, nv.ngayvaolam, nv.is_active, nv.created_at, nv.mavaitro,
             vt.tenvaitro
      FROM ${this.tableName} nv
      LEFT JOIN vai_tro vt ON nv.mavaitro = vt.mavaitro
      WHERE nv.manv = $1
    `, [id]);

    if (employee.rows.length === 0) {
      return null;
    }

    const emp = employee.rows[0];

    // Lấy quyền
    const permissions = await this.query(`
      SELECT q.maquyen, q.tenquyen
      FROM vaitro_quyen vq
      JOIN quyen q ON vq.maquyen = q.maquyen
      WHERE vq.mavaitro = $1
      ORDER BY q.tenquyen
    `, [emp.mavaitro]);

    emp.quyen = permissions.rows;
    return emp;
  }

  // Tạo nhân viên mới
  async createEmployee(data) {
    if (data.matkhau) {
      data.matkhauhash = await hashPassword(data.matkhau);
      delete data.matkhau;
    }

    return await this.create(data);
  }

  // Cập nhật mật khẩu
  async updatePassword(id, newPassword) {
    const hashedPassword = await hashPassword(newPassword);
    return await this.update(id, { matkhauhash: hashedPassword });
  }

  // Kiểm tra tên đăng nhập có tồn tại không
  async isUsernameExists(username, excludeId = null) {
    let sql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE tendangnhap = $1`;
    const params = [username];

    if (excludeId) {
      sql += ` AND manv != $2`;
      params.push(excludeId);
    }

    const result = await this.query(sql, params);
    return parseInt(result.rows[0].count) > 0;
  }

  // Lấy danh sách vai trò
  async getRoles() {
    const result = await this.query(`
      SELECT vt.*, COUNT(nv.manv) as so_nhan_vien
      FROM vai_tro vt
      LEFT JOIN ${this.tableName} nv ON vt.mavaitro = nv.mavaitro AND nv.is_active = true
      GROUP BY vt.mavaitro, vt.tenvaitro
      ORDER BY vt.tenvaitro
    `);
    
    return result.rows;
  }

  // Tạo vai trò mới
  async createRole(tenvaitro) {
    const result = await this.query(`
      INSERT INTO vai_tro (tenvaitro) VALUES ($1) RETURNING *
    `, [tenvaitro]);
    
    return result.rows[0];
  }

  // Lấy danh sách quyền
  async getPermissions() {
    const result = await this.query('SELECT * FROM quyen ORDER BY tenquyen');
    return result.rows;
  }

  // Tạo quyền mới
  async createPermission(tenquyen) {
    const result = await this.query(`
      INSERT INTO quyen (tenquyen) VALUES ($1) RETURNING *
    `, [tenquyen]);
    
    return result.rows[0];
  }

  // Cập nhật quyền cho vai trò
  async updateRolePermissions(mavaitro, permissions) {
    return await this.transaction(async (client) => {
      // Xóa quyền cũ
      await client.query('DELETE FROM vaitro_quyen WHERE mavaitro = $1', [mavaitro]);

      // Thêm quyền mới
      if (permissions && permissions.length > 0) {
        for (const maquyen of permissions) {
          await client.query(`
            INSERT INTO vaitro_quyen (mavaitro, maquyen)
            VALUES ($1, $2)
          `, [mavaitro, maquyen]);
        }
      }

      return true;
    });
  }
}

module.exports = new Employee();
