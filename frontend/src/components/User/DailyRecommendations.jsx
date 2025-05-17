import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';

// Material UI imports
import { 
  Card, 
  Typography, 
  Box,
  Container,
  IconButton,
  Paper
} from '@mui/material';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

const DailyRecommendations = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const mood = location.state?.mood;

  const validMoods = ['angry', 'anxious', 'sad'];
  
  useEffect(() => {
    // If no mood is provided or it's not in our valid list, redirect to home
    if (!mood || !validMoods.includes(mood)) {
      navigate('/dashboard');
    }
  }, [mood, navigate]);

  const handleNext = () => {
    navigate('/mood-entries');
  };

  const buttonVariants = {
    initial: { 
      opacity: 0, 
      y: 20 
    },
    animate: (custom) => ({ 
      opacity: 1, 
      y: 0,
      transition: {
        delay: custom * 0.2,
        duration: 0.5,
        ease: "easeOut"
      }
    }),
    hover: { 
      scale: 1.03,
      boxShadow: "0px 8px 20px rgba(100, 170, 134, 0.4)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    },
    tap: { 
      scale: 0.97
    }
  };

  const getMoodColor = () => {
    switch(mood) {
      case 'angry': return '#ff6b6b';
      case 'anxious': return '#ffd166';
      case 'sad': return '#6b95ff';
      default: return '#64aa86';
    }
  };

  const buttonData = [
    {
      id: 1,
      title: "Meditation",
      description: "Find peace with guided meditation sessions",
      image: "/images/meditation.gif",
      path: "/meditation",
      color: "#9c89f2"
    },
    {
      id: 2,
      title: "Breathing Exercise",
      description: "Relax with deep breathing techniques",
      image: "/images/breathingexercise.gif",
      path: "/breathing-exercise",
      color: "#64aa86"
    },
    {
      id: 3,
      title: "Calming Music",
      description: "Soothe your mind with relaxing melodies",
      image: "/images/relaxingmusic.gif",
      path: "/calming-music",
      color: "#64b5db"
    }
  ];

  const moodColor = getMoodColor();

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#67b88f] via-[#93c4ab] to-[#fdffff] py-12 px-4 font-nunito"
    >
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <motion.div 
          className="absolute w-64 h-64 rounded-full bg-white opacity-20"
          initial={{ x: -100, y: -50 }}
          animate={{ x: -80, y: -30 }}
          transition={{ 
            duration: 8,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut"
          }}
          style={{ top: '10%', left: '5%' }}
        />
        <motion.div 
          className="absolute w-48 h-48 rounded-full bg-white opacity-15"
          initial={{ x: 100, y: 50 }}
          animate={{ x: 80, y: 30 }}
          transition={{ 
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 0.5
          }}
          style={{ top: '50%', right: '5%' }}
        />
        <motion.div 
          className="absolute w-32 h-32 rounded-full bg-white opacity-10"
          initial={{ x: -50, y: 30 }}
          animate={{ x: -30, y: 50 }}
          transition={{ 
            duration: 6,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
            delay: 1
          }}
          style={{ bottom: '15%', left: '15%' }}
        />
      </div>

      <Container maxWidth="sm" className="relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="relative text-center mb-12"
        >
          <Box 
            sx={{
              position: 'relative',
              mb: 2,
              '&::before': {
                content: '""',
                position: 'absolute',
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                background: `${moodColor}20`,
                top: '-30px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: -1
              }
            }}
          >
            <Paper
              elevation={0}
              sx={{
                bgcolor: 'transparent',
                mb: 1,
                border: `2px solid ${moodColor}`,
                borderRadius: '30px',
                py: 1,
                px: 4,
                display: 'inline-block'
              }}
            >
              <Typography 
                variant="body1" 
                sx={{ 
                  fontFamily: 'Nunito, sans-serif',
                  fontWeight: 600,
                  color: moodColor
                }}
              >
                Feeling {mood && mood.toLowerCase()}
              </Typography>
            </Paper>
          </Box>

          <Typography 
            variant="h3" 
            component="h1" 
            sx={{ 
              fontFamily: 'Nunito, sans-serif',
              fontWeight: 800, 
              color: '#3a3939', 
              mb: 1,
            }}
          >
            Recommendations
          </Typography>
          <Typography 
            variant="h6" 
            sx={{ 
              fontFamily: 'Nunito, sans-serif',
              color: '#3a3939', 
              opacity: 0.9,
              maxWidth: '80%',
              margin: '0 auto'
            }}
          >
            Try these activities to help improve your mood
          </Typography>
          
          <motion.div 
            className="absolute -bottom-6 left-1/2 transform -translate-x-1/2"
            animate={{ y: [0, -5, 0] }}
            transition={{ 
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <Box sx={{ 
              width: '40px', 
              height: '4px', 
              borderRadius: '2px',
              background: moodColor,
              opacity: 0.7
            }} />
          </motion.div>
        </motion.div>

        <Box sx={{ mb: 6 }}>
          {buttonData.map((button, index) => (
            <motion.div
              key={button.id}
              variants={buttonVariants}
              initial="initial"
              animate="animate"
              whileHover="hover"
              whileTap="tap"
              custom={index}
              onClick={() => navigate(button.path)}
              style={{ marginBottom: '20px' }}
            >
              <Card
                sx={{
                  borderRadius: '16px',
                  cursor: 'pointer',
                  position: 'relative',
                  overflow: 'hidden',
                  background: 'rgba(255,255,255,0.9)',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255,255,255,0.5)',
                  transition: 'all 0.3s ease',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '4px',
                    height: '100%',
                    backgroundColor: button.color,
                  }
                }}
              >
                <Box sx={{ display: 'flex', flexDirection: {xs: 'column', sm: 'row'}, alignItems: 'center' }}>
                  <Box 
                    sx={{ 
                      width: {xs: '100%', sm: '110px'},
                      height: {xs: '120px', sm: '120px'},
                      overflow: 'hidden',
                      borderRight: {xs: 'none', sm: `1px solid ${button.color}30`},
                      borderBottom: {xs: `1px solid ${button.color}30`, sm: 'none'},
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      p: 2
                    }}
                  >
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: 0, 
                        left: 0, 
                        width: '100%', 
                        height: '100%',
                        background: `${button.color}10`,
                        zIndex: 0 
                      }} 
                    />
                    <img 
                      src={button.image} 
                      alt={button.title} 
                      style={{ 
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        borderRadius: '8px',
                        position: 'relative',
                        zIndex: 1
                      }} 
                    />
                  </Box>

                  <Box sx={{ 
                    flexGrow: 1, 
                    p: 3, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center'
                  }}>
                    <Box>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          fontFamily: 'Nunito, sans-serif',
                          fontWeight: 700, 
                          color: '#3a3939',
                          mb: 0.5
                        }}
                      >
                        {button.title}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontFamily: 'Nunito, sans-serif',
                          color: '#666'
                        }}
                      >
                        {button.description}
                      </Typography>
                    </Box>
                    <IconButton 
                      sx={{ 
                        backgroundColor: `${button.color}20`,
                        color: button.color,
                        '&:hover': {
                          backgroundColor: button.color,
                          color: 'white'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <ArrowForwardIosIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Card>
            </motion.div>
          ))}
        </Box>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="flex justify-center sm:justify-end"
        >
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: '#5aa88f' }}
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="bg-[#6fba94] text-white font-bold py-3 px-8 rounded-full shadow-md hover:bg-[#5aa88f] transition-colors duration-300 font-nunito"
          >
            Continue to Log
          </motion.button>
        </motion.div>
      </Container>
    </motion.div>
  );
};

export default DailyRecommendations;