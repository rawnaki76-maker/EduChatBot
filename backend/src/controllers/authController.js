const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'edubot_super_secret_jwt_key_2026_gstu_cse';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', department = 'CSE', student_reg_no } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required.' });
    }

    // Check if user already exists
    const [existing] = await db.query('SELECT user_id FROM users WHERE email = ?', [email]);
    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: 'Email is already registered.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    // Auto-verify students; teachers may need admin approval in Increment 5
    const verified = role === 'student' ? 1 : 0;

    const [result] = await db.query(
      'INSERT INTO users (name, email, password, role, verified) VALUES (?, ?, ?, ?, ?)',
      [name, email, hashedPassword, role, verified]
    );

    const userId = result.insertId;

    // If role is student, create student_profile
    let studentId = null;
    if (role === 'student') {
      const regNo = student_reg_no || `GSTU${Date.now().toString().slice(-6)}`;
      const [profileResult] = await db.query(
        'INSERT INTO student_profiles (user_id, cgpa, department, completed_credits, semester, student_reg_no) VALUES (?, 0.00, ?, 0.0, 1, ?)',
        [userId, department, regNo]
      );
      studentId = profileResult.insertId;
    }

    const token = jwt.sign({ user_id: userId, role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        user_id: userId,
        name,
        email,
        role,
        verified: Boolean(verified),
        student_id: studentId
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Login user
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let studentProfile = null;
    if (user.role === 'student') {
      const [profiles] = await db.query(
        'SELECT student_id, cgpa, department, completed_credits, semester, student_reg_no FROM student_profiles WHERE user_id = ?',
        [user.user_id]
      );
      if (profiles.length > 0) {
        studentProfile = profiles[0];
      }
    }

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        verified: Boolean(user.verified),
        student_id: studentProfile ? studentProfile.student_id : null,
        profile: studentProfile
      }
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Get current logged in user details
 */
const getMe = async (req, res, next) => {
  try {
    res.json({
      success: true,
      user: req.user
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login,
  getMe
};
