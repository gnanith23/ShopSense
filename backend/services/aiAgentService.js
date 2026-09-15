/**
 * ShopSense - Autonomous Weekly Vendor Analysis Agent Service
 * ============================================================
 * An autonomous agent workflow that:
 * 1. Collects store, inventory, and transaction data for each vendor
 * 2. Analyzes metrics, stock thresholds, and sales trends
 * 3. Generates strategic business recommendations using OpenRouter / LLM
 *    (with a rule-based fallback if AI is unreachable)
 * 4. Assembles a structured vendor business report
 * 5. Delivers the report via Nodemailer email service
 * 
 * Strict safety & vendor data isolation:
 * - Vendor A's queries are strictly filtered with { vendor: vendorId }
 * - Never exposes credentials or secrets
 * - Handles empty stores and zero sales gracefully without crashing
 */

const axios = require("axios");
const Vendor = require("../models/Vendor");
const Product = require("../models/Product");
const Transaction = require("../models/Transaction");
const { forecastProductDemand } = require("./forecastService");
const { sendVendorWeeklyReportEmail } = require("./emailService");

const OPENROUTER_MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "openai/gpt-oss-20b:free",
    "openrouter/auto"
];

// =========================================================================
// STAGE 1: COLLECT DATA
// =========================================================================

async function collectVendorData(vendorId) {
    const vendor = await Vendor.findById(vendorId).select("-password");
    if (!vendor) {
        throw new Error(`Vendor with ID ${vendorId} not found`);
    }

    // 1. Fetch vendor products (Strict data isolation)
    const products = await Product.find({ vendor: vendorId }).sort({ createdAt: -1 });

    // 2. Fetch completed transactions for this vendor (Strict data isolation)
    const allTransactions = await Transaction.find({
        vendor: vendorId,
        status: "COMPLETED"
    }).sort({ createdAt: -1 });

    // Define 7-day windows: current period and previous period
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const recentTransactions = allTransactions.filter(
        tx => new Date(tx.createdAt) >= sevenDaysAgo
    );

    const previousTransactions = allTransactions.filter(
        tx => new Date(tx.createdAt) >= fourteenDaysAgo && new Date(tx.createdAt) < sevenDaysAgo
    );

    // 3. Compute sales per product over last 7 days
    const recentSalesMap = {};
    recentTransactions.forEach(tx => {
        const pId = tx.product?.toString();
        if (pId) {
            recentSalesMap[pId] = (recentSalesMap[pId] || 0) + (tx.quantity || 1);
        }
    });

    // 4. Compute forecast for top products
    const forecasts = [];
    for (const prod of products.slice(0, 5)) {
        const prodTx = allTransactions.filter(
            tx => tx.product && tx.product.toString() === prod._id.toString()
        );
        try {
            const fc = forecastProductDemand({ product: prod, transactions: prodTx, horizon: 7 });
            if (fc && fc.success) {
                forecasts.push(fc);
            }
        } catch (e) {
            // Non-blocking: forecasting is an enhancement
        }
    }

    return {
        vendor,
        products,
        allTransactions,
        recentTransactions,
        previousTransactions,
        recentSalesMap,
        forecasts
    };
}

// =========================================================================
// STAGE 2: ANALYZE STORE METRICS
// =========================================================================

function analyzeStoreMetrics(collectedData) {
    const {
        products,
        recentTransactions,
        previousTransactions,
        recentSalesMap,
        forecasts
    } = collectedData;

    // Inventory segmentation
    const lowStockProducts = [];
    const outOfStockProducts = [];
    const healthyStockProducts = [];
    const highStockLowSalesProducts = [];

    products.forEach(p => {
        const stock = p.stock || 0;
        const recentSold = recentSalesMap[p._id.toString()] || 0;

        if (stock === 0) {
            outOfStockProducts.push(p);
        } else if (stock <= 5) {
            lowStockProducts.push(p);
        } else {
            healthyStockProducts.push(p);
        }

        // High stock (>= 15) but very few sales (<= 1) in past week
        if (stock >= 15 && recentSold <= 1) {
            highStockLowSalesProducts.push({
                product: p,
                stock,
                recentSold
            });
        }
    });

    // Revenue calculations
    const recentRevenue = recentTransactions.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);
    const previousRevenue = previousTransactions.reduce((sum, tx) => sum + (tx.totalAmount || 0), 0);

    let revenueGrowth = 0;
    if (previousRevenue > 0) {
        revenueGrowth = Math.round(((recentRevenue - previousRevenue) / previousRevenue) * 100);
    }

    // Category breakdown
    const categorySales = {};
    recentTransactions.forEach(tx => {
        const cat = tx.category || "General";
        categorySales[cat] = (categorySales[cat] || 0) + (tx.totalAmount || 0);
    });

    const topCategoryEntry = Object.entries(categorySales).sort((a, b) => b[1] - a[1])[0];
    const topCategory = topCategoryEntry ? topCategoryEntry[0] : (products[0]?.category || "None");

    // Findings bullets
    const importantFindings = [];

    if (products.length === 0) {
        importantFindings.push("Your store currently has no products listed in the catalog.");
    } else {
        importantFindings.push(`You currently have ${products.length} product(s) in your catalog.`);
        if (outOfStockProducts.length > 0) {
            importantFindings.push(`⚠️ ${outOfStockProducts.length} product(s) are completely out of stock (${outOfStockProducts.slice(0, 3).map(p => p.name).join(", ")}).`);
        }
        if (lowStockProducts.length > 0) {
            importantFindings.push(`🔔 ${lowStockProducts.length} product(s) are running low on inventory (<= 5 units remaining).`);
        }
        if (highStockLowSalesProducts.length > 0) {
            importantFindings.push(`📦 ${highStockLowSalesProducts.length} high-inventory product(s) had low sales this week (e.g. ${highStockLowSalesProducts[0].product.name} with ${highStockLowSalesProducts[0].stock} units).`);
        }
    }

    if (recentTransactions.length > 0) {
        importantFindings.push(`Generated ₹${recentRevenue.toFixed(2)} across ${recentTransactions.length} completed order(s) this week.`);
        if (previousRevenue > 0) {
            const direction = revenueGrowth >= 0 ? "increased by" : "decreased by";
            importantFindings.push(`Weekly revenue ${direction} ${Math.abs(revenueGrowth)}% compared to the prior 7 days.`);
        }
    } else if (products.length > 0) {
        importantFindings.push("No orders were recorded during the past 7 days.");
    }

    return {
        storeSummary: {
            totalProducts: products.length,
            healthyStockCount: healthyStockProducts.length,
            lowStockCount: lowStockProducts.length,
            outOfStockCount: outOfStockProducts.length,
            recentOrdersCount: recentTransactions.length,
            recentRevenue,
            previousRevenue,
            revenueGrowth,
            topCategory
        },
        lowStockProducts,
        outOfStockProducts,
        highStockLowSalesProducts,
        importantFindings,
        forecasts
    };
}

// =========================================================================
// STAGE 3: GENERATE AI RECOMMENDATIONS
// =========================================================================

function generateRuleBasedFallbackRecommendations(metrics) {
    const {
        storeSummary,
        lowStockProducts,
        outOfStockProducts,
        highStockLowSalesProducts
    } = metrics;

    const recommendations = [];

    // 1. Stock urgency
    if (outOfStockProducts.length > 0) {
        const names = outOfStockProducts.slice(0, 2).map(p => `"${p.name}"`).join(" and ");
        recommendations.push(`Restock ${names} immediately to capture lost shopper demand.`);
    } else if (lowStockProducts.length > 0) {
        const topLow = lowStockProducts[0];
        recommendations.push(`"${topLow.name}" is selling steadily and has only ${topLow.stock} units remaining. Prepare a restock order soon.`);
    }

    // 2. High stock discount
    if (highStockLowSalesProducts.length > 0) {
        const item = highStockLowSalesProducts[0];
        recommendations.push(`"${item.product.name}" has ${item.stock} units in inventory but slow sales. Consider a 10%–15% promotional discount to accelerate turnover.`);
    }

    // 3. Category focus
    if (storeSummary.topCategory && storeSummary.topCategory !== "None") {
        recommendations.push(`Focus marketing on your top-performing category "${storeSummary.topCategory}", which generated the highest shopper interest.`);
    }

    // 4. Revenue growth advice
    if (storeSummary.revenueGrowth < 0) {
        recommendations.push("Weekly revenue decreased compared with the previous period. Refresh your product listings with updated descriptions and competitive pricing.");
    } else if (storeSummary.recentOrdersCount > 0) {
        recommendations.push("Sales momentum is healthy. Maintain inventory levels on your bestsellers to avoid stockouts during peak shopping periods.");
    } else {
        recommendations.push("Explore running introductory promotions or featuring your products on the marketplace to generate initial sales momentum.");
    }

    return recommendations;
}

async function generateAIRecommendations(vendorName, metrics) {
    // If no OpenRouter key is set, immediately use rule-based recommendations
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
        return generateRuleBasedFallbackRecommendations(metrics);
    }

    const prompt = `
You are an autonomous e-commerce business analyst for the platform ShopSense.
Analyze the following weekly store performance metrics for vendor "${vendorName}" and provide 3 to 4 concise, practical, actionable strategic recommendations.

Store Metrics:
- Total Products: ${metrics.storeSummary.totalProducts}
- Out of Stock Products: ${metrics.storeSummary.outOfStockCount}
- Low Stock Products (<= 5 units): ${metrics.storeSummary.lowStockCount}
- Recent Weekly Orders: ${metrics.storeSummary.recentOrdersCount}
- Recent Weekly Revenue: ₹${metrics.storeSummary.recentRevenue}
- Previous Weekly Revenue: ₹${metrics.storeSummary.previousRevenue}
- Top Category: ${metrics.storeSummary.topCategory}
- Slow-moving high stock items: ${metrics.highStockLowSalesProducts.map(h => `${h.product.name} (stock: ${h.stock})`).join(", ") || "None"}
- Low stock items: ${metrics.lowStockProducts.map(l => `${l.name} (stock: ${l.stock})`).join(", ") || "None"}

Requirements:
- Provide 3 or 4 clear, high-impact bullet points.
- Focus on practical actions like discounts on slow inventory, restocking popular items, marketing top categories, and pricing adjustments.
- Return ONLY valid JSON in this exact structure:
{
  "recommendations": [
    "First specific recommendation",
    "Second specific recommendation",
    "Third specific recommendation"
  ]
}
`;

    for (const model of OPENROUTER_MODELS) {
        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model,
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" },
                    temperature: 0.6,
                    max_tokens: 450
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://shopsense.app",
                        "X-Title": "ShopSense AI Agent"
                    },
                    timeout: 8000
                }
            );

            const content = response.data?.choices?.[0]?.message?.content;
            if (content) {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed.recommendations) && parsed.recommendations.length > 0) {
                    return parsed.recommendations;
                }
            }
        } catch (err) {
            // Try next model or fallback
        }
    }

    // Fallback if LLM API encounters errors
    return generateRuleBasedFallbackRecommendations(metrics);
}

// =========================================================================
// STAGE 4 & 5: CREATE REPORT & DELIVER EMAIL
// =========================================================================

/**
 * Runs the autonomous analysis workflow for a single vendor.
 * 
 * @param {string|ObjectId} vendorId
 * @param {Object} [options]
 * @param {boolean} [options.sendEmail=true] - Whether to attempt email delivery
 * @returns {Promise<Object>} The generated vendor report
 */
async function analyzeSingleVendor(vendorId, options = {}) {
    const shouldSendEmail = options.sendEmail !== false;

    // Stage 1: Collect Data
    const collectedData = await collectVendorData(vendorId);
    const vendor = collectedData.vendor;

    // Stage 2: Analyze Metrics
    const metrics = analyzeStoreMetrics(collectedData);

    // Stage 3: Generate AI Recommendations
    const vendorName = vendor.businessName || vendor.name || "Vendor";
    const recommendations = await generateAIRecommendations(vendorName, metrics);

    // Stage 4: Create Vendor Report
    const reportDate = new Date().toISOString().split("T")[0];

    const report = {
        vendorId: vendor._id.toString(),
        vendorName,
        vendorEmail: vendor.email,
        reportDate,
        storeSummary: metrics.storeSummary,
        importantFindings: metrics.importantFindings,
        recommendations,
        emailDelivery: {
            sent: false,
            status: "PENDING",
            message: "Email dispatch pending."
        }
    };

    // Stage 5: Send Email
    if (shouldSendEmail) {
        const emailResult = await sendVendorWeeklyReportEmail({
            to: vendor.email,
            vendorName,
            report
        });
        report.emailDelivery = emailResult;
    } else {
        report.emailDelivery = {
            sent: false,
            status: "SKIPPED",
            message: "Email sending skipped by request options."
        };
    }

    return report;
}

/**
 * Runs the autonomous weekly analysis workflow for ALL approved vendors.
 * Called automatically once per week by the scheduler.
 * 
 * @param {Object} [options]
 * @returns {Promise<{ analyzedVendors: number, reports: Array }>}
 */
async function runWeeklyVendorAgent(options = {}) {
    console.log("[AIAgent] Starting Autonomous Weekly Vendor Analysis Agent workflow...");
    const startTime = Date.now();

    const approvedVendors = await Vendor.find({ status: "APPROVED" });
    const reports = [];

    for (const vendor of approvedVendors) {
        try {
            console.log(`[AIAgent] Analyzing store metrics for vendor: ${vendor.name} (${vendor._id})`);
            const report = await analyzeSingleVendor(vendor._id, options);
            reports.push(report);
        } catch (error) {
            console.error(`[AIAgent] Error analyzing vendor ${vendor._id}:`, error.message);
        }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[AIAgent] Completed Autonomous Weekly Analysis for ${reports.length} vendor(s) in ${duration}s.`);

    return {
        analyzedVendors: reports.length,
        reports
    };
}

module.exports = {
    analyzeSingleVendor,
    runWeeklyVendorAgent,
    collectVendorData,
    analyzeStoreMetrics,
    generateRuleBasedFallbackRecommendations
};
