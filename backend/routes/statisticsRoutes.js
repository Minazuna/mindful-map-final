const express = require('express');
const { getDailyStatistics, getWeeklyStatistics } = require('../controllers/statisticsController');
const { authMiddleware, userMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/statistics/daily', authMiddleware, userMiddleware, getDailyStatistics);
router.get('/statistics/weekly', authMiddleware, userMiddleware, getWeeklyStatistics);

module.exports = router;