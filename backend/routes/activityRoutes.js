const express = require('express');
const { authMiddleware, userMiddleware } = require('../middleware/authMiddleware');
const {getProgress, updateProgress, getPomodoroProgress, updatePomodoroProgress} = require('../controllers/activityController');

const router = express.Router();

router.get('/breathing/progress', authMiddleware, getProgress);
router.put('/breathing/progress', authMiddleware, updateProgress);
router.get('/pomodoro/progress', authMiddleware, getPomodoroProgress);
router.put('/pomodoro/progress', authMiddleware, updatePomodoroProgress);
module.exports = router;