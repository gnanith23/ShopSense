// ==================== IMPORT MODELS ====================

const Admin = require("../models/Admin");
const Vendor = require("../models/Vendor");


// ==================== IMPORT PACKAGES ====================

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");


// ================================================================
// ==================== REGISTER ADMIN =============================
// ================================================================

// Development-only endpoint.
//
// We will disable/remove public Admin registration
// after creating our initial Admin.
const registerAdmin = async (req, res) => {

    try {

        const {
            name,
            email,
            password
        } = req.body;


        // ==================== VALIDATION ====================

        if (
            !name ||
            !email ||
            !password
        ) {

            return res.status(400).json({
                success: false,
                message: "Please provide name, email and password"
            });
        }


        // ==================== CHECK EXISTING ADMIN ====================

        const existingAdmin = await Admin.findOne({
            email
        });


        if (existingAdmin) {

            return res.status(409).json({
                success: false,
                message: "Admin with this email already exists"
            });
        }


        // ==================== HASH PASSWORD ====================

        const salt = await bcrypt.genSalt(10);

        const hashedPassword = await bcrypt.hash(
            password,
            salt
        );


        // ==================== CREATE ADMIN ====================

        const admin = await Admin.create({

            name,

            email,

            password: hashedPassword
        });


        return res.status(201).json({

            success: true,

            message: "Admin registered successfully",

            admin: {

                id: admin._id,

                name: admin.name,

                email: admin.email,

                role: admin.role,

                createdAt: admin.createdAt
            }
        });


    } catch (error) {

        console.error(
            "Register admin error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while registering admin"
        });
    }
};


// ================================================================
// ==================== LOGIN ADMIN ================================
// ================================================================

const loginAdmin = async (req, res) => {

    try {

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


        // ==================== FIND ADMIN ====================

        const admin = await Admin.findOne({
            email
        });


        if (!admin) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        // ==================== PASSWORD CHECK ====================

        const passwordMatches = await bcrypt.compare(
            password,
            admin.password
        );


        if (!passwordMatches) {

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }


        // ==================== CREATE ADMIN JWT ====================

        const token = jwt.sign(

            {
                adminId: admin._id,
                role: "ADMIN"
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "1d"
            }
        );


        return res.status(200).json({

            success: true,

            message: "Admin login successful",

            token,

            admin: {

                id: admin._id,

                name: admin.name,

                email: admin.email,

                role: admin.role
            }
        });


    } catch (error) {

        console.error(
            "Admin login error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while logging in admin"
        });
    }
};


// ================================================================
// ==================== GET ALL VENDORS ============================
// ================================================================

const getAllVendors = async (req, res) => {

    try {

        // Do not send vendor passwords to Admin UI
        const vendors = await Vendor.find()
            .select("-password")
            .sort({
                createdAt: -1
            });


        return res.status(200).json({

            success: true,

            message: "Vendors retrieved successfully",

            count: vendors.length,

            vendors
        });


    } catch (error) {

        console.error(
            "Get vendors error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while retrieving vendors"
        });
    }
};


// ================================================================
// ==================== APPROVE VENDOR =============================
// ================================================================

const approveVendor = async (req, res) => {

    try {

        const vendorId = req.params.id;


        const vendor = await Vendor.findById(vendorId);


        if (!vendor) {

            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }


        // Change vendor status
        vendor.status = "APPROVED";


        await vendor.save();


        return res.status(200).json({

            success: true,

            message: "Vendor approved successfully",

            vendor: {

                id: vendor._id,

                name: vendor.name,

                email: vendor.email,

                businessName: vendor.businessName,

                status: vendor.status
            }
        });


    } catch (error) {

        console.error(
            "Approve vendor error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while approving vendor"
        });
    }
};


// ================================================================
// ==================== SUSPEND VENDOR =============================
// ================================================================

const suspendVendor = async (req, res) => {

    try {

        const vendorId = req.params.id;


        const vendor = await Vendor.findById(vendorId);


        if (!vendor) {

            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }


        // Change vendor status
        vendor.status = "SUSPENDED";


        await vendor.save();


        return res.status(200).json({

            success: true,

            message: "Vendor suspended successfully",

            vendor: {

                id: vendor._id,

                name: vendor.name,

                email: vendor.email,

                businessName: vendor.businessName,

                status: vendor.status
            }
        });


    } catch (error) {

        console.error(
            "Suspend vendor error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while suspending vendor"
        });
    }
};


// ================================================================
// ==================== EXPORT CONTROLLERS =========================
// ================================================================

module.exports = {

    registerAdmin,

    loginAdmin,

    getAllVendors,

    approveVendor,

    suspendVendor
};