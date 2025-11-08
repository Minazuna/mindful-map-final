import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import TimelineIcon from '@mui/icons-material/Timeline';

const Anova = () => {
  const navigate = useNavigate();

  const handleDailyAnovaClick = () => {
    navigate('/daily-anova');
  };

  const handleWeeklyAnovaClick = () => {
    navigate('/weekly-anova');
  };

  return (
    <motion.div
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.05 }}
      className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
    >
      <div className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="p-3 rounded-2xl" style={{ backgroundColor: '#E8F5E8' }}>
            <AssessmentIcon style={{ color: '#55AD9B', fontSize: 28 }} />
          </div>
          <div>
            <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>ANOVA Mood Analysis</h2>
            <p className="text-gray-600">Advanced statistical insights into activity impact</p>
          </div>
        </div>
        <p className="text-gray-700 mb-8 leading-relaxed">
          The ANOVA (Analysis of Variance) tool helps you understand which activities have the most significant impact on your mood. 
          It uses statistical analysis to compare mood changes across different activities, showing you where the biggest differences occur.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDailyAnovaClick}
            className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <CalendarViewDayIcon className="mr-3" style={{ fontSize: 24 }} />
            <div className="text-left">
              <div className="font-semibold">Daily ANOVA</div>
              <div className="text-sm opacity-90">Today's activity impact analysis</div>
            </div>
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleWeeklyAnovaClick}
            className="flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl"
          >
            <TimelineIcon className="mr-3" style={{ fontSize: 24 }} />
            <div className="text-left">
              <div className="font-semibold">Weekly ANOVA</div>
              <div className="text-sm opacity-90">Weekly patterns & trends analysis</div>
            </div>
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default Anova;