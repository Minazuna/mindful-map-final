import React, { useState, useEffect, useRef } from 'react';
import { emphasize, styled } from '@mui/material/styles';
import {
  Breadcrumbs,
  Chip,
  Modal,
  Box,
  Typography,
  IconButton,
  Slider,
  Button,
  Snackbar,
  Alert,
  CircularProgress,
  Collapse,
  Fade,
  Switch,
  FormControlLabel,
  Tooltip,
  Divider // Added Divider import
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import NotificationsIcon from '@mui/icons-material/Notifications';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { motion } from 'framer-motion';

const StyledBreadcrumb = styled(Chip)(({ theme, active }) => {
  const backgroundColor = theme.palette.mode === 'light'
    ? theme.palette.grey[100]
    : theme.palette.grey[800];
    
  return {
    backgroundColor: active ? '#4e8067' : backgroundColor,
    height: theme.spacing(3.5),
    color: active ? 'white' : theme.palette.text.primary,
    fontWeight: active ? 'bold' : 'normal',
    fontSize: '0.95rem',
    '&:hover, &:focus': {
      backgroundColor: active ? '#4e8067' : emphasize(backgroundColor, 0.06),
    },
    '&:active': {
      boxShadow: theme.shadows[1],
      backgroundColor: emphasize(backgroundColor, 0.12),
    },
  };
});

const Pomodoro = () => {
  // Timer states
  const [time, setTime] = useState(1500); // 25 minutes in seconds
  const [initialTime, setInitialTime] = useState(1500);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentMode, setCurrentMode] = useState('pomodoro');
  
  // UI states
  const [showModal, setShowModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [playSound, setPlaySound] = useState(true);
  
  // Custom timer settings
  const [customPomodoro, setCustomPomodoro] = useState(25);
  const [customShortBreak, setCustomShortBreak] = useState(5);
  const [customLongBreak, setCustomLongBreak] = useState(15);
  const [autoStartBreaks, setAutoStartBreaks] = useState(false);
  
  const intervalRef = useRef(null);
  const audioRef = useRef(null);

  useEffect(() => {
    // Initialize audio
    audioRef.current = new Audio('/sounds/bell.mp3'); // Make sure to add a sound file to your public folder
    
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(intervalRef.current);
            handleTimerComplete();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, isPaused]);

  const handleTimerComplete = () => {
    if (playSound) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    }
    
    // Handle completion based on current mode
    if (currentMode === 'pomodoro') {
      setCompletedPomodoros(prev => prev + 1);
      setAlertMessage('Good job! Take a break now.');
      setAlertType('success');
      setShowAlert(true);
      
      // Auto start break after completing a pomodoro
      if (autoStartBreaks) {
        setTimeout(() => {
          const nextMode = completedPomodoros % 4 === 3 ? 'longBreak' : 'shortBreak';
          handleModeChange(nextMode);
        }, 1500);
      }
    } else {
      setAlertMessage(currentMode === 'shortBreak' 
        ? 'Short break finished! Ready to focus again?' 
        : 'Long break finished! Ready to focus again?');
      setAlertType('info');
      setShowAlert(true);
      
      // Auto start next pomodoro after break
      if (autoStartBreaks) {
        setTimeout(() => {
          handleModeChange('pomodoro');
        }, 1500);
      }
    }
    
    setIsActive(false);
  };

  const toggleStartPause = () => {
    if (time === 0) return;
    
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const resetTimer = () => {
    clearInterval(intervalRef.current);
    setTime(initialTime);
    setIsActive(false);
    setIsPaused(false);
  };

  const handleModeChange = (mode) => {
    setCurrentMode(mode);
    clearInterval(intervalRef.current);
    setIsActive(false);
    setIsPaused(false);
    
    let newTime;
    switch(mode) {
      case 'pomodoro':
        newTime = customPomodoro * 60;
        break;
      case 'shortBreak':
        newTime = customShortBreak * 60;
        break;
      case 'longBreak':
        newTime = customLongBreak * 60;
        break;
      default:
        newTime = customPomodoro * 60;
    }
    
    setInitialTime(newTime);
    setTime(newTime);
  };

  const saveSettings = () => {
    handleModeChange(currentMode); // Apply current mode with new settings
    setShowSettings(false);
    
    setAlertMessage('Settings saved!');
    setAlertType('success');
    setShowAlert(true);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const progress = ((initialTime - time) / initialTime) * 100;

  // Background gradient based on current mode
  const getBackgroundGradient = () => {
    switch(currentMode) {
      case 'pomodoro':
        return 'from-[#67b88f] via-[#93c4ab] to-[#f8ffff]';
      case 'shortBreak':
        return 'from-[#6c88c4] via-[#94b0e2] to-[#f0f6ff]';
      case 'longBreak':
        return 'from-[#9367b8] via-[#b794c9] to-[#f8f0ff]';
      default:
        return 'from-[#67b88f] via-[#93c4ab] to-[#f8ffff]';
    }
  };

  return (
    <div className={`bg-gradient-to-r ${getBackgroundGradient()} min-h-screen flex flex-col items-center justify-center relative overflow-hidden`}>
      {/* Floating particles for visual interest */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-white bg-opacity-20"
            style={{
              width: Math.random() * 50 + 10,
              height: Math.random() * 50 + 10,
            }}
            initial={{
              x: Math.random() * window.innerWidth,
              y: Math.random() * window.innerHeight,
              opacity: Math.random() * 0.5 + 0.2,
            }}
            animate={{
              y: [null, Math.random() * -100 - 50],
              opacity: [null, 0],
            }}
            transition={{
              duration: Math.random() * 20 + 20,
              ease: "linear",
              repeat: Infinity,
              repeatType: "loop",
              delay: Math.random() * 20,
            }}
          />
        ))}
      </div>
      
      {/* Help Icon - Top Left */}
      <Tooltip title="What is Pomodoro?">
        <IconButton 
          className="absolute -top-1 -left-60 bg-white bg-opacity-20 hover:bg-opacity-30"
          onClick={() => setShowModal(true)}
        >
          <HelpOutlineIcon style={{ fontSize: 24, color: 'white' }} />
        </IconButton>
      </Tooltip>
      
      {/* Settings Icon - Centered Above Timer */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute top-4 left-2 transform -translate-x-1/2"
      >
        <Tooltip title="Timer Settings">
          <IconButton 
            className="bg-white bg-opacity-20 hover:bg-opacity-30"
            onClick={() => setShowSettings(true)}
          >
            <SettingsIcon style={{ fontSize: 24, color: 'white', top }} />
          </IconButton>
        </Tooltip>
      </motion.div>
      
      {/* Completed Pomodoros Counter */}
      {completedPomodoros > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white bg-opacity-20 rounded-full px-4 py-1 flex items-center"
        >
          <CheckCircleOutlineIcon style={{ fontSize: 20, color: 'white', marginRight: 8 }} />
          <Typography className="text-white font-medium">
            {completedPomodoros} {completedPomodoros === 1 ? 'Pomodoro' : 'Pomodoros'} Completed
          </Typography>
        </motion.div>
      )}
      
      {/* Main Timer Container */}
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white bg-opacity-20 backdrop-blur-sm p-8 rounded-2xl shadow-lg text-center relative"
        style={{ width: '90%', maxWidth: '500px' }}
      >
        {/* Timer Mode Selection */}
        <Breadcrumbs aria-label="breadcrumb" className="mb-8 flex justify-center">
          <StyledBreadcrumb 
            component="a" 
            href="#" 
            label="Pomodoro" 
            active={currentMode === 'pomodoro'}
            onClick={() => handleModeChange('pomodoro')} 
          />
          <StyledBreadcrumb 
            component="a" 
            href="#" 
            label="Short Break" 
            active={currentMode === 'shortBreak'}
            onClick={() => handleModeChange('shortBreak')} 
          />
          <StyledBreadcrumb 
            component="a" 
            href="#" 
            label="Long Break" 
            active={currentMode === 'longBreak'}
            onClick={() => handleModeChange('longBreak')} 
          />
        </Breadcrumbs>
        
        {/* Circular Progress */}
        <div className="relative w-64 h-64 mx-auto my-4">
          <CircularProgress 
            variant="determinate" 
            value={progress} 
            size={240}
            thickness={2}
            style={{ color: 'rgba(255,255,255,0.9)' }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Typography variant="h1" className="text-white font-bold text-6xl">
              {formatTime(time)}
            </Typography>
          </div>
        </div>
        
        {/* Timer Controls */}
        <div className="flex justify-center items-center space-x-8 mt-6">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconButton 
              onClick={toggleStartPause} 
              className="bg-white bg-opacity-30 hover:bg-opacity-40 p-3"
              disabled={time === 0}
            >
              {isActive && !isPaused ? 
                <PauseIcon style={{ fontSize: 36, color: 'white' }} /> : 
                <PlayArrowIcon style={{ fontSize: 36, color: 'white' }} />
              }
            </IconButton>
          </motion.div>
          
          <motion.div 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <IconButton 
              onClick={resetTimer} 
              className="bg-white bg-opacity-30 hover:bg-opacity-40 p-3"
            >
              <ReplayIcon style={{ fontSize: 36, color: 'white' }} />
            </IconButton>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Task input field */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mt-8 w-full max-w-md px-4"
      >
        <Typography className="text-white mb-2 text-center text-lg font-medium">
          Current Focus:
        </Typography>
        <input
          type="text"
          placeholder="What are you working on?"
          className="w-full p-3 rounded-xl bg-white bg-opacity-20 backdrop-blur-sm border border-white border-opacity-30 text-white placeholder-white placeholder-opacity-70 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-40 text-center"
        />
      </motion.div>
      
      {/* Spotify Playlist */}
      <motion.div 
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="absolute bottom-4 right-4" 
        style={{ width: '300px' }}
      >
        <iframe
          style={{ borderRadius: '12px' }}
          src="https://open.spotify.com/embed/playlist/37i9dQZF1DWZeKCadgRdKQ?utm_source=generator&theme=0"
          width="100%"
          height="152"
          frameBorder="0"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
        ></iframe>
      </motion.div>
      
      {/* Info Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        aria-labelledby="pomodoro-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Box className="absolute top-1 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl max-w-md w-[90%]">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h5" component="h2" className="text-gray-800 font-bold flex items-center">
                <HelpOutlineIcon style={{ marginRight: 8, color: '#6fba94' }} />
                What is Pomodoro?
              </Typography>
              <IconButton size="small" onClick={() => setShowModal(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            
            <Typography className="text-gray-600 mb-3">
              The Pomodoro Technique is a time management method developed by Francesco Cirillo in the late 1980s. It uses a timer to break work into intervals, traditionally 25 minutes in length, separated by short breaks.
            </Typography>
            
            <Typography variant="h6" className="font-semibold mt-4 mb-2 text-gray-700">
              How it works:
            </Typography>
            
            <ol className="list-decimal pl-5 space-y-2 text-gray-600 mb-4">
              <li>Choose a task you'd like to get done</li>
              <li>Set the Pomodoro timer (traditionally 25 minutes)</li>
              <li>Work on the task until the timer rings</li>
              <li>Take a short break (5 minutes)</li>
              <li>Every 4 Pomodoros, take a longer break (15-30 minutes)</li>
            </ol>
            
            <Typography className="text-gray-600 italic">
              This method improves focus, mental agility, and helps manage distractions for increased productivity.
            </Typography>
            
            <Button 
              onClick={() => setShowModal(false)}
              variant="contained" 
              className="mt-4 bg-[#6fba94] hover:bg-[#5ea983]"
              fullWidth
            >
              Got it!
            </Button>
          </Box>
        </motion.div>
      </Modal>
      
      {/* Settings Modal */}
      <Modal
        open={showSettings}
        onClose={() => setShowSettings(false)}
        aria-labelledby="settings-modal-title"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-xl shadow-xl max-w-md w-[90%]">
            <div className="flex justify-between items-center mb-4">
              <Typography variant="h5" component="h2" className="text-gray-800 font-bold flex items-center">
                <SettingsIcon style={{ marginRight: 8, color: '#6fba94' }} />
                Timer Settings
              </Typography>
              <IconButton size="small" onClick={() => setShowSettings(false)}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </div>
            
            <Typography variant="body2" className="text-gray-500 mb-4">
              Customize your timer durations (in minutes)
            </Typography>
            
            <div className="mb-6">
              <Typography id="pomodoro-slider" gutterBottom className="font-medium">
                Pomodoro: {customPomodoro} min
              </Typography>
              <Slider
                aria-labelledby="pomodoro-slider"
                value={customPomodoro}
                onChange={(_, newValue) => setCustomPomodoro(newValue)}
                min={1}
                max={60}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 25, label: '25' },
                  { value: 60, label: '60' }
                ]}
                className="text-[#6fba94]"
              />
            </div>
            
            <div className="mb-6">
              <Typography id="short-break-slider" gutterBottom className="font-medium">
                Short Break: {customShortBreak} min
              </Typography>
              <Slider
                aria-labelledby="short-break-slider"
                value={customShortBreak}
                onChange={(_, newValue) => setCustomShortBreak(newValue)}
                min={1}
                max={20}
                step={1}
                marks={[
                  { value: 1, label: '1' },
                  { value: 5, label: '5' },
                  { value: 20, label: '20' }
                ]}
                className="text-[#6c88c4]"
              />
            </div>
            
            <div className="mb-6">
              <Typography id="long-break-slider" gutterBottom className="font-medium">
                Long Break: {customLongBreak} min
              </Typography>
              <Slider
                aria-labelledby="long-break-slider"
                value={customLongBreak}
                onChange={(_, newValue) => setCustomLongBreak(newValue)}
                min={5}
                max={45}
                step={1}
                marks={[
                  { value: 5, label: '5' },
                  { value: 15, label: '15' },
                  { value: 45, label: '45' }
                ]}
                className="text-[#9367b8]"
              />
            </div>
            
            <Divider className="my-4" />
            
            <div className="space-y-3">
              <FormControlLabel
                control={
                  <Switch 
                    checked={autoStartBreaks}
                    onChange={(e) => setAutoStartBreaks(e.target.checked)}
                    className="text-[#6fba94]"
                  />
                }
                label="Auto-start breaks/pomodoros"
              />
              
              <FormControlLabel
                control={
                  <Switch 
                    checked={playSound}
                    onChange={(e) => setPlaySound(e.target.checked)}
                    className="text-[#6fba94]"
                  />
                }
                label="Play sound when timer ends"
              />
            </div>
            
            <div className="flex justify-end mt-6">
              <Button 
                onClick={() => setShowSettings(false)}
                variant="outlined" 
                className="mr-2 border-gray-300 text-gray-500"
              >
                Cancel
              </Button>
              <Button 
                onClick={saveSettings}
                variant="contained" 
                className="bg-[#6fba94] hover:bg-[#5ea983]"
              >
                Save Settings
              </Button>
            </div>
          </Box>
        </motion.div>
      </Modal>
      
      {/* Notifications */}
      <Snackbar 
        open={showAlert} 
        autoHideDuration={4000} 
        onClose={() => setShowAlert(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setShowAlert(false)} 
          severity={alertType}
          sx={{ width: '100%', fontWeight: 500 }}
        >
          {alertMessage}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default Pomodoro;