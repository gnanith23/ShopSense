const mongoose = require("mongoose");
const dns = require("dns");

// Use reliable DNS servers (Google / Cloudflare) to prevent querySrv ECONNREFUSED on Windows
try {
    dns.setServers(["8.8.8.8", "1.1.1.1"]);
} catch (err) {
    // Ignore if not permitted
}


// ==================== DATABASE CONNECTION ====================

// Function responsible for connecting ShopSense to MongoDB Atlas
const connectDB = async () => {

    try {

        // Connect to MongoDB using the connection string stored in .env
        await mongoose.connect(process.env.MONGO_URI);

        // This message appears when the database connection is successful
        console.log("MongoDB connected successfully");

    } catch (error) {

        // Display the error if MongoDB connection fails
        console.error("MongoDB connection failed:", error.message);

        // Stop the backend because the application should not run
        // without a working database connection
        process.exit(1);
    }
};


// Export the function so server.js can use it
module.exports = connectDB;