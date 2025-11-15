const express = require('express');
const { getDailyStatistics, getWeeklyStatistics, calculateDailyAnova, calculateWeeklyAnova, getSleepHours, getMoodActivities } = require('../controllers/statisticsController');
const { authMiddleware, userMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/statistics/daily', authMiddleware, userMiddleware, getDailyStatistics);
router.get('/statistics/weekly', authMiddleware, userMiddleware, getWeeklyStatistics);
router.get('/statistics/daily-anova', authMiddleware, userMiddleware, calculateDailyAnova);
router.get('/statistics/weekly-anova', authMiddleware, userMiddleware, calculateWeeklyAnova);
router.get('/statistics/sleep-hours', authMiddleware, userMiddleware, getSleepHours);
router.get('/statistics/mood-activities', authMiddleware, userMiddleware, getMoodActivities);
module.exports = router;