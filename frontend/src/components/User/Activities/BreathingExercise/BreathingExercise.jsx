import React, { useEffect, useState, useRef } from 'react';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeMuteIcon from '@mui/icons-material/VolumeMute';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import PauseIcon from '@mui/icons-material/Pause';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import TimerIcon from '@mui/icons-material/Timer';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import Modal from '@mui/material/Modal';
import Box from '@mui/material/Box';
import { motion, AnimatePresence } from 'framer-motion';
import ProgressModal from './ProgressModal';
import CompletionModal from './CompletionModal';

// Local music options
const MUSIC_OPTIONS = [
  {
    id: 'lofi',
    name: 'Pixel Lofi Café',
    src: '/music/lofi-chill.mp3',
    color: '#a3c9a8'
  },
  {
    id: 'ambience',
    name: 'Dreamscape Ambience',
    src: '/music/ambience.mp3',
    color: '#b8d8d8'
  },
  {
    id: 'nature',
    name: 'Mystic Nature Walk',
    src: '/music/nature.mp3',
    color: '#d5e8d4'
  },
  {
    id: 'rain',
    name: 'Retro Rain Arcade',
    src: '/music/rain.mp3',
    color: '#b3cde0'
  }
];

const BreathingExercise = () => {
  const breathingTechniques = [
    {
      id: 'box',
      name: 'Box Breathing',
      description: 'Navy SEAL technique for stress reduction and improved focus',
      benefits: ['Reduces stress and anxiety', 'Improves concentration', 'Lowers blood pressure', 'Enhances mental clarity'],
      phases: ['Breathe In', 'Hold', 'Breathe Out', 'Hold'],
      durations: [4, 4, 4, 4],
      color: '#64aa86',
      difficulty: 'Beginner',
      icon: '⬜',
      cycleTime: 16
    },
    {
      id: '478',
      name: '4-7-8 Breathing',
      description: 'Dr. Weil\'s technique for better sleep and anxiety relief',
      benefits: ['Promotes better sleep', 'Reduces anxiety', 'Calms nervous system', 'Helps with insomnia'],
      phases: ['Inhale', 'Hold', 'Exhale'],
      durations: [4, 7, 8],
      color: '#5a9edb',
      difficulty: 'Intermediate',
      icon: '🌙',
      cycleTime: 19
    },
    {
      id: 'diaphragmatic',
      name: 'Diaphragmatic Breathing',
      description: 'Deep belly breathing for stress relief and better oxygen flow',
      benefits: ['Strengthens diaphragm', 'Reduces oxygen demand', 'Improves core stability', 'Enhances relaxation'],
      phases: ['Inhale', 'Exhale'],
      durations: [4, 6],
      color: '#9c75d5',
      difficulty: 'Beginner',
      icon: '🫁',
      cycleTime: 10
    }
  ];

  const durationOptions = [
    { value: 1, label: '1 min', cycles: 4 },
    { value: 2, label: '2 min', cycles: 8 },
    { value: 3, label: '3 min', cycles: 12 },
    { value: 5, label: '5 min', cycles: 20 },
    { value: 10, label: '10 min', cycles: 40 }
  ];

  const [selectedTechnique, setSelectedTechnique] = useState(breathingTechniques[0]);
  const [selectedDuration, setSelectedDuration] = useState(durationOptions[1]);
  const [phase, setPhase] = useState('Breathe In');
  const [count, setCount] = useState(4);
  const [isMuted, setIsMuted] = useState(false);
  const [isMusicPaused, setIsMusicPaused] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completedCycles, setCompletedCycles] = useState(0);
  const [totalCycles, setTotalCycles] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [streak, setStreak] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [volume, setVolume] = useState(0.3);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [techniqueProgress, setTechniqueProgress] = useState({});
  const [selectedMusic, setSelectedMusic] = useState(MUSIC_OPTIONS[0]);
  const audioRef = useRef(null);
  const intervalRef = useRef(null);
  const timerRef = useRef(null);

  // For continue session feature
  const [canContinue, setCanContinue] = useState(false);
  const [showContinuePrompt, setShowContinuePrompt] = useState(false);
  const [continueData, setContinueData] = useState(null);

  useEffect(() => {
    const fetchProgress = async () => {
      const token = localStorage.getItem('token');
      try {
        const res = await fetch(`${import.meta.env.VITE_NODE_API}/api/activity/breathing/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success && data.progress) {
          setStreak(data.progress.streak || 0);
          setTotalSessions(data.progress.totalSessions || 0);
          setTechniqueProgress(
            (data.progress.techniques || []).reduce((acc, t) => {
              acc[t.techniqueId] = t.sessions;
              return acc;
            }, {})
          );
          const technique = breathingTechniques.find(t => t.id === data.progress.lastSelectedTechnique) || breathingTechniques[0];
          const duration = durationOptions.find(d => d.value === data.progress.lastSelectedDuration) || durationOptions[1];
          setSelectedTechnique(technique);
          setSelectedDuration(duration);
          setElapsedTime(data.progress.lastSessionElapsedTime || 0);

          // Check if there is unfinished progress
          const phaseSum = technique.durations.reduce((sum, duration) => sum + duration, 0);
          const totalTime = phaseSum * duration.cycles;
          if (
            data.progress.lastSessionElapsedTime > 0 &&
            data.progress.lastSessionElapsedTime < totalTime
          ) {
            setCanContinue(true);
            setShowContinuePrompt(true);
            setContinueData({
              technique,
              duration,
              elapsedTime: data.progress.lastSessionElapsedTime,
              sessionStartTime: data.progress.lastSessionStartTime
            });
          }
        }
      } catch (err) {
        // fallback: no progress
      }
    };
    fetchProgress();
  }, []);

  useEffect(() => {
    const phaseSum = selectedTechnique.durations.reduce((sum, duration) => sum + duration, 0);
    const totalTime = phaseSum * selectedDuration.cycles;
    setTotalSessionTime(totalTime);
    setTotalCycles(getEstimatedTotalCycles());
  }, [selectedTechnique, selectedDuration]);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);

    if (isActive && !isPaused) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => {
          const newTime = prev + 1;
          const newCompletedCycles = Math.floor(newTime / selectedTechnique.cycleTime);
          setCompletedCycles(newCompletedCycles);
          if (newTime >= totalSessionTime) {
            handleSessionComplete();
            return totalSessionTime;
          }
          return newTime;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isPaused, selectedTechnique.cycleTime, totalSessionTime]);

  useEffect(() => {
    const savePartialProgress = async () => {
      const token = localStorage.getItem('token');
      await fetch(`${import.meta.env.VITE_NODE_API}/api/activity/breathing/progress`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          streak,
          totalSessions,
          lastSession: new Date(),
          techniques: Object.entries(techniqueProgress).map(([techniqueId, sessions]) => ({
            techniqueId,
            sessions
          })),
          lastSelectedTechnique: selectedTechnique.id,
          lastSelectedDuration: selectedDuration.value,
          lastSessionStartTime: sessionStartTime,
          lastSessionElapsedTime: elapsedTime
        })
      });
    };

    // Save progress every time elapsedTime changes
    if (isActive) {
      savePartialProgress();
    }

    // Save on unmount (user leaves page)
    return () => {
      if (isActive) {
        savePartialProgress();
      }
    };
  }, [elapsedTime, isActive]);

  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);

    if (!isPaused && isActive) {
      intervalRef.current = setInterval(() => {
        setCount((prevCount) => {
          if (prevCount === 1) {
            const nextIndex = (currentPhaseIndex + 1) % selectedTechnique.phases.length;
            setCurrentPhaseIndex(nextIndex);
            setPhase(selectedTechnique.phases[nextIndex]);
            return selectedTechnique.durations[nextIndex];
          }
          return prevCount - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [selectedTechnique, currentPhaseIndex, isPaused, isActive]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
      if (isMusicPaused) {
        audioRef.current.pause();
      } else if (isActive && !isPaused && !isMuted) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isMuted, volume, isActive, isPaused, isMusicPaused, selectedMusic]);

  const getEstimatedTotalCycles = () => {
    const totalSeconds = selectedDuration.value * 60;
    return Math.floor(totalSeconds / selectedTechnique.cycleTime);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const saveProgress = async (newStreak, newTotalSessions, newTechniqueProgress, elapsedTime = 0) => {
    const token = localStorage.getItem('token');
    await fetch(`${import.meta.env.VITE_NODE_API}/api/activity/breathing/progress`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        streak: newStreak,
        totalSessions: newTotalSessions,
        lastSession: new Date(),
        techniques: Object.entries(newTechniqueProgress).map(([techniqueId, sessions]) => ({
          techniqueId,
          sessions
        })),
        lastSelectedTechnique: selectedTechnique.id,
        lastSelectedDuration: selectedDuration.value,
        lastSessionStartTime: sessionStartTime,
        lastSessionElapsedTime: elapsedTime
      })
    });
  };

  const handleSessionComplete = async () => {
    setIsActive(false);
    setIsPaused(false);

    let newStreak = streak;
    const today = new Date().toDateString();
    const lastSession = sessionStartTime ? new Date(sessionStartTime).toDateString() : null;
    if (lastSession !== today) {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      if (lastSession === yesterday.toDateString()) {
        newStreak += 1;
      } else {
        newStreak = 1;
      }
    }

    const newTechniqueProgress = { ...techniqueProgress };
    newTechniqueProgress[selectedTechnique.id] = (newTechniqueProgress[selectedTechnique.id] || 0) + 1;

    const newTotalSessions = totalSessions + 1;
    setStreak(newStreak);
    setTotalSessions(newTotalSessions);
    setTechniqueProgress(newTechniqueProgress);

    await saveProgress(newStreak, newTotalSessions, newTechniqueProgress, elapsedTime);

    setShowCompletionModal(true);

    if (audioRef.current) audioRef.current.pause();
  };

  const startSession = () => {
    setIsActive(true);
    setIsPaused(false);
    setCompletedCycles(0);
    setTotalCycles(getEstimatedTotalCycles());
    setSessionStartTime(new Date());
    setCurrentPhaseIndex(0);
    setPhase(selectedTechnique.phases[0]);
    setCount(selectedTechnique.durations[0]);
    setElapsedTime(0);
    setIsMusicPaused(false);
    if (audioRef.current && !isMuted) {
      audioRef.current.play().catch(() => {});
    }
  };

  const continueSession = () => {
    if (continueData) {
      setSelectedTechnique(continueData.technique);
      setSelectedDuration(continueData.duration);
      setElapsedTime(continueData.elapsedTime);
      setIsActive(true);
      setIsPaused(false);
      setCompletedCycles(Math.floor(continueData.elapsedTime / continueData.technique.cycleTime));
      setTotalCycles(Math.floor((continueData.duration.value * 60) / continueData.technique.cycleTime));
      setSessionStartTime(new Date());
      setCurrentPhaseIndex(0);
      setPhase(continueData.technique.phases[0]);
      setCount(continueData.technique.durations[0]);
      setIsMusicPaused(false);
      setShowContinuePrompt(false);
    }
  };

  const resetSession = () => {
    setIsActive(false);
    setIsPaused(false);
    setCompletedCycles(0);
    setCurrentPhaseIndex(0);
    setPhase(selectedTechnique.phases[0]);
    setCount(selectedTechnique.durations[0]);
    setElapsedTime(0);
    setSessionStartTime(null);
    setShowContinuePrompt(false);
    if (audioRef.current) audioRef.current.pause();
  };

  const changeTechnique = (technique) => {
    if (isActive) resetSession();
    setSelectedTechnique(technique);
    setCurrentPhaseIndex(0);
    setPhase(technique.phases[0]);
    setCount(technique.durations[0]);
  };

  const changeDuration = (duration) => {
    if (isActive) resetSession();
    setSelectedDuration(duration);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioRef.current) {
      audioRef.current.volume = !isMuted ? 0 : volume;
      if (!isMuted && isActive && !isPaused && !isMusicPaused) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const toggleMusicPause = () => {
    setIsMusicPaused(!isMusicPaused);
    if (audioRef.current) {
      if (!isMusicPaused) {
        audioRef.current.pause();
      } else if (isActive && !isPaused && !isMuted) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const handleVolumeChange = (newVolume) => {
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted && newVolume > 0) {
      setIsMuted(false);
    }
  };

  const handleMusicChange = (music) => {
    setSelectedMusic(music);
    setIsMusicPaused(false);
    if (audioRef.current) {
      audioRef.current.load();
      if (isActive && !isPaused && !isMuted) {
        audioRef.current.play().catch(() => {});
      }
    }
  };

  const togglePause = () => {
    if (!isActive) return;
    if (isPaused) {
      setIsPaused(false);
      if (audioRef.current && !isMuted && !isMusicPaused) {
        audioRef.current.play().catch(() => {});
      }
    } else {
      setIsPaused(true);
      if (audioRef.current) audioRef.current.pause();
    }
  };

  const progressPercentage = totalSessionTime > 0 ? (elapsedTime / totalSessionTime) * 100 : 0;
  const cycleProgressPercentage = totalCycles > 0 ? (completedCycles / totalCycles) * 100 : 0;

  const updatedDurationOptions = durationOptions.map(duration => ({
    ...duration,
    estimatedCycles: Math.floor((duration.value * 60) / selectedTechnique.cycleTime)
  }));

  const renderBreathingVisualization = () => {
    const techniqueColor = selectedTechnique.color;
    if (selectedTechnique.id === 'box') {
      return (
        <motion.div 
          className="w-full max-w-md h-80 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-72 h-72 mx-auto border-4 rounded-2xl relative flex items-center justify-center shadow-lg"
               style={{ borderColor: techniqueColor, backgroundColor: `${techniqueColor}10` }}>
            <motion.p 
              className="absolute -top-16 text-xl font-bold"
              animate={{ 
                scale: currentPhaseIndex === 1 ? 1.2 : 1,
                color: currentPhaseIndex === 1 ? techniqueColor : '#b1b1b1'
              }}
              transition={{ duration: 0.3 }}
            >
              Hold
            </motion.p>
            <motion.p 
              className="absolute -right-20 top-1/2 transform -translate-y-1/2 text-xl font-bold"
              animate={{ 
                scale: currentPhaseIndex === 2 ? 1.2 : 1,
                color: currentPhaseIndex === 2 ? techniqueColor : '#b1b1b1'
              }}
              transition={{ duration: 0.3 }}
            >
              Exhale
            </motion.p>
            <motion.p 
              className="absolute -bottom-16 text-xl font-bold"
              animate={{ 
                scale: currentPhaseIndex === 3 ? 1.2 : 1,
                color: currentPhaseIndex === 3 ? techniqueColor : '#b1b1b1'
              }}
              transition={{ duration: 0.3 }}
            >
              Hold
            </motion.p>
            <motion.p 
              className="absolute -left-20 top-1/2 transform -translate-y-1/2 text-xl font-bold"
              animate={{ 
                scale: currentPhaseIndex === 0 ? 1.2 : 1,
                color: currentPhaseIndex === 0 ? techniqueColor : '#b1b1b1'
              }}
              transition={{ duration: 0.3 }}
            >
              Inhale
            </motion.p>
            <motion.div 
              className="absolute w-6 h-6 rounded-full shadow-lg"
              style={{ backgroundColor: techniqueColor }}
              animate={{
                top: currentPhaseIndex === 0 ? '50%' : 
                     currentPhaseIndex === 1 ? '0%' :
                     currentPhaseIndex === 2 ? '50%' : '100%',
                left: currentPhaseIndex === 0 ? '0%' : 
                      currentPhaseIndex === 1 ? '50%' :
                      currentPhaseIndex === 2 ? '100%' : '50%',
              }}
              transition={{ duration: 0.7, ease: "easeInOut" }}
            >
            </motion.div>
            <div className="bg-white bg-opacity-95 px-8 py-6 rounded-2xl shadow-xl">
              <motion.p 
                className="text-6xl font-bold text-center"
                style={{ color: techniqueColor }}
                key={count}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {count}
              </motion.p>
              <p className="text-lg text-center mt-2" style={{ color: techniqueColor }}>
                {phase}
              </p>
            </div>
          </div>
        </motion.div>
      );
    }
    if (selectedTechnique.id === '478') {
      return (
        <motion.div 
          className="w-full max-w-md h-80 relative"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="w-72 h-72 mx-auto relative flex items-center justify-center">
            <motion.div 
              className="w-60 h-60 rounded-full border-4 flex items-center justify-center shadow-lg"
              style={{ 
                borderColor: techniqueColor,
                backgroundColor: `${techniqueColor}10`
              }}
              animate={{
                scale: currentPhaseIndex === 0 ? 1.1 : 
                       currentPhaseIndex === 1 ? 1.2 : 0.9
              }}
              transition={{ duration: 1, ease: "easeInOut" }}
            >
              <motion.p 
                className="absolute -top-16 text-xl font-bold"
                animate={{ 
                  scale: currentPhaseIndex === 1 ? 1.2 : 1,
                  color: currentPhaseIndex === 1 ? techniqueColor : '#b1b1b1'
                }}
                transition={{ duration: 0.3 }}
              >
                Hold
              </motion.p>
              <motion.p 
                className="absolute -left-20 top-1/2 transform -translate-y-1/2 text-xl font-bold"
                animate={{ 
                  scale: currentPhaseIndex === 0 ? 1.2 : 1,
                  color: currentPhaseIndex === 0 ? techniqueColor : '#b1b1b1'
                }}
                transition={{ duration: 0.3 }}
              >
                Inhale
              </motion.p>
              <motion.p 
                className="absolute -right-20 top-1/2 transform -translate-y-1/2 text-xl font-bold"
                animate={{ 
                  scale: currentPhaseIndex === 2 ? 1.2 : 1,
                  color: currentPhaseIndex === 2 ? techniqueColor : '#b1b1b1'
                }}
                transition={{ duration: 0.3 }}
              >
                Exhale
              </motion.p>
              <div className="bg-white bg-opacity-95 px-8 py-6 rounded-2xl shadow-xl">
                <motion.p 
                  className="text-6xl font-bold text-center"
                  style={{ color: techniqueColor }}
                  key={count}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {count}
                </motion.p>
                <p className="text-lg text-center mt-2" style={{ color: techniqueColor }}>
                  {phase}
                </p>
              </div>
            </motion.div>
          </div>
        </motion.div>
      );
    }
    return (
      <motion.div 
        className="w-full max-w-md h-80 relative"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="w-72 h-72 mx-auto relative flex items-center justify-center">
          <motion.div 
            className="w-60 h-40 rounded-full border-4 flex items-center justify-center shadow-lg"
            style={{ 
              borderColor: techniqueColor,
              backgroundColor: `${techniqueColor}10`
            }}
            animate={{
              scaleY: currentPhaseIndex === 0 ? 1.3 : 0.8,
              scaleX: currentPhaseIndex === 0 ? 1.1 : 1
            }}
            transition={{ duration: 1, ease: "easeInOut" }}
          >
            <motion.p 
              className="absolute -left-20 top-1/2 transform -translate-y-1/2 text-xl font-bold"
              animate={{ 
                scale: currentPhaseIndex === 0 ? 1.2 : 1,
                color: currentPhaseIndex === 0 ? techniqueColor : '#b1b1b1'
              }}
              transition={{ duration: 0.3 }}
            >
              Inhale
            </motion.p>
            <motion.p 
              className="absolute -right-20 top-1/2 transform -translate-y-1/2 text-xl font-bold"
              animate={{ 
                scale: currentPhaseIndex === 1 ? 1.2 : 1,
                color: currentPhaseIndex === 1 ? techniqueColor : '#b1b1b1'
              }}
              transition={{ duration: 0.3 }}
            >
              Exhale
            </motion.p>
            <div className="bg-white bg-opacity-95 px-8 py-6 rounded-2xl shadow-xl">
              <motion.p 
                className="text-6xl font-bold text-center"
                style={{ color: techniqueColor }}
                key={count}
                initial={{ scale: 1.2 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                {count}
              </motion.p>
              <p className="text-lg text-center mt-2" style={{ color: techniqueColor }}>
                {phase}
              </p>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="bg-gradient-to-br from-[#2c3e50] via-[#3498db] to-[#9b59b6] min-h-screen flex flex-col items-center py-8 px-4 relative">
      {/* Continue Session Modal */}
      {showContinuePrompt && (
        <Modal open={showContinuePrompt} onClose={() => setShowContinuePrompt(false)}>
          <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-2xl shadow-2xl w-96">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Continue Session?</h2>
            <p className="mb-6 text-gray-700">
              You have an unfinished breathing session. Would you like to continue where you left off or start a new session?
            </p>
            <div className="flex justify-end gap-4">
              <button
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700"
                onClick={continueSession}
              >
                Continue
              </button>
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg font-bold hover:bg-gray-400"
                onClick={resetSession}
              >
                Start Over
              </button>
            </div>
          </Box>
        </Modal>
      )}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full"></div>
        <div className="absolute bottom-20 right-20 w-24 h-24 bg-white rounded-full"></div>
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-white rounded-full"></div>
      </div>
      <motion.div 
        className="w-full max-w-6xl flex justify-between items-center mb-8 relative z-10"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">Breathing Exercises</h1>
          <p className="text-white/80 text-lg">Reduce stress and improve focus with guided breathing</p>
        </div>
        <div className="flex space-x-3">
          <motion.button 
            onClick={() => setShowProgressModal(true)}
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <TrendingUpIcon style={{ color: 'white', fontSize: 24 }} />
          </motion.button>
          <motion.button 
            onClick={() => setShowModal(true)}
            className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-all backdrop-blur-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <HelpOutlineIcon style={{ color: 'white', fontSize: 24 }} />
          </motion.button>
        </div>
      </motion.div>
      <motion.div 
        className="w-full max-w-6xl mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-white font-bold text-xl mb-4 flex items-center">
            <TimerIcon className="mr-2" />
            Session Duration
          </h3>
          <div className="grid grid-cols-5 gap-3">
            {updatedDurationOptions.map(duration => (
              <motion.button 
                key={duration.value}
                onClick={() => changeDuration(duration)}
                className={`p-4 rounded-xl transition-all duration-300 ${
                  selectedDuration.value === duration.value 
                    ? 'bg-white shadow-lg text-gray-800' 
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                disabled={isActive}
                whileHover={{ scale: isActive ? 1 : 1.05 }}
                whileTap={{ scale: isActive ? 1 : 0.95 }}
              >
                <div className="text-2xl font-bold">{duration.label}</div>
                <div className="text-sm opacity-80">~{duration.estimatedCycles} cycles</div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
      <motion.div 
        className="w-full max-w-6xl mb-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6">
          <h3 className="text-white font-bold text-xl mb-4">Choose Your Technique</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {breathingTechniques.map(technique => (
              <motion.button 
                key={technique.id}
                onClick={() => changeTechnique(technique)}
                className={`p-6 rounded-xl transition-all duration-300 text-left ${
                  selectedTechnique.id === technique.id 
                    ? 'bg-white shadow-xl' 
                    : 'bg-white/20 hover:bg-white/30'
                }`}
                disabled={isActive}
                whileHover={{ scale: isActive ? 1 : 1.02 }}
                whileTap={{ scale: isActive ? 1 : 0.98 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl">{technique.icon}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                    selectedTechnique.id === technique.id ? 'bg-gray-100 text-gray-800' : 'bg-white/20 text-white'
                  }`}>
                    {technique.difficulty}
                  </span>
                </div>
                <h4 className={`font-bold text-lg mb-2 ${
                  selectedTechnique.id === technique.id ? 'text-gray-800' : 'text-white'
                }`}>
                  {technique.name}
                </h4>
                <p className={`text-sm ${
                  selectedTechnique.id === technique.id ? 'text-gray-600' : 'text-white/80'
                }`}>
                  {technique.description}
                </p>
                <div className="mt-3 h-1 w-full rounded-full bg-gray-200">
                  <div 
                    className="h-1 rounded-full transition-all duration-300" 
                    style={{ 
                      backgroundColor: technique.color,
                      width: selectedTechnique.id === technique.id ? '100%' : '0%'
                    }} 
                  />
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
      <motion.div 
        className="w-full max-w-6xl bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-8 mb-6 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <motion.button
          onClick={() => setShowInfo(!showInfo)}
          className="absolute bottom-6 right-6 w-12 h-12 rounded-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors shadow-lg"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
        >
          <InfoOutlinedIcon style={{ color: selectedTechnique.color, fontSize: 24 }} />
        </motion.button>
        <div className="flex flex-col sm:flex-row justify-between items-start mb-6">
          <div>
            <p className="text-gray-500 text-sm">Current Exercise</p>
            <h2 className="text-3xl font-bold flex items-center" style={{ color: selectedTechnique.color }}>
              <span className="mr-3 text-4xl">{selectedTechnique.icon}</span>
              {selectedTechnique.name}
            </h2>
          </div>
          <div className="flex space-x-3 mt-4 sm:mt-0">
            {!isActive ? (
              <motion.button 
                onClick={startSession}
                className="px-6 py-3 rounded-full flex items-center font-bold text-white shadow-lg"
                style={{ backgroundColor: selectedTechnique.color }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <PlayArrowIcon className="mr-2" />
                Start Session
              </motion.button>
            ) : (
              <>
                <motion.button 
                  onClick={togglePause}
                  className="px-4 py-2 rounded-full flex items-center font-medium text-white"
                  style={{ backgroundColor: selectedTechnique.color }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isPaused ? <PlayArrowIcon className="mr-1" /> : <PauseIcon className="mr-1" />}
                  {isPaused ? "Resume" : "Pause"}
                </motion.button>
                <motion.button 
                  onClick={resetSession}
                  className="px-4 py-2 rounded-full flex items-center font-medium bg-gray-500 text-white"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RestartAltIcon className="mr-1" />
                  Reset
                </motion.button>
              </>
            )}
          </div>
        </div>
        <AnimatePresence>
          {showInfo && (
            <motion.div 
              className="mb-8 p-6 bg-gray-50 rounded-xl"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h3 className="font-bold text-xl mb-3" style={{ color: selectedTechnique.color }}>
                About {selectedTechnique.name}
              </h3>
              <p className="text-gray-700 mb-4">{selectedTechnique.description}</p>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-bold mb-2 text-gray-800">Benefits:</h4>
                  <ul className="list-disc pl-5 text-gray-700">
                    {selectedTechnique.benefits.map((benefit, index) => (
                      <li key={index} className="mb-1">{benefit}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="font-bold mb-2 text-gray-800">Instructions:</h4>
                  <div className="text-gray-700">
                    {selectedTechnique.phases.map((phase, index) => (
                      <div key={index} className="flex items-center mb-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold mr-3"
                          style={{ backgroundColor: selectedTechnique.color }}
                        >
                          {index + 1}
                        </div>
                        <span>{phase} for {selectedTechnique.durations[index]} seconds</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      <strong>Cycle Time:</strong> {selectedTechnique.cycleTime} seconds per complete cycle
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div className="flex justify-center items-center py-12">
          {renderBreathingVisualization()}
        </div>
      </motion.div>
      {(isActive || completedCycles > 0) && (
        <motion.div 
          className="w-full max-w-6xl mb-8"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {formatTime(elapsedTime)}
                </div>
                <div className="text-white/80 text-sm">
                  of {formatTime(totalSessionTime)}
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white mb-1">
                  {completedCycles} / {totalCycles}
                </div>
                <div className="text-white/80 text-sm">Cycles Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-white mb-1">
                  {phase}
                </div>
                <div className="text-white/80 text-sm">Current Phase</div>
              </div>
            </div>
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Time Progress</span>
                <span className="text-white/80">{Math.round(progressPercentage)}%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-3">
                <motion.div 
                  className="h-3 rounded-full"
                  style={{ backgroundColor: selectedTechnique.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-white font-medium">Cycle Progress</span>
                <span className="text-white/80">{Math.round(cycleProgressPercentage)}%</span>
              </div>
              <div className="w-full bg-white/30 rounded-full h-3">
                <motion.div 
                  className="h-3 rounded-full opacity-80"
                  style={{ backgroundColor: selectedTechnique.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(cycleProgressPercentage, 100)}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>
        </motion.div>
      )}
      <motion.div 
        className="w-full max-w-6xl bg-gradient-to-r from-white/20 to-white/10 backdrop-blur-sm rounded-2xl border border-white/30 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center">
              <motion.div 
                className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mr-4"
                animate={{ 
                  scale: isActive && !isPaused && !isMuted && !isMusicPaused ? [1, 1.1, 1] : 1
                }}
                transition={{ 
                  duration: 2, 
                  repeat: isActive && !isPaused && !isMuted && !isMusicPaused ? Infinity : 0,
                  ease: "easeInOut"
                }}
              >
                <MusicNoteIcon style={{ color: 'white', fontSize: 24 }} />
              </motion.div>
              <div>
                <h3 className="text-white font-bold text-lg">Background Audio</h3>
                <p className="text-white/70 text-sm">Relaxing sounds to enhance your practice</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-white/80 text-sm font-medium min-w-[3rem] text-right">
                {Math.round(volume * 100)}%
              </div>
              <motion.button 
                onClick={toggleMute}
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMuted ? 
                  <VolumeMuteIcon style={{ color: 'white', fontSize: 24 }} /> : 
                  <VolumeUpIcon style={{ color: 'white', fontSize: 24 }} />
                }
              </motion.button>
              <motion.button
                onClick={toggleMusicPause}
                className="w-12 h-12 rounded-full bg-white/20 hover:bg-white/30 transition-all flex items-center justify-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {isMusicPaused ? 
                  <PlayArrowIcon style={{ color: 'white', fontSize: 24 }} /> : 
                  <PauseIcon style={{ color: 'white', fontSize: 24 }} />
                }
              </motion.button>
            </div>
          </div>
          <div className="flex items-center gap-4 mb-4">
            <span className="text-white/80 font-medium">Choose Music:</span>
            {MUSIC_OPTIONS.map(music => (
              <button
                key={music.id}
                onClick={() => handleMusicChange(music)}
                className={`px-4 py-2 rounded-full font-semibold transition-colors ${
                  selectedMusic.id === music.id
                    ? 'bg-white text-gray-800 shadow'
                    : 'bg-white/20 text-white hover:bg-white/30'
                }`}
                style={{ border: selectedMusic.id === music.id ? `2px solid ${music.color}` : 'none' }}
              >
                {music.name}
              </button>
            ))}
          </div>
          <div className="relative">
            <div className="flex items-center space-x-4">
              <span className="text-white/60 text-sm">0%</span>
              <div className="flex-1 relative">
                <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full rounded-full"
                    style={{ 
                      background: `linear-gradient(90deg, ${selectedTechnique.color}40, ${selectedTechnique.color})`,
                      width: `${volume * 100}%`
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${volume * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05" 
                  value={volume}
                  onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <motion.div 
                  className="absolute top-1/2 w-6 h-6 bg-white rounded-full shadow-lg pointer-events-none transform -translate-y-1/2"
                  style={{ 
                    left: `calc(${volume * 100}% - 12px)`,
                    boxShadow: `0 2px 8px ${selectedTechnique.color}40`
                  }}
                  whileHover={{ scale: 1.2 }}
                />
              </div>
              <span className="text-white/60 text-sm">100%</span>
            </div>
            <div className="flex items-center justify-center mt-4">
              <div className="flex items-center space-x-2 bg-white/10 px-4 py-2 rounded-full">
                <div 
                  className="w-2 h-2 rounded-full"
                  style={{ 
                    backgroundColor: isActive && !isPaused && !isMuted && !isMusicPaused ? '#4ade80' : '#6b7280'
                  }}
                />
                <span className="text-white/80 text-sm">
                  {isActive && !isPaused && !isMuted && !isMusicPaused ? 'Playing' : 
                   isMuted ? 'Muted' : 
                   isMusicPaused ? 'Paused' : 
                   isPaused ? 'Session Paused' : 'Ready'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      <Modal open={showModal} onClose={() => setShowModal(false)}>
        <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-8 rounded-2xl shadow-2xl w-11/12 max-w-2xl max-h-[90vh] overflow-y-auto">
          <h2 className="text-3xl font-bold mb-6 text-gray-800">
            How to Use Breathing Exercises
          </h2>
          <div className="space-y-6 text-gray-700">
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Why Practice Breathing Exercises?</h3>
              <p className="mb-3">
                Regular breathing exercises activate your parasympathetic nervous system, helping to reduce stress hormones, 
                lower blood pressure, and improve overall mental well-being.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Technique Benefits:</h3>
              <div className="grid gap-4">
                {breathingTechniques.map(technique => (
                  <div key={technique.id} className="flex items-start p-4 bg-gray-50 rounded-lg">
                    <span className="text-2xl mr-3">{technique.icon}</span>
                    <div>
                      <h4 className="font-bold" style={{ color: technique.color }}>{technique.name}</h4>
                      <p className="text-sm text-gray-600">{technique.description}</p>
                      <p className="text-xs text-gray-500 mt-1">{technique.cycleTime} seconds per cycle</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold mb-3 text-gray-800">Getting Started:</h3>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Choose a comfortable, quiet location</li>
                <li>Sit upright with your shoulders relaxed</li>
                <li>Select your preferred technique and duration</li>
                <li>Follow the visual guide and breathing prompts</li>
                <li>Practice regularly for best results</li>
              </ol>
            </div>
          </div>
          <div className="mt-8 flex justify-end">
            <button 
              onClick={() => setShowModal(false)}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
            >
              Got it!
            </button>
          </div>
        </Box>
      </Modal>
      <ProgressModal 
        open={showProgressModal}
        onClose={() => setShowProgressModal(false)}
        streak={streak}
        totalSessions={totalSessions}
        techniques={breathingTechniques}
        techniqueProgress={techniqueProgress}
      />
      <CompletionModal 
        open={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        technique={selectedTechnique}
        duration={selectedDuration}
        streak={streak}
        onRestartSession={startSession}
        onViewProgress={() => {
          setShowCompletionModal(false);
          setShowProgressModal(true);
        }}
      />
      <audio ref={audioRef} src={selectedMusic.src} loop />
    </div>
  );
};

export default BreathingExercise;