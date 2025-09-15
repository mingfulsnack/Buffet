/**
 * Response formatter utility functions
 * Chuẩn hóa format response cho API
 */

/**
 * Format successful response
 * @param {boolean} success - Success status
 * @param {any} data - Response data
 * @param {string} message - Success message
 * @returns {object} Formatted response
 */
const formatResponse = (success = true, data = null, message = 'Success') => {
  return {
    success,
    data,
    message,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {any} error - Error details
 * @param {number} code - Error code
 * @returns {object} Formatted error response
 */
const formatErrorResponse = (
  message = 'Error occurred',
  error = null,
  code = 500
) => {
  return {
    success: false,
    data: null,
    message,
    error: error ? (typeof error === 'string' ? error : error.message) : null,
    code,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Format validation error response
 * @param {array} errors - Array of validation errors
 * @param {string} message - Main error message
 * @returns {object} Formatted validation error response
 */
const formatValidationErrorResponse = (
  errors = [],
  message = 'Validation failed'
) => {
  return {
    success: false,
    data: null,
    message,
    errors,
    code: 400,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Format paginated response
 * @param {boolean} success - Success status
 * @param {array} data - Array of data items
 * @param {string} message - Success message
 * @param {object} pagination - Pagination info
 * @returns {object} Formatted paginated response
 */
const formatPaginatedResponse = (
  success = true,
  data = [],
  message = 'Success',
  pagination = {}
) => {
  return {
    success,
    data,
    message,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 10,
      total: pagination.total || data.length,
      totalPages:
        pagination.totalPages ||
        Math.ceil((pagination.total || data.length) / (pagination.limit || 10)),
    },
    timestamp: new Date().toISOString(),
  };
};

module.exports = {
  formatResponse,
  formatErrorResponse,
  formatValidationErrorResponse,
  formatPaginatedResponse,
};
