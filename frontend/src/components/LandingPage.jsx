import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MoodIcon from '@mui/icons-material/Mood';
import RecommendIcon from '@mui/icons-material/Recommend';
import BarChartIcon from '@mui/icons-material/BarChart';
import BookIcon from '@mui/icons-material/Book';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

// Image arrays
const heroImages = [
  '/images/landing1.png',
  '/images/landing2.png',
  '/images/landing3.png',
  '/images/landing4.png',
  '/images/landing5.png'
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeImage, setFadeImage] = useState(true);
  const [showWhatWeDo, setShowWhatWeDo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const whatWeDoRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
    setFadeIn(true);
    const interval = setInterval(() => {
      setFadeImage(false);
      setTimeout(() => {
        setCurrentImageIndex((prevIndex) => (prevIndex + 1) % heroImages.length);
        setFadeImage(true);
      }, 500);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      if (whatWeDoRef.current) {
        const whatWeDoRect = whatWeDoRef.current.getBoundingClientRect();
        if (whatWeDoRect.top <= window.innerHeight * 0.8) {
          setShowWhatWeDo(true);
        }
      }
      
      if (statsRef.current) {
        const statsRect = statsRef.current.getBoundingClientRect();
        if (statsRect.top <= window.innerHeight * 0.8) {
          setShowStats(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToWhatWeDo = () => {
    whatWeDoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start font-nunito overflow-x-hidden bg-gradient-to-br from-[#F1F8E8] via-[#D8EFD3] to-[#95D2B3]">
      {/* Navigation Bar */}
      <nav className="w-full bg-[#55AD9B] backdrop-blur-lg fixed top-0 z-50 shadow-lg border-b border-[#95D2B3]/20">
        <div className="container mx-auto flex justify-between items-center px-6 py-4">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-[#F1F8E8] text-3xl font-bold tracking-wide"
          >
            Mindful Map
          </motion.h1>
          
          
          {/* Desktop Navigation - Centered */}
          <div className="hidden md:flex items-center justify-center flex-1">
            <div className="flex items-center space-x-8">
              <Link to="/" className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group">
                Home
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/about" className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/mental-health-resources" className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group">
                Resources
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300"></span>
              </Link>
              <Link to="/" className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
          </div>

         {/* Get Started Button */}
          <div className="hidden md:block">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link to="/signup" className="bg-[#F1F8E8] text-[#55AD9B] text-lg px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold hover:bg-white">
                Get Started
              </Link>
            </motion.div>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#F1F8E8] focus:outline-none p-2"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="md:hidden bg-[#55AD9B]/95 backdrop-blur-lg border-t border-[#95D2B3]/20 shadow-lg"
            >
              <div className="flex flex-col space-y-4 py-6 px-6">
                <Link to="/" className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors">Home</Link>
                <Link to="/about" className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors">About</Link>
                <Link to="/mental-health-resources" className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors">Resources</Link>
                <Link to="/signin" className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors">Login</Link>
                <Link to="/signup" className="bg-[#F1F8E8] text-[#55AD9B] px-6 py-3 rounded-full text-center shadow-lg hover:bg-white">
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-6 flex flex-col lg:flex-row items-center justify-between mt-32 md:mt-40 mb-20">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center lg:text-left lg:w-1/2 lg:pl-16 lg:pr-8"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 leading-tight">
            Your Mental
            <br />
            <span className="bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] bg-clip-text text-transparent">
              Wellness Journey
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-2xl leading-relaxed">
            Track your emotions, discover patterns, and build healthier habits with personalized insights.
          </p>
          
          <div className="flex flex-col sm:flex-row justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6 mb-8">
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] text-white px-10 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all font-semibold text-lg flex items-center justify-center"
              onClick={() => navigate('/signup')}
            >
              <PlayArrowIcon className="mr-2" />
              Start Free
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm border-2 border-[#55AD9B] text-[#55AD9B] px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold text-lg"
              onClick={() => navigate('/about')}
            >
              Learn More
            </motion.button>
          </div>
          
          <div className="mt-16 hidden lg:block">
            <motion.button 
              onClick={scrollToWhatWeDo}
              className="flex items-center text-[#55AD9B] hover:text-[#95D2B3] transition-all group"
              whileHover={{ y: 5 }}
            >
              <span className="mr-2 font-semibold">Discover Features</span>
              <KeyboardArrowDownIcon className="animate-bounce group-hover:animate-pulse" />
            </motion.button>
          </div>
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, x: 50, scale: 0.8 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="lg:w-1/2 mt-12 lg:mt-0 flex justify-center relative"
        >
          {/* Large Central Blur Effect */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 180, 360],
              opacity: [0.6, 0.8, 0.6]
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute inset-0 w-96 h-96 bg-[#55AD9B] rounded-full opacity-60 blur-3xl"
          ></motion.div>
          
          {/* Secondary Floating Elements */}
          <motion.div 
            animate={{ 
              y: [-20, 20, -20], 
              x: [-10, 10, -10],
              scale: [0.8, 1.1, 0.8]
            }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-10 left-10 w-32 h-32 bg-[#55AD9B] rounded-full opacity-40 blur-2xl"
          ></motion.div>
          <motion.div 
            animate={{ 
              y: [20, -20, 20], 
              x: [10, -10, 10],
              scale: [1.1, 0.8, 1.1]
            }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute bottom-20 right-10 w-24 h-24 bg-[#55AD9B] rounded-full opacity-50 blur-xl"
          ></motion.div>
          
          <img
            src={heroImages[currentImageIndex]}
            alt="Mindful Map Interface"
            className={`w-full h-auto max-w-lg transition-all duration-500 ${fadeImage ? 'opacity-100 scale-100' : 'opacity-50 scale-95'} relative z-10`}
          />
        </motion.div>
      </div>

      {/* Stats Section */}
      <motion.div 
        ref={statsRef}
        initial={{ opacity: 0, y: 50 }}
        animate={showStats ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8 }}
        className="w-full bg-white/60 backdrop-blur-sm py-16 border-y border-[#95D2B3]/20"
      >
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={showStats ? { scale: 1 } : {}}
                transition={{ delay: 0.1 }}
                className="text-4xl md:text-5xl font-bold text-[#55AD9B] mb-2"
              >
                10K+
              </motion.div>
              <p className="text-gray-600 font-semibold">Active Users</p>
            </div>
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={showStats ? { scale: 1 } : {}}
                transition={{ delay: 0.2 }}
                className="text-4xl md:text-5xl font-bold text-[#55AD9B] mb-2"
              >
                95%
              </motion.div>
              <p className="text-gray-600 font-semibold">Success Rate</p>
            </div>
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={showStats ? { scale: 1 } : {}}
                transition={{ delay: 0.3 }}
                className="text-4xl md:text-5xl font-bold text-[#55AD9B] mb-2"
              >
                50M+
              </motion.div>
              <p className="text-gray-600 font-semibold">Mood Entries</p>
            </div>
            <div className="text-center">
              <motion.div 
                initial={{ scale: 0 }}
                animate={showStats ? { scale: 1 } : {}}
                transition={{ delay: 0.4 }}
                className="text-4xl md:text-5xl font-bold text-[#55AD9B] mb-2"
              >
                24/7
              </motion.div>
              <p className="text-gray-600 font-semibold">Available</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* What We Do Section */}
      <div 
        ref={whatWeDoRef}
        className={`transition-all duration-1000 transform ${showWhatWeDo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} w-full py-24`}
      >
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={showWhatWeDo ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl text-gray-800 font-bold mb-6">
              Features That
              <span className="block bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] bg-clip-text text-transparent">
                Make a Difference
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] rounded-full mx-auto mb-6"></div>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={showWhatWeDo ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.1 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm hover:bg-gradient-to-br hover:from-[#55AD9B] hover:to-[#95D2B3] p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all group border border-[#95D2B3]/20"
            >
              <div className="bg-gradient-to-br from-[#F1F8E8] to-[#D8EFD3] group-hover:bg-white/90 rounded-2xl p-6 mb-8 w-24 h-24 flex items-center justify-center transform transition-all group-hover:scale-110">
                <MoodIcon className="text-[#55AD9B] group-hover:text-[#55AD9B]" style={{ fontSize: 48 }} />
              </div>
              <h3 className="text-3xl text-gray-800 group-hover:text-white font-bold mb-6">Mood Tracking</h3>
              <p className="text-gray-600 group-hover:text-white/90 text-lg leading-relaxed">
                Track emotions with intelligent prompts and discover patterns in your mental health.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={showWhatWeDo ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.2 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm hover:bg-gradient-to-br hover:from-[#55AD9B] hover:to-[#95D2B3] p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all group border border-[#95D2B3]/20"
            >
              <div className="bg-gradient-to-br from-[#F1F8E8] to-[#D8EFD3] group-hover:bg-white/90 rounded-2xl p-6 mb-8 w-24 h-24 flex items-center justify-center transform transition-all group-hover:scale-110">
                <RecommendIcon className="text-[#55AD9B] group-hover:text-[#55AD9B]" style={{ fontSize: 48 }} />
              </div>
              <h3 className="text-3xl text-gray-800 group-hover:text-white font-bold mb-6">Smart Insights</h3>
              <p className="text-gray-600 group-hover:text-white/90 text-lg leading-relaxed">
                Get personalized recommendations based on your unique patterns and habits.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={showWhatWeDo ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.3 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm hover:bg-gradient-to-br hover:from-[#55AD9B] hover:to-[#95D2B3] p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all group border border-[#95D2B3]/20"
            >
              <div className="bg-gradient-to-br from-[#F1F8E8] to-[#D8EFD3] group-hover:bg-white/90 rounded-2xl p-6 mb-8 w-24 h-24 flex items-center justify-center transform transition-all group-hover:scale-110">
                <BarChartIcon className="text-[#55AD9B] group-hover:text-[#55AD9B]" style={{ fontSize: 48 }} />
              </div>
              <h3 className="text-3xl text-gray-800 group-hover:text-white font-bold mb-6">Visual Analytics</h3>
              <p className="text-gray-600 group-hover:text-white/90 text-lg leading-relaxed">
                Beautiful charts and graphs to visualize your progress and celebrate milestones.
              </p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, x: 30 }}
              animate={showWhatWeDo ? { opacity: 1, x: 0 } : {}}
              transition={{ delay: 0.4 }}
              whileHover={{ y: -10, scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm hover:bg-gradient-to-br hover:from-[#55AD9B] hover:to-[#95D2B3] p-10 rounded-3xl shadow-xl hover:shadow-2xl transition-all group border border-[#95D2B3]/20"
            >
              <div className="bg-gradient-to-br from-[#F1F8E8] to-[#D8EFD3] group-hover:bg-white/90 rounded-2xl p-6 mb-8 w-24 h-24 flex items-center justify-center transform transition-all group-hover:scale-110">
                <BookIcon className="text-[#55AD9B] group-hover:text-[#55AD9B]" style={{ fontSize: 48 }} />
              </div>
              <h3 className="text-3xl text-gray-800 group-hover:text-white font-bold mb-6">Journaling</h3>
              <p className="text-gray-600 group-hover:text-white/90 text-lg leading-relaxed">
                Guided prompts and reflection exercises to promote self-awareness and growth.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Call To Action */}
      <div className="w-full bg-gradient-to-r from-[#55AD9B] via-[#95D2B3] to-[#55AD9B] py-24 relative overflow-hidden">
        <div className="container mx-auto px-6 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-5xl md:text-6xl text-white font-bold mb-8 leading-tight">
              Start Your Journey
              <span className="block">Today</span>
            </h2>
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              Join thousands of users building healthier mental habits.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-[#55AD9B] px-12 py-5 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-all flex items-center justify-center mx-auto"
              onClick={() => navigate('/signup')}
            >
              <PlayArrowIcon className="mr-2" />
              Get Started Free
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;