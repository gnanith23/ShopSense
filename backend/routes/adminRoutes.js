// ==================== IMPORT EXPRESS ====================

const express = require("express");


// ==================== IMPORT CONTROLLERS ====================

const {

    registerAdmin,

    loginAdmin,

    getAllVendors,

    approveVendor,

    suspendVendor

} = require("../controllers/adminController");


// ==================== IMPORT ADMIN AUTH ====================

const {

    protectAdmin

} = require("../middleware/adminAuthMiddleware");


// ==================== CREATE ROUTER ====================

const router = express.Router();


// ================================================================
// ==================== PUBLIC ADMIN ROUTES ========================
// ================================================================


// ==================== REGISTER ADMIN =============================

// TEMPORARY development route.
//
// We will disable this after testing.
router.post(
    "/register",
    registerAdmin
);


// ==================== LOGIN ADMIN ================================

router.post(
    "/login",
    loginAdmin
);


// ================================================================
// ==================== PROTECTED ADMIN ROUTES =====================
// ================================================================


// ==================== GET ALL VENDORS ============================

// GET /api/admin/vendors
router.get(
    "/vendors",

    protectAdmin,

    getAllVendors
);


// ==================== APPROVE VENDOR =============================

// PUT /api/admin/vendors/:id/approve
router.put(
    "/vendors/:id/approve",

    protectAdmin,

    approveVendor
);


// ==================== SUSPEND VENDOR =============================

// PUT /api/admin/vendors/:id/suspend
router.put(
    "/vendors/:id/suspend",

    protectAdmin,

    suspendVendor
);


// ==================== EXPORT ROUTER ====================

module.exports = router;