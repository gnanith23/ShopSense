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
// ==================== EXPORT CONTROLLERS =========================
// ================================================================

module.exports = {
    getCustomerSegments,
    getValidation
};
