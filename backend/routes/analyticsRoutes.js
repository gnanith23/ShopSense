// ==================== IMPORT EXPRESS ====================

const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

const {
    getCustomerSegments,
    getValidation,
    getSalesTrend,
    getRevenueByCategory,
    getProductPerformance,
    getMarketplaceBenchmark,
    exportSalesCSV,
    runAiDataAnalyst
} = require("../controllers/analyticsController");


// ==================== IMPORT AUTH MIDDLEWARE ====================

// All analytics endpoints are vendor-scoped and require a valid JWT.
const { protectVendor } = require("../middleware/authMiddleware");


// ==================== CREATE ROUTER ====================

const router = express.Router();


// ================================================================
// ==================== ANALYTICS ROUTES ===========================
// ================================================================


// ==================== CUSTOMER SEGMENTATION ====================

// GET /api/analytics/customer-segments
router.get(
    "/customer-segments",
    protectVendor,
    getCustomerSegments
);


// ==================== HISTORICAL DATA VALIDATION ===============

// GET /api/analytics/validation
router.get(
    "/validation",
    protectVendor,
    getValidation
);


// ==================== MILESTONE 3: ADVANCED ANALYTICS APIS ======

// GET /api/analytics/sales-trend
router.get(
    "/sales-trend",
    protectVendor,
    getSalesTrend
);

// GET /api/analytics/revenue-by-category
router.get(
    "/revenue-by-category",
    protectVendor,
    getRevenueByCategory
);

// GET /api/analytics/product-performance
router.get(
    "/product-performance",
    protectVendor,
    getProductPerformance
);


// ==================== MILESTONE 3: MARKETPLACE BENCHMARK ========

// GET /api/analytics/benchmark
router.get(
    "/benchmark",
    protectVendor,
    getMarketplaceBenchmark
);


// ==================== MILESTONE 3: CSV EXPORT ===================

// GET /api/analytics/export/csv
router.get(
    "/export/csv",
    protectVendor,
    exportSalesCSV
);


// ==================== MILESTONE 3: AI DATA ANALYST ==============

// POST /api/analytics/ai-analyst
router.post(
    "/ai-analyst",
    protectVendor,
    runAiDataAnalyst
);


// ==================== EXPORT ROUTER ====================

module.exports = router;


