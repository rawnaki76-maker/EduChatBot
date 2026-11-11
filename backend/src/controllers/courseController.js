const db = require('../config/db');

/**
 * Get all courses with optional filters (department, level, prerequisite)
 */
const getCourses = async (req, res, next) => {
  try {
    const { department, level, prerequisite, search } = req.query;

    let query = `
      SELECT c.*,
             p.title AS prerequisite_title,
             (SELECT COUNT(*) FROM materials m WHERE m.course_id = c.course_id) AS materials_count
      FROM courses c
      LEFT JOIN courses p ON c.prerequisite_code = p.code
      WHERE 1=1
    `;
    const params = [];

    if (department) {
      query += ' AND c.department = ?';
      params.push(department);
    }

    if (level) {
      query += ' AND c.level = ?';
      params.push(parseInt(level, 10));
    }

    if (prerequisite) {
      if (prerequisite === 'none' || prerequisite === 'null') {
        query += ' AND c.prerequisite_code IS NULL';
      } else {
        query += ' AND c.prerequisite_code = ?';
        params.push(prerequisite);
      }
    }

    if (search) {
      query += ' AND (c.code LIKE ? OR c.title LIKE ? OR c.description LIKE ?)';
      const term = `%${search}%`;
      params.push(term, term, term);
    }

    query += ' ORDER BY c.level ASC, c.code ASC';

    const [courses] = await db.query(query, params);

    res.json({
      success: true,
      count: courses.length,
      courses
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get a course by code or id
 */
const getCourseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const [courses] = await db.query(
      `SELECT c.*, p.title as prerequisite_title 
       FROM courses c
       LEFT JOIN courses p ON c.prerequisite_code = p.code
       WHERE c.course_id = ? OR c.code = ?`,
      [id, id]
    );

    if (courses.length === 0) {
      return res.status(404).json({ success: false, message: 'Course not found.' });
    }

    res.json({
      success: true,
      course: courses[0]
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new course (Admin only)
 */
const createCourse = async (req, res, next) => {
  try {
    const { code, title, credits = 3.0, department = 'CSE', level = 1, prerequisite_code = null, description = '' } = req.body;

    if (!code || !title) {
      return res.status(400).json({ success: false, message: 'Course code and title are required.' });
    }

    const [existing] = await db.query('SELECT course_id FROM courses WHERE code = ?', [code]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: `Course ${code} already exists.` });
    }

    const [result] = await db.query(
      'INSERT INTO courses (code, title, credits, department, level, prerequisite_code, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [code.toUpperCase(), title, credits, department, level, prerequisite_code ? prerequisite_code.toUpperCase() : null, description]
    );

    res.status(201).json({
      success: true,
      message: 'Course created successfully.',
      course_id: result.insertId
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  getCourses,
  getCourseById,
  createCourse
};
