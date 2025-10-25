import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import { Doughnut, Line } from 'react-chartjs-2';
import { motion } from 'framer-motion';
import BottomNav from '../../BottomNav';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
} from 'chart.js';
import Switch from '@mui/material/Switch';
import { styled } from '@mui/material/styles';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DownloadIcon from '@mui/icons-material/Download';
import BarChartIcon from '@mui/icons-material/BarChart';
import CalendarViewDayIcon from '@mui/icons-material/CalendarViewDay';
import DateRangeIcon from '@mui/icons-material/DateRange';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import InsightsIcon from '@mui/icons-material/Insights';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import ChartDataLabels from 'chartjs-plugin-datalabels';

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  ChartDataLabels
);

const Statistics = () => {
  const navigate = useNavigate();
  const [navValue, setNavValue] = useState('statistics');
  const [moodCounts, setMoodCounts] = useState({});
  const [beforeMoodCounts, setBeforeMoodCounts] = useState({});
  const [afterMoodCounts, setAfterMoodCounts] = useState({});
  const [sleepHoursData, setSleepHoursData] = useState([]);
  const [sleepAnalytics, setSleepAnalytics] = useState(null);
  const [moodPeriod, setMoodPeriod] = useState('monthly');
  const [sleepPeriod, setSleepPeriod] = useState('weekly');
  const [moodType, setMoodType] = useState('after'); // 'before' or 'after'
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const moodChartRef = useRef(null);
  const sleepChartRef = useRef(null);
  const pdfIconRef = useRef(null);

  useEffect(() => {
    const fetchMoodData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/mood-log`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const data = response.data;

        // Calculate mood counts based on the selected period
        let startOfPeriod, endOfPeriod;
        if (moodPeriod === 'weekly') {
          startOfPeriod = moment().startOf('isoWeek');
          endOfPeriod = moment().endOf('isoWeek');
        } else if (moodPeriod === 'daily') {
          startOfPeriod = moment().startOf('day');
          endOfPeriod = moment().endOf('day');
        } else {
          startOfPeriod = moment().startOf('month');
          endOfPeriod = moment().endOf('month');
        }

        const periodLogs = data.filter(log => {
          const logDate = moment(log.date);
          return logDate.isBetween(startOfPeriod, endOfPeriod, null, '[]');
        });

        const beforeMoodCountMap = {};
        const afterMoodCountMap = {};

        periodLogs.forEach(log => {
          // Count before emotions
          const beforeEmotion = log.beforeEmotion;
          if (beforeEmotion) {
            if (!beforeMoodCountMap[beforeEmotion]) {
              beforeMoodCountMap[beforeEmotion] = 0;
            }
            beforeMoodCountMap[beforeEmotion]++;
          }

          // Count after emotions
          const afterEmotion = log.afterEmotion;
          if (afterEmotion) {
            if (!afterMoodCountMap[afterEmotion]) {
              afterMoodCountMap[afterEmotion] = 0;
            }
            afterMoodCountMap[afterEmotion]++;
          }
        });

        setBeforeMoodCounts(beforeMoodCountMap);
        setAfterMoodCounts(afterMoodCountMap);
        setMoodCounts(moodType === 'before' ? beforeMoodCountMap : afterMoodCountMap);
      } catch (error) {
        console.error('Error fetching mood data:', error);
      }
    };

    fetchMoodData();
  }, [moodPeriod, moodType]);

  useEffect(() => {
    const fetchSleepHoursData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await axios.get(
          `${import.meta.env.VITE_NODE_API}/api/statistics/sleep-hours?period=${sleepPeriod}`,
          {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setSleepHoursData(response.data.sleepHoursData);
        setSleepAnalytics(response.data.analytics);
      } catch (error) {
        console.error('Error fetching sleep hours data:', error);
        setSleepHoursData([]);
        setSleepAnalytics(null);
      }
    };

    fetchSleepHoursData();
  }, [sleepPeriod]);

  // Updated emotion colors with appropriate mood-based colors
  const emotionColors = {
    // Positive emotions - warm and bright colors
    'calm': '#87CEEB',      // Sky blue - peaceful
    'relaxed': '#98D8C8',   // Mint green - soothing
    'pleased': '#DDA0DD',   // Plum - gentle satisfaction
    'happy': '#FFD700',     // Gold - bright and cheerful
    'excited': '#FF69B4',   // Hot pink - energetic
    // Negative emotions - appropriate emotional colors
    'bored': '#A9A9A9',     // Dark gray - dull/lifeless
    'sad': '#4682B4',       // Steel blue - melancholy
    'disappointed': '#CD853F', // Peru brown - muted disappointment
    'angry': '#DC143C',     // Crimson red - intense anger
    'tense': '#8B008B'      // Dark magenta - stress/anxiety
  };

  // Background colors for mood containers - lighter versions
  const moodBackgroundColors = {
    // Positive emotions - light, warm backgrounds
    'calm': '#E6F3FF',      // Very light sky blue
    'relaxed': '#E8F5F0',   // Very light mint
    'pleased': '#F0E6F7',   // Very light plum
    'happy': '#FFF9E6',     // Very light gold
    'excited': '#FFE6F1',   // Very light pink
    // Negative emotions - muted, appropriate backgrounds
    'bored': '#F0F0F0',     // Light gray
    'sad': '#E6F0F8',       // Very light steel blue
    'disappointed': '#F5EFE7', // Very light brown
    'angry': '#FFE6EA',     // Very light red
    'tense': '#F0E6F0'      // Very light magenta
  };

  const currentMoodCounts = moodType === 'before' ? beforeMoodCounts : afterMoodCounts;

  const chartData = {
    labels: Object.keys(currentMoodCounts),
    datasets: [
      {
        data: Object.values(currentMoodCounts),
        backgroundColor: Object.keys(currentMoodCounts).map(emotion => emotionColors[emotion.toLowerCase()] || '#95A5A6'),
        hoverBackgroundColor: Object.keys(currentMoodCounts).map(emotion => emotionColors[emotion.toLowerCase()] || '#95A5A6'),
        borderWidth: 3,
        borderColor: '#fff',
        hoverBorderColor: '#fff'
      }
    ]
  };

  // Function to capitalize text
  const capitalizeText = (text) => {
    return text.replace(/[-_]/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  // Handle mood click to navigate to MoodStatistics
  const handleMoodClick = (emotion) => {
    navigate('/mood-statistics', { 
      state: { 
        emotion: emotion.toLowerCase(),
        moodType: moodType,
        period: moodPeriod 
      }
    });
  };

  const chartOptions = {
    cutout: '60%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: '#333',
        bodyColor: '#333',
        borderColor: '#55AD9B',
        borderWidth: 1,
        cornerRadius: 12,
        displayColors: true,
        callbacks: {
          label: function (context) {
            const label = capitalizeText(context.label || ''); // Capitalize the label
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} entries (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#000000', // Changed from '#fff' to black
        font: {
          weight: 'bold',
          size: 12
        },
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
          const percentage = ((value / total) * 100).toFixed(0);
          return `${percentage}%`; // Removed the condition, now shows percentage for all values
        }
      }
    }
  };

  const sleepHoursChartData = {
    labels: sleepHoursData.map(data => 
      sleepPeriod === 'weekly' 
        ? moment(data.date).format('ddd') 
        : moment(data.date).format('MMM D')
    ),
    datasets: [
      {
        label: 'Hours of Sleep',
        data: sleepHoursData.map(data => data.hours),
        borderColor: '#55AD9B',  // Updated to your brand color
        backgroundColor: 'rgba(149, 210, 179, 0.2)',  // Updated with #95D2B3 with transparency
        fill: true,
        tension: 0.4,
        pointBackgroundColor: '#55AD9B',  // Updated to your brand color
        pointBorderColor: '#ffffff',  // White border for contrast
        pointBorderWidth: 3,
        pointRadius: 8,
        pointHoverRadius: 12,
        pointHoverBackgroundColor: '#95D2B3',  // Updated to lighter brand color on hover
        pointHoverBorderColor: '#ffffff',
        pointHoverBorderWidth: 3,
        borderWidth: 4,
      }
    ]
  };

  const sleepHoursChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(149, 210, 179, 0.95)',  // Updated with #95D2B3
        titleColor: '#ffffff',  // White text for better contrast
        bodyColor: '#ffffff',   // White text for better contrast
        borderColor: '#55AD9B',  // Updated border color
        borderWidth: 2,
        cornerRadius: 12,
        displayColors: false,
        titleFont: { size: 14, weight: 'bold' },
        bodyFont: { size: 13 },
        callbacks: {
          title: (context) => {
            return sleepPeriod === 'weekly' 
              ? moment(sleepHoursData[context[0].dataIndex].date).format('dddd')
              : moment(sleepHoursData[context[0].dataIndex].date).format('MMMM D, YYYY');
          },
          label: (context) => {
            return `Sleep: ${context.raw} hours`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 12,
        ticks: {
          stepSize: 2,
          callback: function (value) {
            return value + 'h';
          },
          font: {
            family: "'Inter', sans-serif",
            size: 12,
            weight: '500'
          },
          color: '#55AD9B'  // Updated to your brand color
        },
        grid: {
          color: 'rgba(149, 210, 179, 0.3)',  // Updated with #95D2B3 with transparency
          lineWidth: 1
        },
        border: {
          display: false
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 0,
          font: {
            family: "'Inter', sans-serif",
            size: 11,
            weight: '500'
          },
          color: '#55AD9B'  // Updated to your brand color
        },
        border: {
          display: false
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    }
  };

  const handleDailyStatisticsClick = () => {
    navigate('/daily-statistics');
  };

  const handleWeeklyStatisticsClick = () => {
    navigate('/weekly-statistics');
  };

  const handleDailyAnovaClick = () => {
    navigate('/daily-anova');
  };

  const handleWeeklyAnovaClick = () => {
    navigate('/weekly-anova');
  };

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    
    const moodInput = moodChartRef.current;
    const sleepInput = sleepChartRef.current;
    const pdfIcon = pdfIconRef.current;
    pdfIcon.style.display = 'none';
  
    try {
      const moodCanvas = await html2canvas(moodInput, { scale: 4 });
      const sleepCanvas = await html2canvas(sleepInput, { scale: 1 });
    
      pdfIcon.style.display = 'block';
    
      const moodImgData = moodCanvas.toDataURL('image/png');
      const sleepImgData = sleepCanvas.toDataURL('image/png');
    
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 180;
      const moodImgHeight = (moodCanvas.height * imgWidth) / moodCanvas.width;
      const sleepImgHeight = (sleepCanvas.height * imgWidth) / sleepCanvas.width;
    
      const centerX = (pdf.internal.pageSize.getWidth() - imgWidth) / 2;
    
      const pageWidth = pdf.internal.pageSize.getWidth();
      const logoWidth = 25; 
      const logoHeight = 25;
      const margin = 15;
      const lineY = 42;
      
      const tupLogo = new Image();
      const rightLogo = new Image();
      tupLogo.src = '/images/tup.png';
      rightLogo.src = '/images/logo.png';
      
      Promise.all([
        new Promise((resolve) => {
          tupLogo.onload = resolve;
          tupLogo.onerror = resolve;
        }),
        new Promise((resolve) => {
          rightLogo.onload = resolve;
          rightLogo.onerror = resolve;
        })
      ]).then(() => {
        if (tupLogo.complete) {
          pdf.addImage(tupLogo, 'PNG', margin, 10, logoWidth, logoHeight);
        }
        
        if (rightLogo.complete) {
          const rightLogoX = pageWidth - margin - logoWidth;
          pdf.addImage(rightLogo, 'PNG', rightLogoX, 10, logoWidth, logoHeight);
        }
        
        const textStart = margin + logoWidth + 10;
        const textWidth = pageWidth - margin - logoWidth - textStart;
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const universityName = "TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES-TAGUIG";
        const universityX = textStart + (textWidth - pdf.getTextWidth(universityName)) / 2 - 5;
        pdf.text(universityName, universityX, 20);
        
        pdf.setFontSize(11);
        const program = "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY";
        const programX = textStart + (textWidth - pdf.getTextWidth(program)) / 2 - 5;
        pdf.text(program, programX, 27);
        
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const address = "Km. 14 East Service Road, Western Bicutan, Taguig City 1630, Metro Manila, Philippines";
        const addressX = textStart + (textWidth - pdf.getTextWidth(address)) / 2 - 5;
        pdf.text(address, addressX, 34);
        
        pdf.setLineWidth(0.6);
        pdf.setDrawColor(85, 173, 155);  
        pdf.line(35, lineY, pageWidth - 35, lineY);
        
        pdf.setFillColor(85, 173, 155, 0.8);
        pdf.roundedRect(margin, lineY + 10, pageWidth - (margin * 2), 15, 3, 3, 'F');
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(255, 255, 255);
        const dateText = `Generated on: ${moment().format('MMMM D, YYYY')}`;
        pdf.text(dateText, pageWidth / 2, lineY + 19, { align: 'center' });
        
        pdf.setTextColor(33, 33, 33);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text(`${moodType.charAt(0).toUpperCase() + moodType.slice(1)}-Activity Mood Report (${moodPeriod})`, pageWidth / 2, lineY + 40, { align: 'center' });
        
        pdf.addImage(moodImgData, 'PNG', centerX, 70, imgWidth, moodImgHeight);
        pdf.addImage(sleepImgData, 'PNG', centerX, 70 + moodImgHeight + 20, imgWidth, sleepImgHeight);
    
        pdf.save(`${moodType}_Activity_Mood_Report_${moodPeriod}.pdf`);
        setGeneratingPDF(false);
      }).catch(error => {
        console.error('Error loading images:', error);
        setGeneratingPDF(false);
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      setGeneratingPDF(false);
    }
  };

  // Emotion emojis mapping
  const emotionEmojis = {
    // Positive emotions
    'calm': '😌',
    'relaxed': '😊',
    'pleased': '🙂',
    'happy': '😄',
    'excited': '🤩',
    // Negative emotions
    'bored': '😑',
    'sad': '😢',
    'disappointed': '😞',
    'angry': '😠',
    'tense': '😰'
  };

  const sortedMoods = Object.keys(currentMoodCounts).sort((a, b) => currentMoodCounts[b] - currentMoodCounts[a]);

  const IOSSwitch = styled((props) => (
    <Switch focusVisibleClassName=".Mui-focusVisible" disableRipple {...props} />
  ))(({ theme }) => ({
    width: 42,
    height: 26,
    padding: 0,
    '& .MuiSwitch-switchBase': {
      padding: 0,
      margin: 2,
      transitionDuration: '300ms',
      '&.Mui-checked': {
        transform: 'translateX(16px)',
        color: '#fff',
        '& + .MuiSwitch-track': {
          backgroundColor: '#FFFFFF',
          opacity: 1,
          border: 0,
        },
      },
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: 22,
      height: 22,
    },
    '& .MuiSwitch-track': {
      borderRadius: 26 / 2,
      backgroundColor: theme.palette.mode === 'light' ? 'rgba(255, 255, 255, 0.3)' : '#39393D',
      opacity: 1,
      transition: theme.transitions.create(['background-color'], {
        duration: 500,
      }),
    },
  }));

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="min-h-screen pb-20"
      style={{ backgroundColor: '#55AD9B' }}
    >
      <div className="max-w-4xl mx-auto pt-6 px-4">
        {/* Download PDF button */}
        <div 
          ref={pdfIconRef} 
          className="fixed top-6 right-6 z-10"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleDownloadPDF}
            disabled={generatingPDF}
            className="flex items-center text-gray-800 py-3 px-6 rounded-2xl shadow-lg transition-all duration-200 bg-white hover:bg-gray-50"
          >
            {generatingPDF ? (
              <span className="inline-block animate-pulse">Generating PDF...</span>
            ) : (
              <>
                <DownloadIcon style={{ fontSize: 20, marginRight: 8 }} />
                <span className="font-medium">Download Report</span>
              </>
            )}
          </motion.button>
        </div>

        {/* ANOVA Analysis Section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.05 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
        >
          <div className="bg-gradient-to-br from-indigo-50 via-white to-cyan-50 p-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: '#E8F5E8' }}>
                <AssessmentIcon style={{ color: '#55AD9B', fontSize: 28 }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>ANOVA Mood Analysis</h2>
                <p className="text-gray-600">Advanced statistical insights into activity impact</p>
              </div>
            </div>
            
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-3" style={{ color: '#272829' }}>What is ANOVA?</h3>
              <p className="text-gray-700 leading-relaxed mb-4">
                <strong>Analysis of Variance (ANOVA)</strong> is a statistical method that helps us understand how different activities 
                affect your mood by comparing the variance in your emotional states before and after engaging in various activities.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-blue-800 mb-2">📊 How It Works</h4>
                  <p className="text-sm text-blue-700 leading-relaxed">
                    ANOVA calculates the percentage change in your mood intensity from before to after each activity, 
                    then aggregates similar activities to show their overall impact on your well-being.
                  </p>
                </div>
                
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
                  <h4 className="font-semibold text-green-800 mb-2">🎯 Why It Matters</h4>
                  <p className="text-sm text-green-700 leading-relaxed">
                    By identifying which activities consistently improve or worsen your mood, you can make informed 
                    decisions about how to spend your time for optimal mental well-being.
                  </p>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6">
                <h4 className="font-semibold text-purple-800 mb-3">🔍 What You'll Discover</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span className="text-purple-700">Top 3 mood-boosting activities per category</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span className="text-purple-700">Percentage impact of each activity on your mood</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span className="text-purple-700">Sleep quality correlation with daily mood</span>
                  </div>
                  <div className="flex items-start space-x-2">
                    <span className="text-purple-600 font-bold">•</span>
                    <span className="text-purple-700">Personalized insights and recommendations</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDailyAnovaClick}
                className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <CalendarViewDayIcon className="mr-3" style={{ fontSize: 24 }} />
                <div className="text-left">
                  <div className="font-semibold">Daily ANOVA</div>
                  <div className="text-sm opacity-90">Today's activity impact analysis</div>
                </div>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWeeklyAnovaClick}
                className="flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white py-4 px-6 rounded-2xl shadow-lg transition-all duration-200 hover:shadow-xl"
              >
                <TimelineIcon className="mr-3" style={{ fontSize: 24 }} />
                <div className="text-left">
                  <div className="font-semibold">Weekly ANOVA</div>
                  <div className="text-sm opacity-90">Weekly patterns & trends analysis</div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Detailed Statistics Navigation Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
        >
          <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50 p-8">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-3 rounded-2xl" style={{ backgroundColor: '#E8F5E8' }}>
                <InsightsIcon style={{ color: '#55AD9B', fontSize: 28 }} />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>Detailed Mood Analysis</h2>
                <p className="text-gray-600">Get comprehensive insights into your emotional patterns</p>
              </div>
            </div>
            
            <p className="text-gray-700 mb-8 leading-relaxed">
              Explore in-depth statistics about your daily and weekly mood patterns. Discover trends, 
              compare time periods, and gain valuable insights into your emotional journey.
            </p>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleDailyStatisticsClick}
                className="flex items-center justify-center bg-white border-2 border-gray-200 hover:border-blue-300 text-gray-800 py-4 px-6 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <CalendarViewDayIcon className="mr-3" style={{ color: '#55AD9B' }} />
                <div className="text-left">
                  <div className="font-semibold">Daily Statistics</div>
                  <div className="text-sm text-gray-600">Day-by-day mood insights</div>
                </div>
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleWeeklyStatisticsClick}
                className="flex items-center justify-center bg-white border-2 border-gray-200 hover:border-purple-300 text-gray-800 py-4 px-6 rounded-2xl shadow-sm transition-all duration-200 hover:shadow-md"
              >
                <DateRangeIcon className="mr-3" style={{ color: '#55AD9B' }} />
                <div className="text-left">
                  <div className="font-semibold">Weekly Statistics</div>
                  <div className="text-sm text-gray-600">Weekly patterns & trends</div>
                </div>
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Enhanced Mood Count Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-8"
        >
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: '#E8F5E8' }}>
                  <SentimentSatisfiedIcon style={{ color: '#55AD9B', fontSize: 28 }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>Mood Analysis</h2>
                  <p className="text-gray-600">Track your emotions before and after activities</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              {/* Before/After Toggle */}
              <div className="flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
                <span className="text-sm font-medium text-gray-700 mr-3">Before Activity</span>
                <IOSSwitch 
                  checked={moodType === 'after'} 
                  onChange={() => setMoodType(moodType === 'before' ? 'after' : 'before')} 
                />
                <span className="text-sm font-medium text-gray-700 ml-3">After Activity</span>
              </div>

              {/* Period Toggle */}
              <div className="flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
                <button
                  onClick={() => setMoodPeriod('daily')}
                  className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                    moodPeriod === 'daily' 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Daily
                </button>
                <button
                  onClick={() => setMoodPeriod('weekly')}
                  className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                    moodPeriod === 'weekly' 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setMoodPeriod('monthly')}
                  className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                    moodPeriod === 'monthly' 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div 
              ref={moodChartRef} 
              className="flex flex-col items-center"
            >
              <div className="relative w-80 h-80 my-6">
                {Object.keys(currentMoodCounts).length > 0 ? (
                  <Doughnut data={chartData} options={chartOptions} />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-50 rounded-full">
                    <div className="text-center">
                      <div className="text-4xl mb-2 opacity-50">😐</div>
                      <p className="text-gray-500 italic">No mood data available</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Centered Mood Legend with Color Coding - Now Clickable */}
              <div className="w-full flex justify-center mt-6">
                <div className="flex flex-wrap justify-center gap-4 max-w-5xl">
                  {sortedMoods.map((emotion, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 + index * 0.1 }}
                      className="flex flex-col items-center p-5 rounded-2xl border-2 hover:shadow-md transition-all duration-200 transform hover:scale-105 cursor-pointer"
                      style={{ 
                        backgroundColor: moodBackgroundColors[emotion.toLowerCase()] || '#F5F5F5',
                        borderColor: emotionColors[emotion.toLowerCase()] || '#95A5A6',
                        minWidth: '140px',
                        width: '140px'
                      }}
                      onClick={() => handleMoodClick(emotion)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <div className="text-4xl mb-3">
                        {emotionEmojis[emotion.toLowerCase()] || '😐'}
                      </div>
                      <p className="font-semibold text-gray-800 capitalize text-sm text-center">
                        {capitalizeText(emotion)}
                      </p>
                      <p className="font-bold text-lg mt-1" style={{ color: emotionColors[emotion.toLowerCase()] || '#95A5A6' }}>
                        {currentMoodCounts[emotion]}
                      </p>
                      <p className="text-xs text-gray-500 mt-2 text-center">Click for details</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Summary Stats */}
              {Object.keys(currentMoodCounts).length > 0 && (
                <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full max-w-2xl">
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                      {Object.values(currentMoodCounts).reduce((a, b) => a + b, 0)}
                    </div>
                    <div className="text-sm text-gray-600">Total Entries</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                      {sortedMoods[0] ? capitalizeText(sortedMoods[0]) : 'N/A'}
                    </div>
                    <div className="text-sm text-gray-600">Most Frequent</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-2xl">
                    <div className="text-2xl font-bold" style={{ color: '#55AD9B' }}>
                      {Object.keys(currentMoodCounts).length}
                    </div>
                    <div className="text-sm text-gray-600">Unique Emotions</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Enhanced Sleep Hours Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden mb-20"
        >
          <div className="p-8">
            {/* Header Section */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-2xl" style={{ backgroundColor: '#E8F5E8' }}>
                  <BedtimeIcon style={{ color: '#55AD9B', fontSize: 28 }} />
                </div>
                <div>
                  <h2 className="text-2xl font-bold" style={{ color: '#272829' }}>Sleep Analysis</h2>
                  <p className="text-gray-600">Track your sleep hours and patterns</p>
                </div>
              </div>
              
              {/* Period Toggle - Same design as mood analysis */}
              <div className="flex items-center bg-gray-50 px-4 py-2 rounded-2xl border border-gray-200">
                <button
                  onClick={() => setSleepPeriod('weekly')}
                  className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                    sleepPeriod === 'weekly' 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Weekly
                </button>
                <button
                  onClick={() => setSleepPeriod('monthly')}
                  className={`px-3 py-1 rounded-xl text-sm font-medium transition-colors ${
                    sleepPeriod === 'monthly' 
                      ? 'bg-white text-gray-800 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Monthly
                </button>
              </div>
            </div>

            <div ref={sleepChartRef} className="space-y-8">
              {/* Sleep Statistics Cards - Improved Layout */}
              {sleepAnalytics && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-2xl p-6 text-center hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-blue-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⏰</span>
                    </div>
                    <div className="text-3xl font-bold text-blue-800 mb-2">
                      {sleepAnalytics.averageHours}h
                    </div>
                    <div className="text-sm font-medium text-blue-600">Average Sleep</div>
                    <div className="text-xs text-blue-500 mt-1">
                      {sleepPeriod === 'weekly' ? 'This Week' : 'This Month'}
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-2xl p-6 text-center hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-green-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🌟</span>
                    </div>
                    <div className="text-lg font-bold text-green-800 mb-2">
                      {sleepAnalytics.bestDay}
                    </div>
                    <div className="text-sm font-medium text-green-600">Best Sleep Day</div>
                    <div className="text-xs text-green-500 mt-1">
                      {sleepAnalytics.bestDayHours}h of sleep
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                    className="bg-gradient-to-br from-orange-50 to-orange-100 border-2 border-orange-200 rounded-2xl p-6 text-center hover:shadow-md transition-all duration-200"
                  >
                    <div className="w-16 h-16 mx-auto mb-4 bg-orange-200 rounded-full flex items-center justify-center">
                      <span className="text-2xl">⚠️</span>
                    </div>
                    <div className="text-lg font-bold text-orange-800 mb-2">
                      {sleepAnalytics.worstDay}
                    </div>
                    <div className="text-sm font-medium text-orange-600">Least Sleep Day</div>
                    <div className="text-xs text-orange-500 mt-1">
                      {sleepAnalytics.worstDayHours}h of sleep
                    </div>
                  </motion.div>
                </div>
              )}

              {/* Sleep Hours Chart - Improved Container */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-purple-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <span className="mr-2">📈</span>
                    Sleep Hours Trend
                  </h3>
                  <div className="text-sm text-gray-600">
                    {sleepPeriod === 'weekly' ? 'Past 7 Days' : 'This Month'}
                  </div>
                </div>
                
                <div className="h-80 w-full rounded-xl overflow-hidden bg-white/70 backdrop-blur-sm border border-purple-200/50">
                  {sleepHoursData.length > 0 ? (
                    <Line data={sleepHoursChartData} options={sleepHoursChartOptions} />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-4xl opacity-70">😴</span>
                        </div>
                        <p className="text-gray-600 text-lg font-medium mb-2">No sleep data available</p>
                        <p className="text-gray-500 text-sm">Start logging your sleep to see insights</p>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
              
              {/* Sleep Quality Indicators - Updated for Senior High School Students */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="mr-2">🎯</span>
                  Sleep Guide for Students (Ages 14-18)
                </h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-green-50 border-2 border-green-200 rounded-2xl p-4 text-center transition-all hover:scale-105 hover:shadow-md">
                    <div className="w-12 h-12 mx-auto mb-3 bg-green-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">🌟</span>
                    </div>
                    <p className="text-sm font-semibold text-green-800 mb-1">Excellent</p>
                    <p className="text-xs font-bold text-green-700">8-10 hours</p>
                    <p className="text-xs text-green-600 mt-1">Perfect for school</p>
                    <div className="mt-2 h-2 bg-green-200 rounded-full">
                      <div className="h-full w-full bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="bg-yellow-50 border-2 border-yellow-200 rounded-2xl p-4 text-center transition-all hover:scale-105 hover:shadow-md">
                    <div className="w-12 h-12 mx-auto mb-3 bg-yellow-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">😊</span>
                    </div>
                    <p className="text-sm font-semibold text-yellow-800 mb-1">Good</p>
                    <p className="text-xs font-bold text-yellow-700">7-8 hours</p>
                    <p className="text-xs text-yellow-600 mt-1">Still manageable</p>
                    <div className="mt-2 h-2 bg-yellow-200 rounded-full">
                      <div className="h-full w-4/5 bg-yellow-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-4 text-center transition-all hover:scale-105 hover:shadow-md">
                    <div className="w-12 h-12 mx-auto mb-3 bg-orange-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">😴</span>
                    </div>
                    <p className="text-sm font-semibold text-orange-800 mb-1">Low</p>
                    <p className="text-xs font-bold text-orange-700">6-7 hours</p>
                    <p className="text-xs text-orange-600 mt-1">May affect focus</p>
                    <div className="mt-2 h-2 bg-orange-200 rounded-full">
                      <div className="h-full w-3/5 bg-orange-500 rounded-full"></div>
                    </div>
                  </div>
                  
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 text-center transition-all hover:scale-105 hover:shadow-md">
                    <div className="w-12 h-12 mx-auto mb-3 bg-red-200 rounded-full flex items-center justify-center">
                      <span className="text-xl">😰</span>
                    </div>
                    <p className="text-sm font-semibold text-red-800 mb-1">Critical</p>
                    <p className="text-xs font-bold text-red-700">&lt;6 hours</p>
                    <p className="text-xs text-red-600 mt-1">Impacts grades</p>
                    <div className="mt-2 h-2 bg-red-200 rounded-full">
                      <div className="h-full w-2/5 bg-red-500 rounded-full"></div>
                    </div>
                  </div>
                </div>
                
                {/* Student-Specific Sleep Tips */}
                <div className="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                    <span className="mr-2">💡</span>
                    Sleep Tips for Better Grades & Well-being
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-600 font-bold text-lg">📚</span>
                        <div>
                          <p className="font-semibold text-blue-800">Study Performance</p>
                          <p className="text-blue-700">8+ hours = better memory retention and focus during exams</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-600 font-bold text-lg">⏰</span>
                        <div>
                          <p className="font-semibold text-blue-800">Sleep Schedule</p>
                          <p className="text-blue-700">Try to sleep and wake up at the same time, even on weekends</p>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-600 font-bold text-lg">📱</span>
                        <div>
                          <p className="font-semibold text-blue-800">Screen Time</p>
                          <p className="text-blue-700">Put devices away 1 hour before bedtime for better sleep quality</p>
                        </div>
                      </div>
                      <div className="flex items-start space-x-2">
                        <span className="text-blue-600 font-bold text-lg">🏃‍♂️</span>
                        <div>
                          <p className="font-semibold text-blue-800">Energy & Mood</p>
                          <p className="text-blue-700">Good sleep helps manage stress and improves social interactions</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Scientific Backing Section */}
                <div className="mt-6 bg-gradient-to-r from-indigo-50 to-blue-50 border-2 border-indigo-200 rounded-2xl p-6">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-4 flex items-center">
                    <span className="mr-2">📖</span>
                    Scientific Backing
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="font-semibold text-indigo-800 mb-2">Research Sources:</p>
                      <ul className="text-indigo-700 space-y-1">
                        <li>• National Sleep Foundation (2015)</li>
                        <li>• American Academy of Sleep Medicine</li>
                        <li>• CDC Sleep & School Performance Studies</li>
                        <li>• American Academy of Pediatrics</li>
                      </ul>
                    </div>
                    <div>
                      <p className="font-semibold text-indigo-800 mb-2">Key Findings:</p>
                      <ul className="text-indigo-700 space-y-1">
                        <li>• 8-10 hours optimal for teens (14-18)</li>
                        <li>• Sleep directly impacts academic performance</li>
                        <li>• Only 15% of teens get adequate sleep</li>
                        <li>• Memory consolidation occurs during sleep</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
      
      <BottomNav value={navValue} setValue={setNavValue} />
    </motion.div>
  );
};

export default Statistics;