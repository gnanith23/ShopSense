// ==================== IMPORT EXPRESS ====================

// Import Express to create customer API routes
const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

// Import customer controller functions
const {
    createCustomer
} = require("../controllers/customerController");


// ==================== CREATE ROUTER ====================

// Create an Express Router for customer-related APIs
const router = express.Router();


// ================================================================
// ==================== CREATE CUSTOMER ============================
// ================================================================

// POST /api/customers
// Creates a new customer
router.post(
    "/",
    createCustomer
);


// ==================== EXPORT ROUTER ====================

// Export router so server.js can use customer routes
module.exports = router;