const { generateProductContent } = require("../services/geminiService");

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