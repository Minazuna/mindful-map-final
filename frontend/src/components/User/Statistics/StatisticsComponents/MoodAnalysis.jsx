import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import { Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { emotionImages } from '../../../../../utils/moods';
import { useNavigate } from 'react-router-dom';

ChartJS.register(ArcElement, Tooltip, Legend, ChartDataLabels);

const emotionColors = {
  'calm': '#8FABD4',
  'relaxed': '#59AC77',
  'pleased': '#FF714B',
  'happy': '#f7b40bff',
  'excited': '#F564A9',
  'bored': '#A9A9A9',
  'sad': '#092b9cff',
  'disappointed': '#4e4d4dff',
  'angry': '#cc062dff',
  'tense': '#a854a8ff'
};

const capitalizeText = (text) => {
  return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
};

const MoodAnalysis = ({
  moodLogs,
  moodType,
  moodPeriod,
  setMoodType,
  setMoodPeriod,
  moodChartRef,
}) => {
  const [showSummary, setShowSummary] = useState(false);
  const navigate = useNavigate();

  // Filter mood logs based on selected period
  const filteredMoodLogs = useMemo(() => {
    const now = new Date();
    return moodLogs.filter(log => {
      const logDate = new Date(log.date);
      if (moodPeriod === 'daily') {
        return (
          logDate.getDate() === now.getDate() &&
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear()
        );
      } else if (moodPeriod === 'weekly') {
        // Week starts on Monday
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1;
        const startOfWeek = new Date(now);
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);
        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(startOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);
        return logDate >= startOfWeek && logDate <= endOfWeek;
      } else {
        // monthly
        return (
          logDate.getMonth() === now.getMonth() &&
          logDate.getFullYear() === now.getFullYear()
        );
      }
    });
  }, [moodLogs, moodPeriod]);

  // Calculate mood counts based on logs, type, and period
  const currentMoodCounts = useMemo(() => {
    const countMap = {};
    filteredMoodLogs.forEach(log => {
      const emotion = moodType === 'before' ? log.beforeEmotion : log.afterEmotion;
      if (emotion) {
        if (!countMap[emotion]) countMap[emotion] = 0;
        countMap[emotion]++;
      }
    });
    return countMap;
  }, [filteredMoodLogs, moodType]);

  const sortedMoods = useMemo(() =>
    Object.keys(currentMoodCounts).sort((a, b) => currentMoodCounts[b] - currentMoodCounts[a]),
    [currentMoodCounts]
  );

  // Find least mood
  const leastMood = useMemo(() => {
    if (sortedMoods.length === 0) return null;
    let minCount = currentMoodCounts[sortedMoods[0]];
    let minMood = sortedMoods[0];
    sortedMoods.forEach(mood => {
      if (currentMoodCounts[mood] < minCount) {
        minCount = currentMoodCounts[mood];
        minMood = mood;
      }
    });
    return minMood;
  }, [sortedMoods, currentMoodCounts]);

  const chartData = useMemo(() => ({
    labels: Object.keys(currentMoodCounts),
    datasets: [
      {
        data: Object.values(currentMoodCounts),
        backgroundColor: Object.keys(currentMoodCounts).map(emotion => emotionColors[emotion.toLowerCase()] || '#95A5A6'),
        hoverBackgroundColor: Object.keys(currentMoodCounts).map(emotion => emotionColors[emotion.toLowerCase()] || '#95A5A6'),
        borderWidth: 3,
        borderColor: '#fff',
        hoverBorderColor: '#fff'
      }
    ]
  }), [currentMoodCounts]);

  const chartOptions = {
    cutout: '60%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        borderColor: '#55AD9B',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const label = capitalizeText(context.label || '');
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} entries (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#f6f4f4ff',
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
          const percentage = ((value / total) * 100).toFixed(0);
          return `${percentage}%`;
        }
      }
    }
  };

  // Summary label for period
  const periodLabel = moodPeriod === 'daily'
    ? 'today'
    : moodPeriod === 'weekly'
      ? 'this week'
      : 'this month';

  // Handle click to navigate to ActivitiesStatistics
  const handleMoodClick = (emotion) => {
    navigate('/statistics/activities', {
      state: {
        emotion,
        moodType,
        moodPeriod,
      }
    });
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2 }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
    >
      <div className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <div className="p-3 rounded-2xl">
              <SentimentSatisfiedIcon style={{ color: '#55AD9B', fontSize: 28 }} />
            </div>
            <div>
              <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>Mood Analysis</h2>
              <p className="text-gray-600">Track your emotions before and after activities</p>
            </div>
          </div>
        </div>
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Before/After Toggle */}
          <div className="flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
            <button
              onClick={() => setMoodType('before')}
              className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                moodType === 'before'
                  ? 'bg-[#55AD9B] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Before Activity
            </button>
            <button
              onClick={() => setMoodType('after')}
              className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                moodType === 'after'
                  ? 'bg-[#55AD9B] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              After Activity
            </button>
          </div>
          {/* Period Toggle */}
          <div className="flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
            <button
              onClick={() => setMoodPeriod('daily')}
              className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                moodPeriod === 'daily'
                  ? 'bg-[#55AD9B] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Daily
            </button>
            <button
              onClick={() => setMoodPeriod('weekly')}
              className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                moodPeriod === 'weekly'
                  ? 'bg-[#55AD9B] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Weekly
            </button>
            <button
              onClick={() => setMoodPeriod('monthly')}
              className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                moodPeriod === 'monthly'
                  ? 'bg-[#55AD9B] text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Monthly
            </button>
          </div>
        </div>
        <div ref={moodChartRef} className="flex flex-col items-center">
          <div className="relative w-80 h-80 my-6">
            {Object.keys(currentMoodCounts).length > 0 ? (
              <Doughnut data={chartData} options={chartOptions} />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-full">
                <div className="text-center">
                  <div className="text-4xl mb-2 opacity-50">😐</div>
                  <p className="text-gray-500 italic">No mood data available</p>
                </div>
              </div>
            )}
          </div>
          {/* Summary Stats */}
          {Object.keys(currentMoodCounts).length > 0 && (
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                  {Object.values(currentMoodCounts).reduce((a, b) => a + b, 0)}
                </div>
                <div className="text-sm text-gray-600">Total Entries</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                  {sortedMoods[0] ? capitalizeText(sortedMoods[0]) : 'N/A'}
                </div>
                <div className="text-sm text-gray-600">Most Frequent</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                  {Object.keys(currentMoodCounts).length}
                </div>
                <div className="text-sm text-gray-600">Unique Emotions</div>
              </div>
            </div>
          )}
          {/* Centered Mood Legend with Color Coding - Now Clickable */}
          <div className="w-full flex justify-center mt-6">
            <div className="flex flex-wrap justify-center gap-4 max-w-5xl">
              {sortedMoods.map((emotion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex flex-col items-center p-5 rounded-2xl border-2 hover:shadow-md transition-all duration-200 transform hover:scale-105 cursor-pointer"
                  style={{
                    backgroundColor: emotionColors[emotion.toLowerCase()] || '#95A5A6',
                    borderColor: emotionColors[emotion.toLowerCase()] || '#95A5A6',
                    minWidth: '140px',
                    width: '140px'
                  }}
                  onClick={() => handleMoodClick(emotion)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <div className="mb-3">
                    <img
                      src={emotionImages[emotion.toLowerCase()]}
                      alt={emotion}
                      style={{ width: '48px', height: '48px', objectFit: 'contain' }}
                    />
                  </div>
                  <p className="font-semibold capitalize text-sm text-center" style={{ color: '#e9eaeaff' }}>
                    {capitalizeText(emotion)}
                  </p>
                  <p className="font-bold text-lg mt-1" style={{ color: '#e9eaeaff' }}>
                    {currentMoodCounts[emotion]}
                  </p>
                  <p className="text-xs text-gray-100 mt-2 text-center">Click for details</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MoodAnalysis;