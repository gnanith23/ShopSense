// ==================== REAL-TIME NOTIFIER SERVICE ====================
// Sends real-time transaction event notifications to the FastAPI WebSocket service.

const axios = require("axios");

const FASTAPI_URL = process.env.FASTAPI_REALTIME_URL || "http://localhost:8000";

/**
 * Notifies the FastAPI WebSocket service of a newly completed transaction.
 * Operates asynchronously so transaction completion is never blocked if FastAPI is offline.
 * 
 * @param {Object} eventData
 * @param {string} eventData.vendorId
 * @param {string} eventData.transactionId
 * @param {string} eventData.productId
 * @param {string} eventData.productName
 * @param {string} eventData.category
 * @param {number} eventData.quantity
 * @param {number} eventData.unitPrice
 * @param {number} eventData.totalAmount
 * @param {string} [eventData.customerName]
 */
async function notifyRealtimeSale(eventData) {
    try {
        const payload = {
            vendorId: eventData.vendorId?.toString(),
            transactionId: eventData.transactionId?.toString(),
            productId: eventData.productId?.toString(),
            productName: eventData.productName || "Product",
            category: eventData.category || "General",
            quantity: Number(eventData.quantity) || 1,
            unitPrice: Number(eventData.unitPrice) || 0,
            totalAmount: Number(eventData.totalAmount) || 0,
            customerName: eventData.customerName || "Customer",
            timestamp: new Date().toISOString()
        };

        const response = await axios.post(
            `${FASTAPI_URL}/api/events/sale`,
            payload,
            { timeout: 3000 }
        );

        if (response.data?.success) {
            console.log(`[RealTime] Broadcasted sale event to ${response.data.recipients} client(s) for vendor ${payload.vendorId}`);
        }
    } catch (err) {
        // Graceful non-blocking fallback if FastAPI service is temporarily stopped or unavailable
        console.warn(`[RealTime] Real-time notification notice (service offline or unreachable): ${err.message}`);
    }
}

module.exports = {
    notifyRealtimeSale
};
