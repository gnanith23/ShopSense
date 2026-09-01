// ==================== IMPORT MODELS ====================

const mongoose    = require("mongoose");
const Transaction = require("../models/Transaction");
const Product     = require("../models/Product");
const Customer    = require("../models/Customer");
const {
    generateProductEmbedding,
    generateUserBehaviorEmbedding,
    calculateCosineSimilarity
} = require("../services/embeddingService");


// ================================================================
// ==================== RULE-BASED RECOMMENDATION SYSTEM ===========
// ================================================================
//
// This is NOT machine learning. This is NOT AI.
// This is a rule-based historical-sales recommendation system.
//
// Algorithm:
//   Given a product category:
//   1. Find products in the vendor's catalog belonging to that category.
//   2. Find all COMPLETED transactions for those products.
//   3. Sum total units sold per product (via MongoDB aggregation).
//   4. Sort by units sold descending.
//   5. Return top N products as recommendations.
//
// Data source: actual MongoDB transaction history.
// No external API is called. No AI service is called.
// ================================================================


// Default recommendation limit (can be overridden via ?limit=N)
const DEFAULT_LIMIT = 5;
const MAX_LIMIT     = 50;


// ================================================================
// ==================== CATEGORY RECOMMENDATIONS ===================
// ================================================================

// GET /api/recommendations/category/:category
// GET /api/recommendations/category/:category?limit=5
//
// Returns the top-selling products in a given category
// based on historical COMPLETED transaction data for the
// authenticated vendor.
const getCategoryRecommendations = async (req, res) => {

    try {

        const vendorId = req.vendorId;


        // ==================== PARSE CATEGORY ====================

        const category = req.params.category
            ? req.params.category.trim()
            : "";

        if (!category) {

            return res.status(400).json({
                success: false,
                message: "Category parameter is required"
            });
        }


        // ==================== PARSE LIMIT ====================

        let limit = parseInt(req.query.limit, 10);

        if (Number.isNaN(limit) || limit <= 0) {
            limit = DEFAULT_LIMIT;
        }

        if (limit > MAX_LIMIT) {
            limit = MAX_LIMIT;
        }


        // ==================== VERIFY CATEGORY EXISTS ====================

        // Check whether this vendor has any products in this category.
        // Case-insensitive match mirrors how the frontend likely searches.
        const categoryCheckRegex = new RegExp(`^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");

        const categoryExists = await Product.findOne({
            vendor:   vendorId,
            category: categoryCheckRegex
        });

        if (!categoryExists) {

            return res.status(404).json({
                success:  false,
                message:  `No products found in category: ${category}`,
                category
            });
        }


        // ==================== AGGREGATION PIPELINE ====================
        //
        // Join transactions → products to find units sold per product
        // within the specified category, for this vendor.
        //
        // Equivalent SQL:
        //   SELECT p.id, p.name, SUM(t.quantity) AS unitsSold
        //   FROM   transactions t
        //   JOIN   products p ON t.product = p._id
        //   WHERE  t.vendor  = :vendorId
        //     AND  t.status  = 'COMPLETED'
        //     AND  LOWER(p.category) = LOWER(:category)
        //   GROUP  BY p.id, p.name
        //   ORDER  BY unitsSold DESC
        //   LIMIT  :limit

        const recommendations = await Transaction.aggregate([

            // Step 1: Match COMPLETED transactions for this vendor
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    status: "COMPLETED"
                }
            },

            // Step 2: Lookup product details
            {
                $lookup: {
                    from:         "products",
                    localField:   "product",
                    foreignField: "_id",
                    as:           "productDetails"
                }
            },

            // Step 3: Flatten the product array
            {
                $unwind: "$productDetails"
            },

            // Step 4: Filter to the requested category (case-insensitive)
            {
                $match: {
                    "productDetails.category": {
                        $regex:   `^${category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`,
                        $options: "i"
                    }
                }
            },

            // Step 5: Group by product to sum units sold
            {
                $group: {
                    _id: "$product",

                    productName: {
                        $first: "$productDetails.name"
                    },

                    category: {
                        $first: "$productDetails.category"
                    },

                    price: {
                        $first: "$productDetails.price"
                    },

                    imageUrl: {
                        $first: "$productDetails.imageUrl"
                    },

                    unitsSold: {
                        $sum: "$quantity"
                    },

                    totalRevenue: {
                        $sum: "$totalAmount"
                    },

                    transactionCount: {
                        $sum: 1
                    }
                }
            },

            // Step 6: Sort by units sold descending
            {
                $sort: {
                    unitsSold: -1
                }
            },

            // Step 7: Apply limit
            {
                $limit: limit
            },

            // Step 8: Shape final output
            {
                $project: {
                    _id:              0,
                    productId:        "$_id",
                    name:             "$productName",
                    category:         1,
                    price:            1,
                    imageUrl:         1,
                    unitsSold:        1,
                    totalRevenue:     1,
                    transactionCount: 1
                }
            }
        ]);


        // ==================== HANDLE NO SALES DATA ====================

        if (recommendations.length === 0) {

            // Category exists but no COMPLETED transactions yet
            return res.status(200).json({
                success:    true,
                message:    `No sales history found for category: ${category}`,
                dataStatus: "INSUFFICIENT_DATA",
                category,
                limit,
                recommendationBasis: "rule-based historical sales",
                recommendations: []
            });
        }


        // ==================== ADD RANK ====================

        const rankedRecommendations = recommendations.map(
            (item, index) => ({
                rank:             index + 1,
                productId:        item.productId,
                name:             item.name,
                category:         item.category,
                price:            item.price,
                imageUrl:         item.imageUrl,
                unitsSold:        item.unitsSold,
                totalRevenue:     item.totalRevenue,
                transactionCount: item.transactionCount
            })
        );


        return res.status(200).json({
            success:    true,
            message:    `Top-selling products in category: ${category}`,
            dataStatus: "OK",
            category,
            limit,
            recommendationBasis: "rule-based historical sales — NOT machine learning",
            count:       rankedRecommendations.length,
            recommendations: rankedRecommendations
        });


    } catch (error) {

        console.error(
            "Get category recommendations error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving recommendations"
        });
    }
};


// ================================================================
// ==================== GET AVAILABLE CATEGORIES ===================
// ================================================================

// GET /api/recommendations/categories
//
// Returns all distinct product categories available for the
// authenticated vendor. Useful for the frontend to populate
// a category picker before calling the recommendation endpoint.
const getAvailableCategories = async (req, res) => {

    try {

        const vendorId = req.vendorId;

        const categories = await Product.distinct(
            "category",
            { vendor: vendorId }
        );

        categories.sort();

        return res.status(200).json({
            success: true,
            message: "Available product categories retrieved",
            count:   categories.length,
            categories
        });


    } catch (error) {

        console.error(
            "Get available categories error:",
            error.message
        );

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving categories"
        });
    }
};


// ================================================================
// ==================== VECTOR SEARCH RECOMMENDATIONS ==============
// ================================================================

// GET /api/recommendations/vector
// GET /api/recommendations/vector?customerId=...&limit=5
//
// Advanced Vector Similarity Recommendation Engine:
// 1. Builds user behavior preference embedding from customer transaction history.
// 2. Fetches vendor's products, generating 768-dim embeddings if missing.
// 3. Filters out out-of-stock products (stock > 0).
// 4. Performs cosine similarity search between user profile vector and product vectors.
// 5. Returns ranked contextual recommendations with similarity score and rationale.
const getVectorRecommendations = async (req, res) => {
    try {
        const vendorId = req.vendorId;

        // Parse limit
        let limit = parseInt(req.query.limit, 10);
        if (isNaN(limit) || limit <= 0) limit = DEFAULT_LIMIT;
        if (limit > MAX_LIMIT) limit = MAX_LIMIT;

        // Parse customerId or pick candidate customer with transactions for this vendor
        let customerId = req.query.customerId;
        let customer = null;

        if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
            customer = await Customer.findById(customerId);
        }

        if (!customer) {
            // Find most active customer for this vendor
            const activeCustomerAggregate = await Transaction.aggregate([
                { $match: { vendor: new mongoose.Types.ObjectId(vendorId), status: "COMPLETED" } },
                { $group: { _id: "$customer", count: { $sum: 1 } } },
                { $sort: { count: -1 } },
                { $limit: 1 }
            ]);

            if (activeCustomerAggregate.length > 0) {
                customer = await Customer.findById(activeCustomerAggregate[0]._id);
            } else {
                customer = await Customer.findOne();
            }
        }

        // Fetch customer transactions for profile representation
        let userTransactions = [];
        if (customer) {
            userTransactions = await Transaction.find({
                customer: customer._id,
                status: "COMPLETED"
            }).populate("product", "name category description price aiTags seoKeywords embedding");
        }

        // Generate User Behavior Embedding Vector
        const userVector = generateUserBehaviorEmbedding(userTransactions);

        // Fetch vendor products excluding out-of-stock products (stock > 0)
        const products = await Product.find({
            vendor: vendorId,
            stock: { $gt: 0 }
        });

        if (products.length === 0) {
            return res.status(200).json({
                success: true,
                type: "VECTOR_SEMANTIC",
                message: "No in-stock products available for recommendation",
                recommendationBasis: "vector similarity on customer purchase history profile",
                count: 0,
                recommendations: []
            });
        }

        // Compute embeddings and similarity scores
        const scoredProducts = [];

        for (const product of products) {
            // Ensure product embedding is populated
            if (!Array.isArray(product.embedding) || product.embedding.length === 0) {
                product.embedding = await generateProductEmbedding(product);
                await product.save();
            }

            const similarity = calculateCosineSimilarity(userVector, product.embedding);

            // Extract purchase category context
            const purchasedCategories = [...new Set(
                userTransactions.map(t => t.product?.category).filter(Boolean)
            )];

            let reason = `Semantically matches user interest profile`;
            if (purchasedCategories.includes(product.category)) {
                reason = `Direct match with frequently purchased category: ${product.category}`;
            } else if (purchasedCategories.length > 0) {
                reason = `Cross-category recommendation based on interest in ${purchasedCategories.slice(0, 2).join(", ")}`;
            }

            scoredProducts.push({
                productId: product._id,
                name: product.name,
                category: product.category,
                price: product.price,
                stock: product.stock,
                imageUrl: product.imageUrl,
                similarityScore: parseFloat(similarity.toFixed(4)),
                matchPercentage: Math.min(100, Math.max(1, Math.round(similarity * 100) || 75)),
                reason
            });
        }

        // Sort by vector similarity score descending
        scoredProducts.sort((a, b) => b.similarityScore - a.similarityScore);

        const rankedRecommendations = scoredProducts.slice(0, limit).map((item, idx) => ({
            rank: idx + 1,
            ...item
        }));

        return res.status(200).json({
            success: true,
            type: "VECTOR_SEMANTIC",
            message: "Personalized vector search recommendations generated",
            recommendationBasis: "vector similarity on customer purchase history profile",
            customer: customer ? { id: customer._id, name: customer.name, email: customer.email } : null,
            count: rankedRecommendations.length,
            recommendations: rankedRecommendations
        });

    } catch (error) {
        console.error("Get vector recommendations error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while generating vector recommendations",
            error: error.message
        });
    }
};


// ================================================================
// ==================== EXPORT CONTROLLERS =========================
// ================================================================

module.exports = {
    getCategoryRecommendations,
    getAvailableCategories,
    getVectorRecommendations
};

