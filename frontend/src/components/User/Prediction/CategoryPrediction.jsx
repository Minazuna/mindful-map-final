import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from "react-router-dom";
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
  Paper,
  Grid,
  CircularProgress,
  Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import GroupIcon from '@mui/icons-material/Group';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import BarChartIcon from '@mui/icons-material/BarChart';

const CategoryPrediction = () => {
  const [value, setValue] = useState('prediction');
  const navigate = useNavigate();
  const { category } = useParams();
  const [predictions, setPredictions] = useState(null);
  const [dateRange, setDateRange] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const todayRef = useRef(null);

  useEffect(() => {
    fetchCategoryPredictions();
  }, [category]);

  useEffect(() => {
    // Auto-scroll to today's prediction after a short delay
    if (todayRef.current && !loading) {
      setTimeout(() => {
        todayRef.current?.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, 500);
    }
  }, [loading, predictions]);

  const fetchCategoryPredictions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/predict-category-mood?category=${category}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
      });

      const data = await response.json();
      
      if (data.success) {
        setPredictions(data.predictions);
        setDateRange(data.dateRange);
      } else {
        setError(data.message || 'Failed to fetch predictions');
        toast.error(data.message || 'Failed to fetch predictions');
      }
    } catch (error) {
      console.error("Error fetching category predictions:", error);
      setError('Network error occurred');
      toast.error('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getCategoryIcon = (category) => {
    switch(category) {
      case 'activity': return <DirectionsRunIcon sx={{ fontSize: '3rem' }} />;
      case 'social': return <GroupIcon sx={{ fontSize: '3rem' }} />;
      case 'health': return <FavoriteIcon sx={{ fontSize: '3rem' }} />;
      case 'sleep': return <BedtimeIcon sx={{ fontSize: '3rem' }} />;
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

  const getEmotionEmoji = (emotion) => {
    const emotionMap = {
      // Negative emotions
      'bored': '😑',
      'sad': '😢',
      'disappointed': '😞',
      'angry': '😠',
      'tense': '😰',
      // Positive emotions
      'calm': '😌',
      'relaxed': '😊',
      'pleased': '🙂',
      'happy': '😄',
      'excited': '🤩'
    };
    return emotionMap[emotion.toLowerCase()] || '😐';
  };

  const getProbabilityColor = (probability) => {
    if (probability >= 70) return '#4CAF50'; // Green
    if (probability >= 50) return '#FF9800'; // Orange
    return '#f44336'; // Red
  };

  const getEmotionValence = (emotion) => {
    const negativeEmotions = ['bored', 'sad', 'disappointed', 'angry', 'tense'];
    const positiveEmotions = ['calm', 'relaxed', 'pleased', 'happy', 'excited'];
    
    if (negativeEmotions.includes(emotion.toLowerCase())) {
      return 'negative';
    } else if (positiveEmotions.includes(emotion.toLowerCase())) {
      return 'positive';
    }
    return 'neutral';
  };

  const getValenceColor = (valence) => {
    switch(valence) {
      case 'positive': return '#4CAF50'; // Green
      case 'negative': return '#f44336'; // Red
      default: return '#9E9E9E'; // Gray
    }
  };

  const getValenceIcon = (valence) => {
    return (
      <Box 
        sx={{ 
          width: 8, 
          height: 8, 
          borderRadius: '50%',
          backgroundColor: getValenceColor(valence),
          display: 'inline-block',
          mr: 0.5
        }}
      />
    );
  };

  const getActivityDisplayName = (activityId) => {
    const activityMap = {
      // Activity category
      'study': 'Study',
      'read': 'Read',
      'extracurricular': 'Extracurricular Activities',
      'relax': 'Relax',
      'watch-movie': 'Watch Movie',
      'listen-music': 'Listen to Music',
      'gaming': 'Gaming',
      'browse-internet': 'Browse the Internet',
      'shopping': 'Shopping',
      'travel': 'Travel',
      
      // Social category
      'alone': 'Alone',
      'friends': 'Friend/s',
      'family': 'Family',
      'classmates': 'Classmate/s',
      'relationship': 'Relationship',
      'online': 'Online Interaction',
      'pet': 'Pet',
      
      // Health category
      'jog': 'Jog',
      'walk': 'Walk',
      'exercise': 'Exercise',
      'meditate': 'Meditate',
      'eat-healthy': 'Eat Healthy',
      'no-physical': 'No Physical Activity',
      'eat-unhealthy': 'Eat Unhealthy',
      'drink-alcohol': 'Drink Alcohol',
      
      // Sleep category (sleep uses hours, not activities like others)
      'sleep': 'Sleep Hours'
    };
    
    return activityMap[activityId] || activityId || 'Unknown Activity';
  };

  // Helper function to check if a day is today
  const isToday = (day) => {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    return day === dayName;
  };

  // Helper function to get formatted date for a day
  const getDateForDay = (day) => {
    const today = new Date();
    const dayName = today.toLocaleDateString('en-US', { weekday: 'long' });
    
    if (day === dayName) {
      return today.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
      });
    }
    
    // Calculate the date for other days
    let targetDate = new Date();
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayIndex = today.getDay();
    const targetDayIndex = daysOfWeek.indexOf(day);
    
    let daysAhead = targetDayIndex - currentDayIndex;
    if (daysAhead <= 0) {
      daysAhead += 7;
    }
    
    targetDate.setDate(today.getDate() + daysAhead);
    
    return targetDate.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Define proper weekday order
  const weekdaysOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  // Sort predictions by proper weekday order
  const sortedPredictions = weekdaysOrder.map(day => {
    return [day, predictions?.[day] || null];
  }).filter(([day, prediction]) => prediction !== null);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#67b88f] via-[#93c4ab] to-[#fdffff] pb-20">
        <CircularProgress size={60} sx={{ color: '#6fba94' }} />
        <Typography variant="h6" sx={{ mt: 2, fontFamily: 'Nunito, sans-serif', color: '#3a3939' }}>
          Analyzing your {category} patterns...
        </Typography>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#67b88f] via-[#93c4ab] to-[#fdffff] pb-20">
        <Container maxWidth="md">
          <Card sx={{ p: 4, textAlign: 'center' }}>
            <Typography variant="h5" color="error" sx={{ mb: 2 }}>
              {error}
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate('/prediction')}
              sx={{ backgroundColor: '#6fba94', '&:hover': { backgroundColor: '#5da87a' } }}
            >
              Go Back
            </Button>
          </Card>
        </Container>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-gradient-to-b from-[#67b88f] via-[#93c4ab] to-[#fdffff] pb-24 font-nunito">
      <ToastContainer />
      
      <Container maxWidth="lg" className="mt-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="mb-6"
        >
          <Box className="flex items-center mb-4">
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => navigate('/prediction')}
              sx={{
                color: '#3a3939',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 600,
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' }
              }}
            >
              Back to Predictions
            </Button>
          </Box>

          <Box className="text-center">
            <Box sx={{ color: getCategoryColor(category), mb: 2 }}>
              {getCategoryIcon(category)}
            </Box>
            <Typography 
              variant="h3" 
              component="h1" 
              sx={{ 
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 800, 
                color: '#3a3939',
                mb: 1
              }}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)} Predictions
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#666',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 400
              }}
            >
              Weekly mood predictions based on your {category} patterns
            </Typography>
          </Box>
        </motion.div>

        {/* Date Range Info */}
        {dateRange && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="mb-6"
          >
            <Card 
              elevation={0}
              sx={{ 
                borderRadius: '15px', 
                overflow: 'hidden', 
                boxShadow: '0 4px 15px rgba(0,0,0,0.08)',
                background: 'rgba(255,255,255,0.9)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              <CardContent sx={{ p: 3, textAlign: 'center' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                  <CalendarTodayIcon sx={{ mr: 1, color: getCategoryColor(category) }} />
                  <Typography 
                    variant="subtitle1" 
                    sx={{ 
                      fontWeight: 600,
                      color: '#3a3939',
                      fontFamily: 'Nunito, sans-serif'
                    }}
                  >
                    Historical Data Period
                  </Typography>
                </Box>
                <Typography 
                  variant="body1" 
                  sx={{ 
                    color: getCategoryColor(category),
                    fontFamily: 'Nunito, sans-serif',
                    fontWeight: 500,
                    mb: 0.5
                  }}
                >
                  {new Date(dateRange.start_date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })} - {new Date(dateRange.end_date).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2, mt: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BarChartIcon sx={{ mr: 0.5, color: '#666', fontSize: '1rem' }} />
                    <Typography 
                      variant="body2" 
                      sx={{ 
                        color: '#666',
                        fontFamily: 'Nunito, sans-serif'
                      }}
                    >
                      {dateRange.weeks_of_data} weeks
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#666' }}>•</Typography>
                  <Typography 
                    variant="body2" 
                    sx={{ 
                      color: '#666',
                      fontFamily: 'Nunito, sans-serif'
                    }}
                  >
                    {dateRange.total_entries} entries
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Predictions Grid */}
        <Grid container spacing={3}>
          {sortedPredictions.map(([day, prediction], index) => {
            const valence = prediction.predicted_mood && 
                           prediction.predicted_mood !== 'No data available' && 
                           prediction.predicted_mood !== 'No valid data' 
                           ? getEmotionValence(prediction.predicted_mood) 
                           : null;
            const isTodayPrediction = isToday(day);
            const dateStr = getDateForDay(day);

            return (
              <Grid item xs={12} md={6} lg={4} key={day} ref={isTodayPrediction ? todayRef : null}>
                <motion.div
                  initial={{ opacity: 0, y: 20, scale: isTodayPrediction ? 0.95 : 1 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: index * 0.1, duration: isTodayPrediction ? 0.8 : 0.6 }}
                >
                  <Card 
                    elevation={isTodayPrediction ? 3 : 0}
                    sx={{ 
                      borderRadius: '20px', 
                      overflow: 'hidden', 
                      boxShadow: isTodayPrediction ? '0 0 30px rgba(111, 186, 148, 0.4)' : '0 8px 25px rgba(0,0,0,0.1)',
                      background: 'rgba(255,255,255,0.95)',
                      backdropFilter: 'blur(10px)',
                      border: isTodayPrediction ? `4px solid ${getCategoryColor(category)}` : `2px solid ${valence ? getValenceColor(valence) + '20' : 'rgba(255,255,255,0.5)'}`,
                      height: '100%',
                      transition: 'transform 0.3s ease',
                      position: 'relative',
                      '&:hover': {
                        transform: 'translateY(-4px)',
                        boxShadow: isTodayPrediction ? '0 0 40px rgba(111, 186, 148, 0.5)' : '0 12px 35px rgba(0,0,0,0.15)'
                      },
                      ...(isTodayPrediction && {
                        '&::before': {
                          content: '"TODAY"',
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          backgroundColor: getCategoryColor(category),
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '0 10px 0 10px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          letterSpacing: '0.5px'
                        }
                      })
                    }}
                  >
                    <CardContent sx={{ p: 3 }}>
                      {/* Day Header with Confidence */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                        <Box>
                          <Typography 
                            variant="h5" 
                            sx={{ 
                              fontWeight: 700,
                              color: getCategoryColor(category),
                              fontFamily: 'Nunito, sans-serif'
                            }}
                          >
                            {day}
                          </Typography>
                          <Typography 
                            variant="caption" 
                            sx={{ 
                              color: '#888',
                              fontFamily: 'Nunito, sans-serif',
                              fontWeight: 400
                            }}
                          >
                            {dateStr}
                          </Typography>
                        </Box>
                        {prediction.predicted_mood !== 'No data available' && 
                         prediction.predicted_mood !== 'No valid data' && (
                          <Chip
                            label={`${prediction.probability}%`}
                            size="small"
                            sx={{
                              backgroundColor: getProbabilityColor(prediction.probability),
                              color: 'white',
                              fontWeight: 600,
                              fontFamily: 'Nunito, sans-serif'
                            }}
                          />
                        )}
                      </Box>

                      {prediction.predicted_mood === 'No data available' || 
                       prediction.predicted_mood === 'No valid data' ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 3 }}>
                          <Typography variant="body1" color="text.secondary" sx={{ fontFamily: 'Nunito, sans-serif' }}>
                            {prediction.predicted_mood}
                          </Typography>
                        </Box>
                      ) : (
                        <>
                          {/* Main Prediction with Emoji */}
                          <Box sx={{ mb: 2 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                              <Typography 
                                variant="h3" 
                                sx={{ mr: 2 }}
                              >
                                {getEmotionEmoji(prediction.predicted_mood)}
                              </Typography>
                              <Box>
                                <Typography 
                                  variant="h6" 
                                  sx={{ 
                                    fontWeight: 600,
                                    color: '#3a3939',
                                    fontFamily: 'Nunito, sans-serif',
                                    textTransform: 'capitalize'
                                  }}
                                >
                                  {prediction.predicted_mood}
                                </Typography>
                                {valence && (
                                  <Typography
                                    variant="caption"
                                    sx={{
                                      color: getValenceColor(valence),
                                      fontWeight: 500,
                                      fontFamily: 'Nunito, sans-serif',
                                      display: 'flex',
                                      alignItems: 'center'
                                    }}
                                  >
                                    {getValenceIcon(valence)} {valence === 'positive' ? 'Positive' : 'Negative'}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </Box>

                          {/* Metrics Container - Valence and Likely Cause */}
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, gap: 2 }}>
                            <Box sx={{ flex: 1 }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: '#888',
                                  fontFamily: 'Nunito, sans-serif',
                                  display: 'block',
                                  mb: 0.5
                                }}
                              >
                                Valence:
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 500,
                                  color: '#3a3939',
                                  fontFamily: 'Nunito, sans-serif'
                                }}
                              >
                                {valence ? (valence === 'positive' ? 'Positive' : 'Negative') : 'N/A'}
                              </Typography>
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography 
                                variant="caption" 
                                sx={{ 
                                  color: '#888',
                                  fontFamily: 'Nunito, sans-serif',
                                  display: 'block',
                                  mb: 0.5
                                }}
                              >
                                Likely Cause:
                              </Typography>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  fontWeight: 500,
                                  color: '#3a3939',
                                  fontFamily: 'Nunito, sans-serif'
                                }}
                              >
                                {category === 'sleep' 
                                  ? `${prediction.cause || 'Unknown'}`
                                  : getActivityDisplayName(prediction.cause)
                                }
                              </Typography>
                            </Box>
                          </Box>

                          {/* Emotion Probabilities Breakdown */}
                          {prediction.all_mood_probabilities && Object.keys(prediction.all_mood_probabilities).length > 1 && (
                            <Box sx={{ borderTop: '1px solid #f0f0f0', pt: 2 }}>
                              <Typography 
                                variant="subtitle2" 
                                sx={{ 
                                  fontWeight: 600,
                                  color: '#3a3939',
                                  mb: 1.5,
                                  fontFamily: 'Nunito, sans-serif'
                                }}
                              >
                                Emotion Probabilities:
                              </Typography>
                              <Box>
                                {Object.entries(prediction.all_mood_probabilities)
                                  .filter(([_, probability]) => probability > 0)
                                  .sort(([,a], [,b]) => b - a)
                                  .slice(0, 3)
                                  .map(([emotion, probability]) => (
                                    <Box 
                                      key={emotion}
                                      sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        mb: 1
                                      }}
                                    >
                                      <Box 
                                        sx={{ 
                                          width: 12, 
                                          height: 12, 
                                          borderRadius: '50%',
                                          backgroundColor: getCategoryColor(category),
                                          opacity: emotion.toLowerCase() === prediction.predicted_mood.toLowerCase() ? 1 : 0.6,
                                          mr: 1
                                        }}
                                      />
                                      <Typography 
                                        variant="body2"
                                        sx={{ 
                                          flex: 1,
                                          fontFamily: 'Nunito, sans-serif',
                                          textTransform: 'capitalize',
                                          fontSize: '0.8rem'
                                        }}
                                      >
                                        {emotion}
                                      </Typography>
                                      <Typography 
                                        variant="body2"
                                        sx={{ 
                                          fontWeight: 500,
                                          color: '#666',
                                          fontFamily: 'Nunito, sans-serif',
                                          fontSize: '0.8rem'
                                        }}
                                      >
                                        {probability}%
                                      </Typography>
                                    </Box>
                                  ))}
                              </Box>
                            </Box>
                          )}
                        </>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            );
          })}
        </Grid>

        {/* Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
        >
          <Card 
            elevation={0}
            sx={{ 
              mt: 4,
              borderRadius: '20px', 
              overflow: 'hidden', 
              boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
              background: 'rgba(255,255,255,0.95)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255,255,255,0.5)',
            }}
          >
            <CardContent sx={{ p: 4 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: '#3a3939',
                  mb: 2,
                  fontFamily: 'Nunito, sans-serif',
                  textAlign: 'center'
                }}
              >
                How This Works
              </Typography>
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#666',
                  fontFamily: 'Nunito, sans-serif',
                  textAlign: 'center',
                  lineHeight: 1.7
                }}
              >
                These predictions analyze your {category} data from {dateRange ? `the period shown above (${dateRange.weeks_of_data} weeks of historical data)` : 'up to the last 4 weeks'}, 
                using a weighted probability model that prioritizes recent patterns. Each prediction shows the emotion valence (positive/negative), 
                confidence percentage, and alternative emotion probabilities to give you a complete picture of your mood patterns.
              </Typography>
            </CardContent>
          </Card>
        </motion.div>
      </Container>
      
      <BottomNav value={value} setValue={setValue} />
    </div>
  );
};

export default CategoryPrediction;
