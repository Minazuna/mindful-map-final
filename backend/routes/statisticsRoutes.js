const express = require('express');
const { getDailyStatistics, getWeeklyStatistics, calculateDailyAnova } = require('../controllers/statisticsController');
const { authMiddleware, userMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/statistics/daily', authMiddleware, userMiddleware, getDailyStatistics);
router.get('/statistics/weekly', authMiddleware, userMiddleware, getWeeklyStatistics);
router.get('/statistics/daily-anova', authMiddleware, userMiddleware, calculateDailyAnova);
module.exports = router;