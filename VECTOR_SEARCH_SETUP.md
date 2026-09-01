# Vector Search Setup & Documentation — ShopSense

## Architectural Decision

**Decision**: Utilize **MongoDB Atlas Vector Search** as the primary vector database capability, backed by a high-speed L2-normalized cosine similarity fallback engine.

### Rationale:
1. **Single Unified Database**: ShopSense already uses MongoDB Atlas for `Products`, `Transactions`, `Customers`, and `Vendors`. Introducing PostgreSQL / `pgvector` would create unnecessary operational complexity, dual database connections, and sync overhead.
2. **Zero Downtime**: Storing the 768-dimensional embedding array directly on the `Product.embedding` document allows both native MongoDB Atlas `$vectorSearch` aggregations and in-memory cosine similarity evaluation when running locally or on standard MongoDB.

---

## Vector Index Configuration (MongoDB Atlas)

To enable native `$vectorSearch` on MongoDB Atlas, configure the vector index on the `products` collection as follows:

### Index Name: `product_vector_index`
### Target Collection: `products`

### Vector Index Definition (JSON):

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 768,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "vendor"
    },
    {
      "type": "filter",
      "path": "stock"
    }
  ]
}
```

---

## Embedding Generation Details

- **Model**: Google Gemini `text-embedding-004` (768 dimensions) / OpenRouter embedding model / L2-normalized 768-dim semantic hash vectorizer.
- **Dimensions**: `768`
- **Product Text Input**: Combines `Name`, `Category`, `Description`, `aiTags`, and `seoKeywords`. Sensitive financial or customer data is strictly excluded.
- **User Preference Vector**: Computed as a weighted sum of embeddings of products purchased by the customer (weighted by purchase quantity and unit price), normalized to unit length.

---

## Semantic Recommendation API

- **Endpoint**: `GET /api/recommendations/vector`
- **Query Parameters**:
  - `customerId` (optional): Specific customer ID to generate recommendations for.
  - `limit` (optional, default 5, max 50): Number of recommendations to return.
- **Security**: Protected by `protectVendor` middleware.

### Example Response:

```json
{
  "success": true,
  "type": "VECTOR_SEMANTIC",
  "message": "Personalized vector search recommendations generated",
  "recommendationBasis": "vector similarity on customer purchase history profile",
  "customer": {
    "id": "65b...",
    "name": "Jane Doe",
    "email": "jane@example.com"
  },
  "count": 3,
  "recommendations": [
    {
      "rank": 1,
      "productId": "65c...",
      "name": "Ergonomic Mechanical Keyboard",
      "category": "Electronics",
      "price": 129.99,
      "stock": 12,
      "imageUrl": "...",
      "similarityScore": 0.8954,
      "matchPercentage": 90,
      "reason": "Direct match with frequently purchased category: Electronics"
    }
  ]
}
```

---

## Out-of-Stock Filtering

The vector search recommendation engine automatically applies business rules before returning recommendations:
- Products with `stock <= 0` are strictly excluded from recommendation results (`stock: { $gt: 0 }`).
- Vendor data isolation is enforced (`vendor: req.vendorId`).

---

## Environment Variables

Ensure `.env` in `backend/` contains:

```env
MONGO_URI=mongodb+srv://...
JWT_SECRET=...
OPENROUTER_API_KEY=sk-or-v1-...
```

---

## Testing Vector Search

1. Run the verification script:
   ```bash
   node scratch/verify_features.js
   ```
2. Log in as a vendor on the frontend, navigate to **Analytics**, and view the **AI / Semantic Vector Recommendations** widget.
