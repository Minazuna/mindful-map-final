const express = require("express");
const { authMiddleware, userMiddleware } = require("../middleware/authMiddleware");
const {
    generateAndSaveRecommendation
} = require("../controllers/recommendationController"); 

const router = express.Router();

router.post("/generate", authMiddleware, userMiddleware, generateAndSaveRecommendation);

module.exports = router;