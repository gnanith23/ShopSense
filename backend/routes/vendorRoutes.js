// ==================== IMPORT EXPRESS ====================

const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

const {

    registerVendor,

    loginVendor,

    getVendorProfile,

    updateVendorProfile,

    getVendorAnalytics

} = require("../controllers/vendorController");


// ==================== IMPORT AUTH MIDDLEWARE ====================

const {

    protectVendor,

    verifyVendorOwnership

} = require("../middleware/authMiddleware");


// ==================== CREATE ROUTER ====================

const router = express.Router();


// ================================================================
// ==================== PUBLIC ROUTES ===============================
// ================================================================


// ==================== REGISTER ====================

// POST /api/vendors/register
router.post(
    "/register",
    registerVendor
);


// ==================== LOGIN ====================

// POST /api/vendors/login
router.post(
    "/login",
    loginVendor
);


// ================================================================
// ==================== PROTECTED ROUTES ============================
// ================================================================


// ==================== ANALYTICS ====================

// Only the authenticated vendor can view
// their own analytics.
router.get(
    "/:id/analytics",

    protectVendor,

    verifyVendorOwnership,

    getVendorAnalytics
);


// ==================== GET PROFILE ====================

// Only the authenticated vendor can view
// their own profile.
router.get(
    "/:id",

    protectVendor,

    verifyVendorOwnership,

    getVendorProfile
);


// ==================== UPDATE PROFILE ====================

// Only the authenticated vendor can update
// their own profile.
router.put(
    "/:id",

    protectVendor,

    verifyVendorOwnership,

    updateVendorProfile
);


// ==================== EXPORT ROUTER ====================

module.exports = router;