import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

// Material UI imports
import { 
  Typography, 
  Box, 
  Container, 
  Card, 
  CircularProgress,
  Button,
  Paper,
  Chip
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TodayIcon from "@mui/icons-material/Today";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";

const DailyPrediction = () => {
  const [prediction, setPrediction] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  
  const currentDay = new Date().toLocaleString('en-us', { weekday: 'long' });
  const today = new Date();
  const formattedDate = today.toLocaleDateString('en-US', { 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });

  const formatActivities = (activities) => {
    if (!activities || activities.length === 0) return "";
    if (activities.length === 1) return ` because of ${activities[0]}`;
    return ` because of ${activities[0]} and ${activities[1]}`;
  };
  
  const getMoodGif = (mood) => {
    if (!mood || mood === "No prediction available") return "/images/fine.gif";
    
    return `/images/${mood.toLowerCase()}.gif`;
  };
  
  const getMoodColor = (mood) => {
    if (!mood || mood === "No prediction available") return '#64aa86';
    
    switch(mood.toLowerCase()) {
      case 'happy':
        return '#6fb971';
      case 'relaxed':
        return '#64aa86';
      case 'fine':
        return '#8fbc8f';
      case 'sad':
        return '#6b95ff';
      case 'angry':
        return '#ff6b6b';
      case 'anxious':
        return '#ffd166';
      default:
        return '#64aa86';
    }
  };

  useEffect(() => {
    const fetchPrediction = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error("No token found in localStorage");
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/predict-mood`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,  
          },
        });

        const data = await response.json();
        if (data.success) {
          setPrediction(data.predictions[currentDay] || { mood: "No prediction available", activities: [] });
        } else {
          console.error("Failed to fetch predictions:", data.message);
        }
      } catch (error) {
        console.error("Error fetching prediction:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrediction();
  }, [currentDay]);

  const moodColor = getMoodColor(prediction.mood);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#67b88f] via-[#93c4ab] to-[#fdffff] py-10 px-4 font-nunito">
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
      </div>
      
      <Container maxWidth="md" className="relative z-10">
        <motion.div
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/mood-entries')}
            sx={{ 
              color: '#3a3939',
              mb: 4,
              fontFamily: 'Nunito, sans-serif',
              '&:hover': {
                backgroundColor: 'rgba(0,0,0,0.05)'
              }
            }}
          >
            Back to Log Entries
          </Button>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-10"
        >
          {/* Date above header */}
          <Box 
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              backgroundColor: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(10px)',
              borderRadius: '30px',
              py: 0.5,
              px: 2,
              mb: 2
            }}
          >
            <TodayIcon sx={{ color: '#64aa86', mr: 1 }} />
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                color: '#64aa86'
              }}
            >
              {formattedDate}
            </Typography>
          </Box>
          
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          <Card 
            elevation={0}
            sx={{ 
              borderRadius: '20px', 
              overflow: 'hidden', 
              background: 'rgba(255,255,255,0.9)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.5)',
            }}
          >
            <Box sx={{ p: 4, textAlign: 'center' }}>
              {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column', py: 8 }}>
                  <CircularProgress sx={{ color: '#64aa86', mb: 2 }} />
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 600,
                      color: '#3a3939'
                    }}
                  >
                    Analyzing your patterns...
                  </Typography>
                </Box>
              ) : (
                <>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 700,
                      color: '#3a3939',
                      mb: 3
                    }}
                  >
                    {currentDay}'s Prediction
                  </Typography>
                  
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                  >
                    <Box 
                      sx={{ 
                        width: '150px', 
                        height: '150px', 
                        borderRadius: '50%',
                        backgroundColor: `${moodColor}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 24px',
                        position: 'relative',
                        overflow: 'hidden',
                        border: `3px solid ${moodColor}30`,
                        boxShadow: `0 5px 15px ${moodColor}20`
                      }}
                    >
                      <motion.div
                        animate={{ scale: [0.95, 1, 0.95] }}
                        transition={{ 
                          duration: 4, 
                          repeat: Infinity,
                          repeatType: "reverse" 
                        }}
                        style={{ width: '100%', height: '100%' }}
                      >
                        <img 
                          src={getMoodGif(prediction.mood)}
                          alt={prediction.mood || "Mood"} 
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover'
                          }}
                        />
                      </motion.div>
                    </Box>
                  </motion.div>
                  
                  <Typography 
                    variant="h4" 
                    sx={{ 
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 800,
                      color: moodColor,
                      mb: 1
                    }}
                  >
                    {prediction.mood === "No prediction available" ? "No Prediction" : prediction.mood}
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: 'Nunito, sans-serif',
                      fontSize: '1.1rem',
                      color: '#3a3939',
                      mb: 4,
                      maxWidth: '80%',
                      margin: '0 auto'
                    }}
                  >
                    {prediction.mood === "No prediction available" 
                      ? `We don't have enough data to make a prediction for ${currentDay} yet. Continue logging your moods daily for more accurate predictions!`
                      : `You may feel ${prediction.mood.toLowerCase()} today${formatActivities(prediction.activities)}.`}
                  </Typography>
                  
                  {prediction.activities && prediction.activities.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                    >
                      <Paper
                        elevation={0}
                        sx={{ 
                          backgroundColor: `${moodColor}10`,
                          p: 2,
                          borderRadius: '12px',
                          display: 'inline-block',
                          mt: 2
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <LocalActivityIcon sx={{ color: moodColor, mr: 1 }} />
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              fontFamily: 'Nunito, sans-serif',
                              fontWeight: 600,
                              color: moodColor
                            }}
                          >
                            Key Activities:
                          </Typography>
                        </Box>
                        
                        <Box sx={{ mt: 1 }}>
                          {prediction.activities.map((activity, index) => (
                            <Chip 
                              key={index}
                              label={activity}
                              sx={{ 
                                m: 0.5, 
                                backgroundColor: `${moodColor}20`,
                                color: moodColor,
                                fontFamily: 'Nunito, sans-serif',
                                fontWeight: 500
                              }} 
                            />
                          ))}
                        </Box>
                      </Paper>
                    </motion.div>
                  )}
                </>
              )}
            </Box>
          </Card>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.8 }}
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
              "Remember, predictions are based on your historical patterns. Your actions today can influence how you feel."
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    </div>
  );
};

export default DailyPrediction;