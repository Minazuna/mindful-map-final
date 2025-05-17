import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import ArrowCircleRightIcon from '@mui/icons-material/ArrowCircleRight';
import AccessTimeFilledIcon from '@mui/icons-material/AccessTimeFilled';
import ChecklistIcon from '@mui/icons-material/Checklist';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { jsPDF } from 'jspdf';
import { Chart } from 'chart.js';
import moment from 'moment';
import BottomNav from '../../BottomNav';

const Recommendations = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { correlationData, sleepQualityData, recommendations: initialRecommendations } = location.state;
  const [recommendations, setRecommendations] = useState(initialRecommendations || []);
  const [correlatedMood, setCorrelatedMood] = useState('');
  const [generatingPDF, setGeneratingPDF] = useState(false);

  useEffect(() => {
    if (!initialRecommendations || initialRecommendations.length === 0) {
      const fetchRecommendations = async () => {
        try {
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No token found');
          }

          const response = await axios.post(
            `${import.meta.env.VITE_NODE_API}/api/recommendations`, 
            { correlationData: [...correlationData, ...sleepQualityData] }, 
            { headers: { Authorization: `Bearer ${token}` }}
          );

          setRecommendations(response.data);

          // Extract the correlated mood
          const moodResult = correlationData.find(result => result.correlationMood);
          if (moodResult) {
            setCorrelatedMood(moodResult.correlationMood);
          }
        } catch (error) {
          console.error('Error fetching recommendations:', error);
        }
      };

      fetchRecommendations();
    } else {
      // Extract the correlated mood
      const moodResult = correlationData.find(result => result.correlationMood);
      if (moodResult) {
        setCorrelatedMood(moodResult.correlationMood);
      }
    }
  }, [correlationData, sleepQualityData, initialRecommendations]);

  const handleBreathingExerciseClick = () => {
    navigate('/breathing-exercise');
  };

  const handlePomodoroClick = () => {
    navigate('/pomodoro');
  };

  const handleListTaskClick = () => {
    navigate('/list-task');
  };

  const handleBackToStatistics = () => {
    navigate('/correlation');
  };

  const generatePDF = () => {
    setGeneratingPDF(true);

    const createChartAsync = (data, labels, color) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 300;
        canvas.height = 300;
        const ctx = canvas.getContext('2d');
        
        const chart = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: labels,
            datasets: [{
              data: [data, 100 - data],
              backgroundColor: [color || '#64aa86', '#e9f5f0'],
              hoverBackgroundColor: [color || '#4a8e6c', '#d7ebe3'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: false,
            maintainAspectRatio: true,
            cutout: '70%',
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false }
            },
            animation: false
          }
        });
        
        setTimeout(() => {
          try {
            const dataUrl = canvas.toDataURL('image/png', 1.0);
            resolve(dataUrl);
          } catch (e) {
            console.error("Error converting chart to image:", e);
            resolve(null);
          }
        }, 200);
      });
    };

    Promise.all([
      // Activity chart
      createChartAsync(
        correlationData.length > 0 ? correlationData[0].correlationValue : 0,
        [correlationData.length > 0 ? correlationData[0].correlationActivity : 'Activity', ''],
        '#64aa86'
      ),
      
      // Sleep chart
      createChartAsync(
        sleepQualityData.length > 0 ? sleepQualityData[0].sleepQualityValue : 0,
        [sleepQualityData.length > 0 ? sleepQualityData[0].sleepQuality : 'Sleep', ''],
        '#a991d4'
      )
    ])
    .then(([activityChartDataUrl, sleepChartDataUrl]) => {
      try {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15;
        const logoWidth = 25;
        const logoHeight = 25;
        const lineY = 42;
        
        // Get data values and labels
        const activityData = correlationData.length > 0 ? correlationData[0].correlationValue : 0;
        const activityLabel = correlationData.length > 0 ? correlationData[0].correlationActivity : 'Activity';
        
        const sleepDataValue = sleepQualityData.length > 0 ? sleepQualityData[0].sleepQualityValue : 0;
        const sleepLabel = sleepQualityData.length > 0 ? sleepQualityData[0].sleepQuality : 'Sleep';

        // Set the background color for the header
        doc.setFillColor(176, 221, 200); // #b0ddc8
        doc.rect(0, 0, pageWidth, 50, 'F');

        const loadImage = (src) => {
          return new Promise((resolve) => {
            if (!src) {
              resolve(null);
              return;
            }
            
            const img = new Image();
            img.crossOrigin = "Anonymous";
            img.src = src;
            
            img.onload = () => resolve(img);
            img.onerror = () => {
              console.error(`Failed to load image: ${src}`);
              resolve(null);
            };
            
            setTimeout(() => resolve(null), 3000);
          });
        };

        Promise.all([
          loadImage('/images/tup.png'),
          loadImage('/images/logo.png')
        ])
        .then(([tupLogo, rightLogo]) => {
          try {
            // Add logos if they loaded successfully
            if (tupLogo) {
              doc.addImage(tupLogo, 'PNG', margin, 10, logoWidth, logoHeight);
            }
            
            if (rightLogo) {
              const rightLogoX = pageWidth - margin - logoWidth;
              doc.addImage(rightLogo, 'PNG', rightLogoX, 10, logoWidth, logoHeight);
            }
            
            const textStart = margin + logoWidth + 10;
            const textWidth = pageWidth - margin - logoWidth - textStart;

            // University name 
            doc.setFontSize(11);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(33, 33, 33);
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
            
            // Add report title with background accent
            doc.setFillColor(100, 179, 138, 0.8);
            doc.roundedRect(margin, lineY + 10, pageWidth - (margin * 2), 15, 3, 3, 'F');
            
            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(255, 255, 255);
            const dateText = `Generated on: ${moment().format('MMMM D, YYYY')}`;
            doc.text(dateText, pageWidth / 2, lineY + 19, { align: 'center' });
            
            doc.setTextColor(33, 33, 33);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('Recommendations Based on Your Patterns', pageWidth / 2, lineY + 40, { align: 'center' });
            
            // Add mood connection text
            doc.setFontSize(12);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            const moodText = `Your habits are strongly linked to feeling ${correlatedMood}.`;
            doc.text(moodText, pageWidth / 2, lineY + 50, { align: 'center' });
            
            // Add the charts if they were created successfully
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(33, 33, 33);
            
            // Activity chart
            if (activityChartDataUrl) {
              doc.text('Mood-Activity Correlation', pageWidth / 2 - 50, 105, { align: 'center' });
              doc.addImage(activityChartDataUrl, 'PNG', pageWidth / 4 - 30, 110, 60, 60);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(11);
              doc.text(activityLabel || 'Activity', pageWidth / 2 - 50, 180, { align: 'center' });
              doc.setFontSize(14);
              doc.setTextColor(100, 170, 134);
              doc.text(`${activityData}%`, pageWidth / 2 - 50, 175, { align: 'center' });
            }
            
            // Sleep chart
            if (sleepChartDataUrl) {
              doc.setTextColor(33, 33, 33);
              doc.setFontSize(12);
              doc.setFont('helvetica', 'bold');
              doc.text('Sleep Quality Correlation', pageWidth / 2 + 50, 105, { align: 'center' });
              doc.addImage(sleepChartDataUrl, 'PNG', 3 * pageWidth / 4 - 30, 110, 60, 60);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(11);
              doc.text(`${sleepLabel} Quality` || 'Sleep Quality', pageWidth / 2 + 50, 180, { align: 'center' });
              doc.setFontSize(14);
              doc.setTextColor(100, 170, 134);
              doc.text(`${sleepDataValue}%`, pageWidth / 2 + 50, 175, { align: 'center' });
            }
            
            // Add recommendations section
            doc.setTextColor(33, 33, 33);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            
            // Add recommendations background
            doc.setFillColor(245, 247, 250);
            doc.roundedRect(margin, 195, pageWidth - (margin * 2), 70, 3, 3, 'F');
            
            doc.text('Recommended Strategies', pageWidth / 2, 205, { align: 'center' });
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            
            let yPos = 215;
            recommendations.forEach((recommendation, index) => {
              if (index < 5) { // Limit to 5 recommendations to fit on page
                doc.text(`• ${recommendation}`, margin + 5, yPos);
                yPos += 10;
              }
            });
            
            // Add footer
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Generated by Mindful Map - Your Mental Wellbeing Companion', pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            doc.save('personalized_recommendations.pdf');
          } catch (error) {
            console.error('Error creating PDF document:', error);
          }
        })
        .catch(error => {
          console.error('Error loading images:', error);
        })
        .finally(() => {
          setGeneratingPDF(false);
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        setGeneratingPDF(false);
      }
    })
    .catch(error => {
      console.error('Error creating charts:', error);
      setGeneratingPDF(false);
    });
  };

  const getRecommendationIcon = (recommendation) => {
    const text = recommendation.toLowerCase();
    if (text.includes('breathing') || text.includes('breath')) {
      return {
        icon: <ArrowCircleRightIcon className="text-teal-600 text-xl" />,
        handler: handleBreathingExerciseClick,
        label: 'Try Breathing Exercise'
      };
    } else if (text.includes('pomodoro') || text.includes('timer') || text.includes('breaks')) {
      return {
        icon: <AccessTimeFilledIcon className="text-teal-600 text-xl" />,
        handler: handlePomodoroClick,
        label: 'Use Pomodoro Timer'
      };
    } else if (text.includes('list') || text.includes('tasks') || text.includes('schedule')) {
      return {
        icon: <ChecklistIcon className="text-teal-600 text-xl" />,
        handler: handleListTaskClick,
        label: 'Create Task List'
      };
    }
    return null;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-b from-green-50 to-teal-50 min-h-screen pb-20"
    >
      <div className="max-w-4xl mx-auto pt-4 px-4">
        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6">
            <h1 className="text-white text-2xl font-bold text-center">Personalized Recommendations</h1>
            <p className="text-white text-opacity-80 text-center mt-1">
              Strategies tailored to your mood patterns and wellness needs
            </p>
          </div>

          <div className="p-6">
            <div className="mb-6 text-center">
              <div className="inline-flex items-center px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm">
                <LightbulbIcon className="mr-1 text-yellow-500" fontSize="small" />
                Your habits are strongly linked to feeling <span className="font-semibold mx-1">{correlatedMood}</span>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              {recommendations.map((rec, index) => {
                const actionItem = getRecommendationIcon(rec);
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-teal-50 border border-teal-100 rounded-lg p-4"
                  >
                    <div className="flex justify-between items-center">
                      <p className="text-gray-800 font-medium text-lg">{rec}</p>
                      {actionItem && (
                        <button
                          onClick={actionItem.handler}
                          className="ml-3 flex items-center text-sm bg-teal-500 text-white px-3 py-1 rounded-full hover:bg-teal-600 transition-colors"
                        >
                          {actionItem.icon}
                          <span className="ml-1">{actionItem.label}</span>
                        </button>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {recommendations.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <p className="text-gray-500 italic">
                  No recommendations available. Please check back later.
                </p>
              </div>
            )}
          </div>

          {/* Footer with buttons */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-600 text-sm">
                Follow these recommendations to improve your wellbeing.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleBackToStatistics}
                className="flex items-center bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-full shadow transition duration-200"
              >
                <ChevronLeftIcon style={{ fontSize: 20, marginRight: 6 }} />
                <span>Back to Statistics</span>
              </button>
              
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
          </div>
        </motion.div>
      </div>
      
      <BottomNav />
    </motion.div>
  );
};

export default Recommendations;