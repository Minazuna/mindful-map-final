import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { motion } from 'framer-motion';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const CATEGORY_LABELS = {
  activity: 'Overall Activities',
  social: 'Social',
  health: 'Health',
  sleep: 'Sleep'
};

const sleepQualityColors = {
  Poor: '#ff6b6b',
  Sufficient: '#f7b801',
  Good: '#55AD9B'
};

const POSITIVE_COLOR = '#55AD9B';
const NEGATIVE_COLOR = '#FF9800';

const ACTIVITY_LABELS = {
  commute: 'Commuting',
  exam: 'Having an exam',
  homework: 'Doing your homework',
  study: 'Studying',
  project: 'Doing a project',
  read: 'Reading',
  extracurricular: 'Doing an extracurricular activity',
  'household-chores': 'Doing household chores',
  relax: 'Relaxing',
  'watch-movie': 'Watching a movie',
  'listen-music': 'Listening to music',
  gaming: 'Gaming',
  'browse-internet': 'Browsing the internet',
  shopping: 'Shopping',
  travel: 'Traveling',
  alone: 'Being alone',
  friends: 'Socializing with your friends',
  family: 'Socializing with your family',
  classmates: 'Socializing with your classmates',
  relationship: 'Socializing with your significant other',
  online: 'Socializing online',
  pet: 'Being with your pet',
  jog: 'Jogging',
  walk: 'Walking',
  exercise: 'Exercising',
  sports: 'Playing a sport',
  meditate: 'Meditating',
  'eat-unhealthy': 'Eating unhealthy food',
  'eat-healthy': 'Eating healthy food',
  'no-physical': 'Not doing any physical activity',
  'drink-alcohol': 'Drinking alcohol'
};

function smartLabel(label, prev = '') {
  if (!label) return '';
  if (!prev || /[.!]\s*$/.test(prev)) {
    return label.charAt(0).toUpperCase() + label.slice(1);
  }
  return label.charAt(0).toLowerCase() + label.slice(1);
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const POSITIVE_VARIANTS = [
  (label, score) => `${smartLabel(label, '')} boosted your mood by ${score}%. Keep it up!`,
  (label, score) => `Great job! ${smartLabel(label, '!')} increased your mood by ${score}%.`,
  (label, score) => `Awesome! ${smartLabel(label, '!')} helped you feel ${score}% better.`,
  (label, score) => `You felt ${score}% better after ${smartLabel(label, 'r')}. Keep doing what works!`,
  (label, score) => `${smartLabel(label, '')} made a positive difference of ${score}% in your mood!`
];

const NEGATIVE_VARIANTS = [
  (label, score) => `${smartLabel(label, '')} lowered your mood by ${score}%. That's okay—tomorrow is a new day!`,
  (label, score) => `You felt ${score}% less upbeat after ${smartLabel(label, 'r')}. Remember, every day is a learning experience!`,
  (label, score) => `${smartLabel(label, '')} had a negative impact of ${score}% on your mood. Take care of yourself!`,
  (label, score) => `Not every activity lifts us up—${smartLabel(label, '—')} decreased your mood by ${score}%. You’ve got this!`,
  (label, score) => `After ${smartLabel(label, '!')}, your mood dropped by ${score}%. Be kind to yourself and try again!`
];

const NEUTRAL_VARIANTS = [
  (label) => `${smartLabel(label, '')} had a neutral effect on your mood.`,
  (label) => `No big mood changes after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} kept your mood steady.`,
  (label) => `Your mood stayed about the same after ${smartLabel(label, 'r')}.`,
  (label) => `${smartLabel(label, '')} didn't change your mood much this time.`
];

const formatText = (text) => {
  if (!text) return '';
  return text
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const getMoodIcon = (score) => {
  if (score > 0) return <TrendingUpIcon style={{ color: POSITIVE_COLOR, fontSize: 20 }} />;
  if (score < 0) return <TrendingDownIcon style={{ color: NEGATIVE_COLOR, fontSize: 20 }} />;
  return <TrendingFlatIcon style={{ color: '#f7b801', fontSize: 20 }} />;
};

const getActivityLabel = (activity) => {
  if (!activity) return '';
  return ACTIVITY_LABELS[activity] || formatText(activity);
};

const getMoodMessage = (activity, moodScore) => {
  const absScore = Math.abs(moodScore);
  const label = getActivityLabel(activity);

  if (moodScore > 0) {
    return getRandom(POSITIVE_VARIANTS)(label, absScore);
  } else if (moodScore < 0) {
    return getRandom(NEGATIVE_VARIANTS)(label, absScore);
  } else {
    return getRandom(NEUTRAL_VARIANTS)(label);
  }
};

const getSleepMessage = (avgHours, moodScore) => {
  const absScore = Math.abs(moodScore);
  if (moodScore > 0) {
    return `Averaging ${avgHours} hours of sleep boosted your mood by ${absScore}% this week. Great job maintaining healthy sleep!`;
  } else if (moodScore < 0) {
    return `Averaging ${avgHours} hours of sleep lowered your mood by ${absScore}% this week. Try to get more consistent rest.`;
  } else {
    return `Your sleep had a neutral effect on your mood this week.`;
  }
};

function getWeekRange(offset = 0) {
  const now = new Date();
  const currentDay = now.getDay();
  const start = new Date(now);
  start.setDate(now.getDate() - currentDay + offset * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatWeekRange(start, end) {
  const options = { month: 'short', day: 'numeric', year: 'numeric' };
  return `${start.toLocaleDateString(undefined, options)} - ${end.toLocaleDateString(undefined, options)}`;
}

const WeeklyAnova = () => {
  const [results, setResults] = useState({});
  const [sleepQuality, setSleepQuality] = useState(null);
  const [avgSleepHours, setAvgSleepHours] = useState(null);
  const [sleepMoodScore, setSleepMoodScore] = useState(null);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const { start, end } = useMemo(() => getWeekRange(weekOffset), [weekOffset]);

  useEffect(() => {
    const fetchWeeklyAnova = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/statistics/weekly-anova?start=${start.toISOString()}&end=${end.toISOString()}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResults(res.data.results);
        setSleepQuality(res.data.sleepQuality);
        setAvgSleepHours(res.data.avgSleepHours);
        setSleepMoodScore(res.data.sleepMoodScore);
      } catch (error) {
        console.error('Error fetching weekly anova:', error);
      }
      setLoading(false);
    };
    fetchWeeklyAnova();
  }, [start, end]);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F1F8E8' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
         {/* Week Navigation */}
        <div className="flex justify-between items-center mb-4">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="p-2 rounded-full hover:bg-[#D8EFD3] transition"
            aria-label="Previous Week"
          >
            <ArrowBackIosNewIcon />
          </button>
          <span className="text-xl font-bold text-[#272829]">
            {formatWeekRange(start, end)}
          </span>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            className="p-2 rounded-full hover:bg-[#D8EFD3] transition"
            aria-label="Next Week"
            disabled={weekOffset >= 0}
            style={{ opacity: weekOffset >= 0 ? 0.5 : 1 }}
          >
            <ArrowForwardIosIcon />
          </button>
        </div>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="flex justify-center items-center gap-3 mb-4">
            <div className="p-3 rounded-full" style={{ backgroundColor: '#D8EFD3' }}>
              <EmojiEventsIcon style={{ color: '#55AD9B', fontSize: 32 }} />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-[#272829] mb-2">Weekly Mood Insights</h1>
          <p className="text-lg text-[#55AD9B]">Discover how your activities affected your mood this week</p>
        </motion.div>

        {loading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-center items-center h-64"
          >
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#D8EFD3] border-t-[#55AD9B] rounded-full animate-spin mx-auto mb-4"></div>
              <span className="text-xl text-[#55AD9B] font-semibold">Analyzing your week...</span>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Sleep Quality Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-r from-white to-[#F1F8E8] rounded-2xl shadow-lg border-2 overflow-hidden"
              style={{ borderColor: '#D8EFD3' }}
            >
              <div className="bg-gradient-to-r from-[#95D2B3] to-[#55AD9B] p-6">
                <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                  <BedtimeIcon style={{ fontSize: 28 }} />
                  Weekly Sleep Analysis
                </h2>
                <p className="text-white/80 mt-1">How your sleep patterns affected your mood this week</p>
              </div>

              <div className="p-6">
                {sleepQuality && avgSleepHours ? (
                  <div className="space-y-4">
                    {/* Sleep Quality Info */}
                    <div className="flex items-center justify-between p-4 rounded-xl border" style={{ backgroundColor: '#F1F8E8', borderColor: '#D8EFD3' }}>
                      <div className="flex items-center gap-4">
                        <span className="text-4xl">😴</span>
                        <div>
                          <div className="flex items-center gap-3">
                            <span
                              className="px-3 py-1 rounded-full font-bold text-sm"
                              style={{
                                backgroundColor: sleepQualityColors[sleepQuality],
                                color: '#fff'
                              }}
                            >
                              {formatText(sleepQuality)}
                            </span>
                            <span className="text-lg font-semibold text-[#272829]">
                              Avg {avgSleepHours} Hours/Night
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Sleep Mood Impact */}
                    {sleepMoodScore !== null && (
                      <div className="flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-md" style={{ backgroundColor: '#F1F8E8', borderColor: '#D8EFD3' }}>
                        <div className="flex-shrink-0 mt-1">
                          {getMoodIcon(sleepMoodScore)}
                        </div>
                        <div className="flex-1">
                          <p className="text-[#272829] text-lg leading-relaxed font-medium">
                            {getSleepMessage(avgSleepHours, sleepMoodScore)}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <span
                            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                            style={{
                              backgroundColor: sleepMoodScore > 0 ? POSITIVE_COLOR :
                                sleepMoodScore < 0 ? NEGATIVE_COLOR : '#f7b801',
                              color: '#fff'
                            }}
                          >
                            {`${Math.abs(sleepMoodScore)}%`}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-8">
                    <div className="text-4xl mb-3">😴</div>
                    <span className="text-gray-500 text-lg">No sleep data recorded this week</span>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Mood Results Section */}
            {Object.keys(results).length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-lg p-8 text-center border-2"
                style={{ borderColor: '#D8EFD3' }}
              >
                <div className="text-6xl mb-4">📊</div>
                <h3 className="text-2xl font-semibold text-[#272829] mb-2">No Activity Data This Week</h3>
                <p className="text-lg text-gray-500">Start logging your activities to see your weekly mood insights!</p>
              </motion.div>
            ) : (
              Object.entries(results).map(([category, { positive, negative }], categoryIndex) => (
                <motion.div
                  key={category}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: categoryIndex * 0.1 }}
                  className="bg-white rounded-2xl shadow-lg border-2 overflow-hidden"
                  style={{ borderColor: '#D8EFD3' }}
                >
                  <div className="bg-gradient-to-r from-[#95D2B3] to-[#55AD9B] p-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <EmojiEventsIcon style={{ fontSize: 28 }} />
                      {CATEGORY_LABELS[category] || formatText(category)}
                    </h3>
                    <p className="text-white/80 mt-1">How your activities affected your mood this week</p>
                  </div>
                  <div className="p-6">
                    {/* Positive */}
                    {positive && positive.length > 0 && (
                      <div className="mb-6">
                        <h4 className="text-lg font-bold mb-2" style={{ color: POSITIVE_COLOR }}>
                          🌱 Habits that boosted your mood
                        </h4>
                        <div className="space-y-3">
                          {positive.map((item, idx) => (
                            <div
                              key={item.activity}
                              className="flex items-start gap-4 p-4 rounded-xl border"
                              style={{
                                backgroundColor: '#F1F8E8',
                                borderColor: POSITIVE_COLOR
                              }}
                            >
                              <div className="flex-shrink-0 mt-1">
                                {getMoodIcon(item.moodScore)}
                              </div>
                              <div className="flex-1">
                                <p className="text-[#272829] text-lg leading-relaxed font-medium">
                                  {getMoodMessage(item.activity, item.moodScore)}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <span
                                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                                  style={{
                                    backgroundColor: POSITIVE_COLOR,
                                    color: '#fff'
                                  }}
                                >
                                  {`${Math.abs(item.moodScore)}%`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Negative */}
                    {negative && negative.length > 0 && (
                      <div>
                        <h4 className="text-lg font-bold mb-2" style={{ color: NEGATIVE_COLOR }}>
                          🍂 Habits that lowered your mood
                        </h4>
                        <div className="space-y-3">
                          {negative.map((item, idx) => (
                            <div
                              key={item.activity}
                              className="flex items-start gap-4 p-4 rounded-xl border"
                              style={{
                                backgroundColor: '#FFF7E6',
                                borderColor: NEGATIVE_COLOR
                              }}
                            >
                              <div className="flex-shrink-0 mt-1">
                                {getMoodIcon(item.moodScore)}
                              </div>
                              <div className="flex-1">
                                <p className="text-[#272829] text-lg leading-relaxed font-medium">
                                  {getMoodMessage(item.activity, item.moodScore)}
                                </p>
                              </div>
                              <div className="flex-shrink-0">
                                <span
                                  className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                                  style={{
                                    backgroundColor: NEGATIVE_COLOR,
                                    color: '#fff'
                                  }}
                                >
                                  {`${Math.abs(item.moodScore)}%`}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* If no positive or negative */}
                    {(!positive || positive.length === 0) && (!negative || negative.length === 0) && (
                      <div className="text-center text-gray-500 py-8">
                        No significant mood changes from your activities in this category this week.
                      </div>
                    )}
                  </div>
                </motion.div>
              ))
            )}

            {/* Motivational Footer */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center bg-gradient-to-r from-[#D8EFD3] to-[#95D2B3] rounded-2xl p-6"
            >
              <p className="text-[#272829] text-lg font-medium">
                🌟 Reflect on this week's patterns and plan for an even better week ahead! 🌟
              </p>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WeeklyAnova;