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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { getCategoryIcon } from '../../../utils/musicUtils';

// Helper function to format time
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const CalmingMusic = () => {
  const [musicList, setMusicList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('calming');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPlaying, setCurrentPlaying] = useState(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [prevVolume, setPrevVolume] = useState(0.7);
  const [isRepeat, setIsRepeat] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  
  // Refs
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // Initialize component
  useEffect(() => {
    initializeComponent();
    
    // Initialize audio ref if not already done
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
    }
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      console.log('Selected category changed to:', selectedCategory);
      fetchMusic();
    }
  }, [selectedCategory, showFavorites, isAuthenticated]);

  // Set up audio context for visualizer
  useEffect(() => {
    // Ensure audio element exists
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
    }
    
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
        const randomIndex = Math.floor(Math.random() * musicList.length);
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
  }, [currentPlaying, isRepeat, isShuffle, musicList]);

  // API Functions
  const initializeComponent = async () => {
    try {
      setLoading(true);
      
      // Check authentication
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
      
      // Fetch categories first
      await fetchCategories();
      
    } catch (error) {
      console.error('Error initializing component:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/music/categories`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log('Categories API response:', data);
      
      if (data.success && data.data && Array.isArray(data.data)) {
        setCategories(data.data);
        console.log('Loaded categories:', data.data);
        
        // Set default category if none selected
        if (!selectedCategory) {
          const calmingCategory = data.data.find(cat => cat._id === 'calming');
          const defaultCategory = calmingCategory ? 'calming' : data.data[0]?._id || 'calming';
          console.log('Setting default category:', defaultCategory);
          setSelectedCategory(defaultCategory);
        }
      } else {
        throw new Error('Invalid categories data structure');
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Fallback categories
      const fallbackCategories = [
        { _id: 'calming', count: 0 },
        { _id: 'uplifting', count: 0 },
        { _id: 'meditation', count: 0 },
        { _id: 'focus', count: 0 },
        { _id: 'sleep', count: 0 },
        { _id: 'nature', count: 0 }
      ];
      setCategories(fallbackCategories);
      if (!selectedCategory) {
        setSelectedCategory('calming');
      }
    }
  };

  const fetchMusic = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      
      let response;
      let musicData = [];
      
      if (showFavorites && token) {
        // Fetch favorites - similar to mobile version
        const favoritesUrl = `${import.meta.env.VITE_NODE_API}/api/music/user/favorites`;
        console.log('Fetching favorites from:', favoritesUrl);
        
        const favoritesResponse = await fetch(favoritesUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!favoritesResponse.ok) {
          throw new Error(`Favorites API error! status: ${favoritesResponse.status}`);
        }
        
        const favoritesData = await favoritesResponse.json();
        console.log('Favorites API response:', favoritesData);
        
        if (favoritesData.success && favoritesData.data) {
          musicData = favoritesData.data;
        }
      } else {
        // Fetch regular music by category or all
        let url;
        if (selectedCategory && selectedCategory !== 'all') {
          url = `${import.meta.env.VITE_NODE_API}/api/music/category/${selectedCategory}`;
        } else {
          url = `${import.meta.env.VITE_NODE_API}/api/music`;
        }
        
        console.log('Fetching music from URL:', url);
        
        const headers = {
          'Content-Type': 'application/json'
        };
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
        
        const musicResponse = await fetch(url, { 
          method: 'GET',
          headers 
        });
        
        if (!musicResponse.ok) {
          throw new Error(`HTTP error! status: ${musicResponse.status}`);
        }
        
        const musicResponseData = await musicResponse.json();
        console.log('Music API response:', musicResponseData);
        
        if (musicResponseData.success && musicResponseData.data) {
          musicData = musicResponseData.data;
          
          // If authenticated and not showing favorites, check which songs are favorited
          if (isAuthenticated && token) {
            try {
              const favoritesResponse = await fetch(`${import.meta.env.VITE_NODE_API}/api/music/user/favorites`, {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (favoritesResponse.ok) {
                const favoritesData = await favoritesResponse.json();
                if (favoritesData.success) {
                  const favoriteIds = new Set(favoritesData.data.map(fav => fav._id));
                  musicData = musicData.map(track => ({
                    ...track,
                    isFavorite: favoriteIds.has(track._id)
                  }));
                }
              }
            } catch (favError) {
              console.error('Error checking favorites status:', favError);
              // Set isFavorite to false for all tracks if check fails
              musicData = musicData.map(track => ({
                ...track,
                isFavorite: false
              }));
            }
          } else {
            // Not authenticated, set isFavorite to false
            musicData = musicData.map(track => ({
              ...track,
              isFavorite: false
            }));
          }
        }
      }
      
      setMusicList(musicData);
      console.log('Loaded music tracks:', musicData.length);
      
    } catch (error) {
      console.error('Error fetching music:', error);
      setMusicList([]);
    } finally {
      setRefreshing(false);
    }
  };

  const toggleFavoriteAPI = async (music) => {
    if (!isAuthenticated) return;
    try {
      const token = localStorage.getItem('token');
      const method = music.isFavorite ? 'DELETE' : 'POST';
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/music/${music._id}/favorite`, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (response.ok) {
        // Update the music list
        setMusicList(prev => prev.map(item => 
          item._id === music._id 
            ? { ...item, isFavorite: !item.isFavorite }
            : item
        ));
        // Update currentPlaying if it's the same song
        setCurrentPlaying(prev =>
          prev && prev._id === music._id
            ? { ...prev, isFavorite: !prev.isFavorite }
            : prev
        );
        // If currently showing favorites and removing, remove from list
        if (showFavorites && music.isFavorite) {
          setMusicList(prev => prev.filter(item => item._id !== music._id));
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  // Enhanced audio visualizer setup - Visualizer is always on
  useEffect(() => {
    // Ensure audio element exists before setting up visualizer
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
    }
    
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
        
        // Draw base circle with gradient (soft green theme)
        const baseGradient = ctx.createRadialGradient(centerX, centerY, radius/3, centerX, centerY, radius);
        baseGradient.addColorStop(0, 'rgba(34, 197, 94, 0.1)'); // emerald-500
        baseGradient.addColorStop(1, 'rgba(16, 185, 129, 0.05)'); // emerald-600
        
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
            
            // Create gradient for each bar (soft green theme)
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `rgba(34, 197, 94, ${0.7 - (layerIndex * 0.2)})`); // emerald-500
            gradient.addColorStop(1, `rgba(16, 185, 129, ${0.7 - (layerIndex * 0.2)})`); // emerald-600
            
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
              ctx.shadowColor = '#10b981'; // emerald-600
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
  const handlePlayPause = (music = currentPlaying) => {
    // Initialize audio ref if not available
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
    }
    
    if (music && music._id !== currentPlaying?._id) {
      // Play new song
      playSound(music);
    } else if (isPlaying) {
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

  const playSound = (music) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    setCurrentPlaying(music);
    setIsPlaying(false);
    
    setTimeout(() => {
      if (audioRef.current) {
        audioRef.current.src = music.cloudinaryUrl;
        audioRef.current.crossOrigin = 'anonymous'; // Handle CORS
        
        setProgress(0);
        setCurrentTime(0);
        
        const loadHandler = () => {
          const playPromise = audioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                setIsPlaying(true);
                audioRef.current.removeEventListener('loadeddata', loadHandler);
                
                // Increment play count
                incrementPlayCount(music._id);
              })
              .catch(error => {
                console.error("Error playing track:", error);
                setIsPlaying(false);
                audioRef.current.removeEventListener('loadeddata', loadHandler);
              });
          }
        };
        
        const errorHandler = (error) => {
          audioRef.current.removeEventListener('loadeddata', loadHandler);
          audioRef.current.removeEventListener('error', errorHandler);
          setIsPlaying(false);
        };
        
        audioRef.current.addEventListener('loadeddata', loadHandler);
        audioRef.current.addEventListener('error', errorHandler);
        
        // Load the audio
        audioRef.current.load();
        
        setTimeout(() => {
          audioRef.current.removeEventListener('loadeddata', loadHandler);
          audioRef.current.removeEventListener('error', errorHandler);
        }, 5000);
      }
    }, 50);
  };

  const incrementPlayCount = async (musicId) => {
    try {
      await fetch(`${import.meta.env.VITE_NODE_API}/api/music/${musicId}/play`, { method: 'POST' });
    } catch (error) {
      console.error('Error incrementing play count:', error);
    }
  };

  const handleDownload = async (music) => {
    try {
      const response = await fetch(music.cloudinaryUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${music.title} - ${music.artist}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link
      const link = document.createElement('a');
      link.href = music.cloudinaryUrl;
      link.download = `${music.title} - ${music.artist}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getCurrentIndex = () => {
    return musicList.findIndex(m => m._id === currentPlaying?._id);
  };

  const handleProgressSeek = (event) => {
    if (!audioRef.current) return;
    
    const progressBar = event.currentTarget;
    const rect = progressBar.getBoundingClientRect();
    const clickX = event.clientX - rect.left;
    const percentage = (clickX / rect.width) * 100;
    
    const newTime = (percentage / 100) * audioRef.current.duration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
    setProgress(percentage);
  };

  // Fixed song change to properly handle loading and play sequencing
  const handleSongChange = (index) => {
    if (musicList && musicList[index]) {
      playSound(musicList[index]);
    }
  };

  const handleNext = () => {
    if (!musicList.length || !currentPlaying) return;
    
    const currentIndex = getCurrentIndex();
    if (currentIndex === -1) return;
    
    let nextIndex;
    if (isShuffle) {
      // Get random index that's not current
      do {
        nextIndex = Math.floor(Math.random() * musicList.length);
      } while (nextIndex === currentIndex && musicList.length > 1);
    } else {
      nextIndex = (currentIndex + 1) % musicList.length;
    }
    
    playSound(musicList[nextIndex]);
  };

  const handlePrevious = () => {
    if (!musicList.length || !currentPlaying) return;
    
    // If more than 3 seconds played, restart current song
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
    } else {
      const currentIndex = getCurrentIndex();
      if (currentIndex === -1) return;
      
      const prevIndex = (currentIndex - 1 + musicList.length) % musicList.length;
      playSound(musicList[prevIndex]);
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-600 font-medium">Loading music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-emerald-100">
        <div className="flex items-center justify-between p-4 max-w-6xl mx-auto">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center justify-center w-10 h-10 bg-emerald-100 hover:bg-emerald-200 rounded-full transition-colors"
            onClick={() => window.history.back()}
          >
            <ArrowBackIcon className="text-emerald-600" />
          </motion.button>
          
          <h1 className="text-xl font-bold text-emerald-800">Calming Music</h1>
          
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFavorites(!showFavorites)}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                showFavorites 
                  ? 'bg-emerald-100 hover:bg-emerald-200' 
                  : 'bg-rose-100 hover:bg-rose-200'
              }`}
              title={showFavorites ? 'Show All Songs' : 'Show Favorites'}
            >
              {showFavorites ? (
                <span className="text-emerald-600 text-xl">🎵</span>
              ) : (
                <FavoriteIcon className="text-rose-600" />
              )}
            </motion.button>
          )}
          
          {!isAuthenticated && <div className="w-10" />}
        </div>
      </div>

      {/* Categories */}
      <div
        className="flex gap-3 sm:gap-4 md:gap-6 overflow-x-auto scrollbar-thin scrollbar-thumb-emerald-200 scrollbar-track-transparent px-1 bg-white/60 backdrop-blur-sm border-b border-emerald-100 mx-4 rounded-lg mt-4 mb-4 p-4 max-w-6xl mx-auto"
        style={{ WebkitOverflowScrolling: 'touch' }}
      >
        {categories.map((category) => (
          <motion.button
            key={category._id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setSelectedCategory(category._id)}
            className={`flex items-center gap-2 px-3 py-3 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === category._id
                ? 'bg-emerald-500 text-white shadow-lg'
                : 'bg-white/80 text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
            }`}
            style={{ margin: '3px 0', flex: '0 0 auto' }}
          >
            <span className="text-sm">{getCategoryIcon(category._id)}</span>
            <span className="capitalize">{category._id}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              selectedCategory === category._id
                ? 'bg-white/20 text-white'
                : 'bg-emerald-100 text-emerald-600'
            }`}>
              {category.count}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Main Content */}
      <div className="flex flex-col lg:flex-row max-w-7xl mx-auto p-4 sm:p-6 gap-6 lg:gap-8 min-h-[400px]">
        {/* Music Player - Top on mobile, left on desktop */}
        <div className="w-full lg:w-1/3 lg:min-w-[340px] mb-6 lg:mb-0">
          {currentPlaying ? (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-white/90 backdrop-blur-sm rounded-xl p-6 border border-emerald-100 shadow-lg h-fit max-h-[calc(100vh-200px)] overflow-y-auto relative"
            >
              {/* Heart and Download buttons - Upper Right */}
              <div className="absolute top-3 right-3 flex gap-1 z-10">
                {isAuthenticated && (
                  <motion.button 
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => toggleFavoriteAPI(currentPlaying)}
                    className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                      currentPlaying.isFavorite ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-400 hover:text-rose-500'
                    }`}
                    title="Add to Favorites"
                  >
                    {currentPlaying.isFavorite ? <FavoriteIcon sx={{ fontSize: 16 }} /> : <FavoriteBorderIcon sx={{ fontSize: 16 }} />}
                  </motion.button>
                )}
                
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => handleDownload(currentPlaying)}
                  className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-400 hover:text-emerald-600 flex items-center justify-center transition-colors"
                  title="Download"
                >
                  <DownloadIcon sx={{ fontSize: 16 }} />
                </motion.button>
              </div>
              
              {/* Album Art / Visualizer */}
              <div className="relative mt-6 mb-4">
                <div className="w-32 h-32 mx-auto bg-gradient-to-br from-emerald-100 to-green-200 rounded-lg overflow-hidden mb-4">
                  <canvas ref={canvasRef} className="w-full h-full"></canvas>
                </div>
              </div>

              {/* Song Info */}
              <div className="text-center mb-6">
                <h3 className="font-bold text-emerald-800 text-lg mb-2 truncate">{currentPlaying.title}</h3>
                <p className="text-emerald-600 text-base truncate">{currentPlaying.artist}</p>
              </div>
              
              {/* Progress Bar - Clickable */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-emerald-600 mb-2">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
                <div 
                  className="relative h-3 bg-emerald-100 rounded-full cursor-pointer group"
                  onClick={handleProgressSeek}
                >
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full transition-all" 
                    style={{ width: `${progress}%` }}
                  ></div>
                  <div 
                    className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-emerald-600 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ left: `calc(${progress}% - 8px)` }}
                  ></div>
                </div>
              </div>
              
              {/* Audio Element - Created programmatically */}
              
              {/* Main Controls */}
              <div className="flex items-center justify-center gap-2 mb-4">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleShuffle}
                  className={`p-2 rounded-full transition-colors ${
                    isShuffle ? 'text-emerald-600 bg-emerald-100' : 'text-emerald-400 hover:text-emerald-600'
                  }`}
                  title="Shuffle"
                >
                  <ShuffleIcon fontSize="small" />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePrevious}
                  disabled={musicList.length === 0}
                  className="p-2 text-emerald-600 hover:text-emerald-700 disabled:text-emerald-300"
                >
                  <SkipPreviousIcon fontSize="medium" />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handlePlayPause()}
                  className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg transition-colors mx-2"
                >
                  {isPlaying ? 
                    <PauseIcon fontSize="small" /> : 
                    <PlayArrowIcon fontSize="medium" />
                  }
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleNext}
                  disabled={musicList.length === 0}
                  className="p-2 text-emerald-600 hover:text-emerald-700 disabled:text-emerald-300"
                >
                  <SkipNextIcon fontSize="medium" />
                </motion.button>
                
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleRepeat}
                  className={`p-2 rounded-full transition-colors ${
                    isRepeat ? 'text-emerald-600 bg-emerald-100' : 'text-emerald-400 hover:text-emerald-600'
                  }`}
                  title="Repeat"
                >
                  <RepeatIcon fontSize="small" />
                </motion.button>
              </div>
              
              {/* Volume Control */}
              <div className="flex items-center gap-3">
                <motion.button 
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className="text-emerald-600 hover:text-emerald-700 p-1"
                >
                  {isMuted ? <VolumeOffIcon fontSize="small" /> : <VolumeUpIcon fontSize="small" />}
                </motion.button>
                
                <div className="flex-1 relative h-2 bg-emerald-100 rounded-full">
                  <div 
                    className="absolute top-0 left-0 h-full bg-emerald-500 rounded-full" 
                    style={{ width: `${volume * 100}%` }}
                  ></div>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={volume}
                    onChange={handleVolumeChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                <span className="text-sm text-emerald-600 min-w-[30px]">{Math.round(volume * 100)}</span>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/60 backdrop-blur-sm rounded-xl p-8 border border-emerald-100 text-center h-fit"
            >
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-lg font-semibold text-emerald-800 mb-2">Select a song to play</h3>
              <p className="text-emerald-600">Choose from {musicList.length} tracks in the {selectedCategory} category</p>
            </motion.div>
          )}
        </div>

        {/* Music List - Below on mobile, right on desktop */}
        <div className="w-full flex-1 overflow-visible lg:overflow-hidden">
          {refreshing ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto mb-2"></div>
              <p className="text-emerald-600">Loading...</p>
            </div>
          ) : musicList.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎵</div>
              <h3 className="text-lg font-semibold text-emerald-800 mb-2">
                {showFavorites ? 'No favorites yet' : 'No music found'}
              </h3>
              <p className="text-emerald-600 mb-4">
                {showFavorites 
                  ? 'Heart songs to add them to your favorites!' 
                  : `No music found in "${selectedCategory}" category`}
              </p>
            </div>
          ) : (
            <div className="space-y-3 overflow-y-auto max-h-[60vh] pr-2 pl-0 sm:pl-1 py-1">
              {musicList.map((music, index) => (
                <motion.div
                  key={music._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-emerald-100 hover:shadow-md transition-all cursor-pointer group ${
                    currentPlaying?._id === music._id ? 'ring-2 ring-emerald-400 bg-emerald-50/80' : 'hover:bg-emerald-50/50'
                  }`}
                  onClick={() => handlePlayPause(music)}
                >
                  <div className="flex items-center gap-4">
                    <motion.div
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePlayPause(music)}
                      className={`flex items-center justify-center w-12 h-12 rounded-full transition-all ${
                        currentPlaying?._id === music._id && isPlaying
                          ? 'bg-emerald-500 text-white shadow-lg'
                          : 'bg-emerald-100 text-emerald-600 group-hover:bg-emerald-200'
                      }`}
                    >
                      {currentPlaying?._id === music._id && isPlaying ? (
                        <PauseIcon />
                      ) : (
                        <PlayArrowIcon />
                      )}
                    </motion.div>

                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-emerald-800 truncate">{music.title}</h4>
                      <p className="text-sm text-emerald-600 truncate">{music.artist}</p>
                    </div>
                    
                    <div className="flex items-center text-sm text-emerald-500 mr-4">
                      <span>{formatTime(music.duration)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isAuthenticated && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavoriteAPI(music);
                          }}
                          className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                            music.isFavorite
                              ? 'bg-rose-100 text-rose-600 hover:bg-rose-200'
                              : 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200'
                          }`}
                        >
                          {music.isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </motion.button>
                      )}
                      
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownload(music);
                        }}
                        className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-600 hover:bg-emerald-200 flex items-center justify-center transition-colors"
                      >
                        <DownloadIcon fontSize="small" />
                      </motion.button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>


      </div>
    </div>
  );
};

export default CalmingMusic;