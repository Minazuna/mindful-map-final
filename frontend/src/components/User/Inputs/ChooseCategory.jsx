import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import TutorialModal from './TutorialModal';

const ChooseCategory = ({ categoryFormData, setCategoryFormData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [hasExistingSleepLog, setHasExistingSleepLog] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Function to check for existing sleep logs
  const checkExistingSleepLog = async (dateToCheck) => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        console.log('Checking for existing sleep log on date:', dateToCheck);
        
        const response = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/mood-log/today-last?category=sleep&date=${dateToCheck}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        console.log('Sleep check API Response:', response.data);
        
        if (response.data.success && response.data.lastLog) {
          console.log('Existing sleep log found - disabling sleep category');
          setHasExistingSleepLog(true);
        } else {
          console.log('No existing sleep log found - sleep category enabled');
          setHasExistingSleepLog(false);
        }
      }
    } catch (error) {
      console.error('Error checking existing sleep log:', error);
      // If error occurs, default to allowing sleep logging
      setHasExistingSleepLog(false);
    }
  };

  useEffect(() => {
    // Check if there's a date parameter in the URL
    const searchParams = new URLSearchParams(location.search);
    const dateParam = searchParams.get('date');
    const fromTimeSegment = searchParams.get('fromTimeSegment');
    
    // Determine the date to use
    let dateToUse;
    if (dateParam) {
      // Use the calendar-selected date (for missed days)
      dateToUse = dateParam;
    } else {
      // Use today's date for normal logging (after sign-in)
      // Get current time in Philippine timezone
      const now = new Date();
      console.log('ChooseCategory - Current browser time:', now.toISOString());
      
      // Convert to Philippine time (UTC+8)
      const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      dateToUse = phTime.toISOString().split('T')[0]; 
      console.log('ChooseCategory - Calculated PH date for today:', dateToUse);
    }
    
    setCategoryFormData(prev => {
      if (prev.selectedDate !== dateToUse) {
        return {
          category: '',
          activity: '',
          hrs: 0,
          beforeValence: '',
          beforeEmotion: null,
          beforeIntensity: 0,
          beforeReason: null,
          afterValence: '',
          afterEmotion: '',
          afterIntensity: 0,
          afterReason: '',
          selectedDate: dateToUse,
          selectedTime: null,
          isEditing: false 
        };
      }
      return {
        ...prev,
        selectedDate: dateToUse
      };
    });

    // Check for existing sleep logs for the determined date
    checkExistingSleepLog(dateToUse);

    // If coming back from time segment, navigate to appropriate activity page
    // Note: This is now handled directly by TimeSegmentSelector for cleaner history
    // Keeping this as fallback for edge cases
    if (fromTimeSegment === 'true' && categoryFormData.category) {
      const categoryPaths = {
        'activity': '/overall-activities',
        'social': '/social-interactions', 
        'health': '/health-activities',
        'sleep': '/sleep-hours'
      };
      
      const path = categoryPaths[categoryFormData.category];
      if (path) {
        navigate(path, { replace: true });
      }
    }
  }, [location.search, setCategoryFormData, categoryFormData.category, navigate]);

  const categories = [
    { 
      name: 'Activities', 
      path: '/overall-activities', 
      categoryKey: 'activity',
      icon: '/images/activities.png'
    },
    { 
      name: 'Social Interactions', 
      path: '/social-interactions', 
      categoryKey: 'social',
      icon: '/images/social.png'
    },
    { 
      name: 'Health-related Activities', 
      path: '/health-activities', 
      categoryKey: 'health',
      icon: '/images/health.png'
    },
    { 
      name: "Previous Night's Sleep (No. of Hours)", 
      path: '/sleep-hours', 
      categoryKey: 'sleep',
      icon: '/images/sleep.png'
    }
  ];

  const handleCategorySelect = async (path, categoryKey) => {
    console.log('Category selected:', categoryKey);
    
    // If sleep category is selected and user already has a sleep log, prevent selection
    if (categoryKey === 'sleep' && hasExistingSleepLog) {
      console.log('Sleep category blocked - user already has a sleep log for this date');
      return; // Block the selection
    }
    
    setCategoryFormData(prev => ({
      ...prev,
      category: categoryKey,
      activity: '',
      hrs: 0,
      beforeValence: '',
      beforeEmotion: null,
      beforeIntensity: 0,
      beforeReason: null,
      afterValence: '',
      afterEmotion: '',
      afterIntensity: 0,
      afterReason: '',
      isEditing: false 
    }));
    
    if (categoryKey === 'sleep') {
      // For sleep entries, go directly to sleep hours (skip time segment)
      // Sleep is logged for the entire day/night, so no specific time needed
      setTimeout(() => {
        navigate('/sleep-hours');
      }, 100);
    } else {
      // For non-sleep categories, go to time segment selector first
      const searchParams = new URLSearchParams(location.search);
      const dateParam = searchParams.get('date');
      if (dateParam) {
        navigate(`/time-segment?date=${dateParam}`);
      } else {
        navigate('/time-segment');
      }
    }
  };

  const handleSkip = () => {
    navigate('/mood-entries');
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#95D2B3' }}>
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-32 h-32 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.4) 40%, rgba(85, 173, 155, 0.1) 70%, transparent 100%)',
            top: '15%', 
            left: '10%' 
          }}
        ></div>
        

        <div 
          className="absolute w-24 h-24 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.5) 35%, rgba(85, 173, 155, 0.15) 65%, transparent 100%)',
            top: '10%', 
            right: '15%' 
          }}
        ></div>
        

        <div 
          className="absolute w-20 h-20 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.6) 30%, rgba(85, 173, 155, 0.2) 60%, transparent 100%)',
            top: '60%', 
            left: '8%' 
          }}
        ></div>

        <div 
          className="absolute w-28 h-28 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.45) 38%, rgba(85, 173, 155, 0.12) 68%, transparent 100%)',
            bottom: '20%', 
            right: '12%' 
          }}
        ></div>

        <div 
          className="absolute w-16 h-16 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #55AD9B 0%, rgba(85, 173, 155, 0.7) 25%, rgba(85, 173, 155, 0.25) 55%, transparent 100%)',
            top: '45%', 
            right: '45%' 
          }}
        ></div>
      </div>


      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8">
        {/* Help Icon */}
        <button
          onClick={() => setShowTutorial(true)}
          className="absolute top-8 right-8 w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110 shadow-lg"
          style={{ backgroundColor: '#55AD9B', color: '#F1F8E8' }}
          title="View Tutorial"
        >
          <span className="text-xl font-bold">?</span>
        </button>

        <h1 
          className="text-5xl font-bold mb-16 text-center"
          style={{ color: '#272829' }}
        >
          Choose a Category
        </h1>

        <div className="flex flex-col space-y-6 w-full max-w-md mb-8 items-center">
          {categories.map((category, index) => {
            const isDisabled = category.categoryKey === 'sleep' && hasExistingSleepLog;
            
            return (
              <button
                key={index}
                onClick={() => handleCategorySelect(category.path, category.categoryKey)}
                disabled={isDisabled}
                className={`w-full py-4 px-8 rounded-2xl text-lg transition-all duration-300 transform flex justify-center items-center gap-4 ${
                  isDisabled 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:scale-105 hover:shadow-lg'
                }`}
                style={{ 
                  backgroundColor: isDisabled ? '#E5E5E5' : '#F1F8E8',
                  color: isDisabled ? '#888888' : '#272829'
                }}
              >
                <img
                  src={category.icon}
                  alt={category.name}
                  className="w-8 h-8"
                  style={{ objectFit: 'contain', opacity: isDisabled ? 0.5 : 1 }}
                />
                <span>
                  {category.name}
                  {isDisabled && <span className="text-sm ml-2">(Already logged today)</span>}
                </span>
              </button>
            );
          })}
        </div>


        <span
          onClick={handleSkip}
          className="text-xl font-bold cursor-pointer transition-all duration-300 hover:scale-105"
          style={{ color: '#272829' }}
        >
          I'll do it later
        </span>

        <div className="mt-12 text-center">
          <div 
            className="inline-block w-16 h-1 rounded-full opacity-60"
            style={{ backgroundColor: '#55AD9B' }}
          ></div>
        </div>
      </div>

      {/* Tutorial Modal */}
      <TutorialModal isOpen={showTutorial} onClose={() => setShowTutorial(false)} />
    </div>
  );
};

export default ChooseCategory;