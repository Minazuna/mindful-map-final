import React, { useState, useEffect, useRef } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import axios from 'axios';
import moment from 'moment';
import BottomNav from '../../BottomNav';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import DownloadIcon from '@mui/icons-material/Download';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';

// Register Chart.js components
ChartJS.register(ArcElement, Tooltip, Legend);

const MoodStatistics = () => {
  const { mood } = useParams();
  const location = useLocation();
  const [activityData, setActivityData] = useState([]);
  const [socialData, setSocialData] = useState([]);
  const [healthData, setHealthData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('monthly');
  const [generatingPDF, setGeneratingPDF] = useState(false);
  
  const chartsRef = useRef(null);

  const moodIcons = {
    relaxed: '/images/relaxed.gif',
    happy: '/images/happy.gif',
    fine: '/images/fine.gif',
    anxious: '/images/anxious.gif',
    sad: '/images/sad.gif',
    angry: '/images/angry.gif'
  };

  const moodColors = {
    relaxed: '#64aa86',
    happy: '#f7b955',
    fine: '#5a9edb',
    anxious: '#a991d4',
    sad: '#718096',
    angry: '#e57373'
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
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

        // Determine the period from the query parameter
        const queryParams = new URLSearchParams(location.search);
        const periodParam = queryParams.get('period') || 'monthly';
        setPeriod(periodParam);

        // Calculate activity percentages for the selected mood
        const startOfPeriod = moment().startOf('month');
        const endOfPeriod = moment().endOf('month');

        const periodLogs = data.filter(log => {
          const logDate = moment(log.date);
          return logDate.isBetween(startOfPeriod, endOfPeriod, null, '[]') && log.mood.toLowerCase() === mood.toLowerCase();
        });

        const activityCountMap = {};
        const socialCountMap = {};
        const healthCountMap = {};

        periodLogs.forEach(log => {
          log.activities.forEach(activity => {
            if (activityCategories.activities.includes(activity.toLowerCase())) {
              if (!activityCountMap[activity]) {
                activityCountMap[activity] = 0;
              }
              activityCountMap[activity]++;
            }
          });

          log.social.forEach(social => {
            if (activityCategories.social.includes(social.toLowerCase())) {
              if (!socialCountMap[social]) {
                socialCountMap[social] = 0;
              }
              socialCountMap[social]++;
            }
          });

          log.health.forEach(health => {
            if (activityCategories.health.includes(health.toLowerCase())) {
              if (!healthCountMap[health]) {
                healthCountMap[health] = 0;
              }
              healthCountMap[health]++;
            }
          });
        });

        const totalActivities = Object.values(activityCountMap).reduce((a, b) => a + b, 0);
        const totalSocial = Object.values(socialCountMap).reduce((a, b) => a + b, 0);
        const totalHealth = Object.values(healthCountMap).reduce((a, b) => a + b, 0);

        const activityPercentages = Object.keys(activityCountMap).map(activity => ({
          activity,
          percentage: ((activityCountMap[activity] / totalActivities) * 100).toFixed(1),
          count: activityCountMap[activity]
        }));

        const socialPercentages = Object.keys(socialCountMap).map(social => ({
          social,
          percentage: ((socialCountMap[social] / totalSocial) * 100).toFixed(1),
          count: socialCountMap[social]
        }));

        const healthPercentages = Object.keys(healthCountMap).map(health => ({
          health,
          percentage: ((healthCountMap[health] / totalHealth) * 100).toFixed(1),
          count: healthCountMap[health]
        }));

        // Sort by percentage from greatest to lowest
        activityPercentages.sort((a, b) => b.percentage - a.percentage);
        socialPercentages.sort((a, b) => b.percentage - a.percentage);
        healthPercentages.sort((a, b) => b.percentage - a.percentage);

        setActivityData(activityPercentages);
        setSocialData(socialPercentages);
        setHealthData(healthPercentages);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [mood, location.search]);

  const activityIcons = {
    studying: '/images/studying.gif',
    work: '/images/work.gif',
    exam: '/images/exam.gif',
    gaming: '/images/gaming.gif',
    drinking: '/images/drinking.gif',
    relax: '/images/relax.gif',
    movie: '/images/movie.gif',
    music: '/images/music.gif',
    reading: '/images/reading.gif',
    family: '/images/family.gif',
    friends: '/images/friends.gif',
    relationship: '/images/relationship.gif',
    colleagues: '/images/colleagues.gif',
    pets: '/images/pets.gif',
    exercise: '/images/exercise.gif',
    walk: '/images/walk.gif',
    run: '/images/run.gif',
    eatHealthy: '/images/eat healthy.gif',
  };

  const activityCategories = {
    activities: ['studying', 'work', 'exam', 'gaming', 'drinking', 'relax', 'movie', 'music', 'reading'],
    social: ['family', 'friends', 'relationship', 'colleagues', 'pets'],
    health: ['exercise', 'walk', 'run', 'eat healthy']
  };
  
  // Generate chart colors - in pastel hues
  const generateChartColors = (count) => {
    const baseColors = [
      '#64aa86', '#5a9edb', '#f7b955', '#a991d4', '#e57373', 
      '#4fc3f7', '#81c784', '#ffb74d', '#ba68c8', '#f06292',
      '#9575cd', '#7986cb', '#4db6ac', '#aed581', '#ffd54f'
    ];
    
    return baseColors.slice(0, count);
  };

  // Prepare chart data
  const prepareChartData = (data, labelKey) => {
    if (!data || data.length === 0) return null;
    
    const labels = data.map(item => item[labelKey].charAt(0).toUpperCase() + item[labelKey].slice(1));
    const values = data.map(item => parseFloat(item.percentage));
    const colors = generateChartColors(data.length);
    
    return {
      labels,
      datasets: [{
        data: values,
        backgroundColor: colors,
        borderColor: colors.map(color => color.replace(')', ', 1)').replace('rgb', 'rgba')),
        borderWidth: 1,
      }]
    };
  };

  const chartOptions = {
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: {
          usePointStyle: true,
          padding: 15,
          font: {
            size: 11
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `${context.label}: ${context.raw}%`;
          }
        }
      }
    },
    maintainAspectRatio: false
  };

  const activityChartData = prepareChartData(activityData, 'activity');
  const socialChartData = prepareChartData(socialData, 'social');
  const healthChartData = prepareChartData(healthData, 'health');

  const renderActivity = (activity, index) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      key={index} 
      className="bg-white rounded-lg shadow-sm p-3 m-2 flex flex-col items-center hover:shadow-md transition-shadow duration-300"
      style={{ width: '100px' }}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden mb-2">
        <img 
          src={activityIcons[activity.activity.toLowerCase()] || '/images/default.gif'} 
          alt={activity.activity} 
          className="w-full h-full object-cover"
        />
      </div>
      <p className="font-medium text-gray-800 text-sm text-center truncate w-full">
        {activity.activity.charAt(0).toUpperCase() + activity.activity.slice(1)}
      </p>
      <span className="text-sm font-bold text-teal-600 bg-teal-50 px-2 py-0.5 rounded-full mt-1">
        {activity.percentage}%
      </span>
    </motion.div>
  );

  const renderSocial = (social, index) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      key={index} 
      className="bg-white rounded-lg shadow-sm p-3 m-2 flex flex-col items-center hover:shadow-md transition-shadow duration-300"
      style={{ width: '100px' }}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden mb-2">
        <img 
          src={activityIcons[social.social.toLowerCase()] || '/images/default.gif'} 
          alt={social.social} 
          className="w-full h-full object-cover"
        />
      </div>
      <p className="font-medium text-gray-800 text-sm text-center truncate w-full">
        {social.social.charAt(0).toUpperCase() + social.social.slice(1)}
      </p>
      <span className="text-sm font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full mt-1">
        {social.percentage}%
      </span>
    </motion.div>
  );

  const renderHealth = (health, index) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      key={index} 
      className="bg-white rounded-lg shadow-sm p-3 m-2 flex flex-col items-center hover:shadow-md transition-shadow duration-300"
      style={{ width: '100px' }}
    >
      <div className="w-12 h-12 rounded-full overflow-hidden mb-2">
        <img 
          src={activityIcons[health.health.toLowerCase()] || '/images/default.gif'}
          alt={health.health} 
          className="w-full h-full object-cover"
        />
      </div>
      <p className="font-medium text-gray-800 text-sm text-center truncate w-full">
        {health.health.charAt(0).toUpperCase() + health.health.slice(1)}
      </p>
      <span className="text-sm font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full mt-1">
        {health.percentage}%
      </span>
    </motion.div>
  );

  const renderCategory = (title, data, renderFunction, chartData) => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
      <div className="bg-gradient-to-r from-teal-500 to-teal-600 py-3 px-5 flex justify-between items-center">
        <h3 className="text-white font-bold text-lg">{title}</h3>
      </div>
      
      <div className="p-4">
        <div className="flex flex-col lg:flex-row">
          <div className="lg:w-1/2 flex flex-wrap justify-start">
            {data.map((item, index) => renderFunction(item, index))}
          </div>
          
          <div className="lg:w-1/2 mt-4 lg:mt-0 flex items-center justify-center">
            <div className="h-64 w-full max-w-xs">
              {chartData && chartData.datasets[0].data.length > 0 ? (
                <Pie data={chartData} options={chartOptions} />
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-400 italic">No data available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

 // Function to generate PDF
const generatePDF = async () => {
  if (!chartsRef.current) return;
  
  setGeneratingPDF(true);
  
  try {
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    
    // Add title and date
    pdf.setFillColor(moodColors[mood.toLowerCase()] || '#64aa86');
    pdf.rect(0, 0, pageWidth, 30, 'F');
    
    // Add logos to header
    try {
      // Load the TUP logo on the left
      const tupLogo = new Image();
      tupLogo.src = '/images/tup.png';
      await new Promise((resolve) => {
        tupLogo.onload = resolve;
        tupLogo.onerror = resolve; // Continue even if error
      });
      pdf.addImage(tupLogo, 'PNG', 10, 5, 20, 20);
      
      // Load the app logo on the right
      const appLogo = new Image();
      appLogo.src = '/images/logo.png';
      await new Promise((resolve) => {
        appLogo.onload = resolve;
        appLogo.onerror = resolve; // Continue even if error
      });
      pdf.addImage(appLogo, 'PNG', pageWidth - 30, 5, 20, 20);
    } catch (logoError) {
      console.error('Error adding logos:', logoError);
      // Continue without logos if they fail to load
    }
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(18);
    pdf.text(`${mood.charAt(0).toUpperCase() + mood.slice(1)} Mood Analysis`, pageWidth / 2, 15, { align: 'center' });
    
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(11);
    pdf.text(`Generated on ${moment().format('MMMM D, YYYY')}`, pageWidth / 2, 22, { align: 'center' });
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(12);
    pdf.text('This report shows the activities, social interactions, and health habits associated with your mood.', 20, 40);
    
    // Capture each chart section
    const canvas = await html2canvas(chartsRef.current, {
      scale: 2,
      useCORS: true,
      logging: false
    });
    
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = pageWidth - 40;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, 'PNG', 20, 50, imgWidth, imgHeight);
    
    // Add footer
    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text('Generated by Mindful Map - Your Mental Wellbeing Companion', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
    // Save the PDF
    pdf.save(`${mood}-mood-statistics.pdf`);
  } catch (error) {
    console.error('Error generating PDF:', error);
  } finally {
    setGeneratingPDF(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-20 h-20 rounded-full bg-teal-200 mb-4"></div>
          <div className="h-4 w-32 bg-teal-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Hero section with mood */}
      <div 
        className="w-full py-8 px-4 text-center"
        style={{ backgroundColor: moodColors[mood.toLowerCase()] || '#64aa86' }}
      >
        <div className="flex justify-center">
          <img 
            src={moodIcons[mood.toLowerCase()]} 
            alt={mood}
            className="w-20 h-20 rounded-full border-4 border-white shadow-md"
          />
        </div>
        <h1 className="text-white text-3xl font-bold mt-3">
          {mood.charAt(0).toUpperCase() + mood.slice(1)} Days
        </h1>
      </div>

      <div className="max-w-5xl mx-auto p-4 mt-6">
        <div className="flex justify-between items-center mb-6">
          <p className="text-gray-600 text-center">
            Here's what activities you were doing when you felt <span className="font-semibold">{mood.toLowerCase()}</span> this month.
          </p>
          
          <button
            onClick={generatePDF}
            disabled={generatingPDF}
            className="flex items-center bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-full shadow transition duration-200"
          >
            {generatingPDF ? (
              <span className="inline-block animate-pulse">Generating PDF...</span>
            ) : (
              <>
                <PictureAsPdfIcon style={{ fontSize: 20, marginRight: 6 }} />
                <span>Download PDF Report</span>
              </>
            )}
          </button>
        </div>
        
        <div ref={chartsRef}>
          {renderCategory('Activities', activityData, renderActivity, activityChartData)}
          {renderCategory('Social Interactions', socialData, renderSocial, socialChartData)}
          {renderCategory('Health & Wellness', healthData, renderHealth, healthChartData)}
        </div>
        
        {activityData.length === 0 && socialData.length === 0 && healthData.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <p className="text-gray-500">No data available for this mood in the selected time period.</p>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default MoodStatistics;