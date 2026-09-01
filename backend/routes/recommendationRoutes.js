// ==================== IMPORT EXPRESS ====================

const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

const {
    getCategoryRecommendations,
    getAvailableCategories,
    getVectorRecommendations
} = require("../controllers/recommendationController");


// ==================== IMPORT AUTH MIDDLEWARE ====================

// All recommendation endpoints are vendor-scoped.
const { protectVendor } = require("../middleware/authMiddleware");


// ==================== CREATE ROUTER ====================

const router = express.Router();


// ================================================================
// ==================== RECOMMENDATION ROUTES ======================
// ================================================================

// IMPORTANT:
// Specific routes (e.g. /vector, /categories) must appear BEFORE dynamic
// routes (e.g. /category/:category) to avoid incorrect routing.


// ==================== VECTOR SEARCH RECOMMENDATIONS =============

// GET /api/recommendations/vector
// GET /api/recommendations/vector?customerId=...&limit=5
//
// Advanced AI/Semantic recommendations powered by 768-dimensional product &
// user purchase behavior embeddings with cosine similarity.
router.get(
    "/vector",
    protectVendor,
    getVectorRecommendations
);


// ==================== LIST AVAILABLE CATEGORIES ================

// GET /api/recommendations/categories
//
// Returns all distinct product categories for this vendor.
// Helper endpoint for frontend category pickers.
router.get(
    "/categories",
    protectVendor,
    getAvailableCategories
);


// ==================== CATEGORY RECOMMENDATIONS ================

// GET /api/recommendations/category/:category
// GET /api/recommendations/category/:category?limit=5
//
// Returns rule-based top-selling product recommendations
// for the specified category based on historical sales data.
//
// NOTE: This is NOT machine learning. This is NOT AI.
// This is a pure rule-based ranking on historical units sold.
router.get(
    "/category/:category",
    protectVendor,
    getCategoryRecommendations
);


// ==================== EXPORT ROUTER ====================

module.exports = router;
