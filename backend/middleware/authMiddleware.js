// ==================== IMPORT PACKAGES ====================

const jwt = require("jsonwebtoken");


// ==================== IMPORT MODEL ====================

// Vendor is needed because JWT verification alone is not enough.
// We must also check the vendor's CURRENT status in MongoDB.
const Vendor = require("../models/Vendor");


// ================================================================
// ==================== VENDOR AUTHENTICATION ======================
// ================================================================

const protectVendor = async (req, res, next) => {

    try {

        // ==================== GET AUTH HEADER ====================

        const authHeader = req.headers.authorization;


        // Expected format:
        //
        // Authorization: Bearer <JWT_TOKEN>
        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }


        // ==================== EXTRACT TOKEN ====================

        const token = authHeader.split(" ")[1];


        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Authentication required"
            });
        }


        // ==================== VERIFY JWT ====================

        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // Vendor JWT must contain vendorId
        if (!decoded.vendorId) {

            return res.status(401).json({
                success: false,
                message: "Invalid authentication token"
            });
        }


        // ==================== FIND CURRENT VENDOR ====================

        // IMPORTANT:
        //
        // We check MongoDB instead of trusting only the JWT.
        //
        // This means if Admin suspends the vendor AFTER the JWT
        // was created, their next protected request is blocked.
        const vendor = await Vendor.findById(
            decoded.vendorId
        );


        // Vendor may have been deleted
        if (!vendor) {

            return res.status(401).json({
                success: false,
                message: "Vendor account no longer exists"
            });
        }


        // ==================== CHECK STATUS ====================


        // -------- PENDING --------

        if (vendor.status === "PENDING") {

            return res.status(403).json({
                success: false,
                message: "Vendor account is awaiting admin approval"
            });
        }


        // -------- SUSPENDED --------

        if (vendor.status === "SUSPENDED") {

            return res.status(403).json({
                success: false,
                message: "Vendor account has been suspended"
            });
        }


        // ==================== HANDLE OLD VENDORS ====================

        // Some old test documents may not have a status because
        // they existed before we added the status field.
        //
        // Only APPROVED vendors should access protected APIs.
        if (vendor.status !== "APPROVED") {

            return res.status(403).json({
                success: false,
                message: "Vendor account is not approved"
            });
        }


        // ==================== STORE AUTHENTICATED VENDOR ====================

        req.vendorId = vendor._id.toString();


        // We also store the vendor document in case future
        // controllers need it.
        req.vendor = vendor;


        // ==================== CONTINUE ====================

        next();


    } catch (error) {

        // JWT expired or invalid
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token"
        });
    }
};


// ================================================================
// ==================== VERIFY VENDOR OWNERSHIP ====================
// ================================================================

const verifyVendorOwnership = (req, res, next) => {

    // Vendor requested in URL
    const requestedVendorId = req.params.id;


    // Vendor authenticated by JWT
    const authenticatedVendorId = req.vendorId;


    // ==================== COMPARE ====================

    if (
        requestedVendorId.toString() !==
        authenticatedVendorId.toString()
    ) {

        return res.status(403).json({
            success: false,
            message: "You are not authorized to access this vendor"
        });
    }


    next();
};


// ================================================================
// ==================== EXPORT ====================
// ================================================================

module.exports = {

    protectVendor,

    verifyVendorOwnership
};