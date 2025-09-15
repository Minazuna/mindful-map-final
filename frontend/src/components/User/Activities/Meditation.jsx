import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Typography, Button, IconButton, Slider,
  CircularProgress, Tooltip, Paper, Snackbar, Alert
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import TimerIcon from '@mui/icons-material/Timer';
import HomeIcon from '@mui/icons-material/Home';
import { styled } from '@mui/material/styles';

// Styled components
const GlassPanel = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(12px)',
  borderRadius: 16,
  padding: theme.spacing(3),
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.1)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  fontFamily: 'Nunito, sans-serif',
}));

const StyledIconButton = styled(IconButton, {
  shouldForwardProp: (prop) => prop !== 'active'
})(({ theme, active }) => ({
  background: active ? 'rgba(79, 195, 247, 0.4)' : 'rgba(255, 255, 255, 0.2)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
  color: 'white',
  margin: theme.spacing(0, 1),
  '&:hover': {
    background: active ? 'rgba(79, 195, 247, 0.6)' : 'rgba(255, 255, 255, 0.3)',
  },
}));

// Gentle nurturing female voice
const speak = (text, onEnd = () => {}) => {
  if (!window.speechSynthesis) return null;
  
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.78; // Slow, gentle pace
  utterance.pitch = 1.12; // Slightly higher, more nurturing tone
  
  const voices = window.speechSynthesis.getVoices();
  const femaleVoices = [
    ...voices.filter(v => v.name.includes('Samantha') || v.name.includes('Moira')),
    ...voices.filter(v => v.name.includes('Female') && v.lang.includes('en')),
    ...voices.filter(v => v.lang.includes('en-US')),
  ];
  
  if (femaleVoices.length > 0) utterance.voice = femaleVoices[0];
  utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
  return utterance;
};

const Meditation = () => {
  // State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [meditationTime, setMeditationTime] = useState(5);
  const [remainingTime, setRemainingTime] = useState(0);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [audioErrorMsg, setAudioErrorMsg] = useState("");
  
  // Refs
  const ambientAudioRef = useRef(null);
  const meditationMusicRef = useRef(null);
  const timerRef = useRef(null);
  const promptTimerRef = useRef(null);
  const videoRef = useRef(null);
  
  // Beach meditation configuration
  const beachMeditation = {
    name: 'Serene Shoreline',
    backgroundImage: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=2000',
    videoBackground: 'https://videos.pexels.com/video-files/16639398/16639398-uhd_2560_1440_30fps.mp4',
    // Use reliable public audio sources instead of local files
    ambientSound: '/music/ocean-waves.mp3',
    meditationMusic: '/music/meditation.mp3',
    prompts: [
      "Welcome to your beach meditation. Let's begin by taking a deep breath in through your nose, and slowly out through your mouth.",
      "Feel the warm sun gently touching your skin, bringing comfort and relaxation to your entire body.",
      "Listen to the rhythmic pattern of the waves. Notice how they match the natural rise and fall of your breathing.",
      "Imagine your toes sinking into the soft, warm sand beneath you. Feel it supporting and grounding you in this moment.",
      "With each wave that washes onto the shore, let it carry away your stress and worries, returning them to the vast ocean.",
      "As you breathe in, draw in the peaceful energy of the beach. As you breathe out, release any tension you're holding.",
      "Feel a gentle breeze caressing your face, refreshing and cleansing your mind of any lingering thoughts.",
      "Your body becomes lighter with each breath, floating peacefully like a cloud above the shoreline.",
      "As we conclude this meditation, carry this sense of beach serenity with you throughout your day, knowing you can return anytime."
    ]
  };

  // Setup audio and video
  useEffect(() => {
    const createAudio = (src) => {
      const audio = new Audio(src);
      audio.loop = true;
      return audio;
    };
    
    try {
      ambientAudioRef.current = createAudio(beachMeditation.ambientSound);
      ambientAudioRef.current.volume = 0.7; // Higher volume for ocean waves
      
      meditationMusicRef.current = createAudio(beachMeditation.meditationMusic);
      meditationMusicRef.current.volume = 0.35; // Lower volume for background music
    } catch (err) {
      console.error("Error creating audio:", err);
      setAudioError(true);
    }
    
    const handleAudioError = (e) => {
      console.error("Audio error:", e);
      setAudioError(true);
      setAudioErrorMsg("Audio files not found. Meditation will continue without sound.");
    };
    
    if (ambientAudioRef.current) ambientAudioRef.current.onerror = handleAudioError;
    if (meditationMusicRef.current) meditationMusicRef.current.onerror = handleAudioError;
    
    if (beachMeditation.videoBackground && videoRef.current) {
      videoRef.current.src = beachMeditation.videoBackground;
      videoRef.current.loop = true;
      videoRef.current.muted = true;
      videoRef.current.playsInline = true;
    }
    
    return () => {
      clearAllTimers();
      [ambientAudioRef, meditationMusicRef].forEach(ref => {
        if (ref.current) {
          ref.current.pause();
          ref.current = null;
        }
      });
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, []);

  // Update volumes when changed
  useEffect(() => {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = isMuted ? 0 : (volume / 100) * 0.7;
    }
    if (meditationMusicRef.current) {
      meditationMusicRef.current.volume = isMuted ? 0 : (volume / 100) * 0.35;
    }
  }, [volume, isMuted]);

  const clearAllTimers = () => {
    clearInterval(timerRef.current);
    clearTimeout(promptTimerRef.current);
  };

  // Start meditation
  const startMeditation = () => {
    setIsLoading(true);
    setHasStarted(true);
    
    if (videoRef.current && beachMeditation.videoBackground) {
      videoRef.current.play().catch(err => console.log("Video play failed:", err));
    }
    
    const startMeditationSequence = () => {
      setIsLoading(false);
      setIsPlaying(true);
      setRemainingTime(meditationTime * 60);
      playIntroduction();
    };
    
    // Try to play audio if available, continue regardless
    const audioPromises = [];
    
    if (ambientAudioRef.current && !audioError) {
      audioPromises.push(
        ambientAudioRef.current.play().catch(err => {
          console.log("Ambient audio failed:", err);
          setAudioError(true);
        })
      );
    }
    
    if (meditationMusicRef.current && !audioError) {
      audioPromises.push(
        meditationMusicRef.current.play().catch(err => {
          console.log("Meditation music failed:", err);
        })
      );
    }
    
    // Continue with meditation regardless of audio success
    if (audioPromises.length > 0) {
      Promise.allSettled(audioPromises).finally(startMeditationSequence);
    } else {
      startMeditationSequence();
    }
  };
  
  const playIntroduction = () => {
    timerRef.current = setInterval(() => {
      setRemainingTime(prev => {
        if (prev <= 1) {
          endMeditation();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    speak(
      "Welcome to your beach meditation experience. Find a comfortable position, either sitting or lying down. Let's begin our journey to relaxation.", 
      () => {
        setIntroComplete(true);
        setTimeout(() => playMeditationSequence(), 1000);
      }
    );
  };
  
  const playMeditationSequence = () => {
    let index = 0;
    
    const playNextPrompt = () => {
      if (index < beachMeditation.prompts.length) {
        setCurrentPromptIndex(index);
        setShowPrompt(true);
        
        speak(beachMeditation.prompts[index], () => {
          promptTimerRef.current = setTimeout(() => {
            index++;
            playNextPrompt();
          }, 5000);
        });
      }
    };
    
    playNextPrompt();
  };

  const endMeditation = () => {
    clearAllTimers();
    
    // Fade out both audio tracks
    [ambientAudioRef, meditationMusicRef].forEach(ref => {
      if (ref.current && !audioError) {
        const fadeOut = setInterval(() => {
          if (ref.current && ref.current.volume > 0.05) {
            ref.current.volume -= 0.05;
          } else {
            clearInterval(fadeOut);
            if (ref.current) {
              ref.current.pause();
              ref.current.currentTime = 0;
            }
          }
        }, 100);
      }
    });
    
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    setIsPlaying(false);
    setShowPrompt(false);
    
    speak("Your meditation session is complete. Take a moment to stretch gently and slowly return to your surroundings.");
    
    setTimeout(() => {
      setHasStarted(false);
      setIntroComplete(false);
      setCurrentPromptIndex(0);
    }, 8000);
  };

  // Toggle play/pause
  const togglePlayPause = () => {
    if (!hasStarted) {
      startMeditation();
      return;
    }
    
    if (isPlaying) {
      clearAllTimers();
      if (window.speechSynthesis) window.speechSynthesis.pause();
      if (ambientAudioRef.current && !audioError) ambientAudioRef.current.pause();
      if (meditationMusicRef.current && !audioError) meditationMusicRef.current.pause();
      if (videoRef.current) videoRef.current.pause();
    } else {
      timerRef.current = setInterval(() => {
        setRemainingTime(prev => {
          if (prev <= 1) {
            endMeditation();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      if (window.speechSynthesis) window.speechSynthesis.resume();
      
      if (ambientAudioRef.current && !audioError) {
        ambientAudioRef.current.play().catch(err => {
          console.log("Resume ambient audio failed:", err);
          setAudioError(true);
        });
      }
      
      if (meditationMusicRef.current && !audioError) {
        meditationMusicRef.current.play().catch(err => {
          console.log("Resume meditation music failed:", err);
        });
      }
      
      if (videoRef.current) videoRef.current.play().catch(err => console.log("Video resume failed:", err));
    }
    
    setIsPlaying(!isPlaying);
  };

  // Format time display
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(prev => !prev);
    
    if (ambientAudioRef.current) {
      ambientAudioRef.current.volume = isMuted ? (volume / 100) * 0.7 : 0;
    }
    if (meditationMusicRef.current) {
      meditationMusicRef.current.volume = isMuted ? (volume / 100) * 0.35 : 0;
    }
  };

  // Reset everything
  const handleReset = () => {
    clearAllTimers();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    
    [ambientAudioRef, meditationMusicRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
    
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
    
    setIsPlaying(false);
    setHasStarted(false);
    setIntroComplete(false);
    setShowPrompt(false);
    setCurrentPromptIndex(0);
    setRemainingTime(0);
    setAudioError(false);
    setAudioErrorMsg("");
  };

  const handleCloseError = () => setAudioErrorMsg("");

  return (
    <Box sx={{ height: '100vh', width: '100%', position: 'relative', overflow: 'hidden', fontFamily: 'Nunito, sans-serif' }}>
      {/* Video or static background */}
      {beachMeditation.videoBackground ? (
        <video ref={videoRef} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', zIndex: 0 }} />
      ) : (
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: `url(${beachMeditation.backgroundImage})`, 
                   backgroundSize: 'cover', backgroundPosition: 'center', zIndex: 0 }} />
      )}
      
      {/* Overlay */}
      <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.15)', zIndex: 1 }} />
      
      {/* Main content */}
      <Box sx={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', 
                 alignItems: 'center', justifyContent: 'center', zIndex: 3, padding: 3, position: 'relative' }}>
        
        <Typography variant="h3" component="h1" 
          sx={{ color: 'white', textAlign: 'center', fontWeight: 600, 
                textShadow: '0 2px 15px rgba(0,0,0,0.4)', mb: 2, letterSpacing: '0.5px', 
                fontFamily: 'Nunito, sans-serif' }}>
          Meditation
        </Typography>
        
        <Typography variant="h6" 
          sx={{ color: 'white', textAlign: 'center', mb: 5, maxWidth: 700, fontWeight: 300, 
                textShadow: '0 2px 8px rgba(0,0,0,0.4)', opacity: hasStarted ? 0 : 1, 
                transition: 'opacity 0.5s ease', height: hasStarted ? 0 : 'auto', 
                overflow: 'hidden', fontFamily: 'Nunito, sans-serif' }}>
          Escape to a tranquil shoreline, where gentle waves and warm sunshine guide you to deep relaxation.
        </Typography>
        
        {/* Controls panel */}
        <GlassPanel sx={{ width: '100%', maxWidth: 500, mb: hasStarted ? 4 : 0, opacity: hasStarted ? 1 : 0.9,
                          transform: hasStarted ? 'translateY(0)' : 'translateY(30%)', 
                          transition: 'all 0.5s ease', pointerEvents: isLoading ? 'none' : 'auto' }}>
          {!hasStarted ? (
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ color: 'white', mb: 2, fontFamily: 'Nunito, sans-serif' }}>
                Begin Your Meditation
              </Typography>
              
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ color: 'white', mb: 1, fontFamily: 'Nunito, sans-serif' }}>
                  Duration: {meditationTime} minutes
                </Typography>
                <Slider value={meditationTime} onChange={(_, newValue) => setMeditationTime(newValue)}
                  min={1} max={15} marks={[
                    { value: 1, label: '1m' },
                    { value: 5, label: '5m' },
                    { value: 10, label: '10m' },
                    { value: 15, label: '15m' },
                  ]}
                  sx={{ color: 'white' }}
                />
              </Box>
              
              <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={startMeditation} size="large"
                sx={{ bgcolor: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(10px)', color: 'white',
                      px: 4, py: 1.5, borderRadius: 6, fontFamily: 'Nunito, sans-serif',
                      fontWeight: 600, '&:hover': { bgcolor: 'rgba(255,255,255,0.35)' } }}>
                Begin Meditation
              </Button>
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, width: '100%', justifyContent: 'space-between' }}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TimerIcon sx={{ color: 'white', mr: 1 }} />
                  <Typography sx={{ color: 'white', fontWeight: 'medium', fontSize: '1.2rem', fontFamily: 'Nunito, sans-serif' }}>
                    {formatTime(remainingTime)}
                  </Typography>
                </Box>
                
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <StyledIconButton active={isMuted} onClick={toggleMute}>
                    {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
                  </StyledIconButton>
                  
                  <StyledIconButton active={isPlaying} onClick={togglePlayPause}>
                    {isLoading ? <CircularProgress size={24} sx={{ color: 'white' }} /> : 
                     isPlaying ? <PauseIcon /> : <PlayArrowIcon />}
                  </StyledIconButton>
                  
                  <StyledIconButton onClick={handleReset}>
                    <HomeIcon />
                  </StyledIconButton>
                </Box>
              </Box>
              
              {/* Current prompt */}
              <AnimatePresence>
                {showPrompt && isPlaying && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} 
                    exit={{ opacity: 0 }} transition={{ duration: 0.5 }} style={{ width: '100%' }}>
                    <Typography sx={{ color: 'white', textAlign: 'center', fontStyle: 'italic',
                                      lineHeight: 1.8, fontSize: '1.1rem', textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                                      fontFamily: 'Nunito, sans-serif' }}>
                      {beachMeditation.prompts[currentPromptIndex]}
                    </Typography>
                  </motion.div>
                )}
              </AnimatePresence>
            </Box>
          )}
        </GlassPanel>
      </Box>
      
      {/* Error message */}
      <Snackbar open={!!audioErrorMsg} autoHideDuration={6000} onClose={handleCloseError}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="info" sx={{ width: '100%', fontFamily: 'Nunito, sans-serif' }}>
          {audioErrorMsg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Meditation;