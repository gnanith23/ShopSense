// ==================== IMPORT MODELS ====================

// Import Transaction model to create transaction records
const Transaction = require("../models/Transaction");

// Import Vendor model to verify that the vendor exists
const Vendor = require("../models/Vendor");

// Import Customer model to verify that the customer exists
const Customer = require("../models/Customer");

// Import Product model to verify product details
const Product = require("../models/Product");


// ================================================================
// ==================== CREATE TRANSACTION =========================
// ================================================================

// Controller function responsible for creating a new transaction
const createTransaction = async (req, res) => {

    try {

        // ==================== GET REQUEST DATA ====================

        // Get vendor, customer, product and quantity from request
        const {
            vendorId,
            customerId,
            productId,
            quantity
        } = req.body;


        // ==================== BASIC INPUT VALIDATION ====================

        // Check whether all required fields were provided
        if (
            !vendorId ||
            !customerId ||
            !productId ||
            quantity === undefined
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Please provide vendorId, customerId, productId and quantity"
            });
        }


        // ==================== QUANTITY VALIDATION ====================

        // Convert quantity into a number
        const purchaseQuantity = Number(quantity);


        // Quantity must be a positive whole number
        if (
            !Number.isInteger(purchaseQuantity) ||
            purchaseQuantity <= 0
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Quantity must be a positive whole number"
            });
        }


        // ==================== CHECK VENDOR ====================

        // Search MongoDB for the vendor
        const vendor = await Vendor.findById(vendorId);


        // Stop if vendor does not exist
        if (!vendor) {

            return res.status(404).json({

                success: false,

                message: "Vendor not found"
            });
        }


        // ==================== CHECK CUSTOMER ====================

        // Search MongoDB for the customer
        const customer = await Customer.findById(customerId);


        // Stop if customer does not exist
        if (!customer) {

            return res.status(404).json({

                success: false,

                message: "Customer not found"
            });
        }


        // ==================== CHECK PRODUCT ====================

        // Search MongoDB for the product
        const product = await Product.findById(productId);


        // Stop if product does not exist
        if (!product) {

            return res.status(404).json({

                success: false,

                message: "Product not found"
            });
        }


        // ==================== VERIFY PRODUCT OWNER ====================

        // Make sure this product belongs to the selected vendor
        if (
            product.vendor.toString() !== vendorId.toString()
        ) {

            return res.status(400).json({

                success: false,

                message:
                    "Product does not belong to this vendor"
            });
        }


        // ==================== CHECK STOCK ====================

        // Make sure enough stock is available
        if (
            product.stock < purchaseQuantity
        ) {

            return res.status(400).json({

                success: false,

                message: "Insufficient product stock"
            });
        }


        // ==================== GET PRODUCT PRICE ====================

        // Get product price directly from MongoDB
        // The client cannot decide the product price
        const unitPrice = product.price;


        // ==================== CALCULATE TOTAL ====================

        // Calculate total transaction amount
        //
        // totalAmount = unitPrice × quantity
        const totalAmount =
            unitPrice * purchaseQuantity;


        // ==================== CREATE TRANSACTION ====================

        // Create and save the transaction
        const transaction =
            await Transaction.create({

                vendor: vendorId,

                customer: customerId,

                product: productId,

                quantity: purchaseQuantity,

                unitPrice: unitPrice,

                totalAmount: totalAmount,

                status: "COMPLETED"
            });


        // ==================== UPDATE PRODUCT STOCK ====================

        // Reduce product stock after successful transaction
        product.stock =
            product.stock - purchaseQuantity;


        // Save updated product
        await product.save();


        // ==================== SUCCESS RESPONSE ====================

        return res.status(201).json({

            success: true,

            message:
                "Transaction created successfully",

            transaction: {

                id: transaction._id,

                vendor: transaction.vendor,

                customer: transaction.customer,

                product: transaction.product,

                quantity: transaction.quantity,

                unitPrice: transaction.unitPrice,

                totalAmount:
                    transaction.totalAmount,

                status: transaction.status,

                createdAt:
                    transaction.createdAt
            }
        });


    } catch (error) {

        // ==================== ERROR HANDLING ====================

        // Print actual error only in backend terminal
        console.error(
            "Create transaction error:",
            error.message
        );


        // Do not expose internal error details to the client
        return res.status(500).json({

            success: false,

            message:
                "Server error while creating transaction"
        });
    }
};


// ================================================================
// ==================== EXPORT CONTROLLER ==========================
// ================================================================

// Export transaction controller so routes can use it
module.exports = {

    createTransaction
};