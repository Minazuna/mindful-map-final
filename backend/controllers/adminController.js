const User = require('../models/User');
const Prompt = require('../models/Prompt');
const MoodLog = require('../models/MoodLog');
const Forum = require('../models/Forum'); 
const CorrelationValue = require('../models/CorrelationValue'); 
const Journal = require('../models/Journal');
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
      .select('date mood activities social health sleepQuality');
    
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