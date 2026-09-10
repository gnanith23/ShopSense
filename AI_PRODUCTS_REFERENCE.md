# ShopSense — AI Products & Services Reference

> A complete map of every AI model, API, library, and technique used across the ShopSense backend and frontend.

---

## Overview Table

| # | Feature | AI Technology | Provider | API / Library | Key File |
|---|---------|---------------|----------|---------------|----------|
| 1 | Product Content Generation | LLM (text generation) | OpenRouter → Gemini SDK | `openrouter.ai/api/v1` + `@google/generative-ai` | `geminiService.js` |
| 2 | Review Sentiment Analysis | LLM (structured JSON output) | OpenRouter | `openrouter.ai/api/v1` | `sentimentService.js` |
| 3 | RAG Shopping Assistant | LLM + Vector Search | OpenRouter | `openrouter.ai/api/v1` | `ragAssistantService.js` |
| 4 | Product Embeddings | Embedding API | Google Gemini | `generativelanguage.googleapis.com` | `embeddingService.js` |
| 5 | Local Semantic Vectorizer | Custom hashing engine | None (offline) | Built-in JS | `embeddingService.js` |
| 6 | Vector Similarity Search | Cosine Similarity | None (offline) | Built-in JS | `embeddingService.js` |
| 7 | User Behavior Embeddings | Collaborative embedding | None (offline) | Built-in JS | `embeddingService.js` |
| 8 | AI Text-to-SQL Analyst | LLM (SQL generation) | OpenRouter | `openrouter.ai/api/v1` | `sqlAnalyticsService.js` |
| 9 | Inventory Demand Forecast | ARIMA Time-Series ML | None (offline) | `arima` npm package | `forecastService.js` |
| 10 | Real-Time Sales Stream | WebSocket push service | FastAPI (Python) | `uvicorn` + `fastapi` | `realtime_service/main.py` |

---

## 1. Product Content Generation

**What it does:** When a vendor adds a product, AI automatically writes a compelling product description, 5 AI tags, and 5 SEO keywords.

**File:** `backend/services/geminiService.js`
**Controller:** `backend/controllers/aiController.js`
**API Endpoint:** `POST /api/ai/generate-product-content`

### Models Used (tried in order)
| Priority | Model | Provider |
|----------|-------|----------|
| 1st | `google/gemma-4-26b-a4b-it:free` | Google via OpenRouter |
| 2nd | `nvidia/nemotron-3.5-lightning:free` | NVIDIA via OpenRouter |
| 3rd | `minimax/minimax-m3:free` | MiniMax via OpenRouter |
| 4th | `liquid/lfm-2.5-2.6b:free` | Liquid AI via OpenRouter |
| 5th | `thinkingmachines/inkling:free` | Thinking Machines via OpenRouter |
| Fallback A | `gemini-1.5-flash` | Google Gemini SDK (direct) |
| Fallback B | Rule-based template | Offline — no API call |

### How it works
```
Vendor fills product name + category
        ↓
POST /api/ai/generate-product-content
        ↓
geminiService.js tries OpenRouter models (1→5)
        ↓
aiController.js extracts JSON (strips markdown, regex fallback)
        ↓
Returns: { description, aiTags[], seoKeywords[] }
```

### API Key Used
- `OPENROUTER_API_KEY` (primary)
- `GEMINI_API_KEY` (SDK fallback)

---

## 2. Review Sentiment Analysis

**What it does:** When a customer submits a product review, the LLM scores it as POSITIVE / NEUTRAL / NEGATIVE, gives a 0–100 sentiment score, and extracts pros and cons.

**File:** `backend/services/sentimentService.js`
**API Endpoint:** `POST /api/reviews` (triggers on review creation)

### Models Used (tried in order)
| Priority | Model | Provider |
|----------|-------|----------|
| 1st | `openai/gpt-oss-20b` | OpenAI via OpenRouter |
| 2nd | `google/gemini-2.0-flash-exp:free` | Google via OpenRouter |
| 3rd | `meta-llama/llama-3.1-8b-instruct:free` | Meta via OpenRouter |
| 4th | `openrouter/auto` | Best available on OpenRouter |
| Fallback | Rule-based keyword engine | Offline — no API call |

### Output Format
```json
{
  "sentiment": "POSITIVE",
  "sentimentScore": 82,
  "summary": "Customer loves the product build quality.",
  "pros": ["Durable", "Fast delivery"],
  "cons": ["Slightly expensive"]
}
```

### API Key Used
- `OPENROUTER_API_KEY` (primary)
- `GEMINI_API_KEY` (secondary)

---

## 3. RAG AI Shopping Assistant

**What it does:** Customers can ask natural language questions like *"Best laptop under ₹80,000"* and get grounded, hallucination-free answers using the actual product catalog in MongoDB.

**File:** `backend/services/ragAssistantService.js`
**Controller:** `backend/controllers/aiController.js`
**API Endpoint:** `POST /api/ai/shopping-assistant`
**Frontend:** `frontend/src/components/AiShoppingAssistantModal.jsx`

### RAG Pipeline (step by step)
```
Customer types a question
        ↓
[1] Price extraction  → regex parses "under 50000"
        ↓
[2] MongoDB retrieval → fetch all in-stock products (filtered by price if any)
        ↓
[3] Query embedding   → generateLocalEmbedding(question) → 768-dim vector
        ↓
[4] Cosine similarity → score every product vector vs query vector
[4b] Keyword boost    → +0.15 per matching word in name/category/tags
        ↓
[5] Top 4 products selected as context
        ↓
[6] Grounded prompt   → system: "Only recommend products listed below..."
        ↓
[7] LLM call          → OpenRouter (tries up to 4 models)
        ↓
Returns: { answer (grounded text), retrievedProducts[] }
```

### Models Used (tried in order)
| Priority | Model | Provider |
|----------|-------|----------|
| 1st | `google/gemini-2.0-flash-exp:free` | Google via OpenRouter |
| 2nd | `meta-llama/llama-3.1-8b-instruct:free` | Meta via OpenRouter |
| 3rd | `openai/gpt-oss-20b:free` | OpenAI via OpenRouter |
| 4th | `openrouter/auto` | Best available on OpenRouter |
| Fallback | Template-based grounded answer | Offline — no API call |

### API Key Used
- `OPENROUTER_API_KEY`

---

## 4. Product Embeddings (Google Gemini Embedding API)

**What it does:** Converts each product's name, category, description, and tags into a 768-dimensional numerical vector stored in MongoDB. Used for semantic search in the RAG assistant and vector recommendations.

**File:** `backend/services/embeddingService.js`

### API Used
| Service | Model | Endpoint |
|---------|-------|----------|
| Google Gemini Embedding | `text-embedding-004` | `generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent` |

### Fallback
If the API is unavailable → **Local Semantic Vectorizer** (Feature #5) is used automatically.

### API Key Used
- `GEMINI_API_KEY` (primary)
- `OPENROUTER_API_KEY` (secondary)

---

## 5. Local Semantic Vectorizer (Offline, No API)

**What it does:** Generates 768-dimensional embedding vectors entirely on the server with no external API call. Used as a fallback for product embeddings and always used for query embeddings in the RAG pipeline.

**File:** `backend/services/embeddingService.js` → `generateLocalEmbedding()`

### How it works
```
Text → lowercase + strip punctuation
     → tokenize into words
     → for each word:
         - hash to a slot in [0, 767]
         - add weight = 1 + 1/(word_position + 1)
         - generate character bi-grams (2-char pairs)
         - hash each bi-gram → add 0.3x weight
     → L2 normalize entire 768-dim vector
```

**No API key required. Works fully offline.**

---

## 6. Cosine Similarity (Vector Search Engine)

**What it does:** Computes how semantically similar a customer query is to each product. The higher the score, the better the match.

**File:** `backend/services/embeddingService.js` → `calculateCosineSimilarity()`
**Used in:** RAG Assistant, Vector Recommendations

```
similarity = (A · B) / (|A| x |B|)
Range: -1.0 (opposite) → 0.0 (unrelated) → 1.0 (identical)
```

**No API key required. Pure math, runs offline.**

---

## 7. User Behavior Embeddings (Personalized Recommendations)

**What it does:** Builds a 768-dimensional "taste profile" for each customer from their purchase history. Used to find products that match the customer's past spending patterns.

**File:** `backend/services/embeddingService.js` → `generateUserBehaviorEmbedding()`
**Used in:** `backend/controllers/recommendationController.js`

### How it works
```
Customer's past transactions
        ↓
For each purchase: productVector x (quantity x price) [weighted]
        ↓
Sum all weighted product vectors
        ↓
L2 normalize → 768-dim "user taste vector"
        ↓
Cosine similarity vs every catalog product
        ↓
Return top N matches as personalized recommendations
```

**No API key required. Runs offline using stored product embeddings.**

---

## 8. AI Text-to-SQL Analyst (Natural Language Analytics)

**What it does:** Vendors can ask plain English questions like *"Which product made the most revenue this month?"* and the LLM writes a safe SQL query, runs it on a local SQLite mirror of MongoDB data, then gives a human-readable explanation.

**File:** `backend/services/sqlAnalyticsService.js`
**Frontend:** `frontend/src/components/AiDataAnalystWidget.jsx`

### Architecture
```
MongoDB (live data)
        ↓ sync
SQLite (local read-only mirror: vendors, products, transactions)
        ↓
Vendor types natural language question
        ↓
LLM generates SQL query (vendor-isolated, read-only validated)
        ↓
SQL runs on SQLite
        ↓
LLM generates plain English explanation of results
        ↓
Return: { sql, results[], explanation }
```

### Models Used (tried in order)
| Priority | Model | Provider |
|----------|-------|----------|
| 1st | `google/gemini-2.0-flash-exp:free` | Google via OpenRouter |
| 2nd | `meta-llama/llama-3.1-8b-instruct:free` | Meta via OpenRouter |
| 3rd | `openai/gpt-oss-20b:free` | OpenAI via OpenRouter |
| 4th | `openrouter/auto` | Best available on OpenRouter |

### Safety Rules (enforced before SQL runs)
- Only `SELECT` statements allowed
- Blocked keywords: `DROP`, `DELETE`, `UPDATE`, `INSERT`, `ALTER`, `CREATE`
- Every query auto-filtered by `vendor_id = authenticated vendor`

### API Key Used
- `OPENROUTER_API_KEY`

---

## 9. ARIMA Inventory Demand Forecasting

**What it does:** Predicts how many units of each product a vendor will sell in the next 7–30 days, using classical time-series machine learning on historical transaction data.

**File:** `backend/services/forecastService.js`
**Frontend:** `frontend/src/components/InventoryForecast.jsx`

### Algorithm: ARIMA (AutoRegressive Integrated Moving Average)
| Parameter | Value |
|-----------|-------|
| Library | `arima` npm package |
| Model params | p=2, d=1, q=1 |
| Input | Daily sales time-series from MongoDB transactions |
| Output | Next N days of predicted demand + confidence intervals |
| Default horizon | 7 days |

### Pipeline
```
MongoDB transactions (COMPLETED, per product)
        ↓
Build continuous daily time-series (fill missing dates with 0)
        ↓
ARIMA model fit on historical series
        ↓
Forecast next 7 days
        ↓
Return: { forecastDates[], forecastValues[], upperBound[], lowerBound[] }
```

**No external AI API. Pure statistical ML running on the Node.js server.**

---

## 10. Real-Time Sales WebSocket Service

**What it does:** The moment a customer completes a purchase, the vendor's dashboard updates instantly with no page refresh. Powered by a separate Python microservice.

**File:** `realtime_service/main.py`
**Notifier:** `backend/services/realtimeNotifier.js`
**Frontend:** `frontend/src/components/RealtimeDashboardWidget.jsx`

### Technology Stack
| Component | Technology |
|-----------|-----------|
| Microservice | Python + FastAPI |
| WebSocket server | `uvicorn` (ASGI) |
| Real-time protocol | WebSocket (`ws://`) |
| Backend trigger | Node.js HTTP POST to FastAPI |

### Flow
```
Customer clicks "Complete Purchase"
        ↓
Express backend creates MongoDB transaction + deducts stock
        ↓
realtimeNotifier.js → POST http://localhost:8000/api/events/sale
        ↓
FastAPI receives event → broadcasts to vendor's WebSocket connection
        ↓
Vendor dashboard updates instantly (JUST NOW badge appears)
```

**No AI model — this is a real-time notification system.**

---

## API Keys Summary

| Key Name | Where Set | Used For |
|----------|-----------|----------|
| `OPENROUTER_API_KEY` | `backend/.env` | All LLM calls: sentiment, RAG, content gen, SQL analyst |
| `GEMINI_API_KEY` | `backend/.env` (optional) | Gemini SDK fallback + Gemini Embedding API |
| `MONGO_URI` | `backend/.env` | MongoDB Atlas connection |
| `JWT_SECRET` | `backend/.env` | Authentication tokens |

> **OpenRouter** is used as the single unified gateway to call models from Google, Meta, OpenAI, NVIDIA etc. with one API key. Models are free tier.

---

## Frontend AI Components Map

| Component File | What It Does | Where It Appears |
|---------------|-------------|-----------------|
| `AiShoppingAssistantModal.jsx` | RAG chatbot — ask questions, get grounded answers + product cards | Customer Marketplace (FAB button + toolbar button) |
| `AiDataAnalystWidget.jsx` | Text-to-SQL — type a question, get SQL + chart + explanation | Vendor Analytics page |
| `SentimentDashboardWidget.jsx` | Sentiment scores, pros/cons charts per product | Vendor Analytics page |
| `RealtimeDashboardWidget.jsx` | Live transaction stream via WebSocket | Vendor Dashboard |
| `InventoryForecast.jsx` | ARIMA demand forecast chart per product | Vendor Analytics page |
| `VectorRecommendationWidget.jsx` | Personalized recommendations using user embeddings | Customer Marketplace |
| `RecommendationWidget.jsx` | Rule-based top-seller recommendations | Vendor Dashboard |

---

## Multi-Layer Fallback Guarantee

Every AI feature has a fallback chain so the app **never crashes** when an API is unavailable:

```
LLM API call (OpenRouter — model 1)
    FAIL → LLM API call (model 2)
    FAIL → LLM API call (model 3)
    FAIL → Gemini SDK direct call
    FAIL → Rule-based / template response
    ALWAYS returns a valid result
```

Same pattern applies to embeddings:
```
Google Gemini Embedding API
    FAIL → Local Semantic Vectorizer (offline hashing)
    ALWAYS returns a valid 768-dim vector
```

---

*ShopSense — Milestone 3 | September 2026*
