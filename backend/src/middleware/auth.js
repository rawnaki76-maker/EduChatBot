const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'edubot_super_secret_jwt_key_2026_gstu_cse';

/**
 * Middleware to authenticate requests using JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);

    // Fetch user details from database to ensure user still exists and get latest verified status
    const [users] = await db.query(
      'SELECT user_id, name, email, role, verified FROM users WHERE user_id = ?',
      [decoded.user_id]
    );

    if (users.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid token: user not found.' });
    }

    const user = users[0];

    // If student, attach student_id and reg_no
    if (user.role === 'student') {
      const [profiles] = await db.query(
        'SELECT student_id, cgpa, department, completed_credits, semester, student_reg_no FROM student_profiles WHERE user_id = ?',
        [user.user_id]
      );
      if (profiles.length > 0) {
        user.student_id = profiles[0].student_id;
        user.profile = profiles[0];
      }
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token expired. Please login again.' });
    }
    return res.status(403).json({ success: false, message: 'Invalid authentication token.' });
  }
};

/**
 * Middleware to enforce role-based access control
 * @param  {...string} allowedRoles
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: role '${req.user ? req.user.role : 'unauthenticated'}' is not authorized for this resource.`
      });
    }
    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};
