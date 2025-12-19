import React, { useState, useEffect } from 'react';
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
  const [comparisonData, setComparisonData] = useState(null);
  const [weekInfo, setWeekInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weekOffset, setWeekOffset] = useState(0);
  const [availableOffsets, setAvailableOffsets] = useState([]);

  const categories = [
    { key: 'activity', name: 'Activity', color: '#3B82F6' },
    { key: 'social', name: 'Social', color: '#10B981' },
    { key: 'health', name: 'Health', color: '#F59E0B' },
    { key: 'sleep', name: 'Sleep', color: '#8B5CF6' }
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
      
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/admin/available-weeks`, {
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
      
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/admin/prediction-comparisons?weekOffset=${weekOffset}`, {
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

      const responseText = await response.text();
      console.log('Response text:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        throw new Error('Invalid JSON response from server');
      }
      
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

  const calculatePredictions = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/admin/calculate-predictions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Calculate predictions error:', errorText);
        throw new Error(`Failed to calculate predictions: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      alert(result.message);
      fetchComparisonData(); // Refresh data after calculation
    } catch (err) {
      console.error('Calculate predictions error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const updateActualMoods = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      const response = await fetch(`${import.meta.env.VITE_NODE_API}/api/admin/update-actual-moods`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Update actual moods error:', errorText);
        throw new Error(`Failed to update actual moods: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      alert(result.message);
      fetchComparisonData(); // Refresh data after update
    } catch (err) {
      console.error('Update actual moods error:', err);
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const createComparisonChart = (category) => {
    if (!comparisonData || !comparisonData[category.key]) return null;

    const data = comparisonData[category.key];
    
    const chartData = {
      labels: data.days,
      datasets: [
        {
          label: 'Matches',
          data: data.matches,
          backgroundColor: '#10B981',
          borderColor: '#059669',
          borderWidth: 2,
        },
        {
          label: 'Not Matches',
          data: data.notMatches,
          backgroundColor: '#EF4444',
          borderColor: '#DC2626',
          borderWidth: 2,
        }
      ]
    };

    const options = {
      responsive: true,
      interaction: {
        mode: 'index',
        intersect: false,
      },
      plugins: {
        title: {
          display: true,
          text: `${category.name} - Prediction Match Analysis`,
          font: { size: 16, weight: 'bold' }
        },
        legend: {
          position: 'top',
        },
        tooltip: {
          callbacks: {
            label: function(context) {
              const datasetLabel = context.dataset.label;
              const value = context.parsed.y;
              const dayIndex = context.dataIndex;
              const totalPredictions = data.matches[dayIndex] + data.notMatches[dayIndex];
              const percentage = totalPredictions > 0 ? ((value / totalPredictions) * 100).toFixed(1) : 0;
              return `${datasetLabel}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Days of Week'
          }
        },
        y: {
          type: 'linear',
          display: true,
          beginAtZero: true,
          title: {
            display: true,
            text: 'Number of Users'
          }
        }
      },
    };

    return <Bar data={chartData} options={options} />;
  };

  const createMoodDistributionChart = (category) => {
    if (!comparisonData || !comparisonData[category.key]) return null;

    const data = comparisonData[category.key];
    const predictedCounts = {};
    const actualCounts = {};

    // Flatten all predicted moods from all days and count occurrences
    data.predictedMoods.flat().forEach(mood => {
      if (mood && mood !== 'No data' && mood !== 'No valid data') {
        predictedCounts[mood] = (predictedCounts[mood] || 0) + 1;
      }
    });

    // Flatten all actual moods from all days and count occurrences
    data.actualMoods.flat().forEach(mood => {
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
      plugins: {
        title: {
          display: true,
          text: `${category.name} - Mood Distribution`,
          font: { size: 14, weight: 'bold' }
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
            text: 'Frequency'
          }
        },
        x: {
          title: {
            display: true,
            text: 'Mood Types'
          }
        }
      }
    };

    return <Bar data={chartData} options={options} />;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading comparison data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Mood Prediction Comparison
              </h1>
              {weekInfo && (
                <p className="text-gray-600 mt-2">
                  Week {weekInfo.weekNumber}, {weekInfo.year} | 
                  Total Users: {weekInfo.totalUsers} |
                  {weekOffset === 0 ? ' Current Week' : ` ${weekOffset} week(s) ago`}
                </p>
              )}
            </div>
            <div className="flex space-x-4">
              <button
                onClick={calculatePredictions}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                disabled={loading}
              >
                Calculate Predictions
              </button>
              <button
                onClick={updateActualMoods}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                disabled={loading}
              >
                Update Actual Moods
              </button>
            </div>
          </div>

          {/* Week Navigation */}
          <div className="flex items-center space-x-4">
            <label className="text-gray-700 font-medium">Select Week:</label>
            <select
              value={weekOffset}
              onChange={(e) => setWeekOffset(parseInt(e.target.value))}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              <p className="text-sm text-gray-500">
                Available weeks: {availableOffsets.length} of 5
              </p>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
            <p className="text-sm mt-2">
              Make sure the backend server is running on http://localhost:5000 and that you have calculated predictions first.
            </p>
          </div>
        )}

        {!comparisonData && !loading && !error && (
          <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
            <p className="font-semibold">No Data Available</p>
            <p>No prediction data found for the selected week. Please click "Calculate Predictions" to generate prediction data first.</p>
          </div>
        )}

        {comparisonData && (
          <div className="space-y-8">
            {/* Main Comparison Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categories.map(category => (
                <div key={category.key} className="bg-white rounded-lg shadow-md p-6">
                  {createComparisonChart(category)}
                </div>
              ))}
            </div>

            {/* Mood Distribution Charts */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Mood Distribution by Category</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {categories.map(category => (
                  <div key={`dist-${category.key}`} className="border border-gray-200 rounded-lg p-4">
                    {createMoodDistributionChart(category)}
                  </div>
                ))}
              </div>
            </div>


          </div>
        )}
      </div>
    </div>
  );
};

export default PredictionComparison;