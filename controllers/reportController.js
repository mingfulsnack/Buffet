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

module.exports = {
  getRevenueByDate,
  getRevenueByMonth,
  getRevenueByYear,
  getOverallStats,
  getTopRevenueDays,
  getPaymentStatusStats,
};
