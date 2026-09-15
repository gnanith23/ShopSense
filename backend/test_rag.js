const mongoose = require("mongoose");
const dotenv = require("dotenv");
const dns = require("dns");
try { dns.setServers(["8.8.8.8", "1.1.1.1"]); } catch (e) {}
dotenv.config();

const { answerShoppingQuery } = require("./services/ragAssistantService");

async function runRAGTests() {
    console.log("Connecting to MongoDB for RAG testing...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB.");

    console.log("\n--- Test 1: Gaming Keyboard Search ---");
    const res1 = await answerShoppingQuery("What is the best keyboard for gaming?");
    console.log("Success:", res1.success);
    console.log("Answer:\n" + res1.answer);
    console.log("Retrieved Products Count:", res1.retrievedProducts?.length);
    if (res1.retrievedProducts?.length > 0) {
        console.log("Top Match:", res1.retrievedProducts[0].name, "₹" + res1.retrievedProducts[0].price);
    }

    console.log("\n--- Test 2: Price constrained query ---");
    const res2 = await answerShoppingQuery("What electronics do you have under 500?");
    console.log("Success:", res2.success);
    console.log("Answer:\n" + res2.answer);
    console.log("Retrieved Products Count:", res2.retrievedProducts?.length);

    console.log("\n--- Test 3: Unmatched / out of stock query ---");
    const res3 = await answerShoppingQuery("Do you have quantum teleportation device?");
    console.log("Success:", res3.success);
    console.log("Answer:\n" + res3.answer);

    await mongoose.disconnect();
    console.log("\n--- RAG AI SHOPPING ASSISTANT TESTS COMPLETE! ---");
}

runRAGTests();
