import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// Replace react-icons with Material UI icons
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import GroupsIcon from '@mui/icons-material/Groups';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import GitHubIcon from '@mui/icons-material/GitHub';
import TwitterIcon from '@mui/icons-material/Twitter';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';

const AboutUs = () => {
  const [fadeIn, setFadeIn] = useState(false);
  const [fadeInTeam, setFadeInTeam] = useState(false);
  const [fadeInVision, setFadeInVision] = useState(false);
  const [fadeInMission, setFadeInMission] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const statsRef = useRef(null);
  
  useEffect(() => {
    setFadeIn(true);
    
    const handleScroll = () => {
      // Show/hide scroll to top button
      if (window.scrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
      
      const visionSection = document.getElementById('vision-section');
      const missionSection = document.getElementById('mission-section');
      const teamSection = document.getElementById('team-section');
      
      if (visionSection) {
        const visionRect = visionSection.getBoundingClientRect();
        if (visionRect.top <= window.innerHeight * 0.8) {
          setFadeInVision(true);
          if (visionRect.top <= 200 && visionRect.bottom >= 200) {
            setActiveSection('vision-section');
          }
        }
      }
      
      if (missionSection) {
        const missionRect = missionSection.getBoundingClientRect();
        if (missionRect.top <= window.innerHeight * 0.8) {
          setFadeInMission(true);
          if (missionRect.top <= 200 && missionRect.bottom >= 200) {
            setActiveSection('mission-section');
          }
        }
      }
      
      if (teamSection) {
        const teamRect = teamSection.getBoundingClientRect();
        if (teamRect.top <= window.innerHeight * 0.8) {
          setFadeInTeam(true);
          if (teamRect.top <= 200 && teamRect.bottom >= 200) {
            setActiveSection('team-section');
          }
        }
      }
      
      // Parallax effect
      const parallaxElements = document.querySelectorAll('.parallax');
      const scrolled = window.scrollY;
      parallaxElements.forEach(element => {
        const speed = element.getAttribute('data-speed');
        element.style.transform = `translateY(${scrolled * speed}px)`;
      });
    };
    
    // Increment stats
    const incrementStats = () => {
      const statsElement = statsRef.current;
      if (statsElement) {
        const statsRect = statsElement.getBoundingClientRect();
        if (statsRect.top <= window.innerHeight * 0.8) {
          const counters = statsElement.querySelectorAll('.stat-counter');
          counters.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'));
            const count = parseInt(counter.innerText);
            const increment = target / 30; // Increment by this amount each time
            
            if (count < target) {
              counter.innerText = Math.ceil(count + increment);
              setTimeout(incrementStats, 50);
            } else {
              counter.innerText = target;
            }
          });
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', incrementStats);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', incrementStats);
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
  
  const teamMembers = [
    {
      name: "Hannah Aurora Busto",
      role: "Fullstack Developer",
      image: "/images/member1.png",
      social: { linkedin: "#", github: "https://github.com/forborealis" }
    },
    {
      name: "Aminah Malic",
      role: "Fullstack Developer",
      image: "/images/member3.png",
      social: { linkedin: "#", github: "https://github.com/Minazuna" }
    },
    {
      name: "Prof. Pops Madriaga",
      role: "Project Adviser",
      image: "/images/maampops.png",
      social: { linkedin: "#", github: "#" }
    },
    {
      name: "Angel Galapon",
      role: "Developer",
      image: "/images/member2.png",
      social: { linkedin: "#", github: "https://github.com/endyelg" }
    },
    {
      name: "Resty Jr Cailao",
      role: "Developer",
      image: "/images/member4.png",
      social: { linkedin: "#", github: "#" }
    }
  ];
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-[#67b88f] via-[#93c4ab] to-[#fdffff] font-nunito overflow-hidden">
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
            backgroundColor: '#64aa86',
            '&:hover': {
              backgroundColor: '#4a8a68',
            },
            zIndex: 40,
          }}
        >
          <ArrowUpwardIcon />
        </Fab>
      </Zoom>
      
      {/* Navigation Bar - Similar to Landing Page */}
      <nav className="w-full bg-white/80 backdrop-blur-md fixed top-0 z-50 shadow-sm px-6 py-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-[#4a8063] text-2xl font-bold">Mindful Map</h1>
          
                {/* Desktop Navigation */}
      <div className="hidden md:flex items-center space-x-6">
        {/* Section links for current page */}
        <a 
          href="#vision-section" 
          onClick={(e) => {e.preventDefault(); scrollToSection('vision-section');}}
          className="text-[#4a8063] font-semibold hover:text-[#64aa86] transition-colors"
        >
          Vision
        </a>
        <a 
          href="#mission-section" 
          onClick={(e) => {e.preventDefault(); scrollToSection('mission-section');}}
          className="text-[#4a8063] font-semibold hover:text-[#64aa86] transition-colors"
        >
          Mission
        </a>
        <a 
          href="#team-section" 
          onClick={(e) => {e.preventDefault(); scrollToSection('team-section');}}
          className="text-[#4a8063] font-semibold hover:text-[#64aa86] transition-colors"
        >
          Team
        </a>
        
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
            className="md:hidden bg-white absolute left-0 right-0 shadow-lg py-4 px-6 z-50"
          >
            <div className="flex flex-col space-y-4">
              <Link to="/" className="text-[#4a8063] font-semibold py-2 hover:bg-[#eef6f1] px-3 rounded-lg">Home</Link>
              <Link to="/about" className="text-[#4a8063] font-semibold py-2 hover:bg-[#eef6f1] px-3 rounded-lg">About</Link>
              <Link to="/features" className="text-[#4a8063] font-semibold py-2 hover:bg-[#eef6f1] px-3 rounded-lg">Features</Link>
              
              <div className="pt-2 border-t border-gray-100">
                <span 
                  className="text-[#4a8063] font-semibold py-2 hover:bg-[#eef6f1] px-3 rounded-lg block"
                  onClick={() => scrollToSection('vision-section')}
                >
                  Vision
                </span>
                <span 
                  className="text-[#4a8063] font-semibold py-2 hover:bg-[#eef6f1] px-3 rounded-lg block"
                  onClick={() => scrollToSection('mission-section')}
                >
                  Mission
                </span>
                <span 
                  className="text-[#4a8063] font-semibold py-2 hover:bg-[#eef6f1] px-3 rounded-lg block"
                  onClick={() => scrollToSection('team-section')}
                >
                  The Team
                </span>
              </div>
              
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
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between mt-32"
      >
        <div className="text-center md:text-left md:w-1/2 md:pl-10 lg:pl-20">
          <h1 className="text-4xl md:text-6xl font-bold text-[#292f33] mb-6 leading-tight relative">
            <span className="relative">
              We're Here to Help
              <span className="absolute -bottom-2 left-0 w-1/2 h-1 bg-[#64aa86]"></span>
            </span>
          </h1>
          <p className="text-lg text-justify text-[#292f33] mb-8">
            Mindful Map is a daily mood and activity tracking system designed to help you understand the connection between your emotions and daily routines. By logging your moods and activities, you can identify patterns that influence your well-being, empowering you to manage your emotions more effectively.
          </p>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#e8f5ef' }}
            whileTap={{ scale: 0.95 }}
            className="bg-white text-[#6fba94] font-bold px-8 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            onClick={() => navigate('/signup')}
          >
            Start Your Journey
          </motion.button>
        </div>
        <div className={`md:w-1/2 mt-10 md:mt-0 flex justify-center md:justify-end md:pr-10 lg:pr-20 relative`}>
          <motion.div 
            className="absolute w-64 h-64 bg-[#64aa86] rounded-full opacity-10 -z-10"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{ 
              duration: 12,
              repeat: Infinity,
              repeatType: "reverse"
            }}
            style={{ top: '-10%', right: '15%' }}
          />
          <motion.img 
            src="/images/about.png" 
            alt="About Us" 
            className="w-full h-auto max-w-lg relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            whileHover={{ scale: 1.03, rotate: 1 }}
          />
        </div>
      </motion.div>

     
      
      {/* Vision Section */}
      <div id="vision-section" className={`w-full bg-[#eef0ee] py-20 transition-opacity duration-1000 ${fadeInVision ? 'opacity-100' : 'opacity-0'}`}>
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between">
          <motion.div
            className="md:w-1/3 mb-10 md:mb-0"
            whileHover={{ rotate: 2 }}
          >
            <div className="relative">
              <div className="absolute -top-3 -right-3 w-32 h-32 bg-[#64aa86] rounded-full opacity-20"></div>
              <img 
                src="/images/vision.png" 
                alt="Vision" 
                className="w-full h-auto max-w-sm mx-auto relative z-10 parallax" 
                data-speed="0.05"
              />
            </div>
          </motion.div>
          <div className="md:w-2/3 md:pl-12 text-left">
            <div className="flex items-center mb-6">
              <LightbulbIcon sx={{ fontSize: 40, color: '#f59e0b', marginRight: 2 }} />
              <h2 className="text-4xl font-bold text-[#292f33] relative">
                Vision
                <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-amber-500"></span>
              </h2>
            </div>
            <motion.p 
              className="text-lg text-[#292f33] mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: fadeInVision ? 1 : 0, y: fadeInVision ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              To empower individuals with self-awareness and emotional resilience by providing a seamless and insightful way to track and understand their moods and daily activities. Mindful Map envisions a world where everyone can achieve emotional balance and well-being through mindful reflection and data-driven insights.
            </motion.p>
            <motion.p 
              className="text-lg text-[#292f33]"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: fadeInVision ? 1 : 0, y: fadeInVision ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Our vision is to create a supportive community where individuals can share their experiences and learn from each other. We believe that by fostering a culture of openness and understanding, we can help people develop healthier emotional habits and improve their overall quality of life.
            </motion.p>
          </div>
        </div>
      </div>
      
      {/* Mission Section */}
      <div id="mission-section" className={`w-full bg-[#64aa86] py-20 transition-opacity duration-1000 ${fadeInMission ? 'opacity-100' : 'opacity-0'}`}>
        <div className="container mx-auto px-4 flex flex-col-reverse md:flex-row items-center justify-between">
          <div className="md:w-2/3 md:pr-12 text-left">
            <div className="flex items-center mb-6">
              <RocketLaunchIcon sx={{ fontSize: 40, color: '#fff', marginRight: 2 }} />
              <h2 className="text-4xl font-bold text-white relative">
                Mission
                <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-white"></span>
              </h2>
            </div>
            <motion.p 
              className="text-lg text-white mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: fadeInMission ? 1 : 0, y: fadeInMission ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              Mindful Map strives to help users in building healthier emotional habits by offering an intuitive platform for mood and activity tracking. Through personalized insights and recommendations, we aim to support users in properly managing their emotions, fostering self-awareness, and improving overall mental well-being.
            </motion.p>
            <motion.p 
              className="text-lg text-white"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: fadeInMission ? 1 : 0, y: fadeInMission ? 0 : 20 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Our mission is to provide a user-friendly and accessible tool that empowers individuals to take control of their mental health. We are committed to continuous improvement and innovation, ensuring that Mindful Map remains a valuable resource for our users.
            </motion.p>
          </div>
          <motion.div
            className="md:w-1/3 mb-10 md:mb-0"
            whileHover={{ rotate: -2 }}
          >
            <div className="relative">
              <div className="absolute -top-3 -left-3 w-32 h-32 bg-white rounded-full opacity-20"></div>
              <img 
                src="/images/mission.png" 
                alt="Mission" 
                className="w-full h-auto max-w-sm mx-auto relative z-10 parallax" 
                data-speed="-0.05"
              />
            </div>
          </motion.div>
        </div>
      </div>
      
      {/* Team Section */}
      <div id="team-section" className={`container mx-auto px-4 py-20 text-center transition-opacity duration-1000 ${fadeInTeam ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-center mb-12">
          <GroupsIcon sx={{ fontSize: 40, color: '#64aa86', marginRight: 2 }} />
          <h2 className="text-4xl md:text-5xl font-bold text-[#292f33] relative">
            Our Team
          </h2>
        </div>

        <div className="flex flex-wrap justify-center gap-8 mb-20">
          {teamMembers.map((member, index) => (
            <motion.div 
              key={index}
              className="relative bg-[#eef0ee] rounded-lg shadow-lg overflow-hidden w-64 group"
              whileHover={{ y: -10, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: fadeInTeam ? 1 : 0, y: fadeInTeam ? 0 : 50 }}
              transition={{ duration: 0.5, delay: 0.1 * index }}
            >
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-400 to-teal-600"></div>
              <div className="relative pt-6 px-6">
                <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#64aa86] rounded-full opacity-10"></div>
                <img 
                  src={member.image} 
                  alt={member.name} 
                  className="w-full h-auto rounded-lg mb-4 transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#292f33] mb-1">{member.name}</h3>
                <p className="text-[#64aa86] font-medium mb-4">{member.role}</p>
                <div className="flex justify-center space-x-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <a href={member.social.github} className="text-gray-600 hover:text-[#333]">
                    <GitHubIcon />
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
        
        <motion.div
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="inline-block"
        >
          <button 
            className="bg-[#64aa86] text-white font-bold px-8 py-3 rounded-full shadow-lg hover:bg-[#4a8a68] transition-colors duration-300"
            onClick={() => navigate('/signup')}
          >
            Join Mindful Map Today
          </button>
        </motion.div>
      </div>
      
      {/* Footer - Similar to Landing Page */}
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

export default AboutUs;