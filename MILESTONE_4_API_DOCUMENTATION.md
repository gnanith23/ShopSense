# ShopSense - Milestone 4 API Documentation

Welcome to the ShopSense Milestone 4 API Documentation.  
This guide explains the ShopSense project in simple English. It is written so that teachers, students, and beginners can easily understand how the system works.

---

## 1. Project Overview

**ShopSense** is a full-stack e-commerce web application. It connects online buyers with sellers (vendors).

### Key Parts of the System
- **Frontend**: A React website where customers shop and vendors manage their stores.
- **Backend API**: A Node.js and Express server that handles accounts, products, orders, and reviews.
- **Database**: A cloud MongoDB Atlas database that stores all data safely.
- **Real-Time Service**: A Python FastAPI service that sends instant sale notifications using WebSockets.

### Main URLs
| Service | URL | What it is |
| :--- | :--- | :--- |
| **Frontend Web App** | `http://localhost:8080` | The main website for customers and vendors |
| **Backend REST API** | `http://localhost:5000` | The core server that handles data and business rules |
| **FastAPI Swagger Docs** | `http://localhost:8000/docs` | Interactive page to test real-time endpoints |
| **FastAPI ReDoc** | `http://localhost:8000/redoc` | Clean reference page for real-time endpoints |

---

## 2. How to Run the Project

You can run ShopSense in two simple ways.

### Option A: Run with Docker (Recommended)
This starts all three services together inside Docker containers:
```bash
docker compose up --build
```

### Option B: Run Locally Without Docker
Open three separate terminal windows:

1. **Terminal 1 (Backend)**:
   ```bash
   cd backend
   npm install
   npm run dev
   ```
2. **Terminal 2 (Frontend)**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
3. **Terminal 3 (Real-Time Service)**:
   ```bash
   python -m uvicorn main:app --host 127.0.0.1 --port 8000 --app-dir realtime_service
   ```

---

## 3. Main API Endpoints

### Understanding HTTP Methods
- **GET**: Reads or gets data from the server.
- **POST**: Sends new data to create something.
- **PUT**: Updates existing data.
- **DELETE**: Removes or deletes data.

---

### A. Vendor APIs

These endpoints let store owners register, log in, and see their profile.

| Method | URL | Description | Auth Needed? |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/vendors/register` | Register a new vendor store | No |
| `POST` | `/api/vendors/login` | Log in and receive a JWT token | No |
| `GET` | `/api/vendors/profile` | View current vendor account details | Yes (Bearer Token) |

#### Example: Vendor Login
- **URL**: `POST /api/vendors/login`
- **What it does**: Verifies email and password, then gives an access token.
- **Required Input**:
```json
{
  "email": "techworld@example.com",
  "password": "Password123"
}
```
- **Simple Response**:
```json
{
  "success": true,
  "token": "eyJhbGciOi...",
  "vendor": {
    "id": "65f1a2b3c4d5e6f7a8b9c0d1",
    "name": "Tech World",
    "email": "techworld@example.com"
  }
}
```

---

### B. Product APIs

These endpoints manage products. Customers can browse public items, while vendors manage their own catalog.

| Method | URL | Description | Auth Needed? |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products/marketplace` | Get all public products for shoppers | No |
| `GET` | `/api/products/my-products` | Get only the logged-in vendor's products | Yes (Vendor) |
| `POST` | `/api/products` | Add a new product to store | Yes (Vendor) |
| `PUT` | `/api/products/:id` | Update product price, stock, or details | Yes (Vendor) |
| `DELETE` | `/api/products/:id` | Remove a product from store | Yes (Vendor) |

#### Example: Add a Product
- **URL**: `POST /api/products`
- **What it does**: Adds a new item to the vendor's catalog.
- **Required Input**:
```json
{
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4GHz optical mouse",
  "category": "Electronics",
  "price": 25.99,
  "stock": 50,
  "imageUrl": "https://example.com/mouse.jpg"
}
```
- **Simple Response**:
```json
{
  "success": true,
  "message": "Product created successfully",
  "product": {
    "id": "65f2c3d4e5f6a7b8c9d0e1f2",
    "name": "Wireless Mouse",
    "price": 25.99,
    "stock": 50
  }
}
```

---

### C. Customer & Purchase APIs

These endpoints allow shoppers to create accounts and purchase products.

| Method | URL | Description | Auth Needed? |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/customers` | Register a new customer | No |
| `POST` | `/api/customers/login` | Log in as a customer | No |
| `POST` | `/api/transactions` | Purchase an item and reduce its stock | Yes or Customer ID |

#### Example: Buy an Item (Purchase)
- **URL**: `POST /api/transactions`
- **What it does**: Validates stock, creates a purchase record, decreases product stock, and triggers a real-time notification to the vendor.
- **Required Input**:
```json
{
  "customerId": "65f3a1b2c3d4e5f6a7b8c9d0",
  "productId": "65f2c3d4e5f6a7b8c9d0e1f2",
  "quantity": 1
}
```
- **Simple Response**:
```json
{
  "success": true,
  "message": "Transaction created successfully",
  "transaction": {
    "id": "65f4b2c3d4e5f6a7b8c9d0e1",
    "product": "65f2c3d4e5f6a7b8c9d0e1f2",
    "quantity": 1,
    "totalAmount": 25.99,
    "status": "COMPLETED"
  }
}
```

---

### D. Reviews & Verified Buyer APIs

ShopSense protects sellers and buyers: **Only customers who completed a purchase can leave a review.**

| Method | URL | Description | Auth Needed? |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reviews/customer-purchases` | List items bought by customer to review | Yes or Customer ID |
| `POST` | `/api/reviews` | Submit a review for a purchased product | Yes or Customer ID |

#### Example: Submit Review
- **URL**: `POST /api/reviews`
- **What it does**: Checks if customer actually bought the product. If yes, it saves the review and computes AI sentiment. If no, it returns HTTP 403 Forbidden.
- **Required Input**:
```json
{
  "customerId": "65f3a1b2c3d4e5f6a7b8c9d0",
  "productId": "65f2c3d4e5f6a7b8c9d0e1f2",
  "rating": 5,
  "reviewText": "Great build quality and very comfortable to use!"
}
```
- **Simple Response**:
```json
{
  "success": true,
  "message": "Review submitted successfully",
  "review": {
    "rating": 5,
    "sentiment": "POSITIVE",
    "sentimentScore": 0.95
  }
}
```

---

### E. Vendor Analytics APIs

Vendors have a dashboard to see their store performance.

| Method | URL | Description | Auth Needed? |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/analytics/sales-trend` | Daily/weekly revenue and order counts | Yes (Vendor) |
| `GET` | `/api/analytics/revenue-by-category` | Breakdown of sales by product type | Yes (Vendor) |
| `GET` | `/api/analytics/export/csv` | Download sales records as a CSV file | Yes (Vendor) |

---

## 4. FastAPI Swagger

FastAPI automatically generates interactive documentation for our real-time service.

### How to Access
Open your web browser and visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

### What You Can Do in Swagger
1. View all available real-time endpoints.
2. Click **"Try it out"** on any endpoint.
3. Click **"Execute"** to send live requests and see real server responses.

### Endpoints in FastAPI
- **`GET /health`**: Returns service status and the number of active vendor connections.
  ```json
  {
    "status": "healthy",
    "service": "ShopSense Real-Time Service",
    "active_vendors": 1,
    "total_connections": 1
  }
  ```
- **`POST /api/events/sale`**: Internal webhook called by the Node.js backend when a sale happens. Sends a live alert to the vendor dashboard.

---

## 5. WebSocket Realtime Service

### What is a WebSocket?
Normally, web browsers must reload a page to see new information.  
A **WebSocket** is a live, continuous phone call between the browser and the server. When something happens on the server, it instantly pushes the update to the browser without any page refresh.

### WebSocket Connection URL
```text
ws://localhost:8000/ws/vendor/{vendorId}
```

### How Real-Time Sales Work (Step-by-Step)
1. **Vendor Logs In**: The vendor dashboard opens a WebSocket connection to `ws://localhost:8000/ws/vendor/{vendorId}`.
2. **Customer Buys a Product**: The customer sends `POST /api/transactions` to the Node.js backend.
3. **Backend Notifies FastAPI**: Node.js finishes the order and sends a webhook to FastAPI (`POST /api/events/sale`).
4. **FastAPI Broadcasts Alert**: FastAPI finds the vendor's active connection and pushes a live notification:
   ```json
   {
     "type": "NEW_SALE",
     "title": "New Sale Received!",
     "data": {
       "productName": "Wireless Mouse",
       "quantity": 1,
       "totalAmount": 25.99,
       "customerName": "John Doe"
     }
   }
   ```
5. **Dashboard Updates Instantly**: A popup sound and banner show on the vendor's screen right away.

### Vendor Data Isolation
Every vendor has a unique ID. FastAPI only sends sales notifications to the vendor who owns that product. Vendor A will **never** receive notifications for Vendor B's sales.

---

## 6. Basic Testing

We have an automated test suite that verifies all core functions without breaking the application or changing real data.

### Test Coverage
1. **Product API**: Verifies public catalog and vendor-specific product lists can be fetched.
2. **Customer Purchase Validation**: Verifies the server rejects invalid quantities (0 or negative), missing customers, or orders exceeding current stock.
3. **Stock Update After Purchase**: Verifies stock decreases by the exact purchased quantity, then safely restores the product stock and removes the test order.
4. **Review Allowed Only After Purchase**: Verifies unverified users cannot submit reviews (blocks with HTTP 403).
5. **Vendor Data Isolation**: Verifies Vendor A cannot view or edit Vendor B's inventory.
6. **FastAPI Health & Swagger**: Verifies the FastAPI service is healthy and Swagger documentation is accessible.

### How to Run the Tests
Run this single command from your project root:
```bash
npm run test:m4
```
Or from the `backend` folder:
```bash
cd backend
node test_milestone4.js
```

### Safe Testing Guarantee
- **No Database Reset**: It does not wipe or reset MongoDB Atlas.
- **No Leftover Test Data**: Product stock is restored to its original value, and temporary test transactions are removed.
- **No Secrets Exposed**: All tokens are signed securely and no passwords or keys are printed.

---

## 7. Autonomous AI Vendor Agent Workflow

ShopSense includes an autonomous business agent that works in the background to help store owners succeed.

### What the AI Agent Does
Once a week, the agent analyzes each vendor's store performance, identifies low-stock items and slow-moving products, generates strategic business recommendations using AI, and sends a complete report to the vendor via email.

### The 5-Stage Weekly Workflow
```text
Stage 1: Collect Data (Products & 7-day sales for this vendor)
   ↓
Stage 2: Analyze Store Metrics (Revenue, growth, low stock, slow inventory)
   ↓
Stage 3: Generate AI Recommendations (OpenRouter / LLM with rule-based fallback)
   ↓
Stage 4: Create Vendor Report (Structured JSON summary & findings)
   ↓
Stage 5: Send Email (Delivered via Nodemailer SMTP)
```

### Protected Manual Trigger API
Store owners or administrators can manually run the analysis at any time:

| Method | URL | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/ai-agent/run` | Triggers autonomous store analysis report | Yes (Vendor or Admin) |

#### Security & Vendor Isolation
- **Vendor Request**: Vendors can **only** generate reports for their own store. If Vendor A requests Vendor B's report, access is blocked with HTTP 403.
- **Admin Request**: Admins can run the analysis for a selected vendor or all vendors.
- **Unauthenticated**: Blocked with HTTP 401.

#### Example Request
```http
POST /api/ai-agent/run HTTP/1.1
Authorization: Bearer <VENDOR_JWT_TOKEN>
Content-Type: application/json

{
  "sendEmail": false
}
```

#### Example Response
```json
{
  "success": true,
  "message": "Store analysis report generated successfully for Tech World.",
  "report": {
    "vendorId": "65f1a2b3c4d5e6f7a8b9c0d1",
    "vendorName": "Tech World",
    "reportDate": "2026-09-15",
    "storeSummary": {
      "totalProducts": 12,
      "lowStockCount": 2,
      "outOfStockCount": 0,
      "recentOrdersCount": 8,
      "recentRevenue": 14200.00
    },
    "importantFindings": [
      "Generated ₹14,200.00 across 8 completed order(s) this week.",
      "🔔 2 product(s) are running low on inventory (<= 5 units remaining)."
    ],
    "recommendations": [
      "Apply a 10%–15% promotional discount on 'Gaming Headset' to accelerate 30 units of slow-moving inventory.",
      "'Wireless Mouse' is selling fast with only 3 units left. Restock soon to prevent stockout.",
      "Focus marketing on your top category 'Electronics', which drove the highest revenue this week."
    ],
    "emailDelivery": {
      "sent": false,
      "status": "EMAIL_NOT_CONFIGURED",
      "message": "Email credentials not configured. Report generated safely without sending email."
    }
  }
}
```

### Environment Variables
Email and AI keys are configured in `backend/.env`:
- `EMAIL_HOST`: SMTP server address (e.g. `smtp.gmail.com`).
- `EMAIL_PORT`: SMTP port (e.g. `587` or `465`).
- `EMAIL_USER`: SMTP account email.
- `EMAIL_PASSWORD`: SMTP app password.
- `EMAIL_FROM`: Sender address.
- `OPENROUTER_API_KEY`: OpenRouter API key for LLM recommendations.

*Note: If email credentials or AI keys are not provided, the application does not crash. It automatically logs a clear notice and uses a built-in rule-based business engine.*

### How to Test Safely
Run the dedicated agent test suite:
```bash
cd backend
node test_ai_agent.js
```
The test checks report structure, vendor data isolation, empty store handling, fallback recommendations, and email safety without needing real email credentials.

---

## Summary for Viva and Presentation

| Feature | How It Works in ShopSense |
| :--- | :--- |
| **Architecture** | React (Port 8080) + Node.js (Port 5000) + FastAPI (Port 8000) + MongoDB Atlas |
| **Security** | JWT authentication, role checks, and vendor data isolation |
| **Review Safety** | Only customers with confirmed purchases can submit product reviews |
| **Real-Time** | Fast sales notifications delivered via FastAPI WebSockets |
| **AI Agent** | Autonomous weekly vendor analysis agent with Nodemailer & OpenRouter |
| **API Docs** | Swagger UI at `http://localhost:8000/docs` and ReDoc at `http://localhost:8000/redoc` |
| **Testing** | 12 automated tests running via `npm test` |
