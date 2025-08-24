import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { 
  TrendingUp as TrendingUpIcon, 
  CalendarToday as CalendarTodayIcon, 
  SentimentSatisfied as SentimentSatisfiedIcon,
  SentimentDissatisfied as SentimentDissatisfiedIcon,
  WbSunny as WbSunnyIcon,
  Brightness3 as Brightness3Icon,
  WbTwilight as WbTwilightIcon,
  BarChart as BarChartIcon,
  EmojiEmotions as EmojiEmotionsIcon,
  AccessTime as AccessTimeIcon,
  Refresh as RefreshIcon,
  ArrowBack as ArrowBackIcon,
  ArrowForward as ArrowForwardIcon,
  TrendingUpOutlined as TrendingUpOutlinedIcon,
  TrendingDownOutlined as TrendingDownOutlinedIcon,
  TrendingFlatOutlined as TrendingFlatOutlinedIcon,
  LightbulbOutlined as LightbulbOutlinedIcon
} from '@mui/icons-material';
import { CircularProgress, IconButton, Tooltip } from '@mui/material';

const DailyStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [previousDayStats, setPreviousDayStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);

  // Emotion emojis mapping
  const emotionEmojis = {
    // Positive emotions
    'calm': '😌',
    'relaxed': '😊',
    'pleased': '🙂',
    'happy': '😄',
    'excited': '🤩',
    // Negative emotions
    'bored': '😑',
    'sad': '😢',
    'disappointed': '😞',
    'angry': '😠',
    'tense': '😰'
  };

  // Time segment icons
  const timeSegmentIcons = {
    morning: <WbSunnyIcon style={{ fontSize: 32, color: '#FFA726' }} />,
    afternoon: <WbTwilightIcon style={{ fontSize: 32, color: '#FF7043' }} />,
    evening: <Brightness3Icon style={{ fontSize: 32, color: '#5C6BC0' }} />
  };

  // Format date for display
  const formatDate = (date) => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
    }
  };

  // Format text function
  const formatText = (text) => {
    if (!text) return '';
    return text
      .replace(/[-_]/g, ' ')
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  // Fetch daily statistics
  const fetchDailyStatistics = async (date) => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      
      const formattedDate = date.toISOString().split('T')[0];
      
      // Fetch current day statistics
      const fullUrl = `${import.meta.env.VITE_NODE_API}/api/statistics/daily?date=${formattedDate}`;
      const response = await axios.get(fullUrl, { 
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Fetch previous day statistics for comparison
      const previousDate = new Date(date);
      previousDate.setDate(previousDate.getDate() - 1);
      const previousFormattedDate = previousDate.toISOString().split('T')[0];
      
      try {
        const previousUrl = `${import.meta.env.VITE_NODE_API}/api/statistics/daily?date=${previousFormattedDate}`;
        const previousResponse = await axios.get(previousUrl, { 
          headers: { Authorization: `Bearer ${token}` }
        });
        setPreviousDayStats(previousResponse.data.data);
      } catch (prevError) {
        console.log('No previous day data available');
        setPreviousDayStats(null);
      }
      
      setStatistics(response.data.data);
    } catch (error) {
      console.error('❌ Error:', error.response?.data || error.message);
      
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.href = '/login';
        return;
      }
      
      setError('Failed to load daily statistics');
    } finally {
      setLoading(false);
    }
  };

  // Navigate dates
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Get most frequent emotions (top 3)
  const getTopEmotions = () => {
    if (!statistics?.emotionCounts) return [];
    
    return Object.entries(statistics.emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([emotion, count]) => ({
        emotion,
        count,
        emoji: emotionEmojis[emotion] || '😐'
      }));
  };

  // Generate comparison insights
  const getComparisonInsights = () => {
    if (!statistics || !previousDayStats || statistics.totalEntries === 0 || previousDayStats.totalEntries === 0) {
      return null;
    }

    const insights = [];

    // Total entries comparison
    const entriesDiff = statistics.totalEntries - previousDayStats.totalEntries;
    if (entriesDiff > 0) {
      insights.push({
        type: 'positive',
        icon: <TrendingUpOutlinedIcon />,
        text: `You logged ${entriesDiff} more mood${entriesDiff > 1 ? 's' : ''} than yesterday! Great self-awareness! 🌟`,
        color: '#4CAF50'
      });
    } else if (entriesDiff < 0) {
      insights.push({
        type: 'neutral',
        icon: <TrendingDownOutlinedIcon />,
        text: `You logged ${Math.abs(entriesDiff)} fewer mood${Math.abs(entriesDiff) > 1 ? 's' : ''} than yesterday. Every bit of tracking counts! 📝`,
        color: '#FF9800'
      });
    }

    // Positive mood comparison
    const currentPositive = statistics.valenceCounts.positive;
    const previousPositive = previousDayStats.valenceCounts.positive;
    const positiveDiff = currentPositive - previousPositive;

    if (positiveDiff > 0) {
      const percentage = previousPositive > 0 ? Math.round((positiveDiff / previousPositive) * 100) : 100;
      insights.push({
        type: 'positive',
        icon: <SentimentSatisfiedIcon />,
        text: `${positiveDiff} more positive mood${positiveDiff > 1 ? 's' : ''} than yesterday! You're on an upward trend! 🚀`,
        color: '#4CAF50'
      });
    } else if (positiveDiff < 0) {
      insights.push({
        type: 'understanding',
        icon: <SentimentDissatisfiedIcon />,
        text: `Fewer positive moods than yesterday. That's perfectly normal - every day is different! 💙`,
        color: '#2196F3'
      });
    }

    // Intensity comparison
    const intensityDiff = statistics.averageIntensity - previousDayStats.averageIntensity;
    if (Math.abs(intensityDiff) > 0.5) {
      if (intensityDiff > 0) {
        insights.push({
          type: 'insight',
          icon: <TrendingUpOutlinedIcon />,
          text: `Your emotions felt ${intensityDiff.toFixed(1)} points more intense today. You're experiencing life fully! ⚡`,
          color: '#9C27B0'
        });
      } else {
        insights.push({
          type: 'positive',
          icon: <TrendingDownOutlinedIcon />,
          text: `Your emotions were ${Math.abs(intensityDiff).toFixed(1)} points calmer today. Inner peace is showing! 🧘‍♀️`,
          color: '#4CAF50'
        });
      }
    }

    // Dominant mood shift
    if (statistics.mostProminentValence !== previousDayStats.mostProminentValence) {
      if (statistics.mostProminentValence === 'positive') {
        insights.push({
          type: 'celebration',
          icon: <SentimentSatisfiedIcon />,
          text: `Your mood shifted from negative to positive today! What a beautiful turnaround! 🌈`,
          color: '#4CAF50'
        });
      } else {
        insights.push({
          type: 'understanding',
          icon: <LightbulbOutlinedIcon />,
          text: `Today felt more challenging than yesterday. Remember, difficult days make us stronger! 💪`,
          color: '#2196F3'
        });
      }
    }

    // Most frequent emotion comparison
    const currentTopEmotion = Object.keys(statistics.emotionCounts).reduce((a, b) => 
      statistics.emotionCounts[a] > statistics.emotionCounts[b] ? a : b
    );
    const previousTopEmotion = Object.keys(previousDayStats.emotionCounts).reduce((a, b) => 
      previousDayStats.emotionCounts[a] > previousDayStats.emotionCounts[b] ? a : b
    );

    if (currentTopEmotion !== previousTopEmotion) {
      const emoji = emotionEmojis[currentTopEmotion] || '😐';
      insights.push({
        type: 'insight',
        icon: <EmojiEmotionsIcon />,
        text: `Your primary emotion shifted from ${formatText(previousTopEmotion)} to ${formatText(currentTopEmotion)} ${emoji}. Emotional variety is healthy!`,
        color: '#FF5722'
      });
    }

    return insights.slice(0, 3); // Return max 3 insights
  };

  useEffect(() => {
    fetchDailyStatistics(selectedDate);
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F1F8E8' }}>
        <div className="flex items-center space-x-3 bg-white/80 px-6 py-4 rounded-full shadow-lg">
          <CircularProgress size={28} style={{ color: '#55AD9B' }} />
          <span className="text-lg font-medium" style={{ color: '#272829' }}>Loading statistics...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F1F8E8' }}>
        <div className="text-center bg-white/90 p-8 rounded-2xl shadow-lg">
          <div className="text-6xl mb-4">📊</div>
          <h2 className="text-2xl font-bold mb-2" style={{ color: '#272829' }}>Error Loading Data</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchDailyStatistics(selectedDate)}
            className="px-6 py-3 rounded-full text-white font-semibold shadow-lg"
            style={{ backgroundColor: '#55AD9B' }}
          >
            <RefreshIcon className="mr-2" />
            Try Again
          </motion.button>
        </div>
      </div>
    );
  }

  const comparisonInsights = getComparisonInsights();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F1F8E8' }}>
      {/* Header */}
      <div className="bg-white/90 backdrop-blur-md shadow-lg sticky top-0 z-10 border-b" style={{ borderColor: '#D8EFD3' }}>
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <BarChartIcon style={{ color: '#55AD9B', fontSize: 32 }} />
              <div>
                <h1 className="text-2xl font-bold" style={{ color: '#272829' }}>Daily Statistics</h1>
                <p className="text-sm" style={{ color: '#55AD9B' }}>After-activity mood insights</p>
              </div>
            </div>

            {/* Date Navigation */}
            <div className="flex items-center space-x-2">
              <Tooltip title="Previous Day">
                <IconButton onClick={() => navigateDate('prev')} size="small">
                  <ArrowBackIcon style={{ color: '#55AD9B' }} />
                </IconButton>
              </Tooltip>
              
              <div className="text-center px-4">
                <div className="text-lg font-semibold" style={{ color: '#272829' }}>
                  {formatDate(selectedDate)}
                </div>
                <div className="text-sm" style={{ color: '#55AD9B' }}>
                  {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
              
              <Tooltip title="Next Day">
                <IconButton 
                  onClick={() => navigateDate('next')} 
                  size="small"
                  disabled={selectedDate.toDateString() === new Date().toDateString()}
                >
                  <ArrowForwardIcon style={{ color: '#55AD9B' }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {statistics?.totalEntries === 0 ? (
          // No data state
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-white/90 p-12 rounded-2xl shadow-lg max-w-lg mx-auto"
          >
            <div className="text-8xl mb-6">📝</div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#272829' }}>No Mood Entries</h2>
            <p className="text-lg mb-8" style={{ color: '#55AD9B' }}>
              No mood entries found for {formatDate(selectedDate).toLowerCase()}. Start tracking your emotions to see insights here!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Comparison Insights */}
            {comparisonInsights && comparisonInsights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border"
                style={{ borderColor: '#D8EFD3' }}
              >
                <h2 className="text-xl font-bold mb-4 flex items-center" style={{ color: '#272829' }}>
                  <LightbulbOutlinedIcon className="mr-3" style={{ color: '#55AD9B' }} />
                  Daily Insights & Comparisons
                </h2>
                <div className="space-y-3">
                  {comparisonInsights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 + index * 0.1 }}
                      className="flex items-start space-x-3 p-4 bg-white/70 rounded-xl"
                    >
                      <div style={{ color: insight.color }}>
                        {insight.icon}
                      </div>
                      <p className="text-sm leading-relaxed" style={{ color: '#272829' }}>
                        {insight.text}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Total Entries */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border"
                style={{ borderColor: '#D8EFD3' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <EmojiEmotionsIcon style={{ color: '#55AD9B', fontSize: 40 }} />
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: '#272829' }}>
                      {statistics.totalEntries}
                    </div>
                    <div className="text-sm" style={{ color: '#55AD9B' }}>
                      Total Entries
                    </div>
                  </div>
                </div>
                {previousDayStats && (
                  <div className="text-xs" style={{ color: '#666' }}>
                    Yesterday: {previousDayStats.totalEntries}
                  </div>
                )}
              </motion.div>

              {/* Prominent Valence */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border"
                style={{ borderColor: '#D8EFD3' }}
              >
                <div className="flex items-center justify-between mb-4">
                  {statistics.mostProminentValence === 'positive' ? (
                    <SentimentSatisfiedIcon style={{ color: '#4CAF50', fontSize: 40 }} />
                  ) : (
                    <SentimentDissatisfiedIcon style={{ color: '#F44336', fontSize: 40 }} />
                  )}
                  <div className="text-right">
                    <div className="text-2xl font-bold" style={{ 
                      color: statistics.mostProminentValence === 'positive' ? '#4CAF50' : '#F44336'
                    }}>
                      {formatText(statistics.mostProminentValence)}
                    </div>
                    <div className="text-sm" style={{ color: '#55AD9B' }}>
                      Dominant Mood
                    </div>
                  </div>
                </div>
                <div className="flex justify-between text-sm">
                  <span style={{ color: '#4CAF50' }}>
                    Positive: {statistics.valenceCounts.positive}
                  </span>
                  <span style={{ color: '#F44336' }}>
                    Negative: {statistics.valenceCounts.negative}
                  </span>
                </div>
                {previousDayStats && (
                  <div className="text-xs mt-2" style={{ color: '#666' }}>
                    Yesterday: {formatText(previousDayStats.mostProminentValence)}
                  </div>
                )}
              </motion.div>

              {/* Average Intensity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border"
                style={{ borderColor: '#D8EFD3' }}
              >
                <div className="flex items-center justify-between mb-4">
                  <TrendingUpIcon style={{ color: '#55AD9B', fontSize: 40 }} />
                  <div className="text-right">
                    <div className="text-3xl font-bold" style={{ color: '#272829' }}>
                      {statistics.averageIntensity?.toFixed(1) || '0.0'}
                    </div>
                    <div className="text-sm" style={{ color: '#55AD9B' }}>
                      Avg Intensity
                    </div>
                  </div>
                </div>
                <div className="flex space-x-1">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-2 flex-1 rounded-full"
                      style={{ 
                        backgroundColor: i < Math.round(statistics.averageIntensity || 0) ? '#55AD9B' : '#D8EFD3' 
                      }}
                    />
                  ))}
                </div>
                {previousDayStats && (
                  <div className="text-xs mt-2" style={{ color: '#666' }}>
                    Yesterday: {previousDayStats.averageIntensity?.toFixed(1) || '0.0'}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Top Emotions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border"
              style={{ borderColor: '#D8EFD3' }}
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center" style={{ color: '#272829' }}>
                <EmojiEmotionsIcon className="mr-3" style={{ color: '#55AD9B' }} />
                Most Frequent Emotions
              </h2>
              
              {getTopEmotions().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {getTopEmotions().map((item, index) => (
                    <motion.div
                      key={item.emotion}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="text-center p-6 rounded-xl"
                      style={{ backgroundColor: index === 0 ? '#D8EFD3' : '#F1F8E8' }}
                    >
                      <div className="text-5xl mb-3">{item.emoji}</div>
                      <div className="text-xl font-semibold mb-2" style={{ color: '#272829' }}>
                        {formatText(item.emotion)}
                      </div>
                      <div className="text-lg font-bold" style={{ color: '#55AD9B' }}>
                        {item.count} time{item.count !== 1 ? 's' : ''}
                      </div>
                      {index === 0 && (
                        <div className="mt-2">
                          <span className="text-xs px-3 py-1 rounded-full text-white" style={{ backgroundColor: '#55AD9B' }}>
                            Most Frequent
                          </span>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">😐</div>
                  <p style={{ color: '#55AD9B' }}>No emotion data available</p>
                </div>
              )}
            </motion.div>

            {/* Time Segment Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl p-8 shadow-lg border"
              style={{ borderColor: '#D8EFD3' }}
            >
              <h2 className="text-2xl font-bold mb-6 flex items-center" style={{ color: '#272829' }}>
                <AccessTimeIcon className="mr-3" style={{ color: '#55AD9B' }} />
                Mood by Time of Day
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Object.entries({
                  morning: 'Morning (5:00 AM - 11:59 AM)',
                  afternoon: 'Afternoon (12:00 PM - 5:59 PM)',  
                  evening: 'Evening (6:00 PM onwards)'
                }).map(([segment, label], index) => {
                  const moodData = statistics.timeSegmentMoods[segment];
                  
                  return (
                    <motion.div
                      key={segment}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.7 + index * 0.1 }}
                      className="p-6 rounded-xl border"
                      style={{ backgroundColor: '#F1F8E8', borderColor: '#D8EFD3' }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        {timeSegmentIcons[segment]}
                        <div className="text-right">
                          <div className="text-sm font-medium" style={{ color: '#272829' }}>
                            {label.split(' (')[0]}
                          </div>
                          <div className="text-xs" style={{ color: '#55AD9B' }}>
                            {label.match(/\(([^)]+)\)/)?.[1]}
                          </div>
                        </div>
                      </div>
                      
                      {moodData ? (
                        <div className="text-center">
                          <div className="text-4xl mb-3">
                            {emotionEmojis[moodData.emotion] || '😐'}
                          </div>
                          <div className="text-lg font-semibold mb-2" style={{ color: '#272829' }}>
                            {formatText(moodData.emotion)}
                          </div>
                          <div className="text-sm mb-2" style={{ color: '#55AD9B' }}>
                            {moodData.count} of {moodData.totalEntries} entries
                          </div>
                          <div className="flex justify-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-full"
                                style={{ 
                                  backgroundColor: i < Math.round(moodData.averageIntensity) ? '#55AD9B' : '#D8EFD3' 
                                }}
                              />
                            ))}
                          </div>
                          <div className="text-xs mt-1" style={{ color: '#55AD9B' }}>
                            Intensity: {moodData.averageIntensity}/5
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-4">
                          <div className="text-3xl mb-2 opacity-50">😴</div>
                          <div className="text-sm" style={{ color: '#55AD9B' }}>
                            No entries
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyStatistics;