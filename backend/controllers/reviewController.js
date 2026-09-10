// ==================== IMPORT MODELS & SERVICES ====================

const mongoose = require("mongoose");
const Review = require("../models/Review");
const Product = require("../models/Product");
const Customer = require("../models/Customer");
const Transaction = require("../models/Transaction");
const { analyzeReviewSentiment } = require("../services/sentimentService");
const { generateProductEmbedding } = require("../services/embeddingService");


// ================================================================
// ==================== GET CUSTOMER PURCHASES ====================
// ================================================================

// GET /api/reviews/customer-purchases
//
// Retrieves all products purchased by a customer through completed transactions,
// along with their review status (hasReviewed, review details).
const getCustomerPurchases = async (req, res) => {
    try {
        const effectiveCustomerId = req.customerId || req.query.customerId;
        const { customerEmail } = req.query;

        let customer = null;
        if (effectiveCustomerId && mongoose.Types.ObjectId.isValid(effectiveCustomerId)) {
            customer = await Customer.findById(effectiveCustomerId);
        } else if (customerEmail) {
            customer = await Customer.findOne({ email: customerEmail.toLowerCase().trim() });
        }

        if (!customer) {
            return res.status(200).json({
                success: true,
                purchases: []
            });
        }

        // Fetch completed transactions for customer
        const transactions = await Transaction.find({
            customer: customer._id,
            status: "COMPLETED"
        }).populate("product vendor");

        // Map distinct purchased products
        const purchasesMap = new Map();

        for (const tx of transactions) {
            if (!tx.product || !tx.product._id) continue;
            const pId = tx.product._id.toString();

            if (!purchasesMap.has(pId)) {
                // Check if customer already submitted a review for this product
                const existingReview = await Review.findOne({
                    customer: customer._id,
                    product: tx.product._id
                });

                purchasesMap.set(pId, {
                    transactionId: tx._id,
                    productId: tx.product._id,
                    productName: tx.product.name,
                    category: tx.product.category,
                    price: tx.product.price,
                    imageUrl: tx.product.imageUrl,
                    vendorId: tx.vendor?._id || tx.product.vendor,
                    vendorName: tx.vendor?.businessName || tx.vendor?.name || "Merchant Store",
                    purchaseDate: tx.createdAt,
                    quantity: tx.quantity,
                    totalAmount: tx.totalAmount,
                    status: tx.status,
                    hasReviewed: !!existingReview,
                    review: existingReview ? {
                        id: existingReview._id,
                        rating: existingReview.rating,
                        reviewText: existingReview.reviewText,
                        sentiment: existingReview.sentiment,
                        sentimentScore: existingReview.sentimentScore,
                        summary: existingReview.summary,
                        pros: existingReview.pros,
                        cons: existingReview.cons,
                        createdAt: existingReview.createdAt
                    } : null
                });
            }
        }

        const purchases = Array.from(purchasesMap.values());

        return res.status(200).json({
            success: true,
            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email
            },
            count: purchases.length,
            purchases
        });

    } catch (error) {
        console.error("Get customer purchases error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving customer purchases",
            error: error.message
        });
    }
};


// ================================================================
// ==================== CREATE REVIEW (REAL CUSTOMER FLOW) =========
// ================================================================

// POST /api/reviews
//
// Creates a new product review for a purchased product.
// Verifies that the customer has a COMPLETED transaction for the product.
// Automatically assigns vendor from product.vendor.
// Prevents duplicate reviews.
const createReview = async (req, res) => {
    try {
        const effectiveCustomerId = req.customerId || req.body.customerId;
        const { productId, rating, reviewText, customerEmail } = req.body;

        // Validation
        if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Valid productId is required"
            });
        }

        const numRating = Number(rating);
        if (isNaN(numRating) || numRating < 1 || numRating > 5) {
            return res.status(400).json({
                success: false,
                message: "Rating must be a number between 1 and 5"
            });
        }

        if (!reviewText || typeof reviewText !== "string" || !reviewText.trim()) {
            return res.status(400).json({
                success: false,
                message: "Review text is required"
            });
        }

        // Fetch Product
        const product = await Product.findById(productId);
        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        // Determine Customer
        let customer = null;
        if (effectiveCustomerId && mongoose.Types.ObjectId.isValid(effectiveCustomerId)) {
            customer = await Customer.findById(effectiveCustomerId);
        } else if (customerEmail) {
            customer = await Customer.findOne({ email: customerEmail.toLowerCase().trim() });
        }

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found. Please select a valid customer."
            });
        }

        // Strict Verification 1: Must have an actual COMPLETED transaction for this product
        const hasPurchased = await Transaction.findOne({
            customer: customer._id,
            product: product._id,
            status: "COMPLETED"
        });

        if (!hasPurchased) {
            return res.status(403).json({
                success: false,
                message: "Verification failed: You can only review products you have actually purchased."
            });
        }

        // Strict Verification 2: Prevent Duplicate Reviews for same customer & product
        const existingReview = await Review.findOne({
            customer: customer._id,
            product: product._id
        });

        if (existingReview) {
            return res.status(400).json({
                success: false,
                message: "You have already submitted a review for this product."
            });
        }

        // Auto-determine vendor strictly from product in MongoDB (DO NOT trust client vendor parameter)
        const vendorId = product.vendor;

        // Auto-generate product embedding if missing
        if (!Array.isArray(product.embedding) || product.embedding.length === 0) {
            product.embedding = await generateProductEmbedding(product);
            await product.save();
        }

        // Run LLM Sentiment Analysis
        const analysis = await analyzeReviewSentiment(reviewText, numRating);

        // Save Review
        const review = await Review.create({
            customer: customer._id,
            product: product._id,
            vendor: vendorId,
            rating: numRating,
            reviewText: reviewText.trim(),
            sentiment: analysis.sentiment,
            sentimentScore: analysis.sentimentScore,
            summary: analysis.summary,
            pros: analysis.pros,
            cons: analysis.cons,
            analyzedAt: new Date()
        });

        const populatedReview = await Review.findById(review._id)
            .populate("product", "name category price imageUrl")
            .populate("customer", "name email");

        return res.status(201).json({
            success: true,
            message: "Review submitted and analyzed with LLM successfully",
            review: populatedReview
        });

    } catch (error) {
        console.error("Create review error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while submitting review",
            error: error.message
        });
    }
};


// ================================================================
// ==================== ANALYZE SINGLE REVIEW =====================
// ================================================================

// POST /api/reviews/:reviewId/analyze
//
// Manually triggers LLM sentiment analysis for a specific review document.
// Protected by protectVendor middleware with vendor isolation check.
const analyzeReview = async (req, res) => {
    try {
        const { reviewId } = req.params;
        const vendorId = req.vendorId;

        if (!reviewId || !mongoose.Types.ObjectId.isValid(reviewId)) {
            return res.status(400).json({
                success: false,
                message: "Valid reviewId is required"
            });
        }

        const review = await Review.findById(reviewId);
        if (!review) {
            return res.status(404).json({
                success: false,
                message: "Review not found"
            });
        }

        // Vendor Isolation Check
        if (review.vendor.toString() !== vendorId.toString()) {
            return res.status(403).json({
                success: false,
                message: "You are not authorized to analyze this vendor's review"
            });
        }

        // Execute LLM Sentiment Analysis
        const analysis = await analyzeReviewSentiment(review.reviewText, review.rating);

        review.sentiment = analysis.sentiment;
        review.sentimentScore = analysis.sentimentScore;
        review.summary = analysis.summary;
        review.pros = analysis.pros;
        review.cons = analysis.cons;
        review.analyzedAt = new Date();

        await review.save();

        const updatedReview = await Review.findById(review._id)
            .populate("product", "name category price imageUrl")
            .populate("customer", "name email");

        return res.status(200).json({
            success: true,
            message: "Review sentiment analysis updated",
            review: updatedReview
        });

    } catch (error) {
        console.error("Analyze review error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error during sentiment analysis",
            error: error.message
        });
    }
};


// ================================================================
// ==================== ANALYZE ALL VENDOR REVIEWS =================
// ================================================================

// POST /api/reviews/vendor/analyze-all
//
// Bulk analyzes all unanalyzed reviews belonging to the authenticated vendor.
const analyzeAllVendorReviews = async (req, res) => {
    try {
        const vendorId = req.vendorId;

        const unanalyzedReviews = await Review.find({
            vendor: vendorId,
            $or: [
                { sentiment: "UNANALYZED" },
                { sentiment: { $exists: false } }
            ]
        });

        if (unanalyzedReviews.length === 0) {
            return res.status(200).json({
                success: true,
                message: "All reviews are already analyzed",
                count: 0
            });
        }

        let analyzedCount = 0;
        for (const review of unanalyzedReviews) {
            const analysis = await analyzeReviewSentiment(review.reviewText, review.rating);
            review.sentiment = analysis.sentiment;
            review.sentimentScore = analysis.sentimentScore;
            review.summary = analysis.summary;
            review.pros = analysis.pros;
            review.cons = analysis.cons;
            review.analyzedAt = new Date();
            await review.save();
            analyzedCount++;
        }

        return res.status(200).json({
            success: true,
            message: `Successfully analyzed ${analyzedCount} reviews`,
            count: analyzedCount
        });

    } catch (error) {
        console.error("Analyze all reviews error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error during bulk review analysis"
        });
    }
};


// ================================================================
// ==================== GET VENDOR REVIEWS =========================
// ================================================================

// GET /api/reviews/vendor
//
// Retrieves reviews belonging ONLY to the authenticated vendor.
// Supports sentiment filter, product filter, pagination.
const getVendorReviews = async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const { sentiment, productId, page = 1, limit = 10 } = req.query;

        const filter = { vendor: vendorId };

        if (sentiment && ["POSITIVE", "NEUTRAL", "NEGATIVE", "UNANALYZED"].includes(sentiment.toUpperCase())) {
            filter.sentiment = sentiment.toUpperCase();
        }

        if (productId && mongoose.Types.ObjectId.isValid(productId)) {
            filter.product = productId;
        }

        const pageNum = Math.max(1, parseInt(page, 10) || 1);
        const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 10));
        const skip = (pageNum - 1) * limitNum;

        const [reviews, totalCount] = await Promise.all([
            Review.find(filter)
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .populate("product", "name category price imageUrl")
                .populate("customer", "name email"),
            Review.countDocuments(filter)
        ]);

        return res.status(200).json({
            success: true,
            totalCount,
            totalPages: Math.ceil(totalCount / limitNum),
            currentPage: pageNum,
            count: reviews.length,
            reviews
        });

    } catch (error) {
        console.error("Get vendor reviews error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving vendor reviews"
        });
    }
};


// ================================================================
// ==================== GET VENDOR SENTIMENT SUMMARY ==============
// ================================================================

// GET /api/reviews/vendor/sentiment-summary
//
// Returns aggregated sentiment analytics for the authenticated vendor.
const getVendorSentimentSummary = async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const objectIdVendor = new mongoose.Types.ObjectId(vendorId);

        // MongoDB Aggregation for Vendor Review Stats
        const summaryStats = await Review.aggregate([
            { $match: { vendor: objectIdVendor } },
            {
                $group: {
                    _id: null,
                    totalReviews: { $sum: 1 },
                    positiveCount: {
                        $sum: { $cond: [{ $eq: ["$sentiment", "POSITIVE"] }, 1, 0] }
                    },
                    neutralCount: {
                        $sum: { $cond: [{ $eq: ["$sentiment", "NEUTRAL"] }, 1, 0] }
                    },
                    negativeCount: {
                        $sum: { $cond: [{ $eq: ["$sentiment", "NEGATIVE"] }, 1, 0] }
                    },
                    averageSentimentScore: { $avg: "$sentimentScore" },
                    averageRating: { $avg: "$rating" },
                    allPros: { $push: "$pros" },
                    allCons: { $push: "$cons" }
                }
            }
        ]);

        const stats = summaryStats[0] || {
            totalReviews: 0,
            positiveCount: 0,
            neutralCount: 0,
            negativeCount: 0,
            averageSentimentScore: 0,
            averageRating: 0,
            allPros: [],
            allCons: []
        };

        // Extract top Pros frequency
        const proCounts = {};
        (stats.allPros || []).flat().forEach(pro => {
            if (pro && typeof pro === "string") {
                const cleaned = pro.trim();
                proCounts[cleaned] = (proCounts[cleaned] || 0) + 1;
            }
        });

        const topPros = Object.entries(proCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([text, count]) => ({ text, count }));

        // Extract top Cons frequency
        const conCounts = {};
        (stats.allCons || []).flat().forEach(con => {
            if (con && typeof con === "string") {
                const cleaned = con.trim();
                conCounts[cleaned] = (conCounts[cleaned] || 0) + 1;
            }
        });

        const topCons = Object.entries(conCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([text, count]) => ({ text, count }));

        // Fetch recent analyzed reviews
        const recentReviews = await Review.find({ vendor: vendorId })
            .sort({ createdAt: -1 })
            .limit(5)
            .populate("product", "name category price imageUrl")
            .populate("customer", "name email");

        return res.status(200).json({
            success: true,
            summary: {
                totalReviews: stats.totalReviews,
                positiveCount: stats.positiveCount,
                neutralCount: stats.neutralCount,
                negativeCount: stats.negativeCount,
                averageSentimentScore: parseFloat((stats.averageSentimentScore || 0).toFixed(1)),
                averageRating: parseFloat((stats.averageRating || 0).toFixed(1)),
                topPros,
                topCons,
                recentReviews
            }
        });

    } catch (error) {
        console.error("Get vendor sentiment summary error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while generating sentiment summary"
        });
    }
};

module.exports = {
    createReview,
    getCustomerPurchases,
    analyzeReview,
    analyzeAllVendorReviews,
    getVendorReviews,
    getVendorSentimentSummary
};
