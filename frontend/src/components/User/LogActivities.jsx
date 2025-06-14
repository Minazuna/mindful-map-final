import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';

const LogActivities = ({ formData, setFormData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const moodFromState = location.state?.mood;
  const [showLastLogPrompt, setShowLastLogPrompt] = useState(false);
  const [lastMoodLog, setLastMoodLog] = useState(null);
  const [isLoadingLastLog, setIsLoadingLastLog] = useState(true);

  // Initialize the formData with the passed mood if not already set
  useEffect(() => {
    if (moodFromState && !formData.mood) {
      setFormData((prevData) => ({ ...prevData, mood: moodFromState }));
    }
  }, [moodFromState, formData, setFormData]);

  const [selectedItems, setSelectedItems] = useState({
    activities: [],
    social: [],
    health: [],
    sleepHours: '', 
  });

  // Track which containers are visible
  const [visibleContainers, setVisibleContainers] = useState(['activities']);

  const shouldShowContainer = (containerName) => {
    return visibleContainers.includes(containerName);
  };

  // Update visible containers when selections change
  useEffect(() => {
    const newVisibleContainers = ['activities'];
    
    if (selectedItems.activities.length > 0) {
      newVisibleContainers.push('social');
    }
    
    if (selectedItems.social.length > 0) {
      newVisibleContainers.push('health');
    }
    
    if (selectedItems.health.length > 0) {
      newVisibleContainers.push('sleepHours');
    }
    
    setVisibleContainers(newVisibleContainers);
  }, [selectedItems]);

  // Fetch the last mood log when component mounts
  useEffect(() => {
    const fetchTodaysLastMoodLog = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/mood-log/today-last`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.success && response.data.lastLog) {
          setLastMoodLog(response.data.lastLog);
          setShowLastLogPrompt(true);
        }
      } catch (error) {
        console.error('Error fetching today\'s last mood log:', error);
      } finally {
        setIsLoadingLastLog(false);
      }
    };

    fetchTodaysLastMoodLog();
  }, []);

  const handleSelect = (type, value) => {
    setSelectedItems((prev) => {
      const alreadySelected = prev[type].includes(value);
      const updated = alreadySelected
        ? prev[type].filter((item) => item !== value)
        : [...prev[type], value];

      return { ...prev, [type]: updated };
    });

    setFormData((prevData) => {
      return {
        ...prevData,
        [type]: prevData[type].includes(value)
          ? prevData[type].filter((item) => item !== value)
          : [...prevData[type], value],
      };
    });
  };

  const handleSleepHoursChange = (e) => {
    const value = Math.max(0, parseInt(e.target.value) || 0);
    
    setSelectedItems(prev => ({
      ...prev,
      sleepHours: value
    }));
    
    setFormData(prev => ({
      ...prev,
      sleepHours: value
    }));
  };

  const handleUseLastLog = () => {
    if (lastMoodLog) {
      const lastLogData = {
        activities: lastMoodLog.activities || [],
        social: lastMoodLog.social || [],
        health: lastMoodLog.health || [],
        sleepHours: lastMoodLog.sleepQuality || '',
      };

      setSelectedItems(lastLogData);
      setFormData(prevData => ({
        ...prevData,
        ...lastLogData
      }));

      // Show all containers since we're pre-selecting everything
      setVisibleContainers(['activities', 'social', 'health', 'sleepHours']);
    }
    setShowLastLogPrompt(false);
  };

  const handleStartFresh = () => {
    setShowLastLogPrompt(false);
  };

  const handleSubmit = async () => {
    console.log("FormData being sent:", formData); 
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found. Please log in again.');
        return;
      }
  
      const response = await axios.post(`${import.meta.env.VITE_NODE_API}/api/mood-log`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
  
      console.log("Server Response:", response.data);  
      if (['angry', 'sad', 'anxious'].includes(formData.mood.toLowerCase())) {
        navigate('/daily-recommendations', { state: { mood: formData.mood.toLowerCase() } });
      } else {
        navigate('/mood-entries');
      }
    } catch (error) {
      if (error.response && error.response.status === 400) {
        toast.error(error.response.data.message);
      } else {
        console.error('Error submitting log:', error.message);
      }
    }
  };

  const activities = [
    { name: 'Studying', icon: '/images/studying.gif' },
    { name: 'Exam', icon: '/images/exam.gif' },
    { name: 'Work', icon: '/images/work.gif' },
    { name: 'Reading', icon: '/images/reading.gif' },
    { name: 'Gaming', icon: '/images/gaming.gif' },
    { name: 'Browsing Phone', icon: '/images/browsingphone.gif' },
    { name: 'Music', icon: '/images/music.gif' },
    { name: 'Movie', icon: '/images/movie.gif' },
    { name: 'Watching TV', icon: '/images/watchingtv.gif' },
    { name: 'Relax', icon: '/images/relax.gif' },
    { name: 'Travel', icon: '/images/travel.gif' },
  ];

  const social = [
    { name: 'Family', icon: '/images/family.gif' },
    { name: 'Friends', icon: '/images/friends.gif' },
    { name: 'Relationship', icon: '/images/relationship.gif' },
    { name: 'Colleagues', icon: '/images/colleagues.gif' },
    { name: 'Pets', icon: '/images/pets.gif' },
    { name: 'Alone', icon: '/images/alone.gif' },
  ];

  const health = [
    { name: 'Exercise', icon: '/images/exercise.gif' },
    { name: 'Walk', icon: '/images/walk.gif' },
    { name: 'Run', icon: '/images/run.gif' },
    { name: 'Eat Healthy', icon: '/images/eat healthy.gif' },
    { name: 'Smoke', icon: '/images/smoke.gif' },
    { name: 'Vape', icon: '/images/vape.gif' },
    { name: 'Drink Alcohol', icon: '/images/drinking.gif' },
    { name: 'Junk Food', icon: '/images/junkfood.gif' },
    { name: 'No Exercise', icon: '/images/noexercise.gif' },
  ];

  const renderItems = (items, type) => (
    <div className={`grid ${type === 'health' ? 'grid-cols-4' : 'grid-cols-5'} gap-2`}>
      {items.map((item) => {
        const isSelected = selectedItems[type].includes(item.name);

        return (
          <div
            key={item.name}
            onClick={() => handleSelect(type, item.name)}
            className="relative cursor-pointer text-center"
          >
            <img
              src={item.icon}
              alt={item.name}
              className={`w-24 h-24 mx-auto mb-2 ${
                isSelected ? 'opacity-60' : ''
              }`}
            />
            {isSelected && (
              <div className="absolute top-0 right-0 bg-green-500 w-4 h-4 rounded-full flex items-center justify-center">
                <span className="text-white text-xs font-bold">✔</span>
              </div>
            )}
            <p className="text-sm">{item.name}</p>
          </div>
        );
      })}
    </div>
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  // Helper function to get instruction text based on container type
  const getInstructionText = (type) => {
    switch (type) {
      case 'activities':
        return 'Select one or more activity';
      case 'social':
        return 'Select one or more social';
      case 'health':
        return 'Select one or more health-related activity';
      case 'sleepHours':
        return 'Enter hours of sleep';
      default:
        return '';
    }
  };

  // Check if continue button should be shown (when all required fields are filled)
  const showContinueButton = selectedItems.activities.length > 0 &&
                            selectedItems.social.length > 0 &&
                            selectedItems.health.length > 0 &&
                            selectedItems.sleepHours !== '';

  const LastLogPromptModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div 
        className="bg-white rounded-lg p-6 max-w-md mx-4"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h3 className="text-lg font-semibold mb-4">Use Previous Activity Log?</h3>
        <p className="text-gray-600 mb-6">
          Would you like to use your last activity log from today ({new Date(lastMoodLog?.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}) as a starting point?
        </p>
        
        <div className="flex space-x-3">
          <button
            onClick={handleUseLastLog}
            className="flex-1 bg-[#6fba94] text-white font-semibold py-2 px-4 rounded-lg hover:bg-[#5aa88f]"
          >
            Yes, Use Last Log
          </button>
          <button
            onClick={handleStartFresh}
            className="flex-1 bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg hover:bg-gray-400"
          >
            Start Fresh
          </button>
        </div>
      </motion.div>
    </div>
  );

  return (
    <div className="bg-[#eef0ee] min-h-screen flex flex-col items-center justify-start pt-20 pb-20 relative">
      {isLoadingLastLog && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="text-lg text-gray-700">Loading...</div>
        </div>
      )}
      
      {showLastLogPrompt && lastMoodLog && <LastLogPromptModal />}

      <h2 className="text-5xl font-bold mb-8">Select accordingly.</h2>
      
      <div className="w-full max-w-3xl space-y-6">
        <AnimatePresence>
          {shouldShowContainer('activities') && (
            <motion.div 
              className="w-full bg-[#eef0ee] border border-[#b1b1b1] rounded-lg p-4 relative"
              key="activities"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-lg font-semibold mb-4">Activities</h3>
              <span className="absolute top-4 right-4 text-sm text-gray-600">
                {getInstructionText('activities')}
              </span>
              {renderItems(activities, 'activities')}
            </motion.div>
          )}

          {shouldShowContainer('social') && (
            <motion.div 
              className="w-full bg-[#eef0ee] border border-[#b1b1b1] rounded-lg p-4 relative"
              key="social"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-lg font-semibold mb-4">Social</h3>
              <span className="absolute top-4 right-4 text-sm text-gray-600">
                {getInstructionText('social')}
              </span>
              {renderItems(social, 'social')}
            </motion.div>
          )}

          {shouldShowContainer('health') && (
            <motion.div 
              className="w-full bg-[#eef0ee] border border-[#b1b1b1] rounded-lg p-4 relative"
              key="health"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-lg font-semibold mb-4">Health</h3>
              <span className="absolute top-4 right-4 text-sm text-gray-600">
                {getInstructionText('health')}
              </span>
              {renderItems(health, 'health')}
            </motion.div>
          )}

          {shouldShowContainer('sleepHours') && (
            <motion.div 
              className="w-full bg-[#eef0ee] border border-[#b1b1b1] rounded-lg p-4 relative"
              key="sleepHours"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <h3 className="text-lg font-semibold mb-4">Sleep Hours</h3>
              <span className="absolute top-4 right-4 text-sm text-gray-600">
                {getInstructionText('sleepHours')}
              </span>
              
              <div className="flex flex-col items-center justify-center py-4">
                <label htmlFor="sleepHours" className="text-lg mb-3">
                  How many hours did you sleep last night?
                </label>
                <input
                  type="number"
                  id="sleepHours"
                  name="sleepHours"
                  min="0"
                  value={selectedItems.sleepHours}
                  onChange={handleSleepHoursChange}
                  className="w-24 h-24 text-4xl text-center rounded-full border-2 border-[#6fba94] bg-[#eef0ee] focus:outline-none focus:border-[#6fba94]"
                />
                <p className="mt-2 text-sm text-gray-600">Hours</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {showContinueButton && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={handleSubmit}
          className="mt-8 bg-[#6fba94] text-white font-bold py-2 px-6 rounded-full hover:bg-[#5aa88f]"
        >
          Continue
        </motion.button>
      )}
    </div>
  );
};

export default LogActivities;