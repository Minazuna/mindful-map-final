const express = require('express');
const { getDailyStatistics } = require('../controllers/statisticsController');
const { authMiddleware, userMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/statistics/daily', authMiddleware, userMiddleware, getDailyStatistics);

module.exports = router;