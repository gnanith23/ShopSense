// ==================== IMPORT PACKAGES ====================

const axios = require("axios");

const EMBEDDING_DIM = 768;


// ================================================================
// ==================== LOCAL SEMANTIC EMBEDDING ENGINE ============
// ================================================================

/**
 * Generates a 768-dimensional normalized semantic vector for text using
 * hashing, n-gram term frequencies, and word position weighting.
 * Guarantees consistent, high-speed vector generation offline or when APIs are unavailable.
 */
function generateLocalEmbedding(text) {
    const vector = new Array(EMBEDDING_DIM).fill(0);
    if (!text || typeof text !== "string") return vector;

    const normalized = text.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    const words = normalized.split(/\s+/).filter(w => w.length > 1);

    if (words.length === 0) return vector;

    words.forEach((word, idx) => {
        // Hash main word
        let hash = 0;
        for (let i = 0; i < word.length; i++) {
            hash = (hash << 5) - hash + word.charCodeAt(i);
            hash |= 0;
        }

        const slot = Math.abs(hash) % EMBEDDING_DIM;
        const weight = 1 + 1 / (idx + 1); // Earlier words given slightly higher weight
        vector[slot] += weight;

        // Character bi-grams for semantic similarity between sub-words
        for (let j = 0; j < word.length - 1; j++) {
            const bigram = word.slice(j, j + 2);
            let bHash = 0;
            for (let k = 0; k < bigram.length; k++) {
                bHash = (bHash << 5) - bHash + bigram.charCodeAt(k);
                bHash |= 0;
            }
            const bSlot = Math.abs(bHash) % EMBEDDING_DIM;
            vector[bSlot] += 0.3 * weight;
        }
    });

    // L2 Normalize the vector
    let magnitude = 0;
    for (let i = 0; i < EMBEDDING_DIM; i++) {
        magnitude += vector[i] * vector[i];
    }
    magnitude = Math.sqrt(magnitude);

    if (magnitude > 0) {
        for (let i = 0; i < EMBEDDING_DIM; i++) {
            vector[i] = parseFloat((vector[i] / magnitude).toFixed(6));
        }
    }

    return vector;
}


// ================================================================
// ==================== PRODUCT EMBEDDING GENERATOR ===============
// ================================================================

/**
 * Builds standard input text string from product fields.
 */
function buildProductInputText(product) {
    const parts = [
        `Product: ${product.name || ""}`,
        `Category: ${product.category || ""}`,
        `Description: ${product.description || ""}`,
        product.aiTags?.length ? `Tags: ${product.aiTags.join(", ")}` : "",
        product.seoKeywords?.length ? `Keywords: ${product.seoKeywords.join(", ")}` : ""
    ];
    return parts.filter(Boolean).join(". ");
}

/**
 * Generates product embedding using API if available, or local semantic vectorizer.
 * 
 * @param {Object} product - Product document or payload
 * @returns {Promise<number[]>} 768-dimensional embedding array
 */
async function generateProductEmbedding(product) {
    const textInput = buildProductInputText(product);
    const apiKey = process.env.GEMINI_API_KEY || process.env.OPENROUTER_API_KEY;

    if (apiKey) {
        try {
            // Try Google Gemini Embedding API if key available
            const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apiKey}`;
            const res = await axios.post(
                url,
                {
                    model: "models/text-embedding-004",
                    content: { parts: [{ text: textInput }] }
                },
                { timeout: 5000 }
            );

            const values = res.data?.embedding?.values;
            if (Array.isArray(values) && values.length === EMBEDDING_DIM) {
                return values.map(v => parseFloat(v.toFixed(6)));
            }
        } catch (err) {
            console.warn(`Remote embedding API call failed: ${err.message}. Using local vectorizer.`);
        }
    }

    return generateLocalEmbedding(textInput);
}


// ================================================================
// ==================== USER BEHAVIOR EMBEDDING ====================
// ================================================================

/**
 * Constructs a 768-dimensional user preference embedding vector based on real transaction history.
 * 
 * @param {Array} transactions - Customer's historical transactions populated with product details
 * @returns {number[]} 768-dimensional user preference embedding
 */
function generateUserBehaviorEmbedding(transactions) {
    if (!transactions || transactions.length === 0) {
        return new Array(EMBEDDING_DIM).fill(0);
    }

    const userVector = new Array(EMBEDDING_DIM).fill(0);
    let totalWeight = 0;

    transactions.forEach(tx => {
        if (!tx.product) return;
        const product = tx.product;

        // Compute product vector (from stored product embedding or local embedding)
        let prodVector = product.embedding;
        if (!Array.isArray(prodVector) || prodVector.length !== EMBEDDING_DIM) {
            prodVector = generateLocalEmbedding(buildProductInputText(product));
        }

        // Weight = transaction quantity * unit price
        const weight = (tx.quantity || 1) * (tx.unitPrice || 1);
        totalWeight += weight;

        for (let i = 0; i < EMBEDDING_DIM; i++) {
            userVector[i] += prodVector[i] * weight;
        }
    });

    // Normalize weighted sum vector
    let magnitude = 0;
    for (let i = 0; i < EMBEDDING_DIM; i++) {
        magnitude += userVector[i] * userVector[i];
    }
    magnitude = Math.sqrt(magnitude);

    if (magnitude > 0) {
        for (let i = 0; i < EMBEDDING_DIM; i++) {
            userVector[i] = parseFloat((userVector[i] / magnitude).toFixed(6));
        }
    }

    return userVector;
}


// ================================================================
// ==================== COSINE SIMILARITY MATH =====================
// ================================================================

/**
 * Computes Cosine Similarity between two N-dimensional vectors.
 * Returns a value between -1.0 and 1.0 (typically 0.0 to 1.0 for positive term vectors).
 */
function calculateCosineSimilarity(v1, v2) {
    if (!Array.isArray(v1) || !Array.isArray(v2) || v1.length !== v2.length || v1.length === 0) {
        return 0;
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < v1.length; i++) {
        dotProduct += v1[i] * v2[i];
        normA += v1[i] * v1[i];
        normB += v2[i] * v2[i];
    }

    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

module.exports = {
    EMBEDDING_DIM,
    generateLocalEmbedding,
    generateProductEmbedding,
    generateUserBehaviorEmbedding,
    calculateCosineSimilarity,
    buildProductInputText
};
