const BaseModel = require('./BaseModel');

class Invoice extends BaseModel {
  static get tableName() {
    return 'hoadon';
  }

  static get primaryKey() {
    return 'mahd';
  }

  // Lấy tất cả hóa đơn
  static async getAllInvoices() {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        mahd,
        madon,
        tongtien,
        giamgia,
        phiphuthu,
        trangthai_thanhtoan,
        hinhthuc_thanhtoan,
        ngaylap
      FROM hoadon
      ORDER BY ngaylap DESC
    `;

    const result = await baseModel.query(query);
    return result.rows;
  }

  // Lấy hóa đơn theo ID
  static async getInvoiceById(mahd) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        mahd,
        madon,
        tongtien,
        giamgia,
        phiphuthu,
        trangthai_thanhtoan,
        hinhthuc_thanhtoan,
        ngaylap
      FROM hoadon
      WHERE mahd = $1
    `;

    const result = await baseModel.query(query, [mahd]);
    return result.rows[0] || null;
  }

  // Cập nhật trạng thái thanh toán
  static async updatePaymentStatus(mahd, trangthai_thanhtoan) {
    const baseModel = new BaseModel('hoadon');

    const query = `
      UPDATE hoadon 
      SET trangthai_thanhtoan = $1
      WHERE mahd = $2
      RETURNING *
    `;

    const result = await baseModel.query(query, [trangthai_thanhtoan, mahd]);
    return result.rows[0] || null;
  }

  // Cập nhật hóa đơn (giảm giá, phí phụ thu)
  static async updateInvoice(mahd, invoiceData) {
    const { giamgia, phiphuthu, trangthai_thanhtoan, hinhthuc_thanhtoan } =
      invoiceData;
    const baseModel = new BaseModel('hoadon');

    const query = `
      UPDATE hoadon 
      SET giamgia = $1, phiphuthu = $2, trangthai_thanhtoan = $3, hinhthuc_thanhtoan = $4
      WHERE mahd = $5
      RETURNING *
    `;

    const result = await baseModel.query(query, [
      giamgia || null,
      phiphuthu || null,
      trangthai_thanhtoan || 'Chua thanh toan',
      hinhthuc_thanhtoan || 'cash',
      mahd,
    ]);
    return result.rows[0] || null;
  }

  // Thống kê hóa đơn theo trạng thái (tính doanh thu sau khi trừ giảm giá và cộng phí phụ thu)
  static async getInvoiceStats() {
    const baseModel = new BaseModel('hoadon');

    const query = `
      SELECT 
        COUNT(*) as total_invoices,
        -- Tổng doanh thu: chỉ tính các hóa đơn đã thanh toán, sau khi trừ giảm giá và cộng phí phụ thu
        SUM(
          CASE 
            WHEN trangthai_thanhtoan = 'Da thanh toan' 
            THEN (tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0))
            ELSE 0 
          END
        ) as total_amount,
        
        -- Số lượng đã thanh toán
        SUM(CASE WHEN trangthai_thanhtoan = 'Da thanh toan' THEN 1 ELSE 0 END) as paid_count,
        
        -- Số lượng chưa thanh toán
        SUM(CASE WHEN trangthai_thanhtoan = 'Chua thanh toan' THEN 1 ELSE 0 END) as unpaid_count,
        
        -- Tổng tiền đã thanh toán (sau khi trừ giảm giá và cộng phí phụ thu)
        SUM(
          CASE 
            WHEN trangthai_thanhtoan = 'Da thanh toan' 
            THEN (tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0))
            ELSE 0 
          END
        ) as paid_amount,
        
        -- Tổng tiền chưa thanh toán (sau khi trừ giảm giá và cộng phí phụ thu)
        SUM(
          CASE 
            WHEN trangthai_thanhtoan = 'Chua thanh toan' 
            THEN (tongtien - COALESCE(giamgia, 0) + COALESCE(phiphuthu, 0))
            ELSE 0 
          END
        ) as unpaid_amount
      FROM hoadon
    `;

    const result = await baseModel.query(query);
    return result.rows[0] || null;
  }
}

module.exports = Invoice;
