import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import BottomNav from '../BottomNav';
import { Menu, MenuItem, FormControlLabel, Checkbox, Button, Tooltip, IconButton, Dialog, DialogContent } from '@mui/material';
import FilterListIcon from '@mui/icons-material/FilterList';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import SearchIcon from '@mui/icons-material/Search';
import SortIcon from '@mui/icons-material/Sort';
import ClearIcon from '@mui/icons-material/Clear';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { motion, AnimatePresence } from 'framer-motion';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import { useNavigate } from 'react-router-dom';
import { emotionImages } from '/utils/moods';

// Days of week for filter
const DAYS_OF_WEEK = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
];

// Map for pretty category names
const CATEGORY_LABELS = {
  activity: 'Activities',
  social: 'Social',
  health: 'Health',
  sleep: 'Sleep'
};

// Skeleton Loading Component
const SkeletonCard = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border p-8 animate-pulse"
    style={{ borderColor: '#D8EFD3' }}
  >
    <div className="mb-8 pb-6 border-b" style={{ borderColor: '#D8EFD3' }}>
      <div className="flex items-center">
        <div className="w-4 h-4 rounded-full mr-4 bg-gray-200"></div>
        <div className="h-7 bg-gray-200 rounded-lg w-64"></div>
        <div className="ml-4 h-6 bg-gray-200 rounded-full w-24"></div>
      </div>
    </div>
    <div className="space-y-6">
      {[1, 2].map((i) => (
        <div key={i} className="p-6 rounded-xl border" style={{ backgroundColor: '#F1F8E8', borderColor: '#D8EFD3' }}>
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-40"></div>
                <div className="h-3 bg-gray-200 rounded w-24"></div>
              </div>
            </div>
            <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-xl bg-gray-100">
              <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="flex space-x-2 mb-3">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="w-3 h-3 rounded-full bg-gray-200"></div>
                ))}
              </div>
            </div>
            <div className="p-6 rounded-xl bg-gray-100">
              <div className="h-4 bg-gray-200 rounded w-32 mb-3"></div>
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
              </div>
              <div className="flex space-x-2 mb-3">
                {[...Array(5)].map((_, idx) => (
                  <div key={idx} className="w-3 h-3 rounded-full bg-gray-200"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  </motion.div>
);

const MoodEntries = () => {
  const navigate = useNavigate();
  const [moodLogs, setMoodLogs] = useState([]);
  const [value, setValue] = useState('entries');
  const [loading, setLoading] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sortAnchorEl, setSortAnchorEl] = useState(null);
  const [favoriteEntries, setFavoriteEntries] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [showTimeRestrictionModal, setShowTimeRestrictionModal] = useState(false);
  const [remainingTime, setRemainingTime] = useState(0);
  const [sortOrder, setSortOrder] = useState('newest');

  // Dynamically set categories based on fetched data
  const [availableCategories, setAvailableCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState({});
  // Days of week filter
  const [selectedDays, setSelectedDays] = useState({});

  const [selectedValences, setSelectedValences] = useState({
    Positive: false,
    Negative: false,
  });

  // Emojis for emotions
  const getEmotionImage = (emotion) => {
    const imageSrc = emotionImages[emotion];
    if (imageSrc) {
      return (
        <img
          src={imageSrc}
          alt={emotion}
          className="w-12 h-12 object-contain"
        />
      );
    }
    return <span className="text-5xl">😐</span>;
  };

  // Activity icons mapping (PNG for most, emoji for sleep)
  const getActivityIcon = (activity, category) => {
    if (category === 'sleep') return <span className="text-3xl">😴</span>;
    const activityImages = {
      commute: '/images/commute.png',
      exam: '/images/exam.png',
      homework: '/images/homework.png',
      project: '/images/project.png',
      study: '/images/study.png',
      read: '/images/read.png',
      extracurricular: '/images/extraCurricularActivities.png',
      'household-chores': '/images/householdChores.png',
      relax: '/images/relax.png',
      'watch-movie': '/images/watchMovie.png',
      'listen-music': '/images/listenToMusic.png',
      gaming: '/images/gaming.png',
      'browse-internet': '/images/browseInternet.png',
      shopping: '/images/shopping.png',
      travel: '/images/travel.png',
      alone: '/images/alone.png',
      friends: '/images/friend.png',
      family: '/images/family.png',
      classmates: '/images/classmate.png',
      relationship: '/images/relationship.png',
      pet: '/images/pet.png',
      jog: '/images/jog.png',
      walk: '/images/walk.png',
      exercise: '/images/exercise.png',
      meditate: '/images/meditate.png',
      sports: '/images/sports.png',
      'eat-healthy': '/images/eatHealthy.png',
      'no-physical': '/images/noPhysicalActivity.png',
      'eat-unhealthy': '/images/eatUnhealthy.png',
      'drink-alcohol': '/images/alcohol.png'
    };
    const imageSrc = activityImages[activity];
    if (imageSrc) {
      return (
        <img
          src={imageSrc}
          alt={activity}
          className="w-12 h-12 object-contain"
        />
      );
    }
    return <span className="text-3xl">📝</span>;
  };

  const formatText = (text) => {
    if (!text) return '';
    return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const formatTimestamp = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const fetchMoodLogs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/mood-log`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMoodLogs(response.data);

      // Dynamically get available categories from fetched data
      const categories = Array.from(new Set(response.data.map(log => log.category)));
      setAvailableCategories(categories);

      // Set up selectedCategories state for all found categories
      const catObj = {};
      categories.forEach(cat => { catObj[cat] = false; });
      setSelectedCategories(catObj);

      // Set up selectedDays state for all days of week
      const daysObj = {};
      DAYS_OF_WEEK.forEach(day => { daysObj[day] = false; });
      setSelectedDays(daysObj);

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
        headers: { Authorization: `Bearer ${token}` },
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
    if (savedFavorites) setFavoriteEntries(JSON.parse(savedFavorites));
  }, []);

  const handleFilterClick = (event) => setAnchorEl(event.currentTarget);
  const handleFilterClose = () => setAnchorEl(null);
  const handleSortClick = (event) => setSortAnchorEl(event.currentTarget);
  const handleSortClose = () => setSortAnchorEl(null);
  const handleSort = (order) => { setSortOrder(order); handleSortClose(); };

  const clearAllFilters = () => {
    const clearedCats = {};
    availableCategories.forEach(cat => { clearedCats[cat] = false; });
    setSelectedCategories(clearedCats);

    const clearedDays = {};
    DAYS_OF_WEEK.forEach(day => { clearedDays[day] = false; });
    setSelectedDays(clearedDays);

    setSelectedValences({ Positive: false, Negative: false });
    setSearchTerm('');
  };

  const handleCategoryChange = (event) => {
    setSelectedCategories({
      ...selectedCategories,
      [event.target.name]: event.target.checked,
    });
  };

  const handleDayChange = (event) => {
    setSelectedDays({
      ...selectedDays,
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

  const handleTabChange = (event, newValue) => setActiveTab(newValue);

  const handleAddMoodLog = async () => {
    const canLog = await checkLastMoodLogTime();
    if (!canLog) setShowTimeRestrictionModal(true);
    else navigate('/choose-category');
  };

  const handleCloseTimeRestrictionModal = () => setShowTimeRestrictionModal(false);

  // Check if any filters are active
  const hasActiveFilters =
    Object.values(selectedCategories).some(Boolean) ||
    Object.values(selectedValences).some(Boolean) ||
    Object.values(selectedDays).some(Boolean) ||
    searchTerm.length > 0;

  // Filtering and grouping logic
  const groupedMoodLogs = useMemo(() => {
    let filtered = moodLogs.filter((moodLog) => {
      // Category filter
      const categoryMatch =
        !Object.values(selectedCategories).some(Boolean) ||
        selectedCategories[moodLog.category];

      // Day of week filter
      const logDay = DAYS_OF_WEEK[new Date(moodLog.date).getDay()];
      const dayMatch =
        !Object.values(selectedDays).some(Boolean) ||
        selectedDays[logDay];

      // Valence filter
      const valenceMatch =
        !Object.values(selectedValences).some(Boolean) ||
        (selectedValences['Positive'] && moodLog.beforeValence === 'positive') ||
        (selectedValences['Negative'] && moodLog.beforeValence === 'negative');

      // Search filter
      const searchMatch =
        !searchTerm ||
        (moodLog.category && moodLog.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (moodLog.activity && moodLog.activity.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (moodLog.beforeEmotion && moodLog.beforeEmotion.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (moodLog.afterEmotion && moodLog.afterEmotion.toLowerCase().includes(searchTerm.toLowerCase()));

      // Favorites tab filter
      const favoriteMatch =
        activeTab !== 'favorites' || favoriteEntries[moodLog._id];

      return categoryMatch && dayMatch && valenceMatch && searchMatch && favoriteMatch;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      if (sortOrder === 'newest') return dateB - dateA;
      else if (sortOrder === 'oldest') return dateA - dateB;
      return 0;
    });

    // Group by date
    const grouped = {};
    filtered.forEach(log => {
      const dateKey = new Date(log.date).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(log);
    });

    return grouped;
  }, [moodLogs, selectedCategories, selectedValences, selectedDays, searchTerm, sortOrder, activeTab, favoriteEntries]);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#55AD9B' }}>
      {/* Header with Gradient */}
      <nav className="bg-gradient-to-r from-white/95 to-[#F7FBF9]/95 backdrop-blur-md py-4 shadow-lg sticky top-0 z-20 border-b-2" style={{ borderColor: '#D8EFD3' }}>
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-4">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center space-x-3"
            >
              <div>
                <h1 className="font-bold text-3xl" style={{ color: '#1b5f52' }}>Mood Insights</h1>
              </div>
            </motion.div>
            <div className="flex items-center space-x-2">
              {hasActiveFilters && (
                <Tooltip title="Clear all filters" arrow>
                  <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                    <IconButton size="small" onClick={clearAllFilters} className="bg-red-50">
                      <ClearIcon style={{ color: '#ef4444', fontSize: 22 }} />
                    </IconButton>
                  </motion.div>
                </Tooltip>
              )}
              <Tooltip title="Filter entries" arrow>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <IconButton 
                    size="small" 
                    onClick={handleFilterClick}
                    className={hasActiveFilters ? 'bg-[#55AD9B]/10' : ''}
                  >
                    <FilterListIcon style={{ color: hasActiveFilters ? '#55AD9B' : '#6b7280', fontSize: 22 }} />
                  </IconButton>
                </motion.div>
              </Tooltip>
              <Tooltip title="Sort entries" arrow>
                <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                  <IconButton size="small" onClick={handleSortClick}>
                    <SortIcon style={{ color: '#6b7280', fontSize: 22 }} />
                  </IconButton>
                </motion.div>
              </Tooltip>
              <Tooltip title="Log new mood" arrow>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddMoodLog}
                  className="flex items-center space-x-2 text-white px-6 py-2.5 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
                  style={{ background: 'linear-gradient(135deg, #55AD9B 0%, #3e8e7e 100%)' }}
                >
                  <AddCircleIcon style={{ fontSize: 20 }} />
                  <span className="font-semibold text-sm">New Entry</span>
                </motion.button>
              </Tooltip>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-center">
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative"
            >
              <SearchIcon className="absolute left-4 top-1/2 transform -translate-y-1/2" style={{ color: '#6b7280', fontSize: 20 }} />
              <input
                type="text"
                placeholder="Search by category, activity, or emotion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 text-sm rounded-2xl border-2 bg-white/90 focus:outline-none focus:ring-2 focus:ring-[#55AD9B]/50 transition-all shadow-sm"
                style={{ borderColor: '#D8EFD3' }}
              />
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-end"
            >
              <div className="bg-white/90 rounded-2xl p-1 shadow-sm border-2" style={{ borderColor: '#D8EFD3' }}>
                <Tabs
                  value={activeTab}
                  onChange={handleTabChange}
                  className="min-h-0"
                  TabIndicatorProps={{
                    style: {
                      backgroundColor: '#55AD9B',
                      height: 3,
                      borderRadius: '3px'
                    }
                  }}
                >
                  <Tab
                    value="all"
                    label={
                      <div className="flex items-center space-x-2">
                        <CalendarTodayIcon style={{ fontSize: 16 }} />
                        <span>All Entries</span>
                      </div>
                    }
                    className={`text-sm py-2 px-5 ${activeTab === 'all' ? 'text-[#55AD9B]' : 'text-gray-500'}`}
                    style={{ minHeight: '42px', textTransform: 'none', fontWeight: 600 }}
                  />
                  <Tab
                    value="favorites"
                    label={
                      <div className="flex items-center space-x-2">
                        <FavoriteIcon style={{ fontSize: 16 }} />
                        <span>Favorites</span>
                      </div>
                    }
                    className={`text-sm py-2 px-5 ${activeTab === 'favorites' ? 'text-[#55AD9B]' : 'text-gray-500'}`}
                    style={{ minHeight: '42px', textTransform: 'none', fontWeight: 600 }}
                  />
                </Tabs>
              </div>
            </motion.div>
          </div>
        </div>
      </nav>

      {/* Time Restriction Modal */}
      <Dialog
        open={showTimeRestrictionModal}
        onClose={handleCloseTimeRestrictionModal}
        PaperProps={{
          style: {
            borderRadius: '24px',
            padding: '8px',
            maxWidth: '420px',
            background: 'linear-gradient(135deg, #ffffff 0%, #F7FBF9 100%)',
            border: '2px solid #D8EFD3'
          }
        }}
      >
        <DialogContent style={{ padding: '32px' }}>
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-center"
          >
            <motion.div 
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 2 }}
              className="mb-6"
            >
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-[#55AD9B]/10 to-[#95D2B3]/10 flex items-center justify-center border-4" style={{ borderColor: '#D8EFD3' }}>
                <AccessTimeIcon style={{ fontSize: 48, color: '#55AD9B' }} />
              </div>
            </motion.div>
            <h2 className="text-2xl font-bold mb-3" style={{ color: '#1b5f52' }}>
              Almost There!
            </h2>
            <p className="mb-6 leading-relaxed text-base" style={{ color: '#6b7280' }}>
              To ensure quality insights, you can log a new mood entry every 30 minutes.
            </p>
            <div className="rounded-2xl p-5 mb-6 border-2" style={{ backgroundColor: '#D8EFD3', borderColor: '#55AD9B' }}>
              <p className="text-sm mb-1" style={{ color: '#1b5f52' }}>Time remaining</p>
              <p className="font-bold text-3xl" style={{ color: '#55AD9B' }}>
                {remainingTime} min{remainingTime !== 1 ? 's' : ''}
              </p>
            </div>
            <Button
              onClick={handleCloseTimeRestrictionModal}
              variant="contained"
              fullWidth
              style={{
                background: 'linear-gradient(135deg, #55AD9B 0%, #3e8e7e 100%)',
                color: 'white',
                borderRadius: '16px',
                textTransform: 'none',
                fontWeight: 700,
                padding: '14px 24px',
                fontSize: '16px',
                boxShadow: '0 4px 14px rgba(85, 173, 155, 0.4)'
              }}
            >
              Understood
            </Button>
          </motion.div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <div className="flex-1 pb-20">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} />
                ))}
              </motion.div>
            ) : Object.keys(groupedMoodLogs).length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-gradient-to-br from-white/95 to-[#F7FBF9]/95 backdrop-blur-sm w-full max-w-xl mx-auto p-12 rounded-3xl shadow-2xl text-center border-2"
                style={{ borderColor: '#D8EFD3' }}
              >
                <motion.div
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="text-8xl mb-6"
                >
                  😌
                </motion.div>
                <h3 className="text-3xl font-bold mb-4" style={{ color: '#1b5f52' }}>
                  {searchTerm || hasActiveFilters || activeTab === 'favorites' ? 'No matches found' : 'Start Your Journey'}
                </h3>
                <p className="leading-relaxed mb-8 text-lg" style={{ color: '#6b7280' }}>
                  {searchTerm || hasActiveFilters || activeTab === 'favorites'
                    ? "Try adjusting your filters or search term to discover more entries."
                    : "Begin tracking your emotional wellness! Log your first mood entry and watch your insights grow."}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: '0 10px 30px rgba(85, 173, 155, 0.4)' }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleAddMoodLog}
                  className="text-white px-10 py-4 rounded-full font-bold shadow-xl transition-all text-lg"
                  style={{ background: 'linear-gradient(135deg, #55AD9B 0%, #3e8e7e 100%)' }}
                >
                  {searchTerm || hasActiveFilters || activeTab === 'favorites' ? 'Clear Filters' : 'Log First Entry'}
                </motion.button>
              </motion.div>
            ) : (
              <motion.div
                key="content"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-8"
              >
                {Object.entries(groupedMoodLogs).map(([dateKey, logs], dateIndex) => {
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
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: dateIndex * 0.1 }}
                      className="bg-gradient-to-br from-white/95 to-[#F7FBF9]/95 backdrop-blur-sm rounded-3xl shadow-xl border-2 p-8"
                      style={{ borderColor: '#D8EFD3' }}
                    >
                      <div className="mb-8 pb-6 border-b-2" style={{ borderColor: '#D8EFD3' }}>
                        <div className="flex items-center justify-between">
                          <h2 className="text-2xl font-bold flex items-center" style={{ color: '#1b5f52' }}>
                            <motion.span 
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 2, repeat: Infinity }}
                              className="w-3 h-3 rounded-full mr-4"
                              style={{ background: 'linear-gradient(135deg, #55AD9B 0%, #3e8e7e 100%)' }}
                            ></motion.span>
                            {formattedDate}
                          </h2>
                          <span className="ml-4 text-sm font-semibold px-5 py-2 rounded-full shadow-sm" style={{ background: 'linear-gradient(135deg, #D8EFD3 0%, #95D2B3 100%)', color: '#1b5f52' }}>
                            {logs.length} {logs.length === 1 ? 'entry' : 'entries'}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-6">
                        {logs.map((log, index) => (
                          <motion.div
                            key={log._id}
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            whileHover={{ scale: 1.01 }}
                            className="p-7 rounded-2xl border-2 shadow-lg hover:shadow-xl transition-all duration-300"
                            style={{ backgroundColor: '#F1F8E8', borderColor: '#D8EFD3' }}
                          >
                            <div className="flex justify-between items-start mb-6">
                              <div className="flex items-center space-x-4">
                                <motion.div 
                                  whileHover={{ rotate: 360, scale: 1.1 }}
                                  transition={{ duration: 0.5 }}
                                  className="w-14 h-14 flex items-center justify-center rounded-2xl shadow-md" 
                                  style={{ background: 'linear-gradient(135deg, #ffffff 0%, #F7FBF9 100%)' }}
                                >
                                  {getActivityIcon(log.activity, log.category)}
                                </motion.div>
                                <div>
                                  <h3 className="font-bold text-xl mb-1" style={{ color: '#1b5f52' }}>
                                    {CATEGORY_LABELS[log.category] || formatText(log.category)}
                                  </h3>
                                  <p className="text-base font-semibold mb-1" style={{ color: '#55AD9B' }}>
                                    {formatText(log.activity)} {log.hrs && `• ${log.hrs} hrs`}
                                  </p>
                                  <div className="flex items-center">
                                    <AccessTimeIcon style={{ fontSize: 14, color: '#6b7280', marginRight: '4px' }} />
                                    <span className="text-sm" style={{ color: '#6b7280' }}>
                                      {formatTimestamp(log.date)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <motion.div whileTap={{ scale: 0.85 }}>
                                <IconButton
                                  onClick={() => handleFavoriteToggle(log._id)}
                                  size="medium"
                                  className={favoriteEntries[log._id] ? 'bg-red-50' : 'bg-gray-50'}
                                >
                                  <motion.div
                                    animate={favoriteEntries[log._id] ? { scale: [1, 1.3, 1] } : {}}
                                    transition={{ duration: 0.3 }}
                                  >
                                    {favoriteEntries[log._id] ? (
                                      <FavoriteIcon style={{ color: '#ef4444', fontSize: 26 }} />
                                    ) : (
                                      <FavoriteBorderIcon style={{ color: '#9ca3af', fontSize: 26 }} />
                                    )}
                                  </motion.div>
                                </IconButton>
                              </motion.div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              <motion.div 
                                whileHover={{ y: -4 }}
                                className="p-6 rounded-2xl shadow-md border-2" 
                                style={{ background: 'linear-gradient(135deg, #95D2B3 0%, #7bc4a8 100%)', borderColor: '#55AD9B' }}
                              >
                                <h1 className="font-bold mb-4 text-md flex items-center" style={{ color: '#ffffff' }}>
                                  <span className="w-2 h-2 rounded-full bg-white mr-2"></span>
                                  Before Activity
                                </h1>
                                <div className="flex items-center space-x-3 mb-4">
                                  <motion.span 
                                    whileHover={{ scale: 1.2, rotate: 10 }}
                                    className="text-5xl"
                                  >
                                    {getEmotionImage(log.beforeEmotion)}
                                  </motion.span>
                                  <div>
                                    <p className="font-bold text-lg" style={{ color: '#1b5f52' }}>
                                      {formatText(log.beforeEmotion)}
                                    </p>
                                    <p className="text-sm" style={{ color: '#272829' }}>
                                      {formatText(log.beforeValence)} • Intensity: {log.beforeIntensity}/5
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2 mb-4">
                                  {[...Array(5)].map((_, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: i * 0.05 }}
                                      className="w-3 h-3 rounded-full shadow-sm"
                                      style={{
                                        backgroundColor: i < log.beforeIntensity ? '#55AD9B' : '#F1F8E8'
                                      }}
                                    ></motion.div>
                                  ))}
                                </div>
                                {log.beforeReason && (
                                  <div className="mt-4 pt-4 border-t-2" style={{ borderColor: '#55AD9B' }}>
                                    <p className="text-sm font-semibold mb-2" style={{ color: '#1b5f52' }}>Reason:</p>
                                    <p className="text-sm leading-relaxed" style={{ color: '#272829' }}>
                                      {log.beforeReason}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                              <motion.div 
                                whileHover={{ y: -4 }}
                                className="p-6 rounded-2xl shadow-md border-2" 
                                style={{ background: 'linear-gradient(135deg, #95D2B3 0%, #7bc4a8 100%)', borderColor: '#55AD9B' }}
                              >
                                <h1 className="font-bold mb-4 text-md flex items-center" style={{ color: '#ffffff' }}>
                                  <span className="w-2 h-2 rounded-full bg-white mr-2"></span>
                                  After Activity
                                </h1>
                                <div className="flex items-center space-x-3 mb-4">
                                  <motion.span 
                                    whileHover={{ scale: 1.2, rotate: -10 }}
                                    className="text-5xl"
                                  >
                                    {getEmotionImage(log.afterEmotion)}
                                  </motion.span>
                                  <div>
                                    <p className="font-bold text-lg" style={{ color: '#1b5f52' }}>
                                      {formatText(log.afterEmotion)}
                                    </p>
                                    <p className="text-sm" style={{ color: '#272829' }}>
                                      {formatText(log.afterValence)} • Intensity: {log.afterIntensity}/5
                                    </p>
                                  </div>
                                </div>
                                <div className="flex space-x-2 mb-4">
                                  {[...Array(5)].map((_, i) => (
                                    <motion.div
                                      key={i}
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      transition={{ delay: i * 0.05 }}
                                      className="w-3 h-3 rounded-full shadow-sm"
                                      style={{
                                        backgroundColor: i < log.afterIntensity ? '#55AD9B' : '#F1F8E8'
                                      }}
                                    ></motion.div>
                                  ))}
                                </div>
                                {log.afterReason && (
                                  <div className="mt-4 pt-4 border-t-2" style={{ borderColor: '#55AD9B' }}>
                                    <p className="text-sm font-semibold mb-2" style={{ color: '#1b5f52' }}>Reason:</p>
                                    <p className="text-sm leading-relaxed" style={{ color: '#272829' }}>
                                      {log.afterReason}
                                    </p>
                                  </div>
                                )}
                              </motion.div>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filter Menu - Enhanced */}
      <Menu
        id="filter-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleFilterClose}
        PaperProps={{
          style: {
            maxHeight: 560,
            width: '340px',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
            border: '2px solid #D8EFD3'
          }
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-2">
              <FilterListIcon style={{ color: '#55AD9B', fontSize: 24 }} />
              <h3 className="font-bold text-xl" style={{ color: '#1b5f52' }}>Filters</h3>
            </div>
            {hasActiveFilters && (
              <Button
                size="small"
                onClick={clearAllFilters}
                style={{ color: '#ef4444', fontSize: '13px', fontWeight: 600 }}
              >
                Clear All
              </Button>
            )}
          </div>
          
          {/* Category Filter */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-sm" style={{ color: '#6b7280' }}>CATEGORIES</h4>
            <div className="space-y-2">
              {availableCategories.map((cat) => (
                <motion.div key={cat} whileHover={{ x: 4 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedCategories[cat]}
                        onChange={handleCategoryChange}
                        name={cat}
                        size="medium"
                        style={{
                          color: selectedCategories[cat] ? '#55AD9B' : '#d1d5db'
                        }}
                      />
                    }
                    label={<span className="text-base font-medium">{CATEGORY_LABELS[cat] || formatText(cat)}</span>}
                  />
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Day of Week Filter */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3 text-sm" style={{ color: '#6b7280' }}>DAYS OF WEEK</h4>
            <div className="grid grid-cols-2 gap-2">
              {DAYS_OF_WEEK.map((day) => (
                <motion.div key={day} whileHover={{ scale: 1.02 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={selectedDays[day]}
                        onChange={handleDayChange}
                        name={day}
                        size="small"
                        style={{
                          color: selectedDays[day] ? '#55AD9B' : '#d1d5db'
                        }}
                      />
                    }
                    label={<span className="text-sm font-medium">{day.slice(0, 3)}</span>}
                  />
                </motion.div>
              ))}
            </div>
          </div>
          
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={handleFilterClose}
              style={{
                background: 'linear-gradient(135deg, #55AD9B 0%, #3e8e7e 100%)',
                color: 'white',
                borderRadius: '14px',
                textTransform: 'none',
                fontWeight: 700,
                fontSize: '15px',
                padding: '12px 0',
                boxShadow: '0 4px 14px rgba(85, 173, 155, 0.4)'
              }}
            >
              Apply Filters
            </Button>
          </motion.div>
        </div>
      </Menu>

      {/* Sort Menu - Enhanced */}
      <Menu
        id="sort-menu"
        anchorEl={sortAnchorEl}
        keepMounted
        open={Boolean(sortAnchorEl)}
        onClose={handleSortClose}
        PaperProps={{
          style: {
            borderRadius: '16px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.12)',
            border: '2px solid #D8EFD3',
            minWidth: '200px'
          }
        }}
      >
        <div className="p-2">
          <motion.div whileHover={{ x: 4 }}>
            <MenuItem
              onClick={() => handleSort('newest')}
              style={{
                backgroundColor: sortOrder === 'newest' ? '#D8EFD3' : 'transparent',
                color: sortOrder === 'newest' ? '#1b5f52' : '#6b7280',
                borderRadius: '10px',
                margin: '4px 0',
                fontSize: '15px',
                padding: '12px 16px',
                fontWeight: sortOrder === 'newest' ? 600 : 400
              }}
            >
              <span className="mr-2">📅</span> Newest First
            </MenuItem>
          </motion.div>
          <motion.div whileHover={{ x: 4 }}>
            <MenuItem
              onClick={() => handleSort('oldest')}
              style={{
                backgroundColor: sortOrder === 'oldest' ? '#D8EFD3' : 'transparent',
                color: sortOrder === 'oldest' ? '#1b5f52' : '#6b7280',
                borderRadius: '10px',
                margin: '4px 0',
                fontSize: '15px',
                padding: '12px 16px',
                fontWeight: sortOrder === 'oldest' ? 600 : 400
              }}
            >
              <span className="mr-2">📆</span> Oldest First
            </MenuItem>
          </motion.div>
        </div>
      </Menu>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-10">
        <BottomNav value={value} setValue={setValue} />
      </div>
    </div>
  );
};

export default MoodEntries;