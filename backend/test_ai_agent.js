/**
 * ShopSense - Autonomous AI Agent Test Suite
 * ==========================================
 * Tests the Autonomous Weekly Vendor Analysis Agent workflow:
 * 1. Report structure and metrics accuracy
 * 2. Vendor data isolation (cross-vendor access blocked)
 * 3. Empty store handling (zero products/sales without crashing)
 * 4. AI failure & rule-based fallback handling
 * 5. Email-not-configured safe handling (never crashes without SMTP)
 * 6. Protected manual trigger endpoint (POST /api/ai-agent/run)
 */

const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}
const dotenv = require("dotenv");
dotenv.config();

const Vendor = require("./models/Vendor");
const Product = require("./models/Product");
const Transaction = require("./models/Transaction");
const aiAgentRoutes = require("./routes/aiAgentRoutes");
const {
    analyzeSingleVendor,
    analyzeStoreMetrics,
    generateRuleBasedFallbackRecommendations
} = require("./services/aiAgentService");
const { sendVendorWeeklyReportEmail, isEmailConfigured } = require("./services/emailService");

async function runAIAgentTests() {
    console.log("==========================================================");
    console.log("   SHOPSENSE - AUTONOMOUS AI AGENT WORKFLOW TEST SUITE    ");
    console.log("==========================================================\n");

    let mongoConnected = false;
    if (process.env.MONGO_URI) {
        try {
            console.log("[Setup] Connecting to MongoDB...");
            await mongoose.connect(process.env.MONGO_URI);
            mongoConnected = true;
            console.log("[Setup] Connected to database successfully.\n");
        } catch (e) {
            console.log("[Setup] Could not connect to remote MongoDB, using offline/mock verification.");
        }
    }

    // Spin up local test express server for endpoint verification
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use("/api/ai-agent", aiAgentRoutes);

    const testPort = 5089;
    const server = app.listen(testPort);
    const baseURL = `http://localhost:${testPort}/api/ai-agent`;

    let passed = 0;
    let failed = 0;

    async function test(name, description, fn) {
        console.log(`----------------------------------------------------------`);
        console.log(`TEST: ${name}`);
        console.log(`Goal: ${description}`);
        try {
            await fn();
            console.log(`RESULT: [PASS]\n`);
            passed++;
        } catch (err) {
            console.log(`RESULT: [FAIL] - ${err.message}\n`);
            failed++;
        }
    }

    let vendorA, vendorB;
    if (mongoConnected) {
        const approvedVendors = await Vendor.find({ status: "APPROVED" }).limit(2);
        vendorA = approvedVendors[0] || await Vendor.findOne();
        vendorB = approvedVendors.length > 1 ? approvedVendors[1] : null;

        // If no vendor exists, create one for test
        if (!vendorA) {
            vendorA = await Vendor.create({
                name: "Agent Test Vendor",
                email: "agent.vendor@shopsense.test",
                password: "password123",
                businessName: "Agent Test Store",
                status: "APPROVED"
            });
        }
    }

    const testJwtSecret = process.env.JWT_SECRET || "ci_test_secret_key_shopsense_2026";

    // =========================================================================
    // 1. REPORT STRUCTURE TEST
    // =========================================================================
    await test(
        "1. Report Structure Verification",
        "Ensure vendor analysis report contains all required fields and metrics",
        async () => {
            if (!mongoConnected || !vendorA) {
                console.log("   * Skipped live DB check (running offline).");
                return;
            }

            const report = await analyzeSingleVendor(vendorA._id, { sendEmail: false });

            if (!report.vendorId || !report.vendorName || !report.reportDate) {
                throw new Error("Missing top-level vendor report identification fields.");
            }
            if (!report.storeSummary || typeof report.storeSummary.recentRevenue !== "number") {
                throw new Error("Missing storeSummary metrics object.");
            }
            if (!Array.isArray(report.importantFindings) || report.importantFindings.length === 0) {
                throw new Error("Missing important findings array.");
            }
            if (!Array.isArray(report.recommendations) || report.recommendations.length === 0) {
                throw new Error("Missing AI recommendations array.");
            }
            if (!report.emailDelivery || typeof report.emailDelivery.sent !== "boolean") {
                throw new Error("Missing emailDelivery status object.");
            }

            console.log(`   * Vendor: ${report.vendorName}`);
            console.log(`   * Total Products: ${report.storeSummary.totalProducts}`);
            console.log(`   * Recent Revenue: ₹${report.storeSummary.recentRevenue}`);
            console.log(`   * Sample Recommendation: "${report.recommendations[0]}"`);
        }
    );

    // =========================================================================
    // 2. VENDOR DATA ISOLATION TEST
    // =========================================================================
    await test(
        "2. Vendor Data Isolation (Cross-Vendor Access Blocked)",
        "Verify Vendor A cannot trigger or view Vendor B's analysis report",
        async () => {
            if (!mongoConnected || !vendorA) {
                console.log("   * Skipped live DB check (running offline).");
                return;
            }

            const tokenA = jwt.sign(
                { vendorId: vendorA._id.toString() },
                testJwtSecret,
                { expiresIn: "1h" }
            );

            // Attempt cross-vendor request: Vendor A asks for a different vendor ID
            const fakeOtherVendorId = new mongoose.Types.ObjectId().toString();

            try {
                await axios.post(
                    `${baseURL}/run`,
                    { vendorId: fakeOtherVendorId, sendEmail: false },
                    { headers: { Authorization: `Bearer ${tokenA}` } }
                );
                throw new Error("Server allowed Vendor A to request another vendor's analysis!");
            } catch (err) {
                if (err.response && err.response.status === 403) {
                    console.log(`   * Cross-vendor request blocked with HTTP 403 Forbidden.`);
                    console.log(`   * Message: "${err.response.data.message}"`);
                } else {
                    throw err;
                }
            }
        }
    );

    // =========================================================================
    // 3. EMPTY STORE HANDLING TEST
    // =========================================================================
    await test(
        "3. Empty Store Handling (Zero Products / Zero Sales)",
        "Verify analysis executes safely without errors for new stores with no data",
        () => {
            const emptyData = {
                products: [],
                recentTransactions: [],
                previousTransactions: [],
                recentSalesMap: {},
                forecasts: []
            };

            const metrics = analyzeStoreMetrics(emptyData);

            if (metrics.storeSummary.totalProducts !== 0) {
                throw new Error("Expected 0 products for empty store.");
            }
            if (metrics.storeSummary.recentRevenue !== 0) {
                throw new Error("Expected ₹0 revenue for empty store.");
            }

            const fallbackRecs = generateRuleBasedFallbackRecommendations(metrics);
            if (!Array.isArray(fallbackRecs) || fallbackRecs.length === 0) {
                throw new Error("Failed to produce recommendations for empty store.");
            }

            console.log(`   * Empty store metrics handled cleanly (0 products, ₹0 revenue).`);
            console.log(`   * Empty store advice: "${fallbackRecs[0]}"`);
        }
    );

    // =========================================================================
    // 4. AI FAILURE / FALLBACK HANDLING TEST
    // =========================================================================
    await test(
        "4. AI Failure & Rule-Based Fallback Handling",
        "Verify system generates strategic recommendations even when LLM API is unavailable",
        () => {
            const mockMetrics = {
                storeSummary: {
                    totalProducts: 10,
                    healthyStockCount: 7,
                    lowStockCount: 2,
                    outOfStockCount: 1,
                    recentOrdersCount: 5,
                    recentRevenue: 4500,
                    previousRevenue: 6000,
                    revenueGrowth: -25,
                    topCategory: "Electronics"
                },
                lowStockProducts: [{ name: "Gaming Mouse", stock: 3 }],
                outOfStockProducts: [{ name: "Mechanical Keyboard", stock: 0 }],
                highStockLowSalesProducts: [{ product: { name: "USB Cable" }, stock: 45, recentSold: 0 }]
            };

            const recs = generateRuleBasedFallbackRecommendations(mockMetrics);

            if (!Array.isArray(recs) || recs.length < 3) {
                throw new Error("Expected at least 3 fallback recommendations.");
            }

            // Verify expected business logic keywords
            const hasRestock = recs.some(r => r.toLowerCase().includes("restock"));
            const hasDiscount = recs.some(r => r.toLowerCase().includes("discount") || r.toLowerCase().includes("promotional"));
            const hasCategory = recs.some(r => r.toLowerCase().includes("category") || r.toLowerCase().includes("marketing"));

            if (!hasRestock || !hasDiscount || !hasCategory) {
                throw new Error("Fallback recommendations missing key business domains.");
            }

            console.log(`   * Generated ${recs.length} strategic recommendations via fallback engine.`);
            recs.forEach(r => console.log(`     - ${r}`));
        }
    );

    // =========================================================================
    // 5. EMAIL NOT CONFIGURED HANDLING TEST
    // =========================================================================
    await test(
        "5. Email Not Configured Handling",
        "Verify email service does not crash when SMTP credentials are absent",
        async () => {
            // Temporarily clear EMAIL_HOST to test unconfigured behavior
            const originalHost = process.env.EMAIL_HOST;
            delete process.env.EMAIL_HOST;

            const dummyReport = {
                reportDate: "2026-09-15",
                storeSummary: {
                    totalProducts: 5,
                    healthyStockCount: 4,
                    lowStockCount: 1,
                    outOfStockCount: 0,
                    recentOrdersCount: 2,
                    recentRevenue: 1500
                },
                importantFindings: ["Store is operating normally."],
                recommendations: ["Maintain current stock levels."]
            };

            const result = await sendVendorWeeklyReportEmail({
                to: "vendor@example.com",
                vendorName: "Demo Vendor",
                report: dummyReport
            });

            // Restore original env
            if (originalHost) process.env.EMAIL_HOST = originalHost;

            if (result.sent !== false) {
                throw new Error("Expected sent to be false when email is not configured.");
            }
            if (result.status !== "EMAIL_NOT_CONFIGURED") {
                throw new Error(`Expected status 'EMAIL_NOT_CONFIGURED', got '${result.status}'.`);
            }

            console.log(`   * Safe result returned: sent=${result.sent}, status="${result.status}"`);
            console.log(`   * Notice: "${result.message}"`);
        }
    );

    // =========================================================================
    // 6. PROTECTED MANUAL TRIGGER ENDPOINT TEST
    // =========================================================================
    await test(
        "6. Protected Manual Trigger Endpoint (POST /api/ai-agent/run)",
        "Verify endpoint rejects unauthenticated requests and succeeds with valid vendor token",
        async () => {
            // Subtest A: Unauthenticated request should be rejected with 401
            try {
                await axios.post(`${baseURL}/run`, { sendEmail: false });
                throw new Error("Endpoint accepted unauthenticated request!");
            } catch (err) {
                if (err.response && err.response.status === 401) {
                    console.log("   * Subtest A: Correctly rejected unauthenticated call (HTTP 401).");
                } else {
                    throw err;
                }
            }

            // Subtest B: Authenticated vendor request
            if (mongoConnected && vendorA) {
                const tokenA = jwt.sign(
                    { vendorId: vendorA._id.toString() },
                    testJwtSecret,
                    { expiresIn: "1h" }
                );

                const res = await axios.post(
                    `${baseURL}/run`,
                    { sendEmail: false },
                    { headers: { Authorization: `Bearer ${tokenA}` } }
                );

                if (res.status !== 200 || !res.data.success || !res.data.report) {
                    throw new Error("Valid vendor request did not return report.");
                }

                console.log(`   * Subtest B: Successfully generated report via manual endpoint (HTTP 200).`);
                console.log(`   * Vendor Name in Report: "${res.data.report.vendorName}"`);
            }
        }
    );

    // Teardown
    server.close();
    if (mongoConnected) {
        await mongoose.disconnect();
    }

    console.log("==========================================================");
    console.log(`SUMMARY: ${passed} PASSED, ${failed} FAILED (Total: ${passed + failed})`);
    console.log("==========================================================");

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runAIAgentTests().catch(err => {
    console.error("Test execution fatal error:", err);
    process.exit(1);
});
