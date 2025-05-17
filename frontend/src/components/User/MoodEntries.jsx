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
import { motion, AnimatePresence } from 'framer-motion';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

const MoodEntries = () => {
  const [moodLogs, setMoodLogs] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [value, setValue] = useState('entries');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'calendar'
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
    Fine: false, // Changed from Excited to Fine as requested
    Relaxed: false,
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
          limit: 4,
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
      setHasMore(initialLogs.length === 4);
      setLoading(false);

      // Load favorites from localStorage
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
    await new Promise((resolve) => setTimeout(resolve, 800)); // Slightly reduced delay
    const newLogs = await fetchMoodLogs(page);
    setMoodLogs((prevLogs) => [...prevLogs, ...newLogs]);
    setPage((prevPage) => prevPage + 1);
    setHasMore(newLogs.length === 4);
    setLoading(false);
  };

  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const moods = ["Happy", "Sad", "Anxious", "Fine", "Relaxed", "Angry"]; // Changed Excited to Fine

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

  // Memoized filtered and sorted logs
  const processedMoodLogs = useMemo(() => {
    // First filter by day, mood, and search term
    let filtered = moodLogs.filter((moodLog) => {
      // Day filter
      const logDate = new Date(moodLog.date);
      const day = daysOfWeek[logDate.getDay()];
      const dayMatch = !Object.values(selectedDays).some(Boolean) || selectedDays[day];
      
      // Mood filter
      const moodMatch = !Object.values(selectedMoods).some(Boolean) || selectedMoods[moodLog.mood];
      
      // Search term
      const searchMatch = !searchTerm || 
        moodLog.mood.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (moodLog.activities && moodLog.activities.some(activity => 
          activity.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (moodLog.social && moodLog.social.some(social => 
          social.toLowerCase().includes(searchTerm.toLowerCase()))) ||
        (moodLog.health && moodLog.health.some(health => 
          health.toLowerCase().includes(searchTerm.toLowerCase())));

      // Favorites filter for "favorites" tab
      const favoriteMatch = activeTab !== 'favorites' || favoriteEntries[moodLog._id];

      return dayMatch && moodMatch && searchMatch && favoriteMatch;
    });

    // Then sort
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
    // Add empty slots for days before the 1st of the month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(null);
    }
    
    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    
    return days;
  }, [currentMonth, currentYear]);

  // Mood tips
  const moodTips = {
    Happy: "Great job! Try to identify what contributed to your happiness today and incorporate more of it in the future.",
    Sad: "It's okay to feel sad. Consider reaching out to someone you trust or engaging in an activity that brings you comfort.",
    Anxious: "Practice deep breathing or try a quick meditation. Physical activity can also help reduce anxiety.",
    Fine: "Not every day needs to be extraordinary. Take time to appreciate the stability in your life.", // Updated for Fine
    Relaxed: "Perfect time for reflection or gratitude practices. Consider journaling about what's going well.",
    Angry: "Try to step back and identify the source of your anger. Consider if there are constructive ways to address the situation."
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-[#b4ddc8] min-h-screen flex flex-col"
    >
           {/* Header - with reduced height */}
           <nav className="bg-white py-2 shadow-md sticky top-0 z-10">
        <div className="container mx-auto px-4">
          {/* View controls - moved to top */}
          <div className="flex justify-end">
            <div className="flex items-center space-x-1">
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
                  <FilterListIcon style={{ color: Object.values(selectedDays).some(Boolean) || Object.values(selectedMoods).some(Boolean) ? '#6fba94' : '#a0a0a0', fontSize: 20 }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Sort" arrow>
                <IconButton size="small" onClick={handleSortClick}>
                  <SortIcon style={{ color: '#a0a0a0', fontSize: 20 }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-center mt-1">
            {/* Search bar */}
            <div className="relative sm:col-span-1">
              <SearchIcon className="absolute left-2 top-1.5 text-gray-400" style={{ fontSize: 18 }} />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-1/2 pl-8 pr-3 py-1 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-1 focus:ring-[#6fba94]"
              />
            </div>
            
            {/* Month Navigation - CENTERED and positioned lower */}
            <div className="flex justify-center sm:col-span-1">
              <div className="flex items-center">
                <ChevronLeftIcon 
                  className="cursor-pointer text-[#6fba94] hover:text-[#4e8067] transition-colors" 
                  onClick={handlePrevMonth}
                  fontSize="small" 
                />
                <h1 className="text-lg font-bold mx-2">{months[currentMonth]} {currentYear}</h1>
                <ChevronRightIcon 
                  className="cursor-pointer text-[#6fba94] hover:text-[#4e8067] transition-colors" 
                  onClick={handleNextMonth}
                  fontSize="small" 
                />
              </div>
            </div>
            
            {/* Tabs */}
            <div className="sm:col-span-1">
              <Tabs 
                value={activeTab}
                onChange={handleTabChange}
                className="min-h-0"
                TabIndicatorProps={{
                  style: {
                    backgroundColor: '#6fba94',
                    height: 2
                  }
                }}
              >
                <Tab 
                  value="all" 
                  label="All" 
                  className={`text-xs py-1 ${activeTab === 'all' ? 'text-[#6fba94]' : 'text-gray-500'}`}
                  style={{ minHeight: '32px' }}
                />
                <Tab 
                  value="favorites" 
                  label="Favorites" 
                  className={`text-xs py-1 ${activeTab === 'favorites' ? 'text-[#6fba94]' : 'text-gray-500'}`}
                  style={{ minHeight: '32px' }}
                />
              </Tabs>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="flex-1 pb-16">
        {showTips && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white px-4 py-3 shadow-md mb-4"
          >
            <h3 className="font-semibold text-lg mb-2 text-[#6fba94]">Mood Tips</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(moodTips).map(([mood, tip]) => (
                <div key={mood} className="bg-[#e9f5ef] rounded-lg p-3 flex items-center">
                  <img src={`/images/${mood.toLowerCase()}.gif`} alt={mood} className="w-12 h-12 mr-3" />
                  <div>
                    <p className="font-semibold text-gray-800">{mood}</p>
                    <p className="text-sm text-gray-600">{tip}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {viewMode === 'calendar' ? (
          // Calendar View
          <div className="container mx-auto px-4 py-6">
            <div className="bg-white rounded-lg shadow-md p-4">
              {/* Days of week header */}
              <div className="grid grid-cols-7 mb-2">
                {daysOfWeek.map(day => (
                  <div key={day} className="text-center font-medium p-2">{day.slice(0, 3)}</div>
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
                    // Use the mood from the first log of the day
                    mood = daysWithLogs[day][0].mood.toLowerCase();
                  }
                  
                  return (
                    <motion.div 
                      key={`day-${day}`}
                      whileHover={{ scale: 1.05 }}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center p-1 cursor-pointer
                        ${hasLogs ? 'bg-[#e9f5ef] shadow-sm' : 'bg-gray-50'}
                        ${isToday ? 'border-2 border-[#6fba94]' : ''}`}
                      onClick={() => {
                        if (hasLogs) {
                          // Scroll to the first entry of this day
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
                      <div className="font-bold text-gray-700">{day}</div>
                      {hasLogs && (
                        <>
                          <img 
                            src={`/images/${mood}.gif`} 
                            alt={mood} 
                            className="w-8 h-8 my-1" 
                          />
                          <div className="text-xs text-[#6fba94] font-medium">
                            {daysWithLogs[day].length} {daysWithLogs[day].length === 1 ? 'entry' : 'entries'}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          // List View
          <InfiniteScroll
            dataLength={processedMoodLogs.length}
            next={loadMoreLogs}
            hasMore={hasMore}
            loader={<div className="flex justify-center my-6"><CircularProgress style={{ color: '#6fba94' }} /></div>}
            endMessage={
              <div className="text-center my-6 text-gray-500 italic">
                {processedMoodLogs.length > 0 ? "You've reached the end" : "No entries found for your filters"}
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
                    className="bg-white w-full max-w-4xl p-8 rounded-lg shadow-md text-center"
                  >
                    <img 
                      src="/images/relaxed.gif" 
                      alt="No entries" 
                      className="w-20 h-20 mx-auto mb-4"
                    />
                    <h3 className="text-xl font-semibold mb-2">No entries found</h3>
                    <p className="text-gray-600">
                      {searchTerm || Object.values(selectedDays).some(Boolean) || Object.values(selectedMoods).some(Boolean) || activeTab === 'favorites'
                        ? "Try adjusting your filters or search term"
                        : "No mood entries for this month. Start logging your moods!"}
                    </p>
                  </motion.div>
                ) : (
                  processedMoodLogs.map((moodLog) => {
                    const { mood, activities, social, health, sleepQuality, date, time, _id } = moodLog;
                    const logDate = new Date(date);
                    const day = daysOfWeek[logDate.getDay()];
                    const formattedDate = `${months[logDate.getMonth()]} ${logDate.getDate()}`;
                    const isFavorite = favoriteEntries[_id];

                    return (
                      <motion.div 
                        id={`entry-${_id}`}
                        key={_id} 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                        className="bg-white w-full max-w-4xl p-6 rounded-lg shadow-md mb-6"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-start">
                            <img src={`/images/${mood.toLowerCase()}.gif`} alt={mood} className="w-16 h-16 mr-4" />
                            <div>
                              <h2 className="text-xl font-semibold text-gray-800">{mood}</h2>
                              <p className="text-sm text-[#b1b1b1]">{day}, {formattedDate} at {time}</p>
                            </div>
                          </div>
                          
                          {/* Move favorite icon to the far right */}
                          <IconButton 
                            onClick={() => handleFavoriteToggle(_id)}
                            className="mt-0"
                          >
                            {isFavorite ? (
                              <FavoriteIcon style={{ color: '#ff6b6b', fontSize: 20 }} />
                            ) : (
                              <FavoriteBorderIcon style={{ color: '#b1b1b1', fontSize: 20 }} />
                            )}
                          </IconButton>
                        </div>
                        
                        {showTips && (
                          <div className="bg-[#e9f5ef] p-2 rounded-lg mb-4">
                            <p className="text-xs text-gray-700">{moodTips[mood]}</p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {activities && activities.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h3 className="text-base font-semibold mb-3 flex items-center">
                                <span className="inline-block w-3 h-3 bg-blue-400 rounded-full mr-2"></span>
                                Activities
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {activities.map((activity) => (
                                  <Chip
                                    key={activity}
                                    avatar={<img src={`/images/${activity.toLowerCase()}.gif`} alt={activity} className="w-6 h-6" />}
                                    label={activity}
                                    variant="outlined"
                                    className="bg-white"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {social && social.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h3 className="text-base font-semibold mb-3 flex items-center">
                                <span className="inline-block w-3 h-3 bg-green-400 rounded-full mr-2"></span>
                                Social
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {social.map((socialItem) => (
                                  <Chip
                                    key={socialItem}
                                    avatar={<img src={`/images/${socialItem.toLowerCase()}.gif`} alt={socialItem} className="w-6 h-6" />}
                                    label={socialItem}
                                    variant="outlined"
                                    className="bg-white"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {health && health.length > 0 && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h3 className="text-base font-semibold mb-3 flex items-center">
                                <span className="inline-block w-3 h-3 bg-red-400 rounded-full mr-2"></span>
                                Health
                              </h3>
                              <div className="flex flex-wrap gap-2">
                                {health.map((healthItem) => (
                                  <Chip
                                    key={healthItem}
                                    avatar={<img src={`/images/${healthItem.toLowerCase()}.gif`} alt={healthItem} className="w-6 h-6" />}
                                    label={healthItem}
                                    variant="outlined"
                                    className="bg-white"
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {sleepQuality && (
                            <div className="bg-gray-50 rounded-lg p-4">
                              <h3 className="text-base font-semibold mb-3 flex items-center">
                                <span className="inline-block w-3 h-3 bg-purple-400 rounded-full mr-2"></span>
                                Sleep Quality
                              </h3>
                              <div className="flex items-center">
                                <img src={`/images/${sleepQuality.toLowerCase().replace(' ', '-')}.gif`} alt={sleepQuality} className="w-10 h-10 mr-2" />
                                <p className="font-medium text-gray-700">{sleepQuality}</p>
                              </div>
                            </div>
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

      {/* Filter Menu */}
      <Menu
        id="filter-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          style: {
            maxHeight: 400,
            width: '250px',
            padding: '8px 0',
          }
        }}
      >
        <div className="px-4 py-2">
          <h3 className="font-semibold mb-2">Filter by Day</h3>
          <div className="space-y-1">
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
                label={day}
              />
            ))}
          </div>
          
          <h3 className="font-semibold mb-2 mt-4">Filter by Mood</h3>
          <div className="space-y-1">
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
                    {mood}
                  </div>
                }
              />
            ))}
          </div>
          
          <div className="flex justify-end mt-4">
            <Button 
              variant="contained" 
              onClick={handleFilterClose}
              style={{ backgroundColor: '#6fba94', color: 'white' }}
              size="small"
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Menu>

      {/* Sort Menu */}
      <Menu
        id="sort-menu"
        anchorEl={sortAnchorEl}
        keepMounted
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
      >
        <MenuItem 
          onClick={() => handleSort('newest')}
          style={{ 
            backgroundColor: sortOrder === 'newest' ? '#e9f5ef' : 'transparent',
            color: sortOrder === 'newest' ? '#6fba94' : 'inherit'
          }}
        >
          Newest First
        </MenuItem>
        <MenuItem 
          onClick={() => handleSort('oldest')}
          style={{ 
            backgroundColor: sortOrder === 'oldest' ? '#e9f5ef' : 'transparent',
            color: sortOrder === 'oldest' ? '#6fba94' : 'inherit'
          }}
        >
          Oldest First
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