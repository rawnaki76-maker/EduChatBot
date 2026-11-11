const db = require('../config/db');

/**
 * Advisor creates an available advising time slot
 */
const createSlot = async (req, res, next) => {
  try {
    const advisorId = req.user.user_id;
    const { start_time, end_time } = req.body;

    if (!start_time || !end_time) {
      return res.status(400).json({ success: false, message: 'start_time and end_time are required.' });
    }

    const [result] = await db.query(
      'INSERT INTO advisor_slots (advisor_id, start_time, end_time, is_booked) VALUES (?, ?, ?, 0)',
      [advisorId, new Date(start_time), new Date(end_time)]
    );

    res.status(201).json({
      success: true,
      message: 'Advisor slot created successfully.',
      slot_id: result.insertId
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get available advising slots
 */
const getAvailableSlots = async (req, res, next) => {
  try {
    const { advisor_id } = req.query;

    let sql = `
      SELECT s.*, u.name AS advisor_name, u.email AS advisor_email
      FROM advisor_slots s
      JOIN users u ON s.advisor_id = u.user_id
      WHERE s.is_booked = 0 AND s.start_time > NOW()
    `;
    const params = [];

    if (advisor_id) {
      sql += ' AND s.advisor_id = ?';
      params.push(advisor_id);
    }

    sql += ' ORDER BY s.start_time ASC';

    const [slots] = await db.query(sql, params);

    res.json({
      success: true,
      count: slots.length,
      slots
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Student books an advising slot
 */
const bookSlot = async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    const studentId = req.user.student_id;
    const { slot_id, summary } = req.body;

    if (!studentId) {
      return res.status(403).json({ success: false, message: 'Only students can book advising sessions.' });
    }

    if (!slot_id) {
      return res.status(400).json({ success: false, message: 'slot_id is required.' });
    }

    await connection.beginTransaction();

    // Check slot availability
    const [slots] = await connection.query(
      'SELECT * FROM advisor_slots WHERE slot_id = ? FOR UPDATE',
      [slot_id]
    );

    if (slots.length === 0) {
      await connection.rollback();
      return res.status(404).json({ success: false, message: 'Slot not found.' });
    }

    const slot = slots[0];
    if (slot.is_booked) {
      await connection.rollback();
      return res.status(409).json({ success: false, message: 'This slot has already been booked by another student.' });
    }

    // Mark slot as booked
    await connection.query('UPDATE advisor_slots SET is_booked = 1 WHERE slot_id = ?', [slot_id]);

    // Create advising session record
    const [sessionResult] = await connection.query(
      'INSERT INTO advising_sessions (student_id, advisor_id, slot_id, status, summary) VALUES (?, ?, ?, ?, ?)',
      [studentId, slot.advisor_id, slot_id, 'pending', summary || 'Academic Course Advising & Degree Planning']
    );

    await connection.commit();

    // Fetch advisor details for ticket confirmation
    const [advisors] = await db.query('SELECT name, email FROM users WHERE user_id = ?', [slot.advisor_id]);
    const advisor = advisors[0];

    res.status(201).json({
      success: true,
      message: 'Advising session booked successfully!',
      ticket: {
        session_id: sessionResult.insertId,
        slot_id,
        advisor_name: advisor?.name,
        advisor_email: advisor?.email,
        start_time: slot.start_time,
        end_time: slot.end_time,
        status: 'pending',
        summary: summary || 'Academic Course Advising'
      }
    });
  } catch (err) {
    await connection.rollback();
    next(err);
  } finally {
    connection.release();
  }
};

/**
 * Get advising sessions (Queue for Advisor or History for Student)
 */
const getSessions = async (req, res, next) => {
  try {
    const user = req.user;

    let sql = `
      SELECT ses.*, 
             s.start_time, s.end_time,
             adv.name AS advisor_name, adv.email AS advisor_email,
             stu_u.name AS student_name, stu_u.email AS student_email,
             sp.cgpa, sp.department, sp.semester, sp.student_reg_no
      FROM advising_sessions ses
      LEFT JOIN advisor_slots s ON ses.slot_id = s.slot_id
      JOIN users adv ON ses.advisor_id = adv.user_id
      JOIN student_profiles sp ON ses.student_id = sp.student_id
      JOIN users stu_u ON sp.user_id = stu_u.user_id
      WHERE 1=1
    `;
    const params = [];

    if (user.role === 'teacher') {
      sql += ' AND ses.advisor_id = ?';
      params.push(user.user_id);
    } else if (user.role === 'student') {
      sql += ' AND ses.student_id = ?';
      params.push(user.student_id);
    }

    sql += ' ORDER BY ses.created_at DESC';

    const [sessions] = await db.query(sql, params);

    res.json({
      success: true,
      count: sessions.length,
      sessions
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Update session status (approve, reschedule, complete, cancel)
 */
const updateSessionStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, summary } = req.body;

    const [existing] = await db.query('SELECT * FROM advising_sessions WHERE session_id = ?', [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: 'Advising session not found.' });
    }

    let updateSql = 'UPDATE advising_sessions SET status = ?';
    const params = [status];

    if (summary !== undefined) {
      updateSql += ', summary = ?';
      params.push(summary);
    }

    updateSql += ' WHERE session_id = ?';
    params.push(id);

    await db.query(updateSql, params);

    res.json({
      success: true,
      message: `Session updated to status "${status}".`
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get escalations inbox (for teachers and admins)
 */
const getEscalations = async (req, res, next) => {
  try {
    const user = req.user;

    let sql = `
      SELECT e.*, c.message AS student_question, c.response AS bot_response, c.timestamp AS chat_time,
             sp.student_id, sp.cgpa, sp.semester, sp.student_reg_no,
             u.name AS student_name, u.email AS student_email,
             adv.name AS advisor_name
      FROM escalations e
      JOIN chat_logs c ON e.chat_id = c.chat_id
      JOIN student_profiles sp ON c.student_id = sp.student_id
      JOIN users u ON sp.user_id = u.user_id
      LEFT JOIN users adv ON e.advisor_id = adv.user_id
      WHERE 1=1
    `;
    const params = [];

    if (user.role === 'teacher') {
      sql += ' AND (e.advisor_id = ? OR e.advisor_id IS NULL)';
      params.push(user.user_id);
    }

    sql += ' ORDER BY e.created_at DESC';

    const [escalations] = await db.query(sql, params);

    res.json({
      success: true,
      count: escalations.length,
      escalations
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Resolve an escalation
 */
const resolveEscalation = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status = 'resolved', resolution_notes } = req.body;

    await db.query(
      'UPDATE escalations SET status = ?, resolution_notes = ?, resolved_at = NOW() WHERE escalation_id = ?',
      [status, resolution_notes || 'Resolved by faculty advisor', id]
    );

    res.json({
      success: true,
      message: 'Escalation ticket updated.'
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Export full advising summary for a student
 */
const exportAdvisingSummary = async (req, res, next) => {
  try {
    const studentId = req.params.studentId || req.user.student_id;

    const [profiles] = await db.query(
      `SELECT sp.*, u.name, u.email 
       FROM student_profiles sp 
       JOIN users u ON sp.user_id = u.user_id 
       WHERE sp.student_id = ?`,
      [studentId]
    );

    if (profiles.length === 0) {
      return res.status(404).json({ success: false, message: 'Student not found.' });
    }

    const student = profiles[0];

    const [enrollments] = await db.query(
      `SELECT er.grade, er.semester, c.code, c.title, c.credits, c.level
       FROM enrollment_records er
       JOIN courses c ON er.course_id = c.course_id
       WHERE er.student_id = ?
       ORDER BY er.semester DESC, c.code ASC`,
      [studentId]
    );

    const [sessions] = await db.query(
      `SELECT ses.status, ses.summary, ses.created_at, adv.name as advisor_name
       FROM advising_sessions ses
       JOIN users adv ON ses.advisor_id = adv.user_id
       WHERE ses.student_id = ?
       ORDER BY ses.created_at DESC`,
      [studentId]
    );

    const summaryText = `
===================================================================
         GSTU DEPARTMENT OF COMPUTER SCIENCE & ENGINEERING
              OFFICIAL ACADEMIC ADVISING SUMMARY REPORT
===================================================================
Date: ${new Date().toLocaleDateString()}
Student Name: ${student.name}
Registration No: ${student.student_reg_no}
Department: ${student.department}
Current Semester: ${student.semester}
Cumulative GPA: ${student.cgpa} / 4.00
Credits Completed: ${student.completed_credits} / 140.0 Credits
Remaining Credits to Graduate: ${(140.0 - parseFloat(student.completed_credits)).toFixed(1)} Credits

-------------------------------------------------------------------
ACADEMIC COURSE ENROLLMENT HISTORY
-------------------------------------------------------------------
${enrollments.map(e => `[${e.semester}] ${e.code.padEnd(8)} ${e.title.padEnd(40)} ${e.credits} Cr  Grade: ${e.grade || 'In Progress'}`).join('\n')}

-------------------------------------------------------------------
FACULTY ADVISING SESSIONS LOG
-------------------------------------------------------------------
${sessions.length > 0 ? sessions.map(s => `* [${new Date(s.created_at).toLocaleDateString()}] Advisor: ${s.advisor_name} | Status: ${s.status.toUpperCase()}\n  Notes: ${s.summary || 'None'}`).join('\n\n') : 'No formal advising sessions recorded.'}

===================================================================
Generated by EduBot AI Advising System - GSTU CSE Department
===================================================================
`.trim();

    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Content-Disposition', `attachment; filename=advising-summary-${student.student_reg_no}.txt`);
    res.send(summaryText);
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createSlot,
  getAvailableSlots,
  bookSlot,
  getSessions,
  updateSessionStatus,
  getEscalations,
  resolveEscalation,
  exportAdvisingSummary
};
