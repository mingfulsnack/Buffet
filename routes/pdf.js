const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const invoicePdfController = require('../controllers/invoicePdfController');

// Create invoice PDF - requires authentication
router.get(
  '/invoice/:id',
  authenticateToken,
  invoicePdfController.createInvoicePdf
);

// Create table performance report PDF - requires authentication
router.get(
  '/table-performance',
  authenticateToken,
  invoicePdfController.createTableReportPdf
);

module.exports = router;
