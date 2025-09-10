const { Booking, Table, Customer, Menu } = require('../models');
const { formatResponse, formatErrorResponse } = require('../utils/helpers');
const moment = require('moment');

// Báo cáo tổng quan dashboard
const getDashboardStats = async (req, res) => {
  try {
    const today = moment().format('YYYY-MM-DD');

    // Thống kê hôm nay
    const todayStats = await Booking.getDailyStats(today);

    // Sử dụng model methods để lấy stats
    const monthStats = await Booking.getMonthlyStats();
    const tableStats = await Table.getCurrentStatus();
    const topCustomers = await Customer.getTopCustomers();
    const revenueChart = await Booking.getRevenueChart(7);

    const dashboardData = {
      hom_nay: todayStats,
      thang_nay: monthStats,
      tinh_trang_ban: tableStats,
      top_khach_hang: topCustomers,
      bieu_do_doanh_thu: revenueChart
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


    const result = await Booking.getRevenueReport(tu_ngay, den_ngay, group_by);

    res.json(formatResponse(
      true, 
      result, 
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

    const usageReport = await Table.getUsageReport(tu_ngay, den_ngay);

    res.json(formatResponse(
      true, 
      usageReport, 
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

    const customerReport = await Customer.getCustomerReport(tu_ngay, den_ngay, sap_xep);

    res.json(formatResponse(
      true, 
      customerReport, 
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

    const popularDishesReport = await Menu.getPopularDishes(tu_ngay, den_ngay);

    res.json(formatResponse(
      true, 
      popularDishesReport, 
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
