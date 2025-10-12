const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const cloudinary = require('cloudinary').v2;
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'teacher-avatars',
    allowedFormats: ['jpg', 'png', 'gif'],
  },
});

const upload = multer({ storage: storage });

// Get teacher profile
exports.getTeacherProfile = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id).select('-password');
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    res.status(200).json({
      success: true,
      data: teacher
    });
  } catch (error) {
    console.error('Error fetching teacher profile:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Update teacher profile
exports.updateTeacherProfile = async (req, res) => {
  try {
    const { firstName, lastName, middleInitial, subject } = req.body;
    
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Update allowed fields
    teacher.firstName = firstName || teacher.firstName;
    teacher.lastName = lastName || teacher.lastName;
    teacher.middleInitial = middleInitial || teacher.middleInitial;
    teacher.subject = subject || teacher.subject;

    // Update avatar if provided
    if (req.file) {
      teacher.avatar = req.file.path;
    }

    await teacher.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        firstName: teacher.firstName,
        lastName: teacher.lastName,
        middleInitial: teacher.middleInitial,
        subject: teacher.subject,
        email: teacher.email,
        assignedSections: teacher.assignedSections,
        avatar: teacher.avatar
      }
    });
  } catch (error) {
    console.error('Error updating teacher profile:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Export multer upload middleware
exports.uploadAvatar = upload.single('avatar');

// Get students by teacher's assigned sections
exports.getStudentsBySection = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    const students = await User.find({ 
      section: { $in: teacher.assignedSections },
      role: 'user' 
    }).select('-password');

    res.status(200).json({
      success: true,
      data: students,
      sections: teacher.assignedSections
    });
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get mood logs for students in teacher's sections
exports.getStudentMoodLogs = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Get all students in teacher's assigned sections
    const students = await User.find({ 
      section: { $in: teacher.assignedSections },
      role: 'user' 
    }).select('_id firstName lastName email section');

    const studentIds = students.map(student => student._id);

    // Get mood logs for these students
    const moodLogs = await MoodLog.find({ 
      user: { $in: studentIds } 
    })
    .populate('user', 'firstName lastName email section')
    .sort({ date: -1 });

    // Add student info to each mood log for easier display
    const enrichedMoodLogs = moodLogs.map(log => ({
      ...log.toObject(),
      studentName: `${log.user.firstName} ${log.user.lastName}`,
      studentEmail: log.user.email,
      studentSection: log.user.section
    }));

    res.status(200).json({
      success: true,
      data: enrichedMoodLogs,
      sections: teacher.assignedSections,
      totalLogs: enrichedMoodLogs.length
    });
  } catch (error) {
    console.error('Error fetching student mood logs:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get mood logs for a specific section (for section-based filtering)
exports.getMoodLogsBySection = async (req, res) => {
  try {
    const { section } = req.params;
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Verify teacher has access to this section
    if (!teacher.assignedSections || !teacher.assignedSections.includes(section)) {
      return res.status(403).json({ success: false, message: 'Access denied to this section.' });
    }

    // Get all students in the specified section
    const students = await User.find({ 
      section: section,
      role: 'user' 
    }).select('_id firstName lastName email');

    const studentIds = students.map(student => student._id);

    // Get mood logs for these students
    const moodLogs = await MoodLog.find({ 
      user: { $in: studentIds } 
    })
    .populate('user', 'firstName lastName email section')
    .sort({ date: -1 });

    // Add student info to each mood log for easier display
    const enrichedMoodLogs = moodLogs.map(log => ({
      ...log.toObject(),
      studentName: `${log.user.firstName} ${log.user.lastName}`,
      studentEmail: log.user.email,
      studentSection: log.user.section
    }));

    res.status(200).json({
      success: true,
      data: enrichedMoodLogs,
      section: section,
      totalLogs: enrichedMoodLogs.length
    });
  } catch (error) {
    console.error('Error fetching mood logs by section:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get dashboard statistics for teacher
exports.getTeacherDashboardStats = async (req, res) => {
  try {
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Get students count in teacher's sections
    const studentsCount = await User.countDocuments({ 
      section: { $in: teacher.assignedSections },
      role: 'user' 
    });

    // Get students in sections
    const students = await User.find({ 
      section: { $in: teacher.assignedSections },
      role: 'user' 
    }).select('_id');

    const studentIds = students.map(student => student._id);

    // Get total mood logs count
    const totalMoodLogs = await MoodLog.countDocuments({ 
      user: { $in: studentIds } 
    });

    // Get recent mood logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentMoodLogs = await MoodLog.countDocuments({ 
      user: { $in: studentIds },
      date: { $gte: sevenDaysAgo }
    });

    // Get mood distribution for the section
    const moodDistribution = await MoodLog.aggregate([
      { $match: { user: { $in: studentIds } } },
      { $group: { 
        _id: '$afterEmotion', 
        count: { $sum: 1 } 
      }},
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        sections: teacher.assignedSections,
        studentsCount,
        totalMoodLogs,
        recentMoodLogs,
        moodDistribution
      }
    });
  } catch (error) {
    console.error('Error fetching teacher dashboard stats:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};