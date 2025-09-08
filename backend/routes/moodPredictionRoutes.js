const express = require("express");
const { authMiddleware, userMiddleware } = require("../middleware/authMiddleware");
const { 
    predictMood, 
    getMoodLogs, 
    getMoodLogsForCategory, 
    predictCategoryMood, 
    checkCategoryData 
} = require("../controllers/moodPredictionController");

const router = express.Router();

router.get("/predict-mood", authMiddleware, userMiddleware, predictMood);
router.get("/mood-logs", authMiddleware, userMiddleware, getMoodLogs);
router.get("/mood-logs-category", authMiddleware, userMiddleware, getMoodLogsForCategory);
router.get("/predict-category-mood", authMiddleware, userMiddleware, predictCategoryMood);
router.get("/check-category-data", authMiddleware, userMiddleware, checkCategoryData);

module.exports = router;