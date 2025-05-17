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
import AssessmentIcon from '@mui/icons-material/Assessment';
import BedtimeIcon from '@mui/icons-material/Bedtime';
import SentimentSatisfiedIcon from '@mui/icons-material/SentimentSatisfied';
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
  const [sleepQualityData, setSleepQualityData] = useState([]);
  const [moodPeriod, setMoodPeriod] = useState('monthly');
  const [sleepPeriod, setSleepPeriod] = useState('monthly');
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
          startOfPeriod = moment().startOf('isoWeek'); // Monday
          endOfPeriod = moment().endOf('isoWeek'); // Sunday
        } else {
          startOfPeriod = moment().startOf('month');
          endOfPeriod = moment().endOf('month');
        }

        const periodLogs = data.filter(log => {
          const logDate = moment(log.date);
          return logDate.isBetween(startOfPeriod, endOfPeriod, null, '[]');
        });

        const moodCountMap = {};

        periodLogs.forEach(log => {
          const { mood } = log;
          if (!moodCountMap[mood]) {
            moodCountMap[mood] = 0;
          }
          moodCountMap[mood]++;
        });

        setMoodCounts(moodCountMap);
      } catch (error) {
        console.error('Error fetching mood data:', error);
      }
    };

    fetchMoodData();
  }, [moodPeriod]); // Re-fetch mood data when the mood period changes

  useEffect(() => {
    const fetchSleepData = async () => {
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

        // Calculate sleep quality based on the selected period
        let startOfPeriod, endOfPeriod;
        if (sleepPeriod === 'weekly') {
          startOfPeriod = moment().startOf('isoWeek'); // Monday
          endOfPeriod = moment().endOf('isoWeek'); // Sunday
        } else {
          startOfPeriod = moment().startOf('month');
          endOfPeriod = moment().endOf('month');
        }

        const periodLogs = data.filter(log => {
          const logDate = moment(log.date);
          return logDate.isBetween(startOfPeriod, endOfPeriod, null, '[]');
        });

        const sleepQualityMap = {};

        periodLogs.forEach(log => {
          const { sleepQuality } = log;
          if (!sleepQualityMap[log.date]) {
            sleepQualityMap[log.date] = [];
          }
          sleepQualityMap[log.date].push(sleepQuality);
        });

        const sleepQualityNumeric = {
          'No Sleep': 1,
          'Poor Sleep': 2,
          'Medium Sleep': 3,
          'Good Sleep': 4
        };

        const sleepQualityData = Object.keys(sleepQualityMap).map(date => {
          const avgSleepQuality = sleepQualityMap[date].reduce((acc, quality) => acc + sleepQualityNumeric[quality], 0) / sleepQualityMap[date].length;
          return { date, avgSleepQuality };
        });

        setSleepQualityData(sleepQualityData);
      } catch (error) {
        console.error('Error fetching sleep data:', error);
      }
    };

    fetchSleepData();
  }, [sleepPeriod]); // Re-fetch sleep data when the sleep period changes

  const moodColors = {
    relaxed: '#67b88f',
    happy: '#5dc791',
    fine: '#68d076',
    anxious: '#ebe153',
    sad: '#f7a046',
    angry: '#f75646'
  };

  const chartData = {
    labels: Object.keys(moodCounts),
    datasets: [
      {
        data: Object.values(moodCounts),
        backgroundColor: Object.keys(moodCounts).map(mood => moodColors[mood.toLowerCase()]),
        hoverBackgroundColor: Object.keys(moodCounts).map(mood => moodColors[mood.toLowerCase()]),
        borderWidth: 1,
        borderColor: '#fff',
        hoverBorderColor: '#fff'
      }
    ]
  };

  const chartOptions = {
    cutout: '50%',
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.raw || 0;
            const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
            const percentage = ((value / total) * 100).toFixed(2);
            return `${label}: ${value} (${percentage}%)`;
          }
        }
      },
      datalabels: {
        color: '#fff',
        formatter: (value, context) => {
          const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
          const percentage = ((value / total) * 100).toFixed(2);
          return `${percentage}%`;
        }
      }
    }
  };

  const sleepQualityChartData = {
    labels: sleepQualityData.map(data => moment(data.date).format('MMM D')),
    datasets: [
      {
        data: sleepQualityData.map(data => data.avgSleepQuality),
        borderColor: '#6fba94',
        backgroundColor: 'rgba(111, 186, 148, 0.2)',
        fill: true,
        tension: 0.4, // Makes the line smoother
        pointBackgroundColor: '#6fba94',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const sleepQualityChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        titleColor: '#333',
        bodyColor: '#333',
        borderColor: '#6fba94',
        borderWidth: 1,
        cornerRadius: 8,
        displayColors: false
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 5,
        ticks: {
          stepSize: 1,
          callback: function (value) {
            const sleepQualityLabels = ['', 'No Sleep', 'Poor Sleep', 'Medium Sleep', 'Good Sleep', ''];
            return sleepQualityLabels[value];
          },
          font: {
            family: "'Inter', sans-serif",
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          maxRotation: 45,
          minRotation: 45,
          font: {
            family: "'Inter', sans-serif",
            size: 10
          }
        }
      }
    }
  };

  const handleViewClick = () => {
    navigate('/correlation');
  };

  const handleWeeklyStatisticsClick = () => {
    navigate('/correlation-statistics');
  };

  const handleMoodClick = (mood) => {
    navigate(`/mood-statistics/${mood}?period=${moodPeriod}`);
  };

  const handleDownloadPDF = async () => {
    setGeneratingPDF(true);
    
    const moodInput = moodChartRef.current;
    const sleepInput = sleepChartRef.current;
    const pdfIcon = pdfIconRef.current;
    pdfIcon.style.display = 'none'; // Hide the PDF icon before capturing the screenshot
  
    try {
      const moodCanvas = await html2canvas(moodInput, { scale: 4 });
      const sleepCanvas = await html2canvas(sleepInput, { scale: 1 });
    
      pdfIcon.style.display = 'block'; // Show the PDF icon again after capturing the screenshot
    
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
      const lineY = 42;  // Adjusted line position
      
      const tupLogo = new Image();
      const rightLogo = new Image();
      tupLogo.src = '/images/tup.png';
      rightLogo.src = '/images/logo.png';
      
      Promise.all([
        new Promise((resolve) => {
          tupLogo.onload = resolve;
          tupLogo.onerror = resolve; // Continue even if image fails to load
        }),
        new Promise((resolve) => {
          rightLogo.onload = resolve;
          rightLogo.onerror = resolve; // Continue even if image fails to load
        })
      ]).then(() => {
        // Add logos if they loaded successfully
        if (tupLogo.complete) {
          pdf.addImage(tupLogo, 'PNG', margin, 10, logoWidth, logoHeight);
        }
        
        if (rightLogo.complete) {
          const rightLogoX = pageWidth - margin - logoWidth;
          pdf.addImage(rightLogo, 'PNG', rightLogoX, 10, logoWidth, logoHeight);
        }
        
        const textStart = margin + logoWidth + 10;
        const textWidth = pageWidth - margin - logoWidth - textStart;
        
        // University name 
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'bold');
        const universityName = "TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES-TAGUIG";
        const universityX = textStart + (textWidth - pdf.getTextWidth(universityName)) / 2 - 5;
        pdf.text(universityName, universityX, 20);
        
        // Program name
        pdf.setFontSize(11);
        const program = "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY";
        const programX = textStart + (textWidth - pdf.getTextWidth(program)) / 2 - 5;
        pdf.text(program, programX, 27);
        
        // Address
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        const address = "Km. 14 East Service Road, Western Bicutan, Taguig City 1630, Metro Manila, Philippines";
        const addressX = textStart + (textWidth - pdf.getTextWidth(address)) / 2 - 5;
        pdf.text(address, addressX, 34);
        
        // Horizontal line
        pdf.setLineWidth(0.6);
        pdf.setDrawColor(100, 179, 138);  
        pdf.line(35, lineY, pageWidth - 35, lineY);
        
        // Add report title with background
        pdf.setFillColor(100, 179, 138, 0.8);
        pdf.roundedRect(margin, lineY + 10, pageWidth - (margin * 2), 15, 3, 3, 'F');
        
        pdf.setFontSize(11);
        pdf.setFont('helvetica', 'normal');
        pdf.setTextColor(255, 255, 255);
        const dateText = `Generated on: ${moment().format('MMMM D, YYYY')}`;
        pdf.text(dateText, pageWidth / 2, lineY + 19, { align: 'center' });
        
        pdf.setTextColor(33, 33, 33);
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Mood and Sleep Quality Report', pageWidth / 2, lineY + 40, { align: 'center' });
        
        // Add mood chart
        pdf.addImage(moodImgData, 'PNG', centerX, 70, imgWidth, moodImgHeight);
    
        // Add sleep quality chart
        pdf.addImage(sleepImgData, 'PNG', centerX, 70 + moodImgHeight + 20, imgWidth, sleepImgHeight);
    
        pdf.save(`Mood_and_Sleep_Quality_${moodPeriod}.pdf`);
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

  const moodIcons = {
    relaxed: '/images/relaxed.gif',
    happy: '/images/happy.gif',
    fine: '/images/fine.gif',
    anxious: '/images/anxious.gif',
    sad: '/images/sad.gif',
    angry: '/images/angry.gif'
  };

  const sortedMoods = Object.keys(moodCounts).sort((a, b) => moodCounts[b] - moodCounts[a]);

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
          backgroundColor: theme.palette.mode === 'dark' ? '#2ECA45' : '#65C466',
          opacity: 1,
          border: 0,
        },
        
        '&.Mui-disabled + .MuiSwitch-track': {
          opacity: 0.5,
        },
      },
      '&.Mui-focusVisible .MuiSwitch-thumb': {
        color: '#33cf4d',
        border: '6px solid #fff',
      },
      '&.Mui-disabled .MuiSwitch-thumb': {
        color:
          theme.palette.mode === 'light'
            ? theme.palette.grey[100]
            : theme.palette.grey[600],
      },
      '&.Mui-disabled + .MuiSwitch-track': {
        opacity: theme.palette.mode === 'light' ? 0.7 : 0.3,
      },
    },
    '& .MuiSwitch-thumb': {
      boxSizing: 'border-box',
      width: 22,
      height: 22,
    },
    '& .MuiSwitch-track': {
      borderRadius: 26 / 2,
      backgroundColor: theme.palette.mode === 'light' ? '#E9E9EA' : '#39393D',
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
      className="bg-gradient-to-b from-green-50 to-teal-50 min-h-screen pb-20"
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
            className="flex items-center bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-full shadow transition duration-200"
          >
            {generatingPDF ? (
              <span className="inline-block animate-pulse">Generating PDF...</span>
            ) : (
              <>
                <DownloadIcon style={{ fontSize: 20, marginRight: 6 }} />
                <span>Download PDF Report</span>
              </>
            )}
          </motion.button>
        </div>

        {/* Correlation Analysis Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6">
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-10 h-10 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <AssessmentIcon className="text-white" />
              </div>
              <h2 className="text-white text-2xl font-bold">Correlation Analysis</h2>
            </div>
            <p className="text-white text-opacity-80 ml-13 pl-1">
              Understand how your activities impact your mood patterns
            </p>
          </div>

          <div className="p-6">
            <p className="text-gray-600 mb-6">
              Dive deeper into the connections between your activities, social interactions, 
              and mood changes to better understand your emotional patterns.
            </p>
            <div className="flex flex-col sm:flex-row justify-center space-y-3 sm:space-y-0 sm:space-x-4">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleViewClick}
                className="flex items-center justify-center bg-teal-600 hover:bg-teal-700 text-white py-3 px-6 rounded-full shadow transition-colors"
              >
                <BarChartIcon className="mr-2" />
                View Correlations
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleWeeklyStatisticsClick}
                className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-full shadow transition-colors"
              >
                <AssessmentIcon className="mr-2" />
                Detailed Statistics
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Mood Count Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                  <SentimentSatisfiedIcon className="text-teal-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Mood Count</h2>
                  <p className="text-gray-500 text-sm">Click on mood to view related activities</p>
                </div>
              </div>
              
              <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-gray-700 mr-2">Weekly</span>
                <IOSSwitch 
                  checked={moodPeriod === 'monthly'} 
                  onChange={() => setMoodPeriod(moodPeriod === 'weekly' ? 'monthly' : 'weekly')} 
                />
                <span className="text-sm font-medium text-gray-700 ml-2">Monthly</span>
              </div>
            </div>

<div 
  ref={moodChartRef} 
  className="flex flex-col items-center"
>
  <div className="relative w-64 h-64 my-4">
    {Object.keys(moodCounts).length > 0 ? (
      <Doughnut data={chartData} options={chartOptions} />
    ) : (
      <div className="absolute inset-0 flex items-center justify-center">
        <p className="text-gray-500 italic">No mood data available</p>
      </div>
    )}
  </div>

  <div className="w-full flex justify-center mt-4">
    <div className="inline-grid grid-cols-3 sm:grid-cols-4 gap-4">
      {sortedMoods.map((mood, index) => (
        <motion.div
          key={index}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMoodClick(mood)}
          className="flex flex-col items-center cursor-pointer p-2 rounded-lg hover:bg-teal-50"
        >
          <div className="relative w-14 h-14 mb-2 overflow-hidden rounded-full border-2" style={{ borderColor: moodColors[mood.toLowerCase()] }}>
            <img 
              src={moodIcons[mood.toLowerCase()]} 
              alt={mood} 
              className="w-full h-full object-cover"
            />
          </div>
          <p className="font-medium text-gray-800">{mood.charAt(0).toUpperCase() + mood.slice(1)}</p>
          <p className="font-bold text-lg text-teal-600">{moodCounts[mood]}</p>
        </motion.div>
      ))}
    </div>
  </div>
</div>
          </div>
        </motion.div>

        {/* Sleep Quality Card */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-20"
        >
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                  <BedtimeIcon className="text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Sleep Quality</h2>
                  <p className="text-gray-500 text-sm">Track your sleep patterns over time</p>
                </div>
              </div>
              
              <div className="flex items-center bg-gray-50 px-3 py-1 rounded-full">
                <span className="text-sm font-medium text-gray-700 mr-2">Weekly</span>
                <IOSSwitch 
                  checked={sleepPeriod === 'monthly'} 
                  onChange={() => setSleepPeriod(sleepPeriod === 'weekly' ? 'monthly' : 'weekly')} 
                />
                <span className="text-sm font-medium text-gray-700 ml-2">Monthly</span>
              </div>
            </div>

            <div 
              ref={sleepChartRef} 
              className="mt-6"
            >
              <div className="h-64 w-full">
                {sleepQualityData.length > 0 ? (
                  <Line data={sleepQualityChartData} options={sleepQualityChartOptions} />
                ) : (
                  <div className="h-full flex items-center justify-center bg-gray-50 rounded-lg">
                    <p className="text-gray-500 italic">No sleep data available</p>
                  </div>
                )}
              </div>
              
              <div className="mt-4 grid grid-cols-4 gap-2 text-center">
                <div className="bg-red-50 border border-red-100 rounded-lg py-2">
                  <p className="text-xs text-gray-500">No Sleep</p>
                  <p className="font-semibold text-red-700">1</p>
                </div>
                <div className="bg-orange-50 border border-orange-100 rounded-lg py-2">
                  <p className="text-xs text-gray-500">Poor Sleep</p>
                  <p className="font-semibold text-orange-700">2</p>
                </div>
                <div className="bg-yellow-50 border border-yellow-100 rounded-lg py-2">
                  <p className="text-xs text-gray-500">Medium Sleep</p>
                  <p className="font-semibold text-yellow-700">3</p>
                </div>
                <div className="bg-green-50 border border-green-100 rounded-lg py-2">
                  <p className="text-xs text-gray-500">Good Sleep</p>
                  <p className="font-semibold text-green-700">4</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      <BottomNav value={navValue} setValue={setNavValue} />
    </motion.div>
  );
};

export default Statistics;