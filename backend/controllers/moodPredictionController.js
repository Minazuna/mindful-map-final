const fetch = require('node-fetch');
const MoodLog = require('../models/MoodLog');

exports.predictMood = async (req, res) => {
    try {
        console.log("User ID from request:", req.user._id); 

        // Get the user's mood logs from the database
        const moodLogs = await MoodLog.find({ 
            user: req.user._id,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).select('mood moodScore date activities -_id');

        console.log("Retrieved mood logs:", moodLogs);

        if (moodLogs.length < 7) {
            return res.status(200).json({
                success: true,
                predictions: {},
                message: 'Need at least one week of mood data for predictions'
            });
        }

        // Format logs for the Python service
        const formattedLogs = moodLogs.map(log => ({
            mood: log.mood.toLowerCase(),
            moodScore: log.moodScore,
            timestamp: log.date.toISOString(),
            activities: Array.isArray(log.activities) ? log.activities : []
        }));

        console.log("Formatted logs for Python service:", formattedLogs);

        // Forward the request to the Python service
        const pythonApiUrl = process.env.PYTHON_API_URL || 'https://mindful-map-backend-python.onrender.com';
        const token = req.headers.authorization;
        
        // Instead of making a direct API call to the Python service, 
        // we'll just forward the user's token so the Python service can fetch the logs itself
        const pythonResponse = await fetch(`${pythonApiUrl}/api/predict-mood`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });

        const pythonData = await pythonResponse.json();
        console.log("Python service response:", pythonData);

        if (!pythonData.success) {
            return res.status(500).json({
                success: false,
                message: 'Error generating mood predictions',
                error: pythonData.message
            });
        }

        res.json({
            success: true,
            predictions: pythonData.predictions,
            insights: pythonData.insights
        });

    } catch (error) {
        console.error('Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating predictions',
            error: error.message
        });
    }
};

exports.getMoodLogs = async (req, res) => {
    try {
        const moodLogs = await MoodLog.find({ 
            user: req.user._id,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).select('mood moodScore date activities -_id');

        return res.status(200).json({
            success: true,
            logs: moodLogs.map(log => ({
                mood: log.mood,
                moodScore: log.moodScore, 
                date: log.date.toISOString(),
                activities: Array.isArray(log.activities) ? log.activities : []
            }))
        });
    } catch (error) {
        console.error('Error fetching mood logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching mood logs',
            error: error.message
        });
    }
};

exports.getMoodLogsForCategory = async (req, res) => {
    try {
        const moodLogs = await MoodLog.find({ 
            user: req.user._id,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
        }).select('category activity hrs afterEmotion afterValence afterIntensity afterReason date -_id');

        return res.status(200).json({
            success: true,
            logs: moodLogs.map(log => ({
                category: log.category,
                activity: log.activity,
                hrs: log.hrs,
                afterEmotion: log.afterEmotion,
                afterValence: log.afterValence,
                afterIntensity: log.afterIntensity,
                afterReason: log.afterReason,
                timestamp: log.date.toISOString()
            }))
        });
    } catch (error) {
        console.error('Error fetching category mood logs:', error);
        return res.status(500).json({
            success: false,
            message: 'Error fetching category mood logs',
            error: error.message
        });
    }
};

exports.predictCategoryMood = async (req, res) => {
    try {
        const { category } = req.query;
        
        if (!category || !['activity', 'social', 'health', 'sleep'].includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or missing category parameter'
            });
        }

        // Forward the request to the Python service
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5001';
        const token = req.headers.authorization;
        
        const pythonResponse = await fetch(`${pythonApiUrl}/api/predict-category-mood?category=${category}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });

        const pythonData = await pythonResponse.json();
        console.log("Python service response:", pythonData);

        if (!pythonData.success) {
            return res.status(pythonResponse.status).json({
                success: false,
                message: pythonData.message
            });
        }

        res.json({
            success: true,
            category: pythonData.category,
            predictions: pythonData.predictions,
            dateRange: pythonData.date_range
        });

    } catch (error) {
        console.error('Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while generating category predictions',
            error: error.message
        });
    }
};

exports.checkCategoryData = async (req, res) => {
    try {
        // Forward the request to the Python service
        const pythonApiUrl = process.env.PYTHON_API_URL || 'http://localhost:5001';
        const token = req.headers.authorization;
        
        const pythonResponse = await fetch(`${pythonApiUrl}/api/check-category-data`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': token
            }
        });

        const pythonData = await pythonResponse.json();
        console.log("Python service response:", pythonData);

        if (!pythonData.success) {
            return res.status(pythonResponse.status).json({
                success: false,
                message: pythonData.message
            });
        }

        res.json({
            success: true,
            availability: pythonData.availability
        });

    } catch (error) {
        console.error('Controller Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error while checking category data',
            error: error.message
        });
    }
};

exports.getUserPredictionComparison = async (req, res) => {
    try {
        const { weekOffset = 0 } = req.query;
        const userId = req.user._id;

        // Calculate target week dates
        const targetDate = new Date();
        targetDate.setDate(targetDate.getDate() - (weekOffset * 7));
        
        const year = targetDate.getFullYear();
        const getWeekNumber = (date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        };
        const weekNumber = getWeekNumber(targetDate);

        // Get user's prediction data for the specified week
        const PredictedMood = require('../models/PredictedMood');
        const userPrediction = await PredictedMood.findOne({
            user: userId,
            year: year,
            weekNumber: weekNumber
        });

        if (!userPrediction) {
            return res.status(404).json({
                success: false,
                message: 'No prediction data found for this week'
            });
        }

        // Process data for comparison charts
        const categories = ['activity', 'social', 'health', 'sleep'];
        const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const comparisonData = {};

        categories.forEach(category => {
            comparisonData[category] = {
                days: daysOfWeek,
                predicted: [],
                actual: [],
                probability: []
            };

            daysOfWeek.forEach(day => {
                const dayData = userPrediction.predictions[category][day];
                const predicted = dayData?.predictedMood || 'No data';
                const actual = dayData?.actualMood || 'No data';
                
                // Calculate probability from allMoodProbabilities based on actual mood
                let probability = 0;
                
                // Calculate probability from allMoodProbabilities based on actual mood or predicted mood
                if (dayData?.allMoodProbabilities && Object.keys(dayData.allMoodProbabilities).length > 0) {
                    let moodToLookup = null;
                    
                    if (actual && actual !== 'No data' && actual !== 'no data') {
                        moodToLookup = actual.toLowerCase();
                    } else if (predicted && predicted !== 'No data' && predicted !== 'No data available' && predicted !== 'no data available') {
                        moodToLookup = predicted.toLowerCase();
                    }
                    
                    if (moodToLookup) {
                        // The allMoodProbabilities keys are now lowercase
                        probability = dayData.allMoodProbabilities[moodToLookup] || 0;
                    }
                } else {
                    // Fallback: if no allMoodProbabilities available (old data), 
                    // show a default value or regenerate predictions
                    console.log(`Warning: No allMoodProbabilities found for ${category} ${day}. This might be old prediction data.`);
                    probability = 0;
                }
                
                comparisonData[category].predicted.push(predicted);
                comparisonData[category].actual.push(actual);
                comparisonData[category].probability.push(probability);
            });
        });

        res.status(200).json({
            success: true,
            data: comparisonData,
            weekInfo: {
                year: year,
                weekNumber: weekNumber,
                weekOffset: weekOffset,
                userId: userId
            }
        });

    } catch (error) {
        console.error('Error getting user prediction comparison:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

exports.getUserAvailableWeeks = async (req, res) => {
    try {
        const userId = req.user._id;
        const PredictedMood = require('../models/PredictedMood');
        
        const getWeekNumber = (date) => {
            const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
            const dayNum = d.getUTCDay() || 7;
            d.setUTCDate(d.getUTCDate() + 4 - dayNum);
            const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
            return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        };

        // Calculate which weekOffsets have data for this specific user
        const currentDate = new Date();
        const availableOffsets = [];
        
        // Check offsets 0-4 (current week to 4 weeks ago)
        for (let offset = 0; offset <= 4; offset++) {
            const targetDate = new Date();
            targetDate.setDate(targetDate.getDate() - (offset * 7));
            
            const year = targetDate.getFullYear();
            const weekNumber = getWeekNumber(targetDate);
            
            // Check if data exists for this specific user and week
            const dataExists = await PredictedMood.exists({
                user: userId,
                year: year,
                weekNumber: weekNumber
            });
            
            if (dataExists) {
                availableOffsets.push(offset);
            }
        }
        
        res.status(200).json({
            success: true,
            availableOffsets: availableOffsets
        });
    } catch (error) {
        console.error('Error getting user available weeks:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Server Error', 
            error: error.message 
        });
    }
};

// Internal function to get mood logs for any user (for admin use)
exports.getMoodLogsForUser = async (userId) => {
    try {
        const moodLogs = await MoodLog.find({ 
            user: userId,
            date: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } // Last 30 days
        }).select('category activity hrs afterEmotion afterValence afterIntensity afterReason date -_id');

        return moodLogs.map(log => ({
            category: log.category,
            activity: log.activity,
            hrs: log.hrs,
            afterEmotion: log.afterEmotion,
            afterValence: log.afterValence,
            afterIntensity: log.afterIntensity,
            afterReason: log.afterReason,
            timestamp: log.date.toISOString()
        }));
    } catch (error) {
        console.error('Error fetching mood logs for user:', error);
        throw error;
    }
};