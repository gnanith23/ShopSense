const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}
dotenv.config();

const Vendor = require("./models/Vendor");
const { processVendorAnalystQuery, validateAndSanitizeSQL } = require("./services/sqlAnalyticsService");

async function runAnalystTests() {
    console.log("Connecting to MongoDB for AI Data Analyst testing...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    let vendor = await Vendor.findOne({ status: "APPROVED" });
    if (!vendor) vendor = await Vendor.findOne();
    const vendorId = vendor._id.toString();

    console.log(`Testing with vendor: ${vendor.name} (${vendor.businessName}), ID: ${vendorId}`);

    console.log("\n--- Test 1: Best Selling / Top Revenue Question ---");
    const res1 = await processVendorAnalystQuery("Which product generated the most revenue?", vendorId);
    console.log("Generated SQL:", res1.query);
    console.log("Results count:", res1.recordCount);
    console.log("Results:", res1.results);
    console.log("AI Explanation:\n" + res1.explanation);

    console.log("\n--- Test 2: Category Breakdown Question ---");
    const res2 = await processVendorAnalystQuery("What category sold the most units?", vendorId);
    console.log("Generated SQL:", res2.query);
    console.log("Results:", res2.results);
    console.log("AI Explanation:\n" + res2.explanation);

    console.log("\n--- Test 3: SQL Security Validation (Destructive Query Rejection) ---");
    try {
        validateAndSanitizeSQL("DROP TABLE transactions;", vendorId);
        console.error("FAILED: DROP TABLE was not rejected!");
    } catch (secErr) {
        console.log("PASSED: Destructive SQL rejected:", secErr.message);
    }

    try {
        validateAndSanitizeSQL("DELETE FROM products WHERE id = '123'", vendorId);
        console.error("FAILED: DELETE was not rejected!");
    } catch (secErr) {
        console.log("PASSED: DELETE SQL rejected:", secErr.message);
    }

    try {
        validateAndSanitizeSQL("SELECT * FROM transactions; UPDATE vendors SET name = 'Hacked';", vendorId);
        console.error("FAILED: Multiple statement chained SQL was not rejected!");
    } catch (secErr) {
        console.log("PASSED: Multiple SQL statements rejected:", secErr.message);
    }

    console.log("\n--- Test 4: Vendor Data Isolation ---");
    const isolatedSQL = validateAndSanitizeSQL("SELECT * FROM transactions", vendorId);
    console.log("Input: SELECT * FROM transactions");
    console.log("Sanitized Output:", isolatedSQL);
    if (isolatedSQL.includes(vendorId)) {
        console.log("PASSED: Vendor ID successfully injected and scoped!");
    } else {
        console.error("FAILED: Vendor isolation not enforced in query!");
    }

    await mongoose.disconnect();
    console.log("\n--- ALL AI DATA ANALYST TESTS COMPLETED! ---");
}

runAnalystTests();
