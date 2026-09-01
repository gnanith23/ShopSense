const axios = require("axios");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const OPENROUTER_MODELS = [
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3.5-lightning:free",
    "minimax/minimax-m3:free",
    "liquid/lfm-2.5-2.6b:free",
    "thinkingmachines/inkling:free",
];


const PROMPT_BUILDER = (productName, category) => `
Generate a professional e-commerce product listing for the following product.

Product Name: ${productName}
Category: ${category}

Return ONLY valid JSON with exactly these fields:
{
  "description": "A compelling 2-3 sentence product description for an e-commerce store",
  "aiTags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "seoKeywords": ["keyword1", "keyword2", "keyword3", "keyword4", "keyword5"]
}
`;

async function tryOpenRouter(productName, category) {
    const prompt = PROMPT_BUILDER(productName, category);
    let lastError;

    for (const model of OPENROUTER_MODELS) {
        try {
            const response = await axios.post(
                "https://openrouter.ai/api/v1/chat/completions",
                {
                    model,
                    messages: [{ role: "user", content: prompt }],
                    response_format: { type: "json_object" },
                    temperature: 0.7,
                    max_tokens: 400,
                },
                {
                    headers: {
                        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                        "Content-Type": "application/json",
                        "HTTP-Referer": "https://shopsense.app",
                        "X-Title": "ShopSense",
                    },
                    timeout: 12000,
                }
            );

            const content = response.data?.choices?.[0]?.message?.content;
            if (content) {
                console.log(`[GeminiService] OpenRouter success with ${model}`);
                return content;
            }
        } catch (err) {
            lastError = err;
            console.warn(`[GeminiService] OpenRouter model ${model} failed:`, err.response?.data?.error?.message || err.message);
        }
    }
    throw lastError || new Error("All OpenRouter models failed");
}

async function tryGeminiSDK(productName, category) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY not set");

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = PROMPT_BUILDER(productName, category) + "\n\nIMPORTANT: Return ONLY the JSON object, no markdown, no code blocks.";

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    console.log("[GeminiService] Gemini SDK success");
    return text;
}

function buildFallbackResult(productName, category) {
    const categoryDescriptions = {
        electronics: `High-quality ${productName} designed for modern users. Features premium build quality and advanced specifications that ensure reliable performance. Perfect for both professional and everyday use.`,
        clothing: `Stylish ${productName} crafted from premium materials. Designed for comfort and durability with a contemporary aesthetic. Suitable for various occasions and lifestyle needs.`,
        decorations: `Elegant ${productName} that adds a touch of sophistication to any space. Crafted with attention to detail, this decorative piece enhances your interior with timeless style.`,
        default: `Premium quality ${productName} from the ${category} category. Built to meet high standards of quality and performance. An ideal choice for customers seeking value and reliability.`,
    };

    const desc = categoryDescriptions[category.toLowerCase()] || categoryDescriptions.default;

    return JSON.stringify({
        description: desc,
        aiTags: [productName.toLowerCase(), category.toLowerCase(), "quality", "premium", "bestseller"],
        seoKeywords: [
            `buy ${productName.toLowerCase()}`,
            `${category.toLowerCase()} ${productName.toLowerCase()}`,
            `best ${productName.toLowerCase()}`,
            `${productName.toLowerCase()} online`,
            `affordable ${productName.toLowerCase()}`,
        ],
    });
}

async function generateProductContent(productName, category) {
    // 1. Try OpenRouter free models
    try {
        return await tryOpenRouter(productName, category);
    } catch (e) {
        console.warn("[GeminiService] All OpenRouter models failed, trying Gemini SDK...");
    }

    // 2. Try Gemini SDK directly
    try {
        return await tryGeminiSDK(productName, category);
    } catch (e) {
        console.warn("[GeminiService] Gemini SDK failed, using rule-based fallback...", e.message);
    }

    // 3. Deterministic keyword fallback — never crashes
    console.log("[GeminiService] Using deterministic fallback for product content generation");
    return buildFallbackResult(productName, category);
}

module.exports = {
    generateProductContent,
};