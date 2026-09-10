// ==================== IMPORT MODELS ====================

// Import Transaction model to create transaction records
const Transaction = require("../models/Transaction");

// Import Vendor model to verify that the vendor exists
const Vendor = require("../models/Vendor");

// Import Customer model to verify that the customer exists
const Customer = require("../models/Customer");

// Import Product model to verify product details
const Product = require("../models/Product");

// Import Real-Time WebSocket notifier (Milestone 3)
const { notifyRealtimeSale } = require("../services/realtimeNotifier");



// ================================================================
// ==================== CREATE TRANSACTION =========================
// ================================================================

// Controller function responsible for creating a new transaction
const createTransaction = async (req, res) => {

    try {

        // ==================== GET REQUEST DATA ====================

        // Customer ID can come from authenticated JWT (req.customerId) or request body
        const effectiveCustomerId = req.customerId || req.body.customerId;
        const {
            vendorId,
            productId,
            quantity
        } = req.body;


        // ==================== BASIC INPUT VALIDATION ====================

        if (!productId || quantity === undefined) {
            return res.status(400).json({
                success: false,
                message: "Please provide productId and quantity"
            });
        }

        if (!effectiveCustomerId) {
            return res.status(400).json({
                success: false,
                message: "Please provide customerId or authenticate as customer"
            });
        }


        // ==================== QUANTITY VALIDATION ====================

        const purchaseQuantity = Number(quantity);

        if (!Number.isInteger(purchaseQuantity) || purchaseQuantity <= 0) {
            return res.status(400).json({
                success: false,
                message: "Quantity must be a positive whole number"
            });
        }


        // ==================== CHECK CUSTOMER ====================

        const customer = await Customer.findById(effectiveCustomerId);

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }


        // ==================== CHECK PRODUCT ====================

        const product = await Product.findById(productId);

        if (!product) {
            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        // ==================== VERIFY PRODUCT VENDOR ====================

        // Determine vendor authoritatively from the product in MongoDB
        const actualVendorId = product.vendor.toString();

        // If frontend provided a vendorId, ensure it strictly matches product.vendor
        if (vendorId && vendorId.toString() !== actualVendorId) {
            return res.status(400).json({
                success: false,
                message: "Product does not belong to the selected vendor"
            });
        }

        const vendor = await Vendor.findById(actualVendorId);

        if (!vendor) {
            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }


        // ==================== CHECK STOCK ====================

        if (product.stock < purchaseQuantity) {
            return res.status(400).json({
                success: false,
                message: `Insufficient product stock. Only ${product.stock} units available.`
            });
        }


        // ==================== GET PRODUCT PRICE ====================

        // Get product price directly from MongoDB - client cannot tamper with price
        const unitPrice = product.price;
        const totalAmount = unitPrice * purchaseQuantity;


        // ==================== CREATE TRANSACTION ====================

        const transaction = await Transaction.create({
            vendor: actualVendorId,
            customer: customer._id,
            product: product._id,
            quantity: purchaseQuantity,
            unitPrice: unitPrice,
            totalAmount: totalAmount,
            status: "COMPLETED"
        });


        // ==================== UPDATE PRODUCT STOCK ====================

        // Decrease stock on backend, prevent negative inventory
        product.stock = Math.max(0, product.stock - purchaseQuantity);
        await product.save();


        // ==================== REAL-TIME WEBSOCKET BROADCAST ====================

        // Asynchronously broadcast sale event to the connected vendor's dashboard
        notifyRealtimeSale({
            vendorId: actualVendorId,
            transactionId: transaction._id,
            productId: product._id,
            productName: product.name,
            category: product.category,
            quantity: purchaseQuantity,
            unitPrice: unitPrice,
            totalAmount: totalAmount,
            customerName: customer.name
        }).catch(err => console.error("Real-time broadcast error:", err.message));


        // ==================== SUCCESS RESPONSE ====================

        return res.status(201).json({
            success: true,
            message: "Transaction created successfully",
            transaction: {
                id: transaction._id,
                _id: transaction._id,
                vendor: transaction.vendor,
                vendorName: vendor.businessName || vendor.name,
                customer: transaction.customer,
                customerName: customer.name,
                product: transaction.product,
                productName: product.name,
                quantity: transaction.quantity,
                unitPrice: transaction.unitPrice,
                totalAmount: transaction.totalAmount,
                status: transaction.status,
                createdAt: transaction.createdAt,
                updatedStock: product.stock
            }
        });

    } catch (error) {
        console.error("Create transaction error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while creating transaction"
        });
    }
};


// ================================================================
// ==================== GET MY PURCHASES ===========================
// ================================================================

// GET /api/transactions/my-purchases
// Returns completed transactions for the authenticated or specified customer
const getMyPurchases = async (req, res) => {
    try {
        const effectiveCustomerId = req.customerId || req.query.customerId;

        if (!effectiveCustomerId) {
            return res.status(400).json({
                success: false,
                message: "Customer authentication or customerId query parameter required"
            });
        }

        const transactions = await Transaction.find({
            customer: effectiveCustomerId,
            status: "COMPLETED"
        })
            .sort({ createdAt: -1 })
            .populate("product", "name category price imageUrl productModel")
            .populate("vendor", "name businessName email phone address");

        return res.status(200).json({
            success: true,
            count: transactions.length,
            transactions: transactions.map(tx => ({
                id: tx._id,
                _id: tx._id,
                productId: tx.product?._id,
                productName: tx.product?.name || "Product",
                category: tx.product?.category || "General",
                imageUrl: tx.product?.imageUrl || "",
                vendorId: tx.vendor?._id,
                vendorName: tx.vendor?.businessName || tx.vendor?.name || "Merchant",
                quantity: tx.quantity,
                unitPrice: tx.unitPrice,
                totalAmount: tx.totalAmount,
                status: tx.status,
                createdAt: tx.createdAt
            }))
        });

    } catch (error) {
        console.error("Get my purchases error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving purchase history"
        });
    }
};


// ================================================================
// ==================== GET VENDOR TRANSACTIONS ====================
// ================================================================

// GET /api/transactions/vendor/:vendorId?
// Returns latest transactions for the authenticated or specified vendor
const getVendorTransactions = async (req, res) => {
    try {
        const effectiveVendorId = req.vendorId || req.params.vendorId || req.query.vendorId;

        if (!effectiveVendorId) {
            return res.status(400).json({
                success: false,
                message: "Vendor authentication or vendorId is required"
            });
        }

        const transactions = await Transaction.find({
            vendor: effectiveVendorId,
            status: "COMPLETED"
        })
            .sort({ createdAt: -1 })
            .limit(25)
            .populate("product", "name category price imageUrl")
            .populate("customer", "name email");

        return res.status(200).json({
            success: true,
            count: transactions.length,
            transactions: transactions.map(tx => ({
                transactionId: tx._id?.toString(),
                productId: tx.product?._id?.toString(),
                productName: tx.product?.name || "Product",
                category: tx.product?.category || "General",
                quantity: tx.quantity,
                unitPrice: tx.unitPrice,
                totalAmount: tx.totalAmount,
                customerName: tx.customer?.name || "Customer",
                timestamp: tx.createdAt
            }))
        });

    } catch (error) {
        console.error("Get vendor transactions error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving vendor transactions"
        });
    }
};


// ================================================================
// ==================== EXPORT CONTROLLER ==========================
// ================================================================

module.exports = {
    createTransaction,
    getMyPurchases,
    getVendorTransactions
};