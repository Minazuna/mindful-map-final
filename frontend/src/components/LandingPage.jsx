import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import MoodIcon from '@mui/icons-material/Mood';
import RecommendIcon from '@mui/icons-material/Recommend';
import BarChartIcon from '@mui/icons-material/BarChart';
import BookIcon from '@mui/icons-material/Book';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

// Image arrays (KEEP these as-is)
const heroImages = [
  '/images/landing1.png',
  '/images/landing2.png',
  '/images/landing3.png',
  '/images/landing4.png',
  '/images/landing5.png'
];

// Carousel images (landing/landing1.png - landing/landing9.png)
const montageImages = Array.from({ length: 9 }, (_, i) => `/images/landing/landing${i + 1}.png`);

const LandingPage = () => {
  const navigate = useNavigate();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fadeImage, setFadeImage] = useState(true);
  const [showWhatWeDo, setShowWhatWeDo] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Montage carousel state (under the Features section)
  const [montageIndex, setMontageIndex] = useState(0);
  const [montageFade, setMontageFade] = useState(true);

  const whatWeDoRef = useRef(null);
  const statsRef = useRef(null);

  useEffect(() => {
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

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToWhatWeDo = () => {
    whatWeDoRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const getMontageIndex = (idx) => (idx + montageImages.length) % montageImages.length;

  const setMontageIndexWithFade = (next) => {
    setMontageFade(false);
    window.setTimeout(() => {
      setMontageIndex(next);
      setMontageFade(true);
    }, 160);
  };

  const prevMontage = () => setMontageIndexWithFade(getMontageIndex(montageIndex - 1));
  const nextMontage = () => setMontageIndexWithFade(getMontageIndex(montageIndex + 1));

  useEffect(() => {
    const onKeyDown = (e) => {
      const tag = (e.target?.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || e.target?.isContentEditable) return;

      if (e.key === 'ArrowLeft') prevMontage();
      if (e.key === 'ArrowRight') nextMontage();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [montageIndex]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start font-nunito overflow-x-hidden bg-gradient-to-br from-[#F1F8E8] via-[#D8EFD3] to-[#95D2B3]">
      {/* Navigation Bar */}
      <nav className="w-full bg-[#55AD9B] backdrop-blur-lg fixed top-0 z-50 shadow-lg border-b border-[#95D2B3]/20">
        <div className="container mx-auto flex justify-between items-center px-6 py-4">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="text-[#F1F8E8] text-3xl font-bold tracking-wide">
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
              <Link
                to="/mental-health-resources"
                className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group"
              >
                Resources
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300"></span>
              </Link>
            </div>
          </div>

          {/* Get Started Button */}
          <div className="hidden md:block">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/signup"
                className="bg-[#F1F8E8] text-[#55AD9B] text-lg px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold hover:bg-white"
              >
                Sign Up
              </Link>
            </motion.div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-[#F1F8E8] focus:outline-none p-2">
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
                <Link to="/" className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors">
                  Home
                </Link>
                <Link to="/about" className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors">
                  About
                </Link>
                <Link
                  to="/mental-health-resources"
                  className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors"
                >
                  Resources
                </Link>
                <Link to="/signin" className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors">
                  Login
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    scrollToWhatWeDo();
                    setMobileMenuOpen(false);
                  }}
                  className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors text-left"
                >
                  Features
                </button>
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
            <span className="bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] bg-clip-text text-transparent">Wellness Journey</span>
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
              Get Started
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              className="bg-white/80 backdrop-blur-sm border-2 border-[#55AD9B] text-[#55AD9B] px-10 py-4 rounded-full shadow-lg hover:shadow-xl transition-all font-semibold text-lg"
              onClick={() => navigate('/about')}
            >
              Learn More
            </motion.button>
          </div>

          <div className="mt-16 hidden lg:block"></div>
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
              opacity: [0.6, 0.8, 0.6],
            }}
            transition={{ duration: 8, repeat: Infinity }}
            className="absolute inset-0 w-96 h-96 bg-[#55AD9B] rounded-full opacity-60 blur-3xl"
          ></motion.div>

          {/* Secondary Floating Elements */}
          <motion.div
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              scale: [0.8, 1.1, 0.8],
            }}
            transition={{ duration: 6, repeat: Infinity }}
            className="absolute top-10 left-10 w-32 h-32 bg-[#55AD9B] rounded-full opacity-40 blur-2xl"
          ></motion.div>
          <motion.div
            animate={{
              y: [20, -20, 20],
              x: [10, -10, 10],
              scale: [1.1, 0.8, 1.1],
            }}
            transition={{ duration: 7, repeat: Infinity }}
            className="absolute bottom-20 right-10 w-24 h-24 bg-[#55AD9B] rounded-full opacity-50 blur-xl"
          ></motion.div>

          <img
            src={heroImages[currentImageIndex]}
            alt="Mindful Map Interface"
            className={`w-full h-auto max-w-lg transition-all duration-500 ${
              fadeImage ? 'opacity-100 scale-100' : 'opacity-50 scale-95'
            } relative z-10`}
          />
        </motion.div>
      </div>

      {/* What We Do Section */}
      <div
        ref={whatWeDoRef}
        className={`transition-all duration-1000 transform ${
          showWhatWeDo ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'
        } w-full py-24`}
      >
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={showWhatWeDo ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-16"
          >
            <h2 className="text-5xl md:text-6xl text-gray-800 font-bold mb-6">
              Features That
              <span className="block bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] bg-clip-text text-transparent">Make a Difference</span>
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

          {/* NEW: Big centered montage carousel under the features (NO white containers, no side previews) */}
          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={showWhatWeDo ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="mt-16 md:mt-20"
            aria-label="App preview carousel"
          >
            <div className="max-w-6xl mx-auto">
              <div className="relative">
                {/* background glow */}
                <div className="relative flex items-center justify-center py-4 md:py-6">
                  {/* main image only */}
                  <div className="relative w-full max-w-6xl">
                    <img
                      src={montageImages[montageIndex]}
                      alt={`App preview ${montageIndex + 1}`}
                      draggable="false"
                    />

                    {/* left/right buttons */}
                    <button
                      type="button"
                      onClick={prevMontage}
                      className="absolute top-1/2 -translate-y-1/2 left-2 md:left-4 p-3 md:p-4 rounded-full bg-white/85 hover:bg-white shadow-xl border border-[#95D2B3]/35 backdrop-blur-sm transition"
                      aria-label="Previous image"
                    >
                      <ArrowBackIosNewIcon sx={{ fontSize: 18, color: '#1F8E8E' }} />
                    </button>

                    <button
                      type="button"
                      onClick={nextMontage}
                      className="absolute top-1/2 -translate-y-1/2 right-2 md:right-4 p-3 md:p-4 rounded-full bg-white/85 hover:bg-white shadow-xl border border-[#95D2B3]/35 backdrop-blur-sm transition"
                      aria-label="Next image"
                    >
                      <ArrowForwardIosIcon sx={{ fontSize: 18, color: '#1F8E8E' }} />
                    </button>
                  </div>
                </div>

                {/* dots + counter */}
                <div className="mt-6 flex flex-col items-center gap-3">
                  <div className="flex flex-wrap justify-center gap-2">
                    {montageImages.map((_, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setMontageIndexWithFade(i)}
                        className={`h-2.5 rounded-full transition-all ${
                          i === montageIndex ? 'w-10 bg-[#55AD9B]' : 'w-2.5 bg-[#95D2B3]/70 hover:bg-[#55AD9B]/60'
                        }`}
                        aria-label={`Go to image ${i + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Try it on Android Section */}
      <section className="w-full flex justify-center py-16 md:py-20 relative">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative flex flex-col md:flex-row items-center gap-10 bg-white/90 rounded-3xl shadow-2xl border-2 border-[#55AD9B]/30 px-8 py-10 max-w-3xl w-full overflow-hidden"
        >
          {/* Decorative background shapes */}
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-[#95D2B3]/30 rounded-full blur-2xl z-0"></div>
          <div className="absolute -bottom-12 -right-12 w-48 h-48 bg-[#55AD9B]/20 rounded-full blur-2xl z-0"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-32 bg-[#D8EFD3]/40 rounded-full blur-3xl z-0"></div>

          <div className="flex-shrink-0 flex flex-col items-center z-10">
            <div className="bg-gradient-to-br from-[#F1F8E8] to-[#D8EFD3] p-3 rounded-2xl shadow-lg mb-4 border-4 border-[#55AD9B]/40">
              <img
                src="/images/qr.png"
                alt="QR code to install Mindful Map on Android"
                className="w-40 h-40 rounded-xl"
              />
            </div>
            <span className="text-[#1b5f52] font-bold text-lg mt-2">Scan the QR Code</span>
          </div>
          <div className="flex-1 z-10">
            <h3 className="text-3xl md:text-3xl font-bold text-[#1b5f52] mb-3 flex items-center gap-2">
              Try it on Android
            </h3>
            <ul className="list-disc pl-5 text-[#272829] text-md leading-relaxed mb-2">
              <li>Scan the QR code above with your phone's camera.</li>
              <li>Go to the link and tap <b>Install</b> on the page.</li>
              <li>Open your <b>Downloads</b> folder and tap the APK file.</li>
              <li>Allow installation from unknown sources if prompted.</li>
              <li>Follow the prompts to finish installing Mindful Map.</li>
            </ul>
          </div>
        </motion.div>
      </section>

      {/* Call to Action */}
      <section className="w-full bg-gradient-to-r from-[#55AD9B] via-[#95D2B3] to-[#55AD9B] py-16 md:py-20 relative">
        <div className="container mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2 className="text-4xl md:text-5xl text-white font-bold mb-6">Ready to Start?</h2>
            <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-8">
              Begin your journey with tools designed to help you reflect, track, and grow—one day at a time.
            </p>
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.96 }}
              className="bg-white text-[#55AD9B] px-12 py-4 rounded-full text-xl font-bold shadow-2xl hover:shadow-3xl transition-all"
              onClick={() => navigate('/signup')}
            >
              Begin Your Journey Today
            </motion.button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;