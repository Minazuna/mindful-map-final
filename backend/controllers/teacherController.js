const User = require('../models/User');
const MoodLog = require('../models/MoodLog');
const TeacherRecommendation = require('../models/TeacherRecommendation');
const StudentSeverity = require('../models/StudentSeverity');
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

// Update mood log observation
exports.updateMoodLogObservation = async (req, res) => {
  try {
    const { logId } = req.params;
    const { teacherObservation, observationMatch } = req.body;
    const teacher = await User.findById(req.user._id);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    const moodLog = await MoodLog.findById(logId).populate('user');
    if (!moodLog) {
      return res.status(404).json({ success: false, message: 'Mood log not found.' });
    }

    // Verify teacher has access to this student's section
    if (!teacher.assignedSections || !teacher.assignedSections.includes(moodLog.user.section)) {
      return res.status(403).json({ success: false, message: 'Access denied to this student.' });
    }

    // Check if log is older than 2 weeks
    const twoWeeksAgo = moment().subtract(2, 'weeks');
    const logDate = moment(moodLog.date);

    if (logDate.isBefore(twoWeeksAgo)) {
      return res.status(403).json({ 
        success: false, 
        message: 'Observations can only be added or edited for logs from the last 2 weeks.' 
      });
    }

    moodLog.teacherObservation = teacherObservation;
    moodLog.observationMatch = observationMatch;
    moodLog.observationUpdatedAt = new Date();

    await moodLog.save();

    res.status(200).json({
      success: true,
      message: 'Observation updated successfully',
      data: moodLog
    });
  } catch (error) {
    console.error('Error updating mood log observation:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Delete mood log observation
exports.deleteMoodLogObservation = async (req, res) => {
  try {
    const { logId } = req.params;
    const teacher = await User.findById(req.user._id);

    if (!teacher || teacher.role !== 'teacher') {
      return res.status(404).json({ success: false, message: 'Teacher not found.' });
    }

    const moodLog = await MoodLog.findById(logId).populate('user');
    if (!moodLog) {
      return res.status(404).json({ success: false, message: 'Mood log not found.' });
    }

    // Verify teacher has access to this student's section
    if (!teacher.assignedSections || !teacher.assignedSections.includes(moodLog.user.section)) {
      return res.status(403).json({ success: false, message: 'Access denied to this student.' });
    }

    moodLog.teacherObservation = null;
    moodLog.observationMatch = null;
    moodLog.observationUpdatedAt = null;

    await moodLog.save();

    res.status(200).json({
      success: true,
      message: 'Observation deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting mood log observation:', error);
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

const CONCERNING_KEYWORDS = [
  'depression', 'suicide', 'hopeless', 'worthless', 'self-harm', 'tired', 
  'overwhelmed', 'empty', 'give up', 'kill myself', 'no point', 'useless', 
  'pakamatay', 'magpakamatay', 'gusto ko na mamatay', 'ayoko na', 'ayaw ko na', 
  'laslas', 'maglaslas', 'i wanna kill myself', 'cut myself'
];

function hasConcerningKeyword(text) {
  if (!text) return false;
  const lower = text.toLowerCase();
  return CONCERNING_KEYWORDS.some(word => lower.includes(word));
}

function getSeverityLevel(score) {
  if (score >= 5) return 'high';
  if (score >= 3) return 'moderate';
  return 'low';
}

// Compute and save severity for all students in a section
exports.computeSectionSeverity = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const daysWindow = 7;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - daysWindow);

    const students = await User.find({ section: sectionId, role: 'user' }).select('_id');
    if (!students.length) {
      return res.status(200).json({ success: true, message: 'No students in section.' });
    }

    const studentIds = students.map(s => s._id);
    const moodLogs = await MoodLog.find({ user: { $in: studentIds }, date: { $gte: sinceDate } });

    const allScores = moodLogs.map(l => l.afterIntensity);
    const avgScore = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
    const stdDev = allScores.length
      ? Math.sqrt(allScores.reduce((a, b) => a + Math.pow(b - avgScore, 2), 0) / allScores.length)
      : 0;

    for (const student of students) {
      const logs = moodLogs.filter(l => l.user.equals(student._id));
      const negativeLogs = logs.filter(l => l.afterValence === 'negative');
      const concerningLogs = negativeLogs.filter(l => hasConcerningKeyword(l.afterReason));
      const recentMoodScores = logs.map(l => l.afterIntensity);

      let moodScoreDrop = 0;
      if (logs.length >= 6) {
        const sorted = logs.sort((a, b) => b.date - a.date);
        const last3 = sorted.slice(0, 3).map(l => l.afterIntensity);
        const prev3 = sorted.slice(3, 6).map(l => l.afterIntensity);
        moodScoreDrop = (prev3.reduce((a, b) => a + b, 0) / 3) - (last3.reduce((a, b) => a + b, 0) / 3);
      }

      const studentAvg = recentMoodScores.length ? recentMoodScores.reduce((a, b) => a + b, 0) / recentMoodScores.length : 0;
      const isOutlier = stdDev > 0 && studentAvg < avgScore - 1.5 * stdDev;

      let riskScore = negativeLogs.length + concerningLogs.length * 2;
      if (moodScoreDrop > 1) riskScore += 2;
      if (isOutlier) riskScore += 1;

      const severityLevel = getSeverityLevel(riskScore);

      // Preserve teacher monitoring fields
      const existing = await StudentSeverity.findOne({ studentId: student._id, sectionId });
      const monitoringStatus = existing?.monitoringStatus || 'pending_review';
      const teacherObservation = existing?.teacherObservation || '';
      const lastUpdatedBy = existing?.lastUpdatedBy;
      const lastStatusUpdate = existing?.lastStatusUpdate;

      await StudentSeverity.findOneAndUpdate(
        { studentId: student._id, sectionId },
        {
          studentId: student._id,
          sectionId,
          severityLevel,
          riskScore,
          negativeMoodCount: negativeLogs.length,
          concerningKeywords: concerningLogs.map(l => l.afterReason),
          recentMoodLogs: logs.slice(0, 5).map(l => ({
            moodLogId: l._id,
            moodScore: l.afterIntensity,
            reason: l.afterReason,
            date: l.date
          })),
          moodScoreDrop,
          isOutlier,
          lastEvaluated: new Date(),
          monitoringStatus,
          teacherObservation,
          lastUpdatedBy,
          lastStatusUpdate
        },
        { upsert: true, new: true }
      );
    }

    res.status(200).json({ success: true, message: 'Severity computed for section.' });
  } catch (error) {
    console.error('Error computing section severity:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.updateSeverityStatus = async (req, res) => {
  try {
    const { studentId, sectionId, monitoringStatus, teacherObservation } = req.body;
    const teacherId = req.user._id;

    const teacher = await User.findById(teacherId);
    if (!teacher || teacher.role !== 'teacher') {
      return res.status(403).json({ success: false, message: 'Only teachers can update monitoring status.' });
    }

    const severity = await StudentSeverity.findOne({ studentId, sectionId });
    if (!severity) return res.status(404).json({ success: false, message: 'Student severity record not found.' });

    // Prevent reverting status backward
    const statusOrder = ['pending_review', 'monitoring', 'reviewed', 'resolved'];
    if (statusOrder.indexOf(monitoringStatus) < statusOrder.indexOf(severity.monitoringStatus)) {
      return res.status(400).json({ success: false, message: 'Cannot revert status to a previous state.' });
    }

    // Require observation if status is changing
    if (
      monitoringStatus &&
      monitoringStatus !== severity.monitoringStatus &&
      (!teacherObservation || teacherObservation.trim() === '')
    ) {
      return res.status(400).json({
        success: false,
        message: 'Please provide an observation/note when changing the monitoring status.'
      });
    }

    // --- Add to statusHistory before updating ---
    if (
      severity.monitoringStatus !== undefined &&
      severity.teacherObservation !== undefined &&
      (monitoringStatus !== severity.monitoringStatus || teacherObservation !== severity.teacherObservation)
    ) {
      severity.statusHistory = severity.statusHistory || [];
      severity.statusHistory.push({
        status: severity.monitoringStatus,
        observation: severity.teacherObservation,
        updatedBy: severity.lastUpdatedBy || teacherId,
        updatedAt: severity.lastStatusUpdate || new Date()
      });
    }

    severity.monitoringStatus = monitoringStatus || severity.monitoringStatus;
    severity.teacherObservation = teacherObservation ?? severity.teacherObservation;
    severity.lastUpdatedBy = teacherId;
    severity.lastStatusUpdate = new Date();

    await severity.save();

    res.status(200).json({ success: true, message: 'Monitoring status updated.', data: severity });
  } catch (error) {
    console.error('Error updating monitoring status:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getSeverityStatusHistory = async (req, res) => {
  try {
    const { studentId, sectionId } = req.query;
    const severity = await StudentSeverity.findOne({ studentId, sectionId })
      .populate('statusHistory.updatedBy', 'firstName lastName email');
    if (!severity) {
      return res.status(404).json({ success: false, message: 'No severity data for student.' });
    }
    res.status(200).json({ success: true, data: severity.statusHistory || [] });
  } catch (error) {
    console.error('Error fetching status history:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get all students' severity in a section
exports.getSectionSeverity = async (req, res) => {
  try {
    const { sectionId } = req.params;
    const severities = await StudentSeverity.find({ sectionId })
      .populate('studentId', 'firstName lastName email avatar section')
      .sort({ severityLevel: -1, riskScore: -1 });
    res.status(200).json({ success: true, data: severities });
  } catch (error) {
    console.error('Error fetching section severity:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// Get severity details for a student
exports.getStudentSeverity = async (req, res) => {
  try {
    const { studentId } = req.params;
    const severity = await StudentSeverity.findOne({ studentId })
      .populate('studentId', 'firstName lastName email avatar section');
    if (!severity) {
      return res.status(404).json({ success: false, message: 'No severity data for student.' });
    }
    res.status(200).json({ success: true, data: severity });
  } catch (error) {
    console.error('Error fetching student severity:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getStudentSeverityDetails = async (req, res) => {
  try {
    const { studentId, sectionId } = req.query;

    // Find severity record for monitoring status/notes/etc.
    const severity = await StudentSeverity.findOne({ studentId, sectionId })
      .populate('studentId', 'firstName lastName email avatar section');
    if (!severity) {
      return res.status(404).json({ success: false, message: 'No severity data for student.' });
    }

    // Return the stored arrays and other fields
    res.status(200).json({
      success: true,
      data: severity
    });
  } catch (error) {
    console.error('Error fetching student severity details:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};