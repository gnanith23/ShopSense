// ==================== IMPORT MONGOOSE ====================

const mongoose = require("mongoose");


// ==================== REVIEW SCHEMA ====================

const reviewSchema = new mongoose.Schema(
    {
        // ==================== CUSTOMER RELATIONSHIP ====================

        customer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Customer",
            required: true
        },


        // ==================== PRODUCT RELATIONSHIP ====================

        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: true
        },


        // ==================== VENDOR RELATIONSHIP ====================

        vendor: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Vendor",
            required: true
        },


        // ==================== REVIEW DETAILS ====================

        rating: {
            type: Number,
            required: true,
            min: 1,
            max: 5
        },

        reviewText: {
            type: String,
            required: true,
            trim: true
        },


        // ==================== LLM SENTIMENT ANALYSIS RESULTS ====================

        sentiment: {
            type: String,
            enum: [
                "POSITIVE",
                "NEUTRAL",
                "NEGATIVE",
                "UNANALYZED"
            ],
            default: "UNANALYZED"
        },

        // Normalized score from 0 to 100
        sentimentScore: {
            type: Number,
            min: 0,
            max: 100,
            default: 0
        },

        summary: {
            type: String,
            default: "",
            trim: true
        },

        pros: {
            type: [String],
            default: []
        },

        cons: {
            type: [String],
            default: []
        },

        analyzedAt: {
            type: Date,
            default: null
        }
    },

    {
        timestamps: true
    }
);


// ==================== INDEXES FOR PERFORMANCE & ISOLATION ====================

reviewSchema.index({ vendor: 1, createdAt: -1 });
reviewSchema.index({ product: 1 });
reviewSchema.index({ sentiment: 1 });


// ==================== CREATE & EXPORT MODEL ====================

const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
