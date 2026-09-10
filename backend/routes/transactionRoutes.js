// ==================== IMPORT EXPRESS ====================

// Import Express to create transaction API routes
const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

// Import transaction controller functions
const {
    createTransaction,
    getMyPurchases,
    getVendorTransactions
} = require("../controllers/transactionController");

// Import customer and vendor auth middleware
const { optionalCustomerAuth, optionalVendorAuth } = require("../middleware/authMiddleware");


// ==================== CREATE ROUTER ====================

// Create an Express Router for transaction-related APIs
const router = express.Router();


// ================================================================
// ==================== TRANSACTION ROUTES =========================
// ================================================================

// GET /api/transactions/my-purchases
// Returns customer completed purchases
router.get(
    "/my-purchases",
    optionalCustomerAuth,
    getMyPurchases
);

// GET /api/transactions/vendor
// GET /api/transactions/vendor/:vendorId
// Returns vendor completed transactions (latest sales)
router.get(
    "/vendor",
    optionalVendorAuth,
    getVendorTransactions
);

router.get(
    "/vendor/:vendorId",
    optionalVendorAuth,
    getVendorTransactions
);

// POST /api/transactions
// Creates a new transaction (simulated purchase)
router.post(
    "/",
    optionalCustomerAuth,
    createTransaction
);


// ==================== EXPORT ROUTER ====================

// Export router so server.js can use transaction routes
module.exports = router;