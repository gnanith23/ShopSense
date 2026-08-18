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

## ⭐ If you like this project, consider giving it a star on GitHub!
