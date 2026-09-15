/**
 * ShopSense - AI Agent Routes
 * ===========================
 * Exposes protected endpoints for the Autonomous AI Vendor Analysis Agent.
 * 
 * Access control:
 * - Requires Bearer token (Approved Vendor or Admin).
 * - Strict vendor data isolation: A vendor can only generate their own report.
 * - Admin can trigger for any vendor or all vendors.
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const Vendor = require("../models/Vendor");
const { analyzeSingleVendor, runWeeklyVendorAgent } = require("../services/aiAgentService");

const router = express.Router();

// =========================================================================
// MIDDLEWARE: AUTHENTICATE APPROVED VENDOR OR ADMIN
// =========================================================================

const protectVendorOrAdmin = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "Authentication required. Please provide a valid Bearer token."
            });
        }

        const token = authHeader.split(" ")[1];
        if (!token) {
            return res.status(401).json({
                success: false,
                message: "Authentication token missing."
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_jwt_secret");

        // Admin check
        if (decoded.adminId && decoded.role === "ADMIN") {
            req.isAdmin = true;
            req.adminId = decoded.adminId;
            return next();
        }

        // Vendor check
        if (decoded.vendorId) {
            const vendor = await Vendor.findById(decoded.vendorId);
            if (!vendor) {
                return res.status(401).json({
                    success: false,
                    message: "Vendor account no longer exists."
                });
            }

            if (vendor.status !== "APPROVED") {
                return res.status(403).json({
                    success: false,
                    message: "Vendor account is not approved. Access denied."
                });
            }

            req.vendorId = vendor._id.toString();
            req.vendor = vendor;
            req.isAdmin = false;
            return next();
        }

        return res.status(403).json({
            success: false,
            message: "Unauthorized token role."
        });
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: "Invalid or expired authentication token."
        });
    }
};

// =========================================================================
// POST /api/ai-agent/run
// Protected manual trigger for autonomous store analysis
// =========================================================================

router.post("/run", protectVendorOrAdmin, async (req, res) => {
    try {
        const { vendorId, sendEmail = false } = req.body;
        let targetVendorId;

        if (req.isAdmin) {
            // Admin: can specify vendorId or run across all approved stores
            targetVendorId = vendorId || req.query.vendorId;

            if (!targetVendorId) {
                const batchResult = await runWeeklyVendorAgent({ sendEmail: Boolean(sendEmail) });
                return res.status(200).json({
                    success: true,
                    message: `Autonomous weekly agent completed for ${batchResult.analyzedVendors} vendor(s).`,
                    result: batchResult
                });
            }
        } else {
            // Vendor: STRICT DATA ISOLATION - can ONLY trigger for themselves
            if (vendorId && vendorId.toString() !== req.vendorId.toString()) {
                return res.status(403).json({
                    success: false,
                    message: "Vendor data isolation: You cannot access or generate reports for another vendor."
                });
            }
            targetVendorId = req.vendorId;
        }

        // Generate the report
        const report = await analyzeSingleVendor(targetVendorId, {
            sendEmail: Boolean(sendEmail)
        });

        return res.status(200).json({
            success: true,
            message: `Store analysis report generated successfully for ${report.vendorName}.`,
            report
        });
    } catch (error) {
        console.error("[AIAgentRoutes] Error generating store analysis:", error.message);
        return res.status(500).json({
            success: false,
            message: `Failed to execute AI agent analysis: ${error.message}`
        });
    }
});

module.exports = router;
