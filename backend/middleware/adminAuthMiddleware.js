// ==================== IMPORT JWT ====================

const jwt = require("jsonwebtoken");


// ================================================================
// ==================== ADMIN AUTHENTICATION =======================
// ================================================================

const protectAdmin = (req, res, next) => {

    try {

        // Get Authorization header
        const authHeader = req.headers.authorization;


        // Expected:
        // Authorization: Bearer <ADMIN_TOKEN>
        if (
            !authHeader ||
            !authHeader.startsWith("Bearer ")
        ) {

            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }


        // Extract JWT token
        const token = authHeader.split(" ")[1];


        if (!token) {

            return res.status(401).json({
                success: false,
                message: "Admin authentication required"
            });
        }


        // Verify token
        const decoded = jwt.verify(
            token,
            process.env.JWT_SECRET
        );


        // IMPORTANT:
        // Admin token must contain BOTH:
        //
        // adminId
        // role = ADMIN
        //
        // Therefore a Vendor JWT cannot be used here.
        if (
            !decoded.adminId ||
            decoded.role !== "ADMIN"
        ) {

            return res.status(403).json({
                success: false,
                message: "Admin access required"
            });
        }


        // Store authenticated Admin ID
        req.adminId = decoded.adminId.toString();


        // Continue to controller
        next();


    } catch (error) {

        return res.status(401).json({
            success: false,
            message: "Invalid or expired admin token"
        });
    }
};


// ==================== EXPORT ====================

module.exports = {
    protectAdmin
};