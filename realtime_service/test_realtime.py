"""
Test script for ShopSense Real-Time WebSocket Service
Validates:
1. WebSocket connection and ACK
2. Sale event dispatch and receipt
3. Strict vendor isolation (other vendors do not receive events)
"""

import asyncio
import json
import requests
import websockets

FASTAPI_URL = "http://127.0.0.1:8000"
WS_URL = "ws://127.0.0.1:8000"

async def test_realtime_flow():
    target_vendor = "test-vendor-123"
    other_vendor = "other-vendor-456"

    print("Checking health endpoint...")
    res = requests.get(f"{FASTAPI_URL}/health")
    assert res.status_code == 200, f"Health check failed: {res.text}"
    print("Health check OK:", res.json())

    print(f"Connecting WebSockets for {target_vendor} and {other_vendor}...")
    async with websockets.connect(f"{WS_URL}/ws/vendor/{target_vendor}") as ws_target:
        async with websockets.connect(f"{WS_URL}/ws/vendor/{other_vendor}") as ws_other:
            # 1. Check connection ACKs
            ack_target = json.loads(await ws_target.recv())
            print(f"Target vendor ACK received: {ack_target.get('type')}")
            assert ack_target.get("type") == "CONNECTION_ESTABLISHED"

            ack_other = json.loads(await ws_other.recv())
            print(f"Other vendor ACK received: {ack_other.get('type')}")
            assert ack_other.get("type") == "CONNECTION_ESTABLISHED"

            # 2. Trigger Sale Event for target_vendor
            print("\nTriggering sale event for target vendor...")
            sale_payload = {
                "vendorId": target_vendor,
                "transactionId": "txn-999888",
                "productId": "prod-777",
                "productName": "Wireless Gaming Headset",
                "category": "Electronics",
                "quantity": 2,
                "unitPrice": 1500.0,
                "totalAmount": 3000.0,
                "customerName": "Aarav Sharma"
            }

            post_res = requests.post(f"{FASTAPI_URL}/api/events/sale", json=sale_payload)
            assert post_res.status_code == 200, f"Post sale event failed: {post_res.text}"
            print("Sale event posted successfully:", post_res.json())

            # 3. Verify target_vendor received notification
            target_msg = json.loads(await asyncio.wait_for(ws_target.recv(), timeout=3.0))
            print(f"\nTarget vendor received message: {target_msg.get('type')}")
            assert target_msg.get("type") == "NEW_SALE"
            assert target_msg["data"]["productName"] == "Wireless Gaming Headset"
            assert target_msg["data"]["totalAmount"] == 3000.0
            print("Target vendor payload verified: Product =", target_msg["data"]["productName"], ", Total = INR", target_msg["data"]["totalAmount"])

            # 4. Verify other_vendor DID NOT receive this message
            try:
                msg = await asyncio.wait_for(ws_other.recv(), timeout=1.0)
                print(f"FAILED: Other vendor unexpectedly received message: {msg}")
                assert False, "Vendor isolation failed! Other vendor received target vendor's event"
            except asyncio.TimeoutError:
                print("PASSED: Other vendor timed out as expected (Vendor isolation confirmed).")

    print("\n--- ALL WEBSOCKET AND REAL-TIME TESTS PASSED! ---")

if __name__ == "__main__":
    asyncio.run(test_realtime_flow())
