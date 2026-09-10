// Import the Customer model so we can interact with customer data in MongoDB
const Customer = require("../models/Customer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");


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
            password,
            phone,
            address
        } = req.body;


        // ==================== BASIC INPUT VALIDATION ====================

        // Check whether all required fields are provided
        if (!name || !email || !phone) {

            return res.status(400).json({
                success: false,
                message: "Please provide name, email and phone number"
            });
        }

        const normalizedEmail = email.toLowerCase().trim();

        // Password validation if provided
        if (password && password.length < 6) {
            return res.status(400).json({
                success: false,
                message: "Password must be at least 6 characters long"
            });
        }


        // ==================== CHECK EXISTING CUSTOMER ====================

        // Search MongoDB to check whether this email already exists
        const existingCustomer = await Customer.findOne({ email: normalizedEmail });


        // Stop if a customer with the same email already exists
        if (existingCustomer) {

            return res.status(409).json({
                success: false,
                message: "Customer with this email already exists"
            });
        }


        // ==================== HASH PASSWORD ====================

        let hashedPassword = "";
        if (password) {
            const salt = await bcrypt.genSalt(10);
            hashedPassword = await bcrypt.hash(password, salt);
        }


        // ==================== CREATE CUSTOMER IN MONGODB ====================

        // Create and save the customer in MongoDB
        const customer = await Customer.create({
            name: name.trim(),
            email: normalizedEmail,
            password: hashedPassword,
            phone: phone.trim(),
            address: address ? address.trim() : ""
        });


        // ==================== SUCCESS RESPONSE ====================

        // Return the newly created customer (excluding password)
        return res.status(201).json({

            success: true,

            message: "Customer created and saved to MongoDB successfully",

            customer: {
                id: customer._id,
                _id: customer._id,
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
            message: "Server error while creating customer in MongoDB"
        });
    }
};


// ================================================================
// ==================== GET CUSTOMERS ==============================
// ================================================================

// Controller function responsible for listing all customers
const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        return res.status(200).json({
            success: true,
            count: customers.length,
            customers
        });
    } catch (error) {
        console.error("Get customers error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving customers"
        });
    }
};


// ================================================================
// ==================== CUSTOMER LOGIN =============================
// ================================================================

// POST /api/customers/login
// Allows an existing customer to log in with their email and password.
// Issues a signed JWT and returns customer details.
const customerLogin = async (req, res) => {
    try {
        const { email, password, customerId } = req.body;

        if (!email && !customerId) {
            return res.status(400).json({
                success: false,
                message: "Please provide your customer email address"
            });
        }

        let customer = null;
        if (email) {
            customer = await Customer.findOne({ email: email.toLowerCase().trim() });
        } else if (customerId) {
            customer = await Customer.findById(customerId);
        }

        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "No registered customer found with that email address"
            });
        }

        // ==================== PASSWORD VERIFICATION ====================
        if (customer.password) {
            // Customer has a password stored in MongoDB
            if (!password) {
                return res.status(400).json({
                    success: false,
                    message: "Please enter your password"
                });
            }
            const isMatch = await bcrypt.compare(password, customer.password);
            if (!isMatch) {
                return res.status(401).json({
                    success: false,
                    message: "Invalid email or password"
                });
            }
        } else if (password) {
            // Legacy customer account without password: set and persist their password now
            const salt = await bcrypt.genSalt(10);
            customer.password = await bcrypt.hash(password, salt);
            await customer.save();
        }

        // Generate Customer JWT token
        const token = jwt.sign(
            {
                customerId: customer._id.toString(),
                email: customer.email,
                role: "customer"
            },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            success: true,
            message: "Customer logged in successfully",
            token,
            customer: {
                id: customer._id,
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                role: "customer"
            }
        });
    } catch (error) {
        console.error("Customer login error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error during customer login"
        });
    }
};


// ================================================================
// ==================== GET CURRENT CUSTOMER PROFILE ===============
// ================================================================

// GET /api/customers/me
const getCustomerProfile = async (req, res) => {
    try {
        const customer = req.customer || await Customer.findById(req.customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found"
            });
        }

        return res.status(200).json({
            success: true,
            customer: {
                id: customer._id,
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                role: "customer"
            }
        });
    } catch (error) {
        console.error("Get customer profile error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving customer profile"
        });
    }
};


// ================================================================
// ==================== UPDATE CUSTOMER PROFILE ====================
// ================================================================

// PUT /api/customers/me
// Updates customer details and saves them directly to MongoDB
const updateCustomerProfile = async (req, res) => {
    try {
        const customerId = req.customerId;
        const { name, phone, address, password } = req.body;

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({
                success: false,
                message: "Customer not found in database"
            });
        }

        if (name) customer.name = name.trim();
        if (phone) customer.phone = phone.trim();
        if (address !== undefined) customer.address = address.trim();

        if (password) {
            if (password.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: "Password must be at least 6 characters"
                });
            }
            const salt = await bcrypt.genSalt(10);
            customer.password = await bcrypt.hash(password, salt);
        }

        await customer.save();

        return res.status(200).json({
            success: true,
            message: "Customer profile updated in MongoDB successfully",
            customer: {
                id: customer._id,
                _id: customer._id,
                name: customer.name,
                email: customer.email,
                phone: customer.phone,
                address: customer.address,
                role: "customer"
            }
        });
    } catch (error) {
        console.error("Update customer profile error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while updating customer profile in MongoDB"
        });
    }
};


// ================================================================
// ==================== EXPORT CONTROLLERS =========================
// ================================================================

// Export customer controller functions so routes can use them
module.exports = {
    createCustomer,
    getCustomers,
    customerLogin,
    getCustomerProfile,
    updateCustomerProfile
};