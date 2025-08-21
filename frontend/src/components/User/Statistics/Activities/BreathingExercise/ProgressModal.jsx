import React from 'react';
import { Modal, Box } from '@mui/material';
import { motion } from 'framer-motion';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const ProgressModal = ({ open, onClose, streak, totalSessions, techniques }) => {
  const savedProgress = JSON.parse(localStorage.getItem('breathingProgress') || '{}');
  const techniqueStats = savedProgress.techniques || {};

  const getStreakMessage = () => {
    if (streak === 0) return "Start your breathing journey today!";
    if (streak === 1) return "Great start! Keep it going!";
    if (streak < 7) return "Building a healthy habit!";
    if (streak < 30) return "You're on fire! 🔥";
    return "Breathing master! 🧘‍♀️";
  };

  const getAchievements = () => {
    const achievements = [];
    
    if (totalSessions >= 1) achievements.push({ title: "First Breath", desc: "Completed your first session", icon: "🌟" });
    if (totalSessions >= 10) achievements.push({ title: "Dedicated Breather", desc: "Completed 10 sessions", icon: "💪" });
    if (totalSessions >= 50) achievements.push({ title: "Breathing Expert", desc: "Completed 50 sessions", icon: "🏆" });
    if (streak >= 7) achievements.push({ title: "Week Warrior", desc: "7 day streak", icon: "📅" });
    if (streak >= 30) achievements.push({ title: "Monthly Master", desc: "30 day streak", icon: "🎯" });
    
    return achievements;
  };

  return (
    <Modal open={open} onClose={onClose}>
      <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 rounded-t-2xl text-white">
          <div className="flex items-center justify-center mb-4">
            <TrendingUpIcon style={{ fontSize: 48 }} />
          </div>
          <h2 className="text-3xl font-bold text-center">Your Progress</h2>
          <p className="text-center text-blue-100 mt-2">Track your breathing journey</p>
        </div>
        
        <div className="p-6 space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 gap-4">
            <motion.div 
              className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl text-center"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-3xl font-bold text-green-600 mb-2">{streak}</div>
              <div className="text-green-700 font-medium">Day Streak</div>
              <div className="text-sm text-green-600 mt-1">{getStreakMessage()}</div>
            </motion.div>
            
            <motion.div 
              className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl text-center"
              whileHover={{ scale: 1.02 }}
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">{totalSessions}</div>
              <div className="text-blue-700 font-medium">Total Sessions</div>
              <div className="text-sm text-blue-600 mt-1">Sessions completed</div>
            </motion.div>
          </div>
          
          {/* Technique Breakdown */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
              <AccessTimeIcon className="mr-2" />
              Technique Usage
            </h3>
            <div className="space-y-3">
              {techniques.map(technique => {
                const count = techniqueStats[technique.id] || 0;
                const percentage = totalSessions > 0 ? (count / totalSessions) * 100 : 0;
                
                return (
                  <div key={technique.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{technique.icon}</span>
                      <div>
                        <div className="font-medium text-gray-800">{technique.name}</div>
                        <div className="text-sm text-gray-600">{count} sessions</div>
                      </div>
                    </div>
                    <div className="flex items-center">
                      <div className="w-20 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="h-2 rounded-full transition-all duration-500"
                          style={{ 
                            width: `${percentage}%`,
                            backgroundColor: technique.color 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-600">{Math.round(percentage)}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Achievements */}
          <div>
            <h3 className="text-xl font-bold mb-4 text-gray-800 flex items-center">
              <EmojiEventsIcon className="mr-2" />
              Achievements
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getAchievements().map((achievement, index) => (
                <motion.div 
                  key={index}
                  className="flex items-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="text-3xl mr-3">{achievement.icon}</span>
                  <div>
                    <div className="font-bold text-orange-800">{achievement.title}</div>
                    <div className="text-sm text-orange-600">{achievement.desc}</div>
                  </div>
                  <CheckCircleIcon className="ml-auto text-green-500" />
                </motion.div>
              ))}
              
              {getAchievements().length === 0 && (
                <div className="col-span-2 text-center p-8 text-gray-500">
                  <EmojiEventsIcon style={{ fontSize: 48, opacity: 0.3 }} />
                  <p className="mt-2">Complete sessions to unlock achievements!</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <div className="p-6 border-t bg-gray-50 rounded-b-2xl">
          <button 
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-bold hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            Continue Training
          </button>
        </div>
      </Box>
    </Modal>
  );
};

export default ProgressModal;