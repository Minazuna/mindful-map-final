const express = require('express');
const { runConcordanceForUser, getHistoricalConcordance } = require('../controllers/concordanceController');
const { authMiddleware, userMiddleware } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/run', authMiddleware, userMiddleware, runConcordanceForUser);
router.get('/history', authMiddleware, userMiddleware, getHistoricalConcordance);

module.exports = router;