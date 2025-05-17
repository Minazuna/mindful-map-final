import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import TrendingFlatIcon from '@mui/icons-material/TrendingFlat';
import HotelIcon from '@mui/icons-material/Hotel';
import MoodIcon from '@mui/icons-material/Mood';
import { motion } from 'framer-motion';
import moment from 'moment';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import BottomNav from '../../BottomNav';

const CorrelationStatistics = () => {
  const [currentWeek, setCurrentWeek] = useState(moment().startOf('isoWeek'));
  const [hasPrevWeek, setHasPrevWeek] = useState(false);
  const [hasNextWeek, setHasNextWeek] = useState(false);
  const [currentWeekData, setCurrentWeekData] = useState(null);
  const [prevWeekData, setPrevWeekData] = useState(null);
  const [moodComparison, setMoodComparison] = useState(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const fetchWeeklyData = async (weekStart, weekEnd, setData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/weekly-correlation-statistics`, {
        headers: {
          Authorization: `Bearer ${token}`
        },
        params: {
          startOfWeek: weekStart.toISOString(),
          endOfWeek: weekEnd.toISOString()
        }
      });

      setData(response.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  useEffect(() => {
    const startOfWeek = currentWeek.clone().startOf('isoWeek');
    const endOfWeek = currentWeek.clone().endOf('isoWeek');

    fetchWeeklyData(startOfWeek, endOfWeek, setCurrentWeekData);

    const prevWeekStart = currentWeek.clone().subtract(1, 'weeks').startOf('isoWeek');
    const prevWeekEnd = currentWeek.clone().subtract(1, 'weeks').endOf('isoWeek');
    fetchWeeklyData(prevWeekStart, prevWeekEnd, setPrevWeekData);

    const nextWeekStart = currentWeek.clone().add(1, 'weeks').startOf('isoWeek');
    const nextWeekEnd = currentWeek.clone().add(1, 'weeks').endOf('isoWeek');
    fetchWeeklyData(nextWeekStart, nextWeekEnd, (data) => setHasNextWeek(data.length > 0));

    fetchWeeklyData(prevWeekStart, prevWeekEnd, (data) => setHasPrevWeek(data.length > 0));
  }, [currentWeek]);

  useEffect(() => {
    if (currentWeekData && prevWeekData) {
      const compareMoods = (current, previous) => {
        const moodValues = {
          relaxed: 5,
          happy: 4,
          fine: 3,
          anxious: 2,
          sad: 1,
          angry: 0
        };

        const currentMoodValue = current && current.correlationMood ? moodValues[current.correlationMood.toLowerCase()] || 0 : 0;
        const previousMoodValue = previous && previous.correlationMood ? moodValues[previous.correlationMood.toLowerCase()] || 0 : 0;

        const percentageChange = ((currentMoodValue - previousMoodValue) / 5) * 100;
        return percentageChange;
      };

      const currentMood = currentWeekData.find(result => result.correlationMood);
      const previousMood = prevWeekData.find(result => result.correlationMood);

      if (currentMood && previousMood) {
        const moodComparisonValue = compareMoods(currentMood, previousMood);
        setMoodComparison(moodComparisonValue);
      }
    }
  }, [currentWeekData, prevWeekData]);

  const handlePrevWeek = () => {
    if (hasPrevWeek) {
      setCurrentWeek(currentWeek.clone().subtract(1, 'weeks').startOf('isoWeek'));
    }
  };

  const handleNextWeek = () => {
    if (hasNextWeek) {
      setCurrentWeek(currentWeek.clone().add(1, 'weeks').startOf('isoWeek'));
    }
  };

  const startOfWeekFormatted = currentWeek.startOf('isoWeek').format('MMMM D');
  const endOfWeekFormatted = currentWeek.clone().endOf('isoWeek').format('D, YYYY');

  const generateMonthlyReport = async () => {
    setGeneratingPDF(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }
    
      const startOfMonth = moment().startOf('month');
      const endOfMonth = moment().endOf('month');
      const weeks = [];
    
      for (let weekStart = startOfMonth.clone(); weekStart.isBefore(endOfMonth); weekStart.add(1, 'weeks')) {
        const weekEnd = weekStart.clone().endOf('isoWeek');
        weeks.push({ startOfWeek: weekStart.clone().startOf('isoWeek'), endOfWeek: weekEnd.clone().endOf('isoWeek') });
      }
    
      const monthlyData = await Promise.all(weeks.map(async ({ startOfWeek, endOfWeek }) => {
        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/weekly-correlation-statistics`, {
          headers: {
            Authorization: `Bearer ${token}`
          },
          params: {
            startOfWeek: startOfWeek.toISOString(),
            endOfWeek: endOfWeek.toISOString()
          }
        });
        return response.data;
      }));
    
      setMonthlyData(monthlyData);
    
      const compareMoods = (current, previous) => {
        const moodValues = {
          relaxed: 5,
          happy: 4,
          fine: 3,
          anxious: 2,
          sad: 1,
          angry: 0
        };
    
        const currentMoodValue = current && current.correlationMood ? moodValues[current.correlationMood.toLowerCase()] || 0 : 0;
        const previousMoodValue = previous && previous.correlationMood ? moodValues[previous.correlationMood.toLowerCase()] || 0 : 0;
    
        const percentageChange = ((currentMoodValue - previousMoodValue) / 5) * 100;
        return percentageChange;
      };
    
      const computeSleepQuality = (weekData) => {
        if (!weekData || weekData.length === 0) return 'No sleep data';
    
        const sleepQualityCount = weekData.reduce((acc, result) => {
          if (result.sleepQuality) {
            acc[result.sleepQuality] = (acc[result.sleepQuality] || 0) + 1;
          }
          return acc;
        }, {});
    
        const totalSleepLogs = Object.values(sleepQualityCount).reduce((a, b) => a + b, 0);
        if (totalSleepLogs === 0) return 'No sleep data';
    
        const topSleepQuality = Object.keys(sleepQualityCount).reduce((a, b) => sleepQualityCount[a] > sleepQualityCount[b] ? a : b);
    
        return `Most occurring sleep quality this week is ${topSleepQuality}`;
      };
    
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const logoWidth = 25;
      const logoHeight = 25;
      const lineY = 42;
    
      const tupLogo = new Image();
      const rightLogo = new Image();
      tupLogo.src = '/images/tup.png';
      rightLogo.src = '/images/logo.png';
    
      try {
        await Promise.all([
          new Promise((resolve, reject) => {
            tupLogo.onload = resolve;
            tupLogo.onerror = resolve; // Changed to resolve to handle errors gracefully
          }),
          new Promise((resolve, reject) => {
            rightLogo.onload = resolve;
            rightLogo.onerror = resolve; // Changed to resolve to handle errors gracefully
          })
        ]);
      } catch (error) {
        console.error('Error loading images:', error);
      }
    
      doc.addImage(tupLogo, 'PNG', margin, 10, logoWidth, logoHeight);
    
      const rightLogoX = pageWidth - margin - logoWidth;
      doc.addImage(rightLogo, 'PNG', rightLogoX, 10, logoWidth, logoHeight);
    
      const textStart = margin + logoWidth + 10;
      const textWidth = rightLogoX - textStart;
    
      // University name
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      const universityName = "TECHNOLOGICAL UNIVERSITY OF THE PHILIPPINES-TAGUIG";
      const universityX = textStart + (textWidth - doc.getTextWidth(universityName)) / 2 - 5;
      doc.text(universityName, universityX, 20);
    
      // Program name
      doc.setFontSize(11);
      const program = "BACHELOR OF SCIENCE IN INFORMATION TECHNOLOGY";
      const programX = textStart + (textWidth - doc.getTextWidth(program)) / 2 - 5;
      doc.text(program, programX, 27);
    
      // Address
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      const address = "Km. 14 East Service Road, Western Bicutan, Taguig City 1630, Metro Manila, Philippines";
      const addressX = textStart + (textWidth - doc.getTextWidth(address)) / 2 - 5;
      doc.text(address, addressX, 34);
    
      // Horizontal line
      doc.setLineWidth(0.6);
      doc.setDrawColor(100, 179, 138);
      doc.line(35, lineY, pageWidth - 35, lineY);
    
      // Add report title
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Monthly Correlation Statistics', margin, lineY + 20);

      // Add date generated
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Generated on: ${moment().format('MMMM D, YYYY')}`, margin, lineY + 30);
    
      const tableData = monthlyData.map((weekData, index) => {
        const weekStart = weeks[index].startOfWeek.format('MMMM D');
        const weekEnd = weeks[index].endOfWeek.format('MMMM D, YYYY');
        const weekRange = `${weekStart} - ${weekEnd}`;
    
        const moodStat = weekData.length > 0 && weekData[0].correlationMood
          ? `${weekData[0].correlationMood} mood is (${weekData[0].correlationValue}%) linked to ${weekData[0].correlationActivity}`
          : 'No mood data';
    
        const sleepQuality = computeSleepQuality(weekData);
    
        const previousWeekData = index > 0 ? monthlyData[index - 1] : null;
        const weeklyComparison = previousWeekData && weekData.length > 0 && previousWeekData.length > 0
          ? compareMoods(weekData[0], previousWeekData[0]) > 0
            ? `Mood improved by ${compareMoods(weekData[0], previousWeekData[0]).toFixed(2)}% since last week`
            : `Mood worsened by ${Math.abs(compareMoods(weekData[0], previousWeekData[0])).toFixed(2)}% since last week`
          : 'No comparison data';
    
        return [weekRange, moodStat, sleepQuality, weeklyComparison];
      });
    
      doc.autoTable({
        startY: 80, // Adjusted to bring the table lower on the page
        head: [['Week', 'Mood Statistics', 'Sleep Quality', 'Weekly Comparison']],
        body: tableData,
        styles: {
          halign: 'center'
        },
        headStyles: {
          halign: 'center'
        }
      });

      // Add footer with Mindful Map attribution
      doc.setFontSize(8);
      doc.setTextColor(100, 100, 100);
      doc.text('Generated by Mindful Map - Your Mental Wellbeing Companion', pageWidth / 2, pageHeight - 10, { align: 'center' });
    
      doc.save('monthly_correlation_statistics.pdf');
    } catch (error) {
      console.error('Error generating PDF:', error);
    } finally {
      setGeneratingPDF(false);
    }
  };

  // Helper function to get mood icon
  const getMoodIcon = (mood) => {
    switch (mood ? mood.toLowerCase() : '') {
      case 'relaxed':
        return '/images/relaxed.gif';
      case 'happy':
        return '/images/happy.gif';
      case 'fine':
        return '/images/fine.gif';
      case 'anxious':
        return '/images/anxious.gif';
      case 'sad':
        return '/images/sad.gif';
      case 'angry':
        return '/images/angry.gif';
      default:
        return '/images/fine.gif';
    }
  };

  // Helper function to get mood color
  const getMoodColor = (mood) => {
    switch (mood ? mood.toLowerCase() : '') {
      case 'relaxed': return '#64aa86';
      case 'happy': return '#f7b955';
      case 'fine': return '#5a9edb';
      case 'anxious': return '#a991d4';
      case 'sad': return '#718096';
      case 'angry': return '#e57373';
      default: return '#5a9edb';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-b from-green-50 to-teal-50 min-h-screen pb-20"
    >
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden mt-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6 relative">
          <h1 className="text-white text-2xl font-bold text-center">Correlation Statistics</h1>
          <p className="text-white text-opacity-80 text-center mt-1">
            Discover patterns and relationships in your mood data
          </p>
          
          <div className="flex justify-center items-center mt-4 relative">
            {hasPrevWeek && (
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={handlePrevWeek}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 absolute left-0"
                aria-label="Previous Week"
              >
                <ChevronLeftIcon className="text-white" />
              </motion.button>
            )}
            
            <div className="bg-white bg-opacity-20 px-6 py-2 rounded-full">
              <h2 className="text-white font-medium">{`${startOfWeekFormatted} - ${endOfWeekFormatted}`}</h2>
            </div>
            
            {hasNextWeek && (
              <motion.button
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.9 }}
                onClick={handleNextWeek}
                className="bg-white bg-opacity-20 hover:bg-opacity-30 rounded-full p-1 absolute right-0"
                aria-label="Next Week"
              >
                <ChevronRightIcon className="text-white" />
              </motion.button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-6">
          {currentWeekData ? (
            currentWeekData.length > 0 ? (
              <div className="space-y-6">
                {currentWeekData.map((result, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl shadow p-5 border border-gray-100"
                  >
                    {result.correlationMood ? (
                      <>
                        <div className="flex items-center space-x-3 mb-3">
                          <div 
                            className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${getMoodColor(result.correlationMood)}20` }}
                          >
                            <img 
                              src={getMoodIcon(result.correlationMood)} 
                              alt={result.correlationMood}
                              className="w-8 h-8 object-cover rounded-full"
                            />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Mood Correlation</h3>
                            <p className="text-sm text-gray-500">Based on your weekly logs</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between mt-2">
                          <div className="mb-4 md:mb-0">
                            <p className="text-lg">
                              Your <span className="font-semibold" style={{ color: getMoodColor(result.correlationMood) }}>
                                {result.correlationMood}
                              </span> mood is linked to:
                            </p>
                            <h4 className="text-2xl font-bold text-gray-800 mt-1">
                              {result.correlationActivity}
                            </h4>
                          </div>
                          
                          <div className="text-center md:text-right">
                            <div 
                              className="inline-block rounded-full px-6 py-3 font-semibold text-lg" 
                              style={{ backgroundColor: `${getMoodColor(result.correlationMood)}20`, color: getMoodColor(result.correlationMood) }}
                            >
                              {result.correlationValue}% correlation
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center space-x-3 mb-3">
                          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                            <HotelIcon className="text-blue-500" />
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">Sleep Quality</h3>
                            <p className="text-sm text-gray-500">Based on your weekly logs</p>
                          </div>
                        </div>
                        
                        <div className="flex flex-col md:flex-row md:items-center justify-between mt-2">
                          <div className="mb-4 md:mb-0">
                            <p className="text-lg">
                              Your sleep this week has been mainly:
                            </p>
                            <h4 className="text-2xl font-bold text-gray-800 mt-1">
                              {result.sleepQuality} Quality
                            </h4>
                          </div>
                          
                          <div className="text-center md:text-right">
                            <div className="inline-block rounded-full px-6 py-3 bg-blue-100 text-blue-600 font-semibold text-lg">
                              {result.sleepQualityValue}% of logs
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
                
                {moodComparison !== null && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: currentWeekData.length * 0.1 }}
                    className={`rounded-xl p-4 shadow flex items-center space-x-3 ${
                      moodComparison > 0 
                        ? 'bg-green-50 border border-green-100' 
                        : moodComparison < 0
                          ? 'bg-red-50 border border-red-100'
                          : 'bg-gray-50 border border-gray-100'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      moodComparison > 0 
                        ? 'bg-green-100 text-green-600' 
                        : moodComparison < 0
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-200 text-gray-600'
                    }`}>
                      {moodComparison > 0 
                        ? <TrendingUpIcon /> 
                        : moodComparison < 0
                          ? <TrendingDownIcon />
                          : <TrendingFlatIcon />
                      }
                    </div>
                    <div>
                      <h3 className={`font-medium ${
                        moodComparison > 0 
                          ? 'text-green-800' 
                          : moodComparison < 0
                            ? 'text-red-800'
                            : 'text-gray-800'
                      }`}>
                        Week-over-week comparison
                      </h3>
                      <p className={`text-lg font-semibold ${
                        moodComparison > 0 
                          ? 'text-green-600' 
                          : moodComparison < 0
                            ? 'text-red-600'
                            : 'text-gray-600'
                      }`}>
                        {moodComparison > 0 
                          ? `Mood improved by ${moodComparison.toFixed(2)}% since last week` 
                          : `Mood declined by ${Math.abs(moodComparison).toFixed(2)}% since last week`}
                      </p>
                    </div>
                  </motion.div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center">
                <MoodIcon className="mx-auto text-gray-300 text-6xl mb-4" />
                <h3 className="text-xl font-medium text-gray-700">No significant correlations found</h3>
                <p className="text-gray-500 mt-2">Try adding more mood logs to discover patterns</p>
              </div>
            )
          ) : (
            <div className="py-16 flex justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="h-16 w-16 rounded-full bg-teal-200 mb-4"></div>
                <div className="h-4 w-48 bg-teal-200 rounded mb-2"></div>
                <div className="h-4 w-36 bg-teal-100 rounded"></div>
              </div>
            </div>
          )}
        </div>
        
        {/* Footer with updated PDF button matching MoodStatistics */}
        <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center">
          <div className="text-center md:text-left mb-4 md:mb-0">
            <p className="text-gray-600 text-sm">
              These insights are based on patterns detected in your mood logs.
            </p>
            <p className="text-gray-500 text-xs mt-1">
              Download the monthly report for a comprehensive analysis.
            </p>
          </div>
          
          <button
            onClick={generateMonthlyReport}
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
      </div>
      
      <BottomNav />
    </motion.div>
  );
};

export default CorrelationStatistics;