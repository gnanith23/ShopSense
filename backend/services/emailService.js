/**
 * ShopSense - Email Delivery Service
 * ===================================
 * Delivers transactional emails and autonomous weekly vendor analysis reports.
 * Uses Nodemailer with SMTP credentials strictly loaded from environment variables.
 * 
 * Safety:
 * - If email credentials are missing, logs a safe notice and never crashes.
 * - Never exposes credentials or passwords in logs or errors.
 */

const nodemailer = require("nodemailer");

/**
 * Checks whether required SMTP credentials are fully provided in environment.
 */
function isEmailConfigured() {
    return Boolean(
        process.env.EMAIL_HOST &&
        process.env.EMAIL_PORT &&
        process.env.EMAIL_USER &&
        process.env.EMAIL_PASSWORD
    );
}

/**
 * Creates and returns a Nodemailer transporter.
 * Returns null if credentials are incomplete.
 */
function getTransporter() {
    if (!isEmailConfigured()) {
        return null;
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT) || 587,
        secure: Number(process.env.EMAIL_PORT) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
}

/**
 * Sends a weekly autonomous analysis report email to a vendor.
 * 
 * @param {Object} params
 * @param {string} params.to - Recipient email address
 * @param {string} params.vendorName - Business or contact name of vendor
 * @param {Object} params.report - The structured analysis report
 * @returns {Promise<{ sent: boolean, status: string, message: string, messageId?: string }>}
 */
async function sendVendorWeeklyReportEmail({ to, vendorName, report }) {
    if (!to) {
        return {
            sent: false,
            status: "MISSING_RECIPIENT",
            message: "No recipient email address provided for vendor."
        };
    }

    if (!isEmailConfigured()) {
        console.log(
            `[EmailService] Notice: Email credentials (EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASSWORD) not configured. Report generated for ${vendorName} (${to}) but email was not sent.`
        );
        return {
            sent: false,
            status: "EMAIL_NOT_CONFIGURED",
            message: "Email credentials not configured in environment. Report generated safely without sending email."
        };
    }

    try {
        const transporter = getTransporter();
        const fromAddress = process.env.EMAIL_FROM || `"ShopSense AI Agent" <${process.env.EMAIL_USER}>`;

        // Format email body
        const subject = `📊 ShopSense Weekly Store Analysis - ${vendorName} (${report.reportDate})`;

        const textBody = `
==================================================
SHOPSENSE WEEKLY VENDOR ANALYSIS REPORT
==================================================
Vendor: ${vendorName}
Report Date: ${report.reportDate}

STORE SUMMARY
-------------
Total Products: ${report.storeSummary.totalProducts}
Healthy Stock: ${report.storeSummary.healthyStockCount}
Low Stock Products: ${report.storeSummary.lowStockCount}
Out of Stock Products: ${report.storeSummary.outOfStockCount}
Recent Orders (Last 7 Days): ${report.storeSummary.recentOrdersCount}
Recent Revenue (Last 7 Days): ₹${report.storeSummary.recentRevenue.toFixed(2)}

KEY FINDINGS
------------
${report.importantFindings.map(f => `• ${f}`).join("\n")}

AI STRATEGIC RECOMMENDATIONS
----------------------------
${report.recommendations.map(r => `• ${r}`).join("\n")}

==================================================
Generated automatically by ShopSense Autonomous AI Agent.
`;

        const htmlBody = `
<div style="font-family: Arial, sans-serif; max-width: 640px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
  <h2 style="color: #2563eb; margin-top: 0;">ShopSense Weekly Store Analysis</h2>
  <p>Hello <strong>${vendorName}</strong>,</p>
  <p>Here is your autonomous weekly store performance and inventory analysis report for <strong>${report.reportDate}</strong>.</p>
  
  <div style="background-color: #f8fafc; padding: 16px; border-radius: 6px; margin: 16px 0;">
    <h3 style="margin-top: 0; color: #1e293b;">Store Summary (Last 7 Days)</h3>
    <ul style="line-height: 1.6; color: #334155;">
      <li><strong>Total Products:</strong> ${report.storeSummary.totalProducts}</li>
      <li><strong>Healthy Stock Items:</strong> ${report.storeSummary.healthyStockCount}</li>
      <li><strong>Low Stock Items (&le; 5 units):</strong> <span style="color: #ea580c; font-weight: bold;">${report.storeSummary.lowStockCount}</span></li>
      <li><strong>Out of Stock Items:</strong> <span style="color: #dc2626; font-weight: bold;">${report.storeSummary.outOfStockCount}</span></li>
      <li><strong>Completed Orders:</strong> ${report.storeSummary.recentOrdersCount}</li>
      <li><strong>Total Revenue:</strong> ₹${report.storeSummary.recentRevenue.toFixed(2)}</li>
    </ul>
  </div>

  <div style="margin: 16px 0;">
    <h3 style="color: #1e293b;">Key Findings</h3>
    <ul style="color: #334155; line-height: 1.6;">
      ${report.importantFindings.map(f => `<li>${f}</li>`).join("")}
    </ul>
  </div>

  <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px; margin: 16px 0;">
    <h3 style="margin-top: 0; color: #065f46;">AI Strategic Recommendations</h3>
    <ul style="color: #047857; line-height: 1.6; margin-bottom: 0;">
      ${report.recommendations.map(r => `<li>${r}</li>`).join("")}
    </ul>
  </div>

  <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
    This automated analysis was generated by the ShopSense Autonomous AI Agent.
  </p>
</div>
`;

        const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject,
            text: textBody,
            html: htmlBody
        });

        console.log(`[EmailService] Weekly report email successfully sent to ${to}. Message ID: ${info.messageId}`);

        return {
            sent: true,
            status: "SENT",
            message: "Weekly report email delivered successfully.",
            messageId: info.messageId
        };
    } catch (error) {
        console.error(`[EmailService] Failed to send email to ${to}:`, error.message);
        return {
            sent: false,
            status: "FAILED",
            message: `Email delivery failed: ${error.message}`
        };
    }
}

module.exports = {
    isEmailConfigured,
    sendVendorWeeklyReportEmail
};
