const { spawn } = require('child_process');
const MoodScore = require('../models/MoodScore');
const Recommendation = require('../models/Recommendation');
const path = require('path');

exports.generateAndSaveRecommendation = async (req, res) => {
  try {
    const { moodScoreId } = req.body;
    const moodScoreDoc = await MoodScore.findById(moodScoreId).populate('user');
    if (!moodScoreDoc) return res.status(404).json({ error: 'MoodScore not found' });

    const { _id, user, date, category, activity, moodScore, sleepHours } = moodScoreDoc;
    const moodType = moodScore >= 0 ? 'positive' : 'negative';

    const categoryMap = {
  activity: "Activity",
  social: "Social",
  health: "Health",
  sleep: "Sleep"
};
const pyCategory = categoryMap[category] || category;

    // Prepare arguments for Python script
    const args = [
      pyCategory,
      activity || '',
      moodType,
      sleepHours != null ? String(sleepHours) : ''
    ];

    // Call recommendations.py
    const py = spawn('python', [
    path.join(__dirname, '../recommendations.py'),
    ...args
    ]);

    let data = '';
    py.stdout.on('data', chunk => {
      data += chunk.toString();
    });

    py.stderr.on('data', err => {
      console.error('Python error:', err.toString());
    });

    py.on('close', async code => {
      if (code !== 0) {
        return res.status(500).json({ error: 'Python script failed' });
      }
      let recs;
      try {
        recs = JSON.parse(data);
      } catch (e) {
        return res.status(500).json({ error: 'Failed to parse recommendations' });
      }

      // Save each recommendation
        const savedRecs = await Promise.all(
        recs.map(async rec => {
            const exists = await Recommendation.findOne({
            moodScore: _id,
            recommendation: rec
            });
            if (exists) return exists;
            return Recommendation.create({
            moodScore: _id,
            user: user._id,
            date,
            category,
            activity,
            moodScoreValue: moodScore,
            sleepHours,
            recommendation: rec,
            type: moodType
            });
        })
        );

      res.json({ recommendations: savedRecs });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};