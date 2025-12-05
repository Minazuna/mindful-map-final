const MoodScore = require('../models/MoodScore');
const Recommendation = require('../models/Recommendation.js');
const { getRecommendations } = require('../services/recommendEngine');

function getCurrentWeekRange() {
  const now = new Date();
  const local = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const day = local.getDay();
  const diffToMonday = (day === 0 ? -6 : 1 - day);
  const start = new Date(local);
  start.setDate(local.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

exports.generateAndSaveRecommendation = async (req, res) => {
  try {
    const { moodScoreId } = req.body;
    const moodScoreDoc = await MoodScore.findById(moodScoreId).populate('user');
    if (!moodScoreDoc) return res.status(404).json({ error: 'MoodScore not found' });

    const { _id, user, date, category, activity, moodScore, sleepHours } = moodScoreDoc;
    const moodType = moodScore >= 0 ? 'positive' : 'negative';

    // Idempotency per (user, date, category, activity)
    const keyQuery = { user: user._id, date, category, activity };
    const existingForKey = await Recommendation.find(keyQuery).sort({ createdAt: 1 }).lean();
    if (existingForKey.length >= 3) {
      return res.json({ recommendations: existingForKey.slice(0, 3) });
    }
    if (existingForKey.length > 0) {
      // If any exist for this key, return them without generating more
      return res.json({ recommendations: existingForKey.slice(0, 3) });
    }

    // Otherwise, generate up to 3 unique recommendation texts
    const texts = getRecommendations({ category, activity, moodType, sleepHours, n: 3 }) || [];
    if (texts.length === 0) {
      return res.json({ recommendations: [] });
    }

    // Insert unique recommendations for the key; ignore dup errors
    const toInsert = texts
      .map(t => String(t).trim())
      .filter(Boolean)
      .slice(0, 3)
      .map(tt => ({
        moodScore: _id,          // keep reference for traceability
        user: user._id,
        date,                    // key date
        category,
        activity,
        moodScoreValue: moodScore,
        sleepHours,
        recommendation: tt,
        type: moodType
      }));

    if (toInsert.length) {
      try {
        await Recommendation.insertMany(toInsert, { ordered: false });
      } catch (e) {
        const msg = String(e?.message || '').toLowerCase();
        const isDup = e.code === 11000 || msg.includes('duplicate key') || msg.includes('e11000') || msg.includes('duplicate');
        if (!isDup) throw e;
      }
    }

    const final = await Recommendation.find(keyQuery).sort({ createdAt: 1 }).limit(3).lean();
    return res.json({ recommendations: final });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getCurrentWeekRecommendations = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { start, end } = getCurrentWeekRange();

    const recs = await Recommendation.find({
      user: userId,
      date: { $gte: start, $lte: end }
    })
      .sort({ date: 1 })
      .lean();

    res.json({ recommendations: recs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};