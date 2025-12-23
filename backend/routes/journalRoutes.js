const express = require('express');
const { authMiddleware, userMiddleware } = require('../middleware/authMiddleware');
const { createJournalEntry, getJournalEntries, getJournalEntryById, updateJournalEntry, deleteJournalEntry } = require('../controllers/journalController');

const router = express.Router();

router.post('/create', authMiddleware, userMiddleware, createJournalEntry);
router.get('/entry/:id', authMiddleware, userMiddleware, getJournalEntryById);
router.get('/all', authMiddleware, userMiddleware, getJournalEntries);
router.put('/journal/:id', authMiddleware, userMiddleware, updateJournalEntry);
router.delete('/journal/:id', authMiddleware, userMiddleware, deleteJournalEntry);
module.exports = router;