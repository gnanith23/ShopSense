// ==================== IMPORT PACKAGES ====================

// Import Express framework to create the backend server and REST APIs
const express = require("express");

// Import CORS to allow communication between frontend and backend
const cors = require("cors");

// Import dotenv to load environment variables from the .env file
const dotenv = require("dotenv");
dotenv.config();
const aiRoutes = require("./routes/aiRoutes");
const aiAgentRoutes = require("./routes/aiAgentRoutes");
const { initAgentScheduler } = require("./services/agentScheduler");

// ==================== IMPORT DATABASE CONFIGURATION ====================

// Import our MongoDB connection function
const connectDB = require("./config/db");


// ==================== IMPORT ROUTES ====================

// Import vendor-related routes
const vendorRoutes = require("./routes/vendorRoutes");

// Import customer-related routes
const customerRoutes = require("./routes/customerRoutes");

// Import product-related routes
const productRoutes = require("./routes/productRoutes");

// Import transaction-related routes
const transactionRoutes = require("./routes/transactionRoutes");

const adminRoutes = require("./routes/adminRoutes");


// ==================== MILESTONE 2 ROUTES ====================

// Import inventory routes (Milestone 2 - Requirement 1)
const inventoryRoutes = require("./routes/inventoryRoutes");

// Import analytics routes (Milestone 2 - Requirement 2 & 4)
const analyticsRoutes = require("./routes/analyticsRoutes");

// Import recommendation routes (Milestone 2 - Requirement 3)
const recommendationRoutes = require("./routes/recommendationRoutes");

// Import forecasting routes (Milestone 2 Advanced Feature)
const forecastRoutes = require("./routes/forecastRoutes");

// Import review & LLM sentiment routes (Milestone 2 Advanced Feature)
const reviewRoutes = require("./routes/reviewRoutes");


// ==================== ENVIRONMENT CONFIGURATION ====================

// Load environment variables from the .env file
//dotenv.config();


// ==================== DATABASE CONNECTION ====================

// Connect ShopSense backend to MongoDB Atlas
connectDB();


// ==================== EXPRESS APPLICATION ====================

// Create the Express application
const app = express();


// ==================== MIDDLEWARE ====================

// Enable CORS so frontend applications can communicate with backend
app.use(cors());

// Allow Express to understand JSON request bodies
app.use(express.json());

app.use("/api/admin", adminRoutes);

// ==================== API ROUTES ====================

// All vendor-related routes start with /api/vendors
app.use("/api/vendors", vendorRoutes);

// All customer-related routes start with /api/customers
app.use("/api/customers", customerRoutes);

// All product-related routes start with /api/products
app.use("/api/products", productRoutes);

// All transaction-related routes start with /api/transactions
app.use("/api/transactions", transactionRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/ai-agent", aiAgentRoutes);

// ==================== MILESTONE 2 API ROUTES ====================

// Inventory tracking APIs
app.use("/api/inventory", inventoryRoutes);

// Analytics APIs (customer segmentation, validation)
app.use("/api/analytics", analyticsRoutes);

// Rule-based recommendation APIs
app.use("/api/recommendations", recommendationRoutes);

// ML inventory demand forecasting APIs (Milestone 2 Advanced)
app.use("/api/forecast", forecastRoutes);

// LLM Review Sentiment APIs (Milestone 2 Advanced)
app.use("/api/reviews", reviewRoutes);
// ==================== TEST ROUTE ====================

// Simple route to check whether the ShopSense backend is running
app.get("/", (req, res) => {

    res.send("ShopSense API is running");
});


// ==================== SERVER CONFIGURATION ====================

// Get PORT from environment variables
// If PORT is unavailable, use port 5000
const PORT = process.env.PORT || 5000;


// ==================== START SERVER ====================

// Start the Express server and listen for incoming requests
app.listen(PORT, () => {

    console.log(`ShopSense server running on port ${PORT}`);
    // Start weekly autonomous vendor analysis agent scheduler
    initAgentScheduler();
});