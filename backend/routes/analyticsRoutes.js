// ==================== IMPORT EXPRESS ====================

const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

const {
    getCustomerSegments,
    getValidation
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
//
// Returns customers grouped by spending tier (VIP, HIGH_VALUE,
// REGULAR, LOW_VALUE) based on COMPLETED transaction history
// for the authenticated vendor.
router.get(
    "/customer-segments",
    protectVendor,
    getCustomerSegments
);


// ==================== HISTORICAL DATA VALIDATION ===============

// GET /api/analytics/validation
//
// Validates inventory, customer segmentation, and recommendation
// outputs against raw historical MongoDB data.
router.get(
    "/validation",
    protectVendor,
    getValidation
);


// ==================== EXPORT ROUTER ====================

module.exports = router;
