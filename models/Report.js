const BaseModel = require('./BaseModel');

class Report extends BaseModel {
  static get tableName() {
    return 'hoadon';
  }

  // Lấy doanh thu theo ngày trong khoảng thời gian
  static async getRevenueByDate(startDate, endDate) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        DATE(ngaylap) as date,
        COUNT(*) as invoice_count,
        SUM(tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0)) as total_revenue
      FROM hoadon
      WHERE trangthai_thanhtoan = 'Da thanh toan'
        AND DATE(ngaylap) >= $1
        AND DATE(ngaylap) <= $2
      GROUP BY DATE(ngaylap)
      ORDER BY DATE(ngaylap)
    `;

    const result = await baseModel.query(query, [startDate, endDate]);
    return result.rows;
  }

  // Lấy doanh thu theo tháng trong năm
  static async getRevenueByMonth(year) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        EXTRACT(MONTH FROM ngaylap) as month,
        COUNT(*) as invoice_count,
        SUM(tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0)) as total_revenue
      FROM hoadon
      WHERE trangthai_thanhtoan = 'Da thanh toan'
        AND EXTRACT(YEAR FROM ngaylap) = $1
      GROUP BY EXTRACT(MONTH FROM ngaylap)
      ORDER BY EXTRACT(MONTH FROM ngaylap)
    `;

    const result = await baseModel.query(query, [year]);
    return result.rows;
  }

  // Lấy doanh thu theo năm
  static async getRevenueByYear(startYear, endYear) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        EXTRACT(YEAR FROM ngaylap) as year,
        COUNT(*) as invoice_count,
        SUM(tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0)) as total_revenue
      FROM hoadon
      WHERE trangthai_thanhtoan = 'Da thanh toan'
        AND EXTRACT(YEAR FROM ngaylap) >= $1
        AND EXTRACT(YEAR FROM ngaylap) <= $2
      GROUP BY EXTRACT(YEAR FROM ngaylap)
      ORDER BY EXTRACT(YEAR FROM ngaylap)
    `;

    const result = await baseModel.query(query, [startYear, endYear]);
    return result.rows;
  }

  // Lấy thống kê tổng quan
  static async getOverallStats(startDate, endDate) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        COUNT(*) as total_invoices,
        SUM(CASE WHEN trangthai_thanhtoan = 'Da thanh toan' THEN 1 ELSE 0 END) as paid_invoices,
        SUM(CASE WHEN trangthai_thanhtoan = 'Chua thanh toan' THEN 1 ELSE 0 END) as unpaid_invoices,
        SUM(CASE WHEN trangthai_thanhtoan = 'Da huy' THEN 1 ELSE 0 END) as cancelled_invoices,
        SUM(
          CASE 
            WHEN trangthai_thanhtoan = 'Da thanh toan' 
            THEN (tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0))
            ELSE 0 
          END
        ) as total_revenue,
        AVG(
          CASE 
            WHEN trangthai_thanhtoan = 'Da thanh toan' 
            THEN (tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0))
            ELSE NULL
          END
        ) as average_order_value
      FROM hoadon
      WHERE DATE(ngaylap) >= $1
        AND DATE(ngaylap) <= $2
    `;

    const result = await baseModel.query(query, [startDate, endDate]);
    return result.rows[0] || null;
  }

  // Lấy top ngày có doanh thu cao nhất
  static async getTopRevenueDays(startDate, endDate, limit = 10) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        DATE(ngaylap) as date,
        COUNT(*) as invoice_count,
        SUM(tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0)) as total_revenue
      FROM hoadon
      WHERE trangthai_thanhtoan = 'Da thanh toan'
        AND DATE(ngaylap) >= $1
        AND DATE(ngaylap) <= $2
      GROUP BY DATE(ngaylap)
      ORDER BY total_revenue DESC
      LIMIT $3
    `;

    const result = await baseModel.query(query, [startDate, endDate, limit]);
    return result.rows;
  }

  // Lấy thống kê theo trạng thái thanh toán
  static async getPaymentStatusStats(startDate, endDate) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        trangthai_thanhtoan,
        COUNT(*) as count,
        SUM(tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0)) as total_amount
      FROM hoadon
      WHERE DATE(ngaylap) >= $1
        AND DATE(ngaylap) <= $2
      GROUP BY trangthai_thanhtoan
      ORDER BY count DESC
    `;

    const result = await baseModel.query(query, [startDate, endDate]);
    return result.rows;
  }

  // I. BÁO CÁO DOANH THU TỔNG HỢP THEO NGÀY
  // Doanh thu từng ngày, số hóa đơn, số đơn hàng
  static async getDailyRevenueComprehensive(startDate, endDate) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        DATE(h.ngaylap) as date,
        COUNT(DISTINCT h.mahd) as invoice_count,
        COUNT(DISTINCT h.madon) as order_count,
        SUM(h.tongtien - COALESCE(h.giamgia, 0) + COALESCE(h.phiphuthu, 0)) as total_revenue
      FROM hoadon h
      WHERE h.trangthai_thanhtoan = 'Da thanh toan'
        AND DATE(h.ngaylap) >= $1
        AND DATE(h.ngaylap) <= $2
      GROUP BY DATE(h.ngaylap)
      ORDER BY DATE(h.ngaylap)
    `;

    const result = await baseModel.query(query, [startDate, endDate]);
    return result.rows;
  }

  // II. BÁO CÁO DOANH THU THEO THÁNG (với số hóa đơn)
  static async getMonthlyRevenueWithInvoices(year) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        EXTRACT(MONTH FROM ngaylap) as month,
        COUNT(DISTINCT mahd) as invoice_count,
        SUM(tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0)) as total_revenue
      FROM hoadon
      WHERE trangthai_thanhtoan = 'Da thanh toan'
        AND EXTRACT(YEAR FROM ngaylap) = $1
      GROUP BY EXTRACT(MONTH FROM ngaylap)
      ORDER BY EXTRACT(MONTH FROM ngaylap)
    `;

    const result = await baseModel.query(query, [year]);
    return result.rows;
  }

  // III. BÁO CÁO DOANH THU THEO MÓN ĂN
  // Tên món, danh mục, tổng số lượng đã bán, doanh thu
  static async getRevenueByDish(startDate, endDate) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        m.mamon,
        m.tenmon,
        dm.tendanhmuc,
        SUM(dhct.soluong) as total_quantity,
        SUM(dhct.thanhtien) as total_revenue,
        COUNT(DISTINCT dhct.madon) as order_count,
        ROUND(AVG(dhct.dongia), 0) as avg_price
      FROM monan m
      JOIN danhmucmonan dm ON m.madanhmuc = dm.madanhmuc
      JOIN donhang_chitiet dhct ON m.mamon = dhct.mamon
      JOIN hoadon h ON dhct.madon = h.madon
      WHERE h.trangthai_thanhtoan = 'Da thanh toan'
        AND DATE(h.ngaylap) >= $1
        AND DATE(h.ngaylap) <= $2
      GROUP BY m.mamon, m.tenmon, dm.tendanhmuc
      ORDER BY total_revenue DESC, total_quantity DESC
    `;

    const result = await baseModel.query(query, [startDate, endDate]);
    return result.rows;
  }

  // IV. BÁO CÁO DOANH THU THEO SET BUFFET
  // Tên set, danh mục, tổng số lượng đã bán, doanh thu
  static async getRevenueByBuffetSet(startDate, endDate) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        s.maset,
        s.tenset,
        db.tendanhmuc,
        SUM(dhct.soluong) as total_quantity,
        SUM(dhct.thanhtien) as total_revenue,
        COUNT(DISTINCT dhct.madon) as order_count,
        ROUND(AVG(dhct.dongia), 0) as avg_price
      FROM setbuffet s
      LEFT JOIN danhmucbuffet db ON s.madanhmuc = db.madanhmuc
      JOIN donhang_chitiet dhct ON s.maset = dhct.maset
      JOIN hoadon h ON dhct.madon = h.madon
      WHERE h.trangthai_thanhtoan = 'Da thanh toan'
        AND DATE(h.ngaylap) >= $1
        AND DATE(h.ngaylap) <= $2
      GROUP BY s.maset, s.tenset, db.tendanhmuc
      ORDER BY total_revenue DESC, total_quantity DESC
    `;

    const result = await baseModel.query(query, [startDate, endDate]);
    return result.rows;
  }

  // V. BÁO CÁO BOOKING BÀN (ĐẶT BÀN)
  // Tổng số phiếu đặt bàn, số bàn hủy, tỉ lệ hủy
  static async getBookingReport(startDate, endDate) {
    const baseModel = new BaseModel('phieudatban');

    const query = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN trangthai = 'DaDat' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN trangthai = 'DaXacNhan' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN trangthai = 'HoanThanh' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN trangthai = 'DaHuy' THEN 1 END) as cancelled_bookings,
        CASE 
          WHEN COUNT(*) > 0 
          THEN ROUND((COUNT(CASE WHEN trangthai = 'DaHuy' THEN 1 END)::numeric / COUNT(*)::numeric) * 100, 2)
          ELSE 0 
        END as cancellation_rate,
        COUNT(CASE WHEN nguon_dat = 'Online' THEN 1 END) as online_bookings,
        COUNT(CASE WHEN nguon_dat = 'Tai quan' THEN 1 END) as offline_bookings,
        AVG(songuoi) as avg_guests
      FROM phieudatban
      WHERE DATE(thoigian_dat) >= $1
        AND DATE(thoigian_dat) <= $2
    `;

    const result = await baseModel.query(query, [startDate, endDate]);
    return result.rows[0] || null;
  }
}

module.exports = Report;
