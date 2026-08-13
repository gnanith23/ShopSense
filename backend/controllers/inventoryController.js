// ==================== IMPORT MODELS ====================

const mongoose = require("mongoose");
const Product  = require("../models/Product");


// ================================================================
// ==================== STOCK STATUS HELPER ========================
// ================================================================

// Consistent stock-status thresholds used across all inventory APIs.
//
// OUT_OF_STOCK : stock === 0
// LOW_STOCK    : stock >= 1 && stock <= 5
// HEALTHY      : stock > 5
//
// These thresholds are set here as a single source of truth so that
// future changes only need to happen in one place.

const LOW_STOCK_THRESHOLD = 5;   // 1–5 inclusive → LOW_STOCK
const OUT_OF_STOCK_LEVEL  = 0;   // exactly 0      → OUT_OF_STOCK

const getStockStatus = (stock) => {
    if (stock <= OUT_OF_STOCK_LEVEL) return "OUT_OF_STOCK";
    if (stock <= LOW_STOCK_THRESHOLD) return "LOW_STOCK";
    return "HEALTHY";
};


// ================================================================
// ==================== GET ALL INVENTORY ==========================
// ================================================================

// GET /api/inventory
//
// Returns all products belonging to the authenticated vendor,
// annotated with their stock status.
const getInventory = async (req, res) => {

    try {

        const vendorId = req.vendorId;


        // ==================== FETCH PRODUCTS ====================

        const products = await Product.find({
            vendor: vendorId
        }).select(
            "_id name category stock price imageUrl vendor createdAt updatedAt"
        ).sort({ name: 1 });


        // ==================== BUILD RESPONSE ====================

        const inventory = products.map((p) => ({
            productId:   p._id,
            name:        p.name,
            category:    p.category,
            price:       p.price,
            stock:       p.stock,
            stockStatus: getStockStatus(p.stock),
            vendorId:    p.vendor,
            imageUrl:    p.imageUrl,
            updatedAt:   p.updatedAt
        }));


        return res.status(200).json({
            success: true,
            message: "Inventory retrieved successfully",
            count:   inventory.length,
            inventory
        });


    } catch (error) {

        console.error("Get inventory error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving inventory"
        });
    }
};


// ================================================================
// ==================== GET LOW-STOCK PRODUCTS =====================
// ================================================================

// GET /api/inventory/low-stock
//
// Returns products where stock is between 1 and LOW_STOCK_THRESHOLD
// (inclusive), i.e. stock >= 1 AND stock <= 5.
const getLowStock = async (req, res) => {

    try {

        const vendorId = req.vendorId;


        // ==================== QUERY ====================

        const products = await Product.find({
            vendor: vendorId,
            stock: {
                $gte: 1,
                $lte: LOW_STOCK_THRESHOLD
            }
        }).select(
            "_id name category stock price imageUrl vendor updatedAt"
        ).sort({ stock: 1 });


        // ==================== BUILD RESPONSE ====================

        const inventory = products.map((p) => ({
            productId:   p._id,
            name:        p.name,
            category:    p.category,
            price:       p.price,
            stock:       p.stock,
            stockStatus: "LOW_STOCK",
            vendorId:    p.vendor,
            imageUrl:    p.imageUrl,
            updatedAt:   p.updatedAt
        }));


        return res.status(200).json({
            success: true,
            message: "Low-stock products retrieved successfully",
            count:   inventory.length,
            inventory
        });


    } catch (error) {

        console.error("Get low-stock error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving low-stock products"
        });
    }
};


// ================================================================
// ==================== GET OUT-OF-STOCK PRODUCTS ==================
// ================================================================

// GET /api/inventory/out-of-stock
//
// Returns products where stock === 0.
const getOutOfStock = async (req, res) => {

    try {

        const vendorId = req.vendorId;


        // ==================== QUERY ====================

        const products = await Product.find({
            vendor: vendorId,
            stock:  0
        }).select(
            "_id name category stock price imageUrl vendor updatedAt"
        ).sort({ updatedAt: -1 });


        // ==================== BUILD RESPONSE ====================

        const inventory = products.map((p) => ({
            productId:   p._id,
            name:        p.name,
            category:    p.category,
            price:       p.price,
            stock:       p.stock,
            stockStatus: "OUT_OF_STOCK",
            vendorId:    p.vendor,
            imageUrl:    p.imageUrl,
            updatedAt:   p.updatedAt
        }));


        return res.status(200).json({
            success: true,
            message: "Out-of-stock products retrieved successfully",
            count:   inventory.length,
            inventory
        });


    } catch (error) {

        console.error("Get out-of-stock error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving out-of-stock products"
        });
    }
};


// ================================================================
// ==================== GET INVENTORY SUMMARY ======================
// ================================================================

// GET /api/inventory/summary
//
// Returns aggregated inventory metrics for the authenticated vendor:
//   - totalProducts     : total number of products
//   - totalStockUnits   : sum of all stock across all products
//   - lowStockCount     : products with stock 1–5
//   - outOfStockCount   : products with stock = 0
//   - healthyCount      : products with stock > 5
//
// Uses a single MongoDB aggregation pipeline for efficiency.
const getInventorySummary = async (req, res) => {

    try {

        const vendorId = req.vendorId;


        // ==================== AGGREGATION PIPELINE ====================

        // Single pipeline pass:
        //  1. $match    – restrict to this vendor's products
        //  2. $group    – compute totals and conditional counts
        const result = await Product.aggregate([

            // Step 1 – filter to this vendor only
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId)
                }
            },

            // Step 2 – aggregate counts in one pass
            {
                $group: {
                    _id: null,

                    totalProducts: {
                        $sum: 1
                    },

                    totalStockUnits: {
                        $sum: "$stock"
                    },

                    // Count products where stock === 0
                    outOfStockCount: {
                        $sum: {
                            $cond: [{ $eq: ["$stock", 0] }, 1, 0]
                        }
                    },

                    // Count products where stock is 1–5
                    lowStockCount: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $gte: ["$stock", 1] },
                                        { $lte: ["$stock", LOW_STOCK_THRESHOLD] }
                                    ]
                                },
                                1,
                                0
                            ]
                        }
                    },

                    // Count products where stock > 5
                    healthyCount: {
                        $sum: {
                            $cond: [
                                { $gt: ["$stock", LOW_STOCK_THRESHOLD] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]);


        // ==================== HANDLE NO PRODUCTS ====================

        // If vendor has no products, return zeros
        const summary = result.length > 0
            ? {
                totalProducts:   result[0].totalProducts,
                totalStockUnits: result[0].totalStockUnits,
                outOfStockCount: result[0].outOfStockCount,
                lowStockCount:   result[0].lowStockCount,
                healthyCount:    result[0].healthyCount
              }
            : {
                totalProducts:   0,
                totalStockUnits: 0,
                outOfStockCount: 0,
                lowStockCount:   0,
                healthyCount:    0
              };


        return res.status(200).json({
            success: true,
            message: "Inventory summary retrieved successfully",
            summary
        });


    } catch (error) {

        console.error("Get inventory summary error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving inventory summary"
        });
    }
};


// ================================================================
// ==================== EXPORT CONTROLLERS =========================
// ================================================================

module.exports = {
    getInventory,
    getLowStock,
    getOutOfStock,
    getInventorySummary
};
