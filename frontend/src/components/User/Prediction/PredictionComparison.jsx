import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import BottomNav from '../../BottomNav';
import { motion } from 'framer-motion';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Line } from 'react-chartjs-2';

import { 
  Typography, 
  Box, 
  Container,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Paper,
  Grid
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import BarChartIcon from '@mui/icons-material/BarChart';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import GroupIcon from '@mui/icons-material/Group';
import FavoriteIcon from '@mui/icons-material/Favorite';
import BedtimeIcon from '@mui/icons-material/Bedtime';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const PredictionComparison = () => {
  const [value, setValue] = useState('prediction');
  const navigate = useNavigate();
  const [comparisonData, setComparisonData] = useState(null);
  const [weekInfo, setWeekInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [availableOffsets, setAvailableOffsets] = useState([]);

  const categories = [
    { key: 'activity', name: 'Activity', color: '#FF6B6B', icon: DirectionsRunIcon },
    { key: 'social', name: 'Social', color: '#4ECDC4', icon: GroupIcon },
    { key: 'health', name: 'Health', color: '#45B7D1', icon: FavoriteIcon },
    { key: 'sleep', name: 'Sleep', color: '#96CEB4', icon: BedtimeIcon }
  ];

  const moodColors = {
    'Bored': '#94A3B8',
    'Sad': '#64748B',
    'Disappointed': '#475569',
    'Angry': '#EF4444',
    'Tense': '#DC2626',
    'Calm': '#06B6D4',
    'Relaxed': '#0EA5E9',
    'Pleased': '#22C55E',
    'Happy': '#84CC16',
    'Excited': '#EAB308',
    'No data': '#E5E7EB'
  };

  useEffect(() => {
    fetchAvailableWeeks();
    fetchComparisonData();
  }, [weekOffset]);

  const fetchAvailableWeeks = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/user-available-weeks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const result = await response.json();
        setAvailableOffsets(result.availableOffsets || []);
      }
    } catch (err) {
      console.error('Error fetching available weeks:', err);
      // If fetching available weeks fails, allow all options as fallback
      setAvailableOffsets([0, 1, 2, 3, 4]);
    }
  };

  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/user-prediction-comparison?weekOffset=${weekOffset}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response error:', errorText);
        throw new Error(`Failed to fetch comparison data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      
      setComparisonData(result.data);
      setWeekInfo(result.weekInfo);
      setError('');
    } catch (err) {
      console.error('Fetch error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  const createPredictedVsActualChart = (category) => {
    if (!comparisonData || !comparisonData[category.key]) return null;

    const data = comparisonData[category.key];
    
    // Use probability data from backend (confidence level from Python service)
    const probabilityData = data.probability || data.days.map(() => 0);
    
    const chartData = {
      labels: data.days,
      datasets: [
        {
          label: 'Predicted Mood',
          data: data.predicted.map(mood => mood === 'No data' ? 0 : 1),
          backgroundColor: `${category.color}80`,
          borderColor: category.color,
          borderWidth: 2,
          type: 'bar',
          yAxisID: 'y'
        },
        {
          label: 'Actual Mood',
          data: data.actual.map(mood => mood === 'No data' ? 0 : 1),
          backgroundColor: `${category.color}40`,
          borderColor: category.color,
          borderWidth: 2,
          type: 'bar',
          yAxisID: 'y'
        },
        {
          label: 'Actual Mood Probability %',
          data: probabilityData,
          borderColor: '#EF4444',
          backgroundColor: '#EF444480',
          type: 'line',
          yAxisID: 'y1',
          tension: 0.4,
          pointRadius: 6,
          pointHoverRadius: 8
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: true,
          text: `${category.name} - Predicted vs Actual Mood`,
          font: { size: 16, weight: 'bold' },
          color: '#3a3939'
        },
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            afterLabel: function(context) {
              const dayIndex = context.dataIndex;
              if (context.datasetIndex === 0) {
                return `Predicted: ${data.predicted[dayIndex]}`;
              } else if (context.datasetIndex === 1) {
                return `Actual: ${data.actual[dayIndex]}`;
              }
              return '';
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Days of Week',
            color: '#666'
          }
        },
        y: {
          type: 'linear',
          display: true,
          position: 'left',
          min: 0,
          max: 1,
          ticks: {
            callback: function(value) {
              return value === 1 ? 'Has Data' : 'No Data';
            }
          },
          title: {
            display: true,
            text: 'Data Availability',
            color: '#666'
          }
        },
        y1: {
          type: 'linear',
          display: true,
          position: 'right',
          min: 0,
          max: 100,
          title: {
            display: true,
            text: 'Actual Mood Probability (%)',
            color: '#666'
          },
          grid: {
            drawOnChartArea: false,
          },
        }
      },
    };

    return <Bar data={chartData} options={options} height={300} />;
  };

  const createMoodDistributionChart = (category) => {
    if (!comparisonData || !comparisonData[category.key]) return null;

    const data = comparisonData[category.key];
    const predictedCounts = {};
    const actualCounts = {};

    // Count mood occurrences
    data.predicted.forEach(mood => {
      if (mood && mood !== 'No data') {
        predictedCounts[mood] = (predictedCounts[mood] || 0) + 1;
      }
    });

    data.actual.forEach(mood => {
      if (mood && mood !== 'No data') {
        actualCounts[mood] = (actualCounts[mood] || 0) + 1;
      }
    });

    const allMoods = [...new Set([...Object.keys(predictedCounts), ...Object.keys(actualCounts)])];

    if (allMoods.length === 0) {
      return (
        <div className="flex items-center justify-center h-40 text-gray-500">
          <p>No mood data available for {category.name}</p>
        </div>
      );
    }

    const chartData = {
      labels: allMoods,
      datasets: [
        {
          label: 'Predicted',
          data: allMoods.map(mood => predictedCounts[mood] || 0),
          backgroundColor: `${category.color}80`,
          borderColor: category.color,
          borderWidth: 1
        },
        {
          label: 'Actual',
          data: allMoods.map(mood => actualCounts[mood] || 0),
          backgroundColor: `${category.color}40`,
          borderColor: category.color,
          borderWidth: 1
        }
      ]
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: {
          display: true,
          text: `${category.name} - Mood Distribution`,
          font: { size: 14, weight: 'bold' },
          color: '#3a3939'
        },
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const mood = context.label;
              const datasetLabel = context.dataset.label;
              const value = context.parsed.y;
              const totalPredicted = Object.values(predictedCounts).reduce((sum, count) => sum + count, 0);
              const totalActual = Object.values(actualCounts).reduce((sum, count) => sum + count, 0);
              const total = datasetLabel === 'Predicted' ? totalPredicted : totalActual;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
              return `${datasetLabel} ${mood}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          title: {
            display: true,
            text: 'Days',
            color: '#666'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Mood Types',
            color: '#666'
          }
        }
      }
    };

    return <Bar data={chartData} options={options} height={250} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-[#67b88f] via-[#93c4ab] to-[#fdffff] pb-20">
        <CircularProgress size={60} sx={{ color: '#6fba94' }} />
        <Typography variant="h6" sx={{ mt: 2, fontFamily: 'Nunito, sans-serif', color: '#3a3939' }}>
          Loading your prediction comparison...
        </Typography>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#67b88f] via-[#93c4ab] to-[#fdffff] pb-24 font-nunito">
      <ToastContainer />
      
      <Container maxWidth="lg" className="pt-8">
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
            <BarChartIcon sx={{ fontSize: '3rem', color: '#6fba94', mb: 2 }} />
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
              Your Prediction vs Reality
            </Typography>
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#666',
                fontFamily: 'Nunito, sans-serif',
                fontWeight: 400
              }}
            >
              Compare your predicted moods with actual experiences
            </Typography>
            {weekInfo && (
              <Typography 
                variant="body1" 
                sx={{ 
                  color: '#888',
                  fontFamily: 'Nunito, sans-serif',
                  mt: 1
                }}
              >
                Week {weekInfo.weekNumber}, {weekInfo.year} | 
                {weekOffset === 0 ? ' Current Week' : ` ${weekOffset} week(s) ago`}
              </Typography>
            )}
          </Box>
        </motion.div>

        {/* Week Navigation */}
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
              <Typography 
                variant="subtitle1" 
                sx={{ 
                  fontWeight: 600,
                  color: '#3a3939',
                  mb: 2,
                  fontFamily: 'Nunito, sans-serif'
                }}
              >
                Select Week to View:
              </Typography>
              <select
                value={weekOffset}
                onChange={(e) => setWeekOffset(parseInt(e.target.value))}
                className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'Nunito, sans-serif' }}
              >
                <option value={0} disabled={!availableOffsets.includes(0)}>
                  Current Week {!availableOffsets.includes(0) }
                </option>
                <option value={1} disabled={!availableOffsets.includes(1)}>
                  1 Week Ago {!availableOffsets.includes(1) }
                </option>
                <option value={2} disabled={!availableOffsets.includes(2)}>
                  2 Weeks Ago {!availableOffsets.includes(2) }
                </option>
                <option value={3} disabled={!availableOffsets.includes(3)}>
                  3 Weeks Ago {!availableOffsets.includes(3) }
                </option>
                <option value={4} disabled={!availableOffsets.includes(4)}>
                  4 Weeks Ago {!availableOffsets.includes(4) }
                </option>
              </select>
              {availableOffsets.length > 0 && (
                <Typography 
                  variant="body2" 
                  sx={{ 
                    color: '#666',
                    fontFamily: 'Nunito, sans-serif',
                    mt: 1
                  }}
                >
                  Available weeks: {availableOffsets.length} of 5
                </Typography>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="mb-6"
          >
            <Card sx={{ backgroundColor: '#ffebee', border: '1px solid #f44336' }}>
              <CardContent>
                <Typography variant="h6" color="error" sx={{ fontWeight: 600, mb: 1 }}>
                  Error Loading Data
                </Typography>
                <Typography variant="body2" color="error">
                  {error}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Make sure you have prediction data for this week. You may need to wait for the system to generate predictions first.
                </Typography>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {comparisonData && (
          <div className="space-y-8">
            {/* Predicted vs Actual Comparison Charts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              <Grid container spacing={3}>
                {categories.map((category, index) => (
                  <Grid item xs={12} md={6} key={category.key}>
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index, duration: 0.6 }}
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
                        }}
                      >
                        <CardContent sx={{ p: 3, height: '350px' }}>
                          {createPredictedVsActualChart(category)}
                        </CardContent>
                      </Card>
                    </motion.div>
                  </Grid>
                ))}
              </Grid>
            </motion.div>

            {/* Mood Distribution Charts */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
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
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography 
                    variant="h5" 
                    sx={{ 
                      fontWeight: 700,
                      color: '#3a3939',
                      mb: 3,
                      fontFamily: 'Nunito, sans-serif',
                      textAlign: 'center'
                    }}
                  >
                    Mood Distribution by Category
                  </Typography>
                  <Grid container spacing={3}>
                    {categories.map((category, index) => (
                      <Grid item xs={12} md={6} key={`dist-${category.key}`}>
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 * index, duration: 0.6 }}
                        >
                          <Paper 
                            elevation={0}
                            sx={{ 
                              p: 3, 
                              borderRadius: 3,
                              border: '1px solid rgba(0,0,0,0.1)',
                              height: '300px'
                            }}
                          >
                            {createMoodDistributionChart(category)}
                          </Paper>
                        </motion.div>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </motion.div>

            {/* Info Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
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
                    Understanding Your Charts
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
                    These charts show the comparison between your predicted and actual moods for each category throughout the week. 
                    Each chart displays data availability for predicted vs actual moods on each day. 
                    Hover over the bars to see the specific mood names that were predicted vs what you actually experienced. 
                    This helps you understand how accurate the system's predictions were for your personal emotional patterns.
                  </Typography>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        )}
      </Container>
      
      <BottomNav value={value} setValue={setValue} />
    </div>
  );
};

export default PredictionComparison;