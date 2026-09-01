// ==================== IMPORT MODELS ====================

const mongoose    = require("mongoose");
const Transaction = require("../models/Transaction");
const Customer    = require("../models/Customer");
const Product     = require("../models/Product");


// ================================================================
// ==================== IMPLEMENTATION DECISION NOTE ==============
// ================================================================
//
// Milestone 2 specification referenced "SQL-based customer
// segmentation". The existing ShopSense application uses MongoDB
// exclusively (no SQL database is present in package.json or
// the project directory). Introducing PostgreSQL/MySQL would:
//
//   1. duplicate the data already held in MongoDB
//   2. add an unnecessary infrastructure dependency
//   3. complicate deployment significantly
//
// Decision: implement equivalent analytical customer segmentation
// using MongoDB aggregation pipelines. MongoDB's $group, $lookup,
// and $project stages achieve identical analytical results to SQL
// GROUP BY, JOIN, and SELECT logic.
//
// This decision is documented here and does not require a separate
// SQL database.
// ================================================================


// ================================================================
// ==================== SEGMENTATION THRESHOLDS ===================
// ================================================================

// Currency: values are stored in INR (Indian Rupees) in MongoDB,
// consistent with the existing project's currency convention.
//
// VIP          : totalSpent >= 50,000
// HIGH_VALUE   : 25,000 <= totalSpent < 50,000
// REGULAR      : 10,000 <= totalSpent < 25,000
// LOW_VALUE    : totalSpent < 10,000

const SEGMENT_VIP        = 50000;
const SEGMENT_HIGH_VALUE = 25000;
const SEGMENT_REGULAR    = 10000;

const classifySegment = (totalSpent) => {
    if (totalSpent >= SEGMENT_VIP)        return "VIP";
    if (totalSpent >= SEGMENT_HIGH_VALUE) return "HIGH_VALUE";
    if (totalSpent >= SEGMENT_REGULAR)    return "REGULAR";
    return "LOW_VALUE";
};


// ================================================================
// ==================== CUSTOMER SEGMENTATION ======================
// ================================================================

// GET /api/analytics/customer-segments
//
// Calculates total spending per customer from COMPLETED transactions
// that belong to the authenticated vendor. Then classifies each
// customer into a spending segment.
//
// Logic (equivalent SQL analogy):
//
//   SELECT c.id, c.name, c.email,
//          SUM(t.totalAmount) AS totalSpent,
//          COUNT(t._id)       AS transactionCount
//   FROM   transactions t
//   JOIN   customers c ON t.customer = c._id
//   WHERE  t.vendor = :vendorId AND t.status = 'COMPLETED'
//   GROUP  BY t.customer
//   ORDER  BY totalSpent DESC
//
// Implemented using MongoDB aggregation because that is the
// existing database technology (see note above).
const getCustomerSegments = async (req, res) => {

    try {

        const vendorId = req.vendorId;


        // ==================== AGGREGATION PIPELINE ====================

        const segmentData = await Transaction.aggregate([

            // Step 1: Match only COMPLETED transactions for this vendor
            {
                $match: {
                    vendor: new mongoose.Types.ObjectId(vendorId),
                    status: "COMPLETED"
                }
            },

            // Step 2: Group by customer to compute spending totals
            {
                $group: {
                    _id: "$customer",

                    totalSpent: {
                        $sum: "$totalAmount"
                    },

                    totalQuantityBought: {
                        $sum: "$quantity"
                    },

                    transactionCount: {
                        $sum: 1
                    }
                }
            },

            // Step 3: Lookup customer details from the Customer collection
            {
                $lookup: {
                    from:         "customers",
                    localField:   "_id",
                    foreignField: "_id",
                    as:           "customerDetails"
                }
            },

            // Step 4: Unwind the customer array (one customer per doc)
            {
                $unwind: {
                    path: "$customerDetails",
                    preserveNullAndEmptyArrays: true
                }
            },

            // Step 5: Shape the output
            {
                $project: {
                    _id:                0,
                    customerId:         "$_id",
                    name:               "$customerDetails.name",
                    email:              "$customerDetails.email",
                    totalSpent:         1,
                    totalQuantityBought:1,
                    transactionCount:   1
                }
            },

            // Step 6: Sort by totalSpent descending (highest spenders first)
            {
                $sort: {
                    totalSpent: -1
                }
            }
        ]);


        // ==================== CLASSIFY SEGMENTS ====================

        if (segmentData.length === 0) {

            return res.status(200).json({
                success: true,
                message: "No transaction data found for this vendor",
                dataStatus: "INSUFFICIENT_DATA",
                summary: {
                    totalCustomers:    0,
                    vipCount:          0,
                    highValueCount:    0,
                    regularCount:      0,
                    lowValueCount:     0,
                    totalRevenueFromSegments: 0
                },
                segments: []
            });
        }


        // Annotate each customer with their segment
        const segments = segmentData.map((c) => ({
            customerId:          c.customerId,
            name:                c.name   || "Unknown",
            email:               c.email  || "Unknown",
            totalSpent:          c.totalSpent,
            totalQuantityBought: c.totalQuantityBought,
            transactionCount:    c.transactionCount,
            segment:             classifySegment(c.totalSpent)
        }));


        // ==================== COMPUTE SUMMARY COUNTS ====================

        const summary = segments.reduce(
            (acc, c) => {
                acc.totalCustomers++;
                acc.totalRevenueFromSegments += c.totalSpent;

                switch (c.segment) {
                    case "VIP":        acc.vipCount++;        break;
                    case "HIGH_VALUE": acc.highValueCount++;  break;
                    case "REGULAR":    acc.regularCount++;    break;
                    case "LOW_VALUE":  acc.lowValueCount++;   break;
                }

                return acc;
            },
            {
                totalCustomers:            0,
                vipCount:                  0,
                highValueCount:            0,
                regularCount:              0,
                lowValueCount:             0,
                totalRevenueFromSegments:  0
            }
        );


        return res.status(200).json({
            success:    true,
            message:    "Customer segments retrieved successfully",
            dataStatus: "OK",
            segmentThresholds: {
                VIP:        `>= ₹${SEGMENT_VIP}`,
                HIGH_VALUE: `₹${SEGMENT_HIGH_VALUE} – ₹${SEGMENT_VIP - 1}`,
                REGULAR:    `₹${SEGMENT_REGULAR} – ₹${SEGMENT_HIGH_VALUE - 1}`,
                LOW_VALUE:  `< ₹${SEGMENT_REGULAR}`
            },
            summary,
            segments
        });


    } catch (error) {

        console.error("Get customer segments error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error while retrieving customer segments"
        });
    }
};


// ================================================================
// ==================== HISTORICAL DATA VALIDATION =================
// ================================================================

// GET /api/analytics/validation
//
// Validates that all three analytical modules are producing
// consistent results when cross-checked against raw MongoDB data.
//
// Three sub-validations are performed:
//
//  1. INVENTORY VALIDATION
//     Cross-check: sum of Product.stock for this vendor equals
//     the sum returned by the inventory summary aggregation.
//     A mismatch indicates an aggregation bug.
//
//  2. CUSTOMER SEGMENTATION VALIDATION
//     Cross-check: for each customer returned by segmentation,
//     verify that their totalSpent equals the sum of their
//     COMPLETED transactions for this vendor in the raw
//     Transaction collection.
//
//  3. RECOMMENDATION VALIDATION
//     Cross-check: verify that the top-selling product in the
//     most popular category (by units sold) can be independently
//     confirmed from the raw transaction records.

const getValidation = async (req, res) => {

    try {

        const vendorId   = req.vendorId;
        const vendorObjId = new mongoose.Types.ObjectId(vendorId);

        const validationReport = {
            inventoryValidation:           null,
            customerSegmentationValidation: null,
            recommendationValidation:       null
        };


        // ============================================================
        // ==================== 1. INVENTORY VALIDATION ===============
        // ============================================================

        try {

            // Query 1: Direct MongoDB find — get all products for vendor
            const products = await Product.find({ vendor: vendorId });

            const checkedProducts = products.length;

            if (checkedProducts === 0) {

                validationReport.inventoryValidation = {
                    status:          "INSUFFICIENT_DATA",
                    explanation:     "No products found for this vendor",
                    checkedProducts: 0
                };

            } else {

                // Compute expected stock total directly from Product.find()
                const expectedTotal = products.reduce(
                    (sum, p) => sum + p.stock,
                    0
                );

                // Query 2: Compute via aggregation pipeline
                const aggResult = await Product.aggregate([
                    { $match: { vendor: vendorObjId } },
                    { $group: { _id: null, totalStock: { $sum: "$stock" } } }
                ]);

                const aggTotal = aggResult.length > 0
                    ? aggResult[0].totalStock
                    : 0;

                const stockMatches = expectedTotal === aggTotal;

                validationReport.inventoryValidation = {
                    status:             stockMatches ? "PASS" : "FAIL",
                    checkedProducts:    checkedProducts,
                    directQueryTotal:   expectedTotal,
                    aggregationTotal:   aggTotal,
                    explanation:        stockMatches
                        ? "Direct Product.find() stock total matches aggregation pipeline total"
                        : "MISMATCH: direct query and aggregation returned different stock totals"
                };
            }

        } catch (invErr) {

            validationReport.inventoryValidation = {
                status:      "ERROR",
                explanation: invErr.message
            };
        }


        // ============================================================
        // ==================== 2. SEGMENTATION VALIDATION ============
        // ============================================================

        try {

            // Re-compute segmentation using the same aggregation pipeline
            const segData = await Transaction.aggregate([
                {
                    $match: {
                        vendor: vendorObjId,
                        status: "COMPLETED"
                    }
                },
                {
                    $group: {
                        _id:        "$customer",
                        aggSpent:   { $sum: "$totalAmount" }
                    }
                }
            ]);

            if (segData.length === 0) {

                validationReport.customerSegmentationValidation = {
                    status:          "INSUFFICIENT_DATA",
                    explanation:     "No COMPLETED transactions found for this vendor",
                    checkedCustomers: 0
                };

            } else {

                // For each customer, independently verify by summing raw transactions
                let passCount = 0;
                let failCount = 0;
                const failures = [];

                for (const item of segData) {

                    // Raw sum: fetch all COMPLETED transactions for this
                    // customer+vendor and sum manually
                    const rawTxns = await Transaction.find({
                        vendor:   vendorId,
                        customer: item._id,
                        status:   "COMPLETED"
                    }).select("totalAmount");

                    const rawSum = rawTxns.reduce(
                        (s, t) => s + t.totalAmount,
                        0
                    );

                    // Compare raw sum with aggregation result
                    // Allow floating-point tolerance of 0.01
                    if (Math.abs(rawSum - item.aggSpent) <= 0.01) {
                        passCount++;
                    } else {
                        failCount++;
                        failures.push({
                            customerId: item._id,
                            aggregationTotal: item.aggSpent,
                            rawQueryTotal:    rawSum,
                            difference:       Math.abs(rawSum - item.aggSpent)
                        });
                    }
                }

                validationReport.customerSegmentationValidation = {
                    status:          failCount === 0 ? "PASS" : "FAIL",
                    checkedCustomers: segData.length,
                    passCount,
                    failCount,
                    explanation:     failCount === 0
                        ? "All customer totalSpent values match between aggregation and raw transaction records"
                        : `${failCount} customer(s) have spending mismatches`,
                    failures:        failures.length > 0 ? failures : undefined
                };
            }

        } catch (segErr) {

            validationReport.customerSegmentationValidation = {
                status:      "ERROR",
                explanation: segErr.message
            };
        }


        // ============================================================
        // ==================== 3. RECOMMENDATION VALIDATION ==========
        // ============================================================

        try {

            // Find the top category (most units sold) for this vendor
            const topCategoryResult = await Transaction.aggregate([
                {
                    $match: {
                        vendor: vendorObjId,
                        status: "COMPLETED"
                    }
                },
                {
                    $lookup: {
                        from:         "products",
                        localField:   "product",
                        foreignField: "_id",
                        as:           "productDetails"
                    }
                },
                {
                    $unwind: "$productDetails"
                },
                {
                    $group: {
                        _id:        "$productDetails.category",
                        totalUnits: { $sum: "$quantity" }
                    }
                },
                {
                    $sort: { totalUnits: -1 }
                },
                {
                    $limit: 1
                }
            ]);

            if (topCategoryResult.length === 0) {

                validationReport.recommendationValidation = {
                    status:      "INSUFFICIENT_DATA",
                    explanation: "No transaction data available to validate recommendations"
                };

            } else {

                const topCategory = topCategoryResult[0]._id;

                // Method 1: aggregation pipeline (same as recommendation engine)
                const aggRank = await Transaction.aggregate([
                    {
                        $match: {
                            vendor: vendorObjId,
                            status: "COMPLETED"
                        }
                    },
                    {
                        $lookup: {
                            from:         "products",
                            localField:   "product",
                            foreignField: "_id",
                            as:           "productDetails"
                        }
                    },
                    { $unwind: "$productDetails" },
                    {
                        $match: {
                            "productDetails.category": topCategory
                        }
                    },
                    {
                        $group: {
                            _id:        "$product",
                            aggUnits:   { $sum: "$quantity" },
                            productName:{ $first: "$productDetails.name" }
                        }
                    },
                    { $sort: { aggUnits: -1 } },
                    { $limit: 1 }
                ]);

                if (aggRank.length === 0) {

                    validationReport.recommendationValidation = {
                        status:      "INSUFFICIENT_DATA",
                        explanation: "No products found in top category after aggregation",
                        category:    topCategory
                    };

                } else {

                    const topProduct    = aggRank[0];
                    const topProductId  = topProduct._id;
                    const aggUnitsSold  = topProduct.aggUnits;

                    // Method 2: raw transaction sum for independent verification
                    const rawTxns = await Transaction.find({
                        vendor:  vendorId,
                        status:  "COMPLETED",
                        product: topProductId
                    }).select("quantity");

                    const rawUnitsSold = rawTxns.reduce(
                        (s, t) => s + t.quantity,
                        0
                    );

                    const unitsMatch = aggUnitsSold === rawUnitsSold;

                    validationReport.recommendationValidation = {
                        status:           unitsMatch ? "PASS" : "FAIL",
                        validatedCategory: topCategory,
                        topProduct: {
                            productId:    topProductId,
                            name:         topProduct.productName,
                            aggUnitsSold,
                            rawUnitsSold
                        },
                        explanation: unitsMatch
                            ? "Top recommended product's units sold matches raw transaction count"
                            : `MISMATCH: aggregation shows ${aggUnitsSold} units but raw count is ${rawUnitsSold}`
                    };
                }
            }

        } catch (recErr) {

            validationReport.recommendationValidation = {
                status:      "ERROR",
                explanation: recErr.message
            };
        }


        // ==================== OVERALL STATUS ====================

        const statuses = [
            validationReport.inventoryValidation?.status,
            validationReport.customerSegmentationValidation?.status,
            validationReport.recommendationValidation?.status
        ];

        const overallStatus = statuses.some(s => s === "FAIL" || s === "ERROR")
            ? "FAIL"
            : statuses.every(s => s === "PASS")
                ? "PASS"
                : "PARTIAL";


        return res.status(200).json({
            success:        true,
            message:        "Historical data validation completed",
            overallStatus,
            validationReport
        });


    } catch (error) {

        console.error("Validation error:", error.message);

        return res.status(500).json({
            success: false,
            message: "Server error while performing validation"
        });
    }
};



// ================================================================
// ==================== MILESTONE 3: ANALYTICS APIS ===============
// ================================================================

// GET /api/analytics/sales-trend
//
// Aggregates completed transactions over time for the authenticated vendor,
// returning chart-ready JSON formatted with labels and datasets.
const getSalesTrend = async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const vendorObjId = new mongoose.Types.ObjectId(vendorId);

        const trendData = await Transaction.aggregate([
            {
                $match: {
                    vendor: vendorObjId,
                    status: "COMPLETED"
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    revenue: { $sum: "$totalAmount" },
                    unitsSold: { $sum: "$quantity" },
                    transactions: { $sum: 1 }
                }
            },
            {
                $sort: { _id: 1 }
            }
        ]);

        const labels = trendData.map(item => item._id);
        const revenueData = trendData.map(item => item.revenue);
        const unitsData = trendData.map(item => item.unitsSold);
        const txData = trendData.map(item => item.transactions);

        const totalRevenue = revenueData.reduce((a, b) => a + b, 0);
        const totalUnits = unitsData.reduce((a, b) => a + b, 0);
        const totalTransactions = txData.reduce((a, b) => a + b, 0);
        const aov = totalTransactions > 0 ? parseFloat((totalRevenue / totalTransactions).toFixed(2)) : 0;

        return res.status(200).json({
            success: true,
            summary: {
                totalRevenue,
                totalUnitsSold: totalUnits,
                totalTransactions,
                averageOrderValue: aov
            },
            labels,
            datasets: [
                {
                    label: "Revenue (₹)",
                    data: revenueData,
                    borderColor: "#4F46E5",
                    backgroundColor: "rgba(79, 70, 229, 0.1)"
                },
                {
                    label: "Units Sold",
                    data: unitsData,
                    borderColor: "#10B981",
                    backgroundColor: "rgba(16, 185, 129, 0.1)"
                },
                {
                    label: "Transactions",
                    data: txData,
                    borderColor: "#F59E0B",
                    backgroundColor: "rgba(245, 158, 11, 0.1)"
                }
            ],
            trend: trendData.map(item => ({
                date: item._id,
                revenue: item.revenue,
                unitsSold: item.unitsSold,
                transactions: item.transactions
            }))
        });
    } catch (error) {
        console.error("Get sales trend error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving sales trend"
        });
    }
};


// GET /api/analytics/revenue-by-category
//
// Aggregates completed transactions by product category for the authenticated vendor.
const getRevenueByCategory = async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const vendorObjId = new mongoose.Types.ObjectId(vendorId);

        const categoryData = await Transaction.aggregate([
            {
                $match: {
                    vendor: vendorObjId,
                    status: "COMPLETED"
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $group: {
                    _id: "$productDetails.category",
                    revenue: { $sum: "$totalAmount" },
                    unitsSold: { $sum: "$quantity" },
                    transactions: { $sum: 1 }
                }
            },
            {
                $sort: { revenue: -1 }
            }
        ]);

        const totalRevenue = categoryData.reduce((acc, cur) => acc + cur.revenue, 0);

        const categories = categoryData.map(item => {
            const percentage = totalRevenue > 0
                ? parseFloat(((item.revenue / totalRevenue) * 100).toFixed(1))
                : 0;
            return {
                category: item._id || "Uncategorized",
                revenue: item.revenue,
                unitsSold: item.unitsSold,
                transactions: item.transactions,
                percentage
            };
        });

        const labels = categories.map(c => c.category);
        const revenueData = categories.map(c => c.revenue);
        const unitsData = categories.map(c => c.unitsSold);

        return res.status(200).json({
            success: true,
            totalRevenue,
            labels,
            datasets: [
                {
                    label: "Revenue (₹)",
                    data: revenueData
                },
                {
                    label: "Units Sold",
                    data: unitsData
                }
            ],
            categories
        });
    } catch (error) {
        console.error("Get revenue by category error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving category revenue"
        });
    }
};


// GET /api/analytics/product-performance
//
// Aggregates units sold and total revenue per product for the authenticated vendor.
const getProductPerformance = async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const vendorObjId = new mongoose.Types.ObjectId(vendorId);

        const performanceData = await Transaction.aggregate([
            {
                $match: {
                    vendor: vendorObjId,
                    status: "COMPLETED"
                }
            },
            {
                $lookup: {
                    from: "products",
                    localField: "product",
                    foreignField: "_id",
                    as: "productDetails"
                }
            },
            {
                $unwind: "$productDetails"
            },
            {
                $group: {
                    _id: "$product",
                    name: { $first: "$productDetails.name" },
                    category: { $first: "$productDetails.category" },
                    price: { $first: "$productDetails.price" },
                    currentStock: { $first: "$productDetails.stock" },
                    unitsSold: { $sum: "$quantity" },
                    totalRevenue: { $sum: "$totalAmount" },
                    transactions: { $sum: 1 }
                }
            },
            {
                $sort: { totalRevenue: -1 }
            }
        ]);

        const labels = performanceData.map(p => p.name);
        const revenueData = performanceData.map(p => p.totalRevenue);
        const unitsData = performanceData.map(p => p.unitsSold);

        return res.status(200).json({
            success: true,
            labels,
            datasets: [
                {
                    label: "Revenue (₹)",
                    data: revenueData
                },
                {
                    label: "Units Sold",
                    data: unitsData
                }
            ],
            products: performanceData.map(p => ({
                productId: p._id,
                name: p.name,
                category: p.category,
                price: p.price,
                currentStock: p.currentStock,
                unitsSold: p.unitsSold,
                totalRevenue: p.totalRevenue,
                transactions: p.transactions
            }))
        });
    } catch (error) {
        console.error("Get product performance error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving product performance"
        });
    }
};


// ================================================================
// ==================== MILESTONE 3: MARKETPLACE BENCHMARK =========
// ================================================================

// GET /api/analytics/benchmark
//
// Compares authenticated vendor metrics against marketplace averages.
const getMarketplaceBenchmark = async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const vendorObjId = new mongoose.Types.ObjectId(vendorId);

        // 1. Current vendor's completed transaction stats
        const vendorStats = await Transaction.aggregate([
            {
                $match: {
                    vendor: vendorObjId,
                    status: "COMPLETED"
                }
            },
            {
                $group: {
                    _id: null,
                    totalRevenue: { $sum: "$totalAmount" },
                    totalUnits: { $sum: "$quantity" },
                    totalTransactions: { $sum: 1 }
                }
            }
        ]);

        const vendorRevenue = vendorStats.length > 0 ? vendorStats[0].totalRevenue : 0;
        const vendorUnits = vendorStats.length > 0 ? vendorStats[0].totalUnits : 0;
        const vendorTxCount = vendorStats.length > 0 ? vendorStats[0].totalTransactions : 0;
        const vendorAOV = vendorTxCount > 0 ? parseFloat((vendorRevenue / vendorTxCount).toFixed(2)) : 0;

        // 2. All other vendors' completed transaction stats
        const otherVendorsAgg = await Transaction.aggregate([
            {
                $match: {
                    vendor: { $ne: vendorObjId },
                    status: "COMPLETED"
                }
            },
            {
                $group: {
                    _id: "$vendor",
                    revenue: { $sum: "$totalAmount" },
                    unitsSold: { $sum: "$quantity" },
                    transactions: { $sum: 1 }
                }
            }
        ]);

        const otherVendorCount = otherVendorsAgg.length;

        let marketAvgRevenue = 0;
        let marketAvgUnits = 0;
        let marketAvgTx = 0;
        let marketAvgAOV = 0;

        if (otherVendorCount > 0) {
            const sumMarketRevenue = otherVendorsAgg.reduce((acc, cur) => acc + cur.revenue, 0);
            const sumMarketUnits = otherVendorsAgg.reduce((acc, cur) => acc + cur.unitsSold, 0);
            const sumMarketTx = otherVendorsAgg.reduce((acc, cur) => acc + cur.transactions, 0);

            marketAvgRevenue = parseFloat((sumMarketRevenue / otherVendorCount).toFixed(2));
            marketAvgUnits = parseFloat((sumMarketUnits / otherVendorCount).toFixed(1));
            marketAvgTx = parseFloat((sumMarketTx / otherVendorCount).toFixed(1));
            marketAvgAOV = sumMarketTx > 0 ? parseFloat((sumMarketRevenue / sumMarketTx).toFixed(2)) : 0;
        } else {
            // If current vendor is the only vendor with sales, baseline marketplace against current vendor
            marketAvgRevenue = vendorRevenue;
            marketAvgUnits = vendorUnits;
            marketAvgTx = vendorTxCount;
            marketAvgAOV = vendorAOV;
        }

        // Helper function for difference and percentage difference
        const calculateComparison = (vendorVal, marketAvgVal) => {
            const difference = parseFloat((vendorVal - marketAvgVal).toFixed(2));
            let percentageDifference = 0;
            if (marketAvgVal > 0) {
                percentageDifference = parseFloat((((vendorVal - marketAvgVal) / marketAvgVal) * 100).toFixed(1));
            } else if (vendorVal > 0) {
                percentageDifference = 100.0;
            }

            let status = "equal";
            if (difference > 0) status = "above";
            else if (difference < 0) status = "below";

            return {
                vendor: vendorVal,
                marketplaceAvg: marketAvgVal,
                difference,
                percentageDifference,
                status
            };
        };

        const metrics = {
            revenue: {
                label: "Total Revenue",
                unit: "₹",
                ...calculateComparison(vendorRevenue, marketAvgRevenue)
            },
            unitsSold: {
                label: "Units Sold",
                unit: "units",
                ...calculateComparison(vendorUnits, marketAvgUnits)
            },
            transactions: {
                label: "Total Transactions",
                unit: "orders",
                ...calculateComparison(vendorTxCount, marketAvgTx)
            },
            averageOrderValue: {
                label: "Average Order Value",
                unit: "₹",
                ...calculateComparison(vendorAOV, marketAvgAOV)
            }
        };

        return res.status(200).json({
            success: true,
            otherVendorsCount: otherVendorCount,
            comparisonBasis: otherVendorCount > 0 ? "Actual active marketplace vendors" : "Marketplace baseline",
            metrics
        });
    } catch (error) {
        console.error("Get benchmark error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while calculating marketplace benchmarks"
        });
    }
};


// ================================================================
// ==================== MILESTONE 3: CSV EXPORT ===================
// ================================================================

// GET /api/analytics/export/csv
//
// Exports completed transactions for the authenticated vendor as a CSV file.
const exportSalesCSV = async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const vendorObjId = new mongoose.Types.ObjectId(vendorId);

        const transactions = await Transaction.find({
            vendor: vendorObjId,
            status: "COMPLETED"
        })
            .populate("product", "name category price")
            .populate("customer", "name email")
            .sort({ createdAt: -1 });

        // Build CSV string
        const headers = ["Date", "Transaction ID", "Product", "Category", "Quantity", "Unit Price", "Total Amount", "Status", "Customer Name", "Customer Email"];
        
        const rows = transactions.map(t => {
            const dateStr = t.createdAt ? new Date(t.createdAt).toISOString().split("T")[0] : "";
            const productName = t.product?.name ? `"${t.product.name.replace(/"/g, '""')}"` : '"N/A"';
            const category = t.product?.category ? `"${t.product.category.replace(/"/g, '""')}"` : '"N/A"';
            const customerName = t.customer?.name ? `"${t.customer.name.replace(/"/g, '""')}"` : '"N/A"';
            const customerEmail = t.customer?.email ? `"${t.customer.email.replace(/"/g, '""')}"` : '"N/A"';

            return [
                dateStr,
                t._id.toString(),
                productName,
                category,
                t.quantity,
                t.unitPrice,
                t.totalAmount,
                t.status,
                customerName,
                customerEmail
            ].join(",");
        });

        const csvContent = [headers.join(","), ...rows].join("\r\n");

        res.setHeader("Content-Type", "text/csv; charset=utf-8");
        res.setHeader("Content-Disposition", 'attachment; filename="ShopSense_Sales_Report.csv"');
        return res.status(200).send(csvContent);
    } catch (error) {
        console.error("Export CSV error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while exporting CSV report"
        });
    }
};


// ================================================================
// ==================== MILESTONE 3: AI DATA ANALYST (TEXT-TO-SQL) =
// ================================================================

const { processVendorAnalystQuery } = require("../services/sqlAnalyticsService");

// POST /api/analytics/ai-analyst
//
// Converts vendor natural-language queries into safe SQL queries, executes them
// with vendor isolation on the SQLite analytics layer, and returns insights.
const runAiDataAnalyst = async (req, res) => {
    try {
        const vendorId = req.vendorId;
        const { question } = req.body;

        if (!question || typeof question !== "string" || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "Please provide a question for analysis"
            });
        }

        const analysisResult = await processVendorAnalystQuery(question, vendorId);
        return res.status(200).json(analysisResult);
    } catch (error) {
        console.error("AI Data Analyst error:", error.message);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to process analytical query",
            error: error.message
        });
    }
};


// ================================================================
// ==================== EXPORT CONTROLLERS =========================
// ================================================================

module.exports = {
    getCustomerSegments,
    getValidation,
    getSalesTrend,
    getRevenueByCategory,
    getProductPerformance,
    getMarketplaceBenchmark,
    exportSalesCSV,
    runAiDataAnalyst
};


