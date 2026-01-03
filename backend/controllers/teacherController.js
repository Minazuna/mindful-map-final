const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const TeacherRecommendation = require('../models/TeacherRecommendation');
const { getTeacherRecommendations } = require('../services/teacherRecommendEngine');
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

// Get weekly logs by category for a section
exports.getWeeklyLogsByCategory = async (req, res) => {
  try {
    const { section } = req.params;
    const { weekStartDate } = req.query;
    
    const teacher = await User.findById(req.user._id);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    // Verify teacher has access to this section
    if (!teacher.assignedSections || !teacher.assignedSections.includes(section)) {
      return res.status(403).json({ success: false, message: 'Access denied to this section.' });
    }

    // Parse the week start date (Monday)
    let startDate = new Date(weekStartDate);
    startDate.setHours(0, 0, 0, 0);
    
    // Calculate end date (Sunday)
    let endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);

    // Get all students in the section
    const students = await User.find({ 
      section: section,
      role: 'user'
    }).select('_id');

    const studentIds = students.map(s => s._id);

    // Get mood logs for the week by category and day
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
            dayOfWeek: { $dayOfWeek: '$date' }
          },
          count: { $sum: 1 }
        }
      }
    ]);

    // Organize data by category and day
    const categories = ['activity', 'health', 'social', 'sleep'];
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    const chartData = {};
    categories.forEach(cat => {
      chartData[cat] = [0, 0, 0, 0, 0, 0, 0]; // Sun to Sat
    });

    logs.forEach(log => {
      const { category, dayOfWeek } = log._id;
      const dayIndex = dayOfWeek === 1 ? 0 : dayOfWeek - 1; // Convert MongoDB dayOfWeek (1-7) to array index (0-6)
      if (chartData[category]) {
        chartData[category][dayIndex] = log.count;
      }
    });

    // Reorder to start with Monday
    const reorderedChartData = {};
    categories.forEach(cat => {
      const days = chartData[cat];
      // Move Sunday (index 0) to the end
      reorderedChartData[cat] = [...days.slice(1), days[0]];
    });

    res.status(200).json({
      success: true,
      data: {
        days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        activity: reorderedChartData.activity,
        health: reorderedChartData.health,
        social: reorderedChartData.social,
        sleep: reorderedChartData.sleep,
        weekStart: startDate,
        weekEnd: endDate
      }
    });
  } catch (error) {
    console.error('Error fetching weekly logs by category:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

exports.generateSectionRecommendations = async (req, res) => {
  try {
    const { section } = req.params;
    const {
      category,
      activity,
      moodType,
      n,
      period,
      beforeEmotion,
      afterEmotion
    } = req.query;

    // verify teacher access
    const teacher = await User.findById(req.user._id);
    if (!teacher || teacher.role !== 'teacher' || !teacher.assignedSections.includes(section)) {
      return res.status(403).json({ success: false, message: 'Access denied to this section.' });
    }

    // ALWAYS generate from teacherRecommendations.json
    const recs = getTeacherRecommendations({
      category,
      activity,
      moodType,
      n: n ? parseInt(n, 10) : 3
    });

    let recommendations = Array.isArray(recs) ? recs.filter(Boolean) : [];
    if (recommendations.length === 0) {
      recommendations.push('No specific recommendations generated.');
    }

    // save only when ?save=true
    if (String(req.query.save).toLowerCase() === 'true') {
      const periodValue = period || 'daily';
      const categoryValue = category || 'activity';

      // Check for existing recommendation
      const existing = await TeacherRecommendation.findOne({
        section,
        category: categoryValue,
        activity: activity || undefined,
        beforeEmotion: beforeEmotion || undefined,
        afterEmotion: afterEmotion || undefined,
        period: periodValue,
        'recommendations.text': { $all: recommendations }
      });
      if (existing) {
        return res.status(200).json({
          success: true,
          data: existing.recommendations,
          saved: false,
          record: existing
        });
      }

      const recDoc = new TeacherRecommendation({
        section,
        category: categoryValue,
        activity: activity || undefined,
        beforeEmotion: beforeEmotion || undefined,
        afterEmotion: afterEmotion || undefined,
        period: periodValue,
        recommendations: recommendations.map(text => ({ text, feedback: [] })),
        teacher: teacher._id
      });

      await recDoc.save();

      return res.status(200).json({
        success: true,
        data: recommendations,
        saved: true,
        record: recDoc
      });
    }

    return res.status(200).json({ success: true, data: recommendations });
  } catch (error) {
    console.error('Error generating section recommendations:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// New: aggregated recommendations (daily/weekly/monthly) for section
exports.getAggregatedRecommendations = async (req, res) => {
  try {
    const { section } = req.params;
    const { period = 'daily' } = req.query; // 'daily' | 'weekly' | 'monthly'

    const teacher = await User.findById(req.user._id);
    if (!teacher || teacher.role !== 'teacher' || !teacher.assignedSections.includes(section)) {
      return res.status(403).json({ success: false, message: 'Access denied to this section.' });
    }

    // determine date range
    const endDate = new Date();
    let startDate = new Date();
    if (period === 'daily') startDate.setDate(endDate.getDate() - 1);
    else if (period === 'weekly') startDate.setDate(endDate.getDate() - 7);
    else if (period === 'monthly') startDate.setMonth(endDate.getMonth() - 1);
    else startDate.setDate(endDate.getDate() - 1);

    // fetch students in section
    const students = await User.find({ section: section, role: 'user' }).select('_id');
    const studentIds = students.map(s => s._id);
    if (!studentIds.length) {
      return res.status(200).json({
        success: true,
        data: { activity: [], social: [], health: [] }
      });
    }

    // aggregate by category + activity + afterEmotion
    const agg = await MoodLog.aggregate([
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
            activity: '$activity',
            afterEmotion: '$afterEmotion'
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      {
        $group: {
          _id: '$_id.category',
          items: {
            $push: {
              activity: '$_id.activity',
              afterEmotion: '$_id.afterEmotion',
              count: '$count'
            }
          }
        }
      }
    ]);

    // helper to format activity keys
    const fmtActivity = (a) => {
      if (!a) return '';
      return String(a).replace(/-/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase());
    };

    const categories = { activity: [], social: [], health: [] };
    agg.forEach(group => {
      const cat = String(group._id || '').toLowerCase();
      const out = (group.items || []).map(it => ({
        message: `Students from section ${section} felt ${it.afterEmotion || 'unspecified'}${it.activity ? ` because of ${fmtActivity(it.activity)}` : ''}`,
        count: it.count,
        activity: it.activity || null,
        afterEmotion: it.afterEmotion || null
      }));
      if (categories[cat]) categories[cat] = out;
    });

    // ensure categories exist even if empty
    Object.keys(categories).forEach(k => { if (!categories[k]) categories[k] = []; });

    res.status(200).json({
      success: true,
      data: {
        activity: categories.activity,
        social: categories.social,
        health: categories.health
      }
    });
  } catch (error) {
    console.error('Error fetching aggregated recommendations:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getPastSectionRecommendations = async (req, res) => {
  try {
    const { section } = req.params;
    const recs = await TeacherRecommendation.find({ section }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, data: recs });
  } catch (error) {
    console.error('Error fetching past recommendations:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.provideRecommendationFeedback = async (req, res) => {
  try {
    const { recommendationId, recIdx } = req.params;
    const { feedback } = req.body;

    const rec = await TeacherRecommendation.findById(recommendationId);
    if (!rec) {
      return res.status(404).json({ success: false, message: 'Recommendation not found.' });
    }
    if (!rec.recommendations[recIdx]) {
      return res.status(404).json({ success: false, message: 'Suggestion not found.' });
    }

    rec.recommendations[recIdx].feedback = rec.recommendations[recIdx].feedback || [];
    rec.recommendations[recIdx].feedback.push({ text: feedback });
    await rec.save();

    res.status(200).json({ success: true, message: 'Feedback saved.' });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};


exports.getRecommendationFeedback = async (req, res) => {
  try {
    const { recommendationId, recIdx } = req.params;
    const rec = await TeacherRecommendation.findById(recommendationId).select('recommendations');
    if (!rec || !rec.recommendations[recIdx]) {
      return res.status(404).json({ success: false, message: 'Suggestion not found.' });
    }
    res.status(200).json({ success: true, data: rec.recommendations[recIdx].feedback || [] });
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
}; 

// Update feedback (PUT)
exports.editRecommendationFeedback = async (req, res) => {
  try {
    const { recommendationId, recIdx, fbIdx } = req.params;
    const { text } = req.body;
    const rec = await TeacherRecommendation.findById(recommendationId);
    if (!rec || !rec.recommendations[recIdx] || !rec.recommendations[recIdx].feedback[fbIdx]) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }
    rec.recommendations[recIdx].feedback[fbIdx].text = text;
    await rec.save();
    res.status(200).json({ success: true, message: 'Feedback updated.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Delete feedback (DELETE)
exports.deleteRecommendationFeedback = async (req, res) => {
  try {
    const { recommendationId, recIdx, fbIdx } = req.params;
    const rec = await TeacherRecommendation.findById(recommendationId);
    if (!rec || !rec.recommendations[recIdx] || !rec.recommendations[recIdx].feedback[fbIdx]) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }
    rec.recommendations[recIdx].feedback.splice(fbIdx, 1);
    await rec.save();
    res.status(200).json({ success: true, message: 'Feedback deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Set effectiveness (PUT)
exports.setFeedbackEffective = async (req, res) => {
  try {
    const { recommendationId, recIdx, fbIdx } = req.params;
    const { effective } = req.body;
    
    const rec = await TeacherRecommendation.findById(recommendationId);
    if (!rec || !rec.recommendations[recIdx] || !rec.recommendations[recIdx].feedback[fbIdx]) {
      return res.status(404).json({ success: false, message: 'Feedback not found.' });
    }
    
    rec.recommendations[recIdx].feedback[fbIdx].effective = effective;
    await rec.save();
    
    res.status(200).json({ success: true, message: 'Feedback effectiveness updated.' });
  } catch (error) {
    console.error('Error saving feedback effectiveness:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};