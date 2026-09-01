"""
ShopSense Real-Time WebSocket & Notification Service
=====================================================
Built with FastAPI and WebSockets.
Maintains live WebSocket connections per authenticated vendor and
broadcasts instant sale events emitted from the Node/Express backend.
"""

import json
import logging
from typing import Dict, List, Optional
from datetime import datetime, timezone

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] (ShopSense RealTime) %(message)s"
)
logger = logging.getLogger("shopsense_realtime")

app = FastAPI(
    title="ShopSense Real-Time WebSocket Service",
    description="Real-time sales event and dashboard notification service for ShopSense vendors",
    version="1.0.0"
)

# Enable CORS for frontend applications
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ================================================================
# ==================== WEBSOCKET CONNECTION MANAGER =============
# ================================================================

class ConnectionManager:
    """
    Manages active WebSocket connections grouped by vendorId.
    Ensures strict vendor isolation so vendor A only receives vendor A's events.
    """

    def __init__(self):
        # Map: vendor_id (str) -> List[WebSocket]
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, vendor_id: str, websocket: WebSocket):
        await websocket.accept()
        if vendor_id not in self.active_connections:
            self.active_connections[vendor_id] = []
        self.active_connections[vendor_id].append(websocket)
        logger.info(
            f"Vendor connected: {vendor_id} | Total active sockets for vendor: {len(self.active_connections[vendor_id])}"
        )

    def disconnect(self, vendor_id: str, websocket: WebSocket):
        if vendor_id in self.active_connections:
            if websocket in self.active_connections[vendor_id]:
                self.active_connections[vendor_id].remove(websocket)
                logger.info(f"Vendor socket disconnected: {vendor_id}")
            if not self.active_connections[vendor_id]:
                del self.active_connections[vendor_id]
                logger.info(f"All connections closed for vendor: {vendor_id}")

    async def send_personal_message(self, message: dict, websocket: WebSocket):
        await websocket.send_json(message)

    async def broadcast_to_vendor(self, vendor_id: str, message: dict) -> int:
        """
        Broadcasts a notification message to all active WebSocket connections for a specific vendor.
        Returns the count of successfully notified clients.
        """
        if vendor_id not in self.active_connections:
            logger.info(f"No active WebSocket connections found for vendor: {vendor_id}")
            return 0

        dead_connections = []
        sent_count = 0

        for connection in self.active_connections[vendor_id]:
            try:
                await connection.send_json(message)
                sent_count += 1
            except Exception as e:
                logger.warning(f"Error sending message to vendor {vendor_id} socket: {e}")
                dead_connections.append(connection)

        # Clean up any stale sockets
        for dead_conn in dead_connections:
            self.disconnect(vendor_id, dead_conn)

        logger.info(f"Broadcasted event to {sent_count} client(s) for vendor: {vendor_id}")
        return sent_count


manager = ConnectionManager()


# ================================================================
# ==================== PYDANTIC DATA MODELS ======================
# ================================================================

class SaleEventPayload(BaseModel):
    vendorId: str = Field(..., description="MongoDB Vendor ID")
    transactionId: Optional[str] = Field(None, description="MongoDB Transaction ID")
    productId: Optional[str] = Field(None, description="MongoDB Product ID")
    productName: str = Field(..., description="Name of the purchased product")
    category: Optional[str] = Field("General", description="Product category")
    quantity: int = Field(1, ge=1, description="Number of units purchased")
    unitPrice: float = Field(0.0, ge=0, description="Unit selling price")
    totalAmount: float = Field(0.0, ge=0, description="Total order amount")
    customerName: Optional[str] = Field("Customer", description="Purchaser name")
    timestamp: Optional[str] = Field(None, description="ISO timestamp")


# ================================================================
# ==================== HTTP ENDPOINTS ============================
# ================================================================

@app.get("/")
@app.get("/health")
async def health_check():
    """Health check endpoint to verify that the FastAPI service is running."""
    total_connections = sum(len(conns) for conns in manager.active_connections.values())
    return {
        "status": "healthy",
        "service": "ShopSense Real-Time Service",
        "active_vendors": len(manager.active_connections),
        "total_connections": total_connections,
        "timestamp": datetime.now(timezone.utc).isoformat()
    }


@app.post("/api/events/sale", status_code=status.HTTP_200_OK)
async def receive_sale_event(event: SaleEventPayload):
    """
    Webhook endpoint invoked by the Node.js/Express backend upon completed transaction.
    Pushes real-time notification to the vendor's dashboard.
    """
    try:
        ts = event.timestamp or datetime.now(timezone.utc).isoformat()

        notification_message = {
            "type": "NEW_SALE",
            "title": "New Sale Received!",
            "data": {
                "transactionId": event.transactionId,
                "productId": event.productId,
                "productName": event.productName,
                "category": event.category,
                "quantity": event.quantity,
                "unitPrice": event.unitPrice,
                "totalAmount": event.totalAmount,
                "customerName": event.customerName,
                "timestamp": ts
            }
        }

        notified_count = await manager.broadcast_to_vendor(event.vendorId, notification_message)

        return {
            "success": True,
            "message": f"Sale event processed for vendor {event.vendorId}",
            "recipients": notified_count,
            "timestamp": ts
        }
    except Exception as e:
        logger.error(f"Error processing sale event: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to broadcast sale event: {str(e)}"
        )


# ================================================================
# ==================== WEBSOCKET ENDPOINTS =======================
# ================================================================

@app.websocket("/ws/vendor/{vendor_id}")
async def websocket_vendor_endpoint(websocket: WebSocket, vendor_id: str):
    """
    WebSocket endpoint for vendor real-time dashboards.
    Listens for vendor connection, validates vendorId, and maintains connection.
    """
    if not vendor_id or vendor_id == "undefined" or vendor_id == "null":
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await manager.connect(vendor_id, websocket)

    # Send connection acknowledgment
    await manager.send_personal_message(
        {
            "type": "CONNECTION_ESTABLISHED",
            "message": f"Connected to ShopSense Real-Time stream for vendor {vendor_id}",
            "vendorId": vendor_id,
            "timestamp": datetime.now(timezone.utc).isoformat()
        },
        websocket
    )

    try:
        while True:
            # Handle incoming ping / messages from client
            data = await websocket.receive_text()
            try:
                parsed = json.loads(data)
                if parsed.get("type") == "PING":
                    await websocket.send_json({
                        "type": "PONG",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
            except Exception:
                # Raw text ping
                if data == "ping":
                    await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(vendor_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket error for vendor {vendor_id}: {e}")
        manager.disconnect(vendor_id, websocket)


# ================================================================
# ==================== RUN APPLICATION ===========================
# ================================================================

if __name__ == "__main__":
    import uvicorn
    logger.info("Starting ShopSense Real-Time WebSocket Service on port 8000...")
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)
