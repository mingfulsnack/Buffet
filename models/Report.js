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
}

module.exports = Report;
