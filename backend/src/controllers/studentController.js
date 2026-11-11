const db = require('../config/db');

/**
 * Get the current student's full profile and enrollment history
 */
const getMyProfile = async (req, res, next) => {
  try {
    const studentId = req.user.student_id;

    if (!studentId) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const [profiles] = await db.query(
      `SELECT sp.*, u.name, u.email, u.verified
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.user_id
       WHERE sp.student_id = ?`,
      [studentId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const profile = profiles[0];

    // Fetch enrollments with course details
    const [enrollments] = await db.query(
      `SELECT er.enrollment_id, er.grade, er.semester, er.enrolled_at,
              c.course_id, c.code, c.title, c.credits, c.level, c.prerequisite_code
       FROM enrollment_records er
       JOIN courses c ON er.course_id = c.course_id
       WHERE er.student_id = ?
       ORDER BY er.semester DESC, c.code ASC`,
      [studentId]
    );

    // Degree requirements for GSTU CSE: 140 total credits
    const DEGREE_CREDIT_REQUIREMENT = 140.0;
    const completedCredits = parseFloat(profile.completed_credits) || 0.0;
    const remainingCredits = Math.max(0, DEGREE_CREDIT_REQUIREMENT - completedCredits);

    res.json({
      success: true,
      profile: {
        ...profile,
        total_required_credits: DEGREE_CREDIT_REQUIREMENT,
        remaining_credits: remainingCredits,
        enrollments
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get student profile by ID (for teachers and admins)
 */
const getStudentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [profiles] = await db.query(
      `SELECT sp.*, u.name, u.email, u.verified
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.user_id
       WHERE sp.student_id = ? OR sp.user_id = ?`,
      [id, id]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ success: false, message: 'Student profile not found.' });
    }

    const profile = profiles[0];

    const [enrollments] = await db.query(
      `SELECT er.enrollment_id, er.grade, er.semester, er.enrolled_at,
              c.course_id, c.code, c.title, c.credits, c.level, c.prerequisite_code
       FROM enrollment_records er
       JOIN courses c ON er.course_id = c.course_id
       WHERE er.student_id = ?
       ORDER BY er.semester DESC, c.code ASC`,
      [profile.student_id]
    );

    const [submissions] = await db.query(
      `SELECT s.*, a.title AS assignment_title, a.deadline, a.total_marks, c.code AS course_code
       FROM submissions s
       JOIN assignments a ON s.assignment_id = a.assignment_id
       JOIN courses c ON a.course_id = c.course_id
       WHERE s.student_id = ?`,
      [profile.student_id]
    );

    res.json({
      success: true,
      profile: {
        ...profile,
        enrollments,
        submissions
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * List all students (for teachers/admins)
 */
const getAllStudents = async (req, res, next) => {
  try {
    const [students] = await db.query(
      `SELECT sp.*, u.name, u.email, u.verified
       FROM student_profiles sp
       JOIN users u ON sp.user_id = u.user_id
       ORDER BY sp.semester ASC, sp.student_reg_no ASC`
    );

    res.json({
      success: true,
      count: students.length,
      students
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getMyProfile,
  getStudentById,
  getAllStudents
};
