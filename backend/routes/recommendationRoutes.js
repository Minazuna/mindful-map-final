const express = require("express");
const { authMiddleware, userMiddleware } = require("../middleware/authMiddleware");
const {
  generateAndSaveRecommendation,
  getCurrentWeekRecommendations,
  submitRecommendationFeedback,
  getUserFeedbackForRecommendation
} = require("../controllers/recommendationController");

const router = express.Router();

router.post("/generate", authMiddleware, userMiddleware, generateAndSaveRecommendation);
router.get("/week", authMiddleware, userMiddleware, getCurrentWeekRecommendations);
router.post("/feedback", authMiddleware, userMiddleware, submitRecommendationFeedback);
router.get("/feedback/:recommendationId", authMiddleware, userMiddleware, getUserFeedbackForRecommendation);

module.exports = router;