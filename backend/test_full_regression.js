const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const dotenv = require("dotenv");
dotenv.config();

const Vendor = require("./models/Vendor");

// Route imports
const vendorRoutes = require("./routes/vendorRoutes");
const customerRoutes = require("./routes/customerRoutes");
const productRoutes = require("./routes/productRoutes");
const transactionRoutes = require("./routes/transactionRoutes");
const inventoryRoutes = require("./routes/inventoryRoutes");
const analyticsRoutes = require("./routes/analyticsRoutes");
const recommendationRoutes = require("./routes/recommendationRoutes");
const forecastRoutes = require("./routes/forecastRoutes");
const reviewRoutes = require("./routes/reviewRoutes");
const aiRoutes = require("./routes/aiRoutes");

async function runRegressionSuite() {
    console.log("==================================================");
    console.log("SHOPSENSE FULL REGRESSION TEST SUITE (M1, M2, M3)");
    console.log("==================================================");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    const app = express();
    app.use(cors());
    app.use(express.json());

    app.use("/api/vendors", vendorRoutes);
    app.use("/api/customers", customerRoutes);
    app.use("/api/products", productRoutes);
    app.use("/api/transactions", transactionRoutes);
    app.use("/api/inventory", inventoryRoutes);
    app.use("/api/analytics", analyticsRoutes);
    app.use("/api/recommendations", recommendationRoutes);
    app.use("/api/forecast", forecastRoutes);
    app.use("/api/reviews", reviewRoutes);
    app.use("/api/ai", aiRoutes);

    const testPort = 5088;
    const server = app.listen(testPort);
    const baseURL = `http://localhost:${testPort}/api`;

    let vendor = await Vendor.findOne({ status: "APPROVED" });
    if (!vendor) vendor = await Vendor.findOne();
    const vendorId = vendor._id.toString();

    const token = jwt.sign(
        { vendorId: vendor._id.toString() },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
    const headers = { Authorization: `Bearer ${token}` };

    let passed = 0;
    let failed = 0;

    async function assertTest(name, fn) {
        try {
            await fn();
            console.log(`[PASS] ${name}`);
            passed++;
        } catch (err) {
            console.error(`[FAIL] ${name}:`, err.response?.data || err.message);
            failed++;
        }
    }

    // 1. Milestone 1 Tests
    await assertTest("M1: Fetch my products catalog (protected)", async () => {
        const res = await axios.get(`${baseURL}/products/my-products`, { headers });
        if (res.status !== 200) throw new Error("Status " + res.status);
    });

    await assertTest("M1: Fetch customers list", async () => {
        const res = await axios.get(`${baseURL}/customers`);
        if (res.status !== 200) throw new Error("Status " + res.status);
    });

    // 2. Milestone 2 Tests
    await assertTest("M2: Customer Segmentation API", async () => {
        const res = await axios.get(`${baseURL}/analytics/customer-segments`, { headers });
        if (res.status !== 200 || !res.data.summary) throw new Error("Invalid response");
    });

    await assertTest("M2: Rule-Based Category Recommendations API", async () => {
        const catRes = await axios.get(`${baseURL}/recommendations/categories`, { headers });
        if (catRes.data.categories?.length > 0) {
            const cat = catRes.data.categories[0];
            const res = await axios.get(`${baseURL}/recommendations/category/${encodeURIComponent(cat)}`, { headers });
            if (res.status !== 200) throw new Error("Failed recommendations");
        }
    });

    await assertTest("M2: Vector Similarity Recommendations API", async () => {
        const res = await axios.get(`${baseURL}/recommendations/vector`, { headers });
        if (res.status !== 200) throw new Error("Failed vector recommendations");
    });

    await assertTest("M2: Inventory Analytics & Summary API", async () => {
        const res = await axios.get(`${baseURL}/inventory/summary`, { headers });
        if (res.status !== 200) throw new Error("Failed inventory summary");
    });

    await assertTest("M2: ML Inventory Demand Forecasting API", async () => {
        const res = await axios.get(`${baseURL}/forecast/products`, { headers });
        if (res.status !== 200) throw new Error("Failed forecast products");
    });

    await assertTest("M2: LLM Review Sentiment Dashboard API", async () => {
        const res = await axios.get(`${baseURL}/reviews/vendor/sentiment-summary`, { headers });
        if (res.status !== 200) throw new Error("Failed review sentiment summary");
    });

    await assertTest("M2: Historical Data Validation API", async () => {
        const res = await axios.get(`${baseURL}/analytics/validation`, { headers });
        if (res.status !== 200) throw new Error("Failed validation");
    });

    // 3. Milestone 3 Tests
    await assertTest("M3 (Phase 1): Sales Trend API", async () => {
        const res = await axios.get(`${baseURL}/analytics/sales-trend`, { headers });
        if (res.status !== 200 || !res.data.labels || !res.data.datasets) throw new Error("Invalid chart format");
    });

    await assertTest("M3 (Phase 1): Revenue by Category API", async () => {
        const res = await axios.get(`${baseURL}/analytics/revenue-by-category`, { headers });
        if (res.status !== 200 || !res.data.labels || !res.data.categories) throw new Error("Invalid category format");
    });

    await assertTest("M3 (Phase 1): Product Performance API", async () => {
        const res = await axios.get(`${baseURL}/analytics/product-performance`, { headers });
        if (res.status !== 200 || !res.data.products) throw new Error("Invalid product performance format");
    });

    await assertTest("M3 (Phase 2): Marketplace Benchmark API", async () => {
        const res = await axios.get(`${baseURL}/analytics/benchmark`, { headers });
        if (res.status !== 200 || !res.data.metrics || !res.data.metrics.revenue) throw new Error("Invalid benchmark format");
    });

    await assertTest("M3 (Phase 3): CSV Report Export API", async () => {
        const res = await axios.get(`${baseURL}/analytics/export/csv`, { headers });
        if (res.status !== 200 || !res.headers["content-type"]?.includes("text/csv")) throw new Error("Invalid CSV header");
        if (!res.data.startsWith("Date,Transaction ID")) throw new Error("Invalid CSV content");
    });

    await assertTest("M3 (Phase 5): RAG AI Shopping Assistant API", async () => {
        const res = await axios.post(`${baseURL}/ai/shopping-assistant`, { query: "Best gaming keyboard" });
        if (res.status !== 200 || !res.data.answer) throw new Error("Invalid RAG response");
    });

    await assertTest("M3 (Phase 6): AI Data Analyst (Text-to-SQL) API", async () => {
        const res = await axios.post(`${baseURL}/analytics/ai-analyst`, { question: "Which product had the most revenue?" }, { headers });
        if (res.status !== 200 || !res.data.query || !res.data.explanation) throw new Error("Invalid Analyst response");
    });

    server.close();
    await mongoose.disconnect();

    console.log("\n==================================================");
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log("==================================================");

    if (failed > 0) process.exit(1);
    else process.exit(0);
}

runRegressionSuite();
