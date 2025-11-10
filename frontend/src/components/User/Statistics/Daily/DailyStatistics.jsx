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
import { CircularProgress, IconButton, Tooltip, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { emotionImages } from '../../../../../utils/moods';

const timeSegmentLabels = {
  earlyMorning: 'Early Morning (12:00 AM - 5:59 AM)',
  morning: 'Morning (6:00 AM - 11:59 AM)',
  afternoon: 'Afternoon (12:00 PM - 5:59 PM)',
  evening: 'Evening (6:00 PM - 11:59 PM)'
};

const timeSegmentIcons = {
  earlyMorning: <Brightness3Icon style={{ fontSize: 28, color: '#6C63FF' }} />,
  morning: <WbSunnyIcon style={{ fontSize: 28, color: '#FFA726' }} />,
  afternoon: <WbTwilightIcon style={{ fontSize: 28, color: '#FF7043' }} />,
  evening: <Brightness3Icon style={{ fontSize: 28, color: '#5C6BC0' }} />
};

const segmentOrder = ['earlyMorning', 'morning', 'afternoon', 'evening'];

const formatText = (text) => {
  if (!text) return '';
  return text
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const DailyStatistics = () => {
  const [statistics, setStatistics] = useState(null);
  const [previousDayStats, setPreviousDayStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
        setPreviousDayStats(null);
      }

      setStatistics(response.data.data);
    } catch (error) {
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
        image: emotionImages[emotion] || null
      }));
  };

  // Generate comparison insights
  const getComparisonInsights = () => {
    if (!statistics || !previousDayStats || statistics.totalLogs === 0 || previousDayStats.totalLogs === 0) {
      return null;
    }

    const insights = [];

    // Total entries comparison
    const entriesDiff = statistics.totalLogs - previousDayStats.totalLogs;
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
      insights.push({
        type: 'insight',
        icon: <TrendingFlatOutlinedIcon />,
        text: `Your primary emotion today is ${formatText(previousTopEmotion)}. Yesterday it was ${formatText(currentTopEmotion)}.`,
        color: '#5247caff'
      });
    }

    return insights.slice(0, 3); // Return max 3 insights
  };

  useEffect(() => {
    fetchDailyStatistics(selectedDate);
    // eslint-disable-next-line
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#55AD9B' }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center space-x-3 bg-white px-8 py-6 rounded-2xl shadow-lg"
        >
          <CircularProgress size={32} style={{ color: '#55AD9B' }} />
          <span className="text-lg font-medium" style={{ color: '#272829' }}>Loading statistics...</span>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#55AD9B' }}>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center bg-white p-12 rounded-3xl shadow-xl max-w-md"
        >
          <div className="text-6xl mb-6">📊</div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: '#272829' }}>Unable to Load Data</h2>
          <p className="text-gray-600 mb-8 leading-relaxed">{error}</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => fetchDailyStatistics(selectedDate)}
            className="px-8 py-3 rounded-xl text-white font-semibold shadow-lg transition-all duration-200"
            style={{ backgroundColor: '#55AD9B' }}
          >
            <RefreshIcon className="mr-2" />
            Try Again
          </motion.button>
        </motion.div>
      </div>
    );
  }

  const comparisonInsights = getComparisonInsights();

  return (
    <div className="min-h-screen" style={{ background: '#55AD9B' }}>
      {/* Header */}
      <div className="bg-white/95 backdrop-blur-lg shadow-sm sticky top-0 z-10 border-b border-gray-100">
        <div className="container mx-auto px-6 py-6 flex items-center justify-between">
          <IconButton
            onClick={() => navigate(-1)}
            size="large"
            className="hover:bg-[#e8f5e9] transition-colors"
            style={{ marginRight: 16 }}
          >
            <ArrowBackIcon style={{ color: '#55AD9B', fontSize: 32 }} />
          </IconButton>
          <div className="flex flex-col items-center flex-1">
            <div className="flex items-center space-x-2">
              <span className="text-2xl font-bold" style={{ color: '#272829', letterSpacing: 1 }}>Daily Mood Statistics</span>
            </div>
            <span className="text-sm text-gray-500 mt-1">{formatDate(selectedDate)}</span>
            <div className="flex items-center justify-center mt-2">
              <Tooltip title="Previous Day">
                <span>
                  <IconButton
                    onClick={() => navigateDate('prev')}
                    size="small"
                    className="hover:bg-white/70 transition-colors"
                  >
                    <ArrowBackIcon style={{ color: '#55AD9B' }} />
                  </IconButton>
                </span>
              </Tooltip>
              <div className="text-sm text-gray-500 px-2">
                {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
              <Tooltip title="Next Day">
                <span>
                  <IconButton
                    onClick={() => navigateDate('next')}
                    size="small"
                    disabled={selectedDate.toDateString() === new Date().toDateString()}
                    className="hover:bg-white/70 transition-colors disabled:opacity-50"
                  >
                    <ArrowForwardIcon style={{ color: '#55AD9B' }} />
                  </IconButton>
                </span>
              </Tooltip>
            </div>
          </div>
          <div style={{ width: 48 }} /> 
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        {statistics?.totalLogs === 0 ? (
          // No data state
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center bg-white p-16 rounded-3xl shadow-sm max-w-lg mx-auto border border-gray-100"
          >
            <div className="text-8xl mb-8">📝</div>
            <h2 className="text-3xl font-bold mb-4" style={{ color: '#272829' }}>No Mood Entries</h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              No mood entries found for {formatDate(selectedDate).toLowerCase()}. Start tracking your emotions to see insights here!
            </p>
          </motion.div>
        ) : (
          <div className="space-y-10 max-w-6xl mx-auto">
            {/* Comparison Insights */}
            {comparisonInsights && comparisonInsights.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-blue-50 via-white to-purple-50 rounded-3xl p-8 border border-gray-100 shadow-sm"
              >
                <div className="flex items-center space-x-3 mb-6">
                  <div className="p-2 rounded-xl">
                    <LightbulbOutlinedIcon style={{ color: '#55AD9B', fontSize: 24 }} />
                  </div>
                  <h2 className="text-xl font-bold" style={{ color: '#272829' }}>
                    Daily Insights & Comparisons
                  </h2>
                </div>
                <div className="grid gap-4">
                  {comparisonInsights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.2 + index * 0.1 }}
                      className="flex items-start space-x-4 p-5 bg-white/80 rounded-2xl border border-gray-100"
                    >
                      <div
                        className="p-2 rounded-xl flex-shrink-0"
                        style={{  color: insight.color }}
                      >
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Total Entries */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 rounded-2xl">
                    <EmojiEmotionsIcon style={{ color: '#55AD9B', fontSize: 40 }} />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-2" style={{ color: '#272829' }}>
                  {statistics.totalLogs}
                </div>
                <div className="text-base text-gray-500 mb-2">Total Entries</div>
                {previousDayStats && (
                  <div className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-xl">
                    Yesterday: {previousDayStats.totalLogs}
                  </div>
                )}
              </motion.div>

              {/* Prominent Valence */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center"
              >
                <div className="flex items-center justify-center mb-6">
                  <div
                    className="p-4 rounded-2xl"
                  >
                    {statistics.mostProminentValence === 'positive' ? (
                      <SentimentSatisfiedIcon style={{ color: '#4CAF50', fontSize: 40 }} />
                    ) : (
                      <SentimentDissatisfiedIcon style={{ color: '#FF9800', fontSize: 40 }} />
                    )}
                  </div>
                </div>
                <div className="text-2xl font-bold mb-2" style={{
                  color: statistics.mostProminentValence === 'positive' ? '#4CAF50' : '#FF9800'
                }}>
                  {formatText(statistics.mostProminentValence)}
                </div>
                <div className="flex justify-between text-base mb-2 w-full px-4">
                  <span className="text-green-600 font-medium">
                    Positive: {statistics.valenceCounts.positive}
                  </span>
                  <span className="text-orange-500 font-medium">
                    Negative: {statistics.valenceCounts.negative}
                  </span>
                </div>
                {previousDayStats && (
                  <div className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-xl">
                    Yesterday: {formatText(previousDayStats.mostProminentValence)}
                  </div>
                )}
              </motion.div>

              {/* Average Intensity */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow flex flex-col items-center"
              >
                <div className="flex items-center justify-center mb-6">
                  <div className="p-4 rounded-2xl">
                    <TrendingUpIcon style={{ color: '#55AD9B', fontSize: 40 }} />
                  </div>
                </div>
                <div className="text-4xl font-bold mb-2" style={{ color: '#272829' }}>
                  {statistics.averageIntensity?.toFixed(1) || '0.0'}
                </div>
                <div className="text-base text-gray-500 mb-2">Avg Intensity</div>
                <div className="flex space-x-2 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <div
                      key={i}
                      className="h-3 w-8 rounded-full transition-colors"
                      style={{
                        backgroundColor: i < Math.round(statistics.averageIntensity || 0) ? '#55AD9B' : '#E5E7EB'
                      }}
                    />
                  ))}
                </div>
                {previousDayStats && (
                  <div className="text-xs text-gray-400 bg-gray-50 px-3 py-2 rounded-xl">
                    Yesterday: {previousDayStats.averageIntensity?.toFixed(1) || '0.0'}
                  </div>
                )}
              </motion.div>
            </div>

            {/* Top Emotions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 rounded-xl">
                  <EmojiEmotionsIcon style={{ color: '#55AD9B', fontSize: 24 }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#272829' }}>
                  Most Frequent Emotions
                </h2>
              </div>

              {getTopEmotions().length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  {getTopEmotions().map((item, index) => (
                    <motion.div
                      key={item.emotion}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.6 + index * 0.1 }}
                      className="text-center p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow"
                      style={{
                        background: index === 0
                          ? 'linear-gradient(135deg, #e0f7fa 0%, #e8f5e9 100%)'
                          : '#FAFAFA'
                      }}
                    >
                      <div className="flex justify-center mb-4">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.emotion}
                            style={{ width: 60, height: 60, objectFit: 'contain' }}
                            className="mx-auto"
                          />
                        ) : (
                          <div className="text-5xl mb-4">😐</div>
                        )}
                      </div>
                      <div className="text-xl font-semibold mb-2" style={{ color: '#272829' }}>
                        {formatText(item.emotion)}
                      </div>
                      <div className="text-lg font-bold mb-3" style={{ color: '#55AD9B' }}>
                        {item.count} time{item.count !== 1 ? 's' : ''}
                      </div>
                      {index === 0 && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white" style={{ backgroundColor: '#55AD9B' }}>
                          Most Frequent
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="text-4xl mb-4 opacity-50">😐</div>
                  <p className="text-gray-500">No emotion data available</p>
                </div>
              )}
            </motion.div>

            {/* Time Segment Analysis */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              className="bg-white rounded-3xl p-10 shadow-sm border border-gray-100"
            >
              <div className="flex items-center space-x-3 mb-8">
                <div className="p-2 rounded-xl">
                  <AccessTimeIcon style={{ color: '#55AD9B', fontSize: 24 }} />
                </div>
                <h2 className="text-xl font-bold" style={{ color: '#272829' }}>
                  Mood by Time of Day
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {segmentOrder.map((segment, index) => {
                  const moodData = statistics.timeSegmentMoods?.[segment];
                  return (
                    <motion.div
                      key={segment}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.8 + index * 0.1 }}
                      className="p-8 rounded-2xl border border-gray-100 hover:shadow-lg transition-shadow bg-[#f8fafc]"
                    >
                      <div className="flex items-center justify-between mb-6">
                        <div className="p-2 rounded-xl bg-white">
                          {timeSegmentIcons[segment]}
                        </div>
                        <div className="text-right">
                          <div className="text-base font-medium" style={{ color: '#272829' }}>
                            {timeSegmentLabels[segment].split(' (')[0]}
                          </div>
                          <div className="text-xs text-gray-500">
                            {timeSegmentLabels[segment].match(/\(([^)]+)\)/)?.[1]}
                          </div>
                        </div>
                      </div>

                      {moodData ? (
                        <div className="text-center">
                          <div className="flex justify-center mb-4">
                            {moodData.emotion && emotionImages[moodData.emotion] ? (
                              <img
                                src={emotionImages[moodData.emotion]}
                                alt={moodData.emotion}
                                style={{ width: 48, height: 48, objectFit: 'contain' }}
                                className="mx-auto"
                              />
                            ) : (
                              <div className="text-4xl mb-4">😐</div>
                            )}
                          </div>
                          <div className="text-lg font-semibold mb-2" style={{ color: '#272829' }}>
                            {formatText(moodData.emotion)}
                          </div>
                          <div className="text-sm text-gray-600 mb-4">
                            {moodData.count} of {moodData.totalEntries} entries
                          </div>
                          <div className="flex justify-center space-x-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="w-2 h-2 rounded-full"
                                style={{
                                  backgroundColor: i < Math.round(moodData.averageIntensity) ? '#55AD9B' : '#E5E7EB'
                                }}
                              />
                            ))}
                          </div>
                          <div className="text-xs text-gray-500">
                            Intensity: {moodData.averageIntensity}/5
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-3xl mb-3 opacity-30">😴</div>
                          <div className="text-sm text-gray-400">No entries</div>
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