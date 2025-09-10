const pool = require('../config/database');
const { formatResponse, formatErrorResponse } = require('../utils/helpers');
const moment = require('moment');

// Báo cáo tổng quan dashboard
const getDashboardStats = async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');
    const thisMonth = moment().format('YYYY-MM');

    // Thống kê hôm nay
    const todayStats = await pool.query(`
      SELECT 
        COUNT(CASE WHEN p.trangthai IN ('DaDat', 'DaXacNhan') THEN 1 END) as dat_ban_cho_xac_nhan,
        COUNT(CASE WHEN p.trangthai = 'DangSuDung' THEN 1 END) as ban_dang_su_dung,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as hoan_thanh_hom_nay,
        COALESCE(SUM(CASE WHEN p.trangthai = 'HoanThanh' AND hd.thanhtoan IS NOT NULL THEN hd.thanhtoan END), 0) as doanh_thu_hom_nay
      FROM phieudatban p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE DATE(p.thoigian_dat) = $1
    `, [today]);

    // Thống kê tháng này
    const monthStats = await pool.query(`
      SELECT 
        COUNT(*) as tong_dat_ban_thang,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as hoan_thanh_thang,
        COALESCE(SUM(hd.thanhtoan), 0) as doanh_thu_thang
      FROM phieudatban p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE DATE_TRUNC('month', p.thoigian_dat) = $1
    `, [thisMonth + '-01']);

    // Tình trạng bàn hiện tại
    const tableStats = await pool.query(`
      SELECT 
        trangthai,
        COUNT(*) as so_luong
      FROM ban
      GROUP BY trangthai
    `);

    // Top khách hàng
    const topCustomers = await pool.query(`
      SELECT 
        kh.hoten,
        kh.sodienthoai,
        COUNT(p.maphieu) as so_lan_dat,
        COALESCE(SUM(hd.thanhtoan), 0) as tong_chi_tieu
      FROM khachhang kh
      JOIN phieudatban p ON kh.makh = p.makh
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.created_at >= DATE_TRUNC('month', CURRENT_DATE)
      GROUP BY kh.makh, kh.hoten, kh.sodienthoai
      ORDER BY tong_chi_tieu DESC
      LIMIT 5
    `);

    // Doanh thu 7 ngày gần nhất
    const revenueChart = await pool.query(`
      SELECT 
        DATE(p.thoigian_dat) as ngay,
        COUNT(p.maphieu) as so_dat_ban,
        COALESCE(SUM(hd.thanhtoan), 0) as doanh_thu
      FROM phieudatban p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.thoigian_dat >= CURRENT_DATE - INTERVAL '7 days'
      GROUP BY DATE(p.thoigian_dat)
      ORDER BY ngay
    `);

    const dashboardData = {
      hom_nay: todayStats.rows[0],
      thang_nay: monthStats.rows[0],
      tinh_trang_ban: tableStats.rows,
      top_khach_hang: topCustomers.rows,
      bieu_do_doanh_thu: revenueChart.rows
    };

    res.json(formatResponse(true, dashboardData, 'Lấy thống kê dashboard thành công'));

  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Báo cáo doanh thu theo khoảng thời gian
const getRevenueReport = async (req, res) => {
  try {
    const { tu_ngay, den_ngay, group_by = 'day' } = req.query;

    if (!tu_ngay || !den_ngay) {
      return res.status(400).json(formatErrorResponse('Thiếu thông tin khoảng thời gian'));
    }

    let dateFormat, dateGroupBy;
    switch (group_by) {
      case 'week':
        dateFormat = 'YYYY-"W"WW';
        dateGroupBy = "DATE_TRUNC('week', p.thoigian_dat)";
        break;
      case 'month':
        dateFormat = 'YYYY-MM';
        dateGroupBy = "DATE_TRUNC('month', p.thoigian_dat)";
        break;
      default: // day
        dateFormat = 'YYYY-MM-DD';
        dateGroupBy = "DATE(p.thoigian_dat)";
    }

    const result = await pool.query(`
      SELECT 
        ${dateGroupBy} as ngay,
        COUNT(p.maphieu) as so_dat_ban,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as dat_ban_hoan_thanh,
        COUNT(CASE WHEN p.trangthai = 'DaHuy' THEN 1 END) as dat_ban_huy,
        COALESCE(SUM(hd.tongtien), 0) as tong_tien,
        COALESCE(SUM(hd.giamgia), 0) as tong_giam_gia,
        COALESCE(SUM(hd.thanhtoan), 0) as doanh_thu,
        AVG(hd.thanhtoan) as doanh_thu_trung_binh
      FROM phieudatban p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
      GROUP BY ${dateGroupBy}
      ORDER BY ngay
    `, [tu_ngay, den_ngay]);

    // Tính tổng kết
    const summary = await pool.query(`
      SELECT 
        COUNT(p.maphieu) as tong_dat_ban,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as tong_hoan_thanh,
        COUNT(CASE WHEN p.trangthai = 'DaHuy' THEN 1 END) as tong_huy,
        COALESCE(SUM(hd.tongtien), 0) as tong_tien_goc,
        COALESCE(SUM(hd.giamgia), 0) as tong_giam_gia,
        COALESCE(SUM(hd.thanhtoan), 0) as tong_doanh_thu
      FROM phieudatban p
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
    `, [tu_ngay, den_ngay]);

    res.json(formatResponse(
      true, 
      {
        chi_tiet: result.rows,
        tong_ket: summary.rows[0]
      }, 
      'Lấy báo cáo doanh thu thành công'
    ));

  } catch (error) {
    console.error('Get revenue report error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Báo cáo hiệu suất sử dụng bàn
const getTableUsageReport = async (req, res) => {
  try {
    const { tu_ngay, den_ngay } = req.query;

    if (!tu_ngay || !den_ngay) {
      return res.status(400).json(formatErrorResponse('Thiếu thông tin khoảng thời gian'));
    }

    const result = await pool.query(`
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
      FROM ban b
      JOIN vung v ON b.mavung = v.mavung
      LEFT JOIN phieudatban p ON b.maban = p.maban 
        AND p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      GROUP BY b.maban, b.tenban, v.tenvung, b.soghe
      ORDER BY so_lan_dat DESC, doanh_thu DESC
    `, [tu_ngay, den_ngay]);

    // Thống kê theo vùng
    const areaStats = await pool.query(`
      SELECT 
        v.tenvung,
        COUNT(DISTINCT b.maban) as so_ban,
        COUNT(p.maphieu) as so_lan_dat,
        COALESCE(SUM(hd.thanhtoan), 0) as doanh_thu
      FROM vung v
      LEFT JOIN ban b ON v.mavung = b.mavung
      LEFT JOIN phieudatban p ON b.maban = p.maban 
        AND p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      GROUP BY v.mavung, v.tenvung
      ORDER BY doanh_thu DESC
    `, [tu_ngay, den_ngay]);

    res.json(formatResponse(
      true, 
      {
        chi_tiet_ban: result.rows,
        thong_ke_vung: areaStats.rows
      }, 
      'Lấy báo cáo hiệu suất bàn thành công'
    ));

  } catch (error) {
    console.error('Get table usage report error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Báo cáo khách hàng
const getCustomerReport = async (req, res) => {
  try {
    const { tu_ngay, den_ngay, sap_xep = 'doanh_thu' } = req.query;

    if (!tu_ngay || !den_ngay) {
      return res.status(400).json(formatErrorResponse('Thiếu thông tin khoảng thời gian'));
    }

    let orderBy = 'SUM(hd.thanhtoan) DESC';
    if (sap_xep === 'so_lan') {
      orderBy = 'COUNT(p.maphieu) DESC';
    } else if (sap_xep === 'gan_nhat') {
      orderBy = 'MAX(p.created_at) DESC';
    }

    const result = await pool.query(`
      SELECT 
        kh.makh,
        kh.hoten,
        kh.sodienthoai,
        kh.email,
        htv.tenhang,
        COUNT(p.maphieu) as so_lan_dat,
        COUNT(CASE WHEN p.trangthai = 'HoanThanh' THEN 1 END) as lan_hoan_thanh,
        COUNT(CASE WHEN p.trangthai = 'DaHuy' THEN 1 END) as lan_huy,
        COALESCE(SUM(hd.thanhtoan), 0) as tong_chi_tieu,
        AVG(hd.thanhtoan) as chi_tieu_trung_binh,
        MAX(p.created_at) as lan_dat_cuoi
      FROM khachhang kh
      JOIN phieudatban p ON kh.makh = p.makh
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      LEFT JOIN hangthanhvien htv ON kh.mahang = htv.mahang
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
        AND kh.is_deleted = false
      GROUP BY kh.makh, kh.hoten, kh.sodienthoai, kh.email, htv.tenhang
      ORDER BY ${orderBy}
      LIMIT 100
    `, [tu_ngay, den_ngay]);

    // Thống kê theo hạng thành viên
    const membershipStats = await pool.query(`
      SELECT 
        COALESCE(htv.tenhang, 'Chưa có hạng') as ten_hang,
        COUNT(DISTINCT kh.makh) as so_khach_hang,
        COUNT(p.maphieu) as so_lan_dat,
        COALESCE(SUM(hd.thanhtoan), 0) as doanh_thu,
        AVG(hd.thanhtoan) as chi_tieu_trung_binh
      FROM khachhang kh
      LEFT JOIN hangthanhvien htv ON kh.mahang = htv.mahang
      JOIN phieudatban p ON kh.makh = p.makh
      LEFT JOIN hoadon hd ON p.maphieu = hd.maphieu
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
        AND kh.is_deleted = false
      GROUP BY htv.mahang, htv.tenhang
      ORDER BY doanh_thu DESC
    `, [tu_ngay, den_ngay]);

    res.json(formatResponse(
      true, 
      {
        khach_hang: result.rows,
        thong_ke_hang_thanh_vien: membershipStats.rows
      }, 
      'Lấy báo cáo khách hàng thành công'
    ));

  } catch (error) {
    console.error('Get customer report error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Báo cáo món ăn phổ biến
const getPopularDishesReport = async (req, res) => {
  try {
    const { tu_ngay, den_ngay } = req.query;

    if (!tu_ngay || !den_ngay) {
      return res.status(400).json(formatErrorResponse('Thiếu thông tin khoảng thời gian'));
    }

    const result = await pool.query(`
      SELECT 
        m.mamon,
        m.tenmon,
        dm.tendanhmuc,
        m.dongia,
        SUM(dc.soluong) as tong_so_luong,
        COUNT(DISTINCT dc.madon) as so_don_goi,
        SUM(dc.soluong * dc.dongia) as doanh_thu
      FROM monan m
      JOIN danhmucmonan dm ON m.madanhmuc = dm.madanhmuc
      JOIN donhang_chitiet dc ON m.mamon = dc.mamon
      JOIN donhang d ON dc.madon = d.madon
      JOIN phieudatban p ON d.maphieu = p.maphieu
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
      GROUP BY m.mamon, m.tenmon, dm.tendanhmuc, m.dongia
      ORDER BY tong_so_luong DESC
      LIMIT 20
    `, [tu_ngay, den_ngay]);

    // Thống kê theo danh mục
    const categoryStats = await pool.query(`
      SELECT 
        dm.tendanhmuc,
        COUNT(DISTINCT m.mamon) as so_mon,
        SUM(dc.soluong) as tong_so_luong,
        SUM(dc.soluong * dc.dongia) as doanh_thu
      FROM danhmucmonan dm
      JOIN monan m ON dm.madanhmuc = m.madanhmuc
      JOIN donhang_chitiet dc ON m.mamon = dc.mamon
      JOIN donhang d ON dc.madon = d.madon
      JOIN phieudatban p ON d.maphieu = p.maphieu
      WHERE p.thoigian_dat >= $1 AND p.thoigian_dat <= $2
      GROUP BY dm.madanhmuc, dm.tendanhmuc
      ORDER BY doanh_thu DESC
    `, [tu_ngay, den_ngay]);

    res.json(formatResponse(
      true, 
      {
        mon_pho_bien: result.rows,
        thong_ke_danh_muc: categoryStats.rows
      }, 
      'Lấy báo cáo món ăn phổ biến thành công'
    ));

  } catch (error) {
    console.error('Get popular dishes report error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Xuất báo cáo Excel/CSV (placeholder - cần implement thêm)
const exportReport = async (req, res) => {
  try {
    // TODO: Implement Excel/CSV export functionality
    res.json(formatResponse(false, null, 'Chức năng xuất báo cáo đang được phát triển'));
  } catch (error) {
    console.error('Export report error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

module.exports = {
  getDashboardStats,
  getRevenueReport,
  getTableUsageReport,
  getCustomerReport,
  getPopularDishesReport,
  exportReport
};
