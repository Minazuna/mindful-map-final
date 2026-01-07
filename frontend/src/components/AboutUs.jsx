import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import BarChartIcon from '@mui/icons-material/BarChart';
import GitHubIcon from '@mui/icons-material/GitHub';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsIcon from '@mui/icons-material/Notifications';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';

const AboutUs = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeInFeatures, setFadeInFeatures] = useState(false);
  const [fadeInTeam, setFadeInTeam] = useState(false);
  const [fadeInPartnership, setFadeInPartnership] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const featuresRef = useRef(null);
  
  useEffect(() => {
    setFadeIn(true);
    
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
      
      const featuresSection = document.getElementById('features-section');
      const teamSection = document.getElementById('team-section');
      const partnershipSection = document.getElementById('partnership-section');
      
      if (featuresSection) {
        const featuresRect = featuresSection.getBoundingClientRect();
        if (featuresRect.top <= window.innerHeight * 0.8) {
          setFadeInFeatures(true);
        }
      }
      
      if (teamSection) {
        const teamRect = teamSection.getBoundingClientRect();
        if (teamRect.top <= window.innerHeight * 0.8) {
          setFadeInTeam(true);
        }
      }
      
      if (partnershipSection) {
        const partnershipRect = partnershipSection.getBoundingClientRect();
        if (partnershipRect.top <= window.innerHeight * 0.8) {
          setFadeInPartnership(true);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);
  
  const scrollToSection = (sectionId) => {
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const features = [
    {
      icon: <BarChartIcon sx={{ fontSize: 50, color: '#55AD9B' }} />,
      title: "Mood Tracking",
      description: "Log your daily moods with detailed emotions and intensity levels. Track patterns over time to understand what influences your emotional state."
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 50, color: '#55AD9B' }} />,
      title: "Activity Insights",
      description: "Connect your activities with emotions. Discover which activities positively or negatively impact your mental well-being and emotional health."
    },
    {
      icon: <BarChartIcon sx={{ fontSize: 50, color: '#55AD9B' }} />,
      title: "Personalized Analytics",
      description: "Receive AI-powered insights and recommendations based on your mood and activity data. Get actionable advice to improve your emotional wellness."
    },
    {
      icon: <NotificationsIcon sx={{ fontSize: 50, color: '#55AD9B' }} />,
      title: "Smart Reminders",
      description: "Get gentle notifications to maintain consistent mood logging. Never miss an opportunity to track your emotional journey."
    }
  ];
  
  const teamMembers = [
    {
      name: "Hannah Aurora Busto",
      role: "Fullstack Developer",
      image: "/images/member1.png",
      social: { github: "https://github.com/forborealis" }
    },
    {
      name: "Aminah Malic",
      role: "Fullstack Developer",
      image: "/images/member3.png",
      social: { github: "https://github.com/Minazuna" }
    },
    {
      name: "Angel Galapon",
      role: "Developer",
      image: "/images/member2.png",
      social: { github: "https://github.com/endyelg" }
    },
    {
      name: "Resty Jr Cailao",
      role: "Developer",
      image: "/images/member4.png",
      social: { github: "#" }
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-br from-[#F1F8E8] via-[#D8EFD3] to-[#95D2B3] font-nunito overflow-x-hidden">
      {/* Scroll to Top Button */}
      <Zoom in={showScrollTop}>
        <Fab 
          color="primary" 
          size="small" 
          aria-label="scroll back to top"
          onClick={scrollToTop}
          sx={{ 
            position: 'fixed', 
            bottom: 16, 
            right: 16, 
            backgroundColor: '#55AD9B',
            '&:hover': {
              backgroundColor: '#1F8E8E',
            },
            zIndex: 40,
          }}
        >
          <ArrowUpwardIcon />
        </Fab>
      </Zoom>
      
      {/* Navigation Bar */}
      <nav className="w-full bg-[#55AD9B] backdrop-blur-lg fixed top-0 z-50 shadow-lg border-b border-[#95D2B3]/20 px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-[#F1F8E8] text-3xl font-bold tracking-wide">Mindful Map</h1>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <a 
              href="#features-section" 
              onClick={(e) => {e.preventDefault(); scrollToSection('features-section');}}
              className="text-[#F1F8E8] font-semibold hover:text-white transition-all duration-300 relative group"
            >
              Features
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300"></span>
            </a>
            <a 
              href="#team-section" 
              onClick={(e) => {e.preventDefault(); scrollToSection('team-section');}}
              className="text-[#F1F8E8] font-semibold hover:text-white transition-all duration-300 relative group"
            >
              Team
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300"></span>
            </a>
            <a 
              href="#partnership-section" 
              onClick={(e) => {e.preventDefault(); scrollToSection('partnership-section');}}
              className="text-[#F1F8E8] font-semibold hover:text-white transition-all duration-300 relative group"
            >
              Partnership
              <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300"></span>
            </a>
            
            <Link to="/signup" className="bg-[#F1F8E8] text-[#55AD9B] px-6 py-2 rounded-full shadow-md hover:shadow-lg hover:bg-white transition-all font-semibold">
              Sign Up
            </Link>
          </div>
          
          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[#F1F8E8] focus:outline-none"
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
            className="md:hidden bg-[#55AD9B]/95 backdrop-blur-lg absolute left-0 right-0 shadow-lg py-4 px-6 z-40 top-16 border-t border-[#95D2B3]/20"
          >
            <div className="flex flex-col space-y-4">
              <span 
                className="text-[#F1F8E8] font-semibold py-2 px-3 rounded-lg hover:bg-white/20 block"
                onClick={() => scrollToSection('features-section')}
              >
                Features
              </span>
              <span 
                className="text-[#F1F8E8] font-semibold py-2 px-3 rounded-lg hover:bg-white/20 block"
                onClick={() => scrollToSection('team-section')}
              >
                Team
              </span>
              <span 
                className="text-[#F1F8E8] font-semibold py-2 px-3 rounded-lg hover:bg-white/20 block"
                onClick={() => scrollToSection('partnership-section')}
              >
                Partnership
              </span>
              
              <div className="flex flex-col space-y-2 pt-2">
                <Link to="/signup" className="bg-[#F1F8E8] text-[#55AD9B] px-6 py-3 rounded-full text-center shadow-md hover:bg-white">
                  Sign Up
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </nav>
      
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between mt-32 md:mt-40 mb-20 relative"
      >
        {/* Animated Background Elements */}
        <motion.div 
          animate={{ 
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{ 
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute -left-32 top-10 w-96 h-96 bg-[#55AD9B] rounded-full opacity-10 blur-3xl -z-10"
        />
        <motion.div 
          animate={{ 
            scale: [1.2, 1, 1.2],
            rotate: [360, 180, 0]
          }}
          transition={{ 
            duration: 15,
            repeat: Infinity,
            repeatType: "reverse"
          }}
          className="absolute -right-32 bottom-0 w-96 h-96 bg-[#95D2B3] rounded-full opacity-10 blur-3xl -z-10"
        />

        <div className="text-center md:text-left md:w-1/2 md:pl-10 lg:pl-20 relative z-10">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-800 mb-6 leading-tight"
          >
            Understand Your 
            <span className="block bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] bg-clip-text text-transparent">
              Emotions Better
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-600 mb-8 leading-relaxed"
          >
            Mindful Map is your personal companion for emotional wellness. Track your moods, connect them with your daily activities, and receive AI-powered insights to help you build healthier emotional habits.
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex flex-col sm:flex-row justify-center md:justify-start space-y-4 sm:space-y-0 sm:space-x-6 mb-12"
          >
            <motion.button
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] text-white px-10 py-4 rounded-full shadow-2xl hover:shadow-3xl transition-all font-semibold text-lg"
              onClick={() => navigate('/signup')}
            >
              Explore Now
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm border-2 border-[#55AD9B] text-[#55AD9B] px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold text-lg hover:bg-white"
              onClick={scrollToFeatures}
            >
              See Features
            </motion.button>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="hidden md:block"
          >
            <motion.button 
              onClick={scrollToFeatures}
              className="flex items-center text-[#55AD9B] hover:text-[#1F8E8E] transition-all group"
              whileHover={{ y: 5 }}
            >
              <span className="mr-2 font-semibold">Learn more</span>
              <KeyboardArrowDownIcon className="animate-bounce group-hover:animate-pulse" />
            </motion.button>
          </motion.div>
        </div>

        <div className="md:w-1/2 mt-10 md:mt-0 flex justify-center md:justify-end md:pr-10 lg:pr-20 relative z-10">
          <motion.div 
            animate={{ 
              y: [-20, 20, -20]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            className="w-full"
          >
            <motion.img 
              src="/images/about.png" 
              alt="About Us" 
              className="w-full h-auto max-w-lg drop-shadow-2xl"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              whileHover={{ scale: 1.05 }}
            />
          </motion.div>
        </div>
      </motion.div>
      
      {/* Features Section */}
      <div 
        ref={featuresRef}
        id="features-section" 
        className={`w-full bg-white/60 backdrop-blur-sm py-24 transition-opacity duration-1000 border-y border-[#95D2B3]/20 ${fadeInFeatures ? 'opacity-100' : 'opacity-0'}`}
      >
        <div className="container mx-auto px-4">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={fadeInFeatures ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-20"
          >
            <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
              How Mindful Map
              <span className="block bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] bg-clip-text text-transparent">
                Works for You
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] rounded-full mx-auto mb-6"></div>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Our platform combines intuitive mood tracking with intelligent analytics to help you understand your emotional patterns.
            </p>
          </motion.div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <motion.div 
                key={index}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border border-[#95D2B3]/20 group hover:bg-gradient-to-br hover:from-[#55AD9B] hover:to-[#95D2B3]"
                initial={{ opacity: 0, y: 20 }}
                animate={fadeInFeatures ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * index }}
                whileHover={{ y: -15, scale: 1.02 }}
              >
                <div className="mb-6 flex justify-center bg-gradient-to-br from-[#F1F8E8] to-[#D8EFD3] group-hover:bg-white/90 rounded-2xl p-6 w-20 h-20 mx-auto transform transition-all group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-bold text-[#1F8E8E] group-hover:text-white mb-4 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 group-hover:text-white/90 text-center leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Team Section */}
      <div id="team-section" className={`container mx-auto px-4 py-24 text-center transition-opacity duration-1000 w-full ${fadeInTeam ? 'opacity-100' : 'opacity-0'}`}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={fadeInTeam ? { opacity: 1, y: 0 } : {}}
          className="mb-20"
        >
          <h2 className="text-5xl md:text-6xl font-bold text-gray-800 mb-6">
            Meet Our
            <span className="block bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] bg-clip-text text-transparent">
              Brilliant Team
            </span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] rounded-full mx-auto mb-6"></div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Passionate developers and innovators dedicated to improving your mental wellness.
          </p>
        </motion.div>

        <div className="flex flex-wrap justify-center gap-8 mb-16">
          {teamMembers.map((member, index) => (
            <motion.div 
              key={index}
              className="relative bg-white/80 backdrop-blur-sm rounded-3xl shadow-lg overflow-hidden w-72 border-2 border-[#D8EFD3] group hover:bg-gradient-to-br hover:from-[#55AD9B] hover:to-[#95D2B3]"
              whileHover={{ y: -15, boxShadow: '0 20px 25px -5px rgba(85, 173, 155, 0.4)' }}
              initial={{ opacity: 0, y: 50 }}
              animate={fadeInTeam ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-[#55AD9B] to-[#1F8E8E]"></div>
              <div className="pt-6 px-6">
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-64 object-cover rounded-xl mb-4 transition-transform duration-300 group-hover:scale-110"
                />
              </div>
              <div className="p-6 pb-8">
                <h3 className="text-2xl font-bold text-[#1F8E8E] group-hover:text-white mb-2">{member.name}</h3>
                <p className="text-[#55AD9B] group-hover:text-white/90 font-semibold mb-4">{member.role}</p>
                <div className="flex justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  {member.social.github !== "#" && (
                    <a href={member.social.github} target="_blank" rel="noopener noreferrer" className="text-white hover:text-[#F1F8E8] transition-colors">
                      <GitHubIcon sx={{ fontSize: 32 }} />
                    </a>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Partnership Section */}
      <div id="partnership-section" className={`w-full bg-gradient-to-r from-[#55AD9B] via-[#95D2B3] to-[#55AD9B] py-24 transition-opacity duration-1000 ${fadeInPartnership ? 'opacity-100' : 'opacity-0'} relative overflow-hidden`}>
        {/* Background Decorations */}
        <motion.div 
          animate={{ 
            scale: [1, 1.3, 1],
            opacity: [0.1, 0.2, 0.1]
          }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"
        ></motion.div>
        <motion.div 
          animate={{ 
            scale: [1.3, 1, 1.3],
            opacity: [0.15, 0.25, 0.15]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"
        ></motion.div>

        <div className="container mx-auto px-4 relative z-10">
          <motion.div 
            className="flex flex-col md:flex-row items-center justify-center gap-16"
            initial={{ opacity: 0, y: 20 }}
            animate={fadeInPartnership ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="md:w-1/2 text-center md:text-right">
              <h2 className="text-5xl md:text-6xl font-bold text-white mb-8 leading-tight">
                Built in
                <span className="block">Partnership With</span>
              </h2>
              <p className="text-xl text-white/95 leading-relaxed mb-8">
                Mindful Map is developed as a collaborative initiative with <span className="font-bold text-white">Sto. Niño Catholic School Inc.</span>, our valued partner in promoting student mental wellness and emotional intelligence. Together, we're creating tools that help students understand themselves better and build healthier emotional habits.
              </p>
              <p className="text-lg text-white/85 font-semibold">
                This partnership reflects our commitment to real-world impact in educational communities.
              </p>
            </div>
            <motion.div 
              className="md:w-1/2 flex justify-center"
              whileHover={{ scale: 1.08, rotate: 2 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={fadeInPartnership ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="bg-white rounded-3xl p-10 shadow-3xl border-4 border-white/80 backdrop-blur-sm">
                <img 
                  src="/images/sncs.png" 
                  alt="Sto. Niño Catholic School Inc." 
                  className="w-full h-auto max-w-xs mx-auto"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
      
      {/* Call to Action */}
      <div className="w-full bg-gradient-to-r from-[#55AD9B] via-[#95D2B3] to-[#55AD9B] py-20 relative">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl text-white font-bold mb-8">
              Ready to Start?
            </h2>
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="bg-white text-[#55AD9B] px-12 py-4 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-all"
              onClick={() => navigate('/signup')}
            >
              Begin Your Journey Today
            </motion.button>
          </motion.div>
        </div>
      </div>
      
      {/* Footer */}
      <footer className="w-full bg-[#292f33] text-white/80 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between mb-8">
            <div className="mb-8 md:mb-0">
              <h3 className="text-3xl font-bold text-white mb-4">Mindful Map</h3>
              <p className="max-w-xs text-gray-300">
                Track your moods, understand your emotions, and improve your mental well-being through data-driven insights.
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
          <div className="border-t border-white/20 pt-8 text-center">
            <p className="text-white font-semibold">© {new Date().getFullYear()} Mindful Map. All rights reserved.</p>
            <p className="mt-2 text-gray-400">In partnership with Sto. Niño Catholic School Inc.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default AboutUs;