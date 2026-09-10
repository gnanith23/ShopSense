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
// ==================== GET MARKETPLACE PRODUCTS ===================
// ================================================================

// GET /api/products/marketplace
//
// Public/Customer marketplace endpoint:
// - Retrieves products from registered, non-suspended vendors
// - Supports search by product name, model, description, category
// - Groups comparable products across vendors by productModel (or normalized name)
// - Sorts vendor offers from lowest price to highest price
// - Populates vendor details (businessName, name, email, address)
const getMarketplaceProducts = async (req, res) => {
    try {
        const { search, category, sortBy } = req.query;

        // Step 1: Find active vendors (exclude SUSPENDED vendors)
        const activeVendors = await Vendor.find({
            status: { $ne: "SUSPENDED" }
        }).select("_id name businessName email phone address status");

        const activeVendorIds = activeVendors.map(v => v._id);
        const vendorMap = new Map();
        activeVendors.forEach(v => vendorMap.set(v._id.toString(), v));

        // Step 2: Build product query
        const productQuery = {
            vendor: { $in: activeVendorIds }
        };

        if (category && category.trim() && category.toLowerCase() !== "all") {
            productQuery.category = new RegExp(`^${category.trim()}$`, "i");
        }

        if (search && search.trim()) {
            const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
            productQuery.$or = [
                { name: searchRegex },
                { productModel: searchRegex },
                { description: searchRegex },
                { category: searchRegex },
                { aiTags: { $in: [searchRegex] } },
                { seoKeywords: { $in: [searchRegex] } }
            ];
        }

        // Fetch products
        let products = await Product.find(productQuery)
            .populate("vendor", "_id name businessName email phone address status")
            .lean();

        // Step 3: Sort flat products list
        if (sortBy === "price_asc") {
            products.sort((a, b) => a.price - b.price);
        } else if (sortBy === "price_desc") {
            products.sort((a, b) => b.price - a.price);
        } else if (sortBy === "name_asc") {
            products.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            // Default: newest first
            products.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }

        // Step 4: Group comparable products across vendors
        // Identifies identical/comparable products using productModel or normalized name.
        // For example, "Gaming Mouse" from Vendor 1 and Vendor 2 group together.
        // "iPhone 15" from Vendor 1 and Vendor 2 group together, but NOT with "Samsung S24".
        const groupsMap = new Map();

        for (const p of products) {
            if (!p.vendor) continue;

            const groupKey = (p.productModel && p.productModel.trim())
                ? p.productModel.toLowerCase().trim()
                : p.name.toLowerCase().trim();

            if (!groupsMap.has(groupKey)) {
                groupsMap.set(groupKey, {
                    groupKey,
                    productName: p.name,
                    productModel: p.productModel || p.name,
                    category: p.category,
                    description: p.description,
                    imageUrl: p.imageUrl,
                    aiTags: p.aiTags || [],
                    offers: []
                });
            }

            const group = groupsMap.get(groupKey);
            group.offers.push({
                productId: p._id,
                productName: p.name,
                productModel: p.productModel || p.name,
                category: p.category,
                price: p.price,
                stock: p.stock,
                inStock: p.stock > 0,
                imageUrl: p.imageUrl,
                description: p.description,
                vendorId: p.vendor._id,
                vendorName: p.vendor.businessName || p.vendor.name || "Merchant Store",
                vendorEmail: p.vendor.email,
                vendorAddress: p.vendor.address || "",
                createdAt: p.createdAt
            });
        }

        // Step 5: Process each group - sort offers lowest price to highest price
        const comparableGroups = Array.from(groupsMap.values()).map(group => {
            // Sort offers lowest price to highest price
            group.offers.sort((a, b) => a.price - b.price);

            // Mark lowest price as best offer
            if (group.offers.length > 0) {
                group.offers[0].isBestOffer = true;
            }

            const prices = group.offers.map(o => o.price);
            group.minPrice = Math.min(...prices);
            group.maxPrice = Math.max(...prices);
            group.totalStock = group.offers.reduce((sum, o) => sum + (Number(o.stock) || 0), 0);
            group.offerCount = group.offers.length;

            return group;
        });

        // If sorting groups by price, sort groups by minPrice
        if (sortBy === "price_asc") {
            comparableGroups.sort((a, b) => a.minPrice - b.minPrice);
        } else if (sortBy === "price_desc") {
            comparableGroups.sort((a, b) => b.minPrice - a.minPrice);
        }

        // Extract distinct available categories
        const distinctCategories = await Product.distinct("category", {
            vendor: { $in: activeVendorIds }
        });

        return res.status(200).json({
            success: true,
            message: "Marketplace products retrieved successfully",
            count: products.length,
            groupCount: comparableGroups.length,
            products,
            comparableGroups,
            categories: distinctCategories.filter(Boolean).sort()
        });

    } catch (error) {
        console.error("Get marketplace products error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Server error while retrieving marketplace products"
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

    deleteProduct,

    getMarketplaceProducts
};