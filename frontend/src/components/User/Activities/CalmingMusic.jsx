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
import MusicNoteIcon from '@mui/icons-material/MusicNote';
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
  const [isRepeatActive, setIsRepeatActive] = useState(false);
  const [currentPlaylist, setCurrentPlaylist] = useState([]); // Keep track of the playlist when song was selected
  
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
    
    // Cleanup on unmount
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      console.log('Selected category changed to:', selectedCategory);
      fetchMusic();
    }
  }, [selectedCategory, showFavorites, isAuthenticated]);

  // Initialize currentPlaylist when musicList loads
  useEffect(() => {
    if (musicList.length > 0 && currentPlaylist.length === 0) {
      setCurrentPlaylist(musicList);
    }
  }, [musicList]);

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

    // Define event handlers as named functions so we can remove them properly
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
      setProgress((audio.currentTime / audio.duration) * 100 || 0);
    };

    const handleEnded = () => {
      if (isRepeatActive) {
        audio.currentTime = 0;
        audio.play().catch(err => console.error("Error replaying:", err));
      } else {
        handleNext();
      }
    };

    // Add new listeners
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentPlaying, currentPlaylist, isRepeatActive]);

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
        
        // Draw base circle with gradient (Indigo/Violet theme)
        const baseGradient = ctx.createRadialGradient(centerX, centerY, radius/3, centerX, centerY, radius);
        baseGradient.addColorStop(0, 'rgba(99, 102, 241, 0.1)'); // indigo-500
        baseGradient.addColorStop(1, 'rgba(139, 92, 246, 0.05)'); // violet-500
        
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
            
            // Create gradient for each bar (Indigo/Violet theme)
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `rgba(99, 102, 241, ${0.7 - (layerIndex * 0.2)})`); // indigo-500
            gradient.addColorStop(1, `rgba(139, 92, 246, ${0.7 - (layerIndex * 0.2)})`); // violet-500
            
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
              ctx.shadowColor = '#6366f1'; // indigo-500
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
      // Play new song - this will stop the current one
      playSound(music);
    } else if (currentPlaying && isPlaying) {
      // Pause current song
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (currentPlaying && !isPlaying) {
      // Resume current song
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

  const playSound = (music, playlistToUse = null) => {
    if (audioRef.current) {
      // Completely stop the current audio
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    // When a new song is selected, save the current musicList as the playlist for navigation
    const playlistForNavigation = playlistToUse || musicList;
    setCurrentPlaylist(playlistForNavigation);
    setCurrentPlaying(music);
    setIsPlaying(false);
    
    setTimeout(() => {
      if (audioRef.current) {
        // Reset audio element completely
        audioRef.current.src = '';
        audioRef.current.currentTime = 0;
        audioRef.current.src = music.cloudinaryUrl;
        audioRef.current.crossOrigin = 'anonymous';
        
        setProgress(0);
        setCurrentTime(0);
        
        const loadHandler = () => {
          if (audioRef.current) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              playPromise
                .then(() => {
                  setIsPlaying(true);
                  if (audioRef.current) {
                    audioRef.current.removeEventListener('loadeddata', loadHandler);
                  }
                  
                  // Increment play count
                  incrementPlayCount(music._id);
                })
                .catch(error => {
                  console.error("Error playing track:", error);
                  setIsPlaying(false);
                  if (audioRef.current) {
                    audioRef.current.removeEventListener('loadeddata', loadHandler);
                  }
                });
            }
          }
        };
        
        const errorHandler = (error) => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('loadeddata', loadHandler);
            audioRef.current.removeEventListener('error', errorHandler);
          }
          setIsPlaying(false);
        };
        
        audioRef.current.addEventListener('loadeddata', loadHandler);
        audioRef.current.addEventListener('error', errorHandler);
        
        // Load the audio
        audioRef.current.load();
        
        const timeoutId = setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('loadeddata', loadHandler);
            audioRef.current.removeEventListener('error', errorHandler);
          }
        }, 5000);
        
        // Store timeout ID for cleanup
        audioRef.current.timeoutId = timeoutId;
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
    // Use currentPlaylist instead of musicList to handle category changes
    return currentPlaylist.findIndex(m => m._id === currentPlaying?._id);
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
    if (!currentPlaylist.length || !currentPlaying) return;
    const currentIndex = getCurrentIndex();
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    playSound(currentPlaylist[nextIndex], currentPlaylist);
  };

  const handlePrevious = () => {
    if (!currentPlaylist.length || !currentPlaying) return;
    
    // If more than 3 seconds played, restart current song
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
    } else {
      const currentIndex = getCurrentIndex();
      if (currentIndex === -1) return;
      
      const prevIndex = (currentIndex - 1 + currentPlaylist.length) % currentPlaylist.length;
      playSound(currentPlaylist[prevIndex], currentPlaylist);
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


  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0f172a]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-indigo-400 font-medium">Loading music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white font-sans selection:bg-indigo-500/30">
      {/* Header Section */}
      <div className="max-w-7xl mx-auto px-6 pt-12 pb-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400"
            >
              Calming Music
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-slate-400 mt-3 max-w-2xl"
            >
              Immerse yourself in a curated collection of soothing melodies designed to help you relax, focus, and find your inner peace.
            </motion.p>
          </div>
          
          {isAuthenticated && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setShowFavorites(!showFavorites)}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all duration-300 shadow-lg ${
                showFavorites 
                  ? 'bg-indigo-500 text-white shadow-indigo-500/20' 
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {showFavorites ? (
                <>
                  <span className="text-xl">🎵</span>
                  <span>Show All Tracks</span>
                </>
              ) : (
                <>
                  <FavoriteIcon className="text-rose-500" />
                  <span>Your Favorites</span>
                </>
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Categories Navigation */}
      {!showFavorites && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="flex gap-3 overflow-x-auto pb-2 pt-2 scrollbar-hide px-8">
            {categories.map((category, index) => (
              <motion.button
                key={category._id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedCategory(category._id)}
                className={`flex items-center gap-3 px-5 py-3 rounded-2xl text-sm font-bold whitespace-nowrap transition-all duration-300 border ${
                  selectedCategory === category._id
                    ? 'bg-indigo-500 border-indigo-400 text-white shadow-xl shadow-indigo-500/20'
                    : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <span className="text-lg">{getCategoryIcon(category._id)}</span>
                <span className="capitalize">{category._id}</span>
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                  selectedCategory === category._id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-700 text-slate-400'
                }`}>
                  {category.count}
                </span>
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Now Playing Player */}
          <div className="lg:col-span-5 order-1 lg:order-1">
            <div className="sticky top-8">
              {currentPlaying ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden bg-gradient-to-b from-slate-800/80 to-slate-900/90 rounded-[2rem] border border-slate-700/50 shadow-2xl shadow-black/50 backdrop-blur-sm"
                >
                  {/* Background Glow */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/10 blur-[100px] rounded-full" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-violet-500/10 blur-[100px] rounded-full" />

                  <div className="relative p-6">
                    {/* Visualizer Header */}
                    <div className="flex items-center justify-between mb-4">
                      <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 text-[9px] font-black uppercase tracking-widest rounded-full border border-indigo-500/20">
                        Now Playing
                      </span>
                      {isAuthenticated && (
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleFavoriteAPI(currentPlaying)}
                          className={`p-2 rounded-xl transition-colors ${currentPlaying.isFavorite ? 'bg-rose-500/10 text-rose-500' : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700'}`}
                        >
                          {currentPlaying.isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                        </motion.button>
                      )}
                    </div>

                    {/* Visualizer Canvas */}
                    <div className="relative aspect-square w-full max-w-[220px] mx-auto mb-6 group">
                      <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-2xl group-hover:bg-indigo-500/10 transition-all duration-700" />
                      <canvas 
                        ref={canvasRef} 
                        className="relative w-full h-full drop-shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-slate-900/80 backdrop-blur-md rounded-full border border-slate-700 flex items-center justify-center shadow-2xl">
                          <div className="text-indigo-400">
                            <MusicNoteIcon fontSize="medium" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Song Info */}
                    <div className="text-center mb-6">
                      <motion.h3 
                        key={currentPlaying.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xl font-black text-white mb-1 truncate px-4"
                      >
                        {currentPlaying.title}
                      </motion.h3>
                      <motion.p 
                        key={currentPlaying.artist}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-indigo-400 text-sm font-bold tracking-wide"
                      >
                        {currentPlaying.artist}
                      </motion.p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-6 px-2">
                      <div className="flex justify-between text-[9px] font-black text-slate-500 mb-2 uppercase tracking-widest">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div 
                        className="relative h-1.5 bg-slate-700/50 rounded-full cursor-pointer group"
                        onClick={handleProgressSeek}
                      >
                        <motion.div 
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full" 
                          style={{ width: `${progress}%` }}
                        />
                        <div 
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: `calc(${progress}% - 6px)` }}
                        />
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-6 px-2">
                      <div className="flex items-center justify-between">
                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(99, 102, 241, 0.2)' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsRepeatActive(!isRepeatActive)}
                          className={`p-2.5 rounded-xl transition-all ${isRepeatActive ? 'bg-indigo-500/30 text-indigo-400' : 'bg-indigo-500/10 text-indigo-400/70 hover:text-indigo-400'}`}
                        >
                          {isRepeatActive ? <ShuffleIcon fontSize="small" /> : <RepeatIcon fontSize="small" />}
                        </motion.button>

                        <div className="flex items-center gap-4">
                          <motion.button 
                            whileHover={{ scale: 1.1, color: '#fff', bg: 'rgba(30, 41, 59, 0.8)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handlePrevious}
                            className="p-2.5 rounded-xl bg-slate-800/40 text-slate-400 transition-all"
                          >
                            <SkipPreviousIcon fontSize="small" />
                          </motion.button>

                          <motion.button 
                            whileHover={{ scale: 1.05, shadow: '0 0 20px rgba(99,102,241,0.4)' }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePlayPause()}
                            className="w-14 h-14 bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-xl shadow-indigo-500/20 transition-all"
                          >
                            {isPlaying ? 
                              <PauseIcon sx={{ fontSize: 28 }} /> : 
                              <PlayArrowIcon sx={{ fontSize: 32, ml: 0.5 }} />
                            }
                          </motion.button>

                          <motion.button 
                            whileHover={{ scale: 1.1, color: '#fff', bg: 'rgba(30, 41, 59, 0.8)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleNext}
                            className="p-2.5 rounded-xl bg-slate-800/40 text-slate-400 transition-all"
                          >
                            <SkipNextIcon fontSize="small" />
                          </motion.button>
                        </div>

                        <motion.button 
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(99, 102, 241, 0.2)', color: '#818cf8' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDownload(currentPlaying)}
                          className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400/70 transition-all"
                        >
                          <DownloadIcon fontSize="small" />
                        </motion.button>
                      </div>

                      {/* Volume */}
                      <div className="flex items-center gap-3 py-2.5 px-4 bg-slate-900/40 rounded-xl border border-slate-800/50">
                        <motion.button 
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={toggleMute}
                          className="p-1.5 rounded-lg bg-slate-800/40 text-slate-400 hover:text-indigo-400 transition-colors"
                        >
                          {isMuted ? <VolumeOffIcon sx={{ fontSize: 16 }} /> : <VolumeUpIcon sx={{ fontSize: 16 }} />}
                        </motion.button>
                        
                        <div className="flex-1 relative h-1 bg-slate-700/50 rounded-full">
                          <div 
                            className="absolute top-0 left-0 h-full bg-indigo-500 rounded-full" 
                            style={{ width: `${volume * 100}%` }}
                          />
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
                        <span className="text-[9px] font-black text-slate-500 w-7">{Math.round(volume * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-slate-800/20 backdrop-blur-sm rounded-[2rem] p-10 border border-slate-800/50 text-center border-dashed"
                >
                  <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl shadow-inner">
                    🎧
                  </div>
                  <h3 className="text-lg font-bold text-slate-300 mb-2">Ready to Relax?</h3>
                  <p className="text-slate-500 text-xs leading-relaxed">
                    Select a track from the library to start your journey into calm.
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column: Music List */}
          <div className="lg:col-span-7 order-2 lg:order-2">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-slate-200">
                {showFavorites ? 'Your Favorite Tracks' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Collection`}
              </h2>
              <span className="text-sm text-slate-500 font-medium">{musicList.length} tracks found</span>
            </div>

            {refreshing ? (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-800/20 rounded-3xl border border-slate-800/50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-500 mb-4"></div>
                <p className="text-slate-400">Refreshing library...</p>
              </div>
            ) : musicList.length === 0 ? (
              <div className="text-center py-20 bg-slate-800/20 rounded-3xl border border-slate-800/50">
                <div className="text-6xl mb-6 opacity-20">🎵</div>
                <h3 className="text-xl font-bold text-slate-300 mb-2">
                  {showFavorites ? 'No favorites yet' : 'No music found'}
                </h3>
                <p className="text-slate-500 max-w-xs mx-auto">
                  {showFavorites 
                    ? 'Start adding songs to your favorites to see them here!' 
                    : `We couldn't find any tracks in the "${selectedCategory}" category.`}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {musicList.map((music, index) => (
                  <motion.div
                    key={music._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handlePlayPause(music)}
                    className={`group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer border ${
                      currentPlaying?._id === music._id 
                        ? 'bg-indigo-500/10 border-indigo-500/30 shadow-lg shadow-indigo-500/5' 
                        : 'bg-slate-800/30 border-transparent hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    {/* Play Indicator */}
                    <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-slate-700 flex items-center justify-center group-hover:shadow-lg transition-all">
                      {currentPlaying?._id === music._id && isPlaying ? (
                        <div className="absolute inset-0 bg-indigo-500 flex items-center justify-center">
                          <div className="flex gap-1 items-end h-4">
                            <motion.div animate={{ height: [4, 12, 6, 14, 4] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [6, 4, 14, 8, 6] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [10, 6, 4, 12, 10] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-slate-400 group-hover:text-white transition-colors">
                          <PlayArrowIcon />
                        </div>
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold truncate transition-colors ${currentPlaying?._id === music._id ? 'text-indigo-400' : 'text-slate-200 group-hover:text-white'}`}>
                        {music.title}
                      </h4>
                      <p className="text-sm text-slate-500 truncate group-hover:text-slate-400 transition-colors">{music.artist}</p>
                    </div>
                    
                    {/* Duration & Actions */}
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:block text-xs font-mono text-slate-500 group-hover:text-slate-400">{formatTime(music.duration)}</span>
                      
                      <div className="flex items-center gap-2 transition-opacity">
                        {isAuthenticated && (
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: 'rgba(30, 41, 59, 0.8)' }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteAPI(music);
                            }}
                            className={`p-2 rounded-xl transition-all border border-transparent ${
                              music.isFavorite 
                                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' 
                                : 'bg-slate-800/40 text-slate-400 hover:text-slate-200'
                            }`}
                          >
                            {music.isFavorite ? <FavoriteIcon fontSize="small" /> : <FavoriteBorderIcon fontSize="small" />}
                          </motion.button>
                        )}
                        
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: 'rgba(30, 41, 59, 0.8)', color: '#818cf8' }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(music);
                          }}
                          className="p-2 rounded-xl bg-slate-800/40 text-slate-400 transition-all"
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
    </div>
  );
};

export default CalmingMusic;