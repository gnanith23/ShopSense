const { generateProductContent } = require("../services/geminiService");
const { answerShoppingQuery } = require("../services/ragAssistantService");

/**
 * Attempts to extract a valid JSON object from an LLM response string.
 * Handles markdown fences, prose wrappers, and multiple JSON candidates.
 */
function extractJsonFromLLMResponse(raw) {
    if (!raw || typeof raw !== "string") return null;

    // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
    let cleaned = raw
        .replace(/```json\s*/gi, "")
        .replace(/```\s*/g, "")
        .trim();

    // 2. Try direct parse of the cleaned string
    try {
        return JSON.parse(cleaned);
    } catch (_) {
        // continue to extraction
    }

    // 3. Extract the first JSON object {...} from anywhere in the text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        try {
            return JSON.parse(jsonMatch[0]);
        } catch (_) {
            // continue to fallback
        }
    }

    return null;
}

exports.generateContent = async (req, res) => {
    try {
        const { productName, category } = req.body;

        if (!productName || !category) {
            return res.status(400).json({
                message: "Product name and category are required"
            });
        }

        const aiResponse = await generateProductContent(productName, category);

        // Robustly extract JSON from the LLM response
        const result = extractJsonFromLLMResponse(aiResponse);

        if (result && result.description) {
            return res.status(200).json(result);
        }

        // Fallback: LLM returned text we couldn't parse as structured JSON
        console.warn("[AI Controller] Could not extract JSON from LLM response, using fallback.");
        return res.status(200).json({
            description: `Premium quality ${productName} from the ${category} category. Built to meet high standards of quality and performance. An ideal choice for customers seeking value and reliability.`,
            aiTags: [productName.toLowerCase(), category.toLowerCase(), "quality", "premium", "bestseller"],
            seoKeywords: [
                `buy ${productName.toLowerCase()}`,
                `${category.toLowerCase()} ${productName.toLowerCase()}`,
                `best ${productName.toLowerCase()}`,
                `${productName.toLowerCase()} online`,
                `affordable ${productName.toLowerCase()}`
            ]
        });

    } catch (error) {
        console.error("[AI Controller] generateContent error:", error.message);

        res.status(500).json({
            message: "AI generation failed",
            error: error.message
        });
    }
};

// ==================== RAG AI SHOPPING ASSISTANT (MILESTONE 3) ====================
exports.shoppingAssistant = async (req, res) => {
    try {
        const { query } = req.body;

        if (!query || typeof query !== "string" || !query.trim()) {
            return res.status(400).json({
                success: false,
                message: "Query is required"
            });
        }

        const result = await answerShoppingQuery(query);
        return res.status(200).json(result);
    } catch (error) {
        console.error("RAG Shopping Assistant error:", error.message);
        return res.status(500).json({
            success: false,
            message: "Failed to process shopping query",
            error: error.message
        });
    }
};