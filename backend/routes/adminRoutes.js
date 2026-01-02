const express = require('express');
const router = express.Router();
const { authMiddleware, adminMiddleware } = require('../middleware/authMiddleware');
const adminController = require('../controllers/adminController');

// User Management Routes
router.get('/dashboard-stats', authMiddleware, adminMiddleware, adminController.getDashboardStats);
router.get('/users', authMiddleware, adminMiddleware, adminController.getUsers);
router.get('/user/:userId/moodlogs', authMiddleware, adminMiddleware, adminController.getUserMoodLogs);
router.get('/monthly-users', authMiddleware, adminMiddleware, adminController.getMonthlyUsers);
router.get('/active-users', authMiddleware, adminMiddleware, adminController.getActiveUsers);
router.get('/inactive-users', authMiddleware, adminMiddleware, adminController.getInactiveUsers);

// Dashboard Analytics Routes
router.get('/daily-mood-logs', authMiddleware, adminMiddleware, adminController.getDailyMoodLogs);
router.get('/daily-journal-logs', authMiddleware, adminMiddleware, adminController.getDailyJournalLogs);
router.get('/correlation-values', authMiddleware, adminMiddleware, adminController.getCorrelationValues);
router.get('/weekly-correlation-values', authMiddleware, adminMiddleware, adminController.getWeeklyCorrelationValues);
router.get('/logs-by-category', authMiddleware, adminMiddleware, adminController.getAdminLogsByCategory);

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