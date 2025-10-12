const express = require('express');
const router = express.Router();
const { authMiddleware, teacherMiddleware } = require('../middleware/authMiddleware');
const teacherController = require('../controllers/teacherController');

// Apply auth middleware to all teacher routes
router.use(authMiddleware);
router.use(teacherMiddleware);

// Get teacher profile
router.get('/profile', teacherController.getTeacherProfile);

// Update teacher profile
router.put('/profile', teacherController.uploadAvatar, teacherController.updateTeacherProfile);

// Get students by teacher's assigned section
router.get('/students', teacherController.getStudentsBySection);

// Get mood logs for students in teacher's section
router.get('/student-mood-logs', teacherController.getStudentMoodLogs);

// Get mood logs by specific section
router.get('/mood-logs/:section', teacherController.getMoodLogsBySection);

// Get dashboard statistics
router.get('/dashboard-stats', teacherController.getTeacherDashboardStats);

module.exports = router;