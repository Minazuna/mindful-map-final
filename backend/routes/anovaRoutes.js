const express = require('express');
const { runAnovaForUser, getHistoricalAnova } = require('../controllers/anovaController');
const { authMiddleware, userMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/run', authMiddleware, userMiddleware, runAnovaForUser);
router.get('/history', authMiddleware, userMiddleware, getHistoricalAnova);
// router.get('/anova/history', authMiddleware, userMiddleware, getSavedAnova);

module.exports = router;
