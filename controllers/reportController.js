const Report = require('../models/Report');
const {
  formatResponse,
  formatErrorResponse,
} = require('../utils/responseFormatter');

// Get revenue by date
const getRevenueByDate = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('Please provide start date and end date'));
    }

    const data = await Report.getRevenueByDate(startDate, endDate);
    res.json(formatResponse(true, data, 'Get daily revenue successfully'));
  } catch (error) {
    console.error('Get revenue by date error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// Get revenue by month
const getRevenueByMonth = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json(formatErrorResponse('Please provide year'));
    }

    const data = await Report.getRevenueByMonth(parseInt(year));
    res.json(formatResponse(true, data, 'Get monthly revenue successfully'));
  } catch (error) {
    console.error('Get revenue by month error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// Get revenue by year
const getRevenueByYear = async (req, res) => {
  try {
    const { startYear, endYear } = req.query;

    if (!startYear || !endYear) {
      return res
        .status(400)
        .json(formatErrorResponse('Please provide start year and end year'));
    }

    const data = await Report.getRevenueByYear(
      parseInt(startYear),
      parseInt(endYear)
    );
    res.json(formatResponse(true, data, 'Get yearly revenue successfully'));
  } catch (error) {
    console.error('Get revenue by year error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// Get overall stats
const getOverallStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('Please provide start date and end date'));
    }

    const data = await Report.getOverallStats(startDate, endDate);
    res.json(formatResponse(true, data, 'Get overall stats successfully'));
  } catch (error) {
    console.error('Get overall stats error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// Get top revenue days
const getTopRevenueDays = async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('Please provide start date and end date'));
    }

    const data = await Report.getTopRevenueDays(
      startDate,
      endDate,
      parseInt(limit)
    );
    res.json(formatResponse(true, data, 'Get top revenue days successfully'));
  } catch (error) {
    console.error('Get top revenue days error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// Get payment status stats
const getPaymentStatusStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('Please provide start date and end date'));
    }

    const data = await Report.getPaymentStatusStats(startDate, endDate);
    res.json(
      formatResponse(true, data, 'Get payment status stats successfully')
    );
  } catch (error) {
    console.error('Get payment status stats error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// Get table performance report data
const getTablePerformanceReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('Please provide start date and end date'));
    }

    const Booking = require('../models/Booking');
    const data = await Booking.getTablePerformanceReport(startDate, endDate);

    res.json(
      formatResponse(true, data, 'Get table performance report successfully')
    );
  } catch (error) {
    console.error('Get table performance report error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// I. Get daily revenue comprehensive report
const getDailyRevenueComprehensive = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('Please provide start date and end date'));
    }

    const data = await Report.getDailyRevenueComprehensive(startDate, endDate);
    res.json(
      formatResponse(
        true,
        data,
        'Get daily revenue comprehensive report successfully'
      )
    );
  } catch (error) {
    console.error('Get daily revenue comprehensive error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// II. Get monthly revenue with invoices
const getMonthlyRevenueWithInvoices = async (req, res) => {
  try {
    const { year } = req.query;

    if (!year) {
      return res.status(400).json(formatErrorResponse('Please provide year'));
    }

    const data = await Report.getMonthlyRevenueWithInvoices(parseInt(year));
    res.json(
      formatResponse(
        true,
        data,
        'Get monthly revenue with invoices successfully'
      )
    );
  } catch (error) {
    console.error('Get monthly revenue with invoices error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// III. Get revenue by dish
const getRevenueByDish = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('Please provide start date and end date'));
    }

    const data = await Report.getRevenueByDish(startDate, endDate);
    res.json(
      formatResponse(true, data, 'Get revenue by dish report successfully')
    );
  } catch (error) {
    console.error('Get revenue by dish error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// IV. Get revenue by buffet set
const getRevenueByBuffetSet = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('Please provide start date and end date'));
    }

    const data = await Report.getRevenueByBuffetSet(startDate, endDate);
    res.json(
      formatResponse(
        true,
        data,
        'Get revenue by buffet set report successfully'
      )
    );
  } catch (error) {
    console.error('Get revenue by buffet set error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

// V. Get booking report
const getBookingReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res
        .status(400)
        .json(formatErrorResponse('Please provide start date and end date'));
    }

    const data = await Report.getBookingReport(startDate, endDate);
    res.json(formatResponse(true, data, 'Get booking report successfully'));
  } catch (error) {
    console.error('Get booking report error:', error);
    res.status(500).json(formatErrorResponse('Server error'));
  }
};

module.exports = {
  getRevenueByDate,
  getRevenueByMonth,
  getRevenueByYear,
  getOverallStats,
  getTopRevenueDays,
  getPaymentStatusStats,
  getTablePerformanceReport,
  getDailyRevenueComprehensive,
  getMonthlyRevenueWithInvoices,
  getRevenueByDish,
  getRevenueByBuffetSet,
  getBookingReport,
};
