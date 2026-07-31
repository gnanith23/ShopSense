// ==================== IMPORT MONGOOSE ====================

// Import Mongoose to create the Transaction schema and model
const mongoose = require("mongoose");


// ==================== TRANSACTION SCHEMA ====================

// Define the structure of a Transaction document in MongoDB
const transactionSchema = new mongoose.Schema(
    {

        // ==================== VENDOR RELATIONSHIP ====================

        // Stores the MongoDB ID of the vendor who sold the product
        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true
        },


        // ==================== CUSTOMER RELATIONSHIP ====================

        // Stores the MongoDB ID of the customer who purchased the product
        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },


        // ==================== PRODUCT RELATIONSHIP ====================

        // Stores the MongoDB ID of the product that was purchased
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },


        // ==================== TRANSACTION DETAILS ====================

        // Number of units purchased
        quantity: {
            type: Number,
            required: true,
            min: 1
        },


        // Price of one product unit at the time of purchase
        unitPrice: {
            type: Number,
            required: true,
            min: 0
        },


        // Total value of this transaction
        // Formula: quantity × unitPrice
        totalAmount: {
            type: Number,
            required: true,
            min: 0
        },


        // ==================== TRANSACTION STATUS ====================

        // Current status of the transaction
        status: {
            type: String,
            enum: [
                "COMPLETED",
                "CANCELLED"
            ],
            default: "COMPLETED"
        }

    },


    // ==================== TIMESTAMPS ====================

    // Automatically adds:
    // createdAt
    // updatedAt
    {
        timestamps: true
    }
);


// ==================== TRANSACTION MODEL ====================

// Create a Mongoose model named "Transaction"
// MongoDB will store these documents in the transactions collection
const Transaction = mongoose.model(
    "Transaction",
    transactionSchema
);


// ==================== EXPORT MODEL ====================

// Export the Transaction Mongoose model directly
// This allows other files to use:
//
// Transaction.create()
// Transaction.find()
// Transaction.findById()
// Transaction.aggregate()
module.exports = Transaction;