const express = require('express');
const { signup, login, getMe, googleAuth, getProfileStats, updateProfile, uploadAvatar } = require('../controllers/authController');
const { authMiddleware } = require('../middleware/authMiddleware'); // Destructure the import
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinaryConfig');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'avatars',
    allowedFormats: ['jpg', 'png'],
  },
});

const upload = multer({ storage: storage });

const router = express.Router();

router.post('/signup', upload.single('avatar'), signup);
router.post('/login', login);
router.get('/me', authMiddleware, getMe); // Protect the /me route with authMiddleware
router.post('/google-auth', googleAuth);

// Profile routes
router.get('/profile-stats', authMiddleware, getProfileStats);
router.put('/update-profile', authMiddleware, updateProfile);
router.post('/upload-avatar', authMiddleware, uploadAvatar);

router.get('/home', authMiddleware, (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to the home page!' });
});

module.exports = router;