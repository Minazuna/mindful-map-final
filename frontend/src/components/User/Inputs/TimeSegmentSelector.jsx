import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TimeSegmentSelector = ({ categoryFormData, setCategoryFormData }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [customTime, setCustomTime] = useState('');
  const [rememberTime, setRememberTime] = useState(null);
  const [selectedSegment, setSelectedSegment] = useState('');

  // Time segments with their ranges and mid-points
  const timeSegments = [
    {
      id: 'early-morning',
      label: 'Early Morning',
      range: '12:00 AM - 5:59 AM',
      midTime: '03:00', // 3:00 AM
      emoji: '🌌'
    },
    {
      id: 'morning',
      label: 'Morning',
      range: '6:00 AM - 11:59 AM',
      midTime: '09:00', // 9:00 AM
      emoji: '🌅'
    },
    {
      id: 'afternoon',
      label: 'Afternoon', 
      range: '12:00 PM - 5:59 PM',
      midTime: '15:00', // 3:00 PM
      emoji: '☀️'
    },
    {
      id: 'evening',
      label: 'Evening',
      range: '6:00 PM - 11:59 PM',
      midTime: '21:00', // 9:00 PM
      emoji: '🌇'
    }
  ];

  // Helper function to check if selected date is today
  const isToday = () => {
    const searchParams = new URLSearchParams(location.search);
    const selectedDate = searchParams.get('date');
    
    if (selectedDate) {
      // Compare with today's date in Philippine timezone
      const now = new Date();
      const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      const today = phTime.toISOString().split('T')[0];
      return selectedDate === today;
    }
    
    // If no date param, it's normal logging (today)
    return true;
  };

  // Get current time in 12-hour format
  const getCurrentTime = () => {
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const hours = phTime.getUTCHours();
    const minutes = phTime.getUTCMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  // Check if a time segment is available (only for today)
  const isSegmentAvailable = (segmentId) => {
    if (!isToday()) return true; // All segments available for past dates
    
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const currentHour = phTime.getUTCHours();
    
    switch (segmentId) {
      case 'early-morning':
        return currentHour >= 0; // Available once it starts or after
      case 'morning':
        return currentHour >= 6; // Available from 6 AM onwards
      case 'afternoon':
        return currentHour >= 12; // Available from 12 PM onwards
      case 'evening':
        return currentHour >= 18; // Available from 6 PM onwards
      default:
        return true;
    }
  };

  // Auto-set current time for today when component loads
  useEffect(() => {
    // This effect runs when the component mounts
    // If it's today and user will likely choose "Yes", we can prepare
    // But we should only set the time after they choose "Yes"
  }, []);

  const handleTimeRememberChoice = (remembers) => {
    setRememberTime(remembers);
    if (!remembers) {
      setCustomTime('');
      setSelectedSegment('');
    } else {
      setSelectedSegment('');
      // Auto-set current time if today and user remembers
      if (isToday() && remembers) {
        setCustomTime(getCurrentTime());
      }
    }
  };

  const handleSegmentSelect = (segmentId) => {
    setSelectedSegment(segmentId);
  };

  const convertPHTimeToUTC = (timeString, selectedDate) => {
    try {
      // Parse the time string (HH:MM format)
      const [hours, minutes] = timeString.split(':').map(Number);
      
      // Validate time components
      if (isNaN(hours) || isNaN(minutes) || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        throw new Error('Invalid time format');
      }
      
      // Determine the date to use
      let dateToUse;
      if (selectedDate) {
        // Use the provided date (format: YYYY-MM-DD)
        dateToUse = selectedDate;
      } else {
        // Use today's date in Philippine timezone
        const now = new Date();
        // Convert to Philippine time (UTC+8)
        const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
        dateToUse = phTime.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      }
      
      console.log(`Converting PH time: ${timeString} on date: ${dateToUse}`);
      
      // Use the timezone offset approach to create proper UTC time
      // Create a date string with explicit timezone information
      const timeWith24Format = timeString.padStart(5, '0'); // Ensure HH:MM format
      const phDateTimeString = `${dateToUse}T${timeWith24Format}:00+08:00`;
      console.log(`Creating date from: ${phDateTimeString}`);
      
      const utcDateTime = new Date(phDateTimeString);
      
      // Validate the resulting date
      if (isNaN(utcDateTime.getTime())) {
        throw new Error('Invalid date created');
      }
      
      console.log(`PH Date: ${dateToUse} ${timeString} PH Time`);
      console.log(`UTC Date: ${utcDateTime.toISOString()}`);
      console.log(`UTC Date Day: ${utcDateTime.getUTCDate()}`);
      console.log(`Original Date Day: ${dateToUse.split('-')[2]}`);
      
      return utcDateTime;
    } catch (error) {
      console.error('Error converting PH time to UTC:', error);
      
      // Fallback: Use a more straightforward approach
      try {
        const [hours, minutes] = timeString.split(':').map(Number);
        
        // Determine the date to use
        let dateToUse;
        if (selectedDate) {
          dateToUse = selectedDate;
        } else {
          const today = new Date();
          dateToUse = today.toISOString().split('T')[0];
        }
        
        // Create a date object for the Philippine time
        const phDateString = `${dateToUse}T${timeString}:00`;
        const phDate = new Date(phDateString + '+08:00'); // Explicitly set Philippine timezone
        
        console.log('Using fallback with timezone string:', phDate.toISOString());
        return phDate;
      } catch (fallbackError) {
        console.error('Fallback conversion also failed:', fallbackError);
        // Last resort: current time
        return new Date();
      }
    }
  };

  const handleContinue = () => {
    // Check validation based on current state
    if (rememberTime === null) return; // Must choose if they remember
    
    if (rememberTime === true && (!customTime || !isValidTime(customTime))) return; // Must provide valid time if they remember
    
    if (rememberTime === false && !selectedSegment) return; // Must select segment if they don't remember

    // Get the selected date from URL params or use today's date
    const searchParams = new URLSearchParams(location.search);
    const selectedDate = searchParams.get('date');
    
    // Determine the date to use for logging
    let dateForLogging;
    if (selectedDate) {
      // Use the calendar-selected date (for missed days)
      dateForLogging = selectedDate;
      console.log('Using calendar selected date:', selectedDate);
    } else {
      // Use today's date for normal logging (after sign-in)
      // Get current time in Philippine timezone
      const now = new Date();
      console.log('Current browser time:', now.toISOString());
      
      // Convert to Philippine time (UTC+8)
      const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      dateForLogging = phTime.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      console.log('Calculated PH date for today:', dateForLogging);
    }
    
    console.log('Date for logging:', dateForLogging);
    console.log('Selected date from URL:', selectedDate);
    
    let finalTime;
    
    if (rememberTime && customTime) {
      // User provided specific time, convert PH time to UTC
      finalTime = convertPHTimeToUTC(customTime, dateForLogging);
    } else {
      // Use mid-point of selected segment, convert PH time to UTC
      const segment = timeSegments.find(s => s.id === selectedSegment);
      finalTime = convertPHTimeToUTC(segment.midTime, dateForLogging);
    }

    // Validate that we have a valid date object
    if (!finalTime || isNaN(finalTime.getTime())) {
      console.error('Invalid final time generated');
      return;
    }

    // Update category form data with selected time and date
    setCategoryFormData(prev => ({
      ...prev,
      selectedDate: dateForLogging,
      selectedTime: finalTime.toISOString() // Store as ISO string for backend
    }));

    // Navigate directly to the appropriate activity page based on selected category
    // This creates cleaner browser history for back navigation
    const categoryPaths = {
      'activity': '/overall-activities',
      'social': '/social-interactions', 
      'health': '/health-activities',
      'sleep': '/sleep-hours'
    };
    
    const selectedCategory = categoryFormData.category;
    console.log('TimeSegmentSelector - Selected category:', selectedCategory);
    console.log('TimeSegmentSelector - Available paths:', categoryPaths);
    
    const targetPath = categoryPaths[selectedCategory];
    
    if (targetPath) {
      console.log('TimeSegmentSelector - Navigating to:', targetPath);
      navigate(targetPath);
    } else {
      console.log('TimeSegmentSelector - No category set, going to choose category');
      // Fallback to choose category if no category is set
      const dateParam = selectedDate ? `?date=${selectedDate}` : '';
      navigate(`/choose-category${dateParam}`);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  // Validate custom time format and check if it's not in the future for today
  const isValidTime = (time) => {
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(time)) return false;
    
    // If it's today, check that the time is not in the future
    if (isToday()) {
      const now = new Date();
      const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
      const currentHour = phTime.getUTCHours();
      const currentMinute = phTime.getUTCMinutes();
      
      const [inputHour, inputMinute] = time.split(':').map(Number);
      
      // Check if input time is in the future
      if (inputHour > currentHour || (inputHour === currentHour && inputMinute > currentMinute)) {
        return false;
      }
    }
    
    return true;
  };

  // Get the maximum time allowed for time input (only for today)
  const getMaxTime = () => {
    if (!isToday()) return undefined; // No limit for past dates
    
    const now = new Date();
    const phTime = new Date(now.getTime() + (8 * 60 * 60 * 1000));
    const hours = phTime.getUTCHours();
    const minutes = phTime.getUTCMinutes();
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#F0F8FF' }}>
      {/* Floating Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div 
          className="absolute w-32 h-32 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #87CEEB 0%, rgba(135, 206, 235, 0.4) 40%, rgba(135, 206, 235, 0.1) 70%, transparent 100%)',
            top: '10%', 
            left: '15%' 
          }}
        ></div>
        
        <div 
          className="absolute w-24 h-24 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #4682B4 0%, rgba(70, 130, 180, 0.5) 35%, rgba(70, 130, 180, 0.15) 65%, transparent 100%)',
            top: '15%', 
            right: '20%' 
          }}
        ></div>
        
        <div 
          className="absolute w-28 h-28 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #B0E0E6 0%, rgba(176, 224, 230, 0.6) 30%, rgba(176, 224, 230, 0.2) 60%, transparent 100%)',
            bottom: '20%', 
            left: '10%' 
          }}
        ></div>
        
        <div 
          className="absolute w-20 h-20 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, #87CEEB 0%, rgba(135, 206, 235, 0.45) 38%, rgba(135, 206, 235, 0.12) 68%, transparent 100%)',
            bottom: '25%', 
            right: '15%' 
          }}
        ></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-8 py-12">
        {/* Back Button */}
        <div
          onClick={handleBack}
          className="absolute top-8 left-8 text-2xl font-bold transition-all duration-300 hover:scale-110 cursor-pointer"
          style={{ color: '#2C3E50' }}
        >
          ←
        </div>

        {/* Category Display */}
        {categoryFormData.category && (
          <div className="mb-6 p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm">
            <div className="text-center">
              <span className="text-base opacity-70" style={{ color: '#2C3E50' }}>Category: </span>
              <span className="text-base opacity-70" style={{ color: '#2C3E50' }}>
                {categoryFormData.category === 'activity' && 'Activities'}
                {categoryFormData.category === 'social' && 'Social Interactions'}
                {categoryFormData.category === 'health' && 'Health-related Activities'}
                {categoryFormData.category === 'sleep' && 'Sleep Hours'}
              </span>
            </div>
          </div>
        )}

        {/* Title */}
        <h1 
          className="text-4xl font-bold mb-4 text-center"
          style={{ color: '#2C3E50' }}
        >
          When did this happen?
        </h1>

        <p className="text-lg text-gray-600 mb-12 text-center max-w-md">
          Help us accurately track when your mood/activity occurred
        </p>

        {/* Time Memory Question - First Step */}
        <div className="w-full max-w-md mb-8">
          <h3 className="text-xl font-semibold mb-6 text-center" style={{ color: '#2C3E50' }}>
            Do you remember the specific time?
          </h3>
          
          <div className="flex gap-4 mb-6">
            <button
              onClick={() => handleTimeRememberChoice(true)}
              className={`flex-1 py-4 px-4 rounded-xl font-medium transition-all duration-300 ${
                rememberTime === true 
                  ? 'bg-green-100 border-2 border-green-500 text-green-700 shadow-md' 
                  : 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">⏰</div>
                <div>Yes, I remember</div>
              </div>
            </button>
            
            <button
              onClick={() => handleTimeRememberChoice(false)}
              className={`flex-1 py-4 px-4 rounded-xl font-medium transition-all duration-300 ${
                rememberTime === false 
                  ? 'bg-blue-100 border-2 border-blue-500 text-blue-700 shadow-md' 
                  : 'bg-gray-100 border-2 border-gray-300 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">❓</div>
                <div>No, I don't</div>
              </div>
            </button>
          </div>
        </div>

        {/* Custom Time Input - If they remember */}
        {rememberTime === true && (
          <div className="w-full max-w-md mb-8">
            <label className="block text-lg font-bold mb-4 text-center" style={{ color: '#2C3E50' }}>
              {isToday() ? 'Time for this entry' : 'Enter the specific time'}
            </label>
            <input
              type="time"
              value={customTime}
              onChange={(e) => setCustomTime(e.target.value)}
              max={getMaxTime()}
              className="w-full p-4 border-2 border-green-300 rounded-xl focus:border-green-500 focus:outline-none text-lg text-center font-mono"
              placeholder="HH:MM"
            />
            {isToday() && customTime && !isValidTime(customTime) && (
              <div className="mt-2 p-2 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-600 text-center">
                  ⚠️ Time cannot be beyond for today's date
                </p>
              </div>
            )}
          </div>
        )}

        {/* Time Segments - If they don't remember */}
        {rememberTime === false && (
          <div className="w-full max-w-md mb-8">
            <h3 className="text-lg font-semibold mb-4 text-center" style={{ color: '#2C3E50' }}>
              {isToday() ? 'Select when it happened today' : 'Select the time period when it happened'}
            </h3>
            
            {/* Reminder for today's date */}
            {isToday() && (
              <div className="mb-6 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-600 text-center">
                  💡 Only time periods that have already occurred today are available
                </p>
              </div>
            )}
            
            <div className="flex flex-col space-y-4 mb-6">
              {timeSegments.map((segment) => {
                const isAvailable = isSegmentAvailable(segment.id);
                const isDisabled = isToday() && !isAvailable;
                
                return (
                  <button
                    key={segment.id}
                    onClick={() => !isDisabled && handleSegmentSelect(segment.id)}
                    disabled={isDisabled}
                    className={`w-full p-4 rounded-xl text-left transition-all duration-300 border-2 ${
                      isDisabled 
                        ? 'opacity-50 cursor-not-allowed border-gray-200 bg-gray-100' 
                        : selectedSegment === segment.id 
                          ? 'border-blue-500 bg-blue-50 shadow-md hover:scale-102 transform' 
                          : 'border-gray-200 bg-white hover:border-blue-300 hover:scale-102 transform'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-xl">{segment.emoji}</span>
                          <h4 className={`text-lg font-semibold ${isDisabled ? 'text-gray-400' : ''}`} style={{ color: isDisabled ? undefined : '#2C3E50' }}>
                            {segment.label}
                          </h4>
                          {isDisabled && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full">
                              Not Yet
                            </span>
                          )}
                        </div>
                        <p className={`text-sm ${isDisabled ? 'text-gray-400' : 'text-gray-600'}`}>{segment.range}</p>
                      </div>
                      {selectedSegment === segment.id && !isDisabled && (
                        <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={
            rememberTime === null || 
            (rememberTime === true && (!customTime || !isValidTime(customTime))) ||
            (rememberTime === false && !selectedSegment)
          }
          className={`w-full max-w-md py-4 rounded-2xl text-xl font-bold transition-all duration-300 transform ${
            (rememberTime !== null && 
             ((rememberTime === true && customTime && isValidTime(customTime)) ||
              (rememberTime === false && selectedSegment)))
              ? 'hover:scale-105 hover:shadow-lg bg-blue-600 text-white' 
              : 'opacity-50 cursor-not-allowed bg-gray-300 text-gray-500'
          }`}
        >
          {rememberTime === null ? 'Choose if you remember the time' :
           rememberTime === true && (!customTime || !isValidTime(customTime)) ? 
             (isToday() ? 
               (customTime && !isValidTime(customTime) ? 'Time cannot be in the future' : 'Modify time if needed') : 
               'Enter valid time (HH:MM)') :
           rememberTime === false && !selectedSegment ? 'Select a time period' :
           'Continue'}
        </button>

        {/* Helper Text */}
        <div className="mt-6 text-center max-w-md">
          <p 
            className="text-sm opacity-80"
            style={{ color: '#2C3E50' }}
          >
            💡 This helps us accurately track when your mood/activity occurred for better insights
          </p>
        </div>
      </div>
    </div>
  );
};

export default TimeSegmentSelector;
