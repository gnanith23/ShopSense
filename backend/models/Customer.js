// ==================== IMPORT MONGOOSE ====================

// Import Mongoose to create the Customer schema and model
const mongoose = require("mongoose");


// ==================== CUSTOMER SCHEMA ====================

// Define the structure of a Customer document in MongoDB
const customerSchema = new mongoose.Schema(
    {
        // ==================== BASIC CUSTOMER INFORMATION ====================

        // Name of the customer
        name: {
            type: String,
            required: true,
            trim: true
        },

        // Customer email address
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        // Customer phone number
        phone: {
            type: String,
            required: true,
            trim: true
        },

        // Customer address
        address: {
            type: String,
            trim: true,
            default: ""
        }
    },

    // Automatically create createdAt and updatedAt fields
    {
        timestamps: true
    }
);


// ==================== CUSTOMER MODEL ====================

// Create the Customer model using customerSchema
const Customer = mongoose.model("Customer", customerSchema);


// ==================== EXPORT MODEL ====================

// Export Customer so controllers and other files can use it
module.exports = Customer;