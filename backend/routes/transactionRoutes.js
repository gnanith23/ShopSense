// ==================== IMPORT EXPRESS ====================

// Import Express to create transaction API routes
const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

// Import transaction controller functions
const {
    createTransaction
} = require("../controllers/transactionController");


// ==================== CREATE ROUTER ====================

// Create an Express Router for transaction-related APIs
const router = express.Router();


// ================================================================
// ==================== CREATE TRANSACTION =========================
// ================================================================

// POST /api/transactions
// Creates a new transaction
router.post(
    "/",
    createTransaction
);


// ==================== EXPORT ROUTER ====================

// Export router so server.js can use transaction routes
module.exports = router;