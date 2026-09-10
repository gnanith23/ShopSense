// ==================== IMPORT EXPRESS ====================

const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

const {
    createReview,
    getCustomerPurchases,
    analyzeReview,
    analyzeAllVendorReviews,
    getVendorReviews,
    getVendorSentimentSummary
} = require("../controllers/reviewController");


// ==================== IMPORT AUTH MIDDLEWARE ====================

const { protectVendor, optionalCustomerAuth } = require("../middleware/authMiddleware");


// ==================== CREATE ROUTER ====================

const router = express.Router();


// ================================================================
// ==================== REVIEW ROUTES ==============================
// ================================================================

// Customer: Get eligible purchased products for a customer
// GET /api/reviews/customer-purchases
router.get("/customer-purchases", optionalCustomerAuth, getCustomerPurchases);

// Public/Customer: Submit a new review (triggers purchase verification & auto LLM sentiment analysis)
// POST /api/reviews
router.post("/", optionalCustomerAuth, createReview);

// Vendor Protected: Get vendor sentiment summary metrics
// GET /api/reviews/vendor/sentiment-summary
router.get("/vendor/sentiment-summary", protectVendor, getVendorSentimentSummary);

// Vendor Protected: Get vendor reviews list
// GET /api/reviews/vendor
router.get("/vendor", protectVendor, getVendorReviews);

// Vendor Protected: Bulk analyze all unanalyzed reviews
// POST /api/reviews/vendor/analyze-all
router.post("/vendor/analyze-all", protectVendor, analyzeAllVendorReviews);

// Vendor Protected: Analyze a specific review by reviewId
// POST /api/reviews/:reviewId/analyze
router.post("/:reviewId/analyze", protectVendor, analyzeReview);


// ==================== EXPORT ROUTER ====================

module.exports = router;
