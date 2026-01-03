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

const moment = require('moment');

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

// Get students in a specific section with mood log counts
exports.getSectionStudents = async (req, res) => {
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

    // Get students in the specified section
    const students = await User.find({ 
      section: section,
      role: 'user' 
    }).select('firstName lastName email avatar section');

    // Get mood log counts for each student by category
    const studentsWithLogs = await Promise.all(students.map(async (student) => {
      const moodLogCounts = await MoodLog.aggregate([
        { $match: { user: student._id } },
        { $group: { 
          _id: '$category', 
          count: { $sum: 1 } 
        }}
      ]);

      // Convert array to object for easier access
      const counts = {};
      moodLogCounts.forEach(item => {
        counts[item._id] = item.count;
      });

      return {
        ...student.toObject(),
        name: `${student.firstName} ${student.lastName}`,
        moodLogCounts: counts
      };
    }));

    res.status(200).json({
      success: true,
      data: studentsWithLogs,
      section: section
    });
  } catch (error) {
    console.error('Error fetching section students:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get mood logs for a specific student
exports.getStudentMoodLogsById = async (req, res) => {
  try {
    const { studentId } = req.params;
    const teacher = await User.findById(req.user._id);
    
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Get the student and verify they're in teacher's section
    const student = await User.findById(studentId).select('firstName lastName email section');
    
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    // Verify teacher has access to this student's section
    if (!teacher.assignedSections || !teacher.assignedSections.includes(student.section)) {
      return res.status(403).json({ success: false, message: 'Access denied to this student.' });
    }

    // Get mood logs for this student
    const moodLogs = await MoodLog.find({ 
      user: studentId 
    })
    .sort({ date: -1 });

    // Add student info to each mood log for easier display
    const enrichedMoodLogs = moodLogs.map(log => ({
      ...log.toObject(),
      studentName: `${student.firstName} ${student.lastName}`,
      studentEmail: student.email,
      studentSection: student.section
    }));

    res.status(200).json({
      success: true,
      data: enrichedMoodLogs,
      student: {
        name: `${student.firstName} ${student.lastName}`,
        email: student.email,
        section: student.section
      },
      totalLogs: enrichedMoodLogs.length
    });
  } catch (error) {
    console.error('Error fetching student mood logs by ID:', error);
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

// Get logs by category for a section with filtering (weekly, daily, monthly)
exports.getLogsByCategory = async (req, res) => {
  try {
    const { section } = req.params;
    const { viewType = 'weekly' } = req.query;
    
    const teacher = await User.findById(req.user._id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Verify teacher has access to this section
    if (!teacher.assignedSections || !teacher.assignedSections.includes(section)) {
      return res.status(403).json({ success: false, message: 'Access denied to this section.' });
    }

    // Get all students in the section
    const students = await User.find({ 
      section: section,
      role: 'user'
    }).select('_id');

    const studentIds = students.map(s => s._id);

    let startDate, endDate, groupBy, labels = [], dateRanges = [];
    const categories = ['activity', 'health', 'social', 'sleep'];

    if (viewType === 'weekly') {
      // Last 8 weeks comparison
      endDate = moment().endOf('isoWeek').toDate();
      startDate = moment(endDate).subtract(8, 'weeks').add(1, 'day').startOf('day').toDate();
      
      // Group by week
      groupBy = { $isoWeek: "$date" };
      
      for (let i = 7; i >= 0; i--) {
        const s = moment().subtract(i, 'weeks').startOf('isoWeek');
        const e = moment(s).endOf('isoWeek');
        labels.push(`${s.format('MMM D')}-${e.format('MMM D')}`);
        dateRanges.push({ week: s.isoWeek(), year: s.isoWeekYear() });
      }
    } else if (viewType === 'daily') {
      // Past 30 days
      endDate = moment().endOf('day').toDate();
      startDate = moment(endDate).subtract(29, 'days').startOf('day').toDate();
      groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$date" } };
      
      for (let i = 0; i < 30; i++) {
        labels.push(moment(startDate).add(i, 'days').format('MMM D'));
      }
    } else if (viewType === 'monthly') {
      // Last 12 months comparison
      endDate = moment().endOf('month').toDate();
      startDate = moment(endDate).subtract(11, 'months').startOf('month').toDate();
      groupBy = { 
        month: { $month: "$date" },
        year: { $year: "$date" }
      };
      
      for (let i = 11; i >= 0; i--) {
        const m = moment().subtract(i, 'months');
        labels.push(m.format('MMM \'YY'));
        dateRanges.push({ month: m.month() + 1, year: m.year() });
      }
    }

    // Get mood logs for the period by category and time unit
    const logs = await MoodLog.aggregate([
      {
        $match: {
          user: { $in: studentIds },
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            timeUnit: groupBy
          },
          count: { $sum: 1 }
        }
      }
    ]);

    const chartData = {};
    categories.forEach(cat => {
      chartData[cat] = new Array(labels.length).fill(0);
    });

    logs.forEach(log => {
      const { category, timeUnit } = log._id;
      if (categories.includes(category)) {
        let index = -1;
        
        if (viewType === 'weekly') {
          index = dateRanges.findIndex(dr => dr.week === timeUnit);
        } else if (viewType === 'monthly') {
          index = dateRanges.findIndex(dr => dr.month === timeUnit.month && dr.year === timeUnit.year);
        } else {
          const dateStr = moment(timeUnit).format('MMM D');
          index = labels.indexOf(dateStr);
        }
        
        if (index !== -1 && index < labels.length) {
          chartData[category][index] = log.count;
        }
      }
    });

    res.status(200).json({
      success: true,
      data: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        labels,
        activity: chartData.activity,
        health: chartData.health,
        social: chartData.social,
        sleep: chartData.sleep,
        startDate,
        endDate,
        viewType
      }
    });
  } catch (error) {
    console.error('Error fetching logs by category:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
