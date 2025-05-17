import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PauseIcon from '@mui/icons-material/Pause';
import SkipNextIcon from '@mui/icons-material/SkipNext';
import SkipPreviousIcon from '@mui/icons-material/SkipPrevious';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import VolumeOffIcon from '@mui/icons-material/VolumeOff';
import DownloadIcon from '@mui/icons-material/Download';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import RepeatIcon from '@mui/icons-material/Repeat';
import ShuffleIcon from '@mui/icons-material/Shuffle';

const songs = [
  { 
    name: 'Boba Date', 
    artist: 'Stream Cafe', 
    file: 'bobadate.mp3',
    coverArt: '/images/boba.png',
    duration: '3:24'
  },
  { 
    name: 'Coffee Time', 
    artist: 'shushubobo', 
    file: 'coffeetime.mp3',
    coverArt: '/images/coffee.png',
    duration: '2:58'
  },
  { 
    name: 'Dango', 
    artist: 'Chillpeach', 
    file: 'dango.mp3',
    coverArt: '/images/dango.png',
    duration: '3:45'
  },
  { 
    name: 'Lollipop', 
    artist: 'THAIBEATS', 
    file: 'lollipop.mp3',
    coverArt: '/images/lollipop.png',
    duration: '3:12'
  },
  { 
    name: 'Latte', 
    artist: 'Lofi Peach', 
    file: 'latte.mp3',
    coverArt: '/images/latte.png',
    duration: '4:05'
  }
];

// Helper function to format time
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const CalmingMusic = () => {
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.7);
  const [favorites, setFavorites] = useState([]);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);
  // Always have visualizer active - no more toggle state
  
  // Refs
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // Set up audio context for visualizer
  useEffect(() => {
    if (!audioRef.current) return;
    
    const audio = audioRef.current;
    audio.volume = volume;
    
    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });

    audio.addEventListener('timeupdate', () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    });
    
    audio.addEventListener('ended', () => {
      if (isRepeat) {
        audio.currentTime = 0;
        audio.play().catch(e => console.log(e));
      } else if (isShuffle) {
        const randomIndex = Math.floor(Math.random() * songs.length);
        handleSongChange(randomIndex);
      } else {
        handleNext();
      }
    });

    return () => {
      audio.removeEventListener('loadedmetadata', () => {});
      audio.removeEventListener('timeupdate', () => {});
      audio.removeEventListener('ended', () => {});
    };
  }, [currentSongIndex, isRepeat, isShuffle]);

  // Enhanced audio visualizer setup - Visualizer is always on
  useEffect(() => {
    if (!audioRef.current || !canvasRef.current) return;

    let analyser;
    
    try {
      // Only create a new AudioContext and MediaElementSource if they don't exist
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      }
      
      analyser = audioContextRef.current.createAnalyser();
      sourceNodeRef.current.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      
      analyser.fftSize = 512; // Increased for more detailed visualization
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
      const ctx = canvas.getContext('2d');
      
      const renderFrame = () => {
        if (!analyser) return;
        
        animationRef.current = requestAnimationFrame(renderFrame);
        
        analyser.getByteFrequencyData(dataArray);
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw improved circular visualizer effect with multiple layers
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 50;
        
        // Draw base circle with gradient
        const baseGradient = ctx.createRadialGradient(centerX, centerY, radius/3, centerX, centerY, radius);
        baseGradient.addColorStop(0, 'rgba(141, 88, 166, 0.1)');
        baseGradient.addColorStop(1, 'rgba(90, 158, 219, 0.05)');
        
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = baseGradient;
        ctx.fill();
        
        // Draw multiple circular layers for a richer visualizer
        const layers = [0.85, 0.7, 0.55];
        layers.forEach((layer, layerIndex) => {
          const layerRadius = radius * layer;
          
          // Draw frequency bars in circular pattern
          for (let i = 0; i < bufferLength; i += 2) { // Skip every other frequency for better visuals
            const amplitude = dataArray[i] / (layerIndex + 1); // Decrease amplitude for inner layers
            const barHeight = amplitude * 0.7;
            const angle = (i * 2 * Math.PI) / bufferLength;
            
            const innerRadius = layerRadius - 5;
            const outerRadius = innerRadius + barHeight / 2;
            
            const x1 = centerX + innerRadius * Math.cos(angle);
            const y1 = centerY + innerRadius * Math.sin(angle);
            const x2 = centerX + outerRadius * Math.cos(angle);
            const y2 = centerY + outerRadius * Math.sin(angle);
            
            // Create gradient for each bar
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `rgba(141, 88, 166, ${0.7 - (layerIndex * 0.2)})`);
            gradient.addColorStop(1, `rgba(90, 158, 219, ${0.7 - (layerIndex * 0.2)})`);
            
            // Draw the line
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = gradient;
            ctx.stroke();
            
            // Add glow effect only on the outer layer for performance
            if (layerIndex === 0) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = '#5a9edb';
            }
          }
          
          // Reset shadow for better performance
          ctx.shadowBlur = 0;
        });
      };
      
      renderFrame();
    } catch (error) {
      console.error("Error setting up audio visualizer:", error);
    }
    
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (analyser) {
        analyser.disconnect();
      }
    };
  }, []);

  // Fixed playback function to prevent interruption errors
  const handlePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      const playPromise = audioRef.current.play();
      
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setIsPlaying(true);
          })
          .catch(error => {
            console.error("Error playing audio:", error);
            setIsPlaying(false);
          });
      }
    }
  };

  // Fixed song change to properly handle loading and play sequencing
  const handleSongChange = (index) => {
    // Stop current playback first to avoid interruption errors
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    // Update state
    setCurrentSongIndex(index);
    
    // Use setTimeout to ensure state updates before playing
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = `/music/${songs[index].file}`;
        
        // Reset progress
        setProgress(0);
        setCurrentTime(0);
        
        // Use loadeddata event to play after loading
        const loadHandler = () => {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                audioRef.current.removeEventListener('loadeddata', loadHandler);
              })
              .catch(error => {
                console.error("Error playing next track:", error);
                setIsPlaying(false);
                audioRef.current.removeEventListener('loadeddata', loadHandler);
              });
          }
        };
        
        audioRef.current.addEventListener('loadeddata', loadHandler);
        // Set a timeout to remove the listener if it doesn't trigger
        setTimeout(() => {
          audioRef.current.removeEventListener('loadeddata', loadHandler);
        }, 3000);
      }
    }, 50);
  };

  const handleNext = () => {
    if (isShuffle) {
      const randomIndex = Math.floor(Math.random() * songs.length);
      handleSongChange(randomIndex);
    } else {
      const nextIndex = (currentSongIndex + 1) % songs.length;
      handleSongChange(nextIndex);
    }
  };

  const handlePrevious = () => {
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
    } else {
      const prevIndex = (currentSongIndex - 1 + songs.length) % songs.length;
      handleSongChange(prevIndex);
    }
  };

  const handleVolumeChange = (event) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
    if (newVolume === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
      setPrevVolume(newVolume);
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    if (isMuted) {
      setVolume(prevVolume);
      audioRef.current.volume = prevVolume;
      setIsMuted(false);
    } else {
      setPrevVolume(volume);
      setVolume(0);
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

  const handleProgressChange = (event) => {
    if (!audioRef.current) return;
    
    const newProgress = parseFloat(event.target.value);
    setProgress(newProgress);
    
    const newTime = (newProgress / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleDownload = () => {
    const currentSong = songs[currentSongIndex];
    const link = document.createElement('a');
    link.href = `/music/${currentSong.file}`;
    link.download = `${currentSong.name}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Enhanced favorite functionality with visual feedback
  const toggleFavorite = () => {
    const songName = songs[currentSongIndex].name;
    
    if (favorites.includes(currentSongIndex)) {
      setFavorites(favorites.filter(idx => idx !== currentSongIndex));
      showToast(`Removed "${songName}" from favorites`);
    } else {
      setFavorites([...favorites, currentSongIndex]);
      showToast(`Added "${songName}" to favorites`);
    }
  };
  
  // Separated toast function for reusability and cleaner code
  const showToast = (message) => {
    // Remove any existing toast to prevent stacking
    const existingToast = document.getElementById('music-toast');
    if (existingToast) {
      existingToast.remove();
    }
    
    // Create new toast
    const toast = document.createElement('div');
    toast.id = 'music-toast';
    toast.className = 'fixed bottom-5 left-1/2 transform -translate-x-1/2 bg-white/20 backdrop-blur-md text-white px-4 py-2 rounded-full shadow-lg z-50 flex items-center';
    
    // Add heart icon to the toast
    const icon = document.createElement('span');
    icon.className = 'mr-2';
    icon.innerHTML = favorites.includes(currentSongIndex) ? 
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="#ff5e85"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>` :
      `<svg width="16" height="16" viewBox="0 0 24 24" fill="#ffffff"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>`;
    
    toast.appendChild(icon);
    
    // Add message text
    const messageSpan = document.createElement('span');
    messageSpan.textContent = message;
    toast.appendChild(messageSpan);
    
    document.body.appendChild(toast);
    
    // Animate in
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.opacity = '1'; }, 10);
    
    // Remove after delay
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => { 
        toast.remove(); 
      }, 300);
    }, 2000);
  };

  const toggleRepeat = () => {
    setIsRepeat(!isRepeat);
  };

  const toggleShuffle = () => {
    setIsShuffle(!isShuffle);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative p-6"
      style={{
        backgroundImage: 'linear-gradient(to bottom, rgba(0,0,0,0.5), rgba(0,0,0,0.7)), url(/images/calmingmusic.png)',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <div className="absolute top-8 left-8">
        <motion.div 
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowPlaylist(!showPlaylist)}
          className="bg-white/20 backdrop-blur-sm text-white px-4 py-2 rounded-full cursor-pointer"
        >
          {showPlaylist ? "Hide Playlist" : "Show Playlist"}
        </motion.div>
      </div>

      {/* Removed visualizer toggle button */}

      {/* Music Player */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 backdrop-blur-lg p-8 rounded-2xl shadow-2xl border border-white/20 w-full max-w-md relative overflow-hidden"
      >
        {/* Always show visualizer */}
        <div className="absolute inset-0 z-0">
          <canvas ref={canvasRef} className="w-full h-full"></canvas>
        </div>

        <div className="relative z-10">
          {/* Cover Art */}
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="w-48 h-48 mx-auto mb-6 rounded-xl overflow-hidden shadow-lg"
          >
            <img 
              src={songs[currentSongIndex].coverArt || "/images/default.jpg"} 
              alt={songs[currentSongIndex].name} 
              className="w-full h-full object-cover"
            />
          </motion.div>
          
          {/* Song Info */}
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-white mb-1">{songs[currentSongIndex].name}</h2>
            <p className="text-white/80">{songs[currentSongIndex].artist}</p>
          </div>
          
          {/* Progress Bar */}
          <div className="flex items-center justify-between mb-2 text-white/70 text-sm">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          <div className="relative mb-6 h-2">
            <div className="absolute inset-0 bg-white/20 rounded-full"></div>
            <div 
              className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#8d58a6] to-[#5a9edb] rounded-full" 
              style={{ width: `${progress}%` }}
            ></div>
            <input 
              type="range"
              min="0"
              max="100"
              step="0.1"
              value={progress}
              onChange={handleProgressChange}
              className="w-full cursor-pointer opacity-0 z-10 absolute top-0 h-full" 
            />
          </div>
          
          {/* Audio Element */}
          <audio ref={audioRef} preload="auto" src={`/music/${songs[currentSongIndex].file}`}></audio>
          
          {/* Controls - Just icons now */}
          <div className="flex items-center justify-center space-x-6 mb-8">
            <div 
              onClick={toggleShuffle}
              className={`cursor-pointer transition-all ${isShuffle ? 'text-[#8d58a6]' : 'text-white/70'} hover:scale-110 active:scale-90`}
            >
              <ShuffleIcon fontSize="medium" />
            </div>
            
            <div 
              onClick={handlePrevious}
              className="cursor-pointer transition-all text-white hover:scale-110 active:scale-90"
            >
              <SkipPreviousIcon fontSize="large" />
            </div>
            
            <div 
              onClick={handlePlayPause}
              className="cursor-pointer bg-gradient-to-r from-[#8d58a6] to-[#5a9edb] w-16 h-16 rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 active:scale-95 transition-all"
            >
              {isPlaying ? 
                <PauseIcon style={{ fontSize: 36 }} /> : 
                <PlayArrowIcon style={{ fontSize: 36 }} />
              }
            </div>
            
            <div 
              onClick={handleNext}
              className="cursor-pointer transition-all text-white hover:scale-110 active:scale-90"
            >
              <SkipNextIcon fontSize="large" />
            </div>
            
            <div 
              onClick={toggleRepeat}
              className={`cursor-pointer transition-all ${isRepeat ? 'text-[#8d58a6]' : 'text-white/70'} hover:scale-110 active:scale-90`}
            >
              <RepeatIcon fontSize="medium" />
            </div>
          </div>
          
          {/* Volume Control */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div 
              onClick={toggleMute}
              className="cursor-pointer transition-all text-white/70 hover:scale-110 active:scale-90"
            >
              {isMuted ? <VolumeOffIcon /> : <VolumeUpIcon />}
            </div>
            
            <div className="relative w-48 h-2">
              <div className="absolute inset-0 bg-white/20 rounded-full"></div>
              <div 
                className="absolute top-0 left-0 h-full bg-white/50 rounded-full" 
                style={{ width: `${volume * 100}%` }}
              ></div>
              <input 
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="w-full cursor-pointer opacity-0 z-10 absolute top-0 h-full"
              />
            </div>
          </div>
          
         
          <div className="flex items-center justify-between">
            {/* <div 
              onClick={toggleFavorite}
              className="cursor-pointer transition-all hover:scale-110 active:scale-90"
            >
              {favorites.includes(currentSongIndex) ? 
                <FavoriteIcon style={{ color: '#ff5e85' }} /> : 
                <FavoriteBorderIcon style={{ color: 'white' }} />
              }
            </div> */}
            
            <div 
              onClick={handleDownload}
              className="cursor-pointer transition-all text-white hover:scale-110 active:scale-90"
            >
              <DownloadIcon />
            </div>
          </div>
        </div>
      </motion.div>
      
      {/* Playlist */}
      {showPlaylist && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mt-8 bg-white/10 backdrop-blur-lg p-6 rounded-xl shadow-xl border border-white/20 w-full max-w-md"
        >
          <h3 className="text-xl font-bold text-white mb-4">Playlist</h3>
          <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
            {songs.map((song, index) => (
              <motion.div 
                key={index}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.15)' }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleSongChange(index)}
                className={`flex items-center p-3 rounded-lg cursor-pointer ${
                  currentSongIndex === index ? 'bg-white/20' : 'bg-white/5'
                }`}
              >
                <div className="w-10 h-10 rounded overflow-hidden mr-3">
                  <img 
                    src={song.coverArt || "/images/default.jpg"} 
                    alt={song.name} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{song.name}</p>
                  <p className="text-white/70 text-sm">{song.artist}</p>
                </div>
                <div className="text-white/60 text-sm">{song.duration}</div>
                {favorites.includes(index) && (
                  <FavoriteIcon style={{ color: '#ff5e85', fontSize: 16, marginLeft: 8 }} />
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default CalmingMusic;