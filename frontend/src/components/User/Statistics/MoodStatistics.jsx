import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Doughnut, Bar } from 'react-chartjs-2';
import axios from 'axios';
import moment from 'moment';
import BottomNav from '../../BottomNav';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CategoryIcon from '@mui/icons-material/Category';

const MoodStatistics = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [navValue, setNavValue] = useState('statistics');
  const [activityData, setActivityData] = useState([]);
  const [categoryBreakdown, setCategoryBreakdown] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [totalEntries, setTotalEntries] = useState(0);

  const { emotion, moodType, period } = location.state || {
    emotion: 'happy',
    moodType: 'after',
    period: 'monthly'
  };

  // Emotion colors (same as Statistics.jsx)
  const emotionColors = {
    'calm': '#87CEEB',
    'relaxed': '#98D8C8',
    'pleased': '#DDA0DD',
    'happy': '#FFD700',
    'excited': '#FF69B4',
    'bored': '#A9A9A9',
    'sad': '#4682B4',
    'disappointed': '#CD853F',
    'angry': '#DC143C',
    'tense': '#8B008B'
  };

  const emotionEmojis = {
    'calm': '😌',
    'relaxed': '😊',
    'pleased': '🙂',
    'happy': '😄',
    'excited': '🤩',
    'bored': '😑',
    'sad': '😢',
    'disappointed': '😞',
    'angry': '😠',
    'tense': '😰'
  };

  const capitalizeText = (text) => {
    return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  useEffect(() => {
    const fetchMoodActivityData = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/statistics/mood-activities`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            },
            params: {
              emotion: emotion,
              moodType: moodType,
              period: period
            }
          }
        );

        setActivityData(response.data.activities || []);
        setCategoryBreakdown(response.data.categoryBreakdown || []);
        setTotalEntries(response.data.totalEntries || 0);
        setStats(response.data.stats || null);
      } catch (error) {
        console.error('Error fetching mood activity data:', error);
        setActivityData([]);
        setCategoryBreakdown([]);
        setTotalEntries(0);
        setStats(null);
      } finally {
        setLoading(false);
      }
    };

    fetchMoodActivityData();
  }, [emotion, moodType, period]);

  const chartData = {
    labels: activityData.map(item => {
      // Clean up activity names for display
      let displayName = item.activity;
      if (displayName.includes(':')) {
        displayName = displayName.split(':')[1].trim();
      }
      return capitalizeText(displayName);
    }),
    datasets: [
      {
        data: activityData.map(item => item.percentage),
        backgroundColor: activityData.map((_, index) => {
          const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#E74C3C', '#C9CBCF'];
          return colors[index % colors.length];
        }),
        borderColor: '#fff',
        borderWidth: 2
      }
    ]
  };

  const barChartData = {
    labels: activityData.map(item => {
      // Clean up activity names for display
      let displayName = item.activity;
      if (displayName.includes(':')) {
        displayName = displayName.split(':')[1].trim();
      }
      return capitalizeText(displayName);
    }),
    datasets: [
      {
        label: 'Percentage',
        data: activityData.map(item => item.percentage),
        backgroundColor: emotionColors[emotion] || '#55AD9B',
        borderColor: emotionColors[emotion] || '#55AD9B',
        borderWidth: 1,
        borderRadius: 8
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        borderColor: emotionColors[emotion] || '#55AD9B',
        borderWidth: 1,
        cornerRadius: 12,
        callbacks: {
          label: function (context) {
            const fullActivity = activityData[context.dataIndex].activity;
            return `${fullActivity}: ${context.raw}% (${activityData[context.dataIndex].count} entries)`;
          }
        }
      }
    }
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        borderColor: emotionColors[emotion] || '#55AD9B',
        borderWidth: 1,
        cornerRadius: 12,
        callbacks: {
          label: function (context) {
            const fullActivity = activityData[context.dataIndex].activity;
            return `${fullActivity}: ${context.raw}% (${activityData[context.dataIndex].count} entries)`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: activityData.length > 0 ? Math.max(...activityData.map(item => item.percentage)) + 10 : 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#55AD9B' }}>
        <div className="text-white text-xl">Loading mood statistics...</div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pb-20"
      style={{ backgroundColor: '#55AD9B' }}
    >
      <div className="max-w-4xl mx-auto pt-6 px-4">
        {/* Header */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={() => navigate('/statistics')}
                className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ArrowBackIcon className="mr-2" />
                Back to Statistics
              </button>
            </div>

            <div className="flex items-center space-x-4 mb-6">
              <div 
                className="w-16 h-16 rounded-full flex items-center justify-center text-3xl"
                style={{ backgroundColor: `${emotionColors[emotion]}20`, border: `3px solid ${emotionColors[emotion]}` }}
              >
                {emotionEmojis[emotion] || '😐'}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  {capitalizeText(emotion)} Activities
                </h1>
                <p className="text-gray-600">
                  Activities that contributed to {emotion} mood ({moodType} activity - {period} view)
                </p>
              </div>
            </div>

            {/* Enhanced Summary Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <div className="text-2xl font-bold" style={{ color: emotionColors[emotion] || '#55AD9B' }}>
                  {totalEntries}
                </div>
                <div className="text-sm text-gray-600">Total {capitalizeText(emotion)} Entries</div>
                <div className="text-xs text-gray-500 mt-1">
                  {moodType === 'before' ? 'Before Activity' : 'After Activity'}
                </div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <div className="text-2xl font-bold" style={{ color: emotionColors[emotion] || '#55AD9B' }}>
                  {stats?.uniqueActivities || activityData.length}
                </div>
                <div className="text-sm text-gray-600">Different Activities</div>
                <div className="text-xs text-gray-500 mt-1">Contributing to {emotion}</div>
              </div>
              <div className="text-center p-4 bg-gray-50 rounded-2xl">
                <div className="text-lg font-bold" style={{ color: emotionColors[emotion] || '#55AD9B' }}>
                  {stats?.topActivity ? 
                    capitalizeText(stats.topActivity.includes(':') ? stats.topActivity.split(':').pop().trim() : stats.topActivity) : 
                    (activityData[0]?.activity ? 
                      capitalizeText(activityData[0].activity.includes(':') ? activityData[0].activity.split(':').pop().trim() : activityData[0].activity) : 
                      'N/A'
                    )
                  }
                </div>
                <div className="text-sm text-gray-600">Top Contributing Activity</div>
                <div className="text-xs text-gray-500 mt-1">
                  {stats?.topActivityPercentage || activityData[0]?.percentage || 0}% of entries
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Category Breakdown Section */}
        {categoryBreakdown.length > 0 && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
          >
            <div className="p-8">
              <div className="flex items-center mb-6">
                <div className="p-3 rounded-2xl mr-3" style={{ backgroundColor: `${emotionColors[emotion]}20` }}>
                  <CategoryIcon style={{ color: emotionColors[emotion] || '#55AD9B', fontSize: 28 }} />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-800">Category Distribution</h3>
                  <p className="text-gray-600">Breakdown by activity categories</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {categoryBreakdown.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="text-center p-4 bg-gray-50 rounded-2xl hover:shadow-md transition-all duration-200"
                  >
                    <div className="text-2xl font-bold mb-1" style={{ color: emotionColors[emotion] || '#55AD9B' }}>
                      {item.percentage}%
                    </div>
                    <div className="font-semibold text-gray-800">{item.category}</div>
                    <div className="text-sm text-gray-600">{item.count} entries</div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Charts Section */}
        {activityData.length > 0 ? (
          <>
            {/* Doughnut Chart */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-2xl mr-3" style={{ backgroundColor: `${emotionColors[emotion]}20` }}>
                    <BarChartIcon style={{ color: emotionColors[emotion] || '#55AD9B', fontSize: 28 }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Activity Distribution</h3>
                    <p className="text-gray-600">Percentage breakdown of activities</p>
                  </div>
                </div>

                <div className="h-80 w-full flex justify-center">
                  <div className="w-80">
                    <Doughnut data={chartData} options={chartOptions} />
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Bar Chart */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
            >
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <div className="p-3 rounded-2xl mr-3" style={{ backgroundColor: `${emotionColors[emotion]}20` }}>
                    <TrendingUpIcon style={{ color: emotionColors[emotion] || '#55AD9B', fontSize: 28 }} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-800">Activity Comparison</h3>
                    <p className="text-gray-600">Compare contribution percentages</p>
                  </div>
                </div>

                <div className="h-80 w-full">
                  <Bar data={barChartData} options={barChartOptions} />
                </div>
              </div>
            </motion.div>

            {/* Activity List */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
            >
              <div className="p-8">
                <h3 className="text-xl font-semibold text-gray-800 mb-6">Detailed Breakdown</h3>
                <div className="space-y-4">
                  {activityData.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ x: -20, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl hover:shadow-md transition-all duration-200"
                    >
                      <div className="flex items-center space-x-4">
                        <div 
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: chartData.datasets[0].backgroundColor[index] }}
                        />
                        <div>
                          <p className="font-semibold text-gray-800">{item.activity}</p>
                          <p className="text-sm text-gray-600">{item.count} entries</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold" style={{ color: emotionColors[emotion] || '#55AD9B' }}>
                          {item.percentage}%
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </>
        ) : (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
          >
            <div className="p-8 text-center">
              <div className="text-6xl mb-4 opacity-50">{emotionEmojis[emotion] || '😐'}</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">No Data Available</h3>
              <p className="text-gray-600">
                No activities found for {emotion} mood {moodType === 'before' ? 'before' : 'after'} activity in the selected {period} period.
              </p>
              <div className="mt-4 text-sm text-gray-500">
                Try selecting a different time period or check if you have logged activities for this emotion.
              </div>
            </div>
          </motion.div>
        )}
      </div>

      <BottomNav value={navValue} setValue={setNavValue} />
    </motion.div>
  );
};

export default MoodStatistics;