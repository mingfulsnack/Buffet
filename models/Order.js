const BaseModel = require('./BaseModel');

class Order extends BaseModel {
  static get tableName() {
    return 'donhang';
  }

  static get primaryKey() {
    return 'madon';
  }

  // Tạo đơn hàng mới
  static async createOrder(orderData) {
    const { monAn = [], ghichu = '', maban = null } = orderData;
    console.log('Order.createOrder received data:', { monAn, ghichu, maban }); // Debug log

    const baseModel = new BaseModel('donhang');

    return await baseModel.transaction(async (client) => {
      // Validate maban nếu được cung cấp
      if (maban) {
        const banCheck = await client.query(
          'SELECT maban FROM ban WHERE maban = $1',
          [maban]
        );
        if (banCheck.rows.length === 0) {
          throw new Error(`Bàn số ${maban} không tồn tại`);
        }
      }

      // Tính tổng tiền
      let tongTien = 0;
      const chiTietItems = [];

      for (const item of monAn) {
        let dongia = 0;
        if (item.type === 'monan') {
          const dishResult = await client.query(
            'SELECT dongia FROM monan WHERE mamon = $1',
            [item.id]
          );
          if (dishResult.rows.length > 0) {
            dongia = dishResult.rows[0].dongia;
          }
        } else if (item.type === 'setbuffet') {
          const setResult = await client.query(
            'SELECT dongia FROM setbuffet WHERE maset = $1',
            [item.id]
          );
          if (setResult.rows.length > 0) {
            dongia = setResult.rows[0].dongia;
          }
        }

        const thanhtien = dongia * item.soluong;
        tongTien += thanhtien;

        chiTietItems.push({
          type: item.type,
          id: item.id,
          soluong: item.soluong,
          dongia: dongia,
          thanhtien: thanhtien,
        });
      }

      // Tạo đơn hàng
      const orderResult = await client.query(
        `INSERT INTO donhang (tongtien, ghichu, maban, thoi_gian_tao) 
         VALUES ($1, $2, $3, NOW()) 
         RETURNING *`,
        [tongTien, ghichu || null, maban]
      );

      const order = orderResult.rows[0];

      // Tạo chi tiết đơn hàng
      for (const item of chiTietItems) {
        if (item.type === 'monan') {
          await client.query(
            `INSERT INTO donhang_chitiet (madon, mamon, maset, soluong, dongia, thanhtien) 
             VALUES ($1, $2, NULL, $3, $4, $5)`,
            [order.madon, item.id, item.soluong, item.dongia, item.thanhtien]
          );
        } else if (item.type === 'setbuffet') {
          await client.query(
            `INSERT INTO donhang_chitiet (madon, mamon, maset, soluong, dongia, thanhtien) 
             VALUES ($1, NULL, $2, $3, $4, $5)`,
            [order.madon, item.id, item.soluong, item.dongia, item.thanhtien]
          );
        }
      }

      return order;
    });
  }

  // Lấy tất cả đơn hàng với chi tiết
  static async getAllOrdersWithDetails() {
    const baseModel = new BaseModel('donhang');

    const query = `
      SELECT 
        d.madon,
        d.tongtien,
        d.ghichu,
        d.maban,
        b.tenban,
        v.tenvung,
        d.thoi_gian_tao,
        CASE WHEN h.mahd IS NOT NULL THEN true ELSE false END as da_xac_nhan,
        h.mahd as mahd,
        json_agg(
          json_build_object(
            'id', dc.id,
            'type', CASE 
              WHEN dc.mamon IS NOT NULL THEN 'monan'
              WHEN dc.maset IS NOT NULL THEN 'setbuffet'
            END,
            'item_id', COALESCE(dc.mamon, dc.maset),
            'ten', COALESCE(m.tenmon, s.tenset),
            'soluong', dc.soluong,
            'dongia', dc.dongia,
            'thanhtien', dc.thanhtien
          )
        ) as chitiet
      FROM donhang d
      LEFT JOIN donhang_chitiet dc ON d.madon = dc.madon
      LEFT JOIN monan m ON dc.mamon = m.mamon
      LEFT JOIN setbuffet s ON dc.maset = s.maset
      LEFT JOIN ban b ON d.maban = b.maban
      LEFT JOIN vung v ON b.mavung = v.mavung
      LEFT JOIN hoadon h ON d.madon = h.madon
      GROUP BY d.madon, d.tongtien, d.ghichu, d.maban, b.tenban, v.tenvung, d.thoi_gian_tao, h.mahd
      ORDER BY d.thoi_gian_tao DESC
    `;

    const result = await baseModel.query(query);
    return result.rows;
  }

  // Lấy đơn hàng theo ID với chi tiết
  static async getOrderWithDetails(madon) {
    const baseModel = new BaseModel('donhang');

    const query = `
      SELECT 
        d.madon,
        d.tongtien,
        d.ghichu,
        d.thoi_gian_tao,
        json_agg(
          json_build_object(
            'id', dc.id,
            'type', CASE 
              WHEN dc.mamon IS NOT NULL THEN 'monan'
              WHEN dc.maset IS NOT NULL THEN 'setbuffet'
            END,
            'item_id', COALESCE(dc.mamon, dc.maset),
            'ten', COALESCE(m.tenmon, s.tenset),
            'soluong', dc.soluong,
            'dongia', dc.dongia,
            'thanhtien', dc.thanhtien
          )
        ) as chitiet
      FROM donhang d
      LEFT JOIN donhang_chitiet dc ON d.madon = dc.madon
      LEFT JOIN monan m ON dc.mamon = m.mamon
      LEFT JOIN setbuffet s ON dc.maset = s.maset
      WHERE d.madon = $1
      GROUP BY d.madon, d.tongtien, d.ghichu, d.thoi_gian_tao
    `;

    const result = await baseModel.query(query, [madon]);
    return result.rows[0] || null;
  }

  // Cập nhật đơn hàng
  static async updateOrder(madon, orderData) {
    const { monAn = [], ghichu = '', maban = null } = orderData;
    console.log('Order.updateOrder received data:', {
      madon,
      monAn,
      ghichu,
      maban,
    }); // Debug log

    const baseModel = new BaseModel('donhang');

    return await baseModel.transaction(async (client) => {
      // Validate maban nếu được cung cấp
      if (maban) {
        const banCheck = await client.query(
          'SELECT maban FROM ban WHERE maban = $1',
          [maban]
        );
        if (banCheck.rows.length === 0) {
          throw new Error(`Bàn số ${maban} không tồn tại`);
        }
      }

      // Xóa chi tiết cũ
      await client.query('DELETE FROM donhang_chitiet WHERE madon = $1', [
        madon,
      ]);

      // Tính tổng tiền mới
      let tongTien = 0;
      const chiTietItems = [];

      for (const item of monAn) {
        let dongia = 0;
        if (item.type === 'monan') {
          const dishResult = await client.query(
            'SELECT dongia FROM monan WHERE mamon = $1',
            [item.id]
          );
          if (dishResult.rows.length > 0) {
            dongia = dishResult.rows[0].dongia;
          }
        } else if (item.type === 'setbuffet') {
          const setResult = await client.query(
            'SELECT dongia FROM setbuffet WHERE maset = $1',
            [item.id]
          );
          if (setResult.rows.length > 0) {
            dongia = setResult.rows[0].dongia;
          }
        }

        const thanhtien = dongia * item.soluong;
        tongTien += thanhtien;

        chiTietItems.push({
          type: item.type,
          id: item.id,
          soluong: item.soluong,
          dongia: dongia,
          thanhtien: thanhtien,
        });
      }

      // Cập nhật đơn hàng
      const orderResult = await client.query(
        `UPDATE donhang 
         SET tongtien = $1, ghichu = $2, maban = $3
         WHERE madon = $4 
         RETURNING *`,
        [tongTien, ghichu || null, maban, madon]
      );

      // Tạo chi tiết mới
      for (const item of chiTietItems) {
        if (item.type === 'monan') {
          await client.query(
            `INSERT INTO donhang_chitiet (madon, mamon, maset, soluong, dongia, thanhtien) 
             VALUES ($1, $2, NULL, $3, $4, $5)`,
            [madon, item.id, item.soluong, item.dongia, item.thanhtien]
          );
        } else if (item.type === 'setbuffet') {
          await client.query(
            `INSERT INTO donhang_chitiet (madon, mamon, maset, soluong, dongia, thanhtien) 
             VALUES ($1, NULL, $2, $3, $4, $5)`,
            [madon, item.id, item.soluong, item.dongia, item.thanhtien]
          );
        }
      }

      return orderResult.rows[0];
    });
  }

  // Xóa đơn hàng
  static async deleteOrder(madon) {
    const baseModel = new BaseModel('donhang');
    return await baseModel.transaction(async (client) => {
      // Xóa chi tiết trước
      await client.query('DELETE FROM donhang_chitiet WHERE madon = $1', [
        madon,
      ]);

      // Xóa đơn hàng
      const result = await client.query(
        'DELETE FROM donhang WHERE madon = $1 RETURNING *',
        [madon]
      );

      return result.rows[0] || null;
    });
  }

  // Xác nhận đơn hàng (tạo hóa đơn nhưng không xóa đơn hàng)
  static async confirmOrder(madon) {
    const baseModel = new BaseModel('donhang');

    return await baseModel.transaction(async (client) => {
      // Lấy thông tin đơn hàng
      const orderResult = await client.query(
        'SELECT * FROM donhang WHERE madon = $1',
        [madon]
      );

      if (orderResult.rows.length === 0) {
        throw new Error('Đơn hàng không tồn tại');
      }

      const order = orderResult.rows[0];

      // Kiểm tra xem đã có hóa đơn cho đơn hàng này chưa
      const existingInvoiceResult = await client.query(
        'SELECT mahd FROM hoadon WHERE madon = $1',
        [madon]
      );

      if (existingInvoiceResult.rows.length > 0) {
        throw new Error('Đơn hàng này đã được xác nhận trước đó');
      }

      // Tính tổng tiền từ chi tiết đơn hàng
      const totalResult = await client.query(
        'SELECT SUM(thanhtien) as tongtien FROM donhang_chitiet WHERE madon = $1',
        [madon]
      );

      const tongtien = totalResult.rows[0].tongtien || order.tongtien || 0;

      // Tạo hóa đơn nhưng không xóa đơn hàng
      const invoiceResult = await client.query(
        `INSERT INTO hoadon (madon, tongtien, giamgia, phiphuthu, ngaylap) 
         VALUES ($1, $2, NULL, NULL, NOW()) 
         RETURNING *`,
        [madon, tongtien]
      );

      const invoice = invoiceResult.rows[0];

      // Cập nhật trạng thái đơn hàng thành đã xác nhận (nếu có cột trạng thái)
      // Nếu không có cột trạng thái, có thể thêm sau

      return invoice;
    });
  }
}

module.exports = Order;
