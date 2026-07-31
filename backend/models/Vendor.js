// ==================== IMPORT MONGOOSE ====================

// Import Mongoose to create the Vendor schema and model
const mongoose = require("mongoose");


// ==================== VENDOR SCHEMA ====================

const vendorSchema = new mongoose.Schema(
    {

        // ==================== BASIC INFORMATION ====================

        name: {
            type: String,
            required: true,
            trim: true
        },


        // ==================== EMAIL ====================

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },


        // ==================== PASSWORD ====================

        // Password is stored as a bcrypt hash
        password: {
            type: String,
            required: true
        },


        // ==================== PHONE ====================

        phone: {
            type: String,
            trim: true,
            default: ""
        },


        // ==================== BUSINESS NAME ====================

        businessName: {
            type: String,
            required: true,
            trim: true
        },


        // ==================== ADDRESS ====================

        address: {
            type: String,
            trim: true,
            default: ""
        },


        // ==================== VENDOR STATUS ====================

        // Controls whether the vendor is allowed to use
        // ShopSense vendor functionality.
        //
        // PENDING:
        // Vendor registered but admin has not approved yet.
        //
        // APPROVED:
        // Admin approved the vendor.
        //
        // SUSPENDED:
        // Admin blocked the vendor.
        status: {
            type: String,

            enum: [
                "PENDING",
                "APPROVED",
                "SUSPENDED"
            ],

            default: "PENDING"
        }
    },


    // Automatically creates:
    //
    // createdAt
    // updatedAt
    {
        timestamps: true
    }
);


// ==================== CREATE MODEL ====================

const Vendor = mongoose.model(
    "Vendor",
    vendorSchema
);


// ==================== EXPORT MODEL ====================

module.exports = Vendor;