// ==================== IMPORT EXPRESS ====================

const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

const {
    getInventory,
    getLowStock,
    getOutOfStock,
    getInventorySummary
} = require("../controllers/inventoryController");


// ==================== IMPORT AUTH MIDDLEWARE ====================

// Reuse existing vendor authentication middleware.
// Every inventory endpoint is vendor-scoped.
const { protectVendor } = require("../middleware/authMiddleware");


// ==================== CREATE ROUTER ====================

const router = express.Router();


// ================================================================
// ==================== INVENTORY ROUTES ===========================
// ================================================================

// IMPORTANT: Specific routes (e.g. /low-stock) must be placed
// BEFORE the generic route (/) to prevent mis-routing.


// ==================== INVENTORY SUMMARY ========================

// GET /api/inventory/summary
//
// Returns aggregate metrics:
//   totalProducts, totalStockUnits, lowStockCount,
//   outOfStockCount, healthyCount
router.get(
    "/summary",
    protectVendor,
    getInventorySummary
);


// ==================== LOW-STOCK PRODUCTS =======================

// GET /api/inventory/low-stock
//
// Returns vendor's products with stock between 1 and 5 (inclusive).
router.get(
    "/low-stock",
    protectVendor,
    getLowStock
);


// ==================== OUT-OF-STOCK PRODUCTS ====================

// GET /api/inventory/out-of-stock
//
// Returns vendor's products with stock === 0.
router.get(
    "/out-of-stock",
    protectVendor,
    getOutOfStock
);


// ==================== ALL INVENTORY ============================

// GET /api/inventory
//
// Returns all of the authenticated vendor's products with
// stock status annotations (HEALTHY / LOW_STOCK / OUT_OF_STOCK).
router.get(
    "/",
    protectVendor,
    getInventory
);


// ==================== EXPORT ROUTER ====================

module.exports = router;
