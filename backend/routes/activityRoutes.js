const express = require('express');
const { authMiddleware, userMiddleware } = require('../middleware/authMiddleware');
const {getProgress, updateProgress} = require('../controllers/activityController');

const router = express.Router();

router.get('/breathing/progress', authMiddleware, getProgress);
router.put('/breathing/progress', authMiddleware, updateProgress);

module.exports = router;