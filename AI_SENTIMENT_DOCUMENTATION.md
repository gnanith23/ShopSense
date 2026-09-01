# LLM Sentiment Analysis Documentation — ShopSense

## Architecture & Authentic Customer Workflow Overview

The **LLM Sentiment Analysis** pipeline enforces an authentic **Customer-to-Vendor** review workflow backed by MongoDB transactions.

```
+-------------------+      +----------------------+      +------------------------+
| Customer Portal   | ---> | Express API Layer    | ---> | Purchase Verification  |
| ("My Purchases")  |      | POST /api/reviews    |      | (Transaction COMPLETED)|
+-------------------+      +----------------------+      +------------------------+
                                                                     |
                                                                     v
+-------------------+      +----------------------+      +------------------------+
| Vendor Dashboard  | <--- | MongoDB Aggregation  | <--- | LLM Sentiment Analysis |
| (Vendor Analytics)|      | GET /reviews/summary |      | (Extract Score, Pros)  |
+-------------------+      +----------------------+      +------------------------+
```

---

## Key Workflow & Rules

1. **Purchase Verification**: A customer can ONLY review a product if MongoDB contains a `COMPLETED` transaction for that customer and product (`Transaction.findOne({ customer, product, status: "COMPLETED" })`).
2. **Automatic Vendor Association**: The vendor is extracted directly from `product.vendor`. The customer frontend cannot choose or alter the vendor.
3. **Duplicate Prevention**: Rejects duplicate review submissions for the same customer and product combination.
4. **LLM Sentiment Extraction**: Analyzes review text + rating to compute:
   - Sentiment: `POSITIVE`, `NEUTRAL`, `NEGATIVE`
   - Sentiment Score: `0` to `100`
   - AI Summary: 1-sentence concise summary
   - Pros: Array of extracted strengths
   - Cons: Array of extracted weaknesses
5. **Vendor Isolation**: Vendor Analytics only retrieves reviews for products belonging to `req.vendorId`.

---

## Data Model (`Review.js`)

```javascript
{
  customer: ObjectId,       // Reference to Customer document (Required)
  product: ObjectId,        // Reference to Product document (Required)
  vendor: ObjectId,         // Reference to Vendor document (Required, Enforces Vendor Isolation)
  rating: Number,           // 1 to 5 stars
  reviewText: String,       // Raw review text
  sentiment: String,        // POSITIVE | NEUTRAL | NEGATIVE | UNANALYZED
  sentimentScore: Number,   // 0 to 100
  summary: String,          // AI Summary
  pros: [String],           // Extracted pros
  cons: [String],           // Extracted cons
  analyzedAt: Date,         // Timestamp of LLM execution
  createdAt: Date,
  updatedAt: Date
}
```

---

## API Reference

### 1. Get Customer Purchases (`GET /api/reviews/customer-purchases`)
- **Query**: `customerId` or `customerEmail`
- **Response**: List of purchased products from completed transactions with `hasReviewed` flag and review details.

### 2. Submit Customer Review (`POST /api/reviews`)
- **Body**:
  ```json
  {
    "productId": "65b...",
    "customerId": "65c...",
    "rating": 5,
    "reviewText": "The keyboard keys are quiet and smooth, battery lasts long."
  }
  ```
- **Validation**:
  - Requires completed transaction record in MongoDB.
  - Rejects duplicates.
  - Auto-assigns vendor ID.
  - Triggers LLM Sentiment Analysis.

### 3. Get Vendor Sentiment Summary (`GET /api/reviews/vendor/sentiment-summary`)
- **Access**: Protected (`protectVendor`)
- **Response**: Total reviews, positive/neutral/negative counts, average score, top pros/cons frequencies, recent reviews.

---

## User Portals

### Customer Portal:
- Route: `/vendor/customer-purchases` ("My Purchases (Customer)")
- Select customer profile -> View verified purchased products -> Click **"Write a Review"** -> Submit rating & feedback.

### Vendor Portal:
- Route: `/vendor/analytics` ("Analytics")
- View LLM Sentiment Analysis dashboard with real customer feedback and aggregated insights.
