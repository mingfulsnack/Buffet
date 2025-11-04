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

module.exports = {
  createInvoicePdf,
  createTableReportPdf,
  buildInvoiceData, // Export for testing
  buildTableReportData, // Export for testing
};
