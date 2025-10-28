import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BottomNav from '../../BottomNav';
import { motion } from 'framer-motion';

import { 
  Typography, 
  Box, 
  Container,
  Card,
  CardContent,
  Button,
  Divider,
  Paper,
  Grid,
  Chip
} from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import GroupIcon from '@mui/icons-material/Group';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BedtimeIcon from '@mui/icons-material/Bedtime';

const MainPredictions = () => {
  const [value, setValue] = useState('prediction');
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);
  const [hasMoodLogs, setHasMoodLogs] = useState(true);
  const [categoryAvailability, setCategoryAvailability] = useState({});
  const [loadingAvailability, setLoadingAvailability] = useState(true);

  useEffect(() => {
    setFadeIn(true);
    checkMoodLogs();
    checkCategoryAvailability();
  }, []);

  const checkMoodLogs = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setHasMoodLogs(false);
        return;
      }
  
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/check-mood-logs`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });
  
      const data = await response.json();
      
      setHasMoodLogs(data.allowAccess);
  
      if (!data.allowAccess) { 
        toast.error("You haven't logged moods for the last two full weeks. Please log some moods before proceeding.", {
          position: "top-center",
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
      }
  
    } catch (error) {
      console.error("Error checking mood logs:", error);
      setHasMoodLogs(false);
    }
  };

  const checkCategoryAvailability = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setLoadingAvailability(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/check-category-data`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setCategoryAvailability(data.availability);
      }
      setLoadingAvailability(false);

    } catch (error) {
      console.error("Error checking category data availability:", error);
      setLoadingAvailability(false);
    }
  };

  const handleCategoryPrediction = (category) => {
    const availability = categoryAvailability[category];
    if (availability && availability.available) {
      navigate(`/category-prediction/${category}`);
    } else {
      toast.error(`Insufficient data for ${category} category. Need at least 2 weeks of data.`, {
        position: "top-center",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'activity': return <DirectionsRunIcon />;
      case 'social': return <GroupIcon />;
      case 'health': return <FavoriteIcon />;
      case 'sleep': return <BedtimeIcon />;
      default: return null;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'activity': return '#FF6B6B';
      case 'social': return '#4ECDC4';
      case 'health': return '#45B7D1';
      case 'sleep': return '#96CEB4';
      default: return '#6fba94';
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#67b88f] via-[#93c4ab] to-[#fdffff] pb-24 font-nunito">
      <ToastContainer />
      
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
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
      </div>
      
      <Container maxWidth="lg" className="relative z-1 mt-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          <Box 
            sx={{
              position: 'relative',
              display: 'inline-block',
              mb: 2
            }}
          >
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 800, 
                color: '#3a3939',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -8,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80px',
                  height: '4px',
                  borderRadius: '2px',
                  backgroundColor: '#64aa86'
                }
              }}
            >
              Mood-Activity Predictions
            </Typography>
          </Box>
        </motion.div>

        <Card 
          elevation={0}
          sx={{ 
            borderRadius: '24px', 
            overflow: 'hidden', 
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(255,255,255,0.5)',
          }}
        >
          <Box className="flex flex-col md:flex-row items-stretch">
            <motion.div 
              className={`transition-all duration-1000 ${fadeIn ? 'opacity-100' : 'opacity-0'} md:w-1/2 relative overflow-hidden`}
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.8 }}
            >
              <Box className="relative h-full">
                <img 
                  src="/images/predictive.gif" 
                  alt="Predictive" 
                  className="w-full h-full object-cover md:h-full" 
                  style={{ minHeight: '300px' }}
                />
                <Box 
                  sx={{ 
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    width: '100%',
                    background: 'linear-gradient(to top, rgba(0,0,0,0.7), rgba(0,0,0,0))',
                    p: 3,
                    textAlign: 'left'
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: 'white', 
                      fontWeight: 700,
                      fontFamily: 'Nunito, sans-serif'
                    }}
                  >
                    Powered by Your Data
                  </Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: 'rgba(255,255,255,0.8)',
                      fontFamily: 'Nunito, sans-serif'
                    }}
                  >
                    More logs mean more accurate predictions
                  </Typography>
                </Box>
              </Box>
            </motion.div>
            
            <motion.div 
              className="md:w-1/2 p-8 md:p-10 flex flex-col justify-between"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
            >
              <Box>
                <Typography 
                  variant="h4" 
                  sx={{ 
                    fontWeight: 800, 
                    color: '#3a3939', 
                    mb: 2,
                    fontFamily: 'Nunito, sans-serif'
                  }}
                >
                  See Into Your Week
                </Typography>
                
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <TimelineIcon sx={{ color: '#64aa86', mr: 2 }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontWeight: 600, 
                      color: '#3a3939',
                      fontFamily: 'Nunito, sans-serif'
                    }}
                  >
                    How does this work?
                  </Typography>
                </Box>
                
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: '#555', 
                    mb: 4,
                    lineHeight: 1.8,
                    fontFamily: 'Nunito, sans-serif',
                    textAlign: 'justify'
                  }}
                >
                  The system analyzes your mood logs and related activities across different categories (Activity, Social, Health, Sleep), creating predictions based on patterns in your data. This helps you understand your emotional trends, allowing you to anticipate future moods and identify activities that influence them.
                </Typography>
              </Box>
              
              <Box sx={{ mt: 2 }}>
                <Paper 
                  elevation={0}
                  sx={{
                    backgroundColor: '#fffbe6',
                    border: '1px solid #ffe58f',
                    borderRadius: 3,
                    p: 2,
                    mb: 2,
                    textAlign: 'center'
                  }}
                >
                  <Typography 
                    variant="body2"
                    sx={{
                      color: '#b8860b',
                      fontWeight: 600,
                      fontFamily: 'Nunito, sans-serif'
                    }}
                  >
                    <strong>Disclaimer:</strong> Predictions are not 100% accurate. They are generated by analyzing your past mood logs and activity patterns, and are meant to provide guidance only. Weekly predictions are based solely on your own data and may not reflect all real-life factors.
                  </Typography>
                </Paper>
                <Box sx={{ textAlign: 'center', mt: 2 }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: hasMoodLogs ? 'green' : 'orange',
                      fontStyle: 'italic',
                      fontFamily: 'Nunito, sans-serif'
                    }}
                  >
                    {hasMoodLogs 
                      ? "Your data is ready for category-based weekly predictions!" 
                      : "Please log moods for at least two weeks to enable predictions."}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Box>
        </Card>

        {/* Category Predictions Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
        >
          <Card 
            elevation={0}
            sx={{ 
              mt: 4,
              borderRadius: '24px', 
              overflow: 'hidden', 
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.9)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.5)',
            }}
          >
            <Box sx={{ p: 4 }}>
              <Typography 
                variant="h5" 
                sx={{ 
                  fontWeight: 700, 
                  mb: 3,
                  color: '#3a3939',
                  fontFamily: 'Nunito, sans-serif',
                  textAlign: 'center'
                }}
              >
                Category-Based Weekly Predictions
              </Typography>

              <Typography 
                variant="body2" 
                sx={{ 
                  color: '#666',
                  fontFamily: 'Nunito, sans-serif',
                  textAlign: 'center',
                  mb: 4
                }}
              >
                Get detailed predictions for different aspects of your life this week
              </Typography>

              <Grid container spacing={3}>
                {['activity', 'social', 'health', 'sleep'].map((category) => {
                  const availability = categoryAvailability[category];
                  const isAvailable = availability && availability.available;
                  
                  return (
                    <Grid item xs={12} sm={6} md={3} key={category}>
                      <motion.div
                        whileHover={isAvailable ? { scale: 1.02 } : {}}
                        whileTap={isAvailable ? { scale: 0.98 } : {}}
                      >
                        <Button
                          fullWidth
                          disabled={!isAvailable || loadingAvailability}
                          onClick={() => handleCategoryPrediction(category)}
                          sx={{
                            p: 3,
                            borderRadius: 4,
                            textTransform: 'none',
                            fontSize: '1rem',
                            fontFamily: 'Nunito, sans-serif',
                            fontWeight: 600,
                            backgroundColor: isAvailable ? getCategoryColor(category) : '#e0e0e0',
                            color: isAvailable ? 'white' : '#999',
                            border: `2px solid ${isAvailable ? getCategoryColor(category) : '#e0e0e0'}`,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 1.5,
                            minHeight: '120px',
                            '&:hover': {
                              backgroundColor: isAvailable ? getCategoryColor(category) : '#e0e0e0',
                              opacity: isAvailable ? 0.9 : 1,
                            },
                            '&:disabled': {
                              color: '#999'
                            }
                          }}
                        >
                          <Box sx={{ color: isAvailable ? 'white' : '#999' }}>
                            {getCategoryIcon(category)}
                          </Box>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 700,
                              fontFamily: 'Nunito, sans-serif',
                              color: 'inherit'
                            }}
                          >
                            {category.charAt(0).toUpperCase() + category.slice(1)}
                          </Typography>
                          <Chip
                            label={isAvailable ? "Available" : "Need More Data"}
                            size="small"
                            sx={{
                              backgroundColor: isAvailable ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                              color: isAvailable ? 'white' : '#666',
                              fontFamily: 'Nunito, sans-serif',
                              fontSize: '0.75rem'
                            }}
                          />
                        </Button>
                      </motion.div>
                    </Grid>
                  );
                })}
              </Grid>
            </Box>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <Paper 
            elevation={0}
            sx={{ 
              mt: 4, 
              p: 3, 
              borderRadius: 4,
              backgroundColor: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.3)',
            }}
          >
            <Typography 
              variant="body2" 
              sx={{ 
                fontStyle: 'italic',
                textAlign: 'center',
                color: '#666',
                fontFamily: 'Nunito, sans-serif'
              }}
            >
              "Understanding your patterns is the first step toward improving your emotional well-being."
            </Typography>
          </Paper>
        </motion.div>
      </Container>
      
      <BottomNav value={value} setValue={setValue} />
    </div>
  );
};

export default MainPredictions;