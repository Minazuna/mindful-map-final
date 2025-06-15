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
  Divider
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TodayIcon from "@mui/icons-material/Today";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import LocalActivityIcon from "@mui/icons-material/LocalActivity";

const WeeklyPredictions = () => {
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const dayOrder = [
    'Monday',
    'Tuesday', 
    'Wednesday', 
    'Thursday', 
    'Friday', 
    'Saturday', 
    'Sunday'
  ];

  const currentDay = new Date().toLocaleString('en-us', { weekday: 'long' });
  
  // Get first and last day of current week
  const getWeekDateRange = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay(); // 0 is Sunday, 1 is Monday...
    
    // Calculate the Monday (first day of week)
    const firstDay = new Date(today);
    const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1; // Adjust to make Monday first day
    firstDay.setDate(today.getDate() - daysFromMonday);
    
    // Calculate the Sunday (last day of week)
    const lastDay = new Date(firstDay);
    lastDay.setDate(firstDay.getDate() + 6);
    
    // Format dates
    const formatOptions = { month: 'long', day: 'numeric' };
    const firstDayFormatted = firstDay.toLocaleDateString('en-US', formatOptions);
    
    // Add year only to the last day to avoid redundancy
    const lastDayFormatted = lastDay.toLocaleDateString('en-US', {
      ...formatOptions,
      year: 'numeric'
    });
    
    return `${firstDayFormatted} - ${lastDayFormatted}`;
  };
  
  const weekDateRange = getWeekDateRange();

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
    const fetchPredictions = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error("No token found in localStorage");
          return;
        }

        const response = await fetch(`${import.meta.env.VITE_PYTHON_API}/api/predict-mood`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,  
          },
        });

        const text = await response.text(); // get raw body first
        let data;
        try {
          data = JSON.parse(text);
        } catch (parseErr) {
          console.error("Failed to parse JSON:", text);
          throw new Error("Invalid JSON response from server");
        }

        if (response.ok && data.success) {
          setPredictions(data.predictions);
        } else {
          console.error("Failed to fetch predictions:", data.message || "Unknown error");
        }
      } catch (error) {
        console.error("Error fetching predictions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPredictions();
  }, []);

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
          {/* Updated date range display */}
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
            <CalendarMonthIcon sx={{ color: '#64aa86', mr: 1 }} />
            <Typography 
              variant="body1" 
              sx={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                color: '#64aa86'
              }}
            >
              {weekDateRange}
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
            <Box sx={{ p: 4 }}>
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
                    Analyzing your weekly patterns...
                  </Typography>
                </Box>
              ) : Object.keys(predictions).length > 0 ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 4 }}>
                    <CalendarMonthIcon sx={{ color: '#64aa86', mr: 1 }} />
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontFamily: 'Nunito, sans-serif',
                        fontWeight: 700,
                        color: '#3a3939'
                      }}
                    >
                      Your Week Ahead
                    </Typography>
                  </Box>
                  
                  {dayOrder.map((day, index) => {
                    const prediction = predictions[day] || { mood: "No prediction available", activities: [], probability: null };
                    const isCurrentDay = day === currentDay;
                    const moodColor = getMoodColor(prediction.mood);
                    
                    return (
                      <motion.div
                        key={day}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index, duration: 0.5 }}
                      >
                        <Paper
                          elevation={0}
                          sx={{ 
                            p: 3, 
                            mb: 2, 
                            borderRadius: '16px',
                            border: isCurrentDay ? `2px solid ${moodColor}` : '1px solid rgba(0,0,0,0.05)',
                            backgroundColor: isCurrentDay ? `${moodColor}08` : 'rgba(255,255,255,0.7)',
                            position: 'relative',
                            overflow: 'hidden'
                          }}
                        >
                          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: {xs: 'column', sm: 'row'} }}>
                            <Box 
                              sx={{ 
                                mr: {xs: 0, sm: 3}, 
                                mb: {xs: 2, sm: 0},
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                              }}
                            >
                              <Box 
                                sx={{ 
                                  width: '70px',
                                  height: '70px',
                                  borderRadius: '50%',
                                  overflow: 'hidden',
                                  border: `2px solid ${moodColor}50`,
                                  mb: 1
                                }}
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
                              </Box>
                              <Typography 
                                variant="h6" 
                                sx={{ 
                                  fontFamily: 'Nunito, sans-serif',
                                  fontWeight: 700,
                                  color: moodColor
                                }}
                              >
                                {day}
                              </Typography>
                            </Box>
                            
                            <Box sx={{ flexGrow: 1 }}>
                              <Typography 
                                variant="body1" 
                                sx={{ 
                                  fontFamily: 'Nunito, sans-serif',
                                  fontSize: '1rem',
                                  fontWeight: isCurrentDay ? 600 : 400,
                                  color: '#3a3939',
                                  textAlign: {xs: 'center', sm: 'left'}
                                }}
                              >
                                {prediction.mood === "No prediction available" 
                                  ? `No prediction available for ${day}`
                                  : `You may feel ${prediction.mood.toLowerCase()}${formatActivities(prediction.activities)}`}
                              </Typography>
                              
                              {/* Probability display */}
                              {prediction.probability && (
                                <Typography 
                                  variant="body2" 
                                  sx={{ 
                                    fontFamily: 'Nunito, sans-serif',
                                    fontSize: '0.9rem',
                                    fontWeight: 500,
                                    color: moodColor,
                                    textAlign: {xs: 'center', sm: 'left'},
                                    mt: 0.5
                                  }}
                                >
                                  Confidence: {prediction.probability}%
                                </Typography>
                              )}
                              
                              {prediction.activities && prediction.activities.length > 0 && (
                                <Box 
                                  sx={{ 
                                    display: 'flex', 
                                    flexWrap: 'wrap',
                                    mt: 2,
                                    justifyContent: {xs: 'center', sm: 'flex-start'}
                                  }}
                                >
                                  {prediction.activities.map((activity, i) => (
                                    <Box 
                                      key={i} 
                                      sx={{
                                        backgroundColor: `${moodColor}15`,
                                        color: moodColor,
                                        borderRadius: '20px',
                                        px: 1.5,
                                        py: 0.5,
                                        mr: 1,
                                        mb: 1,
                                        fontSize: '0.85rem',
                                        fontFamily: 'Nunito, sans-serif',
                                        fontWeight: 500,
                                        display: 'flex',
                                        alignItems: 'center'
                                      }}
                                    >
                                      <LocalActivityIcon sx={{ fontSize: 14, mr: 0.5 }} />
                                      {activity}
                                    </Box>
                                  ))}
                                </Box>
                              )}
                            </Box>
                            
                            {isCurrentDay && (
                              <Box 
                                sx={{ 
                                  position: 'absolute', 
                                  top: 10, 
                                  right: 10, 
                                  backgroundColor: moodColor,
                                  color: 'white',
                                  borderRadius: '12px',
                                  px: 1,
                                  py: 0.2,
                                  fontSize: '0.7rem',
                                  fontFamily: 'Nunito, sans-serif',
                                  fontWeight: 600
                                }}
                              >
                                TODAY
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      </motion.div>
                    );
                  })}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontFamily: 'Nunito, sans-serif',
                      fontWeight: 600,
                      color: '#3a3939',
                      mb: 2
                    }}
                  >
                    No Predictions Available
                  </Typography>
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      fontFamily: 'Nunito, sans-serif',
                      color: '#666'
                    }}
                  >
                    Continue logging your moods daily to receive weekly predictions.
                  </Typography>
                </Box>
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
              "Looking ahead helps you prepare for emotional changes and plan activities that support your well-being."
            </Typography>
          </Paper>
        </motion.div>
      </Container>
    </div>
  );
};

export default WeeklyPredictions;