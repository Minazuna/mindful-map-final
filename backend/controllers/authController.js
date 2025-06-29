const admin = require('../config/firebaseConfig');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const nodemailer = require('nodemailer');
const crypto = require('crypto');
const {  accountDisabledTemplate } = require("../utils/emailTemplates");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars',
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

const sendVerificationEmail = (user, token) => {
  const verificationUrl = `${process.env.VITE_NODE_API}/api/auth/verify-email?token=${token}`;

  const mailOptions = {
    from: '"Mindful Map" <no-reply@mindfulmap.com>',
    to: user.email,
    subject: 'Account Verification',
    html: `
      <div style="background-color: #f9f9f9; padding: 20px; font-family: 'Roboto', sans-serif;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px; border-radius: 10px; text-align: center;">
          <img src="${process.env.FRONTEND_URL}/images/logo.png" alt="Mindful Map" style="width: 100px; margin-bottom: 20px;">
          <h2>Account Verification</h2>
          <p style="text-align: justify;">Good day! Thank you for joining Mindful Map. To start using your account, please verify your email first by clicking the button below. We're looking forward to having you!</p>
          <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; margin-top: 20px; background-color: #6fba94; color: #ffffff; text-decoration: none; border-radius: 5px;">Verify Account</a>
        </div>
      </div>
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.error('Error sending email:', error);
    }
    console.log('Verification email sent:', info.response);
  });
};

exports.signup = async (req, res) => {
  try {
    const { email, firstName, lastName, password, role, gender } = req.body;

    if (!email || !firstName || !lastName || !password) {
      return res.status(400).json({ success: false, message: 'Email, first name, last name, and password are required.' });
    }

    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    let avatarPath = '';
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path);
      avatarPath = result.secure_url;
    }

    // Create new user in Firebase
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstName} ${lastName}`,
    });

    // Create new user in MongoDB
    user = new User({
      email,
      firstName,
      lastName,
      gender: gender || 'Rather not say', // Include gender with default fallback
      avatar: avatarPath,
      firebaseUid: userRecord.uid,
      password, // Password will be hashed in the pre-save hook
      role: role || 'user',
      verified: role === 'admin', // Automatically verify admin users
    });

    await user.save();

    const token = jwt.sign({ uid: user._id }, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_TIME,
    });

    // Send verification email if the user is not an admin
    if (user.role !== 'admin') {
      sendVerificationEmail(user, token);
    }

    return res.status(201).json({
      success: true,
      message: user.role === 'admin' ? 'Admin registered successfully.' : 'User registered successfully. Please check your email to verify your account.',
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
      });
      
      await user.save();
    } else {
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.avatar = avatar || user.avatar;
      user.verified = true; 
      
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

    // Check if the user is verified
    if (!user.verified) {
      return res.status(403).json({ success: false, message: 'Please verify your email to log in.' });
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
    res.json(user);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
};

exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ success: false, message: 'Invalid or missing token.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.uid);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    user.verified = true;
    await user.save();

    return res.redirect(`${process.env.FRONTEND_URL}/signin`);
  } catch (error) {
    console.error('Error in email verification:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
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