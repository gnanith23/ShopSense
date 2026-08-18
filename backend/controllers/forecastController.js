// ==================== IMPORT MODELS & SERVICES ====================

const mongoose = require("mongoose");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const { forecastProductDemand } = require("../services/forecastService");


// =========================================================================
// ==================== FORECAST SINGLE PRODUCT ============================
// =========================================================================

// GET /api/forecast/product/:productId
// GET /api/forecast/product/:productId?horizon=7
//
// Generates a time-series inventory demand forecast for a single product.
// Vendor-isolated: checks that the product belongs to the authenticated vendor.
const getProductForecast = async (req, res) => {

    try {

        const vendorId = req.vendorId;
        const productId = req.params.productId;


        // ==================== 1. VALIDATE PRODUCT ID ====================

        if (!mongoose.Types.ObjectId.isValid(productId)) {
            return res.status(400).json({
                success: false,
                message: "Invalid product ID format"
            });
        }


        // ==================== 2. VERIFY PRODUCT OWNERSHIP ================

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }

        if (product.vendor.toString() !== vendorId.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized: You can only generate demand forecasts for your own products"
            });
        }


        // ==================== 3. PARSE & VALIDATE HORIZON ================

        let horizon = parseInt(req.query.horizon, 10);
        if (Number.isNaN(horizon) || horizon <= 0) {
            horizon = 7; // Default 7 days
        }

        if (horizon > 90) {
            return res.status(400).json({
                success: false,
                message: "Forecast horizon cannot exceed 90 days"
            });
        }


        // ==================== 4. FETCH COMPLETED TRANSACTIONS ============

        const transactions = await Transaction.find({
            vendor: vendorId,
            product: productId,
            status: "COMPLETED"
        }).sort({ createdAt: 1 });


        // ==================== 5. RUN FORECAST ENGINE =====================

        const result = forecastProductDemand({
            product,
            transactions,
            horizon
        });


        return res.status(200).json(result);


    } catch (error) {

        console.error("Get product forecast error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error while generating demand forecast"
        });
    }
};


// =========================================================================
// ==================== FORECAST ALL VENDOR PRODUCTS =======================
// =========================================================================

// GET /api/forecast
// GET /api/forecast?horizon=7&limit=20
//
// Returns demand forecasts and restock recommendations across all products
// for the authenticated vendor.
const getVendorForecasts = async (req, res) => {

    try {

        const vendorId = req.vendorId;


        // ==================== PARSE QUERY PARAMS ====================

        let horizon = parseInt(req.query.horizon, 10);
        if (Number.isNaN(horizon) || horizon <= 0) {
            horizon = 7;
        }

        if (horizon > 90) {
            return res.status(400).json({
                success: false,
                message: "Forecast horizon cannot exceed 90 days"
            });
        }

        let limit = parseInt(req.query.limit, 10);
        if (Number.isNaN(limit) || limit <= 0) {
            limit = 20;
        }

        if (limit > 50) {
            limit = 50; // Cap at max 50 products per request
        }


        // ==================== FETCH VENDOR PRODUCTS ====================

        const products = await Product.find({ vendor: vendorId }).limit(limit);

        if (products.length === 0) {
            return res.status(200).json({
                success: true,
                status: "NO_PRODUCTS",
                message: "No products found for this vendor",
                summary: {
                    totalProducts: 0,
                    forecastedProducts: 0,
                    productsWithShortage: 0,
                    productsWithSufficientStock: 0,
                    insufficientDataProducts: 0
                },
                forecasts: []
            });
        }


        // ==================== RUN FORECAST FOR EACH PRODUCT ============

        const forecasts = [];
        let productsWithShortage = 0;
        let productsWithSufficientStock = 0;
        let insufficientDataProducts = 0;
        let maxPredictedDemand = -1;
        let highestPredictedDemandProduct = null;

        for (const product of products) {

            const transactions = await Transaction.find({
                vendor: vendorId,
                product: product._id,
                status: "COMPLETED"
            }).sort({ createdAt: 1 });

            const result = forecastProductDemand({
                product,
                transactions,
                horizon
            });

            forecasts.push(result);

            if (result.status === "INSUFFICIENT_DATA") {
                insufficientDataProducts++;
            } else if (result.status === "SUCCESS") {
                if (result.restock.recommended) {
                    productsWithShortage++;
                } else {
                    productsWithSufficientStock++;
                }

                if (result.forecast.totalPredictedDemand > maxPredictedDemand) {
                    maxPredictedDemand = result.forecast.totalPredictedDemand;
                    highestPredictedDemandProduct = {
                        productId: product._id,
                        name: product.name,
                        totalPredictedDemand: result.forecast.totalPredictedDemand
                    };
                }
            }
        }


        return res.status(200).json({
            success: true,
            status: "SUCCESS",
            message: "Vendor product demand forecasts generated",
            horizonDays: horizon,
            summary: {
                totalProducts: products.length,
                forecastedProducts: forecasts.filter(f => f.status === "SUCCESS").length,
                productsWithShortage,
                productsWithSufficientStock,
                insufficientDataProducts,
                highestPredictedDemandProduct
            },
            forecasts
        });


    } catch (error) {

        console.error("Get vendor forecasts error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error while generating vendor forecasts"
        });
    }
};


// ==================== EXPORT CONTROLLERS ====================

module.exports = {
    getProductForecast,
    getVendorForecasts
};
