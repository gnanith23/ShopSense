const { generateProductContent } = require("../services/geminiService");
const { answerShoppingQuery } = require("../services/ragAssistantService");

exports.generateContent = async (req, res) => {
    try {
        const { productName, category } = req.body;

        if (!productName || !category) {
            return res.status(400).json({
                message: "Product name and category are required"
            });
        }

        const aiResponse = await generateProductContent(productName, category);

        // Gemini may wrap JSON inside ```json ... ```
        const cleaned = aiResponse
            .replace(/```json/g, "")
            .replace(/```/g, "")
            .trim();

        const result = JSON.parse(cleaned);

        res.status(200).json(result);

    } catch (error) {
        console.error(error);

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