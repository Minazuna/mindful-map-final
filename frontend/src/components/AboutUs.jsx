import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

import BarChartIcon from '@mui/icons-material/BarChart';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';

import Fab from '@mui/material/Fab';
import Zoom from '@mui/material/Zoom';

const AboutUs = () => {
  const navigate = useNavigate();

  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [fadeInFeatures, setFadeInFeatures] = useState(false);
  const [fadeInPartnership, setFadeInPartnership] = useState(false);

  const featuresRef = useRef(null);
  const partnershipRef = useRef(null);

  useEffect(() => {
    const onScroll = () => {
      setShowScrollTop(window.scrollY > 300);

      const featuresEl = featuresRef.current;
      const partnershipEl = partnershipRef.current;

      if (featuresEl) {
        const r = featuresEl.getBoundingClientRect();
        if (r.top <= window.innerHeight * 0.82) setFadeInFeatures(true);
      }

      if (partnershipEl) {
        const r = partnershipEl.getBoundingClientRect();
        if (r.top <= window.innerHeight * 0.82) setFadeInPartnership(true);
      }
    };

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const scrollToFeatures = () => {
    featuresRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const scrollToPartnership = () => {
    partnershipRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setMobileMenuOpen(false);
  };

  const features = [
    {
      icon: <BarChartIcon sx={{ fontSize: 46, color: '#55AD9B' }} />,
      title: 'Mood Tracking',
      description:
        'Log daily moods with detailed emotions and intensity. Spot patterns over time and understand what affects you.',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 46, color: '#55AD9B' }} />,
      title: 'Activity Insights',
      description:
        'Connect emotions with activities. Learn what helps, what drains you, and what routines support your well-being.',
    },
    {
      icon: <BarChartIcon sx={{ fontSize: 46, color: '#55AD9B' }} />,
      title: 'Personalized Analytics',
      description:
        'Turn your entries into meaningful visuals and insights to support reflection and healthier emotional habits.',
    },
    {
      icon: <NotificationsIcon sx={{ fontSize: 46, color: '#55AD9B' }} />,
      title: 'Smart Reminders',
      description:
        'Gentle nudges to stay consistent. Build an easy, sustainable tracking habit without pressure.',
    },
  ];

  const values = [
    {
      title: 'Privacy-first',
      description: 'Your entries are personal. We design features to respect your data and your boundaries.',
    },
    {
      title: 'Supportive by design',
      description: 'Calm UI, gentle wording, and thoughtful prompts—made to feel safe and encouraging.',
    },
    {
      title: 'Clarity over complexity',
      description: 'Insights should be understandable and actionable, not overwhelming.',
    },
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
            '&:hover': { backgroundColor: '#1F8E8E' },
            zIndex: 40,
          }}
        >
          <ArrowUpwardIcon />
        </Fab>
      </Zoom>

      {/* Navigation Bar (matched to LandingPage) */}
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
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300" />
              </Link>
              <Link to="/about" className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group">
                About
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300" />
              </Link>
              <Link
                to="/mental-health-resources"
                className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group"
              >
                Resources
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300" />
              </Link>
              {/* <Link to="/" className="text-[#F1F8E8] text-lg font-semibold hover:text-white transition-all duration-300 relative group">
                Contact
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#F1F8E8] group-hover:w-full transition-all duration-300" />
              </Link> */}
            </div>
          </div>

          {/* Get Started Button */}
          <div className="hidden md:block">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link
                to="/signup"
                className="bg-[#F1F8E8] text-[#55AD9B] text-lg px-8 py-3 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 font-semibold hover:bg-white"
              >
                Get Started
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

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={scrollToFeatures}
                    className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors text-left"
                  >
                    Features
                  </button>
                  <button
                    type="button"
                    onClick={scrollToPartnership}
                    className="text-[#F1F8E8] font-semibold py-3 px-4 hover:bg-white/20 rounded-lg transition-colors text-left"
                  >
                    Partnership
                  </button>
                </div>

                <Link to="/signup" className="bg-[#F1F8E8] text-[#55AD9B] px-6 py-3 rounded-full text-center shadow-lg hover:bg-white">
                  Get Started
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero */}
      <section className="w-full">
        <div className="container mx-auto px-6 mt-32 md:mt-40 mb-16 relative">
          {/* background blobs */}
          <motion.div
            animate={{ scale: [1, 1.15, 1], rotate: [0, 10, -10, 0] }}
            transition={{ duration: 12, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute -left-28 top-6 w-96 h-96 bg-[#55AD9B] rounded-full opacity-10 blur-3xl -z-10"
          />
          <motion.div
            animate={{ scale: [1.1, 1, 1.1], rotate: [360, 180, 0] }}
            transition={{ duration: 15, repeat: Infinity, repeatType: 'reverse' }}
            className="absolute -right-28 bottom-0 w-96 h-96 bg-[#95D2B3] rounded-full opacity-10 blur-3xl -z-10"
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="text-center lg:text-left lg:pl-10"
            >
              <h1 className="text-5xl md:text-6xl font-bold text-gray-800 leading-tight">
                About
                <span className="block bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] bg-clip-text text-transparent">
                  Mindful Map
                </span>
              </h1>

              <p className="mt-6 text-lg md:text-xl text-gray-600 leading-relaxed max-w-2xl mx-auto lg:mx-0">
                Mindful Map is built to help you understand your emotions through gentle tracking, reflective journaling,
                and clear insights—so you can build healthier habits one day at a time.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <motion.button
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.97 }}
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
              </div>

              <div className="mt-10 hidden lg:block">
                <motion.button
                  onClick={scrollToFeatures}
                  className="flex items-center text-[#55AD9B] hover:text-[#1F8E8E] transition-all group"
                  whileHover={{ y: 5 }}
                >
                  <span className="mr-2 font-semibold">Learn more</span>
                  <KeyboardArrowDownIcon className="animate-bounce group-hover:animate-pulse" />
                </motion.button>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="flex justify-center lg:justify-end lg:pr-10"
            >
              <motion.div
                animate={{ y: [-12, 12, -12] }}
                transition={{ duration: 6, repeat: Infinity, repeatType: 'reverse' }}
                className="w-full"
              >
                <img
                  src="/images/about.png"
                  alt="About Mindful Map"
                  className="w-full h-auto max-w-xl drop-shadow-2xl"
                />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values / Mission */}
      <section className="w-full">
        <div className="container mx-auto px-6 pb-10">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="bg-white/70 backdrop-blur-sm border border-[#95D2B3]/30 rounded-3xl shadow-lg p-8 md:p-10"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
              <div className="md:max-w-xl">
                <h2 className="text-3xl md:text-4xl font-bold text-gray-800">
                  Our Mission
                </h2>
                <p className="mt-4 text-gray-600 text-lg leading-relaxed">
                  To make emotional reflection simple, supportive, and consistent—through tools that help people notice patterns,
                  name feelings, and take small steps toward better well-being.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                {values.map((v) => (
                  <div
                    key={v.title}
                    className="rounded-2xl border border-[#D8EFD3] bg-white/80 p-5 shadow-sm hover:shadow-md transition"
                  >
                    <div className="font-bold text-[#1F8E8E] text-lg">{v.title}</div>
                    <div className="text-gray-600 mt-2 text-sm leading-relaxed">{v.description}</div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section
        ref={featuresRef}
        id="features-section"
        className={`w-full bg-white/60 backdrop-blur-sm py-20 md:py-24 transition-opacity duration-1000 border-y border-[#95D2B3]/20 ${
          fadeInFeatures ? 'opacity-100' : 'opacity-0'
        }`}
      >
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={fadeInFeatures ? { opacity: 1, y: 0 } : {}}
            className="text-center mb-14 md:mb-20"
          >
            <h2 className="text-4xl md:text-6xl font-bold text-gray-800 mb-5">
              How Mindful Map
              <span className="block bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] bg-clip-text text-transparent">
                Works for You
              </span>
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-[#55AD9B] to-[#95D2B3] rounded-full mx-auto mb-6" />
            <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto">
              A calm, guided experience that turns daily check-ins into clarity you can use.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-7">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-lg hover:shadow-2xl transition-all border border-[#95D2B3]/20 group hover:bg-gradient-to-br hover:from-[#55AD9B] hover:to-[#95D2B3]"
                initial={{ opacity: 0, y: 18 }}
                animate={fadeInFeatures ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.08 * index }}
                whileHover={{ y: -10, scale: 1.02 }}
              >
                <div className="mb-6 flex justify-center bg-gradient-to-br from-[#F1F8E8] to-[#D8EFD3] group-hover:bg-white/90 rounded-2xl p-6 w-20 h-20 mx-auto transform transition-all group-hover:scale-110">
                  {feature.icon}
                </div>
                <h3 className="text-xl md:text-2xl font-bold text-[#1F8E8E] group-hover:text-white mb-3 text-center">
                  {feature.title}
                </h3>
                <p className="text-gray-600 group-hover:text-white/90 text-center leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Partnership */}
      <section
        ref={partnershipRef}
        id="partnership-section"
        className={`w-full bg-gradient-to-r from-[#55AD9B] via-[#95D2B3] to-[#55AD9B] py-20 md:py-24 transition-opacity duration-1000 ${
          fadeInPartnership ? 'opacity-100' : 'opacity-0'
        } relative overflow-hidden`}
      >
        {/* Background Decorations */}
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.3, 1, 1.3], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute bottom-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl"
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center"
            initial={{ opacity: 0, y: 18 }}
            animate={fadeInPartnership ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8 }}
          >
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Built in
                <span className="block">Partnership With</span>
              </h2>
              <p className="text-lg md:text-xl text-white/95 leading-relaxed mb-6">
                Mindful Map is developed as a collaborative initiative with{' '}
                <span className="font-bold text-white">Sto. Niño Catholic School Inc.</span>, supporting student mental
                wellness and emotional intelligence through thoughtful, real-world tools.
              </p>
              <p className="text-base md:text-lg text-white/85 font-semibold">
                This partnership reflects our commitment to meaningful impact in educational communities.
              </p>
            </div>

            <motion.div
              className="flex justify-center md:justify-end"
              whileHover={{ scale: 1.05, rotate: 1 }}
              initial={{ opacity: 0, scale: 0.92 }}
              animate={fadeInPartnership ? { opacity: 1, scale: 1 } : {}}
              transition={{ duration: 0.7, delay: 0.12 }}
            >
              <div className="bg-white rounded-3xl p-8 md:p-10 shadow-3xl border-4 border-white/80 backdrop-blur-sm">
                <img
                  src="/images/sncs.png"
                  alt="Sto. Niño Catholic School Inc."
                  className="w-full h-auto max-w-xs mx-auto"
                />
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="w-full bg-gradient-to-r from-[#55AD9B] via-[#95D2B3] to-[#55AD9B] py-16 md:py-20 relative">
        <div className="container mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
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