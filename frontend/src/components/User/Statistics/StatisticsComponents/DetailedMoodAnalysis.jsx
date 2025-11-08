import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import InsightsIcon from '@mui/icons-material/Insights';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import DateRangeIcon from '@mui/icons-material/DateRange';

const DetailedMoodAnalysis = () => {
  const navigate = useNavigate();

  const handleDailyStatisticsClick = () => {
    navigate('/daily-statistics');
  };

  const handleWeeklyStatisticsClick = () => {
    navigate('/weekly-statistics');
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.1 }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
    >
      <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-2xl" style={{ backgroundColor: '#E8F5E8' }}>
            <InsightsIcon style={{ color: '#55AD9B', fontSize: 28 }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>Detailed Mood Analysis</h2>
            <p className="text-gray-600">Get comprehensive insights into your emotional patterns</p>
          </div>
        </div>
        <p className="text-gray-700 mb-8 leading-relaxed">
          Explore in-depth statistics about your daily and weekly mood patterns. Discover trends, 
          compare time periods, and gain valuable insights into your emotional journey.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDailyStatisticsClick}
            className="flex items-center justify-center bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-800 py-4 px-6 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <CalendarViewDayIcon className="mr-3" style={{ color: '#55AD9B' }} />
            <div className="text-left">
              <div className="font-semibold">Daily Statistics</div>
              <div className="text-sm text-gray-600">Day-by-day mood insights</div>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleWeeklyStatisticsClick}
            className="flex items-center justify-center bg-white border-2 border-gray-200 hover:border-purple-300 text-gray-800 py-4 px-6 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md"
          >
            <DateRangeIcon className="mr-3" style={{ color: '#55AD9B' }} />
            <div className="text-left">
              <div className="font-semibold">Weekly Statistics</div>
              <div className="text-sm text-gray-600">Weekly patterns & trends</div>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default DetailedMoodAnalysis;