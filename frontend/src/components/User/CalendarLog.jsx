import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BottomNav from '../BottomNav';
import { IconButton, Tooltip, Modal, Box } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import EqualizerIcon from '@mui/icons-material/Equalizer';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import { motion } from 'framer-motion';

const CalendarLog = () => {
  const [moodLogs, setMoodLogs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [value, setValue] = useState('calendar');
  const navigate = useNavigate();
  
  // Streak state
  const [streakModalOpen, setStreakModalOpen] = useState(false);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [weeklyStreak, setWeeklyStreak] = useState(0);
  const [previousWeekStreak, setPreviousWeekStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [weeklyProgress, setWeeklyProgress] = useState([false, false, false, false, false, false, false]);
  const [monthlyCompletion, setMonthlyCompletion] = useState(0);

  useEffect(() => {
    const fetchMoodLogs = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/mood-log`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setMoodLogs(response.data);
        calculateStreaks(response.data);
      } catch (error) {
        console.error('Error fetching mood logs:', error);
      }
    };

    fetchMoodLogs();
  }, []);

  // Helper function to check if a specific date has a log
  const hasLogForDate = (date, logs) => {
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return logs.some(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === targetDate.getTime();
    });
  };

  // Calculate streaks from mood logs with improved logic
  const calculateStreaks = (logs) => {
    if (!logs.length) return;

    // Sort logs by date
    const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Get today's date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Check if today has a log
    const hasLoggedToday = hasLogForDate(today, logs);
    
    // Get the Monday of current week
    const startOfWeek = new Date(today);
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Calculate current streak
    let streak = 0;
    let currentDate = new Date(today);
    
    // If today doesn't have a log, start counting from yesterday
    if (!hasLoggedToday) {
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Count streak days going backwards
    while (true) {
      if (hasLogForDate(currentDate, logs)) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else {
        break;
      }
    }
    
    // Weekly progress - Monday to Sunday - ONLY show days with actual logs
    const weekProgress = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      
      // Only include days up to today (don't mark future days)
      const isPastOrToday = day <= today;
      const hasLog = hasLogForDate(day, logs);
      
      // Day is only completed if it has a log and is not a future day
      weekProgress.push(isPastOrToday && hasLog);
    }
    
    // Calculate longest streak
    let currentLongestStreak = 0;
    let tempStreak = 0;
    
    // Create an array of dates with entries
    const datesWithEntries = logs.map(log => {
      const logDate = new Date(log.date);
      return logDate.toISOString().split('T')[0];
    }).sort();
    
    // Remove duplicates
    const uniqueDates = [...new Set(datesWithEntries)];
    
    for (let i = 0; i < uniqueDates.length; i++) {
      const currentDate = new Date(uniqueDates[i]);
      
      if (i === 0) {
        tempStreak = 1;
        continue;
      }
      
      const prevDate = new Date(uniqueDates[i-1]);
      const diffTime = Math.abs(currentDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 1) {
        tempStreak++;
      } else {
        if (tempStreak > currentLongestStreak) {
          currentLongestStreak = tempStreak;
        }
        tempStreak = 1;
      }
    }
    
    // Check if the last streak is the longest
    if (tempStreak > currentLongestStreak) {
      currentLongestStreak = tempStreak;
    }
    
    // Get end date of this week (Sunday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    
    // Previous week date range
    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);
    
    const endOfPrevWeek = new Date(endOfWeek);
    endOfPrevWeek.setDate(endOfPrevWeek.getDate() - 7);
    
    // Count unique days with logs for current and previous weeks
    const uniqueDaysCurrentWeek = logs.filter(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate >= startOfWeek && logDate <= endOfWeek && logDate <= today;
    }).reduce((acc, log) => {
      acc.add(new Date(log.date).toDateString());
      return acc;
    }, new Set()).size;
    
    const uniqueDaysPrevWeek = logs.filter(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate >= startOfPrevWeek && logDate <= endOfPrevWeek;
    }).reduce((acc, log) => {
      acc.add(new Date(log.date).toDateString());
      return acc;
    }, new Set()).size;
    
    // Calculate monthly completion percentage
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const daysPassedInMonth = Math.min(new Date().getDate(), daysInMonth);
    
    const logsThisMonth = logs.filter(log => {
      const logDate = new Date(log.date);
      return (
        logDate.getFullYear() === currentYear && 
        logDate.getMonth() === currentMonth
      );
    });
    
    const uniqueDaysThisMonth = new Set(
      logsThisMonth.map(log => new Date(log.date).getDate())
    ).size;
    
    const monthlyCompletionRate = Math.round(
      (uniqueDaysThisMonth / daysPassedInMonth) * 100
    );
    
    // Update state with all calculated streak info
    setCurrentStreak(streak);
    setWeeklyStreak(uniqueDaysCurrentWeek);
    setPreviousWeekStreak(uniqueDaysPrevWeek);
    setLongestStreak(currentLongestStreak);
    setWeeklyProgress(weekProgress);
    setMonthlyCompletion(monthlyCompletionRate);
  };

  const handleOpenStreakModal = () => {
    // Recalculate streaks when opening modal to ensure fresh data
    calculateStreaks(moodLogs);
    setStreakModalOpen(true);
  };

  const handleCloseStreakModal = () => {
    setStreakModalOpen(false);
  };

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  
  // Get the Monday of current week
  const currentWeekStart = new Date(today);
  const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Move back to Monday
  currentWeekStart.setDate(today.getDate() + offset);
  currentWeekStart.setHours(0, 0, 0, 0); 

  const currentWeekEnd = new Date(currentWeekStart);
  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
  currentWeekEnd.setHours(23, 59, 59, 999);

  // Get mood for a specific date - ONLY return actual logs or plus for days we haven't logged yet
  const getMoodForDate = (day) => {
    // Check if there's already a log for this date
    const log = moodLogs.find(log => {
      const logDate = new Date(log.date);
      return logDate.getFullYear() === currentYear && 
             logDate.getMonth() === currentMonth && 
             logDate.getDate() === day;
    });

    // If we have a log, return the mood
    if (log) return log.mood;

    // Check if this is a day where we should show the + icon
    const dateToCheck = new Date(currentYear, currentMonth, day);
    dateToCheck.setHours(0, 0, 0, 0);
    
    // Only show plus if:
    // 1. It's today or a past date (not future)
    // 2. It's in the current week
    // 3. We DON'T already have a log for it
    const isPastOrToday = dateToCheck <= today;
    const isInCurrentWeek = dateToCheck >= currentWeekStart && dateToCheck <= currentWeekEnd;
    
    if (isPastOrToday && isInCurrentWeek) {
      return 'plus';
    }

    return 'gray';
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  // Ordered from Monday to Sunday to match the weekProgress array
  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const handlePlusClick = (day) => {
    const formattedMonth = (currentMonth + 1).toString().padStart(2, '0');
    const formattedDay = day.toString().padStart(2, '0');
    navigate(`/log-mood?date=${currentYear}-${formattedMonth}-${formattedDay}`);
  };

  return (
    <div className="bg-[#b4ddc8] min-h-screen flex flex-col justify-between">
      <div>
        <nav className="bg-white py-3 shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-2">
              {/* Centered month header */}
              <div className="flex-1"></div> {/* Spacer */}
              <div className="flex items-center justify-center flex-1">
                <ChevronLeftIcon className="cursor-pointer text-[#6fba94]" onClick={handlePrevMonth} />
                <h1 className="text-xl font-bold mx-2">{months[currentMonth]} {currentYear}</h1>
                <ChevronRightIcon className="cursor-pointer text-[#6fba94]" onClick={handleNextMonth} />
              </div>
              
              {/* Streak icon with spacer to maintain centering */}
              <div className="flex-1 flex justify-end">
                <Tooltip title="View Streak Stats" arrow>
                  <IconButton 
                    onClick={handleOpenStreakModal} 
                    className="relative"
                    size="medium"
                  >
                    <div className="w-14 h-14 relative">
                      <img 
                        src="/images/streak.gif" 
                        alt="Streak" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {currentStreak > 0 && (
                      <div className="absolute top-3 right-2 bg-[#6fba94] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold">
                        {currentStreak}
                      </div>
                    )}
                  </IconButton>
                </Tooltip>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="bg-[#f3f9f6] rounded-full px-3 py-1 flex items-center">
                <span className="text-xs text-gray-500 mr-2">This month:</span>
                <div className="w-20 bg-gray-200 h-2 rounded-full">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6fba94] to-[#4e8067] rounded-full" 
                    style={{ width: `${monthlyCompletion}%` }}
                  ></div>
                </div>
                <span className="text-xs font-medium text-[#6fba94] ml-2">{monthlyCompletion}%</span>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="grid grid-cols-7 gap-2 mt-8 max-w-screen-md mx-auto bg-white rounded-lg shadow p-4 mb-20">
          {/* Sunday first for calendar display */}
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
            <div key={i} className="text-center font-bold text-gray-500 mb-4">{day}</div>
          ))}
          {[...Array(firstDay)].map((_, i) => <div key={i}></div>)}
          {[...Array(daysInMonth)].map((_, i) => {
            const day = i + 1;
            const mood = getMoodForDate(day);
            const isToday = day === today.getDate() && 
                           currentMonth === today.getMonth() && 
                           currentYear === today.getFullYear();

            return (
              <div key={day} className="flex flex-col items-center mb-3"> 
                <div
                  className={`flex items-center justify-center w-12 h-12 md:w-12 md:h-12 rounded-full shadow 
                    ${isToday ? 'border-2 border-[#6fba94]' : ''}
                    ${mood === 'plus' ? 'bg-gray-100' : mood === 'gray' ? 'bg-gray-100' : 'bg-white'}`}
                >
                  {mood === 'plus' ? (
                    <button
                      className={`text-2xl rounded-full ${isToday ? 'text-[#6fba94]' : 'text-gray-400'} 
                        ${isToday ? 'bg-transparent' : 'bg-gray-100'}`}
                      style={{ padding: 0, border: 'none' }} 
                      onClick={() => handlePlusClick(day)}
                    >
                      +
                    </button>
                  ) : mood === 'gray' ? null : (
                    <img
                      src={`/images/${mood.toLowerCase()}.gif`}
                      alt={mood}
                      className="w-16 h-16 object-cover bg-transparent rounded-full"
                    />
                  )}
                </div>
                <span 
                  className={`mt-1 text-sm md:text-base font-semibold ${isToday ? 'text-[#6fba94]' : ''}`}
                >
                  {day}
                </span> 
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Streak Modal */}
      <Modal
        open={streakModalOpen}
        onClose={handleCloseStreakModal}
        aria-labelledby="streak-modal-title"
      >
        <Box 
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl"
          sx={{ width: '90%', maxWidth: '500px', maxHeight: '90vh', overflow: 'auto' }}
        >
          {/* Header with close button */}
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-2xl font-bold flex items-center text-gray-800">
              <img 
                src="/images/streak.gif" 
                alt="Streak" 
                className="w-10 h-10 mr-2 object-cover"
              />
              Your Streak Stats
            </h2>
            <IconButton onClick={handleCloseStreakModal} size="small">
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>
          
          {/* Current Streak */}
          <div className="mb-6">
            <div className="flex justify-between items-baseline mb-1">
              <h3 className="text-lg font-medium text-gray-700">Current Streak</h3>
              <div className="flex items-baseline">
                <span className="text-3xl font-bold text-[#FF8C00] mr-1">{currentStreak}</span>
                <span className="text-sm text-gray-500">days</span>
              </div>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (currentStreak / 7) * 100)}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-gradient-to-r from-[#FFD700] to-[#FF8C00]"
              />
            </div>
            <div className="mt-1 text-xs text-gray-500 italic text-right">
              {currentStreak === 0 ? "Start your streak today!" :
               currentStreak < 3 ? "Keep going!" :
               currentStreak < 7 ? "Great progress!" :
               "Impressive streak!"}
            </div>
          </div>
          
          {/* Weekly Progress - Monday to Sunday */}
          <div className="bg-[#f8f8f8] rounded-lg p-4 mb-6">
            <h3 className="text-base font-semibold mb-3 text-gray-700 flex items-center">
              <CalendarMonthIcon sx={{ fontSize: 20, mr: 1, color: '#6fba94' }} />
              This Week (Mon-Sun)
            </h3>
            <div className="grid grid-cols-7 gap-1 mb-3">
              {/* Monday to Sunday Labels */}
              {daysOfWeek.map((day, index) => (
                <div key={`label-${index}`} className="text-center text-xs font-medium text-gray-500">
                  {day[0]}
                </div>
              ))}
              {/* Progress indicators */}
              {weeklyProgress.map((completed, index) => (
                <motion.div
                  key={`day-${index}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={`aspect-square rounded-md flex items-center justify-center text-xs
                    ${completed 
                      ? 'bg-gradient-to-br from-[#6fba94] to-[#4e8067] text-white shadow-sm' 
                      : 'bg-gray-200 text-gray-400'}`}
                >
                  {completed ? '✓' : ''}
                </motion.div>
              ))}
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Days logged</span>
              <div className="flex items-center">
                <span className="text-lg font-bold text-[#6fba94]">{weeklyStreak}</span>
                <span className="text-sm text-gray-500 ml-1">/ 7</span>
              </div>
            </div>
          </div>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            <div className="bg-[#f3f9f6] p-3 rounded-lg">
              <div className="flex items-center mb-1">
                <EmojiEventsIcon sx={{ color: '#FFD700', fontSize: 20, mr: 1 }} />
                <h3 className="text-sm font-semibold text-gray-700">Longest Streak</h3>
              </div>
              <p className="text-xl font-bold text-gray-800">{longestStreak} <span className="text-sm font-normal text-gray-500">days</span></p>
            </div>
            
            <div className="bg-[#f3f9f6] p-3 rounded-lg">
              <div className="flex items-center mb-1">
                <EqualizerIcon sx={{ color: '#6fba94', fontSize: 20, mr: 1 }} />
                <h3 className="text-sm font-semibold text-gray-700">Last Week</h3>
              </div>
              <p className="text-xl font-bold text-gray-800">{previousWeekStreak} <span className="text-sm font-normal text-gray-500">/ 7 days</span></p>
            </div>
          </div>
          
          {/* Motivational Message */}
          <div className="bg-gradient-to-r from-[#e9f5ef] to-[#f0f9f5] p-4 rounded-lg text-center mb-4">
            <p className="text-sm text-gray-700">
              {currentStreak === 0 ? (
                "Log your mood today to start your streak!"
              ) : currentStreak < 3 ? (
                "You're building a great habit! Keep going each day."
              ) : currentStreak < 7 ? (
                "Amazing consistency! You're on your way to a full week."
              ) : (
                "Incredible dedication! Your consistency is impressive."
              )}
            </p>
          </div>
          
          {/* Close Button */}
          <div className="text-center">
            <button 
              className="bg-[#6fba94] hover:bg-[#5ea983] text-white font-medium py-2 px-6 rounded-full shadow-sm transition-colors duration-200"
              onClick={handleCloseStreakModal}
            >
              Continue Tracking
            </button>
          </div>
        </Box>
      </Modal>
      
      <BottomNav value={value} setValue={setValue} />
    </div>
  );
};

export default CalendarLog;