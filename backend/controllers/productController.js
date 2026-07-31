// ==================== IMPORT MODELS ====================

const Product = require("../models/Product");
const Vendor = require("../models/Vendor");


// ================================================================
// ==================== CREATE PRODUCT =============================
// ================================================================

const createProduct = async (req, res) => {

    try {

        // IMPORTANT:
        // Vendor ID comes from the verified JWT token.
        //
        // protectVendor middleware already created:
        //
        // req.vendorId = decoded.vendorId
        const vendorId = req.vendorId;


        // ==================== GET PRODUCT DATA ====================

        const {
            name,
            description,
            category,
            price,
            stock,
            imageUrl,
            aiTags,
            seoKeywords
        } = req.body;


        // ==================== VALIDATION ====================

        if (
            !name ||
            !description ||
            !category ||
            price === undefined
        ) {

            return res.status(400).json({
                success: false,
                message: "Please provide all required product fields"
            });
        }


        // ==================== CHECK PRICE ====================

        const productPrice = Number(price);

        if (
            Number.isNaN(productPrice) ||
            productPrice < 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Price must be a valid non-negative number"
            });
        }


        // ==================== CHECK STOCK ====================

        const productStock =
            stock !== undefined
                ? Number(stock)
                : 0;


        if (
            !Number.isInteger(productStock) ||
            productStock < 0
        ) {

            return res.status(400).json({
                success: false,
                message: "Stock must be a non-negative whole number"
            });
        }


        // ==================== CHECK VENDOR ====================

        const vendor = await Vendor.findById(vendorId);


        if (!vendor) {

            return res.status(404).json({
                success: false,
                message: "Vendor not found"
            });
        }


        // ==================== CREATE PRODUCT ====================

        const product = await Product.create({

            // Vendor automatically comes from JWT
            vendor: vendorId,

            name,

            description,

            category,

            price: productPrice,

            stock: productStock,

            imageUrl: imageUrl || "",

            aiTags: aiTags || [],

            seoKeywords: seoKeywords || []
        });


        // ==================== SUCCESS RESPONSE ====================

        return res.status(201).json({

            success: true,

            message: "Product created successfully",

            product: {

                id: product._id,

                vendor: product.vendor,

                name: product.name,

                description: product.description,

                category: product.category,

                price: product.price,

                stock: product.stock,

                imageUrl: product.imageUrl,

                aiTags: product.aiTags,

                seoKeywords: product.seoKeywords,

                createdAt: product.createdAt
            }
        });


    } catch (error) {

        console.error(
            "Create product error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while creating product"
        });
    }
};


// ================================================================
// ==================== GET MY PRODUCTS ============================
// ================================================================

// Instead of trusting a vendor ID from the frontend,
// use the vendor ID stored inside the JWT.
const getMyProducts = async (req, res) => {

    try {

        const vendorId = req.vendorId;


        // ==================== FIND PRODUCTS ====================

        const products = await Product.find({

            vendor: vendorId

        }).sort({

            createdAt: -1
        });


        // ==================== SUCCESS RESPONSE ====================

        return res.status(200).json({

            success: true,

            message: "Vendor products retrieved successfully",

            count: products.length,

            products
        });


    } catch (error) {

        console.error(
            "Get vendor products error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while retrieving vendor products"
        });
    }
};


// ================================================================
// ==================== GET SINGLE PRODUCT =========================
// ================================================================

const getProductById = async (req, res) => {

    try {

        const productId = req.params.id;

        const vendorId = req.vendorId;


        // ==================== FIND PRODUCT ====================

        const product = await Product.findById(productId);


        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        // ==================== OWNERSHIP CHECK ====================

        // Product vendor must match authenticated vendor.
        if (
            product.vendor.toString() !==
            vendorId.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "You are not authorized to access this product"
            });
        }


        // ==================== SUCCESS RESPONSE ====================

        return res.status(200).json({

            success: true,

            message: "Product retrieved successfully",

            product
        });


    } catch (error) {

        console.error(
            "Get product error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while retrieving product"
        });
    }
};


// ================================================================
// ==================== UPDATE PRODUCT =============================
// ================================================================

const updateProduct = async (req, res) => {

    try {

        const productId = req.params.id;

        const vendorId = req.vendorId;


        // ==================== FIND PRODUCT ====================

        const product = await Product.findById(productId);


        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        // ==================== OWNERSHIP CHECK ====================

        if (
            product.vendor.toString() !==
            vendorId.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "You are not authorized to update this product"
            });
        }


        // ==================== GET UPDATE DATA ====================

        const {
            name,
            description,
            category,
            price,
            stock,
            imageUrl,
            aiTags,
            seoKeywords
        } = req.body;


        // ==================== UPDATE NAME ====================

        if (name !== undefined) {

            product.name = name;
        }


        // ==================== UPDATE DESCRIPTION ====================

        if (description !== undefined) {

            product.description = description;
        }


        // ==================== UPDATE CATEGORY ====================

        if (category !== undefined) {

            product.category = category;
        }


        // ==================== UPDATE PRICE ====================

        if (price !== undefined) {

            const updatedPrice = Number(price);


            if (
                Number.isNaN(updatedPrice) ||
                updatedPrice < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Price must be a valid non-negative number"
                });
            }


            product.price = updatedPrice;
        }


        // ==================== UPDATE STOCK ====================

        if (stock !== undefined) {

            const updatedStock = Number(stock);


            if (
                !Number.isInteger(updatedStock) ||
                updatedStock < 0
            ) {

                return res.status(400).json({
                    success: false,
                    message: "Stock must be a non-negative whole number"
                });
            }


            product.stock = updatedStock;
        }


        // ==================== UPDATE IMAGE ====================

        if (imageUrl !== undefined) {

            product.imageUrl = imageUrl;
        }


        // ==================== UPDATE AI TAGS ====================

        if (aiTags !== undefined) {

            product.aiTags = aiTags;
        }


        // ==================== UPDATE SEO KEYWORDS ====================

        if (seoKeywords !== undefined) {

            product.seoKeywords = seoKeywords;
        }


        // ==================== SAVE PRODUCT ====================

        await product.save();


        // ==================== SUCCESS RESPONSE ====================

        return res.status(200).json({

            success: true,

            message: "Product updated successfully",

            product
        });


    } catch (error) {

        console.error(
            "Update product error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while updating product"
        });
    }
};


// ================================================================
// ==================== DELETE PRODUCT =============================
// ================================================================

const deleteProduct = async (req, res) => {

    try {

        const productId = req.params.id;

        const vendorId = req.vendorId;


        // ==================== FIND PRODUCT ====================

        const product = await Product.findById(productId);


        if (!product) {

            return res.status(404).json({
                success: false,
                message: "Product not found"
            });
        }


        // ==================== OWNERSHIP CHECK ====================

        if (
            product.vendor.toString() !==
            vendorId.toString()
        ) {

            return res.status(403).json({
                success: false,
                message: "You are not authorized to delete this product"
            });
        }


        // ==================== DELETE PRODUCT ====================

        await product.deleteOne();


        // ==================== SUCCESS RESPONSE ====================

        return res.status(200).json({

            success: true,

            message: "Product deleted successfully",

            product: {

                id: product._id,

                name: product.name
            }
        });


    } catch (error) {

        console.error(
            "Delete product error:",
            error.message
        );


        return res.status(500).json({
            success: false,
            message: "Server error while deleting product"
        });
    }
};


// ================================================================
// ==================== EXPORT CONTROLLERS =========================
// ================================================================

module.exports = {

    createProduct,

    getMyProducts,

    getProductById,

    updateProduct,

    deleteProduct
};