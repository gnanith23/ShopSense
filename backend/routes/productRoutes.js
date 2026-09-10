// ==================== IMPORT EXPRESS ====================

const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

const {
    createProduct,
    getMyProducts,
    getProductById,
    updateProduct,
    deleteProduct,
    getMarketplaceProducts
} = require("../controllers/productController");


// ==================== IMPORT AUTH MIDDLEWARE ====================

const {
    protectVendor
} = require("../middleware/authMiddleware");


// ==================== CREATE ROUTER ====================

const router = express.Router();


// ================================================================
// ==================== MARKETPLACE PRODUCTS =======================
// ================================================================

// GET /api/products/marketplace
// Public/Customer marketplace product search and comparable vendor offers
router.get(
    "/marketplace",
    getMarketplaceProducts
);


// ================================================================
// ==================== CREATE PRODUCT =============================
// ================================================================

router.post(
    "/",
    protectVendor,
    createProduct
);


// ================================================================
// ==================== GET MY PRODUCTS ============================
// ================================================================

// IMPORTANT:
// This route MUST appear before "/:id"
router.get(
    "/my-products",
    protectVendor,
    getMyProducts
);


// ================================================================
// ==================== GET SINGLE PRODUCT =========================
// ================================================================

// Keep dynamic ID routes AFTER specific routes
router.get(
    "/:id",
    protectVendor,
    getProductById
);


// ================================================================
// ==================== UPDATE PRODUCT =============================
// ================================================================

router.put(
    "/:id",
    protectVendor,
    updateProduct
);


// ================================================================
// ==================== DELETE PRODUCT =============================
// ================================================================

router.delete(
    "/:id",
    protectVendor,
    deleteProduct
);


// ==================== EXPORT ROUTER ====================

module.exports = router;