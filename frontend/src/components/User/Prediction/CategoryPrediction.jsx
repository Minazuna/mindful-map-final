import React, { useState, useEffect } from 'react';
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

const CategoryPrediction = () => {
  const [value, setValue] = useState('prediction');
  const navigate = useNavigate();
  const { category } = useParams();
  const [predictions, setPredictions] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCategoryPredictions();
  }, [category]);

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

        {/* Predictions Grid */}
        <Grid container spacing={3}>
          {Object.entries(predictions || {}).map(([day, prediction], index) => (
            <Grid item xs={12} md={6} lg={4} key={day}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card 
                  elevation={0}
                  sx={{ 
                    borderRadius: '20px', 
                    overflow: 'hidden', 
                    boxShadow: '0 8px 25px rgba(0,0,0,0.1)',
                    background: 'rgba(255,255,255,0.95)',
                    backdropFilter: 'blur(10px)',
                    border: '1px solid rgba(255,255,255,0.5)',
                    height: '100%',
                    transition: 'transform 0.3s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: '0 12px 35px rgba(0,0,0,0.15)'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Typography 
                      variant="h5" 
                      sx={{ 
                        fontWeight: 700,
                        color: getCategoryColor(category),
                        mb: 2,
                        fontFamily: 'Nunito, sans-serif',
                        textAlign: 'center'
                      }}
                    >
                      {day}
                    </Typography>

                    {prediction.predicted_mood === 'No data available' || 
                     prediction.predicted_mood === 'No valid data' ? (
                      <Box sx={{ textAlign: 'center', py: 2 }}>
                        <Typography variant="body1" color="text.secondary">
                          {prediction.predicted_mood}
                        </Typography>
                      </Box>
                    ) : (
                      <>
                        {/* Predicted Emotion */}
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                          <Typography 
                            variant="h2" 
                            sx={{ mb: 1 }}
                          >
                            {getEmotionEmoji(prediction.predicted_mood)}
                          </Typography>
                          <Typography 
                            variant="h6" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#3a3939',
                              fontFamily: 'Nunito, sans-serif'
                            }}
                          >
                            {prediction.predicted_mood}
                          </Typography>
                        </Box>

                        {/* Probability */}
                        <Box sx={{ textAlign: 'center', mb: 3 }}>
                          <Chip
                            icon={<TrendingUpIcon />}
                            label={`${prediction.probability}% confidence`}
                            sx={{
                              backgroundColor: getProbabilityColor(prediction.probability),
                              color: 'white',
                              fontWeight: 600,
                              fontFamily: 'Nunito, sans-serif'
                            }}
                          />
                        </Box>

                        {/* Cause */}
                        <Paper 
                          elevation={0}
                          sx={{ 
                            p: 2, 
                            backgroundColor: 'rgba(0,0,0,0.03)',
                            borderRadius: 2
                          }}
                        >
                          <Typography 
                            variant="subtitle2" 
                            sx={{ 
                              fontWeight: 600,
                              color: '#3a3939',
                              mb: 1,
                              fontFamily: 'Nunito, sans-serif'
                            }}
                          >
                            Most likely cause:
                          </Typography>
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              color: '#666',
                              fontFamily: 'Nunito, sans-serif',
                              fontStyle: 'italic'
                            }}
                          >
                            {prediction.cause}
                          </Typography>
                        </Paper>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            </Grid>
          ))}
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
                These predictions are based on analyzing your {category} data from the last 4 weeks, 
                using a weighted probability model that gives more importance to recent patterns. 
                The confidence percentage shows how certain the prediction is based on your historical data.
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
