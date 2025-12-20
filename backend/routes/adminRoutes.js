const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// User Management Routes
router.get('/users', authMiddleware, adminMiddleware, adminController.getUsers);
router.get('/user/:userId/moodlogs', authMiddleware, adminMiddleware, adminController.getUserMoodLogs);
router.get('/monthly-users', authMiddleware, adminMiddleware, adminController.getMonthlyUsers);
router.get('/active-users', authMiddleware, adminMiddleware, adminController.getActiveUsers);
router.get('/inactive-users', authMiddleware, adminMiddleware, adminController.getInactiveUsers);

// Dashboard Analytics Routes
router.get('/daily-mood-logs', authMiddleware, adminMiddleware, adminController.getDailyMoodLogs);
router.get('/daily-journal-logs', authMiddleware, adminMiddleware, adminController.getDailyJournalLogs);
router.get('/daily-forum-engagement', adminController.getDailyForumEngagement);
router.get('/weekly-forum-engagement', adminController.getWeeklyForumEngagement);
router.get('/correlation-values', authMiddleware, adminMiddleware, adminController.getCorrelationValues);
router.get('/weekly-correlation-values', authMiddleware, adminMiddleware, adminController.getWeeklyCorrelationValues);
router.get('/weekly-forum-posts', authMiddleware, adminMiddleware, adminController.getWeeklyForumPosts);
router.get('/active-vs-inactive-users', authMiddleware, adminMiddleware, adminController.getActiveVsInactiveUsers);

// Prompt Management Routes
router.get('/prompts', authMiddleware, adminMiddleware, adminController.getAllPrompts);
router.post('/add-prompt', authMiddleware, adminMiddleware, adminController.addPrompt);
router.delete('/:id', authMiddleware, adminMiddleware, adminController.deletePrompt);

// Teacher Management Routes
router.get('/teachers', authMiddleware, adminMiddleware, adminController.getAllTeachers);
router.post('/teachers', authMiddleware, adminMiddleware, adminController.createTeacher);
router.put('/teachers/:teacherId', authMiddleware, adminMiddleware, adminController.updateTeacher);
router.delete('/teachers/:teacherId', authMiddleware, adminMiddleware, adminController.deleteTeacher);
router.get('/teacher-stats', authMiddleware, adminMiddleware, adminController.getTeacherStats);

// Mood Prediction Comparison Routes
router.post('/calculate-predictions', authMiddleware, adminMiddleware, adminController.calculateWeeklyPredictions);
router.get('/prediction-comparisons', authMiddleware, adminMiddleware, adminController.getPredictionComparisons);
router.get('/daily-mood-comparison', authMiddleware, adminMiddleware, adminController.getDailyMoodComparison);
router.post('/update-actual-moods', authMiddleware, adminMiddleware, adminController.updateActualMoods);
router.get('/available-weeks', authMiddleware, adminMiddleware, adminController.getAvailableWeeks);

module.exports = router;