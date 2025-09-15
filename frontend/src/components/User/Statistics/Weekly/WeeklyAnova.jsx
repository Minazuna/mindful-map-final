import React, { useEffect, useState } from 'react';
import axios from 'axios';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import { motion } from 'framer-motion';

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

// Activity transformation mapping
const ACTIVITY_TRANSFORMATIONS = {
  'study': 'Studying',
  'read': 'Reading',
  'extracurricular': 'Doing Extracurricular Activities',
  'relax': 'Relaxing',
  'watch-movie': 'Watching Movie',
  'listen-music': 'Listening to Music',
  'gaming': 'Gaming',
  'browse-internet': 'Browsing the Internet',
  'shopping': 'Shopping',
  'travel': 'Traveling',
  'alone': 'Being Alone',
  'friends': 'Being with Friends',
  'family': 'Being with Family',
  'classmates': 'Being with Classmates',
  'relationship': 'Being with Partner',
  'online-interaction': 'Interacting Online',
  'pet': 'Being with Pet',
  'jog': 'Jogging',
  'walk': 'Walking',
  'exercise': 'Exercising',
  'meditate': 'Meditating',
  'eat-healthy': 'Eating Healthy',
  'no-physical': 'Not Doing Physical Activity',
  'eat-unhealthy': 'Eating Unhealthy',
  'drink-alcohol': 'Drinking Alcohol',
  'sleep': 'Sleeping'
};

// Positive message variations for weekly
const POSITIVE_MESSAGES = [
  "boosted your mood by {score}% this week. Keep it up!",
  "increased your happiness by {score}% this week. Great choice!",
  "lifted your spirits by {score}% this week. Well done!",
  "brightened your week by {score}%. Fantastic consistency!",
  "enhanced your mood by {score}% this week. You're doing amazing!"
];

// Negative message variations for weekly
const NEGATIVE_MESSAGES = [
  "decreased your mood by {score}% this week. Consider alternatives.",
  "lowered your energy by {score}% this week. Maybe try something else?",
  "brought your mood down by {score}% this week. Time to reassess?",
  "affected your happiness by {score}% this week. Perhaps limit this activity.",
  "dampened your spirits by {score}% this week. Consider changing your approach."
];

// Neutral message variations for weekly
const NEUTRAL_MESSAGES = [
  "had no significant impact on your mood this week. That's okay!",
  "kept your mood stable this week. Consistency is good!",
  "maintained your current mood this week. Sometimes neutral is perfect!",
  "had a balanced effect on your mood this week. Keep exploring!"
];

// Sleep message variations for weekly
const SLEEP_POSITIVE_MESSAGES = [
  "this week had a {score}% improvement on your mood. Good job maintaining healthy sleep!",
  "this week boosted your mood by {score}%. Excellent sleep routine this week!",
  "this week enhanced your well-being by {score}%. Keep up the great sleep habits!",
  "this week lifted your spirits by {score}%. Great job prioritizing rest consistently!",
  "this week improved your mood by {score}%. Your sleep consistency is paying off!"
];

const SLEEP_NEGATIVE_MESSAGES = [
  "this week brought your mood down by {score}%. Try getting more consistent sleep.",
  "this week affected your mood negatively by {score}%. Consider better sleep habits.",
  "this week lowered your energy by {score}%. Prioritize more consistent rest.",
  "this week impacted your well-being by {score}%. Focus on better sleep quality.",
  "this week decreased your mood by {score}%. Your sleep patterns need attention."
];

// Format text: capitalize first letter of every word, remove - and _
const formatText = (text) => {
  if (!text) return '';
  return text
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const transformActivity = (activity) => {
  const key = activity.toLowerCase().replace(/\s+/g, '-');
  return ACTIVITY_TRANSFORMATIONS[key] || formatText(activity);
};

const getSleepMessage = (avgHours, moodScore) => {
  const absScore = Math.abs(moodScore);
  let messages, messageTemplate;
  
  if (moodScore > 0) {
    messages = SLEEP_POSITIVE_MESSAGES;
  } else {
    messages = SLEEP_NEGATIVE_MESSAGES;
  }
  
  // Get random message variation
  messageTemplate = messages[Math.floor(Math.random() * messages.length)];
  
  // Replace placeholder with actual score
  const message = messageTemplate.replace('{score}', absScore);
  
  if (avgHours >= 7) {
    return `Averaging ${avgHours} hours of sleep ${message}`;
  } else {
    return `Averaging ${avgHours} hours of sleep ${message}`;
  }
};

const getMoodMessage = (activity, moodScore, avgHours = null, category = null) => {
  // Special handling for sleep category
  if (category === 'sleep' && avgHours !== null) {
    return getSleepMessage(avgHours, moodScore);
  }
  
  const transformedActivity = transformActivity(activity);
  const absScore = Math.abs(moodScore);
  
  let messages, messageTemplate;
  
  if (moodScore > 0) {
    messages = POSITIVE_MESSAGES;
  } else if (moodScore < 0) {
    messages = NEGATIVE_MESSAGES;
  } else {
    messages = NEUTRAL_MESSAGES;
  }
  
  // Get random message variation
  messageTemplate = messages[Math.floor(Math.random() * messages.length)];
  
  // Replace placeholder with actual score
  const message = messageTemplate.replace('{score}', absScore);
  
  return `${transformedActivity} ${message}`;
};

const WeeklyAnova = () => {
  const [topResults, setTopResults] = useState({});
  const [sleepQuality, setSleepQuality] = useState(null);
  const [avgSleepHours, setAvgSleepHours] = useState(null);
  const [sleepMoodScore, setSleepMoodScore] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWeeklyAnova = async () => {
      setLoading(true);
      const token = localStorage.getItem('token');
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/statistics/weekly-anova`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTopResults(res.data.topResults);
        setSleepQuality(res.data.sleepQuality);
        setAvgSleepHours(res.data.avgSleepHours);
        setSleepMoodScore(res.data.sleepMoodScore);
      } catch (error) {
        console.error('Error fetching weekly anova:', error);
      }
      setLoading(false);
    };
    fetchWeeklyAnova();
  }, []);

  const getMoodIcon = (score) => {
    if (score > 0) return <TrendingUpIcon style={{ color: '#55AD9B', fontSize: 20 }} />;
    if (score < 0) return <TrendingDownIcon style={{ color: '#ff6b6b', fontSize: 20 }} />;
    return <TrendingFlatIcon style={{ color: '#f7b801', fontSize: 20 }} />;
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F1F8E8' }}>
      <div className="max-w-4xl mx-auto px-4 py-8">
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
                            {getMoodMessage('sleep', sleepMoodScore, avgSleepHours, 'sleep')}
                          </p>
                        </div>
                        
                        <div className="flex-shrink-0">
                          <span
                            className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                            style={{
                              backgroundColor: sleepMoodScore > 0 ? '#55AD9B' : 
                                             sleepMoodScore < 0 ? '#ff6b6b' : '#f7b801',
                              color: '#fff'
                            }}
                          >
                            {sleepMoodScore > 0 ? `+${sleepMoodScore}%` : 
                             sleepMoodScore < 0 ? `${sleepMoodScore}%` : `${sleepMoodScore}%`}
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
            {Object.keys(topResults).length === 0 ? (
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
              Object.entries(topResults).map(([category, items], categoryIndex) => (
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
                      <TrendingUpIcon style={{ fontSize: 28 }} />
                      {CATEGORY_LABELS[category] || formatText(category)}
                    </h3>
                    <p className="text-white/80 mt-1">Top activities that affected your mood this week</p>
                  </div>
                  
                  <div className="p-6">
                    <div className="space-y-4">
                      {items.map((item, index) => (
                        <motion.div
                          key={item.activity}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: (categoryIndex * 0.1) + (index * 0.05) }}
                          className="flex items-start gap-4 p-4 rounded-xl border transition-all hover:shadow-md"
                          style={{ 
                            backgroundColor: '#F1F8E8',
                            borderColor: '#D8EFD3'
                          }}
                        >
                          <div className="flex-shrink-0 mt-1">
                            {getMoodIcon(item.moodScore)}
                          </div>
                          
                          <div className="flex-1">
                            <p className="text-[#272829] text-lg leading-relaxed font-medium">
                              {getMoodMessage(item.activity, item.moodScore, null, category)}
                            </p>
                          </div>
                          
                          <div className="flex-shrink-0">
                            <span
                              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold"
                              style={{
                                backgroundColor: item.moodScore > 0 ? '#55AD9B' : 
                                               item.moodScore < 0 ? '#ff6b6b' : '#f7b801',
                                color: '#fff'
                              }}
                            >
                              {item.moodScore > 0 ? `+${item.moodScore}%` : 
                               item.moodScore < 0 ? `${item.moodScore}%` : `${item.moodScore}%`}
                            </span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
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