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

// Create monthly revenue report PDF - requires authentication
router.get(
  '/monthly-revenue',
  authenticateToken,
  invoicePdfController.createMonthlyRevenueReportPdf
);

// I. Create daily revenue comprehensive report PDF
router.get(
  '/daily-revenue-comprehensive',
  authenticateToken,
  invoicePdfController.createDailyRevenueComprehensivePdf
);

// II. Create monthly revenue with invoices report PDF
router.get(
  '/monthly-revenue-invoices',
  authenticateToken,
  invoicePdfController.createMonthlyRevenueWithInvoicesPdf
);

// III. Create revenue by dish report PDF
router.get(
  '/revenue-by-dish',
  authenticateToken,
  invoicePdfController.createRevenueByDishPdf
);

// IV. Create revenue by buffet set report PDF
router.get(
  '/revenue-by-buffet-set',
  authenticateToken,
  invoicePdfController.createRevenueByBuffetSetPdf
);

// V. Create booking report PDF
router.get(
  '/booking-report',
  authenticateToken,
  invoicePdfController.createBookingReportPdf
);

// Create order print PDF (no prices)
router.get(
  '/order/:id',
  authenticateToken,
  invoicePdfController.createOrderPdf
);

module.exports = router;
