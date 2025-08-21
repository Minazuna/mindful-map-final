import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import BottomNav from '../BottomNav';
import InfiniteScroll from 'react-infinite-scroll-component';
import CircularProgress from '@mui/material/CircularProgress';
import { Menu, MenuItem, FormControlLabel, Checkbox, Button, Chip, Tooltip, IconButton, Dialog, DialogContent, DialogActions } from '@mui/material';
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
import AccessTimeIcon from '@mui/icons-material/AccessTime';
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
  const [showTimeRestrictionModal, setShowTimeRestrictionModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [selectedCategories, setSelectedCategories] = useState({
    'Overall Activities': false,
    'Social': false,
    'Health': false,
    'Sleep': false,
  });
  const [selectedValences, setSelectedValences] = useState({
    'Positive': false,
    'Negative': false,
  });
  const [sortOrder, setSortOrder] = useState('newest');

  // Emotion emojis mapping
  const emotionEmojis = {
    // Positive emotions
    'calm': '😌',
    'relaxed': '😊',
    'pleased': '🙂',
    'happy': '😄',
    'excited': '🤩',
    // Negative emotions
    'bored': '😑',
    'sad': '😢',
    'disappointed': '😞',
    'angry': '😠',
    'tense': '😰'
  };

  // Activity icons mapping (PNG for most, emoji for sleep)
  const getActivityIcon = (activity, category) => {
    // Sleep category uses emojis
    if (category === 'Sleep') {
      return <span className="text-3xl">😴</span>;
    }

    // All other categories use PNG images
    const activityImages = {
      // Overall Activities
      'study': '/images/study.png',
      'read': '/images/read.png',
      'extracurricular': '/images/extraCurricularActivities.png',
      'relax': '/images/relax.png',
      'watch-movie': '/images/watchMovie.png',
      'listen-music': '/images/listenToMusic.png',
      'gaming': '/images/gaming.png',
      'browse-internet': '/images/browseInternet.png',
      'shopping': '/images/shopping.png',
      'travel': '/images/travel.png',
      // Social
      'alone': '/images/alone.png',
      'friends': '/images/friend.png',
      'family': '/images/family.png',
      'classmates': '/images/classmate.png',
      'relationship': '/images/relationship.png',
      'pet': '/images/pet.png',
      // Health
      'jog': '/images/jog.png',
      'walk': '/images/walk.png',
      'exercise': '/images/exercise.png',
      'meditate': '/images/meditate.png',
      'eat-healthy': '/images/eatHealthy.png',
      'no-physical': '/images/noPhysicalActivity.png',
      'eat-unhealthy': '/images/eatUnhealthy.png',
      'drink-alcohol': '/images/alcoho.png'
    };

    const imageSrc = activityImages[activity];
    if (imageSrc) {
      return (
        <img
          src={imageSrc}
          alt={activity}
          className="w-10 h-10 object-contain"
        />
      );
    }

    // Fallback
    return <span className="text-3xl">📝</span>;
  };

  // Format text function to handle uppercase and remove special characters
  const formatText = (text) => {
    if (!text) return '';
    
    return text
      .replace(/[-_]/g, ' ') // Replace hyphens and underscores with spaces
      .replace(/\b\w/g, (letter) => letter.toUpperCase()); // Capitalize first letter of each word
  };

  // Format timestamp function
  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const fetchMoodLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/mood-log`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setMoodLogs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching mood logs:', error);
      setLoading(false);
    }
  };

  const checkLastMoodLogTime = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/mood-log/today-last`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.data.success && response.data.lastLog && response.data.lastLog.date) {
        const lastLogTime = new Date(response.data.lastLog.date);
        const currentTime = new Date();
        const timeDifference = currentTime - lastLogTime;
        const thirtyMinutesInMs = 30 * 60 * 1000;
        
        if (timeDifference < thirtyMinutesInMs) {
          const remainingMs = thirtyMinutesInMs - timeDifference;
          const remainingMinutes = Math.ceil(remainingMs / (60 * 1000));
          setRemainingTime(remainingMinutes);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      console.error('Error checking last mood log time:', error);
      return true;
    }
  };

  useEffect(() => {
    fetchMoodLogs();
    const savedFavorites = localStorage.getItem('favoriteMoodEntries');
    if (savedFavorites) {
      setFavoriteEntries(JSON.parse(savedFavorites));
    }
  }, []);

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
    setSelectedCategories({
      'Overall Activities': false,
      'Social': false,
      'Health': false,
      'Sleep': false,
    });
    setSelectedValences({
      'Positive': false,
      'Negative': false,
    });
    setSearchTerm('');
  };

  const handleCategoryChange = (event) => {
    setSelectedCategories({
      ...selectedCategories,
      [event.target.name]: event.target.checked,
    });
  };

  const handleValenceChange = (event) => {
    setSelectedValences({
      ...selectedValences,
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

  const handleAddMoodLog = async () => {
    const canLog = await checkLastMoodLogTime();
    
    if (!canLog) {
      setShowTimeRestrictionModal(true);
    } else {
      navigate('/choose-category');
    }
  };

  const handleCloseTimeRestrictionModal = () => {
    setShowTimeRestrictionModal(false);
  };

  // Check if any filters are active
  const hasActiveFilters = Object.values(selectedCategories).some(Boolean) || 
                          Object.values(selectedValences).some(Boolean) || 
                          searchTerm.length > 0;

  // Group mood logs by date
  const groupedMoodLogs = useMemo(() => {
    let filtered = moodLogs.filter((moodLog) => {
      const categoryMatch = !Object.values(selectedCategories).some(Boolean) || 
                           selectedCategories[moodLog.category];
      
      const valenceMatch = !Object.values(selectedValences).some(Boolean) || 
                          (selectedValences['Positive'] && moodLog.beforeValence === 'positive') ||
                          (selectedValences['Negative'] && moodLog.beforeValence === 'negative');
      
      const searchMatch = !searchTerm || 
        moodLog.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (moodLog.activity && moodLog.activity.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (moodLog.beforeEmotion && moodLog.beforeEmotion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (moodLog.afterEmotion && moodLog.afterEmotion.toLowerCase().includes(searchTerm.toLowerCase()));

      const favoriteMatch = activeTab !== 'favorites' || favoriteEntries[moodLog._id];

      return categoryMatch && valenceMatch && searchMatch && favoriteMatch;
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

    // Group by date
    const grouped = {};
    filtered.forEach(log => {
      const dateKey = new Date(log.date).toDateString();
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(log);
    });

    return grouped;
  }, [moodLogs, selectedCategories, selectedValences, searchTerm, sortOrder, activeTab, favoriteEntries]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#F1F8E8' }}>
      {/* Header */}
      <nav className="bg-white/90 backdrop-blur-md py-3 shadow-lg sticky top-0 z-20 border-b" style={{ borderColor: '#D8EFD3' }}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center space-x-2">
              <TrendingUpIcon style={{ color: '#55AD9B' }} />
              <span className="font-semibold text-lg" style={{ color: '#272829' }}>Mood Insights</span>
            </div>
            
            <div className="flex items-center space-x-1">
              <Tooltip title="Log New Mood" arrow>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddMoodLog}
                  className="flex items-center space-x-2 text-white px-5 py-2 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 mr-3"
                  style={{ backgroundColor: '#55AD9B' }}
                >
                  <AddCircleIcon style={{ fontSize: 22 }} />
                  <span className="font-semibold text-base">Add Entry</span>
                </motion.button>
              </Tooltip>

              {hasActiveFilters && (
                <Tooltip title="Clear all filters" arrow>
                  <IconButton size="small" onClick={clearAllFilters}>
                    <ClearIcon style={{ color: '#ff6b6b', fontSize: 20 }} />
                  </IconButton>
                </Tooltip>
              )}
              
              <Tooltip title="Filter" arrow>
                <IconButton size="small" onClick={handleFilterClick}>
                  <FilterListIcon style={{ color: hasActiveFilters ? '#55AD9B' : '#a0a0a0', fontSize: 22 }} />
                </IconButton>
              </Tooltip>
              
              <Tooltip title="Sort" arrow>
                <IconButton size="small" onClick={handleSortClick}>
                  <SortIcon style={{ color: '#a0a0a0', fontSize: 22 }} />
                </IconButton>
              </Tooltip>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <div className="relative">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" style={{ fontSize: 20 }} />
              <input
                type="text"
                placeholder="Search entries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3 text-base rounded-full border-2 bg-white/80 focus:outline-none focus:ring-2 transition-all"
                style={{ 
                  borderColor: '#D8EFD3',
                  '--tw-ring-color': '#55AD9B'
                }}
              />
            </div>
            
            <div className="flex justify-end">
              <div className="bg-white/80 rounded-full p-1">
                <Tabs 
                  value={activeTab}
                  onChange={handleTabChange}
                  className="min-h-0"
                  TabIndicatorProps={{
                    style: {
                      backgroundColor: '#55AD9B',
                      height: 2,
                      borderRadius: '2px'
                    }
                  }}
                >
                  <Tab 
                    value="all" 
                    label="All Entries" 
                    className={`text-sm py-2 px-5 ${activeTab === 'all' ? 'text-[#55AD9B]' : 'text-gray-500'}`}
                    style={{ minHeight: '40px', textTransform: 'none' }}
                  />
                  <Tab 
                    value="favorites" 
                    label="Favorites" 
                    className={`text-sm py-2 px-5 ${activeTab === 'favorites' ? 'text-[#55AD9B]' : 'text-gray-500'}`}
                    style={{ minHeight: '40px', textTransform: 'none' }}
                  />
                </Tabs>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Time Restriction Modal */}
      <Dialog
        open={showTimeRestrictionModal}
        onClose={handleCloseTimeRestrictionModal}
        PaperProps={{
          style: {
            borderRadius: '20px',
            padding: '16px',
            maxWidth: '400px',
            fontFamily: 'inherit'
          }
        }}
      >
        <DialogContent style={{ padding: '24px' }}>
          <div className="text-center">
            <div className="mb-4">
              <AccessTimeIcon style={{ fontSize: 56, color: '#272829' }} />
            </div>
            
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#272829' }}>
              Please Wait
            </h2>
            
            <p className="mb-6 leading-relaxed text-base" style={{ color: '#272829' }}>
              You can log a new mood entry every 30 minutes.
            </p>
            
            <div className="rounded-2xl p-4 mb-6 border" style={{ backgroundColor: '#D8EFD3', borderColor: '#95D2B3' }}>
              <p className="font-semibold text-lg" style={{ color: '#55AD9B' }}>
                {remainingTime} minute{remainingTime !== 1 ? 's' : ''} remaining
              </p>
            </div>
            
            <Button
              onClick={handleCloseTimeRestrictionModal}
              variant="contained"
              fullWidth
              style={{
                backgroundColor: '#55AD9B',
                color: 'white',
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 600,
                padding: '12px 24px',
                fontSize: '16px',
                fontFamily: 'inherit',
                boxShadow: '0 4px 12px rgba(85, 173, 155, 0.3)'
              }}
            >
              Got it
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1 pb-16">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {loading ? (
            <div className="flex justify-center my-8">
              <div className="flex items-center space-x-2 bg-white/80 px-5 py-3 rounded-full shadow-md">
                <CircularProgress size={24} style={{ color: '#55AD9B' }} />
                <span className="text-lg" style={{ color: '#272829' }}>Loading entries...</span>
              </div>
            </div>
          ) : Object.keys(groupedMoodLogs).length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/90 backdrop-blur-sm w-full max-w-lg mx-auto p-10 rounded-2xl shadow-xl text-center border"
              style={{ borderColor: '#D8EFD3' }}
            >
              <div className="text-7xl mb-5">😌</div>
              <h3 className="text-2xl font-semibold mb-4" style={{ color: '#272829' }}>No entries found</h3>
              <p className="leading-relaxed mb-8 text-lg" style={{ color: '#272829' }}>
                {searchTerm || hasActiveFilters || activeTab === 'favorites'
                  ? "Try adjusting your filters or search term to find more entries."
                  : "Start your mood tracking journey! Click the 'Add Entry' button above to log your first mood."}
              </p>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddMoodLog}
                className="text-white px-8 py-3 rounded-full font-semibold shadow-lg hover:shadow-xl transition-all text-lg"
                style={{ backgroundColor: '#55AD9B' }}
              >
                Add Your First Entry
              </motion.button>
            </motion.div>
          ) : (
            <div className="space-y-8">
              {Object.entries(groupedMoodLogs).map(([dateKey, logs]) => {
                const date = new Date(dateKey);
                const formattedDate = date.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                });

                return (
                  <motion.div
                    key={dateKey}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border p-8"
                    style={{ borderColor: '#D8EFD3' }}
                  >
                    {/* Date Header */}
                    <div className="mb-8 pb-6 border-b" style={{ borderColor: '#D8EFD3' }}>
                      <h2 className="text-2xl font-bold flex items-center" style={{ color: '#272829' }}>
                        <span className="w-4 h-4 rounded-full mr-4" style={{ backgroundColor: '#55AD9B' }}></span>
                        {formattedDate}
                        <span className="ml-4 text-base font-normal px-4 py-1 rounded-full" style={{ backgroundColor: '#D8EFD3', color: '#55AD9B' }}>
                          {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                        </span>
                      </h2>
                    </div>

                    {/* Entries for this date */}
                    <div className="space-y-6">
                      {logs.map((log, index) => (
                        <motion.div
                          key={log._id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="p-6 rounded-xl border"
                          style={{ backgroundColor: '#F1F8E8', borderColor: '#D8EFD3' }}
                        >
                          <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 flex items-center justify-center">
                                {getActivityIcon(log.activity, log.category)}
                              </div>
                              <div>
                                <h3 className="font-semibold text-xl" style={{ color: '#272829' }}>
                                  {formatText(log.category)}
                                </h3>
                                <p className="text-base" style={{ color: '#3a796cff', fontWeight: 'bold' }}>
                                  {formatText(log.activity)} {log.hrs && `• ${log.hrs} hrs`}
                                </p>
                                <div className="flex items-center mt-1">
                                  <AccessTimeIcon style={{ fontSize: 16, color: '#272829', marginRight: '4px' }} />
                                  <span className="text-sm" style={{ color: '#272829' }}>
                                    {formatTimestamp(log.date)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            
                            <motion.div whileTap={{ scale: 0.9 }}>
                              <IconButton 
                                onClick={() => handleFavoriteToggle(log._id)}
                                size="medium"
                              >
                                {favoriteEntries[log._id] ? (
                                  <FavoriteIcon style={{ color: '#ff6b6b', fontSize: 24 }} />
                                ) : (
                                  <FavoriteBorderIcon style={{ color: '#b1b1b1', fontSize: 24 }} />
                                )}
                              </IconButton>
                            </motion.div>
                          </div>

                          {/* Before and After Emotions */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Before Emotions */}
                            <div className="p-6 rounded-xl" style={{ backgroundColor: '#D8EFD3' }}>
                              <h4 className="font-semibold mb-3 text-base" style={{ color: '#272829' }}>
                                Before Activity
                              </h4>
                              <div className="flex items-center space-x-3 mb-3">
                                <span className="text-4xl">
                                  {emotionEmojis[log.beforeEmotion] || '😐'}
                                </span>
                                <div>
                                  <p className="font-medium text-lg" style={{ color: '#272829' }}>
                                    {formatText(log.beforeEmotion)}
                                  </p>
                                  <p className="text-sm" style={{ color: '#55AD9B' }}>
                                    {formatText(log.beforeValence)} • Intensity: {log.beforeIntensity}/5
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-3 h-3 rounded-full"
                                    style={{ 
                                      backgroundColor: i < log.beforeIntensity ? '#55AD9B' : '#95D2B3' 
                                    }}
                                  ></div>
                                ))}
                              </div>
                            </div>

                            {/* After Emotions */}
                            <div className="p-6 rounded-xl" style={{ backgroundColor: '#95D2B3' }}>
                              <h4 className="font-semibold mb-3 text-base" style={{ color: '#272829' }}>
                                After Activity
                              </h4>
                              <div className="flex items-center space-x-3 mb-3">
                                <span className="text-4xl">
                                  {emotionEmojis[log.afterEmotion] || '😐'}
                                </span>
                                <div>
                                  <p className="font-medium text-lg" style={{ color: '#272829' }}>
                                    {formatText(log.afterEmotion)}
                                  </p>
                                  <p className="text-sm" style={{ color: '#272829' }}>
                                    {formatText(log.afterValence)} • Intensity: {log.afterIntensity}/5
                                  </p>
                                </div>
                              </div>
                              <div className="flex space-x-2">
                                {[...Array(5)].map((_, i) => (
                                  <div
                                    key={i}
                                    className="w-3 h-3 rounded-full"
                                    style={{ 
                                      backgroundColor: i < log.afterIntensity ? '#55AD9B' : '#F1F8E8' 
                                    }}
                                  ></div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
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
            maxHeight: 500,
            width: '300px',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
          }
        }}
      >
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-xl" style={{ color: '#272829' }}>Filters</h3>
            {hasActiveFilters && (
              <Button 
                size="small" 
                onClick={clearAllFilters}
                style={{ color: '#ff6b6b', fontSize: '14px' }}
              >
                Clear All
              </Button>
            )}
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-4 text-base" style={{ color: '#272829' }}>Filter by Category</h4>
            <div className="space-y-3">
              {Object.keys(selectedCategories).map((category) => (
                <FormControlLabel
                  key={category}
                  control={
                    <Checkbox
                      checked={selectedCategories[category]}
                      onChange={handleCategoryChange}
                      name={category}
                      size="medium"
                      style={{ 
                        color: selectedCategories[category] ? '#55AD9B' : undefined 
                      }}
                    />
                  }
                  label={<span className="text-base">{category}</span>}
                />
              ))}
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="font-medium mb-4 text-base" style={{ color: '#272829' }}>Filter by Valence</h4>
            <div className="space-y-3">
              {Object.keys(selectedValences).map((valence) => (
                <FormControlLabel
                  key={valence}
                  control={
                    <Checkbox
                      checked={selectedValences[valence]}
                      onChange={handleValenceChange}
                      name={valence}
                      size="medium"
                      style={{ 
                        color: selectedValences[valence] ? '#55AD9B' : undefined 
                      }}
                    />
                  }
                  label={<span className="text-base">{valence}</span>}
                />
              ))}
            </div>
          </div>
          
          <Button 
            variant="contained" 
            fullWidth
            onClick={handleFilterClose}
            style={{ 
              backgroundColor: '#55AD9B', 
              color: 'white',
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '16px',
              padding: '12px 0'
            }}
          >
            Apply Filters
          </Button>
        </div>
      </Menu>

      {/* Sort Menu */}
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
            backgroundColor: sortOrder === 'newest' ? '#D8EFD3' : 'transparent',
            color: sortOrder === 'newest' ? '#55AD9B' : 'inherit',
            borderRadius: '8px',
            margin: '4px 8px',
            fontSize: '16px',
            padding: '12px 16px'
          }}
        >
          📅 Newest First
        </MenuItem>
        <MenuItem 
          onClick={() => handleSort('oldest')}
          style={{ 
            backgroundColor: sortOrder === 'oldest' ? '#D8EFD3' : 'transparent',
            color: sortOrder === 'oldest' ? '#55AD9B' : 'inherit',
            borderRadius: '8px',
            margin: '4px 8px',
            fontSize: '16px',
            padding: '12px 16px'
          }}
        >
          📆 Oldest First
        </MenuItem>
      </Menu>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <BottomNav value={value} setValue={setValue} />
      </div>
    </div>
  );
};

export default MoodEntries;