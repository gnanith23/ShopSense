# 🛍️ ShopSense – AI Powered Marketplace with Vendor Analytics

<div align="center">

![React](https://img.shields.io/badge/React-19-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?logo=mongodb)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![AI](https://img.shields.io/badge/AI-Hugging%20Face-purple)

**Software Engineering Project – Milestone 1**

</div>

---

# 📖 Project Overview

ShopSense is an AI-powered marketplace platform that enables vendors to manage products efficiently while leveraging Artificial Intelligence to generate product descriptions, SEO keywords, AI tags, and smart business insights.

The platform also provides vendor analytics, inventory monitoring, AI-powered recommendations, and an intuitive dashboard to improve product visibility and marketplace performance.

---

# 🎯 Objectives

- Simplify product management
- Improve product listings using AI
- Help vendors optimize SEO
- Monitor inventory effectively
- Provide vendor analytics
- Build a scalable marketplace platform

---

# 🚀 Features

## 👤 Vendor Module

- Vendor Registration
- Vendor Login
- JWT Authentication
- Vendor Profile Management

---

## 📦 Product Management

- Add Product
- Edit Product
- Delete Product
- Product Catalog
- Inventory Management

---

## 📊 Vendor Dashboard

- Total Products
- Revenue Analytics
- Transaction Statistics
- Inventory Overview

---

## 🤖 AI Features

### ✨ AI Product Description Generator

Automatically generates professional product descriptions.

---

### 🏷 AI Tag Generator

Generates relevant product tags.

Example:

- Wireless
- Gaming
- Bluetooth

---

### 🔍 AI SEO Keyword Generator

Automatically generates SEO-friendly keywords.

Example:

- Wireless Headset
- Bluetooth Headphones
- Gaming Headset

---

### 📈 AI SEO Score

Evaluates product SEO quality.

Example:

- SEO Score
- Suggestions
- Missing Keywords

---

### 🤖 AI Assistant

Provides intelligent recommendations such as:

- Add missing product images
- Improve SEO
- Increase low stock products
- Catalog quality analysis

---

### 📊 AI Insights Dashboard

Displays:

- AI Generated Products
- Missing SEO
- Missing Images
- Marketplace Ready Products

---

## 📉 Inventory Monitoring

- Low Stock Alert
- Out of Stock Alert
- Healthy Inventory Status

---

## 📈 Analytics

Vendor Analytics include:

- Revenue
- Transactions
- Product Count
- Performance Overview

---

# 🛠 Tech Stack

## Frontend

- React.js
- Vite
- React Router
- Axios
- Lucide React

---

## Backend

- Node.js
- Express.js

---

## Database

- MongoDB Atlas
- Mongoose

---

## Authentication

- JWT
- bcrypt

---

## Artificial Intelligence

- Hugging Face Inference API

---

# 📂 Project Structure

```
ShopSense
│
├── backend
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── models
│   ├── routes
│   ├── services
│   └── server.js
│
├── frontend
│   ├── src
│   │   ├── api
│   │   ├── assets
│   │   ├── components
│   │   ├── context
│   │   ├── layouts
│   │   └── pages
│   └── public
│
└── README.md
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/gnanith23/ShopSense.git
```

---

## Backend

```bash
cd ShopSense/backend
npm install
npm start
```

---

## Frontend

```bash
cd ShopSense/frontend
npm install
npm run dev
```

---

# 🔑 Environment Variables

Create a `.env` file inside the **backend** folder.

```
PORT=5000

MONGO_URI=YOUR_MONGODB_CONNECTION_STRING

JWT_SECRET=YOUR_SECRET_KEY

HF_API_KEY=YOUR_HUGGING_FACE_API_KEY
```

---

# 📷 Screenshots

## Vendor Dashboard

_Add Screenshot_

---

## Product Catalog

_Add Screenshot_

---

## Add Product

_Add Screenshot_

---

## AI Product Generation

_Add Screenshot_

---

## AI Assistant

_Add Screenshot_

---

## AI SEO Score

_Add Screenshot_

---

# 🔮 Future Enhancements

- Customer Module
- Order Management
- Payment Gateway
- AI Price Recommendation
- AI Demand Prediction
- Sales Forecasting
- Email Notifications
- Product Recommendation System
- Admin Reports

---

# 👨‍💻 Developed By

**Gnanith**

Software Engineering Project

Vellore Institute of Technology

---

# 📜 License

This project is developed for academic and learning purposes.

---

# ⭐ Acknowledgements

- React.js
- Node.js
- Express.js
- MongoDB Atlas
- Hugging Face AI
- JWT Authentication

---
# ShopSense — AI-Powered Marketplace with Vendor Analytics

ShopSense is a vendor-focused marketplace platform that combines product management, inventory monitoring, business analytics, customer insights and AI-assisted product content generation.

The project was developed incrementally across multiple milestones.

---

## 🚀 Project Overview

ShopSense helps vendors manage their marketplace operations through a centralized dashboard.

The platform provides:

- Secure vendor authentication
- Product catalog management
- Inventory and stock monitoring
- Sales analytics
- Customer segmentation
- Rule-based product recommendations
- Inventory intelligence
- ML-based demand forecasting
- AI-assisted product content generation

---

# 📌 Milestone 1 — Marketplace Foundation & AI Features

Milestone 1 focused on establishing the secure marketplace foundation.

### 🔐 Authentication & Authorization

- Vendor registration and login
- JWT-based authentication
- Password hashing using bcrypt
- Role-based access control
- Protected routes

### 📦 Product Management

- Add products
- Edit products
- Delete products
- Product catalog
- Product images
- Product categories
- Pricing and stock quantity
- Vendor profile management

### 📊 Vendor & Admin Dashboards

- Vendor dashboard
- Admin dashboard
- Vendor management
- Sales analytics foundation
- Product and inventory visibility

### 🤖 Gemini AI Features

Google Gemini is integrated to assist vendors with:

- Product description generation
- SEO keyword suggestions
- Product tags
- AI catalog insights
- SEO scoring
- Catalog quality scoring
- AI assistant functionality

---

# 📈 Milestone 2 — Inventory Intelligence & Customer Analytics

Milestone 2 extends the marketplace foundation with analytics, customer intelligence, recommendations and predictive inventory planning.

## 📦 Inventory Intelligence

The existing product stock quantity is used as the inventory source of truth.

Features include:

- Current stock visibility
- Inventory summary
- Low-stock detection
- Out-of-stock detection
- Low-stock alerts
- Inventory planning support

---

## 👥 Customer Segmentation

Customers are grouped according to their total spending calculated from completed transactions.

### Customer segments

- VIP
- High Value
- Regular
- Low Value

This helps vendors understand customer spending behaviour and customer value.

---

## 🛍️ Rule-Based Recommendations

ShopSense provides category-based product recommendations using historical sales data.

### Process

1. Select a product category
2. Analyze completed transactions
3. Calculate product sales
4. Rank products by units sold
5. Display top-selling products

This recommendation system is **rule-based** and does not use an LLM.

---

## ✅ Analytical Validation

Analytical results are cross-checked against the underlying MongoDB data.

Validation covers:

- Inventory calculations
- Customer segmentation
- Product recommendations
- Historical transaction analysis

The validation system helps ensure that displayed analytics correspond to the actual stored data.

---

# 🔮 ML Inventory Demand Forecasting

ShopSense includes an advanced time-series demand forecasting feature.

### Forecasting workflow

```text
Historical Completed Transactions
              ↓
       Daily Sales Data
              ↓
    Time-Series Forecasting
              ↓
       Predicted Demand
              ↓
      Compare With Stock
              ↓
    Restock Recommendation

## ⭐ Advanced Milestone 2 Features

### 💬 1. LLM Review Sentiment Analysis

Builds an AI pipeline using OpenRouter / Gemini LLMs to analyze customer reviews for vendors.

- **Sentiment Classification**: Categorizes feedback as `POSITIVE`, `NEUTRAL`, or `NEGATIVE`.
- **Sentiment Score**: Normalized metric from `0` to `100`.
- **Review Summary**: Concise 1-sentence summary generated by LLM.
- **Top Pros & Cons**: Frequently mentioned strengths and weaknesses aggregated across reviews.
- **Resilient Fallback**: Embedded NLP rule engine ensures zero downtime during LLM timeouts or rate limits.
- **Vendor Isolation**: Enforces strict security so vendors only access their own product feedback.

---

### 🔍 2. Vector Search Recommendations

Upgrades recommendation capabilities with 768-dimensional semantic vector search.

- **MongoDB Atlas Vector Search**: Uses Atlas `$vectorSearch` indexes on `Product.embedding` (768-dim) with cosine similarity in-memory fallback.
- **User Behavior Embeddings**: Constructs customer preference vectors from real historical transactions (products bought, categories, spend).
- **Out-of-Stock Filtering**: Automatically excludes out-of-stock items (`stock > 0`).
- **Contextual Ranking**: Recommends semantically matching items even across categories, displaying match percentage and rationale.
---

# 🚀 Milestone 3 Features: Advanced APIs & Reporting / Business Intelligence

### 📈 1. Dedicated Analytics Endpoints (Phase 1)
- `GET /api/analytics/sales-trend`: Formatted chart-ready JSON (`labels`, `datasets`) for sales trajectory over time.
- `GET /api/analytics/revenue-by-category`: Aggregates revenue, units sold, and percentage distribution by product category.
- `GET /api/analytics/product-performance`: Aggregates sales volume, total revenue, and inventory status per product.

---

### 🎯 2. Marketplace Benchmarking (Phase 2)
- `GET /api/analytics/benchmark`: Evaluates authenticated vendor metrics (Revenue, Units Sold, Orders, Average Order Value) against live marketplace peer averages from MongoDB.
- Computes difference and percentage variance badges.

---

### 📄 3. Basic CSV Report Export (Phase 3)
- `GET /api/analytics/export/csv`: Generates and downloads a complete sales transaction report (`ShopSense_Sales_Report.csv`) with correct attachment headers and customer details.

---

### ⚡ 4. Real-Time Dashboard via FastAPI + WebSockets (Phase 4)
- **FastAPI Real-Time Service**: Dedicated Python service running on port `8000`.
- **WebSocket Endpoint**: `ws://localhost:8000/ws/vendor/:vendorId` with auto-reconnection and connection lifecycle management.
- **Node Backend Webhook**: When transactions complete in Express, an asynchronous event is pushed to FastAPI, streaming new sales notifications and live revenue counters to the vendor's dashboard without manual page refreshes.
- **Strict Vendor Isolation**: Only the vendor who received the sale gets the event.

---

### 🤖 5. RAG AI Shopping Assistant (Phase 5)
- **Customer Shopping Chatbot**: Interactive customer-facing shopping assistant powered by Retrieval-Augmented Generation.
- **Endpoint**: `POST /api/ai/shopping-assistant`
- **Grounded Pipeline**: Embeds query → filters active in-stock products (`stock > 0`) → performs vector cosine similarity search → constructs catalog context → LLM produces grounded recommendations with product cards.

---

### 💡 6. AI Data Analyst / Text-to-SQL (Phase 6)
- **Vendor AI Analyst**: Translates natural language questions into safe SQL analytics queries.
- **Endpoint**: `POST /api/analytics/ai-analyst`
- **Safe SQL Layer**: Synchronizes MongoDB transactions to a read-only SQLite database (`data/analytics.db`).
- **Strict Security Guardrails**: Permits ONLY single `SELECT` or `WITH` queries, rejects destructive operations (`INSERT`, `UPDATE`, `DELETE`, `DROP`, etc.), and enforces vendor ID data isolation.

---

## ⭐ If you like this project, consider giving it a star on GitHub!

## Milestone 3 — Advanced APIs & Reporting

Milestone 3 extends ShopSense with advanced analytics, reporting, and AI capabilities.

### Advanced Analytics
- Analytics endpoints formatted for frontend charts and graphs
- Marketplace benchmarking to compare vendor performance with marketplace averages
- CSV-based data export for reporting

### LLM Sentiment Analysis
- Customer product reviews are analyzed using an LLM
- Generates sentiment classification and sentiment score
- Extracts review summary, frequently mentioned pros, and cons
- Vendor-specific review isolation

### Vector Recommendations
- Product embeddings are generated from product information
- Customer preference vectors are derived from purchase behaviour
- Cosine similarity is used to rank semantically similar products
- Out-of-stock products are excluded from recommendations

### RAG-Powered AI Shopping Assistant
- Customers can ask natural-language questions about products
- Retrieves relevant product information from the ShopSense catalog
- Generates contextual answers using retrieved product data

### AI Data Analyst
- Vendors can ask natural-language questions about their sales data
- Converts questions into data queries and analyzes the results
- Provides business insights through the vendor analytics interface

### Real-Time Dashboard
- FastAPI-based real-time service
- WebSocket communication for live dashboard updates
- Real-time sales notifications without requiring manual page refresh

### Milestone 3 Technology Stack
- React + Vite
- Node.js + Express
- MongoDB Atlas
- Google Gemini / LLM services
- Vector embeddings and cosine similarity
- FastAPI
- WebSockets
- REST APIs
- MongoDB aggregation
- CSV reporting