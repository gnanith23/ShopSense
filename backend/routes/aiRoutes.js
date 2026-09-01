const express = require("express");
const router = express.Router();

const aiController = require("../controllers/aiController");

router.post("/generate-product-content", aiController.generateContent);
router.post("/shopping-assistant", aiController.shoppingAssistant);

module.exports = router;