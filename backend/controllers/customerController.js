// ==================== IMPORT MODELS ====================

// Import the Customer model so we can interact with customer data in MongoDB
const Customer = require("../models/Customer");


// ================================================================
// ==================== CREATE CUSTOMER ============================
// ================================================================

// Controller function responsible for creating a new customer
const createCustomer = async (req, res) => {

    try {

        // ==================== GET REQUEST DATA ====================

        // Get customer information sent by the client
        const {
            name,
            email,
            phone,
            address
        } = req.body;


        // ==================== BASIC INPUT VALIDATION ====================

        // Check whether all required fields are provided
        if (!name || !email || !phone) {

            return res.status(400).json({
                success: false,
                message: "Please provide name, email and phone"
            });
        }


        // ==================== CHECK EXISTING CUSTOMER ====================

        // Search MongoDB to check whether this email already exists
        const existingCustomer = await Customer.findOne({ email });


        // Stop if a customer with the same email already exists
        if (existingCustomer) {

            return res.status(409).json({
                success: false,
                message: "Customer with this email already exists"
            });
        }


        // ==================== CREATE CUSTOMER ====================

        // Create and save the customer in MongoDB
        const customer = await Customer.create({
            name,
            email,
            phone,
            address
        });


        // ==================== SUCCESS RESPONSE ====================

        // Return the newly created customer
        return res.status(201).json({

            success: true,

            message: "Customer created successfully",

            customer: {
                id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                createdAt: customer.createdAt
            }
        });


    } catch (error) {

        // ==================== ERROR HANDLING ====================

        // Display the actual error in the backend terminal
        console.error(
            "Create customer error:",
            error.message
        );


        // Send a generic error response to the client
        return res.status(500).json({
            success: false,
            message: "Server error while creating customer"
        });
    }
};


// ================================================================
// ==================== EXPORT CONTROLLERS =========================
// ================================================================

// Export customer controller functions so routes can use them
module.exports = {
    createCustomer
};