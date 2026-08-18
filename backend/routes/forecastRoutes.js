// ==================== IMPORT EXPRESS ====================

const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

const {
    getProductForecast,
    getVendorForecasts
} = require("../controllers/forecastController");


// ==================== IMPORT AUTH MIDDLEWARE ====================

// All forecast endpoints are vendor-scoped and require JWT auth.
const { protectVendor } = require("../middleware/authMiddleware");


// ==================== CREATE ROUTER ====================

const router = express.Router();


// ================================================================
// ==================== FORECAST ROUTES ============================
// ================================================================

// GET /api/forecast/products
// GET /api/forecast/products?horizon=7&limit=20
//
// Returns demand forecasts for all products owned by the vendor.
router.get(
    "/products",
    protectVendor,
    getVendorForecasts
);


// GET /api/forecast/product/:productId
// GET /api/forecast/product/:productId?horizon=7
//
// Returns demand forecast for a single product.
router.get(
    "/product/:productId",
    protectVendor,
    getProductForecast
);


// GET /api/forecast
// GET /api/forecast?horizon=7
//
// Alias route for vendor products forecast summary.
router.get(
    "/",
    protectVendor,
    getVendorForecasts
);


// ==================== EXPORT ROUTER ====================

module.exports = router;
