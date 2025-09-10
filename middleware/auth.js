const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Xác thực JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ 
      success: false, 
      message: 'Access token required' 
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Lấy thông tin nhân viên từ database
    const result = await pool.query(`
      SELECT nv.*, vt.tenvaitro 
      FROM nhanvien nv 
      LEFT JOIN vai_tro vt ON nv.mavaitro = vt.mavaitro 
      WHERE nv.manv = $1 AND nv.is_active = true
    `, [decoded.manv]);

    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user not found' 
      });
    }

    req.user = result.rows[0];
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};

// Kiểm tra quyền theo vai trò
const checkRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    const userRole = req.user.tenvaitro;
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Insufficient permissions' 
      });
    }

    next();
  };
};

// Kiểm tra quyền cụ thể
const checkPermission = (requiredPermission) => {
  return async (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Authentication required' 
      });
    }

    try {
      const result = await pool.query(`
        SELECT q.tenquyen 
        FROM vaitro_quyen vq
        JOIN quyen q ON vq.maquyen = q.maquyen
        WHERE vq.mavaitro = $1 AND q.tenquyen = $2
      `, [req.user.mavaitro, requiredPermission]);

      if (result.rows.length === 0) {
        return res.status(403).json({ 
          success: false, 
          message: 'Permission denied' 
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({ 
        success: false, 
        message: 'Permission check failed' 
      });
    }
  };
};

module.exports = {
  authenticateToken,
  checkRole,
  checkPermission
};
