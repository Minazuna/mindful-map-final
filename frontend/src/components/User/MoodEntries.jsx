import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BottomNav from '../BottomNav';
import InfiniteScroll from 'react-infinite-scroll-component';
import CircularProgress from '@mui/material/CircularProgress';
import { Menu, MenuItem, FormControlLabel, Checkbox, Button, Chip, Tooltip, IconButton } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import InfoIcon from '@mui/icons-material/Info';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import CalendarViewMonthIcon from '@mui/icons-material/CalendarViewMonth';
import ViewListIcon from '@mui/icons-material/ViewList';
import ClearIcon from '@mui/icons-material/Clear';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { motion, AnimatePresence } from 'framer-motion';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useNavigate } from 'react-router-dom';

const MoodEntries = () => {
  const navigate = useNavigate();
  const [moodLogs, setMoodLogs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [value, setValue] = useState('entries');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [favoriteEntries, setFavoriteEntries] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showTips, setShowTips] = useState(false);
  const [selectedDays, setSelectedDays] = useState({
    Sunday: false,
    Monday: false,
    Tuesday: false,
    Wednesday: false,
    Thursday: false,
    Friday: false,
    Saturday: false,
  });
  const [selectedMoods, setSelectedMoods] = useState({
    Happy: false,
    Sad: false,
    Anxious: false,
    Fine: false,
    Angry: false,
  });
  const [sortOrder, setSortOrder] = useState('newest');

  const fetchMoodLogs = async (page) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/mood-log/paginated`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          month: currentMonth + 1,
          year: currentYear,
          page,
          limit: 6,
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching mood logs:', error);
      return [];
    }
  };

  useEffect(() => {
    const loadInitialLogs = async () => {
      setLoading(true);
      const initialLogs = await fetchMoodLogs(0);
      setMoodLogs(initialLogs);
      setPage(1);
      setHasMore(initialLogs.length === 6);
      setLoading(false);

      const savedFavorites = localStorage.getItem('favoriteMoodEntries');
      if (savedFavorites) {
        setFavoriteEntries(JSON.parse(savedFavorites));
      }
    };

    loadInitialLogs();
  }, [currentMonth, currentYear]);

  const loadMoreLogs = async () => {
    if (loading) return;
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const newLogs = await fetchMoodLogs(page);
    setMoodLogs((prevLogs) => [...prevLogs, ...newLogs]);
    setPage((prevPage) => prevPage + 1);
    setHasMore(newLogs.length === 6);
    setLoading(false);
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const moods = ["Happy", "Sad", "Anxious", "Fine", "Angry"];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setPage(0);
    setMoodLogs([]);
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setPage(0);
    setMoodLogs([]);
  };

  const handleFilterClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setAnchorEl(null);
  };

  const handleSortClick = (event) => {
    setSortAnchorEl(event.currentTarget);
  };

  const handleSortClose = () => {
    setSortAnchorEl(null);
  };

  const handleSort = (order) => {
    setSortOrder(order);
    handleSortClose();
  };

  const clearAllFilters = () => {
    setSelectedDays({
      Sunday: false,
      Monday: false,
      Tuesday: false,
      Wednesday: false,
      Thursday: false,
      Friday: false,
      Saturday: false,
    });
    setSelectedMoods({
      Happy: false,
      Sad: false,
      Anxious: false,
      Fine: false,
      Angry: false,
    });
    setSearchTerm('');
  };

  const handleDayChange = (event) => {
    setSelectedDays({
      ...selectedDays,
      [event.target.name]: event.target.checked,
    });
  };

  const handleMoodChange = (event) => {
    setSelectedMoods({
      ...selectedMoods,
      [event.target.name]: event.target.checked,
    });
  };

  const handleFavoriteToggle = (id) => {
    const newFavorites = { ...favoriteEntries };
    newFavorites[id] = !newFavorites[id];
    setFavoriteEntries(newFavorites);
    localStorage.setItem('favoriteMoodEntries', JSON.stringify(newFavorites));
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === 'list' ? 'calendar' : 'list');
  };

  const toggleTips = () => {
    setShowTips(!showTips);
  };

  const handleAddMoodLog = () => {
    navigate('/log-mood');
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(selectedDays).some(Boolean) || 
                          Object.values(selectedMoods).some(Boolean) || 
                          searchTerm.length > 0;

  // Memoized filtered and sorted logs
  const processedMoodLogs = useMemo(() => {
    let filtered = moodLogs.filter((moodLog) => {
      const logDate = new Date(moodLog.date);
      const day = daysOfWeek[logDate.getDay()];
      const dayMatch = !Object.values(selectedDays).some(Boolean) || selectedDays[day];
      
      const moodMatch = !Object.values(selectedMoods).some(Boolean) || selectedMoods[moodLog.mood];
      
      const searchMatch = !searchTerm || 
        moodLog.mood.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (moodLog.activities && moodLog.activities.some(activity => 
          activity.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (moodLog.social && moodLog.social.some(social => 
          social.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (moodLog.health && moodLog.health.some(health => 
          health.toLowerCase().includes(searchTerm.toLowerCase())));

      const favoriteMatch = activeTab !== 'favorites' || favoriteEntries[moodLog._id];

      return dayMatch && moodMatch && searchMatch && favoriteMatch;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (sortOrder === 'newest') {
        return dateB - dateA;
      } else if (sortOrder === 'oldest') {
        return dateA - dateB;
      }
      return 0;
    });

    return filtered;
  }, [moodLogs, selectedDays, selectedMoods, searchTerm, sortOrder, activeTab, favoriteEntries]);

  // Find days in current month that have logs
  const daysWithLogs = useMemo(() => {
    const days = {};
    moodLogs.forEach(log => {
      const date = new Date(log.date);
      const day = date.getDate();
      if (!days[day]) {
        days[day] = [];
      }
      days[day].push(log);
    });
    return days;
  }, [moodLogs]);

  // Generate days array for calendar view
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [currentMonth, currentYear]);

  // Get mood stats for the current month
  const moodStats = useMemo(() => {
    const stats = {};
    moodLogs.forEach(log => {
      stats[log.mood] = (stats[log.mood] || 0) + 1;
    });
    return stats;
  }, [moodLogs]);

  const mostCommonMood = Object.keys(moodStats).reduce((a, b) => 
    moodStats[a] > moodStats[b] ? a : b, 'None'
  );

  // Mood tips
  const moodTips = {
    Happy: "Great job! Try to identify what contributed to your happiness today and incorporate more of it in the future.",
    Sad: "It's okay to feel sad. Consider reaching out to someone you trust or engaging in an activity that brings you comfort.",
    Anxious: "Practice deep breathing or try a quick meditation. Physical activity can also help reduce anxiety.",
    Fine: "Not every day needs to be extraordinary. Take time to appreciate the stability in your life.",
    Angry: "Try to step back and identify the source of your anger. Consider if there are constructive ways to address the situation."
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-br from-[#e8f5e8] to-[#d4f1d4] min-h-screen flex flex-col"
    >
      {/* Enhanced Header */}
      <nav className="bg-white/90 backdrop-blur-md py-3 shadow-lg sticky top-0 z-20 border-b border-green-100">
        <div className="container mx-auto px-4">
          {/* Top row - controls */}
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUpIcon className="text-[#6fba94]" />
              <span className="font-semibold text-gray-700">Mood Insights</span>
            </div>
            
            <div className="flex items-center space-x-1">
              {/* Prominent Add Mood Log Button */}
              <Tooltip title="Log New Mood" arrow>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddMoodLog}
                  className="flex items-center space-x-2 bg-gradient-to-r from-[#6fba94] to-[#5aa88f] text-white px-4 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 mr-3"
                >
                  <AddCircleIcon style={{ fontSize: 20 }} />
                  <span className="font-semibold text-sm">Add Entry</span>
                </motion.button>
              </Tooltip>

              {hasActiveFilters && (
                <Tooltip title="Clear all filters" arrow>
                  <IconButton size="small" onClick={clearAllFilters}>
                    <ClearIcon style={{ color: '#ff6b6b', fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="View Tips" arrow>
                <IconButton size="small" onClick={toggleTips}>
                  <InfoIcon style={{ color: showTips ? '#6fba94' : '#a0a0a0', fontSize: 20 }} />
                </IconButton>
              </Tooltip>

              <Tooltip title={viewMode === 'list' ? 'Calendar View' : 'List View'} arrow>
                <IconButton size="small" onClick={toggleViewMode}>
                  {viewMode === 'list' ? (
                    <CalendarViewMonthIcon style={{ color: '#a0a0a0', fontSize: 20 }} />
                  ) : (
                    <ViewListIcon style={{ color: '#a0a0a0', fontSize: 20 }} />
                  )}
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Filter" arrow>
                <IconButton size="small" onClick={handleFilterClick}>
                  <FilterListIcon style={{ color: hasActiveFilters ? '#6fba94' : '#a0a0a0', fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Sort" arrow>
                <IconButton size="small" onClick={handleSortClick}>
                  <SortIcon style={{ color: '#a0a0a0', fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          
          {/* Main header content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-center">
            {/* Search bar */}
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ fontSize: 18 }} />
              <input
                type="text"
                placeholder="Search moods, activities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm rounded-full border-2 border-green-100 bg-white/80 focus:outline-none focus:ring-2 focus:ring-[#6fba94] focus:border-transparent transition-all"
              />
            </div>
            
            {/* Month Navigation */}
            <div className="flex justify-center">
              <div className="flex items-center bg-white/80 rounded-full px-4 py-2 shadow-sm">
                <ChevronLeftIcon 
                  className="cursor-pointer text-[#6fba94] hover:text-[#4e8067] transition-colors p-1 rounded-full hover:bg-green-100" 
                  onClick={handlePrevMonth}
                  fontSize="medium" 
                />
                <h1 className="text-lg font-bold mx-4 min-w-[180px] text-center">
                  {months[currentMonth]} {currentYear}
                </h1>
                <ChevronRightIcon 
                  className="cursor-pointer text-[#6fba94] hover:text-[#4e8067] transition-colors p-1 rounded-full hover:bg-green-100" 
                  onClick={handleNextMonth}
                  fontSize="medium" 
                />
              </div>
            </div>
            
            {/* Tabs */}
            <div className="flex justify-end">
              <div className="bg-white/80 rounded-full p-1">
                <Tabs 
                  value={activeTab}
                  onChange={handleTabChange}
                  className="min-h-0"
                  TabIndicatorProps={{
                    style: {
                      backgroundColor: '#6fba94',
                      height: 2,
                      borderRadius: '2px'
                    }
                  }}
                >
                  <Tab 
                    value="all" 
                    label="All Entries" 
                    className={`text-xs py-2 px-4 ${activeTab === 'all' ? 'text-[#6fba94]' : 'text-gray-500'}`}
                    style={{ minHeight: '36px', textTransform: 'none' }}
                  />
                  <Tab 
                    value="favorites" 
                    label="Favorites" 
                    className={`text-xs py-2 px-4 ${activeTab === 'favorites' ? 'text-[#6fba94]' : 'text-gray-500'}`}
                    style={{ minHeight: '36px', textTransform: 'none' }}
                  />
                </Tabs>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          {moodLogs.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center justify-center space-x-6 text-sm text-gray-600"
            >
              <div className="flex items-center space-x-2">
                <span className="w-2 h-2 bg-[#6fba94] rounded-full"></span>
                <span>{processedMoodLogs.length} entries this month</span>
              </div>
              {mostCommonMood !== 'None' && (
                <div className="flex items-center space-x-2">
                  <img src={`/images/${mostCommonMood.toLowerCase()}.gif`} alt={mostCommonMood} className="w-4 h-4" />
                  <span>Most common: {mostCommonMood}</span>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </nav>

      {/* Enhanced Tips Section */}
      <AnimatePresence>
        {showTips && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gradient-to-r from-green-50 to-blue-50 px-4 py-4 shadow-md border-b border-green-100"
          >
            <h3 className="font-semibold text-lg mb-3 text-[#6fba94] flex items-center">
              <InfoIcon className="mr-2" />
              Mood Care Tips
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(moodTips).map(([mood, tip]) => (
                <motion.div 
                  key={mood} 
                  whileHover={{ scale: 1.02 }}
                  className="bg-white rounded-xl p-4 shadow-sm border border-green-100 hover:shadow-md transition-all"
                >
                  <div className="flex items-start">
                    <img src={`/images/${mood.toLowerCase()}.gif`} alt={mood} className="w-12 h-12 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-gray-800 mb-1">{mood}</p>
                      <p className="text-sm text-gray-600 leading-relaxed">{tip}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main content */}
      <div className="flex-1 pb-16">
        {viewMode === 'calendar' ? (
          // Enhanced Calendar View
          <div className="container mx-auto px-4 py-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-green-100"
            >
              {/* Days of week header */}
              <div className="grid grid-cols-7 mb-4 gap-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="text-center font-semibold p-3 text-gray-600 bg-green-50 rounded-lg">
                    {day.slice(0, 3)}
                  </div>
                ))}
              </div>
              
              {/* Calendar grid */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                  if (day === null) {
                    return <div key={`empty-${index}`} className="aspect-square"></div>;
                  }
                  
                  const hasLogs = daysWithLogs[day] && daysWithLogs[day].length > 0;
                  const isToday = 
                    new Date().getDate() === day && 
                    new Date().getMonth() === currentMonth && 
                    new Date().getFullYear() === currentYear;
                  
                  let mood = "";
                  if (hasLogs) {
                    mood = daysWithLogs[day][0].mood.toLowerCase();
                  }
                  
                  return (
                    <motion.div 
                      key={`day-${day}`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center p-2 cursor-pointer transition-all
                        ${hasLogs 
                          ? 'bg-gradient-to-br from-green-100 to-green-200 shadow-md hover:shadow-lg' 
                          : 'bg-gray-50 hover:bg-gray-100'}
                        ${isToday ? 'ring-2 ring-[#6fba94] ring-offset-2' : ''}`}
                      onClick={() => {
                        if (hasLogs) {
                          const element = document.getElementById(`entry-${daysWithLogs[day][0]._id}`);
                          if (element) {
                            setViewMode('list');
                            setTimeout(() => {
                              element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            }, 100);
                          }
                        }
                      }}
                    >
                      <div className={`font-bold ${isToday ? 'text-[#6fba94]' : 'text-gray-700'} text-lg`}>
                        {day}
                      </div>
                      {hasLogs && (
                        <>
                          <img 
                            src={`/images/${mood}.gif`} 
                            alt={mood} 
                            className="w-8 h-8 my-1" 
                          />
                          <div className="text-xs text-[#6fba94] font-medium bg-white px-2 py-1 rounded-full">
                            {daysWithLogs[day].length}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        ) : (
          // Enhanced List View
          <InfiniteScroll
            dataLength={processedMoodLogs.length}
            next={loadMoreLogs}
            hasMore={hasMore}
            loader={
              <div className="flex justify-center my-8">
                <div className="flex items-center space-x-2 bg-white/80 px-4 py-2 rounded-full shadow-md">
                  <CircularProgress size={20} style={{ color: '#6fba94' }} />
                  <span className="text-gray-600">Loading more entries...</span>
                </div>
              </div>
            }
            endMessage={
              <div className="text-center my-8">
                <div className="inline-block bg-white/80 px-6 py-3 rounded-full shadow-md">
                  <span className="text-gray-500 italic">
                    {processedMoodLogs.length > 0 ? "You've reached the end ✨" : "No entries found for your filters 📝"}
                  </span>
                </div>
              </div>
            }
            className="pb-4"
          >
            <div className="flex flex-col items-center justify-center px-4 pt-6 pb-20">
              <AnimatePresence>
                {processedMoodLogs.length === 0 && !loading ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-sm w-full max-w-md p-8 rounded-2xl shadow-xl text-center border border-green-100"
                  >
                    <img 
                      src="/images/fine.gif" 
                      alt="No entries" 
                      className="w-24 h-24 mx-auto mb-4"
                    />
                    <h3 className="text-xl font-semibold mb-3 text-gray-800">No entries found</h3>
                    <p className="text-gray-600 leading-relaxed mb-6">
                      {searchTerm || hasActiveFilters || activeTab === 'favorites'
                        ? "Try adjusting your filters or search term to find more entries."
                        : "Start your mood tracking journey! Click the 'Add Entry' button above to log your first mood."}
                    </p>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddMoodLog}
                      className="bg-gradient-to-r from-[#6fba94] to-[#5aa88f] text-white px-6 py-2 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
                    >
                      Add Your First Entry
                    </motion.button>
                  </motion.div>
                ) : (
                  processedMoodLogs.map((moodLog, index) => {
                    const { mood, activities, social, health, sleepQuality, date, time, _id } = moodLog;
                    const logDate = new Date(date);
                    const day = daysOfWeek[logDate.getDay()];
                    const formattedDate = `${months[logDate.getMonth()]} ${logDate.getDate()}`;
                    const isFavorite = favoriteEntries[_id];

                    return (
                      <motion.div 
                        id={`entry-${_id}`}
                        key={_id} 
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: index * 0.05 }}
                        whileHover={{ y: -5 }}
                        className="bg-white/90 backdrop-blur-sm w-full max-w-4xl p-6 rounded-2xl shadow-lg mb-6 border border-green-100 hover:shadow-xl transition-all"
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div className="flex items-start">
                            <div className="relative">
                              <img src={`/images/${mood.toLowerCase()}.gif`} alt={mood} className="w-16 h-16 mr-4" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-gray-800 mb-1">{mood}</h2>
                              <p className="text-sm text-gray-500 flex items-center">
                                <span className="w-2 h-2 bg-[#6fba94] rounded-full mr-2"></span>
                                {day}, {formattedDate} at {time}
                              </p>
                            </div>
                          </div>
                          
                          <motion.div whileTap={{ scale: 0.9 }}>
                            <IconButton 
                              onClick={() => handleFavoriteToggle(_id)}
                              className="hover:bg-red-50"
                            >
                              {isFavorite ? (
                                <FavoriteIcon style={{ color: '#ff6b6b', fontSize: 22 }} />
                              ) : (
                                <FavoriteBorderIcon style={{ color: '#b1b1b1', fontSize: 22 }} />
                              )}
                            </IconButton>
                          </motion.div>
                        </div>
                        
                        {showTips && (
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-gradient-to-r from-green-50 to-blue-50 p-3 rounded-xl mb-4 border border-green-100"
                          >
                            <p className="text-sm text-gray-700 leading-relaxed">{moodTips[mood]}</p>
                          </motion.div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {activities && activities.length > 0 && (
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-xl p-4 border border-blue-200"
                            >
                              <h3 className="text-base font-semibold mb-3 flex items-center text-blue-700">
                                <span className="inline-block w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                                Activities
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {activities.map((activity) => (
                                  <Chip
                                    key={activity}
                                    avatar={<img src={`/images/${activity.toLowerCase().replace(/\s+/g, '')}.gif`} alt={activity} className="w-6 h-6" />}
                                    label={activity}
                                    variant="filled"
                                    className="bg-white/80 hover:bg-white transition-colors"
                                    style={{ fontSize: '0.75rem' }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                          
                          {social && social.length > 0 && (
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-gradient-to-br from-emerald-50 to-teal-100 rounded-xl p-4 border border-emerald-200"
                            >
                              <h3 className="text-base font-semibold mb-3 flex items-center text-emerald-700">
                                <span className="inline-block w-3 h-3 bg-emerald-500 rounded-full mr-2"></span>
                                Social
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {social.map((socialItem) => (
                                  <Chip
                                    key={socialItem}
                                    avatar={<img src={`/images/${socialItem.toLowerCase()}.gif`} alt={socialItem} className="w-6 h-6" />}
                                    label={socialItem}
                                    variant="filled"
                                    className="bg-white/80 hover:bg-white transition-colors"
                                    style={{ fontSize: '0.75rem' }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                          
                          {health && health.length > 0 && (
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-gradient-to-br from-orange-50 to-amber-100 rounded-xl p-4 border border-orange-200"
                            >
                              <h3 className="text-base font-semibold mb-3 flex items-center text-orange-700">
                                <span className="inline-block w-3 h-3 bg-orange-500 rounded-full mr-2"></span>
                                Health
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {health.map((healthItem) => (
                                  <Chip
                                    key={healthItem}
                                    avatar={<img src={`/images/${healthItem.toLowerCase().replace(/\s+/g, '')}.gif`} alt={healthItem} className="w-6 h-6" />}
                                    label={healthItem}
                                    variant="filled"
                                    className="bg-white/80 hover:bg-white transition-colors"
                                    style={{ fontSize: '0.75rem' }}
                                  />
                                ))}
                              </div>
                            </motion.div>
                          )}
                          
                          {sleepQuality && (
                            <motion.div 
                              whileHover={{ scale: 1.02 }}
                              className="bg-gradient-to-br from-violet-50 to-purple-100 rounded-xl p-4 border border-violet-200"
                            >
                              <h3 className="text-base font-semibold mb-3 flex items-center text-violet-700">
                                <span className="inline-block w-3 h-3 bg-violet-500 rounded-full mr-2"></span>
                                Sleep Hours
                              </h3>
                              <div className="flex items-center">
                                <div className="bg-white/80 px-3 py-2 rounded-full text-sm font-medium text-violet-700">
                                  {typeof sleepQuality === 'number' ? `${sleepQuality} hours` : sleepQuality}
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </InfiniteScroll>
        )}
      </div>

      {/* Enhanced Filter Menu */}
      <Menu
        id="filter-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          style: {
            maxHeight: 500,
            width: '280px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          }
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-gray-800">Filters</h3>
            {hasActiveFilters && (
              <Button 
                size="small" 
                onClick={clearAllFilters}
                style={{ color: '#ff6b6b' }}
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-700">Filter by Day</h4>
            <div className="space-y-2">
              {daysOfWeek.map((day) => (
                <FormControlLabel
                  key={day}
                  control={
                    <Checkbox
                      checked={selectedDays[day]}
                      onChange={handleDayChange}
                      name={day}
                      size="small"
                      style={{ 
                        color: selectedDays[day] ? '#6fba94' : undefined 
                      }}
                    />
                  }
                  label={<span className="text-sm">{day}</span>}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-3 text-gray-700">Filter by Mood</h4>
            <div className="space-y-2">
              {moods.map((mood) => (
                <FormControlLabel
                  key={mood}
                  control={
                    <Checkbox
                      checked={selectedMoods[mood]}
                      onChange={handleMoodChange}
                      name={mood}
                      size="small"
                      style={{ 
                        color: selectedMoods[mood] ? '#6fba94' : undefined 
                      }}
                    />
                  }
                  label={
                    <div className="flex items-center">
                      <img src={`/images/${mood.toLowerCase()}.gif`} alt={mood} className="w-6 h-6 mr-2" />
                      <span className="text-sm">{mood}</span>
                    </div>
                  }
                />
              ))}
            </div>
          </div>
          
          <Button 
            variant="contained" 
            fullWidth
            onClick={handleFilterClose}
            style={{ 
              backgroundColor: '#6fba94', 
              color: 'white',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600
            }}
          >
            Apply Filters
          </Button>
        </div>
      </Menu>

      {/* Enhanced Sort Menu */}
      <Menu
        id="sort-menu"
        anchorEl={sortAnchorEl}
        keepMounted
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
        PaperProps={{
          style: {
            borderRadius: '12px',
            boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          }
        }}
      >
        <MenuItem 
          onClick={() => handleSort('newest')}
          style={{ 
            backgroundColor: sortOrder === 'newest' ? '#e9f5ef' : 'transparent',
            color: sortOrder === 'newest' ? '#6fba94' : 'inherit',
            borderRadius: '8px',
            margin: '4px 8px'
          }}
        >
          📅 Newest First
        </MenuItem>
        <MenuItem 
          onClick={() => handleSort('oldest')}
          style={{ 
            backgroundColor: sortOrder === 'oldest' ? '#e9f5ef' : 'transparent',
            color: sortOrder === 'oldest' ? '#6fba94' : 'inherit',
            borderRadius: '8px',
            margin: '4px 8px'
          }}
        >
          📆 Oldest First
        </MenuItem>
      </Menu>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <BottomNav value={value} setValue={setValue} />
      </div>
    </motion.div>
  );
};

export default MoodEntries;