const Invoice = require('../models/Invoice');
const {
  formatResponse,
  formatErrorResponse,
} = require('../utils/responseFormatter');

// Lấy danh sách hóa đơn
const getAllInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.getAllInvoices();

    res.json(
      formatResponse(true, invoices, 'Lấy danh sách hóa đơn thành công')
    );
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy hóa đơn theo ID
const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const invoice = await Invoice.getInvoiceById(id);

    if (!invoice) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy hóa đơn'));
    }

    res.json(formatResponse(true, invoice, 'Lấy thông tin hóa đơn thành công'));
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Cập nhật trạng thái thanh toán
const updatePaymentStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { trangthai_thanhtoan } = req.body;

    if (!trangthai_thanhtoan) {
      return res
        .status(400)
        .json(formatErrorResponse('Trạng thái thanh toán không được để trống'));
    }

    // Validate trạng thái
    const validStatuses = ['Chua thanh toan', 'Da thanh toan', 'Da huy'];
    if (!validStatuses.includes(trangthai_thanhtoan)) {
      return res
        .status(400)
        .json(formatErrorResponse('Trạng thái thanh toán không hợp lệ'));
    }

    const invoice = await Invoice.updatePaymentStatus(id, trangthai_thanhtoan);

    if (!invoice) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy hóa đơn'));
    }

    res.json(
      formatResponse(true, invoice, 'Cập nhật trạng thái thanh toán thành công')
    );
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Cập nhật hóa đơn
const updateInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    const { giamgia, phiphuthu, trangthai_thanhtoan } = req.body;

    // Validate dữ liệu
    if (giamgia && (isNaN(giamgia) || giamgia < 0)) {
      return res.status(400).json(formatErrorResponse('Giảm giá không hợp lệ'));
    }

    if (phiphuthu && (isNaN(phiphuthu) || phiphuthu < 0)) {
      return res
        .status(400)
        .json(formatErrorResponse('Phí phụ thu không hợp lệ'));
    }

    const invoiceData = {
      giamgia: giamgia || null,
      phiphuthu: phiphuthu || null,
      trangthai_thanhtoan: trangthai_thanhtoan || 'Chua thanh toan',
    };

    const invoice = await Invoice.updateInvoice(id, invoiceData);

    if (!invoice) {
      return res
        .status(404)
        .json(formatErrorResponse('Không tìm thấy hóa đơn'));
    }

    res.json(formatResponse(true, invoice, 'Cập nhật hóa đơn thành công'));
  } catch (error) {
    console.error('Update invoice error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

// Lấy thống kê hóa đơn
const getInvoiceStats = async (req, res) => {
  try {
    const stats = await Invoice.getInvoiceStats();

    res.json(formatResponse(true, stats, 'Lấy thống kê hóa đơn thành công'));
  } catch (error) {
    console.error('Get invoice stats error:', error);
    res.status(500).json(formatErrorResponse('Lỗi server'));
  }
};

module.exports = {
  getAllInvoices,
  getInvoiceById,
  updatePaymentStatus,
  updateInvoice,
  getInvoiceStats,
};
