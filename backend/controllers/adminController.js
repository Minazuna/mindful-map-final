const User = require('../models/User');
const Prompt = require('../models/Prompt');
const MoodLog = require('../models/MoodLog');
const Forum = require('../models/Forum'); 
const CorrelationValue = require('../models/CorrelationValue'); 
const Journal = require('../models/Journal');
const PredictedMood = require('../models/PredictedMood');
const jwt = require("jsonwebtoken");
const mongoose = require('mongoose');
const moment = require('moment');
const { 
  initiateUserDeactivation,
  initiateUserBulkDeactivation,
  processExpiredGracePeriods, 
  reactivateUser 
} = require("../utils/accountService");
const admin = require('../config/firebaseConfig');

exports.dashboard = (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Welcome to the Admin Dashboard',
  });
};

exports.getMonthlyUsers = async (req, res) => {
  try {
    const currentYear = new Date().getFullYear();

    const users = await User.aggregate([
      {
        $addFields: {
          createdAt: {
            $ifNull: ['$createdAt', new Date(`${currentYear}-01-01`)], 
          },
        },
      },

      {
        $match: {
          createdAt: {
            $gte: new Date(`${currentYear}-01-01`),
            $lt: new Date(`${currentYear + 1}-01-01`),
          },
        },
      },
      // Group by month
      {
        $group: {
          _id: { $month: '$createdAt' },
          count: { $sum: 1 },
        },
      },
      // Sort by month
      {
        $sort: { _id: 1 },
      },
    ]);

    const monthlyUserData = users.map(user => ({
      month: new Date(0, user._id - 1).toLocaleString('default', { month: 'long' }),
      count: user.count,
    }));

    res.status(200).json(monthlyUserData);
  } catch (error) {
    console.error('Error fetching monthly users:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getActiveUsers = async (req, res) => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const activeUsers = await MoodLog.aggregate([
      {
        $match: {
          date: {
            $gte: twoWeeksAgo,
          },
        },
      },
      {
        $group: {
          _id: '$user',
          lastLogDate: { $max: '$date' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      {
        $unwind: '$user',
      },
      {
        $project: {
          _id: 0,
          userId: '$_id',
          email: '$user.email',
          name: '$user.name',
          lastLogDate: 1,
        },
      },
    ]);

    res.status(200).json(activeUsers);
  } catch (error) {
    console.error('Error fetching active users:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getInactiveUsers = async (req, res) => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    // Find users who haven't logged a mood in the past 2 weeks
    const activeUsers = await MoodLog.aggregate([
      {
        $match: {
          date: { $gte: twoWeeksAgo },
        },
      },
      {
        $group: {
          _id: "$user",
        },
      },
    ]);

    const activeUserIds = activeUsers.map(user => user._id.toString());

    // Find users who are either inactive or deactivated
    const inactiveUsers = await User.find({
      $and: [
        { role: 'user' },
        {
          $or: [
            { _id: { $nin: activeUserIds } },
            { isDeactivated: true },
            { pendingDeactivation: true },
            { lastLogin: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } }
          ]
        }
      ]
    }).select('name email avatar isDeactivated createdAt deactivatedAt pendingDeactivation hasRequestedReactivation deactivateAt');

    const formattedUsers = inactiveUsers.map(user => ({
      id: user._id,
      name: user.name || "User",
      email: user.email,
      avatar: user.avatar || "",
      isDeactivated: user.isDeactivated,
      deactivatedAt: user.deactivatedAt ? user.deactivatedAt.toISOString() : null,
      createdAt: user.createdAt ? user.createdAt.toISOString() : null,
      deactivateAt: user.deactivatedAt ? user.deactivatedAt.toISOString() : null,
      pendingDeactivation: user.pendingDeactivation || false,
      hasRequestedReactivation: user.hasRequestedReactivation || false
    }));

    res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Error fetching inactive users:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getUsers = async (req, res) => {
  try {
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

    const activeUsers = await MoodLog.aggregate([
      {
        $match: {
          date: { $gte: twoWeeksAgo },
        },
      },
      {
        $group: {
          _id: "$user",
        },
      },
    ]);

    const activeUserIds = activeUsers.map(user => user._id.toString());

    const users = await User.find({ role: 'user' }).select('firstName lastName email avatar section isDeactivated pendingDeactivation createdAt deactivatedAt deactivateAt');

    const usersWithStatus = users.map(user => ({
      id: user._id,
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'No Name',
      email: user.email,
      avatar: user.avatar,
      section: user.section || 'Not Assigned',
      isDeactivated: user.isDeactivated,
      pendingDeactivation: user.pendingDeactivation || false,
      createdAt: user.createdAt.toISOString(),
      deactivatedAt: user.deactivatedAt ? user.deactivatedAt.toISOString() : null,
      deactivateAt: user.deactivateAt ? user.deactivateAt.toISOString() : null,
      status: activeUserIds.includes(user._id.toString()) ? 'Active' : 'Inactive',
    }));

    res.json(usersWithStatus);
  } catch (error) {
    res.status(500).json({ message: "Error fetching users", error });
  }
};

exports.getUserMoodLogs = async (req, res) => {
  try {
    const userId = req.params.userId;
    
    // Validate that userId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID format" });
    }
    
    // Find mood logs for the specified user
    const moodLogs = await MoodLog.find({ user: userId })
      .sort({ date: -1 }) // Sort by date, newest first
      .select('date category activity hrs beforeValence beforeEmotion beforeIntensity beforeReason afterValence afterEmotion afterIntensity afterReason');
    
    res.json(moodLogs);
  } catch (error) {
    console.error("Error fetching user mood logs:", error);
    res.status(500).json({ message: "Error fetching mood logs", error: error.message });
  }
};

exports.softDelete = async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await initiateUserDeactivation(userId);
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error deactivating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.checkExpiredGracePeriods = async (req, res) => {
  try {
    const result = await processExpiredGracePeriods();
    res.json(result);
  } catch (error) {
    console.error("Error checking expired grace periods:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.reactivate = async (req, res) => {
  try {
    const { userId } = req.body;
    const result = await reactivateUser(userId);
    
    if (!result) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(result);
  } catch (error) {
    console.error("Error reactivating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.bulkDelete = async (req, res) => {
  try {
    const { ids } = req.body;
    
    const result = await initiateUserBulkDeactivation(ids);
    
    if (result.error) {
      return res.status(400).json({ message: result.error });
    }
    
    res.json({ 
      message: `${result.modifiedCount} users have been marked for deactivation with a 24-hour grace period`,
      deactivateAt: result.deactivateAt
    });
  } catch (error) {
    console.error("Error in bulk soft delete:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getAllPrompts = async (req, res) => {
  try {
    const prompts = await Prompt.find().populate("createdBy", "name email");
    res.json(prompts);
  } catch (error) {
    res.status(500).json({ message: "Error fetching prompts", error });
  }
};

exports.addPrompt = async (req, res) => {
  try {
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ message: "Question is required" });
    }
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Unauthorized: No user found" });
    }

    const newPrompt = await Prompt.create({ 
      question, 
      createdBy: req.user.id 
    });

    res.status(201).json(newPrompt);
  } catch (error) {
    console.error("Error adding prompt:", error);if (error.code === 11000) {

      return res.status(400).json({
        message: "This prompt already exists!",
        code: 11000,
      });
    }

    res.status(500).json({ message: "Error adding prompt", error: error.message });
  }
};

exports.deletePrompt = async (req, res) => {
  try {
    const { id } = req.params;
    await Prompt.findByIdAndDelete(id);
    res.status(200).json({ message: "Prompt deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting prompt", error });
  }
};

exports.getDailyForumEngagement = async (req, res) => {
  try {
    const dailyEngagement = await Forum.aggregate([
      { $unwind: "$discussions" },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$discussions.createdAt" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const dailyEngagementData = dailyEngagement.map(data => ({
      date: data._id,
      count: data.count,
    }));

    res.status(200).json(dailyEngagementData);
  } catch (error) {
    console.error('Error fetching daily forum engagement:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// New function to get weekly forum engagement
exports.getWeeklyForumEngagement = async (req, res) => {
  try {
    const weeklyEngagement = await Forum.aggregate([
      { $unwind: "$discussions" },
      {
        $group: {
          _id: { $isoWeek: "$discussions.createdAt" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const weeklyEngagementData = weeklyEngagement.map(data => ({
      week: data._id,
      count: data.count,
    }));

    res.status(200).json(weeklyEngagementData);
  } catch (error) {
    console.error('Error fetching weekly forum engagement:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};



exports.getDailyMoodLogs = async (req, res) => {
  try {
    const dailyMoodLogs = await MoodLog.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const dailyMoodLogsData = dailyMoodLogs.map(data => ({
      date: data._id,
      count: data.count,
    }));

    res.status(200).json(dailyMoodLogsData);
  } catch (error) {
    console.error('Error fetching daily mood logs:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getDailyJournalLogs = async (req, res) => {
  try {
    const dailyJournalLogs = await Journal.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    const dailyJournalLogsData = dailyJournalLogs.map(data => ({
      date: data._id,
      count: data.count,
    }));

    res.status(200).json(dailyJournalLogsData);
  } catch (error) {
    console.error('Error fetching daily journal logs:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getCorrelationValues = async (req, res) => {
  try {
    const correlationValues = await CorrelationValue.find().populate('user', 'name email');
    res.status(200).json(correlationValues);
  } catch (error) {
    console.error('Error fetching correlation values:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getWeeklyCorrelationValues = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token found' });
    }

    const weeklyCorrelationValues = await CorrelationValue.aggregate([
      {
        $group: {
          _id: {
            week: { $week: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 }
      }
    ]);

    const formattedData = weeklyCorrelationValues.map(item => {
      const startOfWeek = moment().year(item._id.year).week(item._id.week).startOf('week').format('MM-DD-YY');
      const endOfWeek = moment().year(item._id.year).week(item._id.week).endOf('week').format('MM-DD-YY');
      return {
        week: `${startOfWeek} to ${endOfWeek}`,
        count: item.count
      };
    });
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching weekly correlation values:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getWeeklyForumPosts = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token found' });
    }

    const weeklyForumPosts = await Forum.aggregate([
      {
        $group: {
          _id: {
            week: { $week: "$createdAt" },
            year: { $year: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      {
        $sort: { "_id.year": 1, "_id.week": 1 }
      }
    ]);

    const formattedData = weeklyForumPosts.map(item => {
      const startOfWeek = moment().year(item._id.year).week(item._id.week).startOf('week').format('MM-DD-YY');
      const endOfWeek = moment().year(item._id.year).week(item._id.week).endOf('week').format('MM-DD-YY');
      return {
        week: `${startOfWeek} to ${endOfWeek}`,
        count: item.count
      };
    });
    res.status(200).json(formattedData);
  } catch (error) {
    console.error('Error fetching weekly forum posts:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.getActiveVsInactiveUsers = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    if (!token) {
      return res.status(401).json({ message: 'No token found' });
    }

    const twoWeeksAgo = moment().subtract(2, 'weeks').toDate();

    // Find all users who have mood logs in the past two weeks
    const activeUsers = await MoodLog.distinct('user', { date: { $gte: twoWeeksAgo } });

    // Find the total number of users
    const totalUsers = await User.countDocuments();

    // Calculate the number of inactive users
    const inactiveUsersCount = totalUsers - activeUsers.length - 1;
    const data = {
      active: activeUsers.length,
      inactive: inactiveUsersCount
    };

    res.status(200).json(data);
  } catch (error) {
    console.error('Error fetching active vs inactive users:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Teacher Management Functions

exports.getAllTeachers = async (req, res) => {
  try {
    const teachers = await User.find({ role: 'teacher' })
      .select('firstName lastName middleInitial email assignedSections subject avatar createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: teachers,
      count: teachers.length
    });
  } catch (error) {
    console.error('Error fetching teachers:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.createTeacher = async (req, res) => {
  try {
    const { firstName, lastName, middleInitial, email, assignedSections, subject, password } = req.body;

    // Validation
    if (!firstName || !lastName || !email || !assignedSections || !Array.isArray(assignedSections) || assignedSections.length === 0 || !subject || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, email, assigned sections (at least one), subject, and password are required.' 
      });
    }

    // Check if we already have 3 teachers
    const teacherCount = await User.countDocuments({ role: 'teacher' });
    if (teacherCount >= 3) {
      return res.status(400).json({ 
        success: false, 
        message: 'Maximum limit of 3 teacher accounts reached.' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User with this email already exists.' });
    }

    try {
      // Create user in Firebase first
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: `${firstName} ${middleInitial ? middleInitial + ' ' : ''}${lastName}`,
      });

      // Create user in MongoDB
      const newTeacher = new User({
        firstName,
        lastName,
        middleInitial: middleInitial || '',
        email,
        assignedSections,
        subject,
        password, // Will be hashed by pre-save hook
        role: 'teacher',
        firebaseUid: userRecord.uid,
        verified: true,
      });

      await newTeacher.save();

      // Remove password from response
      const teacherResponse = newTeacher.toObject();
      delete teacherResponse.password;

      res.status(201).json({
        success: true,
        message: 'Teacher account created successfully.',
        data: teacherResponse
      });

    } catch (firebaseError) {
      console.error('Firebase error:', firebaseError);
      res.status(500).json({ 
        success: false, 
        message: 'Error creating Firebase user account.',
        error: firebaseError.message 
      });
    }

  } catch (error) {
    console.error('Error creating teacher:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.updateTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;
    const { firstName, lastName, middleInitial, assignedSections, subject } = req.body;

    // Validation
    if (!firstName || !lastName || !assignedSections || !Array.isArray(assignedSections) || assignedSections.length === 0 || !subject) {
      return res.status(400).json({ 
        success: false, 
        message: 'First name, last name, assigned sections (at least one), and subject are required.' 
      });
    }

    const updatedTeacher = await User.findByIdAndUpdate(
      teacherId,
      {
        firstName,
        lastName,
        middleInitial: middleInitial || '',
        assignedSections,
        subject
      },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedTeacher) {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    res.status(200).json({
      success: true,
      message: 'Teacher updated successfully.',
      data: updatedTeacher
    });

  } catch (error) {
    console.error('Error updating teacher:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.deleteTeacher = async (req, res) => {
  try {
    const { teacherId } = req.params;

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Delete from Firebase
    if (teacher.firebaseUid) {
      try {
        await admin.auth().deleteUser(teacher.firebaseUid);
      } catch (firebaseError) {
        console.error('Error deleting Firebase user:', firebaseError);
        // Continue with MongoDB deletion even if Firebase deletion fails
      }
    }

    // Delete from MongoDB
    await User.findByIdAndDelete(teacherId);

    res.status(200).json({
      success: true,
      message: 'Teacher account deleted successfully.'
    });

  } catch (error) {
    console.error('Error deleting teacher:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getTeacherStats = async (req, res) => {
  try {
    const totalTeachers = await User.countDocuments({ role: 'teacher' });
    const availableSlots = 3 - totalTeachers;
    
    // Get sections and their assigned teachers
    const sections = ['Grade 11 - A', 'Grade 11 - B', 'Grade 11 - C', 'Grade 11 - D'];
    const teachers = await User.find({ role: 'teacher' })
      .select('assignedSections firstName lastName')
      .lean();

    const sectionStatus = sections.map(section => {
      const assignedTeachers = teachers.filter(teacher => 
        teacher.assignedSections && teacher.assignedSections.includes(section)
      );
      return {
        section,
        assigned: assignedTeachers.length > 0,
        teacherNames: assignedTeachers.map(teacher => `${teacher.firstName} ${teacher.lastName}`)
      };
    });

    res.status(200).json({
      success: true,
      data: {
        totalTeachers,
        availableSlots,
        maxTeachers: 3,
        sectionStatus
      }
    });

  } catch (error) {
    console.error('Error fetching teacher stats:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// Mood Prediction and Comparison Functions

exports.calculateWeeklyPredictions = async (req, res) => {
  try {
    const users = await User.find({ role: 'user', isDeactivated: { $ne: true } });
    const results = [];

    for (const user of users) {
      const result = await calculateAndSavePredictionsForUser(user._id);
      results.push(result);
    }

    res.status(200).json({
      success: true,
      message: `Processed predictions for ${results.length} users`,
      data: results
    });
  } catch (error) {
    console.error('Error calculating weekly predictions:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const calculateAndSavePredictionsForUser = async (userId) => {
  try {
    const axios = require('axios');
    const { getMoodLogsForUser } = require('./moodPredictionController');
    
    const currentDate = new Date();
    const currentWeekStart = new Date(currentDate);
    currentWeekStart.setDate(currentDate.getDate() - currentDate.getDay()); // Sunday
    currentWeekStart.setHours(0, 0, 0, 0);
    
    const currentWeekEnd = new Date(currentWeekStart);
    currentWeekEnd.setDate(currentWeekStart.getDate() + 6);
    currentWeekEnd.setHours(23, 59, 59, 999);

    const year = currentDate.getFullYear();
    const weekNumber = getWeekNumber(currentDate);

    // Check if prediction already exists for this user and week
    let existingPrediction = await PredictedMood.findOne({
      user: userId,
      year: year,
      weekNumber: weekNumber
    });

    if (existingPrediction && !shouldUpdatePrediction(existingPrediction)) {
      return { userId, message: 'Predictions already exist and up to date' };
    }

    // Get mood logs for the user using the internal function
    const moodLogsData = await getMoodLogsForUser(userId);
    
    if (moodLogsData.length < 14) {
      return { userId, error: 'Insufficient data for predictions (need at least 2 weeks of mood logs)' };
    }

    // Check if user has data in all categories
    const categoryCounts = { activity: 0, social: 0, health: 0, sleep: 0 };
    moodLogsData.forEach(log => {
      if (log.category && categoryCounts.hasOwnProperty(log.category)) {
        categoryCounts[log.category]++;
      }
    });

    console.log(`User ${userId} mood log counts:`, categoryCounts);

    const categories = ['activity', 'social', 'health', 'sleep'];
    const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const predictions = {
      activity: {},
      social: {},
      health: {},
      sleep: {}
    };

    // Call Python service for each category to get predictions
    for (const category of categories) {
      try {
        const pythonResponse = await axios.post('http://localhost:5001/api/predict-category-mood-internal', {
          category: category,
          mood_logs: moodLogsData
        }, {
          headers: {
            'Content-Type': 'application/json'
          },
          timeout: 30000 // 30 second timeout
        });

        if (pythonResponse.data.success && pythonResponse.data.predictions) {
          const pythonPredictions = pythonResponse.data.predictions;
          
          console.log(`Python predictions for ${category}:`, pythonPredictions);
          
          // Map Python predictions to our day structure
          for (const day of daysOfWeek) {
            if (pythonPredictions[day]) {
              predictions[category][day] = {
                predictedMood: pythonPredictions[day].predicted_mood || 'No data available',
                actualMood: null, // Will be filled later
                allMoodProbabilities: pythonPredictions[day].all_mood_probabilities || {}
              };
            } else {
              predictions[category][day] = {
                predictedMood: 'No data available',
                actualMood: null,
                allMoodProbabilities: {}
              };
            }
          }
        } else {
          console.warn(`Python service failed for category ${category}:`, pythonResponse.data.message || 'Unknown error');
          // Fallback: set no data for all days in this category
          for (const day of daysOfWeek) {
            predictions[category][day] = {
              predictedMood: 'No data available',
              probability: 0.0,
              actualMood: null
            };
          }
        }
      } catch (pythonError) {
        console.error(`Python service error for category ${category}:`, {
          message: pythonError.message,
          code: pythonError.code,
          response: pythonError.response?.data
        });
        
        // Fallback: set no data for all days in this category
        for (const day of daysOfWeek) {
          predictions[category][day] = {
            predictedMood: pythonError.code === 'ECONNREFUSED' ? 'Python service unavailable' : 'No data available',
            probability: 0.0,
            actualMood: null
          };
        }
      }
    }

    // Get actual moods for the current week (if available)
    const actualMoodLogs = await MoodLog.find({
      user: userId,
      date: {
        $gte: currentWeekStart,
        $lte: currentWeekEnd
      }
    });

    // Add actual moods to predictions
    for (const category of categories) {
      for (const day of daysOfWeek) {
        const actualMood = getActualMoodForDay(actualMoodLogs, category, day, currentWeekStart);
        predictions[category][day].actualMood = actualMood;
      }
    }

    // Save or update predictions
    if (existingPrediction) {
      existingPrediction.predictions = predictions;
      existingPrediction.updatedAt = new Date();
      await existingPrediction.save();
    } else {
      existingPrediction = new PredictedMood({
        user: userId,
        weekStartDate: currentWeekStart,
        weekEndDate: currentWeekEnd,
        year: year,
        weekNumber: weekNumber,
        predictions: predictions
      });
      await existingPrediction.save();
    }

    return { userId, message: 'Predictions calculated and saved successfully using Python service' };
  } catch (error) {
    console.error(`Error calculating predictions for user ${userId}:`, error);
    return { userId, error: error.message };
  }
};

// New function that exactly matches Python logic
const calculateDayPredictionPythonLogic = (categoryLogs, targetDay, currentWeekStart) => {
  // Python logic: week_weights = [1, 2, 3, 4] (oldest to most recent)
  const weekWeights = [1, 2, 3, 4]; 
  
  // Python logic: negative + positive emotions
  const negativeEmotions = ['bored', 'sad', 'disappointed', 'angry', 'tense'];
  const positiveEmotions = ['calm', 'relaxed', 'pleased', 'happy', 'excited'];
  const allEmotions = [...negativeEmotions, ...positiveEmotions];
  
  // Python logic: current week starts on Monday, exclude current week data
  const currentDate = new Date();
  const currentWeekMonday = new Date(currentDate);
  currentWeekMonday.setDate(currentDate.getDate() - currentDate.getDay() + 1); // Monday
  currentWeekMonday.setHours(0, 0, 0, 0);
  
  // Python logic: four_weeks_ago = current_week_start - pd.Timedelta(days=28)
  const fourWeeksAgo = new Date(currentWeekMonday);
  fourWeeksAgo.setDate(currentWeekMonday.getDate() - 28);
  
  // Filter logs for the target day and exclude current week
  const dayLogs = categoryLogs.filter(log => {
    const logDay = log.date.toLocaleDateString('en-US', { weekday: 'long' });
    return logDay === targetDay && log.date < currentWeekMonday && log.date >= fourWeeksAgo;
  });

  if (dayLogs.length === 0) {
    return {
      predictedMood: 'No data available',
      probability: 0.0,
      actualMood: null
    };
  }

  // Python logic: category_df['week_number'] = ((category_df['timestamp'] - four_weeks_ago).dt.days // 7).astype(int)
  // Initialize mood weighted intensities for 4 weeks [week0, week1, week2, week3] (oldest to newest)
  const moodWeekWeightedIntensities = {};
  allEmotions.forEach(emotion => {
    moodWeekWeightedIntensities[emotion] = [0.0, 0.0, 0.0, 0.0];
  });

  // Process each log - Python week assignment logic with intensity weighting
  dayLogs.forEach(log => {
    // Python: ((category_df['timestamp'] - four_weeks_ago).dt.days // 7).astype(int)
    const daysDiff = Math.floor((log.date - fourWeeksAgo) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.floor(daysDiff / 7);
    
    // Python: category_df = category_df[category_df['week_number'] < 4]
    if (weekNumber >= 0 && weekNumber < 4) {
      const afterEmotion = log.afterEmotion ? log.afterEmotion.toLowerCase() : null;
      const afterIntensity = log.afterIntensity || 0; // Default to 1 if missing
      
      if (afterEmotion && allEmotions.includes(afterEmotion)) {
        // Apply weighted mean: weight (per week) * intensity
        const weekWeight = weekWeights[weekNumber];
        const weightedIntensity = weekWeight * afterIntensity;
        moodWeekWeightedIntensities[afterEmotion][weekNumber] += weightedIntensity;
      }
    }
  });

  // Calculate total weighted intensities using weighted mean formula
  const moodTotalWeightedIntensities = {};
  let totalWeightedIntensity = 0.0;

  allEmotions.forEach(emotion => {
    const weekWeightedIntensities = moodWeekWeightedIntensities[emotion];
    // Sum all weighted intensities for this mood across all weeks
    const moodWeightedSum = weekWeightedIntensities.reduce((sum, intensity) => sum + intensity, 0);
    moodTotalWeightedIntensities[emotion] = moodWeightedSum;
    totalWeightedIntensity += moodWeightedSum;
  });

  if (totalWeightedIntensity === 0) {
    return {
      predictedMood: 'No valid data',
      probability: 0.0,
      actualMood: null
    };
  }

  // Calculate probabilities using weighted mean formula
  const moodProbabilities = {};
  allEmotions.forEach(emotion => {
    // Weighted Mean = Σ(wi × xi) / Σ(wi)
    const probability = moodTotalWeightedIntensities[emotion] / totalWeightedIntensity;
    moodProbabilities[emotion] = probability;
  });

  // Get the mood with highest probability
  let maxProbability = 0;
  let predictedEmotion = 'unknown';

  Object.entries(moodProbabilities).forEach(([emotion, probability]) => {
    if (probability > maxProbability) {
      maxProbability = probability;
      predictedEmotion = emotion;
    }
  });

  // Cap the maximum probability at 90%
  const cappedProbability = Math.min(maxProbability * 100, 90.0);

  return {
    predictedMood: predictedEmotion.charAt(0).toUpperCase() + predictedEmotion.slice(1),
    probability: Math.round(cappedProbability * 10) / 10, // Round to 1 decimal place
    actualMood: null
  };
};

// Keep the old function for backward compatibility if needed elsewhere
const calculateDayPrediction = (categoryLogs, targetDay, currentWeekStart) => {
  const weekWeights = [1, 2, 3, 4]; // Week 1 (oldest) = 1, Week 4 (most recent) = 4
  const emotions = ['bored', 'sad', 'disappointed', 'angry', 'tense', 'calm', 'relaxed', 'pleased', 'happy', 'excited'];
  
  // Filter logs for the target day
  const dayLogs = categoryLogs.filter(log => {
    const logDay = log.date.toLocaleDateString('en-US', { weekday: 'long' });
    return logDay === targetDay;
  });

  if (dayLogs.length === 0) {
    return {
      predictedMood: 'No data',
      actualMood: null
    };
  }

  // Group logs by week with weighted intensities
  const moodWeekWeightedIntensities = {};
  emotions.forEach(emotion => {
    moodWeekWeightedIntensities[emotion] = [0.0, 0.0, 0.0, 0.0]; // 4 weeks
  });

  dayLogs.forEach(log => {
    const weeksDiff = Math.floor((currentWeekStart - log.date) / (7 * 24 * 60 * 60 * 1000));
    const weekIndex = Math.min(3, Math.max(0, weeksDiff - 1)); // Weeks 1-4 (index 0-3)
    
    const afterEmotion = log.afterEmotion ? log.afterEmotion.toLowerCase() : null;
    const afterIntensity = log.afterIntensity || 0; // Default to 1 if missing
    
    if (afterEmotion && emotions.includes(afterEmotion)) {
      // Apply weighted mean: weight (per week) * intensity
      const weekWeight = weekWeights[weekIndex];
      const weightedIntensity = weekWeight * afterIntensity;
      moodWeekWeightedIntensities[afterEmotion][weekIndex] += weightedIntensity;
    }
  });

  // Calculate total weighted intensities
  const moodTotalWeightedIntensities = {};
  let totalWeightedIntensity = 0.0;

  emotions.forEach(emotion => {
    const moodWeightedSum = moodWeekWeightedIntensities[emotion].reduce((sum, intensity) => sum + intensity, 0);
    moodTotalWeightedIntensities[emotion] = moodWeightedSum;
    totalWeightedIntensity += moodWeightedSum;
  });

  if (totalWeightedIntensity === 0) {
    return {
      predictedMood: 'No valid data',
      actualMood: null
    };
  }

  // Find mood with highest probability using weighted mean
  let maxProbability = 0;
  let predictedMood = 'unknown';

  emotions.forEach(emotion => {
    const probability = moodTotalWeightedIntensities[emotion] / totalWeightedIntensity;
    if (probability > maxProbability) {
      maxProbability = probability;
      predictedMood = emotion;
    }
  });

  // Cap the maximum probability at 90%
  const cappedProbability = Math.min(maxProbability * 100, 90.0);

  return {
    predictedMood: predictedMood.charAt(0).toUpperCase() + predictedMood.slice(1),
    probability: Math.round(cappedProbability * 10) / 10, // Round to 1 decimal place
    actualMood: null
  };
};

const getActualMoodForDay = (actualMoodLogs, category, targetDay, weekStart) => {
  // Get the specific date for the target day
  const targetDate = new Date(weekStart);
  const dayIndex = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].indexOf(targetDay);
  targetDate.setDate(weekStart.getDate() + dayIndex);

  // Filter logs for this specific day and category
  const dayLogs = actualMoodLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate.toDateString() === targetDate.toDateString() && log.category === category;
  });

  if (dayLogs.length === 0) {
    return null;
  }

  // Sort logs by timestamp to get the latest one
  dayLogs.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Count frequency of each mood
  const moodCounts = {};
  dayLogs.forEach(log => {
    const afterEmotion = log.afterEmotion ? log.afterEmotion.toLowerCase() : null;
    if (afterEmotion) {
      moodCounts[afterEmotion] = (moodCounts[afterEmotion] || 0) + 1;
    }
  });

  // Find the most frequent mood (dominant mood)
  let maxCount = 0;
  let dominantMoods = [];

  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count > maxCount) {
      maxCount = count;
      dominantMoods = [mood];
    } else if (count === maxCount) {
      dominantMoods.push(mood);
    }
  });

  // If there's a clear dominant mood, return it
  if (dominantMoods.length === 1) {
    return dominantMoods[0].charAt(0).toUpperCase() + dominantMoods[0].slice(1);
  }

  // If no clear dominant mood (tie or all moods appear once), return the latest mood
  if (dominantMoods.length > 1 || maxCount === 1) {
    const latestLog = dayLogs[0]; // Already sorted by latest first
    const latestMood = latestLog.afterEmotion ? latestLog.afterEmotion.toLowerCase() : null;
    return latestMood ? latestMood.charAt(0).toUpperCase() + latestMood.slice(1) : null;
  }

  return null;
};

const shouldUpdatePrediction = (existingPrediction) => {
  const now = new Date();
  const lastUpdated = new Date(existingPrediction.updatedAt);
  const daysSinceUpdate = (now - lastUpdated) / (1000 * 60 * 60 * 24);
  
  // Update if it's been more than 1 day since last update
  return daysSinceUpdate > 1;
};

const getWeekNumber = (date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
};

exports.getPredictionComparisons = async (req, res) => {
  try {
    const { weekOffset = 0 } = req.query; // 0 = current week, 1 = last week, etc.
    
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() - (weekOffset * 7));
    
    const year = targetDate.getFullYear();
    const weekNumber = getWeekNumber(targetDate);

    const predictions = await PredictedMood.find({
      year: year,
      weekNumber: weekNumber
    }).populate('user', 'firstName lastName');

    if (predictions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No prediction data found for the specified week'
      });
    }

    // Process data for comparison graphs
    const categories = ['activity', 'social', 'health', 'sleep'];
    const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const comparisonData = {};

    categories.forEach(category => {
      comparisonData[category] = {
        days: daysOfWeek,
        matches: [],
        notMatches: [],
        predictedMoods: [],
        actualMoods: []
      };

      daysOfWeek.forEach(day => {
        let matches = 0;
        let notMatches = 0;
        let predictedMoods = [];
        let actualMoods = [];

        predictions.forEach(prediction => {
          const dayData = prediction.predictions[category][day];
          if (dayData && dayData.predictedMood && dayData.predictedMood !== 'No data' && dayData.predictedMood !== 'No valid data') {
            predictedMoods.push(dayData.predictedMood);
            
            if (dayData.actualMood) {
              actualMoods.push(dayData.actualMood);
              if (dayData.predictedMood.toLowerCase() === dayData.actualMood.toLowerCase()) {
                matches++;
              } else {
                notMatches++;
              }
            }
          }
        });

        comparisonData[category].matches.push(matches);
        comparisonData[category].notMatches.push(notMatches);
        comparisonData[category].predictedMoods.push(predictedMoods);
        comparisonData[category].actualMoods.push(actualMoods);
      });
    });

    res.status(200).json({
      success: true,
      data: comparisonData,
      weekInfo: {
        year: year,
        weekNumber: weekNumber,
        weekOffset: weekOffset,
        totalUsers: predictions.length
      }
    });

  } catch (error) {
    console.error('Error getting prediction comparisons:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

const getMostCommonMood = (moods) => {
  if (moods.length === 0) return null;
  
  const moodCounts = {};
  moods.forEach(mood => {
    moodCounts[mood] = (moodCounts[mood] || 0) + 1;
  });

  let maxCount = 0;
  let mostCommon = null;
  Object.entries(moodCounts).forEach(([mood, count]) => {
    if (count > maxCount) {
      maxCount = count;
      mostCommon = mood;
    }
  });

  return mostCommon;
};

exports.updateActualMoods = async (req, res) => {
  try {
    // This function updates actual moods for the current week
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const weekNumber = getWeekNumber(currentDate);

    const predictions = await PredictedMood.find({
      year: year,
      weekNumber: weekNumber
    });

    let updatedCount = 0;

    for (const prediction of predictions) {
      const weekStart = new Date(prediction.weekStartDate);
      const weekEnd = new Date(prediction.weekEndDate);

      // Get actual mood logs for this week and user
      const actualMoodLogs = await MoodLog.find({
        user: prediction.user,
        date: {
          $gte: weekStart,
          $lte: weekEnd
        }
      });

      const categories = ['activity', 'social', 'health', 'sleep'];
      const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      let hasUpdates = false;

      // Update actual moods and probability to reflect actual mood percentage
      for (const category of categories) {
        for (const day of daysOfWeek) {
          const actualMood = getActualMoodForDay(actualMoodLogs, category, day, weekStart);
          
          const currentActualMood = prediction.predictions[category][day].actualMood;
          
          if (actualMood && currentActualMood !== actualMood) {
            prediction.predictions[category][day].actualMood = actualMood;
            hasUpdates = true;
          } else if (currentActualMood && !actualMood) {
            // If actual mood was removed (no longer detected), reset actualMood to null
            prediction.predictions[category][day].actualMood = null;
            hasUpdates = true;
          }
        }
      }

      if (hasUpdates) {
        prediction.updatedAt = new Date();
        await prediction.save();
        updatedCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Updated actual moods for ${updatedCount} prediction records`
    });

  } catch (error) {
    console.error('Error updating actual moods:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getAvailableWeeks = async (req, res) => {
  try {
    // Calculate which weekOffsets have data
    const currentDate = new Date();
    const availableOffsets = [];
    
    // Check offsets 0-4 (current week to 4 weeks ago)
    for (let offset = 0; offset <= 4; offset++) {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() - (offset * 7));
      
      const year = targetDate.getFullYear();
      const weekNumber = getWeekNumber(targetDate);
      
      // Check if data exists for this week
      const dataExists = await PredictedMood.exists({
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
    console.error('Error getting available weeks:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};