const JournalEntry = require('../models/JournalEntry');

// Create a new journal entry
exports.createJournalEntry = async (req, res) => {
  try {
    const { challenges, content } = req.body;
    const userId = req.user._id;

    if (!Array.isArray(challenges) || challenges.length === 0) {
      return res.status(400).json({ error: 'At least one challenge is required.' });
    }
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required.' });
    }

    const entry = new JournalEntry({
      user: userId,
      challenges,
      content
    });

    await entry.save();
    res.status(201).json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create journal entry.' });
  }
};

// Get all journal entries for the logged-in user
exports.getJournalEntries = async (req, res) => {
  try {
    const userId = req.user._id;
    const entries = await JournalEntry.find({ user: userId }).sort({ date: -1 });
    res.json({ success: true, entries });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journal entries.' });
  }
};

exports.getJournalEntryById = async (req, res) => {
  try {
    const userId = req.user._id;
    const entryId = req.params.id;
    const entry = await JournalEntry.findOne({ _id: entryId, user: userId });
    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch journal entry.' });
  }
};

exports.updateJournalEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const entryId = req.params.id;
    const { challenges, content } = req.body;

    const entry = await JournalEntry.findOneAndUpdate(
      { _id: entryId, user: userId },
      { challenges, content },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }
    res.json({ success: true, entry });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update journal entry.' });
  }
};

exports.deleteJournalEntry = async (req, res) => {
  try {
    const userId = req.user._id;
    const entryId = req.params.id;

    const entry = await JournalEntry.findOneAndDelete({ _id: entryId, user: userId });

    if (!entry) {
      return res.status(404).json({ error: 'Journal entry not found.' });
    }
    res.json({ success: true, message: 'Journal entry deleted.' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete journal entry.' });
  }
};