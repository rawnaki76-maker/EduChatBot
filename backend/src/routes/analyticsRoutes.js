const express = require('express');
const router = express.Router();
const {
  getStudentProgressAnalytics,
  getAdminAnalytics,
  toggleUserVerification
} = require('../controllers/analyticsController');
const { authenticateToken, authorizeRoles } = require('../middleware/auth');

// Student progress analytics (Student gets own, Teacher/Admin can view any student)
router.get('/progress/:studentId?', authenticateToken, getStudentProgressAnalytics);

// Admin dashboard analytics
router.get('/admin', authenticateToken, authorizeRoles('admin'), getAdminAnalytics);

// Admin toggle user verification
router.patch('/users/:userId/verify', authenticateToken, authorizeRoles('admin'), toggleUserVerification);

module.exports = router;
