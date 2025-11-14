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
import InfoIcon from '@mui/icons-material/Info';
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

  // Emotion mapping
  const emotionMap = {
    // Negative emotions
    bored: { emoji: '😑', label: 'Bored' },
    sad: { emoji: '😢', label: 'Sad' },
    disappointed: { emoji: '😞', label: 'Disappointed' },
    angry: { emoji: '😠', label: 'Angry' },
    tense: { emoji: '😰', label: 'Tense' },
    // Positive emotions
    calm: { emoji: '😌', label: 'Calm' },
    relaxed: { emoji: '😊', label: 'Relaxed' },
    pleased: { emoji: '🙂', label: 'Pleased' },
    happy: { emoji: '😄', label: 'Happy' },
    excited: { emoji: '🤩', label: 'Excited' }
  };

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

  // Get mood for a specific date - return most frequent mood or last inputted mood
  const getMoodForDate = (day) => {
    const dateToCheck = new Date(currentYear, currentMonth, day);
    dateToCheck.setHours(0, 0, 0, 0);
    
    // Get all logs for this specific date
    const logsForDate = moodLogs.filter(log => {
      const logDate = new Date(log.date);
      logDate.setHours(0, 0, 0, 0);
      return logDate.getTime() === dateToCheck.getTime();
    });

    if (logsForDate.length === 0) {
      // Check if this is a day where we should show the + icon
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      // Get the Monday of current week
      const currentWeekStart = new Date(today);
      const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
      const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Move back to Monday
      currentWeekStart.setDate(today.getDate() + offset);
      currentWeekStart.setHours(0, 0, 0, 0);

      const currentWeekEnd = new Date(currentWeekStart);
      currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
      currentWeekEnd.setHours(23, 59, 59, 999);
      
      // Only show plus if:
      // 1. It's today or a past date (not future)
      // 2. It's in the current week
      const isPastOrToday = dateToCheck <= today;
      const isInCurrentWeek = dateToCheck >= currentWeekStart && dateToCheck <= currentWeekEnd;
      
      if (isPastOrToday && isInCurrentWeek) {
        return { type: 'plus' };
      }
      
      return { type: 'empty' };
    }

    // Collect all emotions from all logs for this date (both before and after emotions)
    const allEmotions = [];
    logsForDate.forEach(log => {
      // Add afterEmotion (always present and more recent)
      if (log.afterEmotion) {
        allEmotions.push({
          emotion: log.afterEmotion,
          type: 'after',
          date: new Date(log.date),
          logId: log._id
        });
      }
      
      // Add beforeEmotion if it exists (not "can't remember")
      if (log.beforeEmotion && log.beforeValence !== "can't remember") {
        allEmotions.push({
          emotion: log.beforeEmotion,
          type: 'before',
          date: new Date(log.date),
          logId: log._id
        });
      }
    });

    if (allEmotions.length === 0) {
      return { type: 'empty' };
    }

    // Count frequency of each emotion and track latest occurrence
    const emotionCounts = {};
    const emotionLatestOccurrence = {};
    
    allEmotions.forEach(emotionData => {
      const emotion = emotionData.emotion;
      emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      
      // Track the latest occurrence of each emotion
      if (!emotionLatestOccurrence[emotion] || emotionData.date > emotionLatestOccurrence[emotion]) {
        emotionLatestOccurrence[emotion] = emotionData.date;
      }
    });

    // Find the maximum frequency
    const maxCount = Math.max(...Object.values(emotionCounts));
    
    // Get all emotions that have the maximum frequency
    const emotionsWithMaxCount = Object.entries(emotionCounts)
      .filter(([emotion, count]) => count === maxCount)
      .map(([emotion, count]) => emotion);

    // If there's only one emotion with max count and it appears more than once, it's clearly frequent
    if (emotionsWithMaxCount.length === 1 && maxCount > 1) {
      const emotionType = emotionMap[emotionsWithMaxCount[0]]?.type || 'neutral';
      return {
        type: 'frequent',
        emotion: emotionsWithMaxCount[0],
        emotionType: emotionType,
        isFrequent: true,
        count: logsForDate.length
      };
    }

    // If multiple emotions have the same max count and that count is > 1 (tied for most frequent)
    if (emotionsWithMaxCount.length > 1 && maxCount > 1) {
      // Find the emotion with the most recent occurrence among the tied emotions
      let mostRecentEmotion = emotionsWithMaxCount[0];
      let mostRecentDate = emotionLatestOccurrence[mostRecentEmotion];
      
      emotionsWithMaxCount.forEach(emotion => {
        if (emotionLatestOccurrence[emotion] > mostRecentDate) {
          mostRecentEmotion = emotion;
          mostRecentDate = emotionLatestOccurrence[emotion];
        }
      });

      const emotionType = emotionMap[mostRecentEmotion]?.type || 'neutral';
      return {
        type: 'frequent',
        emotion: mostRecentEmotion,
        emotionType: emotionType,
        isFrequent: true,
        count: logsForDate.length
      };
    }

    // If all emotions appear only once (maxCount === 1), 
    // return the most recent afterEmotion (since it's more recent than beforeEmotion)
    const afterEmotions = allEmotions.filter(e => e.type === 'after');
    if (afterEmotions.length > 0) {
      // Sort by date descending to get the most recent
      const mostRecentAfterEmotion = afterEmotions.sort((a, b) => b.date - a.date)[0];
      return {
        type: 'last',
        emotion: mostRecentAfterEmotion.emotion,
        isFrequent: false,
        count: logsForDate.length
      };
    }

    // Fallback to most recent emotion if no afterEmotions (shouldn't happen normally)
    const mostRecentEmotion = allEmotions.sort((a, b) => b.date - a.date)[0];
    return {
      type: 'last',
      emotion: mostRecentEmotion.emotion,
      isFrequent: false,
      count: logsForDate.length
    };
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

  const handleCircleClick = (day) => {
    const dateToCheck = new Date(currentYear, currentMonth, day);
    dateToCheck.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get the Monday of current week
    const currentWeekStart = new Date(today);
    const dayOfWeek = today.getDay(); // 0 (Sunday) to 6 (Saturday)
    const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Move back to Monday
    currentWeekStart.setDate(today.getDate() + offset);
    currentWeekStart.setHours(0, 0, 0, 0);

    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const isInCurrentWeek = dateToCheck >= currentWeekStart && dateToCheck <= currentWeekEnd;
    const isPastOrToday = dateToCheck <= today;

    // Only allow logging for current week and past/today dates
    if (isPastOrToday && isInCurrentWeek) {
      const formattedMonth = (currentMonth + 1).toString().padStart(2, '0');
      const formattedDay = day.toString().padStart(2, '0');
      const formattedDate = `${currentYear}-${formattedMonth}-${formattedDay}`;
      
      // Navigate to category selection first, then time segment if needed
      // This ensures proper flow: Calendar → Choose Category → Time Segment (if needed)
      navigate(`/choose-category?date=${formattedDate}`);
    }
  };

  const handlePlusClick = (day) => {
    handleCircleClick(day);
  };

  return (
    <div className="bg-gradient-to-br from-[#b4ddc8] via-[#a8d5bb] to-[#9ccdae] min-h-screen flex flex-col justify-between">
      <div>
        <nav className="bg-white py-4 shadow-md">
          <div className="container mx-auto px-4">
            <div className="flex items-center justify-between mb-3">
              {/* Centered month header */}
              <div className="flex-1"></div> {/* Spacer */}
              <div className="flex items-center justify-center flex-1">
                <IconButton 
                  onClick={handlePrevMonth}
                  className="hover:bg-gray-100 transition-colors"
                  size="small"
                >
                  <ChevronLeftIcon className="text-[#6fba94]" />
                </IconButton>
                <h1 className="text-2xl font-bold mx-4 min-w-[200px] text-center text-gray-800">
                  {months[currentMonth]} {currentYear}
                </h1>
                <IconButton 
                  onClick={handleNextMonth}
                  className="hover:bg-gray-100 transition-colors"
                  size="small"
                >
                  <ChevronRightIcon className="text-[#6fba94]" />
                </IconButton>
              </div>
              
              {/* Streak icon with spacer to maintain centering */}
              <div className="flex-1 flex justify-end">
                <Tooltip title="View Streak Stats" arrow>
                  <IconButton 
                    onClick={handleOpenStreakModal} 
                    className="relative hover:scale-105 transition-transform"
                    size="medium"
                  >
                    <div className="w-14 h-14 relative">
                      <img 
                        src="/images/streak.gif" 
                        alt="Streak" 
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    {currentStreak > 0 && (
                      <div className="absolute top-3 right-2 bg-[#6fba94] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-md">
                        {currentStreak}
                      </div>
                    )}
                  </IconButton>
                </Tooltip>
              </div>
            </div>
            
            <div className="flex items-center justify-center">
              <div className="bg-gradient-to-r from-[#f3f9f6] to-[#e8f5ea] rounded-full px-4 py-2 flex items-center shadow-sm">
                <span className="text-xs text-gray-600 mr-3 font-medium">This month:</span>
                <div className="w-24 bg-gray-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#6fba94] to-[#4e8067] rounded-full transition-all duration-500" 
                    style={{ width: `${monthlyCompletion}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-[#6fba94] ml-3">{monthlyCompletion}%</span>
              </div>
            </div>
          </div>
        </nav>
        
        <div className="max-w-screen-md mx-auto px-4 mb-6 mt-8">
          {/* Calendar explanation and legend */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-2 flex items-center justify-center gap-2">
                <span className="text-xl">📅</span>
                Your Mood Calendar
              </h2>
              <p className="text-sm text-gray-600 leading-relaxed max-w-2xl mx-auto mb-4">
                Track your daily emotions and activities. <strong> Click any circle in the current week</strong> to log multiple moods. 
                {'\n'} Past weeks are view-only.
              </p>
            </div>

            {/* Legend */}
            <div className="flex justify-center items-center gap-6 bg-gray-50 rounded-lg py-3 px-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-md">
                  <span className="text-sm">😊</span>
                </div>
                <span className="text-xs text-gray-700 font-medium">Frequent Mood</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-gradient-to-r from-[#6fba94] to-[#5ea983] text-white text-xs rounded-full flex items-center justify-center font-bold shadow-lg border-2 border-white">
                  <span className="text-xs">2</span>
                </div>
                <span className="text-xs text-gray-700 font-medium">Total Logs</span>
              </div>
            </div>
          </div>

          {/* Calendar Container */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
            <div className="bg-gradient-to-r from-[#6fba94] via-[#5ea983] to-[#6fba94] p-4">
              <div className="grid grid-cols-7 gap-2">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, i) => (
                  <div key={i} className="text-center font-bold text-white text-sm py-2">
                    {day}
                  </div>
                ))}
              </div>
            </div>
            
            <div className="p-6 bg-gradient-to-b from-white to-gray-50">
              <div className="grid grid-cols-7 gap-4">
                {/* Empty cells for days before the first day of the month */}
                {[...Array(firstDay)].map((_, i) => (
                  <div key={`empty-${i}`} className="aspect-square"></div>
                ))}
                
                {/* Calendar days */}
                {[...Array(daysInMonth)].map((_, i) => {
                  const day = i + 1;
                  const moodData = getMoodForDate(day);
                  const isToday = day === today.getDate() && 
                                 currentMonth === today.getMonth() && 
                                 currentYear === today.getFullYear();

                  const today_check = new Date();
                  today_check.setHours(0, 0, 0, 0);
                  const dateToCheck = new Date(currentYear, currentMonth, day);
                  dateToCheck.setHours(0, 0, 0, 0);
                  
                  const currentWeekStart = new Date(today_check);
                  const dayOfWeek = today_check.getDay();
                  const offset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
                  currentWeekStart.setDate(today_check.getDate() + offset);
                  currentWeekStart.setHours(0, 0, 0, 0);

                  const currentWeekEnd = new Date(currentWeekStart);
                  currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
                  currentWeekEnd.setHours(23, 59, 59, 999);

                  const isInCurrentWeek = dateToCheck >= currentWeekStart && dateToCheck <= currentWeekEnd;
                  const isPastOrToday = dateToCheck <= today_check;
                  const isClickable = (moodData.type === 'plus') || (moodData.type !== 'empty' && isInCurrentWeek && isPastOrToday);

                  return (
                    <div key={day} className="aspect-square flex flex-col items-center justify-center relative">
                      {/* Day circle */}
                      <div
                        className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative group
                          ${isToday ? 
                            'border-[#6fba94] border-2 bg-white shadow-md' :
                            moodData.type === 'plus' ? 
                              'bg-gradient-to-br from-gray-50 to-gray-100 hover:from-[#f0f9f5] hover:to-[#e8f5ea] border-2 border-dashed border-gray-400 hover:border-[#6fba94] cursor-pointer' : 
                              moodData.type === 'empty' ? 'bg-gradient-to-br from-[#f0f9f5] to-[#e8f5ea]' : 
                              'bg-white shadow-md hover:shadow-lg cursor-pointer transform hover:scale-105'
                          }
                          ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                        `}
                        onClick={() => isClickable && handleCircleClick(day)}
                      >
                        {moodData.type === 'plus' ? (
                          <span className="text-xl text-gray-500 group-hover:text-[#6fba94] transition-colors font-bold">+</span>
                        ) : moodData.type === 'empty' ? null : (
                          <span className="text-3xl drop-shadow-sm">{emotionMap[moodData.emotion]?.emoji || '😊'}</span>
                        )}
                        
                        {/* Multiple entries indicator */}
                        {moodData.count > 1 && (
                          <div className="absolute -top-2 -right-2 bg-gradient-to-r from-[#6fba94] to-[#5ea983] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-bold shadow-lg border-2 border-white">
                            {moodData.count}
                          </div>
                        )}
                      </div>
                      
                      {/* Day number */}
                      <span className={`text-sm font-medium mt-2 ${
                        isToday ? 'text-[#6fba94] font-bold' : 
                        moodData.type !== 'empty' ? 'text-gray-700' : 'text-gray-400'
                      }`}>
                        {day}
                      </span>
                      
                      {/* Tooltip for mood information */}
                      {moodData.type !== 'plus' && moodData.type !== 'empty' && (
                        <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap transition-opacity z-20 shadow-lg">
                          <div className="font-medium">{emotionMap[moodData.emotion]?.label}</div>
                          <div className="text-gray-300">
                            {moodData.isFrequent ? 'Most Frequent' : 'Latest Entry'}
                            {moodData.count > 1 && ` • ${moodData.count} entries`}
                          </div>
                          <div className="text-gray-400 text-xs mt-1">
                            {moodData.type !== 'empty' && isInCurrentWeek && isPastOrToday ? 'Click to add more' : ''}
                          </div>
                          {/* Tooltip arrow */}
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        <div className="mb-20"></div>
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