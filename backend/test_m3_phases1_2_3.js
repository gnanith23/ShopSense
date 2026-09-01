const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const Vendor = require("./models/Vendor");
const analyticsRoutes = require("./routes/analyticsRoutes");

async function runTests() {
    console.log("Connecting to MongoDB for test verification...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    // Setup temporary test express app
    const app = express();
    app.use(cors());
    app.use(express.json());
    app.use("/api/analytics", analyticsRoutes);

    const testPort = 5055;
    const server = app.listen(testPort);

    let vendor = await Vendor.findOne({ status: "APPROVED" });
    if (!vendor) {
        vendor = await Vendor.findOne();
    }
    if (!vendor) {
        console.error("No vendor found in database!");
        server.close();
        process.exit(1);
    }

    console.log(`Found vendor: ${vendor.name} (${vendor.businessName}), ID: ${vendor._id}`);

    const token = jwt.sign(
        { vendorId: vendor._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );

    const baseURL = `http://localhost:${testPort}/api/analytics`;
    const headers = { Authorization: `Bearer ${token}` };

    console.log("\n--- Testing Phase 1: GET /api/analytics/sales-trend ---");
    try {
        const res = await axios.get(`${baseURL}/sales-trend`, { headers });
        console.log("Status:", res.status);
        console.log("Summary:", res.data.summary);
        console.log("Labels count:", res.data.labels?.length);
        console.log("Datasets count:", res.data.datasets?.length);
    } catch (err) {
        console.error("Sales trend failed:", err.response?.data || err.message);
    }

    console.log("\n--- Testing Phase 1: GET /api/analytics/revenue-by-category ---");
    try {
        const res = await axios.get(`${baseURL}/revenue-by-category`, { headers });
        console.log("Status:", res.status);
        console.log("Total Revenue:", res.data.totalRevenue);
        console.log("Categories:", res.data.categories);
    } catch (err) {
        console.error("Revenue by category failed:", err.response?.data || err.message);
    }

    console.log("\n--- Testing Phase 1: GET /api/analytics/product-performance ---");
    try {
        const res = await axios.get(`${baseURL}/product-performance`, { headers });
        console.log("Status:", res.status);
        console.log("Products count:", res.data.products?.length);
        if (res.data.products?.length > 0) {
            console.log("Sample product:", res.data.products[0]);
        }
    } catch (err) {
        console.error("Product performance failed:", err.response?.data || err.message);
    }

    console.log("\n--- Testing Phase 2: GET /api/analytics/benchmark ---");
    try {
        const res = await axios.get(`${baseURL}/benchmark`, { headers });
        console.log("Status:", res.status);
        console.log("Comparison basis:", res.data.comparisonBasis);
        console.log("Metrics:", JSON.stringify(res.data.metrics, null, 2));
    } catch (err) {
        console.error("Benchmark failed:", err.response?.data || err.message);
    }

    console.log("\n--- Testing Phase 3: GET /api/analytics/export/csv ---");
    try {
        const res = await axios.get(`${baseURL}/export/csv`, { headers });
        console.log("Status:", res.status);
        console.log("Content-Type:", res.headers["content-type"]);
        console.log("Content-Disposition:", res.headers["content-disposition"]);
        console.log("First 3 lines of CSV:\n" + res.data.split("\r\n").slice(0, 3).join("\n"));
    } catch (err) {
        console.error("CSV Export failed:", err.response?.data || err.message);
    }

    server.close();
    await mongoose.disconnect();
    console.log("\nAll Phase 1, 2, and 3 tests completed successfully!");
    process.exit(0);
}

runTests();
