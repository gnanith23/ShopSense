# ShopSense — Milestone 3 Documentation

## Advanced APIs & Reporting / Business Intelligence

Milestone 3 equips the ShopSense full-stack e-commerce platform with enterprise-grade business intelligence, real-time event streaming, retrieval-augmented product recommendations, and conversational SQL analytics.

---

## 1. System Architecture Overview

```
                                    +------------------------------------------+
                                    |             React + Vite Frontend        |
                                    | - Advanced Analytics & Chart Widgets     |
                                    | - Marketplace Benchmarking Component     |
                                    | - CSV Report Export Button               |
                                    | - Real-Time WebSockets Dashboard Feed    |
                                    | - RAG AI Shopping Assistant (Customer)   |
                                    | - AI Data Analyst Widget (Vendor SQL)    |
                                    +--------------------+---------------------+
                                                         |
                              +--------------------------+--------------------------+
                              | HTTP REST Requests                                  | WebSockets (ws://localhost:8000)
                              v                                                     v
               +-----------------------------+                     +-------------------------------+
               |    Express / Node.js        |  HTTP Sale Events   |     FastAPI WebSocket Svc     |
               |     (Port 5000)             +-------------------->+          (Port 8000)          |
               +--------------+--------------+                     +---------------+---------------+
                              |                                                     |
             +----------------+----------------+                                    |
             |                                 |                                    |
             v                                 v                                    v
+------------------------+        +--------------------------+           +--------------------+
|  MongoDB Atlas Primary |        |  SQLite Analytics Layer  |           | Live Vendor Client |
|  - Transactions        |        |  (data/analytics.db)     |           | Dashboards         |
|  - Products            |        |  - Read-Only Sync        |           +--------------------+
|  - Customers           |        |  - Safe Parameterization |
|  - Vendors             |        |  - Vendor Data Scoping   |
+------------------------+        +--------------------------+
```

---

## 2. Phase 1: Analytics APIs

Dedicated backend endpoints compute and return structured, chart-ready JSON directly from MongoDB. Frontend components never perform heavy statistical computations.

### Endpoints
1. `GET /api/analytics/sales-trend`
   - **Protection**: Vendor-scoped (`protectVendor` JWT middleware).
   - **MongoDB Aggregation**:
     ```javascript
     [
       { $match: { vendor: ObjectId(vendorId), status: "COMPLETED" } },
       { $group: {
           _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
           revenue: { $sum: "$totalAmount" },
           unitsSold: { $sum: "$quantity" },
           transactions: { $sum: 1 }
       }},
       { $sort: { _id: 1 } }
     ]
     ```
   - **Response Format**:
     ```json
     {
       "success": true,
       "summary": { "totalRevenue": 149.99, "totalUnitsSold": 1, "totalTransactions": 1, "averageOrderValue": 149.99 },
       "labels": ["2026-08-25"],
       "datasets": [
         { "label": "Revenue (₹)", "data": [149.99] },
         { "label": "Units Sold", "data": [1] },
         { "label": "Transactions", "data": [1] }
       ]
     }
     ```

2. `GET /api/analytics/revenue-by-category`
   - **Protection**: Vendor-scoped.
   - **MongoDB Aggregation**: `$lookup` join from `transactions` to `products`, unwinds product details, and groups by `$productDetails.category`.
   - **Response**: Breakdown of revenue, units sold, order count, and revenue percentage per category.

3. `GET /api/analytics/product-performance`
   - **Protection**: Vendor-scoped.
   - **MongoDB Aggregation**: Computes units sold, total revenue, average order size, and current stock for each product.

---

## 3. Phase 2: Marketplace Benchmarking

Compares authenticated vendor metrics directly against peer marketplace averages calculated across all other active vendors in MongoDB.

### Endpoint
`GET /api/analytics/benchmark`

### Metrics Evaluated
1. **Total Revenue** ($V_R$ vs $M_R$)
2. **Units Sold** ($V_U$ vs $M_U$)
3. **Total Transactions** ($V_T$ vs $M_T$)
4. **Average Order Value** ($V_{AOV} = V_R / V_T$ vs $M_{AOV} = M_R / M_T$)

### Math Formulas
$$\text{Difference} = \text{Vendor Metric} - \text{Marketplace Average}$$
$$\text{Percentage Difference} = \left( \frac{\text{Vendor Metric} - \text{Marketplace Average}}{\text{Marketplace Average}} \right) \times 100$$

### Response Example
```json
{
  "success": true,
  "comparisonBasis": "Actual active marketplace vendors",
  "otherVendorsCount": 2,
  "metrics": {
    "revenue": {
      "label": "Total Revenue",
      "unit": "₹",
      "vendor": 149.99,
      "marketplaceAvg": 4656.00,
      "difference": -4506.01,
      "percentageDifference": -96.8,
      "status": "below"
    }
  }
}
```

---

## 4. Phase 3: CSV Report Export

Enables vendors to download comprehensive, clean CSV reports containing historical sales transactions.

### Endpoint
`GET /api/analytics/export/csv`

### HTTP Headers Set
- `Content-Type: text/csv; charset=utf-8`
- `Content-Disposition: attachment; filename="ShopSense_Sales_Report.csv"`

### CSV Columns
`Date, Transaction ID, Product, Category, Quantity, Unit Price, Total Amount, Status, Customer Name, Customer Email`

---

## 5. Phase 4: Real-Time Dashboard (FastAPI + WebSockets)

The real-time sales notification pipeline connects the Node.js/Express backend with a lightweight Python FastAPI WebSocket service.

### Pipeline Flow
```
[ Customer Completes Purchase ]
              ↓
[ Express transactionController.js ]
              ↓ (Async HTTP POST /api/events/sale)
[ FastAPI Real-Time Service (Port 8000) ]
              ↓ (WebSocket Broadcast)
[ Connected Vendor Dashboard (ws://localhost:8000/ws/vendor/:vendorId) ]
              ↓
[ Instant UI Notification & Live Counter Updates Without Refresh ]
```

### Security & Vendor Isolation
- The `ConnectionManager` maintains active WebSockets partitioned by `vendor_id`.
- When an event is received, `broadcast_to_vendor(vendor_id, payload)` strictly notifies only the WebSockets connected with that specific `vendor_id`.
- Other vendors' dashboards never receive or leak sales data.

---

## 6. Phase 5: RAG AI Shopping Assistant

Retrieval-Augmented Generation (RAG) assistant for customers that answers shopping queries grounded strictly on the live ShopSense product catalog.

### Pipeline Architecture
```
[ Customer Query: "What is the best keyboard for gaming under ₹500?" ]
                                ↓
                 [ Extract Price & Category Constraints ]
                                ↓
                 [ Query Embedding (768-dim Vector) ]
                                ↓
        [ Filter In-Stock Products Only (stock > 0, price <= maxPrice) ]
                                ↓
                 [ Cosine Similarity Scoring & Ranking ]
                                ↓
             [ Top Candidate Context Formulation ]
                                ↓
                 [ Grounded LLM Prompting (Gemini / LLaMA) ]
                                ↓
[ Grounded Answer + Retrieved Product Cards with Price & Stock Details ]
```

### Guardrails
- **Out-of-Stock Filter**: Excludes products with `stock <= 0` when recommending purchasable items.
- **Strict Grounding**: Instructs LLM to never hallucinate or invent products not present in the retrieved catalog context.
- **Graceful Fallback**: Deterministic grounded template synthesis if external LLM APIs are offline.

---

## 7. Phase 6: AI Data Analyst (Text-to-SQL)

Empowers vendors to query their store performance using natural language questions converted into safe, validated SQL queries executed on a synchronized SQLite analytics database.

### Pipeline Flow
```
[ Vendor Natural Language Question: "Which product generated the most revenue?" ]
                                       ↓
                        [ SQLite Analytics Schema Prompt ]
                                       ↓
                        [ LLM Generates SQL SELECT Query ]
                                       ↓
                     [ Strict SQL Security & Safety Validator ]
                                       ↓
                        [ Injected Vendor ID Data Scoping ]
                                       ↓
                     [ Read-Only Execution on analytics.db ]
                                       ↓
                     [ LLM Synthesizes Business Explanation ]
                                       ↓
        [ Vendor Receives: Natural Answer + Executed SQL + Raw Table Results ]
```

### Strict SQL Security Guardrails
1. **Single Statement Only**: Rejects semicolons and chained multiple queries.
2. **Read-Only Enforcement**: Queries MUST begin with `SELECT` or `WITH`.
3. **Forbidden Keywords**: Disallows `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, `REVOKE`, `PRAGMA`, `ATTACH`, `DETACH`, etc.
4. **Mandatory Vendor Isolation**: Injects or verifies `WHERE vendor_id = '<vendor_id>'` scoping so vendors can never access other vendors' data.

---

## 8. Environment Variables Required

In `backend/.env`:
```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_jwt_secret_key
OPENROUTER_API_KEY=your_openrouter_api_key
GEMINI_API_KEY=your_gemini_api_key
FASTAPI_REALTIME_URL=http://127.0.0.1:8000
```

---

## 9. Exact Commands to Run the Complete System

### Option A: Run All Services Concurrently (Recommended)
From the project root:
```bash
npm run dev:all
```
*Starts Backend on port 5000, Frontend on port 5173, and FastAPI Real-Time service on port 8000.*

### Option B: Run Services in Separate Terminals

1. **Start Express Backend**:
   ```bash
   cd backend
   npm start
   ```

2. **Start FastAPI Real-Time WebSocket Service**:
   ```bash
   cd realtime_service
   python -m uvicorn main:app --host 127.0.0.1 --port 8000
   ```

3. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

---

## 10. Running Test Verification Suites

1. **Phases 1, 2, 3 Test (Analytics APIs, Benchmark, CSV Export)**:
   ```bash
   cd backend
   node test_m3_phases1_2_3.js
   ```

2. **Phase 4 Test (FastAPI Real-Time WebSockets & Vendor Isolation)**:
   ```bash
   cd realtime_service
   python test_realtime.py
   ```

3. **Phase 5 Test (RAG AI Shopping Assistant)**:
   ```bash
   cd backend
   node test_rag.js
   ```

4. **Phase 6 Test (AI Data Analyst Text-to-SQL & Security)**:
   ```bash
   cd backend
   node test_ai_analyst.js
   ```

5. **Full Regression Test Suite (Milestone 1, 2, and 3)**:
   ```bash
   cd backend
   node test_full_regression.js
   ```
