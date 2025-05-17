import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import 'chart.js/auto';
import { Doughnut } from 'react-chartjs-2';
import { Chart } from 'chart.js';
import moment from 'moment';
import { motion } from 'framer-motion';
import BottomNav from '../../BottomNav';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import MoodIcon from '@mui/icons-material/Mood';
import GroupIcon from '@mui/icons-material/Group';
import FitnessCenterIcon from '@mui/icons-material/FitnessCenter';
import HotelIcon from '@mui/icons-material/Hotel';
import 'jspdf-autotable';

const Correlation = () => {
  const [correlationData, setCorrelationData] = useState([]);
  const [socialData, setSocialData] = useState([]);
  const [healthStatus, setHealthStatus] = useState(null);
  const [sleepQualityData, setSleepQualityData] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        const response = await axios.get(`${import.meta.env.VITE_NODE_API}/api/weekly-correlation`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.correlationResults && response.data.recommendations) {
          const { correlationResults, recommendations } = response.data;

          const activities = correlationResults.filter(item => item.correlationActivity && !item.correlationSocial);
          const social = correlationResults.filter(item => item.correlationSocial);
          const sleepQuality = correlationResults.filter(item => item.sleepQuality);
          const health = correlationResults.find(item => item.healthStatus);

          setCorrelationData(activities);
          setSocialData(social);
          setSleepQualityData(sleepQuality);
          setHealthStatus(health ? health.healthStatus : null);
          setRecommendations(recommendations);
        } else {
          console.error('Unexpected data format:', response.data);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchData();
  }, []);

  const handleNextClick = async () => {
    const today = moment().day();
    if (today === 0) { // Sunday
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('No token found');

        await axios.post(`${import.meta.env.VITE_NODE_API}/api/recommendations`, 
          { correlationData }, 
          { headers: { Authorization: `Bearer ${token}` }}
        );
      } catch (error) {
        console.error('Error storing recommendations:', error);
      }
    }

    navigate('/recommendations', { 
      state: { 
        correlationData, 
        socialData, 
        healthStatus, 
        sleepQualityData, 
        recommendations 
      } 
    });
  };

  const generatePDF = () => {
    setGeneratingPDF(true);
    
    // Create a promise-based chart renderer for better reliability
    const createChartAsync = (data, labels, color) => {
      return new Promise((resolve) => {
        const canvas = document.createElement('canvas');
        canvas.width = 300; // Increased for higher resolution
        canvas.height = 300; // Increased for higher resolution
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
            responsive: false, // Important for consistent rendering
            maintainAspectRatio: true,
            cutout: '70%',
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false }
            },
            animation: false // Disable animations for rendering
          }
        });
        
        // Give more time for chart to render
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

    // Create all charts in parallel for better performance
    Promise.all([
      // Activity chart
      createChartAsync(
        correlationData.length > 0 ? correlationData[0].correlationValue : 0,
        [correlationData.length > 0 ? correlationData[0].correlationActivity : 'Activity', ''],
        '#64aa86'
      ),
      
      // Social chart
      createChartAsync(
        socialData.length > 0 ? socialData[0].correlationValue : 0,
        [socialData.length > 0 ? socialData[0].correlationSocial : 'Social', ''],
        '#5a9edb'
      ),
      
      // Sleep chart
      createChartAsync(
        sleepQualityData.length > 0 ? sleepQualityData[0].sleepQualityValue : 0,
        [sleepQualityData.length > 0 ? sleepQualityData[0].sleepQuality : 'Sleep', ''],
        '#a991d4'
      )
    ])
    .then(([activityChartDataUrl, socialChartDataUrl, sleepChartDataUrl]) => {
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
        
        const socialDataValue = socialData.length > 0 ? socialData[0].correlationValue : 0;
        const socialLabel = socialData.length > 0 ? socialData[0].correlationSocial : 'Social';
        
        const sleepDataValue = sleepQualityData.length > 0 ? sleepQualityData[0].sleepQualityValue : 0;
        const sleepLabel = sleepQualityData.length > 0 ? sleepQualityData[0].sleepQuality : 'Sleep';

        // Set the background color for the header
        doc.setFillColor(176, 221, 200); // #b0ddc8
        doc.rect(0, 0, pageWidth, 50, 'F');

        // Create a function to simplify image loading
        const loadImage = (src) => {
          return new Promise((resolve) => {
            if (!src) {
              resolve(null);
              return;
            }
            
            const img = new Image();
            img.crossOrigin = "Anonymous";  // This can help with CORS issues
            img.src = src;
            
            img.onload = () => resolve(img);
            img.onerror = () => {
              console.error(`Failed to load image: ${src}`);
              resolve(null);
            };
            
            // Set a timeout just in case
            setTimeout(() => resolve(null), 3000);
          });
        };

        // Load both logos
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
            
            // Add date generated
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text(`Generated on: ${moment().format('MMMM D, YYYY')}`, margin, lineY + 30);
            
            // Add charts section title
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Correlation Analysis Charts', pageWidth / 2, 80, { align: 'center' });
            
            // Add the charts if they were created successfully
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            
            // Activity chart
            if (activityChartDataUrl) {
              doc.text('Mood-Activity Correlation', 40, 100, { align: 'center' });
              doc.addImage(activityChartDataUrl, 'PNG', 10, 110, 60, 60);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(11);
              doc.text(activityLabel || 'Activity', 40, 180, { align: 'center' });
              doc.setFontSize(14);
              doc.setTextColor(100, 170, 134);
              doc.text(`${activityData}%`, 40, 175, { align: 'center' });
            }
            
            // Social chart
            if (socialChartDataUrl) {
              doc.setTextColor(33, 33, 33);
              doc.setFontSize(12);
              doc.setFont('helvetica', 'bold');
              doc.text('Mood-Social Correlation', 105, 100, { align: 'center' });
              doc.addImage(socialChartDataUrl, 'PNG', 75, 110, 60, 60);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(11);
              doc.text(socialLabel || 'Social', 105, 180, { align: 'center' });
              doc.setFontSize(14);
              doc.setTextColor(100, 170, 134);
              doc.text(`${socialDataValue}%`, 105, 175, { align: 'center' });
            }
            
            // Sleep chart
            if (sleepChartDataUrl) {
              doc.setTextColor(33, 33, 33);
              doc.setFontSize(12);
              doc.setFont('helvetica', 'bold');
              doc.text('Sleep Quality Correlation', 170, 100, { align: 'center' });
              doc.addImage(sleepChartDataUrl, 'PNG', 140, 110, 60, 60);
              doc.setFont('helvetica', 'normal');
              doc.setFontSize(11);
              doc.text(`${sleepLabel} Quality` || 'Sleep Quality', 170, 180, { align: 'center' });
              doc.setFontSize(14);
              doc.setTextColor(100, 170, 134);
              doc.text(`${sleepDataValue}%`, 170, 175, { align: 'center' });
            }
            
            // Add text summary section
            doc.setTextColor(33, 33, 33);
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Summary of Findings', margin, 205);
            
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            let yPos = 215;
            
            if (correlationData.length > 0) {
              correlationData.forEach((item, index) => {
                if (item.correlationMood && item.correlationActivity) {
                  doc.text(`· ${item.correlationMood} mood is ${item.correlationValue}% linked to ${item.correlationActivity}`, margin + 5, yPos);
                  yPos += 10;
                }
              });
            } else {
              doc.text('· No significant activity correlations found.', margin + 5, yPos);
              yPos += 10;
            }
            
            if (socialData.length > 0) {
              socialData.forEach((item, index) => {
                if (item.correlationMood) {
                  doc.text(`· ${item.correlationMood} mood is ${item.correlationValue}% linked to ${item.correlationSocial}`, margin + 5, yPos);
                  yPos += 10;
                }
              });
            } else {
              doc.text('· No significant social correlations found.', margin + 5, yPos);
              yPos += 10;
            }
            
            if (healthStatus) {
              const healthText = healthStatus === 'insufficient' 
                ? '· Health-related activities have been low this week' 
                : '· Health-related activities are normal this week';
              doc.text(healthText, margin + 5, yPos);
              yPos += 10;
            }
            
            if (sleepQualityData.length > 0) {
              sleepQualityData.forEach((item, index) => {
                if (item.sleepQuality) {
                  doc.text(`· ${item.sleepQualityValue}% of sleep this week is ${item.sleepQuality} Quality`, margin + 5, yPos);
                  yPos += 10;
                }
              });
            } else {
              doc.text('· No significant sleep quality correlations found.', margin + 5, yPos);
            }

            // Add footer
            doc.setFontSize(8);
            doc.setTextColor(100, 100, 100);
            doc.text('Generated by Mindful Map - Your Mental Wellbeing Companion', pageWidth / 2, pageHeight - 10, { align: 'center' });
            
            // Save the PDF
            doc.save('correlation_analysis_report.pdf');
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

  const getChartData = (data, label, color = '#64aa86') => ({
    labels: [label, ''],
    datasets: [{
      data: [data, 100 - data],
      backgroundColor: [color, '#e9f5f0'],
      hoverBackgroundColor: [color, '#d7ebe3'],
      borderWidth: 0,
      borderRadius: 5
    }]
  });

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    cutout: '70%',
    plugins: {
      legend: { display: false },
      tooltip: { enabled: true }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-b from-green-50 to-teal-50 min-h-screen pb-20"
    >
      <div className="max-w-4xl mx-auto pt-4 px-4">
        {/* Main analysis card */}
        <motion.div 
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6"
        >
          <div className="bg-gradient-to-r from-teal-500 to-teal-600 p-6">
            <h1 className="text-white text-2xl font-bold text-center">Correlation Analysis</h1>
            <p className="text-white text-opacity-80 text-center mt-1">
              Weekly insights based on your mood patterns
            </p>
          </div>

          <div className="p-6">
            <div className="space-y-8">
              {/* Activity correlations */}
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center">
                    <MoodIcon className="text-teal-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Activity Correlations</h2>
                </div>
                
                {correlationData.length > 0 ? (
                  correlationData.map((result, index) => (
                    <div 
                      key={index} 
                      className="bg-teal-50 border border-teal-100 rounded-lg p-4 my-2"
                    >
                      <p className="text-lg text-teal-700 font-medium">
                        Your <span className="font-bold">{result.correlationMood}</span> mood is 
                        <span className="font-bold text-xl mx-1">{result.correlationValue}%</span> 
                        linked to <span className="font-bold">{result.correlationActivity}</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No significant activity correlations found.</p>
                )}
              </div>

              {/* Social correlations */}
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <GroupIcon className="text-blue-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Social Correlations</h2>
                </div>
                
                {socialData.length > 0 ? (
                  socialData.map((result, index) => (
                    <div 
                      key={index} 
                      className="bg-blue-50 border border-blue-100 rounded-lg p-4 my-2"
                    >
                      <p className="text-lg text-blue-700 font-medium">
                        Your <span className="font-bold">{result.correlationMood}</span> mood is 
                        <span className="font-bold text-xl mx-1">{result.correlationValue}%</span> 
                        linked to <span className="font-bold">{result.correlationSocial}</span>
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No significant social correlations found.</p>
                )}
              </div>

              {/* Health status */}
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <FitnessCenterIcon className="text-purple-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Health Status</h2>
                </div>

                {healthStatus ? (
                  <div className={`${
                    healthStatus === 'insufficient' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'
                  } border rounded-lg p-4 my-2`}>
                    <p className={`text-lg font-medium ${
                      healthStatus === 'insufficient' ? 'text-red-700' : 'text-green-700'
                    }`}>
                      {healthStatus === 'insufficient' 
                        ? 'Health-related activities have been low this week' 
                        : 'Health-related activities are normal this week'}
                    </p>
                  </div>
                ) : (
                  <p className="text-gray-500 italic">No health status data available.</p>
                )}
              </div>

              {/* Sleep Quality */}
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
                    <HotelIcon className="text-indigo-600" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-800">Sleep Quality</h2>
                </div>

                {sleepQualityData.length > 0 ? (
                  sleepQualityData.map((result, index) => (
                    <div 
                      key={index} 
                      className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 my-2"
                    >
                      <p className="text-lg text-indigo-700 font-medium">
                        <span className="font-bold text-xl">{result.sleepQualityValue}%</span> 
                        of sleep this week is 
                        <span className="font-bold mx-1">{result.sleepQuality}</span> Quality
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No significant sleep quality data found.</p>
                )}
              </div>
            </div>
          </div>

          {/* Footer with PDF button */}
          <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row justify-between items-center">
            <div className="text-center md:text-left mb-4 md:mb-0">
              <p className="text-gray-600 text-sm">
                View personalized recommendations.
              </p>
            </div>
            
            <div className="flex space-x-3">
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
              
              <button
                onClick={handleNextClick}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-full shadow transition duration-200"
              >
                <span>Recommendations</span>
                <ChevronRightIcon style={{ fontSize: 20, marginLeft: 6 }} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Charts section */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-lg overflow-hidden mb-20"
        >
          <div className="p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">Visual Insights</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="flex flex-col items-center">
                <h3 className="text-gray-700 font-medium mb-3">Activity Impact</h3>
                <div className="w-48 h-48 relative">
                  <Doughnut 
                    data={getChartData(
                      correlationData[0]?.correlationValue || 0, 
                      correlationData[0]?.correlationActivity || 'Activity',
                      '#64aa86'
                    )} 
                    options={chartOptions} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-teal-700">
                      {correlationData[0]?.correlationValue || 0}%
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-600">
                  {correlationData[0]?.correlationActivity || 'No data'}
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <h3 className="text-gray-700 font-medium mb-3">Social Impact</h3>
                <div className="w-48 h-48 relative">
                  <Doughnut 
                    data={getChartData(
                      socialData[0]?.correlationValue || 0, 
                      socialData[0]?.correlationSocial || 'Social',
                      '#5a9edb'
                    )} 
                    options={chartOptions} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-blue-700">
                      {socialData[0]?.correlationValue || 0}%
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-600">
                  {socialData[0]?.correlationSocial || 'No data'}
                </p>
              </div>
              
              <div className="flex flex-col items-center">
                <h3 className="text-gray-700 font-medium mb-3">Sleep Quality</h3>
                <div className="w-48 h-48 relative">
                  <Doughnut 
                    data={getChartData(
                      sleepQualityData[0]?.sleepQualityValue || 0, 
                      sleepQualityData[0]?.sleepQuality || 'Sleep',
                      '#a991d4'
                    )} 
                    options={chartOptions} 
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-indigo-700">
                      {sleepQualityData[0]?.sleepQualityValue || 0}%
                    </span>
                  </div>
                </div>
                <p className="mt-3 text-sm font-medium text-gray-600">
                  {sleepQualityData[0]?.sleepQuality ? `${sleepQualityData[0].sleepQuality} Quality` : 'No data'}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      <BottomNav />
    </motion.div>
  );
};

export default Correlation;