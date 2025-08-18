const express = require('express');
const { authMiddleware, userMiddleware } = require('../middleware/authMiddleware');
const { createJournalEntry, getJournalEntries, getJournalEntryById, updateJournalEntry, deleteJournalEntry, getJournalPrompt, upload, analyzePersonalJournal, getPersonalJournals } = require('../controllers/journalController');

const router = express.Router();

// Existing routes
router.post('/journal', authMiddleware, userMiddleware, upload.array('images', 10), createJournalEntry);
router.get('/journals', authMiddleware, userMiddleware, getJournalEntries);
router.get('/journal/:id', authMiddleware, userMiddleware, getJournalEntryById);
router.put('/journal/:id', authMiddleware, userMiddleware, upload.array('images', 10), updateJournalEntry);
router.delete('/journal/:id', authMiddleware, userMiddleware, deleteJournalEntry);

// New routes for personal journal with sentiment analysis
router.post('/personal-journal', authMiddleware, userMiddleware, analyzePersonalJournal);
router.get('/personal-journals', authMiddleware, userMiddleware, getPersonalJournals);

module.exports = router;