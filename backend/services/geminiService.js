const axios = require("axios");

async function generateProductContent(productName, category) {

    const prompt = `
Generate a professional e-commerce product description.

Product Name: ${productName}
Category: ${category}

Return ONLY valid JSON.

{
  "description":"...",
  "aiTags":["tag1","tag2","tag3"],
  "seoKeywords":["keyword1","keyword2","keyword3"]
}
`;

    const response = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: "openai/gpt-oss-20b:free",
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json"
            }
        }
    );

    return response.data.choices[0].message.content;
}

module.exports = {
    generateProductContent,
};