// ==================== IMPORT EXPRESS ====================

// Import Express to create customer API routes
const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

// Import customer controller functions
const {
    createCustomer,
    getCustomers,
    customerLogin,
    getCustomerProfile,
    updateCustomerProfile
} = require("../controllers/customerController");

// Import auth middleware
const { protectCustomer } = require("../middleware/authMiddleware");


// ==================== CREATE ROUTER ====================

// Create an Express Router for customer-related APIs
const router = express.Router();


// ================================================================
// ==================== CUSTOMER ROUTES ============================
// ================================================================

// GET /api/customers
// Returns all customers
router.get(
    "/",
    getCustomers
);

// POST /api/customers
// Creates a new customer
router.post(
    "/",
    createCustomer
);

// POST /api/customers/login
// Customer authentication (email/ID)
router.post(
    "/login",
    customerLogin
);

// GET /api/customers/me
// Get authenticated customer's profile
router.get(
    "/me",
    protectCustomer,
    getCustomerProfile
);

// PUT /api/customers/me
// Update authenticated customer's profile in MongoDB
router.put(
    "/me",
    protectCustomer,
    updateCustomerProfile
);


// ==================== EXPORT ROUTER ====================

// Export router so server.js can use customer routes
module.exports = router;