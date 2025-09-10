const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const moment = require('moment');

// Hash password
const hashPassword = async (password) => {
  const saltRounds = 12;
  return await bcrypt.hash(password, saltRounds);
};

// Verify password
const verifyPassword = async (password, hashedPassword) => {
  return await bcrypt.compare(password, hashedPassword);
};

// Generate JWT token
const generateToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Format date for database
const formatDateForDB = (date) => {
  return moment(date).format('YYYY-MM-DD HH:mm:ss');
};

// Check if time is in range
const isTimeInRange = (time, startTime, endTime) => {
  const current = moment(time, 'HH:mm');
  const start = moment(startTime, 'HH:mm');
  const end = moment(endTime, 'HH:mm');
  
  return current.isBetween(start, end, null, '[]');
};

// Generate booking token
const generateBookingToken = () => {
  return require('uuid').v4();
};

// Calculate discount amount
const calculateDiscount = (total, promotion) => {
  if (!promotion || !promotion.is_active) return 0;
  
  switch (promotion.loai_km) {
    case 'percentage':
      return Math.min(total * (promotion.giatri / 100), promotion.max_discount || total);
    case 'fixed':
      return Math.min(promotion.giatri, total);
    default:
      return 0;
  }
};

// Validate phone number format
const isValidPhoneNumber = (phone) => {
  const phoneRegex = /^[0-9]{10,11}$/;
  return phoneRegex.test(phone);
};

// Validate email format
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// Generate random string
const generateRandomString = (length = 8) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// Pagination helper
const getPaginationOffset = (page, limit) => {
  const currentPage = Math.max(1, parseInt(page) || 1);
  const currentLimit = Math.max(1, Math.min(100, parseInt(limit) || 10));
  const offset = (currentPage - 1) * currentLimit;
  
  return { offset, limit: currentLimit, page: currentPage };
};

// Response formatter
const formatResponse = (success, data = null, message = '', meta = null) => {
  const response = { success, message };
  
  if (data !== null) {
    response.data = data;
  }
  
  if (meta) {
    response.meta = meta;
  }
  
  return response;
};

// Error response formatter
const formatErrorResponse = (message, details = null) => {
  const response = { success: false, message };
  
  if (details) {
    response.details = details;
  }
  
  return response;
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateToken,
  formatDateForDB,
  isTimeInRange,
  generateBookingToken,
  calculateDiscount,
  isValidPhoneNumber,
  isValidEmail,
  generateRandomString,
  getPaginationOffset,
  formatResponse,
  formatErrorResponse
};
