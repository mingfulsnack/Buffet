const Order = require('../models/Order');
const BaseModel = require('../models/BaseModel');
const {
  formatResponse,
  formatErrorResponse,
} = require('../utils/responseFormatter');

// Lấy danh sách đơn hàng
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.getAllOrdersWithDetails();

    // Format dữ liệu để hiển thị
    const formattedOrders = orders.map((order) => {
      const monanText = order.chitiet
        .filter((item) => item.ten)
        .map((item) => `${item.ten} (x${item.soluong})`)
        .join(', ');

      return {
        ...order,
        monan_text:
          monanText.length > 100
            ? monanText.substring(0, 100) + '...'
            : monanText,
      };
    });

    res.json(
      formatResponse(true, formattedOrders, 'Lấy danh sách đơn hàng thành công')
    );
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy đơn hàng theo ID
const getOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.getOrderWithDetails(id);

    if (!order) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy đơn hàng'));
    }

    res.json(formatResponse(true, order, 'Lấy thông tin đơn hàng thành công'));
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy danh sách món ăn và set buffet để chọn
const getMenuForOrder = async (req, res) => {
  try {
    const baseModel = new BaseModel('monan');

    // Lấy món ăn
    const dishesResult = await baseModel.query(`
      SELECT mamon, tenmon, dongia, image
      FROM monan 
      WHERE trangthai = 'Con'
      ORDER BY tenmon
    `);

    const formattedDishes = dishesResult.rows.map((dish) => ({
      id: dish.mamon,
      type: 'monan',
      name: dish.tenmon,
      price: dish.dongia,
      image: dish.image,
    }));

    // Lấy set buffet
    const setsResult = await baseModel.query(`
      SELECT maset, tenset, dongia, image
      FROM setbuffet 
      WHERE trangthai = 'HoatDong'
      ORDER BY tenset
    `);

    const formattedSets = setsResult.rows.map((set) => ({
      id: set.maset,
      type: 'setbuffet',
      name: set.tenset,
      price: set.dongia,
      image: set.image,
    }));

    const menuData = {
      dishes: formattedDishes,
      sets: formattedSets,
    };

    res.json(formatResponse(true, menuData, 'Lấy menu thành công'));
  } catch (error) {
    console.error('Get menu error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Tạo đơn hàng
const createOrder = async (req, res) => {
  try {
    const { monAn, ghichu } = req.body;

    if (!monAn || !Array.isArray(monAn) || monAn.length === 0) {
      return res
        .status(400)
        .json(formatErrorResponse('Vui lòng chọn ít nhất một món'));
    }

    // Validate dữ liệu món ăn
    for (const item of monAn) {
      if (!item.id || !item.type || !item.soluong || item.soluong <= 0) {
        return res
          .status(400)
          .json(formatErrorResponse('Dữ liệu món ăn không hợp lệ'));
      }
      if (!['monan', 'setbuffet'].includes(item.type)) {
        return res
          .status(400)
          .json(formatErrorResponse('Loại món không hợp lệ'));
      }
    }

    const order = await Order.createOrder({ monAn, ghichu });
    res
      .status(201)
      .json(formatResponse(true, order, 'Tạo đơn hàng thành công'));
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Cập nhật đơn hàng
const updateOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { monAn, ghichu } = req.body;

    if (!monAn || !Array.isArray(monAn) || monAn.length === 0) {
      return res
        .status(400)
        .json(formatErrorResponse('Vui lòng chọn ít nhất một món'));
    }

    // Validate dữ liệu món ăn
    for (const item of monAn) {
      if (!item.id || !item.type || !item.soluong || item.soluong <= 0) {
        return res
          .status(400)
          .json(formatErrorResponse('Dữ liệu món ăn không hợp lệ'));
      }
      if (!['monan', 'setbuffet'].includes(item.type)) {
        return res
          .status(400)
          .json(formatErrorResponse('Loại món không hợp lệ'));
      }
    }

    const order = await Order.updateOrder(id, { monAn, ghichu });

    if (!order) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy đơn hàng'));
    }

    res.json(formatResponse(true, order, 'Cập nhật đơn hàng thành công'));
  } catch (error) {
    console.error('Update order error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Xóa đơn hàng
const deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedOrder = await Order.deleteOrder(id);

    if (!deletedOrder) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy đơn hàng'));
    }

    res.json(formatResponse(true, null, 'Xóa đơn hàng thành công'));
  } catch (error) {
    console.error('Delete order error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Xác nhận đơn hàng (tạo hóa đơn và xóa đơn hàng)
const confirmOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const invoice = await Order.confirmOrder(id);

    res.json(
      formatResponse(
        true,
        invoice,
        'Xác nhận đơn hàng thành công. Đã tạo hóa đơn và xóa đơn hàng.'
      )
    );
  } catch (error) {
    console.error('Confirm order error:', error);
    if (
      error.message.includes('Không tìm thấy') ||
      error.message.includes('không tồn tại')
    ) {
      res.status(404).json(formatErrorResponse(error.message));
    } else {
      res.status(500).json(formatErrorResponse('Lỗi server'));
    }
  }
};

module.exports = {
  getAllOrders,
  getOrderById,
  getMenuForOrder,
  createOrder,
  updateOrder,
  deleteOrder,
  confirmOrder,
};
