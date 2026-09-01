require('dotenv').config();
const { generateProductContent } = require('./services/geminiService');

async function test() {
    console.log('Testing AI content generation for "flower vase" / "decorations"...');
    const result = await generateProductContent('flower vase', 'decorations');
    const cleaned = result.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);
    console.log('Description:', parsed.description?.slice(0, 100) + '...');
    console.log('aiTags:', JSON.stringify(parsed.aiTags));
    console.log('seoKeywords:', JSON.stringify(parsed.seoKeywords));
    console.log('\nSUCCESS - AI content generation is working');
}

test().catch(e => {
    console.error('FAILED:', e.message);
    process.exit(1);
});
