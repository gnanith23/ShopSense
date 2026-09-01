// ==================== RAG AI SHOPPING ASSISTANT SERVICE ====================
// Implements Retrieval-Augmented Generation using MongoDB product catalog,
// vector similarity search, and LLM grounded generation.

const axios = require("axios");
const Product = require("../models/Product");
const {
    generateProductEmbedding,
    generateLocalEmbedding,
    calculateCosineSimilarity,
    buildProductInputText
} = require("./embeddingService");

const PREFERRED_MODELS = [
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "openai/gpt-oss-20b:free",
    "openrouter/auto"
];

/**
 * Extracts optional price constraints from natural language query.
 * e.g. "under 80000", "below ₹50000", "under 1500"
 */
function extractPriceConstraint(queryText) {
    if (!queryText) return null;
    const match = queryText.match(/(?:under|below|less\s+than|within|budget\s+of|max(?:imum)?)\s*(?:₹|rs\.?|inr)?\s*([0-9]+(?:,[0-9]+)*(?:\.[0-9]+)?)/i);
    if (match && match[1]) {
        const parsed = parseFloat(match[1].replace(/,/g, ""));
        if (!isNaN(parsed) && parsed > 0) return parsed;
    }
    return null;
}

/**
 * Builds grounded fallback answer if external LLM API is unavailable.
 */
function buildGroundedFallbackAnswer(query, products) {
    if (!products || products.length === 0) {
        return "I checked our current catalog, but could not find any in-stock products matching your specific request. Please try searching for a different category or adjusting your price filters.";
    }

    const top = products[0];
    let answer = `Based on the products currently available in ShopSense, **${top.name}** (₹${top.price.toLocaleString('en-IN')}) is the strongest recommendation. It is in our *${top.category}* section with ${top.stock} units in stock. ${top.description}`;

    if (products.length > 1) {
        const others = products.slice(1, 3).map(p => `**${p.name}** (₹${p.price.toLocaleString('en-IN')})`).join(" and ");
        answer += `\n\nOther matching options in stock include: ${others}.`;
    }

    return answer;
}

/**
 * Executes full RAG shopping pipeline:
 * Question -> Embedding -> Vector Search -> Product Context -> Grounded LLM Response.
 * 
 * @param {string} userQuery - Customer prompt
 * @returns {Promise<{answer: string, retrievedProducts: Array}>}
 */
async function answerShoppingQuery(userQuery) {
    if (!userQuery || typeof userQuery !== "string" || !userQuery.trim()) {
        return {
            answer: "Please ask a question about products in our store.",
            retrievedProducts: []
        };
    }

    const cleanQuery = userQuery.trim();
    const maxPrice = extractPriceConstraint(cleanQuery);

    // 1. Vector Retrieval: Find all purchasable in-stock products (stock > 0)
    const productQuery = { stock: { $gt: 0 } };
    if (maxPrice !== null) {
        productQuery.price = { $lte: maxPrice };
    }

    let candidateProducts = await Product.find(productQuery);

    // If maxPrice filter was too strict and returned 0 products, fetch without price filter to give nearest alternatives
    if (candidateProducts.length === 0 && maxPrice !== null) {
        candidateProducts = await Product.find({ stock: { $gt: 0 } });
    }

    if (candidateProducts.length === 0) {
        return {
            answer: "There are currently no in-stock products available in the catalog.",
            retrievedProducts: []
        };
    }

    // 2. Generate Query Embedding
    const queryVector = generateLocalEmbedding(cleanQuery);

    // 3. Score candidates with Cosine Similarity
    const scored = [];
    for (const prod of candidateProducts) {
        let prodVector = prod.embedding;
        if (!Array.isArray(prodVector) || prodVector.length === 0) {
            prodVector = await generateProductEmbedding(prod);
            prod.embedding = prodVector;
            await prod.save().catch(() => {});
        }

        const similarity = calculateCosineSimilarity(queryVector, prodVector);

        // Keyword overlap boost
        const prodText = `${prod.name} ${prod.category} ${prod.description} ${(prod.aiTags || []).join(" ")}`.toLowerCase();
        const queryTerms = cleanQuery.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        let matchCount = 0;
        queryTerms.forEach(t => {
            if (prodText.includes(t)) matchCount++;
        });

        const compositeScore = similarity + (matchCount * 0.15);

        scored.push({
            product: prod,
            similarityScore: parseFloat(similarity.toFixed(4)),
            compositeScore
        });
    }

    // Sort by composite ranking descending
    scored.sort((a, b) => b.compositeScore - a.compositeScore);

    // Select top 4 relevant products
    const topMatches = scored.slice(0, 4);

    const retrievedProducts = topMatches.map(item => ({
        id: item.product._id,
        name: item.product.name,
        category: item.product.category,
        price: item.product.price,
        stock: item.product.stock,
        description: item.product.description,
        imageUrl: item.product.imageUrl || "",
        similarityScore: item.similarityScore,
        aiTags: item.product.aiTags || []
    }));

    // 4. Grounded Prompt Formulation
    const productContext = retrievedProducts.map((p, idx) => `
[Product ${idx + 1}]
- Name: ${p.name}
- Category: ${p.category}
- Price: ₹${p.price}
- Available Stock: ${p.stock} units
- Description: ${p.description}
- Features/Tags: ${p.aiTags.join(", ") || "None"}
`).join("\n");

    const systemPrompt = `You are the ShopSense AI Shopping Assistant.
You must answer the customer's question strictly grounded on the retrieved ShopSense products listed below.
Rules:
1. ONLY recommend products that are present in the provided catalog context below.
2. NEVER invent or hallucinate products, prices, or specs not listed in the context.
3. Mention the product name, price (in ₹), and specific features that match the customer's request.
4. If no product fits the user's constraints (e.g. price or category), politely explain what is closest or state that no exact match is currently in stock.
5. Keep your tone helpful, professional, and concise.`;

    const userPrompt = `
Customer Question: "${cleanQuery}"

Retrieved Products in ShopSense Catalog:
${productContext}

Provide a helpful, grounded recommendation:`;

    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    if (apiKey) {
        for (const model of PREFERRED_MODELS) {
            try {
                const response = await axios.post(
                    "https://openrouter.ai/api/v1/chat/completions",
                    {
                        model,
                        messages: [
                            { role: "system", content: systemPrompt },
                            { role: "user", content: userPrompt }
                        ],
                        temperature: 0.3
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            "Content-Type": "application/json"
                        },
                        timeout: 8000
                    }
                );

                const answerText = response.data?.choices?.[0]?.message?.content;
                if (answerText && answerText.trim()) {
                    return {
                        success: true,
                        query: cleanQuery,
                        answer: answerText.trim(),
                        retrievedProducts
                    };
                }
            } catch (llmErr) {
                console.warn(`[RAG] LLM call with model ${model} failed: ${llmErr.message}. Trying next.`);
            }
        }
    }

    // Fallback grounded answer
    const fallbackAnswer = buildGroundedFallbackAnswer(cleanQuery, retrievedProducts);
    return {
        success: true,
        query: cleanQuery,
        answer: fallbackAnswer,
        retrievedProducts
    };
}

module.exports = {
    answerShoppingQuery,
    extractPriceConstraint
};
