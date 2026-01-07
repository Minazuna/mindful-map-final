import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  IconButton,
  Button,
  Snackbar,
  Alert,
  Fade,
  Slider
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import ReplayIcon from '@mui/icons-material/Replay';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

const plantOptions = [
  {
    key: 'firstOption',
    folder: '/images/pomodoro/firstOption/',
    preview: 'flower1.3.png',
    stages: ['flower1.0.png', 'flower1.1.png', 'flower1.2.png', 'flower1.3.png'],
    unlocked: () => true,
  },
  {
    key: 'secondOption',
    folder: '/images/pomodoro/secondOption/',
    preview: 'flower2.2.png',
    stages: ['flower2.0.png', 'flower2.1.png', 'flower2.2.png'],
    unlocked: () => true,
  },
  {
    key: 'thirdOption',
    folder: '/images/pomodoro/thirdOption/',
    preview: 'flower3.3.png',
    stages: ['flower3.0.png', 'flower3.1.png', 'flower3.2.png', 'flower3.3.png'],
    unlocked: () => true,
  }
];

const affirmingMessages = [
  "You're doing amazing! Keep it up! 🌟",
  "Great focus! You're on fire! 🔥",
  "You've got this! Stay strong!",
  "Halfway there! You're crushing it!",
  "Keep pushing! Your effort will pay off!",
  "You're in the zone! Don't stop now!",
  "Incredible work! You're unstoppable! 🌈",
  "Stay calm and focused! You're doing great!",
];

const Pomodoro = () => {
  const navigate = useNavigate();

  // Timer states
  const [time, setTime] = useState(1500);
  const [initialTime, setInitialTime] = useState(1500);
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // UI states
  const [showAlert, setShowAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');
  const [completedPomodoros, setCompletedPomodoros] = useState(0);
  const [affirmMessage, setAffirmMessage] = useState('');
  const [showAffirm, setShowAffirm] = useState(false);

  // Plant selection
  const [showPlantModal, setShowPlantModal] = useState(true);
  const [selectedPlant, setSelectedPlant] = useState(null);

  // Info modal
  const [showInfoModal, setShowInfoModal] = useState(false);

  // Leave warning
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState(null);

  // Timer selection
  const [customMinutes, setCustomMinutes] = useState(25);

  // Audio states
  const [musicVolume, setMusicVolume] = useState(30);
  const [isMuted, setIsMuted] = useState(false);

  const intervalRef = useRef(null);
  const audioRef = useRef(null);
  const bellRef = useRef(null);
  const lastAffirmTimeRef = useRef(0);

  // Prevent accidental navigation
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isActive && !isPaused && time > 0) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isActive, isPaused, time]);

  // Load completedPomodoros and initialize audio
  useEffect(() => {
    audioRef.current = new Audio('/music/rain.mp3');
    audioRef.current.loop = true;
    bellRef.current = new Audio('/sounds/bell.mp3');
    const saved = localStorage.getItem('completedPomodoros');
    if (saved) setCompletedPomodoros(Number(saved));
    return () => {
      clearInterval(intervalRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Save completedPomodoros to localStorage
  useEffect(() => {
    localStorage.setItem('completedPomodoros', completedPomodoros);
  }, [completedPomodoros]);

  // Music volume control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : musicVolume / 100;
    }
  }, [musicVolume, isMuted]);

  // Play/pause music based on timer state
  useEffect(() => {
    if (isActive && !isPaused && audioRef.current) {
      audioRef.current.play().catch(e => console.log("Audio play failed:", e));
    } else if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [isActive, isPaused]);

  // Timer logic
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

  // Affirming messages every 5 minutes
  useEffect(() => {
    if (isActive && !isPaused && time > 0) {
      const elapsed = initialTime - time;
      if (elapsed > 0 && elapsed % 300 === 0 && elapsed !== lastAffirmTimeRef.current) {
        lastAffirmTimeRef.current = elapsed;
        const randomMessage = affirmingMessages[Math.floor(Math.random() * affirmingMessages.length)];
        setAffirmMessage(randomMessage);
        setShowAffirm(true);
        setTimeout(() => setShowAffirm(false), 3000);
      }
    }
  }, [time, isActive, isPaused, initialTime]);

  // Almost done message (last minute)
  useEffect(() => {
    if (isActive && !isPaused && time > 0 && time <= 60 && initialTime > 60) {
      if (time === 60) {
        setAffirmMessage("You're almost there! Just one more minute!");
        setShowAffirm(true);
        setTimeout(() => setShowAffirm(false), 3000);
      }
    }
  }, [time, isActive, isPaused, initialTime]);

  // Notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission();
    }
  }, []);

  // Plant stages logic
  const getPlantStages = () => {
    if (!selectedPlant) return [];
    const plant = plantOptions.find(p => p.key === selectedPlant);
    return plant ? plant.stages.map(img => plant.folder + img) : [];
  };
  const plantStages = getPlantStages();
  const stageCount = plantStages.length;
  const elapsed = initialTime - time;
  const stage = Math.min(
    Math.floor((elapsed / initialTime) * stageCount),
    stageCount - 1
  );

  const handlePlantSelect = (key) => {
    setSelectedPlant(key);
    setShowPlantModal(false);
    setInitialTime(customMinutes * 60);
    setTime(customMinutes * 60);
    setIsActive(false);
    setIsPaused(false);
    lastAffirmTimeRef.current = 0;
  };

  const handleTimerComplete = () => {
    if (bellRef.current) {
      bellRef.current.play().catch(e => console.log("Bell play failed:", e));
    }
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification("Pomodoro Complete! Take a break.");
    }
    setCompletedPomodoros(completedPomodoros + 1);
    setAffirmMessage("Well Done! You Crushed It! 🎉");
    setShowAffirm(true);
    setTimeout(() => setShowAffirm(false), 5000);
    setAlertMessage('Good job! Take a break now.');
    setAlertType('success');
    setShowAlert(true);
    setIsActive(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
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
    lastAffirmTimeRef.current = 0;
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  const handleMinutesChange = (e) => {
    const val = Math.max(10, Math.min(60, Number(e.target.value)));
    setCustomMinutes(val);
    setInitialTime(val * 60);
    setTime(val * 60);
    setIsActive(false);
    setIsPaused(false);
    lastAffirmTimeRef.current = 0;
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Plant selection modal
  const PlantSelectionModal = (
    <Modal open={showPlantModal} aria-labelledby="plant-modal-title" disableEscapeKeyDown>
      <Fade in={showPlantModal}>
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-[#55AD9B] rounded-3xl shadow-2xl px-8 py-10 max-w-lg w-[95%] flex flex-col items-center">
            <div className="text-3xl font-bold text-white font-nunito text-center">
              Choose a Plant to Grow
            </div>
            <div className="text-sm text-white mb-6 font-nunito text-center">
              Watch your plant grow as you stay focused! The longer you work, the more your plant blossoms. Complete your Pomodoro to see it fully bloom!
            </div>
            <div className="flex flex-row justify-center gap-8 w-full">
              {plantOptions.map((plant) => {
                const unlocked = true;
                return (
                  <motion.div
                    key={plant.key}
                    whileHover={unlocked ? { scale: 1.08 } : {}}
                    className={`rounded-2xl p-3 transition-all duration-150 bg-[#e8f5ea] cursor-pointer relative`}
                    onClick={() => unlocked && handlePlantSelect(plant.key)}
                  >
                    <img
                      src={plant.folder + plant.preview}
                      alt=""
                      className="w-24 h-24 object-contain"
                    />
                  </motion.div>
                );
              })}
            </div>
            <div className="mt-8 flex flex-col items-center">
              <label className="text-white font-semibold mb-2">Pomodoro Duration</label>
              <input
                type="number"
                min={10}
                max={60}
                value={customMinutes}
                onChange={handleMinutesChange}
                className="w-20 text-center border border-[#4e8067] rounded-lg py-1 px-2 focus:outline-none focus:ring-2 focus:ring-[#4e8067] font-bold text-lg"
              />
              <span className="text-white text-sm mt-1">minutes (10–60)</span>
            </div>
          </div>
        </div>
      </Fade>
    </Modal>
  );

  // Info modal
  const InfoModal = (
    <Modal open={showInfoModal} onClose={() => setShowInfoModal(false)}>
      <Fade in={showInfoModal}>
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-[95%] flex flex-col items-center">
            <div className="flex items-center mb-4">
              <InfoOutlinedIcon className="text-[#4e8067] mr-2" fontSize="large" />
              <span className="text-xl font-bold text-[#4e8067]">What is Pomodoro?</span>
            </div>
            <div className="text-gray-700 text-center mb-4">
              The Pomodoro Technique is a time management method that uses a timer to break work into intervals, traditionally 25 minutes, separated by short breaks.
            </div>
            <ul className="list-disc text-gray-600 text-left pl-5 mb-4">
              <li>Pick a plant and set your time</li>
              <li>Stay focused while your plant grows</li>
              <li>When the timer ends, your plant is fully grown!</li>
            </ul>
            <Button
              variant="contained"
              onClick={() => setShowInfoModal(false)}
              sx={{ background: '#4e8067', color: 'white', fontWeight: 600, mt: 2 }}
              fullWidth
            >
              Got it!
            </Button>
          </div>
        </div>
      </Fade>
    </Modal>
  );

  // Leave warning modal
  const LeaveWarningModal = (
    <Modal open={showLeaveModal} aria-labelledby="leave-modal-title">
      <Fade in={showLeaveModal}>
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-[95%] flex flex-col items-center">
            <div className="text-lg font-bold text-[#4e8067] mb-2 text-center">
              Are you sure you want to leave?
            </div>
            <div className="text-gray-600 mb-6 text-center">
              You will lose your current Pomodoro progress.
            </div>
            <div className="flex gap-4 mt-2">
              <Button
                variant="outlined"
                onClick={() => {
                  setShowLeaveModal(false);
                  setPendingNavigation(null);
                }}
                sx={{ color: '#4e8067', borderColor: '#4e8067', fontWeight: 600 }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={() => {
                  setShowLeaveModal(false);
                  if (pendingNavigation) pendingNavigation();
                  else navigate(-1);
                }}
                sx={{ background: '#4e8067', color: 'white', fontWeight: 600 }}
              >
                Leave
              </Button>
            </div>
          </div>
        </div>
      </Fade>
    </Modal>
  );

  return (
    <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-[#f9f9f9] via-[#a8d5bb] to-[#9ccdae] relative overflow-hidden">
      {/* Header */}
      <div className="w-full flex items-center justify-between px-6 py-4 bg-white shadow-md mb-8">
        <IconButton
          className="bg-[#e8f5ea] mr-2"
          onClick={() => {
            if (isActive && !isPaused && time > 0) {
              setShowLeaveModal(true);
              setPendingNavigation(() => () => navigate(-1));
            } else {
              navigate(-1);
            }
          }}
        >
          <ArrowBackIcon style={{ color: '#4e8067' }} />
        </IconButton>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#4e8067] font-nunito">Pomodoro Timer</span>
          <IconButton
            className="bg-[#e8f5ea]"
            onClick={() => setShowInfoModal(true)}
          >
            <InfoOutlinedIcon style={{ color: '#4e8067' }} />
          </IconButton>
        </div>
        <div className="w-10" />
      </div>

      {PlantSelectionModal}
      {InfoModal}
      {LeaveWarningModal}

      {/* Affirming Messages */}
      <AnimatePresence>
        {showAffirm && (
          <motion.div
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.9 }}
            className="absolute top-28 left-1/2 -translate-x-1/2 z-40"
          >
            <div className="bg-gradient-to-r from-[#4e8067] to-[#3d6a52] rounded-full px-6 py-3 shadow-lg border-2 border-[#2d5341]">
              <p className="text-base font-semibold text-white text-center">
                {affirmMessage}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Circular Timer */}
      <div className="relative flex flex-col items-center justify-center flex-1">
        <div className="relative flex items-center justify-center">
          {/* Main Circle */}
          <div className="w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#e8f5ea] to-[#b4ddc8] shadow-2xl flex flex-col items-center justify-center relative">
            {/* Plant Animation */}
            {selectedPlant && plantStages.length > 0 && (
              <motion.img
                key={stage}
                src={plantStages[stage]}
                alt={`Plant stage ${stage + 1}`}
                className="w-48 h-48 object-contain mx-auto mb-4"
                initial={{ scale: 0.95, opacity: 0.7 }}
                animate={{ scale: [1, 1.07, 1], opacity: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: "loop" }}
              />
            )}
            {/* Timer */}
            <div className="text-5xl font-bold text-[#4e8067] font-nunito mb-6 select-none">
              {formatTime(time)}
            </div>
            {/* Controls */}
            <div className="flex flex-row items-center justify-center gap-8">
              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
                <span
                  onClick={toggleStartPause}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                >
                  {isActive && !isPaused ?
                    <PauseIcon fontSize="large" className="text-[#4e8067]" style={{ fontSize: 44 }} /> :
                    <PlayArrowIcon fontSize="large" className="text-[#4e8067]" style={{ fontSize: 44 }} />
                  }
                </span>
              </motion.div>
              <motion.div whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.95 }}>
                <span
                  onClick={resetTimer}
                  className="cursor-pointer"
                  role="button"
                  tabIndex={0}
                >
                  <ReplayIcon fontSize="large" className="text-[#4e8067]" style={{ fontSize: 44 }} />
                </span>
              </motion.div>
            </div>
          </div>
        </div>
      </div>

      {/* Volume Control - Simplified */}
      <div className="flex items-center justify-center gap-4 mb-8 w-[90%] max-w-md px-6 py-4">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsMuted(!isMuted)}
          className="transition-all bg-transparent border-none p-0"
        >
          {isMuted ? (
            <VolumeOffIcon style={{ color: '#4e8067', fontSize: 28 }} />
          ) : (
            <VolumeUpIcon style={{ color: '#4e8067', fontSize: 28 }} />
          )}
        </motion.button>
        <Slider
          value={musicVolume}
          onChange={(e, newValue) => setMusicVolume(newValue)}
          disabled={isMuted}
          min={0}
          max={100}
          className="flex-1"
          sx={{
            color: '#4e8067',
            '& .MuiSlider-thumb': {
              backgroundColor: '#4e8067',
              boxShadow: '0 2px 8px rgba(78, 128, 103, 0.4)',
              '&:hover': {
                boxShadow: '0 2px 12px rgba(78, 128, 103, 0.6)',
              }
            },
            '& .MuiSlider-track': {
              background: '#4e8067',
              borderRadius: '4px',
              height: '6px',
            },
            '& .MuiSlider-rail': {
              backgroundColor: '#d0e8dd',
              borderRadius: '4px',
              height: '6px',
            },
          }}
        />
        <span className="text-sm text-[#4e8067] font-medium w-12 text-right">
          {isMuted ? '0%' : `${musicVolume}%`}
        </span>
      </div>

               {/* Notifications */}
        <Snackbar
          open={showAlert}
          autoHideDuration={4000}
          onClose={() => setShowAlert(false)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          sx={{
            '& .MuiPaper-root': {
              position: 'fixed !important',
              top: '20px !important',
              left: '50% !important',
              right: 'auto !important',
              transform: 'translateX(-50%)',
              width: 'auto',
            }
          }}
        >
          <Alert
            onClose={() => setShowAlert(false)}
            severity={alertType}
            sx={{ width: '100%', fontWeight: 500, background: '#4e8067', color: 'white', fontFamily: 'Nunito, sans-serif' }}
          >
            {alertMessage}
          </Alert>
        </Snackbar>
    </div>
  );
};

export default Pomodoro;