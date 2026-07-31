// ==================== IMPORT MODELS ====================

const Vendor = require("../models/Vendor");
const Transaction = require("../models/Transaction");


// ==================== IMPORT SECURITY PACKAGES ====================

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// ================================================================
// ==================== REGISTER VENDOR ============================
// ================================================================

const registerVendor = async (req, res) => {

    try {

        // ==================== GET REQUEST DATA ====================

        const {
            name,
            email,
            password,
            phone,
            businessName,
            address
        } = req.body;


        // ==================== VALIDATION ====================

        if (
            !name ||
            !email ||
            !password ||
            !businessName
        ) {

            return res.status(400).json({
                success: false,
                message: "Please provide all required vendor fields"
            });
        }


        // ==================== CHECK EXISTING VENDOR ====================

        const existingVendor = await Vendor.findOne({
            email: email
        });


        if (existingVendor) {

            return res.status(409).json({
                success: false,
                message: "Vendor with this email already exists"
            });
        }


        // ==================== HASH PASSWORD ====================

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );


        // ==================== CREATE VENDOR ====================

        // Vendor.js automatically sets:
        //
        // status = "PENDING"
        //
        // New vendors must therefore wait for Admin approval.
        const vendor = await Vendor.create({

            name,

            email,

            password: hashedPassword,

            phone,

            businessName,

            address
        });


        // ==================== SUCCESS RESPONSE ====================

        return res.status(201).json({

            success: true,

            message:
                "Vendor registered successfully. Waiting for admin approval.",

            vendor: {

                id: vendor._id,

                name: vendor.name,

                email: vendor.email,

                phone: vendor.phone,

                businessName: vendor.businessName,

                address: vendor.address,

                status: vendor.status,

                createdAt: vendor.createdAt
            }
        });


    } catch (error) {

        console.error(
            "Register vendor error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while registering vendor"
        });
    }
};


// ================================================================
// ==================== LOGIN VENDOR ===============================
// ================================================================

const loginVendor = async (req, res) => {

    try {

        // ==================== GET LOGIN DATA ====================

        const {
            email,
            password
        } = req.body;


        // ==================== VALIDATION ====================

        if (!email || !password) {

            return res.status(400).json({
                success: false,
                message: "Please provide email and password"
            });
        }


        // ==================== FIND VENDOR ====================

        const vendor = await Vendor.findOne({
            email: email
        });


        // Do not reveal whether a particular email exists
        if (!vendor) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        // ==================== CHECK PASSWORD ====================

        const passwordMatches = await bcrypt.compare(
            password,
            vendor.password
        );


        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        // ========================================================
        // ==================== CHECK STATUS =======================
        // ========================================================


        // ==================== PENDING ====================

        // Vendor registered successfully but Admin
        // has not approved the account yet.
        if (vendor.status === "PENDING") {

            return res.status(403).json({
                success: false,
                message:
                    "Your vendor account is awaiting admin approval"
            });
        }


        // ==================== SUSPENDED ====================

        // Admin has blocked this vendor.
        if (vendor.status === "SUSPENDED") {

            return res.status(403).json({
                success: false,
                message:
                    "Your vendor account has been suspended"
            });
        }


        // ==================== OTHER / OLD RECORD ====================

        // Some older test vendors may have been created
        // before the status field was introduced.
        //
        // Only APPROVED vendors are allowed to login.
        if (vendor.status !== "APPROVED") {

            return res.status(403).json({
                success: false,
                message:
                    "Your vendor account is not approved"
            });
        }


        // ========================================================
        // ==================== GENERATE JWT =======================
        // ========================================================

        // We reach this section ONLY when:
        //
        // vendor.status === "APPROVED"

        const token = jwt.sign(

            {
                vendorId: vendor._id
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "1d"
            }
        );


        // ==================== SUCCESS RESPONSE ====================

        return res.status(200).json({

            success: true,

            message: "Vendor login successful",

            token,

            vendor: {

                id: vendor._id,

                name: vendor.name,

                email: vendor.email,

                phone: vendor.phone,

                businessName: vendor.businessName,

                address: vendor.address,

                status: vendor.status
            }
        });


    } catch (error) {

        console.error(
            "Vendor login error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while logging in vendor"
        });
    }
};


// ================================================================
// ==================== GET VENDOR PROFILE =========================
// ================================================================

const getVendorProfile = async (req, res) => {

    try {

        // ==================== GET VENDOR ID ====================

        const vendorId = req.params.id;


        // ==================== FIND VENDOR ====================

        // Password must never be returned to frontend.
        const vendor = await Vendor.findById(
            vendorId
        ).select("-password");


        // ==================== NOT FOUND ====================

        if (!vendor) {

            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }


        // ==================== SUCCESS ====================

        return res.status(200).json({

            success: true,

            message:
                "Vendor profile retrieved successfully",

            vendor
        });


    } catch (error) {

        console.error(
            "Get vendor profile error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message:
                "Server error while retrieving vendor profile"
        });
    }
};


// ================================================================
// ==================== UPDATE VENDOR PROFILE ======================
// ================================================================

const updateVendorProfile = async (req, res) => {

    try {

        // ==================== GET VENDOR ID ====================

        const vendorId = req.params.id;


        // ==================== GET UPDATE DATA ====================

        const {
            name,
            phone,
            businessName,
            address
        } = req.body;


        // ==================== FIND VENDOR ====================

        const vendor = await Vendor.findById(
            vendorId
        );


        if (!vendor) {

            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }


        // ========================================================
        // ==================== UPDATE FIELDS ======================
        // ========================================================

        if (name !== undefined) {

            vendor.name = name;
        }


        if (phone !== undefined) {

            vendor.phone = phone;
        }


        if (businessName !== undefined) {

            vendor.businessName = businessName;
        }


        if (address !== undefined) {

            vendor.address = address;
        }


        // ==================== SAVE ====================

        await vendor.save();


        // ==================== SUCCESS RESPONSE ====================

        return res.status(200).json({

            success: true,

            message:
                "Vendor profile updated successfully",

            vendor: {

                id: vendor._id,

                name: vendor.name,

                email: vendor.email,

                phone: vendor.phone,

                businessName: vendor.businessName,

                address: vendor.address,

                status: vendor.status,

                updatedAt: vendor.updatedAt
            }
        });


    } catch (error) {

        console.error(
            "Update vendor profile error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message:
                "Server error while updating vendor profile"
        });
    }
};


// ================================================================
// ==================== GET VENDOR ANALYTICS =======================
// ================================================================

const getVendorAnalytics = async (req, res) => {

    try {

        // ==================== GET VENDOR ID ====================

        const vendorId = req.params.id;


        // ==================== CHECK VENDOR ====================

        const vendor = await Vendor.findById(
            vendorId
        );


        if (!vendor) {

            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }


        // ========================================================
        // ==================== TRANSACTION ANALYTICS ==============
        // ========================================================

        const analytics = await Transaction.aggregate([

            // ==================== MATCH ====================

            // Select only COMPLETED transactions
            // belonging to this vendor.
            {
                $match: {

                    vendor: vendor._id,

                    status: "COMPLETED"
                }
            },


            // ==================== GROUP ====================

            {
                $group: {

                    _id: null,


                    // Total number of product units sold
                    totalSales: {
                        $sum: "$quantity"
                    },


                    // Total money generated
                    totalRevenue: {
                        $sum: "$totalAmount"
                    },


                    // Number of transactions
                    totalTransactions: {
                        $sum: 1
                    }
                }
            }
        ]);


        // ==================== NO TRANSACTIONS ====================

        // MongoDB aggregation returns [] when there
        // are no matching transactions.
        const result =
            analytics.length > 0

                ? analytics[0]

                : {
                    totalSales: 0,
                    totalRevenue: 0,
                    totalTransactions: 0
                };


        // ==================== SUCCESS RESPONSE ====================

        return res.status(200).json({

            success: true,

            message:
                "Vendor analytics retrieved successfully",

            vendor: {

                id: vendor._id,

                name: vendor.name,

                businessName:
                    vendor.businessName,

                status: vendor.status
            },

            analytics: {

                totalSales:
                    result.totalSales,

                totalRevenue:
                    result.totalRevenue,

                totalTransactions:
                    result.totalTransactions
            }
        });


    } catch (error) {

        console.error(
            "Get vendor analytics error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message:
                "Server error while retrieving vendor analytics"
        });
    }
};


// ================================================================
// ==================== EXPORT CONTROLLERS =========================
// ================================================================

module.exports = {

    registerVendor,

    loginVendor,

    getVendorProfile,

    updateVendorProfile,

    getVendorAnalytics
};