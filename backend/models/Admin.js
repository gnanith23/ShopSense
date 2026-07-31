// ==================== IMPORT MONGOOSE ====================

const mongoose = require("mongoose");


// ==================== ADMIN SCHEMA ====================

const adminSchema = new mongoose.Schema(
    {

        // ==================== ADMIN NAME ====================

        name: {
            type: String,
            required: true,
            trim: true
        },


        // ==================== ADMIN EMAIL ====================

        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true
        },


        // ==================== ADMIN PASSWORD ====================

        // Password will be stored as a bcrypt hash
        password: {
            type: String,
            required: true
        },


        // ==================== ROLE ====================

        role: {
            type: String,
            default: "ADMIN",
            immutable: true
        }
    },

    {
        timestamps: true
    }
);


// ==================== CREATE MODEL ====================

const Admin = mongoose.model(
    "Admin",
    adminSchema
);


// ==================== EXPORT MODEL ====================

module.exports = Admin;