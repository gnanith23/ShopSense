// ==================== IMPORT PACKAGES ====================

const axios = require("axios");

// High-confidence fallback models on OpenRouter
const PREFERRED_MODELS = [
    "openai/gpt-oss-20b",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.1-8b-instruct:free",
    "openrouter/auto"
];

// Fallback sentiment words for rule-based fallback
const POSITIVE_WORDS = [
    "great", "excellent", "amazing", "awesome", "good", "best", "fantastic",
    "love", "perfect", "superb", "durable", "fast", "smooth", "high quality",
    "worth", "satisfied", "happy", "recommend", "value", "easy", "beautiful"
];

const NEGATIVE_WORDS = [
    "bad", "terrible", "horrible", "poor", "worst", "slow", "broken",
    "defective", "waste", "disappointed", "cheap", "useless", "returned",
    "noisy", "damaged", "fail", "hard", "difficult", "hate", "unhappy"
];


// ================================================================
// ==================== RULE-BASED FALLBACK ENGINE =================
// ================================================================

/**
 * Generates a fallback sentiment analysis result when the LLM is unreachable or fails.
 * Guarantees zero downtime and safe response format.
 */
function analyzeFallback(reviewText, rating = 3) {
    const text = String(reviewText || "").toLowerCase();
    
    let posScore = 0;
    let negScore = 0;
    const foundPros = [];
    const foundCons = [];

    POSITIVE_WORDS.forEach(word => {
        if (text.includes(word)) {
            posScore++;
            foundPros.push(word.charAt(0).toUpperCase() + word.slice(1));
        }
    });

    NEGATIVE_WORDS.forEach(word => {
        if (text.includes(word)) {
            negScore++;
            foundCons.push(word.charAt(0).toUpperCase() + word.slice(1));
        }
    });

    // Rating contribution (1-5 scale mapped to score)
    const ratingContribution = ((rating - 1) / 4) * 50; // 0 to 50
    const textDelta = (posScore - negScore) * 15;
    let score = Math.round(50 + textDelta + (ratingContribution - 25));

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    let sentiment = "NEUTRAL";
    if (score >= 65 || rating >= 4) {
        sentiment = "POSITIVE";
    } else if (score <= 35 || rating <= 2) {
        sentiment = "NEGATIVE";
    }

    const defaultPros = foundPros.length > 0
        ? foundPros.slice(0, 3)
        : rating >= 4 ? ["Good overall quality", "Matches expectations"] : [];

    const defaultCons = foundCons.length > 0
        ? foundCons.slice(0, 3)
        : rating <= 2 ? ["Could be improved", "Issues reported"] : [];

    let summary = text.slice(0, 100);
    if (text.length > 100) summary += "...";
    if (!summary) summary = `Customer review with rating ${rating}/5`;

    return {
        sentiment,
        sentimentScore: score,
        summary,
        pros: defaultPros,
        cons: defaultCons
    };
}


// ================================================================
// ==================== LLM SENTIMENT SERVICE =====================
// ================================================================

/**
 * Analyzes a review using LLM (OpenRouter/Gemini) with fallback guarantee.
 * 
 * @param {string} reviewText - Customer review text
 * @param {number} rating - Customer numerical rating (1-5)
 * @returns {Promise<{sentiment: string, sentimentScore: number, summary: string, pros: string[], cons: string[]}>}
 */
async function analyzeReviewSentiment(reviewText, rating = 3) {
    // 1. Validate Input
    if (!reviewText || typeof reviewText !== "string" || !reviewText.trim()) {
        return analyzeFallback("No review text provided", rating);
    }

    const cleanText = reviewText.trim();
    const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY;

    // If no API key configured, use fallback engine directly
    if (!apiKey) {
        console.warn("No AI API key found. Using fallback sentiment analyzer.");
        return analyzeFallback(cleanText, rating);
    }

    const prompt = `
You are an expert e-commerce sentiment analyst.
Analyze the following customer review and rating (1-5 scale).

Product Rating: ${rating}/5
Review Text: "${cleanText}"

Extract and return ONLY a valid JSON object matching this schema EXACTLY:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "sentimentScore": number between 0 and 100 (where 0 is extremely negative, 50 neutral, 100 extremely positive),
  "summary": "1 sentence concise summary of the review",
  "pros": ["pro 1", "pro 2"],
  "cons": ["con 1", "con 2"]
}

Rules:
- sentiment MUST be strictly one of: "POSITIVE", "NEUTRAL", "NEGATIVE"
- sentimentScore MUST be a number between 0 and 100
- Return ONLY valid JSON. No markdown code blocks, no trailing comments.
`;

    // Try calling OpenRouter LLM API
    for (const model of PREFERRED_MODELS) {
        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model,
                    messages: [
                        {
                            role: "system",
                            content: "You return strictly structured JSON responses for e-commerce sentiment analysis."
                        },
                        {
                            role: "user",
                            content: prompt
                        }
                    ],
                    response_format: { type: "json_object" }
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 7000 // 7 sec timeout
                }
            );

            const rawContent = response.data?.choices?.[0]?.message?.content;
            if (rawContent) {
                // Sanitize potential markdown code fences ```json ... ```
                const cleanJson = rawContent
                    .replace(/```json/gi, "")
                    .replace(/```/g, "")
                    .trim();

                const parsed = JSON.parse(cleanJson);

                // Validate schema output
                const validSentiments = ["POSITIVE", "NEUTRAL", "NEGATIVE"];
                const sentiment = validSentiments.includes(parsed.sentiment?.toUpperCase())
                    ? parsed.sentiment.toUpperCase()
                    : rating >= 4 ? "POSITIVE" : rating <= 2 ? "NEGATIVE" : "NEUTRAL";

                let score = Number(parsed.sentimentScore);
                if (isNaN(score) || score < 0 || score > 100) {
                    score = rating * 20;
                }

                return {
                    sentiment,
                    sentimentScore: Math.round(score),
                    summary: parsed.summary || cleanText.slice(0, 100),
                    pros: Array.isArray(parsed.pros) ? parsed.pros.map(String) : [],
                    cons: Array.isArray(parsed.cons) ? parsed.cons.map(String) : []
                };
            }
        } catch (err) {
            console.warn(`LLM model ${model} sentiment call failed: ${err.message}. Trying next model/fallback.`);
        }
    }

    // Fallback if all LLM API attempts failed
    console.warn("All LLM attempts failed. Falling back to rule-based analyzer.");
    return analyzeFallback(cleanText, rating);
}

module.exports = {
    analyzeReviewSentiment,
    analyzeFallback
};
