const admin = require('../config/firebaseConfig');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const { accountDisabledTemplate } = require("../utils/emailTemplates");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'mindful-map/avatars',
    allowedFormats: ['jpg', 'png'],
  },
});

const upload = multer({ storage: storage });

const transporter = nodemailer.createTransport({
  host: 'smtp.mailtrap.io',
  port: 2525,
  auth: {
    user: process.env.MAILTRAP_USER,
    pass: process.env.MAILTRAP_PASS,
  },
});

exports.signup = async (req, res) => {
  try {
    const { email, firstName, middleInitial, lastName, password, role, gender, section } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ success: false, message: 'Email, first name, last name, and password are required.' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    let avatarPath = '';
    let avatarPublicId = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      avatarPath = result.secure_url;
      avatarPublicId = result.public_id;
    }

    // Create new user in Firebase
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${middleInitial ? middleInitial + ' ' : ''}${lastName}`,
    });

    // Create new user in MongoDB - automatically verified
    user = new User({
      email,
      firstName,
      middleInitial: middleInitial || '',
      lastName,
      gender: gender || 'Rather not say',
      section: section || undefined,
      avatar: avatarPath,
      avatarPublicId: avatarPublicId || null,
      firebaseUid: userRecord.uid,
      password, // Password will be hashed in the pre-save hook
      role: role || 'user',
      verified: true, // Auto-verify all users
      provider: 'email'
    });

    await user.save();

    const token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME,
    });

    return res.status(201).json({
      success: true,
      message: 'User registered successfully. You can now log in.',
      token,
    });
  } catch (error) {
    console.error('Error in signup:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.googleAuth = async (req, res) => {
  try {
    const { email, firstName, lastName, avatar, firebaseUid } = req.body;
    let user = await User.findOne({ email });
    
    if (!user) {
      const randomPassword = Math.random().toString(36).slice(-10);
      
      user = new User({
        email,
        firstName,
        lastName,
        avatar,
        firebaseUid,
        password: randomPassword, 
        role: 'user',
        verified: true,
        section: 'N/A', // Set section as N/A for Google users - they can update later
        provider: 'Google'
      });
      
      await user.save();
    } else {
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.avatar = avatar || user.avatar;
      user.verified = true; 
      
      // Only set section to N/A if it's not already set
      if (!user.section) {
        user.section = 'N/A';
      }
      
      if (!user.firebaseUid) {
        user.firebaseUid = firebaseUid;
      }
      
      await user.save();
    }

    // Generate token
    const token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME,
    });

    return res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      token,
      role: user.role,
    });
  } catch (error) {
    console.error('Error in Google authentication:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    console.log('Login attempt for email:', email);

    // Check if the user exists
    let user = await User.findOne({ email });
    console.log('User found:', user);

    // Check if the user has pending deactivation and grace period has expired
    if (user && user.pendingDeactivation && user.deactivateAt && new Date() > user.deactivateAt) {
      console.log(`User ${user.email} grace period has expired, deactivating...`);
      
      // Deactivate this specific user instead of processing all users
      user.isDeactivated = true;
      user.pendingDeactivation = false;
      user.deactivatedAt = new Date();
      user.deactivateAt = null;
      await user.save();
      
      // Send email notification explicitly for this user
      try {
        const API_URL = process.env.VITE_NODE_API;
        await sendMail(
          user.email, 
          "Your account has been disabled", 
          accountDisabledTemplate(`${API_URL}/api/auth/request-reactivation?userId=${user._id}`)
        );
        console.log(`Deactivation email sent to ${user.email}`);
      } catch (emailError) {
        console.error('Error sending deactivation email:', emailError);
      }
      
      return res.status(403).json({ 
        success: false, 
        message: "Your account has been deactivated due to inactivity." 
      });
    }

    // If user has pending deactivation but hasn't expired yet, remove the pending status
    if (user && user.pendingDeactivation) {
      user.pendingDeactivation = false;
      user.deactivateAt = null;
      await user.save();
    }
    
    // If no user exists and the email is the admin email, create an admin user
    if (!user && email === 'admin@gmail.com') {
      // Create new admin user in Firebase
      const userRecord = await admin.auth().createUser({
        email,
        password,
        displayName: 'Admin',
      });

      user = new User({
        email,
        password, // Password will be hashed in the pre-save hook
        role: 'admin',
        firebaseUid: userRecord.uid,
        verified: true, // Automatically verify admin users
      });
      await user.save();
      console.log('Admin user created:', user);
    }



    if (!user) {
      console.error('User not found in MongoDB.');
      return res.status(404).json({ success: false, message: 'Invalid email or password.' });
    }

    if (user.isDeactivated) {
      return res.status(403).json({ success: false, message: "Your account is deactivated." });
    }

    // Check if the password is correct
    const isMatch = await user.matchPassword(password);
    console.log('Password match:', isMatch);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password.' });
    }

    // Generate a token
    const token = jwt.sign({ uid: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME,
    });

    // Redirect to admin dashboard if the user is an admin
    if (user.role === 'admin') {
      return res.status(200).json({
        success: true,
        message: 'Admin logged in successfully',
        token,
        redirectUrl: '/admin/dashboard',
      });
    }

    // Redirect to teacher dashboard if the user is a teacher
    if (user.role === 'teacher') {
      return res.status(200).json({
        success: true,
        message: 'Teacher logged in successfully',
        token,
        redirectUrl: '/teacher/dashboard',
      });
    }

    // Handle regular user login
    return res.status(200).json({
      success: true,
      message: 'User logged in successfully',
      token,
    });
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({
      ...user.toObject(),
      provider: user.provider || 'email'
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.requestReactivation = async (req, res) => {
  try {
    const { userId } = req.query;
    const user = await User.findById(userId);
    
    if (!user) return res.status(404).json({ message: "User not found" });
    
    if (!user.isDeactivated) {
      return res.status(400).json({ message: "Account is not deactivated" });
    }
    
    user.hasRequestedReactivation = true;
    await user.save();
    
    res.send(`
      <html>
        <body>
          <h1>Reactivation Request Sent</h1>
          <p>Your request to reactivate your account has been sent to the administrators.</p>
          <p>You will receive an email once your account has been reactivated.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Error requesting reactivation:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getProfileStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const MoodLog = require('../models/MoodLog');

    // Get total mood logs count
    const totalMoodLogs = await MoodLog.countDocuments({ user: userId });

    // Calculate consecutive days logging
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let consecutiveDays = 0;
    let checkDate = new Date(today);
    
    // Check backwards from today
    while (true) {
      const startOfDay = new Date(checkDate);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(checkDate);
      endOfDay.setHours(23, 59, 59, 999);
      
      const logExists = await MoodLog.findOne({
        user: userId,
        date: { $gte: startOfDay, $lte: endOfDay }
      });
      
      if (logExists) {
        consecutiveDays++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
      
      // Safety limit to prevent infinite loops
      if (consecutiveDays > 365) break;
    }

    // Get most frequent mood for this week
    const startOfWeek = new Date(today);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1); // Get Monday
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    // Get weekly emotions
    const weeklyMoodLogs = await MoodLog.find({
      user: userId,
      date: { $gte: startOfWeek, $lte: endOfWeek },
      $or: [
        { beforeEmotion: { $exists: true, $ne: null } },
        { afterEmotion: { $exists: true, $ne: null } }
      ]
    });

    // Count weekly emotions
    const weeklyEmotionCounts = {};
    let weeklyTotalEmotions = 0;

    weeklyMoodLogs.forEach(log => {
      if (log.beforeEmotion) {
        weeklyEmotionCounts[log.beforeEmotion] = (weeklyEmotionCounts[log.beforeEmotion] || 0) + 1;
        weeklyTotalEmotions++;
      }
      if (log.afterEmotion) {
        weeklyEmotionCounts[log.afterEmotion] = (weeklyEmotionCounts[log.afterEmotion] || 0) + 1;
        weeklyTotalEmotions++;
      }
    });

    // Find most frequent weekly mood
    let weeklyMostFrequentMood = null;
    if (Object.keys(weeklyEmotionCounts).length > 0) {
      const topWeeklyEmotion = Object.keys(weeklyEmotionCounts).reduce((a, b) =>
        weeklyEmotionCounts[a] > weeklyEmotionCounts[b] ? a : b
      );
      weeklyMostFrequentMood = {
        emotion: topWeeklyEmotion,
        count: weeklyEmotionCounts[topWeeklyEmotion],
        percentage: (weeklyEmotionCounts[topWeeklyEmotion] / weeklyTotalEmotions) * 100
      };
    }

    // Get overall most frequent mood (all time)
    const allMoodLogs = await MoodLog.find({
      user: userId,
      $or: [
        { beforeEmotion: { $exists: true, $ne: null } },
        { afterEmotion: { $exists: true, $ne: null } }
      ]
    });

    // Count overall emotions
    const overallEmotionCounts = {};
    let overallTotalEmotions = 0;

    allMoodLogs.forEach(log => {
      if (log.beforeEmotion) {
        overallEmotionCounts[log.beforeEmotion] = (overallEmotionCounts[log.beforeEmotion] || 0) + 1;
        overallTotalEmotions++;
      }
      if (log.afterEmotion) {
        overallEmotionCounts[log.afterEmotion] = (overallEmotionCounts[log.afterEmotion] || 0) + 1;
        overallTotalEmotions++;
      }
    });

    // Find most frequent overall mood
    let overallMostFrequentMood = null;
    if (Object.keys(overallEmotionCounts).length > 0) {
      const topOverallEmotion = Object.keys(overallEmotionCounts).reduce((a, b) =>
        overallEmotionCounts[a] > overallEmotionCounts[b] ? a : b
      );
      overallMostFrequentMood = {
        emotion: topOverallEmotion,
        count: overallEmotionCounts[topOverallEmotion],
        percentage: (overallEmotionCounts[topOverallEmotion] / overallTotalEmotions) * 100
      };
    }

    res.json({
      consecutiveDays,
      totalMoodLogs,
      weeklyMostFrequentMood,
      overallMostFrequentMood
    });

  } catch (error) {
    console.error('Error fetching profile stats:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    // Use req.user which is already populated by authMiddleware
    const user = req.user;
    const { email, password, avatar, avatarPublicId } = req.body;

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if user is a Google account
    if (user.provider === 'Google') {
      return res.status(403).json({ success: false, message: 'Google accounts cannot be edited' });
    }

    // Prepare update object
    const updateData = {};
    const firebaseUpdates = {};

    // Update email if provided and different
    if (email && email !== user.email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email, _id: { $ne: user._id } });
      if (existingUser) {
        return res.status(400).json({ success: false, message: 'Email already exists' });
      }
      updateData.email = email;
      firebaseUpdates.email = email;
    }

    // Update password if provided
    if (password && password.trim() !== '') {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
      }
      updateData.password = password; // Will be hashed by the pre-save hook
      firebaseUpdates.password = password;
    }

    // Update avatar if provided
    if (avatar) {
      // Delete old avatar from Cloudinary if it exists
      if (user.avatarPublicId) {
        try {
          await cloudinary.uploader.destroy(user.avatarPublicId);
          console.log('🗑️ Deleted old avatar from Cloudinary:', user.avatarPublicId);
        } catch (deleteError) {
          console.log('⚠️ Failed to delete old avatar from Cloudinary:', deleteError.message);
          // Continue even if delete fails
        }
      }
      updateData.avatar = avatar;
      // Update avatarPublicId if provided
      if (avatarPublicId) {
        updateData.avatarPublicId = avatarPublicId;
      }
    }

    // Update Firebase if there are any Firebase updates (email or password)
    if (Object.keys(firebaseUpdates).length > 0) {
      try {
        await admin.auth().updateUser(user.firebaseUid, firebaseUpdates);
        console.log('✅ Firebase user updated for:', user.email);
      } catch (firebaseError) {
        console.error('❌ Firebase update error:', firebaseError);
        return res.status(400).json({ 
          success: false, 
          message: 'Failed to update credentials in Firebase: ' + firebaseError.message 
        });
      }
    }

    // Update MongoDB user with all changes
    Object.keys(updateData).forEach(key => {
      user[key] = updateData[key];
    });

    await user.save();
    console.log('✅ MongoDB user updated for:', user.email);

    // Return updated user (without password and sensitive fields)
    const updatedUser = await User.findById(user._id).select('-password');
    
    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: updatedUser
    });

  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Server Error', 
      error: error.message 
    });
  }
};

exports.uploadAvatar = [
  upload.single('avatar'),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ success: false, message: 'No file uploaded' });
      }

      res.json({
        success: true,
        message: 'Avatar uploaded successfully',
        avatarUrl: req.file.path,
        publicId: req.file.filename
      });

    } catch (error) {
      console.error('Error uploading avatar:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Server Error', 
        error: error.message 
      });
    }
  }
];