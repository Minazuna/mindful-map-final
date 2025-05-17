// Frontend: MainPredictions.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BottomNav from '../BottomNav';
import { motion } from 'framer-motion';

// Material UI imports
import { 
  Typography, 
  Box, 
  Container,
  Card,
  CardContent,
  Button,
  Divider,
  Paper
} from '@mui/material';
import TodayIcon from '@mui/icons-material/Today';
import DateRangeIcon from '@mui/icons-material/DateRange';
import TimelineIcon from '@mui/icons-material/Timeline';

const MainPredictions = () => {
  const [value, setValue] = useState('prediction');
  const navigate = useNavigate();
  const [fadeIn, setFadeIn] = useState(false);
  const [hasMoodLogs, setHasMoodLogs] = useState(true);

  useEffect(() => {
    setFadeIn(true);
    checkMoodLogs();
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

  const handlePredictionNavigation = (path) => {
    if (hasMoodLogs) {
      navigate(path);
    } else {
      toast.error("Need at least two weeks of mood data for predictions. Please come back again later.", {
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

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#67b88f] via-[#93c4ab] to-[#fdffff] pb-20 font-nunito">
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
      
      <Container maxWidth="lg" className="relative z-10 mt-16">
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
                  See Into Your Future
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
                  The system analyzes your mood logs and related activities, creating predictions based on patterns in your data. This helps you understand your emotional trends, allowing you to anticipate future moods and identify activities that influence them.
                </Typography>
              </Box>
              
              <Box sx={{ mt: 4 }}>
                <Typography 
                  variant="subtitle1" 
                  sx={{ 
                    fontWeight: 700, 
                    mb: 3,
                    color: '#3a3939',
                    fontFamily: 'Nunito, sans-serif'
                  }}
                >
                  Choose your prediction timeframe:
                </Typography>
                
                <Box className="flex flex-col sm:flex-row gap-4">
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<TodayIcon />}
                      onClick={() => handlePredictionNavigation("/daily-prediction")}
                      sx={{
                        backgroundColor: '#6fba94',
                        color: 'white',
                        fontWeight: 'bold',
                        py: 1.5,
                        borderRadius: 50,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontFamily: 'Nunito, sans-serif',
                        boxShadow: '0 4px 10px rgba(111, 186, 148, 0.3)',
                        '&:hover': {
                          backgroundColor: '#5da87a',
                        }
                      }}
                    >
                      Daily Prediction
                    </Button>
                  </motion.div>
                  
                  <motion.div 
                    whileHover={{ scale: 1.05 }} 
                    whileTap={{ scale: 0.95 }}
                    className="flex-1"
                  >
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<DateRangeIcon />}
                      onClick={() => handlePredictionNavigation("/weekly-predictions")}
                      sx={{
                        backgroundColor: '#6fba94',
                        color: 'white',
                        fontWeight: 'bold',
                        py: 1.5,
                        borderRadius: 50,
                        textTransform: 'none',
                        fontSize: '1rem',
                        fontFamily: 'Nunito, sans-serif',
                        boxShadow: '0 4px 10px rgba(111, 186, 148, 0.3)',
                        '&:hover': {
                          backgroundColor: '#5da87a',
                        }
                      }}
                    >
                      Weekly Prediction
                    </Button>
                  </motion.div>
                </Box>
                
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: hasMoodLogs ? 'green' : 'orange',
                      fontStyle: 'italic',
                      fontFamily: 'Nunito, sans-serif'
                    }}
                  >
                    {hasMoodLogs 
                      ? "Your data is ready for predictions!" 
                      : "Please log moods for at least two weeks to enable predictions"}
                  </Typography>
                </Box>
              </Box>
            </motion.div>
          </Box>
        </Card>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
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
              "Understanding your patterns is the first step toward improving your emotional well-being"
            </Typography>
          </Paper>
        </motion.div>
      </Container>
      
      <BottomNav value={value} setValue={setValue} />
    </div>
  );
};

export default MainPredictions;