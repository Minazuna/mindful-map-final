import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MoodIcon from '@mui/icons-material/Mood';
import RecommendIcon from '@mui/icons-material/Recommend';
import BarChartIcon from '@mui/icons-material/BarChart';
import BookIcon from '@mui/icons-material/Book';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

// Image arrays
const heroImages = [
  '/images/landing1.png',
  '/images/landing2.png',
  '/images/landing3.png',
  '/images/landing4.png',
  '/images/landing5.png'
];

const previewImages = [
  {
    image: '/images/preview1.png',
    title: 'Daily Mood Tracking'
  },
  {
    image: '/images/preview2.png',
    title: 'Track Your Habits'
  },
  {
    image: '/images/preview3.png',
    title: 'Interactive Recommendations'
  },
  {
    image: '/images/preview4.png',
    title: 'Mood-Activity Correlation'
  },
  {
    image: '/images/preview5.png',
    title: 'Weekly Statistics'
  },
  {
    image: '/images/preview6.png',
    title: 'Mindful Activities'
  },
  {
    image: '/images/preview7.png',
    title: 'Predictive Analysis'
  }
];

const LandingPage = () => {
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [fadeImage, setFadeImage] = useState(true);
  const [showWhatWeDo, setShowWhatWeDo] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const previewRef = useRef(null);
  const whatWeDoRef = useRef(null);

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
      
      if (previewRef.current) {
        const previewRect = previewRef.current.getBoundingClientRect();
        if (previewRect.top <= window.innerHeight * 0.8) {
          setShowPreview(true);
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleNextPreview = () => {
    setCurrentPreviewIndex((prevIndex) => (prevIndex + 1) % previewImages.length);
  };

  const handlePrevPreview = () => {
    setCurrentPreviewIndex((prevIndex) => (prevIndex === 0 ? previewImages.length - 1 : prevIndex - 1));
  };

  const scrollToWhatWeDo = () => {
    whatWeDoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-start font-nunito overflow-x-hidden bg-gradient-to-b from-[#eef6f1] to-[#e5f0e9]">
      {/* Navigation Bar - Simplified */}
      <nav className="w-full bg-white/80 backdrop-blur-md fixed top-0 z-50 shadow-sm px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-[#4a8063] text-2xl font-bold">Mindful Map</h1>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-[#4a8063] font-semibold hover:text-[#64aa86] transition-colors">Home</Link>
            <Link to="/about" className="text-[#4a8063] font-semibold hover:text-[#64aa86] transition-colors">About</Link>
            <Link to="/signin" className="text-[#4a8063] font-semibold hover:text-[#64aa86] transition-colors">Login</Link>
            <Link to="/signup" className="bg-[#4a8063] text-white px-6 py-2 rounded-full shadow-md hover:bg-[#3d6952] transition-colors">
              Sign Up
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#4a8063] focus:outline-none"
            >
              {mobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
            </button>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="md:hidden bg-white absolute left-0 right-0 shadow-lg py-4 px-6"
          >
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-[#4a8063] font-semibold py-2 hover:bg-[#eef6f1] px-3 rounded-lg">Home</Link>
              <Link to="/about" className="text-[#4a8063] font-semibold py-2 hover:bg-[#eef6f1] px-3 rounded-lg">About</Link>
              <Link to="/features" className="text-[#4a8063] font-semibold py-2 hover:bg-[#eef6f1] px-3 rounded-lg">Features</Link>
              <div className="flex flex-col space-y-2 pt-2">
                <Link to="/signup" className="bg-[#4a8063] text-white px-6 py-3 rounded-full text-center shadow-md hover:bg-[#3d6952]">
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>

      {/* Hero Section */}
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between mt-32 md:mt-40 mb-16">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center md:text-left md:w-1/2 md:pl-12 lg:pl-28"
        >
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-[#292f33] mb-6 leading-tight">
            Unlock a<br />
            <span className="text-[#4a8063]">Healthier Mind</span>
          </h1>
          <p className="text-xl md:text-2xl text-[#5a5f63] mb-8 max-w-xl text-justify">
            Track your moods daily and discover how your activities impact your mental wellbeing through data-driven insights.
          </p>
          <div className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
            <button
              className="bg-[#64aa86] text-white px-8 py-3 rounded-full shadow-lg hover:bg-[#5a9a76] hover:shadow-xl transition-all transform hover:-translate-y-1"
              onClick={() => navigate('/signup')}
            >
              Get Started
            </button>
            <button
              className="bg-white border-2 border-[#64aa86] text-[#64aa86] px-8 py-3 rounded-full shadow-md hover:bg-[#f9fcfa] transition-all"
              onClick={() => navigate('/about')}
            >
              About Us
            </button>
          </div>
          <div className="mt-12 hidden md:block">
            <button 
              onClick={scrollToWhatWeDo}
              className="flex items-center text-[#64aa86] hover:text-[#5a9a76] transition-all"
            >
              Learn More <KeyboardArrowDownIcon className="animate-bounce ml-1" />
            </button>
          </div>
        </motion.div>
        
        <div className={`transition-opacity duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'} md:w-1/2 mt-20 md:mt-0 flex justify-center md:justify-end md:pr-12 lg:pr-28 relative`}>
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0 flex justify-center items-center z-0"
          >
            <div className="w-[500px] h-[500px] rounded-full bg-[#64aa86] opacity-30" style={{ filter: 'blur(100px)' }}></div>
          </motion.div>
          <img
            src={heroImages[currentImageIndex]}
            alt="Mindful Map"
            className={`w-full h-auto max-w-lg transition-opacity duration-500 ${fadeImage ? 'opacity-100' : 'opacity-0'} z-10 drop-shadow-2xl`}
          />
        </div>
      </div>
      
      {/* Sleek Laptop-Style Preview Carousel */}
      <div 
        ref={previewRef} 
        className={`transition-all duration-1000 transform ${showPreview ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} w-full py-24 bg-gradient-to-br from-[#3d6952] to-[#2d5340]`}
      >
        <div className="container mx-auto">
          <h2 className="text-4xl md:text-5xl text-white font-bold text-center mb-4">Experience Mindful Map today!</h2>
          <div className="h-1 w-24 bg-[#64aa86] rounded-full mx-auto mb-16"></div>
          
          {/* Laptop Frame */}
          <div className="relative max-w-5xl mx-auto">
            {/* Laptop Top Part (Screen) */}
            <div className="relative mx-auto" style={{ maxWidth: "75%" }}>
              {/* Laptop Screen Frame */}
              <div className="bg-[#252525] rounded-t-xl p-2 shadow-xl">
                {/* Screen Content */}
                <div className="relative overflow-hidden" style={{ paddingBottom: "62.5%" }}>
                  {/* Screen Carousel */}
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={currentPreviewIndex}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className="absolute inset-0 bg-white rounded-sm"
                    >
                      <img 
                        src={previewImages[currentPreviewIndex].image}
                        alt={previewImages[currentPreviewIndex].title}
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>
              
              {/* Laptop Bottom Part (Body) */}
              <div className="relative">
                <div 
                  className="bg-gradient-to-b from-[#474747] to-[#252525] h-5 rounded-b-xl"
                  style={{
                    boxShadow: "0 4px 8px rgba(0,0,0,0.3)",
                    transform: "perspective(800px) rotateX(5deg)",
                    transformOrigin: "top"
                  }}
                ></div>
                
                {/* Laptop Stand Shadow */}
                <div 
                  className="mx-auto h-2 rounded-full bg-[#1a1a1a] mt-1"
                  style={{
                    width: "20%", 
                    boxShadow: "0 0 15px rgba(0,0,0,0.4)"
                  }}
                ></div>
              </div>
            </div>
            
            {/* Carousel Controls */}
            <button
              onClick={handlePrevPreview}
              className="absolute top-1/2 left-0 transform -translate-y-1/2 -translate-x-4 bg-white/90 text-[#4a8063] p-3 rounded-full shadow-lg hover:bg-[#4a8063] hover:text-white transition-all md:-translate-x-10"
              aria-label="Previous image"
            >
              <ArrowBackIosIcon fontSize="small" />
            </button>
            
            <button
              onClick={handleNextPreview}
              className="absolute top-1/2 right-0 transform -translate-y-1/2 translate-x-4 bg-white/90 text-[#4a8063] p-3 rounded-full shadow-lg hover:bg-[#4a8063] hover:text-white transition-all md:translate-x-10"
              aria-label="Next image"
            >
              <ArrowForwardIosIcon fontSize="small" />
            </button>
            
            {/* Image Title */}
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-12 text-center"
            >
              <h3 className="text-2xl md:text-3xl text-white font-bold tracking-wider">{previewImages[currentPreviewIndex].title}</h3>
            </motion.div>
            
            {/* Dots Indicator */}
            <div className="flex justify-center space-x-2 mt-6">
              {previewImages.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentPreviewIndex(index)}
                  className={`w-3 h-3 rounded-full transition-all ${currentPreviewIndex === index ? 'bg-white scale-125' : 'bg-white/30'}`}
                  aria-label={`Go to image ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* What We Do Section */}
      <div 
        ref={whatWeDoRef}
        className={`transition-all duration-1000 transform ${showWhatWeDo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} w-full py-20`}
      >
        <div className="container mx-auto px-6">
          <h2 className="text-4xl text-[#292f33] font-bold text-center mb-3">What We Do</h2>
          <p className="text-xl text-[#5a5f63] text-center max-w-2xl mx-auto mb-12">
            Our comprehensive approach helps you understand your emotions and improve your wellbeing
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white hover:bg-gradient-to-br hover:from-[#64aa86] hover:to-[#4a8063] p-8 rounded-3xl shadow-lg transition-all group"
            >
              <div className="bg-[#eef6f1] group-hover:bg-white/90 rounded-full p-5 mb-6 w-20 h-20 flex items-center justify-center transform transition-all group-hover:scale-110">
                <MoodIcon className="text-[#64aa86] group-hover:text-[#4a8063]" style={{ fontSize: 40 }} />
              </div>
              <h3 className="text-2xl text-[#292f33] group-hover:text-white font-bold mb-4">Mood Tracking</h3>
              <p className="text-[#5a5f63] group-hover:text-white/90 text-justify">
                Our correlation analysis visualizes how your habits affect your emotions, giving you powerful insights into your mental health patterns.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white hover:bg-gradient-to-br hover:from-[#64aa86] hover:to-[#4a8063] p-8 rounded-3xl shadow-lg transition-all group"
            >
              <div className="bg-[#eef6f1] group-hover:bg-white/90 rounded-full p-5 mb-6 w-20 h-20 flex items-center justify-center transform transition-all group-hover:scale-110">
                <RecommendIcon className="text-[#64aa86] group-hover:text-[#4a8063]" style={{ fontSize: 40 }} />
              </div>
              <h3 className="text-2xl text-[#292f33] group-hover:text-white font-bold mb-4">Personalized Recommendations</h3>
              <p className="text-[#5a5f63] group-hover:text-white/90 text-justify">
                Receive tailored recommendations based on your unique data patterns, helping you make meaningful improvements to your daily routine.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white hover:bg-gradient-to-br hover:from-[#64aa86] hover:to-[#4a8063] p-8 rounded-3xl shadow-lg transition-all group"
            >
              <div className="bg-[#eef6f1] group-hover:bg-white/90 rounded-full p-5 mb-6 w-20 h-20 flex items-center justify-center transform transition-all group-hover:scale-110">
                <BarChartIcon className="text-[#64aa86] group-hover:text-[#4a8063]" style={{ fontSize: 40 }} />
              </div>
              <h3 className="text-2xl text-[#292f33] group-hover:text-white font-bold mb-4">Data Visualization</h3>
              <p className="text-[#5a5f63] group-hover:text-white/90 text-justify">
                Interactive charts help you understand your mood trends, sleep quality patterns, and correlation statistics at a glance.
              </p>
            </motion.div>
            
            <motion.div 
              whileHover={{ y: -10 }}
              className="bg-white hover:bg-gradient-to-br hover:from-[#64aa86] hover:to-[#4a8063] p-8 rounded-3xl shadow-lg transition-all group"
            >
              <div className="bg-[#eef6f1] group-hover:bg-white/90 rounded-full p-5 mb-6 w-20 h-20 flex items-center justify-center transform transition-all group-hover:scale-110">
                <BookIcon className="text-[#64aa86] group-hover:text-[#4a8063]" style={{ fontSize: 40 }} />
              </div>
              <h3 className="text-2xl text-[#292f33] group-hover:text-white font-bold mb-4">Journaling Challenges</h3>
              <p className="text-[#5a5f63] group-hover:text-white/90 text-justify">
                Express yourself through daily journal challenges with system-automated prompts, transforming your thoughts into written insights.
              </p>
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* Call To Action */}
      <div className="w-full bg-gradient-to-r from-[#64aa86] to-[#4a8063] py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl text-white font-bold mb-6">Start Your Mindfulness Journey Today</h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands who are already tracking their emotional wellbeing and making positive changes in their lives.
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-[#4a8063] px-10 py-4 rounded-full text-xl font-bold shadow-lg hover:shadow-xl transition-all"
            onClick={() => navigate('/signup')}
          >
            Sign Up For Free
          </motion.button>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full bg-[#292f33] text-white/80 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-8 md:mb-0">
              <h3 className="text-2xl font-bold text-white mb-4">Mindful Map</h3>
              <p className="max-w-xs">
                Helping you track, understand, and improve your mental wellbeing through data-driven insights.
              </p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Links</h4>
                <ul className="space-y-2">
                  <li><Link to="/" className="hover:text-white transition-colors">Home</Link></li>
                  <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                  <li><Link to="/features" className="hover:text-white transition-colors">Features</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Account</h4>
                <ul className="space-y-2">
                  <li><Link to="/signin" className="hover:text-white transition-colors">Log In</Link></li>
                  <li><Link to="/signup" className="hover:text-white transition-colors">Sign Up</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="text-lg font-semibold text-white mb-4">Legal</h4>
                <ul className="space-y-2">
                  <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                  <li><Link to="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-white/20 mt-8 pt-8 text-center">
            <p>© {new Date().getFullYear()} Mindful Map. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;