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
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
import SpaIcon from '@mui/icons-material/Spa';
import TrackChangesIcon from '@mui/icons-material/TrackChanges';
import SelfImprovementIcon from '@mui/icons-material/SelfImprovement';
import ParkIcon from '@mui/icons-material/Park';
import MusicVideoIcon from '@mui/icons-material/MusicVideo';
import HotelIcon from '@mui/icons-material/Hotel';
import WbSunnyIcon from '@mui/icons-material/WbSunny';

// Helper function to format time
const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const greenGradient = "from-[#b7eacb] via-[#e6f4ea] to-[#eaf7f3]";
const greenAccent = "#55AD9B";
const greenAccentDark = "#1b5f52";
const greenAccentLight = "#CBE7DC";

// Category icon mapping
const categoryIcons = {
  calming: <SpaIcon style={{ color: greenAccent, fontSize: 28 }} />,
  focus: <TrackChangesIcon style={{ color: greenAccentDark, fontSize: 28 }} />,
  meditation: <SelfImprovementIcon style={{ color: "#fbbf24", fontSize: 28 }} />,
  nature: <ParkIcon style={{ color: "#388e3c", fontSize: 28 }} />,
  other: <MusicVideoIcon style={{ color: "#7c3aed", fontSize: 28 }} />,
  sleep: <HotelIcon style={{ color: "#60a5fa", fontSize: 28 }} />,
  uplifting: <WbSunnyIcon style={{ color: "#f59e42", fontSize: 28 }} />,
};

const getCategoryIcon = (id) => categoryIcons[id] || <MusicNoteIcon style={{ color: greenAccent, fontSize: 28 }} />;

const CalmingMusic = ({ onBack }) => {
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
  const [currentPlaylist, setCurrentPlaylist] = useState([]);

  // Refs
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);

  // Initialize component
  useEffect(() => {
    initializeComponent();
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      fetchMusic();
    }
    // eslint-disable-next-line
  }, [selectedCategory, showFavorites, isAuthenticated]);

  useEffect(() => {
    if (musicList.length > 0 && currentPlaylist.length === 0) {
      setCurrentPlaylist(musicList);
    }
  }, [musicList]);

  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
    }
    const audio = audioRef.current;
    audio.volume = volume;

    const handleLoadedMetadata = () => setDuration(audio.duration);
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

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
    // eslint-disable-next-line
  }, [currentPlaying, currentPlaylist, isRepeatActive]);

  // API Functions
  const initializeComponent = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      setIsAuthenticated(!!token);
      await fetchCategories();
    } catch (error) {
      // fallback handled below
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/music/categories`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      if (data.success && data.data && Array.isArray(data.data)) {
        setCategories(data.data);
        if (!selectedCategory) {
          const calmingCategory = data.data.find(cat => cat._id === 'calming');
          const defaultCategory = calmingCategory ? 'calming' : data.data[0]?._id || 'calming';
          setSelectedCategory(defaultCategory);
        }
      } else throw new Error();
    } catch {
      // fallback
      const fallbackCategories = [
        { _id: 'calming', count: 0 },
        { _id: 'focus', count: 0 },
        { _id: 'meditation', count: 0 },
        { _id: 'nature', count: 0 },
        { _id: 'other', count: 0 },
        { _id: 'sleep', count: 0 },
        { _id: 'uplifting', count: 0 }
      ];
      setCategories(fallbackCategories);
      if (!selectedCategory) setSelectedCategory('calming');
    }
  };

  const fetchMusic = async () => {
    try {
      setRefreshing(true);
      const token = localStorage.getItem('token');
      let musicData = [];
      if (showFavorites && token) {
        const favoritesUrl = `${import.meta.env.VITE_NODE_API}/api/music/user/favorites`;
        const favoritesResponse = await fetch(favoritesUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        if (!favoritesResponse.ok) throw new Error();
        const favoritesData = await favoritesResponse.json();
        if (favoritesData.success && favoritesData.data) {
          musicData = favoritesData.data;
        }
      } else {
        let url;
        if (selectedCategory && selectedCategory !== 'all') {
          url = `${import.meta.env.VITE_NODE_API}/api/music/category/${selectedCategory}`;
        } else {
          url = `${import.meta.env.VITE_NODE_API}/api/music`;
        }
        const headers = { 'Content-Type': 'application/json' };
        if (token) headers.Authorization = `Bearer ${token}`;
        const musicResponse = await fetch(url, { method: 'GET', headers });
        if (!musicResponse.ok) throw new Error();
        const musicResponseData = await musicResponse.json();
        if (musicResponseData.success && musicResponseData.data) {
          musicData = musicResponseData.data;
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
            } catch {
              musicData = musicData.map(track => ({ ...track, isFavorite: false }));
            }
          } else {
            musicData = musicData.map(track => ({ ...track, isFavorite: false }));
          }
        }
      }
      setMusicList(musicData);
    } catch {
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
        setMusicList(prev => prev.map(item =>
          item._id === music._id
            ? { ...item, isFavorite: !item.isFavorite }
            : item
        ));
        setCurrentPlaying(prev =>
          prev && prev._id === music._id
            ? { ...prev, isFavorite: !prev.isFavorite }
            : prev
        );
        if (showFavorites && music.isFavorite) {
          setMusicList(prev => prev.filter(item => item._id !== music._id));
        }
      }
    } catch {}
  };

  // Visualizer setup
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
    }
    if (!audioRef.current || !canvasRef.current) return;
    let analyser;
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
        sourceNodeRef.current = audioContextRef.current.createMediaElementSource(audioRef.current);
      }
      analyser = audioContextRef.current.createAnalyser();
      sourceNodeRef.current.connect(analyser);
      analyser.connect(audioContextRef.current.destination);
      analyser.fftSize = 512;
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
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) - 50;
        const baseGradient = ctx.createRadialGradient(centerX, centerY, radius / 3, centerX, centerY, radius);
        baseGradient.addColorStop(0, 'rgba(85, 173, 155, 0.15)');
        baseGradient.addColorStop(1, 'rgba(27, 95, 82, 0.08)');
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        ctx.fillStyle = baseGradient;
        ctx.fill();
        const layers = [0.85, 0.7, 0.55];
        layers.forEach((layer, layerIndex) => {
          const layerRadius = radius * layer;
          for (let i = 0; i < bufferLength; i += 2) {
            const amplitude = dataArray[i] / (layerIndex + 1);
            const barHeight = amplitude * 0.7;
            const angle = (i * 2 * Math.PI) / bufferLength;
            const innerRadius = layerRadius - 5;
            const outerRadius = innerRadius + barHeight / 2;
            const x1 = centerX + innerRadius * Math.cos(angle);
            const y1 = centerY + innerRadius * Math.sin(angle);
            const x2 = centerX + outerRadius * Math.cos(angle);
            const y2 = centerY + outerRadius * Math.sin(angle);
            const gradient = ctx.createLinearGradient(x1, y1, x2, y2);
            gradient.addColorStop(0, `rgba(85, 173, 155, ${0.7 - (layerIndex * 0.2)})`);
            gradient.addColorStop(1, `rgba(27, 95, 82, ${0.7 - (layerIndex * 0.2)})`);
            ctx.beginPath();
            ctx.moveTo(x1, y1);
            ctx.lineTo(x2, y2);
            ctx.lineWidth = 3;
            ctx.strokeStyle = gradient;
            ctx.stroke();
            if (layerIndex === 0) {
              ctx.shadowBlur = 10;
              ctx.shadowColor = greenAccent;
            }
          }
          ctx.shadowBlur = 0;
        });
      };
      renderFrame();
    } catch {}
    return () => {
      cancelAnimationFrame(animationRef.current);
      if (analyser) analyser.disconnect();
    };
    // eslint-disable-next-line
  }, []);

  // Playback
  const handlePlayPause = (music = currentPlaying) => {
    if (!audioRef.current) {
      const audio = new Audio();
      audioRef.current = audio;
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
    }
    if (music && music._id !== currentPlaying?._id) {
      playSound(music);
    } else if (currentPlaying && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else if (currentPlaying && !isPlaying) {
      const playPromise = audioRef.current.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));
      }
    }
  };

  const playSound = (music, playlistToUse = null) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    const playlistForNavigation = playlistToUse || musicList;
    setCurrentPlaylist(playlistForNavigation);
    setCurrentPlaying(music);
    setIsPlaying(false);
    setTimeout(() => {
      if (audioRef.current) {
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
                  incrementPlayCount(music._id);
                })
                .catch(() => {
                  setIsPlaying(false);
                  if (audioRef.current) {
                    audioRef.current.removeEventListener('loadeddata', loadHandler);
                  }
                });
            }
          }
        };
        const errorHandler = () => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('loadeddata', loadHandler);
            audioRef.current.removeEventListener('error', errorHandler);
          }
          setIsPlaying(false);
        };
        audioRef.current.addEventListener('loadeddata', loadHandler);
        audioRef.current.addEventListener('error', errorHandler);
        audioRef.current.load();
        const timeoutId = setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.removeEventListener('loadeddata', loadHandler);
            audioRef.current.removeEventListener('error', errorHandler);
          }
        }, 5000);
        audioRef.current.timeoutId = timeoutId;
      }
    }, 50);
  };

  const incrementPlayCount = async (musicId) => {
    try {
      await fetch(`${import.meta.env.VITE_NODE_API}/api/music/${musicId}/play`, { method: 'POST' });
    } catch {}
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
    } catch {
      const link = document.createElement('a');
      link.href = music.cloudinaryUrl;
      link.download = `${music.title} - ${music.artist}.mp3`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getCurrentIndex = () => currentPlaylist.findIndex(m => m._id === currentPlaying?._id);

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

  const handleNext = () => {
    if (!currentPlaylist.length || !currentPlaying) return;
    const currentIndex = getCurrentIndex();
    if (currentIndex === -1) return;
    const nextIndex = (currentIndex + 1) % currentPlaylist.length;
    playSound(currentPlaylist[nextIndex], currentPlaylist);
  };

  const handlePrevious = () => {
    if (!currentPlaylist.length || !currentPlaying) return;
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#e6f4ea]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#55AD9B] mx-auto mb-4"></div>
          <p className="text-[#55AD9B] font-bold text-xl">Loading music...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${greenGradient} text-[${greenAccentDark}] font-sans selection:bg-[#55AD9B]/30`}>
      {/* Header Section */}
      <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md border-b border-[#CBE7DC] py-4 px-4 flex items-center shadow-sm">
        <button
          onClick={onBack ? onBack : () => window.history.back()}
          className="p-2 rounded-full hover:bg-[#E6F4EA] transition"
          aria-label="Back"
        >
          <ArrowBackIcon style={{ color: greenAccent, fontSize: 28 }} />
        </button>
        <h1 className="flex-1 text-center text-2xl font-bold tracking-tight" style={{ color: greenAccentDark }}>
          Calming Music
        </h1>
        <div className="w-8" />
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 pt-8 pb-24">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-2xl md:text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-[#1b5f52] via-[#1b5f52] to-[#b7eacb]"
            >
              Relax, Focus, and Unwind
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-lg text-[#1b5f52]/70 mt-3 max-w-2xl font-semibold"
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
              className={`flex items-center gap-3 px-2 py-2 rounded-xl font-bold text-lg transition-all duration-300 shadow-lg ${
                showFavorites
                  ? 'bg-[#55AD9B] text-white shadow-[#55AD9B]/20'
                  : 'bg-[#1b5f52] text-[#e6f4ea] hover:bg-[#40916c] border border-[#CBE7DC]'
              }`}
            >
              {showFavorites ? (
                <>
                  <LibraryMusicIcon style={{ color: "#fff", fontSize: 24 }} />
                  <span>Show All Tracks</span>
                </>
              ) : (
                <>
                  <span>Your Favorites</span>
                </>
              )}
            </motion.button>
          )}
        </div>

        {/* Categories Navigation */}
        {!showFavorites && (
          <div className="mb-6">
            <div className="flex gap-4 overflow-x-auto pb-2 pt-2 scrollbar-hide px-2">
              {categories.map((category, index) => (
                <motion.button
                  key={category._id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category._id)}
                  className={`flex items-center gap-2 px-2 py-2 rounded-xl text-lg font-bold whitespace-nowrap transition-all duration-300 border ${
                    selectedCategory === category._id
                      ? 'bg-[#55AD9B] border-[#55AD9B] text-white shadow-xl shadow-[#55AD9B]/20'
                      : 'bg-[#e6f4ea] border-[#CBE7DC] text-[#1b5f52] hover:bg-[#b7eacb] hover:text-[#1b5f52]'
                  }`}
                >
                  <span>{getCategoryIcon(category._id)}</span>
                  <span className="capitalize">{category._id}</span>
                  <span className=" px-2 py-1 rounded-full text-lg font-black ">
                    {category.count}
                  </span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Now Playing Player */}
          <div className="lg:col-span-5 order-1 lg:order-1">
            <div className="sticky top-8">
              {currentPlaying ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative overflow-hidden bg-[#f9f9f9] rounded-[2rem] border border-[#CBE7DC] shadow-2xl shadow-[#55AD9B]/20 backdrop-blur-sm"
                >
                  {/* Background Glow */}
                  <div className="absolute -top-24 -right-24 w-40 h-40 bg-[#55AD9B]/10 blur-[100px] rounded-full" />
                  <div className="absolute -bottom-24 -left-24 w-40 h-40 bg-[#1b5f52]/10 blur-[100px] rounded-full" />

                  <div className="relative p-8">
                    {/* Visualizer Header */}
                    <div className="flex items-center justify-between mb-6">
                      <span className="px-4 py-2 bg-[#55AD9B]/10 text-[#55AD9B] text-lg font-black uppercase tracking-widest rounded-full border border-[#55AD9B]/20">
                        Now Playing
                      </span>
                      {isAuthenticated && (
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => toggleFavoriteAPI(currentPlaying)}
                          className={`p-2   ${currentPlaying.isFavorite ? ' text-[#e53935]' : ' text-[#1b5f52]'}`}
                        >
                          {currentPlaying.isFavorite ? <FavoriteIcon fontSize="large" /> : <FavoriteBorderIcon fontSize="large" />}
                        </motion.button>
                      )}
                    </div>

                    {/* Visualizer Canvas */}
                    <div className="relative aspect-square w-full max-w-[200px] mx-auto mb-8 group">
                      <div className="absolute inset-0 bg-[#55AD9B]/5 rounded-full blur-2xl group-hover:bg-[#55AD9B]/10 transition-all duration-700" />
                      <canvas
                        ref={canvasRef}
                        className="relative w-full h-full drop-shadow-[0_0_20px_rgba(85,173,155,0.2)]"
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-16 h-16 bg-[#e6f4ea]/80 backdrop-blur-md rounded-full border border-[#CBE7DC] flex items-center justify-center shadow-2xl">
                          <div className="text-[#55AD9B]">
                            <MusicNoteIcon fontSize="large" />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Song Info */}
                    <div className="text-center mb-8">
                      <motion.h3
                        key={currentPlaying.title}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-2xl font-black text-[#1b5f52] mb-2 truncate px-4"
                      >
                        {currentPlaying.title}
                      </motion.h3>
                      <motion.p
                        key={currentPlaying.artist}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-[#55AD9B] text-lg font-bold tracking-wide"
                      >
                        {currentPlaying.artist}
                      </motion.p>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8 px-2">
                      <div className="flex justify-between text-lg font-black text-[#1b5f52]/60 mb-3 uppercase tracking-widest">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <div
                        className="relative h-2 bg-[#CBE7DC] rounded-full cursor-pointer group"
                        onClick={handleProgressSeek}
                      >
                        <motion.div
                          className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#55AD9B] to-[#1b5f52] rounded-full"
                          style={{ width: `${progress}%` }}
                        />
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-[0_0_10px_rgba(85,173,155,0.5)] opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: `calc(${progress}% - 8px)` }}
                        />
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex flex-col gap-8 px-2">
                      <div className="flex items-center justify-between">
                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => setIsRepeatActive(!isRepeatActive)}
                          className={`p-3  ${isRepeatActive ? 'text-[#1b5f52]' : 'text-[#55AD9B] '}`}
                        >
                          {isRepeatActive ? <ShuffleIcon fontSize="large" /> : <RepeatIcon fontSize="large" />}
                        </motion.button>

                        <div className="flex items-center gap-4">
                          <motion.button
                            whileHover={{ scale: 1.1, color: greenAccentDark, bg: greenAccentLight }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handlePrevious}
                            className="p-3  text-[#55AD9B]"
                          >
                            <SkipPreviousIcon fontSize="large" />
                          </motion.button>

                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handlePlayPause()}
                            className="w-16 h-16 bg-[#55AD9B] text-white rounded-full flex items-center justify-center shadow-xl shadow-[#55AD9B]/20 transition-all"
                          >
                            {isPlaying ?
                              <PauseIcon sx={{ fontSize: 32 }} /> :
                              <PlayArrowIcon sx={{ fontSize: 40, ml: 0.5 }} />
                            }
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1, color: greenAccentDark, bg: greenAccentLight }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleNext}
                            className="p-3  text-[#55AD9B] transition-all"
                          >
                            <SkipNextIcon fontSize="large" />
                          </motion.button>
                        </div>

                        <motion.button
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleDownload(currentPlaying)}
                          className="p-3 text-[#55AD9B] transition-all"
                        >
                          <DownloadIcon fontSize="large" />
                        </motion.button>
                      </div>

                      {/* Volume */} 
                      <div className="flex items-center gap-4 py-4 px-6"> 
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={toggleMute}
                          className="p-2  text-[#1b5f52] hover:text-[#55AD9B] transition-colors"
                        >
                          {isMuted ? <VolumeOffIcon sx={{ fontSize: 24 }} /> : <VolumeUpIcon sx={{ fontSize: 24 }} />}
                        </motion.button>
                        <div className="flex-1 relative h-2  rounded-full">
                          <div
                            className="absolute top-0 left-0 h-full bg-[#55AD9B] rounded-full"
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
                        <span className="text-lg font-black text-[#1b5f52]/60 w-12">{Math.round(volume * 100)}%</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-[#f9f9f9] rounded-[2rem] p-12 border border-[#CBE7DC] text-center border-dashed"
                >
                  <div className="w-24 h-24 bg-[#55AD9B] rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <MusicNoteIcon style={{ color: "#ffff", fontSize: 48 }} />
                  </div>
                  <h3 className="text-2xl font-bold text-[#1b5f52] mb-4">Ready to Relax?</h3>
                  <p className="text-lg text-[#1b5f52]/70 leading-relaxed font-semibold">
                    Select a track from the library to start your journey into calm.
                  </p>
                </motion.div>
              )}
            </div>
          </div>

          {/* Right Column: Music List */}
          <div className="lg:col-span-7 order-2 lg:order-2">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold" style={{ color: greenAccentDark }}>
                {showFavorites ? 'Your Favorite Tracks' : `${selectedCategory.charAt(0).toUpperCase() + selectedCategory.slice(1)} Collection`}
              </h2>
              <span className="text-lg text-[#1b5f52]/60 font-bold">{musicList.length} tracks found</span>
            </div>

            {refreshing ? (
              <div className="flex flex-col items-center justify-center py-24 bg-[#e6f4ea] rounded-3xl border border-[#CBE7DC]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#55AD9B] mb-6"></div>
                <p className="text-lg text-[#1b5f52]/70 font-bold">Refreshing library...</p>
              </div>
            ) : musicList.length === 0 ? (
              <div className="text-center py-24 bg-[#e6f4ea] rounded-3xl border border-[#CBE7DC]">
                <div className="flex items-center justify-center mb-8 opacity-30">
                  <LibraryMusicIcon style={{ fontSize: 56, color: greenAccent }} />
                </div>
                <h3 className="text-2xl font-bold text-[#1b5f52] mb-4">
                  {showFavorites ? 'No favorites yet' : 'No music found'}
                </h3>
                <p className="text-lg text-[#1b5f52]/70 max-w-xl mx-auto font-semibold">
                  {showFavorites
                    ? 'Start adding songs to your favorites to see them here!'
                    : `We couldn't find any tracks in the "${selectedCategory}" category.`}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {musicList.map((music, index) => (
                  <motion.div
                    key={music._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handlePlayPause(music)}
                    className={`group relative flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 cursor-pointer border ${
                      currentPlaying?._id === music._id
                        ? 'bg-[#55AD9B]/10 border-[#55AD9B]/30 shadow-lg shadow-[#55AD9B]/5'
                        : 'bg-[#e6f4ea] border-transparent hover:bg-[#b7eacb] hover:border-[#CBE7DC]'
                    }`}
                  >
                    {/* Play Indicator */}
                    <div className="relative flex-shrink-0 w-12 h-12 rounded-xl overflow-hidden bg-[#e6f4ea] flex items-center justify-center group-hover:shadow-lg transition-all">
                      {currentPlaying?._id === music._id && isPlaying ? (
                        <div className="absolute inset-0 bg-[#e6f4ea] flex items-center justify-center">
                          <div className="flex gap-1 items-end h-6">
                            <motion.div animate={{ height: [6, 18, 9, 21, 6] }} transition={{ repeat: Infinity, duration: 0.6 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [9, 6, 21, 12, 9] }} transition={{ repeat: Infinity, duration: 0.7 }} className="w-1 bg-white rounded-full" />
                            <motion.div animate={{ height: [15, 9, 6, 18, 15] }} transition={{ repeat: Infinity, duration: 0.5 }} className="w-1 bg-white rounded-full" />
                          </div>
                        </div>
                      ) : (
                        <div className="text-[#55AD9B] group-hover:text-[#55AD9B] transition-colors">
                          <PlayArrowIcon style={{ fontSize: 28 }} />
                        </div>
                      )}
                    </div>

                    {/* Track Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className={`font-bold text-xl truncate transition-colors ${currentPlaying?._id === music._id ? 'text-[#55AD9B]' : 'text-[#1b5f52] group-hover:text-[#55AD9B]'}`}>
                        {music.title}
                      </h4>
                      <p className="text-lg text-[#1b5f52]/60 truncate group-hover:text-[#1b5f52]/80 transition-colors">{music.artist}</p>
                    </div>

                    {/* Duration & Actions */}
                    <div className="flex items-center gap-4">
                      <span className="hidden sm:block text-lg font-mono text-[#1b5f52]/60 group-hover:text-[#1b5f52]/80">{formatTime(music.duration)}</span>
                      <div className="flex items-center gap-2 transition-opacity">
                        {isAuthenticated && (
                          <motion.button
                            whileHover={{ scale: 1.1, backgroundColor: greenAccentLight }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleFavoriteAPI(music);
                            }}
                            className={`p-2 rounded-xl transition-all border border-transparent ${
                              music.isFavorite
                                ? 'bg-[#e53935]/10 text-[#e53935] border-[#e53935]/20'
                                : 'bg-[#b7eacb] text-[#1b5f52] hover:text-[#55AD9B]'
                            }`}
                          >
                            {music.isFavorite ? <FavoriteIcon fontSize="medium" /> : <FavoriteBorderIcon fontSize="medium" />}
                          </motion.button>
                        )}
                        <motion.button
                          whileHover={{ scale: 1.1, backgroundColor: greenAccentLight, color: greenAccent }}
                          whileTap={{ scale: 0.9 }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(music);
                          }}
                          className="p-2 rounded-xl bg-[#b7eacb] text-[#1b5f52] transition-all"
                        >
                          <DownloadIcon fontSize="medium" />
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