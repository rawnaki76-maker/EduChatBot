const db = require('../config/db');

/**
 * Get comprehensive progress analytics for a student (for Recharts)
 */
const getStudentProgressAnalytics = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user.student_id;

    if (!studentId) {
      return res.status(400).json({ success: false, message: 'Student ID required.' });
    }

    // 1. Profile and basic info
    const [profiles] = await db.query(
      `SELECT sp.*, u.name, u.email
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.user_id
       WHERE sp.student_id = ?`,
      [studentId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const profile = profiles[0];

    // 2. CGPA Trend by semester
    // Calculate semester-by-semester GPA from completed enrollments
    const [enrollments] = await db.query(
      `SELECT er.grade, er.semester, c.credits, c.level, c.code, c.title
       FROM enrollment_records er
       JOIN courses c ON er.course_id = c.course_id
       WHERE er.student_id = ?
       ORDER BY er.enrolled_at ASC, er.semester ASC`,
      [studentId]
    );

    // Map letter grades to grade points
    const gradePointsMap = {
      'A+': 4.00, 'A': 3.75, 'A-': 3.50,
      'B+': 3.25, 'B': 3.00, 'B-': 2.75,
      'C+': 2.50, 'C': 2.25, 'D': 2.00, 'F': 0.00
    };

    const semesterMap = {};
    for (const record of enrollments) {
      if (!record.grade || record.grade === 'IP' || record.grade === 'In Progress') continue;

      const sem = record.semester || 'Other';
      if (!semesterMap[sem]) {
        semesterMap[sem] = { totalPoints: 0, totalCredits: 0, coursesCount: 0 };
      }

      const points = gradePointsMap[record.grade] !== undefined ? gradePointsMap[record.grade] : 3.00;
      const credits = parseFloat(record.credits) || 3.0;

      semesterMap[sem].totalPoints += points * credits;
      semesterMap[sem].totalCredits += credits;
      semesterMap[sem].coursesCount += 1;
    }

    const cgpaTrend = Object.keys(semesterMap).map(sem => ({
      semester: sem,
      gpa: parseFloat((semesterMap[sem].totalPoints / semesterMap[sem].totalCredits).toFixed(2)),
      credits: semesterMap[sem].totalCredits,
      courses: semesterMap[sem].coursesCount
    }));

    // If trend has only 1 or 0 points, provide initial baseline
    if (cgpaTrend.length === 0) {
      cgpaTrend.push({
        semester: `Semester ${profile.semester}`,
        gpa: parseFloat(profile.cgpa) || 3.5,
        credits: parseFloat(profile.completed_credits) || 15,
        courses: 5
      });
    }

    // 3. Assignment Submissions breakdown
    const [submissions] = await db.query(
      `SELECT s.status, s.marks, a.total_marks, a.title AS assignment_title, c.code AS course_code
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.assignment_id
       JOIN courses c ON a.course_id = c.course_id
       WHERE s.student_id = ?`,
      [studentId]
    );

    const submissionStats = {
      graded: submissions.filter(s => s.status === 'graded').length,
      submitted: submissions.filter(s => s.status === 'submitted').length,
      pending: submissions.filter(s => s.status === 'pending').length,
      late: submissions.filter(s => s.status === 'late').length,
      total: submissions.length
    };

    const submissionChartData = [
      { name: 'Graded', count: submissionStats.graded, fill: '#10B981' },
      { name: 'Submitted', count: submissionStats.submitted, fill: '#3B82F6' },
      { name: 'Pending', count: submissionStats.pending, fill: '#F59E0B' },
      { name: 'Late', count: submissionStats.late, fill: '#EF4444' }
    ];

    // 4. Course Level / Completion Progress
    const levelMap = { 1: 0, 2: 0, 3: 0, 4: 0 };
    enrollments.forEach(e => {
      if (e.grade && e.grade !== 'F' && e.grade !== 'IP') {
        const lvl = e.level || 1;
        levelMap[lvl] = (levelMap[lvl] || 0) + (parseFloat(e.credits) || 3.0);
      }
    });

    const levelProgress = [
      { level: 'Year 1 (Level 1)', completed: levelMap[1], required: 36, percentage: Math.min(100, Math.round((levelMap[1] / 36) * 100)) },
      { level: 'Year 2 (Level 2)', completed: levelMap[2], required: 36, percentage: Math.min(100, Math.round((levelMap[2] / 36) * 100)) },
      { level: 'Year 3 (Level 3)', completed: levelMap[3], required: 36, percentage: Math.min(100, Math.round((levelMap[3] / 36) * 100)) },
      { level: 'Year 4 (Level 4)', completed: levelMap[4], required: 32, percentage: Math.min(100, Math.round((levelMap[4] / 32) * 100)) }
    ];

    res.json({
      success: true,
      student: {
        name: profile.name,
        cgpa: parseFloat(profile.cgpa),
        semester: profile.semester,
        completedCredits: parseFloat(profile.completed_credits),
        totalRequiredCredits: 140.0,
        remainingCredits: Math.max(0, 140.0 - parseFloat(profile.completed_credits))
      },
      cgpaTrend,
      submissionStats,
      submissionChartData,
      levelProgress
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin System Analytics & User Management
 */
const getAdminAnalytics = async (req, res, next) => {
  try {
    // Total users breakdown
    const [userCounts] = await db.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );
    const usersByRole = userCounts.reduce((acc, row) => {
      acc[row.role] = row.count;
      return acc;
    }, { student: 0, teacher: 0, admin: 0 });

    // Chat statistics
    const [chatStats] = await db.query(
      `SELECT 
         COUNT(*) as total_chats,
         SUM(CASE WHEN escalated = 1 THEN 1 ELSE 0 END) as escalated_chats,
         SUM(CASE WHEN escalated = 0 THEN 1 ELSE 0 END) as resolved_chats
       FROM chat_logs`
    );

    // Escalations breakdown
    const [escalationStats] = await db.query(
      'SELECT status, COUNT(*) as count FROM escalations GROUP BY status'
    );

    // Total courses & materials
    const [courseCount] = await db.query('SELECT COUNT(*) as count FROM courses');
    const [materialCount] = await db.query('SELECT COUNT(*) as count FROM materials');
    const [chunkCount] = await db.query('SELECT COUNT(*) as count FROM material_chunks');

    // Recent user list
    const [users] = await db.query(
      'SELECT user_id, name, email, role, verified, created_at FROM users ORDER BY created_at DESC LIMIT 20'
    );

    res.json({
      success: true,
      metrics: {
        total_users: Object.values(usersByRole).reduce((a, b) => a + b, 0),
        users_by_role: usersByRole,
        total_chats: chatStats[0].total_chats || 0,
        resolved_chats: chatStats[0].resolved_chats || 0,
        escalated_chats: chatStats[0].escalated_chats || 0,
        resolution_rate: chatStats[0].total_chats > 0
          ? ((chatStats[0].resolved_chats / chatStats[0].total_chats) * 100).toFixed(1)
          : '100.0',
        total_courses: courseCount[0].count,
        total_materials: materialCount[0].count,
        indexed_chunks: chunkCount[0].count
      },
      escalation_status: escalationStats,
      users
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Admin: Toggle user verification (e.g. approve advisor/teacher)
 */
const toggleUserVerification = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { verified } = req.body;

    await db.query('UPDATE users SET verified = ? WHERE user_id = ?', [verified ? 1 : 0, userId]);

    res.json({
      success: true,
      message: `User verification updated to ${verified ? 'verified' : 'unverified'}.`
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getStudentProgressAnalytics,
  getAdminAnalytics,
  toggleUserVerification
};
