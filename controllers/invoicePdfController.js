const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const handlebars = require('handlebars');
const { formatResponse, formatErrorResponse } = require('../utils/helpers');
const Booking = require('../models/Booking');
const Menu = require('../models/Menu');

// Helper to render template with data
const renderTemplate = (templatePath, data) => {
  // Register handlebars helpers
  handlebars.registerHelper('gt', function (a, b) {
    return a > b;
  });

  handlebars.registerHelper('gte', function (a, b) {
    return a >= b;
  });

  const tpl = fs.readFileSync(templatePath, 'utf8');
  const compiled = handlebars.compile(tpl);
  return compiled(data);
};

// Build invoice data from invoice id (mahd)
const buildInvoiceData = async (mahd) => {
  try {
    // Booking model is exported as an instance (see models/Booking.js)
    const bookingModel = Booking;

    // Get invoice details
    const invoice = await bookingModel.getInvoiceData(mahd);
    if (!invoice) {
      throw new Error('Không tìm thấy hóa đơn');
    }

    // Get invoice menu items
    const menuItems = await bookingModel.getInvoiceMenuItems(mahd);

    const items = [];
    let itemIndex = 1;
    let subtotal = 0;

    // Add menu items
    menuItems.forEach((item) => {
      const quantity = parseInt(item.soluong) || 1;
      const price = parseFloat(item.dongia) || 0;
      const amount = parseFloat(item.thanhtien) || quantity * price;

      items.push({
        index: itemIndex++,
        ten_mon: item.tenmon || item.tenset || 'Món ăn',
        quantity: quantity.toString(),
        don_gia: price.toLocaleString('vi-VN') + '₫',
        amount: amount.toLocaleString('vi-VN') + '₫',
        rawAmount: amount,
      });

      subtotal += amount;
    });

    // Format invoice date
    const invoiceDate = invoice.ngaylap
      ? new Date(invoice.ngaylap).toLocaleDateString('vi-VN')
      : '';

    // Use subtotal from invoice.tongtien if available, otherwise calculate from items
    const finalSubtotal = parseFloat(invoice.tongtien) || subtotal;
    const discount = parseFloat(invoice.giamgia) || 0;
    const extraFee = parseFloat(invoice.phiphuthu) || 0;
    const total = finalSubtotal - discount + extraFee;

    const data = {
      invoiceNumber: `HD${invoice.mahd}`,
      mahd: invoice.mahd,
      madon: invoice.madon,
      ngay_lap: invoiceDate,
      guest_hoten: 'Khách hàng', // Will need customer info if available
      guest_sodienthoai: '', // Will need customer info if available
      so_ban: '', // Will need table info if available
      so_nguoi: 1, // Will need guest count if available
      items,
      subtotal: finalSubtotal.toLocaleString('vi-VN') + '₫',
      discount: discount.toLocaleString('vi-VN') + '₫',
      extraFee: extraFee.toLocaleString('vi-VN') + '₫',
      total: total.toLocaleString('vi-VN') + '₫',
      trangthai_thanhtoan: invoice.trangthai_thanhtoan,
      rawSubtotal: finalSubtotal,
      rawDiscount: discount,
      rawExtraFee: extraFee,
      rawTotal: total,
    };

    return data;
  } catch (error) {
    console.error('Error building invoice data:', error);
    throw error;
  }
};

// Build table performance report data
const buildTableReportData = async (startDate, endDate) => {
  try {
    // Booking model is exported as an instance (see models/Booking.js)
    const bookingModel = Booking;

    // Get table performance data
    const tables = await bookingModel.getTablePerformanceReport(
      startDate,
      endDate
    );

    const items = [];
    let itemIndex = 1;
    let totalBookings = 0;
    let totalRevenue = 0;

    tables.forEach((table) => {
      const bookingCount = parseInt(table.so_luot_phuc_vu) || 0;
      const revenue = parseFloat(table.doanh_thu) || 0;

      items.push({
        index: itemIndex++,
        ma_ban: table.maban || '',
        vung: table.ten_khu_vuc || 'Không xác định',
        so_luot_phuc_vu: bookingCount.toString(),
        so_ghe: table.soghe || 0,
        doanh_thu: revenue.toLocaleString('vi-VN') + '₫',
      });

      totalBookings += bookingCount;
      totalRevenue += revenue;
    });

    const data = {
      title: 'BÁO CÁO HIỆU SUẤT BÀN',
      startDate: new Date(startDate).toLocaleDateString('vi-VN'),
      endDate: new Date(endDate).toLocaleDateString('vi-VN'),
      items,
      totalBookings: totalBookings.toString(),
      totalRevenue: totalRevenue.toLocaleString('vi-VN') + '₫',
    };

    return data;
  } catch (error) {
    console.error('Error building table report data:', error);
    throw error;
  }
};

// Build monthly revenue report data
const buildMonthlyRevenueReportData = async (year) => {
  try {
    const Report = require('../models/Report');

    // Get monthly revenue data
    const monthlyData = await Report.getRevenueByMonth(parseInt(year));

    const items = [];
    let totalRevenue = 0;
    const monthlyDataMap = {};

    // Map dữ liệu thực tế
    monthlyData.forEach((item) => {
      monthlyDataMap[item.month] = parseFloat(item.total_revenue) || 0;
    });

    // Tạo đầy đủ 12 tháng
    for (let month = 1; month <= 12; month++) {
      const revenue = monthlyDataMap[month] || 0;
      items.push({
        index: month,
        month_name: `Tháng ${month}`,
        revenue: revenue.toLocaleString('vi-VN') + '₫',
      });
      totalRevenue += revenue;
    }

    const data = {
      title: 'BÁO CÁO DOANH THU THÁNG',
      year: year,
      items,
      totalRevenue: totalRevenue.toLocaleString('vi-VN') + '₫',
    };

    return data;
  } catch (error) {
    console.error('Error building monthly revenue report data:', error);
    throw error;
  }
};

// Generate PDF using Puppeteer
const generatePdfFromHtml = async (html) => {
  let browser;
  try {
    console.log('Starting PDF generation...');
    browser = await puppeteer.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-web-security',
      ],
      headless: true,
      timeout: 30000,
    });

    console.log('Browser launched successfully');
    const page = await browser.newPage();

    await page.setViewport({ width: 1200, height: 800 });

    console.log('Setting page content...');
    await page.setContent(html, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    console.log('Waiting for rendering to complete...');
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log('Content set, generating PDF...');
    const pdfBuffer = await page.pdf({
      printBackground: true,
      margin: {
        top: '12mm',
        right: '12mm',
        bottom: '12mm',
        left: '12mm',
      },
      preferCSSPageSize: true,
      scale: 1,
      timeout: 30000,
    });

    if (!pdfBuffer || pdfBuffer.length < 100) {
      throw new Error('Generated PDF buffer is too small or empty');
    }

    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error(`PDF generation failed: ${error.message}`);
  } finally {
    if (browser) {
      console.log('Closing browser...');
      try {
        await browser.close();
      } catch (closeError) {
        console.error('Error closing browser:', closeError);
      }
    }
  }
};

// Create invoice PDF
const createInvoicePdf = async (req, res) => {
  try {
    const mahdStr = req.params.id || req.query.mahd || req.query.id;
    if (!mahdStr) {
      return res
        .status(400)
        .json(formatErrorResponse('mahd (Invoice ID) is required'));
    }

    // Convert mahd to integer since DB expects integer
    const mahd = parseInt(mahdStr);
    if (isNaN(mahd)) {
      return res
        .status(400)
        .json(formatErrorResponse('mahd must be a valid number'));
    }

    const data = await buildInvoiceData(mahd);

    const templatePath = path.join(
      __dirname,
      '..',
      'template',
      'buffet_invoice.hbs'
    );
    const html = renderTemplate(templatePath, data);
    const pdfBuffer = await generatePdfFromHtml(html);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Failed to generate PDF - empty buffer');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Invoice_${data.invoiceNumber}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Create invoice error:', error);
    res
      .status(500)
      .json(formatErrorResponse(error.message || 'Lỗi khi tạo hóa đơn'));
  }
};

// Create table performance report PDF
const createTableReportPdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('startDate and endDate are required'));
    }

    const data = await buildTableReportData(startDate, endDate);

    const templatePath = path.join(
      __dirname,
      '..',
      'template',
      'table_performance_report.hbs'
    );
    const html = renderTemplate(templatePath, data);
    const pdfBuffer = await generatePdfFromHtml(html);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Failed to generate PDF - empty buffer');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Table_Performance_Report_${startDate}_${endDate}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Create table report error:', error);
    res
      .status(500)
      .json(formatErrorResponse(error.message || 'Lỗi khi tạo báo cáo'));
  }
};

// Create monthly revenue report PDF
const createMonthlyRevenueReportPdf = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json(formatErrorResponse('year is required'));
    }

    const data = await buildMonthlyRevenueReportData(year);

    const templatePath = path.join(
      __dirname,
      '..',
      'template',
      'monthly_revenue_report.hbs'
    );
    const html = renderTemplate(templatePath, data);
    const pdfBuffer = await generatePdfFromHtml(html);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Failed to generate PDF - empty buffer');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Monthly_Revenue_Report_${year}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Create monthly revenue report error:', error);
    res
      .status(500)
      .json(formatErrorResponse(error.message || 'Lỗi khi tạo báo cáo'));
  }
};

// I. Build daily revenue comprehensive report data
const buildDailyRevenueComprehensiveData = async (startDate, endDate) => {
  try {
    const Report = require('../models/Report');
    const dailyData = await Report.getDailyRevenueComprehensive(
      startDate,
      endDate
    );

    const items = [];
    let totalRevenue = 0;
    let totalInvoices = 0;
    let totalOrders = 0;

    dailyData.forEach((item, index) => {
      const revenue = parseFloat(item.total_revenue) || 0;
      const invoices = parseInt(item.invoice_count) || 0;
      const orders = parseInt(item.order_count) || 0;

      items.push({
        index: index + 1,
        date: new Date(item.date).toLocaleDateString('vi-VN'),
        invoice_count: invoices,
        order_count: orders,
        revenue: revenue.toLocaleString('vi-VN') + '₫',
      });

      totalRevenue += revenue;
      totalInvoices += invoices;
      totalOrders += orders;
    });

    return {
      title: 'BÁO CÁO DOANH THU TỔNG HỢP THEO NGÀY',
      startDate: new Date(startDate).toLocaleDateString('vi-VN'),
      endDate: new Date(endDate).toLocaleDateString('vi-VN'),
      items,
      totalRevenue: totalRevenue.toLocaleString('vi-VN') + '₫',
      totalInvoices,
      totalOrders,
    };
  } catch (error) {
    console.error('Error building daily revenue comprehensive data:', error);
    throw error;
  }
};

// II. Build monthly revenue with invoices report data
const buildMonthlyRevenueWithInvoicesData = async (year) => {
  try {
    const Report = require('../models/Report');
    const monthlyData = await Report.getMonthlyRevenueWithInvoices(
      parseInt(year)
    );

    const items = [];
    let totalRevenue = 0;
    let totalInvoices = 0;
    const monthlyDataMap = {};

    monthlyData.forEach((item) => {
      monthlyDataMap[item.month] = {
        revenue: parseFloat(item.total_revenue) || 0,
        invoices: parseInt(item.invoice_count) || 0,
      };
    });

    for (let month = 1; month <= 12; month++) {
      const data = monthlyDataMap[month] || { revenue: 0, invoices: 0 };
      items.push({
        index: month,
        month_name: `Tháng ${month}`,
        invoice_count: data.invoices,
        revenue: data.revenue.toLocaleString('vi-VN') + '₫',
      });
      totalRevenue += data.revenue;
      totalInvoices += data.invoices;
    }

    return {
      title: 'BÁO CÁO DOANH THU THEO THÁNG',
      year: year,
      items,
      totalRevenue: totalRevenue.toLocaleString('vi-VN') + '₫',
      totalInvoices,
    };
  } catch (error) {
    console.error('Error building monthly revenue with invoices data:', error);
    throw error;
  }
};

// III. Build revenue by dish report data
const buildRevenueByDishData = async (startDate, endDate) => {
  try {
    const Report = require('../models/Report');
    const dishData = await Report.getRevenueByDish(startDate, endDate);

    const items = [];
    let totalRevenue = 0;
    let totalQuantity = 0;

    dishData.forEach((item, index) => {
      const revenue = parseFloat(item.total_revenue) || 0;
      const quantity = parseInt(item.total_quantity) || 0;

      items.push({
        index: index + 1,
        tenmon: item.tenmon || '',
        tendanhmuc: item.tendanhmuc || 'Không xác định',
        total_quantity: quantity,
        revenue: revenue.toLocaleString('vi-VN') + '₫',
      });

      totalRevenue += revenue;
      totalQuantity += quantity;
    });

    return {
      title: 'BÁO CÁO DOANH THU THEO MÓN ĂN',
      startDate: new Date(startDate).toLocaleDateString('vi-VN'),
      endDate: new Date(endDate).toLocaleDateString('vi-VN'),
      items,
      totalRevenue: totalRevenue.toLocaleString('vi-VN') + '₫',
      totalQuantity,
    };
  } catch (error) {
    console.error('Error building revenue by dish data:', error);
    throw error;
  }
};

// IV. Build revenue by buffet set report data
const buildRevenueByBuffetSetData = async (startDate, endDate) => {
  try {
    const Report = require('../models/Report');
    const setData = await Report.getRevenueByBuffetSet(startDate, endDate);

    const items = [];
    let totalRevenue = 0;
    let totalQuantity = 0;

    setData.forEach((item, index) => {
      const revenue = parseFloat(item.total_revenue) || 0;
      const quantity = parseInt(item.total_quantity) || 0;

      items.push({
        index: index + 1,
        tenset: item.tenset || '',
        tendanhmuc: item.tendanhmuc || 'Không xác định',
        total_quantity: quantity,
        revenue: revenue.toLocaleString('vi-VN') + '₫',
      });

      totalRevenue += revenue;
      totalQuantity += quantity;
    });

    return {
      title: 'BÁO CÁO DOANH THU THEO SET BUFFET',
      startDate: new Date(startDate).toLocaleDateString('vi-VN'),
      endDate: new Date(endDate).toLocaleDateString('vi-VN'),
      items,
      totalRevenue: totalRevenue.toLocaleString('vi-VN') + '₫',
      totalQuantity,
    };
  } catch (error) {
    console.error('Error building revenue by buffet set data:', error);
    throw error;
  }
};

// V. Build booking report data
const buildBookingReportData = async (startDate, endDate) => {
  try {
    const Report = require('../models/Report');
    const bookingData = await Report.getBookingReport(startDate, endDate);

    return {
      title: 'BÁO CÁO BOOKING BÀN (ĐẶT BÀN)',
      startDate: new Date(startDate).toLocaleDateString('vi-VN'),
      endDate: new Date(endDate).toLocaleDateString('vi-VN'),
      total_bookings: parseInt(bookingData.total_bookings) || 0,
      pending_bookings: parseInt(bookingData.pending_bookings) || 0,
      confirmed_bookings: parseInt(bookingData.confirmed_bookings) || 0,
      completed_bookings: parseInt(bookingData.completed_bookings) || 0,
      cancelled_bookings: parseInt(bookingData.cancelled_bookings) || 0,
      cancellation_rate: parseFloat(bookingData.cancellation_rate) || 0,
      online_bookings: parseInt(bookingData.online_bookings) || 0,
      offline_bookings: parseInt(bookingData.offline_bookings) || 0,
      avg_guests: parseFloat(bookingData.avg_guests)?.toFixed(1) || 0,
    };
  } catch (error) {
    console.error('Error building booking report data:', error);
    throw error;
  }
};

// Create daily revenue comprehensive report PDF
const createDailyRevenueComprehensivePdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('startDate and endDate are required'));
    }

    const data = await buildDailyRevenueComprehensiveData(startDate, endDate);

    const templatePath = path.join(
      __dirname,
      '..',
      'template',
      'daily_revenue_comprehensive.hbs'
    );
    const html = renderTemplate(templatePath, data);
    const pdfBuffer = await generatePdfFromHtml(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Daily_Revenue_Comprehensive_${startDate}_${endDate}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Create daily revenue comprehensive error:', error);
    res
      .status(500)
      .json(formatErrorResponse(error.message || 'Lỗi khi tạo báo cáo'));
  }
};

// Create monthly revenue with invoices report PDF
const createMonthlyRevenueWithInvoicesPdf = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json(formatErrorResponse('year is required'));
    }

    const data = await buildMonthlyRevenueWithInvoicesData(year);

    const templatePath = path.join(
      __dirname,
      '..',
      'template',
      'monthly_revenue_with_invoices.hbs'
    );
    const html = renderTemplate(templatePath, data);
    const pdfBuffer = await generatePdfFromHtml(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Monthly_Revenue_With_Invoices_${year}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Create monthly revenue with invoices error:', error);
    res
      .status(500)
      .json(formatErrorResponse(error.message || 'Lỗi khi tạo báo cáo'));
  }
};

// Create revenue by dish report PDF
const createRevenueByDishPdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('startDate and endDate are required'));
    }

    const data = await buildRevenueByDishData(startDate, endDate);

    const templatePath = path.join(
      __dirname,
      '..',
      'template',
      'revenue_by_dish.hbs'
    );
    const html = renderTemplate(templatePath, data);
    const pdfBuffer = await generatePdfFromHtml(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Revenue_By_Dish_${startDate}_${endDate}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Create revenue by dish error:', error);
    res
      .status(500)
      .json(formatErrorResponse(error.message || 'Lỗi khi tạo báo cáo'));
  }
};

// Create revenue by buffet set report PDF
const createRevenueByBuffetSetPdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('startDate and endDate are required'));
    }

    const data = await buildRevenueByBuffetSetData(startDate, endDate);

    const templatePath = path.join(
      __dirname,
      '..',
      'template',
      'revenue_by_buffet_set.hbs'
    );
    const html = renderTemplate(templatePath, data);
    const pdfBuffer = await generatePdfFromHtml(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Revenue_By_Buffet_Set_${startDate}_${endDate}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Create revenue by buffet set error:', error);
    res
      .status(500)
      .json(formatErrorResponse(error.message || 'Lỗi khi tạo báo cáo'));
  }
};

// Create booking report PDF
const createBookingReportPdf = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('startDate and endDate are required'));
    }

    const data = await buildBookingReportData(startDate, endDate);

    const templatePath = path.join(
      __dirname,
      '..',
      'template',
      'booking_report.hbs'
    );
    const html = renderTemplate(templatePath, data);
    const pdfBuffer = await generatePdfFromHtml(html);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Booking_Report_${startDate}_${endDate}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Create booking report error:', error);
    res
      .status(500)
      .json(formatErrorResponse(error.message || 'Lỗi khi tạo báo cáo'));
  }
};

// Build order data (no prices)
const buildOrderData = async (orderId) => {
  try {
    const BaseModel = require('../models/BaseModel');
    const baseModel = new BaseModel('donhang');

    // Get order details
    const orderQuery = `
      SELECT 
        dh.madon,
        dh.thoi_gian_tao,
        dh.ghichu,
        b.tenban,
        v.tenvung
      FROM donhang dh
      LEFT JOIN ban b ON dh.maban = b.maban
      LEFT JOIN vung v ON b.mavung = v.mavung
      WHERE dh.madon = $1
    `;

    const orderResult = await baseModel.query(orderQuery, [orderId]);
    if (orderResult.rows.length === 0) {
      throw new Error('Không tìm thấy đơn hàng');
    }

    const order = orderResult.rows[0];

    // Get order items
    const itemsQuery = `
      SELECT 
        dhct.soluong,
        COALESCE(m.tenmon, s.tenset) as tenmon
      FROM donhang_chitiet dhct
      LEFT JOIN monan m ON dhct.mamon = m.mamon
      LEFT JOIN setbuffet s ON dhct.maset = s.maset
      WHERE dhct.madon = $1
      ORDER BY dhct.id
    `;

    const itemsResult = await baseModel.query(itemsQuery, [orderId]);

    const items = [];
    let itemIndex = 1;

    itemsResult.rows.forEach((item) => {
      items.push({
        index: itemIndex++,
        ten_mon: item.tenmon || 'Món ăn',
        quantity: parseInt(item.soluong) || 1,
      });
    });

    const data = {
      orderNumber: `DH${order.madon}`,
      madon: order.madon,
      ngay_lap: order.thoi_gian_tao
        ? new Date(order.thoi_gian_tao).toLocaleDateString('vi-VN')
        : '',
      thoi_gian: order.thoi_gian_tao
        ? new Date(order.thoi_gian_tao).toLocaleTimeString('vi-VN')
        : '',
      so_ban: order.tenban || 'Chưa chọn bàn',
      khu_vuc: order.tenvung || '',
      ghichu: order.ghichu || '',
      items,
    };

    return data;
  } catch (error) {
    console.error('Error building order data:', error);
    throw error;
  }
};

// Create order PDF (no prices)
const createOrderPdf = async (req, res) => {
  try {
    const orderIdStr = req.params.id || req.query.madon || req.query.id;
    if (!orderIdStr) {
      return res
        .status(400)
        .json(formatErrorResponse('madon (Order ID) is required'));
    }

    const orderId = parseInt(orderIdStr);
    if (isNaN(orderId)) {
      return res
        .status(400)
        .json(formatErrorResponse('madon must be a valid number'));
    }

    const data = await buildOrderData(orderId);

    const templatePath = path.join(
      __dirname,
      '..',
      'template',
      'order_print.hbs'
    );
    const html = renderTemplate(templatePath, data);
    const pdfBuffer = await generatePdfFromHtml(html);

    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error('Failed to generate PDF - empty buffer');
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Length', pdfBuffer.length.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="Order_${data.orderNumber}.pdf"`
    );
    res.end(pdfBuffer);
  } catch (error) {
    console.error('Create order PDF error:', error);
    res
      .status(500)
      .json(formatErrorResponse(error.message || 'Lỗi khi tạo đơn hàng'));
  }
};

module.exports = {
  createInvoicePdf,
  createTableReportPdf,
  createMonthlyRevenueReportPdf,
  createDailyRevenueComprehensivePdf,
  createMonthlyRevenueWithInvoicesPdf,
  createRevenueByDishPdf,
  createRevenueByBuffetSetPdf,
  createBookingReportPdf,
  createOrderPdf,
  buildInvoiceData, // Export for testing
  buildTableReportData, // Export for testing
  buildMonthlyRevenueReportData, // Export for testing
};
